// Everstory — 포토스트립 / 인생네컷 슬롯 배치기 (v1)
//
// 템플릿: templates/template_4cut.ait
//   Frame 레이어 안의 slot_01, slot_02, ... PathItem — 사진이 들어갈 고정 슬롯
//   프레임/브랜드/QR/외곽 칼선은 템플릿에서 직접 디자인
//
// 입력: 선택 폴더 안의 이미지/PSD 파일
//   02_cutout 폴더에서는 *_clean.psd 를 우선 사용하고 *_sil.png 는 제외
//   그 외 폴더에서는 psd/png/jpg/jpeg/tif/tiff/heic 파일을 이름순으로 사용
//
// 처리:
//   1. 템플릿에서 slot_01..slot_N 수집
//   2. 입력 이미지를 슬롯 수 단위로 나눠 매 strip마다 새 .ait 열기
//      마지막 strip 또는 사진 수가 부족한 경우 같은 strip 안의 사진을 cycling 해서 모든 slot을 채움
//   3. 각 이미지를 slot bounds 에 cover-fit + clipping mask 처리
//   4. PrintData 레이어를 템플릿 디자인 아래로 보내고 .ai 저장
//
// 출력: 03_output/{timestamp}_photostrip{N:02d}.ai
//
// 사용법: File → Scripts → Other Script → Everstory_PhotoStrip.jsx

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_TITLE = "Everstory 포토스트립 배치 v1";
  var TEMPLATE_NAME = "template_4cut.ait";

  // ═══ 다이얼로그 ═══════════════════════════════════════════
  var dlg = new Window("dialog", SCRIPT_TITLE);
  dlg.orientation = "column";
  dlg.alignChildren = "fill";
  dlg.margins = 20;
  dlg.spacing = 12;

  var info = dlg.add("statictext", undefined, "template_4cut.ait 의 Frame > slot_01..slot_N 에 사진을 순서대로 배치합니다.");
  info.alignment = "left";

  var optsPanel = dlg.add("panel", undefined, "옵션");
  optsPanel.orientation = "column";
  optsPanel.alignChildren = "left";
  optsPanel.margins = [15, 20, 15, 15];
  optsPanel.spacing = 6;
  var autoCloseCheck = optsPanel.add("checkbox", undefined, "저장 후 문서 자동 닫기 (검수 시 OFF)");
  autoCloseCheck.value = false;

  var btnGroup = dlg.add("group");
  btnGroup.alignment = "right";
  btnGroup.spacing = 10;
  btnGroup.add("button", undefined, "취소", { name: "cancel" });
  var okBtn = btnGroup.add("button", undefined, "실행", { name: "ok" });
  okBtn.active = true;

  if (dlg.show() !== 1) return;
  var autoClose = autoCloseCheck.value;

  // ═══ 입력 폴더 ═══
  var inputFolder = Folder.selectDialog("포토스트립에 넣을 이미지/PSD 폴더 선택");
  if (!inputFolder) return;

  var images = _collectImages(inputFolder);
  if (images.length === 0) {
    alert("선택한 폴더에 배치할 이미지/PSD 파일이 없습니다.");
    return;
  }

  // ═══ 템플릿 ═══
  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    alert(TEMPLATE_NAME + " 를 찾을 수 없습니다.");
    return;
  }

  var probeDoc = _openTemplateDoc(templateFile);
  var probeSlots;
  try {
    probeSlots = _findSlots(probeDoc);
  } catch (eSlots) {
    alert(eSlots.message);
    try { probeDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
    return;
  }

  if (probeSlots.length === 0) {
    alert("템플릿 Frame 레이어 안에 slot_01 같은 슬롯 PathItem이 없습니다.");
    try { probeDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC2) {}
    return;
  }

  var outFolder = _resolveOutputFolder(inputFolder);
  var ts = _timestamp();
  var savedFiles = [];
  var failedItems = [];
  var slotCount = probeSlots.length;
  var docCount = Math.ceil(images.length / slotCount);

  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

  try {
    for (var d = 0; d < docCount; d++) {
      var doc, slots;
      if (d === 0) {
        doc = probeDoc;
        slots = probeSlots;
      } else {
        doc = _openTemplateDoc(templateFile);
        slots = _findSlots(doc);
      }

      var printLayer = doc.layers.add();
      printLayer.name = "PrintData";

      var start = d * slotCount;
      var end = Math.min(start + slotCount, images.length);
      var stripImageCount = end - start;
      for (var s = 0; s < slotCount; s++) {
        var slot = slots[s];
        var imageIndex = start + (s % stripImageCount);
        try {
          _placeImageInSlot(doc, images[imageIndex], slot, printLayer);
        } catch (ePlace) {
          failedItems.push({
            strip: d + 1,
            file: images[imageIndex].name,
            error: (ePlace && ePlace.message) ? ePlace.message : String(ePlace)
          });
        }
      }

      printLayer.move(doc, ElementPlacement.PLACEATEND);

      var fileName = ts + "_photostrip" + _pad(d + 1, 2) + ".ai";
      var saveFile = new File(outFolder.fsName + "/" + fileName);
      _saveAi(doc, saveFile);
      savedFiles.push(saveFile.fsName);

      if (autoClose) {
        try { doc.close(SaveOptions.SAVECHANGES); } catch (eClose) {}
      }
    }
  } finally {
    app.userInteractionLevel = prevInteraction;
  }

  var msg =
    "✓ 완료: " + savedFiles.length + "개 포토스트립 저장\n" +
    "템플릿: " + templateFile.name + "\n" +
    "슬롯: " + slotCount + "개  /  입력: " + images.length + "개\n";

  if (failedItems.length > 0) {
    msg += "\n⚠ 실패 " + failedItems.length + "건:\n";
    for (var fi = 0; fi < failedItems.length; fi++) {
      var f = failedItems[fi];
      msg += "  · strip" + _pad(f.strip, 2) + " / " + f.file + ": " + f.error + "\n";
    }
  }

  msg += "\n" + savedFiles.join("\n");
  alert(msg);


  // ═════════════════════════════════════════════════════════
  //  PLACEMENT
  // ═════════════════════════════════════════════════════════

  function _placeImageInSlot(doc, imageFile, slot, printLayer) {
    var b = slot.geometricBounds; // [L, T, R, B]
    var slotL = b[0], slotT = b[1], slotR = b[2], slotB = b[3];
    var slotW = slotR - slotL;
    var slotH = slotT - slotB;
    if (slotW <= 0 || slotH <= 0) throw new Error("slot bounds가 유효하지 않습니다");

    app.activeDocument = doc;
    doc.selection = null;
    doc.activeLayer = printLayer;

    var group = printLayer.groupItems.add();
    group.name = "PhotoSlot_" + slot.name;

    var placed = group.placedItems.add();
    placed.file = imageFile;

    var ratio = Math.max(slotW / placed.width, slotH / placed.height);
    placed.width *= ratio;
    placed.height *= ratio;
    placed.left = slotL + (slotW - placed.width) / 2;
    placed.top = slotT - (slotH - placed.height) / 2;

    var clip = slot.duplicate(group, ElementPlacement.PLACEATBEGINNING);
    clip.name = "Clip_" + slot.name;
    _prepareClipPath(clip);
    group.clipped = true;

    try { placed.embed(); } catch (eEmbed) {}
  }

  function _prepareClipPath(item) {
    try {
      if (item.typename === "PathItem") {
        item.clipping = true;
        item.filled = false;
        item.stroked = false;
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var i = 0; i < item.pathItems.length; i++) {
          item.pathItems[i].clipping = true;
          item.pathItems[i].filled = false;
          item.pathItems[i].stroked = false;
        }
      }
    } catch (e) {}
  }


  // ═════════════════════════════════════════════════════════
  //  TEMPLATE / FILE HELPERS
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

  function _findSlots(doc) {
    var frameLayer = _findLayerByName(doc.layers, "Frame");
    if (!frameLayer) throw new Error("템플릿에 'Frame' 레이어가 없습니다");

    var slots = [];
    _collectSlotItems(frameLayer, slots);
    slots.sort(function (a, b) {
      return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
    });
    return slots;
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

  function _collectSlotItems(container, slots) {
    if (container.pathItems) {
      for (var i = 0; i < container.pathItems.length; i++) {
        if (/^slot_[0-9]+$/i.test(container.pathItems[i].name)) slots.push(container.pathItems[i]);
      }
    }
    if (container.compoundPathItems) {
      for (var j = 0; j < container.compoundPathItems.length; j++) {
        if (/^slot_[0-9]+$/i.test(container.compoundPathItems[j].name)) slots.push(container.compoundPathItems[j]);
      }
    }
    if (container.groupItems) {
      for (var g = 0; g < container.groupItems.length; g++) _collectSlotItems(container.groupItems[g], slots);
    }
    if (container.layers) {
      for (var L = 0; L < container.layers.length; L++) _collectSlotItems(container.layers[L], slots);
    }
  }

  function _collectImages(folder) {
    var cleanFiles = folder.getFiles(function (f) {
      return f instanceof File && /_clean\.psd$/i.test(f.name);
    });
    if (cleanFiles.length > 0) return _sortFiles(cleanFiles);

    var files = folder.getFiles(function (f) {
      return f instanceof File &&
             !/^~/.test(f.name) &&
             !/_sil\.png$/i.test(f.name) &&
             /\.(psd|png|jpe?g|tiff?|heic)$/i.test(f.name);
    });
    return _sortFiles(files);
  }

  function _sortFiles(files) {
    files.sort(function (a, b) {
      return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
    });
    return files;
  }

  function _resolveOutputFolder(srcFolder) {
    var srcName = decodeURIComponent(srcFolder.name);
    if (srcName === "01_original" || srcName === "02_cutout") {
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
    try { aiOpts.embedLinkedFiles = true; } catch (e) {}
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
