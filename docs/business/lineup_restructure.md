# Lineup Restructure 2026-09 — 실행 계획

2026-09-03 논의 결과를 실행 순서로 정리한 계획서다. 결정이 바뀌면 이 문서를 고치고, 확정된 값은 [`products.md`](products.md) / [`../shopify/product_descriptions.md`](../shopify/product_descriptions.md) 로 옮긴다. 이 문서는 SOT 가 아니라 **작업 순서와 범위**를 잡는 문서다.

## 왜 바꾸나

- Package Full 주문 폼의 Big / Medium / Small 3칸 필수 업로드가 핵심 마찰. 손님이 사진을 3등급으로 분류하고 후보를 추려야 해서 "각잡고" 주문해야 했다는 직접 피드백.
- 상품명(Face / Full Body / Package Mini / Full)이 제작자 언어라 "내가 뭘 사야 하는지"를 답하지 않는다. 컬렉션 카드 4장이 전부 흰 A5 시트 사진이라 썸네일에서 구분도 안 된다.
- 최근 주문 4건 중 3건이 결정이 가장 적은 Package Full. 결정량이 전환을 막는다는 신호.

## 목표 상태

### 손님 결정은 세 개

1. **어디에 붙일지** → 상품 (사이즈 배합을 상품이 정한다)
2. **사진 몇 장** → variant `Photos` (1 · 4 · 8)
3. **소재** → variant `Material` (White Matte / Silver / Gold / Translucent)

그 다음은 업로드 한 칸과 선택 노트 하나뿐이다. Big / Medium / Small 은 손님 화면에서 사라지고, 사이즈 배정은 인테이크에서 스튜디오가 한다.

### 라인업 (안)

| 상품 | 사이즈 배합 | Photos variant | 시트 | 가격 |
|---|---|---|---|---|
| Planner Sheet | 0.75" + 1" | 1 / 4 / 8 | 1 / 1 / 2 | $18.99 / $24.99 / $34.99 |
| Phone & Bottle Sheet | 1" + 1.25" | 1 / 4 / 8 | 1 / 1 / 2 | 동일 |
| Laptop Sheet | 1.5" + 2" | 1 / 4 / 8 | 1 / 1 / 2 | 동일 |
| Full Set | 전 사이즈 0.75–2.5" | 1 / 4 / 8 | 1 / 1 / 2 | 동일 (현 Mixed · Package Mini · Package Full 을 흡수) |
| Custom Sheet | Size 7택 (Mixed 포함) | Easify `Photos to include` 1–13 | 1 | from $18.99 (+$3/장) (현 Face · Full Body 통합) |

- **매수와 시트는 항상 묶는다.** 1장·1시트, 4장·1시트, 8장·2시트. "8장·1시트" 같은 조합은 열지 않는다 (밀도·노동 둘 다 깨짐).
- 1장 variant 는 "One photo, every size" 를 따로 상품으로 두지 않고 각 팩의 진입 variant 로 둔다. 카드마다 "from $18.99" 가 붙고, 이름 스티커형 수요(0.75"/1" 얼굴 반복)도 Planner 1장이 받는다.
- Full Set 은 유일하게 팔린 상품(Package Full)의 후속이라 이름을 결과 중심으로만 바꾼다.
- 가격은 사진 수(=누끼 노동)에만 비례. 사이즈 배합은 가격에 영향 없음.

### 주문 폼 (Easify)

| 필드 | 팩 4종 | Custom Sheet |
|---|---|---|
| 사진 업로드 | 1칸, 최대 = Photos variant (1 / 4 / 8) | 1칸, 최대 = `Photos to include` 값 |
| 선택 노트 | "Which photo should be biggest? (optional)" | "Crop preference (optional): Studio's choice / Face & shoulders / Full body / Round" |
| 사이즈 tier | 없음 | 없음 |

- 올린 사진은 전부 인쇄한다. 선별은 사용 불가 사진일 때만 이메일 교체 요청 (기존 규칙).
- 적게 올리면 반복 채움. 상한은 Easify 에서 잠근다 (후보 슬롯을 남기면 고민이 다시 늘어난다).
- **확인 필요**: Easify 업로드 최대 파일 수를 variant 별로 다르게 걸 수 있는지. 안 되면 variant 조건부로 업로드 필드 3개(1/4/8)를 전환.

### 결과 예상 규칙 (손님 화면 카드)

| 보내는 사진 | 받는 결과 |
|---|---|
| 경계가 살아 있는 또렷한 사진 | 실루엣 다이컷, 흰 테두리 |
| 아이 | 얼굴·어깨 크롭 기본 |
| 어른, 펫 | 전신 기본, 얼굴 임팩트 크면 얼굴 |
| 여러 명 | 분리되면 그룹 실루엣, 안 되면 원형 |
| 배경 복잡·머리카락 섞임·가장자리 잘림·흔들림 | 원형 셰이프, 흰 테두리 |
| 피사체 자체가 흐림·너무 작음·어두움 | 인쇄 전 이메일 교체 요청 |

경계 문제면 원형, 피사체 문제면 교체. 원형 폴백이 발생한 주문은 발송 시 한 줄 통보(승인 대기 없음).

## 샌드박스 현실 — 복사 테마가 격리하는 것과 못 하는 것

| 대상 | 복사 테마(`Copy of everstory-theme/main`, ID 165897306368, /t/7)로 격리되나 | 안전한 작업 방식 |
|---|---|---|
| 테마 파일 (templates JSON, sections, snippets, CSS) | 예 | 복사 테마에 CLI push, 코드는 레포 브랜치에 |
| 상품·variant·가격·metafield·컬렉션 | **아니오** (스토어 전역) | 리뷰 보존을 위해 기존 4종은 **삭제·교체하지 않고 제자리에서 변환**한다(§리뷰 보존). 미리보기용 Draft 쌍둥이를 만들어 조립·검증하고, 컷오버 때 같은 변경을 실제 상품에 스크립트로 적용한 뒤 쌍둥이는 삭제 |
| Easify 옵션셋 | **아니오** (앱 전역, 상품에 할당) | 새 옵션셋을 만들어 새 상품에만 할당 |
| SEO title/description | **아니오** | Draft 상품에서 작성. productUpdate 는 title·description 을 항상 함께 보낼 것 |

- 복사 테마는 **GitHub 연결이 없는 사본**이다. 라이브(MAIN)는 `ccho21/everstory-theme` main 과 동기화되므로, 최종 반영은 **레포 브랜치 → main 머지**로 한다. 복사 테마는 미리보기 전용, 코드의 정본은 브랜치.
- 작업 루프: `Shopify Theme/horizon` 에 브랜치 `lineup-2026-09` → 파일 수정 → `shopify theme push --theme 165897306368 --store q3gj59-am.myshopify.com --only <files> --nodelete` → 복사 테마 미리보기로 확인. Theme Editor 에서 복사 테마의 JSON 을 만졌으면 반드시 pull 해서 브랜치에 커밋.
- **Draft 상품은 스토어프론트에서 404** 라 복사 테마 미리보기에 안 뜬다. 새 섹션·카드 디자인은 기존 활성 상품으로 미리보고, Draft 상품의 폼·카피는 어드민 "Preview" 링크(MAIN 테마)로 본다. 둘을 합친 최종 확인은 컷오버 창에서 한다.

## 리뷰 보존 (Judge.me)

2026-09-03 라이브 확인: Package Full 6건 · Package Mini 1건 · Face Sticker 1건 · Full Body Sticker 1건 = **9건, 전부 5점**. Judge.me 리뷰는 **Shopify 상품 ID** 에 묶인다.

Judge.me 정책 (help 문서 확인):
- 리뷰 **일괄 이동은 불가** ("To comply with Shopify, it's no longer possible to move all reviews to another product").
- 개별 이동은 **지원팀 요청**만 가능하고, "잘못된 상품에 달린 리뷰" 라는 증빙이 필요하다. 상품 교체 사유는 보장이 없다.
- CSV 내보내기 → 재가져오기는 공식적으로 비권장 (중복·출처 혼동).
- **Product Groups** (Awesome 플랜, $15/월): 그룹 안 상품끼리 리뷰와 평점 수를 공유. 상품당 그룹 1개. Draft 상품이 그룹에서 리뷰를 계속 공급하는지는 문서에 없음.

### 결정: 상품 ID 를 유지하는 제자리 변환

새 상품을 만들고 옛 상품을 Draft 로 내리는 대신, **기존 상품을 그 자리에서 새 상품으로 바꾼다** (title · handle · options · variants · SKU · 이미지 · metafield · SEO 를 교체). 상품 ID 가 그대로라 리뷰 9건이 그대로 붙어 있고, Judge.me 쪽 작업이 0 이다.

| 기존 상품 (리뷰) | → 새 상품 | 근거 |
|---|---|---|
| Package Full (6) | Full Set | 전 사이즈 · 2시트 후속 |
| Package Mini (1) | Planner Sheet | 1시트 · 4장 구조가 같음 |
| Face Sticker (1) | Custom Sheet | 사이즈 직접 선택 상품의 후속, 가장 많이 랜딩된 URL |
| Full Body Sticker (1) | Laptop Sheet | 전신은 1.25"+ 에서 읽힘 → 큰 사이즈 팩 |
| (신규) | Phone & Bottle Sheet | 리뷰 0 에서 시작 |

- handle 을 바꾸면 옛 URL 에 대해 **URL 리다이렉트를 만든다** (`/products/package-full` → `/products/full-set` 등). 어드민에서 handle 변경 시 리다이렉트 생성 체크, API 로 바꾸면 `urlRedirectCreate` 를 따로 실행.
- 리뷰 본문은 "stickers / gift / quality" 위주라 새 상품명 아래 놓여도 어긋나지 않는다. 옛 variant 를 지칭하는 리뷰가 있으면 그 상품에만 남긴다.
- 옵션·variant 교체는 기존 주문 이력에 영향 없다 (주문은 당시 variant 제목을 스냅샷으로 보관).
- Verified 배지는 주문 연결 기준이라 유지된다.
- 나중에 Awesome 플랜을 쓰게 되면 팩 4종을 Product Group 으로 묶어 팩끼리 리뷰를 공유한다. 지금 필수는 아니다.

### 제자리 변환의 대가

- 컷오버가 **라이브 상품 편집**이 된다. 변경을 스크립트(GraphQL `productUpdate` / `productOptionsCreate` / `productVariantsBulkCreate` / metafieldsSet / urlRedirectCreate)로 준비해 Draft 쌍둥이에서 리허설한 뒤, 창 안에서 실제 상품 4종에 순서대로 적용한다.
- SEO title·description 은 productUpdate 에서 **항상 함께** 보낸다 (부분 갱신이 title 을 지운 사고 있음).
- Easify 옵션셋은 상품 할당만 바꾸면 되므로 새 옵션셋을 미리 만들어 두고 창 안에서 할당을 교체한다.

## Easify 옵션셋 스펙 (2단계)

옵션셋은 앱 전역이라 **새 세트를 만들어 새 상품(우선 Draft 쌍둥이)에만 할당**한다. 기존 세트는 컷오버까지 그대로.

### 세트 A — Pack upload (팩 4종)

| # | 타입 | 라벨 | 필수 | 설정 |
|---|---|---|---|---|
| 1 | Text | Name on the sheet header | 예 | 최대 24자. 도움말: "Printed on the sheet header." (기존과 동일) |
| 2 | File upload | Your photos | 예 | 다중 파일, 이미지(HEIC 포함). **최대 파일 수 = Photos variant** (1 / 4 / 8). variant 조건부가 안 되면 업로드 필드 3개를 만들고 variant 값으로 표시 전환. 도움말: "Upload in one go. Fewer than you chose is fine — we repeat favourites to fill the sheet." |
| 3 | Text | Which photo should be biggest? (optional) | 아니오 | 한 줄. 도움말: "Describe it, or give the file name." |
| 4 | Dropdown | Extra sheets (same design) | 아니오 | 기존 값·가격 그대로 |
| 5 | Textarea | Special instructions (optional) | 아니오 | 기존 placeholder 유지 |

- Big / Medium / Small 필드는 만들지 않는다.
- 업로드 도움말에 "studio picks the strongest" 류 문구를 넣지 않는다 — 올린 건 전부 인쇄한다는 약속과 충돌.

### 세트 B — Custom upload (Custom Sheet)

기존 Face Sticker 세트를 복제해 두 가지만 바꾼다.

| 변경 | 내용 |
|---|---|
| Upload 도움말 | "You can upload up to 2 extra photos… studio will choose the strongest" 삭제 → "Upload the number of photos you chose." (상한 = Photos to include 값) |
| 추가 필드 | Dropdown "Crop preference (optional)": Studio's choice (기본) / Face & shoulders / Full body / Round |

- `Photos to include` 드롭다운(1–13, +$3/장)·Name·Extra sheets·Special instructions 는 그대로.

### 검증 순서

1. 세트 A 를 Draft 쌍둥이 `full-set-preview` 에 할당 → 어드민 Preview 링크에서 필드 확인 → 테스트 담기(`/cart/add` 가로채기 통과 여부).
2. `properties[...]` 키 이름을 확정해 intake.py `KEY_TO_BUCKET` 대신 **단일 업로드 키** 처리로 바꾼다 (버킷은 인테이크에서 운영자 배정).

## 컷오버 뮤테이션 순서 (상품 1개당, Draft 쌍둥이로 검증 완료한 형태)

order_intake 앱 스코프가 read 전용이라 스크립트 대신 **MCP GraphQL 뮤테이션을 단계별로 실행**한다. 실행 전 `product` 전체(옵션·variant·metafield·seo)를 JSON 으로 저장해 롤백 근거로 둔다.

| 순서 | 뮤테이션 | 내용 |
|---|---|---|
| 1 | `productUpdate` | title · handle · descriptionHtml · tags · **seo.title + seo.description 동시** |
| 2 | `productOptionsCreate` | `Photos` 옵션 추가 (`1 photo · 1 sheet` / `4 photos · 1 sheet` / `8 photos · 2 sheets`), 기존 `Size` 옵션은 `productOptionsDelete`(팩만) |
| 3 | `productVariantsBulkCreate` | 12 variant (Photos × Material), SKU `EVS-{PLAN|PHONE|LAPTOP|FULL}-{1|4|8}-{WM|SV|GD|TR}`, 가격 18.99 / 24.99 / 34.99, 재고 정책은 기존 상품과 동일 |
| 4 | `productVariantsBulkDelete` | 옛 variant 제거 (주문 이력은 스냅샷이라 영향 없음) |
| 5 | `metafieldsSet` | card_subtitle · pack_sizes · pack_use · is_package · product_story_html · product_intro |
| 6 | `urlRedirectCreate` | 옛 handle → 새 handle |
| 7 | 확인 쿼리 | variants 12 · options 순서 · metafield · Judge.me 배지 그대로인지 PDP 확인 |

- 쌍둥이 생성에서 확인된 것: `productCreate` 에 `productOptions` 를 주면 첫 조합 variant 1개가 자동 생성된다 → 나머지는 `productVariantsBulkCreate(strategy: DEFAULT)`, 첫 variant 는 `productVariantsBulkUpdate` 로 가격·SKU 지정.
- Custom Sheet(Face Sticker 변환)는 옵션이 Size × Material 그대로이므로 1·5·6 만 해당.
- `publishablePublish` 류(채널 게시)는 **사용자 승인 후에만** 실행 — 자동 모드 분류기가 차단하는 행위이기도 하다.

## 단계

| 단계 | 내용 | 대상 | 라이브 영향 | 예상 |
|---|---|---|---|---|
| 0. 기준 고정 | 결정 3개 확정, products.md · product_descriptions.md · business.md 갱신 | docs | 없음 | 0.5일 |
| 1. 폼 즉시 수정 (선택) | 현 Package Mini/Full 의 Easify 3칸 → 1칸(최대 4/8) + 노트, product_intro·Sizes 문구 교정 | Easify, 상품 metafield | **있음** (승인 후) | 0.5일 |
| 2. 새 카탈로그 | Draft 상품 5종, variant·SKU·가격·metafield·SEO, 새 Easify 옵션셋 2개, 용도별 카드 사진 촬영 | 어드민, Easify, 촬영 | 없음 (Draft) | 1.5일 + 촬영 |
| 3. 테마 | 컬렉션 카드(용도 장면 + 부제), 홈 "Shop by use" 타일, PDP 팩용 helper·결과 예상 카드·업로드 안내, Sizing guide 갱신 | 복사 테마 + 브랜치 | 없음 | 2일 |
| 4. 제작 | intake.py: 새 SKU → 버킷 배정 단계(운영자 지정) + 용도 → 사다리 프리셋, Everstory_mixed.jsx: 팩별 `PACKAGE_LADDERS` 프리셋·SKU 정규식 | 스크립트 | 없음 | 1일 |
| 5. 컷오버 | 아래 체크리스트 | 전부 | **있음** | 0.5일 |

시트 레시피(얼굴 셰이프 색 순환·이름)는 별도 트랙이다. 이 계획을 막지 않는다.

### 1단계 판단

2단계가 일주일 안에 끝나면 1단계는 건너뛰어도 된다. 그보다 오래 걸리면 1단계를 먼저 해서 지금 들어오는 주문의 마찰부터 없앤다. 새 Easify 옵션셋(1칸 + 노트)은 2단계에서 그대로 재사용되므로 낭비는 카피 몇 줄뿐이다.

### 컷오버 체크리스트

1. 변환 스크립트를 Draft 쌍둥이 4개에 실행해 리허설 (options·variants·metafield·SEO·이미지). 쌍둥이 PDP 를 어드민 Preview 로 확인.
2. 창 열기: 기존 상품 4종에 변환 스크립트 적용 (Package Full → Full Set, Package Mini → Planner Sheet, Face Sticker → Custom Sheet, Full Body Sticker → Laptop Sheet) + Phone & Bottle Sheet 신규 Active. handle 변경마다 URL 리다이렉트 생성.
3. Easify 옵션셋 할당 교체 (팩 세트 → 팩 4종, Custom 세트 → Custom Sheet).
4. 브랜치 → main 머지 → GitHub 동기화로 MAIN 테마 반영. **pull 해서 라이브와 diff 로 확인** (동기화가 전부 잡지 못한 전례 있음). 안 맞으면 `--live --allow-live` 로 `--only` push.
5. 컬렉션 `photo-sheets` 정렬·구성 확인, 홈 product_list 확인, quick-add 가 다시 켜지지 않았는지 확인.
5b. **네비게이션 메뉴 갱신** (Shopify Navigation = 라이브 전역, 테마 파일 아님). 현재 푸터/메뉴에 상품 4개가 직접 걸려 있다: Face Sticker · Full Body Sticker · Package Mini · Package Full. 라벨과 핸들을 새 5종으로 바꾼다 (Custom Sheet / Laptop Sheet / Planner Sheet / Full Set + Phone & Bottle Sheet 신규). 리다이렉트가 있어도 **라벨이 옛 이름으로 남으므로 반드시 손봐야 한다.**
6. 리뷰 확인: 각 PDP 의 Judge.me 배지·위젯이 그대로 9건을 보여주는지.
7. 테스트 주문 1건 (Photos 4 · 업로드 4장 · 노트) → 인테이크 `--order` 로 버킷 배정까지 통과 확인.
8. 쌍둥이 Draft 4개 삭제.
9. 롤백: 이전 테마 재발행 + 변환 스크립트의 역방향(옛 title·handle·variants 복원, 스크립트가 적용 전 상태를 JSON 으로 저장해 둔다) + 리다이렉트 삭제. 리뷰는 상품 ID 에 붙어 있어 어느 쪽이든 안전.

## 결정 필요 (사용자)

1. **1단계 실행 여부** — 지금 라이브 폼부터 고칠지, 2단계까지 기다릴지.
2. ~~Face / Full Body 를 Custom Sheet 하나로 합칠지~~ — **합치기로 결정 (2026-09-03)**. 크롭은 선택 노트(Studio's choice 기본).
3. **상품명 확정** — Planner Sheet / Phone & Bottle Sheet / Laptop Sheet / Full Set / Custom Sheet. 영어 단일 정책 유지.

## 미확인 (진행하며 검증)

- Easify: 업로드 최대 개수의 variant 조건부 설정 가능 여부.
- ~~Judge.me 리뷰 이관 방법~~ → 확인 완료: 일괄 이동 불가, 제자리 변환으로 해결 (§리뷰 보존).
- Draft 상품을 복사 테마로 미리보는 우회 경로 유무.
