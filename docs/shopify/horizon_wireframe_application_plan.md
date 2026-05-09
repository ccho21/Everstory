# Horizon Wireframe Application Plan

이 문서는 `docs/shopify/wireframes/` 에 만든 Everstory wireframe을 Shopify Horizon 테마에 적용하기 위한 실행 계획이다. 목표는 HTML wireframe을 그대로 복사하는 것이 아니라, wireframe에 적어둔 `data-block` 구조를 Horizon의 template, section, block, Shopify admin 설정으로 번역하는 것이다.

사진 업로드는 Easify Product Options로 처리한다. Horizon 테마는 상품 페이지 레이아웃, 카피, variant, buy button, accordion, 추천 상품, 앱 block 위치를 담당한다.

---

## 1. 기본 접근

### 핵심 원칙

1. Wireframe HTML은 설계도다.
   - storefront에 그대로 붙여넣지 않는다.
   - `data-block="hero"`, `data-block="product-information"` 같은 메모를 Horizon section/block 조합으로 옮긴다.

2. Horizon core는 최대한 보존한다.
   - 기존 Horizon 파일을 직접 수정하기보다 Theme Editor, JSON template, `everstory-` prefix 신규 파일을 우선한다.
   - 특히 `layout/`, core `assets/`, core `snippets/`, 기존 Horizon foundation section은 가능한 건드리지 않는다.

3. 상품 업로드는 Easify가 담당한다.
   - Horizon 기본 `product-custom-property` block은 text, textarea, checkbox 중심이다.
   - 파일 업로드는 Easify Product Options 앱으로 구현한다.
   - 테마에서는 Easify app block이 product form 근처에 자연스럽게 들어가도록 상품 template 구조만 정리한다.

4. Theme Editor에서 조립 가능한 것은 Theme Editor로 먼저 한다.
   - `templates/*.json`, `sections/header-group.json`, `sections/footer-group.json`은 Shopify가 자동 생성/갱신하는 파일이다.
   - 코드로 직접 편집할 수는 있지만, launch 전에는 Theme Editor 변경과 충돌할 수 있으므로 작은 단위로 확인한다.

---

## 2. 관련 파일

### Wireframe source

| Wireframe | 역할 |
|---|---|
| `wireframes/home.html` | Home page 구조 |
| `wireframes/collection.html` | Collection/listing 구조 |
| `wireframes/product-solo.html` | Solo PDP 구조 |
| `wireframes/product-duo.html` | Duo PDP 구조 |
| `wireframes/product-trio.html` | Trio PDP 구조 |
| `wireframes/product-memory-pack.html` | Memory Pack PDP 구조 |
| `wireframes/about.html` | About page 구조 |
| `wireframes/faq.html` | FAQ page 구조 |
| `wireframes/shipping.html` | Shipping & Pickup page 구조 |
| `wireframes/refund.html` | Refund Policy page 구조 |
| `wireframes/policies.html` | Privacy / Terms 구조 |
| `wireframes/_shared.css` | wireframe 표시용 CSS. storefront에 그대로 사용하지 않음 |

### Copy / setup source

| 문서 | 사용처 |
|---|---|
| `product_descriptions.md` | 상품 4종 설명, variant, Easify field 기준 |
| `pages_copy.md` | About, FAQ, Sizing/Materials 등 page copy |
| `policies.md` | Refund, Shipping, Privacy, Terms 본문 |
| `footer_copy.md` | Footer 문구 |
| `settings_checklist.md` | Shopify admin 설정 순서 |
| `../design/pages.md` | page title, H1, subtitle, CTA, SEO 기준 |

### Horizon target

| Horizon 파일/영역 | 역할 |
|---|---|
| `sections/header-group.json` | announcement bar, header composition |
| `sections/footer-group.json` | footer composition |
| `templates/index.json` | Home template |
| `templates/collection.json` | Collection template |
| `templates/product.json` | Product template 기본형 |
| `templates/page.json` | 기본 page template |
| `templates/page.about.json` | About 전용 template, 새로 만들 후보 |
| `templates/page.faq.json` | FAQ 전용 template, 새로 만들 후보 |
| `templates/page.shipping.json` | Shipping 전용 template, 새로 만들 후보 |
| `templates/page.refund.json` | Refund 전용 template, 새로 만들 후보 |
| `sections/everstory-*.liquid` | 기존 Horizon section으로 부족할 때만 새로 추가 |
| `assets/everstory.css` | 브랜드별 보정 CSS가 꼭 필요할 때만 추가 |

---

## 3. 전체 적용 순서

### Step 0. 작업 전 안전 확인

Horizon 테마 작업을 시작하기 전:

1. `Shopify Theme/horizon` 안에서 `git pull origin main`
2. `git status` 확인
3. Shopify Theme Editor에서 최근 저장된 변경이 있는지 확인
4. 변경 단위는 작게 나누기
5. unpublished theme에서만 작업
6. publish는 최종 QA 후 별도 승인받고 진행

### Step 1. Shopify admin 데이터 먼저 준비

테마는 Shopify 데이터에 기대어 렌더링되므로, 디자인 조립 전에 admin 데이터를 먼저 만든다.

1. Products 4개 생성
   - `Custom Photo Sticker Sheet — Solo`
   - `Custom Photo Sticker Sheet — Duo`
   - `Custom Photo Sticker Sheet — Trio`
   - `Custom Photo Sticker Sheet — Memory Pack`

2. Variant 설정
   - Option 1: `Size`
     - `XS`, `S`, `M`, `L`, `XL`, `XXL`, `Mixed`
   - Option 2: `Material`
     - `White Matte`, `Pearl Grey`, `Silver`, `Gold`

3. Collection 생성
   - `Photo Sheets`
   - 상품 4종을 포함
   - navigation의 `Shop`이 이 collection으로 연결되게 설정

4. Pages 생성
   - `About`
   - `FAQ`
   - `Shipping & Pickup`
   - `Refund Policy`
   - 필요 시 `Privacy Policy`, `Terms of Service`

5. Navigation 생성
   - Main menu: `Shop`, `About`, `FAQ`
   - Footer menu groups:
     - Shop: Solo, Duo, Trio, Memory Pack
     - Help: Shipping & Pickup, Refund Policy, FAQ, Contact
     - Brand: About, Privacy, Terms, Sizing guide

6. 이미지 assets 준비
   - home hero
   - product mockup/gallery
   - about hero/studio wide
   - material/sizing guide image

### Step 2. Easify Product Options 설정

사진 업로드는 Easify로 처리한다.

#### MVP 기준 field

| Product | Photo upload | Name field | Notes |
|---|---:|---:|---|
| Solo | 1 required file | 1 text input | 1 long text |
| Duo | 2 required files | 2 text inputs | 1 long text |
| Trio | 3 required files | 3 text inputs | 1 long text |
| Memory Pack | 4-8 files | 1 or 4 text inputs | 1 long text |

#### Field naming

권장 line item property 이름:

| Field | Property key 예시 |
|---|---|
| Photo 1 | `Photo 1` |
| Photo 2 | `Photo 2` |
| Photo 3 | `Photo 3` |
| Photo 4 | `Photo 4` |
| Customer/pet name 1 | `Name 1` |
| Customer/pet name 2 | `Name 2` |
| Customer/pet name 3 | `Name 3` |
| Customer/pet name 4 | `Name 4` |
| Special instructions | `Special instructions` |

#### Easify option set 전략

1. 앱에서 product별 조건/slot 수 제어가 가능하면 하나의 option set을 만들고 상품별로 slot 수를 조절한다.
2. 조건 제어가 제한적이면 상품별 option set 4개를 만든다.
   - `Everstory Upload — Solo`
   - `Everstory Upload — Duo`
   - `Everstory Upload — Trio`
   - `Everstory Upload — Memory Pack`

#### 상품 페이지 내 위치

Wireframe 기준 위치:

1. Product title
2. Price
3. Variant picker
4. Easify upload fields
5. Buy buttons
6. Accelerated checkout
7. Accordion
8. Product description

Theme Editor에서 product template에 Easify app block을 추가할 수 있으면 variant picker 아래, buy buttons 위에 배치한다. 앱이 자동 삽입 방식이면 app setting에서 product form 내부 또는 add-to-cart 버튼 위로 위치를 맞춘다.

#### QA 체크

1. 필수 사진 없이 add to cart가 막히는지
2. 업로드한 파일명이 cart line item에 보이는지
3. 이름/노트가 cart line item property로 저장되는지
4. checkout/test order에서 업로드 파일과 property가 order detail에 남는지
5. 모바일에서 upload field가 너무 길거나 buy button을 밀어내지 않는지

---

## 4. Wireframe to Horizon mapping

### Global: announcement / header

| Wireframe block | Horizon target | 적용 내용 |
|---|---|---|
| `header-announcements` | `sections/header-group.json` | `MADE TO KEEP · Free Ontario shipping · Toronto pickup available` |
| `header` | Header section + Shopify Navigation | Logo, `Shop`, `About`, `FAQ`, cart |
| Logo placeholder | Theme settings / header logo | `assets/online_logo.png` 또는 Shopify file upload logo |

작업 순서:

1. Shopify admin에 main menu 생성
2. Theme settings에서 logo 등록
3. announcement text 변경
4. desktop/mobile header 확인

### Global: footer

| Wireframe block | Horizon target | 적용 내용 |
|---|---|---|
| `footer` | `sections/footer-group.json` | tagline, Shop/Help/Brand links, newsletter |
| Footer policy links | Shopify policies / footer menu | Shipping, Refund, Privacy, Terms |
| Newsletter | Horizon `email-signup` block | 기본 email signup 사용 |

작업 순서:

1. Footer menu group 준비
2. Footer section에 group/menu/email signup 조립
3. `MADE TO KEEP | MOMENTS THAT MATTER` tagline 반영
4. copyright와 policy links 확인

---

## 5. Home page 적용

Source: `wireframes/home.html`  
Target: `templates/index.json`

| Wireframe block | Horizon section/block | 적용 |
|---|---|---|
| `hero` | `hero` | H1 `Photographs, kept by hand.`, subtitle, CTA |
| `media-with-content (3 columns)` | `section` + group/card blocks 또는 custom section | How it works 3 steps |
| `product-list` | `product-list` | Photo Sheets collection, 4 product cards |
| `media-with-content` | `media-with-content` | Why / made to keep brand block |
| `featured-blog-posts` | `featured-blog-posts` | optional. 블로그 없으면 launch 이후 |

Recommended first version:

1. Hero
   - H1: `Photographs, kept by hand.`
   - Primary CTA: `Shop the lookbook` -> `/collections/photo-sheets` 또는 `/collections/all`
   - Secondary CTA: `How it works` -> `#how`

2. How it works
   - `01 — Send a photo`
   - `02 — We hand-cut`
   - `03 — Made to keep`

3. Product list
   - collection: `Photo Sheets`
   - max products: 4
   - columns: 4 desktop, 2 mobile

4. Brand block
   - `Made to keep, not to scroll past.`
   - Toronto / hand-cut / materials 중심 카피

5. Blog
   - MVP에서는 비활성 또는 숨김 가능

---

## 6. Collection page 적용

Source: `wireframes/collection.html`  
Target: `templates/collection.json`

| Wireframe block | Horizon section/block | 적용 |
|---|---|---|
| `section · collection-title + text` | `section` with text blocks | collection title/description |
| `main-collection` | `main-collection` | filters + product-card grid |
| `media-with-content` | `media-with-content` | sizing/materials guide |

Recommended settings:

1. Heading
   - H1: `Photo sheets by count.`
   - Subtitle: product count 선택 안내

2. Product grid
   - 4 products
   - filtering on if useful
   - sorting on
   - grid density optional

3. Sizing/materials guide
   - Collection 하단에 `Sizing & materials guide.` section 추가
   - MVP에서는 text + image로 시작
   - 추후 별도 sizing guide page로 분리 가능

---

## 7. Product pages 적용

Source:

- `wireframes/product-solo.html`
- `wireframes/product-duo.html`
- `wireframes/product-trio.html`
- `wireframes/product-memory-pack.html`

Target:

- 기본은 `templates/product.json`
- SKU별 레이아웃 차이가 커지면 product template을 분리
  - `templates/product.solo.json`
  - `templates/product.duo.json`
  - `templates/product.trio.json`
  - `templates/product.memory-pack.json`

### 공통 PDP 구조

| Wireframe block | Horizon target | 적용 |
|---|---|---|
| `section · breadcrumb` | optional `section` | MVP에서는 생략 가능 |
| `_product-media-gallery` | `product-information` static media-gallery | 상품 이미지/gallery |
| `product-title` | product details text block | `{{ closest.product.title }}` |
| `price` | price block | product price |
| `variant-picker` | variant-picker block | Size / Material |
| `product-custom-property · file` | Easify app block | 사진 업로드 |
| `product-custom-property · text` | Easify app block 또는 Horizon custom property | 이름 |
| `product-custom-property · textarea` | Easify app block 또는 Horizon custom property | 요청사항 |
| `buy-buttons` | buy-buttons block | add to cart / accelerated checkout |
| `accordion` | accordion block | How to order, Materials, Sizes, Care, Shipping |
| `product-description` | product description/text block | admin product description |
| `product-recommendations` | product-recommendations section | related products |

### Product template block order

권장 순서:

1. Product title group
2. Price
3. Divider
4. Variant picker
5. Easify app block
6. Buy buttons
7. Accordion
8. Product description

### SKU별 Easify field

| SKU | Upload | Names | Notes |
|---|---|---|---|
| Solo | Photo 1 required | Name 1 | Special instructions |
| Duo | Photo 1-2 required | Name 1-2 | Special instructions |
| Trio | Photo 1-3 required | Name 1-3 | Special instructions |
| Memory Pack | Photo 1-4 required, 5-8 optional | Name field strategy 결정 | Special instructions |

Memory Pack name field는 운영 편의를 기준으로 결정한다.

Option A:

- `Name for sheet header` 하나만 받음
- 가장 단순하고 MVP에 적합

Option B:

- `Name 1-4`를 각각 받음
- 커스터마이징은 좋지만 고객 입력 부담이 증가

MVP 추천은 Option A.

### Product accordion 내용

Accordion 후보:

1. What you get
2. How to order
3. Photo guidelines
4. Sizes
5. Materials
6. Care & lifespan
7. Lead time & shipping

처음에는 product description에 긴 설명을 넣고, accordion은 핵심 FAQ만 넣는 방식이 관리가 쉽다.

---

## 8. About page 적용

Source: `wireframes/about.html`  
Target: `templates/page.about.json` 신규 후보

| Wireframe block | Horizon section/block | 적용 |
|---|---|---|
| `hero (text-only)` | `section` or `hero` text-only | H1 `Made to keep, in Toronto.` |
| `image (banner · 21:9)` | `image` block or `media-with-content` | studio wide image |
| `media-with-content × 4` | `media-with-content` 반복 | craft/materials/notes/production |
| `group (jumbo-text + button)` | `section` + jumbo text/button | Shop CTA |
| `text (KR section)` | text section | Korean note |

Recommended structure:

1. Text hero
2. Wide image
3. Four story sections
   - By a person, not an algorithm.
   - The materials we trust.
   - The order notes are the conversation.
   - Printed, cut, packed by hand.
4. CTA
5. Korean section

---

## 9. FAQ / Shipping / Refund pages 적용

Targets:

- `templates/page.faq.json`
- `templates/page.shipping.json`
- `templates/page.refund.json`

### FAQ

| Wireframe block | Horizon target | 적용 |
|---|---|---|
| `hero (text-only)` | section/hero | H1 `Frequently Asked` |
| `main-page · accordion` | accordion blocks | grouped Q&A |
| `group (text + button · contact)` | group/button | contact CTA |
| `text (KR section)` | text block | Korean summary |

### Shipping & Pickup

| Wireframe block | Horizon target | 적용 |
|---|---|---|
| `hero (text-only)` | section/hero | H1 `Shipping & Pickup` |
| `main-page · accordion` | accordion blocks | Ontario shipping, Toronto pickup, timeline |
| `group (contact CTA)` | group/button | questions CTA |
| `text (KR section)` | text block | Korean summary |

### Refund Policy

| Wireframe block | Horizon target | 적용 |
|---|---|---|
| `hero (text-only)` | section/hero | H1 `Refund Policy` |
| `main-page · accordion` | accordion blocks | before print, after print, defect/damage |
| `group (contact CTA)` | group/button | defect/cancel CTA |
| `text (KR section)` | text block | Korean summary |

---

## 10. Privacy / Terms 적용

Source: `wireframes/policies.html`

두 가지 방식 중 하나를 선택한다.

### Option A. Shopify policy pages 사용

장점:

- footer policy links와 Shopify 기본 정책 시스템 연결이 자연스럽다.
- checkout/legal link와 일관성이 좋다.

단점:

- 디자인 자유도가 낮다.
- wireframe처럼 hero + KR section을 넣는 데 제약이 있을 수 있다.

### Option B. 일반 pages로 구성

장점:

- `/pages/privacy`, `/pages/terms`를 wireframe처럼 구성 가능
- hero, custom section, KR 안내 추가가 쉽다.

단점:

- Shopify policy setting과 footer policy links의 관계를 따로 관리해야 한다.

MVP 추천:

1. Shopify policy 본문은 admin policy에 입력한다.
2. storefront navigation에서는 필요하면 일반 page도 만든다.
3. launch 전에는 footer policy link가 실제 legal page로 정확히 연결되는지만 우선 확인한다.

---

## 11. Custom section이 필요한 경우

기존 Horizon section으로 충분하면 custom section을 만들지 않는다. 아래 조건에 해당할 때만 `everstory-` prefix로 새 파일을 만든다.

### 만들 후보

| 필요 | 신규 파일 후보 | 이유 |
|---|---|---|
| 3-step process가 Theme Editor에서 불편함 | `sections/everstory-process.liquid` | Home How it works 재사용 |
| KR notice가 여러 page에서 반복됨 | `sections/everstory-korean-note.liquid` | About/FAQ/Shipping/Refund 공통화 |
| Sizing/material guide가 복잡함 | `sections/everstory-sizing-materials.liquid` | Collection/PDP 공통화 |
| PDP upload 안내가 Easify 주변에 필요함 | `sections/everstory-upload-guidance.liquid` | 앱 block 앞뒤 설명 |

### 만들지 않는 것

MVP에서는 file upload를 custom Liquid로 만들지 않는다. Easify가 담당한다.

---

## 12. QA checklist

### Visual QA

1. Mobile header menu가 정상인지
2. Desktop header spacing이 깨지지 않는지
3. Home hero CTA가 보이는지
4. Product card image ratio가 안정적인지
5. PDP media gallery가 mobile에서 먼저 보이는지
6. Footer link group이 mobile에서 읽기 쉬운지

### Ecommerce QA

1. 각 SKU variant 선택 가능
2. Easify upload required validation 작동
3. Add to cart 정상 작동
4. Cart drawer에 uploaded file/name/notes 표시
5. Checkout test order에 line item property 표시
6. Tax/shipping/pickup 설정 정상

### Content QA

1. SEO title/meta description 입력
2. Product description 누락 없음
3. Policy links가 실제 page로 연결
4. Korean section 문구가 너무 길지 않음
5. Ontario shipping / Toronto pickup 조건이 일관됨

### Accessibility QA

1. Button label 명확
2. Image alt text 입력
3. Text contrast 4.5:1 이상
4. Accordion keyboard interaction 확인
5. Upload field required/error message 확인

---

## 13. 추천 작업 단위

### Batch 1. Global + Home + Collection

목표:

- header/footer 브랜드 구조 잡기
- Home page 완성
- Collection page 완성

포함:

- announcement text
- logo/nav/footer
- home hero
- how it works
- product list
- collection heading/grid
- sizing/material guide 초안

### Batch 2. Product template + Easify

목표:

- PDP 공통 구조 완성
- Easify upload flow 연결

포함:

- product template block order 정리
- Size/Material variant 확인
- Easify option set 4종 또는 조건부 option set
- add to cart / cart drawer / checkout test

### Batch 3. About + FAQ + Shipping + Refund

목표:

- 정보성 page 완성

포함:

- About story sections
- FAQ accordion
- Shipping accordion
- Refund accordion
- Korean section
- contact CTA

### Batch 4. Policies + final QA

목표:

- legal/policy 링크 정리
- launch 전 smoke test

포함:

- Privacy / Terms 결정
- footer policy links
- SEO
- mobile/desktop QA
- test order

---

## 14. MVP 결정 사항

현재 기준 결정:

1. 사진 업로드는 Easify Product Options로 진행한다.
2. Horizon custom file upload는 MVP에서 만들지 않는다.
3. Wireframe은 Horizon section/block mapping 청사진으로 사용한다.
4. 첫 구현 단위는 Global + Home + Collection이 가장 안전하다.
5. Product template은 Easify 연결 후 QA한다.

남은 결정:

1. Memory Pack name field를 1개로 받을지, 사진별로 받을지
2. Privacy/Terms를 Shopify policy로만 갈지, 일반 page도 만들지
3. Blog section을 launch에 포함할지, 숨길지
4. Home hero와 About banner에 사용할 최종 이미지

