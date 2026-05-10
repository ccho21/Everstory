# Batch 3 — Admin 콘텐츠 데이터 (상품 4종 + Collection + Pages + Navigation)

이 문서로 Shopify admin 에 **상품 4종 (Solo / Duo / Trio / Memory Pack)**, **Collection 1개**, **Page 4개 (About / FAQ / Sizing Guide / Materials Guide)**, **Navigation 메뉴 4개 (Main + Footer 3그룹)** 을 등록한다. 끝나면 storefront 에 표시할 콘텐츠가 모두 admin 에 들어와 있는 상태.

- **소요 시간**: 약 90–120분. **4개 Step 별로 끊어서 진행 권장** (한 번에 다 안 해도 됨)
- **이전 batch**: `02_shopify_settings_ops.md` (Settings 1E–1J)
- **다음 batch**: `04_easify_options.md` (Easify Product Options 설치 + 옵션 세트)
- **본문 SOT**:
  - 상품 description / variant / SEO → [`../product_descriptions.md`](../product_descriptions.md)
  - Page 본문 → [`../pages_copy.md`](../pages_copy.md)
  - 한국어 footer → [`../footer_copy.md`](../footer_copy.md)

---

## 시작 전 점검

- [ ] Batch 1, 2 종료 체크리스트 모두 ✅
- [ ] [`../product_descriptions.md`](../product_descriptions.md), [`../pages_copy.md`](../pages_copy.md), [`../footer_copy.md`](../footer_copy.md) 탭으로 열어두기 (복사·붙여넣기 자주 사용)
- [ ] 결정 메모: **variant 28개 가격은 모두 base 가격으로 시작** (사이즈/재질별 차등은 launch 전에 별도 결정)

---

## ⚠️ Shopify Admin 메뉴 위치 변경 안내 (2024+)

다음 항목들이 admin redesign 으로 위치가 이동했음. 본인 admin 에서 둘 중 보이는 경로 사용:

| 항목 | 최신 경로 (2024+) | Legacy 경로 |
|------|------------------|-------------|
| Pages | **Content → Pages** | Online Store → Pages |
| Menus (Navigation) | **Content → Menus** | Online Store → Navigation |
| Files | **Content → Files** | Settings → Files |
| Collections | **Products → Collections** | (동일) |

> 본인 admin 에 어떤 경로가 보이는지 확인 후 진행. 둘 다 결과는 동일.

---

## Step 3.1 — 상품 4종 등록

### 3.1.1 Solo 상품 만들기

**경로**: 좌측 사이드바 `Products` → 우측 상단 `Add product`

#### A. 기본 정보

[Action 3.1.1.A.a] **Title** → `Custom Photo Sticker Sheet — Solo`

> ⚠️ 대시(`—`)는 em dash (`U+2014`). 일반 hyphen (`-`) 아님. 복사·붙여넣기 권장.

[Action 3.1.1.A.b] **Description** (Rich text editor):
- [`../product_descriptions.md`](../product_descriptions.md) 의 **SKU 1 — Solo 의 §Description 본문** 그대로 붙여넣기 ("One photo. One sheet. ..." ~ "...Choose Solo when one image carries the weight of the moment.")
- 본문 끝에서 한 줄 띄우고 → **§Common 섹션** 전체 (How to order / Materials / Sizes / Care & lifespan / Made in Toronto / Lead time & shipping / A note on photos) 붙여넣기
- 본문 끝에서 다시 한 줄 띄우고 → [`../footer_copy.md`](../footer_copy.md) **§7 Product description 한국어 footer** 붙여넣기

> Rich Text editor 에서 `**bold**` 는 자동으로 **bold** 로 변환되지 않을 수 있음 — Shopify 의 `B` 토글로 직접 처리. 표는 `Insert table`. 리스트는 `Bulleted list`.

#### B. Media

[Action 3.1.1.B.a] 상품 이미지가 준비되어 있으면 업로드. 없으면 일단 **skip** (Batch 5 Theme 작업 후 다시 진입)

#### C. Status

[Action 3.1.1.C.a] 우측 사이드바 **Status** → `Draft` 선택 (Active 아님)

> Active 로 두면 storefront 에 노출됨. 테마 작업이 끝나기 전까지는 Draft.

#### D. Pricing

[Action 3.1.1.D.a] 우측 또는 본문 하단 **Pricing** 섹션:
- Price → `15.99` (CAD 자동, 통화는 1A 에서 셋업됨)
- Compare at price → 비움
- Cost per item → 비움 (Stage 5 이후 입력)
- Charge tax on this product → ✅ on (1F Taxes 와 연동)

#### E. Inventory

[Action 3.1.1.E.a] **Inventory** 섹션:
- SKU → `EVS-SOLO` (옵션, 추적 편의)
- Track quantity → ❌ **off** (made-to-order)
- Continue selling when out of stock → ✅ on

> Track quantity off → 재고 관리 안 함. made-to-order 상품에 적합.

#### F. Shipping

[Action 3.1.1.F.a] **Shipping** 섹션:
- This is a physical product → ✅ on
- Weight → `50` g (A5 시트 1매 추정. 정확한 무게는 launch 전 측정 후 수정)
- Country/region of origin → `Canada`
- HS (Harmonized System) code → 비움 (Ontario only 이라 불필요)

#### G. Variants ⭐

이 상품의 핵심. 28개 variant 자동 생성.

[Action 3.1.1.G.a] **Variants** 섹션 → `+ Add options like size or color` 클릭

[Action 3.1.1.G.b] **Option 1**:
- Option name → `Size`
- Option values → 다음 7개 한 줄씩 입력 (또는 콤마 구분):
  ```
  XS
  S
  M
  L
  XL
  XXL
  Mixed
  ```
- `Done`

[Action 3.1.1.G.c] `+ Add another option` 클릭 → **Option 2**:
- Option name → `Material`
- Option values → 다음 4개:
  ```
  White Matte
  Pearl Grey
  Silver
  Gold
  ```
- `Done`

[Action 3.1.1.G.d] **Variants 자동 생성 확인** — 7 × 4 = **28개 variant** 가 표로 표시됨. 각 variant 에 price = $15.99 자동 채워짐 (D 에서 입력한 값).

[Action 3.1.1.G.e] (옵션) variant 가격 차등이 필요하면 표에서 직접 수정. **MVP 는 모두 $15.99 로 통일**, launch 전 차등 검토.

[Action 3.1.1.G.f] **Default variant 지정** — Variants 표에서 `S × White Matte` 행이 default 로 노출되도록 위로 드래그 (또는 product_descriptions.md 기준 `S × White Matte` 가 첫 줄)

> Default variant 는 Variants 표 **첫 번째 행**. PDP 에서 처음 표시될 조합.

[Checkpoint 3.1.1.G] ✅ Variants 표에 28개 행. 각 행에 Size × Material 조합과 가격 $15.99 표시.

#### H. SEO

[Action 3.1.1.H.a] 본문 맨 아래 **Search engine listing** 섹션 → `Edit` 클릭

[Action 3.1.1.H.b]:
- Page title → `Solo — Custom Photo Sticker Sheet | Everstory Studio`
- Meta description → `Hand-cut photo sticker sheets, made to order in Toronto. Korean premium substrates, fast turnaround (1 business day), free Ontario shipping.`
- URL handle → `solo` (default 는 `custom-photo-sticker-sheet-solo` 같이 길게 자동 생성됨, 짧은 게 wireframe 기준 `/products/solo`)

> URL handle 은 한 번 publish 후 변경 시 redirect 가 자동 생성되지만, **Draft 단계에서 미리 짧게 정리** 권장.

#### I. Organization

[Action 3.1.1.I.a] 우측 사이드바 **Product organization** 섹션:
- Product type → `Sticker Sheet`
- Vendor → `Everstory Studio`
- Tags → `solo`, `name-included`, `a5`, `made-to-order` (콤마로 추가)
- Collections → 비워둠 (3.2 에서 Collection 만든 후 추가)

#### J. 저장

[Action 3.1.1.J.a] 우측 상단 `Save` 클릭

[Checkpoint 3.1.1] ✅ Solo 상품 페이지 진입 → Title, Description, 28 variants, Tags, Vendor, Product type, SEO 모두 반영. Status = Draft.

---

### 3.1.2 Duo 상품 만들기

3.1.1 과 동일한 절차. 차이만 표시:

| 필드 | Duo 값 |
|------|--------|
| Title | `Custom Photo Sticker Sheet — Duo` |
| Description | [`../product_descriptions.md`](../product_descriptions.md) **SKU 2 — Duo §Description** + §Common + 한국어 footer |
| Price | `18.99` |
| SKU | `EVS-DUO` |
| URL handle | `duo` |
| SEO title | `Duo — Custom Photo Sticker Sheet | Everstory Studio` |
| Tags | `duo`, `name-included`, `a5`, `made-to-order` |
| Variants | 동일 (Size 7 × Material 4 = 28) |

[Checkpoint 3.1.2] ✅ Duo 상품 등록.

---

### 3.1.3 Trio 상품 만들기

| 필드 | Trio 값 |
|------|---------|
| Title | `Custom Photo Sticker Sheet — Trio` |
| Description | **SKU 3 — Trio §Description** + §Common + 한국어 footer |
| Price | `21.99` |
| SKU | `EVS-TRIO` |
| URL handle | `trio` |
| SEO title | `Trio — Custom Photo Sticker Sheet | Everstory Studio` |
| Tags | `trio`, `name-included`, `a5`, `made-to-order` |
| Variants | 동일 (28) |

[Checkpoint 3.1.3] ✅ Trio 상품 등록.

---

### 3.1.4 Memory Pack 상품 만들기

| 필드 | Memory Pack 값 |
|------|----------------|
| Title | `Custom Photo Sticker Sheet — Memory Pack` |
| Description | **SKU 4 — Memory Pack §Description** + §Common + 한국어 footer |
| Price | `28.99` |
| SKU | `EVS-MEMORY` |
| URL handle | `memory-pack` |
| SEO title | `Memory Pack — Custom Photo Sticker Sheet | Everstory Studio` |
| Tags | `memory-pack`, `name-included`, `a5`, `made-to-order`, `two-sheet` |
| Variants | 동일 (28) |
| Weight | `100` g (2 sheets) |

[Checkpoint 3.1.4] ✅ Memory Pack 상품 등록.

---

### Step 3.1 종료 검증

[Checkpoint 3.1] ✅ Products 메뉴 진입 시 4개 상품 모두 Draft 상태로 표시:
- Custom Photo Sticker Sheet — Solo ($15.99)
- Custom Photo Sticker Sheet — Duo ($18.99)
- Custom Photo Sticker Sheet — Trio ($21.99)
- Custom Photo Sticker Sheet — Memory Pack ($28.99)

---

## Step 3.2 — Collection 생성

**경로**: `Products → Collections` → 우측 상단 `Create collection`

[Action 3.2.a] **Title** → `Photo Sheets`

[Action 3.2.b] **Description** (옵션):
```
A5 hand-cut photo sticker sheets — Solo, Duo, Trio, Memory Pack. Korean premium substrates, made in Toronto.
```

[Action 3.2.c] **Collection type** → `Manual` 선택

> Manual = 수동으로 상품 추가. Smart = 조건 기반 자동 추가. 4개 상품만 다루므로 Manual 이 단순.

[Action 3.2.d] **Products** 섹션 → `Browse` 또는 검색 → 4개 상품 모두 선택 → `Add`

[Action 3.2.e] **Sort order** → `Manually` 선택 → 표에서 순서 드래그:
1. Solo
2. Duo
3. Trio
4. Memory Pack

[Action 3.2.f] **Search engine listing** → `Edit`:
- Page title → `Photo Sheets | Everstory Studio`
- Meta description → `Hand-cut photo sticker sheets in Toronto. Solo, Duo, Trio, Memory Pack — pick the count that fits your story.`
- URL handle → `photo-sheets`

[Action 3.2.g] **Image** (옵션) → Collection 대표 이미지 업로드. 없으면 skip.

[Action 3.2.h] **Sales channels** → `Online Store` 만 ✅

[Action 3.2.i] `Save`

[Checkpoint 3.2] ✅ Collections 메뉴에 `Photo Sheets` 표시. 클릭 시 4개 상품 manual order 로 표시.

---

## Step 3.3 — Pages 생성

**경로**: `Content → Pages` (또는 legacy: `Online Store → Pages`) → 우측 상단 `Add page`

> 4개 페이지 모두 동일한 절차. SOT = [`../pages_copy.md`](../pages_copy.md).

### 3.3.1 About 페이지

[Action 3.3.1.a] `Add page` 클릭

[Action 3.3.1.b] **Title** → `About Everstory Studio`

[Action 3.3.1.c] **Content** (Rich text):
- [`../pages_copy.md`](../pages_copy.md) **§1 About 본문** 그대로 붙여넣기
- 본문 끝 (`— Everstory Studio` 직후) 에 → horizontal rule (`—`) 삽입 → Heading 3 → `한국어로 한 마디` → 그 아래 [`../footer_copy.md`](../footer_copy.md) **§5 About 한국어 footer** 본문 붙여넣기

[Action 3.3.1.d] **Search engine listing** → `Edit`:
- Page title → `About Everstory Studio | Hand-Cut Photo Sticker Sheets, Toronto`
- Meta description → `We make hand-cut photo sticker sheets in Toronto, on Korean premium substrates. Fast turnaround — printed within one business day.`
- URL handle → `about`

[Action 3.3.1.e] **Visibility** → `Visible` (또는 `Hidden`, 테마 작업 전 노출 차단하려면 Hidden)

[Action 3.3.1.f] `Save`

[Checkpoint 3.3.1] ✅ Pages 목록에 `About Everstory Studio` 표시. URL 미리보기 = `xxx.myshopify.com/pages/about`.

---

### 3.3.2 FAQ 페이지

3.3.1 과 동일 절차:

| 필드 | FAQ 값 |
|------|--------|
| Title | `Frequently Asked Questions` |
| Content | [`../pages_copy.md`](../pages_copy.md) **§2 FAQ 본문** + horizontal rule + Heading 3 `한국어 자주 묻는 질문` + [`../footer_copy.md`](../footer_copy.md) **§6 FAQ 한국어 footer** |
| SEO title | `FAQ | Everstory Studio` |
| Meta description | `How ordering, shipping, photos, and returns work at Everstory Studio. Hand-cut photo sticker sheets, made in Toronto.` |
| URL handle | `faq` |
| Visibility | Visible |

[Checkpoint 3.3.2] ✅ FAQ 페이지 등록.

---

### 3.3.3 Sizing Guide 페이지

| 필드 | Sizing Guide 값 |
|------|-----------------|
| Title | `Sticker Size Guide` |
| Content | [`../pages_copy.md`](../pages_copy.md) **§3 Sizing Guide 본문** (한국어 footer 별도 SOT 없음, 영어만) |
| SEO title | `Size Guide | Everstory Studio Photo Stickers` |
| Meta description | `XS through XXL, plus Mixed. How big each photo sticker is and what use cases each size fits best.` |
| URL handle | `sizing-guide` |
| Visibility | Visible |

[Checkpoint 3.3.3] ✅ Sizing Guide 페이지 등록.

---

### 3.3.4 Materials Guide 페이지

| 필드 | Materials Guide 값 |
|------|--------------------|
| Title | `Material Guide` |
| Content | [`../pages_copy.md`](../pages_copy.md) **§4 Materials Guide 본문** |
| SEO title | `Material Guide | Everstory Studio Photo Stickers` |
| Meta description | `White matte, pearl grey, silver, and gold. Which Korean premium substrate fits your photograph and your surface.` |
| URL handle | `materials-guide` |
| Visibility | Visible |

[Checkpoint 3.3.4] ✅ Materials Guide 페이지 등록.

---

### Step 3.3 종료 검증

[Checkpoint 3.3] ✅ Pages 목록에 4개 페이지:
- About Everstory Studio (`/pages/about`)
- Frequently Asked Questions (`/pages/faq`)
- Sticker Size Guide (`/pages/sizing-guide`)
- Material Guide (`/pages/materials-guide`)

> Shipping & Pickup, Refund Policy 는 1I Policies 에서 등록됨 (`/policies/shipping-policy`, `/policies/refund-policy`). 일반 Page 로 또 만들지 않음.

---

## Step 3.4 — Navigation (메뉴)

**경로**: `Content → Menus` (또는 legacy: `Online Store → Navigation`)

> Shopify 신규 스토어는 default 로 `Main menu` 와 `Footer menu` 2개가 있음. 이 단계에서 그걸 재구성하고 Footer 용으로 추가 menu 2개 생성.

### 3.4.1 Main menu 재구성

[Action 3.4.1.a] Menus 페이지 → `Main menu` 클릭

[Action 3.4.1.b] 기존 항목 (Home, Catalog 같은 default) 삭제 → 우측 `…` 또는 `Remove`

[Action 3.4.1.c] `Add menu item` 으로 다음 3개 추가:

| 순서 | Name | Link |
|------|------|------|
| 1 | `Shop` | Collections → `Photo Sheets` |
| 2 | `About` | Pages → `About Everstory Studio` |
| 3 | `FAQ` | Pages → `Frequently Asked Questions` |

> Link 입력 시 검색창에 콘텐츠 종류 (Collections / Pages 등) 선택 후 자동 검색됨. URL 직접 입력도 가능 (예: `/collections/photo-sheets`).

[Action 3.4.1.d] `Save menu`

[Checkpoint 3.4.1] ✅ Main menu = Shop / About / FAQ 3개 항목. 순서대로.

---

### 3.4.2 Footer menu 재구성 — Shop links

[Action 3.4.2.a] Menus 페이지로 돌아가 → 기존 `Footer menu` 가 있으면 그것을 재구성. 없으면 `Add menu` 클릭.

[Action 3.4.2.b] **Title** → `Footer · Shop` (또는 `Footer Shop Links`)

[Action 3.4.2.c] `Add menu item` 으로 4개 상품:

| 순서 | Name | Link |
|------|------|------|
| 1 | `Solo` | Products → Solo |
| 2 | `Duo` | Products → Duo |
| 3 | `Trio` | Products → Trio |
| 4 | `Memory Pack` | Products → Memory Pack |

[Action 3.4.2.d] `Save menu`

[Checkpoint 3.4.2] ✅ Footer · Shop menu 4개 항목.

---

### 3.4.3 Footer menu — Help links

[Action 3.4.3.a] `Add menu` → **Title**: `Footer · Help`

[Action 3.4.3.b] 4개 항목:

| 순서 | Name | Link |
|------|------|------|
| 1 | `Shipping & Pickup` | URL → `/policies/shipping-policy` |
| 2 | `Refund Policy` | URL → `/policies/refund-policy` |
| 3 | `FAQ` | Pages → FAQ |
| 4 | `Contact` | URL → `mailto:orders@everstory-domain.com` (도메인 미연결이면 임시 이메일) |

> Policies (Refund / Shipping) 의 URL 은 1I 에서 등록 후 자동 생성됨. 정확한 URL 은 `Settings → Policies` 페이지에서 각 정책 옆 링크 아이콘 hover 로 확인.

[Action 3.4.3.c] `Save menu`

[Checkpoint 3.4.3] ✅ Footer · Help menu 4개 항목.

---

### 3.4.4 Footer menu — Brand links

[Action 3.4.4.a] `Add menu` → **Title**: `Footer · Brand`

[Action 3.4.4.b] 4개 항목:

| 순서 | Name | Link |
|------|------|------|
| 1 | `About` | Pages → About |
| 2 | `Privacy` | URL → `/policies/privacy-policy` |
| 3 | `Terms` | URL → `/policies/terms-of-service` |
| 4 | `Sizing guide` | Pages → Sticker Size Guide |

[Action 3.4.4.c] `Save menu`

[Checkpoint 3.4.4] ✅ Footer · Brand menu 4개 항목.

---

### Step 3.4 종료 검증

[Checkpoint 3.4] ✅ Menus 목록에 4개 메뉴:
- Main menu (Shop / About / FAQ)
- Footer · Shop (Solo / Duo / Trio / Memory Pack)
- Footer · Help (Shipping & Pickup / Refund / FAQ / Contact)
- Footer · Brand (About / Privacy / Terms / Sizing guide)

> 이 메뉴들은 Batch 5 (Theme + Global) 에서 header / footer section 에 연결됨.

---

## Batch 3 종료 검증

다음 모두 ✅ 면 Batch 3 완료:

- [ ] **Step 3.1**: 상품 4종 (Solo / Duo / Trio / Memory Pack) Draft 등록, 각 28 variants
- [ ] **Step 3.2**: `Photo Sheets` Collection (manual, 4 products) 생성
- [ ] **Step 3.3**: Pages 4개 (About / FAQ / Sizing Guide / Materials Guide) 등록, SEO + 한국어 footer 포함
- [ ] **Step 3.4**: Menus 4개 (Main + Footer 3그룹) 셋업

---

## 다음 batch

→ **`04_easify_options.md`** (Easify Product Options 앱 설치 + 사진 업로드 옵션 세트)

> 그 다음 Batch 5 (Theme upload + Global) 에서 위 Menus 가 실제 header / footer 에 연결되고, 상품 / 페이지가 storefront 에 노출되기 시작.
