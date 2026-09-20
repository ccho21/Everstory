# Cutover Runbook — 상품 2종

새 구조를 라이브로 옮기는 **실행표**다. 배경·근거는 [`lineup_restructure.md`](lineup_restructure.md) §2026-09-19 확정, 카피는 [`../shopify/copy_rework_packs.md`](../shopify/copy_rework_packs.md).

핵심 원칙: **상품을 새로 만들지 않고 기존 상품을 제자리에서 바꾼다.** 상품 ID 가 유지돼야 Judge.me 리뷰가 그대로 붙어 있는다.

> 2026-09-19 개정. `Designs` 1/4/8 옵션을 폐기하고 **5개 고정 + 이름 포함**으로 바뀌면서, 이전 판에서 유일하게 리허설 못 했던 `productOptionsCreate` 단계가 사라졌다. Package Full 은 지금도 Material 4 variant 뿐이라 **옵션을 건드릴 일이 없다.**

## 고정값

| 대상 | 값 |
|---|---|
| Package Full → **Name & Photo Sticker Sheet** | `gid://shopify/Product/9451742396672` · handle `package-full` |
| Face Sticker → **Custom Sticker Sheet** | `gid://shopify/Product/9451674370304` · handle `face-sticker` |
| Package Mini → Draft | `gid://shopify/Product/9451741872384` |
| Full Body Sticker → Draft | `gid://shopify/Product/9458539626752` |
| 참조용 Draft 쌍둥이 (metafield 복사원) | `gid://shopify/Product/9655556833536` |
| Online Store 채널 | `gid://shopify/Publication/197301731584` |
| Easify — Pack upload (→ 세트 A 로 개조) | `767342` |
| Easify — Photo Sticker General (Face/Full Body 현재) | `767314` |
| Easify — 구 Package 세트 (Full / Mini) | `523889` / `523886` |
| 복사 테마 / 라이브 테마 | `165897306368` / `164494606592` |

Package Full 의 현재 variant 4개 (가격·SKU 를 여기에 덮어쓴다):

| 재질 | variant id | 지금 SKU | 새 SKU |
|---|---|---|---|
| White Matte | `48719608938752` | `EVS-PACKAGE-FULL-WM` | `EVS-NAME-5-WM` |
| Silver | `48719609004288` | `EVS-PACKAGE-FULL-SV` | `EVS-NAME-5-SV` |
| Gold | `48719609037056` | `EVS-PACKAGE-FULL-GD` | `EVS-NAME-5-GD` |
| Translucent | `48741943476480` | `EVS-PACKAGE-FULL-TR` | `EVS-NAME-5-TR` |

## 0. 창을 열기 전에 (며칠 전)

- [x] **코드 먼저** — `intake.py` 가 `EVS-NAME-5-*` 를 못 읽으면 테스트 주문이 막힌다. §11 참조. **2026-09-19 구현 완료.**
- [ ] **실물 시트 1장** 출력·재단·촬영. PDP 사진과 "about 24 stickers" 카피의 근거가 된다.
- [ ] **Custom Sticker Sheet 카피** 작성 (title·card_subtitle·story·intro·SEO).
- [ ] **Easify 세트 A 개조** (`767342`): 업로드 **최소 5 · 최대 7**(5 + 스페어 2), `Name` 필수, `Name style` 드롭다운 추가. §5 참조.
- [ ] **Easify 세트 B 생성**: `767314` 복제 후 업로드 도움말 교체 + `Crop preference` 드롭다운 추가.
- [ ] 브랜치 `lineup-2026-09` 를 main 에 머지할 준비 (아직 머지하지 않는다).

## 1. 창 열기 — 스냅샷 먼저

**아무것도 바꾸기 전에** 되돌릴 근거를 만든다. 결과를 `docs/business/_cutover_before.json` 으로 저장한다.

```graphql
query Snapshot {
  a: product(id: "gid://shopify/Product/9451742396672") { ...Snap }
  b: product(id: "gid://shopify/Product/9451674370304") { ...Snap }
  c: product(id: "gid://shopify/Product/9451741872384") { ...Snap }
  d: product(id: "gid://shopify/Product/9458539626752") { ...Snap }
}
fragment Snap on Product {
  id title handle status descriptionHtml tags
  seo { title description }
  options { id name position optionValues { id name } }
  variants(first: 40) { nodes { id title price sku inventoryPolicy inventoryItem { tracked } } }
  metafields(first: 20, namespace: "custom") { nodes { key type value } }
}
```

- [ ] 실행하고 저장했다.

## 2. Name & Photo Sticker Sheet (Package Full 변환)

옵션은 손대지 않는다. Material 4개 그대로다.

**2-1. 제목·주소·설명·SEO**

`productUpdate` 로 한 번에. **`seo.title` 과 `seo.description` 은 반드시 같이 보낸다** — 하나만 보내면 나머지가 지워진다(2026-08-14 실사고).

```
title: "Name & Photo Sticker Sheet"
handle: "name-photo-sticker-sheet"
descriptionHtml: "<p>Five of your photos as die-cut stickers, plus their name and a few small extras, all on one A5 sheet. You pick the material; we choose every size, crop and position and lay the sheet out by hand.</p>"
tags: ["a5","photo-sticker","sheet","name-sticker"]
seo.title: "Name & Photo Sticker Sheet | Everstory Studio"
seo.description: "Send us five photos and a name. We cut them into a sheet of about 24 custom stickers, laid out by hand in our Toronto studio. Free Canada-wide shipping."
```

SEO title 은 45자다. 키워드를 더 넣어 60자를 넘기면 검색 결과에서 잘린다.

- [ ] 완료

**2-2. variant 4개의 가격·SKU**

`productVariantsBulkUpdate` 로 한 번에. 가격 `34.99` → **`24.99`**, SKU 는 §고정값 표대로.

SKU 형식은 `intake.py` 의 `SKU_PACK_RE` 가 읽는 형식이다. 바꾸면 인테이크가 팩을 못 알아본다. §11 을 **먼저** 끝내둔다.

- [ ] 완료. 4개 전부 $24.99 · 구매 가능 상태인지 확인했다.

재고는 지금 tracked=true 에 47~50 이다. 새로 생기는 variant 가 없으므로 그대로 둬도 품절이 안 뜬다. 정리하고 싶으면 `inventoryItem.tracked: false` 로 바꾼다(주문 제작이라 재고 개념이 없다) — 선택 사항이다.

**2-3. metafield**

쌍둥이(`9655556833536`)의 값을 복사하되, `Designs` 를 전제한 문구는 5개 고정 문장으로 고친다.

```graphql
query { product(id: "gid://shopify/Product/9655556833536") {
  metafields(first: 20, namespace: "custom") { nodes { key type value } } } }
```

| 키 | 값 |
|---|---|
| `card_subtitle` | `Their name and 5 photos, cut and ready to peel` |
| `product_intro` · `product_story_html` | 쌍둥이 값에서 "Pick how many different designs" 류를 제거하고 5개 고정·이름 포함으로 |
| `pack_sizes` · `pack_use` · `is_package` · `pack_size_codes` · `sheet_prefix` | 쌍둥이 값 그대로 |

- [ ] 완료

**2-4. 옛 주소 리다이렉트**

```
urlRedirectCreate(urlRedirect: { path: "/products/package-full", target: "/products/name-photo-sticker-sheet" })
```

- [ ] 완료

## 3. Custom Sticker Sheet (Face Sticker 변환)

**3-1. 제목·주소·설명·SEO** — `productUpdate` (seo 는 title+description 동시)

```
title: "Custom Sticker Sheet"
handle: "custom-sticker-sheet"
tags: ["a5","photo-sticker","custom"]
seo.title: "Custom Sticker Sheet | Everstory Studio"
seo.description: "Custom die-cut photo stickers. Pick the size, the crop and how many photos; we cut them by hand in Toronto. Free Canada-wide shipping."
```

- [ ] 완료

**3-2. `Mixed` 사이즈 제거 (7택 → 6택, 28 → 24 variant)**

`Mixed` 는 이제 Name & Photo Sticker Sheet 그 자체라 남기면 두 상품이 겹쳐 보인다.

먼저 옵션 id 와 `Mixed` 값 id 를 읽는다.

```graphql
query { product(id: "gid://shopify/Product/9451674370304") {
  options { id name optionValues { id name } } } }
```

그다음 `productOptionUpdate` 로 그 값을 지운다. **`variantStrategy: MANAGE`** 를 쓴다 — 삭제된 값을 쓰는 variant 4개가 같이 지워진다(enum 설명으로 확인, 09-19). `LEAVE_AS_IS` 는 variant 삭제가 필요하면 오류를 낸다.

⚠ **인자 이름은 실행 직전 `graphql_schema('Mutation')` 로 확인한다.** 여기 적힌 건 전략 enum 만 검증된 상태다.

- [ ] 완료. variant 가 24개이고 Size 가 6택인지 확인했다.

**3-3. metafield**

- [ ] `card_subtitle`: `You pick the size and the crop`
- [ ] `product_story_html` · `product_intro` 작성분 반영
- [ ] ⚠ `pack_sizes` 를 **넣지 않는다.** 넣으면 사이즈 선택 UI 가 숨겨진다.

**3-4. 리다이렉트**

- [ ] `/products/face-sticker` → `/products/custom-sticker-sheet`

## 4. 내리는 상품 2종

- [ ] Package Mini `productUpdate { status: DRAFT }`
- [ ] Full Body Sticker `productUpdate { status: DRAFT }`
- [ ] 리다이렉트: `/products/package-mini` → `/products/name-photo-sticker-sheet`, `/products/full-body-sticker` → `/products/custom-sticker-sheet`

리뷰 2건은 여기서 묻힌다. 둘 다 1년간 주문 0건인 상품이다(§lineup_restructure 판매 데이터).

## 5. Easify 옵션셋 (앱 화면, 손으로)

MCP 로 못 한다. iframe 이라 자동화도 안 된다.

### 세트 A — Name & Photo Sticker Sheet (`767342` 개조)

| # | 타입 | 라벨 | 필수 | 설정 |
|---|---|---|---|---|
| 1 | Text | `Name` | **예** | 최대 24자, A–Z 와 공백만. 도움말: "Printed as its own sticker. Letters A–Z only; a space starts a new line." |
| 2 | Dropdown | `Name style` | 예 | `Retro` / `Bubble`. 기본 Retro |
| 3 | File upload | `Your photos` | 예 | 다중, 이미지(**accept 에 `.heic,.heif` 필수**), **최소 5 · 최대 7**. 도움말: "Five different photos, uploaded in one go, plus a spare or two in case one can’t be cut cleanly. If a photo cannot be used we swap in one of your spares, and email you only if there are none." |
| 4 | Text | `Which photo should be biggest? (optional)` | 아니오 | 한 줄 |
| 5 | Dropdown | `Extra sheets (same design)` | 아니오 | 기존 값·가격 그대로 |
| 6 | Textarea | `Special instructions (optional)` | 아니오 | 기존 placeholder |

- Easify **내부 이름(key)도 정확히 `Name`** 이어야 `intake.py` 가 읽는다.
- **스페어 2장은 의도된 설계다** (2026-09-06 사용자 확정). 모든 사진이 누끼가 되는 건 아니라서 여분을 받아 그중에서 고른다. 옛 Package 의 3버킷 분류와 다르다 — 손님은 등급을 나누거나 고르지 않고 몇 장 더 넣을 뿐이다. 없애지 말 것.
- **"Fewer is fine — we repeat favourites to fill the sheet" 문구는 되살리지 않는다** (2026-09-06 전면 삭제). 최소 5장이 상품 약속(디자인 5개)을 지킨다.
- Big/Medium/Small 필드는 만들지 않는다.

### 세트 B — Custom Sticker Sheet (`767314` 복제)

| 변경 | 내용 |
|---|---|
| Upload 도움말 | "studio will choose the strongest" 삭제 → "Upload the number of photos you chose." |
| 추가 | Dropdown `Crop preference (optional)`: Studio's choice(기본) / Face & shoulders / Full body / Round |

`Photos to include`(1–13, +$3/장) · Name · Extra sheets · Special instructions 는 그대로.

### 할당 교체

- [ ] 세트 A → **Name & Photo Sticker Sheet 하나만**
- [ ] 세트 B → **Custom Sticker Sheet**
- [ ] 세트 `767314` 에서 Face Sticker·Full Body 제거
- [ ] 세트 `523889`(Package Full) · `523886`(Package Mini) 비활성화

## 6. 테마

- [ ] 브랜치 `lineup-2026-09` → `main` 머지 → GitHub 동기화가 라이브 테마에 반영
- [ ] **반드시 pull 해서 라이브와 diff** — 동기화가 전부 잡지 못한 전례가 있다
- [ ] 안 맞으면 `shopify theme push --store q3gj59-am.myshopify.com --live --allow-live --only <파일>`
- [ ] `es-pack-note.liquid` 가 `Designs` 옵션을 읽고 있다. 옵션이 없어졌으므로 **5개 고정 문구로 바꾸거나 제거**한다.

## 7. 컬렉션·메뉴

- [ ] 컬렉션 `photo-sheets` 에 두 상품만 남기고 정렬 (Name & Photo 가 앞)
- [ ] **네비게이션 메뉴** (Shopify Navigation, 테마 아님). 푸터에 옛 상품 4개가 이름으로 걸려 있다. 리다이렉트가 있어도 **라벨이 옛 이름으로 남으므로** 반드시 교체한다
- [ ] 홈 product_list 가 새 컬렉션을 가리키는지 확인
- [ ] Custom Sticker Sheet 는 메뉴에 두되 **2번째**로. 결정이 적은 쪽이 먼저 보여야 한다

## 8. 검증

- [ ] Name & Photo PDP: 옵션이 **Material 하나뿐**, 가격 $24.99, 업로드 최소 5·최대 7, `Name` 필수, `Name style` 보임
- [ ] Custom PDP: Size **6택**(Mixed 없음), `Crop preference` 보임, 팩 문구가 **안** 보임
- [ ] 두 PDP 모두 Judge.me 리뷰 위젯이 이전 개수 그대로 (6건 / 1건)
- [ ] quick-add 모달이 다시 켜지지 않았는지 (사진 업로드 우회 재발 방지)
- [ ] 옛 주소 4개가 전부 새 주소로 넘어감
- [ ] **테스트 주문 1건** — 사진 5장 + 이름 + Name style → 결제 → `intake.py --order <번호>` 로 폴더·파일명·`sticker_name`·`name_style` 까지 확인 → 구성 보드에서 시트 생성
- [ ] 테스트 주문 환불·취소 처리

## 9. 되돌리기

10분 안에 가능해야 한다.

1. 이전 테마 버전 재발행 (Shopify 테마 라이브러리에 이전 버전이 남아 있다)
2. 스냅샷 JSON 을 보고 `productUpdate` 로 title·handle·seo·tags 복원, `productVariantsBulkUpdate` 로 가격 34.99·옛 SKU 복원
3. Package Mini·Full Body `status: ACTIVE`
4. `urlRedirectDelete` 로 리다이렉트 4개 제거
5. Easify 옵션셋 할당 원복

⚠ **3-2 의 `Mixed` 제거만 완전 복구가 아니다.** 값을 다시 추가하면 variant 4개가 새 id 로 생긴다. 판매 이력은 스냅샷이라 영향 없지만 id 는 달라진다. 되돌릴 일이 있으면 이 단계는 마지막에 손댄다.

리뷰는 상품 ID 에 붙어 있어 어느 방향으로 가든 안전하다.

## 10. 창을 닫은 뒤

- [ ] Draft 쌍둥이 `9655556833536` 삭제 (역할 끝)
- [ ] archive 된 쌍둥이 3종 삭제
- [ ] `products.md` · `product_descriptions.md` · `business.md` 를 새 구조로 갱신 (지금 전부 옛 4종 모델)
- [ ] 실물 시트 사진으로 PDP 갤러리 교체

## 11. 코드 (창 열기 전에 끝낼 것) — ✅ 2026-09-19 구현 완료

`scripts/order_intake/intake.py` · `composed_preview.py` · `composed_preview.html`

| 항목 | 상태 |
|---|---|
| `SKU_PACK_RE` 에 `NAME` · `PACK_SHEETS_BY_PHOTOS` 에 `5: 1` · `PACK_NAMES` 에 `"NAME": "Name & Photo"` | 완료 — `EVS-NAME-5-*` → pack · 사진 5 · 1시트 |
| 옵션 `Name style` → `job["name_style"]` (`retro` / `bubble`) | 완료 — 키는 정규화 뒤 `name style`(`_`·`-N` 제거), 값은 Retro/Bubble/레트로/버블. 모르는 값은 비우고 `notes` 에 남김 |
| 구성 보드가 `job.name_style` 로 이름 스타일을 미리 고름 | 완료 — `order_prefill.nameStyle` → 화면에서 먼저 선택 + 안내 문구. 브라우저에 저장된 "마지막 선택"은 안 건드림 |

⚠ **`Name style` 의 실제 옵션 키 문자열은 테스트 주문 1건으로 확인한다** (§8). Easify 내부 이름을 `Name style` 로 두면 그대로 읽힌다. 다르면 `intake.py` 의 `NAME_STYLE_OPTION_KEYS` 에 추가.

테스트: `python3 job_test.py` · `python3 composed_preview_test.py` · `node sim/ordertest.js`.

## 아직 검증 안 된 것

- `productOptionUpdate` 의 정확한 **인자 이름**(§3-2). `variantStrategy` enum 의 동작만 스키마로 확인했다.
- Judge.me 위젯이 handle 변경 후에도 즉시 붙는지 (상품 ID 기준이라 붙어야 하지만 실측은 없다).
- Easify 업로드 **최소 5 · 최대 7** 설정 위치. variant 조건부가 필요 없어져서 단순해졌지만 화면에서 확인은 해야 한다.
- **최소 5 가 맞는지**는 사용자 확인이 필요하다. 지금까지 min 은 티어를 강제하는 장치였는데(8designs=min 6), 티어가 하나뿐이라 그 이유가 사라졌다. 더 낮춰도 엔진은 반복으로 채운다.
