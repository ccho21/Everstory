// Everstory — Name Included sheet prototype (v14, shelf/row + justify + round-robin filler)
//
// 목적:
//   Everstory_Grid.jsx에 통합하기 전, A5 sheet 상단 production header와
//   사진 다이컷 배치 영역을 검수하는 Illustrator 프로토타입.
//
// 동작:
//   1. 고객 이름 / 재질 / 날짜 / 사진 스티커 크기 (S/M/L/XL) / 칼선 여백 선택
//   2. templates/template_cutout.ait 열기 (info > body, info > header PathItem 사용)
//   3. info > header 영역에 좌측 고객 이름 + 우측 ORDER DETAIL 배치
//   4. info > body 영역에 _clean.psd + _sil.png 사진 스티커를 shelf/row 로 pack
//      - 행 간격: 고정 GAP_MM
//      - 행 내부 cell 가로: 양끝 정렬(justify), gap 늘어남
//      - 빈 자리 채움: round-robin 으로 입력 사진을 순환
//   5. 저장하지 않고 열린 상태로 둠
//
// 사용법: File → Scripts → Other Script → Everstory_NameIncludedSheet.jsx

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_TITLE = "Everstory Name Included Sheet v14";
  var MM_TO_PT = 2.834645;
  var BODY_PADDING_MM = 1;  // body 안쪽 상하좌우 여백
  var GAP_MM = 2;           // 행 간격(세로) 고정. 행 내부 가로 gap 은 justify 로 늘어남

  var SIZE_OPTIONS = ["S 2cm", "M 3cm", "L 4.5cm", "XL 6cm"];
  var SIZE_VALUES = [20, 30, 45, 60];
  var SIZE_LETTERS = ["S", "M", "L", "XL"];
  var CUT_MARGIN_OPTIONS = ["1mm", "2mm"];
  var CUT_MARGIN_VALUES = [1, 2];
  var MATERIAL_OPTIONS = ["White", "Pearl Grey", "Silver", "Gold"];

  var testConfig = $.global.__EVERSTORY_NAME_INCLUDED_TEST__;
  var options = (testConfig && testConfig.options) ? testConfig.options : _showDialog();
  if (!options) return;

  var inputFolder = (testConfig && testConfig.inputFolder) ?
    new Folder(testConfig.inputFolder) :
    Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!inputFolder) return;

  var pairs = _collectPairs(inputFolder);
  if (pairs.length === 0) {
    alert("선택한 폴더에 _clean.psd + _sil.png 페어가 없습니다.");
    return;
  }

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
  var gapPt = GAP_MM * MM_TO_PT;
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

  var orderDetail = _buildOrderDetail(options, pairs.length);
  _drawProductionHeader(doc, printLayer, options.nameText, orderDetail, headerL, headerT, headerW, headerH);

  var anyTooBig = false;
  var hasCustomSize = false;
  for (var pi = 0; pi < pairs.length; pi++) {
    try {
      _measurePairAspect(pairs[pi]);
    } catch (eAsp) {
      pairs[pi].aspect = 1;
    }
    pairs[pi].sizeMm = _resolvePairSizeMm(pairs[pi], options.sizeMm);
    if (pairs[pi].sizeMm !== options.sizeMm) hasCustomSize = true;
    var pairSizePt = pairs[pi].sizeMm * MM_TO_PT;
    if (pairs[pi].aspect >= 1) {
      pairs[pi].cellW = pairSizePt;
      pairs[pi].cellH = pairSizePt / pairs[pi].aspect;
    } else {
      pairs[pi].cellW = pairSizePt * pairs[pi].aspect;
      pairs[pi].cellH = pairSizePt;
    }
    if (pairs[pi].cellW > binW || pairs[pi].cellH > binH) anyTooBig = true;
  }

  if (anyTooBig) {
    alert("일부 사진 셀이 info > body 영역보다 큽니다. 사진 스티커 크기를 줄이세요.");
    return;
  }

  var queue = [];
  var primaryPairs = _sortedPairsForShelf(pairs, false);
  for (var pi2 = 0; pi2 < primaryPairs.length; pi2++) queue.push(primaryPairs[pi2]);

  var packItems = [];
  for (var qi = 0; qi < queue.length; qi++) {
    packItems.push({ w: queue[qi].cellW, h: queue[qi].cellH, payload: queue[qi] });
  }

  var fillerItems = _buildShelfFillItems(pairs);
  var packResult = _shelfPack(packItems, fillerItems, binW, binH, gapPt);

  _centerPlacedItems(packResult.placed, binW, binH);

  var failedItems = [];
  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  try {
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
    app.userInteractionLevel = prevInteraction;
  }

  try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eKiss) {}
  try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (ePrint) {}
  doc.selection = null;

  var msg =
    "완료: Name Included 시트 프로토타입 생성\n" +
    "저장하지 않았으니 Illustrator에서 검수하세요.\n\n" +
    "고객 이름: " + options.nameText + "\n" +
    "헤더: info > header / 이름 스티커: 없음\n" +
    "오더 디테일: " + _orderDetailToString(orderDetail) + "\n" +
    "기본 사이즈: " + options.sizeMm + "mm" + (hasCustomSize ? " / 파일명 mm값 반영" : "") +
    " / 칼선 여백: " + options.cutMarginMm + "mm\n" +
    "사진 입력: " + pairs.length + "개 / 사진 배치: " + packResult.placed.length + "개" +
    (packResult.repeatedCount > 0 ? " (반복 채움 " + packResult.repeatedCount + "개 포함)" : "") + "\n" +
    "행: " + packResult.rows.length + "개 / 행 간격: " + GAP_MM + "mm / 가로: justify (round-robin filler)\n" +
    "미배치 사진: " + packResult.leftover.length + "개";

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

  function _showDialog() {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 18;
    dlg.spacing = 12;

    var namePanel = dlg.add("panel", undefined, "고객 이름");
    namePanel.orientation = "column";
    namePanel.alignChildren = "fill";
    namePanel.margins = [14, 18, 14, 14];
    var nameInput = namePanel.add("edittext", undefined, "Mina");
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
    sizeRadios[1].value = true;

    var cutPanel = dlg.add("panel", undefined, "칼선 여백");
    cutPanel.orientation = "row";
    cutPanel.margins = [14, 18, 14, 14];
    cutPanel.spacing = 14;
    var cutRadios = [];
    for (var cm = 0; cm < CUT_MARGIN_OPTIONS.length; cm++) {
      cutRadios.push(cutPanel.add("radiobutton", undefined, CUT_MARGIN_OPTIONS[cm]));
    }
    cutRadios[0].value = true;

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

    var sizeMm = SIZE_VALUES[1];
    for (var sidx = 0; sidx < sizeRadios.length; sidx++) {
      if (sizeRadios[sidx].value) { sizeMm = SIZE_VALUES[sidx]; break; }
    }

    var cutMarginMm = CUT_MARGIN_VALUES[0];
    for (var cidx = 0; cidx < cutRadios.length; cidx++) {
      if (cutRadios[cidx].value) { cutMarginMm = CUT_MARGIN_VALUES[cidx]; break; }
    }

    var materialText = (materialDropdown.selection !== null) ? materialDropdown.selection.text : MATERIAL_OPTIONS[0];

    return {
      nameText: nameText,
      material: materialText,
      orderNumber: _trim(orderInput.text),
      orderDate: _trim(dateInput.text) || _todayIso(),
      sizeMm: sizeMm,
      cutMarginMm: cutMarginMm
    };
  }

  function _buildOrderDetail(options, photoCount) {
    var spec = _sizeLetter(options.sizeMm) + "/" + options.sizeMm + "mm/" + options.cutMarginMm + "mm";
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

    var cutInfo = null;
    var copied = false;

    var tempDoc = _newDocForImage();
    try {
      _traceAndUnite(tempDoc, pair.sil);

      var ar = tempDoc.artboards[0].artboardRect;
      var pngW = ar[2] - ar[0];
      var pngH = ar[1] - ar[3];

      var cutline = _findCutline(tempDoc);
      if (cutline) {
        _stripFills(cutline);
        var tempCutSpot = _ensureCutContour(tempDoc);
        _forceCutContourStroke(cutline, tempCutSpot);

        var b = cutline.geometricBounds;
        cutInfo = {
          relL: b[0] / pngW,
          relT: (pngH - b[1]) / pngH,
          relW: (b[2] - b[0]) / pngW,
          relH: (b[1] - b[3]) / pngH
        };

        tempDoc.selection = null;
        cutline.selected = true;
        app.copy();
        copied = true;
      }
    } finally {
      try { tempDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
      _safeRedrawAndGC();
    }

    if (!copied || !cutInfo) {
      throw new Error("trace 결과 path 없음");
    }

    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = kissLayer;
    app.paste();

    var pasted = sheetDoc.selection;
    if (pasted && pasted.length > 0) {
      var item = pasted[0];
      var targetW = cutInfo.relW * psdW;
      var targetH = cutInfo.relH * psdH;
      var nb = item.geometricBounds;
      var nw = nb[2] - nb[0];
      var nh = nb[1] - nb[3];
      item.resize((targetW / nw) * 100, (targetH / nh) * 100);
      item.left = psdL + cutInfo.relL * psdW;
      item.top = psdT - cutInfo.relT * psdH;
      _forceCutContourStroke(item, cutSpot);
    }

    sheetDoc.selection = null;
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
      var pngName = pngFiles[i].name;
      var psdName = pngName.replace(/_sil\.png$/i, "_clean.psd");
      var psdFile = new File(folder.fsName + "/" + psdName);
      if (psdFile.exists) {
        pairs.push({
          psd: psdFile,
          sil: pngFiles[i],
          base: pngName.replace(/_sil\.png$/i, "")
        });
      }
    }
    return pairs;
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

  function _resolvePairSizeMm(pair, defaultSizeMm) {
    var m = pair.base.match(/(^|[_ -])([0-9]+(\.[0-9]+)?)mm($|[_ -])/i);
    if (m && m[2]) {
      var parsed = parseFloat(m[2]);
      if (parsed > 0) return parsed;
    }
    return defaultSizeMm;
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

  function _shelfPack(originalItems, fillerItems, binW, binH, gap) {
    var rows = [];
    var row = _newShelfRow(0);
    var leftover = [];
    var repeatedCount = 0;

    for (var i = 0; i < originalItems.length; i++) {
      if (_canAddToShelfRow(row, originalItems[i], binW, binH, gap)) {
        _addToShelfRow(row, originalItems[i], gap);
        continue;
      }

      if (row.items.length > 0) {
        rows.push(row);
        row = _newShelfRow(row.y + row.h + gap);
      }

      if (_canAddToShelfRow(row, originalItems[i], binW, binH, gap)) {
        _addToShelfRow(row, originalItems[i], gap);
      } else {
        leftover.push(originalItems[i]);
      }
    }

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

  function _shelfRowsToPlaced(rows, binW, gap) {
    var placed = [];
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var n = row.items.length;
      var sumW = 0;
      for (var k = 0; k < n; k++) sumW += row.items[k].w;

      var x, stride;
      if (n <= 1) {
        x = (binW - sumW) / 2;
        stride = 0;
      } else {
        var actualGap = (binW - sumW) / (n - 1);
        if (actualGap < gap) actualGap = gap;
        x = 0;
        stride = actualGap;
      }

      for (var i = 0; i < n; i++) {
        var item = row.items[i];
        placed.push({ x: x, y: row.y, w: item.w, h: item.h, payload: item.payload });
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

  function _pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

})();
