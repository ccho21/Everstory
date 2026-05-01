// Everstory — Name Included sheet prototype (v10, production header)
//
// 목적:
//   Everstory_Grid.jsx에 통합하기 전, A5 sheet 상단 production header와
//   사진 다이컷 배치 영역을 검수하는 Illustrator 프로토타입.
//
// 동작:
//   1. 고객 이름 / 재질 / 날짜 / 사진 스티커 크기 / 칼선 여백 선택
//   2. templates/template_heart.ait 열기
//   3. 상단 20mm production header에 EVERSTORY + ORDER DETAIL 배치
//   4. 헤더 아래 전체 영역에 _clean.psd + _sil.png 사진 스티커를 MaxRects로 pack
//   5. 저장하지 않고 열린 상태로 둠
//
// 사용법: File → Scripts → Other Script → Everstory_NameIncludedSheet.jsx

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_TITLE = "Everstory Name Included Sheet v10";
  var MM_TO_PT = 2.834645;
  var SAFETY_MM = 2;
  var GAP_MM = 2;
  var HEADER_ZONE_MM = 20;
  var REPEAT_FILL_THRESHOLD = 0.82;

  var SIZE_OPTIONS = ["2cm", "3cm", "6cm"];
  var SIZE_VALUES = [20, 30, 60];
  var CUT_MARGIN_OPTIONS = ["1mm", "2mm"];
  var CUT_MARGIN_VALUES = [1, 2];

  var options = _showDialog();
  if (!options) return;

  var inputFolder = Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!inputFolder) return;

  var pairs = _collectPairs(inputFolder);
  if (pairs.length === 0) {
    alert("선택한 폴더에 _clean.psd + _sil.png 페어가 없습니다.");
    return;
  }

  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    alert("template_heart.ait를 찾을 수 없습니다.");
    return;
  }

  var doc = _openTemplateDoc(templateFile);
  var infoBorder;
  try {
    infoBorder = _findInfoBorder(doc);
  } catch (eBorder) {
    alert(eBorder.message);
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose) {}
    return;
  }

  var safetyPt = SAFETY_MM * MM_TO_PT;
  var gapPt = GAP_MM * MM_TO_PT;
  var cutMarginPt = options.cutMarginMm * MM_TO_PT;

  var borderBounds = infoBorder.geometricBounds;
  var bL = borderBounds[0], bT = borderBounds[1], bR = borderBounds[2], bB = borderBounds[3];
  var binW = (bR - bL) - 2 * safetyPt;
  var binH = (bT - bB) - 2 * safetyPt;

  if (binW <= 0 || binH <= 0) {
    alert("a5_border 영역이 안전 여백보다 작습니다.");
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose2) {}
    return;
  }

  var printLayer = doc.layers.add();
  printLayer.name = "PrintData";
  var kissLayer = doc.layers.add();
  kissLayer.name = "KissCut";
  var cutSpot = _ensureCutContour(doc);

  var headerHPt = HEADER_ZONE_MM * MM_TO_PT;
  if (headerHPt >= binH) {
    alert("헤더 영역이 a5_border 안 사용 가능 영역보다 큽니다.");
    return;
  }

  var orderDetailText = _buildOrderDetail(options, pairs.length);
  _drawProductionHeader(doc, printLayer, orderDetailText, bL + safetyPt, bT - safetyPt, binW, headerHPt);

  var freeRects = [{ x: 0, y: headerHPt, w: binW, h: binH - headerHPt }];
  var photoArea = _sumRectAreas(freeRects);
  if (photoArea <= 0) {
    alert("헤더가 사진 배치 영역을 모두 차지합니다. 헤더 높이를 줄이세요.");
    return;
  }

  var totalArea = 0;
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
    totalArea += pairs[pi].cellW * pairs[pi].cellH;
    if (!_fitsAnyFreeRect(pairs[pi].cellW + gapPt, pairs[pi].cellH + gapPt, freeRects)) anyTooBig = true;
  }

  if (anyTooBig) {
    alert("일부 사진 셀이 헤더 아래 사진 영역보다 큽니다. 사진 스티커 크기를 줄이세요.");
    return;
  }

  var queue = [];
  var primaryPairs = _sortedPairsByArea(pairs, false);
  for (var pi2 = 0; pi2 < primaryPairs.length; pi2++) queue.push(primaryPairs[pi2]);

  var packItems = [];
  for (var qi = 0; qi < queue.length; qi++) {
    packItems.push({ w: queue[qi].cellW, h: queue[qi].cellH, payload: queue[qi] });
  }

  var packResult = _binPack(packItems, binW, binH, gapPt, freeRects);

  var shouldRepeat = totalArea < photoArea * REPEAT_FILL_THRESHOLD && packResult.leftover.length === 0;
  if (shouldRepeat) {
    var fillerItems = _buildRepeatFillItems(pairs, photoArea, totalArea);
    if (fillerItems.length > 0 && packResult.freeRects && packResult.freeRects.length > 0) {
      var fillerResult = _binPack(fillerItems, binW, binH, gapPt, packResult.freeRects);
      for (var fp = 0; fp < fillerResult.placed.length; fp++) {
        packResult.placed.push(fillerResult.placed[fp]);
      }
    }
  }

  var failedItems = [];
  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  try {
    for (var p = 0; p < packResult.placed.length; p++) {
      var pl = packResult.placed[p];
      var aiX = bL + safetyPt + pl.x;
      var aiY = bT - safetyPt - pl.y;
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
    "헤더: " + HEADER_ZONE_MM + "mm / 이름 스티커: 없음\n" +
    "오더 디테일: " + orderDetailText + "\n" +
    "기본 사이즈: " + options.sizeMm + "mm" + (hasCustomSize ? " / 파일명 mm값 반영" : "") +
    " / 칼선 여백: " + options.cutMarginMm + "mm\n" +
    "사진 입력: " + pairs.length + "개 / 사진 배치: " + packResult.placed.length + "개" +
    (shouldRepeat ? " (반복 채움 포함)" : "") + "\n" +
    "미배치 사진: " + packResult.leftover.length + "개";

  if (failedItems.length > 0) {
    msg += "\n\ntrace 실패 " + failedItems.length + "건:";
    for (var fi = 0; fi < failedItems.length; fi++) {
      msg += "\n- " + failedItems[fi].base + ": " + failedItems[fi].error;
    }
  }
  alert(msg);


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
    var materialInput = materialGroup.add("edittext", undefined, "White");
    materialInput.preferredSize = [250, 24];

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

    var hint = dlg.add("statictext", undefined, "상단 20mm 헤더에는 주문 정보만 넣고, 이름 스티커는 생성하지 않습니다.");
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

    return {
      nameText: nameText,
      material: _trim(materialInput.text) || "White",
      orderDate: _trim(dateInput.text) || _todayIso(),
      sizeMm: sizeMm,
      cutMarginMm: cutMarginMm
    };
  }

  function _sumRectAreas(rects) {
    var area = 0;
    for (var i = 0; i < rects.length; i++) {
      if (rects[i].w > 0 && rects[i].h > 0) area += rects[i].w * rects[i].h;
    }
    return area;
  }

  function _fitsAnyFreeRect(w, h, rects) {
    for (var i = 0; i < rects.length; i++) {
      if (rects[i].w >= w && rects[i].h >= h) return true;
    }
    return false;
  }

  function _buildOrderDetail(options, photoCount) {
    return [
      "USER: " + options.nameText + "    TYPE: Name Add-on",
      "SIZE: " + options.sizeMm + "mm    CUT: " + options.cutMarginMm + "mm    PHOTOS: " + photoCount + "    MATERIAL: " + options.material,
      "DATE: " + options.orderDate
    ].join("\r");
  }

  function _drawProductionHeader(doc, layer, detailText, binLeft, binTop, binW, headerH) {
    doc.activeLayer = layer;

    var infoFont = _resolveInfoFont();
    var dark = _rgb(54, 54, 50);
    var muted = _rgb(105, 105, 100);
    var ruleColor = _rgb(218, 216, 210);

    var brand = layer.textFrames.add();
    brand.contents = "EVERSTORY";
    brand.left = 0;
    brand.top = 0;
    var brandAttrs = brand.textRange.characterAttributes;
    if (infoFont) brandAttrs.textFont = infoFont;
    brandAttrs.size = 10;
    brandAttrs.tracking = 180;
    brandAttrs.fillColor = dark;
    _moveItemTopLeft(brand, binLeft, binTop - 3 * MM_TO_PT);
    try { brand.name = "HeaderBrand_Print"; } catch (eBrandName) {}

    var title = layer.textFrames.add();
    title.contents = "ORDER DETAIL";
    title.left = 0;
    title.top = 0;
    var titleAttrs = title.textRange.characterAttributes;
    if (infoFont) titleAttrs.textFont = infoFont;
    titleAttrs.size = 6.2;
    titleAttrs.tracking = 120;
    titleAttrs.fillColor = dark;
    _moveItemTopRight(title, binLeft + binW, binTop - 2.6 * MM_TO_PT);
    try { title.name = "HeaderTitle_Print"; } catch (eTitleName) {}

    var detail = layer.textFrames.add();
    detail.contents = detailText;
    detail.left = 0;
    detail.top = 0;
    var attrs = detail.textRange.characterAttributes;
    if (infoFont) attrs.textFont = infoFont;
    attrs.size = 5.2;
    attrs.leading = 6.8;
    attrs.tracking = 20;
    attrs.fillColor = muted;

    var detailW = binW * 0.68;
    var detailH = headerH - 7 * MM_TO_PT;
    _fitTextToBoxMin(detail, detailW, detailH, 5.2, 4.2);
    _moveItemTopRight(detail, binLeft + binW, binTop - 6.2 * MM_TO_PT);
    try { detail.name = "OrderDetail_Print"; } catch (eDetailName) {}

    var ruleY = binTop - headerH + 1.2 * MM_TO_PT;
    var rule = layer.pathItems.add();
    rule.setEntirePath([[binLeft, ruleY], [binLeft + binW, ruleY]]);
    rule.filled = false;
    rule.stroked = true;
    rule.strokeColor = ruleColor;
    rule.strokeWidth = 0.35;
    try { rule.name = "HeaderRule_Print"; } catch (eRuleName) {}
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
      scriptDir.fsName + "/templates/template_heart.ait",
      scriptDir.parent.fsName + "/templates/template_heart.ait"
    ];
    for (var i = 0; i < candidates.length; i++) {
      var f = new File(candidates[i]);
      if (f.exists) return f;
    }
    return File.openDialog("template_heart.ait 위치 선택", "*.ait");
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

  function _findInfoBorder(doc) {
    var infoLayer = null;
    for (var i = 0; i < doc.layers.length; i++) {
      if (doc.layers[i].name.toLowerCase() === "info") {
        infoLayer = doc.layers[i];
        break;
      }
    }
    if (!infoLayer) throw new Error("템플릿에 'info' 레이어가 없습니다");
    var border = _deepFindByName(infoLayer, "a5_border");
    if (!border) throw new Error("info 레이어 안에 'a5_border'가 없습니다");
    return border;
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

  function _binPack(items, binW, binH, gap, startFreeRects) {
    var freeRects = startFreeRects ? _cloneRects(startFreeRects) : [{ x: 0, y: 0, w: binW, h: binH }];
    var placed = [];
    var leftover = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var w = item.w + gap;
      var h = item.h + gap;

      var bestIdx = -1;
      var bestShort = Infinity;
      var bestLong = Infinity;

      for (var j = 0; j < freeRects.length; j++) {
        var fr = freeRects[j];
        if (fr.w >= w && fr.h >= h) {
          var leftW = fr.w - w;
          var leftH = fr.h - h;
          var sFit = leftW < leftH ? leftW : leftH;
          var lFit = leftW > leftH ? leftW : leftH;
          if (sFit < bestShort || (sFit === bestShort && lFit < bestLong)) {
            bestIdx = j;
            bestShort = sFit;
            bestLong = lFit;
          }
        }
      }

      if (bestIdx === -1) {
        leftover.push(item);
        continue;
      }

      var chosen = freeRects[bestIdx];
      placed.push({ x: chosen.x, y: chosen.y, w: item.w, h: item.h, payload: item.payload });

      var used = { x: chosen.x, y: chosen.y, w: w, h: h };
      var newFree = [];
      for (var k = 0; k < freeRects.length; k++) {
        var split = _splitFreeRect(freeRects[k], used);
        for (var s = 0; s < split.length; s++) newFree.push(split[s]);
      }
      freeRects = _pruneFreeRects(newFree);
    }

    return { placed: placed, leftover: leftover, freeRects: freeRects };
  }

  function _cloneRects(rects) {
    var result = [];
    for (var i = 0; i < rects.length; i++) {
      result.push({ x: rects[i].x, y: rects[i].y, w: rects[i].w, h: rects[i].h });
    }
    return result;
  }

  function _splitFreeRect(fr, used) {
    if (used.x >= fr.x + fr.w || used.x + used.w <= fr.x ||
        used.y >= fr.y + fr.h || used.y + used.h <= fr.y) {
      return [fr];
    }

    var result = [];
    if (used.y > fr.y && used.y < fr.y + fr.h) {
      result.push({ x: fr.x, y: fr.y, w: fr.w, h: used.y - fr.y });
    }
    if (used.y + used.h < fr.y + fr.h) {
      result.push({ x: fr.x, y: used.y + used.h, w: fr.w, h: (fr.y + fr.h) - (used.y + used.h) });
    }
    if (used.x > fr.x && used.x < fr.x + fr.w) {
      result.push({ x: fr.x, y: fr.y, w: used.x - fr.x, h: fr.h });
    }
    if (used.x + used.w < fr.x + fr.w) {
      result.push({ x: used.x + used.w, y: fr.y, w: (fr.x + fr.w) - (used.x + used.w), h: fr.h });
    }
    return result;
  }

  function _pruneFreeRects(rects) {
    var result = [];
    for (var i = 0; i < rects.length; i++) {
      var keep = true;
      for (var j = 0; j < rects.length; j++) {
        if (i !== j && _rectContains(rects[j], rects[i])) {
          keep = false;
          break;
        }
      }
      if (keep) result.push(rects[i]);
    }
    return result;
  }

  function _rectContains(outer, inner) {
    return inner.x >= outer.x && inner.y >= outer.y &&
           inner.x + inner.w <= outer.x + outer.w &&
           inner.y + inner.h <= outer.y + outer.h;
  }

  function _sortedPairsByArea(pairs, ascending) {
    var result = [];
    for (var i = 0; i < pairs.length; i++) result.push(pairs[i]);
    result.sort(function (a, b) {
      var aa = a.cellW * a.cellH;
      var bb = b.cellW * b.cellH;
      return ascending ? (aa - bb) : (bb - aa);
    });
    return result;
  }

  function _buildRepeatFillItems(pairs, binArea, totalArea) {
    var items = [];
    if (totalArea <= 0) return items;

    var rounds = Math.max(1, Math.ceil((binArea - totalArea) / totalArea) + 1);
    var fillPairs = _sortedPairsByArea(pairs, true);
    for (var r = 0; r < rounds; r++) {
      for (var i = 0; i < fillPairs.length; i++) {
        items.push({ w: fillPairs[i].cellW, h: fillPairs[i].cellH, payload: fillPairs[i] });
      }
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
