// ═══════════════════════════════════════════════════════════════
//  Everstory 주소 라벨 시트 (무지 방수 시트 · 12분할)
//
//  받는사람 주소 라벨. 폴리메일러에 붙인다 (캐리어 배송라벨 아님 —
//  바코드·4x6 규격 제약 없음).
//
//  기본 모드 = **템플릿 인쇄 (2026-08-25 추가)**: templates/address_label.ait
//  (OPOS 등록마크 + cut_1~12 칼선, 격자 SOT 는 템플릿)에 주소를 채워
//  인쇄하고, Summa 가 OPOS 로 마크를 읽어 그 자리를 컷한다. 안 쓴 칸의
//  칼선은 지워서 인쇄된 라벨만 잘리게 한다. 아래 두 레거시 모드의
//  재급지 위험·격자 상수는 템플릿 모드와 무관하다.
//
//  레거시 운영 방식 = **칼선 선(先) 일괄 · 인쇄 후(後) 분할**
//   1) CUTLINE 모드로 빈 12분할 칼선만 낸 시트를 만들어 재고로 둔다.
//   2) 주문이 3건 오면 PRINT 모드로 1~3번 칸에만 인쇄한다.
//   3) 다음에 2건 오면 같은 시트를 다시 넣어 4~5번 칸에 인쇄한다.
//
//  왜 두 모드가 한 파일인가: 칼선과 인쇄가 **같은 격자 상수**를 읽어야
//  정합이 맞는다. 파일을 나누면 한쪽만 고쳤을 때 글자가 칼선에 걸린다.
//
//  이 방식의 알려진 위험과, 코드로 건 완화책 (되돌리지 말 것):
//   · 재급지 잼 — 칼선 난 시트를 프린터에 여러 번 넣으면 픽업 롤러가
//     잘린 라벨 모서리를 물어 들어올린다. → **급지 선단 LEAD_MM 를
//     통째로 무칼선으로 남긴다.** 롤러가 닿는 곳에 칼선이 없다.
//   · 재급지 정합 드리프트 — 같은 시트를 다시 넣으면 위치가 +-1mm,
//     skew 가 생기면 아래 행일수록 커진다. → 텍스트를 칸 **중앙**에
//     두고 칼선에서 SAFE_MM 안쪽으로 넣어 오차를 양쪽으로 분산한다.
//     → 인쇄는 **위 행부터** 채운다 (오차가 작은 칸을 먼저 소진).
//
//  Summa: 시트가 무지라 등록마크(OPOS)로 맞출 대상이 없다. 기계 원점에
//  시트를 물려 좌표 그대로 자른다. 그래서 칼선 시트에 마크를 넣지 않는다.
//
//  잉크 내수성은 이 스크립트가 보장하지 못한다. 방수 시트라도 잉크가
//  안 물면 번진다 — 용지 설정을 바꿔가며 물 한 방울 + 손톱 테스트로
//  먼저 확인할 것.
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var SCRIPT_VARIANT = "address labels v1";
  var SCRIPT_TITLE = "Everstory Address Labels (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;

  // ── 격자 SOT — CUTLINE 과 PRINT 가 이 값들을 공유한다 ──────────
  // 하나라도 고치면 두 산출물이 같이 바뀐다. 한쪽만 고칠 방법이 없다.
  var COLS = 2;
  var ROWS = 6;                  // 2 x 6 = 12칸
  var LEAD_MM = 20;              // 급지 선단 무칼선 여백 (잼 완화 — 줄이지 말 것)
  var TAIL_MM = 10;              // 급지 후단 여백
  var SIDE_MM = 9;               // 좌우 여백
  var GUTTER_MM = 3;             // 칸 사이 (떼기 쉽게 + 인접 라벨 손상 방지)
  var SAFE_MM = 5;               // 칼선에서 텍스트까지 안쪽 여백 (드리프트 흡수)
  var CORNER_MM = 3;             // 라벨 모서리 라운드

  var SHEET_SPECS = {
    "A4": { wMm: 210, hMm: 297 },
    "Letter": { wMm: 215.9, hMm: 279.4 }
  };
  var SHEET_NAMES = ["A4", "Letter"];
  var SHEET_DEFAULT_INDEX = 0;

  var BODY_SIZE_PT = 12;      // 10 은 실물에서 작았다 (2026-08-25). 칸에 안 맞으면 자동 축소
  var BODY_MIN_SIZE_PT = 7;
  var LEADING_RATIO = 1.35;
  var FONT_CANDS = ["Jost-Regular", "Inter-Regular", "HelveticaNeue", "Helvetica", "ArialMT"];

  // OPOS 템플릿 (templates/address_label.ait, 2026-08-24 제작) — Regmark 레이어의
  // 등록마크 + KissCut 레이어의 cut_N 사각형. 격자 SOT 는 코드 상수가 아니라 **템플릿**이다:
  // 칸 위치·크기는 cut_N 의 실좌표에서 읽으므로 템플릿을 고치면 스크립트가 따라온다.
  // 운영 방식이 위의 "칼선 선(先) 일괄" 과 다르다 — 주소+마크를 인쇄한 뒤 Summa 가
  // OPOS 로 마크를 읽고 그 자리를 컷한다 (재급지 정합을 마크가 해결).
  var TEMPLATE_REL = "templates/address_label.ait";

  var testConfig = $.global.__EVERSTORY_LABELS_TEST__;

  // 주문 보드(scripts/order_intake/webui.py '주소 라벨' 버튼)가 osascript 로 넣는 실행
  // 인자. consume-once — 안 지우면 다음 수동 실행의 파일 칸이 옛 값으로 채워진다.
  var launchConfig = $.global.__EVERSTORY_LAUNCH__;
  $.global.__EVERSTORY_LAUNCH__ = undefined;

  // 다이얼로그의 주소 파일 칸 초기값. 보드가 넘긴 경로가 최우선, 없으면 intake.py
  // --labels 의 기본 출력(projects/_labels.txt)이 있을 때 그걸 채운다 — 손으로
  // --labels 를 돌린 경우도 같은 경로라 함께 덕을 본다. 확인·수정은 여전히 가능.
  function initialLabelsPath() {
    if (launchConfig && launchConfig.labelsFile &&
        (new File(launchConfig.labelsFile)).exists) {
      return (new File(launchConfig.labelsFile)).fsName;
    }
    try {
      var f = new File((new File($.fileName)).parent.fsName + "/projects/_labels.txt");
      if (f.exists) return f.fsName;
    } catch (ePath) {}
    return "";
  }

  function templateFile() {
    try {
      return new File((new File($.fileName)).parent.fsName + "/" + TEMPLATE_REL);
    } catch (eTpl) {}
    return null;
  }

  function _fail(m) {
    if (testConfig) { testConfig.lastMessage = "실패: " + m; }
    else { alert(m); }
  }

  function _note(m) {
    if (testConfig) { testConfig.lastMessage = m; }
    else { alert(m); }
  }

  // ── 순수 계산 (sim/labeltest.js 가 이걸 그대로 뽑아 검증한다) ───

  function sheetSpec(name) {
    var s = SHEET_SPECS[name];
    if (!s) return null;
    return { name: name, wMm: s.wMm, hMm: s.hMm };
  }

  function slotCount() {
    return COLS * ROWS;
  }

  function gridCells(sheet) {
    // 원점 = 시트 **좌상단**, y 는 아래로 증가 (급지 선단이 위).
    var usableW = sheet.wMm - SIDE_MM * 2 - GUTTER_MM * (COLS - 1);
    var usableH = sheet.hMm - LEAD_MM - TAIL_MM - GUTTER_MM * (ROWS - 1);
    var cellW = usableW / COLS;
    var cellH = usableH / ROWS;
    var cells = [];
    var r, c;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        // 번호는 좌->우, 위->아래. 사람이 세는 순서와 같고,
        // 낮은 번호일수록 급지 선단에 가까워 정합 오차가 작다.
        cells.push({
          n: r * COLS + c + 1,
          row: r + 1,
          col: c + 1,
          xMm: SIDE_MM + c * (cellW + GUTTER_MM),
          yMm: LEAD_MM + r * (cellH + GUTTER_MM),
          wMm: cellW,
          hMm: cellH
        });
      }
    }
    return cells;
  }

  function textBoxOf(cell) {
    // 칼선에서 SAFE_MM 안쪽. 여기를 벗어나면 재급지 드리프트에 글자가 걸린다.
    return {
      xMm: cell.xMm + SAFE_MM,
      yMm: cell.yMm + SAFE_MM,
      wMm: cell.wMm - SAFE_MM * 2,
      hMm: cell.hMm - SAFE_MM * 2
    };
  }

  function gridErrors(sheet) {
    // 격자가 물리적으로 성립하는지. 시트 규격을 바꾸면 여기서 먼저 걸린다.
    var errs = [];
    var cells = gridCells(sheet);
    var eps = 0.001;
    if (!cells.length) { errs.push("칸이 0개"); return errs; }
    var cw = cells[0].wMm, ch = cells[0].hMm;
    if (cw <= 0) errs.push("칸 폭이 0 이하 (" + cw.toFixed(2) + "mm) — 여백/거터가 시트보다 크다");
    if (ch <= 0) errs.push("칸 높이가 0 이하 (" + ch.toFixed(2) + "mm)");
    if (cw - SAFE_MM * 2 <= 0) errs.push("텍스트 폭이 0 이하 — SAFE_MM 이 칸보다 크다");
    if (ch - SAFE_MM * 2 <= 0) errs.push("텍스트 높이가 0 이하 — SAFE_MM 이 칸보다 크다");
    var i;
    for (i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (c.xMm < SIDE_MM - eps) errs.push("#" + c.n + " 좌측 여백 침범");
      if (c.yMm < LEAD_MM - eps) errs.push("#" + c.n + " 급지 선단 여백 침범 — 재급지 잼");
      if (c.xMm + c.wMm > sheet.wMm - SIDE_MM + eps) errs.push("#" + c.n + " 우측 시트 밖");
      if (c.yMm + c.hMm > sheet.hMm - TAIL_MM + eps) errs.push("#" + c.n + " 하단 시트 밖");
    }
    var j;
    for (i = 0; i < cells.length; i++) {
      for (j = i + 1; j < cells.length; j++) {
        var a = cells[i], b = cells[j];
        var overlapX = (a.xMm < b.xMm + b.wMm - eps) && (b.xMm < a.xMm + a.wMm - eps);
        var overlapY = (a.yMm < b.yMm + b.hMm - eps) && (b.yMm < a.yMm + a.hMm - eps);
        if (overlapX && overlapY) errs.push("#" + a.n + " 와 #" + b.n + " 겹침");
      }
    }
    return errs;
  }

  function parseAddressBlocks(text) {
    // 빈 줄로 구분된 블록 = 라벨 하나. `#` 로 시작하는 줄은 주석.
    var raw = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    var blocks = [];
    var cur = [];
    var i;
    for (i = 0; i < raw.length; i++) {
      var line = raw[i].replace(/\s+$/, "");
      if (/^\s*#/.test(line)) continue;
      if (/^\s*$/.test(line)) {
        if (cur.length) { blocks.push(cur); cur = []; }
        continue;
      }
      cur.push(line);
    }
    if (cur.length) blocks.push(cur);
    return blocks;
  }

  function planSlots(startN, blockCount, totalOverride) {
    // 시작 칸에서 순서대로. 시트를 넘기면 넘친 만큼을 알려준다.
    // 진행 상태를 파일로 들고 있지 않는 이유: **실물 시트가 곧 상태다.**
    // 뗀 자리는 눈으로 바로 보이므로 손 입력이 상태 파일보다 정확하고,
    // 어긋날 수가 없다.
    // totalOverride: 템플릿 모드가 cut_N 개수를 넘긴다. 안 주면 코드 격자(12칸).
    var total = slotCount();
    if (totalOverride) total = totalOverride;
    var plan = { used: [], overflow: 0, error: null };
    if (startN < 1 || startN > total) {
      plan.error = "시작 칸은 1~" + total + " 사이여야 한다 (받은 값: " + startN + ")";
      return plan;
    }
    var room = total - startN + 1;
    var fit = Math.min(room, blockCount);
    var i;
    for (i = 0; i < fit; i++) plan.used.push(startN + i);
    plan.overflow = blockCount - fit;
    return plan;
  }

  // ── Illustrator ───────────────────────────────────────────────

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

  function _ensureCutContour(targetDoc) {
    var spot;
    try {
      spot = targetDoc.spots.getByName("CutContour");
    } catch (e) {
      spot = targetDoc.spots.add();
      spot.name = "CutContour";
      spot.colorType = ColorModel.SPOT;
      var c = new CMYKColor();
      c.cyan = 0; c.magenta = 100; c.yellow = 0; c.black = 0;
      spot.color = c;
    }
    var sc = new SpotColor();
    sc.spot = spot;
    sc.tint = 100;
    return sc;
  }

  function _ensureLayer(targetDoc, name) {
    var lyr;
    try {
      lyr = targetDoc.layers.getByName(name);
    } catch (e) {
      lyr = targetDoc.layers.add();
      lyr.name = name;
    }
    return lyr;
  }

  function _newSheetDoc(sheet) {
    var preset = new DocumentPreset();
    preset.width = sheet.wMm * MM_TO_PT;
    preset.height = sheet.hMm * MM_TO_PT;
    preset.units = RulerUnits.Millimeters;
    preset.colorMode = DocumentColorSpace.CMYK;
    return app.documents.addDocument("Print", preset);
  }

  function _toPt(targetDoc, xMm, yMm) {
    // 격자는 좌상단 원점 · y 아래로 증가. Illustrator 는 y 위로 증가.
    var ab = targetDoc.artboards[0].artboardRect;
    return { x: ab[0] + xMm * MM_TO_PT, y: ab[1] - yMm * MM_TO_PT };
  }

  function drawCutlineSheet(targetDoc, sheet) {
    var cells = gridCells(sheet);
    var cutSpot = _ensureCutContour(targetDoc);
    var lyr = _ensureLayer(targetDoc, "CutContour");
    var i;
    for (i = 0; i < cells.length; i++) {
      var c = cells[i];
      var p = _toPt(targetDoc, c.xMm, c.yMm);
      var rect = lyr.pathItems.roundedRectangle(
        p.y, p.x, c.wMm * MM_TO_PT, c.hMm * MM_TO_PT,
        CORNER_MM * MM_TO_PT, CORNER_MM * MM_TO_PT, false);
      rect.filled = false;
      rect.stroked = true;
      rect.strokeColor = cutSpot;
      rect.strokeWidth = 0.25;
      rect.name = "cut_" + c.n;
    }
    return cells.length;
  }

  function templateCells(doc) {
    // KissCut 레이어의 cut_N 사각형에서 칸을 읽는다 — 템플릿이 격자 SOT.
    // 좌표는 artboardRect 기준 mm 로 환산하므로 문서 원점 규약과 무관하다.
    var lyr;
    try {
      lyr = doc.layers.getByName("KissCut");
    } catch (eKc) {
      return { error: "KissCut 레이어가 없다", cells: [] };
    }
    var ab = doc.artboards[0].artboardRect;
    var cells = [];
    var i;
    for (i = 0; i < lyr.pageItems.length; i++) {
      var it = lyr.pageItems[i];
      var m = String(it.name).match(/^cut_(\d+)$/);
      if (!m) continue;
      var b = it.geometricBounds;
      cells.push({
        n: parseInt(m[1], 10),
        item: it,
        xMm: (b[0] - ab[0]) / MM_TO_PT,
        yMm: (ab[1] - b[1]) / MM_TO_PT,
        wMm: (b[2] - b[0]) / MM_TO_PT,
        hMm: (b[1] - b[3]) / MM_TO_PT
      });
    }
    cells.sort(function (a, b2) { return a.n - b2.n; });
    return { error: null, cells: cells };
  }

  function drawAddressBlock(targetDoc, lyr, font, cell, lines) {
    var box = textBoxOf(cell);
    var tf = lyr.textFrames.add();
    tf.contents = lines.join("\r");
    var attrs = tf.textRange.characterAttributes;
    if (font) attrs.textFont = font;
    attrs.size = BODY_SIZE_PT;
    attrs.leading = BODY_SIZE_PT * LEADING_RATIO;
    tf.textRange.paragraphAttributes.justification = Justification.LEFT;

    var maxW = box.wMm * MM_TO_PT;
    var maxH = box.hMm * MM_TO_PT;
    var b = tf.geometricBounds;
    var w = b[2] - b[0];
    var h = b[1] - b[3];
    // 폭·높이 둘 다에 맞춘다. 중첩 삼항은 ExtendScript 에서 틀린 분기를
    // 조용히 타므로 쓰지 않는다.
    var scale = 1;
    if (w > maxW && w > 0) scale = maxW / w;
    if (h > maxH && h > 0) {
      var vs = maxH / h;
      if (vs < scale) scale = vs;
    }
    if (scale < 1) {
      var newSize = BODY_SIZE_PT * scale;
      if (newSize < BODY_MIN_SIZE_PT) newSize = BODY_MIN_SIZE_PT;
      // geometricBounds 를 읽고 나면 위에서 잡아둔 characterAttributes 핸들이
      // 무효가 된다 — 그대로 쓰면 "illegal text range". 새로 얻어서 쓴다
      // (2026-08-25 실사고: 긴 줄, 즉 축소 경로에서만 터져서 늦게 발견됐다).
      var attrsNow = tf.textRange.characterAttributes;
      attrsNow.size = newSize;
      attrsNow.leading = newSize * LEADING_RATIO;
    }

    // 블록을 칸 중앙에 — 재급지 드리프트를 양쪽으로 분산시킨다.
    b = tf.geometricBounds;
    w = b[2] - b[0];
    h = b[1] - b[3];
    var cx = _toPt(targetDoc, cell.xMm + cell.wMm / 2, cell.yMm + cell.hMm / 2);
    tf.left = cx.x - w / 2;
    tf.top = cx.y + h / 2;
    tf.name = "addr_" + cell.n;
    return tf;
  }

  function drawPrintSheet(targetDoc, sheet, blocks, startN) {
    var plan = planSlots(startN, blocks.length);
    if (plan.error) throw new Error(plan.error);
    var cells = gridCells(sheet);
    var font = _resolveFont(FONT_CANDS);
    var lyr = _ensureLayer(targetDoc, "Print");
    var i;
    for (i = 0; i < plan.used.length; i++) {
      drawAddressBlock(targetDoc, lyr, font, cells[plan.used[i] - 1], blocks[i]);
    }
    return plan;
  }

  // ── 다이얼로그 ────────────────────────────────────────────────

  function askOptions() {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "left";

    var tpl = templateFile();
    var tplExists = !!(tpl && tpl.exists);

    var gMode = dlg.add("panel", undefined, "무엇을 만드나");
    gMode.orientation = "column";
    gMode.alignChildren = "left";
    var rbTpl = gMode.add("radiobutton", undefined,
      "템플릿 인쇄 — address_label.ait (주소+마크 인쇄 → Summa OPOS 컷)");
    var rbCut = gMode.add("radiobutton", undefined, "칼선 시트 — 빈 12분할 (Summa, 한 번만)");
    var rbPrint = gMode.add("radiobutton", undefined, "인쇄 — 이미 칼선 난 시트에 주소만");
    rbTpl.enabled = tplExists;
    if (tplExists) rbTpl.value = true;
    else rbPrint.value = true;

    var gSheet = dlg.add("group");
    gSheet.add("statictext", undefined, "시트");
    var ddSheet = gSheet.add("dropdownlist", undefined, SHEET_NAMES);
    ddSheet.selection = SHEET_DEFAULT_INDEX;

    var gStart = dlg.add("group");
    gStart.add("statictext", undefined, "시작 칸 (1~" + slotCount() + ", 위 행부터)");
    var etStart = gStart.add("edittext", undefined, "1");
    etStart.characters = 4;

    var gFile = dlg.add("group");
    gFile.add("statictext", undefined, "주소 파일 (.txt)");
    var etFile = gFile.add("edittext", undefined, initialLabelsPath());
    etFile.characters = 30;
    var btnPick = gFile.add("button", undefined, "찾기…");
    btnPick.onClick = function () {
      var f = File.openDialog("주소 텍스트 파일");
      if (f) etFile.text = f.fsName;
    };

    function syncEnabled() {
      var addressing = rbPrint.value || rbTpl.value;
      gStart.enabled = addressing;
      gFile.enabled = addressing;
      gSheet.enabled = !rbTpl.value;   // 템플릿 모드는 시트 규격을 템플릿이 정한다
    }
    rbTpl.onClick = syncEnabled;
    rbCut.onClick = syncEnabled;
    rbPrint.onClick = syncEnabled;
    syncEnabled();

    var gBtn = dlg.add("group");
    gBtn.add("button", undefined, "취소", { name: "cancel" });
    gBtn.add("button", undefined, "만들기", { name: "ok" });

    if (dlg.show() !== 1) return null;
    var mode = "print";
    if (rbCut.value) mode = "cutline";
    if (rbTpl.value) mode = "template";
    return {
      mode: mode,
      sheetName: SHEET_NAMES[ddSheet.selection.index],
      startN: parseInt(etStart.text, 10),
      filePath: etFile.text
    };
  }

  // ── 메인 ──────────────────────────────────────────────────────

  function readAddressBlocks(filePath) {
    // 주소 .txt → 블록 배열. 실패하면 _fail 을 띄우고 null.
    if (!filePath) { _fail("주소 파일을 골라야 한다."); return null; }
    var f = new File(filePath);
    if (!f.exists) { _fail("주소 파일이 없다: " + filePath); return null; }
    f.encoding = "UTF-8";
    f.open("r");
    var text = f.read();
    f.close();
    var blocks = parseAddressBlocks(text);
    if (!blocks.length) { _fail("주소 파일에 라벨이 없다 (빈 줄로 구분된 블록 0개)."); return null; }
    return blocks;
  }

  function runTemplateMode(opts) {
    var tpl = templateFile();
    if (!tpl || !tpl.exists) { _fail("템플릿이 없다: " + TEMPLATE_REL); return; }
    var blocks = readAddressBlocks(opts.filePath);
    if (!blocks) return;
    var startN = opts.startN;
    if (isNaN(startN)) { _fail("시작 칸이 숫자가 아니다."); return; }

    // .ait 는 열면 무제 사본이 뜬다 — 원본은 건드리지 않는다.
    var doc = app.open(tpl);
    var got = templateCells(doc);
    if (got.error || !got.cells.length) {
      doc.close(SaveOptions.DONOTSAVECHANGES);
      _fail("템플릿에서 칸을 못 읽었다: " + (got.error || "KissCut 에 cut_N 사각형이 0개"));
      return;
    }
    var cells = got.cells;
    var plan = planSlots(startN, blocks.length, cells.length);
    if (plan.error) {
      doc.close(SaveOptions.DONOTSAVECHANGES);
      _fail(plan.error);
      return;
    }

    var font = _resolveFont(FONT_CANDS);
    var lyr = _ensureLayer(doc, "Print");
    var used = {};
    var i, j;
    for (i = 0; i < plan.used.length; i++) {
      used[plan.used[i]] = true;
      for (j = 0; j < cells.length; j++) {
        if (cells[j].n === plan.used[i]) {
          drawAddressBlock(doc, lyr, font, cells[j], blocks[i]);
          break;
        }
      }
    }
    // 안 쓴 칸의 칼선은 지운다 — Summa 가 빈 라벨까지 잘라내지 않게.
    // (마크는 Regmark 레이어라 그대로 남아 인쇄된다 — OPOS 가 읽는 대상.)
    for (i = cells.length - 1; i >= 0; i--) {
      if (!used[cells[i].n]) {
        try { cells[i].item.remove(); } catch (eRm) {}
      }
    }

    var msg = "주소 " + plan.used.length + "건 · 칸 " + plan.used[0] + "~" +
              plan.used[plan.used.length - 1] + " (" +
              cells[0].wMm.toFixed(1) + " x " + cells[0].hMm.toFixed(1) + "mm) · " +
              BODY_SIZE_PT + "pt";
    if (plan.overflow > 0) {
      msg += "\n\n남은 " + plan.overflow + "건은 이 시트에 안 들어간다 — " +
             "다음 시트에 시작 칸 1 로 다시 돌릴 것.";
    }
    msg += "\n\n칸 번호는 템플릿 cut_N 위치를 따른다. 안 쓴 칸 칼선은 지웠다 — " +
           "Summa 는 인쇄된 라벨만 자른다.\n" +
           "순서: 인쇄 (실제 크기 100%, 마크 포함) → Summa OPOS 로 마크 읽혀 컷.\n" +
           "주의: 같은 시트를 재급지해 다시 인쇄하면 마크가 겹쳐 찍혀 OPOS 가 " +
           "혼동할 수 있다 — 한 시트는 한 번에 쓰는 것을 권장.";
    _note(msg);
  }

  function main() {
    var opts = null;
    if (testConfig) opts = testConfig.options;
    else opts = askOptions();
    if (!opts) return;

    if (opts.mode === "template") {
      runTemplateMode(opts);
      return;
    }

    var sheet = sheetSpec(opts.sheetName);
    if (!sheet) { _fail("모르는 시트 규격: " + opts.sheetName); return; }

    var errs = gridErrors(sheet);
    if (errs.length) {
      _fail("격자가 성립하지 않는다 (" + sheet.name + "):\n  " + errs.join("\n  "));
      return;
    }

    var cells = gridCells(sheet);
    var dims = cells[0].wMm.toFixed(1) + " x " + cells[0].hMm.toFixed(1) + "mm";

    if (opts.mode === "cutline") {
      var cutDoc = _newSheetDoc(sheet);
      var n = drawCutlineSheet(cutDoc, sheet);
      _note("칼선 시트 " + n + "칸 (" + dims + ") · " + sheet.name + "\n\n" +
            "급지 선단 " + LEAD_MM + "mm 는 칼선 없음 — 재급지 잼 완화.\n" +
            "Summa: 무지 시트라 등록마크 없이 기계 원점 기준으로 자른다.\n" +
            "QC: 첫 장을 자른 뒤 실측으로 칸 크기를 확인하고 나머지를 자를 것.");
      return;
    }

    var blocks = readAddressBlocks(opts.filePath);
    if (!blocks) return;

    var startN = opts.startN;
    if (isNaN(startN)) { _fail("시작 칸이 숫자가 아니다."); return; }
    var plan = planSlots(startN, blocks.length);
    if (plan.error) { _fail(plan.error); return; }

    var printDoc = _newSheetDoc(sheet);
    drawPrintSheet(printDoc, sheet, blocks, startN);

    var msg = "주소 " + plan.used.length + "건 · 칸 " +
              plan.used[0] + "~" + plan.used[plan.used.length - 1] + " (" + dims + ")";
    if (plan.overflow > 0) {
      msg += "\n\n남은 " + plan.overflow + "건은 이 시트에 안 들어간다 — " +
             "다음 시트에 시작 칸 1 로 다시 돌릴 것.";
    }
    msg += "\n\n인쇄 전 QC: 프린터에 시트를 **선단(" + LEAD_MM + "mm 무칼선 쪽)부터** 넣을 것.\n" +
           "먼저 일반 종이에 시험 인쇄해 칸 위치가 맞는지 겹쳐 보고 나서 방수 시트를 쓸 것.";
    _note(msg);
  }

  main();
})();
