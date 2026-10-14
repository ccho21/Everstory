// ═══════════════════════════════════════════════════════════════
//  Everstory Christmas 시트 (크리스마스 디자인 × 여러 장)
//
//  디자인 1 = 하트 이름 스티커 (2026-10-06 사용자 참고 이미지 1번):
//   빨간 하트 + 머리만 오린 얼굴 누끼 + 아래에 이름을 살짝 둥글게(∪) + 흰 테두리 칼선.
//  디자인 2 = MERRY CHRISTMAS (2026-10-07 참고 이미지 2번 — 서체 대체 시안은 10-06 기각, ChatGPT 레터링·모자 그림으로 재도전):
//   MERRY CHRISTMAS 레터링 + 얼굴 누끼 + 실사 산타 모자 + 처진 곡선 리본 이름 + 크림 바탕 + 흰 테두리 칼선.
//   매 장 같은 부분은 templates/xmas_merry_art_v1.ai 의 그룹 XM_FRAME (scripts/art_library/build_xmas_merry.jsx).
//  디자인 3 = 오벌 배지 (2026-10-07 참고 이미지 3번):
//   크림 타원 + 레드 이중 링 + "Merry"(손글씨) "Christmas"(세리프) + 얼굴 누끼 + 아래 원호 문구 + 흰 테두리 칼선.
//  디자인 4~6 = 사진 카드 A·C·D (2026-10-07 사용자 시안 — 줄무늬·원본 사진 카드를 누끼 카드로 발전시킨 두 번째 시안):
//   A 카드(크림 + 청록 테두리 + 이름 띠) · C 버건디 카드(띄운 대문자) ·
//   D 누끼 + 이름 판(칼선 = _sil 윤곽 + 판). 윗몸·전신 누끼도 된다 — 머리 띠 폭을 맞추고 아래는 창·판이 자른다.
//   B 오벌 액자(분홍 + 원호 Merry Christmas)는 2026-10-13 사용자 결정으로 뺐다.
//  template_cutout_v2.ait (운영 v2 브랜드 템플릿) 위에 02_cutout 페어(_clean.psd + _sil.png)를
//  앉혀 A5 한 시트에 균일 격자로 깐다. 고른 사진이 칸마다 돌아가며 들어간다.
//
//  플로우: 02_cutout 폴더(주문 보드가 넘기거나 직접 선택) → 대화창(또는 보드 OPTS) →
//  시트 생성 → info > header > header_right 주입 → 03_output/{ts}_XMAS_{HEART|MERRY|OVAL|CARD|SQUARE|DIECUT}_{inch}in_sheet01.ai 저장.
//
//  하트 한 장 (z-order 위→아래):
//    ① 이름 (pathText, ∪ 원호 위 — 편집 가능, 아웃라인 안 함)
//    ② 얼굴 클립 그룹 [clip(하트) · 누끼 사진]
//    ③ 하트 (팔레트 bg)
//    ④ 판 — 흰 테두리면 하트를 칼선까지 띄운 흰 판, 블리드면 하트 색으로 칼선 밖 1mm 까지
//    칼선 (KissCut, CutContour) = 흰 테두리 바깥선 · 블리드면 하트 윤곽
//
//  MERRY 한 장 = XM_FRAME 복제 그룹 (z-order 위→아래) — 흰 테두리만 (그림에 들어 있다):
//    ① 이름 (point text, DM Serif Display, 첫 글자만 대문자 — 편집 가능)
//    ② XM_RIBBON (처진 곡선 리본 — 테두리까지 채운 도형)
//    ③ 얼굴·모자 클립 그룹 [clip(크림) · 모자(PNG) · 누끼 사진] — 레터링 앞, 리본 뒤
//    ④ XM_LETTERING · XM_CREAM · XM_WHITE
//    칼선 (KissCut, CutContour) = XM_CUT (흰 테두리 바깥)
//
//  오벌 한 장 (z-order 위→아래) — 흰 테두리만 (바깥 링이 0.5mm 남짓이라 블리드면 칼선이 밀릴 때 링이 깎인다):
//    ① 아래 문구 (pathText, 원호 위) · "Christmas" · "Merry" (point text — 편집 가능, 아웃라인 안 함)
//    ② 얼굴 클립 그룹 [clip(안쪽 크림 타원) · 누끼 사진]
//    ③ 타원 4겹 — 레드(바깥 링) → 크림 → 레드(안쪽 링) → 크림. 선(stroke) 대신 채운 타원을 겹친다
//    ④ 흰 판 (칼선 크기 타원)
//    칼선 (KissCut, CutContour) = 흰 테두리 바깥 타원
//
//  수치는 전부 참고 이미지 실측이다 (되돌리거나 "예쁜 숫자"로 반올림하지 말 것):
//   · 하트 = 좌우 대칭 베지어 6점, 참고 실루엣과 IoU 0.993 (오목점 깊이는 실측 0.135h 로 고정)
//   · 얼굴 상자 = 하트 폭 61% × 높이 59% — 피사체 bbox(_sil) 를 통째로 담고 가운데
//   · 이름 = ∪ 원호(반지름 0.65W, 기준선 가장 낮은 점 0.832W), 대문자 높이 0.0517W, 넓은 자간.
//     처음(ROUND 1)에 잰 0.0711W 는 곡선으로 퍼진 세로 폭까지 잰 실수라 37% 컸다.
//   · 이름 서체 = Sofia Pro Soft (2026-10-06 사용자 선택, Adobe Fonts — Illustrator 에 켜져 있어야 한다)
//   · 오벌 = 타원 세로/가로 1.2608 (적합 오차 ±0.6%), 링·글자 위치·아래 문구 원호 — OVAL 표 주석 참고.
//     아래 문구는 타원이 아니라 원호 위에 있다 (가운데는 링에서 멀고 양끝은 가까워짐, 원 적합 오차 0.3px).
//
//  함정 (기존 스크립트에서 실측 — 되돌리지 말 것):
//   · var 테이블은 호이스팅 안 됨. 메인 플로우보다 위에 둘 것.
//   · 여러 줄에 걸친 중첩 삼항 연산자 금지 — ExtendScript 에서 틀린 분기가 실행된다. if/else 로.
//   · embed() 후 placedItem 핸들은 무효 — bounds 매칭으로 재탐색.
//   · 베지어 점은 전부 CORNER — SMOOTH 는 핸들을 일직선으로 강제해 모양이 바뀐다.
//   · 자동 실행 중 Illustrator 자체 경고 창(색상 프로파일 등)이 뜨면 통째로 멈춘다 → DONTDISPLAYALERTS 가드.
//
//  사용: File → Scripts → Other Script → Everstory_xmas.jsx (주문 보드 '구성' → 스크립트 Christmas 로도 실행)
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "christmas v1";
  var SCRIPT_TITLE = "Everstory Christmas Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var TEMPLATE_NAME = "template_cutout_v2.ait";

  // ── 시트 (Everstory_ring.jsx 와 같은 운영 상수) ─────────────────
  var BODY_PADDING_X_MM = 0;
  var BODY_PADDING_Y_MM = 1.5;
  var GAP_DEFAULT_MM = 1.5;

  // ── 디자인 — 다음 디자인은 이 표에 한 줄 + _buildSheet 의 compose 분기 ──
  //   size = 디자인을 고르면 맞춰지는 사이즈 (SIZE_MM 번호). 오벌은 세로로 길어 시트에 9장(3×3) 아니면 4장(2×2)만
  //   들어간다 — 1.75″ 가 9장이 들어가는 가장 큰 크기 근처 (2026-10-07 시안 계산).
  var DESIGNS = [
    { key: "HEART", label: "하트 — 얼굴 + 곡선 이름 (참고 1번)", size: 2 },
    { key: "MERRY", label: "MERRY CHRISTMAS — 레터링 + 산타 모자 + 리본 이름 (참고 2번)", size: 2 },
    { key: "OVAL",  label: "오벌 — Merry Christmas + 얼굴 + 곡선 문구 (참고 3번)", size: 1 },
    { key: "CARD",  label: "카드 — Merry Christmas + 사진 + 청록 이름 띠 (사진 카드 A)", size: 0 },
    { key: "SQUARE", label: "버건디 카드 — MERRY CHRISTMAS + 사진 + 이름 (사진 카드 C)", size: 1 },
    { key: "DIECUT", label: "누끼 + 이름 판 — 사진 윤곽 칼선 (사진 카드 D)", size: 1 }
  ];
  var DESIGN_DEFAULT = 0;

  // ── 사이즈 = 칼선 폭 (링 배지와 같은 기준). 칼선 높이는 디자인이 정한다 (하트 ≈ 폭, 오벌 = 타원 1.26배 + 테두리) ──
  //   흰 테두리 시트 장수: 하트 1.5″ 12 · 1.75″ 9 · 2″ 6 · 2.5″ 4  /  MERRY 같음  /  오벌 1.5″ 9 · 1.75″ 9 · 2″ 4 · 2.5″ 4
  var SIZE_OPTIONS = ["1.5\" / 38mm", "1.75\" / 44mm", "2\" / 51mm", "2.5\" / 64mm"];
  var SIZE_MM      = [38.1, 44.45, 50.8, 63.5];
  var SIZE_DEFAULT = 2;

  // ── 하트 — 폭 1 정규화 · y 아래로 · 오른쪽 절반 3세그먼트 (오목점 N → 봉우리 P → 옆 E → 꼭지 T) ──
  // a·b 는 각 세그먼트 핸들 길이. 왼쪽 절반은 x = 1 − x 거울. 참고 실루엣 IoU 0.993 (2026-10-06 피팅값).
  var HEART = { n: 0.1295, pkx: 0.7414, a1: 0.07, b1: 0.09, a2: 0.11, a3: 0.165, ey: 0.3315, b3: 0.1881, b4: 0.1775, a5: 0.3169, b5: 0.1663, h: 0.9591 };
  // 칼선·흰 테두리(오프셋) — 세그먼트마다 이만큼 점을 찍어 접선 방향 핸들로 잇는다 (하트 하나 노드 ≈ 6×이 값)
  var OFFSET_SAMPLES = 8;

  // ── 얼굴 상자 (하트 폭 단위, 하트 위 = 0) — 피사체 bbox 를 통째로 담고 가운데 ──
  var FACE_BOX = { top: 0.149, bottom: 0.743, maxW: 0.61 };

  // ── 이름 — ∪ 원호 위 (원 중심이 위, 글자 위쪽이 얼굴 쪽) ─────────────
  //   low = 기준선 가장 낮은 점 · r = 원호 반지름 · cap = 대문자 높이 (전부 하트 폭 단위)
  //   maxLen = 이름이 차지해도 되는 길이. 넘치면 자간(원래의 trackMinK 까지) → 장평(minHScale %까지) → 크기 순으로 줄인다
  //   minCapMm = 대문자 높이 하한 — 1.5″ 는 비율대로면 1.8mm 라 링 배지 하한(2mm)까지 키운다
  var NAME_ARC = { low: 0.832, r: 0.65, cap: 0.0517, maxLen: 0.36, minCapMm: 2.0, trackMinK: 0.3, minHScale: 85 };
  // 이름 서체 — 위에서부터 있는 것을 쓴다. cap = 대문자 높이/em, track = 원본과 같은 폭이 되는 자간 (1/1000 em,
  // "OLIVIA" 잉크 폭 = 대문자 높이 × 5.42 — 참고 이미지 130/24px). Medium = 사용자 선택, Bold 로 바꾸려면 순서만 바꾼다.
  var NAME_FONTS = [
    { name: "Sofia Pro Soft Medium", ps: "SofiaProSoftMedium", cap: 0.699, track: 166 },
    { name: "Sofia Pro Soft Bold",   ps: "SofiaProSoftBold",   cap: 0.699, track: 153 },
    { name: "Nunito Bold",           ps: "Nunito-Bold",        cap: 0.721, track: 123 }
  ];
  var LEGIBILITY_MIN_PT = 5;   // 이보다 작아지면 경고

  // ── 색 — bg = 하트, ink = 이름 ───────────────────────────────
  // 레드는 참고 이미지 실측. 파인·크림은 링 크리스마스의 교훈(채도 말고 명도를 낮춘 레드·그린)대로.
  var PALETTE = [
    { name: "red",   bg: "B34848", ink: "F8F3E4" },
    { name: "pine",  bg: "2E5339", ink: "F3EAD3" },
    { name: "cream", bg: "F3EAD3", ink: "B34848" }
  ];
  // 믹스 = (행 + 열) 으로 한 칸씩 밀어 대각선으로 섞는다 — 칸 순서대로만 돌리면 3열 시트에서 열마다 한 색이 된다 (10-06 실측)
  var COLOR_MODE_OPTIONS = ["레드 한 색 (참고 이미지)", "믹스 — 레드·파인·크림 칸마다"];
  var COLOR_MODE_DEFAULT = 0;

  // ── 테두리 · 칼선 ──────────────────────────────────────────
  //   흰 테두리 = 칼선 폭 D 안에 하트(D − 2×BORDER) + 흰 테두리. 칼선이 0.5mm 밀려도 테두리 두께만 달라진다.
  //   블리드   = 하트 = 칼선, 하트 색을 칼선 밖 BLEED_MM 까지 (링 배지 방식). 이웃 배경이 겹치지 않게 간격을 벌린다.
  var BORDER_OPTIONS = ["흰 테두리 1.5mm (칼선 = 테두리 바깥)", "블리드 −1mm (칼선 = 하트)"];
  var BORDER_WHITE = 0, BORDER_BLEED = 1;
  var BORDER_DEFAULT = 0;
  var BORDER_MM = 1.5;
  var BLEED_MM = 1;
  var WHITE_HEX = "FFFFFF";

  // ── 오벌 (참고 3번 실측 — 타원 바깥선 폭 W = 1, y 아래, 타원 위 = 0) — 되돌리거나 반올림하지 말 것 ──
  //   h = 타원 높이 · ring1 = 바깥 링 · gap = 링 사이 · ring2 = 안쪽 가는 링 (바깥선에서 안쪽으로)
  var OVAL = { h: 1.2608, ring1: 0.0124, gap: 0.02, ring2: 0.0069 };
  // 얼굴 상자 (머리 꼭대기 ~ 턱 = Christmas 바로 아래 ~ 아래 문구 위) — 피사체 bbox 를 통째로 담고 가운데, 안쪽 크림 타원으로 클립
  var OVAL_FACE = { top: 0.387, bottom: 1.07, maxW: 0.78 };
  // "Merry" = 손글씨 point text. size = 글자 크기 · base = 기준선 (잉크 폭 0.414W · 아래 끝 0.272W 에 맞춘 값), 잉크 가운데
  var OVAL_MERRY = { size: 0.1625, base: 0.2206 };
  // "Christmas" = 세리프 point text. base = 기준선 · xh = 소문자 높이 (글자 크기 = xh ÷ 서체 xh). 폭은 서체 표 track 으로 원본(0.659W)에
  var OVAL_TITLE = { base: 0.3724, xh: 0.0783 };
  // 아래 문구 = 원호 (타원과 중심이 다르다) — cy = 원 중심 높이 · r = 기준선 반지름 · xh = 소문자 높이.
  //   maxDeg = 문구가 쓸 수 있는 반각 (원본 "from the Everstory Family" 가 ±50°). 넘치면 자간(trackMin 까지) → 크기.
  //   minCapMm = 대문자가 이보다 작아지면 완료 창 경고 (원본 비율 그대로면 1.75″ 에서 1.6mm)
  var OVAL_LINE = { cy: 0.7812, r: 0.3932, xh: 0.027, maxDeg: 58, trackMin: -10, minCapMm: 1.4 };
  // 아래 문구 틀 — {name} 자리에 이름. 보드도 이 표를 그대로 쓴다. 기본 = "Love, 이름" (이름 형태와 상관없이 말이 된다)
  var OVAL_LINE_PRESETS = ["Love, {name}", "{name}", "from the {name} Family", "{name}'s First Christmas"];
  var OVAL_LINE_PRESET_DEFAULT = 0;
  // 서체 — 위에서부터 있는 것을 쓴다 (Adobe Fonts). xh·cap = 소문자·대문자 높이/em ·
  //   track = "Christmas" 를 원본 폭으로 · lineTrack = 아래 문구를 원본 길이로 (1/1000 em — 서체 실측 + 브라우저 렌더 보정)
  var OVAL_SCRIPT_FONTS = [
    { name: "Great Vibes", ps: "GreatVibes-Regular" }
  ];
  var OVAL_FONTS = [
    { name: "Etna Semibold",           ps: "Etna-Semibold",          xh: 0.492, cap: 0.7,   track: -29, lineTrack: 47 },
    { name: "Utopia Semibold Display", ps: "UtopiaStd-SemiboldDisp", xh: 0.461, cap: 0.66,  track: -55, lineTrack: 32 },
    { name: "Lapture Display Bold",    ps: "LaptureDisplay-Bold",    xh: 0.485, cap: 0.673, track: -38, lineTrack: 44 }
  ];
  var OVAL_COLORS = { red: "9F1112", cream: "F9F3E1" };

  // ── MERRY (참고 2번 — 2026-10-07 ROUND 2 확정, 레터링 가로 0.8배) ─────────────────
  //   매 장 같은 부분(레터링·리본·크림·흰 테두리·칼선 모양) = templates/MERRY_ART 의 그룹 XM_FRAME
  //   (scripts/art_library/build_xmas_merry.jsx 가 만든다). 매 장은 얼굴·모자·이름만 얹는다.
  //   좌표 = 그림 단위 (CHRISTMAS 폭 cw 925, y 아래). cut* = 칼선 bbox — 시트에서는 칼선 폭 = 사이즈로 줄인다.
  //   cut* · cTop · cH · name* 는 빌드 도구 실측(templates/art_preview/xmas_merry_v1/SHAPES.json)과 같아야 한다 (테스트가 확인).
  //   얼굴: 턱 = CHRISTMAS 위 + chinK × 높이 · 피사체 높이 faceH × cw (폭 faceWMax × cw 까지) · 가운데 x0 + faceCx × cw
  //         (모자 끝이 오른쪽으로 흘러서 조금 왼쪽). 10-07 MERRY·CHRISTMAS 사이를 절반으로 줄이며(사용자) 얼굴 자리도 줄어
  //         0.6 → 0.49 (폭 0.54 → 0.44) — 모자가 MERRY 를, 턱이 CHRISTMAS 를 가리는 정도는 그대로. 빌드 그림의 크림이
  //         이 크기까지 담으므로 빌드 도구 FACE 와 같아야 한다 (SHAPES.json measure — 테스트가 확인).
  //   모자: 띠 폭 = 얼굴 폭 × hatBrimK · 띠 아래 가장 높은 점 = 얼굴 위에서 hatApexY × 높이 아래, 가운데에서 hatApexX × 폭 오른쪽.
  //         그림(templates/MERRY_HAT) px — 띠 아래 꼭대기 (hatApexPxX, hatApexPxY) · 띠 폭 hatBrimPx · 그림 hatPxW × hatPxH.
  //   이름: 리본 가운데 nameX · 기준선 nameBase · 크기 nameSize · 넘치면 nameMaxW 에 맞춰 줄인다 (참고 실측: 대문자 = 리본 두께 60%,
  //         DM Serif Display 대문자 0.66 em). 첫 글자만 대문자로 (참고 "Olivia") — 나머지는 쓴 그대로.
  var MERRY = { cutL: -8.5, cutT: 146.03, cutW: 1017, cutH: 923.4, cw: 925, x0: 37.5, cTop: 546.67, cH: 298.78,
                chinK: 0.7, faceH: 0.49, faceWMax: 0.44, faceCx: 0.432,
                hatBrimK: 0.8, hatApexX: 0.04, hatApexY: 0.2, hatApexPxX: 600, hatApexPxY: 500, hatBrimPx: 880, hatPxW: 1536, hatPxH: 1024,
                nameX: 500, nameBase: 982.57, nameSize: 130.38, nameMaxW: 408.3 };
  var MERRY_ART = "xmas_merry_art_v1.ai";
  var MERRY_HAT = "xmas_santa_hat_v1.png";
  var MERRY_NAME_FONTS = [
    { name: "DM Serif Display", ps: "DMSerifDisplay-Regular", cap: 0.66 }
  ];
  var MERRY_RED = "9F1112";

  // ── 사진 카드 A·C·D (2026-10-07 사용자 시안 2장 — 줄무늬·원본 사진 카드 시안을 누끼 카드로 발전시킨 두 번째 시안 기준) ──
  //   비율은 시안 그림을 눈으로 잰 값 (원본 파일 없음 — 파일을 받으면 다시 잰다). 전부 스티커 폭 W = 1, 위·왼쪽 = 0, y 아래.
  //   사진 = 누끼. 윗몸·전신 = 머리 띠(피사체 위 band0~band1 높이 줄의 폭)를 headW 에 맞추고 피사체 위 = subjTop,
  //   피사체 bbox 가운데 = 창 가운데, 아래는 창이 자른다. 얼굴(또는 모름) = faceW × faceH 상자에 통째로, 창 가운데.
  //   머리 띠가 피사체 폭의 wideK 를 넘으면 의자·손·모자까지 잰 것일 수 있어 완료 창에서 알린다 (생일 스크립트와 같은 규칙)
  var CARD_BAND = { band0: 0.08, band1: 0.20, wideK: 0.7 };
  // A 카드 — 크림 + 청록 테두리(edge), 위 Merry Christmas(기울임 · 잉크 폭 titleW) + 짧은 밑줄, 둥근 사진 창, 아래 청록 이름 띠
  var CARD = { h: 1.346, r: 0.067, edge: 0.016, titleBase: 0.124, titleW: 0.663, ulY: 0.169, ulW: 0.085, ulT: 0.0045,
               winL: 0.067, winT: 0.2135, winW: 0.865, winH: 0.847, winR: 0.04,
               subjTop: 0.247, headW: 0.37, faceW: 0.62, faceH: 0.70,
               barL: 0.034, barT: 1.079, barW: 0.932, barH: 0.234, barR: 0.036, nameBase: 1.263, nameSize: 0.211, nameMaxW: 0.82 };
  // C 버건디 카드 — 위 왼쪽 MERRY CHRISTMAS(띄운 대문자, 잉크 폭 capsW) + 오른쪽 가는 선, 크림 사진 창(각진), 아래 이름
  var SQUARE = { h: 1.144, r: 0.006, capsL: 0.064, capsBase: 0.097, capsCap: 0.025, capsW: 0.53, lineL: 0.64, lineR: 0.943, lineT: 0.003,
                 winL: 0.053, winT: 0.142, winW: 0.892, winH: 0.765,
                 subjTop: 0.159, headW: 0.39, faceW: 0.64, faceH: 0.68, nameBase: 1.087, nameSize: 0.215, nameMaxW: 0.86 };
  // D 누끼 + 이름 판 — 칸 높이 h. 칼선 = (_sil 윤곽 — 판 가운데 위까지) ∪ (판 + 크림 여백 margin). _sil 의 여백이 크림 테두리.
  //   판 = 청록 테두리(plateEdge) 크림 판, 이름 + 작은 MERRY CHRISTMAS. 얼굴 누끼는 턱이 판 위에 살짝 숨게 (faceBottom)
  //   border = _sil 윤곽을 바깥으로 더 띄운 크림 테두리 (시안 0.026W — _sil 여백만으로는 거의 안 보였다, 10-07 실측)
  var DIECUT = { h: 1.17, border: 0.025, plateL: 0.028, plateT: 0.84, plateW: 0.944, plateH: 0.303, plateR: 0.03, plateEdge: 0.009, margin: 0.028,
                 subjTop: 0.06, headW: 0.39, faceW: 0.62, faceH: 0.75, faceBottom: 0.90,
                 nameBase: 1.006, nameSize: 0.18, nameMaxW: 0.84, capsBase: 1.10, capsCap: 0.0216, capsW: 0.49 };
  var CARD_COLORS = { teal: "2F6B66", cream: "F5F1E7", panel: "ECE6DA", ink: "F4EFE4", burgCard: "6E3346" };
  // 서체 — 위에서부터 있는 것. Merry Christmas = 기울임 세리프 · 띄운 대문자 = 가는 세리프 · 이름 = MERRY_NAME_FONTS (DM Serif Display)
  var CARD_SCRIPT_FONTS = [
    { name: "Adobe Caslon Pro Semibold Italic", ps: "ACaslonPro-SemiboldItalic", cap: 0.673 },
    { name: "Baskerville SemiBold Italic",      ps: "Baskerville-SemiBoldItalic", cap: 0.662 },
    { name: "Georgia Italic",                   ps: "Georgia-Italic", cap: 0.693 }
  ];
  var CARD_CAPS_FONTS = [
    { name: "Baskerville",     ps: "Baskerville", cap: 0.662 },
    { name: "Iowan Old Style", ps: "IowanOldStyle-Roman", cap: 0.697 }
  ];

  // ── 사진 종류 — 하트는 머리만 오린 얼굴 누끼용. 다른 종류는 만들되 완료 창에서 알린다 ──
  // 종류 = 보드가 보낸 값(OPTS.shotTypes) > 파일명 표시 (range.jsx 와 같은 표).
  var SHOT_NAME_TOKEN_RE = /_(BIG|MED|SML|XXL|XL|XS|S|M|L|FAM)$/i;
  var SHOT_NAME_TYPES = { SML: "face", XS: "face", S: "face", MED: "upper", M: "upper", L: "upper",
                          BIG: "full", XL: "full", XXL: "full", FAM: "full" };


  // ═══════════════════════════════════════════════════════
  //  MAIN
  // ═══════════════════════════════════════════════════════
  var QUIET = false;   // 주입 실행(테스트)이면 완료 창 대신 결과를 전역에 담는다
  var GUARDED = false; // 만드는 동안 Illustrator 경고 창을 꺼 둔 상태 — 완료 창은 켠 뒤에 띄운다
  var PENDING = "";
  var ART_DOCS = [];   // 이번 실행에서 연 그림 문서 (MERRY) — _closeArtDocs 가 닫는다 (var 는 호이스팅 안 되니 메인 흐름보다 위)

  var folder = _launchFolder() ||
    Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!folder) return;

  var pairs = _collectPairs(folder);
  if (pairs.length === 0) {
    alert("선택한 폴더에 _clean.psd 가 없습니다.");
    return;
  }

  var opt = _showDialog(pairs, folder);
  if (!opt) return;

  // 입력 검증이 아니라 자동화가 멈추지 않게 하는 장치 — 끝나면 원래대로 되돌리고 완료 창을 띄운다 (ring.jsx 와 같은 가드)
  var prevUIL = null;
  try { prevUIL = app.userInteractionLevel; app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS; GUARDED = true; } catch (eUI) {}

  // 선택 페어별 _sil 트레이스 (피사체 실제 bbox)
  var noSil = 0;
  for (var si = 0; si < opt.selectedPairs.length; si++) {
    opt.selectedPairs[si].silInfo = null;
    if (opt.selectedPairs[si].sil) {
      try { opt.selectedPairs[si].silInfo = _silSubjectInfo(opt.selectedPairs[si].sil); } catch (eSil) {}
    }
    if (!opt.selectedPairs[si].silInfo) noSil++;
  }

  try {
    _buildSheet(opt, folder, noSil);
  } catch (e) {
    _report("실패: " + ((e && e.message) ? e.message : String(e)) +
          (e && e.line ? ("  (line " + e.line + ")") : ""));
  } finally {
    _closeArtDocs();                                  // MERRY 그림 문서 — 실패해도 열린 채 두지 않는다
    if (prevUIL !== null) { try { app.userInteractionLevel = prevUIL; } catch (eR) {} }
    GUARDED = false;
    if (PENDING) _report(PENDING);
  }


  // ═══════════════════════════════════════════════════════
  //  SHEET BUILD
  // ═══════════════════════════════════════════════════════
  function _buildSheet(opt, folder, noSil) {
    var design = DESIGNS[opt.designIdx] || DESIGNS[0];
    var oval = (design.key === "OVAL");
    var merry = (design.key === "MERRY");
    var card = _cardSpec(design.key);                  // 사진 카드 A·C·D 표 (아니면 null)
    if (oval || merry) opt.border = BORDER_WHITE;      // 오벌·MERRY 는 흰 테두리만 (머리 주석)
    if (card) opt.border = BORDER_BLEED;               // 사진 카드는 테두리 없이 칼선 = 바깥 모양 (b = 0)
    var D    = opt.sizeMm * MM_TO_PT;                  // 칼선 폭
    var white = (opt.border === BORDER_WHITE);
    var b    = 0;
    if (white) b = BORDER_MM * MM_TO_PT;
    var W    = D - 2 * b;                              // 하트·타원 그림 폭
    var cutH = HEART.h * W + 2 * b;                    // 칼선 높이 (위 = 봉우리 + b, 아래 = 꼭지 원호)
    if (oval) cutH = OVAL.h * W + 2 * b;
    if (merry) cutH = D * MERRY.cutH / MERRY.cutW;     // MERRY 는 흰 테두리까지 그림에 들어 있다 — 칼선 bbox 비율 그대로
    if (card) cutH = card.h * D;                       // 사진 카드 = 폭 × h (D 는 칸 높이)
    var padX = BODY_PADDING_X_MM * MM_TO_PT;
    var padY = BODY_PADDING_Y_MM * MM_TO_PT;
    // 블리드면 이웃 배경끼리 겹치지 않게 간격을 블리드 2배까지 벌린다 (링 배지와 같은 규칙)
    var gapMm = GAP_DEFAULT_MM;
    if (!white && !card && 2 * BLEED_MM > gapMm) gapMm = 2 * BLEED_MM;
    var gap  = gapMm * MM_TO_PT;

    var templateFile = _resolveTemplate();
    if (!templateFile || !templateFile.exists) {
      alert(TEMPLATE_NAME + " 를 찾을 수 없습니다.\n스크립트와 같은 위치의 templates/ 폴더를 확인하세요.");
      return;
    }
    var doc = _openTemplateDoc(templateFile);

    var bodyPath, headerText;
    try {
      bodyPath   = _findInfoPath(doc, "body");
      headerText = _findInfoPath(doc, "header_right");
      if (headerText.typename !== "TextFrame")
        throw new Error("info > header > header_right 가 TextFrame 이 아닙니다 (현재: " +
          headerText.typename + "). 템플릿에서 같은 이름의 다른 오브젝트를 제거하세요.");
    } catch (eTmpl) {
      alert(eTmpl.message);
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (ec) {}
      return;
    }

    var printLayer = doc.layers.add(); printLayer.name = "PrintData";
    var kissLayer  = doc.layers.add(); kissLayer.name  = "KissCut";
    var cutSpot = _ensureCutContour(doc);

    var bb = bodyPath.geometricBounds;   // [L, T, R, B]  (T > B, y-up)
    var bL = bb[0], bT = bb[1], bR = bb[2], bB = bb[3];
    var binW = (bR - bL) - 2 * padX;
    var binH = (bT - bB) - 2 * padY;
    if (binW <= 0 || binH <= 0) {
      alert("info > body 영역이 padding 보다 작습니다.");
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (ec2) {}
      return;
    }

    var cells = _gridCells(binW, binH, D, cutH, gap);
    var nCols = _gridCols(binW, D, gap);
    if (cells.length === 0) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose) {}
      alert("이 사이즈는 body 영역에 한 칸도 안 들어갑니다. 더 작은 사이즈를 고르세요.");
      return;
    }

    var nf = _resolveNameFont();
    if (merry) nf = _resolveFontList(MERRY_NAME_FONTS);
    var of = null;                                     // 오벌 서체 — 손글씨(Merry) · 세리프(Christmas·아래 문구)
    if (oval) of = { script: _resolveFontList(OVAL_SCRIPT_FONTS), serif: _resolveFontList(OVAL_FONTS) };
    var cf = null;                                     // 사진 카드 서체 — 기울임(Merry Christmas) · 띄운 대문자 · 이름
    if (card) cf = { script: _resolveFontList(CARD_SCRIPT_FONTS), caps: _resolveFontList(CARD_CAPS_FONTS), name: _resolveFontList(MERRY_NAME_FONTS) };
    var dieShapes = {};                                // D — 사진마다 한 번 만든 칼선 모양 (칸마다 복제)
    var mf = null;                                     // MERRY 그림 — XM_FRAME · 모자 PNG (칸마다 복제)
    if (merry) {
      try { mf = _openMerryArt(doc); }
      catch (eArt) {
        try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eCa) {}
        throw eArt;
      }
    }
    var sel = opt.selectedPairs;
    var placed = 0, failed = 0, minFontPt = 1e9, fitNote = "", firstErr = "";
    for (var i = 0; i < cells.length; i++) {
      var pair = sel[i % sel.length];                 // 칸마다 돌아가며
      var swatch = PALETTE[0];
      if (opt.colorMode === 1) swatch = PALETTE[(Math.floor(i / nCols) + i % nCols) % PALETTE.length];
      var x0 = bL + padX + cells[i].x;               // 칼선 bbox 왼쪽 위 (y 위로)
      var y0 = bT - padY - cells[i].y;
      try {
        var r;
        if (card) r = _composeCardAt(doc, printLayer, kissLayer, cutSpot, pair, opt, design.key, x0, y0, D, cf, dieShapes);
        else if (oval) r = _composeOvalAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, of);
        else if (merry) r = _composeMerryAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, mf, nf);
        else r = _composeHeartAt(doc, printLayer, kissLayer, cutSpot, pair, opt, swatch, x0, y0, D, nf);
        if (r.fontPt < minFontPt) minFontPt = r.fontPt;
        if (r.fit && !fitNote) fitNote = r.fit;
        placed++;
      } catch (eC) {
        failed++;
        if (!firstErr) firstErr = (eC && eC.message) ? eC.message : String(eC);
      }
    }

    _closeArtDocs();
    app.activeDocument = doc;
    for (var dk in dieShapes) {                        // D 칼선 원본 (숨긴 채 쓰던 것) — 시트에 남기지 않는다
      if (dieShapes.hasOwnProperty(dk) && dieShapes[dk]) { try { dieShapes[dk].shape.remove(); } catch (eDs) {} }
    }
    // z-order 위→아래 = KissCut → info(템플릿) → PrintData (CLAUDE.md 고정 컨벤션).
    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eK) {}
    try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (eP) {}
    doc.selection = null;

    _drawHeader(opt, sel.length, headerText);

    var savedPath = "", saveErr = "";
    try {
      var outF = _resolveOutputFolder(folder);
      var fname = _timestamp() + "_XMAS_" + design.key + "_" + _sizeTag(opt.sizeMm) + "_sheet01.ai";
      var sf = new File(outF.fsName + "/" + fname);
      _saveAi(doc, sf);
      savedPath = sf.fsName;
    } catch (eS) {
      saveErr = (eS && eS.message) ? eS.message : String(eS);
    }

    var cols = _gridCols(binW, D, gap);
    var rows = (cols > 0) ? Math.round(cells.length / cols) : 0;
    if (minFontPt > 1e8) minFontPt = 0;
    var capSpec = nf.spec;                             // 대문자 높이를 잴 서체 — 하트 = 이름, 오벌 = 아래 문구(세리프)
    if (oval) capSpec = of.serif.spec;
    if (card) capSpec = cf.name.spec;
    var capMm = (minFontPt * capSpec.cap) / MM_TO_PT;

    // 하트·오벌은 머리만 오린 얼굴 누끼용 — 다른 종류는 만들되 알린다
    var notFace = [], wideHead = [];
    for (var q = 0; q < sel.length; q++) {
      var st = _shotType(opt, sel[q].base);
      if (card) {                                      // 사진 카드는 윗몸·전신도 된다 — 머리 띠가 너무 넓은 것만 알린다
        var sq = sel[q].silInfo;
        if ((st === "upper" || st === "full") && sq && sq.wFrac > 0 && sq.headWFrac / sq.wFrac > CARD_BAND.wideK) wideHead.push(sel[q].base);
        continue;
      }
      if (st && st !== "face") notFace.push(sel[q].base);
    }

    // 디자인별 줄 (사이즈 · 글자 · 서체 · 색) 과 경고
    var body, warn, check;
    if (card) {
      body =
        "사이즈: " + opt.sizeMm + "mm (" + _sizeTag(opt.sizeMm) + ") = 칼선 폭  /  칼선 " + opt.sizeMm + " × " + (cutH / MM_TO_PT).toFixed(1) + "mm" +
          (design.key === "DIECUT" ? " 칸 (칼선 = 사진 윤곽 + 이름 판)" : "") + "\n" +
        "이름: " + (_trim(_composeHangulNFC(opt.name || "")) || "—") + "  /  서체 " + cf.name.spec.name + "  /  대문자 " + capMm.toFixed(1) + "mm" +
          (fitNote ? ("  /  " + fitNote) : "") + "\n" +
        "글자: " + (design.key === "CARD" ? cf.script.spec.name + " (Merry Christmas)" : cf.caps.spec.name + " (MERRY CHRISTMAS)") + "\n";
      warn = _fontWarn(MERRY_NAME_FONTS, cf.name) + _fontWarn(CARD_SCRIPT_FONTS, cf.script) + _fontWarn(CARD_CAPS_FONTS, cf.caps);
      if (wideHead.length > 0) warn += "⚠ 머리 높이에 넓은 것(모자·의자·손 등)이 같이 있는 사진 " + wideHead.length + "장 (" + wideHead.join(", ") +
        ") — 머리가 작게 나왔을 수 있어요. 사진을 바꾸거나 Illustrator 에서 키우세요.\n";
      check = "확인: 칼선 = 카드 바깥선" + (design.key === "DIECUT" ? "(사진 윤곽 + 이름 판)" : "") + " / 머리가 창 안에서 잘리지 않았는지 / 이름이 띠·판 안에 들어갔는지.";
    } else if (oval) {
      body =
        "사이즈: " + opt.sizeMm + "mm (" + _sizeTag(opt.sizeMm) + ") = 칼선 폭  /  타원 " +
          (W / MM_TO_PT).toFixed(1) + " × " + (OVAL.h * W / MM_TO_PT).toFixed(1) + "mm  /  흰 테두리 " + BORDER_MM + "mm\n" +
        "아래 문구: " + (_trim(_composeHangulNFC(opt.line || "")) || "—") + "  /  대문자 " + capMm.toFixed(1) + "mm" +
          (fitNote ? ("  /  " + fitNote) : "") + "\n" +
        "서체: " + of.script.spec.name + " (Merry) · " + of.serif.spec.name + " (Christmas · 아래 문구)\n" +
        "색: 레드 #" + OVAL_COLORS.red + " · 크림 #" + OVAL_COLORS.cream + " (참고 이미지)\n";
      warn = _fontWarn(OVAL_SCRIPT_FONTS, of.script) + _fontWarn(OVAL_FONTS, of.serif);
      check = "확인: 칼선 = 흰 테두리 바깥 / 얼굴이 Christmas·아래 문구에 닿지 않는지 / 링 두 줄이 고르게 보이는지.";
    } else if (merry) {
      body =
        "사이즈: " + opt.sizeMm + "mm (" + _sizeTag(opt.sizeMm) + ") = 칼선 폭  /  칼선 " + opt.sizeMm + " × " +
          (cutH / MM_TO_PT).toFixed(1) + "mm  /  레터링·리본·흰 테두리 = " + MERRY_ART + "\n" +
        "이름: " + (_merryNameText(opt.name) || "—") + "  /  서체 " + nf.spec.name + "  /  대문자 " + capMm.toFixed(1) + "mm" +
          (fitNote ? ("  /  " + fitNote) : "") + "\n" +
        "모자: " + MERRY_HAT + " — 얼굴 폭에 맞춰 얹었어요 (따로 있는 그림이라 손으로 옮기기 쉬워요)\n";
      warn = _fontWarn(MERRY_NAME_FONTS, nf);
      check = "확인: 칼선 = 흰 테두리 바깥 / 모자가 머리에 맞게 얹혔는지 / 이름이 리본 안에 들어갔는지.";
    } else {
      body =
        "사이즈: " + opt.sizeMm + "mm (" + _sizeTag(opt.sizeMm) + ") = 칼선 폭  /  하트 그림 " +
          (W / MM_TO_PT).toFixed(1) + "mm  /  " + BORDER_OPTIONS[opt.border] + "\n" +
        "이름: " + (_trim(_composeHangulNFC(opt.name || "")).toUpperCase() || "—") + "  /  서체 " + nf.spec.name + "  /  대문자 " + capMm.toFixed(1) + "mm" +
          (fitNote ? ("  /  " + fitNote) : "") + "\n" +
        "색: " + COLOR_MODE_OPTIONS[opt.colorMode] + "\n";
      warn = _fontWarn(NAME_FONTS, nf);
      check = "확인: 칼선 = 흰 테두리 바깥 / 얼굴이 하트 안에 여백 두고 들어갔는지 / 이름이 턱에 붙지 않는지.";
    }
    var what = oval ? "아래 문구" : "이름";
    var whatObj = oval ? "아래 문구를" : "이름을";
    var dsgWord = "하트는";
    if (oval) dsgWord = "오벌은";
    if (merry) dsgWord = "MERRY 는";
    if (notFace.length > 0) warn += "⚠ 얼굴 누끼가 아닌 사진 " + notFace.length + "장 (" + notFace.join(", ") + ") — " +
      dsgWord + " 머리만 오린 사진용이라 작게 떠 보일 수 있어요.\n";
    if (noSil > 0) warn += "⚠ _sil 없는 사진 " + noSil + "장 — 이미지 전체를 피사체로 봤어요 (여백 생길 수 있음)\n";
    if (minFontPt > 0 && minFontPt < LEGIBILITY_MIN_PT)
      warn += "⚠ " + what + " 글자가 " + minFontPt.toFixed(1) + "pt 까지 줄었습니다 — " + whatObj + " 줄이거나 사이즈를 올리세요.\n";
    if (oval && capMm > 0 && capMm < OVAL_LINE.minCapMm - 0.05)
      warn += "⚠ 아래 문구 대문자 " + capMm.toFixed(1) + "mm — 작아서 인쇄가 뭉갤 수 있어요. 문구를 줄이거나 사이즈를 올리는 게 좋아요.\n";
    if (!oval && !merry && !card && capMm > 0 && capMm < NAME_ARC.minCapMm - 0.05)
      warn += "⚠ 이름 대문자 " + capMm.toFixed(1) + "mm — " + NAME_ARC.minCapMm + "mm 아래는 인쇄가 뭉갤 수 있어요 (긴 이름이라 줄였어요). 사이즈를 올리는 게 좋아요.\n";

    _report(
      "완료: 크리스마스 " + design.label + "\n\n" +
      body +
      "격자: " + cols + "×" + rows + " = " + cells.length + " 칸  /  선택 사진 " + sel.length + "장\n" +
      "배치: " + placed + "개" + (failed > 0 ? ("  (실패 " + failed + " — " + firstErr + ")") : "") + "\n" +
      warn +
      "헤더: " + (opt.customerName || "—") + " 주입 완료  /  템플릿: " + TEMPLATE_NAME + "\n\n" +
      (savedPath ? ("저장: " + savedPath) :
                   ("저장 실패: " + (saveErr || "unknown") + " — 직접 저장하세요.")) + "\n\n" +
      check
    );
  }

  // 서체 표의 첫 서체를 못 찾았을 때 알림 (없으면 빈 문자열)
  function _fontWarn(list, rf) {
    if (!rf.fallback) return "";
    if (!rf.font) return "⚠ " + list[0].name + " 를 못 찾아 Illustrator 기본 서체로 썼습니다 — Adobe Fonts 에서 켜고 다시 만드세요.\n";
    return "⚠ " + list[0].name + " 를 못 찾아 " + rf.spec.name + " 로 썼습니다 — Adobe Fonts 에서 켜고 다시 만드세요.\n";
  }

  // 칸 왼쪽 위 좌표 목록 (bin 왼쪽 위 기준, x 오른쪽·y 아래). 균일 cellW×cellH 격자, 가운데 정렬.
  function _gridCells(binW, binH, cellW, cellH, gap) {
    var cols = _gridCols(binW, cellW, gap);
    var rows = Math.floor((binH + gap) / (cellH + gap));
    var out = [];
    if (cols < 1 || rows < 1) return out;
    var usedW = cols * cellW + (cols - 1) * gap;
    var usedH = rows * cellH + (rows - 1) * gap;
    var x0 = (binW - usedW) / 2;
    var y0 = (binH - usedH) / 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        out.push({ x: x0 + c * (cellW + gap), y: y0 + r * (cellH + gap) });
      }
    }
    return out;
  }

  function _gridCols(binW, cell, gap) {
    return Math.floor((binW + gap) / (cell + gap));
  }


  // ═══════════════════════════════════════════════════════
  //  HEART COMPOSITION
  //  생성 순서가 곧 z-order 다 (새 아이템은 항상 레이어 맨 위).
  //  판 → 하트 → 얼굴 클립 그룹 → 이름 순으로 만든다.
  // ═══════════════════════════════════════════════════════
  // (x0, y0) = 칼선 bbox 왼쪽 위 (Illustrator 좌표, y 위로), D = 칼선 폭.  반환 { fontPt, fit }
  function _composeHeartAt(doc, printLayer, kissLayer, cutSpot, pair, opt, swatch, x0, y0, D, nf) {
    var white = (opt.border === BORDER_WHITE);
    var b = 0;
    if (white) b = BORDER_MM * MM_TO_PT;
    var W  = D - 2 * b;
    var hx = x0 + b, hy = y0 - b;                      // 하트 bbox 왼쪽 위

    // ① 판 — 흰 테두리(칼선까지) 또는 블리드(하트 색, 칼선 밖 1mm 까지)
    var plate;
    if (white) {
      plate = _offsetPath(printLayer, hx, hy, W, b / W);
      _fill(plate, WHITE_HEX);
    } else {
      plate = _offsetPath(printLayer, hx, hy, W, BLEED_MM * MM_TO_PT / W);
      _fill(plate, swatch.bg);
    }

    // ② 하트
    _fill(_heartPath(printLayer, hx, hy, W), swatch.bg);

    // ③ 얼굴 — 피사체 bbox 를 얼굴 상자에 통째로 담고 상자 가운데. _sil 이 없으면 이미지 전체를 피사체로 본다.
    var art = _placeFace(doc, printLayer, pair, opt, hx + W / 2, hy - (FACE_BOX.top + FACE_BOX.bottom) / 2 * W,
                         FACE_BOX.maxW * W, (FACE_BOX.bottom - FACE_BOX.top) * W);
    // 하트로 클립 — 모자 챙처럼 넓은 피사체가 흰 테두리·칼선 위로 넘어가지 않게
    var grp = printLayer.groupItems.add();
    art.move(grp, ElementPlacement.PLACEATBEGINNING);
    var clip = _heartPath(printLayer, hx, hy, W);
    clip.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.clipping = true;
    grp.clipped = true;

    // ④ 이름
    var nm = _addName(printLayer, opt.name, hx, hy, W, swatch.ink, nf);

    // 칼선 — 흰 테두리면 테두리 바깥선, 블리드면 하트 윤곽
    var cut;
    if (white) cut = _offsetPath(kissLayer, hx, hy, W, b / W);
    else cut = _heartPath(kissLayer, hx, hy, W);
    _forceCutContourStroke(cut, cutSpot);

    return nm;
  }

  // 얼굴 누끼를 상자(boxW × boxH, 가운데 bcx·bcy — y 위로)에 — 피사체 bbox(_sil) 를 통째로 담고 가운데.
  // _sil 이 없으면 이미지 전체를 피사체로 본다. 반환 = 놓인 사진 (embed 면 다시 찾은 아이템)
  // geo (선택) = { bottom: y } 면 상자 가운데 대신 피사체 아래(턱)를 bottom 에 맞추고,
  // 돌려받을 때 geo.w · geo.h · geo.cx · geo.top 에 놓인 피사체 bbox 를 채운다 (MERRY 모자 자리 계산용).
  function _placeFace(doc, printLayer, pair, opt, bcx, bcy, boxW, boxH, geo) {
    doc.activeLayer = printLayer;
    var photo = printLayer.placedItems.add();
    photo.file = pair.clean;
    var iw = photo.width, ih = photo.height;
    var fw = 1, fh = 1, fcx = 0.5, fcy = 0.5;
    if (pair.silInfo) {
      fw  = pair.silInfo.wFrac;
      fh  = pair.silInfo.hFrac;
      fcx = pair.silInfo.centerXFrac;
      fcy = pair.silInfo.centerYFrac;
    }
    var pw = Math.min(boxW / fw, boxH / (fh * (ih / iw)));
    var ph = pw * (ih / iw);
    photo.width = pw;
    photo.height = ph;
    if (geo && geo.bottom != null) bcy = geo.bottom + fh * ph / 2;   // 피사체 아래 = bottom (y 위로)
    photo.left = bcx - fcx * pw;                       // fcx/fcy = 이미지 왼쪽 위 기준 피사체 중심 분율
    photo.top  = bcy + fcy * ph;
    if (geo) { geo.w = fw * pw; geo.h = fh * ph; geo.cx = bcx; geo.top = bcy + fh * ph / 2; }

    var art = photo;
    if (opt.embed) {
      var pL = photo.left, pT = photo.top, pW = photo.width, pH = photo.height;
      photo.embed();
      art = _findEmbeddedNear(printLayer, pL, pT, pW, pH);
      if (!art) throw new Error("embed 재탐색 실패 (" + pair.base + ")");
    }
    return art;
  }


  // ═══════════════════════════════════════════════════════
  //  OVAL COMPOSITION (참고 3번)
  //  생성 순서가 곧 z-order — 흰 판 → 타원 4겹 → 얼굴 클립 그룹 → 글자 → 칼선(KissCut).
  // ═══════════════════════════════════════════════════════
  // (x0, y0) = 칼선 bbox 왼쪽 위 (Illustrator 좌표, y 위로), D = 칼선 폭. of = { script, serif } 서체.  반환 { fontPt, fit }
  function _composeOvalAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, of) {
    var b = BORDER_MM * MM_TO_PT;
    var W = D - 2 * b, H = OVAL.h * W;
    var rx = W / 2, ry = H / 2;
    var cx = x0 + D / 2, cy = y0 - b - ry;              // 타원 중심
    var top = cy + ry;                                 // 타원 위 (W 단위 표의 0)

    // ① 흰 판 (칼선 크기)
    _fill(_ellipse(printLayer, cx, cy, rx + b, ry + b), WHITE_HEX);
    // ② 타원 4겹 — 레드(바깥 링) → 크림 → 레드(안쪽 링) → 크림. 겹친 채움이라 선 두께·정렬에 안 흔들린다
    var d1 = OVAL.ring1 * W, d2 = (OVAL.ring1 + OVAL.gap) * W, d3 = (OVAL.ring1 + OVAL.gap + OVAL.ring2) * W;
    _fill(_ellipse(printLayer, cx, cy, rx, ry), OVAL_COLORS.red);
    _fill(_ellipse(printLayer, cx, cy, rx - d1, ry - d1), OVAL_COLORS.cream);
    _fill(_ellipse(printLayer, cx, cy, rx - d2, ry - d2), OVAL_COLORS.red);
    _fill(_ellipse(printLayer, cx, cy, rx - d3, ry - d3), OVAL_COLORS.cream);

    // ③ 얼굴 — 얼굴 상자에 통째로, 안쪽 크림 타원으로 클립 (머리카락이 링 위로 넘어가지 않게)
    var art = _placeFace(doc, printLayer, pair, opt, cx, top - (OVAL_FACE.top + OVAL_FACE.bottom) / 2 * W,
                         OVAL_FACE.maxW * W, (OVAL_FACE.bottom - OVAL_FACE.top) * W);
    var grp = printLayer.groupItems.add();
    art.move(grp, ElementPlacement.PLACEATBEGINNING);
    var clip = _ellipse(printLayer, cx, cy, rx - d3, ry - d3);
    clip.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.clipping = true;
    grp.clipped = true;

    // ④ 글자 — Merry · Christmas 는 잉크 가운데, 아래 문구는 원호
    _addCenteredText(printLayer, "Merry", of.script.font, OVAL_MERRY.size * W, 0, cx, top - OVAL_MERRY.base * W, OVAL_COLORS.red);
    _addCenteredText(printLayer, "Christmas", of.serif.font, OVAL_TITLE.xh * W / of.serif.spec.xh, of.serif.spec.track,
                     cx, top - OVAL_TITLE.base * W, OVAL_COLORS.red);
    var ln = _addOvalLine(printLayer, opt.line, cx, top - OVAL_LINE.cy * W, W, OVAL_COLORS.red, of.serif);

    // 칼선 — 흰 테두리 바깥 타원
    _forceCutContourStroke(_ellipse(kissLayer, cx, cy, rx + b, ry + b), cutSpot);
    return ln;
  }

  // 축 정렬 타원 (중심·반지름, y 위로) — Illustrator 기본 타원 (4점 베지어)
  function _ellipse(container, cx, cy, rx, ry) {
    return container.pathItems.ellipse(cy + ry, cx - rx, 2 * rx, 2 * ry);
  }

  // point text — 기준선 baseY, 잉크(윤곽) 가운데가 cx 에 오게. 자간·글자 모양 때문에 글자 상자 가운데 ≠ 잉크 가운데라
  // 임시 윤곽 사본의 bounds 로 잰 만큼 옮긴다 (사본은 지운다 — 본 글자는 편집 가능한 채로)
  function _addCenteredText(layer, text, font, size, track, cx, baseY, hex) {
    var tf = layer.textFrames.pointText([cx, baseY]);
    tf.contents = text;
    var ca = tf.textRange.characterAttributes;
    if (font) ca.textFont = font;
    ca.size = size;
    ca.tracking = Math.round(track);   // 자간은 정수(1/1000 em)만 받는다
    ca.fillColor = _hexToRGB(hex);
    ca.strokeWeight = 0;
    try { tf.textRange.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}
    var ol = tf.duplicate().createOutline();
    var bb = ol.geometricBounds;
    ol.remove();
    tf.translate(cx - (bb[0] + bb[2]) / 2, 0);
    return tf;
  }

  // 아래 문구 — 원호 위 pathText (_addName 과 같은 방향: θ 증가 190°→350°, 글자 위쪽이 원 중심).
  // 서체 표 자간(lineTrack)으로 원본 길이. 최대 반각(maxDeg)을 넘으면 자간(trackMin 까지) → 크기 순으로 줄인다.  반환 { fontPt, fit }
  function _addOvalLine(layer, rawText, cx, cy, W, hex, sf) {
    var text = _trim(_composeHangulNFC(String(rawText || "")));
    if (!text) return { fontPt: 0, fit: "" };
    var fs = OVAL_LINE.xh * W / sf.spec.xh;
    var track = sf.spec.lineTrack;
    var r = OVAL_LINE.r * W;
    var maxLen = r * 2 * OVAL_LINE.maxDeg * Math.PI / 180;
    var fit = "";
    var w0 = _probeWidth(layer, text, sf.font, fs, track);
    if (w0 > maxLen && w0 > 0) {
      var gaps = Math.max(1, text.length - 1);
      var t1 = track - (w0 - maxLen) / gaps * 1000 / fs;
      if (t1 >= OVAL_LINE.trackMin) {
        track = t1;
        fit = "긴 문구 — 자간 " + Math.round(track);
      } else {
        track = OVAL_LINE.trackMin;
        var w1 = _probeWidth(layer, text, sf.font, fs, track);
        if (w1 > maxLen) fs = fs * maxLen / w1;
        fit = "긴 문구 — 자간 " + track + " · 글자 " + fs.toFixed(1) + "pt";
      }
    }
    var arc = _arcPath(layer, cx, cy, r, 190, 350);
    var frame = layer.textFrames.pathText(arc);
    try { frame.move(layer, ElementPlacement.PLACEATBEGINNING); } catch (eMove) {}
    frame.contents = text;
    var rng = frame.textRange;
    if (sf.font) rng.characterAttributes.textFont = sf.font;
    rng.characterAttributes.size = fs;
    rng.characterAttributes.tracking = Math.round(track);
    rng.characterAttributes.fillColor = _hexToRGB(hex);
    rng.characterAttributes.strokeWeight = 0;
    try { rng.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}
    _applyHangulFontOverride(frame, _resolveHangulFont());
    return { fontPt: fs, fit: fit };
  }


  // ═══════════════════════════════════════════════════════
  //  MERRY COMPOSITION (참고 2번)
  //  XM_FRAME 을 칸마다 복제해 칼선 폭 = D 로 줄이고, 크림으로 클립한 [얼굴 · 모자] 를 레터링 바로 위에,
  //  이름을 맨 위에 넣는다. XM_CUT 은 KissCut 레이어로 옮겨 칼선이 된다.
  // ═══════════════════════════════════════════════════════
  // 그림 문서를 열고 (시트 문서를 다시 활성으로) XM_FRAME · 모자 파일을 돌려준다. 없으면 멈춘다.
  function _openMerryArt(sheetDoc) {
    var artF = _templateFile(MERRY_ART), hatF = _templateFile(MERRY_HAT);
    if (!artF || !hatF) {
      throw new Error("templates/" + MERRY_ART + " · " + MERRY_HAT + " 가 없습니다 — scripts/art_library/build_xmas_merry.jsx 로 만든다");
    }
    var art = app.open(artF);
    ART_DOCS.push(art);
    var frame;
    try { frame = art.groupItems.getByName("XM_FRAME"); }
    catch (eF) { throw new Error(MERRY_ART + " 에 그룹 XM_FRAME 이 없습니다"); }
    app.activeDocument = sheetDoc;
    return { frame: frame, hat: hatF };
  }

  function _closeArtDocs() {
    for (var i = 0; i < ART_DOCS.length; i++) {
      try { ART_DOCS[i].close(SaveOptions.DONOTSAVECHANGES); } catch (e) {}
    }
    ART_DOCS = [];
  }

  // templates/<name> (스크립트 옆 또는 한 단계 위) — 없으면 null (대화창 없이)
  function _templateFile(name) {
    var scriptDir = (new File($.fileName)).parent;
    var cands = [scriptDir.fsName + "/templates/" + name, scriptDir.parent.fsName + "/templates/" + name];
    for (var i = 0; i < cands.length; i++) {
      var f = new File(cands[i]);
      if (f.exists) return f;
    }
    return null;
  }

  // (x0, y0) = 칼선 bbox 왼쪽 위 (y 위로), D = 칼선 폭. mf = _openMerryArt 결과, nf = 이름 서체.  반환 { fontPt, fit }
  function _composeMerryAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, mf, nf) {
    var M = MERRY, s = D / M.cutW;
    function X(u) { return x0 + (u - M.cutL) * s; }   // 그림 단위 (y 아래) → 시트 (y 위)
    function Y(v) { return y0 - (v - M.cutT) * s; }
    app.activeDocument = doc;
    doc.activeLayer = printLayer;

    // ① 프레임 — 다른 문서에서는 레이어로만 복제된다 (그룹 안으로 바로 넣으면 MRAP 오류)
    var fr = mf.frame.duplicate(printLayer, ElementPlacement.PLACEATBEGINNING);
    fr.resize(s * 100, s * 100, true, true, true, true, s * 100, Transformation.TOPLEFT);
    var gb = fr.geometricBounds;                       // 프레임 경계 = 칼선 경계 (칼선이 가장 바깥 도형)
    fr.translate(x0 - gb[0], y0 - gb[1]);
    var cut = fr.pageItems.getByName("XM_CUT");
    var cream = fr.pageItems.getByName("XM_CREAM");
    var letters = fr.pageItems.getByName("XM_LETTERING");

    // ② 얼굴 — 피사체 bbox 를 상자에 통째로, 턱 = CHRISTMAS 위에서 높이의 chinK
    var geo = { bottom: Y(M.cTop + M.chinK * M.cH) };
    var face = _placeFace(doc, printLayer, pair, opt, X(M.x0 + M.faceCx * M.cw), 0,
                          M.faceWMax * M.cw * s, M.faceH * M.cw * s, geo);

    // ③ 모자 — 띠 폭 = 얼굴 폭 × hatBrimK, 띠 아래 꼭대기 = 얼굴 위에서 hatApexY 아래 · 가운데에서 hatApexX 오른쪽
    var k = M.hatBrimK * geo.w / M.hatBrimPx;          // pt / 그림 px
    var ax = geo.cx + M.hatApexX * geo.w, ay = geo.top - M.hatApexY * geo.h;
    var hat = printLayer.placedItems.add();
    hat.file = mf.hat;
    hat.width = M.hatPxW * k;
    hat.height = M.hatPxH * k;
    hat.left = ax - M.hatApexPxX * k;
    hat.top = ay + M.hatApexPxY * k;
    var hatArt = hat;
    if (opt.embed) {
      var hL = hat.left, hT = hat.top, hW = hat.width, hH = hat.height;
      hat.embed();
      hatArt = _findEmbeddedNear(printLayer, hL, hT, hW, hH);
      if (!hatArt) throw new Error("모자 embed 재탐색 실패");
    }

    // ④ 얼굴·모자를 크림으로 클립 → 레터링 바로 위 (리본 뒤)
    var grp = printLayer.groupItems.add();
    face.move(grp, ElementPlacement.PLACEATBEGINNING);
    hatArt.move(grp, ElementPlacement.PLACEATBEGINNING);
    var clip = cream.duplicate(grp, ElementPlacement.PLACEATBEGINNING);
    clip.clipping = true;
    grp.clipped = true;
    grp.move(letters, ElementPlacement.PLACEBEFORE);

    // ⑤ 이름 — 리본 가운데
    var nm = _addMerryName(printLayer, opt.name, X(M.nameX), Y(M.nameBase), s, nf);
    if (nm.frame) nm.frame.move(fr, ElementPlacement.PLACEATBEGINNING);

    // 칼선 — XM_CUT 을 KissCut 레이어로
    cut.move(kissLayer, ElementPlacement.PLACEATBEGINNING);
    _forceCutContourStroke(cut, cutSpot);
    return { fontPt: nm.fontPt, fit: nm.fit };
  }

  // 리본 이름 — 첫 글자만 대문자 (참고 "Olivia"), 나머지는 쓴 그대로
  function _merryNameText(raw) {
    var t = _trim(_composeHangulNFC(String(raw || "")));
    if (!t) return "";
    return t.charAt(0).toUpperCase() + t.substring(1);
  }

  // point text 가운데 정렬 — 기준선 baseY. 리본 폭(nameMaxW)을 넘으면 글자 크기를 줄인다.  반환 { frame, fontPt, fit }
  function _addMerryName(layer, rawName, cx, baseY, s, nf) {
    var text = _merryNameText(rawName);
    if (!text) return { frame: null, fontPt: 0, fit: "" };
    var fs = MERRY.nameSize * s, maxW = MERRY.nameMaxW * s, fit = "";
    var tf = layer.textFrames.pointText([cx, baseY]);
    tf.contents = text;
    var ca = tf.textRange.characterAttributes;
    if (nf.font) ca.textFont = nf.font;
    ca.size = fs;
    ca.fillColor = _hexToRGB(MERRY_RED);
    ca.strokeWeight = 0;
    try { tf.textRange.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}
    _applyHangulFontOverride(tf, _resolveHangulFont());
    var w = tf.geometricBounds[2] - tf.geometricBounds[0];
    if (w > maxW && w > 0) {
      fs = fs * maxW / w;
      tf.textRange.characterAttributes.size = fs;     // geometricBounds 를 읽은 뒤라 핸들을 다시 잡는다 (주소 라벨 함정)
      fit = "긴 이름 — 글자 " + fs.toFixed(1) + "pt";
    }
    return { frame: tf, fontPt: fs, fit: fit };
  }


  // ═══════════════════════════════════════════════════════
  //  사진 카드 A·C·D (2026-10-07 사용자 시안) — 생성 순서가 곧 z-order
  //  A 카드 · C 버건디 카드 = 바탕 → 사진 창 → 사진(창 클립) → 글자 → 이름 띠·이름
  //  D 누끼 + 이름 판 = 크림 모양(칼선과 같은 모양) → 사진(판 가운데 위까지 클립) → 판 → 이름 · 작은 글자
  //  칼선 (KissCut) = A·C 둥근 사각 · D (_sil 윤곽 ∪ 판 여백)
  // ═══════════════════════════════════════════════════════
  function _cardSpec(key) {
    if (key === "CARD") return CARD;
    if (key === "SQUARE") return SQUARE;
    if (key === "DIECUT") return DIECUT;
    return null;
  }

  // (x0, y0) = 칸 왼쪽 위 (y 위로), D = 칸 폭. cf = { script, caps, name } 서체. dieShapes = D 칼선 모양 캐시.  반환 { fontPt, fit }
  function _composeCardAt(doc, printLayer, kissLayer, cutSpot, pair, opt, key, x0, y0, D, cf, dieShapes) {
    var W = D, T = _cardSpec(key), C = CARD_COLORS, H = T.h * W, nm;
    function X(u) { return x0 + u * W; }               // W 단위 (y 아래) → 시트 (y 위)
    function Y(v) { return y0 - v * W; }
    doc.activeLayer = printLayer;

    if (key === "CARD") {
      _fill(_rrect(printLayer, x0, y0, W, H, T.r * W), C.teal);                       // 청록 테두리 = 바깥 판
      var e = T.edge * W;
      _fill(_rrect(printLayer, x0 + e, y0 - e, W - 2 * e, H - 2 * e, (T.r - T.edge) * W), C.cream);
      _fill(_rrect(printLayer, X(T.winL), Y(T.winT), T.winW * W, T.winH * W, T.winR * W), C.panel);
      _cardPhoto(doc, printLayer, pair, opt, T, W, x0, y0, X(T.winL + T.winW / 2) - x0, Y(T.winT + T.winH / 2) - y0, null,
                 _rrect(printLayer, X(T.winL), Y(T.winT), T.winW * W, T.winH * W, T.winR * W));
      _fitCenteredText(printLayer, "Merry Christmas", cf.script, T.titleW * W, X(0.5), Y(T.titleBase), C.teal);
      _bar(printLayer, X(0.5), Y(T.ulY), T.ulW * W, T.ulT * W, C.teal);
      _fill(_rrect(printLayer, X(T.barL), Y(T.barT), T.barW * W, T.barH * W, T.barR * W), C.teal);
      nm = _cardName(printLayer, opt.name, cf.name, T.nameSize * W, T.nameMaxW * W, X(0.5), Y(T.nameBase), C.ink);
      _forceCutContourStroke(_rrect(kissLayer, x0, y0, W, H, T.r * W), cutSpot);
    } else if (key === "SQUARE") {
      _fill(_rrect(printLayer, x0, y0, W, H, T.r * W), C.burgCard);
      _fill(printLayer.pathItems.rectangle(Y(T.winT), X(T.winL), T.winW * W, T.winH * W), C.cream);
      _cardPhoto(doc, printLayer, pair, opt, T, W, x0, y0, X(T.winL + T.winW / 2) - x0, Y(T.winT + T.winH / 2) - y0, null,
                 printLayer.pathItems.rectangle(Y(T.winT), X(T.winL), T.winW * W, T.winH * W));
      _capsText(printLayer, "MERRY CHRISTMAS", cf.caps, T.capsCap * W, T.capsW * W, X(T.capsL), Y(T.capsBase), C.ink, true);
      var lineY = Y(T.capsBase - T.capsCap / 2);
      _bar(printLayer, X((T.lineL + T.lineR) / 2), lineY, (T.lineR - T.lineL) * W, T.lineT * W, C.ink);
      nm = _cardName(printLayer, opt.name, cf.name, T.nameSize * W, T.nameMaxW * W, X(0.5), Y(T.nameBase), C.ink);
      _forceCutContourStroke(_rrect(kissLayer, x0, y0, W, H, T.r * W), cutSpot);
    } else {
      // D — 칼선 모양은 사진마다 한 번 (칸 왼쪽 위 = 0,0 에 숨겨 둔 것을 칸마다 복제해 옮긴다)
      var ds = _diecutShape(doc, printLayer, pair, opt, T, W, dieShapes);
      var cream = ds.shape.duplicate(printLayer, ElementPlacement.PLACEATBEGINNING);
      try { cream.hidden = false; } catch (eH) {}
      cream.translate(x0, y0);
      _fill(cream, C.cream);
      var midY = y0 - (T.plateT + T.plateH / 2) * W;
      _cardPhoto(doc, printLayer, pair, opt, T, W, x0, y0, 0, 0, ds.geo,
                 printLayer.pathItems.rectangle(y0 + W, x0 - W, 3 * W, y0 + W - midY));
      _fill(_rrect(printLayer, X(T.plateL), Y(T.plateT), T.plateW * W, T.plateH * W, T.plateR * W), C.teal);
      var pe = T.plateEdge * W;
      _fill(_rrect(printLayer, X(T.plateL) + pe, Y(T.plateT) - pe, T.plateW * W - 2 * pe, T.plateH * W - 2 * pe, T.plateR * W - pe), C.cream);
      nm = _cardName(printLayer, opt.name, cf.name, T.nameSize * W, T.nameMaxW * W, X(0.5), Y(T.nameBase), C.teal);
      _capsText(printLayer, "MERRY CHRISTMAS", cf.caps, T.capsCap * W, T.capsW * W, X(0.5), Y(T.capsBase), C.teal, false);
      var cut = ds.shape.duplicate(kissLayer, ElementPlacement.PLACEATBEGINNING);
      try { cut.hidden = false; } catch (eH2) {}
      cut.translate(x0, y0);
      _forceCutContourStroke(cut, cutSpot);
    }
    return nm;
  }

  // 사진 자리 (칸 왼쪽 위 = 0,0 · y 위로, W = 칸 폭). 윗몸·전신이고 머리 띠를 쟀으면 머리 띠 폭 = headW · 피사체 위 = subjTop ·
  // 피사체 가운데 x = cx. 아니면 얼굴 상자 faceW × faceH 에 통째로 (가운데 cx·cy, bottom 이 있으면 피사체 아래 = bottom).
  // asp = 사진 세로/가로.  반환 { left, top, w, h }
  function _cardPhotoGeo(pair, opt, T, W, cx, cy, bottom, asp) {
    var st = _shotType(opt, pair.base), si = pair.silInfo;
    if ((st === "upper" || st === "full") && si && si.headWFrac > 0) {
      var pw = T.headW * W / si.headWFrac, ph = pw * asp;
      return { left: cx - si.centerXFrac * pw, top: -T.subjTop * W + (si.centerYFrac - si.hFrac / 2) * ph, w: pw, h: ph };
    }
    var fw = 1, fh = 1, fcx = 0.5, fcy = 0.5;
    if (si) { fw = si.wFrac; fh = si.hFrac; fcx = si.centerXFrac; fcy = si.centerYFrac; }
    var pw2 = Math.min(T.faceW * W / fw, T.faceH * W / (fh * asp)), ph2 = pw2 * asp;
    var bcy = cy;
    if (bottom != null) bcy = bottom + fh * ph2 / 2;      // 피사체 아래 = bottom
    return { left: cx - fcx * pw2, top: bcy + fcy * ph2, w: pw2, h: ph2 };
  }

  // 사진을 놓고 clip 으로 자른 그룹을 만든다. geo 가 있으면 그 자리 (D — 칼선 모양과 같은 자리), 없으면 _cardPhotoGeo
  // (cx·cy = 칸 기준 창 가운데). 반환 = 클립 그룹
  function _cardPhoto(doc, layer, pair, opt, T, W, x0, y0, cx, cy, geo, clip) {
    doc.activeLayer = layer;
    var photo = layer.placedItems.add();
    photo.file = pair.clean;
    var asp = photo.height / photo.width;
    var g = geo;
    if (!g) {
      var bottom = null;
      if (T.faceBottom != null) bottom = -T.faceBottom * W;
      g = _cardPhotoGeo(pair, opt, T, W, cx, cy, bottom, asp);
    }
    photo.width = g.w;
    photo.height = g.h;
    photo.left = x0 + g.left;
    photo.top = y0 + g.top;
    var art = photo;
    if (opt.embed) {
      var pL = photo.left, pT = photo.top, pW = photo.width, pH = photo.height;
      photo.embed();
      art = _findEmbeddedNear(layer, pL, pT, pW, pH);
      if (!art) throw new Error("embed 재탐색 실패 (" + pair.base + ")");
    }
    var grp = layer.groupItems.add();
    art.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.clipping = true;
    grp.clipped = true;
    return grp;
  }

  // D 칼선 모양 — (_sil 윤곽 중 판 가운데 위) ∪ (판 + 크림 여백). 칸 왼쪽 위 = 0,0 에 만들어 숨겨 두고 사진마다 한 번만.
  // 반환 { shape, geo } (geo = 사진 자리, 윤곽과 같은 자리)
  function _diecutShape(doc, layer, pair, opt, T, W, cache) {
    if (cache[pair.base]) return cache[pair.base];
    var si = pair.silInfo;
    if (!si || !si.outline || si.outline.length < 3) throw new Error("_sil 윤곽이 없어 D 칼선을 못 만들어요 (" + pair.base + ")");
    var geo = _cardPhotoGeo(pair, opt, T, W, 0.5 * W, -0.45 * W, -T.faceBottom * W, si.aspect || 1);
    doc.activeLayer = layer;
    var subj = layer.pathItems.add();
    for (var i = 0; i < si.outline.length; i++) {
      var q = si.outline[i], pp = subj.pathPoints.add();
      pp.anchor         = [geo.left + q[0] * geo.w, geo.top - q[1] * geo.h];
      pp.leftDirection  = [geo.left + q[2] * geo.w, geo.top - q[3] * geo.h];
      pp.rightDirection = [geo.left + q[4] * geo.w, geo.top - q[5] * geo.h];
      pp.pointType = PointType.CORNER;
    }
    subj.closed = true;
    _fill(subj, "000000");
    var grown = _offsetFx(doc, subj, T.border * W);   // 크림 테두리만큼 바깥으로 (라운드)
    subj.remove();
    var midY = -(T.plateT + T.plateH / 2) * W;
    var box = layer.pathItems.rectangle(W, -W, 3 * W, W - midY);   // 칸 위 ~ 판 가운데
    _fill(box, "000000");
    var inter = _pathfinder(doc, [grown, box], "Live Pathfinder Intersect");
    var m = T.margin * W;
    var plate = _rrect(layer, T.plateL * W - m, -T.plateT * W + m, T.plateW * W + 2 * m, T.plateH * W + 2 * m, T.plateR * W + m);
    _fill(plate, "000000");
    var uni = _pathfinder(doc, [inter, plate], "Live Pathfinder Add");
    var outer = _largestPath(uni, layer);
    uni.remove();
    try { outer.hidden = true; } catch (eHid) {}
    cache[pair.base] = { shape: outer, geo: geo };
    return cache[pair.base];
  }

  // Offset Path 이펙트 (jntp 0 = 라운드 — 캘리그래피 실측) → 확장. 원본은 그대로 두고 확장 결과를 돌려준다
  function _offsetFx(doc, item, ofs) {
    var dup = item.duplicate(item.layer, ElementPlacement.PLACEATEND);
    dup.applyEffect('<LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst ' + ofs + ' I jntp 0 "/></LiveEffect>');
    doc.selection = null;
    dup.selected = true;
    app.executeMenuCommand("expandStyle");
    var sel = doc.selection;
    if (!sel || sel.length === 0) throw new Error("Offset Path 확장 실패");
    var res = sel[0];
    doc.selection = null;
    return res;
  }

  // 고른 아이템들을 묶어 패스파인더 이펙트 → 확장. 반환 = 확장 결과 (그룹·패스·컴파운드)
  function _pathfinder(doc, items, cmd) {
    doc.selection = null;
    for (var i = 0; i < items.length; i++) items[i].selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand(cmd);
    app.executeMenuCommand("expandStyle");
    var sel = doc.selection;
    if (!sel || sel.length === 0) throw new Error("패스파인더 실패 (" + cmd + ")");
    var res = sel[0];
    doc.selection = null;
    return res;
  }

  // 안에서 넓이가 가장 큰 패스 (바깥 윤곽) 를 레이어로 복제해 돌려준다 — 구멍·떨어진 조각은 버린다
  function _largestPath(item, layer) {
    var paths = [], stack = [item];
    while (stack.length) {
      var it = stack.pop();
      if (it.typename === "PathItem") paths.push(it);
      else if (it.typename === "CompoundPathItem") { for (var j = 0; j < it.pathItems.length; j++) paths.push(it.pathItems[j]); }
      else if (it.typename === "GroupItem") { for (var k = 0; k < it.pageItems.length; k++) stack.push(it.pageItems[k]); }
    }
    var best = null, ba = -1;
    for (var i = 0; i < paths.length; i++) { var a = Math.abs(paths[i].area); if (a > ba) { ba = a; best = paths[i]; } }
    if (!best) throw new Error("칼선 윤곽을 못 찾았어요");
    return best.duplicate(layer, ElementPlacement.PLACEATEND);
  }

  function _rrect(container, left, top, w, h, r) {
    return container.pathItems.roundedRectangle(top, left, w, h, r, r);
  }

  // 가운데 가로 막대 (밑줄·선) — 가운데 cx·cy, 폭 w, 두께 t
  function _bar(layer, cx, cy, w, t, hex) {
    return _fill(layer.pathItems.rectangle(cy + t / 2, cx - w / 2, w, t), hex);
  }

  // 잉크(윤곽) bounds — 임시 윤곽 사본으로 잰다 (사본은 지운다)
  function _inkBounds(tf) {
    var ol = tf.duplicate().createOutline();
    var bb = ol.geometricBounds;
    ol.remove();
    return bb;
  }

  function _pointText(layer, text, rf, size, x, baseY, hex) {
    var tf = layer.textFrames.pointText([x, baseY]);
    tf.contents = text;
    var ca = tf.textRange.characterAttributes;
    if (rf.font) ca.textFont = rf.font;
    ca.size = size;
    ca.fillColor = _hexToRGB(hex);
    ca.strokeWeight = 0;
    try { tf.textRange.paragraphAttributes.justification = Justification.LEFT; } catch (eJ) {}
    return tf;
  }

  // 잉크 폭 = inkW 가 되게 크기를 맞추고 잉크 가운데 = cx (Merry Christmas)
  function _fitCenteredText(layer, text, rf, inkW, cx, baseY, hex) {
    var tf = _pointText(layer, text, rf, inkW / 6, cx, baseY, hex);
    var bb = _inkBounds(tf), w = bb[2] - bb[0];
    if (w > 0) { tf.textRange.characterAttributes.size = (inkW / 6) * inkW / w; bb = _inkBounds(tf); }
    tf.translate(cx - (bb[0] + bb[2]) / 2, 0);
    return tf;
  }

  // 띄운 대문자 — 대문자 높이 capH 로 크기, 잉크 폭 = inkW 가 되게 자간. left 면 잉크 왼쪽 = x, 아니면 잉크 가운데 = x
  function _capsText(layer, text, rf, capH, inkW, x, baseY, hex, left) {
    var size = capH / (rf.spec.cap || 0.66);
    var tf = _pointText(layer, text, rf, size, x, baseY, hex);
    var bb = _inkBounds(tf), w0 = bb[2] - bb[0];
    var track = (inkW - w0) / Math.max(1, text.length - 1) / size * 1000;
    tf.textRange.characterAttributes.tracking = Math.round(track);   // 자간은 정수(1/1000 em)만 받는다
    bb = _inkBounds(tf);
    if (left) tf.translate(x - bb[0], 0);
    else tf.translate(x - (bb[0] + bb[2]) / 2, 0);
    return tf;
  }

  // 이름 — 첫 글자만 대문자 (MERRY 와 같음), 잉크 가운데 = cx. 최대 폭을 넘으면 줄인다.  반환 { fontPt, fit }
  function _cardName(layer, rawName, rf, size, maxW, cx, baseY, hex) {
    var text = _merryNameText(rawName);
    if (!text) return { fontPt: 0, fit: "" };
    var tf = _pointText(layer, text, rf, size, cx, baseY, hex);
    _applyHangulFontOverride(tf, _resolveHangulFont());
    var bb = _inkBounds(tf), w = bb[2] - bb[0], fit = "";
    if (w > maxW && w > 0) {
      size = size * maxW / w;
      tf.textRange.characterAttributes.size = size;   // geometricBounds 를 읽은 뒤라 핸들을 다시 잡는다 (주소 라벨 함정)
      bb = _inkBounds(tf);
      fit = "긴 이름 — 글자 " + size.toFixed(1) + "pt";
    }
    tf.translate(cx - (bb[0] + bb[2]) / 2, 0);
    return { fontPt: size, fit: fit };
  }


  // ═══════════════════════════════════════════════════════
  //  HEART GEOMETRY  (정규화 좌표: 폭 1, y 아래로 → (hx + u·W, hy − v·W))
  // ═══════════════════════════════════════════════════════
  function _heartSegs() {
    var H = HEART;
    var N = [0.5, H.n], P = [H.pkx, 0], E = [1, H.ey], T = [0.5, H.h];
    return [
      [N, [0.5 + H.a1, H.n - H.b1], [H.pkx - H.a2, 0], P],
      [P, [H.pkx + H.a3, 0], [1, H.ey - H.b3], E],
      [E, [1, H.ey + H.b4], [0.5 + H.a5, H.h - H.b5], T]
    ];
  }

  function _mir(p) { return [1 - p[0], p[1]]; }

  function _bz(s, t) {
    var u = 1 - t;
    return [u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
            u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]];
  }

  function _bzd(s, t) {
    var u = 1 - t;
    return [3 * u * u * (s[1][0] - s[0][0]) + 6 * u * t * (s[2][0] - s[1][0]) + 3 * t * t * (s[3][0] - s[2][0]),
            3 * u * u * (s[1][1] - s[0][1]) + 6 * u * t * (s[2][1] - s[1][1]) + 3 * t * t * (s[3][1] - s[2][1])];
  }

  function _unit(v) {
    var L = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    if (L === 0) return [0, 0];
    return [v[0] / L, v[1] / L];
  }

  // 오른쪽 절반은 오목점에서 꼭지로 (화면상 시계 방향) 돈다 → 바깥 법선 = (vy, −vx)  (y 아래 좌표)
  function _offPt(s, t, d) {
    var p = _bz(s, t), v = _unit(_bzd(s, t));
    return [p[0] + d * v[1], p[1] - d * v[0]];
  }

  // 하트 윤곽 — 앵커 N → P(오) → E(오) → T → E(왼) → P(왼). [anchor, left(들어오는 핸들), right(나가는 핸들)]
  function _heartPath(container, hx, hy, W) {
    var S = _heartSegs();
    var pts = [
      [S[0][0],       _mir(S[0][1]), S[0][1]],
      [S[0][3],       S[0][2],       S[1][1]],
      [S[1][3],       S[1][2],       S[2][1]],
      [S[2][3],       S[2][2],       _mir(S[2][2])],
      [_mir(S[2][0]), _mir(S[2][1]), _mir(S[1][2])],
      [_mir(S[1][0]), _mir(S[1][1]), _mir(S[0][2])]
    ];
    var p = container.pathItems.add();
    for (var i = 0; i < pts.length; i++) {
      var pp = p.pathPoints.add();
      pp.anchor         = _map(pts[i][0], hx, hy, W);
      pp.leftDirection  = _map(pts[i][1], hx, hy, W);
      pp.rightDirection = _map(pts[i][2], hx, hy, W);
      pp.pointType = PointType.CORNER;   // 핸들 그대로 보존 (SMOOTH 는 collinear 강제 → 왜곡)
    }
    p.closed = true;
    return p;
  }

  // 하트를 바깥으로 d(하트 폭 대비) 만큼 띄운 닫힌 패스 — 흰 테두리 판·칼선·블리드가 같은 함수.
  // 오목점: 양쪽 갈래가 가운데(x=0.5)에서 만나는 곳까지만 (뾰족한 V) · 꼭지: 반지름 d 원호 (둥글게).
  // 오른쪽 절반을 세그먼트마다 OFFSET_SAMPLES 등분해 점·접선을 구하고 접선 방향 핸들(현의 1/3)로 잇는다. 왼쪽은 거울.
  function _offsetPath(container, hx, hy, W, d) {
    var S = _heartSegs();
    var t0 = 0;
    if (d > 0) {
      var lo = 0, hi = 0.5;   // 첫 세그먼트에서 오프셋 x 가 0.5 를 넘는 t (이분법)
      for (var it = 0; it < 40; it++) {
        var mid = (lo + hi) / 2;
        if (_offPt(S[0], mid, d)[0] < 0.5) lo = mid; else hi = mid;
      }
      t0 = hi;
    }
    var R = [];   // 오른쪽 절반 {p, v} — v = 진행 방향 단위 접선
    for (var si = 0; si < S.length; si++) {
      var ta = 0;
      if (si === 0) ta = t0;
      for (var k = (si === 0 ? 0 : 1); k <= OFFSET_SAMPLES; k++) {
        var t = ta + (1 - ta) * k / OFFSET_SAMPLES;
        R.push({ p: _offPt(S[si], t, d), v: _unit(_bzd(S[si], t)) });
      }
    }
    R[0].p = [0.5, R[0].p[1]];   // 정확히 가운데

    // 노드: anchor + 들어오는/나가는 핸들. 세그먼트(A→B) 마다 A.out, B.in 을 채운다.
    var nodes = [];
    var i, n = R.length;
    for (i = 0; i < n; i++) nodes.push({ p: R[i].p, inH: null, outH: null });
    var tipStart = n;   // 꼭지 원호 다음부터 왼쪽 절반
    for (i = n - 1; i >= 1; i--) nodes.push({ p: _mir(R[i].p), inH: null, outH: null });

    function seg(ai, bi, ta2, tb2, la, lb) {
      var A = nodes[ai], B = nodes[bi];
      A.outH = [A.p[0] + ta2[0] * la, A.p[1] + ta2[1] * la];
      B.inH  = [B.p[0] - tb2[0] * lb, B.p[1] - tb2[1] * lb];
    }
    function dist(a, b2) { var dx = b2[0] - a[0], dy = b2[1] - a[1]; return Math.sqrt(dx * dx + dy * dy); }
    var mt = function (v) { return [v[0], -v[1]]; };   // 거울 쪽을 꼭지→오목점으로 갈 때의 진행 접선

    // 오른쪽 절반 (오목점 → 꼭지)
    for (i = 0; i < n - 1; i++) {
      var L1 = dist(R[i].p, R[i + 1].p) / 3;
      seg(i, i + 1, R[i].v, R[i + 1].v, L1, L1);
    }
    // 꼭지 원호 (중심 T, 반지름 d) — 오른쪽 끝 → 왼쪽 끝. 각 = 바깥 법선 방향
    var vT = R[n - 1].v;
    var th0 = Math.atan2(-vT[0], vT[1]);              // 법선 (vy, −vx) 의 각 (y 아래 좌표)
    var dth = Math.PI - 2 * th0;                      // 거울 쪽 법선까지
    var kArc = (4 / 3) * Math.tan(Math.abs(dth) / 4) * d;
    seg(n - 1, tipStart, vT, mt(vT), kArc, kArc);
    // 왼쪽 절반 (꼭지 → 오목점): 노드 tipStart + j = 거울(R[n-1-j])
    for (i = n - 1; i >= 2; i--) {
      var ai = tipStart + (n - 1 - i), bi = ai + 1;
      var L2 = dist(R[i].p, R[i - 1].p) / 3;
      seg(ai, bi, mt(R[i].v), mt(R[i - 1].v), L2, L2);
    }
    // 마지막: 거울(R[1]) → 오목점(R[0]) — 오목점은 뾰족한 꼭짓점 (들어오는 접선 = 거울 쪽)
    var last = nodes.length - 1;
    var L3 = dist(R[1].p, R[0].p) / 3;
    seg(last, 0, mt(R[1].v), mt(R[0].v), L3, L3);

    var p = container.pathItems.add();
    for (i = 0; i < nodes.length; i++) {
      var pp = p.pathPoints.add();
      pp.anchor         = _map(nodes[i].p, hx, hy, W);
      pp.leftDirection  = _map(nodes[i].inH || nodes[i].p, hx, hy, W);
      pp.rightDirection = _map(nodes[i].outH || nodes[i].p, hx, hy, W);
      pp.pointType = PointType.CORNER;
    }
    p.closed = true;
    return p;
  }

  function _map(q, hx, hy, W) { return [hx + q[0] * W, hy - q[1] * W]; }

  function _fill(item, hex) {
    item.stroked = false;
    item.filled = true;
    item.fillColor = _hexToRGB(hex);
    return item;
  }


  // ═══════════════════════════════════════════════════════
  //  NAME — ∪ 원호 위 pathText (ring.jsx 아랫줄과 같은 방향: θ 증가 210°→330°, 글자 위쪽이 원 중심)
  // ═══════════════════════════════════════════════════════
  function _resolveNameFont() {
    return _resolveFontList(NAME_FONTS);
  }

  // 서체 표 → 위에서부터 Illustrator 에 있는 첫 서체. 하나도 없으면 font = null (기본 서체로 그리고 완료 창이 알린다)
  function _resolveFontList(list) {
    for (var i = 0; i < list.length; i++) {
      try {
        var f = app.textFonts.getByName(list[i].ps);
        return { font: f, spec: list[i], fallback: i > 0 };
      } catch (e) {}
    }
    return { font: null, spec: list[0], fallback: true };
  }

  // 반환 { fontPt, fit } — fit = 길어서 줄인 내용 (완료 창 표시용)
  function _addName(layer, rawName, hx, hy, W, inkHex, nf) {
    var text = _trim(_composeHangulNFC(String(rawName || ""))).toUpperCase();
    if (!text) return { fontPt: 0, fit: "" };
    var capPt = Math.max(NAME_ARC.cap * W, NAME_ARC.minCapMm * MM_TO_PT);
    var fs = capPt / nf.spec.cap;
    var track = nf.spec.track;
    var maxLen = NAME_ARC.maxLen * W;
    var hScale = 100, fit = "";

    // 프로브로 폭 실측 → 자간 → 장평 → 그래도 넘치면 크기 (원본의 넓은 자간은 멋이라 긴 이름이면 먼저 양보)
    var w0 = _probeWidth(layer, text, nf.font, fs, track);
    if (w0 > maxLen && w0 > 0) {
      var gaps = Math.max(1, text.length - 1);
      var perGap = fs * track / 1000;
      var cut = w0 - maxLen;
      var can = gaps * perGap * (1 - NAME_ARC.trackMinK);
      if (cut <= can) {
        track = track - (cut / gaps) * 1000 / fs;
        fit = "긴 이름 — 자간 " + Math.round(track);
      } else {
        track = track * NAME_ARC.trackMinK;
        var w1 = w0 - can;
        var need = 100 * maxLen / w1;
        if (need >= NAME_ARC.minHScale) {
          hScale = need;
          fit = "긴 이름 — 자간 " + Math.round(track) + " · 장평 " + Math.round(hScale) + "%";
        } else {
          hScale = NAME_ARC.minHScale;
          fs = fs * need / NAME_ARC.minHScale;
          fit = "긴 이름 — 자간 " + Math.round(track) + " · 장평 " + hScale + "% · 글자 " + fs.toFixed(1) + "pt";
        }
      }
    }

    var r  = NAME_ARC.r * W;
    var cx = hx + W / 2;
    var cy = hy - (NAME_ARC.low - NAME_ARC.r) * W;     // 원 중심 (기준선 가장 낮은 점에서 r 위)
    var arc = _arcPath(layer, cx, cy, r, 210, 330);
    var frame = layer.textFrames.pathText(arc);
    try { frame.move(layer, ElementPlacement.PLACEATBEGINNING); } catch (eMove) {}
    frame.contents = text;
    var rng = frame.textRange;
    if (nf.font) rng.characterAttributes.textFont = nf.font;
    rng.characterAttributes.size = fs;
    rng.characterAttributes.tracking = Math.round(track);   // 자간은 정수(1/1000 em)만 받는다
    rng.characterAttributes.horizontalScale = hScale;
    rng.characterAttributes.fillColor = _hexToRGB(inkHex);
    rng.characterAttributes.strokeWeight = 0;
    try { rng.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}
    _applyHangulFontOverride(frame, _resolveHangulFont());
    return { fontPt: fs, fit: fit };
  }

  function _probeWidth(layer, text, font, fs, track) {
    var probe = layer.textFrames.pointText([0, 0]);
    probe.contents = text;
    var pa = probe.textRange.characterAttributes;
    if (font) pa.textFont = font;
    pa.size = fs;
    pa.tracking = Math.round(track);
    pa.horizontalScale = 100;
    var pb = probe.geometricBounds;
    probe.remove();
    return pb[2] - pb[0];
  }

  // 원호 베지어. a0 → a1 (도, y-up 수학 좌표). 부호가 곧 진행 방향이다 (ring.jsx _arcPath 그대로).
  function _arcPath(container, cx, cy, r, a0Deg, a1Deg) {
    var a0 = a0Deg * Math.PI / 180;
    var a1 = a1Deg * Math.PI / 180;
    var total = a1 - a0;
    var segs = Math.ceil(Math.abs(total) / (Math.PI / 2));
    if (segs < 1) segs = 1;
    var da = total / segs;
    var k = (4 / 3) * Math.tan(da / 4);

    var p = container.pathItems.add();
    p.filled = false;
    p.stroked = false;
    for (var i = 0; i <= segs; i++) {
      var a = a0 + da * i;
      var x = cx + r * Math.cos(a);
      var y = cy + r * Math.sin(a);
      var tx = -r * Math.sin(a);
      var ty =  r * Math.cos(a);
      var pp = p.pathPoints.add();
      pp.anchor         = [x, y];
      pp.leftDirection  = [x - k * tx, y - k * ty];
      pp.rightDirection = [x + k * tx, y + k * ty];
      pp.pointType = PointType.SMOOTH;   // 핸들이 실제로 접선상 collinear 라 안전
    }
    p.closed = false;
    return p;
  }


  // ═══════════════════════════════════════════════════════
  //  SIL 피사체 레퍼런스 (ring.jsx 동일)
  //  _clean.psd 는 trim 안 됨(Phase A) → 피사체 실제 bbox 는 _sil 에서.
  // ═══════════════════════════════════════════════════════
  function _silSubjectInfo(silFile) {
    var tmp = app.documents.add(DocumentColorSpace.RGB, 1000, 1000);
    try {
      var placed = tmp.layers[0].placedItems.add();
      placed.file = silFile;
      placed.left = 0;
      placed.top = placed.height;
      var cw = placed.width, ch = placed.height;
      tmp.artboards[0].artboardRect = [0, placed.height, placed.width, 0];

      var trace = placed.trace();
      var o = trace.tracing.tracingOptions;
      try { o.loadFromPreset("Silhouettes"); } catch (e1) {}
      o.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE;
      o.threshold = 230;
      o.ignoreWhite = true;
      o.fills = true;
      o.strokes = false;
      trace.tracing.expandTracing();

      app.executeMenuCommand("deselectall");
      app.executeMenuCommand("selectall");
      var seln = tmp.selection;
      if (!seln || seln.length === 0) return null;

      var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      for (var i = 0; i < seln.length; i++) {
        var b = seln[i].geometricBounds;   // [L, T, R, B]  (T > B, y-up)
        if (b[0] < minX) minX = b[0];
        if (b[2] > maxX) maxX = b[2];
        if (b[3] < minY) minY = b[3];
        if (b[1] > maxY) maxY = b[1];
      }
      var info = {
        wFrac:       (maxX - minX) / cw,
        hFrac:       (maxY - minY) / ch,
        centerXFrac: ((minX + maxX) / 2) / cw,
        centerYFrac: (ch - (minY + maxY) / 2) / ch,  // 캔버스 top 기준 피사체 세로중심
        aspect:      ch / cw,
        headWFrac:   0,
        headCxFrac:  0.5,
        outline:     null
      };
      // 머리 띠 (사진 카드 윗몸·전신) — 피사체 위에서 band0~band1 높이 줄의 윤곽 폭·가운데 (보드 loadSil 이 픽셀 줄로 같은 띠를 잰다)
      var sh = maxY - minY;
      var band = _bandExtent(seln, maxY - CARD_BAND.band0 * sh, maxY - CARD_BAND.band1 * sh);
      if (band) {
        info.headWFrac = (band[1] - band[0]) / cw;
        info.headCxFrac = ((band[0] + band[1]) / 2) / cw;
      }
      // 윤곽 (사진 카드 D 칼선) — 조각을 합친 뒤 가장 큰 바깥 패스. 실패해도 다른 디자인은 그대로 만든다
      try { info.outline = _silOutline(tmp, cw, ch); } catch (eOut) { info.outline = null; }
      return info;
    } finally {
      try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {}
    }
  }


  // 윤곽들의 y 띠(yLo ≤ y ≤ yHi, y 위로) 안 x 범위 [min, max] — 세그먼트마다 베지어 9점을 찍어 잰다. 없으면 null (birthday.jsx 와 같음)
  function _bandExtent(items, yHi, yLo) {
    var mn = 1e9, mx = -1e9;
    function seg(a, c1, c2, b) {
      for (var k = 0; k <= 8; k++) {
        var t = k / 8, u = 1 - t;
        var x = u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0];
        var y = u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1];
        if (y <= yHi && y >= yLo) {
          if (x < mn) mn = x;
          if (x > mx) mx = x;
        }
      }
    }
    function walk(it) {
      if (it.typename === "PathItem") {
        var pts = it.pathPoints, n = pts.length;
        for (var i = 0; i < n; i++) {
          if (i === n - 1 && !it.closed) break;
          var p = pts[i], q = pts[(i + 1) % n];
          seg(p.anchor, p.rightDirection, q.leftDirection, q.anchor);
        }
      } else if (it.typename === "CompoundPathItem") {
        for (var j = 0; j < it.pathItems.length; j++) walk(it.pathItems[j]);
      } else if (it.typename === "GroupItem") {
        for (var g = 0; g < it.pageItems.length; g++) walk(it.pageItems[g]);
      }
    }
    for (var s = 0; s < items.length; s++) walk(items[s]);
    if (mx <= mn) return null;
    return [mn, mx];
  }

  // 트레이스 조각을 합치고 (range.jsx _traceAndUnite 와 같은 순서) 가장 큰 바깥 패스의 점 —
  // [앵커 u, v, 왼쪽 핸들 u, v, 오른쪽 핸들 u, v] (캔버스 분율, v = 위에서 아래로)
  function _silOutline(doc, cw, ch) {
    app.executeMenuCommand("deselectall");
    app.executeMenuCommand("selectall");
    app.executeMenuCommand("ungroup");
    app.executeMenuCommand("selectall");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");
    var sel = doc.selection, stack = [], paths = [];
    if (!sel || sel.length === 0) return null;
    for (var i = 0; i < sel.length; i++) stack.push(sel[i]);
    while (stack.length) {
      var it = stack.pop();
      if (it.typename === "PathItem") paths.push(it);
      else if (it.typename === "CompoundPathItem") { for (var j = 0; j < it.pathItems.length; j++) paths.push(it.pathItems[j]); }
      else if (it.typename === "GroupItem") { for (var k = 0; k < it.pageItems.length; k++) stack.push(it.pageItems[k]); }
    }
    var best = null, ba = -1;
    for (var m = 0; m < paths.length; m++) { var a = Math.abs(paths[m].area); if (a > ba) { ba = a; best = paths[m]; } }
    if (!best) return null;
    var out = [], pts = best.pathPoints;
    for (var n = 0; n < pts.length; n++) {
      var A = pts[n].anchor, L = pts[n].leftDirection, R = pts[n].rightDirection;
      out.push([A[0] / cw, (ch - A[1]) / ch, L[0] / cw, (ch - L[1]) / ch, R[0] / cw, (ch - R[1]) / ch]);
    }
    app.executeMenuCommand("deselectall");
    return out;
  }


  // ═══════════════════════════════════════════════════════
  //  EMBED 재탐색 (ring.jsx / mixed 동일)
  // ═══════════════════════════════════════════════════════
  function _findEmbeddedNear(layer, L, T, W, H) {
    for (var i = 0; i < layer.groupItems.length; i++) {
      var g = layer.groupItems[i];
      if (g.clipped) continue;
      if (_boundsMatch(g.geometricBounds, L, T, W, H)) { _stripPSDPaths(g); return g; }
    }
    for (var k = 0; k < layer.rasterItems.length; k++) {
      if (_boundsMatch(layer.rasterItems[k].geometricBounds, L, T, W, H)) return layer.rasterItems[k];
    }
    return null;
  }

  function _boundsMatch(b, L, T, W, H) {
    var w = b[2] - b[0], h = b[1] - b[3];
    return Math.abs(b[0] - L) < 1 && Math.abs(b[1] - T) < 1 &&
           Math.abs(w - W) < 1 && Math.abs(h - H) < 1;
  }

  function _stripPSDPaths(group) {
    if (group.pathItems) {
      for (var i = group.pathItems.length - 1; i >= 0; i--) {
        try { if (!group.pathItems[i].clipping) group.pathItems[i].remove(); } catch (e) {}
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


  // ═══════════════════════════════════════════════════════
  //  CUTCONTOUR (Everstory_mixed.jsx 규약 — M=100 SPOT, 0.25pt)
  // ═══════════════════════════════════════════════════════
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
    item.filled = false;
    item.stroked = true;
    item.strokeColor = cutSpot;
    item.strokeWidth = 0.25;
  }


  // ═══════════════════════════════════════════════════════
  //  TEXT HELPERS (ring.jsx 동일)
  // ═══════════════════════════════════════════════════════
  function _resolveHangulFont() {
    var candidates = ["TTOmniGothicL", "AppleSDGothicNeo-Bold", "AppleSDGothicNeo-SemiBold", "AppleGothic"];
    for (var i = 0; i < candidates.length; i++) {
      try { return app.textFonts.getByName(candidates[i]); } catch (e) {}
    }
    return null;
  }

  function _applyHangulFontOverride(textFrame, hangulFont) {
    if (!hangulFont) return;
    var s = textFrame.contents;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if ((c >= 0xAC00 && c <= 0xD7AF) || (c >= 0x1100 && c <= 0x11FF) || (c >= 0x3130 && c <= 0x318F)) {
        try { textFrame.textRange.characters[i].textFont = hangulFont; } catch (e) {}
      }
    }
  }

  // macOS 파일명/입력이 NFD 로 들어오면 조합해서 NFC 로 (shapes.jsx 동일)
  function _composeHangulNFC(s) {
    if (!s) return s;
    var out = "", i = 0;
    while (i < s.length) {
      var L = s.charCodeAt(i);
      if (L >= 0x1100 && L <= 0x1112 && i + 1 < s.length) {
        var V = s.charCodeAt(i + 1);
        if (V >= 0x1161 && V <= 0x1175) {
          var T = 0, step = 2;
          if (i + 2 < s.length) {
            var Tc = s.charCodeAt(i + 2);
            if (Tc >= 0x11A8 && Tc <= 0x11C2) { T = Tc - 0x11A7; step = 3; }
          }
          out += String.fromCharCode(0xAC00 + (L - 0x1100) * 21 * 28 + (V - 0x1161) * 28 + T);
          i += step; continue;
        }
      }
      out += s.charAt(i); i++;
    }
    return out;
  }


  // ═══════════════════════════════════════════════════════
  //  FILE / SAVE HELPERS (ring.jsx 동일)
  // ═══════════════════════════════════════════════════════
  // 주문 보드가 넘겨준 폴더 (consume-once — 다음 수동 실행 오염 방지)
  function _launchFolder() {
    var payload = null;
    try { payload = $.global.__EVERSTORY_LAUNCH__; } catch (e) { return null; }
    try { $.global.__EVERSTORY_LAUNCH__ = undefined; } catch (e2) {}
    if (!payload) return null;
    var f = new Folder(String(payload));
    if (f.exists) return f;
    return null;
  }

  function _collectPairs(folder) {
    var cleans = folder.getFiles(function (f) {
      return f instanceof File && /_clean\.psd$/i.test(f.name);
    });
    var out = [];
    for (var i = 0; i < cleans.length; i++) {
      var silPath = cleans[i].fsName.replace(/_clean\.psd$/i, "_sil.png");
      var sil = new File(silPath);
      out.push({
        // File.name 은 URI 인코딩된 NFD — 둘 다 풀어야 대화창·보드 이름과 맞는다
        base: _decodeName(cleans[i].name.replace(/_clean\.psd$/i, "")),
        clean: cleans[i],
        sil: (sil.exists ? sil : null)
      });
    }
    return out;
  }

  function _resolveOutputFolder(inputFolder) {
    var out;
    if (inputFolder.name.toLowerCase() === "02_cutout" && inputFolder.parent) {
      out = new Folder(inputFolder.parent.fsName + "/03_output");
    } else {
      out = new Folder(inputFolder.fsName + "/03_output");
    }
    if (!out.exists) out.create();
    return out;
  }

  function _deriveDefaultCustomerName(folder) {
    var f = folder;
    if (f.name.toLowerCase() === "02_cutout" && f.parent) f = f.parent;
    return _decodeName(f.name);
  }

  function _decodeName(s) {
    try { return _composeHangulNFC(decodeURI(s)); } catch (e) { return _composeHangulNFC(s); }
  }

  function _timestamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return "" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
           "_" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function _todayStr() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function _sizeTag(mm) {
    var inch = mm / 25.4;
    return inch.toFixed(2).replace(/\.?0+$/, "") + "in";
  }

  function _saveAi(doc, file) {
    var opts = new IllustratorSaveOptions();
    opts.compatibility = Compatibility.ILLUSTRATOR24;
    opts.pdfCompatible = true;
    opts.embedICCProfile = true;
    doc.saveAs(file, opts);
  }

  function _hexToRGB(hex) {
    var c = new RGBColor();
    c.red   = parseInt(hex.substring(0, 2), 16);
    c.green = parseInt(hex.substring(2, 4), 16);
    c.blue  = parseInt(hex.substring(4, 6), 16);
    return c;
  }

  function _trim(s) {
    return String(s).replace(/^\s+|\s+$/g, "");
  }

  // 사진 종류 (face·upper·full·whole) — 보드가 보낸 값 > 파일명 표시. 모르면 null
  function _shotType(opt, base) {
    if (opt.shotTypes && opt.shotTypes[base]) return opt.shotTypes[base];
    var m = SHOT_NAME_TOKEN_RE.exec(base);
    if (m && SHOT_NAME_TYPES[m[1].toUpperCase()]) return SHOT_NAME_TYPES[m[1].toUpperCase()];
    return null;
  }


  // ═══════════════════════════════════════════════════════
  //  BRAND TEMPLATE (template_cutout_v2.ait) — ring.jsx 그대로
  // ═══════════════════════════════════════════════════════
  function _resolveTemplate() {
    var scriptDir = (new File($.fileName)).parent;
    var candidates = [
      scriptDir.fsName + "/templates/" + TEMPLATE_NAME,
      scriptDir.parent.fsName + "/templates/" + TEMPLATE_NAME
    ];
    for (var i = 0; i < candidates.length; i++) {
      var f = new File(candidates[i]);
      if (f.exists) return f;
    }
    return File.openDialog(TEMPLATE_NAME + " 위치 선택", "*.ait");
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
      if (doc.layers[i].name.toLowerCase() === "info") { infoLayer = doc.layers[i]; break; }
    }
    if (!infoLayer) throw new Error("템플릿에 'info' 레이어가 없습니다");
    var item = _deepFindByName(infoLayer, pathName);
    if (!item) throw new Error("info 레이어 안에 '" + pathName + "' 가 없습니다");
    return item;
  }

  function _deepFindByName(container, name) {
    if (container.pathItems) {
      for (var i = 0; i < container.pathItems.length; i++)
        if (container.pathItems[i].name === name) return container.pathItems[i];
    }
    if (container.compoundPathItems) {
      for (var j = 0; j < container.compoundPathItems.length; j++)
        if (container.compoundPathItems[j].name === name) return container.compoundPathItems[j];
    }
    if (container.textFrames) {
      for (var t = 0; t < container.textFrames.length; t++)
        if (container.textFrames[t].name === name) return container.textFrames[t];
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

  function _drawHeader(opt, designCount, headerText) {
    var design = DESIGNS[opt.designIdx] || DESIGNS[0];
    var line1 = _composeHangulNFC(opt.customerName || "—") +
                " • Christmas " + design.key.toLowerCase() + " • " + _sizeTag(opt.sizeMm) + " / " + opt.sizeMm + "mm";
    var line2 = designCount + " design(s)";
    var line3 = "date: " + (opt.orderDate || _todayStr());
    headerText.contents = line1 + "\r" + line2 + "\r" + line3;
    _applyHangulFontOverride(headerText, _resolveHangulFont());
  }


  // ═══════════════════════════════════════════════════════
  //  DIALOG
  // ═══════════════════════════════════════════════════════
  function _report(msg) {
    if (QUIET) {
      try { $.global.__EVERSTORY_XMAS_RESULT__ = msg; } catch (e) {}
      return;
    }
    if (GUARDED) { PENDING = msg; return; }   // 경고 창을 다시 켠 뒤 finally 에서 띄운다
    alert(msg);
  }

  // 주문 보드 구성 화면 — $.global.__EVERSTORY_XMAS_OPTS__ (consume-once) 로 대화창을 건너뛴다
  // (composed_preview.build_script_launch). 화면에 없는 값은 대화창 기본값 그대로.
  function _consumePreset(pairs) {
    var raw = null;
    try { raw = $.global.__EVERSTORY_XMAS_OPTS__; } catch (eG) { return null; }
    try { $.global.__EVERSTORY_XMAS_OPTS__ = undefined; } catch (eC) {}
    if (!raw) return null;
    QUIET = (raw.quiet === true);

    var chosen = [];
    var names = raw.photoNames || [];
    for (var n = 0; n < names.length; n++) {
      for (var q = 0; q < pairs.length; q++) {
        if (pairs[q].base === names[n]) { chosen.push(pairs[q]); break; }
      }
    }
    if (chosen.length === 0) chosen.push(pairs[0]);

    var designIdx = DESIGN_DEFAULT;
    for (var d = 0; d < DESIGNS.length; d++) if (DESIGNS[d].key === raw.design) designIdx = d;
    var sizeMm = SIZE_MM[DESIGNS[designIdx].size];
    if (raw.sizeMm) sizeMm = raw.sizeMm;
    var colorMode = COLOR_MODE_DEFAULT;
    if (raw.colorMode >= 0 && raw.colorMode < COLOR_MODE_OPTIONS.length) colorMode = raw.colorMode;
    var border = BORDER_DEFAULT;
    if (raw.border >= 0 && raw.border < BORDER_OPTIONS.length) border = raw.border;

    return {
      designIdx:    designIdx,
      name:         _trim(String(raw.name || "")),
      line:         _trim(String(raw.line || "")),    // 오벌 아래 문구 (하트는 안 씀)
      sizeMm:       sizeMm,
      colorMode:    colorMode,
      border:       border,
      embed:        (raw.embed !== false),
      customerName: (raw.customerName != null ? String(raw.customerName) : _deriveDefaultCustomerName(folder)),
      orderDate:    (raw.orderDate ? String(raw.orderDate) : _todayStr()),
      shotTypes:    (raw.shotTypes || null),
      selectedPairs: chosen
    };
  }

  function _showDialog(pairs, folder) {
    var preset = _consumePreset(pairs);
    if (preset) return preset;
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 16;
    dlg.spacing = 10;

    // ── 디자인 ──
    var pD = dlg.add("panel", undefined, "디자인");
    pD.orientation = "column"; pD.alignChildren = "fill";
    pD.margins = [12, 16, 12, 12]; pD.spacing = 6;

    var designLabels = [];
    for (var di = 0; di < DESIGNS.length; di++) designLabels.push(DESIGNS[di].label);
    var gDesign = pD.add("group");
    gDesign.add("statictext", undefined, "디자인       ");
    var designDd = gDesign.add("dropdownlist", undefined, designLabels);
    designDd.selection = DESIGN_DEFAULT; designDd.preferredSize = [300, 24];

    var gName = pD.add("group");
    gName.add("statictext", undefined, "이름            ");
    var fName = gName.add("edittext", undefined, "");
    fName.preferredSize = [200, 22];
    gName.add("statictext", undefined, "하트 = 대문자 · MERRY = 첫 글자만 대문자");

    // 오벌 아래 문구 — 직접 쓰거나 틀을 고르면 이름을 넣어 채운다
    var gLine = pD.add("group");
    gLine.add("statictext", undefined, "아래 문구  ");
    var fLine = gLine.add("edittext", undefined, "");
    fLine.preferredSize = [200, 22];
    var presetLabels = ["틀 고르기…"];
    for (var pi = 0; pi < OVAL_LINE_PRESETS.length; pi++) presetLabels.push(OVAL_LINE_PRESETS[pi].replace(/\{name\}/g, "○○"));
    var presetDd = gLine.add("dropdownlist", undefined, presetLabels);
    presetDd.selection = 0; presetDd.preferredSize = [190, 24];
    presetDd.onChange = function () {
      if (!presetDd.selection || presetDd.selection.index === 0) return;
      fLine.text = OVAL_LINE_PRESETS[presetDd.selection.index - 1].replace(/\{name\}/g, _trim(fName.text));
      presetDd.selection = 0;
    };

    var gSize = pD.add("group");
    gSize.add("statictext", undefined, "사이즈       ");
    var sizeDd = gSize.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDd.selection = SIZE_DEFAULT; sizeDd.preferredSize = [200, 24];

    var gColor = pD.add("group");
    gColor.add("statictext", undefined, "색              ");
    var colorDd = gColor.add("dropdownlist", undefined, COLOR_MODE_OPTIONS);
    colorDd.selection = COLOR_MODE_DEFAULT; colorDd.preferredSize = [260, 24];

    var gBorder = pD.add("group");
    gBorder.add("statictext", undefined, "테두리       ");
    var borderDd = gBorder.add("dropdownlist", undefined, BORDER_OPTIONS);
    borderDd.selection = BORDER_DEFAULT; borderDd.preferredSize = [300, 24];

    var gFont = pD.add("group");
    gFont.add("statictext", undefined, "서체            ");
    var fontStat = gFont.add("statictext", undefined, "");
    fontStat.preferredSize = [380, 20];
    // 디자인을 바꾸면 사이즈·서체 안내·쓰는 칸이 따라 바뀐다 (오벌 = 흰 테두리 · 레드 한 색 고정)
    function syncDesign() {
      var dsg = DESIGNS[designDd.selection.index] || DESIGNS[0];
      var isOval = (dsg.key === "OVAL");
      var isMerry = (dsg.key === "MERRY");
      var isCard = !!_cardSpec(dsg.key);
      sizeDd.selection = dsg.size;
      colorDd.enabled = !isOval && !isMerry && !isCard;   // 하트만 색·테두리를 고른다
      borderDd.enabled = !isOval && !isMerry && !isCard;
      fLine.enabled = isOval;
      presetDd.enabled = isOval;
      if (isOval && !_trim(fLine.text) && _trim(fName.text))
        fLine.text = OVAL_LINE_PRESETS[OVAL_LINE_PRESET_DEFAULT].replace(/\{name\}/g, _trim(fName.text));
      var txt;
      if (isCard) {
        var cnDlg = _resolveFontList(MERRY_NAME_FONTS), csDlg = _resolveFontList(CARD_SCRIPT_FONTS), ccDlg = _resolveFontList(CARD_CAPS_FONTS);
        txt = cnDlg.spec.name + " (이름) + " + csDlg.spec.name + " · " + ccDlg.spec.name;
        if (cnDlg.fallback || csDlg.fallback || ccDlg.fallback) txt = txt + "  ⚠ 없는 서체 있음 (Adobe Fonts 확인)";
      } else if (isOval) {
        var sDlg = _resolveFontList(OVAL_SCRIPT_FONTS), oDlg = _resolveFontList(OVAL_FONTS);
        txt = sDlg.spec.name + " + " + oDlg.spec.name;
        if (sDlg.fallback || oDlg.fallback) txt = txt + "  ⚠ 없는 서체 있음 (Adobe Fonts 확인)";
      } else if (isMerry) {
        var mDlg = _resolveFontList(MERRY_NAME_FONTS);
        txt = mDlg.spec.name + " (리본 이름) + 레터링·모자 그림";
        if (mDlg.fallback) txt = txt + "  ⚠ " + MERRY_NAME_FONTS[0].name + " 없음";
        if (!_templateFile(MERRY_ART)) txt = txt + "  ⚠ templates/" + MERRY_ART + " 없음";
      } else {
        var nfDlg = _resolveNameFont();
        txt = nfDlg.spec.name;
        if (nfDlg.fallback) txt = txt + "  ⚠ " + NAME_FONTS[0].name + " 없음 (Adobe Fonts 확인)";
      }
      fontStat.text = txt;
    }
    designDd.onChange = syncDesign;
    syncDesign();

    // ── 제작 ──
    var pM = dlg.add("panel", undefined, "제작");
    pM.orientation = "column"; pM.alignChildren = "fill";
    pM.margins = [12, 16, 12, 12]; pM.spacing = 6;

    var gCust = pM.add("group");
    gCust.add("statictext", undefined, "고객 이름  ");
    var fCust = gCust.add("edittext", undefined, _deriveDefaultCustomerName(folder));
    fCust.preferredSize = [180, 22];
    gCust.add("statictext", undefined, "날짜");
    var fDate = gCust.add("edittext", undefined, _todayStr());
    fDate.preferredSize = [100, 22];

    var embedChk = pM.add("checkbox", undefined, "사진 embed (해제 시 linked — 합성만 빠르게 확인)");
    embedChk.value = true;

    // ── 페어 ──
    var pP = dlg.add("panel", undefined, "사용할 사진 (multi-select — 칸마다 돌아가며)");
    pP.orientation = "column"; pP.alignChildren = "fill";
    pP.margins = [12, 16, 12, 12]; pP.spacing = 6;
    var items = [];
    for (var i = 0; i < pairs.length; i++) {
      items.push(pairs[i].base + (pairs[i].sil ? "" : "  (sil 없음)"));
    }
    var lb = pP.add("listbox", undefined, items, { multiselect: true });
    lb.preferredSize = [340, 130];
    lb.selection = 0;

    var hint = dlg.add("statictext", undefined,
      "하트·MERRY·오벌은 머리만 오린 얼굴 누끼용이에요. 사진 카드(A·C·D)는 윗몸·전신(_MED·_BIG)이면 머리 크기를 맞추고 아래는 창이 잘라요.");
    try {
      hint.graphics.foregroundColor =
        hint.graphics.newPen(hint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1);
    } catch (eh) {}

    var btns = dlg.add("group"); btns.alignment = "right"; btns.spacing = 10;
    btns.add("button", undefined, "취소", { name: "cancel" });
    var ok = btns.add("button", undefined, "생성", { name: "ok" });
    ok.active = true;

    ok.onClick = function () {
      if (!lb.selection || (lb.selection.length === 0)) {
        alert("사진을 최소 1장 선택하세요.");
        return;
      }
      var okOval = (DESIGNS[designDd.selection.index].key === "OVAL");
      if (!okOval && !_trim(fName.text)) {
        alert("스티커에 들어갈 이름을 적어 주세요.");
        return;
      }
      if (okOval && !_trim(fLine.text)) {
        alert("오벌 아래 문구를 적어 주세요 (틀을 고르면 이름을 넣어 채워요).");
        return;
      }
      dlg.close(1);
    };

    if (dlg.show() !== 1) return null;

    var selectedPairs = [];
    var s = lb.selection;
    if (s) {
      if (s.length == null) s = [s];
      for (var j = 0; j < s.length; j++) selectedPairs.push(pairs[s[j].index]);
    }
    if (selectedPairs.length === 0) return null;

    return {
      designIdx:    designDd.selection.index,
      name:         _trim(fName.text),
      line:         _trim(fLine.text),
      sizeMm:       SIZE_MM[sizeDd.selection.index],
      colorMode:    colorDd.selection.index,
      border:       borderDd.selection.index,
      embed:        embedChk.value,
      customerName: _trim(fCust.text),
      orderDate:    _trim(fDate.text),
      shotTypes:    null,
      selectedPairs: selectedPairs
    };
  }

})();
