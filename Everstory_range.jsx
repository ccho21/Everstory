// ═══════════════════════════════════════════════════════════════
//  Everstory Range 시트 — 스튜디오 구성 시트 (Composed). Small / Large 면적 등급 엔진은 코드에만 남아 있다.
//
//  2026-09-16 대화창 정리 (사용자): Composed 만 — "크기 범위"·"배치 후보" 선택을 뺐고, 사진 수 제한이 없다
//  (기본 6장 선택, 더 고르면 시트당 최대 6장으로 나눠 여러 시트). 창은 두 열이라 버튼이 화면 밖으로 안 나간다.
//  아래 Small/Large 설명은 그 엔진의 기록이다 (테스트 훅으로만 실행).
//  주문 보드 '구성' 화면(scripts/order_intake/composed_preview.*)이 이 파일의 Composed 엔진을 브라우저에서 그대로 돌려
//  미리 보여주고, "Illustrator 에서 만들기" 는 $.global.__EVERSTORY_LAUNCH__.composed 로 값을 넘겨 대화창 없이 만든다
//  (_composedLaunchOptions). 미리보기와 공유하는 순수 함수(_composedHero · _composedPackExtras · _composedDeal)를 고치면
//  미리보기도 같이 바뀐다 — 최상위 함수·대문자 상수 규약(두 칸 들여쓰기)을 지킬 것 (추출기가 그 모양만 읽는다).
//
//  Everstory_mixed.jsx 를 건드리지 않고 같은 입력(02_cutout 페어) · 같은 템플릿 ·
//  같은 출력(03_output .ai) 규약으로 새 배치 방식을 시험한다. 결과가 좋으면
//  mixed.jsx 의 한 모드로 흡수하는 것이 다음 단계다.
//
//  상품 결정:
//   · Small = 1″ / 1.25″, Large = 1.5″ / 2″ — 2026-09-13 부터 이 숫자는 **긴 변이 아니라 면적**이다
//     ("1″ 스티커" = 1×1인치 면적 645mm²). 셀은 사진 비율대로 w=√(A·a), h=√(A/a), 최장변 상한 Small 2″ / Large 3″(가정).
//     정사각 사진은 예전과 같고 전신 사진은 세로로 길어진다 — 긴 변 기준에선 전신이 조각이 되고 얼굴 누끼만 커 보였다(사용자).
//     1.75″(44.45mm) 는 2″ 로 통일하며 폐기한 사이즈라 넣지 않는다. 2.5″ 도 제외.
//   · 디자인 1 · 4~6 → 1시트, 8 → 2시트 (4+4). 상품 SKU 는 1/4/8.
//   · 사진마다 두 등급 각 1장 이상(가능하면 — 못 넣으면 완료 메시지에 ⚠), 시트 안 사진별 최소 2개, 사진별 총수량 차이 ≤ 2.
//   · 배치 = 높이군 행 조판: 높이 비슷한 셀끼리 한 행, 아랫선 정렬, 양끝 맞춤. 열 정렬·칸 비우기 없음. 회전 없음.
//   · 이름 스티커(다이얼로그 "스티커 이름", A–Z 아트 알파벳 16mm)는 위 가운데. 이름 중간 높이까지 오는 세로 셀(전신 사진)이
//     있으면 이름 양옆에 세운다. 데코(deco_art_v1.ai, 디자인 수 + 2, Small 0.5″ / Large 0.75″)는 행의 남는 폭에 자리를
//     예약해 넣는다. 이름을 비우면 이름·데코 둘 다 없다. 한글·숫자 이름도 마찬가지(아트는 A–Z 뿐).
//   · 셀 = 칼선까지 포함한 박스. 셀 사이 최소 간격 1.5mm (mixed.jsx 와 동일).
//   · 주문 매니페스트 프리필은 이 테스트 파일에 없다.
//
//  배치 엔진 (v3, 2026-09-13): 순수 ES3, Adobe API 없음, 결정적 완전 열거(수백 조합). Node 검증 sim/range_layout_test.js.
//  이름·데코 그리기 엔진은 mixed.jsx 에서 복사 — 고칠 일이 있으면 mixed.jsx 를 먼저 고치고 여기로 복사한다.
//
//  그리기 파이프라인: 아래 "mixed.jsx 그대로" 구간은 Everstory_mixed.jsx 2026-09-06 판을
//  글자 그대로 복사한 것이다. TRACE_OPTS / CUT_CACHE_* 가 같아야 02_cutout/_cutcache 의
//  .evcut 을 **공유**한다 (이미 트레이스한 디자인은 여기서도 트레이스 0회).
//
//  ── Composed (사진 구성 시트, v2 2026-09-16 · 대화창의 유일한 모드) ──────────────────────────
//   · 사진 수 제한 없음. 시트당 1~6장 (COMPOSED_PER_SHEET) — 더 많으면 _composedDeal 이 시트를 늘리고 범위 상한이 큰
//     사진부터 돌아가며 나눈다 (8 → 4+4, 7 → 4+3). 사진이 적은 시트는 사진당 장수 상한·같은 사진 거리 기준을 비례로 푼다.
//   · 메인 기본은 선택 목록 첫 사진, 대화창에서 바꿀 수 있다 — 메인이 가장 큰 등급을 갖는다. 메인이 없는 시트는
//     그 시트가 처음 받은 사진(= 가장 큰 종류)이 메인.
//   · 종류 범위(최소·최대)는 지킨다 — 자리가 모자라도 크기를 줄여 넣지 않고 누락으로 보고한다.
//   · 크기 = **인치 사다리의 긴 변** 2.5·2·1.5·1.25·1·0.75″ (mixed.jsx TIER_SIZE_MM 과 같은 값, `_tierBox` 와 같은 규약).
//     짧은 변은 **실제 칼선 비율**로 따라온다. 2.5″ 는 언제나 63.5mm — 예외는 짧은 변 하한(10mm)에 걸릴 때뿐.
//     v1 의 역할×등급 목표 면적(refAspect 0.73)은 폐기: 비율 0.38 짜리 전신에서 긴 변이 88mm 까지 갔다.
//   · **사진 종류가 크기 범위를 정한다** (COMPOSED_SHOT_TYPES, 2026-09-16 사용자 확정):
//     얼굴 0.75~1.5″ · 상반신 1~2″ · 전신 1.25~2.5″ · 커플·단체 2~2.5″ · 반려동물 얼굴 0.75~1.25″ · 반려동물 전신 1.25~2.5″.
//     종류는 **파일명 표시가 먼저** 정한다 (COMPOSED_NAME_TYPES): 누끼 저장 때 붙인 _SML 얼굴 · _MED 상반신 ·
//     _BIG 전신 (옛 _XS~_XXL · _FAM 도 읽음). 표시가 있는 사진은 측정도 확인 창도 없다.
//     표시가 없는 사진만 scripts/face_probe 앱(macOS Vision)이 얼굴 높이 ÷ 칼선 높이와 얼굴·사람 수로 자동 판별하고,
//     확인 창에서 운영자가 고친다. 반려동물·얼굴 없는 사진은 운영자가 고른다. 확정값은 _cutcache/*.evface.
//   · 등급별 장수는 고정이 아니라 **면적 배분**으로 뽑는다 (COMPOSED_GRADE_SHARE = 레퍼런스 목업 실측).
//     그 등급을 쓸 수 있는 사진만 센다 — 얼굴만 있는 주문엔 2″·2.5″ 가 없고, 그 몫은 다른 등급으로 간다.
//   · 배치 = **큰 것부터**. 앞 6장은 서로(+이름·시트 모서리) 가장 먼 자리로 분산하고, 나머지는 빈틈에 밀착한다.
//     사각형(셀) 충돌 + 간격 1.5mm. 격자·행 구조 없음, 같은 사진은 떨어뜨린다. 결정적(난수도 변형 탐색도 없다).
//   · **배치 선택** (2026-09-16 사용자 — 주문 보드에서 그림으로 보고 고른다. 대화창에는 없다):
//     스타일(COMPOSED_STYLES: 가운데·양옆·모으기·가장자리·아래쪽) · 이름 위치(왼쪽·가운데·오른쪽) · 좌우 바꿈 · 섞기 번호.
//     스타일은 큰 조각이 끌리는 자리만 바꾸고 크기·장수 계획은 그대로다. 섞기도 정수 해시라 결정적이다 —
//     같은 선택이면 미리보기와 Illustrator 가 같은 자리를 낸다 (완료 창이 _composedLayoutSig 로 확인).
//     선택이 없으면(대화창 실행) 가운데 · 이름 왼쪽 = 예전 배치 그대로.
//   · **크기 직접** (2026-09-16 사용자, 주문 보드): 사진마다 [최소, 최대] 인치(pair.sizeRange)를 고르면 종류 범위 대신 쓴다 —
//     시트 나누기·배치·검사기 모두. 고르지 않은 사진은 종류 범위 그대로.
//   · **장수 상한** (2026-09-17 사용자, 주문 보드): 사진마다 pair.maxCopies 를 정하면 그 사진은 그 장수를 넘지 않는다.
//     비우면(0) 지금처럼 엔진이 정한다. 상한일 뿐이라 자리가 모자라면 더 적게 나올 수 있고, 남는 자리는 다른 사진이 채운다.
//   · **셀 = 사진 + 2×흰 테두리(rim)**. rim = 다이얼로그 "칼선 여백"(Composed 기본 1mm). 칼선은 사진 윤곽에 맞추므로
//     나중에 칼선을 rim 만큼 바깥으로 오프셋해도 이웃 칼선과 1.5mm 가 남는다. rim 을 0 으로 고르면 그 여유가 없다.
//   · **칼선을 배치보다 먼저** 준비한다 (_produceComposedSheet ①) — 크기가 칼선 비율에서 나오기 때문. 캐시 히트면 트레이스 0회.
//   · 사진 배치도 칼선 기준(_placeComposedSticker) — 투명 캔버스 여백이 스티커를 줄이지 않는다. Small/Large 는 기존 경로 그대로.
//   · 이름·데코는 기존 엔진 그대로 쓰고 자리만 정한다.
//   · **이름 스타일** (2026-09-17 사용자, 주문 보드에서 고른다 · 대화창 실행은 retro): COMPOSED_NAME_STYLES —
//     retro = alphabet_art_v1 + deco_art_v1 (글자마다 칼선, 예전 그대로) · bubble = alphabet_art_v2 + deco_art_v2
//     (글자를 살짝 겹쳐 쓰고 이름 전체를 흰 테두리 하나로 — _drawNameHalo, 칼선 1개. 옆 장식은 줄 맨 앞·끝 글자만).
//     bubble 은 이름·데코 박스를 칼선 여백만큼 넓게 잡아, 나중에 칼선을 오프셋해도 이웃과 간격이 남는다.
//     bubble 글자는 자리마다 색을 돌린다 (LETTER_PAINT_CYCLE_V2 · 색 그룹 'LTR A PINK').
//     미리보기 그림은 templates/art_preview/<라이브러리>/ (라이브러리를 고치면 다시 뽑는다 — templates/art_preview/README.md).
//   · **데코 돌리기** (2026-09-17): 스티커 이름마다 다른 데코로 시작하고 다음 시트는 이어서 (_composedDecoStart).
//   · **말풍선** (2026-09-17 사용자): 글씨 두들은 12.7mm 데코 칸에서 안 읽혀서 시트당 COMPOSED_BUBBLE_MAX(2)개까지
//     22mm(안 되면 19mm)로 따로 자리를 잡는다 — 사다리 사진 뒤 · 빈틈 추가 사진 앞, 데코 6개 안에서 (_composedPlaceBubbles).
//     레트로 말풍선 그림은 scripts/art_library/build_retro_bubbles.jsx 가 deco_art_v1.ai 에 그린다.
//
//  검증: sim/range_layout_test.js · sim/range_name_test.js · sim/range_output_test.js · sim/range_composed_test.js.
//  Illustrator 실행은 테스트 시트로.
//
//  사용: File → Scripts → Other Script → Everstory_range.jsx
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "range composed (2026-09-16)";
  var SCRIPT_TITLE = "Everstory Composed Sheet";
  var MM_TO_PT = 2.834645;

  // ── 시트 (Everstory_mixed.jsx 2026-08-25 운영 상수와 동일) ─────
  var BODY_PADDING_X_MM = 0;
  var BODY_PADDING_Y_MM = 1.5;
  var GAP_DEFAULT_MM = 1.5;

  // ── 범위 ─────────────────────────────────────────────────────
  // 대화창은 Composed 만 고른다 (2026-09-16 사용자: "크기 범위 선택은 빼고 한 가지로", "배치 후보도 뺀다").
  // Small/Large 엔진은 지우지 않았다 — 테스트 훅(options.range = "small"/"large")으로만 돈다.
  // 2026-09-12 사용자: Small 은 1 / 1.25″ 두 크기만 (0.5·0.75 제외 — "너무 많고 별로"), Large 는 1.5 / 2″ 유지.
  // 2026-09-13 부터 이 값은 **면적 등급의 한 변**(정사각 환산). 셀 크기는 _rangeCell 이 비율대로 계산한다.
  var RANGE_SIZES_MM = { small: [25.4, 31.75], large: [38.1, 50.8] };
  var RANGE_LABELS = { small: "Small 1-1.25\"", large: "Large 1.5-2\"", composed: "Composed" };
  var RANGE_TAGS = { small: "SMALL", large: "LARGE", composed: "COMPOSED" };   // 03_output 파일명 토큰
  // 사진 1 · 4~6개 → 1시트, 8개 → 2시트(4+4). 상품 SKU 는 1/4/8 그대로, 5·6은 시트 구성 유연성.
  var RANGE_DESIGN_COUNTS = [1, 4, 5, 6, 8];
  var RANGE_PER_SHEET = 6;           // 시트당 최대 디자인 수. 넘치면 _rangeDeal 이 균등 분할

  // ── 이름 · 데코 ──────────────────────────────────────────────
  var RANGE_MARGIN_X_MM = 3;         // 큰 이름 폭 상한 계산용 좌우 여백
  var RANGE_HERO_UNIT_MM = 16;       // 큰 레터 이름 유닛
  var RANGE_HERO_MAX_W_MM = 110;     // 큰 이름 폭 상한 — 넘으면 유닛을 낮춘다 (하한 LETTER_UNIT_MIN_MM)
  var RANGE_DECO_SIZE_MM = { small: 12.7, large: 19.05 }; // 데코 한 변 = 작은 등급 변의 절반 (2026-09-12 사용자: Small 은 0.5")

  // ── 배치 엔진 v3 (면적 등급 행 조판, 2026-09-13) ──────────────
  var RANGE_LONG_CAP_MM = { small: 50.8, large: 76.2 };  // 셀 최장변 상한. Small 2″ 는 사용자 확정, Large 3″ 은 가정(미결)
  var RANGE_MIN_PER_PHOTO = 2;       // 사진별 총수량 하한
  // 시트별 총수량 편차. 8디자인 주문의 두 시트 사이 편차는 별도 정책이다.
  var RANGE_SPREAD_MAX = 2;
  var RANGE_ROW_FILL_MIN = 0.7;      // 행의 사진 폭 합 / 쓸 수 있는 폭 하한 — 이보다 성긴 행은 조합째 버린다 (양끝 맞춤이 벌어지지 않게)
  var RANGE_ROW_FILL_RELAX = 0.5;    // 정상 규칙으로 아무 조합도 안 나오면(Large 큰 셀·전신 사진) 완화 규칙으로 다시 찾고 ⚠ 표시:
  var RANGE_MIN_PER_PHOTO_RELAX = 1; //   행 채움 하한 0.5 · 사진별 최소 1장 · 개수 차이 ≤ 3. 시트가 아예 안 나오는 것보다 낫다 — 메시지로 알린다.
  var RANGE_SPREAD_MAX_RELAX = 3;
  var RANGE_ROW_GAP_EXTRA_MAX_MM = 5; // 남는 세로 여백을 행 사이에 나눌 때 행당 상한. 나머지는 아래에 남긴다
  var RANGE_MAX_ROWS = 6;            // 군당 행 수 탐색 상한
  var RANGE_DECO_SHORTFALL_OK = 0;   // 데코가 이만큼 모자라도 사진 장수를 먼저 본다. 0 = 데코 수를 먼저 채운다
  var EPS = 0.0001;                  // pt 비교 허용 오차

  // ── Composed — 사진 6장 구성 시트 (2026-09-16 v2) ────────────────────
  // 크기 = **인치 사다리의 긴 변** (mixed.jsx `_tierBox` 와 같은 규약: 긴 변 = 인치, 비율 보존).
  // 짧은 변은 실제 **칼선 비율**로 따라온다 — 투명 캔버스 여백은 크기에 안 들어간다.
  // 배치는 **큰 것부터**: 큰 조각은 서로 멀리(분산), 나머지는 빈틈에 꼭 맞게(밀착).
  // v1 의 역할×등급 목표 면적(refAspect 0.73)은 폐기 — 세로로 긴 사진에서 긴 변이 88mm 까지 갔다.
  // 아래 숫자는 전부 튜닝 파라미터. 등급별 장수 배분은 레퍼런스 목업 실측값이다.
  var COMPOSED_KEY = "composed";
  // 사진 수 제한 없음 (2026-09-16 사용자). 시트당 최대 COMPOSED_PER_SHEET 장 — 넘치면 시트를 늘려 종류가 고르게 나눈다
  // (7장 → 4+3, 8장 → 4+4). 사진이 적은 시트는 사진당 장수 상한·같은 사진 거리 기준을 장수에 맞춰 푼다.
  var COMPOSED_PER_SHEET = 6;
  var COMPOSED_DEFAULT_SELECT = 6;         // 대화창 기본 선택 장수 (폴더에 그보다 적으면 전부). 더 골라도 된다
  var COMPOSED_DIALOG_ROWS = 12;           // 종류 확인 창 한 열의 행 수 — 넘치면 열을 늘린다 (창이 화면을 넘지 않게)
  // 주문 보드 미리보기가 쓰는 시트 body 크기 — template_cutout_v2.ait 의 info > body 실측 (2026-09-16, 142 × 175mm).
  // 시트 생성은 템플릿에서 잰 값을 쓰고, 이 값과 다르면 완료 창에 알린다 (미리보기가 틀어졌다는 뜻 — 이 값을 고칠 것).
  var COMPOSED_PREVIEW_BODY_MM = [142, 175];
  var COMPOSED_GRADES_IN = [2.5, 2, 1.5, 1.25, 1, 0.75];   // 긴 변 인치 — mixed.jsx TIER_SIZE_MM 사다리와 같은 값
  // 장수는 고정이 아니라 **면적 배분**으로 뽑는다. 고정 개수(1·1·4·2·6·10)를 그대로 쓰면 정사각에 가까운
  // 사진에서 큰 등급이 면적을 다 먹어 작은 등급이 통째로 빠진다 (하린 6장 시뮬: 24 중 11 누락).
  var COMPOSED_GRADE_SHARE = [0.15, 0.08, 0.28, 0.10, 0.19, 0.20];  // 레퍼런스 목업 실측 면적 비중
  var COMPOSED_GRADE_MAX = [1, 2, 6, 4, 10, 16];   // 등급 상한 — 쓸 수 있는 등급이 적으면 그 비중만큼 풀린다
  var COMPOSED_MIN_COPIES = 2;                     // 사진마다 최소 장수 (자리가 되는 한)
  var COMPOSED_COPIES_MAX = 24;                    // 사진별 장수 상한으로 받을 수 있는 가장 큰 값 (넘으면 값이 잘못된 것)
  var COMPOSED_ART_BUDGET = 0.56;          // 사진 박스(테두리 제외) 합 / 쓸 수 있는 넓이
  var COMPOSED_PACK_BUDGET = 0.72;         // 셀(테두리 포함) 합 / 쓸 수 있는 넓이 — 넘으면 큰 등급부터 한 장씩 뺀다
  var COMPOSED_SPREAD_COUNT = 6;           // 앞에서 이만큼은 서로 멀리 (2.5·2·1.5…). 나머지는 빈틈 채우기
  var COMPOSED_RIM_MM = 1;                 // 흰 테두리 — 셀 = 사진 + 2×rim, 칼선 = 사진 박스.
                                           //   나중에 칼선을 rim 만큼 바깥으로 오프셋해도 이웃과 GAP 이 남는다.
  var COMPOSED_MIN_SHORT_MM = 10;          // 가독성: 짧은 변 하한 (전신·세로로 긴 컷)
  var COMPOSED_STEP_MM = 4;                // 큰 조각의 성긴 격자 후보 간격. 채움 조각은 격자를 안 쓴다
                                           //   (쓰면 후보가 4배 → ExtendScript 에서 그만큼 느리다)
  var COMPOSED_EXTRA_MAX = 8;              // 사다리를 다 놓은 뒤 남은 빈틈에 최소 등급을 이만큼까지 더
  var COMPOSED_EXTRA_MIN_CONTACT = 0.28;   // 추가 사진은 둘레의 이 비율 이상이 이웃·가장자리에 닿아야 (빈틈 채움)
  var COMPOSED_EXTRA_SAME_MIN_MM = 40;     // 추가 사진은 같은 사진과 중심 거리가 이보다 가까우면 안 넣는다 (같은 얼굴이 나란히 붙었다)
  var COMPOSED_FILL_SAME_MIN_MM = 30;      // 면적 배분(④) 조각도 — 같은 사진 옆자리밖에 없으면 그 조각은 뺀다 (필수 조각이 아니다)
  var COMPOSED_DUP_MIN_MM = 45;            // 같은 사진 중심 거리 — 이보다 가까우면 벌점
  var COMPOSED_SAMEGRADE_MM = 14;          // 같은 등급끼리 이보다 가까우면 벌점 (크기 리듬)
  var COMPOSED_WEIGHTS = { contact: 26, align: 4, dup: 4, sameGrade: 8, spreadContact: 3 };   // dup 2→4: 붙임 보상(최대 26)이 같은 사진 7mm 부족을 못 이기게
  var COMPOSED_PER_PHOTO_MAX = [1, 1, 2, 2, 3, 4];   // 한 사진이 같은 등급에 들어가는 최대 장수 (사진 6장 기준, 등급 순서 = COMPOSED_GRADES_IN)
  // 배치 선택 (2026-09-16 사용자: 주문 보드에서 배치 종류를 바꿔 보고 고른다). 크기·장수 계획은 스타일과 무관하다
  // (종류 범위·최소 장수 그대로) — 스타일은 큰 조각(분산 대상)이 끌리는 자리만 바꾼다. pull = 끌림 세기(mm 거리와 같은 눈금),
  // namePos = 이름 위치를 "자동"으로 둘 때의 자리. 실주문 8건 시뮬(2026-09-16): 위쪽·대각선은 가운데와 거의 같아 뺐다.
  var COMPOSED_STYLES = [
    { key: "center",  label: "가운데",   namePos: "left",   pull: 0 },    // 예전 배치 — 가장 큰 사진이 가운데
    { key: "sides",   label: "양옆",     namePos: "center", pull: 45 },   // 큰 사진이 좌우 기둥, 가운데는 작은 사진
    { key: "cluster", label: "모으기",   namePos: "center", pull: 0 },    // 큰 사진을 가운데에 붙여 한 덩어리 (모서리 반발 없음)
    { key: "frame",   label: "가장자리", namePos: "left",   pull: 45 },   // 큰 사진이 가장자리·모서리 (모서리 반발 없음)
    { key: "bottom",  label: "아래쪽",   namePos: "center", pull: 90 }    // 큰 사진이 아래, 이름 쪽은 작은 사진
  ];
  var COMPOSED_NAME_POSITIONS = ["left", "center", "right"];
  var COMPOSED_NAME_POS_LABELS = { left: "왼쪽", center: "가운데", right: "오른쪽" };
  var COMPOSED_SHUFFLE_MAX = 999;          // 섞기 번호 상한 (0 = 섞지 않음)
  var COMPOSED_SHUFFLE_SPREAD = 10;        // 섞기: 큰 조각 자리 점수 흔들기 폭 (mm 눈금)
  var COMPOSED_SHUFFLE_FILL = 3;           // 섞기: 채움 조각 자리 점수 흔들기 폭 (붙임 보상 최대 26 눈금)
  var COMPOSED_CLUSTER_CONTACT = 6;        // 모으기: 가운데까지 거리(mm) 대비 붙임 보상
  var COMPOSED_VARIANT_TRIES = 8;          // 주문 보드 "변형" 줄 — 섞기 번호를 이만큼 돌려 보고
  var COMPOSED_VARIANT_KEEP = 3;           //   서로 다른 배치를 이만큼까지 보여 준다
  var COMPOSED_VARIANT_DROP = 2;           //   기본보다 스티커가 이보다 많이 줄면 버린다

  // ── 사진 종류 → 크기 범위 (2026-09-16 사용자 확정) ────────────────────
  // 긴 변 인치, 양끝 포함. 사진마다 자기 종류의 범위 안 등급만 쓴다 — 0.75″ 전신·2″ 얼굴처럼
  // 스티커 크기는 맞는데 얼굴이 너무 작거나 큰 경우를 막는다 (인쇄 얼굴 높이 실측이 근거).
  // 종류는 파일명 표시가 먼저 정하고(아래 COMPOSED_NAME_TYPES), 표시가 없는 사진만 Vision 으로 재서
  // 자동 판별한 뒤(사람) 확인 창에서 운영자가 고친다. 반려동물은 운영자가 고른다.
  var COMPOSED_SHOT_TYPES = [
    { key: "face",    label: "얼굴",          minIn: 0.75, maxIn: 1.5 },
    { key: "upper",   label: "상반신",        minIn: 1,    maxIn: 2 },
    { key: "full",    label: "전신",          minIn: 1.25, maxIn: 2.5 },   // 1.5 → 1.25 (2026-09-16 사용자) — 1.5″ 에 몰려 같은 크기 인물만 늘어섰다
    { key: "group",   label: "커플·단체",     minIn: 2,    maxIn: 2.5 },
    { key: "petFace", label: "반려동물 얼굴", minIn: 0.75, maxIn: 1.25 },
    { key: "petBody", label: "반려동물 전신", minIn: 1.25, maxIn: 2.5 }
  ];
  var COMPOSED_TYPE_NONE = "none";          // 미분류 = 범위 제한 없음 (자동 판별이 안 됐고 운영자도 안 골랐을 때)
  // 파일명 끝 크기 표시 → 종류 (2026-09-16 사용자). 표시는 누끼 저장 때 스튜디오가 사진을 보고 붙인다
  // (저장 플러그인 버튼 SML 얼굴 · MED 상반신 · BIG 전신). 표시가 있으면 그대로 쓰고 측정·확인 창을 건너뛴다.
  // 옛 6티어 표시는 mixed.jsx TIER_TO_BUCKET 과 같은 묶음으로 읽고, FAM 은 커플·단체.
  // 옛 Package 주문 폴더의 표시는 고객이 3칸에 나눠 올린 값이라 종류와 다를 수 있다 — 틀리면 파일명 표시를 고친다.
  var COMPOSED_NAME_TOKEN_RE = /_(BIG|MED|SML|FAM|XXL|XL|XS|S|M|L)$/i;
  var COMPOSED_NAME_TYPES = {
    SML: "face", XS: "face", S: "face",
    MED: "upper", M: "upper", L: "upper",
    BIG: "full", XL: "full", XXL: "full",
    FAM: "group"
  };
  // 자동 판별 기준 — 얼굴 높이 ÷ 칼선 높이. 실주문 사람 사진 24장 전부 맞게 갈린 값 (얼굴 53~66% · 상반신 21~39% · 전신 7~19%).
  var COMPOSED_TYPE_FACE_MIN = 0.40;
  var COMPOSED_TYPE_UPPER_MIN = 0.20;
  var COMPOSED_TYPE_GROUP_PEOPLE = 2;       // 얼굴 수·사람 박스 수 중 큰 값이 이 이상이면 커플·단체
  // 얼굴 측정 앱 (scripts/face_probe/README.md). Illustrator 는 셸을 못 부르므로 File.execute() 로 띄우고 결과 파일을 기다린다.
  var COMPOSED_FACE_PROBE_APP = "scripts/face_probe/EverstoryFaceProbe.app";
  var COMPOSED_FACE_PROBE_TIMEOUT_MS = 15000;
  var COMPOSED_FACE_CACHE_FORMAT = "EVFACE1";
  var COMPOSED_FACE_CACHE_EXT = ".evface";  // _cutcache 안, .evcut 옆. 측정값 + 운영자가 확정한 종류
  var COMPOSED_DECO_SIZES_MM = [12.7, 10];   // 데코 **그림** 크기 (정사각 mm) — 박스 = 그림 + 2×여백 (레트로는 여백 0 이라 같다)
  // 버블 데코 그림 (2026-09-17 사용자 "아이콘이 너무 작다, 20% 키우자"): 예전 10.7·8 의 1.2배 + 가운데 칸은 예전 큰 값.
  // 가운데 칸이 없으면 큰 칸(12.84)이 안 들어가는 자리가 전부 제일 작은 칸으로 떨어진다 (실측: 평균 11.14 → 11.39mm).
  var COMPOSED_DECO_ART_V2_MM = [12.84, 10.7, 9.6];
  var COMPOSED_DECO_MAX = 6;               // 스티커 이름이 있을 때만 (range 규약) · 말풍선 포함 · 빈틈이 없으면 덜 넣는다
  var COMPOSED_DECO_NEAR_MM = 4.5;         // 데코는 스티커 가장자리에서 이 거리 안 = 빈틈에만
  var COMPOSED_DECO_SPACING_MM = 22;       // 데코끼리(말풍선 포함) 중심 최소 거리
  var COMPOSED_DECO_GRID_MM = 4;
  // 말풍선 (2026-09-17 사용자) — 글씨 두들은 데코 칸(12.7mm)에서 글씨가 2mm 안팎이라 안 읽혀서 따로 자리를 잡는다:
  // 사다리 사진 뒤 · 빈틈 추가 사진 앞, 시트당 COMPOSED_BUBBLE_MAX 개까지 (데코 COMPOSED_DECO_MAX 개 안에서).
  // 크기 = 그림의 긴 변 — 앞 크기가 들어갈 자리가 없으면 다음 크기. 박스 비율 = 그 말풍선 그림 비율 (스타일 표 bubbleAspect).
  var COMPOSED_BUBBLE_MAX = 2;
  var COMPOSED_BUBBLE_SIZES_MM = [22, 19];
  var COMPOSED_BUBBLE_SPACING_MM = 45;     // 말풍선끼리 중심 최소 거리
  var COMPOSED_CUT_REL_MIN = 0.2;          // 칼선 캐시 relW/relH 가 이보다 작으면 손상으로 본다
  var COMPOSED_FIT_TOL_MM = 0.05;          // 출력 검사: 실제 칼선 박스 = 계획 셀 허용 오차

  // ── 헤더 · 칼선 여백 (mixed.jsx 와 동일) ────────────────────
  var MATERIAL_OPTIONS = ["White Matte", "Translucent", "Silver", "Gold"];
  var CUT_MARGIN_OPTIONS = ["0mm", "0.5mm", "1mm", "2mm"];
  var CUT_MARGIN_VALUES = [0, 0.5, 1, 2];
  var CUT_MARGIN_DEFAULT_INDEX = 0;

  // ── 칼선 디스크 캐시 (mixed.jsx 와 **반드시 동일** — 다르면 .evcut 을 공유하지 못한다) ──
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

  // ══ 이름 스티커 + 데코 (Everstory_mixed.jsx 2026-09-12 에서 그대로 복사) ═══════
  // 고칠 일이 있으면 mixed.jsx 를 먼저 고치고 여기로 복사한다. 상수는 메인 플로우 위.
  var LETTER_UNIT_MM = 9.5;
  var LETTER_GAP_RATIO = 0.35;
  var LETTER_UNIT_MIN_MM = 5;
  var LETTER_ART_LIB_NAME = "alphabet_art_v1.ai";
  var LETTER_ART_RE = /^[A-Za-z]+$/;
  var LETTER_ART_METRICS = {
    A: { aw: 0.8787, cap: 0.7691, gw: 0.6200, bl: 0.8440, lsb: 0.0966, rsb: 0.1621 },
    B: { aw: 0.8428, cap: 0.6679, gw: 0.5094, bl: 0.8366, lsb: 0.1670, rsb: 0.1664 },
    C: { aw: 0.9171, cap: 0.6839, gw: 0.5786, bl: 0.8424, lsb: 0.1705, rsb: 0.1680 },
    D: { aw: 0.6234, cap: 0.6765, gw: 0.3617, bl: 0.8173, lsb: 0.0909, rsb: 0.1708 },
    E: { aw: 0.7360, cap: 0.6904, gw: 0.4115, bl: 0.8605, lsb: 0.1663, rsb: 0.1581 },
    F: { aw: 0.7931, cap: 0.7881, gw: 0.5907, bl: 0.8962, lsb: 0.1006, rsb: 0.1018 },
    G: { aw: 0.7597, cap: 0.7303, gw: 0.5760, bl: 0.8726, lsb: 0.1312, rsb: 0.0525 },
    H: { aw: 0.8686, cap: 0.6944, gw: 0.5507, bl: 0.8524, lsb: 0.1487, rsb: 0.1692 },
    I: { aw: 0.5923, cap: 0.7293, gw: 0.3410, bl: 0.8685, lsb: 0.1176, rsb: 0.1337 },
    J: { aw: 0.7378, cap: 0.8099, gw: 0.5442, bl: 0.8976, lsb: 0.1051, rsb: 0.0886 },
    K: { aw: 0.7029, cap: 0.6872, gw: 0.5156, bl: 0.8531, lsb: 0.0997, rsb: 0.0876 },
    L: { aw: 0.7597, cap: 0.7098, gw: 0.4650, bl: 0.8414, lsb: 0.1735, rsb: 0.1212 },
    M: { aw: 0.9359, cap: 0.6584, gw: 0.6926, bl: 0.8429, lsb: 0.1274, rsb: 0.1160 },
    N: { aw: 0.7556, cap: 0.6889, gw: 0.5387, bl: 0.8961, lsb: 0.1262, rsb: 0.0908 },
    O: { aw: 0.8033, cap: 0.7729, gw: 0.5921, bl: 0.8925, lsb: 0.1105, rsb: 0.1008 },
    P: { aw: 0.7326, cap: 0.7459, gw: 0.5099, bl: 0.8878, lsb: 0.1216, rsb: 0.1011 },
    Q: { aw: 0.7696, cap: 0.7884, gw: 0.4992, bl: 0.9026, lsb: 0.1281, rsb: 0.1422 },
    R: { aw: 0.7638, cap: 0.7192, gw: 0.5311, bl: 0.8677, lsb: 0.1223, rsb: 0.1104 },
    S: { aw: 0.7625, cap: 0.7351, gw: 0.5007, bl: 0.8806, lsb: 0.1284, rsb: 0.1334 },
    T: { aw: 0.8052, cap: 0.7590, gw: 0.5282, bl: 0.8878, lsb: 0.1410, rsb: 0.1361 },
    U: { aw: 0.7453, cap: 0.6730, gw: 0.4650, bl: 0.8582, lsb: 0.1259, rsb: 0.1544 },
    V: { aw: 0.9265, cap: 0.8537, gw: 0.7878, bl: 0.9253, lsb: 0.0709, rsb: 0.0678 },
    W: { aw: 0.9351, cap: 0.7014, gw: 0.7041, bl: 0.8545, lsb: 0.1222, rsb: 0.1089 },
    X: { aw: 0.7318, cap: 0.7948, gw: 0.5504, bl: 0.9030, lsb: 0.0908, rsb: 0.0906 },
    Y: { aw: 0.7594, cap: 0.7318, gw: 0.5473, bl: 0.8647, lsb: 0.1047, rsb: 0.1074 },
    Z: { aw: 0.8740, cap: 0.7857, gw: 0.6279, bl: 0.8934, lsb: 0.1231, rsb: 0.1230 }
  };
  var DECO_ART_LIB_NAME = "deco_art_v1.ai";
  var DECO_EXTRA = 2;
  var DECO_ORDER = [
    "HEART", "FLOWER", "STAR", "CAMERA", "BOW", "BONE",
    "CHERRY", "SMILE", "RAINBOW", "CUPCAKE", "GIFT", "CLOUD"
  ];
  // 레트로 말풍선 (2026-09-17) — scripts/art_library/build_retro_bubbles.jsx 가 deco_art_v1.ai 에 그린다.
  // 분홍 바탕 둘(YAY · WOW)이 한 시트에 같이 나오지 않게 떨어뜨린 순서.
  var DECO_BUBBLES_V1 = ["YAY", "BESTDAY", "XOXO", "WOW", "MYFAVE", "YOUME"];
  // 말풍선 그림 비율 = 라이브러리 그룹 geometricBounds 폭 ÷ 높이 (도구가 다시 재서 이 표와 비교한다).
  var DECO_BUBBLE_ASPECT_V1 = {
    YAY: 1.3063,
    BESTDAY: 1.3063,
    XOXO: 1.2840,
    WOW: 1.2840,
    MYFAVE: 1.3063,
    YOUME: 1.2840
  };

  // ── 이름 스타일 (2026-09-17 사용자: 주문 보드에서 두 스타일 중 고른다) ─────────────────
  // retro  = alphabet_art_v1 + deco_art_v1. 글자마다 따로 떼는 스티커 — 예전 그대로이고 대화창 실행도 이것.
  // bubble = alphabet_art_v2 (shopify_assets "알파벳 샘플_6") + deco_art_v2 ("sticker sample 4").
  //          글자를 살짝 겹쳐 쓰고 이름 전체를 흰 테두리 하나로 묶은 **통짜 스티커** (칼선 1개) —
  //          레퍼런스 assets/style_refs/2026-09-11_bubble-alphabet_names.png. 데코 두들도 흰 테두리가 아트에 들어 있다.
  // bubble 글자는 모두 **같은 배율**로 줄인다 (그린 크기 차이를 살린다): 틀 높이 = capPt × fh,
  // fh = 그 글자 틀 높이 ÷ 기준 높이 (몸통 높이 중앙값 198.3pt). aw = 틀 폭 ÷ 틀 높이, bl = 틀 위 → 몸통 바닥(글자 바닥선) ÷ 틀 높이.
  // 옆 장식(V 왼쪽 선 · C 오른쪽 선 · Z 별)은 라이브러리에서 SIDE L / SIDE R 묶음이고 **줄의 맨 앞 / 맨 끝 글자만** 쓴다 —
  // 이름 가운데에 오면 글자 사이가 벌어진다. core = 옆 장식을 뺀 틀, L / R = 그 장식을 넣은 틀.
  // 라이브러리를 다시 만들면 이 표도 다시 잰다 (틀 = 그룹 geometricBounds, 몸통 = 그룹 안 BODY).
  var LETTER_ART_METRICS_V2 = {
    A: { core: { aw: 0.8055, bl: 0.9949, fh: 0.9979 } },
    B: { core: { aw: 0.6959, bl: 0.9951, fh: 1.0211 } },
    C: { core: { aw: 0.8010, bl: 0.9946, fh: 0.9415 }, R: { aw: 0.7704, bl: 0.9951, fh: 1.0232 } },
    D: { core: { aw: 0.7619, bl: 0.9951, fh: 1.0267 } },
    E: { core: { aw: 0.6728, bl: 0.9951, fh: 1.0230 } },
    F: { core: { aw: 0.6362, bl: 0.9951, fh: 1.0288 } },
    G: { core: { aw: 0.8030, bl: 0.9951, fh: 1.0357 } },
    H: { core: { aw: 0.7349, bl: 0.9949, fh: 0.9920 } },
    I: { core: { aw: 0.3514, bl: 0.9954, fh: 1.0874 } },
    J: { core: { aw: 0.7148, bl: 0.9951, fh: 1.0306 } },
    K: { core: { aw: 0.7895, bl: 0.9948, fh: 0.9767 } },
    L: { core: { aw: 0.6491, bl: 0.9949, fh: 0.9906 } },
    M: { core: { aw: 0.9555, bl: 0.9948, fh: 0.9662 } },
    N: { core: { aw: 0.8018, bl: 0.9950, fh: 1.0024 } },
    O: { core: { aw: 0.8867, bl: 0.9947, fh: 0.9536 } },
    P: { core: { aw: 0.7008, bl: 0.9949, fh: 0.9959 } },
    Q: { core: { aw: 0.8354, bl: 0.9950, fh: 1.0070 } },
    R: { core: { aw: 0.7092, bl: 0.9951, fh: 1.0320 } },
    S: { core: { aw: 0.6777, bl: 0.9951, fh: 1.0369 } },
    T: { core: { aw: 0.7490, bl: 0.9950, fh: 1.0052 } },
    U: { core: { aw: 0.8612, bl: 0.9947, fh: 0.9596 } },
    V: { core: { aw: 0.8885, bl: 0.9947, fh: 0.9523 }, L: { aw: 1.0408, bl: 0.9947, fh: 0.9523 } },
    W: { core: { aw: 1.1434, bl: 0.9944, fh: 0.8983 } },
    X: { core: { aw: 0.9262, bl: 0.9949, fh: 0.9885 } },
    Y: { core: { aw: 0.8033, bl: 0.9950, fh: 1.0136 } },
    Z: { core: { aw: 0.8763, bl: 0.9948, fh: 0.9652 }, R: { aw: 1.2442, bl: 0.9948, fh: 0.9778 } }
  };
  // 버블 글자 색 (2026-09-17 사용자 — 레퍼런스처럼 자리마다 색을 돌린다). 글자마다 칠할 수 있는 색이고 첫 색 = 라이브러리 원래
  // 그룹('LTR A'), 나머지 = 바탕(FACE)만 그 색으로 바꾼 그룹('LTR A PINK'). 글자 안 장식과 같은 색은 없다 — A 는 노란 하트가 있어
  // 노랑이 없고, N(하늘 줄무늬)·O·Q(흰 속구멍)·D(흰 꽃)는 흰색이 없다. 라이브러리를 다시 만들면 도구가 이 표도 다시 만들어 비교한다.
  var LETTER_ART_PAINTS_V2 = {
    A: ["WHITE", "PINK", "SKY"],
    B: ["YELLOW", "WHITE", "PINK", "SKY"],
    C: ["WHITE", "PINK", "YELLOW", "SKY"],
    D: ["SKY", "PINK"],
    E: ["WHITE", "PINK", "YELLOW", "SKY"],
    F: ["PINK", "WHITE", "YELLOW", "SKY"],
    G: ["WHITE", "PINK", "YELLOW", "SKY"],
    H: ["WHITE", "PINK", "YELLOW", "SKY"],
    I: ["YELLOW", "WHITE", "SKY"],
    J: ["WHITE", "PINK", "YELLOW", "SKY"],
    K: ["PINK", "WHITE", "YELLOW", "SKY"],
    L: ["WHITE", "PINK", "YELLOW", "SKY"],
    M: ["YELLOW", "WHITE", "PINK", "SKY"],
    N: ["SKY", "PINK", "YELLOW"],
    O: ["PINK", "YELLOW", "SKY"],
    P: ["WHITE", "PINK", "SKY"],
    Q: ["YELLOW", "PINK", "SKY"],
    R: ["WHITE", "PINK", "YELLOW", "SKY"],
    S: ["SKY", "WHITE", "PINK", "YELLOW"],
    T: ["WHITE", "PINK", "YELLOW", "SKY"],
    U: ["YELLOW", "WHITE", "PINK", "SKY"],
    V: ["WHITE", "PINK", "YELLOW", "SKY"],
    W: ["SKY", "WHITE", "PINK", "YELLOW"],
    X: ["WHITE", "PINK", "YELLOW", "SKY"],
    Y: ["YELLOW", "WHITE", "PINK", "SKY"],
    Z: ["PINK", "WHITE", "SKY"]
  };
  // 이름 글자는 자리 순서대로 이 순서를 돈다 — 그 글자에 없는 색 · 바로 앞 글자와 같은 색은 건너뛴다 (줄이 바뀌어도 이어서 돈다).
  // 흰색이 대략 세 칸에 하나 = 레퍼런스(assets/style_refs/2026-09-11_bubble-alphabet_names.png) 비율. 흔한 이름 102개 시뮬:
  // 흰 글자 56% → 38%, 옆 글자끼리 같은 색 185곳 → 0 (2026-09-17).
  var LETTER_PAINT_CYCLE_V2 = ["WHITE", "PINK", "YELLOW", "WHITE", "SKY", "PINK", "WHITE", "YELLOW", "SKY"];
  // 두들 27종 중 작은 데코로 쓰는 것 (시트마다 이름 자리부터). 뺀 것 — LOVE(<3)·LUCKY 는 글자뿐이라 작으면 안 읽히고,
  // SPARKLES·DOTS·BURSTPINK·BURSTGOLD·SWOOSH·ARROW 는 조각·긴 선이라 정사각 칸에서 너무 작아진다 (라이브러리에는 있다).
  // 글씨 말풍선은 작은 칸에 넣지 않고 DECO_BUBBLES_V2 로 따로 큰 자리에 넣는다 (2026-09-17).
  var DECO_ORDER_V2 = [
    "SMILE", "HEART", "DAISY", "CHERRY", "STAR", "BOW", "CLOVER",
    "SUN", "CLOUD", "FLOWER", "SPARKLE", "BOLT", "MINIHEART"
  ];
  var DECO_BUBBLES_V2 = ["YAY", "BESTDAY", "FOREVER", "YOUME", "MYFAVE", "XOXO"];
  // 흰 테두리(SIL)까지 포함한 비율 — build_bubble_style.jsx 가 다시 재서 비교한다.
  var DECO_BUBBLE_ASPECT_V2 = {
    YAY: 1.1945,
    BESTDAY: 1.1391,
    FOREVER: 1.1186,
    YOUME: 1.1190,
    MYFAVE: 1.3748,
    XOXO: 1.6276
  };
  // unitMm = 큰 이름 한 줄 높이. gap · lineGap · halo = 한 줄 높이 비율 (gap 음수 = 글자 틀이 살짝 겹침 → 테두리 선이 붙는다).
  // halo = 이름 전체 흰 테두리 (인쇄 + 칼선). rimBox = 칼선 여백만큼 이름 박스를 넓히고 데코·말풍선은 박스 안쪽으로 줄여 그린다 —
  // 나중에 칼선을 여백만큼 바깥으로 오프셋해도 이웃 사진 칼선과 간격이 남게 (retro 는 예전 배치를 지키려고 끈 채로 둔다).
  // 데코 박스 자체는 retro 와 같은 크기 (12.7 / 10mm) — 키웠더니 빈틈에 들어가는 데코가 평균 5.4 → 3.9개로 줄었다.
  // paints / paintCycle = 글자 색 돌리기 (없으면 라이브러리 원래 색 그대로 — retro).
  // bubbleOrder / bubbleAspect = 말풍선 모양 순서 · 그림 비율 (COMPOSED_BUBBLE_MAX 참고).
  var COMPOSED_NAME_STYLES = [
    { key: "retro", label: "레트로", whole: false, letterLib: LETTER_ART_LIB_NAME, decoLib: DECO_ART_LIB_NAME,
      metrics: LETTER_ART_METRICS, decoOrder: DECO_ORDER, bubbleOrder: DECO_BUBBLES_V1, bubbleAspect: DECO_BUBBLE_ASPECT_V1,
      unitMm: RANGE_HERO_UNIT_MM, gap: LETTER_GAP_RATIO, lineGap: LETTER_GAP_RATIO, halo: 0, rimBox: false, decoArt: null,
      paints: null, paintCycle: null },
    { key: "bubble", label: "버블", whole: true, letterLib: "alphabet_art_v2.ai", decoLib: "deco_art_v2.ai",
      metrics: LETTER_ART_METRICS_V2, decoOrder: DECO_ORDER_V2, bubbleOrder: DECO_BUBBLES_V2, bubbleAspect: DECO_BUBBLE_ASPECT_V2,
      unitMm: 13, gap: -0.03, lineGap: 0.1, halo: 0.08, rimBox: true, decoArt: COMPOSED_DECO_ART_V2_MM,
      paints: LETTER_ART_PAINTS_V2, paintCycle: LETTER_PAINT_CYCLE_V2 }
  ];
  var ART_LIB_DOCS = {};                   // 라이브러리 파일 이름 → 이번 실행에서 열어 둔 문서 (_closeArtLibs 가 닫는다)

  // ═════════════════════════════════════════════════════════
  //  MAIN FLOW  (var 상수는 전부 이 위에 — ExtendScript 는 함수만 호이스팅한다)
  // ═════════════════════════════════════════════════════════

  var testConfig = $.global.__EVERSTORY_RANGE_TEST__;

  // 주문 보드가 넣는 실행 인자. consume-once (mixed.jsx 와 같은 이유).
  var launchConfig = $.global.__EVERSTORY_LAUNCH__;
  $.global.__EVERSTORY_LAUNCH__ = undefined;

  var inputFolder;
  if (testConfig && testConfig.inputFolder) {
    inputFolder = new Folder(testConfig.inputFolder);
  } else if (launchConfig && launchConfig.inputFolder &&
             (new Folder(launchConfig.inputFolder)).exists) {
    inputFolder = new Folder(launchConfig.inputFolder);
  } else {
    inputFolder = Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  }
  if (!inputFolder) return;

  var pairs = _collectPairs(inputFolder);
  if (pairs.length === 0) {
    alert("선택한 폴더에 _clean.psd + _sil.png 페어가 없습니다.");
    return;
  }

  var options;
  if (testConfig && testConfig.options) {
    options = testConfig.options;
  } else if (launchConfig && launchConfig.composed) {
    // 주문 보드 미리보기의 "Illustrator 에서 만들기" — 대화창 없이 미리보기에서 고른 그대로 만든다.
    var launched = _composedLaunchOptions(launchConfig.composed, pairs);
    if (launched.error) {
      if (testConfig) { testConfig.lastMessage = launched.error; } else { alert(launched.error); }
      return;
    }
    options = launched.options;
  } else {
    options = _showDialog(pairs, _deriveDefaultCustomerName(inputFolder));
  }
  if (!options) return;

  // Composed(사진 6장 구성 시트) 는 흐름이 다르다 — **칼선을 배치보다 먼저** 준비한다.
  // 아래 Small/Large 경로(시트 계획·루프·메시지) 는 그대로 둔다.
  if (options.range === COMPOSED_KEY) {
    _runComposed(inputFolder, pairs, options, testConfig);
    return;
  }

  if (!RANGE_SIZES_MM[options.range]) {
    alert("알 수 없는 범위: " + options.range);
    return;
  }

  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    alert("template_cutout_v2.ait를 찾을 수 없습니다.");
    return;
  }

  var padXPt = BODY_PADDING_X_MM * MM_TO_PT;
  var padYPt = BODY_PADDING_Y_MM * MM_TO_PT;
  var gapPt = GAP_DEFAULT_MM * MM_TO_PT;
  var cutMarginPt = (options.cutMarginMm || 0) * MM_TO_PT;

  var layoutPairs = (options.selectedPairs && options.selectedPairs.length > 0) ?
    options.selectedPairs : pairs;
  if (!_isAllowedDesignCount(layoutPairs.length)) {
    alert("Small/Large 는 사진 1 · 4 · 8개만 받습니다 (지금 " + layoutPairs.length + "개). 사진을 자동으로 빼지 않습니다.");
    return;
  }
  for (var ma = 0; ma < layoutPairs.length; ma++) {
    try { _measurePairAspect(layoutPairs[ma]); }
    catch (eAsp) { layoutPairs[ma].aspect = 1; }
  }

  var sheetPlan = _rangeDeal(layoutPairs);
  var stamp = _timestamp();
  var sheetOutputs = [];
  var ctxError = null;

  for (var sIdx = 0; sIdx < sheetPlan.length; sIdx++) {
    var sctx = _openSheetContext(templateFile, padXPt, padYPt);
    if (sctx.error) { ctxError = sctx.error; break; }
    try {
      sheetOutputs.push(_produceRangeSheet(sctx, sheetPlan[sIdx], options, sIdx, sheetPlan.length,
        gapPt, cutMarginPt, inputFolder, stamp));
    } catch (eProduce) {
      ctxError = (eProduce && eProduce.message) ? eProduce.message : String(eProduce);
      // 배치 자체가 실패한 시트는 아무것도 안 그려졌으니 닫는다. 그리기 도중 실패는
      // _produceRangeSheet 가 failedItems 로 보고하고 문서를 남긴다.
      try { if (sctx.doc && !sctx.drawn) sctx.doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eCl) {}
      break;
    }
  }

  // ── 완료 메시지 ───────────────────────────────────────────────
  var msg = "완료: Range 시트 " + sheetOutputs.length + "/" + sheetPlan.length + "장 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + "\n" +
    "고객 이름: " + options.nameText + "\n" +
    "스티커 이름: " + (options.stickerName ? options.stickerName : "(없음 — 이름·데코 안 넣음)") + "\n" +
    "범위: " + RANGE_LABELS[options.range] + " = 면적 등급 " + _rangeAreaLabel(options.range) + " / 셀 = 칼선 포함 박스 / 최소 간격 " + GAP_DEFAULT_MM + "mm" +
    " / 사진별 최소 " + RANGE_MIN_PER_PHOTO + "개 · 개수 차이 ≤ " + RANGE_SPREAD_MAX +
    " / 칼선 여백 " + (options.cutMarginMm || 0) + "mm\n" +
    "입력: 페어 " + pairs.length + "개 중 " + layoutPairs.length + "개 사용 → " + sheetPlan.length + "시트\n";

  var allFailed = [];
  for (var so = 0; so < sheetOutputs.length; so++) {
    var s2 = sheetOutputs[so];
    var pr = s2.packResult;
    msg += "\n시트 " + (so + 1) + ": 생성 스티커 " + s2.drawnPlacements.length + "장 (계획 " + pr.placed.length + "장) · 디자인 " + s2.drawnDesigns + "개" +
      " · 배치 계획 box fill " + (pr.fill * 100).toFixed(1) + "%\n" +
      "    보장(계획): 사진별 최소 " + pr.minCount + "개 · 개수 차이 " + pr.spread + " (상한 " + (pr.rules ? pr.rules.spreadMax : RANGE_SPREAD_MAX) + ")" +
      (pr.coverageMissing ? "  ⚠ 두 등급을 다 못 넣은 사진×등급 " + pr.coverageMissing + "건" : " · 사진마다 두 등급") + "\n" +
      "    생성 크기: " + _rangeSizeSummary(s2.drawnPlacements) + "\n" +
      "    생성 사진별: " + _rangePhotoSummary(s2.drawnPlacements) + "\n" +
      "    탐색: " + pr.runs + "조합 / " + s2.packMs + "ms\n" +
      "    배치: 면적 등급 행 조판 " + _rangeAreaLabel(options.range) + " · 행 " + pr.rows.length + "개 (" + _rangeRowSummary(pr.rows) + ") · 양끝 맞춤" +
      (s2.band ? " · 이름 " + (Math.round(s2.band.heroH / MM_TO_PT * 10) / 10) + "mm 위 가운데" + (pr.flanks ? " · 이름 옆 세로 셀 " + pr.flanks + "장" : "") : "") +
      (pr.relaxed ? "  ⚠ 완화 규칙 (성긴 행 · 사진별 최소 " + RANGE_MIN_PER_PHOTO_RELAX + "장 · 차이 ≤ " + RANGE_SPREAD_MAX_RELAX + ") — 정상 규칙으로는 안 들어감, 셀이 시트에 비해 큼" : "") + "\n" +
      "    칼선 캐시 " + s2.cutCacheHits + "/" + s2.uniqueCount + " 히트 · 심볼 " + s2.symbolOk + "/" + s2.uniqueCount +
      (s2.cutFixCount > 0 ? " · 칼선 셀 초과 보정 " + s2.cutFixCount + "장" : "") + "\n";
    if (s2.nameSpec) {
      var nlines = [];
      for (var nl = 0; nl < s2.nameSpec.lines.length; nl++) nlines.push(s2.nameSpec.lines[nl].join(""));
      msg += "    이름 스티커: 아트 알파벳 — " + nlines.join(" / ") +
        " · 유닛 " + (Math.round(s2.nameSpec.unitMm * 10) / 10) + "mm · " +
        (Math.round(s2.nameSpec.cellW / MM_TO_PT * 10) / 10) + " × " + (Math.round(s2.nameSpec.cellH / MM_TO_PT * 10) / 10) + "mm" +
        (s2.nameInfo ? "" : "  ⚠ 그리기 실패 (제작 오류 참조)") + "\n";
    } else if (s2.nameSkipped) {
      msg += "    ⚠ 이름 스티커 없음: " + s2.nameSkipped + "\n";
    }
    if (s2.decoInfo) {
      msg += "    데코 스티커: " + s2.decoDrawn + "/" + s2.decoInfo.want + "개 (디자인 " + s2.decoInfo.designs + " + " + DECO_EXTRA + ") · 행 남는 폭에 · " +
        (Math.round(s2.decoInfo.sizeMm * 10) / 10) + "mm" +
        (s2.decoInfo.shortfall > 0 ? "  ⚠ " + s2.decoInfo.shortfall + "개 부족 (행에 자리 없음)" : "") + "\n";
    }
    if (s2.savedPath) msg += "    저장: " + s2.savedPath + "\n";
    else msg += "    ⚠ 저장 안 됨: " + s2.saveError + "\n";
    for (var fi = 0; fi < s2.failedItems.length; fi++) allFailed.push(s2.failedItems[fi]);
    if (s2.skippedPlacements > 0) msg += "    ⚠ trace 실패로 skip 된 placement: " + s2.skippedPlacements + "개\n";
  }
  if (ctxError) {
    msg += "\n⚠ 시트 " + (sheetOutputs.length + 1) + " 생성 중단 (이후 시트 미생성): " + ctxError + "\n";
  }
  if (allFailed.length > 0) {
    var seenFail = {};
    msg += "\n제작 오류 (해당 시트는 자동 저장하지 않음 — 원인을 확인한 뒤 다시 생성):";
    for (var fk = 0; fk < allFailed.length; fk++) {
      var failKey = "$" + allFailed[fk].base + ":" + allFailed[fk].error;
      if (seenFail[failKey]) continue;
      seenFail[failKey] = true;
      msg += "\n- " + allFailed[fk].base + ": " + allFailed[fk].error;
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
  //  RANGE 배치 엔진 — 순수 ES3, Adobe API 호출 없음
  //  좌표계: 원점 = body 좌상단, y 는 아래로 증가 (mixed.jsx 셀 좌표와 동일).
  //  간격 처리: bin 을 (W+gap)×(H+gap), 아이템을 (w+gap)×(h+gap) 로 확장해 계산한다.
  //  그러면 이웃끼리는 정확히 gap 만큼 떨어지고 외곽에는 여백을 요구하지 않는다.
  // ═════════════════════════════════════════════════════════

  function _isAllowedDesignCount(n) {
    for (var i = 0; i < RANGE_DESIGN_COUNTS.length; i++) if (RANGE_DESIGN_COUNTS[i] === n) return true;
    return false;
  }

  // 1·4 → 1시트, 8 → 2시트 (listbox 순서대로 앞 4장 / 뒤 4장).
  // ══ 엔진 — Everstory_mixed.jsx 2026-09-12 판에서 복사 (이름 아트 알파벳 · 데코) ═══════
  // 2026-09-17: 이름 스타일(COMPOSED_NAME_STYLES)을 받는다 — retro 는 복사 당시 계산 그대로, bubble 은 통짜 분기.

  // 이름 스타일 표 — 키가 비었으면 첫 번째(retro). 모르는 키면 null (호출부가 막는다).
  function _nameStyle(key) {
    if (key === undefined || key === null || key === "") return COMPOSED_NAME_STYLES[0];
    for (var i = 0; i < COMPOSED_NAME_STYLES.length; i++) {
      if (COMPOSED_NAME_STYLES[i].key === String(key)) return COMPOSED_NAME_STYLES[i];
    }
    return null;
  }

  function _letterBlockSpec(nameText, unitMm, tag, styleKey) {
    if (!nameText) return null;
    var style = _nameStyle(styleKey);
    if (!style) throw new Error("알 수 없는 이름 스타일: " + styleKey);
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
    // 아트 알파벳은 **대문자 A–Z 뿐**이다. 전부 라틴 문자면 대문자로 올려 아트로 가고,
    // 한 글자라도 아니면 (한글·숫자·하이픈·아포스트로피) **블록 전체**가 폰트+프레임
    // 모드로 간다. 한 이름 안에서 섞으면 스타일이 갈려 깨져 보인다.
    // 폴백 사실은 _drawLetterBlock 이 완료 메시지로 보고한다 — 조용히 바뀌지 않는다.
    var isArt = true;
    for (var ai = 0; ai < all.length; ai++) {
      if (!LETTER_ART_RE.test(all[ai])) { isArt = false; break; }
    }
    if (isArt) {
      for (var lu = 0; lu < lines.length; lu++) {
        for (var cu = 0; cu < lines[lu].length; cu++) {
          lines[lu][cu] = lines[lu][cu].toUpperCase();
        }
      }
      for (var au = 0; au < all.length; au++) all[au] = all[au].toUpperCase();
    }
    var maxLen = 0;
    for (var li = 0; li < lines.length; li++) {
      if (lines[li].length > maxLen) maxLen = lines[li].length;
    }
    var spec = {
      base: "__NAME_" + tag + "__",
      isLetterBlock: true,
      lines: lines,      // 단어별 글자 배열 — 그리기·치수 계산의 기준
      chars: all,        // 전체 글자 (조각 수·글리프 보고용)
      maxLen: maxLen,    // 가장 긴 줄의 글자 수 = 폰트 모드의 블록 폭을 정한다
      isArt: isArt,      // true = 스타일의 아트 알파벳 라이브러리에서 꺼내 그린다
      nameStyle: style.key,
      whole: !!(style.whole && isArt),   // true = 이름 전체를 흰 테두리 하나로 (칼선 1개)
      aspect: 1
    };
    return _letterBlockResize(spec, unitMm);
  }

  // 글자 틀 치수. retro 는 표 그대로({aw, cap, bl, …}), bubble 은 자리에 맞는 틀({aw, bl, fh}) — 줄 맨 앞은 L, 맨 끝은 R.
  function _artLetterMetric(style, ch, first, last) {
    var t = style.metrics[ch];
    if (!t) return null;
    if (!style.whole) return t;
    return t[_artLetterVariant(t, first, last)];
  }

  // 한 글자 줄은 가진 쪽 장식을 쓴다 (L 과 R 을 둘 다 가진 글자는 지금 없다 — 생기면 L 만 쓴다).
  function _artLetterVariant(t, first, last) {
    if (first && t.L) return "L";
    if (last && t.R) return "R";
    return "core";
  }

  // bubble 폭 계수 — retro(_letterArtWCoef 아래 본문)와 같은 뜻: 블록 폭 = unit × 계수, cap = unit / artHCoef.
  // 틀 높이가 capPt × fh 라 줄 위·아래로 나가는 양도 fh 를 곱해 잰다.
  function _letterArtWCoefWhole(spec, style) {
    var i, j, m, line, sum, coef, above = 0, below = 0, best = 0;
    for (i = 0; i < spec.lines.length; i++) {
      line = spec.lines[i];
      for (j = 0; j < line.length; j++) {
        m = _artLetterMetric(style, line[j], j === 0, j === line.length - 1);
        if (!m) return null;
        if (m.bl * m.fh > above) above = m.bl * m.fh;
        if ((1 - m.bl) * m.fh > below) below = (1 - m.bl) * m.fh;
      }
    }
    var hCoef = above + below;
    if (hCoef <= 0) return null;
    for (i = 0; i < spec.lines.length; i++) {
      line = spec.lines[i];
      sum = 0;
      for (j = 0; j < line.length; j++) {
        m = _artLetterMetric(style, line[j], j === 0, j === line.length - 1);
        sum += m.aw * m.fh;
      }
      coef = sum / hCoef + (line.length - 1) * style.gap;
      if (coef > best) best = coef;
    }
    spec.artHCoef = hCoef;
    spec.artAboveCoef = above;
    spec.artWCoef = best;
    return best;
  }

  function _letterArtWCoef(spec) {
    if (typeof spec.artWCoef === "number") return spec.artWCoef;
    if (spec.whole) return _letterArtWCoefWhole(spec, _nameStyle(spec.nameStyle));
    var i, j, m;
    var above = 0, below = 0;
    for (i = 0; i < spec.chars.length; i++) {
      m = LETTER_ART_METRICS[spec.chars[i]];
      if (!m) return null;      // 아트에 없는 글자 — 호출부가 폰트 모드로 돌아간다
      var a = m.bl / m.cap;
      var b = (1 - m.bl) / m.cap;
      if (a > above) above = a;
      if (b > below) below = b;
    }
    var hCoef = above + below;
    if (hCoef <= 0) return null;
    var best = 0;
    for (i = 0; i < spec.lines.length; i++) {
      var sum = 0;
      for (j = 0; j < spec.lines[i].length; j++) {
        m = LETTER_ART_METRICS[spec.lines[i][j]];
        sum += m.aw / m.cap;
      }
      var coef = sum / hCoef + (spec.lines[i].length - 1) * LETTER_GAP_RATIO;
      if (coef > best) best = coef;
    }
    spec.artHCoef = hCoef;
    spec.artAboveCoef = above;   // baseline 깊이 = capPt × 이 값 (행 위에서부터)
    spec.artWCoef = best;
    return best;
  }

  function _letterBlockResize(spec, unitMm) {
    var unit = unitMm * MM_TO_PT;
    var style = spec.whole ? _nameStyle(spec.nameStyle) : null;
    var gap = unit * (style ? style.gap : LETTER_GAP_RATIO);
    spec.unitMm = unitMm;
    spec.unit = unit;
    spec.innerGap = gap;
    spec.lineGap = style ? unit * style.lineGap : gap;   // 줄 사이 (retro 는 글자 간격과 같다)
    spec.halo = style ? unit * style.halo : 0;          // 통짜 흰 테두리 두께 (블록 치수에 들어 있다)
    var artCoef = null;
    if (spec.isArt) artCoef = _letterArtWCoef(spec);
    if (artCoef !== null) {
      // 아트는 글자마다 폭이 다르다 (I 0.59 ~ M 0.94 fh). 정사각 유닛으로 잡으면
      // I 에도 M 폭을 줘서 블록이 20퍼센트쯤 헛되이 넓어진다 (HARIN 60.8 → 46.4mm).
      spec.capPt = unit / spec.artHCoef;          // 목표 cap height
      spec.baselinePt = spec.capPt * spec.artAboveCoef;  // 행 위 → baseline 깊이
      spec.cellW = style ? unit * artCoef + 2 * spec.halo : unit * artCoef;
    } else {
      spec.cellW = spec.maxLen * unit + (spec.maxLen - 1) * gap;
    }
    // 높이는 두 모드가 같다 — 아트도 가장 불리한 글자의 프레임이 딱 unit 이다.
    if (style) spec.cellH = spec.lines.length * unit + (spec.lines.length - 1) * spec.lineGap + 2 * spec.halo;
    else spec.cellH = spec.lines.length * unit + (spec.lines.length - 1) * gap;
    return spec;
  }

  function _letterUnitToFit(block, wPt) {
    var denom = null;
    if (block.isArt) denom = _letterArtWCoef(block);
    if (denom !== null && block.whole) denom += 2 * _nameStyle(block.nameStyle).halo;   // 흰 테두리도 unit 에 비례
    if (denom === null) {
      var n = block.maxLen;
      denom = n + (n - 1) * LETTER_GAP_RATIO;
    }
    if (denom <= 0) return LETTER_UNIT_MM;
    return (wPt / denom) / MM_TO_PT;
  }

  function _artLibFile(name) {
    var scriptDir = (new File($.fileName)).parent;
    var cands = [
      scriptDir.fsName + "/templates/" + name,
      scriptDir.parent.fsName + "/templates/" + name
    ];
    for (var i = 0; i < cands.length; i++) {
      var c = new File(cands[i]);
      if (c.exists) return c;
    }
    return null;
  }

  function _openArtLibDoc(f) {
    var prev = null;
    try { prev = app.activeDocument; } catch (eNo) {}
    var doc = app.open(f);
    if (prev) { try { app.activeDocument = prev; } catch (eAct) {} }
    return doc;
  }

  // 아트 라이브러리 문서 (이번 실행에서 한 번만 연다). what = 오류 문구용 이름.
  function _artLibDoc(fileName, what) {
    var d = ART_LIB_DOCS["$" + fileName];
    if (d) {
      // 운영자가 손으로 닫았을 수 있다 — 건드려 보고 죽었으면 다시 연다.
      try { var probe = d.name; return d; }
      catch (eDead) { d = null; }
    }
    var f = _artLibFile(fileName);
    if (!f) {
      throw new Error(what + " 라이브러리가 없습니다 — templates/" + fileName +
        " (그룹 이름은 'LTR A' · 'DECO HEART' 처럼, 밑줄 아님)");
    }
    d = _openArtLibDoc(f);
    ART_LIB_DOCS["$" + fileName] = d;
    return d;
  }

  // 열어 둔 라이브러리를 모두 닫는다 — 시트마다 finally 에서 부른다 (예외가 나도 열린 채 남기지 않는다).
  function _closeArtLibs() {
    for (var k in ART_LIB_DOCS) {
      if (!ART_LIB_DOCS.hasOwnProperty(k) || !ART_LIB_DOCS[k]) continue;
      try { ART_LIB_DOCS[k].close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
      ART_LIB_DOCS[k] = null;
    }
  }

  // payload = { deco, style (없으면 retro), pad (pt — bubble 은 칼선 여백만큼 박스 안쪽에 그린다) }
  function _drawDecoSticker(sheetDoc, payload, x, y, w, h, printL, kissL, cutSpot) {
    var style = _nameStyle(payload.style);
    if (!style) throw new Error("알 수 없는 이름 스타일: " + payload.style);
    var lib = _artLibDoc(style.decoLib, "데코");
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;
    var src;
    try { src = lib.groupItems.getByName("DECO " + payload.deco); }
    catch (eN) {
      throw new Error("데코 '" + payload.deco + "' 가 라이브러리에 없습니다 (" + style.decoLib + " · DECO " +
        payload.deco + ")");
    }
    var pad = (payload.pad > 0) ? payload.pad : 0;
    var dup = src.duplicate(printL, ElementPlacement.PLACEATEND);
    var gb = dup.geometricBounds;
    var sw = gb[2] - gb[0], sh = gb[1] - gb[3];
    if (sw > 0 && sh > 0) {
      var s = (w - 2 * pad) / sw;
      if ((h - 2 * pad) / sh < s) s = (h - 2 * pad) / sh;
      dup.resize(s * 100, s * 100);
    }
    gb = dup.geometricBounds;     // resize 후 반드시 다시 읽는다
    var cw = gb[2] - gb[0], chh = gb[1] - gb[3];
    dup.translate(x + (w - cw) / 2 - gb[0], y - (h - chh) / 2 - gb[1]);
    try { dup.name = "Deco_" + payload.deco; } catch (eNm) {}
    var outline = _artOutlinePath(dup);
    if (!outline) {
      throw new Error("데코 '" + payload.deco + "' 의 칼선을 못 만들었습니다 — " +
        "라이브러리에 바깥 실루엣 도형 1개가 있어야 합니다");
    }
    var cut = _artCutOuterOnly(outline.duplicate(kissL, ElementPlacement.PLACEATEND));
    try { cut.name = "Cutline_" + payload.deco; } catch (eCn) {}
    _forceCutContourStroke(cut, cutSpot);
    return dup;
  }

  function _artShapeCandidates(item, out) {
    if (!item) return;
    try {
      if (item.typename === "PathItem" || item.typename === "CompoundPathItem") {
        out.push(item);
        return;
      }
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) _artShapeCandidates(item.pageItems[i], out);
      }
    } catch (e) {}
  }

  function _artOutlinePath(group) {
    var shapes = [];
    _artShapeCandidates(group, shapes);
    var best = null, bestA = -1;
    for (var i = 0; i < shapes.length; i++) {
      var b;
      try { b = shapes[i].geometricBounds; } catch (eB) { continue; }
      var a = (b[2] - b[0]) * (b[1] - b[3]);
      if (a > bestA) { bestA = a; best = shapes[i]; }
    }
    return best;
  }

  // 칼선 복제본에서 구멍 윤곽을 지운다 — 가장 큰 하위 패스와 감긴 방향이 반대인 것 (_drawNameHalo 와 같은 규칙).
  // 레트로 데코 HEART · CUPCAKE · BONE · CAMERA · RAINBOW · FLOWER 는 가장 큰 도형이 검정 테두리 고리(바깥선 + 라이브러리 약 6pt,
  // 시트 약 0.2mm 안쪽 선)라 그대로 쓰면 칼선이 두 줄이 된다 (2026-09-17 실제 시트에서 확인). 같은 방향의 섬은 남긴다.
  function _artCutOuterOnly(cut) {
    if (cut.typename !== "CompoundPathItem" || cut.pathItems.length < 2) return cut;
    var big = null, sign, i;
    for (i = 0; i < cut.pathItems.length; i++) {
      if (!big || Math.abs(cut.pathItems[i].area) > Math.abs(big.area)) big = cut.pathItems[i];
    }
    sign = big.area >= 0 ? 1 : -1;
    for (i = cut.pathItems.length - 1; i >= 0; i--) {
      if ((cut.pathItems[i].area >= 0 ? 1 : -1) !== sign) cut.pathItems[i].remove();
    }
    return cut;
  }

  // 이름 블록 안 글자 자리 — 그리기와 주문 보드 미리보기 공용 (순수 계산).
  // pt, 블록 좌상단 원점, y 아래로. [{ ch, variant, paint, group, line, x, y, w, h, missing }] — w×h 가 글자 틀 (라이브러리 그룹 geometricBounds).
  // variant: bubble 은 "core" | "L" | "R" (옆 장식), retro 는 "". paint = 바꿔 칠한 색 (라이브러리 원래 색이면 "", retro 는 늘 ""),
  // group = 꺼낼 라이브러리 그룹 ('LTR A' · 'LTR A PINK'). 표에 없는 글자는 missing (자리를 차지하지 않는다).
  // 줄마다 폭을 먼저 재서 가운데 정렬하고, 모든 글자가 그 줄의 baseline(블록 위에서 baselinePt 아래)에 선다.
  function _artLetterBoxes(block) {
    var style = block.whole ? _nameStyle(block.nameStyle) : null;
    var halo = block.halo ? block.halo : 0, out = [], ln, ci, line, lineW, m, fh, cur, baseY, first, last;
    var paintPtr = 0, prevPaint, pick, paint;
    var lineStep = block.unit + (style ? block.lineGap : block.innerGap);
    for (ln = 0; ln < block.lines.length; ln++) {
      line = block.lines[ln];
      prevPaint = null;
      lineW = (line.length - 1) * block.innerGap;
      for (ci = 0; ci < line.length; ci++) {
        if (style) {
          m = _artLetterMetric(style, line[ci], ci === 0, ci === line.length - 1);
          if (m) lineW += m.aw * block.capPt * m.fh;
        } else {
          m = LETTER_ART_METRICS[line[ci]];
          if (m) lineW += m.aw * block.capPt / m.cap;
        }
      }
      cur = style ? halo + (block.cellW - 2 * halo - lineW) / 2 : (block.cellW - lineW) / 2;
      baseY = style ? halo + ln * lineStep + block.baselinePt : ln * lineStep + block.baselinePt;
      for (ci = 0; ci < line.length; ci++) {
        first = ci === 0;
        last = ci === line.length - 1;
        m = style ? _artLetterMetric(style, line[ci], first, last) : LETTER_ART_METRICS[line[ci]];
        if (!m) {
          // 라이브러리에 글자가 없다 — 그리기가 missingGlyphs 로 보고한다 (조용히 건너뛰면 이름에 구멍이 난다).
          out.push({ ch: line[ci], variant: "", paint: "", group: "", line: ln, x: cur, y: baseY, w: 0, h: 0, missing: true });
          continue;
        }
        fh = style ? block.capPt * m.fh : block.capPt / m.cap;
        paint = "";
        if (style && style.paints) {
          pick = _artLetterPaint(style, line[ci], prevPaint, paintPtr);
          if (pick) {
            paintPtr = pick.next;
            prevPaint = pick.paint;
            if (pick.paint !== style.paints[line[ci]][0]) paint = pick.paint;
          }
        }
        out.push({ ch: line[ci], variant: style ? _artLetterVariant(style.metrics[line[ci]], first, last) : "",
                   paint: paint, group: "LTR " + line[ci] + (paint ? " " + paint : ""),
                   line: ln, x: cur, y: baseY - m.bl * fh, w: m.aw * fh, h: fh, missing: false });
        cur += m.aw * fh + block.innerGap;
      }
    }
    return out;
  }

  // 글자 색 — 돌림 순서(style.paintCycle)의 ptr 자리부터 보며, 그 글자가 가진 색(style.paints) 중 앞 글자 색(prev)과 다른 첫 색.
  // 반환 { paint, next } (next = 다음 글자가 볼 자리). 표에 없는 글자면 null (라이브러리 원래 색으로 그린다).
  function _artLetterPaint(style, ch, prev, ptr) {
    var can = style.paints[ch], cyc = style.paintCycle, k, j, c;
    if (!can || !can.length || !cyc || !cyc.length) return null;
    for (k = 0; k < cyc.length; k++) {
      c = cyc[(ptr + k) % cyc.length];
      if (c === prev) continue;
      for (j = 0; j < can.length; j++) {
        if (can[j] === c) return { paint: c, next: (ptr + k + 1) % cyc.length };
      }
    }
    return { paint: can[0], next: ptr };
  }

  // 라이브러리 글자 복제본에서 이 자리에 안 쓰는 옆 장식(SIDE L / SIDE R)을 뺀다 — 남은 그룹 경계 = 치수표의 틀.
  function _artKeepSides(group, variant) {
    for (var i = group.groupItems.length - 1; i >= 0; i--) {
      var g = group.groupItems[i];
      if ((g.name === "SIDE L" && variant !== "L") || (g.name === "SIDE R" && variant !== "R")) g.remove();
    }
  }

  // 이름이 "SIL" 인 도형 (글자 + 안쪽 장식의 바깥 윤곽 · 옆 장식 묶음 안에도 하나) 을 모은다.
  function _artSilhouettes(item, out) {
    if (!item) return;
    try {
      if (item.name === "SIL" && (item.typename === "PathItem" || item.typename === "CompoundPathItem")) {
        out.push(item);
        return;
      }
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) _artSilhouettes(item.pageItems[i], out);
      }
    } catch (e) {}
  }

  // 도형을 dest 그룹에 단색으로 복사 (컴파운드는 하위 패스를 풀어서) — Pathfinder 는 칠 없는 패스에서 빈 결과를 낸다.
  function _artCopySolid(item, dest) {
    var black = new RGBColor(), i, d;
    black.red = 0; black.green = 0; black.blue = 0;
    if (item.typename === "PathItem") {
      d = item.duplicate(dest, ElementPlacement.PLACEATEND);
      d.stroked = false; d.filled = true; d.fillColor = black;
    } else if (item.typename === "CompoundPathItem") {
      for (i = 0; i < item.pathItems.length; i++) {
        d = item.pathItems[i].duplicate(dest, ElementPlacement.PLACEATEND);
        d.stroked = false; d.filled = true; d.fillColor = black;
      }
    } else if (item.typename === "GroupItem") {
      for (i = 0; i < item.pageItems.length; i++) _artCopySolid(item.pageItems[i], dest);
    }
  }

  function _artGatherPaths(item, out) {
    if (!item) return;
    if (item.typename === "PathItem") out.push(item);
    else if (item.typename === "CompoundPathItem") { for (var j = 0; j < item.pathItems.length; j++) out.push(item.pathItems[j]); }
    else if (item.typename === "GroupItem") { for (var i = 0; i < item.pageItems.length; i++) _artGatherPaths(item.pageItems[i], out); }
  }

  // 버블 이름 흰 테두리 = 글자 실루엣(SIL)을 haloPt 만큼 부풀려 합친 바깥 윤곽. 인쇄(흰색, 글자 아래)와 칼선이 **같은 도형**이라
  // 정합 오차가 없다. Offset Path 라이브 이펙트(jntp 0 = 라운드) → 확장 → 단색 복사 → Pathfinder 더하기 → 구멍 버림
  // (Everstory_calligraphy.jsx _offsetShape 와 같은 방식 — 굵은 획 + expandStyle 은 여백이 사라진다). 반환 { shape, cut, pieces }.
  function _drawNameHalo(sheetDoc, dups, haloPt, printL, kissL, cutSpot) {
    var sils = [], i, sel, expanded, united, paths, big, sign, outer, shape, white;
    for (i = 0; i < dups.length; i++) _artSilhouettes(dups[i], sils);
    if (!sils.length) throw new Error("버블 글자에 SIL(바깥 윤곽) 도형이 없습니다 — 라이브러리 구조가 바뀌었는지 확인");
    var src = printL.groupItems.add();
    for (i = 0; i < sils.length; i++) _artCopySolid(sils[i], src);
    src.applyEffect('<LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst ' + haloPt + ' I jntp 0 "/></LiveEffect>');
    sheetDoc.selection = null;
    src.selected = true;
    app.executeMenuCommand("expandStyle");
    sel = sheetDoc.selection;
    if (!sel || sel.length === 0) throw new Error("흰 테두리 확장 실패 (Offset Path)");
    expanded = sel[0];
    sheetDoc.selection = null;
    var solid = printL.groupItems.add();
    _artCopySolid(expanded, solid);
    try { expanded.remove(); } catch (eEx) {}
    solid.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");
    sel = sheetDoc.selection;
    if (!sel || sel.length === 0) throw new Error("흰 테두리 합치기 실패 (Pathfinder)");
    united = sel[0];
    sheetDoc.selection = null;
    paths = [];
    _artGatherPaths(united, paths);
    big = null;
    for (i = 0; i < paths.length; i++) if (!big || Math.abs(paths[i].area) > Math.abs(big.area)) big = paths[i];
    if (!big) throw new Error("흰 테두리 결과가 비었습니다");
    // 구멍(감긴 방향이 가장 큰 윤곽과 반대)은 버린다 — 칼선은 바깥만 딴다.
    sign = big.area >= 0 ? 1 : -1;
    outer = [];
    for (i = 0; i < paths.length; i++) {
      if ((paths[i].area >= 0 ? 1 : -1) === sign) outer.push(paths[i].duplicate(printL, ElementPlacement.PLACEATEND));
    }
    try { united.remove(); } catch (eUn) {}
    if (outer.length === 1) {
      shape = outer[0];
    } else {
      for (i = 0; i < outer.length; i++) outer[i].selected = true;
      app.executeMenuCommand("compoundPath");
      shape = sheetDoc.selection[0];
      sheetDoc.selection = null;
    }
    white = new RGBColor();
    white.red = 255; white.green = 255; white.blue = 255;
    if (shape.typename === "CompoundPathItem") {
      for (i = 0; i < shape.pathItems.length; i++) {
        shape.pathItems[i].stroked = false; shape.pathItems[i].filled = true; shape.pathItems[i].fillColor = white;
      }
    } else {
      shape.stroked = false; shape.filled = true; shape.fillColor = white;
    }
    shape.move(printL, ElementPlacement.PLACEATEND);   // 맨 아래 = 글자 밑
    try { shape.name = "NameHalo"; } catch (eNm) {}
    var cut = shape.duplicate(kissL, ElementPlacement.PLACEATEND);
    try { cut.name = "Cutline_name"; } catch (eCn) {}
    _forceCutContourStroke(cut, cutSpot);
    return { shape: shape, cut: cut, pieces: outer.length };
  }

  // 이름 블록 그리기. (x, y) = 블록 좌상단 (Illustrator 좌표, y 위로).
  // retro = 글자마다 칼선 (바깥 실루엣 복제, 여백 0 — 오프셋은 나중에 수동).
  // bubble = 글자는 칼선 없이 그리고, 이름 전체 흰 테두리(_drawNameHalo) 하나가 칼선.
  function _drawArtLetterBlock(sheetDoc, block, x, y, printL, kissL, cutSpot) {
    var style = _nameStyle(block.nameStyle);
    if (!style) throw new Error("알 수 없는 이름 스타일: " + block.nameStyle);
    var lib = _artLibDoc(style.letterLib, "아트 알파벳");
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;
    sheetDoc.selection = null;
    var boxes = _artLetterBoxes(block), missing = [], noCut = [], dups = [], halo = null, i, b, src, dup, gb, s;
    for (i = 0; i < boxes.length; i++) {
      b = boxes[i];
      src = null;
      if (!b.missing) {
        try { src = lib.groupItems.getByName(b.group); } catch (eName) { src = null; }
      }
      if (!src) {
        // 라이브러리에 글자(또는 그 색 그룹)가 없다 — 조용히 건너뛰면 이름에 구멍이 난다.
        // 색 그룹이 없으면 라이브러리가 색 돌리기 전 것이다 → scripts/art_library 로 다시 만든다.
        missing.push(b.paint ? b.group : b.ch);
        continue;
      }
      dup = src.duplicate(printL, ElementPlacement.PLACEATEND);
      if (block.whole) _artKeepSides(dup, b.variant);
      gb = dup.geometricBounds;
      if (gb[1] - gb[3] > 0) {
        s = (b.h / (gb[1] - gb[3])) * 100;
        dup.resize(s, s);
      }
      // resize 후 bounds 는 **다시 읽어야 한다** — 앵커가 문서 기준이라 위치가 같이 변한다.
      gb = dup.geometricBounds;
      dup.translate((x + b.x) - gb[0], (y - b.y) - gb[1]);
      try { dup.name = "Letter_" + b.ch + "_" + _pad2(i); } catch (eL) {}
      dups.push(dup);
      if (block.whole) continue;
      // 칼선 — 인쇄 실루엣과 같은 기하를 KissCut 에 복제한다 (여백 0, 오프셋은 나중에 수동).
      var outline = _artOutlinePath(dup);
      if (outline) {
        var cut = _artCutOuterOnly(outline.duplicate(kissL, ElementPlacement.PLACEATEND));
        try { cut.name = "Cutline_" + b.ch + "_" + _pad2(i); } catch (eC) {}
        _forceCutContourStroke(cut, cutSpot);
      } else {
        noCut.push(b.ch);
      }
    }
    // **칼선 없는 이름은 절대 조용히 넘기지 않는다.** 인쇄는 멀쩡한데 안 잘리는 시트가
    // 나가면 실물을 보기 전엔 모른다. 글자는 다 그려 놓고(눈으로 확인 가능) 여기서 터뜨린다.
    if (block.whole && dups.length > 0) halo = _drawNameHalo(sheetDoc, dups, block.halo, printL, kissL, cutSpot);
    sheetDoc.selection = null;
    try { $.gc(); } catch (eGc) {}
    if (noCut.length > 0) {
      throw new Error("아트 글자 " + noCut.join(",") + " 의 칼선을 못 만들었습니다 — " +
        "라이브러리 글자 구조가 바뀌었는지 확인 (바깥 실루엣 도형 1개가 있어야 함)");
    }
    return {
      count: block.chars.length,
      pieces: halo ? halo.pieces : block.chars.length,
      piecesAreLetters: !block.whole,
      missingGlyphs: missing,
      style: style.key,
      // 아트는 글자 속구멍이 아니라 그림 디테일(체커보드·줄무늬)이 최소 도형이라
      // _minCounterPt 를 태우면 0.35mm 위험선에 늘 걸린다 — 의미 없는 경고라 안 잰다.
      minCounterPt: null
    };
  }

  // ══ 이름 스펙 — Range 전용 (2026-09-12) ═══════════════════════════
  //   · 큰 레터 이름은 엔진(v3)이 위 가운데에 놓고 양옆 세로 셀·데코 자리까지 함께 짠다.
  //   · 아트는 대문자 A–Z 뿐 — 한글·숫자 이름은 이름 스티커를 건너뛰고 보고한다 (그 시트는 데코도 없다).
  function _rangeNameSpec(stickerName, binW, gapPt, styleKey) {
    if (!stickerName) return null;
    var spec = _letterBlockSpec(stickerName, LETTER_UNIT_MM, "ALPHA", styleKey);
    if (!spec) return null;
    if (!spec.isArt) {
      // 이 파일엔 폰트+프레임 엔진이 없다 — 한글·숫자 이름은 이름 스티커를 건너뛰고 보고한다.
      return { skipped: "아트 알파벳은 대문자 A-Z 뿐 — \"" + stickerName + "\" 은 이름·데코 없이 사진만" };
    }
    if (spec.cellW > binW) {
      var fitMm = _letterUnitToFit(spec, binW);
      if (fitMm < LETTER_UNIT_MIN_MM) {
        return { skipped: "이름이 너무 길어 " + LETTER_UNIT_MIN_MM + "mm 유닛으로도 폭 " +
          Math.round(binW / MM_TO_PT) + "mm 에 안 들어감 — 이름·데코 없이 사진만" };
      }
      _letterBlockResize(spec, fitMm);
    }
    spec.isAlphabetBlock = true;
    return spec;
  }

  // 1 · 4~6 → 1시트. 넘치면 시트 수를 올리고 **균등 분할** (8 → 4+4, 7 → 4+3). 앞에서부터 순서대로.
  function _rangeDeal(pairsArg) {
    var sheets = [], n = pairsArg.length;
    var count = Math.ceil(n / RANGE_PER_SHEET), per = Math.ceil(n / count), i = 0;
    while (i < n) {
      var chunk = [];
      for (var j = 0; j < per && i < n; j++, i++) chunk.push(pairsArg[i]);
      sheets.push(chunk);
    }
    return sheets;
  }

  // 큰 레터 이름 스펙 — 아트 알파벳 유닛(retro 16mm · 스타일 표 unitMm), 폭 상한 안으로 유닛을 낮춘다. null = 이름 없음/아트 불가.
  function _rangeHeroSpec(stickerName, maxWPt, styleKey) {
    var style = _nameStyle(styleKey);
    if (!style) throw new Error("알 수 없는 이름 스타일: " + styleKey);
    var spec = _letterBlockSpec(stickerName, style.unitMm, "ALPHA_HERO", styleKey);
    if (!spec || !spec.isArt) return null;
    if (spec.cellW > maxWPt) {
      var fitMm = _letterUnitToFit(spec, maxWPt);
      if (fitMm < LETTER_UNIT_MIN_MM) return null;
      _letterBlockResize(spec, fitMm);
    }
    spec.isAlphabetBlock = true;
    return spec;
  }

  function _rangeMinCount(counts) {
    var lo = counts[0];
    for (var i = 1; i < counts.length; i++) if (counts[i] < lo) lo = counts[i];
    return lo;
  }

  function _rangeSpread(counts) {
    var lo = counts[0], hi = counts[0];
    for (var i = 1; i < counts.length; i++) {
      if (counts[i] < lo) lo = counts[i];
      if (counts[i] > hi) hi = counts[i];
    }
    return hi - lo;
  }

  // ═════════════════════════════════════════════════════════
  //  RANGE 배치 엔진 v3 — "같은 면적" 행 조판 (2026-09-13, 사용자 결정)
  //  · 크기 = 면적 등급. "1″" 은 1×1인치만큼의 면적(645mm²)이고, 셀은 사진 비율대로 w = √(A·a), h = √(A/a).
  //    최장변은 RANGE_LONG_CAP_MM 에서 자른다(전신 사진). 정사각 사진은 예전과 같은 25.4/31.75mm 가 된다.
  //  · 보장: 사진마다 두 등급 각 1장 이상(가능하면 — 못 넣으면 coverageMissing 으로 보고), 사진별 최소 RANGE_MIN_PER_PHOTO,
  //    개수 차이 ≤ RANGE_SPREAD_MAX.
  //  · 행 = 높이가 비슷한 셀끼리(등급별로 시작, 이상치는 가까운 군으로), 아랫선 정렬, **양끝 맞춤**(남는 폭을 간격에 균등 분배).
  //    행은 최소 RANGE_ROW_FILL_MIN 만큼 차야 한다 — 그보다 성기면 그 조합은 버린다. 열 정렬·칸 비우기는 없다.
  //  · 이름(큰 레터, 위 가운데) 양옆: 이름 중간 높이까지 올라오는 세로 셀이 있으면 양쪽에 세우고(flank), 이름 아래 홈에 한 행을 넣는다.
  //  · 데코(RANGE_DECO_SIZE_MM)는 행에 자리를 예약해 넣는다 — 칸을 비우지 않는다. 행마다 최대 2개, 양끝·가운데를 번갈아.
  //  · 탐색 = (flank 여부) × (위 군 행 수) × (아래 군 행 수) × (데코 분배 5종) 을 전부 만들어 비교. 결정적, 수백 조합.
  //  좌표 = body 좌상단 원점, y 아래로, 단위 pt. 순수 ES3, Adobe API 없음. Node 검증 sim/range_layout_test.js.
  // ═════════════════════════════════════════════════════════

  // 면적 등급 sideMm 의 셀 (mm). 비율 a = w/h. 최장변이 capMm 를 넘으면 그 변을 cap 에 맞추고 면적은 줄어든다.
  function _rangeCell(aspect, sideMm, capMm) {
    if (!(aspect > 0) || !isFinite(aspect)) aspect = 1;
    var w = sideMm * Math.sqrt(aspect), h = sideMm / Math.sqrt(aspect);
    if (h > capMm) { h = capMm; w = capMm * aspect; }
    if (w > capMm) { w = capMm; h = capMm / aspect; }
    return { w: w, h: h };
  }

  // 타입 = 디자인 × 등급 (pt). typeIndex = d * 등급수 + c — 검증·감사가 같은 식을 쓴다.
  function _rangeTypes(pairsArg, sizes, capMm) {
    var types = [];
    for (var d = 0; d < pairsArg.length; d++) {
      for (var c = 0; c < sizes.length; c++) {
        var cell = _rangeCell(pairsArg[d].aspect, sizes[c], capMm);
        types.push({ d: d, c: c, w: cell.w * MM_TO_PT, h: cell.h * MM_TO_PT, sizeMm: sizes[c], typeIndex: d * sizes.length + c });
      }
    }
    return types;
  }

  function _rangeMedian(list, types) {
    if (!list.length) return 0;
    var hs = [];
    for (var i = 0; i < list.length; i++) hs.push(types[list[i]].h);
    hs.sort(function (a, b) { return a - b; });
    var m = hs.length >> 1;
    return (hs.length % 2) ? hs[m] : (hs[m - 1] + hs[m]) / 2;
  }

  // 높이군. 등급별(큰 등급이 0 = 위)로 시작해 중앙값을 재고, 타입마다 중앙값이 더 가까운 군으로 한 번 옮긴다 —
  // 전신 사진의 작은 등급(41mm)은 정사각 사진의 큰 등급(34~39mm)과 한 행이 어울린다.
  function _rangeGroups(types, classes) {
    var init = [], medians = [], out = [], g, i;
    for (g = 0; g < classes; g++) { init.push([]); out.push([]); }
    for (i = 0; i < types.length; i++) init[classes - 1 - types[i].c].push(i);
    for (g = 0; g < classes; g++) medians.push(_rangeMedian(init[g], types));
    for (i = 0; i < types.length; i++) {
      var best = classes - 1 - types[i].c, bestD = Math.abs(types[i].h - medians[best]);
      for (g = 0; g < classes; g++) {
        if (!init[g].length) continue;
        var dist = Math.abs(types[i].h - medians[g]);
        if (dist < bestD - EPS) { best = g; bestD = dist; }
      }
      out[best].push(i);
    }
    return out;
  }

  function _rangeRotated(list, by) {
    if (!list.length) return [];
    var n = list.length, k = ((by % n) + n) % n, out = [];
    for (var i = 0; i < n; i++) out.push(list[(i + k) % n]);
    return out;
  }

  function _rangeKeyLess(a, b) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] < b[i]) return true;
      if (a[i] > b[i]) return false;
    }
    return false;
  }

  // 데코를 행에 나누는 계획. 반환 = 행 index(이름 합성 행 포함, 0부터) → 데코 수. 행당 최대 2.
  //  1 앞 행부터 균등 · 2 뒤 행부터 균등 · 3 행마다 1개 · 4 합성 행까지 포함해 균등 · 0 없음
  function _rangeDecoQuota(plan, totalRows, hasMid, want) {
    var quota = [], i;
    for (i = 0; i < totalRows; i++) quota.push(0);
    if (!want || plan === 0) return quota;
    var first = (hasMid && plan !== 4) ? 1 : 0, hosts = totalRows - first;
    if (hosts <= 0) return quota;
    if (plan === 3) {
      for (i = first; i < totalRows && want > 0; i++) { quota[i] = 1; want--; }
      return quota;
    }
    var base = Math.floor(want / hosts), extra = want - base * hosts;
    if (base > 2) { base = 2; extra = 0; }
    for (i = 0; i < hosts; i++) {
      var k = base;
      if (plan === 2 ? (i >= hosts - extra) : (i < extra)) k++;
      if (k > 2) k = 2;
      quota[first + i] = k;
    }
    return quota;
  }

  // 데코 자리 (사진 목록에 끼워 넣는 index, 오름차순). 1개: 홀수 행 오른쪽 끝 · 짝수 행 왼쪽 끝.
  // 2개: 홀수 행 왼쪽 끝 + 오른쪽 1/3 지점 · 짝수 행 왼쪽 1/3 지점 + 오른쪽 끝 — 행마다 자리가 바뀌어 위아래로 겹치지 않는다.
  function _rangeDecoPositions(k, n, rowIndex) {
    if (k <= 0) return [];
    var odd = (rowIndex % 2) === 1;
    if (k === 1) return [odd ? n : 0];
    var third = Math.floor(n / 3), twoThird = Math.ceil(2 * n / 3);
    if (odd) return [0, twoThird];
    return [third, n];
  }

  // 행 하나 채우기. 남은 폭에 들어가는 타입 중 (아직 없는 타입 먼저, 그 디자인 장수 ↑, 그 타입 장수 ↑, 왼쪽 이웃과 같은 디자인, 윗줄 같은 자리와
  // 같은 디자인, 순서) 로 고른다. decoK 개의 데코 자리를 먼저 예약한다. 사진 폭이 ctx.fillMin 미만이면 null.
  // maxH > 0 이면 그보다 높은 타입은 빼고 채운다 (variant.cap — 위 군의 두 번째 행부터 가장 높은 셀을 빼 행 높이를 아낀다).
  function _rangeFillRow(ctx, group, avail, decoK, rowIndex, counts, typeCount, prevItems, maxH) {
    var types = ctx.types, gap = ctx.gap, items = [], used = 0, i;
    var reserve = decoK * (ctx.decoW + gap);
    if (decoK > 0 && reserve > avail * 0.5) { decoK = 0; reserve = 0; }
    var photoAvail = avail - reserve;
    var order = _rangeRotated(group, ctx.rotate);
    while (true) {
      var best = -1, bestKey = null;
      for (i = 0; i < order.length; i++) {
        var t = order[i], tp = types[t];
        if (maxH > 0 && tp.h > maxH + EPS) continue;
        var need = (items.length ? gap : 0) + tp.w;
        if (used + need > photoAvail + EPS) continue;
        var prevD = items.length ? types[items[items.length - 1].t].d : -1;
        var aboveD = -1;
        if (prevItems && prevItems.length > items.length && !prevItems[items.length].deco) aboveD = types[prevItems[items.length].t].d;
        // 아직 한 장도 없는 타입(그 사진의 그 등급) 이 먼저 — "사진마다 두 등급" 을 반복분보다 앞에 둔다.
        var key = [typeCount[t] === 0 ? 0 : 1, counts[tp.d], typeCount[t], tp.d === prevD ? 1 : 0, tp.d === aboveD ? 1 : 0, i];
        if (best < 0 || _rangeKeyLess(key, bestKey)) { best = t; bestKey = key; }
      }
      if (best < 0) break;
      used += (items.length ? gap : 0) + types[best].w;
      items.push({ t: best, w: types[best].w, h: types[best].h, deco: false });
      counts[types[best].d]++; typeCount[best]++;
    }
    if (!items.length) return null;
    if (used < ctx.fillMin * photoAvail - EPS) return null;
    var h = 0;
    for (i = 0; i < items.length; i++) if (items[i].h > h) h = items[i].h;
    var pos = _rangeDecoPositions(decoK, items.length, rowIndex);
    for (i = pos.length - 1; i >= 0; i--) items.splice(pos[i], 0, { t: -1, w: ctx.decoW, h: ctx.decoW, deco: true });
    return { items: items, h: h, decos: pos.length };
  }

  // 이름 양옆 세로 셀 후보: 위 군에서 h ≥ 이름 중간 높이 + gap + 위 군 중앙 높이 이고, 이름 옆 여백에 폭이 들어가는 타입.
  // 가장 높은 것을 왼쪽에, 다른 디자인의 후보가 있으면 그것을 오른쪽에 (없으면 같은 타입 양쪽).
  function _rangeFlankTypes(ctx) {
    if (!ctx.hero) return null;
    var need = ctx.hero.h / 2 + ctx.gap + ctx.medianTop, cands = [], i;
    for (i = 0; i < ctx.groups[0].length; i++) {
      var t = ctx.groups[0][i];
      if (ctx.types[t].h + EPS >= need && ctx.types[t].w + ctx.gap <= (ctx.W - ctx.hero.w) / 2 + EPS) cands.push(t);
    }
    if (!cands.length) return null;
    cands.sort(function (a, b) { return (ctx.types[b].h - ctx.types[a].h) || (a - b); });
    var left = cands[0], right = cands[0];
    for (i = 1; i < cands.length; i++) if (ctx.types[cands[i]].d !== ctx.types[left].d) { right = cands[i]; break; }
    return [left, right];
  }

  function _rangeMinPhotoH(items) {
    var h = -1;
    for (var i = 0; i < items.length; i++) if (!items[i].deco && (h < 0 || items[i].h < h)) h = items[i].h;
    return h < 0 ? 0 : h;
  }

  // 조합 하나를 끝까지 만든다. variant = { flanks, rows:[위 군 행 수, 아래 군 행 수], decoPlan, cap }. 못 만들면 null.
  //  cap = 위 군에서 첫 행 이후의 행 높이 상한 index (0 = 제한 없음, 1 = 두 번째로 높은 셀까지) — 전신 2″ 셀이 행마다 들어가 시트를 다 먹지 않게.
  function _rangeCompose(ctx, variant) {
    var types = ctx.types, gap = ctx.gap, counts = [], typeCount = [], rows = [], i, g, r;
    for (i = 0; i < ctx.D; i++) counts.push(0);
    for (i = 0; i < types.length; i++) typeCount.push(0);
    var band = null, flankL = -1, flankR = -1, y = 0;
    if (ctx.hero) {
      band = { heroX: (ctx.W - ctx.hero.w) / 2, heroY: 0, heroW: ctx.hero.w, heroH: ctx.hero.h, h: ctx.hero.h, flanks: 0 };
      if (variant.flanks) {
        var fl = _rangeFlankTypes(ctx);
        if (!fl) return null;
        flankL = fl[0]; flankR = fl[1];
      }
    }
    var hasMid = flankL >= 0 ? 1 : 0;
    var totalRows = hasMid + variant.rows[0] + variant.rows[1];
    if (totalRows === 0) return null;
    var quota = _rangeDecoQuota(variant.decoPlan, totalRows, hasMid, ctx.decoWant);
    var capH = (variant.cap > 0 && ctx.groupHeights[0].length > variant.cap) ? ctx.groupHeights[0][variant.cap] : 0;
    var rowIndex = 0;
    if (hasMid) {
      var tL = types[flankL], tR = types[flankR];
      counts[tL.d]++; typeCount[flankL]++; counts[tR.d]++; typeCount[flankR]++;
      var midX0 = tL.w + gap, midAvail = ctx.W - tL.w - tR.w - 2 * gap;
      var mid = _rangeFillRow(ctx, ctx.groups[0], midAvail, quota[0], 0, counts, typeCount, null, 0);
      if (!mid) return null;
      var comp = ctx.hero.h + gap + mid.h;
      if (tL.h > comp) comp = tL.h;
      if (tR.h > comp) comp = tR.h;
      if (comp > ctx.H + EPS) return null;
      band.h = comp; band.flanks = 2;
      rows.push({ items: mid.items, x0: midX0, avail: midAvail, h: comp, top: 0, flankL: flankL, flankR: flankR });
      y = comp; rowIndex = 1;
    } else if (band) {
      y = ctx.hero.h;
    }
    for (g = 0; g < ctx.groups.length; g++) {
      for (r = 0; r < variant.rows[g]; r++) {
        if (!ctx.groups[g].length) return null;
        var prev = rows.length ? rows[rows.length - 1].items : null;
        var maxH = (g === 0 && (r > 0 || hasMid)) ? capH : 0;
        var row = _rangeFillRow(ctx, ctx.groups[g], ctx.W, quota[rowIndex], rowIndex, counts, typeCount, prev, maxH);
        if (!row) return null;
        var top = y + ((rows.length || band) ? gap : 0);
        if (top + row.h > ctx.H + EPS) return null;
        rows.push({ items: row.items, x0: 0, avail: ctx.W, h: row.h, top: top, flankL: -1, flankR: -1 });
        y = top + row.h; rowIndex++;
      }
    }
    if (_rangeMinCount(counts) < ctx.minPer || _rangeSpread(counts) > ctx.spreadMax) return null;
    var coverageMissing = 0;
    for (i = 0; i < types.length; i++) if (!typeCount[i]) coverageMissing++;
    // 세로 여백: 행 사이 간격에 균등 분배 (행당 상한). 나머지는 아래에 남는다.
    var leftover = ctx.H - y, nGaps = rows.length - 1, extraV = 0;
    if (nGaps > 0 && leftover > 0) {
      extraV = leftover / nGaps;
      if (extraV > RANGE_ROW_GAP_EXTRA_MAX_MM * MM_TO_PT) extraV = RANGE_ROW_GAP_EXTRA_MAX_MM * MM_TO_PT;
    }
    for (r = 1; r < rows.length; r++) rows[r].top += extraV * r;
    // 양끝 맞춤 → 셀 좌표
    var placed = [], decos = [], area = 0, maxSlack = 0, decoN = 0, summary = [];
    for (r = 0; r < rows.length; r++) {
      var rw = rows[r], items = rw.items, n = items.length, usedW = 0, rowDecos = 0;
      for (i = 0; i < n; i++) { usedW += items[i].w; if (items[i].deco) rowDecos++; }
      var slack = rw.avail - usedW - gap * (n - 1);
      if (slack < -EPS) return null;
      if (slack > maxSlack) maxSlack = slack;
      var gRow = n > 1 ? gap + slack / (n - 1) : gap;
      var x = n > 1 ? rw.x0 : rw.x0 + slack / 2;
      var baseline = rw.top + rw.h, minPh = _rangeMinPhotoH(items);
      for (i = 0; i < n; i++) {
        var it = items[i];
        if (it.deco) {
          decos.push({ x: x, y: baseline - minPh / 2 - it.h / 2, w: it.w, h: it.h, row: r,
                       payload: { base: "__DECO_" + (decoN + 1) + "__", isDeco: true, deco: DECO_ORDER[decoN % DECO_ORDER.length] } });
          decoN++;
        } else {
          var tp = types[it.t];
          placed.push({ x: x, y: baseline - tp.h, w: tp.w, h: tp.h, payload: ctx.pairs[tp.d], sizeMm: tp.sizeMm,
                        typeIndex: tp.typeIndex, cls: tp.c, row: r, flank: "", rotated: false });
          area += tp.w * tp.h;
        }
        x += it.w + gRow;
      }
      if (rw.flankL >= 0) {
        var fL = types[rw.flankL], fR = types[rw.flankR];
        placed.push({ x: 0, y: baseline - fL.h, w: fL.w, h: fL.h, payload: ctx.pairs[fL.d], sizeMm: fL.sizeMm,
                      typeIndex: fL.typeIndex, cls: fL.c, row: r, flank: "L", rotated: false });
        placed.push({ x: ctx.W - fR.w, y: baseline - fR.h, w: fR.w, h: fR.h, payload: ctx.pairs[fR.d], sizeMm: fR.sizeMm,
                      typeIndex: fR.typeIndex, cls: fR.c, row: r, flank: "R", rotated: false });
        area += fL.w * fL.h + fR.w * fR.h;
      }
      summary.push({ h: rw.h, top: rw.top, photos: n - rowDecos, decos: rowDecos, gapMm: gRow / MM_TO_PT, slackMm: slack / MM_TO_PT, mid: rw.flankL >= 0 });
    }
    return { placed: placed, decos: decos, band: band, counts: counts, typeCount: typeCount, area: area, rows: summary,
             coverageMissing: coverageMissing, decoShortfall: ctx.decoWant - decoN, leftover: leftover - extraV * nGaps,
             maxSlack: maxSlack, flanks: hasMid ? 2 : 0, variant: variant };
  }

  // 우선순위: 두 등급 미배정 ↓ → 이름 옆 세로 셀 있음 → 데코 부족(허용치 RANGE_DECO_SHORTFALL_OK 초과분) ↓ → 사진 장수 ↑
  //          → 데코 수 ↑ → 남는 세로 여백 ↓ → 가장 성긴 행의 남는 폭 ↓
  function _rangeComposeBetter(a, b) {
    if (!b) return true;
    if (a.coverageMissing !== b.coverageMissing) return a.coverageMissing < b.coverageMissing;
    if (a.flanks !== b.flanks) return a.flanks > b.flanks;
    var da = Math.max(0, a.decoShortfall - RANGE_DECO_SHORTFALL_OK), db = Math.max(0, b.decoShortfall - RANGE_DECO_SHORTFALL_OK);
    if (da !== db) return da < db;
    if (a.placed.length !== b.placed.length) return a.placed.length > b.placed.length;
    if (a.decos.length !== b.decos.length) return a.decos.length > b.decos.length;
    if (Math.abs(a.leftover - b.leftover) > EPS) return a.leftover < b.leftover;
    if (Math.abs(a.maxSlack - b.maxSlack) > EPS) return a.maxSlack < b.maxSlack;
    return false;
  }

  // 엔진과 별도로 셀 크기(면적 등급 식) · 수량 · 등급 포함 · 실제 박스 간격(사진·데코·이름)을 다시 검사한다.
  function _rangeValidate(placed, decos, band, pairsArg, sizes, capMm, binW, binH, gap, requireCoverage, rules) {
    var eps = 0.001 * MM_TO_PT, counts = [], coverage = [], boxes = [], i, j;
    var minPer = (rules && rules.minPer) ? rules.minPer : RANGE_MIN_PER_PHOTO;
    var spreadMax = (rules && rules.spreadMax) ? rules.spreadMax : RANGE_SPREAD_MAX;
    for (i = 0; i < pairsArg.length; i++) { counts[i] = 0; coverage[i] = {}; }
    for (i = 0; i < placed.length; i++) {
      var a = placed[i], design = -1, sizeIndex = -1;
      for (var p = 0; p < pairsArg.length; p++) if (a.payload === pairsArg[p]) design = p;
      for (var s = 0; s < sizes.length; s++) if (a.sizeMm === sizes[s]) sizeIndex = s;
      if (design < 0 || sizeIndex < 0) return "알 수 없는 사진 또는 크기";
      if (!isFinite(a.x) || !isFinite(a.y) || !isFinite(a.w) || !isFinite(a.h) || !(a.w > 0) || !(a.h > 0) ||
          a.x < -eps || a.y < -eps || a.x + a.w > binW + eps || a.y + a.h > binH + eps) return "박스가 시트 영역을 벗어남: " + a.payload.base;
      if (a.rotated) return "사진 회전 금지: " + a.payload.base;
      var cell = _rangeCell(a.payload.aspect, sizes[sizeIndex], capMm);
      if (Math.abs(a.w - cell.w * MM_TO_PT) > eps || Math.abs(a.h - cell.h * MM_TO_PT) > eps) return "면적 등급 셀과 다름: " + a.payload.base;
      if (a.typeIndex !== design * sizes.length + sizeIndex) return "사진·크기 타입 불일치: " + a.payload.base;
      counts[design]++; coverage[design]["$" + a.sizeMm] = true;
      boxes.push({ x: a.x, y: a.y, w: a.w, h: a.h, name: a.payload.base });
    }
    var nDecos = decos ? decos.length : 0;
    for (i = 0; i < nDecos; i++) {
      var dc = decos[i];
      if (!isFinite(dc.x) || !isFinite(dc.y) || !(dc.w > 0) || !(dc.h > 0) ||
          dc.x < -eps || dc.y < -eps || dc.x + dc.w > binW + eps || dc.y + dc.h > binH + eps) return "데코가 시트 영역을 벗어남";
      boxes.push({ x: dc.x, y: dc.y, w: dc.w, h: dc.h, name: "데코 " + dc.payload.deco });
    }
    if (band && band.heroW > 0) {
      if (band.heroX < -eps || band.heroY < -eps || band.heroX + band.heroW > binW + eps || band.heroY + band.heroH > binH + eps) return "이름이 시트 영역을 벗어남";
      boxes.push({ x: band.heroX, y: band.heroY, w: band.heroW, h: band.heroH, name: "이름" });
    }
    for (i = 0; i < boxes.length; i++) {
      for (j = 0; j < i; j++) {
        var ba = boxes[i], bb = boxes[j];
        var sepX = ba.x + ba.w + gap <= bb.x + eps || bb.x + bb.w + gap <= ba.x + eps;
        var sepY = ba.y + ba.h + gap <= bb.y + eps || bb.y + bb.h + gap <= ba.y + eps;
        if (!sepX && !sepY) return "박스 간격 " + (gap / MM_TO_PT) + "mm 미만: " + ba.name + " / " + bb.name;
      }
    }
    for (var photo = 0; photo < pairsArg.length; photo++) {
      if (counts[photo] < minPer) return "사진별 최소 수량 미달: " + pairsArg[photo].base;
      if (requireCoverage) for (var sz = 0; sz < sizes.length; sz++) if (!coverage[photo]["$" + sizes[sz]]) return "사진별 크기 누락: " + pairsArg[photo].base + " " + _inchStr(sizes[sz]);
    }
    if (_rangeSpread(counts) > spreadMax) return "사진별 개수 차이 초과";
    return "";
  }

  // 배치 입구. extras = { hero:{w,h} (pt) | null, decoMm, decoWant, candidate }. 이름이 없으면 데코도 없다.
  function _packRange(pairsArg, range, binW, binH, gap, extras) {
    var sizes = RANGE_SIZES_MM[range];
    if (!sizes) throw new Error("알 수 없는 범위: " + range);
    if (pairsArg.length < 1 || pairsArg.length > RANGE_PER_SHEET) throw new Error("시트당 사진은 1~" + RANGE_PER_SHEET + "개입니다.");
    if (!(binW > 0) || !(binH > 0) || !(gap >= 0) || !isFinite(binW + binH + gap)) throw new Error("유효하지 않은 시트 영역 또는 간격");
    if (!extras) extras = {};
    var start = new Date().getTime();
    var capMm = RANGE_LONG_CAP_MM[range];
    var types = _rangeTypes(pairsArg, sizes, capMm);
    var groups = _rangeGroups(types, sizes.length);
    var hero = (extras.hero && extras.hero.w > 0 && extras.hero.h > 0) ? { w: extras.hero.w, h: extras.hero.h } : null;
    var decoW = (extras.decoMm > 0 ? extras.decoMm : 0) * MM_TO_PT;
    var ctx = { pairs: pairsArg, D: pairsArg.length, types: types, groups: groups, W: binW, H: binH, gap: gap, hero: hero,
                decoW: decoW, decoWant: (hero && decoW > 0 && extras.decoWant > 0) ? extras.decoWant : 0,
                rotate: extras.candidate ? extras.candidate : 0 };
    ctx.medianTop = _rangeMedian(groups[0], types);
    ctx.groupHeights = [];
    for (var gh = 0; gh < groups.length; gh++) ctx.groupHeights.push(_rangeDistinctHeights(groups[gh], types));
    ctx.fillMin = RANGE_ROW_FILL_MIN; ctx.minPer = RANGE_MIN_PER_PHOTO; ctx.spreadMax = RANGE_SPREAD_MAX;
    var found = _rangeSearch(ctx), best = found.best, tried = found.tried, relaxed = false;
    if (!best) {
      // 정상 규칙으로는 아무 조합도 안 들어간다 (Large 의 큰 셀, 세로 셀뿐인 전신 사진). 완화 규칙으로 다시 찾고 ⚠ 로 남긴다.
      ctx.fillMin = RANGE_ROW_FILL_RELAX; ctx.minPer = RANGE_MIN_PER_PHOTO_RELAX; ctx.spreadMax = RANGE_SPREAD_MAX_RELAX;
      found = _rangeSearch(ctx); best = found.best; tried += found.tried; relaxed = true;
    }
    if (!best) throw new Error("면적 등급 행 조판이 시트에 들어가지 않습니다 (사진 " + pairsArg.length + "장 · " + RANGE_LABELS[range] + "). 시트 영역과 사진 비율을 확인하세요.");
    var rules = { minPer: ctx.minPer, spreadMax: ctx.spreadMax, relaxed: relaxed };
    var error = _rangeValidate(best.placed, best.decos, best.band, pairsArg, sizes, capMm, binW, binH, gap, best.coverageMissing === 0, rules);
    if (error) throw new Error("배치 검증 실패: " + error);
    best.fill = best.area / (binW * binH);
    best.minCount = _rangeMinCount(best.counts); best.spread = _rangeSpread(best.counts);
    best.method = "rows"; best.runs = tried; best.ms = new Date().getTime() - start; best.capMm = capMm; best.groups = groups; best.relaxed = relaxed; best.rules = rules;
    return best;
  }

  // 군의 서로 다른 셀 높이, 높은 순 (variant.cap 의 상한 후보)
  function _rangeDistinctHeights(list, types) {
    var hs = [], i, j;
    for (i = 0; i < list.length; i++) {
      var h = types[list[i]].h, dup = false;
      for (j = 0; j < hs.length; j++) if (Math.abs(hs[j] - h) <= EPS) { dup = true; break; }
      if (!dup) hs.push(h);
    }
    hs.sort(function (a, b) { return b - a; });
    return hs;
  }

  // 완전 열거: (flank) × (위 군 행 수) × (아래 군 행 수) × (데코 분배) × (위 군 행 높이 상한). 최선과 시도 수를 돌려준다.
  function _rangeSearch(ctx) {
    var flankOptions = ctx.hero ? [true, false] : [false];
    var decoPlans = ctx.decoWant > 0 ? [1, 2, 3, 4, 0] : [0];
    var caps = ctx.groupHeights[0].length > 1 ? [0, 1] : [0];
    var best = null, tried = 0;
    for (var f = 0; f < flankOptions.length; f++) {
      for (var n0 = 0; n0 <= RANGE_MAX_ROWS; n0++) {
        for (var n1 = 0; n1 <= RANGE_MAX_ROWS; n1++) {
          if (n0 + n1 === 0 && !flankOptions[f]) continue;
          for (var dp = 0; dp < decoPlans.length; dp++) {
            for (var cp = 0; cp < caps.length; cp++) {
              var res = _rangeCompose(ctx, { flanks: flankOptions[f], rows: [n0, n1], decoPlan: decoPlans[dp], cap: caps[cp] });
              tried++;
              if (res && _rangeComposeBetter(res, best)) best = res;
            }
          }
        }
      }
    }
    return { best: best, tried: tried };
  }

  // "1in²·1.25in² (정사각 환산 · 최장변 2in)"
  // ═════════════════════════════════════════════════════════
  //  COMPOSED 엔진 v2 (2026-09-16) — 사진 6장 구성 시트. 순수 ES3, Adobe API 없음.
  //  좌표·치수 단위는 **mm** (입구 _packComposed 가 pt ↔ mm 를 바꾼다). y 는 아래로 증가, 원점 = body 좌상단.
  //  설계 규칙: ① 크기 = 인치 사다리의 **긴 변** + 실제 칼선 비율 (2.5″ 는 언제나 63.5mm)
  //  ② 등급별 장수 = 면적 배분(레퍼런스 실측 비중) ③ **큰 것부터** 놓는다 — 앞 COMPOSED_SPREAD_COUNT 장은
  //  서로 멀리(분산), 나머지는 빈틈에 밀착 ④ 같은 사진은 떨어뜨린다 ⑤ 셀 = 사진 + 2×rim(흰 테두리)
  //  ⑥ 충돌은 사각형(셀) + 기존 gap ⑦ 결정적 — 난수도 변형 탐색도 없다(한 판).
  //  Node 검증 sim/range_composed_test.js.
  // ═════════════════════════════════════════════════════════

  function _composedDist(ax, ay, bx, by) {
    var dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Composed 의 흰 테두리(mm) = 다이얼로그 "칼선 여백". 하나의 값이 두 일을 한다:
  //   ① 칼선을 셀 안쪽으로 이만큼 들여 놓고 ② 나중에 칼선을 이만큼 바깥으로 오프셋해도 이웃과 gap 이 남는다.
  function _composedRimMm(options) {
    return (options && options.cutMarginMm > 0) ? options.cutMarginMm : 0;
  }

  // 셀 = 등급(긴 변 인치) × 실제 칼선 비율, 짧은 변 하한, + 2×rim. aspect = w/h.
  // art = 실제 사진(칼선) 박스, w/h = 그걸 감싼 셀. 칼선은 art 에 맞추고 rim 은 이웃과의 여유다.
  function _composedCell(aspect, inch, rim) {
    var lng = inch * 25.4, w, h, shortSide, k;
    if (aspect >= 1) { w = lng; h = lng / aspect; }
    else { h = lng; w = lng * aspect; }
    shortSide = Math.min(w, h);
    if (shortSide < COMPOSED_MIN_SHORT_MM) {
      k = COMPOSED_MIN_SHORT_MM / shortSide;
      w = w * k;
      h = h * k;
    }
    return { w: w + 2 * rim, h: h + 2 * rim, artW: w, artH: h };
  }

  // ── 사진 종류 (순수 계산) ─────────────────────────────────────────
  function _composedTypeIndex(key) {
    for (var t = 0; t < COMPOSED_SHOT_TYPES.length; t++) if (COMPOSED_SHOT_TYPES[t].key === key) return t;
    return -1;
  }

  // 종류의 허용 등급 (COMPOSED_GRADES_IN 순서의 true/false). 모르는 종류·미분류 = 전부 허용.
  function _composedTypeWindow(key) {
    var w = [], g, t = _composedTypeIndex(key), v, any = false;
    for (g = 0; g < COMPOSED_GRADES_IN.length; g++) {
      v = COMPOSED_GRADES_IN[g];
      if (t < 0) w.push(true);
      else w.push(v >= COMPOSED_SHOT_TYPES[t].minIn - 1e-9 && v <= COMPOSED_SHOT_TYPES[t].maxIn + 1e-9);
      if (w[g]) any = true;
    }
    if (!any) { for (g = 0; g < w.length; g++) w[g] = true; }   // 표가 사다리와 안 맞으면 막지 않는다
    return w;
  }

  function _composedTypeLabel(key) {
    var t = _composedTypeIndex(key);
    if (t < 0) return "미분류 0.75~2.5\"";
    return COMPOSED_SHOT_TYPES[t].label + " " + COMPOSED_SHOT_TYPES[t].minIn + "~" + COMPOSED_SHOT_TYPES[t].maxIn + "\"";
  }

  // 페어 이름(…_01_SML) 끝의 크기 표시 → { token, key }. 표시가 없으면 null — 그 사진은 자동 판별로 간다.
  function _composedNameType(base) {
    var m = String(base || "").match(COMPOSED_NAME_TOKEN_RE);
    if (!m) return null;
    var token = m[1].toUpperCase();
    return COMPOSED_NAME_TYPES[token] ? { token: token, key: COMPOSED_NAME_TYPES[token] } : null;
  }

  // 얼굴 측정 앱의 결과 한 줄 "ok|얼굴수|x,y,w,h|사람수|동물수" → 객체. 형식이 틀리면 null.
  function _composedParseProbe(s) {
    if (!s) return null;
    var p = String(s).split("|"), box, faceH = 0;
    if (p.length !== 5) return null;
    if (p[2] !== "-") {
      box = p[2].split(",");
      if (box.length !== 4) return null;
      faceH = parseFloat(box[3]);
      if (!isFinite(faceH) || faceH < 0 || faceH > 1.01) return null;
    }
    var faces = parseInt(p[1], 10), humans = parseInt(p[3], 10), animals = parseInt(p[4], 10);
    if (!isFinite(faces) || !isFinite(humans) || !isFinite(animals)) return null;
    return { ok: p[0] === "ok", faces: faces, faceH: faceH, humans: humans, animals: animals };
  }

  // 자동 판별. rec = _composedParseProbe 결과, relH = 칼선 높이 ÷ 캔버스 높이 (모르면 1).
  // 반환 { key, confirm(운영자가 봐야 함), note(확인 창·메시지 표시) }.
  function _composedClassify(rec, relH) {
    if (!rec || !rec.ok) return { key: COMPOSED_TYPE_NONE, confirm: true, note: "측정 안 됨" };
    var people = Math.max(rec.faces, rec.humans);
    if (rec.faces === 0) {
      if (rec.animals > 0) return { key: "petBody", confirm: true, note: "얼굴 없음 · 동물" };
      if (people >= COMPOSED_TYPE_GROUP_PEOPLE) return { key: "group", confirm: true, note: "얼굴 없음 · 사람 " + people + "명" };
      return { key: "full", confirm: true, note: "얼굴 없음" };
    }
    if (people >= COMPOSED_TYPE_GROUP_PEOPLE) return { key: "group", confirm: false, note: people + "명" };
    var frac = rec.faceH / ((relH > 0) ? relH : 1);
    var note = "얼굴 " + Math.round(frac * 100) + "%";
    if (frac >= COMPOSED_TYPE_FACE_MIN) return { key: "face", confirm: false, note: note };
    if (frac >= COMPOSED_TYPE_UPPER_MIN) return { key: "upper", confirm: false, note: note };
    return { key: "full", confirm: false, note: note };
  }

  // 레퍼런스 면적 비중을 한 사진의 범위(연속 등급) 위에 다시 펼친다 — 범위의 가장 큰 등급 = 레퍼런스 맨 앞,
  // 가장 작은 등급 = 맨 끝, 사이는 선형 보간. 합 = 1. 사다리 전체(미분류)면 레퍼런스 그대로다.
  // 사다리 기준으로 잘라 쓰면 전신 범위에선 가장 작은 등급이 면적 55% 를 가져가 한 크기로 몰렸다.
  function _composedWindowProfile(win) {
    var G = COMPOSED_GRADES_IN.length, lo = -1, hi = -1, g, k, p, q, f, v, sum = 0, out = [];
    for (g = 0; g < G; g++) {
      out.push(0);
      if (win[g]) { if (lo < 0) lo = g; hi = g; }
    }
    if (lo < 0) return out;
    k = hi - lo + 1;
    for (g = lo; g <= hi; g++) {
      if (!win[g]) continue;
      p = (k === 1) ? 0 : (g - lo) / (k - 1);
      q = p * (G - 1);
      f = Math.floor(q);
      if (f >= G - 1) v = COMPOSED_GRADE_SHARE[G - 1];
      else v = COMPOSED_GRADE_SHARE[f] + (COMPOSED_GRADE_SHARE[f + 1] - COMPOSED_GRADE_SHARE[f]) * (q - f);
      out[g] = v;
      sum += v;
    }
    for (g = 0; g < G; g++) out[g] = (sum > 0) ? out[g] / sum : 0;
    return out;
  }

  // 사진당 같은 등급 상한 — 표는 6장 기준이라, 사진이 적은 시트는 그만큼 늘려야 시트가 찬다 (1장이면 6배).
  // 시트 전체 등급 상한(GRADE_MAX)은 그대로라 한 크기로 몰리지는 않는다.
  function _composedPerPhotoMax(n) {
    var k = COMPOSED_PER_SHEET / Math.max(1, Math.min(n, COMPOSED_PER_SHEET)), out = [], g;
    for (g = 0; g < COMPOSED_PER_PHOTO_MAX.length; g++) out.push(Math.ceil(COMPOSED_PER_PHOTO_MAX[g] * k - 1e-9));
    return out;
  }

  // 같은 사진 거리 기준(추가 40 · 채움 30 · 벌점 45mm)의 배율 — 사진이 적으면 같은 사진이 이웃하는 게 당연하다.
  function _composedSameScale(n) {
    return Math.max(1, Math.min(n, COMPOSED_PER_SHEET)) / COMPOSED_PER_SHEET;
  }

  // 종류 범위의 가장 큰 인치 (미분류 = 사다리 최대).
  function _composedTypeMax(key) {
    var w = _composedTypeWindow(key);
    for (var g = 0; g < COMPOSED_GRADES_IN.length; g++) if (w[g]) return COMPOSED_GRADES_IN[g];
    return COMPOSED_GRADES_IN[0];
  }

  // 크기 직접 고르기 (2026-09-16 사용자: 주문 보드에서 사진마다 0.75~2.5″ 안의 최소·최대를 보면서 정한다).
  // pair.sizeRange = [최소, 최대] 인치가 있으면 종류 범위 대신 쓴다 (시트 나누기·배치·검사 모두). 없으면 종류 범위.
  // [최소, 최대] → 정리된 값. 둘 다 사다리 값이고 최소 ≤ 최대여야 한다. 아니면 null.
  function _composedSizeRange(raw) {
    var lo = -1, hi = -1, g;
    if (!raw || !(raw instanceof Array) || raw.length !== 2) return null;
    if (typeof raw[0] !== "number" || typeof raw[1] !== "number") return null;
    for (g = 0; g < COMPOSED_GRADES_IN.length; g++) {
      if (COMPOSED_GRADES_IN[g] === raw[0]) lo = raw[0];
      if (COMPOSED_GRADES_IN[g] === raw[1]) hi = raw[1];
    }
    if (lo < 0 || hi < 0 || lo > hi) return null;
    return [lo, hi];
  }

  // 장수 상한 (2026-09-17 사용자: "사진 개수도 제한할 수 있으면 좋겠다" — 주문 보드에서 사진마다 정한다).
  // pair.maxCopies = 그 사진이 한 시트에서 넘지 않을 장수. 1~COMPOSED_COPIES_MAX 의 정수여야 하고, 아니면 null.
  // 비었으면(없음·0) 상한 없음 = 엔진이 정한다.
  function _composedCopyCap(raw) {
    if (typeof raw !== "number" || !isFinite(raw) || Math.floor(raw) !== raw) return null;
    if (raw < 1 || raw > COMPOSED_COPIES_MAX) return null;
    return raw;
  }

  // [최소, 최대] → 등급별 쓸 수 있음 (종류 창과 같은 모양).
  function _composedRangeWindow(range) {
    var w = [];
    for (var g = 0; g < COMPOSED_GRADES_IN.length; g++) w.push(COMPOSED_GRADES_IN[g] >= range[0] && COMPOSED_GRADES_IN[g] <= range[1]);
    return w;
  }

  // 사진의 가장 큰 인치 (시트 나누기용) — 직접 고른 범위가 있으면 그 최대.
  function _composedPairMaxIn(pair) {
    var r = pair.sizeRange ? _composedSizeRange(pair.sizeRange) : null;
    return r ? r[1] : _composedTypeMax(pair.shotType || COMPOSED_TYPE_NONE);
  }

  // [0.75, 2.5] → 0.75~2.5"
  function _composedRangeLabel(range) {
    return range[0] + "~" + range[1] + "\"";
  }

  // 선택한 사진 n 장 → 시트들 [{ photos: [선택 index…], main: 선택 index }].
  // 시트 수 = ceil(n / COMPOSED_PER_SHEET), 시트마다 장수 차이 ≤ 1. 메인을 맨 앞에 두고 나머지는 범위 상한이 큰 사진부터
  // (같으면 선택 순서) **돌아가며** 나눈다 — 앞에서부터 자르면 파일명 순서(BIG → MED → SML)대로 큰 사진이 한 시트에 몰린다.
  // 각 시트의 메인 = 그 시트가 처음 받은 사진 (0번 시트는 운영자가 고른 메인). 시트 안의 사진은 선택 순서.
  function _composedDeal(maxIns, mainIndex) {
    var n = maxIns.length, order = [], i, j, tmp, sheets = [], k, count;
    if (n < 1) return sheets;
    count = Math.ceil(n / COMPOSED_PER_SHEET);
    for (i = 0; i < n; i++) if (i !== mainIndex) order.push(i);
    for (i = 1; i < order.length; i++) {
      tmp = order[i];
      j = i - 1;
      while (j >= 0 && maxIns[order[j]] < maxIns[tmp]) { order[j + 1] = order[j]; j--; }
      order[j + 1] = tmp;
    }
    if (mainIndex >= 0 && mainIndex < n) order.unshift(mainIndex);
    for (k = 0; k < count; k++) sheets.push({ photos: [], main: order[k] });
    for (i = 0; i < n; i++) sheets[i % count].photos.push(order[i]);
    for (k = 0; k < count; k++) sheets[k].photos.sort(function (a, b) { return a - b; });
    return sheets;
  }

  // 장수 계획 → 슬롯 목록 (큰 것부터). 네 단계, 매 장마다 셀 합이 시트 예산(PACK_BUDGET)을 넘지 않는지 본다.
  //  ① 메인 = 자기 범위의 가장 큰 등급 1장.
  //  ② 시트에서 쓸 수 있는 가장 큰 등급이 메인보다 크면(메인이 얼굴) 그 등급을 쓸 수 있는 첫 사진에게 1장 — 시트의 중심.
  //  ③ 균형 — 모든 사진이 COMPOSED_MIN_COPIES 장이 될 때까지, 적게 나온 사진부터 자기 범위의 작은 등급으로.
  //     이어서 쓸 수 있는 등급마다 한 장 이상 (사다리가 끊기지 않게).
  //     (이게 없으면 몸 사진은 큰 등급 한 장씩만 받고 얼굴 사진이 나머지를 다 가져간다 — 시뮬 실측 [1,6,1,5,1,5])
  //  ④ 면적 배분 — 등급별 목표 면적(사진마다 자기 범위에 펼친 레퍼런스 비중의 평균)에 가장 모자란 등급부터
  //     한 장씩, 그 등급을 쓸 수 있는 사진 중 **가장 적게 나온** 사진에게 (그 사진이 예산에 안 들어가면 그 등급은 건너뛴다 —
  //     여유 있는 사진에 몰아주면 장수가 벌어진다). 사진 박스 합이 ART_BUDGET 에 닿으면 멈춘다.
  // 사진당 같은 등급 상한(PER_PHOTO_MAX)과 등급 상한(GRADE_MAX ÷ 쓸 수 있는 비중)을 지킨다.
  // 반환 { slots[], counts[] (등급별 장수) }.
  function _composedPlanSlots(photos, mainIndex, usableMm2, rim, spreadCount, dropCount) {
    var G = COMPOSED_GRADES_IN.length, n = photos.length, g, i, k, r, perMax = _composedPerPhotoMax(n);
    var cells = [], elig = [], w = [], wSum = 0, target = [], gradeCap = [], avgArt = [];
    for (i = 0; i < n; i++) {
      cells.push([]);
      for (g = 0; g < G; g++) cells[i].push(_composedCell(photos[i].aspect, COMPOSED_GRADES_IN[g], rim));
    }
    var prof = [];
    for (i = 0; i < n; i++) prof.push(_composedWindowProfile(photos[i].window));
    for (g = 0; g < G; g++) {
      var e = 0, sa = 0, ws = 0;
      for (i = 0; i < n; i++) {
        if (!photos[i].window[g]) continue;
        e++;
        sa += cells[i][g].artW * cells[i][g].artH;
        ws += prof[i][g];
      }
      elig.push(e);
      avgArt.push(e ? sa / e : 0);
      w.push(ws / n);
      wSum += w[g];
    }
    var artBudget = COMPOSED_ART_BUDGET * usableMm2, cap = COMPOSED_PACK_BUDGET * usableMm2;
    for (g = 0; g < G; g++) {
      target.push(wSum > 0 ? w[g] / wSum * artBudget : 0);
      gradeCap.push(wSum > 0 ? Math.min(Math.ceil(COMPOSED_GRADE_MAX[g] * (w[g] / wSum) / COMPOSED_GRADE_SHARE[g] - 1e-9),
                                        elig[g] * perMax[g]) : 0);
    }
    var slots = [], copies = [], per = [], counts = [], artByGrade = [], cellSum = 0, artSum = 0, fillPhase = false;
    for (i = 0; i < n; i++) { copies.push(0); per.push([]); for (g = 0; g < G; g++) per[i].push(0); }
    for (g = 0; g < G; g++) { counts.push(0); artByGrade.push(0); }
    // 사진별 장수 상한 (주문 보드에서 정한 값, 0 = 없음).
    function copyCap(p) { return photos[p].maxCopies > 0 ? photos[p].maxCopies : 1e9; }
    function canAdd(p, gg) {
      var c = cells[p][gg];
      return photos[p].window[gg] && per[p][gg] < perMax[gg] && counts[gg] < gradeCap[gg] &&
             copies[p] < copyCap(p) && cellSum + c.w * c.h <= cap + 1e-9;
    }
    function add(p, gg) {
      var c = cells[p][gg];
      slots.push({ grade: gg, inch: COMPOSED_GRADES_IN[gg], photo: photos[p].index, seq: slots.length, fill: fillPhase });
      copies[p]++;
      per[p][gg]++;
      counts[gg]++;
      artByGrade[gg] += c.artW * c.artH;
      artSum += c.artW * c.artH;
      cellSum += c.w * c.h;
    }
    // 적게 나온 사진 먼저. 동률이면 입력 순 — 단 메인은 이미 가장 큰 조각을 가졌으니 **맨 뒤** (큰 두 자리가 같은 사진이 되지 않게).
    function fewest(gg) {
      var best = -1, low = -1, p;
      for (p = 0; p < n; p++) {
        // 상한에 닿은 사진은 기준(low)에서도 뺀다 — 안 그러면 그 사진이 가장 적다는 이유로 다른 사진까지 못 넣는다.
        if (!photos[p].window[gg] || per[p][gg] >= perMax[gg] || copies[p] >= copyCap(p)) continue;
        if (low < 0 || copies[p] < low) low = copies[p];
      }
      for (p = 0; p < n; p++) {
        if (copies[p] > low || !canAdd(p, gg)) continue;
        if (best < 0 || copies[p] < copies[best] || (copies[p] === copies[best] && best === mainIndex && p !== mainIndex)) best = p;
      }
      return best;
    }
    // ① 메인
    var gMain = -1;
    for (g = 0; g < G; g++) if (photos[mainIndex].window[g]) { gMain = g; break; }
    if (gMain >= 0 && canAdd(mainIndex, gMain)) add(mainIndex, gMain);
    // ② 시트의 가장 큰 등급
    var gTop = -1;
    for (g = 0; g < G; g++) if (elig[g] > 0) { gTop = g; break; }
    if (gTop >= 0 && gTop < gMain) {
      for (i = 0; i < n; i++) if (i !== mainIndex && canAdd(i, gTop)) { add(i, gTop); break; }
    }
    // ③ 균형
    for (r = 1; r <= COMPOSED_MIN_COPIES; r++) {
      var stuck = [];
      for (i = 0; i < n; i++) stuck.push(false);
      for (var guard = 0; guard < n * 4; guard++) {
        var who = -1, placedOne = false;
        for (i = 0; i < n; i++) {
          if (stuck[i] || copies[i] >= r) continue;
          if (who < 0 || copies[i] < copies[who] || (copies[i] === copies[who] && i === mainIndex && who !== mainIndex)) who = i;
        }
        if (who < 0) break;
        // 첫 장은 가장 작은 등급(싸게 전원 확보), 둘째 장부터는 그 사진 범위에서 목표 대비 가장 모자란 등급 —
        // 늘 작은 등급으로 채우면 전신 사진이 전부 범위 하한 크기로 몰린다.
        var pick = -1, pickShort = -1e9, sh;
        if (r > 1) {
          for (g = 0; g < G; g++) {
            if (!canAdd(who, g) || !(avgArt[g] > 0)) continue;
            sh = (target[g] - artByGrade[g]) / avgArt[g];
            if (sh > pickShort) { pickShort = sh; pick = g; }
          }
        }
        if (pick >= 0) {
          add(who, pick);
          placedOne = true;
        } else {
          for (g = G - 1; g >= 0; g--) {
            if (canAdd(who, g)) { add(who, g); placedOne = true; break; }
          }
        }
        if (!placedOne) stuck[who] = true;   // 이 사진은 더 못 넣는다(예산·상한) — 다른 사진은 계속
      }
    }
    // ③-2 사다리 — 쓸 수 있는 등급은 한 장 이상 (큰 등급부터). 없으면 정사각 주문에서 2″ 가 통째로 빠진다.
    for (g = 0; g < G; g++) {
      if (!elig[g] || counts[g] > 0) continue;
      var pv = fewest(g);
      if (pv >= 0) add(pv, g);
    }
    fillPhase = true;
    // ④ 면적 배분
    for (k = 0; k < 200 && artSum < artBudget; k++) {
      var bestG = -1, bestP = -1, bestShort = 0.5, p, shortBy;
      for (g = 0; g < G; g++) {
        if (!elig[g] || !(avgArt[g] > 0)) continue;
        shortBy = (target[g] - artByGrade[g]) / avgArt[g];      // 몇 장 모자란가
        if (shortBy <= bestShort) continue;
        p = fewest(g);
        if (p < 0) continue;
        bestShort = shortBy;
        bestG = g;
        bestP = p;
      }
      if (bestG < 0) break;
      add(bestP, bestG);
    }
    // 자리가 모자라면 ④에서 마지막에 넣은 조각부터 뺀다 (재시도용)
    for (var dq = 0; dq < (dropCount || 0); dq++) {
      var last = -1;
      for (i = 0; i < slots.length; i++) if (slots[i].fill && (last < 0 || slots[i].seq > slots[last].seq)) last = i;
      if (last < 0) break;
      counts[slots[last].grade]--;
      slots.splice(last, 1);
    }
    // 큰 것부터. 같은 등급 안에서는 각 사진의 **첫 장**이 먼저 — 자리가 모자라도 사진이 통째로 빠지지 않게.
    // 삽입 정렬이라 나머지 순서(넣은 순서)는 그대로다.
    var seen = [], tmp, j;
    for (i = 0; i < n; i++) seen.push(0);
    for (i = 0; i < slots.length; i++) { slots[i].nth = seen[slots[i].photo]; seen[slots[i].photo]++; }
    for (i = 1; i < slots.length; i++) {
      tmp = slots[i];
      j = i - 1;
      while (j >= 0 && (slots[j].grade > tmp.grade || (slots[j].grade === tmp.grade && slots[j].nth > tmp.nth))) {
        slots[j + 1] = slots[j];
        j--;
      }
      slots[j + 1] = tmp;
    }
    for (i = 0; i < slots.length; i++) slots[i].spread = i < spreadCount;
    return { slots: slots, counts: counts };
  }

  // 사각형 충돌 — 이웃과 gap 이상, 시트 안. (칼선 박스 기준, v1 은 윤곽 맞물림 없음)
  function _composedFree(x, y, w, h, placed, W, H, gap) {
    if (x < -EPS || y < -EPS || x + w > W + EPS || y + h > H + EPS) return false;
    for (var i = 0; i < placed.length; i++) {
      var p = placed[i];
      if (x < p.x + p.w + gap - EPS && p.x < x + w + gap - EPS &&
          y < p.y + p.h + gap - EPS && p.y < y + h + gap - EPS) return false;
    }
    return true;
  }

  // 후보 좌표 — 시트 양끝 + 이미 놓인 것들의 바깥 모서리(gap 만큼 띄운 자리). isX=false 면 세로축.
  // step > 0 이면 성긴 격자도 넣는다 — 큰 조각은 이웃이 아직 없어 "붙는 자리"만으로는 분산이 안 된다.
  // 채움 조각에는 격자를 주지 않는다: 후보가 4배가 되고 배치 품질은 오히려 나빠졌다 (시뮬 실측).
  function _composedAxis(extent, limit, placed, gap, isX, step) {
    var vals = [0, limit - extent];
    var seen = {}, out = [], i, v, key;
    for (i = 0; i < placed.length; i++) {
      if (isX) { vals.push(placed[i].x + placed[i].w + gap); vals.push(placed[i].x - gap - extent); }
      else { vals.push(placed[i].y + placed[i].h + gap); vals.push(placed[i].y - gap - extent); }
    }
    if (step > 0) { for (v = 0; v <= limit - extent + EPS; v += step) vals.push(v); }
    for (i = 0; i < vals.length; i++) {
      v = vals[i];
      if (v < -EPS || v + extent > limit + EPS) continue;
      key = "k" + Math.round(v * 100);
      if (seen[key]) continue;
      seen[key] = true;
      out.push(v);
    }
    return out;
  }

  // 둘레 중 이웃·시트 가장자리에 gap 거리로 닿는 비율 (0~1). 클수록 빈틈에 꼭 맞게 들어간 자리다.
  // 시트 아래 가장자리는 절반만 센다 — 아래 한 줄로 쭉 늘어서는 배치를 막는다.
  function _composedContact(x, y, w, h, placed, W, H, gap) {
    var tol = 0.35, len = 0, i, p, ov, g;
    if (x < tol) len += h;
    if (W - (x + w) < tol) len += h;
    if (y < tol) len += w;
    if (H - (y + h) < tol) len += 0.5 * w;
    for (i = 0; i < placed.length; i++) {
      p = placed[i];
      ov = Math.min(y + h, p.y + p.h) - Math.max(y, p.y);
      if (ov > 0) {
        g = Math.max(p.x - (x + w), x - (p.x + p.w));
        if (g >= gap - EPS && g <= gap + tol) len += ov;
      }
      ov = Math.min(x + w, p.x + p.w) - Math.max(x, p.x);
      if (ov > 0) {
        g = Math.max(p.y - (y + h), y - (p.y + p.h));
        if (g >= gap - EPS && g <= gap + tol) len += ov;
      }
    }
    return len / (2 * (w + h));
  }

  // 가까운 이웃과 윗변·아랫변·왼변이 일직선인 횟수 — 격자처럼 보이는 배치에 벌점을 준다.
  function _composedAlignHits(x, y, w, h, placed) {
    var n = 0, i, p, dx, dy;
    for (i = 0; i < placed.length; i++) {
      p = placed[i];
      dx = Math.max(0, p.x - (x + w), x - (p.x + p.w));
      dy = Math.max(0, p.y - (y + h), y - (p.y + p.h));
      if (dx * dx + dy * dy > 625) continue;
      if (dx > 0 && Math.abs(p.y - y) < 0.8) n++;
      if (dx > 0 && Math.abs(p.y + p.h - (y + h)) < 0.8) n++;
      if (dy > 0 && Math.abs(p.x - x) < 0.8) n++;
    }
    return n;
  }

  function _composedEdgeDist(x, y, w, h, p) {
    var dx = Math.max(0, p.x - (x + w), x - (p.x + p.w));
    var dy = Math.max(0, p.y - (y + h), y - (p.y + p.h));
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ctx = { W, H, gap, photos[], placed[], copies[], area[], fallback[], moved[], missing[], ops }
  function _composedPut(ctx, item) {
    ctx.placed.push(item);
    if (item.kind === "photo") {
      ctx.copies[item.photo] = ctx.copies[item.photo] + 1;
      ctx.area[item.photo] = ctx.area[item.photo] + item.w * item.h;
    }
  }

  // ── 배치 선택 (스타일 · 이름 위치 · 좌우 바꿈 · 섞기) — 주문 보드 미리보기와 공용 ─────────
  function _composedStyleIndex(key) {
    for (var i = 0; i < COMPOSED_STYLES.length; i++) if (COMPOSED_STYLES[i].key === key) return i;
    return -1;
  }

  function _composedFlipNamePos(pos) {
    if (pos === "left") return "right";
    if (pos === "right") return "left";
    return pos;
  }

  // 배치 선택 → { style, namePos, mirror, seed }. 비어 있으면 기본 (가운데 · 이름 왼쪽 = 예전 배치).
  // namePos 는 **계산할 때** 이름 자리 — mirror 면 결과에서는 반대편에 보인다 (_composedVisibleNamePos).
  // 값이 하나라도 이상하면 null — 호출부가 막는다 (추측해서 기본으로 바꾸지 않는다).
  function _composedLayoutSpec(raw) {
    var style = COMPOSED_STYLES[0].key, namePos = "", mirror = false, seed = 0, i, ok;
    if (raw !== undefined && raw !== null) {
      if (typeof raw !== "object") return null;
      if (raw.style !== undefined && raw.style !== null && raw.style !== "") {
        if (_composedStyleIndex(String(raw.style)) < 0) return null;
        style = String(raw.style);
      }
      if (raw.namePos !== undefined && raw.namePos !== null && raw.namePos !== "") {
        ok = false;
        for (i = 0; i < COMPOSED_NAME_POSITIONS.length; i++) if (COMPOSED_NAME_POSITIONS[i] === String(raw.namePos)) ok = true;
        if (!ok) return null;
        namePos = String(raw.namePos);
      }
      if (raw.mirror !== undefined && raw.mirror !== null) {
        if (raw.mirror !== true && raw.mirror !== false) return null;
        mirror = raw.mirror;
      }
      if (raw.seed !== undefined && raw.seed !== null) {
        if (typeof raw.seed !== "number") return null;
        seed = raw.seed;
        if (isNaN(seed) || seed < 0 || seed > COMPOSED_SHUFFLE_MAX || Math.floor(seed) !== seed) return null;
      }
    }
    if (!namePos) namePos = COMPOSED_STYLES[_composedStyleIndex(style)].namePos;
    return { style: style, namePos: namePos, mirror: mirror, seed: seed };
  }

  // 이름 위치 고르기 — "auto"(또는 모르는 값)면 스타일이 정한 자리.
  function _composedResolveNamePos(style, choice) {
    for (var i = 0; i < COMPOSED_NAME_POSITIONS.length; i++) if (COMPOSED_NAME_POSITIONS[i] === choice) return choice;
    var si = _composedStyleIndex(style);
    return COMPOSED_STYLES[si < 0 ? 0 : si].namePos;
  }

  // 결과에서 이름이 보이는 쪽.
  function _composedVisibleNamePos(spec) {
    return spec.mirror ? _composedFlipNamePos(spec.namePos) : spec.namePos;
  }

  // 보이는 이름 자리를 지키며 좌우를 바꾼 판 = 반대편에 이름을 두고 계산한 뒤 뒤집는다 (그냥 뒤집은 것과 다른 판이 나온다).
  function _composedMirrorSpec(style, visiblePos, seed) {
    return { style: style, namePos: _composedFlipNamePos(visiblePos), mirror: true, seed: seed ? seed : 0 };
  }

  // "양옆 · 이름 가운데 · 좌우 바꿈 · 섞기 3" (완료 창 표시용)
  function _composedLayoutLabel(spec) {
    var si = _composedStyleIndex(spec.style);
    var s = (si < 0 ? spec.style : COMPOSED_STYLES[si].label) + " · 이름 " + COMPOSED_NAME_POS_LABELS[_composedVisibleNamePos(spec)];
    if (spec.mirror) s += " · 좌우 바꿈";
    if (spec.seed) s += " · 섞기 " + spec.seed;
    return s;
  }

  // 스타일 끌림 — 큰 조각 자리 점수에 더한다 (작을수록 좋다). u, v = 조각 중심의 시트 안 상대 위치 (0~1).
  function _composedStylePull(style, pull, u, v) {
    if (!pull) return 0;
    if (style === "sides") return pull * (1 - Math.abs(2 * u - 1));
    if (style === "bottom") return pull * (1 - v);
    if (style === "frame") return pull * 2 * Math.min(Math.min(u, 1 - u), Math.min(v, 1 - v));
    return 0;
  }

  // 섞기 — 자리 점수에 더하는 흔들림 [0, amp). 정수 연산만 써서 Illustrator·브라우저·node 가 같은 값을 낸다.
  function _composedShuffle(seed, x, y, photo, grade, amp) {
    if (!seed || !amp) return 0;
    var h = (Math.round(x * 4) * 131 + Math.round(y * 4) * 31 + photo * 17 + grade * 5) % 65521;
    h = (h * (seed * 2 + 1) + seed * 7919) % 65537;
    h = (h * 75 + 74) % 65537;
    h = (h * 75 + 74) % 65537;
    return amp * h / 65537;
  }

  // 박스 좌우 뒤집기 (pt, 제자리). 간격·시트 안 조건은 그대로 지켜진다.
  function _composedMirrorBoxes(list, binW) {
    for (var i = 0; i < list.length; i++) list[i].x = binW - list[i].x - list[i].w;
  }

  // 배치 지문 — 미리보기와 Illustrator 결과가 같은 자리인지 본다. 박스를 0.1mm 로 반올림한 목록의 해시 (16진).
  function _composedLayoutSig(res) {
    var parts = [], i, a, s, h = 5381;
    for (i = 0; i < res.placed.length; i++) {
      a = res.placed[i];
      parts.push("p" + a.photo + ":" + a.inch + "@" + _composedSigBox(a));
    }
    for (i = 0; i < res.decos.length; i++) parts.push("d@" + _composedSigBox(res.decos[i]));
    if (res.nameBox) parts.push("n@" + _composedSigBox(res.nameBox));
    s = parts.join(";");
    for (i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) % 4294967291;
    return h.toString(16);
  }

  // 0.1mm 칸. 좌표는 대개 0.05mm 의 배수(인치·테두리·간격의 합)라 보통 반올림 경계(.x5)에 딱 걸린다 —
  // 경계를 0.025mm 옮겨 두 계산기의 아주 작은 오차로 지문이 뒤집히지 않게 한다.
  function _composedSigBox(b) {
    return _composedSigMm(b.x) + "," + _composedSigMm(b.y) + "," + _composedSigMm(b.w) + "," + _composedSigMm(b.h);
  }

  function _composedSigMm(pt) {
    return Math.round(pt / MM_TO_PT * 10 + 0.25);
  }

  // 주문 보드 "변형" 줄 — 한 스타일의 기본 · 좌우 바꿈 · 섞기. 이름은 모두 visiblePos 에 보인다.
  // 섞기는 번호 1~COMPOSED_VARIANT_TRIES 를 돌려, 기본보다 스티커가 COMPOSED_VARIANT_DROP 장 넘게 줄었거나 이미 나온
  // 배치와 같은 판은 버리고 COMPOSED_VARIANT_KEEP 개까지. 반환 [{ kind: "base"|"mirror"|"shuffle", layout, res }] (실패한 판은 뺀다).
  // sheetIndex = 몇 번째 시트인지 (0부터 — 데코 시작 자리가 달라진다).
  function _composedVariants(pairsArg, mainIndex, binW, binH, gap, heroSpec, rimPt, style, visiblePos, sheetIndex) {
    var out = [], seen = {}, specs = [], i, k, sp, res, baseCount = -1, shuffles = 0;
    specs.push({ kind: "base", layout: { style: style, namePos: visiblePos, mirror: false, seed: 0 } });
    specs.push({ kind: "mirror", layout: _composedMirrorSpec(style, visiblePos, 0) });
    for (i = 1; i <= COMPOSED_VARIANT_TRIES; i++) {
      specs.push({ kind: "shuffle", layout: { style: style, namePos: visiblePos, mirror: false, seed: i } });
    }
    for (k = 0; k < specs.length; k++) {
      sp = specs[k];
      if (sp.kind === "shuffle" && shuffles >= COMPOSED_VARIANT_KEEP) break;
      try {
        res = _packComposed(pairsArg, mainIndex, binW, binH, gap, _composedPackExtras(heroSpec, rimPt, sp.layout, sheetIndex));
      } catch (eVar) {
        continue;
      }
      if (sp.kind === "base") baseCount = res.placed.length;
      if (sp.kind === "shuffle" && baseCount >= 0 && res.placed.length < baseCount - COMPOSED_VARIANT_DROP) continue;
      if (seen["$" + res.sig]) continue;
      seen["$" + res.sig] = true;
      if (sp.kind === "shuffle") shuffles++;
      out.push({ kind: sp.kind, layout: res.layout, res: res });
    }
    return out;
  }

  // 후보 자리 점수 (작을수록 좋다).
  //  · 큰 조각(spread) = 이미 놓인 큰 조각·이름·시트 모서리에서 **가장 먼** 자리. 모서리를 반발점으로
  //    넣지 않으면 "가장 먼 자리"가 늘 구석이라 큰 조각이 네 귀퉁이로 몰린다 (시뮬 실측).
  //  · 채움 조각 = 빈틈에 꼭 맞는(둘레가 많이 닿는) 자리. 같은 사진이 가깝거나 같은 등급이
  //    붙거나 격자처럼 줄이 맞으면 벌점.
  //  · 스타일 — 모으기는 "멀리" 대신 가운데(이름 아래 남은 높이의 중심)에 가깝게 · 이미 놓인 조각에 붙게.
  //    양옆·가장자리·아래쪽은 끌림(_composedStylePull)을 더한다. 섞기는 모든 조각에 작은 흔들림을 더한다.
  function _composedScoreSpot(ctx, slot, x, y, w, h) {
    var sc, i, p, d, mind;
    if (slot.spread && ctx.style === "cluster") {
      return _composedDist(x + w / 2, y + h / 2, ctx.W / 2, (ctx.nameBottom + ctx.H) / 2) -
        COMPOSED_CLUSTER_CONTACT * _composedContact(x, y, w, h, ctx.placed, ctx.W, ctx.H, ctx.gap) +
        _composedShuffle(ctx.seed, x, y, slot.photo, slot.grade, COMPOSED_SHUFFLE_SPREAD);
    }
    if (slot.spread) {
      mind = -1;
      for (i = 0; i < ctx.repel.length; i++) {
        d = _composedDist(x + w / 2, y + h / 2, ctx.repel[i].x + ctx.repel[i].w / 2, ctx.repel[i].y + ctx.repel[i].h / 2);
        if (mind < 0 || d < mind) mind = d;
      }
      if (mind < 0) mind = 0;
      return -mind - COMPOSED_WEIGHTS.spreadContact * _composedContact(x, y, w, h, ctx.placed, ctx.W, ctx.H, ctx.gap) +
        _composedStylePull(ctx.style, ctx.pull, (x + w / 2) / ctx.W, (y + h / 2) / ctx.H) +
        _composedShuffle(ctx.seed, x, y, slot.photo, slot.grade, COMPOSED_SHUFFLE_SPREAD);
    }
    sc = -COMPOSED_WEIGHTS.contact * _composedContact(x, y, w, h, ctx.placed, ctx.W, ctx.H, ctx.gap);
    sc += COMPOSED_WEIGHTS.align * _composedAlignHits(x, y, w, h, ctx.placed);
    for (i = 0; i < ctx.placed.length; i++) {
      p = ctx.placed[i];
      if (p.kind !== "photo") continue;
      if (p.photo === slot.photo) {
        d = _composedDist(x + w / 2, y + h / 2, p.x + p.w / 2, p.y + p.h / 2);
        if (d < ctx.dupMin) sc += COMPOSED_WEIGHTS.dup * (ctx.dupMin - d);
      }
      if (p.grade === slot.grade && _composedEdgeDist(x, y, w, h, p) < COMPOSED_SAMEGRADE_MM) sc += COMPOSED_WEIGHTS.sameGrade;
    }
    return sc + _composedShuffle(ctx.seed, x, y, slot.photo, slot.grade, COMPOSED_SHUFFLE_FILL);
  }

  // 같은 사진 중 가장 가까운 것의 중심 거리 (없으면 아주 큰 값)
  function _composedNearestSame(ctx, photo, cx, cy) {
    var best = 1e9, i, p, d;
    for (i = 0; i < ctx.placed.length; i++) {
      p = ctx.placed[i];
      if (p.kind !== "photo" || p.photo !== photo) continue;
      d = _composedDist(cx, cy, p.x + p.w / 2, p.y + p.h / 2);
      if (d < best) best = d;
    }
    return best;
  }

  // 후보 중 최선. 없으면 null (그 슬롯은 누락으로 보고한다 — 크기를 줄여 억지로 넣지 않는다).
  function _composedBestSpot(ctx, slot, w, h) {
    var step = slot.spread ? COMPOSED_STEP_MM : 0;
    var xs = _composedAxis(w, ctx.W, ctx.placed, ctx.gap, true, step);
    var ys = _composedAxis(h, ctx.H, ctx.placed, ctx.gap, false, step);
    var best = null, i, j, x, y, sc;
    for (i = 0; i < xs.length; i++) {
      x = xs[i];
      for (j = 0; j < ys.length; j++) {
        y = ys[j];
        ctx.ops++;
        if (!_composedFree(x, y, w, h, ctx.placed, ctx.W, ctx.H, ctx.gap)) continue;
        if (slot.minSame > 0 && _composedNearestSame(ctx, slot.photo, x + w / 2, y + h / 2) < slot.minSame) continue;
        sc = _composedScoreSpot(ctx, slot, x, y, w, h);
        if (!best || sc < best.sc - 1e-9) best = { x: x, y: y, sc: sc };
      }
    }
    return best;
  }

  // 사다리를 다 놓은 뒤 남은 빈틈에 **그 사진이 쓸 수 있는 가장 작은 등급**을 더 넣는다 (0~COMPOSED_EXTRA_MAX).
  // 사진은 지금까지 가장 적게 나온 것부터 — 장수가 한쪽으로 쏠리지 않게. 둘레가 충분히 닿는
  // 자리(= 진짜 빈틈)만 받는다. 크기를 줄여 억지로 끼우지는 않는다.
  function _composedPlaceExtras(ctx) {
    var added = 0, guard, order, i, k, tmp, gi, ph, cell, slot, spot, done;
    for (guard = 0; guard < COMPOSED_EXTRA_MAX + 20; guard++) {
      if (added >= COMPOSED_EXTRA_MAX) break;
      order = [];
      for (i = 0; i < ctx.photos.length; i++) order.push(i);
      for (i = 1; i < order.length; i++) {          // 삽입 정렬 (장수 적은 순 · 동수면 입력 순)
        tmp = order[i];
        k = i - 1;
        while (k >= 0 && ctx.copies[order[k]] > ctx.copies[tmp]) { order[k + 1] = order[k]; k--; }
        order[k + 1] = tmp;
      }
      done = false;
      for (i = 0; i < order.length && !done; i++) {
        // 좁은 사진만 빈틈에 계속 들어가 한 사진이 10번 나오는 일을 막는다 (시뮬 실측 [2,10,2,4,2,4]).
        if (ctx.copies[order[i]] > ctx.copies[order[0]] + 1) break;
        ph = ctx.photos[order[i]];
        // 주문 보드에서 정한 장수 상한 — 빈틈 채움도 넘지 않는다 (계획만 막으면 여기서 다시 늘어난다).
        if (ph.maxCopies > 0 && ctx.copies[order[i]] >= ph.maxCopies) continue;
        for (gi = COMPOSED_GRADES_IN.length - 1; gi >= 0; gi--) { if (ph.window[gi]) break; }
        if (gi < 0) continue;
        cell = _composedCell(ph.aspect, COMPOSED_GRADES_IN[gi], ctx.rim);
        slot = { grade: gi, inch: COMPOSED_GRADES_IN[gi], photo: ph.index, spread: false, minSame: COMPOSED_EXTRA_SAME_MIN_MM * ctx.sameScale };
        spot = _composedBestSpot(ctx, slot, cell.w, cell.h);
        if (!spot) continue;
        if (_composedContact(spot.x, spot.y, cell.w, cell.h, ctx.placed, ctx.W, ctx.H, ctx.gap) < COMPOSED_EXTRA_MIN_CONTACT) continue;
        _composedPut(ctx, { kind: "photo", photo: ph.index, grade: gi, inch: COMPOSED_GRADES_IN[gi],
                            x: spot.x, y: spot.y, w: cell.w, h: cell.h,
                            artW: cell.artW, artH: cell.artH, extra: true });
        added++;
        done = true;
      }
      if (!done) break;
    }
    return added;
  }

  // 말풍선 자리 (2026-09-17) — 사다리 사진 뒤 · 빈틈 추가 사진 앞에 부른다. 말풍선마다 COMPOSED_BUBBLE_SIZES_MM 의
  // 큰 크기부터 들어갈 자리를 찾고, 없으면 다음 크기 (다 안 되면 거기서 멈춘다). 박스 = 그림(긴 변 = 크기, 비율 = 그 말풍선)
  // + 2 × pad. 자리 = 스티커 가장자리 COMPOSED_DECO_NEAR_MM 안(빈틈)이면서 다른 말풍선과 COMPOSED_BUBBLE_SPACING_MM 이상
  // 떨어진 곳 중 이웃에 꼭 맞는 곳 (아래쪽을 조금 더 — 데코와 같은 점수). 후보 = 이웃에 붙는 자리 + 데코 격자.
  // bubble = { want, motifs: [모양], aspects: [폭 ÷ 높이], pad (mm) }. 반환 = 놓은 개수.
  function _composedPlaceBubbles(ctx, bubble) {
    var n = 0, best, si, L, asp, w, h, xs, ys, xi, yi, x, y, cx, cy, near, bd, i, p, gain;
    while (n < bubble.want && n < bubble.motifs.length) {
      best = null;
      asp = bubble.aspects[n];
      for (si = 0; si < COMPOSED_BUBBLE_SIZES_MM.length && !best; si++) {
        L = COMPOSED_BUBBLE_SIZES_MM[si];
        w = (asp >= 1 ? L : L * asp) + 2 * bubble.pad;
        h = (asp >= 1 ? L / asp : L) + 2 * bubble.pad;
        xs = _composedAxis(w, ctx.W, ctx.placed, ctx.gap, true, COMPOSED_DECO_GRID_MM);
        ys = _composedAxis(h, ctx.H, ctx.placed, ctx.gap, false, COMPOSED_DECO_GRID_MM);
        for (xi = 0; xi < xs.length; xi++) {
          for (yi = 0; yi < ys.length; yi++) {
            x = xs[xi];
            y = ys[yi];
            ctx.ops++;
            if (!_composedFree(x, y, w, h, ctx.placed, ctx.W, ctx.H, ctx.gap)) continue;
            cx = x + w / 2;
            cy = y + h / 2;
            near = 99;
            bd = 80;
            for (i = 0; i < ctx.placed.length; i++) {
              p = ctx.placed[i];
              if (p.kind === "bubble") bd = Math.min(bd, _composedDist(cx, cy, p.x + p.w / 2, p.y + p.h / 2));
              else near = Math.min(near, _composedEdgeDist(x, y, w, h, p));
            }
            if (near > COMPOSED_DECO_NEAR_MM || bd < COMPOSED_BUBBLE_SPACING_MM) continue;
            gain = 10 * _composedContact(x, y, w, h, ctx.placed, ctx.W, ctx.H, ctx.gap) + 0.3 * bd + 8 * (cy / ctx.H);
            if (!best || gain > best.gain) best = { gain: gain, x: x, y: y, w: w, h: h, size: L };
          }
        }
      }
      if (!best) break;
      _composedPut(ctx, { kind: "bubble", x: best.x, y: best.y, w: best.w, h: best.h, size: best.size, motif: bubble.motifs[n] });
      n++;
    }
    return n;
  }

  // 사진이 못 들어갈 만큼 작은 틈에만 데코를 넣는다 (스티커 가장자리 COMPOSED_DECO_NEAR_MM 안).
  // 격자 후보까지 보는 이유: 데코는 이웃에 딱 붙지 않고 틈 가운데 떠 있는 자리가 더 자연스럽다.
  // 박스 크기는 스타일과 무관하다 — bubble 은 박스 안쪽 칼선 여백(payload.pad)만큼 작게 그린다 (박스를 키우면 데코가 덜 들어갔다).
  // 말풍선은 데코처럼 떨어뜨린다 (COMPOSED_DECO_SPACING_MM — 작은 데코가 말풍선 옆에 몰리지 않게).
  // 데코 박스 (mm) = 그림 + 2 × pad. 그림은 박스에서 pad 만큼 안쪽에 그려진다 (bubble = 칼선 여백, retro = 0).
  // 그림 사다리는 스타일이 정한다 (style.decoArt, 없으면 COMPOSED_DECO_SIZES_MM).
  function _composedDecoSizes(style, pad) {
    var art = (style && style.decoArt) ? style.decoArt : COMPOSED_DECO_SIZES_MM, out = [], i;
    for (i = 0; i < art.length; i++) out.push(Math.round((art[i] + 2 * pad) * 100) / 100);
    return out;
  }

  function _composedPlaceDecos(ctx, want) {
    var n = 0, best, zi, sz, xs, ys, xi, yi, x, y, cx, cy, near, decoD, i, p, gain, gx, gy;
    while (n < want) {
      best = null;
      for (zi = 0; zi < ctx.decoSizes.length; zi++) {
        sz = ctx.decoSizes[zi];
        xs = [];
        for (gx = 0; gx + sz <= ctx.W + EPS; gx += COMPOSED_DECO_GRID_MM) xs.push(gx);
        ys = [];
        for (gy = 0; gy + sz <= ctx.H + EPS; gy += COMPOSED_DECO_GRID_MM) ys.push(gy);
        for (xi = 0; xi < xs.length; xi++) {
          for (yi = 0; yi < ys.length; yi++) {
            x = xs[xi];
            y = ys[yi];
            ctx.ops++;
            if (!_composedFree(x, y, sz, sz, ctx.placed, ctx.W, ctx.H, ctx.gap)) continue;
            cx = x + sz / 2;
            cy = y + sz / 2;
            near = 99;
            decoD = 60;
            for (i = 0; i < ctx.placed.length; i++) {
              p = ctx.placed[i];
              if (p.kind === "deco" || p.kind === "bubble") decoD = Math.min(decoD, _composedDist(cx, cy, p.x + p.w / 2, p.y + p.h / 2));
              else near = Math.min(near, _composedEdgeDist(x, y, sz, sz, p));
            }
            if (near > COMPOSED_DECO_NEAR_MM || decoD < COMPOSED_DECO_SPACING_MM) continue;
            gain = 10 * _composedContact(x, y, sz, sz, ctx.placed, ctx.W, ctx.H, ctx.gap) +
                   0.5 * Math.min(decoD, 50) + 8 * (cy / ctx.H) + 0.8 * sz;
            if (!best || gain > best.gain) best = { gain: gain, x: x, y: y, sz: sz };
          }
        }
      }
      if (!best) break;
      _composedPut(ctx, { kind: "deco", x: best.x, y: best.y, w: best.sz, h: best.sz, motif: n });
      n++;
    }
    return n;
  }

  // 배치 한 판 — 결정적. input.layout = _composedLayoutSpec 결과 (스타일 · 이름 위치 · 섞기. 뒤집기는 _packComposed 가 한다).
  // 순서 = 이름(위 · 왼쪽/가운데/오른쪽) → 등급 내림차순 슬롯(큰 것부터) → 말풍선 → 빈틈 추가 사진 → 데코.
  function _composedLayout(input) {
    var spec = input.layout ? input.layout : _composedLayoutSpec(null);
    var si = _composedStyleIndex(spec.style);
    var ctx = { W: input.W, H: input.H, gap: input.gap, rim: input.rim, photos: input.photos,
                decoSizes: input.decoSizes || COMPOSED_DECO_SIZES_MM,
                placed: [], copies: [], area: [], repel: [], missing: [], skipped: [], ops: 0,
                sameScale: _composedSameScale(input.photos.length),
                style: spec.style, pull: COMPOSED_STYLES[si].pull, seed: spec.seed, nameBottom: 0 };
    ctx.dupMin = COMPOSED_DUP_MIN_MM * ctx.sameScale;
    var i, nm, nx, usable, slots, s, ph, cell, spot, cx4, cy4;
    for (i = 0; i < ctx.photos.length; i++) { ctx.copies.push(0); ctx.area.push(0); }
    if (input.name) {
      nx = 0;
      if (spec.namePos === "center") nx = (ctx.W - input.name.w) / 2;
      else if (spec.namePos === "right") nx = ctx.W - input.name.w;
      nm = { kind: "name", x: nx, y: 0, w: input.name.w, h: input.name.h };
      _composedPut(ctx, nm);
      ctx.repel.push(nm);
      ctx.nameBottom = input.name.h;
    }
    // 시트 네 모서리를 반발점으로 — 없으면 "가장 먼 자리"가 늘 구석이라 큰 조각이 귀퉁이로 몰린다.
    // 모으기·가장자리는 큰 조각이 가운데·가장자리로 가야 하므로 모서리를 막지 않는다.
    cx4 = [0, ctx.W, 0, ctx.W];
    cy4 = [0, 0, ctx.H, ctx.H];
    if (ctx.style !== "cluster" && ctx.style !== "frame") {
      for (i = 0; i < 4; i++) ctx.repel.push({ x: cx4[i], y: cy4[i], w: 0, h: 0 });
    }
    usable = ctx.W * ctx.H - (input.name ? input.name.w * input.name.h : 0);
    var plan = _composedPlanSlots(ctx.photos, input.mainIndex, usable, ctx.rim, input.spreadCount, input.dropCount);
    ctx.gradeCounts = plan.counts;
    slots = plan.slots;
    for (i = 0; i < slots.length; i++) {
      s = slots[i];
      ph = ctx.photos[s.photo];
      cell = _composedCell(ph.aspect, s.inch, ctx.rim);
      if (s.fill) s.minSame = COMPOSED_FILL_SAME_MIN_MM * ctx.sameScale;
      spot = _composedBestSpot(ctx, s, cell.w, cell.h);
      if (!spot) {
        // 채움 조각은 빠져도 사진은 이미 최소 장수를 가졌다 — 누락(재시도 대상)이 아니라 건너뜀으로 센다.
        if (s.fill) ctx.skipped.push(ph.letter + " " + s.inch + "\"");
        else ctx.missing.push(ph.letter + " " + s.inch + "\"");
        continue;
      }
      _composedPut(ctx, { kind: "photo", photo: s.photo, grade: s.grade, inch: s.inch,
                          x: spot.x, y: spot.y, w: cell.w, h: cell.h,
                          artW: cell.artW, artH: cell.artH, extra: false });
      if (s.spread) ctx.repel.push(ctx.placed[ctx.placed.length - 1]);
    }
    // 말풍선은 빈틈 추가 사진보다 먼저 (2026-09-17 사용자) — 데코 개수 안에서 센다.
    ctx.bubbles = (input.bubble && input.bubble.want > 0) ? _composedPlaceBubbles(ctx, input.bubble) : 0;
    ctx.extras = _composedPlaceExtras(ctx);
    if (input.decoWant > ctx.bubbles) _composedPlaceDecos(ctx, input.decoWant - ctx.bubbles);
    return ctx;
  }

  // 데코 모양 — 스타일 순서(decoOrder)를 start 자리부터 돌며 아직 안 쓴 것 (다 쓰면 처음부터).
  // start = 시작 자리 (_composedDecoStart, 없으면 0). start 0 이면 예전 결과 그대로 (retro 는 order[k % n]).
  // 글씨 말풍선은 작은 칸에 넣지 않는다 — 따로 큰 자리에 넣는다 (_composedPlaceBubbles · _composedBubblePlan).
  function _composedDecoMotif(style, used, start) {
    var order = style.decoOrder, len = order.length, pass, i, n;
    var s0 = (start > 0) ? Math.floor(start) % len : 0;
    for (pass = 0; pass < 2; pass++) {
      for (i = 0; i < len; i++) {
        n = order[(s0 + i) % len];
        if (used["$" + n]) continue;
        used["$" + n] = true;
        return n;
      }
      for (i = 0; i < len; i++) used["$" + order[i]] = false;   // 한 바퀴 다 썼다 — 다시 처음부터
    }
    return order[s0];
  }

  // 스티커 이름 → 0~65520 정수. 이름 글자(대문자)만 쓴다 — 배치와 상관없이 미리보기와 Illustrator 가 같은 값을 얻는다.
  function _composedNameHash(heroSpec) {
    var h = 0, i, s;
    if (!heroSpec || !heroSpec.chars) return 0;
    s = heroSpec.chars.join("");
    for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 65521;
    return h;
  }

  // 데코 시작 자리 (2026-09-17 사용자) — 스티커 이름마다 다른 데코로 시작하고, 다음 시트는 앞 시트가 쓸 수 있는
  // COMPOSED_DECO_MAX 칸 바로 뒤에서 이어 간다 → 순서가 그 두 배 이상이면 두 장까지 시트끼리 데코가 겹치지 않는다
  // (모자라면 셋째 장부터 다시 돈다). 예전에는 시트마다 순서 맨 앞에서 시작해 앞 몇 종만 나왔고, 여러 장 주문은 시트마다
  // 데코가 같았다. sheetIndex = 몇 번째 시트인지 (0부터, 없으면 0).
  function _composedDecoStart(heroSpec, sheetIndex) {
    var style = heroSpec ? _nameStyle(heroSpec.nameStyle) : null, len, k;
    if (!style || !heroSpec.chars) return 0;
    len = style.decoOrder.length;
    k = (sheetIndex > 0) ? Math.floor(sheetIndex) : 0;
    return (_composedNameHash(heroSpec) % len + k * Math.min(COMPOSED_DECO_MAX, len)) % len;
  }

  // 말풍선 시작 자리 — 데코와 같은 규칙으로 시트마다 COMPOSED_BUBBLE_MAX 칸씩 (여섯 종이면 세 장까지 겹치지 않는다).
  function _composedBubbleStart(heroSpec, sheetIndex) {
    var style = heroSpec ? _nameStyle(heroSpec.nameStyle) : null, len, k;
    if (!style || !heroSpec.chars || !style.bubbleOrder || !style.bubbleOrder.length) return 0;
    len = style.bubbleOrder.length;
    k = (sheetIndex > 0) ? Math.floor(sheetIndex) : 0;
    return (_composedNameHash(heroSpec) % len + k * Math.min(COMPOSED_BUBBLE_MAX, len)) % len;
  }

  // 이번 시트 말풍선 — start 자리부터 want 개 (순서 길이까지). 반환 { want, motifs, aspects }.
  // 표에 비율이 없는 모양은 조용히 넘기지 않고 멈춘다 (라이브러리를 고치고 표를 안 고친 것).
  function _composedBubblePlan(style, start, want) {
    var order = style.bubbleOrder, out = { want: 0, motifs: [], aspects: [] }, i, n, a;
    if (!order || !order.length || !(want > 0)) return out;
    for (i = 0; i < want && i < order.length; i++) {
      n = order[(Math.floor(start) + i) % order.length];
      a = style.bubbleAspect ? style.bubbleAspect[n] : 0;
      if (!(a > 0) || !isFinite(a)) throw new Error("말풍선 '" + n + "' 의 그림 비율이 표에 없습니다 (" + style.key + ")");
      out.motifs.push(n);
      out.aspects.push(a);
    }
    out.want = out.motifs.length;
    return out;
  }

  // 남은 빈 곳 중 가장 큰 정사각형의 한 변(mm, 1mm 격자). 클수록 시트에 죽은 공간이 있다는 뜻.
  function _composedLargestEmpty(placed, W, H, gap) {
    var gw = Math.floor(W), gh = Math.floor(H), blocked = [], dp = [], i, x, y, x0, x1, y0, y1, p, up, left, ul, best = 0;
    for (i = 0; i < gw * gh; i++) { blocked.push(0); dp.push(0); }
    for (i = 0; i < placed.length; i++) {
      p = placed[i];
      x0 = Math.max(0, Math.floor(p.x - gap));
      x1 = Math.min(gw, Math.ceil(p.x + p.w + gap));
      y0 = Math.max(0, Math.floor(p.y - gap));
      y1 = Math.min(gh, Math.ceil(p.y + p.h + gap));
      for (y = y0; y < y1; y++) { for (x = x0; x < x1; x++) blocked[y * gw + x] = 1; }
    }
    for (y = 0; y < gh; y++) {
      for (x = 0; x < gw; x++) {
        i = y * gw + x;
        if (blocked[i]) continue;
        up = y > 0 ? dp[i - gw] : 0;
        left = x > 0 ? dp[i - 1] : 0;
        ul = (x > 0 && y > 0) ? dp[i - gw - 1] : 0;
        dp[i] = 1 + Math.min(up, Math.min(left, ul));
        if (dp[i] > best) best = dp[i];
      }
    }
    return best;
  }

  // 판 요약 (보고용). v1 의 변형 비교 점수는 없앴다 — 배치가 결정적이라 비교할 대상이 없다.
  function _composedEvaluate(ctx) {
    var i, j, p, q, d, minDup = 999, photos = 0, decos = 0, bubbles = 0, extras = 0, area = 0, artArea = 0;
    var list = [];
    for (i = 0; i < ctx.placed.length; i++) {
      p = ctx.placed[i];
      if (p.kind === "deco") { decos++; continue; }
      if (p.kind === "bubble") { bubbles++; continue; }
      if (p.kind !== "photo") continue;
      photos++;
      if (p.extra) extras++;
      area += p.w * p.h;
      artArea += p.artW * p.artH;
      list.push(p);
    }
    for (i = 0; i < list.length; i++) {
      for (j = 0; j < i; j++) {
        if (list[i].photo !== list[j].photo) continue;
        d = _composedDist(list[i].x + list[i].w / 2, list[i].y + list[i].h / 2,
                          list[j].x + list[j].w / 2, list[j].y + list[j].h / 2);
        if (d < minDup) minDup = d;
      }
    }
    q = _composedLargestEmpty(ctx.placed, ctx.W, ctx.H, ctx.gap);
    return { photos: photos, extras: extras, decos: decos, bubbles: bubbles, minDup: minDup, hole: q,
             cellFill: area / (ctx.W * ctx.H), artFill: artArea / (ctx.W * ctx.H) };
  }

  // 칼선 비율 = (relW / relH) × 캔버스 비율. 캐시 값이 비정상이면 null — 호출부가 사진 이름과 함께 멈춘다.
  // (하린_25_S.evcut 처럼 relW/relH 가 0.0001 인 손상 기록이 실제로 있다. 크기를 여기서 정하므로 그냥 쓰면 안 된다.)
  function _composedCutAspect(canvasAspect, cutInfo) {
    if (!cutInfo || !(canvasAspect > 0) || !isFinite(canvasAspect)) return 0;
    var rw = cutInfo.relW, rh = cutInfo.relH;
    if (!isFinite(rw) || !isFinite(rh) || !isFinite(cutInfo.relL) || !isFinite(cutInfo.relT)) return 0;
    if (rw < COMPOSED_CUT_REL_MIN || rw > 1.01 || rh < COMPOSED_CUT_REL_MIN || rh > 1.01) return 0;
    // 백만분의 1 로 맞춘다 — .evcut 숫자를 Illustrator 와 미리보기(Python)가 따로 읽어 마지막 자리가 달라도 같은 판이 나오게.
    return Math.round((rw / rh) * canvasAspect * 1e6) / 1e6;
  }

  // 미리보기와 시트 생성이 함께 쓰는 배치 영역 (pt) — 같은 식으로 계산해야 같은 판이 나온다 (_runComposed 참고).
  function _composedPreviewBin() {
    return { w: (COMPOSED_PREVIEW_BODY_MM[0] - 2 * BODY_PADDING_X_MM) * MM_TO_PT,
             h: (COMPOSED_PREVIEW_BODY_MM[1] - 2 * BODY_PADDING_Y_MM) * MM_TO_PT };
  }

  // 메인 사진 index. 기본 = 목록 첫 사진, 운영자가 고른 base 가 있으면 그것. 선택 밖이면 -1.
  function _composedMainIndex(pairsArg, mainBase) {
    if (!mainBase) return 0;
    for (var i = 0; i < pairsArg.length; i++) if (pairsArg[i].base === mainBase) return i;
    return -1;
  }

  // 실제 칼선 bounds 를 계획 셀에 딱 맞추는 균일 배율·중심 이동 (늘리기·줄이기 둘 다).
  // bounds = Illustrator [L, T, R, B] (y 위로). cellTop 도 AI 좌표. 사진과 칼선에 같은 매트릭스를 쓴다.
  function _composedFitAdjustment(bounds, cellX, cellTop, cellW, cellH) {
    var bw = bounds[2] - bounds[0], bh = bounds[1] - bounds[3];
    if (!isFinite(bw) || !isFinite(bh) || !(bw > 0) || !(bh > 0)) throw new Error("실제 칼선 크기가 0 이하입니다");
    return { cx: (bounds[0] + bounds[2]) / 2, cy: (bounds[1] + bounds[3]) / 2,
             scale: Math.min(cellW / bw, cellH / bh), tx: cellX + cellW / 2, ty: cellTop - cellH / 2 };
  }

  // 엔진과 별개로 결과를 다시 검사한다 (치수·시트 밖·간격·등급 구성·누락 보고).
  function _composedValidate(res, pairsArg, binW, binH, gap) {
    var eps = 0.001 * MM_TO_PT, boxes = [], i, j, a, ba, bb, sepX, sepY, want, got, g, ok;
    for (i = 0; i < res.placed.length; i++) {
      a = res.placed[i];
      if (!isFinite(a.x) || !isFinite(a.y) || !(a.w > 0) || !(a.h > 0)) return "비정상 박스: " + a.payload.base;
      if (a.x < -eps || a.y < -eps || a.x + a.w > binW + eps || a.y + a.h > binH + eps) return "박스가 시트 영역을 벗어남: " + a.payload.base;
      if (a.rotated) return "사진 회전 금지: " + a.payload.base;
      ok = false;
      for (g = 0; g < COMPOSED_GRADES_IN.length; g++) if (COMPOSED_GRADES_IN[g] === a.inch) ok = true;
      if (!ok) return "사다리에 없는 인치: " + a.payload.base + " " + a.inch;
      if (COMPOSED_GRADES_IN[a.grade] !== a.inch) return "등급과 인치가 안 맞음: " + a.payload.base + " " + a.inch;
      if (res.windows && res.windows[a.photo] && !res.windows[a.photo][a.grade]) {
        return "크기 범위 밖: " + a.payload.base + " " + a.inch + "\" (" +
          ((res.ranges && res.ranges[a.photo]) ? "직접 " + _composedRangeLabel(res.ranges[a.photo]) : _composedTypeLabel(res.types[a.photo])) + ")";
      }
      // 셀 = 사진 박스 + 2×rim 이 계약이다. 어긋나면 Illustrator 쪽 fit 이 틀어진다.
      if (Math.abs(a.w - (a.artW + 2 * res.rimPt)) > eps || Math.abs(a.h - (a.artH + 2 * res.rimPt)) > eps) {
        return "셀과 사진 박스가 안 맞음: " + a.payload.base;
      }
      // 긴 변 = 등급 인치 (짧은 변 하한에 걸린 경우만 예외 — 그때는 더 커진다).
      if (Math.max(a.artW, a.artH) < a.inch * 25.4 * MM_TO_PT - eps) return "긴 변이 등급보다 작음: " + a.payload.base + " " + a.inch;
      boxes.push({ x: a.x, y: a.y, w: a.w, h: a.h, name: a.payload.base + " " + a.inch + "\"" });
    }
    for (i = 0; i < res.decos.length; i++) {
      a = res.decos[i];
      if (a.x < -eps || a.y < -eps || a.x + a.w > binW + eps || a.y + a.h > binH + eps) return "데코가 시트 영역을 벗어남";
      boxes.push({ x: a.x, y: a.y, w: a.w, h: a.h, name: "데코 " + a.payload.deco });
    }
    if (res.nameBox) {
      a = res.nameBox;
      if (a.x < -eps || a.y < -eps || a.x + a.w > binW + eps || a.y + a.h > binH + eps) return "이름이 시트 영역을 벗어남";
      boxes.push({ x: a.x, y: a.y, w: a.w, h: a.h, name: "이름" });
    }
    for (i = 0; i < boxes.length; i++) {
      for (j = 0; j < i; j++) {
        ba = boxes[i];
        bb = boxes[j];
        sepX = ba.x + ba.w + gap <= bb.x + eps || bb.x + bb.w + gap <= ba.x + eps;
        sepY = ba.y + ba.h + gap <= bb.y + eps || bb.y + bb.h + gap <= ba.y + eps;
        if (!sepX && !sepY) return "박스 간격 " + (gap / MM_TO_PT) + "mm 미만: " + ba.name + " / " + bb.name;
      }
    }
    // 계획 장수 = 실제 배치 + 누락. 조용히 빠지는 슬롯이 없어야 한다.
    want = 0;
    for (g = 0; g < res.gradeCounts.length; g++) want += res.gradeCounts[g];
    got = res.placed.length - res.extras;
    var skippedN = res.skipped ? res.skipped.length : 0;
    if (got + res.missing.length + skippedN !== want) {
      return "계획 " + want + "장 · 배치 " + got + "장 · 누락 보고 " + res.missing.length + "장 · 건너뜀 " + skippedN + "장 — 합이 안 맞음";
    }
    if (res.extras > COMPOSED_EXTRA_MAX) return "추가 사진 상한 초과: " + res.extras + "장";
    return "";
  }

  // Composed 배치 입구 (시트 한 장). pairsArg = 이 시트의 사진 1~COMPOSED_PER_SHEET 장(선택 순서),
  // 각 pair.cutAspect(없으면 pair.aspect). 더 많으면 호출부가 _composedDeal 로 먼저 나눈다.
  // extras = { hero: {w, h} (pt) | null, decoWant, rimPt, layout (배치 선택 — 없으면 기본),
  //            bubbleWant · bubbleStart (말풍선 개수 · 시작 자리 — 없으면 말풍선 없음, 데코 개수 안에서 센다) }.
  // 반환 좌표·치수는 pt (body 좌상단 원점, y 아래로). res.layout = 정리된 배치 선택, res.sig = 배치 지문.
  function _packComposed(pairsArg, mainIndex, binW, binH, gap, extras) {
    if (!pairsArg || pairsArg.length < 1 || pairsArg.length > COMPOSED_PER_SHEET) {
      throw new Error("Composed 시트 한 장의 사진은 1~" + COMPOSED_PER_SHEET + "장입니다 (지금 " + (pairsArg ? pairsArg.length : 0) + "장).");
    }
    if (!(mainIndex >= 0) || mainIndex >= pairsArg.length) throw new Error("메인 사진 index 가 범위를 벗어났습니다: " + mainIndex);
    if (!(binW > 0) || !(binH > 0) || !(gap >= 0) || !isFinite(binW + binH + gap)) throw new Error("유효하지 않은 시트 영역 또는 간격");
    if (!extras) extras = {};
    var layout = _composedLayoutSpec(extras.layout);
    if (!layout) throw new Error("배치 선택 값이 이상합니다 (스타일·이름 위치·좌우 바꿈·섞기 번호)");
    var nameStyle = _nameStyle(extras.nameStyle);
    if (!nameStyle) throw new Error("알 수 없는 이름 스타일: " + extras.nameStyle);
    var start = new Date().getTime(), i, photos = [], aspect, rng, cap;
    for (i = 0; i < pairsArg.length; i++) {
      aspect = pairsArg[i].cutAspect > 0 ? pairsArg[i].cutAspect : pairsArg[i].aspect;
      if (!(aspect > 0) || !isFinite(aspect)) throw new Error("사진 비율을 알 수 없습니다: " + pairsArg[i].base);
      rng = null;
      if (pairsArg[i].sizeRange) {
        rng = _composedSizeRange(pairsArg[i].sizeRange);
        if (!rng) throw new Error("크기 범위 값이 이상합니다: " + pairsArg[i].base);
      }
      cap = 0;
      if (pairsArg[i].maxCopies) {
        cap = _composedCopyCap(pairsArg[i].maxCopies);
        if (!cap) throw new Error("장수 상한 값이 이상합니다: " + pairsArg[i].base);
      }
      photos.push({ index: i, letter: "ABCDEF".charAt(i), aspect: aspect,
                    type: pairsArg[i].shotType || COMPOSED_TYPE_NONE, range: rng, maxCopies: cap,
                    window: rng ? _composedRangeWindow(rng) : _composedTypeWindow(pairsArg[i].shotType || COMPOSED_TYPE_NONE) });
    }
    var hero = null;
    if (extras.hero && extras.hero.w > 0 && extras.hero.h > 0) hero = { w: extras.hero.w / MM_TO_PT, h: extras.hero.h / MM_TO_PT };
    var decoWant = 0;
    if (hero && extras.decoWant > 0) decoWant = extras.decoWant;
    var rimMm = (extras.rimPt > 0) ? extras.rimPt / MM_TO_PT : 0;
    // 이름·데코 박스 안쪽 여백 (bubble = 칼선 여백). 이름 박스 치수에는 이미 들어 있고(_composedPackExtras),
    // 데코 박스는 크기 그대로 — 둘 다 그리기가 이만큼 안쪽에 그린다.
    var namePad = (hero && extras.hero.pad > 0) ? extras.hero.pad : 0;
    var decoPad = (hero && extras.decoPad > 0) ? extras.decoPad : 0;
    var decoStart = (extras.decoStart > 0 && isFinite(extras.decoStart)) ? Math.floor(extras.decoStart) : 0;
    var bubbleStart = (extras.bubbleStart > 0 && isFinite(extras.bubbleStart)) ? Math.floor(extras.bubbleStart) : 0;
    var bubbleWant = (decoWant > 0 && extras.bubbleWant > 0) ? Math.min(Math.floor(extras.bubbleWant), COMPOSED_BUBBLE_MAX, decoWant) : 0;
    var bubble = _composedBubblePlan(nameStyle, bubbleStart, bubbleWant);
    bubble.pad = decoPad / MM_TO_PT;
    var input = { W: binW / MM_TO_PT, H: binH / MM_TO_PT, gap: gap / MM_TO_PT, rim: rimMm, photos: photos,
                  mainIndex: mainIndex, name: hero, decoWant: decoWant, layout: layout, bubble: bubble,
                  decoSizes: _composedDecoSizes(nameStyle, decoPad / MM_TO_PT) };   // decoPad 는 pt — 박스 계산은 mm
    // 계획한 조각이 다 안 들어가면(빠진 슬롯) 먼저 ④에서 마지막에 넣은 조각을 1~2장 빼고 다시 돌린다 —
    // 곧장 분산을 줄이면 작은 얼굴들이 한곳에 뭉쳤다(EVS-1007 실측 21mm). 그래도 안 되면 분산을 줄인다.
    // 덜 빠진 판을 쓴다 (보통은 한두 판으로 끝).
    var spreadTries = [COMPOSED_SPREAD_COUNT, COMPOSED_SPREAD_COUNT, COMPOSED_SPREAD_COUNT, Math.ceil(COMPOSED_SPREAD_COUNT / 2), 0];
    var dropTries = [0, 1, 2, 0, 0], st = null, tryIdx, cand, runs = 0, opsAll = 0;
    for (tryIdx = 0; tryIdx < spreadTries.length; tryIdx++) {
      input.spreadCount = spreadTries[tryIdx];
      input.dropCount = dropTries[tryIdx];
      cand = _composedLayout(input);
      runs++;
      opsAll += cand.ops;
      if (!st || cand.missing.length < st.missing.length) { st = cand; st.spreadCount = spreadTries[tryIdx]; }
      if (st.missing.length === 0) break;
    }
    var ev = _composedEvaluate(st);
    var placed = [], decos = [], nameBox = null, counts = [], area = 0, extraCount = 0, p, box, types = [], windows = [], ranges = [];
    var decoUsed = {}, bubbleCount = 0;
    for (i = 0; i < photos.length; i++) {
      counts.push(0);
      types.push(photos[i].type);
      windows.push(photos[i].window);
      ranges.push(photos[i].range);
    }
    for (i = 0; i < st.placed.length; i++) {
      p = st.placed[i];
      box = { x: p.x * MM_TO_PT, y: p.y * MM_TO_PT, w: p.w * MM_TO_PT, h: p.h * MM_TO_PT };
      if (p.kind === "photo") {
        placed.push({ x: box.x, y: box.y, w: box.w, h: box.h, payload: pairsArg[p.photo], photo: p.photo,
                      grade: p.grade, inch: p.inch, artW: p.artW * MM_TO_PT, artH: p.artH * MM_TO_PT,
                      extra: p.extra, rotated: false });
        counts[p.photo]++;
        area += box.w * box.h;
        if (p.extra) extraCount++;
      } else if (p.kind === "deco") {
        decos.push({ x: box.x, y: box.y, w: box.w, h: box.h,
                     payload: { base: "__DECO_" + (decos.length + 1) + "__", isDeco: true,
                                deco: _composedDecoMotif(nameStyle, decoUsed, decoStart),
                                style: nameStyle.key, pad: decoPad } });
      } else if (p.kind === "bubble") {
        // 말풍선도 데코 목록에 (그리기·미리보기·검사가 같은 길을 탄다). sizeMm = 그림의 긴 변.
        decos.push({ x: box.x, y: box.y, w: box.w, h: box.h,
                     payload: { base: "__DECO_" + (decos.length + 1) + "__", isDeco: true, bubble: true, sizeMm: p.size,
                                deco: p.motif, style: nameStyle.key, pad: decoPad } });
        bubbleCount++;
      } else if (p.kind === "name") {
        nameBox = box;
      }
    }
    if (layout.mirror) {
      _composedMirrorBoxes(placed, binW);
      _composedMirrorBoxes(decos, binW);
      if (nameBox) _composedMirrorBoxes([nameBox], binW);
    }
    var res = { placed: placed, decos: decos, nameBox: nameBox, counts: counts, area: area, rimPt: rimMm * MM_TO_PT,
                fill: area / (binW * binH), extras: extraCount, missing: st.missing, skipped: st.skipped,
                gradeCounts: st.gradeCounts, types: types, windows: windows, ranges: ranges, evaluation: ev, ops: opsAll,
                runs: runs, spreadCount: st.spreadCount, layout: layout, nameStyle: nameStyle.key, namePad: namePad,
                decoStart: decoStart, bubbleStart: bubbleStart, bubbles: bubbleCount,
                mainIndex: mainIndex, method: "composed", ms: new Date().getTime() - start };
    var error = _composedValidate(res, pairsArg, binW, binH, gap);
    if (error) throw new Error("Composed 배치 검증 실패: " + error);
    res.sig = _composedLayoutSig(res);
    return res;
  }

  function _rangeAreaLabel(range) {
    var sizes = RANGE_SIZES_MM[range], parts = [];
    for (var i = 0; i < sizes.length; i++) parts.push(_inchStr(sizes[i]) + "²");
    return parts.join("·") + " (정사각 환산 · 최장변 " + _inchStr(RANGE_LONG_CAP_MM[range]) + ")";
  }

  // "56.6*/41.1/31.3/31.3mm · *=이름 합성 행"
  function _rangeRowSummary(rows) {
    var parts = [], hasMid = false;
    for (var i = 0; i < rows.length; i++) {
      parts.push((Math.round(rows[i].h / MM_TO_PT * 10) / 10) + (rows[i].mid ? "*" : ""));
      if (rows[i].mid) hasMid = true;
    }
    return parts.join("/") + "mm" + (hasMid ? " · *=이름 합성 행" : "");
  }

  // "1in × 12 / 1.25in × 8 / …"
  function _rangeSizeSummary(placed) {
    var sizes = [], counts = {};
    for (var i = 0; i < placed.length; i++) {
      var mm = placed[i].sizeMm;
      if (!counts[mm]) { sizes.push(mm); counts[mm] = 0; }
      counts[mm]++;
    }
    sizes.sort(function (a, b) { return a - b; });
    var parts = [];
    for (var s = 0; s < sizes.length; s++) parts.push(_inchStr(sizes[s]) + " × " + counts[sizes[s]]);
    return parts.join(" / ");
  }

  // "base(1in) × 6 / …" — 사진별 수량과 배정 크기
  function _rangePhotoSummary(placed) {
    var order = [], counts = {}, sizeOf = {};
    for (var i = 0; i < placed.length; i++) {
      var key = "$" + placed[i].payload.base;
      if (!counts[key]) { order.push(placed[i].payload.base); counts[key] = 0; sizeOf[key] = {}; }
      counts[key]++;
      sizeOf[key]["$" + placed[i].sizeMm] = placed[i].sizeMm;
    }
    var parts = [];
    for (var o = 0; o < order.length; o++) {
      var k = "$" + order[o];
      var mmList = [];
      for (var sk in sizeOf[k]) if (sizeOf[k].hasOwnProperty(sk)) mmList.push(sizeOf[k][sk]);
      mmList.sort(function (a, b) { return a - b; });
      var inch = [];
      for (var m = 0; m < mmList.length; m++) inch.push(_inchStr(mmList[m]));
      parts.push(order[o] + " (" + inch.join("·") + ") × " + counts[k]);
    }
    return parts.join(" / ");
  }

  // ═════════════════════════════════════════════════════════
  //  시트 생성 — mixed.jsx _produceSheet 의 사진 경로만 (이름 스티커·Package 분기 없음)
  // ═════════════════════════════════════════════════════════

  function _produceRangeSheet(ctx, sheetPairs, options, sIdx, sheetTotal, gapPt, cutMarginPt, inputFolder, stamp) {
    var doc = ctx.doc;

    // 시트 캐시 무효화 — 문서에 속한 PageItem 참조라 시트마다 비운다 (mixed.jsx 와 같은 이유).
    for (var cc = 0; cc < sheetPairs.length; cc++) {
      sheetPairs[cc].cachedCutline = null;
      sheetPairs[cc].cutInfo = null;
      sheetPairs[cc].cachedArtGroup = null;
      sheetPairs[cc].cachedSymbol = null;
      sheetPairs[cc].symbolError = null;
      sheetPairs[cc].cutCacheHit = false;
    }

    // 배치는 Adobe API 를 만지기 전에 끝낸다 — 실패하면 문서에 아무것도 남지 않는다.
    // 스티커 이름이 있으면 큰 레터 이름(16mm, 폭 상한 안으로 유닛 축소) 스펙을 엔진에 준다 —
    // 엔진(v3)이 이름 위치·양옆 세로 셀·데코 자리까지 한 번에 짠다. 이름이 없으면 데코도 없다 (mixed 규약).
    var nameSkipped = "", heroSpec = null;
    if (options.stickerName) {
      var ns = _rangeNameSpec(options.stickerName, ctx.binW, gapPt);
      if (ns && ns.skipped) nameSkipped = ns.skipped;
      else if (ns) heroSpec = _rangeHeroSpec(options.stickerName, Math.min(RANGE_HERO_MAX_W_MM, ctx.binW / MM_TO_PT - 2 * RANGE_MARGIN_X_MM) * MM_TO_PT) || ns;
    }
    var decoWant = heroSpec ? sheetPairs.length + DECO_EXTRA : 0;
    var extras = { candidate: options.candidate ? options.candidate : 0,
                   hero: heroSpec ? { w: heroSpec.cellW, h: heroSpec.cellH } : null,
                   decoMm: RANGE_DECO_SIZE_MM[options.range], decoWant: decoWant };
    var t0 = new Date().getTime();
    var packResult = _packRange(sheetPairs, options.range, ctx.binW, ctx.binH, gapPt, extras);
    var packMs = new Date().getTime() - t0;
    var band = packResult.band, decoPlaced = packResult.decos;
    var decoInfo = heroSpec ? { designs: sheetPairs.length, want: decoWant, placed: decoPlaced.length,
                                shortfall: decoWant - decoPlaced.length, sizeMm: RANGE_DECO_SIZE_MM[options.range] } : null;
    ctx.drawn = true;

    var printLayer = doc.layers.add();
    printLayer.name = "PrintData";
    var kissLayer = doc.layers.add();
    kissLayer.name = "KissCut";
    var cutSpot = _ensureCutContour(doc);

    var uniquePairs = _uniquePairsFromPlaced(packResult.placed);
    var drawnDesigns = 0;
    var failedBases = {};
    var drawnBases = {};
    var failedItems = [];
    var skippedPlacements = 0;
    var cutFixups = [];
    var cutFixCount = 0;
    var decoDrawn = 0;
    var nameInfo = null;
    var prevInteraction = app.userInteractionLevel;
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
    try {
      var traceFailures = _buildCutlineCache(doc, uniquePairs, cutSpot);
      for (var tf = 0; tf < traceFailures.length; tf++) {
        failedItems.push(traceFailures[tf]);
        failedBases[traceFailures[tf].base] = true;
      }

      for (var p = 0; p < packResult.placed.length; p++) {
        var pl = packResult.placed[p];
        if (failedBases[pl.payload.base]) {
          skippedPlacements++;
          continue;
        }
        var aiX = ctx.bL + ctx.padXPt + pl.x;
        var aiY = ctx.bT - ctx.padYPt - pl.y;
        try {
          var placedRef = _placePhotoSticker(doc, pl.payload, aiX, aiY, pl.w, pl.h, cutMarginPt, printLayer, kissLayer, cutSpot, pl.rotated);
          cutFixups.push({ emb: placedRef.emb, cut: placedRef.cut, placement: pl, x: aiX, y: aiY, w: pl.w, h: pl.h });
        } catch (ePlace) {
          failedItems.push({
            base: pl.payload.base,
            error: (ePlace && ePlace.message) ? ePlace.message : String(ePlace)
          });
        }
      }

      // 데코 — 사진 파이프라인(trace/embed/심볼)을 타지 않는다. 실패는 failedItems 로 (저장 차단).
      for (var dq = 0; dq < decoPlaced.length; dq++) {
        var dpl = decoPlaced[dq];
        try {
          _drawDecoSticker(doc, dpl.payload, ctx.bL + ctx.padXPt + dpl.x, ctx.bT - ctx.padYPt - dpl.y,
                           dpl.w, dpl.h, printLayer, kissLayer, cutSpot);
          decoDrawn++;
        } catch (eDeco) {
          failedItems.push({ base: "데코 " + dpl.payload.deco, error: (eDeco && eDeco.message) ? eDeco.message : String(eDeco) });
        }
      }
      // 큰 레터 이름 — 엔진이 정한 자리 (위 가운데). 양옆 세로 셀은 사진 목록에 들어 있어 위에서 이미 놓였다.
      if (heroSpec && band) {
        try {
          nameInfo = _drawArtLetterBlock(doc, heroSpec, ctx.bL + ctx.padXPt + band.heroX, ctx.bT - ctx.padYPt - band.heroY,
                                         printLayer, kissLayer, cutSpot);
        } catch (eName) {
          failedItems.push({ base: "이름", error: (eName && eName.message) ? eName.message : String(eName) });
        }
      }

      _safeRedrawAndGC();

      // 크기와 위치를 함께 확인한다. 보정 오류를 숨기지 않고 저장 차단 사유로 남긴다.
      for (var cf = 0; cf < cutFixups.length; cf++) {
        var FX = cutFixups[cf];
        try {
          var adjustment = _rangeCutAdjustment(FX.cut.geometricBounds, FX, cutMarginPt);
          if (!adjustment) continue;
          var fmat = app.concatenateMatrix(
            app.concatenateMatrix(app.getTranslationMatrix(-adjustment.cx, -adjustment.cy), app.getScaleMatrix(100 * adjustment.scale, 100 * adjustment.scale)),
            app.getTranslationMatrix(FX.x + FX.w / 2, FX.y - FX.h / 2)
          );
          FX.emb.transform(fmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
          FX.cut.transform(fmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
          cutFixCount++;
        } catch (eFix) {
          failedItems.push({ base: FX.placement.payload.base, error: "칼선 보정 실패: " + ((eFix && eFix.message) ? eFix.message : String(eFix)) });
        }
      }
    } finally {
      drawnDesigns = 0;
      for (var dp = 0; dp < cutFixups.length; dp++) {
        var dpay = cutFixups[dp].placement.payload;
        if (drawnBases["$" + dpay.base]) continue;
        drawnBases["$" + dpay.base] = true;
        drawnDesigns++;
      }
      try {
        _drawProductionHeader(options, drawnDesigns, ctx.headerRightText, sIdx + 1, sheetTotal);
      } catch (eHdr) {
        failedItems.push({ base: "헤더", error: "헤더 생성 실패: " + ((eHdr && eHdr.message) ? eHdr.message : String(eHdr)) });
      }
      _cleanupTraceStash(doc);
      // 아트 라이브러리는 여기서 반드시 닫는다 — 예외가 나도 열린 채 남기지 않는다 (mixed 와 동일).
      _closeArtLibs();
      app.userInteractionLevel = prevInteraction;
    }

    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eKiss) {}
    try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (ePrint) {}
    doc.selection = null;

    // 최종 실제 객체를 다시 읽는다. 계획이 올바르더라도 출력·보정 실패는 저장하지 않는다.
    var drawnPlacements = [];
    for (var ap = 0; ap < cutFixups.length; ap++) drawnPlacements.push(cutFixups[ap].placement);
    var outputErrors = _rangeAuditOutput(cutFixups, packResult.placed, sheetPairs, options.range, ctx, gapPt, cutMarginPt, packResult.rules);
    for (var oe = 0; oe < outputErrors.length; oe++) failedItems.push(outputErrors[oe]);

    var savedPath = "";
    var saveError = "";
    try {
      if (failedItems.length > 0) throw new Error("제작 검증 실패 " + failedItems.length + "건 — " + failedItems[0].error + " (문서를 확인하고 다시 생성하세요)");
      var outFolder = _resolveOutputFolder(inputFolder);
      var fileName = stamp + "_" + RANGE_TAGS[options.range] + "_sheet" + _pad2(sIdx + 1) + ".ai";
      var saveFile = new File(outFolder.fsName + "/" + fileName);
      _saveAi(doc, saveFile);
      savedPath = saveFile.fsName;
    } catch (eSave) {
      saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
    }

    var rotatedCount = 0;
    for (var rc = 0; rc < drawnPlacements.length; rc++) {
      if (drawnPlacements[rc].rotated) rotatedCount++;
    }
    var cutCacheHits = 0;
    var symbolOk = 0;
    for (var ch = 0; ch < uniquePairs.length; ch++) {
      if (uniquePairs[ch].cutCacheHit) cutCacheHits++;
      if (uniquePairs[ch].cachedSymbol) symbolOk++;
    }

    return {
      doc: doc,
      pairs: sheetPairs,
      packResult: packResult,
      packMs: packMs,
      savedPath: savedPath,
      saveError: saveError,
      failedItems: failedItems,
      skippedPlacements: skippedPlacements,
      cutFixCount: cutFixCount,
      rotatedCount: rotatedCount,
      uniqueCount: uniquePairs.length,
      drawnDesigns: drawnDesigns,
      drawnPlacements: drawnPlacements,
      cutCacheHits: cutCacheHits,
      symbolOk: symbolOk,
      nameSpec: heroSpec,
      nameSkipped: nameSkipped,
      nameInfo: nameInfo,
      band: band,
      decoInfo: decoInfo,
      decoDrawn: decoDrawn,
      decoPlaced: decoPlaced
    };
  }

  // Illustrator bounds = [left, top, right, bottom] (y는 위로 증가). NaN·사라진 객체도 거부한다.
  function _rangeReadBounds(bounds) {
    for (var i = 0; i < 4; i++) if (!isFinite(bounds[i])) throw new Error("유효하지 않은 실제 객체 좌표");
    if (!(bounds[2] > bounds[0]) || !(bounds[1] > bounds[3])) throw new Error("실제 객체 크기가 0 이하입니다");
    return { x: bounds[0], y: -bounds[1], w: bounds[2] - bounds[0], h: bounds[1] - bounds[3] };
  }

  function _rangeInsideBox(box, cell, eps) {
    return box.x >= cell.x - eps && box.y >= cell.y - eps && box.x + box.w <= cell.x + cell.w + eps && box.y + box.h <= cell.y + cell.h + eps;
  }

  function _rangeCutCell(record, inset) {
    var cell = { x: record.x + inset, y: -record.y + inset, w: record.w - 2 * inset, h: record.h - 2 * inset };
    if (!(inset >= 0) || !isFinite(inset) || !(cell.w > 0) || !(cell.h > 0)) throw new Error("칼선 여백이 배치 박스보다 큽니다");
    return cell;
  }

  function _rangeCutAdjustment(bounds, record, inset) {
    var box = _rangeReadBounds(bounds), cell = _rangeCutCell(record, inset);
    if (_rangeInsideBox(box, cell, 0.001 * MM_TO_PT)) return null;
    return { cx: box.x + box.w / 2, cy: -(box.y + box.h / 2), scale: Math.min(1, cell.w / box.w, cell.h / box.h) };
  }

  function _rangeAuditOutput(records, planned, pairsArg, range, ctx, gap, inset, rules) {
    var errors = [], cuts = [], perPhoto = {}, perType = {}, perPhotoSize = {}, expectedTypes = {};
    var minPer = (rules && rules.minPer) ? rules.minPer : RANGE_MIN_PER_PHOTO;
    var spreadMax = (rules && rules.spreadMax) ? rules.spreadMax : RANGE_SPREAD_MAX;
    var eps = 0.001 * MM_TO_PT;
    var body = { x: ctx.bL + ctx.padXPt, y: -(ctx.bT - ctx.padYPt), w: ctx.binW, h: ctx.binH };
    for (var p = 0; p < planned.length; p++) expectedTypes[planned[p].typeIndex] = (expectedTypes[planned[p].typeIndex] || 0) + 1;
    for (var i = 0; i < records.length; i++) {
      var r = records[i], pl = r.placement, base = pl.payload.base;
      try {
        _rangeReadBounds(r.emb.geometricBounds);
        var cut = _rangeReadBounds(r.cut.geometricBounds);
        if (r.emb.hidden || r.cut.hidden) throw new Error("사진 또는 칼선이 숨겨져 있습니다");
        if (!_rangeInsideBox(cut, _rangeCutCell(r, inset), eps)) throw new Error("실제 칼선이 배정 박스를 벗어났습니다");
        if (!_rangeInsideBox(cut, body, eps)) throw new Error("실제 칼선이 시트 영역을 벗어났습니다");
        for (var j = 0; j < cuts.length; j++) {
          var other = cuts[j];
          var separation = Math.max(cut.x - other.x - other.w, other.x - cut.x - cut.w, cut.y - other.y - other.h, other.y - cut.y - cut.h);
          if (separation < gap - eps) throw new Error("실제 칼선 간격이 " + (gap / MM_TO_PT).toFixed(2) + "mm 미만입니다 (" + other.base + ")");
        }
        cut.base = base; cuts.push(cut);
        perPhoto["$" + base] = (perPhoto["$" + base] || 0) + 1;
        perType[pl.typeIndex] = (perType[pl.typeIndex] || 0) + 1;
        perPhotoSize["$" + base + "/" + pl.sizeMm] = true;
      } catch (eAudit) {
        errors.push({ base: base, error: "출력 검사: " + ((eAudit && eAudit.message) ? eAudit.message : String(eAudit)) });
      }
    }
    if (records.length !== planned.length) errors.push({ base: "시트", error: "사진+칼선 생성 " + records.length + "/" + planned.length + "개 — 배치 누락" });
    for (var d = 0; d < pairsArg.length; d++) if (!(perPhoto["$" + pairsArg[d].base] >= minPer)) {
      errors.push({ base: pairsArg[d].base, error: "검증된 사진별 수량이 최소 " + minPer + "개 미만입니다" });
    }
    for (var t in expectedTypes) if (expectedTypes.hasOwnProperty(t) && perType[t] !== expectedTypes[t]) {
      errors.push({ base: "타입 " + t, error: "사진·크기별 실제 수량이 계획과 다릅니다" });
    }
    // 사진별 크기 대조는 **계획** 기준 — v3 는 사진마다 두 등급이 원칙이지만, 한 등급이 못 들어간 계획(Large)도 그대로 대조한다.
    var plannedPhotoSize = {};
    for (var pp = 0; pp < planned.length; pp++) plannedPhotoSize["$" + planned[pp].payload.base + "/" + planned[pp].sizeMm] = planned[pp].sizeMm;
    var actualCounts = [];
    for (var ph = 0; ph < pairsArg.length; ph++) {
      actualCounts.push(perPhoto["$" + pairsArg[ph].base] || 0);
      for (var key in plannedPhotoSize) {
        if (!plannedPhotoSize.hasOwnProperty(key)) continue;
        if (key.indexOf("$" + pairsArg[ph].base + "/") === 0 && !perPhotoSize[key]) {
          errors.push({ base:pairsArg[ph].base, error:"실제 사진별 크기 누락: " + _inchStr(plannedPhotoSize[key]) });
        }
      }
    }
    if (_rangeSpread(actualCounts) > spreadMax) errors.push({base:"시트", error:"실제 사진별 개수 차이 초과"});
    return errors;
  }

  // ═════════════════════════════════════════════════════════
  //  COMPOSED — Illustrator 쪽 (배치는 위 순수 엔진, 여기는 그리기·검사만)
  // ═════════════════════════════════════════════════════════

  // 사진 배치 — **칼선 박스**를 셀에 맞춘다. 기존 _placePhotoSticker 는 캔버스 전체를 셀에 맞추기 때문에
  // 투명 여백이 있는 사진은 실제 스티커가 계획보다 작게 인쇄된다. Composed 는 크기를 칼선 비율로 정하므로
  // 여기서도 칼선 기준이어야 계획과 출력이 같아진다. 다른 모드는 기존 함수를 그대로 쓴다 (무변경).
  function _placeComposedSticker(sheetDoc, pair, x, y, cellWPt, cellHPt, cutMarginPt, printLayer, kissLayer, cutSpot) {
    try { sheetDoc.selection = null; } catch (eSel) {}
    var cutW = cellWPt - 2 * cutMarginPt, cutH = cellHPt - 2 * cutMarginPt;
    if (cutW <= 0 || cutH <= 0) throw new Error("칼선 여백이 스티커 크기보다 큽니다");
    if (!pair.cachedCutline || !pair.cutInfo) throw new Error("cutline cache 없음 (" + pair.base + ")");
    var info = pair.cutInfo;
    if (!(info.relW > 0) || !(info.relH > 0)) throw new Error("칼선 상대 크기가 비정상입니다 (" + pair.base + ")");
    var master = _ensureArtMaster(sheetDoc, pair);
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printLayer;
    var embG;
    if (pair.cachedSymbol) embG = printLayer.symbolItems.add(pair.cachedSymbol);
    else embG = master.duplicate(printLayer, ElementPlacement.PLACEATBEGINNING);
    try { embG.hidden = false; } catch (eShow0) {}
    var gb = embG.geometricBounds;
    var gw = gb[2] - gb[0], gh = gb[1] - gb[3];
    // 칼선 박스(= rel × 아트 박스)가 셀이 되도록 아트를 키운다 — 투명 여백은 크기를 깎지 않는다.
    var ratio = Math.min(cutW / (info.relW * gw), cutH / (info.relH * gh));
    embG.resize(ratio * 100, ratio * 100);
    gb = embG.geometricBounds;
    var psdW = gb[2] - gb[0], psdH = gb[1] - gb[3];
    // 칼선 박스의 중심을 셀 중심에 둔다 (아트 중심이 아니다 — 여백이 한쪽에 몰려 있을 수 있다).
    var ccx = x + cellWPt / 2, ccy = y - cellHPt / 2;
    embG.left = ccx - (info.relL + info.relW / 2) * psdW;
    embG.top = ccy + (info.relT + info.relH / 2) * psdH;
    var psdL = embG.left, psdT = embG.top;
    sheetDoc.activeLayer = kissLayer;
    var dup = pair.cachedCutline.duplicate(kissLayer, ElementPlacement.PLACEATBEGINNING);
    try { dup.hidden = false; } catch (eShow) {}
    var freshCutSpot = _ensureCutContour(sheetDoc);
    var targetW = info.relW * psdW, targetH = info.relH * psdH;
    var nb = dup.geometricBounds;
    var nw = nb[2] - nb[0], nh = nb[1] - nb[3];
    if (nw > 0 && nh > 0) dup.resize((targetW / nw) * 100, (targetH / nh) * 100);
    dup.left = psdL + info.relL * psdW;
    dup.top = psdT - info.relT * psdH;
    _forceCutContourStroke(dup, freshCutSpot);
    sheetDoc.selection = null;
    try { $.gc(); } catch (eGc) {}
    return { emb: embG, cut: dup };
  }

  // 출력 검사 — 실제 칼선(PathItem, bounds 가 항상 정확) 을 재서 계획과 대조한다.
  // v3 감사와 같은 규약이지만 **크기까지** 본다: Composed 는 칼선 박스 = 셀이 계약이다.
  function _composedAuditOutput(records, plan, ctx, gap, inset) {
    var errors = [], cuts = [], perPhoto = [], i, j, sizeTol = COMPOSED_FIT_TOL_MM * MM_TO_PT, gapEps = 0.01 * MM_TO_PT;
    var body = { x: ctx.bL + ctx.padXPt, y: -(ctx.bT - ctx.padYPt), w: ctx.binW, h: ctx.binH };
    for (i = 0; i < plan.counts.length; i++) perPhoto.push(0);
    for (i = 0; i < records.length; i++) {
      var r = records[i], base = r.placement.payload.base;
      try {
        _rangeReadBounds(r.emb.geometricBounds);
        var cut = _rangeReadBounds(r.cut.geometricBounds);
        if (r.emb.hidden || r.cut.hidden) throw new Error("사진 또는 칼선이 숨겨져 있습니다");
        var cell = _rangeCutCell(r, inset);
        if (Math.abs(cut.w - cell.w) > sizeTol || Math.abs(cut.h - cell.h) > sizeTol) {
          throw new Error("실제 칼선 크기가 계획과 다릅니다 (" + (cut.w / MM_TO_PT).toFixed(2) + "×" + (cut.h / MM_TO_PT).toFixed(2) +
            " vs " + (cell.w / MM_TO_PT).toFixed(2) + "×" + (cell.h / MM_TO_PT).toFixed(2) + "mm)");
        }
        if (!_rangeInsideBox(cut, cell, sizeTol)) throw new Error("실제 칼선이 배정 박스를 벗어났습니다");
        if (!_rangeInsideBox(cut, body, sizeTol)) throw new Error("실제 칼선이 시트 영역을 벗어났습니다");
        for (j = 0; j < cuts.length; j++) {
          var other = cuts[j];
          var separation = Math.max(cut.x - other.x - other.w, other.x - cut.x - cut.w,
                                    cut.y - other.y - other.h, other.y - cut.y - cut.h);
          if (separation < gap - gapEps) {
            throw new Error("실제 칼선 간격이 " + (gap / MM_TO_PT).toFixed(2) + "mm 미만입니다 (" + other.base + ")");
          }
        }
        cut.base = base;
        cuts.push(cut);
        perPhoto[r.placement.photo]++;
      } catch (eAudit) {
        errors.push({ base: base, error: "출력 검사: " + ((eAudit && eAudit.message) ? eAudit.message : String(eAudit)) });
      }
    }
    if (records.length !== plan.placed.length) {
      errors.push({ base: "시트", error: "사진+칼선 생성 " + records.length + "/" + plan.placed.length + "개 — 배치 누락" });
    }
    for (i = 0; i < perPhoto.length; i++) {
      if (perPhoto[i] !== plan.counts[i]) {
        errors.push({ base: "사진 " + (i + 1), error: "실제 수량 " + perPhoto[i] + "개가 계획 " + plan.counts[i] + "개와 다릅니다" });
      }
    }
    return errors;
  }

  // 시트 한 장 생성 (Composed 전용 — Small/Large 의 _produceRangeSheet 는 건드리지 않는다).
  // 순서가 v3 와 다른 점 하나: **칼선을 배치보다 먼저** 준비한다. 크기를 칼선 비율로 정하기 때문이다.
  // 캐시가 있으면 트레이스는 0회 (기존 _buildCutlineCache 그대로 — .evcut 공유).
  // sIdx / sheetTotal = 여러 시트 중 몇 번째 (저장 이름 _sheetNN · 헤더 "sheet 1/2").
  function _produceComposedSheet(ctx, sheetPairs, options, mainIndex, gapPt, cutMarginPt, inputFolder, stamp, sIdx, sheetTotal) {
    var doc = ctx.doc, i;
    for (i = 0; i < sheetPairs.length; i++) {
      sheetPairs[i].cachedCutline = null;
      sheetPairs[i].cutInfo = null;
      sheetPairs[i].cachedArtGroup = null;
      sheetPairs[i].cachedSymbol = null;
      sheetPairs[i].symbolError = null;
      sheetPairs[i].cutCacheHit = false;
    }
    var hero = _composedHero(options.stickerName, ctx.binW, gapPt, options.nameStyle);
    var nameSkipped = hero.skipped, heroSpec = hero.spec;
    // 배치 선택은 주문 보드가 시트마다 넘긴다 (대화창 실행이면 없음 = 기본 배치).
    var layout = (options.layouts && sIdx < options.layouts.length) ? options.layouts[sIdx] : null;
    var packExtras = _composedPackExtras(heroSpec, cutMarginPt, layout, sIdx), decoWant = packExtras.decoWant;
    var printLayer = doc.layers.add();
    printLayer.name = "PrintData";
    var kissLayer = doc.layers.add();
    kissLayer.name = "KissCut";
    var cutSpot = _ensureCutContour(doc);
    var packResult = null, packMs = 0, records = [], failedItems = [], fitCount = 0, decoDrawn = 0;
    var nameInfo = null, drawnDesigns = 0, drawnBases = {};
    var prevInteraction = app.userInteractionLevel;
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
    try {
      // ① 칼선 먼저 — 캐시 히트는 재사용, 미스만 트레이스. 실패하면 크기를 정할 수 없어 여기서 멈춘다.
      var traceFailures = _buildCutlineCache(doc, sheetPairs, cutSpot);
      if (traceFailures.length > 0) {
        throw new Error("칼선 준비 실패 — " + traceFailures[0].base + ": " + traceFailures[0].error);
      }
      for (i = 0; i < sheetPairs.length; i++) {
        var cutAspect = _composedCutAspect(sheetPairs[i].aspect, sheetPairs[i].cutInfo);
        if (!cutAspect) {
          throw new Error("칼선 캐시 값이 비정상입니다 — " + sheetPairs[i].base +
            " (02_cutout/_cutcache 의 해당 .evcut 을 지우고 다시 실행하세요)");
        }
        sheetPairs[i].cutAspect = cutAspect;
      }
      // ② 배치 (순수 계산 — Adobe API 없음)
      var t0 = new Date().getTime();
      packResult = _packComposed(sheetPairs, mainIndex, ctx.binW, ctx.binH, gapPt, packExtras);
      packMs = new Date().getTime() - t0;
      ctx.drawn = true;
      // ③ 사진
      for (i = 0; i < packResult.placed.length; i++) {
        var pl = packResult.placed[i];
        var aiX = ctx.bL + ctx.padXPt + pl.x, aiY = ctx.bT - ctx.padYPt - pl.y;
        try {
          var ref = _placeComposedSticker(doc, pl.payload, aiX, aiY, pl.w, pl.h, cutMarginPt, printLayer, kissLayer, cutSpot);
          // 사진과 칼선에 같은 이름표 — 손으로 옮길 때 레이어 패널에서 짝을 찾는다 (데코·이름 글자와 같은 방식)
          var tag = "ABCDEF".charAt(pl.photo) + _pad2(i + 1) + "_" + pl.inch + "in";
          try { ref.emb.name = "Photo_" + tag; } catch (eEn) {}
          try { ref.cut.name = "Cutline_" + tag; } catch (eCn) {}
          records.push({ emb: ref.emb, cut: ref.cut, placement: pl, x: aiX, y: aiY, w: pl.w, h: pl.h });
        } catch (ePlace) {
          failedItems.push({ base: pl.payload.base, error: (ePlace && ePlace.message) ? ePlace.message : String(ePlace) });
        }
      }
      // ④ 데코 (사진 파이프라인을 타지 않는다)
      for (i = 0; i < packResult.decos.length; i++) {
        var dp = packResult.decos[i];
        try {
          _drawDecoSticker(doc, dp.payload, ctx.bL + ctx.padXPt + dp.x, ctx.bT - ctx.padYPt - dp.y,
                           dp.w, dp.h, printLayer, kissLayer, cutSpot);
          decoDrawn++;
        } catch (eDeco) {
          failedItems.push({ base: "데코 " + dp.payload.deco, error: (eDeco && eDeco.message) ? eDeco.message : String(eDeco) });
        }
      }
      // ⑤ 이름 (기존 이름 엔진 그대로 — 엔진이 정한 자리에 그리기만 한다. bubble 은 박스 안쪽 여백 namePad 만큼 들여 그린다)
      if (heroSpec && packResult.nameBox) {
        try {
          nameInfo = _drawArtLetterBlock(doc, heroSpec, ctx.bL + ctx.padXPt + packResult.nameBox.x + packResult.namePad,
                                         ctx.bT - ctx.padYPt - packResult.nameBox.y - packResult.namePad, printLayer, kissLayer, cutSpot);
        } catch (eName) {
          failedItems.push({ base: "이름", error: (eName && eName.message) ? eName.message : String(eName) });
        }
      }
      _safeRedrawAndGC();
      // ⑥ 칼선 박스 = 계획 셀 로 맞춘다 (**늘리기·줄이기 둘 다**). 심볼 bounds 기준이 순간마다
      //    캔버스/피사체로 흔들리는 문제(2026-08-25 EVS-1007) 를 실측으로 덮는다. 사진·칼선에 같은 매트릭스.
      for (i = 0; i < records.length; i++) {
        var FX = records[i];
        try {
          var adj = _composedFitAdjustment(FX.cut.geometricBounds, FX.x + cutMarginPt, FX.y - cutMarginPt,
                                           FX.w - 2 * cutMarginPt, FX.h - 2 * cutMarginPt);
          if (Math.abs(adj.scale - 1) < 1e-9 && Math.abs(adj.cx - adj.tx) < 1e-9 && Math.abs(adj.cy - adj.ty) < 1e-9) continue;
          var fmat = app.concatenateMatrix(
            app.concatenateMatrix(app.getTranslationMatrix(-adj.cx, -adj.cy), app.getScaleMatrix(100 * adj.scale, 100 * adj.scale)),
            app.getTranslationMatrix(adj.tx, adj.ty)
          );
          FX.emb.transform(fmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
          FX.cut.transform(fmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
          fitCount++;
        } catch (eFix) {
          failedItems.push({ base: FX.placement.payload.base, error: "칼선 맞춤 실패: " + ((eFix && eFix.message) ? eFix.message : String(eFix)) });
        }
      }
    } finally {
      for (i = 0; i < records.length; i++) {
        var rb = records[i].placement.payload.base;
        if (drawnBases["$" + rb]) continue;
        drawnBases["$" + rb] = true;
        drawnDesigns++;
      }
      try {
        if (packResult) _drawProductionHeader(options, drawnDesigns, ctx.headerRightText, sIdx + 1, sheetTotal);
      } catch (eHdr) {
        failedItems.push({ base: "헤더", error: "헤더 생성 실패: " + ((eHdr && eHdr.message) ? eHdr.message : String(eHdr)) });
      }
      _cleanupTraceStash(doc);
      _closeArtLibs();
      app.userInteractionLevel = prevInteraction;
    }

    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eKiss) {}
    try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (ePrint) {}
    doc.selection = null;

    var outputErrors = _composedAuditOutput(records, packResult, ctx, gapPt, cutMarginPt);
    for (i = 0; i < outputErrors.length; i++) failedItems.push(outputErrors[i]);

    var savedPath = "", saveError = "";
    try {
      if (failedItems.length > 0) {
        throw new Error("제작 검증 실패 " + failedItems.length + "건 — " + failedItems[0].error + " (문서를 확인하고 다시 생성하세요)");
      }
      var outFolder = _resolveOutputFolder(inputFolder);
      var saveFile = new File(outFolder.fsName + "/" + stamp + "_" + RANGE_TAGS[COMPOSED_KEY] + "_sheet" + _pad2(sIdx + 1) + ".ai");
      _saveAi(doc, saveFile);
      savedPath = saveFile.fsName;
    } catch (eSave) {
      saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
    }

    var cutCacheHits = 0, symbolOk = 0;
    for (i = 0; i < sheetPairs.length; i++) {
      if (sheetPairs[i].cutCacheHit) cutCacheHits++;
      if (sheetPairs[i].cachedSymbol) symbolOk++;
    }
    return { doc: doc, pairs: sheetPairs, mainIndex: mainIndex, packResult: packResult, packMs: packMs, records: records,
             savedPath: savedPath, saveError: saveError, failedItems: failedItems, fitCount: fitCount,
             decoDrawn: decoDrawn, decoWant: decoWant, nameSpec: heroSpec, nameSkipped: nameSkipped,
             nameInfo: nameInfo, drawnDesigns: drawnDesigns, cutCacheHits: cutCacheHits, symbolOk: symbolOk };
  }

  // ── 사진 종류 판별 (Illustrator 쪽) ─────────────────────────────────
  // 얼굴 측정 앱을 띄워 Vision 결과를 받고, _cutcache/<이름>.evface 에 남긴다.
  // 캐시 = 측정값(probe) + 운영자가 확정한 종류(type). PSD 가 바뀌면 다시 잰다. 지워도 안전하다.
  function _composedFaceCacheFile(pair) {
    var f = _cutCacheFileFor(pair);
    if (!f) return null;
    return new File(f.absoluteURI.replace(/\.evcut$/i, COMPOSED_FACE_CACHE_EXT));
  }

  function _composedFaceFingerprint(pair) {
    var size = -1, mtime = -1;
    try { size = pair.psd.length; } catch (eSz) {}
    try { mtime = Math.floor(pair.psd.modified.getTime() / 1000); } catch (eMt) {}
    return size + "," + mtime;
  }

  function _readFaceCache(pair) {
    var f = _composedFaceCacheFile(pair), text = null, lines, i, raw = null, type = null, src = null, rec;
    if (!f || !f.exists) return null;
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
    lines = text.split(/\r\n|\r|\n/);
    if (lines[0] !== COMPOSED_FACE_CACHE_FORMAT) return null;
    for (i = 1; i < lines.length; i++) {
      if (lines[i].substring(0, 4) === "src=") src = lines[i].substring(4);
      else if (lines[i].substring(0, 6) === "probe=") raw = lines[i].substring(6);
      else if (lines[i].substring(0, 5) === "type=") type = lines[i].substring(5);
    }
    if (src !== _composedFaceFingerprint(pair)) return null;
    rec = _composedParseProbe(raw);
    if (!rec) return null;
    if (type !== null && type !== COMPOSED_TYPE_NONE && _composedTypeIndex(type) < 0) type = null;
    return { rec: rec, raw: raw, type: type };
  }

  function _writeFaceCache(pair, raw, type) {
    var f = _composedFaceCacheFile(pair);
    if (!f || !raw) return false;
    try {
      if (!f.parent.exists) f.parent.create();
      f.encoding = "UTF-8";
      f.lineFeed = "Unix";
      if (!f.open("w")) return false;
      f.write(COMPOSED_FACE_CACHE_FORMAT + "\nsrc=" + _composedFaceFingerprint(pair) + "\nprobe=" + raw + "\n" +
              (type ? "type=" + type + "\n" : ""));
      f.close();
      return true;
    } catch (eW) {
      try { f.close(); } catch (eC) {}
      return false;
    }
  }

  function _composedFaceProbeApp() {
    var scriptDir = (new File($.fileName)).parent;
    var candidates = [scriptDir.fsName + "/" + COMPOSED_FACE_PROBE_APP,
                      scriptDir.parent.fsName + "/" + COMPOSED_FACE_PROBE_APP];
    for (var i = 0; i < candidates.length; i++) {
      var f = new File(candidates[i]);
      if (f.exists) return f;
    }
    return null;
  }

  // 사진마다 측정값을 모은다 (캐시 우선, 없는 것만 앱으로). skip[i] 가 참인 사진(파일명 표시로 종류가 정해진 사진)은
  // 캐시도 앱도 안 거친다. 실패해도 던지지 않는다 — error 에 적고
  // 확인 창에서 운영자가 고르게 한다. 반환 { recs[], raw[], saved[], cached, measured, ms, error }.
  function _composedProbeFaces(pairs, skip) {
    var out = { recs: [], raw: [], saved: [], cached: 0, measured: 0, ms: 0, error: "" };
    var t0 = new Date().getTime(), miss = [], i, k, c, skipped;
    for (i = 0; i < pairs.length; i++) {
      skipped = !!(skip && skip[i]);
      c = skipped ? null : _readFaceCache(pairs[i]);
      out.recs.push(c ? c.rec : null);
      out.raw.push(c ? c.raw : null);
      out.saved.push(c ? c.type : null);
      if (c) out.cached++;
      else if (!skipped) miss.push(i);
    }
    if (miss.length === 0) return out;
    var appFile = _composedFaceProbeApp();
    if (!appFile) {
      out.error = "얼굴 측정 앱이 없습니다 (" + COMPOSED_FACE_PROBE_APP + ")";
      return out;
    }
    var dir = new Folder(Folder.temp.fsName + "/everstory_face");
    var inDir = new Folder(dir.fsName + "/in");
    try {
      if (!dir.exists) dir.create();
      if (!inDir.exists) inDir.create();
      var old = inDir.getFiles();
      for (k = 0; k < old.length; k++) { try { old[k].remove(); } catch (eOld) {} }
      // 앱이 바탕화면을 직접 읽으면 macOS 권한 창이 뜰 수 있어 임시 폴더 복사본을 넘긴다.
      var id = "range-" + t0 + "-" + Math.floor(Math.random() * 1000000), req = ["id=" + id], map = {};
      for (k = 0; k < miss.length; k++) {
        var dst = new File(inDir.fsName + "/" + k + ".psd");
        if (!pairs[miss[k]].psd.copy(dst)) throw new Error("사진 복사 실패 — " + pairs[miss[k]].base);
        req.push("file=" + dst.fsName);
        map["p" + dst.fsName] = miss[k];
      }
      var rf = new File(dir.fsName + "/request.txt");
      rf.encoding = "UTF-8";
      rf.lineFeed = "Unix";
      if (!rf.open("w")) throw new Error("요청 파일을 쓸 수 없습니다");
      rf.write(req.join("\n") + "\n");
      rf.close();
      var res = new File(dir.fsName + "/result.txt");
      if (res.exists) res.remove();
      if (!appFile.execute()) throw new Error("얼굴 측정 앱을 실행하지 못했습니다");
      var text = null, waited = 0;
      while (waited < COMPOSED_FACE_PROBE_TIMEOUT_MS) {
        if (res.exists) {
          res.encoding = "UTF-8";
          if (res.open("r")) { text = res.read(); res.close(); }
          if (text && text.indexOf("\nid=" + id + "\n") >= 0) break;
          text = null;
        }
        $.sleep(100);
        waited += 100;
      }
      if (!text) throw new Error("얼굴 측정 시간 초과 (" + (COMPOSED_FACE_PROBE_TIMEOUT_MS / 1000) + "초)");
      var lines = text.split(/\r\n|\r|\n/);
      for (k = 0; k < lines.length; k++) {
        if (lines[k].substring(0, 2) !== "F|") continue;
        var parts = lines[k].split("|");           // F | 경로 | ok | 얼굴수 | 박스 | 사람수 | 동물수
        if (parts.length !== 7) continue;
        var idx = map["p" + parts[1]];
        if (idx === undefined) continue;
        var raw = parts.slice(2).join("|"), rec = _composedParseProbe(raw);
        if (!rec) continue;
        out.recs[idx] = rec;
        out.raw[idx] = raw;
        out.measured++;
        _writeFaceCache(pairs[idx], raw, "");
      }
      if (out.measured < miss.length) out.error = "측정 결과 누락 " + (miss.length - out.measured) + "장";
    } catch (eP) {
      out.error = (eP && eP.message) ? eP.message : String(eP);
    }
    try {
      var left = inDir.getFiles();
      for (k = 0; k < left.length; k++) left[k].remove();
    } catch (eCl) {}
    out.ms = new Date().getTime() - t0;
    return out;
  }

  // 사진마다 {key, note, confirm, saved, named, given} — 파일명 표시가 있으면 그것(누끼 저장 때 정한 값)이 이긴다.
  // 표시가 없으면 주문 보드 미리보기에서 고른 종류(given = { "$base": key }), 운영자가 전에 확정한 종류, 자동 판별 순.
  function _composedGuessTypes(pairs, probe, given) {
    var out = [], i, relH, cc, g, nt, pick;
    for (i = 0; i < pairs.length; i++) {
      nt = _composedNameType(pairs[i].base);
      if (nt) {
        out.push({ key: nt.key, note: "파일명 " + nt.token, confirm: false, saved: false, named: true, given: false });
        continue;
      }
      pick = given ? given["$" + pairs[i].base] : undefined;
      if (pick !== undefined) {
        out.push({ key: pick, note: "미리보기에서 고름", confirm: false, saved: false, named: false, given: true });
        continue;
      }
      if (pairs[i].sizeRange) {
        out.push({ key: COMPOSED_TYPE_NONE, note: "크기 직접", confirm: false, saved: false, named: false, given: true });
        continue;
      }
      relH = 1;
      cc = _readCutCache(pairs[i]);
      if (cc && cc.cutInfo && cc.cutInfo.relH >= COMPOSED_CUT_REL_MIN && cc.cutInfo.relH <= 1.01) relH = cc.cutInfo.relH;
      g = _composedClassify(probe.recs[i], relH);
      if (probe.saved[i]) out.push({ key: probe.saved[i], note: g.note, confirm: false, saved: true, named: false, given: false });
      else out.push({ key: g.key, note: g.note, confirm: g.confirm, saved: false, named: false, given: false });
    }
    return out;
  }

  // 확인 창 — 파일명 표시가 없는 사진마다 종류(= 크기 범위)를 보여주고 고치게 한다. 취소면 null.
  // 표시로 정해진 사진은 한 줄 요약만 보여준다 (바꾸려면 파일명 표시를 고친다).
  // 고칠 사진이 많으면 열을 늘린다 (한 열 COMPOSED_DIALOG_ROWS 행) — 창이 화면 아래로 넘치지 않게.
  function _composedTypeDialog(pairs, probe, guesses, mainIndex) {
    var dlg = new Window("dialog", "사진 종류 확인 — Composed");
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 18;
    dlg.spacing = 10;
    var ask = [], namedN = 0, i, t, c, r, cnt, row, nm, info, dd, sel;
    for (i = 0; i < pairs.length; i++) {
      if (guesses[i].named || guesses[i].given) namedN++;
      else ask.push(i);
    }
    dlg.add("statictext", undefined, "크기는 사진 종류가 정합니다 (긴 변 인치 범위). 자동 판별이 틀렸으면 고쳐 주세요.");
    if (namedN > 0) {
      var kinds = [];
      for (t = 0; t < COMPOSED_SHOT_TYPES.length; t++) {
        cnt = 0;
        for (i = 0; i < pairs.length; i++) {
          if ((guesses[i].named || guesses[i].given) && guesses[i].key === COMPOSED_SHOT_TYPES[t].key) cnt++;
        }
        if (cnt > 0) kinds.push(COMPOSED_SHOT_TYPES[t].label + " " + cnt);
      }
      dlg.add("statictext", undefined, "파일명 표시(SML·MED·BIG)·미리보기로 정한 사진 " + namedN + "장: " + kinds.join(" · ") +
        " — 바꾸려면 파일명을 고치세요.");
    }
    if (probe.error) {
      var warn = dlg.add("statictext", undefined, "⚠ 자동 판별 일부 안 됨 — " + probe.error + ". 해당 사진은 직접 고르세요.");
      try { warn.graphics.foregroundColor = warn.graphics.newPen(warn.graphics.PenType.SOLID_COLOR, [0.75, 0.2, 0.1], 1); } catch (eW) {}
    }
    // 열은 최대 3개 (1440pt 폭 화면 안) — 그보다 많으면 열마다 행이 늘어난다.
    var cols = Math.max(1, Math.min(3, Math.ceil(ask.length / COMPOSED_DIALOG_ROWS))), perCol = Math.max(1, Math.ceil(ask.length / cols));
    var panel = dlg.add("panel", undefined, "파일명 표시 없는 사진 " + ask.length + "장  (★ = 메인)");
    panel.orientation = "row";
    panel.alignChildren = "top";
    panel.margins = [14, 18, 14, 14];
    panel.spacing = 18;
    var colGroups = [];
    for (c = 0; c < cols; c++) {
      colGroups.push(panel.add("group"));
      colGroups[c].orientation = "column";
      colGroups[c].alignChildren = "fill";
      colGroups[c].spacing = 6;
    }
    var labels = [], drops = [];
    for (t = 0; t < COMPOSED_SHOT_TYPES.length; t++) labels.push(_composedTypeLabel(COMPOSED_SHOT_TYPES[t].key));
    labels.push(_composedTypeLabel(COMPOSED_TYPE_NONE) + " (제한 없음)");
    for (i = 0; i < pairs.length; i++) drops.push(null);
    for (r = 0; r < ask.length; r++) {
      i = ask[r];
      row = colGroups[Math.floor(r / perCol)].add("group");
      row.orientation = "row";
      row.alignChildren = "center";
      row.spacing = 8;
      nm = row.add("statictext", undefined, (i === mainIndex ? "★ " : "    ") + pairs[i].base);
      nm.preferredSize = [cols > 1 ? 160 : 250, 20];
      info = row.add("statictext", undefined, guesses[i].note + (guesses[i].saved ? " · 저장됨" : "") + (guesses[i].confirm ? "  ← 확인" : ""));
      info.preferredSize = [cols > 1 ? 95 : 170, 20];
      if (guesses[i].confirm) {
        try { info.graphics.foregroundColor = info.graphics.newPen(info.graphics.PenType.SOLID_COLOR, [0.75, 0.2, 0.1], 1); } catch (eI) {}
      }
      dd = row.add("dropdownlist", undefined, labels);
      dd.preferredSize = [cols > 1 ? 165 : 210, 24];
      sel = _composedTypeIndex(guesses[i].key);
      dd.selection = sel >= 0 ? sel : labels.length - 1;
      drops[i] = dd;
    }
    var btns = dlg.add("group");
    btns.alignment = "right";
    btns.add("button", undefined, "취소", { name: "cancel" });
    var ok = btns.add("button", undefined, "생성", { name: "ok" });
    ok.active = true;
    if (dlg.show() !== 1) return null;
    var out = [], s;
    for (i = 0; i < pairs.length; i++) {
      if (!drops[i]) { out.push(guesses[i].key); continue; }
      s = drops[i].selection ? drops[i].selection.index : labels.length - 1;
      out.push(s < COMPOSED_SHOT_TYPES.length ? COMPOSED_SHOT_TYPES[s].key : COMPOSED_TYPE_NONE);
    }
    return out;
  }

  // 완료 메시지 — 운영자가 "계획대로 나왔는지" 를 한 화면에서 확인한다. 시트마다 한 덩어리.
  // outs = 만들어진 시트들 (_produceComposedSheet 결과), plan = _composedDeal 결과, err = 중단 이유.
  // notes = { preview: [미리보기와 다른 점…], body: "템플릿 크기 경고" } (없으면 null).
  function _composedMessage(options, pairsArg, plan, outs, err, probe, notes) {
    var rim = _composedRimMm(options), saved = 0, i, j, s;
    var nameStyle = _nameStyle(options.nameStyle) || COMPOSED_NAME_STYLES[0];
    for (s = 0; s < outs.length; s++) if (outs[s].savedPath) saved++;
    var msg = "완료: Composed 시트 " + saved + "/" + plan.length + "장 생성\n\n" +
      "스크립트: " + SCRIPT_VARIANT + "\n" +
      "고객 이름: " + options.nameText + "\n" +
      "스티커 이름: " + (options.stickerName ? options.stickerName + " · 스타일 " + nameStyle.label +
        (nameStyle.whole ? " (이름 통짜 · 흰 테두리 포함)" : " (글자마다 따로)") : "(없음 — 이름·데코 안 넣음)") + "\n" +
      "구성: 사진 " + pairsArg.length + "장 → " + plan.length + "시트 (시트당 최대 " + COMPOSED_PER_SHEET + "장 · 큰 사진 고르게)" +
      " · 크기 = 인치 사다리 긴 변 " + COMPOSED_GRADES_IN.join("·") + "\" · 종류 범위보다 작게 줄이지 않음\n" +
      "       흰 테두리 " + rim + "mm (칼선 = 사진 윤곽 · 테두리만큼 바깥으로 오프셋해도 이웃과 " +
      GAP_DEFAULT_MM + "mm 남는다) · 칼선 박스 최소 간격 " + (GAP_DEFAULT_MM + 2 * rim) + "mm\n";
    if (probe) {
      var namedN = probe.named || 0, givenN = probe.given || 0, autoN = pairsArg.length - namedN - givenN;
      msg += "사진 종류: 파일명 표시 " + namedN + "장" +
        (givenN > 0 ? " · 미리보기에서 고름 " + givenN + "장" : "") +
        (autoN > 0 ? " · 자동 판별 " + autoN + "장 (측정 " + probe.measured + " · 캐시 " + probe.cached + " · " + probe.ms + "ms)" : "") +
        (probe.error ? "  ⚠ " + probe.error : "") + "\n";
    }
    if (options.preview) {
      if (notes && notes.preview && notes.preview.length > 0) {
        msg += "⚠ 주문 보드 미리보기와 다름 — " + notes.preview.join(" / ") + "\n";
      } else {
        msg += "주문 보드 미리보기와 같음 (시트 나눔·스티커 수" + (options.preview.sigs ? "·자리" : "") +
          (options.preview.decos ? "·데코" : "") + ")\n";
      }
    }
    if (notes && notes.body) msg += "⚠ " + notes.body + "\n";
    var failed = [];
    for (s = 0; s < outs.length; s++) {
      var out = outs[s], sp = out.pairs, pr = out.packResult, parts = [], ladder = [];
      for (i = 0; i < sp.length; i++) {
        var areaI = 0;
        for (j = 0; j < pr.placed.length; j++) if (pr.placed[j].photo === i) areaI += pr.placed[j].w * pr.placed[j].h;
        parts.push("ABCDEF".charAt(i) + (i === out.mainIndex ? "*" : "") + " " + sp[i].base +
          " [" + _composedTypeLabel(pr.types[i]) + (pr.ranges && pr.ranges[i] ? " → 크기 직접 " + _composedRangeLabel(pr.ranges[i]) : "") +
          (sp[i].shotNote ? " · " + sp[i].shotNote : "") + "]" +
          " ×" + pr.counts[i] + " " + Math.round(areaI / pr.area * 1000) / 10 + "%");
      }
      for (i = 0; i < COMPOSED_GRADES_IN.length; i++) {
        if (pr.gradeCounts[i] > 0) ladder.push(COMPOSED_GRADES_IN[i] + "\"×" + pr.gradeCounts[i]);
      }
      msg += "\n── 시트 " + (s + 1) + "/" + plan.length + " · 사진 " + sp.length + "장 · 메인 " + sp[out.mainIndex].base + "\n" +
        "배치: " + (pr.layout ? _composedLayoutLabel(pr.layout) : "기본") + "\n" +
        "생성 스티커 " + out.records.length + "장 (계획 " + pr.placed.length + " = 사다리 " + (pr.placed.length - pr.extras) +
        " + 빈틈 추가 " + pr.extras + ") · 디자인 " + out.drawnDesigns + "개\n" +
        "    사다리: " + ladder.join(" · ") + "\n" +
        "    사진 면적 " + (pr.evaluation.artFill * 100).toFixed(1) + "% (칼선 박스 " + (pr.fill * 100).toFixed(1) +
        "%) · 같은 사진 최소 거리 " + (pr.evaluation.minDup > 900 ? "-" : pr.evaluation.minDup.toFixed(0) + "mm") +
        " · 가장 큰 빈 곳 " + pr.evaluation.hole + "mm · 배치 " + out.packMs + "ms\n" +
        "    사진별:\n      " + parts.join("\n      ") + "\n";
      if (pr.missing.length > 0) msg += "    ⚠ 자리가 없어 못 넣은 슬롯: " + pr.missing.join(", ") + "\n";
      if (pr.skipped && pr.skipped.length > 0) msg += "    빈자리가 없어(또는 같은 사진 바로 옆뿐이라) 뺀 채움 조각: " + pr.skipped.join(", ") + "\n";
      if (out.nameSpec) {
        msg += "    이름 스티커 (" + nameStyle.label + "): 아트 알파벳 유닛 " + (Math.round(out.nameSpec.unitMm * 10) / 10) + "mm · " +
          (Math.round(out.nameSpec.cellW / MM_TO_PT * 10) / 10) + " × " + (Math.round(out.nameSpec.cellH / MM_TO_PT * 10) / 10) + "mm";
        if (out.nameSpec.whole) {
          msg += " (흰 테두리 " + (Math.round(out.nameSpec.halo / MM_TO_PT * 10) / 10) + "mm 포함)";
          if (out.nameInfo && out.nameInfo.pieces !== 1) msg += "  ⚠ 흰 테두리가 " + out.nameInfo.pieces + "조각 — 칼선이 여러 개";
        }
        if (out.nameInfo && out.nameInfo.missingGlyphs && out.nameInfo.missingGlyphs.length) {
          msg += "  ⚠ 라이브러리에 없는 글자: " + out.nameInfo.missingGlyphs.join(",");
        }
        msg += (out.nameInfo ? "" : "  ⚠ 그리기 실패") + "\n";
      } else if (out.nameSkipped) {
        msg += "    ⚠ 이름 스티커 없음: " + out.nameSkipped + "\n";
      }
      if (out.decoWant > 0) {
        var bubbleNames = [], decoNames = [];
        for (i = 0; i < pr.decos.length; i++) {
          if (pr.decos[i].payload.bubble) bubbleNames.push(pr.decos[i].payload.deco + " " + pr.decos[i].payload.sizeMm + "mm");
          else decoNames.push(pr.decos[i].payload.deco);
        }
        msg += "    데코 스티커 (" + nameStyle.label + "): " + out.decoDrawn + "/" + out.decoWant + "개 (말풍선 포함 · 빈틈에만) — 말풍선 " +
          (bubbleNames.length ? bubbleNames.join(", ") : "0 (들어갈 자리 없음)") + (decoNames.length ? " · " + decoNames.join(", ") : "") + "\n";
      }
      msg += "    칼선 캐시 " + out.cutCacheHits + "/" + sp.length + " 히트 · 심볼 " + out.symbolOk + "/" + sp.length +
        (out.fitCount > 0 ? " · 칼선 맞춤 " + out.fitCount + "장" : "") + "\n";
      if (out.savedPath) msg += "    저장: " + out.savedPath + "\n";
      else msg += "    ⚠ 저장 안 됨: " + out.saveError + "\n";
      for (i = 0; i < out.failedItems.length; i++) failed.push(out.failedItems[i]);
    }
    if (err) msg += "\n⚠ 시트 " + (outs.length + 1) + " 생성 중단 (이후 시트 안 만듦): " + err + "\n";
    if (outs.length > 0) {
      msg += "\n손볼 때: 사진(Photo_…)과 칼선(Cutline_…)은 같은 이름끼리 함께 옮기고, 칼선끼리 " + (GAP_DEFAULT_MM + 2 * rim) + "mm 이상 띄우세요.\n" +
        "마지막에 KissCut 칼선을 " + rim + "mm 바깥으로 오프셋하면 흰 테두리가 됩니다.\n";
      if (options.stickerName && nameStyle.whole) {
        msg += nameStyle.label + " 이름(NameHalo · Cutline_name)과 두들 데코는 흰 테두리가 이미 들어 있어요 — 같이 오프셋해도 " +
          "이웃과 간격이 남도록 칼선 여백만큼 자리를 더 잡아 두었어요.\n";
      }
    }
    if (failed.length > 0) {
      var seen = {};
      msg += "\n제작 오류 (그 시트는 저장 안 함 — 원인을 확인한 뒤 다시 생성):";
      for (i = 0; i < failed.length; i++) {
        var key = "$" + failed[i].base + ":" + failed[i].error;
        if (seen[key]) continue;
        seen[key] = true;
        msg += "\n- " + failed[i].base + ": " + failed[i].error;
      }
    }
    return msg;
  }

  // 템플릿 body 크기가 미리보기 상수(COMPOSED_PREVIEW_BODY_MM)와 다르면 경고 한 줄, 같으면 "".
  function _composedBodyNote(bodyPath) {
    try {
      var gb = bodyPath.geometricBounds, w = (gb[2] - gb[0]) / MM_TO_PT, h = (gb[1] - gb[3]) / MM_TO_PT;
      if (Math.abs(w - COMPOSED_PREVIEW_BODY_MM[0]) > 0.05 || Math.abs(h - COMPOSED_PREVIEW_BODY_MM[1]) > 0.05) {
        return "템플릿 body 가 " + (Math.round(w * 100) / 100) + " × " + (Math.round(h * 100) / 100) + "mm 인데 미리보기는 " +
          COMPOSED_PREVIEW_BODY_MM[0] + " × " + COMPOSED_PREVIEW_BODY_MM[1] + "mm 로 계산한다 — COMPOSED_PREVIEW_BODY_MM 을 고칠 것";
      }
    } catch (eBody) {}
    return "";
  }

  // 창이 쓸 수 있는 화면 높이(pt). Retina 에서 $.screens 가 **절반 값**을 준다 (2026-09-16 실측: 1512×982 화면의
  // 쓸 수 있는 영역 1512×872 → 756×436, 대화창 크기는 실제 pt) — 600 보다 작게 나오면 두 배로 본다. 못 읽으면 800.
  function _screenHeight() {
    try {
      var list = $.screens, pick = null, i, h;
      for (i = 0; list && i < list.length; i++) if (list[i].primary || !pick) pick = list[i];
      if (pick && pick.bottom > pick.top) {
        h = pick.bottom - pick.top;
        return (h < 600) ? h * 2 : h;
      }
    } catch (eScr) {}
    return 800;
  }

  // 긴 완료 메시지 — alert 는 화면 밖으로 넘치므로 스크롤되는 글상자 창으로 보여준다.
  function _showReportDialog(title, text) {
    var dlg = new Window("dialog", title);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 16;
    dlg.spacing = 10;
    var box = dlg.add("edittext", undefined, text, { multiline: true, scrolling: true, readonly: true });
    box.preferredSize = [780, Math.max(240, Math.min(620, _screenHeight() - 220))];
    var btns = dlg.add("group");
    btns.alignment = "right";
    btns.add("button", undefined, "확인", { name: "ok" });
    return dlg;
  }

  // Composed 실행 — 선택한 사진 전부 (장수 제한 없음). 종류를 정한 뒤 시트당 최대 COMPOSED_PER_SHEET 장으로
  // 나눠 시트마다 만든다. Small/Large 의 메인 흐름(시트 계획·루프) 을 타지 않는다.
  function _runComposed(inputFolder, pairs, options, testConfig) {
    var layoutPairs = (options.selectedPairs && options.selectedPairs.length > 0) ? options.selectedPairs : pairs;
    var msgText, i, s;
    var mainIndex = _composedMainIndex(layoutPairs, options.mainBase);
    if (mainIndex < 0) {
      msgText = "메인 사진 \"" + options.mainBase + "\" 이 선택한 사진 안에 없습니다.";
      if (testConfig) { testConfig.lastMessage = msgText; } else { alert(msgText); }
      return;
    }
    var templateFile = _resolveTemplate();
    if (!templateFile || !templateFile.exists) {
      msgText = "template_cutout_v2.ait를 찾을 수 없습니다.";
      if (testConfig) { testConfig.lastMessage = msgText; } else { alert(msgText); }
      return;
    }
    // 캔버스 비율 — 칼선 비율(_composedCutAspect) 의 기준이라 실패하면 추측하지 않고 멈춘다.
    for (i = 0; i < layoutPairs.length; i++) {
      try {
        _measurePairAspect(layoutPairs[i]);
      } catch (eAsp) {
        msgText = "사진 비율을 읽지 못했습니다 — " + layoutPairs[i].base + ": " + ((eAsp && eAsp.message) ? eAsp.message : String(eAsp));
        if (testConfig) { testConfig.lastMessage = msgText; } else { alert(msgText); }
        return;
      }
    }
    // 사진 종류 = 크기 범위. 파일명 표시(SML·MED·BIG)가 있는 사진은 그 표시가, 주문 보드 미리보기에서 종류를 고른
    // 사진은 그 값이 정한다 — 둘 다 측정·확인 창 없음. 나머지만 자동 판별(Vision) → 확인 창 → 확정값을 캐시에 남긴다.
    // 주문 보드에서 크기를 직접 고른 사진(sizeRange)은 그 범위를 쓰므로 측정할 필요가 없다.
    var named = [], namedCount = 0, givenCount = 0, decidedCount = 0, probe, decided = [];
    var given = options.shotTypes || null, ranges = options.sizeRanges || null, caps = options.maxCopies || null;
    for (i = 0; i < layoutPairs.length; i++) {
      layoutPairs[i].sizeRange = (ranges && ranges["$" + layoutPairs[i].base]) ? ranges["$" + layoutPairs[i].base] : null;
      // 장수 상한은 종류 판별과 무관하다 (크기 범위를 대신하지 않는다) — 배치 계획에만 쓴다.
      layoutPairs[i].maxCopies = (caps && caps["$" + layoutPairs[i].base]) ? caps["$" + layoutPairs[i].base] : 0;
      named.push(_composedNameType(layoutPairs[i].base) !== null);
      decided.push(named[i] || (given !== null && given["$" + layoutPairs[i].base] !== undefined) || layoutPairs[i].sizeRange !== null);
      if (named[i]) namedCount++;
      else if (decided[i]) givenCount++;
      if (decided[i]) decidedCount++;
    }
    if ((testConfig && testConfig.skipProbe) || decidedCount === layoutPairs.length) {
      probe = { recs: [], raw: [], saved: [], cached: 0, measured: 0, ms: 0,
                error: (testConfig && testConfig.skipProbe) ? "테스트 — 측정 건너뜀" : "" };
      for (i = 0; i < layoutPairs.length; i++) { probe.recs.push(null); probe.raw.push(null); probe.saved.push(null); }
    } else {
      probe = _composedProbeFaces(layoutPairs, decided);
    }
    probe.named = namedCount;
    probe.given = givenCount;
    var guesses = _composedGuessTypes(layoutPairs, probe, given), types = [];
    if (testConfig) {
      for (i = 0; i < layoutPairs.length; i++) types.push(testConfig.shotTypes ? testConfig.shotTypes[i] : guesses[i].key);
      testConfig.lastProbe = probe;
      testConfig.lastGuesses = guesses;
    } else if (decidedCount === layoutPairs.length) {
      for (i = 0; i < layoutPairs.length; i++) types.push(guesses[i].key);   // 전부 정해졌다 — 확인 창 없음
    } else {
      types = _composedTypeDialog(layoutPairs, probe, guesses, mainIndex);
      if (!types) return;
    }
    for (i = 0; i < layoutPairs.length; i++) {
      layoutPairs[i].shotType = types[i];
      layoutPairs[i].shotNote = guesses[i].note;
      if (!testConfig && probe.raw[i] && types[i] !== probe.saved[i]) _writeFaceCache(layoutPairs[i], probe.raw[i], types[i]);
    }
    // 시트 나누기 — 종류가 정해진 뒤라야 큰 사진을 시트마다 고르게 나눌 수 있다.
    var maxIns = [];
    for (i = 0; i < layoutPairs.length; i++) maxIns.push(_composedPairMaxIn(layoutPairs[i]));
    var plan = _composedDeal(maxIns, mainIndex);
    var padXPt = BODY_PADDING_X_MM * MM_TO_PT, padYPt = BODY_PADDING_Y_MM * MM_TO_PT;
    // Composed 는 칼선 여백 = 흰 테두리. 셀 = 사진 + 2×rim 이라 사진 크기(등급 인치)는 안 줄어든다.
    var gapPt = GAP_DEFAULT_MM * MM_TO_PT, cutMarginPt = _composedRimMm(options) * MM_TO_PT;
    var stamp = _timestamp(), outs = [], err = "", notes = { preview: [], body: "" };
    for (s = 0; s < plan.length; s++) {
      var sheetPairs = [], sheetMain = 0;
      for (i = 0; i < plan[s].photos.length; i++) {
        if (plan[s].photos[i] === plan[s].main) sheetMain = i;
        sheetPairs.push(layoutPairs[plan[s].photos[i]]);
      }
      var sctx = _openSheetContext(templateFile, padXPt, padYPt);
      if (sctx.error) { err = sctx.error; break; }
      if (s === 0) notes.body = _composedBodyNote(sctx.bodyPath);
      // 템플릿 좌표는 72/25.4 로 저장돼 있어 MM_TO_PT(2.834645)로 잰 미리보기 영역과 1e-4pt 쯤 다르다 — 그 차이만으로
      // 같은 선택의 자리가 미세하게 어긋나 지문 비교가 틀어졌다 (2026-09-16). 허용 오차 안이면 미리보기와 같은 값으로 계산한다
      // (그리는 기준점 bL·bT 는 그대로). 다르면 잰 값을 쓰고 _composedBodyNote 가 경고한다.
      var pbin = _composedPreviewBin();
      if (Math.abs(sctx.binW - pbin.w) <= COMPOSED_FIT_TOL_MM * MM_TO_PT && Math.abs(sctx.binH - pbin.h) <= COMPOSED_FIT_TOL_MM * MM_TO_PT) {
        sctx.binW = pbin.w;
        sctx.binH = pbin.h;
      }
      try {
        outs.push(_produceComposedSheet(sctx, sheetPairs, options, sheetMain, gapPt, cutMarginPt, inputFolder, stamp, s, plan.length));
      } catch (eProduce) {
        err = (eProduce && eProduce.message) ? eProduce.message : String(eProduce);
        try { if (sctx.doc && !sctx.drawn) sctx.doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eCl) {}
        break;
      }
    }
    var planned = [], sigs = [], decoNames = [], dn;
    for (s = 0; s < outs.length; s++) {
      planned.push(outs[s].packResult.placed.length);
      sigs.push(outs[s].packResult.sig);
      dn = [];
      for (i = 0; i < outs[s].packResult.decos.length; i++) dn.push(outs[s].packResult.decos[i].payload.deco);
      decoNames.push(dn);
    }
    notes.preview = _composedPreviewDiff(options.preview, plan, planned, layoutPairs, sigs, decoNames);
    msgText = _composedMessage(options, layoutPairs, plan, outs, err, probe, notes);
    if (testConfig) {
      testConfig.lastMessage = msgText;
      testConfig.lastPlan = plan;
      testConfig.lastComposedAll = outs;      // 래퍼가 실제 칼선 치수를 재는 용도
      testConfig.lastComposed = outs.length > 0 ? outs[0] : null;
    } else {
      _showReportDialog("Composed 완료", msgText).show();
    }
    if (testConfig && testConfig.closeAfter) {
      for (s = 0; s < outs.length; s++) {
        try { outs[s].doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eTc) {}
      }
    }
  }

  function _drawProductionHeader(options, photoCount, headerRightText, sheetNo, sheetTotal) {
    // 템플릿의 info > header > header_right TextFrame 값만 교체 (mixed.jsx 와 같은 3줄 형식).
    var sizeToken = RANGE_LABELS[options.range];
    var orderNum = options.orderNumber ? options.orderNumber : "—";
    var line1 = _nfcHangul(options.nameText) + " • " + sizeToken + " • " + options.material;
    var line2 = photoCount + " design(s)";
    if (sheetTotal && sheetTotal > 1) {
      line2 += " • sheet " + sheetNo + "/" + sheetTotal;
    }
    var line3 = "Order: " + orderNum + " | date: " + options.orderDate;

    headerRightText.contents = line1 + "\r" + line2 + "\r" + line3;
    _applyHangulFontOverride(headerRightText, _resolveHangulFont());
  }

  // ═════════════════════════════════════════════════════════
  //  UI
  // ═════════════════════════════════════════════════════════

  // 스티커 이름 → 이름 스펙 (시트 생성·주문 보드 미리보기 공용). 반환 { spec, skipped } —
  // 한글·숫자·너무 긴 이름은 spec 없이 skipped 에 이유 (그 시트는 이름·데코 없이 사진만).
  // nameStyle = COMPOSED_NAME_STYLES 키 (비우면 retro, 모르는 키면 예외). 스펙에 스타일이 실려 데코·그리기까지 따라간다.
  function _composedHero(stickerName, binW, gapPt, nameStyle) {
    if (!_nameStyle(nameStyle)) throw new Error("알 수 없는 이름 스타일: " + nameStyle);
    if (!stickerName) return { spec: null, skipped: "" };
    var ns = _rangeNameSpec(stickerName, binW, gapPt, nameStyle);
    if (!ns) return { spec: null, skipped: "" };
    if (ns.skipped) return { spec: null, skipped: ns.skipped };
    var maxW = Math.min(RANGE_HERO_MAX_W_MM, binW / MM_TO_PT - 2 * RANGE_MARGIN_X_MM) * MM_TO_PT;
    return { spec: _rangeHeroSpec(stickerName, maxW, nameStyle) || ns, skipped: "" };
  }

  // _packComposed 의 extras (시트 생성·미리보기 공용) — 데코는 이름이 있을 때만. layout = 배치 선택 (없으면 기본).
  // 이름 스타일은 heroSpec 에서 온다. rimBox 스타일(bubble)은 이름·데코 박스를 칼선 여백(rimPt)만큼 넓히고 그 안쪽에 그린다 (pad).
  // sheetIndex = 몇 번째 시트인지 (0부터, 없으면 0) — 데코·말풍선 시작 자리 (_composedDecoStart · _composedBubbleStart).
  function _composedPackExtras(heroSpec, rimPt, layout, sheetIndex) {
    var style = heroSpec ? _nameStyle(heroSpec.nameStyle) : null;
    var pad = (style && style.rimBox && rimPt > 0) ? rimPt : 0;
    return { hero: heroSpec ? { w: pad ? heroSpec.cellW + 2 * pad : heroSpec.cellW,
                                h: pad ? heroSpec.cellH + 2 * pad : heroSpec.cellH, pad: pad } : null,
             decoWant: heroSpec ? COMPOSED_DECO_MAX : 0, rimPt: rimPt, layout: layout ? layout : null,
             nameStyle: style ? style.key : null, decoPad: pad, decoStart: _composedDecoStart(heroSpec, sheetIndex),
             bubbleWant: heroSpec ? COMPOSED_BUBBLE_MAX : 0, bubbleStart: _composedBubbleStart(heroSpec, sheetIndex) };
  }

  // 주문 보드 미리보기가 넘긴 값 → 대화창 options (2026-09-16). 사진은 base 로 찾는다 — 한글 NFD/NFC 차이는 _nfcHangul 로 맞춘다.
  // 폴더에 없는 사진이 하나라도 있으면 만들지 않는다 (미리보기 뒤에 파일이 바뀐 것 — 추측해서 빼거나 바꾸지 않는다).
  // 반환 { options } 또는 { error }.
  function _composedLaunchOptions(cfg, pairsArg) {
    var byKey = {}, sel = [], shot = {}, i, p, key, t, mainBase = "", cut = null, material = null, layouts = null, ls;
    var sizes = {}, rng, copies = {}, capN;
    if (!cfg || !cfg.bases || !cfg.bases.length) return { error: "미리보기에서 고른 사진이 없습니다." };
    for (i = 0; i < pairsArg.length; i++) byKey["$" + _nfcHangul(pairsArg[i].base)] = pairsArg[i];
    for (i = 0; i < cfg.bases.length; i++) {
      p = byKey["$" + _nfcHangul(String(cfg.bases[i]))];
      if (!p) return { error: "미리보기에서 고른 사진이 폴더에 없습니다: " + cfg.bases[i] + " — 보드에서 미리보기를 새로 고친 뒤 다시 만드세요." };
      sel.push(p);
    }
    if (cfg.mainBase) {
      p = byKey["$" + _nfcHangul(String(cfg.mainBase))];
      if (!p) return { error: "메인 사진이 폴더에 없습니다: " + cfg.mainBase };
      mainBase = p.base;
    }
    if (cfg.shotTypes) {
      for (key in cfg.shotTypes) {
        if (!cfg.shotTypes.hasOwnProperty(key)) continue;
        p = byKey["$" + _nfcHangul(key)];
        t = String(cfg.shotTypes[key]);
        if (!p) return { error: "종류를 고른 사진이 폴더에 없습니다: " + key };
        if (t !== COMPOSED_TYPE_NONE && _composedTypeIndex(t) < 0) return { error: "알 수 없는 사진 종류: " + t };
        shot["$" + p.base] = t;
      }
    }
    for (i = 0; i < CUT_MARGIN_VALUES.length; i++) if (CUT_MARGIN_VALUES[i] === Number(cfg.cutMarginMm)) cut = CUT_MARGIN_VALUES[i];
    if (cut === null) return { error: "칼선 여백 값이 이상합니다: " + cfg.cutMarginMm };
    for (i = 0; i < MATERIAL_OPTIONS.length; i++) if (MATERIAL_OPTIONS[i] === String(cfg.material)) material = MATERIAL_OPTIONS[i];
    if (material === null) return { error: "알 수 없는 재질: " + cfg.material };
    if (!_trim(cfg.nameText || "")) return { error: "고객 이름이 비어 있습니다." };
    // 사진마다 직접 고른 크기 범위 { base: [최소, 최대] } (없는 사진은 종류 범위).
    if (cfg.sizeRanges !== undefined && cfg.sizeRanges !== null) {
      if (typeof cfg.sizeRanges !== "object" || cfg.sizeRanges instanceof Array) return { error: "크기 범위 값이 이상합니다." };
      for (key in cfg.sizeRanges) {
        if (!cfg.sizeRanges.hasOwnProperty(key)) continue;
        p = byKey["$" + _nfcHangul(key)];
        if (!p) return { error: "크기를 고른 사진이 폴더에 없습니다: " + key };
        rng = _composedSizeRange(cfg.sizeRanges[key]);
        if (!rng) return { error: "크기 범위 값이 이상합니다: " + key };
        sizes["$" + p.base] = rng;
      }
    }
    // 사진마다 정한 장수 상한 { base: 장수 } (없는 사진은 엔진이 정한다).
    if (cfg.maxCopies !== undefined && cfg.maxCopies !== null) {
      if (typeof cfg.maxCopies !== "object" || cfg.maxCopies instanceof Array) return { error: "장수 상한 값이 이상합니다." };
      for (key in cfg.maxCopies) {
        if (!cfg.maxCopies.hasOwnProperty(key)) continue;
        p = byKey["$" + _nfcHangul(key)];
        if (!p) return { error: "장수를 정한 사진이 폴더에 없습니다: " + key };
        capN = _composedCopyCap(cfg.maxCopies[key]);
        if (!capN) return { error: "장수 상한 값이 이상합니다: " + key };
        copies["$" + p.base] = capN;
      }
    }
    // 이름 스타일 (없으면 첫 번째 = retro). 모르는 값이면 만들지 않는다.
    var nameStyle = COMPOSED_NAME_STYLES[0].key;
    if (cfg.nameStyle !== undefined && cfg.nameStyle !== null && cfg.nameStyle !== "") {
      if (typeof cfg.nameStyle !== "string" || !_nameStyle(cfg.nameStyle)) {
        return { error: "알 수 없는 이름 스타일: " + cfg.nameStyle + " — 보드에서 미리보기를 새로 고친 뒤 다시 만드세요." };
      }
      nameStyle = cfg.nameStyle;
    }
    // 시트마다 고른 배치 (없으면 기본). 이상한 값이면 만들지 않는다 — 미리보기와 다른 시트가 조용히 나오면 안 된다.
    if (cfg.layouts !== undefined && cfg.layouts !== null) {
      if (!(cfg.layouts instanceof Array)) return { error: "배치 선택 값이 이상합니다." };
      layouts = [];
      for (i = 0; i < cfg.layouts.length; i++) {
        ls = _composedLayoutSpec(cfg.layouts[i]);
        if (!ls) return { error: "알 수 없는 배치 선택 (시트 " + (i + 1) + ") — 보드에서 미리보기를 새로 고친 뒤 다시 만드세요." };
        layouts.push(ls);
      }
    }
    return { options: {
      nameText: _trim(cfg.nameText),
      mainBase: mainBase,
      stickerName: _trim(cfg.stickerName || ""),
      nameStyle: nameStyle,
      material: material,
      orderNumber: _trim(cfg.orderNumber || ""),
      orderDate: _trim(cfg.orderDate || "") || _todayIso(),
      range: COMPOSED_KEY,
      candidate: 0,
      cutMarginMm: cut,
      selectedPairs: sel,
      shotTypes: shot,
      sizeRanges: sizes,
      maxCopies: copies,
      layouts: layouts,
      preview: cfg.expect || null
    } };
  }

  // 미리보기가 예상한 시트 나눔·스티커 수·자리 → 실제와 다른 점 (없으면 빈 배열). 이유는 짐작하지 않고 차이만 적는다.
  // expect = { sheets: [[base…]…], stickers: [n…], sigs: [지문…], decos: [[모양…]…] }, plan = _composedDeal 결과,
  // counts = 시트별 계획 스티커 수, sigs = 시트별 배치 지문 (_composedLayoutSig). 수가 다르면 자리는 따로 적지 않는다.
  // decos = 시트별 데코 모양 이름 목록 — expect.decos 가 있으면(새 보드) 자리가 같을 때 모양까지 비교한다.
  function _composedPreviewDiff(expect, plan, counts, layoutPairs, sigs, decos) {
    var notes = [], s, i, want, got;
    if (!expect) return notes;
    if (expect.sheets && expect.sheets.length !== plan.length) {
      notes.push("시트 수: 미리보기 " + expect.sheets.length + "장 → 실제 " + plan.length + "장");
    }
    for (s = 0; s < plan.length; s++) {
      if (expect.sheets && expect.sheets[s]) {
        want = [];
        got = [];
        for (i = 0; i < expect.sheets[s].length; i++) want.push(_nfcHangul(String(expect.sheets[s][i])));
        for (i = 0; i < plan[s].photos.length; i++) got.push(_nfcHangul(layoutPairs[plan[s].photos[i]].base));
        if (want.join("|") !== got.join("|")) notes.push("시트 " + (s + 1) + ": 사진 구성이 미리보기와 다름");
      }
      if (expect.stickers && s < counts.length && typeof expect.stickers[s] === "number" && expect.stickers[s] !== counts[s]) {
        notes.push("시트 " + (s + 1) + ": 스티커 미리보기 " + expect.stickers[s] + "장 → 실제 " + counts[s] + "장");
      } else if (expect.sigs && sigs && s < sigs.length && typeof expect.sigs[s] === "string" && expect.sigs[s] !== "" &&
                 expect.sigs[s] !== sigs[s]) {
        notes.push("시트 " + (s + 1) + ": 스티커 자리가 미리보기와 다름");
      } else if (expect.decos && decos && s < decos.length && expect.decos[s] instanceof Array &&
                 expect.decos[s].join(",") !== decos[s].join(",")) {
        notes.push("시트 " + (s + 1) + ": 데코 모양이 미리보기와 다름");
      }
    }
    return notes;
  }

  // n 장을 고르면 시트별 장수 (대화창 표시용 — _composedDeal 과 같은 나눔).
  function _composedSheetSizes(n) {
    var zeros = [], out = [], plan, k;
    for (k = 0; k < n; k++) zeros.push(0);
    plan = _composedDeal(zeros, 0);
    for (k = 0; k < plan.length; k++) out.push(plan[k].photos.length);
    return out;
  }

  // 대화창 — Composed 전용 (2026-09-16 사용자: 크기 범위·배치 후보 선택을 뺐고, 사진 수 제한이 없다).
  // 두 열: 왼쪽 = 이름·헤더·칼선 여백, 오른쪽 = 사진 목록·메인. 목록 높이를 화면 높이에 맞춰 버튼이 화면 밖으로 안 나간다.
  function _showDialog(pairsArg, defaultName) {
    var gray = [0.45, 0.45, 0.45], i;
    function _hint(parent, text, w, lines) {
      var st = parent.add("statictext", undefined, text, { multiline: true });
      st.preferredSize = [w, 16 * lines];
      try { st.graphics.foregroundColor = st.graphics.newPen(st.graphics.PenType.SOLID_COLOR, gray, 1); } catch (eH) {}
      return st;
    }
    function _panel(parent, title) {
      var p = parent.add("panel", undefined, title);
      p.orientation = "column";
      p.alignChildren = "fill";
      p.margins = [12, 16, 12, 12];
      p.spacing = 6;
      return p;
    }
    function _labeledRow(parent, label) {
      var g = parent.add("group");
      g.orientation = "row";
      g.alignChildren = "center";
      g.add("statictext", undefined, label).preferredSize = [56, 20];
      return g;
    }

    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 16;
    dlg.spacing = 12;
    var cols = dlg.add("group");
    cols.orientation = "row";
    cols.alignChildren = "top";
    cols.spacing = 16;
    var left = cols.add("group");
    left.orientation = "column";
    left.alignChildren = "fill";
    left.spacing = 10;
    var right = cols.add("group");
    right.orientation = "column";
    right.alignChildren = "fill";
    right.spacing = 10;

    // ── 왼쪽 ──
    var nameInput = _panel(left, "고객 이름").add("edittext", undefined, defaultName || "");
    nameInput.preferredSize = [300, 24];

    // 스티커 이름 — 헤더의 고객 이름과 **별개**다 (선물이면 받는 사람 이름). 비우면 이름 스티커도 데코도 안 넣는다.
    var stickerPanel = _panel(left, "스티커 이름 (비우면 이름·데코 없음)");
    var stickerInput = stickerPanel.add("edittext", undefined, "");
    stickerInput.preferredSize = [300, 24];
    _hint(stickerPanel, "A–Z 이름 → 위쪽 아트 알파벳 + 말풍선·데코 최대 " + COMPOSED_DECO_MAX + "개(빈틈). 한글·숫자 이름은 아직 사진만.", 300, 2);

    var detailPanel = _panel(left, "헤더 정보");
    var materialDropdown = _labeledRow(detailPanel, "재질").add("dropdownlist", undefined, MATERIAL_OPTIONS);
    materialDropdown.selection = 0;
    materialDropdown.preferredSize = [234, 24];
    var orderInput = _labeledRow(detailPanel, "주문번호").add("edittext", undefined, "");
    orderInput.preferredSize = [234, 24];
    var dateInput = _labeledRow(detailPanel, "날짜").add("edittext", undefined, _todayIso());
    dateInput.preferredSize = [234, 24];

    // 칼선 여백 = 흰 테두리 (셀 = 사진 + 2×여백). 기본 COMPOSED_RIM_MM.
    var cutPanel = _panel(left, "칼선 여백 (= 흰 테두리)");
    cutPanel.orientation = "row";
    cutPanel.spacing = 12;
    var cutRadios = [];
    for (i = 0; i < CUT_MARGIN_OPTIONS.length; i++) {
      cutRadios.push(cutPanel.add("radiobutton", undefined, CUT_MARGIN_OPTIONS[i]));
      cutRadios[i].value = (CUT_MARGIN_VALUES[i] === COMPOSED_RIM_MM);
    }

    // ── 오른쪽 ──
    var pairsPanel = _panel(right, "사진 (여러 장 선택 · 장수 제한 없음)");
    var pairItems = [];
    for (i = 0; i < pairsArg.length; i++) pairItems.push(pairsArg[i].base);
    var pairsListbox = pairsPanel.add("listbox", undefined, pairItems, {
      multiselect: true,
      numberOfColumns: 1,
      showHeaders: false
    });
    // 창 높이 ≈ 목록 + 330pt (제목줄·안내·메인·버튼). 화면이 낮으면 목록을 줄인다.
    pairsListbox.preferredSize = [380, Math.max(160, Math.min(360, _screenHeight() - 330))];
    var countLabel = pairsPanel.add("statictext", undefined, "선택: 0장");
    countLabel.preferredSize = [380, 18];
    _hint(pairsPanel, "기본은 앞 " + COMPOSED_DEFAULT_SELECT + "장 — ⌘+클릭으로 더하거나 빼세요. 시트당 최대 " + COMPOSED_PER_SHEET +
      "장이라 넘치면 시트를 늘리고, 큰 사진을 시트마다 고르게 나눕니다.", 380, 2);
    function _syncCount() {
      var n = pairsListbox.selection ? pairsListbox.selection.length : 0;
      var sizes = _composedSheetSizes(n);
      countLabel.text = "선택: " + n + "장" + (n > 0 ? " → " + sizes.length + "시트" + (sizes.length > 1 ? " (" + sizes.join("+") + ")" : "") : "");
    }
    pairsListbox.onChange = _syncCount;
    var initialSel = [];
    for (i = 0; i < pairItems.length && i < COMPOSED_DEFAULT_SELECT; i++) initialSel.push(pairsListbox.items[i]);
    pairsListbox.selection = initialSel;
    _syncCount();

    // 메인 사진 — 기본은 **선택 목록의 첫 사진**. 시트가 여럿이면 메인이 든 시트 말고는 각 시트의 가장 큰 종류가 메인.
    var mainPanel = _panel(right, "메인 사진 (가장 크게)");
    var mainItems = ["첫 번째 선택 사진 (기본)"];
    for (i = 0; i < pairsArg.length; i++) mainItems.push(pairsArg[i].base);
    var mainDropdown = mainPanel.add("dropdownlist", undefined, mainItems);
    mainDropdown.selection = 0;
    mainDropdown.preferredSize = [380, 24];
    _hint(mainPanel, "시트가 여럿이면 나머지 시트의 메인은 자동 (그 시트의 가장 큰 종류).", 380, 1);

    var btnGroup = dlg.add("group");
    btnGroup.alignment = "right";
    btnGroup.spacing = 10;
    btnGroup.add("button", undefined, "취소", { name: "cancel" });
    var okBtn = btnGroup.add("button", undefined, "생성", { name: "ok" });
    okBtn.active = true;

    okBtn.onClick = function () {
      if (!_trim(nameInput.text)) {
        alert("고객 이름이 비어 있습니다.");
        return;
      }
      var sel = pairsListbox.selection;
      if (!sel || sel.length === 0) {
        alert("사진을 한 장 이상 고르세요.");
        return;
      }
      if (mainDropdown.selection && mainDropdown.selection.index > 0) {
        var wantBase = pairsArg[mainDropdown.selection.index - 1].base, found = false;
        for (var mk = 0; mk < sel.length; mk++) {
          if (pairsArg[sel[mk].index].base === wantBase) found = true;
        }
        if (!found) {
          alert("메인 사진 \"" + wantBase + "\" 이 선택한 사진 안에 없습니다.");
          return;
        }
      }
      dlg.close(1);
    };

    if (dlg.show() !== 1) return null;

    var cutMarginMm = COMPOSED_RIM_MM;
    for (i = 0; i < cutRadios.length; i++) {
      if (cutRadios[i].value) { cutMarginMm = CUT_MARGIN_VALUES[i]; break; }
    }
    var materialText = (materialDropdown.selection !== null) ? materialDropdown.selection.text : MATERIAL_OPTIONS[0];
    var selectedPairs = [];
    if (pairsListbox.selection) {
      for (i = 0; i < pairsListbox.selection.length; i++) selectedPairs.push(pairsArg[pairsListbox.selection[i].index]);
    }
    if (selectedPairs.length === 0) {
      alert("사진이 선택되지 않았습니다.");
      return null;
    }
    var mainBaseText = "";
    if (mainDropdown.selection && mainDropdown.selection.index > 0) {
      mainBaseText = pairsArg[mainDropdown.selection.index - 1].base;
    }
    return {
      nameText: _trim(nameInput.text),
      mainBase: mainBaseText,
      stickerName: _trim(stickerInput.text),
      material: materialText,
      orderNumber: _trim(orderInput.text),
      orderDate: _trim(dateInput.text) || _todayIso(),
      range: COMPOSED_KEY,
      candidate: 0,
      cutMarginMm: cutMarginMm,
      selectedPairs: selectedPairs
    };
  }

  // ═════════════════════════════════════════════════════════
  //  아래는 Everstory_mixed.jsx (2026-09-06) 그대로 — 페어 수집 · 템플릿 · 칼선 캐시 ·
  //  트레이스 · 사진 배치 · 저장. 고칠 일이 있으면 mixed.jsx 를 먼저 고치고 여기로 복사한다.
  //  (_collectPairs 만 3버킷/tier 토큰 파싱을 뺐다 — Small/Large 는 파일명 토큰을 쓰지 않고,
  //   Composed 는 base 끝 표시를 _composedNameType 으로 따로 읽어 사진 종류로 쓴다.)
  // ═════════════════════════════════════════════════════════

  function _collectPairs(folder) {
    var pngFiles = folder.getFiles(function (f) {
      return f instanceof File && /_sil\.png$/i.test(f.name);
    });

    pngFiles.sort(function (a, b) {
      return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
    });

    var out = [];
    for (var i = 0; i < pngFiles.length; i++) {
      // pngFiles[i].name 은 ExtendScript 가 URL-encoded 로 반환 (macOS NFD 한글 포함).
      // PSD 매칭은 같은 raw 형태로 (filesystem 매칭 보장), base 만 decodeURI 로 사람용 표시.
      var pngName = pngFiles[i].name;
      var psdName = pngName.replace(/_sil\.png$/i, "_clean.psd");
      var psdFile = new File(folder.fsName + "/" + psdName);
      if (psdFile.exists) {
        out.push({
          psd: psdFile,
          sil: pngFiles[i],
          base: _decodeName(pngName.replace(/_sil\.png$/i, ""))
        });
      }
    }
    return out;
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

  function _openSheetContext(templateFile, padXPt, padYPt) {
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
    var binW = (gb[2] - gb[0]) - 2 * padXPt;
    var binH = (gb[1] - gb[3]) - 2 * padYPt;
    if (binW <= 0 || binH <= 0) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose2) {}
      return { doc: null, error: "info > body 영역이 body padding 보다 작습니다." };
    }

    return {
      doc: doc, error: null, drawn: false,
      bodyPath: bodyPath, headerRightText: headerRightText,
      bL: gb[0], bT: gb[1], padXPt: padXPt, padYPt: padYPt, binW: binW, binH: binH
    };
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

  function _findCutline(doc) {
    return _deepFindByName(doc, "Cutline")
        || _deepFindByName(doc, "CutPath")
        || _deepFindFirstPath(doc);
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

  function _safeRedrawAndGC() {
    try { app.redraw(); } catch (eRedraw) {}
    try { $.gc(); } catch (eGc) {}
  }

  function _uniquePairsFromPlaced(placedItems) {
    var seen = {};
    var unique = [];
    for (var i = 0; i < placedItems.length; i++) {
      var pl = placedItems[i];
      if (!pl || !pl.payload) continue;
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

  // ══ 칼선 디스크 캐시 (mixed.jsx 와 포맷·서명 동일 → .evcut 공유) ══════════════
  function _traceSignature() {
    var keys = ["threshold", "pathFidelity", "cornerFidelity", "minimumArea", "cornerAngle",
                "ignoreWhite", "snapCurveToLines"];
    var parts = [];
    for (var i = 0; i < keys.length; i++) parts.push(keys[i] + ":" + TRACE_OPTS[keys[i]]);
    return parts.join(",");
  }

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
    try { mtime = Math.floor(pair.sil.modified.getTime() / 1000); } catch (eMt) {}
    return size + "," + mtime;
  }

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
    if (sig !== _traceSignature()) return null;
    if (src !== _cutCacheFingerprint(pair)) return null;
    if (!info || subs.length === 0) return null;
    var iv = info.split(",");
    if (iv.length !== 4) return null;
    return {
      cutInfo: { relL: parseFloat(iv[0]), relT: parseFloat(iv[1]),
                 relW: parseFloat(iv[2]), relH: parseFloat(iv[3]) },
      subs: subs
    };
  }

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
    var fitW = rotated ? artH : artW;
    var fitH = rotated ? artW : artH;
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
    gb = embG.geometricBounds;
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

    if (rotated) {
      var rmat = app.concatenateMatrix(
        app.concatenateMatrix(app.getTranslationMatrix(-ccx, -ccy), app.getRotationMatrix(90)),
        app.getTranslationMatrix(ccx, ccy)
      );
      embG.transform(rmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
      dup.transform(rmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
    }

    sheetDoc.selection = null;
    try { $.gc(); } catch (eGc) {}
    return { emb: embG, cut: dup };
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

  // macOS Finder/paste 로 들어온 NFD 자모를 NFC 음절로 합성. ES3 의 String.normalize 부재 대체.
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
      if ((c >= 0xAC00 && c <= 0xD7AF) || (c >= 0x1100 && c <= 0x11FF) || (c >= 0x3130 && c <= 0x318F)) {
        try { textFrame.textRange.characters[i].textFont = hangulFont; } catch (eChar) {}
      }
    }
  }

  // 25.4mm → "1in", 31.75mm → "1.25in", 12.7mm → "0.5in"
  function _inchStr(mm) {
    var inch = mm / 25.4;
    return inch.toFixed(2).replace(/\.?0+$/, "") + "in";
  }

  function _resolveOutputFolder(srcFolder) {
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
    aiOpts.pdfCompatible = false;
    aiOpts.embedICCProfile = true;
    targetDoc.saveAs(file, aiOpts);
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

  function _pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

})();
