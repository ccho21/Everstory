# Cutover Runbook — 상품 2종

새 구조를 라이브로 옮기는 **실행표**다. 배경·근거는 [`lineup_restructure.md`](lineup_restructure.md) §2026-09-19 확정, 카피는 [`../shopify/copy_two_products.md`](../shopify/copy_two_products.md).

핵심 원칙: **상품을 새로 만들지 않고 기존 상품을 제자리에서 바꾼다.** 상품 ID 가 유지돼야 Judge.me 리뷰가 그대로 붙어 있는다.

> 2026-09-19 개정. `Designs` 1/4/8 옵션을 폐기하고 **5개 고정 + 이름 포함**으로 바뀌면서, 이전 판에서 유일하게 리허설 못 했던 `productOptionsCreate` 단계가 사라졌다. Package Full 은 지금도 Material 4 variant 뿐이라 **옵션을 건드릴 일이 없다.**

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
- [ ] **홈 product_list 가 5열·5개** (09-03 다섯 상품 계획의 잔재, `collection: all`). 최종 2종이면 5열에 카드 2장만 남는다. 컬렉션 페이지도 2개짜리 그리드는 본 적이 없다. 복사 테마에서 `columns`·`max_products` 를 2 로 바꿔 보고 정한다 (라이브 무영향).

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

쌍둥이(`9655556833536`)의 값을 그대로 복사한다 — 2026-09-20 에 쌍둥이를 이미 5개 고정·이름 포함 카피로 바꿔 두었다 (`Designs` 옵션 삭제 = `productOptionsDelete(strategy: POSITION)` 리허설 완료, 첫 값 variant 4개만 남고 옛 8개 삭제).

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

- [ ] 브랜치 `lineup-2026-09` → `main` 머지 (fast-forward, 09-20 확인). **GitHub 동기화가 라이브에 반영해 줄 거라고 믿지 않는다** — 실측 (2026-09-20): `shopify[bot]` 마지막 커밋이 07-30 인데 라이브 파일은 08-18 까지 Theme Editor 로 바뀌었고(`templates/index.json` 19:37Z 등) 커밋이 없다 → Shopify→GitHub 방향은 죽어 있고, GitHub→Shopify 도 검증되지 않았다.
- [ ] 머지 직후 **라이브 pull → main 과 diff**. 09-20 기준 라이브와 main 의 차이는 3파일뿐 — `config/settings_data.json`(Judge.me 카트 위젯 블록) · `templates/index.json`(212 leaf: IN THE WILD·hero CSS·Judge.me 캐러셀) · `templates/product.json`(Judge.me real_data) — 그리고 **브랜치는 그 셋을 이미 라이브 값으로 갖고 있다**(09-03 복사 테마 pull 이 베이스). 머지 뒤 남는 차이는 의도한 수정(index 5 leaf · product 13 leaf + 스니펫)만이어야 한다.
- [ ] 라이브 반영은 **CLI 로 직접**: `shopify theme push --store q3gj59-am.myshopify.com --live --allow-live --only <브랜치가 바꾼 파일>` (사용자 승인 후). GitHub 이 살아 있어도 같은 내용이라 해가 없다.
- 복사 테마에만 있는 `snippets/es-upsert-probe.liquid`(08-16 쓰기 프로브, 아무 데서도 render 안 함)는 브랜치에 없어 라이브로 가지 않는다. 복사 테마를 지울 때 같이 사라진다.
- [x] 테마 문장 교체 **완료 (2026-09-19)** — 브랜치 `lineup-2026-09` 커밋 `6ac1063`, 복사 테마에 push 하고 5페이지(홈·컬렉션·FAQ·package-full·face-sticker)에서 확인. 목록은 `copy_two_products.md` §3. main 머지는 컷오버 창에서.

## 7. 컬렉션·메뉴

- [ ] 컬렉션 `photo-sheets` 에 두 상품만 남기고 정렬 (Name & Photo 가 앞)
- [ ] **네비게이션 메뉴** (Shopify Navigation, 테마 아님). 푸터에 옛 상품 4개가 이름으로 걸려 있다. 리다이렉트가 있어도 **라벨이 옛 이름으로 남으므로** 반드시 교체한다
- [ ] 홈 product_list: 지금 `collection: all` · 5열 · 5개. `photo-sheets`(MANUAL 정렬, Name & Photo 앞)로 바꾸고 열 수를 2종에 맞춘다(§0). 09-20 실측: 활성 상품이 4종뿐이라 all = photo-sheets 와 같지만 정렬을 못 정한다. `photo-sheets` 에는 Draft `shape-sticker` 도 들어 있다(Draft 라 안 보임).
- [ ] Custom Sticker Sheet 는 메뉴에 두되 **2번째**로. 결정이 적은 쪽이 먼저 보여야 한다

## 8. 검증

- [ ] Name & Photo PDP: 옵션이 **Material 하나뿐**, 가격 $24.99, 업로드 최소 5·최대 7, `Name` 필수, `Name style` 보임
- [ ] Custom PDP: Size **6택**(Mixed 없음), `Crop preference` 보임, 팩 문구가 **안** 보임, `Photos to include` 가 사이즈별 상한대로 뜸(0.75″ 13 … 2.5″ 1)
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

- ~~`productOptionUpdate` 의 정확한 **인자 이름**(§3-2)~~ → **09-20 validate 통과**: `productOptionUpdate(productId:, option: OptionUpdateInput!, optionValuesToDelete: [ID!], variantStrategy: MANAGE)`. 실행은 컷오버 창(Face 에는 쌍둥이가 없어 리허설은 못 했다).
- Judge.me 위젯이 handle 변경 후에도 즉시 붙는지 (상품 ID 기준이라 붙어야 하지만 실측은 없다).
- ~~Easify 업로드 **최소 5 · 최대 7** 설정 위치~~ → 09-19 세트 A 에서 설정·확인 완료.
- ~~**최소 5 가 맞는지**~~ → 사용자 확정 (09-19 "업로드는 7 최대로 받고 그중에 5디자인을 골라서 줄거야") = min 5 · max 7.
- GitHub→Shopify 방향 동기화 생사. Shopify→GitHub 은 죽은 것으로 실측(§6). 라이브 반영을 CLI 기본으로 잡았으니 컷오버 절차에는 영향 없다.
- 2종만 있을 때 홈·컬렉션 그리드 모양 (§0 의 5열 항목).
