# Copy Rework — 용도 팩 라인업 (2026-09)

새 라인업(Planner / Phone & Bottle / Laptop / Full Set + Custom Sheet)에 맞춰 웹 카피를 다시 쓰기 위한 계획서다. 구조·단계는 [`../business/lineup_restructure.md`](../business/lineup_restructure.md), 확정 문구는 승인 후 [`product_descriptions.md`](product_descriptions.md) 로 옮긴다.

## 무엇이 왜 틀렸나

상품 축이 바뀌었는데 카피는 옛 축으로 쓰여 있다.

| | 옛 축 | 새 축 |
|---|---|---|
| 상품이 뜻하는 것 | 크롭 방식(Face/Full Body) 또는 큐레이션 정도(Mini/Full) | **어디에 붙이는지** |
| 고객이 고르는 것 | 사이즈, 사진 수, 크롭 | **사진 몇 장**, 소재 |
| 스튜디오가 정하는 것 | 레이아웃 | **사이즈·크롭·레이아웃** |

그래서 "사이즈를 고르세요", "print tier 로 업로드하세요", "Studio picks N" 이 들어간 문장은 전부 틀렸다.

**Draft 쌍둥이 PDP 실측(2026-09-04)에서 나온 잔여 오류:**

- `Sizes` 아코디언이 아직 "Package Mini is one A5 sheet… you upload candidates by print tier (Big, Medium, Small)" 를 그대로 말한다. (복사 테마에는 팩 분기를 넣어뒀으나 라이브 테마에는 없다 — 컷오버 때 해소)
- 공용 스니펫의 `How we crop` 이 kids/Adults/Pets 규칙을 반복한다. 복사 테마에서는 "What you'll get" 카드로 교체됨.
- `card_subtitle` 이 스펙 나열이다 (`Every size · 1, 4 or 8 photos`).
- `Lead time & shipping` 은 정상이다 (접혀 있어 복사에서 빠졌던 것).

## 직관성을 만드는 장치 네 개

카피를 예쁘게 고치는 것보다 이 네 가지가 효과가 크다. 우선순위 순.

### 1. 스티커가 **몇 장** 나오는지 말한다 (지금 아예 없음)

고객이 사는 건 "사진 4장"이 아니라 "스티커 한 장 가득"이다. 지금은 그 숫자가 어디에도 없다. 단일 사이즈 기준 수량은 이미 있다 (0.75″ ≈50 · 1″ ≈36 · 1.25″ ≈20 · 1.5″ ≈16 · 2″ ≈6 · 2.5″ ≈4).

- **필요한 것**: 팩마다 실제 테스트 시트를 뽑아 총 개수를 센다. 두 사이즈가 섞이므로 계산으로 단정하지 않는다.
- 확정 전까지는 "a full A5 sheet" 처럼 개수를 말하지 않는다. **추정치를 카피에 쓰지 않는다.**

### 2. 크기를 눈에 보이게 한다

이미 `face_size_comparison.png`(여섯 사이즈 + 아이폰)가 있다. 팩은 두 사이즈만 쓰므로 **팩별로 두 사이즈만 남긴 비교 컷**을 만들면 그대로 쓸 수 있다. 새 촬영 없이 크롭으로 해결된다.

- 사물 비유(동전·병뚜껑 등)는 실측 확인 전에는 쓰지 않는다.

### 3. 첫 사진이 **놓인 자리**를 보여준다

지금 Full Set 첫 이미지는 A5 시트다. 시트는 제품이지 결과가 아니다. 팩마다 첫 이미지를 사용 장면으로 바꾼다.

| 팩 | 첫 이미지 | 보유 여부 |
|---|---|---|
| Planner | 다이어리 펼친 면에 붙은 작은 스티커 | **없음 — 촬영 필요** |
| Phone & Bottle | 폰 뒷면 (`package_mini_01.png`) | 있음 |
| Laptop | 노트북 상판 (`package_full_01.png`) | 있음 |
| Full Set | 네 자리가 한 컷에 (다이어리+폰+병+노트북) | **없음 — 촬영 필요** |

### 4. 고객이 하는 일을 세 줄로 못 박는다

"고르고, 올리고, 받는다." 지금은 이 흐름이 페이지 곳곳에 흩어져 있다. 구매 박스 바로 아래 한 블록으로 모은다.

## 표면별 수정 목록

| 표면 | 저장 위치 | 지금 | 바꿀 방향 |
|---|---|---|---|
| 컬렉션 카드 부제 | `custom.card_subtitle` | 스펙 나열 | 용도 + 실제 인치 |
| PDP eyebrow | product.json 고정 | `CUSTOM PHOTO STICKER SHEET` | 유지 |
| 구매 박스 안내 | `es-pack-note.liquid` | 사이즈·사진 수 | 유지 + "몇 장 나오는지" 추가(§1 확정 후) |
| What you get | `custom.product_intro` | 스펙 6줄 | 결과 먼저, 스펙은 뒤 |
| 스토리 블록 | `custom.product_story_html` | 헤드라인 + 3문장 | 유지, 문장만 조임 |
| Sizes 아코디언 | product.json 팩 분기 | 팩 분기 작성됨 | 크기 비교 이미지 링크 추가 |
| What you'll get 카드 | `es-what-you-get.liquid` | 신규 | 유지 |
| Materials / Care / Lead time / Safety | product.json 고정 | 전 상품 공용, 정확함 | **손대지 않는다** |
| Before you order · Photo quality · Color | `es-pdp-general.liquid` | 전 상품 공용 | 문장 2개만 교정 |

## 카드 부제 (4종 + Custom)

용도를 먼저, 인치를 뒤에. 스캔했을 때 "내 자리"가 먼저 보이게 한다.

| 상품 | 지금 | 제안 |
|---|---|---|
| Planner Sheet | — | `Planner-size stickers · 0.75" and 1"` |
| Phone & Bottle Sheet | — | `Case-size stickers · 1" and 1.25"` |
| Laptop Sheet | — | `Laptop-size stickers · 1.5" and 2"` |
| Full Set | `Every size · 1, 4 or 8 photos` | `One of every size · 0.75" to 2.5"` |
| Custom Sheet | `A5 face cutout sticker sheet` | `You choose the size · 0.75" to 2.5"` |

사진 수는 부제에서 뺀다. variant 버튼에 이미 있고, 부제는 "무엇인지"만 말해야 한다.

## 샘플 — Planner Sheet 전체 카피

나머지 세 팩은 이 패턴을 사이즈·자리만 바꿔 복제한다.

**Story block** (`product_story_html`)

> **Planner sheet**
> ### Small enough for a day box.
> Two sizes, 0.75″ and 1″. They sit inside a day box or a margin without covering what you wrote. Send your photos in one go; we trace each one and lay out the sheet.

**What you get** (`product_intro`)

> - A full A5 sheet of your photos, cut and ready to peel
> - Two sizes on the sheet: 0.75″ and 1″
> - 1 or 4 photos fill one sheet; 8 photos fill two
> - You upload; we choose the crop, the size of each photo and the layout
> - Fewer photos than you picked is fine. We repeat your favourites to fill the sheet
> - Your name and the order date printed on the sheet header
> - Hand-refined and precision-cut in Toronto
>
> **Best for**
> Day boxes, journal margins, calendars, and labelling small things without covering them.

첫 줄이 스펙이 아니라 **결과**다. §1 이 확정되면 첫 줄을 "About N stickers on one A5 sheet" 로 바꾼다.

**Sizes 아코디언 (팩 분기)**

> Sizes are set by where the sheet goes: 0.75″ and 1″, measured by the longest edge. 1 or 4 photos fill one A5 sheet (148 × 210 mm); 8 photos fill two. We size each photo on the sheet. [See these two sizes next to a phone](#es-sizes)

## 공용 문장 교정 두 개

`es-pdp-general.liquid` 의 "Before you order" 에서:

- "The photos and notes you add above are what we work from." → 유지
- "The number of stickers can change with the photo's ratio." → **"The number of stickers changes with each photo's shape — a tall photo fits fewer per row."** (왜 달라지는지를 말한다)

## 하지 않을 것

- Materials / Care & lifespan / Lead time & shipping / Safety 는 상품 축과 무관하게 정확하다. 건드리지 않는다.
- 개수·크기 비유를 실측 없이 쓰지 않는다.
- 한국어 병기는 하지 않는다 (영어 단일 정책, footer 블록만 예외).

## 순서

1. ✅ **완료 (2026-09-04)** 카드 부제 4종 metafield 반영 (Draft 4종. Custom Sheet 는 아직 상품이 없어 컷오버 때).
2. ✅ **완료 (2026-09-04)** 팩 4종 `product_intro` 재작성 반영. 첫 줄이 스펙이 아니라 결과("A full A5 sheet of your photos, cut and ready to peel"). Full Set story 의 "Send up to eight photos" → "Send your photos" 로 교정 (1·4 variant 와 모순이었다).
3. ⬜ 사이즈 비교 이미지 4종 크롭 → Files 업로드 → Sizes 아코디언에서 링크
4. ⬜ 테스트 시트 4장 출력해 스티커 개수 실측 → 카피 첫 줄에 숫자 반영
5. ⬜ Planner / Full Set 사용 장면 촬영
6. ✅ **완료 (2026-09-04)** 공용 스니펫 교정 — "The number of stickers can change with the photo's ratio." → "The number of stickers changes with each photo's shape. A tall photo fits fewer per row." 복사 테마 푸시 완료.

3·4·5 는 각각 이미지 작업, 출력, 촬영이 선행된다. **4 가 끝나야 product_intro 첫 줄에 실제 개수를 넣을 수 있다** — 그전까지 숫자는 쓰지 않는다.

### 보류

**0.5″(12.7mm) 추가** — 사용자 제안, 2026-09-04 보류 결정. 다이컷 사진에는 비권장(컷 오차 0.2–2mm 가 한 변의 16%, 흰 테두리가 0.30mm 로 얇아짐, 0.75″ 도 이미 "fine details may be hard to read"). 원형 크롭 전용이면 가능. 실제 크기 비교 PDF 를 만들어 전달했고, 인쇄 후 육안 판단으로 재검토한다.
