# Face Sticker Reference Index

**Version:** 1.1  
**Active SKU:** Face Sticker

## Available references

### `FACE_ART_075_01`

- File: `references/print-artwork/face-0_75in-3-designs.webp`
- Classification: `print_artwork`
- Visible specification: `0.75in / 19mm`, `3 design(s)`, `White Matte`
- Can prove:
  - exact artwork and layout in this file
  - header, footer, approved mock data and QR
- Cannot prove:
  - physical material, thickness, lighting or shadow
  - a universal count for all 0.75-inch orders

### `FACE_ART_125_01`

- File: `references/print-artwork/face-1_25in-3-designs.webp`
- Classification: `print_artwork`
- Visible specification: `1.25in / 32mm`, `3 design(s)`, `White Matte`
- Visible source layout: 4 columns × 5 rows, 20 positions
- Current approved transformation:
  - use the plain face without sunglasses or hat
  - repeat it in all 20 positions for this specific candidate
  - change `3 design(s)` to `1 design(s)`
  - preserve mock name, date, order data, footer and QR
- Cannot prove:
  - physical material, thickness, lighting or shadow
  - a universal count for all 1.25-inch orders

### `FACE_SCENE_01`

- File: `references/concept/face-topdown-concept.png`
- Classification: `concept_scene`
- May inform:
  - square top-down crop
  - full-sheet visibility
  - negative-space direction
- Cannot prove:
  - an actual Face Sticker product
  - product geometry, material, count or print quality
- Status: current-state concept only; not Golden

### `FACE_PHYSICAL_SCENE_BASE_01`

- File: `../full-body-sticker/references/actual-product/white-matte-a5-standing-DSCF0365.jpg`
- Classification: `cross_sku_physical_scene_base`
- Origin: actual Full Body Sticker photograph
- Explicitly approved use:
  - Face Sticker Slot 01 angled composite only
  - A5 sheet geometry
  - near-front perspective
  - rounded corners and slight curvature
  - floor contact and cast shadow
- Cannot prove or transfer:
  - Face Sticker actual product status
  - the existing Full Body print surface
  - visible 2in / 51mm specification
  - sticker count, customer artwork or order-specific printed content
- Maximum output status: `reference_guided_composite`

### `GOLDEN_STYLE_ANGLED_01`

- File: `../shared/style-references/angled-sheet-warm-gray-v1.png`
- Classification: `golden_style_reference`
- Approved use:
  - square near-front angled composition
  - 82–86% sheet height and 56–62% sheet width
  - light warm-grey/off-white seamless background
  - broad diffused upper-left/front light
  - soft lower-right contact shadow
- Cannot prove:
  - exact Face Sticker artwork, text, count, layout, size, material or QR

## Missing actual references

| ID | Needed asset | Required for |
|---|---|---|
| `FACE_ACTUAL_SHEET_01` | actual Face Sticker A5 sheet photo | final Slot 01–02 |
| `FACE_ACTUAL_MACRO_01` | actual Face Sticker cut-line macro | final Slot 03 |
| `FACE_ACTUAL_MATERIALS_01` | actual four-material samples | final Slot 04 |
| `FACE_ACTUAL_USE_01` | actual Face Sticker application | final Slot 05 |

## Cross-SKU boundary

`DSCF0365.jpg` remains a Full Body Sticker actual photograph. Its only approved
Face use is the narrow `FACE_PHYSICAL_SCENE_BASE_01` role above. It must never be
described as Face Sticker actual product evidence.
