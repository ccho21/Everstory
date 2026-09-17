// ═══════════════════════════════════════════════════════════════
//  Everstory 레트로 말풍선 — deco_art_v1.ai 에 말풍선 6종 그리기 (2026-09-17)
//
//  레트로 데코(templates/deco_art_v1.ai, 원본 sticker sample 3)에는 글씨 스티커가 없어서 같은 모양새로 스크립트가 그린다:
//  팝 색 물결 바탕 + 검정 테두리 + 크림 말풍선(꼬리) + 입체 그림자 + Luckiest Guy 글씨(검정 테두리 · 검정 그림자).
//  templates/deco_art_v1.ai 를 작업 폴더(임시)에 복사해 열고, 같은 이름 그룹('DECO YAY' …)이 있으면 지우고 새로 그린다.
//  미리보기 그림(art_preview/deco_art_v1/DECO_YAY.png …)과 비율표(DECO_BUBBLE_ASPECT_V1.txt)도 만든다.
//  확인 창에서 "예"를 눌러야 templates 에 덮어쓴다. 비율표가 Everstory_range.jsx 의 DECO_BUBBLE_ASPECT_V1 과 다르면
//  완료 창에 알린다 — 그때는 작업 폴더의 .txt 로 range.jsx 를 고치고 테스트를 돌린다 (README.md).
//
//  라이브러리 규칙 (range.jsx _drawDecoSticker 가 기대하는 모양 — 기존 레트로 데코 12종과 같다):
//   · 그룹 'DECO <이름>'. **선(stroke) 없음** — 시트에 놓을 때 resize 가 선 굵기를 안 바꾸므로 테두리는 모두 채운 도형.
//   · 맨 아래 'SIL' = 모든 조각을 테두리 굵기만큼 부풀린 합집합 = 검정 바깥 테두리 = 칼선 (그룹에서 가장 큰 도형, 한 조각).
//   · 글자·색·꼬리 방향은 BUBBLES 표. 이름(key)을 바꾸거나 더하면 range.jsx DECO_BUBBLES_V1 · DECO_BUBBLE_ASPECT_V1 도.
//   · 글씨 서체 Luckiest Guy (LuckiestGuy-Regular, Google Fonts OFL) — 없으면 멈춘다.
//
//  사용: File → Scripts → Other Script → 이 파일. 테스트 훅 $.global.__EVERSTORY_RETRO_BUBBLES__ =
//        { work, workOnly: true } (workOnly = templates 를 건드리지 않고 결과를 cfg.report 에).
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  var CFG = $.global.__EVERSTORY_RETRO_BUBBLES__ || null;
  $.global.__EVERSTORY_RETRO_BUBBLES__ = undefined;
  var SCRIPT_DIR = (new File($.fileName)).parent;          // scripts/art_library
  var REPO = SCRIPT_DIR.parent.parent;                     // 포토샵누끼
  var TEMPLATES = REPO.fsName + "/templates";
  var LIB_NAME = "deco_art_v1.ai";
  var FONT_NAME = "LuckiestGuy-Regular";
  var DECO_PX = 200;                                       // 미리보기 그림 높이 (px) — 기존 레트로 데코 그림과 같다
  // 기존 레트로 데코에서 잰 색 (deco_art_v1.ai 채우기 색 그대로)
  var COLORS = {
    INK: [15, 12, 9], CREAM: [251, 235, 200], PINK: [249, 116, 160], PURPLE: [191, 142, 219], YELLOW: [249, 195, 40],
    TEAL: [37, 180, 195], GREEN: [88, 176, 85], RED: [250, 67, 31], BLUE: [19, 95, 203]
  };
  // 말풍선 — words 의 \r = 줄바꿈. tail = 꼬리 방향(도, 0 = 오른쪽, 반시계 · 240 왼쪽 아래 · 300 오른쪽 아래).
  var BUBBLES = [
    { key: "YAY", words: "YAY!", base: "PINK", shadow: "BLUE", text: "YELLOW", tail: 240 },
    { key: "BESTDAY", words: "BEST\rDAY", base: "YELLOW", shadow: "BLUE", text: "RED", tail: 240 },
    { key: "XOXO", words: "XOXO", base: "PURPLE", shadow: "RED", text: "PINK", tail: 300 },
    { key: "WOW", words: "WOW!", base: "PINK", shadow: "BLUE", text: "TEAL", tail: 300 },
    { key: "MYFAVE", words: "MY\rFAVE", base: "GREEN", shadow: "BLUE", text: "YELLOW", tail: 240 },
    { key: "YOUME", words: "YOU+ME", base: "TEAL", shadow: "RED", text: "PINK", tail: 300 }
  ];
  // 모양 (pt) — 기존 레트로 데코 한 개가 300pt 안팎, 테두리 약 6pt 라 그 비율에 맞춘다.
  var SHAPE = {
    a: 112, b: 75,                    // 크림 말풍선 반지름 (가로 · 세로)
    round: 2.3,                       // 말풍선 둥근 네모 정도 (2 = 타원)
    tailHalf: 13, tailLen: 32,        // 꼬리 밑동 반폭(도) · 밑동에서 끝까지(pt)
    tailBend: 14,                     // 꼬리 끝을 바깥쪽으로 비트는 각도(도)
    margin: 19,                       // 물결 바탕이 말풍선보다 큰 만큼
    baseRound: 2.2, wave: 0.045, bumps: 11, baseTailHalf: 17, baseTailLen: 36,
    line: 5,                          // 검정 테두리 굵기 (바깥쪽으로)
    shadow: 7,                        // 말풍선 입체 그림자 (오른쪽 아래)
    textW: 0.72, textH: 0.6,          // 글씨가 차지할 말풍선 폭·높이 비율
    textLine: 4.5, textShadow: 5,     // 글씨 검정 테두리 · 그림자
    cell: 340                         // 라이브러리에 늘어놓는 칸
  };

  var logFile = null;
  function LOG(m) {
    if (!logFile) return;
    logFile.open("a");
    logFile.writeln(m);
    logFile.close();
  }

  // ── 공용 (build_bubble_style.jsx 와 같은 함수) ─────────────────
  function rgb(r, g, b) { var c = new RGBColor(); c.red = r; c.green = g; c.blue = b; return c; }
  function color(key) {
    var v = COLORS[key];
    if (!v) throw new Error("모르는 색: " + key);
    return rgb(v[0], v[1], v[2]);
  }

  function setFill(item, c) {
    var i;
    if (item.typename === "PathItem") { item.stroked = false; item.filled = true; item.fillColor = c; }
    else if (item.typename === "CompoundPathItem") { for (i = 0; i < item.pathItems.length; i++) setFill(item.pathItems[i], c); }
    else if (item.typename === "GroupItem") { for (i = 0; i < item.pageItems.length; i++) setFill(item.pageItems[i], c); }
  }

  function copySolid(item, dest) {
    var i, d;
    if (item.typename === "PathItem") {
      d = item.duplicate(dest, ElementPlacement.PLACEATEND);
      d.stroked = false; d.filled = true; d.fillColor = rgb(0, 0, 0);
    } else if (item.typename === "CompoundPathItem") {
      for (i = 0; i < item.pathItems.length; i++) {
        d = item.pathItems[i].duplicate(dest, ElementPlacement.PLACEATEND);
        d.stroked = false; d.filled = true; d.fillColor = rgb(0, 0, 0);
      }
    } else if (item.typename === "GroupItem") {
      for (i = 0; i < item.pageItems.length; i++) copySolid(item.pageItems[i], dest);
    }
  }

  function gatherPaths(item, out) {
    if (item.typename === "PathItem") out.push(item);
    else if (item.typename === "CompoundPathItem") { for (var j = 0; j < item.pathItems.length; j++) out.push(item.pathItems[j]); }
    else if (item.typename === "GroupItem") { for (var i = 0; i < item.pageItems.length; i++) gatherPaths(item.pageItems[i], out); }
  }

  // 그룹 도형들의 합집합 → 바깥 윤곽만 → dest 안에 도형 하나. { sil, pieces, holes }
  function unionOuter(doc, srcGroup, dest, tmpLayer) {
    var g = tmpLayer.groupItems.add(), i, sel, res, paths = [], big = null, sign, outer = [], holes = 0, made = [], sil;
    for (i = 0; i < srcGroup.pageItems.length; i++) copySolid(srcGroup.pageItems[i], g);
    doc.selection = null;
    g.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");
    sel = doc.selection;
    if (!sel || sel.length === 0) throw new Error("합집합 결과가 없습니다");
    res = sel[0];
    gatherPaths(res, paths);
    for (i = 0; i < paths.length; i++) if (!big || Math.abs(paths[i].area) > Math.abs(big.area)) big = paths[i];
    sign = big.area >= 0 ? 1 : -1;
    for (i = 0; i < paths.length; i++) {
      if ((paths[i].area >= 0 ? 1 : -1) === sign) outer.push(paths[i]); else holes++;
    }
    doc.selection = null;
    for (i = 0; i < outer.length; i++) made.push(outer[i].duplicate(dest, ElementPlacement.PLACEATEND));
    try { res.remove(); } catch (eR) {}
    if (made.length === 1) {
      sil = made[0];
    } else {
      for (i = 0; i < made.length; i++) made[i].selected = true;
      app.executeMenuCommand("compoundPath");
      sil = doc.selection[0];
      doc.selection = null;
      if (sil.parent !== dest) sil.move(dest, ElementPlacement.PLACEATEND);
    }
    return { sil: sil, pieces: outer.length, holes: holes };
  }

  // 모든 도형을 offsetPt 만큼 부풀려 합친 바깥 윤곽 (Offset Path jntp 0 = 라운드).
  function offsetOuter(doc, srcGroup, dest, tmpLayer, offsetPt) {
    var g = tmpLayer.groupItems.add(), i, sel, ex, g2, res;
    for (i = 0; i < srcGroup.pageItems.length; i++) copySolid(srcGroup.pageItems[i], g);
    g.applyEffect('<LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst ' + offsetPt + ' I jntp 0 "/></LiveEffect>');
    doc.selection = null;
    g.selected = true;
    app.executeMenuCommand("expandStyle");
    sel = doc.selection;
    if (!sel || sel.length === 0) throw new Error("Offset Path 확장 실패");
    ex = sel[0];
    doc.selection = null;
    g2 = tmpLayer.groupItems.add();
    copySolid(ex, g2);
    try { ex.remove(); } catch (eX) {}
    res = unionOuter(doc, g2, dest, tmpLayer);
    try { g2.remove(); } catch (eG) {}
    return res;
  }

  // 구멍을 살린 채 부풀리기 (글씨 테두리 — O·A 속구멍 안쪽에도 테두리가 생긴다). 결과를 dest 로 옮겨 돌려준다.
  function offsetKeep(doc, item, dest, offsetPt, c) {
    var d = item.duplicate(dest, ElementPlacement.PLACEATEND), sel, out;
    setFill(d, c);
    d.applyEffect('<LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst ' + offsetPt + ' I jntp 0 "/></LiveEffect>');
    doc.selection = null;
    d.selected = true;
    app.executeMenuCommand("expandStyle");
    sel = doc.selection;
    if (!sel || sel.length === 0) throw new Error("글씨 테두리 확장 실패 (Offset Path)");
    out = sel[0];
    doc.selection = null;
    if (out.parent !== dest) out.move(dest, ElementPlacement.PLACEATEND);
    setFill(out, c);
    return out;
  }

  function saveAi(doc, path) {
    var o = new IllustratorSaveOptions();
    o.pdfCompatible = true;     // 미리보기·Finder 에서 그림이 보이게
    o.embedICCProfile = false;
    o.compressed = true;
    doc.saveAs(new File(path), o);
  }

  function holder(layer, items) {
    var g = layer.groupItems.add();
    for (var i = 0; i < items.length; i++) items[i].duplicate(g, ElementPlacement.PLACEATEND);
    return g;
  }

  // ── 모양 ─────────────────────────────────────────────────────
  function sgnPow(v, e) { return (v < 0 ? -1 : 1) * Math.pow(Math.abs(v), e); }

  // 점들을 지나는 매끈한 닫힌 패스 (Catmull-Rom → 베지어). corner[i] 면 뾰족한 점.
  function smoothPath(layer, pts, corner) {
    var p = layer.pathItems.add(), n = pts.length, i, a, b, pp, tx, ty;
    p.setEntirePath(pts);
    p.closed = true;
    for (i = 0; i < n; i++) {
      pp = p.pathPoints[i];
      if (corner[i]) { pp.leftDirection = pts[i]; pp.rightDirection = pts[i]; pp.pointType = PointType.CORNER; continue; }
      a = pts[(i - 1 + n) % n];
      b = pts[(i + 1) % n];
      tx = (b[0] - a[0]) / 6;
      ty = (b[1] - a[1]) / 6;
      pp.rightDirection = [pts[i][0] + tx, pts[i][1] + ty];
      pp.leftDirection = [pts[i][0] - tx, pts[i][1] - ty];
      pp.pointType = PointType.SMOOTH;
    }
    return p;
  }

  // 둥근 네모꼴 말풍선 윤곽 점 + 꼬리. o = { round, wave, bumps, tail(도), tailHalf(도), tailLen(pt), tailBend(도) }.
  // 물결은 반지름 방향으로 곱한다 — 꼬리 밑동 두 점도 같은 물결 위에 놓아 이음새가 꺾이지 않게.
  function bubblePts(cx, cy, a, b, o) {
    var N = o.bumps ? o.bumps * 12 : 120, pts = [], corner = [], i, t, d, tipDone = false, e = 2 / o.round;
    var tt = o.tail * Math.PI / 180, bend = (o.tail < 270 ? -1 : 1) * o.tailBend * Math.PI / 180;
    function at(tv) {
      var s = 1 + (o.wave ? o.wave * Math.cos(o.bumps * tv) : 0);
      return [cx + a * sgnPow(Math.cos(tv), e) * s, cy + b * sgnPow(Math.sin(tv), e) * s];
    }
    for (i = 0; i < N; i++) {
      t = 2 * Math.PI * i / N;
      d = Math.abs(((t * 180 / Math.PI - o.tail + 540) % 360) - 180);
      if (d < o.tailHalf) {
        if (!tipDone) {
          var mid = at(tt);
          pts.push(at(tt - o.tailHalf * Math.PI / 180)); corner.push(true);
          pts.push([mid[0] + o.tailLen * Math.cos(tt + bend), mid[1] + o.tailLen * Math.sin(tt + bend)]); corner.push(true);
          pts.push(at(tt + o.tailHalf * Math.PI / 180)); corner.push(true);
          tipDone = true;
        }
        continue;
      }
      pts.push(at(t));
      corner.push(false);
    }
    return { pts: pts, corner: corner };
  }

  function makeText(layer, words, font) {
    var tf = layer.textFrames.add(), i;
    tf.contents = words;
    var ra = tf.textRange;
    ra.characterAttributes.size = 60;
    ra.characterAttributes.textFont = font;
    ra.characterAttributes.autoLeading = false;
    ra.characterAttributes.leading = 60 * 0.86;
    for (i = 0; i < tf.paragraphs.length; i++) tf.paragraphs[i].paragraphAttributes.justification = Justification.CENTER;
    return tf.createOutline();
  }

  function centerTo(item, cx, cy) {
    var g = item.geometricBounds;
    item.translate(cx - (g[0] + g[2]) / 2, cy - (g[1] + g[3]) / 2);
  }

  function countStrokes(item) {
    var n = 0, i;
    if (item.typename === "PathItem") return item.stroked ? 1 : 0;
    if (item.typename === "CompoundPathItem") { for (i = 0; i < item.pathItems.length; i++) if (item.pathItems[i].stroked) n++; return n; }
    if (item.typename === "GroupItem") { for (i = 0; i < item.pageItems.length; i++) n += countStrokes(item.pageItems[i]); }
    return n;
  }

  // 말풍선 하나 → 그룹 'DECO <key>' (위 → 아래: TEXT · TEXT_LINE · TEXT_SHADOW · BUBBLE · BUBBLE_LINE · SHADOW · SHADOW_LINE · BASE · SIL)
  function drawBubble(doc, L, tmpL, spec, cx, cy, font) {
    var S = SHAPE, ink = color("INK"), work = tmpL.groupItems.add(), rec = { key: spec.key };
    var ob = bubblePts(cx, cy, S.a + S.margin, S.b + S.margin,
      { round: S.baseRound, wave: S.wave, bumps: S.bumps, tail: spec.tail, tailHalf: S.baseTailHalf, tailLen: S.baseTailLen, tailBend: S.tailBend });
    var base = smoothPath(work, ob.pts, ob.corner);
    setFill(base, color(spec.base));
    var ib = bubblePts(cx, cy, S.a, S.b, { round: S.round, tail: spec.tail, tailHalf: S.tailHalf, tailLen: S.tailLen, tailBend: S.tailBend });
    var bubble = smoothPath(work, ib.pts, ib.corner);
    setFill(bubble, color("CREAM"));
    var text = makeText(work, spec.words, font);
    var tb = text.geometricBounds, tw = tb[2] - tb[0], th = tb[1] - tb[3];
    var sc = Math.min(2 * S.a * S.textW / tw, 2 * S.b * S.textH / th);
    text.resize(sc * 100, sc * 100);
    centerTo(text, cx, cy + 2);
    setFill(text, color(spec.text));
    rec.textScale = Math.round(sc * 1000) / 1000;

    var h1 = holder(tmpL, [bubble]);
    var bubbleLine = offsetOuter(doc, h1, work, tmpL, S.line).sil;
    h1.remove();
    setFill(bubbleLine, ink);
    var shadowLine = bubbleLine.duplicate(work, ElementPlacement.PLACEATEND);
    shadowLine.translate(S.shadow, -S.shadow);
    var shadow = bubble.duplicate(work, ElementPlacement.PLACEATEND);
    shadow.translate(S.shadow, -S.shadow);
    setFill(shadow, color(spec.shadow));
    var textLine = offsetKeep(doc, text, work, S.textLine, ink);
    var textShadow = textLine.duplicate(work, ElementPlacement.PLACEATEND);
    textShadow.translate(S.textShadow, -S.textShadow);

    // 바깥 테두리 = 물결 바탕을 테두리만큼 부풀린 것 ∪ 튀어나올 수 있는 조각들 (그림자·글씨) — 한 조각이어야 칼선이 하나다.
    var h2 = holder(tmpL, [base]);
    var baseLine = offsetOuter(doc, h2, tmpL, tmpL, S.line).sil;
    h2.remove();
    var h3 = holder(tmpL, [baseLine, shadowLine, bubbleLine, textLine, textShadow]);
    baseLine.remove();
    var u = unionOuter(doc, h3, work, tmpL);
    h3.remove();
    if (u.pieces !== 1) throw new Error("말풍선 " + spec.key + ": 바깥 테두리가 " + u.pieces + "조각 — 칼선이 하나가 아닙니다");
    var sil = u.sil;
    setFill(sil, ink);

    var g = L.groupItems.add();
    g.name = "DECO " + spec.key;
    var order = [[text, "TEXT"], [textLine, "TEXT_LINE"], [textShadow, "TEXT_SHADOW"], [bubble, "BUBBLE"], [bubbleLine, "BUBBLE_LINE"],
                 [shadow, "SHADOW"], [shadowLine, "SHADOW_LINE"], [base, "BASE"], [sil, "SIL"]];
    for (var k = 0; k < order.length; k++) {
      order[k][0].move(g, ElementPlacement.PLACEATEND);
      order[k][0].name = order[k][1];
    }
    work.remove();
    rec.strokes = countStrokes(g);
    return { group: g, rec: rec };
  }

  // ── 미리보기 그림 ─────────────────────────────────────────────
  function exportGroup(src, path, px) {
    var tmp = app.documents.add(DocumentColorSpace.RGB, 1000, 1000), b;
    try {
      var d = src.duplicate(tmp.layers[0], ElementPlacement.PLACEATEND);
      app.activeDocument = tmp;     // exportFile 은 활성 문서를 내보낸다 — 반드시 먼저 바꾼다
      b = d.geometricBounds;
      tmp.artboards[0].artboardRect = [b[0], b[1], b[2], b[3]];
      var o = new ExportOptionsPNG24();
      o.artBoardClipping = true;
      o.transparency = true;
      o.antiAliasing = true;
      o.horizontalScale = px / (b[1] - b[3]) * 100;
      o.verticalScale = o.horizontalScale;
      tmp.exportFile(new File(path), ExportType.PNG24, o);
    } finally {
      try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (e) {}
    }
    return b;
  }

  function fix4(v) {
    var s = String(Math.round(v * 10000) / 10000);
    if (s.indexOf(".") < 0) s += ".";
    while (s.length - s.indexOf(".") < 5) s += "0";
    return s;
  }

  // range.jsx 의 여러 줄 표 (var NAME = { … }) 안쪽 줄들. 못 찾으면 null.
  function currentTableLines(name) {
    var f = new File(REPO.fsName + "/Everstory_range.jsx");
    f.encoding = "UTF-8";
    if (!f.open("r")) return null;
    var text = f.read();
    f.close();
    var m = text.replace(/\r\n?/g, "\n").match(new RegExp("var " + name + " = \\{\\n([\\s\\S]*?)\\n  \\};"));
    return m ? m[1].split("\n") : null;
  }

  // 이름은 그대로, 숫자는 반올림 경계 차이(0.0001)까지 같은 것으로 본다. 다른 줄 목록.
  function tableDiff(curLines, newLines, name) {
    var out = [], i, a, b;
    if (!curLines) return ["range.jsx 에서 " + name + " 를 못 찾음"];
    if (curLines.length !== newLines.length) return ["줄 수 " + curLines.length + " → " + newLines.length];
    for (i = 0; i < newLines.length; i++) {
      a = curLines[i];
      b = newLines[i];
      if (a.replace(/[\d.]+/g, "#") !== b.replace(/[\d.]+/g, "#") ||
          Math.abs(Number(a.match(/\d+\.\d+/)) - Number(b.match(/\d+\.\d+/))) > 0.00015) out.push(b);
    }
    return out;
  }

  // ── 실행 ─────────────────────────────────────────────────────
  var prevUI = app.userInteractionLevel, report = [], errorText = "";
  var stamp = new Date().getTime();
  var work = new Folder((CFG && CFG.work) ? CFG.work : Folder.temp.fsName + "/everstory_retro_bubbles_" + stamp);
  try {
    if (!work.exists) work.create();
    logFile = new File(work.fsName + "/build.log");
    logFile.encoding = "UTF-8";
    logFile.lineFeed = "Unix";
    logFile.open("w"); logFile.close();
    var font;
    try { font = app.textFonts.getByName(FONT_NAME); } catch (eF) {
      throw new Error("서체 " + FONT_NAME + " 가 없습니다 — Luckiest Guy(Google Fonts)를 설치하고 Illustrator 를 다시 켜세요");
    }
    var src = new File(TEMPLATES + "/" + LIB_NAME), copy = work.fsName + "/src_" + LIB_NAME;
    if (!src.exists) throw new Error("라이브러리가 없습니다: " + src.fsName);
    if (!src.copy(copy)) throw new Error("라이브러리를 작업 폴더로 복사하지 못했습니다");
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
    var prevDoc = null;
    try { prevDoc = app.activeDocument; } catch (eNo) {}

    var outPath = work.fsName + "/" + LIB_NAME, recs = [], aspects = [], lines = [], i, k;
    var doc = app.open(new File(copy));
    try {
      var L = doc.layers[0], removed = 0;
      for (i = L.groupItems.length - 1; i >= 0; i--) {
        for (k = 0; k < BUBBLES.length; k++) {
          if (L.groupItems[i].name === "DECO " + BUBBLES[k].key) { L.groupItems[i].remove(); removed++; break; }
        }
      }
      // 기존 데코 아래에 3개씩 늘어놓는다
      var box = null, gb;
      for (i = 0; i < L.pageItems.length; i++) {
        gb = L.pageItems[i].geometricBounds;
        if (!box) box = [gb[0], gb[1], gb[2], gb[3]];
        else box = [Math.min(box[0], gb[0]), Math.max(box[1], gb[1]), Math.max(box[2], gb[2]), Math.min(box[3], gb[3])];
      }
      if (!box) throw new Error("라이브러리에 기존 데코가 없습니다");
      var tmpL = doc.layers.add();
      tmpL.name = "tmp";
      var groups = [];
      for (i = 0; i < BUBBLES.length; i++) {
        var cx = box[0] + SHAPE.cell / 2 + (i % 3) * SHAPE.cell, cy = box[3] - 60 - SHAPE.cell / 2 - Math.floor(i / 3) * SHAPE.cell;
        var r = drawBubble(doc, L, tmpL, BUBBLES[i], cx, cy, font);
        groups.push(r.group);
        recs.push(r.rec);
        LOG(BUBBLES[i].key + " 글씨 배율 " + r.rec.textScale + " · 선 " + r.rec.strokes);
      }
      tmpL.remove();
      app.redraw();
      for (i = 0; i < groups.length; i++) {
        gb = groups[i].geometricBounds;
        var silB = groups[i].pageItems.getByName("SIL").geometricBounds;
        var cover = Math.abs(silB[0] - gb[0]) < 0.01 && Math.abs(silB[1] - gb[1]) < 0.01 && Math.abs(silB[2] - gb[2]) < 0.01 && Math.abs(silB[3] - gb[3]) < 0.01;
        if (!cover) throw new Error("말풍선 " + BUBBLES[i].key + ": 바깥 테두리(SIL)가 그룹 경계와 다릅니다 — 칼선 밖으로 나간 조각이 있습니다");
        if (recs[i].strokes) throw new Error("말풍선 " + BUBBLES[i].key + ": 선(stroke) " + recs[i].strokes + "개 — 모두 채운 도형이어야 합니다");
        box = [Math.min(box[0], gb[0]), Math.max(box[1], gb[1]), Math.max(box[2], gb[2]), Math.min(box[3], gb[3])];
        aspects.push((gb[2] - gb[0]) / (gb[1] - gb[3]));
        lines.push("    " + BUBBLES[i].key + ": " + fix4(aspects[i]) + (i < BUBBLES.length - 1 ? "," : ""));
      }
      doc.artboards[0].artboardRect = [box[0] - 10, box[1] + 10, box[2] + 10, box[3] - 10];
      saveAi(doc, outPath);
      report.push("말풍선 " + groups.length + "종 (" + (removed ? "기존 " + removed + "개 바꿈" : "새로 추가") + ") · 칼선 한 조각 · 선 0 · 라이브러리 그룹 " + L.groupItems.length + "개");
      var pdir = new Folder(work.fsName + "/art_preview/deco_art_v1");
      if (!pdir.exists) pdir.create();
      for (i = 0; i < groups.length; i++) exportGroup(groups[i], pdir.fsName + "/DECO_" + BUBBLES[i].key + ".png", DECO_PX);
      report.push("미리보기 그림 " + groups.length + "장");
    } finally {
      doc.close(SaveOptions.DONOTSAVECHANGES);
    }
    var af = new File(work.fsName + "/DECO_BUBBLE_ASPECT_V1.txt");
    af.encoding = "UTF-8";
    af.lineFeed = "Unix";
    af.open("w");
    af.write("  var DECO_BUBBLE_ASPECT_V1 = {\n" + lines.join("\n") + "\n  };\n");
    af.close();
    var diff = tableDiff(currentTableLines("DECO_BUBBLE_ASPECT_V1"), lines, "DECO_BUBBLE_ASPECT_V1");
    report.push(diff.length === 0 ? "비율표: range.jsx 와 같음"
      : "⚠ 비율표가 range.jsx 와 다름 (" + diff.length + "줄) — " + af.fsName + " 로 DECO_BUBBLE_ASPECT_V1 을 바꾸고 테스트를 돌리세요");
    for (i = 0; i < diff.length; i++) LOG("비율표 다름: " + diff[i]);
    if (prevDoc) { try { app.activeDocument = prevDoc; } catch (eAct) {} }
    app.userInteractionLevel = prevUI;

    var install = !(CFG && CFG.workOnly);
    if (install && !CFG) install = confirm("templates 의 " + LIB_NAME + " · art_preview/deco_art_v1 말풍선 그림을 새로 만든 것으로 바꿀까요?\n\n" + report.join("\n"));
    if (install) {
      if (!(new File(outPath)).copy(TEMPLATES + "/" + LIB_NAME)) throw new Error("templates 에 라이브러리를 복사하지 못했습니다");
      var n = 0, dst = TEMPLATES + "/art_preview/deco_art_v1";
      for (i = 0; i < BUBBLES.length; i++) {
        var pf = new File(work.fsName + "/art_preview/deco_art_v1/DECO_" + BUBBLES[i].key + ".png");
        if (!pf.copy(dst + "/DECO_" + BUBBLES[i].key + ".png")) throw new Error("그림 복사 실패: " + pf.fsName);
        n++;
      }
      report.push("templates 에 설치 (그림 " + n + "장) — 주문 보드는 새로고침만 하면 된다");
    } else {
      report.push("templates 는 그대로 — 결과: " + work.fsName);
    }
  } catch (e) {
    errorText = (e && e.message) ? e.message : String(e);
    LOG("오류: " + errorText + " (line " + e.line + ")");
  } finally {
    app.userInteractionLevel = prevUI;
  }
  var text = (errorText ? "⚠ 중단: " + errorText + "\n\n" : "완료\n\n") + report.join("\n") + "\n\n작업 폴더: " + work.fsName;
  if (CFG) {
    CFG.report = text;
    CFG.ok = !errorText;
  } else {
    alert(text);
  }
})();
