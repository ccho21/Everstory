#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Composed 미리보기 — 주문 보드 '구성' 화면의 백엔드. 표준 라이브러리만.

미리보기는 Everstory_range.jsx 의 배치 엔진을 브라우저에서 **그대로** 돌린다. engine_js() 가 .jsx 에서
최상위 함수와 대문자 상수를 뽑아 준다 (sim/extract_all.js 와 같은 규칙) — 엔진 사본이 없으니 미리보기와
실제 시트가 갈라지지 않는다. 입력은 전부 주문 폴더의 파일에서 읽는다:

  02_cutout/<base>_sil.png            캔버스 크기 (PNG IHDR — range.jsx _pngAspect 와 같은 값)
  02_cutout/_cutcache/<base>.evcut    칼선 박스(info=) · 트레이스 서명(sig=) · 실루엣 지문(src=)
  02_cutout/_cutcache/<base>.evface   자동 판별 측정값(probe=) · 운영자가 확정한 종류(type=)
  _order.json 의 job                  고객 이름 · 주문번호 · 재질 · 스티커 이름 · 이름 스타일 · Special Day 디자인·글자

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
import threading
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE_FILE = os.path.join(HERE, "composed_preview.html")

# range.jsx 와 같은 값이어야 한다 — composed_preview_test.py 가 .jsx 상수와 대조한다.
TYPE_KEYS = ("face", "upper", "full", "group", "petFace", "petBody", "none")
MATERIALS = ("White Matte", "Translucent", "Silver", "Gold")
CUT_MARGINS = (0, 0.5, 1, 2)
GRADES_IN = (2.5, 2, 1.5, 1.25, 1, 0.75)                          # COMPOSED_GRADES_IN (크기 직접 고르기)
STYLE_KEYS = ("center", "sides", "cluster", "frame", "bottom", "grid")     # COMPOSED_STYLES
NAME_POSITIONS = ("left", "center", "right")                       # COMPOSED_NAME_POSITIONS
SHUFFLE_MAX = 999                                                  # COMPOSED_SHUFFLE_MAX
NAME_STYLE_KEYS = ("retro", "bubble")                              # COMPOSED_NAME_STYLES (이름 스타일)
COPIES_MAX = 24                                                    # COMPOSED_COPIES_MAX (사진별 장수 상한)
# 이 서버가 받는 값 — 화면은 이 목록에 있는 기능만 보여 준다 (예전 서버가 배치 선택·크기·이름 스타일·장수·작은 이름을 조용히 버리지 않게).
FEATURES = ("layouts", "sizes", "nameStyles", "counts", "smallName")

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
    info 가 숫자가 아니면(손상) bad=True — 그 캐시를 쓰는 Illustrator 는 "칼선 값이 비정상" 으로 멈춘다
    (숫자지만 사진에 비해 너무 작은 칼선은 미리보기가 _composedCutAspect 로 걸러 같은 "bad" 로 보인다).
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
    out = {"nameText": "", "orderNumber": "", "material": "", "stickerName": "", "nameStyle": "", "noName": False, "notes": [], "orderFrom": "",
           "pack": None, "photosOrdered": None, "sheets": None, "quantity": None, "extraSheets": None, "options": [],
           "specialDay": None}
    doc = None
    try:
        with open(os.path.join(folder, "_order.json"), "r", encoding="utf-8") as f:
            doc = json.load(f)
    except (OSError, ValueError):
        doc = None
    job = (doc or {}).get("job") or {}
    out.update(pack=job.get("pack"), photosOrdered=job.get("photos_ordered"),
               sheets=job.get("sheets"), quantity=job.get("quantity"), extraSheets=job.get("extra_sheets"))
    out["options"] = [{"key": str(o.get("key") or ""), "value": str(o.get("value") if o.get("value") is not None else "")}
                      for o in ((doc or {}).get("options") or [])]
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
    # `No name` 주문 (intake name_style "none", 2026-09-24) — 화면은 이름 필수 경고 대신 "사진만" 안내를 띄운다.
    out["noName"] = job.get("name_style") == "none"
    out["notes"] = [str(n) for n in (job.get("notes") or [])]
    # Special Day 주문 (intake job.special_day, 2026-10-13) — 화면이 스크립트를 Special Day 로, 디자인·글자·사이즈를 주문대로 고른다.
    # 디자인이 한 개로 안 좁혀진 주문(line item 마다 다름)은 넘기지 않는다 — 운영자가 고르고, 이유는 notes 에 있다.
    sd = job.get("special_day")
    if isinstance(sd, dict) and sd.get("design") in ("PHOTO", "RING", "STRIPE"):
        out["specialDay"] = {"design": str(sd["design"]).lower(),   # photo | ring | stripe (스트라이프 = 링 스크립트 STRIPE 레이아웃)
                             "message": str(sd.get("message") or "").strip(),
                             "topLine": str(sd.get("top_line") or "").strip(),
                             "bottomLine": str(sd.get("bottom_line") or "").strip(),
                             "sizeMm": job.get("size_mm") if isinstance(job.get("size_mm"), (int, float)) else None}
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
    # 작은 이름(붙인 글자) 넣기 — range.jsx _composedLaunchOptions 와 같은 규칙: true/false 만. 없으면 보내지 않는다 = 넣음.
    small = body.get("smallName")
    if small is not None:
        if not isinstance(small, bool):
            raise ValueError("작은 이름 값이 이상해요: %s" % small)
        composed["smallName"] = small
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


# ── 다른 스크립트 (Ring · Christmas · Special Day) ─────────────────────────────
# 구성 화면 헤더의 '스크립트' 드롭다운. Composed 가 기본이고, 나머지는 화면 폼 값으로 대화창 없이 만든다.
# Ring = 원형 배지 (2026-10-03). Label(빈티지 라벨)은 2026-10-13 사용자 결정으로 스크립트째 뺐다.
# Christmas(xmas) = 크리스마스 디자인 — 1번 하트 (2026-10-06) · 2번 MERRY · 3번 오벌 · 사진 카드 A·C·D (10-07, B 오벌 액자는 10-13 뺐다).
# Special Day(bday) = 생일 디자인 — 1번 하트 사진 (2026-10-07, 참고 IMG_3165) · 2번 원 사진 (10-10, 사용자 시안 #1),
# 문구·서명·이름·작은 글씨는 고객이 쓴 그대로. 보드 이름만 Special Day (10-13) — 키 bday·Everstory_birthday.jsx 는 그대로.
# 선택지·그리기 값은 각 .jsx 에서 그대로 읽는다 — 화면용 사본이 없으니 인덱스·치수가 어긋나지 않는다.
SCRIPT_KEYS = ("ring", "xmas", "bday")


def _jsx_strings(src, var):
    m = re.search(r"var %s\s*=\s*\[(.*?)\];" % var, src, re.S)
    return [re.sub(r"\\(.)", r"\1", x) for x in re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1))] if m else []


def _jsx_number(src, var):
    m = re.search(r"var %s\s*=\s*(-?\d+(?:\.\d+)?)\s*;" % var, src)
    return float(m.group(1)) if m else None


def _jsx_text(src, var):
    m = re.search(r'var %s\s*=\s*"((?:[^"\\]|\\.)*)"\s*;' % var, src)
    return m.group(1) if m else ""


RING_LAYOUT_KEYS = ("RING", "STRIPE")    # ring.jsx LAYOUT_RING=0 · LAYOUT_STRIPE=1 (_layoutTag)


def ring_choices(jsx_path):
    """Everstory_ring.jsx 의 선택지 → 화면 폼 값 (자주 쓰는 것만 — 2026-10-03 사용자 결정).
    안쪽 원·얼굴 %·정렬·칼선은 .jsx _consumePreset 이 대화창 기본값으로 채운다.
    색 = 믹스 두 가지 또는 한 색 통일 (10-04) — 한 색이면 그 테마 팔레트에서 하나 (draw.themes[].palette)."""
    with open(jsx_path, "r", encoding="utf-8") as f:
        src = f.read()
    themes = [{"label": lab, "top": top, "bottom": bot} for lab, top, bot in re.findall(
        r'\{\s*label:\s*"([^"]+)",\s*tag:.*?topText:\s*"((?:[^"\\]|\\.)*)",\s*bottomText:\s*"((?:[^"\\]|\\.)*)"', src, re.S)]
    m = re.search(r"var SIZE_MM\s*=\s*\[(.*?)\];", src)
    cut = re.search(r"var CUT_MARGIN_VALUES\s*=\s*\[(.*?)\];", src)
    cut_vals = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", cut.group(1))] if cut else [0]
    cut_mm = cut_vals[int(_jsx_number(src, "CUT_MARGIN_DEFAULT_INDEX") or 0)]
    gap = _jsx_number(src, "GAP_DEFAULT_MM") or 0
    return {
        "themes": themes,
        "themeDefault": int(_jsx_number(src, "THEME_DEFAULT") or 0),
        "layouts": _jsx_strings(src, "LAYOUT_OPTIONS"),
        "layoutKeys": list(RING_LAYOUT_KEYS),
        "sizes": _jsx_strings(src, "SIZE_OPTIONS"),
        "sizesMm": [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", m.group(1))] if m else [],
        "sizeDefault": int(_jsx_number(src, "SIZE_DEFAULT") or 0),
        "effects": jsx_table(src, "TEXT_EFFECTS"),     # 글자 효과 (링·스트라이프) — [{key, label}]
        "effectDefault": _jsx_text(src, "TEXT_EFFECT_DEFAULT") or "none",   # 10-13 사용자: 기본 레트로
        "colorModes": _jsx_strings(src, "COLOR_MODE_OPTIONS"),
        "colorDefault": int(_jsx_number(src, "COLOR_MODE_DEFAULT") or 0),
        "colorSingle": int(_jsx_number(src, "COLOR_SINGLE") or 2),
        # 격자 어림 — .jsx _buildSheet: 블리드(음수 칼선)면 간격을 블리드 2배까지 벌린다
        "padYmm": _jsx_number(src, "BODY_PADDING_Y_MM") or 0,
        "gapMm": max(gap, 2 * max(0.0, -cut_mm)),
        "draw": ring_draw(jsx_path),
    }


def xmas_choices(jsx_path):
    """Everstory_xmas.jsx 의 선택지·그리기 값 → 화면 폼 + 미리보기 (하트 윤곽·얼굴 상자·이름 곡선·팔레트,
    오벌 타원·링·글자 자리·아래 문구 원호 그대로). 디자인마다 기본 사이즈가 있다 (designs[].size = SIZE_MM 번호).
    서체는 위에서부터 이 Mac 에 파일이 있는 것을 쓴다 (have) — .jsx _resolveFontList 와 같은 순서."""
    with open(jsx_path, "r", encoding="utf-8") as f:
        src = f.read()
    m = re.search(r"var SIZE_MM\s*=\s*\[(.*?)\];", src)
    fonts = jsx_table(src, "NAME_FONTS")
    oval_script = jsx_table(src, "OVAL_SCRIPT_FONTS")
    oval_fonts = jsx_table(src, "OVAL_FONTS")
    card_script = jsx_table(src, "CARD_SCRIPT_FONTS")
    card_caps = jsx_table(src, "CARD_CAPS_FONTS")
    for ft in fonts + oval_script + oval_fonts + card_script + card_caps:
        ft["have"] = bool(font_file(ft.get("ps")))
    return {
        "designs": jsx_table(src, "DESIGNS"),
        "designDefault": int(_jsx_number(src, "DESIGN_DEFAULT") or 0),
        "sizes": _jsx_strings(src, "SIZE_OPTIONS"),
        "sizesMm": [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", m.group(1))] if m else [],
        "sizeDefault": int(_jsx_number(src, "SIZE_DEFAULT") or 0),
        "colorModes": _jsx_strings(src, "COLOR_MODE_OPTIONS"),
        "colorDefault": int(_jsx_number(src, "COLOR_MODE_DEFAULT") or 0),
        "borders": _jsx_strings(src, "BORDER_OPTIONS"),
        "borderDefault": int(_jsx_number(src, "BORDER_DEFAULT") or 0),
        # 오벌 아래 문구 틀 ({name} = 이름) — 보드 칸을 주문 이름으로 미리 채운다
        "linePresets": _jsx_strings(src, "OVAL_LINE_PRESETS"),
        "linePresetDefault": int(_jsx_number(src, "OVAL_LINE_PRESET_DEFAULT") or 0),
        # 격자 — .jsx _buildSheet: 블리드면 간격을 블리드 2배까지 벌린다
        "padYmm": _jsx_number(src, "BODY_PADDING_Y_MM") or 0,
        "gapMm": _jsx_number(src, "GAP_DEFAULT_MM") or 0,
        "draw": {
            "heart": jsx_object(src, "HEART"),
            "face": jsx_object(src, "FACE_BOX"),
            "name": jsx_object(src, "NAME_ARC"),
            "fonts": fonts,
            "palette": jsx_table(src, "PALETTE"),
            "borderMm": _jsx_number(src, "BORDER_MM") or 0,
            "bleedMm": _jsx_number(src, "BLEED_MM") or 0,
            "samples": int(_jsx_number(src, "OFFSET_SAMPLES") or 8),
            "merry": _merry_draw(src),
            "oval": {
                "shape": jsx_object(src, "OVAL"),
                "face": jsx_object(src, "OVAL_FACE"),
                "merry": jsx_object(src, "OVAL_MERRY"),
                "title": jsx_object(src, "OVAL_TITLE"),
                "line": jsx_object(src, "OVAL_LINE"),
                "colors": jsx_object(src, "OVAL_COLORS"),
                "scriptFonts": oval_script,
                "fonts": oval_fonts,
            },
            # 사진 카드 A·C·D (10-07) — 이름 서체는 MERRY 와 같다 (merry.fonts)
            "cards": {
                "CARD": jsx_object(src, "CARD"),
                "SQUARE": jsx_object(src, "SQUARE"),
                "DIECUT": jsx_object(src, "DIECUT"),
                "band": jsx_object(src, "CARD_BAND"),
                "colors": jsx_object(src, "CARD_COLORS"),
                "scriptFonts": card_script,
                "capsFonts": card_caps,
            },
        },
    }


def bday_choices(jsx_path):
    """Everstory_birthday.jsx 의 선택지·그리기 값 → 화면 폼 + 미리보기 (스티커·제목·하트·사진 자리·문구·서명·빨간 하트
    그대로). 기본 문구(BD_MSG_DEFAULT)로 칸을 미리 채운다. 서체는 위에서부터 이 Mac 에 파일이 있는 것 (have).
    원 사진(CIRCLE, 2026-10-10)은 draw.circle — 이름·작은 글씨(일직선)·손그림 하트·원·문구 (BN_* 표 그대로)."""
    with open(jsx_path, "r", encoding="utf-8") as f:
        src = f.read()
    m = re.search(r"var SIZE_MM\s*=\s*\[(.*?)\];", src)
    title_fonts = jsx_table(src, "BD_TITLE_FONTS")
    hand_fonts = jsx_table(src, "BD_HAND_FONTS")
    circle_name_fonts = jsx_table(src, "BN_NAME_FONTS")
    circle_hand_fonts = jsx_table(src, "BN_HAND_FONTS")
    pop_title_fonts = jsx_table(src, "POP_TITLE_FONTS")
    pop_hand_fonts = jsx_table(src, "POP_HAND_FONTS")
    for ft in title_fonts + hand_fonts + circle_name_fonts + circle_hand_fonts + pop_title_fonts + pop_hand_fonts:
        ft["have"] = bool(font_file(ft.get("ps")))
    return {
        "designs": jsx_table(src, "DESIGNS"),
        "designDefault": int(_jsx_number(src, "DESIGN_DEFAULT") or 0),
        "sizes": _jsx_strings(src, "SIZE_OPTIONS"),
        "sizesMm": [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", m.group(1))] if m else [],
        "sizeDefault": int(_jsx_number(src, "SIZE_DEFAULT") or 0),
        "msgDefault": _jsx_strings(src, "BD_MSG_DEFAULT"),
        # 원 사진 기본 글씨 — 작은 글씨 칸·문구 칸을 미리 채운다
        "circleMsgDefault": _jsx_strings(src, "BN_MSG_DEFAULT"),
        "subDefault": _jsx_text(src, "BN_SUB_DEFAULT"),
        # 팝 사진 기본 문구 (한 줄 — 이름은 문구 뒤에 붙는다)
        "popMsgDefault": _jsx_text(src, "POP_MSG_DEFAULT"),
        # 팝 사진 제목 두 줄 기본 (윗줄 검정 · 아랫줄 포인트 색) — 칸을 미리 채운다 (2026-10-15)
        "popTitleDefault": _jsx_strings(src, "POP_TITLE_DEFAULT"),
        "padYmm": _jsx_number(src, "BODY_PADDING_Y_MM") or 0,
        "gapMm": _jsx_number(src, "GAP_DEFAULT_MM") or 0,
        "draw": {
            "sticker": jsx_object(src, "BD"),
            "title": jsx_object(src, "BD_TITLE"),
            "heartAt": jsx_object(src, "BD_HEART_AT"),
            "heart": jsx_object(src, "BD_HEART"),
            "face": jsx_object(src, "BD_FACE"),
            "upper": jsx_object(src, "BD_UPPER"),
            "msg": jsx_object(src, "BD_MSG"),
            "sig": jsx_object(src, "BD_SIG"),
            "mini": jsx_object(src, "BD_MINI"),
            "colors": jsx_object(src, "BD_COLORS"),
            "titleFonts": title_fonts,
            "handFonts": hand_fonts,
            "minPt": _jsx_number(src, "LEGIBILITY_MIN_PT") or 0,
            "circle": {
                "sticker": jsx_object(src, "BN"),
                "name": jsx_object(src, "BN_NAME"),
                "sub": jsx_object(src, "BN_SUB"),
                "subHeart": jsx_object(src, "BN_SUB_HEART"),
                "circle": jsx_object(src, "BN_CIRCLE"),
                "face": jsx_object(src, "BN_FACE"),
                "upper": jsx_object(src, "BN_UPPER"),
                "msg": jsx_object(src, "BN_MSG"),
                "mini": jsx_object(src, "BN_MINI"),
                "doodle": jsx_object(src, "BN_DOODLE"),
                "colors": jsx_object(src, "BN_COLORS"),
                "nameFonts": circle_name_fonts,
                "handFonts": circle_hand_fonts,
            },
            # 팝 사진 (2026-10-13) — 옵션 표(레이아웃·서체·색·모양)와 머리 밖으로 규칙 (POP_* 표 그대로)
            "pop": {
                "sticker": jsx_object(src, "POP"),
                "layouts": jsx_table(src, "POP_LAYOUTS"),
                "region": jsx_object(src, "POP_REGION"),
                "titleFonts": pop_title_fonts,
                "handFonts": pop_hand_fonts,
                "colors": jsx_table(src, "POP_COLORS"),
                "shapes": jsx_table(src, "POP_SHAPES"),
                "puff": jsx_object(src, "POP_PUFF"),
                "cloud": jsx_object(src, "POP_CLOUD"),
                "geo": jsx_object(src, "POP_GEO"),
                # 프레임 안 (팝 끔, 10-13 저녁) — 모양마다 머리·얼굴 상자 자리 (프레임 폭 단위)
                "inside": jsx_table(src, "POP_INSIDE"),
                "text": jsx_object(src, "POP_TEXT_COLORS"),
                "msg": jsx_object(src, "POP_MSG"),
                "defaults": jsx_object(src, "POP_DEFAULTS"),
            },
        },
    }


# ── Christmas MERRY 미리보기 그림 (2026-10-07) ──────────────────────────────
# 매 장 같은 부분(레터링·리본·크림·흰 테두리)은 빌드 도구(scripts/art_library/build_xmas_merry.jsx)가 뽑은 그림 —
# FRAME.png = 칼선 bbox 그대로 · HAT.png = 모자 · SHAPES.json = 칼선·크림 패스(칼선 bbox 왼쪽 위 기준 그림 단위)와 실측값.
XMAS_MERRY_DIR = os.path.join(ART_DIR, "xmas_merry_v1")
XMAS_ART_NAMES = ("FRAME", "HAT")


def xmas_art_file(name, art_dir=None):
    """MERRY 미리보기 그림 경로 (FRAME · HAT 만). 없으면 None."""
    if name not in XMAS_ART_NAMES:
        return None
    path = os.path.join(art_dir or XMAS_MERRY_DIR, name + ".png")
    return path if os.path.isfile(path) else None


def _merry_draw(src):
    """MERRY 그리기 값 — .jsx MERRY 표(얼굴·모자·이름 자리) + 빌드 그림(칼선·크림 패스, 그림 시각)."""
    fonts = jsx_table(src, "MERRY_NAME_FONTS")
    for ft in fonts:
        ft["have"] = bool(font_file(ft.get("ps")))
    shapes = None
    try:
        with open(os.path.join(XMAS_MERRY_DIR, "SHAPES.json"), "r", encoding="utf-8") as f:
            shapes = json.load(f)
    except (OSError, ValueError):
        shapes = None
    art = {}
    for n in XMAS_ART_NAMES:
        path = xmas_art_file(n)
        if path:
            art[n] = int(os.path.getmtime(path))
    return {"table": jsx_object(src, "MERRY"), "fonts": fonts, "red": _jsx_text(src, "MERRY_RED"),
            "shapes": shapes, "art": art}


# ── 미리보기 서체 파일 (2026-10-06) ──────────────────────────────────────────
# Christmas 이름 서체(Sofia Pro Soft)는 Adobe Fonts 라 브라우저가 못 본다 — Illustrator 가 쓰는 파일을
# 이 Mac 에서 찾아 /api/composed/font 로 넘긴다 (미리보기 전용, 읽기만). PostScript 이름(name table ID 6)으로 맞춘다.
FONT_DIRS = (
    os.path.expanduser("~/Library/Fonts"),
    "/Library/Fonts",
    os.path.expanduser("~/Library/Application Support/Adobe/CoreSync/plugins/livetype/.w"),
    os.path.expanduser("~/Library/Application Support/Adobe/CoreSync/plugins/livetype/.r"),
    os.path.expanduser("~/Library/Application Support/Adobe/CoreSync/plugins/livetype/.t"),
)
_FONT_INDEX = {}
_FONT_LOCK = threading.Lock()   # 보드 서버는 요청마다 스레드 — 처음 훑는 동안 다른 요청이 반만 찬 표를 읽지 않게


def _ps_name(path):
    """OTF/TTF 의 PostScript 이름 (name ID 6). 못 읽으면 None — 서체 모음(.ttc)은 건너뛴다."""
    try:
        with open(path, "rb") as f:
            head = f.read(12)
            if len(head) < 12 or head[:4] == b"ttcf":
                return None
            num = struct.unpack(">H", head[4:6])[0]
            recs = f.read(16 * num)
            for i in range(num):
                tag, _, off, ln = struct.unpack(">4sIII", recs[16 * i:16 * i + 16])
                if tag != b"name":
                    continue
                f.seek(off)
                data = f.read(ln)
                count, soff = struct.unpack(">HH", data[2:6])
                for j in range(count):
                    pid, _, _, nid, sl, so = struct.unpack(">HHHHHH", data[6 + 12 * j:18 + 12 * j])
                    if nid == 6:
                        raw = data[soff + so:soff + so + sl]
                        return raw.decode("utf-16-be" if pid in (0, 3) else "latin-1", "ignore").strip()
    except (OSError, struct.error):
        return None
    return None


def font_file(ps):
    """PostScript 이름 → 서체 파일 경로 (없으면 None). 처음 한 번 폴더를 훑어 기억한다."""
    if not ps or not re.match(r"^[A-Za-z0-9._-]{1,80}$", ps):
        return None
    with _FONT_LOCK:
        if not _FONT_INDEX:
            for d in FONT_DIRS:
                try:
                    names = os.listdir(d)   # _listdir 는 점 파일을 빼는데 Adobe Fonts 파일은 전부 ".24536.otf" 꼴이다
                except OSError:
                    names = []
                for n in names:
                    if n.lower().endswith((".otf", ".ttf")):
                        p = os.path.join(d, n)
                        name = _ps_name(p)
                        if name and name not in _FONT_INDEX:
                            _FONT_INDEX[name] = p
            _FONT_INDEX.setdefault("", "")   # 빈 폴더여도 다시 훑지 않게
    return _FONT_INDEX.get(ps) or None


def _index(body, key, n):
    v = body.get(key)
    if isinstance(v, bool) or not isinstance(v, int) or not 0 <= v < n:
        raise ValueError("%s 값이 이상해요: %s" % (key, v))
    return v


RING_SHOT_TYPES = ("face", "upper", "full", "whole")


def _ring_shot_types(raw, picked):
    """화면이 보낸 사진별 종류 → 고른 사진만, 알려진 값만. 이상하면 ValueError."""
    if raw is None:
        return {}
    if not isinstance(raw, dict):
        raise ValueError("사진 종류 형식이 이상해요.")
    out = {}
    for k, v in raw.items():
        k = nfc(str(k))
        if k not in picked:
            continue
        if v not in RING_SHOT_TYPES:
            raise ValueError("알 수 없는 사진 종류예요: %s" % v)
        out[k] = v
    return out


def _ring_effect(v, ring):
    """글자 효과 키 — ring.jsx TEXT_EFFECTS 에 있는 것만. 없으면 기본 (TEXT_EFFECT_DEFAULT = 레트로)."""
    if v is None or v == "":
        return ring.get("effectDefault") or "none"
    keys = [e.get("key") for e in ring.get("effects") or []]
    if v not in keys:
        raise ValueError("알 수 없는 글자 효과예요: %s" % v)
    return v


BDAY_LINE_MAX = 40     # 생일 문구 한 줄 최대 글자 수 (길면 .jsx 가 두 줄을 같이 줄인다)
BDAY_SUB_MAX = 30      # 원 사진 작은 글씨 (SPECIAL DAY) 최대 글자 수 (길면 .jsx 가 줄인다)
BDAY_TITLE_MAX = 24    # 팝 사진 제목 한 줄 최대 글자 수 (길면 .jsx 가 두 줄을 같이 줄인다)


def build_script_launch(projects_dir, body, ring=None, xmas=None, bday=None):
    """구성 화면에서 Ring·Christmas·Special Day 만들기 → (script, launch, extra globals, 한 줄 요약). 이상하면 ValueError.

    Ring = $.global.__EVERSTORY_RING_OPTS__, Christmas = __EVERSTORY_XMAS_OPTS__, Special Day = __EVERSTORY_BDAY_OPTS__ 로
    폼 값 → 대화창 없이 만든다. ring = ring_choices, xmas = xmas_choices, bday = bday_choices.
    launch 는 경로 문자열이다 (.jsx _launchFolder).
    사진은 이름(NFC)으로 보낸다 — .jsx 가 _clean.psd 이름을 같은 방식으로 풀어 맞춘다.
    """
    if not isinstance(body, dict):
        raise ValueError("요청 형식이 이상해요.")
    script = body.get("script")
    if script not in SCRIPT_KEYS:
        raise ValueError("알 수 없는 스크립트예요: %s" % script)
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
        if key not in picked:
            picked.append(key)
    if script == "ring":
        if not ring:
            raise ValueError("Ring 선택지를 못 읽었어요.")
        layout = _index(body, "layoutIdx", len(ring["layouts"]))
        top = _text(body, "topText", limit=60)
        bottom = _text(body, "bottomText", limit=60)
        stripe = ring["layoutKeys"][layout] == "STRIPE"
        if stripe and not top:
            raise ValueError("스트라이프는 윗줄이 필요해요 (아래는 사진이 덮어요).")
        if not top and not bottom:
            raise ValueError("윗줄·아랫줄 중 하나는 적어 주세요.")
        upper = body.get("upper", True)
        if not isinstance(upper, bool):
            raise ValueError("대문자 값이 이상해요.")
        theme = _index(body, "themeIdx", len(ring["themes"]))
        color_mode = _index(body, "colorMode", len(ring["colorModes"])) if "colorMode" in body else ring["colorDefault"]
        color_idx = 0
        if color_mode == ring["colorSingle"]:
            color_idx = _index(body, "colorIdx", len(ring["draw"]["themes"][theme]["palette"]))
        opts = {
            "photoNames": picked,
            "themeIdx": theme,
            "colorMode": color_mode,     # 믹스(칸마다·디자인마다) / 한 색 통일 — ring.jsx COLOR_MODE_OPTIONS
            "colorIdx": color_idx,
            "layout": layout,
            "sizeMm": ring["sizesMm"][_index(body, "sizeIdx", len(ring["sizesMm"]))],
            "topText": top,
            "upper": upper,
            "bottomText": "" if stripe else bottom,
            # 사진 종류 (얼굴·상반신·전신) — 링·스트라이프에서 놓는 법이 다르다 (ring.jsx SHOT_FULL_CROP 주석)
            "shotTypes": _ring_shot_types(body.get("shotTypes"), picked),
            "textEffect": _ring_effect(body.get("textEffect"), ring),
            "customerName": _text(body, "customerName", limit=60),
            "orderDate": _text(body, "orderDate", limit=10),
        }
        summary = "Ring %s · 사진 %d장" % (ring["layoutKeys"][layout], len(picked))
        return script, cut, {"__EVERSTORY_RING_OPTS__": opts}, summary
    if script == "xmas":
        if not xmas:
            raise ValueError("Christmas 선택지를 못 읽었어요.")
        design = xmas["designs"][_index(body, "designIdx", len(xmas["designs"]))]
        oval = design.get("key") == "OVAL"
        name = _text(body, "name", limit=24)
        line = _text(body, "line", limit=60) if oval else ""   # 오벌 아래 문구 (원호 — 길면 .jsx 가 자간 → 크기로 줄인다)
        if oval and not line:
            raise ValueError("오벌 아래 문구를 적어 주세요.")
        if not oval and not name:
            raise ValueError("스티커에 들어갈 이름을 적어 주세요.")
        opts = {
            "photoNames": picked,
            "design": design.get("key"),
            "name": name,
            "line": line,
            "sizeMm": xmas["sizesMm"][_index(body, "sizeIdx", len(xmas["sizesMm"]))],
            "colorMode": _index(body, "colorMode", len(xmas["colorModes"])),
            "border": _index(body, "borderIdx", len(xmas["borders"])),
            # 사진 종류 — 하트·오벌은 얼굴 누끼용. 다른 종류면 .jsx 완료 창이 알린다
            "shotTypes": _ring_shot_types(body.get("shotTypes"), picked),
            "customerName": _text(body, "customerName", limit=60),
            "orderDate": _text(body, "orderDate", limit=10),
        }
        summary = "Christmas %s · 사진 %d장" % (opts["design"], len(picked))
        return script, cut, {"__EVERSTORY_XMAS_OPTS__": opts}, summary
    if script == "bday":
        if not bday:
            raise ValueError("Special Day 선택지를 못 읽었어요.")
        design = bday["designs"][_index(body, "designIdx", len(bday["designs"]))]
        circle = design.get("key") == "CIRCLE"
        pop = design.get("key") == "POP"
        line1 = _text(body, "line1", limit=BDAY_LINE_MAX)
        line2 = "" if pop else _text(body, "line2", limit=BDAY_LINE_MAX)   # 팝 사진은 한 줄 (문구 – 이름)
        if pop and not line1:
            raise ValueError("문구를 적어 주세요 (이름은 문구 뒤에 붙어요).")
        if not line1 and not line2:
            raise ValueError("문구를 한 줄 이상 적어 주세요.")
        name = _text(body, "name", limit=24)     # 하트 = 서명 "– 이름 –" (비우면 서명 없음) · 원 사진 = 위 큰 이름 (필수)
        if circle and not name:
            raise ValueError("원 사진 디자인에 들어갈 이름을 적어 주세요.")
        opts = {
            "photoNames": picked,
            "design": design.get("key"),
            "line1": line1,
            "line2": line2,
            "name": name,
            "sizeMm": bday["sizesMm"][_index(body, "sizeIdx", len(bday["sizesMm"]))],
            # 사진 종류 — 윗몸·전신이면 머리 크기 맞춤 + 몸은 하트(원)가 자른다, 얼굴이면 얼굴 상자 (.jsx _composeHeartAt·_composeCircleAt)
            "shotTypes": _ring_shot_types(body.get("shotTypes"), picked),
            "customerName": _text(body, "customerName", limit=60),
            "orderDate": _text(body, "orderDate", limit=10),
        }
        if circle:
            opts["sub"] = _text(body, "sub", limit=BDAY_SUB_MAX)   # 작은 글씨 (SPECIAL DAY) — 비우면 양옆 하트와 같이 없음
        if pop:
            # 옵션은 키로 넘긴다 (.jsx _consumePreset 이 키로 찾는다) — 레이아웃 · 제목 서체 · 문구 서체 · 프레임 색 · 모양
            P = bday["draw"]["pop"]
            for field, table in (("popLayout", "layouts"), ("popTitle", "titleFonts"), ("popHand", "handFonts"),
                                 ("popColor", "colors"), ("popShape", "shapes")):
                opts[field] = P[table][_index(body, field, len(P[table]))]["key"]
            # 사진 — True = 팝(머리가 프레임 밖으로) · False = 프레임 안. 없으면 .jsx 기본 (POP_DEFAULTS.popOut)
            pop_out = body.get("popOut", P["defaults"].get("popOut", True))
            if not isinstance(pop_out, bool):
                raise ValueError("팝 여부(popOut)는 true/false 여야 해요.")
            opts["popOut"] = pop_out
            # 제목 두 줄 — 쓴 그대로 (빈 칸 = 그 줄 없이). 안 보냈으면 키를 빼서 .jsx 기본 (POP_TITLE_DEFAULT)
            for field in ("titleTop", "titleBottom"):
                if field in body:
                    opts[field] = _text(body, field, limit=BDAY_TITLE_MAX)
        summary = "Special Day %s · 사진 %d장" % (opts["design"], len(picked))
        return script, cut, {"__EVERSTORY_BDAY_OPTS__": opts}, summary


# ── 미리보기 그리기용 값 (2026-10-03) ─────────────────────────────────────────
# 구성 화면이 Ring·Christmas·Special Day 결과를 브라우저 SVG 로 그린다 — 치수·색·글자 아치를 .jsx 표에서 그대로 읽어
# 미리보기 사본이 따로 놀지 않게 한다. 표 모양({ key: 값, ... } 배열·객체)만 읽는 작은 파서.
_JS_VAL = r'"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?|\[[^\]]*\]|[A-Za-z_]\w*'


def _js_value(v):
    v = v.strip()
    if v.startswith('"'):
        return re.sub(r"\\(.)", r"\1", v[1:-1])
    if v.startswith("["):
        return [_js_value(x) for x in re.findall(_JS_VAL, v[1:-1])]
    if re.match(r"^-?\d", v):
        return float(v)
    return {"true": True, "false": False, "null": None}.get(v, {"ref": v})


def _strip_comments(src):
    return re.sub(r"//[^\n]*", "", src)


def _js_pairs(body):
    return {k: _js_value(v) for k, v in re.findall(r"(\w+)\s*:\s*(%s)" % _JS_VAL, body)}


def jsx_table(src, var):
    """var NAME = [ { k: v, ... }, ... ]; → [dict] (중첩 없는 객체 배열)."""
    m = re.search(r"var %s\s*=\s*\[(.*?)\n  \];" % var, src, re.S)
    if not m:
        return []
    return [_js_pairs(b) for b in re.findall(r"\{([^{}]*)\}", _strip_comments(m.group(1)))]


def jsx_object(src, var):
    """var NAME = { k: v, ... }; → dict."""
    m = re.search(r"var %s\s*=\s*\{(.*?)\}\s*;" % var, src, re.S)   # 한 줄·여러 줄 모두 (안에 중괄호 없는 표만)
    return _js_pairs(_strip_comments(m.group(1))) if m else {}


def jsx_numbers(src, names):
    out = {}
    for n in names:
        v = _jsx_number(src, n)
        if v is not None:
            out[n] = v
    return out


def ring_draw(jsx_path):
    """Ring 미리보기 그리기 값 — 테마(팔레트 hex)·서체·비율 상수."""
    with open(jsx_path, "r", encoding="utf-8") as f:
        src = f.read()
    themes = []
    for t in jsx_table(src, "THEMES"):
        pal = t.get("palette")
        if isinstance(pal, dict) and "ref" in pal:
            t["palette"] = jsx_table(src, pal["ref"])
        themes.append(t)
    nums = ("PHOTO_RATIO", "RING_FONT_RATIO", "STRIPE_FONT_RATIO", "CAP_HEIGHT_RATIO", "TOP_SPAN_DEG", "BOTTOM_SPAN_DEG",
            "RING_TRACKING", "HALO_RATIO", "FIT_MARGIN", "MIN_H_SCALE", "DEF_SUBJECT_PCT", "STRIPE_SUBJECT_PCT",
            "DEF_Y_BIAS_PCT", "STRIPE_Y_BIAS_PCT", "SUBJECT_BLEED", "STRIPE_TEXT_EDGE",
            "SHOT_FLAT_FILL", "SHOT_FULL_CROP", "EFFECT_OFFSET", "EFFECT_SHADOW_MIX", "EFFECT_RETRO_STROKE")
    out = jsx_numbers(src, nums)
    out["STRIPE_W_RATIO"] = 1 / 21.0 if re.search(r"var STRIPE_W_RATIO\s*=\s*1\s*/\s*21", src) else (
        _jsx_number(src, "STRIPE_W_RATIO") or 1 / 21.0)
    cut = re.search(r"var CUT_MARGIN_VALUES\s*=\s*\[(.*?)\];", src)
    cut_vals = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", cut.group(1))] if cut else [0]
    return {
        "themes": themes,
        "layoutType": jsx_table(src, "LAYOUT_TYPE"),
        "discHex": [None if x in ("null", None) else x for x in
                    [_js_value(v) for v in re.findall(_JS_VAL, (re.search(r"var DISC_HEX\s*=\s*\[(.*?)\];", src) or re.match("()", "")).group(1))]],
        "discDefault": int(_jsx_number(src, "DISC_DEFAULT") or 0),
        "stripeBase": _jsx_text(src, "STRIPE_BASE_HEX") or "FFFFFF",
        "haloHex": _jsx_text(src, "HALO_HEX") or "FFFFFF",
        "retroFill": _jsx_text(src, "EFFECT_RETRO_FILL") or "FFF6E8",
        "bleedMm": max(0.0, -cut_vals[int(_jsx_number(src, "CUT_MARGIN_DEFAULT_INDEX") or 0)]),
        "nums": out,
    }
