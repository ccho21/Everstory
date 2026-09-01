#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Everstory Doctor 합성 회귀 테스트. 저장소에는 쓰지 않고 임시 폴더만 사용한다."""

import datetime as dt
import hashlib
import importlib.util
import json
import os
import shutil
import sys
import tempfile
import unittest
from collections import namedtuple
from pathlib import Path


sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent

_spec = importlib.util.spec_from_file_location("everstory_doctor", str(HERE / "doctor.py"))
doctor = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(doctor)


def finding_codes(sec, status=None):
    return {item["code"] for item in sec["findings"]
            if status is None or item["status"] == status}


def write_psd_header(path, width=120, height=80):
    header = (b"8BPS" + (1).to_bytes(2, "big") + b"\0" * 6 + (3).to_bytes(2, "big") +
              height.to_bytes(4, "big") + width.to_bytes(4, "big") +
              (8).to_bytes(2, "big") + (3).to_bytes(2, "big"))
    path.write_bytes(header)


def write_png_header(path, width=120, height=80):
    header = (b"\x89PNG\r\n\x1a\n" + (13).to_bytes(4, "big") + b"IHDR" +
              width.to_bytes(4, "big") + height.to_bytes(4, "big"))
    path.write_bytes(header)


def make_project(projects, folder="Synthetic EVS-9001", fulfilled_at="2026-05-01T00:00:00Z",
                 secret="PRIVATE-SENTINEL-DO-NOT-PRINT"):
    project = projects / folder
    original_dir = project / "01_original"
    cutout_dir = project / "02_cutout"
    output_dir = project / "03_output"
    for path in (original_dir, cutout_dir, output_dir):
        path.mkdir(parents=True, exist_ok=True)

    original = original_dir / "01_photo.jpg"
    payload = b"synthetic-photo"
    original.write_bytes(payload)
    manifest = {
        "generated_at": "2026-05-01T00:00:00Z",
        "order": {
            "name": "EVS-9001",
            "customer": secret,
            "email": secret + "@example.test",
            "fulfilled_at": fulfilled_at,
        },
        "line_items": [{
            "index": 0,
            "title": "Face Sticker",
            "sku": "EVS-FACE-19-WM",
            "quantity": 1,
        }],
        "options": [{"line_item": 0, "key": "Name", "value": secret}],
        "photos": [{
            "seq": 1,
            "line_item": 0,
            "file": original.name,
            "bytes": len(payload),
            "sha256": hashlib.sha256(payload).hexdigest(),
            "source_url": "https://example.test/" + secret,
            "error": secret,
        }],
        "warnings": [secret],
        "shipping": {"name": secret, "address1": secret, "zip": secret},
    }
    intake = doctor.load_intake_module(ROOT)
    manifest["job"] = intake.build_job(manifest)
    (project / "_order.json").write_text(json.dumps(manifest), encoding="utf-8")

    write_psd_header(cutout_dir / "design_01_clean.psd")
    write_png_header(cutout_dir / "design_01_sil.png")
    (output_dir / "20260827_000000_fixture_sheet01.ai").write_bytes(b"synthetic-ai")
    return project, manifest


class DoctorTests(unittest.TestCase):
    def test_valid_manifest_pair_hash_retention_and_pii_redaction(self):
        now = dt.datetime(2026, 8, 27, tzinfo=dt.timezone.utc)
        secret = "CUSTOMER-SECRET-SENTINEL"
        with tempfile.TemporaryDirectory(prefix="everstory-doctor-test-") as tmp:
            projects = Path(tmp) / "projects"
            projects.mkdir()
            make_project(projects, secret=secret)

            before, before_errors = doctor.snapshot_tree(projects)
            sec = doctor.scan_projects(ROOT, projects, now, retention_days=90, verify_hash=True)
            after, after_errors = doctor.snapshot_tree(projects)

        self.assertEqual(before_errors + after_errors, 0)
        self.assertEqual(before, after)
        self.assertNotIn("FAIL", {item["status"] for item in sec["findings"]})
        self.assertIn("RETENTION_OVERDUE_CANDIDATE", finding_codes(sec, "WARN"))
        self.assertEqual(sec["metrics"]["manifests"], 1)
        self.assertEqual(sec["metrics"]["pairs"], 1)
        self.assertEqual(sec["metrics"]["retention_exact"], 1)
        self.assertNotIn(secret, json.dumps(sec, ensure_ascii=False))

    def test_half_pair_and_dimension_mismatch_are_failures(self):
        now = dt.datetime(2026, 8, 27, tzinfo=dt.timezone.utc)
        with tempfile.TemporaryDirectory(prefix="everstory-doctor-test-") as tmp:
            projects = Path(tmp) / "projects"
            project = projects / "legacy"
            cutout = project / "02_cutout"
            cutout.mkdir(parents=True)
            write_psd_header(cutout / "half_01_clean.psd")
            write_psd_header(cutout / "mismatch_02_clean.psd", width=120, height=80)
            write_png_header(cutout / "mismatch_02_sil.png", width=121, height=80)

            sec = doctor.scan_projects(ROOT, projects, now, verify_hash=True)

        self.assertIn("PAIR_HALF", finding_codes(sec, "FAIL"))
        self.assertIn("PAIR_DIMENSIONS", finding_codes(sec, "FAIL"))
        self.assertEqual(sec["metrics"]["clean_only"], 1)

    def test_legacy_old_mtime_is_review_only_not_deletion_eligibility(self):
        now = dt.datetime(2026, 8, 27, tzinfo=dt.timezone.utc)
        old = (now - dt.timedelta(days=100)).timestamp()
        with tempfile.TemporaryDirectory(prefix="everstory-doctor-test-") as tmp:
            projects = Path(tmp) / "projects"
            original = projects / "legacy" / "01_original" / "01_photo.jpg"
            original.parent.mkdir(parents=True)
            original.write_bytes(b"photo")
            os.utime(str(original), (old, old))

            sec = doctor.scan_projects(ROOT, projects, now, retention_days=90, verify_hash=True)

        self.assertIn("AGE_REVIEW_CANDIDATE", finding_codes(sec, "WARN"))
        self.assertIn("RETENTION_UNKNOWN", finding_codes(sec, "UNKNOWN"))
        self.assertNotIn("RETENTION_OVERDUE_CANDIDATE", finding_codes(sec))

    def test_backup_marker_thresholds_and_anonymized_path(self):
        now = dt.datetime(2026, 8, 27, tzinfo=dt.timezone.utc)
        secret = "SECRET-BACKUP-PATH"
        with tempfile.TemporaryDirectory(prefix="everstory-doctor-test-") as tmp:
            marker = Path(tmp) / secret
            marker.write_text("ok", encoding="utf-8")
            old = (now - dt.timedelta(hours=80)).timestamp()
            os.utime(str(marker), (old, old))
            stale = doctor.check_backup([marker], now)
            fresh_time = (now - dt.timedelta(hours=1)).timestamp()
            os.utime(str(marker), (fresh_time, fresh_time))
            fresh = doctor.check_backup([marker], now)

        self.assertIn("BACKUP_STALE", finding_codes(stale, "FAIL"))
        self.assertIn("BACKUP_FRESH", finding_codes(fresh, "OK"))
        self.assertNotIn(secret, json.dumps(stale, ensure_ascii=False))

    def test_disk_uses_both_absolute_and_percentage_thresholds(self):
        Usage = namedtuple("Usage", "total used free")
        critical = doctor.check_disk(
            Path("."), usage_fn=lambda _: Usage(100 * doctor.GIB, 96 * doctor.GIB, 4 * doctor.GIB))
        warning = doctor.check_disk(
            Path("."), usage_fn=lambda _: Usage(200 * doctor.GIB, 185 * doctor.GIB, 15 * doctor.GIB))
        healthy = doctor.check_disk(
            Path("."), usage_fn=lambda _: Usage(100 * doctor.GIB, 70 * doctor.GIB, 30 * doctor.GIB))

        self.assertIn("DISK_CRITICAL", finding_codes(critical, "FAIL"))
        self.assertIn("DISK_LOW", finding_codes(warning, "WARN"))
        self.assertIn("DISK_OK", finding_codes(healthy, "OK"))

    def test_product_drift_and_code_contract_on_real_sources(self):
        sec = doctor.check_product_rules(ROOT)
        self.assertIn("PRODUCT_COUNT_COPY_DRIFT", finding_codes(sec, "WARN"))
        self.assertIn("PRODUCT_CODE_MAP", finding_codes(sec, "OK"))
        self.assertIn("PACKAGE_RULES", finding_codes(sec, "OK"))

    def test_guarded_check_redacts_exception_and_order_name(self):
        secret = "PERSON-NAME-SECRET"

        def broken():
            raise RuntimeError(secret)

        sec = doctor.guarded_check("synthetic", "합성", broken)
        label = doctor.safe_order_id({"order": {"name": "ALICE-123"}}, Path(secret))

        self.assertEqual(doctor.section_status(sec), "UNKNOWN")
        self.assertNotIn(secret, json.dumps(sec, ensure_ascii=False))
        self.assertRegex(label, r"^project-[0-9a-f]{8}$")

    def test_bad_hash_and_boolean_seq_are_isolated_manifest_failures(self):
        now = dt.datetime(2026, 8, 27, tzinfo=dt.timezone.utc)
        secret_key = "CUSTOMER-NAME-AS-JOB-KEY"
        with tempfile.TemporaryDirectory(prefix="everstory-doctor-test-") as tmp:
            projects = Path(tmp) / "projects"
            projects.mkdir()
            project, manifest = make_project(projects)
            manifest["photos"][0]["seq"] = True
            manifest["photos"][0]["sha256"] = ["not", "hashable"]
            manifest["job"][secret_key] = "hidden"
            (project / "_order.json").write_text(json.dumps(manifest), encoding="utf-8")

            sec = doctor.scan_projects(ROOT, projects, now, verify_hash=True)

        self.assertIn("PHOTO_SEQ", finding_codes(sec, "FAIL"))
        self.assertIn("PHOTO_HASH_SCHEMA", finding_codes(sec, "FAIL"))
        self.assertIn("JOB_DRIFT", finding_codes(sec, "FAIL"))
        self.assertNotIn("CHECK_INTERNAL_ERROR", finding_codes(sec))
        self.assertNotIn(secret_key, json.dumps(sec, ensure_ascii=False))

    def test_output_latest_batch_uses_filename_timestamp_and_reports_bad_names(self):
        with tempfile.TemporaryDirectory(prefix="everstory-doctor-test-") as tmp:
            project = Path(tmp)
            output = project / "03_output"
            output.mkdir()
            old_batch = output / "20260101_000000_fixture_sheet01.ai"
            new_batch = output / "20260827_000000_fixture_sheet01.ai"
            bad_name = output / "manual-output.ai"
            for path in (old_batch, new_batch, bad_name):
                path.write_bytes(b"ai")
            os.utime(str(old_batch), (2_000_000_000, 2_000_000_000))
            os.utime(str(new_batch), (1_000_000_000, 1_000_000_000))

            health = doctor.output_health(project, {}, None, None)

        self.assertEqual(health["latest_count"], 1)
        self.assertEqual(health["newest_ai"], 1_000_000_000)
        self.assertEqual(health["unmatched"], 1)

    def test_test_sandbox_copy_never_changes_repo(self):
        before, before_errors = doctor.snapshot_tree(ROOT)
        with tempfile.TemporaryDirectory(prefix="everstory-doctor-test-") as tmp:
            sandbox = Path(tmp) / "repo"
            sandbox.mkdir()
            doctor.copy_test_sandbox(ROOT, sandbox)
            self.assertTrue((sandbox / "sim/extract.js").is_file())
            self.assertTrue((sandbox / "scripts/order_intake/intake.py").is_file())
            self.assertTrue((sandbox / "scripts/doctor_test.py").is_file())
            self.assertTrue((sandbox / "docs/business/products.md").is_file())
            self.assertFalse((sandbox / "sim/packer.js").exists())
            shutil.rmtree(str(sandbox))
        after, after_errors = doctor.snapshot_tree(ROOT)

        # Doctor runner는 TMPDIR을 복사본 root/tmp로 고정한다. 이 테스트가 만드는 임시
        # 디렉터리 때문에 root/tmp 자체의 mtime만 바뀌는 것은 의도된 샌드박스 쓰기다.
        before = {key: value for key, value in before.items()
                  if key != "tmp" and not key.startswith("tmp/")}
        after = {key: value for key, value in after.items()
                 if key != "tmp" and not key.startswith("tmp/")}

        self.assertEqual(before_errors + after_errors, 0)
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main(verbosity=2)
