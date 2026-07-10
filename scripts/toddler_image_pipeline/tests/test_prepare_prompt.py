from __future__ import annotations

import contextlib
import copy
import csv
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest


PIPELINE_DIR = Path(__file__).resolve().parents[1]
MODULE_PATH = PIPELINE_DIR / "prepare_prompt.py"
SPEC = importlib.util.spec_from_file_location("prepare_prompt", MODULE_PATH)
prepare_prompt = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(prepare_prompt)


class WorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.workflow = prepare_prompt.load_workflow()

    def test_workflow_is_valid(self) -> None:
        self.assertEqual(prepare_prompt.validate_workflow(self.workflow), [])

    def test_face_and_body_identity_locks_are_separate(self) -> None:
        face_name, face_prompt = prepare_prompt.render_variation("F02")
        body_name, body_prompt = prepare_prompt.render_variation("B02")
        self.assertIn("F02", face_name)
        self.assertIn("B02", body_name)
        self.assertIn("Image A", face_prompt)
        self.assertNotIn("Image B", face_prompt)
        self.assertIn("Image A", body_prompt)
        self.assertIn("Image B", body_prompt)

    def test_reference_roles_match_variation_group(self) -> None:
        face = prepare_prompt.build_reference_records(
            self.workflow, "variation", "face", require_exists=False
        )
        body = prepare_prompt.build_reference_records(
            self.workflow, "variation", "body", require_exists=False
        )
        self.assertEqual([item["role"] for item in face], ["face_identity"])
        self.assertEqual(
            [item["role"] for item in body],
            ["face_identity", "body_proportion"],
        )

    def test_random_preserves_identity_sensitive_scenario_fields(self) -> None:
        _, source = prepare_prompt.load_variation("B09", self.workflow)
        randomized = prepare_prompt.randomize_variation(source, 123, self.workflow)
        for field in ("id", "type", "expression", "pose_action", "camera_angle", "framing"):
            self.assertEqual(randomized[field], source[field])

    def test_same_id_and_seed_are_deterministic(self) -> None:
        first = prepare_prompt.build_variation("B09", True, 123, self.workflow)
        second = prepare_prompt.build_variation("B09", True, 123, self.workflow)
        self.assertEqual(first["prompt"], second["prompt"])
        self.assertEqual(first["row"], second["row"])

    def test_same_seed_does_not_collapse_different_ids(self) -> None:
        b01 = prepare_prompt.build_variation("B01", True, 123, self.workflow)
        b09 = prepare_prompt.build_variation("B09", True, 123, self.workflow)
        f02 = prepare_prompt.build_variation("F02", True, 123, self.workflow)
        f14 = prepare_prompt.build_variation("F14", True, 123, self.workflow)
        self.assertNotEqual(b01["prompt"], b09["prompt"])
        self.assertNotEqual(f02["prompt"], f14["prompt"])

    def test_randomized_rows_remain_compatible(self) -> None:
        for _, row in prepare_prompt.load_source_rows(self.workflow):
            for seed in range(100):
                randomized = prepare_prompt.randomize_variation(row, seed, self.workflow)
                self.assertEqual(
                    prepare_prompt.validate_variation_consistency(randomized),
                    [],
                    msg=f"{row['id']} seed {seed}",
                )

    def test_empty_scene_presets_use_fallback_pools(self) -> None:
        workflow = copy.deepcopy(self.workflow)
        workflow["scene_presets"] = []
        _, row = prepare_prompt.load_variation("F02", workflow)
        randomized = prepare_prompt.randomize_variation(row, 123, workflow)
        self.assertEqual(randomized["scene_preset"], "none")
        self.assertTrue(randomized["background"])
        self.assertTrue(randomized["micro_scene"])

    def test_random_new_selects_an_existing_compatible_row(self) -> None:
        selected = prepare_prompt.choose_random_base_id("body", 321, self.workflow)
        body_ids = {
            row["id"] for row in self.workflow["variations"]["body"]["rows"]
        }
        self.assertIn(selected, body_ids)
        result = prepare_prompt.build_variation(selected, True, 321, self.workflow)
        self.assertEqual(prepare_prompt.validate_variation_consistency(result["row"]), [])

    def test_validation_rejects_face_lock_that_references_body_anchor(self) -> None:
        workflow = copy.deepcopy(self.workflow)
        workflow["identity_locks"]["face"] += " Use Image B."
        errors = prepare_prompt.validate_workflow(workflow)
        self.assertTrue(any("must not reference Image B" in error for error in errors))

    def test_human_readable_exports_match_workflow(self) -> None:
        prompt_exports = {
            "face_anchor.txt": self.workflow["anchors"]["face"]["prompt"],
            "body_anchor.txt": self.workflow["anchors"]["body"]["prompt"],
            "face_identity_lock.txt": self.workflow["identity_locks"]["face"],
            "body_identity_lock.txt": self.workflow["identity_locks"]["body"],
            "variation_template.txt": self.workflow["templates"]["variation"],
        }
        for filename, expected in prompt_exports.items():
            actual = (PIPELINE_DIR / "prompts" / filename).read_text(
                encoding="utf-8"
            ).strip()
            self.assertEqual(actual, expected)

        for group_name, filename in (
            ("face", "face_sticker_matrix.csv"),
            ("body", "body_sticker_matrix.csv"),
        ):
            with (PIPELINE_DIR / "matrix" / filename).open(
                encoding="utf-8", newline=""
            ) as source:
                exported = list(csv.DictReader(source))
            expected = [
                {field: row[field] for field in prepare_prompt.LEGACY_MATRIX_FIELDS}
                for row in self.workflow["variations"][group_name]["rows"]
            ]
            self.assertEqual(exported, expected)

    def test_run_specs_are_unique_and_reviewable(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output_dir = Path(temporary)
            metadata = {
                "kind": "variation",
                "group": "face",
                "variation_id": "F02",
                "random_seed": None,
                "requested_fields": {},
            }
            with contextlib.redirect_stdout(io.StringIO()):
                _, first_spec = prepare_prompt.write_run(
                    "prompt", "F02 variation", output_dir, [], metadata, False
                )
                _, second_spec = prepare_prompt.write_run(
                    "prompt", "F02 variation", output_dir, [], metadata, False
                )
                prepare_prompt.review_run(
                    first_spec.stem, "approved", "identity stable", None, output_dir
                )
            self.assertNotEqual(first_spec, second_spec)
            reviewed = json.loads(first_spec.read_text(encoding="utf-8"))
            self.assertEqual(reviewed["status"], "approved")
            self.assertEqual(reviewed["review_history"][-1]["reason"], "identity stable")
            manifest_lines = (output_dir / "manifest.jsonl").read_text(
                encoding="utf-8"
            ).splitlines()
            self.assertEqual(len(manifest_lines), 3)

    def test_seed_without_randomize_is_rejected_before_writing(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            stderr = io.StringIO()
            with contextlib.redirect_stderr(stderr):
                with self.assertRaises(SystemExit) as raised:
                    prepare_prompt.main(
                        [
                            "--output-dir",
                            temporary,
                            "variation",
                            "B01",
                            "--seed",
                            "123",
                        ]
                    )
            self.assertEqual(raised.exception.code, 2)
            self.assertEqual(list(Path(temporary).iterdir()), [])


if __name__ == "__main__":
    unittest.main()
