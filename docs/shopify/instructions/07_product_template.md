# Batch 7 — Product 템플릿 + Easify 연동 + 추천 상품

이 문서로 Theme Editor 에서 **Product 페이지 (`/products/solo` 등)** 를 wireframe 기준으로 셋업한다. 4 SKU 모두 같은 `templates/product.json` 을 공유하므로 Solo 기준 한 번만 셋업하면 4 상품 모두 자동 적용. **Easify app block** 을 정확한 위치에 배치하는 게 핵심.

- **소요 시간**: 약 60–90분
- **이전 batch**: `06_home_collection.md`
- **다음 batch**: `08_pages.md` (About / FAQ / Sizing / Materials)
- **Wireframe 참조**:
  - [`../wireframes/product-solo.html`](../wireframes/product-solo.html) (1 photo slot)
  - [`../wireframes/product-duo.html`](../wireframes/product-duo.html) (2 slots)
  - [`../wireframes/product-trio.html`](../wireframes/product-trio.html) (3 slots)
  - [`../wireframes/product-memory-pack.html`](../wireframes/product-memory-pack.html) (4–8 slots)

---

## 시작 전 점검

- [ ] Batch 4 종료 — Easify Product Options 앱 설치, option set 4종 등록, 각 SKU 에 연결됨
- [ ] Batch 6 종료 — Home + Collection 정상
- [ ] 상품 이미지 (각 SKU 1–4장) 준비 — 없으면 일단 placeholder, launch 전 교체
- [ ] Easify display mode = `App block` (Step 4.5 에서 셋업)

---

## Wireframe 기준 PDP block 순서

```
_product-details (right column 컨테이너)
  ├─ group · Header
  │   ├─ Eyebrow text  ("Custom Photo Sticker Sheet")
  │   ├─ Product title
  │   ├─ Variant count text  ("1 design · A5 sheet")
  │   └─ Price
  ├─ Divider
  ├─ Variant picker  (Size · Material)
  ├─ ⭐ Easify app block  ← 사진/이름/노트 업로드
  ├─ Buy buttons  (Quantity + Add to cart + Accelerated checkout)
  ├─ Accordion  (5 row: What you get / Materials & sizes / Care / Lead time / Photo guidelines)
  └─ Product description text  ({{ product.description }})
```

좌측 column = `_product-media-gallery` (static).

---

## Step 7.1 — Theme Editor 에서 Product 진입

[Action 7.1.a] Theme Editor 좌측 상단 페이지 selector → `Products` → `Solo` (또는 default `Product page`)

> 특정 SKU 선택하면 그 SKU 의 데이터로 미리보기. Default `Product page` 는 4 SKU 공통 template.

[Action 7.1.b] 좌측 트리 default 구성:
- `Product information` (`main` section, type=`product-information`)
  - `_product-media-gallery` (static, 좌측)
  - `_product-details` (static, 우측)
- `Product recommendations`

[Checkpoint 7.1] ✅ Solo 미리보기 진입. 좌측에 이미지 / 우측에 title + price + variant-picker + buy-buttons + description 노출.

---

## Step 7.2 — Product information section settings

[Action 7.2.a] 좌측 트리 `Product information` 클릭 → 우측 settings:

| 항목 | 값 |
|------|------|
| Content width | `content-center-aligned` |
| Desktop media position | `left` (이미지 좌측) |
| Equal columns | ❌ off |
| Limit details width | ❌ off |
| Gap | `48` |
| Color scheme | (default 또는 `scheme-1`) |
| Padding | 적절히 |

[Checkpoint 7.2] ✅ Section settings 적용. 미리보기에 좌측 이미지 / 우측 details 2-col 레이아웃.

---

## Step 7.3 — _product-media-gallery (좌측)

[Action 7.3.a] `_product-media-gallery` block 클릭 → 우측 settings:

| 항목 | 값 | 비고 |
|------|------|------|
| Media presentation | `grid` | 또는 `slideshow` (모바일 제스처 좋음) |
| Media columns | `two` | 2-col thumbnail layout |
| Image gap | `4` | thumbnail 사이 간격 |
| Aspect ratio | `adapt` 또는 `square` | wireframe 은 1:1 |
| Constrain to viewport | ✅ on | 너무 큰 이미지 viewport 안으로 축소 |
| Media fit | `contain` | 이미지 잘림 방지 |
| Zoom | ✅ on | 클릭 시 확대 |
| Hide variants | ✅ on | variant 별 다른 이미지 자동 노출 시 hide 가 깔끔 |
| Thumbnail position | `right` 또는 `bottom` | wireframe 은 bottom strip |

[Checkpoint 7.3] ✅ Media gallery 좌측에 main image + thumbnail strip 표시.

---

## Step 7.4 — _product-details: Header group 설정

[Action 7.4.a] `_product-details` 펼치기 → 첫 번째 `group · Header` block 클릭

### Group settings
- Content direction → `column`
- Gap → `8`
- Width → `fill`

### 안의 block 순서 (위→아래):

#### 1. Eyebrow text — **새로 추가**

[Action 7.4.a.1] Header group 안에서 `+ Add block` → `Text`:
- Text → `<p class="eyebrow">Custom Photo Sticker Sheet</p>` (또는 plain `Custom Photo Sticker Sheet`, type-preset = `Eyebrow`)
- Type preset → `eyebrow` 또는 `paragraph` (smaller)
- Color → muted (예: `var(--color-foreground-secondary)`)

#### 2. Product title — default text block 사용

[Action 7.4.a.2] 기존 `text · Product title` block 클릭:
- Text → `<h1>{{ closest.product.title }}</h1>` (default 유지)
- Type preset → `h2` (또는 `h1` 더 크게 원하면)

> Solo 의 자동 title = `Custom Photo Sticker Sheet — Solo`. Eyebrow 와 중복되어 보이면 Solo title 을 admin 에서 짧게 (`Solo`) 변경하거나, eyebrow 를 다른 텍스트로.

#### 3. Variant count text — **새로 추가**

[Action 7.4.a.3] Header group 안에서 `+ Add block` → `Text`:
- Text → `<p>1 design · A5 sheet</p>` (Solo)
- Type preset → `paragraph` (small)
- Color → muted

> 다른 SKU 도 같은 template 이므로 이 텍스트는 Solo 기준 hardcode 됨. SKU 별로 다른 텍스트 보이게 하려면:
> - 옵션 1: Liquid 변수로 `{{ closest.product.metafields.custom.variant_count_label }}` (각 SKU 의 metafield 사용) — admin 에서 metafield 설정 필요
> - 옵션 2: Solo / Duo / Trio / Memory Pack 별도 template (`product.solo.json` 등) 으로 분리
> - 옵션 3: text 를 product description 첫 줄로 옮기고 여기 block 은 hide
> 
> MVP 추천 = **옵션 3** (text 를 description 으로 이전, header 에는 title + price 만). 또는 옵션 1 (metafield 한 번 셋업).

#### 4. Price — default 사용

[Action 7.4.a.4] 기존 `price` block 클릭:
- Show sale price first → ✅ on
- Show installments → ❌ off
- Show tax info → ❌ off
- Type preset → `h6` (또는 더 크게)
- Font size → `1.25rem` 정도

[Checkpoint 7.4] ✅ Header group 안에 4 block (eyebrow → title → variant-count → price) 또는 옵션 3 따라 3 block (eyebrow → title → price). description 은 별도 block.

---

## Step 7.5 — Variant picker

[Action 7.5.a] `_product-details` 의 `variant-picker` block 클릭

[Action 7.5.b] Settings:
- Variant style → `buttons` (wireframe 의 swatches 와 가장 가까움)
- Show swatches → ❌ off (text 라벨이 더 명확. Material 을 swatch 색상으로 표시하려면 ✅ on + admin 의 variant 에 swatch 색상 등록 필요)
- Alignment → `left`
- Padding → default

[Checkpoint 7.5] ✅ Variant picker 에 Size 7 옵션 + Material 4 옵션이 button 으로 표시. default = `S × White Matte`.

> Material 을 swatch 로 표시하려면: admin → Products → Solo → Variants → 각 Material variant → "Add a swatch" → 색상/이미지 등록. 그 후 Theme Editor 의 `Show swatches` ✅. MVP 는 text label 로 충분.

---

## Step 7.6 ⭐ Easify app block 추가

[Action 7.6.a] `_product-details` 안에서 → `variant-picker` block 다음 위치에 `+ Add block` 클릭

[Action 7.6.b] 블록 selector 에서 **Apps** 카테고리 또는 검색창에 `Easify` 입력 → Easify Product Options 앱 block 표시

[Action 7.6.c] Easify app block 선택 → 자동으로 `_product-details` 안에 추가됨

[Action 7.6.d] App block 위치 조정 — 좌측 트리에서 드래그하여 다음 순서:

```
_product-details
  ├─ group · Header
  ├─ _divider
  ├─ variant-picker
  ├─ Easify app block       ← 여기
  ├─ buy-buttons
  ...
```

[Action 7.6.e] App block settings (있다면):
- Display option set → `Auto-detect` 또는 SKU 와 매칭되는 option set 직접 지정 (Easify 가 SKU 별 option set 을 자동 매칭하면 auto)

[Checkpoint 7.6] ✅ Solo PDP 미리보기 → variant picker 아래에 Easify field 노출:
- Upload your photo (required) — file upload 박스
- Header name (optional) — text input
- Order notes (optional) — textarea

> 미리보기에 안 보이면:
> - Easify dashboard → option set 이 Solo 상품에 연결되어 있는지 재확인
> - App block settings 에서 option set 명시적으로 지정
> - Theme Editor 새로고침
> - 그래도 안 보이면 막혔다 알려줘 → 스크린샷

---

## Step 7.7 — Buy buttons

[Action 7.7.a] `buy-buttons` block 클릭 → settings:
- Stacking → ✅ on (모바일에서 quantity / add-to-cart 세로 stack)
- Show pickup availability → ❌ off (또는 ✅ on — 1B Locations 와 연동, "Available at Toronto Studio" 표시)

[Action 7.7.b] 안의 static blocks:
- `quantity` block — default 유지
- `add-to-cart` block — Style class = `button` (primary)
- `accelerated-checkout` block — default (Shop Pay / Apple Pay / Google Pay 자동)

[Checkpoint 7.7] ✅ Buy buttons 영역에 quantity selector + "Add to cart" 버튼 + Shop Pay / 추가 결제 옵션 버튼.

---

## Step 7.8 — Accordion 추가

> Horizon 의 accordion 은 `accordion` block (또는 row 형태) 으로 추가. `_product-details` 의 block selector 에서 `Accordion` 또는 `Collapsible content` 검색.

[Action 7.8.a] `_product-details` 안에서 `+ Add block` → `Accordion` 선택 (또는 `Collapsible content`, `_accordion-row` 등 horizon 버전마다 라벨 다를 수 있음)

[Action 7.8.b] 위치 조정 — `buy-buttons` 다음, `Product description` text 앞으로 드래그

[Action 7.8.c] Accordion 안에 `+ Add row` (또는 `+ Add block`) 으로 5개 row 추가:

#### Row 1 — What you get
- Heading → `What you get`
- Open by default → ✅ on (Solo 기준 첫 row 만 펼침)
- Content (Rich text):
  ```
  - One A5 sticker sheet (148 × 195 mm)
  - One photograph, repeated at chosen size
  - ~7–13 stickers depending on size
  - Header printed with your name + order date
  - Reviewed and hand-cut at our Toronto studio
  ```

#### Row 2 — Materials & sizes
- Heading → `Materials & sizes`
- Open by default → ❌ off
- Content:
  ```
  White Matte / Pearl Grey / Silver / Gold — all Korean substrates with LAMat-AF / Oraguard lamination, waterproof and fade-resistant. Sizes XS through XXL plus Mixed.
  ```
  + Link → `See sizing guide →` → Pages → `Sticker Size Guide`

#### Row 3 — Care & lifespan
- Heading → `Care & lifespan`
- Content:
  ```
  Indoor 5+ years. Outdoor 2-3 years. Top-rack dishwasher safe occasionally. Hand wash recommended.
  ```

#### Row 4 — Lead time & shipping
- Heading → `Lead time & shipping`
- Content:
  ```
  Print + cut: 1–3 business days. Ships 2–5 business days from order. Free Ontario shipping or Toronto pickup.
  ```

#### Row 5 — Photo guidelines
- Heading → `Photo guidelines`
- Content:
  ```
  Bright lighting, subject filling the frame, minimal motion blur. We email if a photo needs replacement before printing.
  ```

[Checkpoint 7.8] ✅ Accordion 영역에 5 row, 첫 row "What you get" 만 default open.

> ⚠️ Accordion 본문은 4 SKU 모두 공통 (template 공유). SKU 별 차이 (Memory Pack 의 "two A5 sheets" 등) 는 product description 안에서 SKU 별로 처리 (이미 admin 에 입력되어 있음).

---

## Step 7.9 — Product description text

[Action 7.9.a] `_product-details` 의 마지막 `text · Product description` block 클릭

[Action 7.9.b] Settings:
- Text → `{{ closest.product.description }}` (default 유지) — 각 SKU 의 admin 에 입력한 description 자동 노출
- Type preset → `rte` (rich text formatting 보존)
- Color → default
- Width / max-width → 적절히

[Checkpoint 7.9] ✅ Accordion 다음에 product description (Solo 의 경우 "One photo. One sheet. Many moments to keep..." + Common 섹션 + 한국어 footer) 자동 표시.

---

## Step 7.10 — Product recommendations

[Action 7.10.a] 좌측 트리 `Product recommendations` section 클릭

[Action 7.10.b] Settings:
- Product → `{{ closest.product }}` (default, 현재 product 기준 추천)
- Recommendation type → `related` (자동 추천) 또는 `complementary`
- Layout type → `grid`
- Max products → `4`
- Columns → `4`
- Mobile columns → `2`
- Color scheme → `scheme-1`

[Action 7.10.c] 안의 text block (header):
- Text → `<h3>You may also like</h3>` (또는 `<h2>Pair it with</h2>`)
- Alignment → `left` 또는 `center`

[Checkpoint 7.10] ✅ PDP 하단에 추천 상품 4개 carousel/grid. Solo 페이지에서는 Duo / Trio / Memory Pack 자동 노출 (related algorithm).

> Photo Sheets collection 에 4 상품만 있으면 algorithm 이 다른 SKU 3개 + 자기 자신 외 1개 = 3개만 노출 가능. 그 경우 max products 를 3 으로 조정 또는 manual recommendations (admin 의 product 메타필드 또는 Search & Discovery 앱).

---

## Step 7.11 — Save + 4 SKU 미리보기 검증

[Action 7.11.a] `Save`

[Action 7.11.b] 좌측 페이지 selector → `Products` → 다음 4개 모두 미리보기:
- Solo
- Duo
- Trio
- Memory Pack

[Checkpoint 7.11] ✅ 4 SKU 모두 같은 layout. 차이는:
- Title (자동)
- Price (자동)
- Description (자동)
- Easify field (option set 별 — Solo 1장, Duo 2장, Trio 3장, Memory Pack 4-8장)
- Recommendations (자동)

---

## Step 7.12 — Test add to cart (실제 cart 동작 확인)

[Action 7.12.a] Theme Editor 우측 상단 `View` (or storefront 미리보기) 클릭 → 새 탭에서 storefront 진입

> ⚠️ 상품이 Draft 면 storefront 에서 안 보임. Draft → Active 로 임시 전환하거나, theme preview URL (Theme library → 테마 → `Preview` 사용 — Draft 도 보임).

[Action 7.12.b] Solo PDP 진입 → Easify field 노출 확인:
- Photo upload → 작은 jpg 1장 업로드
- Header name → `Test Pet`
- Order notes → `Test note`

[Action 7.12.c] Variant 선택 → `S × White Matte` (default 또는 변경)

[Action 7.12.d] Quantity = 1

[Action 7.12.e] `Add to cart` 클릭

[Checkpoint 7.12] ✅ Cart drawer (or `/cart`) 열림 → line item 에 Solo + variant + 가격 표시 + line item property 에 `Photo 1: test.jpg / Name 1: Test Pet / Special instructions: Test note` 모두 표시.

> 만약 표시 안 되면:
> - Easify display 가 line-item-property 로 setting 됐는지 확인 (Easify dashboard → settings)
> - Cart drawer (Drawer cart in 1G) 가 line item property 를 렌더링하는지 (Horizon default 는 yes)

[Action 7.12.f] (옵션) `Checkout` 진입 → test mode 결제 (1.4.3 참조) → admin Orders 에 line item property + 업로드 파일 URL 표시 확인

---

## Batch 7 종료 검증

다음 모두 ✅ 면 Batch 7 완료:

- [ ] **Step 7.2–7.4**: Product information layout, media gallery, header group (eyebrow + title + price)
- [ ] **Step 7.5**: Variant picker (Size + Material) 정상
- [ ] **Step 7.6**: ⭐ Easify app block 이 variant-picker 와 buy-buttons 사이에 배치
- [ ] **Step 7.7**: Buy buttons (quantity + add-to-cart + accelerated-checkout)
- [ ] **Step 7.8**: Accordion 5 row (What you get / Materials & sizes / Care / Lead time / Photo guidelines)
- [ ] **Step 7.9**: Product description 자동 (admin description 사용)
- [ ] **Step 7.10**: Product recommendations 4 grid
- [ ] **Step 7.11**: 4 SKU 모두 같은 layout, Easify field 만 SKU 별로 다름
- [ ] **Step 7.12**: Test add to cart → cart line item property 정상

---

## 다음 batch

→ **`08_pages.md`** (About / FAQ / Sizing Guide / Materials Guide 페이지 템플릿 — main-page section + accordion + 한국어 안내)

> Batch 8 끝나면 storefront 거의 완성. Batch 9 에서 최종 QA + test order.
