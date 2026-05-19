# Product Structure

Everstory 런칭 상품 구조를 잠그기 위한 비즈니스 기준 문서다. 기존 design-count 중심 구조는 폐기하고, 고객이 먼저 이해하는 **스티커 형태 + 큐레이션 정도**로 상품 축을 재정의한다.

이 문서는 상품 구조, Package 운영 규칙, 사진 QC, 가격 가정만 다룬다. Shopify 구현, 스크립트 변경, 고객-facing 상세 카피 반영은 후속 작업으로 분리한다.

## Decision Summary

- 런칭 SKU는 **Face Sticker / Full Body Sticker / Circle Sticker / Package Mini / Package Full** 5종이다.
- 비-Package 상품은 고객이 스티커 형태와 출력 크기(inch / mm)를 고르는 기본 상품이다.
- Package 상품은 고객이 Big / Medium / Small print tier 별로 사진을 업로드하고, Everstory가 각 tier에서 최종 출력 사진을 고르는 curated value pack이다.
- 숫자 기준의 사진 QC는 두지 않는다. 제작 가능 여부는 시각 기준으로 판단한다.
- Package 가격은 premium upsell이 아니라 launch-friendly value pack으로 둔다.

## Launch SKU

| Product | Customer promise | Photos selected | Sheets | Shopify price |
|---------|------------------|-----------------|--------|---------------|
| Face Sticker | 얼굴/상반신 중심 다이컷 스티커 | 1+ | size/cap 기준 | from $15.99 CAD |
| Full Body Sticker | 전신/전체 피사체 중심 다이컷 스티커 | 1+ | size/cap 기준 | from $15.99 CAD |
| Circle Sticker | 원형 크롭 스티커 | 1+ | size/cap 기준 | from $15.99 CAD |
| Package Mini | 작은 Everstory curated package | 4 selected photos | 2 A5 sheets | $24.99 CAD |
| Package Full | 큰 Everstory curated package | 8 selected photos | 3 A5 sheets | $32.99 CAD |

## Product Rules

### Face Sticker

- 얼굴/상반신 중심의 다이컷 스티커.
- 기본 1 photo에서 시작한다.
- 추가 photo는 +$3 CAD를 임시 기준으로 둔다.
- sheet 수와 sticker count는 선택 size, 사진 비율, 내부 cap에 따라 달라진다.

### Full Body Sticker

- 전신 또는 전체 피사체 중심의 다이컷 스티커.
- 기본 1 photo에서 시작한다.
- 추가 photo는 +$3 CAD를 임시 기준으로 둔다.
- 1.25" / 32mm 이상을 권장하되, 작은 size 선택을 차단하지 않는다.

### Circle Sticker

- 원형 크롭 스티커.
- 기본 1 photo에서 시작한다.
- 추가 photo는 +$3 CAD를 임시 기준으로 둔다.
- sheet 수와 sticker count는 선택 size, 사진 비율, 내부 cap에 따라 달라진다.

### Size Options

비-Package 상품의 size option은 letter code 없이 inch / mm 표기로만 노출한다.

| Size option |
|-------------|
| 0.75" / 19mm |
| 1" / 25mm |
| 1.25" / 32mm |
| 1.5" / 38mm |
| 2" / 51mm |
| 2.5" / 64mm |

고객-facing 사진 개수 variant label은 `Photos to include`를 권장한다. 숫자 값은 다른 사진 개수로 해석하며, 스티커 총 개수는 선택 size와 사진 비율에 따라 달라진다.

## Package Policy

Package는 고객이 모든 디테일을 지정하는 상품이 아니다. 고객은 원하는 출력 크기 tier 별로 후보 사진을 업로드하고, Everstory가 각 tier에서 최종 출력 사진, crop, format, size, layout을 결정한다.

### Print Tiers

| Tier | Print size |
|------|------------|
| Big print | 1.75"+ / 45mm+ |
| Medium print | 1.25-1.5" / 32-38mm |
| Small print | 0.75-1" / 19-25mm |

### Package Mini

| Tier | Customer upload | Studio selection |
|------|-----------------|------------------|
| Big print | Up to 3 photos | Studio picks 1 to print at the biggest size |
| Medium print | Up to 3 photos | Studio picks 1 to print at mid-size |
| Small print | Up to 4 photos | Studio picks 2 to print at small size |

- 총 up to 10 uploaded photos.
- 총 4 selected photos.
- 최종 출력은 2 A5 sheets.

### Package Full

| Tier | Customer upload | Studio selection |
|------|-----------------|------------------|
| Big print | Up to 5 photos | Studio picks 2 to print at the biggest size |
| Medium print | Up to 5 photos | Studio picks 2 to print at mid-size |
| Small print | Up to 7 photos | Studio picks 4 to print at small size |

- 총 up to 17 uploaded photos.
- 총 8 selected photos.
- 최종 출력은 3 A5 sheets.

## Photo Decision Rules

Crop 결정은 기본적으로 사진을 보고 Studio가 판단한다. 고객이 별도 요청을 남기지 않으면 다음 기본값을 적용한다.

| Subject | Default crop decision |
|---------|-----------------------|
| 아이 | Face crop 기본 |
| 어른 | Full body crop 기본 |
| 펫 | Full body crop 기본. 얼굴 임팩트가 강하면 face crop 가능 |

최종 crop은 피사체 비율, 표정/포즈의 임팩트, 잘린 부분, 출력 tier를 함께 보고 결정한다.

## Photo QC

숫자 기준은 두지 않는다. 사진 QC는 제작자가 시각 기준으로 판단한다.

좋은 사진 기준:

- 피사체가 선명함
- 얼굴이나 대상이 너무 작지 않음
- 너무 어둡거나 흐릿하지 않음
- 잘린 부분이 결과물에 큰 문제가 없음

### Package Buffer Rules

- 각 print tier에서 필요한 pick count를 채울 만큼 usable photos가 있으면 이메일 없이 진행한다.
- 특정 tier의 usable photos가 pick count보다 적으면 이메일로 replacement를 요청한다.
- replacement 요청은 부족한 tier만 명확히 지정한다.

### Customer-facing Copy

고객-facing 문구는 짧게 둔다.

> Upload a few extra photos. We choose the best ones for your final sheets.

> If a main photo is too blurry or too small to print well, we'll contact you before production.

## Pricing

| Product | Price |
|---------|-------|
| Face Sticker | from $15.99 CAD |
| Full Body Sticker | from $15.99 CAD |
| Circle Sticker | from $15.99 CAD |
| Package Mini | $24.99 CAD |
| Package Full | $32.99 CAD |

비-Package 상품은 기본 1 photo $15.99 CAD에서 시작하고, 추가 photo는 +$3 CAD를 임시 기준으로 둔다.

Package Mini $24.99 CAD, Package Full $32.99 CAD는 launch-friendly 가격이다. 이 가격이면 Package는 premium upsell보다는 curated value pack에 가깝다.

Package Full은 8 selected photos / 3 sheets인데 $32.99 CAD이므로, 비-Package 다중 사진 상품보다 저렴하게 느껴질 수 있다. 따라서 고객-facing 메시지는 "정교한 개별 지정"이 아니라 "Everstory가 고르는 curated package"로 명확히 분리한다.

## Assumptions

- Material은 현재 4종 유지: White Matte / Pearl Grey / Silver / Gold.
- White Waterproof 추가 여부는 후속 결정한다.
- Full Body Sticker는 1.25" / 32mm 이상 권장 문구로 관리하되, 선택 차단은 하지 않는다.
- Package는 최종 사진 선택, crop, format, size, layout을 고객이 직접 지정하는 상품이 아니다.

## Follow-up

- Shopify product option과 customer-facing copy에 이 구조를 반영한다.
- 구현 문서와 스크립트 정책은 상품 구조 확정 후 별도 업데이트한다.
- White Waterproof 추가 여부는 material 운영 기준이 확정되면 다시 판단한다.
