// Everstory — 템플릿 기반 시트 배치기 (v8, filename size + cut inset + bin packing)
//
// 템플릿: templates/template_heart.ait
//   info 레이어 안의 a5_border (PathItem) — 배치 가능 영역 정의
//   배너 (브랜드명 + QR 등) 는 a5_border 외부에 별도 디자인 (스크립트 영향 없음)
//
// 입력: 02_cutout/ 폴더 안의 페어
//   {base}_clean.psd  — 누끼 PSD
//   {base}_sil.png    — 실루엣 PNG
//
// 처리:
//   1. 페어별 sil.png aspect 측정 → 셀 W×H (긴 변 = 기본 size 또는 파일명 _NNmm)
//   2. 파일명 _NNmm 이 있으면 페어별 크기로 override
//   3. MaxRects + BSSF bin packing 으로 시트 안에 가변 크기 셀 배치
//   4. 셀 단위로 선택한 칼선 여백만큼 PSD fit 영역 축소 + sil.png trace → KissCut 정합
//   5. 한 시트 leftover 는 다음 시트로 이월 (정책 상한까지)
//
// 출력: 03_output/{timestamp}_NNmm_sheet{N:02d}.ai
//
// 사용법: File → Scripts → Other Script → Everstory_Grid.jsx

// #target illustrator

(function () {
  "use strict";

  var MM_TO_PT = 2.834645;
  var SAFETY_MM  = 3;     // 안전 여백 (a5_border 안쪽)
  var GAP_MM     = 2;     // 셀 간격

  // ═══ 다이얼로그 ═══════════════════════════════════════════
  var dlg = new Window("dialog", "Everstory A5 시트 배치 v8");
  dlg.orientation = "column";
  dlg.alignChildren = "fill";
  dlg.margins = 20;
  dlg.spacing = 12;

  var sizePanel = dlg.add("panel", undefined, "기본 스티커 긴 변 (cm)");
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

  var cutMarginPanel = dlg.add("panel", undefined, "칼선 여백");
  cutMarginPanel.orientation = "row";
  cutMarginPanel.margins = [15, 20, 15, 15];
  cutMarginPanel.spacing = 15;
  var CUT_MARGIN_OPTIONS = ["1mm", "2mm"];
  var CUT_MARGIN_VALUES = [1, 2];
  var cutMarginRadios = [];
  for (var cm = 0; cm < CUT_MARGIN_OPTIONS.length; cm++) {
    cutMarginRadios.push(cutMarginPanel.add("radiobutton", undefined, CUT_MARGIN_OPTIONS[cm]));
  }
  cutMarginRadios[0].value = true; // 1mm 기본

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

  var optsPanel = dlg.add("panel", undefined, "옵션");
  optsPanel.orientation = "column";
  optsPanel.alignChildren = "left";
  optsPanel.margins = [15, 20, 15, 15];
  optsPanel.spacing = 6;
  var autoCloseCheck = optsPanel.add("checkbox", undefined, "저장 후 시트 자동 닫기 (검수 시 OFF)");
  autoCloseCheck.value = false;

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
  var cutMarginMm = 1;
  for (var cmi = 0; cmi < cutMarginRadios.length; cmi++) {
    if (cutMarginRadios[cmi].value) { cutMarginMm = CUT_MARGIN_VALUES[cmi]; break; }
  }
  var policy = policySingle.value ? "single" : (policyAuto.value ? "auto" : "max");
  var maxSheets = parseInt(maxInput.text, 10) || 1;
  var autoClose = autoCloseCheck.value;

  // ═══ 입력 폴더 ═══
  var inputFolder = Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!inputFolder) return;

  var pairs = _collectPairs(inputFolder);
  if (pairs.length === 0) {
    alert("선택한 폴더에 _clean.psd + _sil.png 페어가 없습니다.");
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

  // ═══ 단위 변환 ═══
  var safetyPt = SAFETY_MM * MM_TO_PT;
  var gapPt    = GAP_MM * MM_TO_PT;
  var cutMarginPt = cutMarginMm * MM_TO_PT;

  // ═══ Bin (a5_border 안 사용 가능 영역) ═══
  var bL = borderBounds[0], bT = borderBounds[1], bR = borderBounds[2], bB = borderBounds[3];
  var binW = (bR - bL) - 2 * safetyPt;
  var binH = (bT - bB) - 2 * safetyPt;

  if (binW <= 0 || binH <= 0) {
    alert("a5_border 영역이 안전 여백보다 작습니다.");
    try { probeDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
    return;
  }

  // ═══ 페어별 aspect 측정 + 셀 사이즈 계산 (긴 변 = 기본 size 또는 파일명 _NNmm) ═══
  var totalArea = 0;
  var anyTooBig = false;
  var hasCustomSize = false;
  for (var pi = 0; pi < pairs.length; pi++) {
    try {
      _measurePairAspect(pairs[pi]);
    } catch (eAsp) {
      pairs[pi].aspect = 1;
    }
    pairs[pi].sizeMm = _resolvePairSizeMm(pairs[pi], sizeMm);
    if (pairs[pi].sizeMm !== sizeMm) hasCustomSize = true;
    var pairSizePt = pairs[pi].sizeMm * MM_TO_PT;
    if (pairs[pi].aspect >= 1) {
      pairs[pi].cellW = pairSizePt;
      pairs[pi].cellH = pairSizePt / pairs[pi].aspect;
    } else {
      pairs[pi].cellW = pairSizePt * pairs[pi].aspect;
      pairs[pi].cellH = pairSizePt;
    }
    totalArea += pairs[pi].cellW * pairs[pi].cellH;
    if (pairs[pi].cellW > binW || pairs[pi].cellH > binH) anyTooBig = true;
  }

  if (anyTooBig) {
    alert("일부 셀이 a5_border 안 사용 가능 영역(" +
          (binW / MM_TO_PT).toFixed(1) + "×" + (binH / MM_TO_PT).toFixed(1) +
          "mm)보다 큽니다. 사이즈를 줄이세요.");
    try { probeDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
    return;
  }

  // ═══ 반복 모드: 입력 area < bin area * 0.6 이면 원본 배치 후 cycling 으로 채움 ═══
  var binArea = binW * binH;
  var shouldRepeat = totalArea < binArea * 0.6;

  // ═══ 작업 큐 빌드: 원본 페어는 항상 먼저 한 번씩 사용 ═══
  var queue = [];
  var primaryPairs = _sortedPairsByArea(pairs, false);
  for (var pi2 = 0; pi2 < primaryPairs.length; pi2++) queue.push(primaryPairs[pi2]);

  // ═══ 시트 수 상한 ═══
  var maxSheetCap;
  if (policy === "single")       maxSheetCap = 1;
  else if (policy === "max")     maxSheetCap = maxSheets;
  else                           maxSheetCap = 9999;

  // ═══ 출력 폴더 ═══
  var outFolder = _resolveOutputFolder(inputFolder);

  // ═══ 시트별 처리 ═══
  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

  var ts = _timestamp();
  var savedFiles = [];
  var failedItems = [];
  var sheetCount = 0;
  var firstSheetPlacedCount = 0;

  try {
    while (queue.length > 0 && sheetCount < maxSheetCap) {
      var sheetDoc, sheetBorder;
      if (sheetCount === 0) {
        sheetDoc = probeDoc;
        sheetBorder = probeBorder;
      } else {
        sheetDoc = _openTemplateDoc(templateFile);
        try {
          sheetBorder = _findInfoBorder(sheetDoc);
        } catch (eFB2) {
          try { sheetDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
          break;
        }
      }

      var sbb = sheetBorder.geometricBounds;
      var sbL = sbb[0], sbT = sbb[1], sbR = sbb[2], sbB = sbb[3];
      var sheetBinW = (sbR - sbL) - 2 * safetyPt;
      var sheetBinH = (sbT - sbB) - 2 * safetyPt;

      // 이번 시트 pack
      var packItems = [];
      for (var qi = 0; qi < queue.length; qi++) {
        packItems.push({ w: queue[qi].cellW, h: queue[qi].cellH, payload: queue[qi] });
      }
      var packResult = _binPack(packItems, sheetBinW, sheetBinH, gapPt);

      if (packResult.placed.length === 0) {
        try { sheetDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
        break;
      }

      // 원본 페어가 모두 들어간 마지막 시트만 남는 공간을 반복 샘플로 채움.
      // 반복 샘플은 작은 것부터 시도해서 큰 샘플 몇 개가 시트를 독점하지 않게 한다.
      if (shouldRepeat && packResult.leftover.length === 0) {
        var fillerItems = _buildRepeatFillItems(pairs, sheetBinW * sheetBinH, totalArea);
        if (fillerItems.length > 0 && packResult.freeRects && packResult.freeRects.length > 0) {
          var fillerResult = _binPack(fillerItems, sheetBinW, sheetBinH, gapPt, packResult.freeRects);
          for (var fp = 0; fp < fillerResult.placed.length; fp++) {
            packResult.placed.push(fillerResult.placed[fp]);
          }
        }
      }

      _centerPlacedItems(packResult.placed, sheetBinW, sheetBinH);

      var cutSpot = _ensureCutContour(sheetDoc);
      var printLayer = sheetDoc.layers.add();
      printLayer.name = "PrintData";
      var kissLayer = sheetDoc.layers.add();
      kissLayer.name = "KissCut";

      for (var p = 0; p < packResult.placed.length; p++) {
        var pl = packResult.placed[p];
        // bin 좌표 (top-left, y down) → AI 좌표 (y up, top 이 큰 값)
        var aiX = sbL + safetyPt + pl.x;
        var aiY = sbT - safetyPt - pl.y;

        try {
          _placeSticker(sheetDoc, pl.payload, aiX, aiY, pl.w, pl.h, cutMarginPt, printLayer, kissLayer, cutSpot);
        } catch (e) {
          failedItems.push({
            sheet: sheetCount + 1,
            base: pl.payload.base,
            error: (e && e.message) ? e.message : String(e)
          });
        }
      }

      // KissCut을 위로
      kissLayer.move(sheetDoc, ElementPlacement.PLACEATBEGINNING);
      printLayer.move(sheetDoc, ElementPlacement.PLACEATEND);

      // 저장
      var sheetNum = _pad(sheetCount + 1, 2);
      var fileName = ts + "_" + sizeMm + "mm_sheet" + sheetNum + ".ai";
      var saveFile = new File(outFolder.fsName + "/" + fileName);
      _saveAi(sheetDoc, saveFile);
      savedFiles.push(saveFile.fsName);

      if (autoClose) {
        try { sheetDoc.close(SaveOptions.SAVECHANGES); } catch (eC) {}
      }

      if (sheetCount === 0) firstSheetPlacedCount = packResult.placed.length;

      // 다음 시트로 leftover 이월
      var newQueue = [];
      for (var li = 0; li < packResult.leftover.length; li++) {
        newQueue.push(packResult.leftover[li].payload);
      }
      queue = newQueue;

      sheetCount++;
    }
  } finally {
    app.userInteractionLevel = prevInteraction;
  }

  var binWMm = (binW / MM_TO_PT).toFixed(1);
  var binHMm = (binH / MM_TO_PT).toFixed(1);

  var msg =
    "✓ 완료: " + savedFiles.length + "장 저장\n" +
    "템플릿: " + templateFile.name + "\n" +
    "기본 사이즈: " + sizeMm + "mm (긴 변 기준)" + (hasCustomSize ? " / 파일명 mm값 반영" : "") +
    "  /  칼선 여백: " + cutMarginMm + "mm  /  bin: " + binWMm + "×" + binHMm + "mm  /  첫 시트 배치: " + firstSheetPlacedCount + "개\n" +
    "전체 입력: " + pairs.length + "개" + (shouldRepeat ? " (원본 우선 + cycling 채움)" : "") + "\n";

  if (failedItems.length > 0) {
    msg += "\n⚠ 실패 " + failedItems.length + "건:\n";
    for (var fi = 0; fi < failedItems.length; fi++) {
      var f = failedItems[fi];
      msg += "  · sheet" + _pad(f.sheet, 2) + " / " + f.base + ": " + f.error + "\n";
    }
  }

  msg += "\n" + savedFiles.join("\n");
  alert(msg);


  // ═════════════════════════════════════════════════════════
  //  PLACEMENT — PSD bbox와 cutline을 정확히 정렬
  // ═════════════════════════════════════════════════════════

  function _placeSticker(sheetDoc, pair, x, y, cellWPt, cellHPt, cutMarginPt, printLayer, kissLayer, cutSpot) {
    try { sheetDoc.selection = null; } catch (eSel) {}

    // 1) clean.psd → PrintData (칼선 여백만큼 안쪽 fit, 비율 유지)
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
    placed.width  *= ratio;
    placed.height *= ratio;
    placed.left = artX + (artW - placed.width) / 2;
    placed.top  = artY - (artH - placed.height) / 2;

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

    if (!copied || !cutInfo) {
      throw new Error("trace 결과 path 없음 (sil.png 비었거나 threshold 부적합)");
    }

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

  function _resolvePairSizeMm(pair, defaultSizeMm) {
    var m = pair.base.match(/(^|[_ -])([0-9]+(\.[0-9]+)?)mm($|[_ -])/i);
    if (m && m[2]) {
      var parsed = parseFloat(m[2]);
      if (parsed > 0) return parsed;
    }
    return defaultSizeMm;
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

  function _centerPlacedItems(placed, binW, binH) {
    if (!placed || placed.length === 0) return;

    var minX = placed[0].x;
    var minY = placed[0].y;
    var maxX = placed[0].x + placed[0].w;
    var maxY = placed[0].y + placed[0].h;

    for (var i = 1; i < placed.length; i++) {
      if (placed[i].x < minX) minX = placed[i].x;
      if (placed[i].y < minY) minY = placed[i].y;
      if (placed[i].x + placed[i].w > maxX) maxX = placed[i].x + placed[i].w;
      if (placed[i].y + placed[i].h > maxY) maxY = placed[i].y + placed[i].h;
    }

    var usedW = maxX - minX;
    var usedH = maxY - minY;
    var dx = (binW - usedW) / 2 - minX;
    var dy = (binH - usedH) / 2 - minY;

    for (var j = 0; j < placed.length; j++) {
      placed[j].x += dx;
      placed[j].y += dy;
    }
  }


  // ═════════════════════════════════════════════════════════
  //  MEASURE — 페어별 sil.png aspect 1회 측정 후 캐시
  // ═════════════════════════════════════════════════════════

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


  // ═════════════════════════════════════════════════════════
  //  BIN PACKING — MaxRects + Best Short-Side Fit (BSSF)
  //  좌표계: top-left 원점, y 가 아래로 증가 (호출측에서 AI 좌표로 변환)
  //  회전 비활성 (스티커 방향 고정)
  // ═════════════════════════════════════════════════════════

  function _binPack(items, binW, binH, gap, startFreeRects) {
    var freeRects = startFreeRects ? _cloneRects(startFreeRects) : [{ x: 0, y: 0, w: binW, h: binH }];
    var placed = [];
    var leftover = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      // gap 은 item 의 우/하단에 reserve (다음 item 과의 간격)
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
      placed.push({
        x: chosen.x,
        y: chosen.y,
        w: item.w,
        h: item.h,
        payload: item.payload
      });

      var used = { x: chosen.x, y: chosen.y, w: w, h: h };

      // 모든 free rect 를 used 와 분할
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
    // 교차하지 않으면 그대로
    if (used.x >= fr.x + fr.w || used.x + used.w <= fr.x ||
        used.y >= fr.y + fr.h || used.y + used.h <= fr.y) {
      return [fr];
    }
    var result = [];
    // 위쪽
    if (used.y > fr.y && used.y < fr.y + fr.h) {
      result.push({ x: fr.x, y: fr.y, w: fr.w, h: used.y - fr.y });
    }
    // 아래쪽
    if (used.y + used.h < fr.y + fr.h) {
      result.push({ x: fr.x, y: used.y + used.h, w: fr.w, h: (fr.y + fr.h) - (used.y + used.h) });
    }
    // 왼쪽
    if (used.x > fr.x && used.x < fr.x + fr.w) {
      result.push({ x: fr.x, y: fr.y, w: used.x - fr.x, h: fr.h });
    }
    // 오른쪽
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

})();
