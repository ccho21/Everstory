# Cutover Runbook — 용도 라인업 → 상품 2종

새 구조를 라이브로 옮기는 **실행표**다. 배경·근거는 [`lineup_restructure.md`](lineup_restructure.md), 카피는 [`../shopify/copy_rework_packs.md`](../shopify/copy_rework_packs.md).

핵심 원칙: **상품을 새로 만들지 않고 기존 상품을 제자리에서 바꾼다.** 상품 ID 가 유지돼야 Judge.me 리뷰가 그대로 붙어 있는다.

## 고정값

| 대상 | 값 |
|---|---|
| Package Full → **Photo Sticker Sheet** | `gid://shopify/Product/9451742396672` · handle `package-full` |
| Face Sticker → **Custom Size Sheet** | `gid://shopify/Product/9451674370304` · handle `face-sticker` |
| Package Mini → Draft | `gid://shopify/Product/9451741872384` |
| Full Body Sticker → Draft | `gid://shopify/Product/9458539626752` |
| 참조용 Draft 쌍둥이 (값 복사원) | `gid://shopify/Product/9655556833536` |
| Online Store 채널 | `gid://shopify/Publication/197301731584` |
| Easify — Pack upload (세트용) | `767342` |
| Easify — Photo Sticker General (Face/Full Body 현재) | `767314` |
| 복사 테마 / 라이브 테마 | `165897306368` / `164494606592` |

## 0. 창을 열기 전에 (며칠 전)

- [ ] **Custom Size Sheet 카피** 작성 (title·card_subtitle·story·intro·SEO). 아직 없음.
- [ ] **Easify 세트 B (Custom upload)** 생성. 기존 767314 복제 후 업로드 도움말 교체 + `Crop preference` 드롭다운 추가. 아직 없음.
- [ ] 상품 카드용 사진. 없으면 기존 시트 사진으로 나가되, 그 상태를 알고 나간다.
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

## 2. Photo Sticker Sheet (Package Full 변환)

순서를 지킨다. 옵션을 먼저 만들어야 variant 가 생긴다.

**2-1. 제목·주소·설명·SEO**

`productUpdate` 로 한 번에. **`seo.title` 과 `seo.description` 은 반드시 같이 보낸다** — 하나만 보내면 나머지가 지워진다(2026-08-14 실사고).

```
title: "Photo Sticker Sheet"
handle: "photo-sticker-sheet"
descriptionHtml: "<p>Your photos as die-cut stickers on an A5 sheet. Pick how many different designs you want; we mix every size, choose each crop, and lay out the sheet.</p>"
tags: ["a5","photo-sticker","sheet"]
seo.title: "Photo Sticker Sheet | Everstory Studio"
seo.description: "Custom photo stickers on an A5 sheet. Pick 1, 4 or 8 designs and we mix every size from 0.75\" to 2.5\", cut by hand in Toronto. Free Canada-wide shipping."
```

- [ ] 완료

**2-2. Designs 옵션 추가**

```
productOptionsCreate(
  productId: "gid://shopify/Product/9451742396672",
  options: [{
    name: "Designs",
    position: 1,
    values: [{name:"1 design · 1 sheet"},{name:"4 designs · 1 sheet"},{name:"8 designs · 2 sheets"}]
  }],
  variantStrategy: CREATE
)
```

`CREATE` 의 동작(스키마 확인함): 기존 variant 4개는 **첫 값**(`1 design · 1 sheet`)을 받고, 나머지 두 값과의 조합 8개가 새로 만들어진다 → **총 12개**. variant 를 지웠다 다시 만들 필요가 없다.

`position: 1` 을 넣는 이유는 Designs 가 앞에 와야 variant 제목이 `4 designs · 1 sheet / White Matte` 가 되기 때문이다. 빼먹으면 Material 이 앞에 온다.

- [ ] 완료. variant 가 12개인지 확인했다.

**2-3. 12개 variant 의 가격·SKU**

`productVariantsBulkUpdate` 로 한 번에.

| Designs | 가격 | SKU |
|---|---|---|
| 1 design · 1 sheet | 18.99 | `EVS-FULL-1-{WM\|SV\|GD\|TR}` |
| 4 designs · 1 sheet | 24.99 | `EVS-FULL-4-{WM\|SV\|GD\|TR}` |
| 8 designs · 2 sheets | 34.99 | `EVS-FULL-8-{WM\|SV\|GD\|TR}` |

SKU 형식은 `intake.py` 의 `SKU_PACK_RE` 가 읽는 형식이다. 바꾸면 인테이크가 팩을 못 알아본다.

**재고 결정 필요**: 현재 라이브 variant 는 tracked=true 에 수량 47~50 이다. 새로 생기는 8개는 수량 0 이라 그대로 두면 **품절로 뜬다.** 둘 중 하나를 고른다.
- (권장) 12개 전부 `inventoryItem.tracked: false` — 주문 제작이라 재고 개념이 없다.
- 또는 각 variant 에 수량을 넣어준다(단계가 늘어난다).

- [ ] 완료. 12개 전부 구매 가능 상태인지 확인했다.

**2-4. metafield 이전**

쌍둥이(`9655556833536`)의 값을 그대로 옮긴다. 값이 길어서 손으로 옮기지 말고 읽어서 넣는다.

```graphql
query { product(id: "gid://shopify/Product/9655556833536") {
  metafields(first: 20, namespace: "custom") { nodes { key type value } } } }
```

옮길 키: `card_subtitle` · `pack_sizes` · `pack_use` · `is_package` · `pack_size_codes` · `sheet_prefix` · `product_story_html` · `product_intro`

- [ ] 완료

**2-5. 옛 주소 리다이렉트**

```
urlRedirectCreate(urlRedirect: { path: "/products/package-full", target: "/products/photo-sticker-sheet" })
```

- [ ] 완료

## 3. Custom Size Sheet (Face Sticker 변환)

옵션·variant 는 **그대로 둔다**(Size × Material 28개). 손대는 건 이름과 카피뿐이라 훨씬 간단하다.

- [ ] `productUpdate`: title `Custom Size Sheet`, handle `custom-size-sheet`, descriptionHtml, seo(title+description 같이)
- [ ] `metafieldsSet`: card_subtitle `You choose the size · 0.75" to 2.5"`, product_story_html, product_intro
  - ⚠ `pack_sizes` 를 **넣지 않는다.** 넣으면 사이즈 선택 UI 가 숨겨진다.
- [ ] `urlRedirectCreate`: `/products/face-sticker` → `/products/custom-size-sheet`

## 4. 내리는 상품 2종

- [ ] Package Mini `productUpdate { status: DRAFT }`
- [ ] Full Body Sticker `productUpdate { status: DRAFT }`
- [ ] 리다이렉트: `/products/package-mini` → `/products/photo-sticker-sheet`, `/products/full-body-sticker` → `/products/custom-size-sheet`

리뷰 2건은 여기서 묻힌다. 결정된 사항이다.

## 5. Easify 옵션셋 재할당 (앱 화면, 손으로)

MCP 로 못 한다. iframe 이라 자동화도 안 된다.

- [ ] 세트 `767342` (Pack upload) → **Photo Sticker Sheet 하나만** 할당. archive 된 쌍둥이 3종 제거.
- [ ] 세트 B (Custom upload) → **Custom Size Sheet** 할당.
- [ ] 세트 `767314` 에서 Face Sticker·Full Body 제거.
- [ ] 세트 `523889`(Package — Full)·`523886`(Package — Mini) 비활성화.

## 6. 테마

- [ ] 브랜치 `lineup-2026-09` → `main` 머지 → GitHub 동기화가 라이브 테마에 반영
- [ ] **반드시 pull 해서 라이브와 diff** — 동기화가 전부 잡지 못한 전례가 있다
- [ ] 안 맞으면 `shopify theme push --store q3gj59-am.myshopify.com --live --allow-live --only <파일>`

## 7. 컬렉션·메뉴

- [ ] 컬렉션 `photo-sheets` 에 Photo Sticker Sheet + Custom Size Sheet 만 남기고 정렬(세트가 앞)
- [ ] **네비게이션 메뉴** (Shopify Navigation, 테마 아님). 푸터에 옛 상품 4개가 이름으로 걸려 있다. 리다이렉트가 있어도 **라벨이 옛 이름으로 남으므로** 반드시 교체한다.
- [ ] 홈 product_list 가 새 컬렉션을 가리키는지 확인

## 8. 검증

- [ ] Photo Sticker Sheet PDP: Designs 1/4/8 전환마다 업로드 칸이 **하나씩만**, 안내 문구의 숫자가 따라감
- [ ] Custom Size Sheet PDP: Size 7택이 보이고 팩 문구가 **안** 보임
- [ ] 두 PDP 모두 Judge.me 리뷰 위젯이 이전 개수 그대로 (6건 / 1건)
- [ ] quick-add 모달이 다시 켜지지 않았는지 (사진 업로드 우회 재발 방지)
- [ ] 옛 주소 4개가 전부 새 주소로 넘어감
- [ ] **테스트 주문 1건** — 4 designs, 사진 4~6장 업로드 → 결제 → `intake.py --order <번호>` 로 폴더·파일명까지 확인
- [ ] 테스트 주문 환불·취소 처리

## 9. 되돌리기

10분 안에 가능해야 한다.

1. 이전 테마 버전 재발행 (Shopify 테마 라이브러리에 이전 버전이 남아 있다)
2. 스냅샷 JSON 을 보고 `productUpdate` 로 title·handle·seo·tags 복원
3. `productOptionsDelete` 로 Designs 옵션 제거 → variant 가 4개로 돌아온다
4. Package Mini·Full Body `status: ACTIVE`
5. `urlRedirectDelete` 로 리다이렉트 4개 제거
6. Easify 옵션셋 할당 원복

리뷰는 상품 ID 에 붙어 있어 어느 방향으로 가든 안전하다.

## 10. 창을 닫은 뒤

- [ ] Draft 쌍둥이 `9655556833536` 삭제 (역할 끝)
- [ ] archive 된 쌍둥이 3종 삭제
- [ ] `products.md` · `product_descriptions.md` · `business.md` 를 새 구조로 갱신 (지금 전부 옛 모델)
- [ ] `Everstory_mixed.jsx` 에 팩 사다리 프리셋 (인테이크는 이미 새 SKU 를 읽는다)

## 아직 검증 안 된 것

- `productOptionsCreate` 의 `CREATE` 전략을 **기존 variant 가 있는 실제 상품에 실행해본 적은 없다.** 스키마 문서로 동작을 확인했을 뿐이다. 창을 열기 전에 빈 Draft 상품(Material 만 있는)으로 한 번 리허설하면 이 단계의 불확실성이 사라진다.
- Judge.me 위젯이 handle 변경 후에도 즉시 붙는지 (상품 ID 기준이라 붙어야 하지만 실측은 없다).
