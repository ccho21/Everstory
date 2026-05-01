// Everstory — Name Sticker prototype (v4, fixed font candidates + color)
//
// 입력: 이름 텍스트 + 고정 폰트 후보/컬러 선택
// 출력: 저장하지 않은 Illustrator 문서에 이름 스티커 1개 생성
//
// 생성 레이어:
//   PrintData — die-cut backing shape + outlined text + optional underline
//   KissCut   — backing 외곽 CutContour
//
// 사용법: File → Scripts → Other Script → Everstory_NameSticker.jsx

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_TITLE = "Everstory Name Sticker v4";
  var MM_TO_PT = 2.834645;
  var DOC_W_MM = 148;
  var DOC_H_MM = 105;
  var MAX_TEXT_W_MM = 78;
  var MAX_TEXT_H_MM = 24;

  var ENGLISH_FONT_PRESETS = [
    {
      label: "Snell Roundhand",
      fontName: "SnellRoundhand",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 58,
      tracking: 0,
      backingOffset: 3.8,
      underline: false,
      underlineStrokeWidth: 0.7
    },
    {
      label: "SignPainter HouseScript",
      fontName: "SignPainter-HouseScript",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 62,
      tracking: 0,
      backingOffset: 4.0,
      underline: false,
      underlineStrokeWidth: 0.7
    },
    {
      label: "Apple Chancery",
      fontName: "Apple-Chancery",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 52,
      tracking: 0,
      backingOffset: 3.6,
      underline: false,
      underlineStrokeWidth: 0.7
    },
    {
      label: "Didot",
      fontName: "Didot",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 54,
      tracking: 20,
      backingOffset: 3.6,
      underline: false,
      underlineStrokeWidth: 0.7
    },
    {
      label: "Avenir Next Regular",
      fontName: "AvenirNext-Regular",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 50,
      tracking: 80,
      backingOffset: 3.4,
      underline: true,
      underlineStrokeWidth: 0.9
    }
  ];

  var KOREAN_FONT_PRESETS = [
    {
      label: "Apple SD Gothic Neo SemiBold",
      fontName: "AppleSDGothicNeo-SemiBold",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 46,
      tracking: 20,
      backingOffset: 3.4,
      underline: false,
      underlineStrokeWidth: 0.7
    },
    {
      label: "Apple SD Gothic Neo Regular",
      fontName: "AppleSDGothicNeo-Regular",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 46,
      tracking: 40,
      backingOffset: 3.4,
      underline: false,
      underlineStrokeWidth: 0.7
    },
    {
      label: "Apple SD Gothic Neo Medium",
      fontName: "AppleSDGothicNeo-Medium",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 46,
      tracking: 30,
      backingOffset: 3.4,
      underline: false,
      underlineStrokeWidth: 0.7
    },
    {
      label: "Apple SD Gothic Neo Bold",
      fontName: "AppleSDGothicNeo-Bold",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 44,
      tracking: 10,
      backingOffset: 3.4,
      underline: false,
      underlineStrokeWidth: 0.7
    },
    {
      label: "Apple SD Gothic Neo Light",
      fontName: "AppleSDGothicNeo-Light",
      backingColor: [255, 255, 252],
      backingStrokeColor: [218, 216, 210],
      fontSize: 46,
      tracking: 50,
      backingOffset: 3.4,
      underline: false,
      underlineStrokeWidth: 0.7
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

  var nameText = prompt("이름을 입력하세요", "Mina", SCRIPT_TITLE);
  if (nameText === null) return;
  nameText = _trim(nameText);
  if (!nameText) {
    alert("이름이 비어 있습니다.");
    return;
  }

  var fontPresets = _selectFontPresets(nameText);
  var options = _showOptionsDialog(nameText, fontPresets);
  if (!options) return;

  var textFont = _requireFont(options.fontPreset);
  if (!textFont) return;

  var doc = _createDocument();
  var layers = _createLayers(doc);

  _drawNameSticker(doc, layers.printLayer, layers.kissLayer, nameText, options.fontPreset, options.color, textFont);

  alert(
    "완료: 다이컷 스타일 이름 스티커를 새 문서에 생성했습니다.\n" +
    "폰트 후보: " + options.fontPreset.label + "\n" +
    "컬러: " + options.color.name + "\n" +
    "PostScript: " + options.fontPreset.fontName + "\n\n" +
    "저장하지 않았으니 Illustrator에서 검수하세요."
  );


  // ═════════════════════════════════════════════════════════
  //  UI
  // ═════════════════════════════════════════════════════════

  function _showOptionsDialog(nameText, fontPresets) {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 18;
    dlg.spacing = 12;

    var title = dlg.add("statictext", undefined, "Name: " + nameText);
    try { title.graphics.font = ScriptUI.newFont(title.graphics.font.name, "BOLD", 14); } catch (e) {}

    var fontPanel = dlg.add("panel", undefined, "고정 폰트 후보");
    fontPanel.orientation = "column";
    fontPanel.alignChildren = "fill";
    fontPanel.margins = [14, 18, 14, 14];
    var fontDrop = fontPanel.add("dropdownlist");
    fontDrop.preferredSize = [320, 24];
    for (var i = 0; i < fontPresets.length; i++) {
      fontDrop.add("item", fontPresets[i].label);
    }
    fontDrop.selection = 0;

    var colorPanel = dlg.add("panel", undefined, "컬러");
    colorPanel.orientation = "column";
    colorPanel.alignChildren = "fill";
    colorPanel.margins = [14, 18, 14, 14];
    var colorDrop = colorPanel.add("dropdownlist");
    colorDrop.preferredSize = [320, 24];
    for (var c = 0; c < COLOR_PRESETS.length; c++) {
      colorDrop.add("item", COLOR_PRESETS[c].name);
    }
    colorDrop.selection = 0;

    var hint = dlg.add("statictext", undefined, "한글 이름은 한글 후보, 그 외 이름은 영문 후보만 사용합니다. 선택 폰트가 없으면 중단합니다.");
    try { hint.graphics.foregroundColor = hint.graphics.newPen(hint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eHint) {}

    var btnGroup = dlg.add("group");
    btnGroup.alignment = "right";
    btnGroup.spacing = 10;
    btnGroup.add("button", undefined, "취소", { name: "cancel" });
    var okBtn = btnGroup.add("button", undefined, "생성", { name: "ok" });
    okBtn.active = true;

    if (dlg.show() !== 1) return null;

    var fontIndex = fontDrop.selection ? fontDrop.selection.index : 0;
    var colorIndex = colorDrop.selection ? colorDrop.selection.index : 0;

    return {
      fontIndex: fontIndex,
      fontPreset: fontPresets[fontIndex],
      color: COLOR_PRESETS[colorIndex]
    };
  }


  // ═════════════════════════════════════════════════════════
  //  DRAW
  // ═════════════════════════════════════════════════════════

  function _drawNameSticker(doc, printLayer, kissLayer, nameText, fontPreset, colorPreset, textFont) {
    var docW = DOC_W_MM * MM_TO_PT;
    var docH = DOC_H_MM * MM_TO_PT;
    var centerX = docW / 2;
    var centerY = docH / 2;

    var textRgb = colorPreset.rgb;
    var textColor = _rgb(textRgb[0], textRgb[1], textRgb[2]);
    var backingColor = _rgb(fontPreset.backingColor[0], fontPreset.backingColor[1], fontPreset.backingColor[2]);
    var backingStrokeColor = _rgb(fontPreset.backingStrokeColor[0], fontPreset.backingStrokeColor[1], fontPreset.backingStrokeColor[2]);

    doc.activeLayer = printLayer;
    var text = printLayer.textFrames.add();
    text.contents = nameText;
    text.left = 0;
    text.top = 0;

    var attrs = text.textRange.characterAttributes;
    attrs.textFont = textFont;
    attrs.size = fontPreset.fontSize;
    attrs.tracking = fontPreset.tracking;
    attrs.fillColor = textColor;

    _fitTextToBox(text, MAX_TEXT_W_MM * MM_TO_PT, MAX_TEXT_H_MM * MM_TO_PT, fontPreset.fontSize);
    _centerItem(text, centerX, centerY);

    var decorItems = [];
    if (fontPreset.underline) {
      decorItems.push(_drawUnderline(printLayer, text, textColor, fontPreset));
    }

    var outlined = text.createOutline();
    var printItems = [outlined].concat(decorItems);
    var backing = _makeDieCutBacking(doc, printLayer, printItems, fontPreset, backingColor, backingStrokeColor);

    var cutSpot = _ensureCutContour(doc);
    var cutPath = backing.duplicate(kissLayer, ElementPlacement.PLACEATEND);
    _removeContainedSubpaths(cutPath);
    _forceCutContourStroke(cutPath, cutSpot);

    try { backing.zOrder(ZOrderMethod.SENDTOBACK); } catch (eBack) {}
    try { outlined.zOrder(ZOrderMethod.BRINGTOFRONT); } catch (eFront) {}
    for (var i = 0; i < decorItems.length; i++) {
      try { decorItems[i].zOrder(ZOrderMethod.BRINGTOFRONT); } catch (eDecorFront) {}
    }

    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eLayer) {}
    app.activeDocument = doc;
    doc.selection = null;
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
    line.strokeWidth = style.underlineStrokeWidth;
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


  // ═════════════════════════════════════════════════════════
  //  DOCUMENT / FONTS
  // ═════════════════════════════════════════════════════════

  function _createDocument() {
    var preset = new DocumentPreset();
    preset.width = DOC_W_MM * MM_TO_PT;
    preset.height = DOC_H_MM * MM_TO_PT;
    preset.colorMode = DocumentColorSpace.RGB;
    preset.units = RulerUnits.Millimeters;
    var doc = app.documents.addDocument("Art & Illustration", preset);
    doc.artboards[0].artboardRect = [0, DOC_H_MM * MM_TO_PT, DOC_W_MM * MM_TO_PT, 0];
    try {
      var rfx = doc.rasterEffectSettings;
      rfx.colorModel = RasterizationColorModel.DEFAULTCOLORMODEL;
      rfx.resolution = 300;
    } catch (e) {}
    return doc;
  }

  function _createLayers(doc) {
    var printLayer = doc.layers[0];
    printLayer.name = "PrintData";
    var kissLayer = doc.layers.add();
    kissLayer.name = "KissCut";
    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (e) {}
    return { printLayer: printLayer, kissLayer: kissLayer };
  }

  // ═════════════════════════════════════════════════════════
  //  HELPERS
  // ═════════════════════════════════════════════════════════

  function _selectFontPresets(nameText) {
    return _hasHangul(nameText) ? KOREAN_FONT_PRESETS : ENGLISH_FONT_PRESETS;
  }

  function _hasHangul(text) {
    return /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/.test(text);
  }

  function _requireFont(fontPreset) {
    try {
      return app.textFonts.getByName(fontPreset.fontName);
    } catch (e) {
      alert(
        "필수 폰트를 찾을 수 없습니다.\n\n" +
        "선택: " + fontPreset.label + "\n" +
        "PostScript: " + fontPreset.fontName + "\n\n" +
        "자동 대체 없이 중단합니다."
      );
      return null;
    }
  }

  function _centerItem(item, cx, cy) {
    var b = item.geometricBounds;
    var itemCx = (b[0] + b[2]) / 2;
    var itemCy = (b[1] + b[3]) / 2;
    item.translate(cx - itemCx, cy - itemCy);
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

  function _trim(s) {
    return String(s).replace(/^\s+|\s+$/g, "");
  }

})();
