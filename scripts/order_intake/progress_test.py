#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""진행 표시(project_progress / fill_progress / summary_note) 검증. 네트워크 없음.

진행 열은 별도 상태 저장소 없이 **폴더만 보고** 만든다. 그래서 폴더 규약이 조금만
어긋나도 (페어 한쪽만 있음, 대소문자, 한글 NFD) 보드가 조용히 거짓말을 한다.
임시 폴더에 실제 파일을 만들어 그 경계를 고정한다.

  python3 progress_test.py
"""

import importlib.util
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
webui = _load("webui")

OK = []


def chk(name, cond, extra=""):
    OK.append(bool(cond))
    print(("✅" if cond else "❌") + " " + name + ("   " + str(extra) if extra else ""))


def make_project(root, name, originals=(), cutouts=(), sheets=()):
    d = os.path.join(root, name)
    for sub, files in (("01_original", originals), ("02_cutout", cutouts), ("03_output", sheets)):
        os.makedirs(os.path.join(d, sub))
        for f in files:
            open(os.path.join(d, sub, f), "w").close()
    return d


def pair(base):
    return [base + "_clean.psd", base + "_sil.png"]


root = tempfile.mkdtemp(prefix="everstory_progress_")
try:
    print("\n══ project_progress — 폴더에서 단계를 읽는다 ══")

    # 받기만 함 — 누끼 전
    p = intake.project_progress(make_project(root, "A", originals=["01_BIG_IMG_1.jpg", "02_MED_IMG_2.jpeg"]))
    chk("사진만 있으면 pairs/sheets 0", p == {"originals": 2, "pairs": 0, "sheets": 0}, p)

    # 절반만 누끼
    p = intake.project_progress(make_project(
        root, "B", originals=["01_BIG_a.jpg", "02_MED_b.jpg", "03_SML_c.jpg"],
        cutouts=pair("B_01_BIG")))
    chk("일부만 누끼되면 그만큼만", p["pairs"] == 1 and p["originals"] == 3, p)

    # 페어 한쪽만 있으면 세지 않는다 — Phase B 가 못 쓰는 디자인이다
    p = intake.project_progress(make_project(
        root, "C", originals=["01_a.jpg", "02_b.jpg"],
        cutouts=pair("C_01") + ["C_02_clean.psd"]))
    chk("_sil.png 없는 _clean.psd 는 페어 아님", p["pairs"] == 1, p)
    p = intake.project_progress(make_project(
        root, "C2", originals=["01_a.jpg"], cutouts=["C2_01_sil.png"]))
    chk("_clean.psd 없는 _sil.png 도 페어 아님", p["pairs"] == 0, p)

    # 시트까지 나옴 (다중 시트)
    p = intake.project_progress(make_project(
        root, "D", originals=["01_a.jpg"], cutouts=pair("D_01"),
        sheets=["20260824_101500_PKG_sheet01.ai", "20260824_101500_PKG_sheet02.ai"]))
    chk("시트는 .ai 개수", p == {"originals": 1, "pairs": 1, "sheets": 2}, p)

    # 사진이 전부 유실된 주문 — 셀 것이 없다
    p = intake.project_progress(make_project(root, "E"))
    chk("빈 폴더는 전부 0", p == {"originals": 0, "pairs": 0, "sheets": 0}, p)
    chk("없는 폴더도 터지지 않음",
        intake.project_progress(os.path.join(root, "__nope__")) ==
        {"originals": 0, "pairs": 0, "sheets": 0})

    # 한글 파일명 — macOS listdir 은 NFD 로 준다. 양쪽이 같은 listdir 이라 매칭돼야 한다.
    p = intake.project_progress(make_project(
        root, "F", originals=["01_사진.jpg"], cutouts=pair("로운_01_S")))
    chk("한글 파일명 페어 매칭", p["pairs"] == 1 and p["originals"] == 1, p)

    # 세지 말아야 할 것들
    p = intake.project_progress(make_project(
        root, "G", originals=["01_a.jpg", "메모.txt", ".DS_Store"],
        cutouts=pair("G_01") + ["_cutcache"],
        sheets=["20260824_ALL_sheet01.ai", "note.txt", ".DS_Store"]))
    chk("사진 아닌 파일·점파일 제외", p == {"originals": 1, "pairs": 1, "sheets": 1}, p)

    print("\n══ fill_progress — 표의 두 칸 ══")

    def cells(o, pr, sh):
        r = {}
        webui.fill_progress(r, {"originals": o, "pairs": pr, "sheets": sh})
        return r

    r = cells(3, 0, 0)
    chk("누끼 0/3 = 대기", (r["cutText"], r["cutKind"]) == ("0/3", "wait"), r["cutText"])
    chk("누끼 전이면 시트는 대기 아님", r["sheetKind"] == "none", r["sheetKind"])
    r = cells(3, 3, 0)
    chk("누끼 끝 = ok", (r["cutText"], r["cutKind"]) == ("3/3", "ok"))
    chk("누끼 끝나야 시트 대기", r["sheetKind"] == "wait")
    r = cells(3, 1, 0)
    chk("누끼가 덜 끝났으면 시트는 대기로 안 셈 (한 주문 = 할 일 하나)",
        (r["cutKind"], r["sheetKind"]) == ("wait", "none"), r["sheetKind"])
    r = cells(3, 3, 2)
    chk("시트 나오면 개수 + ok", (r["sheetText"], r["sheetKind"]) == ("2", "ok"))
    r = cells(3, 4, 1)
    chk("페어가 사진보다 많아도 ok (일부러 여러 번 자른 경우)", r["cutKind"] == "ok", r["cutText"])
    r = cells(0, 0, 0)
    chk("사진 0장은 대기가 아니라 '—'",
        (r["cutKind"], r["sheetKind"]) == ("none", "none"), r["cutText"])

    print("\n══ summary_note — 지금 손볼 것 ══")

    def row(kind, o, pr, sh):
        r = {"kind": kind}
        webui.fill_progress(r, {"originals": o, "pairs": pr, "sheets": sh})
        return r

    rows = [row("new", 0, 0, 0), row("done", 5, 0, 0), row("done", 5, 5, 0), row("done", 5, 5, 1)]
    note = webui.summary_note(rows)
    chk("단계별 대기 건수가 다 나온다",
        note == "주문 4건 · 안 받음 1 · 누끼 대기 1 · 시트 대기 1", note)

    # CDN 만료로 사진이 0장인 주문은 영영 못 받는다 — 대기 목록에 상주하면 안 된다.
    lost = [row("lost", 0, 0, 0), row("done", 2, 2, 1)]
    chk("유실 주문은 대기로 안 셈", webui.summary_note(lost) == "주문 2건 · 전부 처리됨",
        webui.summary_note(lost))
    chk("할 일 없으면 그렇게 말함",
        webui.summary_note([row("done", 1, 1, 1)]) == "주문 1건 · 전부 처리됨")

    print("\n══ progress_label — CLI --list 표기 ══")
    chk("사진 0장은 —", intake.progress_label({"originals": 0, "pairs": 0, "sheets": 0}) == "—")
    chk("시트 전", intake.progress_label({"originals": 3, "pairs": 3, "sheets": 0}) == "누끼 3/3 · 시트 —",
        intake.progress_label({"originals": 3, "pairs": 3, "sheets": 0}))
    chk("시트 후", intake.progress_label({"originals": 3, "pairs": 3, "sheets": 2}) == "누끼 3/3 · 시트 2")

finally:
    shutil.rmtree(root, ignore_errors=True)

passed = sum(1 for x in OK if x)
print("\n%d/%d 통과  %s" % (passed, len(OK), "✅" if passed == len(OK) else "❌"))
sys.exit(0 if passed == len(OK) else 1)
