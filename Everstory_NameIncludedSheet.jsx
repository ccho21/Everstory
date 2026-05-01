// Everstory — Name Included sheet prototype (v9, fixed header zone)
//
// 목적:
//   Everstory_Grid.jsx에 통합하기 전, 이름 스티커를 사진 다이컷과 같은 A5 sheet 안에
//   어떻게 섞어 배치할지 검수하는 Illustrator 프로토타입.
//
// 동작:
//   1. 이름 / 오더 디테일 / 이름 스타일 / 이름 컬러 / 이름 가로 / 사진 스티커 크기 / 칼선 여백 선택
//   2. templates/template_heart.ait 열기
//   3. 상단 14mm 헤더 왼쪽에 이름 스티커, 오른쪽에 작은 오더 디테일 배치
//   4. 헤더 아래 직사각형 영역에 _clean.psd + _sil.png 사진 스티커를 MaxRects로 pack
//   5. 저장하지 않고 열린 상태로 둠
//
// 사용법: File → Scripts → Other Script → Everstory_NameIncludedSheet.jsx

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_TITLE = "Everstory Name Included Sheet v9";
  var MM_TO_PT = 2.834645;
  var SAFETY_MM = 2;
  var GAP_MM = 2;
  var HEADER_ZONE_MM = 14;
  var HEADER_NAME_BACKING_OFFSET_MM = 1.8;
  var REPEAT_FILL_THRESHOLD = 0.82;
  var DEFAULT_NAME_WIDTH_MM = 60;
  var MIN_NAME_WIDTH_MM = 30;
  var MAX_NAME_WIDTH_MM = 90;

  var SIZE_OPTIONS = ["2cm", "3cm", "6cm"];
  var SIZE_VALUES = [20, 30, 60];
  var CUT_MARGIN_OPTIONS = ["1mm", "2mm"];
  var CUT_MARGIN_VALUES = [1, 2];
  var HEADER_ANCHOR = "header-left";
  var HEADER_ANCHOR_LABEL = "Header Left";

  var STYLE_PRESETS = [
    {
      name: "Minimal Script",
      keywords: ["script", "hand", "calligraphy", "chancery", "roundhand", "sign", "brush", "snell"],
      fallbackFonts: ["SnellRoundhand", "SignPainter-HouseScript", "BrushScriptMT", "Apple-Chancery"],
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 58,
      tracking: 0,
      backingOffset: 3.8,
      underline: false
    },
    {
      name: "Minimal Serif",
      keywords: ["didot", "bodoni", "garamond", "caslon", "times", "georgia", "serif"],
      fallbackFonts: ["Didot", "BodoniSvtyTwoITCTT-Book", "TimesNewRomanPSMT", "Georgia"],
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 54,
      tracking: 20,
      backingOffset: 3.6,
      underline: false
    },
    {
      name: "Minimal Sans",
      keywords: ["avenir", "helvetica", "futura", "gill", "arial", "noto sans", "source sans"],
      fallbackFonts: ["Avenir-Book", "HelveticaNeue-Light", "GillSans-Light", "ArialMT"],
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 50,
      tracking: 120,
      backingOffset: 3.6,
      underline: true
    }
  ];

  var COLOR_PRESETS = [
    { name: "Cocoa Brown", rgb: [95, 82, 64] },
    { name: "Soft Black", rgb: [34, 34, 32] },
    { name: "Warm Taupe", rgb: [128, 112, 93] },
    { name: "Dusty Rose", rgb: [161, 111, 105] },
    { name: "Blue Gray", rgb: [64, 88, 98] },
    { name: "Sage Gray", rgb: [102, 116, 100] }
  ];

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
  var nameStyle = _makeHeaderNameStyle(options.style);
  var nameMaxTextWidthMm = _resolveNameTextWidthMm(options.nameWidthMm, nameStyle);
  var nameMaxTextHeightMm = _resolveHeaderNameTextHeightMm(nameStyle);
  var nameSticker = _createNameSticker(
    doc,
    printLayer,
    kissLayer,
    options.nameText,
    nameStyle,
    options.color,
    nameMaxTextWidthMm * MM_TO_PT,
    nameMaxTextHeightMm * MM_TO_PT,
    cutSpot
  );
  _safeDeselect(doc);
  _safeRedrawAndGC();

  var nameRect = _resolveNameAnchorRect(nameSticker.w, nameSticker.h, binW, binH, options.anchor, headerHPt);
  _moveNameStickerToBin(doc, nameSticker, bL + safetyPt + nameRect.x, bT - safetyPt - nameRect.y);

  var orderDetailText = _buildOrderDetail(options.orderDetail, options.sizeMm, options.cutMarginMm, pairs.length);
  _drawOrderDetail(doc, printLayer, orderDetailText, bL + safetyPt, bT - safetyPt, binW, headerHPt, nameSticker.w);

  var freeRects = _buildPhotoFreeRects(nameRect, binW, binH, options.anchor, gapPt);
  var photoArea = _sumRectAreas(freeRects);
  if (photoArea <= 0) {
    alert("이름 스티커가 사진 배치 영역을 모두 차지합니다. 이름 가로를 줄이세요.");
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
    alert("일부 사진 셀이 이름 아래 사진 영역보다 큽니다. 사진 스티커 크기나 이름 스티커 크기를 줄이세요.");
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
    "이름: " + options.nameText + " / " + options.style.name + " / " + options.color.name + "\n" +
    "헤더: 15mm / 이름 위치: " + options.anchorLabel + " / 이름 가로: " + options.nameWidthMm + "mm\n" +
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

    var namePanel = dlg.add("panel", undefined, "이름");
    namePanel.orientation = "column";
    namePanel.alignChildren = "fill";
    namePanel.margins = [14, 18, 14, 14];
    var nameInput = namePanel.add("edittext", undefined, "Mina");
    nameInput.preferredSize = [320, 24];

    var orderPanel = dlg.add("panel", undefined, "오더 디테일");
    orderPanel.orientation = "column";
    orderPanel.alignChildren = "fill";
    orderPanel.margins = [14, 18, 14, 14];
    var orderInput = orderPanel.add("edittext", undefined, "");
    orderInput.preferredSize = [320, 24];
    var orderHint = orderPanel.add("statictext", undefined, "비워두면 사이즈/사진수/칼선 여백만 자동 표기합니다.");
    try { orderHint.graphics.foregroundColor = orderHint.graphics.newPen(orderHint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eOrderHint) {}

    var stylePanel = dlg.add("panel", undefined, "이름 스타일");
    stylePanel.orientation = "column";
    stylePanel.alignChildren = "fill";
    stylePanel.margins = [14, 18, 14, 14];
    var styleDrop = stylePanel.add("dropdownlist");
    for (var s = 0; s < STYLE_PRESETS.length; s++) styleDrop.add("item", STYLE_PRESETS[s].name);
    styleDrop.selection = 0;

    var colorPanel = dlg.add("panel", undefined, "이름 컬러");
    colorPanel.orientation = "column";
    colorPanel.alignChildren = "fill";
    colorPanel.margins = [14, 18, 14, 14];
    var colorDrop = colorPanel.add("dropdownlist");
    for (var c = 0; c < COLOR_PRESETS.length; c++) colorDrop.add("item", COLOR_PRESETS[c].name);
    colorDrop.selection = 0;

    var nameSizePanel = dlg.add("panel", undefined, "이름 스티커 가로");
    nameSizePanel.orientation = "row";
    nameSizePanel.alignChildren = "center";
    nameSizePanel.margins = [14, 18, 14, 14];
    nameSizePanel.spacing = 8;
    var nameWidthInput = nameSizePanel.add("edittext", undefined, String(DEFAULT_NAME_WIDTH_MM));
    nameWidthInput.preferredSize = [48, 24];
    nameSizePanel.add("statictext", undefined, "mm");

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

    var hint = dlg.add("statictext", undefined, "상단 14mm 헤더 왼쪽에는 이름, 오른쪽에는 오더 디테일을 넣습니다.");
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

    var styleIndex = styleDrop.selection ? styleDrop.selection.index : 0;
    var colorIndex = colorDrop.selection ? colorDrop.selection.index : 0;
    var nameWidthMm = parseFloat(nameWidthInput.text);
    if (!nameWidthMm || nameWidthMm <= 0) nameWidthMm = DEFAULT_NAME_WIDTH_MM;
    if (nameWidthMm < MIN_NAME_WIDTH_MM) nameWidthMm = MIN_NAME_WIDTH_MM;
    if (nameWidthMm > MAX_NAME_WIDTH_MM) nameWidthMm = MAX_NAME_WIDTH_MM;

    return {
      nameText: nameText,
      orderDetail: _trim(orderInput.text),
      style: STYLE_PRESETS[styleIndex],
      color: COLOR_PRESETS[colorIndex],
      anchor: HEADER_ANCHOR,
      anchorLabel: HEADER_ANCHOR_LABEL,
      nameWidthMm: nameWidthMm,
      sizeMm: sizeMm,
      cutMarginMm: cutMarginMm
    };
  }


  // ═════════════════════════════════════════════════════════
  //  NAME STICKER
  // ═════════════════════════════════════════════════════════

  function _createNameSticker(doc, printLayer, kissLayer, nameText, style, colorPreset, maxTextW, maxTextH, cutSpot) {
    var textFont = _resolveFont(style);
    var textRgb = colorPreset.rgb;
    var textColor = _rgb(textRgb[0], textRgb[1], textRgb[2]);
    var backingColor = _rgb(style.backingColor[0], style.backingColor[1], style.backingColor[2]);
    var backingStrokeColor = _rgb(style.backingStrokeColor[0], style.backingStrokeColor[1], style.backingStrokeColor[2]);

    doc.activeLayer = printLayer;
    var text = printLayer.textFrames.add();
    text.contents = nameText;
    text.left = 0;
    text.top = 0;

    var attrs = text.textRange.characterAttributes;
    if (textFont) attrs.textFont = textFont;
    attrs.size = style.fontSize;
    attrs.tracking = style.tracking;
    attrs.fillColor = textColor;

    _fitTextToBox(text, maxTextW, maxTextH, style.fontSize);
    _centerItem(text, 0, 0);

    var decorItems = [];
    if (style.underline) {
      decorItems.push(_drawUnderline(printLayer, text, textColor, style));
    }

    var outlined = text.createOutline();
    var printItems = [outlined].concat(decorItems);
    var backing = _makeDieCutBacking(doc, printLayer, printItems, style, backingColor, backingStrokeColor);

    var cutPath = backing.duplicate(kissLayer, ElementPlacement.PLACEATEND);
    _removeContainedSubpaths(cutPath);
    _forceCutContourStroke(cutPath, cutSpot);

    var group = printLayer.groupItems.add();
    try { backing.move(group, ElementPlacement.PLACEATEND); } catch (eB) {}
    try { outlined.move(group, ElementPlacement.PLACEATEND); } catch (eO) {}
    for (var i = 0; i < decorItems.length; i++) {
      try { decorItems[i].move(group, ElementPlacement.PLACEATEND); } catch (eD) {}
    }
    try { group.name = "NameSticker_Print"; } catch (eName) {}
    try { cutPath.name = "NameSticker_Cut"; } catch (eCutName) {}

    var gb = group.geometricBounds;
    return {
      printItem: group,
      cutItem: cutPath,
      bounds: gb,
      w: gb[2] - gb[0],
      h: gb[1] - gb[3]
    };
  }

  function _makeHeaderNameStyle(style) {
    return {
      name: style.name,
      keywords: _copyArray(style.keywords),
      fallbackFonts: _copyArray(style.fallbackFonts),
      backingColor: _copyArray(style.backingColor),
      backingStrokeColor: _copyArray(style.backingStrokeColor),
      fontSize: Math.min(style.fontSize, 44),
      tracking: style.tracking,
      backingOffset: Math.min(style.backingOffset, HEADER_NAME_BACKING_OFFSET_MM),
      underline: style.underline
    };
  }

  function _copyArray(arr) {
    var copy = [];
    for (var i = 0; i < arr.length; i++) copy.push(arr[i]);
    return copy;
  }

  function _makeDieCutBacking(doc, layer, sourceItems, style, fillColor, edgeColor) {
    var sourceGroup = layer.groupItems.add();
    for (var i = 0; i < sourceItems.length; i++) {
      sourceItems[i].duplicate(sourceGroup, ElementPlacement.PLACEATEND);
    }

    _applyBackingSourceStyle(sourceGroup, fillColor, style.backingOffset * MM_TO_PT * 2);

    var backing = _expandAndUnite(doc, sourceGroup);
    if (backing && backing !== sourceGroup) {
      _removeContainedSubpaths(backing);
      _applyPrintBackingStyle(backing, fillColor, edgeColor);
    } else {
      backing = sourceGroup;
    }
    try { backing.name = "NameBacking"; } catch (eName) {}
    return backing;
  }

  function _moveNameStickerToBin(doc, nameSticker, left, top) {
    _safeDeselect(doc);
    var b = nameSticker.printItem.geometricBounds;
    var dx = left - b[0];
    var dy = top - b[1];
    nameSticker.printItem.translate(dx, dy);
    nameSticker.cutItem.translate(dx, dy);
    _safeDeselect(doc);
    _safeRedrawAndGC();
  }

  function _resolveNameAnchorRect(w, h, binW, binH, anchor, headerH) {
    var x = 0;
    var y = 0;
    if (anchor === "header-left") {
      x = 0;
      y = (headerH - h) / 2;
    } else if (anchor === "top-header") {
      x = (binW - w) / 2;
      y = 0;
    } else if (anchor === "center") {
      x = (binW - w) / 2;
      y = (binH - h) / 2;
    } else if (anchor === "top-center") {
      x = (binW - w) / 2;
      y = 0;
    } else if (anchor === "bottom-right") {
      x = binW - w;
      y = binH - h;
    } else if (anchor === "bottom-left") {
      x = 0;
      y = binH - h;
    }
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    return { x: x, y: y, w: w, h: h };
  }

  function _buildPhotoFreeRects(nameRect, binW, binH, anchor, gap) {
    if (anchor === "header-left" || anchor === "top-header") {
      var headerH = HEADER_ZONE_MM * MM_TO_PT;
      if (headerH > binH) headerH = binH;
      return [{ x: 0, y: headerH, w: binW, h: binH - headerH }];
    }

    var reserved = _reserveRectWithGap(nameRect, binW, binH, gap);
    return _splitFreeRect({ x: 0, y: 0, w: binW, h: binH }, reserved);
  }

  function _reserveRectWithGap(rect, binW, binH, gap) {
    var x = Math.max(0, rect.x - gap);
    var y = Math.max(0, rect.y - gap);
    var r = Math.min(binW, rect.x + rect.w + gap);
    var b = Math.min(binH, rect.y + rect.h + gap);
    return { x: x, y: y, w: r - x, h: b - y };
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

  function _resolveNameTextWidthMm(targetStickerWidthMm, style) {
    var textWidth = targetStickerWidthMm - (style.backingOffset * 2);
    if (textWidth < 16) textWidth = 16;
    return textWidth;
  }

  function _resolveHeaderNameTextHeightMm(style) {
    var h = HEADER_ZONE_MM - (style.backingOffset * 2) - 1.5;
    if (style.underline) h -= 3.5;
    if (h < 6) h = 6;
    if (h > 10) h = 10;
    return h;
  }

  function _resolveNameTextHeightMm(targetStickerWidthMm) {
    var h = targetStickerWidthMm * 0.42;
    if (h < 12) h = 12;
    if (h > 24) h = 24;
    return h;
  }

  function _buildOrderDetail(inputText, sizeMm, cutMarginMm, photoCount) {
    var meta = sizeMm + "mm / " + photoCount + " photos / cut " + cutMarginMm + "mm";
    var input = _trim(inputText);
    return input ? (input + " / " + meta) : meta;
  }

  function _drawOrderDetail(doc, layer, detailText, binLeft, binTop, binW, headerH, nameW) {
    if (!detailText) return null;

    var leftLimit = binLeft + nameW + 6 * MM_TO_PT;
    var right = binLeft + binW;
    var maxW = right - leftLimit;
    if (maxW <= 12 * MM_TO_PT) return null;

    doc.activeLayer = layer;
    var text = layer.textFrames.add();
    text.contents = detailText;
    text.left = 0;
    text.top = 0;

    var attrs = text.textRange.characterAttributes;
    var infoFont = _resolveInfoFont();
    if (infoFont) attrs.textFont = infoFont;
    attrs.size = 5.8;
    attrs.tracking = 40;
    attrs.fillColor = _rgb(115, 115, 112);

    _fitTextToBoxMin(text, maxW, 5 * MM_TO_PT, 5.8, 4.2);

    var b = text.geometricBounds;
    var h = b[1] - b[3];
    var targetTop = binTop - (headerH - h) / 2;
    _moveItemTopRight(text, right, targetTop);

    try { text.name = "OrderDetail_Print"; } catch (eName) {}
    return text;
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

  function _expandAndUnite(doc, item) {
    app.activeDocument = doc;
    doc.selection = null;
    item.selected = true;

    try { app.executeMenuCommand("expandStyle"); } catch (eExpandStyle1) {}
    try { app.executeMenuCommand("outline"); } catch (eOutlineStroke) {}
    try { app.executeMenuCommand("Live Pathfinder Add"); } catch (ePathfinder) {}
    try { app.executeMenuCommand("expandStyle"); } catch (eExpandStyle2) {}

    var sel = doc.selection;
    if (sel && sel.length > 0) return sel[0];
    return null;
  }

  function _safeDeselect(doc) {
    try { app.activeDocument = doc; } catch (eActive) {}
    try { doc.selection = null; } catch (eSel) {}
    try { app.executeMenuCommand("deselectall"); } catch (eMenu) {}
  }

  function _safeRedrawAndGC() {
    try { app.redraw(); } catch (eRedraw) {}
    try { $.gc(); } catch (eGc) {}
  }

  function _applyBackingSourceStyle(item, color, strokeWidth) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
          _applyBackingSourceStyle(item.pageItems[i], color, strokeWidth);
        }
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
          _applyBackingSourceStyle(item.pathItems[j], color, strokeWidth);
        }
        return;
      }
      if (item.typename === "PathItem") {
        item.filled = true;
        item.fillColor = color;
        item.stroked = true;
        item.strokeColor = color;
        item.strokeWidth = strokeWidth;
        try { item.strokeJoin = StrokeJoin.ROUNDENDJOIN; } catch (eJoin) {}
        try { item.strokeCap = StrokeCap.ROUNDENDCAP; } catch (eCap) {}
      }
    } catch (e) {}
  }

  function _applyPrintBackingStyle(item, fillColor, edgeColor) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
          _applyPrintBackingStyle(item.pageItems[i], fillColor, edgeColor);
        }
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
          _applyPrintBackingStyle(item.pathItems[j], fillColor, edgeColor);
        }
        return;
      }
      if (item.typename === "PathItem") {
        item.filled = true;
        item.fillColor = fillColor;
        item.stroked = true;
        item.strokeColor = edgeColor;
        item.strokeWidth = 0.35;
      }
    } catch (e) {}
  }

  function _removeContainedSubpaths(item) {
    try {
      if (item.typename === "GroupItem") {
        for (var g = 0; g < item.pageItems.length; g++) {
          _removeContainedSubpaths(item.pageItems[g]);
        }
        return;
      }

      if (item.typename !== "CompoundPathItem" || !item.pathItems || item.pathItems.length < 2) {
        return;
      }

      var paths = [];
      var largestAbsArea = 0;
      var outerSign = 0;
      for (var i = 0; i < item.pathItems.length; i++) {
        var area = 0;
        try { area = item.pathItems[i].area; } catch (eArea) {}
        var absArea = Math.abs(area);
        if (absArea > largestAbsArea) {
          largestAbsArea = absArea;
          outerSign = area > 0 ? 1 : (area < 0 ? -1 : 0);
        }
        paths.push({
          item: item.pathItems[i],
          bounds: item.pathItems[i].geometricBounds,
          sign: area > 0 ? 1 : (area < 0 ? -1 : 0),
          remove: false
        });
      }

      for (var p = 0; p < paths.length; p++) {
        for (var q = 0; q < paths.length; q++) {
          if (p === q) continue;
          if (_boundsContain(paths[q].bounds, paths[p].bounds, 0.3)) {
            if (outerSign === 0 || paths[p].sign === 0 || paths[p].sign !== outerSign) {
              paths[p].remove = true;
            }
            break;
          }
        }
      }

      var keepCount = 0;
      for (var k = 0; k < paths.length; k++) {
        if (!paths[k].remove) keepCount++;
      }
      if (keepCount === 0) return;

      for (var r = paths.length - 1; r >= 0; r--) {
        if (paths[r].remove) {
          try { paths[r].item.remove(); } catch (eRemove) {}
        }
      }
    } catch (e) {}
  }

  function _boundsContain(outer, inner, tol) {
    return inner[0] >= outer[0] + tol &&
           inner[2] <= outer[2] - tol &&
           inner[1] <= outer[1] - tol &&
           inner[3] >= outer[3] + tol;
  }

  function _drawUnderline(layer, textItem, color, style) {
    var b = textItem.geometricBounds;
    var w = b[2] - b[0];
    var x1 = b[0] + w * 0.08;
    var x2 = b[2] - w * 0.08;
    var y = b[3] - 2.2 * MM_TO_PT;

    var line = layer.pathItems.add();
    line.setEntirePath([[x1, y], [x2, y]]);
    line.filled = false;
    line.stroked = true;
    line.strokeColor = color;
    line.strokeWidth = style.name === "Minimal Script" ? 0.7 : 0.9;
    try { line.strokeCap = StrokeCap.ROUNDENDCAP; } catch (e) {}
    return line;
  }

  function _fitTextToBox(textItem, maxW, maxH, startSize) {
    var size = startSize;
    for (var i = 0; i < 30; i++) {
      var b = textItem.geometricBounds;
      var w = b[2] - b[0];
      var h = b[1] - b[3];
      if (w <= maxW && h <= maxH) break;
      var rw = maxW / w;
      var rh = maxH / h;
      var r = Math.min(rw, rh);
      size = Math.max(12, size * r * 0.96);
      textItem.textRange.characterAttributes.size = size;
    }
  }

  function _centerItem(item, cx, cy) {
    var b = item.geometricBounds;
    var itemCx = (b[0] + b[2]) / 2;
    var itemCy = (b[1] + b[3]) / 2;
    item.translate(cx - itemCx, cy - itemCy);
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

  function _resolveFont(style) {
    for (var i = 0; i < style.fallbackFonts.length; i++) {
      try { return app.textFonts.getByName(style.fallbackFonts[i]); } catch (eFallback) {}
    }

    var keywordFont = _findFontByKeywords(style.keywords);
    if (keywordFont) return keywordFont;

    if (app.textFonts.length > 0) return app.textFonts[0];
    return null;
  }

  function _findFontByKeywords(keywords) {
    for (var i = 0; i < app.textFonts.length; i++) {
      var font = app.textFonts[i];
      var hay = _fontHaystack(font);
      for (var k = 0; k < keywords.length; k++) {
        if (hay.indexOf(keywords[k]) !== -1) return font;
      }
    }
    return null;
  }

  function _fontHaystack(font) {
    var parts = [];
    try { parts.push(font.name); } catch (e1) {}
    try { parts.push(font.family); } catch (e2) {}
    try { parts.push(font.style); } catch (e3) {}
    return parts.join(" ").toLowerCase();
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

})();
