// ═══════════════════════════════════════════════════════════════
//  Everstory Alphabet Frame 시트 — PoC (프레임 도형 테스트)
//
//  레퍼런스: 글자 하나가 장식 도형(꽃/아치/별/하트/티켓…) 안에 앉고,
//  글자에는 먹 키라인이 붙는 알파벳 스티커.
//
//  Everstory_calligraphy.jsx 와의 차이:
//   · 캘리는 배경이 **글자 모양을 부풀린 것**(Offset Path). 여기는 독립된
//     **기하 프레임 도형**이고 글자는 그 안쪽 안전영역에 맞춰 들어간다.
//   · 문구가 아니라 글자 1개 = 유닛 1개라 shelf 가 아니라 **균일 그리드**.
//
//  **칼선 = 인쇄된 가장자리 그대로, 여백 0** (2026-08-20 확정).
//  흰 테두리를 스크립트가 만들지 않는다 — 사용자가 나중에 Offset Path 로
//  직접 준다. 이름 스티커와 같은 규약이다 ([[project_withname_halo_bug]]).
//  대신 **그리드 간격을 미리 벌려둔다** — 나중에 오프셋을 주면 칼선이
//  그만큼 바깥으로 자라므로, 간격 = 2 × (나중에 줄 여백) + 최소 여유.
//
//  칼선은 Offset Path 가 아니라 **같은 프레임을 키라인 두께만큼 크게 다시
//  그려서** 만든다. 실측 비교(2026-08-20): Offset Path 는 round join 때문에
//  별 12꼭지가 통째로 뭉툭한 덩어리가 되고 티켓 노치가 거의 사라진다.
//  도형 재생성은 모양을 그대로 지킨다.
//
//  함정 (calligraphy/with_name 에서 실측 — 되돌리지 말 것):
//   · 글자 키라인은 **스트로크**로 준다. 오프셋 도형으로 주면 compound 를
//     풀어 union 해야 하는데 그러면 A·O·P 의 속구멍이 메워져 글자가 뭉개진다.
//   · 프레임 도형은 bbox 기준으로 정규화해야 한다 (_fitFrame). 폴라 도형은
//     최대 반지름이 대각선에 오는 경우가 많아 정규화 없이 두면 한 시트에서
//     크기가 제각각으로 보인다 (물결사각 89%, 블롭 80%, 하트 78%).
//   · 크기 실측은 아웃라인 변환 후에. TextFrame.geometricBounds 는 글리프가
//     아니라 폰트 메트릭 박스다.
//   · createOutline() 은 원본 TextFrame 을 소모한다 — 재사용 금지.
//   · 중첩 삼항은 ExtendScript 에서 틀린 분기를 탄다 — if/else 로 쓸 것.
//   · var 테이블은 호이스팅 안 됨. 메인 플로우보다 위에 둘 것.
//     (function 선언은 호이스팅되므로 FRAME_DEFS 가 빌더를 참조해도 된다.)
//
//  사용: File → Scripts → Other Script → Everstory_alphabet.jsx
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "alphabet frames PoC v1";
  var MM_TO_PT = 2.834645;
  var TEMPLATE_NAME = "template_cutout_v2.ait";
  var BODY_PADDING_MM = 2;
  var GAP_MIN_MM = 1;           // 오프셋 후에도 칼선끼리 남길 최소 여유

  var PROBE_SIZE_PT = 200;      // 글자 실측용 기준 사이즈
  var KAPPA = 0.5522847498;     // 원호 bezier 근사 계수
  var POLAR_SAMPLES = 72;       // 폴라 프레임 분할 수 (칼선 노드 수와 직결)
  // 심볼 라이브러리 파일명. templates/ 에 저장해 Symbols 패널 →
  // Open Symbol Library → Other Library 로 열어 쓴다.
  var LIBRARY_NAME = "alphabet_library_v1.ai";

  var TILT_MAX_DEG = 6;         // 글자 기울기 최대각 (안전영역 대각 여유 안)

  // ── 프레임 정의 ───────────────────────────────────────────────
  // build(container, D, cx, cy) — D×D 박스 안에 그린다 (일부는 박스보다 작다).
  // safe  = 글자가 들어갈 정사각 안전영역 한 변 / D
  // cyOff = 글자 세로 중심 보정 (D 대비 비율). 아치·하트처럼 쓸 수 있는
  //         공간이 위아래로 치우친 도형에서만 0 이 아니다.
  // safe 는 경계 샘플링으로 실측한 최대 내접정사각의 약 88% (2026-08-20) —
  // 글자가 프레임 가장자리에 닿지 않게 남긴 여유다.
  var FRAME_DEFS = [
    { key: "CIR", label: "원",         build: _frameCircle,  safe: 0.63, cyOff: 0.00 },
    { key: "RSQ", label: "둥근사각",   build: _frameRSquare, safe: 0.76, cyOff: 0.00 },
    { key: "SCA", label: "꽃 · 스캘럽", build: _frameScallop, safe: 0.63, cyOff: 0.00 },
    { key: "WAV", label: "물결사각",   build: _frameWave,    safe: 0.66, cyOff: 0.00 },
    { key: "BLB", label: "네잎 블롭",  build: _frameBlob,    safe: 0.66, cyOff: 0.00 },
    { key: "ARC", label: "아치",       build: _frameArch,    safe: 0.62, cyOff: -0.03 },
    { key: "TKT", label: "티켓",       build: _frameTicket,  safe: 0.68, cyOff: 0.00 },
    { key: "STR", label: "별",         build: _frameStar,    safe: 0.40, cyOff: 0.00 },
    { key: "HRT", label: "하트",       build: _frameHeart,   safe: 0.40, cyOff: 0.06 }
  ];

  // ── 팔레트 ────────────────────────────────────────────────────
  // 2026-08-20 브라우저 프리뷰로 3안(Butter Pop / Tonal / Clay) 비교 후 확정.
  // Clay(브랜드 클레이 전면)는 갈색이 뭉쳐 탁해서 폐기했다.
  // bg=프레임, ink=글자. 색 대비는 인쇄에서 글자가 읽히는 최소선을 지킬 것.
  //
  // **여백 0 + 키라인 없음이면 배경색이 곧 스티커의 유일한 가장자리다.**
  // 흰 종이에서 사라지므로 크림·아이보리 같은 near-white 를 배경에 쓰지 말 것
  // (2026-08-20 실측: FFF4E0 배경인 G·P·Y 가 시트에서 형태가 안 보였다).
  // 크림은 **글자색으로만** 쓴다.
  var PALETTE_OPTIONS = ["Tonal — 같은 색상환 2단계 (기본)", "Butter Pop — 밝고 선명"];

  // 2026 팝. 원색이 아니라 살짝 비켜간 고채도 — 버터/탠저린/핫핑크/애시드라임.
  var PALETTE_POP = [
    { bg: "FFD84D", ink: "FF5B8A" },   // 버터 / 핫핑크
    { bg: "FF7A3C", ink: "FFF4E0" },   // 탠저린 / 크림
    { bg: "6EC5E9", ink: "24304A" },   // 스카이 / 네이비
    { bg: "BEDB39", ink: "2F6B3C" },   // 애시드라임 / 딥그린
    { bg: "FF5B8A", ink: "FFF4E0" },   // 핫핑크 / 크림
    { bg: "B39DDB", ink: "FFF4E0" },   // 라일락 / 크림
    { bg: "5FD3B2", ink: "134E3F" },   // 민트 / 딥틸  (크림 배경은 흰 종이에서 사라져 교체)
    { bg: "24304A", ink: "FFD84D" },   // 네이비 / 버터
    { bg: "6EC5E9", ink: "FF5B8A" }    // 스카이 / 핫핑크
  ];

  // 스티커마다 같은 색상환의 밝은 값 + 어두운 값. 훨씬 조용하고 "디자인된" 느낌.
  // 사진 옆에 둘 때는 이쪽이 안 튄다.
  var PALETTE_TONAL = [
    { bg: "F3B9A0", ink: "A83C22" },   // 피치 / 테라코타
    { bg: "BCD4B4", ink: "2E5C38" },   // 세이지
    { bg: "CFC0E4", ink: "4B3579" },   // 라일락
    { bg: "F8D888", ink: "8C5E12" },   // 버터 / 앰버
    { bg: "B4D4E4", ink: "1F5470" },   // 스카이 / 틸
    { bg: "F0B8CA", ink: "9E2450" },   // 핑크
    { bg: "D8C4A6", ink: "6F5231" },   // 오트 (흰 종이에서 구분되도록 한 단계 진하게)
    { bg: "BFD8CE", ink: "2C5A50" },   // 유칼립투스
    { bg: "E8C9AC", ink: "854A24" }    // 클레이
  ];

  // 기본은 Tonal. 실사 비교 결과 세트로 훨씬 단단하고 keepsake 보이스에 맞는다
  // (2026-08-20). Butter Pop 은 더 팝하지만 "아이 알파벳"에 가깝다.
  var PALETTES = [PALETTE_TONAL, PALETTE_POP];

  var KEY_HEX = "231F1D";   // 글자·프레임 키라인 (브랜드 먹). 기본은 끔 — 아래 참조.

  // ── 서체 ─────────────────────────────────────────────────────
  // 2026-08-20 전면 교체. 레퍼런스의 Cooper Black 계열(Alfa Slab One)은
  // 2021–2023 Etsy 스티커 룩이라 뺐다.
  // 브라우저 프리뷰로 6종을 같은 프레임·같은 색에 얹어 비교한 결과:
  //  · Bagel Fat One — 부푼 버블. 2026 최강 신호. **사용자 선택(기본값)**.
  //    카운터(A·B·D 속구멍)가 좁으므로 완료 메시지의 "최소 카운터" 수치를
  //    반드시 확인할 것 — 0.35mm 밑이면 잉크가 번져 메워진다.
  //  · Shrikhand — 기울기 + 세리프 플레어. 카운터가 더 열려 있다.
  //  · Bakbak One — 넓고 열린 카운터. 가장 안전하고 잘 읽힌다.
  //  · Modak — 부푼 라운드. Bagel 과 같은 카운터 주의.
  //  · Rubik Bubbles — 가장자리가 거칠어 작은 사이즈에서 지저분하다. 뺐다.
  //  · Lilita One — 무난하지만 특징이 없다.
  // 전부 OFL (상업 사용 가능). 새로 설치했으면 Illustrator 재시작 필요.
  var FONT_OPTIONS = [
    { label: "Bagel Fat One — 부푼 버블 (기본)", cands: ["BagelFatOne-Regular", "BagelFatOne"] },
    { label: "Shrikhand — 기울기 + 플레어", cands: ["Shrikhand-Regular", "Shrikhand"] },
    { label: "Bakbak One — 와이드 청키 · 가장 잘 읽힘", cands: ["BakbakOne-Regular", "BakbakOne"] },
    { label: "Modak — 초통통 라운드", cands: ["Modak-Regular", "Modak"] },
    { label: "Lilita One — Cooper 계열 · 타이트", cands: ["LilitaOne-Regular", "LilitaOne"] },
    { label: "Archivo Black — 초굵은 그로테스크", cands: ["ArchivoBlack-Regular"] },
    { label: "Chewy — 통통한 손글씨", cands: ["Chewy-Regular"] }
  ];
  var FONT_DEFAULT_INDEX = 0;   // Bagel Fat One (사용자 선택 2026-08-20)

  var SIZE_OPTIONS = ["20mm", "25mm", "30mm", "35mm"];
  var SIZE_VALUES = [20, 25, 30, 35];
  var SIZE_DEFAULT_INDEX = 1;     // 25mm — A5 에 30칸 (A–Z 26자 + 여유 4)

  // 스크립트는 여백을 만들지 않는다. 이 값은 **그리드 간격 계산에만** 쓴다 —
  // 나중에 Offset Path 로 이만큼 주면 칼선이 그만큼 자라기 때문이다.
  var PLANNED_OPTIONS = ["0mm (붙여도 됨)", "1mm", "1.5mm", "2mm", "2.5mm"];
  var PLANNED_VALUES = [0, 1, 1.5, 2, 2.5];
  var PLANNED_DEFAULT_INDEX = 3;  // 2mm

  // 검정 키라인은 **기본 끔**. 서체를 바꾸는 것보다 이걸 빼는 게 훨씬 크게
  // 현재형으로 만든다 (2026-08-20 비교 확인). 레트로 룩이 필요할 때만 켤 것.
  var KEY_OPTIONS = ["없음 (기본)", "0.4mm", "0.6mm", "0.8mm"];
  var KEY_VALUES = [0, 0.4, 0.6, 0.8];
  var KEY_DEFAULT_INDEX = 0;

  var DEFAULT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  var FONT_INDEX_CACHE = {};
  var LETTER_MEASURE_CACHE = {};

  function C(r, g, b) { var c = new RGBColor(); c.red = r; c.green = g; c.blue = b; return c; }
  var INK = C(35, 31, 29);

  var testConfig = $.global.__EVERSTORY_ALPHABET_TEST__;

  function _fail(m) {
    if (testConfig) { testConfig.lastMessage = "실패: " + m; }
    else { alert(m); }
  }

  // ═════════ 입력 ═════════
  var options = null;
  if (testConfig && testConfig.options) { options = testConfig.options; }
  else { options = _showAlphaDialog(); }
  if (!options) return;

  var letters = [];
  var rawLetters = String(options.letters);
  for (var li = 0; li < rawLetters.length; li++) {
    var chRaw = rawLetters.charAt(li);
    if (chRaw === " " || chRaw === "\t" || chRaw === "\n" || chRaw === "\r") continue;
    letters.push(chRaw);
  }
  if (letters.length === 0) { _fail("글자가 없습니다."); return; }

  var font = _fontForIndex(options.fontIndex);
  if (!font) { _fail("서체를 찾을 수 없습니다: " + FONT_OPTIONS[options.fontIndex].label); return; }

  var outFolderPick = null;
  if (testConfig && testConfig.outputFolder) { outFolderPick = new Folder(testConfig.outputFolder); }
  else { outFolderPick = Folder.selectDialog("시트를 저장할 폴더 선택 (03_output 있으면 자동 사용)"); }
  if (!outFolderPick) return;

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
        headerRightText.typename + ").");
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
  var cellPt = options.sizeMm * MM_TO_PT;           // 유닛 = 인쇄되는 스티커 그 자체
  var keyPt = options.keyMm * MM_TO_PT;             // 글자 키라인 두께
  var frameStrokePt = 0;
  if (options.frameKeyline) frameStrokePt = keyPt * 0.75;

  // 칼선에 여백이 없으므로 나중에 Offset Path 를 주면 칼선이 바깥으로 자란다.
  // 그만큼 그리드 간격을 미리 벌려두지 않으면 오프셋한 칼선끼리 겹친다.
  var gapPt = (2 * options.plannedOffsetMm + GAP_MIN_MM) * MM_TO_PT;

  // 프레임 패스는 키라인 스트로크가 바깥으로 절반 나가는 만큼 안쪽에 둔다 —
  // 그래야 인쇄된 가시 가장자리가 정확히 셀 크기가 된다.
  var framePt = cellPt - frameStrokePt;
  var cutPt = cellPt;                                // 칼선 = 가시 가장자리 (여백 0)
  if (framePt <= 0) {
    _fail("키라인이 유닛 크기보다 큽니다.");
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose1) {}
    return;
  }

  var bb = bodyPath.geometricBounds;
  var bL = bb[0], bT = bb[1], bR = bb[2], bB = bb[3];
  var binW = (bR - bL) - 2 * padPt;
  var binH = (bT - bB) - 2 * padPt;
  if (binW <= 0 || binH <= 0) {
    _fail("info > body 영역이 BODY_PADDING_MM 보다 작습니다.");
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose2) {}
    return;
  }

  var cols = Math.floor((binW + gapPt) / (cellPt + gapPt));
  var rows = Math.floor((binH + gapPt) / (cellPt + gapPt));
  if (cols < 1 || rows < 1) {
    _fail("유닛 " + options.sizeMm + "mm 가 body 에 한 칸도 들어가지 않습니다.");
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (eClose3) {}
    return;
  }
  var slots = cols * rows;

  var gridW = cols * cellPt + (cols - 1) * gapPt;
  var gridH = rows * cellPt + (rows - 1) * gapPt;
  var startX = bL + padPt + (binW - gridW) / 2;
  var startY = bT - padPt - (binH - gridH) / 2;

  var prevInteraction = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

  var fatalError = "";
  var failedItems = [];
  var placedCount = 0;
  var usedFrames = {};
  var minCounterPt = -1, minCounterCh = "";
  var libraryItems = [];
  var cutNodes = 0;
  var symbolCount = 0;
  var built = null;
  var keyColor = _hexToRGB(KEY_HEX, INK);
  var activePalette = PALETTES[0];
  if (options.palette >= 0 && options.palette < PALETTES.length) {
    activePalette = PALETTES[options.palette];
  }

  try {
    var total = Math.min(letters.length, slots);
    for (var i = 0; i < total; i++) {
      var ch = letters[i];
      var frame = FRAME_DEFS[i % FRAME_DEFS.length];
      var pal = activePalette[i % activePalette.length];

      var r = Math.floor(i / cols);
      var c = i % cols;
      var cx = startX + c * (cellPt + gapPt) + cellPt / 2;
      var cy = startY - r * (cellPt + gapPt) - cellPt / 2;

      try {
        var m = _measureLetter(doc, printLayer, ch, font);
        if (!m) throw new Error("실측 실패 (빈 글리프)");

        // 안전영역에 키라인 두께까지 포함해 맞춘다 (스트로크는 바깥으로 절반씩).
        // 글자를 기울이면 bbox 가 (cos+sin) 배로 커진다. 안전영역을 그만큼
        // 미리 줄여야 회전 후에도 프레임 안에 남는다.
        // 여유가 가장 빠듯한 별·하트는 최대 내접정사각 대비 1.10배뿐이라
        // 이 보정 없이 6° 를 주면 삐져나온다 (실측 계산 2026-08-20).
        var tiltDeg = _tiltFor(i, options.tilt);
        var safeSide = frame.safe * framePt;
        if (tiltDeg !== 0) {
          var rad = Math.abs(tiltDeg) * Math.PI / 180;
          safeSide = safeSide / (Math.cos(rad) + Math.sin(rad));
        }
        var scaleW = (safeSide - keyPt) / m.w;
        var scaleH = (safeSide - keyPt) / m.h;
        var scale = scaleW;
        if (scaleH < scaleW) scale = scaleH;
        if (!(scale > 0)) throw new Error("안전영역이 키라인보다 작습니다");

        built = _buildLetterSticker(doc, printLayer, kissLayer, cutSpot, ch, frame, {
          bg: _hexToRGB(pal.bg, INK),
          ink: _hexToRGB(pal.ink, INK),
          key: keyColor
        }, {
          framePt: framePt,
          cutPt: cutPt,
          frameStrokePt: frameStrokePt,
          keyPt: keyPt,
          tiltDeg: tiltDeg,
          font: font,
          fontSizePt: PROBE_SIZE_PT * scale
        }, cx, cy, i + 1);

        placedCount++;
        usedFrames[frame.key] = frame;
        if (options.library) libraryItems.push({ ch: ch, built: built });
        var cpt = _minCounterPt(built.ink);
        if (cpt >= 0 && (minCounterPt < 0 || cpt < minCounterPt)) {
          minCounterPt = cpt;
          minCounterCh = ch;
        }
      } catch (ePlace) {
        var em = String(ePlace);
        if (ePlace && ePlace.message) em = ePlace.message;
        failedItems.push({ base: ch, error: em });
      }
    }
    _safeRedrawAndGC();

    if (placedCount === 0) throw new Error("배치된 스티커가 없습니다.");

    cutNodes = _countNodes(kissLayer);   // 심볼 등록 전에 센다 (등록하면 칼선이 심볼 안으로 들어간다)

    // ── 심볼 등록 (라이브러리 모드) ───────────────────────────
    // 글자 1개 = 심볼 1개. 프레임·글자·칼선을 한 그룹으로 묶어 등록하므로
    // 꺼내 쓸 때 칼선이 같이 따라온다 (Expand 후 KissCut 레이어로 옮길 것).
    for (var sy = 0; sy < libraryItems.length; sy++) {
      try {
        _makeSymbol(doc, printLayer, libraryItems[sy].ch, libraryItems[sy].built, sy);
        symbolCount++;
      } catch (eSym) {
        failedItems.push({ base: libraryItems[sy].ch,
                           error: "심볼 등록 실패: " + eSym });
      }
    }

    // 템플릿에 딸려오는 Illustrator 기본 심볼(TextArea/Button/…)을 걷어낸다.
    // 안 지우면 라이브러리 패널에서 글자 사이에 섞여 나온다.
    if (options.library) {
      var keep = {};
      for (var kp = 0; kp < libraryItems.length; kp++) keep[libraryItems[kp].ch] = true;
      for (var sd = doc.symbols.length - 1; sd >= 0; sd--) {
        try {
          if (!keep[doc.symbols[sd].name]) doc.symbols[sd].remove();
        } catch (eDel) {}   // 사용 중인 심볼은 지워지지 않는다 — 그냥 둔다
      }
    }

    var headerLabel = options.headerText;
    if (!headerLabel) headerLabel = "ALPHABET";
    headerRightText.contents = headerLabel + " · ALPHA " +
      options.sizeMm + "mm · " + placedCount + "장";
  } catch (eMain) {
    var msgMain = String(eMain);
    if (eMain && eMain.message) msgMain = eMain.message;
    var lineMain = "?";
    if (eMain && eMain.line) lineMain = eMain.line;
    fatalError = msgMain + " @line " + lineMain;
  } finally {
    app.userInteractionLevel = prevInteraction;
  }

  if (fatalError) {
    // 개별 실패 사유까지 같이 낸다 — 전부 실패하면 진단이 여기 말고는 없다.
    var detail = "";
    for (var fe = 0; fe < Math.min(failedItems.length, 5); fe++) {
      detail += "\n- " + failedItems[fe].base + ": " + failedItems[fe].error;
    }
    if (failedItems.length > 5) detail += "\n(외 " + (failedItems.length - 5) + "건)";
    _fail(fatalError + detail + "\n\n시트는 저장하지 않았습니다. 문서를 확인 후 닫으세요.");
    return;
  }

  try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eKiss) {}
  try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (ePrint) {}
  doc.selection = null;

  // ── 저장 ──────────────────────────────────────────────────────
  var savedPath = "", saveError = "";
  try {
    var saveFile;
    if (options.library) {
      // 라이브러리는 날짜 없는 고정 이름으로 templates/ 에 둔다 —
      // Symbols 패널이 경로로 기억하므로 파일명이 바뀌면 안 된다.
      var tplDir = _resolveTemplate().parent;
      saveFile = new File(tplDir.fsName + "/" + LIBRARY_NAME);
    } else {
      var outFolder = _resolveOutputFolder(outFolderPick);
      saveFile = new File(outFolder.fsName + "/" + _timestamp() +
                          "_ALPHA" + options.sizeMm + "mm_sheet01.ai");
    }
    _saveAi(doc, saveFile);
    savedPath = saveFile.fsName;
  } catch (eSave) {
    saveError = String(eSave);
    if (eSave && eSave.message) saveError = eSave.message;
  }

  var msg =
    "완료: 알파벳 프레임 시트 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + " (템플릿: " + TEMPLATE_NAME + ")\n" +
    "서체: " + FONT_OPTIONS[options.fontIndex].label + "\n" +
    "팔레트: " + PALETTE_OPTIONS[options.palette] + (options.tilt ? " · 글자 기울기 ±" + TILT_MAX_DEG + "°" : "") + "\n" +
    "유닛: " + options.sizeMm + "mm · 칼선 = 인쇄 가장자리 (여백 0)\n" +
    "글자 키라인: " + options.keyMm + "mm";
  if (options.frameKeyline) {
    msg += " · 프레임 키라인 " + _round2(frameStrokePt / MM_TO_PT) + "mm";
  }
  msg += "\n간격: " + _round2(gapPt / MM_TO_PT) + "mm " +
    "(나중에 줄 여백 " + options.plannedOffsetMm + "mm × 2 + 최소 " + GAP_MIN_MM + "mm)\n" +
    "그리드: " + cols + "열 × " + rows + "행 = " + slots + "칸 / 배치 " +
    placedCount + "장 (입력 " + letters.length + "자)\n" +
    "칼선 노드: " + cutNodes + "개 (Summa D75 선호 500–1500)\n";
  if (minCounterPt >= 0) {
    var cmm = minCounterPt / MM_TO_PT;
    msg += "최소 카운터(글자 속구멍): " + _round2(cmm) + "mm — \"" + minCounterCh + "\"\n";
    if (cmm < 0.35) {
      msg += "⚠ 0.35mm 미만입니다. 잉크가 번져 속구멍이 메워질 수 있습니다 —\n" +
             "   유닛을 키우거나 카운터가 넓은 서체(Bakbak One)로 바꾸세요.\n";
    }
  }
  if (letters.length > slots) {
    msg += "⚠ " + (letters.length - slots) + "자가 한 시트에 못 들어가 잘렸습니다.\n";
  }
  if (options.library) msg += "심볼 " + symbolCount + "개 등록\n";
  msg += "\n" + (savedPath ? ("저장: " + savedPath) : ("저장 실패: " + saveError)) + "\n\n" +
    (options.library ?
      ("꺼내 쓰기: Symbols 패널 → Open Symbol Library → Other Library → 이 파일 선택.\n" +
       "   드래그 후 Expand 하면 칼선이 같이 나온다 — KissCut 레이어로 옮길 것.\n") :
      ("다음 단계: KissCut 레이어를 전체 선택 → Object > Path > Offset Path 로 원하는 흰 여백을 준다.\n")) +
    "QC: ① 글자가 프레임 안에서 숨 쉬는지 ② 키라인이 속구멍(A·O·P)을 따라가는지 " +
    "③ 칼선이 인쇄 가장자리와 정확히 겹치는지 ④ 오프셋 후 칼선끼리 안 겹치는지";

  if (failedItems.length > 0) {
    msg += "\n\n실패 " + failedItems.length + "건:";
    for (var fj = 0; fj < Math.min(failedItems.length, 8); fj++) {
      msg += "\n- " + failedItems[fj].base + ": " + failedItems[fj].error;
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
  //  스티커 유닛 생성
  // ═════════════════════════════════════════════════════════

  // 칼선 = 인쇄된 프레임의 **가시 가장자리** (여백 0). 사용자가 나중에
  // Offset Path 로 직접 여백을 준다 — 이름 스티커와 같은 규약.
  //
  // 키라인 스트로크는 패스 바깥으로 절반 나가므로, 칼선은 같은 프레임을
  // cutPt(= framePt + 키라인) 크기로 **다시 그려** 그 가장자리에 얹는다.
  // Offset Path 를 쓰지 않는 이유(2026-08-20 실측 비교): round join 이 별
  // 12꼭지를 통째로 뭉툭한 덩어리로 만들고 티켓 노치를 거의 지운다.
  // 도형 재생성은 모양을 그대로 지킨다.
  //
  // z-order: 글자 → 프레임 (앞→뒤)
  function _buildLetterSticker(sheetDoc, printL, kissL, spotColor, ch, frame,
                               colors, cfg, cx, cy, idx) {
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;
    sheetDoc.selection = null;

    // 1) 프레임 본체
    var frm = frame.build(printL, cfg.framePt, cx, cy);
    _fitFrame(frm, cfg.framePt, cx, cy);
    _setSolidFill(frm, colors.bg);
    if (cfg.frameStrokePt > 0) {
      frm.stroked = true;
      frm.strokeColor = colors.key;
      frm.strokeWidth = cfg.frameStrokePt;
    }
    try { frm.name = "Frame_" + frame.key + "_" + _pad2(idx); } catch (eF) {}

    // 2) 칼선 — KissCut 레이어에 바로 그린다 (PrintData 에는 남기지 않는다)
    var cut = frame.build(kissL, cfg.cutPt, cx, cy);
    _fitFrame(cut, cfg.cutPt, cx, cy);
    try { cut.name = "Cutline_" + ch + "_" + _pad2(idx); } catch (eC) {}
    _forceCutContourStroke(cut, spotColor);

    // 3) 글자 — 프레임 위에 얹는다 (마지막 생성 = 최전면)
    sheetDoc.activeLayer = printL;
    var ink = _makeLetterOutline(printL, ch, cfg.font, cfg.fontSizePt,
                                 colors.ink, colors.key, cfg.keyPt);
    var gb = ink.geometricBounds;
    var icx = (gb[0] + gb[2]) / 2;
    var icy = (gb[1] + gb[3]) / 2;
    ink.translate(cx - icx, (cy + frame.cyOff * cfg.framePt) - icy);
    if (cfg.tiltDeg !== 0) {
      // 중심 기준 회전. 안전영역은 위에서 (cos+sin) 로 이미 줄여 놨다.
      try {
        ink.rotate(cfg.tiltDeg, true, true, true, true, Transformation.CENTER);
      } catch (eRot) {}
    }
    try { ink.name = "Letter_" + ch + "_" + _pad2(idx); } catch (eL) {}

    sheetDoc.selection = null;
    try { $.gc(); } catch (eGc) {}
    return { frame: frm, cut: cut, ink: ink };
  }

  // 글자별 기울기. **결정론적**이어야 한다 — Math.random 을 쓰면 같은 입력이
  // 매번 다르게 나와 재현이 안 되고, 실측 단계와도 어긋난다
  // ([[project_calligraphy_sheet]] 의 bouncy 와 같은 이유).
  // 서로 다른 무리수 배수를 써서 규칙적으로 반복되지 않게 한다.
  function _tiltFor(i, enabled) {
    if (!enabled) return 0;
    return TILT_MAX_DEG * Math.sin(i * 2.399 + 1.13);
  }

  // 텍스트 → 아웃라인. createOutline 은 원본 TextFrame 을 소모한다.
  function _makeLetterOutline(printL, ch, font, fontSizePt, fillColor, keyColor, keyPt) {
    var tf = printL.textFrames.pointText([0, 0]);
    tf.contents = ch;
    var tr = tf.textRange;
    tr.characterAttributes.textFont = font;
    tr.characterAttributes.size = fontSizePt;
    tr.characterAttributes.fillColor = fillColor;
    var outline = tf.createOutline();
    _setLetterStyle(outline, fillColor, keyColor, keyPt);
    return outline;
  }

  // 글자 키라인은 **스트로크**다 (오프셋 도형이 아니라).
  // 오프셋 도형으로 주려면 compound 를 풀어 union 해야 하는데, 그러면
  // A·O·P 의 속구멍이 메워져 글자가 뭉개진다.
  // 스트로크는 속구멍 윤곽도 같이 따라가므로 레퍼런스와 같은 모양이 나온다.
  // Illustrator 는 fill 위에 stroke 를 그리므로 절반은 글자 안쪽을 먹는다 —
  // 그게 키라인의 생김새다.
  function _setLetterStyle(item, fillColor, keyColor, keyPt) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) {
          _setLetterStyle(item.pageItems[i], fillColor, keyColor, keyPt);
        }
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
          _setLetterStyle(item.pathItems[j], fillColor, keyColor, keyPt);
        }
        return;
      }
      if (item.typename === "PathItem") {
        item.filled = true;
        item.fillColor = fillColor;
        if (keyPt > 0) {
          item.stroked = true;
          item.strokeColor = keyColor;
          item.strokeWidth = keyPt;
          try { item.strokeJoin = StrokeJoin.ROUNDENDJOIN; } catch (eJ) {}
        } else {
          item.stroked = false;
        }
      }
    } catch (e) {}
  }

  // 기준 사이즈로 실측 후 캐시. TextFrame.geometricBounds 는 글리프가 아니라
  // 폰트 메트릭 박스라 반드시 아웃라인으로 변환한 뒤 재야 한다.
  function _measureLetter(sheetDoc, printL, ch, font) {
    if (LETTER_MEASURE_CACHE.hasOwnProperty(ch)) return LETTER_MEASURE_CACHE[ch];
    var outline = _makeLetterOutline(printL, ch, font, PROBE_SIZE_PT, INK, INK, 0);
    var b = outline.geometricBounds;
    var w = b[2] - b[0];
    var h = b[1] - b[3];
    try { outline.remove(); } catch (eRm) {}
    var res = null;
    if (w > 0 && h > 0) res = { w: w, h: h };
    LETTER_MEASURE_CACHE[ch] = res;
    return res;
  }


  // ═════════════════════════════════════════════════════════
  //  프레임 팩토리 — 전부 파라메트릭 (Make Work Path / SVG import 아님)
  //  build(container, D, cx, cy) : D×D 박스 기준으로 그린다.
  //  "도형 재생성" 흰 테두리는 같은 함수를 D+2×테두리 로 다시 부르는 것뿐이다.
  // ═════════════════════════════════════════════════════════

  // 빌더가 낸 도형을 실제 bbox 기준으로 D 박스에 꽉 채우고 중심을 맞춘다.
  // 폴라 도형은 최대 반지름이 대각선에 오는 경우가 많아(물결사각 89%,
  // 블롭 80%, 하트 78%) 정규화 없이 두면 한 시트에서 크기가 제각각으로 보인다.
  // 프레임과 흰 테두리에 **같은 정규화**를 걸어야 둘이 동심·비례로 남는다.
  // geometricBounds 는 bezier 의 불룩한 부분까지 반영하므로 anchor 계산보다 정확하다.
  // 스트로크는 이 뒤에 얹는다 (visibleBounds 로 재면 두께만큼 어긋난다).
  function _fitFrame(item, D, cx, cy) {
    var gb = item.geometricBounds;
    var w = gb[2] - gb[0];
    var h = gb[1] - gb[3];
    var side = w;
    if (h > w) side = h;
    if (!(side > 0)) throw new Error("프레임 bounds 가 비어 있습니다");
    var sc = D / side;
    if (Math.abs(sc - 1) > 0.001) {
      item.resize(sc * 100, sc * 100, true, true, true, true, 100, Transformation.CENTER);
    }
    gb = item.geometricBounds;
    item.translate(cx - (gb[0] + gb[2]) / 2, cy - (gb[1] + gb[3]) / 2);
    return item;
  }

  function _frameCircle(container, D, cx, cy) {
    return container.pathItems.ellipse(cy + D / 2, cx - D / 2, D, D);
  }

  function _frameRSquare(container, D, cx, cy) {
    var r = D * 0.17;
    return container.pathItems.roundedRectangle(cy + D / 2, cx - D / 2, D, D, r, r);
  }

  // 꽃/스캘럽 — 8엽. min/max = 1-2a = 0.82 (a=0.09)
  function _frameScallop(container, D, cx, cy) {
    return _polarPath(container, cx, cy, D, function (t) {
      return 1 - 0.09 + 0.09 * Math.cos(8 * t);
    });
  }

  // 물결사각 — 수퍼타원(n=4) 위에 12파. min/max = 0.81
  function _frameWave(container, D, cx, cy) {
    return _polarPath(container, cx, cy, D, function (t) {
      return _superEllipse(t, 4) * (1 - 0.055 + 0.055 * Math.cos(12 * t));
    });
  }

  // 네잎 블롭 (quatrefoil) — 45° 회전한 4엽. min/max = 0.70
  function _frameBlob(container, D, cx, cy) {
    return _polarPath(container, cx, cy, D, function (t) {
      return 1 - 0.15 + 0.15 * Math.cos(4 * (t - Math.PI / 4));
    });
  }

  // 별 — 12꼭지. 폴라 샘플링이 아니라 정확한 꼭지점으로 그린다
  // (샘플링하면 끝이 잘리고 노드만 늘어난다).
  function _frameStar(container, D, cx, cy) {
    var pts = 12;
    var R = D / 2;
    var rIn = R * 0.62;
    var p = container.pathItems.add();
    for (var i = 0; i < pts * 2; i++) {
      var th = (i / (pts * 2)) * Math.PI * 2 + Math.PI / 2;
      var rr = rIn;
      if (i % 2 === 0) rr = R;
      var xy = [cx + rr * Math.cos(th), cy + rr * Math.sin(th)];
      _addPt(p, xy, xy, xy);
    }
    p.closed = true;
    return p;
  }

  // 아치 — 사각 몸통 + 반원 지붕. 바닥 모서리는 각지게 둔다(레퍼런스와 동일).
  function _frameArch(container, D, cx, cy) {
    var W = D * 0.86, H = D;
    var L = cx - W / 2, R = cx + W / 2;
    var B = cy - H / 2, T = cy + H / 2;
    var rr = W / 2;
    var SH = T - rr;                 // 어깨 = 반원이 시작하는 높이
    if (SH < B) SH = B;
    var k = KAPPA * rr;
    var p = container.pathItems.add();
    _addPt(p, [L, B], [L, B], [L, B]);
    _addPt(p, [R, B], [R, B], [R, B]);
    _addPt(p, [R, SH], [R, SH], [R, SH + k]);
    _addPt(p, [cx, T], [cx + k, T], [cx - k, T]);
    _addPt(p, [L, SH], [L, SH + k], [L, SH]);
    p.closed = true;
    return p;
  }

  // 티켓 — 좌우 중앙에 오목한 반원 노치.
  // 노치는 오목하므로 Offset Path 로 바깥 오프셋하면 반지름이 줄어 얕아진다
  // (테두리 ≥ 노치 반지름이면 아예 사라진다). "도형 재생성" 방식에서는
  // 비율이 유지되므로 노치가 그대로 살아 있다 — 두 방식의 차이가 가장 큰 도형.
  function _frameTicket(container, D, cx, cy) {
    var W = D, H = D * 0.86;
    var L = cx - W / 2, R = cx + W / 2;
    var B = cy - H / 2, T = cy + H / 2;
    var nr = D * 0.12;
    var k = KAPPA * nr;
    var p = container.pathItems.add();
    _addPt(p, [L, B], [L, B], [L, B]);
    _addPt(p, [R, B], [R, B], [R, B]);
    _addPt(p, [R, cy - nr], [R, cy - nr], [R - k, cy - nr]);
    _addPt(p, [R - nr, cy], [R - nr, cy - k], [R - nr, cy + k]);
    _addPt(p, [R, cy + nr], [R - k, cy + nr], [R, cy + nr]);
    _addPt(p, [R, T], [R, T], [R, T]);
    _addPt(p, [L, T], [L, T], [L, T]);
    _addPt(p, [L, cy + nr], [L, cy + nr], [L + k, cy + nr]);
    _addPt(p, [L + nr, cy], [L + nr, cy + k], [L + nr, cy - k]);
    _addPt(p, [L, cy - nr], [L + k, cy - nr], [L, cy - nr]);
    p.closed = true;
    return p;
  }

  // 하트 — Everstory_shapes.jsx 의 검증된 bezier 점표를 그대로 가져왔다.
  // 곡률은 아래 표의 handle 좌표로만 결정된다 (눈으로 보고 표만 조정).
  function _frameHeart(container, D, cx, cy) {
    var s = D / 80;
    var pts = [
      [[50, 30], [50, 14], [50, 14]],   // 상단 가운데 딤
      [[80, 26], [72,  9], [88, 42]],   // 오른쪽 lobe
      [[50, 82], [60, 68], [40, 68]],   // 하단 꼭지
      [[20, 26], [12, 42], [28,  9]]    // 왼쪽 lobe
    ];
    var p = container.pathItems.add();
    for (var i = 0; i < pts.length; i++) {
      _addPt(p, _heartMap(pts[i][0], s, cx, cy),
                _heartMap(pts[i][1], s, cx, cy),
                _heartMap(pts[i][2], s, cx, cy));
    }
    p.closed = true;
    return p;
  }

  function _heartMap(xy, s, cx, cy) {
    // 디자인 박스(100×100, y-down) → Illustrator(y-up, cx·cy 중심)
    return [cx + (xy[0] - 50) * s, cy + (45.5 - xy[1]) * s];
  }

  // 폴라 반지름 함수를 균등 분할해 닫힌 패스로. rFn 의 최대값이 D/2 가
  // 되도록 정규화하므로 rFn 은 상대값만 맞으면 된다.
  function _polarPath(container, cx, cy, D, rFn) {
    var i, th;
    var rs = [];
    var maxR = 0;
    for (i = 0; i < POLAR_SAMPLES; i++) {
      th = (i / POLAR_SAMPLES) * Math.PI * 2;
      var r = rFn(th);
      rs.push(r);
      if (r > maxR) maxR = r;
    }
    if (!(maxR > 0)) throw new Error("폴라 반지름이 0 입니다");
    var k = (D / 2) / maxR;
    var p = container.pathItems.add();
    for (i = 0; i < POLAR_SAMPLES; i++) {
      th = (i / POLAR_SAMPLES) * Math.PI * 2;
      var rr = rs[i] * k;
      var xy = [cx + rr * Math.cos(th), cy + rr * Math.sin(th)];
      _addPt(p, xy, xy, xy);
    }
    p.closed = true;
    return p;
  }

  // |x|^n + |y|^n = 1 의 폴라 형태. n=2 원, n=4 둥근사각, n 클수록 각짐.
  function _superEllipse(th, n) {
    var a = Math.pow(Math.abs(Math.cos(th)), n) + Math.pow(Math.abs(Math.sin(th)), n);
    return 1 / Math.pow(a, 1 / n);
  }

  // handle 은 CORNER 로 넣는다 — SMOOTH 는 collinear 를 강제해 도형을 왜곡한다.
  function _addPt(p, a, lft, rgt) {
    var pp = p.pathPoints.add();
    pp.anchor = a;
    pp.leftDirection = lft;
    pp.rightDirection = rgt;
    pp.pointType = PointType.CORNER;
  }


  // ═════════════════════════════════════════════════════════
  //  색 / 노드 유틸  (Everstory_calligraphy.jsx 검증본)
  // ═════════════════════════════════════════════════════════

  // 프레임 채우기. 스트로크는 이 뒤에 따로 얹는다 (여기서는 항상 끈다).
  function _setSolidFill(item, colorObj) {
    try {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) _setSolidFill(item.pageItems[i], colorObj);
        return;
      }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) _setSolidFill(item.pathItems[j], colorObj);
        return;
      }
      if (item.typename === "PathItem") {
        item.stroked = false;
        item.filled = true;
        item.fillColor = colorObj;
      }
    } catch (e) {}
  }

  function _hexToRGB(hex, fallback) {
    if (!hex) return fallback;
    var s = String(hex).replace(/^#/, "");
    if (!/^[0-9A-Fa-f]{6}$/.test(s)) return fallback;
    return C(parseInt(s.substring(0, 2), 16),
             parseInt(s.substring(2, 4), 16),
             parseInt(s.substring(4, 6), 16));
  }

  // 프레임 + 글자 + 칼선을 한 그룹으로 묶어 심볼로 등록한다.
  // symbols.add() 는 원본 아트를 심볼 인스턴스로 바꾼다 — 시트에는 인스턴스가 남는다.
  // 심볼 이름은 글자 그대로. 같은 글자가 두 번 들어오면 뒤에 번호를 붙인다.
  function _makeSymbol(sheetDoc, printL, ch, built, idx) {
    var g = printL.groupItems.add();
    try { built.frame.move(g, ElementPlacement.PLACEATEND); } catch (e1) {}
    try { built.ink.move(g, ElementPlacement.PLACEATBEGINNING); } catch (e2) {}
    try { built.cut.move(g, ElementPlacement.PLACEATBEGINNING); } catch (e3) {}
    try { g.name = "Alpha_" + ch; } catch (e4) {}
    var sym = sheetDoc.symbols.add(g);
    try { sym.name = ch; }
    catch (eName) { try { sym.name = ch + "_" + _pad2(idx + 1); } catch (eName2) {} }
    return sym;
  }

  // 글자 속구멍(카운터)의 최소 폭 (pt). 인쇄에서 메워지는지 판단하는 수치다.
  // 다른 패스 bbox 안에 들어 있는 subpath = 구멍. 그 중 가장 좁은 변을 돌려준다.
  // 구멍이 없는 글자(I·L·V…)만 있으면 -1.
  function _minCounterPt(ink) {
    var paths = [];
    _gatherPaths(ink, paths);
    var b = [];
    for (var i = 0; i < paths.length; i++) {
      try { b.push(paths[i].geometricBounds); } catch (e) { b.push(null); }
    }
    var min = -1;
    for (var p = 0; p < b.length; p++) {
      if (!b[p]) continue;
      var inner = false;
      for (var q = 0; q < b.length; q++) {
        if (p === q || !b[q]) continue;
        if (b[p][0] >= b[q][0] && b[p][2] <= b[q][2] &&
            b[p][1] <= b[q][1] && b[p][3] >= b[q][3]) { inner = true; break; }
      }
      if (!inner) continue;
      var w = b[p][2] - b[p][0];
      var h = b[p][1] - b[p][3];
      var m = (w < h) ? w : h;
      if (min < 0 || m < min) min = m;
    }
    return min;
  }

  function _countNodes(container) {
    var paths = [];
    _gatherPaths(container, paths);
    var n = 0;
    for (var i = 0; i < paths.length; i++) {
      try { n += paths[i].pathPoints.length; } catch (e) {}
    }
    return n;
  }

  function _gatherPaths(item, out) {
    if (!item) return;
    try {
      if (item.typename === "PathItem") { out.push(item); return; }
      if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) out.push(item.pathItems[j]);
        return;
      }
      if (item.typename === "GroupItem") {
        for (var g = 0; g < item.pageItems.length; g++) _gatherPaths(item.pageItems[g], out);
        return;
      }
      if (item.typename === "Layer") {
        for (var L = 0; L < item.pageItems.length; L++) _gatherPaths(item.pageItems[L], out);
      }
    } catch (e) {}
  }


  // ═════════════════════════════════════════════════════════
  //  서체
  // ═════════════════════════════════════════════════════════

  function _fontForIndex(idx) {
    if (FONT_INDEX_CACHE.hasOwnProperty(idx)) return FONT_INDEX_CACHE[idx];
    var f = _resolveFont(FONT_OPTIONS[idx].cands);
    FONT_INDEX_CACHE[idx] = f;
    return f;
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


  // ═════════════════════════════════════════════════════════
  //  UI
  // ═════════════════════════════════════════════════════════

  function _showAlphaDialog() {
    var dlg = new Window("dialog", "Everstory Alphabet Frame Sheet (PoC)");
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.spacing = 10;
    dlg.margins = 16;

    dlg.add("statictext", undefined,
      "글자 하나 = 스티커 하나. 프레임 " + FRAME_DEFS.length + "종을 순서대로 돌려 씁니다.");

    dlg.add("statictext", undefined,
      "칼선은 인쇄 가장자리 그대로 (여백 0). 흰 여백은 나중에 Offset Path 로 직접 주세요.");

    var gLetters = dlg.add("panel", undefined, "글자");
    gLetters.orientation = "column";
    gLetters.alignChildren = "fill";
    gLetters.margins = 12;
    var lettersEdit = gLetters.add("edittext", undefined, DEFAULT_LETTERS);
    lettersEdit.characters = 40;
    gLetters.add("statictext", undefined, "공백은 무시됩니다. 이름·단어를 넣어도 됩니다 (예: HARIN).");

    var gSize = dlg.add("group");
    gSize.add("statictext", undefined, "유닛 크기:");
    var sizeDrop = gSize.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDrop.selection = SIZE_DEFAULT_INDEX;
    gSize.add("statictext", undefined, "  나중에 줄 여백:");
    var plannedDrop = gSize.add("dropdownlist", undefined, PLANNED_OPTIONS);
    plannedDrop.selection = PLANNED_DEFAULT_INDEX;

    var gFont = dlg.add("group");
    gFont.add("statictext", undefined, "서체:");
    var fontDrop = gFont.add("dropdownlist", undefined, _fontLabels());
    fontDrop.selection = FONT_DEFAULT_INDEX;
    fontDrop.preferredSize = [380, 24];

    var gKey = dlg.add("group");
    gKey.add("statictext", undefined, "글자 키라인:");
    var keyDrop = gKey.add("dropdownlist", undefined, KEY_OPTIONS);
    keyDrop.selection = KEY_DEFAULT_INDEX;
    var frameKeyCheck = gKey.add("checkbox", undefined, "프레임에도 키라인");
    frameKeyCheck.value = false;

    var gPal = dlg.add("group");
    gPal.add("statictext", undefined, "팔레트:");
    var palDrop = gPal.add("dropdownlist", undefined, PALETTE_OPTIONS);
    palDrop.selection = 0;
    palDrop.preferredSize = [300, 24];

    var gTilt = dlg.add("group");
    var tiltCheck = gTilt.add("checkbox", undefined,
      "글자 살짝 기울이기 (프레임마다 각도 다름 — 손으로 붙인 느낌)");
    tiltCheck.value = true;

    var gLib = dlg.add("group");
    var libCheck = gLib.add("checkbox", undefined,
      "심볼 라이브러리로 저장 (templates/" + LIBRARY_NAME + ") — 글자마다 심볼 1개");
    libCheck.value = false;

    var gHeader = dlg.add("group");
    gHeader.add("statictext", undefined, "헤더 문구:");
    var headerEdit = gHeader.add("edittext", undefined, "ALPHABET");
    headerEdit.characters = 24;

    var gBtn = dlg.add("group");
    gBtn.alignment = "right";
    gBtn.add("button", undefined, "취소", { name: "cancel" });
    gBtn.add("button", undefined, "시트 생성", { name: "ok" });

    if (dlg.show() !== 1) return null;

    return {
      letters: lettersEdit.text,
      sizeMm: SIZE_VALUES[sizeDrop.selection.index],
      plannedOffsetMm: PLANNED_VALUES[plannedDrop.selection.index],
      keyMm: KEY_VALUES[keyDrop.selection.index],
      frameKeyline: frameKeyCheck.value,
      palette: palDrop.selection.index,
      library: libCheck.value,
      tilt: tiltCheck.value,
      fontIndex: fontDrop.selection.index,
      headerText: headerEdit.text
    };
  }

  function _fontLabels() {
    var out = [];
    for (var i = 0; i < FONT_OPTIONS.length; i++) out.push(FONT_OPTIONS[i].label);
    return out;
  }


  // ═════════════════════════════════════════════════════════
  //  템플릿 / 저장  (Everstory_calligraphy.jsx 검증본)
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

  function _safeRedrawAndGC() {
    try { app.redraw(); } catch (eRedraw) {}
    try { $.gc(); } catch (eGc) {}
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
    var srcName = decodeURIComponent(srcFolder.name);
    if (srcName === "02_cutout") {
      var out = new Folder(srcFolder.parent.fsName + "/03_output");
      if (!out.exists) out.create();
      return out;
    }
    var childOut = new Folder(srcFolder.fsName + "/03_output");
    if (childOut.exists) return childOut;
    var childOrig = new Folder(srcFolder.fsName + "/01_original");
    var childCut = new Folder(srcFolder.fsName + "/02_cutout");
    if (childOrig.exists || childCut.exists) {
      childOut.create();
      return childOut;
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

  function _round2(n) {
    return Math.round(n * 100) / 100;
  }

  function _pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

})();
