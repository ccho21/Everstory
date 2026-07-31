# Full Body Sticker Product Gallery Brief

**Version:** 1.1  
**Updated:** 2026-07-30  
**Live page:** <https://everstorystudio.ca/products/full-body-sticker?variant=48753822499072>  
**Priority:** P1 — replace the current product gallery

## Current live gallery

현재 갤러리는 4장이다.

1. 베이지 배경에 단일 아기 Full Body cutout
2. 손가락 위에 세운 단일 아기 sticker
3. 휴대폰 뒷면에 여러 아기 sticker
4. 금속 tumbler에 여러 아기 sticker

Slides 02–04의 alt text는 모두 `Full Body Sticker — styled use`로 동일하다.

## Current problems

- 대표 이미지에 실제 A5 sheet가 없음
- subtitle은 `A5 full-body cutout sticker sheet`인데 hero는 단일 sticker만 보여줌
- 손가락 장면은 scale proof처럼 보이지만 실제 크기·제품 증거가 불명확함
- phone과 tumbler가 같은 역할을 반복함
- 전체 갤러리가 아이 중심이라 pets, adults, outfits, dance와 sports라는
  `Best for` 설명을 시각적으로 뒷받침하지 못함
- 실제 sheet 구성, header, sticker count와 packaging state가 보이지 않음
- 생성·합성된 느낌이 강해 제품보다 장면 연출이 먼저 보임

## Live-page content requiring verification

### Default conflict

- 상단 selected size: `0.75in / 19mm`
- 하단 size guide: `1in / 25mm · default`

어느 값이 실제 default인지 통일이 필요하다.

### Mixed conflict

- 상단 옵션에 `Mixed`가 있음
- 하단 section heading은 `One sheet, one size.`

Mixed의 구성 방식 또는 예외 설명이 필요하다.

### Count conflict

라이브 페이지는 1.5인치에 `About 16 per sheet`라고 설명한다.
등록된 `FULL_ART_150_01`에는 20개 sticker positions가 보인다.

제품 원칙상 수량은 photo ratio와 layout에 따라 달라지므로, size만으로 고정된
숫자처럼 보이지 않게 문구를 수정하거나 생산 규칙을 별도로 검증해야 한다.

### Visual-message conflict

본문은 Full Body Sticker가 `1.25in and up`에서 가장 잘 읽힌다고 설명하지만
상단 기본 선택은 0.75인치다.

## Gallery objective

Face Sticker와 같은 구매정보 순서를 사용하되 Full Body의 핵심인
`complete silhouette`를 명확히 보여준다.

1. 실제로 받는 A5 Full Body sheet
2. 한 장의 전체 배열
3. full-subject outline과 die-cut edge
4. size 또는 subject-shape 차이
5. 하나의 실생활 사용 장면

## Slot plan

| Slot | Image | Source status | Recommended action |
|---|---|---|---|
| 01 | actual standing A5 sheet | actual photo available | correct and crop `FULL_ACTUAL_SHEET_01` |
| 02 | full sheet top-down | print artwork available | create reference-guided candidate; actual top-down preferred |
| 03 | silhouette and die-cut macro | fingertip scale candidate available; true macro missing | use candidate for direction only; wait for actual macro |
| 04 | size or subject-shape comparison | partial artwork only | verify production layouts before final |
| 05 | one practical application | no registered actual application | replace current phone+tumbler duplication with one actual use photo |

## Slot 01 locked decisions

- Source: `FULL_ACTUAL_SHEET_01`
- Product visible: Full Body Sticker
- Visible size: `2in / 51mm`
- Visible design count: `1 design(s)`
- Material: `White Matte`
- Status target: `actual_photo` → `final_candidate`

Preserve exactly:

- complete physical A5 sheet
- every printed full-body sticker
- sticker count and arrangement
- customer identity and pose
- die-cut outlines
- Everstory wordmark and tagline
- visible product specification
- mock name, order data and date
- bottom footer and QR
- rounded corners
- slight curvature
- physical contact point and cast shadow

Allowed corrections:

- square ecommerce crop
- exposure and neutral white balance
- subtle contrast and clarity
- minor dust or isolated background speck cleanup
- gentle background evening

Do not:

- replace the printed surface
- generate additional stickers
- improve or redraw faces
- remove the approved mock data or QR
- make the sheet perfectly flat
- add props, hands or decorative objects

## Slot 01 production routes

### Route A — Actual photo correction

- Prompt: `prompts/01-hero-actual-photo.md`
- Input: `FULL_ACTUAL_SHEET_01` only
- Preserves the actual photographed `2in / 51mm`, `1 design(s)` product
- Strongest and most truthful hero route
- Maximum status after QA: `final_candidate`

### Route B — Angled print-artwork composite

- Canonical prompt: `../prompts/full-body-sticker/01-hero-angled.md`
- Inputs:
  - `FULL_ACTUAL_SHEET_01` for physical sheet, camera and shadow
  - `FULL_ART_150_01` for the complete printed surface
  - `GOLDEN_STYLE_ANGLED_01` for the exact sheet angle, frame placement,
    background, light and contact-shadow relationship
- Selected source design:
  - the third design in `FULL_ART_150_01`
  - blue romper
  - both arms raised
  - no hat
  - no push toy
- Repeat the same exact third design across 20 positions
- Preserve the exact 20-position layout map from `FULL_ART_150_01`
- `5 columns × 4 rows` is a count check, not permission to create a new grid
- Preserve position centres, row stagger, spacing, margins, scale and rotation
- Change `3 design(s)` to `1 design(s)`
- Produces a `1.5in / 38mm`, `1 design(s)` angled hero candidate
- Images 1–2 are authoritative Full Body sources
- Image 3 is style-only and cannot supply artwork or product facts
- Match `GOLDEN_STYLE_ANGLED_01` exactly for angle, framing, background and lighting
- Maximum status before pixel-preserved recreation: `reference_guided_composite`
- Use when the 1.5-inch single-design sheet is the desired merchandising example

Route A and Route B are alternatives. Do not describe Route B as an untouched
actual photograph.

## Slot 02 source

`FULL_ART_150_01` is the original three-design source:

- `1.5in / 38mm`
- `3 design(s)`
- 20 positions in this specific artwork
- White Matte label

For Slot 01B, the user has explicitly selected only the third blue-romper design.
Repeat that exact design in all 20 positions and change the header to `1 design(s)`.

This transformation applies to Slot 01B only. The original source file remains
a three-design print artwork and must not be relabelled in the Reference Index.

## Visual direction

- neutral light-grey or warm-white studio
- warm but not yellow
- seamless light warm-grey/off-white background
- sheet approximately 82–86% of a square frame's height
- sheet approximately 56–62% of frame width
- broad diffused upper-left/front light
- soft lower-right contact shadow
- complete product visibility
- quiet ecommerce clarity
- real paper, real edge and believable shadow
- no floating cutout as hero
- no fingertip gimmick
- maximum one lifestyle application in the final five

## Current readiness

- Slot 01: strongest immediate final candidate
- Slot 02: reference-guided candidate possible
- Slot 03: scale reference candidate available; final macro still blocked
- Slot 04: requires count/size verification
- Slot 05: blocked for final; concept replacement possible

## Additional supplied references

### `FULL_SCALE_CANDIDATE_01`

`full_body_post_2.webp`는 blue-romper sticker를 손가락 위에 세운 1:1 이미지다.

장점:

- 단일 Full Body silhouette가 크게 보임
- 흰 테두리와 전체 외곽을 확인하기 쉬움
- 실제 촬영본이라면 특정 sticker의 scale 참고로 사용 가능

제한:

- 손가락 장면 자체가 hero로는 다소 연출된 느낌
- 전체 A5 sheet를 보여주지 않음
- 정밀 die-cut macro가 아님
- 실제 촬영 여부 확인 전까지 final product proof로 사용하지 않음

따라서 대표 이미지로 복귀시키지 않고, 향후 Slot 03의 촬영 방향과 실제
border 확인을 위한 supporting reference로 사용한다.

### `FULL_CURRENT_HERO_01`

`full_body_sticker_post_1.webp`는 현재 라이브 대표 이미지다.

- current-state comparison에는 유용
- 단일 cutout이 제품 시트에서 분리되어 떠 있는 구성
- 실제 제품 크기와 고객이 받는 A5 sheet를 설명하지 못함
- Golden Style 또는 Golden Product Reference로 승격하지 않음
