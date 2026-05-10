# Batch 4 — Easify Product Options 설치 + 옵션 세트

이 문서로 **Easify Product Options** 앱을 설치하고, 4 SKU 가 사용할 사진 업로드 / 이름 / 노트 필드를 셋업한다. Horizon 의 기본 product custom property 는 file upload 를 지원하지 않으므로 Easify 가 담당.

- **소요 시간**: 약 30–60분
- **이전 batch**: `03_admin_data.md` (상품 4종 / Collection / Pages / Navigation)
- **다음 batch**: `05_theme_global.md` (Theme upload + Header/Footer)
- **Reference**: [Easify Product Options - Shopify App Store](https://apps.shopify.com/easify-product-options)

---

## 시작 전 점검

- [ ] Batch 3 종료 — 상품 4종이 admin Products 에 Draft 로 등록됨
- [ ] Memory Pack 업로드 방식 결정 필요 (Step 4.1 에서 선택)

---

## Step 4.1 ⭐ Memory Pack 업로드 방식 결정 (선택)

Memory Pack 은 4–8장 사진을 받음. Easify Free plan 의 제약을 고려해 다음 3 옵션 중 하나 선택:

### 옵션 A — Free plan + 단일 file field 8개 (추천 MVP)

- Photo 1 ~ Photo 4 → **required**
- Photo 5 ~ Photo 8 → **optional**
- 장점: 무료, 가장 단순
- 단점: 업로드 박스 8개 → 모바일 PDP 가 길어짐 (Batch 7 에서 layout 보강)

### 옵션 B — Pro plan + multi-file field 1개

- Photo Upload (multi-file, 4–8 files) → **required**
- 장점: UX 깔끔, 업로드 박스 1개
- 단점: 월 사용료 발생 (Pro 가격은 앱 페이지에서 확인)

### 옵션 C — Cart 에서 4장만 받고 나머지는 이메일

- Photo 1–4 → required
- Special instructions 에 "추가 사진 5–8 은 주문 후 이메일 발송" 안내
- 장점: 무료, 박스 4개로 단순
- 단점: 추가 friction, 누락 위험

> **추천**: **옵션 A**. MVP 무료로 시작, launch 후 주문량 보면서 옵션 B 업그레이드 검토.

이 인스트럭션 나머지는 **옵션 A** 기준. B / C 선택 시 Step 4.4 의 Memory Pack 부분만 조정.

---

## Step 4.2 — Easify 앱 설치

**경로**: 좌측 사이드바 `Apps` → 우측 상단 `Shopify App Store` → 검색창에 `Easify Product Options`

[Action 4.2.a] 검색 결과에서 **Easify Product Options Variant** (또는 정확한 이름은 `Easify Product Options`) 클릭

> 비슷한 이름의 앱 (Globo Product Options, Bold Product Options 등) 도 있음. 정확한 개발사 = "Easify". 별점 / 리뷰 수가 가장 많은 항목 선택.

[Action 4.2.b] 앱 페이지에서 `Add app` (또는 `Install`) 클릭

[Action 4.2.c] 권한 허용 화면 → `Install app`

[Action 4.2.d] Plan 선택:
- 옵션 A 선택 시 → `Free` plan
- 옵션 B 선택 시 → `Pro` plan (또는 multi-file 지원하는 plan)

[Action 4.2.e] 설치 완료 후 admin 의 **Apps** 메뉴에 `Easify Product Options` 가 표시됨. 클릭 → 앱 dashboard 진입.

[Checkpoint 4.2] ✅ admin → Apps → Easify Product Options 진입 가능. 첫 화면에 onboarding tutorial 또는 "Create your first option set" 버튼 표시.

> Easify dashboard UI 는 앱 자체 화면 (Shopify admin 안에 embedded). Shopify 에 비해 UI 가 다를 수 있음. 인스트럭션은 Easify 의 일반적인 흐름으로 작성됨, 실제 라벨은 약간 다를 수 있음. 막히면 스크린샷.

---

## Step 4.3 — 공통 Field 설계

Easify 에서 만들 field 는 다음 4종 (4 SKU 모두 공통 패턴):

| Field | Type | Required | 설명 |
|-------|------|----------|------|
| Photo 1 | File upload | yes | 사진 1매. JPG/PNG/HEIC, ≤25 MB |
| Photo 2 | File upload | SKU 마다 다름 | Duo+ 만 사용 |
| Photo 3 | File upload | SKU 마다 다름 | Trio+ 만 사용 |
| Photo 4 | File upload | SKU 마다 다름 | Memory Pack 만 required |
| Photo 5–8 | File upload | optional | Memory Pack 만 사용 (옵션 A) |
| Customer/pet name 1 | Text input | yes | sheet header 표기 |
| Customer/pet name 2~4 | Text input | optional | Duo / Trio / Memory Pack |
| Special instructions | Long text | optional | crop 금지, tone, detail, 한국어 OK |

### Field 공통 settings

| 항목 | 값 |
|------|------|
| File types (Photo 필드) | `jpg, jpeg, png, heic` |
| Max file size | `25 MB` |
| Max files per field | `1` (단일 file field 기준) |
| Display label | "Upload photo 1 (required)", "Customer/pet name 1", 등 |
| Help text | (선택) "Bright lighting, subject filling the frame" |

---

## Step 4.4 — Option set 만들기

Easify 의 **Option Set** 1개 = field 모음. SKU 별로 slot 수가 다르므로 4개 option set 을 만든다.

> Easify 에서 조건부 표시 (variant 따라 field 노출/숨김) 가 가능하면 1개 option set 으로 묶을 수도 있음. 하지만 SKU 가 별도 product 라 조건부보다 **각 SKU 마다 별도 option set** 이 더 단순. 이 인스트럭션은 후자 기준.

### 4.4.1 Option set: Solo

[Action 4.4.1.a] Easify dashboard → `Create option set` (또는 `New option set` / `+ Add option set`)

[Action 4.4.1.b] **Name**: `Everstory Upload — Solo`

[Action 4.4.1.c] **Description / Internal note**: `Solo SKU 용. Photo 1 + Name 1 + Notes`

[Action 4.4.1.d] **Add option / Add field** 로 다음 3개 field 순서대로 추가:

**Field 1 — Photo 1**:
- Type → `File upload`
- Label → `Upload your photo (required)`
- Help text → `JPG / PNG / HEIC up to 25 MB. Bright lighting, subject filling the frame.`
- File types → `jpg, jpeg, png, heic`
- Max size → `25 MB`
- Required → ✅ on
- Property name (line item display) → `Photo 1`

**Field 2 — Name 1**:
- Type → `Text input` (single line)
- Label → `Header name (optional)`
- Help text → `Printed on the sheet header. Leave blank to omit.`
- Required → ❌ off
- Property name → `Name 1`

**Field 3 — Special instructions**:
- Type → `Long text` (textarea)
- Label → `Order notes (optional)`
- Help text → `Faces we should not crop. Tone you prefer. Detail to keep crisp. Korean OK.`
- Required → ❌ off
- Property name → `Special instructions`

[Action 4.4.1.e] **Apply to products** 또는 **Assign products** 섹션 → `Solo` 상품 선택 → 저장

[Action 4.4.1.f] `Save` / `Publish`

[Checkpoint 4.4.1] ✅ Easify dashboard 에 `Everstory Upload — Solo` option set 표시. Solo 상품과 연결됨.

---

### 4.4.2 Option set: Duo

[Action 4.4.2.a] `Create option set` → **Name**: `Everstory Upload — Duo`

[Action 4.4.2.b] Field 5개:

| Field | Type | Required | Property name |
|-------|------|----------|---------------|
| Photo 1 | File upload | ✅ | `Photo 1` |
| Photo 2 | File upload | ✅ | `Photo 2` |
| Name 1 | Text input | ❌ | `Name 1` |
| Name 2 | Text input | ❌ | `Name 2` |
| Special instructions | Long text | ❌ | `Special instructions` |

[Action 4.4.2.c] Photo 필드 label / help text 는 4.4.1 패턴 따라 (`Upload photo 1 of 2 (required)` 등)

[Action 4.4.2.d] Apply to → `Duo` 상품

[Action 4.4.2.e] Save

[Checkpoint 4.4.2] ✅ Duo option set 등록.

---

### 4.4.3 Option set: Trio

[Action 4.4.3.a] **Name**: `Everstory Upload — Trio`

[Action 4.4.3.b] Field 7개:

| Field | Type | Required | Property name |
|-------|------|----------|---------------|
| Photo 1 | File upload | ✅ | `Photo 1` |
| Photo 2 | File upload | ✅ | `Photo 2` |
| Photo 3 | File upload | ✅ | `Photo 3` |
| Name 1 | Text input | ❌ | `Name 1` |
| Name 2 | Text input | ❌ | `Name 2` |
| Name 3 | Text input | ❌ | `Name 3` |
| Special instructions | Long text | ❌ | `Special instructions` |

[Action 4.4.3.c] Apply to → `Trio` 상품 → Save

[Checkpoint 4.4.3] ✅ Trio option set 등록.

---

### 4.4.4 Option set: Memory Pack (옵션 A 기준)

[Action 4.4.4.a] **Name**: `Everstory Upload — Memory Pack`

[Action 4.4.4.b] Field — 옵션 A (Free plan + 단일 file 8개):

| Field | Type | Required | Property name |
|-------|------|----------|---------------|
| Photo 1 | File upload | ✅ | `Photo 1` |
| Photo 2 | File upload | ✅ | `Photo 2` |
| Photo 3 | File upload | ✅ | `Photo 3` |
| Photo 4 | File upload | ✅ | `Photo 4` |
| Photo 5 | File upload | ❌ | `Photo 5` |
| Photo 6 | File upload | ❌ | `Photo 6` |
| Photo 7 | File upload | ❌ | `Photo 7` |
| Photo 8 | File upload | ❌ | `Photo 8` |
| Header name | Text input | ❌ | `Name 1` (sheet header 단일) |
| Special instructions | Long text | ❌ | `Special instructions` |

> Memory Pack 의 Name field 는 **단일** (`Name 1` 으로 sheet header 만 표기). 사진별 이름이 필요하면 옵션 A2 — `Name 1`, `Name 2`, `Name 3`, `Name 4` 4개 추가. 단순화 위해 단일 추천.

[Action 4.4.4.c] Photo 5–8 의 label 에 "(optional, leave blank if not used)" 명시

[Action 4.4.4.d] Apply to → `Memory Pack` 상품 → Save

[Checkpoint 4.4.4] ✅ Memory Pack option set 등록 (옵션 A 기준 10 field).

---

## Step 4.5 — App block 위치 사전 확인

Easify 가 product page 에 어떻게 표시될지는 Batch 7 (Product 템플릿) 에서 정확히 셋업됨. 현재 단계에서는 다음만 확인:

[Action 4.5.a] Easify dashboard → `Settings` 또는 `Display settings` → **Position** / **Display location**:

옵션 1: **App block** (Shopify Theme Editor 에서 product template 에 수동 배치) — Online Store 2.0 테마 (Horizon) 권장
옵션 2: **Auto-inject** (form 위 / 아래로 자동 삽입) — 위치 제어 약함

[Action 4.5.b] **Online Store 2.0 / App block** 모드 선택. Batch 7 에서 product template 에 정확히 배치.

[Checkpoint 4.5] ✅ Easify display mode = App block (또는 동등 표현).

> Easify 가 자동 배치 (auto-inject) 만 지원하면 일단 그대로. Batch 7 에서 위치 조정.

---

## Step 4.6 — 검증 (Batch 7 이후 가능)

> 현재는 Easify 가 admin 에 셋업만 됨. 실제 storefront 노출과 cart line item property 검증은 **Batch 7 (Product 템플릿) 끝나고** 가능.

Batch 7 완료 후 다음을 검증:

- [ ] Solo PDP 에 Photo 1 / Name 1 / Special instructions field 노출
- [ ] 필수 사진 없이 `Add to cart` 시도 시 차단 + "Photo 1 is required" 에러 메시지
- [ ] 사진 업로드 후 add to cart → cart drawer 의 line item 에 `Photo 1: [filename.jpg]` 표시
- [ ] Test order checkout → admin → Orders → 해당 order detail 에 line item property + 업로드 파일 URL 표시
- [ ] Memory Pack 에서 Photo 5–8 비워둔 채 add to cart 정상 통과

---

## Batch 4 종료 검증

다음 모두 ✅ 면 Batch 4 완료:

- [ ] **Step 4.2**: Easify Product Options 앱 설치 (Free 또는 Pro plan)
- [ ] **Step 4.3**: Field 종류와 property naming 규칙 결정
- [ ] **Step 4.4**: Option set 4개 등록
  - [ ] Solo (3 field)
  - [ ] Duo (5 field)
  - [ ] Trio (7 field)
  - [ ] Memory Pack (10 field — 옵션 A 기준)
- [ ] **Step 4.5**: Display mode = App block (Online Store 2.0)

---

## 다음 batch

→ **`05_theme_global.md`** (Horizon 테마 업로드 + Header / Footer 셋업)
