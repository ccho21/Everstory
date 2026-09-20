#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Composed 미리보기 — 주문 보드 '구성' 화면의 백엔드. 표준 라이브러리만.

미리보기는 Everstory_range.jsx 의 배치 엔진을 브라우저에서 **그대로** 돌린다. engine_js() 가 .jsx 에서
최상위 함수와 대문자 상수를 뽑아 준다 (sim/extract_all.js 와 같은 규칙) — 엔진 사본이 없으니 미리보기와
실제 시트가 갈라지지 않는다. 입력은 전부 주문 폴더의 파일에서 읽는다:

  02_cutout/<base>_sil.png            캔버스 크기 (PNG IHDR — range.jsx _pngAspect 와 같은 값)
  02_cutout/_cutcache/<base>.evcut    칼선 박스(info=) · 트레이스 서명(sig=) · 실루엣 지문(src=)
  02_cutout/_cutcache/<base>.evface   자동 판별 측정값(probe=) · 운영자가 확정한 종류(type=)
  _order.json 의 job                  고객 이름 · 주문번호 · 재질 · 스티커 이름 · 이름 스타일

이름 글자·데코 그림은 저장소의 templates/art_preview/<라이브러리>/*.png 에서 읽는다 (이름 스타일마다 다른 라이브러리).
쓰는 것은 썸네일 캐시(~/Library/Caches/EverstoryBoard) 뿐이다 — 주문 폴더에는 아무것도 쓰지 않는다.
'Illustrator 에서 만들기' 는 build_launch() 가 값을 검사한 뒤 webui.launch_illustrator 로 넘긴다.
"""

import datetime
import hashlib
import json
import math
import os
import re
import struct
import subprocess
import tempfile
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE_FILE = os.path.join(HERE, "composed_preview.html")

# range.jsx 와 같은 값이어야 한다 — composed_preview_test.py 가 .jsx 상수와 대조한다.
TYPE_KEYS = ("face", "upper", "full", "group", "petFace", "petBody", "none")
MATERIALS = ("White Matte", "Translucent", "Silver", "Gold")
CUT_MARGINS = (0, 0.5, 1, 2)
GRADES_IN = (2.5, 2, 1.5, 1.25, 1, 0.75)                          # COMPOSED_GRADES_IN (크기 직접 고르기)
STYLE_KEYS = ("center", "sides", "cluster", "frame", "bottom")     # COMPOSED_STYLES
NAME_POSITIONS = ("left", "center", "right")                       # COMPOSED_NAME_POSITIONS
SHUFFLE_MAX = 999                                                  # COMPOSED_SHUFFLE_MAX
NAME_STYLE_KEYS = ("retro", "bubble")                              # COMPOSED_NAME_STYLES (이름 스타일)
COPIES_MAX = 24                                                    # COMPOSED_COPIES_MAX (사진별 장수 상한)
# 이 서버가 받는 값 — 화면은 이 목록에 있는 기능만 보여 준다 (예전 서버가 배치 선택·크기·이름 스타일·장수를 조용히 버리지 않게).
FEATURES = ("layouts", "sizes", "nameStyles", "counts")

# 이름 글자·데코 미리보기 그림 (라이브러리 그룹을 투명 PNG 로 뽑은 것 — templates/art_preview/README.md).
ART_DIR = os.path.normpath(os.path.join(HERE, "..", "..", "templates", "art_preview"))
ART_LIB_RE = re.compile(r"^(alphabet|deco)_art_v\d{1,3}$")
# LTR_A · LTR_C_R(옆 장식) · LTR_A_PINK(색 그룹) · LTR_C_PINK_R · DECO_SMILE (templates/art_preview/README.md)
ART_NAME_RE = re.compile(r"^(LTR_[A-Z](_[A-Z]{3,12})?(_[LR])?|DECO_[A-Z0-9]{1,24})$")
DECO_NAME_RE = re.compile(r"[A-Z0-9]{1,24}")

THUMB_PX = 320
CACHE_DIR = os.path.join(os.path.expanduser("~"), "Library", "Caches", "EverstoryBoard")
TEXT_MAX = 120          # 이름·주문번호 같은 한 줄 값의 길이 상한 (이상한 요청을 끊는다)


def nfc(s):
    """macOS 파일명은 한글이 NFD 로 올 때가 있다 — 화면·비교는 NFC 로."""
    return unicodedata.normalize("NFC", s or "")


def _listdir(path):
    try:
        return [n for n in os.listdir(path) if not n.startswith(".")]
    except OSError:
        return []


def list_pairs(cutout_dir):
    """02_cutout 의 페어 [(base, psd 파일명, sil 파일명)] — 이름순.

    intake.cutout_pairs 와 같은 규칙(_clean.psd 와 _sil.png 가 **둘 다** 있어야 페어)인데,
    실제 파일명(대소문자·NFD 그대로)을 같이 돌려줘야 해서 따로 둔다.
    """
    cleans, sils = {}, {}
    for n in _listdir(cutout_dir):
        low = n.lower()
        if low.endswith("_clean.psd"):
            cleans[n[:-len("_clean.psd")]] = n
        elif low.endswith("_sil.png"):
            sils[n[:-len("_sil.png")]] = n
    return [(b, cleans[b], sils[b]) for b in sorted(set(cleans) & set(sils))]


def resolve_folder(projects_dir, name):
    """projects/ **바로 아래** 주문 폴더 이름 → 절대 경로. 아니면 None (경로 조작·숨김 폴더 차단)."""
    if not name or name != os.path.basename(name) or name in (".", "..") or name.startswith("."):
        return None
    root = os.path.realpath(projects_dir)
    path = os.path.realpath(os.path.join(root, name))
    if os.path.dirname(path) != root or not os.path.isdir(path):
        return None
    return path


def pair_file(folder, base, kind):
    """주문 폴더의 페어 파일 경로 (kind = "psd" | "sil"). base 는 목록에 있는 이름과 정확히 같아야 한다."""
    if not folder or not base:
        return None
    cut = os.path.join(folder, "02_cutout")
    for b, psd, sil in list_pairs(cut):
        if b == base:
            return os.path.join(cut, psd if kind == "psd" else sil)
    return None


def list_folders(projects_dir):
    """누끼 페어가 있는 주문 폴더 — 02_cutout 을 최근에 고친 것부터."""
    out = []
    for n in _listdir(projects_dir):
        p = os.path.join(projects_dir, n)
        if not os.path.isdir(p):
            continue
        cut = os.path.join(p, "02_cutout")
        pairs = list_pairs(cut)
        if not pairs:
            continue
        try:
            mt = os.path.getmtime(cut)
        except OSError:
            mt = 0.0
        out.append({"name": n, "label": nfc(n), "pairs": len(pairs), "mtime": mt})
    out.sort(key=lambda r: (-r["mtime"], r["label"]))
    return out


def png_size(path):
    """PNG IHDR 의 (폭, 높이). 못 읽으면 None."""
    try:
        with open(path, "rb") as f:
            head = f.read(24)
    except OSError:
        return None
    if len(head) < 24 or head[:4] != b"\x89PNG" or head[12:16] != b"IHDR":
        return None
    w, h = struct.unpack(">II", head[16:24])
    return (w, h) if w > 0 and h > 0 else None


def fingerprint(path):
    """range.jsx 의 캐시 지문과 같은 "크기,초" (File.length · File.modified 초 단위 내림)."""
    st = os.stat(path)
    return "%d,%d" % (st.st_size, int(st.st_mtime))


def _read_lines(path, header):
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.read().splitlines()
    except (OSError, UnicodeDecodeError):
        return None
    if not lines or lines[0] != header:
        return None
    return lines


def read_cut_cache(cache_dir, base, sil_path):
    """.evcut → {sig, srcOk, rel:[L,T,W,H] | None, bad}. 파일이 없거나 형식이 틀리면 None.

    range.jsx 는 sig(트레이스 설정)와 src(실루엣 크기·시각)가 둘 다 맞아야 캐시를 쓰고, 아니면 칼선을 새로 딴다.
    info 가 숫자가 아니면(손상) bad=True — 그 캐시를 쓰는 Illustrator 는 "칼선 캐시 값이 비정상" 으로 멈춘다.
    """
    lines = _read_lines(os.path.join(cache_dir, base + ".evcut"), "EVCUT1")
    if lines is None:
        return None
    sig = src = info = None
    subs = 0
    for ln in lines[1:]:
        if ln.startswith("sig="):
            sig = ln[4:]
        elif ln.startswith("src="):
            src = ln[4:]
        elif ln.startswith("info="):
            info = ln[5:]
        elif ln.startswith("S="):
            subs += 1
    if info is None or not subs:
        return None
    try:
        src_ok = src == fingerprint(sil_path)
    except OSError:
        src_ok = False
    rel, bad = None, False
    try:
        vals = [float(v) for v in info.split(",")]
        if len(vals) == 4 and all(math.isfinite(v) for v in vals):
            rel = vals
        else:
            bad = True
    except ValueError:
        bad = True
    return {"sig": sig or "", "srcOk": src_ok, "rel": rel, "bad": bad}


def read_face_cache(cache_dir, base, psd_path):
    """.evface → {probe, type}. PSD 가 바뀌었거나(지문 불일치) 측정값이 없으면 None — range.jsx _readFaceCache 와 같다."""
    lines = _read_lines(os.path.join(cache_dir, base + ".evface"), "EVFACE1")
    if lines is None:
        return None
    src = probe = None
    kind = ""
    for ln in lines[1:]:
        if ln.startswith("src="):
            src = ln[4:]
        elif ln.startswith("probe="):
            probe = ln[6:]
        elif ln.startswith("type="):
            kind = ln[5:]
    try:
        if src != fingerprint(psd_path) or not probe:
            return None
    except OSError:
        return None
    if kind not in TYPE_KEYS:
        kind = ""
    return {"probe": probe, "type": kind}


# 인테이크가 만드는 폴더 이름 = "{고객} {주문번호}" (예: "Jennifer Lee EVS-1008"). 주문번호 = 영문 접두 + "-" + 숫자.
ORDER_IN_NAME_RE = re.compile(r"(?:^|\s)#?([A-Za-z]{2,6}-\d{1,7})(?=$|\s|\()")


def order_from_folder(name):
    """폴더 이름 속 주문번호 → (주문번호 대문자, 번호를 뺀 이름). 없으면 ("", 이름). 여러 개면 마지막 것."""
    name = nfc(name)
    found = list(ORDER_IN_NAME_RE.finditer(name))
    if not found:
        return "", name
    m = found[-1]
    rest = re.sub(r"\s+", " ", name[:m.start(1)].rstrip("#") + name[m.end(1):]).strip()
    return m.group(1).upper(), rest or name


def order_prefill(folder):
    """시트 정보 기본값 — mixed.jsx 와 같이 _order.json 의 job 블록에서.

    job 에 주문번호가 없으면 폴더 이름의 주문번호(2026-09-16 사용자), 고객 이름이 없으면 폴더 이름(주문번호는 뺀다).
    orderFrom = "job" | "folder" | "" — 화면이 어디서 채웠는지 알린다.
    """
    out = {"nameText": "", "orderNumber": "", "material": "", "stickerName": "", "nameStyle": "", "notes": [], "orderFrom": ""}
    doc = None
    try:
        with open(os.path.join(folder, "_order.json"), "r", encoding="utf-8") as f:
            doc = json.load(f)
    except (OSError, ValueError):
        doc = None
    job = (doc or {}).get("job") or {}
    if job.get("customer"):
        out["nameText"] = str(job["customer"]).strip()
    if job.get("order"):
        out["orderNumber"] = str(job["order"]).strip().lstrip("#")
        out["orderFrom"] = "job"
    if job.get("material") in MATERIALS:
        out["material"] = job["material"]
    if job.get("sticker_name"):
        out["stickerName"] = str(job["sticker_name"]).strip()
    # 주문의 `Name style` (intake job.name_style = range.jsx 키). 모르는 값은 비운다 — 화면이 마지막에 고른 스타일을 쓴다.
    if job.get("name_style") in NAME_STYLE_KEYS:
        out["nameStyle"] = job["name_style"]
    out["notes"] = [str(n) for n in (job.get("notes") or [])]
    num, rest = order_from_folder(os.path.basename(folder))
    if not out["orderNumber"] and num:
        out["orderNumber"] = num
        out["orderFrom"] = "folder"
    if not out["nameText"]:
        out["nameText"] = rest
    return out


def art_index(art_dir=ART_DIR):
    """미리보기 그림 목록 {라이브러리: {이름: 수정 시각(초)}} — 화면은 목록에 있는 그림만 부른다 (시각은 캐시 무효화용)."""
    out = {}
    for lib in sorted(_listdir(art_dir)):
        if not ART_LIB_RE.match(lib):
            continue
        names = {}
        for n in _listdir(os.path.join(art_dir, lib)):
            if n.endswith(".png") and ART_NAME_RE.match(n[:-4]):
                try:
                    names[n[:-4]] = int(os.path.getmtime(os.path.join(art_dir, lib, n)))
                except OSError:
                    pass
        if names:
            out[lib] = names
    return out


def art_file(lib, name, art_dir=ART_DIR):
    """미리보기 그림 경로 — 라이브러리·이름이 규칙에 맞고 파일이 art_dir/<lib>/ 바로 아래 있을 때만. 아니면 None."""
    if not isinstance(lib, str) or not isinstance(name, str):
        return None
    if not ART_LIB_RE.match(lib) or not ART_NAME_RE.match(name):
        return None
    root = os.path.realpath(art_dir)
    path = os.path.realpath(os.path.join(root, lib, name + ".png"))
    if os.path.dirname(os.path.dirname(path)) != root or not os.path.isfile(path):
        return None
    return path


def pairs_payload(projects_dir, name):
    """미리보기 화면이 한 번에 받는 주문 폴더 정보. 폴더가 이상하면 LookupError."""
    folder = resolve_folder(projects_dir, name)
    if not folder:
        raise LookupError("주문 폴더를 못 찾았어요: %s" % nfc(name))
    cut = os.path.join(folder, "02_cutout")
    cache = os.path.join(cut, "_cutcache")
    items = []
    for base, psd_name, sil_name in list_pairs(cut):
        psd, sil = os.path.join(cut, psd_name), os.path.join(cut, sil_name)
        size = png_size(sil)
        try:
            stamp = fingerprint(psd) + ";" + fingerprint(sil)
        except OSError:
            stamp = ""
        items.append({
            "base": base,
            "label": nfc(base),
            "canvas": list(size) if size else None,
            "v": stamp,              # 썸네일·실루엣 URL 에 붙여 파일이 바뀌면 새로 받게 한다
            "cut": read_cut_cache(cache, base, sil),
            "face": read_face_cache(cache, base, psd),
        })
    sheets = [n for n in _listdir(os.path.join(folder, "03_output")) if n.lower().endswith(".ai")]
    return {
        "features": list(FEATURES),
        "art": art_index(),
        "folder": name,
        "label": nfc(name),
        "prefill": order_prefill(folder),
        "pairs": items,
        "sheets": len(sheets),
        "today": datetime.date.today().isoformat(),
    }


def thumbnail(psd_path, px=THUMB_PX):
    """_clean.psd → 투명 배경 PNG 썸네일 (sips, macOS 기본 도구). 캐시 파일 경로, 실패하면 None.

    캐시 이름 = 경로 + 크기·시각 → PSD 를 다시 저장하면 새로 만든다. 실측 0.02초/장 (10MB PSD).
    """
    try:
        stamp = fingerprint(psd_path)
    except OSError:
        return None
    key = hashlib.sha1(("%s|%s|%d" % (os.path.realpath(psd_path), stamp, px)).encode("utf-8")).hexdigest()
    out_dir = os.path.join(CACHE_DIR, "thumbs")
    out = os.path.join(out_dir, key + ".png")
    if os.path.isfile(out):
        return out
    try:
        os.makedirs(out_dir, exist_ok=True)
        fd, tmp = tempfile.mkstemp(suffix=".png", dir=out_dir)
        os.close(fd)
    except OSError:
        return None
    try:
        r = subprocess.run(["/usr/bin/sips", "-s", "format", "png", "-Z", str(px), psd_path, "--out", tmp],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
        if r.returncode != 0 or png_size(tmp) is None:
            raise OSError("sips 실패 (%d)" % r.returncode)
        os.replace(tmp, out)
        return out
    except (OSError, subprocess.SubprocessError):
        try:
            os.remove(tmp)
        except OSError:
            pass
        return None


_FUNC_RE = re.compile(r"^  function (\w+)\s*\(")
_CONST_RE = re.compile(r"^  var ([A-Z][A-Z0-9_]*)\s*=")
_FUNC_END_RE = re.compile(r"^  \}\s*$")
_CONST_END_RE = re.compile(r"^  [\}\]]\s*;\s*$")


def extract_engine(src):
    """range.jsx 원문 → 브라우저용 엔진 스크립트 (window.EverstoryComposed).

    sim/extract_all.js 와 **같은 규칙**: 두 칸 들여쓴 최상위 function 블록과 대문자 var 상수만 뽑는다.
    Illustrator API 를 쓰는 함수도 같이 들어오지만 정의만 될 뿐 부르지 않는다.
    """
    lines = src.split("\n")
    out, names, i = [], [], 0
    while i < len(lines):
        mf = _FUNC_RE.match(lines[i])
        mv = _CONST_RE.match(lines[i])
        if mf:
            end = next((j for j in range(i + 1, len(lines)) if _FUNC_END_RE.match(lines[j])), None)
            if end is None:
                break
            out.append("\n".join(lines[i:end + 1]))
            names.append(mf.group(1))
            i = end + 1
            continue
        if mv:
            code = re.sub(r"\s*//.*$", "", lines[i])
            if re.search(r";\s*$", code):
                out.append(code)
                names.append(mv.group(1))
                i += 1
                continue
            end = next((k for k in range(i + 1, len(lines)) if _CONST_END_RE.match(lines[k])), None)
            if end is None:
                break
            out.append("\n".join(lines[i:end + 1]))
            names.append(mv.group(1))
            i = end + 1
            continue
        i += 1
    return ("/* Everstory_range.jsx 에서 자동 추출 (composed_preview.py) — 여기를 고치지 말고 .jsx 를 고칠 것 */\n"
            "window.EverstoryComposed = (function () {\n"
            "  var RGBColor = function () {};\n" +
            "\n".join(out) +
            "\n  return { " + ", ".join("%s: %s" % (n, n) for n in names) + " };\n})();\n")


_ENGINE = {"key": None, "js": ""}


def engine_js(jsx_path):
    """추출한 엔진 (range.jsx 가 바뀌면 다시 뽑는다)."""
    st = os.stat(jsx_path)
    key = (st.st_mtime_ns, st.st_size, jsx_path)
    if _ENGINE["key"] != key:
        with open(jsx_path, "r", encoding="utf-8") as f:
            _ENGINE["js"] = extract_engine(f.read())
        _ENGINE["key"] = key
    return _ENGINE["js"]


def page_html():
    """화면 HTML — 요청마다 읽는다 (고치고 새로고침하면 바로 반영)."""
    with open(PAGE_FILE, "r", encoding="utf-8") as f:
        return f.read()


def _text(body, key, required=False, limit=TEXT_MAX):
    v = body.get(key)
    v = "" if v is None else str(v).strip()
    if required and not v:
        raise ValueError({"nameText": "고객 이름을 적어 주세요."}.get(key, "%s 가 비어 있어요." % key))
    if len(v) > limit:
        raise ValueError("%s 가 너무 길어요 (%d자 이하)." % (key, limit))
    return v


def build_launch(projects_dir, body):
    """'Illustrator 에서 만들기' 요청 → (launch dict, 한 줄 요약). 값이 이상하면 ValueError(읽을 수 있는 이유).

    launch = {"inputFolder": <주문>/02_cutout, "composed": {...}} — range.jsx 가 대화창 없이 이 값으로 만든다.
    사진 이름은 NFC 로 보낸다 (.jsx 가 양쪽을 NFC 로 맞춰 비교한다).
    """
    if not isinstance(body, dict):
        raise ValueError("요청 형식이 이상해요.")
    folder = resolve_folder(projects_dir, str(body.get("folder") or ""))
    if not folder:
        raise ValueError("주문 폴더를 못 찾았어요.")
    cut = os.path.join(folder, "02_cutout")
    have = set(nfc(b) for b, _, _ in list_pairs(cut))
    bases = body.get("bases")
    if not isinstance(bases, list) or not bases:
        raise ValueError("사진을 한 장 이상 고르세요.")
    picked = []
    for b in bases:
        key = nfc(str(b))
        if key not in have:
            raise ValueError("폴더에 없는 사진이에요: %s — 새로고침한 뒤 다시 해 주세요." % key)
        if key in picked:
            raise ValueError("같은 사진이 두 번 들어 있어요: %s" % key)
        picked.append(key)
    main = nfc(str(body.get("mainBase") or ""))
    if main and main not in picked:
        raise ValueError("메인 사진이 고른 사진 안에 없어요.")
    shot = {}
    raw_types = body.get("shotTypes") or {}
    if not isinstance(raw_types, dict):
        raise ValueError("사진 종류 형식이 이상해요.")
    for k, v in raw_types.items():
        k = nfc(str(k))
        if k not in picked:
            continue
        if v not in TYPE_KEYS:
            raise ValueError("알 수 없는 사진 종류예요: %s" % v)
        shot[k] = v
    material = str(body.get("material") or "")
    if material not in MATERIALS:
        raise ValueError("알 수 없는 재질이에요: %s" % material)
    margin = body.get("cutMarginMm")
    if isinstance(margin, bool) or not isinstance(margin, (int, float)) or margin not in CUT_MARGINS:
        raise ValueError("흰 테두리 값이 이상해요: %s" % margin)
    date = _text(body, "orderDate", limit=10)
    if date and not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        raise ValueError("날짜는 2026-09-16 같은 모양으로 적어 주세요.")
    sizes = _size_ranges(body.get("sizeRanges"), picked)
    copies = _max_copies(body.get("maxCopies"), picked)
    layouts = _layouts(body.get("layouts"), len(picked))
    expect = {"sheets": [], "stickers": [], "sigs": []}
    raw_expect = body.get("expect") or {}
    if isinstance(raw_expect, dict):
        for sh in raw_expect.get("sheets") or []:
            if isinstance(sh, list):
                expect["sheets"].append([nfc(str(x)) for x in sh])
        for n in raw_expect.get("stickers") or []:
            if isinstance(n, int) and not isinstance(n, bool):
                expect["stickers"].append(n)
        # 배치 지문 (16진) — 자리를 비교한다. 모양이 이상한 칸은 "" (그 시트는 비교하지 않는다).
        for sig in (raw_expect.get("sigs") or [])[:len(picked)]:
            ok = isinstance(sig, str) and re.match(r"^[0-9a-f]{1,16}$", sig)
            expect["sigs"].append(sig if ok else "")
        # 데코 모양 이름 (시트마다, 2026-09-17) — 자리가 같으면 모양까지 비교한다. 모양이 이상한 시트는 None (비교 안 함).
        decos = raw_expect.get("decos")
        if isinstance(decos, list):
            expect["decos"] = []
            for row in decos[:len(picked)]:
                ok = isinstance(row, list) and len(row) <= 24 and all(
                    isinstance(x, str) and DECO_NAME_RE.fullmatch(x) for x in row)
                expect["decos"].append(list(row) if ok else None)
    composed = {
        "bases": picked,
        "mainBase": main,
        "nameText": _text(body, "nameText", required=True),
        "stickerName": _text(body, "stickerName", limit=40),
        "orderNumber": _text(body, "orderNumber", limit=40),
        "material": material,
        "orderDate": date,
        "cutMarginMm": margin,
        "shotTypes": shot,
        "expect": expect,
    }
    if sizes:
        composed["sizeRanges"] = sizes
    if copies:
        composed["maxCopies"] = copies
    if layouts is not None:
        composed["layouts"] = layouts
    # 이름 스타일 (range.jsx COMPOSED_NAME_STYLES 키). 없으면 보내지 않는다 = retro.
    style = body.get("nameStyle")
    if style is not None:
        if not isinstance(style, str) or style not in NAME_STYLE_KEYS:
            raise ValueError("알 수 없는 이름 스타일이에요: %s" % style)
        composed["nameStyle"] = style
    summary = "사진 %d장 · 시트 %d장 예상" % (len(picked), len(expect["sheets"]))
    return {"inputFolder": cut, "composed": composed}, summary


def _size_ranges(raw, picked):
    """사진마다 직접 고른 크기 {base: [최소, 최대]} → 정리된 dict (고르지 않은 사진 이름은 버린다).

    range.jsx _composedSizeRange 와 같은 규칙: 두 값 모두 사다리 인치(GRADES_IN), 최소 ≤ 최대. 이상하면 ValueError.
    """
    if raw is None:
        return {}
    if not isinstance(raw, dict):
        raise ValueError("크기 범위 형식이 이상해요.")
    out = {}
    for k, v in raw.items():
        k = nfc(str(k))
        if k not in picked:
            continue
        ok = (isinstance(v, list) and len(v) == 2 and
              all(not isinstance(x, bool) and isinstance(x, (int, float)) and x in GRADES_IN for x in v) and
              v[0] <= v[1])
        if not ok:
            raise ValueError("크기 범위가 이상해요: %s %s" % (k, v))
        out[k] = [v[0], v[1]]
    return out


def _max_copies(raw, picked):
    """사진마다 정한 장수 상한 {base: 장수} → 정리된 dict (고르지 않은 사진 이름은 버린다).

    range.jsx _composedCopyCap 과 같은 규칙: 1~COPIES_MAX 의 정수. 이상하면 ValueError.
    """
    if raw is None:
        return {}
    if not isinstance(raw, dict):
        raise ValueError("장수 상한 형식이 이상해요.")
    out = {}
    for k, v in raw.items():
        k = nfc(str(k))
        if k not in picked:
            continue
        if isinstance(v, bool) or not isinstance(v, int) or not 1 <= v <= COPIES_MAX:
            raise ValueError("장수 상한이 이상해요: %s %s" % (k, v))
        out[k] = v
    return out


def _layouts(raw, most):
    """시트마다 고른 배치 → 정리된 목록 (없으면 None = 기본 배치). 이상하면 ValueError — 미리보기와 다른 시트가 조용히 나오면 안 된다.

    range.jsx _composedLayoutSpec 과 같은 규칙: style ∈ STYLE_KEYS, namePos ∈ NAME_POSITIONS, mirror 는 bool,
    seed 는 0~SHUFFLE_MAX 정수. 시트는 사진 한 장 이상이라 목록은 사진 수보다 길 수 없다.
    """
    if raw is None:
        return None
    if not isinstance(raw, list) or len(raw) > most:
        raise ValueError("배치 선택 값이 이상해요.")
    out = []
    for i, lo in enumerate(raw):
        where = "시트 %d" % (i + 1)
        if not isinstance(lo, dict):
            raise ValueError("배치 선택 값이 이상해요 (%s)." % where)
        style, pos, mirror, seed = lo.get("style"), lo.get("namePos"), lo.get("mirror"), lo.get("seed")
        if style not in STYLE_KEYS:
            raise ValueError("알 수 없는 배치 스타일이에요 (%s): %s" % (where, style))
        if pos not in NAME_POSITIONS:
            raise ValueError("알 수 없는 이름 위치예요 (%s): %s" % (where, pos))
        if not isinstance(mirror, bool):
            raise ValueError("좌우 바꿈 값이 이상해요 (%s)." % where)
        if isinstance(seed, bool) or not isinstance(seed, int) or not 0 <= seed <= SHUFFLE_MAX:
            raise ValueError("섞기 번호가 이상해요 (%s): %s" % (where, seed))
        out.append({"style": style, "namePos": pos, "mirror": mirror, "seed": seed})
    return out
