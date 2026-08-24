// Everstory — Mixed-size photo sheet (Name Included header + 디자인 cap + multiselect)
//
// 목적:
//   Name Included 시트 위에 사진 스티커를 단일 사이즈 (XS/S/M/L/XL/XXL) ·
//   Package (파일명 _TIER 토큰) · 전 사이즈 모드로 배치한다. 다이얼로그 ListBox 에서 사용할 페어를
//   직접 multiselect 하고, 사이즈별 디자인 cap 에 자동으로 맞춘다 (auto-cap).
//
// 디자인 cap (단일 사이즈 = 시트 물리 슬롯 수, 디자인당 반복 cap 없음):
//   XS 0.75" → 48 / S 1" → 30 / M 1.25" → 20 / L 1.5" → 12 / XL 2" → 6 / XXL 2.5" → 4
//
// 동작:
//   1. 02_cutout 폴더 선택
//   2. 다이얼로그: 고객 이름 / 헤더 정보 / 페어 ListBox (multiselect) /
//      사이즈 dropdown (인치 6단계 + Package + 전 사이즈) / 칼선 여백
//      - 사이즈 변경 시 cap 갱신 + 선택 자동 trim (auto-cap)
//   3. templates/template_cutout_v2.ait 열기 (info > body PathItem, info > header > header_right TextFrame 사용)
//   4. info > header > header_right 영역에 우측 정렬 3줄 (이름/사이즈/재질, 디자인수, Order/date) 배치
//   5. info > body 영역에 선택한 페어를 packing
//      - 단일 사이즈: aspect 밴드 격자 (v22) — 비율 혼합 입력은 방향/비율 밴드로 분리해
//        밴드별 cellBox (max cellW × max cellH) 격자로 여백 최소화. 비율 균일 (밴드 1개) 이면
//        기존 uniform grid 그대로. 모든 행이 같은 디자인 round-robin 순서, 외곽 = 내부 gap 균등
//   6. 캐시: 같은 sil.png 는 시트당 1회만 Image Trace, 같은 _clean.psd 는 1회만 embed (TraceStash master 복제)
//   7. 03_output 폴더에 .ai 자동 저장 (timestamp_size_sheet01.ai)
//
// 사용법: File → Scripts → Other Script → Everstory_mixed.jsx

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "v23 multi-sheet";
  var SCRIPT_TITLE = "Everstory Mixed Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  // body 안쪽 상하좌우 최소 여백. Package/전 사이즈 packer 가 빡빡하게 차서
  // 시트 끝 0mm 으로는 운영자가 손으로 벌리는 일이 많아 2mm 로 강제.
  var BODY_PADDING_MM = 2;
  // 셀 박스 사이 최소 간격. main flow 가 모든 모드(단일/Package/전 사이즈) 의 packer 에 동일 gap 전달.
  // cutMargin(기본 0mm) 이 셀 안에서 사진을 인셋 → silhouette 간격 = 셀 gap + 2×cutMargin. 기본 0mm 면 셀 gap(floor 2.5mm)만.
  // 단일 사이즈는 _uniformGridPack 의 cols/rows 결정 floor 에만 영향 (시각 간격은 자동 균등 분배).
  // Package 는 _packPackage 의 _canAddToShelfRow 검사에 사용.
  var GAP_DEFAULT_MM = 2.5;
  // 단일 사이즈 aspect 밴드 병합 허용비 — 같은 방향 (세로/가로) 에서 가변 변 (세로=cellW,
  // 가로=cellH) 비율이 이 값 이상이면 같은 밴드. 1.0 에 가까울수록 밴드가 잘게 쪼개져
  // 셀 여백은 줄고 밴드 경계 자투리 (부분 반복 행) 는 늘어난다.
  var BAND_CELL_TOL = 0.85;

  // body 142×175mm (template_cutout_v2.ait info > body), BODY_PADDING_MM 2, GAP_DEFAULT_MM 2.5 기준
  // 사이즈별 슬롯 수 — _uniformGridPack 의 cols×rows floor 식을 정사각(aspect 1) 셀로 산출 (2026-06-12 갱신).
  // 정사각이 최소 슬롯 케이스 (비정사각 cellBox 는 항상 size×size 이하 → 슬롯 ≥ 표값) → cap ≤ 실제 슬롯 보장.
  // cap > 실제 슬롯이면 초과 디자인이 round-robin 에서 한 번도 안 놓이는 silent drop 발생 (구 148×195
  // baseline 표의 문제) — body/padding/gap 변경 시 이 표를 같은 식으로 반드시 재산출할 것.
  // 인치 6단계 (XS 0.75 / S 1 / M 1.25 / L 1.5 / XL 2 / XXL 2.5") 기준.
  // aspect 밴드 격자 (v22) 에서도 floor 성질 유지 — 밴드 경로는 전 디자인 ≥1 배치를 자체
  // 보장하고, 보장 불가 시 uniform grid fallback 이라 cap ≤ 실제 슬롯 불변식이 안 깨진다.
  var SLOTS_BY_SIZE = {
    19.05: 48,   // 0.75"  (6×8)
    25.4:  30,   // 1"     (5×6)
    31.75: 20,   // 1.25"  (4×5)
    38.1:  12,   // 1.5"   (3×4)
    50.8:  6,    // 2"     (2×3)
    63.5:  4     // 2.5"   (2×2)
  };

  var PACKAGE_SIZE_VALUE = -2;   // sentinel for Package mode (파일명 토큰 기반 packing)
  // Package 디자인 cap = 이 값 × 시트 수. 넘치는 분을 버리지 않고 다음 시트로 넘기므로
  // 구 고정값 8(=Full 상품이 약속한 selected 장수)은 다중 시트에서 입력을 막는 족쇄였다.
  // 상품 약속(8장)은 하한이지 상한이 아니다 — 실제로는 16장이 시트를 가장 꽉 채운다
  // (2026-08-22 시뮬: 10개 57.4% / 12개 61.6% / 16개 72.5%).
  var PACKAGE_MAX_DESIGNS_PER_SHEET = 10;

  // ── 전 사이즈 (All Sizes) 모드 ─────────────────────────────────────
  // 들어온 디자인(들)을 0.75"~2.5" 전 사이즈로 출력. 디자인을 고정하지 않는다:
  //   · 디자인 1개   → 그 1개로 전 사이즈
  //   · 디자인 여러개 → 사이즈마다 디자인을 순서대로(round-robin) 배정해 계속 채움
  // ALLSIZES_ORDER_MM 의 모든 사이즈가 최소 1장씩 무조건 들어간다(요구사항).
  // 남는 공간은 (ALLSIZES_FILL_MM 사이즈 × 디자인) round-robin 으로 채움.
  var ALLSIZES_SIZE_VALUE = -3;  // sentinel for 전 사이즈 mode in SIZE_VALUES
  var ALLSIZES_ORDER_MM = [63.5, 50.8, 38.1, 31.75, 25.4, 19.05];  // 2.5 → 0.75" (큰→작은, 각 1장 보장)
  var ALLSIZES_FILL = true;      // 보장 라운드 후 남는 공간을 작은 사이즈로 채울지
  var ALLSIZES_FILL_MM = [38.1, 31.75, 25.4, 19.05];  // 채움용(1.5/1.25/1/0.75"). 2.5/2" 는 채움 제외
  // hero 행 정책: 보장 라운드 단일 배치는 hero 사이즈(2.5"/2")만. 1.5" 이하 단일은 hero 옆에
  //   두지 않고 아래 tier 행(round-robin)이 담당, hero 행 남는 폭은 작은 사이즈 세로 column
  //   (0.75" 3단 등)으로 채운다. 사이즈별 ≥1장 보장은 _packAllSizes 말미의 검증·구제가 담당.
  var ALLSIZES_HERO_COUNT = 2;

  // 단일 사이즈 cap = 시트 물리 슬롯 수 (SLOTS_BY_SIZE 그대로 재사용).
  // 디자인당 반복 횟수 cap 없음 — 한 시트가 담을 수 있는 최대 디자인 수까지 자유 선택.
  // 각 디자인 최소 1회 보장, 슬롯 초과 silent drop 없음.
  // (SLOTS_BY_SIZE 와 단일 출처 — slots 가 바뀌면 cap 도 자동 추종.)
  var DESIGN_LIMIT_BY_SIZE_MM = SLOTS_BY_SIZE;

  // 인치 6단계 + Package/전 사이즈 sentinel. 라벨은 products.md size option 표기 (letter code 없이 inch / 반올림 mm).
  // Shopify 'Mixed' 옵션 주문은 전 사이즈 모드로 제작한다.
  var SIZE_OPTIONS = [
    "0.75\" / 19mm",
    "1\" / 25mm",
    "1.25\" / 32mm",
    "1.5\" / 38mm",
    "2\" / 51mm",
    "2.5\" / 64mm",
    "Package (파일명 _BIG/_MED/_SML · 인치 자동 배정 · 다중 시트)",
    "All sizes 0.75-2.5in (모든 사이즈 1장 이상)"
  ];
  var SIZE_VALUES = [19.05, 25.4, 31.75, 38.1, 50.8, 63.5, PACKAGE_SIZE_VALUE, ALLSIZES_SIZE_VALUE];
  var SIZE_LETTERS = ["XS", "S", "M", "L", "XL", "XXL", "PKG", "ALL"];
  // products.md size option 의 반올림 mm — 표기를 SOT 에 고정 (Math.round fallback 있음).
  var SIZE_MM_LABEL = { 19.05: 19, 25.4: 25, 31.75: 32, 38.1: 38, 50.8: 51, 63.5: 64 };
  var SIZE_DEFAULT_INDEX = 1;  // S = 1" — 다이어리 표준 사이즈
  var CUT_MARGIN_OPTIONS = ["0mm", "0.5mm", "1mm", "2mm"];
  var CUT_MARGIN_VALUES = [0, 0.5, 1, 2];
  var CUT_MARGIN_DEFAULT_INDEX = 0; // 기본 0mm (사용자 지정) — 0.5/1/2mm 는 운영자가 의도적으로 선택
  var MATERIAL_OPTIONS = ["White Matte", "Translucent", "Silver", "Gold"];

  // ── 주문 매니페스트 (_order.json) 프리필 ───────────────────────────
  // 인테이크(scripts/order_intake)가 프로젝트 폴더에 남긴 매니페스트에서 고객 이름·주문번호·
  // 재질·사이즈를 읽어 다이얼로그를 채운다. 이 값들은 전부 주문 데이터에 이미 있는데도
  // 운영자가 일러스트에서 손으로 다시 입력했고, 대조할 곳이 없어 재질이 틀려도 인쇄 전에
  // 걸리지 않았다 (재제작 = 원가 100% 손실).
  // **추측하지 않는다** — 매니페스트가 없거나 line item 끼리 값이 엇갈리면 그 칸은 기본값으로
  // 두고 다이얼로그 상단에 이유를 적는다 (intake.py 의 "조용히 추측하지 않는다" 와 같은 규약).
  var ORDER_MANIFEST_NAME = "_order.json";
  // SKU = EVS-{PRODUCT}-{SIZE}-{MATERIAL}. 끝 두 글자가 재질 코드다
  // (문서에 코드표가 없어 라이브 스토어 variant 로 확인 — 2026-08-24).
  var SKU_MATERIAL_RE = /-([A-Z]{2})$/i;
  var SKU_MATERIAL = { WM: "White Matte", TR: "Translucent", SV: "Silver", GD: "Gold" };
  // 사이즈 코드 → SIZE_VALUES 의 mm. MIX 는 전 사이즈 모드로 제작한다 (CLAUDE.md).
  var SKU_SIZE_RE = /-(\d{2}|MIX)-[A-Z]{2}$/i;
  var SKU_SIZE_MM = { "19": 19.05, "25": 25.4, "32": 31.75, "38": 38.1, "51": 50.8, "64": 63.5 };
  // Package SKU 는 사이즈 코드 자리에 FULL/MINI 가 온다 (EVS-PACKAGE-FULL-WM) — 그게 곧 시트 수다.
  var SKU_PACKAGE_RE = /-PACKAGE-(FULL|MINI)-[A-Z]{2}$/i;
  var PACKAGE_SHEETS_BY_KIND = { FULL: 2, MINI: 1 };
  // SKU 가 없는 초기 주문(#1001~#1004)은 사이즈가 옵션 라벨에 있다: "Photos to include (19mm)".
  var OPTION_MM_RE = /\((\d{2})\s*mm\)/;
  // 폴더명 `{고객} {주문번호}` 끝의 주문번호 — 매니페스트가 없는 폴더용 폴백.
  var FOLDER_ORDER_RE = /\s+#?([A-Z]{2,5}-\d+|\d{3,})$/;

  // ── Package 모드 (no_cap 변형, 파일명 토큰 입력) ───────────────────
  // 고객이 사진마다 사이즈를 임의 지정. Phase A 파일명 = {folder}_{NN}_{TIER}:
  // 끝에 _XS/_S/_M/_L/_XL/_XXL (대소문자 무시). 토큰 없으면 S(=1") 기본.
  // 과거 2.5" 토큰 _FAM 은 읽을 때 XXL 로 정규화한다.
  // 접미사(_sil/_clean) strip 후 끝에 anchored — 레거시 _{NN}(숫자) 는 tier 글자와 안 겹침.
  var TIER_SIZE_MM = { XS: 19.05, S: 25.4, M: 31.75, L: 38.1, XL: 50.8, XXL: 63.5 };
  var TIER_DEFAULT = "S";
  // _sil.png/_clean.psd 접미사 제거 후 이름 끝의 _TIER 토큰. 긴 토큰을 먼저 둬 부분매칭 방지.
  var TIER_TOKEN_RE = /_(XXL|XL|XS|FAM|S|M|L)$/i;
  // ── Package 디자인당 출력 장수 (min/max, hard max) ─────────────────
  // 디자인×tier 당 시트 출력 장수 범위 (내부 제작 옵션). min 은 강제 pass(B0) + min 구제
  // column 으로 보장 시도 — 공간 부족 시 완료 메시지에 min 미달 경고. max 는 hard cap:
  // 행 pass·column·고아 행 채움 모두 준수, 남는 공간은 justify 가 간격으로 흡수.
  // L/M/S min 2 — 쓰임새가 가장 많은 사이즈라 우선 확보 (2026-08-19 사용자 결정).
  // XXL 1/1 은 기존 "XXL 반복 0, 각 1장 고정" 규칙의 표현 (tier 반복 기계에서 계속 제외).
  var PKG_COUNT_BY_TIER = {
    XXL: { min: 1, max: 1 },
    XL:  { min: 1, max: 2 },
    L:   { min: 2, max: 3 },
    M:   { min: 2, max: 4 },
    S:   { min: 2, max: 6 },
    XS:  { min: 1, max: 8 }
  };

  // ── Package 3버킷 입력 + 다중 시트 (2026-08-22) ────────────────────
  // 고객은 Big / Medium / Small print 구역에만 업로드한다 (product_descriptions.md SKU 4·5).
  // 상품 카피가 약속하는 것은 그 3버킷뿐 — 정확한 인치는 약속에 없으므로 스튜디오 재량이다.
  // 그래서 파일명은 버킷만 담고, 인치는 배분층이 시트 구성을 보고 배정한다. 운영자가 배치를
  // 보기 전에 인치를 확정해야 했던 것이 "매번 배치가 고민"의 원인이었다.
  // 레거시 6티어 토큰(_XS.._XXL/_FAM)도 계속 읽는다 — 기존 projects 폴더 호환.
  var BUCKET_TOKEN_RE = /_(BIG|MED|SML)$/i;
  var BUCKETS = ["BIG", "MED", "SML"];
  // 버킷별 인치 후보. 레거시 tier→버킷 역매핑과 표시용 기본값의 출처이기도 하다.
  var BUCKET_TIERS = { BIG: ["XXL", "XL"], MED: ["L", "M"], SML: ["S", "XS"] };
  var TIER_TO_BUCKET = { XXL: "BIG", XL: "BIG", L: "MED", M: "MED", S: "SML", XS: "SML" };

  // 인치 사다리 후보. 시트 안에서 버킷별로 순서대로 순환 배정한다 (MED ["L","M","M"] 이면 L,M,M,L,M,M…).
  // 어느 사다리가 이길지는 입력 구성에 따라 바뀌므로 (16디자인=B 승, BIG 많은 입력=A 승) 규칙으로
  // 고정하지 않고 _planPackageSheets 가 전부 패킹해본 뒤 고른다. 순수 배열 연산이라 비용은
  // 후보 4개 × 2시트에 0.7ms, Illustrator API 호출 0 (2026-08-22 node 시뮬 실측).
  var PACKAGE_LADDERS = [
    { key: "A", BIG: ["XXL", "XL"], MED: ["L", "M"],      SML: ["S", "XS"] },
    { key: "B", BIG: ["XXL", "XL"], MED: ["L", "M", "M"], SML: ["XS", "S", "XS"] },
    { key: "C", BIG: ["XXL", "XL"], MED: ["L", "M", "M"], SML: ["S", "XS", "XS"] },
    { key: "D", BIG: ["XXL", "XL"], MED: ["L", "M"],      SML: ["S", "XS", "XS"] }
  ];
  // Package 시트 수 — Mini 1장 / Full 2장 (product_descriptions.md). 시뮬 전 구간에서 2시트가
  // 3시트를 이겼다 (평균 충전 -9~14%p, 최저 시트 25~48%) → 기본 2, 3은 운영자가 의도적으로만.
  var PACKAGE_SHEET_OPTIONS = ["1장 (Mini)", "2장 (Full)", "3장"];
  var PACKAGE_SHEET_VALUES = [1, 2, 3];
  var PACKAGE_SHEET_DEFAULT_INDEX = 1;

  // 고아 행 채움 게이트 (2026-08-22) — 폭 사용률이 이 값 미만인 tier 밴드 행은 자기 tier
  // 디자인 반복으로 가로 채움. 구 게이트는 tierNoRows(Phase A 배치 실패가 있었던 tier)에만
  // 걸려서, 정상 배치된 tier 안에 방향이 다른 디자인 1개가 자기 행을 열면 (예: 세로형 5개
  // 사이의 가로형 1개 — 높이 유사성 게이트가 다른 디자인의 합류를 막는다) 그 행이 1컷
  // 106mm 공백으로 남았다 (누리 실시트로 확인). 균일성은 아래 ±1 균형 가드가 지킨다.
  var ORPHAN_FILL_MIN_WIDTH = 0.95;

  // 팔레트 = Butter Pop 고정. alphabet 의 기본값은 Tonal 이지만 레퍼런스가 Pop 이다.
  // 크림·아이보리를 **배경**에 쓰지 말 것 — 흰 종이에서 스티커 형태가 사라진다.
  var LETTER_PALETTE = [
    { bg: "FFD84D", ink: "FF5B8A" },   // 버터 / 핫핑크
    { bg: "FF7A3C", ink: "FFF4E0" },   // 탠저린 / 크림
    { bg: "6EC5E9", ink: "24304A" },   // 스카이 / 네이비
    { bg: "BEDB39", ink: "2F6B3C" },   // 애시드라임 / 딥그린
    { bg: "FF5B8A", ink: "FFF4E0" },   // 핫핑크 / 크림
    { bg: "B39DDB", ink: "FFF4E0" },   // 라일락 / 크림
    { bg: "5FD3B2", ink: "134E3F" },   // 민트 / 딥틸
    { bg: "24304A", ink: "FFD84D" },   // 네이비 / 버터
    { bg: "6EC5E9", ink: "FF5B8A" }    // 스카이 / 핫핑크
  ];
  var LETTER_FONT_CANDS = ["BagelFatOne-Regular", "BagelFatOne",
                           "Shrikhand-Regular", "BakbakOne-Regular", "Chewy-Regular"];
  // 카운터(글자 속구멍) 위험선. 이 밑이면 인쇄에서 잉크가 번져 메워진다.
  var LETTER_MIN_COUNTER_MM = 0.35;
  var NAME_BIG_H_MM = 9.5;      // 큰 이름 높이 (흰 테두리 포함). 사용자 지정 2026-08-23
  var NAME_SMALL_H_MM = 7;      // 작은 이름 높이 — 0.75" 스티커와 비슷한 존재감
  // 캘리 통짜 개수 (첫 개가 NAME_BIG_H_MM, 나머지는 NAME_SMALL_H_MM).
  // 알파벳 블록 1개는 이와 별도로 항상 만들어진다.
  // ⚠ 2026-08-23 실험: **0 = 캘리(with_name) 엔진 끔** — 알파벳 프레임만 나온다.
  //   두 엔진 합치기가 실동작에서 안 맞아 한쪽을 떼고 보는 중. 되돌리려면 3.
  //   엔진 코드(_buildCalliSticker/_makeInkOutline/_measurePhrase/…)는 그대로 남아 있다.
  var NAME_CALLI_COUNT = 0;
  // 흰 테두리 = 높이 × 이 비율. 9.5mm→1.05mm, 7mm→0.77mm. 알파벳 프레임에서
  // 1mm 오프셋으로 실컷 검증된 수준을 유지한다 (그보다 얇으면 낱글자가 뜯긴다).
  // **0 = 여백 없음** (사용자 지정 2026-08-23). 알파벳 프레임과 같은 규약 —
  // 칼선은 글자 윤곽(union)을 그대로 따르고, 오프셋은 나중에 사용자가 직접 준다.
  // 0 이 아니면 그만큼 흰 테두리가 **인쇄되고** 칼선이 그 가장자리로 간다.
  var NAME_HALO_RATIO = 0;
  // bounce 0 = 직선 baseline. "진짜 폰트를 쓴 이름" 이 목표라 글자 튀기기는 끈다.
  var NAME_BOUNCE_SCALE = 0;
  // Bagel Fat One 은 한글 음절(U+AC00~)을 가진 유일한 후보라 첫 번째다.
  var NAME_FONT_CANDS = ["BagelFatOne-Regular", "BagelFatOne", "Fredoka-Bold", "Chewy-Regular"];
  // 글자색 순환 — [0] 이 큰 것. Butter Pop 계열.
  var NAME_INK_HEXES = ["231F1D", "FF5B8A", "6EC5E9", "BEDB39"];

  // ══ 알파벳 프레임 엔진 (Everstory_alphabet.jsx 이식) ═══════════════════
  // 글자 1개 = 도형 프레임 스티커. **캘리 통짜와 함께 쓴다** — 알파벳 블록은
  // 히어로 사진 옆에 하나, 캘리 통짜는 남은 빈 공간을 채운다 (사용자 지정 2026-08-23).
  // 상수는 메인 플로우 위 (var 초기화는 호이스팅 안 됨).

  var KAPPA = 0.5522847498;
  var POLAR_SAMPLES = 72;
  var TILT_MAX_DEG = 6;
  var FRAME_DEFS = [
    { key: "CIR", label: "원",         build: _frameCircle,  safe: 0.63, cyOff: 0.00 },
    { key: "RSQ", label: "둥근사각",   build: _frameRSquare, safe: 0.76, cyOff: 0.00 },
    { key: "SCA", label: "꽃 · 스캘럽", build: _frameScallop, safe: 0.63, cyOff: 0.00 },
    { key: "WAV", label: "물결사각",   build: _frameWave,    safe: 0.66, cyOff: 0.00 },
    { key: "BLB", label: "네잎 블롭",  build: _frameBlob,    safe: 0.66, cyOff: 0.00 },
    { key: "ARC", label: "아치",       build: _frameArch,    safe: 0.62, cyOff: -0.03 },
    { key: "TKT", label: "티켓",       build: _frameTicket,  safe: 0.68, cyOff: 0.00 },
    { key: "STR", label: "별",         build: _frameStar,    safe: 0.40, cyOff: 0.00 },
    { key: "HRT", label: "하트",       build: _frameHeart,   safe: 0.40, cyOff: 0.06 }
  ];
  var LETTER_MEASURE_CACHE = {};
  var LETTER_UNIT_MM = 9.5;
  // 칸 사이 간격 = 유닛 × 이 비율. **절대 mm 가 아니라 비율인 이유**: 긴 이름은 폭에
  // 맞춰 유닛을 낮추는데(LETTER_UNIT_STEPS_MM), 간격이 고정 mm 면 작은 유닛에서
  // 상대적으로 벌어져 한 단어가 흩어져 보인다.
  // 0.35 = 9.5mm 에서 3.3mm (사용자 지정 2026-08-23). 레퍼런스 실측 2.3mm(24%)는
  // 너무 좁다는 판단 — 되돌리지 말 것.
  var LETTER_GAP_RATIO = 0.35;
  // 유닛 후보 (큰 것부터). 한 줄이 히어로 옆 폭 예산에 안 들어가면 한 단계씩 낮춘다.
  // 7mm 아래로는 내리지 않는다 — 그 밑은 전폭 새 행이 낫다.
  var LETTER_UNIT_STEPS_MM = [9.5, 8.5, 7.5, 7.0];
  // 전폭 새 행에서도 안 들어가는 아주 긴 단어의 마지막 수단. 이 밑으로는 안 줄이고
  // 배치를 포기해 완료 메시지로 보고한다 (글자가 안 읽히고 카운터가 위험선 밑으로 간다).
  var LETTER_UNIT_MIN_MM = 5;
  // **마지막 수단** 유닛 단계. 정상 단계(LETTER_UNIT_STEPS_MM)로는 어느 행에도 못 들어갈 때만
  // 쓴다 — 예: 0.75" 시트(19mm 행)에 3줄짜리 이름("Anne Marie Kim" = 9.5mm 유닛에서 35mm).
  // 여기까지 오면 글자가 작지만, 대안은 "이름 없음" 이거나 사진 14장을 버리는 것이다.
  // 완료 메시지가 축소 사실을 찍으므로 조용히 작아지지는 않는다.
  var LETTER_UNIT_TIGHT_STEPS_MM = [6.5, 6, 5.5, 5];
  var LETTER_KEY_RATIO = 0.0174;
  var KEY_HEX = "231F1D";

  // 글자별 기울기. **결정론적**이어야 한다 — Math.random 을 쓰면 같은 입력이
  // 매번 다르게 나와 재현이 안 되고, 실측 단계와도 어긋난다
  // ([[project_calligraphy_sheet]] 의 bouncy 와 같은 이유).
  // 서로 다른 무리수 배수를 써서 규칙적으로 반복되지 않게 한다.
  function _tiltFor(i, enabled) {
    if (!enabled) return 0;
    return TILT_MAX_DEG * Math.sin(i * 2.399 + 1.13);
  }

  // 글자 키라인은 **스트로크**다 (오프셋 도형이 아니라).
  // 오프셋 도형으로 주려면 compound 를 풀어 union 해야 하는데, 그러면
  // A·O·P 의 속구멍이 메워져 글자가 뭉개진다.
  // 스트로크는 속구멍 윤곽도 같이 따라가므로 레퍼런스와 같은 모양이 나온다.
  // Illustrator 는 fill 위에 stroke 를 그리므로 절반은 글자 안쪽을 먹는다 —
  // 그게 키라인의 생김새다.
  function _setLetterStyle(item, fillColor, keyColor, keyPt) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
          _setLetterStyle(item.pageItems[i], fillColor, keyColor, keyPt);
        }
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
          _setLetterStyle(item.pathItems[j], fillColor, keyColor, keyPt);
        }
        return;
      }
      if (item.typename === "PathItem") {
        item.filled = true;
        item.fillColor = fillColor;
        if (keyPt > 0) {
          item.stroked = true;
          item.strokeColor = keyColor;
          item.strokeWidth = keyPt;
          try { item.strokeJoin = StrokeJoin.ROUNDENDJOIN; } catch (eJ) {}
        } else {
          item.stroked = false;
        }
      }
    } catch (e) {}
  }

  // 텍스트 → 아웃라인. createOutline 은 원본 TextFrame 을 소모한다.
  function _makeLetterOutline(printL, ch, font, fontSizePt, fillColor, keyColor, keyPt) {
    var tf = printL.textFrames.pointText([0, 0]);
    tf.contents = ch;
    var tr = tf.textRange;
    tr.characterAttributes.textFont = font;
    tr.characterAttributes.size = fontSizePt;
    tr.characterAttributes.fillColor = fillColor;
    var outline = tf.createOutline();
    _setLetterStyle(outline, fillColor, keyColor, keyPt);
    return outline;
  }

  // 기준 사이즈로 실측 후 캐시. TextFrame.geometricBounds 는 글리프가 아니라
  // 폰트 메트릭 박스라 반드시 아웃라인으로 변환한 뒤 재야 한다.
  function _measureLetter(sheetDoc, printL, ch, font) {
    // 캐시 키에 **서체를 포함**한다. 글자만으로 키를 잡으면 한글 폴백에서 서체를 바꿔도
    // 앞선 실패(null)가 그대로 반환돼 폴백이 무력화된다 (2026-08-22).
    var fname = "?";
    try { fname = String(font.name); } catch (eFn) {}
    var ckey = ch + "|" + fname;
    if (LETTER_MEASURE_CACHE.hasOwnProperty(ckey)) return LETTER_MEASURE_CACHE[ckey];
    var outline = _makeLetterOutline(printL, ch, font, PROBE_SIZE_PT, INK, INK, 0);
    var b = outline.geometricBounds;
    var w = b[2] - b[0];
    var h = b[1] - b[3];
    try { outline.remove(); } catch (eRm) {}
    var res = null;
    if (w > 0 && h > 0) res = { w: w, h: h };
    LETTER_MEASURE_CACHE[ckey] = res;
    return res;
  }

  // 빌더가 낸 도형을 실제 bbox 기준으로 D 박스에 꽉 채우고 중심을 맞춘다.
  // 폴라 도형은 최대 반지름이 대각선에 오는 경우가 많아(물결사각 89%,
  // 블롭 80%, 하트 78%) 정규화 없이 두면 한 시트에서 크기가 제각각으로 보인다.
  // 프레임과 흰 테두리에 **같은 정규화**를 걸어야 둘이 동심·비례로 남는다.
  // geometricBounds 는 bezier 의 불룩한 부분까지 반영하므로 anchor 계산보다 정확하다.
  // 스트로크는 이 뒤에 얹는다 (visibleBounds 로 재면 두께만큼 어긋난다).
  function _fitFrame(item, D, cx, cy) {
    var gb = item.geometricBounds;
    var w = gb[2] - gb[0];
    var h = gb[1] - gb[3];
    var side = w;
    if (h > w) side = h;
    if (!(side > 0)) throw new Error("프레임 bounds 가 비어 있습니다");
    var sc = D / side;
    if (Math.abs(sc - 1) > 0.001) {
      item.resize(sc * 100, sc * 100, true, true, true, true, 100, Transformation.CENTER);
    }
    gb = item.geometricBounds;
    item.translate(cx - (gb[0] + gb[2]) / 2, cy - (gb[1] + gb[3]) / 2);
    return item;
  }

  function _frameCircle(container, D, cx, cy) {
    return container.pathItems.ellipse(cy + D / 2, cx - D / 2, D, D);
  }

  function _frameRSquare(container, D, cx, cy) {
    var r = D * 0.17;
    return container.pathItems.roundedRectangle(cy + D / 2, cx - D / 2, D, D, r, r);
  }

  // 꽃/스캘럽 — 8엽. min/max = 1-2a = 0.82 (a=0.09)
  function _frameScallop(container, D, cx, cy) {
    return _polarPath(container, cx, cy, D, function (t) {
      return 1 - 0.09 + 0.09 * Math.cos(8 * t);
    });
  }

  // 물결사각 — 수퍼타원(n=4) 위에 12파. min/max = 0.81
  function _frameWave(container, D, cx, cy) {
    return _polarPath(container, cx, cy, D, function (t) {
      return _superEllipse(t, 4) * (1 - 0.055 + 0.055 * Math.cos(12 * t));
    });
  }

  // 네잎 블롭 (quatrefoil) — 45° 회전한 4엽. min/max = 0.70
  function _frameBlob(container, D, cx, cy) {
    return _polarPath(container, cx, cy, D, function (t) {
      return 1 - 0.15 + 0.15 * Math.cos(4 * (t - Math.PI / 4));
    });
  }

  // 별 — 12꼭지. 폴라 샘플링이 아니라 정확한 꼭지점으로 그린다
  // (샘플링하면 끝이 잘리고 노드만 늘어난다).
  function _frameStar(container, D, cx, cy) {
    var pts = 12;
    var R = D / 2;
    var rIn = R * 0.62;
    var p = container.pathItems.add();
    for (var i = 0; i < pts * 2; i++) {
      var th = (i / (pts * 2)) * Math.PI * 2 + Math.PI / 2;
      var rr = rIn;
      if (i % 2 === 0) rr = R;
      var xy = [cx + rr * Math.cos(th), cy + rr * Math.sin(th)];
      _addPt(p, xy, xy, xy);
    }
    p.closed = true;
    return p;
  }

  // 아치 — 사각 몸통 + 반원 지붕. 바닥 모서리는 각지게 둔다(레퍼런스와 동일).
  function _frameArch(container, D, cx, cy) {
    var W = D * 0.86, H = D;
    var L = cx - W / 2, R = cx + W / 2;
    var B = cy - H / 2, T = cy + H / 2;
    var rr = W / 2;
    var SH = T - rr;                 // 어깨 = 반원이 시작하는 높이
    if (SH < B) SH = B;
    var k = KAPPA * rr;
    var p = container.pathItems.add();
    _addPt(p, [L, B], [L, B], [L, B]);
    _addPt(p, [R, B], [R, B], [R, B]);
    _addPt(p, [R, SH], [R, SH], [R, SH + k]);
    _addPt(p, [cx, T], [cx + k, T], [cx - k, T]);
    _addPt(p, [L, SH], [L, SH + k], [L, SH]);
    p.closed = true;
    return p;
  }

  // 티켓 — 좌우 중앙에 오목한 반원 노치.
  // 노치는 오목하므로 Offset Path 로 바깥 오프셋하면 반지름이 줄어 얕아진다
  // (테두리 ≥ 노치 반지름이면 아예 사라진다). "도형 재생성" 방식에서는
  // 비율이 유지되므로 노치가 그대로 살아 있다 — 두 방식의 차이가 가장 큰 도형.
  function _frameTicket(container, D, cx, cy) {
    var W = D, H = D * 0.86;
    var L = cx - W / 2, R = cx + W / 2;
    var B = cy - H / 2, T = cy + H / 2;
    var nr = D * 0.12;
    var k = KAPPA * nr;
    var p = container.pathItems.add();
    _addPt(p, [L, B], [L, B], [L, B]);
    _addPt(p, [R, B], [R, B], [R, B]);
    _addPt(p, [R, cy - nr], [R, cy - nr], [R - k, cy - nr]);
    _addPt(p, [R - nr, cy], [R - nr, cy - k], [R - nr, cy + k]);
    _addPt(p, [R, cy + nr], [R - k, cy + nr], [R, cy + nr]);
    _addPt(p, [R, T], [R, T], [R, T]);
    _addPt(p, [L, T], [L, T], [L, T]);
    _addPt(p, [L, cy + nr], [L, cy + nr], [L + k, cy + nr]);
    _addPt(p, [L + nr, cy], [L + nr, cy + k], [L + nr, cy - k]);
    _addPt(p, [L, cy - nr], [L + k, cy - nr], [L, cy - nr]);
    p.closed = true;
    return p;
  }

  // 하트 — Everstory_shapes.jsx 의 검증된 bezier 점표를 그대로 가져왔다.
  // 곡률은 아래 표의 handle 좌표로만 결정된다 (눈으로 보고 표만 조정).
  function _frameHeart(container, D, cx, cy) {
    var s = D / 80;
    var pts = [
      [[50, 30], [50, 14], [50, 14]],   // 상단 가운데 딤
      [[80, 26], [72,  9], [88, 42]],   // 오른쪽 lobe
      [[50, 82], [60, 68], [40, 68]],   // 하단 꼭지
      [[20, 26], [12, 42], [28,  9]]    // 왼쪽 lobe
    ];
    var p = container.pathItems.add();
    for (var i = 0; i < pts.length; i++) {
      _addPt(p, _heartMap(pts[i][0], s, cx, cy),
                _heartMap(pts[i][1], s, cx, cy),
                _heartMap(pts[i][2], s, cx, cy));
    }
    p.closed = true;
    return p;
  }

  function _heartMap(xy, s, cx, cy) {
    // 디자인 박스(100×100, y-down) → Illustrator(y-up, cx·cy 중심)
    return [cx + (xy[0] - 50) * s, cy + (45.5 - xy[1]) * s];
  }

  // 폴라 반지름 함수를 균등 분할해 닫힌 패스로. rFn 의 최대값이 D/2 가
  // 되도록 정규화하므로 rFn 은 상대값만 맞으면 된다.
  function _polarPath(container, cx, cy, D, rFn) {
    var i, th;
    var rs = [];
    var maxR = 0;
    for (i = 0; i < POLAR_SAMPLES; i++) {
      th = (i / POLAR_SAMPLES) * Math.PI * 2;
      var r = rFn(th);
      rs.push(r);
      if (r > maxR) maxR = r;
    }
    if (!(maxR > 0)) throw new Error("폴라 반지름이 0 입니다");
    var k = (D / 2) / maxR;
    var p = container.pathItems.add();
    for (i = 0; i < POLAR_SAMPLES; i++) {
      th = (i / POLAR_SAMPLES) * Math.PI * 2;
      var rr = rs[i] * k;
      var xy = [cx + rr * Math.cos(th), cy + rr * Math.sin(th)];
      _addPt(p, xy, xy, xy);
    }
    p.closed = true;
    return p;
  }

  // |x|^n + |y|^n = 1 의 폴라 형태. n=2 원, n=4 둥근사각, n 클수록 각짐.
  function _superEllipse(th, n) {
    var a = Math.pow(Math.abs(Math.cos(th)), n) + Math.pow(Math.abs(Math.sin(th)), n);
    return 1 / Math.pow(a, 1 / n);
  }

  // handle 은 CORNER 로 넣는다 — SMOOTH 는 collinear 를 강제해 도형을 왜곡한다.
  function _addPt(p, a, lft, rgt) {
    var pp = p.pathPoints.add();
    pp.anchor = a;
    pp.leftDirection = lft;
    pp.rightDirection = rgt;
    pp.pointType = PointType.CORNER;
  }

  // 칼선 = 인쇄된 프레임의 **가시 가장자리** (여백 0). 사용자가 나중에
  // Offset Path 로 직접 여백을 준다 — 이름 스티커와 같은 규약.
  //
  // 키라인 스트로크는 패스 바깥으로 절반 나가므로, 칼선은 같은 프레임을
  // cutPt(= framePt + 키라인) 크기로 **다시 그려** 그 가장자리에 얹는다.
  // Offset Path 를 쓰지 않는 이유(2026-08-20 실측 비교): round join 이 별
  // 12꼭지를 통째로 뭉툭한 덩어리로 만들고 티켓 노치를 거의 지운다.
  // 도형 재생성은 모양을 그대로 지킨다.
  //
  // z-order: 글자 → 프레임 (앞→뒤)
  function _buildLetterSticker(sheetDoc, printL, kissL, spotColor, ch, frame,
                               colors, cfg, cx, cy, idx) {
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;
    sheetDoc.selection = null;

    // 1) 프레임 본체
    var frm = frame.build(printL, cfg.framePt, cx, cy);
    _fitFrame(frm, cfg.framePt, cx, cy);
    _setSolidFill(frm, colors.bg);
    if (cfg.frameStrokePt > 0) {
      frm.stroked = true;
      frm.strokeColor = colors.key;
      frm.strokeWidth = cfg.frameStrokePt;
    }
    try { frm.name = "Frame_" + frame.key + "_" + _pad2(idx); } catch (eF) {}

    // 2) 칼선 — KissCut 레이어에 바로 그린다 (PrintData 에는 남기지 않는다)
    var cut = frame.build(kissL, cfg.cutPt, cx, cy);
    _fitFrame(cut, cfg.cutPt, cx, cy);
    try { cut.name = "Cutline_" + ch + "_" + _pad2(idx); } catch (eC) {}
    _forceCutContourStroke(cut, spotColor);

    // 3) 글자 — 프레임 위에 얹는다 (마지막 생성 = 최전면)
    sheetDoc.activeLayer = printL;
    var ink = _makeLetterOutline(printL, ch, cfg.font, cfg.fontSizePt,
                                 colors.ink, colors.key, cfg.keyPt);
    var gb = ink.geometricBounds;
    var icx = (gb[0] + gb[2]) / 2;
    var icy = (gb[1] + gb[3]) / 2;
    ink.translate(cx - icx, (cy + frame.cyOff * cfg.framePt) - icy);
    if (cfg.tiltDeg !== 0) {
      // 중심 기준 회전. 안전영역은 위에서 (cos+sin) 로 이미 줄여 놨다.
      try {
        ink.rotate(cfg.tiltDeg, true, true, true, true, Transformation.CENTER);
      } catch (eRot) {}
    }
    try { ink.name = "Letter_" + ch + "_" + _pad2(idx); } catch (eL) {}

    sheetDoc.selection = null;
    try { $.gc(); } catch (eGc) {}
    return { frame: frm, cut: cut, ink: ink };
  }

  // 이름 → 블록 스펙. 공백은 버리고(스티커로 만들 수 없다) 나머지 문자마다 유닛 1개.
  function _letterBlockSpec(nameText, unitMm, tag) {
    if (!nameText) return null;
    // **NFC 합성 필수.** macOS 는 한글을 NFD(자모 분해)로 주는 경우가 많고, 그러면
    // "하린" 이 ᄒ/ᅡ/ᄅ/ᅵ/ᆫ 5 코드포인트로 쪼개진다. Bagel Fat One 은 한글 **음절**
    // (U+AC00~)은 가졌지만 **자모**(U+1100~)는 없어서 한 글자도 안 그려진다
    // (2026-08-22 실측 사고). 헤더는 이미 _nfcHangul 을 쓰고 있었는데 여기만 빠져 있었다.
    var composed = _nfcHangul(String(nameText));
    // **스페이스 = 줄바꿈. 그 외에는 무조건 한 줄** (사용자 지정 2026-08-23).
    // 예전에는 스페이스를 버리고 열 상한(6)으로 접었는데, "Charles Cho" 가
    // `c h a r / l e s c / h o` 로 잘려 단어가 뭉갰다. 이름은 단어가 안 끊겨야 읽힌다.
    var words = composed.split(/\s+/);
    var lines = [];
    var all = [];
    for (var w = 0; w < words.length; w++) {
      var lineChars = [];
      for (var i = 0; i < words[w].length; i++) {
        var ch = words[w].charAt(i);
        if (/\s/.test(ch)) continue;
        lineChars.push(ch);
        all.push(ch);
      }
      if (lineChars.length > 0) lines.push(lineChars);
    }
    if (lines.length === 0) return null;
    var maxLen = 0;
    for (var li = 0; li < lines.length; li++) {
      if (lines[li].length > maxLen) maxLen = lines[li].length;
    }
    var spec = {
      base: "__NAME_" + tag + "__",
      isLetterBlock: true,
      lines: lines,      // 단어별 글자 배열 — 그리기·치수 계산의 기준
      chars: all,        // 전체 글자 (조각 수·글리프 보고용)
      maxLen: maxLen,    // 가장 긴 줄의 글자 수 = 블록 폭을 정한다
      aspect: 1
    };
    return _letterBlockResize(spec, unitMm);
  }

  // 유닛을 바꾸면 간격·바깥 치수가 전부 따라 바뀐다. **한 곳에서만 계산한다** —
  // 부착 시점의 유닛 축소도 이걸 쓴다. 두 곳에서 계산하면 패킹 치수와 그리기가
  // 어긋나 블록이 옆 사진을 침범한다.
  function _letterBlockResize(spec, unitMm) {
    var unit = unitMm * MM_TO_PT;
    var gap = unit * LETTER_GAP_RATIO;
    spec.unitMm = unitMm;
    spec.unit = unit;
    spec.innerGap = gap;
    spec.cellW = spec.maxLen * unit + (spec.maxLen - 1) * gap;
    spec.cellH = spec.lines.length * unit + (spec.lines.length - 1) * gap;
    return spec;
  }

  // n 글자 한 줄이 폭 wPt 에 들어가는 최대 유닛(mm). 유닛 후보가 전부 넘칠 때만 쓴다.
  function _letterUnitToFit(n, wPt) {
    var denom = n + (n - 1) * LETTER_GAP_RATIO;
    if (denom <= 0) return LETTER_UNIT_MM;
    return (wPt / denom) / MM_TO_PT;
  }

  // 블록을 실제로 그린다. **칼선은 프레임과 같은 호출에서 생성한다**
  // (_buildLetterSticker 가 print 프레임 직후 kiss 칼선을 같은 기하로 그림) —
  // 심볼 라이브러리나 캐시에서 미리 만든 칼선을 가져오지 않는다. 사용자 지정.
  // 프레임은 항상 원(FRAME_DEFS[0])부터 순환, 팔레트는 Butter Pop 고정.
  function _drawLetterBlock(sheetDoc, block, x, y, printL, kissL, cutSpot) {
    var font = _resolveFont(LETTER_FONT_CANDS);
    if (!font) {
      throw new Error("서체를 찾을 수 없습니다 (" + LETTER_FONT_CANDS.join(", ") +
        "). 설치 후 Illustrator 를 재시작해야 인식됩니다.");
    }
    if (!FRAME_DEFS || !FRAME_DEFS.length || !INK) {
      throw new Error("알파벳 엔진 상수가 비어 있습니다 — var 선언이 메인 플로우 아래로 내려갔는지 확인 (sim/hoisttest.js)");
    }
    var keyColor = _hexToRGB(KEY_HEX, INK);
    var keyPt = block.unit * LETTER_KEY_RATIO;
    var minCounter = 1e9;
    var missingGlyphs = [];
    // 줄 = 단어. 줄마다 글자 수가 달라 **줄별로 가운데 정렬**한다 — 왼쪽 정렬하면
    // 짧은 줄("Cho") 오른쪽이 비어 블록이 기울어 보인다.
    // 프레임·팔레트 순환은 줄을 가로질러 이어진다(gi) — 항상 원부터, 줄마다 리셋 안 함.
    var gi = 0;
    for (var ln = 0; ln < block.lines.length; ln++) {
      var lineChars = block.lines[ln];
      var lineW = lineChars.length * block.unit + (lineChars.length - 1) * block.innerGap;
      var lineX = x + (block.cellW - lineW) / 2;
      for (var ci = 0; ci < lineChars.length; ci++, gi++) {
      var ch = lineChars[ci];
      var frame = FRAME_DEFS[gi % FRAME_DEFS.length];
      var pal = LETTER_PALETTE[gi % LETTER_PALETTE.length];
      var colors = {
        bg: _hexToRGB(pal.bg, INK),
        ink: _hexToRGB(pal.ink, INK),
        key: keyColor
      };
      var cx = lineX + ci * (block.unit + block.innerGap) + block.unit / 2;
      var cy = y - ln * (block.unit + block.innerGap) - block.unit / 2;

      // 글자 크기 = 프레임 안전영역에 맞춤. 기울기를 주면 bbox 가 (cos+sin) 배로
      // 커지므로 안전영역을 그만큼 미리 나눈다 (별·하트는 여유가 1.10배뿐).
      var tilt = _tiltFor(gi, true);
      var rad = Math.abs(tilt) * Math.PI / 180;
      var safePt = block.unit * frame.safe / (Math.cos(rad) + Math.sin(rad));
      // 글리프가 없으면 아웃라인이 비어 실측이 null 이 된다 — 조용히 빈 프레임만 남으므로
      // 한글 폴백을 시도하고, 그래도 없으면 목록에 담아 완료 메시지로 알린다.
      var chFont = font;
      var m = _measureLetter(sheetDoc, printL, ch, chFont);
      if (!m) {
        var hf = _resolveHangulFont();
        if (hf) {
          chFont = hf;
          m = _measureLetter(sheetDoc, printL, ch, chFont);
          if (!m) chFont = font;   // 폴백도 실패 — 원래 서체로 되돌리고 아래에서 보고
        }
      }
      if (!m) missingGlyphs.push(ch);
      var fontSizePt = safePt;
      if (m) {
        var longer = m.w > m.h ? m.w : m.h;
        fontSizePt = PROBE_SIZE_PT * (safePt / longer);
      }
      var cfg = {
        framePt: block.unit,
        cutPt: block.unit,          // 여백 0 — 인쇄 가장자리가 곧 컷 (오프셋은 나중에 수동)
        frameStrokePt: 0,
        fontSizePt: fontSizePt,
        keyPt: keyPt,
        tiltDeg: tilt,
        font: chFont
      };
      var built = _buildLetterSticker(sheetDoc, printL, kissL, cutSpot, ch, frame,
                                      colors, cfg, cx, cy, gi);
      var c = _minCounterPt(built.ink);
      if (c !== null && c < minCounter) minCounter = c;
      }
    }
    return {
      count: block.chars.length,
      // 조각 = 글자 하나가 프레임 하나로 따로 잘린다. 여백 0 규약이라 절대 안 붙는다.
      // (예전엔 이 값을 안 돌려줘 완료 메시지에 "조각 0" 이 찍혔다)
      pieces: block.chars.length,
      // **정상이라는 표시.** 캘리 통짜는 조각 2 이상이면 경고인데, 알파벳은 원래 낱개다 —
      // 구분 안 하면 이름마다 "10조각으로 떨어짐 ⚠" 이 뜬다.
      piecesAreLetters: true,
      missingGlyphs: missingGlyphs,
      minCounterPt: (minCounter === 1e9 ? null : minCounter)
    };
  }


  var PROBE_SIZE_PT = 200;
  var INK = C(35, 31, 29);

  // ══ 캘리그라피 이름 스티커 엔진 (Everstory_calligraphy.jsx 이식, 2026-08-23) ══
  // 이름 전체를 서체로 조판해 **한 덩어리 스티커**로 만든다. 글자 1개씩 도형 프레임에
  // 넣던 알파벳 방식을 대체 — 흰 테두리가 내장이라 사진의 흰 여백과 시각적으로 맞고,
  // 칼선이 인쇄된 테두리 가장자리를 그대로 따라 정합 오차가 없다.
  // **상수·함수를 통째로 메인 플로우 위에** 둔다 (var 초기화는 호이스팅되지 않음).

  var SHADOW_RATIO = 0.06;
  var OFFSET_JOIN_ROUND = 0;
  var BOUNCE_RISE_RATIO = 0.10;
  var BOUNCE_ROT_DEG = 5;
  var BOUNCE_SCALE_VAR = 0.07;
  var INK_STROKE_PT = 0;
  var HANGUL_FALLBACK = ["NanumBrush", "NanumPen", "SuseongHyejeong-Regular",
                         "SolmoeKimDaeGeonM", "AppleSDGothicNeo-Bold", "AppleGothic"];
  var HANGUL_FONT_CACHE = null;
  var HANGUL_FONT_RESOLVED = false;
  var WHITE = C(255, 255, 255);

  function _seedOf(text) {
    var s = 0;
    for (var i = 0; i < text.length; i++) s = (s + text.charCodeAt(i) * (i + 1)) % 997;
    return s / 997 * 6.283;
  }

  // 글자마다 위아래로 튀고 살짝 회전·크기 변화 — 요즘 레터링의 핵심 신호.
  // 문구로 시드를 만드는 결정론적 변형이라 실측과 생성이 항상 일치한다
  // (Math.random 을 쓰면 계획한 크기와 실제 크기가 어긋난다).
  function _applyBounce(group, seed, scale) {
    var kids = [];
    for (var i = 0; i < group.pageItems.length; i++) kids.push(group.pageItems[i]);
    if (kids.length < 2) return;

    // createOutline 은 글자를 역순으로 담는다 — x 중심 기준으로 좌→우 확정
    kids.sort(function (a, b) {
      var ab = a.geometricBounds, bb2 = b.geometricBounds;
      return (ab[0] + ab[2]) / 2 - (bb2[0] + bb2[2]) / 2;
    });

    var gb = group.geometricBounds;
    var inkH = gb[1] - gb[3];
    if (!(inkH > 0)) return;

    for (var k = 0; k < kids.length; k++) {
      // 서로 다른 무리수 배수 → 규칙적이지 않게 오르내린다
      var pRise = Math.sin(k * 1.9 + seed * 0.7);
      var pRot = Math.sin(k * 2.7 + seed * 1.3);
      var pScale = Math.sin(k * 1.3 + seed * 2.1);

      var sc = 1 + BOUNCE_SCALE_VAR * scale * pScale;
      try {
        kids[k].resize(sc * 100, sc * 100, true, true, true, true, 100,
                       Transformation.CENTER);
        kids[k].rotate(BOUNCE_ROT_DEG * scale * pRot, true, true, true, true,
                       Transformation.CENTER);
        kids[k].translate(0, inkH * BOUNCE_RISE_RATIO * scale * pRise);
      } catch (e) {}
    }
  }

  // 텍스트 → 아웃라인. createOutline 은 원본 TextFrame 을 소모한다.
  function _makeInkOutline(printL, text, font, fontIsHangul, fontSizePt, inkColor, bounceScale) {
    var col = inkColor ? inkColor : INK;
    var tf = printL.textFrames.pointText([0, 0]);
    tf.contents = text;
    var tr = tf.textRange;
    tr.characterAttributes.textFont = font;
    tr.characterAttributes.size = fontSizePt;
    tr.characterAttributes.fillColor = col;
    if (INK_STROKE_PT > 0) {
      tr.characterAttributes.strokeColor = col;
      tr.characterAttributes.strokeWeight = INK_STROKE_PT;
    }
    if (!fontIsHangul) _applyHangulFontOverride(tf, _getHangulFont());

    var outline = tf.createOutline();
    if (bounceScale > 0) _applyBounce(outline, _seedOf(text), bounceScale);
    return outline;
  }

  // 기준 사이즈로 실측. TextFrame 의 geometricBounds 는 글리프가 아니라
  // 폰트 메트릭(어센더~디센더) 박스라 스크립트체에서 실제 잉크보다 2배까지
  // 크다 — 반드시 아웃라인으로 변환한 뒤 재야 목표 높이가 맞는다.
  function _measurePhrase(sheetDoc, printL, text, font, fontIsHangul, bounceScale) {
    var outline = _makeInkOutline(printL, text, font, fontIsHangul,
                                  PROBE_SIZE_PT, null, bounceScale);
    var b = outline.geometricBounds;
    var w = b[2] - b[0];
    var h = b[1] - b[3];
    try { outline.remove(); } catch (eRm) {}

    if (!(w > 0) || !(h > 0)) return null;
    return { w: w, h: h };
  }

  // Offset Path 라이브 이펙트.
  //
  // jntp 매핑 함정 (Illustrator 2026 에서 실측 — 되돌리지 말 것):
  // 통념은 0=miter/1=round/2=bevel 이지만 실제로는 **0 이 round** 다.
  // 0/1/2 를 각각 적용해 렌더한 결과 0=매끄러운 라운드, 1=뾰족한 miter,
  // 2=각진 bevel 이었다. 1 로 두면 스크립트체 획 끝마다 spike 가 생겨
  // 칼선이 뾰족하게 튄다.
  function _applyOffsetEffect(item, offsetPt) {
    var xml = '<LiveEffect name="Adobe Offset Path">' +
              '<Dict data="R mlim 4 R ofst ' + offsetPt + ' I jntp ' + OFFSET_JOIN_ROUND + ' "/>' +
              '</LiveEffect>';
    item.applyEffect(xml);
  }

  function _copyPathsAsSolid(item, destGroup) {
    if (!item) return;
    if (item.typename === "PathItem") {
      var dup = item.duplicate(destGroup, ElementPlacement.PLACEATEND);
      _forceTempFill(dup);
      return;
    }
    if (item.typename === "CompoundPathItem") {
      for (var cp = 0; cp < item.pathItems.length; cp++) {
        var sub = item.pathItems[cp].duplicate(destGroup, ElementPlacement.PLACEATEND);
        _forceTempFill(sub);
      }
      return;
    }
    if (item.typename === "GroupItem") {
      for (var pi = 0; pi < item.pageItems.length; pi++) {
        _copyPathsAsSolid(item.pageItems[pi], destGroup);
      }
    }
  }

  function _forceTempFill(item) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) _forceTempFill(item.pageItems[i]);
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) _forceTempFill(item.pathItems[j]);
        return;
      }
      if (item.typename === "PathItem") {
        var black = new RGBColor();
        black.red = 0; black.green = 0; black.blue = 0;
        item.stroked = false;
        item.filled = true;
        item.fillColor = black;
      }
    } catch (e) {}
  }

  function _boundsContain(outer, inner, tol) {
    return inner[0] >= outer[0] + tol &&
           inner[2] <= outer[2] - tol &&
           inner[1] <= outer[1] - tol &&
           inner[3] >= outer[3] + tol;
  }

  // union 결과의 물리 조각 수 = 다른 패스에 포함되지 않는 바깥 윤곽 수.
  function _countPieces(item) {
    var paths = [];
    _gatherPaths(item, paths);
    if (paths.length === 0) return 0;

    var bounds = [];
    for (var i = 0; i < paths.length; i++) {
      try { bounds.push(paths[i].geometricBounds); } catch (e) { bounds.push(null); }
    }
    var outer = 0;
    for (var p = 0; p < bounds.length; p++) {
      if (!bounds[p]) continue;
      var contained = false;
      for (var q = 0; q < bounds.length; q++) {
        if (p === q || !bounds[q]) continue;
        if (_boundsContain(bounds[q], bounds[p], 0.3)) { contained = true; break; }
      }
      if (!contained) outer++;
    }
    return outer;
  }

  // 그룹 안 패스들을 하나로 합친다 (Pathfinder Add → expand).
  function _unionGroup(sheetDoc, group) {
    _forceTempFill(group);
    sheetDoc.selection = null;
    group.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");
    var sel = sheetDoc.selection;
    if (!sel || sel.length === 0) return null;
    return sel[0];
  }

  // srcItem 을 offsetPt 만큼 바깥으로 부풀린 단일 도형을 만들어 돌려준다.
  // Offset Path 라이브 이펙트 → Expand Appearance → compound 해제 → union.
  // 스트로크를 두껍게 주고 expandStyle 하는 방식은 동작하지 않는다 —
  // Expand Appearance 는 라이브 이펙트만 확장하고 평범한 스트로크는 그대로
  // 두기 때문에 칼선이 글자에 딱 붙어버린다.
  function _offsetShape(sheetDoc, layer, srcItem, offsetPt, label) {
    var src = srcItem.duplicate(layer, ElementPlacement.PLACEATEND);
    _applyOffsetEffect(src, offsetPt);

    sheetDoc.selection = null;
    src.selected = true;
    app.executeMenuCommand("expandStyle");

    var sel = sheetDoc.selection;
    if (!sel || sel.length === 0) throw new Error("offset path expand 실패 (" + label + ")");
    var expanded = sel[0];

    // compound 를 풀고 솔리드로 만들어야 Pathfinder 가 먹는다.
    // 이 과정에서 글자 속구멍이 메워지는데, 칼선은 바깥만 따야 하므로 맞다.
    var g = layer.groupItems.add();
    _copyPathsAsSolid(expanded, g);
    try { expanded.remove(); } catch (eRm) {}

    var united = _unionGroup(sheetDoc, g);
    if (!united) throw new Error("offset union 결과 없음 (" + label + ")");

    var b = united.geometricBounds;
    if (!(b[2] - b[0] > 0)) throw new Error("offset bounds 비어 있음 (" + label + ")");
    return united;
  }

  function _getHangulFont() {
    if (!HANGUL_FONT_RESOLVED) {
      HANGUL_FONT_CACHE = _resolveFont(HANGUL_FALLBACK);
      HANGUL_FONT_RESOLVED = true;
    }
    return HANGUL_FONT_CACHE;
  }

  function _composeHangulNFC(s) {
    var out = "";
    var i = 0;
    while (i < s.length) {
      var L = s.charCodeAt(i);
      if (L >= 0x1100 && L <= 0x1112 && i + 1 < s.length) {
        var V = s.charCodeAt(i + 1);
        if (V >= 0x1161 && V <= 0x1175) {
          var Tidx = 0;
          var step = 2;
          if (i + 2 < s.length) {
            var T = s.charCodeAt(i + 2);
            if (T >= 0x11A8 && T <= 0x11C2) {
              Tidx = T - 0x11A7;
              step = 3;
            }
          }
          out += String.fromCharCode(0xAC00 + ((L - 0x1100) * 21 + (V - 0x1161)) * 28 + Tidx);
          i += step;
          continue;
        }
      }
      out += s.charAt(i);
      i++;
    }
    return out;
  }

  // 글자 + (배경) + 흰 테두리 + 칼선. (x, y) = 유닛 좌상단.
  // 가장 바깥 흰 테두리와 칼선은 같은 도형을 공유한다 —
  // 인쇄된 흰 테두리 가장자리가 곧 컷 경계가 되어 정합 오차가 없다.
  //
  //  심플   : 글자 → 흰 테두리(borderPt) → 컷
  //  레이어드: 글자 → 배경색(bgPt) → 흰 테두리(+borderPt) → 컷
  function _buildCalliSticker(sheetDoc, printL, kissL, spotColor,
                              unit, cfg, x, y, idx) {
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;
    sheetDoc.selection = null;

    // 1) 글자
    var ink = _makeInkOutline(printL, unit.text, cfg.font, cfg.fontIsHangul,
                              unit.fontSizePt, cfg.inkColor, cfg.bounceScale);
    try { ink.name = "Calli_" + _pad2(idx); } catch (eInkName) {}

    // 2) 위치 — 유닛 좌상단 기준으로 바깥 여백만큼 안쪽에 글자를 둔다.
    //    left/top 은 visibleBounds 기준이라 stroke 유무에 흔들린다 —
    //    geometricBounds 로 델타를 계산해 translate 할 것.
    var gb = ink.geometricBounds;
    ink.translate((x + cfg.outerPt) - gb[0], (y - cfg.outerPt) - gb[1]);

    // 3) 하드 오프셋 그림자 (우하향) — 잉크 뒤에 깔린다
    var shadow = null;
    if (cfg.shadow) {
      var ib = ink.geometricBounds;
      var d = (ib[1] - ib[3]) * SHADOW_RATIO;
      shadow = ink.duplicate(printL, ElementPlacement.PLACEATEND);
      _setSolidFill(shadow, cfg.shadowColor);
      shadow.translate(d, -d);
      try { shadow.name = "CalliShadow_" + _pad2(idx); } catch (eShName) {}
    }

    // 4) 오프셋 기준 실루엣 = 잉크 ∪ 그림자.
    //    그림자를 빼고 잉크만으로 오프셋하면 그림자가 배경 밖으로 삐져나온다.
    var silh = printL.groupItems.add();
    ink.duplicate(silh, ElementPlacement.PLACEATEND);
    if (shadow) shadow.duplicate(silh, ElementPlacement.PLACEATEND);

    // 5) 오프셋 레이어 (뒤로 갈수록 크다 → 만든 뒤 차례로 맨 뒤로 보낸다)
    var bg = null;
    var outer;
    if (cfg.layered) {
      bg = _offsetShape(sheetDoc, printL, silh, cfg.bgPt, unit.text);
      _setSolidFill(bg, cfg.bgColor);
      try { bg.name = "CalliBg_" + _pad2(idx); } catch (eBgName) {}

      outer = _offsetShape(sheetDoc, printL, silh, cfg.bgPt + cfg.borderPt, unit.text);
      _setSolidFill(outer, WHITE);
      try { outer.name = "CalliBorder_" + _pad2(idx); } catch (eBdName) {}

      try { bg.move(printL, ElementPlacement.PLACEATEND); } catch (eMoveBg) {}
    } else {
      outer = _offsetShape(sheetDoc, printL, silh, cfg.borderPt, unit.text);
      _setSolidFill(outer, WHITE);
      try { outer.name = "CalliHalo_" + _pad2(idx); } catch (eHaloName) {}
    }
    try { silh.remove(); } catch (eRmSilh) {}
    try { outer.move(printL, ElementPlacement.PLACEATEND); } catch (eMoveOuter) {}

    var pieces = _countPieces(outer);

    // 4) 칼선 = 가장 바깥 도형과 동일
    var cut = outer.duplicate(kissL, ElementPlacement.PLACEATBEGINNING);
    try { cut.name = "Cutline_calli_" + _pad2(idx); } catch (eCutName) {}
    _forceCutContourStroke(cut, spotColor);

    sheetDoc.selection = null;
    try { $.gc(); } catch (eGc) {}
    return { ink: ink, bg: bg, outer: outer, cut: cut, pieces: pieces };
  }


  // ── 칼선 디스크 캐시 (2026-08-22) ─────────────────────────────────
  // 같은 폴더를 레이아웃 고쳐가며 여러 번 돌리는 것이 실제 작업 방식인데(2026-08-22 하루에
  // 23회 실행 / 누적 트레이스 약 395회, 필요분은 51회 = 87% 재트레이스), 트레이스 결과가
  // 문서 안 TraceStash 에만 있어 문서를 닫으면 사라졌다. 결과를 02_cutout/_cutcache 에 저장해
  // 두 번째 실행부터 트레이스를 건너뛴다.
  // 무효화 = (a) _sil.png 크기·수정시각 (b) 아래 TRACE_OPTS 에서 파생한 서명 (c) 포맷 버전.
  // 파라미터를 이 상수에서 바꾸면 서명이 달라져 **모든 캐시가 자동 무효화**된다 — 옛 설정으로
  // 뜬 칼선이 조용히 재사용되는 사고를 구조적으로 막는 것이 이 상수 분리의 목적이다.
  var CUT_CACHE_FORMAT = "EVCUT1";
  var CUT_CACHE_DIRNAME = "_cutcache";
  var TRACE_OPTS = {
    threshold: 230,
    pathFidelity: 10,
    cornerFidelity: 10,
    minimumArea: 250,
    cornerAngle: 20,
    ignoreWhite: true,
    snapCurveToLines: false
  };

  var testConfig = $.global.__EVERSTORY_NAME_INCLUDED_TEST__;

  var inputFolder = (testConfig && testConfig.inputFolder) ?
    new Folder(testConfig.inputFolder) :
    Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!inputFolder) return;

  var pairs = _collectPairs(inputFolder);
  if (pairs.length === 0) {
    alert("선택한 폴더에 _clean.psd + _sil.png 페어가 없습니다.");
    return;
  }

  // 주문 매니페스트에서 고객·주문번호·재질·사이즈·스티커 이름을 읽어 다이얼로그를 채운다.
  // 못 읽으면 폴더명 폴백 — 어느 쪽이든 다이얼로그 상단이 출처와 미확정 항목을 표시한다.
  var orderInfo = _orderDefaultsFrom(_readOrderManifest(inputFolder), _deriveDefaultCustomerName(inputFolder));
  var options = (testConfig && testConfig.options) ? testConfig.options : _showDialog(pairs, orderInfo);
  if (!options) return;

  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    alert("template_cutout_v2.ait를 찾을 수 없습니다.");
    return;
  }

  var padPt = BODY_PADDING_MM * MM_TO_PT;
  // 단일 사이즈는 uniform grid 가 시각 간격을 자동 균등 분배하므로 gap 입력 불필요.
  // Package/전 사이즈 packer 가 셀 간 최소 간격으로 사용 — GAP_DEFAULT_MM 고정.
  var gapPt = GAP_DEFAULT_MM * MM_TO_PT;
  var cutMarginPt = options.cutMarginMm * MM_TO_PT;

  // 시트1 문서를 먼저 열어 body 치수를 잰다 — 배분층이 binW/binH 를 필요로 하므로 계획보다 선행.
  // 시트 2장째부터는 루프가 같은 방식으로 새 문서를 연다.
  var firstCtx = _openSheetContext(templateFile, padPt);
  if (firstCtx.error) {
    alert(firstCtx.error);
    return;
  }
  var binW = firstCtx.binW;
  var binH = firstCtx.binH;

  // 다이얼로그에서 selectedPairs 받음. testConfig (selectedPairs 없음) 면 pairs 전체 사용.
  var layoutPairs = (options.selectedPairs && options.selectedPairs.length > 0) ?
    options.selectedPairs : pairs;
  // 보고용: 미선택 (운영자가 안 고름) 과 cap trim 을 분리 집계.
  var pickedCount = layoutPairs.length;

  if (options.isPackage) {
    // Package: 개수 cap 없음. 넘치는 분은 버리지 않고 배분층이 다음 시트로 넘긴다.
    for (var ta = 0; ta < layoutPairs.length; ta++) {
      try { _measurePairAspect(layoutPairs[ta]); }
      catch (eTa) { layoutPairs[ta].aspect = 1; }
    }
  } else {
    // 안전판: testConfig 경로에서도 cap 위반은 잘라낸다 (다이얼로그는 auto-cap 으로 자체 보장).
    var designLimit = options.isAllSizes ? layoutPairs.length
                    : (DESIGN_LIMIT_BY_SIZE_MM[options.sizeMm] || layoutPairs.length);
    if (layoutPairs.length > designLimit) {
      var capped = [];
      for (var ci = 0; ci < designLimit; ci++) capped.push(layoutPairs[ci]);
      layoutPairs = capped;
    }

    var anyTooBig = false;
    for (var pi = 0; pi < layoutPairs.length; pi++) {
      try {
        _measurePairAspect(layoutPairs[pi]);
      } catch (eAsp) {
        layoutPairs[pi].aspect = 1;
      }
      if (options.isAllSizes) {
        // 전 사이즈: 가장 큰 셀(2.5") 이 시트에 들어가는지 검사
        var heroItem = _itemForSize(layoutPairs[pi], ALLSIZES_ORDER_MM[0]);
        if (heroItem.w > binW || heroItem.h > binH) anyTooBig = true;
      } else {
        layoutPairs[pi].sizeMm = options.sizeMm;
        var pairSizePt = options.sizeMm * MM_TO_PT;
        if (layoutPairs[pi].aspect >= 1) {
          layoutPairs[pi].cellW = pairSizePt;
          layoutPairs[pi].cellH = pairSizePt / layoutPairs[pi].aspect;
        } else {
          layoutPairs[pi].cellW = pairSizePt * layoutPairs[pi].aspect;
          layoutPairs[pi].cellH = pairSizePt;
        }
        if (layoutPairs[pi].cellW > binW || layoutPairs[pi].cellH > binH) anyTooBig = true;
      }
    }

    if (anyTooBig) {
      alert("일부 사진 셀이 info > body 영역보다 큽니다. 사진 스티커 크기를 줄이세요.");
      try { firstCtx.doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eABig) {}
      return;
    }
  }

  // ── 시트 계획 ─────────────────────────────────────────────────────
  // Package 만 다중 시트. 단일/전 사이즈는 기존 한 시트 정책 그대로 (계획 길이 1).
  var sheetPlan = [];
  var pkgPlan = null;
  if (options.isPackage) {
    var nSheets = options.packageSheets ? options.packageSheets : PACKAGE_SHEET_VALUES[PACKAGE_SHEET_DEFAULT_INDEX];
    pkgPlan = _planPackageSheets(layoutPairs, nSheets, binW, binH, gapPt);
    // 디자인이 시트 수보다 적으면 딜이 빈 시트를 남긴다 (예: 1디자인 × 2시트) — 빈 .ai 를
    // 저장하지 않도록 계획 단계에서 제외한다.
    for (var ps = 0; ps < pkgPlan.sheets.length; ps++) {
      if (pkgPlan.sheets[ps].pairs.length > 0) sheetPlan.push(pkgPlan.sheets[ps].pairs);
    }
  } else {
    sheetPlan.push(layoutPairs);
  }

  // ── 시트 루프 ─────────────────────────────────────────────────────
  // 시트마다 문서를 새로 연다. 배분이 배타적이라 같은 디자인이 두 시트에 걸치지 않으므로
  // trace/embed 캐시가 시트 경계를 넘을 이유가 없다 (총 trace 횟수는 기존과 동일).
  var stamp = _timestamp();
  var sheetOutputs = [];
  var ctxError = "";
  for (var sIdx = 0; sIdx < sheetPlan.length; sIdx++) {
    var sctx;
    if (sIdx === 0) {
      sctx = firstCtx;
    } else {
      sctx = _openSheetContext(templateFile, padPt);
      if (sctx.error) { ctxError = sctx.error; break; }
    }
    sheetOutputs.push(_produceSheet(sctx, sheetPlan[sIdx], options, sIdx, sheetPlan.length,
      gapPt, cutMarginPt, inputFolder, stamp));
  }

  // ── 집계 ──────────────────────────────────────────────────────────
  var totPlaced = 0, totSkipped = 0, totRotated = 0, totLeftover = 0, totShortfall = 0;
  var totUnique = 0, totRepeated = 0;
  var totSymbolOk = 0;
  var totCacheHits = 0;
  var letterLine = "";
  var allSymbolFail = [];
  var allFailed = [];
  var usedBases = {};
  var totDesigns = 0;
  for (var oi = 0; oi < sheetOutputs.length; oi++) {
    var so = sheetOutputs[oi];
    totPlaced += so.packResult.placed.length - so.skippedPlacements;
    totSkipped += so.skippedPlacements;
    totRotated += so.rotatedCount;
    totLeftover += so.packResult.leftover.length;
    totShortfall += so.packResult.minShortfall ? so.packResult.minShortfall.length : 0;
    totUnique += so.uniqueCount;
    totSymbolOk += so.symbolOk;
    totCacheHits += so.cutCacheHits;
    // 이름이 비어 있어도 **침묵하지 말 것** — 운영자가 "필드를 안 채웠는지 / 기능이
    // 실패했는지" 를 구분할 수 없다 (2026-08-22: 이것 때문에 원인 파악이 늦어졌다).
    if (oi === 0 && (!so.letterBlocks || so.letterBlocks.length === 0)) {
      // 이름을 **입력했는데도** 블록이 0 이면 칸이 빈 게 아니라 스펙 생성이 실패한 것이다
      //   (서체 없음 / 글리프 없음 / NAME_CALLI_COUNT=0 인데 알파벳까지 실패).
      //   두 경우를 같은 문구로 묶으면 또 오진한다 — 갈라서 찍는다.
      if (options.stickerName) {
        letterLine = "이름 스티커: 없음 — \"" + options.stickerName + "\" 로 스펙을 못 만들었습니다" +
          " (서체 " + NAME_FONT_CANDS[0] + " 없음 / 글리프 없음 확인)";
      } else {
        letterLine = "이름 스티커: 없음 — 다이얼로그 '스티커 이름' 칸이 비어 있었습니다" +
          " (헤더의 '고객 이름' 과 별개 칸입니다)";
      }
    }
    if (so.letterBlocks && so.letterBlocks.length > 0) {
      function _mmOf(v) { return Math.round(v / MM_TO_PT * 10) / 10; }
      letterLine = "이름 스티커: \"" + options.stickerName + "\"";
      for (var lbi = 0; lbi < so.letterBlocks.length; lbi++) {
        var b = so.letterBlocks[lbi];
        if (b.isAlphabetBlock) {
          // 줄 구성(단어별 글자 수)과 **실제 쓰인 유닛**을 같이 찍는다 — 유닛은 폭에
          // 맞춰 자동으로 낮아지므로, 글자가 작게 나왔을 때 원인을 바로 보게 한다.
          var lineDesc = [];
          for (var ldi = 0; ldi < b.lines.length; ldi++) lineDesc.push(b.lines[ldi].join(""));
          letterLine += "\n  알파벳 프레임 — " + lineDesc.join(" / ") +
            " · 유닛 " + (Math.round(b.unitMm * 10) / 10) + "mm · " +
            _mmOf(b.cellW) + " × " + _mmOf(b.cellH) + "mm";
          if (b.unitMm < LETTER_UNIT_MM) {
            letterLine += "  (폭에 맞춰 " + LETTER_UNIT_MM + "mm 에서 축소)";
          }
        } else {
          letterLine += "\n  캘리 통짜 — " + _mmOf(b.cellW) + " × " + _mmOf(b.cellH) + "mm";
        }
      }
      letterLine += "\n  배치 " + so.letterAttachedCount + "/" + so.letterWanted + "블록";
      // 사진을 빼고 자리를 만든 경우 — 운영자가 "왜 사진이 줄었지" 를 안 헤매게 명시한다.
      if (so.letterEvicted > 0) {
        letterLine += " · 자리를 만드느라 사진 " + so.letterEvicted + "장 뺌";
      }
      // 이름 아래 죽은 공간에 채워 넣은 장수 — 안 찍으면 "왜 사진이 늘었지" 가 된다.
      if (so.letterFilled > 0) {
        letterLine += " · 이름 아래 빈 공간에 사진 " + so.letterFilled + "장 채움";
      }
      if (so.letterAttachedCount < so.letterWanted) {
        letterLine += "  ⚠ " + (so.letterWanted - so.letterAttachedCount) +
          "블록은 자리가 없어 빠짐 (사진이 많으면 정상)";
      }
      if (so.letterAttachedCount === 0) {
        letterLine += "\n  ⚠ 전부 배치 실패 — 시트에 이름 없음";
      } else if (so.letterError) {
        letterLine += "\n  ⚠ 그리기 실패 — 시트에 글자 없음: " + so.letterError;
      } else if (so.letterInfo) {
        // 조각 수 = union 결과의 바깥 윤곽 개수. 1 이면 이름 전체가 한 장으로 잘린다.
        // 2 이상이면 글자 사이가 흰 테두리로 안 이어져 낱글자로 떨어진다는 뜻.
        if (so.letterInfo.alphaPieces > 0) {
          letterLine += "  (알파벳 " + so.letterInfo.alphaPieces + "조각 — 글자마다 따로, 여백 0 규약)";
        }
        if (so.letterInfo.pieces > 0) {
          letterLine += "  (캘리 조각 " + so.letterInfo.pieces + ")";
          if (so.letterInfo.pieces > 1) {
            letterLine += "\n  ⚠ 이름이 " + so.letterInfo.pieces + "조각으로 떨어짐 — 흰 테두리(" +
              "NAME_HALO_RATIO) 를 키우면 한 장으로 붙습니다";
          }
        }
        // 카운터(글자 속구멍) 최소값. 위험선 밑이면 인쇄에서 잉크가 번져 메워진다 —
        // 계산만 해두고 안 찍어서 여태 아무도 못 봤다 (2026-08-23 수정).
        if (so.letterInfo.minCounterPt !== null) {
          var ctrMm = Math.round(so.letterInfo.minCounterPt / MM_TO_PT * 100) / 100;
          letterLine += "\n  최소 카운터 " + ctrMm + "mm";
          if (ctrMm < LETTER_MIN_COUNTER_MM) {
            letterLine += "  ⚠ 위험선(" + LETTER_MIN_COUNTER_MM + "mm) 미만 — 인쇄에서 속구멍이 메워질 수 있습니다";
          }
        }
        if (so.letterInfo.missingGlyphs.length > 0) {
          letterLine += "\n  ⚠ 서체에 없는 글자 " + so.letterInfo.missingGlyphs.length + "개: " +
            so.letterInfo.missingGlyphs.join(" ") + " — 그 칸은 빈 프레임으로 나갑니다";
        }
      }
    }
    for (var sf = 0; sf < so.symbolFail.length; sf++) allSymbolFail.push(so.symbolFail[sf]);
    totRepeated += so.packResult.repeatedCount ? so.packResult.repeatedCount : 0;
    for (var fi2 = 0; fi2 < so.failedItems.length; fi2++) allFailed.push(so.failedItems[fi2]);
    // **배정된 페어가 아니라 실제로 그려진 것만 센다.** 자리가 없어 빠진 디자인
    // (leftover) 과 trace 실패분이 섞이면 합계가 trace unique / 심볼 수와 안 맞는다.
    for (var pbk in so.drawnBases) {
      if (!so.drawnBases.hasOwnProperty(pbk)) continue;
      if (usedBases[pbk]) continue;
      usedBases[pbk] = true;
      totDesigns++;
    }
  }

  // PHOTOS 는 **주문에 들어온 사진 수**다 — 배치 결과(totDesigns)로 바꾸면 주문서가 틀린다.
  var orderDetail = _buildOrderDetail(options, layoutPairs.length, null);

  var sizeLineText;
  if (options.isPackage) {
    sizeLineText = "Package 3버킷: " + _bucketDistStr(layoutPairs) +
      " / 사다리 " + pkgPlan.ladder.key + " (후보 " + PACKAGE_LADDERS.length + "개 중 자동 선택)" +
      " / 칼선 여백: " + options.cutMarginMm + "mm";
  } else if (options.isAllSizes) {
    var allSummary = sheetOutputs.length > 0 ? sheetOutputs[0].packResult.mixedSummary : null;
    sizeLineText = "전 사이즈: " + (allSummary ? allSummary.human : "0.75-2.5\"") +
      " / 칼선 여백: " + options.cutMarginMm + "mm";
  } else {
    sizeLineText = "기본 사이즈: " + _sizeLetter(options.sizeMm) + " " + _inchStr(options.sizeMm) +
      " (" + _mmCmStr(options.sizeMm) + ") cap " + designLimit +
      " / 칼선 여백: " + options.cutMarginMm + "mm";
  }

  var unselectedCount = pairs.length - pickedCount;
  var trimmedCount = pickedCount - layoutPairs.length;
  var inputLine = "사진 입력: " + pairs.length + "개 / 선택: " + layoutPairs.length +
    "개 / 실제 제작: " + totDesigns + "개";
  if (unselectedCount > 0) inputLine += " / 미선택: " + unselectedCount + "개";
  if (trimmedCount > 0) inputLine += " / cap trim: " + trimmedCount + "개";

  // 시트별 상세 — 운영자가 어느 장이 헐거운지 바로 보게.
  var sheetLines = "";
  for (var li2 = 0; li2 < sheetOutputs.length; li2++) {
    var s2 = sheetOutputs[li2];
    sheetLines += "\n시트 " + (li2 + 1) + "/" + sheetPlan.length +
      ": 충전 " + Math.round(s2.fill * 1000) / 10 + "%" +
      " · 스티커 " + (s2.packResult.placed.length - s2.skippedPlacements) + "장" +
      " · 디자인 " + s2.drawnDesigns + "개" +
      " · 행 " + s2.packResult.rows.length + "개";
    if (s2.rotatedCount > 0) sheetLines += " · 회전 " + s2.rotatedCount + "개";
    if (options.isPackage) sheetLines += "\n    구성: " + _packageDistStr(s2.pairs);
    if (s2.savedPath) {
      sheetLines += "\n    저장: " + s2.savedPath;
    } else {
      sheetLines += "\n    저장 실패: " + (s2.saveError || "unknown") + " — Illustrator 에서 직접 저장하세요.";
    }
  }

  var warnLines = "";
  if (ctxError) {
    warnLines += "⚠ 시트 " + (sheetOutputs.length + 1) + " 문서 열기 실패 (이후 시트 미생성): " + ctxError + "\n";
  }
  // leftover 는 "그 시트에서 한 장도 못 놓은 디자인" 이다. 원인은 대개 오버사이즈가 아니라
  // **디자인 과다**(시트당 담을 수 있는 수를 넘김) 다 — 원인을 잘못 짚게 하는 문구였다.
  if (totLeftover > 0) {
    warnLines += "⚠ 미배치 디자인: " + totLeftover + "개 (시트 공간 부족 — 디자인을 줄이거나 시트를 늘리세요)\n";
  }
  if (totShortfall > 0) warnLines += "⚠ Package min 미달 (공간 부족): " + totShortfall + "건\n";
  if (totSkipped > 0) warnLines += "⚠ trace 실패로 skip 된 placement: " + totSkipped + "개\n";
  // 전 사이즈 보장 실패 / evict 구제는 시트 단위 정보라 시트0 것만 (전 사이즈는 항상 1시트).
  if (sheetOutputs.length > 0) {
    var p0 = sheetOutputs[0].packResult;
    if (p0.missingSizes && p0.missingSizes.length > 0) {
      var msParts = [];
      for (var msI = 0; msI < p0.missingSizes.length; msI++) msParts.push(_inchStr(p0.missingSizes[msI]));
      warnLines += "⚠ 전 사이즈 보장 실패 (공간 부족, 0장): " + msParts.join(", ") + "\n";
    }
    if (p0.evictions && p0.evictions.length > 0) {
      var evParts = [];
      for (var evI = 0; evI < p0.evictions.length; evI++) {
        evParts.push(_inchStr(p0.evictions[evI].outSize) + " 1개 → " + _inchStr(p0.evictions[evI].inSize));
      }
      warnLines += "보장 구제 교체 (채움 양보): " + evParts.join(", ") + "\n";
    }
  }

  var msg =
    "완료: Name Included 시트 " + sheetOutputs.length + "장 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + "\n" +
    "실행 파일: " + _scriptFileHint() + "\n" +
    "고객 이름: " + options.nameText + "\n" +
    "헤더: info > header > header_right (값만)\n" +
    "오더 디테일: " + _orderDetailToString(orderDetail) + "\n" +
    sizeLineText + "\n" +
    inputLine + "\n" +
    "합계: 스티커 " + totPlaced + "장 / 디자인 " + totDesigns + "개" +
    (totRepeated > 0 ? " (반복 채움 " + totRepeated + "개 포함)" : "") +
    (totRotated > 0 ? " / 회전 " + totRotated + "개" : "") +
    " / trace unique " + totUnique + "회\n" +
    "칼선 캐시: " + totCacheHits + "/" + totUnique + " 히트" +
    (totCacheHits === totUnique && totUnique > 0
      ? " — 트레이스 0회 (전부 재사용)"
      : " / 신규 트레이스 " + (totUnique - totCacheHits) + "회") + "\n" +
    "래스터: 심볼 " + totSymbolOk + "/" + totUnique + " 디자인" +
    (allSymbolFail.length > 0
      ? " (심볼 실패 " + allSymbolFail.length + "건 → 해당 디자인만 구 복제 방식, 파일 커짐)"
      : " — 배치 반복이 래스터를 복사하지 않음") + "\n" +
    sheetLines + "\n\n" +
    (letterLine ? letterLine + "\n\n" : "") +
    warnLines;

  if (allSymbolFail.length > 0) {
    msg += "\n심볼 생성 실패 (파일 크기만 영향, 출력물은 정상):";
    for (var sfk = 0; sfk < allSymbolFail.length; sfk++) msg += "\n- " + allSymbolFail[sfk];
    msg += "\n";
  }
  if (allFailed.length > 0) {
    // base 별 dedupe — 같은 페어의 trace fail + cache 없음 후폭풍이 누적된 케이스 1줄로 정리
    var failedFirstError = {};
    var failedOrder = [];
    for (var fi = 0; fi < allFailed.length; fi++) {
      var b = allFailed[fi].base;
      if (failedFirstError[b] == null) {
        failedFirstError[b] = allFailed[fi].error;
        failedOrder.push(b);
      }
    }
    msg += "\ntrace 실패 " + failedOrder.length + "건 (해당 페어는 시트에서 자동 제외됨, Illustrator 재시작 후 재시도 권장):";
    for (var fk = 0; fk < failedOrder.length; fk++) {
      msg += "\n- " + failedOrder[fk] + ": " + failedFirstError[failedOrder[fk]];
    }
  }
  if (testConfig) {
    testConfig.lastMessage = msg;
  } else {
    alert(msg);
  }

  if (testConfig && testConfig.closeAfter) {
    for (var tc = 0; tc < sheetOutputs.length; tc++) {
      try { sheetOutputs[tc].doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eTestClose) {}
    }
  }


  // ═════════════════════════════════════════════════════════
  //  UI
  // ═════════════════════════════════════════════════════════

  function _showDialog(pairsArg, orderInfo) {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 18;
    dlg.spacing = 12;

    // 매니페스트에서 온 값 요약 — 손으로 다시 입력하는 대신 여기서 눈으로 대조한다.
    // 못 좁힌 항목은 아래 주황색 줄로 이유가 뜬다 (그 칸만 직접 고르면 된다).
    dlg.add("statictext", undefined, _orderSummaryLine(orderInfo));
    for (var noteI = 0; noteI < orderInfo.notes.length; noteI++) {
      var noteLine = dlg.add("statictext", undefined, "⚠ " + orderInfo.notes[noteI]);
      try { noteLine.graphics.foregroundColor = noteLine.graphics.newPen(noteLine.graphics.PenType.SOLID_COLOR, [0.78, 0.42, 0.06], 1); } catch (eNote) {}
    }

    var namePanel = dlg.add("panel", undefined, "고객 이름");
    namePanel.orientation = "column";
    namePanel.alignChildren = "fill";
    namePanel.margins = [14, 18, 14, 14];
    var initialName = (orderInfo.customerName && orderInfo.customerName.length > 0) ? orderInfo.customerName : "Mina";
    var nameInput = namePanel.add("edittext", undefined, initialName);
    nameInput.preferredSize = [320, 24];

    // 스티커 이름은 고객 이름과 **별개**다 — 선물이면 받는 사람 이름이 들어간다.
    // 비우면 이름 스티커를 만들지 않는다.
    var stickerPanel = dlg.add("panel", undefined, "스티커 이름 (알파벳 프레임 · 비우면 없음)");
    stickerPanel.orientation = "column";
    stickerPanel.alignChildren = "fill";
    stickerPanel.margins = [14, 18, 14, 14];
    stickerPanel.spacing = 4;
    var stickerNameInput = stickerPanel.add("edittext", undefined, orderInfo.stickerName || "");
    stickerNameInput.preferredSize = [320, 24];
    var stickerHint = stickerPanel.add("statictext", undefined,
      "9.5mm 프레임 · 스페이스에서만 줄바꿈 · 전 모드 · 자리 없으면 사진을 빼고 넣음 · 첫 장에만");
    try { stickerHint.graphics.foregroundColor = stickerHint.graphics.newPen(stickerHint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eSh) {}

    var detailPanel = dlg.add("panel", undefined, "헤더 정보");
    detailPanel.orientation = "column";
    detailPanel.alignChildren = "fill";
    detailPanel.margins = [14, 18, 14, 14];
    detailPanel.spacing = 8;

    var materialGroup = detailPanel.add("group");
    materialGroup.orientation = "row";
    materialGroup.alignChildren = "center";
    materialGroup.add("statictext", undefined, "재질");
    var materialDropdown = materialGroup.add("dropdownlist", undefined, MATERIAL_OPTIONS);
    materialDropdown.selection = _indexOfValue(MATERIAL_OPTIONS, orderInfo.material, 0);
    materialDropdown.preferredSize = [250, 24];

    var orderGroup = detailPanel.add("group");
    orderGroup.orientation = "row";
    orderGroup.alignChildren = "center";
    orderGroup.add("statictext", undefined, "주문번호");
    var orderInput = orderGroup.add("edittext", undefined, orderInfo.orderNumber || "");
    orderInput.preferredSize = [250, 24];

    var dateGroup = detailPanel.add("group");
    dateGroup.orientation = "row";
    dateGroup.alignChildren = "center";
    dateGroup.add("statictext", undefined, "날짜");
    var dateInput = dateGroup.add("edittext", undefined, _todayIso());
    dateInput.preferredSize = [250, 24];

    var sizePanel = dlg.add("panel", undefined, "사진 스티커 긴 변");
    sizePanel.orientation = "row";
    sizePanel.alignChildren = "center";
    sizePanel.margins = [14, 18, 14, 14];
    sizePanel.spacing = 8;
    var sizeDropdown = sizePanel.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDropdown.selection = _indexOfValue(SIZE_VALUES, orderInfo.sizeMm, SIZE_DEFAULT_INDEX);
    sizeDropdown.preferredSize = [320, 24];
    // Package 전용 시트 수. 다른 모드는 한 시트 정책이라 비활성.
    sizePanel.add("statictext", undefined, "시트");
    var sheetDropdown = sizePanel.add("dropdownlist", undefined, PACKAGE_SHEET_OPTIONS);
    sheetDropdown.selection = _indexOfValue(PACKAGE_SHEET_VALUES, orderInfo.packageSheets, PACKAGE_SHEET_DEFAULT_INDEX);
    sheetDropdown.preferredSize = [110, 24];

    var pairsPanel = dlg.add("panel", undefined, "사용할 사진 페어 (multi-select)");
    pairsPanel.orientation = "column";
    pairsPanel.alignChildren = "fill";
    pairsPanel.margins = [14, 18, 14, 14];
    pairsPanel.spacing = 6;

    var pairItems = [];
    for (var pli = 0; pli < pairsArg.length; pli++) pairItems.push(pairsArg[pli].base);
    // numberOfColumns:1 + showHeaders:false → 행 전체가 클릭 hit area 가 됨 (이름 옆 빈 공간 클릭도 선택 동작).
    var pairsListbox = pairsPanel.add("listbox", undefined, pairItems, {
      multiselect: true,
      numberOfColumns: 1,
      showHeaders: false
    });
    pairsListbox.preferredSize = [340, 180];

    var countRow = pairsPanel.add("group");
    countRow.orientation = "row";
    countRow.alignChildren = "left";
    countRow.spacing = 8;
    var countLabel = countRow.add("statictext", undefined, "선택: 0 / 0");
    countLabel.preferredSize = [180, 18];
    var hintLabel = countRow.add("statictext", undefined, "사이즈에 따라 cap 자동 적용");
    try { hintLabel.graphics.foregroundColor = hintLabel.graphics.newPen(hintLabel.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eHi) {}

    function _currentSizeMm() {
      if (sizeDropdown.selection !== null) {
        return SIZE_VALUES[sizeDropdown.selection.index];
      }
      return SIZE_VALUES[SIZE_DEFAULT_INDEX];
    }
    function _currentSheets() {
      if (sheetDropdown.selection !== null) return PACKAGE_SHEET_VALUES[sheetDropdown.selection.index];
      return PACKAGE_SHEET_VALUES[PACKAGE_SHEET_DEFAULT_INDEX];
    }
    function _capForSize(sizeMm) {
      // Package cap 은 시트 수에 비례 — 넘치는 분을 버리지 않고 다음 시트로 넘기므로
      // 구 고정값 8 은 다중 시트에서 입력을 막는 족쇄가 된다.
      if (sizeMm === PACKAGE_SIZE_VALUE) return PACKAGE_MAX_DESIGNS_PER_SHEET * _currentSheets();
      if (sizeMm === ALLSIZES_SIZE_VALUE) return pairsArg.length;
      return DESIGN_LIMIT_BY_SIZE_MM[sizeMm] || pairsArg.length;
    }
    var _syncing = false;
    function _syncCapAndCount() {
      if (_syncing) return;
      _syncing = true;
      try {
        var sz = _currentSizeMm();
        var cap = _capForSize(sz);
        var sel = pairsListbox.selection;
        var selLen = sel ? sel.length : 0;
        if (sel && selLen > cap) {
          var trimmed = [];
          for (var t = 0; t < cap; t++) trimmed.push(sel[t]);
          pairsListbox.selection = trimmed;
          selLen = cap;
        }
        countLabel.text = "선택: " + selLen + " / " + cap;
        sheetDropdown.enabled = (sz === PACKAGE_SIZE_VALUE);
        if (sz === PACKAGE_SIZE_VALUE) {
          hintLabel.text = "Package: 파일명 _BIG/_MED/_SML · 인치는 스크립트가 배정 · 디자인 많을수록 시트가 꽉 참";
        } else if (sz === ALLSIZES_SIZE_VALUE) {
          hintLabel.text = "전 사이즈: 디자인 순서대로 배정 (0.75-2.5\" 각 1장 이상) · Shopify Mixed 주문 제작용";
        } else {
          hintLabel.text = "사이즈에 따라 cap 자동 적용";
        }
      } finally {
        _syncing = false;
      }
    }
    pairsListbox.onChange = _syncCapAndCount;
    sizeDropdown.onChange = _syncCapAndCount;
    sheetDropdown.onChange = _syncCapAndCount;

    // 기본 선택: 처음 cap 개 자동 선택
    var _initialCap = _capForSize(_currentSizeMm());
    var _initialSel = [];
    for (var isi = 0; isi < pairItems.length && isi < _initialCap; isi++) _initialSel.push(pairsListbox.items[isi]);
    pairsListbox.selection = _initialSel;
    _syncCapAndCount();

    var cutPanel = dlg.add("panel", undefined, "칼선 여백");
    cutPanel.orientation = "row";
    cutPanel.margins = [14, 18, 14, 14];
    cutPanel.spacing = 14;
    var cutRadios = [];
    for (var cm = 0; cm < CUT_MARGIN_OPTIONS.length; cm++) {
      cutRadios.push(cutPanel.add("radiobutton", undefined, CUT_MARGIN_OPTIONS[cm]));
    }
    cutRadios[CUT_MARGIN_DEFAULT_INDEX].value = true;

    var hint = dlg.add("statictext", undefined, "info > header > header_right — 우측 정렬 3줄 (이름·사이즈·재질 / 디자인수 / Order·date). 주문번호는 헤더 표기용 (파일명 미포함).");
    try { hint.graphics.foregroundColor = hint.graphics.newPen(hint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eHint) {}

    var btnGroup = dlg.add("group");
    btnGroup.alignment = "right";
    btnGroup.spacing = 10;
    btnGroup.add("button", undefined, "취소", { name: "cancel" });
    var okBtn = btnGroup.add("button", undefined, "생성", { name: "ok" });
    okBtn.active = true;

    // 검증은 다이얼로그가 닫히기 전에 — 실패 시 입력 유지한 채 계속.
    // (닫힌 뒤 검증하면 스크립트가 종료돼 폴더 선택부터 전부 재입력해야 했음.)
    okBtn.onClick = function () {
      if (!_trim(nameInput.text)) {
        alert("이름이 비어 있습니다.");
        return;
      }
      if (!pairsListbox.selection || pairsListbox.selection.length === 0) {
        alert("페어가 선택되지 않았습니다. 최소 1개 선택하세요.");
        return;
      }
      dlg.close(1);
    };

    if (dlg.show() !== 1) return null;

    var nameText = _trim(nameInput.text);
    var sizeMm = _currentSizeMm();

    var cutMarginMm = CUT_MARGIN_VALUES[CUT_MARGIN_DEFAULT_INDEX];
    for (var cidx = 0; cidx < cutRadios.length; cidx++) {
      if (cutRadios[cidx].value) { cutMarginMm = CUT_MARGIN_VALUES[cidx]; break; }
    }

    var materialText = (materialDropdown.selection !== null) ? materialDropdown.selection.text : MATERIAL_OPTIONS[0];

    var selectedPairs = [];
    if (pairsListbox.selection) {
      for (var spi = 0; spi < pairsListbox.selection.length; spi++) {
        selectedPairs.push(pairsArg[pairsListbox.selection[spi].index]);
      }
    }
    // okBtn.onClick 이 보장하지만, 비면 main 이 pairs 전체로 폴백하므로 안전판으로 중단 유지.
    if (selectedPairs.length === 0) {
      alert("페어가 선택되지 않았습니다. 최소 1개 선택하세요.");
      return null;
    }

    return {
      nameText: nameText,
      material: materialText,
      orderNumber: _trim(orderInput.text),
      orderDate: _trim(dateInput.text) || _todayIso(),
      sizeMm: sizeMm,
      isPackage: (sizeMm === PACKAGE_SIZE_VALUE),
      isAllSizes: (sizeMm === ALLSIZES_SIZE_VALUE),
      cutMarginMm: cutMarginMm,
      packageSheets: PACKAGE_SHEET_VALUES[sheetDropdown.selection ? sheetDropdown.selection.index : PACKAGE_SHEET_DEFAULT_INDEX],
      stickerName: _trim(stickerNameInput.text),
      selectedPairs: selectedPairs
    };
  }

  function _buildOrderDetail(options, photoCount, packResult) {
    var spec;
    if (options.isPackage) {
      spec = "Package/" + options.cutMarginMm + "mm";
    } else if (options.isAllSizes) {
      spec = "AllSizes/0.75-2.5in/" + options.cutMarginMm + "mm";
    } else {
      spec = _sizeLetter(options.sizeMm) + "/" + _inchStr(options.sizeMm) + "/" + options.cutMarginMm + "mm";
    }
    var orderNum = options.orderNumber ? options.orderNumber : "—";
    return {
      rows: [
        { left: "TYPE: Name Included", right: "MATERIAL: " + options.material },
        { left: "SPEC: " + spec,        right: "PHOTOS: " + photoCount },
        { left: "ORDER: " + orderNum,   right: "DATE: " + options.orderDate }
      ]
    };
  }

  function _orderDetailToString(detail) {
    var lines = [];
    for (var i = 0; i < detail.rows.length; i++) {
      lines.push(detail.rows[i].left + "    " + detail.rows[i].right);
    }
    return lines.join("\r");
  }

  function _scriptFileHint() {
    try {
      return $.fileName ? String($.fileName) : "unknown";
    } catch (eFileHint) {
      return "unknown";
    }
  }

  function _sizeLetter(mm) {
    for (var i = 0; i < SIZE_VALUES.length; i++) {
      if (SIZE_VALUES[i] === mm) return SIZE_LETTERS[i];
    }
    return "·";
  }

  // 25.4mm → "1in", 31.75mm → "1.25in" (파일명/spec 안전 표기)
  function _inchStr(mm) {
    var inch = mm / 25.4;
    return inch.toFixed(2).replace(/\.?0+$/, "") + "in";
  }

  // 25.4mm → "25.4mm / 2.54cm" (운영 메시지용)
  function _mmCmStr(mm) {
    var cm = (mm / 10).toFixed(2).replace(/\.?0+$/, "");
    return mm + "mm / " + cm + "cm";
  }

  function _drawProductionHeader(options, photoCount, headerRightText, sheetNo, sheetTotal) {
    // 템플릿의 info > header > header_right TextFrame 에 폰트·사이즈·정렬이 미리 잡혀 있다.
    // 값만 contents 로 교체. 새 TextFrame 만들지 않음.
    var sizeToken = options.isPackage
      ? "Package"
      : (options.isAllSizes
      ? "All sizes 0.75-2.5\""
      : _inchStr(options.sizeMm) + " / " + (SIZE_MM_LABEL[options.sizeMm] || Math.round(options.sizeMm)) + "mm");

    var orderNum = options.orderNumber ? options.orderNumber : "—";
    var line1 = _nfcHangul(options.nameText) + " • " + sizeToken + " • " + options.material;
    var line2 = photoCount + " design(s)";
    // 다중 시트일 때만 표기 — 1장짜리 주문의 헤더는 기존과 글자 하나까지 동일하게 유지.
    if (sheetTotal && sheetTotal > 1) {
      line2 += " • sheet " + sheetNo + "/" + sheetTotal;
    }
    var line3 = "Order: " + orderNum + " | date: " + options.orderDate;

    headerRightText.contents = line1 + "\r" + line2 + "\r" + line3;
    _applyHangulFontOverride(headerRightText, _resolveHangulFont());
  }

  // macOS Finder/paste 로 들어온 NFD 자모를 NFC 음절로 합성. ES3 의 String.normalize 부재 대체.
  // L(초성) U+1100-1112 + V(중성) U+1161-1175 [+ T(종성) U+11A8-11C2] → S(음절) U+AC00-D7A3.
  function _nfcHangul(s) {
    if (!s) return s;
    var out = "";
    var i = 0;
    while (i < s.length) {
      var L = s.charCodeAt(i);
      if (L >= 0x1100 && L <= 0x1112 && i + 1 < s.length) {
        var V = s.charCodeAt(i + 1);
        if (V >= 0x1161 && V <= 0x1175) {
          var Tidx = 0;
          var step = 2;
          if (i + 2 < s.length) {
            var T = s.charCodeAt(i + 2);
            if (T >= 0x11A8 && T <= 0x11C2) { Tidx = T - 0x11A7; step = 3; }
          }
          out += String.fromCharCode(0xAC00 + ((L - 0x1100) * 21 + (V - 0x1161)) * 28 + Tidx);
          i += step;
          continue;
        }
      }
      out += s.charAt(i);
      i++;
    }
    return out;
  }

  function _resolveHangulFont() {
    // "TTOmniGothicL" = 210 옴니고딕 020 의 PostScript 이름 (Adobe Fonts). 010=TTOmniGothicT, 040=TTOmniGothicB.
    var candidates = ["TTOmniGothicL", "AppleSDGothicNeo-Bold", "AppleSDGothicNeo-SemiBold", "AppleGothic"];
    for (var i = 0; i < candidates.length; i++) {
      try { return app.textFonts.getByName(candidates[i]); } catch (eFont) {}
    }
    return null;
  }

  function _applyHangulFontOverride(textFrame, hangulFont) {
    if (!hangulFont) return;
    var s = textFrame.contents;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      // Hangul Syllables AC00–D7AF, Jamo 1100–11FF, Compatibility Jamo 3130–318F
      if ((c >= 0xAC00 && c <= 0xD7AF) || (c >= 0x1100 && c <= 0x11FF) || (c >= 0x3130 && c <= 0x318F)) {
        try { textFrame.textRange.characters[i].textFont = hangulFont; } catch (eChar) {}
      }
    }
  }


  // ═════════════════════════════════════════════════════════
  //  CUTLINE TRACE CACHE + ART MASTER CACHE
  //  같은 sil.png 는 시트당 1회만 Image Trace, 같은 _clean.psd 는 시트당 1회만 embed.
  //  cutline 과 embed master 를 sheet doc 의 hidden TraceStash 레이어에 저장하고
  //  placement 마다 duplicate() 로 복제한다 (반복 배치에서 place+embed 비용 제거).
  // ═════════════════════════════════════════════════════════

  function _uniquePairsFromPlaced(placedItems) {
    var seen = {};
    var unique = [];
    for (var i = 0; i < placedItems.length; i++) {
      var pl = placedItems[i];
      if (!pl || !pl.payload) continue;
      // 이름 블록은 사진 페어가 아니다 (.sil/.psd 없음) — trace 대상에서 뺀다.
      // 안 빼면 _buildCutlineCache 가 undefined 를 trace 하려다 "File/Folder expected"
      // 로 실패해 완료 메시지에 가짜 trace 실패가 뜬다 (2026-08-23 실측).
      if (pl.payload.isLetterBlock) continue;
      var key = pl.payload.base;
      if (seen[key]) continue;
      seen[key] = true;
      unique.push(pl.payload);
    }
    return unique;
  }

  function _ensureTraceStashLayer(sheetDoc) {
    for (var i = 0; i < sheetDoc.layers.length; i++) {
      if (sheetDoc.layers[i].name === "TraceStash") {
        sheetDoc.layers[i].visible = true;
        sheetDoc.layers[i].locked = false;
        return sheetDoc.layers[i];
      }
    }
    var layer = sheetDoc.layers.add();
    layer.name = "TraceStash";
    layer.visible = true;
    layer.locked = false;
    return layer;
  }

  function _cleanupTraceStash(sheetDoc) {
    for (var i = sheetDoc.layers.length - 1; i >= 0; i--) {
      if (sheetDoc.layers[i].name === "TraceStash") {
        try { sheetDoc.layers[i].locked = false; } catch (eLock) {}
        try { sheetDoc.layers[i].visible = true; } catch (eVis) {}
        try { sheetDoc.layers[i].remove(); } catch (eRm) {}
      }
    }
  }


  // ══ 칼선 디스크 캐시 ═══════════════════════════════════════════════
  // 트레이스 결과(패스 좌표)를 텍스트로 저장/복원한다. 문서를 열지 않고 좌표만 다루므로
  // app.copy()/paste() 클립보드 경로도 타지 않는다 — 재실행에서 트레이스가 통째로 사라진다.
  // 포맷 (한 줄 = 한 항목):
  //   EVCUT1
  //   sig=<트레이스 파라미터 서명>
  //   src=<_sil.png 바이트수>,<수정시각 ms>
  //   info=<relL>,<relT>,<relW>,<relH>
  //   S=<closed 0|1>|<ax,ay,lx,ly,rx,ry,corner;...>     (subpath 마다 한 줄)

  // 트레이스 파라미터 서명 — TRACE_OPTS 가 바뀌면 문자열이 바뀌어 전 캐시가 무효화된다.
  function _traceSignature() {
    var keys = ["threshold", "pathFidelity", "cornerFidelity", "minimumArea", "cornerAngle",
                "ignoreWhite", "snapCurveToLines"];
    var parts = [];
    for (var i = 0; i < keys.length; i++) parts.push(keys[i] + ":" + TRACE_OPTS[keys[i]]);
    return parts.join(",");
  }

  // 캐시 파일 위치 — _sil.png 의 absoluteURI 에서 파생한다. fsName(디코드)과 name(URI 인코드)을
  // 섞으면 한글 경로에서 깨지므로 URI 한 종류만 쓴다.
  function _cutCacheFileFor(pair) {
    var uri = pair.sil.absoluteURI;
    var slash = uri.lastIndexOf("/");
    if (slash < 0) return null;
    var dir = uri.substring(0, slash);
    var fname = uri.substring(slash + 1).replace(/_sil\.png$/i, ".evcut");
    return new File(dir + "/" + CUT_CACHE_DIRNAME + "/" + fname);
  }

  function _cutCacheFingerprint(pair) {
    var size = -1, mtime = -1;
    try { size = pair.sil.length; } catch (eSz) {}
    // **초 단위로 절삭.** ExtendScript File.modified 는 초 정밀도라 ms 자리가 0 인데, 다른
    // 런타임·Illustrator 버전이 ms 를 채우면 같은 파일인데도 지문이 어긋나 캐시가 영영 미스한다.
    // 초로 고정하면 정밀도와 무관해진다. 같은 1초 안에 크기까지 동일하게 재저장되는 경우만
    // 잘못 히트하는데, Phase A 내보내기가 1초 이상 걸리고 크기까지 같을 확률은 무시할 수준.
    try { mtime = Math.floor(pair.sil.modified.getTime() / 1000); } catch (eMt) {}
    return size + "," + mtime;
  }

  // PathItem / CompoundPathItem 을 subpath 배열로. Live Pathfinder Add 결과가 둘 중 하나다.
  function _subpathsOf(item) {
    if (item.typename === "CompoundPathItem") {
      var out = [];
      for (var i = 0; i < item.pathItems.length; i++) out.push(item.pathItems[i]);
      return out;
    }
    return [item];
  }

  function _writeCutCache(pair, item, cutInfo) {
    var f = _cutCacheFileFor(pair);
    if (!f) return false;
    try {
      var dir = f.parent;
      if (!dir.exists) dir.create();
      var subs = _subpathsOf(item);
      var lines = [CUT_CACHE_FORMAT,
                   "sig=" + _traceSignature(),
                   "src=" + _cutCacheFingerprint(pair),
                   "info=" + cutInfo.relL + "," + cutInfo.relT + "," + cutInfo.relW + "," + cutInfo.relH];
      for (var s = 0; s < subs.length; s++) {
        var pts = subs[s].pathPoints;
        var chunk = [];
        for (var p = 0; p < pts.length; p++) {
          var pp = pts[p];
          var isCorner = (pp.pointType === PointType.CORNER) ? 1 : 0;
          chunk.push(pp.anchor[0].toFixed(4) + "," + pp.anchor[1].toFixed(4) + "," +
                     pp.leftDirection[0].toFixed(4) + "," + pp.leftDirection[1].toFixed(4) + "," +
                     pp.rightDirection[0].toFixed(4) + "," + pp.rightDirection[1].toFixed(4) + "," +
                     isCorner);
        }
        lines.push("S=" + (subs[s].closed ? 1 : 0) + "|" + chunk.join(";"));
      }
      f.encoding = "UTF-8";
      // ExtendScript File 은 기본적으로 플랫폼 관례로 줄바꿈을 **번역**한다 — macOS 에서 \n 을
      // 써도 파일에는 \r(0x0D) 이 들어가, split("\n") 으로 읽는 쪽과 어긋나 캐시가 절대
      // 히트하지 않았다(2026-08-22 실측: LF 0개 / CR 4개). Unix 로 고정한다.
      f.lineFeed = "Unix";
      if (!f.open("w")) return false;
      f.write(lines.join("\n"));
      f.close();
      return true;
    } catch (eW) {
      try { f.close(); } catch (eC) {}
      return false;
    }
  }

  // 반환: { cutInfo, subs:[{closed, pts:[[ax,ay,lx,ly,rx,ry,corner],...]}] } 또는 null.
  // 서명/지문 불일치, 포맷 오류, 읽기 실패는 전부 null → 호출부가 트레이스로 폴백한다.
  function _readCutCache(pair) {
    var f = _cutCacheFileFor(pair);
    if (!f || !f.exists) return null;
    var text = null;
    try {
      f.encoding = "UTF-8";
      if (!f.open("r")) return null;
      text = f.read();
      f.close();
    } catch (eR) {
      try { f.close(); } catch (eC) {}
      return null;
    }
    if (!text) return null;
    // CR / LF / CRLF 전부 허용 — 위 lineFeed 고정 이전에 CR 로 쓰인 캐시 파일도 그대로 읽는다.
    var lines = text.split(/\r\n|\r|\n/);
    if (lines[0] !== CUT_CACHE_FORMAT) return null;

    var sig = null, src = null, info = null, subs = [];
    for (var i = 1; i < lines.length; i++) {
      var ln = lines[i];
      if (ln.substring(0, 4) === "sig=") { sig = ln.substring(4); continue; }
      if (ln.substring(0, 4) === "src=") { src = ln.substring(4); continue; }
      if (ln.substring(0, 5) === "info=") { info = ln.substring(5); continue; }
      if (ln.substring(0, 2) === "S=") {
        var bar = ln.indexOf("|");
        if (bar < 0) return null;
        var closed = (ln.substring(2, bar) === "1");
        var raw = ln.substring(bar + 1);
        if (raw.length === 0) return null;
        var chunks = raw.split(";");
        var pts = [];
        for (var c = 0; c < chunks.length; c++) {
          var n = chunks[c].split(",");
          if (n.length !== 7) return null;
          pts.push([parseFloat(n[0]), parseFloat(n[1]), parseFloat(n[2]), parseFloat(n[3]),
                    parseFloat(n[4]), parseFloat(n[5]), n[6] === "1"]);
        }
        subs.push({ closed: closed, pts: pts });
      }
    }
    if (sig !== _traceSignature()) return null;          // 트레이스 파라미터가 바뀜
    if (src !== _cutCacheFingerprint(pair)) return null; // 사진이 바뀜
    if (!info || subs.length === 0) return null;
    var iv = info.split(",");
    if (iv.length !== 4) return null;
    return {
      cutInfo: { relL: parseFloat(iv[0]), relT: parseFloat(iv[1]),
                 relW: parseFloat(iv[2]), relH: parseFloat(iv[3]) },
      subs: subs
    };
  }

  // 좌표에서 패스를 다시 만든다. subpath 2개 이상이면 CompoundPathItem (구멍 보존).
  function _rebuildCutline(layer, data) {
    var host, made;
    if (data.subs.length > 1) {
      host = layer.compoundPathItems.add();
      made = host;
    } else {
      host = null;
      made = null;
    }
    for (var s = 0; s < data.subs.length; s++) {
      var sub = data.subs[s];
      var path = host ? host.pathItems.add() : layer.pathItems.add();
      if (!made) made = path;
      for (var p = 0; p < sub.pts.length; p++) {
        var v = sub.pts[p];
        var pp = path.pathPoints.add();
        pp.anchor = [v[0], v[1]];
        pp.leftDirection = [v[2], v[3]];
        pp.rightDirection = [v[4], v[5]];
        pp.pointType = v[6] ? PointType.CORNER : PointType.SMOOTH;
      }
      path.closed = sub.closed;
    }
    return made;
  }

  function _buildCutlineCache(sheetDoc, uniquePairs, cutSpot) {
    var failures = [];
    if (!uniquePairs || uniquePairs.length === 0) return failures;

    var stash = _ensureTraceStashLayer(sheetDoc);

    for (var i = 0; i < uniquePairs.length; i++) {
      var pair = uniquePairs[i];
      if (pair.cachedCutline && pair.cutInfo) continue;

      // ── 디스크 캐시 히트: 트레이스·임시문서·클립보드를 전부 건너뛴다 ──
      // 실패(파일 없음/서명 불일치/포맷 오류/재구성 예외)는 전부 조용히 트레이스로 폴백한다.
      // 캐시는 순수 가속이므로 캐시 문제로 시트 제작이 멈추면 안 된다.
      var hit = null;
      try { hit = _readCutCache(pair); } catch (eRC) { hit = null; }
      if (hit) {
        try {
          app.activeDocument = sheetDoc;
          sheetDoc.activeLayer = stash;
          var rebuilt = _rebuildCutline(stash, hit);
          _stripFills(rebuilt);
          _forceCutContourStroke(rebuilt, cutSpot);
          try { rebuilt.hidden = true; } catch (eHid) {}
          pair.cachedCutline = rebuilt;
          pair.cutInfo = hit.cutInfo;
          pair.cutCacheHit = true;
          sheetDoc.selection = null;
          continue;
        } catch (eReb) {
          try { sheetDoc.selection = null; } catch (eS2) {}
          pair.cachedCutline = null;
          pair.cutInfo = null;
        }
      }

      var tempDoc = null;
      var copied = false;
      var localCutInfo = null;
      try {
        tempDoc = _newDocForImage();
        _traceAndUnite(tempDoc, pair.sil);

        var ar = tempDoc.artboards[0].artboardRect;
        var pngW = ar[2] - ar[0];
        var pngH = ar[1] - ar[3];

        var cutline = _findCutline(tempDoc);
        if (!cutline) {
          throw new Error("trace 결과 path 없음");
        }

        _stripFills(cutline);
        var tempCutSpot = _ensureCutContour(tempDoc);
        _forceCutContourStroke(cutline, tempCutSpot);

        var b = cutline.geometricBounds;
        localCutInfo = {
          relL: b[0] / pngW,
          relT: (pngH - b[1]) / pngH,
          relW: (b[2] - b[0]) / pngW,
          relH: (b[1] - b[3]) / pngH
        };

        tempDoc.selection = null;
        cutline.selected = true;
        app.copy();
        copied = true;
      } catch (eTrace) {
        failures.push({
          base: pair.base,
          error: (eTrace && eTrace.message) ? eTrace.message : String(eTrace)
        });
      } finally {
        if (tempDoc) {
          try { tempDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
        }
        _safeRedrawAndGC();
      }

      if (!copied || !localCutInfo) continue;

      try {
        app.activeDocument = sheetDoc;
        sheetDoc.activeLayer = stash;
        sheetDoc.selection = null;
        app.paste();

        var pasted = sheetDoc.selection;
        if (!pasted || pasted.length === 0) {
          throw new Error("paste 결과 비어있음");
        }
        var cached = pasted[0];
        try { cached.hidden = true; } catch (eHide) {}
        _forceCutContourStroke(cached, cutSpot);

        pair.cachedCutline = cached;
        pair.cutInfo = localCutInfo;
        pair.cutCacheHit = false;
        // 저장 실패는 무시 — 다음 실행이 다시 트레이스할 뿐 이번 시트에는 영향 없다.
        try { _writeCutCache(pair, cached, localCutInfo); } catch (eWC) {}
        sheetDoc.selection = null;
      } catch (ePaste) {
        failures.push({
          base: pair.base,
          error: "cache stash 실패: " + ((ePaste && ePaste.message) ? ePaste.message : String(ePaste))
        });
      }
    }

    return failures;
  }


  // ═════════════════════════════════════════════════════════
  //  PHOTO STICKER PLACEMENT
  // ═════════════════════════════════════════════════════════

  // 아트 마스터 — 같은 PSD 는 시트당 1회만 place+embed 하고 TraceStash 에 hidden 보관.
  // 이후 배치는 master.duplicate → 셀 크기 resize/position (배치당 place+embed 비용 제거).
  // 마스터는 비회전 원본 그대로 유지 — 회전은 항상 복제본에만 적용돼 source 일관.
  function _ensureArtMaster(sheetDoc, pair) {
    if (pair.cachedArtGroup) return pair.cachedArtGroup;
    var stash = _ensureTraceStashLayer(sheetDoc);
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = stash;
    var placed = stash.placedItems.add();
    placed.file = pair.psd;
    var mL = placed.left, mT = placed.top, mW = placed.width, mH = placed.height;
    placed.embed();
    var master = _stripEmbeddedPSDPathsNear(stash, mL, mT, mW, mH);
    if (!master) {
      throw new Error("embed master 그룹을 찾지 못함 (" + pair.base + ")");
    }
    // 심볼 정의 1개 = 래스터 1개. 배치는 인스턴스로 만들어 래스터 사본을 남기지 않는다.
    // Illustrator 네이티브 AI 데이터는 duplicate() 한 배치마다 래스터를 통째로 복사한다 —
    // 113개 시트 실측에서 네이티브 크기가 배치 수에 비례(변동계수 0.45, 디자인 수는 1.44)했고,
    // "디자인 1개 × 배치 43개 = 154MB" 시트가 그 극단이었다 (2026-08-22).
    // 심볼 정의는 레이어가 아니라 **문서 자산**이라 _cleanupTraceStash 의 레이어 삭제와 무관하게 남는다.
    // 실패 시 pair.cachedSymbol 이 null 로 남고 배치가 구 duplicate 경로로 폴백 + 완료 메시지에 보고.
    try {
      pair.cachedSymbol = sheetDoc.symbols.add(master);
    } catch (eSym) {
      pair.cachedSymbol = null;
      pair.symbolError = (eSym && eSym.message) ? eSym.message : String(eSym);
    }
    try { master.hidden = true; } catch (eHide) {}
    pair.cachedArtGroup = master;
    return master;
  }

  function _placePhotoSticker(sheetDoc, pair, x, y, cellWPt, cellHPt, cutMarginPt, printLayer, kissLayer, cutSpot, rotated) {
    try { sheetDoc.selection = null; } catch (eSel) {}

    var artX = x + cutMarginPt;
    var artY = y - cutMarginPt;
    var artW = cellWPt - 2 * cutMarginPt;
    var artH = cellHPt - 2 * cutMarginPt;
    if (artW <= 0 || artH <= 0) {
      throw new Error("칼선 여백이 스티커 크기보다 큽니다");
    }

    if (!pair.cachedCutline || !pair.cutInfo) {
      throw new Error("cutline cache 없음 (" + pair.base + ")");
    }

    var master = _ensureArtMaster(sheetDoc, pair);

    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printLayer;
    // rotated 면 90° 후 셀을 채우도록 swap 박스(artH×artW)에 맞춰 사이즈. 중심 기준 배치는
    // 비회전일 때 기존 식과 수치 동일(artX+(artW-w)/2 == ccx-w/2) — 비회전 경로 무변경.
    var fitW = rotated ? artH : artW;
    var fitH = rotated ? artW : artH;
    // 심볼 인스턴스는 래스터를 참조만 한다. 심볼 생성이 실패한 디자인만 구 duplicate 경로로.
    // 이후 기하 코드(resize/left/top/transform)는 SymbolItem 도 PageItem 이라 그대로 동작한다.
    var embG;
    if (pair.cachedSymbol) {
      embG = printLayer.symbolItems.add(pair.cachedSymbol);
    } else {
      embG = master.duplicate(printLayer, ElementPlacement.PLACEATBEGINNING);
    }
    try { embG.hidden = false; } catch (eShow0) {}
    var gb = embG.geometricBounds;
    var gw = gb[2] - gb[0];
    var gh = gb[1] - gb[3];
    var ratio = Math.min(fitW / gw, fitH / gh);
    embG.resize(ratio * 100, ratio * 100);
    gb = embG.geometricBounds;   // resize 후 실측 (반올림 오차 방지)
    var psdW = gb[2] - gb[0];
    var psdH = gb[1] - gb[3];
    var ccx = artX + artW / 2;
    var ccy = artY - artH / 2;
    embG.left = ccx - psdW / 2;
    embG.top = ccy + psdH / 2;
    var psdL = embG.left;
    var psdT = embG.top;

    var cutInfo = pair.cutInfo;
    sheetDoc.activeLayer = kissLayer;
    var dup = pair.cachedCutline.duplicate(kissLayer, ElementPlacement.PLACEATBEGINNING);
    try { dup.hidden = false; } catch (eShow) {}

    var freshCutSpot = _ensureCutContour(sheetDoc);

    var targetW = cutInfo.relW * psdW;
    var targetH = cutInfo.relH * psdH;
    var nb = dup.geometricBounds;
    var nw = nb[2] - nb[0];
    var nh = nb[1] - nb[3];
    if (nw > 0 && nh > 0) {
      dup.resize((targetW / nw) * 100, (targetH / nh) * 100);
    }
    dup.left = psdL + cutInfo.relL * psdW;
    dup.top = psdT - cutInfo.relT * psdH;
    _forceCutContourStroke(dup, freshCutSpot);

    // 회전 — master.duplicate 가 그룹 핸들(embG)을 직접 주므로 구 bounds-scan 탐색·null 폴백 불필요.
    if (rotated) {
      // 정합 불변식: PSD 그룹과 칼선 dup 에 *동일* 매트릭스 적용 → 피벗이 다소 어긋나도
      // 둘이 같이 이동해 컷-사진 락 보장(최악도 셀 내 위치 오차, 컷 불일치는 구조적으로 불가).
      // transform 실패 시 예외를 삼키지 않음 → main 루프가 failedItems 로 가시화(조용한 desync 방지).
      var rmat = app.concatenateMatrix(
        app.concatenateMatrix(app.getTranslationMatrix(-ccx, -ccy), app.getRotationMatrix(90)),
        app.getTranslationMatrix(ccx, ccy)
      );
      embG.transform(rmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
      dup.transform(rmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
    }

    sheetDoc.selection = null;
    // redraw 는 main 이 배치 루프 종료 후 1회만 — 배치당 app.redraw() 는 비용만 큼. GC 는 유지(메모리 안정).
    try { $.gc(); } catch (eGc) {}
  }

  function _traceAndUnite(doc, silFile) {
    var placed = doc.layers[0].placedItems.add();
    placed.file = silFile;
    placed.left = 0;
    placed.top = placed.height;

    doc.artboards[0].artboardRect = [0, placed.height, placed.width, 0];

    var trace = placed.trace();
    var opts = trace.tracing.tracingOptions;
    try { opts.loadFromPreset("Silhouettes"); } catch (ePreset) {}

    opts.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE;
    opts.tracingMethod = TracingMethodType.TRACINGMETHODABUTTING;
    // 값은 TRACE_OPTS 단일 출처 — 칼선 캐시 서명이 여기서 파생되므로 인라인 숫자로 되돌리지 말 것.
    opts.threshold = TRACE_OPTS.threshold;
    opts.pathFidelity = TRACE_OPTS.pathFidelity;
    opts.cornerFidelity = TRACE_OPTS.cornerFidelity;
    opts.minimumArea = TRACE_OPTS.minimumArea;
    opts.cornerAngle = TRACE_OPTS.cornerAngle;
    opts.fills = true;
    opts.strokes = false;
    opts.snapCurveToLines = TRACE_OPTS.snapCurveToLines;
    opts.ignoreWhite = TRACE_OPTS.ignoreWhite;

    trace.tracing.expandTracing();

    app.executeMenuCommand("deselectall");
    app.executeMenuCommand("selectall");
    app.executeMenuCommand("ungroup");
    app.executeMenuCommand("selectall");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");

    var sel = doc.selection;
    if (sel && sel.length > 0) {
      try { sel[0].name = "Cutline"; } catch (eName) {}
    }

    doc.layers[0].name = "KissCut";
    app.executeMenuCommand("deselectall");
  }


  // ═════════════════════════════════════════════════════════
  //  DOCUMENT / FILE HELPERS
  // ═════════════════════════════════════════════════════════

  function _resolveTemplate() {
    var scriptDir = (new File($.fileName)).parent;
    var candidates = [
      scriptDir.fsName + "/templates/template_cutout_v2.ait",
      scriptDir.parent.fsName + "/templates/template_cutout_v2.ait"
    ];
    for (var i = 0; i < candidates.length; i++) {
      var f = new File(candidates[i]);
      if (f.exists) return f;
    }
    return File.openDialog("template_cutout_v2.ait 위치 선택", "*.ait");
  }

  function _openTemplateDoc(templateFile) {
    var doc = app.open(templateFile);
    try {
      var rfx = doc.rasterEffectSettings;
      rfx.colorModel = RasterizationColorModel.DEFAULTCOLORMODEL;
      rfx.resolution = 300;
    } catch (e) {}
    return doc;
  }

  function _findInfoPath(doc, pathName) {
    var infoLayer = null;
    for (var i = 0; i < doc.layers.length; i++) {
      if (doc.layers[i].name.toLowerCase() === "info") {
        infoLayer = doc.layers[i];
        break;
      }
    }
    if (!infoLayer) throw new Error("템플릿에 'info' 레이어가 없습니다");
    var item = _deepFindByName(infoLayer, pathName);
    if (!item) throw new Error("info 레이어 안에 '" + pathName + "'가 없습니다");
    return item;
  }

  function _newDocForImage() {
    var preset = new DocumentPreset();
    preset.width = 1000;
    preset.height = 1000;
    preset.colorMode = DocumentColorSpace.RGB;
    preset.units = RulerUnits.Millimeters;
    return app.documents.addDocument("Art & Illustration", preset);
  }

  function _collectPairs(folder) {
    var pngFiles = folder.getFiles(function (f) {
      return f instanceof File && /_sil\.png$/i.test(f.name);
    });

    pngFiles.sort(function (a, b) {
      return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
    });

    var pairs = [];
    for (var i = 0; i < pngFiles.length; i++) {
      // pngFiles[i].name 은 ExtendScript 가 URL-encoded 로 반환 (macOS NFD 한글 포함).
      // PSD 매칭은 같은 raw 형태로 (filesystem 매칭 보장), base 만 decodeURI 로 사람용 표시.
      var pngName = pngFiles[i].name;
      var psdName = pngName.replace(/_sil\.png$/i, "_clean.psd");
      var psdFile = new File(folder.fsName + "/" + psdName);
      if (psdFile.exists) {
        // 접미사 제거 후 끝의 _TIER 토큰 파싱 → pair.tier. base 는 tier 포함 (운영자가 listbox 에서 사이즈 확인).
        // psdName 은 raw pngName 치환이라 토큰이 양쪽에 대칭 보존 → 페어링 무영향.
        var nameNoSuffix = pngName.replace(/_sil\.png$/i, "");
        // 3버킷 토큰(_BIG/_MED/_SML) 우선, 없으면 레거시 6티어 토큰. 두 정규식은 서로 매칭되지
        // 않는다 (_SML 은 TIER_TOKEN_RE 의 어떤 대안으로도 끝까지 소비되지 않음) → 충돌 없음.
        var bucketMatch = nameNoSuffix.match(BUCKET_TOKEN_RE);
        var tierMatch = nameNoSuffix.match(TIER_TOKEN_RE);
        var bucket, tier;
        if (bucketMatch) {
          bucket = bucketMatch[1].toUpperCase();
          // Package 는 배분층이 인치를 덮어쓴다. 이 값은 다른 모드·표시용 폴백일 뿐.
          tier = BUCKET_TIERS[bucket][0];
        } else if (tierMatch) {
          tier = tierMatch[1].toUpperCase();
          if (tier === "FAM") tier = "XXL";
          bucket = TIER_TO_BUCKET[tier];
        } else {
          tier = TIER_DEFAULT;
          bucket = TIER_TO_BUCKET[TIER_DEFAULT];
        }
        pairs.push({
          psd: psdFile,
          sil: pngFiles[i],
          base: _decodeName(nameNoSuffix),
          tier: tier,
          bucket: bucket
        });
      }
    }
    return pairs;
  }

  function _decodeName(s) {
    try { return decodeURI(s); } catch (e) { return s; }
  }

  // 종횡비 — PNG IHDR 직독 (시그니처 8B + length 4B + "IHDR" 4B + width/height 각 4B big-endian).
  // 디자인당 임시문서 1개를 열던 비용 제거. 직독 실패(비표준 파일 등) 시에만 임시문서 방식 폴백.
  function _pngAspect(silFile) {
    var f = new File(silFile.absoluteURI);
    try {
      f.encoding = "BINARY";
      if (!f.open("r")) return 0;
      var head = f.read(24);
      f.close();
      if (!head || head.length < 24) return 0;
      function B(i) { return head.charCodeAt(i) & 0xFF; }
      if (B(0) !== 0x89 || B(1) !== 0x50 || B(2) !== 0x4E || B(3) !== 0x47) return 0;
      if (head.substring(12, 16) !== "IHDR") return 0;
      var w = B(16) * 16777216 + B(17) * 65536 + B(18) * 256 + B(19);
      var h = B(20) * 16777216 + B(21) * 65536 + B(22) * 256 + B(23);
      if (w <= 0 || h <= 0) return 0;
      return w / h;
    } catch (e) {
      try { f.close(); } catch (e2) {}
      return 0;
    }
  }

  function _measurePairAspect(pair) {
    if (pair.aspect) return pair.aspect;
    var a = _pngAspect(pair.sil);
    if (a > 0) { pair.aspect = a; return a; }
    var doc = _newDocForImage();
    try {
      var p = doc.layers[0].placedItems.add();
      p.file = pair.sil;
      pair.aspect = p.width / p.height;
    } finally {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (e) {}
    }
    return pair.aspect;
  }

  function _deriveDefaultCustomerName(folder) {
    if (!folder) return "";
    try {
      var name = decodeURIComponent(folder.name);
      if (name === "02_cutout" && folder.parent) {
        return decodeURIComponent(folder.parent.name);
      }
      return name;
    } catch (e) {
      return "";
    }
  }

  // ═════════════════════════════════════════════════════════
  //  ORDER MANIFEST (_order.json) → 다이얼로그 프리필
  // ═════════════════════════════════════════════════════════

  // 02_cutout 을 골라도, 프로젝트 폴더를 골라도 찾히게 두 단계만 본다.
  function _orderManifestFile(folder) {
    if (!folder) return null;
    var here = new File(folder.fsName + "/" + ORDER_MANIFEST_NAME);
    if (here.exists) return here;
    if (folder.parent) {
      var up = new File(folder.parent.fsName + "/" + ORDER_MANIFEST_NAME);
      if (up.exists) return up;
    }
    return null;
  }

  function _readOrderManifest(folder) {
    var f = _orderManifestFile(folder);
    if (!f) return null;
    var text = null;
    try {
      f.encoding = "UTF-8";
      if (!f.open("r")) return null;
      text = f.read();
      f.close();
    } catch (eOmRead) {
      try { f.close(); } catch (eOmClose) {}
      return null;
    }
    if (!text) return null;
    // ExtendScript 에는 JSON 객체가 없다. 이 파일은 intake.py 가 json.dump 로 쓴 우리 파일이고
    // JSON 은 객체 리터럴의 부분집합이라 eval 로 읽는다. 깨졌으면 null → 전부 수동 입력 폴백.
    try {
      return eval("(" + text + ")");
    } catch (eOmParse) {
      return null;
    }
  }

  // "_Photos-2" → "photos". intake.py 의 split_key 와 같은 정규화 (앞 `_`, 뒤 `-N` 제거).
  function _normalizeOptionKey(rawKey) {
    var k = String(rawKey || "");
    if (k.charAt(0) === "_") k = k.substring(1);
    k = k.replace(/-\d+$/, "");
    return _trim(k).toLowerCase();
  }

  function _materialFromSku(sku) {
    if (!sku) return null;
    var m = String(sku).match(SKU_MATERIAL_RE);
    return m ? (SKU_MATERIAL[m[1].toUpperCase()] || null) : null;
  }

  // SKU → { sizeMm, packageSheets }. Package 는 PACKAGE_SIZE_VALUE + 시트 수, Mixed 는
  // 전 사이즈 모드. 모르는 SKU 는 null 을 돌려주고 호출부가 그 칸을 비워둔다.
  function _sizeFromSku(sku) {
    if (!sku) return null;
    var s = String(sku);
    var pkg = s.match(SKU_PACKAGE_RE);
    if (pkg) {
      return {
        sizeMm: PACKAGE_SIZE_VALUE,
        packageSheets: PACKAGE_SHEETS_BY_KIND[pkg[1].toUpperCase()] || null
      };
    }
    var m = s.match(SKU_SIZE_RE);
    if (!m) return null;
    var code = m[1].toUpperCase();
    if (code === "MIX") return { sizeMm: ALLSIZES_SIZE_VALUE, packageSheets: null };
    var mm = SKU_SIZE_MM[code];
    return mm ? { sizeMm: mm, packageSheets: null } : null;
  }

  // SKU 없는 초기 주문 폴백 — 같은 line item 의 옵션 라벨에서 mm 을 읽는다.
  function _sizeFromOptions(optionRows, lineItemIndex) {
    for (var i = 0; i < optionRows.length; i++) {
      if (optionRows[i].line_item !== lineItemIndex) continue;
      var m = String(optionRows[i].key || "").match(OPTION_MM_RE);
      if (!m) continue;
      var mm = SKU_SIZE_MM[m[1]];
      if (mm) return { sizeMm: mm, packageSheets: null };
    }
    return null;
  }

  // 폴더명 `{고객} {주문번호}` 분리. 인테이크가 만든 폴더는 주문번호가 뒤에 붙어 있어서
  // 폴더명을 그대로 쓰면 헤더 이름 칸에 `Naekyung Seong EVS-1007` 이 들어갔다.
  function _splitFolderCustomerOrder(folderName) {
    var n = _trim(folderName || "");
    var m = n.match(FOLDER_ORDER_RE);
    if (!m) return { customerName: n, orderNumber: "" };
    return { customerName: _trim(n.substring(0, n.length - m[0].length)), orderNumber: m[1] };
  }

  function _pushUnique(arr, v) {
    for (var i = 0; i < arr.length; i++) { if (arr[i] === v) return; }
    arr.push(v);
  }

  // 값이 목록에 있으면 그 index, 없거나 null 이면 fallback. 드롭다운 프리필용.
  function _indexOfValue(arr, v, fallback) {
    if (v === null || v === undefined) return fallback;
    for (var i = 0; i < arr.length; i++) { if (arr[i] === v) return i; }
    return fallback;
  }

  // 매니페스트 → 다이얼로그 프리필. **순수 함수** (sim/ordertest.js 가 이걸 그대로 호출한다).
  // 한 값으로 안 좁혀지면 채우지 않고 notes 에 이유를 남긴다.
  function _orderDefaultsFrom(manifest, folderName) {
    var fromFolder = _splitFolderCustomerOrder(folderName);
    var out = {
      customerName: fromFolder.customerName,
      orderNumber: fromFolder.orderNumber,
      stickerName: "",
      material: null,
      sizeMm: null,
      packageSheets: null,
      productTitle: "",
      shipTo: "",
      via: "",
      hasManifest: false,
      notes: []
    };
    if (!manifest || !manifest.order) {
      out.notes.push(ORDER_MANIFEST_NAME + " 없음 — 폴더명에서 이름·주문번호만 추정. 재질·사이즈는 직접 지정");
      return out;
    }
    out.hasManifest = true;

    // intake.py 가 SKU 를 미리 해석해 둔 잡티켓이 있으면 그대로 쓴다 — 해석기를 여러 벌
    // 두면 규칙이 바뀔 때 하나를 빠뜨려 **틀린 재질로 인쇄된다.** 없으면(구 매니페스트)
    // 아래에서 직접 해석한다. `python3 intake.py --backfill-job` 으로 채워 넣을 수 있다.
    if (manifest.job) {
      _applyJobBlock(out, manifest.job);
      _noteGift(out, manifest);
      return out;
    }
    out.via = "sku";

    if (manifest.order.customer) out.customerName = _trim(String(manifest.order.customer));
    if (manifest.order.name) out.orderNumber = _trim(String(manifest.order.name)).replace(/^#/, "");

    // 옵션 `Name` = 스티커에 넣을 이름. 고객 이름과 별개다 (선물이면 받는 사람 이름).
    var optionRows = manifest.options || [];
    for (var oi = 0; oi < optionRows.length; oi++) {
      if (_normalizeOptionKey(optionRows[oi].key) === "name" && optionRows[oi].value) {
        out.stickerName = _trim(String(optionRows[oi].value));
        break;
      }
    }

    var items = manifest.line_items || [];
    var materials = [], sizes = [], sheets = [], titles = [];
    for (var li = 0; li < items.length; li++) {
      if (items[li].title) _pushUnique(titles, String(items[li].title));
      var mat = _materialFromSku(items[li].sku);
      if (mat) _pushUnique(materials, mat);
      var sz = _sizeFromSku(items[li].sku) || _sizeFromOptions(optionRows, items[li].index);
      if (sz) {
        _pushUnique(sizes, sz.sizeMm);
        if (sz.packageSheets) _pushUnique(sheets, sz.packageSheets);
      }
    }
    out.productTitle = titles.join(" + ");

    if (materials.length === 1) out.material = materials[0];
    else if (materials.length === 0) out.notes.push("재질: SKU 에서 못 읽음 — 직접 선택");
    else out.notes.push("재질: line item 마다 다름 (" + materials.join(" / ") + ") — 직접 선택");

    if (sizes.length === 1) {
      out.sizeMm = sizes[0];
      if (sheets.length === 1) out.packageSheets = sheets[0];
    } else if (sizes.length === 0) {
      out.notes.push("사이즈: SKU 에서 못 읽음 — 직접 선택");
    } else {
      out.notes.push("사이즈: line item 마다 다름 — 직접 선택 (주문을 나눠 제작할 것)");
    }
    _noteGift(out, manifest);
    return out;
  }

  // intake.py 의 job 블록 → 다이얼로그 값. 매니페스트는 일러스트 내부 sentinel(-2/-3) 을
  // 몰라야 하므로 mode 문자열("single"/"package"/"all")로 오고, 그 매핑이 여기다.
  function _applyJobBlock(out, job) {
    out.via = "job";
    if (job.order) out.orderNumber = _trim(String(job.order)).replace(/^#/, "");
    if (job.customer) out.customerName = _trim(String(job.customer));
    if (job.sticker_name) out.stickerName = _trim(String(job.sticker_name));
    if (job.product) out.productTitle = String(job.product);
    if (job.material) out.material = String(job.material);
    if (job.mode === "package") {
      out.sizeMm = PACKAGE_SIZE_VALUE;
      if (job.sheets) out.packageSheets = job.sheets;
    } else if (job.mode === "all") {
      out.sizeMm = ALLSIZES_SIZE_VALUE;
    } else if (job.mode === "single" && job.size_mm) {
      out.sizeMm = job.size_mm;
    }
    var notes = job.notes || [];
    for (var ji = 0; ji < notes.length; ji++) out.notes.push(String(notes[ji]));
  }

  // 받는 사람이 주문자와 다르면 **선물이다.** 헤더에 누구 이름을 넣을지가 달라지는데
  // 그건 스크립트가 정할 일이 아니라서, 자동으로 바꾸지 않고 다이얼로그에 띄우기만 한다.
  function _noteGift(out, manifest) {
    var ship = manifest.shipping;
    if (!ship || !ship.name) return;
    var to = _trim(String(ship.name));
    if (to === _trim(out.customerName)) return;
    out.shipTo = to;
    out.notes.push("선물 — 받는 사람 " + to + " (헤더 이름 확인)");
  }

  // 다이얼로그 상단 한 줄. 운영자가 "이 시트가 이 주문이 맞나"를 눈으로 대조하는 용도.
  function _orderSummaryLine(info) {
    if (!info.hasManifest) return ORDER_MANIFEST_NAME + " 없음 — 아래 값을 직접 확인하세요";
    var bits = [];
    if (info.orderNumber) bits.push(info.orderNumber);
    if (info.customerName) bits.push(info.customerName);
    if (info.productTitle) bits.push(info.productTitle);
    if (info.material) bits.push(info.material);
    if (info.sizeMm !== null) bits.push(_sizeLetter(info.sizeMm));
    if (info.packageSheets) bits.push(info.packageSheets + "시트");
    // job 블록이 없어 스크립트가 SKU 를 직접 읽은 경우만 표시 — 매니페스트가 낡았다는 신호다.
    return ORDER_MANIFEST_NAME + " — " + bits.join(" · ") +
           (info.via === "sku" ? "  (job 없음 · SKU 해석)" : "");
  }


  // ═════════════════════════════════════════════════════════
  //  SHARED VECTOR HELPERS
  // ═════════════════════════════════════════════════════════

  function _safeRedrawAndGC() {
    try { app.redraw(); } catch (eRedraw) {}
    try { $.gc(); } catch (eGc) {}
  }

  function _stripPSDPaths(group) {
    if (group.pathItems) {
      for (var i = group.pathItems.length - 1; i >= 0; i--) {
        try {
          if (!group.pathItems[i].clipping) group.pathItems[i].remove();
        } catch (e) {}
      }
    }
    if (group.compoundPathItems) {
      for (var j = group.compoundPathItems.length - 1; j >= 0; j--) {
        try { group.compoundPathItems[j].remove(); } catch (e2) {}
      }
    }
    if (group.groupItems) {
      for (var g = group.groupItems.length - 1; g >= 0; g--) {
        try { _stripPSDPaths(group.groupItems[g]); } catch (e3) {}
      }
    }
  }

  function _stripEmbeddedPSDPathsNear(layer, psdL, psdT, psdW, psdH) {
    try {
      for (var i = 0; i < layer.groupItems.length; i++) {
        var group = layer.groupItems[i];
        var b = group.geometricBounds;
        var w = b[2] - b[0];
        var h = b[1] - b[3];
        if (Math.abs(b[0] - psdL) < 1 &&
            Math.abs(b[1] - psdT) < 1 &&
            Math.abs(w - psdW) < 1 &&
            Math.abs(h - psdH) < 1) {
          _stripPSDPaths(group);
          return group;
        }
      }
    } catch (e) {}
    return null;
  }

  function _stripFills(item) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) _stripFills(item.pageItems[i]);
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) _stripFills(item.pathItems[j]);
        return;
      }
      if (item.typename === "PathItem") item.filled = false;
    } catch (e) {}
  }

  function _findCutline(doc) {
    return _deepFindByName(doc, "Cutline")
        || _deepFindByName(doc, "CutPath")
        || _deepFindFirstPath(doc);
  }

  function _deepFindFirstPath(container) {
    if (container.compoundPathItems && container.compoundPathItems.length > 0) {
      return container.compoundPathItems[0];
    }
    if (container.pathItems && container.pathItems.length > 0) {
      return container.pathItems[0];
    }
    if (container.groupItems) {
      for (var g = 0; g < container.groupItems.length; g++) {
        var found = _deepFindFirstPath(container.groupItems[g]);
        if (found) return found;
      }
    }
    if (container.layers) {
      for (var L = 0; L < container.layers.length; L++) {
        var foundL = _deepFindFirstPath(container.layers[L]);
        if (foundL) return foundL;
      }
    }
    return null;
  }

  function _deepFindByName(container, name) {
    if (container.pathItems) {
      for (var i = 0; i < container.pathItems.length; i++) {
        if (container.pathItems[i].name === name) return container.pathItems[i];
      }
    }
    if (container.compoundPathItems) {
      for (var j = 0; j < container.compoundPathItems.length; j++) {
        if (container.compoundPathItems[j].name === name) return container.compoundPathItems[j];
      }
    }
    if (container.textFrames) {
      for (var t = 0; t < container.textFrames.length; t++) {
        if (container.textFrames[t].name === name) return container.textFrames[t];
      }
    }
    if (container.groupItems) {
      for (var g = 0; g < container.groupItems.length; g++) {
        var found = _deepFindByName(container.groupItems[g], name);
        if (found) return found;
      }
    }
    if (container.layers) {
      for (var L = 0; L < container.layers.length; L++) {
        var foundL = _deepFindByName(container.layers[L], name);
        if (foundL) return foundL;
      }
    }
    return null;
  }

  function _ensureCutContour(doc) {
    var spot;
    try {
      spot = doc.spots.getByName("CutContour");
    } catch (e) {
      spot = doc.spots.add();
      spot.name = "CutContour";
      spot.colorType = ColorModel.SPOT;
      var cmyk = new CMYKColor();
      cmyk.cyan = 0; cmyk.magenta = 100; cmyk.yellow = 0; cmyk.black = 0;
      spot.color = cmyk;
    }
    var sc = new SpotColor();
    sc.spot = spot;
    sc.tint = 100;
    return sc;
  }

  function _forceCutContourStroke(item, cutSpot) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
          _forceCutContourStroke(item.pageItems[i], cutSpot);
        }
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
          _forceCutContourStroke(item.pathItems[j], cutSpot);
        }
        return;
      }
      if (item.typename === "PathItem") {
        item.filled = false;
        item.stroked = true;
        item.strokeColor = cutSpot;
        item.strokeWidth = 0.25;
      }
    } catch (e) {}
  }


  // ═════════════════════════════════════════════════════════
  //  PACKING
  // ═════════════════════════════════════════════════════════

  // 전 사이즈 모드용: pair.cellW/cellH 를 mutate 하지 않고 (단일 사이즈 기준이므로)
  // size 별 packItem 을 즉석 생성. payload 는 항상 원본 pair 객체 그대로 가리켜야
  // _uniquePairsFromPlaced (pair.base dedupe) 와 cachedCutline / cutInfo (pair 에 attach)
  // 가 정확히 작동한다.
  function _itemForSize(pair, sizeMm) {
    var pt = sizeMm * MM_TO_PT;
    var w, h;
    if (pair.aspect >= 1) {
      w = pt;
      h = pt / pair.aspect;
    } else {
      w = pt * pair.aspect;
      h = pt;
    }
    return { w: w, h: h, payload: pair, sizeMm: sizeMm };
  }

  function _copyItems(items) {
    var copied = [];
    for (var i = 0; i < items.length; i++) {
      copied.push(items[i]);
    }
    return copied;
  }

  function _sortShelfItemsDesc(items) {
    var sorted = _copyItems(items);
    sorted.sort(function (a, b) {
      var ah = a.h;
      var bh = b.h;
      var aa = a.w * a.h;
      var bb = b.w * b.h;
      if (ah !== bh) return bh - ah;
      if (aa !== bb) return bb - aa;
      var abase = a.payload && a.payload.base ? a.payload.base : "";
      var bbase = b.payload && b.payload.base ? b.payload.base : "";
      return abase < bbase ? -1 : (abase > bbase ? 1 : 0);
    });
    return sorted;
  }

  // ── 전 사이즈 (All Sizes) 모드 packer ──────────────────────────────
  // 0.75"~2.5" 전 사이즈를 각 1장 이상 출력. 시트 구조 (위→아래):
  //   hero 행: 2.5"/2" 각 1장 + 남는 폭은 작은 사이즈 세로 column (0.75" 3단, 1" 2단 …)
  //   tier 행: 1.5"→1.25"→1"→0.75" round-robin, 행마다 한 사이즈 잠금 (높이 남으면 두 바퀴째)
  //   말미 보장 검증: 빠진 사이즈는 단일 backfill → evict 교체 순으로 구제, 불가하면 leftover 보고.
  // Package 와 동일한 shelf 프리미티브 재사용 → 정렬/회전/좌표 동작 일관.
  function _packAllSizes(pairs, binW, binH, gap, letterBlocks) {
    if (!pairs || pairs.length === 0) {
      return { rows: [], placed: [], leftover: [], repeatedCount: 0, missingSizes: [], evictions: [], mixedSummary: _buildAllSizesSummary(0, 0) };
    }
    var N = pairs.length;

    // 1단계: 보장 라운드 — hero 사이즈(2.5"/2")만 단일로 첫 행에 배치한다.
    //   1.5" 이하 단일은 hero 옆에 두지 않는다 (사용자 정책): 아래 tier 행 round-robin 과
    //   hero 행의 작은 사이즈 column 이 담당하고, 빠진 사이즈는 말미 보장 검증이 구제한다.
    //   디자인은 순서대로 round-robin — 1개면 그 디자인이 전 사이즈, 여러개면 사이즈마다 다음 디자인.
    var primary = [];
    for (var i = 0; i < ALLSIZES_HERO_COUNT && i < ALLSIZES_ORDER_MM.length; i++) {
      primary.push(_itemForSize(pairs[i % N], ALLSIZES_ORDER_MM[i]));
    }
    primary = _sortShelfItemsDesc(primary);   // 높이 내림차순 (FFDH — 큰 것부터)

    var pack = { rows: [], placed: [], leftover: [], repeatedCount: 0, missingSizes: [], evictions: [] };
    pack.leftover = _appendShelfRowsOnce(pack, primary, binW, binH, gap);

    // 2단계: 남는 공간을 (작은 사이즈 × 디자인) round-robin 으로 채움.
    //   디자인 전체를 채움 풀에 넣어 시트가 닿을 때까지 순서대로 반복 — 사이즈·디자인 모두 다양.
    if (ALLSIZES_FILL) {
      var fillers = [];
      for (var d = 0; d < N; d++) {
        for (var f = 0; f < ALLSIZES_FILL_MM.length; f++) {
          fillers.push(_itemForSize(pairs[d], ALLSIZES_FILL_MM[f]));
        }
      }
      fillers = _sortShelfItemsDesc(fillers);
      _appendShelfFillerRows(pack, fillers, binW, binH, gap);
    }

    // 보장 검증: ALLSIZES_ORDER_MM 모든 사이즈 ≥ 1장. hero 구조 전환으로 1.5"~0.75" 는
    //   tier 행/column 이 담당하는데, 높이·폭이 극단적으로 빡빡하면 한 사이즈가 빠질 수 있어
    //   기존 행 빈 폭에 단일 backfill 로 구제한다. 빈 폭도 없으면 채움 아이템 1개를 빼고
    //   교체(_rescueByEviction). 그래도 안 되면 leftover 로 보고.
    var rescuedAny = false;
    for (var gi = 0; gi < ALLSIZES_ORDER_MM.length; gi++) {
      var gSize = ALLSIZES_ORDER_MM[gi];
      if (_countSizeInRows(pack.rows, gSize) > 0) continue;
      var rescued = false;
      for (var gd = 0; gd < N && !rescued; gd++) {
        var gItem = _itemForSize(pairs[gd], gSize);
        for (var gr = 0; gr < pack.rows.length && !rescued; gr++) {
          if (gItem.h <= pack.rows[gr].h && _canAddToShelfRow(pack.rows[gr], gItem, binW, binH, gap)) {
            _addToShelfRow(pack.rows[gr], gItem, gap);
            rescued = true;
            rescuedAny = true;
          }
        }
      }
      if (!rescued && _rescueByEviction(pack, pairs, gSize, binW, gap)) {
        rescued = true;
        rescuedAny = true;
      }
      if (!rescued) {
        pack.leftover.push(_itemForSize(pairs[0], gSize));
        pack.missingSizes.push(gSize);   // 완료 메시지에 보장 실패 사이즈로 명시
      }
    }
    if (rescuedAny) pack.placed = _shelfRowsToPlaced(pack.rows, binW, binH, gap);

    // 이름 블록은 **보장 검증·evict 구제가 전부 끝난 뒤** 붙인다. 먼저 붙이면 그 폭 때문에
    // "각 사이즈 ≥1장" 구제가 실패한다. 사진을 빼야 할 때도 그 사이즈의 마지막 한 장은
    // 지킨다 (_lastOfSizeGuard) — 이름 때문에 보장이 깨지면 안 된다.
    var lres = _applyLetterBlocks(pack.rows, letterBlocks, binW, binH, gap, _lastOfSizeGuard(pack.rows));
    pack.letterAttachedCount = lres.attached;
    pack.letterWanted = lres.wanted;
    pack.letterEvicted = lres.evicted;
    pack.letterFilled = 0;
    if (lres.attached > 0) {
      // 이름 아래 죽은 공간 채우기 (Package 와 같은 규칙). 후보는 **채움 사이즈**로 만든
      //   같은 디자인들 — 전 사이즈는 원래 한 디자인을 여러 크기로 반복하는 모드다.
      //   여기서는 장수만 늘어나므로 "각 사이즈 ≥1장" 보장은 깨질 수 없다.
      var fillCands = [];
      for (var fd = 0; fd < pairs.length; fd++) {
        for (var fs = 0; fs < ALLSIZES_FILL_MM.length; fs++) {
          var fit = _itemForSize(pairs[fd], ALLSIZES_FILL_MM[fs]);
          fillCands.push({ base: pairs[fd].base, cellW: fit.w, cellH: fit.h, payload: pairs[fd] });
        }
      }
      pack.letterFilled = _fillUnderLetterBlocks(pack.rows, fillCands, gap, null).length;
      pack.placed = _shelfRowsToPlaced(pack.rows, binW, binH, gap);
    }

    var photoPlaced = 0;
    for (var pp = 0; pp < pack.placed.length; pp++) {
      if (!pack.placed[pp].payload.isLetterBlock) photoPlaced++;
    }
    pack.mixedSummary = _buildAllSizesSummary(photoPlaced, N);
    return pack;
  }

  // evict 구제: 단일 backfill 이 실패한 보장 사이즈를, 기존 행의 채움 아이템 1개와 교체해 넣는다.
  //   정사각(aspect≈1) 디자인은 hero 잔여폭(≈18.7mm < 0.75" 폭 19.05mm)과 tier 4행째 높이가
  //   모두 mm 차이로 부족해 0.75" 가 column·tier 행·backfill 어느 경로로도 못 들어간다 —
  //   채움 1장을 양보하면 "각 사이즈 ≥1장" 요구사항(ALLSIZES_ORDER_MM)을 지킬 수 있다.
  //   후보 조건: vstack 제외, 시트 잔존 ≥2 인 사이즈만 (하나뿐인 사이즈를 빼면 그쪽 보장이
  //   깨짐 — hero 2.5"/2" 단일도 이 조건으로 자동 배제), 교체 후 행 폭 ≤ binW. 행 높이는
  //   유지 (gItem.h ≤ row.h — 행이 커지면 아래 행과 겹침, backfill 과 동일 규칙).
  //   탐색은 아래 행부터·행 안에서는 오른쪽부터 — hero/tier 상단 미감은 두고 마지막 채움부터 양보.
  function _rescueByEviction(pack, pairs, gSize, binW, gap) {
    for (var gd = 0; gd < pairs.length; gd++) {
      var gItem = _itemForSize(pairs[gd], gSize);
      for (var r = pack.rows.length - 1; r >= 0; r--) {
        var row = pack.rows[r];
        if (gItem.h > row.h) continue;
        for (var i = row.items.length - 1; i >= 0; i--) {
          var out = row.items[i];
          if (out.isVStack) continue;
          if (_countSizeInRows(pack.rows, out.sizeMm) < 2) continue;
          var wAfterSwap = row.items.length > 1 ? row.w - out.w + gItem.w : gItem.w;
          if (wAfterSwap > binW) continue;
          row.items.splice(i, 1);
          row.w = row.items.length > 0 ? row.w - out.w - gap : 0;
          _addToShelfRow(row, gItem, gap);
          pack.evictions.push({ outSize: out.sizeMm, inSize: gSize });
          return true;
        }
      }
    }
    return false;
  }

  function _buildAllSizesSummary(total, designCount) {
    var dStr = (designCount && designCount > 1) ? (designCount + " designs round-robin") : "1 design";
    return {
      spec: "ALL/0.75-2.5in",
      human: "0.75-2.5\" 전 사이즈 (각 1장 이상, 총 " + total + "장, " + dStr + ")",
      total: total
    };
  }

  // Strict 변종: items 를 round-robin cycle 하지 않고 각 item 을 정확히 1번씩만 배치한다.
  // primary round (사이즈별 1장 보장) 에 사용. _appendShelfFillerRows 는 cycling 이라
  // 한 사이즈가 vertical 을 다 잡아먹어 다음 사이즈가 못 들어가는 문제를 회피.
  // 반환값: leftover (들어가지 않은 items 배열)
  function _appendShelfRowsOnce(packResult, items, binW, binH, gap) {
    if (!packResult || !packResult.rows || !items || items.length === 0) return [];

    var startY = 0;
    if (packResult.rows.length > 0) {
      var last = packResult.rows[packResult.rows.length - 1];
      startY = last.y + last.h + gap;
    }

    var row = _newShelfRow(startY);
    var leftover = [];

    for (var i = 0; i < items.length; i++) {
      if (_canAddToShelfRow(row, items[i], binW, binH, gap)) {
        _addToShelfRow(row, items[i], gap);
        continue;
      }

      if (row.items.length > 0) {
        packResult.rows.push(row);
        row = _newShelfRow(row.y + row.h + gap);
      }

      if (_canAddToShelfRow(row, items[i], binW, binH, gap)) {
        _addToShelfRow(row, items[i], gap);
      } else {
        leftover.push(items[i]);
      }
    }

    if (row.items.length > 0) packResult.rows.push(row);
    packResult.placed = _shelfRowsToPlaced(packResult.rows, binW, binH, gap);

    return leftover;
  }

  function _appendShelfFillerRows(packResult, fillerItems, binW, binH, gap) {
    if (!packResult || !packResult.rows || !fillerItems || fillerItems.length === 0) return;

    var fillerIdx = 0;

    // 0단계 hero-row column fill: 보장 라운드가 만든 hero 행(2.5"/2")의 남은 폭을
    //   same-size 세로 column(0.75" 3단, 1" 2단 등)으로 채운다. column 사이즈는 작은
    //   쪽(0.75")부터 round-robin — hero 행 정책상 1.5"/1.25" 단일은 hero 옆에 두지
    //   않고, 세로 2단 이상 쌓이는 작은 사이즈만 들어간다 (1단짜리는 column 미성립 → 제외).
    //   행 높이는 키우지 않는다 (column 합산 h ≤ row.h): 행이 자라면 아래 행과 겹친다.
    //   디자인은 fillerIdx 커서 round-robin — 1단계 seed 는 키 기준 선택이라 커서 점프 무해.
    var ascSizes = [];
    for (var az = ALLSIZES_FILL_MM.length - 1; az >= 0; az--) ascSizes.push(ALLSIZES_FILL_MM[az]);

    for (var br = 0; br < packResult.rows.length; br++) {
      var existRow = packResult.rows[br];
      var colType = 0;   // ascSizes round-robin 커서 (행마다 0.75" 부터)
      while (true) {
        var availW = binW - existRow.w - gap;
        var col = null;
        var used = colType;
        for (var ct = 0; ct < ascSizes.length; ct++) {
          used = (colType + ct) % ascSizes.length;
          col = _buildSameSizeColumn(fillerItems, fillerIdx, ascSizes[used], availW, existRow.h, gap);
          if (col !== null) break;
        }
        if (col === null) break;
        fillerIdx = col.nextIdx;
        _addToShelfRow(existRow, col, gap);
        packResult.repeatedCount += col.cells.length;
        colType = (used + 1) % ascSizes.length;
      }
    }

    // 1단계: 마지막 행 아래로 새 filler 행 추가. 행은 seed(첫 아이템) 사이즈로 잠근다 —
    //   디자인 수가 적으면 pool 순환(사이즈 4종 × N디자인)이 행 중간에서 사이즈를 섞어
    //   [0.75 옆 1.5] 같은 무작위 행이 나오므로(단일 디자인에서 두드러짐), 행 단위 균일
    //   사이즈로 Package tier 행과 같은 미감을 유지한다. 채움률은 자투리 폭만큼 소폭 감소.
    var startY = 0;
    if (packResult.rows.length > 0) {
      var last = packResult.rows[packResult.rows.length - 1];
      startY = last.y + last.h + gap;
    }

    var row = _newShelfRow(startY);
    var rowSizeMm = 0;     // 0 = 빈 행. seed 가 정한 사이즈로 행을 잠근다.
    var roundUsed = {};    // sizeMm -> true. 이번 바퀴(round)에 행 tier 로 쓴 사이즈.
    var roundUsedCount = 0;
    while (true) {
      var added = false;

      if (rowSizeMm === 0) {
        // seed: 이번 바퀴에서 아직 행 tier 로 안 쓴 사이즈 중 가장 키 큰 적합 아이템 —
        //   같은 사이즈 행만 반복되는 것을 막고 사이즈가 행 단위로 고루 나오게 한다
        //   (Package 의 tier round-robin 반복 L→M→S→XS→L… 과 같은 정책).
        //   한 바퀴를 다 쓰면 리셋 후 새 바퀴. 같은 키는 커서 가까운 쪽 → 디자인 round-robin 유지.
        var seedIdx = _pickShelfSeed(fillerItems, fillerIdx, row, roundUsed, binW, binH, gap);
        if (seedIdx < 0 && roundUsedCount > 0) {
          roundUsed = {};
          roundUsedCount = 0;
          seedIdx = _pickShelfSeed(fillerItems, fillerIdx, row, roundUsed, binW, binH, gap);
        }
        if (seedIdx >= 0) {
          _addToShelfRow(row, fillerItems[seedIdx], gap);
          packResult.repeatedCount++;
          rowSizeMm = fillerItems[seedIdx].sizeMm;
          roundUsed[rowSizeMm] = true;
          roundUsedCount++;
          fillerIdx = (seedIdx + 1) % fillerItems.length;
          added = true;
        }
      } else {
        // 잠긴 행: 같은 사이즈만 이어서 채움 (디자인은 커서 round-robin).
        for (var step = 0; step < fillerItems.length; step++) {
          var fi = (fillerIdx + step) % fillerItems.length;
          if (fillerItems[fi].sizeMm !== rowSizeMm) continue;
          if (_canAddToShelfRow(row, fillerItems[fi], binW, binH, gap)) {
            _addToShelfRow(row, fillerItems[fi], gap);
            packResult.repeatedCount++;
            fillerIdx = (fi + 1) % fillerItems.length;
            added = true;
            break;
          }
        }
      }

      if (added) {
        continue;
      }

      if (row.items.length > 0) {
        packResult.rows.push(row);
        row = _newShelfRow(row.y + row.h + gap);
        rowSizeMm = 0;
        continue;
      }

      break;
    }

    if (row.items.length > 0) packResult.rows.push(row);
    packResult.placed = _shelfRowsToPlaced(packResult.rows, binW, binH, gap);
  }

  // filler 행 seed 선택: excludeSizes(이번 바퀴에 행 tier 로 쓴 사이즈)를 제외하고
  //   가장 키 큰 적합 아이템의 index 를 돌려준다. 같은 키는 커서(fromIdx)에서 가까운 쪽
  //   우선 → 디자인 round-robin 유지. 적합한 것이 없으면 -1.
  function _pickShelfSeed(fillerItems, fromIdx, row, excludeSizes, binW, binH, gap) {
    var best = -1;
    for (var s = 0; s < fillerItems.length; s++) {
      var i = (fromIdx + s) % fillerItems.length;
      if (excludeSizes[fillerItems[i].sizeMm]) continue;
      if (!_canAddToShelfRow(row, fillerItems[i], binW, binH, gap)) continue;
      if (best < 0 || fillerItems[i].h > fillerItems[best].h) best = i;
    }
    return best;
  }

  // same-size 세로 column 구성: sizeMm 아이템을 커서(fromIdx)부터 디자인 round-robin 으로
  //   maxW(폭)·maxH(행 높이) 안에서 위→아래로 쌓는다. 2단 미만이면 column 미성립 → null.
  //   반환: vstack item (+ nextIdx = 다음 커서 위치).
  function _buildSameSizeColumn(fillerItems, fromIdx, sizeMm, maxW, maxH, gap) {
    var cells = [];
    var stackH = 0;
    var stackW = 0;
    var idx = fromIdx;
    while (true) {
      var found = -1;
      for (var s = 0; s < fillerItems.length; s++) {
        var i = (idx + s) % fillerItems.length;
        var it = fillerItems[i];
        if (it.sizeMm !== sizeMm) continue;
        if (it.w > maxW) continue;
        var nextH = cells.length > 0 ? stackH + gap + it.h : it.h;
        if (nextH > maxH) continue;
        found = i;
        break;
      }
      if (found < 0) break;
      var fit = fillerItems[found];
      stackH = cells.length > 0 ? stackH + gap + fit.h : fit.h;
      if (fit.w > stackW) stackW = fit.w;
      cells.push(fit);
      idx = (found + 1) % fillerItems.length;
    }
    if (cells.length < 2) return null;
    return { isVStack: true, w: stackW, h: stackH, cells: cells, nextIdx: idx };
  }

  // rows(+vstack cells) 안에서 sizeMm 아이템 개수를 센다 — AllSizes 보장 검증용.
  function _countSizeInRows(rows, sizeMm) {
    var count = 0;
    for (var r = 0; r < rows.length; r++) {
      var items = rows[r].items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].isVStack) {
          for (var v = 0; v < items[i].cells.length; v++) {
            if (items[i].cells[v].sizeMm === sizeMm) count++;
          }
        } else if (items[i].sizeMm === sizeMm) {
          count++;
        }
      }
    }
    return count;
  }

  // ── 단일 사이즈 aspect 밴드 격자 (v22) ─────────────────────────────
  // 비율 혼합 입력에서 uniform grid 의 통합 cellBox (max W × max H) 가 정사각으로 퇴화해
  // 셀마다 여백이 크게 남는 문제를 밴드로 해결한다. 우선순위: 여백 최소 > 미감, 회전 불사용
  // (90° 사진 기각 — 2026-08-19 결정).
  //   1) 밴드 분류 (_bandClusters): 방향 (tall = cellH > cellW / wide) 분리 후, 같은 방향
  //      안에서 가변 변 (tall=cellW / wide=cellH) 내림차순 greedy 클러스터 — 리더 대비 비율
  //      ≥ BAND_CELL_TOL 이면 같은 밴드. 밴드 cellBox = 밴드 내 max (통합 박스보다 항상 타이트).
  //   2) 행 배분: 밴드 cols = floor((binW+gap)/(boxW+gap)), 초기 rows = ceil(D/cols) 로
  //      전 디자인 ≥1 배치 보장. 남는 높이는 greedy — 현재 반복 수 (슬롯/디자인) 가 가장 낮은
  //      밴드부터 행 추가, 아무 밴드도 못 들어갈 때까지 (여백 최소 + 디자인 반복 균형).
  //      초기 배분이 binH 초과면 cliff fallback 대신 박스 면적 증가가 최소인 밴드 쌍부터
  //      병합해 재시도 (_mergeClosestBands) — 밴드가 1개까지 줄면 uniform grid 와 동일
  //      조건이므로 위임한다 (비율 다양 × 디자인 많은 입력에서 점진적 완화).
  //   3) 정렬: 밴드는 boxH 내림차순 (위 큰 밴드 — Package/AllSizes 와 동일한 위→아래 흐름),
  //      밴드 안 디자인은 입력 (선택) 순서 round-robin — 모든 행 같은 순서 (v19 원칙 유지).
  //   좌표는 shelf row 로 변환해 _shelfRowsToPlaced 재사용 — 밴드 안 행들은 구성이 같아
  //   컬럼이 정렬되고, 가로·세로 외곽 = 내부 gap 균등도 기존 grid 와 동일하게 적용된다.
  //   밴드가 1개면 (비율 균일 입력) 그대로 _uniformGridPack — 기존 경로 무변경.
  //   반환 shape 은 grid 호환 + bandInfo [{cols, rows, designs}] (완료 메시지용 — 존재 자체가
  //   "밴드 경로로 배치됨" 마커. fallback/단일 밴드는 bandInfo 없음).
  function _aspectBandGridPack(layoutPairs, binW, binH, gap, letterBlocks) {
    if (!layoutPairs || layoutPairs.length === 0) {
      return _uniformGridPack(layoutPairs, binW, binH, gap, letterBlocks);
    }

    var tall = [];
    var wide = [];
    for (var i = 0; i < layoutPairs.length; i++) {
      layoutPairs[i]._ordIdx = i;   // 입력 순서 복원 + tie-break 용
      if (layoutPairs[i].cellH > layoutPairs[i].cellW) tall.push(layoutPairs[i]);
      else wide.push(layoutPairs[i]);
    }

    var bands = [];
    _bandClusters(bands, tall, true);
    _bandClusters(bands, wide, false);
    if (bands.length <= 1) return _uniformGridPack(layoutPairs, binW, binH, gap, letterBlocks);

    var safeGap = gap < 0 ? 0 : gap;
    var totalRows, totalH;
    while (true) {
      totalRows = 0;
      totalH = 0;
      for (var b = 0; b < bands.length; b++) {
        var bd = bands[b];
        bd.cols = Math.floor((binW + safeGap) / (bd.boxW + safeGap));
        // main flow 의 anyTooBig 검사 (셀 ≤ bin) 로 cols ≥ 1 이 보장되지만, testConfig 직접 호출
        // 등 검사 우회 경로에서도 grid 와 같은 동작이 되도록 fallback 으로 넘긴다.
        if (bd.cols < 1) return _uniformGridPack(layoutPairs, binW, binH, gap, letterBlocks);
        bd.rows = Math.ceil(bd.pairs.length / bd.cols);
        totalRows += bd.rows;
        totalH += bd.rows * bd.boxH;
      }
      totalH += (totalRows - 1) * safeGap;
      if (totalH <= binH) break;
      // 초기 배분 (전 디자인 ≥1) 이 안 들어감 → 박스가 가장 비슷한 밴드 쌍 병합 후 재시도.
      if (bands.length <= 2) return _uniformGridPack(layoutPairs, binW, binH, gap, letterBlocks);
      _mergeClosestBands(bands);
    }

    // greedy 행 추가 — 반복 수 최소 밴드 우선, tie 는 boxH 큰 밴드 (큰 셀이 남은 높이를
    // 먼저 확보해야 나중에 못 들어가는 역전이 없다).
    while (true) {
      var best = -1;
      var bestRatio = 0;
      for (var g = 0; g < bands.length; g++) {
        if (totalH + safeGap + bands[g].boxH > binH) continue;
        var ratio = (bands[g].rows * bands[g].cols) / bands[g].pairs.length;
        if (best < 0 || ratio < bestRatio ||
            (ratio === bestRatio && bands[g].boxH > bands[best].boxH)) {
          best = g;
          bestRatio = ratio;
        }
      }
      if (best < 0) break;
      bands[best].rows++;
      totalRows++;
      totalH += safeGap + bands[best].boxH;
    }

    // 밴드 순서: boxH 내림차순 → boxW 내림차순 → 첫 디자인 입력 순 (결정적 출력).
    bands.sort(function (a, c) {
      if (a.boxH !== c.boxH) return c.boxH - a.boxH;
      if (a.boxW !== c.boxW) return c.boxW - a.boxW;
      return a.ord - c.ord;
    });

    var rowsList = [];
    var bandInfo = [];
    var y = 0;
    var slots = 0;
    for (var m = 0; m < bands.length; m++) {
      var band = bands[m];
      var cursor = 0;
      for (var r = 0; r < band.rows; r++) {
        var items = [];
        for (var c2 = 0; c2 < band.cols; c2++) {
          items.push({ w: band.boxW, h: band.boxH, payload: band.pairs[cursor % band.pairs.length] });
          cursor++;
        }
        rowsList.push({ y: y, w: band.cols * band.boxW + (band.cols - 1) * safeGap, h: band.boxH, items: items });
        y += band.boxH + safeGap;
      }
      slots += band.rows * band.cols;
      bandInfo.push({ cols: band.cols, rows: band.rows, designs: band.pairs.length });
    }

    // 이름 블록 — 행이 다 만들어진 뒤, 좌표로 펴기 전에 붙인다.
    var lres = _applyLetterBlocks(rowsList, letterBlocks, binW, binH, gap, null);
    var placed = _shelfRowsToPlaced(rowsList, binW, binH, gap);
    var D = layoutPairs.length;
    return {
      placed: placed,
      leftover: [],
      rows: rowsList,
      letterAttachedCount: lres.attached,
      letterWanted: lres.wanted,
      letterEvicted: lres.evicted,
      repeatedCount: (slots > D) ? (slots - D) : 0,
      cols: 0,
      gridRows: totalRows,
      slots: slots,
      hSpace: 0,
      vSpace: 0,
      cellBoxW: 0,
      cellBoxH: 0,
      bandInfo: bandInfo
    };
  }

  // 같은 방향 그룹을 가변 변 내림차순으로 정렬한 뒤 greedy 클러스터해 bands 에 push 한다.
  // 리더 (클러스터에서 가변 변이 가장 큰 디자인) 대비 비율 ≥ BAND_CELL_TOL 이면 같은 밴드 —
  // 조금씩 다른 비율 (4:5 vs 3:4) 은 묶고 크게 다른 것 (3:4 vs 9:16) 만 분리한다.
  // 정렬은 클러스터 판정에만 쓰고, 밴드 안 디자인 순서는 입력 (선택) 순서로 복원한다.
  function _bandClusters(bands, group, isTall) {
    if (!group || group.length === 0) return;

    var sorted = [];
    for (var i = 0; i < group.length; i++) sorted.push(group[i]);
    sorted.sort(function (a, b) {
      var av = isTall ? a.cellW : a.cellH;
      var bv = isTall ? b.cellW : b.cellH;
      if (av !== bv) return bv - av;
      return a._ordIdx - b._ordIdx;
    });

    var leaderV = 0;
    for (var s = 0; s < sorted.length; s++) {
      var v = isTall ? sorted[s].cellW : sorted[s].cellH;
      if (s === 0 || v < leaderV * BAND_CELL_TOL) {
        bands.push({ pairs: [], boxW: 0, boxH: 0, ord: sorted[s]._ordIdx });
        leaderV = v;
      }
      sorted[s]._bandIdx = bands.length - 1;
    }

    for (var g = 0; g < group.length; g++) {   // 입력 순서로 다시 돌며 밴드에 적재
      var p = group[g];
      var bd = bands[p._bandIdx];
      bd.pairs.push(p);
      if (p.cellW > bd.boxW) bd.boxW = p.cellW;
      if (p.cellH > bd.boxH) bd.boxH = p.cellH;
      if (p._ordIdx < bd.ord) bd.ord = p._ordIdx;
    }
  }

  // 초기 행 배분이 binH 를 넘을 때 밴드 한 쌍을 병합한다. 병합 비용 = 두 밴드의 디자인들이
  // 합쳐진 cellBox (max W × max H) 로 옮겨갈 때 늘어나는 박스 면적 합 — 최소 쌍을 고른다
  // (방향 경계 무관: tall+wide 병합은 박스가 정사각에 가까워지는 비용으로 자연히 후순위).
  function _mergeClosestBands(bands) {
    var bi = 0;
    var bj = 1;
    var bestCost = -1;
    for (var i = 0; i < bands.length; i++) {
      for (var j = i + 1; j < bands.length; j++) {
        var mw = bands[i].boxW > bands[j].boxW ? bands[i].boxW : bands[j].boxW;
        var mh = bands[i].boxH > bands[j].boxH ? bands[i].boxH : bands[j].boxH;
        var cost = bands[i].pairs.length * (mw * mh - bands[i].boxW * bands[i].boxH) +
                   bands[j].pairs.length * (mw * mh - bands[j].boxW * bands[j].boxH);
        if (bestCost < 0 || cost < bestCost) {
          bestCost = cost;
          bi = i;
          bj = j;
        }
      }
    }
    var keep = bands[bi];
    var gone = bands[bj];
    for (var k = 0; k < gone.pairs.length; k++) keep.pairs.push(gone.pairs[k]);
    keep.pairs.sort(function (a, b) { return a._ordIdx - b._ordIdx; });   // 입력 순서 복원
    if (gone.boxW > keep.boxW) keep.boxW = gone.boxW;
    if (gone.boxH > keep.boxH) keep.boxH = gone.boxH;
    if (gone.ord < keep.ord) keep.ord = gone.ord;
    bands.splice(bj, 1);
  }

  // 밴드 grid 표기: "8×2 + 5×3 (밴드 2개)" — 완료 메시지용.
  function _bandGridStr(bandInfo) {
    var parts = [];
    for (var i = 0; i < bandInfo.length; i++) parts.push(bandInfo[i].cols + "×" + bandInfo[i].rows);
    return parts.join(" + ") + " (밴드 " + bandInfo.length + "개)";
  }

  // _uniformGridPack — 단일 사이즈 모드 packer (v19).
  //   적응형 직사각 셀 (cellBoxW = max cellW, cellBoxH = max cellH) 위에 cols × rows 격자 산출.
  //   gap 입력은 "최소 사진 간격 floor" 이며, 실제 시각 간격은 (binW - cols × cellBoxW) / (cols + 1) 로
  //   균등 자동 분배 (외곽 4면 = 내부 모든 gap 동일). 모든 슬롯은 layoutPairs 를 round-robin 으로
  //   순서대로 채워서 모든 행이 같은 디자인 순서로 보임 — 구 shelf 패커의 행마다 hGap 변동 / 마지막
  //   filler 행 듬성듬성 / 디자인 순서 불일치 문제 해결.
  //
  //   반환 shape 은 shelf 패커들과 호환: {placed, leftover, rows, repeatedCount, cols, gridRows, slots, hSpace, vSpace, cellBoxW, cellBoxH}.
  //   leftover 는 항상 [] (격자 슬롯에 디자인 round-robin 이라 못 들어가는 케이스 없음).
  function _uniformGridPack(layoutPairs, binW, binH, gap, letterBlocks) {
    if (!layoutPairs || layoutPairs.length === 0) {
      return { placed: [], leftover: [], rows: [], repeatedCount: 0, cols: 0, gridRows: 0, slots: 0, hSpace: 0, vSpace: 0, cellBoxW: 0, cellBoxH: 0 };
    }

    var cellBoxW = 0;
    var cellBoxH = 0;
    for (var i = 0; i < layoutPairs.length; i++) {
      if (layoutPairs[i].cellW > cellBoxW) cellBoxW = layoutPairs[i].cellW;
      if (layoutPairs[i].cellH > cellBoxH) cellBoxH = layoutPairs[i].cellH;
    }

    var safeGap = gap < 0 ? 0 : gap;
    var cols = Math.floor((binW + safeGap) / (cellBoxW + safeGap));
    var rowsCount = Math.floor((binH + safeGap) / (cellBoxH + safeGap));
    if (cols < 1 || rowsCount < 1) {
      return { placed: [], leftover: [], rows: [], repeatedCount: 0, cols: 0, gridRows: 0, slots: 0, hSpace: 0, vSpace: 0, cellBoxW: cellBoxW, cellBoxH: cellBoxH };
    }

    var hSpace = (binW - cols * cellBoxW) / (cols + 1);
    if (hSpace < 0) hSpace = 0;
    if (hSpace < safeGap) hSpace = safeGap;  // 가로도 inner = 최소 gap 보장 (full-width 사진 붙음 방지)
    var hLeft = (binW - cols * cellBoxW - (cols - 1) * hSpace) / 2;
    if (hLeft < 0) { hSpace = (binW - cols * cellBoxW) / (cols + 1); if (hSpace < 0) hSpace = 0; hLeft = hSpace; }
    // 세로: 균등 vSpace 가 gap 보다 작아지면(행 많아 빡빡) inner = 최소 gap 보장, 남는 건 outer(vTop) 로.
    //   rowsCount floor 가 이미 gap 을 확보했으므로 inner=gap 강제는 오버플로우 없음 (cutMargin 0 행붙음 방지).
    var vSpace = (binH - rowsCount * cellBoxH) / (rowsCount + 1);
    if (vSpace < 0) vSpace = 0;
    if (vSpace < safeGap) vSpace = safeGap;
    var vTop = (binH - rowsCount * cellBoxH - (rowsCount - 1) * vSpace) / 2;
    if (vTop < 0) { vSpace = (binH - rowsCount * cellBoxH) / (rowsCount + 1); if (vSpace < 0) vSpace = 0; vTop = vSpace; }

    var slots = cols * rowsCount;
    var D = layoutPairs.length;

    var placed = [];
    var rowsList = [];
    for (var r = 0; r < rowsCount; r++) {
      var rowItems = [];
      var rowY = vTop + r * (cellBoxH + vSpace);
      for (var c = 0; c < cols; c++) {
        var slotIdx = r * cols + c;
        var pair = layoutPairs[slotIdx % D];
        var x = hLeft + c * (cellBoxW + hSpace);
        var item = { w: cellBoxW, h: cellBoxH, payload: pair };
        placed.push({ x: x, y: rowY, w: cellBoxW, h: cellBoxH, payload: pair });
        rowItems.push(item);
      }
      rowsList.push({ y: rowY, w: cols * cellBoxW + (cols - 1) * hSpace, h: cellBoxH, items: rowItems });
    }

    var repeatedCount = (slots > D) ? (slots - D) : 0;

    // 이름 블록. **붙었을 때만** 좌표를 다시 편다 — 이 격자는 자기만의 중앙 정렬
    // (hLeft/vTop/hSpace/vSpace) 로 placed 를 직접 만들기 때문에, 이름이 없을 때는
    // 기존 결과와 바이트 단위로 같아야 한다 (sim/regress.js 가 그걸 검사한다).
    var lres = _applyLetterBlocks(rowsList, letterBlocks, binW, binH, gap, null);
    if (lres.attached > 0) placed = _shelfRowsToPlaced(rowsList, binW, binH, gap);

    return {
      placed: placed,
      leftover: [],
      rows: rowsList,
      letterAttachedCount: lres.attached,
      letterWanted: lres.wanted,
      letterEvicted: lres.evicted,
      repeatedCount: repeatedCount,
      cols: cols,
      gridRows: rowsCount,
      slots: slots,
      hSpace: hSpace,
      vSpace: vSpace,
      cellBoxW: cellBoxW,
      cellBoxH: cellBoxH
    };
  }

  // 티어 분포 문자열 (XXL→XS 순, 0 인 tier 생략). 완료 메시지/사이즈 라인 표시용.
  function _packageDistStr(arr) {
    var c = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    for (var i = 0; i < arr.length; i++) {
      var t = arr[i].tier;
      if (c[t] == null) t = TIER_DEFAULT;
      c[t]++;
    }
    var order = ["XXL", "XL", "L", "M", "S", "XS"];
    var parts = [];
    for (var k = 0; k < order.length; k++) {
      if (c[order[k]] > 0) parts.push(order[k] + "×" + c[order[k]]);
    }
    return parts.length ? parts.join(" ") : "—";
  }

  // pair.tier → 박스 산출. 단일 사이즈 모드와 동일 규칙: 긴 변 = tier 인치, 비율 보존.
  function _tierBox(pair) {
    var sizeMm = TIER_SIZE_MM[pair.tier] || TIER_SIZE_MM[TIER_DEFAULT];
    var sizePt = sizeMm * MM_TO_PT;
    var asp = pair.aspect || 1;
    if (asp >= 1) { pair.cellW = sizePt; pair.cellH = sizePt / asp; }
    else { pair.cellW = sizePt * asp; pair.cellH = sizePt; }
    return pair;
  }

  // _packPackage — Package 모드 packer (tier 밴드 + column, 2026-06-11 개편). 목적 = AllSizes 와
  //   같은 정돈 + 면적 충전 (혼합 행 한가운데 떠 있던 작은 컷 제거).
  //   행 구조: 한 행 = 한 tier(row.tierLock). 배치는 같은 tier 행 중 폭 여유 있는 행 아무 곳,
  //   없으면 맨 아래 새 행 (_placeBanded). 마지막에 행 키 내림차순 정렬 → 위 큰 행, 아래 작은 행.
  //   Phase A — 각 사진 1회 배치(base). 행 배치 실패(서로 다른 tier 행 누적 > binH, 예: XXL+XL+L+M
  //     4단 = 185.3mm > 171mm)는 column 후보로 보류 → column 채움 단계가 다른 행 옆에 구제.
  //     column 까지 0장(진짜 오버사이즈)일 때만 leftover. 그 tier 은 행 pass 제외(행 비균일 방지).
  //   Phase B (Model B — tier 단위 균일 반복 + min/max, 2026-08-19 확장):
  //     · XXL 은 반복 0, 각 1장 고정 (다중 XXL 도 버리지 않음) = PKG_COUNT_BY_TIER.XXL 1/1.
  //     · 비-XXL tier 는 "그 tier 사진 전부 한 장씩" 을 atomic pass 로 추가. 한 장이라도 못 들어가면
  //       _snapPack 스냅샷으로 통째 롤백 + 그 tier 은퇴 → within-tier 균일 불변식 보존.
  //     · B0 (min 강제): PKG_COUNT_BY_TIER.min 까지 round-robin pass 를 greedy 보다 먼저 실행.
  //     · B1 (greedy): round-robin XL→L→M→S→XS 으로 max cap 또는 시트가 닿을 때까지.
  //     · min 구제 column / 고아 행 채움: 행 pass 가 못 채운 min 을 column 으로 구제하고,
  //       tierNoRows 로 반복이 막힌 행을 자기 디자인으로 가로 채움. 미달은 minShortfall 보고.
  //   Column 채움 — 각 행의 남은 폭에 작은 tier 의 같은 사이즈 세로 column(2단+, _buildTierColumn).
  //     셀 디자인은 tier 안 round-robin cursor → 개수 ±1 균형(엄밀 균일이 아닌 유일한 단계 —
  //     2026-06-11 사용자 승인). AllSizes hero 행의 small column 과 동일한 시각 언어. XXL 행 옆
  //     빈 폭이 주 수혜 (XXL 한 장 + 옆 column 채움).
  //   _shelfRowsToPlaced 가 외곽=내부 gap 균등 분배 + isVStack expand. 반환 shape 은 기존 호환.
  //   행 정렬 후 row.y 는 stale — 위치 SOT 는 placed (rows 는 길이/구성 통계용).
  // 기회주의 90° 회전: 원본 방향 우선 시도, 행에 안 들어갈 때만 회전(w/h swap)으로 재시도. 회전은
  //   placement 인스턴스 단위(같은 사진 복제본이 행 사정 따라 다르게 회전 가능 — 균일은 '횟수' 기준).
  //   비-마지막 행은 행 키 성장 금지(아래 행과 겹침 방지). column 셀은 upright 고정.
  // rotated 태그는 _shelfRowsToPlaced → placed → _placePhotoSticker 로 전달돼 실제 아트워크 회전.
  function _tryAddToBandRow(row, pair, isLast, binW, binH, gap, relaxed) {
    var cands = [
      { w: pair.cellW, h: pair.cellH, payload: pair, rotated: false },
      { w: pair.cellH, h: pair.cellW, payload: pair, rotated: true }
    ];
    for (var c = 0; c < cands.length; c++) {
      if (!isLast && row.items.length > 0 && cands[c].h > row.h) continue;
      // 높이 유사성 게이트 (v22): 같은 tier 라도 방향/비율 차이로 행 높이와 크게 다르면
      // (예: 세로형 행에 납작한 가로형) 그 행에 안 넣는다 — 별도 행 또는 회전 후보가 처리.
      // relaxed (게이트 해제) 는 _placeBanded 의 최후 fallback 전용.
      if (!relaxed && row.items.length > 0 && !_heightsClose(cands[c].h, row.h)) continue;
      if (_canAddToShelfRow(row, cands[c], binW, binH, gap)) {
        _addToShelfRow(row, cands[c], gap);
        return true;
      }
    }
    return false;
  }

  function _placeBanded(rows, pair, binW, binH, gap) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].tierLock !== pair.tier) continue;
      if (_tryAddToBandRow(rows[i], pair, i === rows.length - 1, binW, binH, gap, false)) return true;
    }
    var ny = rows.length > 0 ? rows[rows.length - 1].y + rows[rows.length - 1].h + gap : 0;
    var nr = _newShelfRow(ny);
    nr.tierLock = pair.tier;
    if (_tryAddToBandRow(nr, pair, true, binW, binH, gap, false)) {
      rows.push(nr);
      return true;
    }
    // 게이트 완화 fallback: 게이트 통과 행도, 새 행도 불가할 때만 기존 행에 게이트 없이
    // (v21 동작) 재시도. 행 높이가 양방향 후보 사이에 끼는 dead-zone (예: 28.6mm 행에
    // 21.4/38.1 후보) 에서 atomic pass 전체가 롤백되는 회귀 방지 — 게이트 이전에 가능했던
    // 배치는 이 경로로 전부 유지되므로 게이트는 순수 선호 순서만 바꾼다.
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].tierLock !== pair.tier) continue;
      if (_tryAddToBandRow(rows[j], pair, j === rows.length - 1, binW, binH, gap, true)) return true;
    }
    return false;
  }

  // 같은 tier 세로 column (2단 이상) — AllSizes _buildSameSizeColumn 의 Package pair 버전.
  function _pkgMin(tier) {
    var c = PKG_COUNT_BY_TIER[tier];
    return c ? c.min : 1;
  }

  function _pkgMax(tier) {
    var c = PKG_COUNT_BY_TIER[tier];
    return c ? c.max : 999999;
  }

  // counts 를 주면 max cap 준수: 디자인별 (기존 counts + 이 column 안 추가분) ≥ max 면 제외.
  function _buildTierColumn(grp, fromIdx, maxW, maxH, gap, counts) {
    var cells = [];
    var stackH = 0;
    var stackW = 0;
    var idx = fromIdx;
    var localAdd = {};
    while (true) {
      var found = -1;
      for (var s = 0; s < grp.length; s++) {
        var i = (idx + s) % grp.length;
        if (counts) {
          var eff = counts[grp[i].base] + (localAdd[grp[i].base] || 0);
          if (eff >= _pkgMax(grp[i].tier)) continue;
        }
        if (grp[i].cellW > maxW) continue;
        var nextH = cells.length > 0 ? stackH + gap + grp[i].cellH : grp[i].cellH;
        if (nextH > maxH) continue;
        found = i;
        break;
      }
      if (found < 0) break;
      var fit = grp[found];
      stackH = cells.length > 0 ? stackH + gap + fit.cellH : fit.cellH;
      if (fit.cellW > stackW) stackW = fit.cellW;
      cells.push({ w: fit.cellW, h: fit.cellH, payload: fit });
      localAdd[fit.base] = (localAdd[fit.base] || 0) + 1;
      idx = (found + 1) % grp.length;
    }
    if (cells.length < 2) return null;
    return { isVStack: true, w: stackW, h: stackH, cells: cells, nextIdx: idx };
  }

  // rows 안에 해당 pair 배치 존재 여부 (vstack 셀 포함) — Phase A 보류 디자인의 최종 leftover 판정.
  function _pairPlacedInRows(rows, pair) {
    for (var r = 0; r < rows.length; r++) {
      var its = rows[r].items;
      for (var i = 0; i < its.length; i++) {
        if (its[i].isVStack || its[i].isComposite) {
          for (var c = 0; c < its[i].cells.length; c++) {
            if (its[i].cells[c].payload === pair) return true;
          }
        } else if (its[i].payload === pair) {
          return true;
        }
      }
    }
    return false;
  }

  function _packPackage(pairs, binW, binH, gap, letterBlocks) {
    if (!pairs || pairs.length === 0) {
      return { placed: [], leftover: [], rows: [], repeatedCount: 0, cols: 0, gridRows: 0, slots: 0 };
    }
    for (var i = 0; i < pairs.length; i++) _tierBox(pairs[i]);

    var ordered = _sortedPairsForShelf(pairs, false);  // 높이 내림차순
    var n = ordered.length;
    var rows = [];
    var leftover = [];

    // Phase A — 각 사진 1회 배치 (tier 밴드 행). 실패는 column 후보로 보류 (즉시 leftover 금지 —
    //   XXL+XL+L+M 처럼 tier 행 누적이 binH 를 넘으면 마지막 tier 가 행을 못 여는 케이스).
    var counts = {};   // base → 시트 출력 장수 (min/max 판정의 SOT)
    for (var ci0 = 0; ci0 < n; ci0++) counts[ordered[ci0].base] = 0;

    var colOnly = [];
    for (var p = 0; p < n; p++) {
      if (_placeBanded(rows, ordered[p], binW, binH, gap)) {
        counts[ordered[p].base]++;
        continue;
      }
      ordered[p]._colOnly = true;
      colOnly.push(ordered[p]);
    }

    var repeatedCount = 0;
    var tierSeq = ["XL", "L", "M", "S", "XS"];
    var tierGroups = { XL: [], L: [], M: [], S: [], XS: [] };
    var tierNoRows = { XL: false, L: false, M: false, S: false, XS: false };
    for (var gi = 0; gi < n; gi++) {
      var gp = ordered[gi];
      if (gp.tier === "XXL" || !tierGroups[gp.tier]) continue;  // XXL·미지정 tier 반복 제외
      // 행 배치 못 한 디자인이 있는 tier 은 행 pass 제외(행 기반 비균일 방지) — column 은 허용.
      if (gp._colOnly) tierNoRows[gp.tier] = true;
      tierGroups[gp.tier].push(gp);
    }
    for (var so = 0; so < tierSeq.length; so++) {
      tierGroups[tierSeq[so]] = _sortedPairsForShelf(tierGroups[tierSeq[so]], false);
    }

    var retired = { XL: false, L: false, M: false, S: false, XS: false };
    var guard = 0;

    // Phase B0 — min 강제 pass (2026-08-19): PKG_COUNT_BY_TIER.min 까지 tier round-robin
    //   으로 atomic pass 우선 실행 — greedy 반복(B1)이 다른 tier 의 min 공간을 먹기 전에
    //   확보한다. pass 실패 tier 는 은퇴 (잔여 min 은 아래 min 구제 column 이 시도).
    var minActive = true;
    while (minActive && guard++ < 100000) {
      minActive = false;
      for (var tmq = 0; tmq < tierSeq.length; tmq++) {
        var TM = tierSeq[tmq];
        if (retired[TM] || tierNoRows[TM]) continue;
        var mGrp = tierGroups[TM];
        if (!mGrp || mGrp.length === 0) continue;
        if (counts[mGrp[0].base] >= _pkgMin(TM)) continue;   // pass 는 균일이라 대표 검사
        var mSnap = _snapPack(rows);
        var mOk = true;
        for (var mj = 0; mj < mGrp.length; mj++) {
          if (_placeBanded(rows, mGrp[mj], binW, binH, gap)) continue;
          mOk = false;
          break;
        }
        if (mOk) {
          for (var mj2 = 0; mj2 < mGrp.length; mj2++) counts[mGrp[mj2].base]++;
          repeatedCount += mGrp.length;
          minActive = true;
        } else {
          rows = mSnap;
          retired[TM] = true;
        }
      }
    }

    // Phase B1 — Model B tier 단위 균일 반복 (기존 greedy). max cap 준수: 다음 pass 로
    //   디자인 하나라도 max 를 넘기면 그 tier 은퇴 (hard max — 남는 공간은 justify 몫).
    var anyActive = true;
    while (anyActive && guard++ < 100000) {
      anyActive = false;
      for (var tsq = 0; tsq < tierSeq.length; tsq++) {
        var T = tierSeq[tsq];
        if (retired[T]) continue;
        var grp = tierGroups[T];
        if (tierNoRows[T] || !grp || grp.length === 0) { retired[T] = true; continue; }
        var maxT = _pkgMax(T);
        var canRepeat = true;
        for (var mc = 0; mc < grp.length; mc++) {
          if (counts[grp[mc].base] + 1 > maxT) { canRepeat = false; break; }
        }
        if (!canRepeat) { retired[T] = true; continue; }

        var snap = _snapPack(rows);                 // atomic pass: 전부 1장씩, 실패 시 통째 롤백
        var passOk = true;
        for (var pj = 0; pj < grp.length; pj++) {
          if (_placeBanded(rows, grp[pj], binW, binH, gap)) continue;
          passOk = false;                           // 새 행에도 안 들어감 → pass 불가
          break;
        }
        if (passOk) {
          for (var pj2 = 0; pj2 < grp.length; pj2++) counts[grp[pj2].base]++;
          repeatedCount += grp.length;
          anyActive = true;
        } else {
          rows = snap;                              // pass 중 추가분·신규행 전부 폐기
          retired[T] = true;
        }
      }
    }

    // 이름 블록은 tier 체계 밖이라 위 패킹에 참여하지 않는다. **모든 column 단계보다 먼저**
    // 붙인다 — 뒤에 붙이면 min 구제 column 이 히어로 행 잔여 폭을 먼저 먹어 자리가 없다
    // (누리 실측: 히어로 63.5mm 사진 + XS column 19.5mm = 83mm → 68.5mm 블록 배치 실패).
    // 대가로 그 폭만큼 min 구제 여지가 줄어든다 — 이름이 있는 주문은 min 미달 경고가
    // 늘 수 있고, 그게 맞는 우선순위다 (이름 블록은 고객이 지정한 것, min 은 내부 목표).
    // 블록 배열(큰 1 + 작은 N)을 순서대로 붙인다. 큰 것부터 붙여야 자리를 먼저 잡는다.
    // 일부만 붙어도 계속 진행 — 붙은 개수를 보고한다.
    var letterAttachedCount = 0;
    var letterWanted = 0;
    var letterEvicted = 0;
    var letterPending = [];        // 자리가 없어 못 붙은 블록 — 맨 마지막에 다시 시도한다
    if (letterBlocks && letterBlocks.length > 0) {
      letterWanted = letterBlocks.length;
      for (var lb = 0; lb < letterBlocks.length; lb++) {
        if (_attachLetterBlock(rows, letterBlocks[lb], binW, binH, gap)) letterAttachedCount++;
        else letterPending.push(letterBlocks[lb]);
      }
    }

    // min 구제 column (2026-08-19) — count < min 인 디자인 (Phase A 실패 colOnly 포함) 을
    //   일반 column 채움 전에 우선 배치해 min 보장 복원. tier 큰 순서로, 폭 남는 행 어디든.
    //   R8c 케이스: 행을 못 연 S tier 가 XS column 독식에 밀려 0장이 되던 문제 해소.
    //   XXL 은 column 자체가 비실용적 (2단 127mm+) 이라 기존대로 제외 — 미달 시 leftover 보고.
    var resActive = true;
    while (resActive) {
      resActive = false;
      for (var rt = 0; rt < tierSeq.length && !resActive; rt++) {
        var rGrp = tierGroups[tierSeq[rt]];
        if (!rGrp || rGrp.length === 0) continue;
        var deficit = [];
        for (var rd = 0; rd < rGrp.length; rd++) {
          if (counts[rGrp[rd].base] < _pkgMin(rGrp[rd].tier)) deficit.push(rGrp[rd]);
        }
        if (deficit.length === 0) continue;
        for (var rr = 0; rr < rows.length; rr++) {
          var rCol = _buildTierColumn(deficit, 0, binW - rows[rr].w - gap, rows[rr].h, gap, counts);
          if (rCol === null) continue;
          _addToShelfRow(rows[rr], rCol, gap);
          for (var rc = 0; rc < rCol.cells.length; rc++) {
            var rb = rCol.cells[rc].payload.base;
            if (counts[rb] > 0) repeatedCount++;
            counts[rb]++;
          }
          resActive = true;   // counts 갱신됐으니 deficit 재계산 후 재시도
          break;
        }
      }
    }

    // 고아 행 채움 (2026-08-19) — tierNoRows 로 반복이 막힌 tier 의 기존 행 (Phase A 가 연
    //   행) 을 자기 tier 디자인 반복으로 가로 채움. max 준수, 행 키 성장 금지 (isLast=false).
    //   R8c 케이스: 마지막 자투리 높이에 턱걸이로 열린 행이 한 장 덩그러니 남던 문제 해소.
    for (var orI = 0; orI < rows.length; orI++) {
      var orRow = rows[orI];
      if (!orRow.tierLock) continue;
      // 구 경로 = 반복이 막힌 tier(tierNoRows). 신 경로 = 폭 미달 행.
      var orBlocked = tierNoRows[orRow.tierLock];
      var orNarrow = orRow.w < binW * ORPHAN_FILL_MIN_WIDTH;
      if (!orBlocked && !orNarrow) continue;
      var orGrp = tierGroups[orRow.tierLock];
      if (!orGrp || orGrp.length === 0) continue;
      var orCur = 0;
      var orAdded = true;
      while (orAdded) {
        orAdded = false;
        for (var os = 0; os < orGrp.length; os++) {
          var oi = (orCur + os) % orGrp.length;
          var op = orGrp[oi];
          if (counts[op.base] >= _pkgMax(op.tier)) continue;
          // ±1 균형 — tier 안 최소 장수인 디자인만 추가 (column 채움과 같은 규칙).
          // **신 경로(폭 트리거)에만 적용.** 구 tierNoRows 경로에도 걸었더니 기존에 되던
          // 채움이 막혀 컷이 오히려 줄었다 (디자인8: 11→9컷, 잔여 159→228mm 실측) —
          // 구 경로는 동작을 그대로 보존한다.
          if (!orBlocked) {
            var orMin = 1e9;
            for (var ob = 0; ob < orGrp.length; ob++) {
              if (counts[orGrp[ob].base] < orMin) orMin = counts[orGrp[ob].base];
            }
            if (counts[op.base] > orMin) continue;
          }
          if (_tryAddToBandRow(orRow, op, false, binW, binH, gap, false)) {
            if (counts[op.base] > 0) repeatedCount++;
            counts[op.base]++;
            orCur = oi + 1;
            orAdded = true;
            break;
          }
        }
      }
    }

    // Column 채움 — 각 행 남은 폭에 작은 tier column. 행 키는 안 키움. max cap 준수 +
    //   시작 tier 회전 (한 tier 가 남은 폭을 독식하지 않게 — max 와 이중 안전판).
    var colCursor = { XS: 0, S: 0, M: 0, L: 0 };
    var ascTiers = ["XS", "S", "M", "L"];
    var colStart = 0;
    for (var cr = 0; cr < rows.length; cr++) {
      while (true) {
        var col = null;
        var used = colStart;
        for (var ct = 0; ct < ascTiers.length; ct++) {
          used = (colStart + ct) % ascTiers.length;
          var cGrp = tierGroups[ascTiers[used]];
          if (!cGrp || cGrp.length === 0) continue;
          col = _buildTierColumn(cGrp, colCursor[ascTiers[used]], binW - rows[cr].w - gap, rows[cr].h, gap, counts);
          if (col !== null) { colCursor[ascTiers[used]] = col.nextIdx; break; }
        }
        if (col === null) break;
        colStart = (used + 1) % ascTiers.length;
        _addToShelfRow(rows[cr], col, gap);
        for (var cc = 0; cc < col.cells.length; cc++) {
          var cb = col.cells[cc].payload.base;
          if (counts[cb] > 0) repeatedCount++;
          counts[cb]++;
        }
      }
    }

    // column 구제까지 끝난 뒤에도 0장인 보류 디자인만 진짜 leftover (시트보다 큰 오버사이즈 등).
    for (var lo = 0; lo < colOnly.length; lo++) {
      if (!_pairPlacedInRows(rows, colOnly[lo])) leftover.push(colOnly[lo]);
    }

    // 못 붙은 이름 블록 — **사진을 빼서라도 넣는다** (사용자 지정 2026-08-23).
    //
    // 왜 여기인가: 정상 부착은 tuned 위치(모든 column 단계 앞) 그대로 두고, **실패했을 때만**
    // 맨 마지막에 손댄다. 그래서 오늘 되던 배치는 한 픽셀도 안 바뀐다.
    // 왜 필요한가: 8글자 이상 단어는 히어로 옆 예산(72mm)에 안 들어가고, 시트가 꽉 차면
    // 전폭 새 행도 못 연다 → 이름이 **조용히 빠졌다** (16디자인 3시트에서 재현).
    //   실측: Isabella(8자) · Christopher(11자) 가 이 경로로 빠졌다.
    // counts 는 min 판정의 SOT 라 뺀 만큼 반드시 깎는다. 마지막 한 장은 안 뺀다.
    if (letterPending.length > 0) {
      var evGuard = _lastCopyGuard(counts);
      var evSink = function (gone) {
        var bs = _itemBases(gone);
        for (var bi = 0; bi < bs.length; bi++) {
          if (counts[bs[bi]] > 0) counts[bs[bi]]--;
          if (repeatedCount > 0) repeatedCount--;   // 마지막 한 장은 안 빼므로 항상 반복분이다
        }
      };
      for (var lp = 0; lp < letterPending.length; lp++) {
        var evN = _evictForLetterBlock(rows, letterPending[lp], binW, binH, gap, evGuard, evSink);
        if (evN >= 0) { letterAttachedCount++; letterEvicted += evN; }
      }
    }

    // 이름을 행 맨 위로 붙이고 **그 아래 죽은 공간을 사진으로 채운다** (사용자 지정 2026-08-24).
    // 이름은 7~9.5mm 띠인데 히어로 행은 45~63mm 라, 예전엔 이름이 한가운데 떠서 위아래
    // 68×53mm 가 통째로 비어 나갔다. max cap 은 그대로 지킨다.
    var letterFilled = 0;
    if (letterAttachedCount > 0) {
      var fillGuard = function (fp, fused) {
        return counts[fp.base] + (fused[fp.base] || 0) < _pkgMax(fp.tier);
      };
      var addedU = _fillUnderLetterBlocks(rows, ordered, gap, fillGuard);
      for (var au = 0; au < addedU.length; au++) {
        var ab = addedU[au].payload.base;
        if (counts[ab] > 0) repeatedCount++;   // 이미 있던 디자인이면 반복분
        counts[ab]++;
        letterFilled++;
      }
    }

    // min 미달 집계 — 완료 메시지 경고용 (공간 부족으로 min 을 못 채운 디자인).
    var minShortfall = [];
    for (var msf = 0; msf < n; msf++) {
      var mp = ordered[msf];
      if (counts[mp.base] < _pkgMin(mp.tier)) {
        minShortfall.push({ base: mp.base, tier: mp.tier, count: counts[mp.base], min: _pkgMin(mp.tier) });
      }
    }

    // 행 키 내림차순 정렬 (AllSizes 와 동일한 위→아래 흐름). _shelfRowsToPlaced 가 y 재계산.
    var deco = [];
    for (var sr = 0; sr < rows.length; sr++) deco.push({ r: rows[sr], i: sr });
    deco.sort(function (a, b) { return (b.r.h - a.r.h) || (a.i - b.i); });
    rows = [];
    for (var dr = 0; dr < deco.length; dr++) rows.push(deco[dr].r);

    _moveLetterBlocksToRowEnd(rows);
    var placed = _shelfRowsToPlaced(rows, binW, binH, gap);
    return {
      letterAttachedCount: letterAttachedCount,
      letterWanted: letterWanted,
      letterEvicted: letterEvicted,
      letterFilled: letterFilled,
      placed: placed,
      leftover: leftover,
      rows: rows,
      repeatedCount: repeatedCount,
      cols: 0,
      gridRows: rows.length,
      slots: placed.length,
      counts: counts,
      minShortfall: minShortfall
    };
  }

  // ══ Package 배분층 (2026-08-22) ═══════════════════════════════════
  // 구 _tierAreaBudget(한 시트 예산 초과분을 "버림") 을 대체한다. 버리는 대신 시트에 나눠 담는다.
  // 순서: ① 버킷 round-robin 딜 → ② 사다리 후보 전부 패킹 → ③ 승자 확정.
  // ②가 ①보다 뒤인 이유: _packPackage 는 Phase A(각 1장) 직후 Phase B(반복 채움)로 시트를 꽉
  // 채우므로, "시트1 패킹 → leftover 를 시트2로" 식 체이닝은 반복분이 자리를 먼저 먹어 아직 한 번도
  // 안 놓인 디자인이 영원히 밀린다. 반복 채움보다 분배가 반드시 먼저 끝나야 한다.

  // pair 의 버킷. 파일명 _BIG/_MED/_SML 우선, 레거시 6티어 파일명은 TIER_TO_BUCKET 으로 유도.
  function _bucketOf(pair) {
    if (pair.bucket && BUCKET_TIERS[pair.bucket]) return pair.bucket;
    return TIER_TO_BUCKET[pair.tier] || "MED";
  }

  // 버킷별 round-robin 딜 — 모든 시트가 BIG/MED/SML 을 고루 갖게 한다. 한 시트가 "큰 것만"
  // 또는 "작은 것만" 이 되는 것을 구조적으로 차단하는 것이 이 단계의 유일한 목적이다.
  function _dealBuckets(pairs, nSheets) {
    var sheets = [];
    for (var s = 0; s < nSheets; s++) sheets.push([]);
    for (var b = 0; b < BUCKETS.length; b++) {
      var k = 0;
      for (var i = 0; i < pairs.length; i++) {
        if (_bucketOf(pairs[i]) !== BUCKETS[b]) continue;
        sheets[k % nSheets].push(pairs[i]);
        k++;
      }
    }
    return sheets;
  }

  // 시트 안에서 인치 확정 — 버킷별 사다리를 순환 배정하고 cellW/cellH 를 갱신한다.
  // 딜이 배타적(한 pair 는 한 시트에만)이라 tier 덮어쓰기가 시트끼리 간섭하지 않는다.
  function _assignTiers(sheetPairs, ladder) {
    var cursor = { BIG: 0, MED: 0, SML: 0 };
    for (var i = 0; i < sheetPairs.length; i++) {
      var b = _bucketOf(sheetPairs[i]);
      var lad = ladder[b] || BUCKET_TIERS[b];
      sheetPairs[i].tier = lad[cursor[b] % lad.length];
      cursor[b]++;
      _tierBox(sheetPairs[i]);
    }
    return sheetPairs;
  }

  // _packPackage 는 배치 실패 pair 에 _colOnly 를 남긴다. 같은 pair 객체를 사다리 후보마다
  // 재사용하므로, 지우지 않으면 이전 시행의 실패가 다음 시행의 tierNoRows 를 오염시킨다.
  function _resetPackState(sheetPairs) {
    for (var i = 0; i < sheetPairs.length; i++) sheetPairs[i]._colOnly = false;
  }

  function _sheetFill(packResult, binW, binH) {
    var area = 0;
    for (var i = 0; i < packResult.placed.length; i++) {
      area += packResult.placed[i].w * packResult.placed[i].h;
    }
    return area / (binW * binH);
  }

  // 사다리 하나로 nSheets 를 전부 패킹해본 시행 결과.
  function _trialLadder(pairs, nSheets, ladder, binW, binH, gap) {
    var deal = _dealBuckets(pairs, nSheets);
    var trial = { ladder: ladder, sheets: [], warn: 0, minFill: 1, sumFill: 0 };
    for (var s = 0; s < deal.length; s++) {
      _assignTiers(deal[s], ladder);
      _resetPackState(deal[s]);
      var r = _packPackage(deal[s], binW, binH, gap);
      var fill = _sheetFill(r, binW, binH);
      var shortfall = r.minShortfall ? r.minShortfall.length : 0;
      trial.warn += r.leftover.length + shortfall;
      trial.sumFill += fill;
      if (fill < trial.minFill) trial.minFill = fill;
      trial.sheets.push({ pairs: deal[s], fill: fill });
    }
    return trial;
  }

  // 승자 기준 = 경고(미배치+min 미달) 최소 → 동률이면 **최저 시트** 충전율 최대.
  // 평균이 아니라 최저를 보는 이유: 평균이 좋아도 한 장이 텅 비면 고객은 그 장을 먼저 본다.
  function _planPackageSheets(pairs, nSheets, binW, binH, gap) {
    var best = null;
    for (var li = 0; li < PACKAGE_LADDERS.length; li++) {
      var trial = _trialLadder(pairs, nSheets, PACKAGE_LADDERS[li], binW, binH, gap);
      var better = false;
      if (best === null) {
        better = true;
      } else if (trial.warn < best.warn) {
        better = true;
      } else if (trial.warn === best.warn && trial.minFill > best.minFill) {
        better = true;
      }
      if (better) best = trial;
    }
    // 마지막 시행이 pair.tier 에 남긴 값을 승자 사다리로 되돌린다 (시행들이 같은 객체를 공유).
    for (var bs = 0; bs < best.sheets.length; bs++) {
      _assignTiers(best.sheets[bs].pairs, best.ladder);
      _resetPackState(best.sheets[bs].pairs);
    }
    return best;
  }

  // ══ 시트 제작 (다중 시트, 2026-08-22) ══════════════════════════════
  // 시트 하나 = 템플릿 문서 하나. _openSheetContext 가 문서를 열어 배치 좌표계를 잡고,
  // _produceSheet 가 그 문서에 pack → 배치 → 저장까지 끝낸다. 문서를 열어둔 채 반환하므로
  // 운영자가 끝나고 모든 시트를 눈으로 확인할 수 있다 (testConfig.closeAfter 만 닫는다).
  function _openSheetContext(templateFile, padPt) {
    var doc = _openTemplateDoc(templateFile);
    var bodyPath, headerRightText;
    try {
      bodyPath = _findInfoPath(doc, "body");
      headerRightText = _findInfoPath(doc, "header_right");
      // 이름이 같은 PathItem 이 먼저 잡히면 .contents 주입 단계에서 터짐 — 여기서 차단.
      if (headerRightText.typename !== "TextFrame") {
        throw new Error("info > header > header_right 가 TextFrame 이 아닙니다 (현재: " +
          headerRightText.typename + "). 템플릿에서 같은 이름의 다른 오브젝트를 제거하세요.");
      }
    } catch (eBorder) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose) {}
      return { doc: null, error: eBorder.message };
    }

    var gb = bodyPath.geometricBounds;
    var binW = (gb[2] - gb[0]) - 2 * padPt;
    var binH = (gb[1] - gb[3]) - 2 * padPt;
    if (binW <= 0 || binH <= 0) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose2) {}
      return { doc: null, error: "info > body 영역이 BODY_PADDING_MM 보다 작습니다." };
    }

    return {
      doc: doc, error: null,
      bodyPath: bodyPath, headerRightText: headerRightText,
      bL: gb[0], bT: gb[1], padPt: padPt, binW: binW, binH: binH
    };
  }


  function _produceSheet(ctx, sheetPairs, options, sIdx, sheetTotal, gapPt, cutMarginPt, inputFolder, stamp) {
    var doc = ctx.doc;

    // 시트 캐시 무효화 — cachedCutline/cutInfo/cachedArtGroup 은 **문서에 속한 PageItem 참조**인데
    // _cleanupTraceStash 가 시트 끝에서 그 아이템을 지운다. 필드를 안 비우면 다음 시트에서
    // _buildCutlineCache 가 "캐시 있음"으로 판단해 trace 를 건너뛰고 (826행), 그 뒤
    // duplicate() 가 **이미 제거된 아이템**을 복제하려다 터진다. 지금은 시트 배분이 배타적이라
    // (한 디자인은 한 시트에만) 발생하지 않지만, 배분 로직이 바뀌면 몇 분치 trace 를 날린 뒤
    // 중간에 죽는 형태로 드러난다. 비용 0의 보험.
    for (var cc = 0; cc < sheetPairs.length; cc++) {
      sheetPairs[cc].cachedCutline = null;
      sheetPairs[cc].cutInfo = null;
      sheetPairs[cc].cachedArtGroup = null;
      sheetPairs[cc].cachedSymbol = null;
      sheetPairs[cc].symbolError = null;
      sheetPairs[cc].cutCacheHit = false;
    }

    var printLayer = doc.layers.add();
    printLayer.name = "PrintData";
    var kissLayer = doc.layers.add();
    kissLayer.name = "KissCut";
    var cutSpot = _ensureCutContour(doc);

    // 이름 스티커는 이제 **모든 모드**에서 만든다 (사용자 지정 2026-08-23).
    // 예전에는 Package 안에서만 만들어서, 다른 사이즈로 주문하면 다이얼로그에 이름을
    // 입력해도 아무 일도 일어나지 않았다 — 칸은 늘 보이는데 조용히 무시됐다.
    // 다중 시트여도 **첫 장에만**. 실측(_measurePhrase)에 문서가 필요해 여기서 만든다.
    var lblocks = (sIdx === 0) ? _nameStickersFor(doc, printLayer, options.stickerName) : null;

    var packResult;
    if (options.isPackage) {
      // 배분층이 사다리 시행으로 남긴 _colOnly 를 지우고 실제 배치에 들어간다.
      _resetPackState(sheetPairs);
      packResult = _packPackage(sheetPairs, ctx.binW, ctx.binH, gapPt, lblocks);
      packResult.letterBlocks = lblocks;
    } else if (options.isAllSizes) {
      packResult = _packAllSizes(sheetPairs, ctx.binW, ctx.binH, gapPt, lblocks);
      packResult.letterBlocks = lblocks;
      // 이름 블록은 사진 반복이 아니다 — 빼고 센다.
      var allsizesPhotos = 0;
      for (var ap = 0; ap < packResult.placed.length; ap++) {
        if (!packResult.placed[ap].payload.isLetterBlock) allsizesPhotos++;
      }
      packResult.repeatedCount = Math.max(0, allsizesPhotos - ALLSIZES_ORDER_MM.length);
    } else {
      packResult = _aspectBandGridPack(sheetPairs, ctx.binW, ctx.binH, gapPt, lblocks);
      packResult.letterBlocks = lblocks;
    }

    var uniquePairs = _uniquePairsFromPlaced(packResult.placed);
    var drawnDesigns = 0;      // 실제로 그려진 고유 디자인 수 (헤더·완료 메시지 공용)
    var failedBases = {};      // trace 실패 base — try 밖에 둬야 finally 에서 셀 수 있다
    var drawnBases = {};       // 실제로 그려진 base
    var letterInfo = null;
    var letterError = "";
    var failedItems = [];
    var skippedPlacements = 0;
    var prevInteraction = app.userInteractionLevel;
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
    try {
      var traceFailures = _buildCutlineCache(doc, uniquePairs, cutSpot);
      // trace 실패 base 를 set 으로 모아 placement 시도 자체를 skip — 같은 base 가 여러 번
      // "cache 없음" 에러를 내던 노이즈 제거. 운영자는 trace 실패 1건만 보고 재시도한다.
      for (var tf = 0; tf < traceFailures.length; tf++) {
        failedItems.push(traceFailures[tf]);
        failedBases[traceFailures[tf].base] = true;
      }

      for (var p = 0; p < packResult.placed.length; p++) {
        var pl = packResult.placed[p];
        if (pl.payload.isLetterBlock) {
          // 사진 파이프라인(trace/embed/심볼)을 전혀 타지 않는다 — 벡터를 그 자리에서 그린다.
          var aiXL = ctx.bL + ctx.padPt + pl.x;
          var aiYL = ctx.bT - ctx.padPt - pl.y;
          try {
            var oneInfo;
            if (pl.payload.isAlphabetBlock) {
              oneInfo = _drawLetterBlock(doc, pl.payload, aiXL, aiYL, printLayer, kissLayer, cutSpot);
            } else {
              oneInfo = _drawNameSticker(doc, pl.payload, aiXL, aiYL, printLayer, kissLayer, cutSpot);
            }
            if (!letterInfo) {
              letterInfo = { count: 0, pieces: 0, alphaPieces: 0, missingGlyphs: [], minCounterPt: null };
            }
            letterInfo.count += oneInfo.count;
            // 조각 수는 **최대값**을 본다 — 하나라도 낱글자로 떨어지면 알아야 한다.
            // 알파벳은 낱개가 정상이므로 따로 센다 (경고 대상이 아니다).
            if (oneInfo.piecesAreLetters) {
              if (oneInfo.pieces > letterInfo.alphaPieces) letterInfo.alphaPieces = oneInfo.pieces;
            } else if (oneInfo.pieces && oneInfo.pieces > letterInfo.pieces) {
              letterInfo.pieces = oneInfo.pieces;
            }
            for (var mg = 0; mg < oneInfo.missingGlyphs.length; mg++) {
              letterInfo.missingGlyphs.push(oneInfo.missingGlyphs[mg]);
            }
            if (oneInfo.minCounterPt !== null &&
                (letterInfo.minCounterPt === null || oneInfo.minCounterPt < letterInfo.minCounterPt)) {
              letterInfo.minCounterPt = oneInfo.minCounterPt;
            }
          } catch (eLB) {
            // trace 실패 목록에 섞으면 묻힌다 — 이름 스티커 줄에 직접 띄운다.
            // (2026-08-22: 상수 호이스팅 사고로 조용히 실패했고 원인을 늦게 찾았다)
            letterError = (eLB && eLB.message) ? eLB.message : String(eLB);
          }
          continue;
        }
        if (failedBases[pl.payload.base]) {
          skippedPlacements++;
          continue;
        }
        var aiX = ctx.bL + ctx.padPt + pl.x;
        var aiY = ctx.bT - ctx.padPt - pl.y;
        try {
          _placePhotoSticker(doc, pl.payload, aiX, aiY, pl.w, pl.h, cutMarginPt, printLayer, kissLayer, cutSpot, pl.rotated);
        } catch (ePlace) {
          failedItems.push({
            base: pl.payload.base,
            error: (ePlace && ePlace.message) ? ePlace.message : String(ePlace)
          });
        }
      }

      _safeRedrawAndGC();  // 배치당 redraw 제거 보상 — 시트 배치 완료 후 1회
    } finally {
      // 헤더는 **배치가 끝난 뒤** 찍는다. 예전에는 패킹 직후에 찍으면서 그 시트에
      // *배정된* 페어 수를 그대로 인쇄했는데, 자리가 없어 한 장도 안 들어간 디자인
      // (leftover) 과 trace 실패로 빠진 디자인이 그대로 포함돼 **인쇄물의 숫자가 틀렸다**
      // (2026-08-23: 30디자인 중 5개 미배치인데 헤더는 16 design(s) 로 나옴).
      // finally 인 이유: 배치 중 예외가 나도 헤더 없는 시트를 내보내지 않는다.
      drawnDesigns = 0;
      for (var dp = 0; dp < packResult.placed.length; dp++) {
        var dpay = packResult.placed[dp].payload;
        if (dpay.isLetterBlock) continue;        // 이름 블록은 디자인이 아니다
        if (failedBases[dpay.base]) continue;    // trace 실패 → 그리지 않았다
        if (drawnBases[dpay.base]) continue;
        drawnBases[dpay.base] = true;
        drawnDesigns++;
      }
      try {
        _drawProductionHeader(options, drawnDesigns, ctx.headerRightText, sIdx + 1, sheetTotal);
      } catch (eHdr) {}
      _cleanupTraceStash(doc);
      app.userInteractionLevel = prevInteraction;
    }

    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eKiss) {}
    try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (ePrint) {}
    doc.selection = null;

    // 03_output 자동 저장. stamp 는 호출부가 1회 계산해 넘긴다 — 시트끼리 초가 넘어가도
    // 같은 주문의 시트들이 같은 timestamp prefix 를 공유해 파일이 붙어 정렬된다.
    var savedPath = "";
    var saveError = "";
    try {
      var outFolder = _resolveOutputFolder(inputFolder);
      var sizeTag;
      if (options.isPackage) {
        sizeTag = "PKG";
      } else if (options.isAllSizes) {
        sizeTag = "ALL";
      } else {
        sizeTag = _inchStr(options.sizeMm);
      }
      var fileName = stamp + "_" + sizeTag + "_sheet" + _pad2(sIdx + 1) + ".ai";
      var saveFile = new File(outFolder.fsName + "/" + fileName);
      _saveAi(doc, saveFile);
      savedPath = saveFile.fsName;
    } catch (eSave) {
      saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
    }

    var rotatedCount = 0;
    for (var rc = 0; rc < packResult.placed.length; rc++) {
      if (packResult.placed[rc].rotated) rotatedCount++;
    }

    // 심볼 적용 집계 — 운영자가 "래스터 중복이 실제로 사라졌는지" 를 완료 메시지로 확인한다.
    var cutCacheHits = 0;
    for (var ch = 0; ch < uniquePairs.length; ch++) {
      if (uniquePairs[ch].cutCacheHit) cutCacheHits++;
    }

    var symbolOk = 0;
    var symbolFail = [];
    for (var sy = 0; sy < uniquePairs.length; sy++) {
      if (uniquePairs[sy].cachedSymbol) {
        symbolOk++;
      } else if (uniquePairs[sy].symbolError) {
        symbolFail.push(uniquePairs[sy].base + ": " + uniquePairs[sy].symbolError);
      }
    }

    return {
      doc: doc,
      pairs: sheetPairs,
      packResult: packResult,
      savedPath: savedPath,
      saveError: saveError,
      failedItems: failedItems,
      skippedPlacements: skippedPlacements,
      rotatedCount: rotatedCount,
      uniqueCount: uniquePairs.length,
      drawnDesigns: drawnDesigns,      // 실제 그려진 고유 디자인 (배정 수 아님)
      drawnBases: drawnBases,          // 그 base 집합 — 합계는 시트끼리 합집합으로 센다
      letterInfo: letterInfo,
      letterError: letterError,
      letterBlocks: packResult.letterBlocks || null,
      letterAttachedCount: packResult.letterAttachedCount || 0,
      letterWanted: packResult.letterWanted || 0,
      letterEvicted: packResult.letterEvicted || 0,
      letterFilled: packResult.letterFilled || 0,
      cutCacheHits: cutCacheHits,
      symbolOk: symbolOk,
      symbolFail: symbolFail,
      fill: _sheetFill(packResult, ctx.binW, ctx.binH)
    };
  }

  // 버킷 분포 표기 — "BIG 2 / MED 8 / SML 6"
  function _bucketDistStr(pairs) {
    var c = { BIG: 0, MED: 0, SML: 0 };
    for (var i = 0; i < pairs.length; i++) c[_bucketOf(pairs[i])]++;
    return "BIG " + c.BIG + " / MED " + c.MED + " / SML " + c.SML;
  }


  // 한 줄 함수 — alphabet 에서 이식할 때 종료 '}' 가 줄 끝에 있어 추출기가 범위를 넘겨
  // 잡았고 alphabet 의 testConfig/_fail 까지 딸려 들어왔다(제거함). 여러 줄로 풀지 말 것도,
  // 반대로 다른 한 줄 함수를 이 근처에 추가할 때도 같은 함정을 기억할 것.
  function C(r, g, b) { var c = new RGBColor(); c.red = r; c.green = g; c.blue = b; return c; }

  function _resolveFont(cands) {
    var i, f, k, w;
    for (i = 0; i < cands.length; i++) {
      try { return app.textFonts.getByName(cands[i]); } catch (e) {}
    }
    var wanted = [];
    for (i = 0; i < cands.length; i++) wanted.push(cands[i].toLowerCase().replace(/[^a-z0-9]/g, ""));
    for (f = 0; f < app.textFonts.length; f++) {
      var tfont = app.textFonts[f];
      var keys = [String(tfont.name), String(tfont.family) + String(tfont.style)];
      for (k = 0; k < keys.length; k++) {
        var norm = keys[k].toLowerCase().replace(/[^a-z0-9]/g, "");
        for (w = 0; w < wanted.length; w++) if (norm === wanted[w]) return tfont;
      }
    }
    return null;
  }

  function _hexToRGB(hex, fallback) {
    if (!hex) return fallback;
    var s = String(hex).replace(/^#/, "");
    if (!/^[0-9A-Fa-f]{6}$/.test(s)) return fallback;
    return C(parseInt(s.substring(0, 2), 16),
             parseInt(s.substring(2, 4), 16),
             parseInt(s.substring(4, 6), 16));
  }

  // 프레임 채우기. 스트로크는 이 뒤에 따로 얹는다 (여기서는 항상 끈다).
  function _setSolidFill(item, colorObj) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) _setSolidFill(item.pageItems[i], colorObj);
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) _setSolidFill(item.pathItems[j], colorObj);
        return;
      }
      if (item.typename === "PathItem") {
        item.stroked = false;
        item.filled = true;
        item.fillColor = colorObj;
      }
    } catch (e) {}
  }

  function _gatherPaths(item, out) {
    if (!item) return;
    try {
      if (item.typename === "PathItem") { out.push(item); return; }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) out.push(item.pathItems[j]);
        return;
      }
      if (item.typename === "GroupItem") {
        for (var g = 0; g < item.pageItems.length; g++) _gatherPaths(item.pageItems[g], out);
        return;
      }
      if (item.typename === "Layer") {
        for (var L = 0; L < item.pageItems.length; L++) _gatherPaths(item.pageItems[L], out);
      }
    } catch (e) {}
  }

  // 글자 속구멍(카운터)의 최소 폭 (pt). 인쇄에서 메워지는지 판단하는 수치다.
  // 다른 패스 bbox 안에 들어 있는 subpath = 구멍. 그 중 가장 좁은 변을 돌려준다.
  // 구멍이 없는 글자(I·L·V…)만 있으면 -1.
  function _minCounterPt(ink) {
    var paths = [];
    _gatherPaths(ink, paths);
    var b = [];
    for (var i = 0; i < paths.length; i++) {
      try { b.push(paths[i].geometricBounds); } catch (e) { b.push(null); }
    }
    var min = -1;
    for (var p = 0; p < b.length; p++) {
      if (!b[p]) continue;
      var inner = false;
      for (var q = 0; q < b.length; q++) {
        if (p === q || !b[q]) continue;
        if (b[p][0] >= b[q][0] && b[p][2] <= b[q][2] &&
            b[p][1] <= b[q][1] && b[p][3] >= b[q][3]) { inner = true; break; }
      }
      if (!inner) continue;
      var w = b[p][2] - b[p][0];
      var h = b[p][1] - b[p][3];
      var m = (w < h) ? w : h;
      if (min < 0 || m < min) min = m;
    }
    return min;
  }




















  // ══ 이름 스티커 블록 (알파벳 프레임, 2026-08-22) ═══════════════════
  // 레퍼런스 시트(20260822_090157_PKG_sheet01) 실측에서 파생:
  //   유닛 9.5mm · 간격 2.3mm · 6열 · 프레임 9종 원부터 순환 · 키라인 유닛의 1.7%
  // 6열이 상한인 이유: XXL 히어로(63.5mm) 옆 잔여폭이 138-63.5-2.5 = 72mm 이고
  //   6열 = 6×9.5 + 5×2.3 = 68.5mm 로 딱 들어간다. 7열이면 80.3mm 로 넘친다.
  // 블록은 **패커의 tier 체계 밖**이다 — 한 덩어리로 히어로 행에 붙인다.




  // 블록을 행에 붙인다. 1순위 = 가장 높은 행(정렬 후 rows[0] = 히어로 행) 오른쪽.
  // 폭이 모자라면 다른 행을 훑고, 그래도 안 되면 맨 아래 새 행. 전부 실패면 false.
  // 반환값이 false 여도 시트 제작은 계속된다 — 완료 메시지에 미배치로 보고.

  // ══ 이름 스티커 (캘리그라피 통짜 단어) ═══════════════════════════════
  // 크기 기준은 **높이**다 — 폭은 이름 길이에 따라 늘어난다 (Bagel Fat One 기준
  // 높이 9.5mm 에서 "하린" 17mm, "Harin" 28mm, "Christopher" 46mm).
  // 0.75" 원에 내접시키는 안(案)은 폐기 — 긴 이름이 잉크 3mm 까지 깎여 컷이 위험했다.
  // 대신 "0.75" 스티커와 비슷한 존재감" 으로 읽어 높이를 고정하고 폭은 풀어준다.

  // 이름 스티커 1개 스펙을 만든다. **문서가 필요하다** — 아웃라인 실측을 해야
  // 목표 높이가 맞는다 (TextFrame.geometricBounds 는 폰트 메트릭 박스라 못 쓴다).
  // 실측 실패(글리프 없음)면 null.
  function _nameStickerSpec(sheetDoc, printL, text, heightMm, tag, inkHex) {
    var font = _resolveFont(NAME_FONT_CANDS);
    if (!font) return null;
    // Bagel Fat One 은 한글 음절을 가졌으므로 폴백 override 를 걸지 않는다
    // (걸면 한글만 다른 서체가 돼 이름이 두 서체로 쪼개진다).
    var m = _measurePhrase(sheetDoc, printL, text, font, true, NAME_BOUNCE_SCALE);
    if (!m) return null;

    var targetHPt = heightMm * MM_TO_PT;
    var haloPt = heightMm * NAME_HALO_RATIO * MM_TO_PT;
    var inkH = targetHPt - 2 * haloPt;
    if (inkH <= 0) return null;
    var scale = inkH / m.h;
    return {
      base: "__NAME_" + tag + "__",
      isLetterBlock: true,          // 패커 payload 마커 (이름 유지 — 배치 분기가 이걸 본다)
      text: text,
      font: font,
      inkColor: _hexToRGB(inkHex, INK),
      haloPt: haloPt,
      fontSizePt: PROBE_SIZE_PT * scale,
      cellW: m.w * scale + 2 * haloPt,
      cellH: targetHPt,
      aspect: 1
    };
  }

  // 알파벳 블록의 크기 후보 = **유닛 단계** (큰 것부터).
  // 예전에는 글자를 열 수로 다시 접는 후보였는데, "단어 = 한 줄" 규칙이 생기면서
  // 줄 구성이 고정됐다 — 이제 남은 조절 손잡이는 유닛 크기 하나뿐이다.
  function _letterShapeCandidates(block) {
    var out = [];
    for (var i = 0; i < LETTER_UNIT_STEPS_MM.length; i++) {
      var u = LETTER_UNIT_STEPS_MM[i] * MM_TO_PT;
      var g = u * LETTER_GAP_RATIO;
      out.push({
        unitMm: LETTER_UNIT_STEPS_MM[i],
        w: block.maxLen * u + (block.maxLen - 1) * g,
        h: block.lines.length * u + (block.lines.length - 1) * g
      });
    }
    return out;
  }

  // 이름 스티커 = **알파벳 프레임 1개 + 캘리 통짜 N개** (사용자 지정 2026-08-23).
  //   · 알파벳 = 글자를 도형 프레임에 하나씩. 히어로 사진 **옆**에 놓는다 (preferHero).
  //   · 캘리   = 이름 통짜 단어. 남은 **빈 공간**을 채운다 (높이가 가까운 행).
  // 둘은 생김새가 완전히 달라 역할이 갈린다 — 알파벳이 눈에 띄는 구성, 캘리가 채움.
  // 붙이는 순서도 이 순서다 (알파벳이 히어로 옆 자리를 먼저 잡아야 한다).
  function _nameStickersFor(sheetDoc, printL, nameText) {
    var out = [];
    if (!nameText) return out;
    var text = _nfcHangul(String(nameText));   // macOS NFD 자모 → 음절
    if (!text) return out;

    var alpha = _letterBlockSpec(text, LETTER_UNIT_MM, "ALPHA");
    if (alpha) {
      alpha.isAlphabetBlock = true;
      alpha.preferHero = true;
      // 모양 후보를 들고 간다 — 부착 시점에 행 여유를 보고 고른다 (아래 _attachLetterBlock).
      alpha.shapes = _letterShapeCandidates(alpha);
      out.push(alpha);
    }
    for (var i = 0; i < NAME_CALLI_COUNT; i++) {
      var hex = NAME_INK_HEXES[i % NAME_INK_HEXES.length];
      var h = (i === 0) ? NAME_BIG_H_MM : NAME_SMALL_H_MM;
      var sm = _nameStickerSpec(sheetDoc, printL, text, h, "C" + (i + 1), hex);
      if (sm) { sm.preferHero = false; out.push(sm); }
    }
    return out;
  }

  // 실제로 그린다. **칼선은 흰 테두리와 같은 도형**이라 여기서 함께 만들어진다 —
  // 미리 만든 칼선을 가져오지 않는다 (사용자 지정).
  function _drawNameSticker(sheetDoc, spec, x, y, printL, kissL, cutSpot) {
    var cfg = {
      font: spec.font,
      fontIsHangul: true,
      inkColor: spec.inkColor,
      bounceScale: NAME_BOUNCE_SCALE,
      shadow: false,
      shadowColor: null,
      layered: false,          // 컬러 배경은 사진과 주인공을 다툰다 — 심플 고정
      bgColor: null,
      bgPt: 0,
      borderPt: spec.haloPt,
      outerPt: spec.haloPt
    };
    var unit = { text: spec.text, fontSizePt: spec.fontSizePt };
    var built = _buildCalliSticker(sheetDoc, printL, kissL, cutSpot, unit, cfg, x, y, 0);
    // 여백 0 이면 _buildCalliSticker 가 만든 바깥 도형은 글자와 같은 크기라 인쇄에
    // 보이지도 않고 글자 속구멍만 흰색으로 메운다 — PrintData 에서 지운다.
    // 칼선(built.cut)은 그 도형의 복제본이라 이미 KissCut 에 있고 영향받지 않는다.
    if (spec.haloPt <= 0) {
      try { built.outer.remove(); } catch (eRmOuter) {}
    }
    return { count: 1, pieces: built.pieces, missingGlyphs: [], minCounterPt: null };
  }

  function _attachLetterBlock(rows, block, binW, binH, gap) {
    var item = { w: block.cellW, h: block.cellH, payload: block, rotated: false };
    // 붙일 행 고르기 — 블록 성격에 따라 기준이 다르다.
    //   preferHero (알파벳 블록) : 가장 **높은** 행 = 히어로 사진 옆. 정사각에 가까워
    //     히어로 행 높이를 잘 쓴다. 레퍼런스 시트의 그 자리.
    //   그 외 (캘리 통짜)        : 높이가 가장 **가까운** 행. 7~9.5mm 얇은 가로 띠라
    //     45mm 히어로 행에 붙이면 그 아래가 통째로 죽는다 (충전 78%→64~71% 실측).
    // 행 키를 키우면 아래 행과 겹치므로 item.h <= row.h 인 행 중에서만 고른다.
    // 크기 후보가 있으면 (알파벳 블록) 행마다 유닛 단계를 전부 시도한다.
    // **하이브리드** (사용자 지정 2026-08-23): 큰 유닛으로 히어로 옆을 먼저 노리고,
    // 안 들어가면 유닛을 한 단계씩 낮춰서라도 그 자리를 지킨다. 그래도 안 되면
    // 아래의 전폭 새 행으로 떨어진다.
    // **유닛 후보는 알파벳 블록만 갖는다.** 캘리 통짜는 lines/maxLen/unitMm 자체가 없어서
    // _letterBlockResize 를 태우면 치수가 NaN 이 된다 — 반드시 갈라서 처리할 것.
    var shapes = block.shapes;
    var unitBased = !!(shapes && shapes.length > 0);
    if (!unitBased) {
      shapes = [{ unitMm: block.unitMm, w: block.cellW, h: block.cellH }];
    }
    var best = -1, bestShape = null, bestScore = -1;
    var binArea = binW * binH;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var sh = 0; sh < shapes.length; sh++) {
        var cand = shapes[sh];
        if (row.w + gap + cand.w > binW) continue;
        if (cand.h > row.h) continue;
        var score;
        if (block.preferHero) {
          // 우선순위를 자릿수로 갈라 사전식으로 비교한다 (작을수록 좋음):
          //   ① 가장 높은 행(=히어로 옆)  ② 가장 큰 유닛  ③ 낭비 최소.
          // 낭비는 **면적 비율**로 정규화해야 ②와 자릿수가 안 겹친다 — 절대 면적(pt²)은
          // 최대 19만이라 유닛 항(×1000)을 삼켜버린다.
          var underDead = cand.w * (row.h - cand.h);
          var rightDead = (binW - row.w - gap - cand.w) * row.h;
          var wasteRatio = binArea > 0 ? (underDead + rightDead) / binArea : 0;
          score = -row.h * 1000000 - cand.unitMm * 1000 + wasteRatio;
        } else {
          score = row.h - cand.h;    // 캘리 = 높이가 가까운 행
        }
        if (best < 0 || score < bestScore) { best = r; bestShape = cand; bestScore = score; }
      }
    }
    if (best >= 0) {
      if (unitBased) _letterBlockResize(block, bestShape.unitMm);
      item.w = block.cellW;
      item.h = block.cellH;
      _addToShelfRow(rows[best], item, gap);
      return true;
    }

    // 전폭 새 행 — 폭 예산이 시트 전체(binW)로 넓어지므로 **유닛을 다시 크게** 잡는다.
    // 히어로 옆에서 7mm 로 깎였더라도 여기서는 9.5mm 가 들어갈 수 있다.
    if (unitBased) {
      var newUnitMm = -1;
      for (var sh2 = 0; sh2 < shapes.length; sh2++) {
        if (shapes[sh2].w <= binW) { newUnitMm = shapes[sh2].unitMm; break; }
      }
      if (newUnitMm < 0) {
        // 후보가 전부 시트 폭을 넘는 아주 긴 단어 — 폭에 딱 맞는 유닛을 계산한다.
        // 하한 밑이면 배치를 포기한다 (조용히 넘기지 않고 false 로 보고).
        var fitMm = _letterUnitToFit(block.maxLen, binW);
        if (fitMm < LETTER_UNIT_MIN_MM) return false;
        newUnitMm = fitMm;
      }
      _letterBlockResize(block, newUnitMm);
      item.w = block.cellW;
      item.h = block.cellH;
    }
    var usedH = 0;
    for (var k = 0; k < rows.length; k++) usedH += rows[k].h + gap;
    if (usedH + item.h <= binH && item.w <= binW) {
      var nr = _newShelfRow(usedH);
      nr.tierLock = "__NAME__";
      _addToShelfRow(nr, item, gap);
      rows.push(nr);
      return true;
    }
    return false;
  }


  // 행에서 아이템을 뺀 뒤 폭·높이를 다시 잰다. 높이는 **줄어들 수 있다** — 가장 높은
  // 아이템을 뺐다면 아래 행들이 그만큼 위로 당겨진다 (_shelfRowsToPlaced 가 row.y 를
  // 안 쓰고 row.h 로 다시 쌓기 때문에 자동으로 반영된다).
  function _recalcShelfRow(row, gap) {
    var w = 0, h = 0;
    for (var i = 0; i < row.items.length; i++) {
      w = (i === 0) ? row.items[i].w : w + gap + row.items[i].w;
      if (row.items[i].h > h) h = row.items[i].h;
    }
    row.w = w;
    row.h = h;
  }

  // 박스(boxW × boxH) 안에 사진을 shelf 로 채운다. 반환 = {dx,dy,w,h,payload} 배열.
  //   이름 블록 **아래에 남는 죽은 공간**을 메우는 데 쓴다 (사용자 지정 2026-08-24:
  //   "정렬을 맨위로 하고 남은 공간에 스티커를 출력").
  //   매 칸마다 **지금까지 가장 적게 나온 디자인**을 고른다 (동률이면 큰 것) — 자투리를
  //   한 디자인이 독식하면 시트가 단조로워진다.
  //   canUse(p, used) 는 **순수 판정**이어야 한다 — counts 갱신은 호출부가 결과를 보고 한다.
  function _packBoxWithPairs(pairs, boxW, boxH, gap, canUse) {
    var cells = [];
    if (!pairs || pairs.length === 0 || boxW <= 0 || boxH <= 0) return cells;
    var used = {};
    var y = 0;
    var spins = 0;
    while (y < boxH && spins++ < 60) {
      var shelf = [];
      var x = 0, shelfH = 0;
      while (shelf.length < 24) {
        var best = -1, bestKey = 0;
        for (var i = 0; i < pairs.length; i++) {
          var p = pairs[i];
          var nx = shelf.length === 0 ? p.cellW : x + gap + p.cellW;
          if (nx > boxW) continue;
          var nh = p.cellH > shelfH ? p.cellH : shelfH;
          if (y + nh > boxH) continue;
          if (canUse && !canUse(p, used)) continue;
          var key = (used[p.base] || 0) * 1000000000 - p.cellW * p.cellH;
          if (best < 0 || key < bestKey) { best = i; bestKey = key; }
        }
        if (best < 0) break;
        var pick = pairs[best];
        var dx = shelf.length === 0 ? 0 : x + gap;
        // payload 래퍼 지원: 전 사이즈는 같은 pair 를 크기별 후보로 여러 개 만든다.
        shelf.push({ dx: dx, dy: y, w: pick.cellW, h: pick.cellH,
                     payload: pick.payload ? pick.payload : pick });
        x = dx + pick.cellW;
        if (pick.cellH > shelfH) shelfH = pick.cellH;
        used[pick.base] = (used[pick.base] || 0) + 1;
      }
      if (shelf.length === 0) break;
      for (var s2 = 0; s2 < shelf.length; s2++) {
        shelf[s2].dy = y + (shelfH - shelf[s2].h) / 2;   // 줄 안에서 세로 가운데
        cells.push(shelf[s2]);
      }
      y += shelfH + gap;
    }
    return cells;
  }

  // 이름 블록을 **행 맨 위로 붙이고 그 아래 남는 공간을 사진으로 채운다.**
  // 이름은 7~9.5mm 얇은 띠인데 히어로 행은 45~63mm 라, 예전에는 이름이 행 한가운데 떠서
  // 위아래가 통째로 죽었다 (실시트 2026-08-24: 68×53mm 가 빈 채로 나감).
  // 채운 결과는 **composite 아이템** 하나로 묶는다 — 패킹 기하(행 폭·높이)는 안 건드리고
  // 죽어 있던 안쪽만 쓴다. 반환 = 새로 들어간 셀 배열 (호출부가 counts 를 갱신한다).
  function _fillUnderLetterBlocks(rows, pairs, gap, canUse) {
    var addedCells = [];
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var i = 0; i < row.items.length; i++) {
        var it = row.items[i];
        if (it.isComposite) continue;                       // 이미 채움
        if (!it.payload || !it.payload.isLetterBlock) continue;
        var availH = row.h - it.h - gap;
        if (availH <= 0) continue;
        var cells = _packBoxWithPairs(pairs, it.w, availH, gap, canUse);
        if (cells.length === 0) continue;
        var comp = [{ dx: 0, dy: 0, w: it.w, h: it.h, payload: it.payload }];
        var bottom = it.h;
        for (var c = 0; c < cells.length; c++) {
          cells[c].dy += it.h + gap;
          comp.push(cells[c]);
          if (cells[c].dy + cells[c].h > bottom) bottom = cells[c].dy + cells[c].h;
          addedCells.push(cells[c]);
        }
        row.items[i] = {
          isComposite: true,
          w: it.w,
          h: bottom,
          cells: comp,
          payload: it.payload      // 이름 블록 판정(_moveLetterBlocksToRowEnd 등)이 계속 통하도록
        };
      }
    }
    return addedCells;
  }

  // 한 아이템이 품은 디자인 base 목록. **vstack column 은 payload 가 없고 cells 안에**
  // 여러 장을 들고 있다 — 그걸 놓치면 column 을 뺄 때 카운트가 안 맞는다.
  function _itemBases(item) {
    var out = [];
    if (item.isComposite && item.cells) {
      for (var k = 0; k < item.cells.length; k++) {
        var cp = item.cells[k].payload;
        if (cp && !cp.isLetterBlock) out.push(cp.base);
      }
    } else if (item.isVStack && item.cells) {
      for (var c = 0; c < item.cells.length; c++) {
        if (item.cells[c].payload) out.push(item.cells[c].payload.base);
      }
    } else if (item.payload) {
      out.push(item.payload.base);
    }
    return out;
  }

  // Package 용 보호 조건: **그 디자인의 마지막 한 장은 못 뺀다.** 이름 때문에 디자인이
  // 통째로 사라지면 leftover 집계와 "각 디자인 ≥1장" 이 동시에 깨진다.
  // (전 사이즈의 _lastOfSizeGuard 와 같은 이유, 기준만 사이즈 → 디자인)
  function _lastCopyGuard(counts) {
    return function (item, planned) {
      var bases = _itemBases(item);
      for (var i = 0; i < bases.length; i++) {
        var b = bases[i];
        if (counts[b] == null) continue;
        var already = 0;
        for (var q = 0; q < planned.length; q++) {
          var pb = _itemBases(planned[q]);
          for (var j = 0; j < pb.length; j++) if (pb[j] === b) already++;
        }
        if (counts[b] - already <= 1) return false;
      }
      return true;
    };
  }

  // 이름 블록 자리를 만들려고 **사진을 뺀다**. 뺀 개수를 돌려주고, 못 만들면 -1.
  //
  // 왜 필요한가: 단일 사이즈·전 사이즈 시트는 디자인이 모자라면 반복 채움으로 슬롯을
  // 전부 메운다. 그래서 "자리가 남으면 넣는다" 는 곧 **"이름이 영원히 안 나온다"** 는
  // 뜻이다. 사용자 지정 (2026-08-23): 사진을 몇 장 빼서라도 이름을 넣는다.
  // Package 는 시트가 꽉 차지 않아 이 단계가 필요 없다 — 기존 부착 로직 그대로 둔다.
  //
  // 고르는 기준: **가장 적게 빼는** (행, 크기 후보). 같은 개수면 큰 유닛을 쓴다.
  // 행 오른쪽 끝부터 뺀다 — 왼쪽(히어로·상단 미감)은 마지막까지 지킨다.
  // 크기 후보 목록으로 "어느 행에서 몇 장 빼면 들어가는지" 를 찾는다.
  //   고르는 기준: **가장 적게 빼는** (행, 후보). 같은 개수면 큰 유닛.
  //   행 오른쪽 끝부터 뺀다 — 왼쪽(히어로·상단 미감)은 마지막까지 지킨다.
  // 못 찾으면 row = -1.
  function _searchEvictSlot(rows, shapes, binW, binH, gap, canEvict) {
    // 행을 키워야 하는 경우를 판정하려면 전체 높이를 알아야 한다. 여러 줄 이름
    // ("Anne Marie Kim" = 3줄 35mm) 은 1인치 행(25.4mm)보다 높아서, 행 키우기를
    // 금지하면 어느 행에도 못 들어간다.
    var sumH = 0;
    for (var hs = 0; hs < rows.length; hs++) sumH += rows[hs].h;

    var bestRow = -1, bestShape = null, bestCut = -1;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      if (row.items.length === 0) continue;
      for (var sh = 0; sh < shapes.length; sh++) {
        var cand = shapes[sh];
        if (cand.w > binW) continue;
        // 행이 커지면 아래 행이 밀린다 — 시트가 그만큼을 흡수할 수 있을 때만 허용.
        // (row.h 는 뺀 뒤 더 낮아질 수 있으므로 이 판정은 보수적이다 = 안전하다)
        var grow = cand.h > row.h ? cand.h - row.h : 0;
        if (grow > 0 && sumH + grow + (rows.length - 1) * gap > binH) continue;
        var w = row.w, blocked = false;
        var planned = [];        // 이번 시도에서 뺄 아이템 — 보호 조건이 같이 본다
        var k = row.items.length - 1;
        while (w + gap + cand.w > binW && k >= 0) {
          var vic = row.items[k];
          // 이미 붙은 이름 블록은 못 뺀다. 보호 조건(전 사이즈 ≥1장 보장)도 여기서 본다.
          // **planned 를 같이 넘기는 이유**: 후보를 여러 번 시도하므로 보호 조건이
          // 상태를 들고 있으면 안 된다 (시도마다 카운트가 깎여 오판한다).
          if ((vic.payload && vic.payload.isLetterBlock) || (canEvict && !canEvict(vic, planned))) {
            blocked = true;
            break;
          }
          w -= vic.w + gap;
          planned.push(vic);
          k--;
        }
        if (blocked) continue;
        if (w + gap + cand.w > binW) continue;   // 다 빼도 안 들어감
        var cut = planned.length;
        if (bestRow < 0 || cut < bestCut ||
            (cut === bestCut && bestShape && cand.unitMm > bestShape.unitMm)) {
          bestRow = r; bestShape = cand; bestCut = cut;
        }
      }
    }
    return { row: bestRow, shape: bestShape, cut: bestCut };
  }

  function _evictForLetterBlock(rows, block, binW, binH, gap, canEvict, onEvict) {
    var unitBased = !!(block.shapes && block.shapes.length > 0);
    var shapes = unitBased
      ? block.shapes
      : [{ unitMm: block.unitMm, w: block.cellW, h: block.cellH }];

    var first = _searchEvictSlot(rows, shapes, binW, binH, gap, canEvict);
    var bestRow = first.row, bestShape = first.shape, bestCut = first.cut;

    // 정상 단계로 못 찾았고 유닛 기반(알파벳)이면 **마지막 수단** 단계로 한 번 더.
    // 2단으로 나눈 이유: 한 목록에 섞으면 "적게 빼는" 점수가 작은 유닛을 먼저 뽑아
    // 멀쩡히 들어갈 자리에도 글자가 작아진다.
    if (bestRow < 0 && unitBased) {
      var tight = [];
      for (var ti = 0; ti < LETTER_UNIT_TIGHT_STEPS_MM.length; ti++) {
        var tu = LETTER_UNIT_TIGHT_STEPS_MM[ti] * MM_TO_PT;
        var tg = tu * LETTER_GAP_RATIO;
        tight.push({
          unitMm: LETTER_UNIT_TIGHT_STEPS_MM[ti],
          w: block.maxLen * tu + (block.maxLen - 1) * tg,
          h: block.lines.length * tu + (block.lines.length - 1) * tg
        });
      }
      var deep = _searchEvictSlot(rows, tight, binW, binH, gap, canEvict);
      bestRow = deep.row; bestShape = deep.shape; bestCut = deep.cut;
    }
    if (bestRow < 0) return -1;

    var target = rows[bestRow];
    for (var e = 0; e < bestCut; e++) {
      var gone = target.items.pop();
      if (onEvict) onEvict(gone);      // 호출부가 카운트를 맞춘다 (min 판정의 SOT)
    }
    _recalcShelfRow(target, gap);
    if (unitBased) _letterBlockResize(block, bestShape.unitMm);
    _addToShelfRow(target, { w: block.cellW, h: block.cellH, payload: block, rotated: false }, gap);
    return bestCut;
  }

  // 이름 블록을 그 행의 **맨 끝(= 오른쪽 가장자리)** 으로 옮긴다. 사용자 지정 2026-08-23.
  //
  // 왜 따로 필요한가: 이름은 히어로 잔여 폭을 선점하려고 **column 단계보다 먼저** 붙는다
  // ([[_packPackage]] 의 부착 순서 — 뒤에 붙이면 자리가 없다). 그런데 _shelfRowsToPlaced 는
  // items 배열 순서대로 좌→우로 편다. 그래서 나중에 붙은 사진 column 이 이름 **오른쪽**에
  // 놓여 이름이 한가운데 끼는 그림이 됐다 (실시트 2026-08-23).
  // 폭은 이미 확보돼 있으므로 **순서만** 바꾸면 된다 — 기하는 하나도 안 건드린다.
  function _moveLetterBlocksToRowEnd(rows) {
    for (var r = 0; r < rows.length; r++) {
      var items = rows[r].items;
      var keep = [];
      var blocks = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].payload && items[i].payload.isLetterBlock) blocks.push(items[i]);
        else keep.push(items[i]);
      }
      if (blocks.length === 0) continue;
      rows[r].items = keep.concat(blocks);
    }
  }

  // 세 패커가 공유하는 이름 블록 부착 단계: ① 빈 자리 → ② 안 되면 사진을 빼서 자리 확보.
  function _applyLetterBlocks(rows, letterBlocks, binW, binH, gap, canEvict, onEvict) {
    var res = { wanted: 0, attached: 0, evicted: 0 };
    if (!letterBlocks || letterBlocks.length === 0) return res;
    res.wanted = letterBlocks.length;
    for (var i = 0; i < letterBlocks.length; i++) {
      if (_attachLetterBlock(rows, letterBlocks[i], binW, binH, gap)) { res.attached++; continue; }
      var ev = _evictForLetterBlock(rows, letterBlocks[i], binW, binH, gap, canEvict, onEvict);
      if (ev >= 0) { res.attached++; res.evicted += ev; }
    }
    if (res.attached > 0) _moveLetterBlocksToRowEnd(rows);
    return res;
  }

  // 전 사이즈 모드용 보호 조건: **그 사이즈의 마지막 한 장은 못 뺀다.**
  // ALLSIZES_ORDER_MM 의 "각 사이즈 ≥1장" 보장을 이름 때문에 깨면 안 된다.
  function _lastOfSizeGuard(rows) {
    var count = {};
    for (var r = 0; r < rows.length; r++) {
      for (var i = 0; i < rows[r].items.length; i++) {
        var it = rows[r].items[i];
        if (it.sizeMm == null) continue;
        count[it.sizeMm] = (count[it.sizeMm] || 0) + 1;
      }
    }
    // **상태를 안 들고 있는다.** 이번 시도에서 이미 빼기로 한 것(planned)을 매번 다시 세서
    // 판정한다 — 카운트를 깎으면 여러 후보를 시도하는 동안 값이 오염된다.
    return function (item, planned) {
      if (item.sizeMm == null) return true;
      var already = 0;
      for (var q = 0; q < planned.length; q++) {
        if (planned[q].sizeMm === item.sizeMm) already++;
      }
      return (count[item.sizeMm] || 0) - already > 1;
    };
  }

  function _newShelfRow(y) {
    return { y: y, w: 0, h: 0, items: [] };
  }

  // _snapPack — Model B atomic tier-pass 롤백용 스냅샷 (밴드 행 배열 전체).
  //   row 객체와 items 배열은 새로 복제(slice), item 객체 자체는 추가 후 내부 변형이 없어 공유 OK.
  //   tierLock 보존. 롤백 = 호출부에서 rows 를 반환값으로 재대입 → pass 중 추가분·신규행 전부 폐기.
  function _snapPack(rowsArr) {
    var rs = [];
    for (var i = 0; i < rowsArr.length; i++) {
      var r = rowsArr[i];
      rs.push({ y: r.y, w: r.w, h: r.h, items: r.items.slice(), tierLock: r.tierLock });
    }
    return rs;
  }

  function _canAddToShelfRow(row, item, binW, binH, gap) {
    if (item.w > binW || item.h > binH) return false;
    var nextW = row.items.length > 0 ? row.w + gap + item.w : item.w;
    var nextH = row.h > item.h ? row.h : item.h;
    return nextW <= binW && row.y + nextH <= binH;
  }

  // 높이 유사성 게이트 (v22) — 두 높이의 비율이 BAND_CELL_TOL 이상이면 같은 행에 어울림.
  // Package 밴드 행 (_tryAddToBandRow) 전용: 방향·비율 혼합 여백 (키 작은 아이템 위아래
  // 공백) 방지. 전 사이즈 (ALL) 모드는 게이트 없이 v21 동작 유지 — 사용자 결정 (2026-08-19).
  function _heightsClose(h1, h2) {
    var lo = h1 < h2 ? h1 : h2;
    var hi = h1 < h2 ? h2 : h1;
    return lo >= hi * BAND_CELL_TOL;
  }

  function _addToShelfRow(row, item, gap) {
    row.w = row.items.length > 0 ? row.w + gap + item.w : item.w;
    if (item.h > row.h) row.h = item.h;
    row.items.push(item);
  }

  // 행 정렬 정책 (가로·세로 모두 min-gap):
  //   - 가로(per-row): 여유 충분하면 균등 justify(outer=inner=(binW-ΣitemW)/(n+1)), 빡빡하면 inner = 최소 gap
  //     보장하고 남는 건 outer L/R 로 (cutMargin 0 에서 가로 붙음 방지).
  //   - 세로: 여유 충분하면 균등(outer=inner=(binH-ΣrowH)/(R+1)), 빡빡하면 inner 행 간격 = 최소 gap
  //     보장하고 남는 공간만 outer top/bottom 으로 (cutMargin 0 에서 행끼리 붙는 것 방지).
  //   - 행 안 사진 높이 차이는 row 안 center 정렬로 균등 분산
  //   - 입력 gap = packing decision + 가로·세로 inner 최소 간격.
  //   결과: 인접 사진 간격(가로·세로) ≥ gap 보장.

  function _shelfRowsToPlaced(rows, binW, binH, gap) {
    var placed = [];
    if (!rows || rows.length === 0) return placed;

    var R = rows.length;
    var sumH = 0;
    for (var k = 0; k < R; k++) sumH += rows[k].h;

    // 세로: 여유 충분하면 균등 justify, 빡빡하면 inner 행 간격 = 최소 gap 보장(패커가 행 사이 gap 을
    //   이미 확보해 binH 에 맞췄으므로 inner=gap 강제는 오버플로우 없음). 남는 공간만 outer top/bottom 으로.
    var justifyVGap = (binH - sumH) / (R + 1);
    if (justifyVGap < 0) justifyVGap = 0;
    var vGap = justifyVGap >= gap ? justifyVGap : gap;
    var topV = (binH - sumH - (R - 1) * vGap) / 2;
    if (topV < 0) { vGap = justifyVGap; topV = justifyVGap; }

    var yCursor = topV;
    for (var r = 0; r < R; r++) {
      var row = rows[r];
      var n = row.items.length;
      if (n === 0) continue;

      var sumW = 0;
      for (var i = 0; i < n; i++) sumW += row.items[i].w;

      // 가로 (per-row): 여유 충분하면 균등 justify, 빡빡하면 inner = 최소 gap 보장(패커가 확보, 오버플로우 없음).
      var justifyHGap = (binW - sumW) / (n + 1);
      if (justifyHGap < 0) justifyHGap = 0;
      var hGap = justifyHGap >= gap ? justifyHGap : gap;
      var xLeft = (binW - sumW - (n - 1) * hGap) / 2;
      if (xLeft < 0) { hGap = justifyHGap; xLeft = justifyHGap; }

      var xCursor = xLeft;
      for (var j = 0; j < n; j++) {
        var item = row.items[j];

        // Composite item (이름 블록 + 그 아래 채움): 셀이 자기 오프셋을 들고 있다.
        //   **위 정렬** — 이름이 행 맨 위에 붙어야 아래 채움이 이어진다 (사용자 지정).
        if (item.isComposite) {
          for (var ci = 0; ci < item.cells.length; ci++) {
            var cCell = item.cells[ci];
            placed.push({
              x: xCursor + cCell.dx, y: yCursor + cCell.dy,
              w: cCell.w, h: cCell.h, payload: cCell.payload
            });
          }
          xCursor += item.w + hGap;
          continue;
        }

        // VStack item (AllSizes backfill): 이종 셀 세로 스택으로 expand. 셀별 payload 를 갖고,
        //   각 셀은 슬롯 폭 안에서 가로 center, 스택 전체는 row 안에서 세로 center.
        if (item.isVStack) {
          var vY = yCursor + (row.h - item.h) / 2;
          for (var vc = 0; vc < item.cells.length; vc++) {
            var vCell = item.cells[vc];
            placed.push({ x: xCursor + (item.w - vCell.w) / 2, y: vY, w: vCell.w, h: vCell.h, payload: vCell.payload });
            vY += vCell.h + gap;
          }
          xCursor += item.w + hGap;
          continue;
        }

        var yCentered = yCursor + (row.h - item.h) / 2;
        placed.push({ x: xCursor, y: yCentered, w: item.w, h: item.h, payload: item.payload, rotated: item.rotated });
        xCursor += item.w + hGap;
      }

      yCursor += row.h + vGap;
    }
    return placed;
  }

  function _sortedPairsForShelf(pairs, ascending) {
    var result = [];
    for (var i = 0; i < pairs.length; i++) result.push(pairs[i]);
    result.sort(function (a, b) {
      var ah = a.cellH;
      var bh = b.cellH;
      var aa = a.cellW * a.cellH;
      var bb = b.cellW * b.cellH;
      if (ah !== bh) return ascending ? (ah - bh) : (bh - ah);
      if (aa !== bb) return ascending ? (aa - bb) : (bb - aa);
      return a.base < b.base ? -1 : (a.base > b.base ? 1 : 0);
    });
    return result;
  }

  function _trim(s) {
    return String(s).replace(/^\s+|\s+$/g, "");
  }

  function _todayIso() {
    var d = new Date();
    return d.getFullYear() + "-" + _pad2(d.getMonth() + 1) + "-" + _pad2(d.getDate());
  }

  function _timestamp() {
    var n = new Date();
    return n.getFullYear() +
           _pad2(n.getMonth() + 1) +
           _pad2(n.getDate()) + "_" +
           _pad2(n.getHours()) +
           _pad2(n.getMinutes()) +
           _pad2(n.getSeconds());
  }

  function _resolveOutputFolder(srcFolder) {
    // 02_cutout → sibling 03_output
    var srcName = decodeURIComponent(srcFolder.name);
    if (srcName === "02_cutout") {
      var out = new Folder(srcFolder.parent.fsName + "/03_output");
      if (!out.exists) out.create();
      return out;
    }
    return srcFolder;
  }

  function _saveAi(targetDoc, file) {
    var aiOpts = new IllustratorSaveOptions();
    aiOpts.compatibility = Compatibility.ILLUSTRATOR24;
    // PDF 호환 사본 끄기 (2026-08-22) — 심볼 전환으로 네이티브가 줄면서 이 사본이 파일의 52% 가
    // 됐다 (하린 77.5MB = 네이티브 37.1 + PDF 사본 40.3). .ai 는 Illustrator 에서만 여는 것으로
    // 확인돼(사용자, 2026-08-22) 끄는 것이 안전하다. 인쇄·Summa 컷 경로 모두 Illustrator 출력.
    // 되돌려야 하는 경우 = .ai 를 Illustrator 밖(다른 앱·RIP·미리보기)에서 직접 여는 경로가 생길 때.
    aiOpts.pdfCompatible = false;
    aiOpts.embedICCProfile = true;
    targetDoc.saveAs(file, aiOpts);
  }

  function _pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

})();
