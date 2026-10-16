// ═══════════════════════════════════════════════════════════════
//  Everstory Special Day 시트 (생일 디자인 × 여러 장)
//  보이는 이름 = Special Day (2026-10-13 사용자 — 주문 보드 스크립트 이름·대화창 제목·완료 창·시트 머리글).
//  파일 이름(Everstory_birthday.jsx)·저장 파일 _BDAY_·보드 키 bday 는 그대로 둔다.
//
//  디자인 1 = 하트 사진 스티커 (2026-10-07, 참고 Sticker Guidelines/IMG_3165 — 인스타 eunine_s 생일 답례 스티커):
//   흰 사각 + 위 "HAPPY BIRTHDAY" + 하늘색 하트 안 사진 + 하트 아래 오른쪽 서명 + 손글씨 문구 두 줄 + 빨간 하트.
//   사진 = 윗몸·전신이면 머리 크기를 맞추고 몸은 하트가 자른다 (참고 그대로 · 사용자 A안), 얼굴 누끼면 얼굴 상자에 통째로.
//   문구·서명 = 고객이 쓴 그대로 (사용자 2026-10-07 "문구는 고객이 쓰게") — 기본값은 "Hey friend!" / "Thanks for coming!".
//  디자인 2 = 원 사진 (2026-10-10, 사용자 시안 #1 "YENA / SPECIAL DAY" — 하트 사진의 개선판, 둘 다 쓴다):
//   흰 사각 + 위 이름 (Bree Serif Bold 대문자 한 줄) + "SPECIAL DAY" 한 줄 + 양옆 분홍 손그림 하트 +
//   하늘색 원 안 사진 + 손글씨 문구 한 줄 + 분홍 하트. 사진 규칙은 하트와 같다 (윗몸·전신 = 머리 띠 맞춤, 몸은 원이 자른다).
//   시안은 이름·SPECIAL DAY 가 아치였지만 사용자가 일직선으로 정했다 (10-10 "원 따라서 둥글게 안 해도 돼" → 둘 다 일직선).
//   이름·작은 글씨·문구 = 고객이 쓴 그대로 — 기본값은 "SPECIAL DAY" / "So glad you came!".
//  디자인 3 = 팝 사진 (2026-10-13, HEART 가 시장 상품과 겹쳐서 — "지금 스타일 + 조금의 차별점". 시안 ROUND 1–5 =
//   아티팩트 VUujeTFuccnyMGyVuiumDA):
//   흰 사각 + HAPPY(검정)/BIRTHDAY(빨강) 두 줄 가운데 + 색 프레임 + 머리가 프레임 밖으로 + 문구·이름 한 줄 + 빨간 하트.
//   고른 것을 전부 옵션으로 (사용자 "여태까지 고른 것들을 다 옵션으로") — 레이아웃 2 · 제목 서체 3 · 문구 서체 2 ·
//   프레임 색 6 (운영자가 사진 보고 고름) · 모양 4 (하트 · 기울인 하트 · 구름 · 원).
//  template_cutout_v2.ait (운영 v2 브랜드 템플릿) 위에 02_cutout 페어(_clean.psd + _sil.png)를
//  앉혀 A5 한 시트에 균일 격자로 깐다. 고른 사진이 칸마다 돌아가며 들어간다.
//
//  플로우: 02_cutout 폴더(주문 보드가 넘기거나 직접 선택) → 대화창(또는 보드 OPTS) →
//  시트 생성 → info > header > header_right 주입 → 03_output/{ts}_BDAY_{HEART|CIRCLE}_{inch}in_sheet01.ai 저장.
//
//  한 장 (z-order 위→아래):
//    ① 빨간 하트 (문구 끝) · 문구 두 줄 · 서명 · HAPPY BIRTHDAY (point text — 편집 가능, 아웃라인 안 함)
//    ② 사진 클립 그룹 [clip(하트) · 누끼 사진]
//    ③ 하트 (하늘색)
//    ④ 흰 판 (칼선 크기 둥근 사각)
//    칼선 (KissCut, CutContour) = 둥근 사각
//  원 사진은 ① 이 [분홍 하트 · 문구 · 하트 2 · 작은 글씨 · 이름 (전부 point text)], ②③ 이 원이다. 칼선은 같은 둥근 사각.
//  팝 사진은 ② 의 클립이 [프레임 ∪ 머리 둘레 직사각형] (Pathfinder 더하기) — 머리만 프레임 밖으로 나온다. 칼선은 같은 둥근 사각.
//
//  수치는 전부 참고 이미지 실측이다 (사진을 13° 바로 세워 잼 — 되돌리거나 "예쁜 숫자"로 반올림하지 말 것):
//   · 스티커 세로 = 폭 × 1.076, 모서리 반지름 0.02W
//   · 제목 = Bree Serif Bold — BIRTHDAY 잉크 폭 0.734W (= 대문자 높이 × 7.36, 참고와 같은 비율), 가운데.
//     HAPPY 는 같은 왼쪽 선 (두 줄 원점이 같다)
//   · 하트 = 1번 크리스마스 하트와 같은 6점 베지어 매개, 참고 실루엣과 IoU 0.986 (세로/가로 0.77 — 1번보다 납작)
//   · 문구 = Shantell Sans Medium, 두 줄 가운데. 끝에 빨간 하트 (글자 크기 × 0.835). 넘치면 두 줄을 같이 줄인다
//   · 서명 = 하트 아래 오른쪽 (오른쪽 끝 0.916W) — 문구 글자의 0.65배
//  원 사진 수치도 시안 #1 (1173×1341px, W = 1173px) 실측이다 — 이름·SPECIAL DAY 세로 자리만 일직선에 맞춰 새로 잡았다:
//   · 스티커 세로 = 폭 × 1.1432 (시안 캔버스 그대로) — 그래서 1.75″ 가 9장 (2″ 는 세로 3줄이 안 들어가 4장)
//   · 이름 = 대문자 높이 0.1783W · 기준선 0.2442W (시안 아치 꼭대기 그대로) · SPECIAL DAY = 0.0438W · 자간 156 ·
//     기준선 0.312W (일직선이라 하트가 이름에 닿지 않게 내렸다 — 사용자가 고른 ② 그림 그대로)
//   · 하트 3개 = 손으로 그린 비대칭 하트 — 셋을 겹쳐 평균 낸 모양 (BN_DOODLE). 왼쪽 위는 거울
//
//  함정 (기존 스크립트에서 실측 — 되돌리지 말 것):
//   · var 테이블은 호이스팅 안 됨. 메인 플로우보다 위에 둘 것.
//   · 여러 줄에 걸친 중첩 삼항 연산자 금지 — ExtendScript 에서 틀린 분기가 실행된다. if/else 로.
//   · embed() 후 placedItem 핸들은 무효 — bounds 매칭으로 재탐색.
//   · 베지어 점은 전부 CORNER — SMOOTH 는 핸들을 일직선으로 강제해 모양이 바뀐다.
//   · geometricBounds 를 읽은 뒤에는 characterAttributes 핸들을 다시 잡는다 (주소 라벨 함정).
//   · 자동 실행 중 Illustrator 자체 경고 창(색상 프로파일 등)이 뜨면 통째로 멈춘다 → DONTDISPLAYALERTS 가드.
//
//  사용: File → Scripts → Other Script → Everstory_birthday.jsx (주문 보드 '구성' → 스크립트 Special Day 로도 실행)
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "special day v1";
  var SCRIPT_TITLE = "Everstory Special Day Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var TEMPLATE_NAME = "template_cutout_v2.ait";

  // ── 시트 (Everstory_ring.jsx 와 같은 운영 상수) ─────────────────
  var BODY_PADDING_X_MM = 0;
  var BODY_PADDING_Y_MM = 1.5;
  var GAP_DEFAULT_MM = 1.5;

  // ── 디자인 — 다음 디자인은 이 표에 한 줄 + _buildSheet 의 compose 분기 ──
  //   size = 디자인을 고르면 맞춰지는 사이즈 (SIZE_MM 번호)
  //   2026-10-13 저녁 하나로 합쳤다 (사용자: "디자인을 3개로 나누지 말고, 사진이 팝인지·프레임 모양·컬러를 고르게").
  //   하트 사진(HEART)·원 사진(CIRCLE)은 목록에서 뺐다 — 팝 사진 엔진의 '프레임 안'(POP_INSIDE) + 하트·원 모양이 대신한다.
  //   두 디자인의 그리기 코드(_composeHeartAt·_composeCircleAt · BD_* · BN_*)는 남겨 둔다 (프레임 안 실측값의 출처)
  var DESIGNS = [
    { key: "POP", label: "사진 스티커 — 팝·모양·색 고르기", size: 2 }
  ];
  var DESIGN_DEFAULT = 0;

  // ── 사이즈 = 칼선 폭. 칼선 높이 = 폭 × BD.h (원 사진은 BN.h) ──
  //   시트 장수: 하트 1.5″ 12 · 1.75″ 9 · 2″ 6 · 2.5″ 4  /  원 사진 1.5″ 9 · 1.75″ 9 · 2″ 4 · 2.5″ 4
  var SIZE_OPTIONS = ["1.5\" / 38mm", "1.75\" / 44mm", "2\" / 51mm", "2.5\" / 64mm"];
  var SIZE_MM      = [38.1, 44.45, 50.8, 63.5];
  var SIZE_DEFAULT = 2;

  // ── 하트 사진 스티커 (참고 IMG_3165 실측 — 스티커 폭 W = 1, 위·왼쪽 = 0, y 아래) ──
  //   h = 세로 · r = 모서리 반지름
  var BD = { h: 1.076, r: 0.02 };
  //   제목 — base1·base2 = HAPPY·BIRTHDAY 기준선 · left = BIRTHDAY 잉크 왼쪽 · inkW = BIRTHDAY 잉크 폭 · size = 첫 글자 크기
  //   (Bree Serif Bold 로 inkW 가 되는 크기. 다른 서체로 바뀌어도 BIRTHDAY 잉크 폭을 재서 inkW 에 맞춘다)
  var BD_TITLE = { base1: 0.150, base2: 0.282, left: 0.133, inkW: 0.734, size: 0.1489 };
  //   하트 자리 (bbox 왼쪽 위 · 폭) — 가운데
  var BD_HEART_AT = { left: 0.1804, top: 0.3196, w: 0.6393 };
  //   하트 모양 — 폭 1 정규화 · y 아래 · 오른쪽 절반 3세그먼트 (오목점 N → 봉우리 P → 옆 E → 꼭지 T), 왼쪽은 거울.
  //   크리스마스 1번 HEART 와 같은 매개, 참고 실루엣 IoU 0.986 (2026-10-07 피팅값)
  var BD_HEART = { n: 0.1162, pkx: 0.74, a1: 0.0375, b1: 0.055, a2: 0.0925, a3: 0.15, ey: 0.28, b3: 0.1612, b4: 0.225, a5: 0.3475, b5: 0.0525, h: 0.7706 };
  //   얼굴 누끼 — 피사체 bbox 를 상자에 통째로 (가운데, 턱 = 상자 아래). 머리카락이 오목점에 잘리지 않는 위 0.40W ~ 꼭지 위 0.79W
  var BD_FACE = { top: 0.40, bottom: 0.79, maxW: 0.40 };
  //   윗몸·전신 — 피사체 위에서 band0~band1 (높이 비율) 띠의 폭 = 머리 폭으로 보고 headW 에 맞춘다.
  //   피사체 위 = top, 머리 가운데 = cx. 몸은 하트가 자른다 (참고: 머리 폭 0.19W, 머리 위 0.405W).
  //   wideK = 머리 띠가 피사체 폭의 이만큼을 넘으면 의자·손까지 잰 것일 수 있어 완료 창에서 알린다 (하린 h44 의자 0.77)
  var BD_UPPER = { headW: 0.20, top: 0.405, cx: 0.5, band0: 0.08, band1: 0.20, wideK: 0.7 };
  //   문구 — base1·base2 = 두 줄 기준선 (한 줄이면 가운데 baseOne) · size = 글자 크기 · maxW = 한 줄 최대 폭
  //   (빨간 하트 포함) · cx = 가운데. 넘치면 두 줄을 같이 줄인다
  var BD_MSG = { base1: 0.915, base2: 1.010, baseOne: 0.9625, size: 0.0802, maxW: 0.853, cx: 0.5 };
  //   서명 — 기준선 · 잉크 오른쪽 끝 · 크기 = 문구 기본 크기 × k · 최대 폭 (하트 오른쪽 아래 빈자리)
  var BD_SIG = { base: 0.800, right: 0.916, k: 0.65, maxW: 0.30 };
  //   문구 끝 빨간 하트 — 폭 = 글자 크기 × w · 간격 = 글자 크기 × gap · 세로 가운데 = 대문자 높이 가운데
  var BD_MINI = { w: 0.835, gap: 0.25 };                  // 간격은 참고(0.15)보다 넓게 — 영어 "!" 에 붙어 보여서 (10-07 실측)
  var BD_COLORS = { heart: "CFE2F1", red: "D7192D", ink: "141414" };
  //   기본 문구 — 보드·대화창이 미리 채운다 (고객이 쓴 문구로 바꾼다)
  var BD_MSG_DEFAULT = ["Hey friend!", "Thanks for coming!"];
  // 서체 — 위에서부터 Illustrator 에 있는 것을 쓴다. cap = 대문자 높이/em (빨간 하트 세로 자리)
  var BD_TITLE_FONTS = [
    { name: "Bree Serif Bold", ps: "BreeSerif-Bold", cap: 0.665 },
    { name: "Bree Serif",      ps: "BreeSerif-Regular", cap: 0.665 },
    { name: "Charter Black",   ps: "Charter-Black", cap: 0.671 }
  ];
  var BD_HAND_FONTS = [
    { name: "Shantell Sans Medium", ps: "ShantellSans-Medium", cap: 0.709 },
    { name: "Shantell Sans Bold",   ps: "ShantellSans-Bold", cap: 0.709 },
    { name: "Caveat Bold",          ps: "Caveat-Bold", cap: 0.723 }
  ];
  // 한글이 섞인 문구·서명 — 손글씨 느낌 한글 서체 (없으면 고딕)
  var HANGUL_HAND_FONTS = ["NanumPen", "AppleSDGothicNeo-Medium", "AppleSDGothicNeo-Bold"];
  // 한글 이름 (원 사진의 큰 이름) — 굵은 고딕
  var HANGUL_BOLD_FONTS = ["AppleSDGothicNeo-Heavy", "AppleSDGothicNeo-ExtraBold", "AppleSDGothicNeo-Bold"];

  // ── 원 사진 (사용자 시안 #1, 2026-10-10 실측 — 스티커 폭 W = 1, 위·왼쪽 = 0, y 아래) ──
  var BN = { h: 1.1432, r: 0.02 };
  //   이름 — 대문자 한 줄. 대문자 높이 cap · 기준선 base · 잉크 최대 폭 maxW
  //   (넘치면 줄이고 대문자 가운데 높이는 그대로 — 위아래 여백이 같이 는다)
  var BN_NAME = { cap: 0.1783, base: 0.2442, maxW: 0.78 };
  //   작은 글씨 (SPECIAL DAY) — 대문자 한 줄. 글자 크기 size (Shantell Sans Bold em) · 기준선 base · 자간 track (1/1000 em) ·
  //   잉크 최대 폭 maxW (양옆 하트까지 스티커 안에 들게 — 넘치면 줄인다. 시안 SPECIAL DAY = 0.365W)
  var BN_SUB = { size: 0.0438, base: 0.312, track: 156, maxW: 0.62 };
  //   작은 글씨 양옆 하트 — 잉크 끝에서 하트 가운데까지 gap · 기준선 위 rise (하트 가운데) · 폭 w.
  //   오른쪽은 그린 그대로 (시안 오른쪽 위 하트), 왼쪽은 거울
  var BN_SUB_HEART = { gap: 0.0722, rise: 0.0211, w: 0.0613 };
  //   원 — 가운데 · 반지름 (하늘색, 사진 클립)
  var BN_CIRCLE = { cx: 0.5, cy: 0.6491, r: 0.3167 };
  //   얼굴 누끼 — 얼굴 상자 (위 · 아래 = 턱 · 최대 폭)
  var BN_FACE = { top: 0.40, bottom: 0.89, maxW: 0.44 };
  //   윗몸·전신 — 머리 띠 폭 → headW, 피사체 위 = top, 머리 가운데 = cx. 몸은 원이 자른다
  //   (참고 머리 0.31W · 띠 0.29W · 머리 위 0.382W. 띠 높이·경고 기준은 BD_UPPER 와 같다)
  var BN_UPPER = { headW: 0.29, top: 0.3819, cx: 0.5 };
  //   문구 — 한 줄 기준선 baseOne · 크기 size / 두 줄 base1·base2 · 크기 size2 · 최대 폭 maxW (끝 하트 포함) · 가운데 cx
  var BN_MSG = { size: 0.062, baseOne: 1.0345, base1: 1.0195, base2: 1.0900, size2: 0.0527, maxW: 0.80, cx: 0.5 };
  //   문구 끝 하트 — 폭 · 간격 · 기준선 위 하트 가운데 = 글자 크기 × , 반시계 기울기 rot (°)
  var BN_MINI = { w: 1.025, gap: 0.38, rise: 0.433, rot: 4.1 };
  //   손그림 하트 — 참고 하트 3개를 겹쳐 평균 낸 모양 (베지어 9점, IoU 0.987). 폭 1 · y 아래 · bbox 왼쪽 위 원점,
  //   점마다 [앵커 x, y, 들어오는 핸들 x, y, 나가는 핸들 x, y]. 첫 점 = 위 오목점. 그린 그대로가 오른쪽 위 하트
  var BN_DOODLE = { h: 1.0456, pts: [
    0.4779, 0.3549, 0.4294, 0.285, 0.5121, 0.3444,
    0.5708, 0.262, 0.5437, 0.2876, 0.6344, 0.2019,
    0.7996, 0.1366, 0.7121, 0.1512, 1.0243, 0.0992,
    0.9783, 0.4568, 1.0189, 0.3107, 0.9302, 0.6301,
    0.5073, 0.9552, 0.6536, 0.8577, 0.4443, 0.9973,
    0.2808, 1.041, 0.3625, 1.0637, 0.2045, 1.0198,
    0.1421, 0.8442, 0.1713, 0.9099, 0.0566, 0.6518,
    0.018, 0.185, -0.041, 0.3974, 0.0592, 0.0367,
    0.3631, 0.0586, 0.2399, -0.0728, 0.4559, 0.1576
  ] };
  var BN_COLORS = { circle: "BCDDEF", pink: "E47479", ink: "25211D" };
  //   기본 글씨 — 보드·대화창이 미리 채운다 (고객이 쓴 것으로 바꾼다. 작은 글씨를 비우면 양옆 하트와 같이 빠진다)
  var BN_SUB_DEFAULT = "SPECIAL DAY";
  var BN_MSG_DEFAULT = ["So glad you came!", ""];
  //   이름 서체 — 시안 글자 모양은 Etna Extrabold 가 가장 가깝지만(IoU 0.772) 세리프가 날카로워서, 사용자가
  //   부드러운 후보 6개 중 Bree Serif Bold 를 골랐다 (2026-10-10 "글꼴이 너무 날카로운데" → E). 하트 제목과 같은 서체
  var BN_NAME_FONTS = [
    { name: "Bree Serif Bold", ps: "BreeSerif-Bold", cap: 0.665 },
    { name: "Etna Extrabold",  ps: "Etna-Extrabold", cap: 0.700 },
    { name: "Charter Black",   ps: "Charter-Black", cap: 0.671 }
  ];
  var BN_HAND_FONTS = [
    { name: "Shantell Sans Bold",   ps: "ShantellSans-Bold", cap: 0.709 },
    { name: "Shantell Sans Medium", ps: "ShantellSans-Medium", cap: 0.709 },
    { name: "Caveat Bold",          ps: "Caveat-Bold", cap: 0.723 }
  ];
  // ── 팝 사진 (2026-10-13 — 시안 ROUND 4·5 수치 그대로, 스티커 폭 W = 1, 위·왼쪽 = 0, y 아래) ──
  var POP = { h: 1.076, r: 0.02 };
  //   레이아웃 — happy·birthday = 제목 두 줄 기준선 (가운데) · inkW = 넓은 줄 잉크 폭 상한 · capMax = 대문자 높이 상한 ·
  //   bottom = 프레임 바닥 · msgBase·msgSize = 문구 한 줄 기준선·크기. 사용자가 "글자 비중이 너무 커" 해서 HEART 보다 줄였다
  //   (제목 대문자 0.115 → 0.09W, 문구·서명 두 줄 → 한 줄)
  var POP_LAYOUTS = [
    { key: "TITLE_TOP", label: "제목 위 (L1 가운데 정렬)", happy: 0.12, birthday: 0.225, inkW: 0.60, capMax: 0.09, bottom: 0.89, msgBase: 0.995, msgSize: 0.066 },
    { key: "PHOTO_TOP", label: "사진 위 (L3 사진 먼저)", happy: 0.79, birthday: 0.893, inkW: 0.58, capMax: 0.088, bottom: 0.665, msgBase: 1.012, msgSize: 0.062 }
  ];
  //   프레임 영역 — 폭 ≤ wMax · 높이 h 안에 모양 비율 그대로, 가운데·바닥(레이아웃 bottom) 맞춤 (하트 = 폭 0.74W)
  var POP_REGION = { wMax: 0.80, h: 0.57 };
  //   제목 서체 (A1·A2·A3) · 문구 서체 (B2·B5) — 고른 것이 없으면 같은 표의 다음 서체로 쓰고 완료 창이 알린다.
  //   cap = 대문자 높이/em (실측 — 제목 상한·끝 하트 세로 자리)
  var POP_TITLE_FONTS = [
    { key: "BREE", name: "Bree Serif Bold", ps: "BreeSerif-Bold", cap: 0.665 },
    { key: "TITAN", name: "Titan One", ps: "TitanOne", cap: 0.71 },
    { key: "FREDOKA", name: "Fredoka Bold", ps: "Fredoka-Bold", cap: 0.70 }
  ];
  var POP_HAND_FONTS = [
    { key: "FREDOKA", name: "Fredoka Medium", ps: "Fredoka-Medium", cap: 0.70 },
    { key: "PATRICK", name: "Patrick Hand", ps: "PatrickHand-Regular", cap: 0.662 }
  ];
  //   프레임 색 — 운영자가 사진을 보고 고른다 (파란 옷 + 하늘색이면 묻힌다 — 분홍·버터 쪽이 사진을 띄운다).
  //   accent = BIRTHDAY 글자 · 문구 끝 하트 (2026-10-13 사용자: 프레임 색에 따라 바뀌게, 같은 색일 필요는 없고 어울리는 색).
  //   프레임과 같은 계열의 진한 색 — 흰 바탕 명암비 ≥ 3.8 (제목 크기에서 읽힌다). HAPPY·문구 글자는 검정 그대로
  //   (ROUND 1: 제목 전체 색 ✗ · 두 색 ✓)
  //   분홍만 예외 — 원래 빨강(POP_TEXT_COLORS.accent D7192D) 그대로. Special Day 상품 갤러리 사진 1번이 이 색이라
  //   보이는 것과 받는 것을 맞췄다 (2026-10-13 사용자 "추천대로", 라즈베리 D3365E 대신)
  var POP_COLORS = [
    { key: "SKY", name: "하늘", hex: "CFE2F1", accent: "2F6FB8" },
    { key: "BLUSH", name: "분홍", hex: "F6D3D8", accent: "D7192D" },
    { key: "BUTTER", name: "버터", hex: "F7E3A3", accent: "E0532D" },
    { key: "MINT", name: "민트", hex: "CFE8D7", accent: "2E8F5E" },
    { key: "LILAC", name: "라일락", hex: "DED5EF", accent: "7A4FC6" },
    { key: "PEACH", name: "피치", hex: "F8D6C3", accent: "C2452E" }
  ];
  //   모양 — 사용자가 12가지 중 고른 4가지 (ROUND 5 M0·M1·M3·M11). aspect = 세로/가로.
  //   기울인 하트·구름 = 예전 피팅 도형(사진 프레임 8종 — 정의 파일은 없어짐)을 하린 60·76 결과물 _sil 에서 다시 딴 윤곽
  //   (구름은 원래 세로라 90° 눕혔다). 손그림 기울기·비대칭이 모양의 핵심 — 대칭으로 "정리"하지 말 것
  var POP_SHAPES = [
    { key: "HEART", label: "하트", aspect: 0.7706 },
    { key: "PUFF", label: "기울인 하트", aspect: 1.1184 },
    { key: "CLOUD", label: "구름", aspect: 0.7468 },
    { key: "CIRCLE", label: "원", aspect: 1 }
  ];
  //   윤곽 점 [x, y, …] — 폭 1 · y 아래 · bbox 왼쪽 위 원점, 120점 (점 사이는 Catmull-Rom 핸들로 매끈하게)
  var POP_PUFF = { aspect: 1.1184, pts: [
    0.2711, 0.0000, 0.2998, 0.0000, 0.3283, 0.0026, 0.3563, 0.0084, 0.3834, 0.0176, 0.4090, 0.0306, 0.4325, 0.0469, 0.4536, 0.0664,
    0.4725, 0.0879, 0.4904, 0.1102, 0.5069, 0.1337, 0.5225, 0.1577, 0.5376, 0.1821, 0.5605, 0.1675, 0.5815, 0.1481, 0.6029, 0.1290,
    0.6257, 0.1117, 0.6502, 0.0967, 0.6764, 0.0852, 0.7042, 0.0781, 0.7326, 0.0743, 0.7612, 0.0744, 0.7896, 0.0778, 0.8175, 0.0842,
    0.8440, 0.0950, 0.8688, 0.1094, 0.8917, 0.1266, 0.9122, 0.1466, 0.9298, 0.1692, 0.9457, 0.1930, 0.9592, 0.2183, 0.9703, 0.2448,
    0.9794, 0.2720, 0.9873, 0.2995, 0.9927, 0.3276, 0.9972, 0.3559, 0.9985, 0.3845, 1.0000, 0.4131, 0.9989, 0.4417, 0.9968, 0.4702,
    0.9930, 0.4986, 0.9873, 0.5267, 0.9807, 0.5546, 0.9717, 0.5818, 0.9620, 0.6088, 0.9510, 0.6352, 0.9390, 0.6613, 0.9261, 0.6868,
    0.9124, 0.7120, 0.8979, 0.7367, 0.8827, 0.7610, 0.8665, 0.7847, 0.8498, 0.8079, 0.8325, 0.8308, 0.8149, 0.8535, 0.7965, 0.8754,
    0.7771, 0.8965, 0.7576, 0.9176, 0.7371, 0.9376, 0.7163, 0.9572, 0.6946, 0.9759, 0.6724, 0.9941, 0.6498, 1.0118, 0.6264, 1.0283,
    0.6026, 1.0443, 0.5778, 1.0586, 0.5529, 1.0728, 0.5270, 1.0849, 0.5007, 1.0963, 0.4737, 1.1059, 0.4459, 1.1130, 0.4178, 1.1184,
    0.3895, 1.1152, 0.3633, 1.1036, 0.3391, 1.0884, 0.3170, 1.0701, 0.2965, 1.0501, 0.2771, 1.0290, 0.2583, 1.0073, 0.2410, 0.9845,
    0.2237, 0.9616, 0.2066, 0.9387, 0.1888, 0.9162, 0.1725, 0.8926, 0.1562, 0.8691, 0.1409, 0.8448, 0.1269, 0.8198, 0.1130, 0.7948,
    0.0996, 0.7694, 0.0875, 0.7434, 0.0760, 0.7172, 0.0653, 0.6906, 0.0550, 0.6639, 0.0459, 0.6367, 0.0369, 0.6094, 0.0296, 0.5818,
    0.0224, 0.5541, 0.0164, 0.5260, 0.0105, 0.4980, 0.0070, 0.4695, 0.0030, 0.4412, 0.0013, 0.4126, 0.0000, 0.3840, 0.0000, 0.3553,
    0.0026, 0.3268, 0.0055, 0.2983, 0.0105, 0.2701, 0.0166, 0.2421, 0.0242, 0.2144, 0.0354, 0.1881, 0.0477, 0.1622, 0.0620, 0.1374,
    0.0788, 0.1142, 0.0977, 0.0927, 0.1180, 0.0724, 0.1406, 0.0548, 0.1643, 0.0387, 0.1894, 0.0248, 0.2155, 0.0130, 0.2428, 0.0043
  ] };
  var POP_CLOUD = { aspect: 0.7468, pts: [
    0.0000, 0.4171, 0.0000, 0.3934, 0.0028, 0.3699, 0.0071, 0.3466, 0.0128, 0.3237, 0.0214, 0.3016, 0.0318, 0.2803, 0.0453, 0.2608,
    0.0597, 0.2421, 0.0770, 0.2260, 0.0953, 0.2109, 0.1152, 0.1981, 0.1361, 0.1870, 0.1572, 0.1762, 0.1768, 0.1631, 0.1924, 0.1453,
    0.2046, 0.1250, 0.2146, 0.1035, 0.2241, 0.0819, 0.2334, 0.0601, 0.2464, 0.0403, 0.2637, 0.0243, 0.2846, 0.0132, 0.3073, 0.0064,
    0.3307, 0.0028, 0.3542, 0.0001, 0.3777, 0.0031, 0.4001, 0.0107, 0.4209, 0.0221, 0.4404, 0.0354, 0.4592, 0.0498, 0.4792, 0.0625,
    0.5008, 0.0719, 0.5242, 0.0742, 0.5473, 0.0695, 0.5686, 0.0592, 0.5888, 0.0468, 0.6081, 0.0332, 0.6281, 0.0204, 0.6490, 0.0093,
    0.6716, 0.0026, 0.6951, 0.0000, 0.7187, 0.0016, 0.7421, 0.0048, 0.7646, 0.0123, 0.7860, 0.0224, 0.8061, 0.0348, 0.8233, 0.0511,
    0.8384, 0.0693, 0.8506, 0.0895, 0.8605, 0.1111, 0.8675, 0.1336, 0.8726, 0.1568, 0.8762, 0.1802, 0.8826, 0.2029, 0.8946, 0.2232,
    0.9092, 0.2419, 0.9248, 0.2596, 0.9414, 0.2765, 0.9569, 0.2944, 0.9709, 0.3135, 0.9824, 0.3341, 0.9907, 0.3563, 0.9960, 0.3794,
    0.9989, 0.4029, 1.0000, 0.4265, 0.9982, 0.4501, 0.9936, 0.4733, 0.9859, 0.4957, 0.9755, 0.5169, 0.9621, 0.5364, 0.9465, 0.5542,
    0.9288, 0.5699, 0.9093, 0.5832, 0.8883, 0.5941, 0.8663, 0.6030, 0.8437, 0.6099, 0.8204, 0.6141, 0.7968, 0.6152, 0.7731, 0.6149,
    0.7496, 0.6123, 0.7259, 0.6123, 0.7026, 0.6152, 0.6805, 0.6236, 0.6609, 0.6368, 0.6441, 0.6535, 0.6281, 0.6709, 0.6128, 0.6890,
    0.5961, 0.7058, 0.5773, 0.7202, 0.5564, 0.7313, 0.5343, 0.7397, 0.5111, 0.7440, 0.4876, 0.7468, 0.4639, 0.7459, 0.4405, 0.7422,
    0.4186, 0.7334, 0.3986, 0.7207, 0.3813, 0.7045, 0.3668, 0.6858, 0.3532, 0.6665, 0.3396, 0.6471, 0.3251, 0.6284, 0.3091, 0.6109,
    0.2904, 0.5965, 0.2684, 0.5881, 0.2450, 0.5851, 0.2213, 0.5851, 0.1976, 0.5851, 0.1740, 0.5838, 0.1507, 0.5797, 0.1277, 0.5739,
    0.1055, 0.5657, 0.0845, 0.5548, 0.0657, 0.5405, 0.0489, 0.5239, 0.0352, 0.5046, 0.0234, 0.4841, 0.0146, 0.4621, 0.0071, 0.4397
  ] };
  //   머리 밖으로 — 머리 크기 기준 k = 하트로 치면 같은 크기의 폭 (좁은 모양에선 폭 × kMax 까지) · 머리 폭 = headK × k ·
  //   머리 위 = 프레임 위 − rise (얼굴 누끼 faceRise) · 얼굴 상자 폭 = faceW × k, 턱 = 프레임 바닥 − faceGap ·
  //   사진 아래 끝(허리 컷)은 프레임 바닥 + below 보다 아래로 (모자라면 사진을 키운다) ·
  //   프레임 밖으로 여는 곳 = 머리 폭 × openW 너비, 머리 위 − openUp ~ 어깨 줄. 어깨 줄 = 머리 띠 아래에서 윤곽 폭이
  //   머리 폭 × shoulderK 를 처음 넘는 높이. (전체 폭으로 열면 좁은 모양에서 손·조끼가 옆으로 삐져나오고, 프레임 윗선에서
  //   자르면 머리가 잘린다 — 둘 다 시안에서 실측 후 버렸다)
  //   여는 곳 아래 끝은 어깨 줄이어도 프레임 위 + openDown × 프레임 높이를 넘지 않는다 (2026-10-14 사용자 — 옆으로 선 마른
  //   전신 사진은 어느 줄도 머리 폭 × shoulderK 를 안 넘어 어깨 줄 = 발끝이 되고, 머리 폭 직사각형이 좁아지는 하트 아래로
  //   빠져나가 다리가 하트 밖에 보였다). 프레임 가운데 높이까지는 모양 폭이 여는 폭보다 넓어 밖으로 나갈 곳이 없다
  var POP_GEO = { headK: 0.3822, kMax: 1.06, rise: 0.05, faceRise: 0.045, faceW: 0.78, faceGap: 0.022, below: 0.01,
                  openW: 1.5, openUp: 0.03, shoulderK: 1.45, openDown: 0.5 };
  //   프레임 안 (팝 끔, 2026-10-13) — 머리까지 프레임 안, 클립 = 프레임만. 값은 프레임 폭 fw 단위, 프레임 위에서 아래로:
  //   head = 머리 띠 폭 · top = 머리 위 · faceTop·faceBottom·faceW = 얼굴 누끼 상자 (턱 = faceBottom).
  //   하트 = 하트 사진 실측(BD_UPPER·BD_FACE ÷ 하트 폭 0.6393), 원 = 원 사진 실측(BN_UPPER·BN_FACE ÷ 지름 0.6334) 그대로.
  //   기울인 하트·구름은 같은 원리로 윤곽에 맞춘 값 (머리 위 = 오목점·골 아래, 얼굴 상자 = 좁아지기 전까지).
  //   사진 아래 끝은 팝과 같이 프레임 바닥 + below 보다 아래로
  var POP_INSIDE = [
    { key: "HEART", head: 0.3128, top: 0.1336, faceTop: 0.1258, faceBottom: 0.7358, faceW: 0.6257 },
    { key: "PUFF", head: 0.36, top: 0.21, faceTop: 0.20, faceBottom: 0.98, faceW: 0.62 },
    { key: "CLOUD", head: 0.30, top: 0.11, faceTop: 0.11, faceBottom: 0.64, faceW: 0.56 },
    { key: "CIRCLE", head: 0.4578, top: 0.0781, faceTop: 0.1067, faceBottom: 0.8803, faceW: 0.6947 }
  ];
  //   제목 HAPPY = 검정 · BIRTHDAY = 빨강 (문구 끝 하트와 같은 색 — 사용자: 전체 색 바꾸기 ✗ · 두 색 ✓)
  var POP_TEXT_COLORS = { ink: "141414", accent: "D7192D" };
  var POP_MSG = { maxW: 0.88 };
  //   기본 — 문구 · 옵션 번호 (레이아웃 L1 · 제목 Fredoka · 문구 Fredoka Medium · 분홍 · 하트 · 팝)
  var POP_MSG_DEFAULT = "Thanks for coming!";
  var POP_DEFAULTS = { layout: 0, title: 2, hand: 0, color: 1, shape: 0, popOut: true };
  var LEGIBILITY_MIN_PT = 5;   // 이보다 작아지면 경고
  var WHITE_HEX = "FFFFFF";

  // ── 사진 종류 — 보드가 보낸 값(OPTS.shotTypes) > 파일명 표시 (range.jsx 와 같은 표) ──
  var SHOT_NAME_TOKEN_RE = /_(BIG|MED|SML|XXL|XL|XS|S|M|L|FAM)$/i;
  var SHOT_NAME_TYPES = { SML: "face", XS: "face", S: "face", MED: "upper", M: "upper", L: "upper",
                          BIG: "full", XL: "full", XXL: "full", FAM: "full" };


  // ═══════════════════════════════════════════════════════
  //  MAIN
  // ═══════════════════════════════════════════════════════
  var QUIET = false;   // 주입 실행(테스트)이면 완료 창 대신 결과를 전역에 담는다
  var GUARDED = false; // 만드는 동안 Illustrator 경고 창을 꺼 둔 상태 — 완료 창은 켠 뒤에 띄운다
  var PENDING = "";

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

  // 선택 페어별 _sil 트레이스 (피사체 실제 bbox + 머리 띠)
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
    if (prevUIL !== null) { try { app.userInteractionLevel = prevUIL; } catch (eR) {} }
    GUARDED = false;
    if (PENDING) _report(PENDING);
  }


  // ═══════════════════════════════════════════════════════
  //  SHEET BUILD
  // ═══════════════════════════════════════════════════════
  function _buildSheet(opt, folder, noSil) {
    var design = DESIGNS[opt.designIdx] || DESIGNS[0];
    var circle = (design.key === "CIRCLE");
    var pop = (design.key === "POP");
    var D    = opt.sizeMm * MM_TO_PT;                  // 칼선 폭 = 스티커 폭
    var cutH = BD.h * D;
    if (circle) cutH = BN.h * D;
    if (pop) cutH = POP.h * D;
    var padX = BODY_PADDING_X_MM * MM_TO_PT;
    var padY = BODY_PADDING_Y_MM * MM_TO_PT;
    var gap  = GAP_DEFAULT_MM * MM_TO_PT;

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
    if (cells.length === 0) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose) {}
      alert("이 사이즈는 body 영역에 한 칸도 안 들어갑니다. 더 작은 사이즈를 고르세요.");
      return;
    }

    var fonts;
    if (circle) fonts = { name: _resolveFontList(BN_NAME_FONTS), hand: _resolveFontList(BN_HAND_FONTS),
                        hangul: _resolveHangulHandFont(), hangulBold: _resolveHangulBoldFont() };
    else if (pop) fonts = { title: _resolvePick(POP_TITLE_FONTS, opt.popTitle), hand: _resolvePick(POP_HAND_FONTS, opt.popHand),
                            hangul: _resolveHangulHandFont() };
    else fonts = { title: _resolveFontList(BD_TITLE_FONTS), hand: _resolveFontList(BD_HAND_FONTS), hangul: _resolveHangulHandFont() };
    var lines = pop ? _popLines(opt) : _messageLines(opt);
    var sel = opt.selectedPairs;
    var placed = 0, failed = 0, minFontPt = 1e9, sigPt = 0, fitNote = "", firstErr = "";
    var namePt = 0, nameFit = "", subPt = 0, subFit = "";
    var kinds = { face: 0, upper: 0 }, wide = [];
    for (var i = 0; i < cells.length; i++) {
      var pair = sel[i % sel.length];                 // 칸마다 돌아가며
      var x0 = bL + padX + cells[i].x;               // 칼선 bbox 왼쪽 위 (y 위로)
      var y0 = bT - padY - cells[i].y;
      try {
        var r;
        if (circle) r = _composeCircleAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, lines, fonts);
        else if (pop) r = _composePopAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, lines, fonts);
        else r = _composeHeartAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, lines, fonts);
        if (r.fontPt > 0 && r.fontPt < minFontPt) minFontPt = r.fontPt;
        if (r.sigPt > 0) sigPt = r.sigPt;
        if (r.fit && !fitNote) fitNote = r.fit;
        if (r.namePt > 0) { namePt = r.namePt; nameFit = r.nameFit; }
        if (r.subPt > 0) { subPt = r.subPt; subFit = r.subFit; }
        if (i < sel.length) {                          // 사진마다 한 번만 센다
          kinds[r.kind]++;
          if (r.wide) wide.push(pair.base);
        }
        placed++;
      } catch (eC) {
        failed++;
        if (!firstErr) firstErr = (eC && eC.message) ? eC.message : String(eC);
      }
    }

    app.activeDocument = doc;
    // z-order 위→아래 = KissCut → info(템플릿) → PrintData (CLAUDE.md 고정 컨벤션).
    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eK) {}
    try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (eP) {}
    doc.selection = null;

    _drawHeader(opt, sel.length, headerText);

    var savedPath = "", saveErr = "";
    try {
      var outF = _resolveOutputFolder(folder);
      var fname = _timestamp() + "_BDAY_" + design.key + "_" + _sizeTag(opt.sizeMm) + "_sheet01.ai";
      var sf = new File(outF.fsName + "/" + fname);
      _saveAi(doc, sf);
      savedPath = sf.fsName;
    } catch (eS) {
      saveErr = (eS && eS.message) ? eS.message : String(eS);
    }

    var cols = _gridCols(binW, D, gap);
    var rows = (cols > 0) ? Math.round(cells.length / cols) : 0;
    if (minFontPt > 1e8) minFontPt = 0;
    var capMm = (minFontPt * fonts.hand.spec.cap) / MM_TO_PT;
    var sigText = _signatureText(opt.name);

    var warn;
    if (circle) warn = _fontWarn(BN_NAME_FONTS, fonts.name) + _fontWarn(BN_HAND_FONTS, fonts.hand);
    else if (pop) warn = _pickWarn(fonts.title) + _pickWarn(fonts.hand);
    else warn = _fontWarn(BD_TITLE_FONTS, fonts.title) + _fontWarn(BD_HAND_FONTS, fonts.hand);
    if (wide.length > 0) warn += "⚠ 머리 높이에 넓은 것(모자·의자·손 등)이 같이 있는 사진 " + wide.length + "장 (" + wide.join(", ") +
      ") — 머리가 작게 나왔을 수 있어요. 사진을 바꾸거나 Illustrator 에서 키우세요.\n";
    if (noSil > 0) warn += "⚠ _sil 없는 사진 " + noSil + "장 — 이미지 전체를 피사체로 봤어요 (여백 생길 수 있음)\n";
    if (minFontPt > 0 && minFontPt < LEGIBILITY_MIN_PT)
      warn += "⚠ 문구 글자가 " + minFontPt.toFixed(1) + "pt 까지 줄었습니다 — 문구를 줄이거나 사이즈를 올리세요.\n";
    if (sigPt > 0 && sigPt < LEGIBILITY_MIN_PT)
      warn += "⚠ 서명 글자가 " + sigPt.toFixed(1) + "pt — 작아서 인쇄가 뭉갤 수 있어요. 사이즈를 올리는 게 좋아요.\n";
    if (subPt > 0 && subPt < LEGIBILITY_MIN_PT)
      warn += "⚠ 작은 글씨가 " + subPt.toFixed(1) + "pt — 작아서 인쇄가 뭉갤 수 있어요. 글씨를 줄이거나 사이즈를 올리세요.\n";

    var textLines;
    if (circle) textLines =
      "이름: " + (_upperText(opt.name) || "—") + "  /  대문자 " + ((namePt * fonts.name.spec.cap) / MM_TO_PT).toFixed(1) + "mm" +
        (nameFit ? ("  /  " + nameFit) : "") + "\n" +
      "작은 글씨: " + (_upperText(opt.sub) || "— (양옆 하트도 뺐어요)") + (subPt > 0 ? ("  /  " + subPt.toFixed(1) + "pt") : "") +
        (subFit ? ("  /  " + subFit) : "") + "\n" +
      "문구: " + (lines.length ? lines.join(" / ") : "—") + "  /  글자 " + minFontPt.toFixed(1) + "pt" +
        (fitNote ? ("  /  " + fitNote) : "") + "\n" +
      "서체: " + fonts.name.spec.name + " (이름) · " + fonts.hand.spec.name + " (작은 글씨·문구)\n" +
      "사진: 윗몸·전신 " + kinds.upper + "장 = 머리 크기 맞춤 · 얼굴 누끼 " + kinds.face + "장 = 얼굴 상자 (원이 자른다)\n";
    else if (pop) textLines =
      "옵션: " + (opt.popOut === false ? "프레임 안" : "팝") + " · " + (POP_LAYOUTS[opt.popLayout] || POP_LAYOUTS[0]).label +
        " · " + (POP_SHAPES[opt.popShape] || POP_SHAPES[0]).label + " · " + (POP_COLORS[opt.popColor] || POP_COLORS[0]).name + "\n" +
      "문구: " + (lines.length ? lines[0] : "—") + "  /  글자 " + minFontPt.toFixed(1) + "pt (대문자 " + capMm.toFixed(1) + "mm)" +
        (fitNote ? ("  /  " + fitNote) : "") + "\n" +
      "서체: " + fonts.title.spec.name + " (제목) · " + fonts.hand.spec.name + " (문구)\n" +
      "사진: 윗몸·전신 " + kinds.upper + "장 = 머리 크기 맞춤 · 얼굴 누끼 " + kinds.face + "장 = 얼굴 상자 — " + (opt.popOut === false ? "머리까지 프레임 안" : "머리만 프레임 밖으로") + "\n";
    else textLines =
      "문구: " + (lines.length ? lines.join(" / ") : "—") + "  /  글자 " + minFontPt.toFixed(1) + "pt (대문자 " + capMm.toFixed(1) + "mm)" +
        (fitNote ? ("  /  " + fitNote) : "") + "\n" +
      "서명: " + (sigText || "—") + "\n" +
      "서체: " + fonts.title.spec.name + " (제목) · " + fonts.hand.spec.name + " (문구·서명)\n" +
      "사진: 윗몸·전신 " + kinds.upper + "장 = 머리 크기 맞춤 · 얼굴 누끼 " + kinds.face + "장 = 얼굴 상자\n";

    _report(
      "완료: Special Day " + design.label + "\n\n" +
      "사이즈: " + opt.sizeMm + "mm (" + _sizeTag(opt.sizeMm) + ") = 칼선 폭  /  칼선 " + opt.sizeMm + " × " +
        (cutH / MM_TO_PT).toFixed(1) + "mm\n" +
      textLines +
      "격자: " + cols + "×" + rows + " = " + cells.length + " 칸  /  선택 사진 " + sel.length + "장\n" +
      "배치: " + placed + "개" + (failed > 0 ? ("  (실패 " + failed + " — " + firstErr + ")") : "") + "\n" +
      warn +
      "헤더: " + (opt.customerName || "—") + " 주입 완료  /  템플릿: " + TEMPLATE_NAME + "\n\n" +
      (savedPath ? ("저장: " + savedPath) :
                   ("저장 실패: " + (saveErr || "unknown") + " — 직접 저장하세요.")) + "\n\n" +
      _checkLine(circle, pop, opt.popOut === false)
    );
  }

  // 서체 표의 첫 서체를 못 찾았을 때 알림 (없으면 빈 문자열)
  function _fontWarn(list, rf) {
    if (!rf.fallback) return "";
    if (!rf.font) return "⚠ " + list[0].name + " 를 못 찾아 Illustrator 기본 서체로 썼습니다 — Adobe Fonts 에서 켜고 다시 만드세요.\n";
    return "⚠ " + list[0].name + " 를 못 찾아 " + rf.spec.name + " 로 썼습니다 — Adobe Fonts 에서 켜고 다시 만드세요.\n";
  }

  // 완료 창 마지막 줄 — 디자인마다 눈으로 볼 곳
  function _checkLine(circle, pop, inside) {
    if (circle) return "확인: 칼선 = 둥근 사각 / 이름이 작은 글씨·하트에 닿지 않는지 / 머리가 원 안에서 잘리지 않았는지.";
    if (pop && inside) return "확인: 칼선 = 둥근 사각 / 머리가 프레임 안에서 잘리지 않았는지 / 문구가 프레임에 닿지 않는지.";
    if (pop) return "확인: 칼선 = 둥근 사각 / 머리가 프레임 위로 잘리지 않고 나왔는지 / 머리가 제목에 닿지 않는지 / 문구가 프레임에 닿지 않는지.";
    return "확인: 칼선 = 둥근 사각 / 머리가 하트 안에서 잘리지 않았는지 / 문구·서명이 사진·하트에 닿지 않는지.";
  }

  // 옵션 서체 (팝 사진) — 고른 번호의 서체, 없으면 같은 표의 다음 서체 (wanted = 고른 서체 — 완료 창이 알린다)
  function _resolvePick(list, idx) {
    var want = list[idx] || list[0];
    var order = [want];
    for (var i = 0; i < list.length; i++) if (list[i] !== want) order.push(list[i]);
    for (var k = 0; k < order.length; k++) {
      try {
        var f = app.textFonts.getByName(order[k].ps);
        return { font: f, spec: order[k], fallback: k > 0, wanted: want };
      } catch (e) {}
    }
    return { font: null, spec: want, fallback: true, wanted: want };
  }

  function _pickWarn(rf) {
    if (!rf.fallback) return "";
    if (!rf.font) return "⚠ " + rf.wanted.name + " 를 못 찾아 Illustrator 기본 서체로 썼습니다 — 서체를 설치하고 Illustrator 를 다시 켜세요.\n";
    return "⚠ " + rf.wanted.name + " 를 못 찾아 " + rf.spec.name + " 로 썼습니다 — 서체를 설치하고 Illustrator 를 다시 켜세요.\n";
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
  //  HEART PHOTO COMPOSITION (참고 IMG_3165)
  //  생성 순서가 곧 z-order 다 (새 아이템은 항상 레이어 맨 위).
  //  흰 판 → 하트 → 사진 클립 그룹 → 제목 → 서명 → 문구 → 빨간 하트 순으로 만든다.
  // ═══════════════════════════════════════════════════════
  // (x0, y0) = 칼선 bbox 왼쪽 위 (Illustrator 좌표, y 위로), D = 칼선 폭 = W.
  // 반환 { fontPt, sigPt, fit, kind: "face"|"upper", wide }
  function _composeHeartAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, lines, fonts) {
    var W = D;
    function X(u) { return x0 + u * W; }               // W 단위 (y 아래) → 시트 (y 위)
    function Y(v) { return y0 - v * W; }
    var cutH = BD.h * W, rad = BD.r * W;

    // ① 흰 판 (칼선 크기)
    _fill(printLayer.pathItems.roundedRectangle(y0, x0, W, cutH, rad, rad), WHITE_HEX);

    // ② 하트
    var hx = X(BD_HEART_AT.left), hy = Y(BD_HEART_AT.top), hw = BD_HEART_AT.w * W;
    _fill(_heartPath(printLayer, hx, hy, hw), BD_COLORS.heart);

    // ③ 사진 — 윗몸·전신 = 머리 띠 폭을 headW 에, 얼굴(또는 모름) = 얼굴 상자에 통째로. 하트로 클립
    var st = _shotType(opt, pair.base);
    var si = pair.silInfo;
    var kind = "face", wide = false, art;
    if ((st === "upper" || st === "full") && si && si.headWFrac > 0) {
      kind = "upper";
      wide = (si.wFrac > 0 && si.headWFrac / si.wFrac > BD_UPPER.wideK);
      art = _placeUpper(doc, printLayer, pair, opt, X(BD_UPPER.cx), Y(BD_UPPER.top), BD_UPPER.headW * W);
    } else {
      art = _placeFace(doc, printLayer, pair, opt, X(0.5), 0, BD_FACE.maxW * W, (BD_FACE.bottom - BD_FACE.top) * W,
                       { bottom: Y(BD_FACE.bottom) });
    }
    var grp = printLayer.groupItems.add();
    art.move(grp, ElementPlacement.PLACEATBEGINNING);
    var clip = _heartPath(printLayer, hx, hy, hw);
    clip.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.clipping = true;
    grp.clipped = true;

    // ④ 제목 — BIRTHDAY 잉크 폭을 inkW 에 맞추고, 두 줄 같은 원점에서 BIRTHDAY 잉크 왼쪽 = left
    _addTitle(printLayer, X(BD_TITLE.left), Y(BD_TITLE.base1), Y(BD_TITLE.base2), W, fonts.title);

    // ⑤ 서명 · 문구 · 빨간 하트 (세로 가운데 = 대문자 높이 가운데)
    var sig = _addSignature(printLayer, opt.name, X(BD_SIG.right), Y(BD_SIG.base), W, fonts);
    var msg = _addMessage(printLayer, lines, X(BD_MSG.cx), W, Y, fonts.hand, fonts.hangul, {
      msg: BD_MSG, mini: BD_MINI, ink: BD_COLORS.ink,
      heart: function (left, baseY, size) {
        var mw = BD_MINI.w * size, capH = fonts.hand.spec.cap * size;
        _fill(_heartPath(printLayer, left, baseY + capH / 2 + BD_HEART.h * mw / 2, mw), BD_COLORS.red);
      }
    });

    // 칼선 — 둥근 사각
    _forceCutContourStroke(kissLayer.pathItems.roundedRectangle(y0, x0, W, cutH, rad, rad), cutSpot);
    return { fontPt: msg.fontPt, sigPt: sig.fontPt, fit: msg.fit, kind: kind, wide: wide };
  }

  // 얼굴 누끼를 상자(boxW × boxH, 가운데 bcx·bcy — y 위로)에 — 피사체 bbox(_sil) 를 통째로 담고 가운데.
  // _sil 이 없으면 이미지 전체를 피사체로 본다. 반환 = 놓인 사진 (embed 면 다시 찾은 아이템)
  // geo (선택) = { bottom: y } 면 상자 가운데 대신 피사체 아래(턱)를 bottom 에 맞춘다 (xmas.jsx 와 같은 함수)
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
    return _embedPhoto(printLayer, photo, opt, pair);
  }

  // 윗몸·전신 — 머리 띠 폭(silInfo.headWFrac)이 headW 가 되게, 피사체 위 = topY, 머리 가운데 = cx (y 위로)
  function _placeUpper(doc, printLayer, pair, opt, cx, topY, headW) {
    doc.activeLayer = printLayer;
    var photo = printLayer.placedItems.add();
    photo.file = pair.clean;
    var iw = photo.width, ih = photo.height;
    var s = pair.silInfo;
    var pw = headW / s.headWFrac;
    var ph = pw * (ih / iw);
    photo.width = pw;
    photo.height = ph;
    photo.left = cx - s.headCxFrac * pw;
    photo.top  = topY + (s.centerYFrac - s.hFrac / 2) * ph;   // 피사체 위 (캔버스 위 기준 분율) 를 topY 에
    return _embedPhoto(printLayer, photo, opt, pair);
  }

  function _embedPhoto(printLayer, photo, opt, pair) {
    if (!opt.embed) return photo;
    var pL = photo.left, pT = photo.top, pW = photo.width, pH = photo.height;
    photo.embed();
    var art = _findEmbeddedNear(printLayer, pL, pT, pW, pH);
    if (!art) throw new Error("embed 재탐색 실패 (" + pair.base + ")");
    return art;
  }


  // ═══════════════════════════════════════════════════════
  //  CIRCLE PHOTO COMPOSITION (사용자 시안 #1, 2026-10-10 — 글씨는 전부 일직선)
  //  흰 판 → 원 → 사진 클립 그룹 → 이름 → 작은 글씨 + 양옆 하트 → 문구 + 끝 하트 순으로 만든다.
  // ═══════════════════════════════════════════════════════
  // (x0, y0) = 칼선 bbox 왼쪽 위 (Illustrator 좌표, y 위로), D = 칼선 폭 = W.
  // 반환 { fontPt, fit, namePt, nameFit, subPt, subFit, kind: "face"|"upper", wide }
  function _composeCircleAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, lines, fonts) {
    var W = D;
    function X(u) { return x0 + u * W; }
    function Y(v) { return y0 - v * W; }
    var cutH = BN.h * W, rad = BN.r * W;

    // ① 흰 판 (칼선 크기)
    _fill(printLayer.pathItems.roundedRectangle(y0, x0, W, cutH, rad, rad), WHITE_HEX);

    // ② 원 (하늘색)
    var C = BN_CIRCLE, cr = C.r * W, ccx = X(C.cx), ccy = Y(C.cy);
    _fill(printLayer.pathItems.ellipse(ccy + cr, ccx - cr, 2 * cr, 2 * cr), BN_COLORS.circle);

    // ③ 사진 — 하트 디자인과 같은 규칙 (윗몸·전신 = 머리 띠 폭을 headW 에, 얼굴 = 얼굴 상자). 원으로 클립
    var st = _shotType(opt, pair.base);
    var si = pair.silInfo;
    var kind = "face", wide = false, art;
    if ((st === "upper" || st === "full") && si && si.headWFrac > 0) {
      kind = "upper";
      wide = (si.wFrac > 0 && si.headWFrac / si.wFrac > BD_UPPER.wideK);
      art = _placeUpper(doc, printLayer, pair, opt, X(BN_UPPER.cx), Y(BN_UPPER.top), BN_UPPER.headW * W);
    } else {
      art = _placeFace(doc, printLayer, pair, opt, ccx, 0, BN_FACE.maxW * W, (BN_FACE.bottom - BN_FACE.top) * W,
                       { bottom: Y(BN_FACE.bottom) });
    }
    var grp = printLayer.groupItems.add();
    art.move(grp, ElementPlacement.PLACEATBEGINNING);
    var clip = printLayer.pathItems.ellipse(ccy + cr, ccx - cr, 2 * cr, 2 * cr);
    clip.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.clipping = true;
    grp.clipped = true;

    // ④ 이름 · ⑤ 작은 글씨 + 양옆 하트 · ⑥ 문구 + 끝 하트 (반시계로 살짝 기운 손그림 하트)
    var nm = _addCircleName(printLayer, opt.name, X(0.5), Y, W, fonts);
    var sb = _addSubtitle(printLayer, opt.sub, X(0.5), Y(BN_SUB.base), W, fonts);
    var msg = _addMessage(printLayer, lines, X(BN_MSG.cx), W, Y, fonts.hand, fonts.hangul, {
      msg: BN_MSG, mini: BN_MINI, ink: BN_COLORS.ink,
      heart: function (left, baseY, size) {
        var mw = BN_MINI.w * size;
        _fill(_doodlePath(printLayer, left + mw / 2, baseY + BN_MINI.rise * size, mw, -BN_MINI.rot, false), BN_COLORS.pink);
      }
    });

    // 칼선 — 둥근 사각
    _forceCutContourStroke(kissLayer.pathItems.roundedRectangle(y0, x0, W, cutH, rad, rad), cutSpot);
    return { fontPt: msg.fontPt, fit: msg.fit, namePt: nm.fontPt, nameFit: nm.fit, subPt: sb.fontPt, subFit: sb.fit,
             kind: kind, wide: wide };
  }

  // 이름·작은 글씨 — 앞뒤 공백 정리 + 대문자
  function _upperText(raw) {
    return _trim(_composeHangulNFC(String(raw || ""))).toUpperCase();
  }

  // 이름 — 대문자 한 줄, 대문자 높이 BN_NAME.cap, 잉크 가운데 = cx. 잉크가 maxW 를 넘으면 줄이고
  // 대문자 가운데 높이는 그대로 둔다 (위아래 여백이 같이 는다).  반환 { fontPt, fit }
  function _addCircleName(layer, rawName, cx, Y, W, fonts) {
    var text = _upperText(rawName);
    if (!text) return { fontPt: 0, fit: "" };
    var rf = fonts.name, capK = rf.spec.cap || 0.7;
    var size = BN_NAME.cap * W / capK;
    var tf = _pointText(layer, text, rf.font, size, cx, Y(BN_NAME.base), BN_COLORS.ink, fonts.hangulBold);
    var bb = _inkBounds(tf), w = bb[2] - bb[0], fit = "";
    if (w > BN_NAME.maxW * W && w > 0) {
      size = size * BN_NAME.maxW * W / w;
      _setSize(tf, size);
      bb = _inkBounds(tf);
      fit = "긴 이름 — 글자 " + size.toFixed(1) + "pt";
    }
    var base = BN_NAME.base - BN_NAME.cap / 2 + (capK * size / W) / 2;   // 대문자 가운데 높이 그대로
    tf.translate(cx - (bb[0] + bb[2]) / 2, Y(base) - tf.anchor[1]);
    return { fontPt: size, fit: fit };
  }

  // 작은 글씨 (SPECIAL DAY) — 대문자 한 줄, 자간 track, 잉크 가운데 = cx, 기준선 = baseY (y 위로).
  // 잉크가 maxW 를 넘으면 줄인다. 양옆 하트 = 잉크 끝에서 하트 가운데까지 gap, 기준선 위 rise (오른쪽 그린 그대로 · 왼쪽 거울).
  // 반환 { fontPt, fit }
  function _addSubtitle(layer, rawSub, cx, baseY, W, fonts) {
    var text = _upperText(rawSub);
    if (!text) return { fontPt: 0, fit: "" };
    var S = BN_SUB, fit = "";
    var size = S.size * W;
    var tf = _pointText(layer, text, fonts.hand.font, size, cx, baseY, BN_COLORS.ink, fonts.hangul);
    tf.textRange.characterAttributes.tracking = Math.round(S.track);
    var bb = _inkBounds(tf), w = bb[2] - bb[0];
    if (w > S.maxW * W && w > 0) {
      size = size * S.maxW * W / w;
      _setSize(tf, size);
      bb = _inkBounds(tf);
      w = bb[2] - bb[0];
      fit = "긴 글씨 — " + size.toFixed(1) + "pt";
    }
    tf.translate(cx - (bb[0] + bb[2]) / 2, 0);
    var H = BN_SUB_HEART, hx = w / 2 + H.gap * W, hy = baseY + H.rise * W;
    _fill(_doodlePath(layer, cx + hx, hy, H.w * W, 0, false), BN_COLORS.pink);
    _fill(_doodlePath(layer, cx - hx, hy, H.w * W, 0, true), BN_COLORS.pink);
    return { fontPt: size, fit: fit };
  }

  // 손그림 하트 (BN_DOODLE) — 가운데 (cx, cy) (y 위로) · 폭 w · 화면 시계 방향 기울기 rotDeg.
  // mirror = 좌우 뒤집기 (기울기도 반대) — 왼쪽 위 하트. 점은 전부 CORNER (핸들 그대로)
  function _doodlePath(container, cx, cy, w, rotDeg, mirror) {
    var P = BN_DOODLE.pts, h = BN_DOODLE.h, n = Math.floor(P.length / 6);
    var a = (mirror ? -rotDeg : rotDeg) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    function T(x, y) {
      var u = (x - 0.5) * w, v = (y - h / 2) * w;            // 가운데 기준, y 아래
      if (mirror) u = -u;
      return [cx + u * ca - v * sa, cy - (u * sa + v * ca)];  // y 아래에서 시계 회전 → 시트 (y 위)
    }
    var p = container.pathItems.add();
    for (var i = 0; i < n; i++) {
      var pp = p.pathPoints.add();
      pp.anchor         = T(P[6 * i], P[6 * i + 1]);
      pp.leftDirection  = T(P[6 * i + 2], P[6 * i + 3]);
      pp.rightDirection = T(P[6 * i + 4], P[6 * i + 5]);
      pp.pointType = PointType.CORNER;
    }
    p.closed = true;
    return p;
  }


  // ═══════════════════════════════════════════════════════
  //  POP PHOTO COMPOSITION (2026-10-13 — 시안 ROUND 4·5 그대로)
  //  흰 판 → 프레임 (운영자 색) → 사진 클립 그룹 [클립 = 프레임 ∪ 머리 둘레] → 제목 두 줄 → 문구 한 줄 + 빨간 하트 순.
  // ═══════════════════════════════════════════════════════
  // (x0, y0) = 칼선 bbox 왼쪽 위 (Illustrator 좌표, y 위로), D = 칼선 폭 = W.
  // 반환 { fontPt, fit, kind: "face"|"upper", wide }
  function _composePopAt(doc, printLayer, kissLayer, cutSpot, pair, opt, x0, y0, D, lines, fonts) {
    var W = D;
    function X(u) { return x0 + u * W; }
    function Y(v) { return y0 - v * W; }
    var cutH = POP.h * W, rad = POP.r * W, G = POP_GEO;
    var L = POP_LAYOUTS[opt.popLayout] || POP_LAYOUTS[0];
    var S = POP_SHAPES[opt.popShape] || POP_SHAPES[0];
    var C = POP_COLORS[opt.popColor] || POP_COLORS[0];

    // 프레임 자리 (W 단위, y 아래) — 영역 안에 모양 비율 그대로, 가운데·바닥 맞춤
    var fw = Math.min(POP_REGION.wMax, POP_REGION.h / S.aspect), fh = fw * S.aspect;
    var fTop = L.bottom - fh, fLeft = 0.5 - fw / 2;
    var k = Math.min(0.5 * (fw + fh / BD_HEART.h), G.kMax * fw);   // 머리 크기 기준 = 하트로 치면 같은 크기의 폭

    // ① 흰 판 · ② 프레임
    _fill(printLayer.pathItems.roundedRectangle(y0, x0, W, cutH, rad, rad), WHITE_HEX);
    _fill(_popShapePath(printLayer, S.key, X(fLeft), Y(fTop), fw * W), C.hex);

    // ③ 사진 — 윗몸·전신 = 머리 띠 폭을 headK·k 에, 얼굴(또는 모름) = 얼굴 상자에 통째로. 머리 위는 프레임 위보다 rise 위
    var st = _shotType(opt, pair.base), si = pair.silInfo;
    var kind = "face", wide = false;
    if ((st === "upper" || st === "full") && si && si.headWFrac > 0) {
      kind = "upper";
      wide = (si.wFrac > 0 && si.headWFrac / si.wFrac > BD_UPPER.wideK);
    }
    doc.activeLayer = printLayer;
    var photo = printLayer.placedItems.add();
    photo.file = pair.clean;
    var asp = photo.height / photo.width;
    var pw, ph, left, top, headW, headTop, shoulder;
    var inside = (opt.popOut === false) ? _popInside(S.key) : null;   // 프레임 안 — 머리까지 프레임 안 (POP_INSIDE)
    if (inside && kind === "upper") {
      var topIn = si.centerYFrac - si.hFrac / 2;
      headTop = fTop + inside.top * fw;
      pw = inside.head * fw / si.headWFrac;
      var pwMinIn = (L.bottom + G.below - headTop) / (1 - topIn) / asp;  // 사진 아래 끝이 프레임 바닥보다 아래로
      if (pw < pwMinIn) pw = pwMinIn;
      ph = pw * asp;
      left = 0.5 - si.headCxFrac * pw;
      top = headTop - topIn * ph;
      headW = si.headWFrac * pw;
    } else if (inside) {
      var fwI = 1, fhI = 1, fcxI = 0.5, fcyI = 0.5;
      if (si) { fwI = si.wFrac; fhI = si.hFrac; fcxI = si.centerXFrac; fcyI = si.centerYFrac; }
      headTop = fTop + inside.faceTop * fw;
      var chinIn = fTop + inside.faceBottom * fw;
      pw = Math.min(inside.faceW * fw / fwI, (chinIn - headTop) / (fhI * asp));
      ph = pw * asp;
      left = 0.5 - fcxI * pw;
      top = chinIn - (fcyI + fhI / 2) * ph;                   // 피사체 아래(턱) = 상자 아래
      headW = fwI * pw;
    } else if (kind === "upper") {
      var topFrac = si.centerYFrac - si.hFrac / 2;             // 피사체 위 (캔버스 위 기준 분율)
      headTop = fTop - G.rise;
      pw = G.headK * k / si.headWFrac;
      var pwMin = (L.bottom + G.below - headTop) / (1 - topFrac) / asp;   // 사진 아래 끝이 프레임 바닥보다 아래로
      if (pw < pwMin) pw = pwMin;
      ph = pw * asp;
      left = 0.5 - si.headCxFrac * pw;
      top = headTop - topFrac * ph;
      headW = si.headWFrac * pw;
    } else {
      var fwF = 1, fhF = 1, fcx = 0.5, fcy = 0.5;
      if (si) { fwF = si.wFrac; fhF = si.hFrac; fcx = si.centerXFrac; fcy = si.centerYFrac; }
      headTop = fTop - G.faceRise;
      var chin = L.bottom - G.faceGap;
      pw = Math.min(G.faceW * k / fwF, (chin - headTop) / (fhF * asp));
      ph = pw * asp;
      left = 0.5 - fcx * pw;
      top = chin - (fcy + fhF / 2) * ph;                      // 피사체 아래(턱) = chin
      headW = fwF * pw;
    }
    shoulder = top + ((si && si.shoulderFrac > 0) ? si.shoulderFrac : 1) * ph;
    photo.width = pw * W;
    photo.height = ph * W;
    photo.left = X(left);
    photo.top = Y(top);
    var art = _embedPhoto(printLayer, photo, opt, pair);

    // 클립 = 프레임 ∪ 머리 둘레 (머리 폭 × openW, 머리 위 − openUp ~ 어깨 줄, 단 프레임 가운데 높이까지) — 머리만 프레임 밖으로.
    // 프레임 안이면 프레임만 (직사각형 없음 → _popClipPath 가 프레임 그대로 돌려준다)
    var openL = 0.5 - G.openW * headW / 2, openT = headTop - G.openUp;
    var openB = Math.min(shoulder, fTop + G.openDown * fh);
    var clip = _popClipPath(doc, printLayer, S.key, X(fLeft), Y(fTop), fw * W,
                            inside ? null : [X(openL), Y(openT), G.openW * headW * W, (openB - openT) * W]);
    var grp = printLayer.groupItems.add();
    art.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.move(grp, ElementPlacement.PLACEATBEGINNING);
    if (clip.typename === "CompoundPathItem") clip.pathItems[0].clipping = true;
    else clip.clipping = true;
    grp.clipped = true;

    // ④ 제목 두 줄 (HAPPY 검정 · BIRTHDAY 포인트 색, 가운데) · ⑤ 문구 한 줄 + 포인트 색 하트 (포인트 색 = 프레임 색이 정한다)
    var accent = C.accent || POP_TEXT_COLORS.accent;
    _addPopTitle(printLayer, L, X, Y, W, fonts.title, accent);
    var msg = _addMessage(printLayer, lines, X(0.5), W, Y, fonts.hand, fonts.hangul, {
      msg: { size: L.msgSize, baseOne: L.msgBase, maxW: POP_MSG.maxW, cx: 0.5 }, mini: BD_MINI, ink: POP_TEXT_COLORS.ink,
      heart: function (hl, baseY, size) {
        var mw = BD_MINI.w * size, capH = fonts.hand.spec.cap * size;
        _fill(_heartPath(printLayer, hl, baseY + capH / 2 + BD_HEART.h * mw / 2, mw), accent);
      }
    });

    // 칼선 — 둥근 사각
    _forceCutContourStroke(kissLayer.pathItems.roundedRectangle(y0, x0, W, cutH, rad, rad), cutSpot);
    return { fontPt: msg.fontPt, fit: msg.fit, kind: kind, wide: wide };
  }

  // 프레임 안 배치 값 (POP_INSIDE) — 모양 키로. 없으면 하트 값
  function _popInside(key) {
    for (var i = 0; i < POP_INSIDE.length; i++) if (POP_INSIDE[i].key === key) return POP_INSIDE[i];
    return POP_INSIDE[0];
  }

  // 프레임 모양 — (x, y) = bbox 왼쪽 위 (y 위로), w = 폭 (높이 = w × aspect)
  function _popShapePath(container, key, x, y, w) {
    if (key === "HEART") return _heartPath(container, x, y, w);
    if (key === "CIRCLE") return container.pathItems.ellipse(y, x, w, w);
    var T = (key === "PUFF") ? POP_PUFF : POP_CLOUD;
    return _smoothPolyPath(container, T.pts, x, y, w);
  }

  // 닫힌 점 목록 [x, y, …] (폭 1 · y 아래) → 매끈한 패스. 핸들 = 이웃 두 점을 잇는 방향 / 6 (Catmull-Rom), 점은 CORNER
  function _smoothPolyPath(container, P, x, y, w) {
    var n = Math.floor(P.length / 2), p = container.pathItems.add();
    function pt(i) { i = (i + n) % n; return [x + P[2 * i] * w, y - P[2 * i + 1] * w]; }
    for (var i = 0; i < n; i++) {
      var a = pt(i), b = pt(i - 1), c = pt(i + 1);
      var tx = (c[0] - b[0]) / 6, ty = (c[1] - b[1]) / 6;
      var pp = p.pathPoints.add();
      pp.anchor = a;
      pp.leftDirection = [a[0] - tx, a[1] - ty];
      pp.rightDirection = [a[0] + tx, a[1] + ty];
      pp.pointType = PointType.CORNER;
    }
    p.closed = true;
    return p;
  }

  // 클립 패스 = 프레임 ∪ 직사각형 rect [L, T, W, H] (y 위로) — Pathfinder 더하기 → 확장. 직사각형이 없으면 프레임 그대로.
  // 합치기 전에 둘 다 채운다 (칠 없는 패스는 Pathfinder 가 빈 결과를 낸다 — keepsake 함정)
  function _popClipPath(doc, layer, shapeKey, fx, fy, fwPt, rect) {
    var fr = _popShapePath(layer, shapeKey, fx, fy, fwPt);
    if (!rect || !(rect[2] > 0) || !(rect[3] > 0)) return fr;
    var rc = layer.pathItems.rectangle(rect[1], rect[0], rect[2], rect[3]);
    _fill(fr, "000000");
    _fill(rc, "000000");
    doc.selection = null;
    fr.selected = true;
    rc.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");
    var sel = doc.selection;
    if (!sel || sel.length === 0) throw new Error("머리 밖으로 클립 합치기 결과가 비었어요");
    var it = sel[0];
    doc.selection = null;
    while (it && it.typename === "GroupItem") {   // 확장 결과가 그룹이면 안의 패스를 꺼낸다
      var inner = null;
      if (it.compoundPathItems.length > 0) inner = it.compoundPathItems[0];
      else if (it.pathItems.length > 0) inner = it.pathItems[0];
      else if (it.groupItems.length > 0) inner = it.groupItems[0];
      if (!inner) throw new Error("머리 밖으로 클립 합치기 결과에 패스가 없어요");
      inner.move(layer, ElementPlacement.PLACEATBEGINNING);
      it.remove();
      it = inner;
    }
    return it;
  }

  // HAPPY (검정) / BIRTHDAY (포인트 색) — 대문자 높이 capMax 에서 시작해 넓은 줄 잉크가 inkW 를 넘으면 줄인다. 줄마다 잉크 가운데 = 0.5W
  function _addPopTitle(layer, L, X, Y, W, tf, accent) {
    var capK = tf.spec.cap || 0.7;
    var size = L.capMax * W / capK;
    var t1 = _pointText(layer, "HAPPY", tf.font, size, X(0.5), Y(L.happy), POP_TEXT_COLORS.ink, null);
    var t2 = _pointText(layer, "BIRTHDAY", tf.font, size, X(0.5), Y(L.birthday), accent || POP_TEXT_COLORS.accent, null);
    var b1 = _inkBounds(t1), b2 = _inkBounds(t2);
    var widest = Math.max(b1[2] - b1[0], b2[2] - b2[0]);
    if (widest > L.inkW * W && widest > 0) {
      size = size * L.inkW * W / widest;
      _setSize(t1, size);
      _setSize(t2, size);
      b1 = _inkBounds(t1);
      b2 = _inkBounds(t2);
    }
    t1.translate(X(0.5) - (b1[0] + b1[2]) / 2, 0);
    t2.translate(X(0.5) - (b2[0] + b2[2]) / 2, 0);
    return size;
  }


  // ═══════════════════════════════════════════════════════
  //  TEXT — 제목 · 서명 · 문구 (전부 point text — 편집 가능, 아웃라인 안 함)
  // ═══════════════════════════════════════════════════════
  // 문구 줄 — 빈 줄은 뺀다 (한 줄이면 가운데 한 줄)
  function _messageLines(opt) {
    var out = [];
    var raw = [opt.line1, opt.line2];
    for (var i = 0; i < raw.length; i++) {
      var t = _trim(_composeHangulNFC(String(raw[i] || "")));
      if (t) out.push(t);
    }
    return out;
  }

  // 팝 사진 문구 — 한 줄 "문구 – 이름" (사용자: 이름과 Thanks for coming 은 한 줄). 이름이 없으면 문구만
  function _popLines(opt) {
    var m = _trim(_composeHangulNFC(String(opt.line1 || "")));
    var n = _trim(_composeHangulNFC(String(opt.name || "")));
    if (!m && !n) return [];
    if (!n) return [m];
    if (!m) return ["– " + n];
    return [m + " – " + n];
  }

  function _signatureText(rawName) {
    var n = _trim(_composeHangulNFC(String(rawName || "")));
    if (!n) return "";
    return "– " + n + " –";
  }

  // 왼쪽 맞춤 point text (기준선 baseY, 원점 x) — 서체·크기·색. 한글은 hangul 서체로
  function _pointText(layer, text, font, size, x, baseY, hex, hangul) {
    var tf = layer.textFrames.pointText([x, baseY]);
    tf.contents = text;
    var ca = tf.textRange.characterAttributes;
    if (font) ca.textFont = font;
    ca.size = size;
    ca.fillColor = _hexToRGB(hex);
    ca.strokeWeight = 0;
    try { tf.textRange.paragraphAttributes.justification = Justification.LEFT; } catch (eJ) {}
    if (hangul) _applyHangulFontOverride(tf, hangul);
    return tf;
  }

  // 잉크(윤곽) bounds [L, T, R, B] — 임시 윤곽 사본으로 잰다 (사본은 지운다)
  function _inkBounds(tf) {
    var ol = tf.duplicate().createOutline();
    var bb = ol.geometricBounds;
    ol.remove();
    return bb;
  }

  function _setSize(tf, size) {
    tf.textRange.characterAttributes.size = size;      // 핸들을 다시 잡는다 (geometricBounds 뒤 무효화 함정)
  }

  // HAPPY / BIRTHDAY — BIRTHDAY 잉크 폭 = inkW × W 가 되게 크기를 맞추고, BIRTHDAY 잉크 왼쪽 = leftX
  function _addTitle(layer, leftX, base1Y, base2Y, W, tfnt) {
    var size = BD_TITLE.size * W;
    var t1 = _pointText(layer, "HAPPY", tfnt.font, size, leftX, base1Y, BD_COLORS.ink, null);
    var t2 = _pointText(layer, "BIRTHDAY", tfnt.font, size, leftX, base2Y, BD_COLORS.ink, null);
    var b2 = _inkBounds(t2);
    var inkW = b2[2] - b2[0];
    if (inkW > 0) {
      size = size * BD_TITLE.inkW * W / inkW;
      _setSize(t1, size);
      _setSize(t2, size);
      b2 = _inkBounds(t2);
    }
    var dx = leftX - b2[0];
    t1.translate(dx, 0);
    t2.translate(dx, 0);
    return size;
  }

  // 서명 "– 이름 –" — 잉크 오른쪽 끝 = rightX, 기준선 baseY. 최대 폭을 넘으면 줄인다.  반환 { fontPt }
  function _addSignature(layer, rawName, rightX, baseY, W, fonts) {
    var text = _signatureText(rawName);
    if (!text) return { fontPt: 0 };
    var size = BD_SIG.k * BD_MSG.size * W;
    var tf = _pointText(layer, text, fonts.hand.font, size, rightX, baseY, BD_COLORS.ink, fonts.hangul);
    var bb = _inkBounds(tf);
    var w = bb[2] - bb[0];
    if (w > BD_SIG.maxW * W && w > 0) {
      size = size * BD_SIG.maxW * W / w;
      _setSize(tf, size);
      bb = _inkBounds(tf);
    }
    tf.translate(rightX - bb[2], 0);
    return { fontPt: size };
  }

  // 문구 1~2줄 — 가운데. 마지막 줄 끝에 하트 (글자 크기 비례). 가장 긴 줄이 maxW 를 넘으면 두 줄을 같이 줄인다.
  // Y = W 단위 → 시트 y 함수. hf = 서체 (_resolveFontList), P = { msg: 문구 표 (size2 가 있으면 두 줄일 때 그 크기),
  // mini: 끝 하트 표 (w·gap = 글자 크기 ×), ink: 글자 색, heart(왼쪽 x, 기준선 y, 글자 크기): 끝 하트를 그린다 }.  반환 { fontPt, fit }
  function _addMessage(layer, lines, cx, W, Y, hf, hangul, P) {
    if (!lines.length) return { fontPt: 0, fit: "" };
    var M = P.msg, mini = P.mini, two = lines.length > 1;
    var size = ((two && M.size2) ? M.size2 : M.size) * W;
    var bases = [Y(M.baseOne)];
    if (two) bases = [Y(M.base1), Y(M.base2)];
    var tfs = [], widths = [], lefts = [];
    for (var i = 0; i < lines.length; i++) {
      var tf = _pointText(layer, lines[i], hf.font, size, cx, bases[i], P.ink, hangul);
      tfs.push(tf);
    }
    function measure() {
      widths = []; lefts = [];
      for (var m = 0; m < tfs.length; m++) {
        var bb = _inkBounds(tfs[m]);
        lefts.push(bb[0]);
        widths.push(bb[2] - bb[0]);
      }
    }
    measure();
    var last = tfs.length - 1;
    var widest = 0;
    for (var k = 0; k < widths.length; k++) {
      var wk = widths[k];
      if (k === last) wk += (mini.gap + mini.w) * size;
      if (wk > widest) widest = wk;
    }
    var fit = "";
    if (widest > M.maxW * W && widest > 0) {
      size = size * M.maxW * W / widest;
      for (var s2 = 0; s2 < tfs.length; s2++) _setSize(tfs[s2], size);
      measure();
      fit = "긴 문구 — 글자 " + size.toFixed(1) + "pt";
    }
    // 가운데 정렬 (잉크 기준) — 마지막 줄은 [글자 + 간격 + 하트] 묶음 가운데
    for (var j = 0; j < tfs.length; j++) {
      var total = widths[j];
      if (j === last) total += (mini.gap + mini.w) * size;
      tfs[j].translate(cx - total / 2 - lefts[j], 0);
    }
    // 끝 하트 — 마지막 줄 잉크 오른쪽 + 간격
    P.heart(cx - (widths[last] + (mini.gap + mini.w) * size) / 2 + widths[last] + mini.gap * size, bases[last], size);
    return { fontPt: size, fit: fit };
  }


  // ═══════════════════════════════════════════════════════
  //  HEART GEOMETRY  (정규화 좌표: 폭 1, y 아래로 → (hx + u·W, hy − v·W)) — xmas.jsx 와 같은 함수, 표만 BD_HEART
  // ═══════════════════════════════════════════════════════
  function _heartSegs() {
    var H = BD_HEART;
    var N = [0.5, H.n], P = [H.pkx, 0], E = [1, H.ey], T = [0.5, H.h];
    return [
      [N, [0.5 + H.a1, H.n - H.b1], [H.pkx - H.a2, 0], P],
      [P, [H.pkx + H.a3, 0], [1, H.ey - H.b3], E],
      [E, [1, H.ey + H.b4], [0.5 + H.a5, H.h - H.b5], T]
    ];
  }

  function _mir(p) { return [1 - p[0], p[1]]; }

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

  function _map(q, hx, hy, W) { return [hx + q[0] * W, hy - q[1] * W]; }

  function _fill(item, hex) {
    item.stroked = false;
    item.filled = true;
    item.fillColor = _hexToRGB(hex);
    return item;
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


  // ═══════════════════════════════════════════════════════
  //  SIL 피사체 레퍼런스 (ring.jsx 동일 + 머리 띠)
  //  _clean.psd 는 trim 안 됨(Phase A) → 피사체 실제 bbox 는 _sil 에서.
  //  headWFrac·headCxFrac = 피사체 위에서 band0~band1 높이 띠 안 윤곽의 폭·가운데 (캔버스 폭 분율) — 주문 보드
  //  미리보기(loadSil)가 _sil 픽셀 줄로 같은 띠를 잰다.
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
      var sh = maxY - minY;
      var band = _bandExtent(seln, maxY - BD_UPPER.band0 * sh, maxY - BD_UPPER.band1 * sh);
      var info = {
        wFrac:       (maxX - minX) / cw,
        hFrac:       (maxY - minY) / ch,
        centerXFrac: ((minX + maxX) / 2) / cw,
        centerYFrac: (ch - (minY + maxY) / 2) / ch,   // 캔버스 top 기준 피사체 세로중심
        headWFrac:   0,
        headCxFrac:  0.5
      };
      if (band) {
        info.headWFrac = (band[1] - band[0]) / cw;
        info.headCxFrac = ((band[0] + band[1]) / 2) / cw;
      }
      // 어깨 줄 (팝 사진 — 머리만 프레임 밖으로 여는 곳의 아래 끝) = 머리 띠 아래에서 윤곽 폭이 머리 폭 × shoulderK 를
      // 처음 넘는 높이. 못 찾으면 피사체 아래 (캔버스 위 기준 분율 — 주문 보드 loadSil 이 _sil 픽셀 줄로 같은 값을 잰다)
      info.shoulderFrac = (ch - minY) / ch;
      if (band && sh > 0) {
        var NB = 100, prof = _bandProfile(seln, maxY, sh, NB), headPt = band[1] - band[0];
        for (var bi = Math.floor(BD_UPPER.band1 * NB); bi < NB; bi++) {
          if (prof.mx[bi] > prof.mn[bi] && prof.mx[bi] - prof.mn[bi] > POP_GEO.shoulderK * headPt) {
            info.shoulderFrac = (ch - (maxY - bi * sh / NB)) / ch;
            break;
          }
        }
      }
      return info;
    } finally {
      try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {}
    }
  }

  // 윤곽들의 y 띠(yLo ≤ y ≤ yHi, y 위로) 안 x 범위 [min, max] — 세그먼트마다 베지어 9점을 찍어 잰다. 없으면 null
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


  // 피사체 위(yTop, y 위로)에서 아래로 높이 sh 를 nb 칸 띠로 나눠 칸마다 윤곽 x 범위 { mn: [], mx: [] }.
  // 세그먼트를 띠 높이 절반 간격으로 찍는다 — 얇은 띠를 긴 세그먼트가 건너뛰지 않게 (_bandExtent 의 9점보다 촘촘)
  function _bandProfile(items, yTop, sh, nb) {
    var mn = [], mx = [], bh = sh / nb;
    for (var i = 0; i < nb; i++) { mn.push(1e9); mx.push(-1e9); }
    function put(x, y) {
      var b = Math.floor((yTop - y) / bh);
      if (b < 0 || b >= nb) return;
      if (x < mn[b]) mn[b] = x;
      if (x > mx[b]) mx[b] = x;
    }
    function seg(a, c1, c2, e) {
      var len = Math.abs(c1[1] - a[1]) + Math.abs(c2[1] - c1[1]) + Math.abs(e[1] - c2[1]);   // 세로 길이 상한
      var steps = Math.max(8, Math.ceil(2 * len / bh));
      for (var k = 0; k <= steps; k++) {
        var t = k / steps, u = 1 - t;
        put(u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0],
            u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1]);
      }
    }
    function walk(it) {
      if (it.typename === "PathItem") {
        var pts = it.pathPoints, n = pts.length;
        for (var j = 0; j < n; j++) {
          if (j === n - 1 && !it.closed) break;
          var p = pts[j], q = pts[(j + 1) % n];
          seg(p.anchor, p.rightDirection, q.leftDirection, q.anchor);
        }
      } else if (it.typename === "CompoundPathItem") {
        for (var c = 0; c < it.pathItems.length; c++) walk(it.pathItems[c]);
      } else if (it.typename === "GroupItem") {
        for (var g = 0; g < it.pageItems.length; g++) walk(it.pageItems[g]);
      }
    }
    for (var s = 0; s < items.length; s++) walk(items[s]);
    return { mn: mn, mx: mx };
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
  //  TEXT HELPERS (ring.jsx 동일 + 손글씨 한글)
  // ═══════════════════════════════════════════════════════
  function _resolveHangulFont() {
    var candidates = ["TTOmniGothicL", "AppleSDGothicNeo-Bold", "AppleSDGothicNeo-SemiBold", "AppleGothic"];
    for (var i = 0; i < candidates.length; i++) {
      try { return app.textFonts.getByName(candidates[i]); } catch (e) {}
    }
    return null;
  }

  function _resolveHangulHandFont() {
    for (var i = 0; i < HANGUL_HAND_FONTS.length; i++) {
      try { return app.textFonts.getByName(HANGUL_HAND_FONTS[i]); } catch (e) {}
    }
    return _resolveHangulFont();
  }

  function _resolveHangulBoldFont() {
    for (var i = 0; i < HANGUL_BOLD_FONTS.length; i++) {
      try { return app.textFonts.getByName(HANGUL_BOLD_FONTS[i]); } catch (e) {}
    }
    return _resolveHangulFont();
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
                " • Special Day " + design.key.toLowerCase() + " • " + _sizeTag(opt.sizeMm) + " / " + opt.sizeMm + "mm";
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
      try { $.global.__EVERSTORY_BDAY_RESULT__ = msg; } catch (e) {}
      return;
    }
    if (GUARDED) { PENDING = msg; return; }   // 경고 창을 다시 켠 뒤 finally 에서 띄운다
    alert(msg);
  }

  // 주문 보드 구성 화면 — $.global.__EVERSTORY_BDAY_OPTS__ (consume-once) 로 대화창을 건너뛴다
  // (composed_preview.build_script_launch). 화면에 없는 값은 대화창 기본값 그대로.
  function _consumePreset(pairs) {
    var raw = null;
    try { raw = $.global.__EVERSTORY_BDAY_OPTS__; } catch (eG) { return null; }
    try { $.global.__EVERSTORY_BDAY_OPTS__ = undefined; } catch (eC) {}
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
    // 팝 사진 옵션 — 키로 받는다 (보드 composed_preview.build_script_launch). 모르는 키면 기본 번호
    function keyIdx(list, key, d) {
      for (var i = 0; i < list.length; i++) if (list[i].key === key) return i;
      return d;
    }

    return {
      popLayout:    keyIdx(POP_LAYOUTS, raw.popLayout, POP_DEFAULTS.layout),
      popTitle:     keyIdx(POP_TITLE_FONTS, raw.popTitle, POP_DEFAULTS.title),
      popHand:      keyIdx(POP_HAND_FONTS, raw.popHand, POP_DEFAULTS.hand),
      popColor:     keyIdx(POP_COLORS, raw.popColor, POP_DEFAULTS.color),
      popShape:     keyIdx(POP_SHAPES, raw.popShape, POP_DEFAULTS.shape),
      popOut:       (raw.popOut != null ? raw.popOut !== false : POP_DEFAULTS.popOut),   // false = 프레임 안
      designIdx:    designIdx,
      name:         _trim(String(raw.name || "")),
      sub:          _trim(String(raw.sub != null ? raw.sub : BN_SUB_DEFAULT)),   // 원 사진 작은 글씨 (빈 칸 = 없음)
      line1:        _trim(String(raw.line1 || "")),
      line2:        _trim(String(raw.line2 || "")),
      sizeMm:       sizeMm,
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
    designDd.selection = DESIGN_DEFAULT; designDd.preferredSize = [340, 24];

    var gL1 = pD.add("group");
    gL1.add("statictext", undefined, "문구 1줄     ");
    var fLine1 = gL1.add("edittext", undefined, BD_MSG_DEFAULT[0]);
    fLine1.preferredSize = [260, 22];
    var gL2 = pD.add("group");
    gL2.add("statictext", undefined, "문구 2줄     ");
    var fLine2 = gL2.add("edittext", undefined, BD_MSG_DEFAULT[1]);
    fLine2.preferredSize = [260, 22];
    var heartHint = gL2.add("statictext", undefined, "끝에 빨간 하트");
    heartHint.preferredSize = [110, 20];

    var gName = pD.add("group");
    gName.add("statictext", undefined, "이름            ");
    var fName = gName.add("edittext", undefined, "");
    fName.preferredSize = [200, 22];
    var nameHint = gName.add("statictext", undefined, "– 이름 – 서명 (비우면 서명 없음)");
    nameHint.preferredSize = [230, 20];

    var gSub = pD.add("group");
    gSub.add("statictext", undefined, "작은 글씨   ");
    var fSub = gSub.add("edittext", undefined, BN_SUB_DEFAULT);
    fSub.preferredSize = [200, 22];
    gSub.add("statictext", undefined, "원 사진만 (비우면 양옆 하트도 빠짐)");

    // 팝 사진 옵션 — 팝 사진일 때만 켜진다
    function popDd(label, list, field, d) {
      var g = pD.add("group");
      g.add("statictext", undefined, label);
      var names = [];
      for (var q = 0; q < list.length; q++) names.push(list[q][field]);
      var dd = g.add("dropdownlist", undefined, names);
      dd.selection = d; dd.preferredSize = [240, 24];
      return dd;
    }
    var popOutDd = popDd("사진            ", [{ label: "팝 — 머리가 프레임 밖으로" }, { label: "프레임 안" }], "label",
                         POP_DEFAULTS.popOut ? 0 : 1);
    var popLayoutDd = popDd("레이아웃     ", POP_LAYOUTS, "label", POP_DEFAULTS.layout);
    var popShapeDd = popDd("모양            ", POP_SHAPES, "label", POP_DEFAULTS.shape);
    var popColorDd = popDd("프레임 색   ", POP_COLORS, "name", POP_DEFAULTS.color);
    var popTitleDd = popDd("제목 서체   ", POP_TITLE_FONTS, "name", POP_DEFAULTS.title);
    var popHandDd = popDd("문구 서체   ", POP_HAND_FONTS, "name", POP_DEFAULTS.hand);
    var popDds = [popOutDd, popLayoutDd, popShapeDd, popColorDd, popTitleDd, popHandDd];

    var gSize = pD.add("group");
    gSize.add("statictext", undefined, "사이즈       ");
    var sizeDd = gSize.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDd.selection = SIZE_DEFAULT; sizeDd.preferredSize = [200, 24];

    var gFont = pD.add("group");
    gFont.add("statictext", undefined, "서체            ");
    var fontStat = gFont.add("statictext", undefined, "");
    fontStat.preferredSize = [420, 20];
    // 디자인을 바꾸면 — 기본 사이즈 · 이름 칸 뜻 · 작은 글씨 칸 · 서체 · 문구가 다른 디자인 기본 문구 그대로면 이 디자인 기본 문구로
    // 디자인마다 기본 문구 (팝 사진 = 한 줄)
    function msgDefaultOf(key) {
      if (key === "CIRCLE") return BN_MSG_DEFAULT;
      if (key === "POP") return [POP_MSG_DEFAULT, ""];
      return BD_MSG_DEFAULT;
    }
    var lastKey = (DESIGNS[DESIGN_DEFAULT] || DESIGNS[0]).key;
    function syncDesign() {
      var dsg = DESIGNS[designDd.selection.index] || DESIGNS[0], circle = (dsg.key === "CIRCLE"), pop = (dsg.key === "POP");
      sizeDd.selection = dsg.size;
      if (circle) nameHint.text = "위 큰 이름 (필수)";
      else if (pop) nameHint.text = "문구 뒤 – 이름 (비우면 이름 없이)";
      else nameHint.text = "– 이름 – 서명 (비우면 서명 없음)";
      heartHint.text = circle ? "끝에 분홍 하트" : "끝에 빨간 하트";
      fSub.enabled = circle;
      fLine2.enabled = !pop;
      for (var q = 0; q < popDds.length; q++) popDds[q].enabled = pop;
      syncFonts();
      var from = msgDefaultOf(lastKey), to = msgDefaultOf(dsg.key);
      if (_trim(fLine1.text) === from[0] && _trim(fLine2.text) === (from[1] || "")) {
        fLine1.text = to[0];
        fLine2.text = to[1] || "";
      }
      lastKey = dsg.key;
    }
    // 서체 표시 — 디자인·팝 사진 서체를 바꿀 때마다 (사이즈는 건드리지 않는다)
    function syncFonts() {
      var dsg = DESIGNS[designDd.selection.index] || DESIGNS[0], circle = (dsg.key === "CIRCLE"), t, h;
      if (dsg.key === "POP") { t = _resolvePick(POP_TITLE_FONTS, popTitleDd.selection.index); h = _resolvePick(POP_HAND_FONTS, popHandDd.selection.index); }
      else { t = _resolveFontList(circle ? BN_NAME_FONTS : BD_TITLE_FONTS); h = _resolveFontList(circle ? BN_HAND_FONTS : BD_HAND_FONTS); }
      var ft = t.spec.name + (circle ? " (이름) + " : " (제목) + ") + h.spec.name + " (문구)";
      if (t.fallback || h.fallback) ft += "  ⚠ 없는 서체 있음 (설치·Adobe Fonts 확인)";
      fontStat.text = ft;
    }
    designDd.onChange = syncDesign;
    popTitleDd.onChange = syncFonts;
    popHandDd.onChange = syncFonts;
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
      "윗몸·전신(파일명 _MED·_BIG 등)은 머리 크기를 맞추고 몸은 하트·원이 잘라요. 얼굴 누끼(_SML 등)는 얼굴 상자에 통째로.");
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
      var popOn = (DESIGNS[designDd.selection.index] || DESIGNS[0]).key === "POP";
      if (popOn ? !_trim(fLine1.text) : (!_trim(fLine1.text) && !_trim(fLine2.text))) {
        alert(popOn ? "문구를 적어 주세요 (이름은 문구 뒤에 붙어요)." : "문구를 한 줄 이상 적어 주세요.");
        return;
      }
      if ((DESIGNS[designDd.selection.index] || DESIGNS[0]).key === "CIRCLE" && !_trim(fName.text)) {
        alert("원 사진 디자인에 들어갈 이름을 적어 주세요.");
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
      popLayout:    popLayoutDd.selection.index,
      popTitle:     popTitleDd.selection.index,
      popHand:      popHandDd.selection.index,
      popColor:     popColorDd.selection.index,
      popShape:     popShapeDd.selection.index,
      popOut:       (popOutDd.selection.index === 0),
      designIdx:    designDd.selection.index,
      name:         _trim(fName.text),
      sub:          _trim(fSub.text),
      line1:        _trim(fLine1.text),
      line2:        _trim(fLine2.text),
      sizeMm:       SIZE_MM[sizeDd.selection.index],
      embed:        embedChk.value,
      customerName: _trim(fCust.text),
      orderDate:    _trim(fDate.text),
      shotTypes:    null,
      selectedPairs: selectedPairs
    };
  }

})();
