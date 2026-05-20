// Everstory — Mixed-size photo sheet (Name Included header + 디자인 cap + multiselect)
//
// 목적:
//   Name Included 시트 위에 사진 스티커를 단일 사이즈 (XS/S/M/L/XL/XXL 인치 6단계) 또는
//   Mixed (2.5/2 고정 + 1.25/1in 동적 fill) 으로 배치한다. 다이얼로그 ListBox 에서 사용할 페어를
//   직접 multiselect 하고, 사이즈별 디자인 cap 에 자동으로 맞춘다 (auto-cap).
//
// 디자인 cap (no_cap 변형 — 단일 사이즈 = 시트 슬롯 수, v2 의 4-5회 반복 cap 제거):
//   XS 0.75" → 63 / S 1" → 35 / M 1.25" → 20 / L 1.5" → 12 / XL 2" → 9 / XXL 2.5" → 6
//   Mixed → 1 디자인 고정 (Mixed 패커는 layoutPairs[0] 단일 사용 — v2 와 동일, 변경 없음)
//
// 동작:
//   1. 02_cutout 폴더 선택
//   2. 다이얼로그: 고객 이름 / 헤더 정보 / 페어 ListBox (multiselect) /
//      사이즈 dropdown (인치 6단계 + Mixed) / 칼선 여백 / gap input + 최적값 자동
//      - 사이즈 변경 시 cap 갱신 + 선택 자동 trim (auto-cap)
//   3. templates/template_cutout_v2.ait 열기 (info > body PathItem, info > header > header_right TextFrame 사용)
//   4. info > header > header_right 영역에 우측 정렬 3줄 (이름/사이즈/재질, 디자인수, Order/date) 배치
//   5. info > body 영역에 선택한 페어를 packing
//      - 단일 사이즈: 적응형 직사각 셀 (max cellW × max cellH) 위 cols × rows uniform grid.
//        모든 행이 같은 디자인 round-robin 순서, 외곽 4면 = 내부 gap 자동 균등 분배
//      - Mixed: 2.5×1 + 2×3 를 먼저 같은 row 우선으로 배치하고, 남은 공간은 1.25/1in 균형 fill
//   6. trace cache: 같은 sil.png 는 시트당 1회만 Image Trace, hidden TraceStash 캐시
//   7. 03_output 폴더에 .ai 자동 저장 (timestamp_size_sheet01.ai)
//
// 사용법: File → Scripts → Other Script → Everstory_mixed_v2.jsx

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "v20 v2 template";
  var SCRIPT_TITLE = "Everstory Mixed Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var BODY_PADDING_MM = 0;  // body 안쪽 상하좌우 여백 (0 = body PathItem 까지 끝까지 사용)
  // 단일 사이즈 (uniform grid) 는 시각 간격을 자동 균등 분배하므로 gap 입력 불필요.
  // Mixed 모드 _packMixedZones 만 zone 사이 간격으로 이 default 를 사용.
  var GAP_DEFAULT_MM = 1.5;

  // A5 body 148×195mm, padding 0, gap 1.5mm 기준 사이즈별 셀 수.
  // 인치 6단계 (XS 0.75 / S 1 / M 1.25 / L 1.5 / XL 2 / XXL 2.5") 기준.
  // minRepeat 동적 계산 baseline (floor(slots / designCount)).
  var SLOTS_BY_SIZE = {
    19.05: 63,   // 0.75"
    25.4:  35,   // 1"
    31.75: 20,   // 1.25"
    38.1:  12,   // 1.5"
    50.8:  9,    // 2"   (placeholder, 컷-락 실측 필요)
    63.5:  6     // 2.5"
  };

  // minRepeat 미세조정 override. key = "{sizeMm}_{designCount}", value = 강제 minRepeat 정수.
  // 예: "31.75_5": 3 → 1.25" 5디자인일 때 floor(20/5)=4 대신 3 으로 강제.
  // 비워두면 동적 계산 그대로 사용. 운영 검수 후 필요한 case 만 채워 넣는다.
  var MIN_REPEAT_OVERRIDE = {};

  var MIXED_SIZE_VALUE = -1;     // sentinel for Mixed mode in SIZE_VALUES
  var TIER_SIZE_VALUE = -2;      // sentinel for 5-Tier mode in SIZE_VALUES
  var PACKAGE_SIZE_VALUE = -3;   // sentinel for Package mode (packing 은 일단 5-Tier fallback — pending: 정확한 룰)
  var MIXED_MAX_DESIGNS = 1;     // Mixed 는 디자인 1개만 사용
  var PACKAGE_MAX_DESIGNS = 8;   // Package: 8 selected photos cap (Full 기준)

  // Mixed baseline. 2.5×1 + 2×3 는 고정 보장, 1.25/1in 은 _packMixedZones 가 남은 공간에 균형 fill.
  // copies 는 header/spec fallback 용 baseline 이며, 운영 배치의 filler copy 수는 고정하지 않는다.
  var MIXED_PATTERN = [
    { sizeMm: 63.5,  copies: 1 },   // 2.5"  × 1 fixed
    { sizeMm: 50.8,  copies: 3 },   // 2" × 3 fixed
    { sizeMm: 31.75, copies: 6 },   // 1.25" filler fallback
    { sizeMm: 25.4,  copies: 6 }    // 1"    filler fallback
  ];
  var MIXED_FIXED_PATTERN = [
    { sizeMm: 63.5,  copies: 1 },
    { sizeMm: 50.8,  copies: 3 }
  ];
  var MIXED_FILL_SIZES = [31.75, 25.4];

  // Hero row (2.5") 옆 약 80mm 빈 폭에 1.25" 2×2 grid 를 stack 으로 끼워서 dead space 제거.
  // 1.25"×2 stacked = 64.5mm 로 hero 높이(63.5mm) 와 거의 일치 → row 정렬 자연스러움.
  // _appendMixedFixedRows 가 hero 직후 1회만 시도. 다른 row 는 stack 안 받음 (horizontal fill 만).
  var MIXED_HERO_STACK = { sizeMm: 31.75, cols: 2, rows: 2 };  // 1.25" 2×2 (64.5×64.5mm)

  // 2" row 끝 여유 폭에 1" 1×2 vertical stack 을 끼워서 dead space 제거 (portrait aspect 등에서 발동).
  // square aspect + 2×3 처럼 폭이 부족하면 _canAddToShelfRow 가 자동 reject → skip.
  // _fillMixedRowBalanced 가 horizontal filler 보다 먼저 1회 시도.
  var MIXED_ROW_END_STACK = { sizeMm: 25.4, cols: 1, rows: 2 };  // 1" 1×2 vertical (25.4×51.8mm)

  // no_cap 변형: 단일 사이즈 cap = 시트 물리 슬롯 수 (SLOTS_BY_SIZE 그대로 재사용).
  // v2 의 "디자인당 4-5회 반복" cap (13/7/5/3/3/1) 제거 — 한 시트가 담을 수 있는
  // 최대 디자인 수까지 자유 선택. 각 디자인 최소 1회 보장, 슬롯 초과 silent drop 없음.
  // (SLOTS_BY_SIZE 와 단일 출처 — slots 가 바뀌면 cap 도 자동 추종.)
  var DESIGN_LIMIT_BY_SIZE_MM = SLOTS_BY_SIZE;

  // 인치 6단계 + Mixed sentinel. 라벨은 products.md size option 표기 (letter code 없이 inch / 반올림 mm).
  var SIZE_OPTIONS = [
    "0.75\" / 19mm",
    "1\" / 25mm",
    "1.25\" / 32mm",
    "1.5\" / 38mm",
    "2\" / 51mm",
    "2.5\" / 64mm",
    "Mixed 2.5/2 + 1.25/1in",
    "5-Tier (파일명 _XS/_S/_M/_L/_FAM)",
    "Package (4 designs / 2 sheets · 8 designs / 2 sheets)"
  ];
  var SIZE_VALUES = [19.05, 25.4, 31.75, 38.1, 50.8, 63.5, MIXED_SIZE_VALUE, TIER_SIZE_VALUE, PACKAGE_SIZE_VALUE];
  var SIZE_LETTERS = ["XS", "S", "M", "L", "XL", "XXL", "MIX", "T5", "PKG"];
  // products.md size option 의 반올림 mm — 표기를 SOT 에 고정 (Math.round fallback 있음).
  var SIZE_MM_LABEL = { 19.05: 19, 25.4: 25, 31.75: 32, 38.1: 38, 50.8: 51, 63.5: 64 };
  var SIZE_DEFAULT_INDEX = 1;  // S = 1" — 다이어리 표준 사이즈
  var CUT_MARGIN_OPTIONS = ["0mm", "0.5mm", "1mm", "2mm"];
  var CUT_MARGIN_VALUES = [0, 0.5, 1, 2];
  var CUT_MARGIN_DEFAULT_INDEX = 2; // 기본 1mm 유지 — 0/0.5mm 는 운영자가 의도적으로 선택
  var MATERIAL_OPTIONS = ["White Matte", "Translucent", "Silver", "Gold"];

  // ── 5-Tier 모드 (no_cap 변형, 파일명 토큰 입력) ───────────────────
  // 고객이 사진마다 사이즈를 임의 지정. Phase A 파일명 = {folder}_{NN}_{TIER}:
  // 끝에 _XS/_S/_M/_L/_FAM (대소문자 무시). 토큰 없으면 S(=1") 기본.
  // 접미사(_sil/_clean) strip 후 끝에 anchored — 레거시 _{NN}(숫자) 는 tier 글자와 안 겹침.
  // L=2"(50.8mm) 는 신규 값 — tier 패커는 인치만 받으므로 단일 사이즈 표 무변경.
  var TIER_SIZE_MM = { XS: 19.05, S: 25.4, M: 38.1, L: 50.8, FAM: 63.5 };
  var TIER_ORDER = ["XS", "S", "M", "L", "FAM"];  // 오버플로우 상승 trim 순서 (FAM 보호: trim 제외)
  var TIER_DEFAULT = "S";
  // _sil.png/_clean.psd 접미사 제거 후 이름 끝의 _TIER 토큰. XS 를 S 보다 앞에 둬 부분매칭 방지.
  var TIER_TOKEN_RE = /_(XS|FAM|S|M|L)$/i;
  // shelf 충전 한계 (ragged edge). 면적 예산 사전 trim 게이트 — 보수적으로 잡아 packer leftover 최소화.
  var TIER_PACK_EFFICIENCY = 0.80;

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

  var defaultCustomerName = _deriveDefaultCustomerName(inputFolder);
  var options = (testConfig && testConfig.options) ? testConfig.options : _showDialog(pairs, defaultCustomerName);
  if (!options) return;

  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    alert("template_cutout_v2.ait를 찾을 수 없습니다.");
    return;
  }

  var doc = _openTemplateDoc(templateFile);
  var bodyPath, headerRightText;
  try {
    bodyPath = _findInfoPath(doc, "body");
    headerRightText = _findInfoPath(doc, "header_right");
  } catch (eBorder) {
    alert(eBorder.message);
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose) {}
    return;
  }

  var padPt = BODY_PADDING_MM * MM_TO_PT;
  // 단일 사이즈는 uniform grid 가 시각 간격을 자동 균등 분배하므로 gap 입력 불필요.
  // Mixed 모드는 _packMixedZones 가 zone 사이 간격으로 사용 — GAP_DEFAULT_MM 고정.
  var gapPt = GAP_DEFAULT_MM * MM_TO_PT;
  var cutMarginPt = options.cutMarginMm * MM_TO_PT;

  var bodyBounds = bodyPath.geometricBounds;
  var bL = bodyBounds[0], bT = bodyBounds[1], bR = bodyBounds[2], bB = bodyBounds[3];
  var binW = (bR - bL) - 2 * padPt;
  var binH = (bT - bB) - 2 * padPt;

  if (binW <= 0 || binH <= 0) {
    alert("info > body 영역이 BODY_PADDING_MM 보다 작습니다.");
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose2) {}
    return;
  }

  var printLayer = doc.layers.add();
  printLayer.name = "PrintData";
  var kissLayer = doc.layers.add();
  kissLayer.name = "KissCut";
  var cutSpot = _ensureCutContour(doc);

  // 다이얼로그에서 selectedPairs 받음. testConfig (selectedPairs 없음) 면 pairs 전체 사용.
  var layoutPairs = (options.selectedPairs && options.selectedPairs.length > 0) ?
    options.selectedPairs : pairs;

  var totalIgnoredCount = 0;
  var tierTrim = null;

  if (options.isTiered) {
    // 5-Tier: 개수 cap 없음. aspect 측정 → 면적 예산 사전 trim (Phase 3, Option 1).
    for (var ta = 0; ta < layoutPairs.length; ta++) {
      try { _measurePairAspect(layoutPairs[ta]); }
      catch (eTa) { layoutPairs[ta].aspect = 1; }
    }
    tierTrim = _tierAreaBudget(layoutPairs, binW, binH);
    if (tierTrim.rejected) {
      alert("Family(2.5\") 사진만으로 A5 한 시트를 초과합니다.\n" +
            "Family 수를 줄이거나 일부를 L 이하로 조정하세요. (Family 는 자동 trim 안 함 — 운영자 확인 필요)");
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eTrj) {}
      return;
    }
    layoutPairs = tierTrim.kept;
    totalIgnoredCount = pairs.length - layoutPairs.length;
  } else {
    // 안전판: testConfig 경로에서도 cap 위반은 잘라낸다 (다이얼로그는 auto-cap 으로 자체 보장).
    var designLimit = options.isMixed ? MIXED_MAX_DESIGNS : (DESIGN_LIMIT_BY_SIZE_MM[options.sizeMm] || layoutPairs.length);
    if (layoutPairs.length > designLimit) {
      var capped = [];
      for (var ci = 0; ci < designLimit; ci++) capped.push(layoutPairs[ci]);
      layoutPairs = capped;
    }
    totalIgnoredCount = pairs.length - layoutPairs.length;

    var anyTooBig = false;
    for (var pi = 0; pi < layoutPairs.length; pi++) {
      try {
        _measurePairAspect(layoutPairs[pi]);
      } catch (eAsp) {
        layoutPairs[pi].aspect = 1;
      }
      if (options.isMixed) {
        // Mixed: 고정 2.5" hero cell 이 시트에 들어가는지 검사
        var heroItem = _itemForSize(layoutPairs[pi], MIXED_FIXED_PATTERN[0].sizeMm);
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
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eABig) {}
      return;
    }
  }

  var packResult;
  if (options.isTiered) {
    packResult = _packTiered(layoutPairs, binW, binH, gapPt);
  } else if (options.isMixed) {
    // Mixed: 2.5×1 + 2×3 를 보장하고, 가능한 경우 같은 row 에 먼저 배치.
    var pair = layoutPairs[0];
    packResult = _packMixedZones(pair, binW, binH, gapPt);
    // 1 디자인이라 첫 placement 1개를 빼고 모두 repeated 로 카운트.
    packResult.repeatedCount = Math.max(0, packResult.placed.length - 1);
  } else {
    // 단일 사이즈: 적응형 직사각 셀 위 격자 packer. 모든 행 동일 순서, 외곽 4면 = 내부 gap 균등.
    // gap 입력은 최소 floor 이고 시각 간격은 (binW - cols × cellBoxW) / (cols + 1) 로 자동 분배.
    packResult = _uniformGridPack(layoutPairs, binW, binH, gapPt);
  }

  // _shelfRowsToPlaced 가 per-row + 세로 justify 로 final body 좌표 직접 산출 — 별도 centering 불필요

  var orderDetail = _buildOrderDetail(options, layoutPairs.length, packResult);
  _drawProductionHeader(options, layoutPairs.length, headerRightText);

  var uniquePairs = _uniquePairsFromPlaced(packResult.placed);
  var failedItems = [];
  var traceFailures = [];
  var skippedPlacements = 0;
  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  try {
    traceFailures = _buildCutlineCache(doc, uniquePairs, cutSpot);
    // trace 실패 base 들을 set 으로 모아 placement 시도 자체를 skip — 같은 base 가 8번 "cache 없음" 에러
    // 발생하던 노이즈 제거. 운영자는 trace 실패 1건만 보고 IL 재시작 후 해당 페어 재시도.
    var failedBases = {};
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
      var aiX = bL + padPt + pl.x;
      var aiY = bT - padPt - pl.y;
      try {
        _placePhotoSticker(doc, pl.payload, aiX, aiY, pl.w, pl.h, cutMarginPt, printLayer, kissLayer, cutSpot, pl.rotated);
      } catch (ePlace) {
        failedItems.push({
          base: pl.payload.base,
          error: (ePlace && ePlace.message) ? ePlace.message : String(ePlace)
        });
      }
    }
  } finally {
    _cleanupTraceStash(doc);
    app.userInteractionLevel = prevInteraction;
  }

  try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eKiss) {}
  try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (ePrint) {}
  doc.selection = null;

  // 03_output 자동 저장
  var savedPath = "";
  var saveError = "";
  try {
    var outFolder = _resolveOutputFolder(inputFolder);
    var sizeTag = options.isPackage ? "PKG" : (options.isTiered ? "T5" : (options.isMixed ? "MIX" : _inchStr(options.sizeMm)));
    var fileName = _timestamp() + "_" + sizeTag + "_sheet01.ai";
    var saveFile = new File(outFolder.fsName + "/" + fileName);
    _saveAi(doc, saveFile);
    savedPath = saveFile.fsName;
  } catch (eSave) {
    saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
  }

  var sizeLineText;
  if (options.isTiered) {
    sizeLineText = "5-Tier (파일명): " + _tierDistStr(layoutPairs) +
      (tierTrim && tierTrim.trimmed.length > 0
        ? " / 예산 trim XS" + tierTrim.trimmedByTier.XS + " S" + tierTrim.trimmedByTier.S +
          " M" + tierTrim.trimmedByTier.M + " L" + tierTrim.trimmedByTier.L
        : "") +
      " / 칼선 여백: " + options.cutMarginMm + "mm";
  } else if (options.isMixed) {
    var mixedSummary = packResult.mixedSummary;
    sizeLineText = "Mixed: " + (mixedSummary ? mixedSummary.human : _mixedHumanString()) +
      " (디자인 1개) / 칼선 여백: " + options.cutMarginMm + "mm";
  } else {
    sizeLineText = "기본 사이즈: " + _sizeLetter(options.sizeMm) + " " + _inchStr(options.sizeMm) +
      " (" + _mmCmStr(options.sizeMm) + ") cap " + designLimit +
      " / 칼선 여백: " + options.cutMarginMm + "mm";
  }

  var inputLine = "사진 입력: " + pairs.length + "개 / 사용: " + layoutPairs.length + "개";
  if (totalIgnoredCount > 0) inputLine += " / 제외: " + totalIgnoredCount + "개";
  var actualPlaced = packResult.placed.length - skippedPlacements;
  inputLine += " / 사진 배치: " + actualPlaced + "개";
  if (skippedPlacements > 0) inputLine += " (trace fail skip " + skippedPlacements + ")";

  var saveLine = savedPath ?
    ("저장: " + savedPath) :
    ("저장 실패: " + (saveError || "unknown") + " — Illustrator 에서 직접 저장하세요.");

  var msg =
    "완료: Name Included 시트 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + "\n" +
    "실행 파일: " + _scriptFileHint() + "\n" +
    "고객 이름: " + options.nameText + "\n" +
    "헤더: info > header > header_right (값만) / 이름 스티커: 없음\n" +
    "오더 디테일: " + _orderDetailToString(orderDetail) + "\n" +
    sizeLineText + "\n" +
    inputLine +
    (packResult.repeatedCount > 0 ? " (반복 채움 " + packResult.repeatedCount + "개 포함)" : "") + "\n" +
    "행: " + packResult.rows.length + "개" +
    (options.isTiered ? " (5-Tier: FFDH base + tier 단위 균일 반복 + 기회주의 회전)\n" : options.isMixed ? " (2.5/2 고정 + 1.25/1 half fill)\n" : " (uniform grid — 외곽 4면 = 내부 gap 균등 자동 분배)\n") +
    (options.isTiered
      ? "5-Tier 배치: " + packResult.placed.length + "개 (미배치 " + packResult.leftover.length + ") / 입력 디자인 " + layoutPairs.length + "개\n"
      : options.isMixed
      ? "Mixed 슬롯: " + (packResult.mixedSummary ? packResult.mixedSummary.human : _mixedHumanString()) +
        " = " + (packResult.mixedSummary ? packResult.mixedSummary.total : _mixedTotalSlots()) +
        " (디자인 1개 / " + (packResult.mixedSummary ? packResult.mixedSummary.zoneRows : "zone") + ")\n"
      : "그리드: " + packResult.cols + "×" + packResult.gridRows + " = " + packResult.slots + " 슬롯 / 디자인 " + layoutPairs.length + "개" +
        (layoutPairs.length > 0 ? " × " + Math.floor(packResult.slots / layoutPairs.length) + "회" + ((packResult.slots % layoutPairs.length) > 0 ? " (+" + (packResult.slots % layoutPairs.length) + " 보너스)" : "") : "") + "\n") +
    "Trace 캐시: unique " + uniquePairs.length + "개 (배치 " + packResult.placed.length + "회 → trace " + uniquePairs.length + "회)\n" +
    (packResult.leftover.length > 0 ? "미배치 사진: " + packResult.leftover.length + "개\n" : "") +
    saveLine;

  if (failedItems.length > 0) {
    // base 별 dedupe — 같은 페어의 trace fail + cache 없음 후폭풍이 누적된 케이스 1줄로 정리
    var failedFirstError = {};
    var failedOrder = [];
    for (var fi = 0; fi < failedItems.length; fi++) {
      var b = failedItems[fi].base;
      if (failedFirstError[b] == null) {
        failedFirstError[b] = failedItems[fi].error;
        failedOrder.push(b);
      }
    }
    msg += "\n\ntrace 실패 " + failedOrder.length + "건 (해당 페어는 시트에서 자동 제외됨, Illustrator 재시작 후 재시도 권장):";
    for (var fk = 0; fk < failedOrder.length; fk++) {
      msg += "\n- " + failedOrder[fk] + ": " + failedFirstError[failedOrder[fk]];
    }
    if (skippedPlacements > 0) {
      msg += "\n→ skip 된 placement: " + skippedPlacements + "개 (위 페어들의 추가 등장 회수)";
    }
  }
  if (testConfig) {
    testConfig.lastMessage = msg;
  } else {
    alert(msg);
  }

  if (testConfig && testConfig.closeAfter) {
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eTestClose) {}
  }


  // ═════════════════════════════════════════════════════════
  //  UI
  // ═════════════════════════════════════════════════════════

  function _showDialog(pairsArg, defaultCustomerName) {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 18;
    dlg.spacing = 12;

    var namePanel = dlg.add("panel", undefined, "고객 이름");
    namePanel.orientation = "column";
    namePanel.alignChildren = "fill";
    namePanel.margins = [14, 18, 14, 14];
    var initialName = (defaultCustomerName && defaultCustomerName.length > 0) ? defaultCustomerName : "Mina";
    var nameInput = namePanel.add("edittext", undefined, initialName);
    nameInput.preferredSize = [320, 24];

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

    var sizePanel = dlg.add("panel", undefined, "사진 스티커 긴 변");
    sizePanel.orientation = "row";
    sizePanel.alignChildren = "center";
    sizePanel.margins = [14, 18, 14, 14];
    sizePanel.spacing = 8;
    var sizeDropdown = sizePanel.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDropdown.selection = SIZE_DEFAULT_INDEX;
    sizeDropdown.preferredSize = [320, 24];

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
    function _capForSize(sizeMm) {
      if (sizeMm === MIXED_SIZE_VALUE) return MIXED_MAX_DESIGNS;
      if (sizeMm === TIER_SIZE_VALUE) return pairsArg.length;  // 5-Tier: 개수 cap 없음 (면적 예산이 처리)
      if (sizeMm === PACKAGE_SIZE_VALUE) return PACKAGE_MAX_DESIGNS;
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
        if (sz === MIXED_SIZE_VALUE) {
          hintLabel.text = "Mixed: 1 디자인 고정";
        } else if (sz === TIER_SIZE_VALUE) {
          hintLabel.text = "5-Tier: 4 디자인 ≈ 2 sheets · 8 디자인 ≈ 2 sheets";
        } else if (sz === PACKAGE_SIZE_VALUE) {
          hintLabel.text = "Package: 4 designs → 2 sheets · 8 designs → 2 sheets";
        } else {
          hintLabel.text = "사이즈에 따라 cap 자동 적용";
        }
      } finally {
        _syncing = false;
      }
    }
    pairsListbox.onChange = _syncCapAndCount;
    sizeDropdown.onChange = _syncCapAndCount;

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

    var hint = dlg.add("statictext", undefined, "info > header > header_right — 우측 정렬 3줄 (이름·사이즈·재질 / 디자인수 / Order·date). 주문번호는 파일명/메타 용도.");
    try { hint.graphics.foregroundColor = hint.graphics.newPen(hint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eHint) {}

    var btnGroup = dlg.add("group");
    btnGroup.alignment = "right";
    btnGroup.spacing = 10;
    btnGroup.add("button", undefined, "취소", { name: "cancel" });
    var okBtn = btnGroup.add("button", undefined, "생성", { name: "ok" });
    okBtn.active = true;

    if (dlg.show() !== 1) return null;

    var nameText = _trim(nameInput.text);
    if (!nameText) {
      alert("이름이 비어 있습니다.");
      return null;
    }

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
      isMixed: (sizeMm === MIXED_SIZE_VALUE),
      isTiered: (sizeMm === TIER_SIZE_VALUE || sizeMm === PACKAGE_SIZE_VALUE),  // Package 는 일단 5-Tier 패킹으로 fallback (pending: 정확한 룰)
      isPackage: (sizeMm === PACKAGE_SIZE_VALUE),
      cutMarginMm: cutMarginMm,
      selectedPairs: selectedPairs
    };
  }

  function _buildOrderDetail(options, photoCount, packResult) {
    var spec;
    if (options.isTiered) {
      spec = "5-Tier/" + options.cutMarginMm + "mm";
    } else if (options.isMixed) {
      var mixedSpec = (packResult && packResult.mixedSummary && packResult.mixedSummary.spec) ?
        packResult.mixedSummary.spec : _mixedSpecString();
      spec = mixedSpec + "/" + options.cutMarginMm + "mm";
    } else {
      spec = _sizeLetter(options.sizeMm) + "/" + _inchStr(options.sizeMm) + "/" + options.cutMarginMm + "mm";
    }
    var orderNum = options.orderNumber ? options.orderNumber : "—";
    return {
      rows: [
        { left: "TYPE: Name Add-on",   right: "MATERIAL: " + options.material },
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

  function _fmtMm(value) {
    if (value === undefined || value === null || isNaN(value)) return "?";
    return (Math.round(value * 10) / 10) + "mm";
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

  // Mixed 패턴 → packItem 배열. _itemForSize 가 pair.aspect 로 cellW/cellH 계산하므로 pair 필요.
  function _buildMixedItems(pair) {
    var items = [];
    for (var p = 0; p < MIXED_PATTERN.length; p++) {
      var pat = MIXED_PATTERN[p];
      for (var c = 0; c < pat.copies; c++) {
        items.push(_itemForSize(pair, pat.sizeMm));
      }
    }
    return items;
  }

  // Mixed 총 슬롯 수 (Σ copies). 결과 알림에 사용.
  function _mixedTotalSlots() {
    var total = 0;
    for (var p = 0; p < MIXED_PATTERN.length; p++) total += MIXED_PATTERN[p].copies;
    return total;
  }

  // Mixed spec 문자열 — 예: "MIX/2.5x1+2x3+1.25x6+1x6". inch 단위, "in" 생략 (간결).
  function _mixedSpecString() {
    var parts = [];
    for (var p = 0; p < MIXED_PATTERN.length; p++) {
      var inch = (MIXED_PATTERN[p].sizeMm / 25.4).toFixed(2).replace(/\.?0+$/, "");
      parts.push(inch + "x" + MIXED_PATTERN[p].copies);
    }
    return "MIX/" + parts.join("+");
  }

  // Mixed 사람용 표기 — 예: "2.5×1 + 2×3 + 1.25×6 + 1×6". 결과 알림 / sizeLineText.
  function _mixedHumanString() {
    var parts = [];
    for (var p = 0; p < MIXED_PATTERN.length; p++) {
      var inch = (MIXED_PATTERN[p].sizeMm / 25.4).toFixed(2).replace(/\.?0+$/, "");
      parts.push(inch + "×" + MIXED_PATTERN[p].copies);
    }
    return parts.join(" + ");
  }

  function _drawProductionHeader(options, photoCount, headerRightText) {
    // 템플릿의 info > header > header_right TextFrame 에 폰트·사이즈·정렬이 미리 잡혀 있다.
    // 값만 contents 로 교체. 새 TextFrame 만들지 않음.
    var sizeToken = options.isPackage
      ? "Package"
      : options.isTiered
      ? "5-Tier"
      : options.isMixed
      ? "Mixed"
      : _inchStr(options.sizeMm) + " / " + (SIZE_MM_LABEL[options.sizeMm] || Math.round(options.sizeMm)) + "mm";

    var orderNum = options.orderNumber ? options.orderNumber : "—";
    var line1 = _nfcHangul(options.nameText) + " • " + sizeToken + " • " + options.material;
    var line2 = photoCount + " design(s)";
    var line3 = "Order: " + orderNum + " | date: " + options.orderDate;

    headerRightText.contents = line1 + "\r" + line2 + "\r" + line3;
    _applyHangulFontOverride(headerRightText, _resolveHangulFont());
  }

  function _moveItemCenterLeft(item, left, centerY) {
    var b = item.geometricBounds;
    var h = b[1] - b[3];
    item.translate(left - b[0], (centerY + h / 2) - b[1]);
  }

  function _moveItemCenterRight(item, right, centerY) {
    var b = item.geometricBounds;
    var h = b[1] - b[3];
    item.translate(right - b[2], (centerY + h / 2) - b[1]);
  }

  function _resolveInfoFont() {
    var candidates = ["Avenir-Book", "HelveticaNeue-Light", "HelveticaNeue", "ArialMT"];
    for (var i = 0; i < candidates.length; i++) {
      try { return app.textFonts.getByName(candidates[i]); } catch (eFont) {}
    }
    if (app.textFonts.length > 0) return app.textFonts[0];
    return null;
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

  function _fitTextToBoxMin(textItem, maxW, maxH, startSize, minSize) {
    var size = startSize;
    for (var i = 0; i < 30; i++) {
      var b = textItem.geometricBounds;
      var w = b[2] - b[0];
      var h = b[1] - b[3];
      if (w <= maxW && h <= maxH) break;
      var rw = maxW / w;
      var rh = maxH / h;
      var r = Math.min(rw, rh);
      size = Math.max(minSize, size * r * 0.96);
      textItem.textRange.characterAttributes.size = size;
      if (size <= minSize) break;
    }
  }

  function _moveItemTopRight(item, right, top) {
    var b = item.geometricBounds;
    item.translate(right - b[2], top - b[1]);
  }

  function _moveItemTopLeft(item, left, top) {
    var b = item.geometricBounds;
    item.translate(left - b[0], top - b[1]);
  }


  // ═════════════════════════════════════════════════════════
  //  CUTLINE TRACE CACHE
  //  같은 sil.png 는 시트당 1회만 Image Trace.
  //  결과 cutline 을 sheet doc 의 hidden TraceStash 레이어에 저장하고
  //  placement 마다 cachedCutline.duplicate() 로 복제한다.
  // ═════════════════════════════════════════════════════════

  function _uniquePairsFromPlaced(placedItems) {
    var seen = {};
    var unique = [];
    for (var i = 0; i < placedItems.length; i++) {
      var pl = placedItems[i];
      if (!pl || !pl.payload) continue;
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

  function _buildCutlineCache(sheetDoc, uniquePairs, cutSpot) {
    var failures = [];
    if (!uniquePairs || uniquePairs.length === 0) return failures;

    var stash = _ensureTraceStashLayer(sheetDoc);

    for (var i = 0; i < uniquePairs.length; i++) {
      var pair = uniquePairs[i];
      if (pair.cachedCutline && pair.cutInfo) continue;

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

    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printLayer;
    var placed = printLayer.placedItems.add();
    placed.file = pair.psd;
    // rotated 면 90° 후 셀을 채우도록 swap 박스(artH×artW)에 맞춰 사이즈. 중심 기준 배치는
    // 비회전일 때 기존 식과 수치 동일(artX+(artW-w)/2 == ccx-w/2) — 비회전 경로 무변경.
    var fitW = rotated ? artH : artW;
    var fitH = rotated ? artW : artH;
    var ratio = Math.min(fitW / placed.width, fitH / placed.height);
    placed.width *= ratio;
    placed.height *= ratio;
    var ccx = artX + artW / 2;
    var ccy = artY - artH / 2;
    placed.left = ccx - placed.width / 2;
    placed.top = ccy + placed.height / 2;

    var psdL = placed.left;
    var psdT = placed.top;
    var psdW = placed.width;
    var psdH = placed.height;

    placed.embed();
    var embG = _stripEmbeddedPSDPathsNear(printLayer, psdL, psdT, psdW, psdH);

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

    // 회전은 PSD 그룹 핸들(embG)을 잡았을 때만. embG 가 null 인데 칼선만 돌리면 컷-사진
    // desync(물리 불량). 그 경우 둘 다 비회전 폴백(셀에 작게 배치되지만 컷은 사진과 일치 — 안전).
    if (rotated && embG) {
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
    _safeRedrawAndGC();
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
    opts.threshold = 230;
    opts.pathFidelity = 10;
    opts.cornerFidelity = 10;
    opts.minimumArea = 250;
    opts.cornerAngle = 20;
    opts.fills = true;
    opts.strokes = false;
    opts.snapCurveToLines = false;
    opts.ignoreWhite = true;

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
        // 접미사 제거 후 끝의 _TIER 토큰 파싱 → pair.tier, base 에서는 strip.
        // psdName 은 raw pngName 치환이라 토큰이 양쪽에 대칭 보존 → 페어링 무영향.
        var nameNoSuffix = pngName.replace(/_sil\.png$/i, "");
        var tierMatch = nameNoSuffix.match(TIER_TOKEN_RE);
        var tier = tierMatch ? tierMatch[1].toUpperCase() : TIER_DEFAULT;
        var cleanName = tierMatch ? nameNoSuffix.substring(0, tierMatch.index) : nameNoSuffix;
        pairs.push({
          psd: psdFile,
          sil: pngFiles[i],
          base: _decodeName(cleanName),
          tier: tier
        });
      }
    }
    return pairs;
  }

  function _decodeName(s) {
    try { return decodeURI(s); } catch (e) { return s; }
  }

  function _measurePairAspect(pair) {
    if (pair.aspect) return pair.aspect;
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

  function _rgb(r, g, b) {
    var c = new RGBColor();
    c.red = r;
    c.green = g;
    c.blue = b;
    return c;
  }


  // ═════════════════════════════════════════════════════════
  //  PACKING
  // ═════════════════════════════════════════════════════════

  // Mixed 모드 전용: pair.cellW/cellH 를 mutate 하지 않고 (단일 사이즈 기준이므로)
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

  // Mixed dense packer:
  //   2.5×1 + 2×3 를 먼저 보장한다.
  //   고정 row 에 남는 가로 공간과 이후 남는 row 는 1.25/1in 을 사용 면적 기준으로 균형 fill 한다.
  function _packMixedZones(pair, binW, binH, gap) {
    var rows = [];
    var counts = {};
    var fillSpecs = _buildMixedFillSpecs(pair);

    if (!_appendMixedFixedRows(rows, pair, fillSpecs, binW, binH, gap, counts)) {
      var fallbackItems = _sortShelfItemsDesc(_buildMixedItems(pair));
      var fallbackPack = { rows: [], placed: [], leftover: [], repeatedCount: 0 };
      fallbackPack.leftover = _appendShelfRowsOnce(fallbackPack, fallbackItems, binW, binH, gap);
      fallbackPack.mixedSummary = {
        spec: _mixedSpecString(),
        human: _mixedHumanString(),
        total: fallbackPack.placed.length,
        zoneRows: ""
      };
      return fallbackPack;
    }

    _appendMixedFillerRows(rows, fillSpecs, binW, binH, gap, counts);

    var placed = _shelfRowsToPlaced(rows, binW, binH, gap);
    return {
      placed: placed,
      leftover: [],
      rows: rows,
      repeatedCount: 0,
      mixedSummary: _buildMixedSummary(counts, placed.length)
    };
  }

  function _buildMixedFillSpecs(pair) {
    var specs = [];
    for (var i = 0; i < MIXED_FILL_SIZES.length; i++) {
      var sizeMm = MIXED_FILL_SIZES[i];
      specs.push({
        sizeMm: sizeMm,
        item: _itemForSize(pair, sizeMm)
      });
    }
    return specs;
  }

  function _appendMixedFixedRows(rows, pair, fillSpecs, binW, binH, gap, counts) {
    var fixedItems = _buildMixedFixedItems(pair);
    var heroSizeMm = MIXED_FIXED_PATTERN[0].sizeMm;
    var row = _newShelfRow(_nextMixedRowY(rows, gap));
    var heroStackTried = false;

    for (var i = 0; i < fixedItems.length; i++) {
      var fixed = fixedItems[i];

      // Hero(첫 fixed item)가 row 에 들어간 직후 1회만 hero stack 시도. fit 되면 hero row 종료 → 나머지 fixed 는 다음 row 부터.
      if (!heroStackTried && row.items.length === 1 && row.items[0].sizeMm === heroSizeMm) {
        heroStackTried = true;
        var heroStack = _tryBuildStackForRow(row, pair, MIXED_HERO_STACK, binW, binH, gap);
        if (heroStack) {
          _addToShelfRow(row, heroStack, gap);
          _addMixedCount(counts, heroStack.innerSizeMm, heroStack.innerCols * heroStack.innerRows);
          rows.push(row);
          row = _newShelfRow(_nextMixedRowY(rows, gap));
        }
      }

      if (!_canAddToShelfRow(row, fixed, binW, binH, gap)) {
        if (row.items.length === 0) return false;
        _fillMixedRowBalanced(row, pair, fillSpecs, binW, binH, gap, counts);
        rows.push(row);
        row = _newShelfRow(_nextMixedRowY(rows, gap));
      }

      if (!_canAddToShelfRow(row, fixed, binW, binH, gap)) return false;
      _addToShelfRow(row, fixed, gap);
      _addMixedCount(counts, fixed.sizeMm, 1);
    }

    if (row.items.length > 0) {
      _fillMixedRowBalanced(row, pair, fillSpecs, binW, binH, gap, counts);
      rows.push(row);
    }

    return true;
  }

  function _buildMixedFixedItems(pair) {
    var items = [];
    for (var p = 0; p < MIXED_FIXED_PATTERN.length; p++) {
      var fixed = MIXED_FIXED_PATTERN[p];
      for (var c = 0; c < fixed.copies; c++) {
        items.push(_itemForSize(pair, fixed.sizeMm));
      }
    }
    return items;
  }

  function _appendMixedFillerRows(rows, fillSpecs, binW, binH, gap, counts) {
    while (true) {
      var row = _newShelfRow(_nextMixedRowY(rows, gap));
      var spec = _chooseMixedFillSpec(fillSpecs, counts, row, binW, binH, gap);
      if (!spec) break;

      while (_canAddToShelfRow(row, spec.item, binW, binH, gap)) {
        _addToShelfRow(row, spec.item, gap);
        _addMixedCount(counts, spec.sizeMm, 1);
      }

      if (row.items.length === 0) break;
      rows.push(row);
    }
  }

  function _fillMixedRowBalanced(row, pair, fillSpecs, binW, binH, gap, counts) {
    // Row-end stack 우선: 행 끝 여유 폭에 1" 1×2 vertical stack 끼우기. fit 안되면 skip.
    var stack = _tryBuildStackForRow(row, pair, MIXED_ROW_END_STACK, binW, binH, gap);
    if (stack) {
      _addToShelfRow(row, stack, gap);
      _addMixedCount(counts, stack.innerSizeMm, stack.innerCols * stack.innerRows);
    }

    while (true) {
      var spec = _chooseMixedFillSpec(fillSpecs, counts, row, binW, binH, gap);
      if (!spec) break;
      _addToShelfRow(row, spec.item, gap);
      _addMixedCount(counts, spec.sizeMm, 1);
    }
  }

  // 행에 stack item 이 들어갈 수 있는지 검사. fit 되면 compound item 반환, 아니면 null.
  // compound item 의 w/h 는 stack block 전체 크기 → `_canAddToShelfRow` 가 가로/세로 fit 검사.
  // spec = { sizeMm, cols, rows } — 호출자가 hero stack 인지 다른 stack 인지 결정.
  function _tryBuildStackForRow(row, pair, spec, binW, binH, gap) {
    if (!pair || !spec) return null;
    var inner = _itemForSize(pair, spec.sizeMm);
    var cols = spec.cols;
    var rowsCount = spec.rows;
    var blockW = cols * inner.w + (cols - 1) * gap;
    var blockH = rowsCount * inner.h + (rowsCount - 1) * gap;

    var stackItem = {
      w: blockW,
      h: blockH,
      payload: pair,
      sizeMm: spec.sizeMm,
      isStack: true,
      innerW: inner.w,
      innerH: inner.h,
      innerCols: cols,
      innerRows: rowsCount,
      innerSizeMm: spec.sizeMm
    };

    if (!_canAddToShelfRow(row, stackItem, binW, binH, gap)) return null;
    return stackItem;
  }

  function _chooseMixedFillSpec(fillSpecs, counts, row, binW, binH, gap) {
    var best = null;
    var bestArea = 0;

    for (var i = 0; i < fillSpecs.length; i++) {
      var spec = fillSpecs[i];
      if (!_canAddToShelfRow(row, spec.item, binW, binH, gap)) continue;

      var usedArea = _mixedUsedArea(counts, spec);
      if (!best ||
          usedArea < bestArea ||
          (Math.abs(usedArea - bestArea) < 0.001 && spec.sizeMm > best.sizeMm)) {
        best = spec;
        bestArea = usedArea;
      }
    }

    return best;
  }

  function _mixedUsedArea(counts, spec) {
    return (_mixedCount(counts, spec.sizeMm) || 0) * spec.item.w * spec.item.h;
  }

  function _nextMixedRowY(rows, gap) {
    if (!rows || rows.length === 0) return 0;
    var last = rows[rows.length - 1];
    return last.y + last.h + gap;
  }

  function _addMixedCount(counts, sizeMm, n) {
    var key = _mixedCountKey(sizeMm);
    counts[key] = (counts[key] || 0) + n;
  }

  function _mixedCount(counts, sizeMm) {
    return counts[_mixedCountKey(sizeMm)] || 0;
  }

  function _mixedCountKey(sizeMm) {
    return String(sizeMm);
  }

  function _buildMixedSummary(counts, total) {
    var order = [63.5, 50.8, 31.75, 25.4];
    var parts = [];
    var humanParts = [];

    for (var i = 0; i < order.length; i++) {
      var sizeMm = order[i];
      var count = _mixedCount(counts, sizeMm);
      if (count <= 0) continue;
      var label = _mixedSizeLabel(sizeMm);
      parts.push(label + "x" + count);
      humanParts.push(label + "×" + count);
    }

    return {
      spec: "MIX/" + parts.join("+"),
      human: humanParts.join(" + "),
      total: total,
      zoneRows: "fixed 2.5x1+2x3 / fill 1.25+1 half"
    };
  }

  function _mixedSizeLabel(sizeMm) {
    return (sizeMm / 25.4).toFixed(2).replace(/\.?0+$/, "");
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

    var startY = 0;
    if (packResult.rows.length > 0) {
      var last = packResult.rows[packResult.rows.length - 1];
      startY = last.y + last.h + gap;
    }

    var row = _newShelfRow(startY);
    var fillerIdx = 0;
    while (true) {
      var added = false;
      for (var step = 0; step < fillerItems.length; step++) {
        var fi = (fillerIdx + step) % fillerItems.length;
        if (_canAddToShelfRow(row, fillerItems[fi], binW, binH, gap)) {
          _addToShelfRow(row, fillerItems[fi], gap);
          packResult.repeatedCount++;
          fillerIdx = (fi + 1) % fillerItems.length;
          added = true;
          break;
        }
      }

      if (added) {
        continue;
      }

      if (row.items.length > 0) {
        packResult.rows.push(row);
        row = _newShelfRow(row.y + row.h + gap);
        continue;
      }

      break;
    }

    if (row.items.length > 0) packResult.rows.push(row);
    packResult.placed = _shelfRowsToPlaced(packResult.rows, binW, binH, gap);
  }

  // _uniformGridPack — 단일 사이즈 모드 packer (v19).
  //   적응형 직사각 셀 (cellBoxW = max cellW, cellBoxH = max cellH) 위에 cols × rows 격자 산출.
  //   gap 입력은 "최소 사진 간격 floor" 이며, 실제 시각 간격은 (binW - cols × cellBoxW) / (cols + 1) 로
  //   균등 자동 분배 (외곽 4면 = 내부 모든 gap 동일). 모든 슬롯은 layoutPairs 를 round-robin 으로
  //   순서대로 채워서 모든 행이 같은 디자인 순서로 보임 — 이전 _shelfPack 의 행마다 hGap 변동 / 마지막
  //   filler 행 듬성듬성 / 디자인 순서 불일치 문제 해결.
  //
  //   반환 shape 은 _shelfPack 과 호환: {placed, leftover, rows, repeatedCount, cols, gridRows, slots, hSpace, vSpace, cellBoxW, cellBoxH}.
  //   leftover 는 항상 [] (격자 슬롯에 디자인 round-robin 이라 못 들어가는 케이스 없음).
  function _uniformGridPack(layoutPairs, binW, binH, gap) {
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
    var vSpace = (binH - rowsCount * cellBoxH) / (rowsCount + 1);
    if (hSpace < 0) hSpace = 0;
    if (vSpace < 0) vSpace = 0;

    var slots = cols * rowsCount;
    var D = layoutPairs.length;

    var placed = [];
    var rowsList = [];
    for (var r = 0; r < rowsCount; r++) {
      var rowItems = [];
      var rowY = vSpace + r * (cellBoxH + vSpace);
      for (var c = 0; c < cols; c++) {
        var slotIdx = r * cols + c;
        var pair = layoutPairs[slotIdx % D];
        var x = hSpace + c * (cellBoxW + hSpace);
        var item = { w: cellBoxW, h: cellBoxH, payload: pair };
        placed.push({ x: x, y: rowY, w: cellBoxW, h: cellBoxH, payload: pair });
        rowItems.push(item);
      }
      rowsList.push({ y: rowY, w: cols * cellBoxW + (cols - 1) * hSpace, h: cellBoxH, items: rowItems });
    }

    var repeatedCount = (slots > D) ? (slots - D) : 0;

    return {
      placed: placed,
      leftover: [],
      rows: rowsList,
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

  // 티어 분포 문자열 (FAM→XS 순, 0 인 tier 생략). 완료 메시지/사이즈 라인 표시용.
  function _tierDistStr(arr) {
    var c = { XS: 0, S: 0, M: 0, L: 0, FAM: 0 };
    for (var i = 0; i < arr.length; i++) {
      var t = arr[i].tier;
      if (c[t] == null) t = TIER_DEFAULT;
      c[t]++;
    }
    var order = ["FAM", "L", "M", "S", "XS"];
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

  // _packTiered — 5-Tier 모드 packer (no_cap 변형). 목적함수 = 면적 충전 최대화 ("좀 못생겨도 OK").
  //   알고리즘: 높이 내림차순 FFDH shelf + 행 마감 전 더 작은 미배치 아이템으로 빈 폭 backfill
  //   (ragged 우측 dead space 감소).
  //   Phase A — 각 사진 1회 배치(base). Phase B (Model B — tier 단위 균일 반복):
  //     · FAM 은 반복 0, 각 1장 고정 ("FAM 무조건 하나" 를 r=1 pin 으로 일반화 — 다중 FAM 도 안 버림).
  //     · 비-FAM tier 는 "그 tier 사진 전부 한 장씩" 을 atomic pass 로 추가. 한 장이라도 못 들어가면
  //       그 pass 전체 롤백 + 그 tier 은퇴 → within-tier 균일 불변식 보존(tier 안 모든 사진 동일 횟수).
  //     · round-robin L→M→S→XS 으로 시트가 닿을 때까지. tier 안 균일·tier끼리는 다름·빈 공간 최소.
  //     · base 단계 leftover 가 있는 tier 은 기반이 이미 비균일 → 반복 대상 제외.
  //   _shelfRowsToPlaced 가 외곽=내부 gap 균등 자동 분배. 반환 shape 은 기존 packResult 호환.
  // 기회주의 90° 회전: 원본 방향 우선 시도, 행에 안 들어갈 때만 회전(w/h swap)으로 재시도. 회전은
  //   placement 인스턴스 단위(같은 사진 복제본이 행 사정 따라 다르게 회전 가능 — 균일은 '횟수' 기준).
  // rotated 태그는 _shelfRowsToPlaced → placed → _placePhotoSticker 로 전달돼 실제 아트워크 회전.
  function _addOriented(row, pair, binW, binH, gap) {
    var up = { w: pair.cellW, h: pair.cellH, payload: pair, rotated: false };
    if (_canAddToShelfRow(row, up, binW, binH, gap)) { _addToShelfRow(row, up, gap); return true; }
    var rot = { w: pair.cellH, h: pair.cellW, payload: pair, rotated: true };
    if (_canAddToShelfRow(row, rot, binW, binH, gap)) { _addToShelfRow(row, rot, gap); return true; }
    return false;
  }

  function _packTiered(pairs, binW, binH, gap) {
    if (!pairs || pairs.length === 0) {
      return { placed: [], leftover: [], rows: [], repeatedCount: 0, cols: 0, gridRows: 0, slots: 0 };
    }
    for (var i = 0; i < pairs.length; i++) _tierBox(pairs[i]);

    var ordered = _sortedPairsForShelf(pairs, false);  // 높이 내림차순 (FFDH)
    var n = ordered.length;
    var done = [];
    for (var d = 0; d < n; d++) done[d] = false;

    var rows = [];
    var row = _newShelfRow(0);
    var leftover = [];

    var p = 0;
    while (p < n) {
      if (done[p]) { p++; continue; }

      if (_addOriented(row, ordered[p], binW, binH, gap)) {
        done[p] = true; p++; continue;
      }

      // 행 마감 전 backfill: 뒤쪽(더 작은) 미배치 아이템으로 남은 폭 채움 (회전 포함)
      var filled = false;
      for (var q = p + 1; q < n; q++) {
        if (done[q]) continue;
        if (_addOriented(row, ordered[q], binW, binH, gap)) {
          done[q] = true; filled = true;
        }
      }
      if (filled) continue;

      if (row.items.length > 0) {
        rows.push(row);
        row = _newShelfRow(row.y + row.h + gap);
        continue;
      }
      // 빈 행에도 안 들어감 = 시트보다 큼. Phase 3 면적예산이 사전 차단 — 안전망.
      // _leftover 플래그: Phase B 에서 이 tier 을 반복 대상에서 제외(within-tier 균일 불변식).
      ordered[p]._leftover = true;
      leftover.push(ordered[p]);
      done[p] = true; p++;
    }
    // Phase B (Model B — tier 단위 균일 반복). FAM 은 반복 0(각 1장 고정, base 에서 끝).
    //   비-FAM tier 는 "그 tier 사진 전부 1장씩" 을 atomic pass 로 추가 — 한 장이라도 안 들어가면
    //   _snapPack 으로 떠둔 직전 상태로 전체 롤백 후 그 tier 은퇴(within-tier 균일 불변식 보존).
    //   round-robin L→M→S→XS, 더 못 채울 때까지. 추가는 면적이 절대 안 늘어나므로 한 번 실패한
    //   tier 은 재성공 불가 → retire-on-first-failure 가 최적.
    var repeatedCount = 0;
    var tierSeq = ["L", "M", "S", "XS"];
    var tierGroups = { L: [], M: [], S: [], XS: [] };
    var tierBlocked = { L: false, M: false, S: false, XS: false };
    for (var gi = 0; gi < n; gi++) {
      var gp = ordered[gi];
      if (gp.tier === "FAM" || !tierGroups[gp.tier]) continue;  // FAM·미지정 tier 반복 제외
      if (gp._leftover) { tierBlocked[gp.tier] = true; continue; }
      tierGroups[gp.tier].push(gp);
    }
    for (var so = 0; so < tierSeq.length; so++) {
      tierGroups[tierSeq[so]] = _sortedPairsForShelf(tierGroups[tierSeq[so]], false);
    }

    var retired = { L: false, M: false, S: false, XS: false };
    var guard = 0;
    var anyActive = true;
    while (anyActive && guard++ < 100000) {
      anyActive = false;
      for (var tsq = 0; tsq < tierSeq.length; tsq++) {
        var T = tierSeq[tsq];
        if (retired[T]) continue;
        var grp = tierGroups[T];
        if (tierBlocked[T] || !grp || grp.length === 0) { retired[T] = true; continue; }

        var snap = _snapPack(rows, row);            // atomic pass: 전부 1장씩, 실패 시 통째 롤백
        var passOk = true;
        for (var pj = 0; pj < grp.length; pj++) {
          if (_addOriented(row, grp[pj], binW, binH, gap)) continue;
          if (row.items.length > 0) {                // 현재 행 포화 → 새 행 열고 1회 재시도
            rows.push(row);
            row = _newShelfRow(row.y + row.h + gap);
          }
          if (_addOriented(row, grp[pj], binW, binH, gap)) continue;
          passOk = false;                            // 빈 행에도 안 들어감 → pass 불가
          break;
        }
        if (passOk) {
          repeatedCount += grp.length;
          anyActive = true;
        } else {
          rows = snap.rows;                          // pass 중 추가/신규행 전부 폐기
          row = snap.row;
          retired[T] = true;
        }
      }
    }

    if (row.items.length > 0) rows.push(row);

    var placed = _shelfRowsToPlaced(rows, binW, binH, gap);
    return {
      placed: placed,
      leftover: leftover,
      rows: rows,
      repeatedCount: repeatedCount,
      cols: 0,
      gridRows: rows.length,
      slots: placed.length
    };
  }

  // _tierAreaBudget — 한 시트 면적 예산 사전 trim (Phase 3, Option 1 정책).
  //   상승 trim: XS→S→M→L 순, 각 tier 안에서 작은 면적부터 제거(시각 손실 최소). FAM 은 보호.
  //   XS~L 전부 빼도 FAM-only 가 예산 초과면 rejected=true → 호출부가 hard reject + alert.
  //   pairs 는 _measurePairAspect 가 선행돼 .aspect 가 채워져 있어야 함 (다른 packer 와 동일 전제).
  function _tierAreaBudget(pairs, binW, binH) {
    var budget = binW * binH * TIER_PACK_EFFICIENCY;

    var buckets = { XS: [], S: [], M: [], L: [], FAM: [] };
    for (var i = 0; i < pairs.length; i++) {
      _tierBox(pairs[i]);
      var t = pairs[i].tier;
      if (!buckets[t]) t = TIER_DEFAULT;
      buckets[t].push(pairs[i]);
    }

    function _area(p) { return p.cellW * p.cellH; }
    function _sum(arr) { var s = 0; for (var k = 0; k < arr.length; k++) s += _area(arr[k]); return s; }
    function _total() {
      return _sum(buckets.XS) + _sum(buckets.S) + _sum(buckets.M) + _sum(buckets.L) + _sum(buckets.FAM);
    }

    var trimmed = [];
    var trimmedByTier = { XS: 0, S: 0, M: 0, L: 0 };
    var ladder = ["XS", "S", "M", "L"];
    for (var li = 0; li < ladder.length && _total() > budget; li++) {
      var b = buckets[ladder[li]];
      b.sort(function (a, c) { return _area(a) - _area(c); });
      while (b.length > 0 && _total() > budget) {
        trimmed.push(b.shift());
        trimmedByTier[ladder[li]]++;
      }
    }

    var rejected = (_total() > budget);  // XS~L 다 비웠는데도 초과 = FAM-only 초과

    var kept = [];
    var keepOrder = ["FAM", "L", "M", "S", "XS"];
    for (var ko = 0; ko < keepOrder.length; ko++) {
      var kb = buckets[keepOrder[ko]];
      for (var kj = 0; kj < kb.length; kj++) kept.push(kb[kj]);
    }

    return {
      kept: kept,
      trimmed: trimmed,
      trimmedByTier: trimmedByTier,
      rejected: rejected,
      famPt2: _sum(buckets.FAM),
      budgetPt2: budget
    };
  }

  // _shelfPack — 단일 사이즈 모드 packer (미사용, _uniformGridPack 이 담당).
  function _shelfPack(originalItems, fillerItems, binW, binH, gap, minRepeat) {
    var rows = [];
    var row = _newShelfRow(0);
    var leftover = [];
    var repeatedCount = 0;
    var reps = (minRepeat && minRepeat > 0) ? minRepeat : 1;

    // 1단계: primary 사이클 minRepeat 회 반복
    for (var rep = 0; rep < reps; rep++) {
      for (var i = 0; i < originalItems.length; i++) {
        if (_canAddToShelfRow(row, originalItems[i], binW, binH, gap)) {
          _addToShelfRow(row, originalItems[i], gap);
          if (rep > 0) repeatedCount++;
          continue;
        }

        if (row.items.length > 0) {
          rows.push(row);
          row = _newShelfRow(row.y + row.h + gap);
        }

        if (_canAddToShelfRow(row, originalItems[i], binW, binH, gap)) {
          _addToShelfRow(row, originalItems[i], gap);
          if (rep > 0) repeatedCount++;
        } else {
          leftover.push(originalItems[i]);
        }
      }
    }

    // 2단계: leftover 0 이고 filler 있으면 round-robin
    if (leftover.length === 0 && fillerItems && fillerItems.length > 0) {
      var fillerIdx = 0;
      while (true) {
        var added = false;
        for (var step = 0; step < fillerItems.length; step++) {
          var fi = (fillerIdx + step) % fillerItems.length;
          if (_canAddToShelfRow(row, fillerItems[fi], binW, binH, gap)) {
            _addToShelfRow(row, fillerItems[fi], gap);
            repeatedCount++;
            fillerIdx = (fi + 1) % fillerItems.length;
            added = true;
            break;
          }
        }

        if (added) {
          continue;
        }

        if (row.items.length > 0) {
          rows.push(row);
          row = _newShelfRow(row.y + row.h + gap);
          continue;
        }

        break;
      }
    }

    if (row.items.length > 0) rows.push(row);

    return {
      placed: _shelfRowsToPlaced(rows, binW, binH, gap),
      leftover: leftover,
      rows: rows,
      repeatedCount: repeatedCount
    };
  }

  // minRepeat 결정 — 1순위: MIN_REPEAT_OVERRIDE lookup, 2순위: floor(slots / designs).
  function _resolveMinRepeat(sizeMm, designCount) {
    if (designCount <= 0) return 1;
    var key = sizeMm + "_" + designCount;
    if (MIN_REPEAT_OVERRIDE[key] != null) {
      return Math.max(1, MIN_REPEAT_OVERRIDE[key]);
    }
    var slots = SLOTS_BY_SIZE[sizeMm];
    if (!slots) return 1;
    return Math.max(1, Math.floor(slots / designCount));
  }

  function _newShelfRow(y) {
    return { y: y, w: 0, h: 0, items: [] };
  }

  // _snapPack — Model B atomic tier-pass 롤백용 스냅샷. rows/현재행을 얕은-깊은 복사:
  //   row 객체와 items 배열은 새로 복제(slice), item 객체 자체는 추가 후 내부 변형이 없어 공유 OK.
  //   롤백 = 호출부에서 rows/row 를 반환값으로 재대입 → pass 중 추가분·신규행 전부 폐기.
  function _snapPack(rowsArr, cur) {
    var rs = [];
    for (var i = 0; i < rowsArr.length; i++) {
      var r = rowsArr[i];
      rs.push({ y: r.y, w: r.w, h: r.h, items: r.items.slice() });
    }
    return { rows: rs, row: { y: cur.y, w: cur.w, h: cur.h, items: cur.items.slice() } };
  }

  function _canAddToShelfRow(row, item, binW, binH, gap) {
    if (item.w > binW || item.h > binH) return false;
    var nextW = row.items.length > 0 ? row.w + gap + item.w : item.w;
    var nextH = row.h > item.h ? row.h : item.h;
    return nextW <= binW && row.y + nextH <= binH;
  }

  function _addToShelfRow(row, item, gap) {
    row.w = row.items.length > 0 ? row.w + gap + item.w : item.w;
    if (item.h > row.h) row.h = item.h;
    row.items.push(item);
  }

  // 행 정렬 정책 (per-row justify + 세로 justify):
  //   - 가로: 행마다 outer L = outer R = inner = (binW - ΣitemW) / (n+1). 행 안 가로 균등 분산
  //   - 세로: outer top = outer bottom = 행 사이 gap = (binH - ΣrowH) / (R+1). 시트 전체 세로 균등 분산
  //   - 행 안 사진 높이 차이는 row 안 center 정렬로 균등 분산
  //   - 입력 gap 은 packing decision (행마다 몇 장 넣을지) 에만 영향, 시각 spacing 은 자동 계산
  //   결과: 사진 상하좌우 여백이 균등 분산. 단 행마다 가로 gap 다름 — 행 안 사진 수에 따라.

  function _shelfRowsToPlaced(rows, binW, binH, gap) {
    var placed = [];
    if (!rows || rows.length === 0) return placed;

    var R = rows.length;
    var sumH = 0;
    for (var k = 0; k < R; k++) sumH += rows[k].h;

    // 세로 justify: outer top = inner row gap = outer bottom
    var vGap = (binH - sumH) / (R + 1);
    if (vGap < 0) vGap = 0;

    var yCursor = vGap;
    for (var r = 0; r < R; r++) {
      var row = rows[r];
      var n = row.items.length;
      if (n === 0) continue;

      var sumW = 0;
      for (var i = 0; i < n; i++) sumW += row.items[i].w;

      // 가로 justify (per-row): outer L = inner = outer R
      var hGap = (binW - sumW) / (n + 1);
      if (hGap < 0) hGap = 0;

      var xCursor = hGap;
      for (var j = 0; j < n; j++) {
        var item = row.items[j];

        // Stack item: cols × rows 로 expand. 행에서 가장 키 큰 stack 이 row.h 결정 → top 정렬.
        if (item.isStack) {
          var stackTopY = yCursor + (row.h - item.h) / 2;
          for (var sr = 0; sr < item.innerRows; sr++) {
            for (var sc = 0; sc < item.innerCols; sc++) {
              var sx = xCursor + sc * (item.innerW + gap);
              var sy = stackTopY + sr * (item.innerH + gap);
              placed.push({ x: sx, y: sy, w: item.innerW, h: item.innerH, payload: item.payload });
            }
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

  function _buildShelfFillItems(pairs) {
    var items = [];
    var fillPairs = [];
    for (var i = 0; i < pairs.length; i++) fillPairs.push(pairs[i]);
    fillPairs.sort(function (a, b) {
      if (a.cellW !== b.cellW) return a.cellW - b.cellW;
      if (a.cellH !== b.cellH) return a.cellH - b.cellH;
      return a.base < b.base ? -1 : (a.base > b.base ? 1 : 0);
    });
    for (var j = 0; j < fillPairs.length; j++) {
      items.push({ w: fillPairs[j].cellW, h: fillPairs[j].cellH, payload: fillPairs[j] });
    }
    return items;
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
    aiOpts.pdfCompatible = true;
    aiOpts.embedICCProfile = true;
    targetDoc.saveAs(file, aiOpts);
  }

  function _pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

})();
