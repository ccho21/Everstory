#!/usr/bin/env python3
"""Prepare and audit prompts for the API-free Codex create-image workflow."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import random
from datetime import datetime, timezone
from pathlib import Path
import re
import string
import sys


BASE_DIR = Path(__file__).resolve().parent
WORKFLOW_JSON = BASE_DIR / "workflow.json"
DEFAULT_OUTPUT_DIR = BASE_DIR / "output" / "prompt_runs"
DEFAULT_SEED_MIN = 1
DEFAULT_SEED_MAX = 999999
VALID_REVIEW_STATUSES = ("approved", "retry", "rejected")
ROW_TEMPLATE_FIELDS = {
    "expression",
    "pose_action",
    "camera_angle",
    "framing",
    "clothing",
    "hairstyle",
    "accessory",
    "background",
    "micro_scene",
}
ROW_REQUIRED_FIELDS = ROW_TEMPLATE_FIELDS | {"id", "type", "status"}
LEGACY_MATRIX_FIELDS = [
    "id",
    "type",
    "expression",
    "pose_action",
    "camera_angle",
    "framing",
    "clothing",
    "hairstyle",
    "accessory",
    "background",
    "micro_scene",
    "status",
]


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        raise SystemExit(f"Missing file: {path}")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


def atomic_write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    token = datetime.now().strftime("%Y%m%d%H%M%S%f")
    temporary = path.with_name(f".{path.name}.{token}.tmp")
    temporary.write_text(value, encoding="utf-8")
    temporary.replace(path)


def flatten_pool_values(pool_group: dict[str, list[str]]) -> list[str]:
    values: list[str] = []
    for item in pool_group.values():
        values.extend(item)
    return values


def variation_group(row_or_id: dict[str, str] | str) -> str:
    row_id = row_or_id if isinstance(row_or_id, str) else row_or_id.get("id", "")
    row_id = row_id.upper()
    if row_id.startswith("F"):
        return "face"
    if row_id.startswith("B"):
        return "body"
    raise SystemExit("Variation id must start with F or B, for example F01 or B02.")


def validate_variation_consistency(row: dict[str, str]) -> list[str]:
    issues: list[str] = []
    row_id = row.get("id", "unknown")
    pose = row.get("pose_action", "").lower()
    framing = row.get("framing", "").lower()
    clothing = row.get("clothing", "").lower()
    accessory = row.get("accessory", "").lower()

    if "hoodie" in pose and "hoodie" not in clothing:
        issues.append(f"{row_id}: hoodie action requires hoodie clothing")
    if "hat" in pose and not any(word in accessory for word in ("hat", "cap")):
        issues.append(f"{row_id}: hat action requires a brimmed hat or cap")
    if "backpack" in pose and "backpack" not in accessory:
        issues.append(f"{row_id}: backpack action requires a backpack")
    if "toy" in pose and "toy" not in accessory:
        issues.append(f"{row_id}: toy action requires a toy accessory")
    if "sunglasses" in pose and "sunglasses" not in accessory:
        issues.append(f"{row_id}: sunglasses action requires sunglasses")
    if "sunglasses-specific" in accessory and "sunglasses" not in pose:
        issues.append(f"{row_id}: sunglasses-specific accessory requires a sunglasses action")

    active = any(word in pose for word in ("walking", "running", "jump"))
    seated = "sitting" in pose
    crouching = "crouching" in pose
    if active and any(word in framing for word in ("seated", "crouching")):
        issues.append(f"{row_id}: active pose conflicts with {framing!r}")
    if seated and "crouching" in framing:
        issues.append(f"{row_id}: seated pose conflicts with crouching framing")
    if crouching and "seated" in framing:
        issues.append(f"{row_id}: crouching pose conflicts with seated framing")
    return issues


def validate_workflow(workflow: dict) -> list[str]:
    errors: list[str] = []
    for key in (
        "anchors",
        "reference_sets",
        "identity_locks",
        "templates",
        "variations",
        "background_presets",
        "fashion_presets",
    ):
        if not isinstance(workflow.get(key), dict):
            errors.append(f"{key}: expected an object")
    if errors:
        return errors

    for anchor_name in ("face", "body"):
        anchor = workflow["anchors"].get(anchor_name)
        if not isinstance(anchor, dict):
            errors.append(f"anchors.{anchor_name}: expected an object")
            continue
        for key in ("name", "path", "prompt"):
            if not isinstance(anchor.get(key), str) or not anchor[key].strip():
                errors.append(f"anchors.{anchor_name}.{key}: expected a non-empty string")

    for group in ("face", "body"):
        lock = workflow["identity_locks"].get(group)
        if not isinstance(lock, str) or not lock.strip():
            errors.append(f"identity_locks.{group}: expected a non-empty string")
    face_lock = workflow["identity_locks"].get("face", "")
    body_lock = workflow["identity_locks"].get("body", "")
    if "Image B" in face_lock:
        errors.append("identity_locks.face must not reference Image B")
    if "Image A" not in face_lock:
        errors.append("identity_locks.face must reference Image A")
    if "Image A" not in body_lock or "Image B" not in body_lock:
        errors.append("identity_locks.body must reference Image A and Image B")

    template = workflow["templates"].get("variation")
    if not isinstance(template, str) or not template.strip():
        errors.append("templates.variation: expected a non-empty string")
        template_fields: set[str] = set()
    else:
        try:
            template_fields = {
                field
                for _, field, _, _ in string.Formatter().parse(template)
                if field
            }
        except ValueError as error:
            errors.append(f"templates.variation: invalid format string: {error}")
            template_fields = set()
    expected_template_fields = ROW_TEMPLATE_FIELDS | {"identity_lock"}
    missing_template_fields = expected_template_fields - template_fields
    unknown_template_fields = template_fields - expected_template_fields
    if missing_template_fields:
        errors.append(
            "templates.variation: missing placeholders "
            + ", ".join(sorted(missing_template_fields))
        )
    if unknown_template_fields:
        errors.append(
            "templates.variation: unknown placeholders "
            + ", ".join(sorted(unknown_template_fields))
        )

    all_ids: list[str] = []
    for group_name, prefix in (("face", "F"), ("body", "B")):
        group = workflow["variations"].get(group_name)
        if not isinstance(group, dict) or not isinstance(group.get("rows"), list):
            errors.append(f"variations.{group_name}.rows: expected a list")
            continue
        for index, row in enumerate(group["rows"]):
            location = f"variations.{group_name}.rows[{index}]"
            if not isinstance(row, dict):
                errors.append(f"{location}: expected an object")
                continue
            missing = ROW_REQUIRED_FIELDS - row.keys()
            if missing:
                errors.append(f"{location}: missing fields {', '.join(sorted(missing))}")
                continue
            row_id = str(row["id"]).upper()
            all_ids.append(row_id)
            if not row_id.startswith(prefix):
                errors.append(f"{location}.id: expected {prefix} prefix, got {row_id}")
            errors.extend(validate_variation_consistency(row))
    if len(all_ids) != len(set(all_ids)):
        duplicates = sorted({item for item in all_ids if all_ids.count(item) > 1})
        errors.append(f"variation ids must be unique: {', '.join(duplicates)}")

    reference_sets = workflow["reference_sets"]
    for run_kind in ("anchor", "variation"):
        kind_sets = reference_sets.get(run_kind)
        if not isinstance(kind_sets, dict):
            errors.append(f"reference_sets.{run_kind}: expected an object")
            continue
        for group_name in ("face", "body"):
            entries = kind_sets.get(group_name)
            if not isinstance(entries, list):
                errors.append(f"reference_sets.{run_kind}.{group_name}: expected a list")
                continue
            for entry in entries:
                if not isinstance(entry, dict):
                    errors.append(
                        f"reference_sets.{run_kind}.{group_name}: expected reference objects"
                    )
                    continue
                if entry.get("anchor") not in workflow["anchors"]:
                    errors.append(
                        f"reference_sets.{run_kind}.{group_name}: unknown anchor "
                        f"{entry.get('anchor')!r}"
                    )
                if not entry.get("role"):
                    errors.append(
                        f"reference_sets.{run_kind}.{group_name}: missing role"
                    )

    fashion = workflow["fashion_presets"]
    for group_name in ("clothing", "accessories", "hairstyles"):
        group = fashion.get(group_name)
        if not isinstance(group, dict) or not flatten_pool_values(group):
            errors.append(f"fashion_presets.{group_name}: expected non-empty pools")

    clothing_categories = set(fashion.get("clothing", {}))
    seen_scene_names: set[str] = set()
    for index, scene in enumerate(workflow.get("scene_presets", [])):
        location = f"scene_presets[{index}]"
        if not isinstance(scene, dict):
            errors.append(f"{location}: expected an object")
            continue
        for field in ("name", "background", "face_micro_scene", "body_micro_scene"):
            if not scene.get(field):
                errors.append(f"{location}.{field}: expected a non-empty value")
        scene_name = scene.get("name")
        if scene_name in seen_scene_names:
            errors.append(f"scene preset names must be unique: {scene_name}")
        seen_scene_names.add(scene_name)
        categories = scene.get("clothing_categories", [])
        if not categories:
            errors.append(f"{location}.clothing_categories: expected at least one category")
        unknown_categories = set(categories) - clothing_categories
        if unknown_categories:
            errors.append(
                f"{location}.clothing_categories: unknown categories "
                + ", ".join(sorted(unknown_categories))
            )

    if not workflow.get("scene_presets"):
        if not flatten_pool_values(workflow["background_presets"]):
            errors.append("background_presets: required when scene_presets is empty")
        for group_name in ("face", "body"):
            micro_scenes = (
                workflow.get("randomization_pools", {})
                .get(group_name, {})
                .get("micro_scenes", [])
            )
            if not micro_scenes:
                errors.append(
                    f"randomization_pools.{group_name}.micro_scenes: "
                    "required when scene_presets is empty"
                )
    return errors


def load_workflow(validate: bool = True) -> dict:
    try:
        workflow = json.loads(read_text(WORKFLOW_JSON))
    except json.JSONDecodeError as error:
        raise SystemExit(f"Invalid JSON in {WORKFLOW_JSON}: {error}")
    if validate:
        errors = validate_workflow(workflow)
        if errors:
            formatted = "\n".join(f"  - {error}" for error in errors)
            raise SystemExit(f"Invalid workflow in {WORKFLOW_JSON}:\n{formatted}")
    return workflow


def slug(value: str) -> str:
    normalized = value.strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    return normalized.strip("-") or "prompt"


def generate_seed() -> int:
    return random.SystemRandom().randint(DEFAULT_SEED_MIN, DEFAULT_SEED_MAX)


def derive_seed(seed: int, namespace: str) -> int:
    material = f"{seed}:{namespace}".encode("utf-8")
    return int.from_bytes(hashlib.sha256(material).digest()[:8], "big")


def unique_run_id(name: str, output_dir: Path) -> str:
    timestamp = datetime.now().strftime("%Y%m%dT%H%M%S_%f")
    base = f"{timestamp}_{slug(name)}"
    candidate = base
    counter = 1
    while (output_dir / f"{candidate}.txt").exists() or (
        output_dir / f"{candidate}.json"
    ).exists():
        candidate = f"{base}_{counter:02d}"
        counter += 1
    return candidate


def write_prompt(prompt: str, name: str, output_dir: Path, also_print: bool) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    run_id = unique_run_id(name, output_dir)
    path = output_dir / f"{run_id}.txt"
    with path.open("x", encoding="utf-8") as destination:
        destination.write(prompt.strip() + "\n")
    if also_print:
        print(prompt.strip())
    print(f"Wrote prompt: {path}")
    return path


def append_manifest(output_dir: Path, event: dict) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = output_dir / "manifest.jsonl"
    with manifest.open("a", encoding="utf-8") as destination:
        destination.write(json.dumps(event, ensure_ascii=False, sort_keys=True) + "\n")
    return manifest


def build_reference_records(
    workflow: dict,
    run_kind: str,
    group_name: str,
    require_exists: bool = True,
) -> list[dict]:
    configured = workflow["reference_sets"][run_kind][group_name]
    references: list[dict] = []
    missing: list[Path] = []
    for entry in configured:
        anchor_name = entry["anchor"]
        anchor = workflow["anchors"][anchor_name]
        configured_path = Path(anchor["path"])
        path = configured_path if configured_path.is_absolute() else BASE_DIR / configured_path
        path = path.resolve()
        exists = path.is_file()
        if not exists:
            missing.append(path)
        references.append(
            {
                "role": entry["role"],
                "anchor": anchor_name,
                "name": anchor["name"],
                "configured_path": anchor["path"],
                "path": str(path),
                "exists": exists,
                "sha256": sha256_file(path) if exists else None,
            }
        )
    if require_exists and missing:
        formatted = "\n".join(f"  - {path}" for path in missing)
        raise SystemExit(f"Required reference images are missing:\n{formatted}")
    return references


def suggested_image_output_dir(group_name: str) -> Path:
    folder = "01_face_stickers" if group_name == "face" else "02_body_stickers"
    return (BASE_DIR / "output" / folder / "pending").resolve()


def write_run(
    prompt: str,
    name: str,
    output_dir: Path,
    references: list[dict],
    metadata: dict,
    also_print: bool,
) -> tuple[Path, Path]:
    prompt_path = write_prompt(prompt, name, output_dir, also_print)
    run_id = prompt_path.stem
    spec_path = output_dir / f"{run_id}.json"
    created_at = utc_now()
    spec = {
        "schema_version": 1,
        "run_id": run_id,
        "created_at": created_at,
        "status": "pending",
        "prompt_path": str(prompt_path.resolve()),
        "prompt_sha256": sha256_text(prompt.strip() + "\n"),
        "workflow_path": str(WORKFLOW_JSON.resolve()),
        "workflow_sha256": sha256_file(WORKFLOW_JSON),
        "reference_images": references,
        "output_image": None,
        "review_history": [],
        **metadata,
    }
    atomic_write_text(
        spec_path,
        json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )
    manifest = append_manifest(
        output_dir,
        {
            "event": "created",
            "at": created_at,
            "run_id": run_id,
            "spec_path": str(spec_path.resolve()),
            "status": "pending",
        },
    )
    print(f"Wrote run spec: {spec_path}")
    print(f"Run id: {run_id}")
    if references:
        print("Reference images:")
        for reference in references:
            print(f"  - {reference['role']}: {reference['path']}")
    else:
        print("Reference images: none")
    print(f"Manifest: {manifest}")
    return prompt_path, spec_path


def resolve_run_spec(run: str, output_dir: Path) -> Path:
    supplied = Path(run).expanduser()
    if supplied.is_file():
        return supplied.resolve()
    if supplied.suffix == ".json":
        candidate = output_dir / supplied.name
    else:
        candidate = output_dir / f"{run}.json"
    if not candidate.is_file():
        raise SystemExit(f"Run spec not found: {candidate}")
    return candidate.resolve()


def review_run(
    run: str,
    status: str,
    reason: str | None,
    image_path: Path | None,
    output_dir: Path,
) -> Path:
    spec_path = resolve_run_spec(run, output_dir)
    try:
        spec = json.loads(read_text(spec_path))
    except json.JSONDecodeError as error:
        raise SystemExit(f"Invalid run spec {spec_path}: {error}")
    if status not in VALID_REVIEW_STATUSES:
        raise SystemExit(f"Invalid review status: {status}")
    resolved_image: str | None = spec.get("output_image")
    if image_path is not None:
        candidate = image_path.expanduser().resolve()
        if not candidate.is_file():
            raise SystemExit(f"Output image not found: {candidate}")
        resolved_image = str(candidate)
    reviewed_at = utc_now()
    previous_status = spec.get("status", "pending")
    spec["status"] = status
    spec["output_image"] = resolved_image
    spec.setdefault("review_history", []).append(
        {
            "at": reviewed_at,
            "from": previous_status,
            "to": status,
            "reason": reason or "",
            "output_image": resolved_image,
        }
    )
    atomic_write_text(
        spec_path,
        json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )
    append_manifest(
        spec_path.parent,
        {
            "event": "reviewed",
            "at": reviewed_at,
            "run_id": spec["run_id"],
            "status": status,
            "reason": reason or "",
            "output_image": resolved_image,
        },
    )
    print(f"Updated run {spec['run_id']}: {previous_status} -> {status}")
    return spec_path


def load_source_rows(workflow: dict | None = None) -> list[tuple[str, dict[str, str]]]:
    workflow = workflow or load_workflow()
    rows: list[tuple[str, dict[str, str]]] = []
    for group in workflow["variations"].values():
        label = group["label"]
        rows.extend((label, row) for row in group["rows"])
    return rows


def render_anchor(anchor_type: str, workflow: dict | None = None) -> tuple[str, str]:
    workflow = workflow or load_workflow()
    try:
        anchor = workflow["anchors"][anchor_type]
    except KeyError:
        raise SystemExit(f"Unknown anchor type: {anchor_type}")
    return anchor["name"], anchor["prompt"]


def load_variation(
    row_id: str,
    workflow: dict | None = None,
) -> tuple[str, dict[str, str]]:
    workflow = workflow or load_workflow()
    row_id = row_id.upper()
    variation_group(row_id)
    for matrix_name, row in load_source_rows(workflow):
        if row.get("id", "").upper() == row_id:
            return matrix_name, row
    raise SystemExit(f"Variation id not found: {row_id}")


def choose_scene(workflow: dict, group_name: str, rng: random.Random) -> dict:
    scenes = workflow.get("scene_presets", [])
    if scenes:
        scene = rng.choice(scenes)
        return {
            "name": scene["name"],
            "background": scene["background"],
            "micro_scene": scene[f"{group_name}_micro_scene"],
            "clothing_categories": scene.get("clothing_categories", []),
        }
    backgrounds = flatten_pool_values(workflow["background_presets"])
    micro_scenes = workflow["randomization_pools"][group_name]["micro_scenes"]
    return {
        "name": "none",
        "background": rng.choice(backgrounds),
        "micro_scene": rng.choice(micro_scenes),
        "clothing_categories": [],
    }


def choose_clothing(
    row: dict[str, str],
    scene: dict,
    fashion: dict,
    rng: random.Random,
) -> str:
    clothing_groups = fashion["clothing"]
    categories = scene.get("clothing_categories", [])
    scene_candidates = [
        value
        for category in categories
        for value in clothing_groups.get(category, [])
    ]
    all_candidates = flatten_pool_values(clothing_groups)
    pose = row["pose_action"].lower()
    if "hoodie" in pose:
        hoodie_candidates = [value for value in all_candidates if "hoodie" in value.lower()]
        if hoodie_candidates:
            return rng.choice(hoodie_candidates)
        return row["clothing"]
    return rng.choice(scene_candidates or all_candidates)


def choose_accessory(row: dict[str, str], fashion: dict, rng: random.Random) -> str:
    accessories = fashion["accessories"]
    pose = row["pose_action"].lower()
    all_candidates = flatten_pool_values(accessories)

    if "sunglasses" in pose:
        candidates = [value for value in all_candidates if "sunglasses" in value.lower()]
    elif "hat" in pose:
        candidates = [
            value
            for value in accessories.get("headwear", [])
            if any(word in value.lower() for word in ("hat", "cap"))
        ]
    elif "backpack" in pose:
        candidates = [value for value in all_candidates if "backpack" in value.lower()]
    elif "toy" in pose:
        candidates = [value for value in all_candidates if "toy" in value.lower()]
    else:
        candidates = ["none"] * 5
        candidates.extend(accessories.get("headwear", []))
        candidates.extend(
            value
            for value in accessories.get("outing", [])
            if "backpack" not in value.lower()
        )
        candidates = [
            value
            for value in candidates
            if "sunglasses-specific" not in value.lower()
        ]
    return rng.choice(candidates) if candidates else row["accessory"]


def randomize_variation(
    row: dict[str, str],
    seed: int | None = None,
    workflow: dict | None = None,
) -> dict[str, str]:
    workflow = workflow or load_workflow()
    row = dict(row)
    seed = generate_seed() if seed is None else seed
    group_name = variation_group(row)
    rng = random.Random(derive_seed(seed, row["id"].upper()))
    fashion = workflow["fashion_presets"]
    scene = choose_scene(workflow, group_name, rng)

    # Identity-sensitive scenario fields stay tied to the requested variation id.
    row["background"] = scene["background"]
    row["micro_scene"] = scene["micro_scene"]
    row["scene_preset"] = scene["name"]
    row["clothing"] = choose_clothing(row, scene, fashion, rng)
    row["hairstyle"] = rng.choice(flatten_pool_values(fashion["hairstyles"]))
    row["accessory"] = choose_accessory(row, fashion, rng)
    row["random_seed"] = str(seed)

    issues = validate_variation_consistency(row)
    if issues:
        formatted = "\n".join(f"  - {issue}" for issue in issues)
        raise SystemExit(f"Randomization produced an incompatible variation:\n{formatted}")
    return row


def choose_random_base_id(group_name: str, seed: int, workflow: dict) -> str:
    rows = workflow["variations"][group_name]["rows"]
    rng = random.Random(derive_seed(seed, f"random-new:{group_name}"))
    return rng.choice(rows)["id"]


def build_variation(
    row_id: str,
    randomize: bool = False,
    seed: int | None = None,
    workflow: dict | None = None,
    command: str = "variation",
) -> dict:
    workflow = workflow or load_workflow()
    _, source_row = load_variation(row_id, workflow)
    row = dict(source_row)
    if randomize:
        seed = generate_seed() if seed is None else seed
        row = randomize_variation(row, seed, workflow)
    group_name = variation_group(row)
    prompt_values = dict(row)
    prompt_values["identity_lock"] = workflow["identity_locks"][group_name]
    prompt = workflow["templates"]["variation"].format(**prompt_values)
    suffix = f"random_seed_{seed}" if randomize else "variation"
    name = f"{row['id']}_{row['type']}_{suffix}"
    return {
        "name": name,
        "prompt": prompt,
        "row": row,
        "group": group_name,
        "seed": seed if randomize else None,
        "command": command,
    }


def render_variation(
    row_id: str,
    randomize: bool = False,
    seed: int | None = None,
) -> tuple[str, str]:
    variation = build_variation(row_id, randomize, seed)
    return variation["name"], variation["prompt"]


def print_list(verbose: bool = False) -> None:
    grouped_rows: dict[str, list[dict[str, str]]] = {}
    for matrix_name, row in load_source_rows():
        grouped_rows.setdefault(matrix_name, []).append(row)
    for matrix_name, rows in grouped_rows.items():
        print(matrix_name)
        for row in rows:
            print(
                f"  {row['id']}: {row['type']} | {row['expression']} | "
                f"{row['pose_action']} | {row['camera_angle']}"
            )
            if verbose:
                print(f"      framing: {row['framing']}")
                print(f"      clothing: {row['clothing']}")
                print(f"      accessory: {row['accessory']}")
                print(f"      background: {row['background']}")
                print(f"      micro_scene: {row.get('micro_scene', '')}")


def print_backgrounds() -> None:
    workflow = load_workflow()
    for category, backgrounds in workflow.get("background_presets", {}).items():
        print(category)
        for background in backgrounds:
            print(f"  - {background}")


def print_fashion() -> None:
    workflow = load_workflow()
    for group_name, group in workflow.get("fashion_presets", {}).items():
        print(group_name)
        for category, values in group.items():
            print(f"  {category}")
            for value in values:
                print(f"    - {value}")


def print_randomization_pools() -> None:
    workflow = load_workflow()
    print("Constrained random preserves each variation row's expression, pose, angle, and framing.")
    print("The field pools below are retained as design references; random-new selects a compatible base row.")
    for group_name, pools in workflow.get("randomization_pools", {}).items():
        print(group_name)
        for category, values in pools.items():
            print(f"  {category}")
            for value in values:
                print(f"    - {value}")
    if workflow.get("scene_presets"):
        print("scene_presets")
        for scene in workflow["scene_presets"]:
            print(f"  - {scene['name']}: {scene['background']}")


def export_legacy_files(workflow: dict | None = None) -> list[Path]:
    workflow = workflow or load_workflow()
    prompts_dir = BASE_DIR / "prompts"
    matrix_dir = BASE_DIR / "matrix"
    exports = {
        prompts_dir / "face_anchor.txt": workflow["anchors"]["face"]["prompt"],
        prompts_dir / "body_anchor.txt": workflow["anchors"]["body"]["prompt"],
        prompts_dir / "face_identity_lock.txt": workflow["identity_locks"]["face"],
        prompts_dir / "body_identity_lock.txt": workflow["identity_locks"]["body"],
        prompts_dir / "identity_lock.txt": workflow["identity_locks"]["body"],
        prompts_dir / "variation_template.txt": workflow["templates"]["variation"],
    }
    written: list[Path] = []
    for path, value in exports.items():
        atomic_write_text(path, value.strip() + "\n")
        written.append(path)

    for group_name, filename in (
        ("face", "face_sticker_matrix.csv"),
        ("body", "body_sticker_matrix.csv"),
    ):
        buffer = io.StringIO(newline="")
        writer = csv.DictWriter(buffer, fieldnames=LEGACY_MATRIX_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(workflow["variations"][group_name]["rows"])
        path = matrix_dir / filename
        atomic_write_text(path, buffer.getvalue())
        written.append(path)
    for path in written:
        print(f"Exported: {path}")
    return written


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prepare auditable prompts for Codex built-in create image."
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory for prompt files, run specs, and manifest.jsonl.",
    )
    parser.add_argument(
        "--print",
        dest="global_print",
        action="store_true",
        help="Also print the generated prompt to stdout.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    anchor = subparsers.add_parser("anchor", help="Prepare an anchor prompt and run spec.")
    anchor.add_argument("type", choices=("face", "body"))
    anchor.add_argument("--print", dest="local_print", action="store_true")

    variation = subparsers.add_parser("variation", help="Prepare one fixed variation prompt.")
    variation.add_argument("id", help="Variation id, for example F01 or B02.")
    variation.add_argument(
        "--randomize",
        action="store_true",
        help="Randomize compatible scene, fashion, hair, and accessory fields only.",
    )
    variation.add_argument("--seed", type=int, help="Seed used with --randomize.")
    variation.add_argument("--print", dest="local_print", action="store_true")

    random_parser = subparsers.add_parser(
        "random",
        help="Randomize safe secondary fields while preserving the requested variation id.",
    )
    random_parser.add_argument("id", help="Variation id, for example F01 or B09.")
    random_parser.add_argument("--seed", type=int)
    random_parser.add_argument("--print", dest="local_print", action="store_true")

    random_new = subparsers.add_parser(
        "random-new",
        help="Select a compatible base variation, then randomize only safe secondary fields.",
    )
    random_new.add_argument("group", choices=("face", "body"))
    random_new.add_argument("--seed", type=int)
    random_new.add_argument("--print", dest="local_print", action="store_true")

    list_parser = subparsers.add_parser("list", help="List available variation ids.")
    list_parser.add_argument("--verbose", action="store_true")
    subparsers.add_parser("backgrounds", help="List reusable background presets.")
    subparsers.add_parser("fashion", help="List reusable fashion presets.")
    subparsers.add_parser("random-pools", help="List design-reference random pools.")
    subparsers.add_parser("validate", help="Validate workflow structure and compatibility rules.")
    subparsers.add_parser("export", help="Regenerate human-readable prompts and CSV matrices.")

    review = subparsers.add_parser("review", help="Record a review decision for a generated run.")
    review.add_argument("run", help="Run id or path to a run spec JSON file.")
    review.add_argument("status", choices=VALID_REVIEW_STATUSES)
    review.add_argument("--reason")
    review.add_argument("--image", type=Path)
    return parser


def main(argv: list[str]) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "validate":
        workflow = load_workflow(validate=False)
        errors = validate_workflow(workflow)
        if errors:
            print("Workflow validation failed:", file=sys.stderr)
            for error in errors:
                print(f"  - {error}", file=sys.stderr)
            return 1
        print("Workflow validation passed.")
        return 0
    if args.command == "review":
        if args.status in ("retry", "rejected") and not args.reason:
            parser.error("review retry/rejected requires --reason")
        review_run(args.run, args.status, args.reason, args.image, args.output_dir)
        return 0
    if args.command == "export":
        export_legacy_files()
        return 0
    if args.command == "list":
        print_list(args.verbose)
        return 0
    if args.command == "backgrounds":
        print_backgrounds()
        return 0
    if args.command == "fashion":
        print_fashion()
        return 0
    if args.command == "random-pools":
        print_randomization_pools()
        return 0

    workflow = load_workflow()
    also_print = bool(args.global_print or getattr(args, "local_print", False))
    if args.command == "anchor":
        name, prompt = render_anchor(args.type, workflow)
        group_name = args.type
        references = build_reference_records(workflow, "anchor", group_name)
        metadata = {
            "kind": "anchor",
            "group": group_name,
            "anchor": args.type,
            "variation_id": None,
            "random_seed": None,
            "requested_fields": None,
            "suggested_output_dir": str((BASE_DIR / "output" / "00_anchors").resolve()),
        }
    else:
        if args.command == "variation":
            if args.seed is not None and not args.randomize:
                parser.error("variation --seed requires --randomize")
            seed = args.seed
            if args.randomize and seed is None:
                seed = generate_seed()
            variation = build_variation(
                args.id,
                randomize=args.randomize,
                seed=seed,
                workflow=workflow,
                command="variation --randomize" if args.randomize else "variation",
            )
        elif args.command == "random":
            seed = args.seed if args.seed is not None else generate_seed()
            variation = build_variation(
                args.id,
                randomize=True,
                seed=seed,
                workflow=workflow,
                command="random",
            )
        elif args.command == "random-new":
            seed = args.seed if args.seed is not None else generate_seed()
            selected_id = choose_random_base_id(args.group, seed, workflow)
            print(f"Selected base variation: {selected_id}")
            variation = build_variation(
                selected_id,
                randomize=True,
                seed=seed,
                workflow=workflow,
                command="random-new",
            )
        else:
            parser.error("Unknown command")
        if variation["seed"] is not None:
            print(f"Random seed: {variation['seed']}")
        name = variation["name"]
        prompt = variation["prompt"]
        group_name = variation["group"]
        references = build_reference_records(workflow, "variation", group_name)
        row = variation["row"]
        metadata = {
            "kind": "variation",
            "group": group_name,
            "anchor": None,
            "variation_id": row["id"],
            "command": variation["command"],
            "random_seed": variation["seed"],
            "scene_preset": row.get("scene_preset"),
            "requested_fields": {field: row[field] for field in sorted(ROW_TEMPLATE_FIELDS)},
            "suggested_output_dir": str(suggested_image_output_dir(group_name)),
        }
    write_run(prompt, name, args.output_dir, references, metadata, also_print)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
