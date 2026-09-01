// ═══════════════════════════════════════════════════════════════
//  Everstory Ring Badge 시트 (원형 배지 · 링 곡선 텍스트 × 여러 장)
//
//  template_cutout_v2.ait (운영 v2 브랜드 템플릿) 위에, 02_cutout 페어를
//  안쪽 원형 창에 앉히고 바깥 컬러 링에 위/아래 곡선 텍스트를 얹어
//  A5 한 시트에 균일 격자로 깐다. 레트로 파스텔 팔레트를 슬롯마다 순환.
//
//  플로우: 02_cutout 폴더 → 다이얼로그(텍스트/디자인/제작 + 페어 multiselect)
//  → 시트 생성 → info > header > header_right 값 주입 →
//  03_output/{ts}_{RING|STRIPE}_{inch}in_sheet01.ai 자동 저장.
//
//  레이아웃 2종 — 원·칼선·팔레트·아치 조판은 공유하고 배경과 사진 배치만 다르다:
//   · 링 배지    = 단색 링 + 안쪽 사진 창. 사진은 창 안에 contain fit + 가운데.
//                  위·아래 아치 텍스트 둘 다.
//   · 스트라이프 = 세로 줄무늬 전면 + 사진이 원 전체에 크게 하단 블리드.
//                  위 아치 텍스트만 (아래는 사진이 덮어서 안 쓴다).
//
//  구조 (스티커 1개, z-order 위→아래):
//    ① 아치 텍스트  (PrintData, 편집 가능한 pathText)
//    ② 사진 클립 그룹 [clip(원) · 누끼 사진 · (링이면 안쪽 원 배경)]
//    ③ 배경 — 링 원판 또는 스트라이프 클립 그룹 (팔레트 bg 색)
//    ④ 칼선 원 (KissCut, CutContour) — 셀 경계 = D, 배경은 칼선 여백만큼 안쪽
//
//  Image Trace 없음: 칼선이 완전한 원이라 실루엣 트레이스·Pathfinder union·
//  TraceStash 캐시가 전부 불필요하다. _sil.png 는 피사체 bbox(크기·중심)를
//  얻는 용도로만 트레이스한다.
//
//  사진 배치는 shapes.jsx 의 '하단 블리드'와 **반대**다 (되돌리지 말 것) —
//  shapes 는 칼선이 곧 실루엣이라 피사체를 도형 바닥에 붙여 하단 여백을 없앤다.
//  링 배지의 안쪽 원은 칼선이 아니라 창(window)이라, 피사체 bbox 를 원 안에
//  contain fit 해서 가운데 놓는다. 바닥에 붙이면 턱이 잘리고 정수리가
//  원 밖으로 나간다 (v1 실측).
//
//  아치 방향 (되돌리지 말 것 — 뒤집으면 글자가 거꾸로 선다):
//   · 위 = θ 감소(시계방향, 195°→-15°) → 진행방향 +x, 글자 위쪽이 바깥.
//   · 아래 = θ 증가(반시계, 210°→330°) → 진행방향 +x, 글자 위쪽이 안쪽.
//     즉 아래 텍스트가 뒤집히지 않고 왼→오른쪽으로 똑바로 읽힌다.
//
//  함정 (기존 스크립트에서 실측 — 되돌리지 말 것):
//   · var 테이블은 호이스팅 안 됨. 메인 플로우보다 위에 둘 것.
//   · 여러 줄에 걸친 중첩 삼항 연산자 금지 — ExtendScript 에서 틀린 분기가
//     실행된다 (with_name 실측). if/else 로 풀어 쓸 것.
//   · embed() 후 placedItem 핸들은 무효 — bounds 매칭으로 재탐색.
//   · 곡선 텍스트는 아웃라인하지 않는다. 칼선이 원이라 필요 없고,
//     문구 오타를 나중에 그대로 고칠 수 있다.
//
//  사용: File → Scripts → Other Script → Everstory_ring.jsx
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "ring badge v1";
  var SCRIPT_TITLE = "Everstory Ring Badge Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var TEMPLATE_NAME = "template_cutout_v2.ait";

  // ── 시트 (Everstory_mixed.jsx 2026-08-25 운영 상수와 동일) ─────
  var BODY_PADDING_X_MM = 0;
  var BODY_PADDING_Y_MM = 1.5;
  var GAP_DEFAULT_MM = 1.5;

  // ── 사이즈 ────────────────────────────────────────────────────
  // 링 텍스트가 읽히는 하한이 1.5" 다. 1.25" 이하는 글자 높이가 2mm 미만이라
  // ET-8550 에서 뭉갠다 — 의도적으로 열지 않는다.
  var SIZE_OPTIONS = ["1.5\" / 38mm", "2\" / 51mm  (기본)", "2.5\" / 64mm"];
  var SIZE_MM      = [38.1, 50.8, 63.5];
  var SIZE_DEFAULT = 1;

  // ── 레이아웃 ─────────────────────────────────────────────────
  var LAYOUT_RING   = 0;
  var LAYOUT_STRIPE = 1;
  var LAYOUT_OPTIONS = [
    "링 배지 — 단색 링 + 안쪽 사진 창 (위·아래 텍스트)",
    "스트라이프 — 세로 줄무늬 + 전면 사진 (위 텍스트만)"
  ];
  var LAYOUT_DEFAULT = LAYOUT_RING;

  // ── 스트라이프 기하 (레퍼런스 실측) ───────────────────────────
  var STRIPE_W_RATIO   = 1 / 21;    // 줄 하나 폭 / 원 지름 → 색 줄 10~11개
  var STRIPE_BASE_HEX  = "FFFFFF";  // 줄 사이 바탕
  var STRIPE_TEXT_EDGE = 0.035;     // 글자 위쪽 여백 / 원 지름 (원 가장자리 기준)

  // ── 링 기하 (레퍼런스 실측 비율) ──────────────────────────────
  var PHOTO_RATIO      = 0.72;   // 안쪽 사진 원 지름 / 바깥 원 지름
  var RING_FONT_RATIO  = 0.095;  // 글자 크기 / 바깥 지름
  var CAP_HEIGHT_RATIO = 0.72;   // 글자 크기 → 대문자 높이 근사 (밴드 세로 중앙 정렬용)
  var TOP_SPAN_DEG     = 210;    // 위 아치가 도는 각도
  var BOTTOM_SPAN_DEG  = 120;    // 아래 아치가 도는 각도
  var RING_TRACKING    = 40;     // 곡선 위 자간 (레퍼런스처럼 넉넉하게)
  // 글자 흰 테두리(헤일로). 일러스트레이터는 텍스트 스트로크를 **글자 위에** 그려서
  // 본체에 직접 주면 획이 반 두께만큼 깎인다 — 그래서 뒤에 흰 획 카피를 깔고
  // 본체는 채움만 둔다. 스트로크는 중앙 정렬이라 절반(= ratio/2 em)만 글자 밖으로 나온다.
  // 0.09 보다 키우면 자간(0.04em)보다 두꺼워져 옆 글자 헤일로와 붙는다.
  var HALO_HEX   = "FFFFFF";
  var HALO_RATIO = 0.09;
  var FIT_MARGIN       = 0.94;   // 아치 길이 대비 글자가 차지해도 되는 비율
  var MIN_H_SCALE      = 85;     // 여기까지는 장평으로 줄이고, 그 아래는 폰트 크기를 줄인다
  var LEGIBILITY_MIN_PT = 5;     // 이보다 작아지면 경고

  // ── 사진 배치 (원형 창 전용 contain fit) ──────────────────────
  // 피사체 긴 변을 안쪽 원 지름의 N% 로 맞추고 원 중앙에 놓는다.
  // 86% 는 머리 bbox 의 모서리가 비어 있다는 전제 — 네모난 피사체(전신 정면 등)를
  // 넣어 모서리가 원에 물리면 이 값을 낮춘다.
  var DEF_SUBJECT_PCT = 86;    // 링: 피사체 긴 변 / 안쪽 원 지름 (%). 클수록 얼굴 큼
  var STRIPE_SUBJECT_PCT = 92; // 스트라이프: 원 전체를 쓰므로 더 크게
  // 세로 미세조정 — 원 지름 대비 %, + = 위로 / − = 아래로. 두 정렬 모드 모두에 더해진다.
  // 링 기본이 −4 인 이유: 얼굴 bbox 를 정중앙에 두면 눈높이가 원 중심 위로 올라가
  // 사진이 떠 보인다 (2026-08-27 실측). 스트라이프는 아래 맞춤이 이미 잡아줘서 0.
  var DEF_Y_BIAS_PCT    = -4;
  // 스트라이프는 아래 맞춤이라 피사체 윗변이 원 꼭대기 근처까지 올라와 위 아치 텍스트에
  // 머리가 붙는다 (2026-08-27 실측). 더 내려서 아랫부분을 잘라내는 게 레퍼런스와 같다.
  var STRIPE_Y_BIAS_PCT = -8;
  // 세로 정렬 — 가운데(링 기본) / 아래 맞춤(스트라이프 기본. 레퍼런스처럼 원 하단에서 잘림)
  var ALIGN_OPTIONS = ["가운데", "아래 맞춤 (원 하단에서 잘림)"];
  var ALIGN_CENTER = 0, ALIGN_BOTTOM = 1;
  var SUBJECT_BLEED = 0.02;    // 아래 맞춤일 때 피사체 바닥을 원 바닥보다 살짝 아래로
  // 눈더미 — 사진창 반지름 대비 능선 높이(음수 = 중심 아래). −0.78 은 얼굴 누끼의
  // 턱을 덮지 않는 선이다. 올리면(예 −0.60) 눈은 두꺼워지지만 턱을 먹는다.
  var SNOW_CREST = -0.78;
  var SNOW_HEX   = "FFFFFF";

  // ── 칼선 (2026-08-27 개편 — 흰 테두리 방식 폐기) ──────────────
  // 셀 = D, 칼선 = D 로 고정하고 배경만 늘린다.
  //   -1mm = 블리드. 배경(링/스트라이프)을 칼선 밖으로 1mm 키우고 D 에서 자른다.
  //          컷이 밀려도 흰 여백이 안 생긴다. 레퍼런스 둘 다 이 느낌.
  //    0mm = 배경 가장자리 = 칼선. 블리드 없음.
  // 값이 음수라 dBg = D + 2×블리드. 양수(구 흰 테두리) 옵션은 의도적으로 뺐다.
  var CUT_MARGIN_OPTIONS = ["-1mm (배경을 밖으로 1mm — 블리드)", "0mm (배경 = 칼선)"];
  var CUT_MARGIN_VALUES  = [-1, 0];
  var CUT_MARGIN_DEFAULT_INDEX = 0;   // -1mm

  // ── 팔레트 ───────────────────────────────────────────────────
  // bg = 배경 색, ink = 그 위 글자색 (같은 색상의 진한 톤 — 레퍼런스 방식).
  // 기존 calligraphy 의 비비드/뮤트 팔레트는 톤이 달라 그대로 쓰지 않는다.
  // **배열 순서가 시트 배색을 결정한다** — 색은 슬롯마다 이 순서대로 돈다.
  var PALETTE_RETRO = [
    { name: "blossom",    bg: "F6BFD0", ink: "C43A7A" },
    { name: "butter",     bg: "FBE49B", ink: "D98324" },
    { name: "lilac",      bg: "C9BCE8", ink: "6A4BA8" },
    { name: "sky",        bg: "A9D4EE", ink: "2E6FA3" },
    { name: "mint",       bg: "B4E3CE", ink: "2F7D5F" },
    { name: "peach",      bg: "FBC9A8", ink: "C75A2B" },
    { name: "sage",       bg: "CBD9AE", ink: "5B7333" },
    { name: "coral",      bg: "F7ADA2", ink: "C4433A" },
    { name: "periwinkle", bg: "B6C4EE", ink: "41539E" },
    { name: "apricot",    bg: "F6D8B0", ink: "B07433" },
    { name: "rosewood",   bg: "E3B7B0", ink: "9A4A46" },
    { name: "aqua",       bg: "A9DDDA", ink: "1F7370" }
  ];

  // 홀리데이 — 레트로와 같은 채도를 유지하고 색상만 옮겼다. 채도를 올려 정통
  // 레드·그린으로 가면 사진이 배경에 눌린다 (사진이 주인공인 상품이다).
  // 빨강 → 초록 → 뉴트럴 순으로 번갈아 배열해야 한 시트가 크리스마스로 읽힌다.
  var PALETTE_HOLIDAY = [
    { name: "cranberry",   bg: "E8A9AE", ink: "A32B3E" },
    { name: "spruce",      bg: "A8C6AE", ink: "2E6A44" },
    { name: "cream oat",   bg: "F2E4C9", ink: "A5642B" },
    { name: "candy red",   bg: "F2B0A6", ink: "C0362C" },
    { name: "sage",        bg: "C6D6B4", ink: "52713A" },
    { name: "ice blue",    bg: "B9D3E6", ink: "2F5E86" },
    { name: "mulled wine", bg: "D9AEBE", ink: "8A3557" },
    { name: "pine",        bg: "9FBFB4", ink: "26635A" },
    { name: "gold",        bg: "EFD49B", ink: "A87B24" }
  ];

  // ── 테마 ─────────────────────────────────────────────────────
  // 팔레트 + 줄무늬 각도 + 눈더미 + 기본 문구를 한 묶음으로 고른다.
  // 따로 쪼개면 다이얼로그 항목만 늘고 조합 대부분이 무의미해서 묶었다.
  // 다음 시즌(할로윈 등)은 이 표에 한 줄 추가하면 된다.
  var THEMES = [
    { label: "레트로 파스텔 (생일)", tag: "",     palette: PALETTE_RETRO,
      stripeAngle: 0,  snow: false,
      topText: "OLIVIA'S 21ST BIRTHDAY",    bottomText: "Est. 2004" },
    { label: "크리스마스",           tag: "XMAS", palette: PALETTE_HOLIDAY,
      stripeAngle: 45, snow: true,
      topText: "OLIVIA'S FIRST CHRISTMAS",  bottomText: "2026" }
  ];
  var THEME_DEFAULT = 0;

  var COLOR_MODE_OPTIONS = ["슬롯마다 순환 (레퍼런스)", "디자인마다 고정"];
  var COLOR_MODE_DEFAULT = 0;

  // ── 안쪽 원 배경 ──────────────────────────────────────────────
  // 누끼 피사체가 앉는 바닥. "링 색 그대로" 면 안쪽 원을 그리지 않는다.
  var DISC_OPTIONS = ["흰색", "크림", "링 색 그대로"];
  var DISC_HEX     = ["FFFFFF", "FAF3E7", null];
  var DISC_DEFAULT = 0;

  // ── 서체 · 흰 테두리 (레이아웃 고정 — 운영자 선택 항목 아님) ──
  // 2026-08-27 사용자 지정. 링은 얇은 Medium 에 테두리 없이 깔끔하게,
  // 스트라이프는 줄무늬 위에서 읽혀야 하니 굵은 ExtraBold + 흰 테두리.
  // 설치 확인: ~/Library/Fonts 에 Fredoka-Medium.ttf, Baloo2-ExtraBold.ttf.
  // cands 의 첫 항목이 없으면 다음으로 폴백한다. 인덱스 = LAYOUT_RING / LAYOUT_STRIPE.
  var LAYOUT_TYPE = [
    { name: "Fredoka Medium",    cands: ["Fredoka-Medium", "Fredoka-SemiBold", "Fredoka-Bold"], halo: false },
    { name: "Baloo 2 ExtraBold", cands: ["Baloo2-ExtraBold", "Baloo2-Bold"],                    halo: true }
  ];



  // ═══════════════════════════════════════════════════════
  //  MAIN
  // ═══════════════════════════════════════════════════════
  var folder = _launchFolder() ||
    Folder.selectDialog("02_cutout 폴더 선택 (_clean.psd + _sil.png 페어)");
  if (!folder) return;

  var pairs = _collectPairs(folder);
  if (pairs.length === 0) {
    alert("선택한 폴더에 _clean.psd 가 없습니다.");
    return;
  }

  var opt = _showDialog(pairs, folder);
  if (!opt) return;

  // 선택 페어별 _sil 트레이스 (피사체 실제 bbox: 바닥 + 가로중심)
  var noSil = 0;
  for (var si = 0; si < opt.selectedPairs.length; si++) {
    opt.selectedPairs[si].silInfo = null;
    if (opt.selectedPairs[si].sil) {
      try { opt.selectedPairs[si].silInfo = _silSubjectInfo(opt.selectedPairs[si].sil); } catch (eSil) {}
    }
    if (!opt.selectedPairs[si].silInfo) noSil++;
  }

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
    var D    = opt.sizeMm * MM_TO_PT;
    var padX = BODY_PADDING_X_MM * MM_TO_PT;
    var padY = BODY_PADDING_Y_MM * MM_TO_PT;
    // 블리드를 쓰면 이웃 배경끼리 겹치므로 간격을 블리드 2배까지 벌린다
    // (실측: 1.5" / 2" / 2.5" 모두 슬롯 수는 그대로).
    var bleedMm = -opt.cutMarginMm;
    if (bleedMm < 0) bleedMm = 0;
    var gapMm = GAP_DEFAULT_MM;
    if (2 * bleedMm > gapMm) gapMm = 2 * bleedMm;
    var gap  = gapMm * MM_TO_PT;

    var templateFile = _resolveTemplate();
    if (!templateFile || !templateFile.exists) {
      alert(TEMPLATE_NAME + " 를 찾을 수 없습니다.\n스크립트와 같은 위치의 templates/ 폴더를 확인하세요.");
      return;
    }
    var doc = _openTemplateDoc(templateFile);

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

    var bb = bodyPath.geometricBounds;   // [L, T, R, B]  (T > B, y-up)
    var bL = bb[0], bT = bb[1], bR = bb[2], bB = bb[3];
    var binW = (bR - bL) - 2 * padX;
    var binH = (bT - bB) - 2 * padY;
    if (binW <= 0 || binH <= 0) {
      alert("info > body 영역이 padding 보다 작습니다.");
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
    var theme = THEMES[opt.themeIdx] || THEMES[0];
    var placed = 0, failed = 0, minFontPt = 1e9;
    for (var i = 0; i < cells.length; i++) {
      var pair = sel[i % sel.length];                // 슬롯 round-robin
      var swatch = _swatchFor(theme.palette, opt.colorMode, i, i % sel.length);
      var ccx = bL + padX + cells[i].x + D / 2;
      var ccy = bT - padY - cells[i].y - D / 2;
      try {
        var used = _composeBadgeAt(doc, printLayer, kissLayer, cutSpot, pair, opt, swatch, ccx, ccy, D);
        if (used < minFontPt) minFontPt = used;
        placed++;
      } catch (eC) {
        failed++;
      }
    }

    // z-order 위→아래 = KissCut → info(템플릿) → PrintData (CLAUDE.md 고정 컨벤션).
    try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eK) {}
    try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (eP) {}
    doc.selection = null;

    _drawHeader(opt, sel.length, headerText);

    var savedPath = "", saveErr = "";
    try {
      var outF = _resolveOutputFolder(folder);
      var themeTag = theme.tag;
      if (themeTag) themeTag = themeTag + "_";
      var fname = _timestamp() + "_" + themeTag + _layoutTag(opt.layout) + "_" +
                  _sizeTag(opt.sizeMm) + "_sheet01.ai";
      var sf = new File(outF.fsName + "/" + fname);
      _saveAi(doc, sf);
      savedPath = sf.fsName;
    } catch (eS) {
      saveErr = (eS && eS.message) ? eS.message : String(eS);
    }

    var cols = _gridCols(binW, D, gap);
    var rows = (cols > 0) ? Math.round(cells.length / cols) : 0;
    if (minFontPt > 1e8) minFontPt = 0;

    alert(
      "완료: " + _layoutName(opt.layout) + " 시트\n\n" +
      "테마: " + theme.label + (theme.snow ? " + 눈더미" : "") +
        (theme.stripeAngle ? ("  /  줄무늬 " + theme.stripeAngle + "°") : "") + "\n" +
      "레이아웃: " + _layoutName(opt.layout) + "  /  세로 정렬: " + ALIGN_OPTIONS[opt.alignMode] + "\n" +
      "사이즈: " + opt.sizeMm + "mm (" + _sizeTag(opt.sizeMm) + ")  /  칼선: " + opt.cutMarginMm +
        "mm  /  얼굴 " + opt.subjectPct + "%  /  세로 " + opt.yBiasPct + "%\n" +
      "위: " + (opt.topText || "—") + "\n" +
      "아래: " + (opt.bottomText || "—") + "\n" +
      "서체: " + LAYOUT_TYPE[opt.layout].name +
        "  /  글자 " + minFontPt.toFixed(1) + "pt" + (LAYOUT_TYPE[opt.layout].halo ? " + 흰 테두리" : "") +
        "  /  색: " + COLOR_MODE_OPTIONS[opt.colorMode] + "\n" +
      "격자: " + cols + "×" + rows + " = " + cells.length + " 슬롯  /  선택 디자인 " + sel.length + "개\n" +
      "배치: " + placed + "개" + (failed > 0 ? ("  (실패 " + failed + ")") : "") + "\n" +
      (noSil > 0 ? ("⚠ _sil 없는 디자인 " + noSil + "개 — 이미지 전체를 피사체로 간주(여백 생길 수 있음)\n") : "") +
      (minFontPt > 0 && minFontPt < LEGIBILITY_MIN_PT
        ? ("⚠ 글자가 " + minFontPt.toFixed(1) + "pt 까지 줄었습니다 — 문구를 줄이거나 사이즈를 올리세요.\n") : "") +
      "헤더: " + (opt.customerName || "—") + " 주입 완료  /  템플릿: " + TEMPLATE_NAME + "\n\n" +
      (savedPath ? ("저장: " + savedPath) :
                   ("저장 실패: " + (saveErr || "unknown") + " — 직접 저장하세요.")) + "\n\n" +
      "확인: 칼선=바깥 원 정합 / 얼굴이 원 안에 여백 두고 들어갔는지 / 링 폭 대비 글자."
    );
  }

  // 팔레트 선택. 중첩 삼항 금지 규약대로 if/else.
  function _swatchFor(palette, colorMode, slotIdx, designIdx) {
    if (colorMode === 1) return palette[designIdx % palette.length];
    return palette[slotIdx % palette.length];
  }

  // 셀 좌상단 좌표 목록 (bin 좌상단 기준, x 오른쪽·y 아래). 균일 D×D 격자, 중앙 정렬.
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
  //  BADGE COMPOSITION
  //  생성 순서가 곧 z-order 다 (새 아이템은 항상 레이어 맨 위).
  //  링 → 사진 클립 그룹 → 텍스트 순으로 만들면 텍스트가 맨 위에 온다.
  // ═══════════════════════════════════════════════════════
  function _composeBadgeAt(doc, printLayer, kissLayer, cutSpot, pair, opt, swatch, cx, cy, D) {
    // 블리드 — 배경만 칼선 밖으로 나간다. 디자인(사진·글자) 치수는 D 기준 그대로라
    // 블리드를 켜고 꺼도 구도가 안 변한다.
    var theme = THEMES[opt.themeIdx] || THEMES[0];
    var bleed = -opt.cutMarginMm * MM_TO_PT;
    if (bleed < 0) bleed = 0;
    var dArt   = D;                       // 디자인 = 칼선 지름
    var rArt   = dArt / 2;
    var dBg    = dArt + 2 * bleed;        // 실제로 그려지는 배경 원 지름
    var rBg    = dBg / 2;
    var isStripe = (opt.layout === LAYOUT_STRIPE);

    // 사진 — fit 은 디자인 지름 기준, 클립은 배경 지름 기준(스트라이프는 사진도 블리드)
    var dPhoto = dArt;
    if (!isStripe) dPhoto = dArt * PHOTO_RATIO;
    var rPhoto = dPhoto / 2;
    var dClip  = dPhoto;
    if (isStripe) dClip = dBg;
    var rClip  = dClip / 2;

    // ① 배경
    if (isStripe) {
      _makeStripeGroup(printLayer, cx, cy, dBg, dArt * STRIPE_W_RATIO, swatch.bg, theme.stripeAngle);
    } else {
      var ring = printLayer.pathItems.ellipse(cy + rBg, cx - rBg, dBg, dBg);
      ring.stroked = false;
      ring.filled  = true;
      ring.fillColor = _hexToRGB(swatch.bg);
    }

    // ② 안쪽 원 배경 (링만) + 사진
    var disc = null;
    if (!isStripe) {
      var discHex = DISC_HEX[opt.discIdx];
      disc = printLayer.pathItems.ellipse(cy + rPhoto, cx - rPhoto, dPhoto, dPhoto);
      disc.stroked = false;
      disc.filled  = true;
      if (discHex) {
        disc.fillColor = _hexToRGB(discHex);
      } else {
        disc.fillColor = _hexToRGB(swatch.bg);
      }
    }

    doc.activeLayer = printLayer;
    var photo = printLayer.placedItems.add();
    photo.file = pair.clean;
    var iw = photo.width, ih = photo.height;

    // 피사체 bbox 를 원에 contain fit. _sil 이 없으면 이미지 전체를 피사체로 본다.
    var fw = 1, fh = 1, fcx = 0.5, fcy = 0.5;
    if (pair.silInfo) {
      fw  = pair.silInfo.wFrac;
      fh  = pair.silInfo.hFrac;
      fcx = pair.silInfo.centerXFrac;
      fcy = pair.silInfo.centerYFrac;
    }
    var target = dPhoto * (opt.subjectPct / 100);
    var pw = target / Math.max(fw, fh * (ih / iw));   // 피사체 긴 변 = target
    var ph = pw * (ih / iw);
    photo.width = pw;
    photo.height = ph;

    // fcx/fcy 는 이미지 좌상단 기준 피사체 중심 분율.
    var yOff = (opt.yBiasPct / 100) * dPhoto;   // + = 위로
    photo.left = cx - fcx * pw;
    if (opt.alignMode === ALIGN_BOTTOM) {
      // 피사체 바닥을 원 바닥에 — 레퍼런스 스트라이프처럼 하단에서 잘린다
      photo.top = (cy - rPhoto) - SUBJECT_BLEED * dPhoto + (fcy + fh / 2) * ph + yOff;
    } else {
      photo.top = cy + fcy * ph + yOff;
    }

    var art = photo;
    if (opt.embed) {
      var pL = photo.left, pT = photo.top, pW = photo.width, pH = photo.height;
      photo.embed();
      art = _findEmbeddedNear(printLayer, pL, pT, pW, pH);
      if (!art) throw new Error("embed 재탐색 실패 (" + pair.base + ")");
    }

    // 클립 그룹: [clip(앞) · 사진 · (링이면 안쪽 원 배경)(뒤)]
    var grp = printLayer.groupItems.add();
    if (disc) disc.move(grp, ElementPlacement.PLACEATEND);
    art.move(grp, ElementPlacement.PLACEATBEGINNING);
    if (theme.snow && !isStripe) {
      // 사진 위, 클립 아래 — 피사체가 눈 위에 선 것처럼 보인다
      _makeSnowDrift(printLayer, cx, cy, rPhoto).move(grp, ElementPlacement.PLACEATBEGINNING);
    }
    var clip = printLayer.pathItems.ellipse(cy + rClip, cx - rClip, dClip, dClip);
    clip.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.clipping = true;
    grp.clipped = true;

    // ③ 곡선 텍스트
    var fontSize = dArt * RING_FONT_RATIO;
    var capH = fontSize * CAP_HEIGHT_RATIO;
    var usedPt = fontSize;

    if (isStripe) {
      // 원 가장자리 안쪽에 붙인다. 아래 텍스트는 사진이 덮으므로 쓰지 않는다.
      if (opt.topText) {
        var rTopS = rArt - STRIPE_TEXT_EDGE * dArt - capH;
        var ts = _addArcText(printLayer, opt, opt.topText, cx, cy, rTopS,
                             90 + TOP_SPAN_DEG / 2, 90 - TOP_SPAN_DEG / 2, fontSize, swatch.ink);
        if (ts < usedPt) usedPt = ts;
      }
    } else {
      var band = rArt - rPhoto;
      var inset = (band - capH) / 2;
      if (inset < 0) inset = 0;
      if (opt.topText) {
        var rTop = rPhoto + inset;                  // 글자가 밴드 안에서 바깥으로 자람
        var t1 = _addArcText(printLayer, opt, opt.topText, cx, cy, rTop,
                             90 + TOP_SPAN_DEG / 2, 90 - TOP_SPAN_DEG / 2, fontSize, swatch.ink);
        if (t1 < usedPt) usedPt = t1;
      }
      if (opt.bottomText) {
        var rBot = rArt - inset;                    // 글자가 밴드 안에서 안쪽으로 자람
        var t2 = _addArcText(printLayer, opt, opt.bottomText, cx, cy, rBot,
                             270 - BOTTOM_SPAN_DEG / 2, 270 + BOTTOM_SPAN_DEG / 2, fontSize, swatch.ink);
        if (t2 < usedPt) usedPt = t2;
      }
    }

    // ④ 칼선 — 항상 셀 경계(D). 블리드는 배경을 밖으로 키워서 준다.
    var cut = kissLayer.pathItems.ellipse(cy + D / 2, cx - D / 2, D, D);
    _forceCutContourStroke(cut, cutSpot);

    return usedPt;
  }


  // 세로 줄무늬 원판 — 흰 바탕 + 색 줄을 등간격으로 놓고 원으로 클립.
  // 중앙에 색 줄이 오도록 대칭 배치한다 (레퍼런스와 동일).
  function _makeStripeGroup(layer, cx, cy, d, stripeW, hex, angleDeg) {
    var r = d / 2;
    var w = stripeW;              // 줄 하나 폭 (블리드와 무관하게 디자인 지름 기준)
    var pitch = w * 2;            // 색 + 흰 한 쌍
    var grp = layer.groupItems.add();

    var base = layer.pathItems.ellipse(cy + r, cx - r, d, d);
    base.stroked = false;
    base.filled  = true;
    base.fillColor = _hexToRGB(STRIPE_BASE_HEX);
    base.move(grp, ElementPlacement.PLACEATEND);

    // 줄은 별도 하위 그룹에 모아 통째로 돌린다 (캔디케인 = 45°).
    // 줄 길이 d 는 회전 후에도 충분하다 — 중심에서 x 만큼 떨어진 줄이 원을 가로지르는
    // 길이는 2·sqrt(r²−x²) ≤ 2r = d 이므로.
    var bars = layer.groupItems.add();
    var n = Math.ceil(r / pitch) + 1;
    for (var k = -n; k <= n; k++) {
      var rect = layer.pathItems.rectangle(cy + r, cx + k * pitch - w / 2, w, d);
      rect.stroked = false;
      rect.filled  = true;
      rect.fillColor = _hexToRGB(hex);
      rect.move(bars, ElementPlacement.PLACEATBEGINNING);
    }
    // bars 는 (cx, cy) 대칭이라 자기 중심 회전 = 원 중심 회전
    if (angleDeg) { try { bars.rotate(angleDeg); } catch (eRot) {} }
    bars.move(grp, ElementPlacement.PLACEATBEGINNING);

    var clip = layer.pathItems.ellipse(cy + r, cx - r, d, d);
    clip.move(grp, ElementPlacement.PLACEATBEGINNING);
    clip.clipping = true;
    grp.clipped = true;
    return grp;
  }


  // 눈더미 — 사진창 하단의 흰 언덕. 창보다 좌우로 넓게 그려 클립으로 잘라낸다.
  // 정규화 점 표(x = cx + u·r, y = cy + v·r)만 고치면 능선이 바뀐다.
  // pointType 은 전부 CORNER — SMOOTH 는 핸들을 일직선으로 강제해 물결이 죽는다
  // (shapes.jsx _makeHeart 와 같은 이유).
  function _makeSnowDrift(layer, cx, cy, r) {
    var c = SNOW_CREST;
    var pts = [
      [[-1.30, -1.40],    [-1.30, -1.40],     [-1.30, -1.40]],
      [[-1.30, c - 0.06], [-1.30, c - 0.06],  [-0.95, c + 0.13]],
      [[-0.17, c],        [-0.58, c - 0.20],  [ 0.25, c + 0.18]],
      [[ 1.30, c],        [ 0.70, c - 0.19],  [ 1.30, c]],
      [[ 1.30, -1.40],    [ 1.30, -1.40],     [ 1.30, -1.40]]
    ];
    var p = layer.pathItems.add();
    for (var i = 0; i < pts.length; i++) {
      var pp = p.pathPoints.add();
      pp.anchor         = [cx + pts[i][0][0] * r, cy + pts[i][0][1] * r];
      pp.leftDirection  = [cx + pts[i][1][0] * r, cy + pts[i][1][1] * r];
      pp.rightDirection = [cx + pts[i][2][0] * r, cy + pts[i][2][1] * r];
      pp.pointType = PointType.CORNER;
    }
    p.closed  = true;
    p.stroked = false;
    p.filled  = true;
    p.fillColor = _hexToRGB(SNOW_HEX);
    return p;
  }


  // ═══════════════════════════════════════════════════════
  //  ARC TEXT
  //  아치 패스를 직접 만들고 pathText + 가운데 정렬로 얹는다.
  //  (with_name 의 _addCurvedName 과 같은 방식 — 패스만 원호로 교체)
  // ═══════════════════════════════════════════════════════
  function _addArcText(layer, opt, rawText, cx, cy, radius, a0Deg, a1Deg, fontSize, inkHex) {
    var content = _composeHangulNFC(rawText);
    var spec = LAYOUT_TYPE[opt.layout] || LAYOUT_TYPE[0];
    var font = _resolveFont(spec.cands);
    var spanRad = Math.abs((a1Deg - a0Deg) * Math.PI / 180);
    var arcLen = radius * spanRad * FIT_MARGIN;

    // 프로브로 폭 실측 → 장평 → 그래도 넘치면 폰트 크기 축소.
    var probe = layer.textFrames.pointText([cx, cy]);
    probe.contents = content;
    var pa = probe.textRange.characterAttributes;
    if (font) pa.textFont = font;
    pa.size = fontSize;
    pa.tracking = RING_TRACKING;
    pa.horizontalScale = 100;
    var pb = probe.geometricBounds;
    var probeW = pb[2] - pb[0];
    probe.remove();

    var hScale = 100;
    if (probeW > arcLen && probeW > 0) {
      var need = 100 * arcLen / probeW;
      if (need >= MIN_H_SCALE) {
        hScale = need;
      } else {
        hScale = MIN_H_SCALE;
        fontSize = Math.max(3, fontSize * need / MIN_H_SCALE);
      }
    }

    // 헤일로(뒤) → 본체(앞) 순으로 만든다. 둘 다 PLACEATBEGINNING 이라 나중 게 위로 온다.
    // 같은 파라미터로 아크를 다시 그리므로 두 카피는 정확히 겹친다.
    if (spec.halo) {
      _makeArcFrame(layer, content, font, cx, cy, radius, a0Deg, a1Deg,
                    fontSize, hScale, HALO_HEX, HALO_HEX, fontSize * HALO_RATIO);
    }
    _makeArcFrame(layer, content, font, cx, cy, radius, a0Deg, a1Deg,
                  fontSize, hScale, inkHex, null, 0);
    return fontSize;
  }

  // 아크 하나 + 그 위의 pathText 한 벌. 헤일로/본체가 같은 코드를 쓴다.
  function _makeArcFrame(layer, content, font, cx, cy, radius, a0Deg, a1Deg,
                         fontSize, hScale, fillHex, strokeHex, strokeW) {
    var arc = _arcPath(layer, cx, cy, radius, a0Deg, a1Deg);
    var frame = layer.textFrames.pathText(arc);
    try { frame.move(layer, ElementPlacement.PLACEATBEGINNING); } catch (eMove) {}
    frame.contents = content;
    var rng = frame.textRange;
    if (font) rng.characterAttributes.textFont = font;
    rng.characterAttributes.size = fontSize;
    rng.characterAttributes.tracking = RING_TRACKING;
    rng.characterAttributes.horizontalScale = hScale;
    rng.characterAttributes.fillColor = _hexToRGB(fillHex);
    if (strokeHex && strokeW > 0) {
      rng.characterAttributes.strokeColor = _hexToRGB(strokeHex);
      rng.characterAttributes.strokeWeight = strokeW;
    } else {
      rng.characterAttributes.strokeWeight = 0;
    }
    try { rng.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}
    _applyHangulFontOverride(frame, _resolveHangulFont());
    return frame;
  }

  // 원호 베지어. a0 → a1 (도, y-up 수학 좌표). 부호가 곧 진행 방향이다.
  // 90° 이하로 쪼개고 세그먼트마다 k = 4/3·tan(Δ/4) 핸들을 접선 방향으로 준다.
  function _arcPath(container, cx, cy, r, a0Deg, a1Deg) {
    var a0 = a0Deg * Math.PI / 180;
    var a1 = a1Deg * Math.PI / 180;
    var total = a1 - a0;
    var segs = Math.ceil(Math.abs(total) / (Math.PI / 2));
    if (segs < 1) segs = 1;
    var da = total / segs;
    var k = (4 / 3) * Math.tan(da / 4);

    var p = container.pathItems.add();
    p.filled = false;
    p.stroked = false;
    for (var i = 0; i <= segs; i++) {
      var a = a0 + da * i;
      var x = cx + r * Math.cos(a);
      var y = cy + r * Math.sin(a);
      var tx = -r * Math.sin(a);      // dP/da — 접선
      var ty =  r * Math.cos(a);
      var pp = p.pathPoints.add();
      pp.anchor         = [x, y];
      pp.leftDirection  = [x - k * tx, y - k * ty];
      pp.rightDirection = [x + k * tx, y + k * ty];
      pp.pointType = PointType.SMOOTH;   // 핸들이 실제로 접선상 collinear 라 안전
    }
    p.closed = false;
    return p;
  }


  // ═══════════════════════════════════════════════════════
  //  SIL 피사체 레퍼런스 (shapes.jsx 동일)
  //  _clean.psd 는 trim 안 됨(Phase A) → 피사체 실제 바닥/가로중심은 _sil 에서.
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
        wFrac:       (maxX - minX) / cw,
        hFrac:       (maxY - minY) / ch,
        centerXFrac: ((minX + maxX) / 2) / cw,
        centerYFrac: (ch - (minY + maxY) / 2) / ch   // 캔버스 top 기준 피사체 세로중심
      };
    } finally {
      try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {}
    }
  }


  // ═══════════════════════════════════════════════════════
  //  EMBED 재탐색 (shapes.jsx / mixed 동일)
  // ═══════════════════════════════════════════════════════
  function _findEmbeddedNear(layer, L, T, W, H) {
    for (var i = 0; i < layer.groupItems.length; i++) {
      var g = layer.groupItems[i];
      if (g.clipped) continue;
      if (_boundsMatch(g.geometricBounds, L, T, W, H)) { _stripPSDPaths(g); return g; }
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
  //  CUTCONTOUR (Everstory_mixed.jsx 규약 — M=100 SPOT, 0.25pt)
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

  // macOS 파일명/입력이 NFD 로 들어오면 조합해서 NFC 로 (shapes.jsx 동일)
  function _composeHangulNFC(s) {
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

  // 서수 오타 검사 (레퍼런스 이미지의 "21TH" 같은 것). 값을 고치지 않고 물어보기만 한다.
  function _ordinalTypo(text) {
    if (!text) return null;
    var m = /(\d+)\s*(ST|ND|RD|TH)/i.exec(text);
    if (!m) return null;
    var n = parseInt(m[1], 10);
    var want = "TH";
    var mod100 = n % 100;
    if (mod100 < 11 || mod100 > 13) {
      var mod10 = n % 10;
      if (mod10 === 1) want = "ST";
      else if (mod10 === 2) want = "ND";
      else if (mod10 === 3) want = "RD";
    }
    if (want === m[2].toUpperCase()) return null;
    return { found: m[1] + m[2], want: m[1] + want };
  }


  // ═══════════════════════════════════════════════════════
  //  FILE / SAVE HELPERS
  // ═══════════════════════════════════════════════════════
  // 주문 보드가 넘겨준 폴더 (consume-once — 다음 수동 실행 오염 방지)
  function _launchFolder() {
    var payload = null;
    try { payload = $.global.__EVERSTORY_LAUNCH__; } catch (e) { return null; }
    try { $.global.__EVERSTORY_LAUNCH__ = undefined; } catch (e2) {}
    if (!payload) return null;
    var f = new Folder(String(payload));
    if (f.exists) return f;
    return null;
  }

  function _collectPairs(folder) {
    var cleans = folder.getFiles(function (f) {
      return f instanceof File && /_clean\.psd$/i.test(f.name);
    });
    var out = [];
    for (var i = 0; i < cleans.length; i++) {
      var silPath = cleans[i].fsName.replace(/_clean\.psd$/i, "_sil.png");
      var sil = new File(silPath);
      out.push({
        // File.name 은 ExtendScript 에서 URI 인코딩(%ED%95%98…)돼 나오고 macOS
        // 파일명은 NFD 라 자모가 분리된다. 둘 다 풀어야 다이얼로그에서 안 깨진다.
        base: _decodeName(cleans[i].name.replace(/_clean\.psd$/i, "")),
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

  function _deriveDefaultCustomerName(folder) {
    var f = folder;
    if (f.name.toLowerCase() === "02_cutout" && f.parent) f = f.parent;
    return _decodeName(f.name);
  }

  function _decodeName(s) {
    try { return _composeHangulNFC(decodeURI(s)); } catch (e) { return _composeHangulNFC(s); }
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

  function _themeLabels() {
    var out = [];
    for (var i = 0; i < THEMES.length; i++) out.push(THEMES[i].label);
    return out;
  }

  function _isThemeDefaultText(v, key) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i][key] === v) return true;
    }
    return false;
  }

  function _layoutTag(layout) {
    if (layout === LAYOUT_STRIPE) return "STRIPE";
    return "RING";
  }

  function _layoutName(layout) {
    if (layout === LAYOUT_STRIPE) return "Stripe badge";
    return "Ring badge";
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

  function _num(t, d) {
    var v = parseFloat(t);
    return isNaN(v) ? d : v;
  }

  function _trim(s) {
    return String(s).replace(/^\s+|\s+$/g, "");
  }


  // ═══════════════════════════════════════════════════════
  //  BRAND TEMPLATE (template_cutout_v2.ait) — mixed/shapes 방식 그대로
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

  function _drawHeader(opt, designCount, headerText) {
    var line1 = _composeHangulNFC(opt.customerName || "—") +
                " • " + _layoutName(opt.layout) + " • " + _sizeTag(opt.sizeMm) + " / " + opt.sizeMm + "mm";
    var line2 = designCount + " design(s)";
    var line3 = "date: " + (opt.orderDate || _todayStr());
    headerText.contents = line1 + "\r" + line2 + "\r" + line3;
    _applyHangulFontOverride(headerText, _resolveHangulFont());
  }


  // ═══════════════════════════════════════════════════════
  //  DIALOG
  // ═══════════════════════════════════════════════════════
  function _showDialog(pairs, folder) {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 16;
    dlg.spacing = 10;

    // ── 텍스트 (시트 전체 공통 한 세트) ──
    var pT = dlg.add("panel", undefined, "텍스트 (시트 전체 공통)");
    pT.orientation = "column"; pT.alignChildren = "fill";
    pT.margins = [12, 16, 12, 12]; pT.spacing = 6;

    var gTop = pT.add("group");
    gTop.add("statictext", undefined, "윗줄 (아치)");
    var fTop = gTop.add("edittext", undefined, THEMES[THEME_DEFAULT].topText);
    fTop.preferredSize = [260, 22];
    var upperChk = gTop.add("checkbox", undefined, "대문자");
    upperChk.value = true;

    var gBot = pT.add("group");
    gBot.add("statictext", undefined, "아랫줄        ");
    var fBot = gBot.add("edittext", undefined, THEMES[THEME_DEFAULT].bottomText);
    fBot.preferredSize = [260, 22];

    // 서체와 흰 테두리는 레이아웃이 정한다 (선택 항목 아님) — 뭘 쓰는지만 보여준다.
    var gFont = pT.add("group");
    gFont.add("statictext", undefined, "서체            ");
    var fontLbl = gFont.add("statictext", undefined, "", { truncate: "end" });
    fontLbl.preferredSize = [330, 20];

    // ── 디자인 ──
    var pD = dlg.add("panel", undefined, "디자인");
    pD.orientation = "column"; pD.alignChildren = "fill";
    pD.margins = [12, 16, 12, 12]; pD.spacing = 6;

    var gTheme = pD.add("group");
    gTheme.add("statictext", undefined, "테마          ");
    var themeDd = gTheme.add("dropdownlist", undefined, _themeLabels());
    themeDd.selection = THEME_DEFAULT; themeDd.preferredSize = [200, 24];
    gTheme.add("statictext", undefined, "팔레트 · 줄무늬 각도 · 기본 문구");

    // 손대지 않은 기본 문구만 테마 것으로 갈아끼운다 (직접 친 문구는 보존).
    themeDd.onChange = function () {
      var th = THEMES[themeDd.selection.index];
      if (_isThemeDefaultText(_trim(fTop.text), "topText")) fTop.text = th.topText;
      if (_isThemeDefaultText(_trim(fBot.text), "bottomText")) fBot.text = th.bottomText;
      // colorLbl 은 아래에서 만들어진다 — 다이얼로그가 뜬 뒤에만 호출되므로 안전하다.
      if (colorLbl) colorLbl.text = th.palette.length + "색";
    };

    var gLayout = pD.add("group");
    gLayout.add("statictext", undefined, "레이아웃    ");
    var layoutDd = gLayout.add("dropdownlist", undefined, LAYOUT_OPTIONS);
    layoutDd.selection = LAYOUT_DEFAULT; layoutDd.preferredSize = [330, 24];

    var gSize = pD.add("group");
    gSize.add("statictext", undefined, "사이즈       ");
    var sizeDd = gSize.add("dropdownlist", undefined, SIZE_OPTIONS);
    sizeDd.selection = SIZE_DEFAULT; sizeDd.preferredSize = [200, 24];

    var gColor = pD.add("group");
    gColor.add("statictext", undefined, "색 순환      ");
    var colorDd = gColor.add("dropdownlist", undefined, COLOR_MODE_OPTIONS);
    colorDd.selection = COLOR_MODE_DEFAULT; colorDd.preferredSize = [200, 24];
    // 팔레트는 테마가 정한다 — 몇 색인지만 보여주고 테마 바뀌면 갱신한다.
    var colorLbl = gColor.add("statictext", undefined,
      THEMES[THEME_DEFAULT].palette.length + "색", { truncate: "end" });
    colorLbl.preferredSize = [120, 20];

    var gDisc = pD.add("group");
    gDisc.add("statictext", undefined, "안쪽 원      ");
    var discDd = gDisc.add("dropdownlist", undefined, DISC_OPTIONS);
    discDd.selection = DISC_DEFAULT; discDd.preferredSize = [200, 24];
    gDisc.add("statictext", undefined, "누끼 피사체가 앉는 바닥");

    var gCrop = pD.add("group");
    gCrop.add("statictext", undefined, "얼굴 크기 % ");
    var fCrop = gCrop.add("edittext", undefined, String(DEF_SUBJECT_PCT));
    fCrop.preferredSize = [60, 22];
    gCrop.add("statictext", undefined, "원 지름 대비 — 클수록 얼굴 큼");

    var gAlign = pD.add("group");
    gAlign.add("statictext", undefined, "세로 정렬   ");
    var alignDd = gAlign.add("dropdownlist", undefined, ALIGN_OPTIONS);
    alignDd.selection = ALIGN_CENTER; alignDd.preferredSize = [200, 24];
    gAlign.add("statictext", undefined, "세로 위치");
    var fYBias = gAlign.add("edittext", undefined, String(DEF_Y_BIAS_PCT));
    fYBias.preferredSize = [50, 22];
    gAlign.add("statictext", undefined, "% (+위 / −아래)");

    // 레이아웃을 바꾸면 그 레이아웃의 기본값으로 되돌린다 (손으로 고치는 건 그 뒤에).
    layoutDd.onChange = function () {
      var stripe = (layoutDd.selection.index === LAYOUT_STRIPE);
      fBot.enabled   = !stripe;   // 스트라이프는 사진이 하단을 덮어 아래 텍스트를 안 쓴다
      discDd.enabled = !stripe;   // 안쪽 원도 없다
      if (stripe) {
        fCrop.text = String(STRIPE_SUBJECT_PCT);
        fYBias.text = String(STRIPE_Y_BIAS_PCT);
        alignDd.selection = ALIGN_BOTTOM;
      } else {
        fCrop.text = String(DEF_SUBJECT_PCT);
        fYBias.text = String(DEF_Y_BIAS_PCT);
        alignDd.selection = ALIGN_CENTER;
      }
      var spec = LAYOUT_TYPE[layoutDd.selection.index];
      var haloTxt = " (테두리 없음)";
      if (spec.halo) haloTxt = " + 흰 테두리";
      fontLbl.text = spec.name + haloTxt;
    };
    layoutDd.onChange();   // 초기 라벨·기본값 1회 반영

    // ── 제작 ──
    var pM = dlg.add("panel", undefined, "제작");
    pM.orientation = "column"; pM.alignChildren = "fill";
    pM.margins = [12, 16, 12, 12]; pM.spacing = 6;

    var gCut = pM.add("group");
    gCut.add("statictext", undefined, "칼선          ");
    var cutRadios = [];
    for (var cm = 0; cm < CUT_MARGIN_OPTIONS.length; cm++) {
      cutRadios.push(gCut.add("radiobutton", undefined, CUT_MARGIN_OPTIONS[cm]));
    }
    cutRadios[CUT_MARGIN_DEFAULT_INDEX].value = true;

    var gName = pM.add("group");
    gName.add("statictext", undefined, "고객 이름  ");
    var fName = gName.add("edittext", undefined, _deriveDefaultCustomerName(folder));
    fName.preferredSize = [180, 22];
    gName.add("statictext", undefined, "날짜");
    var fDate = gName.add("edittext", undefined, _todayStr());
    fDate.preferredSize = [100, 22];

    var embedChk = pM.add("checkbox", undefined, "사진 embed (해제 시 linked — 합성만 빠르게 확인)");
    embedChk.value = true;

    // ── 페어 ──
    var pP = dlg.add("panel", undefined, "사용할 페어 (multi-select)");
    pP.orientation = "column"; pP.alignChildren = "fill";
    pP.margins = [12, 16, 12, 12]; pP.spacing = 6;
    var items = [];
    for (var i = 0; i < pairs.length; i++) {
      items.push(pairs[i].base + (pairs[i].sil ? "" : "  (sil 없음)"));
    }
    var lb = pP.add("listbox", undefined, items, { multiselect: true });
    lb.preferredSize = [340, 130];
    lb.selection = 0;   // 기본 = 첫 번째 하나만 (2026-08-27). 여러 개는 손으로 골라 쓴다.

    var hint = dlg.add("statictext", undefined,
      "빈 칸은 그 줄을 생략합니다. 피사체 크기·위치는 _sil bbox 기준으로 원 안에 맞춥니다.");
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
      var stripeNow = (layoutDd.selection.index === LAYOUT_STRIPE);
      if (!_trim(fTop.text) && (stripeNow || !_trim(fBot.text))) {
        if (stripeNow) alert("스트라이프는 윗줄 텍스트가 필요합니다 (아래는 사진이 덮습니다).");
        else alert("윗줄/아랫줄 중 최소 하나는 입력하세요.");
        return;
      }
      var typo = _ordinalTypo(_trim(fTop.text)) || _ordinalTypo(_trim(fBot.text));
      if (typo) {
        if (!confirm("서수 표기 확인: \"" + typo.found + "\" → \"" + typo.want + "\" 아닌가요?\n\n" +
                     "그대로 진행할까요?")) return;
      }
      dlg.close(1);
    };

    if (dlg.show() !== 1) return null;

    var selectedPairs = [];
    var s = lb.selection;
    if (s) {
      if (s.length == null) s = [s];
      for (var j = 0; j < s.length; j++) selectedPairs.push(pairs[s[j].index]);
    }
    if (selectedPairs.length === 0) return null;

    var cutMarginMm = CUT_MARGIN_VALUES[CUT_MARGIN_DEFAULT_INDEX];
    for (var ci = 0; ci < cutRadios.length; ci++) {
      if (cutRadios[ci].value) { cutMarginMm = CUT_MARGIN_VALUES[ci]; break; }
    }

    var topText = _trim(fTop.text);
    if (upperChk.value) topText = topText.toUpperCase();

    var layoutIdx = layoutDd.selection.index;
    var bottomText = _trim(fBot.text);
    if (layoutIdx === LAYOUT_STRIPE) bottomText = "";   // 사진이 하단을 덮는다

    return {
      themeIdx:     themeDd.selection.index,
      layout:       layoutIdx,
      alignMode:    alignDd.selection.index,
      topText:      topText,
      bottomText:   bottomText,
      sizeMm:       SIZE_MM[sizeDd.selection.index],
      colorMode:    colorDd.selection.index,
      discIdx:      discDd.selection.index,
      subjectPct:   _num(fCrop.text, DEF_SUBJECT_PCT),
      yBiasPct:     _num(fYBias.text, DEF_Y_BIAS_PCT),
      cutMarginMm:  cutMarginMm,
      embed:        embedChk.value,
      customerName: _trim(fName.text),
      orderDate:    _trim(fDate.text),
      selectedPairs: selectedPairs
    };
  }

})();
