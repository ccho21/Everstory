// ═══════════════════════════════════════════════════════════════
//  Everstory Keepsake 템플릿 생성기 (1회 실행)
//
//  A5 "Minimal Keepsake" 커스텀 사진 스티커 시트 템플릿을 통째로 그려서
//  templates/template_keepsake_v1.ait 로 저장한다.
//
//  구성 (레퍼런스 시안 기준):
//    · 좌측: 사진 스티커 슬롯 (photo_slot) + 명패 (name_main, plaque_cut)
//    · 우측: 이름 라벨 스티커 12종 (name_01 ~ name_12) — 정적 칼선 포함
//    · 데코 스티커 16종 (리본/하트/별/스파클/가지) — 정적 칼선 포함
//    · 하단: 뱃지/타원/태그/아치/티켓 라벨 5종 (name_13 ~ name_16)
//    · 헤더/푸터 — 시트 인쇄용 (칼선 없음)
//
//  레이어 컨벤션 (위→아래): KissCut → TemplateGuide → info → PrintData
//    · KissCut: 정적 스티커 칼선 (CutContour 스폿, M=100). 사진 칼선은
//      Everstory_keepsake.jsx 가 주문 시 trace 로 추가.
//    · TemplateGuide: 사진 슬롯 안내 표시 — 주문 스크립트가 삭제함.
//    · info: 인쇄되는 템플릿 디자인 전체. name_* TextFrame 은 주문 스크립트가
//      .contents 만 교체 (폰트/사이즈/정렬은 이 템플릿이 보유).
//    · photo_slot: 사진 배치 영역 (paint 없는 PathItem, bounds 만 사용).
//    · plaque_cut: 명패 칼선용 paint 없는 path — 주문 스크립트가 사진 trace
//      칼선과 Unite 해서 최종 사진 칼선을 만든다.
//
//  폰트: 세리프는 Playfair Display → Didot → Baskerville → Georgia 순 폴백,
//        마이크로 텍스트는 Jost. 미설치 시 기본 폰트로 남고 완료 알림에 표기.
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var SCRIPT_VARIANT = "keepsake template v1";
  var MM = 2.834645;
  var SHEET_W = 148;   // A5 mm
  var SHEET_H = 210;
  var NAME_PLACEHOLDER = "Harin";
  var CUT_M = 1.15;    // 정적 스티커 칼선 여백 mm

  // 푸터 브랜드 문구 — 확정 핸들/도메인으로 교체 가능
  var TITLE_TEXT = "Minimal Keepsake";
  var SUBTITLE_TEXT = "COLLECTION";
  var CORNER_L1 = "CUSTOM PHOTO STICKER";
  var CORNER_L2 = "ADD-ON SHEET";
  var CORNER_R1 = "PREMIUM MATTE";
  var CORNER_R2 = "KISS-CUT STICKERS";
  var FOOTER_L1 = "THANK YOU";
  var FOOTER_L2 = "FOR BEING YOU";
  var FOOTER_HANDLE = "@EVERSTORY.STUDIO";
  var FOOTER_URL = "WWW.EVERSTORY.STUDIO";

  var testConfig = $.global.__EVERSTORY_KEEPSAKE_TEMPLATE_TEST__;

  // ── 팔레트 (레퍼런스 실측) ────────────────────────────────────
  function C(r, g, b) { var c = new RGBColor(); c.red = r; c.green = g; c.blue = b; return c; }
  var INK        = C(74, 59, 47);
  var INK_SOFT   = C(138, 120, 106);
  var BLUSH      = C(242, 199, 190);
  var BLUSH_DEEP = C(233, 172, 159);
  var PINK_PALE  = C(248, 223, 216);
  var CREAM      = C(245, 239, 228);
  var IVORY      = C(250, 246, 238);
  var GREIGE     = C(220, 210, 197);
  var BEIGE      = C(205, 191, 172);
  var CLAY       = C(201, 111, 91);
  var CLAY_DEEP  = C(184, 92, 72);
  var BROWN      = C(67, 48, 31);
  var LINE_SOFT  = C(229, 213, 201);
  var STITCH     = C(222, 155, 141);
  var LEAF       = C(156, 158, 122);
  var TULIP_PINK = C(217, 137, 115);

  // ── 좌표/그리기 헬퍼 (mm, y 는 위에서 아래) ───────────────────
  function _px(x) { return x * MM; }
  function _py(y) { return (SHEET_H - y) * MM; }

  function _drawSpec(container, spec, closed) {
    var p = container.pathItems.add();
    var anchors = [];
    var i;
    for (i = 0; i < spec.length; i++) anchors.push([_px(spec[i].a[0]), _py(spec[i].a[1])]);
    p.setEntirePath(anchors);
    for (i = 0; i < spec.length; i++) {
      var pp = p.pathPoints[i];
      var s = spec[i];
      pp.leftDirection = s.l ? [_px(s.l[0]), _py(s.l[1])] : [_px(s.a[0]), _py(s.a[1])];
      pp.rightDirection = s.r ? [_px(s.r[0]), _py(s.r[1])] : [_px(s.a[0]), _py(s.a[1])];
      pp.pointType = PointType.CORNER;
    }
    p.closed = (closed !== false);
    return p;
  }

  function _paint(p, fill, stroke, sw, dashes) {
    if (fill) { p.filled = true; p.fillColor = fill; } else { p.filled = false; }
    if (stroke) {
      p.stroked = true;
      p.strokeColor = stroke;
      p.strokeWidth = sw || 0.5;
      if (dashes) p.strokeDashes = dashes;
      p.strokeCap = StrokeCap.ROUNDENDCAP;
    } else {
      p.stroked = false;
    }
    return p;
  }

  function _roundRect(container, cx, cy, w, h, r) {
    return container.pathItems.roundedRectangle(_py(cy - h / 2), _px(cx - w / 2), w * MM, h * MM, r * MM, r * MM);
  }
  function _stadium(container, cx, cy, w, h) { return _roundRect(container, cx, cy, w, h, h / 2); }
  function _ellipse(container, cx, cy, w, h) {
    return container.pathItems.ellipse(_py(cy - h / 2), _px(cx - w / 2), w * MM, h * MM);
  }
  function _line(container, x1, y1, x2, y2) {
    var p = container.pathItems.add();
    p.setEntirePath([[_px(x1), _py(y1)], [_px(x2), _py(y2)]]);
    p.closed = false;
    p.filled = false;
    return p;
  }

  // 테이블 스케일/이동 (sx 음수 = 좌우 미러)
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

  // ── 파라메트릭 셰이프 ─────────────────────────────────────────

  var HEART_T = [
    { a: [0, -0.28], l: [-0.10, -0.46], r: [0.10, -0.46] },
    { a: [0.50, -0.22], l: [0.30, -0.52], r: [0.66, 0.03] },
    { a: [0, 0.50], l: [0.36, 0.24], r: [-0.36, 0.24] },
    { a: [-0.50, -0.22], l: [-0.66, 0.03], r: [-0.30, -0.52] }
  ];
  function _heartSpec(cx, cy, w, h) { return _xfSpec(HEART_T, cx, cy, w, h); }

  // 4-point 트윙클. waist 비율이 클수록 통통한 마진 느낌 (컷용)
  function _sparkleSpec(cx, cy, r, waist) {
    var w = waist || 0.24;
    var c = 0.71 * w, d = 0.42 * w, e = 1.58 * w;
    var t = [
      { a: [0, -1] },
      { a: [c, -c], l: [d, -e], r: [e, -d] },
      { a: [1, 0] },
      { a: [c, c], l: [e, d], r: [d, e] },
      { a: [0, 1] },
      { a: [-c, c], l: [-d, e], r: [-e, d] },
      { a: [-1, 0] },
      { a: [-c, -c], l: [-e, -d], r: [-d, -e] }
    ];
    return _xfSpec(t, cx, cy, r, r);
  }

  function _starSpec(cx, cy, rOut, rIn) {
    var spec = [];
    for (var i = 0; i < 10; i++) {
      var ang = (-90 + i * 36) * Math.PI / 180;
      var rr = (i % 2 === 0) ? rOut : rIn;
      spec.push({ a: [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)] });
    }
    return spec;
  }

  // 폴리곤 각 변을 바깥 반원 bump 로 (depth 1 = 반원)
  function _bumpPolySpec(poly, depth) {
    var n = poly.length, nx = [], ny = [], kk = [], i;
    for (i = 0; i < n; i++) {
      var p = poly[i], q = poly[(i + 1) % n];
      var dx = q[0] - p[0], dy = q[1] - p[1];
      var len = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      nx.push(dy / len); ny.push(-dx / len);   // 시계방향(y-down) 바깥 노멀
      kk.push((4 / 3) * (len / 2) * depth);
    }
    var spec = [];
    for (i = 0; i < n; i++) {
      var prev = (i - 1 + n) % n;
      var a = poly[i];
      spec.push({
        a: a,
        l: [a[0] + nx[prev] * kk[prev], a[1] + ny[prev] * kk[prev]],
        r: [a[0] + nx[i] * kk[i], a[1] + ny[i] * kk[i]]
      });
    }
    return spec;
  }

  function _scallopRectSpec(cx, cy, w, h, step, depth) {
    var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
    var poly = [];
    function edge(ax, ay, bx, by) {
      var dx = bx - ax, dy = by - ay;
      var len = Math.sqrt(dx * dx + dy * dy);
      var n = Math.max(1, Math.round(len / step));
      for (var i = 0; i < n; i++) poly.push([ax + dx * i / n, ay + dy * i / n]);
    }
    edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0);
    return _bumpPolySpec(poly, depth);
  }

  function _scallopCircleSpec(cx, cy, r, nBumps, depth) {
    var poly = [];
    for (var i = 0; i < nBumps; i++) {
      var ang = (-90 + i * 360 / nBumps) * Math.PI / 180;
      poly.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
    }
    return _bumpPolySpec(poly, depth);
  }

  // 모서리 오목 노치 티켓
  function _ticketSpec(cx, cy, w, h, nr) {
    var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
    var k = 0.552 * nr;
    return [
      { a: [x0 + nr, y0], l: [x0 + nr - k, y0 - 0] },
      { a: [x1 - nr, y0], r: [x1 - nr + k, y0] },
      { a: [x1, y0 + nr], l: [x1 - k, y0 + nr] },
      { a: [x1, y1 - nr], r: [x1 - k, y1 - nr] },
      { a: [x1 - nr, y1], l: [x1 - nr + k, y1] },
      { a: [x0 + nr, y1], r: [x0 + nr - k, y1] },
      { a: [x0, y1 - nr], l: [x0 + k, y1 - nr] },
      { a: [x0, y0 + nr], r: [x0 + k, y0 + nr] }
    ];
  }

  // 위 반원 + 아래 살짝 둥근 모서리 아치
  function _archSpec(cx, cy, w, h, br) {
    var x0 = cx - w / 2, x1 = cx + w / 2, y1 = cy + h / 2;
    var y0 = cy - h / 2;
    var R = w / 2;
    var k = 0.552 * R, kb = 0.552 * br;
    return [
      { a: [x0, y0 + R], r: [x0, y0 + R - k] },
      { a: [cx, y0], l: [cx - k, y0], r: [cx + k, y0] },
      { a: [x1, y0 + R], l: [x1, y0 + R - k] },
      { a: [x1, y1 - br], r: [x1, y1 - br + kb] },
      { a: [x1 - br, y1], l: [x1 - br + kb, y1] },
      { a: [x0 + br, y1], r: [x0 + br - kb, y1] },
      { a: [x0, y1 - br], l: [x0, y1 - br + kb] }
    ];
  }

  // 명패 — 위 모서리 오목 스쿱 + 아래 둥근 모서리
  function _plaqueSpec(cx, cy, w, h, sr, br) {
    var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
    var k = 0.552 * sr, kb = 0.552 * br;
    return [
      { a: [x0 + sr, y0], l: [x0 + sr - k, y0] },
      { a: [x1 - sr, y0], r: [x1 - sr + k, y0] },
      { a: [x1, y0 + sr], l: [x1, y0 + sr - k] },
      { a: [x1, y1 - br], r: [x1, y1 - br + kb] },
      { a: [x1 - br, y1], l: [x1 - br + kb, y1] },
      { a: [x0 + br, y1], r: [x0 + br - kb, y1] },
      { a: [x0, y1 - br], l: [x0, y1 - br + kb] },
      { a: [x0, y0 + sr], r: [x0, y0 + sr - k] }
    ];
  }

  // 유기적 컷 마진 blob (8앵커 웨이비 타원)
  function _blobSpec(cx, cy, rx, ry, seed) {
    var f = [1.05, 0.96, 1.04, 0.97, 1.06, 0.95, 1.03, 0.98];
    var spec = [];
    for (var i = 0; i < 8; i++) {
      var fac = f[(i + (seed || 0)) % 8];
      var ang = (-90 + i * 45) * Math.PI / 180;
      var rxx = rx * fac, ryy = ry * fac;
      var ax = cx + Math.cos(ang) * rxx, ay = cy + Math.sin(ang) * ryy;
      var tx = -Math.sin(ang) * rxx, ty = Math.cos(ang) * ryy;
      var tl = Math.sqrt(tx * tx + ty * ty) || 0.001;
      var hl = 0.27 * ((rxx + ryy) / 2);
      tx = tx / tl * hl; ty = ty / tl * hl;
      spec.push({ a: [ax, ay], l: [ax - tx, ay - ty], r: [ax + tx, ay + ty] });
    }
    return spec;
  }

  // ── 리본 (bow) ────────────────────────────────────────────────
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
  function _drawBow(parent, cx, cy, w, h, colMain, colDark) {
    var g = parent.groupItems.add();
    g.name = "bow";
    _paint(_drawSpec(g, _xfSpec(BOW_TAIL_L, cx, cy, w, h)), colMain, null);
    _paint(_drawSpec(g, _xfSpec(BOW_TAIL_L, cx, cy, -w, h)), colMain, null);
    _paint(_drawSpec(g, _xfSpec(BOW_LOOP_L, cx, cy, w, h)), colMain, null);
    _paint(_drawSpec(g, _xfSpec(BOW_LOOP_L, cx, cy, -w, h)), colMain, null);
    // 루프 하단 음영
    var shL = _ellipse(g, cx - 0.26 * w, cy + 0.09 * h, 0.26 * w, 0.11 * h);
    _paint(shL, colDark, null); shL.rotate(18);
    var shR = _ellipse(g, cx + 0.26 * w, cy + 0.09 * h, 0.26 * w, 0.11 * h);
    _paint(shR, colDark, null); shR.rotate(-18);
    var kn = _roundRect(g, cx, cy, 0.14 * w, 0.20 * h, 0.04 * w);
    _paint(kn, colDark, null);
    return g;
  }

  // ── 튤립 ──────────────────────────────────────────────────────
  function _drawTulip(parent, cx, cy, h) {
    var g = parent.groupItems.add();
    g.name = "tulip";
    var stem = _line(g, cx, cy - 0.02 * h, cx, cy + 0.46 * h);
    _paint(stem, null, LEAF, 0.5);
    var lfL = _ellipse(g, cx - 0.10 * h, cy + 0.30 * h, 0.13 * h, 0.30 * h);
    _paint(lfL, LEAF, null); lfL.rotate(38);
    var lfR = _ellipse(g, cx + 0.10 * h, cy + 0.30 * h, 0.13 * h, 0.30 * h);
    _paint(lfR, LEAF, null); lfR.rotate(-38);
    var peL = _ellipse(g, cx - 0.10 * h, cy - 0.20 * h, 0.22 * h, 0.36 * h);
    _paint(peL, TULIP_PINK, null); peL.rotate(20);
    var peR = _ellipse(g, cx + 0.10 * h, cy - 0.20 * h, 0.22 * h, 0.36 * h);
    _paint(peR, TULIP_PINK, null); peR.rotate(-20);
    var peC = _ellipse(g, cx, cy - 0.24 * h, 0.26 * h, 0.40 * h);
    _paint(peC, BLUSH, null);
    return g;
  }

  // ── 텍스트 ────────────────────────────────────────────────────
  function _resolveFont(cands) {
    var i, f, k, w;
    for (i = 0; i < cands.length; i++) {
      try { return app.textFonts.getByName(cands[i]); } catch (e) {}
    }
    var wanted = [];
    for (i = 0; i < cands.length; i++) wanted.push(cands[i].toLowerCase().replace(/[^a-z0-9]/g, ""));
    for (f = 0; f < app.textFonts.length; f++) {
      var tf = app.textFonts[f];
      var keys = [String(tf.name), String(tf.family) + String(tf.style)];
      for (k = 0; k < keys.length; k++) {
        var norm = keys[k].toLowerCase().replace(/[^a-z0-9]/g, "");
        for (w = 0; w < wanted.length; w++) if (norm === wanted[w]) return tf;
      }
    }
    return null;
  }

  var FONT_SERIF = _resolveFont(["Playfair Display", "PlayfairDisplay-Regular", "Didot", "Baskerville", "Georgia"]);
  var FONT_SERIF_IT = _resolveFont(["Playfair Display Italic", "PlayfairDisplay-Italic", "Didot-Italic", "Baskerville-Italic", "Georgia-Italic"]);
  var FONT_SANS = _resolveFont(["Jost-Regular", "Jost", "Verdana"]);
  var FONT_SANS_LIGHT = _resolveFont(["Jost-Light", "Jost-Regular", "Jost"]);

  function _text(container, str, x, y, font, sizePt, color, just, tracking) {
    var tf = container.textFrames.pointText([_px(x), _py(y)]);
    tf.contents = str;
    var tr = tf.textRange;
    tr.characterAttributes.size = sizePt;
    if (font) tr.characterAttributes.textFont = font;
    tr.characterAttributes.fillColor = color;
    if (tracking) tr.characterAttributes.tracking = tracking;
    tr.paragraphAttributes.justification = just || Justification.LEFT;
    return tf;
  }

  // 광학 중심(cy) 기준 세로 정렬된 이름 TextFrame
  function _nameText(container, frameName, cx, cy, sizePt, color) {
    var tf = _text(container, NAME_PLACEHOLDER, cx, cy + sizePt * 0.123, FONT_SERIF, sizePt, color, Justification.CENTER, 0);
    tf.name = frameName;
    return tf;
  }

  // ── 문서 생성 ─────────────────────────────────────────────────
  var doc = app.documents.add(DocumentColorSpace.RGB, SHEET_W * MM, SHEET_H * MM);
  try {
    var rfx = doc.rasterEffectSettings;
    rfx.colorModel = RasterizationColorModel.DEFAULTCOLORMODEL;
    rfx.resolution = 300;
  } catch (eRfx) {}

  var printLayer = doc.layers[0];
  printLayer.name = "PrintData";
  var infoLayer = doc.layers.add(); infoLayer.name = "info";
  var guideLayer = doc.layers.add(); guideLayer.name = "TemplateGuide";
  var kissLayer = doc.layers.add(); kissLayer.name = "KissCut";

  // CutContour 스폿 (Everstory_mixed.jsx 와 동일 컨벤션)
  var cutSpot = (function () {
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
  })();

  var cutGroup = kissLayer.groupItems.add();
  cutGroup.name = "static_cuts";
  var cutCount = 0;
  function _cut(p) {
    p.filled = false;
    p.stroked = true;
    p.strokeColor = cutSpot;
    p.strokeWidth = 0.25;
    cutCount++;
    return p;
  }

  // ═════════════ 헤더 ═════════════
  var gHeader = infoLayer.groupItems.add();
  gHeader.name = "header";
  _text(gHeader, CORNER_L1, 13.5, 15.8, FONT_SANS_LIGHT, 4.5, INK_SOFT, Justification.LEFT, 250);
  _text(gHeader, CORNER_L2, 13.5, 19.0, FONT_SANS_LIGHT, 4.5, INK_SOFT, Justification.LEFT, 250);
  _text(gHeader, TITLE_TEXT, 74, 17.5, FONT_SERIF, 15, INK, Justification.CENTER, 20);
  _text(gHeader, SUBTITLE_TEXT, 74, 21.8, FONT_SANS_LIGHT, 5, INK_SOFT, Justification.CENTER, 500);
  _paint(_drawSpec(gHeader, _heartSpec(74, 24.8, 2.0, 1.9)), BLUSH_DEEP, null);
  var pill = _stadium(gHeader, 126.5, 16.2, 8.5, 4.6);
  _paint(pill, BLUSH, null);
  _text(gHeader, "A5", 126.5, 17.1, FONT_SERIF, 6.5, CLAY_DEEP, Justification.CENTER, 60);
  _text(gHeader, CORNER_R1, 135, 20.4, FONT_SANS_LIGHT, 4.5, INK_SOFT, Justification.RIGHT, 250);
  _text(gHeader, CORNER_R2, 135, 23.6, FONT_SANS_LIGHT, 4.5, INK_SOFT, Justification.RIGHT, 250);
  _paint(_line(gHeader, 13, 28.2, 135, 28.2), null, LINE_SOFT, 0.6, [2.2, 1.8]);

  // ═════════════ 사진 슬롯 + 명패 ═════════════
  var gPhoto = infoLayer.groupItems.add();
  gPhoto.name = "photo";

  var slot = _roundRect(gPhoto, 44.25, 80.5, 62.5, 99, 0.01);  // L13 T31 R75.5 B130
  slot.name = "photo_slot";
  slot.filled = false;
  slot.stroked = false;

  var PLQ_CX = 44.2, PLQ_CY = 116, PLQ_W = 58, PLQ_H = 25;
  var gPlaque = gPhoto.groupItems.add();
  gPlaque.name = "plaque";
  var plqOuter = _drawSpec(gPlaque, _plaqueSpec(PLQ_CX, PLQ_CY, PLQ_W, PLQ_H, 4, 2.5));
  _paint(plqOuter, IVORY, LINE_SOFT, 0.5);
  _paint(_drawSpec(gPlaque, _plaqueSpec(PLQ_CX, PLQ_CY, PLQ_W - 2.6, PLQ_H - 2.6, 3.2, 2.0)), null, INK_SOFT, 0.45);
  _paint(_drawSpec(gPlaque, _plaqueSpec(PLQ_CX, PLQ_CY, PLQ_W - 4.2, PLQ_H - 4.2, 2.7, 1.7)), null, LINE_SOFT, 0.3);
  _drawBow(gPlaque, PLQ_CX, 107.2, 7, 4.6, BLUSH, BLUSH_DEEP);
  _nameText(gPlaque, "name_main", PLQ_CX, 117.8, 20, INK);
  _paint(_line(gPlaque, PLQ_CX - 8.2, 124.6, PLQ_CX - 2.6, 124.6), null, INK_SOFT, 0.35);
  _paint(_drawSpec(gPlaque, _heartSpec(PLQ_CX, 124.6, 2.0, 1.9)), BLUSH_DEEP, null);
  _paint(_line(gPlaque, PLQ_CX + 2.6, 124.6, PLQ_CX + 8.2, 124.6), null, INK_SOFT, 0.35);

  // 명패 칼선용 paint 없는 path — 주문 스크립트가 사진 trace 와 Unite
  var plaqueCut = _drawSpec(gPhoto, _plaqueSpec(PLQ_CX, PLQ_CY, PLQ_W + 2 * CUT_M, PLQ_H + 2 * CUT_M, 4.6, 3.1));
  plaqueCut.name = "plaque_cut";
  plaqueCut.filled = false;
  plaqueCut.stroked = false;

  // ═════════════ 이름 라벨 12종 ═════════════
  var gLabels = infoLayer.groupItems.add();
  gLabels.name = "labels";

  var CA = 91.3, CB = 122.3;
  var R1 = 42.1, R2 = 58.3, R3 = 74.9, R4 = 93.1, R5 = 111.2, R6 = 127.0;

  var LABELS = [
    { n: "name_01", cx: CA, cy: R1, w: 28, h: 10, kind: "stadium", fill: BLUSH, stitch: STITCH },
    { n: "name_02", cx: CB, cy: R1, w: 28, h: 10, kind: "stadium", fill: CREAM, heartRight: true, tdx: -1.2 },
    { n: "name_03", cx: CA, cy: R2, w: 25, h: 8.6, kind: "stadium", fill: IVORY, stroke: LINE_SOFT, tulips: true, size: 7.5 },
    { n: "name_04", cx: CB, cy: R2, w: 28, h: 10, kind: "stadium", fill: CLAY, ring: CREAM, tcol: IVORY },
    { n: "name_05", cx: CA, cy: R3, w: 28, h: 10, kind: "round", r: 3, fill: GREIGE },
    { n: "name_06", cx: CB, cy: R3, w: 28, h: 10, kind: "stadium", fill: IVORY, stroke: GREIGE },
    { n: "name_07", cx: CA, cy: R4, w: 27, h: 11, kind: "scallop", fill: BLUSH },
    { n: "name_08", cx: CB, cy: R4, w: 27, h: 11, kind: "scallop", fill: IVORY, bowTop: true },
    { n: "name_09", cx: CA, cy: R5, w: 28, h: 9.6, kind: "round", r: 2.2, fill: IVORY, stroke: LINE_SOFT, sparkleRight: true, tdx: -1.5 },
    { n: "name_10", cx: CB, cy: R5, w: 28, h: 9.6, kind: "round", r: 2.2, fill: BLUSH, stitch: STITCH },
    { n: "name_11", cx: CA, cy: R6, w: 24, h: 8.6, kind: "round", r: 2, fill: CREAM, heartLeft: true, tdx: 1.2, size: 7.5 },
    { n: "name_12", cx: CB, cy: R6, w: 28, h: 10, kind: "stadium", fill: BROWN, tcol: IVORY }
  ];

  for (var li = 0; li < LABELS.length; li++) {
    var L = LABELS[li];
    var g = gLabels.groupItems.add();
    g.name = "label_" + L.n;
    var body;
    if (L.kind === "scallop") {
      body = _drawSpec(g, _scallopRectSpec(L.cx, L.cy, L.w - 1.6, L.h - 1.6, 2.3, 0.9));
      _paint(body, L.fill, L.stroke || null, 0.4);
    } else {
      var rr = (L.kind === "stadium") ? L.h / 2 : L.r;
      body = _roundRect(g, L.cx, L.cy, L.w, L.h, rr);
      _paint(body, L.fill, L.stroke || null, 0.4);
    }
    if (L.stitch) {
      var innerR = (L.kind === "stadium") ? (L.h - 2.4) / 2 : Math.max(1, (L.r || 2) - 0.6);
      _paint(_roundRect(g, L.cx, L.cy, L.w - 2.6, L.h - 2.4, innerR), null, L.stitch, 0.5, [1.6, 1.3]);
    }
    if (L.ring) {
      _paint(_roundRect(g, L.cx, L.cy, L.w - 2.4, L.h - 2.2, (L.h - 2.2) / 2), null, L.ring, 0.7);
    }
    if (L.tulips) {
      _drawTulip(g, L.cx - 9.2, L.cy, 3.4);
      _drawTulip(g, L.cx + 9.2, L.cy, 3.4);
    }
    if (L.heartRight) _paint(_drawSpec(g, _heartSpec(L.cx + 10.2, L.cy, 2.4, 2.3)), BLUSH_DEEP, null);
    if (L.heartLeft) _paint(_drawSpec(g, _heartSpec(L.cx - 8.8, L.cy, 2.4, 2.3)), BLUSH_DEEP, null);
    if (L.sparkleRight) _paint(_drawSpec(g, _sparkleSpec(L.cx + 10.4, L.cy, 2.4, 0.24)), BROWN, null);
    if (L.bowTop) _drawBow(g, L.cx, L.cy - L.h / 2 + 0.4, 4.8, 3.2, BLUSH, BLUSH_DEEP);
    _nameText(g, L.n, L.cx + (L.tdx || 0), L.cy, L.size || 8.5, L.tcol || INK);

    // 정적 칼선
    if (L.kind === "scallop") {
      _cut(_drawSpec(cutGroup, _scallopRectSpec(L.cx, L.cy, L.w + 2 * CUT_M - 1.6, L.h + 2 * CUT_M - 1.6, 2.6, 0.45)));
    } else {
      var cr = (L.kind === "stadium") ? (L.h + 2 * CUT_M) / 2 : (L.r + CUT_M);
      _cut(_roundRect(cutGroup, L.cx, L.cy, L.w + 2 * CUT_M, L.h + 2 * CUT_M, cr));
    }
  }

  // ═════════════ 데코 스티커 ═════════════
  var gDeco = infoLayer.groupItems.add();
  gDeco.name = "deco";

  // Row 1 (y≈141.5)
  _drawBow(gDeco, 22.5, 141.5, 15, 11, BLUSH, BLUSH_DEEP);
  _cut(_drawSpec(cutGroup, _blobSpec(22.5, 142.0, 9.0, 7.0, 0)));

  _drawBow(gDeco, 44, 141.5, 13, 9.5, GREIGE, BEIGE);
  _cut(_drawSpec(cutGroup, _blobSpec(44, 141.9, 8.0, 6.2, 2)));

  _paint(_drawSpec(gDeco, _heartSpec(62, 141.3, 8, 7.6)), BLUSH_DEEP, null);
  _paint(_drawSpec(gDeco, _heartSpec(62, 141.3, 4.6, 4.3)), null, IVORY, 0.4, [1.2, 1.0]);
  _cut(_drawSpec(cutGroup, _heartSpec(62, 141.4, 10.4, 10.0)));

  _paint(_drawSpec(gDeco, _heartSpec(78.5, 141.3, 9, 8.6)), IVORY, BLUSH_DEEP, 0.4);
  _paint(_drawSpec(gDeco, _heartSpec(78.5, 141.3, 5.6, 5.3)), null, BLUSH_DEEP, 0.35, [1.1, 0.9]);
  _paint(_ellipse(gDeco, 78.5, 140.6, 1.1, 1.1), TULIP_PINK, null);
  _paint(_ellipse(gDeco, 77.4, 141.6, 0.8, 0.8), BLUSH, null);
  _paint(_ellipse(gDeco, 79.6, 141.6, 0.8, 0.8), BLUSH, null);
  _cut(_drawSpec(cutGroup, _heartSpec(78.5, 141.4, 11.4, 11.0)));

  _paint(_drawSpec(gDeco, _sparkleSpec(92, 141.5, 3.6, 0.24)), BEIGE, null);
  _cut(_drawSpec(cutGroup, _sparkleSpec(92, 141.5, 5.0, 0.34)));

  _paint(_drawSpec(gDeco, _starSpec(105.5, 141.5, 4.3, 1.85)), CLAY, null);
  _cut(_drawSpec(cutGroup, _starSpec(105.5, 141.5, 5.7, 2.95)));

  _paint(_drawSpec(gDeco, _starSpec(119, 141.5, 4.3, 1.85)), BEIGE, null);
  _cut(_drawSpec(cutGroup, _starSpec(119, 141.5, 5.7, 2.95)));

  _paint(_drawSpec(gDeco, _sparkleSpec(133, 141, 3.9, 0.24)), BLUSH_DEEP, null);
  _paint(_drawSpec(gDeco, _sparkleSpec(135.5, 144.4, 1.7, 0.24)), BLUSH, null);
  _cut(_drawSpec(cutGroup, _blobSpec(133.8, 142.2, 5.4, 5.8, 4)));

  // Row 2 (y≈157.5)
  _paint(_drawSpec(gDeco, _sparkleSpec(18.5, 157.0, 2.1, 0.24)), IVORY, LINE_SOFT, 0.3);
  _paint(_drawSpec(gDeco, _sparkleSpec(21.5, 159.6, 1.2, 0.24)), CREAM, null);
  _paint(_ellipse(gDeco, 15.9, 159.8, 0.9, 0.9), CREAM, null);
  _cut(_drawSpec(cutGroup, _blobSpec(19.0, 158.0, 5.0, 4.4, 1)));

  _paint(_drawSpec(gDeco, _sparkleSpec(34, 157.0, 2.5, 0.24)), BLUSH_DEEP, null);
  _paint(_drawSpec(gDeco, _sparkleSpec(37.4, 159.8, 1.5, 0.24)), BLUSH, null);
  _paint(_drawSpec(gDeco, _sparkleSpec(30.9, 159.5, 0.9, 0.24)), BLUSH, null);
  _cut(_drawSpec(cutGroup, _blobSpec(34.3, 158.0, 5.4, 4.6, 3)));

  _paint(_drawSpec(gDeco, _sparkleSpec(53, 157.8, 2.7, 0.24)), IVORY, LINE_SOFT, 0.3);
  _paint(_drawSpec(gDeco, _sparkleSpec(56.4, 155.2, 1.5, 0.24)), IVORY, LINE_SOFT, 0.3);
  _paint(_ellipse(gDeco, 50.3, 155.4, 0.7, 0.7), INK_SOFT, null);
  _paint(_ellipse(gDeco, 56.9, 158.9, 0.7, 0.7), INK_SOFT, null);
  _cut(_drawSpec(cutGroup, _blobSpec(53.5, 157.2, 5.6, 4.6, 5)));

  _paint(_drawSpec(gDeco, _sparkleSpec(68, 157.5, 2.7, 0.24)), BROWN, null);
  _cut(_drawSpec(cutGroup, _sparkleSpec(68, 157.5, 4.0, 0.34)));

  _drawBow(gDeco, 81.5, 157.5, 9.5, 7, CLAY, CLAY_DEEP);
  _cut(_drawSpec(cutGroup, _blobSpec(81.5, 157.9, 6.4, 5.2, 6)));

  _paint(_drawSpec(gDeco, _heartSpec(99.3, 157.5, 5.6, 5.4)), CREAM, LINE_SOFT, 0.35);
  _cut(_drawSpec(cutGroup, _heartSpec(99.3, 157.6, 7.9, 7.7)));

  _paint(_drawSpec(gDeco, _heartSpec(113.5, 157.5, 5.6, 5.4)), BLUSH_DEEP, null);
  _cut(_drawSpec(cutGroup, _heartSpec(113.5, 157.6, 7.9, 7.7)));

  // 베리 가지
  var gBranch = gDeco.groupItems.add();
  gBranch.name = "branch";
  var stem = _drawSpec(gBranch, [
    { a: [122.0, 161.0], r: [125.5, 159.6] },
    { a: [134.5, 154.6], l: [130.5, 155.8] }
  ], false);
  _paint(stem, null, INK_SOFT, 0.55);
  _paint(_drawSpec(gBranch, [{ a: [125.5, 159.2], r: [126.3, 157.9] }, { a: [127.3, 156.6], l: [126.6, 157.5] }], false), null, INK_SOFT, 0.45);
  _paint(_drawSpec(gBranch, [{ a: [129.8, 157.2], r: [130.4, 158.3] }, { a: [131.2, 159.6], l: [130.7, 158.7] }], false), null, INK_SOFT, 0.45);
  _paint(_ellipse(gBranch, 124.4, 157.6, 2.6, 2.6), IVORY, BEIGE, 0.45);
  _paint(_ellipse(gBranch, 127.6, 155.4, 2.4, 2.4), IVORY, BEIGE, 0.45);
  _paint(_ellipse(gBranch, 128.2, 159.9, 2.4, 2.4), BLUSH, BEIGE, 0.45);
  _paint(_ellipse(gBranch, 131.8, 160.3, 2.2, 2.2), IVORY, BEIGE, 0.45);
  _paint(_ellipse(gBranch, 133.6, 156.9, 2.4, 2.4), IVORY, BEIGE, 0.45);
  _cut(_drawSpec(cutGroup, _blobSpec(128.4, 157.9, 8.3, 5.2, 7)));

  // ═════════════ 하단 라벨 5종 ═════════════
  var gBottom = infoLayer.groupItems.add();
  gBottom.name = "bottom";

  // 1) 스캘럽 원형 뱃지
  var gB1 = gBottom.groupItems.add(); gB1.name = "badge";
  _paint(_drawSpec(gB1, _scallopCircleSpec(27.5, 178, 9.6, 12, 0.9)), BLUSH_DEEP, null);
  _paint(_ellipse(gB1, 27.5, 178, 15.2, 15.2), null, IVORY, 0.5, [1.5, 1.2]);
  _nameText(gB1, "name_13", 27.5, 177.2, 8.5, INK);
  _paint(_drawSpec(gB1, _heartSpec(27.5, 182.2, 2.2, 2.1)), CLAY_DEEP, null);
  _cut(_drawSpec(cutGroup, _scallopCircleSpec(27.5, 178, 10.9, 12, 0.45)));

  // 2) 스티치 타원 + 리본
  var gB2 = gBottom.groupItems.add(); gB2.name = "oval";
  _paint(_ellipse(gB2, 56.5, 178, 26, 15.6), IVORY, LINE_SOFT, 0.45);
  _paint(_ellipse(gB2, 56.5, 178, 22.6, 12.4), null, BLUSH_DEEP, 0.45, [1.5, 1.2]);
  _nameText(gB2, "name_14", 56.5, 177.6, 8.5, INK);
  _drawBow(gB2, 56.5, 184.6, 5.2, 3.5, BLUSH, BLUSH_DEEP);
  _cut(_ellipse(cutGroup, 56.5, 178.4, 29.4, 19.4));

  // 3) 태그 (구멍 + 튤립 + 하트, 텍스트 없음)
  var gB3 = gBottom.groupItems.add(); gB3.name = "tag";
  _paint(_roundRect(gB3, 79, 178, 12, 21, 2), PINK_PALE, null);
  _paint(_ellipse(gB3, 79, 170.6, 3.0, 3.0), C(255, 255, 255), GREIGE, 0.4);
  _drawTulip(gB3, 79, 177.6, 5.6);
  _paint(_drawSpec(gB3, _heartSpec(79, 184.2, 2.2, 2.1)), BLUSH_DEEP, null);
  _cut(_roundRect(cutGroup, 79, 178, 12 + 2 * CUT_M, 21 + 2 * CUT_M, 3));

  // 4) 아치
  var gB4 = gBottom.groupItems.add(); gB4.name = "arch";
  _paint(_drawSpec(gB4, _archSpec(98.5, 178.5, 14, 20, 1.5)), GREIGE, null);
  _nameText(gB4, "name_15", 98.5, 179.3, 8, BROWN);
  _paint(_drawSpec(gB4, _heartSpec(98.5, 184.4, 2.0, 1.9)), CLAY_DEEP, null);
  _cut(_drawSpec(cutGroup, _archSpec(98.5, 178.5, 14 + 2 * CUT_M, 20 + 2 * CUT_M, 2.1)));

  // 5) 티켓
  var gB5 = gBottom.groupItems.add(); gB5.name = "ticket";
  _paint(_drawSpec(gB5, _ticketSpec(123, 178, 20, 16, 2.2)), CLAY, null);
  _paint(_roundRect(gB5, 123, 178, 15.6, 11.6, 0.5), null, IVORY, 0.45, [1.5, 1.2]);
  _nameText(gB5, "name_16", 123, 177.0, 8.5, IVORY);
  _paint(_line(gB5, 119.6, 181.3, 126.4, 181.3), null, IVORY, 0.4, [1.0, 0.9]);
  _cut(_drawSpec(cutGroup, _ticketSpec(123, 178, 20 + 2 * CUT_M, 16 + 2 * CUT_M, 2.2)));

  // ═════════════ 푸터 ═════════════
  var gFooter = infoLayer.groupItems.add();
  gFooter.name = "footer";
  _text(gFooter, FOOTER_L1, 13.5, 198.3, FONT_SANS_LIGHT, 4.8, INK_SOFT, Justification.LEFT, 250);
  _text(gFooter, FOOTER_L2, 13.5, 201.6, FONT_SANS_LIGHT, 4.8, INK_SOFT, Justification.LEFT, 250);
  _paint(_drawSpec(gFooter, _heartSpec(36.6, 201.1, 1.8, 1.7)), BLUSH_DEEP, null);
  _paint(_ellipse(gFooter, 74, 199.5, 18, 11), null, LINE_SOFT, 0.5);
  _text(gFooter, "made", 74, 198.7, FONT_SERIF_IT, 5.5, INK_SOFT, Justification.CENTER, 40);
  _text(gFooter, "with love", 74, 202.0, FONT_SERIF_IT, 5.5, INK_SOFT, Justification.CENTER, 40);
  _drawBow(gFooter, 74, 206.6, 4.2, 2.8, BLUSH, BLUSH_DEEP);
  _text(gFooter, FOOTER_HANDLE, 134.5, 198.3, FONT_SANS_LIGHT, 4.8, INK_SOFT, Justification.RIGHT, 200);
  _text(gFooter, FOOTER_URL, 134.5, 201.6, FONT_SANS_LIGHT, 4.8, INK_SOFT, Justification.RIGHT, 200);

  // ═════════════ 가이드 레이어 (주문 스크립트가 삭제) ═════════════
  var guideRect = _roundRect(guideLayer, 44.25, 80.5, 62.5, 99, 0.01);
  _paint(guideRect, null, C(160, 160, 160), 0.5, [2.5, 2]);
  _text(guideLayer, "PHOTO SLOT — Everstory_keepsake.jsx 가 사진 배치", 44.25, 80.5, FONT_SANS, 6, C(150, 150, 150), Justification.CENTER, 0);

  // ═════════════ 저장 ═════════════
  doc.selection = null;

  var scriptDir = (new File($.fileName)).parent;
  var tplFolder = new Folder(scriptDir.fsName + "/templates");
  if (!tplFolder.exists) tplFolder.create();

  function _saveAi(targetDoc, file) {
    var aiOpts = new IllustratorSaveOptions();
    aiOpts.compatibility = Compatibility.ILLUSTRATOR24;
    aiOpts.pdfCompatible = true;
    aiOpts.embedICCProfile = true;
    targetDoc.saveAs(file, aiOpts);
  }

  // saveAs 는 확장자를 .ai 로 강제하므로 .ai 저장 후 파일 복사로 .ait 생성
  var savedPath = "", saveError = "";
  try {
    var aiFile = new File(tplFolder.fsName + "/template_keepsake_v1.ai");
    _saveAi(doc, aiFile);
    var aitFile = new File(tplFolder.fsName + "/template_keepsake_v1.ait");
    if (aitFile.exists) aitFile.remove();
    if (aiFile.copy(aitFile.fsName) && aitFile.exists) {
      aiFile.remove();
      savedPath = aitFile.fsName;
    } else {
      savedPath = aiFile.fsName + " (.ait 복사 실패 — 확장자를 수동으로 .ait 로 변경하세요)";
    }
  } catch (eSaveTpl) {
    saveError = (eSaveTpl && eSaveTpl.message) ? eSaveTpl.message : String(eSaveTpl);
  }

  var nameFrames = 17; // name_01~16 + name_main
  var msg =
    "완료: Keepsake 템플릿 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + "\n" +
    "이름 TextFrame: " + nameFrames + "개 (name_01~16 + name_main, placeholder '" + NAME_PLACEHOLDER + "')\n" +
    "정적 칼선: " + cutCount + "개 (KissCut > static_cuts, CutContour)\n" +
    "세리프 폰트: " + (FONT_SERIF ? FONT_SERIF.name : "미해결 (기본 폰트)") +
    " / 마이크로: " + (FONT_SANS_LIGHT ? FONT_SANS_LIGHT.name : "미해결") + "\n" +
    (savedPath ? "저장: " + savedPath : "저장 실패: " + saveError) + "\n\n" +
    "다음: Everstory_keepsake.jsx 로 주문 처리 (사진 + 이름 주입)";

  if (testConfig) {
    testConfig.lastMessage = msg;
    if (testConfig.closeAfter) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose) {}
    }
  } else {
    alert(msg);
  }
})();
