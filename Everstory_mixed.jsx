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
//      - 단일 사이즈: 적응형 직사각 셀 (max cellW × max cellH) 위 cols × rows uniform grid.
//        모든 행이 같은 디자인 round-robin 순서, 외곽 4면 = 내부 gap 자동 균등 분배
//   6. 캐시: 같은 sil.png 는 시트당 1회만 Image Trace, 같은 _clean.psd 는 1회만 embed (TraceStash master 복제)
//   7. 03_output 폴더에 .ai 자동 저장 (timestamp_size_sheet01.ai)
//
// 사용법: File → Scripts → Other Script → Everstory_mixed.jsx

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "v21 unified";
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

  // body 142×175mm (template_cutout_v2.ait info > body), BODY_PADDING_MM 2, GAP_DEFAULT_MM 2.5 기준
  // 사이즈별 슬롯 수 — _uniformGridPack 의 cols×rows floor 식을 정사각(aspect 1) 셀로 산출 (2026-06-12 갱신).
  // 정사각이 최소 슬롯 케이스 (비정사각 cellBox 는 항상 size×size 이하 → 슬롯 ≥ 표값) → cap ≤ 실제 슬롯 보장.
  // cap > 실제 슬롯이면 초과 디자인이 round-robin 에서 한 번도 안 놓이는 silent drop 발생 (구 148×195
  // baseline 표의 문제) — body/padding/gap 변경 시 이 표를 같은 식으로 반드시 재산출할 것.
  // 인치 6단계 (XS 0.75 / S 1 / M 1.25 / L 1.5 / XL 2 / XXL 2.5") 기준.
  var SLOTS_BY_SIZE = {
    19.05: 48,   // 0.75"  (6×8)
    25.4:  30,   // 1"     (5×6)
    31.75: 20,   // 1.25"  (4×5)
    38.1:  12,   // 1.5"   (3×4)
    50.8:  6,    // 2"     (2×3)
    63.5:  4     // 2.5"   (2×2)
  };

  var PACKAGE_SIZE_VALUE = -2;   // sentinel for Package mode (파일명 토큰 기반 packing)
  var PACKAGE_MAX_DESIGNS = 8;   // Package: 8 selected photos cap (Full 기준)

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
    "Package (4 designs / 1 sheet · 8 designs / 2 sheets · 파일명 _XS/_S/_M/_L/_XL/_XXL)",
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

  // ── Package 모드 (no_cap 변형, 파일명 토큰 입력) ───────────────────
  // 고객이 사진마다 사이즈를 임의 지정. Phase A 파일명 = {folder}_{NN}_{TIER}:
  // 끝에 _XS/_S/_M/_L/_XL/_XXL (대소문자 무시). 토큰 없으면 S(=1") 기본.
  // 과거 2.5" 토큰 _FAM 은 읽을 때 XXL 로 정규화한다.
  // 접미사(_sil/_clean) strip 후 끝에 anchored — 레거시 _{NN}(숫자) 는 tier 글자와 안 겹침.
  var TIER_SIZE_MM = { XS: 19.05, S: 25.4, M: 31.75, L: 38.1, XL: 50.8, XXL: 63.5 };
  var TIER_DEFAULT = "S";
  // _sil.png/_clean.psd 접미사 제거 후 이름 끝의 _TIER 토큰. 긴 토큰을 먼저 둬 부분매칭 방지.
  var TIER_TOKEN_RE = /_(XXL|XL|XS|FAM|S|M|L)$/i;
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
    // 이름이 같은 PathItem 이 먼저 잡히면 .contents 주입 단계 (try/catch 밖) 에서 터짐 — 여기서 차단.
    if (headerRightText.typename !== "TextFrame") {
      throw new Error("info > header > header_right 가 TextFrame 이 아닙니다 (현재: " +
        headerRightText.typename + "). 템플릿에서 같은 이름의 다른 오브젝트를 제거하세요.");
    }
  } catch (eBorder) {
    alert(eBorder.message);
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose) {}
    return;
  }

  var padPt = BODY_PADDING_MM * MM_TO_PT;
  // 단일 사이즈는 uniform grid 가 시각 간격을 자동 균등 분배하므로 gap 입력 불필요.
  // Package/전 사이즈 packer 가 셀 간 최소 간격으로 사용 — GAP_DEFAULT_MM 고정.
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
  // 보고용: 미선택 (운영자가 안 고름) 과 trim (cap/예산이 자름) 을 분리 집계.
  var pickedCount = layoutPairs.length;

  var tierTrim = null;

  if (options.isPackage) {
    // Package: 개수 cap 없음. aspect 측정 → 면적 예산 사전 trim (Phase 3, Option 1).
    for (var ta = 0; ta < layoutPairs.length; ta++) {
      try { _measurePairAspect(layoutPairs[ta]); }
      catch (eTa) { layoutPairs[ta].aspect = 1; }
    }
    tierTrim = _tierAreaBudget(layoutPairs, binW, binH);
    if (tierTrim.rejected) {
      alert("Family(2.5\") 사진만으로 A5 한 시트를 초과합니다.\n" +
            "Family 수를 줄이거나 일부를 XL 이하로 조정하세요. (Family 는 자동 trim 안 함 — 운영자 확인 필요)");
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eTrj) {}
      return;
    }
    layoutPairs = tierTrim.kept;
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
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eABig) {}
      return;
    }
  }

  var packResult;
  if (options.isPackage) {
    packResult = _packPackage(layoutPairs, binW, binH, gapPt);
  } else if (options.isAllSizes) {
    // 전 사이즈: 들어온 디자인(들)을 0.75"~2.5" 전 사이즈로, 각 사이즈 최소 1장씩 보장.
    //   디자인 고정 없음 — 1개면 그 1개로 전 사이즈, 여러개면 사이즈마다 순서대로 배정.
    packResult = _packAllSizes(layoutPairs, binW, binH, gapPt);
    // 보장분(6 사이즈)을 뺀 나머지는 채움 카운트.
    packResult.repeatedCount = Math.max(0, packResult.placed.length - ALLSIZES_ORDER_MM.length);
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

    _safeRedrawAndGC();  // 배치당 redraw 제거 보상 — 전체 배치 완료 후 1회
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
    var sizeTag = options.isPackage ? "PKG" : (options.isAllSizes ? "ALL" : _inchStr(options.sizeMm));
    var fileName = _timestamp() + "_" + sizeTag + "_sheet01.ai";
    var saveFile = new File(outFolder.fsName + "/" + fileName);
    _saveAi(doc, saveFile);
    savedPath = saveFile.fsName;
  } catch (eSave) {
    saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
  }

  var sizeLineText;
  if (options.isPackage) {
    sizeLineText = "Package (파일명): " + _packageDistStr(layoutPairs) +
      (tierTrim && tierTrim.trimmed.length > 0
        ? " / 예산 trim XS" + tierTrim.trimmedByTier.XS + " S" + tierTrim.trimmedByTier.S +
          " M" + tierTrim.trimmedByTier.M + " L" + tierTrim.trimmedByTier.L +
          " XL" + tierTrim.trimmedByTier.XL
        : "") +
      " / 칼선 여백: " + options.cutMarginMm + "mm";
  } else if (options.isAllSizes) {
    var allSummary = packResult.mixedSummary;
    sizeLineText = "전 사이즈: " + (allSummary ? allSummary.human : "0.75-2.5\"") +
      " / 칼선 여백: " + options.cutMarginMm + "mm";
  } else {
    sizeLineText = "기본 사이즈: " + _sizeLetter(options.sizeMm) + " " + _inchStr(options.sizeMm) +
      " (" + _mmCmStr(options.sizeMm) + ") cap " + designLimit +
      " / 칼선 여백: " + options.cutMarginMm + "mm";
  }

  var unselectedCount = pairs.length - pickedCount;
  var trimmedCount = pickedCount - layoutPairs.length;
  var inputLine = "사진 입력: " + pairs.length + "개 / 사용: " + layoutPairs.length + "개";
  if (unselectedCount > 0) inputLine += " / 미선택: " + unselectedCount + "개";
  if (trimmedCount > 0) inputLine += " / trim: " + trimmedCount + "개";
  var actualPlaced = packResult.placed.length - skippedPlacements;
  inputLine += " / 사진 배치: " + actualPlaced + "개";
  var rotatedCount = 0;
  for (var rcI = 0; rcI < packResult.placed.length; rcI++) { if (packResult.placed[rcI].rotated) rotatedCount++; }
  if (rotatedCount > 0) inputLine += " / 회전 " + rotatedCount + "개";
  if (skippedPlacements > 0) inputLine += " (trace fail skip " + skippedPlacements + ")";

  var saveLine = savedPath ?
    ("저장: " + savedPath) :
    ("저장 실패: " + (saveError || "unknown") + " — Illustrator 에서 직접 저장하세요.");

  // 전 사이즈 모드: 보장 실패 사이즈 (구제 불가, 시트에 0장) 를 generic 미배치 카운트와 분리해 명시.
  var missingSizesLine = "";
  if (packResult.missingSizes && packResult.missingSizes.length > 0) {
    var msParts = [];
    for (var msI = 0; msI < packResult.missingSizes.length; msI++) msParts.push(_inchStr(packResult.missingSizes[msI]));
    missingSizesLine = "⚠ 전 사이즈 보장 실패 (공간 부족, 0장): " + msParts.join(", ") + "\n";
  }

  // 전 사이즈 모드: evict 구제 내역 — 채움 1개를 빼고 보장 사이즈를 넣은 교체 기록 (운영자 확인용).
  var evictionLine = "";
  if (packResult.evictions && packResult.evictions.length > 0) {
    var evParts = [];
    for (var evI = 0; evI < packResult.evictions.length; evI++) {
      evParts.push(_inchStr(packResult.evictions[evI].outSize) + " 1개 → " + _inchStr(packResult.evictions[evI].inSize));
    }
    evictionLine = "보장 구제 교체 (채움 양보): " + evParts.join(", ") + "\n";
  }

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
    (options.isPackage ? " (Package: tier 밴드 + 균일 반복 + column 채움 + 기회주의 회전)\n" : (options.isAllSizes ? " (전 사이즈 0.75-2.5\" 각 1장+ / 작은 사이즈로 채움)\n" : " (uniform grid — 외곽 4면 = 내부 gap 균등 자동 분배)\n")) +
    (options.isPackage
      ? "Package 배치: " + packResult.placed.length + "개 (미배치 " + packResult.leftover.length + ") / 입력 디자인 " + layoutPairs.length + "개\n"
      : (options.isAllSizes
      ? "전 사이즈 슬롯: " + (packResult.mixedSummary ? packResult.mixedSummary.human : "") + " (총 " + packResult.placed.length + "장 / 디자인 " + layoutPairs.length + "개)\n"
      : "그리드: " + packResult.cols + "×" + packResult.gridRows + " = " + packResult.slots + " 슬롯 / 디자인 " + layoutPairs.length + "개" +
        (layoutPairs.length > 0 ? " × " + Math.floor(packResult.slots / layoutPairs.length) + "회" + ((packResult.slots % layoutPairs.length) > 0 ? " (+" + (packResult.slots % layoutPairs.length) + " 보너스)" : "") : "") + "\n")) +
    "Trace 캐시: unique " + uniquePairs.length + "개 (배치 " + packResult.placed.length + "회 → trace " + uniquePairs.length + "회)\n" +
    (packResult.leftover.length > 0 ? "미배치 사진: " + packResult.leftover.length + "개\n" : "") +
    missingSizesLine +
    evictionLine +
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
      if (sizeMm === PACKAGE_SIZE_VALUE) return PACKAGE_MAX_DESIGNS;
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
        if (sz === PACKAGE_SIZE_VALUE) {
          hintLabel.text = "Package: 4 designs → 1 sheet · 8 designs → 2 sheets";
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

  function _drawProductionHeader(options, photoCount, headerRightText) {
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
    var embG = master.duplicate(printLayer, ElementPlacement.PLACEATBEGINNING);
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
        // 접미사 제거 후 끝의 _TIER 토큰 파싱 → pair.tier. base 는 tier 포함 (운영자가 listbox 에서 사이즈 확인).
        // psdName 은 raw pngName 치환이라 토큰이 양쪽에 대칭 보존 → 페어링 무영향.
        var nameNoSuffix = pngName.replace(/_sil\.png$/i, "");
        var tierMatch = nameNoSuffix.match(TIER_TOKEN_RE);
        var tier = tierMatch ? tierMatch[1].toUpperCase() : TIER_DEFAULT;
        if (tier === "FAM") tier = "XXL";
        pairs.push({
          psd: psdFile,
          sil: pngFiles[i],
          base: _decodeName(nameNoSuffix),
          tier: tier
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
  function _packAllSizes(pairs, binW, binH, gap) {
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

    pack.mixedSummary = _buildAllSizesSummary(pack.placed.length, N);
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

  // _uniformGridPack — 단일 사이즈 모드 packer (v19).
  //   적응형 직사각 셀 (cellBoxW = max cellW, cellBoxH = max cellH) 위에 cols × rows 격자 산출.
  //   gap 입력은 "최소 사진 간격 floor" 이며, 실제 시각 간격은 (binW - cols × cellBoxW) / (cols + 1) 로
  //   균등 자동 분배 (외곽 4면 = 내부 모든 gap 동일). 모든 슬롯은 layoutPairs 를 round-robin 으로
  //   순서대로 채워서 모든 행이 같은 디자인 순서로 보임 — 구 shelf 패커의 행마다 hGap 변동 / 마지막
  //   filler 행 듬성듬성 / 디자인 순서 불일치 문제 해결.
  //
  //   반환 shape 은 shelf 패커들과 호환: {placed, leftover, rows, repeatedCount, cols, gridRows, slots, hSpace, vSpace, cellBoxW, cellBoxH}.
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
  //   Phase B (Model B — tier 단위 균일 반복, 기존 정책 그대로):
  //     · XXL 은 반복 0, 각 1장 고정 (다중 XXL 도 버리지 않음).
  //     · 비-XXL tier 는 "그 tier 사진 전부 한 장씩" 을 atomic pass 로 추가. 한 장이라도 못 들어가면
  //       _snapPack 스냅샷으로 통째 롤백 + 그 tier 은퇴 → within-tier 균일 불변식 보존.
  //     · round-robin XL→L→M→S→XS 으로 시트가 닿을 때까지. tier 안 균일·tier끼리는 다름.
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
  function _tryAddToBandRow(row, pair, isLast, binW, binH, gap) {
    var cands = [
      { w: pair.cellW, h: pair.cellH, payload: pair, rotated: false },
      { w: pair.cellH, h: pair.cellW, payload: pair, rotated: true }
    ];
    for (var c = 0; c < cands.length; c++) {
      if (!isLast && row.items.length > 0 && cands[c].h > row.h) continue;
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
      if (_tryAddToBandRow(rows[i], pair, i === rows.length - 1, binW, binH, gap)) return true;
    }
    var ny = rows.length > 0 ? rows[rows.length - 1].y + rows[rows.length - 1].h + gap : 0;
    var nr = _newShelfRow(ny);
    nr.tierLock = pair.tier;
    if (_tryAddToBandRow(nr, pair, true, binW, binH, gap)) {
      rows.push(nr);
      return true;
    }
    return false;
  }

  // 같은 tier 세로 column (2단 이상) — AllSizes _buildSameSizeColumn 의 Package pair 버전.
  function _buildTierColumn(grp, fromIdx, maxW, maxH, gap) {
    var cells = [];
    var stackH = 0;
    var stackW = 0;
    var idx = fromIdx;
    while (true) {
      var found = -1;
      for (var s = 0; s < grp.length; s++) {
        var i = (idx + s) % grp.length;
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
        if (its[i].isVStack) {
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

  function _packPackage(pairs, binW, binH, gap) {
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
    var colOnly = [];
    for (var p = 0; p < n; p++) {
      if (_placeBanded(rows, ordered[p], binW, binH, gap)) continue;
      ordered[p]._colOnly = true;
      colOnly.push(ordered[p]);
    }

    // Phase B — Model B tier 단위 균일 반복 (배치만 밴드 행으로, 정책은 기존 그대로)
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
    var anyActive = true;
    while (anyActive && guard++ < 100000) {
      anyActive = false;
      for (var tsq = 0; tsq < tierSeq.length; tsq++) {
        var T = tierSeq[tsq];
        if (retired[T]) continue;
        var grp = tierGroups[T];
        if (tierNoRows[T] || !grp || grp.length === 0) { retired[T] = true; continue; }

        var snap = _snapPack(rows);                 // atomic pass: 전부 1장씩, 실패 시 통째 롤백
        var passOk = true;
        for (var pj = 0; pj < grp.length; pj++) {
          if (_placeBanded(rows, grp[pj], binW, binH, gap)) continue;
          passOk = false;                           // 새 행에도 안 들어감 → pass 불가
          break;
        }
        if (passOk) {
          repeatedCount += grp.length;
          anyActive = true;
        } else {
          rows = snap;                              // pass 중 추가분·신규행 전부 폐기
          retired[T] = true;
        }
      }
    }

    // Column 채움 — 각 행 남은 폭에 작은 tier column (작은 tier 부터 시도). 행 키는 안 키움.
    var colCursor = { XS: 0, S: 0, M: 0, L: 0 };
    var ascTiers = ["XS", "S", "M", "L"];
    for (var cr = 0; cr < rows.length; cr++) {
      while (true) {
        var col = null;
        for (var ct = 0; ct < ascTiers.length; ct++) {
          var cGrp = tierGroups[ascTiers[ct]];
          if (!cGrp || cGrp.length === 0) continue;
          col = _buildTierColumn(cGrp, colCursor[ascTiers[ct]], binW - rows[cr].w - gap, rows[cr].h, gap);
          if (col !== null) { colCursor[ascTiers[ct]] = col.nextIdx; break; }
        }
        if (col === null) break;
        _addToShelfRow(rows[cr], col, gap);
        repeatedCount += col.cells.length;
      }
    }

    // column 구제까지 끝난 뒤에도 0장인 보류 디자인만 진짜 leftover (시트보다 큰 오버사이즈 등).
    for (var lo = 0; lo < colOnly.length; lo++) {
      if (!_pairPlacedInRows(rows, colOnly[lo])) leftover.push(colOnly[lo]);
    }

    // 행 키 내림차순 정렬 (AllSizes 와 동일한 위→아래 흐름). _shelfRowsToPlaced 가 y 재계산.
    var deco = [];
    for (var sr = 0; sr < rows.length; sr++) deco.push({ r: rows[sr], i: sr });
    deco.sort(function (a, b) { return (b.r.h - a.r.h) || (a.i - b.i); });
    rows = [];
    for (var dr = 0; dr < deco.length; dr++) rows.push(deco[dr].r);

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
  //   상승 trim: XS→S→M→L→XL 순, 각 tier 안에서 작은 면적부터 제거(시각 손실 최소). XXL 은 보호.
  //   XS~XL 전부 빼도 XXL-only 가 예산 초과면 rejected=true → 호출부가 hard reject + alert.
  //   pairs 는 _measurePairAspect 가 선행돼 .aspect 가 채워져 있어야 함 (다른 packer 와 동일 전제).
  function _tierAreaBudget(pairs, binW, binH) {
    var budget = binW * binH * TIER_PACK_EFFICIENCY;

    var buckets = { XS: [], S: [], M: [], L: [], XL: [], XXL: [] };
    for (var i = 0; i < pairs.length; i++) {
      _tierBox(pairs[i]);
      var t = pairs[i].tier;
      if (!buckets[t]) t = TIER_DEFAULT;
      buckets[t].push(pairs[i]);
    }

    function _area(p) { return p.cellW * p.cellH; }
    function _sum(arr) { var s = 0; for (var k = 0; k < arr.length; k++) s += _area(arr[k]); return s; }
    function _total() {
      return _sum(buckets.XS) + _sum(buckets.S) + _sum(buckets.M) + _sum(buckets.L) +
        _sum(buckets.XL) + _sum(buckets.XXL);
    }

    var trimmed = [];
    var trimmedByTier = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
    var ladder = ["XS", "S", "M", "L", "XL"];
    for (var li = 0; li < ladder.length && _total() > budget; li++) {
      var b = buckets[ladder[li]];
      b.sort(function (a, c) { return _area(a) - _area(c); });
      while (b.length > 0 && _total() > budget) {
        trimmed.push(b.shift());
        trimmedByTier[ladder[li]]++;
      }
    }

    var rejected = (_total() > budget);  // XS~XL 다 비웠는데도 초과 = XXL-only 초과

    var kept = [];
    var keepOrder = ["XXL", "XL", "L", "M", "S", "XS"];
    for (var ko = 0; ko < keepOrder.length; ko++) {
      var kb = buckets[keepOrder[ko]];
      for (var kj = 0; kj < kb.length; kj++) kept.push(kb[kj]);
    }

    return {
      kept: kept,
      trimmed: trimmed,
      trimmedByTier: trimmedByTier,
      rejected: rejected,
      famPt2: _sum(buckets.XXL),
      budgetPt2: budget
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
    aiOpts.pdfCompatible = true;
    aiOpts.embedICCProfile = true;
    targetDoc.saveAs(file, aiOpts);
  }

  function _pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

})();
