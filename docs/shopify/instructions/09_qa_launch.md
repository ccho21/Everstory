# Batch 9 — 최종 QA + Test order + Pre-launch checklist

이 문서로 launch 전 storefront 전체를 점검하고 first test order 를 통과시킨다. 8개 batch 가 끝난 시점에서 막힌 구멍을 잡는 게 목적.

- **소요 시간**: 약 60–90분 (test order + 모바일 / 데스크톱 visual + content + accessibility)
- **이전 batch**: `08_pages.md`
- **다음 단계**: 정식 launch (storefront password 해제 + theme publish)

---

## 시작 전 점검

- [ ] Batch 1–8 모두 종료
- [ ] 본인 모바일 폰 (iPhone 또는 Android) 준비 — 실제 모바일 검증용
- [ ] 테스트 카드 번호 `4242 4242 4242 4242` 메모 — Shopify Payments test mode (1.4.3)
- [ ] 본인 외 누군가 (지인 / 가족) 의 눈으로도 한 번 봐줄 수 있으면 best

---

## Step 9.1 — Visual QA

### 9.1.1 데스크톱 (1280–1440 width)

[Action 9.1.1.a] 본인 데스크톱 브라우저에서 storefront 모든 페이지 한 번씩 진입:

- `/` (Home)
- `/collections/photo-sheets` (Collection)
- `/products/solo`
- `/products/duo`
- `/products/trio`
- `/products/memory-pack`
- `/pages/about`
- `/pages/faq`
- `/pages/sizing-guide`
- `/pages/materials-guide`
- `/policies/shipping-policy`
- `/policies/refund-policy`
- `/policies/privacy-policy`
- `/policies/terms-of-service`
- `/cart` (cart drawer 가 아닌 full cart 페이지)
- `/account/login`

#### 체크포인트 (각 페이지)
- [ ] Header 가 같은 형태 (announcement + logo + menu + utility)
- [ ] Footer 가 같은 형태 (jumbo + 4 column + social + copyright + policy list)
- [ ] 본문이 깨지지 않음 (overflow / 잘린 텍스트 / 빈 공간 없음)
- [ ] 이미지가 비율 유지 (찌그러지지 않음)
- [ ] 색상이 색상 scheme 과 일치

### 9.1.2 모바일 (실제 폰)

[Action 9.1.2.a] 본인 모바일에서 같은 16개 URL 진입

#### 모바일 특이 체크포인트
- [ ] Header 가 햄버거 메뉴 (☰) + 로고 + 카트 3-column 레이아웃
- [ ] 햄버거 메뉴 탭 → drawer 슬라이드 → Main menu 정상 노출
- [ ] Hero 가 모바일에서 잘림 없이 텍스트 + 이미지 stack
- [ ] Product card grid 가 1 또는 2 column (4 column 아님)
- [ ] PDP 의 media gallery 가 모바일 상단, details 그 아래 (좌우 배치 아님)
- [ ] **PDP 의 Easify upload field 가 너무 길어 buy button 을 viewport 밖으로 밀어내지 않는지** ← 가장 중요
- [ ] Footer 4 column 이 모바일에서 세로 stack
- [ ] 한국어 안내 섹션 가독성 (모바일 폰트 사이즈 충분)

### 9.1.3 다양한 viewport (Theme Editor)

[Action 9.1.3.a] Theme Editor 우측 상단 디바이스 토글로 데스크톱 / 태블릿 / 모바일 빠르게 확인 — 어색한 viewport 발견 시 해당 section 의 spacing / column count 조정

---

## Step 9.2 — Ecommerce QA (test order)

### 9.2.1 Test mode 활성화

[Action 9.2.1.a] admin → Settings → Payments → Shopify Payments → `Manage` → `Test mode` ✅ on

[Action 9.2.1.b] 모든 4 SKU 의 status → `Active` 로 임시 전환 (storefront 에서 보여야 test order 가능)

> ⚠️ Storefront password (Online Store → Preferences → Password) 가 활성이면 본인은 정상 진입, 외부에서는 차단. Launch 전에는 password 유지가 안전.

### 9.2.2 Solo SKU 결제 테스트 (필수 path)

[Action 9.2.2.a] storefront `/products/solo` → 다음 진행:

1. Variant: `S × White Matte` (default)
2. Easify field:
   - Photo upload → 본인 사진 1장 (5MB 이내) 업로드
   - Header name → `Test Pet`
   - Order notes → `Test order — please ignore`
3. Quantity = `1`
4. `Add to cart`

[Checkpoint 9.2.2.a] ✅ Cart drawer (또는 `/cart`) 열림 → line item 에:
- 상품명 + variant (Solo / S / White Matte)
- 가격 (`$15.99 CAD`)
- **Photo 1**: `[filename.jpg]` 표시
- **Name 1**: `Test Pet`
- **Special instructions**: `Test order — please ignore`

[Action 9.2.2.b] `Checkout` 클릭

[Action 9.2.2.c] Checkout 폼:
- Email → 본인 이메일
- Address → Toronto (`M5V 3A8`)
- Shipping method → `Free shipping (lettermail)` 노출 → 선택
- Payment → 카드: `4242 4242 4242 4242` / 만료 미래 / CVV `424` / ZIP `M5V 3A8`
- `Pay now` 클릭

[Checkpoint 9.2.2.b] ✅ "Thank you for your order" 페이지. order ID 표시.

[Action 9.2.2.d] admin → Orders → 해당 order 클릭 → 다음 모두 노출 확인:
- 상품 라인 (Solo / S × White Matte / $15.99)
- HST 13% 라인 (Toronto 주소이므로)
- Shipping = $0.00 (Ontario free)
- Total 일치
- **Line item properties**: Photo 1 (파일 URL 클릭 가능) / Name 1 / Special instructions
- 고객 정보, 배송지, payment status

[Checkpoint 9.2.2] ✅ Test order 1건 admin 에 정상 기록.

### 9.2.3 Memory Pack SKU 테스트 (4–8 photo upload)

[Action 9.2.3.a] `/products/memory-pack` → 다음:

1. Variant: `S × White Matte`
2. Easify field:
   - Photo 1–4 → 사진 4장 업로드 (필수)
   - Photo 5–8 → 비워둠 (옵션)
   - Header name → `Test Family`
   - Special instructions → `Test`
3. `Add to cart`

[Checkpoint 9.2.3.a] ✅ Cart line item 에 Photo 1–4 모두 노출. Photo 5–8 은 노출 안 됨 (비어 있어서) 또는 빈 라인.

[Action 9.2.3.b] (옵션) Photo 5–8 도 채워서 다시 시도 → 8장 모두 노출 확인.

### 9.2.4 차단 시나리오 검증

#### 필수 photo 누락
[Action 9.2.4.a] Solo PDP → photo 업로드 안 한 채 `Add to cart` → "Photo 1 is required" 에러 메시지 노출, cart 추가 차단

[Checkpoint 9.2.4.a] ✅ 필수 field 검증 작동.

#### 비-Ontario 주소
[Action 9.2.4.b] 임시로 Memory Pack 1개 add to cart → checkout → address 를 밴쿠버 (`V6B 1A1`) 입력 → "We don't ship to your address" 또는 shipping method 0개 노출

[Checkpoint 9.2.4.b] ✅ Ontario 외 차단.

[Action 9.2.4.c] 주소 다시 Toronto 로 변경 → free shipping 노출 정상

### 9.2.5 픽업 옵션 검증

[Action 9.2.5.a] checkout 에서 shipping method 선택지 → `Toronto Studio Pickup` 노출 → 선택 시 $0.00, ETA 메시지 노출

[Checkpoint 9.2.5] ✅ Local pickup 정상.

---

## Step 9.3 — Content QA

### 9.3.1 SEO meta 점검

[Action 9.3.1.a] 각 페이지의 page source (`Cmd+U` Mac / `Ctrl+U` Windows) 또는 브라우저 dev tools `Elements` 탭 → `<head>` 확인:

각 페이지마다:
- [ ] `<title>` 태그 정상 (Batch 3 에서 입력한 SEO title)
- [ ] `<meta name="description">` 정상
- [ ] `<meta property="og:title">` 자동 생성

### 9.3.2 본문 누락 점검

- [ ] 4 SKU 모두 product description 정상 노출 (Common 섹션 + 한국어 footer 포함)
- [ ] About / FAQ 페이지 한국어 안내 섹션 노출
- [ ] Policy 4개 (Refund / Shipping / Privacy / Terms) 본문에 placeholder (`[…]`) 0개

[Action 9.3.2.a] 각 정책 페이지 진입 → `Cmd+F` (찾기) → `[` 검색 → **0 결과** 가 정답. 결과 있으면 placeholder 미교체 → 해당 placeholder 즉시 교체.

### 9.3.3 링크 점검

- [ ] Main menu (Shop / About / FAQ) 모두 클릭 → 정상 페이지 진입
- [ ] Footer 의 모든 링크 (Step 8.5 와 중복) 작동
- [ ] Hero secondary CTA `How it works` (`#how-it-works`) → 같은 페이지 anchor 스크롤
- [ ] PDP accordion 의 `See sizing guide →` → `/pages/sizing-guide` 정상

---

## Step 9.4 — Accessibility QA

### 9.4.1 Image alt text

[Action 9.4.1.a] admin → Files (또는 Content → Files) → 업로드된 이미지마다 alt text 입력:
- Hero image → `Sticker sheet samples on a wooden surface` 같이 묘사적
- Product images → `[Product name] sticker sheet — [color] material`
- About / Why image → studio 묘사

> Theme Editor 의 Image block 에서도 alt 직접 입력 가능.

### 9.4.2 버튼 / 링크 라벨

- [ ] 모든 버튼이 명확한 액션 (`Add to cart`, `Buy with Shop Pay`, `Sign up` 등)
- [ ] 빈 링크 (`<a>` 인데 텍스트 없음) 없음
- [ ] 아이콘 only 버튼 (search / cart) 에 `aria-label` 또는 visually hidden 텍스트 — Horizon default 지원

### 9.4.3 텍스트 contrast

[Action 9.4.3.a] 데스크톱 브라우저 dev tools → `Lighthouse` 탭 → `Accessibility` 카테고리 → run

[Checkpoint 9.4.3] ✅ Lighthouse Accessibility score 90 이상. 90 미만이면 issues 검토 후 색상 / contrast 조정.

### 9.4.4 키보드 네비게이션

[Action 9.4.4.a] PDP 진입 → `Tab` 키만으로 페이지 이동:
- 메뉴 → 검색 → 카트 → 변형 picker → Easify field → Add to cart → accordion 토글

[Checkpoint 9.4.4] ✅ 모든 interactive 요소가 Tab 으로 도달 가능, focus indicator (outline) 보임.

---

## Step 9.5 — Pre-launch checklist

런칭 직전 한 번 더:

### 9.5.1 Settings 최종 확인

- [ ] **1A General**: Currency = CAD (lock 후 변경 불가)
- [ ] **1D Payments**: Shopify Payments active, test mode **off**
- [ ] **1E Shipping**: Ontario Free Shipping zone, Toronto Studio Pickup 정상
- [ ] **1F Taxes**: HST 13% Ontario 자동 계산, HST 번호 입력
- [ ] **1H Notifications**: Sender email verified
- [ ] **1I Policies**: 4 정책 모두 publish, placeholder 0개

### 9.5.2 상품 / 콘텐츠

- [ ] 상품 4종 status = **Active** (Draft 아님)
- [ ] 상품 이미지 진짜 사진으로 교체 (placeholder 없음)
- [ ] 모든 페이지에 SEO title + description
- [ ] Footer 의 이메일 placeholder (`orders@everstory-domain.com`) → 실제 도메인 이메일로 교체
- [ ] Policy 본문 의 `[Toronto address]` / `[YYYY-MM-DD]` 모두 실제 값
- [ ] 한국어 안내 섹션의 이메일 placeholder 도 교체

### 9.5.3 Theme

- [ ] Theme Editor 의 unpublished theme 에서 모든 작업 완료
- [ ] 데스크톱 + 모바일 미리보기 모두 정상

### 9.5.4 Launch action

> ⚠️ 다음 액션은 **storefront 즉시 외부 노출**. 9.5.1 ~ 9.5.3 모두 ✅ 후에만 진행.

[Action 9.5.4.a] **Theme publish**:
- admin → Online Store → Themes → 작업한 unpublished theme → `Publish` (또는 우측 `…` → `Publish`)
- 기존 published theme 은 자동으로 unpublished 로 이동

[Action 9.5.4.b] **Storefront password 해제**:
- admin → Online Store → Preferences → `Password page` 섹션 → "Restrict access" 또는 "Enable password" → ❌ off
- Save

[Action 9.5.4.c] **Test mode off**:
- admin → Settings → Payments → Shopify Payments → `Manage` → Test mode → ❌ off

[Action 9.5.4.d] **DNS / 커스텀 도메인 연결** (있다면):
- admin → Settings → Domains → custom domain 연결 후 primary 로 설정

[Action 9.5.4.e] (옵션) **첫 실주문 검증**: 본인 또는 지인이 실제 카드로 1건 결제 → 정상 통과 + admin 에 order 표시 + 결제 후 즉시 환불 (admin → Orders → Refund)

[Checkpoint 9.5.4] ✅ Storefront 외부에서 비밀번호 없이 접속 가능. test mode off. 도메인 연결 (있다면) 완료.

---

## Step 9.6 — Launch 후 monitoring

런칭 후 며칠 / 한 주 동안 추적:

- [ ] admin → Analytics 의 Sessions / Conversion rate / Average order value 일별 모니터링
- [ ] 첫 실주문 1건 처리 — 인쇄, 커팅, 픽업/발송 흐름 확인
- [ ] 첫 고객 문의 응대 (이메일) — 영문 + 한국어
- [ ] Easify upload 실패 / 결제 실패 / 배송 차단 같은 이슈 즉시 디버깅
- [ ] Storefront performance — Google PageSpeed Insights / Core Web Vitals 확인 후 launch 후 1주 내 최적화

---

## Batch 9 종료 = Launch 준비 완료

다음 모두 ✅ 면 storefront 정식 launch 가능:

- [ ] **Visual QA** (데스크톱 + 모바일, 16개 URL)
- [ ] **Ecommerce QA** (Solo / Memory Pack 결제, 차단 시나리오, 픽업)
- [ ] **Content QA** (SEO, 본문 누락, placeholder 제거, 링크 작동)
- [ ] **Accessibility** (alt text, contrast, keyboard nav)
- [ ] **Pre-launch checklist** (settings / 상품 active / theme publish / password 해제 / test mode off)

---

## 다음 단계 (선택 enhancement)

Launch 후 batch 1–9 외에 검토할 후보:

1. **상품 사이즈/재질별 가격 차등** (Batch 3 의 default base 가격을 실제 차등으로)
2. **FAQ accordion 분리** (Batch 8 옵션 C — `page.faq.json` 별도 template)
3. **Sizing / Materials guide 시각화** — table / icon 추가
4. **카카오톡 social icon** — Horizon social-links 미지원, 별도 custom snippet
5. **Korean locale 추가** — Markets 에 Korean 추가, 본문 번역
6. **Blog launch** — Featured blog posts section 활성화
7. **Memory Pack name field** 분리 (1개 → 4개) — 옵션 A2
8. **Color scheme / typography** 디자인 토큰 sync — `../../design/tokens.json` 적용
9. **Custom variant count metafield** (Batch 7 옵션 1) 로 SKU 별 "1 design · A5 sheet" 동적 표시
10. **추가 product photo / lifestyle 이미지**

---

## 모든 인스트럭션 완료

🎉 9개 batch 모두 작성 완료. `instructions/01_*.md` ~ `instructions/09_*.md` 순서로 따라가면 wireframe → Horizon storefront 적용이 끝까지 진행된다.

막히는 지점 / 인스트럭션과 실제 admin UI 가 다른 부분이 발견되면 batch 단위로 피드백 받아 보강.
