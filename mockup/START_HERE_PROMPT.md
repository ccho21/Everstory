# Start Here Prompts

## 1. Source Audit Prompt

Paste this into the first chat in the ChatGPT project.

```text
이 프로젝트는 Everstory Studio의 포토 스티커 목업을 일관되게 제작하기 위한 전용 프로젝트다.

프로젝트 Instructions와 업로드된 모든 Sources를 먼저 확인하라.
아직 이미지를 생성하지 말라.

다음 형식으로 Source Audit을 작성하라.

1. Everstory의 사업 정의
2. 확인된 제품 사실
3. 현재 미확정된 제품 정보
4. 현재 사용해야 하는 operating mode
5. Product Hard Locks
6. Brand and Visual Hard Locks
7. Allowed Variations
8. 현재 생성 가능한 template
9. 실제 제품 이미지가 없어서 생성하면 안 되는 template
10. reference hierarchy
11. source 사이의 충돌 또는 누락

실제 제품 이미지가 없으므로 제품 아트, 스티커 개수, 배열, 칼선, 재질 효과를 제품 사실처럼 추정하지 말라.

감사 결과의 마지막에 다음 두 문장을 명확히 답하라.

- 현재 Concept Mockup 제작을 시작해도 되는가?
- 실제 제품 이미지가 생기기 전까지 어떤 결과물을 final ecommerce product proof로 사용하면 안 되는가?
```

## 2. First Concept Mockup Prompt

Run this only after the Source Audit is correct.

```text
Create the first Everstory Golden Style candidate using template EVS_TOPDOWN_01.

MODE
Concept.

STATUS
Concept Mockup — scene and style exploration; product artwork is provisional.

OBJECTIVE
Establish the default Everstory background, lighting, product scale, and negative space for a Shopify product gallery. This is not an accurate product rendering.

SCENE
A complete ISO A5 portrait-format white photo sticker sheet placed flat on a pale natural wood surface with a Paper Warm #F7F5F2 environment. Use a quiet editorial ecommerce setup.

PROVISIONAL PRODUCT
Use multiple synthetic, non-identifiable everyday photographs as temporary die-cut photo sticker placeholders. Include a restrained subject mix such as a child, a pet, a couple, a family moment, and a solo adult.

The temporary sticker artwork, count, layout, cut lines, and material appearance are not final Everstory product facts.

COMPOSITION
Top-down camera.
Complete A5 sheet visible.
Minimal perspective distortion.
Sheet occupies approximately 65 percent of the frame.
Clean negative space around all four sides.
No object overlaps the sheet.
Use zero props for the first version.

LIGHTING
Soft diffused window light from the upper left.
Gentle realistic contact shadow.
Neutral-warm white balance.
No hard spotlight or dramatic gradient.

BRAND DIRECTION
Warm editorial keepsake.
Quiet, personal, tactile, handmade, and premium.
Photographs provide the main colour.
Minimal and realistic rather than decorative.

AVOID
Bright primary-colour backgrounds.
Powder blue.
Candy pastels.
Scrapbook clutter.
Confetti, glitter, hearts, stars, or doodles.
Generic glossy 3D rendering.
Plastic-looking paper.
Invented Everstory logo or text.
Competitor branding.
Unsupported dimensions or fixed sticker-count claims.

OUTPUT
Photorealistic.
Square 1:1.
One carefully composed variation.
High working resolution.
No embedded text.

Before generating, show a compact preflight with:
- mode,
- template,
- confirmed facts,
- provisional elements,
- Hard Locks,
- output status.

After generating, evaluate it with QA_RUBRIC.json and recommend only one next edit.
```

## 3. Handheld Follow-up Prompt

Use after the top-down style is approved.

```text
Create a second Golden Style candidate using EVS_HANDHELD_01.

Use the approved top-down Golden Style image only for colour treatment, background family, lighting softness, and editorial tone.

Keep Concept Mode active.
Use one natural adult hand to support the lower edge of a complete A5 portrait sheet.
Keep the sheet near-front with minimal perspective distortion.
Do not crop the sheet.
Do not allow fingers to cover important sheet areas.
Use no visible jewelry, nail art, or third-party branding.

The provisional sticker artwork remains temporary and must not be treated as product evidence.

Output one square 1:1 variation and evaluate it with QA_RUBRIC.json.
```

## 4. Real Product Integration Prompt

Use only after attaching an actual Everstory product image.

```text
Switch to reference_locked mode.

Image 1 is the actual Everstory A5 product source.
Preserve exactly:
- customer photo identity,
- sticker artwork,
- sticker count,
- sticker positions,
- die-cut shapes,
- visible border,
- sheet header,
- sheet proportion,
- material appearance.

Image 2 is the approved Golden Style mockup.
Use only:
- background,
- lighting direction,
- camera angle,
- crop,
- hand or prop placement,
- overall colour treatment.

Replace only the provisional product area in Image 2 with the actual product from Image 1.
Do not redraw or reinterpret the product.
Do not add, remove, duplicate, reorder, beautify, or reshape stickers.
Keep every non-product element of the approved scene unchanged.

After editing, compare the result against Image 1 using QA_RUBRIC.json.
Reject the result if identity, count, layout, geometry, header, or material has drifted.
```

