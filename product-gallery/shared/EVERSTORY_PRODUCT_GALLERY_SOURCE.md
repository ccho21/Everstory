# Everstory Product Gallery Master Source

**Version:** 1.1  
**Updated:** 2026-07-30  
**Scope:** SKU-specific ecommerce product galleries

## 1. Business definition

Everstory Studio는 토론토 기반의 커스텀 포토 다이컷 스티커 스튜디오다.
고객 사진을 사람이 직접 다듬고 색상을 확인한 뒤 토론토에서 인쇄, 라미네이션,
정밀 컷팅과 포장을 진행한다.

핵심 가치는 novelty merchandise보다 개인적인 keepsake, 자동 누끼보다
사람이 다듬은 외곽선, 대량생산 이미지보다 조용하고 정성스러운 표현이다.

## 2. Confirmed product truth

- 핵심 제품 형식: ISO A5, 148 × 210 mm portrait sticker sheet
- 고객이 제공한 사진으로 custom die-cut stickers를 제작
- 크기는 스티커의 longest edge 기준
- 모든 제품은 laminated
- 재질: White Matte, Translucent, Silver, Gold
- 비패키지 사이즈:
  - 0.75 in / 19 mm
  - 1 in / 25 mm
  - 1.25 in / 32 mm
  - 1.5 in / 38 mm
  - 2 in / 51 mm
  - 2.5 in / 64 mm
  - Mixed
- 런칭 SKU:
  - Face Sticker
  - Full Body Sticker
  - Shape Sticker
  - Package Mini
  - Package Full
- Shape Sticker는 런칭 시 round crop
- Package Mini: Studio-selected photos 4개, A5 sheet 1장
- Package Full: Studio-selected photos 8개, A5 sheets 2장

## 3. Variable product facts

다음은 보편적인 고정값이 아니다.

- 스티커 개수
- 시트 내 배열
- 사진별 회전과 간격
- 보이는 칼선 형태
- Mixed 옵션의 구성

이 값들은 사이즈, 사진 비율, SKU, 선택 사진과 실제 생산 레이아웃에 따라
달라진다. 특정 인쇄 원본에 보이는 개수는 그 파일에 대해서만 사용할 수 있다.

## 4. Brand and image direction

### Central phrase

`Warm editorial keepsake`

### Desired qualities

- calm and human
- warm but not yellow
- premium but approachable
- tactile but clean
- minimal but not sterile
- informational ecommerce clarity
- realistic photography

### Palette

| Token | Value |
|---|---|
| Ink | `#000000` |
| Paper | `#FFFFFF` |
| Paper Warm | `#F7F5F2` |
| Paper Sage | `#EEF1EA` |
| Clay accent | `#D6A498` |

### Surfaces

- light warm-grey studio sweep
- warm off-white uncoated paper
- pale natural wood, used selectively
- matte warm stone
- restrained neutral linen
- clear glass only for Translucent proof

### Lighting

- broad diffused window or softbox light
- believable contact shadows
- neutral-to-warm white balance
- no yellow cast
- no hard spotlight or CGI gradient

### Subject balance

한 hero에서 아이가 중심이 될 수 있지만 전체 브랜드는 baby-only로 보이면 안 된다.
전체 세트에서는 children, pets, couples, families와 solo adults를 균형 있게 다룬다.

## 5. Gallery objective

상품 갤러리는 감성의 연속이 아니라 구매 정보의 순서다.

1. Product identity and scale
2. What the customer receives
3. Size, cut and print proof
4. Material or option clarity
5. Practical use context

최종 갤러리는 실제 제품 증거를 우선하고 lifestyle은 보조한다.

## 6. Evidence rules

### Actual photo can prove

- 해당 사진에 보이는 물리적 제품
- 시트 모서리와 두께
- 원근과 실제 그림자
- 촬영된 해당 재질의 외관

### Print artwork can prove

- 해당 파일에 보이는 고객 이미지
- 표시된 SKU, size, material
- 배열, 개수와 칼선
- header, footer와 QR

### Concept scene can prove

- background
- composition
- lighting family
- crop and negative space

Concept scene은 제품 정확도를 증명하지 않는다.

### Cross-SKU physical scene base can inform

사용자가 명시적으로 승인한 경우에만 다른 SKU의 actual photo에서 다음을
물리적 장면 기준으로 가져올 수 있다.

- 공통 A5 시트의 카메라 각도와 원근
- 둥근 모서리와 미세한 곡률
- 바닥 접점과 그림자 방향
- 배경과 광원의 일반적 관계

그 사진의 인쇄면, 고객 artwork, size, sticker count, header 데이터와 SKU
정체성은 현재 SKU로 이전할 수 없다. 결과는 `reference_guided_composite`이며
현재 SKU의 actual product proof가 아니다.

### `GOLDEN_STYLE_ANGLED_01`

- File: `style-references/angled-sheet-warm-gray-v1.png`
- Classification: `golden_style_reference`
- Approved use:
  - near-front restrained three-quarter angle
  - upright A5 sheet
  - approximately 82–86% of a square frame's height
  - approximately 56–62% of the frame width
  - approximately 7–10% clear space above the sheet
  - seamless light warm-grey/off-white background
  - broad diffused upper-left/front light
  - soft close contact shadow extending subtly lower-right
- Cannot prove:
  - any SKU's exact artwork, text, sticker count, layout, size or QR
  - actual material fidelity
  - final product accuracy

## 7. Final-use policy

다음 중 하나가 필요하다.

1. 실제 완제품 촬영본, 또는
2. 실제 물리적 시트 사진과 실제 인쇄 원본을 pixel-preserved 방식으로 합성한 이미지

생성형 편집으로 얼굴, 로고, 텍스트 또는 QR을 다시 만든 이미지는
`reference_guided_composite`이며 자동으로 final이 아니다.

## 8. SKU isolation

SKU별 결정, reference ID, 현재 이미지 상태와 prompt는 공통 Master Source에
기록하지 않는다. `FACE_STICKER_*` 또는 `FULL_BODY_STICKER_*`로 시작하는
해당 SKU의 Product Brief와 Reference Index에서 관리한다.

- Face Sticker의 자료는 `/face-sticker`에서만 관리한다.
- Full Body Sticker의 자료는 `/full-body-sticker`에서만 관리한다.
- 한 SKU의 actual product photo를 다른 SKU의 actual product evidence로
  사용하지 않는다.
- 사용자가 명시적으로 승인한 `Physical Scene Base` 예외에서는 공통 물리
  장면만 참조할 수 있으며 결과는 `reference_guided_composite`로 제한한다.
- 다른 SKU 자료가 도움이 될 수 있어도 현재 작업에 자동으로 첨부하거나
  reference hierarchy에 포함하지 않는다.
- cross-SKU 비교가 필요하면 사용자가 명시적으로 요청하고, 제품 증거가 아닌
  merchandising comparison으로만 다룬다.
