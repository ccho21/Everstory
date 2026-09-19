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

import http.server
import importlib.util
import json
import os
import re
import shutil
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


def chk(name, cond, extra=""):
    OK.append(bool(cond))
    print(("✅" if cond else "❌") + " " + name + ("   " + str(extra) if extra else ""))


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


def make_pair(cut, base, w=40, h=60):
    sil = os.path.join(cut, base + "_sil.png")
    write(sil, png_bytes(w, h, (5, 6, 35, 54)))
    psd = os.path.join(cut, base + "_clean.psd")
    ok = False
    if HAVE_SIPS:
        r = subprocess.run(["/usr/bin/sips", "-s", "format", "psd", sil, "--out", psd],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        ok = r.returncode == 0 and os.path.isfile(psd)
    if not ok:
        write(psd, b"8BPS-not-really")
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
           letters: X._artLetterBoxes(hero.spec).map(b => [b.ch, b.variant, +b.x.toFixed(4), +b.y.toFixed(4), +b.w.toFixed(4), b.group]) };
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
        chk("이름 스타일 버블도 두 추출본이 같은 판 (이름 박스 · 글자 자리 · 데코 스타일)",
            res.get("sameBubble") is True and bub.get("style") == "bubble" and bub.get("pad", 0) > 0 and
            all(dd[1] == "bubble" and dd[2] > 0 for dd in bub.get("decos") or [["?", "", 0]]) and
            [x[0] + x[1] for x in bub.get("letters") or []][:3] == ["VL", "Icore", "Vcore"],
            "데코 %s · 글자 %s" % ([dd[0] for dd in bub.get("decos") or []], [x[0] + x[1] for x in bub.get("letters") or []]))
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
        "notes": ["재질: SKU 에서 못 읽음"]}}))
    pre = cp.order_prefill(order_a)
    chk("주문 정보 = job 블록 (주문번호 # 제거)", pre == {"nameText": "Jennifer Test", "orderNumber": "EVS-1",
        "material": "Gold", "stickerName": "LUCKY", "notes": ["재질: SKU 에서 못 읽음"], "orderFrom": "job"}, pre)
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
    order_j = os.path.join(projects, "Kim EVS-7777")
    os.makedirs(order_j)
    write(os.path.join(order_j, "_order.json"), json.dumps({"job": {"order": "#EVS-7001", "customer": "Kim J"}}))
    pre_j = cp.order_prefill(order_j)
    chk("job 에 주문번호가 있으면 그게 먼저 (폴더 이름보다)",
        pre_j["orderNumber"] == "EVS-7001" and pre_j["nameText"] == "Kim J" and pre_j["orderFrom"] == "job", pre_j)
    write(os.path.join(order_h, "_order.json"), json.dumps({"job": {"material": "Plastic"}}))
    pre_h = cp.order_prefill(order_h)
    chk("매니페스트에 이름이 없으면 폴더 이름(NFC) · 모르는 재질은 비움",
        pre_h["nameText"] == "하린" and pre_h["material"] == "", pre_h)
    chk("매니페스트가 없어도 폴더 이름", cp.order_prefill(empty)["nameText"] == "빈 주문")
    pay = cp.pairs_payload(projects, "Order A EVS-1")
    p1 = pay["pairs"][0]
    chk("화면 데이터: 페어 3장 · 캔버스 · 캐시 · 지문", len(pay["pairs"]) == 3 and p1["canvas"] == [40, 60] and
        p1["cut"]["srcOk"] and p1["face"] is None and re.match(r"^\d+,\d+;\d+,\d+$", p1["v"]) and
        pay["prefill"]["stickerName"] == "LUCKY" and pay["sheets"] == 0, p1)
    chk("화면 데이터: 서버가 받는 기능 (배치 선택 · 크기 직접 · 이름 스타일) + 그림 목록",
        pay["features"] == ["layouts", "sizes", "nameStyles", "counts"] and "alphabet_art_v2" in pay.get("art", {}), pay["features"])
    try:
        cp.pairs_payload(projects, "../outside")
        chk("화면 데이터: 이상한 폴더는 LookupError", False)
    except LookupError as e:
        chk("화면 데이터: 이상한 폴더는 LookupError", "못 찾았어요" in str(e))
    json.dumps(pay, allow_nan=False)
    chk("화면 데이터는 엄격한 JSON (NaN 없음)", True)

    print("\n══ 썸네일 ══")
    if HAVE_SIPS and open(psd1, "rb").read(4) == b"8BPS":
        t1 = cp.thumbnail(psd1)
        size = cp.png_size(t1) if t1 else None
        chk("PSD → PNG 썸네일 (긴 변 ≤ %d)" % cp.THUMB_PX, t1 and size and max(size) <= cp.THUMB_PX and
            t1.startswith(cache_root), size)
        before = os.stat(t1).st_mtime_ns
        time.sleep(0.01)
        chk("두 번째는 캐시 그대로", cp.thumbnail(psd1) == t1 and os.stat(t1).st_mtime_ns == before)
        os.utime(psd1, (time.time() + 5, time.time() + 5))
        chk("PSD 가 바뀌면 새 썸네일", cp.thumbnail(psd1) != t1)
    else:
        print("   (sips 없음 — 썸네일 생성은 건너뜀)")
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
        "layouts" not in c and "sizeRanges" not in c and "nameStyle" not in c and "maxCopies" not in c, c)
    chk("이름 스타일은 그대로 싣는다",
        cp.build_launch(projects, dict(good, nameStyle="bubble"))[0]["composed"]["nameStyle"] == "bubble" and
        cp.build_launch(projects, dict(good, nameStyle="retro"))[0]["composed"]["nameStyle"] == "retro")
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
    srv = http.server.HTTPServer(("127.0.0.1", 0), webui.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base_url = "http://127.0.0.1:%d" % srv.server_address[1]

    def get(path, token=True):
        sep = "&" if "?" in path else "?"
        url = base_url + path + (sep + "t=tok-test" if token else "")
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                return r.status, r.headers, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.headers, e.read()

    def post(path, body, token=True):
        req = urllib.request.Request(base_url + path + ("?t=tok-test" if token else ""),
                                     data=json.dumps(body).encode("utf-8"),
                                     headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")

    q = lambda **kw: "&".join("%s=%s" % (k, urllib.request.quote(v)) for k, v in kw.items())
    st, hd, body = get("/composed")
    chk("화면: 200 HTML", st == 200 and "text/html" in hd["Content-Type"] and "Composed 미리보기".encode() in body)
    chk("토큰 없으면 403", get("/composed", token=False)[0] == 403 and get("/api/composed/folders", token=False)[0] == 403)
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
            "max-age" in hd["Cache-Control"], hd["Cache-Control"])
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
    srv.shutdown()
    chk("Args 의 주문 폴더는 PROJECTS_DIR 을 따른다 (--projects)", webui.Args().projects_dir == projects)

finally:
    shutil.rmtree(root, ignore_errors=True)
    shutil.rmtree(cache_root, ignore_errors=True)

passed = sum(1 for x in OK if x)
print("\n%d/%d 통과  %s" % (passed, len(OK), "✅" if passed == len(OK) else "❌"))
sys.exit(0 if passed == len(OK) else 1)
