// ═══════════════════════════════════════════════════════════════
//  Everstory Label 시트 (빈티지 상표 4형태 · 원본 사진 × 여러 장)
//
//  레퍼런스(Sticker Guidelines/sample*.png) 재현 4형태를 A5 한 시트에
//  균일 격자로 깐다. 사진은 02_cutout 누끼가 아니라 **01_original 원본**을
//  창에 cover-fit — 이 상품은 Phase A(누끼)를 건너뛴다.
//
//  형태 (기하는 2026-08-28 Chrome 오버레이 검증값 그대로):
//   · CIRCLE  01 — 브릭 링 + 크림 밴드 + 아치 제목/날짜
//   · ARCH    02 — 터널형 + 아치 창 + 하단 밴드 날짜
//   · CARD    06 — 라운드 카드 + 좌정렬 제목 + 하단 밴드
//   · WAVY    07 — 세로 타원 7봉우리 유기 물결 (H2 확정 공식)
//
//  플로우: 01_original 폴더 → 다이얼로그(사진 multiselect·형태·사이즈·
//  팔레트·문구·칼선) → 시트 생성 → header_right 주입 →
//  03_output/{ts}_LABEL_{형태}_{inch}_sheet01.ai 자동 저장.
//
//  함정 (기존 스크립트 실측 — 되돌리지 말 것):
//   · var 테이블 호이스팅 안 됨 — 메인 플로우보다 위에 둘 것.
//   · 여러 줄 중첩 삼항 금지 (ExtendScript 가 틀린 분기 실행).
//   · embed() 후 핸들 무효 — bounds 매칭 재탐색.
//   · File.name 은 URI 인코딩 NFD — decodeURI+NFC 로 표시.
//   · **아래쪽 곡선 텍스트를 세로 타원 호에 앉히지 말 것** — 타원 하단은
//     곡률이 급해 각도 대비 패스가 짧아 글자 양끝이 잘린다(실측).
//     날짜는 항상 완만한 원호(WAVY dateR)를 쓴다.
//   · pathText + Justification.CENTER 는 열린 패스에서 중앙 정렬됨
//     (ring.jsx 1차 실행에서 확인).
//   · HEIC 은 Illustrator 가 place 못 한다 — 수집에서 제외하고 개수만 경고.
//
//  사용: File → Scripts → Other Script → Everstory_label.jsx
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "label v1";
  var SCRIPT_TITLE = "Everstory Label Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var TEMPLATE_NAME = "template_cutout_v2.ait";

  // ── 시트 (mixed 2026-08-25 운영 상수) ─────────────────────────
  var BODY_PADDING_X_MM = 0;
  var BODY_PADDING_Y_MM = 1.5;
  var GAP_BASE_MM = 1.5;      // 칼선끼리 최소 간격. outset 이 있으면 그만큼 더 벌린다

  // ── 사이즈 (긴 변 = 세로) ─────────────────────────────────────
  var SIZE_OPTIONS = ["1.5\" / 38mm", "2\" / 51mm  (기본)", "2.5\" / 64mm"];
  var SIZE_MM      = [38.1, 50.8, 63.5];
  var SIZE_DEFAULT = 1;

  // ── 칼선 ─────────────────────────────────────────────────────
  //  +1mm = 외곽선 밖 1mm 흰 테두리 (레퍼런스 상품들의 표준. 기본)
  //   0mm = 외곽선 위에서 컷
  //  -1mm = 배경을 밖으로 1mm 키우고 외곽선 위치에서 컷 (블리드)
  var CUT_OPTIONS = ["+1mm 흰 테두리 (기본)", "0mm (외곽선 = 칼선)", "-1mm 블리드"];
  var CUT_VALUES  = [1, 0, -1];
  var CUT_DEFAULT_INDEX = 0;

  // ── 팔레트 (레퍼런스 hex 그대로: bg=주조, paper=크림, ink=글자) ──
  var PALETTES = [
    { name: "01 브릭/크림",     bg: "C85B4A", paper: "F2E7DC", ink: "2B2725" },
    { name: "02 브라운/틸",     bg: "8E6F5A", paper: "E8DCCF", ink: "314C57" },
    { name: "06 슬레이트/모브", bg: "5F89A4", paper: "EDE3D5", ink: "7F5B6C" },
    { name: "07 코랄/네이비",   bg: "D97354", paper: "F4E9E0", ink: "4F6577" }
  ];
  var PALETTE_OPTIONS = ["도형 기본 (레퍼런스 짝)", PALETTES[0].name, PALETTES[1].name,
                         PALETTES[2].name, PALETTES[3].name];

  // ── 형태 ─────────────────────────────────────────────────────
  // unitW/H = 검증된 웹 viewBox. 실제 크기 = 긴 변(sizeMm) 기준 균일 스케일.
  // defaultPalette = 레퍼런스에서 그 형태가 쓰던 팔레트 인덱스.
  // bboxL/T/W/H = 그려지는 아트의 **실측 외곽**. viewBox(unitW/H) 로 스케일하면
  // WAVY 는 6%, ARCH 는 4% 작게 나온다 — 주문 사이즈와 실물이 어긋난다 (2026-08-28 실측).
  var SHAPES = [
    { key: "CIRCLE", label: "01 원형 — 브릭 링 + 아치 텍스트", defaultPalette: 0,
      bboxL: 2,    bboxT: 2,    bboxW: 296,   bboxH: 296 },
    { key: "ARCH",   label: "02 아치 — 터널형 + 하단 밴드",     defaultPalette: 1,
      bboxL: 8,    bboxT: 8,    bboxW: 244,   bboxH: 344 },
    { key: "CARD",   label: "06 카드 — 라운드 사각 + 좌정렬",   defaultPalette: 2,
      bboxL: 0,    bboxT: 0,    bboxW: 260,   bboxH: 340 },
    { key: "WAVY",   label: "07 물결 — 유기 7봉우리 (H2)",      defaultPalette: 3,
      // b=190 · eggK 0.09 기준 재실측. a·b·eggK·amp 를 바꾸면 이 값도 반드시 다시 재야 한다.
      bboxL: 18.7, bboxT: 16.4, bboxW: 322.6, bboxH: 392.2 }
  ];
  var SHAPE_DEFAULT = 3;

  // ── WAVY H2 확정 공식 (2026-08-28 오버레이 검증 — 되돌리지 말 것) ──
  var WAVY = {
    // b 214 → 190 (2026-08-28 사용자 지정): 세로가 너무 길어 보였다. 비율 0.730 → 0.822.
    // b 만 줄이면 bboxH 가 줄어 s 가 12.7% 커지므로 글자·사진이 전부 커지고
    // 잠근 값(날짜 10.52pt, 액센트 획 0.47pt)이 깨진다. 그래서 내부 요소는 전부
    // g = 392.2/441.8 = 0.8877 배로 같이 줄여 **인쇄 크기를 그대로** 유지한다.
    // b 를 다시 건드리면 g 를 새로 구해 아래 값 전체와 bbox 를 함께 갱신할 것.
    cx: 175, cy: 216, a: 158, b: 190, k: 7, amp: 0.058, mod: 0.18, ph0: 0.9, ph1: 0.3,
    // 외곽 물결도 사진창과 같은 달걀 변조를 쓴다 — 사진만 달걀이면 프레임과 따로 논다
    // (2026-08-28). 값은 타원(0)과 초기 달걀(0.18)의 중간.
    eggK: 0.09,
    stroke: 5.77,
    // 세로 정렬: 콘텐츠 덩어리를 배지 bbox 중심 쪽으로 14 내렸다 (2026-08-28 사용자 승인).
    // 사진 창 = 달걀형(위가 넓고 아래가 좁은). 2026-08-28 타원에서 교체 —
    // 너무 길쭉하지 않게 짧히고, 아래에서 위로 갈수록 넓어진다.
    // eggK = 폭 변조. AI(y-up): x = rx·cos(t)·(1 + k·sin(t))
    // 사진도 정확히 g 배 — 여기서 사진만 키우면(+8% 시도, 2026-08-28) 제목 꼬리 "…DAY" 와
    // 날짜 양끝이 사진 위로 올라탄다. 사진을 키우려면 titleRx·dateR 도 같이 밀어야 한다.
    photoRx: 94.10, photoRy: 115.41, photoEggK: 0.09, photoCy: 215.11,
    titleRx: 104.75, titleRy: 154.47, titleCy: 231.98, titleA0: 165, titleA1: 15, titleFs: 30.18, titleTrack: 10,
    // 날짜 10.52pt(2" 기준 = 28.66 units) 요청에 맞춘 값 (2026-08-28).
    // 자간 120 을 유지하면 글자 폭이 아치를 넘쳐 _fitFontSize 가 축소해버려 10.52pt 가 안 나온다.
    // span 70°→88° · 자간 120→60 으로 아치를 늘리고 자간을 줄여 80% 점유.
    dateR: 142.04, dateCy: 228.43, dateA0: 224, dateA1: 316, dateFs: 28.66, dateTrack: 60,
    // 액센트 호 — 사용자가 일러스트에서 직접 그린 선 실측(2026-08-28):
    // 길이 115 units(기존 59의 약 2배) · 획 0.47pt · 가로 거리 ~120.
    accOut: 12.43, accSpan: 22, accStroke: 1.28
  };

  // ── 서체 (설치 확인: Gloock-Regular. Archivo 미설치 → Poppins 폴백) ──
  // 실측(2026-08-28, 100pt "HARIN'S SECOND BIRTHDAY" 기준 폭):
  //   Instrument Serif 976 / DM Serif Display 1220 / Gloock 1353
  // Gloock 은 28% 넓고 획이 무거워 기본에서 제외. titleFs 는 Instrument Serif 기준이며
  // 더 넓은 서체를 고르면 _fitFontSize 가 자동 축소한다.
  // 실측 폭 (100pt "HARIN'S SECOND BIRTHDAY"): DIN Condensed 830 / Instrument Serif 976 /
  // DM Serif Display 1220 / Gloock 1353. titleFs 는 아치 점유 ~88% 가 되도록 서체별로 따로 잡는다
  // — 공용 크기를 쓰면 넓은 서체가 _fitFontSize 로 축소돼 서체마다 크기가 들쭉날쭉해진다.
  var TITLE_FONTS = [
    // dateFs 는 대문자 높이가 서로 맞도록 서체별 보정 (DIN 28.66 units = 2" 에서 10.52pt).
    // b 190 개편 때 전 서체를 g=0.8877 배 (39→34.62 등). 인쇄 pt 는 이전과 동일하다.
    { label: "DIN Condensed Bold (기본)", cands: ["DINCondensed-Bold"],        fs: 34.62, dateFs: 28.66 },
    { label: "Instrument Serif",          cands: ["InstrumentSerif-Regular"],  fs: 30.18, dateFs: 27.87 },
    { label: "DM Serif Display",          cands: ["DMSerifDisplay-Regular"],   fs: 23.97, dateFs: 28.23 }
  ];
  var TITLE_FONT_DEFAULT = 0;
  // 날짜도 제목과 같은 서체로 간다 (2026-08-28 사용자 지정: 위아래 모두 DIN Condensed).
  var DATE_FONT_FALLBACK = ["Outfit-Medium", "Quicksand-SemiBold", "Nunito-Bold"];
  var HEAD_FONT_CANDS  = ["ArchivoBlack-Regular", "BricolageGrotesque-ExtraBold", "Poppins-ExtraBold"];

  var DEF_TITLE = "HARIN'S SECOND BIRTHDAY";
  var DEF_DATE  = "AUGUST 23, 2026";

  var PHOTO_EXT = /\.(jpg|jpeg|png|psd|tif|tiff)$/i;


  // ═══════════════════════════════════════════════════════
  //  MAIN
  // ═══════════════════════════════════════════════════════
  var QUIET = false;   // 주입 실행이면 alert 대신 결과를 전역에 담는다

  var folder = _launchFolder() ||
    Folder.selectDialog("01_original 폴더 선택 (원본 사진 — 누끼 불필요)");
  if (!folder) return;

  var collect = _collectPhotos(folder);
  if (collect.files.length === 0) {
    alert("선택한 폴더에 배치 가능한 사진(jpg/png/psd/tif)이 없습니다." +
          (collect.heic > 0 ? ("\nHEIC " + collect.heic + "장은 Illustrator 가 열지 못합니다 — JPEG 변환 필요.") : ""));
    return;
  }

  var opt = _showDialog(collect, folder);
  if (!opt) return;

  // 프로파일 불일치(예: Display P3 사진) 대화상자가 뜨면 자동 실행이 통째로 멈춘다.
  // 실측 2026-08-28: 하린 폴더의 P3 JPEG 한 장이 Illustrator 를 8분간 모달로 잠갔다.
  // 입력 검증이 아니라 자동화가 멈추지 않게 하는 가드 — 끝나면 원상 복구한다.
  var prevUIL = null;
  try { prevUIL = app.userInteractionLevel; app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS; } catch (eUI) {}
  try {
    _buildSheet(opt, folder);
  } catch (e) {
    _report("실패: " + ((e && e.message) ? e.message : String(e)) +
            (e && e.line ? ("  (line " + e.line + ")") : ""));
  } finally {
    if (prevUIL !== null) { try { app.userInteractionLevel = prevUIL; } catch (eR) {} }
  }


  // ═══════════════════════════════════════════════════════
  //  SHEET BUILD
  // ═══════════════════════════════════════════════════════
  function _buildSheet(opt, folder) {
    var shape = SHAPES[opt.shapeIdx];
    var s = (opt.sizeMm * MM_TO_PT) / shape.bboxH;   // unit → pt (실측 외곽 기준)
    var cellW = shape.bboxW * s;
    var cellH = shape.bboxH * s;
    var outPt = opt.cutMm * MM_TO_PT;                // 칼선 outset (음수 = 블리드)

    var padX = BODY_PADDING_X_MM * MM_TO_PT;
    var padY = BODY_PADDING_Y_MM * MM_TO_PT;
    var gapMm = GAP_BASE_MM + 2 * Math.max(0, opt.cutMm);   // 흰 테두리만큼 간격 확보
    var gap = gapMm * MM_TO_PT;

    var templateFile = _resolveTemplate();
    if (!templateFile || !templateFile.exists) {
      alert(TEMPLATE_NAME + " 를 찾을 수 없습니다.");
      return;
    }
    var doc = _openTemplateDoc(templateFile);

    var bodyPath, headerText;
    try {
      bodyPath   = _findInfoPath(doc, "body");
      headerText = _findInfoPath(doc, "header_right");
      if (headerText.typename !== "TextFrame")
        throw new Error("info > header > header_right 가 TextFrame 이 아닙니다.");
    } catch (eTmpl) {
      alert(eTmpl.message);
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (ec) {}
      return;
    }

    var printLayer = doc.layers.add(); printLayer.name = "PrintData";
    var kissLayer  = doc.layers.add(); kissLayer.name  = "KissCut";
    var cutSpot = _ensureCutContour(doc);

    var bb = bodyPath.geometricBounds;   // [L, T, R, B] (T > B, y-up)
    var bL = bb[0], bT = bb[1], bR = bb[2], bB = bb[3];
    var binW = (bR - bL) - 2 * padX;
    var binH = (bT - bB) - 2 * padY;

    var cols = Math.floor((binW + gap) / (cellW + gap));
    var rows = Math.floor((binH + gap) / (cellH + gap));
    if (cols < 1 || rows < 1) {
      try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
      alert("이 사이즈는 body 에 한 셀도 안 들어갑니다.");
      return;
    }
    var usedW = cols * cellW + (cols - 1) * gap;
    var usedH = rows * cellH + (rows - 1) * gap;
    var x0 = bL + padX + (binW - usedW) / 2;
    var y0 = bT - padY - (binH - usedH) / 2;

    var pal = _resolvePalette(opt, shape);
    var tfSpec = TITLE_FONTS[opt.titleFontIdx] || TITLE_FONTS[0];
    var tf = _resolveFont(tfSpec.cands);
    var fonts = {
      title:  tf,
      date:   tf || _resolveFont(DATE_FONT_FALLBACK),   // 위아래 같은 서체
      head:   _resolveFont(HEAD_FONT_CANDS),
      titleFs: tfSpec.fs,
      dateFs:  tfSpec.dateFs,
      name:   tfSpec.label
    };

    var placed = 0, failed = 0;
    var slots = cols * rows;
    for (var i = 0; i < slots; i++) {
      var photo = opt.photos[i % opt.photos.length];
      var cx = x0 + (i % cols) * (cellW + gap);          // 셀 좌상단 x
      var cy = y0 - Math.floor(i / cols) * (cellH + gap); // 셀 좌상단 y (y-up)
      try {
        _composeLabel(doc, printLayer, kissLayer, cutSpot, shape, pal, fonts,
                      opt, photo, cx, cy, s, outPt);
        placed++;
      } catch (eU) {
        failed++;
      }
    }

    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eK) {}
    try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (eP) {}
    doc.selection = null;

    _drawHeader(opt, shape, headerText);

    var savedPath = "", saveErr = "";
    try {
      var outF = _resolveOutputFolder(folder);
      var fname = _timestamp() + "_LABEL_" + shape.key + "_" + _sizeTag(opt.sizeMm) + "_sheet01.ai";
      var sf = new File(outF.fsName + "/" + fname);
      _saveAi(doc, sf);
      savedPath = sf.fsName;
    } catch (eS) {
      saveErr = (eS && eS.message) ? eS.message : String(eS);
    }

    _report(
      "완료: 라벨 시트\n\n" +
      "형태: " + shape.label + "\n" +
      "사이즈: " + _sizeTag(opt.sizeMm) + " (긴 변 " + opt.sizeMm + "mm)  /  칼선: " +
        CUT_OPTIONS[opt.cutIdx] + "\n" +
      "팔레트: " + pal.name + "\n" +
      "제목: " + opt.title + "  /  날짜: " + opt.dateText + "\n" +
      "격자: " + cols + "×" + rows + " = " + slots + " 슬롯  /  사진 " + opt.photos.length + "장 round-robin\n" +
      "배치: " + placed + "개" + (failed > 0 ? ("  (실패 " + failed + ")") : "") + "\n" +
      (fonts.title ? "" : "⚠ Gloock 미인식 — 기본 서체로 대체됨. ~/Library/Fonts 확인.\n") +
      (opt.heic > 0 ? ("⚠ HEIC " + opt.heic + "장 제외됨 (Illustrator 미지원 — JPEG 변환 필요)\n") : "") +
      "\n" +
      (savedPath ? ("저장: " + savedPath) : ("저장 실패: " + (saveErr || "unknown"))) + "\n\n" +
      "확인: 칼선 여백 / 아치 텍스트 중앙 정렬 / 사진 crop / 외곽선 두께."
    );
  }

  function _resolvePalette(opt, shape) {
    if (opt.paletteIdx === 0) return PALETTES[shape.defaultPalette];
    return PALETTES[opt.paletteIdx - 1];
  }


  // ═══════════════════════════════════════════════════════
  //  LABEL COMPOSITION — 셀 좌상단 (x, yTop), 스케일 s
  //  웹 검증 좌표(y-down)를 U() 로 AI(y-up)에 사상한다.
  // ═══════════════════════════════════════════════════════
  function _composeLabel(doc, printL, kissL, cutSpot, shape, pal, fonts, opt, photoFile, x, yTop, s, outPt) {
    // shape 는 UX/UY 클로저가 bboxL/T 를 읽는 데 쓰인다
    // 웹 좌표 → AI 좌표. 아트 실측 외곽(bboxL/T)이 셀 좌상단에 맞도록 원점 이동.
    function UX(px) { return x + (px - shape.bboxL) * s; }
    function UY(py) { return yTop - (py - shape.bboxT) * s; }

    var bg    = _hexToRGB(pal.bg);
    var paper = _hexToRGB(pal.paper);
    var ink   = _hexToRGB(pal.ink);

    // "+1mm" 는 눈에 보이는 흰 테두리 기준 — 외곽선 반폭을 더해야 실제로 1mm 가 된다.
    if (outPt > 0) outPt = outPt + _strokeHalf(shape, s);
    if (shape.key === "CIRCLE") _drawCircle(doc, printL, kissL, cutSpot, fonts, opt, photoFile, UX, UY, s, outPt, bg, paper, ink);
    else if (shape.key === "ARCH") _drawArch(doc, printL, kissL, cutSpot, fonts, opt, photoFile, UX, UY, s, outPt, bg, paper, ink);
    else if (shape.key === "CARD") _drawCard(doc, printL, kissL, cutSpot, fonts, opt, photoFile, UX, UY, s, outPt, bg, paper, ink);
    else _drawWavy(doc, printL, kissL, cutSpot, fonts, opt, photoFile, UX, UY, s, outPt, bg, paper, ink);
  }

  // ── 01 원형 ──────────────────────────────────────────────────
  function _drawCircle(doc, printL, kissL, cutSpot, fonts, opt, photoFile, UX, UY, s, outPt, bg, paper, ink) {
    var cx = UX(150), cy = UY(150);
    var bleed = 0;
    if (outPt < 0) bleed = -outPt;

    _circle(printL, cx, cy, 148 * s + bleed, bg, null, 0);
    _circle(printL, cx, cy, 137 * s, paper, null, 0);
    _photoInCircle(doc, printL, photoFile, cx, UY(149), 90 * s, opt.embed);
    _circle(printL, cx, cy, 94 * s, null, bg, 1.3 * s);

    var tPath = _ellipseArc(printL, cx, cy, 115 * s, 115 * s, 192, -12);
    _pathTextOn(tPath, opt.title, fonts.title, 22.5 * s, 60, ink, printL);
    var dPath = _ellipseArc(printL, cx, cy, 110 * s, 110 * s, 215, 325);
    _pathTextOn(dPath, opt.dateText, fonts.date, 11 * s, 200, ink, printL);

    _dot(printL, cx + 122 * s * Math.cos(Math.PI), cy, 3.4 * s, bg);
    _dot(printL, cx + 110 * s * Math.cos(_rad(206)), cy + 110 * s * Math.sin(_rad(206)), 2.2 * s, bg);
    _dot(printL, cx + 110 * s * Math.cos(_rad(334)), cy + 110 * s * Math.sin(_rad(334)), 2.2 * s, bg);

    var cut = _circlePath(kissL, cx, cy, 148 * s + Math.max(0, outPt));
    _forceCutContourStroke(cut, cutSpot);
  }

  // ── 02 아치 ──────────────────────────────────────────────────
  function _drawArch(doc, printL, kissL, cutSpot, fonts, opt, photoFile, UX, UY, s, outPt, bg, paper, ink) {
    var bleed = 0;
    if (outPt < 0) bleed = -outPt;

    var outer = _archPath(printL, UX, UY, s, 8, 130, 122, 352, bleed);
    outer.filled = true; outer.fillColor = paper;
    outer.stroked = true; outer.strokeColor = bg; outer.strokeWidth = 2 * s;

    var inner = _archPath(printL, UX, UY, s, 17, 130, 113, 343, 0);
    inner.filled = false; inner.stroked = true; inner.strokeColor = bg; inner.strokeWidth = 1 * s; inner.opacity = 75;

    _photoInArch(doc, printL, photoFile, UX, UY, s, opt.embed, bg);

    var band = printL.pathItems.rectangle(UY(306), UX(8), 244 * s, 46 * s);
    band.stroked = false; band.filled = true; band.fillColor = ink;

    // 제목: 왼쪽 세로 → 상단 아치 → 오른쪽 세로 패스
    var tPath = _archTextPath(printL, UX, UY, s, 30, 262, 130, 100);
    _pathTextOn(tPath, opt.title, fonts.title, 20 * s, 60, ink, printL);

    var dTf = printL.textFrames.pointText([UX(130), UY(334)]);
    dTf.contents = opt.dateText;
    var da = dTf.textRange.characterAttributes;
    if (fonts.date) da.textFont = fonts.date;
    da.size = 12.5 * s; da.tracking = 200; da.fillColor = paper;
    try { dTf.textRange.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}

    var cut = _archPath(kissL, UX, UY, s, 8, 130, 122, 352, Math.max(0, outPt));
    cut.filled = false;
    _forceCutContourStroke(cut, cutSpot);
  }

  // ── 06 카드 ──────────────────────────────────────────────────
  function _drawCard(doc, printL, kissL, cutSpot, fonts, opt, photoFile, UX, UY, s, outPt, bg, paper, ink) {
    var bleed = 0;
    if (outPt < 0) bleed = -outPt;

    var card = printL.pathItems.roundedRectangle(
      UY(0) + bleed, UX(0) - bleed, 260 * s + 2 * bleed, 340 * s + 2 * bleed, 22 * s, 22 * s);
    card.stroked = false; card.filled = true; card.fillColor = bg;

    // 하단 밴드 — 카드 안에서 클립
    var bandGrp = printL.groupItems.add();
    var band = printL.pathItems.rectangle(UY(284), UX(0), 260 * s, 56 * s + bleed);
    band.stroked = false; band.filled = true; band.fillColor = ink;
    band.move(bandGrp, ElementPlacement.PLACEATBEGINNING);
    var bandClip = printL.pathItems.roundedRectangle(
      UY(0) + bleed, UX(0) - bleed, 260 * s + 2 * bleed, 340 * s + 2 * bleed, 22 * s, 22 * s);
    bandClip.move(bandGrp, ElementPlacement.PLACEATBEGINNING);
    bandClip.clipping = true; bandGrp.clipped = true;

    // 제목 2단 (첫 토큰 크게 + 나머지 작게)
    var parts = _splitTitle(opt.title);
    var h1 = printL.textFrames.pointText([UX(24), UY(47)]);
    h1.contents = parts[0];
    var a1 = h1.textRange.characterAttributes;
    if (fonts.head) a1.textFont = fonts.head;
    a1.size = 27 * s; a1.tracking = 20; a1.fillColor = _hexToRGB("FFFFFF");
    if (parts[1]) {
      var rule = printL.pathItems.rectangle(UY(26), UX(153), 1.6 * s, 26 * s);
      rule.stroked = false; rule.filled = true; rule.fillColor = paper; rule.opacity = 85;
      var h2 = printL.textFrames.pointText([UX(24), UY(70)]);
      h2.contents = parts[1];
      var a2 = h2.textRange.characterAttributes;
      if (fonts.date) a2.textFont = fonts.date;
      a2.size = 12.5 * s; a2.tracking = 180; a2.fillColor = paper;
    }

    _photoInRoundRect(doc, printL, photoFile, UX, UY, s, opt.embed, paper);

    var dTf = printL.textFrames.pointText([UX(130), UY(317)]);
    dTf.contents = opt.dateText;
    var da = dTf.textRange.characterAttributes;
    if (fonts.date) da.textFont = fonts.date;
    da.size = 12.5 * s; da.tracking = 200; da.fillColor = paper;
    try { dTf.textRange.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}
    _dot(printL, UX(36), UY(312), 1.8 * s, paper);
    _dot(printL, UX(43), UY(312), 1.8 * s, paper);

    var cut = kissL.pathItems.roundedRectangle(
      UY(0) + Math.max(0, outPt), UX(0) - Math.max(0, outPt),
      260 * s + 2 * Math.max(0, outPt), 340 * s + 2 * Math.max(0, outPt),
      22 * s + Math.max(0, outPt), 22 * s + Math.max(0, outPt));
    cut.filled = false;
    _forceCutContourStroke(cut, cutSpot);
  }

  // ── 07 물결 (H2) ─────────────────────────────────────────────
  function _drawWavy(doc, printL, kissL, cutSpot, fonts, opt, photoFile, UX, UY, s, outPt, bg, paper, ink) {
    var W = WAVY;
    var bleed = 0;
    if (outPt < 0) bleed = -outPt;

    var body = _wavyPath(printL, UX, UY, s, W.a * s + bleed, W.b * s + bleed);
    body.filled = true; body.fillColor = paper;
    body.stroked = true; body.strokeColor = bg; body.strokeWidth = W.stroke * s;

    _photoInEgg(doc, printL, photoFile, UX(W.cx), UY(W.photoCy),
                W.photoRx * s, W.photoRy * s, W.photoEggK, opt.embed);

    // 액센트 호는 달걀 최대폭 바깥으로 등간격
    var aRx = (W.photoRx * (1 + W.photoEggK) + W.accOut) * s, aRy = (W.photoRy + W.accOut) * s;
    var accL = _ellipseArc(printL, UX(W.cx), UY(W.photoCy), aRx, aRy, 180 - W.accSpan, 180 + W.accSpan);
    accL.stroked = true; accL.strokeColor = bg; accL.strokeWidth = W.accStroke * s; accL.filled = false;
    var accR = _ellipseArc(printL, UX(W.cx), UY(W.photoCy), aRx, aRy, -W.accSpan, W.accSpan);
    accR.stroked = true; accR.strokeColor = bg; accR.strokeWidth = W.accStroke * s; accR.filled = false;

    var titleFs = fonts.titleFs || W.titleFs;
    var tPath = _ellipseArc(printL, UX(W.cx), UY(W.titleCy), W.titleRx * s, W.titleRy * s, W.titleA0, W.titleA1);
    _pathTextOn(tPath, opt.title, fonts.title, titleFs * s, W.titleTrack, ink, printL);

    // 날짜 — 완만한 원호 (타원 호 금지: 헤더 주석 함정 참조)
    var dateFs = fonts.dateFs || W.dateFs;
    var dPath = _ellipseArc(printL, UX(W.cx), UY(W.dateCy), W.dateR * s, W.dateR * s, W.dateA0, W.dateA1);
    _pathTextOn(dPath, opt.dateText, fonts.date, dateFs * s, W.dateTrack, ink, printL);
    // 날짜 앞 점은 2026-08-28 제거 (사용자 지정). 되살리지 말 것.

    var cut = _wavyPath(kissL, UX, UY, s, W.a * s + Math.max(0, outPt), W.b * s + Math.max(0, outPt));
    cut.filled = false;
    _forceCutContourStroke(cut, cutSpot);
  }


  // ═══════════════════════════════════════════════════════
  //  SHAPE PRIMITIVES (웹 좌표계 → UX/UY 사상)
  // ═══════════════════════════════════════════════════════
  function _strokeHalf(shape, s) {
    if (shape.key === "WAVY") return WAVY.stroke * s / 2;
    if (shape.key === "ARCH") return 2 * s / 2;
    return 0;   // CIRCLE·CARD 는 외곽에 스트로크가 없다
  }

  function _rad(d) { return d * Math.PI / 180; }

  function _circle(layer, cx, cy, r, fill, strokeCol, strokeW) {
    var p = layer.pathItems.ellipse(cy + r, cx - r, 2 * r, 2 * r);
    if (fill) { p.filled = true; p.fillColor = fill; } else { p.filled = false; }
    if (strokeCol) { p.stroked = true; p.strokeColor = strokeCol; p.strokeWidth = strokeW; }
    else { p.stroked = false; }
    return p;
  }

  function _circlePath(layer, cx, cy, r) {
    var p = layer.pathItems.ellipse(cy + r, cx - r, 2 * r, 2 * r);
    p.filled = false; p.stroked = false;
    return p;
  }

  function _dot(layer, cx, cy, r, col) {
    return _circle(layer, cx, cy, r, col, null, 0);
  }

  // 타원 호 — AI 좌표(y-up), 웹 각도 규약(θ 증가 = 반시계, 12시=90°).
  // 웹 렌더의 epath 와 같은 진행 방향이 되도록 anchor 를 a0→a1 로 찍는다.
  function _ellipseArc(layer, cx, cy, rx, ry, a0, a1) {
    var segs = Math.ceil(Math.abs(a1 - a0) / 45);
    if (segs < 2) segs = 2;
    var da = (a1 - a0) / segs;
    var h = (4 / 3) * Math.tan(_rad(da) / 4);
    var p = layer.pathItems.add();
    p.filled = false; p.stroked = false;
    for (var i = 0; i <= segs; i++) {
      var a = _rad(a0 + da * i);
      var px = cx + rx * Math.cos(a);
      var py = cy + ry * Math.sin(a);
      var tx = -rx * Math.sin(a);       // dP/dθ
      var ty =  ry * Math.cos(a);
      var pp = p.pathPoints.add();
      pp.anchor         = [px, py];
      pp.leftDirection  = [px - h * tx, py - h * ty];
      pp.rightDirection = [px + h * tx, py + h * ty];
      pp.pointType = PointType.SMOOTH;
    }
    p.closed = false;
    return p;
  }

  // WAVY 외곽 — H2 공식. 5° 간격 anchor + 해석적 접선 핸들 (72 노드, Summa 안전권)
  function _wavyPath(layer, UX, UY, s, A, B) {
    var W = WAVY;
    var cx = UX(W.cx), cy = UY(W.cy);
    var N = 72, dth = 2 * Math.PI / N, h = dth / 3;
    var p = layer.pathItems.add();
    p.stroked = false; p.filled = false;
    for (var i = 0; i < N; i++) {
      var th = i * dth;
      var w  = W.amp * Math.sin(W.k * th + W.ph0) * (1 + W.mod * Math.sin(2 * th + W.ph1));
      var dw = W.amp * (W.k * Math.cos(W.k * th + W.ph0) * (1 + W.mod * Math.sin(2 * th + W.ph1)) +
                        Math.sin(W.k * th + W.ph0) * 2 * W.mod * Math.cos(2 * th + W.ph1));
      // 달걀 변조 — 여기서는 sin>0 이 아래쪽이라 (1 − k·sin) 이 위를 넓힌다
      var m  = 1 - W.eggK * Math.sin(th);
      var dm = -W.eggK * Math.cos(th);
      // 웹 y-down 을 AI y-up 으로: y 성분 부호 반전
      var px = cx + A * Math.cos(th) * (1 + w) * m;
      var py = cy - B * Math.sin(th) * (1 + w);
      var dx = A * ((-Math.sin(th) * (1 + w) + Math.cos(th) * dw) * m +
                    Math.cos(th) * (1 + w) * dm);
      var dy = -B * (Math.cos(th) * (1 + w) + Math.sin(th) * dw);
      var pp = p.pathPoints.add();
      pp.anchor         = [px, py];
      pp.leftDirection  = [px - h * dx, py - h * dy];
      pp.rightDirection = [px + h * dx, py + h * dy];
      pp.pointType = PointType.SMOOTH;
    }
    p.closed = true;
    return p;
  }

  // 02 아치 외곽 — 좌하 → 좌상 → 상단 반원 → 우상 → 우하, 닫음
  function _archPath(layer, UX, UY, s, xIn, cyTop, r, yBot, grow) {
    var L = UX(xIn) - grow, R = UX(260 - xIn) + grow;
    var T = UY(cyTop), B = UY(yBot) - grow;
    var cx = (L + R) / 2, rr = (R - L) / 2;
    var h = (4 / 3) * Math.tan(Math.PI / 8);   // 90° 세그먼트 핸들
    var p = layer.pathItems.add();
    p.stroked = false; p.filled = false;
    function pt(ax, ay, lx, ly, rx2, ry2) {
      var pp = p.pathPoints.add();
      pp.anchor = [ax, ay]; pp.leftDirection = [lx, ly]; pp.rightDirection = [rx2, ry2];
      pp.pointType = PointType.CORNER;
      return pp;
    }
    pt(L, B, L, B, L, B);
    pt(L, T, L, T, L, T + h * rr);                       // 좌상 (위로 반원 시작)
    pt(cx, T + rr, cx - h * rr, T + rr, cx + h * rr, T + rr);  // 정점
    pt(R, T, R, T + h * rr, R, T);                       // 우상
    pt(R, B, R, B, R, B);
    p.closed = true;
    return p;
  }

  // 02 제목 패스 — 좌 세로 상행 + 상단 반원 + 우 세로 하행 (열린 패스)
  function _archTextPath(layer, UX, UY, s, xIn, yLow, cyTop, r) {
    var L = UX(xIn), R = UX(260 - xIn);
    var T = UY(cyTop), Y = UY(yLow);
    var cx = (L + R) / 2, rr = (R - L) / 2;
    var h = (4 / 3) * Math.tan(Math.PI / 8);
    var p = layer.pathItems.add();
    p.stroked = false; p.filled = false;
    function pt(ax, ay, lx, ly, rx2, ry2) {
      var pp = p.pathPoints.add();
      pp.anchor = [ax, ay]; pp.leftDirection = [lx, ly]; pp.rightDirection = [rx2, ry2];
      pp.pointType = PointType.CORNER;
    }
    pt(L, Y, L, Y, L, Y);
    pt(L, T, L, T, L, T + h * rr);
    pt(cx, T + rr, cx - h * rr, T + rr, cx + h * rr, T + rr);
    pt(R, T, R, T + h * rr, R, T);
    pt(R, Y, R, Y, R, Y);
    p.closed = false;
    return p;
  }

  // 곡선 텍스트 — 자동 축소 포함
  function _pathTextOn(path, contents, font, fontSize, tracking, fillCol, layer) {
    var fs = _fitFontSize(layer, contents, font, fontSize, tracking, _pathLen(path));
    var tf = layer.textFrames.pathText(path);
    tf.contents = contents;
    var a = tf.textRange.characterAttributes;
    if (font) a.textFont = font;
    a.size = fs;
    a.tracking = tracking;
    a.fillColor = fillCol;
    a.strokeWeight = 0;
    try { tf.textRange.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}
    return tf;
  }

  function _fitFontSize(layer, contents, font, fontSize, tracking, pathLen) {
    var probe = layer.textFrames.pointText([0, -9999]);
    probe.contents = contents;
    var pa = probe.textRange.characterAttributes;
    if (font) pa.textFont = font;
    pa.size = fontSize;
    pa.tracking = tracking;
    var w = probe.geometricBounds[2] - probe.geometricBounds[0];
    probe.remove();
    var maxW = pathLen * 0.94;
    if (w > maxW && w > 0) return Math.max(4, fontSize * maxW / w);
    return fontSize;
  }

  function _pathLen(path) {
    try { return path.length; } catch (e) {}
    // fallback: anchor 폴리라인 근사
    var L = 0, pts = path.pathPoints;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1].anchor, b = pts[i].anchor;
      L += Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
    }
    return L;
  }


  // ═══════════════════════════════════════════════════════
  //  PHOTO PLACEMENT — 원본을 창에 cover-fit 후 클립
  // ═══════════════════════════════════════════════════════
  function _placeCover(doc, layer, photoFile, winL, winT, winW, winH, embed) {
    doc.activeLayer = layer;
    var ph = layer.placedItems.add();
    ph.file = photoFile;
    var iw = ph.width, ih = ph.height;
    var sc = Math.max(winW / iw, winH / ih);
    ph.width = iw * sc; ph.height = ih * sc;
    ph.left = winL - (ph.width - winW) / 2;
    ph.top  = winT + (ph.height - winH) / 2;
    var art = ph;
    if (embed) {
      var pL = ph.left, pT = ph.top, pW = ph.width, pH = ph.height;
      ph.embed();
      art = _findEmbeddedNear(layer, pL, pT, pW, pH);
      if (!art) throw new Error("embed 재탐색 실패 (" + photoFile.name + ")");
    }
    return art;
  }

  function _clipInto(layer, art, clipPath) {
    var grp = layer.groupItems.add();
    art.move(grp, ElementPlacement.PLACEATBEGINNING);
    clipPath.move(grp, ElementPlacement.PLACEATBEGINNING);
    clipPath.clipping = true;
    grp.clipped = true;
    return grp;
  }

  function _photoInCircle(doc, layer, photoFile, cx, cy, r, embed) {
    return _photoInEllipse(doc, layer, photoFile, cx, cy, r, r, embed);
  }

  // 달걀형 패스 — 위가 넓고 아래가 좁다. k=0 이면 정확히 타원.
  function _eggPath(layer, cx, cy, rx, ry, k) {
    var N = 64, dt = 2 * Math.PI / N, h = dt / 3;
    var p = layer.pathItems.add();
    p.filled = false; p.stroked = false;
    for (var i = 0; i < N; i++) {
      var t = i * dt;
      var m  = 1 + k * Math.sin(t);
      var dm = k * Math.cos(t);
      var x  = cx + rx * Math.cos(t) * m;
      var y  = cy + ry * Math.sin(t);
      var dx = rx * (-Math.sin(t) * m + Math.cos(t) * dm);
      var dy = ry * Math.cos(t);
      var pp = p.pathPoints.add();
      pp.anchor         = [x, y];
      pp.leftDirection  = [x - h * dx, y - h * dy];
      pp.rightDirection = [x + h * dx, y + h * dy];
      pp.pointType = PointType.SMOOTH;
    }
    p.closed = true;
    return p;
  }

  function _photoInEgg(doc, layer, photoFile, cx, cy, rx, ry, k, embed) {
    var wMax = rx * (1 + k);
    var art = _placeCover(doc, layer, photoFile, cx - wMax, cy + ry, 2 * wMax, 2 * ry, embed);
    var clip = _eggPath(layer, cx, cy, rx, ry, k);
    return _clipInto(layer, art, clip);
  }

  function _photoInEllipse(doc, layer, photoFile, cx, cy, rx, ry, embed) {
    var art = _placeCover(doc, layer, photoFile, cx - rx, cy + ry, 2 * rx, 2 * ry, embed);
    var clip = layer.pathItems.ellipse(cy + ry, cx - rx, 2 * rx, 2 * ry);
    clip.filled = false; clip.stroked = false;
    return _clipInto(layer, art, clip);
  }

  function _photoInArch(doc, layer, photoFile, UX, UY, s, embed, borderCol) {
    // 창: x 42..218, 상단 반원 중심 y160 r88, 하단 y298
    var L = UX(42), R = UX(218), T = UY(72), B = UY(298);
    var art = _placeCover(doc, layer, photoFile, L, T, R - L, T - B, embed);
    var clip = _archWindowPath(layer, UX, UY);
    _clipInto(layer, art, clip);
    var frame = _archWindowPath(layer, UX, UY);
    frame.filled = false; frame.stroked = true; frame.strokeColor = borderCol; frame.strokeWidth = 1.5 * s;
    return frame;
  }

  function _archWindowPath(layer, UX, UY) {
    var L = UX(42), R = UX(218), T0 = UY(160), B = UY(298);
    var cx = (L + R) / 2, rr = (R - L) / 2;
    var h = (4 / 3) * Math.tan(Math.PI / 8);
    var p = layer.pathItems.add();
    p.stroked = false; p.filled = false;
    function pt(ax, ay, lx, ly, rx2, ry2) {
      var pp = p.pathPoints.add();
      pp.anchor = [ax, ay]; pp.leftDirection = [lx, ly]; pp.rightDirection = [rx2, ry2];
      pp.pointType = PointType.CORNER;
    }
    pt(L, B, L, B, L, B);
    pt(L, T0, L, T0, L, T0 + h * rr);
    pt(cx, T0 + rr, cx - h * rr, T0 + rr, cx + h * rr, T0 + rr);
    pt(R, T0, R, T0 + h * rr, R, T0);
    pt(R, B, R, B, R, B);
    p.closed = true;
    return p;
  }

  function _photoInRoundRect(doc, layer, photoFile, UX, UY, s, embed, borderCol) {
    var L = UX(24), T = UY(88), W = 212 * s, H = 176 * s;
    var art = _placeCover(doc, layer, photoFile, L, T, W, H, embed);
    var clip = layer.pathItems.roundedRectangle(T, L, W, H, 13 * s, 13 * s);
    clip.stroked = false; clip.filled = false;
    _clipInto(layer, art, clip);
    var frame = layer.pathItems.roundedRectangle(T, L, W, H, 13 * s, 13 * s);
    frame.filled = false; frame.stroked = true; frame.strokeColor = borderCol; frame.strokeWidth = 3 * s;
    return frame;
  }

  function _findEmbeddedNear(layer, L, T, W, H) {
    for (var i = 0; i < layer.groupItems.length; i++) {
      var g = layer.groupItems[i];
      if (g.clipped) continue;
      if (_boundsMatch(g.geometricBounds, L, T, W, H)) return g;
    }
    for (var k = 0; k < layer.rasterItems.length; k++) {
      if (_boundsMatch(layer.rasterItems[k].geometricBounds, L, T, W, H)) return layer.rasterItems[k];
    }
    return null;
  }

  function _boundsMatch(b, L, T, W, H) {
    var w = b[2] - b[0], h = b[1] - b[3];
    return Math.abs(b[0] - L) < 1 && Math.abs(b[1] - T) < 1 &&
           Math.abs(w - W) < 1 && Math.abs(h - H) < 1;
  }

  function _splitTitle(t) {
    var i = t.indexOf(" ");
    if (i < 0) return [t, ""];
    return [t.substring(0, i), t.substring(i + 1)];
  }


  // ═══════════════════════════════════════════════════════
  //  CUTCONTOUR (운영 규약 — M=100 SPOT, 0.25pt)
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
  //  FONT / TEXT HELPERS
  // ═══════════════════════════════════════════════════════
  function _resolveFont(cands) {
    for (var i = 0; i < cands.length; i++) {
      try { return app.textFonts.getByName(cands[i]); } catch (e) {}
    }
    return null;
  }

  function _resolveHangulFont() {
    var c = ["TTOmniGothicL", "AppleSDGothicNeo-Bold", "AppleSDGothicNeo-SemiBold", "AppleGothic"];
    for (var i = 0; i < c.length; i++) {
      try { return app.textFonts.getByName(c[i]); } catch (e) {}
    }
    return null;
  }

  function _applyHangulFontOverride(textFrame, hangulFont) {
    if (!hangulFont) return;
    var t = textFrame.contents;
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      if ((c >= 0xAC00 && c <= 0xD7AF) || (c >= 0x1100 && c <= 0x11FF) || (c >= 0x3130 && c <= 0x318F)) {
        try { textFrame.textRange.characters[i].textFont = hangulFont; } catch (e) {}
      }
    }
  }

  function _composeHangulNFC(t) {
    if (!t) return t;
    var out = "", i = 0;
    while (i < t.length) {
      var L = t.charCodeAt(i);
      if (L >= 0x1100 && L <= 0x1112 && i + 1 < t.length) {
        var V = t.charCodeAt(i + 1);
        if (V >= 0x1161 && V <= 0x1175) {
          var T = 0, step = 2;
          if (i + 2 < t.length) {
            var Tc = t.charCodeAt(i + 2);
            if (Tc >= 0x11A8 && Tc <= 0x11C2) { T = Tc - 0x11A7; step = 3; }
          }
          out += String.fromCharCode(0xAC00 + (L - 0x1100) * 21 * 28 + (V - 0x1161) * 28 + T);
          i += step; continue;
        }
      }
      out += t.charAt(i); i++;
    }
    return out;
  }

  function _decodeName(t) {
    try { return _composeHangulNFC(decodeURI(t)); } catch (e) { return _composeHangulNFC(t); }
  }


  // ═══════════════════════════════════════════════════════
  //  FILE / SAVE HELPERS
  // ═══════════════════════════════════════════════════════
  function _collectPhotos(folder) {
    var files = folder.getFiles(function (f) { return f instanceof File && PHOTO_EXT.test(f.name); });
    var heics = folder.getFiles(function (f) { return f instanceof File && /\.heic$/i.test(f.name); });
    files.sort(function (a, b) {
      var an = a.name.toLowerCase(), bn = b.name.toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
    return { files: files, heic: heics.length };
  }

  function _resolveOutputFolder(inputFolder) {
    var out;
    if (inputFolder.name.toLowerCase() === "01_original" && inputFolder.parent) {
      out = new Folder(inputFolder.parent.fsName + "/03_output");
    } else {
      out = new Folder(inputFolder.fsName + "/03_output");
    }
    if (!out.exists) out.create();
    return out;
  }

  function _deriveDefaultCustomerName(folder) {
    var f = folder;
    if (f.name.toLowerCase() === "01_original" && f.parent) f = f.parent;
    return _decodeName(f.name);
  }

  function _timestamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return "" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
           "_" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function _todayStr() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function _sizeTag(mm) {
    var inch = mm / 25.4;
    return inch.toFixed(2).replace(/\.?0+$/, "") + "in";
  }

  function _saveAi(doc, file) {
    var opts = new IllustratorSaveOptions();
    opts.compatibility = Compatibility.ILLUSTRATOR24;
    opts.pdfCompatible = true;
    opts.embedICCProfile = true;
    doc.saveAs(file, opts);
  }

  function _hexToRGB(hex) {
    var c = new RGBColor();
    c.red   = parseInt(hex.substring(0, 2), 16);
    c.green = parseInt(hex.substring(2, 4), 16);
    c.blue  = parseInt(hex.substring(4, 6), 16);
    return c;
  }

  function _trim(t) { return String(t).replace(/^\s+|\s+$/g, ""); }

  function _num(t, d) {
    var v = parseFloat(t);
    return isNaN(v) ? d : v;
  }


  // ═══════════════════════════════════════════════════════
  //  BRAND TEMPLATE (기존 스크립트 공통)
  // ═══════════════════════════════════════════════════════
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

  function _findInfoPath(doc, pathName) {
    var infoLayer = null;
    for (var i = 0; i < doc.layers.length; i++) {
      if (doc.layers[i].name.toLowerCase() === "info") { infoLayer = doc.layers[i]; break; }
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

  function _drawHeader(opt, shape, headerText) {
    var line1 = _composeHangulNFC(opt.customerName || "—") +
                " • Label " + shape.key + " • " + _sizeTag(opt.sizeMm) + " / " + opt.sizeMm + "mm";
    var line2 = opt.photos.length + " photo(s)";
    var line3 = "date: " + (opt.orderDate || _todayStr());
    headerText.contents = line1 + "\r" + line2 + "\r" + line3;
    _applyHangulFontOverride(headerText, _resolveHangulFont());
  }


  // ═══════════════════════════════════════════════════════
  //  DIALOG
  // ═══════════════════════════════════════════════════════
  // 주입 실행 (테스트·주문 보드) — 다이얼로그를 건너뛴다.
  // $.global.__EVERSTORY_LABEL_OPTS__ / __EVERSTORY_LAUNCH__ 는 consume-once.
  function _launchFolder() {
    var payload = null;
    try { payload = $.global.__EVERSTORY_LAUNCH__; } catch (e) { return null; }
    try { $.global.__EVERSTORY_LAUNCH__ = undefined; } catch (e2) {}
    if (!payload) return null;
    var f = new Folder(String(payload));
    if (f.exists) return f;
    return null;
  }

  function _report(msg) {
    if (QUIET) {
      try { $.global.__EVERSTORY_LABEL_RESULT__ = msg; } catch (e) {}
      return;
    }
    alert(msg);
  }

  function _consumePreset(collect) {
    var raw = null;
    try { raw = $.global.__EVERSTORY_LABEL_OPTS__; } catch (eG) { return null; }
    try { $.global.__EVERSTORY_LABEL_OPTS__ = undefined; } catch (eC) {}
    if (!raw) return null;
    QUIET = true;

    var chosen = [];
    if (raw.photoIndexes) {
      for (var i = 0; i < raw.photoIndexes.length; i++) {
        var f = collect.files[raw.photoIndexes[i]];
        if (f) chosen.push(f);
      }
    }
    if (chosen.length === 0 && collect.files.length > 0) chosen.push(collect.files[0]);

    var shapeIdx = SHAPE_DEFAULT;
    if (raw.shape) {
      for (var k = 0; k < SHAPES.length; k++) {
        if (SHAPES[k].key === raw.shape) { shapeIdx = k; break; }
      }
    }
    var cutIdx = CUT_DEFAULT_INDEX;
    if (raw.cutIdx != null) cutIdx = raw.cutIdx;
    var sizeMm = SIZE_MM[SIZE_DEFAULT];
    if (raw.sizeMm) sizeMm = raw.sizeMm;
    var title = DEF_TITLE;
    if (raw.title) title = raw.title;
    if (raw.upper !== false) title = title.toUpperCase();
    var dateText = DEF_DATE;
    if (raw.dateText != null) dateText = raw.dateText;
    var paletteIdx = 0;
    if (raw.paletteIdx != null) paletteIdx = raw.paletteIdx;
    var titleFontIdx = TITLE_FONT_DEFAULT;
    if (raw.titleFontIdx != null) titleFontIdx = raw.titleFontIdx;

    return {
      title:        title,
      dateText:     dateText,
      shapeIdx:     shapeIdx,
      sizeMm:       sizeMm,
      paletteIdx:   paletteIdx,
      titleFontIdx: titleFontIdx,
      cutIdx:       cutIdx,
      cutMm:        CUT_VALUES[cutIdx],
      embed:        (raw.embed !== false),
      customerName: (raw.customerName != null ? raw.customerName : ""),
      orderDate:    (raw.orderDate != null ? raw.orderDate : _todayStr()),
      photos:       chosen,
      heic:         collect.heic
    };
  }

  function _showDialog(collect, folder) {
    var preset = _consumePreset(collect);
    if (preset) return preset;
    var photos = collect.files;
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 16;
    dlg.spacing = 10;

    // ── 텍스트 ──
    var pT = dlg.add("panel", undefined, "텍스트 (시트 전체 공통)");
    pT.orientation = "column"; pT.alignChildren = "fill";
    pT.margins = [12, 16, 12, 12]; pT.spacing = 6;
    var gT1 = pT.add("group");
    gT1.add("statictext", undefined, "제목        ");
    var fTitle = gT1.add("edittext", undefined, DEF_TITLE);
    fTitle.preferredSize = [280, 22];
    var upperChk = gT1.add("checkbox", undefined, "대문자");
    upperChk.value = true;
    var gT2 = pT.add("group");
    gT2.add("statictext", undefined, "아랫줄     ");
    var fDate2 = gT2.add("edittext", undefined, DEF_DATE);
    fDate2.preferredSize = [280, 22];

    // ── 디자인 ──
    var pD = dlg.add("panel", undefined, "디자인");
    pD.orientation = "column"; pD.alignChildren = "fill";
    pD.margins = [12, 16, 12, 12]; pD.spacing = 6;
    var gS = pD.add("group");
    gS.add("statictext", undefined, "형태        ");
    var shapeDd = gS.add("dropdownlist", undefined, _shapeLabels());
    shapeDd.selection = SHAPE_DEFAULT; shapeDd.preferredSize = [300, 24];
    var gZ = pD.add("group");
    gZ.add("statictext", undefined, "사이즈     ");
    var sizeDd = gZ.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDd.selection = SIZE_DEFAULT; sizeDd.preferredSize = [200, 24];
    gZ.add("statictext", undefined, "긴 변 기준");
    var gF = pD.add("group");
    gF.add("statictext", undefined, "제목 서체 ");
    var tfDd = gF.add("dropdownlist", undefined, _titleFontLabels());
    tfDd.selection = TITLE_FONT_DEFAULT; tfDd.preferredSize = [280, 24];

    var gP = pD.add("group");
    gP.add("statictext", undefined, "팔레트     ");
    var palDd = gP.add("dropdownlist", undefined, PALETTE_OPTIONS);
    palDd.selection = 0; palDd.preferredSize = [220, 24];

    // ── 제작 ──
    var pM = dlg.add("panel", undefined, "제작");
    pM.orientation = "column"; pM.alignChildren = "fill";
    pM.margins = [12, 16, 12, 12]; pM.spacing = 6;
    var gC = pM.add("group");
    gC.add("statictext", undefined, "칼선        ");
    var cutRadios = [];
    for (var ci = 0; ci < CUT_OPTIONS.length; ci++) {
      cutRadios.push(gC.add("radiobutton", undefined, CUT_OPTIONS[ci]));
    }
    cutRadios[CUT_DEFAULT_INDEX].value = true;
    var gN = pM.add("group");
    gN.add("statictext", undefined, "고객 이름 ");
    var fName = gN.add("edittext", undefined, _deriveDefaultCustomerName(folder));
    fName.preferredSize = [160, 22];
    gN.add("statictext", undefined, "날짜");
    var fODate = gN.add("edittext", undefined, _todayStr());
    fODate.preferredSize = [100, 22];
    var embedChk = pM.add("checkbox", undefined, "사진 embed (해제 시 linked — 빠른 확인용)");
    embedChk.value = true;

    // ── 사진 ──
    var pP = dlg.add("panel", undefined, "사용할 사진 (multi-select)" +
      (collect.heic > 0 ? ("  —  ⚠ HEIC " + collect.heic + "장 제외됨") : ""));
    pP.orientation = "column"; pP.alignChildren = "fill";
    pP.margins = [12, 16, 12, 12]; pP.spacing = 6;
    var items = [];
    for (var i = 0; i < photos.length; i++) items.push(_decodeName(photos[i].name));
    var lb = pP.add("listbox", undefined, items, { multiselect: true });
    lb.preferredSize = [360, 140];
    lb.selection = 0;   // 기본 = 첫 번째 하나 (ring.jsx 와 동일 규약)

    var hint = dlg.add("statictext", undefined,
      "원본 사진을 창에 cover-fit 합니다 — 얼굴이 중앙·밝은 배경인 사진이 좋습니다. 슬롯은 round-robin.");
    try {
      hint.graphics.foregroundColor =
        hint.graphics.newPen(hint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45], 1);
    } catch (eh) {}

    var btns = dlg.add("group"); btns.alignment = "right"; btns.spacing = 10;
    btns.add("button", undefined, "취소", { name: "cancel" });
    var ok = btns.add("button", undefined, "생성", { name: "ok" });
    ok.active = true;

    ok.onClick = function () {
      if (!lb.selection || lb.selection.length === 0) {
        alert("사진을 최소 1장 선택하세요.");
        return;
      }
      if (!_trim(fTitle.text)) {
        alert("제목을 입력하세요.");
        return;
      }
      dlg.close(1);
    };

    if (dlg.show() !== 1) return null;

    var sel = lb.selection;
    if (sel.length == null) sel = [sel];
    var chosen = [];
    for (var j = 0; j < sel.length; j++) chosen.push(photos[sel[j].index]);

    var cutIdx = CUT_DEFAULT_INDEX;
    for (var cr = 0; cr < cutRadios.length; cr++) {
      if (cutRadios[cr].value) { cutIdx = cr; break; }
    }

    var title = _trim(fTitle.text);
    if (upperChk.value) title = title.toUpperCase();

    return {
      title:        title,
      dateText:     _trim(fDate2.text),
      shapeIdx:     shapeDd.selection.index,
      sizeMm:       SIZE_MM[sizeDd.selection.index],
      paletteIdx:   palDd.selection.index,
      titleFontIdx: tfDd.selection.index,
      cutIdx:       cutIdx,
      cutMm:        CUT_VALUES[cutIdx],
      embed:        embedChk.value,
      customerName: _trim(fName.text),
      orderDate:    _trim(fODate.text),
      photos:       chosen,
      heic:         collect.heic
    };
  }

  function _titleFontLabels() {
    var out = [];
    for (var i = 0; i < TITLE_FONTS.length; i++) out.push(TITLE_FONTS[i].label);
    return out;
  }

  function _shapeLabels() {
    var out = [];
    for (var i = 0; i < SHAPES.length; i++) out.push(SHAPES[i].label);
    return out;
  }

})();
