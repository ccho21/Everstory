# Product Structure

Everstory 런칭 상품 구조를 잠그기 위한 비즈니스 기준 문서다. 기존 design-count 중심 구조는 폐기하고, 고객이 먼저 이해하는 **스티커 형태 + 큐레이션 정도**로 상품 축을 재정의한다.

이 문서는 상품 구조, Package 운영 규칙, 사진 QC, 가격 가정만 다룬다. Shopify 구현, 스크립트 변경, 고객-facing 상세 카피 반영은 후속 작업으로 분리한다.

## Decision Summary

- 런칭 SKU는 **Face Sticker / Full Body Sticker / Shape Sticker / Package Mini / Package Full** 5종이다.
- 비-Package 상품은 고객이 스티커 형태와 출력 크기(inch / mm)를 고르는 기본 상품이다.
- Package 상품은 고객이 Big / Medium / Small print tier 별로 사진을 업로드하고, Everstory가 각 tier에서 최종 출력 사진을 고르는 curated value pack이다.
- 숫자 기준의 사진 QC는 두지 않는다. 제작 가능 여부는 시각 기준으로 판단한다.
- Package 가격은 premium upsell이 아니라 launch-friendly value pack으로 둔다.

## Launch SKU

| Product | Customer promise | Photos selected | Sheets | Shopify price |
|---------|------------------|-----------------|--------|---------------|
| Face Sticker | 얼굴/상반신 중심 다이컷 스티커 | 1+ | size/cap 기준 | from $18.99 CAD |
| Full Body Sticker | 전신/전체 피사체 중심 다이컷 스티커 | 1+ | size/cap 기준 | from $18.99 CAD |
| Shape Sticker | shape 크롭 스티커 (현재 원형) | 1+ | size/cap 기준 | from $18.99 CAD |
| Package Mini | 작은 Everstory curated package | 4 selected photos | 2 A5 sheets | $24.99 CAD |
| Package Full | 큰 Everstory curated package | 8 selected photos | 2 A5 sheets | $34.99 CAD |

## Product Rules

### Face Sticker

- 얼굴/상반신 중심의 다이컷 스티커.
- 기본 1 photo에서 시작한다.
- sheet 수와 sticker count는 선택 size, 사진 비율, 내부 cap에 따라 달라진다.

### Full Body Sticker

- 전신 또는 전체 피사체 중심의 다이컷 스티커.
- 기본 1 photo에서 시작한다.
- 1.25" / 32mm 이상을 권장하되, 작은 size 선택을 차단하지 않는다.

### Shape Sticker

- shape 크롭 스티커. 출시 시점 cut shape 은 원형이며, 향후 다른 shape (heart, star 등) 확장 여지를 둔다.
- 기본 1 photo에서 시작한다.
- sheet 수와 sticker count는 선택 size, 사진 비율, 내부 cap에 따라 달라진다.

### Size Options

비-Package 상품의 size option은 letter code 없이 inch / mm 표기로 노출하며, 여러 사이즈를 한 시트에 섞는 `Mixed` 옵션을 추가로 둔다.

| Size option |
|-------------|
| 0.75" / 19mm |
| 1" / 25mm |
| 1.25" / 32mm |
| 1.5" / 38mm |
| 2" / 51mm |
| 2.5" / 64mm |
| Mixed |

고객-facing 사진 개수 variant label은 `Photos to include`를 권장한다. 숫자 값은 다른 사진 개수로 해석하며, 스티커 총 개수는 선택 size와 사진 비율에 따라 달라진다.

## Package Policy

Package는 고객이 모든 디테일을 지정하는 상품이 아니다. 고객은 원하는 출력 크기 tier 별로 후보 사진을 업로드하고, Everstory가 각 tier에서 최종 출력 사진, crop, format, size, layout을 결정한다.

### Print Tiers

| Tier | Print size |
|------|------------|
| Big print | 2"+ / 51mm+ |
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
- 최종 출력은 2 A5 sheets.

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
- 얼굴 중심 사진은 얼굴이 충분히 보이고 핵심 부위가 가려지지 않음 (머리카락·손·선글라스·모자·그림자)

### Package Buffer Rules

- 각 print tier에서 필요한 pick count를 채울 만큼 usable photos가 있으면 이메일 없이 진행한다.
- 특정 tier의 usable photos가 pick count보다 적으면 이메일로 replacement를 요청한다.
- replacement 요청은 부족한 tier만 명확히 지정한다.

### Customer-facing Copy

고객-facing 문구는 짧게 둔다.

> Upload a few extra photos. We choose the best ones for your final sheets.

> If a main photo is too blurry or too small to print well, we'll contact you before production.

## Pricing

가격은 §Launch SKU 표를 단일 기준으로 한다. 비-Package 상품은 기본 1 photo $18.99 CAD 에서 시작 (무료배송 반영가), 추가 photo **+$3 CAD/장**. Shopify 옵션: Easify Premium **Dropdown** (label `Photos to include`, 각 value 마다 `(N − 1) × $3` add-on).

Package Mini $24.99 CAD, Package Full $34.99 CAD는 launch-friendly 가격이다. 이 가격이면 Package는 premium upsell보다는 curated value pack에 가깝다.

Package Full은 8 selected photos / 2 sheets / $34.99 CAD 인데도 비-Package 다중 사진 상품보다 저렴하게 느껴질 수 있다. 따라서 고객-facing 메시지는 "정교한 개별 지정"이 아니라 "Everstory가 고르는 curated package"로 명확히 분리한다.

## Promotional / loss-leader guardrails

저가·미끼(loss-leader) 상품은 가능하나, **노동이 들어가는 1장 커스텀 완제품을 손실 미끼로 두지 않는다.** 재료 손실(C$1–2)은 마케팅비로 흡수 가능하지만, 건당 누끼·제작 노동 손실은 판매가 늘수록 악화된다 (원가 구조는 [`business.md`](business.md) Cost Model).

법적 가드레일 (Canada Competition Bureau — bait-and-switch 금지). 저가로 광고하는 상품은 다음을 모두 만족해야 한다.

1. 실제로 합리적 수량 구매 가능
2. 수량 제한 명시
3. 숨은 필수비용 없음 — 라미네이션은 전 SKU 필수이므로 광고가에 포함·명시한다 (별도 부가 금지)
4. 손실 한도 정의
5. 건당 노동 거의 0
6. 다음 구매로 이어지는 업셀 경로

## Assumptions

- Material은 4종으로 fix: White Matte / Translucent / Silver / Gold.
- Full Body Sticker는 1.25" / 32mm 이상 권장 문구로 관리하되, 선택 차단은 하지 않는다.
- Package는 최종 사진 선택, crop, format, size, layout을 고객이 직접 지정하는 상품이 아니다.
