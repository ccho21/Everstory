#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""주소 라벨(address_lines / collect_labels / write_labels) 검증. 네트워크 없음.

주소는 한 글자만 틀려도 소포가 안 간다. 그런데 Shopify 배송지는 필드가 자주 비어
오고(company·address2·province), 캐나다 국내 우편은 **국가명 줄이 있으면 안 된다.**
빈 필드 조합을 여기서 고정한다.

  python3 label_test.py
"""

import importlib.util
import json
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))


def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


intake = _load("intake")

PASS = FAIL = 0


def t(label, got, want):
    global PASS, FAIL
    ok = got == want
    if ok:
        PASS += 1
        print("✅ %s" % label)
    else:
        FAIL += 1
        print("❌ %-46s got=%r  want=%r" % (label, got, want))


def ok(label, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print("✅ %-46s %s" % (label, detail))
    else:
        FAIL += 1
        print("❌ %-46s %s" % (label, detail))


CA = {"name": "Naekyung Seong", "address1": "123 Main St W", "address2": "Unit 4",
      "city": "Toronto", "province": "Ontario", "provinceCode": "on",
      "zip": "m5v 2t6", "country": "Canada", "countryCodeV2": "CA"}

print("\n══ address_lines — 캐나다 국내 ══")
t("4줄 (국가명 없음)", intake.address_lines(CA),
  ["Naekyung Seong", "123 Main St W", "Unit 4", "Toronto ON  M5V 2T6"])
ok("캐나다는 국가명 줄이 없다 (국제로 오분류 방지)",
   "Canada" not in intake.address_lines(CA))
t("우편번호 대문자 + 도시/주 한 줄", intake.address_lines(CA)[3], "Toronto ON  M5V 2T6")

print("\n══ address_lines — 빈 필드 조합 ══")
d = dict(CA); d["address2"] = None
t("address2 없으면 줄이 빠진다", len(intake.address_lines(d)), 3)
d = dict(CA); d["address2"] = "   "
t("address2 가 공백만이어도 빠진다", len(intake.address_lines(d)), 3)
d = dict(CA); d["company"] = "everstory studio"
t("company 는 이름 다음 줄", intake.address_lines(d)[1], "everstory studio")
d = dict(CA); d["company"] = "Naekyung Seong"
t("company 가 이름과 같으면 중복 안 넣음", len(intake.address_lines(d)), 4)
d = dict(CA); d["provinceCode"] = None
t("provinceCode 없으면 province 로 폴백",
  intake.address_lines(d)[3], "Toronto ONTARIO  M5V 2T6")
d = dict(CA); d["zip"] = None
t("우편번호 없으면 도시/주만", intake.address_lines(d)[3], "Toronto ON")
d = dict(CA); d["city"] = None; d["provinceCode"] = None; d["province"] = None
t("도시/주 없으면 우편번호만", intake.address_lines(d)[3], "M5V 2T6")
ok("배송지 자체가 없으면 None", intake.address_lines(None) is None)
ok("빈 dict 도 None", intake.address_lines({}) is None)

print("\n══ address_lines — 국제 ══")
US = {"name": "Jane Doe", "address1": "77 Bleecker St", "city": "New York",
      "provinceCode": "NY", "zip": "10012", "country": "United States", "countryCodeV2": "US"}
t("미국은 마지막 줄에 국가명", intake.address_lines(US)[-1], "United States")
d = dict(US); d["country"] = None
t("country 가 비면 국가코드로", intake.address_lines(d)[-1], "US")
d = dict(US); d["countryCodeV2"] = None
ok("국가코드가 없으면 국가명 줄을 안 붙인다 (캐나다일 수 있으므로)",
   intake.address_lines(d)[-1] == "New York NY  10012")


def _proj(tmp, folder, doc):
    os.makedirs(os.path.join(tmp, folder))
    with open(os.path.join(tmp, folder, "_order.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False)


def _fixture():
    tmp = tempfile.mkdtemp(prefix="evslbl-")
    _proj(tmp, "A EVS-2001", {"order": {"name": "EVS-2001"}, "shipping": CA})
    _proj(tmp, "B EVS-2002", {"order": {"name": "#EVS-2002"}, "shipping": US})
    _proj(tmp, "C 1001", {"order": {"name": "#1001"}})                       # 배송지 없음
    _proj(tmp, "D EVS-2003", {"order": {"name": "EVS-2003"},
                              "shipping": dict(CA, address1="")})            # 거리 주소 없음
    return tmp


print("\n══ collect_labels — 선택과 순서 ══")
tmp = _fixture()
try:
    recs, missing = intake.collect_labels(tmp)
    t("전체는 4건 다 돌려준다 (제외 판단은 write 쪽)", len(recs), 4)
    t("없는 주문 없음", missing, [])

    recs, missing = intake.collect_labels(tmp, ["EVS-2002", "EVS-2001"])
    t("지정 순서를 지킨다 (폴더 정렬로 안 바뀜)",
      [r["order"] for r in recs], ["EVS-2002", "EVS-2001"])
    recs, _ = intake.collect_labels(tmp, ["#EVS-2001"])
    t("`#` 접두사 무시", [r["order"] for r in recs], ["EVS-2001"])
    recs, _ = intake.collect_labels(tmp, ["evs-2001"])
    t("대소문자 무시", [r["order"] for r in recs], ["EVS-2001"])
    recs, missing = intake.collect_labels(tmp, ["EVS-9999"])
    t("없는 주문은 missing 으로", missing, ["EVS-9999"])
    t("없는 주문은 조용히 빠지지 않는다", len(recs), 0)
    recs, _ = intake.collect_labels(tmp, ["  ", ""])
    t("빈 항목은 무시", len(recs), 0)

    print("\n══ write_labels — .jsx 가 읽을 파일 ══")
    out = os.path.join(tmp, "labels.txt")
    intake.write_labels(tmp, out)
    body = open(out, encoding="utf-8").read()
    # 헤더 줄로 센다. 부분문자열로 보면 안 된다 — 우편번호 `10012` 안에 주문번호
    # `1001` 이 들어 있어 "제외됐다"를 거짓으로 통과시킨다 (실제로 당했다).
    heads = [l[2:] for l in body.split("\n") if l.startswith("# EVS-") or l.startswith("# 1")]
    t("배송지 있는 2건만 나간다", sorted(heads), ["EVS-2001", "EVS-2002"])
    ok("배송지 없는 주문은 빠진다", "1001" not in heads)
    ok("거리 주소 없는 주문은 빠진다", "EVS-2003" not in heads)
    ok("주석 헤더가 맨 앞", body.startswith("#"))
    blocks = [b for b in body.split("\n\n") if b.strip() and not b.startswith("# Everstory")]
    t("빈 줄로 나뉜 블록 = 라벨 수", len(blocks), 2)
    ok("블록이 서로 안 붙는다 (주소 두 건이 한 라벨로 합쳐지지 않음)",
       all(len([l for l in b.split("\n") if l.startswith("#")]) == 1 for b in blocks))
    lines = [l for l in body.split("\n") if l and not l.startswith("#")]
    ok("주소 줄에 주문번호가 안 섞임", all(not l.startswith("#") for l in lines))

    out2 = os.path.join(tmp, "one.txt")
    intake.write_labels(tmp, out2, ["EVS-2001"])
    ok("지정 1건만", open(out2, encoding="utf-8").read().count("# EVS-") == 1)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n%d/%d 통과  %s" % (PASS, PASS + FAIL, "❌" if FAIL else "✅"))
sys.exit(1 if FAIL else 0)
