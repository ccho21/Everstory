// ═══════════════════════════════════════════════════════════════
//  Everstory 버블 이름 스타일 — 라이브러리 다시 만들기 (2026-09-17)
//
//  원본 두 파일(shopify_assets/assets)
//    · 알파벳 샘플_6.ai    → templates/alphabet_art_v2.ai  (그룹 'LTR A'~'LTR Z')
//    · sticker sample 4.ai → templates/deco_art_v2.ai      (그룹 'DECO SMILE' … 27종)
//  과 주문 보드 미리보기 그림(templates/art_preview/…/*.png), 글자 치수표·색 표·말풍선 비율표를 만든다.
//  원본 파일은 사본으로만 연다 (저장·수정 안 함). 결과는 먼저 임시 폴더에 만들고, 확인 창에서 "예"를 눌러야
//  templates 에 덮어쓴다. 치수표·색 표·말풍선 비율표가 Everstory_range.jsx 의 LETTER_ART_METRICS_V2 · LETTER_ART_PAINTS_V2 ·
//  DECO_BUBBLE_ASPECT_V2 와 다르면 완료 창에 알린다 — 그때는 새 표(작업 폴더의 .txt)로 range.jsx 를 고치고 테스트를 돌린다 (README.md).
//
//  라이브러리 규칙 (range.jsx 가 기대하는 모양 — 바꾸면 range.jsx 도 같이):
//   · 글자 그룹 = 글자 몸통('BODY' = 검정 테두리 컴파운드) + 안쪽 장식·바탕('FACE') + 맨 아래 'SIL'(합집합 바깥 윤곽, 흰색).
//     몸통 밖으로 튀어나온 조각은 'SIDE L' / 'SIDE R' 묶음(안에도 'SIL') — 이름 줄의 맨 앞 / 맨 끝 글자에서만 쓴다.
//   · 색 그룹 'LTR A PINK' = 글자 그룹 복제 + 바탕(FACE)만 그 색 (2026-09-17 — 이름 글자 색 돌리기). 글자 안 장식과 같은 색은 안 만든다.
//   · 데코 그룹 = 두들 + 맨 아래 'SIL' = 흰 테두리(최대 변의 6% 부터, 한 장으로 이어질 때까지 키움) = 칼선.
//   · 원본의 흰(크림) 채우기는 여러 글자에 걸친 컴파운드 하나라 풀어서 글자별로 다시 묶는다.
//   · 두들 자리 = DOODLE_ITEMS 상자 (원본 좌표). 원본에서 두들을 옮기거나 더하면 상자를 고친다.
//
//  사용: File → Scripts → Other Script → 이 파일. 테스트 훅 $.global.__EVERSTORY_ART_BUILD__ =
//        { alpha, doodle, work, workOnly: true } (workOnly = templates 를 건드리지 않고 결과를 cfg.report 에).
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  var CFG = $.global.__EVERSTORY_ART_BUILD__ || null;
  $.global.__EVERSTORY_ART_BUILD__ = undefined;
  var SCRIPT_DIR = (new File($.fileName)).parent;          // scripts/art_library
  var REPO = SCRIPT_DIR.parent.parent;                     // 포토샵누끼
  var TEMPLATES = REPO.fsName + "/templates";
  var ASSETS = REPO.parent.fsName + "/shopify_assets/assets";
  var LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var HALO_STEPS = [0.06, 0.08, 0.10, 0.12, 0.15, 0.18];   // 데코 흰 테두리 = 최대 변 × 이 값 (한 장이 될 때까지)
  var LETTER_PX = 240, DECO_PX = 200;                      // 미리보기 그림 높이 (px)
  // 글자 색 (range.jsx LETTER_ART_PAINTS_V2 의 이름) = 원본 알파벳의 바탕 색 그대로. 여기 없는 바탕 색이 나오면 멈춘다.
  var PAINTS = [
    { key: "WHITE", rgb: "244,244,244" },
    { key: "PINK", rgb: "250,174,176" },
    { key: "YELLOW", rgb: "251,213,63" },
    { key: "SKY", rgb: "176,205,235" }
  ];
  var FACE_MIN = 0.2;                                      // 바탕 = 채우기(FILL) 넓이의 이 비율 이상인 색 조각
  // 글씨 말풍선 두들 (range.jsx DECO_BUBBLES_V2 와 같은 목록) — 시트에 그림 비율대로 크게 놓으므로 비율표를 잰다.
  var BUBBLES = ["YAY", "BESTDAY", "FOREVER", "YOUME", "MYFAVE", "XOXO"];
  // 원본 sticker sample 4 의 두들 자리 (pt, [left, top, right, bottom]) — 2026-09-17 원본 기준
  var DOODLE_ITEMS = [
    { name: "SMILE", b: [-78.419, 1032.954, 132.582, 829.030] },
    { name: "HEART", b: [170.408, 1025.495, 372.438, 863.915] },
    { name: "CLOUD", b: [404.648, 1025.856, 606.512, 850.836] },
    { name: "YAY", b: [630.614, 1028.343, 887.576, 817.151] },
    { name: "STAR", b: [910.748, 1035.032, 1083.730, 844.769] },
    { name: "FLOWER", b: [-94.200, 802.476, 121.190, 506.477] },
    { name: "DAISY", b: [143.805, 814.975, 373.478, 580.456] },
    { name: "BOW", b: [405.682, 800.478, 649.196, 569.446] },
    { name: "CHERRY", b: [661.749, 794.656, 891.037, 575.881] },
    { name: "CLOVER", b: [910.591, 796.365, 1095.836, 569.545] },
    { name: "LOVE", b: [-68.063, 443.191, 108.113, 356.185] },
    { name: "XOXO", b: [159.199, 539.701, 451.894, 370.813] },
    { name: "SUN", b: [478.540, 555.136, 702.470, 326.269] },
    { name: "BOLT", b: [737.705, 542.424, 856.992, 324.338] },
    { name: "SPARKLES", b: [897.092, 529.772, 1088.528, 317.291] },
    { name: "LUCKY", b: [-66.492, 270.092, 120.306, 149.967] },
    { name: "BESTDAY", b: [155.422, 327.443, 394.980, 119.811] },
    { name: "YOUME", b: [407.790, 304.047, 618.736, 117.524] },
    { name: "FOREVER", b: [638.556, 296.520, 841.542, 116.833] },
    { name: "MYFAVE", b: [849.874, 286.051, 1096.415, 112.983] },
    { name: "BURSTPINK", b: [-78.873, 87.283, 55.901, -18.845] },
    { name: "DOTS", b: [101.671, 60.137, 240.465, -1.291] },
    { name: "SWOOSH", b: [256.661, 44.395, 460.054, -24.403] },
    { name: "ARROW", b: [483.321, 62.717, 628.647, -26.109] },
    { name: "BURSTGOLD", b: [665.801, 75.378, 805.342, -22.673] },
    { name: "MINIHEART", b: [855.883, 63.730, 944.945, -26.916] },
    { name: "SPARKLE", b: [991.111, 73.166, 1072.996, -23.656] }
  ];

  var logFile = null;
  function LOG(m) {
    if (!logFile) return;
    logFile.open("a");
    logFile.writeln(m);
    logFile.close();
  }

  // ── 공용 ─────────────────────────────────────────────────────
  function rgbKey(c) {
    if (!c || c.typename !== "RGBColor") return c ? c.typename : "none";
    return Math.round(c.red) + "," + Math.round(c.green) + "," + Math.round(c.blue);
  }

  function fillKey(it) {
    try {
      if (it.typename === "PathItem") return it.filled ? rgbKey(it.fillColor) : "none";
      if (it.typename === "CompoundPathItem") {
        var p = it.pathItems[0];
        return (p && p.filled) ? rgbKey(p.fillColor) : "none";
      }
    } catch (e) {}
    return "?";
  }

  function areaOf(it) {
    if (it.typename === "PathItem") return Math.abs(it.area);
    var a = 0;
    for (var j = 0; j < it.pathItems.length; j++) a += it.pathItems[j].area;
    return Math.abs(a);
  }

  function collectLeaves(it, out) {
    if (it.typename === "GroupItem") {
      for (var i = 0; i < it.pageItems.length; i++) collectLeaves(it.pageItems[i], out);
      return;
    }
    out.push(it);
  }

  // 레이어의 모든 잎(패스·컴파운드)을 쌓임 순서대로 레이어 바로 아래로 꺼내고 빈 그룹을 지운다.
  function flattenLayer(L) {
    var leaves = [], i, again = true, out = [];
    for (i = 0; i < L.pageItems.length; i++) collectLeaves(L.pageItems[i], leaves);
    for (i = 0; i < leaves.length; i++) leaves[i].move(L, ElementPlacement.PLACEATEND);
    while (again) {
      again = false;
      for (i = L.groupItems.length - 1; i >= 0; i--) {
        if (L.groupItems[i].pageItems.length === 0) { L.groupItems[i].remove(); again = true; }
      }
    }
    for (i = 0; i < L.pageItems.length; i++) out.push(L.pageItems[i]);
    return out;
  }

  // 여러 조각에 걸친 큰 채우기 컴파운드를 풀고 조각마다 "__W" 표시. 푼 직후 경계는 화면을 다시 그려야 맞는다.
  function releaseBigFill(doc, L, items) {
    var big = null, i, rel;
    for (i = 0; i < items.length; i++) if (items[i].typename === "CompoundPathItem" && areaOf(items[i]) > 100000) big = items[i];
    if (!big) throw new Error("여러 조각에 걸친 큰 채우기 컴파운드가 없습니다 — 원본 구조가 바뀌었는지 확인");
    doc.selection = null;
    big.selected = true;
    app.executeMenuCommand("noCompoundPath");
    rel = doc.selection;
    for (i = 0; i < rel.length; i++) rel[i].name = "__W";
    doc.selection = null;
    app.redraw();
    var out = [];
    for (i = 0; i < L.pageItems.length; i++) out.push(L.pageItems[i]);
    return out;
  }

  // "__W" 조각이 여럿이면 다시 컴파운드 (구멍 복원), 이름을 tagName 으로.
  function remakeFill(doc, parent, tagName) {
    var ws = [], k, cp;
    for (k = 0; k < parent.pageItems.length; k++) if (parent.pageItems[k].name === "__W") ws.push(parent.pageItems[k]);
    if (ws.length > 1) {
      doc.selection = null;
      for (k = 0; k < ws.length; k++) ws[k].selected = true;
      app.executeMenuCommand("compoundPath");
      cp = doc.selection[0];
      doc.selection = null;
      cp.name = tagName;
    } else if (ws.length === 1) {
      ws[0].name = tagName;
    }
    return ws.length;
  }

  function bcx(b) { return (b[0] + b[2]) / 2; }
  function bcy(b) { return (b[1] + b[3]) / 2; }
  function inB(b, x, y, m) { return b[0] - m <= x && x <= b[2] + m && b[3] - m <= y && y <= b[1] + m; }
  function edist(b, o) {
    var dx = Math.max(b[0] - o[2], o[0] - b[2], 0), dy = Math.max(b[3] - o[1], o[3] - b[1], 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function rgb(r, g, b) { var c = new RGBColor(); c.red = r; c.green = g; c.blue = b; return c; }

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

  function setFill(item, color) {
    var i;
    if (item.typename === "PathItem") { item.stroked = false; item.filled = true; item.fillColor = color; }
    else if (item.typename === "CompoundPathItem") { for (i = 0; i < item.pathItems.length; i++) setFill(item.pathItems[i], color); }
    else if (item.typename === "GroupItem") { for (i = 0; i < item.pageItems.length; i++) setFill(item.pageItems[i], color); }
  }

  // 그룹 도형들의 합집합 → 바깥 윤곽만(감긴 방향이 가장 큰 윤곽과 같은 것) → dest 안에 도형 하나. { sil, pieces, holes }
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

  // 흰 테두리 — 모든 도형을 offsetPt 만큼 부풀려 합친 바깥 윤곽 (Offset Path jntp 0 = 라운드).
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

  function saveAi(doc, path) {
    var o = new IllustratorSaveOptions();
    o.pdfCompatible = true;     // 미리보기·Finder 에서 그림이 보이게
    o.embedICCProfile = false;
    o.compressed = true;
    doc.saveAs(new File(path), o);
  }

  // ── 글자 색 ──────────────────────────────────────────────────
  function paintKey(rgbText) {
    for (var i = 0; i < PAINTS.length; i++) if (PAINTS[i].rgb === rgbText) return PAINTS[i].key;
    return null;
  }

  function paintColor(key) {
    for (var i = 0; i < PAINTS.length; i++) {
      if (PAINTS[i].key === key) {
        var v = PAINTS[i].rgb.split(",");
        return rgb(Number(v[0]), Number(v[1]), Number(v[2]));
      }
    }
    throw new Error("모르는 글자 색: " + key);
  }

  // 글자 바탕 찾기 + 칠할 수 있는 색. 바탕 = 흰색이 아닌 팔레트 색 중 조각 넓이 합이 FILL 의 FACE_MIN 이상인 색의 조각 전부
  // (N 은 하늘 줄무늬 조각들), 없으면 가장 넓은 흰 조각 하나 (흰 글자). 바탕 조각에 이름 'FACE' 를 붙인다.
  // 그 밖의 팔레트 색 조각(옆 장식 묶음 안 포함) = 장식 → 그 색은 뺀다 (A 의 노란 하트 → 노랑 없음 · O 의 흰 속구멍 → 흰색 없음).
  // 흰 글자의 흰 조각(R 속구멍)은 바탕과 같은 색이라 빼지 않는다. 반환 = 색 목록, 첫 색 = 원래 색.
  function paintLetter(g, ch) {
    var fillA = 0, parts = [], tot = {}, deco = {}, faces = [], seen = [], base = null, best = 0, i, j, it, key, a, big = null, faceA = 0;
    for (i = 0; i < g.pageItems.length; i++) {
      it = g.pageItems[i];
      if (it.name === "FILL") { fillA = areaOf(it); continue; }
      if (it.name === "BODY" || it.name === "SIL") continue;
      if (it.typename === "GroupItem") {
        for (j = 0; j < it.pageItems.length; j++) {
          if (it.pageItems[j].name === "FILL" || it.pageItems[j].name === "SIL") continue;
          key = paintKey(fillKey(it.pageItems[j]));
          if (key) deco[key] = true;
        }
        continue;
      }
      key = paintKey(fillKey(it));
      a = areaOf(it);
      parts.push({ it: it, key: key, area: a });
      seen.push(fillKey(it));
      if (key) tot[key] = (tot[key] || 0) + a;
    }
    if (!(fillA > 0)) throw new Error("글자 " + ch + " 에 FILL 이 없습니다");
    for (key in tot) {
      if (tot.hasOwnProperty(key) && key !== "WHITE" && tot[key] >= FACE_MIN * fillA && tot[key] > best) { best = tot[key]; base = key; }
    }
    if (base) {
      for (i = 0; i < parts.length; i++) if (parts[i].key === base) faces.push(parts[i]);
    } else {
      base = "WHITE";
      for (i = 0; i < parts.length; i++) if (parts[i].key === "WHITE" && (!big || parts[i].area > big.area)) big = parts[i];
      if (big) faces.push(big);
    }
    for (i = 0; i < faces.length; i++) faceA += faces[i].area;
    if (faceA < FACE_MIN * fillA) {
      throw new Error("글자 " + ch + " 의 바탕 색을 모릅니다 (조각 색 " + seen.join(" / ") +
        ") — 원본에서 바탕 색을 바꿨다면 스크립트의 PAINTS 표에 그 색을 더하세요");
    }
    for (i = 0; i < parts.length; i++) {
      var isFace = false;
      for (j = 0; j < faces.length; j++) if (faces[j] === parts[i]) isFace = true;
      if (isFace) parts[i].it.name = "FACE";
      else if (parts[i].key && parts[i].key !== base) deco[parts[i].key] = true;
    }
    var out = [base];
    for (i = 0; i < PAINTS.length; i++) if (PAINTS[i].key !== base && !deco[PAINTS[i].key]) out.push(PAINTS[i].key);
    return out;
  }

  // 색 그룹 — 글자 그룹을 복제해 바탕(FACE)만 칠한다 ('LTR A PINK'). 첫 색(원래 색)은 원래 그룹 그대로라 만들지 않는다.
  function makePaintGroups(L, g, ch, paints) {
    var made = 0, k, i, v, faces;
    for (k = 1; k < paints.length; k++) {
      v = g.duplicate(L, ElementPlacement.PLACEATEND);
      v.name = "LTR " + ch + " " + paints[k];
      faces = 0;
      for (i = 0; i < v.pageItems.length; i++) {
        if (v.pageItems[i].name === "FACE") { setFill(v.pageItems[i], paintColor(paints[k])); faces++; }
      }
      if (!faces) throw new Error(v.name + " 에 바탕(FACE) 조각이 없습니다");
      made++;
    }
    return made;
  }

  // ── 알파벳 ───────────────────────────────────────────────────
  function buildAlphabet(srcPath, outPath) {
    var rep = { letters: [], paintGroups: 0 }, doc = app.open(new File(srcPath)), i, j, k;
    try {
      var L = doc.layers[0];
      var items = releaseBigFill(doc, L, flattenLayer(L));
      // 몸통 = 검정 테두리 컴파운드 (넓이 4000 이상) 26개 → 행(위→아래)·열(왼→오른) = A~Z
      var bodies = [];
      for (i = 0; i < items.length; i++) {
        if (items[i].typename === "CompoundPathItem" && fillKey(items[i]) === "12,12,12" && areaOf(items[i]) > 4000) bodies.push(items[i]);
      }
      if (bodies.length !== 26) throw new Error("글자 몸통(검정 테두리)이 " + bodies.length + "개 — 26개여야 합니다");
      bodies.sort(function (a, b) { return bcy(b.geometricBounds) - bcy(a.geometricBounds); });
      var rows = [], cur = null, order = [];
      for (i = 0; i < bodies.length; i++) {
        if (cur && Math.abs(bcy(cur[0].geometricBounds) - bcy(bodies[i].geometricBounds)) < 100) cur.push(bodies[i]);
        else { cur = [bodies[i]]; rows.push(cur); }
      }
      for (i = 0; i < rows.length; i++) {
        rows[i].sort(function (a, b) { return bcx(a.geometricBounds) - bcx(b.geometricBounds); });
        for (j = 0; j < rows[i].length; j++) order.push(rows[i][j]);
      }
      for (i = 0; i < 26; i++) order[i].name = "BODY";
      // 조각 → 글자: 중심이 든 몸통 (여럿이면 가까운 것), 없으면 가장 가까운 몸통 (떨어진 장식)
      var who = [];
      for (i = 0; i < items.length; i++) {
        var it = items[i], ch = null, b, x, y, hit = [];
        for (j = 0; j < 26; j++) if (order[j] === it) ch = LETTERS.charAt(j);
        if (!ch) {
          b = it.geometricBounds; x = bcx(b); y = bcy(b);
          for (k = 0; k < 26; k++) if (inB(order[k].geometricBounds, x, y, 1)) hit.push(k);
          if (hit.length === 1) {
            ch = LETTERS.charAt(hit[0]);
          } else if (hit.length > 1) {
            var bestK = hit[0], bestD = 1e9;
            for (k = 0; k < hit.length; k++) {
              var ob = order[hit[k]].geometricBounds, dd = Math.pow(bcx(ob) - x, 2) + Math.pow(bcy(ob) - y, 2);
              if (dd < bestD) { bestD = dd; bestK = hit[k]; }
            }
            ch = LETTERS.charAt(bestK);
          } else {
            var bk = 0, bd = 1e9;
            for (k = 0; k < 26; k++) { var e = edist(order[k].geometricBounds, b); if (e < bd) { bd = e; bk = k; } }
            ch = LETTERS.charAt(bk);
            if (bd > 60) LOG("⚠ 멀리 떨어진 조각 → " + ch + " (" + Math.round(bd) + "pt)");
          }
        }
        who.push(ch);
      }
      var groups = {};
      for (i = 25; i >= 0; i--) {
        var g = L.groupItems.add();
        g.name = "LTR " + LETTERS.charAt(i);
        groups[LETTERS.charAt(i)] = g;
      }
      for (i = 0; i < items.length; i++) items[i].move(groups[who[i]], ElementPlacement.PLACEATEND);
      var tmpL = doc.layers.add();
      tmpL.name = "tmp";
      for (i = 0; i < 26; i++) {
        var c2 = LETTERS.charAt(i), g2 = groups[c2], body = null, sides = { L: [], R: [] }, rec = { ch: c2 };
        for (j = 0; j < g2.pageItems.length; j++) if (g2.pageItems[j].name === "BODY") body = g2.pageItems[j];
        var bb = body.geometricBounds;
        // 몸통 경계 밖으로 나간 조각 = 옆 장식 (왼쪽/오른쪽은 중심으로)
        for (j = 0; j < g2.pageItems.length; j++) {
          var p = g2.pageItems[j];
          if (p === body) continue;
          var lb = p.geometricBounds;
          if (!(lb[0] < bb[0] - 1 || lb[2] > bb[2] + 1 || lb[1] > bb[1] + 1 || lb[3] < bb[3] - 1)) continue;
          if (lb[0] < bb[0] - 1 && lb[2] > bb[2] + 1) { LOG("⚠ 양쪽으로 넘친 조각 " + c2); continue; }
          if (bcx(lb) < bcx(bb)) sides.L.push(p); else sides.R.push(p);
        }
        var sk = ["L", "R"];
        for (var s2 = 0; s2 < 2; s2++) {
          var list = sides[sk[s2]];
          if (!list.length) continue;
          var sg = g2.groupItems.add();
          sg.name = "SIDE " + sk[s2];
          for (j = 0; j < list.length; j++) list[j].move(sg, ElementPlacement.PLACEATEND);
          remakeFill(doc, sg, "FILL");
          var su = unionOuter(doc, sg, sg, tmpL);
          su.sil.name = "SIL";
          setFill(su.sil, rgb(255, 255, 255));
          su.sil.move(sg, ElementPlacement.PLACEATEND);
          rec["side" + sk[s2]] = su.pieces;
        }
        remakeFill(doc, g2, "FILL");
        var coreG = tmpL.groupItems.add();
        for (j = 0; j < g2.pageItems.length; j++) {
          var cj = g2.pageItems[j];
          if (cj.typename === "GroupItem" && cj.name.indexOf("SIDE ") === 0) continue;
          cj.duplicate(coreG, ElementPlacement.PLACEATEND);
        }
        var u = unionOuter(doc, coreG, g2, tmpL);
        coreG.remove();
        u.sil.name = "SIL";
        setFill(u.sil, rgb(255, 255, 255));
        u.sil.move(g2, ElementPlacement.PLACEATEND);
        rec.pieces = u.pieces;
        rep.letters.push(rec);
      }
      tmpL.remove();
      // 글자 색 — 모든 글자 그룹이 다 만들어진 뒤에 복제한다 (복제본에도 SIL · SIDE 가 그대로 들어간다).
      for (i = 0; i < 26; i++) {
        var c3 = LETTERS.charAt(i);
        rep.letters[i].paints = paintLetter(groups[c3], c3);
        rep.paintGroups += makePaintGroups(L, groups[c3], c3, rep.letters[i].paints);
      }
      saveAi(doc, outPath);
    } finally {
      doc.close(SaveOptions.DONOTSAVECHANGES);
    }
    return rep;
  }

  // ── 두들 데코 ────────────────────────────────────────────────
  function buildDoodles(srcPath, outPath) {
    var rep = { items: [], outside: 0 }, doc = app.open(new File(srcPath)), i, j, k;
    try {
      var L = doc.layers[0];
      var items = releaseBigFill(doc, L, flattenLayer(L));
      var groups = [];
      for (i = DOODLE_ITEMS.length - 1; i >= 0; i--) {
        var g = L.groupItems.add();
        g.name = "DECO " + DOODLE_ITEMS[i].name;
        groups[i] = g;
      }
      for (i = 0; i < items.length; i++) {
        var b = items[i].geometricBounds, x = bcx(b), y = bcy(b), hit = -1;
        for (k = 0; k < DOODLE_ITEMS.length; k++) if (inB(DOODLE_ITEMS[k].b, x, y, 0)) { hit = k; break; }
        if (hit < 0) {
          var bd = 1e9;
          for (k = 0; k < DOODLE_ITEMS.length; k++) { var e = edist(DOODLE_ITEMS[k].b, b); if (e < bd) { bd = e; hit = k; } }
          LOG("⚠ 두들 상자 밖 조각 → " + DOODLE_ITEMS[hit].name + " (" + Math.round(bd) + "pt) — 원본에서 두들을 옮겼다면 DOODLE_ITEMS 를 고칠 것");
          rep.outside++;
        }
        items[i].move(groups[hit], ElementPlacement.PLACEATEND);
      }
      var tmpL = doc.layers.add();
      tmpL.name = "tmp";
      for (i = 0; i < DOODLE_ITEMS.length; i++) {
        var gi = groups[i], rec = { name: DOODLE_ITEMS[i].name, leaves: gi.pageItems.length };
        if (!rec.leaves) throw new Error("두들 " + rec.name + " 에 들어온 조각이 없습니다 — DOODLE_ITEMS 상자 확인");
        remakeFill(doc, gi, "FILL");
        var ab = gi.geometricBounds, side = Math.max(ab[2] - ab[0], ab[1] - ab[3]), done = null;
        for (k = 0; k < HALO_STEPS.length; k++) {
          var res = offsetOuter(doc, gi, tmpL, tmpL, HALO_STEPS[k] * side);
          if (res.pieces === 1) { done = res; rec.halo = HALO_STEPS[k]; break; }
          try { res.sil.remove(); } catch (eS) {}
        }
        if (!done) throw new Error("두들 " + rec.name + ": 흰 테두리를 최대 변의 " + HALO_STEPS[HALO_STEPS.length - 1] + " 까지 키워도 한 장이 안 됩니다");
        done.sil.name = "SIL";
        setFill(done.sil, rgb(255, 255, 255));
        done.sil.move(gi, ElementPlacement.PLACEATEND);
        rep.items.push(rec);
      }
      tmpL.remove();
      saveAi(doc, outPath);
    } finally {
      doc.close(SaveOptions.DONOTSAVECHANGES);
    }
    return rep;
  }

  // ── 미리보기 그림 + 치수 ───────────────────────────────────────
  // 그룹마다 투명 PNG (높이 px) — 파일 이름 = 그룹 이름의 공백을 밑줄로 ('LTR A PINK' → LTR_A_PINK.png).
  // 옆 장식이 있는 글자는 LTR_C_R · LTR_C_PINK_R 처럼 장식을 넣은 그림도. measure 면 원래 글자 그룹의 틀·몸통 경계를 돌려준다
  // (색 그룹은 모양이 같아 재지 않는다).
  function exportPreviews(libPath, prefix, px, outDir, measure) {
    var tmp = app.documents.add(DocumentColorSpace.RGB, 1000, 1000), lib = null, out = { files: 0, metrics: {}, bounds: {} };
    function one(src, keep, path) {
      var TL = tmp.layers[0];
      while (TL.pageItems.length) TL.pageItems[0].remove();
      var d = src.duplicate(TL, ElementPlacement.PLACEATEND);
      for (var i = d.pageItems.length - 1; i >= 0; i--) {
        var it = d.pageItems[i];
        if (it.typename === "GroupItem" && it.name.indexOf("SIDE ") === 0 && keep.indexOf(it.name.charAt(5)) < 0) it.remove();
      }
      app.activeDocument = tmp;     // exportFile 은 활성 문서를 내보낸다 — 반드시 먼저 바꾼다
      var b = d.geometricBounds;
      tmp.artboards[0].artboardRect = [b[0], b[1], b[2], b[3]];
      var o = new ExportOptionsPNG24();
      o.artBoardClipping = true;
      o.transparency = true;
      o.antiAliasing = true;
      o.horizontalScale = px / (b[1] - b[3]) * 100;
      o.verticalScale = o.horizontalScale;
      tmp.exportFile(new File(path), ExportType.PNG24, o);
      out.files++;
      return b;
    }
    try {
      var dir = new Folder(outDir);
      if (!dir.exists) dir.create();
      lib = app.open(new File(libPath));
      var LL = lib.layers[0];
      for (var gi = 0; gi < LL.groupItems.length; gi++) {
        var g = LL.groupItems[gi];
        if (g.name.indexOf(prefix) !== 0) continue;
        var key = g.name.substring(prefix.length), fname = (prefix + key).replace(/ /g, "_"), sides = [], s, variants = {};
        for (s = 0; s < g.groupItems.length; s++) if (g.groupItems[s].name.indexOf("SIDE ") === 0) sides.push(g.groupItems[s].name.charAt(5));
        variants.core = one(g, "", dir.fsName + "/" + fname + ".png");
        out.bounds[key] = variants.core;
        for (s = 0; s < sides.length; s++) variants[sides[s]] = one(g, sides[s], dir.fsName + "/" + fname + "_" + sides[s] + ".png");
        if (measure && key.indexOf(" ") < 0) {
          var body = null;
          for (var q = 0; q < g.pageItems.length; q++) if (g.pageItems[q].name === "BODY") body = g.pageItems[q];
          if (!body) throw new Error(g.name + " 에 BODY 가 없습니다");
          out.metrics[key] = { body: body.geometricBounds, variants: variants };
        }
      }
    } finally {
      if (lib) { try { lib.close(SaveOptions.DONOTSAVECHANGES); } catch (e1) {} }
      try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {}
    }
    return out;
  }

  function fix4(v) {
    var s = String(Math.round(v * 10000) / 10000);
    if (s.indexOf(".") < 0) s += ".";
    while (s.length - s.indexOf(".") < 5) s += "0";
    return s;
  }

  // 치수표 줄 (range.jsx LETTER_ART_METRICS_V2 와 같은 모양). 기준 높이 = 몸통 높이 중앙값.
  function metricsLines(measured) {
    var hs = [], ch, i, lines = [];
    for (ch in measured) if (measured.hasOwnProperty(ch)) hs.push(measured[ch].body[1] - measured[ch].body[3]);
    hs.sort(function (a, b) { return a - b; });
    var mid = Math.floor(hs.length / 2), href = hs.length % 2 ? hs[mid] : (hs[mid - 1] + hs[mid]) / 2;
    href = Math.round(href * 10) / 10;
    for (i = 0; i < LETTERS.length; i++) {
      ch = LETTERS.charAt(i);
      var m = measured[ch];
      if (!m) throw new Error("글자 " + ch + " 치수가 없습니다");
      var parts = [], keys = ["core", "L", "R"];
      for (var k = 0; k < keys.length; k++) {
        var b = m.variants[keys[k]];
        if (!b) continue;
        var w = b[2] - b[0], h = b[1] - b[3];
        parts.push(keys[k] + ": { aw: " + fix4(w / h) + ", bl: " + fix4((b[1] - m.body[3]) / h) + ", fh: " + fix4(h / href) + " }");
      }
      lines.push("    " + ch + ": { " + parts.join(", ") + " }" + (i < LETTERS.length - 1 ? "," : ""));
    }
    return { lines: lines, href: href };
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

  // 색 표 줄 (range.jsx LETTER_ART_PAINTS_V2 와 같은 모양) — 글자마다 칠할 수 있는 색, 첫 색 = 원래 색.
  function paintLines(letters) {
    var lines = [], i, k, q;
    for (i = 0; i < letters.length; i++) {
      q = [];
      for (k = 0; k < letters[i].paints.length; k++) q.push('"' + letters[i].paints[k] + '"');
      lines.push("    " + letters[i].ch + ": [" + q.join(", ") + "]" + (i < letters.length - 1 ? "," : ""));
    }
    return lines;
  }

  // 색 표는 글자 그대로 비교한다 — 다른 줄 목록.
  function paintDiff(curLines, newLines) {
    var out = [], i;
    if (!curLines) return ["range.jsx 에서 LETTER_ART_PAINTS_V2 를 못 찾음"];
    if (curLines.length !== newLines.length) return ["줄 수 " + curLines.length + " → " + newLines.length];
    for (i = 0; i < newLines.length; i++) if (curLines[i] !== newLines[i]) out.push(newLines[i]);
    return out;
  }

  // 말풍선 비율표 줄 (range.jsx DECO_BUBBLE_ASPECT_V2 와 같은 모양) — 흰 테두리(SIL)까지 넣은 그룹 경계의 폭 ÷ 높이.
  function bubbleAspectLines(bounds) {
    var lines = [], i, b;
    for (i = 0; i < BUBBLES.length; i++) {
      b = bounds[BUBBLES[i]];
      if (!b) throw new Error("말풍선 두들 " + BUBBLES[i] + " 가 라이브러리에 없습니다");
      lines.push("    " + BUBBLES[i] + ": " + fix4((b[2] - b[0]) / (b[1] - b[3])) + (i < BUBBLES.length - 1 ? "," : ""));
    }
    return lines;
  }

  // 두 표가 같은가 — 글자·틀 이름은 그대로, 숫자는 반올림 경계 차이(0.0001)까지 같은 것으로 본다. 다른 줄 목록을 돌려준다.
  function metricsDiff(curLines, newLines, name) {
    var out = [], i, j, a, b, na, nb;
    if (!curLines) return ["range.jsx 에서 " + (name || "LETTER_ART_METRICS_V2") + " 를 못 찾음"];
    if (curLines.length !== newLines.length) return ["줄 수 " + curLines.length + " → " + newLines.length];
    for (i = 0; i < newLines.length; i++) {
      a = curLines[i];
      b = newLines[i];
      if (a.replace(/[\d.]+/g, "#") !== b.replace(/[\d.]+/g, "#")) { out.push(b); continue; }
      na = a.match(/\d+\.\d+/g) || [];
      nb = b.match(/\d+\.\d+/g) || [];
      for (j = 0; j < nb.length; j++) {
        if (Math.abs(Number(na[j]) - Number(nb[j])) > 0.00015) { out.push(b); break; }
      }
    }
    return out;
  }

  function copyTree(srcDir, dstDir) {
    var src = new Folder(srcDir), dst = new Folder(dstDir), n = 0;
    if (!dst.exists) dst.create();
    var files = src.getFiles();
    for (var i = 0; i < files.length; i++) {
      if (files[i] instanceof Folder) n += copyTree(files[i].fsName, dst.fsName + "/" + files[i].name);
      else if (files[i].copy(dst.fsName + "/" + decodeURI(files[i].name))) n++;
      else throw new Error("복사 실패: " + files[i].fsName);
    }
    return n;
  }

  function pickSource(path, label) {
    var f = new File(path);
    if (f.exists) return f;
    if (CFG) throw new Error(label + " 원본이 없습니다: " + path);
    f = File.openDialog(label + " 원본(.ai)을 고르세요", "*.ai");
    if (!f) throw new Error(label + " 원본을 고르지 않았습니다");
    return f;
  }

  // ── 실행 ─────────────────────────────────────────────────────
  var prevUI = app.userInteractionLevel, report = [], errorText = "";
  var stamp = new Date().getTime();
  var work = new Folder((CFG && CFG.work) ? CFG.work : Folder.temp.fsName + "/everstory_bubble_build_" + stamp);
  try {
    if (!work.exists) work.create();
    logFile = new File(work.fsName + "/build.log");
    logFile.encoding = "UTF-8";
    logFile.lineFeed = "Unix";
    logFile.open("w"); logFile.close();
    var alphaSrc = pickSource((CFG && CFG.alpha) ? CFG.alpha : ASSETS + "/알파벳 샘플_6.ai", "알파벳 샘플_6");
    var doodleSrc = pickSource((CFG && CFG.doodle) ? CFG.doodle : ASSETS + "/sticker sample 4.ai", "sticker sample 4");
    // 원본은 사본으로만 연다 (이름이 같은 문서가 열려 있어도 헷갈리지 않게 영문 이름으로).
    var alphaCopy = work.fsName + "/src_alphabet.ai", doodleCopy = work.fsName + "/src_doodle.ai";
    if (!alphaSrc.copy(alphaCopy) || !doodleSrc.copy(doodleCopy)) throw new Error("원본을 작업 폴더로 복사하지 못했습니다");
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
    var prevDoc = null;
    try { prevDoc = app.activeDocument; } catch (eNo) {}

    var ra = buildAlphabet(alphaCopy, work.fsName + "/alphabet_art_v2.ai");
    var sided = [];
    for (var i = 0; i < ra.letters.length; i++) {
      var r = ra.letters[i];
      if (r.sideL || r.sideR) sided.push(r.ch + (r.sideL ? " 왼쪽" : "") + (r.sideR ? " 오른쪽" : ""));
    }
    report.push("알파벳 26자 · 색 그룹 " + ra.paintGroups + "개 · 옆 장식: " + (sided.join(", ") || "없음"));
    var rd = buildDoodles(doodleCopy, work.fsName + "/deco_art_v2.ai");
    var thick = [];
    for (i = 0; i < rd.items.length; i++) if (rd.items[i].halo > HALO_STEPS[0]) thick.push(rd.items[i].name + " " + rd.items[i].halo);
    report.push("두들 " + rd.items.length + "종 · 흰 테두리 " + HALO_STEPS[0] + " 보다 두꺼운 것: " + (thick.join(", ") || "없음") +
      (rd.outside ? " · ⚠ 상자 밖 조각 " + rd.outside + "개 (build.log)" : ""));

    var pa = exportPreviews(work.fsName + "/alphabet_art_v2.ai", "LTR ", LETTER_PX, work.fsName + "/art_preview/alphabet_art_v2", true);
    var pd = exportPreviews(work.fsName + "/deco_art_v2.ai", "DECO ", DECO_PX, work.fsName + "/art_preview/deco_art_v2", false);
    report.push("미리보기 그림 " + (pa.files + pd.files) + "장");
    var mt = metricsLines(pa.metrics), mf = new File(work.fsName + "/LETTER_ART_METRICS_V2.txt");
    mf.encoding = "UTF-8";
    mf.lineFeed = "Unix";
    mf.open("w");
    mf.write("  // 기준 높이 " + mt.href + "pt\n  var LETTER_ART_METRICS_V2 = {\n" + mt.lines.join("\n") + "\n  };\n");
    mf.close();
    var diff = metricsDiff(currentTableLines("LETTER_ART_METRICS_V2"), mt.lines);
    report.push(diff.length === 0 ? "치수표: range.jsx 와 같음 (반올림 0.0001 차이까지)"
      : "⚠ 치수표가 range.jsx 와 다름 (" + diff.length + "줄) — " + mf.fsName + " 로 LETTER_ART_METRICS_V2 를 바꾸고 테스트를 돌리세요");
    for (i = 0; i < diff.length && i < 5; i++) LOG("치수표 다름: " + diff[i]);
    var pl = paintLines(ra.letters), pf = new File(work.fsName + "/LETTER_ART_PAINTS_V2.txt");
    pf.encoding = "UTF-8";
    pf.lineFeed = "Unix";
    pf.open("w");
    pf.write("  var LETTER_ART_PAINTS_V2 = {\n" + pl.join("\n") + "\n  };\n");
    pf.close();
    var pdiff = paintDiff(currentTableLines("LETTER_ART_PAINTS_V2"), pl);
    report.push(pdiff.length === 0 ? "색 표: range.jsx 와 같음"
      : "⚠ 색 표가 range.jsx 와 다름 (" + pdiff.length + "줄) — " + pf.fsName + " 로 LETTER_ART_PAINTS_V2 를 바꾸고 테스트를 돌리세요");
    for (i = 0; i < pdiff.length && i < 5; i++) LOG("색 표 다름: " + pdiff[i]);
    var bl = bubbleAspectLines(pd.bounds), bf = new File(work.fsName + "/DECO_BUBBLE_ASPECT_V2.txt");
    bf.encoding = "UTF-8";
    bf.lineFeed = "Unix";
    bf.open("w");
    bf.write("  var DECO_BUBBLE_ASPECT_V2 = {\n" + bl.join("\n") + "\n  };\n");
    bf.close();
    var bdiff = metricsDiff(currentTableLines("DECO_BUBBLE_ASPECT_V2"), bl, "DECO_BUBBLE_ASPECT_V2");
    report.push(bdiff.length === 0 ? "말풍선 비율표: range.jsx 와 같음"
      : "⚠ 말풍선 비율표가 range.jsx 와 다름 (" + bdiff.length + "줄) — " + bf.fsName + " 로 DECO_BUBBLE_ASPECT_V2 를 바꾸고 테스트를 돌리세요");
    for (i = 0; i < bdiff.length; i++) LOG("말풍선 비율표 다름: " + bdiff[i]);
    if (prevDoc) { try { app.activeDocument = prevDoc; } catch (eAct) {} }
    app.userInteractionLevel = prevUI;

    var install = !(CFG && CFG.workOnly);
    if (install && !CFG) install = confirm("templates 의 alphabet_art_v2.ai · deco_art_v2.ai · art_preview 를 새로 만든 것으로 바꿀까요?\n\n" + report.join("\n"));
    if (install) {
      var fa = new File(work.fsName + "/alphabet_art_v2.ai"), fd = new File(work.fsName + "/deco_art_v2.ai");
      if (!fa.copy(TEMPLATES + "/alphabet_art_v2.ai") || !fd.copy(TEMPLATES + "/deco_art_v2.ai")) throw new Error("templates 에 라이브러리를 복사하지 못했습니다");
      var n = copyTree(work.fsName + "/art_preview", TEMPLATES + "/art_preview");
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
