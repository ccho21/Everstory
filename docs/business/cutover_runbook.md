# Cutover Runbook — 상품 2종

새 구조를 라이브로 옮기는 **실행표**다. 배경·근거는 [`lineup_restructure.md`](lineup_restructure.md) §2026-09-19 확정, 카피는 [`../shopify/copy_two_products.md`](../shopify/copy_two_products.md).

핵심 원칙: **상품을 새로 만들지 않고 기존 상품을 제자리에서 바꾼다.** 상품 ID 가 유지돼야 Judge.me 리뷰가 그대로 붙어 있는다.

> 2026-09-19 개정. `Designs` 1/4/8 옵션을 폐기하고 **5개 고정 + 이름 포함**으로 바뀌면서, 이전 판에서 유일하게 리허설 못 했던 `productOptionsCreate` 단계가 사라졌다. Package Full 은 지금도 Material 4 variant 뿐이라 **옵션을 건드릴 일이 없다.**

> **라이브 전환 전 실행표다.** 현재 Draft 화면 작업은 [Shopify 작업 순서](../shopify/plan.md), 미결정은 [pending.md](pending.md), 고객 문장은 [카피 정본](../shopify/copy_two_products.md)을 따른다. 과거 완료 표시는 당시 기록이며, 아래 명령 예시는 컷오버 승인과 실행 직전 확인을 대신하지 않는다.

## 고정값

| 대상 | 값 |
|---|---|
| Package Full → **Name & Photo Sticker Sheet** | `gid://shopify/Product/9451742396672` · handle `package-full` |
| Face Sticker → **Custom Sticker Sheet** | `gid://shopify/Product/9451674370304` · handle `face-sticker` |
| Package Mini → Draft | `gid://shopify/Product/9451741872384` |
| Full Body Sticker → Draft | `gid://shopify/Product/9458539626752` |
| 참조용 Draft 쌍둥이 — **2026-09-20 최종 형태로 변환 완료** (Material 4 · $24.99 · `EVS-NAME-5-*` · 제목/SEO/metafield = copy_two_products §1). 컷오버 때 이 상품의 값을 그대로 Package Full 에 옮기면 된다 | `gid://shopify/Product/9655556833536` (handle `full-set-preview`) |
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
- [x] **두 상품 카피** — [`../shopify/copy_two_products.md`](../shopify/copy_two_products.md) (2026-09-19 초안. 스티커 개수 24 는 실물 실측 후 확정).
- [x] **Easify 세트 A** — `767342` 제자리 수정 **완료 (2026-09-19~20, §5 1~7)**. 할당을 쌍둥이 → Package Full 로 바꾸는 것만 컷오버 창.
- [x] **Easify 세트 B** — `767314` 1~3 **완료 (2026-09-19, 라이브 반영)**. `Photos to include (Mixed)` 삭제·Full Body 할당 제거는 컷오버 창. §5.
- [x] 브랜치 `lineup-2026-09` 머지 준비 **완료 (2026-09-20)**: origin 에 push 했고, `main` 과의 merge-base 가 main HEAD(c6e6d27) 라 **fast-forward, 충돌 없음**(`git merge-tree` 로 확인). 라이브 pull 과 비교하면 브랜치 = 라이브 + 의도한 수정뿐 (§6 실측).
- [x] **홈 두 상품 배치 — Draft 완료(2026-09-22).** Package Full → Face 직접 선택, 데스크톱 2열·모바일 1열, `max_products: 2`. 홈 상품 목록을 How it works 앞으로 이동했고 1280px/390px에서 확인했다. 전환 뒤 컬렉션 두 상품 배치는 §8에서 확인한다.
- [x] `templates/cart.json` · `templates/404.json`도 같은 두 상품·2열/모바일 1열로 Draft 반영하고 390px에서 확인했다. 라이브 배포는 §6에서 한다.
- [ ] D-3(Shop 게시/판매 방식), D-4(실측 전 개수 문장), 고객 카피 승인 상태를 기록한다. 미결정 문장·채널 설정을 임의로 채택하지 않는다.
  - 2026-09-22 기록: **D-3 보류**(사용자 결정 — Shop 채널은 이번 전환에서 다루지 않음), **D-4 미확정**(실물 시트 미실측, 개수 문장 채택 보류). 두 항목은 답이 오기 전까지 현재 상태 유지.

## 1. 창 열기 — 스냅샷 먼저

**아무것도 바꾸기 전에** 되돌릴 근거를 만든다. 결과를 `docs/business/_cutover_before.json` 으로 저장한다.

아래 `Product` 필드와 `ResourcePublicationV2` 하위 필드는 2026-09-21 [공식 Product 문서](https://shopify.dev/docs/api/admin-graphql/2026-07/objects/Product)·[ResourcePublicationV2 문서](https://shopify.dev/docs/api/admin-graphql/2026-07/objects/ResourcePublicationV2)로 대조했다. **실제 계정의 쿼리 실행·스키마 검증은 아직 하지 않았다.** 실행 직전 사용하는 API 버전에서 `graphql_schema('Product')` 등으로 다시 확인하고 쿼리를 검증한다.

```graphql
query Snapshot {
  a: product(id: "gid://shopify/Product/9451742396672") { ...Snap }
  b: product(id: "gid://shopify/Product/9451674370304") { ...Snap }
  c: product(id: "gid://shopify/Product/9451741872384") { ...Snap }
  d: product(id: "gid://shopify/Product/9458539626752") { ...Snap }
}
fragment Snap on Product {
  id title handle status descriptionHtml tags onlineStoreUrl
  seo { title description }
  options { id name position optionValues { id name } }
  variants(first: 40) {
    nodes { id title price sku inventoryPolicy inventoryItem { tracked } }
    pageInfo { hasNextPage endCursor }
  }
  metafields(first: 20, namespace: "custom") {
    nodes { key type value }
    pageInfo { hasNextPage endCursor }
  }
  resourcePublicationsV2(first: 10) {
    nodes { isPublished publishDate publication { id name } }
    pageInfo { hasNextPage endCursor }
  }
  collections(first: 10) {
    nodes { id handle }
    pageInfo { hasNextPage endCursor }
  }
}
```

- [ ] 실행하고 저장했다. 각 connection의 `hasNextPage`가 true이면 해당 상품·connection을 `after: endCursor`로 추가 조회해 모두 저장했다. 첫 페이지만 저장하고 완료로 체크하지 않는다.
- [ ] 채널 전체 목록과 상품별 게시 상태를 Admin에서 캡처했다. `resourcePublicationsV2`에는 게시 또는 예약 게시만 나오며 `isPublished: false`는 예약 상태다. `publishDate`도 보존한다. 빈 목록/누락을 API 오류나 권한 부족과 혼동하지 않는다.
- [ ] 메뉴의 라벨·대상 URL·순서, 컬렉션의 포함 상품·정렬 방식·상품 순서를 캡처했다. 위 상품 쿼리의 `collections`만으로 메뉴·정렬을 복원할 수 없다.
- [ ] 라이브 테마를 **Duplicate → `live-backup-YYYYMMDD`**로 만들었다. 새 백업 테마 ID와 라이브 원본 ID·시각을 §9-1에 기록했다. §6 push 전에 필수다.
- [ ] Easify 세트 `523847` · `523886` · `523889` · `767314` · `767342`의 편집 화면을 캡처했다. 필드·조건·가격·필수값·순서·할당·활성 상태가 전부 보이도록 남겼다.
- [ ] 기존 리다이렉트 4경로의 존재 여부·ID·대상과 전환 창 시작 시각을 기록했다. 기존 항목을 바꾼 경우 복구는 삭제가 아니라 이전 값 복원이다.

### 1-A. 전환 창의 유입과 주문 확인

- [ ] 사용자가 승인한 전환 창에 Online Store의 **Private mode/비밀번호 보호**를 켰다(Online Store → Preferences → Store access, UI 명칭은 현재 화면 확인). 해제는 §8 확인 뒤이며, 원래 보호 상태도 기록한다. [Shopify 공식 안내](https://help.shopify.com/en/manual/online-store/themes/password-page)
- [ ] **비밀번호를 전체 판매 중단이나 원자적 전환으로 간주하지 않는다.** 기존 탭·카트·checkout·Shop 등 다른 채널의 차단 여부는 미검증이다. D-3의 채널 결정과 별개로 전환 창에 접수된 주문의 SKU·가격·개인화 속성을 수동 대조한 뒤 제작한다.
- [ ] §2의 가격/SKU 변경과 §5-A 8번 할당을 한 전환 창에서 연속 처리하고, 완료 직후 실제 필드·가격을 확인한다. 할당을 먼저 바꾸는 대안도 중간 상태를 만들므로 이것만으로 문제를 해결했다고 기록하지 않는다.

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

**실측 전 분기:** 위 `about 24`를 그대로 복사하지 않는다. D-4를 확인하고 `copy_two_products.md` §1의 **SEO description — 실측 전** 또는 새로 승인된 대체 문장을 사용한다. SEO title과 description은 이 분기에서도 함께 보낸다. D-4 미결정이면 해당 문장 게시를 보류한다.

- [ ] 완료

**2-2. variant 4개의 가격·SKU**

`productVariantsBulkUpdate` 로 한 번에. 가격 `34.99` → **`24.99`**, SKU 는 §고정값 표대로.

SKU 형식은 `intake.py` 의 `SKU_PACK_RE` 가 읽는 형식이다. 바꾸면 인테이크가 팩을 못 알아본다. §11 을 **먼저** 끝내둔다.

- [ ] 완료. 4개 전부 $24.99 · 구매 가능 상태인지 확인했다.

재고는 지금 tracked=true 에 47~50 이다. 새로 생기는 variant 가 없으므로 그대로 둬도 품절이 안 뜬다. 정리하고 싶으면 `inventoryItem.tracked: false` 로 바꾼다(주문 제작이라 재고 개념이 없다) — 선택 사항이다.

**2-3. metafield**

쌍둥이(`9655556833536`)의 값을 그대로 복사한다 — 2026-09-20 에 쌍둥이를 이미 5개 고정·이름 포함 카피로 바꿔 두었다 (`Designs` 옵션 삭제 = `productOptionsDelete(strategy: POSITION)` 리허설 완료, 첫 값 variant 4개만 남고 옛 8개 삭제).

**실측 전 분기:** 쌍둥이에도 `about 24`가 남을 수 있다. 복사 전에 D-4에 따라 `custom.product_intro`의 개수 문장을 정본 §1의 숫자 없는 대체 문장 또는 새 승인안과 대조한다. 값이 승인안과 다른 쌍둥이는 그대로 복사하지 않는다.

```graphql
query { product(id: "gid://shopify/Product/9655556833536") {
  metafields(first: 20, namespace: "custom") { nodes { key type value } } } }
```

| 키 | 값 |
|---|---|
| `card_subtitle` | `Their name and 5 photos, cut and ready to peel` |
| `product_intro` · `product_story_html` | `copy_two_products.md` §1 의 값 (rich text JSON · HTML 그대로) |
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
descriptionHtml: "<p>Die-cut stickers of your photos on an A5 sheet, your way: choose the size, how many photos, and how we crop them. We trace each one by hand and pack the sheet.</p>"
tags: ["a5","photo-sticker","custom"]
seo.title: "Custom Sticker Sheet | Everstory Studio"
seo.description: "Custom photo stickers on an A5 sheet. Choose the size, crop and photo count. Traced by hand and precision-cut in Toronto. Free Canada-wide shipping."
```

`descriptionHtml`과 SEO는 [카피 정본 §2](../shopify/copy_two_products.md)의 값을 사용한다. 손으로 윤곽을 따고 기계로 재단하는 제작 방식에 맞춰 `Traced by hand and precision-cut`으로 통일한다. 실제 상품·SEO 저장은 컷오버 때 실행한다.

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

- [ ] `card_subtitle`: `You choose the size, the crop and the photos` (`copy_two_products.md` §2)
- [ ] `product_story_html` · `product_intro`: `copy_two_products.md` §2 의 값
- [ ] ⚠ `pack_sizes` 를 **넣지 않는다.** 넣으면 사이즈 선택 UI 가 숨겨진다.

**3-4. 리다이렉트**

- [ ] `/products/face-sticker` → `/products/custom-sticker-sheet`

## 4. 내리는 상품 2종

- [ ] Package Mini `productUpdate { status: DRAFT }`
- [ ] Full Body Sticker `productUpdate { status: DRAFT }`
- [ ] 리다이렉트: `/products/package-mini` → `/products/name-photo-sticker-sheet`, `/products/full-body-sticker` → `/products/custom-sticker-sheet`

리뷰 2건은 여기서 묻힌다. 둘 다 1년간 주문 0건인 상품이다(§lineup_restructure 판매 데이터).

## 5. Easify 옵션셋 (앱 화면)

MCP 로는 못 한다 (Easify 데이터는 Shopify API 밖). 방법은 셋 — ① 앱 화면에서 손으로(필드 8개 수준), ② Claude in Chrome 으로 제가(사용자 로그인 세션, 지켜보는 중에 — 09-19 에는 확장이 응답하지 않았다), ③ CSV export→수정→import(새 세트로 **추가만** 되고 할당·조건 이식이 미확인이라 비권장).

### 현재 상태 (2026-09-19, 스토어프론트 `<script about="Option Set Data Parsed">` 실측)

| 세트 | 이름 | 붙은 상품 | 필드 |
|---|---|---|---|
| `523847` | Photo Sticker — General | Face · Full Body | 767314 와 같은 내용. **같은 상품에 둘 다 붙어 있다** — 하나는 비활성일 것. 앱에서 어느 쪽이 렌더되는지 확인하고 옛 것 삭제 |
| `523886` | Package — Mini | Package Mini | Big/Medium/Small 업로드(3/3/4장) + Special instructions |
| `523889` | Package — Full | Package Full | Big/Medium/Small 업로드(5/5/7장) + Special instructions(내부 이름 `special_instruction`) |
| `767314` | Photo Sticker — General | Face · Full Body | `Name`(필수, 24자, 도움말 "Printed on the sheet header") · `Photos to include` ×7(사이즈별 조건 `variant CONTAIN "0.75\""`…, 값 개수 = 사이즈별 상한) · `Upload your photo(s)`(내부 `Photos`, 0–15장, 100MB, heic 포함) · `Extra sheets` · `Special instructions` |
| `767342` | Pack upload | Draft 쌍둥이 `9655556833536` | `Your photos` ×3(`1 design`/`4 designs`/`8 designs` 조건, 1–3 / 2–6 / 6–10장, 확장자에 svg 섞임) · `Which photo should be biggest?`(내부 이름 **`text-box-1`**) · `Special instructions`(`special_instruction`) |

- **내부 이름(Option name)이 주문 속성 키다.** 인테이크는 `Name` · `Name style` 을 그 이름으로 읽는다(`_`·`-N` 정규화 뒤 소문자 비교).
- `Photos to include` 값은 사이즈마다 다르다 — **0.75″ 13 · 1″ 10 · 1.25″ 5 · 1.5″ 3 · 2″ 3 · 2.5″ 1**(+$3/장). 시트 슬롯 수 기준 auto-cap, 의도된 설계. 카피에 "1 to 13" 이라고 쓰지 않는다.
- `Extra sheets (same design)` 값: `No extra print`(기본) · `Add 1 extra print` +$7 … `Add 10 extra print` +$70.
- 텍스트 상자 데이터에 `except_number` · `except_special_characters` · `type_letter` 플래그가 있다 — 에디터에 "숫자/특수문자 제외" 스위치가 있을 가능성. **있으면 `Name` 에 켠다** (A–Z 와 공백만). 없으면 도움말 + 인테이크 notes 로 잡는다.

### 결정 — 새 세트를 만들지 않는다

`767342` 를 세트 A 로 고쳐 Package Full 에 재할당하고, `767314` 를 세트 B 로 고쳐 그대로 둔다(이미 Face Sticker 에 붙어 있다). 복제·import 는 세트만 늘린다.

### 세트 A — `767342` "Pack upload" → "Name & Photo — upload"

✅ **1~7 완료 (2026-09-19, Claude in Chrome 으로 편집 · 사용자가 Save).** 스토어프론트 데이터로 재확인: 이름 `Name & Photo — upload`, 옵션 6개 = `Name`(필수 1–24자, 숫자·특수문자 제외) · `Name style`(Retro 기본/Bubble) · `Your photos`(5–7장, 조건 없음, svg 제거) · `Extra sheets`(No extra print 기본, +$7×1~10) · `special_instruction`. 아직 Draft 쌍둥이에만 할당 — 8번은 컷오버 창.
에디터 메모: 텍스트 상자에 **Letter case** · **Exclude from text field**(Numbers/Letters/Spaces/Special characters 체크) 설정이 있다. 앱 본문은 iframe 이라 Chrome 탭이 **앞에 있어야** 클릭이 먹고, 드롭다운 값은 Bulk add(줄바꿈 구분)로 넣고 가격은 줄마다 입력한다.

| # | 할 일 |
|---|---|
| 1 | `Your photos (4)` · `Your photos (1)` 업로드 필드 **삭제** |
| 2 | `Your photos (8)` → 조건 **끄기**(항상 표시), 내부 이름 `Your photos`, 파일 수 **min 5 · max 7**, 확장자 `png,jpg,jpeg,heic,heif,tif,tiff`(svg 제거), 100MB 유지, 도움말 = `copy_two_products.md` §1 |
| 3 | Text box **`Name`** 추가 — 내부 이름 정확히 `Name`, 라벨 `Name`, 필수, 길이 1–24, placeholder `e.g. MIA`, 도움말 = copy §1. 숫자·특수문자 제외 스위치가 있으면 켠다 |
| 4 | Dropdown **`Name style`** 추가 — 내부 이름 `Name style`, 필수, 값 `Retro`(기본) · `Bubble`, 가격 0, 도움말 = copy §1 |
| 5 | Dropdown **`Extra sheets (same design)`** 추가 — 내부 이름 `Extra sheets`, 값·가격은 위 표 그대로 |
| 6 | ~~`Which photo should be biggest? (optional)` 내부 이름 → `Biggest photo`~~ → **필드 자체를 삭제** (2026-09-20 사용자: 필요 없음). 큰 사진은 스튜디오가 정한다 |
| 7 | 순서: Name → Name style → Your photos → Extra sheets → Special instructions |
| 8 | **컷오버 창에서** 할당을 쌍둥이 → Package Full `9451742396672` 로 교체 |

1~7 은 Draft 쌍둥이에만 붙어 있으므로 지금 해도 라이브에 영향이 없다. 어드민 Preview 링크(`onlineStorePreviewUrl`)로 확인할 수 있다.

### 세트 B — `767314` 제자리 수정 (Custom Sticker Sheet)

✅ **1~3 완료 (2026-09-19, 라이브 반영됨 — "Options set saved").** 스토어프론트 데이터로 재확인: `Name` 도움말 교체, `Photos` 도움말 교체, `Crop preference`(선택, Studio's choice 기본 / Face & shoulders / Full body / Round) 가 `Photos to include (Mixed)` 뒤에 있다. 4·5 는 컷오버 창.

| # | 할 일 | 언제 |
|---|---|---|
| 1 | `Upload your photo(s)` 도움말 교체 — "studio will choose the strongest" 삭제, copy §2 문장 | 지금 가능 |
| 2 | Dropdown **`Crop preference (optional)`** 추가 — 내부 이름 `Crop preference`, 선택, 값 `Studio's choice`(기본) · `Face & shoulders` · `Full body` · `Round`, 가격 0, 위치 = Photos to include 뒤 | 지금 가능 (선택 항목이라 무해) |
| 3 | `Name` 도움말 "Printed on the sheet header. Up to 24 characters" → 이름 스티커 설명(copy §1 과 같은 문장) — 헤더가 아니라 이름 스티커로 쓰인다 | 지금 가능 |
| 4 | `Photos to include (Mixed)` 드롭다운 **삭제** | **컷오버 창**, Mixed variant 를 지운 뒤 |
| 5 | 할당에서 Full Body Sticker 제거 | 컷오버 창 |

### 정리 (컷오버 뒤)

- [ ] `523847` — 렌더되지 않는 쪽을 확인해 삭제
- [ ] `523886` · `523889` 비활성화
- [ ] 세트 이름을 상품 이름에 맞춘다 (`Name & Photo — upload` / `Custom Sticker Sheet — upload`)

## 6. 테마

- [ ] §1 라이브 백업 테마 ID를 기록했고, 승인된 카피와 §7의 handle 참조 수정이 배포 파일 목록에 포함돼 있다. Judge.me handle 수정은 상품 handle 변경 확인 뒤 **이 push 직전**에 한다.
- [ ] 브랜치 `lineup-2026-09` → `main` 머지 (fast-forward, 09-20 확인). **GitHub 동기화가 라이브에 반영해 줄 거라고 믿지 않는다** — 실측 (2026-09-20): `shopify[bot]` 마지막 커밋이 07-30 인데 라이브 파일은 08-18 까지 Theme Editor 로 바뀌었고(`templates/index.json` 19:37Z 등) 커밋이 없다 → Shopify→GitHub 방향은 죽어 있고, GitHub→Shopify 도 검증되지 않았다.
- [ ] 머지 직후 **라이브 pull → main 과 diff**. 09-20 비교에서는 `config/settings_data.json`(Judge.me 카트 위젯) · `templates/index.json`(IN THE WILD·hero CSS·Judge.me 캐러셀) · `templates/product.json`(Judge.me real_data)의 라이브 편집을 브랜치가 이미 포함했다. 09-22 Draft 수정도 추가됐으므로 과거 leaf 개수를 완료 기준으로 쓰지 말고, 최신 라이브와 실제 배포 파일 차이를 다시 검토한다.
- [ ] 라이브 반영은 **CLI 로 직접**: `shopify theme push --store q3gj59-am.myshopify.com --live --allow-live --only <브랜치가 바꾼 파일>` (사용자 승인 후). GitHub 이 살아 있어도 같은 내용이라 해가 없다.
- 복사 테마에만 있는 `snippets/es-upsert-probe.liquid`(08-16 쓰기 프로브, 아무 데서도 render 안 함)는 브랜치에 없어 라이브로 가지 않는다. 복사 테마를 지울 때 같이 사라진다.
- [x] 테마 문장 교체 **완료 (2026-09-19)** — 브랜치 `lineup-2026-09` 커밋 `6ac1063`, 복사 테마에 push 하고 5페이지(홈·컬렉션·FAQ·package-full·face-sticker)에서 확인. 목록은 `copy_two_products.md` §3. main 머지는 컷오버 창에서.
- [x] **2026-09-22 Draft 추가 반영:** 홈·카트·404 두 상품 선택, 카피 정합성, Easify 접근성 이름. 테마 13파일을 복사 테마에 적용했다. 확인 범위와 미실행 시험은 [Shopify 작업 문서](../shopify/plan.md)에 기록했다. 이번 변경은 아직 Git 커밋·push하지 않았다.

## 7. 컬렉션·메뉴

- [ ] 컬렉션 `photo-sheets` 에 두 상품만 남기고 정렬 (Name & Photo 가 앞)
- [ ] **네비게이션 메뉴** (Shopify Navigation, 테마 아님). 푸터에 옛 상품 4개가 이름으로 걸려 있다. 리다이렉트가 있어도 **라벨이 옛 이름으로 남으므로** 반드시 교체한다
- [ ] 홈·카트·404 `product-list`의 직접 선택 값(`products`)을 상품 handle 변경 후 새 handle `name-photo-sticker-sheet` · `custom-sticker-sheet` 순서로 맞춘다. 현재 Draft는 `package-full` · `face-sticker`를 사용한다. 선택이 비면 collection으로 돌아가므로 §6 배포 전 세 템플릿을 모두 확인한다.
- [ ] Custom Sticker Sheet 는 메뉴에 두되 **2번째**로. 결정이 적은 쪽이 먼저 보여야 한다
- [ ] 홈 Judge.me 캐러셀(`templates/index.json`의 `cards_carousel`)에 남은 옛 상품 handle 4개를 실제 새 상품 handle과 대조한다. 최종 대상은 `name-photo-sticker-sheet` · `custom-sticker-sheet`이며, 내린 두 상품 참조는 제거한다. **상품 handle 변경 후 §6 push 직전**에 맞추고 §8에서 렌더를 확인한다. 미리 새 handle만 배포하면 아직 없는 상품을 가리킬 수 있다.

## 8. 검증

**Draft 미리보기와 주문 검증을 나눈다.** Draft 쌍둥이의 admin preview는 표시·옵션 점검용이며 카트·checkout까지 된다고 가정하지 않는다. 아래 구매·제작 시험은 사용자가 승인한 구매 가능한 상품·테스트 창에서 사업주가 실행한다. 아직 실행하지 않았다. 사업주 소유의 비민감 합성 사진을 쓰고 `시각 / 테마·상품 ID / 기기·브라우저 / 입력 / 기대값 / 실제값 / 통과·실패·접근불가`를 실행 항목 옆에 기록한다. 실제 사진 URL·주소·결제정보는 기록하지 않는다. 미리보기 쿠키·표시줄을 확인해 Draft와 라이브 결과를 구분한다.

- [ ] Name & Photo PDP: 옵션이 **Material 하나뿐**, 가격 $24.99, 업로드 최소 5·최대 7, `Name` 필수, `Name style` 보임
- [ ] NAME 후보 5·6·7장과 Retro/Bubble을 각각 확인한다. 재질 변경 뒤 사진·이름·스타일이 보존되며 업로드 완료 전 제출 동작이 안내와 일치한다.
- [ ] Custom PDP: Size **6택**(Mixed 없음), `Crop preference` 보임, 팩 문구가 **안** 보임, `Photos to include` 가 사이즈별 상한대로 뜸(0.75″ 13 … 2.5″ 1)
- [ ] Custom 각 크기의 상한 13/10/5/3/3/1에 대해 선택 N과 업로드 부족/동일/초과, 크기 변경 후 상태·금액을 확인한다. Crop preference와 Special instructions가 충돌할 때 두 값 모두 보존하고 [pending.md](pending.md)의 결정과 대조한다.
- [ ] 두 PDP 모두 Judge.me 리뷰 위젯이 이전 개수 그대로 (6건 / 1건)
- [ ] quick-add 모달이 다시 켜지지 않았는지 (사진 업로드 우회 재발 방지)
- [ ] Easify 정상/지연/미로딩 상태에서 일반·sticky·빠른 결제 버튼을 각각 확인한다. 사진·이름 없이 결제가 가능한지는 실제 경로로 검증하며 D-2의 처리 방식을 따른다.
- [ ] 옛 주소 4개가 전부 새 주소로 넘어감
- [ ] 두 상품의 Shop 게시 여부와 판매 방식이 D-3 결정과 일치한다. Admin 게시 체크만으로 Shop 고객 화면의 개인화 입력 검증을 대신하지 않는다.
- [ ] 느린 네트워크에서 재질 변경 직후 즉시 담기 → `/cart.js`에서 NAME 라인에 `Name` · `Name style` · `Your photos`가 보존되는지 확인(결제 없음). 정상 속도 결과도 대조한다.
- [ ] `Extra sheets` 없음/1 × 수량 1/2의 네 조합에서 상품·추가금 라인의 수량·단가·총액·약속한 총장수를 대조한다(결제 없음). Easify의 수량별 과금 동작은 실측 전 단정하지 않는다.
- [ ] 같은 SKU로 `MIA/Retro`와 `LEO/Bubble`을 담았을 때 두 개인화가 라인별로 보존되는지 확인한다. 내부 도구가 두 사람의 제작을 자동 분리한다고 가정하지 않는다.
- [ ] Name의 빈값/공백·`Chloé`·`MIA2`·`O'BRIEN`·24자 W·`MIA ROSE`를 Retro/Bubble 각각에서 확인한다. 제출 시 오류·초점·최종 주문값과 실제 이름 생성 결과를 대조하고, Custom 한글 이름의 별도 제작 방식과 혼동하지 않는다.
- [ ] NAME PDP의 eyebrow가 승인 문구와 일치하고 다른 상품명으로 읽히지 않는다.
- [ ] 홈 캐러셀·홈/컬렉션·카트/404 추천 그리드에서 새 상품 참조·2종 배치를 확인한다.
- [ ] **테스트 주문 1건** — 사진 5장 + 이름 + Name style → 결제 → `intake.py --order <번호>` 로 폴더·파일명·`sticker_name`·`name_style`·`job.notes`·수량/옵션 확인 → 구성 보드에서 최종 5장을 선택해 시트 생성. 결제 방식과 환불 비용은 사업주가 실행 전에 확인한다.
- [ ] 실제 출력·재단 결과의 최종 5디자인·이름·칼선·장수와 주문/미리보기를 대조하고 전체 스티커 개수를 실측한다. 자동 테스트 통과로 Adobe 제작·인쇄 성공을 대신하지 않는다.
- [ ] 테스트 주문 환불·취소 처리
- [ ] 결제 테스트 모드를 사용했다면 시험 종료 후 끄고, 결제 설정과 실결제 가능 상태가 시험 전 승인한 상태로 돌아왔는지 확인한다.
- [ ] 변경 전 열린 PDP·카트·checkout과 변경 후 새 탭에서 구/신 SKU·가격·개인화 혼합을 확인하고 §9의 복구 리허설 시간·복원 결과를 기록한다. 비밀번호만으로 기존 세션·다른 채널이 차단됐다고 가정하지 않는다.
- [ ] 전환 창의 접수 주문을 확인하고 누락 속성/옛 Package 속성/새 SKU 조합이 있으면 제작 전에 수동 확인한다. 확인이 끝난 뒤 §1-A의 Online Store 접근 상태를 승인한 상태로 되돌린다.

## 9. 되돌리기

**10분은 복구 목표값이며 실측 기록이 아니다.** 리허설에서 걸린 시간을 기록한다. 아래는 복구 범위이며, 실제 mutation·Publish·push는 사용자가 승인한 복구 창에서 실행한다.

1. **§1 백업 테마 기준점** — 이름 `live-backup-________` / 백업 ID `________` / 기존 라이브 ID `________` / 캡처 시각 `________`. 이 ID의 테마를 Publish한다. Git 이전 커밋에서 해당 파일을 별도 디렉토리에 꺼내 검토 후 CLI push하는 대안도 있으나, Theme Editor 변경을 포함한 라이브 스냅샷과 같음을 먼저 확인한다. 작업 브랜치를 reset하거나 "이전 커밋이면 라이브와 같다"고 가정하지 않는다.
2. 스냅샷 JSON 기준 `productUpdate`로 title·handle·status·**descriptionHtml**·seo(title+description)·tags를 복원하고 `productVariantsBulkUpdate`로 각 variant의 가격·SKU 등 실제 변경 필드를 복원한다. 가격을 모든 상품에 34.99로 일괄 복원하지 않는다. 재고 설정을 바꿨다면 해당 설정도 스냅샷과 대조한다.
3. `metafieldsSet`으로 기존 `custom` metafield의 type·value를 복원한다. 전환 중 새로 생겨 스냅샷에 없던 키는 별도 목록으로 확인해 제거해야 이전 상태가 된다. Product 필드 복원만으로 metafield 복구가 끝나지 않는다.
4. 채널 게시/예약 상태를 §1의 publication ID·`isPublished`·`publishDate` 및 Admin 캡처와 대조해 복원한다. 실행 직전 게시/게시 취소 mutation 스키마와 예약 처리 방법을 확인한다. Mini·Full Body도 이전 status와 채널을 함께 복원한다.
5. 이번 창에 만든 리다이렉트는 ID를 확인해 제거하고, 이전부터 있던 리다이렉트는 §1의 대상 값으로 되돌린다. 메뉴 라벨·링크·순서와 컬렉션 포함 상품·정렬은 §1 캡처로 복원한다.
6. Easify 세트의 할당뿐 아니라 삭제/수정한 필드·조건·가격·필수값·순서·활성 상태를 §1 캡처 기준으로 복원한다.
7. 아래 Mixed variant 복원 한계를 처리한 뒤 옛 PDP·가격·옵션·개인화·리뷰·메뉴를 확인한다. 복구 중 유입 주문도 수동 대조하고, Online Store 접근 상태는 확인 뒤 원래 값으로 돌린다.

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

Doctor 기본 검사와 자체 테스트는 구 4상품·7사이즈 중심이다. 해당 PASS만으로 NAME/Composed 계약과 실제 구매·제작 검증이 끝났다고 판단하지 않는다.

## 12. NAME 제작 확인 — D-11 결정 전 수동 권고

확정 계약은 **후보 5–7장 중 스튜디오가 최종 5디자인을 골라 A5 1장으로 제작**하는 것이다. 진행률 표시 정책(D-11)과 헤더 날짜 정책(D-12)은 아직 채택하지 않았다.

- **수동 권고:** 먼저 최종 5장을 고른 다음 그 사진만 누끼한다. 스페어를 추가로 누끼했다면 구성 화면에서 최종 선택이 5개인지 다시 확인한다. 이는 D-11 답변을 대신하는 영구 운영 규칙이 아니다.
- 보드는 현재 누끼 페어 수/원본 파일 수를 센다. 후보 7장 중 5장만 누끼하면 `5/7`로 남을 수 있다. 시트 파일이 있다는 이유만으로 주문 완료를 선언하지 않고 **선택된 최종 5디자인·이름/스타일·A5 1장·주문 수량/Extra sheets**를 함께 수동 대조한다. 인쇄·발송 여부는 보드가 증명하지 않는다.
- 원본 번호와 누끼 저장 순번은 다를 수 있다(저장 플러그인은 기존 출력의 `max+1`). 번호만으로 사진을 대응시키지 말고 썸네일과 주문 옵션을 함께 확인한다.
- 같은 원본을 재저장하면 옛 페어와 새 페어가 함께 남을 수 있다. 최종 선택 5개가 서로 다른 원본인지 눈으로 대조하고, 번호나 선택 개수만으로 확인을 끝내지 않는다.

## 아직 검증 안 된 것

- ~~`productOptionUpdate` 의 정확한 **인자 이름**(§3-2)~~ → **09-20 validate 통과**: `productOptionUpdate(productId:, option: OptionUpdateInput!, optionValuesToDelete: [ID!], variantStrategy: MANAGE)`. 실행은 컷오버 창(Face 에는 쌍둥이가 없어 리허설은 못 했다).
- Judge.me 위젯이 handle 변경 후에도 즉시 붙는지 (상품 ID 기준이라 붙어야 하지만 실측은 없다).
- ~~Easify 업로드 **최소 5 · 최대 7** 설정 위치~~ → 09-19 세트 A 에서 설정·확인 완료.
- ~~**최소 5 가 맞는지**~~ → 사용자 확정 (09-19 "업로드는 7 최대로 받고 그중에 5디자인을 골라서 줄거야") = min 5 · max 7.
- GitHub→Shopify 방향 동기화 생사. Shopify→GitHub 은 죽은 것으로 실측(§6). 라이브 반영을 CLI 기본으로 잡았으니 컷오버 절차에는 영향 없다.
- 전환 뒤 새 상품 데이터로 컬렉션 두 상품 배치와 메뉴·추천 링크. 홈·카트·404의 현재 두 상품 배치는 Draft에서 확인했다(09-22).
- Draft 상품 admin preview에서 새 테마 선택이 유지되지 않아 Name & Photo의 새 테마 전체 흐름은 아직 실측하지 못했다. 테마 코드/카피 점검을 실제 업로드·주문 시험으로 간주하지 않는다.
