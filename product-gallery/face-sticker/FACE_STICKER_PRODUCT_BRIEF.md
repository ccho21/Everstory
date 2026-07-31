# Face Sticker Product Gallery Brief

**Version:** 1.1  
**Updated:** 2026-07-30  
**Priority:** P1 — replace the current product gallery

## Current problem

현재 Face Sticker 갤러리는 하나의 아기 얼굴을 베이지 배경 위에 띄우거나,
손가락·폰·노트북에 반복 배치한 이미지가 중심이다.

문제:

- 고객이 실제로 받는 A5 시트가 대표 이미지에 보이지 않음
- 동일한 아기 이미지가 반복되어 AI로 맞춰놓은 느낌
- 전체 시트 구성과 실제 규모가 불명확
- 제품 증거보다 lifestyle application이 과도함
- 칼선, 재질과 인쇄 품질을 확인하기 어려움

## Gallery objective

감성보다 먼저 다음 질문에 답한다.

1. 어떤 형태로 받는가?
2. 한 시트에 어떻게 배치되는가?
3. 1.25인치가 실제로 어떻게 보이는가?
4. White Matte는 어떤 재질인가?
5. 어디에 붙일 수 있는가?

## Slot plan

| Slot | Image | Current status |
|---|---|---|
| 01 | standing or near-front full A5 Face Sticker sheet | ready for prompt development |
| 02 | complete A5 top-down | concept reference available; actual top-down missing |
| 03 | die-cut and size macro | actual photo missing |
| 04 | material or size explanation | actual four-material reference missing |
| 05 | one restrained practical application | actual application missing |

## Slot 01 current decisions

- Actual Face Sticker physical photo: missing
- Approved physical scene base: `FACE_PHYSICAL_SCENE_BASE_01`
- Approved style reference: `GOLDEN_STYLE_ANGLED_01`
- Print source: `FACE_ART_125_01`
- Product: Face Sticker
- Size: `1.25in / 32mm`
- Material: `White Matte`
- Design count: `1 design(s)`
- Selected design: plain baby face, no sunglasses, no hat
- Layout for this specific hero: 4 × 5, 20 identical stickers
- Preserve from the print source:
  - Everstory wordmark
  - `MADE TO KEEP | MOMENTS THAT MATTER`
  - mock name
  - mock order information
  - mock date
  - bottom icons and footer
  - QR and `SCAN TO REORDER`
- Change only:
  - use the plain face in all 20 positions for this specific concept
  - `3 design(s)` to `1 design(s)`
  - printed surface, crop, background and restrained colour correction

## Slot 01 production routes

### Route A — Angled physical-scene composite

- Canonical prompt: `../prompts/face-sticker/01-hero-angled.md`
- Inputs:
  - `FACE_PHYSICAL_SCENE_BASE_01` for A5 geometry, perspective, curvature and shadow
  - `FACE_ART_125_01` for every Face Sticker print fact
- `FACE_PHYSICAL_SCENE_BASE_01` originated as a Full Body Sticker actual photo.
- The user explicitly approved it for physical scene transfer only.
- Do not preserve its Full Body artwork, size, count or printed data.
- Target composition and background: `GOLDEN_STYLE_ANGLED_01`
- Maximum status: `reference_guided_composite`

### Route B — Face-only concept

- Prompt: `prompts/01-hero-concept.md`
- Input: `FACE_ART_125_01` only
- Useful for layout exploration without the cross-SKU scene base
- Maximum status: `reference_guided_composite — concept only`

## Visual direction

- quiet, bright, neutral studio
- complete provisional A5 sheet representation remains dominant
- slightly warm but not beige or yellow
- light warm-grey/off-white seamless background
- sheet approximately 82–86% of a square frame's height
- broad diffused upper-left/front light
- soft lower-right contact shadow
- complete sheet visible
- square Shopify crop
- believable concept-level surface texture and contact shadow
- no hand or props for this first angle

## Final-use requirement

ChatGPT Image output is a `reference_guided_composite` and cannot become an actual
Face Sticker product proof while an actual Face Sticker photograph is missing.

If any exact source element drifts, keep the composition as a direction reference
and recreate the printed surface through pixel-preserved layer compositing.

`DSCF0365.jpg`는 Face Sticker 제품 source가 아니다. 다만 사용자가 승인한
Route A에서 공통 A5 물리 장면을 제공하는 `Physical Scene Base`로만 사용한다.
그 인쇄면과 Full Body 제품 사실은 Face 결과에 남기지 않는다.
