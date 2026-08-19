// ═══════════════════════════════════════════════════════════════
//  Everstory Keepsake 주문 처리 (사진 1장 + 이름 주입)
//
//  template_keepsake_v1.ait 를 열어:
//    1. 02_cutout 페어 (_clean.psd + _sil.png) 1개 선택 + 이름 입력
//    2. info 안의 name_* TextFrame 전체에 이름 주입 (.contents 만 교체 —
//       폰트/사이즈/정렬은 템플릿이 보유)
//    3. _clean.psd 를 photo_slot 에 배치 (contain fit + 상단 정렬 — 사진이
//       슬롯 위부터 채움. 짧은 사진이 아래로 처지는 것 방지)
//    3b. 명패(plaque + plaque_cut)를 사진 하단에 맞춰 위로 이동
//       (plaque_cut 상단 = 사진 하단 - PLAQUE_OVERLAP_MM, 위로만 이동 —
//       긴 사진은 템플릿 기본 위치 유지 → 어떤 사진이든 칼선 연결 보장)
//    4. _sil.png Image Trace → 사진 칼선 → plaque_cut 과 Unite → CutContour
//    5. 03_output/{timestamp}_KEEP_sheet01.ai 자동 저장
//
//  전제: Phase A 는 기존 파이프라인 그대로 (loose BG 는
//  create-asymmetric-loose-photo-background.psjs 로 — 이 시안은 배경색 흰색).
//  칼선 여백은 loose BG 에 이미 베이크되어 있으므로 추가 inset 없음.
//
//  레이어 컨벤션: KissCut → info → PrintData (TemplateGuide 는 여기서 삭제).
//
//  함정 (v1 에서 실측 — 되돌리지 말 것):
//   · paste 셀렉션 참조를 embed 리플로우 이후에 쓰면 stale — TraceStash
//     hidden 보관 후 duplicate 로 fresh 참조 획득 (mixed 와 동일 구조).
//   · Pathfinder 는 stroke-only/paint 없는 패스에서 빈 결과 — union 전
//     _forceTempFill, 합친 후 CutContour 스트로크 복원.
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var SCRIPT_VARIANT = "keepsake v2";
  var SCRIPT_TITLE = "Everstory Keepsake (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var TEMPLATE_NAME = "template_keepsake_v1.ait";
  var NAME_FRAME_RE = /^name(_\d+|_main)$/;
  // 명패가 사진 하단과 겹치는 최소 깊이 (plaque_cut 상단 기준).
  // 긴 사진은 템플릿 기본 위치가 이미 더 깊게 겹치므로 그대로 둔다.
  var PLAQUE_OVERLAP_MM = 12;

  // Package 파일명 토큰 호환 (_collectPairs 재사용 — tier 는 여기선 미사용)
  var TIER_TOKEN_RE = /_(XXL|XL|XS|FAM|S|M|L)$/i;
  var TIER_DEFAULT = "S";

  var testConfig = $.global.__EVERSTORY_KEEPSAKE_TEST__;

  // 초기 에러 — 테스트 모드에선 alert 대신 lastMessage (headless 실행 진단용)
  function _fail(m) {
    if (testConfig) { testConfig.lastMessage = "실패: " + m; }
    else { alert(m); }
  }

  var inputFolder = (testConfig && testConfig.inputFolder) ?
    new Folder(testConfig.inputFolder) :
    Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!inputFolder) return;

  var pairs = _collectPairs(inputFolder);
  if (pairs.length === 0) {
    _fail("선택한 폴더에 _clean.psd + _sil.png 페어가 없습니다.");
    return;
  }

  var defaultName = _deriveDefaultName(inputFolder);
  var options = (testConfig && testConfig.options) ? testConfig.options : _showDialog(pairs, defaultName);
  if (!options) return;
  var pair = pairs[options.pairIndex];

  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    _fail(TEMPLATE_NAME + " 를 찾을 수 없습니다. Everstory_keepsake_template.jsx 를 먼저 실행하세요.");
    return;
  }

  var doc = _openTemplateDoc(templateFile);

  var infoLayer, kissLayer, printLayer, slotPath, plaqueCutPath, plaqueGroup;
  try {
    infoLayer = _layerByName(doc, "info");
    if (!infoLayer) throw new Error("템플릿에 'info' 레이어가 없습니다");
    kissLayer = _layerByName(doc, "KissCut");
    if (!kissLayer) { kissLayer = doc.layers.add(); kissLayer.name = "KissCut"; }
    printLayer = _layerByName(doc, "PrintData");
    if (!printLayer) { printLayer = doc.layers.add(); printLayer.name = "PrintData"; }

    slotPath = _deepFindByName(infoLayer, "photo_slot");
    if (!slotPath) throw new Error("info 레이어 안에 'photo_slot' 이 없습니다");
    plaqueCutPath = _deepFindByName(infoLayer, "plaque_cut");
    if (!plaqueCutPath) throw new Error("info 레이어 안에 'plaque_cut' 이 없습니다");
    plaqueGroup = _deepFindGroupByName(infoLayer, "plaque");
    if (!plaqueGroup) throw new Error("info 레이어 안에 'plaque' 그룹이 없습니다");
  } catch (eTpl) {
    _fail(eTpl.message);
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose0) {}
    return;
  }

  // 가이드 레이어 제거 (인쇄 방지)
  try {
    var guide = _layerByName(doc, "TemplateGuide");
    if (guide) guide.remove();
  } catch (eGuide) {}

  var cutSpot = _ensureCutContour(doc);

  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

  var injectedCount = 0;
  var unionWarn = "";
  var plaqueShiftMm = 0;
  var fatalError = "";

  try {
    // ── 1. 이름 주입 ──────────────────────────────────────────
    injectedCount = _injectNames(infoLayer, options.nameText);
    if (injectedCount === 0) {
      throw new Error("name_* TextFrame 을 찾지 못했습니다 (템플릿 확인 필요)");
    }

    // ── 2. 실루엣 trace → 칼선 캐시 (temp doc → TraceStash hidden 보관,
    //      mixed 의 _buildCutlineCache 와 동일 구조) ──────────────
    // paste 셀렉션 참조를 embed 리플로우 이후에 쓰면 참조가 다른 오브젝트로
    // 미끄러진다 (stale handle) — 반드시 stash 에 hidden 보관 후, embed 가
    // 모두 끝난 다음 duplicate 로 fresh 참조를 얻는다.
    var cutInfo = null;
    var tempDoc = null;
    try {
      tempDoc = _newDocForImage();
      _traceAndUnite(tempDoc, pair.sil);

      var ar = tempDoc.artboards[0].artboardRect;
      var pngW = ar[2] - ar[0];
      var pngH = ar[1] - ar[3];

      var cutline = _findCutline(tempDoc);
      if (!cutline) throw new Error("trace 결과 path 없음");

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
    } finally {
      if (tempDoc) {
        try { tempDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
      }
      _safeRedrawAndGC();
    }

    var stash = doc.layers.add();
    stash.name = "TraceStash";
    app.activeDocument = doc;
    doc.activeLayer = stash;
    doc.selection = null;
    app.paste();
    var pasted = doc.selection;
    if (!pasted || pasted.length === 0) throw new Error("칼선 paste 결과 비어있음");
    var cachedCutline = pasted[0];
    try { cachedCutline.hidden = true; } catch (eHide) {}
    doc.selection = null;

    // ── 3. PSD 배치 (photo_slot contain fit + 상단 정렬) ───────
    // embed 는 DOM 리플로우를 일으키므로 칼선 duplicate 보다 먼저 끝낸다.
    doc.activeLayer = printLayer;
    var placed = printLayer.placedItems.add();
    placed.file = pair.psd;
    var mL = placed.left, mT = placed.top, mW = placed.width, mH = placed.height;
    placed.embed();
    var embG = _stripEmbeddedPSDPathsNear(printLayer, mL, mT, mW, mH);
    if (!embG) throw new Error("embed 그룹을 찾지 못함 (" + pair.base + ")");

    var sb = slotPath.geometricBounds;
    var sL = sb[0], sT = sb[1], sR = sb[2], sB = sb[3];
    var slotW = sR - sL, slotH = sT - sB;

    var gb = embG.geometricBounds;
    var gw = gb[2] - gb[0], gh = gb[1] - gb[3];
    var ratio = Math.min(slotW / gw, slotH / gh);
    embG.resize(ratio * 100, ratio * 100);
    gb = embG.geometricBounds;   // resize 후 실측 (반올림 오차 방지)
    var psdW = gb[2] - gb[0];
    var psdH = gb[1] - gb[3];
    // 상단 정렬 — 사진이 슬롯 위부터 채움. 명패가 아래(3b)에서 사진 하단을
    // 따라 올라오므로 짧은 사진도 칼선 연결이 항상 보장된다.
    embG.left = sL + (slotW - psdW) / 2;
    embG.top = sT;
    var psdL = embG.left;
    var psdT = embG.top;

    // ── 3b. 명패 위치 보정 — plaque_cut 상단 = 사진 하단 - OVERLAP ─
    // 위로만 이동 (긴 사진은 템플릿 기본 위치가 이미 충분히 깊게 겹침).
    var photoBottomY = psdT - psdH;
    var pbNow = plaqueCutPath.geometricBounds;
    var dyPlaque = (photoBottomY + PLAQUE_OVERLAP_MM * MM_TO_PT) - pbNow[1];
    if (dyPlaque > 0) {
      plaqueGroup.translate(0, dyPlaque);
      plaqueCutPath.translate(0, dyPlaque);
      plaqueShiftMm = Math.round(dyPlaque / MM_TO_PT * 10) / 10;
    }

    // ── 4. 칼선 duplicate (embed 완료 후 fresh 참조) + 위치 정합 ─
    doc.activeLayer = kissLayer;
    var photoCut = cachedCutline.duplicate(kissLayer, ElementPlacement.PLACEATBEGINNING);
    try { photoCut.hidden = false; } catch (eShow) {}

    var targetW = cutInfo.relW * psdW;
    var targetH = cutInfo.relH * psdH;
    var nb = photoCut.geometricBounds;
    var nw = nb[2] - nb[0];
    var nh = nb[1] - nb[3];
    if (nw > 0 && nh > 0) {
      photoCut.resize((targetW / nw) * 100, (targetH / nh) * 100);
    }
    photoCut.left = psdL + cutInfo.relL * psdW;
    photoCut.top = psdT - cutInfo.relT * psdH;

    // ── 5. plaque_cut 과 Unite → 최종 사진 칼선 ────────────────
    var pb = plaqueCutPath.geometricBounds;
    var cb = photoCut.geometricBounds;
    if (cb[3] > pb[1]) {
      // AI 좌표: 사진 칼선 하단(cb[3])이 명패 상단(pb[1])보다 위 = 분리
      // (3b 보정으로 정상 경로에선 발생 불가 — 구조 실패 failsafe)
      unionWarn = "사진 칼선이 명패와 겹치지 않습니다 (분리된 컷 2개) — 시각 확인 필수.";
    }

    var plaqueDup = plaqueCutPath.duplicate(kissLayer, ElementPlacement.PLACEATBEGINNING);
    // Pathfinder 는 stroke-only/paint 없는 패스에서 빈 결과를 내므로
    // union 전 임시 fill 을 주고, 합친 뒤 CutContour 스트로크로 되돌린다.
    _forceTempFill(photoCut);
    _forceTempFill(plaqueDup);
    doc.selection = null;
    photoCut.selected = true;
    plaqueDup.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");

    var sel = doc.selection;
    if (!sel || sel.length === 0) throw new Error("칼선 Unite 결과 비어있음");
    var united = sel[0];
    try { united.name = "Cutline_photo"; } catch (eName) {}
    _forceCutContourStroke(united, cutSpot);
    doc.selection = null;

    // ── 6. 사후 검증 — 사진/칼선이 실제로 살아있는지 ───────────
    try { stash.remove(); } catch (eStash) {}
    var embCheck = embG.geometricBounds;   // 참조 죽었으면 throw
    if (embCheck[2] - embCheck[0] <= 0) throw new Error("사진 그룹 손상 (bounds 0)");
    if (printLayer.pageItems.length === 0) {
      throw new Error("PrintData 가 비어있음 — 사진이 union 에 휩쓸림 (stale reference)");
    }
    var unitedCheck = united.geometricBounds;
    if (unitedCheck[2] - unitedCheck[0] <= 0) throw new Error("Cutline_photo 가 빈 그룹 (union 실패)");
  } catch (eMain) {
    fatalError = (eMain && eMain.message) ? eMain.message : String(eMain);
  } finally {
    app.userInteractionLevel = prevInteraction;
  }

  if (fatalError) {
    _fail(fatalError + "\n\n시트는 저장하지 않았습니다. 문서를 확인 후 닫으세요.");
    return;
  }

  // 레이어 z-order 고정: KissCut 최상단, PrintData 최하단
  try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eKiss) {}
  try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (ePrint) {}
  doc.selection = null;

  // ── 03_output 자동 저장 ─────────────────────────────────────
  var savedPath = "", saveError = "";
  try {
    var outFolder = _resolveOutputFolder(inputFolder);
    var fileName = _timestamp() + "_KEEP_sheet01.ai";
    var saveFile = new File(outFolder.fsName + "/" + fileName);
    _saveAi(doc, saveFile);
    savedPath = saveFile.fsName;
  } catch (eSave) {
    saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
  }

  var msg =
    "완료: Keepsake 시트 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + "\n" +
    "사진: " + pair.base + "\n" +
    "이름: " + options.nameText + " (TextFrame " + injectedCount + "개 주입)\n" +
    "사진 칼선: trace + 명패 Unite 완료\n" +
    (plaqueShiftMm > 0 ? "명패 위치: 사진 하단 추적 — 위로 " + plaqueShiftMm + "mm 이동\n" : "명패 위치: 템플릿 기본 (사진이 충분히 김)\n") +
    (unionWarn ? "⚠ " + unionWarn + "\n" : "") +
    (savedPath ? "저장: " + savedPath : "저장 실패: " + saveError) + "\n\n" +
    "QC: ① 사진-칼선 정합 ② 명패-사진 이음새 ③ 이름 라벨 폭 초과 여부 시각 확인";

  if (testConfig) {
    testConfig.lastMessage = msg;
    if (testConfig.closeAfter) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eTestClose) {}
    }
  } else {
    alert(msg);
  }


  // ═════════════════════════════════════════════════════════
  //  이름 주입
  // ═════════════════════════════════════════════════════════

  function _injectNames(container, nameText) {
    var count = 0;
    if (container.textFrames) {
      for (var t = 0; t < container.textFrames.length; t++) {
        var tf = container.textFrames[t];
        if (NAME_FRAME_RE.test(tf.name)) {
          tf.contents = nameText;
          count++;
        }
      }
    }
    if (container.groupItems) {
      for (var g = 0; g < container.groupItems.length; g++) {
        count += _injectNames(container.groupItems[g], nameText);
      }
    }
    return count;
  }


  // ═════════════════════════════════════════════════════════
  //  UI
  // ═════════════════════════════════════════════════════════

  function _showDialog(pairsArg, defName) {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";

    dlg.add("statictext", undefined, "사진 선택 (1장):");
    var listItems = [];
    for (var i = 0; i < pairsArg.length; i++) listItems.push(pairsArg[i].base);
    var list = dlg.add("listbox", undefined, listItems);
    list.preferredSize = [320, Math.min(200, 20 * listItems.length + 24)];
    list.selection = 0;

    dlg.add("statictext", undefined, "이름 (라벨/명패에 인쇄):");
    var nameInput = dlg.add("edittext", undefined, defName);
    nameInput.characters = 24;

    var btns = dlg.add("group");
    btns.alignment = "right";
    btns.add("button", undefined, "취소", { name: "cancel" });
    var okBtn = btns.add("button", undefined, "시트 생성", { name: "ok" });

    var result = null;
    okBtn.onClick = function () {
      if (list.selection === null) { alert("사진을 선택하세요."); return; }
      var nm = String(nameInput.text);
      nm = nm.replace(/^\s+|\s+$/g, "");
      if (!nm) { alert("이름을 입력하세요."); return; }
      result = { pairIndex: list.selection.index, nameText: nm };
      dlg.close();
    };

    dlg.show();
    return result;
  }

  function _deriveDefaultName(folder) {
    // projects/{이름}/02_cutout → {이름}
    try {
      var srcName = decodeURIComponent(folder.name);
      if (srcName === "02_cutout" && folder.parent) {
        return decodeURIComponent(folder.parent.name);
      }
      return srcName;
    } catch (e) {
      return "Harin";
    }
  }


  // ═════════════════════════════════════════════════════════
  //  이하 Everstory_mixed.jsx (v21 unified) 에서 그대로 가져온 헬퍼
  // ═════════════════════════════════════════════════════════

  function _traceAndUnite(traceDoc, silFile) {
    var placed = traceDoc.layers[0].placedItems.add();
    placed.file = silFile;
    placed.left = 0;
    placed.top = placed.height;

    traceDoc.artboards[0].artboardRect = [0, placed.height, placed.width, 0];

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

    var sel = traceDoc.selection;
    if (sel && sel.length > 0) {
      try { sel[0].name = "Cutline"; } catch (eName) {}
    }

    traceDoc.layers[0].name = "KissCut";
    app.executeMenuCommand("deselectall");
  }

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

  function _openTemplateDoc(tplFile) {
    var opened = app.open(tplFile);
    try {
      var rfx = opened.rasterEffectSettings;
      rfx.colorModel = RasterizationColorModel.DEFAULTCOLORMODEL;
      rfx.resolution = 300;
    } catch (e) {}
    return opened;
  }

  function _layerByName(targetDoc, name) {
    for (var i = 0; i < targetDoc.layers.length; i++) {
      if (targetDoc.layers[i].name === name) return targetDoc.layers[i];
    }
    return null;
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

    var out = [];
    for (var i = 0; i < pngFiles.length; i++) {
      var pngName = pngFiles[i].name;
      var psdName = pngName.replace(/_sil\.png$/i, "_clean.psd");
      var psdFile = new File(folder.fsName + "/" + psdName);
      if (psdFile.exists) {
        var nameNoSuffix = pngName.replace(/_sil\.png$/i, "");
        var tierMatch = nameNoSuffix.match(TIER_TOKEN_RE);
        var tier = tierMatch ? tierMatch[1].toUpperCase() : TIER_DEFAULT;
        if (tier === "FAM") tier = "XXL";
        out.push({
          psd: psdFile,
          sil: pngFiles[i],
          base: _decodeName(nameNoSuffix),
          tier: tier
        });
      }
    }
    return out;
  }

  function _decodeName(s) {
    try { return decodeURI(s); } catch (e) { return s; }
  }

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

  function _forceTempFill(item) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) _forceTempFill(item.pageItems[i]);
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) _forceTempFill(item.pathItems[j]);
        return;
      }
      if (item.typename === "PathItem") {
        var black = new RGBColor();
        black.red = 0; black.green = 0; black.blue = 0;
        item.stroked = false;
        item.filled = true;
        item.fillColor = black;
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

  function _findCutline(targetDoc) {
    return _deepFindByName(targetDoc, "Cutline")
        || _deepFindByName(targetDoc, "CutPath")
        || _deepFindFirstPath(targetDoc);
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

  function _deepFindGroupByName(container, name) {
    if (container.groupItems) {
      for (var g = 0; g < container.groupItems.length; g++) {
        if (container.groupItems[g].name === name) return container.groupItems[g];
        var found = _deepFindGroupByName(container.groupItems[g], name);
        if (found) return found;
      }
    }
    if (container.layers) {
      for (var L = 0; L < container.layers.length; L++) {
        var foundL = _deepFindGroupByName(container.layers[L], name);
        if (foundL) return foundL;
      }
    }
    return null;
  }

  function _ensureCutContour(targetDoc) {
    var spot;
    try {
      spot = targetDoc.spots.getByName("CutContour");
    } catch (e) {
      spot = targetDoc.spots.add();
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

  function _forceCutContourStroke(item, spotColor) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
          _forceCutContourStroke(item.pageItems[i], spotColor);
        }
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
          _forceCutContourStroke(item.pathItems[j], spotColor);
        }
        return;
      }
      if (item.typename === "PathItem") {
        item.filled = false;
        item.stroked = true;
        item.strokeColor = spotColor;
        item.strokeWidth = 0.25;
      }
    } catch (e) {}
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
