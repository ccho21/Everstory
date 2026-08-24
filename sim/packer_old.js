  var SCRIPT_VARIANT = "v22 unified";
  var SCRIPT_TITLE = "Everstory Mixed Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var BODY_PADDING_MM = 2;
  var GAP_DEFAULT_MM = 2.5;
  var BAND_CELL_TOL = 0.85;
  var SLOTS_BY_SIZE = {
    19.05: 48,   // 0.75"  (6×8)
    25.4:  30,   // 1"     (5×6)
    31.75: 20,   // 1.25"  (4×5)
    38.1:  12,   // 1.5"   (3×4)
    50.8:  6,    // 2"     (2×3)
    63.5:  4     // 2.5"   (2×2)
  };
  var PACKAGE_SIZE_VALUE = -2;
  var PACKAGE_MAX_DESIGNS = 8;
  var ALLSIZES_SIZE_VALUE = -3;
  var ALLSIZES_ORDER_MM = [63.5, 50.8, 38.1, 31.75, 25.4, 19.05];
  var ALLSIZES_FILL = true;
  var ALLSIZES_FILL_MM = [38.1, 31.75, 25.4, 19.05];
  var ALLSIZES_HERO_COUNT = 2;
  var DESIGN_LIMIT_BY_SIZE_MM = SLOTS_BY_SIZE;
  var SIZE_OPTIONS = [
    "0.75\" / 19mm",
    "1\" / 25mm",
    "1.25\" / 32mm",
    "1.5\" / 38mm",
    "2\" / 51mm",
    "2.5\" / 64mm",
    "Package (4 designs / 1 sheet · 8 designs / 2 sheets · 파일명 _XS/_S/_M/_L/_XL/_XXL)",
    "All sizes 0.75-2.5in (모든 사이즈 1장 이상)"
  ];
  var SIZE_VALUES = [19.05, 25.4, 31.75, 38.1, 50.8, 63.5, PACKAGE_SIZE_VALUE, ALLSIZES_SIZE_VALUE];
  var SIZE_LETTERS = ["XS", "S", "M", "L", "XL", "XXL", "PKG", "ALL"];
  var SIZE_MM_LABEL = { 19.05: 19, 25.4: 25, 31.75: 32, 38.1: 38, 50.8: 51, 63.5: 64 };
  var SIZE_DEFAULT_INDEX = 1;
  var CUT_MARGIN_OPTIONS = ["0mm", "0.5mm", "1mm", "2mm"];
  var CUT_MARGIN_VALUES = [0, 0.5, 1, 2];
  var CUT_MARGIN_DEFAULT_INDEX = 0;
  var MATERIAL_OPTIONS = ["White Matte", "Translucent", "Silver", "Gold"];
  var TIER_SIZE_MM = { XS: 19.05, S: 25.4, M: 31.75, L: 38.1, XL: 50.8, XXL: 63.5 };
  var TIER_DEFAULT = "S";
  var TIER_TOKEN_RE = /_(XXL|XL|XS|FAM|S|M|L)$/i;
  var TIER_PACK_EFFICIENCY = 0.80;
  var PKG_COUNT_BY_TIER = {
    XXL: { min: 1, max: 1 },
    XL:  { min: 1, max: 2 },
    L:   { min: 2, max: 3 },
    M:   { min: 2, max: 4 },
    S:   { min: 2, max: 6 },
    XS:  { min: 1, max: 8 }
  };
  var BUCKET_TOKEN_RE = /_(BIG|MED|SML)$/i;
  var BUCKETS = ["BIG", "MED", "SML"];
  var BUCKET_TIERS = { BIG: ["XXL", "XL"], MED: ["L", "M"], SML: ["S", "XS"] };
  var TIER_TO_BUCKET = { XXL: "BIG", XL: "BIG", L: "MED", M: "MED", S: "SML", XS: "SML" };
  var PACKAGE_LADDERS = [
    { key: "A", BIG: ["XXL", "XL"], MED: ["L", "M"],      SML: ["S", "XS"] },
    { key: "B", BIG: ["XXL", "XL"], MED: ["L", "M", "M"], SML: ["XS", "S", "XS"] },
    { key: "C", BIG: ["XXL", "XL"], MED: ["L", "M", "M"], SML: ["S", "XS", "XS"] },
    { key: "D", BIG: ["XXL", "XL"], MED: ["L", "M"],      SML: ["S", "XS", "XS"] }
  ];
  var PACKAGE_SHEET_OPTIONS = ["1장 (Mini)", "2장 (Full)", "3장"];
  var PACKAGE_SHEET_VALUES = [1, 2, 3];
  var PACKAGE_SHEET_DEFAULT_INDEX = 1;
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
    sizePanel.alignChildren = "center";
    sizePanel.margins = [14, 18, 14, 14];
    sizePanel.spacing = 8;
    var sizeDropdown = sizePanel.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDropdown.selection = SIZE_DEFAULT_INDEX;
    sizeDropdown.preferredSize = [320, 24];

    var pairsPanel = dlg.add("panel", undefined, "사용할 사진 페어 (multi-select)");
    pairsPanel.orientation = "column";
    pairsPanel.alignChildren = "fill";
    pairsPanel.margins = [14, 18, 14, 14];
    pairsPanel.spacing = 6;

    var pairItems = [];
    for (var pli = 0; pli < pairsArg.length; pli++) pairItems.push(pairsArg[pli].base);
    // numberOfColumns:1 + showHeaders:false → 행 전체가 클릭 hit area 가 됨 (이름 옆 빈 공간 클릭도 선택 동작).
    var pairsListbox = pairsPanel.add("listbox", undefined, pairItems, {
      multiselect: true,
      numberOfColumns: 1,
      showHeaders: false
    });
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
      if (sizeDropdown.selection !== null) {
        return SIZE_VALUES[sizeDropdown.selection.index];
      }
      return SIZE_VALUES[SIZE_DEFAULT_INDEX];
    }
    function _capForSize(sizeMm) {
      if (sizeMm === PACKAGE_SIZE_VALUE) return PACKAGE_MAX_DESIGNS;
      if (sizeMm === ALLSIZES_SIZE_VALUE) return pairsArg.length;
      return DESIGN_LIMIT_BY_SIZE_MM[sizeMm] || pairsArg.length;
    }
    var _syncing = false;
    function _syncCapAndCount() {
      if (_syncing) return;
      _syncing = true;
      try {
        var sz = _currentSizeMm();
        var cap = _capForSize(sz);
        var sel = pairsListbox.selection;
        var selLen = sel ? sel.length : 0;
        if (sel && selLen > cap) {
          var trimmed = [];
          for (var t = 0; t < cap; t++) trimmed.push(sel[t]);
          pairsListbox.selection = trimmed;
          selLen = cap;
        }
        countLabel.text = "선택: " + selLen + " / " + cap;
        if (sz === PACKAGE_SIZE_VALUE) {
          hintLabel.text = "Package: 4 designs → 1 sheet · 8 designs → 2 sheets";
        } else if (sz === ALLSIZES_SIZE_VALUE) {
          hintLabel.text = "전 사이즈: 디자인 순서대로 배정 (0.75-2.5\" 각 1장 이상) · Shopify Mixed 주문 제작용";
        } else {
          hintLabel.text = "사이즈에 따라 cap 자동 적용";
        }
      } finally {
        _syncing = false;
      }
    }
    pairsListbox.onChange = _syncCapAndCount;
    sizeDropdown.onChange = _syncCapAndCount;

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
    cutRadios[CUT_MARGIN_DEFAULT_INDEX].value = true;

    var hint = dlg.add("statictext", undefined, "info > header > header_right — 우측 정렬 3줄 (이름·사이즈·재질 / 디자인수 / Order·date). 주문번호는 헤더 표기용 (파일명 미포함).");
    try { hint.graphics.foregroundColor = hint.graphics.newPen(hint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1); } catch (eHint) {}

    var btnGroup = dlg.add("group");
    btnGroup.alignment = "right";
    btnGroup.spacing = 10;
    btnGroup.add("button", undefined, "취소", { name: "cancel" });
    var okBtn = btnGroup.add("button", undefined, "생성", { name: "ok" });
    okBtn.active = true;

    // 검증은 다이얼로그가 닫히기 전에 — 실패 시 입력 유지한 채 계속.
    // (닫힌 뒤 검증하면 스크립트가 종료돼 폴더 선택부터 전부 재입력해야 했음.)
    okBtn.onClick = function () {
      if (!_trim(nameInput.text)) {
        alert("이름이 비어 있습니다.");
        return;
      }
      if (!pairsListbox.selection || pairsListbox.selection.length === 0) {
        alert("페어가 선택되지 않았습니다. 최소 1개 선택하세요.");
        return;
      }
      dlg.close(1);
    };

    if (dlg.show() !== 1) return null;

    var nameText = _trim(nameInput.text);
    var sizeMm = _currentSizeMm();

    var cutMarginMm = CUT_MARGIN_VALUES[CUT_MARGIN_DEFAULT_INDEX];
    for (var cidx = 0; cidx < cutRadios.length; cidx++) {
      if (cutRadios[cidx].value) { cutMarginMm = CUT_MARGIN_VALUES[cidx]; break; }
    }

    var materialText = (materialDropdown.selection !== null) ? materialDropdown.selection.text : MATERIAL_OPTIONS[0];

    var selectedPairs = [];
    if (pairsListbox.selection) {
      for (var spi = 0; spi < pairsListbox.selection.length; spi++) {
        selectedPairs.push(pairsArg[pairsListbox.selection[spi].index]);
      }
    }
    // okBtn.onClick 이 보장하지만, 비면 main 이 pairs 전체로 폴백하므로 안전판으로 중단 유지.
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
      isPackage: (sizeMm === PACKAGE_SIZE_VALUE),
      isAllSizes: (sizeMm === ALLSIZES_SIZE_VALUE),
      cutMarginMm: cutMarginMm,
      selectedPairs: selectedPairs
    };
  }
  function _buildOrderDetail(options, photoCount, packResult) {
    var spec;
    if (options.isPackage) {
      spec = "Package/" + options.cutMarginMm + "mm";
    } else if (options.isAllSizes) {
      spec = "AllSizes/0.75-2.5in/" + options.cutMarginMm + "mm";
    } else {
      spec = _sizeLetter(options.sizeMm) + "/" + _inchStr(options.sizeMm) + "/" + options.cutMarginMm + "mm";
    }
    var orderNum = options.orderNumber ? options.orderNumber : "—";
    return {
      rows: [
        { left: "TYPE: Name Included", right: "MATERIAL: " + options.material },
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
  function _sizeLetter(mm) {
    for (var i = 0; i < SIZE_VALUES.length; i++) {
      if (SIZE_VALUES[i] === mm) return SIZE_LETTERS[i];
    }
    return "·";
  }
  function _inchStr(mm) {
    var inch = mm / 25.4;
    return inch.toFixed(2).replace(/\.?0+$/, "") + "in";
  }
  function _mmCmStr(mm) {
    var cm = (mm / 10).toFixed(2).replace(/\.?0+$/, "");
    return mm + "mm / " + cm + "cm";
  }
  function _drawProductionHeader(options, photoCount, headerRightText) {
    // 템플릿의 info > header > header_right TextFrame 에 폰트·사이즈·정렬이 미리 잡혀 있다.
    // 값만 contents 로 교체. 새 TextFrame 만들지 않음.
    var sizeToken = options.isPackage
      ? "Package"
      : (options.isAllSizes
      ? "All sizes 0.75-2.5\""
      : _inchStr(options.sizeMm) + " / " + (SIZE_MM_LABEL[options.sizeMm] || Math.round(options.sizeMm)) + "mm");

    var orderNum = options.orderNumber ? options.orderNumber : "—";
    var line1 = _nfcHangul(options.nameText) + " • " + sizeToken + " • " + options.material;
    var line2 = photoCount + " design(s)";
    var line3 = "Order: " + orderNum + " | date: " + options.orderDate;

    headerRightText.contents = line1 + "\r" + line2 + "\r" + line3;
    _applyHangulFontOverride(headerRightText, _resolveHangulFont());
  }
  function _nfcHangul(s) {
    if (!s) return s;
    var out = "";
    var i = 0;
    while (i < s.length) {
      var L = s.charCodeAt(i);
      if (L >= 0x1100 && L <= 0x1112 && i + 1 < s.length) {
        var V = s.charCodeAt(i + 1);
        if (V >= 0x1161 && V <= 0x1175) {
          var Tidx = 0;
          var step = 2;
          if (i + 2 < s.length) {
            var T = s.charCodeAt(i + 2);
            if (T >= 0x11A8 && T <= 0x11C2) { Tidx = T - 0x11A7; step = 3; }
          }
          out += String.fromCharCode(0xAC00 + ((L - 0x1100) * 21 + (V - 0x1161)) * 28 + Tidx);
          i += step;
          continue;
        }
      }
      out += s.charAt(i);
      i++;
    }
    return out;
  }
  function _resolveHangulFont() {
    // "TTOmniGothicL" = 210 옴니고딕 020 의 PostScript 이름 (Adobe Fonts). 010=TTOmniGothicT, 040=TTOmniGothicB.
    var candidates = ["TTOmniGothicL", "AppleSDGothicNeo-Bold", "AppleSDGothicNeo-SemiBold", "AppleGothic"];
    for (var i = 0; i < candidates.length; i++) {
      try { return app.textFonts.getByName(candidates[i]); } catch (eFont) {}
    }
    return null;
  }
  function _applyHangulFontOverride(textFrame, hangulFont) {
    if (!hangulFont) return;
    var s = textFrame.contents;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      // Hangul Syllables AC00–D7AF, Jamo 1100–11FF, Compatibility Jamo 3130–318F
      if ((c >= 0xAC00 && c <= 0xD7AF) || (c >= 0x1100 && c <= 0x11FF) || (c >= 0x3130 && c <= 0x318F)) {
        try { textFrame.textRange.characters[i].textFont = hangulFont; } catch (eChar) {}
      }
    }
  }
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
  function _ensureArtMaster(sheetDoc, pair) {
    if (pair.cachedArtGroup) return pair.cachedArtGroup;
    var stash = _ensureTraceStashLayer(sheetDoc);
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = stash;
    var placed = stash.placedItems.add();
    placed.file = pair.psd;
    var mL = placed.left, mT = placed.top, mW = placed.width, mH = placed.height;
    placed.embed();
    var master = _stripEmbeddedPSDPathsNear(stash, mL, mT, mW, mH);
    if (!master) {
      throw new Error("embed master 그룹을 찾지 못함 (" + pair.base + ")");
    }
    try { master.hidden = true; } catch (eHide) {}
    pair.cachedArtGroup = master;
    return master;
  }
  function _placePhotoSticker(sheetDoc, pair, x, y, cellWPt, cellHPt, cutMarginPt, printLayer, kissLayer, cutSpot, rotated) {
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

    var master = _ensureArtMaster(sheetDoc, pair);

    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printLayer;
    // rotated 면 90° 후 셀을 채우도록 swap 박스(artH×artW)에 맞춰 사이즈. 중심 기준 배치는
    // 비회전일 때 기존 식과 수치 동일(artX+(artW-w)/2 == ccx-w/2) — 비회전 경로 무변경.
    var fitW = rotated ? artH : artW;
    var fitH = rotated ? artW : artH;
    var embG = master.duplicate(printLayer, ElementPlacement.PLACEATBEGINNING);
    try { embG.hidden = false; } catch (eShow0) {}
    var gb = embG.geometricBounds;
    var gw = gb[2] - gb[0];
    var gh = gb[1] - gb[3];
    var ratio = Math.min(fitW / gw, fitH / gh);
    embG.resize(ratio * 100, ratio * 100);
    gb = embG.geometricBounds;   // resize 후 실측 (반올림 오차 방지)
    var psdW = gb[2] - gb[0];
    var psdH = gb[1] - gb[3];
    var ccx = artX + artW / 2;
    var ccy = artY - artH / 2;
    embG.left = ccx - psdW / 2;
    embG.top = ccy + psdH / 2;
    var psdL = embG.left;
    var psdT = embG.top;

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

    // 회전 — master.duplicate 가 그룹 핸들(embG)을 직접 주므로 구 bounds-scan 탐색·null 폴백 불필요.
    if (rotated) {
      // 정합 불변식: PSD 그룹과 칼선 dup 에 *동일* 매트릭스 적용 → 피벗이 다소 어긋나도
      // 둘이 같이 이동해 컷-사진 락 보장(최악도 셀 내 위치 오차, 컷 불일치는 구조적으로 불가).
      // transform 실패 시 예외를 삼키지 않음 → main 루프가 failedItems 로 가시화(조용한 desync 방지).
      var rmat = app.concatenateMatrix(
        app.concatenateMatrix(app.getTranslationMatrix(-ccx, -ccy), app.getRotationMatrix(90)),
        app.getTranslationMatrix(ccx, ccy)
      );
      embG.transform(rmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
      dup.transform(rmat, true, true, true, true, false, Transformation.DOCUMENTORIGIN);
    }

    sheetDoc.selection = null;
    // redraw 는 main 이 배치 루프 종료 후 1회만 — 배치당 app.redraw() 는 비용만 큼. GC 는 유지(메모리 안정).
    try { $.gc(); } catch (eGc) {}
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
  function _resolveTemplate() {
    var scriptDir = (new File($.fileName)).parent;
    var candidates = [
      scriptDir.fsName + "/templates/template_cutout_v2.ait",
      scriptDir.parent.fsName + "/templates/template_cutout_v2.ait"
    ];
    for (var i = 0; i < candidates.length; i++) {
      var f = new File(candidates[i]);
      if (f.exists) return f;
    }
    return File.openDialog("template_cutout_v2.ait 위치 선택", "*.ait");
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
        // 접미사 제거 후 끝의 _TIER 토큰 파싱 → pair.tier. base 는 tier 포함 (운영자가 listbox 에서 사이즈 확인).
        // psdName 은 raw pngName 치환이라 토큰이 양쪽에 대칭 보존 → 페어링 무영향.
        var nameNoSuffix = pngName.replace(/_sil\.png$/i, "");
        // 3버킷 토큰(_BIG/_MED/_SML) 우선, 없으면 레거시 6티어 토큰. 두 정규식은 서로 매칭되지
        // 않는다 (_SML 은 TIER_TOKEN_RE 의 어떤 대안으로도 끝까지 소비되지 않음) → 충돌 없음.
        var bucketMatch = nameNoSuffix.match(BUCKET_TOKEN_RE);
        var tierMatch = nameNoSuffix.match(TIER_TOKEN_RE);
        var bucket, tier;
        if (bucketMatch) {
          bucket = bucketMatch[1].toUpperCase();
          // Package 는 배분층이 인치를 덮어쓴다. 이 값은 다른 모드·표시용 폴백일 뿐.
          tier = BUCKET_TIERS[bucket][0];
        } else if (tierMatch) {
          tier = tierMatch[1].toUpperCase();
          if (tier === "FAM") tier = "XXL";
          bucket = TIER_TO_BUCKET[tier];
        } else {
          tier = TIER_DEFAULT;
          bucket = TIER_TO_BUCKET[TIER_DEFAULT];
        }
        pairs.push({
          psd: psdFile,
          sil: pngFiles[i],
          base: _decodeName(nameNoSuffix),
          tier: tier,
          bucket: bucket
        });
      }
    }
    return pairs;
  }
  function _decodeName(s) {
    try { return decodeURI(s); } catch (e) { return s; }
  }
  function _pngAspect(silFile) {
    var f = new File(silFile.absoluteURI);
    try {
      f.encoding = "BINARY";
      if (!f.open("r")) return 0;
      var head = f.read(24);
      f.close();
      if (!head || head.length < 24) return 0;
      function B(i) { return head.charCodeAt(i) & 0xFF; }
      if (B(0) !== 0x89 || B(1) !== 0x50 || B(2) !== 0x4E || B(3) !== 0x47) return 0;
      if (head.substring(12, 16) !== "IHDR") return 0;
      var w = B(16) * 16777216 + B(17) * 65536 + B(18) * 256 + B(19);
      var h = B(20) * 16777216 + B(21) * 65536 + B(22) * 256 + B(23);
      if (w <= 0 || h <= 0) return 0;
      return w / h;
    } catch (e) {
      try { f.close(); } catch (e2) {}
      return 0;
    }
  }
  function _measurePairAspect(pair) {
    if (pair.aspect) return pair.aspect;
    var a = _pngAspect(pair.sil);
    if (a > 0) { pair.aspect = a; return a; }
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
  function _packAllSizes(pairs, binW, binH, gap) {
    if (!pairs || pairs.length === 0) {
      return { rows: [], placed: [], leftover: [], repeatedCount: 0, missingSizes: [], evictions: [], mixedSummary: _buildAllSizesSummary(0, 0) };
    }
    var N = pairs.length;

    // 1단계: 보장 라운드 — hero 사이즈(2.5"/2")만 단일로 첫 행에 배치한다.
    //   1.5" 이하 단일은 hero 옆에 두지 않는다 (사용자 정책): 아래 tier 행 round-robin 과
    //   hero 행의 작은 사이즈 column 이 담당하고, 빠진 사이즈는 말미 보장 검증이 구제한다.
    //   디자인은 순서대로 round-robin — 1개면 그 디자인이 전 사이즈, 여러개면 사이즈마다 다음 디자인.
    var primary = [];
    for (var i = 0; i < ALLSIZES_HERO_COUNT && i < ALLSIZES_ORDER_MM.length; i++) {
      primary.push(_itemForSize(pairs[i % N], ALLSIZES_ORDER_MM[i]));
    }
    primary = _sortShelfItemsDesc(primary);   // 높이 내림차순 (FFDH — 큰 것부터)

    var pack = { rows: [], placed: [], leftover: [], repeatedCount: 0, missingSizes: [], evictions: [] };
    pack.leftover = _appendShelfRowsOnce(pack, primary, binW, binH, gap);

    // 2단계: 남는 공간을 (작은 사이즈 × 디자인) round-robin 으로 채움.
    //   디자인 전체를 채움 풀에 넣어 시트가 닿을 때까지 순서대로 반복 — 사이즈·디자인 모두 다양.
    if (ALLSIZES_FILL) {
      var fillers = [];
      for (var d = 0; d < N; d++) {
        for (var f = 0; f < ALLSIZES_FILL_MM.length; f++) {
          fillers.push(_itemForSize(pairs[d], ALLSIZES_FILL_MM[f]));
        }
      }
      fillers = _sortShelfItemsDesc(fillers);
      _appendShelfFillerRows(pack, fillers, binW, binH, gap);
    }

    // 보장 검증: ALLSIZES_ORDER_MM 모든 사이즈 ≥ 1장. hero 구조 전환으로 1.5"~0.75" 는
    //   tier 행/column 이 담당하는데, 높이·폭이 극단적으로 빡빡하면 한 사이즈가 빠질 수 있어
    //   기존 행 빈 폭에 단일 backfill 로 구제한다. 빈 폭도 없으면 채움 아이템 1개를 빼고
    //   교체(_rescueByEviction). 그래도 안 되면 leftover 로 보고.
    var rescuedAny = false;
    for (var gi = 0; gi < ALLSIZES_ORDER_MM.length; gi++) {
      var gSize = ALLSIZES_ORDER_MM[gi];
      if (_countSizeInRows(pack.rows, gSize) > 0) continue;
      var rescued = false;
      for (var gd = 0; gd < N && !rescued; gd++) {
        var gItem = _itemForSize(pairs[gd], gSize);
        for (var gr = 0; gr < pack.rows.length && !rescued; gr++) {
          if (gItem.h <= pack.rows[gr].h && _canAddToShelfRow(pack.rows[gr], gItem, binW, binH, gap)) {
            _addToShelfRow(pack.rows[gr], gItem, gap);
            rescued = true;
            rescuedAny = true;
          }
        }
      }
      if (!rescued && _rescueByEviction(pack, pairs, gSize, binW, gap)) {
        rescued = true;
        rescuedAny = true;
      }
      if (!rescued) {
        pack.leftover.push(_itemForSize(pairs[0], gSize));
        pack.missingSizes.push(gSize);   // 완료 메시지에 보장 실패 사이즈로 명시
      }
    }
    if (rescuedAny) pack.placed = _shelfRowsToPlaced(pack.rows, binW, binH, gap);

    pack.mixedSummary = _buildAllSizesSummary(pack.placed.length, N);
    return pack;
  }
  function _rescueByEviction(pack, pairs, gSize, binW, gap) {
    for (var gd = 0; gd < pairs.length; gd++) {
      var gItem = _itemForSize(pairs[gd], gSize);
      for (var r = pack.rows.length - 1; r >= 0; r--) {
        var row = pack.rows[r];
        if (gItem.h > row.h) continue;
        for (var i = row.items.length - 1; i >= 0; i--) {
          var out = row.items[i];
          if (out.isVStack) continue;
          if (_countSizeInRows(pack.rows, out.sizeMm) < 2) continue;
          var wAfterSwap = row.items.length > 1 ? row.w - out.w + gItem.w : gItem.w;
          if (wAfterSwap > binW) continue;
          row.items.splice(i, 1);
          row.w = row.items.length > 0 ? row.w - out.w - gap : 0;
          _addToShelfRow(row, gItem, gap);
          pack.evictions.push({ outSize: out.sizeMm, inSize: gSize });
          return true;
        }
      }
    }
    return false;
  }
  function _buildAllSizesSummary(total, designCount) {
    var dStr = (designCount && designCount > 1) ? (designCount + " designs round-robin") : "1 design";
    return {
      spec: "ALL/0.75-2.5in",
      human: "0.75-2.5\" 전 사이즈 (각 1장 이상, 총 " + total + "장, " + dStr + ")",
      total: total
    };
  }
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
    packResult.placed = _shelfRowsToPlaced(packResult.rows, binW, binH, gap);

    return leftover;
  }
  function _appendShelfFillerRows(packResult, fillerItems, binW, binH, gap) {
    if (!packResult || !packResult.rows || !fillerItems || fillerItems.length === 0) return;

    var fillerIdx = 0;

    // 0단계 hero-row column fill: 보장 라운드가 만든 hero 행(2.5"/2")의 남은 폭을
    //   same-size 세로 column(0.75" 3단, 1" 2단 등)으로 채운다. column 사이즈는 작은
    //   쪽(0.75")부터 round-robin — hero 행 정책상 1.5"/1.25" 단일은 hero 옆에 두지
    //   않고, 세로 2단 이상 쌓이는 작은 사이즈만 들어간다 (1단짜리는 column 미성립 → 제외).
    //   행 높이는 키우지 않는다 (column 합산 h ≤ row.h): 행이 자라면 아래 행과 겹친다.
    //   디자인은 fillerIdx 커서 round-robin — 1단계 seed 는 키 기준 선택이라 커서 점프 무해.
    var ascSizes = [];
    for (var az = ALLSIZES_FILL_MM.length - 1; az >= 0; az--) ascSizes.push(ALLSIZES_FILL_MM[az]);

    for (var br = 0; br < packResult.rows.length; br++) {
      var existRow = packResult.rows[br];
      var colType = 0;   // ascSizes round-robin 커서 (행마다 0.75" 부터)
      while (true) {
        var availW = binW - existRow.w - gap;
        var col = null;
        var used = colType;
        for (var ct = 0; ct < ascSizes.length; ct++) {
          used = (colType + ct) % ascSizes.length;
          col = _buildSameSizeColumn(fillerItems, fillerIdx, ascSizes[used], availW, existRow.h, gap);
          if (col !== null) break;
        }
        if (col === null) break;
        fillerIdx = col.nextIdx;
        _addToShelfRow(existRow, col, gap);
        packResult.repeatedCount += col.cells.length;
        colType = (used + 1) % ascSizes.length;
      }
    }

    // 1단계: 마지막 행 아래로 새 filler 행 추가. 행은 seed(첫 아이템) 사이즈로 잠근다 —
    //   디자인 수가 적으면 pool 순환(사이즈 4종 × N디자인)이 행 중간에서 사이즈를 섞어
    //   [0.75 옆 1.5] 같은 무작위 행이 나오므로(단일 디자인에서 두드러짐), 행 단위 균일
    //   사이즈로 Package tier 행과 같은 미감을 유지한다. 채움률은 자투리 폭만큼 소폭 감소.
    var startY = 0;
    if (packResult.rows.length > 0) {
      var last = packResult.rows[packResult.rows.length - 1];
      startY = last.y + last.h + gap;
    }

    var row = _newShelfRow(startY);
    var rowSizeMm = 0;     // 0 = 빈 행. seed 가 정한 사이즈로 행을 잠근다.
    var roundUsed = {};    // sizeMm -> true. 이번 바퀴(round)에 행 tier 로 쓴 사이즈.
    var roundUsedCount = 0;
    while (true) {
      var added = false;

      if (rowSizeMm === 0) {
        // seed: 이번 바퀴에서 아직 행 tier 로 안 쓴 사이즈 중 가장 키 큰 적합 아이템 —
        //   같은 사이즈 행만 반복되는 것을 막고 사이즈가 행 단위로 고루 나오게 한다
        //   (Package 의 tier round-robin 반복 L→M→S→XS→L… 과 같은 정책).
        //   한 바퀴를 다 쓰면 리셋 후 새 바퀴. 같은 키는 커서 가까운 쪽 → 디자인 round-robin 유지.
        var seedIdx = _pickShelfSeed(fillerItems, fillerIdx, row, roundUsed, binW, binH, gap);
        if (seedIdx < 0 && roundUsedCount > 0) {
          roundUsed = {};
          roundUsedCount = 0;
          seedIdx = _pickShelfSeed(fillerItems, fillerIdx, row, roundUsed, binW, binH, gap);
        }
        if (seedIdx >= 0) {
          _addToShelfRow(row, fillerItems[seedIdx], gap);
          packResult.repeatedCount++;
          rowSizeMm = fillerItems[seedIdx].sizeMm;
          roundUsed[rowSizeMm] = true;
          roundUsedCount++;
          fillerIdx = (seedIdx + 1) % fillerItems.length;
          added = true;
        }
      } else {
        // 잠긴 행: 같은 사이즈만 이어서 채움 (디자인은 커서 round-robin).
        for (var step = 0; step < fillerItems.length; step++) {
          var fi = (fillerIdx + step) % fillerItems.length;
          if (fillerItems[fi].sizeMm !== rowSizeMm) continue;
          if (_canAddToShelfRow(row, fillerItems[fi], binW, binH, gap)) {
            _addToShelfRow(row, fillerItems[fi], gap);
            packResult.repeatedCount++;
            fillerIdx = (fi + 1) % fillerItems.length;
            added = true;
            break;
          }
        }
      }

      if (added) {
        continue;
      }

      if (row.items.length > 0) {
        packResult.rows.push(row);
        row = _newShelfRow(row.y + row.h + gap);
        rowSizeMm = 0;
        continue;
      }

      break;
    }

    if (row.items.length > 0) packResult.rows.push(row);
    packResult.placed = _shelfRowsToPlaced(packResult.rows, binW, binH, gap);
  }
  function _pickShelfSeed(fillerItems, fromIdx, row, excludeSizes, binW, binH, gap) {
    var best = -1;
    for (var s = 0; s < fillerItems.length; s++) {
      var i = (fromIdx + s) % fillerItems.length;
      if (excludeSizes[fillerItems[i].sizeMm]) continue;
      if (!_canAddToShelfRow(row, fillerItems[i], binW, binH, gap)) continue;
      if (best < 0 || fillerItems[i].h > fillerItems[best].h) best = i;
    }
    return best;
  }
  function _buildSameSizeColumn(fillerItems, fromIdx, sizeMm, maxW, maxH, gap) {
    var cells = [];
    var stackH = 0;
    var stackW = 0;
    var idx = fromIdx;
    while (true) {
      var found = -1;
      for (var s = 0; s < fillerItems.length; s++) {
        var i = (idx + s) % fillerItems.length;
        var it = fillerItems[i];
        if (it.sizeMm !== sizeMm) continue;
        if (it.w > maxW) continue;
        var nextH = cells.length > 0 ? stackH + gap + it.h : it.h;
        if (nextH > maxH) continue;
        found = i;
        break;
      }
      if (found < 0) break;
      var fit = fillerItems[found];
      stackH = cells.length > 0 ? stackH + gap + fit.h : fit.h;
      if (fit.w > stackW) stackW = fit.w;
      cells.push(fit);
      idx = (found + 1) % fillerItems.length;
    }
    if (cells.length < 2) return null;
    return { isVStack: true, w: stackW, h: stackH, cells: cells, nextIdx: idx };
  }
  function _countSizeInRows(rows, sizeMm) {
    var count = 0;
    for (var r = 0; r < rows.length; r++) {
      var items = rows[r].items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].isVStack) {
          for (var v = 0; v < items[i].cells.length; v++) {
            if (items[i].cells[v].sizeMm === sizeMm) count++;
          }
        } else if (items[i].sizeMm === sizeMm) {
          count++;
        }
      }
    }
    return count;
  }
  function _aspectBandGridPack(layoutPairs, binW, binH, gap) {
    if (!layoutPairs || layoutPairs.length === 0) {
      return _uniformGridPack(layoutPairs, binW, binH, gap);
    }

    var tall = [];
    var wide = [];
    for (var i = 0; i < layoutPairs.length; i++) {
      layoutPairs[i]._ordIdx = i;   // 입력 순서 복원 + tie-break 용
      if (layoutPairs[i].cellH > layoutPairs[i].cellW) tall.push(layoutPairs[i]);
      else wide.push(layoutPairs[i]);
    }

    var bands = [];
    _bandClusters(bands, tall, true);
    _bandClusters(bands, wide, false);
    if (bands.length <= 1) return _uniformGridPack(layoutPairs, binW, binH, gap);

    var safeGap = gap < 0 ? 0 : gap;
    var totalRows, totalH;
    while (true) {
      totalRows = 0;
      totalH = 0;
      for (var b = 0; b < bands.length; b++) {
        var bd = bands[b];
        bd.cols = Math.floor((binW + safeGap) / (bd.boxW + safeGap));
        // main flow 의 anyTooBig 검사 (셀 ≤ bin) 로 cols ≥ 1 이 보장되지만, testConfig 직접 호출
        // 등 검사 우회 경로에서도 grid 와 같은 동작이 되도록 fallback 으로 넘긴다.
        if (bd.cols < 1) return _uniformGridPack(layoutPairs, binW, binH, gap);
        bd.rows = Math.ceil(bd.pairs.length / bd.cols);
        totalRows += bd.rows;
        totalH += bd.rows * bd.boxH;
      }
      totalH += (totalRows - 1) * safeGap;
      if (totalH <= binH) break;
      // 초기 배분 (전 디자인 ≥1) 이 안 들어감 → 박스가 가장 비슷한 밴드 쌍 병합 후 재시도.
      if (bands.length <= 2) return _uniformGridPack(layoutPairs, binW, binH, gap);
      _mergeClosestBands(bands);
    }

    // greedy 행 추가 — 반복 수 최소 밴드 우선, tie 는 boxH 큰 밴드 (큰 셀이 남은 높이를
    // 먼저 확보해야 나중에 못 들어가는 역전이 없다).
    while (true) {
      var best = -1;
      var bestRatio = 0;
      for (var g = 0; g < bands.length; g++) {
        if (totalH + safeGap + bands[g].boxH > binH) continue;
        var ratio = (bands[g].rows * bands[g].cols) / bands[g].pairs.length;
        if (best < 0 || ratio < bestRatio ||
            (ratio === bestRatio && bands[g].boxH > bands[best].boxH)) {
          best = g;
          bestRatio = ratio;
        }
      }
      if (best < 0) break;
      bands[best].rows++;
      totalRows++;
      totalH += safeGap + bands[best].boxH;
    }

    // 밴드 순서: boxH 내림차순 → boxW 내림차순 → 첫 디자인 입력 순 (결정적 출력).
    bands.sort(function (a, c) {
      if (a.boxH !== c.boxH) return c.boxH - a.boxH;
      if (a.boxW !== c.boxW) return c.boxW - a.boxW;
      return a.ord - c.ord;
    });

    var rowsList = [];
    var bandInfo = [];
    var y = 0;
    var slots = 0;
    for (var m = 0; m < bands.length; m++) {
      var band = bands[m];
      var cursor = 0;
      for (var r = 0; r < band.rows; r++) {
        var items = [];
        for (var c2 = 0; c2 < band.cols; c2++) {
          items.push({ w: band.boxW, h: band.boxH, payload: band.pairs[cursor % band.pairs.length] });
          cursor++;
        }
        rowsList.push({ y: y, w: band.cols * band.boxW + (band.cols - 1) * safeGap, h: band.boxH, items: items });
        y += band.boxH + safeGap;
      }
      slots += band.rows * band.cols;
      bandInfo.push({ cols: band.cols, rows: band.rows, designs: band.pairs.length });
    }

    var placed = _shelfRowsToPlaced(rowsList, binW, binH, gap);
    var D = layoutPairs.length;
    return {
      placed: placed,
      leftover: [],
      rows: rowsList,
      repeatedCount: (slots > D) ? (slots - D) : 0,
      cols: 0,
      gridRows: totalRows,
      slots: slots,
      hSpace: 0,
      vSpace: 0,
      cellBoxW: 0,
      cellBoxH: 0,
      bandInfo: bandInfo
    };
  }
  function _bandClusters(bands, group, isTall) {
    if (!group || group.length === 0) return;

    var sorted = [];
    for (var i = 0; i < group.length; i++) sorted.push(group[i]);
    sorted.sort(function (a, b) {
      var av = isTall ? a.cellW : a.cellH;
      var bv = isTall ? b.cellW : b.cellH;
      if (av !== bv) return bv - av;
      return a._ordIdx - b._ordIdx;
    });

    var leaderV = 0;
    for (var s = 0; s < sorted.length; s++) {
      var v = isTall ? sorted[s].cellW : sorted[s].cellH;
      if (s === 0 || v < leaderV * BAND_CELL_TOL) {
        bands.push({ pairs: [], boxW: 0, boxH: 0, ord: sorted[s]._ordIdx });
        leaderV = v;
      }
      sorted[s]._bandIdx = bands.length - 1;
    }

    for (var g = 0; g < group.length; g++) {   // 입력 순서로 다시 돌며 밴드에 적재
      var p = group[g];
      var bd = bands[p._bandIdx];
      bd.pairs.push(p);
      if (p.cellW > bd.boxW) bd.boxW = p.cellW;
      if (p.cellH > bd.boxH) bd.boxH = p.cellH;
      if (p._ordIdx < bd.ord) bd.ord = p._ordIdx;
    }
  }
  function _mergeClosestBands(bands) {
    var bi = 0;
    var bj = 1;
    var bestCost = -1;
    for (var i = 0; i < bands.length; i++) {
      for (var j = i + 1; j < bands.length; j++) {
        var mw = bands[i].boxW > bands[j].boxW ? bands[i].boxW : bands[j].boxW;
        var mh = bands[i].boxH > bands[j].boxH ? bands[i].boxH : bands[j].boxH;
        var cost = bands[i].pairs.length * (mw * mh - bands[i].boxW * bands[i].boxH) +
                   bands[j].pairs.length * (mw * mh - bands[j].boxW * bands[j].boxH);
        if (bestCost < 0 || cost < bestCost) {
          bestCost = cost;
          bi = i;
          bj = j;
        }
      }
    }
    var keep = bands[bi];
    var gone = bands[bj];
    for (var k = 0; k < gone.pairs.length; k++) keep.pairs.push(gone.pairs[k]);
    keep.pairs.sort(function (a, b) { return a._ordIdx - b._ordIdx; });   // 입력 순서 복원
    if (gone.boxW > keep.boxW) keep.boxW = gone.boxW;
    if (gone.boxH > keep.boxH) keep.boxH = gone.boxH;
    if (gone.ord < keep.ord) keep.ord = gone.ord;
    bands.splice(bj, 1);
  }
  function _bandGridStr(bandInfo) {
    var parts = [];
    for (var i = 0; i < bandInfo.length; i++) parts.push(bandInfo[i].cols + "×" + bandInfo[i].rows);
    return parts.join(" + ") + " (밴드 " + bandInfo.length + "개)";
  }
  function _uniformGridPack(layoutPairs, binW, binH, gap) {
    if (!layoutPairs || layoutPairs.length === 0) {
      return { placed: [], leftover: [], rows: [], repeatedCount: 0, cols: 0, gridRows: 0, slots: 0, hSpace: 0, vSpace: 0, cellBoxW: 0, cellBoxH: 0 };
    }

    var cellBoxW = 0;
    var cellBoxH = 0;
    for (var i = 0; i < layoutPairs.length; i++) {
      if (layoutPairs[i].cellW > cellBoxW) cellBoxW = layoutPairs[i].cellW;
      if (layoutPairs[i].cellH > cellBoxH) cellBoxH = layoutPairs[i].cellH;
    }

    var safeGap = gap < 0 ? 0 : gap;
    var cols = Math.floor((binW + safeGap) / (cellBoxW + safeGap));
    var rowsCount = Math.floor((binH + safeGap) / (cellBoxH + safeGap));
    if (cols < 1 || rowsCount < 1) {
      return { placed: [], leftover: [], rows: [], repeatedCount: 0, cols: 0, gridRows: 0, slots: 0, hSpace: 0, vSpace: 0, cellBoxW: cellBoxW, cellBoxH: cellBoxH };
    }

    var hSpace = (binW - cols * cellBoxW) / (cols + 1);
    if (hSpace < 0) hSpace = 0;
    if (hSpace < safeGap) hSpace = safeGap;  // 가로도 inner = 최소 gap 보장 (full-width 사진 붙음 방지)
    var hLeft = (binW - cols * cellBoxW - (cols - 1) * hSpace) / 2;
    if (hLeft < 0) { hSpace = (binW - cols * cellBoxW) / (cols + 1); if (hSpace < 0) hSpace = 0; hLeft = hSpace; }
    // 세로: 균등 vSpace 가 gap 보다 작아지면(행 많아 빡빡) inner = 최소 gap 보장, 남는 건 outer(vTop) 로.
    //   rowsCount floor 가 이미 gap 을 확보했으므로 inner=gap 강제는 오버플로우 없음 (cutMargin 0 행붙음 방지).
    var vSpace = (binH - rowsCount * cellBoxH) / (rowsCount + 1);
    if (vSpace < 0) vSpace = 0;
    if (vSpace < safeGap) vSpace = safeGap;
    var vTop = (binH - rowsCount * cellBoxH - (rowsCount - 1) * vSpace) / 2;
    if (vTop < 0) { vSpace = (binH - rowsCount * cellBoxH) / (rowsCount + 1); if (vSpace < 0) vSpace = 0; vTop = vSpace; }

    var slots = cols * rowsCount;
    var D = layoutPairs.length;

    var placed = [];
    var rowsList = [];
    for (var r = 0; r < rowsCount; r++) {
      var rowItems = [];
      var rowY = vTop + r * (cellBoxH + vSpace);
      for (var c = 0; c < cols; c++) {
        var slotIdx = r * cols + c;
        var pair = layoutPairs[slotIdx % D];
        var x = hLeft + c * (cellBoxW + hSpace);
        var item = { w: cellBoxW, h: cellBoxH, payload: pair };
        placed.push({ x: x, y: rowY, w: cellBoxW, h: cellBoxH, payload: pair });
        rowItems.push(item);
      }
      rowsList.push({ y: rowY, w: cols * cellBoxW + (cols - 1) * hSpace, h: cellBoxH, items: rowItems });
    }

    var repeatedCount = (slots > D) ? (slots - D) : 0;

    return {
      placed: placed,
      leftover: [],
      rows: rowsList,
      repeatedCount: repeatedCount,
      cols: cols,
      gridRows: rowsCount,
      slots: slots,
      hSpace: hSpace,
      vSpace: vSpace,
      cellBoxW: cellBoxW,
      cellBoxH: cellBoxH
    };
  }
  function _packageDistStr(arr) {
    var c = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    for (var i = 0; i < arr.length; i++) {
      var t = arr[i].tier;
      if (c[t] == null) t = TIER_DEFAULT;
      c[t]++;
    }
    var order = ["XXL", "XL", "L", "M", "S", "XS"];
    var parts = [];
    for (var k = 0; k < order.length; k++) {
      if (c[order[k]] > 0) parts.push(order[k] + "×" + c[order[k]]);
    }
    return parts.length ? parts.join(" ") : "—";
  }
  function _tierBox(pair) {
    var sizeMm = TIER_SIZE_MM[pair.tier] || TIER_SIZE_MM[TIER_DEFAULT];
    var sizePt = sizeMm * MM_TO_PT;
    var asp = pair.aspect || 1;
    if (asp >= 1) { pair.cellW = sizePt; pair.cellH = sizePt / asp; }
    else { pair.cellW = sizePt * asp; pair.cellH = sizePt; }
    return pair;
  }
  function _tryAddToBandRow(row, pair, isLast, binW, binH, gap, relaxed) {
    var cands = [
      { w: pair.cellW, h: pair.cellH, payload: pair, rotated: false },
      { w: pair.cellH, h: pair.cellW, payload: pair, rotated: true }
    ];
    for (var c = 0; c < cands.length; c++) {
      if (!isLast && row.items.length > 0 && cands[c].h > row.h) continue;
      // 높이 유사성 게이트 (v22): 같은 tier 라도 방향/비율 차이로 행 높이와 크게 다르면
      // (예: 세로형 행에 납작한 가로형) 그 행에 안 넣는다 — 별도 행 또는 회전 후보가 처리.
      // relaxed (게이트 해제) 는 _placeBanded 의 최후 fallback 전용.
      if (!relaxed && row.items.length > 0 && !_heightsClose(cands[c].h, row.h)) continue;
      if (_canAddToShelfRow(row, cands[c], binW, binH, gap)) {
        _addToShelfRow(row, cands[c], gap);
        return true;
      }
    }
    return false;
  }
  function _placeBanded(rows, pair, binW, binH, gap) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].tierLock !== pair.tier) continue;
      if (_tryAddToBandRow(rows[i], pair, i === rows.length - 1, binW, binH, gap, false)) return true;
    }
    var ny = rows.length > 0 ? rows[rows.length - 1].y + rows[rows.length - 1].h + gap : 0;
    var nr = _newShelfRow(ny);
    nr.tierLock = pair.tier;
    if (_tryAddToBandRow(nr, pair, true, binW, binH, gap, false)) {
      rows.push(nr);
      return true;
    }
    // 게이트 완화 fallback: 게이트 통과 행도, 새 행도 불가할 때만 기존 행에 게이트 없이
    // (v21 동작) 재시도. 행 높이가 양방향 후보 사이에 끼는 dead-zone (예: 28.6mm 행에
    // 21.4/38.1 후보) 에서 atomic pass 전체가 롤백되는 회귀 방지 — 게이트 이전에 가능했던
    // 배치는 이 경로로 전부 유지되므로 게이트는 순수 선호 순서만 바꾼다.
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].tierLock !== pair.tier) continue;
      if (_tryAddToBandRow(rows[j], pair, j === rows.length - 1, binW, binH, gap, true)) return true;
    }
    return false;
  }
  function _pkgMin(tier) {
    var c = PKG_COUNT_BY_TIER[tier];
    return c ? c.min : 1;
  }
  function _pkgMax(tier) {
    var c = PKG_COUNT_BY_TIER[tier];
    return c ? c.max : 999999;
  }
  function _buildTierColumn(grp, fromIdx, maxW, maxH, gap, counts) {
    var cells = [];
    var stackH = 0;
    var stackW = 0;
    var idx = fromIdx;
    var localAdd = {};
    while (true) {
      var found = -1;
      for (var s = 0; s < grp.length; s++) {
        var i = (idx + s) % grp.length;
        if (counts) {
          var eff = counts[grp[i].base] + (localAdd[grp[i].base] || 0);
          if (eff >= _pkgMax(grp[i].tier)) continue;
        }
        if (grp[i].cellW > maxW) continue;
        var nextH = cells.length > 0 ? stackH + gap + grp[i].cellH : grp[i].cellH;
        if (nextH > maxH) continue;
        found = i;
        break;
      }
      if (found < 0) break;
      var fit = grp[found];
      stackH = cells.length > 0 ? stackH + gap + fit.cellH : fit.cellH;
      if (fit.cellW > stackW) stackW = fit.cellW;
      cells.push({ w: fit.cellW, h: fit.cellH, payload: fit });
      localAdd[fit.base] = (localAdd[fit.base] || 0) + 1;
      idx = (found + 1) % grp.length;
    }
    if (cells.length < 2) return null;
    return { isVStack: true, w: stackW, h: stackH, cells: cells, nextIdx: idx };
  }
  function _pairPlacedInRows(rows, pair) {
    for (var r = 0; r < rows.length; r++) {
      var its = rows[r].items;
      for (var i = 0; i < its.length; i++) {
        if (its[i].isVStack) {
          for (var c = 0; c < its[i].cells.length; c++) {
            if (its[i].cells[c].payload === pair) return true;
          }
        } else if (its[i].payload === pair) {
          return true;
        }
      }
    }
    return false;
  }
  function _packPackage(pairs, binW, binH, gap) {
    if (!pairs || pairs.length === 0) {
      return { placed: [], leftover: [], rows: [], repeatedCount: 0, cols: 0, gridRows: 0, slots: 0 };
    }
    for (var i = 0; i < pairs.length; i++) _tierBox(pairs[i]);

    var ordered = _sortedPairsForShelf(pairs, false);  // 높이 내림차순
    var n = ordered.length;
    var rows = [];
    var leftover = [];

    // Phase A — 각 사진 1회 배치 (tier 밴드 행). 실패는 column 후보로 보류 (즉시 leftover 금지 —
    //   XXL+XL+L+M 처럼 tier 행 누적이 binH 를 넘으면 마지막 tier 가 행을 못 여는 케이스).
    var counts = {};   // base → 시트 출력 장수 (min/max 판정의 SOT)
    for (var ci0 = 0; ci0 < n; ci0++) counts[ordered[ci0].base] = 0;

    var colOnly = [];
    for (var p = 0; p < n; p++) {
      if (_placeBanded(rows, ordered[p], binW, binH, gap)) {
        counts[ordered[p].base]++;
        continue;
      }
      ordered[p]._colOnly = true;
      colOnly.push(ordered[p]);
    }

    var repeatedCount = 0;
    var tierSeq = ["XL", "L", "M", "S", "XS"];
    var tierGroups = { XL: [], L: [], M: [], S: [], XS: [] };
    var tierNoRows = { XL: false, L: false, M: false, S: false, XS: false };
    for (var gi = 0; gi < n; gi++) {
      var gp = ordered[gi];
      if (gp.tier === "XXL" || !tierGroups[gp.tier]) continue;  // XXL·미지정 tier 반복 제외
      // 행 배치 못 한 디자인이 있는 tier 은 행 pass 제외(행 기반 비균일 방지) — column 은 허용.
      if (gp._colOnly) tierNoRows[gp.tier] = true;
      tierGroups[gp.tier].push(gp);
    }
    for (var so = 0; so < tierSeq.length; so++) {
      tierGroups[tierSeq[so]] = _sortedPairsForShelf(tierGroups[tierSeq[so]], false);
    }

    var retired = { XL: false, L: false, M: false, S: false, XS: false };
    var guard = 0;

    // Phase B0 — min 강제 pass (2026-08-19): PKG_COUNT_BY_TIER.min 까지 tier round-robin
    //   으로 atomic pass 우선 실행 — greedy 반복(B1)이 다른 tier 의 min 공간을 먹기 전에
    //   확보한다. pass 실패 tier 는 은퇴 (잔여 min 은 아래 min 구제 column 이 시도).
    var minActive = true;
    while (minActive && guard++ < 100000) {
      minActive = false;
      for (var tmq = 0; tmq < tierSeq.length; tmq++) {
        var TM = tierSeq[tmq];
        if (retired[TM] || tierNoRows[TM]) continue;
        var mGrp = tierGroups[TM];
        if (!mGrp || mGrp.length === 0) continue;
        if (counts[mGrp[0].base] >= _pkgMin(TM)) continue;   // pass 는 균일이라 대표 검사
        var mSnap = _snapPack(rows);
        var mOk = true;
        for (var mj = 0; mj < mGrp.length; mj++) {
          if (_placeBanded(rows, mGrp[mj], binW, binH, gap)) continue;
          mOk = false;
          break;
        }
        if (mOk) {
          for (var mj2 = 0; mj2 < mGrp.length; mj2++) counts[mGrp[mj2].base]++;
          repeatedCount += mGrp.length;
          minActive = true;
        } else {
          rows = mSnap;
          retired[TM] = true;
        }
      }
    }

    // Phase B1 — Model B tier 단위 균일 반복 (기존 greedy). max cap 준수: 다음 pass 로
    //   디자인 하나라도 max 를 넘기면 그 tier 은퇴 (hard max — 남는 공간은 justify 몫).
    var anyActive = true;
    while (anyActive && guard++ < 100000) {
      anyActive = false;
      for (var tsq = 0; tsq < tierSeq.length; tsq++) {
        var T = tierSeq[tsq];
        if (retired[T]) continue;
        var grp = tierGroups[T];
        if (tierNoRows[T] || !grp || grp.length === 0) { retired[T] = true; continue; }
        var maxT = _pkgMax(T);
        var canRepeat = true;
        for (var mc = 0; mc < grp.length; mc++) {
          if (counts[grp[mc].base] + 1 > maxT) { canRepeat = false; break; }
        }
        if (!canRepeat) { retired[T] = true; continue; }

        var snap = _snapPack(rows);                 // atomic pass: 전부 1장씩, 실패 시 통째 롤백
        var passOk = true;
        for (var pj = 0; pj < grp.length; pj++) {
          if (_placeBanded(rows, grp[pj], binW, binH, gap)) continue;
          passOk = false;                           // 새 행에도 안 들어감 → pass 불가
          break;
        }
        if (passOk) {
          for (var pj2 = 0; pj2 < grp.length; pj2++) counts[grp[pj2].base]++;
          repeatedCount += grp.length;
          anyActive = true;
        } else {
          rows = snap;                              // pass 중 추가분·신규행 전부 폐기
          retired[T] = true;
        }
      }
    }

    // min 구제 column (2026-08-19) — count < min 인 디자인 (Phase A 실패 colOnly 포함) 을
    //   일반 column 채움 전에 우선 배치해 min 보장 복원. tier 큰 순서로, 폭 남는 행 어디든.
    //   R8c 케이스: 행을 못 연 S tier 가 XS column 독식에 밀려 0장이 되던 문제 해소.
    //   XXL 은 column 자체가 비실용적 (2단 127mm+) 이라 기존대로 제외 — 미달 시 leftover 보고.
    var resActive = true;
    while (resActive) {
      resActive = false;
      for (var rt = 0; rt < tierSeq.length && !resActive; rt++) {
        var rGrp = tierGroups[tierSeq[rt]];
        if (!rGrp || rGrp.length === 0) continue;
        var deficit = [];
        for (var rd = 0; rd < rGrp.length; rd++) {
          if (counts[rGrp[rd].base] < _pkgMin(rGrp[rd].tier)) deficit.push(rGrp[rd]);
        }
        if (deficit.length === 0) continue;
        for (var rr = 0; rr < rows.length; rr++) {
          var rCol = _buildTierColumn(deficit, 0, binW - rows[rr].w - gap, rows[rr].h, gap, counts);
          if (rCol === null) continue;
          _addToShelfRow(rows[rr], rCol, gap);
          for (var rc = 0; rc < rCol.cells.length; rc++) {
            var rb = rCol.cells[rc].payload.base;
            if (counts[rb] > 0) repeatedCount++;
            counts[rb]++;
          }
          resActive = true;   // counts 갱신됐으니 deficit 재계산 후 재시도
          break;
        }
      }
    }

    // 고아 행 채움 (2026-08-19) — tierNoRows 로 반복이 막힌 tier 의 기존 행 (Phase A 가 연
    //   행) 을 자기 tier 디자인 반복으로 가로 채움. max 준수, 행 키 성장 금지 (isLast=false).
    //   R8c 케이스: 마지막 자투리 높이에 턱걸이로 열린 행이 한 장 덩그러니 남던 문제 해소.
    for (var orI = 0; orI < rows.length; orI++) {
      var orRow = rows[orI];
      if (!orRow.tierLock || !tierNoRows[orRow.tierLock]) continue;
      var orGrp = tierGroups[orRow.tierLock];
      if (!orGrp || orGrp.length === 0) continue;
      var orCur = 0;
      var orAdded = true;
      while (orAdded) {
        orAdded = false;
        for (var os = 0; os < orGrp.length; os++) {
          var oi = (orCur + os) % orGrp.length;
          var op = orGrp[oi];
          if (counts[op.base] >= _pkgMax(op.tier)) continue;
          if (_tryAddToBandRow(orRow, op, false, binW, binH, gap, false)) {
            if (counts[op.base] > 0) repeatedCount++;
            counts[op.base]++;
            orCur = oi + 1;
            orAdded = true;
            break;
          }
        }
      }
    }

    // Column 채움 — 각 행 남은 폭에 작은 tier column. 행 키는 안 키움. max cap 준수 +
    //   시작 tier 회전 (한 tier 가 남은 폭을 독식하지 않게 — max 와 이중 안전판).
    var colCursor = { XS: 0, S: 0, M: 0, L: 0 };
    var ascTiers = ["XS", "S", "M", "L"];
    var colStart = 0;
    for (var cr = 0; cr < rows.length; cr++) {
      while (true) {
        var col = null;
        var used = colStart;
        for (var ct = 0; ct < ascTiers.length; ct++) {
          used = (colStart + ct) % ascTiers.length;
          var cGrp = tierGroups[ascTiers[used]];
          if (!cGrp || cGrp.length === 0) continue;
          col = _buildTierColumn(cGrp, colCursor[ascTiers[used]], binW - rows[cr].w - gap, rows[cr].h, gap, counts);
          if (col !== null) { colCursor[ascTiers[used]] = col.nextIdx; break; }
        }
        if (col === null) break;
        colStart = (used + 1) % ascTiers.length;
        _addToShelfRow(rows[cr], col, gap);
        for (var cc = 0; cc < col.cells.length; cc++) {
          var cb = col.cells[cc].payload.base;
          if (counts[cb] > 0) repeatedCount++;
          counts[cb]++;
        }
      }
    }

    // column 구제까지 끝난 뒤에도 0장인 보류 디자인만 진짜 leftover (시트보다 큰 오버사이즈 등).
    for (var lo = 0; lo < colOnly.length; lo++) {
      if (!_pairPlacedInRows(rows, colOnly[lo])) leftover.push(colOnly[lo]);
    }

    // min 미달 집계 — 완료 메시지 경고용 (공간 부족으로 min 을 못 채운 디자인).
    var minShortfall = [];
    for (var msf = 0; msf < n; msf++) {
      var mp = ordered[msf];
      if (counts[mp.base] < _pkgMin(mp.tier)) {
        minShortfall.push({ base: mp.base, tier: mp.tier, count: counts[mp.base], min: _pkgMin(mp.tier) });
      }
    }

    // 행 키 내림차순 정렬 (AllSizes 와 동일한 위→아래 흐름). _shelfRowsToPlaced 가 y 재계산.
    var deco = [];
    for (var sr = 0; sr < rows.length; sr++) deco.push({ r: rows[sr], i: sr });
    deco.sort(function (a, b) { return (b.r.h - a.r.h) || (a.i - b.i); });
    rows = [];
    for (var dr = 0; dr < deco.length; dr++) rows.push(deco[dr].r);

    var placed = _shelfRowsToPlaced(rows, binW, binH, gap);
    return {
      placed: placed,
      leftover: leftover,
      rows: rows,
      repeatedCount: repeatedCount,
      cols: 0,
      gridRows: rows.length,
      slots: placed.length,
      counts: counts,
      minShortfall: minShortfall
    };
  }
  function _tierAreaBudget(pairs, binW, binH) {
    var budget = binW * binH * TIER_PACK_EFFICIENCY;

    var buckets = { XS: [], S: [], M: [], L: [], XL: [], XXL: [] };
    for (var i = 0; i < pairs.length; i++) {
      _tierBox(pairs[i]);
      var t = pairs[i].tier;
      if (!buckets[t]) t = TIER_DEFAULT;
      buckets[t].push(pairs[i]);
    }

    function _area(p) { return p.cellW * p.cellH; }
    function _sum(arr) { var s = 0; for (var k = 0; k < arr.length; k++) s += _area(arr[k]); return s; }
    function _total() {
      return _sum(buckets.XS) + _sum(buckets.S) + _sum(buckets.M) + _sum(buckets.L) +
        _sum(buckets.XL) + _sum(buckets.XXL);
    }

    var trimmed = [];
    var trimmedByTier = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
    var ladder = ["XS", "S", "M", "L", "XL"];
    for (var li = 0; li < ladder.length && _total() > budget; li++) {
      var b = buckets[ladder[li]];
      b.sort(function (a, c) { return _area(a) - _area(c); });
      while (b.length > 0 && _total() > budget) {
        trimmed.push(b.shift());
        trimmedByTier[ladder[li]]++;
      }
    }

    var rejected = (_total() > budget);  // XS~XL 다 비웠는데도 초과 = XXL-only 초과

    var kept = [];
    var keepOrder = ["XXL", "XL", "L", "M", "S", "XS"];
    for (var ko = 0; ko < keepOrder.length; ko++) {
      var kb = buckets[keepOrder[ko]];
      for (var kj = 0; kj < kb.length; kj++) kept.push(kb[kj]);
    }

    return {
      kept: kept,
      trimmed: trimmed,
      trimmedByTier: trimmedByTier,
      rejected: rejected,
      famPt2: _sum(buckets.XXL),
      budgetPt2: budget
    };
  }
  function _newShelfRow(y) {
    return { y: y, w: 0, h: 0, items: [] };
  }
  function _snapPack(rowsArr) {
    var rs = [];
    for (var i = 0; i < rowsArr.length; i++) {
      var r = rowsArr[i];
      rs.push({ y: r.y, w: r.w, h: r.h, items: r.items.slice(), tierLock: r.tierLock });
    }
    return rs;
  }
  function _canAddToShelfRow(row, item, binW, binH, gap) {
    if (item.w > binW || item.h > binH) return false;
    var nextW = row.items.length > 0 ? row.w + gap + item.w : item.w;
    var nextH = row.h > item.h ? row.h : item.h;
    return nextW <= binW && row.y + nextH <= binH;
  }
  function _heightsClose(h1, h2) {
    var lo = h1 < h2 ? h1 : h2;
    var hi = h1 < h2 ? h2 : h1;
    return lo >= hi * BAND_CELL_TOL;
  }
  function _addToShelfRow(row, item, gap) {
    row.w = row.items.length > 0 ? row.w + gap + item.w : item.w;
    if (item.h > row.h) row.h = item.h;
    row.items.push(item);
  }
  function _shelfRowsToPlaced(rows, binW, binH, gap) {
    var placed = [];
    if (!rows || rows.length === 0) return placed;

    var R = rows.length;
    var sumH = 0;
    for (var k = 0; k < R; k++) sumH += rows[k].h;

    // 세로: 여유 충분하면 균등 justify, 빡빡하면 inner 행 간격 = 최소 gap 보장(패커가 행 사이 gap 을
    //   이미 확보해 binH 에 맞췄으므로 inner=gap 강제는 오버플로우 없음). 남는 공간만 outer top/bottom 으로.
    var justifyVGap = (binH - sumH) / (R + 1);
    if (justifyVGap < 0) justifyVGap = 0;
    var vGap = justifyVGap >= gap ? justifyVGap : gap;
    var topV = (binH - sumH - (R - 1) * vGap) / 2;
    if (topV < 0) { vGap = justifyVGap; topV = justifyVGap; }

    var yCursor = topV;
    for (var r = 0; r < R; r++) {
      var row = rows[r];
      var n = row.items.length;
      if (n === 0) continue;

      var sumW = 0;
      for (var i = 0; i < n; i++) sumW += row.items[i].w;

      // 가로 (per-row): 여유 충분하면 균등 justify, 빡빡하면 inner = 최소 gap 보장(패커가 확보, 오버플로우 없음).
      var justifyHGap = (binW - sumW) / (n + 1);
      if (justifyHGap < 0) justifyHGap = 0;
      var hGap = justifyHGap >= gap ? justifyHGap : gap;
      var xLeft = (binW - sumW - (n - 1) * hGap) / 2;
      if (xLeft < 0) { hGap = justifyHGap; xLeft = justifyHGap; }

      var xCursor = xLeft;
      for (var j = 0; j < n; j++) {
        var item = row.items[j];

        // VStack item (AllSizes backfill): 이종 셀 세로 스택으로 expand. 셀별 payload 를 갖고,
        //   각 셀은 슬롯 폭 안에서 가로 center, 스택 전체는 row 안에서 세로 center.
        if (item.isVStack) {
          var vY = yCursor + (row.h - item.h) / 2;
          for (var vc = 0; vc < item.cells.length; vc++) {
            var vCell = item.cells[vc];
            placed.push({ x: xCursor + (item.w - vCell.w) / 2, y: vY, w: vCell.w, h: vCell.h, payload: vCell.payload });
            vY += vCell.h + gap;
          }
          xCursor += item.w + hGap;
          continue;
        }

        var yCentered = yCursor + (row.h - item.h) / 2;
        placed.push({ x: xCursor, y: yCentered, w: item.w, h: item.h, payload: item.payload, rotated: item.rotated });
        xCursor += item.w + hGap;
      }

      yCursor += row.h + vGap;
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
module.exports = { SCRIPT_VARIANT: SCRIPT_VARIANT, SCRIPT_TITLE: SCRIPT_TITLE, MM_TO_PT: MM_TO_PT, BODY_PADDING_MM: BODY_PADDING_MM, GAP_DEFAULT_MM: GAP_DEFAULT_MM, BAND_CELL_TOL: BAND_CELL_TOL, SLOTS_BY_SIZE: SLOTS_BY_SIZE, PACKAGE_SIZE_VALUE: PACKAGE_SIZE_VALUE, PACKAGE_MAX_DESIGNS: PACKAGE_MAX_DESIGNS, ALLSIZES_SIZE_VALUE: ALLSIZES_SIZE_VALUE, ALLSIZES_ORDER_MM: ALLSIZES_ORDER_MM, ALLSIZES_FILL: ALLSIZES_FILL, ALLSIZES_FILL_MM: ALLSIZES_FILL_MM, ALLSIZES_HERO_COUNT: ALLSIZES_HERO_COUNT, DESIGN_LIMIT_BY_SIZE_MM: DESIGN_LIMIT_BY_SIZE_MM, SIZE_OPTIONS: SIZE_OPTIONS, SIZE_VALUES: SIZE_VALUES, SIZE_LETTERS: SIZE_LETTERS, SIZE_MM_LABEL: SIZE_MM_LABEL, SIZE_DEFAULT_INDEX: SIZE_DEFAULT_INDEX, CUT_MARGIN_OPTIONS: CUT_MARGIN_OPTIONS, CUT_MARGIN_VALUES: CUT_MARGIN_VALUES, CUT_MARGIN_DEFAULT_INDEX: CUT_MARGIN_DEFAULT_INDEX, MATERIAL_OPTIONS: MATERIAL_OPTIONS, TIER_SIZE_MM: TIER_SIZE_MM, TIER_DEFAULT: TIER_DEFAULT, TIER_TOKEN_RE: TIER_TOKEN_RE, TIER_PACK_EFFICIENCY: TIER_PACK_EFFICIENCY, PKG_COUNT_BY_TIER: PKG_COUNT_BY_TIER, BUCKET_TOKEN_RE: BUCKET_TOKEN_RE, BUCKETS: BUCKETS, BUCKET_TIERS: BUCKET_TIERS, TIER_TO_BUCKET: TIER_TO_BUCKET, PACKAGE_LADDERS: PACKAGE_LADDERS, PACKAGE_SHEET_OPTIONS: PACKAGE_SHEET_OPTIONS, PACKAGE_SHEET_VALUES: PACKAGE_SHEET_VALUES, PACKAGE_SHEET_DEFAULT_INDEX: PACKAGE_SHEET_DEFAULT_INDEX, _showDialog: _showDialog, _buildOrderDetail: _buildOrderDetail, _orderDetailToString: _orderDetailToString, _scriptFileHint: _scriptFileHint, _sizeLetter: _sizeLetter, _inchStr: _inchStr, _mmCmStr: _mmCmStr, _drawProductionHeader: _drawProductionHeader, _nfcHangul: _nfcHangul, _resolveHangulFont: _resolveHangulFont, _applyHangulFontOverride: _applyHangulFontOverride, _uniquePairsFromPlaced: _uniquePairsFromPlaced, _ensureTraceStashLayer: _ensureTraceStashLayer, _cleanupTraceStash: _cleanupTraceStash, _buildCutlineCache: _buildCutlineCache, _ensureArtMaster: _ensureArtMaster, _placePhotoSticker: _placePhotoSticker, _traceAndUnite: _traceAndUnite, _resolveTemplate: _resolveTemplate, _openTemplateDoc: _openTemplateDoc, _findInfoPath: _findInfoPath, _newDocForImage: _newDocForImage, _collectPairs: _collectPairs, _decodeName: _decodeName, _pngAspect: _pngAspect, _measurePairAspect: _measurePairAspect, _deriveDefaultCustomerName: _deriveDefaultCustomerName, _safeRedrawAndGC: _safeRedrawAndGC, _stripPSDPaths: _stripPSDPaths, _stripEmbeddedPSDPathsNear: _stripEmbeddedPSDPathsNear, _stripFills: _stripFills, _findCutline: _findCutline, _deepFindFirstPath: _deepFindFirstPath, _deepFindByName: _deepFindByName, _ensureCutContour: _ensureCutContour, _forceCutContourStroke: _forceCutContourStroke, _itemForSize: _itemForSize, _copyItems: _copyItems, _sortShelfItemsDesc: _sortShelfItemsDesc, _packAllSizes: _packAllSizes, _rescueByEviction: _rescueByEviction, _buildAllSizesSummary: _buildAllSizesSummary, _appendShelfRowsOnce: _appendShelfRowsOnce, _appendShelfFillerRows: _appendShelfFillerRows, _pickShelfSeed: _pickShelfSeed, _buildSameSizeColumn: _buildSameSizeColumn, _countSizeInRows: _countSizeInRows, _aspectBandGridPack: _aspectBandGridPack, _bandClusters: _bandClusters, _mergeClosestBands: _mergeClosestBands, _bandGridStr: _bandGridStr, _uniformGridPack: _uniformGridPack, _packageDistStr: _packageDistStr, _tierBox: _tierBox, _tryAddToBandRow: _tryAddToBandRow, _placeBanded: _placeBanded, _pkgMin: _pkgMin, _pkgMax: _pkgMax, _buildTierColumn: _buildTierColumn, _pairPlacedInRows: _pairPlacedInRows, _packPackage: _packPackage, _tierAreaBudget: _tierAreaBudget, _newShelfRow: _newShelfRow, _snapPack: _snapPack, _canAddToShelfRow: _canAddToShelfRow, _heightsClose: _heightsClose, _addToShelfRow: _addToShelfRow, _shelfRowsToPlaced: _shelfRowsToPlaced, _sortedPairsForShelf: _sortedPairsForShelf, _trim: _trim, _todayIso: _todayIso, _timestamp: _timestamp, _resolveOutputFolder: _resolveOutputFolder, _saveAi: _saveAi, _pad2: _pad2 };