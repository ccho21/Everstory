// Everstory — Shape Sticker Sheet PoC (Style A: 누끼 피사체 + 단색 배경 + 도형 칼선)
//
// 목적 (v0 PoC):
//   02_cutout 폴더의 _clean.psd + _sil.png 페어들을 골라, "얼굴 기준 fill" 로 도형
//   (원/네모/오발/하트) 안에 앉히고 A5 한 시트에 격자로 배치한다. 셀마다:
//     ① 도형으로 사진 클립  ② 같은 도형을 CutContour 칼선  ③ 뒤를 브랜드 배경색으로 채움.
//   운영 메인 Everstory_mixed.jsx 는 건드리지 않는다 (별도 엔트리).
//
// 셀 합성 알고리즘:
//   win    = (cropPct/100) * imgW            // 얼굴 기준 크롭 창(소스 공간)
//   win    = min(win, max(imgW, imgH))       // 더 자를 게 없으면 contain 쪽 클램프
//   s      = D / win                          // 크롭 창을 도형 긴 변 D 에 맞춤
//   가로   : 얼굴(faceX, =_sil 피사체 가로중심)을 셀 중앙(+옆면 HBIAS)에 정렬
//   세로   : 하단 블리드 — 피사체 '실제' 바닥(_sil 트레이스 bbox)을 도형 바닥에 → 하단 여백 0
//   → 도형으로 클립 → 뒤 배경색 채움
//   (_clean.psd 는 Phase A 에서 trim 안 됨 → 캔버스 바닥 ≠ 피사체 바닥. 그래서 _sil 기준.)
//
// 미구현(다음 증분): unique 페어 embed 캐시(현재 셀마다 embed),
//   디자인별 반복 cap / aspect 별 도형 자동선택, 옆면 hBias 자동, 얼굴 1클릭 UI.
//
// 사용: File → Scripts → Other Script → Everstory_shapes.jsx

// #target illustrator

(function () {
  "use strict";

  var MM_TO_PT = 2.834645;

  // 사진 스티커 긴 변 (인치 → mm). 기본 1.5".
  var SIZE_OPTIONS = ["1\" / 25mm", "1.5\" / 38mm", "2\" / 51mm", "2.5\" / 64mm"];
  var SIZE_MM      = [25.4, 38.1, 50.8, 63.5];
  var SIZE_DEFAULT = 1;

  var SHAPE_OPTIONS = ["Circle", "Rounded square", "Oval", "Heart"];
  var OVAL_W_RATIO = 0.78;   // Oval 가로(짧은 변) / 세로(긴 변=D). 세로 카메오 비율.

  // 브랜드 배경 팔레트 (RGB, 스토어 시안에서 추출). 도형 뒤 단색.
  var BG_NAMES = ["cream", "ivory", "sand", "taupe", "gold", "ink"];
  var BG_RGB = [
    [248, 245, 242], [255, 248, 230], [240, 237, 232],
    [216, 207, 198], [216, 184, 96],  [42, 42, 42]
  ];

  var DEF_FACE_X = 50;   // _sil 없는 페어의 가로 폴백 (50 = 중앙)
  var DEF_CROP   = 72;   // 크롭 지름 = 이미지 너비의 %. 작을수록 타이트(얼굴 큼).
  var HBIAS = 0.0;       // 옆면 looking room (v0 수동, 기본 0)
  var BLEED = 0.02;      // 하단 블리드 — 피사체 바닥을 도형 바닥 살짝 아래로 → 하단 여백 0

  // 시트 — 브랜드 템플릿(template_cutout_v2.ait) info>body 를 packing 영역으로 사용.
  //   A5_W/H 는 참고용 (실제 문서 크기는 .ait 가 결정).
  var A5_W_MM = 148, A5_H_MM = 210;
  var BODY_PADDING_MM = 2;     // info>body 내부 여백 (sheet_tokens: body_padding_mm)
  var SHEET_GAP_MM    = 2.5;   // 셀 간 최소 간격   (sheet_tokens: gap_mm)

  // 1) 폴더 선택 + 페어 수집
  var folder = Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!folder) return;

  var pairs = _collectPairs(folder);
  if (pairs.length === 0) {
    alert("선택한 폴더에 _clean.psd 가 없습니다.");
    return;
  }

  // 2) 다이얼로그
  var opt = _showDialog(pairs);
  if (!opt) return;

  // 3) 선택 페어별 _sil 트레이스 (피사체 실제 bbox: 바닥 + 가로중심)
  var sel = opt.selectedPairs;
  var noSil = 0;
  for (var si = 0; si < sel.length; si++) {
    sel[si].silInfo = null;
    if (sel[si].sil) {
      try { sel[si].silInfo = _silSubjectInfo(sel[si].sil); } catch (eSil) {}
    }
    if (!sel[si].silInfo) noSil++;
  }

  // 4) 시트 생성
  try {
    _buildSheet(opt, folder, noSil);
  } catch (e) {
    alert("실패: " + ((e && e.message) ? e.message : String(e)) +
          (e && e.line ? ("  (line " + e.line + ")") : ""));
  }


  // ═══════════════════════════════════════════════════════
  //  SHEET BUILD
  // ═══════════════════════════════════════════════════════
  function _buildSheet(opt, folder, noSil) {
    var D   = opt.sizeMm * MM_TO_PT;
    var pad = BODY_PADDING_MM * MM_TO_PT;
    var gap = SHEET_GAP_MM * MM_TO_PT;

    // 브랜드 템플릿 열기
    var templateFile = _resolveTemplate();
    if (!templateFile || !templateFile.exists) {
      alert("template_cutout_v2.ait 를 찾을 수 없습니다.\n" +
            "스크립트와 같은 위치의 templates/ 폴더를 확인하세요.");
      return;
    }
    var doc = _openTemplateDoc(templateFile);

    // info>body packing 영역, info>header>header_right 헤더 TextFrame
    var bodyPath, headerText;
    try {
      bodyPath   = _findInfoPath(doc, "body");
      headerText = _findInfoPath(doc, "header_right");
      if (headerText.typename !== "TextFrame")
        throw new Error("info > header > header_right 가 TextFrame 이 아닙니다 (현재: " +
          headerText.typename + "). 템플릿에서 같은 이름의 다른 오브젝트를 제거하세요.");
    } catch (eTmpl) {
      alert(eTmpl.message);
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (ec) {}
      return;
    }

    var printLayer = doc.layers.add(); printLayer.name = "PrintData";
    var kissLayer  = doc.layers.add(); kissLayer.name  = "KissCut";
    var cutSpot = _ensureCutContour(doc);

    // body bbox → packing bin (기존 abL/abT 대신 body PathItem 기준)
    var bb = bodyPath.geometricBounds;   // [L, T, R, B]  (T > B, y-up)
    var bL = bb[0], bT = bb[1], bR = bb[2], bB = bb[3];
    var binW = (bR - bL) - 2 * pad;
    var binH = (bT - bB) - 2 * pad;

    if (binW <= 0 || binH <= 0) {
      alert("info > body 영역이 BODY_PADDING_MM 보다 작습니다.");
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (ec2) {}
      return;
    }

    var cells = _gridCells(binW, binH, D, gap);
    if (cells.length === 0) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose) {}
      alert("이 사이즈는 body 영역에 한 셀도 안 들어갑니다. 더 작은 사이즈를 고르세요.");
      return;
    }

    var sel = opt.selectedPairs;
    var placed = 0, failed = 0;
    for (var i = 0; i < cells.length; i++) {
      var pair = sel[i % sel.length];                // 슬롯 round-robin
      var cellLeftX = bL + pad + cells[i].x;         // 셀 좌상단 (x 오른쪽, body 기준)
      var cellTopY  = bT - pad - cells[i].y;         // 셀 좌상단 (y 아래로 감소)
      var ccx = cellLeftX + D / 2;
      var ccy = cellTopY  - D / 2;
      try {
        _composeStickerAt(doc, printLayer, kissLayer, cutSpot, pair, opt, ccx, ccy, D);
        placed++;
      } catch (eC) {
        failed++;
      }
    }

    // z-order 위→아래 = KissCut → info(템플릿) → PrintData (CLAUDE.md 고정 컨벤션).
    // layers.add() 가 맨 위에 쌓이므로 PrintData 를 맨 아래로 내려 info 가 사진 위에 오게 한다.
    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eK) {}
    try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (eP) {}
    doc.selection = null;

    // 헤더 주입 (info > header > header_right)
    _drawHeader(opt, sel.length, headerText);

    // 저장
    var savedPath = "", saveErr = "";
    try {
      var outF = _resolveOutputFolder(folder);
      var fname = _timestamp() + "_SHAPE_" + _shapeTag(opt.shape) + "_" + _sizeTag(opt.sizeMm) + "_sheet01.ai";
      var sf = new File(outF.fsName + "/" + fname);
      _saveAi(doc, sf);
      savedPath = sf.fsName;
    } catch (eS) {
      saveErr = (eS && eS.message) ? eS.message : String(eS);
    }

    var cols = _gridCols(binW, D, gap);
    var rows = (cols > 0) ? Math.round(cells.length / cols) : 0;

    alert(
      "완료: 도형 스티커 시트\n\n" +
      "도형: " + opt.shape + "  /  사이즈: " + opt.sizeMm + "mm  /  배경: " + opt.bgName + "  /  크롭 " + opt.cropPct + "%\n" +
      "격자: " + cols + "×" + rows + " = " + cells.length + " 슬롯  /  선택 디자인 " + sel.length + "개\n" +
      "배치: " + placed + "개" + (failed > 0 ? ("  (실패 " + failed + ")") : "") +
        (sel.length > cells.length ? ("  / 슬롯 초과 미배치 " + (sel.length - cells.length) + "개") : "") + "\n" +
      (noSil > 0 ? ("⚠ _sil 없는 디자인 " + noSil + "개 — 캔버스 바닥 폴백(하단 여백 생길 수 있음)\n") : "") +
      "사진: " + (opt.embed ? "embed" : "linked") + "  /  템플릿: template_cutout_v2.ait\n" +
      "헤더: " + (opt.customerName || "—") + " • " + opt.shape + " • " + opt.sizeMm + "mm 주입 완료\n\n" +
      (savedPath ? ("저장: " + savedPath) :
                   ("저장 실패: " + (saveErr || "unknown") + " — 직접 저장하세요.")) + "\n\n" +
      "확인: 칼선=도형 외곽 정합 / 하단 여백 0 / 얼굴 위쪽 / 배경 채움 / 헤더 텍스트."
    );
  }

  // 셀 좌상단 좌표 목록 (bin 좌상단 기준, x 오른쪽·y 아래). 모든 셀 D×D 균일 격자, 중앙 정렬.
  function _gridCells(binW, binH, cell, gap) {
    var cols = _gridCols(binW, cell, gap);
    var rows = Math.floor((binH + gap) / (cell + gap));
    var out = [];
    if (cols < 1 || rows < 1) return out;
    var usedW = cols * cell + (cols - 1) * gap;
    var usedH = rows * cell + (rows - 1) * gap;
    var x0 = (binW - usedW) / 2;
    var y0 = (binH - usedH) / 2;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        out.push({ x: x0 + c * (cell + gap), y: y0 + r * (cell + gap) });
      }
    }
    return out;
  }

  function _gridCols(binW, cell, gap) {
    return Math.floor((binW + gap) / (cell + gap));
  }


  // ═══════════════════════════════════════════════════════
  //  CELL COMPOSITION (Style A: 배경 + 피사체 + 클립 + 칼선)
  // ═══════════════════════════════════════════════════════
  function _composeStickerAt(doc, printLayer, kissLayer, cutSpot, pair, opt, cx, cy, D) {
    // ① 배경 도형
    var bg = _makeShape(printLayer, opt.shape, D, cx, cy);
    bg.stroked = false;
    bg.filled  = true;
    bg.fillColor = _rgb(opt.bg);

    // ② 사진 place + 얼굴 기준 fill
    doc.activeLayer = printLayer;
    var photo = printLayer.placedItems.add();
    photo.file = pair.clean;
    var iw = photo.width, ih = photo.height;

    var win = (opt.cropPct / 100) * iw;
    win = Math.min(win, Math.max(iw, ih));
    var s = D / win;
    var pw = iw * s, ph = ih * s;
    photo.width = pw;
    photo.height = ph;

    var faceX = (pair.silInfo && pair.silInfo.centerXFrac != null)
      ? pair.silInfo.centerXFrac * 100 : opt.faceX;   // 페어별 가로중심 자동
    var faceTX = cx + HBIAS * D;
    photo.left = faceTX - (faceX / 100) * pw;

    var bottomFrac = (pair.silInfo && pair.silInfo.bottomFrac) ? pair.silInfo.bottomFrac : 1.0;
    var shapeBottom = cy - D / 2;
    photo.top = shapeBottom - BLEED * D + bottomFrac * ph;   // 피사체 바닥 = shapeBottom - BLEED*D

    // embed(기본) — 링크 깨짐 방지. embed 후 bounds 로 재탐색(Everstory_mixed 방식).
    //   v0 는 셀마다 embed. linked 모드(체크 해제)는 합성만 빠르게 검증할 때.
    var art = photo;
    if (opt.embed) {
      var pL = photo.left, pT = photo.top, pW = photo.width, pH = photo.height;
      photo.embed();
      art = _findEmbeddedNear(printLayer, pL, pT, pW, pH);
      if (!art) throw new Error("embed 재탐색 실패 (" + pair.base + ")");
    }

    // ③ 클립 그룹: [clip(앞) · art · 배경(뒤)]
    var grp = printLayer.groupItems.add();
    bg.move(grp, ElementPlacement.PLACEATEND);
    art.move(grp, ElementPlacement.PLACEATBEGINNING);
    var clip = _makeShape(printLayer, opt.shape, D, cx, cy);
    clip.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.clipping = true;
    grp.clipped = true;

    // ④ 칼선 (KissCut, CutContour)
    var cut = _makeShape(kissLayer, opt.shape, D, cx, cy);
    _forceCutContourStroke(cut, cutSpot);
  }


  // ═══════════════════════════════════════════════════════
  //  SHAPE FACTORY
  //  네이티브 벡터 도형 — Make Work Path/SVG import 아님(깨끗한 파라메트릭).
  // ═══════════════════════════════════════════════════════
  function _makeShape(container, kind, D, cx, cy) {
    var top  = cy + D / 2;
    var left = cx - D / 2;
    if (kind === "Rounded square") {
      var r = D * 0.18;
      return container.pathItems.roundedRectangle(top, left, D, D, r, r);
    }
    if (kind === "Oval") {
      var ow = D * OVAL_W_RATIO;             // 세로 = D(긴 변), 가로 = D*ratio
      return container.pathItems.ellipse(top, cx - ow / 2, ow, D);
    }
    if (kind === "Heart") {
      return _makeHeart(container, D, cx, cy);
    }
    return container.pathItems.ellipse(top, left, D, D);   // Circle
  }

  // 하트 — primitive 없음 → bezier path 직접 생성.
  // 디자인 박스(100×100, y-down)의 anchor/handle 을 Illustrator(y-up, cx·cy 중심)로 매핑.
  // 곡률은 아래 점 표의 handle 좌표로만 결정 — 나중에 눈으로 보고 이 표만 조정하면 됨.
  function _makeHeart(container, D, cx, cy) {
    var s = D / 80;   // 하트 bbox(약 76×73)가 D 안에 약간 여백 두고 들어가도록
    // 각 점: [anchor, leftDirection, rightDirection]  (SVG box 좌표, y-down)
    var pts = [
      [[50, 30], [50, 14], [50, 14]],   // 상단 가운데 딤(두 lobe 사이)
      [[80, 26], [72,  9], [88, 42]],   // 오른쪽 lobe
      [[50, 82], [60, 68], [40, 68]],   // 하단 꼭지
      [[20, 26], [12, 42], [28,  9]]    // 왼쪽 lobe
    ];
    var p = container.pathItems.add();
    for (var i = 0; i < pts.length; i++) {
      var pp = p.pathPoints.add();
      pp.anchor         = _heartMap(pts[i][0], s, cx, cy);
      pp.leftDirection  = _heartMap(pts[i][1], s, cx, cy);
      pp.rightDirection = _heartMap(pts[i][2], s, cx, cy);
      pp.pointType = PointType.CORNER;   // handle 그대로 보존(SMOOTH 는 collinear 강제 → 왜곡)
    }
    p.closed = true;
    return p;
  }

  function _heartMap(xy, s, cx, cy) {
    // x중심 50, y중심 45.5, y축 반전(아래로 큰 박스 → 위로 큰 일러스트)
    return [ cx + (xy[0] - 50) * s, cy + (45.5 - xy[1]) * s ];
  }


  // ═══════════════════════════════════════════════════════
  //  SIL 피사체 레퍼런스 (_sil.png 트레이스 → bbox 분율)
  //  _clean.psd 는 trim 안 됨(Phase A) → 피사체 실제 바닥/가로중심은 _sil 에서 얻는다.
  // ═══════════════════════════════════════════════════════
  function _silSubjectInfo(silFile) {
    var tmp = app.documents.add(DocumentColorSpace.RGB, 1000, 1000);
    try {
      var placed = tmp.layers[0].placedItems.add();
      placed.file = silFile;
      placed.left = 0;
      placed.top = placed.height;
      var cw = placed.width, ch = placed.height;
      tmp.artboards[0].artboardRect = [0, placed.height, placed.width, 0];

      var trace = placed.trace();
      var o = trace.tracing.tracingOptions;
      try { o.loadFromPreset("Silhouettes"); } catch (e1) {}
      o.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE;
      o.threshold = 230;
      o.ignoreWhite = true;
      o.fills = true;
      o.strokes = false;
      trace.tracing.expandTracing();

      app.executeMenuCommand("deselectall");
      app.executeMenuCommand("selectall");
      var seln = tmp.selection;
      if (!seln || seln.length === 0) return null;

      var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      for (var i = 0; i < seln.length; i++) {
        var b = seln[i].geometricBounds;   // [L, T, R, B]  (T > B, y-up)
        if (b[0] < minX) minX = b[0];
        if (b[2] > maxX) maxX = b[2];
        if (b[3] < minY) minY = b[3];
        if (b[1] > maxY) maxY = b[1];
      }
      return {
        bottomFrac:  (ch - minY) / ch,           // 캔버스 top 기준 피사체 바닥까지 (1 = 캔버스 바닥)
        centerXFrac: ((minX + maxX) / 2) / cw    // 피사체 가로 중심
      };
    } finally {
      try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {}
    }
  }


  // ═══════════════════════════════════════════════════════
  //  EMBED 재탐색 (Everstory_mixed _stripEmbeddedPSDPathsNear 차용)
  //  embed 후 placedItem 핸들이 무효 → bounds 매칭으로 결과(그룹/raster) 재탐색.
  // ═══════════════════════════════════════════════════════
  function _findEmbeddedNear(layer, L, T, W, H) {
    for (var i = 0; i < layer.groupItems.length; i++) {
      var g = layer.groupItems[i];
      if (g.clipped) continue;                              // 이미 만든 클립 그룹 제외
      if (_boundsMatch(g.geometricBounds, L, T, W, H)) { _stripPSDPaths(g); return g; }
    }
    for (var k = 0; k < layer.rasterItems.length; k++) {    // 단일 raster 로 embed 된 경우
      if (_boundsMatch(layer.rasterItems[k].geometricBounds, L, T, W, H)) return layer.rasterItems[k];
    }
    return null;
  }

  function _boundsMatch(b, L, T, W, H) {
    var w = b[2] - b[0], h = b[1] - b[3];
    return Math.abs(b[0] - L) < 1 && Math.abs(b[1] - T) < 1 &&
           Math.abs(w - W) < 1 && Math.abs(h - H) < 1;
  }

  function _stripPSDPaths(group) {
    if (group.pathItems) {
      for (var i = group.pathItems.length - 1; i >= 0; i--) {
        try { if (!group.pathItems[i].clipping) group.pathItems[i].remove(); } catch (e) {}
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


  // ═══════════════════════════════════════════════════════
  //  CUTCONTOUR  (Everstory_mixed.jsx 규약 동일 — M=100 SPOT, 0.25pt)
  // ═══════════════════════════════════════════════════════
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
    item.filled = false;
    item.stroked = true;
    item.strokeColor = cutSpot;
    item.strokeWidth = 0.25;
  }


  // ═══════════════════════════════════════════════════════
  //  FILE / SAVE HELPERS
  // ═══════════════════════════════════════════════════════
  function _collectPairs(folder) {
    var cleans = folder.getFiles(function (f) {
      return f instanceof File && /_clean\.psd$/i.test(f.name);
    });
    var out = [];
    for (var i = 0; i < cleans.length; i++) {
      var silPath = cleans[i].fsName.replace(/_clean\.psd$/i, "_sil.png");
      var sil = new File(silPath);
      out.push({
        base: cleans[i].name.replace(/_clean\.psd$/i, ""),
        clean: cleans[i],
        sil: (sil.exists ? sil : null)
      });
    }
    return out;
  }

  function _resolveOutputFolder(inputFolder) {
    var out;
    if (inputFolder.name.toLowerCase() === "02_cutout" && inputFolder.parent) {
      out = new Folder(inputFolder.parent.fsName + "/03_output");
    } else {
      out = new Folder(inputFolder.fsName + "/03_output");
    }
    if (!out.exists) out.create();
    return out;
  }

  function _timestamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return "" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
           "_" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function _sizeTag(mm) {
    var inch = mm / 25.4;
    return inch.toFixed(2).replace(/\.?0+$/, "") + "in";
  }

  function _shapeTag(shape) {
    if (shape === "Rounded square") return "SQ";
    if (shape === "Oval") return "OVAL";
    if (shape === "Heart") return "HRT";
    return "CIR";
  }

  function _saveAi(doc, file) {
    var opts = new IllustratorSaveOptions();
    opts.compatibility = Compatibility.ILLUSTRATOR24;
    opts.pdfCompatible = true;
    opts.embedICCProfile = true;
    doc.saveAs(file, opts);
  }

  function _rgb(a) {
    var c = new RGBColor();
    c.red = a[0]; c.green = a[1]; c.blue = a[2];
    return c;
  }

  function _todayStr() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }


  // ═══════════════════════════════════════════════════════
  //  BRAND TEMPLATE (template_cutout_v2.ait)
  //  — Everstory_mixed.jsx 방식 그대로. info>body packing 영역, header_right 헤더 주입.
  // ═══════════════════════════════════════════════════════
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
        infoLayer = doc.layers[i]; break;
      }
    }
    if (!infoLayer) throw new Error("템플릿에 'info' 레이어가 없습니다");
    var item = _deepFindByName(infoLayer, pathName);
    if (!item) throw new Error("info 레이어 안에 '" + pathName + "' 가 없습니다");
    return item;
  }

  function _deepFindByName(container, name) {
    if (container.pathItems) {
      for (var i = 0; i < container.pathItems.length; i++)
        if (container.pathItems[i].name === name) return container.pathItems[i];
    }
    if (container.compoundPathItems) {
      for (var j = 0; j < container.compoundPathItems.length; j++)
        if (container.compoundPathItems[j].name === name) return container.compoundPathItems[j];
    }
    if (container.textFrames) {
      for (var t = 0; t < container.textFrames.length; t++)
        if (container.textFrames[t].name === name) return container.textFrames[t];
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

  function _drawHeader(opt, designCount, headerText) {
    var line1 = _nfcHangul(opt.customerName || "—") + " • " + opt.shape + " • " + opt.sizeMm + "mm";
    var line2 = designCount + " design(s)";
    var line3 = "date: " + (opt.orderDate || _todayStr());
    headerText.contents = line1 + "\r" + line2 + "\r" + line3;
    _applyHangulFontOverride(headerText, _resolveHangulFont());
  }

  function _nfcHangul(s) {
    if (!s) return s;
    var out = "", i = 0;
    while (i < s.length) {
      var L = s.charCodeAt(i);
      if (L >= 0x1100 && L <= 0x1112 && i + 1 < s.length) {
        var V = s.charCodeAt(i + 1);
        if (V >= 0x1161 && V <= 0x1175) {
          var T = 0, step = 2;
          if (i + 2 < s.length) {
            var Tc = s.charCodeAt(i + 2);
            if (Tc >= 0x11A8 && Tc <= 0x11C2) { T = Tc - 0x11A7; step = 3; }
          }
          out += String.fromCharCode(0xAC00 + (L - 0x1100) * 21 * 28 + (V - 0x1161) * 28 + T);
          i += step; continue;
        }
      }
      out += s.charAt(i); i++;
    }
    return out;
  }

  function _resolveHangulFont() {
    var candidates = ["TTOmniGothicL", "AppleSDGothicNeo-Bold", "AppleSDGothicNeo-SemiBold", "AppleGothic"];
    for (var i = 0; i < candidates.length; i++) {
      try { return app.textFonts.getByName(candidates[i]); } catch (e) {}
    }
    return null;
  }

  function _applyHangulFontOverride(textFrame, hangulFont) {
    if (!hangulFont) return;
    var s = textFrame.contents;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if ((c >= 0xAC00 && c <= 0xD7AF) || (c >= 0x1100 && c <= 0x11FF) || (c >= 0x3130 && c <= 0x318F)) {
        try { textFrame.textRange.characters[i].textFont = hangulFont; } catch (e) {}
      }
    }
  }


  // ═══════════════════════════════════════════════════════
  //  DIALOG
  // ═══════════════════════════════════════════════════════
  function _showDialog(pairs) {
    var dlg = new Window("dialog", "Everstory Shape Sticker Sheet (PoC)");
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 16;
    dlg.spacing = 10;

    var g1 = dlg.add("group"); g1.add("statictext", undefined, "도형");
    var shapeDd = g1.add("dropdownlist", undefined, SHAPE_OPTIONS);
    shapeDd.selection = 0; shapeDd.preferredSize = [200, 24];

    var g2 = dlg.add("group"); g2.add("statictext", undefined, "사이즈");
    var sizeDd = g2.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDd.selection = SIZE_DEFAULT; sizeDd.preferredSize = [200, 24];

    var g3 = dlg.add("group"); g3.add("statictext", undefined, "배경색");
    var bgDd = g3.add("dropdownlist", undefined, BG_NAMES);
    bgDd.selection = 0; bgDd.preferredSize = [200, 24];

    var g4 = dlg.add("group"); g4.add("statictext", undefined, "크롭 %");
    var fC = g4.add("edittext", undefined, String(DEF_CROP)); fC.preferredSize = [60, 22];
    g4.add("statictext", undefined, "당김 — 작을수록 얼굴 큼");

    var g5 = dlg.add("group"); g5.add("statictext", undefined, "고객 이름");
    var fName = g5.add("edittext", undefined, ""); fName.preferredSize = [180, 22];

    var g6 = dlg.add("group"); g6.add("statictext", undefined, "날짜");
    var fDate = g6.add("edittext", undefined, _todayStr()); fDate.preferredSize = [120, 22];
    g6.add("statictext", undefined, "헤더 표기용");

    var embedChk = dlg.add("checkbox", undefined, "사진 embed (해제 시 linked — 합성만 빠르게 확인)");
    embedChk.value = true;

    var pp = dlg.add("panel", undefined, "사용할 페어 (multi-select)");
    pp.orientation = "column"; pp.alignChildren = "fill";
    pp.margins = [12, 16, 12, 12]; pp.spacing = 6;
    var items = [];
    for (var i = 0; i < pairs.length; i++) {
      items.push(pairs[i].base + (pairs[i].sil ? "" : "  (sil 없음)"));
    }
    var lb = pp.add("listbox", undefined, items, { multiselect: true });
    lb.preferredSize = [320, 150];
    var initSel = [];
    for (var k = 0; k < lb.items.length; k++) initSel.push(lb.items[k]);
    lb.selection = initSel;   // 기본 전체 선택

    var hint = dlg.add("statictext", undefined,
      "얼굴 가로는 _sil 피사체 중심으로 자동. 세로는 하단 블리드(여백 0). A5 격자에 round-robin 배치.");
    try {
      hint.graphics.foregroundColor =
        hint.graphics.newPen(hint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1);
    } catch (eh) {}

    var btns = dlg.add("group"); btns.alignment = "right"; btns.spacing = 10;
    btns.add("button", undefined, "취소", { name: "cancel" });
    var ok = btns.add("button", undefined, "생성", { name: "ok" });
    ok.active = true;

    ok.onClick = function () {
      if (!lb.selection || (lb.selection.length === 0)) {
        alert("페어를 최소 1개 선택하세요.");
        return;
      }
      dlg.close(1);
    };

    if (dlg.show() !== 1) return null;

    var selectedPairs = [];
    var s = lb.selection;
    if (s) {
      // multiselect 면 배열, 단일이면 객체일 수 있어 정규화
      if (s.length == null) s = [s];
      for (var j = 0; j < s.length; j++) selectedPairs.push(pairs[s[j].index]);
    }
    if (selectedPairs.length === 0) return null;

    var bgIdx = bgDd.selection.index;
    return {
      shape:        SHAPE_OPTIONS[shapeDd.selection.index],
      sizeMm:       SIZE_MM[sizeDd.selection.index],
      bg:           BG_RGB[bgIdx],
      bgName:       BG_NAMES[bgIdx],
      cropPct:      _num(fC.text, DEF_CROP),
      faceX:        DEF_FACE_X,
      embed:        embedChk.value,
      customerName: fName.text.replace(/^\s+|\s+$/g, ""),
      orderDate:    fDate.text.replace(/^\s+|\s+$/g, ""),
      selectedPairs: selectedPairs
    };
  }

  function _num(t, d) {
    var v = parseFloat(t);
    return isNaN(v) ? d : v;
  }

})();
