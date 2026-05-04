// Everstory — Mixed-size photo sheet (Name Included header + 디자인 cap + multiselect)
//
// 목적:
//   Name Included 시트 위에 사진 스티커를 단일 사이즈 (S/M/L/XL) 또는
//   Mixed (45/30/20) 으로 배치한다. 다이얼로그 ListBox 에서 사용할 페어를 직접
//   multiselect 하고, 사이즈별 디자인 cap 에 자동으로 맞춘다 (auto-cap).
//
// 디자인 cap (단일 사이즈, 각 디자인 ~4-5회 등장 보장 + shelf 효율 85%):
//   20mm → 10 / 30mm → 5 / 45mm → 2 / 60mm → 1
//   Mixed → 1 디자인 고정 (45×6 + 30×4 + 20×18 = 28 슬롯, A5 body 채움률 ~83%)
//
// 동작:
//   1. 02_cutout 폴더 선택
//   2. 다이얼로그: 고객 이름 / 헤더 정보 / 페어 ListBox (multiselect) /
//      사이즈 (S/M/L/XL/Mixed) / 칼선 여백
//      - 사이즈 변경 시 cap 갱신 + 선택 자동 trim (auto-cap)
//   3. templates/template_cutout.ait 열기 (info > body, info > header PathItem 사용)
//   4. info > header 영역에 좌측 고객 이름 + 우측 ORDER DETAIL 배치
//   5. info > body 영역에 선택한 페어를 shelf/row 로 pack
//      - 단일 사이즈: 파일명 _NNmm override 적용
//      - Mixed: 1 디자인을 45×6 + 30×4 + 20×18 로 복제 후 큰 거 우선 정렬
//   6. v15 stability: 같은 sil.png 는 시트당 1회만 Image Trace, hidden TraceStash 캐시
//   7. 03_output 폴더에 .ai 자동 저장 (timestamp_size_sheet01.ai)
//
// 사용법: File → Scripts → Other Script → Everstory_mixed.jsx

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "v18 multiselect cap";
  var SCRIPT_TITLE = "Everstory Mixed Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var BODY_PADDING_MM = 0;  // body 안쪽 상하좌우 여백 (0 = body PathItem 까지 끝까지 사용)
  var GAP_DEFAULT_MM = 1.5; // 다이얼로그에서 미입력/범위 밖 입력 시 fallback. 모든 인접 사진의 가로/세로 gap 고정. dense + cluster center 통일
  var GAP_MIN_MM = 0.5;     // 다이얼로그 input 검증 하한
  var GAP_MAX_MM = 5.0;     // 다이얼로그 input 검증 상한

  // A5 body 148×195mm, padding 0, gap 1.5mm 기준 사이즈별 셀 수.
  // minRepeat 동적 계산 baseline (floor(slots / designCount)).
  var SLOTS_BY_SIZE = { 20: 54, 30: 24, 45: 12, 60: 6 };

  // minRepeat 미세조정 override. key = "{sizeMm}_{designCount}", value = 강제 minRepeat 정수.
  // 예: "30_5": 3 → 30mm 5디자인일 때 floor(24/5)=4 대신 3 으로 강제.
  // 비워두면 동적 계산 그대로 사용. 운영 검수 후 필요한 case 만 채워 넣는다.
  var MIN_REPEAT_OVERRIDE = {};

  var MIXED_SIZE_VALUE = -1;     // sentinel for Mixed mode in SIZE_VALUES
  var MIXED_MAX_DESIGNS = 1;     // Mixed 는 디자인 1개만 사용
  var MIXED_45_COPIES = 6;       // Mixed: 45mm 6장 (행 2개)
  var MIXED_30_COPIES = 4;       // Mixed: 30mm 4장 (행 1개)
  var MIXED_20_COPIES = 18;      // Mixed: 20mm 18장 (행 3개)
  // 행 구성: 45×3 두 행 + 30×4 한 행 + 20×6 세 행 = 28 슬롯
  // A5 body 148×195mm (header 15mm 제외) / padding 0 / gap 1.5mm 기준 세로 186.5mm 사용 (여유 8.5mm)

  // 단일 사이즈 디자인 cap. 각 디자인 ~4-5회 등장 보장 + shelf 효율 85% 기준
  var DESIGN_LIMIT_BY_SIZE_MM = { 20: 10, 30: 5, 45: 2, 60: 1 };

  var SIZE_OPTIONS = ["S 2cm", "M 3cm", "L 4.5cm", "XL 6cm", "Mixed 45/30/20"];
  var SIZE_VALUES = [20, 30, 45, 60, MIXED_SIZE_VALUE];
  var SIZE_LETTERS = ["S", "M", "L", "XL", "MIX"];
  var CUT_MARGIN_OPTIONS = ["1mm", "2mm"];
  var CUT_MARGIN_VALUES = [1, 2];
  var MATERIAL_OPTIONS = ["White", "Pearl Grey", "Silver", "Gold"];

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
  // testConfig 경로 호환: gapMm 미지정이면 default 적용
  if (options.gapMm == null) options.gapMm = GAP_DEFAULT_MM;

  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    alert("template_cutout.ait를 찾을 수 없습니다.");
    return;
  }

  var doc = _openTemplateDoc(templateFile);
  var bodyPath, headerPath;
  try {
    bodyPath = _findInfoPath(doc, "body");
    headerPath = _findInfoPath(doc, "header");
  } catch (eBorder) {
    alert(eBorder.message);
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose) {}
    return;
  }

  var padPt = BODY_PADDING_MM * MM_TO_PT;
  var gapPt = options.gapMm * MM_TO_PT;
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

  var headerBounds = headerPath.geometricBounds;
  var headerL = headerBounds[0];
  var headerT = headerBounds[1];
  var headerW = headerBounds[2] - headerBounds[0];
  var headerH = headerBounds[1] - headerBounds[3];

  var printLayer = doc.layers.add();
  printLayer.name = "PrintData";
  var kissLayer = doc.layers.add();
  kissLayer.name = "KissCut";
  var cutSpot = _ensureCutContour(doc);

  // 다이얼로그에서 selectedPairs 받음. testConfig (selectedPairs 없음) 면 pairs 전체 사용.
  var layoutPairs = (options.selectedPairs && options.selectedPairs.length > 0) ?
    options.selectedPairs : pairs;

  // 안전판: testConfig 경로에서도 cap 위반은 잘라낸다 (다이얼로그는 auto-cap 으로 자체 보장).
  var designLimit = options.isMixed ? MIXED_MAX_DESIGNS : (DESIGN_LIMIT_BY_SIZE_MM[options.sizeMm] || layoutPairs.length);
  if (layoutPairs.length > designLimit) {
    var capped = [];
    for (var ci = 0; ci < designLimit; ci++) capped.push(layoutPairs[ci]);
    layoutPairs = capped;
  }
  var totalIgnoredCount = pairs.length - layoutPairs.length;

  var anyTooBig = false;
  for (var pi = 0; pi < layoutPairs.length; pi++) {
    try {
      _measurePairAspect(layoutPairs[pi]);
    } catch (eAsp) {
      layoutPairs[pi].aspect = 1;
    }
    if (options.isMixed) {
      // Mixed: 20mm filler cell 이 시트에 들어가는지 검사
      var minItem = _itemForSize(layoutPairs[pi], 20);
      if (minItem.w > binW || minItem.h > binH) anyTooBig = true;
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

  var orderDetail = _buildOrderDetail(options, layoutPairs.length);
  _drawProductionHeader(doc, printLayer, options.nameText, orderDetail, headerL, headerT, headerW, headerH);

  // minRepeat 결정 — 단일 사이즈 모드에서만 의미 있음. Mixed 는 1디자인 고정 + 28슬롯 패턴이라 의미 없음 (표시용 1).
  var minRepeat = options.isMixed ? 1 : _resolveMinRepeat(options.sizeMm, layoutPairs.length);

  var packResult;
  if (options.isMixed) {
    // Mixed: 1 디자인을 45×6 + 30×4 + 20×18 로 복제. 큰 거 우선 정렬.
    var pair = layoutPairs[0];
    var mixedItems = [];
    var c;
    for (c = 0; c < MIXED_45_COPIES; c++) mixedItems.push(_itemForSize(pair, 45));
    for (c = 0; c < MIXED_30_COPIES; c++) mixedItems.push(_itemForSize(pair, 30));
    for (c = 0; c < MIXED_20_COPIES; c++) mixedItems.push(_itemForSize(pair, 20));
    mixedItems = _sortShelfItemsDesc(mixedItems);

    var mixedPack = { rows: [], placed: [], leftover: [], repeatedCount: 0 };
    mixedPack.leftover = _appendShelfRowsOnce(mixedPack, mixedItems, binW, binH, gapPt);
    // 1 디자인이라 첫 placement 1개를 빼고 모두 repeated 로 카운트
    mixedPack.repeatedCount = Math.max(0, mixedPack.placed.length - 1);
    packResult = mixedPack;
  } else {
    var queue = [];
    var primaryPairs = _sortedPairsForShelf(layoutPairs, false);
    for (var pi2 = 0; pi2 < primaryPairs.length; pi2++) queue.push(primaryPairs[pi2]);

    var packItems = [];
    for (var qi = 0; qi < queue.length; qi++) {
      packItems.push({ w: queue[qi].cellW, h: queue[qi].cellH, payload: queue[qi] });
    }

    var fillerItems = _buildShelfFillItems(layoutPairs);
    packResult = _shelfPack(packItems, fillerItems, binW, binH, gapPt, minRepeat);
  }

  _centerPlacedItems(packResult.placed, binW, binH);

  var uniquePairs = _uniquePairsFromPlaced(packResult.placed);
  var failedItems = [];
  var traceFailures = [];
  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  try {
    traceFailures = _buildCutlineCache(doc, uniquePairs, cutSpot);
    for (var tf = 0; tf < traceFailures.length; tf++) {
      failedItems.push(traceFailures[tf]);
    }

    for (var p = 0; p < packResult.placed.length; p++) {
      var pl = packResult.placed[p];
      var aiX = bL + padPt + pl.x;
      var aiY = bT - padPt - pl.y;
      try {
        _placePhotoSticker(doc, pl.payload, aiX, aiY, pl.w, pl.h, cutMarginPt, printLayer, kissLayer, cutSpot);
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

  // 03_output 자동 저장 (legacy Everstory_Grid.jsx 의 _saveAi/_timestamp 패턴 준수)
  var savedPath = "";
  var saveError = "";
  try {
    var outFolder = _resolveOutputFolder(inputFolder);
    var sizeTag = options.isMixed ? "MIX" : (options.sizeMm + "mm");
    var fileName = _timestamp() + "_" + sizeTag + "_sheet01.ai";
    var saveFile = new File(outFolder.fsName + "/" + fileName);
    _saveAi(doc, saveFile);
    savedPath = saveFile.fsName;
  } catch (eSave) {
    saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
  }

  var sizeLineText;
  if (options.isMixed) {
    sizeLineText = "Mixed: 45×" + MIXED_45_COPIES + " + 30×" + MIXED_30_COPIES + " + 20×" + MIXED_20_COPIES +
      " (디자인 1개) / 칼선 여백: " + options.cutMarginMm + "mm";
  } else {
    sizeLineText = "기본 사이즈: " + options.sizeMm + "mm (cap " + designLimit + ")" +
      " / 칼선 여백: " + options.cutMarginMm + "mm";
  }

  var inputLine = "사진 입력: " + pairs.length + "개 / 사용: " + layoutPairs.length + "개";
  if (totalIgnoredCount > 0) inputLine += " / 제외: " + totalIgnoredCount + "개";
  inputLine += " / 사진 배치: " + packResult.placed.length + "개";

  var saveLine = savedPath ?
    ("저장: " + savedPath) :
    ("저장 실패: " + (saveError || "unknown") + " — Illustrator 에서 직접 저장하세요.");

  var msg =
    "완료: Name Included 시트 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + "\n" +
    "실행 파일: " + _scriptFileHint() + "\n" +
    "고객 이름: " + options.nameText + "\n" +
    "헤더: info > header / 이름 스티커: 없음\n" +
    "오더 디테일: " + _orderDetailToString(orderDetail) + "\n" +
    sizeLineText + "\n" +
    inputLine +
    (packResult.repeatedCount > 0 ? " (반복 채움 " + packResult.repeatedCount + "개 포함)" : "") + "\n" +
    "행: " + packResult.rows.length + "개 / gap: " + options.gapMm + "mm (가로/세로 모두 고정, dense+cluster center, 세로 center 정렬)\n" +
    (options.isMixed
      ? "Mixed 슬롯: 45×" + MIXED_45_COPIES + " + 30×" + MIXED_30_COPIES + " + 20×" + MIXED_20_COPIES + " = " + (MIXED_45_COPIES + MIXED_30_COPIES + MIXED_20_COPIES) + " (디자인 1개 고정)\n"
      : "minRepeat 보장: " + minRepeat + "회 (slots " + SLOTS_BY_SIZE[options.sizeMm] + " / 디자인 " + layoutPairs.length + ")\n") +
    "Trace 캐시: unique " + uniquePairs.length + "개 (배치 " + packResult.placed.length + "회 → trace " + uniquePairs.length + "회)\n" +
    "미배치 사진: " + packResult.leftover.length + "개\n" +
    saveLine;

  if (failedItems.length > 0) {
    msg += "\n\ntrace 실패 " + failedItems.length + "건:";
    for (var fi = 0; fi < failedItems.length; fi++) {
      msg += "\n- " + failedItems[fi].base + ": " + failedItems[fi].error;
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
    sizePanel.margins = [14, 18, 14, 14];
    sizePanel.spacing = 14;
    var sizeRadios = [];
    for (var si = 0; si < SIZE_OPTIONS.length; si++) {
      sizeRadios.push(sizePanel.add("radiobutton", undefined, SIZE_OPTIONS[si]));
    }
    sizeRadios[1].value = true;  // 기본 30mm

    var pairsPanel = dlg.add("panel", undefined, "사용할 사진 페어 (multi-select)");
    pairsPanel.orientation = "column";
    pairsPanel.alignChildren = "fill";
    pairsPanel.margins = [14, 18, 14, 14];
    pairsPanel.spacing = 6;

    var pairItems = [];
    for (var pli = 0; pli < pairsArg.length; pli++) pairItems.push(pairsArg[pli].base);
    var pairsListbox = pairsPanel.add("listbox", undefined, pairItems, { multiselect: true });
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
      for (var i = 0; i < sizeRadios.length; i++) {
        if (sizeRadios[i].value) return SIZE_VALUES[i];
      }
      return SIZE_VALUES[1];
    }
    function _capForSize(sizeMm) {
      if (sizeMm === MIXED_SIZE_VALUE) return MIXED_MAX_DESIGNS;
      return DESIGN_LIMIT_BY_SIZE_MM[sizeMm] || pairsArg.length;
    }
    var _syncing = false;
    function _syncCapAndCount() {
      if (_syncing) return;
      _syncing = true;
      try {
        var cap = _capForSize(_currentSizeMm());
        var sel = pairsListbox.selection;
        var selLen = sel ? sel.length : 0;
        if (sel && selLen > cap) {
          var trimmed = [];
          for (var t = 0; t < cap; t++) trimmed.push(sel[t]);
          pairsListbox.selection = trimmed;
          selLen = cap;
        }
        countLabel.text = "선택: " + selLen + " / " + cap;
      } finally {
        _syncing = false;
      }
    }
    pairsListbox.onChange = _syncCapAndCount;
    for (var sri = 0; sri < sizeRadios.length; sri++) {
      sizeRadios[sri].onClick = _syncCapAndCount;
    }

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
    cutRadios[0].value = true;

    var gapPanel = dlg.add("panel", undefined, "사진 간격 (mm, 0.1mm 단위)");
    gapPanel.orientation = "row";
    gapPanel.alignChildren = "center";
    gapPanel.margins = [14, 18, 14, 14];
    gapPanel.spacing = 8;
    var gapInput = gapPanel.add("edittext", undefined, String(GAP_DEFAULT_MM));
    gapInput.preferredSize = [60, 24];
    var gapHint = gapPanel.add("statictext", undefined, "default " + GAP_DEFAULT_MM + " / 범위 " + GAP_MIN_MM + "–" + GAP_MAX_MM + "mm");
    try { gapHint.graphics.foregroundColor = gapHint.graphics.newPen(gapHint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eGH) {}

    var hint = dlg.add("statictext", undefined, "info > header — 좌측 고객 이름, 우측 ORDER DETAIL. 이름 스티커는 생성하지 않습니다.");
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

    var cutMarginMm = CUT_MARGIN_VALUES[0];
    for (var cidx = 0; cidx < cutRadios.length; cidx++) {
      if (cutRadios[cidx].value) { cutMarginMm = CUT_MARGIN_VALUES[cidx]; break; }
    }

    var gapMm = parseFloat(gapInput.text);
    if (isNaN(gapMm) || gapMm < GAP_MIN_MM || gapMm > GAP_MAX_MM) {
      alert("사진 간격이 범위 (" + GAP_MIN_MM + "–" + GAP_MAX_MM + "mm) 밖입니다. default " + GAP_DEFAULT_MM + "mm 로 진행합니다.");
      gapMm = GAP_DEFAULT_MM;
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
      cutMarginMm: cutMarginMm,
      gapMm: gapMm,
      selectedPairs: selectedPairs
    };
  }

  function _buildOrderDetail(options, photoCount) {
    var spec;
    if (options.isMixed) {
      spec = "MIX/45x" + MIXED_45_COPIES + "+30x" + MIXED_30_COPIES + "+20x" + MIXED_20_COPIES + "/" + options.cutMarginMm + "mm";
    } else {
      spec = _sizeLetter(options.sizeMm) + "/" + options.sizeMm + "mm/" + options.cutMarginMm + "mm";
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

  function _drawProductionHeader(doc, layer, customerName, detail, headerLeft, headerTop, headerW, headerH) {
    doc.activeLayer = layer;

    var infoFont = _resolveInfoFont();
    var dark = _rgb(54, 54, 50);
    var muted = _rgb(105, 105, 100);

    var marginPt = 2 * MM_TO_PT;
    var headerCenterY = headerTop - headerH / 2;

    // Customer name — left edge + 2mm margin, vertically centered
    var name = layer.textFrames.add();
    name.contents = String(customerName).toUpperCase();
    name.left = 0;
    name.top = 0;
    var nameAttrs = name.textRange.characterAttributes;
    if (infoFont) nameAttrs.textFont = infoFont;
    nameAttrs.size = 14;
    nameAttrs.tracking = 80;
    nameAttrs.fillColor = dark;
    var nameMaxW = headerW * 0.28;
    var nameMaxH = headerH - 2 * marginPt;
    _fitTextToBoxMin(name, nameMaxW, nameMaxH, 14, 9);
    _moveItemCenterLeft(name, headerLeft + marginPt, headerCenterY);
    try { name.name = "HeaderName_Print"; } catch (eNameName) {}

    // ORDER DETAIL — TYPE 블록 + MATERIAL 블록, 컴포넌트 단위로 2mm 간격
    var leftLines = [];
    var rightLines = [];
    for (var r = 0; r < detail.rows.length; r++) {
      leftLines.push(detail.rows[r].left);
      rightLines.push(detail.rows[r].right);
    }

    // MATERIAL 블록 — 우측 끝 = headerRight - 2mm
    var rightCol = layer.textFrames.add();
    rightCol.contents = rightLines.join("\r");
    rightCol.left = 0;
    rightCol.top = 0;
    var rightAttrs = rightCol.textRange.characterAttributes;
    if (infoFont) rightAttrs.textFont = infoFont;
    rightAttrs.size = 7;
    rightAttrs.leading = 9;
    rightAttrs.tracking = 20;
    rightAttrs.fillColor = muted;
    _moveItemCenterRight(rightCol, headerLeft + headerW - marginPt, headerCenterY);
    try { rightCol.name = "HeaderColRight_Print"; } catch (eRC) {}

    // TYPE 블록 — 우측 끝 = MATERIAL 블록 좌측 - 2mm
    var materialLeft = rightCol.geometricBounds[0];
    var leftCol = layer.textFrames.add();
    leftCol.contents = leftLines.join("\r");
    leftCol.left = 0;
    leftCol.top = 0;
    var leftAttrs = leftCol.textRange.characterAttributes;
    if (infoFont) leftAttrs.textFont = infoFont;
    leftAttrs.size = 7;
    leftAttrs.leading = 9;
    leftAttrs.tracking = 20;
    leftAttrs.fillColor = muted;
    _moveItemCenterRight(leftCol, materialLeft - marginPt, headerCenterY);
    try { leftCol.name = "HeaderColLeft_Print"; } catch (eLC) {}
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

  // 가로는 가운데, 세로는 위에서부터 채움
  function _centerPlacedItems(placed, binW, binH) {
    if (!placed || placed.length === 0) return;

    var minX = placed[0].x;
    var minY = placed[0].y;
    var maxX = placed[0].x + placed[0].w;

    for (var i = 1; i < placed.length; i++) {
      if (placed[i].x < minX) minX = placed[i].x;
      if (placed[i].y < minY) minY = placed[i].y;
      if (placed[i].x + placed[i].w > maxX) maxX = placed[i].x + placed[i].w;
    }

    var dx = (binW - (maxX - minX)) / 2 - minX;
    var dy = -minY;

    for (var j = 0; j < placed.length; j++) {
      placed[j].x += dx;
      placed[j].y += dy;
    }
  }

  function _resolveInfoFont() {
    var candidates = ["Avenir-Book", "HelveticaNeue-Light", "HelveticaNeue", "ArialMT"];
    for (var i = 0; i < candidates.length; i++) {
      try { return app.textFonts.getByName(candidates[i]); } catch (eFont) {}
    }
    if (app.textFonts.length > 0) return app.textFonts[0];
    return null;
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
  //  CUTLINE TRACE CACHE (v15)
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

  function _placePhotoSticker(sheetDoc, pair, x, y, cellWPt, cellHPt, cutMarginPt, printLayer, kissLayer, cutSpot) {
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
    var ratio = Math.min(artW / placed.width, artH / placed.height);
    placed.width *= ratio;
    placed.height *= ratio;
    placed.left = artX + (artW - placed.width) / 2;
    placed.top = artY - (artH - placed.height) / 2;

    var psdL = placed.left;
    var psdT = placed.top;
    var psdW = placed.width;
    var psdH = placed.height;

    placed.embed();
    _stripEmbeddedPSDPathsNear(printLayer, psdL, psdT, psdW, psdH);

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
      scriptDir.fsName + "/templates/template_cutout.ait",
      scriptDir.parent.fsName + "/templates/template_cutout.ait"
    ];
    for (var i = 0; i < candidates.length; i++) {
      var f = new File(candidates[i]);
      if (f.exists) return f;
    }
    return File.openDialog("template_cutout.ait 위치 선택", "*.ait");
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
        pairs.push({
          psd: psdFile,
          sil: pngFiles[i],
          base: _decodeName(pngName.replace(/_sil\.png$/i, ""))
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
          return;
        }
      }
    } catch (e) {}
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
    packResult.placed = _shelfRowsToPlaced(packResult.rows, binW, gap);

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
    packResult.placed = _shelfRowsToPlaced(packResult.rows, binW, gap);
  }

  // _shelfPack — 단일 사이즈 모드 메인 packer.
  //   1단계: originalItems (디자인 1회씩) 사이클을 minRepeat 회 반복 → 디자인당 정확 minRepeat 보장
  //   2단계: leftover 가 0 이고 filler 가 있으면 round-robin 으로 시트 빈 자리 채움
  //   leftover 가 발생하면 호출부에서 결과 알림에 표시 (자동 fallback 안 함)
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
      placed: _shelfRowsToPlaced(rows, binW, gap),
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

  // 행 정렬 정책 (dense 통일):
  //   - 가로 stride = options.gapMm 고정 (모든 인접 사진 가로 간격 동일)
  //   - cluster 폭 = sumW + (n-1)*gap. 시트 가로 가운데 정렬
  //   - 세로 정렬 = row 안에서 center (사진 높이 차이 시 상하 여백 균등 분산)
  //   세로 행 사이 gap 은 호출부 (_appendShelfRowsOnce / _shelfPack) 에서 동일 gap 고정.
  //   결과: 모든 이미지의 상하좌우 여백이 gap 만큼의 균일한 그리드.

  function _shelfRowsToPlaced(rows, binW, gap) {
    var placed = [];
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var n = row.items.length;
      var sumW = 0;
      for (var k = 0; k < n; k++) sumW += row.items[k].w;

      var minRowW = (n > 0) ? sumW + (n - 1) * gap : 0;
      var x = (binW - minRowW) / 2;
      var stride = gap;

      for (var i = 0; i < n; i++) {
        var item = row.items[i];
        // 세로 center: 행 안에서 사진 높이 차이가 있을 때 상/하 여백을 균등 분산.
        var yCentered = row.y + (row.h - item.h) / 2;
        placed.push({ x: x, y: yCentered, w: item.w, h: item.h, payload: item.payload });
        x += item.w + stride;
      }
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
