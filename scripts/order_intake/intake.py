#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Shopify 주문 -> projects/{고객명 주문번호}/01_original/ 사진 인테이크.

주문 JSON(Shopify Admin GraphQL 응답)을 받아서
  1) 프로젝트 폴더 생성
  2) Easify(cdn.tigren.com) 업로드 사진 다운로드
  3) {NN}_{BUCKET}_{원본명}.{ext} 로 리네임
  4) _order.json 매니페스트 기록
까지 한다. 표준 라이브러리만 쓴다 (시스템 python3.9).

  python3 intake.py --order-json order.json --dry-run
  python3 intake.py --order-json order.json

Easify CDN 은 업로드 90일 후 객체를 지운다 (x-amz-expiration).
이 스크립트가 유일한 아카이브 경로다.
"""

import argparse
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

# ---------------------------------------------------------------- 상수

# 사진이 아닌 Easify 내부 속성. 이것만 콕 집어 뺀다.
# 주의: `_` 접두를 전부 거르면 안 된다 — 초기 주문(#1001~#1004)은 사진 키가 `_Photos` 다.
JUNK_KEYS = {"_tpo_add_by"}

# 속성 키(번호 접미 제거, 앞 `_` 제거) -> Package 버킷 토큰.
# 매칭 안 되는 사진 키는 버킷 없이 받고 리포트에 올린다 (조용히 추측하지 않는다).
KEY_TO_BUCKET = {
    "big print": "BIG",
    "medium print": "MED",
    "small print": "SML",
    # 단일 사이즈 SKU(Face Sticker 등)는 버킷 개념이 없다. 아는 키이므로 경고하지 않는다.
    "photos": None,
}

BUCKET_ORDER = {"BIG": 0, "MED": 1, "SML": 2}

# 비-Package 상품(Face/Full Body/Shape)은 고객이 **사이즈 하나**를 고르므로 버킷이 없다.
# 대신 그 사이즈가 SKU 에 박혀 있다: EVS-FACE-19-WM -> 19mm -> 0.75" -> XS.
# 즉 "안 나뉘는" 주문도 사이즈를 아는 것이며, 운영자가 손으로 정할 이유가 없다.
SKU_SIZE_RE = re.compile(r"-(\d{2}|MIX)-[A-Z]{2}$", re.I)
SKU_MM_TO_TIER = {"19": "XS", "25": "S", "32": "M", "38": "L", "51": "XL", "64": "XXL"}


# SKU 가 없는 초기 주문(#1001~#1004)은 사이즈가 옵션 라벨에 있다:
# "Photos to include (19mm)" -> 19mm -> XS.
OPTION_MM_RE = re.compile(r"\((\d{2})\s*mm\)")


def tier_from_options(line_item):
    for attr in line_item.get("customAttributes") or []:
        m = OPTION_MM_RE.search(attr.get("key") or "")
        if m:
            t = SKU_MM_TO_TIER.get(m.group(1))
            if t:
                return t
    return None


def tier_from_sku(sku):
    """SKU 의 사이즈 코드 -> 티어 토큰. Mixed 와 미매칭은 None."""
    if not sku:
        return None
    m = SKU_SIZE_RE.search(sku)
    if not m:
        return None
    code = m.group(1).upper()
    # Mixed 는 전 사이즈 모드로 제작한다 — 파일명에 토큰을 박지 않는다.
    return None if code == "MIX" else SKU_MM_TO_TIER.get(code)

# SKU 사이즈 코드 -> mm. tier 토큰(SKU_MM_TO_TIER)과 같은 표를 mm 으로 본 것.
SKU_SIZE_MM = {"19": 19.05, "25": 25.4, "32": 31.75, "38": 38.1, "51": 50.8, "64": 63.5}

# SKU 끝 두 글자가 재질 코드다 (라이브 스토어 variant 로 확인 2026-08-24).
SKU_MATERIAL_RE = re.compile(r"-([A-Z]{2})$", re.I)
SKU_MATERIAL = {"WM": "White Matte", "TR": "Translucent", "SV": "Silver", "GD": "Gold"}

# Package SKU 는 사이즈 코드 자리에 FULL/MINI 가 온다 (EVS-PACKAGE-FULL-WM) — 그게 곧 시트 수다.
SKU_PACKAGE_RE = re.compile(r"-PACKAGE-(FULL|MINI)-[A-Z]{2}$", re.I)
PACKAGE_SHEETS_BY_KIND = {"FULL": 2, "MINI": 1}


def material_from_sku(sku):
    """SKU -> 재질 이름. 모르면 None (추측하지 않는다)."""
    if not sku:
        return None
    m = SKU_MATERIAL_RE.search(sku)
    return SKU_MATERIAL.get(m.group(1).upper()) if m else None


def size_from_sku(sku):
    """SKU -> (mode, size_mm, sheets). mode = single | package | all. 모르면 None.

    일러스트 스크립트의 내부 sentinel(-2/-3) 을 매니페스트에 쓰지 않는다 — 저 숫자는
    Everstory_mixed.jsx 사정이고, 매니페스트는 그 사정을 몰라야 한다.
    """
    if not sku:
        return None
    m = SKU_PACKAGE_RE.search(sku)
    if m:
        return ("package", None, PACKAGE_SHEETS_BY_KIND.get(m.group(1).upper()))
    m = SKU_SIZE_RE.search(sku)
    if not m:
        return None
    code = m.group(1).upper()
    if code == "MIX":
        return ("all", None, None)          # Mixed 는 전 사이즈 모드로 제작
    mm = SKU_SIZE_MM.get(code)
    return ("single", mm, None) if mm else None


def size_from_options(options, line_item_index):
    """SKU 없는 초기 주문(#1001~#1004) 폴백 — 옵션 라벨의 (19mm) 에서 읽는다."""
    for o in options:
        if o.get("line_item") != line_item_index:
            continue
        m = OPTION_MM_RE.search(o.get("key") or "")
        if m:
            mm = SKU_SIZE_MM.get(m.group(1))
            if mm:
                return ("single", mm, None)
    return None


def build_job(manifest):
    """매니페스트 -> 제작 잡티켓. **매니페스트 안의 값만 쓴다** (네트워크 없음).

    왜 미리 계산해서 박아두나: 재질·사이즈는 SKU 문자열 안에 인코딩돼 있어서, 읽는 쪽마다
    SKU 해석기를 한 벌씩 갖게 된다 (일러스트·포토샵·CLI…). 규칙이 바뀌면 전부 고쳐야 하고,
    하나라도 빠뜨리면 **틀린 재질로 인쇄된다.** 해석은 여기서 한 번만 한다.

    **한 값으로 안 좁혀지면 채우지 않고 notes 에 이유를 남긴다** — 임의로 하나를 고르면
    line item 이 여러 개인 주문에서 절반이 틀린 재질로 나간다.
    """
    order = manifest.get("order") or {}
    items = manifest.get("line_items") or []
    options = manifest.get("options") or []
    photos = manifest.get("photos") or []

    job = {
        "order": (order.get("name") or "").lstrip("#"),
        "customer": order.get("customer") or "",
        "product": "",
        "quantity": 0,
        "material": None,
        "mode": None,
        "size_mm": None,
        "sheets": None,
        "photos": sum(1 for p in photos if p.get("file")),
        "sticker_name": "",
        "notes": [],
    }

    # 옵션 `Name` = 스티커에 넣을 이름. 고객 이름과 별개다 (선물이면 받는 사람 이름).
    for o in options:
        key, _ = split_key(o.get("key") or "")
        if key == "name" and o.get("value"):
            job["sticker_name"] = str(o["value"]).strip()
            break

    titles, materials, sizes = [], [], []
    for it in items:
        title = it.get("title")
        if title and title not in titles:
            titles.append(title)
        job["quantity"] += it.get("quantity") or 0
        mat = material_from_sku(it.get("sku"))
        if mat and mat not in materials:
            materials.append(mat)
        size = size_from_sku(it.get("sku")) or size_from_options(options, it.get("index"))
        if size and size not in sizes:
            sizes.append(size)
    job["product"] = " + ".join(titles)

    if len(materials) == 1:
        job["material"] = materials[0]
    elif not materials:
        job["notes"].append("재질: SKU 에서 못 읽음")
    else:
        job["notes"].append("재질: line item 마다 다름 (%s)" % " / ".join(materials))

    if len(sizes) == 1:
        job["mode"], job["size_mm"], job["sheets"] = sizes[0]
    elif not sizes:
        job["notes"].append("사이즈: SKU 에서 못 읽음")
    else:
        job["notes"].append("사이즈: line item 마다 다름 — 주문을 나눠 제작할 것")
    return job


def job_label(job):
    """잡티켓 -> 콘솔 한 줄."""
    bits = [job["product"] or "?"]
    if job["material"]:
        bits.append(job["material"])
    if job["mode"] == "package":
        bits.append("Package %s시트" % (job["sheets"] or "?"))
    elif job["mode"] == "all":
        bits.append("전 사이즈")
    elif job["mode"] == "single" and job["size_mm"]:
        bits.append('%.2f" / %dmm' % (job["size_mm"] / 25.4, round(job["size_mm"])))
    if job["sticker_name"]:
        bits.append("이름 '%s'" % job["sticker_name"])
    line = " · ".join(bits)
    return line + ("   ⚠ " + " / ".join(job["notes"]) if job["notes"] else "")


def shipping_block(order):
    """Shopify shippingAddress -> 매니페스트용. 없으면 None.

    **개인정보다.** `_order.json` 은 .gitignore 에 명시돼 있고 커밋되지 않는다.
    """
    a = order.get("shippingAddress")
    if not a:
        return None
    return {k: a.get(k) for k in
            ("name", "company", "address1", "address2", "city",
             "province", "provinceCode", "zip", "country", "countryCodeV2", "phone")}


# 매직바이트 -> 확장자. URL 확장자는 믿지 않는다.
HEIF_BRANDS = {
    b"heic", b"heix", b"hevc", b"hevx", b"heim", b"heis", b"hevm", b"hevs",
    b"mif1", b"msf1",
}

USER_AGENT = "everstory-order-intake/1"

# ---------------------------------------------------------------- 유틸


def sniff_format(head):
    """앞부분 바이트로 실제 포맷 판정. 모르면 None."""
    if head[:3] == b"\xff\xd8\xff":
        return "jpg"
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if head[:4] == b"GIF8":
        return "gif"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    if head[:4] in (b"II\x2a\x00", b"MM\x00\x2a"):
        return "tif"
    if head[4:8] == b"ftyp":
        brand = head[8:12]
        if brand in HEIF_BRANDS:
            return "heic"
        if brand in (b"avif", b"avis"):
            return "avif"
    return None


def safe_component(name):
    """파일/폴더명으로 안전하게. macOS NFC 로 정규화한다."""
    name = unicodedata.normalize("NFC", name)
    name = re.sub(r"[\\/:*?\"<>|\x00-\x1f]", "_", name)
    name = re.sub(r"\s+", " ", name).strip().strip(".")
    return name or "untitled"


def original_basename(url):
    """Easify URL 에서 사람이 읽을 수 있는 원본 파일명만 뽑는다.

    새 형식: uploads/{uuid36}-IMG_6425.jpeg
    구 형식: uploads/202605/{epoch_ms}-IMG_1242.jpeg
    """
    path = urllib.parse.urlsplit(url).path
    base = urllib.parse.unquote(os.path.basename(path))
    base = os.path.splitext(base)[0]
    base = re.sub(
        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-", "", base, flags=re.I
    )
    base = re.sub(r"^\d{10,}-", "", base)
    base = base.strip("-_ ")
    return safe_component(base)


def split_key(raw_key):
    """속성 키 -> (정규화 키, 순번). `_Photos-2` -> ("photos", 2)."""
    key = raw_key[1:] if raw_key.startswith("_") else raw_key
    m = re.match(r"^(.*?)-(\d+)$", key)
    if m:
        return m.group(1).strip().lower(), int(m.group(2))
    return key.strip().lower(), 0


def is_url(value):
    return isinstance(value, str) and value.startswith(("http://", "https://"))


def utcnow():
    return datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


# ---------------------------------------------------------------- 주문 파싱


def load_order(path):
    """GraphQL 응답 / bare order / orders.nodes 리스트 전부 받는다."""
    with open(path, "r", encoding="utf-8") as f:
        doc = json.load(f)
    if isinstance(doc, dict) and "data" in doc:
        data = doc["data"]
        if isinstance(data.get("order"), dict):
            return data["order"]
        nodes = (data.get("orders") or {}).get("nodes") or []
        if len(nodes) == 1:
            return nodes[0]
        if len(nodes) > 1:
            raise SystemExit(
                "주문이 %d 개다. 한 번에 하나씩 처리한다 — JSON 을 나눠서 다시 실행." % len(nodes)
            )
        raise SystemExit("JSON 에서 주문을 못 찾았다.")
    if isinstance(doc, dict) and "name" in doc and "lineItems" in doc:
        return doc
    raise SystemExit("알 수 없는 JSON 형식이다.")


def line_item_nodes(order):
    li = order.get("lineItems") or {}
    if isinstance(li, dict):
        return li.get("nodes") or []
    return li or []


def customer_label(order):
    cust = order.get("customer") or {}
    parts = [cust.get("firstName"), cust.get("lastName")]
    name = " ".join(p for p in parts if p).strip()
    if name:
        return name
    return (order.get("email") or "").split("@")[0] or "Unknown"


def parse_photos(order):
    """주문 -> (photos, options, unknown_keys).

    photos: [{seq, bucket, property, url, line_item, ...}]  버킷 -> 등장순 정렬
    options: 사진이 아닌 속성 (Name, Photos to include, Special instructions ...)
    unknown_keys: 버킷 매핑이 안 된 사진 키
    """
    photos = []
    options = []
    unknown = []

    for li_idx, li in enumerate(line_item_nodes(order)):
        title = li.get("title") or "?"
        sku = li.get("sku")
        for attr in li.get("customAttributes") or []:
            raw_key = attr.get("key") or ""
            value = attr.get("value")
            if raw_key in JUNK_KEYS:
                continue
            key, idx = split_key(raw_key)
            if not is_url(value):
                options.append(
                    {"line_item": li_idx, "product": title, "key": raw_key, "value": value}
                )
                continue
            bucket = KEY_TO_BUCKET.get(key)
            if key not in KEY_TO_BUCKET and key not in unknown:
                unknown.append(key)
            photos.append(
                {
                    "bucket": bucket,
                    "token": bucket or tier_from_sku(sku) or tier_from_options(li),
                    "property": raw_key,
                    "url": value,
                    "line_item": li_idx,
                    "product": title,
                    "sku": sku,
                    "_sort": (li_idx, BUCKET_ORDER.get(bucket, 99), idx, raw_key),
                }
            )

    photos.sort(key=lambda p: p["_sort"])
    for n, p in enumerate(photos, 1):
        p["seq"] = n
        del p["_sort"]
    return photos, options, unknown


def target_filename(photo, ext):
    parts = ["%02d" % photo["seq"]]
    if photo.get("token"):
        parts.append(photo["token"])
    parts.append(original_basename(photo["url"]))
    return "_".join(parts) + "." + ext


# ---------------------------------------------------------------- 다운로드


def head(url):
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        return dict(r.headers), r.status


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read(), dict(r.headers)


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def prior_records(project_dir):
    """기존 _order.json 의 순번별 기록. 재실행 시 downloaded_at 을 보존하려고 읽는다."""
    path = os.path.join(project_dir, "_order.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            doc = json.load(f)
    except (OSError, ValueError):
        return {}
    return {r.get("seq"): r for r in doc.get("photos") or [] if r.get("seq")}


def mtime_iso(path):
    ts = datetime.datetime.utcfromtimestamp(os.path.getmtime(path))
    return ts.replace(microsecond=0).isoformat() + "Z"


def existing_by_seq(folder, seq):
    """이미 받아둔 같은 순번 파일이 있으면 경로 반환 (재실행 멱등성)."""
    prefix = "%02d_" % seq
    try:
        for name in sorted(os.listdir(folder)):
            if name.startswith(prefix) and not name.startswith("."):
                return os.path.join(folder, name)
    except OSError:
        pass
    return None


# ---------------------------------------------------------------- Shopify Admin API

DEFAULT_SHOP = "q3gj59-am.myshopify.com"
DEFAULT_API_VERSION = "2026-07"
# 스키마 검증 결과 필요한 스코프. read_orders 만으로는 customer 필드가 안 온다.
REQUIRED_SCOPES = "read_orders, read_customers, read_all_orders"
# read_all_orders 가 없으면 Shopify 는 **최근 60일 주문만** 돌려준다 (오류 없이 조용히).
SCOPE_ALL_ORDERS = "read_all_orders"
# 인증 두 갈래.
#  (A) client credentials — 2026-01-01 이후 Dev Dashboard 로 만든 앱. Client ID/Secret 을
#      매 실행마다 24시간짜리 access token 으로 교환한다. 영구 토큰이 디스크에 안 남는다.
#  (B) 정적 shpat_ 토큰 — 2026-01-01 이전에 어드민에서 만든 legacy 커스텀 앱만 해당.
#      Shopify 가 신규 발급을 막았으므로 새로 셋업하는 경우엔 (A) 뿐이다.
TOKEN_ENV = "SHOPIFY_ADMIN_TOKEN"
KEYCHAIN_SERVICE = "everstory-shopify-admin"
CLIENT_ID_ENV = "SHOPIFY_CLIENT_ID"
CLIENT_SECRET_ENV = "SHOPIFY_CLIENT_SECRET"
KEYCHAIN_CLIENT_ID = "everstory-shopify-client-id"
KEYCHAIN_CLIENT_SECRET = "everstory-shopify-client-secret"
OAUTH_PATH = "/admin/oauth/access_token"

ORDER_FIELDS = """
      id
      name
      createdAt
      email
      customer { firstName lastName }
      shippingAddress {
        name firstName lastName company
        address1 address2 city province provinceCode zip country countryCodeV2 phone
      }
      lineItems(first: 100) {
        nodes { title quantity sku customAttributes { key value } }
      }
"""

ORDERS_QUERY = """
query Orders($q: String, $n: Int!) {
  orders(first: $n, reverse: true, query: $q) {
    nodes {%s}
  }
}
""" % ORDER_FIELDS


CHECK_QUERY = """
query Check {
  shop { name myshopifyDomain }
  publicApiVersions { handle supported }
  currentAppInstallation { accessScopes { handle } }
}
"""


def keychain_secret(service):
    """키체인에서 값 하나를 읽는다. 없으면 None. 값은 절대 출력하지 않는다."""
    try:
        r = subprocess.run(
            ["security", "find-generic-password", "-s", service, "-w"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if r.returncode == 0 and r.stdout.strip():
        return r.stdout.decode("utf-8").strip()
    return None


def _from_env_or_keychain(env_name, kc_service):
    v = os.environ.get(env_name)
    if v and v.strip():
        return v.strip(), "env:%s" % env_name
    v = keychain_secret(kc_service)
    if v:
        return v, "keychain:%s" % kc_service
    return None, None


def exchange_client_credentials(shop, client_id, client_secret):
    """Client ID/Secret -> 24시간 access token (client credentials grant).

    앱과 스토어가 **같은 Shopify organization** 에 있어야 동작한다.
    """
    url = "https://%s%s" % (shop, OAUTH_PATH)
    body = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded",
                 "User-Agent": USER_AGENT},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            doc = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code in (400, 401):
            raise SystemExit(
                "Client ID/Secret 이 거부됐다 (%s).\n"
                "  · Dev Dashboard 의 앱 Settings 값과 일치하는지\n"
                "  · 앱을 이 스토어에 Install 했는지\n"
                "  · 앱과 스토어가 **같은 organization** 인지 (client credentials 필수 조건)"
                % e.code)
        raise SystemExit("토큰 교환 실패 HTTP %s\n  %s" % (e.code, url))
    except urllib.error.URLError as e:
        raise SystemExit("토큰 교환 접속 실패: %s\n  %s" % (e.reason, url))
    tok = doc.get("access_token")
    if not tok:
        raise SystemExit("토큰 교환 응답에 access_token 이 없다: %s"
                         % json.dumps(doc, ensure_ascii=False)[:300])
    return tok, doc.get("expires_in"), doc.get("scope")


def resolve_token(args):
    """(token, 출처설명) 반환. 어떤 경로로도 비밀값을 출력하지 않는다.

    우선순위: client credentials(신) -> 정적 토큰(구 legacy 앱).
    """
    cid, cid_src = _from_env_or_keychain(CLIENT_ID_ENV, KEYCHAIN_CLIENT_ID)
    csec, _ = _from_env_or_keychain(CLIENT_SECRET_ENV, KEYCHAIN_CLIENT_SECRET)
    if cid and csec:
        tok, expires, _scope = exchange_client_credentials(args.shop, cid, csec)
        hours = ("%.0f시간" % (expires / 3600.0)) if expires else "?"
        return tok, "client credentials (%s, %s 유효)" % (cid_src, hours)

    tok, src = _from_env_or_keychain(TOKEN_ENV, KEYCHAIN_SERVICE)
    if tok:
        return tok, "정적 토큰 (%s · legacy 앱)" % src

    if cid or csec:
        raise SystemExit(
            "Client ID 와 Secret 중 하나만 있다. 둘 다 넣어야 한다.\n"
            "  security add-generic-password -s '%s' -a \"$USER\" -w\n"
            "  security add-generic-password -s '%s' -a \"$USER\" -w"
            % (KEYCHAIN_CLIENT_ID, KEYCHAIN_CLIENT_SECRET))

    raise SystemExit(
        "인증 정보를 못 찾았다.\n"
        "\n"
        "Dev Dashboard 앱 Settings 의 Client ID / Client secret 을 키체인에 넣을 것:\n"
        "  security add-generic-password -s '%s' -a \"$USER\" -w\n"
        "  security add-generic-password -s '%s' -a \"$USER\" -w\n"
        "\n"
        "(2026-01-01 이전에 만든 legacy 커스텀 앱이 있다면 정적 shpat_ 토큰도 쓸 수 있다:\n"
        "  security add-generic-password -s '%s' -a \"$USER\" -w)"
        % (KEYCHAIN_CLIENT_ID, KEYCHAIN_CLIENT_SECRET, KEYCHAIN_SERVICE))


def graphql(shop, version, token, query, variables):
    url = "https://%s/admin/api/%s/graphql.json" % (shop, version)
    payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload, method="POST",
        headers={
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            doc = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise SystemExit("토큰이 거부됐다 (401). 토큰 값과 만료를 확인할 것.")
        if e.code == 403:
            raise SystemExit("권한 부족 (403). 커스텀 앱 스코프를 확인할 것: %s" % REQUIRED_SCOPES)
        if e.code == 404:
            raise SystemExit("엔드포인트 없음 (404). --shop / --api-version 확인:\n  %s" % url)
        if e.code == 429:
            raise SystemExit("레이트 리밋 (429). 잠시 뒤 다시 실행할 것.")
        detail = ""
        try:
            detail = e.read().decode("utf-8", "replace")[:300]
        except Exception:  # noqa: BLE001
            pass
        raise SystemExit("Admin API HTTP %s\n  %s\n  %s" % (e.code, url, detail))
    except urllib.error.URLError as e:
        raise SystemExit("Admin API 접속 실패: %s\n  %s" % (e.reason, url))
    if doc.get("errors"):
        raise SystemExit("GraphQL 오류: %s" % json.dumps(doc["errors"], ensure_ascii=False)[:600])
    return doc.get("data") or {}


def fetch_orders(args, query_str, limit):
    token, src = resolve_token(args)
    print("토큰      : %s  (값은 출력하지 않는다)" % src)
    data = graphql(args.shop, args.api_version, token, ORDERS_QUERY,
                   {"q": query_str, "n": limit})
    return (data.get("orders") or {}).get("nodes") or []


def run_check(args):
    """토큰·도메인·API 버전이 실제로 통하는지 확인한다."""
    token, src = resolve_token(args)
    print("인증      : %s" % src)
    print("도메인    : %s" % args.shop)
    print("API 버전  : %s" % args.api_version)
    data = graphql(args.shop, args.api_version, token, CHECK_QUERY, {})
    shop = data.get("shop") or {}
    print("")
    print("✅ 접속 성공 — %s (%s)" % (shop.get("name"), shop.get("myshopifyDomain")))
    vers = [v for v in (data.get("publicApiVersions") or []) if v.get("supported")]
    handles = [v.get("handle") for v in vers]
    print("지원 버전 : %s" % ", ".join(handles))
    if args.api_version not in handles:
        print("⚠ 현재 --api-version(%s) 이 지원 목록에 없다. 위 목록에서 고를 것." % args.api_version)

    inst = data.get("currentAppInstallation") or {}
    granted = sorted(sc.get("handle") for sc in (inst.get("accessScopes") or []) if sc.get("handle"))
    print("")
    print("부여된 스코프: %s" % (", ".join(granted) or "(없음)"))
    need = [x.strip() for x in REQUIRED_SCOPES.split(",")]
    missing = [x for x in need if x not in granted]
    if not missing:
        print("✅ 필요한 스코프 전부 있음")
    else:
        print("⚠ 빠진 스코프: %s" % ", ".join(missing))
        if SCOPE_ALL_ORDERS in missing:
            print("   → %s 없이는 **최근 60일 주문만** 조회된다. 오래된 주문이 오류 없이 그냥 안 보인다."
                  % SCOPE_ALL_ORDERS)
    print("")
    print("(주문 조회까지 확인하려면  --list 5  를 돌려볼 것)")
    print("(client credentials 토큰은 24시간마다 만료된다 — 매 실행 새로 교환하므로 갱신 작업은 없다)")


def archived_orders(projects_dir):
    """매니페스트가 있는 주문번호 -> {folder, got, lost}."""
    found = {}
    try:
        names = os.listdir(projects_dir)
    except OSError:
        return found
    for n in sorted(names):
        mp = os.path.join(projects_dir, n, "_order.json")
        if not os.path.isfile(mp):
            continue
        try:
            with open(mp, "r", encoding="utf-8") as f:
                doc = json.load(f)
        except (OSError, ValueError):
            continue
        nm = (doc.get("order") or {}).get("name")
        if not nm:
            continue
        photos = doc.get("photos") or []
        found[nm] = {
            "folder": os.path.join(projects_dir, n),
            "got": sum(1 for r in photos if r.get("file")),
            "lost": sum(1 for r in photos if r.get("unavailable")),
        }
    return found


# 01_original 에 들어오는 사진. 인테이크가 매직바이트로 판정해 저장하는 포맷 + 수동으로
# 넣는 PSD/TIF. 확장자 목록이라 완벽하진 않지만, 세는 대상이 "사진 몇 장 들어왔나" 라
# 목록에 없는 포맷이 하나 섞여도 진행 표시가 하나 어긋날 뿐이다.
PHOTO_EXTS = ("jpg", "jpeg", "png", "heic", "heif", "avif", "tif", "tiff",
              "webp", "gif", "psd", "psb")


def _listdir(path):
    try:
        return [n for n in os.listdir(path) if not n.startswith(".")]
    except OSError:
        return []


def project_progress(project_dir):
    """폴더만 보고 파이프라인 진행을 읽는다 -> {originals, pairs, sheets}.

    상태 저장소를 따로 두지 않는다. 각 Phase 는 이미 산출물을 정해진 폴더에 남기므로
    그것이 곧 진행 기록이고, 손으로 갱신할 일이 없어 실제와 어긋날 수가 없다.

      originals  01_original 사진 수                       (Phase -1 인테이크 산출)
      pairs      02_cutout 의 _clean.psd + _sil.png 페어 수  (Phase A 누끼 산출)
      sheets     03_output 의 .ai 시트 수                    (Phase B 산출)

    인쇄·발송(Phase C)은 디스크에 흔적이 남지 않는다. 추측해서 채우지 않는다.
    """
    originals = [n for n in _listdir(os.path.join(project_dir, "01_original"))
                 if n.rsplit(".", 1)[-1].lower() in PHOTO_EXTS]

    # 페어 = 같은 base 의 _clean.psd 와 _sil.png 가 **둘 다** 있는 것. 한쪽만 있으면
    # Phase B 가 그 디자인을 못 쓰므로 진행으로 세지 않는다.
    # 양쪽 다 같은 listdir 결과라 macOS NFD 정규화가 서로 어긋날 일이 없다.
    cleans, sils = set(), set()
    for n in _listdir(os.path.join(project_dir, "02_cutout")):
        low = n.lower()
        if low.endswith("_clean.psd"):
            cleans.add(n[:-len("_clean.psd")])
        elif low.endswith("_sil.png"):
            sils.add(n[:-len("_sil.png")])

    sheets = [n for n in _listdir(os.path.join(project_dir, "03_output"))
              if n.lower().endswith(".ai")]

    return {"originals": len(originals), "pairs": len(cleans & sils), "sheets": len(sheets)}


def progress_label(prog):
    """project_progress -> 한 줄 표기. 사진이 하나도 없으면 셀 것이 없다."""
    if not prog["originals"]:
        return "—"
    return "누끼 %d/%d · 시트 %s" % (
        prog["pairs"], prog["originals"], prog["sheets"] if prog["sheets"] else "—")


def address_oneline(ship):
    """배송지 -> 한 줄. 라벨 붙일 때 눈으로 대조하는 용도."""
    if not ship:
        return "-"
    parts = [ship.get("address1"), ship.get("address2"), ship.get("city"),
             ship.get("provinceCode") or ship.get("province"), ship.get("zip"),
             ship.get("countryCodeV2") or ship.get("country")]
    return ", ".join(p for p in parts if p)


def backfill_jobs(projects_dir):
    """기존 `_order.json` 에 job 블록을 채워 넣는다. **토큰·네트워크 불필요.**

    job 은 매니페스트 안의 line_items/options/photos 만으로 계산되므로, 이미 받아둔
    주문도 Shopify 를 다시 부르지 않고 잡티켓을 갖게 된다. 배송지(shipping)는 매니페스트에
    없던 값이라 여기서 못 채운다 — 그건 해당 주문을 다시 인테이크해야 들어온다.
    """
    try:
        names = sorted(os.listdir(projects_dir))
    except OSError:
        raise SystemExit("projects 폴더를 못 찾았다: %s" % projects_dir)
    done = 0
    for n in names:
        path = os.path.join(projects_dir, n, "_order.json")
        if not os.path.isfile(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                doc = json.load(f)
        except (OSError, ValueError) as e:
            print("  ⚠ %s — 읽기 실패: %s" % (n, e))
            continue
        doc["job"] = build_job(doc)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
        done += 1
        print("  %-34s %s" % (n, job_label(doc["job"])))
        if not doc.get("shipping"):
            print("  %-34s (배송지 없음 — 다시 인테이크해야 들어온다)" % "")
    print("")
    print("job 블록 %d건 갱신." % done)


# ---------------------------------------------------------------- 주문 처리


def process_order(order, args, projects_dir):
    order_name = order.get("name") or "UNKNOWN"
    customer = customer_label(order)
    photos, options, unknown = parse_photos(order)

    folder_name = safe_component(
        args.folder or ("%s %s" % (customer, order_name.lstrip("#")))
    )
    project_dir = os.path.join(projects_dir, folder_name)
    original_dir = os.path.join(project_dir, "01_original")

    print("주문      : %s  (%s)" % (order_name, order.get("createdAt") or "?"))
    print("고객      : %s  <%s>" % (customer, order.get("email") or "-"))
    print("폴더      : %s" % project_dir)
    print("사진      : %d 장" % len(photos))
    if unknown:
        print("⚠ 버킷 미매핑 키: %s  -> 버킷 없이 받는다" % ", ".join(unknown))
    if not photos:
        print("⚠ 사진 속성이 없다 — 건너뜀")
        return None
    print("")

    for opt in options:
        print("  옵션  %-28s = %s" % (opt["key"], opt["value"]))
    if options:
        print("")

    if not args.dry_run:
        os.makedirs(original_dir, exist_ok=True)
        for sub in ("02_cutout", "03_output"):
            os.makedirs(os.path.join(project_dir, sub), exist_ok=True)

    prior_manifest = {} if args.dry_run else prior_records(project_dir)
    records = []
    total_bytes = 0
    warnings = []

    for p in photos:
        url = p["url"]
        prior = None if args.dry_run else existing_by_seq(original_dir, p["seq"])
        if prior and not args.force:
            name = os.path.basename(prior)
            size = os.path.getsize(prior)
            digest = sha256_of(prior)
            total_bytes += size
            print("  %02d  %-4s  건너뜀 (이미 있음)  %s" % (p["seq"], p.get("token") or "-", name))
            was = (prior_manifest.get(p["seq"]) or {}).get("downloaded_at") or mtime_iso(prior)
            records.append(
                dict(p, file=name, bytes=size, sha256=digest, format=os.path.splitext(name)[1].lstrip("."),
                     downloaded_at=was, skipped=True)
            )
            continue

        if args.dry_run:
            try:
                hdrs, status = head(url)
            except Exception as e:  # noqa: BLE001
                warnings.append("%02d  HEAD 실패: %s  (%s)" % (p["seq"], e, url))
                print("  %02d  %-4s  ✗ HEAD 실패: %s" % (p["seq"], p.get("token") or "-", e))
                continue
            size = int(hdrs.get("Content-Length") or 0)
            ctype = (hdrs.get("Content-Type") or "?").split(";")[0]
            ext = {"image/jpeg": "jpg", "image/png": "png", "image/heic": "heic",
                   "image/webp": "webp", "image/gif": "gif"}.get(ctype, "bin")
            expiry = ""
            m = re.search(r'expiry-date="([^"]+)"', hdrs.get("x-amz-expiration", "") or "")
            if m:
                expiry = "  만료 %s" % m.group(1)[:16]
            total_bytes += size
            print("  %02d  %-4s  %-42s %7.1fMB  %s%s"
                  % (p["seq"], p.get("token") or "-", target_filename(p, ext), size / 1e6, ctype, expiry))
            records.append(dict(p, file=target_filename(p, ext), bytes=size, format=ext))
            continue

        try:
            blob, hdrs = download(url)
        except Exception as e:  # noqa: BLE001
            warnings.append("%02d  다운로드 실패: %s  (%s)" % (p["seq"], e, url))
            print("  %02d  %-4s  ✗ 실패: %s" % (p["seq"], p.get("token") or "-", e))
            # 못 받았어도 매니페스트에 남긴다 — "이 URL 에 사진이 있었고 받기 전에 사라졌다"는
            # 사실 자체가 기록 가치가 있고, 안 남기면 이 주문이 영원히 "미아카이브" 로 뜬다.
            records.append(dict(p, file=None, bytes=0, sha256=None, format=None,
                                downloaded_at=None, skipped=False,
                                unavailable=True, error=str(e)))
            continue

        fmt = sniff_format(blob[:32])
        url_ext = os.path.splitext(urllib.parse.urlsplit(url).path)[1].lstrip(".").lower()
        if fmt is None:
            fmt = url_ext or "bin"
            warnings.append("%02d  포맷 판정 실패 — URL 확장자 사용(%s)" % (p["seq"], fmt))
        elif fmt == "heic":
            warnings.append("%02d  HEIC 파일 — 포토샵에서 열리는지 확인할 것" % p["seq"])
        elif url_ext in ("jpeg", "jpg") and fmt != "jpg":
            warnings.append("%02d  확장자(%s) != 실제(%s) — 실제 포맷으로 저장" % (p["seq"], url_ext, fmt))

        name = target_filename(p, fmt)
        dest = os.path.join(original_dir, name)
        if prior and os.path.basename(prior) != name:
            os.remove(prior)
        with open(dest, "wb") as f:
            f.write(blob)
        digest = hashlib.sha256(blob).hexdigest()
        total_bytes += len(blob)
        print("  %02d  %-4s  %-42s %7.1fMB  %s" % (p["seq"], p.get("token") or "-", name, len(blob) / 1e6, fmt))
        records.append(
            dict(p, file=name, bytes=len(blob), sha256=digest, format=fmt,
                 downloaded_at=utcnow(), skipped=False)
        )

    print("")
    print("합계 %d 장 / %.1f MB" % (len(records), total_bytes / 1e6))

    if warnings:
        print("")
        for w in warnings:
            print("  ⚠ %s" % w)

    if args.dry_run:
        print("")
        print("(dry-run — 아무것도 쓰지 않았다)")
        return True

    manifest = {
        "generated_at": utcnow(),
        "generator": "scripts/order_intake/intake.py",
        "source": "shopify-admin-graphql",
        "order": {
            "name": order_name,
            "id": order.get("id"),
            "created_at": order.get("createdAt"),
            "customer": customer,
            "email": order.get("email"),
        },
        "line_items": [
            {"index": i, "title": li.get("title"), "sku": li.get("sku"),
             "quantity": li.get("quantity")}
            for i, li in enumerate(line_item_nodes(order))
        ],
        "options": options,
        "photos": records,
        "warnings": warnings,
    }
    # 제작 잡티켓 — SKU 해석을 여기서 한 번만 한다. 읽는 쪽(일러스트·포토샵)은 그대로 쓴다.
    manifest["job"] = build_job(manifest)
    # 배송지 — 개인정보. `_order.json` 은 .gitignore 에 명시돼 있다.
    manifest["shipping"] = shipping_block(order)

    manifest_path = os.path.join(project_dir, "_order.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("")
    print("제작      : %s" % job_label(manifest["job"]))
    ship = manifest["shipping"]
    if ship:
        # 받는 사람이 주문자와 다르면 **선물이다.** 포장·동봉물이 달라지므로 눈에 띄게 알린다.
        gift = " ⚠ 주문자와 다름 (선물)" if (ship.get("name") or "") != customer else ""
        print("받는 사람 : %s%s" % (ship.get("name") or "?", gift))
        print("배송지    : %s" % address_oneline(ship))
    print("매니페스트: %s" % manifest_path)
    return True


# ---------------------------------------------------------------- 메인


def main():
    ap = argparse.ArgumentParser(
        description="Shopify 주문 사진 인테이크",
        epilog="인증: Dev Dashboard 앱의 Client ID/Secret 을 키체인 '%s' / '%s' 에. "
               "필요 스코프: %s" % (KEYCHAIN_CLIENT_ID, KEYCHAIN_CLIENT_SECRET, REQUIRED_SCOPES),
    )
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--order", metavar="NAME", help="주문번호로 Admin API 에서 가져온다 (예: EVS-1008)")
    src.add_argument("--order-json", metavar="PATH", help="주문 JSON 파일에서 읽는다 (토큰 불필요)")
    src.add_argument("--list", nargs="?", type=int, const=20, metavar="N",
                     help="최근 N건(기본 20)의 아카이브 여부만 표시. 다운로드 안 함")
    src.add_argument("--all-new", action="store_true",
                     help="매니페스트가 없는 주문을 전부 인테이크")
    src.add_argument("--check", action="store_true",
                     help="토큰·도메인·API 버전이 통하는지만 확인. 주문 조회 안 함")
    src.add_argument("--backfill-job", action="store_true",
                     help="기존 _order.json 에 job 블록을 채운다 (토큰·네트워크 불필요)")

    ap.add_argument(
        "--projects-dir",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "projects"),
        help="projects/ 경로",
    )
    ap.add_argument("--folder", help="프로젝트 폴더명 직접 지정 (단건에서만. 기본: '{고객명} {주문번호}')")
    ap.add_argument("--dry-run", action="store_true", help="다운로드 없이 계획만 출력 (HEAD 만 호출)")
    ap.add_argument("--force", action="store_true", help="이미 받은 파일도 다시 받는다")
    ap.add_argument("--shop", default=os.environ.get("SHOPIFY_SHOP", DEFAULT_SHOP),
                    help="myshopify 도메인 (기본 %s)" % DEFAULT_SHOP)
    ap.add_argument("--api-version", default=os.environ.get("SHOPIFY_API_VERSION", DEFAULT_API_VERSION),
                    help="Admin API 버전 (기본 %s)" % DEFAULT_API_VERSION)
    ap.add_argument("--scan", type=int, default=50, metavar="N",
                    help="--all-new 이 훑을 최근 주문 수 (기본 50)")
    args = ap.parse_args()

    if args.folder and args.all_new:
        raise SystemExit("--folder 는 단건에서만 쓴다 (--all-new 와 같이 못 씀).")

    if args.check:
        run_check(args)
        return

    projects_dir = os.path.abspath(args.projects_dir)

    # --- 기존 매니페스트에 job 채우기 (오프라인) ---
    if args.backfill_job:
        backfill_jobs(projects_dir)
        return

    # --- 목록만 보기 ---
    if args.list is not None:
        orders = fetch_orders(args, None, args.list)
        done = archived_orders(projects_dir)
        print("")
        print("%-10s %-18s %-17s %4s  %-13s %-20s %s"
              % ("주문", "고객", "날짜", "사진", "아카이브", "진행", "폴더"))
        missing = 0
        lost_total = 0
        for o in orders:
            photos, _, _ = parse_photos(o)
            nm = o.get("name") or "?"
            rec = done.get(nm)
            if rec is None:
                mark = "❌ 미아카이브"
                missing += 1
            elif rec["lost"]:
                # CDN 만료로 사라진 사진. 재시도해도 못 받는다 — 미아카이브와 구분해야
                # 진짜 놓친 주문이 잡음에 묻히지 않는다.
                lost_total += rec["lost"]
                mark = "⚠ %d장 유실" % rec["lost"]
            else:
                mark = "✅ 받음"
            # 진행은 매니페스트가 아니라 폴더에서 읽는다 — 인테이크 이후 단계(누끼·시트)는
            # 이 스크립트가 만드는 것이 아니라서 매니페스트에 기록이 없다.
            prog = progress_label(project_progress(rec["folder"])) if rec else "—"
            print("%-10s %-18s %-17s %4d  %-13s %-20s %s"
                  % (nm, customer_label(o), (o.get("createdAt") or "")[:16], len(photos),
                     mark, prog, os.path.basename(rec["folder"]) if rec else ""))
        print("")
        print("최근 %d건 중 미아카이브 %d건%s"
              % (len(orders), missing, "  ->  --all-new 로 한 번에 처리" if missing else ""))
        if lost_total:
            print("유실 %d장 — CDN 만료. 재시도 불가, 매니페스트에 기록만 남아 있다." % lost_total)
        print("(60일보다 오래된 주문은 %s 스코프가 있어야 보인다 — --check 로 확인)" % SCOPE_ALL_ORDERS)
        return

    # --- 단건: API ---
    if args.order:
        want = args.order.lstrip("#")
        orders = fetch_orders(args, "name:%s" % want, 10)
        exact = [o for o in orders if (o.get("name") or "").lstrip("#") == want]
        if not exact:
            found = ", ".join(o.get("name") or "?" for o in orders) or "없음"
            raise SystemExit("주문 '%s' 를 못 찾았다. 검색 결과: %s" % (args.order, found))
        print("")
        return None if process_order(exact[0], args, projects_dir) else 1

    # --- 미아카이브 일괄 ---
    if args.all_new:
        orders = fetch_orders(args, None, args.scan)
        done = archived_orders(projects_dir)
        todo = [o for o in orders if (o.get("name") or "") not in done]
        print("")
        print("최근 %d건 중 미아카이브 %d건" % (len(orders), len(todo)))
        print("(60일보다 오래된 주문은 %s 스코프가 있어야 보인다 — --check 로 확인)" % SCOPE_ALL_ORDERS)
        if not todo:
            return
        ok = 0
        for o in todo:
            print("")
            print("════════ %s ════════" % (o.get("name") or "?"))
            if process_order(o, args, projects_dir):
                ok += 1
        print("")
        print("완료 %d/%d 건" % (ok, len(todo)))
        return None if ok == len(todo) else 1

    # --- 단건: JSON 파일 ---
    return None if process_order(load_order(args.order_json), args, projects_dir) else 1


if __name__ == "__main__":
    sys.exit(main())
