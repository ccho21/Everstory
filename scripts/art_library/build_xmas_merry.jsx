// ═══════════════════════════════════════════════════════════════
//  Everstory 크리스마스 2번 MERRY 프레임 — templates/xmas_merry_art_v1.ai 만들기 (2026-10-07)
//
//  MERRY CHRISTMAS 스티커(참고 이미지 2번)에서 매 장 같은 부분 = 레터링 · 리본 · 크림 바탕 · 흰 테두리 · 칼선 모양을
//  한 번 그려 둔다. Everstory_xmas.jsx(_composeMerryAt)가 이 그룹을 칸마다 복제하고 얼굴 · 모자 · 이름만 얹는다.
//
//  입력 (assets/xmas_merry/ — 사용자가 ChatGPT 로 만든 그림, 2026-10-07):
//   · merry_lettering_trace.svg — merry_lettering_src.png 를 벡터화한 것: 알파 2배 확대(LANCZOS) → 가우스 1.2 →
//     128 임계(merry_lettering_mask2x.png) → Image Trace(흑백 · path 85 · corner 40 · noise 30 · abutting)
//     → 12 패스 780점, 원본 그림과 가장자리 2.5% 차이. 레터링 그림을 바꾸면 이 순서로 다시 만든다.
//   · santa_hat_src.png — 모자 (그대로 templates/xmas_santa_hat_v1.png 로 복사).
//
//  결과:
//   · templates/xmas_merry_art_v1.ai — 그룹 'XM_FRAME' (위→아래): XM_CUT(칠 없음 = 칼선 모양) · XM_RIBBON ·
//     XM_LETTERING(XM_MERRY · XM_CHRISTMAS) · XM_CREAM · XM_WHITE. 좌표 = 그림 단위 (CHRISTMAS 폭 925, y 아래 = 문서 −y).
//     **선(stroke) 없음** — 시트에 놓을 때 resize 가 선 굵기를 안 바꾸므로 리본 테두리도 Offset Path 로 만든 채운 도형.
//   · templates/xmas_santa_hat_v1.png
//   · templates/art_preview/xmas_merry_v1/ — FRAME.png(칼선 bbox 그대로 · 주문 보드 미리보기) · HAT.png ·
//     SHAPES.json(칼선·크림 패스 d — 칼선 bbox 왼쪽 위 기준 그림 단위 — 와 실측값). 실측값은 Everstory_xmas.jsx 의
//     MERRY 표와 같아야 한다 (composed_preview_test.py 가 확인).
//
//  배치 (ROUND 2 시안 확정, 사용자 2026-10-07 "진행하자"):
//   · 레터링 = 가로 0.8배로 좁힘 (참고 이미지처럼 길쭉하게). CHRISTMAS 폭 925 · 아래 0.914×925 · MERRY 위 0.2076×925,
//     두 단어의 가로 상대 위치는 받은 그림 그대로.
//   · 10-07 사용자 "MERRY·CHRISTMAS 사이를 지금의 50%로": MERRY 위 0.08 → 0.2076 (118 내림 — M·Y 아래 ↔ CHRISTMAS 위
//     238 → 120). 얼굴 자리도 그만큼 줄어 얼굴 높이 0.6 → 0.49cw (폭 0.54 → 0.44) — 모자가 MERRY 를, 턱이 CHRISTMAS 를
//     가리는 정도는 그대로. 얼굴을 그대로 두고 글자를 위아래로 1.22배 늘리는 안도 만들어 봤지만 글자가 길쭉해져서 뺐다.
//   · 리본 = 참고 실측 (띠 폭 bw 기준): 꼬리 끝 0.11~0.89×CW · bw = 전체 × 249/352 · 두께 0.281 · 가운데 처짐 0.054
//     (위아래 같이, 두께 일정) · 꼬리 0.048 아래 · V 홈 0.09 · 접힘 삼각형 0.05. 테두리 6 (가운데 기준 = 안팎 3).
//   · 크림 = (레터링 ∪ 리본 ∪ 얼굴·모자 자리) 를 90 부풀렸다 68 줄인 것 (틈 메우기 + 크림 여백 22). 흰 테두리 = 크림 + 24.
//
//  함정: Offset Path 이펙트 jntp 0 = 라운드 (캘리그래피 실측) · Pathfinder 는 칠 없는 패스에서 빈 결과 → 단색 복사 후 합친다 ·
//        exportFile 은 활성 문서를 내보낸다.
//
//  사용: File → Scripts → Other Script → 이 파일 (확인 창에서 "예"를 눌러야 templates 에 덮어쓴다).
//        테스트 훅 $.global.__EVERSTORY_XMAS_MERRY_BUILD__ = { out: "<폴더>" } → 그 폴더에만 쓰고 결과 요약을 cfg.report 에.
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  var CFG = $.global.__EVERSTORY_XMAS_MERRY_BUILD__ || null;
  $.global.__EVERSTORY_XMAS_MERRY_BUILD__ = undefined;
  var SCRIPT_DIR = (new File($.fileName)).parent;          // scripts/art_library
  var REPO = SCRIPT_DIR.parent.parent;                     // 포토샵누끼
  var ASSETS = REPO.fsName + "/assets/xmas_merry";
  var TEMPLATES = REPO.fsName + "/templates";

  var CW = 925, X0 = 37.5, COND = 0.8;                     // CHRISTMAS 폭 · 왼쪽 · 가로 좁힘
  var M_TOP = 0.2076 * CW, C_BOTTOM = 0.914 * CW;          // MERRY 위 · CHRISTMAS 아래 (y 아래)
  var CLOSE_R = 90, CREAM_M = 22, WHITE_M = 24;            // 틈 메우기 · 크림 여백 · 흰 테두리
  var RIBBON_LINE = 6;                                     // 리본 테두리 굵기 (가운데 기준)
  // 이름 — 참고 실측: 대문자 = 리본 두께 60% · 기준선 = 띠 가운데 아래선에서 두께 26.4% 위. DM Serif Display 대문자 = 0.66 em
  var NAME_CAP_K = 0.6, NAME_FONT_CAP = 0.66;
  // 얼굴·모자 자리 — Everstory_xmas.jsx MERRY 표와 같은 규칙 (가장 큰 얼굴·모자가 크림 안에 들어가게)
  var FACE = { chinK: 0.7, h: 0.49, wMax: 0.44, cx: 0.432 };
  var HAT = { brimK: 0.8, apexX: 0.04, apexY: 0.2, apexPx: [600, 500], brimPx: 880, bboxPx: [139, 51, 1479, 969] };
  var RED = [0x9F, 0x11, 0x12], CREAM = [0xF9, 0xF2, 0xE0], FOLD = [0xE8, 0xDA, 0xC0], WHITE = [255, 255, 255];
  var PREVIEW_W = 1200;                                    // FRAME.png 폭 (px)

  var prevUIL = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  var doc = null, svg = null, rep = [];
  try {
    var svgFile = new File(ASSETS + "/merry_lettering_trace.svg");
    var hatFile = new File(ASSETS + "/santa_hat_src.png");
    if (!svgFile.exists || !hatFile.exists) throw new Error("assets/xmas_merry 에 merry_lettering_trace.svg · santa_hat_src.png 가 있어야 합니다");

    doc = app.documents.add(DocumentColorSpace.RGB, 1200, 1200);
    var L = doc.layers[0];
    L.name = "art";

    // ① 레터링 — SVG 를 열어 패스를 MERRY(위) / CHRISTMAS(아래) 로 나눠 가져온다
    svg = app.open(svgFile);
    var ab = svg.artboards[0].artboardRect;
    var src = [], isM = [];
    _gather(svg.layers[0], src);
    for (var i = 0; i < src.length; i++) isM.push(ab[1] - src[i].geometricBounds[1] < 600);   // 위에서 내려온 거리 (트레이스 2배 px)
    app.activeDocument = doc;                               // 받는 문서를 활성으로
    var gM = L.groupItems.add(); gM.name = "XM_MERRY";
    var gC = L.groupItems.add(); gC.name = "XM_CHRISTMAS";
    for (var j = 0; j < src.length; j++) {   // 다른 문서로는 레이어에만 복제된다 (그룹에 바로 넣으면 MRAP) → 같은 문서 안에서 그룹으로 옮긴다
      src[j].duplicate(L, ElementPlacement.PLACEATEND).move(isM[j] ? gM : gC, ElementPlacement.PLACEATEND);
    }
    svg.close(SaveOptions.DONOTSAVECHANGES); svg = null;
    app.activeDocument = doc;
    if (gM.pageItems.length === 0 || gC.pageItems.length === 0) throw new Error("레터링을 MERRY / CHRISTMAS 로 못 나눴습니다");
    _paint(gM, RED); _paint(gC, RED);

    var cb = gC.geometricBounds, mb = gM.geometricBounds;
    var sx = CW / (cb[2] - cb[0]), sy = sx / COND;
    gC.resize(sx * 100, sy * 100, true, true, true, true, 100, Transformation.TOPLEFT);
    var nc = gC.geometricBounds;
    gC.translate(X0 - nc[0], -C_BOTTOM - nc[3]);
    gM.resize(sx * 100, sy * 100, true, true, true, true, 100, Transformation.TOPLEFT);
    var nm = gM.geometricBounds;
    gM.translate(X0 + (mb[0] - cb[0]) * sx - nm[0], -M_TOP - nm[1]);
    nc = gC.geometricBounds; nm = gM.geometricBounds;
    var cTop = -nc[1], cH = nc[1] - nc[3];
    var gL = L.groupItems.add(); gL.name = "XM_LETTERING";
    gC.move(gL, ElementPlacement.PLACEATEND);
    gM.move(gL, ElementPlacement.PLACEATBEGINNING);

    // ② 리본 — 참고 실측. 조각마다 빨강(+3) 위에 바탕(−3) = 가운데 기준 6 테두리 (라운드 모서리)
    var Lr = X0 + 0.11 * CW, Rr = X0 + 0.89 * CW, y0 = C_BOTTOM + 4;
    var bw = (Rr - Lr) * 249 / 352, t = 0.281 * bw, sag = 0.054 * bw, drop = 0.048 * bw, notch = 0.09 * bw;
    var bL = (Lr + Rr) / 2 - bw / 2, bR = bL + bw, cx = (bL + bR) / 2, tin = 0.08 * bw, ty0 = y0 + drop, ty1 = ty0 + t, fw = 0.05 * bw;
    var pieces = [
      { pts: [[Lr, ty0], [bL + tin, ty0], [bL + tin, ty1], [Lr, ty1], [Lr + notch, (ty0 + ty1) / 2]], fill: CREAM },
      { pts: [[Rr, ty0], [bR - tin, ty0], [bR - tin, ty1], [Rr, ty1], [Rr - notch, (ty0 + ty1) / 2]], fill: CREAM },
      { pts: [[bL, y0 + t], [bL + fw, ty1], [bL, ty1]], fill: FOLD },
      { pts: [[bR, y0 + t], [bR - fw, ty1], [bR, ty1]], fill: FOLD },
      { band: true, fill: CREAM }
    ];
    var gR = L.groupItems.add(); gR.name = "XM_RIBBON";
    var ribbonOuter = [];
    for (var pi = 0; pi < pieces.length; pi++) {
      var pc = pieces[pi];
      var base = pc.band ? _bandPath(gR, bL, bR, cx, y0, t, sag) : _poly(gR, pc.pts);
      var outer = _offset(doc, base, RIBBON_LINE / 2); _paint(outer, RED); outer.move(gR, ElementPlacement.PLACEATBEGINNING);
      var inner = _offset(doc, base, -RIBBON_LINE / 2); _paint(inner, pc.fill); inner.move(gR, ElementPlacement.PLACEATBEGINNING);
      ribbonOuter.push(outer);
      base.remove();
    }

    // ③ 크림 · 흰 테두리 — (레터링 ∪ 리본 ∪ 얼굴·모자 자리) → +90 → 합치기 → −68 = 크림 → +24 = 흰 테두리·칼선
    var chin = cTop + FACE.chinK * cH, fhMax = FACE.h * CW, fwMax = FACE.wMax * CW, fcx = X0 + FACE.cx * CW;
    var U = L.groupItems.add();
    _solidCopy(gL, U);
    for (var r = 0; r < ribbonOuter.length; r++) _solidCopy(ribbonOuter[r], U);
    U.pathItems.ellipse(-(chin - fhMax), fcx - fwMax / 2, fwMax, fhMax);                // 가장 큰 얼굴 상자
    var k = HAT.brimK * fwMax / HAT.brimPx, fy = chin - fhMax;                           // 가장 큰 모자 (그림 bbox)
    var hx = fcx + HAT.apexX * fwMax - HAT.apexPx[0] * k, hy = fy + HAT.apexY * fhMax - HAT.apexPx[1] * k;
    var hb = [hx + HAT.bboxPx[0] * k, hy + HAT.bboxPx[1] * k, hx + HAT.bboxPx[2] * k, hy + HAT.bboxPx[3] * k];
    U.pathItems.ellipse(-hb[1], hb[0], hb[2] - hb[0], hb[3] - hb[1]);
    _paint(U, [0, 0, 0]);
    var uni = _union(doc, U);
    var dil = _offset(doc, uni, CLOSE_R); uni.remove();
    var dilU = _union(doc, dil);
    var blob = _largest(dilU, L); dilU.remove();
    var cream = _offset(doc, blob, -(CLOSE_R - CREAM_M)); blob.remove();
    var creamP = _largest(cream, L); cream.remove();
    creamP.name = "XM_CREAM"; _paint(creamP, CREAM);
    var cutX = _offset(doc, creamP, WHITE_M);
    var cutP = _largest(cutX, L); cutX.remove();
    cutP.name = "XM_CUT";
    var white = cutP.duplicate(L, ElementPlacement.PLACEATEND); white.name = "XM_WHITE"; _paint(white, WHITE);
    cutP.filled = false; cutP.stroked = false;

    // ④ 그룹 XM_FRAME (위→아래: XM_CUT · XM_RIBBON · XM_LETTERING · XM_CREAM · XM_WHITE)
    var F = L.groupItems.add(); F.name = "XM_FRAME";
    white.move(F, ElementPlacement.PLACEATBEGINNING);
    creamP.move(F, ElementPlacement.PLACEATBEGINNING);
    gL.move(F, ElementPlacement.PLACEATBEGINNING);
    gR.move(F, ElementPlacement.PLACEATBEGINNING);
    cutP.move(F, ElementPlacement.PLACEATBEGINNING);
    _checkNoStroke(F);

    var cg = cutP.geometricBounds;                          // [L, T, R, B] y 위
    doc.artboards[0].artboardRect = [cg[0], cg[1], cg[2], cg[3]];
    var cutL = cg[0], cutT = -cg[1], cutW = cg[2] - cg[0], cutH = cg[1] - cg[3];
    var meas = {
      cutL: cutL, cutT: cutT, cutW: cutW, cutH: cutH, cTop: cTop, cH: cH,
      chinK: FACE.chinK, faceH: FACE.h, faceWMax: FACE.wMax, faceCx: FACE.cx,   // 크림이 담는 얼굴 자리 = 시트 규칙
      nameX: cx, nameBase: y0 + sag + 0.736 * t, nameSize: NAME_CAP_K * t / NAME_FONT_CAP, nameMaxW: 0.8 * bw
    };

    // ⑤ 내보내기
    var out = (CFG && CFG.out) ? new Folder(CFG.out) : Folder.temp;
    var stage = new Folder(out.fsName + "/xmas_merry_build");
    if (!stage.exists) stage.create();
    var aiF = new File(stage.fsName + "/xmas_merry_art_v1.ai");
    var pngF = new File(stage.fsName + "/FRAME.png");
    var shapesF = new File(stage.fsName + "/SHAPES.json");
    var tableF = new File(stage.fsName + "/MERRY_TABLE.txt");
    app.activeDocument = doc;
    var png = new ExportOptionsPNG24();
    png.horizontalScale = png.verticalScale = PREVIEW_W / cutW * 100;
    png.transparency = true; png.antiAliasing = true; png.artBoardClipping = true;
    doc.exportFile(pngF, ExportType.PNG24, png);
    _writeText(shapesF, '{\n  "cutW": ' + _n(cutW) + ', "cutH": ' + _n(cutH) + ',\n' +
      '  "measure": {' + _kv(meas) + '},\n' +
      '  "cut": "' + _pathD(cutP, cutL, cutT) + '",\n' +
      '  "cream": "' + _pathD(creamP, cutL, cutT) + '"\n}\n');
    _writeText(tableF, _kv(meas) + "\n");
    var so = new IllustratorSaveOptions();
    so.compatibility = Compatibility.ILLUSTRATOR24; so.pdfCompatible = true;
    doc.saveAs(aiF, so);
    rep.push("cut " + _n(cutW) + " × " + _n(cutH) + " (그림 단위) · 크림 · 레터링 " + gL.pageItems.length + "그룹 · 리본 " + gR.pageItems.length + "조각");
    rep.push("MERRY 표: " + _kv(meas));

    // ⑥ 설치 — 훅이면 out 폴더(stage)에만, 아니면 확인 후 templates 에
    var install = !CFG && confirm("templates 에 xmas_merry_art_v1.ai · xmas_santa_hat_v1.png · art_preview/xmas_merry_v1 을 덮어쓸까요?\n\n" + rep.join("\n"));
    var dests = [];
    if (install) {
      var pv = new Folder(TEMPLATES + "/art_preview/xmas_merry_v1");
      if (!pv.exists) pv.create();
      aiF.copy(TEMPLATES + "/xmas_merry_art_v1.ai");
      hatFile.copy(TEMPLATES + "/xmas_santa_hat_v1.png");
      pngF.copy(pv.fsName + "/FRAME.png");
      hatFile.copy(pv.fsName + "/HAT.png");
      shapesF.copy(pv.fsName + "/SHAPES.json");
      dests.push("templates 설치 완료");
    } else {
      hatFile.copy(stage.fsName + "/xmas_santa_hat_v1.png");
      dests.push("작업 폴더: " + stage.fsName);
    }
    rep.push(dests.join(" · "));
  } catch (e) {
    rep.push("실패: " + ((e && e.message) ? e.message : String(e)) + (e && e.line ? " (line " + e.line + ")" : ""));
  } finally {
    if (svg) { try { svg.close(SaveOptions.DONOTSAVECHANGES); } catch (eS) {} }   // 중간에 실패해도 SVG 를 열린 채 두지 않는다
    if (doc) { try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {} }
    app.userInteractionLevel = prevUIL;
  }
  if (CFG) { CFG.report = rep.join("\n"); $.global.__EVERSTORY_XMAS_MERRY_RESULT__ = CFG.report; }
  else alert(rep.join("\n"));


  // ── 도구 ────────────────────────────────────────────────
  function _gather(container, out) {
    for (var i = 0; i < container.pageItems.length; i++) {
      var it = container.pageItems[i];
      if (it.typename === "GroupItem") _gather(it, out);
      else if (it.typename === "PathItem" || it.typename === "CompoundPathItem") out.push(it);
    }
  }
  function _rgb(c) { var o = new RGBColor(); o.red = c[0]; o.green = c[1]; o.blue = c[2]; return o; }
  function _paint(item, c) {
    if (item.typename === "GroupItem") { for (var i = 0; i < item.pageItems.length; i++) _paint(item.pageItems[i], c); return; }
    if (item.typename === "CompoundPathItem") { for (var j = 0; j < item.pathItems.length; j++) _paint(item.pathItems[j], c); return; }
    if (item.typename === "PathItem") { item.stroked = false; item.filled = true; item.fillColor = _rgb(c); }
  }
  function _solidCopy(item, dest) {
    if (item.typename === "PathItem") { var d = item.duplicate(dest, ElementPlacement.PLACEATEND); _paint(d, [0, 0, 0]); return; }
    if (item.typename === "CompoundPathItem") { for (var j = 0; j < item.pathItems.length; j++) _solidCopy(item.pathItems[j], dest); return; }
    if (item.typename === "GroupItem") { for (var i = 0; i < item.pageItems.length; i++) _solidCopy(item.pageItems[i], dest); }
  }
  // 그림 단위 (u, v ↓) → 문서 (x, y ↑)
  function _poly(container, pts) {
    var p = container.pathItems.add(), a = [];
    for (var i = 0; i < pts.length; i++) a.push([pts[i][0], -pts[i][1]]);
    p.setEntirePath(a); p.closed = true; p.filled = true; p.fillColor = _rgb([0, 0, 0]); p.stroked = false;
    return p;
  }
  // 띠 — 위아래 선이 같이 처지는 2차 곡선 (가운데 처짐 sag) → 3차 베지어
  function _bandPath(container, bL, bR, cx, y0, t, sag) {
    var p = container.pathItems.add();
    var q = 4 / 3 * sag;   // 2차 제어점(가운데 2·sag) 을 3차로 — 1/3·2/3 지점이 4/3·sag
    var nodes = [
      { a: [bL, y0], l: [bL, y0], r: [bL + 2 / 3 * (cx - bL), y0 + q] },
      { a: [bR, y0], l: [bR - 2 / 3 * (bR - cx), y0 + q], r: [bR, y0] },
      { a: [bR, y0 + t], l: [bR, y0 + t], r: [bR - 2 / 3 * (bR - cx), y0 + t + q] },
      { a: [bL, y0 + t], l: [bL + 2 / 3 * (cx - bL), y0 + t + q], r: [bL, y0 + t] }
    ];
    for (var i = 0; i < nodes.length; i++) {
      var pp = p.pathPoints.add();
      pp.anchor = [nodes[i].a[0], -nodes[i].a[1]];
      pp.leftDirection = [nodes[i].l[0], -nodes[i].l[1]];
      pp.rightDirection = [nodes[i].r[0], -nodes[i].r[1]];
      pp.pointType = PointType.CORNER;
    }
    p.closed = true; p.filled = true; p.fillColor = _rgb([0, 0, 0]); p.stroked = false;
    return p;
  }
  // Offset Path 이펙트 (jntp 0 = 라운드) → 확장. 원본은 그대로 두고 확장 결과(그룹·컴파운드·패스)를 돌려준다
  function _offset(d, item, ofs) {
    var dup = item.duplicate(item.layer, ElementPlacement.PLACEATEND);
    dup.applyEffect('<LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst ' + ofs + ' I jntp 0 "/></LiveEffect>');
    d.selection = null; dup.selected = true;
    app.executeMenuCommand("expandStyle");
    var sel = d.selection;
    if (!sel || sel.length === 0) throw new Error("Offset Path 확장 실패 (" + ofs + ")");
    var res = sel[0];
    d.selection = null;
    return res;
  }
  function _union(d, item) {
    _paint(item, [0, 0, 0]);
    d.selection = null; item.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");
    var sel = d.selection;
    if (!sel || sel.length === 0) throw new Error("합치기 실패");
    var res = sel[0];
    d.selection = null;
    return res;
  }
  // 안에서 넓이가 가장 큰 패스 (바깥 윤곽) 를 레이어로 복제해 돌려준다 — 구멍·떨어진 조각은 버린다
  function _largest(item, layer) {
    var paths = [];
    (function walk(it) {
      if (it.typename === "PathItem") paths.push(it);
      else if (it.typename === "CompoundPathItem") { for (var j = 0; j < it.pathItems.length; j++) paths.push(it.pathItems[j]); }
      else if (it.typename === "GroupItem") { for (var i = 0; i < it.pageItems.length; i++) walk(it.pageItems[i]); }
    })(item);
    var best = null, ba = -1;
    for (var i = 0; i < paths.length; i++) { var a = Math.abs(paths[i].area); if (a > ba) { ba = a; best = paths[i]; } }
    if (!best) throw new Error("윤곽을 못 찾았습니다");
    return best.duplicate(layer, ElementPlacement.PLACEATEND);
  }
  function _checkNoStroke(item) {
    if (item.typename === "GroupItem") { for (var i = 0; i < item.pageItems.length; i++) _checkNoStroke(item.pageItems[i]); return; }
    if (item.typename === "CompoundPathItem") { for (var j = 0; j < item.pathItems.length; j++) _checkNoStroke(item.pathItems[j]); return; }
    if (item.typename === "PathItem" && item.stroked) throw new Error("선이 남은 패스가 있습니다: " + (item.name || "(이름 없음)"));
  }
  // 패스 → SVG d (칼선 bbox 왼쪽 위 기준, y 아래)
  function _pathD(p, ox, oy) {
    var pts = p.pathPoints, n = pts.length;
    function xy(a) { return _n(a[0] - ox) + " " + _n(-a[1] - oy); }
    var d = "M" + xy(pts[0].anchor);
    for (var i = 1; i <= n; i++) {
      var a = pts[i - 1], b = pts[i % n];
      if (i === n && !p.closed) break;
      d += " C" + xy(a.rightDirection) + " " + xy(b.leftDirection) + " " + xy(b.anchor);
    }
    return d + (p.closed ? " Z" : "");
  }
  function _n(v) { return String(Math.round(v * 100) / 100); }
  function _kv(o) {   // 실측값 — 얼굴 비율(0.432 등)이 뭉개지지 않게 소수 4자리
    var s = [];
    for (var k in o) if (o.hasOwnProperty(k)) s.push('"' + k + '": ' + String(Math.round(o[k] * 10000) / 10000));
    return s.join(", ");
  }
  function _writeText(f, s) { f.encoding = "UTF-8"; f.open("w"); f.write(s); f.close(); }
})();
