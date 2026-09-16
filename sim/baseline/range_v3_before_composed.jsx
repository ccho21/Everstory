// ═══════════════════════════════════════════════════════════════
//  Everstory Range 시트 — Small / Large 면적 등급 자동 배정 (테스트용 별도 파일)
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
//  검증: sim/range_layout_test.js · sim/range_name_test.js · sim/range_output_test.js. Illustrator 실행은 테스트 시트로.
//
//  사용: File → Scripts → Other Script → Everstory_range.jsx
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "range v3 area (test)";
  var SCRIPT_TITLE = "Everstory Range Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;

  // ── 시트 (Everstory_mixed.jsx 2026-08-25 운영 상수와 동일) ─────
  var BODY_PADDING_X_MM = 0;
  var BODY_PADDING_Y_MM = 1.5;
  var GAP_DEFAULT_MM = 1.5;

  // ── 범위 ─────────────────────────────────────────────────────
  var RANGE_KEYS = ["small", "large"];
  var RANGE_OPTIONS = [
    "Small — 1\"² / 1.25\"² (정사각 환산 · 전신은 최장 2\")",
    "Large — 1.5\"² / 2\"² (정사각 환산 · 최장 3\")"
  ];
  var RANGE_DEFAULT_INDEX = 0;
  // 2026-09-12 사용자: Small 은 1 / 1.25″ 두 크기만 (0.5·0.75 제외 — "너무 많고 별로"), Large 는 1.5 / 2″ 유지.
  // 2026-09-13 부터 이 값은 **면적 등급의 한 변**(정사각 환산). 셀 크기는 _rangeCell 이 비율대로 계산한다.
  var RANGE_SIZES_MM = { small: [25.4, 31.75], large: [38.1, 50.8] };
  var RANGE_LABELS = { small: "Small 1-1.25\"", large: "Large 1.5-2\"" };
  var RANGE_TAGS = { small: "SMALL", large: "LARGE" };   // 03_output 파일명 토큰
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
  var LETTER_ART_DOC = null;
  var DECO_ART_LIB_NAME = "deco_art_v1.ai";
  var DECO_EXTRA = 2;
  var DECO_ORDER = [
    "HEART", "FLOWER", "STAR", "CAMERA", "BOW", "BONE",
    "CHERRY", "SMILE", "RAINBOW", "CUPCAKE", "GIFT", "CLOUD"
  ];
  var DECO_ART_DOC = null;

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

  var options = (testConfig && testConfig.options)
    ? testConfig.options
    : _showDialog(pairs, _deriveDefaultCustomerName(inputFolder));
  if (!options) return;
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
  // ══ 엔진 — Everstory_mixed.jsx 2026-09-12 판 그대로 (이름 아트 알파벳 · 데코) ═══════
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
      isArt: isArt,      // true = alphabet_art_v1.ai 에서 꺼내 그린다
      aspect: 1
    };
    return _letterBlockResize(spec, unitMm);
  }

  function _letterArtWCoef(spec) {
    if (typeof spec.artWCoef === "number") return spec.artWCoef;
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
    var gap = unit * LETTER_GAP_RATIO;
    spec.unitMm = unitMm;
    spec.unit = unit;
    spec.innerGap = gap;
    var artCoef = null;
    if (spec.isArt) artCoef = _letterArtWCoef(spec);
    if (artCoef !== null) {
      // 아트는 글자마다 폭이 다르다 (I 0.59 ~ M 0.94 fh). 정사각 유닛으로 잡으면
      // I 에도 M 폭을 줘서 블록이 20퍼센트쯤 헛되이 넓어진다 (HARIN 60.8 → 46.4mm).
      spec.capPt = unit / spec.artHCoef;          // 목표 cap height
      spec.baselinePt = spec.capPt * spec.artAboveCoef;  // 행 위 → baseline 깊이
      spec.cellW = unit * artCoef;
    } else {
      spec.cellW = spec.maxLen * unit + (spec.maxLen - 1) * gap;
    }
    // 높이는 두 모드가 같다 — 아트도 가장 불리한 글자의 프레임이 딱 unit 이다.
    spec.cellH = spec.lines.length * unit + (spec.lines.length - 1) * gap;
    return spec;
  }

  function _letterUnitToFit(block, wPt) {
    var denom = null;
    if (block.isArt) denom = _letterArtWCoef(block);
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

  function _letterArtLib() {
    if (LETTER_ART_DOC) {
      // 운영자가 손으로 닫았을 수 있다 — 건드려 보고 죽었으면 다시 연다.
      try { var probe = LETTER_ART_DOC.name; return LETTER_ART_DOC; }
      catch (eDead) { LETTER_ART_DOC = null; }
    }
    var f = _artLibFile(LETTER_ART_LIB_NAME);
    if (!f) {
      throw new Error("아트 알파벳 라이브러리가 없습니다 — templates/" + LETTER_ART_LIB_NAME +
        " (26자 그룹 이름은 'LTR A' ~ 'LTR Z', 밑줄 아님)");
    }
    LETTER_ART_DOC = _openArtLibDoc(f);
    return LETTER_ART_DOC;
  }

  function _closeLetterArtLib() {
    if (!LETTER_ART_DOC) return;
    try { LETTER_ART_DOC.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
    LETTER_ART_DOC = null;
  }

  function _decoArtLib() {
    if (DECO_ART_DOC) {
      try { var probe2 = DECO_ART_DOC.name; return DECO_ART_DOC; }
      catch (eDead2) { DECO_ART_DOC = null; }
    }
    var f2 = _artLibFile(DECO_ART_LIB_NAME);
    if (!f2) {
      throw new Error("데코 라이브러리가 없습니다 — templates/" + DECO_ART_LIB_NAME +
        " (12종 그룹 이름은 'DECO HEART' 처럼, 밑줄 아님)");
    }
    DECO_ART_DOC = _openArtLibDoc(f2);
    return DECO_ART_DOC;
  }

  function _closeDecoArtLib() {
    if (!DECO_ART_DOC) return;
    try { DECO_ART_DOC.close(SaveOptions.DONOTSAVECHANGES); } catch (eC2) {}
    DECO_ART_DOC = null;
  }

  function _drawDecoSticker(sheetDoc, payload, x, y, w, h, printL, kissL, cutSpot) {
    var lib = _decoArtLib();
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;
    var src;
    try { src = lib.groupItems.getByName("DECO " + payload.deco); }
    catch (eN) {
      throw new Error("데코 '" + payload.deco + "' 가 라이브러리에 없습니다 (DECO " +
        payload.deco + ")");
    }
    var dup = src.duplicate(printL, ElementPlacement.PLACEATEND);
    var gb = dup.geometricBounds;
    var sw = gb[2] - gb[0], sh = gb[1] - gb[3];
    if (sw > 0 && sh > 0) {
      var s = w / sw;
      if (h / sh < s) s = h / sh;
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
    var cut = outline.duplicate(kissL, ElementPlacement.PLACEATEND);
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

  function _drawArtLetterBlock(sheetDoc, block, x, y, printL, kissL, cutSpot) {
    var lib = _letterArtLib();
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;
    sheetDoc.selection = null;
    var missing = [];
    var noCut = [];
    var gi = 0;
    for (var ln = 0; ln < block.lines.length; ln++) {
      var lineChars = block.lines[ln];
      // 줄 폭을 먼저 재서 가운데 정렬한다 — 줄마다 글자 수도 폭도 다르다.
      var lineW = (lineChars.length - 1) * block.innerGap;
      var wi, mw;
      for (wi = 0; wi < lineChars.length; wi++) {
        mw = LETTER_ART_METRICS[lineChars[wi]];
        if (mw) lineW += mw.aw * block.capPt / mw.cap;
      }
      var cur = x + (block.cellW - lineW) / 2;
      // 이 줄의 baseline. 행 위에서 baselinePt 만큼 내려온 자리 — 모든 글자가 여기 선다.
      var baseY = y - ln * (block.unit + block.innerGap) - block.baselinePt;
      for (var ci = 0; ci < lineChars.length; ci++, gi++) {
        var ch = lineChars[ci];
        var m = LETTER_ART_METRICS[ch];
        var src = null;
        if (m) {
          try { src = lib.groupItems.getByName("LTR " + ch); } catch (eName) { src = null; }
        }
        if (!src) {
          // 라이브러리에 글자가 없다 — 조용히 건너뛰면 이름에 구멍이 난다.
          missing.push(ch);
          continue;
        }
        var frameH = block.capPt / m.cap;
        var dup = src.duplicate(printL, ElementPlacement.PLACEATEND);
        var gb = dup.geometricBounds;
        var srcH = gb[1] - gb[3];
        if (srcH > 0) {
          var s = (frameH / srcH) * 100;
          dup.resize(s, s);
        }
        // resize 후 bounds 는 **다시 읽어야 한다** — 앵커가 문서 기준이라 위치가 같이 변한다.
        gb = dup.geometricBounds;
        var frameTopY = baseY + m.bl * frameH;   // baseline 에서 위로 bl×h 가 프레임 위
        dup.translate(cur - gb[0], frameTopY - gb[1]);
        try { dup.name = "Letter_" + ch + "_" + _pad2(gi); } catch (eL) {}
        // 칼선 — 인쇄 실루엣과 같은 기하를 KissCut 에 복제한다 (여백 0, 오프셋은 나중에 수동).
        var outline = _artOutlinePath(dup);
        if (outline) {
          var cut = outline.duplicate(kissL, ElementPlacement.PLACEATEND);
          try { cut.name = "Cutline_" + ch + "_" + _pad2(gi); } catch (eC) {}
          _forceCutContourStroke(cut, cutSpot);
        } else {
          noCut.push(ch);
        }
        cur += m.aw * frameH + block.innerGap;
      }
    }
    sheetDoc.selection = null;
    try { $.gc(); } catch (eGc) {}
    // **칼선 없는 글자는 절대 조용히 넘기지 않는다.** 인쇄는 멀쩡한데 안 잘리는 시트가
    // 나가면 실물을 보기 전엔 모른다. 글자는 다 그려 놓고(눈으로 확인 가능) 여기서 터뜨린다.
    if (noCut.length > 0) {
      throw new Error("아트 글자 " + noCut.join(",") + " 의 칼선을 못 만들었습니다 — " +
        "라이브러리 글자 구조가 바뀌었는지 확인 (바깥 실루엣 도형 1개가 있어야 함)");
    }
    return {
      count: block.chars.length,
      pieces: block.chars.length,
      piecesAreLetters: true,
      missingGlyphs: missing,
      // 아트는 글자 속구멍이 아니라 그림 디테일(체커보드·줄무늬)이 최소 도형이라
      // _minCounterPt 를 태우면 0.35mm 위험선에 늘 걸린다 — 의미 없는 경고라 안 잰다.
      minCounterPt: null
    };
  }

  // ══ 이름 스펙 — Range 전용 (2026-09-12) ═══════════════════════════
  //   · 큰 레터 이름은 엔진(v3)이 위 가운데에 놓고 양옆 세로 셀·데코 자리까지 함께 짠다.
  //   · 아트는 대문자 A–Z 뿐 — 한글·숫자 이름은 이름 스티커를 건너뛰고 보고한다 (그 시트는 데코도 없다).
  function _rangeNameSpec(stickerName, binW, gapPt) {
    if (!stickerName) return null;
    var spec = _letterBlockSpec(stickerName, LETTER_UNIT_MM, "ALPHA");
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

  // 큰 레터 이름 스펙 — 아트 알파벳 16mm 유닛, 폭 상한 안으로 유닛을 낮춘다. null = 이름 없음/아트 불가.
  function _rangeHeroSpec(stickerName, maxWPt) {
    var spec = _letterBlockSpec(stickerName, RANGE_HERO_UNIT_MM, "ALPHA_HERO");
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
      _closeLetterArtLib();
      _closeDecoArtLib();
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

  function _showDialog(pairsArg, defaultName) {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 18;
    dlg.spacing = 12;

    var note = dlg.add("statictext", undefined,
      "테스트용 별도 스크립트 — Everstory_mixed.jsx 와 같은 입력·템플릿·출력 규약. 매니페스트 프리필 없음.");
    try { note.graphics.foregroundColor = note.graphics.newPen(note.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eN) {}

    var namePanel = dlg.add("panel", undefined, "고객 이름");
    namePanel.orientation = "column";
    namePanel.alignChildren = "fill";
    namePanel.margins = [14, 18, 14, 14];
    var nameInput = namePanel.add("edittext", undefined, defaultName || "");
    nameInput.preferredSize = [320, 24];

    // 스티커 이름 — 헤더의 고객 이름과 **별개**다 (선물이면 받는 사람 이름). 비우면 이름
    // 스티커도 데코도 안 넣는다. mixed.jsx 와 같은 규약.
    var stickerPanel = dlg.add("panel", undefined, "스티커 이름 (비우면 이름·데코 없음)");
    stickerPanel.orientation = "column";
    stickerPanel.alignChildren = "fill";
    stickerPanel.margins = [14, 18, 14, 14];
    stickerPanel.spacing = 6;
    var stickerInput = stickerPanel.add("edittext", undefined, "");
    stickerInput.preferredSize = [320, 24];
    var stickerHint = stickerPanel.add("statictext", undefined,
      "A–Z 이름 → 아트 알파벳(위 가운데) + 데코 " + DECO_EXTRA + "개(+디자인 수). 한글·숫자는 아직 없음 (이름·데코 없이 사진만)");
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
    materialDropdown.selection = 0;
    materialDropdown.preferredSize = [250, 24];

    var orderGroup = detailPanel.add("group");
    orderGroup.orientation = "row";
    orderGroup.alignChildren = "center";
    orderGroup.add("statictext", undefined, "주문번호");
    var orderInput = orderGroup.add("edittext", undefined, "");
    orderInput.preferredSize = [250, 24];

    var dateGroup = detailPanel.add("group");
    dateGroup.orientation = "row";
    dateGroup.alignChildren = "center";
    dateGroup.add("statictext", undefined, "날짜");
    var dateInput = dateGroup.add("edittext", undefined, _todayIso());
    dateInput.preferredSize = [250, 24];

    var rangePanel = dlg.add("panel", undefined, "크기 범위 (정사각 환산 면적 등급 · 칼선 포함)");
    rangePanel.orientation = "column";
    rangePanel.alignChildren = "left";
    rangePanel.margins = [14, 18, 14, 14];
    rangePanel.spacing = 6;
    var rangeRadios = [];
    for (var ro = 0; ro < RANGE_OPTIONS.length; ro++) {
      rangeRadios.push(rangePanel.add("radiobutton", undefined, RANGE_OPTIONS[ro]));
    }
    rangeRadios[RANGE_DEFAULT_INDEX].value = true;

    var candPanel = dlg.add("panel", undefined, "배치 후보 (같은 규칙, 다른 시드)");
    candPanel.orientation = "row";
    candPanel.alignChildren = "center";
    candPanel.margins = [14, 18, 14, 14];
    candPanel.spacing = 8;
    var candDropdown = candPanel.add("dropdownlist", undefined, ["후보 1", "후보 2", "후보 3"]);
    candDropdown.selection = 0;
    candDropdown.preferredSize = [140, 24];
    var candHint = candPanel.add("statictext", undefined, "후보 = 같은 규칙, 다른 시작 순서 (행 안 배열이 달라진다)");
    try { candHint.graphics.foregroundColor = candHint.graphics.newPen(candHint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eCh) {}

    var pairsPanel = dlg.add("panel", undefined, "사용할 사진 페어 (multi-select · 1 · 4~6 · 8개)");
    pairsPanel.orientation = "column";
    pairsPanel.alignChildren = "fill";
    pairsPanel.margins = [14, 18, 14, 14];
    pairsPanel.spacing = 6;

    var pairItems = [];
    for (var pli = 0; pli < pairsArg.length; pli++) pairItems.push(pairsArg[pli].base);
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
    var countLabel = countRow.add("statictext", undefined, "선택: 0");
    countLabel.preferredSize = [120, 18];
    var hintLabel = countRow.add("statictext", undefined, "1·4~6개 → 1시트 / 8개 → 2시트 (4+4) · 디자인마다 같은 장수, 비율대로 셀 계산 (면적 같게)");
    try { hintLabel.graphics.foregroundColor = hintLabel.graphics.newPen(hintLabel.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eHi) {}

    function _syncCount() {
      var sel = pairsListbox.selection;
      var selLen = sel ? sel.length : 0;
      countLabel.text = "선택: " + selLen + (_isAllowedDesignCount(selLen) ? "" : " (1·4·5·6·8 아님)");
    }
    pairsListbox.onChange = _syncCount;

    // 기본 선택: 4개까지 (그보다 적으면 있는 만큼)
    var initialSel = [];
    for (var isi = 0; isi < pairItems.length && isi < 4; isi++) initialSel.push(pairsListbox.items[isi]);
    pairsListbox.selection = initialSel;
    _syncCount();

    var cutPanel = dlg.add("panel", undefined, "칼선 여백");
    cutPanel.orientation = "row";
    cutPanel.margins = [14, 18, 14, 14];
    cutPanel.spacing = 14;
    var cutRadios = [];
    for (var cm = 0; cm < CUT_MARGIN_OPTIONS.length; cm++) {
      cutRadios.push(cutPanel.add("radiobutton", undefined, CUT_MARGIN_OPTIONS[cm]));
    }
    cutRadios[CUT_MARGIN_DEFAULT_INDEX].value = true;

    var btnGroup = dlg.add("group");
    btnGroup.alignment = "right";
    btnGroup.spacing = 10;
    btnGroup.add("button", undefined, "취소", { name: "cancel" });
    var okBtn = btnGroup.add("button", undefined, "생성", { name: "ok" });
    okBtn.active = true;

    okBtn.onClick = function () {
      if (!_trim(nameInput.text)) {
        alert("이름이 비어 있습니다.");
        return;
      }
      var selLen = pairsListbox.selection ? pairsListbox.selection.length : 0;
      if (!_isAllowedDesignCount(selLen)) {
        alert("Small/Large 는 사진 1개, 4~6개 또는 8개를 선택하세요 (지금 " + selLen + "개).");
        return;
      }
      dlg.close(1);
    };

    if (dlg.show() !== 1) return null;

    var rangeKey = RANGE_KEYS[RANGE_DEFAULT_INDEX];
    for (var ri = 0; ri < rangeRadios.length; ri++) {
      if (rangeRadios[ri].value) { rangeKey = RANGE_KEYS[ri]; break; }
    }
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
    if (selectedPairs.length === 0) {
      alert("페어가 선택되지 않았습니다.");
      return null;
    }

    return {
      nameText: _trim(nameInput.text),
      stickerName: _trim(stickerInput.text),
      material: materialText,
      orderNumber: _trim(orderInput.text),
      orderDate: _trim(dateInput.text) || _todayIso(),
      range: rangeKey,
      candidate: candDropdown.selection ? candDropdown.selection.index : 0,
      cutMarginMm: cutMarginMm,
      selectedPairs: selectedPairs
    };
  }

  // ═════════════════════════════════════════════════════════
  //  아래는 Everstory_mixed.jsx (2026-09-06) 그대로 — 페어 수집 · 템플릿 · 칼선 캐시 ·
  //  트레이스 · 사진 배치 · 저장. 고칠 일이 있으면 mixed.jsx 를 먼저 고치고 여기로 복사한다.
  //  (_collectPairs 만 3버킷/tier 토큰 파싱을 뺐다 — 이 모드는 파일명 토큰을 쓰지 않는다.)
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
