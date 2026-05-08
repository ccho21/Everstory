Everstory — Style Guide 확장 + Shopify MVP 사이트 빌드 (Stage 5: 테마/스타일)

> **백엔드 셋업 (Stage 1-4)**: 별도 plan — [admin_setup_plan.md](admin_setup_plan.md). 본 plan 은 백엔드 완료 후 Phase A–E 테마/스타일 빌드.

> **⚠️ 폴더 구조 마이그레이션 안내 (2026-05-08)** — 이 plan 은 옛 `design/` 폴더 구조 가정 하에 작성됨. 실제 산출물은 카테고리 재정리 후 `docs/business/` (brand_identity, decisions) 와 `docs/shopify/` (storefront, components, voice, photography, tokens.json, preview/wireframes.html) 로 분산. 본문의 `design/` 언급은 historical 컨텍스트로 읽고, 신규 작업은 새 위치 기준.

Context
왜 지금: 인쇄 시트 brand foundation (폰트 3종 / 컬러 5색 / 톤 / 태그라인 / 차별화 5축) 은 이미 `docs/business/brand_identity.md` + `docs/shopify/tokens.json` 에 lock 되어 있음. 다음 단계는 이걸 web 채널로 확장해 Shopify 에서 9 SKU (Solo / Duo / Trio / Memory Pack × 6 사이즈 + Mixed) 의 첫 매출을 받는 것. 현재 docs/shopify/storefront.md 는 TODO, 웹 전용 토큰·컴포넌트·카피·페이지 구조가 모두 미정.

원하는 결과: 토론토 GTA + 한인 디아스포라 타깃, editorial / boutique / luxury 톤의 Shopify 사이트 — 인쇄 시트 일관성 유지하면서, 결제 → 사진 업로드 → 모크업 이메일 워크플로 동작.

사용자와 합의된 12개 결정:

웹 폰트: Adobe Fonts (Avenir Next LT Pro) + SVG 워드마크 + Playfair/Cormorant (display 대체)
테마: 무료 테마 깊은 커스텀 (Sense 우선 검토 — Built for Shopify 인증)
언어: 영어 단일
MVP 페이지: Standard 9p → 11p 로 수정 (Privacy + TOS 추가)
사진 업로드: Shopify line item property (Customily 미사용)
모크업 승인: 이메일 수동
가이드 산출물: design/ MD 확장 + tokens.json web 파트
사진: 기존 시트 mockup + iPhone 추가 촬영
About 앵글: Toronto local craft 우선
CTA 컬러: Black 버튼 + Coral 텍스트 액센트
Hero: Minimalist editorial — large type + whitespace
가이드 범위: Web 전용 MVP
Phase A — Style Lock (≤5일, 타임박스 엄수)
산출물은 모두 design/ 폴더 안. component spec 은 코드로 lock 하는 다음 phase 에서, 여기서는 토큰·voice·photography 까지만.

A.1 Web typography 명세 — docs/business/brand_identity.md 에 §Web 섹션 추가
Display / wordmark: SVG 변환 (assets/online_logo.png → assets/wordmark.svg)
Body / UI: Avenir Next LT Pro Regular + Bold (Adobe Fonts)
Editorial display 액센트: Playfair Display 700 또는 Cormorant Garamond 600 (Google Fonts) — Hero / About 큰 헤드라인용. 1개로 lock 후보 비교.
Type scale: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48 / 64 (rem 환산)
Hierarchy 규칙: case + tracking + weight 만으로 hierarchy (인쇄 ADR-0004 와 동일 원칙). 추가 family 금지.
Adobe Fonts kit ID + custom 도메인 등록 메모 (Adobe 측 도메인 화이트리스트 필요).
A.2 Web color 토큰 확장 — docs/shopify/tokens.json 에 web 키 추가
인쇄 5색은 print 키로 그대로 보존. 신규 web 토큰:

text.primary       #000000
text.secondary     #4A4A4A     (derived, body 본문)
text.muted         #8A8580     (캡션 / 메타)
text.accent.coral  #FBAAA8     (텍스트 액센트, 배경 아님)
bg.canvas          #FEFDFE     (matte_white, 기본)
bg.muted           #F8F5F2     (section alt)
bg.warm            #E0D3CB     (pearl_grey, accent block)
border.subtle      #ECE6E0
border.strong      #1A1A1A
button.primary.bg  #000000
button.primary.fg  #FFFFFF
button.primary.hover.bg #1A1A1A
button.primary.hover.underline #FBAAA8
state.error        #B23A3A
state.success      #2E7D5B
state.warning      #C77A2E
focus.ring         #000000
ADR-0005 의 "5색 lock" 절충: 시트 콘텐츠는 5색, web UI 는 derived neutral + state 추가 — decisions.md 에 ADR-0006 으로 기록.

A.3 Spacing & layout 시스템 — docs/business/brand_identity.md 에 §Layout 추가
Base 4px grid, scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128
Container max-width: 1280px (콘텐츠), 1440px (full-bleed hero)
Breakpoints: mobile <640, tablet 640-1024, desktop >1024
Section vertical padding: mobile 64px / desktop 96-128px
Grid: 12-col desktop, 4-col mobile
A.4 Voice & copy 가이드 — docs/shopify/voice.md 신규
톤: editorial / calm / confident / warm but not cute
DO 어휘: keep, moments, made, hand, finish, paper, ink, Toronto, kept, slow
DON'T 어휘: amazing, exclusive, premium (이미 luxury 톤이라 형용사 없이도 luxury), super, ultimate, AI, automated
태그라인 사용 규칙: MADE TO KEEP | MOMENTS THAT MATTER 는 Hero / Footer / About 에만, product page 에는 사용 금지
한국 substrate 언급 규칙: About 페이지에서만, "Korean inkjet papers we trust" 류 1단락. 마케팅 카피로 반복하지 않음.
A.5 Photography direction — docs/shopify/photography.md 신규
iPhone 추가 촬영 샷리스트:
Cream linen + 시트 평면샷 (자연광, 11AM 동향 창)
손이 시트 모서리 잡고 들어올리는 close-up
스티커 1장 backing 에서 살짝 떼낸 tactile shot
노트북 / 저널 / 폰케이스에 붙인 lifestyle (3종)
칼선 + 라미네이션 macro detail
컬러 그레이딩: warm WB (5400K), highlight slight desat, shadow lift (인쇄 시트 톤 매칭)
금지: 펫 직접 촬영 (고객 사진이 hero), 형광 / 네온 배경, harsh flash, 한국적 소품 (브랜드 앵글 불일치)
스펙: 정사각 2000×2000 hero, 4:5 detail, 3:4 lifestyle. JPG 90% quality.
A.6 storefront.md 채우기 (페이지별 1-line + CTA + 제목 only)
페이지별 카피는 Phase C 에서 작성. 여기서는 페이지 제목 / H1 / 1줄 부제 / 주 CTA 라벨만.

Phase B — Theme Foundation (≤3일)
B.1 테마 선정 — Phase B Day 1 (2시간 박스)
후보 비교: Dawn (Shopify 기본) vs Sense (BFS 인증) vs Studio (Shopify 공식 무료 여부 확인 필요 — 같은 이름 paid 테마 다수). 비교축: editorial 적합도 / 커스텀 자유도 / 업데이트 주기 / 한 줄 로고 수용성. 추천 = Sense (BFS 인증 + editorial 무드 가까움).

B.2 글로벌 토큰 적용
Theme settings → Color schemes 에 web 토큰 매핑
Theme settings → Typography 에 Adobe Fonts kit ID 입력 + Adobe Fonts head 스니펫 <link> 주입 (layout/theme.liquid 의 {% style %} 위)
Theme settings → Spacing / radius / borders → Phase A.3 값 입력
B.3 헤더 / 푸터 lock
헤더: SVG 워드마크 (왼쪽) + 메뉴 (Shop / About / FAQ) + Cart icon. 메뉴 lower-case + tracking +50, Avenir Next Bold 14px.
푸터: 태그라인 1줄 + 주소 (Toronto) + 이메일 + Instagram + 정책 페이지 4 링크 (Shipping / Refund / Privacy / TOS) + © 라인.
B.4 Component spec 코드로 lock ({% schema %} 안에 settings 정의)
prose spec 은 docs/shopify/components.md 에 rationale 만 (왜 black 버튼인지 등). spec 자체는 Liquid schema 가 source of truth. 다음 컴포넌트만 정의:

button (primary / secondary / ghost / disabled)
input / textarea / file-upload
card (product card, info card)
section-heading (eyebrow + H2 + subtitle 패턴)
pricing-display (variant price)
B.5 Adobe Fonts 도메인 등록
사용자 측 manual: Adobe Fonts dashboard 에서 web project 도메인에 *.myshopify.com + custom 도메인 둘 다 등록. (개발 단계는 myshopify, 도메인 연결 후 추가).

B.6 GA4 + Shopify analytics 활성화
GA4 measurement ID 를 theme settings 또는 head 에 1줄 주입. Shopify analytics 는 자동.

병렬 작업 (사용자 측, B 와 동시): A.5 photography 샷리스트로 iPhone 촬영. 도메인 구매 + DNS A/CNAME 연결 (24h propagation 버퍼).

Phase C — 11 Pages Build (≤10일)
각 페이지 acceptance gate: ① 모바일 반응형 ② SEO meta (title / description / og:image) ③ 접근성 contrast 4.5:1.

C.1 Home (templates/index.json)
Hero section (1 viewport): 워드마크 + 태그라인 + 1 시트 mockup 사진 + Primary CTA Shop the lookbook → /collections/all
Section 2: "How it works" 3 스텝 (Choose / Send your photo / Approve mockup → We print)
Section 3: SKU 4 카드 (Solo / Duo / Trio / Memory Pack) + 가격 + 사이즈 hint
Section 4: Why Everstory — 차별화 5축 압축 3-4 카드
Section 5: Toronto local block (지역 + 픽업 가능 강조)
Footer
C.2 Product page 템플릿 (1개 만들어 4 product 공유)
핵심 결정: Solo=1 슬롯 / Duo=2 / Trio=3 / Memory Pack=4 슬롯 하드코딩.

Hero gallery (4-6 mockup + lifestyle 이미지)
Title + 가격 + 사이즈 selector (XS/S/M/L/XL/XXL/Mixed) + 재질 selector (White/Pearl Grey/Silver/Gold)
Line item property 필드:
Photo upload slot 1..N (N = 1/2/3/4, product 별 고정) — Shopify 기본 file picker
Pet/person name slot 1..N
Optional notes (textarea, 200자 limit)
"What you'll get" 타임라인 4 스텝 (Order → We make a mockup → You approve → Print + ship)
"Photo guidelines" callout (해상도 권장, 어떤 사진이 잘 누끼되는지)
Add to cart CTA (Black / hover coral underline)
C.3 About — Toronto local craft 앵글
Hero: studio / 손 / 작업대 사진 (iPhone 촬영분 활용)
Story: 토론토에서 시작 → 사진 보존이라는 작은 의식 → 한국 inkjet paper 한 단락 (재료 큐리티)
차별화 5축 (시트 mockup + 한 줄 설명)
Process strip: PSD → cutout → mockup → print → cut (5 step illustration)
C.4 Shipping & Pickup
GTA pickup: 위치 + 시간 + Kakao/email 약속
Canada Post: 주문 후 7-10영업일 (모크업 승인 3일 + 제작 2일 + 배송 2-5일) — 변동 가능 명시
해외 배송: 현재 미지원
C.5 Refund Policy
모크업 승인 전 취소 = full refund
모크업 승인 후 = no refund (커스텀 상품)
인쇄 결함 / 배송 사고 = replacement 또는 refund
C.6 FAQ (~10 Q&A)
워크플로 / 사진 품질 / 일정 / 사이즈 선택 / 픽업 / 다회 주문 / 한글 가능 여부 / 반려동물 외 사진 가능 여부 등.

C.7 Privacy Policy (PIPEDA + GDPR 수용 톤)
Shopify 기본 generator 베이스 → 브랜드 톤 다듬기. 데이터 보관 (사진 / 주문) 명시.

C.8 Terms of Service
Shopify 기본 generator 베이스 → 커스텀 상품 / 모크업 승인 / 환불 조건 명시.

C.9 도메인 + DNS + SSL
사용자 측 manual: registrar 에서 DNS A/CNAME 을 Shopify 로 → Shopify SSL 자동 발급.

Phase D — Order Plumbing (≤3일)
D.1 Order Confirmation 이메일 수정
Shopify Admin → Settings → Notifications → Order confirmation 의 additional_content 에 1 단락 추가:

"Your order is in. We'll prepare a PDF mockup within 24 hours and email it to you for approval before printing."
Footer thank-you (footer chip 톤 재활용)
D.2 line item property 검증
테스트 결제: 사진 파일 첨부 → admin 에서 다운로드 가능 확인
Memory Pack 4 슬롯 모두 첨부 시 admin order detail 에 4개 모두 보이는지
D.3 Order tag 자동화 (선택, Shopify Flow 무료 앱)
주문 tag: solo | duo | trio | memory + size + material. 수동 운영 가능, Flow 는 W5 이후로 미뤄도 됨.

D.4 Tax + shipping zones
HST (ON 13%) 등록 (사용자 측 행정)
Shipping zones: GTA pickup ($0) / Ontario / 기타 캐나다 / 해외 (미지원)
Canada Post 연결 또는 flat rate
D.5 Cookie consent
Shopify 기본 Cookie banner 활성화 + Privacy 페이지 링크.

D.6 End-to-end 테스트
실제 결제 (테스트 카드) → 사진 첨부 → admin 에서 다운로드 → 모크업 PDF 수동 제작 → 이메일 발송 → 승인 회신 → 인쇄 단계로 넘어감 확인.

Critical Files
생성 / 수정될 파일:

docs/business/brand_identity.md — Web 섹션 추가 (typography / layout / spacing)
docs/shopify/tokens.json — web 키 + print 키로 분리, web 토큰 셋 추가
docs/business/decisions.md — ADR-0006 (web color extension), ADR-0007 (component spec lives in Liquid schema)
docs/shopify/voice.md — 신규
docs/shopify/photography.md — 신규
docs/shopify/components.md — 신규 (rationale only, spec 은 Liquid)
docs/shopify/storefront.md — 페이지별 카피 / CTA / 제목
assets/wordmark.svg — 신규 (assets/online_logo.png 변환)
Shopify 테마 (Sense 또는 선택 테마) — 글로벌 settings + sections + templates
templates/product.json (1개로 4 product 커버)
templates/index.json
templates/page.about.json, page.shipping.json, page.refund.json, page.faq.json, page.privacy.json, page.tos.json
sections/everstory-hero.liquid, everstory-how.liquid, everstory-sku-grid.liquid, everstory-toronto.liquid 등
기존에 활용:

assets/online_logo.png — 워드마크 SVG 변환 원본
assets/illustrator_template_*.png — Home / Product page mockup 자산
docs/business/strategy.md §8 (Shopify 우선), §9 (W1-W6 일정), §13 (HST)
docs/implementation/product_mvp.md — 사이즈 / 재질 / cap 표
Open Decisions (실행 중 확정)
Editorial display 폰트: Playfair Display vs Cormorant Garamond — A.1 끝에 둘 다 시안 보고 lock.
테마 최종 선정: Sense vs Dawn 데모 30분 비교 후 lock.
Memory Pack 4 슬롯 vs N 슬롯 (4-7) 가변: MVP 는 4 고정, "더 필요하면 카트 2개 주문" 안내. 추후 가변화 검토.
Newsletter form / Meta Pixel: 첫 50건 전까지 미장착, MVP 에서 제외.
Order tag 자동화 (Flow): 운영 부담 따라 W5 이후 추가.
Verification
Phase A 끝: design/ 의 7개 파일 (brand_identity.md / tokens.json / decisions.md / voice.md / photography.md / components.md / storefront.md) 모두 채워져 있고, 새 ADR 2개 (0006, 0007) 가 decisions.md 에 추가됨.

Phase B 끝: Shopify 개발 스토어에서 글로벌 토큰 (color / type / spacing) 이 모두 적용된 빈 헤더 + 빈 푸터 + 빈 홈이 보임. 모바일 반응형 OK. Adobe Fonts 가 콘솔 에러 없이 로드.

Phase C 끝: 11 페이지 모두 콘텐츠 채워져서 dev 스토어에서 클릭 가능. 각 페이지 acceptance gate 3개 (모바일 / SEO meta / contrast) 통과.

Phase D 끝 (== MVP 출시 가능): 실제 테스트 카드로 Solo / Memory Pack 각 1건 주문 → 사진 N개 attachment 다운로드 → 수동 모크업 워크플로우까지 1회 완주 성공. Order Confirmation 이메일에 production 안내 단락 보임.

전체 완료 신호: 첫 실주문 결제 → 사진 받음 → 모크업 PDF 이메일 발송 → 고객 승인 회신 → 운영자가 Everstory_mixed_v2.jsx 로 시트 생성 → ET-8550 + Summa D75 출력 → GTA 픽업 또는 Canada Post 발송. 이 한 사이클이 디지털 → 물리 끝까지 깨지지 않음.