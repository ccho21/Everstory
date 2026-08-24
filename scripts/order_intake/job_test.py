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

finally:
    shutil.rmtree(root, ignore_errors=True)

passed = sum(1 for x in OK if x)
print("\n%d/%d 통과  %s" % (passed, len(OK), "✅" if passed == len(OK) else "❌"))
sys.exit(0 if passed == len(OK) else 1)
