#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""job 블록 백필 + 배송지 처리 검증. 네트워크 없음.

`build_job` 자체의 해석 규칙은 `sim/ordertest.js` 가 **일러스트 쪽 폴백 해석기와 교차
검증**한다 (두 벌이 갈라지면 틀린 재질로 인쇄되므로). 여기서는 파일을 실제로 오가는
부분 — 백필 왕복, 배송지 추출, 라벨 표기 — 를 본다.

  python3 job_test.py
"""

import importlib.util
import io
import json
import os
import shutil
import sys
import tempfile
from types import SimpleNamespace
from unittest.mock import patch

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("intake", os.path.join(HERE, "intake.py"))
intake = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(intake)

OK = []


def chk(name, cond, extra=""):
    OK.append(bool(cond))
    print(("✅" if cond else "❌") + " " + name + ("   " + str(extra) if extra else ""))


def write_manifest(root, folder, doc):
    d = os.path.join(root, folder)
    os.makedirs(d)
    with io.open(os.path.join(d, "_order.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(doc, ensure_ascii=False, indent=2))
    return os.path.join(d, "_order.json")


def read_json(path):
    with io.open(path, encoding="utf-8") as f:
        return json.load(f)


root = tempfile.mkdtemp(prefix="everstory_job_")
try:
    print("\n══ 배송지 추출 ══")
    addr = {"name": "Neuri Park", "firstName": "Neuri", "lastName": "Park", "company": None,
            "address1": "53 Angus Dr", "address2": None, "city": "North York",
            "province": "Ontario", "provinceCode": "ON", "zip": "M2J 2W9",
            "country": "Canada", "countryCodeV2": "CA", "phone": None}
    ship = intake.shipping_block({"shippingAddress": addr})
    chk("이름·주소·우편번호가 담긴다",
        ship["name"] == "Neuri Park" and ship["zip"] == "M2J 2W9" and ship["address1"] == "53 Angus Dr")
    chk("firstName/lastName 는 안 담는다 (name 으로 충분)",
        "firstName" not in ship and "lastName" not in ship, sorted(ship))
    chk("배송지 없는 주문은 None", intake.shipping_block({}) is None)
    chk("주소 한 줄 (빈 칸은 건너뜀)",
        intake.address_oneline(ship) == "53 Angus Dr, North York, ON, M2J 2W9, CA",
        intake.address_oneline(ship))
    chk("배송지 None 이면 '-'", intake.address_oneline(None) == "-")

    print("\n══ backfill_jobs — 기존 매니페스트에 job 채우기 (오프라인) ══")
    p1 = write_manifest(root, "Naekyung Seong EVS-1007", {
        "generated_at": "2026-08-22T00:00:00Z",
        "order": {"name": "EVS-1007", "customer": "Naekyung Seong", "email": "a@b.c"},
        "line_items": [{"index": 0, "title": "Package Full",
                        "sku": "EVS-PACKAGE-FULL-WM", "quantity": 1}],
        "options": [], "photos": [{"seq": 1, "file": "01_BIG_x.jpg"}], "warnings": [],
    })
    p2 = write_manifest(root, "Changsoo Cho 1003", {
        "order": {"name": "#1003", "customer": "Changsoo Cho"},
        "line_items": [{"index": 0, "title": "Face Sticker", "sku": None, "quantity": 1}],
        "options": [{"line_item": 0, "key": "_Name", "value": "하린"},
                    {"line_item": 0, "key": "_Photos to include (19mm)", "value": "2 photos"}],
        "photos": [{"seq": 1, "file": "01_a.jpg"}, {"seq": 2, "unavailable": True}],
        "warnings": [],
    })
    os.makedirs(os.path.join(root, "빈폴더"))          # _order.json 없음 — 건너뛰어야 한다
    write_manifest(root, "깨진주문", {"order": {"name": "EVS-9999", "customer": "Broken"}})

    intake.backfill_jobs(root)

    j1 = read_json(p1)["job"]
    chk("Package Full → package 2시트 · White Matte",
        (j1["mode"], j1["sheets"], j1["material"]) == ("package", 2, "White Matte"), j1)
    chk("사진 수는 실제 받은 것만 셈", j1["photos"] == 1, j1["photos"])
    chk("name_style 키는 늘 있다 (옵션이 없으면 빈 값)", j1.get("name_style") == "", j1.get("name_style"))

    j2 = read_json(p2)["job"]
    chk("레거시: 옵션 라벨에서 19mm", (j2["mode"], j2["size_mm"]) == ("single", 19.05), j2)
    chk("레거시: `_Name` 도 스티커 이름", j2["sticker_name"] == "하린", j2["sticker_name"])
    chk("레거시: 재질은 못 읽고 경고", j2["material"] is None and len(j2["notes"]) == 1, j2["notes"])
    chk("유실 사진은 안 셈", j2["photos"] == 1, j2["photos"])
    chk("주문번호 # 제거", j2["order"] == "1003", j2["order"])

    j3 = read_json(os.path.join(root, "깨진주문", "_order.json"))["job"]
    chk("line_items 없는 매니페스트도 안 터짐", j3["mode"] is None and len(j3["notes"]) == 2, j3["notes"])

    print("\n══ 백필은 나머지를 안 건드린다 ══")
    doc1 = read_json(p1)
    chk("photos / options / order 보존",
        doc1["photos"] == [{"seq": 1, "file": "01_BIG_x.jpg"}] and doc1["order"]["email"] == "a@b.c")
    chk("generated_at 보존 (다시 받은 것처럼 보이면 안 됨)",
        doc1["generated_at"] == "2026-08-22T00:00:00Z", doc1.get("generated_at"))
    chk("배송지는 백필로 못 채운다 (매니페스트에 없던 값)", "shipping" not in doc1)

    before = read_json(p1)["job"]
    intake.backfill_jobs(root)
    chk("두 번 돌려도 같은 결과 (멱등)", read_json(p1)["job"] == before)

    print("\n══ job_label — 콘솔 한 줄 ══")
    chk("Package", "Package 2시트" in intake.job_label(j1), intake.job_label(j1))
    chk("경고가 있으면 뒤에 붙는다", "⚠" in intake.job_label(j2), intake.job_label(j2))

    # ── 용도 팩 (Planner / Phone & Bottle / Laptop / Full Set) ──────────────
    # 팩은 버킷을 주문에서 안 받는다 — 사진 상한만 variant 로 갈리고, 인치 배정은
    # 인테이크 뒤 운영자가 한다. 그래서 여기서 고정하는 건 두 가지다:
    #   ① 새 SKU 를 읽어 pack/사진수/시트수가 나온다
    #   ② 업로드 필드 이름이 뭐든 사진으로 인식되고 unknown 경고가 안 뜬다
    print("\n══ 용도 팩 SKU ══")
    for sku, want in [
        ("EVS-FULL-8-WM", ("pack", 2, "FULL", 8)),
        ("EVS-FULL-4-TR", ("pack", 1, "FULL", 4)),
        ("EVS-PLAN-1-GD", ("pack", 1, "PLAN", 1)),
        ("EVS-PHONE-4-SV", ("pack", 1, "PHONE", 4)),
        ("EVS-LAPTOP-8-WM", ("pack", 2, "LAPTOP", 8)),
        ("EVS-NAME-5-WM", ("pack", 1, "NAME", 5)),      # Name & Photo Sticker Sheet (2026-09-19 확정 상품)
        ("EVS-NAME-5-TR", ("pack", 1, "NAME", 5)),
        ("evs-name-5-gd", ("pack", 1, "NAME", 5)),      # 대소문자 무시
    ]:
        j = intake.build_job({"order": {"name": "EVS-1010", "customer": "T"},
                              "line_items": [{"index": 0, "title": "P", "sku": sku, "quantity": 1}],
                              "options": [], "photos": []})
        got = (j["mode"], j["sheets"], j["pack"], j["photos_ordered"])
        chk("SKU %s" % sku, got == want, "%s / %s" % (got, intake.job_label(j)))

    print("\n══ 이름 스타일 옵션 (Name style → job.name_style) ══")
    def job_with(options):
        return intake.build_job({"order": {"name": "EVS-1011", "customer": "T"},
                                 "line_items": [{"index": 0, "title": "Name & Photo Sticker Sheet",
                                                 "sku": "EVS-NAME-5-WM", "quantity": 1}],
                                 "options": options,
                                 "photos": [{"file": "%02d_fixture.jpg" % n} for n in range(1, 6)]})
    jb = job_with([{"line_item": 0, "key": "Name", "value": "Mochi"},
                   {"line_item": 0, "key": "Name style", "value": "Bubble"}])
    chk("Name · Name style → sticker_name · name_style", (jb["sticker_name"], jb["name_style"]) == ("Mochi", "bubble"), jb)
    chk("라벨: 이름 뒤에 스타일, 팩 이름·사진 수·시트",
        "이름 'Mochi' · 버블" in intake.job_label(jb) and "Name & Photo 팩 · 사진 5장 · 1시트" in intake.job_label(jb),
        intake.job_label(jb))
    jr = job_with([{"line_item": 0, "key": "_Name style-1", "value": " retro "}])
    chk("접두 `_` · 접미 `-N` · 공백 · 대소문자는 무시", jr["name_style"] == "retro" and jr["sticker_name"] == "", jr)
    chk("한글 값도 읽는다", job_with([{"line_item": 0, "key": "Name style", "value": "버블"}])["name_style"] == "bubble")
    ju = job_with([{"line_item": 0, "key": "Name", "value": "Mochi"}, {"line_item": 0, "key": "Name style", "value": "Gothic"}])
    chk("모르는 값은 비우고 notes 에 남긴다 (라벨에는 안 붙음)",
        ju["name_style"] == "" and any("이름 스타일" in n for n in ju["notes"]) and "이름 'Mochi'   ⚠" in intake.job_label(ju),
        intake.job_label(ju))
    jn = job_with([{"line_item": 0, "key": "Name", "value": "Mochi"}])
    chk("NAME 스타일 옵션이 없으면 빈 값 · 확인 노트",
        jn["name_style"] == "" and jn["notes"] == ["이름 스타일 없음 — 보드에서 고를 것"], jn["notes"])
    je = job_with([{"line_item": 0, "key": "Name", "value": "  "}, {"line_item": 0, "key": "Name", "value": "Mochi"}])
    chk("빈 Name 은 건너뛰고 다음 Name 을 쓴다", je["sticker_name"] == "Mochi", je["sticker_name"])

    print("\n══ NAME 계약 확인 — 값은 보존하고 노트만 ══")
    def contract_manifest(name="MIA", style="Retro", n=5, sku="EVS-NAME-5-WM"):
        return {
            "order": {"name": "EVS-FIXTURE", "customer": "Fixture Buyer"},
            "line_items": [{"index": 0, "title": "Fixture Product", "sku": sku, "quantity": 1}],
            "options": [{"line_item": 0, "key": "Name", "value": name},
                        {"line_item": 0, "key": "Name style", "value": style}],
            "photos": [{"seq": i, "file": "%02d_fixture.jpg" % i, "bucket": None}
                       for i in range(1, n + 1)],
        }

    def has_note(job, text):
        return any(text in note for note in job["notes"])

    multi = contract_manifest()
    multi["line_items"].append({"index": 1, "title": "Fixture Product", "sku": "EVS-NAME-5-WM", "quantity": 1})
    multi["options"].extend([{"line_item": 1, "key": "Name", "value": "LEO"},
                             {"line_item": 1, "key": "Name style", "value": "Bubble"}])
    before_multi = json.dumps(multi, sort_keys=True)
    jm = intake.build_job(multi)
    chk("다른 이름이면 두 이름을 노트에 표시", has_note(jm, "이름: line item 마다 다름 (MIA / LEO)"), jm["notes"])
    chk("다른 스타일이면 두 스타일을 노트에 표시", has_note(jm, "이름 스타일: line item 마다 다름 (레트로 / 버블)"), jm["notes"])
    chk("노트를 추가해도 첫 이름·스타일·수량 보존",
        (jm["sticker_name"], jm["name_style"], jm["quantity"]) == ("MIA", "retro", 2))
    chk("원 매니페스트 불변", json.dumps(multi, sort_keys=True) == before_multi)
    multi["options"][-2]["value"] = " MIA "
    multi["options"][-1]["value"] = " 레트로 "
    same_values = intake.build_job(multi)
    chk("같은 이름은 공백을 빼고 비교", not has_note(same_values, "이름: line item 마다 다름"), same_values["notes"])
    chk("같은 스타일의 영문·한글은 충돌 아님", not has_note(same_values, "이름 스타일: line item 마다 다름"), same_values["notes"])

    for name in ("Chloé", "MIA2", "O'BRIEN", "하린"):
        j = intake.build_job(contract_manifest(name=name))
        chk("NAME 비지원 문자 확인: %s" % name,
            has_note(j, "A–Z·공백 외 글자") and j["sticker_name"] == name, j["notes"])
    j = intake.build_job(contract_manifest(name="MIA ROSE"))
    chk("영문·공백 이름은 문자 경고 없음", not has_note(j, "A–Z·공백 외 글자"), j["notes"])
    j = intake.build_job(contract_manifest(name="A" * 25))
    chk("25자는 폭 확인만 하고 이름 보존", has_note(j, "24자 초과 (25자)") and len(j["sticker_name"]) == 25, j["notes"])
    chk("24자는 길이 경고 없음", not has_note(intake.build_job(contract_manifest(name="A" * 24)), "24자 초과"))
    j = intake.build_job(contract_manifest(name="하린" * 13, sku="EVS-FACE-19-WM"))
    chk("Custom 폰트 이름에는 NAME 문자·길이 제한을 적용하지 않음", not j["notes"], j["notes"])

    for n in (4, 8):
        j = intake.build_job(contract_manifest(n=n))
        chk("NAME 후보 %d장은 확인 노트" % n, has_note(j, "사진 %d장 — Name & Photo 는 5–7장" % n), j["notes"])
    for n in (5, 6, 7):
        j = intake.build_job(contract_manifest(n=n))
        chk("NAME 후보 %d장은 정상" % n, not has_note(j, "Name & Photo 는 5–7장") and j["photos_ordered"] == 5, j["notes"])
    j = intake.build_job(contract_manifest(n=8, sku="EVS-FULL-8-WM"))
    chk("옛 FULL 팩에는 NAME 후보 제한 없음", not j["notes"] and j["sheets"] == 2, j["notes"])
    missing_download = contract_manifest()
    missing_download["photos"][-1].update(file=None, unavailable=True)
    j = intake.build_job(missing_download)
    chk("다운로드 실패 사진은 수에서 빼고 확인", j["photos"] == 4 and has_note(j, "사진 4장"), j["notes"])

    old_properties = contract_manifest()
    old_properties["photos"][0]["bucket"] = "BIG"
    j = intake.build_job(old_properties)
    chk("NAME 에 남은 Package 사진 속성 경고", has_note(j, "구 Package 속성"), j["notes"])
    chk("일반 NAME 업로드는 Package 경고 없음", not has_note(intake.build_job(contract_manifest()), "구 Package 속성"))
    old_properties["line_items"][0]["sku"] = "EVS-PACKAGE-FULL-WM"
    chk("옛 Package 의 버킷은 정상", not intake.build_job(old_properties)["notes"])
    j = intake.build_job(contract_manifest(name="  "))
    chk("NAME 빈 이름은 필수 확인", has_note(j, "이름 없음") and j["sticker_name"] == "", j["notes"])
    chk("NAME 이름이 있으면 누락 경고 없음", not has_note(intake.build_job(contract_manifest()), "이름 없음"))
    j = intake.build_job(contract_manifest(style=""))
    chk("NAME 빈 스타일은 확인 노트", j["notes"] == ["이름 스타일 없음 — 보드에서 고를 것"], j["notes"])
    chk("NAME 스타일이 있으면 누락 경고 없음", not has_note(intake.build_job(contract_manifest()), "이름 스타일 없음"))
    j = intake.build_job(contract_manifest(style="Gothic"))
    chk("모르는 스타일은 기존 경고 하나만 유지", len(j["notes"]) == 1 and has_note(j, "모르는 값 'Gothic'"), j["notes"])
    j = intake.build_job(contract_manifest(name="", style="", sku="EVS-FACE-19-WM"))
    chk("Custom 빈 이름·스타일에 NAME 필수 경고 없음", not j["notes"], j["notes"])

    gift_manifest = contract_manifest()
    gift_manifest["shipping"] = {"name": " Fixture Recipient "}
    j = intake.build_job(gift_manifest)
    chk("선물이면 받는 사람을 노트로만 표시",
        j["customer"] == "Fixture Buyer" and j["notes"] == ["선물 — 받는 사람 Fixture Recipient (헤더 이름 확인)"], j["notes"])
    gift_manifest["shipping"]["name"] = " Fixture Buyer "
    chk("같은 수취인(앞뒤 공백 무시)이면 선물 아님", not intake.build_job(gift_manifest)["notes"])
    gift_manifest["shipping"]["name"] = "   "
    chk("빈 수취인이면 선물 경고 없음", not intake.build_job(gift_manifest)["notes"])
    chk("배송지 없으면 선물 경고 없음", not intake.build_job(contract_manifest())["notes"])

    print("\n══ process_order — shipping 이 잡티켓 생성 전에 반영됨 ══")
    fixture_order = {
        "name": "EVS-SYNTHETIC-GIFT", "customer": {"firstName": "Fixture", "lastName": "Buyer"},
        "shippingAddress": {"name": "Fixture Recipient"},
        "lineItems": {"nodes": [{"title": "Fixture Product", "sku": "EVS-NAME-5-WM", "quantity": 1,
            "customAttributes": [{"key": "Name", "value": "MIA"}, {"key": "Name style", "value": "Retro"}] +
                [{"key": "Your photos-%d" % i, "value": "https://example.invalid/fixture-%d.jpg" % i}
                 for i in range(1, 6)]}]},
    }
    args = SimpleNamespace(folder="Synthetic Gift", dry_run=False, force=False)
    # 다운로드 경계만 대체한다. 실제 Shopify/CDN 은 호출하지 않고 임시 폴더에 합성 바이트만 쓴다.
    with patch.object(intake, "download", return_value=(b"\xff\xd8\xffsynthetic fixture", {})) as download_stub:
        with patch("sys.stdout", new=io.StringIO()):
            result = intake.process_order(fixture_order, args, root)
    gift_doc = read_json(os.path.join(root, args.folder, "_order.json"))
    chk("process_order 합성 다운로드 5회·성공", result is True and download_stub.call_count == 5)
    chk("처음 기록한 job 에 선물 노트 포함", gift_doc["job"]["notes"] == ["선물 — 받는 사람 Fixture Recipient (헤더 이름 확인)"], gift_doc["job"]["notes"])
    chk("shipping·고객·사진 계약 값 보존",
        gift_doc["shipping"]["name"] == "Fixture Recipient" and gift_doc["job"]["customer"] == "Fixture Buyer"
        and gift_doc["job"]["photos"] == 5 and gift_doc["job"]["sticker_name"] == "MIA")

    print("\n══ 구 SKU 회귀 (팩 정규식이 안 삼켰나) ══")
    for sku, want in [
        ("EVS-PACKAGE-FULL-WM", ("package", None, 2, None)),
        ("EVS-PACKAGE-MINI-SV", ("package", None, 1, None)),
        ("EVS-FACE-19-WM", ("single", 19.05, None, None)),
        ("EVS-FULLBODY-MIX-WM", ("all", None, None, None)),
    ]:
        chk("SKU %s 그대로" % sku, intake.size_from_sku(sku) == want, intake.size_from_sku(sku))

    print("\n══ 팩 업로드 필드 — 이름 접미사에 안 묶인다 ══")
    # Easify 는 최대 파일 수를 필드 단위로만 잡는다 → Photos variant 마다 필드가 따로 있고
    # property 키가 갈린다. 접미사 형식을 못 박으면 이름을 바꾸는 순간 사진이 조용히 샌다.
    # property 키 = 옵션의 **내부 이름**(화면 라벨 아님). 라벨만 고치고 내부 이름을 그대로
    # 두면 Easify 기본값 `File upload-1` 이 키가 된다 — 그것도 사진으로 받아야 한다.
    for key in ["Your photos", "Your photos (1)", "Your photos (4)", "Your photos (8)",
                "Your photos 8", "Your photos - 4",
                "File upload-1", "File upload-2", "File upload"]:
        norm, _ = intake.split_key(key)
        bucket, known = intake.bucket_for_key(norm)
        chk("'%s' = 사진 · 버킷 없음" % key, known and bucket is None, (bucket, known))
    chk("모르는 키는 여전히 unknown", intake.bucket_for_key("gift wrap") == (None, False))

    order = {"lineItems": {"nodes": [{
        "title": "Full Set", "sku": "EVS-FULL-8-WM", "quantity": 1,
        "customAttributes": [
            {"key": "Your photos (8)", "value": "https://cdn.tigren.com/uploads/a-IMG_1.jpg"},
            {"key": "Your photos (8)-2", "value": "https://cdn.tigren.com/uploads/a-IMG_2.jpg"},
            {"key": "Which photo should be biggest? (optional)", "value": "the one with the hat"},
            {"key": "_tpo_add_by", "value": "x"}]}]}}
    photos, options, unknown = intake.parse_photos(order)
    chk("사진 2장 수집", len(photos) == 2, [p["property"] for p in photos])
    chk("unknown 경고 없음", unknown == [], unknown)
    chk("버킷·토큰 없음 (운영자가 배정)",
        all(p["bucket"] is None and p["token"] is None for p in photos))
    chk("파일명에 토큰 안 붙음",
        intake.target_filename(photos[0], "jpg") == "01_a-IMG_1.jpg",
        intake.target_filename(photos[0], "jpg"))
    chk("노트는 사진이 아니라 옵션으로",
        any((o["key"] or "").startswith("Which photo") for o in options))

finally:
    shutil.rmtree(root, ignore_errors=True)

passed = sum(1 for x in OK if x)
print("\n%d/%d 통과  %s" % (passed, len(OK), "✅" if passed == len(OK) else "❌"))
sys.exit(0 if passed == len(OK) else 1)
