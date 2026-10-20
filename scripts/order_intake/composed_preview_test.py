#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""'구성' 화면(Composed 미리보기) 백엔드 검증. 네트워크 없음 (127.0.0.1 임시 서버만).

미리보기는 Everstory_range.jsx 엔진을 브라우저에서 그대로 돌린다. 여기서는 그 앞뒤를 고정한다:
  · engine_js 추출이 sim/extract_all.js 와 같은 심볼을 뽑고 같은 배치를 내는지 (node 가 있으면 실제로 돌려 비교)
  · 백엔드 상수(종류·재질·테두리·이름 스타일)가 .jsx 와 같은지 · 이름·데코 미리보기 그림이 치수표·데코 순서와 맞는지
  · 폴더·페어·캐시 읽기의 경계 — 경로 조작, 한쪽만 있는 페어, NFD 한글, 캐시 지문 불일치, 손상 캐시
  · 'Illustrator 에서 만들기' 요청 검사와 launch 값 (Illustrator 는 부르지 않는다 — launch_illustrator 를 바꿔 끼운다)
  · HTTP 라우트 — 토큰, 404, 썸네일 캐시 헤더, 같은 요청 연타

  python3 composed_preview_test.py
"""

import importlib.util
import json
import os
import re
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import threading
import time
import unicodedata
import urllib.error
import urllib.request
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RANGE_JSX = os.path.join(ROOT, "Everstory_range.jsx")


def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


cp = _load("composed_preview")
webui = _load("webui")

OK = []
SKIPPED = []


def chk(name, cond, extra=""):
    OK.append(bool(cond))
    print(("✅" if cond else "❌") + " " + name + ("   " + str(extra) if extra else ""))


def skip(name, reason):
    SKIPPED.append(name)
    print("⏭ " + name + "   " + reason)


def png_bytes(w, h, box):
    """RGBA PNG — box 안만 불투명 (실루엣 흉내)."""
    rows = bytearray()
    for y in range(h):
        rows.append(0)
        for x in range(w):
            inside = box[0] <= x < box[2] and box[1] <= y < box[3]
            rows += bytes((20, 20, 20, 255)) if inside else bytes((0, 0, 0, 0))

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)) +
            chunk(b"IDAT", zlib.compress(bytes(rows))) + chunk(b"IEND", b""))


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb" if isinstance(data, bytes) else "w", **({} if isinstance(data, bytes) else {"encoding": "utf-8"})) as f:
        f.write(data)


HAVE_SIPS = os.path.exists("/usr/bin/sips")


def psd_bytes(w, h):
    """PSD v1 — RGB 3채널·8비트·비압축 합성 이미지. 레이어/고객 사진 없음.

    Adobe PSD 명세: https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/
    PNG→PSD 쓰기를 지원하지 않는 sips 환경에서도 정상 입력을 만든다.
    """
    header = struct.pack(">4sH6sHIIHH", b"8BPS", 1, b"\x00" * 6, 3, h, w, 8, 3)
    sections = struct.pack(">IIIH", 0, 0, 0, 0)  # 색상 정보·리소스·레이어 없음, raw 압축 코드
    return header + sections + b"\x14" * (w * h * 3)


def make_pair(cut, base, w=40, h=60):
    sil = os.path.join(cut, base + "_sil.png")
    write(sil, png_bytes(w, h, (5, 6, 35, 54)))
    psd = os.path.join(cut, base + "_clean.psd")
    write(psd, psd_bytes(w, h))
    return sil, psd


def evcut(cache, base, sil, sig="SIG", info="0.125,0.1,0.75,0.8", src=None, subs=True):
    lines = ["EVCUT1", "sig=" + sig, "src=" + (src if src is not None else cp.fingerprint(sil)), "info=" + info]
    if subs:
        lines.append("S=1|1,2,1,2,1,2,1;3,4,3,4,3,4,1")
    write(os.path.join(cache, base + ".evcut"), "\n".join(lines))


def evface(cache, base, psd, probe="ok|1|0,0,0,0.6|1|0", kind="", src=None):
    text = "EVFACE1\nsrc=%s\nprobe=%s\n" % (src if src is not None else cp.fingerprint(psd), probe)
    if kind:
        text += "type=%s\n" % kind
    write(os.path.join(cache, base + ".evface"), text)


root = tempfile.mkdtemp(prefix="composed-preview-test-")
cache_root = tempfile.mkdtemp(prefix="composed-preview-cache-")
cp.CACHE_DIR = cache_root
webui.composed.CACHE_DIR = cache_root  # webui는 별도 모듈 인스턴스를 사용한다.
srv = None
server_thread = None
try:
    NODE = shutil.which("node")
    NFD_HARIN = unicodedata.normalize("NFD", "하린")

    print("══ 엔진 추출 = sim/extract_all.js ══")
    src = open(RANGE_JSX, encoding="utf-8").read()
    js = cp.extract_engine(src)
    names_py = re.search(r"return \{ (.*) \};\n\}\)\(\);\s*$", js).group(1).split(", ")
    names_py = [n.split(":")[0] for n in names_py]
    need = ["_packComposed", "_composedDeal", "_composedHero", "_composedPackExtras", "_composedNameType",
            "_composedCutAspect", "_composedClassify", "_composedParseProbe", "_traceSignature",
            "_nameStyle", "_artLetterBoxes", "_artLetterPaint", "_letterBlockSpec", "_composedDecoStart", "_composedVariants",
            "COMPOSED_NAME_STYLES", "LETTER_ART_METRICS_V2", "LETTER_ART_PAINTS_V2", "DECO_ORDER_V2",
            "DECO_BUBBLES_V1", "DECO_BUBBLES_V2", "COMPOSED_BUBBLE_MAX",
            "COMPOSED_PREVIEW_BODY_MM", "COMPOSED_SHOT_TYPES", "MATERIAL_OPTIONS", "CUT_MARGIN_VALUES", "TRACE_OPTS"]
    chk("미리보기에 필요한 함수·상수가 다 들어 있다", all(n in names_py for n in need),
        ", ".join(n for n in need if n not in names_py) or "%d 심볼" % len(names_py))
    chk("engine_js 는 파일이 안 바뀌면 다시 뽑지 않는다", cp.engine_js(RANGE_JSX) is cp.engine_js(RANGE_JSX))
    sig = None
    if NODE:
        tmp_node = os.path.join(root, "_node")
        os.makedirs(tmp_node)
        node_mod = os.path.join(tmp_node, "range_node.js")
        subprocess.run([NODE, os.path.join(ROOT, "sim", "extract_all.js"), RANGE_JSX, node_mod],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        exp = re.search(r"module\.exports = \{ (.*) \};", open(node_mod, encoding="utf-8").read()).group(1)
        names_node = [n.split(":")[0] for n in exp.split(", ")]
        chk("추출 심볼이 node 추출기와 같다 (순서까지)", names_node == names_py, "%d / %d" % (len(names_py), len(names_node)))
        eng = os.path.join(tmp_node, "engine.js")
        write(eng, js)
        probe = os.path.join(tmp_node, "same.js")
        write(probe, r"""
const fs = require('fs');
globalThis.window = globalThis;
globalThis.RGBColor = function () {};
(0, eval)(fs.readFileSync(process.argv[2], 'utf8'));
const E = window.EverstoryComposed, P = require(process.argv[3]), M = P.MM_TO_PT;
const pairs = [[0.38, 'full'], [0.79, 'face'], [0.85, 'upper'], [1.03, 'face'], [0.66, 'full'], [0.97, 'upper'], [0.8, 'face']]
  .map(([a, t], i) => ({ base: 'B' + i, aspect: a, cutAspect: a, shotType: t }));
function run(X) {
  const hero = X._composedHero('LUCKY', 142 * M, 1.5 * M);
  const plan = X._composedDeal(pairs.map(p => X._composedTypeMax(p.shotType)), 1);
  return plan.map(sh => {
    const r = X._packComposed(sh.photos.map(i => pairs[i]), sh.photos.indexOf(sh.main), 142 * M, 172 * M, 1.5 * M,
      X._composedPackExtras(hero.spec, 1 * M));
    return { photos: sh.photos, main: sh.main, placed: r.placed.map(a => [a.photo, a.inch, +a.x.toFixed(4), +a.y.toFixed(4)]),
             decos: r.decos.map(d => [+d.x.toFixed(4), +d.y.toFixed(4)]), name: r.nameBox };
  });
}
const a = run(E), b = run(P);
// 배치 선택 + 크기 직접 — 스타일·이름 위치·좌우 바꿈·섞기와 sizeRange 가 두 추출본에서 같은 판·같은 지문
function run2(X) {
  const hero = X._composedHero('LUCKY', 142 * M, 1.5 * M);
  const ps = pairs.map((p, i) => i === 1 ? Object.assign({}, p, { sizeRange: [1.5, 2.5] }) : p);
  const plan = X._composedDeal(ps.map(p => X._composedPairMaxIn(p)), 1);
  return plan.map((sh, s) => {
    const lay = s ? { style: 'cluster', namePos: 'right', mirror: false, seed: 5 } : { style: 'sides', namePos: 'center', mirror: true, seed: 0 };
    const r = X._packComposed(sh.photos.map(i => ps[i]), sh.photos.indexOf(sh.main), 142 * M, 172 * M, 1.5 * M,
      X._composedPackExtras(hero.spec, 1 * M, lay));
    return { sig: r.sig, layout: r.layout, placed: r.placed.map(a => [a.photo, a.inch, +a.x.toFixed(4), +a.y.toFixed(4)]) };
  });
}
const c = run2(E), d = run2(P);
// 이름 스타일 버블 — 이름 박스(흰 테두리·칼선 여백 포함)·글자 자리·데코(스타일·안쪽 여백)가 두 추출본에서 같다
function run3(X) {
  const hero = X._composedHero('Vivian Liz', 142 * M, 1.5 * M, 'bubble');
  const r = X._packComposed(pairs.slice(0, 5), 0, 142 * M, 172 * M, 1.5 * M, X._composedPackExtras(hero.spec, 1 * M));
  return { sig: r.sig, style: r.nameStyle, pad: r.namePad, name: r.nameBox,
           decos: r.decos.map(dd => [dd.payload.deco, dd.payload.style, dd.payload.pad]),
           letters: X._artLetterBoxes(hero.spec).map(b => [b.ch, b.variant, +b.x.toFixed(4), +b.y.toFixed(4), +b.w.toFixed(4), b.group]),
           small: r.name2Spec ? X._artLetterBoxes(r.name2Spec).map(b => [b.ch, b.variant, +b.x.toFixed(4), b.group]) : [] };
}
const e3 = run3(E), p3 = run3(P);
// 여러 시트 — 시트 번호마다 데코 시작 자리가 달라지고(변형 줄 포함) 두 추출본이 같은 모양을 고른다
function run4(X) {
  const hero = X._composedHero('Harin', 142 * M, 1.5 * M, 'bubble');
  return [0, 1, 2].map(s => {
    const vs = X._composedVariants(pairs.slice(s, s + 4), 0, 142 * M, 172 * M, 1.5 * M, hero.spec, 1 * M, 'center', 'center', s);
    return vs.map(v => [v.kind, v.res.sig, v.res.decoStart, v.res.decos.map(dd => dd.payload.deco).join(' ')]);
  });
}
const e4 = run4(E), p4 = run4(P);
console.log(JSON.stringify({ same: JSON.stringify(a) === JSON.stringify(b), sheets: a.length,
  stickers: a.map(s => s.placed.length), sig: E._traceSignature(), body: E.COMPOSED_PREVIEW_BODY_MM,
  sameLayouts: JSON.stringify(c) === JSON.stringify(d), sigs: c.map(s => s.sig),
  sameBubble: JSON.stringify(e3) === JSON.stringify(p3), bubble: e3,
  sameSheets: JSON.stringify(e4) === JSON.stringify(p4), sheetDecos: e4.map(vs => vs[0]) }));
""")
        out = subprocess.run([NODE, probe, eng, node_mod], capture_output=True, text=True)
        res = json.loads(out.stdout.strip().splitlines()[-1]) if out.returncode == 0 and out.stdout.strip() else {}
        chk("브라우저용 엔진과 node 추출본이 같은 판을 낸다 (사진 7장 → 2시트)", res.get("same") is True,
            out.stderr.strip()[-200:] or "시트 %s · 스티커 %s" % (res.get("sheets"), res.get("stickers")))
        chk("배치 선택·크기 직접도 두 추출본이 같은 판·같은 지문", res.get("sameLayouts") is True and
            all(re.match(r"^[0-9a-f]{1,16}$", s) for s in res.get("sigs") or ["?"]), res.get("sigs"))
        bub = res.get("bubble") or {}
        # 2026-09-23: 첫 이름 = 떨어진 글자(옆 장식 없음) · 작은 이름 = 붙인 글자(맨 앞 V 는 왼쪽 장식)
        chk("이름 스타일 버블도 두 추출본이 같은 판 (이름 박스 · 글자 자리 · 데코 스타일 · 첫 이름 떨어진 글자 · 작은 이름 붙인 글자)",
            res.get("sameBubble") is True and bub.get("style") == "bubble" and bub.get("pad", 0) > 0 and
            all(dd[1] == "bubble" and dd[2] > 0 for dd in bub.get("decos") or [["?", "", 0]]) and
            [x[0] + x[1] for x in bub.get("letters") or []][:3] == ["Vcore", "Icore", "Vcore"] and
            [x[0] + x[1] for x in bub.get("small") or []][:1] == ["VL"],
            "데코 %s · 글자 %s · 작은 이름 %s" % ([dd[0] for dd in bub.get("decos") or []], [x[0] + x[1] for x in bub.get("letters") or []],
                                         [x[0] + x[1] for x in bub.get("small") or []]))
        chk("버블 글자 색 그룹도 두 추출본이 같다 (VIVIAN LIZ = 흰·노랑·흰·하늘·분홍·노랑 / 하늘·흰·분홍)",
            [x[5] for x in bub.get("letters") or []] == ["LTR V", "LTR I", "LTR V", "LTR I SKY", "LTR A PINK", "LTR N YELLOW",
                                                        "LTR L SKY", "LTR I WHITE", "LTR Z"],
            [x[5] for x in bub.get("letters") or []])
        sd = res.get("sheetDecos") or []
        # 두들 12종에 시트마다 6칸씩 밀면 시트 3 은 시트 1 자리로 돌아온다 (13종일 때도 5/6 이 겹쳤다) —
        # 지키는 것은 "이웃한 두 시트가 안 겹친다" 이므로 시작 자리는 2가지 이상이면 된다.
        chk("여러 시트 — 시트마다 데코 시작 자리가 밀리고 이웃 시트끼리 모양이 안 겹친다 (두 추출본 동일)",
            res.get("sameSheets") is True and len(sd) == 3 and len(set(x[2] for x in sd)) >= 2 and
            not set(sd[0][3].split()) & set(sd[1][3].split()), [(x[2], x[3]) for x in sd])
        sig = res.get("sig")
        chk("미리보기 body 상수 = 템플릿 실측 142 × 175mm", res.get("body") == [142, 175], res.get("body"))
    else:
        print("   (node 없음 — 엔진 교차 실행은 건너뜀)")

    print("\n══ 백엔드 상수 = .jsx 상수 ══")
    mat = json.loads(re.search(r"var MATERIAL_OPTIONS = (\[.*?\]);", src).group(1))
    cut = json.loads(re.search(r"var CUT_MARGIN_VALUES = (\[.*?\]);", src).group(1))
    block = re.search(r"var COMPOSED_SHOT_TYPES = \[(.*?)\n  \];", src, re.S).group(1)
    kinds = re.findall(r'key: "(\w+)"', block) + [re.search(r'var COMPOSED_TYPE_NONE = "(\w+)";', src).group(1)]
    chk("재질", tuple(mat) == cp.MATERIALS, mat)
    chk("흰 테두리 값", tuple(cut) == cp.CUT_MARGINS, cut)
    chk("사진 종류 키", tuple(kinds) == cp.TYPE_KEYS, kinds)
    styles = re.findall(r'key: "(\w+)"', re.search(r"var COMPOSED_STYLES = \[(.*?)\n  \];", src, re.S).group(1))
    poses = json.loads(re.search(r"var COMPOSED_NAME_POSITIONS = (\[.*?\]);", src).group(1))
    smax = int(re.search(r"var COMPOSED_SHUFFLE_MAX = (\d+);", src).group(1))
    grades = json.loads(re.search(r"var COMPOSED_GRADES_IN = (\[.*?\]);", src).group(1))
    chk("배치 스타일 · 이름 위치 · 섞기 상한 · 크기 사다리",
        tuple(styles) == cp.STYLE_KEYS and tuple(poses) == cp.NAME_POSITIONS and smax == cp.SHUFFLE_MAX and
        tuple(grades) == cp.GRADES_IN, (styles, poses, smax, grades))
    name_block = re.search(r"var COMPOSED_NAME_STYLES = \[(.*?)\n  \];", src, re.S).group(1)
    name_styles = re.findall(r'\{ key: "(\w+)"', name_block)
    chk("이름 스타일 키", tuple(name_styles) == cp.NAME_STYLE_KEYS, name_styles)
    copies_max = int(re.search(r"var COMPOSED_COPIES_MAX = (\d+);", src).group(1))
    chk("장수 상한 최대값", copies_max == cp.COPIES_MAX, copies_max)

    print("\n══ 이름·데코 미리보기 그림 (templates/art_preview) ══")
    # range.jsx 가 쓰는 라이브러리·글자·옆 장식·데코 순서마다 그림이 있어야 한다 (없으면 화면이 대략 모양으로 그린다).
    idx = cp.art_index()
    libs = re.findall(r'letterLib: (?:"([\w.]+)"|(\w+)), decoLib: (?:"([\w.]+)"|(\w+))', name_block)
    consts = dict(re.findall(r'var (LETTER_ART_LIB_NAME|DECO_ART_LIB_NAME) = "([\w.]+)";', src))
    missing = []
    for lq, lc, dq, dc in libs:
        for f in (lq or consts[lc], dq or consts[dc]):
            if f[:-3] not in idx:
                missing.append(f)
    v2 = re.search(r"var LETTER_ART_METRICS_V2 = \{(.*?)\n  \};", src, re.S).group(1)
    for ch, body in re.findall(r"^    ([A-Z]): \{ (.*) \},?$", v2, re.M):
        for part in re.findall(r"\b(core|L|R): \{", body):
            nm = "LTR_" + ch + ("" if part == "core" else "_" + part)
            if nm not in idx.get("alphabet_art_v2", {}):
                missing.append(nm)
    # 색 그룹 (첫 색 = 원래 그룹이라 그림 이름에 색이 안 붙는다) × 옆 장식
    paints = re.search(r"var LETTER_ART_PAINTS_V2 = \{(.*?)\n  \};", src, re.S).group(1)
    sides = dict((ch, re.findall(r"\b(L|R): \{", body)) for ch, body in re.findall(r"^    ([A-Z]): \{ (.*) \},?$", v2, re.M))
    painted = 0
    for ch, cols in re.findall(r'^    ([A-Z]): \[(.*)\],?$', paints, re.M):
        for col in re.findall(r'"(\w+)"', cols)[1:]:
            for side in [""] + sides.get(ch, []):
                nm = "LTR_%s_%s%s" % (ch, col, "_" + side if side else "")
                painted += 1
                if nm not in idx.get("alphabet_art_v2", {}):
                    missing.append(nm)
    chk("색 표의 색 그룹마다 그림이 있다 (옆 장식 포함 %d장)" % painted, painted == 77 and not [m for m in missing if "_" in m[6:]],
        ", ".join(missing[:8]))
    for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        if "LTR_" + ch not in idx.get("alphabet_art_v1", {}):
            missing.append("v1 LTR_" + ch)
    for const, lib in (("DECO_ORDER", "deco_art_v1"), ("DECO_ORDER_V2", "deco_art_v2")):
        order = re.findall(r'"(\w+)"', re.search(r"var %s = \[(.*?)\n  \];" % const, src, re.S).group(1))
        missing += ["%s DECO_%s" % (lib, n) for n in order if "DECO_" + n not in idx.get(lib, {})]
    bubbles = 0
    for const, lib in (("DECO_BUBBLES_V1", "deco_art_v1"), ("DECO_BUBBLES_V2", "deco_art_v2")):
        order = re.findall(r'"(\w+)"', re.search(r"var %s = \[(.*?)\];" % const, src).group(1))
        bubbles += len(order)
        missing += ["%s DECO_%s" % (lib, n) for n in order if "DECO_" + n not in idx.get(lib, {})]
    # 말풍선 개수는 목록이 바뀌면 같이 바뀐다 (스타일마다 COMPOSED_BUBBLE_MAX 개는 골라야 하므로 하한만 본다).
    chk("치수표 글자(옆 장식 포함)·데코 순서·말풍선(%d)마다 그림이 있다" % bubbles, not missing and len(v2) > 0 and bubbles >= 8,
        ", ".join(missing) or ", ".join("%s %d" % (k, len(v)) for k, v in sorted(idx.items())))
    art_tmp = os.path.join(root, "art")
    os.makedirs(os.path.join(art_tmp, "deco_art_v9"))
    os.makedirs(os.path.join(art_tmp, "fonts_v1"))
    write(os.path.join(art_tmp, "deco_art_v9", "DECO_SUN.png"), png_bytes(4, 4, (0, 0, 4, 4)))
    write(os.path.join(art_tmp, "deco_art_v9", "notes.txt"), b"x")
    write(os.path.join(art_tmp, "deco_art_v9", "deco_sun.png"), png_bytes(4, 4, (0, 0, 4, 4)))
    write(os.path.join(art_tmp, "fonts_v1", "LTR_A.png"), png_bytes(4, 4, (0, 0, 4, 4)))
    write(os.path.join(root, "secret.png"), png_bytes(4, 4, (0, 0, 4, 4)))
    idx2 = cp.art_index(art_tmp)
    chk("그림 목록은 규칙에 맞는 라이브러리·이름만", list(idx2) == ["deco_art_v9"] and list(idx2["deco_art_v9"]) == ["DECO_SUN"] and
        isinstance(idx2["deco_art_v9"]["DECO_SUN"], int), idx2)
    chk("그림 경로 — 있는 것만", cp.art_file("deco_art_v9", "DECO_SUN", art_tmp) == os.path.realpath(
        os.path.join(art_tmp, "deco_art_v9", "DECO_SUN.png")) and cp.art_file("deco_art_v9", "DECO_MOON", art_tmp) is None)
    odd = [("../deco_art_v9", "DECO_SUN"), ("deco_art_v9", "../../secret"), ("deco_art_v9", "deco_sun"),
           ("fonts_v1", "LTR_A"), ("deco_art_v9", "DECO_SUN.png"), ("deco_art_v9", ""), (None, "DECO_SUN"),
           ("deco_art_v9", ["DECO_SUN"]), ("alphabet_art_v1", "LTR_a"), ("alphabet_art_v1", "LTR_A_X"),
           ("alphabet_art_v2", "LTR_A_PI"), ("alphabet_art_v2", "LTR_A_pink"), ("alphabet_art_v2", "LTR_A_PINK_X"),
           ("alphabet_art_v2", "LTR_C_R_PINK"), ("alphabet_art_v2", "LTR_A_PINK\n"), ("alphabet_art_v2", "LTR_A_PINKPINKPINKX")]
    chk("그림 경로 — 이상한 이름 %d가지는 None" % len(odd), all(cp.art_file(l, n, art_tmp) is None for l, n in odd))
    os.makedirs(os.path.join(art_tmp, "alphabet_art_v2"))
    for n in ("LTR_A_PINK", "LTR_C_PINK_R", "LTR_C_R"):
        write(os.path.join(art_tmp, "alphabet_art_v2", n + ".png"), png_bytes(4, 4, (0, 0, 4, 4)))
    chk("그림 경로 — 색 그룹·옆 장식 이름", all(cp.art_file("alphabet_art_v2", n, art_tmp) for n in ("LTR_A_PINK", "LTR_C_PINK_R", "LTR_C_R")) and
        sorted(cp.art_index(art_tmp)["alphabet_art_v2"]) == ["LTR_A_PINK", "LTR_C_PINK_R", "LTR_C_R"])
    os.symlink(os.path.join(root, "secret.png"), os.path.join(art_tmp, "deco_art_v9", "DECO_LINK.png"))
    chk("그림 경로 — 폴더 밖을 가리키는 링크는 None", cp.art_file("deco_art_v9", "DECO_LINK", art_tmp) is None)

    print("\n══ 폴더 · 페어 ══")
    projects = os.path.join(root, "projects")
    order_a = os.path.join(projects, "Order A EVS-1")
    order_h = os.path.join(projects, NFD_HARIN)
    empty = os.path.join(projects, "빈 주문")
    os.makedirs(os.path.join(empty, "02_cutout"))
    cut_a = os.path.join(order_a, "02_cutout")
    cut_h = os.path.join(order_h, "02_cutout")
    sil1, psd1 = make_pair(cut_a, "Order A EVS-1_01_BIG")
    sil2, psd2 = make_pair(cut_a, "Order A EVS-1_02_SML")
    sil3, psd3 = make_pair(cut_a, "Order A EVS-1_03")
    write(os.path.join(cut_a, "Order A EVS-1_04_MED_sil.png"), png_bytes(4, 4, (0, 0, 4, 4)))   # 한쪽만
    write(os.path.join(cut_a, ".DS_Store"), b"x")
    silh, psdh = make_pair(cut_h, NFD_HARIN + "_02")
    os.utime(cut_h, (time.time() - 500, time.time() - 500))
    os.utime(cut_a, (time.time() - 100, time.time() - 100))
    outside = os.path.join(root, "outside")
    os.makedirs(os.path.join(outside, "02_cutout"))
    os.symlink(outside, os.path.join(projects, "link out"))

    chk("페어 = 두 파일이 다 있는 것만, 이름순",
        [b for b, _, _ in cp.list_pairs(cut_a)] == ["Order A EVS-1_01_BIG", "Order A EVS-1_02_SML", "Order A EVS-1_03"])
    folders = cp.list_folders(projects)
    chk("폴더 목록 = 페어 있는 폴더만, 최근 것부터 · 한글은 NFC 로 표시",
        [f["label"] for f in folders] == ["Order A EVS-1", "하린"] and [f["pairs"] for f in folders] == [3, 1],
        [(f["label"], f["pairs"]) for f in folders])
    chk("폴더 이름 확인: 정상", cp.resolve_folder(projects, "Order A EVS-1") == os.path.realpath(order_a) and
        cp.resolve_folder(projects, NFD_HARIN) is not None)
    bad_names = ["", ".", "..", "../outside", "Order A EVS-1/02_cutout", ".hidden", "없는 폴더", "link out",
                 os.path.realpath(order_a)]
    chk("폴더 이름 확인: 경로 조작·숨김·없는 폴더·밖을 가리키는 링크는 거부",
        all(cp.resolve_folder(projects, n) is None for n in bad_names),
        [n for n in bad_names if cp.resolve_folder(projects, n) is not None])
    chk("페어 파일은 목록에 있는 이름만", cp.pair_file(order_a, "Order A EVS-1_02_SML", "sil") == sil2 and
        cp.pair_file(order_a, "Order A EVS-1_04_MED", "sil") is None and
        cp.pair_file(order_a, "../x", "psd") is None and cp.pair_file(None, "a", "psd") is None)
    chk("PNG 크기 읽기", cp.png_size(sil1) == (40, 60) and cp.png_size(psd3 + "x") is None)

    print("\n══ 칼선 캐시 · 종류 캐시 ══")
    cache_a = os.path.join(cut_a, "_cutcache")
    sig_now = sig or "threshold:230"
    evcut(cache_a, "Order A EVS-1_01_BIG", sil1, sig=sig_now)
    c = cp.read_cut_cache(cache_a, "Order A EVS-1_01_BIG", sil1)
    chk("칼선 캐시: 지문이 맞으면 srcOk · 박스 숫자", c and c["srcOk"] and c["rel"] == [0.125, 0.1, 0.75, 0.8] and
        not c["bad"] and c["sig"] == sig_now, c)
    evcut(cache_a, "Order A EVS-1_02_SML", sil2, src="1,1")
    chk("칼선 캐시: 실루엣이 바뀌었으면 srcOk 아님 (Illustrator 가 새로 딴다)",
        cp.read_cut_cache(cache_a, "Order A EVS-1_02_SML", sil2)["srcOk"] is False)
    evcut(cache_a, "Order A EVS-1_03", sil3, info="nan,0,1,1")
    c3 = cp.read_cut_cache(cache_a, "Order A EVS-1_03", sil3)
    chk("칼선 캐시: 숫자가 아니면 bad (JSON 에 NaN 을 싣지 않는다)", c3["bad"] and c3["rel"] is None and
        json.dumps(c3, allow_nan=False))
    write(os.path.join(cache_a, "x1.evcut"), "EVCUT2\nsig=a\nsrc=b\ninfo=0,0,1,1\nS=1|0")
    evcut(cache_a, "x2", sil1, subs=False)
    chk("칼선 캐시: 형식이 틀리거나 경로 데이터가 없으면 없음",
        cp.read_cut_cache(cache_a, "x1", sil1) is None and cp.read_cut_cache(cache_a, "x2", sil1) is None and
        cp.read_cut_cache(cache_a, "없음", sil1) is None)
    evface(cache_a, "Order A EVS-1_03", psd3, kind="upper")
    evface(cache_a, "Order A EVS-1_01_BIG", psd1, src="9,9")
    evface(cache_a, "Order A EVS-1_02_SML", psd2, kind="alien")
    f3 = cp.read_face_cache(cache_a, "Order A EVS-1_03", psd3)
    chk("종류 캐시: 측정값 + 확정 종류", f3 == {"probe": "ok|1|0,0,0,0.6|1|0", "type": "upper"}, f3)
    chk("종류 캐시: PSD 가 바뀌었으면 없음 · 모르는 종류는 빈 값",
        cp.read_face_cache(cache_a, "Order A EVS-1_01_BIG", psd1) is None and
        cp.read_face_cache(cache_a, "Order A EVS-1_02_SML", psd2)["type"] == "")

    print("\n══ 주문 정보 · 화면 데이터 ══")
    write(os.path.join(order_a, "_order.json"), json.dumps({"job": {
        "customer": " Jennifer Test ", "order": "#EVS-1", "material": "Gold", "sticker_name": "LUCKY",
        "name_style": "bubble", "notes": ["재질: SKU 에서 못 읽음"], "pack": "NAME", "photos_ordered": 5,
        "sheets": 1, "quantity": 2, "extra_sheets": 3}, "options": [
            {"key": "Extra sheets", "value": "Add 3 extra print", "line_item": 0},
            {"key": "Special instructions", "value": " <keep & show> ", "line_item": 0}]}))
    pre = cp.order_prefill(order_a)
    chk("주문 정보 = job 블록 (주문번호 # 제거 · 이름 스타일)", pre == {"nameText": "Jennifer Test", "orderNumber": "EVS-1",
        "material": "Gold", "stickerName": "LUCKY", "nameStyle": "bubble", "noName": False, "notes": ["재질: SKU 에서 못 읽음"], "orderFrom": "job",
        "pack": "NAME", "photosOrdered": 5, "sheets": 1, "quantity": 2, "extraSheets": 3, "options": [
            {"key": "Extra sheets", "value": "Add 3 extra print"},
            {"key": "Special instructions", "value": " <keep & show> "}], "specialDay": None}, pre)
    cases = [("Sanvi EVS-0000", ("EVS-0000", "Sanvi")), ("Jennifer Lee EVS-1008 (test)", ("EVS-1008", "Jennifer Lee (test)")),
             ("#evs-12 Kim", ("EVS-12", "Kim")), ("하린", ("", "하린")), ("Mary-Jane Park", ("", "Mary-Jane Park")),
             (NFD_HARIN + " EVS-2001", ("EVS-2001", "하린")), ("EVS-1 EVS-1100", ("EVS-1100", "EVS-1"))]
    got = [(n, cp.order_from_folder(n)) for n, _ in cases]
    chk("폴더 이름 속 주문번호 (인테이크 '{고객} {EVS-1008}') → 번호 · 번호 뺀 이름",
        all(g == want for (_, g), (_, want) in zip(got, cases)), [g for g in got])
    order_s = os.path.join(projects, "Sanvi EVS-0000")
    os.makedirs(order_s)
    pre_s = cp.order_prefill(order_s)
    chk("_order.json 이 없으면 폴더 이름에서 주문번호 · 고객 이름은 번호를 뺀 것",
        pre_s["orderNumber"] == "EVS-0000" and pre_s["nameText"] == "Sanvi" and pre_s["orderFrom"] == "folder", pre_s)
    chk("매니페스트 없는 폴더에 계약·수량·옵션을 만들어 넣지 않는다",
        all(pre_s[k] is None for k in ("pack", "photosOrdered", "sheets", "quantity", "extraSheets")) and pre_s["options"] == [])
    order_j = os.path.join(projects, "Kim EVS-7777")
    os.makedirs(order_j)
    write(os.path.join(order_j, "_order.json"), json.dumps({"job": {"order": "#EVS-7001", "customer": "Kim J"}}))
    pre_j = cp.order_prefill(order_j)
    chk("job 에 주문번호가 있으면 그게 먼저 (폴더 이름보다)",
        pre_j["orderNumber"] == "EVS-7001" and pre_j["nameText"] == "Kim J" and pre_j["orderFrom"] == "job", pre_j)
    write(os.path.join(order_j, "_order.json"), json.dumps({"job": {"quantity": 3, "sheets": 1}, "options": [
        {"key": "Crop preference", "value": "Round"}]}))
    pre_j = cp.order_prefill(order_j)
    chk("일반 주문은 NAME 계약 없이 수량·옵션만 그대로 읽는다",
        pre_j["pack"] is None and pre_j["photosOrdered"] is None and pre_j["quantity"] == 3 and
        pre_j["sheets"] == 1 and pre_j["options"] == [{"key": "Crop preference", "value": "Round"}])
    write(os.path.join(order_h, "_order.json"), json.dumps({"job": {"material": "Plastic", "name_style": "gothic"}}))
    pre_h = cp.order_prefill(order_h)
    chk("매니페스트에 이름이 없으면 폴더 이름(NFC) · 모르는 재질·이름 스타일은 비움",
        pre_h["nameText"] == "하린" and pre_h["material"] == "" and pre_h["nameStyle"] == "", pre_h)
    chk("매니페스트가 없어도 폴더 이름", cp.order_prefill(empty)["nameText"] == "빈 주문")
    # No name 주문 (2026-09-24) — intake name_style "none" → noName, 스타일은 비움 (range.jsx 스타일 키가 아니다)
    write(os.path.join(order_h, "_order.json"), json.dumps({"job": {"pack": "NAME", "name_style": "none", "sticker_name": ""}}))
    pre_n = cp.order_prefill(order_h)
    chk("No name 주문은 noName · 스타일·이름 빈 값", pre_n["noName"] is True and pre_n["nameStyle"] == "" and pre_n["stickerName"] == "", pre_n)
    chk("일반 주문은 noName 이 거짓", cp.order_prefill(empty)["noName"] is False)
    # Special Day 주문 (intake job.special_day, 2026-10-13) — 화면이 스크립트·디자인·글자·사이즈를 주문대로
    write(os.path.join(order_h, "_order.json"), json.dumps({"job": {"mode": "special_day", "size_mm": 38.1, "sticker_name": "Harin",
        "special_day": {"design": "PHOTO", "message": " Thanks for coming! ", "top_line": "", "bottom_line": ""}}}))
    pre_sd = cp.order_prefill(order_h)
    chk("Special Day 사진 스티커 → specialDay (photo · 문구 · 1.5″) · 이름은 stickerName",
        pre_sd["specialDay"] == {"design": "photo", "message": "Thanks for coming!", "topLine": "", "bottomLine": "", "sizeMm": 38.1}
        and pre_sd["stickerName"] == "Harin", pre_sd)
    write(os.path.join(order_h, "_order.json"), json.dumps({"job": {"mode": "special_day", "size_mm": 38.1,
        "special_day": {"design": "RING", "message": "", "top_line": "HARIN'S 2ND BIRTHDAY", "bottom_line": "2026.08.23"}}}))
    chk("Special Day 링 배지 → specialDay (ring · 윗줄 · 아랫줄)", cp.order_prefill(order_h)["specialDay"] ==
        {"design": "ring", "message": "", "topLine": "HARIN'S 2ND BIRTHDAY", "bottomLine": "2026.08.23", "sizeMm": 38.1})
    write(os.path.join(order_h, "_order.json"), json.dumps({"job": {"mode": "special_day", "size_mm": 38.1,
        "special_day": {"design": "STRIPE", "message": "", "top_line": "LEO'S 1ST BIRTHDAY", "bottom_line": ""}}}))
    chk("Special Day 스트라이프 배지 → specialDay (stripe · 윗줄)", cp.order_prefill(order_h)["specialDay"] ==
        {"design": "stripe", "message": "", "topLine": "LEO'S 1ST BIRTHDAY", "bottomLine": "", "sizeMm": 38.1})
    write(os.path.join(order_h, "_order.json"), json.dumps({"job": {"mode": "special_day", "size_mm": 38.1,
        "special_day": {"design": None, "message": "Hi"}, "notes": ["디자인: line item 마다 다름"]}}))
    chk("디자인이 안 좁혀진 Special Day 주문은 넘기지 않는다 (운영자가 고름 · 이유는 notes)",
        cp.order_prefill(order_h)["specialDay"] is None and cp.order_prefill(order_h)["notes"] == ["디자인: line item 마다 다름"])
    chk("일반 주문은 specialDay 없음", cp.order_prefill(empty)["specialDay"] is None)
    pay = cp.pairs_payload(projects, "Order A EVS-1")
    p1 = pay["pairs"][0]
    chk("화면 데이터: 페어 3장 · 캔버스 · 캐시 · 지문", len(pay["pairs"]) == 3 and p1["canvas"] == [40, 60] and
        p1["cut"]["srcOk"] and p1["face"] is None and re.match(r"^\d+,\d+;\d+,\d+$", p1["v"]) and
        pay["prefill"]["stickerName"] == "LUCKY" and pay["prefill"]["nameStyle"] == "bubble" and pay["sheets"] == 0, p1)
    chk("화면 데이터: 서버가 받는 기능 (배치 선택 · 크기 직접 · 이름 스타일) + 그림 목록",
        pay["features"] == ["layouts", "sizes", "nameStyles", "counts", "smallName"] and "alphabet_art_v2" in pay.get("art", {}), pay["features"])
    try:
        cp.pairs_payload(projects, "../outside")
        chk("화면 데이터: 이상한 폴더는 LookupError", False)
    except LookupError as e:
        chk("화면 데이터: 이상한 폴더는 LookupError", "못 찾았어요" in str(e))
    json.dumps(pay, allow_nan=False)
    chk("화면 데이터는 엄격한 JSON (NaN 없음)", True)

    print("\n══ 썸네일 ══")
    if HAVE_SIPS:
        t1 = cp.thumbnail(psd1)
        size = cp.png_size(t1) if t1 else None
        chk("PSD → PNG 썸네일 (긴 변 ≤ %d)" % cp.THUMB_PX, t1 and size and max(size) <= cp.THUMB_PX and
            t1.startswith(cache_root), size)
        if t1 and size:
            before = os.stat(t1).st_mtime_ns
            time.sleep(0.01)
            chk("두 번째는 캐시 그대로", cp.thumbnail(psd1) == t1 and os.stat(t1).st_mtime_ns == before)
            os.utime(psd1, (time.time() + 5, time.time() + 5))
            t2 = cp.thumbnail(psd1)
            chk("PSD 가 바뀌면 새 썸네일", t2 and t2 != t1 and cp.png_size(t2) == size)
        else:
            chk("썸네일 캐시 재사용·갱신", False, "선행 썸네일 생성 실패 — 후반 요청/HTTP 검사는 계속")
    else:
        skip("썸네일 생성·캐시·갱신", "sips 없음")
    broken = os.path.join(root, "broken_clean.psd")
    write(broken, b"not a psd")
    chk("PSD 가 아니면 None (서버가 404)", cp.thumbnail(broken) is None and cp.thumbnail(broken + "x") is None)
    chk("실패해도 캐시 폴더에 찌꺼기 없음",
        all(n.endswith(".png") and cp.png_size(os.path.join(cache_root, "thumbs", n)) for n in os.listdir(os.path.join(cache_root, "thumbs"))))

    print("\n══ 'Illustrator 에서 만들기' 요청 검사 ══")
    good = {"folder": "Order A EVS-1", "bases": ["Order A EVS-1_03", "Order A EVS-1_01_BIG"],
            "mainBase": "Order A EVS-1_03", "nameText": " Jennifer Test ", "stickerName": "LUCKY",
            "orderNumber": "EVS-1", "material": "White Matte", "orderDate": "2026-09-16", "cutMarginMm": 1,
            "shotTypes": {"Order A EVS-1_03": "face", "Order A EVS-1_02_SML": "full"},
            "expect": {"sheets": [["Order A EVS-1_03", "Order A EVS-1_01_BIG"], "junk"], "stickers": [17, "x", True]}}
    launch, summary = cp.build_launch(projects, good)
    c = launch["composed"]
    chk("launch = 02_cutout(실제 경로) + 고른 값", launch["inputFolder"] == os.path.join(os.path.realpath(order_a), "02_cutout") and
        c["bases"] == ["Order A EVS-1_03", "Order A EVS-1_01_BIG"] and c["mainBase"] == "Order A EVS-1_03" and
        c["nameText"] == "Jennifer Test" and c["cutMarginMm"] == 1 and c["material"] == "White Matte", c)
    chk("안 고른 사진의 종류는 버리고, expect 는 모양이 맞는 것만",
        c["shotTypes"] == {"Order A EVS-1_03": "face"} and
        c["expect"] == {"sheets": [["Order A EVS-1_03", "Order A EVS-1_01_BIG"]], "stickers": [17], "sigs": []}, c)
    chk("배치·크기·이름 스타일을 안 보내면 launch 에도 없다 (Illustrator 는 기본 배치 · 종류 범위 · retro)",
        "layouts" not in c and "sizeRanges" not in c and "nameStyle" not in c and "maxCopies" not in c and "smallName" not in c, c)
    chk("이름 스타일은 그대로 싣는다",
        cp.build_launch(projects, dict(good, nameStyle="bubble"))[0]["composed"]["nameStyle"] == "bubble" and
        cp.build_launch(projects, dict(good, nameStyle="retro"))[0]["composed"]["nameStyle"] == "retro")
    chk("작은 이름 넣기/빼기는 true/false 그대로 싣는다 (안 보내면 없음 = Illustrator 가 넣는다)",
        cp.build_launch(projects, dict(good, smallName=False))[0]["composed"]["smallName"] is False and
        cp.build_launch(projects, dict(good, smallName=True))[0]["composed"]["smallName"] is True)
    chk("요약 한 줄", summary == "사진 2장 · 시트 1장 예상", summary)
    picked2 = dict(good, layouts=[{"style": "sides", "namePos": "center", "mirror": True, "seed": 3}],
                   sizeRanges={"Order A EVS-1_01_BIG": [0.75, 2.5], "Order A EVS-1_03": [1, 1], "Order A EVS-1_02_SML": [2, 2.5]},
                   maxCopies={"Order A EVS-1_01_BIG": 3, "Order A EVS-1_02_SML": 5},
                   expect=dict(good["expect"], sigs=["1bdd211", "NOT-HEX", 7],
                               decos=[["SMILE", "HEART"], ["smile"], "SUN"]))
    c2 = cp.build_launch(projects, picked2)[0]["composed"]
    chk("배치 선택·크기 직접은 그대로 싣고, 안 고른 사진의 크기는 버린다 · 이상한 지문 칸은 빈 값 · 사진 수보다 긴 지문은 자른다",
        c2["layouts"] == [{"style": "sides", "namePos": "center", "mirror": True, "seed": 3}] and
        c2["sizeRanges"] == {"Order A EVS-1_01_BIG": [0.75, 2.5], "Order A EVS-1_03": [1, 1]} and
        c2["maxCopies"] == {"Order A EVS-1_01_BIG": 3} and
        c2["expect"]["sigs"] == ["1bdd211", ""], c2)
    bad_decos = [["DECO\nX"], [7], ["A" * 25], ["SUN"] * 25, [None]]
    c3 = cp.build_launch(projects, dict(good, expect=dict(good["expect"], decos=bad_decos)))[0]["composed"]
    chk("데코 모양 이름은 시트마다 그대로 싣고, 모양이 이상한 시트는 None (비교 안 함) · 사진 수보다 긴 목록은 자른다",
        c2["expect"]["decos"] == [["SMILE", "HEART"], None] and c3["expect"]["decos"] == [None, None] and
        "decos" not in c["expect"], (c2["expect"].get("decos"), c3["expect"].get("decos")))
    lh, _ = cp.build_launch(projects, dict(good, folder=NFD_HARIN, bases=[NFD_HARIN + "_02"], mainBase="",
                                           shotTypes={NFD_HARIN + "_02": "upper"}, expect={}))
    chk("한글 NFD 이름 → NFC 로 보낸다 (.jsx 도 NFC 로 비교)",
        lh["composed"]["bases"] == ["하린_02"] and lh["composed"]["shotTypes"] == {"하린_02": "upper"} and
        lh["inputFolder"] == os.path.join(os.path.realpath(order_h), "02_cutout"), lh["composed"])
    json.dumps(launch)   # launch_illustrator 가 ensure_ascii 로 싣는다
    bad_cases = [
        ("요청이 dict 가 아님", ["x"], "요청 형식"),
        ("폴더 없음", dict(good, folder="../outside"), "주문 폴더"),
        ("사진 없음", dict(good, bases=[]), "한 장 이상"),
        ("사진 목록이 목록이 아님", dict(good, bases="Order A EVS-1_03"), "한 장 이상"),
        ("폴더에 없는 사진", dict(good, bases=["Order A EVS-1_04_MED"]), "폴더에 없는"),
        ("같은 사진 두 번", dict(good, bases=["Order A EVS-1_03", "Order A EVS-1_03"]), "두 번"),
        ("메인이 고른 사진 밖", dict(good, mainBase="Order A EVS-1_02_SML"), "메인"),
        ("모르는 종류", dict(good, shotTypes={"Order A EVS-1_03": "cat"}), "종류"),
        ("종류 형식", dict(good, shotTypes=["face"]), "형식"),
        ("모르는 재질", dict(good, material="Paper"), "재질"),
        ("테두리 3mm", dict(good, cutMarginMm=3), "테두리"),
        ("테두리 문자열", dict(good, cutMarginMm="1"), "테두리"),
        ("테두리 True", dict(good, cutMarginMm=True), "테두리"),
        ("고객 이름 없음", dict(good, nameText="  "), "고객 이름"),
        ("고객 이름 너무 김", dict(good, nameText="가" * 200), "너무 길"),
        ("날짜 모양", dict(good, orderDate="9/16"), "날짜"),
        ("배치가 목록이 아님", dict(good, layouts={"style": "sides"}), "배치 선택"),
        ("배치가 사진보다 많음", dict(good, layouts=[{}] * 3), "배치 선택"),
        ("배치 칸이 dict 아님", dict(good, layouts=["sides"]), "배치 선택"),
        ("모르는 스타일", dict(good, layouts=[{"style": "spiral", "namePos": "left", "mirror": False, "seed": 0}]), "스타일"),
        ("스타일 빠짐", dict(good, layouts=[{"namePos": "left", "mirror": False, "seed": 0}]), "스타일"),
        ("모르는 이름 위치", dict(good, layouts=[{"style": "center", "namePos": "top", "mirror": False, "seed": 0}]), "이름 위치"),
        ("좌우 바꿈 문자열", dict(good, layouts=[{"style": "center", "namePos": "left", "mirror": "yes", "seed": 0}]), "좌우"),
        ("섞기 True", dict(good, layouts=[{"style": "center", "namePos": "left", "mirror": False, "seed": True}]), "섞기"),
        ("섞기 음수", dict(good, layouts=[{"style": "center", "namePos": "left", "mirror": False, "seed": -1}]), "섞기"),
        ("섞기 너무 큼", dict(good, layouts=[{"style": "center", "namePos": "left", "mirror": False, "seed": 1000}]), "섞기"),
        ("섞기 소수", dict(good, layouts=[{"style": "center", "namePos": "left", "mirror": False, "seed": 1.5}]), "섞기"),
        ("크기가 dict 아님", dict(good, sizeRanges=[[1, 2]]), "크기 범위"),
        ("사다리에 없는 크기", dict(good, sizeRanges={"Order A EVS-1_03": [0.5, 2]}), "크기 범위"),
        ("최소가 최대보다 큼", dict(good, sizeRanges={"Order A EVS-1_03": [2, 1]}), "크기 범위"),
        ("크기 칸이 하나", dict(good, sizeRanges={"Order A EVS-1_03": [1]}), "크기 범위"),
        ("크기에 True", dict(good, sizeRanges={"Order A EVS-1_03": [True, 2]}), "크기 범위"),
        ("크기 문자열", dict(good, sizeRanges={"Order A EVS-1_03": ["1", "2"]}), "크기 범위"),
        ("장수가 dict 아님", dict(good, maxCopies=[3]), "장수 상한"),
        ("장수 0", dict(good, maxCopies={"Order A EVS-1_03": 0}), "장수 상한"),
        ("장수 소수", dict(good, maxCopies={"Order A EVS-1_03": 2.5}), "장수 상한"),
        ("장수 문자열", dict(good, maxCopies={"Order A EVS-1_03": "2"}), "장수 상한"),
        ("장수 True", dict(good, maxCopies={"Order A EVS-1_03": True}), "장수 상한"),
        ("장수 너무 큼", dict(good, maxCopies={"Order A EVS-1_03": 25}), "장수 상한"),
        ("모르는 이름 스타일", dict(good, nameStyle="gothic"), "이름 스타일"),
        ("이름 스타일 빈 값", dict(good, nameStyle=""), "이름 스타일"),
        ("이름 스타일 목록", dict(good, nameStyle=["bubble"]), "이름 스타일"),
        ("이름 스타일 숫자", dict(good, nameStyle=1), "이름 스타일"),
        ("작은 이름 문자열", dict(good, smallName="false"), "작은 이름"),
        ("작은 이름 숫자", dict(good, smallName=0), "작은 이름"),
        ("작은 이름 목록", dict(good, smallName=[False]), "작은 이름"),
    ]
    wrong = []
    for label, body, word in bad_cases:
        try:
            cp.build_launch(projects, body)
            wrong.append(label + " (통과됨)")
        except ValueError as e:
            if word not in str(e):
                wrong.append("%s → %s" % (label, e))
    chk("이상한 요청 %d가지는 이유와 함께 거부" % len(bad_cases), not wrong, "; ".join(wrong))

    print("\n══ HTTP ══")
    launches = []
    webui.PROJECTS_DIR = projects
    webui.TOKEN = "tok-test"
    webui.launch_illustrator = lambda script, launch: launches.append((script, launch))
    webui.STATE.emit = lambda text: None
    srv = webui.HTTPServer(("127.0.0.1", 0), webui.Handler)   # 보드·앱 브리지와 같은 서버 (연결마다 스레드)
    server_thread = threading.Thread(target=srv.serve_forever, daemon=True)
    server_thread.start()
    base_url = "http://127.0.0.1:%d" % srv.server_address[1]
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # 외부 프록시 없이 loopback만 사용

    def get(path, token=True):
        sep = "&" if "?" in path else "?"
        url = base_url + path + (sep + "t=tok-test" if token else "")
        try:
            with opener.open(url, timeout=20) as r:
                return r.status, r.headers, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.headers, e.read()

    def post(path, body, token=True):
        req = urllib.request.Request(base_url + path + ("?t=tok-test" if token else ""),
                                     data=json.dumps(body).encode("utf-8"),
                                     headers={"Content-Type": "application/json"}, method="POST")
        try:
            with opener.open(req, timeout=20) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")

    q = lambda **kw: "&".join("%s=%s" % (k, urllib.request.quote(v)) for k, v in kw.items())
    st, hd, body = get("/composed")
    chk("화면: 200 HTML", st == 200 and "text/html" in hd["Content-Type"] and "Composed 미리보기".encode() in body)
    chk("토큰 없으면 403", get("/composed", token=False)[0] == 403 and get("/api/composed/folders", token=False)[0] == 403)
    # 빈 연결 = 앱 창(WKWebView)이 미리 열어 두고 요청을 안 보내는 연결. 한 줄 서버는 이것 하나에 통째로 멈춰
    # 앱의 '← 주문 보드' 이동이 29초 걸렸다 (2026-10-13) — 열어 둔 채로 다른 요청이 바로 오는지 본다.
    idle = socket.create_connection(srv.server_address[:2])
    t0 = time.time()
    try:
        with opener.open(base_url + "/?t=tok-test", timeout=3) as r:
            idle_ok = r.status == 200 and b"<html" in r.read()[:400].lower()
    except Exception as e:  # noqa: BLE001 — 시간 초과면 한 줄 서버로 돌아간 것
        idle_ok = False
    idle_sec = time.time() - t0
    idle.close()
    chk("빈 연결이 열려 있어도 보드 화면은 바로 응답 (앱 '← 주문 보드' 멈춤 재발 방지)", idle_ok and idle_sec < 2, "%.2f초" % idle_sec)
    st, hd, body = get("/composed/engine.js")
    chk("엔진: 200 자바스크립트", st == 200 and "javascript" in hd["Content-Type"] and b"window.EverstoryComposed" in body)
    st, _, body = get("/api/composed/folders")
    chk("폴더 목록 API", st == 200 and [f["label"] for f in json.loads(body)["folders"]] == ["Order A EVS-1", "하린"])
    st, _, body = get("/api/composed/pairs?" + q(folder="Order A EVS-1"))
    chk("화면 데이터 API", st == 200 and len(json.loads(body)["pairs"]) == 3)
    st, _, body = get("/api/composed/pairs?" + q(folder="../outside"))
    chk("화면 데이터 API: 이상한 폴더는 404 + 이유", st == 404 and "못 찾았어요" in json.loads(body)["error"])
    if HAVE_SIPS:
        st, hd, body = get("/api/composed/thumb?" + q(folder="Order A EVS-1", base="Order A EVS-1_01_BIG", v="1"))
        chk("썸네일 API: PNG · 캐시 허용", st == 200 and hd["Content-Type"] == "image/png" and body[:4] == b"\x89PNG" and
            "max-age" in hd.get("Cache-Control", ""), hd.get("Cache-Control", ""))
    else:
        skip("썸네일 API PNG 응답", "sips 없음")
    st, hd, body = get("/api/composed/sil?" + q(folder="Order A EVS-1", base="Order A EVS-1_02_SML"))
    chk("실루엣 API", st == 200 and body == open(sil2, "rb").read())
    chk("없는 사진·목록 밖 이름은 404",
        get("/api/composed/thumb?" + q(folder="Order A EVS-1", base="Order A EVS-1_04_MED"))[0] == 404 and
        get("/api/composed/sil?" + q(folder="Order A EVS-1", base="../../x"))[0] == 404 and
        get("/api/composed/nope")[0] == 404)
    st, hd, body = get("/api/composed/art?" + q(lib="alphabet_art_v2", name="LTR_Z_R", v="1"))
    chk("글자 그림 API: PNG · 캐시 허용", st == 200 and hd["Content-Type"] == "image/png" and body[:4] == b"\x89PNG" and
        "max-age" in hd["Cache-Control"], st)
    chk("글자 그림 API: 이상한 이름·토큰 없음은 막는다",
        get("/api/composed/art?" + q(lib="alphabet_art_v2", name="../../Everstory_range"))[0] == 404 and
        get("/api/composed/art?" + q(lib="..", name="LTR_A"))[0] == 404 and
        get("/api/composed/art?" + q(lib="deco_art_v2", name="DECO_NOPE"))[0] == 404 and
        get("/api/composed/art?" + q(lib="deco_art_v2", name="DECO_SMILE"), token=False)[0] == 403)
    st, hd, body = get("/")
    chk("주문 보드에 '구성' 버튼과 미리보기 이동", st == 200 and "구성 미리보기".encode() in body and b"openComposed" in body)

    st, res = post("/api/composed/make", good)
    chk("만들기: 200 · Illustrator 로 한 번 넘김", st == 200 and res.get("ok") and res.get("duplicate") is False and
        len(launches) == 1 and launches[0][0] == webui.RANGE_JSX and launches[0][1]["composed"]["bases"][0] == "Order A EVS-1_03",
        res)
    st, res = post("/api/composed/make", good)
    chk("같은 요청을 바로 또 누르면 다시 안 넘김", st == 200 and res.get("duplicate") is True and len(launches) == 1, res)
    st, res = post("/api/composed/make", dict(good, stickerName="MOCHI"))
    chk("내용이 다르면 넘김", st == 200 and res.get("duplicate") is False and len(launches) == 2)
    st, res = post("/api/composed/make", dict(good, material="Paper"))
    chk("잘못된 요청은 400 + 이유 · 안 넘김", st == 400 and "재질" in res.get("error", "") and len(launches) == 2, res)
    chk("만들기도 토큰 없으면 403", post("/api/composed/make", good, token=False)[0] == 403 and len(launches) == 2)
    chk("Args 의 주문 폴더는 PROJECTS_DIR 을 따른다 (--projects)", webui.Args().projects_dir == projects)

    print("\n══ 스크립트 드롭다운 — Christmas · Special Day (Label 은 2026-10-13 뺐다 · Ring 은 Special Day 안으로) ══")
    with open(os.path.join(HERE, "composed_preview.html"), encoding="utf-8") as f:
        board_html = f.read()
    script_sel = re.search(r'<select id="script"[^>]*>(.*?)</select>', board_html, re.S).group(1)
    chk("드롭다운: Composed · Christmas · Special Day (bday 의 보이는 이름 = Special Day, Ring 은 없음)",
        re.findall(r'<option value="(\w+)">([^<]+)</option>', script_sel)
        == [("composed", "Composed"), ("xmas", "Christmas"), ("bday", "Special Day")], script_sel)
    chk("Ring = Special Day 디자인 목록 맨 끝 (값 ring → Everstory_ring.jsx · 배지 폼)",
        'const SD_RING = "ring";' in board_html and '<option value="${SD_RING}">Ring · 원형 배지' in board_html
        and 'if ($("#bDesign").value === SD_RING) return setScript("ring");' in board_html
        and re.search(r'<div class="sec" id="sdSec" hidden>.*?<select id="bDesign"', board_html, re.S) is not None)
    try:
        cp.build_script_launch(projects, {"script": "label", "folder": "Order A EVS-1", "bases": ["Order A EVS-1_03"]})
        label_gone = False
    except ValueError as e:
        label_gone = "알 수 없는 스크립트" in str(e)
    chk("Label 뺌: 스크립트 키·.jsx 표에 없음 · 만들기 요청 거부 · 선택지 API 404",
        cp.SCRIPT_KEYS == ("ring", "xmas", "bday") and set(webui.SCRIPT_JSX) == {"ring", "xmas", "bday"}
        and not hasattr(cp, "label_choices") and not hasattr(webui, "LABEL_JSX") and label_gone
        and get("/api/composed/label")[0] == 404)
    rch = cp.ring_choices(webui.RING_JSX)
    rth = rch["draw"]["themes"]
    chk("Ring 테마 = 레트로 파스텔 하나 (크리스마스 테마·눈더미·45° 줄무늬 뺌 — 테마 하나면 보드·대화창이 칸을 숨긴다)",
        [t["label"] for t in rch["themes"]] == ["레트로 파스텔 (생일)"] and len(rth) == 1 and len(rth[0].get("palette") or []) == 12
        and all("snow" not in t and "stripeAngle" not in t for t in rth)
        and "snowHex" not in rch["draw"] and "SNOW_CREST" not in rch["draw"]["nums"], rch["themes"])
    chk("Ring 사이즈 1.5·1.75·2·2.5″ (기본 2″) · 글자 효과 없음·그림자·레트로, 기본 레트로 (10-13: 1.75″ 추가 · 캘리그래피 뺌)",
        rch["sizesMm"] == [38.1, 44.45, 50.8, 63.5] and rch["sizesMm"][rch["sizeDefault"]] == 50.8
        and [e.get("key") for e in rch["effects"]] == ["none", "shadow", "retro"] and rch["effectDefault"] == "retro"
        and "calliFont" not in rch["draw"] and not any(k.startswith("CALLI") for k in rch["draw"]["nums"]),
        (rch["sizes"], rch["effects"]))
    rgood = {"script": "ring", "folder": "Order A EVS-1", "bases": ["Order A EVS-1_03"], "themeIdx": 0, "layoutIdx": 0, "sizeIdx": 1,
             "topText": "Olivia's 1st", "bottomText": "2026", "customerName": "Order A", "orderDate": "2026-10-13"}
    _, _, rex, rsm = cp.build_script_launch(projects, rgood, rch)
    ro = rex.get("__EVERSTORY_RING_OPTS__", {})
    try:
        cp.build_script_launch(projects, dict(rgood, textEffect="calli"), rch)
        calli_gone = False
    except ValueError as e:
        calli_gone = "글자 효과" in str(e)
    chk("Ring 만들기 값: 1.75″ = 44.45mm · 효과를 안 보내면 레트로 · 캘리그래피 요청은 거부",
        ro.get("sizeMm") == 44.45 and ro.get("textEffect") == "retro" and ro.get("upper") is True
        and cp.build_script_launch(projects, dict(rgood, textEffect="none"), rch)[2]["__EVERSTORY_RING_OPTS__"]["textEffect"] == "none"
        and calli_gone and rsm == "Ring RING · 사진 1장", ro)

    print("\n══ Christmas (xmas) — 하트 · MERRY · 오벌 · 사진 카드 A·C·D ══")
    xch = cp.xmas_choices(webui.XMAS_JSX)
    d = xch["draw"]
    chk("선택지: 하트·MERRY·오벌·사진 카드 3 디자인 (B 오벌 액자 뺌) · 사이즈 4 · 색 2 · 테두리 2 (.jsx 표 그대로)",
        [x["key"] for x in xch["designs"]] == ["HEART", "MERRY", "OVAL", "CARD", "SQUARE", "DIECUT"]
        and xch["sizesMm"] == [38.1, 44.45, 50.8, 63.5]
        and len(xch["colorModes"]) == 2 and len(xch["borders"]) == 2 and xch["sizeDefault"] == 2,
        xch["sizesMm"])
    chk("디자인별 기본 사이즈: 하트 2″ · MERRY 2″ · 오벌 1.75″ · 카드 A 1.5″ · C·D 1.75″ (시트 9장)",
        [xch["sizesMm"][int(x["size"])] for x in xch["designs"]] == [50.8, 50.8, 44.45, 38.1, 44.45, 44.45], xch["designs"])
    kc = d.get("cards") or {}
    chk("사진 카드 그리기 값: A 1.346 · C 띄운 대문자 · D 테두리·판 · 머리 띠 · 서체 순서 · B 없음 (.jsx 표 그대로)",
        kc.get("CARD", {}).get("h") == 1.346 and "FRAME" not in kc and kc.get("SQUARE", {}).get("capsW") == 0.53
        and kc.get("DIECUT", {}).get("border") == 0.025 and kc.get("DIECUT", {}).get("plateH") == 0.303
        and kc.get("band") == {"band0": 0.08, "band1": 0.2, "wideK": 0.7} and kc.get("colors", {}).get("teal") == "2F6B66"
        and [f["ps"] for f in kc.get("scriptFonts", [])][:1] == ["ACaslonPro-SemiboldItalic"]
        and [f["ps"] for f in kc.get("capsFonts", [])][:1] == ["Baskerville"], {k: v for k, v in kc.items() if k in ("band", "colors")})
    mg = d.get("merry") or {}
    mt, msh = mg.get("table") or {}, mg.get("shapes") or {}
    meas = msh.get("measure") or {}
    chk("MERRY 표 = 빌드 그림 실측 (칼선 bbox · CHRISTMAS · 얼굴 자리 · 이름 자리 — SHAPES.json)",
        meas and all(abs(float(mt.get(k, -1e9)) - float(v)) < (0.011 if abs(float(v)) > 1.5 else 1e-4) for k, v in meas.items())
        and {"faceH", "faceWMax", "chinK", "faceCx"} <= set(meas)
        and msh.get("cut", "").startswith("M") and msh.get("cream", "").startswith("M"), (mt, meas))
    templates = os.path.join(os.path.dirname(webui.XMAS_JSX), "templates")
    chk("MERRY 그림 파일: templates 의 .ai · 모자 PNG + 미리보기 FRAME · HAT",
        os.path.isfile(os.path.join(templates, "xmas_merry_art_v1.ai")) and os.path.isfile(os.path.join(templates, "xmas_santa_hat_v1.png"))
        and sorted(mg.get("art") or {}) == ["FRAME", "HAT"] and cp.xmas_art_file("FRAME") and cp.xmas_art_file("../x") is None
        and cp.xmas_art_file("LTR_A") is None, mg.get("art"))
    chk("MERRY 이름 서체: DM Serif Display (대문자 0.66 em)",
        [f.get("ps") for f in mg.get("fonts") or []][:1] == ["DMSerifDisplay-Regular"] and (mg.get("fonts") or [{}])[0].get("cap") == 0.66,
        mg.get("fonts"))
    ov = d.get("oval") or {}
    chk("오벌 그리기 값: 타원 1.2608 · 링 3 · 얼굴 상자 · 글자 자리 · 아래 문구 원호 · 색 (.jsx 표 그대로)",
        ov.get("shape") == {"h": 1.2608, "ring1": 0.0124, "gap": 0.02, "ring2": 0.0069}
        and ov.get("face", {}).get("maxW") == 0.78 and ov.get("merry", {}).get("size") == 0.1625
        and ov.get("title", {}).get("xh") == 0.0783 and ov.get("line", {}).get("r") == 0.3932
        and ov.get("line", {}).get("maxDeg") == 58 and ov.get("colors") == {"red": "9F1112", "cream": "F9F3E1"}, ov)
    chk("오벌 서체 순서: Great Vibes · Etna Semibold 이 첫째 + 아래 문구 틀 4개 (기본 = Love, 이름)",
        [f["ps"] for f in ov.get("scriptFonts", [])][:1] == ["GreatVibes-Regular"]
        and [f["ps"] for f in ov.get("fonts", [])][:1] == ["Etna-Semibold"]
        and len(xch["linePresets"]) == 4 and xch["linePresets"][xch["linePresetDefault"]] == "Love, {name}",
        xch["linePresets"])
    chk("그리기 값: 하트 12개 · 얼굴 상자 · 이름 곡선 · 팔레트 3 · 테두리/블리드 mm",
        len(d["heart"]) == 12 and d["heart"].get("h") == 0.9591 and d["face"].get("maxW") == 0.61
        and d["name"].get("r") == 0.65 and d["name"].get("cap") == 0.0517 and len(d["palette"]) == 3
        and d["borderMm"] == 1.5 and d["bleedMm"] == 1 and d["samples"] == 8, d["name"])
    chk("이름 서체 순서: Sofia Pro Soft Medium 이 첫째", d["fonts"] and d["fonts"][0]["ps"] == "SofiaProSoftMedium",
        [f["ps"] for f in d["fonts"]])
    chk("서체 파일 찾기: 경로 조작·모르는 이름은 None",
        cp.font_file("../../etc/passwd") is None and cp.font_file("") is None and cp.font_file("NoSuchFont-Zz9") is None)
    have = [f for f in d["fonts"] if f.get("have")]
    if have:
        p = cp.font_file(have[0]["ps"])
        chk("서체 파일 찾기: 있는 서체는 파일 경로 + PostScript 이름 일치", p and os.path.isfile(p) and cp._ps_name(p) == have[0]["ps"], p)
    else:
        skip("서체 파일 찾기 (있는 서체)", "이 Mac 에 이름 서체가 하나도 없음")

    xgood = {"script": "xmas", "folder": "Order A EVS-1", "bases": ["Order A EVS-1_03"], "designIdx": 0,
             "sizeIdx": 2, "colorMode": 1, "borderIdx": 0, "name": "harin", "customerName": "Order A", "orderDate": "2026-10-06",
             "shotTypes": {"Order A EVS-1_03": "upper"}}
    sk, ln, ex, sm = cp.build_script_launch(projects, xgood, rch, xmas=xch)
    xo = ex.get("__EVERSTORY_XMAS_OPTS__", {})
    chk("만들기 값: 폴더 경로 문자열 + __EVERSTORY_XMAS_OPTS__",
        sk == "xmas" and isinstance(ln, str) and ln.endswith(os.path.join("Order A EVS-1", "02_cutout"))
        and xo.get("design") == "HEART" and xo.get("name") == "harin" and xo.get("sizeMm") == 50.8
        and xo.get("colorMode") == 1 and xo.get("border") == 0 and xo.get("photoNames") == ["Order A EVS-1_03"]
        and xo.get("shotTypes") == {"Order A EVS-1_03": "upper"} and xo.get("line") == "", xo)
    xoval = dict(xgood, designIdx=2, sizeIdx=1, name="", line=" Love, Harin ")
    sk, ln, ex, sm = cp.build_script_launch(projects, xoval, rch, xmas=xch)
    xo = ex.get("__EVERSTORY_XMAS_OPTS__", {})
    _, _, exm, _ = cp.build_script_launch(projects, dict(xgood, designIdx=1, name="harin"), rch, xmas=xch)
    xm = exm.get("__EVERSTORY_XMAS_OPTS__", {})
    chk("MERRY 만들기 값: design MERRY + 이름 (리본) · 2″",
        xm.get("design") == "MERRY" and xm.get("name") == "harin" and xm.get("sizeMm") == 50.8 and xm.get("line") == "", xm)
    _, _, exc, _ = cp.build_script_launch(projects, dict(xgood, designIdx=5, sizeIdx=1, name="Harin"), rch, xmas=xch)
    xc = exc.get("__EVERSTORY_XMAS_OPTS__", {})
    chk("사진 카드 D 만들기 값: design DIECUT + 이름 · 1.75″ · 사진 종류",
        xc.get("design") == "DIECUT" and xc.get("name") == "Harin" and xc.get("sizeMm") == 44.45
        and xc.get("shotTypes") == {"Order A EVS-1_03": "upper"}, xc)
    chk("오벌 만들기 값: design OVAL + 아래 문구(앞뒤 공백 정리) · 이름은 비어도 됨 · 1.75″",
        xo.get("design") == "OVAL" and xo.get("line") == "Love, Harin" and xo.get("name") == "" and xo.get("sizeMm") == 44.45
        and "OVAL" in sm, xo)
    xbad = [("이름 없음", dict(xgood, name="  "), "이름"), ("이름 너무 김", dict(xgood, name="A" * 30), "name"),
            ("디자인 번호 밖", dict(xgood, designIdx=99), "designIdx"), ("테두리 번호 밖", dict(xgood, borderIdx=2), "borderIdx"),
            ("색 번호 밖", dict(xgood, colorMode=2), "colorMode"), ("사이즈 True", dict(xgood, sizeIdx=True), "sizeIdx"),
            ("모르는 사진 종류", dict(xgood, shotTypes={"Order A EVS-1_03": "hat"}), "사진 종류"),
            ("오벌 아래 문구 없음", dict(xoval, line="  "), "아래 문구"), ("오벌 아래 문구 너무 김", dict(xoval, line="A" * 61), "line"),
            ("MERRY 이름 없음", dict(xgood, designIdx=1, name=" "), "이름"),
            ("사진 카드 이름 없음", dict(xgood, designIdx=3, name=" "), "이름"),
            ("디자인 번호 밖 (6)", dict(xgood, designIdx=6), "designIdx")]
    wrong = []
    for label, body, word in xbad:
        try:
            cp.build_script_launch(projects, body, rch, xmas=xch)
            wrong.append(label + " (통과됨)")
        except ValueError as e:
            if word not in str(e):
                wrong.append("%s → %s" % (label, e))
    try:
        cp.build_script_launch(projects, xgood, rch)
        wrong.append("선택지 없이 통과됨")
    except ValueError:
        pass
    chk("이상한 Christmas 요청 %d가지는 이유와 함께 거부" % (len(xbad) + 1), not wrong, "; ".join(wrong))

    st, hd, body = get("/api/composed/xmas")
    chk("선택지 API: 200 + 하트", st == 200 and json.loads(body)["designs"][0]["key"] == "HEART")
    st, hd, body = get("/api/composed/xmasart?name=FRAME")
    chk("MERRY 그림 API: FRAME 200 PNG · 모르는 이름 404 · 토큰 없으면 403",
        st == 200 and hd["Content-Type"] == "image/png" and body[:4] == b"\x89PNG"
        and get("/api/composed/xmasart?name=../SHAPES")[0] == 404 and get("/api/composed/xmasart?name=HAT", token=False)[0] == 403)
    chk("서체 API: 모르는 이름은 404 · 토큰 없으면 403",
        get("/api/composed/font?ps=NoSuchFont-Zz9")[0] == 404 and get("/api/composed/font?ps=Nunito-Bold", token=False)[0] == 403)
    if have:
        st, hd, body = get("/api/composed/font?ps=" + have[0]["ps"])
        chk("서체 API: 있는 서체는 200 + 서체 형식 · 캐시 허용", st == 200 and hd["Content-Type"].startswith("font/")
            and body[:4] in (b"OTTO", b"\x00\x01\x00\x00", b"true") and "max-age" in hd["Cache-Control"], hd["Content-Type"])
    xl = []
    webui.launch_illustrator = lambda script, launch, extra=None: xl.append((script, launch, extra))
    st, res = post("/api/composed/script", xgood)
    chk("만들기 API: Everstory_xmas.jsx 로 한 번 넘김 + 옵션 전역",
        st == 200 and res.get("ok") and len(xl) == 1 and xl[0][0] == webui.XMAS_JSX
        and xl[0][2]["__EVERSTORY_XMAS_OPTS__"]["name"] == "harin", res)
    st, res = post("/api/composed/script", dict(xgood, name=""))
    chk("만들기 API: 이름 없으면 400 + 이유 · 안 넘김", st == 400 and "이름" in res.get("error", "") and len(xl) == 1, res)
    st, res = post("/api/composed/script", xoval)
    chk("만들기 API: 오벌도 Everstory_xmas.jsx 로 + 아래 문구 전역",
        st == 200 and res.get("ok") and len(xl) == 2 and xl[1][2]["__EVERSTORY_XMAS_OPTS__"]["design"] == "OVAL"
        and xl[1][2]["__EVERSTORY_XMAS_OPTS__"]["line"] == "Love, Harin", res)

    print("\n══ Special Day (bday) — 디자인 하나: 팝·모양·색 (2026-10-13 저녁 하트·원·팝 사진을 합침) ══")
    bch = cp.bday_choices(webui.BDAY_JSX)
    bd = bch["draw"]
    chk("Special Day 선택지: 디자인 하나(POP) · 사이즈 4 · 기본 2″ · 기본 문구 (.jsx 표 그대로)",
        [x["key"] for x in bch["designs"]] == ["POP"] and bch["sizesMm"] == [38.1, 44.45, 50.8, 63.5]
        and bch["sizesMm"][int(bch["designs"][0]["size"])] == 50.8 and bch["popMsgDefault"] == "Thanks for coming!"
        and int(bch["designDefault"]) == 0, bch["designs"])
    ba = bd.get("circle", {})
    chk("하트·원 사진 실측 표는 남아 있다 (프레임 안 값의 출처): 하트 폭 0.6393 · 머리 0.20 / 원 r 0.3167 · 머리 0.29",
        bd["heartAt"].get("w") == 0.6393 and bd["upper"].get("headW") == 0.2 and bd["face"].get("maxW") == 0.4
        and ba["circle"].get("r") == 0.3167 and ba["upper"].get("headW") == 0.29 and ba["face"].get("maxW") == 0.44, bd["heartAt"])
    pp = bd.get("pop", {})
    chk("옵션 표: 레이아웃 2 · 제목 서체 3 (Bree·Titan·Fredoka) · 문구 서체 2 (Fredoka Medium·Patrick Hand) · 색 6 · 모양 4",
        [x["key"] for x in pp.get("layouts", [])] == ["TITLE_TOP", "PHOTO_TOP"]
        and [x["ps"] for x in pp.get("titleFonts", [])] == ["BreeSerif-Bold", "TitanOne", "Fredoka-Bold"]
        and [x["ps"] for x in pp.get("handFonts", [])] == ["Fredoka-Medium", "PatrickHand-Regular"]
        and [x["key"] for x in pp.get("colors", [])] == ["SKY", "BLUSH", "BUTTER", "MINT", "LILAC", "PEACH"]
        and [x["key"] for x in pp.get("shapes", [])] == ["HEART", "PUFF", "CLOUD", "CIRCLE"], pp.get("layouts"))
    chk("그리기 값: 스티커 1.076 · 영역 0.80×0.57 · 머리 밖으로 규칙 · 윤곽 120점 × 2 (시안 ROUND 4·5 그대로)",
        pp.get("sticker") == {"h": 1.076, "r": 0.02} and pp.get("region") == {"wMax": 0.8, "h": 0.57}
        and pp["geo"].get("headK") == 0.3822 and pp["geo"].get("openW") == 1.5 and pp["geo"].get("shoulderK") == 1.45 and pp["geo"].get("openDown") == 0.5
        and pp["text"] == {"ink": "141414", "accent": "D7192D"} and pp["layouts"][0].get("capMax") == 0.09
        and len(pp["puff"].get("pts", [])) == 240 and len(pp["cloud"].get("pts", [])) == 240
        and pp["puff"].get("aspect") == 1.1184 and pp["cloud"].get("aspect") == 0.7468, pp.get("geo"))

    def _contrast(h, bg="FFFFFF"):
        def lum(x):
            c = [int(x[i:i + 2], 16) / 255 for i in (0, 2, 4)]
            c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
            return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
        a, b = lum(h), lum(bg)
        return (max(a, b) + 0.05) / (min(a, b) + 0.05)
    accents = {c["key"]: c.get("accent") for c in pp.get("colors", [])}
    chk("포인트 색(BIRTHDAY·끝 하트) = 프레임 색마다 따로 · 흰 바탕 명암비 ≥ 3.8 (제목 크기에서 읽힌다)",
        all(accents.values()) and len(set(accents.values())) == 6
        and min(_contrast(a) for a in accents.values()) >= 3.8, accents)
    ins = {t["key"]: t for t in pp.get("inside", [])}
    hu, hf, ha, cc, cu, cf = bd["upper"], bd["face"], bd["heartAt"], ba["circle"], ba["upper"], ba["face"]
    cw, ctop = 2 * cc["r"], cc["cy"] - cc["r"]
    near = lambda a, b: abs(a - b) < 1e-3
    chk("프레임 안 표: 모양 4개 · 하트 = 하트 사진 실측 ÷ 하트 폭 · 원 = 원 사진 실측 ÷ 지름 · 기본은 팝",
        list(ins) == ["HEART", "PUFF", "CLOUD", "CIRCLE"]
        and near(ins["HEART"]["head"], hu["headW"] / ha["w"]) and near(ins["HEART"]["top"], (hu["top"] - ha["top"]) / ha["w"])
        and near(ins["HEART"]["faceTop"], (hf["top"] - ha["top"]) / ha["w"])
        and near(ins["HEART"]["faceBottom"], (hf["bottom"] - ha["top"]) / ha["w"]) and near(ins["HEART"]["faceW"], hf["maxW"] / ha["w"])
        and near(ins["CIRCLE"]["head"], cu["headW"] / cw) and near(ins["CIRCLE"]["top"], (cu["top"] - ctop) / cw)
        and near(ins["CIRCLE"]["faceTop"], (cf["top"] - ctop) / cw) and near(ins["CIRCLE"]["faceBottom"], (cf["bottom"] - ctop) / cw)
        and near(ins["CIRCLE"]["faceW"], cf["maxW"] / cw) and pp["defaults"].get("popOut") is True, ins)

    bgood = {"script": "bday", "folder": "Order A EVS-1", "bases": ["Order A EVS-1_03"], "designIdx": 0, "sizeIdx": 2,
             "line1": " Thanks for coming! ", "line2": "무시됨", "name": " Harin ", "customerName": "Order A",
             "orderDate": "2026-10-07", "shotTypes": {"Order A EVS-1_03": "upper"},
             "popOut": True, "popLayout": 1, "popShape": 2, "popColor": 3, "popTitle": 1, "popHand": 1}
    sk, ln, ex, sm = cp.build_script_launch(projects, bgood, rch, bday=bch)
    po = ex.get("__EVERSTORY_BDAY_OPTS__", {})
    chk("만들기 값: 폴더 경로 + 옵션은 키로 (팝 · 사진 위 · 구름 · 민트 · Titan One · Patrick Hand) · 문구 한 줄 (2줄은 버림) · 이름",
        sk == "bday" and isinstance(ln, str) and ln.endswith(os.path.join("Order A EVS-1", "02_cutout"))
        and po.get("design") == "POP" and po.get("popOut") is True and po.get("popLayout") == "PHOTO_TOP"
        and po.get("popShape") == "CLOUD" and po.get("popColor") == "MINT" and po.get("popTitle") == "TITAN"
        and po.get("popHand") == "PATRICK" and po.get("line1") == "Thanks for coming!" and po.get("line2") == ""
        and po.get("name") == "Harin" and po.get("sizeMm") == 50.8 and po.get("shotTypes") == {"Order A EVS-1_03": "upper"}
        and "sub" not in po and "Special Day POP" in sm, po)
    _, _, exi, _ = cp.build_script_launch(projects, dict(bgood, popOut=False), rch, bday=bch)
    _, _, exd, _ = cp.build_script_launch(projects, {k: v for k, v in bgood.items() if k != "popOut"}, rch, bday=bch)
    chk("프레임 안 = popOut false 그대로 · 값이 없으면 .jsx 기본(팝)",
        exi["__EVERSTORY_BDAY_OPTS__"].get("popOut") is False and exd["__EVERSTORY_BDAY_OPTS__"].get("popOut") is True,
        (exi, exd))
    # 제목 두 줄 (2026-10-15) — 기본 HAPPY / BIRTHDAY, 쓴 그대로 · 빈 칸 = 그 줄 없이 · 안 보내면 키를 빼서 .jsx 기본
    _, _, ext, _ = cp.build_script_launch(projects, dict(bgood, titleTop="  Congrats ", titleBottom=""), rch, bday=bch)
    pt = ext["__EVERSTORY_BDAY_OPTS__"]
    chk("제목: 기본 = HAPPY / BIRTHDAY (.jsx POP_TITLE_DEFAULT) · 보낸 값은 다듬어 그대로 · 빈 아랫줄 = 빈 문자열 · 안 보내면 키 없음",
        bch.get("popTitleDefault") == ["HAPPY", "BIRTHDAY"] and pt.get("titleTop") == "Congrats" and pt.get("titleBottom") == ""
        and "titleTop" not in po and "titleBottom" not in po, (bch.get("popTitleDefault"), pt))
    bbad = [("문구 없음 (이름만)", dict(bgood, line1=" "), "문구"), ("문구 너무 김", dict(bgood, line1="A" * 41), "line1"),
            ("이름 너무 김", dict(bgood, name="A" * 30), "name"), ("디자인 번호 밖", dict(bgood, designIdx=1), "designIdx"),
            ("사이즈 번호 밖", dict(bgood, sizeIdx=4), "sizeIdx"),
            ("모르는 사진 종류", dict(bgood, shotTypes={"Order A EVS-1_03": "hat"}), "사진 종류"),
            ("레이아웃 번호 밖", dict(bgood, popLayout=2), "popLayout"), ("모양 번호 밖", dict(bgood, popShape=4), "popShape"),
            ("색 번호 밖", dict(bgood, popColor=6), "popColor"),
            ("제목 서체 없음", {k: v for k, v in bgood.items() if k != "popTitle"}, "popTitle"),
            ("문구 서체 번호 밖", dict(bgood, popHand=2), "popHand"), ("팝 여부가 글자", dict(bgood, popOut="yes"), "popOut"),
            ("제목 윗줄 너무 김", dict(bgood, titleTop="A" * 25), "titleTop")]
    wrong = []
    for label, body, word in bbad:
        try:
            cp.build_script_launch(projects, body, rch, bday=bch)
            wrong.append(label + " (통과됨)")
        except ValueError as e:
            if word not in str(e):
                wrong.append("%s → %s" % (label, e))
    try:
        cp.build_script_launch(projects, bgood, rch)
        wrong.append("선택지 없이 통과됨")
    except ValueError:
        pass
    chk("이상한 Special Day 요청 %d가지는 이유와 함께 거부" % (len(bbad) + 1), not wrong, "; ".join(wrong))
    st, hd, body = get("/api/composed/bday")
    chk("Special Day 선택지 API: 200 + 디자인 하나 (POP) + 프레임 안 표", st == 200 and [d["key"] for d in json.loads(body)["designs"]] == ["POP"]
        and len(json.loads(body)["draw"]["pop"]["inside"]) == 4)
    st, res = post("/api/composed/script", bgood)
    chk("만들기 API: Everstory_birthday.jsx 로 + 옵션 키 전역",
        st == 200 and res.get("ok") and len(xl) == 3 and xl[2][0] == webui.BDAY_JSX
        and xl[2][2]["__EVERSTORY_BDAY_OPTS__"]["popShape"] == "CLOUD" and xl[2][2]["__EVERSTORY_BDAY_OPTS__"]["popOut"] is True, res)
    st, res = post("/api/composed/script", dict(bgood, line1=""))
    chk("만들기 API: 문구 없으면 400 + 이유 · 안 넘김", st == 400 and "문구" in res.get("error", "") and len(xl) == 3, res)
    st, res = post("/api/composed/script", dict(bgood, popOut=False, popShape=0))
    chk("만들기 API: 프레임 안 · 하트도 Everstory_birthday.jsx 로",
        st == 200 and res.get("ok") and len(xl) == 4 and xl[3][2]["__EVERSTORY_BDAY_OPTS__"]["popOut"] is False
        and xl[3][2]["__EVERSTORY_BDAY_OPTS__"]["popShape"] == "HEART", res)

finally:
    if srv is not None:
        if server_thread is not None and server_thread.is_alive():
            srv.shutdown()
            server_thread.join()
        srv.server_close()
    shutil.rmtree(root, ignore_errors=True)
    shutil.rmtree(cache_root, ignore_errors=True)

passed = sum(1 for x in OK if x)
print("\n%d/%d 통과  %s" % (passed, len(OK), "✅" if passed == len(OK) else "❌"))
if SKIPPED:
    print("건너뛴 검사 묶음 %d개: %s" % (len(SKIPPED), ", ".join(SKIPPED)))
sys.exit(0 if passed == len(OK) else 1)
