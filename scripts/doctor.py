#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Everstory 제작 파이프라인 읽기 전용 건강검진.

기본 실행은 프로젝트 파일을 만들거나 고치지 않는다. 기존 회귀 테스트는 저장소를
직접 실행하지 않고 임시 샌드박스에 필요한 코드만 복사해 돌린다. 리포트는 stdout 으로만
출력하며 고객 이름·이메일·주소·사진 URL·원본 오류 문자열을 포함하지 않는다.

    python3 scripts/doctor.py
    python3 scripts/doctor.py --json
    python3 scripts/doctor.py --backup-marker /path/to/.everstory-backup-ok
    python3 scripts/doctor.py --skip-tests --skip-hash

종료 코드: FAIL 이 있으면 1, 그 외 0. --strict 는 WARN/UNKNOWN 도 1로 취급한다.
"""

import argparse
import ast
import datetime as dt
import hashlib
import importlib.util
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import unicodedata
from pathlib import Path


sys.dont_write_bytecode = True

VERSION = "1.0.0"
SCHEMA_VERSION = 1
GIB = 1024 ** 3
PHOTO_EXTS = {
    "jpg", "jpeg", "png", "heic", "heif", "avif", "tif", "tiff",
    "webp", "gif", "psd", "psb",
}
PAIR_TOKENS = "XXL|XL|XS|SML|MED|BIG|FAM|S|M|L"
PAIR_SEQ_RE = re.compile(r"_(\d+)(?:_(?:%s))?$" % PAIR_TOKENS, re.I)
AI_BATCH_RE = re.compile(
    r"^(?P<batch>(?P<timestamp>\d{8}_\d{6})_.+)_sheet(?P<sheet>\d+)\.ai$", re.I)
STATUS_RANK = {"SKIP": -1, "OK": 0, "UNKNOWN": 1, "WARN": 2, "FAIL": 3}
STATUS_ICON = {"SKIP": "—", "OK": "✅", "UNKNOWN": "?", "WARN": "⚠", "FAIL": "❌"}


def utcnow():
    return dt.datetime.now(dt.timezone.utc)


def iso_utc(value):
    return value.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_datetime(value):
    if not isinstance(value, str) or not value.strip():
        return None
    raw = value.strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = dt.datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def section(key, title):
    return {"key": key, "title": title, "metrics": {}, "findings": []}


def add_finding(sec, status, code, message):
    sec["findings"].append({"status": status, "code": code, "message": message})


def section_status(sec):
    if not sec["findings"]:
        return "OK"
    return max((f["status"] for f in sec["findings"]), key=lambda s: STATUS_RANK[s])


def overall_status(sections):
    statuses = [section_status(s) for s in sections]
    return max(statuses, key=lambda s: STATUS_RANK[s]) if statuses else "OK"


def compact_ids(values, limit=10):
    vals = sorted(set(values))
    shown = vals[:limit]
    suffix = " 외 %d건" % (len(vals) - limit) if len(vals) > limit else ""
    return ", ".join(shown) + suffix


def anonymous_project_id(path):
    digest = hashlib.sha256(path.name.encode("utf-8", "surrogatepass")).hexdigest()[:8]
    return "project-%s" % digest


def safe_order_id(manifest, project_dir):
    order = manifest.get("order") if isinstance(manifest, dict) else None
    raw = order.get("name") if isinstance(order, dict) else None
    value = str(raw or "").lstrip("#").strip()
    # 주문번호처럼 보이는 값만 노출한다. name 필드가 잘못 채워져 고객명이 들어와도
    # 리포트에 그대로 새지 않게 하고, 나머지는 안정적인 익명 ID로 바꾼다.
    if re.fullmatch(r"(?:EVS-)?\d{1,20}", value, re.I):
        return value
    return anonymous_project_id(project_dir)


def exception_name(exc):
    return type(exc).__name__


def read_text(path):
    return path.read_text(encoding="utf-8")


def heading_section(text, wanted):
    lines = text.splitlines()
    for index, line in enumerate(lines):
        match = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if not match or match.group(2).strip() != wanted:
            continue
        level = len(match.group(1))
        end = len(lines)
        for j in range(index + 1, len(lines)):
            nxt = re.match(r"^(#{1,6})\s+", lines[j])
            if nxt and len(nxt.group(1)) <= level:
                end = j
                break
        return "\n".join(lines[index + 1:end])
    raise ValueError("heading not found: %s" % wanted)


def split_table_row(line):
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def parse_first_table(block):
    lines = block.splitlines()
    for i in range(len(lines) - 1):
        if "|" not in lines[i] or "|" not in lines[i + 1]:
            continue
        headers = split_table_row(lines[i])
        separators = split_table_row(lines[i + 1])
        if len(headers) != len(separators) or not all(
                re.fullmatch(r":?-{3,}:?", cell) for cell in separators):
            continue
        rows = []
        for line in lines[i + 2:]:
            if "|" not in line:
                if rows:
                    break
                continue
            cells = split_table_row(line)
            if len(cells) != len(headers):
                break
            rows.append(dict(zip(headers, cells)))
        return rows
    raise ValueError("markdown table not found")


def price_cents(text):
    match = re.search(r"\$\s*(\d+)(?:\.(\d{1,2}))?", text or "")
    if not match:
        return None
    decimals = (match.group(2) or "0").ljust(2, "0")
    return int(match.group(1)) * 100 + int(decimals)


def first_int(text):
    match = re.search(r"\d+", text or "")
    return int(match.group(0)) if match else None


def parse_business_products(text):
    launch = parse_first_table(heading_section(text, "Launch SKU"))
    products = {}
    for row in launch:
        title = row.get("Product", "").strip()
        if not title:
            continue
        products[title] = {
            "price_cents": price_cents(row.get("Shopify price")),
            "selected": first_int(row.get("Photos selected")),
            "sheets": first_int(row.get("Sheets")),
        }

    packages = {}
    for title in ("Package Mini", "Package Full"):
        rows = parse_first_table(heading_section(text, title))
        uploads, picks = {}, {}
        for row in rows:
            tier = row.get("Tier", "").split()[0].upper()
            if tier not in ("BIG", "MEDIUM", "SMALL"):
                continue
            key = {"BIG": "BIG", "MEDIUM": "MED", "SMALL": "SML"}[tier]
            uploads[key] = first_int(row.get("Customer upload"))
            picks[key] = first_int(row.get("Studio selection"))
        packages[title] = {"uploads": uploads, "picks": picks}

    sizes = []
    for row in parse_first_table(heading_section(text, "Size Options")):
        value = row.get("Size option", "").strip()
        if value:
            sizes.append(value)

    material_match = re.search(r"Material은\s*4종으로\s*fix:\s*(.+?)\.", text)
    materials = []
    if material_match:
        materials = [x.strip() for x in material_match.group(1).split("/") if x.strip()]
    return {"products": products, "packages": packages, "sizes": sizes, "materials": materials}


def sku_sections(text):
    matches = list(re.finditer(r"^## SKU\s+\d+\s+.+$", text, re.M))
    result = []
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        result.append(text[match.start():end])
    return result


def parse_product_descriptions(text):
    products, packages = {}, {}
    for block in sku_sections(text):
        title_match = re.search(r"\*\*Title\*\*:\s*`([^`]+)`", block)
        if not title_match:
            continue
        title = title_match.group(1).strip()
        price_match = re.search(r"\*\*(?:Base price|Price)\*\*:\s*`?([^\n`]+)", block)
        products[title] = {"price_cents": price_cents(price_match.group(1) if price_match else "")}
        if title.startswith("Package "):
            uploads, picks = {}, {}
            for tier, upload, pick in re.findall(
                    r"- (Big|Medium|Small) print: upload up to (\d+) photos, Studio picks (\d+)", block):
                key = {"Big": "BIG", "Medium": "MED", "Small": "SML"}[tier]
                uploads[key], picks[key] = int(upload), int(pick)
            selected_match = re.search(r"- (\d+) selected photos total", block)
            sheet_match = re.search(r"- (One|Two|Three) A5 sticker sheets?", block)
            word_num = {"One": 1, "Two": 2, "Three": 3}
            packages[title] = {
                "uploads": uploads,
                "picks": picks,
                "selected": int(selected_match.group(1)) if selected_match else None,
                "sheets": word_num.get(sheet_match.group(1)) if sheet_match else None,
            }
    baseline = heading_section(text, "Product Setup Baseline")
    values = parse_first_table(heading_section(baseline, "Non-Package Variant Values"))
    options = {row.get("Option"): row.get("Values", "") for row in values}
    sizes = re.findall(r"`([^`]+)`", options.get("Size", ""))
    materials = re.findall(r"`([^`]+)`", options.get("Material", ""))
    return {"products": products, "packages": packages, "sizes": sizes, "materials": materials}


def python_constants(path, names):
    tree = ast.parse(read_text(path), filename=str(path))
    found = {}
    for node in tree.body:
        if not isinstance(node, ast.Assign) or len(node.targets) != 1:
            continue
        target = node.targets[0]
        if not isinstance(target, ast.Name) or target.id not in names:
            continue
        if target.id in found:
            raise ValueError("duplicate assignment: %s" % target.id)
        found[target.id] = ast.literal_eval(node.value)
    missing = set(names) - set(found)
    if missing:
        raise ValueError("missing constants: %s" % ", ".join(sorted(missing)))
    return found


def split_top_level(text, separator=","):
    parts, start, depth, quote, escape = [], 0, 0, None, False
    for index, char in enumerate(text):
        if quote:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                quote = None
            continue
        if char in "\"'":
            quote = char
        elif char in "[{(":
            depth += 1
        elif char in "]})":
            depth -= 1
        elif char == separator and depth == 0:
            parts.append(text[start:index].strip())
            start = index + 1
    tail = text[start:].strip()
    if tail:
        parts.append(tail)
    return parts


def js_scalar(raw):
    value = raw.strip()
    if value.startswith('"') and value.endswith('"'):
        return json.loads(value)
    if value.startswith("'") and value.endswith("'"):
        return value[1:-1]
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if re.fullmatch(r"-?(?:\d+\.\d*|\d*\.\d+)", value):
        return float(value)
    raise ValueError("unsupported JS scalar")


def js_literal(raw):
    value = raw.strip()
    if value.startswith("[") and value.endswith("]"):
        return [js_scalar(item) for item in split_top_level(value[1:-1])]
    if value.startswith("{") and value.endswith("}"):
        result = {}
        for item in split_top_level(value[1:-1]):
            key, val = item.split(":", 1)
            key = key.strip().strip("\"'")
            result[key] = js_scalar(val)
        return result
    return js_scalar(value)


def jsx_constants(path, names):
    text = read_text(path)
    found = {}
    for name in names:
        matches = re.findall(r"^\s*var\s+%s\s*=\s*(.*?);\s*(?://.*)?$" % re.escape(name), text, re.M)
        if len(matches) != 1:
            raise ValueError("JSX constant %s count=%d" % (name, len(matches)))
        found[name] = js_literal(matches[0])
    return found


def check_product_rules(root):
    sec = section("product_rules", "상품 규칙 드리프트")
    paths = {
        "business": root / "docs/business/products.md",
        "pdp": root / "docs/shopify/product_descriptions.md",
        "settings": root / "docs/shopify/settings_checklist.md",
        "pages": root / "docs/shopify/pages_copy.md",
        "policies": root / "docs/shopify/policies.md",
        "intake": root / "scripts/order_intake/intake.py",
        "jsx": root / "Everstory_mixed.jsx",
    }
    missing = [key for key, path in paths.items() if not path.is_file()]
    if missing:
        add_finding(sec, "FAIL", "PRODUCT_SOURCE_MISSING",
                    "필수 소스 누락: %s" % ", ".join(sorted(missing)))
        return sec

    try:
        business = parse_business_products(read_text(paths["business"]))
        pdp = parse_product_descriptions(read_text(paths["pdp"]))
    except (OSError, UnicodeError, ValueError) as exc:
        add_finding(sec, "UNKNOWN", "PRODUCT_SOURCE_PARSE",
                    "상품 문서 파싱 실패(%s); 값을 드리프트로 단정하지 않음" % exception_name(exc))
        return sec

    expected_titles = set(business["products"])
    pdp_titles = set(pdp["products"])
    sec["metrics"].update({
        "launch_products": len(expected_titles),
        "sizes": len(business["sizes"]),
        "materials": len(business["materials"]),
    })
    if expected_titles == pdp_titles:
        add_finding(sec, "OK", "PRODUCT_SET", "상품 SOT와 PDP 문서의 런칭 4종이 일치")
    else:
        add_finding(sec, "FAIL", "PRODUCT_SET", "상품 SOT와 PDP 문서의 상품 집합이 다름")

    price_diff = [title for title in expected_titles & pdp_titles
                  if business["products"][title]["price_cents"] != pdp["products"][title]["price_cents"]]
    add_finding(sec, "FAIL" if price_diff else "OK", "PRODUCT_PRICE",
                "가격 불일치: %s" % ", ".join(sorted(price_diff)) if price_diff else "상품 가격이 문서 간 일치")

    if business["sizes"] == pdp["sizes"] and business["materials"] == pdp["materials"]:
        add_finding(sec, "OK", "PRODUCT_OPTIONS", "사이즈 7종과 재질 4종이 문서 간 일치")
    else:
        add_finding(sec, "FAIL", "PRODUCT_OPTIONS", "사이즈 또는 재질 옵션이 문서 간 다름")

    package_diff = []
    for title, rule in business["packages"].items():
        other = pdp["packages"].get(title) or {}
        expected = business["products"].get(title, {})
        if (rule.get("uploads") != other.get("uploads") or rule.get("picks") != other.get("picks")
                or expected.get("selected") != other.get("selected")
                or expected.get("sheets") != other.get("sheets")):
            package_diff.append(title)
    add_finding(sec, "FAIL" if package_diff else "OK", "PACKAGE_RULES",
                "Package 규칙 불일치: %s" % ", ".join(package_diff)
                if package_diff else "Package upload/pick/selected/sheets 규칙이 로컬 SOT 간 일치")

    settings_text = read_text(paths["settings"])
    declarations = []
    for line_no, line in enumerate(settings_text.splitlines(), 1):
        match = re.search(r"기준으로\s+(\d+)\s+products\s+를\s+Draft", line)
        if match:
            declarations.append((line_no, int(match.group(1))))
    wrong_decl = [(line, count) for line, count in declarations if count != len(expected_titles)]
    if wrong_decl:
        add_finding(sec, "WARN", "PRODUCT_COUNT_COPY_DRIFT",
                    "settings_checklist의 상품 수 선언이 SOT 4종과 다름(line %s)" %
                    ", ".join(str(line) for line, _ in wrong_decl))
    else:
        add_finding(sec, "OK", "PRODUCT_COUNT_COPY_DRIFT", "상품 수 선언이 SOT와 일치")

    pages_text = read_text(paths["pages"])
    if "not dishwasher-safe" in pages_text and "dishwasher top rack" in pages_text:
        add_finding(sec, "WARN", "CARE_COPY_DRIFT",
                    "같은 카피 문서에 dishwasher 불가와 top-rack occasional 안내가 함께 존재")
    else:
        add_finding(sec, "OK", "CARE_COPY_DRIFT", "관리법 카피에서 알려진 충돌 없음")

    shipping_block = heading_section(settings_text, "1E. Shipping & Delivery — `Settings → Shipping and delivery`")
    public_shipping = "Expedited Parcel" in (read_text(paths["pdp"]) + read_text(paths["pages"]) +
                                             read_text(paths["policies"]))
    if public_shipping and "Expedited Parcel" not in shipping_block:
        add_finding(sec, "WARN", "SHIPPING_DOC_DRIFT",
                    "고객 카피는 Expedited Parcel을 약속하지만 Shipping 설정 문서에는 rate가 없음")
    else:
        add_finding(sec, "OK", "SHIPPING_DOC_DRIFT", "배송 약속과 설정 문서에서 알려진 충돌 없음")

    try:
        py = python_constants(paths["intake"], {
            "KEY_TO_BUCKET", "SKU_MM_TO_TIER", "SKU_SIZE_MM", "SKU_MATERIAL",
            "PACKAGE_SHEETS_BY_KIND",
        })
        js = jsx_constants(paths["jsx"], {
            "MATERIAL_OPTIONS", "SKU_MATERIAL", "PACKAGE_SHEETS_BY_KIND",
            "TIER_SIZE_MM", "BUCKETS", "TIER_TO_BUCKET",
        })
        py_tier_sizes = {py["SKU_MM_TO_TIER"][code]: value for code, value in py["SKU_SIZE_MM"].items()}
        code_ok = (
            py["SKU_MATERIAL"] == js["SKU_MATERIAL"] and
            set(py["SKU_MATERIAL"].values()) == set(js["MATERIAL_OPTIONS"]) and
            py["PACKAGE_SHEETS_BY_KIND"] == js["PACKAGE_SHEETS_BY_KIND"] and
            py_tier_sizes == js["TIER_SIZE_MM"] and
            set(v for v in py["KEY_TO_BUCKET"].values() if v) == set(js["BUCKETS"]) and
            set(js["TIER_TO_BUCKET"].values()) == set(js["BUCKETS"])
        )
        add_finding(sec, "OK" if code_ok else "FAIL", "PRODUCT_CODE_MAP",
                    "Python과 Illustrator의 SKU/재질/사이즈/Package/버킷 매핑이 일치"
                    if code_ok else "Python과 Illustrator의 상품 코드 매핑이 다름")
    except (OSError, SyntaxError, ValueError) as exc:
        add_finding(sec, "UNKNOWN", "PRODUCT_CODE_PARSE",
                    "코드 상수 파싱 실패(%s); 드리프트로 단정하지 않음" % exception_name(exc))

    add_finding(sec, "SKIP", "LIVE_EASIFY_NOT_CHECKED",
                "Easify upload quota는 공개 상품 JSON에 없어 로컬 Doctor로 검증 불가; 브라우저 계약 테스트 필요")
    return sec


def load_intake_module(root):
    path = root / "scripts/order_intake/intake.py"
    spec = importlib.util.spec_from_file_location("everstory_doctor_intake", str(path))
    if not spec or not spec.loader:
        raise ImportError("intake module spec unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def psd_dimensions(path):
    try:
        with path.open("rb") as handle:
            data = handle.read(26)
    except OSError:
        return None
    if len(data) < 26 or data[:4] != b"8BPS" or int.from_bytes(data[4:6], "big") not in (1, 2):
        return None
    height = int.from_bytes(data[14:18], "big")
    width = int.from_bytes(data[18:22], "big")
    return (width, height) if width > 0 and height > 0 else None


def png_dimensions(path):
    try:
        with path.open("rb") as handle:
            data = handle.read(24)
    except OSError:
        return None
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        return None
    width = int.from_bytes(data[16:20], "big")
    height = int.from_bytes(data[20:24], "big")
    return (width, height) if width > 0 and height > 0 else None


def project_dirs(projects_dir):
    if not projects_dir.is_dir():
        return []
    found = []
    for entry in sorted(projects_dir.iterdir(), key=lambda p: unicodedata.normalize("NFC", p.name)):
        if not entry.is_dir() or entry.name.startswith("."):
            continue
        if (entry / "_order.json").exists() or any((entry / name).is_dir() for name in
                                                    ("01_original", "02_cutout", "03_output")):
            found.append(entry)
    return found


def visible_files(path):
    if not path.is_dir():
        return []
    try:
        return [p for p in path.iterdir() if not p.name.startswith(".") and p.is_file()]
    except OSError:
        return []


def project_latest_mtime(project_dir):
    latest = None
    targets = [project_dir / "_order.json"]
    for sub in ("01_original", "02_cutout", "03_output"):
        base = project_dir / sub
        if not base.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(str(base)):
            dirnames[:] = [d for d in dirnames if d != "_cutcache" and not d.startswith(".")]
            for name in filenames:
                if not name.startswith("."):
                    targets.append(Path(dirpath) / name)
    for path in targets:
        try:
            stamp = path.stat().st_mtime
        except OSError:
            continue
        latest = stamp if latest is None else max(latest, stamp)
    return dt.datetime.fromtimestamp(latest, dt.timezone.utc) if latest is not None else None


def fulfillment_time(manifest):
    if not isinstance(manifest, dict):
        return None
    candidates = []
    order = manifest.get("order") if isinstance(manifest.get("order"), dict) else {}
    for container in (manifest, order):
        for key in ("fulfilled_at", "fulfilledAt"):
            parsed = parse_datetime(container.get(key))
            if parsed:
                candidates.append(parsed)
    fulfillments = manifest.get("fulfillments") or order.get("fulfillments") or []
    if isinstance(fulfillments, list):
        for item in fulfillments:
            if not isinstance(item, dict):
                continue
            for key in ("fulfilled_at", "fulfilledAt", "completed_at", "completedAt"):
                parsed = parse_datetime(item.get(key))
                if parsed:
                    candidates.append(parsed)
    return max(candidates) if candidates else None


def retention_hold(manifest):
    if not isinstance(manifest, dict):
        return False
    order = manifest.get("order") if isinstance(manifest.get("order"), dict) else {}
    return bool(manifest.get("retention_hold") or manifest.get("privacy_hold") or
                order.get("retention_hold") or order.get("privacy_hold"))


def cutout_health(project_dir):
    files = visible_files(project_dir / "02_cutout")
    clean = {p.name[:-len("_clean.psd")]: p for p in files if p.name.lower().endswith("_clean.psd")}
    sil = {p.name[:-len("_sil.png")]: p for p in files if p.name.lower().endswith("_sil.png")}
    bases = set(clean) & set(sil)
    invalid, dimensions_mismatch = 0, 0
    newest = None
    pair_seqs = set()
    for base in bases:
        clean_path, sil_path = clean[base], sil[base]
        cd, sd = psd_dimensions(clean_path), png_dimensions(sil_path)
        if cd is None or sd is None:
            invalid += 1
        elif cd != sd:
            dimensions_mismatch += 1
        match = PAIR_SEQ_RE.search(unicodedata.normalize("NFC", base))
        if match:
            pair_seqs.add(int(match.group(1)))
        try:
            stamp = max(clean_path.stat().st_mtime, sil_path.stat().st_mtime)
            newest = stamp if newest is None else max(newest, stamp)
        except OSError:
            invalid += 1
    return {
        "pairs": len(bases),
        "clean_only": len(set(clean) - set(sil)),
        "sil_only": len(set(sil) - set(clean)),
        "invalid": invalid,
        "dimensions_mismatch": dimensions_mismatch,
        "pair_seqs": pair_seqs,
        "newest": newest,
    }


def output_health(project_dir, job, pair_newest, manifest_mtime):
    ai_files = [p for p in visible_files(project_dir / "03_output") if p.suffix.lower() == ".ai"]
    batches = {}
    unmatched = 0
    for path in ai_files:
        match = AI_BATCH_RE.match(path.name)
        if not match:
            unmatched += 1
            continue
        batches.setdefault(match.group("batch"), []).append((int(match.group("sheet")), path))
    latest_paths, latest_sheets = [], []
    if batches:
        # YYYYMMDD_HHMMSS prefix가 정렬 가능한 batch ID다. 과거 파일을 복사/재저장해
        # mtime이 바뀌어도 최신 제작 batch가 뒤집히면 안 된다.
        latest_key = max(batches)
        latest_sheets = sorted(n for n, _ in batches[latest_key])
        latest_paths = [p for _, p in batches[latest_key]]
    newest_ai = max((p.stat().st_mtime for p in latest_paths), default=None)
    return {
        "ai_count": len(ai_files),
        "batch_count": len(batches),
        "unmatched": unmatched,
        "latest_count": len(latest_paths),
        "latest_sheets": latest_sheets,
        "sheet_gap": bool(latest_sheets and latest_sheets != list(range(1, max(latest_sheets) + 1))),
        "expected_sheets": job.get("sheets") if isinstance(job, dict) and job.get("mode") == "package" else None,
        "newest_ai": newest_ai,
        "pair_newer": bool(pair_newest is not None and newest_ai is not None and pair_newest > newest_ai + 1),
        "manifest_newer": bool(manifest_mtime is not None and newest_ai is not None and manifest_mtime > newest_ai + 1),
    }


def manifest_container_errors(manifest):
    errors = []
    required = {"order": dict, "line_items": list, "options": list, "photos": list}
    for key, wanted in required.items():
        if not isinstance(manifest.get(key), wanted):
            errors.append(key)
    return errors


def scan_projects(root, projects_dir, now, retention_days=90, verify_hash=True):
    sec = section("projects", "주문 매니페스트·원본·누끼·출력·보존기한")
    if not projects_dir.is_dir():
        add_finding(sec, "FAIL", "PROJECTS_MISSING", "projects 디렉터리를 찾을 수 없음")
        return sec
    try:
        intake = load_intake_module(root)
    except (OSError, ImportError, SyntaxError) as exc:
        intake = None
        add_finding(sec, "UNKNOWN", "JOB_CHECK_UNAVAILABLE",
                    "intake.build_job 로드 실패(%s); job 비교를 생략" % exception_name(exc))

    dirs = project_dirs(projects_dir)
    issues = []
    infos = []
    order_ids = {}
    totals = {
        "projects": len(dirs), "manifests": 0, "legacy": 0, "originals": 0, "pairs": 0,
        "clean_only": 0, "sil_only": 0, "ai": 0, "retention_exact": 0,
        "retention_unknown": 0, "age_review": 0,
    }

    def issue(status, code, label, description):
        issues.append((status, code, label, description))

    for project_dir in dirs:
        manifest_path = project_dir / "_order.json"
        manifest = None
        if manifest_path.is_file():
            totals["manifests"] += 1
            try:
                manifest = json.loads(read_text(manifest_path))
                if not isinstance(manifest, dict):
                    raise ValueError("manifest root is not an object")
            except (OSError, UnicodeError, ValueError, json.JSONDecodeError) as exc:
                label = anonymous_project_id(project_dir)
                issue("FAIL", "MANIFEST_PARSE", label, "JSON 파싱 실패(%s)" % exception_name(exc))
                manifest = None
        else:
            totals["legacy"] += 1

        label = safe_order_id(manifest, project_dir)
        if manifest is not None:
            order_ids.setdefault(label, []).append(label)
            container_errors = manifest_container_errors(manifest)
            if container_errors:
                issue("FAIL", "MANIFEST_SCHEMA", label,
                      "핵심 컨테이너 타입 오류(%s)" % ",".join(container_errors))
            else:
                line_indices = set()
                for item in manifest["line_items"]:
                    if not isinstance(item, dict):
                        issue("FAIL", "LINE_ITEM_SCHEMA", label, "line_items 항목이 객체가 아님")
                        continue
                    index = item.get("index")
                    if not isinstance(index, int) or isinstance(index, bool) or index < 0:
                        issue("FAIL", "LINE_ITEM_INDEX", label, "line item index가 0 이상 정수가 아님")
                    elif index in line_indices:
                        issue("FAIL", "LINE_ITEM_INDEX", label, "line item index가 중복됨")
                    else:
                        line_indices.add(index)
                seqs, referenced, recorded_hashes = [], set(), {}
                unavailable = 0
                for photo in manifest["photos"]:
                    if not isinstance(photo, dict):
                        issue("FAIL", "PHOTO_SCHEMA", label, "photos 항목이 객체가 아님")
                        continue
                    seq = photo.get("seq")
                    if not isinstance(seq, int) or isinstance(seq, bool) or seq <= 0:
                        issue("FAIL", "PHOTO_SEQ", label, "사진 seq가 양의 정수가 아님")
                    else:
                        seqs.append(seq)
                    filename = photo.get("file")
                    is_unavailable = bool(photo.get("unavailable"))
                    if bool(filename) == is_unavailable:
                        issue("FAIL", "PHOTO_STATE", label, "file/unavailable 상태가 상호배타적이지 않음")
                    if is_unavailable:
                        unavailable += 1
                    line_item = photo.get("line_item")
                    if (line_item is not None and
                            (not isinstance(line_item, int) or isinstance(line_item, bool) or
                             line_item not in line_indices)):
                        issue("FAIL", "PHOTO_LINE_ITEM", label, "존재하지 않는 line_item 참조")
                    if not filename:
                        continue
                    if (not isinstance(filename, str) or Path(filename).name != filename or
                            Path(filename).is_absolute() or ".." in Path(filename).parts):
                        issue("FAIL", "PHOTO_PATH", label, "원본 파일명이 안전한 단일 basename이 아님")
                        continue
                    referenced.add(filename)
                    original = project_dir / "01_original" / filename
                    if not original.is_file():
                        issue("FAIL", "PHOTO_MISSING", label, "매니페스트 참조 원본이 없음")
                        continue
                    totals["originals"] += 1
                    try:
                        stat = original.stat()
                    except OSError as exc:
                        issue("FAIL", "PHOTO_STAT", label, "원본 stat 실패(%s)" % exception_name(exc))
                        continue
                    recorded_bytes = photo.get("bytes")
                    if recorded_bytes is None:
                        issue("WARN", "PHOTO_BYTES_MISSING", label, "원본 bytes 기록이 없음")
                    elif (not isinstance(recorded_bytes, int) or isinstance(recorded_bytes, bool) or
                          recorded_bytes < 0):
                        issue("FAIL", "PHOTO_BYTES_SCHEMA", label, "원본 bytes가 0 이상 정수가 아님")
                    elif recorded_bytes != stat.st_size:
                        issue("FAIL", "PHOTO_SIZE", label, "기록된 원본 크기와 실제 크기가 다름")
                    recorded_hash = photo.get("sha256")
                    normalized_hash = None
                    if recorded_hash is None:
                        issue("WARN", "PHOTO_HASH_MISSING", label, "원본 SHA-256 기록이 없음")
                    elif not isinstance(recorded_hash, str) or not re.fullmatch(
                            r"[0-9a-fA-F]{64}", recorded_hash):
                        issue("FAIL", "PHOTO_HASH_SCHEMA", label, "SHA-256이 64자리 hex 문자열이 아님")
                    else:
                        normalized_hash = recorded_hash.lower()
                    if normalized_hash and verify_hash:
                        try:
                            actual_hash = sha256_file(original)
                        except OSError as exc:
                            issue("FAIL", "PHOTO_HASH_READ", label, "원본 해시 읽기 실패(%s)" % exception_name(exc))
                        else:
                            if actual_hash != normalized_hash:
                                issue("FAIL", "PHOTO_HASH", label, "기록된 SHA-256과 실제 파일이 다름")
                    if normalized_hash:
                        recorded_hashes.setdefault(normalized_hash, 0)
                        recorded_hashes[normalized_hash] += 1
                    prefix = re.match(r"^(\d+)_", filename)
                    if prefix and isinstance(seq, int) and int(prefix.group(1)) != seq:
                        issue("FAIL", "PHOTO_FILENAME_SEQ", label, "파일명 순번과 manifest seq가 다름")
                if len(seqs) != len(set(seqs)) or (seqs and sorted(seqs) != list(range(1, max(seqs) + 1))):
                    issue("FAIL", "PHOTO_SEQ", label, "사진 seq가 중복되거나 비연속")
                if unavailable:
                    issue("WARN", "PHOTO_UNAVAILABLE", label, "다운로드 불가 사진 %d개" % unavailable)
                if any(count > 1 for count in recorded_hashes.values()):
                    issue("WARN", "PHOTO_DUPLICATE", label, "동일 SHA-256 사진이 여러 순번에 존재")
                actual_originals = {p.name for p in visible_files(project_dir / "01_original")
                                    if p.suffix.lower().lstrip(".") in PHOTO_EXTS}
                unreferenced = actual_originals - referenced
                if unreferenced:
                    issue("WARN", "PHOTO_UNREFERENCED", label,
                          "매니페스트 미참조 원본 %d개" % len(unreferenced))
                if "job" not in manifest:
                    issue("WARN", "JOB_MISSING", label, "job 블록 없음")
                elif intake is not None and isinstance(manifest.get("job"), dict):
                    try:
                        rebuilt = intake.build_job(manifest)
                    except Exception as exc:  # imported operational code; report type only
                        issue("UNKNOWN", "JOB_REBUILD", label,
                              "job 재계산 실패(%s)" % exception_name(exc))
                    else:
                        known_keys = set(rebuilt)
                        changed = [key for key in sorted(known_keys)
                                   if rebuilt.get(key) != manifest["job"].get(key)]
                        extra_count = len(set(manifest["job"]) - known_keys)
                        if changed or extra_count:
                            details = []
                            if changed:
                                details.append("다른 필드: %s" % ",".join(changed))
                            if extra_count:
                                details.append("알 수 없는 추가 필드 %d개" % extra_count)
                            issue("FAIL", "JOB_DRIFT", label,
                                  "저장 job과 재계산 결과가 다름(%s)" % "; ".join(details))
                if "shipping" not in manifest:
                    issue("WARN", "SHIPPING_KEY_MISSING", label, "shipping 키 없음(legacy 가능)")

        cut = cutout_health(project_dir)
        totals["pairs"] += cut["pairs"]
        totals["clean_only"] += cut["clean_only"]
        totals["sil_only"] += cut["sil_only"]
        if cut["clean_only"] or cut["sil_only"]:
            issue("FAIL", "PAIR_HALF", label,
                  "half-pair clean-only %d / sil-only %d" % (cut["clean_only"], cut["sil_only"]))
        if cut["invalid"]:
            issue("FAIL", "PAIR_INVALID", label, "PSD/PNG signature 또는 크기 오류 페어 %d개" % cut["invalid"])
        if cut["dimensions_mismatch"]:
            issue("FAIL", "PAIR_DIMENSIONS", label, "clean/sil 픽셀 크기 불일치 %d개" % cut["dimensions_mismatch"])

        original_seqs = set()
        for path in visible_files(project_dir / "01_original"):
            match = re.match(r"^(\d+)_", path.name)
            if match and path.suffix.lower().lstrip(".") in PHOTO_EXTS:
                original_seqs.add(int(match.group(1)))
        mapping_inferred = bool(
            original_seqs and cut["pair_seqs"] and original_seqs == cut["pair_seqs"] and
            cut["pairs"] == len(cut["pair_seqs"]) == len(original_seqs))
        if cut["pairs"] and mapping_inferred:
            issue("UNKNOWN", "SOURCE_PAIR_MAPPING_INFERRED", label,
                  "원본↔누끼를 순번/개수로만 INFERRED; provenance 검증은 아님")
        elif cut["pairs"]:
            issue("UNKNOWN", "SOURCE_PAIR_MAPPING", label,
                  "원본↔누끼 provenance 없음; 순번으로 정확 매핑할 수 없음")

        manifest_mtime = manifest_path.stat().st_mtime if manifest_path.is_file() else None
        job = manifest.get("job") if isinstance(manifest, dict) else None
        output = output_health(project_dir, job, cut["newest"], manifest_mtime)
        totals["ai"] += output["ai_count"]
        if output["unmatched"]:
            issue("WARN", "OUTPUT_NAME_UNPARSEABLE", label,
                  "파일명 규약 밖 AI %d개; batch 판정에서 제외" % output["unmatched"])
        if cut["pairs"] and not output["ai_count"]:
            issue("WARN", "OUTPUT_MISSING", label, "유효 누끼 페어가 있지만 AI 출력이 없음")
        elif cut["pairs"] and not output["latest_count"]:
            issue("WARN", "OUTPUT_BATCH_MISSING", label, "규약에 맞는 AI batch가 없음")
        if output["ai_count"] and not cut["pairs"]:
            issue("UNKNOWN", "OUTPUT_WITHOUT_PAIRS", label, "AI는 있으나 현재 유효 누끼 페어 없음(legacy 가능)")
        if output["sheet_gap"]:
            issue("FAIL", "OUTPUT_SHEET_GAP", label, "최신 AI batch의 sheet 번호가 비연속")
        if (output["expected_sheets"] is not None and output["latest_count"] and
                output["expected_sheets"] != output["latest_count"]):
            issue("WARN", "OUTPUT_SHEET_COUNT", label, "최신 AI batch 수와 job.sheets가 다름")
        if output["pair_newer"]:
            issue("WARN", "OUTPUT_STALE", label, "누끼 페어가 최신 AI보다 새로움")
        if output["manifest_newer"]:
            issue("WARN", "OUTPUT_JOB_STALE", label, "매니페스트가 최신 AI보다 새로움")

        latest = project_latest_mtime(project_dir)
        fulfilled = fulfillment_time(manifest)
        if retention_hold(manifest):
            issue("WARN", "RETENTION_HOLD", label, "retention hold 상태; 자동 삭제 대상 아님")
        elif fulfilled:
            totals["retention_exact"] += 1
            age = (now - fulfilled).total_seconds() / 86400
            if age >= retention_days:
                issue("WARN", "RETENTION_OVERDUE_CANDIDATE", label,
                      "fulfillment 기준 %d일 초과 검토 후보" % retention_days)
            elif age >= retention_days - 14:
                issue("WARN", "RETENTION_DUE_SOON", label, "보존기한 14일 이내")
        else:
            totals["retention_unknown"] += 1
            if latest and (now - latest).total_seconds() >= retention_days * 86400:
                totals["age_review"] += 1
                issue("WARN", "AGE_REVIEW_CANDIDATE", label,
                      "모든 최근 산출물이 %d일보다 오래됨; fulfillment 부재로 삭제 판정은 불가" % retention_days)
        infos.append({"label": label, "manifest": manifest is not None})

    duplicates = [order_id for order_id, hits in order_ids.items() if len(hits) > 1]
    if duplicates:
        add_finding(sec, "FAIL", "DUPLICATE_ORDER_ID", "중복 주문 식별자: %s" % compact_ids(duplicates))

    grouped = {}
    for status, code, label, description in issues:
        grouped.setdefault((status, code, description), []).append(label)
    for (status, code, description), labels in sorted(
            grouped.items(), key=lambda item: (-STATUS_RANK[item[0][0]], item[0][1], item[0][2])):
        add_finding(sec, status, code, "%s — %d건 [%s]" % (description, len(labels), compact_ids(labels)))

    if not dirs:
        add_finding(sec, "UNKNOWN", "PROJECTS_EMPTY", "점검할 프로젝트형 폴더가 없음")
    elif totals["legacy"]:
        add_finding(sec, "WARN", "LEGACY_PROJECTS",
                    "매니페스트 없는 legacy 프로젝트 %d건" % totals["legacy"])
    else:
        add_finding(sec, "OK", "MANIFEST_COVERAGE", "모든 프로젝트에 매니페스트가 있음")
    if totals["retention_unknown"]:
        add_finding(sec, "UNKNOWN", "RETENTION_UNKNOWN",
                    "fulfillment 시각이 없어 계약상 90일 판정 불가: %d건" % totals["retention_unknown"])
    sec["metrics"].update(totals)
    sec["metrics"]["hash_verification"] = "enabled" if verify_hash else "skipped"
    return sec


def check_backup(markers, now, warn_hours=24.0, fail_hours=72.0):
    sec = section("backup", "백업 노후도")
    sec["metrics"]["markers"] = len(markers)
    if not markers:
        add_finding(sec, "UNKNOWN", "BACKUP_MARKER_UNSET",
                    "백업 성공 marker 미설정; --backup-marker 또는 EVERSTORY_BACKUP_MARKERS 필요")
        return sec
    for index, marker in enumerate(markers, 1):
        label = "marker-%d" % index
        try:
            stamp = dt.datetime.fromtimestamp(marker.stat().st_mtime, dt.timezone.utc)
        except OSError as exc:
            add_finding(sec, "UNKNOWN", "BACKUP_MARKER_UNREADABLE",
                        "%s 읽기 실패(%s)" % (label, exception_name(exc)))
            continue
        age_hours = (now - stamp).total_seconds() / 3600
        if age_hours < -5 / 60:
            add_finding(sec, "WARN", "BACKUP_MARKER_FUTURE", "%s 시각이 미래임(clock skew)" % label)
        elif age_hours > fail_hours:
            add_finding(sec, "FAIL", "BACKUP_STALE",
                        "%s 마지막 성공 %.1f시간 전(한계 %.1f시간)" % (label, age_hours, fail_hours))
        elif age_hours > warn_hours:
            add_finding(sec, "WARN", "BACKUP_AGING",
                        "%s 마지막 성공 %.1f시간 전(경고 %.1f시간)" % (label, age_hours, warn_hours))
        else:
            add_finding(sec, "OK", "BACKUP_FRESH", "%s 마지막 성공 %.1f시간 전" % (label, max(0, age_hours)))
    add_finding(sec, "SKIP", "BACKUP_RESTORE_NOT_PROVEN",
                "marker는 작업 성공 heartbeat일 뿐 복원 가능성을 증명하지 않음; 정기 restore test 필요")
    return sec


def check_disk(projects_dir, warn_gb=20.0, fail_gb=5.0, warn_percent=10.0, fail_percent=5.0,
               usage_fn=shutil.disk_usage):
    sec = section("disk", "디스크 여유")
    try:
        usage = usage_fn(str(projects_dir))
    except OSError as exc:
        add_finding(sec, "UNKNOWN", "DISK_USAGE_UNAVAILABLE",
                    "disk_usage 실패(%s)" % exception_name(exc))
        return sec
    if not usage.total:
        add_finding(sec, "UNKNOWN", "DISK_TOTAL_ZERO", "디스크 total이 0으로 보고됨")
        return sec
    free_gb = usage.free / GIB
    free_percent = usage.free * 100.0 / usage.total
    sec["metrics"].update({"free_gib": round(free_gb, 2), "free_percent": round(free_percent, 2)})
    if free_gb < fail_gb or free_percent < fail_percent:
        status, code = "FAIL", "DISK_CRITICAL"
    elif free_gb < warn_gb or free_percent < warn_percent:
        status, code = "WARN", "DISK_LOW"
    else:
        status, code = "OK", "DISK_OK"
    add_finding(sec, status, code, "여유 %.1fGiB / %.1f%%" % (free_gb, free_percent))
    add_finding(sec, "SKIP", "APFS_PURGEABLE_NOT_INCLUDED", "APFS purgeable 공간은 stdlib로 구분하지 않음")
    return sec


TEST_SPECS = [
    ("extract", ["node", "extract.js", "../Everstory_mixed.jsx", "packer.js"], "sim", 10, [r"추출 완료"]),
    ("hoist", ["node", "hoisttest.js"], "sim", 10, []),
    ("name", ["node", "nametest.js"], "sim", 20, [r"\d+/\d+ 통과\s+✅"]),
    ("mode", ["node", "modetest.js"], "sim", 20, [r"\d+/\d+ 통과\s+✅"]),
    ("order", ["node", "ordertest.js"], "sim", 30, [r"\d+/\d+ 통과\s+✅"]),
    ("regress", ["node", "regress.js"], "sim", 30,
     [r"회귀 \d+건 중 \d+건 완전 동일\s+✅ 회귀 0", r"✅ 컷↑"]),
    ("cache", ["node", "cachetest.js"], "sim", 15, []),
    ("address-label-js", ["node", "labeltest.js"], "sim", 30, []),
    ("package-impl", ["node", "verify_impl.js"], "sim", 20,
     [r"레거시 유도 == 신 버킷 결과 동일: ✅", r"전 디자인 출력\(누락 0\): ✅", r"시트 배타성.*✅"]),
    ("plugin-bucket", ["node", "plugin_bucket_test.js"], "sim", 15, []),
    ("job-py", ["python3", "job_test.py"], "scripts/order_intake", 15, [r"\d+/\d+ 통과\s+✅"]),
    ("label-py", ["python3", "label_test.py"], "scripts/order_intake", 15, [r"\d+/\d+ 통과\s+✅"]),
    ("progress-py", ["python3", "progress_test.py"], "scripts/order_intake", 15, [r"\d+/\d+ 통과\s+✅"]),
    ("doctor-self", ["python3", "doctor_test.py"], "scripts", 30,
     [r"Ran \d+ tests", r"\nOK\s*$"]),
]


def copy_test_sandbox(root, sandbox):
    shutil.copy2(str(root / "Everstory_mixed.jsx"), str(sandbox / "Everstory_mixed.jsx"))
    shutil.copy2(str(root / "Everstory_address_labels.jsx"), str(sandbox / "Everstory_address_labels.jsx"))
    shutil.copytree(str(root / "sim"), str(sandbox / "sim"),
                    ignore=shutil.ignore_patterns("packer.js", "packer_full.js", "packer_new.js",
                                                  "packer_old.js", "__pycache__"))
    (sandbox / "scripts").mkdir()
    shutil.copytree(str(root / "scripts/order_intake"), str(sandbox / "scripts/order_intake"),
                    ignore=shutil.ignore_patterns("__pycache__"))
    shutil.copy2(str(root / "scripts/doctor.py"), str(sandbox / "scripts/doctor.py"))
    shutil.copy2(str(root / "scripts/doctor_test.py"), str(sandbox / "scripts/doctor_test.py"))
    for rel in (
            "docs/business/products.md",
            "docs/shopify/product_descriptions.md",
            "docs/shopify/settings_checklist.md",
            "docs/shopify/pages_copy.md",
            "docs/shopify/policies.md",
    ):
        destination = sandbox / rel
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(root / rel), str(destination))
    (sandbox / "plugins/everstory_save").mkdir(parents=True)
    shutil.copy2(str(root / "plugins/everstory_save/main.js"),
                 str(sandbox / "plugins/everstory_save/main.js"))
    (sandbox / "tmp").mkdir()


def run_process(argv, cwd, env, timeout):
    start = time.monotonic()
    try:
        proc = subprocess.Popen(
            argv, cwd=str(cwd), env=env, stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors="replace",
            start_new_session=True,
        )
    except OSError as exc:
        return {"status": "UNKNOWN", "duration": 0.0,
                "reason": "start failed(%s)" % exception_name(exc), "output": ""}
    try:
        output, _ = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except OSError:
            proc.kill()
        output, _ = proc.communicate()
        return {"status": "FAIL", "duration": time.monotonic() - start,
                "reason": "timeout %ss" % timeout, "output": output}
    return {"status": "OK" if proc.returncode == 0 else "FAIL",
            "duration": time.monotonic() - start,
            "reason": "exit %d" % proc.returncode, "output": output}


def check_tests(root, skip=False):
    sec = section("tests", "회귀 테스트")
    if skip:
        add_finding(sec, "SKIP", "TESTS_SKIPPED", "--skip-tests로 테스트 실행 생략")
        sec["metrics"].update({"passed": 0, "failed": 0, "unknown": 0, "skipped": len(TEST_SPECS)})
        return sec
    missing_sources = [name for name in ("Everstory_mixed.jsx", "Everstory_address_labels.jsx")
                       if not (root / name).is_file()]
    if missing_sources:
        add_finding(sec, "FAIL", "TEST_SOURCE_MISSING", "테스트 소스 누락: %s" % ", ".join(missing_sources))
        return sec
    passed = failed = unknown = 0
    total_duration = 0.0
    with tempfile.TemporaryDirectory(prefix="everstory-doctor-") as tmp:
        sandbox = Path(tmp) / "repo"
        sandbox.mkdir()
        try:
            copy_test_sandbox(root, sandbox)
        except OSError as exc:
            add_finding(sec, "FAIL", "TEST_SANDBOX_COPY",
                        "임시 테스트 샌드박스 준비 실패(%s)" % exception_name(exc))
            return sec
        env = os.environ.copy()
        env["TMPDIR"] = str(sandbox / "tmp")
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        for name, argv, cwd_rel, timeout, required in TEST_SPECS:
            actual_argv = list(argv)
            if actual_argv[0] == "python3":
                actual_argv[0] = sys.executable
            result = run_process(actual_argv, sandbox / cwd_rel, env, timeout)
            total_duration += result["duration"]
            output = result.pop("output")
            has_fail_token = "❌" in output or re.search(r"(?:^|\s)FAIL(?:\s|$)", output, re.M) is not None
            missing_summary = [pattern for pattern in required if not re.search(pattern, output)]
            if result["status"] == "OK" and (has_fail_token or missing_summary):
                result["status"] = "FAIL"
                result["reason"] = "failure token" if has_fail_token else "success summary missing"
            if result["status"] == "OK":
                passed += 1
            elif result["status"] == "FAIL":
                failed += 1
            else:
                unknown += 1
            add_finding(sec, result["status"], "TEST_%s" % name.upper().replace("-", "_"),
                        "%s — %s (%.2fs)" % (name, result["reason"], result["duration"]))
    sec["metrics"].update({"passed": passed, "failed": failed, "unknown": unknown,
                           "duration_seconds": round(total_duration, 2), "sandboxed": True})
    return sec


def snapshot_tree(root):
    snapshot, errors = {}, 0
    for dirpath, dirnames, filenames in os.walk(str(root)):
        dirnames[:] = [name for name in dirnames if name != ".git"]
        base = Path(dirpath)
        for name in sorted(dirnames + filenames):
            path = base / name
            try:
                stat = path.stat()
            except OSError:
                errors += 1
                continue
            rel = str(path.relative_to(root))
            snapshot[rel] = (path.is_dir(), stat.st_size, stat.st_mtime_ns)
    return snapshot, errors


def check_read_only(before, after, before_errors, after_errors):
    sec = section("read_only", "읽기 전용 보장")
    created = set(after) - set(before)
    deleted = set(before) - set(after)
    changed = {key for key in set(before) & set(after) if before[key] != after[key]}
    sec["metrics"].update({"created": len(created), "deleted": len(deleted), "changed": len(changed),
                           "snapshot_errors": before_errors + after_errors})
    if created or deleted or changed:
        add_finding(sec, "FAIL", "ROOT_MUTATED",
                    "실행 중 프로젝트 root 변경 감지(created %d / deleted %d / changed %d)" %
                    (len(created), len(deleted), len(changed)))
    else:
        add_finding(sec, "OK", "ROOT_UNCHANGED", "프로젝트 root의 파일·디렉터리 size/mtime 변경 없음")
    if before_errors or after_errors:
        add_finding(sec, "UNKNOWN", "SNAPSHOT_INCOMPLETE",
                    "읽기 전용 snapshot에서 stat 실패 %d건" % (before_errors + after_errors))
    add_finding(sec, "SKIP", "TEMP_SANDBOX_EPHEMERAL",
                "회귀 테스트는 시스템 임시 폴더에서만 파일을 만들고 종료 시 폐기")
    return sec


def guarded_check(key, title, checker, *args):
    """검사기 하나의 예상 밖 실패가 전체 Doctor 리포트를 막지 않게 한다."""
    try:
        return checker(*args)
    except Exception as exc:  # 마지막 안전망: 메시지/경로/데이터는 출력하지 않는다.
        sec = section(key, title)
        add_finding(sec, "UNKNOWN", "CHECK_INTERNAL_ERROR",
                    "검사 중 예상 밖 오류(%s); 원본 오류 문자열은 개인정보 보호를 위해 숨김" %
                    exception_name(exc))
        return sec


def render_text(report):
    lines = [
        "Everstory Doctor v%s" % VERSION,
        "generated: %s" % report["generated_at"],
        "mode: READ-ONLY · stdout report · tests in ephemeral sandbox",
        "overall: %s %s" % (STATUS_ICON[report["overall"]], report["overall"]),
        "",
    ]
    for sec in report["sections"]:
        status = section_status(sec)
        lines.append("[%s] %s %s" % (sec["title"], STATUS_ICON[status], status))
        if sec["metrics"]:
            metric_text = " · ".join("%s=%s" % (key, json.dumps(value, ensure_ascii=False))
                                     for key, value in sorted(sec["metrics"].items()))
            lines.append("  metrics: " + metric_text)
        for finding in sec["findings"]:
            lines.append("  %s %-30s %s" % (STATUS_ICON[finding["status"]], finding["code"],
                                             finding["message"]))
        lines.append("")
    counts = report["summary"]
    lines.append("summary: " + " · ".join("%s=%d" % (key, counts[key])
                                           for key in ("FAIL", "WARN", "UNKNOWN", "OK", "SKIP")))
    lines.append("Doctor는 삭제·수정·Shopify write를 수행하지 않았다.")
    return "\n".join(lines)


def build_report(root, projects_dir, markers, args, now=None):
    now = now or utcnow()
    before, before_errors = snapshot_tree(root)
    sections = [
        guarded_check("product_rules", "상품 규칙 드리프트", check_product_rules, root),
        guarded_check("projects", "주문 매니페스트·원본·누끼·출력·보존기한",
                      scan_projects, root, projects_dir, now, args.retention_days, not args.skip_hash),
        guarded_check("backup", "백업 노후도", check_backup,
                      markers, now, args.backup_warn_hours, args.backup_fail_hours),
        guarded_check("disk", "디스크 여유", check_disk, projects_dir, args.disk_warn_gb,
                      args.disk_fail_gb, args.disk_warn_percent, args.disk_fail_percent),
        guarded_check("tests", "회귀 테스트", check_tests, root, args.skip_tests),
    ]
    after, after_errors = snapshot_tree(root)
    sections.append(check_read_only(before, after, before_errors, after_errors))
    counts = {status: 0 for status in ("FAIL", "WARN", "UNKNOWN", "OK", "SKIP")}
    for sec in sections:
        for finding in sec["findings"]:
            counts[finding["status"]] += 1
    return {
        "schema_version": SCHEMA_VERSION,
        "doctor_version": VERSION,
        "generated_at": iso_utc(now),
        "read_only": True,
        "overall": overall_status(sections),
        "summary": counts,
        "sections": sections,
    }


def parse_args(argv=None):
    default_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Everstory 제작 파이프라인 읽기 전용 건강검진")
    parser.add_argument("--root", type=Path, default=default_root,
                        help="프로젝트 root (기본: doctor.py 기준 상위)")
    parser.add_argument("--projects-dir", type=Path,
                        help="projects 경로 (기본: ROOT/projects)")
    parser.add_argument("--backup-marker", type=Path, action="append", default=[],
                        help="백업 성공 시 갱신되는 marker. 여러 번 지정 가능")
    parser.add_argument("--backup-warn-hours", type=float, default=24.0)
    parser.add_argument("--backup-fail-hours", type=float, default=72.0)
    parser.add_argument("--retention-days", type=int, default=90)
    parser.add_argument("--disk-warn-gb", type=float, default=20.0)
    parser.add_argument("--disk-fail-gb", type=float, default=5.0)
    parser.add_argument("--disk-warn-percent", type=float, default=10.0)
    parser.add_argument("--disk-fail-percent", type=float, default=5.0)
    parser.add_argument("--skip-tests", action="store_true", help="회귀 테스트 실행 생략")
    parser.add_argument("--skip-hash", action="store_true", help="매니페스트 원본 SHA-256 재검증 생략")
    parser.add_argument("--json", action="store_true", help="JSON을 stdout으로 출력")
    parser.add_argument("--strict", action="store_true", help="WARN/UNKNOWN도 exit 1")
    args = parser.parse_args(argv)
    if args.retention_days <= 0:
        parser.error("--retention-days must be positive")
    if args.backup_warn_hours < 0 or args.backup_fail_hours <= args.backup_warn_hours:
        parser.error("backup fail hours must be greater than warn hours")
    if (args.disk_fail_gb < 0 or args.disk_warn_gb <= args.disk_fail_gb or
            args.disk_fail_percent < 0 or args.disk_warn_percent <= args.disk_fail_percent or
            args.disk_warn_percent > 100):
        parser.error("disk warning thresholds must be greater than failure thresholds")
    return args


def main(argv=None):
    args = parse_args(argv)
    root = args.root.resolve()
    projects_dir = (args.projects_dir or (root / "projects")).resolve()
    markers = [path.expanduser().resolve() for path in args.backup_marker]
    env_markers = os.environ.get("EVERSTORY_BACKUP_MARKERS", "")
    if env_markers:
        markers.extend(Path(value).expanduser().resolve() for value in env_markers.split(os.pathsep) if value)
    report = build_report(root, projects_dir, markers, args)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print(render_text(report))
    has_fail = report["summary"]["FAIL"] > 0
    strict_fail = args.strict and (report["summary"]["WARN"] > 0 or report["summary"]["UNKNOWN"] > 0)
    return 1 if has_fail or strict_fail else 0


if __name__ == "__main__":
    sys.exit(main())
