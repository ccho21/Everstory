// Everstory — Illustrator 포토스트립 템플릿 생성기 (v2)
//
// 목적:
//   templates/template_4cut.ait 의 Info > a5_border 를 기준으로
//   Frame 레이어 안에 좌우 2장짜리 포토스트립 프레임과 slot_01..slot_N 을 생성하고
//   KissCut 레이어에 사각 칼선을 생성한다.
//
// 기본 규칙:
//   Info > a5_border = A5 148 x 210mm
//   Frame 내용은 a5_border 안에서 상/좌/우 3mm / 하 15mm margin 안에 생성
//   좌우 스티커 사이 gap = 4mm
//   프레임 보더 = 3mm
//   각 스티커 KissCut = 스티커 외곽에서 -1mm inset
//
// 사용법: File → Scripts → Other Script → Everstory_TemplateBuilder.jsx

// #target illustrator

(function () {
  "use strict";

  var MM_TO_PT = 2.834645;
  var A5_W_MM = 148;
  var A5_H_MM = 210;
  var MARGIN_L_MM = 3;
  var MARGIN_R_MM = 3;
  var MARGIN_T_MM = 3;
  var MARGIN_B_MM = 15;
  var COLUMN_GAP_MM = 4;
  var CUT_INSET_MM = 1;
  var FRAME_LINE_MM = 3;
  var BANNER_H_MM = 18;
  var TEMPLATE_NAME = "template_4cut.ait";

  var presets = [
    { label: "1열 x 2행, 좌우 2장", rows: 2 },
    { label: "1열 x 3행, 좌우 2장", rows: 3 },
    { label: "1열 x 4행, 좌우 2장", rows: 4 }
  ];

  var dlg = new Window("dialog", "Everstory 포토스트립 템플릿 생성 v2");
  dlg.orientation = "column";
  dlg.alignChildren = "fill";
  dlg.margins = 20;
  dlg.spacing = 12;

  var presetPanel = dlg.add("panel", undefined, "레이아웃");
  presetPanel.orientation = "column";
  presetPanel.alignChildren = "left";
  presetPanel.margins = [15, 20, 15, 15];
  presetPanel.spacing = 6;

  var radios = [];
  for (var p = 0; p < presets.length; p++) {
    radios.push(presetPanel.add("radiobutton", undefined, presets[p].label));
  }
  radios[2].value = true;

  var note = dlg.add("statictext", undefined, "Info > a5_border 를 기준으로 Frame 안에 프레임/slot 을 재생성합니다.");
  note.alignment = "left";

  var btnGroup = dlg.add("group");
  btnGroup.alignment = "right";
  btnGroup.spacing = 10;
  btnGroup.add("button", undefined, "취소", { name: "cancel" });
  var okBtn = btnGroup.add("button", undefined, "생성", { name: "ok" });
  okBtn.active = true;

  if (dlg.show() !== 1) return;

  var preset = presets[2];
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].value) {
      preset = presets[i];
      break;
    }
  }

  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    alert(TEMPLATE_NAME + " 를 찾을 수 없습니다.");
    return;
  }

  var doc = _openTemplateDoc(templateFile);
  var infoLayer = _findLayerByName(doc.layers, "Info");
  if (!infoLayer) {
    alert("template_4cut.ait 에 Info 레이어가 없습니다. Info > a5_border 가 필요합니다.");
    return;
  }

  var border = _findNamedItem(infoLayer, "a5_border");
  if (!border) {
    alert("Info 레이어 안에 a5_border PathItem 이 없습니다.");
    return;
  }

  var borderSize = _boundsSizeMm(border.geometricBounds);
  if (Math.abs(borderSize.w - A5_W_MM) > 1 || Math.abs(borderSize.h - A5_H_MM) > 1) {
    alert("Info > a5_border 크기가 A5 148x210mm 가 아닙니다.\n현재: " + _formatMm(borderSize.w) + "x" + _formatMm(borderSize.h) + "mm");
    return;
  }

  _removeLayerIfExists(doc, "PrintData");
  _removeLayerIfExists(doc, "Frame");
  _removeLayerIfExists(doc, "KissCut");
  _removeNamedItems(doc, /^slot_[0-9]+$/i);

  var frameLayer = doc.layers.add();
  frameLayer.name = "Frame";
  var kissLayer = doc.layers.add();
  kissLayer.name = "KissCut";

  var frameBounds = _innerBounds(border.geometricBounds, MARGIN_L_MM, MARGIN_T_MM, MARGIN_R_MM, MARGIN_B_MM);

  _buildTemplate(doc, frameLayer, kissLayer, frameBounds, preset);

  var msg =
    "✓ template_4cut 프레임 생성 완료\n\n" +
    "레이아웃: " + preset.label + "\n" +
    "slot 수: " + (preset.rows * 2) + "개\n" +
    "Info > a5_border: " + _formatMm(borderSize.w) + "x" + _formatMm(borderSize.h) + "mm\n" +
    "Frame margin: 상/좌/우 " + MARGIN_T_MM + "mm, 하 " + MARGIN_B_MM + "mm\n" +
    "프레임 보더: " + FRAME_LINE_MM + "mm\n" +
    "중앙 gap: " + COLUMN_GAP_MM + "mm\n" +
    "KissCut inset: -" + CUT_INSET_MM + "mm\n\n" +
    "검수 후 template_4cut.ait 를 저장하세요.";
  alert(msg);


  // ═════════════════════════════════════════════════════════
  //  BUILD
  // ═════════════════════════════════════════════════════════

  function _buildTemplate(doc, frameLayer, kissLayer, frameBounds, preset) {
    var black = _black();
    var cutSpot = _ensureCutContour(doc);

    var bL = frameBounds[0], bT = frameBounds[1], bR = frameBounds[2], bB = frameBounds[3];
    var borderW = bR - bL;
    var borderH = bT - bB;
    var gap = _pt(COLUMN_GAP_MM);
    var stickerW = (borderW - gap) / 2;
    var stickerH = borderH;
    var stickerT = bT;

    var slotIndex = 1;
    for (var col = 0; col < 2; col++) {
      var stickerL = bL + col * (stickerW + gap);
      _buildOneStrip(frameLayer, kissLayer, stickerL, stickerT, stickerW, stickerH, preset.rows, slotIndex, black, cutSpot);
      slotIndex += preset.rows;
    }
  }

  function _buildOneStrip(frameLayer, kissLayer, x, top, w, h, rows, startSlotIndex, black, cutSpot) {
    var t = _pt(FRAME_LINE_MM);
    var bannerH = _pt(BANNER_H_MM);
    if (h - bannerH - t <= 0) bannerH = 0;

    var photoTop = top - t;
    var photoBottom = bannerH > 0 ? top - (h - bannerH) : top - h + t;
    var photoH = photoTop - photoBottom;
    var photoW = w - 2 * t;
    var slotW = photoW;
    var slotH = (photoH - (rows - 1) * t) / rows;

    _rect(frameLayer, x, top, w, t, black, "frame_top");
    _rect(frameLayer, x, top, t, h, black, "frame_left");
    _rect(frameLayer, x + w - t, top, t, h, black, "frame_right");
    if (bannerH > 0) {
      _rect(frameLayer, x, top - (h - bannerH), w, bannerH, black, "banner_bottom");
    } else {
      _rect(frameLayer, x, top - h + t, w, t, black, "frame_bottom");
    }

    for (var r = 1; r < rows; r++) {
      var divTop = photoTop - r * slotH - (r - 1) * t;
      _rect(frameLayer, x + t, divTop, photoW, t, black, "divider_h_" + _pad(startSlotIndex + r - 1, 2));
    }

    for (var row = 0; row < rows; row++) {
      var slotL = x + t;
      var slotT = photoTop - row * (slotH + t);
      var slot = frameLayer.pathItems.rectangle(slotT, slotL, slotW, slotH);
      slot.name = "slot_" + _pad(startSlotIndex + row, 2);
      slot.filled = false;
      slot.stroked = false;
    }

    var inset = _pt(CUT_INSET_MM);
    var cut = kissLayer.pathItems.rectangle(top - inset, x + inset, w - 2 * inset, h - 2 * inset);
    cut.name = "KissCut_" + _pad(Math.ceil(startSlotIndex / rows), 2);
    cut.filled = false;
    cut.stroked = true;
    cut.strokeColor = cutSpot;
    cut.strokeWidth = 0.25;
  }


  // ═════════════════════════════════════════════════════════
  //  TEMPLATE HELPERS
  // ═════════════════════════════════════════════════════════

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

  function _removeLayerIfExists(container, name) {
    if (!container.layers) return;
    for (var i = container.layers.length - 1; i >= 0; i--) {
      _removeLayerIfExists(container.layers[i], name);
      if (container.layers[i].name === name) {
        try { container.layers[i].remove(); } catch (e) {}
      }
    }
  }

  function _removeNamedItems(container, pattern) {
    if (container.pathItems) {
      for (var i = container.pathItems.length - 1; i >= 0; i--) {
        if (pattern.test(container.pathItems[i].name)) {
          try { container.pathItems[i].remove(); } catch (e1) {}
        }
      }
    }
    if (container.compoundPathItems) {
      for (var j = container.compoundPathItems.length - 1; j >= 0; j--) {
        if (pattern.test(container.compoundPathItems[j].name)) {
          try { container.compoundPathItems[j].remove(); } catch (e2) {}
        }
      }
    }
    if (container.groupItems) {
      for (var g = container.groupItems.length - 1; g >= 0; g--) _removeNamedItems(container.groupItems[g], pattern);
    }
    if (container.layers) {
      for (var L = container.layers.length - 1; L >= 0; L--) _removeNamedItems(container.layers[L], pattern);
    }
  }

  function _findLayerByName(layers, name) {
    if (!layers) return null;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].name.toLowerCase() === name.toLowerCase()) return layers[i];
      var nested = _findLayerByName(layers[i].layers, name);
      if (nested) return nested;
    }
    return null;
  }

  function _findNamedItem(container, name) {
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
        var foundG = _findNamedItem(container.groupItems[g], name);
        if (foundG) return foundG;
      }
    }
    if (container.layers) {
      for (var L = 0; L < container.layers.length; L++) {
        var foundL = _findNamedItem(container.layers[L], name);
        if (foundL) return foundL;
      }
    }
    return null;
  }

  function _boundsSizeMm(bounds) {
    return {
      w: Math.abs(bounds[2] - bounds[0]) / MM_TO_PT,
      h: Math.abs(bounds[1] - bounds[3]) / MM_TO_PT
    };
  }

  function _innerBounds(bounds, leftMm, topMm, rightMm, bottomMm) {
    return [
      bounds[0] + _pt(leftMm),
      bounds[1] - _pt(topMm),
      bounds[2] - _pt(rightMm),
      bounds[3] + _pt(bottomMm)
    ];
  }


  // ═════════════════════════════════════════════════════════
  //  DRAWING HELPERS
  // ═════════════════════════════════════════════════════════

  function _rect(layer, left, top, width, height, fillColor, name) {
    var item = layer.pathItems.rectangle(top, left, width, height);
    item.name = name;
    item.filled = true;
    item.fillColor = fillColor;
    item.stroked = false;
    return item;
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

  function _black() {
    var c = new CMYKColor();
    c.cyan = 0;
    c.magenta = 0;
    c.yellow = 0;
    c.black = 100;
    return c;
  }

  function _pt(mm) {
    return mm * MM_TO_PT;
  }

  function _pad(n, w) {
    var s = "" + n;
    while (s.length < w) s = "0" + s;
    return s;
  }

  function _formatMm(mm) {
    return (Math.round(mm * 10) / 10).toString();
  }
})();
