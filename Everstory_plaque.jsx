// ═══════════════════════════════════════════════════════════════
//  Everstory Plaque 시트 (사진+명패 스티커 × 여러 장)
//
//  template_cutout_v2.ait (운영 v2 브랜드 템플릿) 위에, 레퍼런스의
//  "사진 + 이름 명패" 스티커를 Everstory_mixed 처럼 uniform grid 로 깐다.
//
//  유닛 구조: 명패는 사진 *안쪽* 하단에 얹힘 (명패 하단 = 사진 하단 -2%)
//  → 유닛 크기 = 사진 크기 그대로 → mixed 의 사이즈/그리드 로직과 호환.
//  칼선 = 실루엣 trace ∪ 명패 칼선 (개별 placement 마다 Unite).
//
//  플로우 (mixed 와 동일): 02_cutout 폴더 → 페어 multiselect → 사이즈 →
//  이름 → 시트 생성 → info > header > header_right 값 주입 →
//  03_output/{ts}_{inch}PLQ_sheet01.ai 자동 저장.
//
//  단순화: 단일 사이즈 uniform grid 만. Package/전 사이즈/회전 없음.
//  칼선 여백 옵션 없음 (사진에 베이크된 여백 그대로 — 여백 없는 사진은
//  칼선이 피사체에 붙는다. 명패 칼선 여백은 마스터 1.15mm 가 스티커
//  크기에 비례 스케일).
//
//  함정 (keepsake 에서 실측 — 되돌리지 말 것):
//   · paste 셀렉션 참조를 embed 리플로우 이후에 쓰면 stale — TraceStash
//     hidden 보관 후 duplicate 로 fresh 참조 획득 (mixed 와 동일 구조).
//   · Pathfinder 는 stroke-only/paint 없는 패스에서 빈 결과 — union 전
//     _forceTempFill, 합친 후 CutContour 스트로크 복원.
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var SCRIPT_VARIANT = "plaque v2 arched";
  var SCRIPT_TITLE = "Everstory Plaque Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var TEMPLATE_NAME = "template_cutout_v2.ait";
  var BODY_PADDING_MM = 2;
  var GAP_DEFAULT_MM = 2.5;

  // ── 명패 유닛 비율 (레퍼런스 실측) ─────────────────────────────
  var PLQ_MASTER_W_MM = 58;      // 아치형 명패를 그리는 기준 폭
  var PLQ_MASTER_H_MM = 27;
  var PLQ_W_RATIO = 1.02;        // plaque width = photo width x 1.02
  var PLQ_BOTTOM_INSET = 0.02;   // 명패 하단 = 사진 하단에서 위로 2%
  var CUT_M_MM = 1.15;           // 명패 칼선 여백 (마스터 기준, 크기 비례 스케일)
  var PLQ_NAME_SIZE_PT = 36;
  var PLQ_NAME_MIN_SIZE_PT = 10;
  var PLQ_NAME_MAX_W_RATIO = 0.60;

  var SIZE_OPTIONS = [
    "0.75\" / 19mm", "1\" / 25mm", "1.25\" / 32mm",
    "1.5\" / 38mm", "2\" / 51mm", "2.5\" / 64mm"
  ];
  var SIZE_VALUES = [19.05, 25.4, 31.75, 38.1, 50.8, 63.5];
  var SIZE_DEFAULT_INDEX = 4;    // 2" — 명패 이름 가독성 기준 권장 사이즈
  var INCH_STR = { 19.05: "0.75in", 25.4: "1in", 31.75: "1.25in", 38.1: "1.5in", 50.8: "2in", 63.5: "2.5in" };
  var LEGIBILITY_MIN_MM = 31.75; // 이보다 작으면 명패 이름 가독성 경고

  var TIER_TOKEN_RE = /_(XXL|XL|XS|FAM|S|M|L)$/i;
  var TIER_DEFAULT = "S";

  var testConfig = $.global.__EVERSTORY_PLAQUE_TEST__;

  function _fail(m) {
    if (testConfig) { testConfig.lastMessage = "실패: " + m; }
    else { alert(m); }
  }

  // ── 팔레트/폰트 (명패 = keepsake 와 동일) ──────────────────────
  function C(r, g, b) { var c = new RGBColor(); c.red = r; c.green = g; c.blue = b; return c; }
  var INK = C(74, 59, 47);
  var INK_SOFT = C(138, 120, 106);
  var BLUSH = C(242, 199, 190);
  var BLUSH_DEEP = C(233, 172, 159);
  var BOW_GOLD = C(218, 196, 172);
  var BOW_GOLD_DEEP = C(166, 133, 104);
  var IVORY = C(250, 246, 238);
  var PLAQUE_IVORY = C(253, 250, 245);
  var LINE_SOFT = C(229, 213, 201);

  // 베지어 데이터 테이블 — 메인 플로우가 함수보다 먼저 실행되므로
  // (var 값 할당은 호이스팅 안 됨) 반드시 최상단에 둔다.
  var HEART_T = [
    { a: [0, -0.28], l: [-0.10, -0.46], r: [0.10, -0.46] },
    { a: [0.50, -0.22], l: [0.30, -0.52], r: [0.66, 0.03] },
    { a: [0, 0.50], l: [0.36, 0.24], r: [-0.36, 0.24] },
    { a: [-0.50, -0.22], l: [-0.66, 0.03], r: [-0.30, -0.52] }
  ];
  var BOW_LOOP_L = [
    { a: [-0.04, -0.06], l: [-0.02, -0.02], r: [-0.10, -0.24] },
    { a: [-0.32, -0.30], l: [-0.20, -0.33], r: [-0.44, -0.27] },
    { a: [-0.48, -0.04], l: [-0.51, -0.15], r: [-0.45, 0.05] },
    { a: [-0.22, 0.14], l: [-0.36, 0.15], r: [-0.12, 0.13] },
    { a: [-0.04, 0.06], l: [-0.07, 0.09], r: [-0.03, 0.02] }
  ];
  var BOW_TAIL_L = [
    { a: [-0.05, 0.05], r: [-0.16, 0.12] },
    { a: [-0.30, 0.36], l: [-0.24, 0.24] },
    { a: [-0.17, 0.29] },
    { a: [-0.09, 0.39], l: [-0.12, 0.34] },
    { a: [-0.02, 0.10], l: [-0.05, 0.26] }
  ];

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

  var defaultName = _deriveDefaultCustomerName(inputFolder);
  var options = (testConfig && testConfig.options) ? testConfig.options : _showDialog(pairs, defaultName);
  if (!options) return;

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
      selectedPairs[ai].cellH = h;
      if (w > cellW) cellW = w;
      if (h > cellH) cellH = h;
    }

    var cols = Math.floor((binW + gapPt) / (cellW + gapPt));
    var rows = Math.floor((binH + gapPt) / (cellH + gapPt));
    if (cols < 1 || rows < 1) {
      throw new Error("선택 사이즈가 body 보다 큽니다 (" + options.sizeMm + "mm).");
    }
    var slots = cols * rows;
    packInfo = { cols: cols, rows: rows, slots: slots };

    // 디자인 수 > 슬롯 수면 앞에서부터 cap (mixed 의 auto-cap 정신)
    if (selectedPairs.length > slots) {
      selectedPairs = selectedPairs.slice(0, slots);
    }

    // ── 명패 마스터 + trace 캐시 + 아트 마스터 (전부 hidden stash) ──
    var stash = _ensureTraceStashLayer(doc);
    var plqMaster = _buildPlaqueMaster(doc, stash, options.nameText);

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
          _placePlaqueSticker(doc, pair, plqMaster, x, y, cellW, cellH, printLayer, kissLayer, cutSpot);
          placedCount++;
        } catch (ePlace) {
          failedItems.push({ base: pair.base, error: (ePlace && ePlace.message) ? ePlace.message : String(ePlace) });
        }
        slotIdx++;
      }
    }
    _safeRedrawAndGC();

    // ── 헤더 주입 (v2 규약: .contents 만 교체) ───────────────────
    headerRightText.contents = options.nameText + " · PLQ " +
      (INCH_STR[options.sizeMm] || Math.round(options.sizeMm) + "mm") + " · " + placedCount + "장";
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
    var sizeTag = (INCH_STR[options.sizeMm] || Math.round(options.sizeMm) + "mm") + "PLQ";
    var fileName = _timestamp() + "_" + sizeTag + "_sheet01.ai";
    var saveFile = new File(outFolder.fsName + "/" + fileName);
    _saveAi(doc, saveFile);
    savedPath = saveFile.fsName;
  } catch (eSave) {
    saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
  }

  var msg =
    "완료: Plaque 시트 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + " (템플릿: " + TEMPLATE_NAME + ")\n" +
    "이름: " + options.nameText + "\n" +
    "사이즈: " + (INCH_STR[options.sizeMm] || options.sizeMm + "mm") + " (유닛 = 사진 긴 변)\n" +
    "그리드: " + packInfo.cols + "×" + packInfo.rows + " = " + packInfo.slots + " 슬롯 / 배치 " + placedCount + "장 / 디자인 " + selectedPairs.length + "개\n" +
    (options.sizeMm < LEGIBILITY_MIN_MM ? "⚠ " + options.sizeMm + "mm 는 명패 이름이 매우 작습니다 — 가독성 확인 필수\n" : "") +
    (savedPath ? "저장: " + savedPath : "저장 실패: " + saveError) + "\n\n" +
    "QC: ① 사진-칼선 정합 ② 명패-실루엣 이음새 ③ 이름 가독성 시각 확인";

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
  //  명패 마스터 (parametric — keepsake 와 동일 지오메트리)
  // ═════════════════════════════════════════════════════════

  function _mmPt(v) { return v * MM_TO_PT; }

  // 로컬 mm 좌표 (y 아래 방향) → AI pt. 마스터는 원점 부근에 그려두고
  // placement 때 bounds 기준으로 재배치하므로 절대 위치는 무관.
  function _lx(x) { return _mmPt(x); }
  function _ly(y) { return -_mmPt(y); }

  function _drawSpec(container, spec, closed) {
    var p = container.pathItems.add();
    var anchors = [];
    var i;
    for (i = 0; i < spec.length; i++) anchors.push([_lx(spec[i].a[0]), _ly(spec[i].a[1])]);
    p.setEntirePath(anchors);
    for (i = 0; i < spec.length; i++) {
      var pp = p.pathPoints[i];
      var s = spec[i];
      pp.leftDirection = s.l ? [_lx(s.l[0]), _ly(s.l[1])] : [_lx(s.a[0]), _ly(s.a[1])];
      pp.rightDirection = s.r ? [_lx(s.r[0]), _ly(s.r[1])] : [_lx(s.a[0]), _ly(s.a[1])];
      pp.pointType = PointType.CORNER;
    }
    p.closed = (closed !== false);
    return p;
  }

  function _paintP(p, fill, stroke, sw) {
    if (fill) { p.filled = true; p.fillColor = fill; } else { p.filled = false; }
    if (stroke) {
      p.stroked = true;
      p.strokeColor = stroke;
      p.strokeWidth = sw || 0.5;
      p.strokeCap = StrokeCap.ROUNDENDCAP;
    } else {
      p.stroked = false;
    }
    return p;
  }

  function _roundRectL(container, cx, cy, w, h, rad) {
    return container.pathItems.roundedRectangle(_ly(cy - h / 2), _lx(cx - w / 2), _mmPt(w), _mmPt(h), _mmPt(rad), _mmPt(rad));
  }
  function _ellipseL(container, cx, cy, w, h) {
    return container.pathItems.ellipse(_ly(cy - h / 2), _lx(cx - w / 2), _mmPt(w), _mmPt(h));
  }
  function _lineL(container, x1, y1, x2, y2) {
    var p = container.pathItems.add();
    p.setEntirePath([[_lx(x1), _ly(y1)], [_lx(x2), _ly(y2)]]);
    p.closed = false;
    p.filled = false;
    return p;
  }

  function _xfSpec(t, cx, cy, sx, sy) {
    var out = [];
    for (var i = 0; i < t.length; i++) {
      var s = t[i];
      var o = { a: [cx + s.a[0] * sx, cy + s.a[1] * sy] };
      if (s.l) o.l = [cx + s.l[0] * sx, cy + s.l[1] * sy];
      if (s.r) o.r = [cx + s.r[0] * sx, cy + s.r[1] * sy];
      out.push(o);
    }
    return out;
  }


  function _drawBowL(parent, cx, cy, w, h, colMain, colDark) {
    var g = parent.groupItems.add();
    g.name = "bow";
    _paintP(_drawSpec(g, _xfSpec(BOW_TAIL_L, cx, cy, w, h)), colMain, null);
    _paintP(_drawSpec(g, _xfSpec(BOW_TAIL_L, cx, cy, -w, h)), colMain, null);
    _paintP(_drawSpec(g, _xfSpec(BOW_LOOP_L, cx, cy, w, h)), colMain, null);
    _paintP(_drawSpec(g, _xfSpec(BOW_LOOP_L, cx, cy, -w, h)), colMain, null);
    var shL = _ellipseL(g, cx - 0.26 * w, cy + 0.09 * h, 0.26 * w, 0.11 * h);
    _paintP(shL, colDark, null); shL.rotate(18);
    var shR = _ellipseL(g, cx + 0.26 * w, cy + 0.09 * h, 0.26 * w, 0.11 * h);
    _paintP(shR, colDark, null); shR.rotate(-18);
    _paintP(_roundRectL(g, cx, cy, 0.14 * w, 0.20 * h, 0.04 * w), colDark, null);
    return g;
  }

  // 명패 외곽 — 사진 아래를 감싸는 넓은 아치 상단 + 둥근 하단 모서리
  function _plaqueSpec(cx, cy, w, h, sr, br) {
    var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
    var shoulderY = y0 + h * 0.25;
    var archHandle = w * 0.17;
    var shoulderHandle = w * 0.19;
    var k = 0.552 * sr, kb = 0.552 * br;
    return [
      { a: [cx, y0], l: [cx - archHandle, y0], r: [cx + archHandle, y0] },
      { a: [x1 - sr, shoulderY], l: [x1 - shoulderHandle, shoulderY], r: [x1 - sr + k, shoulderY] },
      { a: [x1, shoulderY + sr], l: [x1, shoulderY + sr - k] },
      { a: [x1, y1 - br], r: [x1, y1 - br + kb] },
      { a: [x1 - br, y1], l: [x1 - br + kb, y1] },
      { a: [x0 + br, y1], r: [x0 + br - kb, y1] },
      { a: [x0, y1 - br], l: [x0, y1 - br + kb] },
      { a: [x0, shoulderY + sr], r: [x0, shoulderY + sr - k] },
      { a: [x0 + sr, shoulderY], l: [x0 + sr - k, shoulderY], r: [x0 + shoulderHandle, shoulderY] }
    ];
  }

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

  function _fitPointTextWidth(textFrame, preferredSize, minSize, maxWidthPt) {
    var attrs = textFrame.textRange.characterAttributes;
    attrs.size = preferredSize;
    var b = textFrame.geometricBounds;
    var width = b[2] - b[0];
    if (width > maxWidthPt && width > 0) {
      attrs.size = Math.max(minSize, preferredSize * maxWidthPt / width);
    }
    return attrs.size;
  }

  // 마스터 = { art: GroupItem(hidden), cut: PathItem(hidden), wPt, hPt }
  function _buildPlaqueMaster(sheetDoc, stash, nameText) {
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = stash;

    var g = stash.groupItems.add();
    g.name = "plaque_master";

    var W = PLQ_MASTER_W_MM, H = PLQ_MASTER_H_MM;
    var cx = 0, cy = 0;
    _paintP(_drawSpec(g, _plaqueSpec(cx, cy, W, H, 4.2, 2.8)), PLAQUE_IVORY, LINE_SOFT, 0.5);
    _paintP(_drawSpec(g, _plaqueSpec(cx, cy + 0.1, W - 2.6, H - 2.6, 3.4, 2.2)), null, INK_SOFT, 0.45);
    _drawBowL(g, cx, cy - 8.8, 7.0, 4.8, BOW_GOLD, BOW_GOLD_DEEP);

    var serif = _resolveFont([
      "Didot", "DidotLTStd-Roman", "Bodoni 72",
      "Playfair Display", "PlayfairDisplay-Regular", "Baskerville", "Georgia"
    ]);
    var tfr = g.textFrames.pointText([_lx(cx), _ly(cy + 4.2)]);
    tfr.contents = nameText;
    var tr = tfr.textRange;
    if (serif) tr.characterAttributes.textFont = serif;
    tr.characterAttributes.fillColor = INK;
    tr.paragraphAttributes.justification = Justification.CENTER;
    tfr.name = "plq_name";
    _fitPointTextWidth(
      tfr,
      PLQ_NAME_SIZE_PT,
      PLQ_NAME_MIN_SIZE_PT,
      _mmPt(W * PLQ_NAME_MAX_W_RATIO)
    );

    _paintP(_lineL(g, cx - 14.0, cy + 9.6, cx - 3.2, cy + 9.6), null, INK_SOFT, 0.35);
    _paintP(_drawSpec(g, _xfSpec(HEART_T, cx, cy + 9.6, 2.1, 2.0)), BLUSH_DEEP, null);
    _paintP(_lineL(g, cx + 3.2, cy + 9.6, cx + 14.0, cy + 9.6), null, INK_SOFT, 0.35);

    var cut = _drawSpec(stash, _plaqueSpec(cx, cy, W + 2 * CUT_M_MM, H + 2 * CUT_M_MM, 4.8, 3.4));
    cut.name = "plaque_cut_master";
    cut.filled = false;
    cut.stroked = false;

    var gbm = g.geometricBounds;
    var master = {
      art: g,
      cut: cut,
      wPt: gbm[2] - gbm[0],
      hPt: gbm[1] - gbm[3],
      fontName: serif ? serif.name : "(기본 폰트)"
    };
    try { g.hidden = true; } catch (eH1) {}
    try { cut.hidden = true; } catch (eH2) {}
    return master;
  }


  // ═════════════════════════════════════════════════════════
  //  PLACEMENT (mixed 의 _placePhotoSticker 변형: 회전 없음 + 명패)
  // ═════════════════════════════════════════════════════════

  function _placePlaqueSticker(sheetDoc, pair, plqMaster, x, y, cellWPt, cellHPt, printL, kissL, spotColor) {
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
    var ratio = Math.min(cellWPt / gw, cellHPt / gh);
    embG.resize(ratio * 100, ratio * 100);
    gb = embG.geometricBounds;
    var psdW = gb[2] - gb[0];
    var psdH = gb[1] - gb[3];
    var ccx = x + cellWPt / 2;
    var ccy = y - cellHPt / 2;
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

    // 3. 명패 아트 — 사진 폭 × PLQ_W_RATIO, 하단 -2% (info 위 = 사진 위에 인쇄)
    var scaleF = (PLQ_W_RATIO * psdW) / plqMaster.wPt;
    var plqParent = null;
    for (var li = 0; li < sheetDoc.layers.length; li++) {
      if (sheetDoc.layers[li].name.toLowerCase() === "info") { plqParent = sheetDoc.layers[li]; break; }
    }
    if (!plqParent) throw new Error("info 레이어가 없어 명패를 배치할 수 없습니다");
    var plqDup = plqMaster.art.duplicate(plqParent, ElementPlacement.PLACEATBEGINNING);
    try { plqDup.hidden = false; } catch (eShow2) {}
    plqDup.resize(scaleF * 100, scaleF * 100);
    var pbb = plqDup.geometricBounds;
    var pw = pbb[2] - pbb[0];
    var ph = pbb[1] - pbb[3];
    var plqBottomY = (psdT - psdH) + PLQ_BOTTOM_INSET * psdH;
    plqDup.left = ccx - pw / 2;
    plqDup.top = plqBottomY + ph;
    var plqCX = ccx;
    var plqCY = plqBottomY + ph / 2;

    // 4. 명패 칼선 dup → 사진 칼선과 Unite
    sheetDoc.activeLayer = kissL;
    var plqCutDup = plqMaster.cut.duplicate(kissL, ElementPlacement.PLACEATBEGINNING);
    try { plqCutDup.hidden = false; } catch (eShow3) {}
    plqCutDup.resize(scaleF * 100, scaleF * 100);
    var pcb = plqCutDup.geometricBounds;
    var pcw = pcb[2] - pcb[0];
    var pch = pcb[1] - pcb[3];
    plqCutDup.left = plqCX - pcw / 2;
    plqCutDup.top = plqCY + pch / 2;

    _forceTempFill(photoCut);
    _forceTempFill(plqCutDup);
    sheetDoc.selection = null;
    photoCut.selected = true;
    plqCutDup.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");

    var sel = sheetDoc.selection;
    if (!sel || sel.length === 0) throw new Error("칼선 Unite 결과 비어있음 (" + pair.base + ")");
    var united = sel[0];
    try { united.name = "Cutline_plq"; } catch (eName) {}
    var freshSpot = _ensureCutContour(sheetDoc);
    _forceCutContourStroke(united, freshSpot);
    var ub = united.geometricBounds;
    if (ub[2] - ub[0] <= 0) throw new Error("칼선 Unite 가 빈 그룹 (" + pair.base + ")");

    sheetDoc.selection = null;
    try { $.gc(); } catch (eGc) {}
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

  function _showDialog(pairsArg, defName) {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";

    dlg.add("statictext", undefined, "사진 선택 (복수 가능 — 슬롯에 round-robin 반복):");
    var listItems = [];
    for (var i = 0; i < pairsArg.length; i++) listItems.push(pairsArg[i].base);
    var list = dlg.add("listbox", undefined, listItems, { multiselect: true });
    list.preferredSize = [340, Math.min(220, 20 * listItems.length + 24)];
    list.selection = [0];

    var sizeGroup = dlg.add("group");
    sizeGroup.add("statictext", undefined, "사이즈:");
    var sizeDrop = sizeGroup.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDrop.selection = SIZE_DEFAULT_INDEX;

    dlg.add("statictext", undefined, "이름 (명패에 인쇄 · 헤더에도 표기):");
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
        nameText: nm
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

})();
