// ═══════════════════════════════════════════════════════════════
//  Everstory Name Arc 시트 (사진+머리 위 곡선 이름 × 여러 장)
//
//  template_cutout_v2.ait (운영 v2 브랜드 템플릿) 위에, 레퍼런스의
//  사진 실루엣 상단에 이름만 완만한 아치형으로 얹어 uniform grid 로 깐다.
//
//  유닛 크기는 사진 크기 그대로이며 mixed 의 사이즈/그리드 로직과 호환한다.
//  칼선은 실루엣 trace 그대로이며 이름은 추가 칼선을 만들지 않는다.
//
//  플로우 (mixed 와 동일): 02_cutout 폴더 → 페어 multiselect → 사이즈 →
//  이름 → 시트 생성 → info > header > header_right 값 주입 →
//  03_output/{ts}_{inch}NAME_sheet01.ai 자동 저장.
//
//  단순화: 단일 사이즈 uniform grid 만. Package/전 사이즈/회전 없음.
//  칼선 여백 옵션 없음 (사진에 베이크된 여백 그대로 — 여백 없는 사진은
//  칼선이 피사체에 붙는다).
//
//  함정 (keepsake 에서 실측 — 되돌리지 말 것):
//   · paste 셀렉션 참조를 embed 리플로우 이후에 쓰면 stale — TraceStash
//     hidden 보관 후 duplicate 로 fresh 참조 획득 (mixed 와 동일 구조).
//   · Pathfinder 는 stroke-only/paint 없는 패스에서 빈 결과 — union 전
//     _forceTempFill, 합친 후 CutContour 스트로크 복원.
// ═══════════════════════════════════════════════════════════════

// Everstory Name Arc Sheet: no plaque or ornament; only editable curved name text.
(function () {
  "use strict";

  var SCRIPT_VARIANT = "name arc v1";
  var SCRIPT_TITLE = "Everstory Name Arc Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var TEMPLATE_NAME = "template_cutout_v2.ait";
  var BODY_PADDING_MM = 2;
  var GAP_DEFAULT_MM = 2.5;

  // ── 명패 유닛 비율 (레퍼런스 실측) ─────────────────────────────
  var NAME_ARC_W_RATIO = 0.72;
  var NAME_BOTTOM_ARC_W_RATIO = 0.90;
  var NAME_ARC_RISE_RATIO = 0.10;
  var NAME_SIZE_AT_ONE_IN_PT = 15;
  var NAME_HANGUL_SIZE_RATIO = 0.78;
  var NAME_MIN_HORIZONTAL_SCALE = 62;
  var NAME_TRACKING = 10;
  var NAME_TEXT_STROKE_PT = 0.25;
  // 예전엔 이름 흰 테두리 두께였으나 지금은 여백을 주지 않는다
  // (칼선 = 글자 윤곽 그대로, Offset Path 는 나중에 수동으로).
  // 남은 용도는 그리드에서 이름 자리를 잡을 때의 세로 여유분뿐이다.
  var NAME_HALO_PT = 2.2;
  // 글자별 bounce (아치 대신 쓰는 움직임). 사진 위 이름이라 과하지 않게.
  var NAME_BOUNCE_RISE_RATIO = 0.09;
  var NAME_BOUNCE_ROT_DEG = 4.5;
  var NAME_BOUNCE_SCALE_VAR = 0.06;
  var NAME_CROWN_LIFT_RATIO = 0.08;
  var NAME_CHIN_DROP_RATIO = 0.76;
  var NAME_BOTTOM_RISE_RATIO = 0.16;
  var NAME_BOTTOM_GAP_MM = 0.45;
  var NAME_LEGIBILITY_MIN_MM = 25.4;
  var HANGUL_FONT_CACHE = null;
  var HANGUL_FONT_RESOLVED = false;

  // ── 이름 스타일 프리셋 ────────────────────────────────────────
  // Everstory_calligraphy.jsx 의 뮤트 팔레트 시트에서 고른 6종.
  // 각 프리셋은 서체 + 3가지 색을 함께 들고 있다:
  //   ink = 배경 위에 얹을 때의 글자색 (보통 밝은 색)
  //   solo = 배경 없이 글자만 쓸 때의 글자색 (그 스티커의 대표색)
  //   bg / sh = 컬러 배경과 하드 그림자
  // ink 를 배경 없이 쓰면 흰 글자가 흰 종이에서 사라지므로 solo 를 따로 둔다.
  var NAME_FONT_OPTIONS = [
    { label: "Fredoka Bold — 통통한 라운드 (기본)", hangul: false,
      cands: ["Fredoka-Bold", "Fredoka-SemiBold"],
      ink: "FFFFFF", solo: "C4756B", bg: "C4756B", sh: "7A423B" },
    { label: "Titan One — 레트로 굵은 라운드", hangul: false,
      cands: ["TitanOne"],
      ink: "F5EFE6", solo: "8A7BA8", bg: "8A7BA8", sh: "4E4463" },
    { label: "Luckiest Guy — 스티커 클래식 (대문자 전용)", hangul: false,
      cands: ["LuckiestGuy-Regular"],
      ink: "7A4A3A", solo: "7A4A3A", bg: "EADFC8", sh: "C7B393" },
    { label: "Archivo Black — 초굵은 그로테스크", hangul: false,
      cands: ["ArchivoBlack-Regular"],
      ink: "EADFC8", solo: "3A3733", bg: "3A3733", sh: "8A7BA8" },
    { label: "Shantell Sans Bold — 말랑한 손글씨", hangul: false,
      cands: ["ShantellSans-Bold"],
      ink: "FFFFFF", solo: "C98F7A", bg: "C98F7A", sh: "7A4A3A" },
    { label: "Chewy — 통통한 손글씨", hangul: false,
      cands: ["Chewy-Regular"],
      ink: "FFFFFF", solo: "A88BA8", bg: "A88BA8", sh: "5F4A5F" }
  ];
  var NAME_FONT_DEFAULT_INDEX = 0;

  // 스타일 단계. 0 → 1 → 2 로 갈수록 이름의 존재감이 커진다.
  var NAME_STYLE_OPTIONS = [
    "서체만 — 글자 먹",
    "서체 + 글자색",
    "서체 + 글자색 + 컬러 배경 + 그림자"
  ];
  var NAME_STYLE_INK_ONLY = 0, NAME_STYLE_COLOR = 1, NAME_STYLE_LAYERED = 2;
  var NAME_STYLE_DEFAULT_INDEX = 0;

  // 레이어드 모드에서 잉크 높이 대비 비율
  var NAME_BG_OFFSET_RATIO = 0.20;   // 컬러 배경이 글자 밖으로 벌어지는 양
  var NAME_SHADOW_RATIO = 0.06;      // 하드 그림자 우하향 이동량

  // 메인 플로우에서 옵션으로 덮어쓴다. var 할당은 호이스팅되지 않으므로
  // 선언은 반드시 여기(플로우 위)에 둘 것.
  var NAME_FONT_INDEX = 0;
  var NAME_STYLE_MODE = 0;
  var NAME_FONT_CACHE = {};

  var SIZE_OPTIONS = [
    "0.75\" / 19mm", "1\" / 25mm", "1.25\" / 32mm",
    "1.5\" / 38mm", "2\" / 51mm", "2.5\" / 64mm"
  ];
  var SIZE_VALUES = [19.05, 25.4, 31.75, 38.1, 50.8, 63.5];
  var SIZE_DEFAULT_INDEX = 4;    // 2" 기본
  var INCH_STR = { 19.05: "0.75in", 25.4: "1in", 31.75: "1.25in", 38.1: "1.5in", 50.8: "2in", 63.5: "2.5in" };

  var TIER_TOKEN_RE = /_(XXL|XL|XS|FAM|S|M|L)$/i;
  var TIER_DEFAULT = "S";

  var testConfig = $.global.__EVERSTORY_WITH_NAME_TEST__;

  function _fail(m) {
    if (testConfig) { testConfig.lastMessage = "실패: " + m; }
    else { alert(m); }
  }

  // ── 팔레트/폰트 (명패 = keepsake 와 동일) ──────────────────────
  function C(r, g, b) { var c = new RGBColor(); c.red = r; c.green = g; c.blue = b; return c; }
  var INK = C(35, 31, 29);
  var WHITE = C(255, 255, 255);
  // 베지어 데이터 테이블 — 메인 플로우가 함수보다 먼저 실행되므로
  // (var 값 할당은 호이스팅 안 됨) 반드시 최상단에 둔다.
  // ═════════ 입력 ═════════
  var inputFolder = (testConfig && testConfig.inputFolder) ?
    new Folder(testConfig.inputFolder) :
    Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!inputFolder) return;

  var pairs = _collectPairs(inputFolder);
  if (pairs.length === 0) {
    _fail("선택한 폴더에 _clean.psd + _sil.png 페어가 없습니다.");
    return;
  }

  var defaultName = _composeHangulNFC(_deriveDefaultCustomerName(inputFolder));
  var options = (testConfig && testConfig.options) ? testConfig.options : _showNameDialog(pairs, defaultName);
  if (!options) return;
  options.nameText = _composeHangulNFC(String(options.nameText));
  options.namePosition = (options.namePosition === "bottom") ? "bottom" : "top";
  var fi = options.nameFontIndex;
  options.nameFontIndex =
    (fi >= 0 && fi < NAME_FONT_OPTIONS.length) ? fi : NAME_FONT_DEFAULT_INDEX;
  NAME_FONT_INDEX = options.nameFontIndex;
  var sm = options.nameStyleMode;
  options.nameStyleMode =
    (sm >= 0 && sm < NAME_STYLE_OPTIONS.length) ? sm : NAME_STYLE_DEFAULT_INDEX;
  NAME_STYLE_MODE = options.nameStyleMode;

  var selectedPairs = [];
  for (var si = 0; si < options.pairIndexes.length; si++) {
    selectedPairs.push(pairs[options.pairIndexes[si]]);
  }
  if (selectedPairs.length === 0) { _fail("선택된 사진이 없습니다."); return; }

  var templateFile = _resolveTemplate();
  if (!templateFile || !templateFile.exists) {
    _fail(TEMPLATE_NAME + " 를 찾을 수 없습니다.");
    return;
  }

  var doc = _openTemplateDoc(templateFile);

  var bodyPath, headerRightText;
  try {
    bodyPath = _findInfoPath(doc, "body");
    headerRightText = _findInfoPath(doc, "header_right");
    if (headerRightText.typename !== "TextFrame") {
      throw new Error("info > header > header_right 가 TextFrame 이 아닙니다 (현재: " +
        headerRightText.typename + "). 템플릿에서 같은 이름의 다른 오브젝트를 제거하세요.");
    }
  } catch (eTpl) {
    _fail(eTpl.message);
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose0) {}
    return;
  }

  var printLayer = doc.layers.add();
  printLayer.name = "PrintData";
  var kissLayer = doc.layers.add();
  kissLayer.name = "KissCut";
  var cutSpot = _ensureCutContour(doc);

  var padPt = BODY_PADDING_MM * MM_TO_PT;
  var gapPt = GAP_DEFAULT_MM * MM_TO_PT;
  var sizePt = options.sizeMm * MM_TO_PT;
  var nameAllowancePt = _nameAllowance(sizePt);

  var bb = bodyPath.geometricBounds;
  var bL = bb[0], bT = bb[1], bR = bb[2], bB = bb[3];
  var binW = (bR - bL) - 2 * padPt;
  var binH = (bT - bB) - 2 * padPt;
  if (binW <= 0 || binH <= 0) {
    _fail("info > body 영역이 BODY_PADDING_MM 보다 작습니다.");
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose1) {}
    return;
  }

  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

  var fatalError = "";
  var failedItems = [];
  var placedCount = 0;
  var packInfo = { cols: 0, rows: 0, slots: 0 };

  try {
    // ── 셀 크기: 유닛 = 사진 (긴 변 = 선택 사이즈), 디자인 중 최대 ──
    var cellW = 0, cellH = 0;
    for (var ai = 0; ai < selectedPairs.length; ai++) {
      var asp = _measurePairAspect(selectedPairs[ai]);
      var w, h;
      if (asp >= 1) { w = sizePt; h = sizePt / asp; }
      else { w = sizePt * asp; h = sizePt; }
      selectedPairs[ai].cellW = w;
      selectedPairs[ai].cellH = h + nameAllowancePt;
      if (w > cellW) cellW = w;
      if (h + nameAllowancePt > cellH) cellH = h + nameAllowancePt;
    }

    var cols = Math.floor((binW + gapPt) / (cellW + gapPt));
    var rows = Math.floor((binH + gapPt) / (cellH + gapPt));
    if (testConfig && testConfig.maxSlots === 1) {
      cols = 1;
      rows = 1;
    }
    if (cols < 1 || rows < 1) {
      throw new Error("선택 사이즈가 body 보다 큽니다 (" + options.sizeMm + "mm).");
    }
    var slots = cols * rows;
    packInfo = { cols: cols, rows: rows, slots: slots };

    // 디자인 수 > 슬롯 수면 앞에서부터 cap (mixed 의 auto-cap 정신)
    if (selectedPairs.length > slots) {
      selectedPairs = selectedPairs.slice(0, slots);
    }

    // Trace cache + hidden art master
    var traceFailures = _buildCutlineCache(doc, selectedPairs, cutSpot);
    for (var tf = 0; tf < traceFailures.length; tf++) failedItems.push(traceFailures[tf]);

    // trace 실패 페어 제외
    var livePairs = [];
    for (var lp = 0; lp < selectedPairs.length; lp++) {
      if (selectedPairs[lp].cachedCutline && selectedPairs[lp].cutInfo) livePairs.push(selectedPairs[lp]);
    }
    if (livePairs.length === 0) throw new Error("사용 가능한 페어가 없습니다 (trace 전부 실패).");

    // ── uniform grid — 균등 여백 분배, round-robin 채움 ──────────
    var xGap = (binW - cols * cellW) / (cols + 1);
    var yGap = (binH - rows * cellH) / (rows + 1);

    var slotIdx = 0;
    for (var r = 0; r < rows; r++) {
      for (var cIdx = 0; cIdx < cols; cIdx++) {
        var pair = livePairs[slotIdx % livePairs.length];
        var x = bL + padPt + xGap + cIdx * (cellW + xGap);
        var y = bT - padPt - yGap - r * (cellH + yGap);
        try {
          _placeNamedSticker(doc, pair, options.nameText, options.namePosition, x, y, cellW, cellH, nameAllowancePt, printLayer, kissLayer, cutSpot);
          placedCount++;
        } catch (ePlace) {
          failedItems.push({ base: pair.base, error: (ePlace && ePlace.message) ? ePlace.message : String(ePlace) });
        }
        slotIdx++;
      }
    }
    _safeRedrawAndGC();

    // ── 헤더 주입 (v2 규약: .contents 만 교체) ───────────────────
    headerRightText.contents = options.nameText + " · NAME-" +
      (options.namePosition === "bottom" ? "BOTTOM " : "TOP ") +
      (INCH_STR[options.sizeMm] || Math.round(options.sizeMm) + "mm") + " · " + placedCount + "장";
    _applyHangulFontOverride(headerRightText, _getHangulFont());
  } catch (eMain) {
    fatalError = ((eMain && eMain.message) ? eMain.message : String(eMain)) +
      " @line " + ((eMain && eMain.line) ? eMain.line : "?");
  } finally {
    _cleanupTraceStash(doc);
    app.userInteractionLevel = prevInteraction;
  }

  if (fatalError) {
    _fail(fatalError + "\n\n시트는 저장하지 않았습니다. 문서를 확인 후 닫으세요.");
    return;
  }

  try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eKiss) {}
  try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (ePrint) {}
  doc.selection = null;

  // ── 03_output 자동 저장 ─────────────────────────────────────
  var savedPath = "", saveError = "";
  try {
    var outFolder = _resolveOutputFolder(inputFolder);
    var sizeTag = (INCH_STR[options.sizeMm] || Math.round(options.sizeMm) + "mm") +
      (options.namePosition === "bottom" ? "NAMEBOTTOM" : "NAMETOP");
    var fileName = _timestamp() + "_" + sizeTag + "_sheet01.ai";
    var saveFile = new File(outFolder.fsName + "/" + fileName);
    _saveAi(doc, saveFile);
    savedPath = saveFile.fsName;
  } catch (eSave) {
    saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
  }

  var msg =
    "완료: 곡선 이름 시트 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + " (템플릿: " + TEMPLATE_NAME + ")\n" +
    "이름: " + options.nameText + "\n" +
    "위치: " + (options.namePosition === "bottom" ? "아래 (턱 아래)" : "위 (정수리 위)") + "\n" +
    "서체: " + NAME_FONT_OPTIONS[options.nameFontIndex].label + "\n" +
    "스타일: " + NAME_STYLE_OPTIONS[options.nameStyleMode] + "\n" +
    "사이즈: " + (INCH_STR[options.sizeMm] || options.sizeMm + "mm") + " (사진 긴 변 기준)\n" +
    "그리드: " + packInfo.cols + "×" + packInfo.rows + " / 배치 " + placedCount + "장 / 디자인 " + selectedPairs.length + "개\n" +
    (options.sizeMm < NAME_LEGIBILITY_MIN_MM ? "⚠ 작은 사이즈입니다. 이름 가독성을 확인하세요.\n" : "") +
    (savedPath ? "저장: " + savedPath : "저장 실패: " + saveError) + "\n\n" +
    "QC: ① 사진-칼선 정합 ② 이름 중앙 정렬 ③ 이름-실루엣 연결 ④ 가독성";

  if (failedItems.length > 0) {
    msg += "\n\n실패 " + failedItems.length + "건:";
    for (var fk = 0; fk < Math.min(failedItems.length, 8); fk++) {
      msg += "\n- " + failedItems[fk].base + ": " + failedItems[fk].error;
    }
  }

  if (testConfig) {
    testConfig.lastMessage = msg;
    if (testConfig.closeAfter) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eTestClose) {}
    }
  } else {
    alert(msg);
  }


  // ═════════════════════════════════════════════════════════
  //  곡선 이름 생성
  // ═════════════════════════════════════════════════════════

  function _resolveFont(cands) {
    var i, f, k, w;
    for (i = 0; i < cands.length; i++) {
      try { return app.textFonts.getByName(cands[i]); } catch (e) {}
    }
    var wanted = [];
    for (i = 0; i < cands.length; i++) wanted.push(cands[i].toLowerCase().replace(/[^a-z0-9]/g, ""));
    for (f = 0; f < app.textFonts.length; f++) {
      var tfont = app.textFonts[f];
      var keys = [String(tfont.name), String(tfont.family) + String(tfont.style)];
      for (k = 0; k < keys.length; k++) {
        var norm = keys[k].toLowerCase().replace(/[^a-z0-9]/g, "");
        for (w = 0; w < wanted.length; w++) if (norm === wanted[w]) return tfont;
      }
    }
    return null;
  }

  function _composeHangulNFC(s) {
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
            if (T >= 0x11A8 && T <= 0x11C2) {
              Tidx = T - 0x11A7;
              step = 3;
            }
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

  function _containsHangul(s) {
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if ((c >= 0xAC00 && c <= 0xD7AF) ||
          (c >= 0x1100 && c <= 0x11FF) ||
          (c >= 0x3130 && c <= 0x318F)) return true;
    }
    return false;
  }

  function _getHangulFont() {
    if (!HANGUL_FONT_RESOLVED) {
      HANGUL_FONT_CACHE = _resolveFont([
        "TTOmniGothicB", "AppleSDGothicNeo-Bold",
        "TTOmniGothicL", "AppleSDGothicNeo-SemiBold",
        "AppleSDGothicNeo-Regular", "AppleGothic"
      ]);
      HANGUL_FONT_RESOLVED = true;
    }
    return HANGUL_FONT_CACHE;
  }

  function _applyHangulFontOverride(textFrame, hangulFont) {
    if (!hangulFont) return;
    var s = textFrame.contents;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if ((c >= 0xAC00 && c <= 0xD7AF) ||
          (c >= 0x1100 && c <= 0x11FF) ||
          (c >= 0x3130 && c <= 0x318F)) {
        try { textFrame.textRange.characters[i].textFont = hangulFont; } catch (eChar) {}
      }
    }
  }

  // Name arc geometry and typography
  function _nameFontSizeForLongSide(longSidePt) {
    return NAME_SIZE_AT_ONE_IN_PT * (longSidePt / 72);
  }

  function _nameArtworkText(nameText) {
    return String(nameText).replace(/\s+/g, "\u2009");
  }

  function _nameAllowance(longSidePt) {
    return _nameFontSizeForLongSide(longSidePt) * 1.15 + NAME_HALO_PT * 2;
  }

  function _nameFontForIndex(idx) {
    if (NAME_FONT_CACHE.hasOwnProperty(idx)) return NAME_FONT_CACHE[idx];
    var f = _resolveFont(NAME_FONT_OPTIONS[idx].cands);
    NAME_FONT_CACHE[idx] = f;
    return f;
  }

  function _getNameFont(nameText) {
    var entry = NAME_FONT_OPTIONS[NAME_FONT_INDEX] || NAME_FONT_OPTIONS[0];
    // 한글 서체를 직접 골랐으면 그대로 쓴다.
    // 라틴 서체인데 이름에 한글이 섞이면 한글 폴백으로 넘긴다.
    if (!entry.hangul && _containsHangul(nameText)) return _getHangulFont();
    return _nameFontForIndex(NAME_FONT_INDEX) || _getHangulFont();
  }

  function _copyPathsAsSolid(item, destGroup) {
    if (!item) return;
    if (item.typename === "PathItem") {
      var dup = item.duplicate(destGroup, ElementPlacement.PLACEATEND);
      _forceTempFill(dup);
      return;
    }
    if (item.typename === "CompoundPathItem") {
      for (var cp = 0; cp < item.pathItems.length; cp++) {
        var sub = item.pathItems[cp].duplicate(destGroup, ElementPlacement.PLACEATEND);
        _forceTempFill(sub);
      }
      return;
    }
    if (item.typename === "GroupItem") {
      for (var pi = 0; pi < item.pageItems.length; pi++) {
        _copyPathsAsSolid(item.pageItems[pi], destGroup);
      }
    }
  }

  function _addCurvedName(sheetDoc, printL, kissL, nameText, namePosition, cutBounds, stickerLongSidePt, itemBase) {
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;

    var cutL = cutBounds[0], cutT = cutBounds[1], cutR = cutBounds[2], cutB = cutBounds[3];
    var cutW = cutR - cutL;
    var cutH = cutT - cutB;
    if (cutW <= 0 || cutH <= 0) throw new Error("invalid cutline bounds (" + itemBase + ")");

    var arcW = cutW * (namePosition === "bottom" ? NAME_BOTTOM_ARC_W_RATIO : NAME_ARC_W_RATIO);
    var rise = Math.max(2, cutH * NAME_ARC_RISE_RATIO);
    var hasHangul = _containsHangul(nameText);
    var fontSize = _nameFontSizeForLongSide(stickerLongSidePt) *
      (hasHangul ? NAME_HANGUL_SIZE_RATIO : 1);
    var artworkText = _nameArtworkText(nameText);
    var nameFont = _getNameFont(nameText);

    var probe = printL.textFrames.pointText([cutL, cutT]);
    probe.contents = artworkText;
    var probeAttrs = probe.textRange.characterAttributes;
    if (nameFont) probeAttrs.textFont = nameFont;
    probeAttrs.size = fontSize;
    probeAttrs.tracking = NAME_TRACKING;
    probeAttrs.horizontalScale = 100;
    var probeBounds = probe.geometricBounds;
    var probeW = probeBounds[2] - probeBounds[0];
    var horizontalScale = 100;
    var targetTextW = arcW * 0.94;
    if (probeW > targetTextW && probeW > 0) {
      var neededScale = 100 * targetTextW / probeW;
      if (neededScale >= NAME_MIN_HORIZONTAL_SCALE) {
        horizontalScale = neededScale;
      } else {
        horizontalScale = NAME_MIN_HORIZONTAL_SCALE;
        fontSize = Math.max(4, fontSize * neededScale / NAME_MIN_HORIZONTAL_SCALE);
      }
    }
    probe.remove();

    rise = 0;   // 직선 baseline (아치 폐기)
    var centerX = (cutL + cutR) / 2;
    var centerY, edgeY, controlY;
    if (namePosition === "bottom") {
      // 아래 텍스는 깊은 U자에서 글자가 방사형으로 벌어지지 않도록
      // 폰트 크기 기준의 얇은 곡률만 사용한다.
      rise = Math.min(rise, Math.max(1.5, fontSize * NAME_BOTTOM_RISE_RATIO));
      centerY = cutB - fontSize * NAME_CHIN_DROP_RATIO;
      edgeY = centerY + rise;
      controlY = edgeY - rise * 4 / 3;
    } else {
      centerY = cutT + fontSize * NAME_CROWN_LIFT_RATIO;
      edgeY = centerY - rise;
      controlY = edgeY + rise * 4 / 3;
    }
    var leftX = centerX - arcW / 2;
    var rightX = centerX + arcW / 2;

    var arcPath = printL.pathItems.add();
    arcPath.setEntirePath([[leftX, edgeY], [rightX, edgeY]]);
    arcPath.closed = false;
    arcPath.filled = false;
    arcPath.stroked = false;
    arcPath.pathPoints[0].leftDirection = [leftX, edgeY];
    arcPath.pathPoints[0].rightDirection = [leftX + arcW / 3, controlY];
    arcPath.pathPoints[0].pointType = PointType.SMOOTH;
    arcPath.pathPoints[1].leftDirection = [rightX - arcW / 3, controlY];
    arcPath.pathPoints[1].rightDirection = [rightX, edgeY];
    arcPath.pathPoints[1].pointType = PointType.SMOOTH;

    // ── 직선 baseline + 글자별 bounce (2026-08-19) ───────────────
    // 아치와 bounce 는 둘 다 "움직임"이라 같이 쓰면 과하다. 굵은 서체로
    // 바꾸면서 아치가 하던 시각적 역할이 없어져 직선으로 정리했다.
    var nameFrame = printL.textFrames.pathText(arcPath);
    try { nameFrame.move(printL, ElementPlacement.PLACEATBEGINNING); } catch (eMoveName) {}
    nameFrame.contents = artworkText;
    var nameRange = nameFrame.textRange;
    if (nameFont) nameRange.characterAttributes.textFont = nameFont;
    nameRange.characterAttributes.size = fontSize;
    nameRange.characterAttributes.tracking = NAME_TRACKING;
    nameRange.characterAttributes.horizontalScale = horizontalScale;
    var preset = NAME_FONT_OPTIONS[NAME_FONT_INDEX] || NAME_FONT_OPTIONS[0];
    // 배경이 없으면 solo(대표색), 배경 위에 얹으면 ink.
    // 서체만 모드는 브랜드 먹.
    // 함정: 여러 줄에 걸친 **중첩 삼항 연산자를 쓰지 말 것**.
    // ExtendScript 에서 첫 조건이 true 인데도 두 번째 분기가 실행됐다
    // (실측: mode=0, INK_ONLY=0, 비교식은 true 인데 결과는 solo 색).
    // if/else 로 풀어 쓰면 정상 동작한다.
    var inkColor;
    if (NAME_STYLE_MODE === NAME_STYLE_INK_ONLY) {
      inkColor = INK;
    } else if (NAME_STYLE_MODE === NAME_STYLE_COLOR) {
      inkColor = _hexToRGB(preset.solo, INK);
    } else {
      inkColor = _hexToRGB(preset.ink, INK);
    }
    nameRange.characterAttributes.fillColor = inkColor;
    nameRange.characterAttributes.strokeColor = inkColor;
    nameRange.characterAttributes.strokeWeight = NAME_TEXT_STROKE_PT;
    nameRange.paragraphAttributes.justification = Justification.CENTER;

    // 글자별 변형을 하려면 아웃라인으로 변환해야 한다.
    var inkOutline = nameFrame.createOutline();
    try { inkOutline.name = "name_ink_" + itemBase; } catch (eInkName) {}
    _bounceGlyphs(inkOutline, _seedOfText(artworkText));
    nameFrame = inkOutline;   // 하위 코드가 참조하는 변수명 유지

    var nameCut = kissL.groupItems.add();
    var extraItems = [];   // 레이어드에서 같이 움직여야 하는 배경·그림자
    var bgItem = null;
    if (NAME_STYLE_MODE === NAME_STYLE_LAYERED) {
      // 하드 그림자 → 컬러 배경 → 칼선(배경 윤곽) 순으로 쌓는다.
      var ib = inkOutline.geometricBounds;
      var inkH = ib[1] - ib[3];
      var shd = inkH * NAME_SHADOW_RATIO;

      var shadowItem = inkOutline.duplicate(printL, ElementPlacement.PLACEATEND);
      _setFillAll(shadowItem, _hexToRGB(preset.sh, INK));
      shadowItem.translate(shd, -shd);
      try { shadowItem.name = "name_shadow_" + itemBase; } catch (eShN) {}

      // 배경 오프셋은 잉크 ∪ 그림자 기준 — 잉크만 쓰면 그림자가 삐져나온다.
      var silh = printL.groupItems.add();
      inkOutline.duplicate(silh, ElementPlacement.PLACEATEND);
      shadowItem.duplicate(silh, ElementPlacement.PLACEATEND);

      bgItem = _offsetSolid(sheetDoc, printL, silh,
                            inkH * NAME_BG_OFFSET_RATIO,
                            _hexToRGB(preset.bg, INK));
      try { silh.remove(); } catch (eRmSilh) {}
      try { bgItem.name = "name_bg_" + itemBase; } catch (eBgN) {}
      try { bgItem.move(printL, ElementPlacement.PLACEATEND); } catch (eMvBg) {}

      extraItems.push(shadowItem);
      extraItems.push(bgItem);

      // 레이어드에서는 인쇄된 배경 가장자리가 곧 컷 경계다.
      _copyPathsAsSolid(bgItem, nameCut);
    } else {
      // 칼선 = 글자 아웃라인 그대로. 여백(offset)은 주지 않는다 —
      // 나중에 Offset Path 로 직접 주기 때문에, 여기서 미리 벌려두면
      // 여백이 두 번 들어간다.
      _copyPathsAsSolid(inkOutline, nameCut);
    }

    if (namePosition === "bottom") {
      // 턱 아래 간격은 **눈에 보이는 것** 기준으로 잰다.
      // 배경이 있으면 배경 상단, 없으면 글자 상단.
      var refBounds = bgItem ? bgItem.geometricBounds : inkOutline.geometricBounds;
      var targetNameTop = cutB - NAME_BOTTOM_GAP_MM * MM_TO_PT;
      var nameShiftY = targetNameTop - refBounds[1];
      if (Math.abs(nameShiftY) > 0.01) {
        nameFrame.translate(0, nameShiftY);
        nameCut.translate(0, nameShiftY);
        for (var ei = 0; ei < extraItems.length; ei++) {
          try { extraItems[ei].translate(0, nameShiftY); } catch (eTr) {}
        }
      }
    }

    // 브릿지(사진과 이름을 잇는 얇은 탭)는 제거했다. 칼선을 글자 윤곽
    // 그대로 두는 이상 낱글자가 어차피 따로 떨어지므로 탭 하나로는 한 장이
    // 되지 않고, 나중에 직접 Offset Path 를 줄 때 방해만 된다.
    // 한 장으로 붙이는 건 offset 단계에서 처리할 것.
    try { nameCut.name = "NameCut_" + itemBase; } catch (eCutOutlineName) {}
    try { nameFrame.zOrder(ZOrderMethod.BRINGTOFRONT); } catch (eZOrder) {}
    sheetDoc.selection = null;
    return { art: nameFrame, cut: nameCut };
  }

  // ═════════════════════════════════════════════════════════
  //  PLACEMENT (mixed 의 _placePhotoSticker 변형: 회전 없음 + 곡선 이름)
  // ═════════════════════════════════════════════════════════

  function _placeNamedSticker(sheetDoc, pair, nameText, namePosition, x, y, cellWPt, cellHPt, nameAllowancePt, printL, kissL, spotColor) {
    try { sheetDoc.selection = null; } catch (eSel) {}

    if (!pair.cachedCutline || !pair.cutInfo) {
      throw new Error("cutline cache 없음 (" + pair.base + ")");
    }

    var master = _ensureArtMaster(sheetDoc, pair);

    // 1. 사진 — 셀 contain fit + 중앙 배치
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;
    var embG = master.duplicate(printL, ElementPlacement.PLACEATBEGINNING);
    try { embG.hidden = false; } catch (eShow0) {}
    var gb = embG.geometricBounds;
    var gw = gb[2] - gb[0];
    var gh = gb[1] - gb[3];
    var photoCellHPt = Math.max(1, cellHPt - nameAllowancePt);
    var ratio = Math.min(cellWPt / gw, photoCellHPt / gh);
    embG.resize(ratio * 100, ratio * 100);
    gb = embG.geometricBounds;
    var psdW = gb[2] - gb[0];
    var psdH = gb[1] - gb[3];
    var ccx = x + cellWPt / 2;
    var photoTopInsetPt = (namePosition === "bottom") ? 0 : nameAllowancePt;
    var ccy = y - photoTopInsetPt - photoCellHPt / 2;
    embG.left = ccx - psdW / 2;
    embG.top = ccy + psdH / 2;
    var psdL = embG.left;
    var psdT = embG.top;

    // 2. 사진 칼선 — cutInfo 상대 좌표 정합 (mixed 동일)
    sheetDoc.activeLayer = kissL;
    var photoCut = pair.cachedCutline.duplicate(kissL, ElementPlacement.PLACEATBEGINNING);
    try { photoCut.hidden = false; } catch (eShow1) {}
    var cutInfo = pair.cutInfo;
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

    var nameData = _addCurvedName(
      sheetDoc,
      printL,
      kissL,
      nameText,
      namePosition,
      photoCut.geometricBounds,
      Math.max(psdW, psdH),
      pair.base
    );

    sheetDoc.activeLayer = kissL;
    _forceTempFill(photoCut);
    _forceTempFill(nameData.cut);
    sheetDoc.selection = null;
    photoCut.selected = true;
    nameData.cut.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");

    var unitedSel = sheetDoc.selection;
    if (!unitedSel || unitedSel.length === 0) {
      throw new Error("name cutline unite result empty (" + pair.base + ")");
    }
    var united = unitedSel[0];
    try { united.name = "Cutline_name"; } catch (eCutName) {}
    _forceCutContourStroke(united, spotColor);
    var unitedBounds = united.geometricBounds;
    if (unitedBounds[2] - unitedBounds[0] <= 0) {
      throw new Error("name cutline unite bounds empty (" + pair.base + ")");
    }

    sheetDoc.selection = null;
    try { $.gc(); } catch (eGcName) {}
  }


  // ═════════════════════════════════════════════════════════
  //  TRACE 캐시 / 아트 마스터 (Everstory_mixed v21 에서 그대로)
  // ═════════════════════════════════════════════════════════

  function _ensureTraceStashLayer(sheetDoc) {
    for (var i = 0; i < sheetDoc.layers.length; i++) {
      if (sheetDoc.layers[i].name === "TraceStash") return sheetDoc.layers[i];
    }
    var stash = sheetDoc.layers.add();
    stash.name = "TraceStash";
    return stash;
  }

  function _cleanupTraceStash(sheetDoc) {
    try {
      for (var i = sheetDoc.layers.length - 1; i >= 0; i--) {
        if (sheetDoc.layers[i].name === "TraceStash") sheetDoc.layers[i].remove();
      }
    } catch (e) {}
  }

  function _buildCutlineCache(sheetDoc, uniquePairs, spotColor) {
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
        if (!cutline) throw new Error("trace 결과 path 없음");

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
        _forceCutContourStroke(cached, spotColor);

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


  // ═════════════════════════════════════════════════════════
  //  UI
  // ═════════════════════════════════════════════════════════

  function _showNameDialog(pairsArg, defName) {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";

    dlg.add("statictext", undefined, "사진 선택 (복수 가능 · 슬롯에 반복 배치):");
    var listItems = [];
    for (var i = 0; i < pairsArg.length; i++) listItems.push(pairsArg[i].base);
    var list = dlg.add("listbox", undefined, listItems, { multiselect: true });
    list.preferredSize = [340, Math.min(220, 20 * listItems.length + 24)];
    list.selection = [0];

    var sizeGroup = dlg.add("group");
    sizeGroup.add("statictext", undefined, "사이즈:");
    var sizeDrop = sizeGroup.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDrop.selection = SIZE_DEFAULT_INDEX;

    var positionGroup = dlg.add("group");
    positionGroup.add("statictext", undefined, "이름 위치:");
    var positionDrop = positionGroup.add("dropdownlist", undefined, ["위 (정수리 위)", "아래 (턱 아래)"]);
    positionDrop.selection = 0;

    var fontGroup = dlg.add("group");
    fontGroup.add("statictext", undefined, "이름 서체:");
    var fontLabels = [];
    for (var fi2 = 0; fi2 < NAME_FONT_OPTIONS.length; fi2++) {
      fontLabels.push(NAME_FONT_OPTIONS[fi2].label);
    }
    var fontDrop = fontGroup.add("dropdownlist", undefined, fontLabels);
    fontDrop.selection = NAME_FONT_DEFAULT_INDEX;
    fontDrop.preferredSize = [330, 24];

    var styleGroup = dlg.add("group");
    styleGroup.add("statictext", undefined, "이름 스타일:");
    var styleDrop = styleGroup.add("dropdownlist", undefined, NAME_STYLE_OPTIONS);
    styleDrop.selection = NAME_STYLE_DEFAULT_INDEX;
    styleDrop.preferredSize = [300, 24];

    dlg.add("statictext", undefined, "이름:");
    var nameInput = dlg.add("edittext", undefined, defName);
    nameInput.characters = 24;


    var btns = dlg.add("group");
    btns.alignment = "right";
    btns.add("button", undefined, "취소", { name: "cancel" });
    var okBtn = btns.add("button", undefined, "시트 생성", { name: "ok" });

    var result = null;
    okBtn.onClick = function () {
      if (list.selection === null || list.selection.length === 0) { alert("사진을 선택하세요."); return; }
      var nm = String(nameInput.text);
      nm = nm.replace(/^\s+|\s+$/g, "");
      if (!nm) { alert("이름을 입력하세요."); return; }
      var idxs = [];
      for (var s = 0; s < list.selection.length; s++) idxs.push(list.selection[s].index);
      result = {
        pairIndexes: idxs,
        sizeMm: SIZE_VALUES[sizeDrop.selection.index],
        nameText: nm,
        namePosition: positionDrop.selection.index === 1 ? "bottom" : "top",
        nameFontIndex: fontDrop.selection.index,
        nameStyleMode: styleDrop.selection.index
      };
      dlg.close();
    };

    dlg.show();
    return result;
  }

  // ═════════════════════════════════════════════════════════
  //  이하 Everstory_mixed.jsx (v21 unified) 에서 그대로 가져온 헬퍼
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

  function _openTemplateDoc(tplFile) {
    var opened = app.open(tplFile);
    try {
      var rfx = opened.rasterEffectSettings;
      rfx.colorModel = RasterizationColorModel.DEFAULTCOLORMODEL;
      rfx.resolution = 300;
    } catch (e) {}
    return opened;
  }

  function _findInfoPath(targetDoc, pathName) {
    var infoLayer = null;
    for (var i = 0; i < targetDoc.layers.length; i++) {
      if (targetDoc.layers[i].name.toLowerCase() === "info") {
        infoLayer = targetDoc.layers[i];
        break;
      }
    }
    if (!infoLayer) throw new Error("템플릿에 'info' 레이어가 없습니다");
    var item = _deepFindByName(infoLayer, pathName);
    if (!item) throw new Error("info 레이어 안에 '" + pathName + "'가 없습니다");
    return item;
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

  // 종횡비 — PNG IHDR 직독 (mixed 와 동일). 실패 시 임시문서 폴백.
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
    var tmp = _newDocForImage();
    try {
      var p = tmp.layers[0].placedItems.add();
      p.file = pair.sil;
      pair.aspect = p.width / p.height;
    } finally {
      try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (e) {}
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


  // ═════════════════════════════════════════════════════════
  //  Everstory_calligraphy.jsx 에서 이식 (2026-08-19)
  // ═════════════════════════════════════════════════════════

  // srcItem 을 offsetPt 만큼 바깥으로 부풀린 단일 도형 (레이어드 배경용).
  //
  // 함정 (실측 확인 — 되돌리지 말 것): 굵은 스트로크를 주고 expandStyle
  // 하는 방식은 여백이 전혀 생기지 않는다. Expand Appearance 는 라이브
  // 이펙트만 확장하고 평범한 스트로크는 그대로 두기 때문이다.
  // 반드시 Offset Path 라이브 이펙트를 쓸 것. jntp 는 **0 이 round** 다
  // (통념은 1=round 이지만 Illustrator 2026 에서 0 이 round 로 확인됨).
  function _offsetSolid(sheetDoc, layer, srcItem, offsetPt, colorObj) {
    var src = srcItem.duplicate(layer, ElementPlacement.PLACEATEND);
    src.applyEffect('<LiveEffect name="Adobe Offset Path">' +
      '<Dict data="R mlim 4 R ofst ' + offsetPt + ' I jntp 0 "/></LiveEffect>');
    sheetDoc.selection = null;
    src.selected = true;
    app.executeMenuCommand("expandStyle");
    var sel = sheetDoc.selection;
    var expanded = (sel && sel.length > 0) ? sel[0] : src;

    // compound 를 풀고 솔리드로 만들어야 Pathfinder 가 먹는다.
    var g = layer.groupItems.add();
    _copyPathsAsSolid(expanded, g);
    try { expanded.remove(); } catch (eRm) {}

    _forceTempFill(g);
    sheetDoc.selection = null;
    g.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");
    var sel2 = sheetDoc.selection;
    var united = (sel2 && sel2.length > 0) ? sel2[0] : g;
    _setFillAll(united, colorObj);
    sheetDoc.selection = null;
    return united;
  }

  function _setFillAll(item, colorObj) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) _setFillAll(item.pageItems[i], colorObj);
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) _setFillAll(item.pathItems[j], colorObj);
        return;
      }
      if (item.typename === "PathItem") {
        item.stroked = false; item.filled = true; item.fillColor = colorObj;
      }
    } catch (e) {}
  }

  // "A9503C" / "#A9503C" → RGBColor. 파싱 실패하면 fallback.
  function _hexToRGB(hex, fallback) {
    if (!hex) return fallback;
    var s = String(hex).replace(/^#/, "");
    if (!/^[0-9A-Fa-f]{6}$/.test(s)) return fallback;
    return C(parseInt(s.substring(0, 2), 16),
             parseInt(s.substring(2, 4), 16),
             parseInt(s.substring(4, 6), 16));
  }

  // 글자마다 상하로 튀고 살짝 회전·크기 변화.
  // createOutline 은 글자를 **역순**으로 담으므로 x 중심 기준 정렬 후 변형.
  // 문구로 시드를 만드는 결정론적 변형이라 실행할 때마다 같은 결과가 나온다.
  function _bounceGlyphs(group, seed) {
    var kids = [];
    for (var i = 0; i < group.pageItems.length; i++) kids.push(group.pageItems[i]);
    if (kids.length < 2) return;
    kids.sort(function (a, b) {
      var ab = a.geometricBounds, bb = b.geometricBounds;
      return (ab[0] + ab[2]) / 2 - (bb[0] + bb[2]) / 2;
    });
    var gb = group.geometricBounds;
    var inkH = gb[1] - gb[3];
    if (!(inkH > 0)) return;
    for (var k = 0; k < kids.length; k++) {
      var pRise = Math.sin(k * 1.9 + seed * 0.7);
      var pRot = Math.sin(k * 2.7 + seed * 1.3);
      var pScale = Math.sin(k * 1.3 + seed * 2.1);
      var sc = 1 + NAME_BOUNCE_SCALE_VAR * pScale;
      try {
        kids[k].resize(sc * 100, sc * 100, true, true, true, true, 100,
                       Transformation.CENTER);
        kids[k].rotate(NAME_BOUNCE_ROT_DEG * pRot, true, true, true, true,
                       Transformation.CENTER);
        kids[k].translate(0, inkH * NAME_BOUNCE_RISE_RATIO * pRise);
      } catch (e) {}
    }
  }

  function _seedOfText(text) {
    var s = 0;
    for (var i = 0; i < text.length; i++) s = (s + text.charCodeAt(i) * (i + 1)) % 997;
    return s / 997 * 6.283;
  }

})();
