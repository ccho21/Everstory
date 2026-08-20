// ═══════════════════════════════════════════════════════════════
//  Everstory Calligraphy 시트 (문구 캘리그래피 다이컷 × 여러 장)
//
//  template_cutout_v2.ait (운영 v2 브랜드 템플릿) 위에, 입력한 문구를
//  캘리그래피 폰트로 조판 → 아웃라인 → 흰 헤일로 → union 칼선으로
//  만들어 info > body 안에 shelf(행) 패킹한다.
//
//  사진 파이프라인과 달리 입력이 PSD/PNG 페어가 아니라 텍스트이므로
//  Image Trace 가 없다. 칼선은 헤일로 스트로크를 expand 해서 만든다.
//
//  한 시트 안에서 줄마다 서체·색을 다르게 줄 수 있다 (이름 스티커).
//   · "줄마다 다른 스타일" = 톤별 프리셋 표를 순환
//   · 줄 단위 지정 = "이름 | 서체번호 | 글자색 | 배경색" (뒤 3개 생략 가능)
//
//  플로우: 문구/서체/높이/여백 다이얼로그 → 저장 폴더 선택 →
//  시트 생성 → info > header > header_right 값 주입 →
//  03_output/{ts}_CALLI{높이}_sheet01.ai 자동 저장.
//
//  함정 (mixed/with_name 에서 실측 — 되돌리지 말 것):
//   · Pathfinder 는 stroke-only/paint 없는 패스에서 빈 결과 — union 전
//     _copyPathsAsSolid 로 compound 를 풀고 솔리드 fill 부여.
//   · compound 를 풀어서 union 하면 글자 속구멍(o, ㅇ)이 메워진다 —
//     칼선은 바깥 윤곽만 따야 하므로 이게 의도된 동작이다.
//   · 여백은 스트로크가 아니라 Offset Path 라이브 이펙트로 준다.
//     Expand Appearance(expandStyle) 는 라이브 이펙트만 확장하고 평범한
//     스트로크는 그대로 두기 때문에, 스트로크 방식은 칼선이 글자에 딱
//     붙어버린다 (실측 확인).
//   · Offset Path 의 jntp 는 **0 이 round** 다. 통념(1=round)대로 두면
//     miter 가 걸려 획 끝마다 spike 가 생긴다.
//   · 크기 실측은 TextFrame 이 아니라 아웃라인 변환 후에 해야 한다.
//     TextFrame.geometricBounds 는 글리프가 아니라 폰트 메트릭 박스라
//     스크립트체에서 실제 잉크보다 2배까지 크다.
//   · createOutline() 은 원본 TextFrame 을 소모한다 — 재사용 금지.
//   · var 테이블은 호이스팅 안 됨. 메인 플로우보다 위에 둘 것.
// ═══════════════════════════════════════════════════════════════

// #target illustrator

(function () {
  "use strict";

  var SCRIPT_VARIANT = "calligraphy v1";
  var SCRIPT_TITLE = "Everstory Calligraphy Sheet (" + SCRIPT_VARIANT + ")";
  var MM_TO_PT = 2.834645;
  var TEMPLATE_NAME = "template_cutout_v2.ait";
  var BODY_PADDING_MM = 2;
  var GAP_DEFAULT_MM = 2.5;

  var PROBE_SIZE_PT = 200;      // 폭/높이 실측용 기준 사이즈
  var OFFSET_JOIN_ROUND = 0;    // Offset Path 의 round join (0 이 맞다 — _applyOffsetEffect 주석 참조)

  // ── 트렌디 처리 ───────────────────────────────────────────────
  // bouncy = 글자마다 위아래로 튀고 살짝 회전·크기 변화. 요즘 레터링의
  // 가장 큰 신호. 결정론적(문구로 시드)이라 실측과 생성이 항상 일치한다.
  var BOUNCE_RISE_RATIO = 0.10;   // 잉크 높이 대비 상하 진폭
  var BOUNCE_ROT_DEG = 5;         // 글자별 최대 회전
  var BOUNCE_SCALE_VAR = 0.07;    // 글자별 크기 편차
  // 하드 오프셋 그림자 — 잉크 높이 대비 비율 (우하향)
  var SHADOW_RATIO = 0.06;
  // 0 = 폰트 원형 그대로 (캘리그래피의 굵기 대비 보존).
  // 인쇄에서 가는 획이 날아가면 0.2 정도로 올린다 — 그만큼 흰 여백은 줄어든다.
  var INK_STROKE_PT = 0;
  var LEGIBILITY_MIN_MM = 10;   // 이보다 낮으면 가독성 경고

  // ── 서체 ─────────────────────────────────────────────────────
  // 2026-08-19 큐레이션. macOS 기본 스크립트체(Snell/Zapfino/Brush Script/
  // Party LET 등)는 전부 뺐다 — 1940~90년대 서체라 올드해 보인다.
  // Google Fonts 요즘 디스플레이 서체를 받아 설치했다 (전부 OFL = 상업 사용 가능).
  // 라벨 앞 번호 = 줄별 지정에 쓰는 인덱스.
  //
  // 00~11 = 굵은 디스플레이 (팝 톤 · 단독 스티커용)
  // 12~22 = 가볍고 조용한 서체 (차분 톤 · 사진 옆 이름표용)
  //
  // cands 의 첫 항목이 없으면 다음으로 폴백한다. 가벼운 웨이트 8종은
  // 2026-08-19 설치했으나 **Illustrator 재시작 전까지는 인식되지 않아**
  // 굵은 형제 폰트로 폴백된다 (실행 중에는 폰트 목록을 다시 읽지 않는다).
  var FONT_OPTIONS = [
    // ── 굵은 디스플레이 (팝) ──
    { label: "00 · Fredoka Bold — 통통한 라운드", hangul: false,
      cands: ["Fredoka-Bold", "Fredoka-SemiBold"] },
    { label: "01 · Baloo 2 ExtraBold — 부드럽고 굵은 라운드", hangul: false,
      cands: ["Baloo2-ExtraBold"] },
    { label: "02 · Poppins ExtraBold — 모던 지오메트릭", hangul: false,
      cands: ["Poppins-ExtraBold"] },
    { label: "03 · Titan One — 레트로 굵은 라운드", hangul: false,
      cands: ["TitanOne"] },
    { label: "04 · Luckiest Guy — 스티커 클래식", hangul: false,
      cands: ["LuckiestGuy-Regular"] },
    { label: "05 · Alfa Slab One — 굵은 슬랩", hangul: false,
      cands: ["AlfaSlabOne-Regular"] },
    { label: "06 · Righteous — 지오메트릭 레트로", hangul: false,
      cands: ["Righteous-Regular"] },
    { label: "07 · Bungee — 어반 디스플레이", hangul: false,
      cands: ["Bungee-Regular"] },
    { label: "08 · Archivo Black — 초굵은 그로테스크", hangul: false,
      cands: ["ArchivoBlack-Regular"] },
    { label: "09 · Bricolage Grotesque ExtraBold — 요즘 그로테스크", hangul: false,
      cands: ["BricolageGrotesque-ExtraBold"] },
    { label: "10 · Chewy — 통통한 손글씨", hangul: false,
      cands: ["Chewy-Regular"] },
    { label: "11 · Shantell Sans Bold — 말랑한 손글씨", hangul: false,
      cands: ["ShantellSans-Bold"] },
    // ── 가볍고 조용한 (차분) ──
    { label: "12 · Fredoka Medium — 라운드 · 가볍게", hangul: false,
      cands: ["Fredoka-Medium", "Fredoka-SemiBold", "Fredoka-Bold"] },
    { label: "13 · Quicksand SemiBold — 얇은 라운드", hangul: false,
      cands: ["Quicksand-SemiBold", "Fredoka-SemiBold"] },
    { label: "14 · Nunito Bold — 둥근 산세 · 부드럽게", hangul: false,
      cands: ["Nunito-Bold", "SofiaProSoftBold", "Fredoka-SemiBold"] },
    { label: "15 · Poppins SemiBold — 지오메트릭 · 가볍게", hangul: false,
      cands: ["Poppins-SemiBold", "Poppins-Regular", "Poppins-ExtraBold"] },
    { label: "16 · Outfit Medium — 담백한 산세", hangul: false,
      cands: ["Outfit-Medium", "Archivo-Medium", "Alfabet-Regular"] },
    { label: "17 · Sofia Pro Soft Bold — 소프트 산세", hangul: false,
      cands: ["SofiaProSoftBold", "Fredoka-SemiBold"] },
    { label: "18 · Shantell Sans Medium — 손글씨 · 가볍게", hangul: false,
      cands: ["ShantellSans-Medium", "ShantellSans-Bold"] },
    { label: "19 · Caveat Medium — 자연스러운 손글씨", hangul: false,
      cands: ["Caveat-Medium", "Caveat-Bold"] },
    { label: "20 · Instrument Serif — 에디토리얼 세리프", hangul: false,
      cands: ["InstrumentSerif-Regular"] },
    { label: "21 · DM Serif Display — 우아한 세리프", hangul: false,
      cands: ["DMSerifDisplay-Regular", "InstrumentSerif-Regular"] },
    { label: "22 · Gloock — 고대비 디스플레이 세리프", hangul: false,
      cands: ["Gloock-Regular"] },
    // ── 한글 (현재 운영은 영문 위주) ──
    { label: "23 · 나눔고딕 ExtraBold — 한글 굵은 고딕", hangul: true,
      cands: ["NanumGothicExtraBold", "NanumGothicBold"] },
    { label: "24 · 나눔손글씨 붓 — 한글 붓캘리", hangul: true,
      cands: ["NanumBrush"] }
  ];
  var FONT_DEFAULT_INDEX = 0;

  // ── 연출 (그림자 / bounce 강도) ────────────────────────────────
  // 색과 분리해 둔다 — "팝 느낌은 좋은데 색만 빼고 싶다"가 실제 요구였다.
  // 연출은 형태(그림자·튐)를, 팔레트는 색을 따로 정한다.
  var TREATMENT_OPTIONS = ["팝 — 하드 그림자 + 큰 bounce", "차분 — 그림자 없음 + 작은 bounce"];
  var TREAT_POP = 0, TREAT_SOFT = 1;
  var TREAT_BOUNCE_SCALE = [1.0, 0.35];

  // 연출별로 도는 서체. 팝은 굵은 디스플레이, 차분은 가벼운 서체.
  var FONT_ROTATION = [
    [0, 1, 3, 4, 8, 0, 11, 5, 10, 2, 6, 9],        // 팝
    [12, 20, 13, 19, 15, 17, 21, 18, 14, 16, 22, 12] // 차분
  ];

  // ── 팔레트 ────────────────────────────────────────────────────
  // 각 12칸. ink=글자색, bg=배경색, sh=하드 그림자색.
  // sh 는 반드시 ink 와 다른 색으로 — 같으면 그림자가 안 보인다.
  var PALETTE_OPTIONS = ["비비드", "뮤트 (채도 낮춤)", "뉴트럴 (무채색)",
                         "원포인트 — 클레이", "블랙 레터 — 글자 먹 + 배경만 컬러"];

  var PALETTE_VIVID = [
    { ink: "FFFFFF", bg: "FF3D8B", sh: "8F1041" },
    { ink: "FFFFFF", bg: "84CC16", sh: "3F6212" },
    { ink: "FFF1B8", bg: "7C5CFF", sh: "2E1A78" },
    { ink: "D62828", bg: "FFF1B8", sh: "F2C14E" },
    { ink: "FFF1B8", bg: "1E1E1E", sh: "FF3D8B" },
    { ink: "FFFFFF", bg: "14B8A6", sh: "0B4F49" },
    { ink: "FFFFFF", bg: "FF8A6B", sh: "7C2D12" },
    { ink: "FFFFFF", bg: "3B82F6", sh: "1E3A8A" },
    { ink: "FFFFFF", bg: "A855F7", sh: "4C1D95" },
    { ink: "1E1E1E", bg: "FDE047", sh: "F59E0B" },
    { ink: "FFFFFF", bg: "10B981", sh: "065F46" },
    { ink: "FFF1B8", bg: "A47864", sh: "4A322A" }
  ];

  // 같은 12가지 색상환을 그대로 두되 채도만 내린 판. 팝 연출과 잘 맞는다.
  var PALETTE_MUTED = [
    { ink: "FFFFFF", bg: "C4756B", sh: "7A423B" },   // 더스티 레드
    { ink: "FFFFFF", bg: "8B9A6B", sh: "4F5A3C" },   // 모스 그린
    { ink: "F5EFE6", bg: "8A7BA8", sh: "4E4463" },   // 더스티 바이올렛
    { ink: "7A4A3A", bg: "EADFC8", sh: "C7B393" },   // 오트
    { ink: "EADFC8", bg: "3A3733", sh: "8A7BA8" },   // 차콜
    { ink: "FFFFFF", bg: "6E9A94", sh: "3D5A56" },   // 더스티 틸
    { ink: "FFFFFF", bg: "C98F7A", sh: "7A4A3A" },   // 테라코타
    { ink: "FFFFFF", bg: "6D82A0", sh: "3D4C61" },   // 더스티 블루
    { ink: "FFFFFF", bg: "A88BA8", sh: "5F4A5F" },   // 모브
    { ink: "3A3733", bg: "E3D08A", sh: "B39B57" },   // 뮤트 골드
    { ink: "FFFFFF", bg: "6F8F7A", sh: "3E5546" },   // 세이지
    { ink: "EADFC8", bg: "8A7360", sh: "4F4136" }    // 모카
  ];

  // 색을 완전히 뺀 판 — 먹·크림·웜그레이만. 사진 옆에서 가장 안 튄다.
  var PALETTE_NEUTRAL = [
    { ink: "FFFFFF", bg: "231F1D", sh: "8A8178" },
    { ink: "231F1D", bg: "F2EEE8", sh: "BDB5AA" },
    { ink: "FFFFFF", bg: "6B655E", sh: "2E2A26" },
    { ink: "231F1D", bg: "E8E3DA", sh: "A9A093" },
    { ink: "F2EEE8", bg: "3A3733", sh: "8A8178" },
    { ink: "231F1D", bg: "D8D2C8", sh: "8A8178" },
    { ink: "FFFFFF", bg: "4A453F", sh: "231F1D" },
    { ink: "231F1D", bg: "F2EEE8", sh: "8A8178" },
    { ink: "FFFFFF", bg: "8A8178", sh: "3A3733" },
    { ink: "231F1D", bg: "C9C2B8", sh: "6B655E" },
    { ink: "F2EEE8", bg: "5C564E", sh: "231F1D" },
    { ink: "231F1D", bg: "E0DAD0", sh: "9A9187" }
  ];

  // 무채색 + 브랜드 클레이 한 가지만 포인트로.
  var PALETTE_ONEPOINT = [
    { ink: "FFFFFF", bg: "A9503C", sh: "5E2A20" },
    { ink: "A9503C", bg: "F2EEE8", sh: "D9C3BC" },
    { ink: "FFFFFF", bg: "231F1D", sh: "A9503C" },
    { ink: "231F1D", bg: "F2EEE8", sh: "A9503C" },
    { ink: "F2EEE8", bg: "A9503C", sh: "5E2A20" },
    { ink: "A9503C", bg: "E8E3DA", sh: "C9BDB5" },
    { ink: "FFFFFF", bg: "6B655E", sh: "A9503C" },
    { ink: "231F1D", bg: "E8E3DA", sh: "A9503C" },
    { ink: "FFFFFF", bg: "A9503C", sh: "231F1D" },
    { ink: "A9503C", bg: "D8D2C8", sh: "8A8178" },
    { ink: "F2EEE8", bg: "3A3733", sh: "A9503C" },
    { ink: "231F1D", bg: "D9C3BC", sh: "A9503C" }
  ];

  // 글자는 전부 브랜드 먹, 색은 배경에만. 그림자는 흰색이라 먹 글자 뒤에서
  // 하이라이트처럼 보인다 — 팝의 입체감은 그대로 남는다.
  // 배경은 먹 글자가 읽혀야 하므로 전부 밝은 파스텔로 잡았다.
  // 어두운 배경(뉴트럴 팔레트 등)에 먹 글자를 쓰면 글자가 사라진다.
  var PALETTE_BLACKINK = [
    { ink: "231F1D", bg: "FFB3C7", sh: "FFFFFF" },   // 소프트 핑크
    { ink: "231F1D", bg: "C8E6A0", sh: "FFFFFF" },   // 소프트 라임
    { ink: "231F1D", bg: "C9BFF0", sh: "FFFFFF" },   // 소프트 바이올렛
    { ink: "231F1D", bg: "FFE29A", sh: "FFFFFF" },   // 버터
    { ink: "231F1D", bg: "F2EEE8", sh: "B9AFA2" },   // 크림 (밝아서 그림자는 진하게)
    { ink: "231F1D", bg: "9EDDD6", sh: "FFFFFF" },   // 소프트 틸
    { ink: "231F1D", bg: "FFC0A8", sh: "FFFFFF" },   // 소프트 피치
    { ink: "231F1D", bg: "A8CBF5", sh: "FFFFFF" },   // 소프트 블루
    { ink: "231F1D", bg: "E0BFEF", sh: "FFFFFF" },   // 소프트 라일락
    { ink: "231F1D", bg: "FDE047", sh: "FFFFFF" },   // 옐로우
    { ink: "231F1D", bg: "A6E3C4", sh: "FFFFFF" },   // 소프트 민트
    { ink: "231F1D", bg: "D9C3B4", sh: "FFFFFF" }    // 소프트 모카
  ];

  var PALETTES = [PALETTE_VIVID, PALETTE_MUTED, PALETTE_NEUTRAL,
                  PALETTE_ONEPOINT, PALETTE_BLACKINK];

  var ASSIGN_OPTIONS = ["전체 같은 스타일", "줄마다 다른 스타일 (프리셋 순환)"];
  var HANGUL_FALLBACK = ["NanumBrush", "NanumPen", "SuseongHyejeong-Regular",
                         "SolmoeKimDaeGeonM", "AppleSDGothicNeo-Bold", "AppleGothic"];

  var HEIGHT_OPTIONS = ["10mm", "15mm", "20mm", "25mm", "30mm", "40mm"];
  var HEIGHT_VALUES = [10, 15, 20, 25, 30, 40];
  var HEIGHT_DEFAULT_INDEX = 2;   // 20mm

  var HALO_OPTIONS = ["1mm", "1.5mm", "2mm", "2.5mm", "3mm"];
  var HALO_VALUES = [1, 1.5, 2, 2.5, 3];
  var HALO_DEFAULT_INDEX = 2;     // 2mm

  var BG_MARGIN_OPTIONS = ["1.5mm", "2mm", "2.5mm", "3mm", "4mm"];
  var BG_MARGIN_VALUES = [1.5, 2, 2.5, 3, 4];
  var BG_MARGIN_DEFAULT_INDEX = 2;  // 2.5mm

  var STYLE_OPTIONS = ["심플 — 흰 테두리만", "레이어드 — 컬러 배경 + 흰 테두리"];
  // 라이브 브랜드 clay (#A9503C). design_system.html 의 --accent-clay 는 stale.
  var INK_HEX_DEFAULT = "231F1D";
  var BG_HEX_DEFAULT = "A9503C";
  var SHADOW_HEX_DEFAULT = "1E1E1E";

  var HANGUL_FONT_CACHE = null;
  var HANGUL_FONT_RESOLVED = false;
  // var 할당은 호이스팅되지 않는다 — 메인 플로우가 함수 정의부보다 먼저
  // 실행되므로 캐시는 반드시 여기(플로우 위)에서 초기화할 것.
  var FONT_INDEX_CACHE = {};

  function C(r, g, b) { var c = new RGBColor(); c.red = r; c.green = g; c.blue = b; return c; }
  var INK = C(35, 31, 29);
  var WHITE = C(255, 255, 255);

  var testConfig = $.global.__EVERSTORY_CALLIGRAPHY_TEST__;

  function _fail(m) {
    if (testConfig) { testConfig.lastMessage = "실패: " + m; }
    else { alert(m); }
  }

  // ═════════ 입력 ═════════
  var options = (testConfig && testConfig.options) ? testConfig.options : _showCalliDialog();
  if (!options) return;

  // 줄 형식: 문구 | 서체번호 | 글자색 | 배경색  (뒤 3개는 생략 가능)
  var specs = [];
  var phrases = [];
  for (var pi0 = 0; pi0 < options.phrases.length; pi0++) {
    var spec = _parsePhraseLine(String(options.phrases[pi0]));
    if (!spec) continue;
    specs.push(spec);
    phrases.push(spec.text);
  }
  if (specs.length === 0) { _fail("문구가 없습니다."); return; }

  var outFolderPick = (testConfig && testConfig.outputFolder) ?
    new Folder(testConfig.outputFolder) :
    Folder.selectDialog("시트를 저장할 프로젝트 폴더 선택 (03_output 자동 사용)");
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
  var targetHPt = options.heightMm * MM_TO_PT;

  // 여백은 시트 전체 공통 (테두리 두께가 들쭉날쭉하면 지저분하다).
  // 레이어드는 오프셋을 2단으로 쌓는다:
  //   글자 → 배경색 오프셋(bgPt) → 흰 테두리 오프셋(+borderPt) → 칼선
  var treatment = (options.treatment === TREAT_SOFT) ? TREAT_SOFT : TREAT_POP;
  var palette = options.palette;
  if (!(palette >= 0 && palette < PALETTES.length)) palette = 0;
  var layered = !!options.layered;
  var bouncy = !!options.bouncy;
  var shadowOn = !!options.shadow;
  var bgPt = options.bgMarginMm * MM_TO_PT;
  var borderPt = options.haloMm * MM_TO_PT;
  var outerPt = layered ? (bgPt + borderPt) : borderPt;

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
  var shelfCount = 0;
  var pieceReport = [];
  var styleReport = [];

  try {
    // ── 1. 줄별 스타일 확정 + 실측 → 목표 높이에서의 유닛 크기 ────
    var units = [];
    for (var mi = 0; mi < specs.length; mi++) {
      var style = _resolveStyle(specs[mi], mi, options);
      var fontEntry = FONT_OPTIONS[style.fontIndex];
      var unitFont = _fontForIndex(style.fontIndex);
      if (!unitFont) {
        failedItems.push({ base: specs[mi].text,
                           error: "서체 없음: " + fontEntry.label });
        continue;
      }

      // 이어지는 스크립트체는 bouncy 를 적용하면 연결부가 끊어진다.
      // 차분 톤은 bounce 를 크게 줄인다 (사진 옆에서 튀지 않게).
      var unitBounceScale = (bouncy && !fontEntry.connected) ?
        TREAT_BOUNCE_SCALE[treatment] : 0;

      var m = _measurePhrase(doc, printLayer, specs[mi].text, unitFont,
                             fontEntry.hangul, unitBounceScale);
      if (!m) {
        failedItems.push({ base: specs[mi].text, error: "실측 실패 (빈 글리프)" });
        continue;
      }
      // 그림자는 실루엣을 우하향으로 넓힌다 — 크기 계산에 반영
      if (shadowOn) {
        m = { w: m.w + m.h * SHADOW_RATIO, h: m.h * (1 + SHADOW_RATIO) };
      }
      // 헤일로 포함 유닛 크기 = 잉크 크기 + 양쪽 헤일로
      var inkH = targetHPt - 2 * outerPt;
      if (inkH <= 0) throw new Error("여백 합이 목표 높이보다 큽니다.");
      var scale = inkH / m.h;
      var unitW = m.w * scale + 2 * outerPt;
      var unitH = targetHPt;
      // body 폭을 넘으면 폭 기준으로 재축소.
      // 여백(2*outerPt)은 스케일과 무관한 고정항이므로 잉크 폭에서 빼고
      // 비율을 다시 구해야 한다 — scale 에 binW/unitW 를 곱하면 모자란다.
      if (unitW > binW) {
        scale = (binW - 2 * outerPt) / m.w;
        unitW = m.w * scale + 2 * outerPt;
        unitH = m.h * scale + 2 * outerPt;
      }
      units.push({
        text: specs[mi].text,
        fontSizePt: PROBE_SIZE_PT * scale,
        w: unitW, h: unitH,
        cfg: {
          layered: layered,
          bgPt: bgPt, borderPt: borderPt, outerPt: outerPt,
          font: unitFont,
          fontIsHangul: fontEntry.hangul,
          bounceScale: unitBounceScale,
          shadow: shadowOn,
          inkColor: _hexToRGB(style.inkHex, INK),
          bgColor: _hexToRGB(style.bgHex, INK),
          shadowColor: _hexToRGB(style.shHex, INK)
        }
      });
      styleReport.push(specs[mi].text + " · " + fontEntry.label.substring(0, 2) +
        " #" + style.inkHex + (layered ? "/#" + style.bgHex : ""));
    }
    if (units.length === 0) throw new Error("사용 가능한 문구가 없습니다.");

    // ── 2. shelf 패킹 계획 (행 단위, 각 행 가로 가운데 정렬) ──────
    var plan = _planShelves(units, binW, binH, gapPt, options.repeatFill);
    if (plan.rows.length === 0) {
      throw new Error("body 에 한 줄도 들어가지 않습니다 (높이 " + options.heightMm + "mm).");
    }
    shelfCount = plan.rows.length;

    // ── 3. 실제 생성 ─────────────────────────────────────────────
    for (var r = 0; r < plan.rows.length; r++) {
      var row = plan.rows[r];
      var rowY = bT - padPt - row.y;                 // 행 상단 (문서 좌표)
      var rowX = bL + padPt + row.xStart;            // 행 좌측 (가운데 정렬 반영)
      for (var ci = 0; ci < row.items.length; ci++) {
        var cell = row.items[ci];
        var unit = cell.unit;
        try {
          var built = _buildCalliSticker(
            doc, printLayer, kissLayer, cutSpot,
            unit, unit.cfg, rowX + cell.x, rowY, placedCount + 1
          );
          placedCount++;
          pieceReport.push({ text: unit.text, pieces: built.pieces });
        } catch (ePlace) {
          failedItems.push({
            base: unit.text,
            error: (ePlace && ePlace.message) ? ePlace.message : String(ePlace)
          });
        }
      }
    }
    _safeRedrawAndGC();

    if (placedCount === 0) throw new Error("배치된 스티커가 없습니다.");

    // ── 4. 헤더 주입 (v2 규약: .contents 만 교체) ─────────────────
    var headerLabel = options.headerText ? options.headerText : phrases[0];
    headerRightText.contents = headerLabel + " · CALLI " +
      options.heightMm + "mm · " + placedCount + "장";
    _applyHangulFontOverride(headerRightText, _getHangulFont());
  } catch (eMain) {
    fatalError = ((eMain && eMain.message) ? eMain.message : String(eMain)) +
      " @line " + ((eMain && eMain.line) ? eMain.line : "?");
  } finally {
    app.userInteractionLevel = prevInteraction;
  }

  if (fatalError) {
    _fail(fatalError + "\n\n시트는 저장하지 않았습니다. 문서를 확인 후 닫으세요.");
    return;
  }

  try { kissLayer.move(doc, ElementPlacement.PLACEATBEGINNING); } catch (eKiss) {}
  try { printLayer.move(doc, ElementPlacement.PLACEATEND); } catch (ePrint) {}
  doc.selection = null;

  // ── 03_output 자동 저장 ───────────────────────────────────────
  var savedPath = "", saveError = "";
  try {
    var outFolder = _resolveOutputFolder(outFolderPick);
    var fileName = _timestamp() + "_CALLI" + options.heightMm + "mm_sheet01.ai";
    var saveFile = new File(outFolder.fsName + "/" + fileName);
    _saveAi(doc, saveFile);
    savedPath = saveFile.fsName;
  } catch (eSave) {
    saveError = (eSave && eSave.message) ? eSave.message : String(eSave);
  }

  // ── 조각 수 리포트 (1 이 아니면 글자가 분리되어 잘린다) ─────────
  var splitWarn = [];
  var seenText = {};
  for (var pr = 0; pr < pieceReport.length; pr++) {
    var t = pieceReport[pr].text;
    if (seenText[t]) continue;
    seenText[t] = true;
    if (pieceReport[pr].pieces !== 1) {
      splitWarn.push("\"" + t + "\" → " + pieceReport[pr].pieces + "조각");
    }
  }

  var msg =
    "완료: 캘리그래피 시트 생성\n\n" +
    "스크립트: " + SCRIPT_VARIANT + " (템플릿: " + TEMPLATE_NAME + ")\n" +
    "구성: " + (layered ?
      ("레이어드 · 글자 → 배경 " + options.bgMarginMm + "mm → 흰 테두리 " +
       options.haloMm + "mm") :
      ("심플 · 글자 → 흰 테두리 " + options.haloMm + "mm")) +
    "\n연출: " + TREATMENT_OPTIONS[treatment] + " · 팔레트: " + PALETTE_OPTIONS[palette] +
    (options.assignRotate ? " · 줄마다 다른 스타일" : " · 전체 같은 스타일") +
    (bouncy ? " · bouncy" : "") + (shadowOn ? " · 하드그림자" : "") + "\n" +
    "줄별 스타일:\n   " + styleReport.join("\n   ") + "\n" +
    "높이: " + options.heightMm + "mm (여백 포함)\n" +
    "행: " + shelfCount + " / 배치 " + placedCount + "장 / 문구 " + phrases.length + "개\n" +
    (options.heightMm < LEGIBILITY_MIN_MM ?
      "⚠ 높이가 작습니다. 가는 획의 인쇄·컷 품질을 확인하세요.\n" : "") +
    (splitWarn.length > 0 ?
      "⚠ 칼선이 분리된 문구 (흰 여백을 키우면 하나로 붙습니다):\n   " +
      splitWarn.join("\n   ") + "\n" : "") +
    (savedPath ? "저장: " + savedPath : "저장 실패: " + saveError) + "\n\n" +
    "QC: ① 칼선이 문구를 한 조각으로 감싸는지 ② 획 끝 spike 없는지 " +
    "③ 헤일로 두께 균일한지 ④ 글자 속구멍이 메워졌는지";

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
  //  캘리그래피 유닛 생성
  // ═════════════════════════════════════════════════════════

  // 텍스트 → 아웃라인. createOutline 은 원본 TextFrame 을 소모한다.
  function _makeInkOutline(printL, text, font, fontIsHangul, fontSizePt, inkColor, bounceScale) {
    var col = inkColor ? inkColor : INK;
    var tf = printL.textFrames.pointText([0, 0]);
    tf.contents = text;
    var tr = tf.textRange;
    tr.characterAttributes.textFont = font;
    tr.characterAttributes.size = fontSizePt;
    tr.characterAttributes.fillColor = col;
    if (INK_STROKE_PT > 0) {
      tr.characterAttributes.strokeColor = col;
      tr.characterAttributes.strokeWeight = INK_STROKE_PT;
    }
    if (!fontIsHangul) _applyHangulFontOverride(tf, _getHangulFont());

    var outline = tf.createOutline();
    if (bounceScale > 0) _applyBounce(outline, _seedOf(text), bounceScale);
    return outline;
  }

  // 글자마다 위아래로 튀고 살짝 회전·크기 변화 — 요즘 레터링의 핵심 신호.
  // 문구로 시드를 만드는 결정론적 변형이라 실측과 생성이 항상 일치한다
  // (Math.random 을 쓰면 계획한 크기와 실제 크기가 어긋난다).
  function _applyBounce(group, seed, scale) {
    var kids = [];
    for (var i = 0; i < group.pageItems.length; i++) kids.push(group.pageItems[i]);
    if (kids.length < 2) return;

    // createOutline 은 글자를 역순으로 담는다 — x 중심 기준으로 좌→우 확정
    kids.sort(function (a, b) {
      var ab = a.geometricBounds, bb2 = b.geometricBounds;
      return (ab[0] + ab[2]) / 2 - (bb2[0] + bb2[2]) / 2;
    });

    var gb = group.geometricBounds;
    var inkH = gb[1] - gb[3];
    if (!(inkH > 0)) return;

    for (var k = 0; k < kids.length; k++) {
      // 서로 다른 무리수 배수 → 규칙적이지 않게 오르내린다
      var pRise = Math.sin(k * 1.9 + seed * 0.7);
      var pRot = Math.sin(k * 2.7 + seed * 1.3);
      var pScale = Math.sin(k * 1.3 + seed * 2.1);

      var sc = 1 + BOUNCE_SCALE_VAR * scale * pScale;
      try {
        kids[k].resize(sc * 100, sc * 100, true, true, true, true, 100,
                       Transformation.CENTER);
        kids[k].rotate(BOUNCE_ROT_DEG * scale * pRot, true, true, true, true,
                       Transformation.CENTER);
        kids[k].translate(0, inkH * BOUNCE_RISE_RATIO * scale * pRise);
      } catch (e) {}
    }
  }

  function _seedOf(text) {
    var s = 0;
    for (var i = 0; i < text.length; i++) s = (s + text.charCodeAt(i) * (i + 1)) % 997;
    return s / 997 * 6.283;
  }

  // srcItem 을 offsetPt 만큼 바깥으로 부풀린 단일 도형을 만들어 돌려준다.
  // Offset Path 라이브 이펙트 → Expand Appearance → compound 해제 → union.
  // 스트로크를 두껍게 주고 expandStyle 하는 방식은 동작하지 않는다 —
  // Expand Appearance 는 라이브 이펙트만 확장하고 평범한 스트로크는 그대로
  // 두기 때문에 칼선이 글자에 딱 붙어버린다.
  function _offsetShape(sheetDoc, layer, srcItem, offsetPt, label) {
    var src = srcItem.duplicate(layer, ElementPlacement.PLACEATEND);
    _applyOffsetEffect(src, offsetPt);

    sheetDoc.selection = null;
    src.selected = true;
    app.executeMenuCommand("expandStyle");

    var sel = sheetDoc.selection;
    if (!sel || sel.length === 0) throw new Error("offset path expand 실패 (" + label + ")");
    var expanded = sel[0];

    // compound 를 풀고 솔리드로 만들어야 Pathfinder 가 먹는다.
    // 이 과정에서 글자 속구멍이 메워지는데, 칼선은 바깥만 따야 하므로 맞다.
    var g = layer.groupItems.add();
    _copyPathsAsSolid(expanded, g);
    try { expanded.remove(); } catch (eRm) {}

    var united = _unionGroup(sheetDoc, g);
    if (!united) throw new Error("offset union 결과 없음 (" + label + ")");

    var b = united.geometricBounds;
    if (!(b[2] - b[0] > 0)) throw new Error("offset bounds 비어 있음 (" + label + ")");
    return united;
  }

  // 기준 사이즈로 실측. TextFrame 의 geometricBounds 는 글리프가 아니라
  // 폰트 메트릭(어센더~디센더) 박스라 스크립트체에서 실제 잉크보다 2배까지
  // 크다 — 반드시 아웃라인으로 변환한 뒤 재야 목표 높이가 맞는다.
  function _measurePhrase(sheetDoc, printL, text, font, fontIsHangul, bounceScale) {
    var outline = _makeInkOutline(printL, text, font, fontIsHangul,
                                  PROBE_SIZE_PT, null, bounceScale);
    var b = outline.geometricBounds;
    var w = b[2] - b[0];
    var h = b[1] - b[3];
    try { outline.remove(); } catch (eRm) {}

    if (!(w > 0) || !(h > 0)) return null;
    return { w: w, h: h };
  }

  // 글자 + (배경) + 흰 테두리 + 칼선. (x, y) = 유닛 좌상단.
  // 가장 바깥 흰 테두리와 칼선은 같은 도형을 공유한다 —
  // 인쇄된 흰 테두리 가장자리가 곧 컷 경계가 되어 정합 오차가 없다.
  //
  //  심플   : 글자 → 흰 테두리(borderPt) → 컷
  //  레이어드: 글자 → 배경색(bgPt) → 흰 테두리(+borderPt) → 컷
  function _buildCalliSticker(sheetDoc, printL, kissL, spotColor,
                              unit, cfg, x, y, idx) {
    app.activeDocument = sheetDoc;
    sheetDoc.activeLayer = printL;
    sheetDoc.selection = null;

    // 1) 글자
    var ink = _makeInkOutline(printL, unit.text, cfg.font, cfg.fontIsHangul,
                              unit.fontSizePt, cfg.inkColor, cfg.bounceScale);
    try { ink.name = "Calli_" + _pad2(idx); } catch (eInkName) {}

    // 2) 위치 — 유닛 좌상단 기준으로 바깥 여백만큼 안쪽에 글자를 둔다.
    //    left/top 은 visibleBounds 기준이라 stroke 유무에 흔들린다 —
    //    geometricBounds 로 델타를 계산해 translate 할 것.
    var gb = ink.geometricBounds;
    ink.translate((x + cfg.outerPt) - gb[0], (y - cfg.outerPt) - gb[1]);

    // 3) 하드 오프셋 그림자 (우하향) — 잉크 뒤에 깔린다
    var shadow = null;
    if (cfg.shadow) {
      var ib = ink.geometricBounds;
      var d = (ib[1] - ib[3]) * SHADOW_RATIO;
      shadow = ink.duplicate(printL, ElementPlacement.PLACEATEND);
      _setSolidFill(shadow, cfg.shadowColor);
      shadow.translate(d, -d);
      try { shadow.name = "CalliShadow_" + _pad2(idx); } catch (eShName) {}
    }

    // 4) 오프셋 기준 실루엣 = 잉크 ∪ 그림자.
    //    그림자를 빼고 잉크만으로 오프셋하면 그림자가 배경 밖으로 삐져나온다.
    var silh = printL.groupItems.add();
    ink.duplicate(silh, ElementPlacement.PLACEATEND);
    if (shadow) shadow.duplicate(silh, ElementPlacement.PLACEATEND);

    // 5) 오프셋 레이어 (뒤로 갈수록 크다 → 만든 뒤 차례로 맨 뒤로 보낸다)
    var bg = null;
    var outer;
    if (cfg.layered) {
      bg = _offsetShape(sheetDoc, printL, silh, cfg.bgPt, unit.text);
      _setSolidFill(bg, cfg.bgColor);
      try { bg.name = "CalliBg_" + _pad2(idx); } catch (eBgName) {}

      outer = _offsetShape(sheetDoc, printL, silh, cfg.bgPt + cfg.borderPt, unit.text);
      _setSolidFill(outer, WHITE);
      try { outer.name = "CalliBorder_" + _pad2(idx); } catch (eBdName) {}

      try { bg.move(printL, ElementPlacement.PLACEATEND); } catch (eMoveBg) {}
    } else {
      outer = _offsetShape(sheetDoc, printL, silh, cfg.borderPt, unit.text);
      _setSolidFill(outer, WHITE);
      try { outer.name = "CalliHalo_" + _pad2(idx); } catch (eHaloName) {}
    }
    try { silh.remove(); } catch (eRmSilh) {}
    try { outer.move(printL, ElementPlacement.PLACEATEND); } catch (eMoveOuter) {}

    var pieces = _countPieces(outer);

    // 4) 칼선 = 가장 바깥 도형과 동일
    var cut = outer.duplicate(kissL, ElementPlacement.PLACEATBEGINNING);
    try { cut.name = "Cutline_calli_" + _pad2(idx); } catch (eCutName) {}
    _forceCutContourStroke(cut, spotColor);

    sheetDoc.selection = null;
    try { $.gc(); } catch (eGc) {}
    return { ink: ink, bg: bg, outer: outer, cut: cut, pieces: pieces };
  }

  // "A9503C" / "#A9503C" → RGBColor. 파싱 실패하면 fallback.
  function _hexToRGB(hex, fallback) {
    if (!hex) return fallback;
    var s = String(hex).replace(/^#/, "");
    if (!/^[0-9A-Fa-f]{6}$/.test(s)) return fallback;
    return C(parseInt(s.substring(0, 2), 16),
             parseInt(s.substring(2, 4), 16),
             parseInt(s.substring(4, 6), 16));
  }

  // Offset Path 라이브 이펙트.
  //
  // jntp 매핑 함정 (Illustrator 2026 에서 실측 — 되돌리지 말 것):
  // 통념은 0=miter/1=round/2=bevel 이지만 실제로는 **0 이 round** 다.
  // 0/1/2 를 각각 적용해 렌더한 결과 0=매끄러운 라운드, 1=뾰족한 miter,
  // 2=각진 bevel 이었다. 1 로 두면 스크립트체 획 끝마다 spike 가 생겨
  // 칼선이 뾰족하게 튄다.
  function _applyOffsetEffect(item, offsetPt) {
    var xml = '<LiveEffect name="Adobe Offset Path">' +
              '<Dict data="R mlim 4 R ofst ' + offsetPt + ' I jntp ' + OFFSET_JOIN_ROUND + ' "/>' +
              '</LiveEffect>';
    item.applyEffect(xml);
  }

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

  // 그룹 안 패스들을 하나로 합친다 (Pathfinder Add → expand).
  function _unionGroup(sheetDoc, group) {
    _forceTempFill(group);
    sheetDoc.selection = null;
    group.selected = true;
    app.executeMenuCommand("group");
    app.executeMenuCommand("Live Pathfinder Add");
    app.executeMenuCommand("expandStyle");
    var sel = sheetDoc.selection;
    if (!sel || sel.length === 0) return null;
    return sel[0];
  }

  // union 결과의 물리 조각 수 = 다른 패스에 포함되지 않는 바깥 윤곽 수.
  function _countPieces(item) {
    var paths = [];
    _gatherPaths(item, paths);
    if (paths.length === 0) return 0;

    var bounds = [];
    for (var i = 0; i < paths.length; i++) {
      try { bounds.push(paths[i].geometricBounds); } catch (e) { bounds.push(null); }
    }
    var outer = 0;
    for (var p = 0; p < bounds.length; p++) {
      if (!bounds[p]) continue;
      var contained = false;
      for (var q = 0; q < bounds.length; q++) {
        if (p === q || !bounds[q]) continue;
        if (_boundsContain(bounds[q], bounds[p], 0.3)) { contained = true; break; }
      }
      if (!contained) outer++;
    }
    return outer;
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
      }
    } catch (e) {}
  }

  function _boundsContain(outer, inner, tol) {
    return inner[0] >= outer[0] + tol &&
           inner[2] <= outer[2] - tol &&
           inner[1] <= outer[1] - tol &&
           inner[3] >= outer[3] + tol;
  }


  // ═════════════════════════════════════════════════════════
  //  SHELF 패킹 (문구는 가로로 길어 uniform grid 가 낭비)
  // ═════════════════════════════════════════════════════════

  function _planShelves(units, binW, binH, gap, repeatFill) {
    var rows = [];
    var cursorY = 0;          // 행 상단 오프셋 (아래로 +)
    var idx = 0;
    var guard = 0;

    while (guard++ < 5000) {
      // 새 행 시작 — 들어갈 수 있는 유닛을 좌→우로 채운다
      var row = { items: [], y: cursorY, h: 0, xStart: 0 };
      var cursorX = 0;

      while (guard++ < 5000) {
        if (!repeatFill && idx >= units.length) break;
        var unit = units[idx % units.length];
        var need = (row.items.length === 0) ? unit.w : (gap + unit.w);
        // binW 에 맞춰 축소한 유닛이 부동소수점 때문에 튕기지 않도록 여유 0.01pt
        if (cursorX + need > binW + 0.01) break;
        if (row.items.length > 0) cursorX += gap;
        row.items.push({ unit: unit, x: cursorX });
        cursorX += unit.w;
        if (unit.h > row.h) row.h = unit.h;
        idx++;
      }

      if (row.items.length === 0) break;              // 한 개도 못 넣음 → 종료
      if (cursorY + row.h > binH) break;              // 세로 초과 → 종료

      row.xStart = (binW - cursorX) / 2;              // 행 가운데 정렬
      rows.push(row);
      cursorY += row.h + gap;

      if (!repeatFill && idx >= units.length) break;
      if (cursorY >= binH) break;
    }

    return { rows: rows };
  }


  // ═════════════════════════════════════════════════════════
  //  폰트 / 한글
  // ═════════════════════════════════════════════════════════

  // "이름 | 서체번호 | 글자색 | 배경색" — 뒤 3개는 생략 가능.
  // 빈 칸으로 두면(예: "이름 || FF0000") 그 항목만 기본값을 쓴다.
  function _parsePhraseLine(raw) {
    var parts = String(raw).split("|");
    var text = _composeHangulNFC(parts[0]).replace(/^\s+|\s+$/g, "");
    if (!text) return null;

    function fld(i) {
      if (parts.length <= i) return null;
      var v = String(parts[i]).replace(/^\s+|\s+$/g, "").replace(/^#/, "");
      return v ? v : null;
    }

    var fIdx = null;
    var fRaw = fld(1);
    if (fRaw !== null && /^\d+$/.test(fRaw)) {
      var n = parseInt(fRaw, 10);
      if (n >= 0 && n < FONT_OPTIONS.length) fIdx = n;
    }
    return { text: text, fontIndex: fIdx, inkHex: fld(2), bgHex: fld(3), shHex: fld(4) };
  }

  // 우선순위: 줄별 오버라이드 > (자동 배분이면) 프리셋 > 다이얼로그 기본값
  function _resolveStyle(spec, i, opts) {
    // 자동 배분: 서체는 연출별 로테이션, 색은 팔레트에서 — 둘을 따로 돌린다.
    var preset = null;
    if (opts.assignRotate) {
      var treat = (opts.treatment === TREAT_SOFT) ? TREAT_SOFT : TREAT_POP;
      var pal = (opts.palette >= 0 && opts.palette < PALETTES.length) ? opts.palette : 0;
      var rot = FONT_ROTATION[treat];
      var col = PALETTES[pal];
      preset = {
        font: rot[i % rot.length],
        ink: col[i % col.length].ink,
        bg: col[i % col.length].bg,
        sh: col[i % col.length].sh
      };
    }
    var fontIndex = spec.fontIndex;
    if (fontIndex === null) fontIndex = preset ? preset.font : opts.fontIndex;
    if (fontIndex === null || fontIndex === undefined ||
        fontIndex < 0 || fontIndex >= FONT_OPTIONS.length) {
      fontIndex = FONT_DEFAULT_INDEX;
    }
    return {
      fontIndex: fontIndex,
      inkHex: spec.inkHex || (preset ? preset.ink : opts.inkHex),
      bgHex: spec.bgHex || (preset ? preset.bg : opts.bgHex),
      shHex: spec.shHex || (preset ? preset.sh : opts.shadowHex)
    };
  }

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

  function _getHangulFont() {
    if (!HANGUL_FONT_RESOLVED) {
      HANGUL_FONT_CACHE = _resolveFont(HANGUL_FALLBACK);
      HANGUL_FONT_RESOLVED = true;
    }
    return HANGUL_FONT_CACHE;
  }

  function _applyHangulFontOverride(textFrame, hangulFont) {
    if (!hangulFont) return;
    var s = textFrame.contents;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if ((c >= 0xAC00 && c <= 0xD7AF) ||
          (c >= 0x1100 && c <= 0x11FF) ||
          (c >= 0x3130 && c <= 0x318F)) {
        try { textFrame.textRange.characters[i].textFont = hangulFont; } catch (eChar) {}
      }
    }
  }

  function _composeHangulNFC(s) {
    var out = "";
    var i = 0;
    while (i < s.length) {
      var L = s.charCodeAt(i);
      if (L >= 0x1100 && L <= 0x1112 && i + 1 < s.length) {
        var V = s.charCodeAt(i + 1);
        if (V >= 0x1161 && V <= 0x1175) {
          var Tidx = 0;
          var step = 2;
          if (i + 2 < s.length) {
            var T = s.charCodeAt(i + 2);
            if (T >= 0x11A8 && T <= 0x11C2) {
              Tidx = T - 0x11A7;
              step = 3;
            }
          }
          out += String.fromCharCode(0xAC00 + ((L - 0x1100) * 21 + (V - 0x1161)) * 28 + Tidx);
          i += step;
          continue;
        }
      }
      out += s.charAt(i);
      i++;
    }
    return out;
  }


  // ═════════════════════════════════════════════════════════
  //  UI
  // ═════════════════════════════════════════════════════════

  function _showCalliDialog() {
    var dlg = new Window("dialog", SCRIPT_TITLE);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";

    dlg.add("statictext", undefined, "문구 (한 줄에 하나 · 여러 줄이면 슬롯에 번갈아 배치):");
    var textInput = dlg.add("edittext", undefined, "", { multiline: true });
    textInput.preferredSize = [420, 110];

    var syntaxHint = dlg.add("statictext", undefined,
      "줄마다 따로 지정: 이름 | 서체번호 | 글자색 | 배경색   (예: Lucas | 09 | C8DC8C | 5A6B2F)");
    _dim(syntaxHint);

    var toneGroup = dlg.add("group");
    toneGroup.add("statictext", undefined, "연출:");
    var toneDrop = toneGroup.add("dropdownlist", undefined, TREATMENT_OPTIONS);
    toneDrop.selection = TREAT_POP;
    toneDrop.preferredSize = [250, 24];
    toneGroup.add("statictext", undefined, "  팔레트:");
    var paletteDrop = toneGroup.add("dropdownlist", undefined, PALETTE_OPTIONS);
    paletteDrop.selection = 1;   // 뮤트 — 사진 옆에서 안 튀는 기본값
    paletteDrop.preferredSize = [170, 24];

    var assignGroup = dlg.add("group");
    assignGroup.add("statictext", undefined, "배분:");
    var assignDrop = assignGroup.add("dropdownlist", undefined, ASSIGN_OPTIONS);
    assignDrop.selection = 0;
    assignDrop.preferredSize = [280, 24];

    var fontGroup = dlg.add("group");
    fontGroup.add("statictext", undefined, "기본 서체:");
    var fontLabels = [];
    for (var i = 0; i < FONT_OPTIONS.length; i++) fontLabels.push(FONT_OPTIONS[i].label);
    var fontDrop = fontGroup.add("dropdownlist", undefined, fontLabels);
    fontDrop.selection = FONT_DEFAULT_INDEX;
    fontDrop.preferredSize = [340, 24];

    var sizeGroup = dlg.add("group");
    sizeGroup.add("statictext", undefined, "높이:");
    var heightDrop = sizeGroup.add("dropdownlist", undefined, HEIGHT_OPTIONS);
    heightDrop.selection = HEIGHT_DEFAULT_INDEX;
    sizeGroup.add("statictext", undefined, "  흰 테두리:");
    var haloDrop = sizeGroup.add("dropdownlist", undefined, HALO_OPTIONS);
    haloDrop.selection = HALO_DEFAULT_INDEX;

    var styleGroup = dlg.add("group");
    styleGroup.add("statictext", undefined, "스타일:");
    var styleDrop = styleGroup.add("dropdownlist", undefined, STYLE_OPTIONS);
    styleDrop.selection = 0;
    styleDrop.preferredSize = [240, 24];

    var colorGroup = dlg.add("group");
    colorGroup.add("statictext", undefined, "글자색 #");
    var inkHexInput = colorGroup.add("edittext", undefined, INK_HEX_DEFAULT);
    inkHexInput.characters = 8;
    colorGroup.add("statictext", undefined, "  배경색 #");
    var bgHexInput = colorGroup.add("edittext", undefined, BG_HEX_DEFAULT);
    bgHexInput.characters = 8;
    colorGroup.add("statictext", undefined, "  그림자 #");
    var shHexInput = colorGroup.add("edittext", undefined, SHADOW_HEX_DEFAULT);
    shHexInput.characters = 8;
    colorGroup.add("statictext", undefined, "  배경 여백:");
    var bgMarginDrop = colorGroup.add("dropdownlist", undefined, BG_MARGIN_OPTIONS);
    bgMarginDrop.selection = BG_MARGIN_DEFAULT_INDEX;

    var trendGroup = dlg.add("group");
    var bouncyCheck = trendGroup.add("checkbox", undefined, "통통 튀는 글자 (bouncy)");
    bouncyCheck.value = true;
    var shadowCheck = trendGroup.add("checkbox", undefined, "하드 그림자");
    shadowCheck.value = true;

    var hintText = dlg.add("statictext", undefined,
      "레이어드에서 글자를 FFFFFF 로 두면 컬러 배경 위 흰 글씨가 됩니다.");
    _dim(hintText);

    // 자동 배분이면 서체·색은 프리셋이 정하므로 기본값 입력은 비활성.
    function _syncEnable() {
      var lay = (styleDrop.selection.index === 1);
      var rotate = (assignDrop.selection.index === 1);
      bgMarginDrop.enabled = lay;
      fontDrop.enabled = !rotate;
      inkHexInput.enabled = !rotate;
      bgHexInput.enabled = lay && !rotate;
      shHexInput.enabled = shadowCheck.value && !rotate;
    }
    // 톤을 바꾸면 그림자 기본값도 따라간다 — 차분 톤에서 하드 그림자를
    // 켜두면 톤을 낮춘 의미가 없다.
    function _syncTone() {
      shadowCheck.value = (toneDrop.selection.index === TREAT_POP);
      _syncEnable();
    }
    styleDrop.onChange = _syncEnable;
    assignDrop.onChange = _syncEnable;
    shadowCheck.onClick = _syncEnable;
    toneDrop.onChange = _syncTone;
    _syncTone();

    var repeatCheck = dlg.add("checkbox", undefined, "시트를 가득 채우기 (문구 반복)");
    repeatCheck.value = true;

    dlg.add("statictext", undefined, "헤더 표기 (비우면 첫 문구 사용):");
    var headerInput = dlg.add("edittext", undefined, "");
    headerInput.characters = 24;

    var btns = dlg.add("group");
    btns.alignment = "right";
    btns.add("button", undefined, "취소", { name: "cancel" });
    var okBtn = btns.add("button", undefined, "시트 생성", { name: "ok" });

    var result = null;
    okBtn.onClick = function () {
      var raw = String(textInput.text);
      var lines = raw.split(/[\r\n]+/);
      var clean = [];
      for (var k = 0; k < lines.length; k++) {
        var t = lines[k].replace(/^\s+|\s+$/g, "");
        if (t) clean.push(t);
      }
      if (clean.length === 0) { alert("문구를 입력하세요."); return; }
      result = {
        phrases: clean,
        treatment: toneDrop.selection.index,
        palette: paletteDrop.selection.index,
        assignRotate: (assignDrop.selection.index === 1),
        fontIndex: fontDrop.selection.index,
        heightMm: HEIGHT_VALUES[heightDrop.selection.index],
        haloMm: HALO_VALUES[haloDrop.selection.index],
        layered: (styleDrop.selection.index === 1),
        bouncy: bouncyCheck.value,
        shadow: shadowCheck.value,
        inkHex: String(inkHexInput.text).replace(/^\s+|\s+$/g, ""),
        bgHex: String(bgHexInput.text).replace(/^\s+|\s+$/g, ""),
        shadowHex: String(shHexInput.text).replace(/^\s+|\s+$/g, ""),
        bgMarginMm: BG_MARGIN_VALUES[bgMarginDrop.selection.index],
        repeatFill: repeatCheck.value,
        headerText: String(headerInput.text).replace(/^\s+|\s+$/g, "")
      };
      dlg.close();
    };

    dlg.show();
    return result;
  }

  function _dim(ctrl) {
    try {
      ctrl.graphics.foregroundColor = ctrl.graphics.newPen(
        ScriptUIGraphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.45, 1], 1);
    } catch (e) {}
  }


  // ═════════════════════════════════════════════════════════
  //  이하 Everstory_mixed.jsx (v21 unified) / with_name 에서 그대로
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

  function _copyPathsAsSolid(item, destGroup) {
    if (!item) return;
    if (item.typename === "PathItem") {
      var dup = item.duplicate(destGroup, ElementPlacement.PLACEATEND);
      _forceTempFill(dup);
      return;
    }
    if (item.typename === "CompoundPathItem") {
      for (var cp = 0; cp < item.pathItems.length; cp++) {
        var sub = item.pathItems[cp].duplicate(destGroup, ElementPlacement.PLACEATEND);
        _forceTempFill(sub);
      }
      return;
    }
    if (item.typename === "GroupItem") {
      for (var pi = 0; pi < item.pageItems.length; pi++) {
        _copyPathsAsSolid(item.pageItems[pi], destGroup);
      }
    }
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
    // 02_cutout → sibling 03_output
    if (srcName === "02_cutout") {
      var out = new Folder(srcFolder.parent.fsName + "/03_output");
      if (!out.exists) out.create();
      return out;
    }
    // 프로젝트 폴더를 골랐으면 그 안의 03_output
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

  function _pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

})();
