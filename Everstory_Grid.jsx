// Everstory — 템플릿 기반 시트 그리드 배치기 v6 (Phase B+D 통합, offset 미적용)
//
// 템플릿: templates/template_heart.ait
//   info 레이어 안의 a5_border (PathItem) — 그리드 배치 영역 정의
//
// 입력: 02_cutout/ 폴더 안의 페어
//   {base}_clean.psd  (Phase A 산출물 — 누끼 PSD)
//   {base}_sil.png    (Phase A 산출물 — 실루엣 PNG)
//
// 처리: 매 시트마다 .ait를 app.open()으로 열어 새 Untitled 문서 생성
//       PNG → 내부 trace → cutline path (offset/simplify 없음 — 외곽선 그대로)
//       PSD → PrintData(최상위 레이어)에 embed
//       cutline의 PNG-relative 좌표를 PSD bbox에 정규화로 매핑 → KissCut과 PrintData 영역 일치
//       템플릿의 info 레이어는 KissCut과 PrintData 사이에 그대로 유지
//
// 출력: 03_output/{timestamp}_NNmm_sheet{N:02d}.ai
//
// 사용법: File → Scripts → Other Script → Everstory_Grid.jsx

// #target illustrator

(function () {
  "use strict";

  var MM_TO_PT = 2.834645;
  var SAFETY_MM  = 5;     // 안전 여백 (a5_border 안쪽)
  var GAP_MM     = 2;     // 셀 간격

  // ═══ 다이얼로그 ═══════════════════════════════════════════
  var dlg = new Window("dialog", "Everstory A5 시트 배치 v6");
  dlg.orientation = "column";
  dlg.alignChildren = "fill";
  dlg.margins = 20;
  dlg.spacing = 12;

  var sizePanel = dlg.add("panel", undefined, "시트 사이즈 (cm)");
  sizePanel.orientation = "row";
  sizePanel.margins = [15, 20, 15, 15];
  sizePanel.spacing = 15;
  var SIZE_OPTIONS = ["2cm", "3cm", "6cm"];
  var SIZE_VALUES = [20, 30, 60];
  var sizeRadios = [];
  for (var s = 0; s < SIZE_OPTIONS.length; s++) {
    sizeRadios.push(sizePanel.add("radiobutton", undefined, SIZE_OPTIONS[s]));
  }
  sizeRadios[2].value = true; // 60mm 기본

  var policyPanel = dlg.add("panel", undefined, "다중 시트 정책");
  policyPanel.orientation = "column";
  policyPanel.alignChildren = "left";
  policyPanel.margins = [15, 20, 15, 15];
  policyPanel.spacing = 6;
  var policySingle = policyPanel.add("radiobutton", undefined, "한 시트만 (남는 입력 무시)");
  var policyAuto   = policyPanel.add("radiobutton", undefined, "자동 분할 (모든 입력 처리)");
  var policyMaxRow = policyPanel.add("group");
  var policyMax    = policyMaxRow.add("radiobutton", undefined, "최대");
  var maxInput     = policyMaxRow.add("edittext", undefined, "3");
  maxInput.preferredSize = [40, 22];
  policyMaxRow.add("statictext", undefined, "장까지");
  policyAuto.value = true;

  var btnGroup = dlg.add("group");
  btnGroup.alignment = "right";
  btnGroup.spacing = 10;
  btnGroup.add("button", undefined, "취소", { name: "cancel" });
  var okBtn = btnGroup.add("button", undefined, "실행", { name: "ok" });
  okBtn.active = true;

  if (dlg.show() !== 1) return;

  // ═══ 파라미터 ═══
  var sizeMm = 60;
  for (var si = 0; si < sizeRadios.length; si++) {
    if (sizeRadios[si].value) { sizeMm = SIZE_VALUES[si]; break; }
  }
  var policy = policySingle.value ? "single" : (policyAuto.value ? "auto" : "max");
  var maxSheets = parseInt(maxInput.text, 10) || 1;

  // ═══ 입력 폴더 ═══
  var inputFolder = Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!inputFolder) return;

  var pairs = _collectPairs(inputFolder);
  if (pairs.length === 0) {
    alert("선택한 폴더에 _clean.psd + _sil.png 페어가 없습니다.");
    return;
  }

  // ═══ 첫 페어 비율 측정 (셀 크기 결정용) ═══
  var aspect;
  try {
    aspect = _measurePairAspect(pairs[0]);
  } catch (eA) {
    alert("첫 페어 비율 측정 실패: " + (eA && eA.message ? eA.message : eA));
    return;
  }

  // ═══ 템플릿 ═══
  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    alert("template_heart.ait를 찾을 수 없습니다.");
    return;
  }

  var probeDoc = _openTemplateDoc(templateFile);
  var probeBorder, borderBounds;
  try {
    probeBorder = _findInfoBorder(probeDoc);
    borderBounds = probeBorder.geometricBounds;
  } catch (eFB) {
    alert(eFB.message);
    try { probeDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
    return;
  }

  // ═══ 그리드 계산 ═══
  var sizePt   = sizeMm * MM_TO_PT;
  var safetyPt = SAFETY_MM * MM_TO_PT;
  var gapPt    = GAP_MM * MM_TO_PT;

  // 셀 크기: 첫 페어 비율 기반, 긴 변을 sizePt에 맞추고 비율 유지
  var cellWPt, cellHPt;
  if (aspect.w >= aspect.h) {
    cellWPt = sizePt;
    cellHPt = sizePt * (aspect.h / aspect.w);
  } else {
    cellHPt = sizePt;
    cellWPt = sizePt * (aspect.w / aspect.h);
  }

  var bL = borderBounds[0], bT = borderBounds[1], bR = borderBounds[2], bB = borderBounds[3];
  var borderW = bR - bL;
  var borderH = bT - bB;

  var availW = borderW - 2 * safetyPt;
  var availH = borderH - 2 * safetyPt;
  var cols = Math.floor((availW + gapPt) / (cellWPt + gapPt));
  var rows = Math.floor((availH + gapPt) / (cellHPt + gapPt));
  if (cols < 1 || rows < 1) {
    var cwMm = (cellWPt / MM_TO_PT).toFixed(1);
    var chMm = (cellHPt / MM_TO_PT).toFixed(1);
    alert("a5_border 안에 셀(" + cwMm + "×" + chMm + "mm)이 들어가지 않습니다.");
    try { probeDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
    return;
  }
  var perSheet = cols * rows;

  // ═══ 반복 모드: 입력 < perSheet면 한 시트를 cycle해서 꽉 채움 ═══
  var shouldRepeat = pairs.length < perSheet;

  // ═══ 시트 수 결정 ═══
  var sheetCount;
  if (shouldRepeat) {
    sheetCount = 1;
  } else {
    var totalNeeded = Math.ceil(pairs.length / perSheet);
    if (policy === "single")    sheetCount = 1;
    else if (policy === "max")  sheetCount = Math.min(totalNeeded, maxSheets);
    else                        sheetCount = totalNeeded;
  }

  // ═══ 출력 폴더 ═══
  var outFolder = _resolveOutputFolder(inputFolder);

  // ═══ 시트별 처리 ═══
  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

  var ts = _timestamp();
  var savedFiles = [];

  try {
    for (var sIdx = 0; sIdx < sheetCount; sIdx++) {
      var slice;
      if (shouldRepeat) {
        slice = [];
        for (var rIdx = 0; rIdx < perSheet; rIdx++) {
          slice.push(pairs[rIdx % pairs.length]);
        }
      } else {
        var startIdx = sIdx * perSheet;
        var endIdx = Math.min(startIdx + perSheet, pairs.length);
        slice = pairs.slice(startIdx, endIdx);
      }

      var sheetDoc, sheetBorder;
      if (sIdx === 0) {
        sheetDoc = probeDoc;
        sheetBorder = probeBorder;
      } else {
        sheetDoc = _openTemplateDoc(templateFile);
        try {
          sheetBorder = _findInfoBorder(sheetDoc);
        } catch (eFB2) {
          try { sheetDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
          continue;
        }
      }

      var sbb = sheetBorder.geometricBounds;
      var sbL = sbb[0], sbT = sbb[1], sbR = sbb[2], sbB = sbb[3];
      var sbW = sbR - sbL;
      var sbH = sbT - sbB;

      var cutSpot = _ensureCutContour(sheetDoc);
      var printLayer = sheetDoc.layers.add();
      printLayer.name = "PrintData";
      var kissLayer = sheetDoc.layers.add();
      kissLayer.name = "KissCut";

      // 그리드 시작 좌표 (a5_border 안에서 centered)
      var rowWidth = cols * cellWPt + (cols - 1) * gapPt;
      var rowHeight = rows * cellHPt + (rows - 1) * gapPt;
      var startX = sbL + (sbW - rowWidth) / 2;
      var startY = sbT - (sbH - rowHeight) / 2;

      for (var i = 0; i < slice.length; i++) {
        var col = i % cols;
        var row = Math.floor(i / cols);
        var x = startX + col * (cellWPt + gapPt);
        var y = startY - row * (cellHPt + gapPt);

        try {
          _placeSticker(sheetDoc, slice[i], x, y, cellWPt, cellHPt, printLayer, kissLayer, cutSpot);
        } catch (e) {
          // 한 페어 실패해도 나머지 진행
        }
      }

      // KissCut을 위로
      kissLayer.move(sheetDoc, ElementPlacement.PLACEATBEGINNING);
      printLayer.move(sheetDoc, ElementPlacement.PLACEATEND);

      // 저장
      var sheetNum = _pad(sIdx + 1, 2);
      var fileName = ts + "_" + sizeMm + "mm_sheet" + sheetNum + ".ai";
      var saveFile = new File(outFolder.fsName + "/" + fileName);
      _saveAi(sheetDoc, saveFile);
      savedFiles.push(saveFile.fsName);

      // sheetDoc.close(SaveOptions.SAVECHANGES);
    }
  } finally {
    app.userInteractionLevel = prevInteraction;
  }

  var cellWMm = (cellWPt / MM_TO_PT).toFixed(1);
  var cellHMm = (cellHPt / MM_TO_PT).toFixed(1);
  alert(
    "✓ 완료: " + savedFiles.length + "장 저장\n" +
    "템플릿: " + templateFile.name + "\n" +
    "사이즈: " + sizeMm + "mm (셀 " + cellWMm + "×" + cellHMm + "mm)  /  레이아웃: " + cols + "×" + rows + " (" + perSheet + "/시트)\n" +
    "전체 입력: " + pairs.length + "개" + (shouldRepeat ? " (시트 채우기 위해 반복 배치)" : "") + "\n\n" +
    savedFiles.join("\n")
  );


  // ═════════════════════════════════════════════════════════
  //  PLACEMENT — PSD bbox와 cutline을 정확히 정렬
  // ═════════════════════════════════════════════════════════

  function _placeSticker(sheetDoc, pair, x, y, cellWPt, cellHPt, printLayer, kissLayer, cutSpot) {
    try { sheetDoc.selection = null; } catch (eSel) {}

    // 1) clean.psd → PrintData (셀 양 축 fit, 비율 유지)
    var placed = printLayer.placedItems.add();
    placed.file = pair.psd;
    var ratio = Math.min(cellWPt / placed.width, cellHPt / placed.height);
    placed.width  *= ratio;
    placed.height *= ratio;
    placed.left = x + (cellWPt - placed.width) / 2;
    placed.top  = y - (cellHPt - placed.height) / 2;

    // PSD bbox 기록 (cutline 정렬 기준)
    var psdL = placed.left;
    var psdT = placed.top;
    var psdW = placed.width;
    var psdH = placed.height;

    placed.embed();

    // embed 결과가 GroupItem이면 raster 외 PathItem 제거 (PSD 안 saved path 등)
    try {
      var embedded = printLayer.pageItems[0];
      if (embedded && embedded.typename === "GroupItem") {
        _stripPSDPaths(embedded);
      }
    } catch (eStrip) {}

    // 2) sil.png → 임시 doc에서 trace → cutline + PNG-relative 정규화 좌표
    var cutInfo = null;
    var copied = false;

    var tempDoc = _newDocForImage();
    try {
      _traceAndUnite(tempDoc, pair.sil);

      var ar = tempDoc.artboards[0].artboardRect; // [L, T, R, B], y is bottom-up
      var pngW = ar[2] - ar[0];
      var pngH = ar[1] - ar[3];

      var cutline = _findCutline(tempDoc);
      if (cutline) {
        _stripFills(cutline);
        var tempCutSpot = _ensureCutContour(tempDoc);
        _forceCutContourStroke(cutline, tempCutSpot);

        var b = cutline.geometricBounds; // [L, T, R, B] in tempDoc (artboard) coords
        cutInfo = {
          relL: b[0] / pngW,            // left edge as fraction of PNG width
          relT: (pngH - b[1]) / pngH,   // distance from top, normalized
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
    }

    if (!copied || !cutInfo) return;

    // 3) sheet에 paste → PSD bbox 안에 정확히 align
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = kissLayer;
    app.paste();

    var pasted = sheetDoc.selection;
    if (pasted && pasted.length > 0) {
      var item = pasted[0];
      try {
        // 목표 사이즈 = PSD bbox × cutline의 PNG-relative size
        var targetW = cutInfo.relW * psdW;
        var targetH = cutInfo.relH * psdH;

        var nb = item.geometricBounds;
        var nw = nb[2] - nb[0];
        var nh = nb[1] - nb[3];

        var sx = (targetW / nw) * 100;
        var sy = (targetH / nh) * 100;
        item.resize(sx, sy);

        // 위치 = PSD bbox 안 cutline의 정규화 위치
        item.left = psdL + cutInfo.relL * psdW;
        item.top  = psdT - cutInfo.relT * psdH;

        if (item.layer.name !== "KissCut") {
          item.move(kissLayer, ElementPlacement.PLACEATEND);
        }
        _forceCutContourStroke(item, cutSpot);
      } catch (e) {}
    }

    sheetDoc.selection = null;
  }


  // ═════════════════════════════════════════════════════════
  //  TRACE (Phase B 흡수)
  // ═════════════════════════════════════════════════════════

  // Image Trace + Pathfinder Unite → 단일 CompoundPath (이름: Cutline)
  function _traceAndUnite(doc, silFile) {
    var placed = doc.layers[0].placedItems.add();
    placed.file = silFile;
    placed.left = 0;
    placed.top  = placed.height;

    doc.artboards[0].artboardRect = [0, placed.height, placed.width, 0];

    var trace = placed.trace();
    var opts = trace.tracing.tracingOptions;
    try { opts.loadFromPreset("Silhouettes"); } catch (e) {}

    opts.tracingMode      = TracingModeType.TRACINGMODEBLACKANDWHITE;
    opts.tracingMethod    = TracingMethodType.TRACINGMETHODABUTTING;
    opts.threshold        = 230;
    opts.pathFidelity     = 10;
    opts.cornerFidelity   = 10;
    opts.minimumArea      = 250;
    opts.cornerAngle      = 20;
    opts.fills            = true;
    opts.strokes          = false;
    opts.snapCurveToLines = false;
    opts.ignoreWhite      = true;

    trace.tracing.expandTracing();

    app.executeMenuCommand("deselectall");
    app.executeMenuCommand("selectall");
    app.executeMenuCommand("ungroup");
    app.executeMenuCommand("selectall");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");

    var sel = doc.selection;
    if (sel && sel.length > 0) {
      try { sel[0].name = "Cutline"; } catch (e) {}
    }

    doc.layers[0].name = "KissCut";
    app.executeMenuCommand("deselectall");
  }


  // ═════════════════════════════════════════════════════════
  //  HELPERS
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
    preset.width  = 1000;
    preset.height = 1000;
    preset.colorMode = DocumentColorSpace.RGB;
    preset.units = RulerUnits.Millimeters;
    return app.documents.addDocument("Art & Illustration", preset);
  }

  // 첫 페어의 clean.psd를 임시 doc에 add → width/height 측정 → 닫기
  // (실제 PrintData에 배치되는 PSD 기준으로 셀 비율을 잡아야 width=sizeMm으로 정확히 들어감)
  function _measurePairAspect(pair) {
    var probe = _newDocForImage();
    try {
      var p = probe.placedItems.add();
      p.file = pair.psd;
      return { w: p.width, h: p.height };
    } finally {
      try { probe.close(SaveOptions.DONOTSAVECHANGES); } catch (e) {}
    }
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

  function _stripPSDPaths(group) {
    if (group.pathItems) {
      for (var i = group.pathItems.length - 1; i >= 0; i--) {
        try {
          // clipping mask는 raster 투명 영역을 결정하므로 보존
          if (!group.pathItems[i].clipping) group.pathItems[i].remove();
        } catch (e) {}
      }
    }
    if (group.compoundPathItems) {
      for (var j = group.compoundPathItems.length - 1; j >= 0; j--) {
        try { group.compoundPathItems[j].remove(); } catch (e) {}
      }
    }
    if (group.groupItems) {
      for (var g = group.groupItems.length - 1; g >= 0; g--) {
        try { _stripPSDPaths(group.groupItems[g]); } catch (e) {}
      }
    }
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
      if (item.typename === "PathItem") {
        item.filled = false;
      }
    } catch (e) {}
  }

  function _resolveOutputFolder(srcFolder) {
    // 02_cutout → sibling 03_output (평면 — 카테고리 분기 없음)
    var srcName = decodeURIComponent(srcFolder.name);
    if (srcName === "02_cutout") {
      var out = new Folder(srcFolder.parent.fsName + "/03_output");
      if (!out.exists) out.create();
      return out;
    }
    return srcFolder;
  }

  function _saveAi(doc, file) {
    var aiOpts = new IllustratorSaveOptions();
    aiOpts.compatibility = Compatibility.ILLUSTRATOR24;
    aiOpts.pdfCompatible = true;
    aiOpts.embedICCProfile = true;
    doc.saveAs(file, aiOpts);
  }

  function _timestamp() {
    var n = new Date();
    return n.getFullYear() +
           _pad(n.getMonth() + 1, 2) +
           _pad(n.getDate(), 2) + "_" +
           _pad(n.getHours(), 2) +
           _pad(n.getMinutes(), 2) +
           _pad(n.getSeconds(), 2);
  }

  function _pad(n, w) {
    var s = "" + n;
    while (s.length < w) s = "0" + s;
    return s;
  }

})();
