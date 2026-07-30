# Everstory Home Hero Remake Prompt

**Mode:** `concept`  
**Template:** `EVS_TOPDOWN_01 — Home Hero variation`  
**Status:** `Concept Mockup — scene and style exploration; product artwork is provisional.`  
**Intended use:** Everstory Studio home-page hero background and later Photoshop compositing base

## Why this direction

The current hero asks one generated image to invent the customer faces, repeated
sticker artwork, product layout, clear sleeve, printed cards, and brand text at
the same time. That makes the image read as AI-generated and also turns
unverified product details into apparent product evidence.

The replacement should therefore be made in two stages:

1. Generate only a quiet, replacement-ready photographic scene with a blank A5
   placement card.
2. Insert an actual Everstory product image later as a preserved Smart Object in
   Photoshop.

Do not ask the image model to generate the final sticker sheet.

## Input image role

If the current hero image is attached, label it as follows:

```text
Image 1 — Current website hero composition reference only.

Use Image 1 only for:
- the broad idea of a wide top-down editorial scene,
- a low-detail text-safe area on the left,
- the primary A5 product zone on the centre-right.

Do not copy or recreate:
- either child's face or identity,
- the repeated child pair,
- any sticker artwork, count, layout, border, or cut shape,
- the clear sleeve or any packaging,
- the thank-you card,
- the loose photo print,
- the circular “Made to keep” token,
- any printed words, logo, or branding,
- the localized bright hotspot, vignette, or orange cast.
```

## Master generation prompt

```text
OBJECTIVE AND OUTPUT STATUS

Create one replacement-ready Everstory Studio home-page hero background plate.
This is a Concept Mockup for scene, composition, background, lighting, and
Photoshop replacement planning only. It is not an accurate Everstory product
rendering and must not be presented as product evidence.

The result should feel like a carefully art-directed photograph made in a small
Toronto studio: warm editorial keepsake, quiet, personal, tactile, restrained,
premium but approachable, and realistic rather than rendered.

SCENE

Photograph a calm top-down tabletop scene on warm blush-greige uncoated paper,
slightly peach-forward but still neutral. The surface has sparse, irregular,
multidirectional natural paper fibres and very gentle organic tonal variation.
Keep the texture subtle and physically believable, with no repeated digital
pattern.

Place exactly one blank, unprinted, neutral-white ISO A5 portrait placement card
flat on the centre-right of the frame. The card represents only the future
product replacement boundary; it is not an Everstory product. Show all four
corners and the complete outer boundary. Use no props in this first version.

PRODUCT AND MATERIAL LIMITS

The blank placement card must have the visual proportion of ISO A5,
148 × 210 mm, portrait orientation. Keep it matte and neutral white, with
ordinary paper behaviour and no exaggerated thickness.

Do not create sticker artwork, faces, people, pets, printed photographs,
sticker borders, cut lines, a header, a laminate effect, a clear sleeve,
packaging, a logo, or any text. Do not imply an exact material finish or a fixed
sticker count.

COMPOSITION AND PLACEMENT

Use a clean wide editorial composition.

- Reserve the left 43–45 percent as quiet, low-detail negative space for the
  website's existing HTML heading, body copy, and buttons.
- Place the complete A5 card on the centre-right, not at the far-right edge.
- Keep the card's full boundary inside the central crop-safe region so it
  remains useful when the desktop image is centre-cropped.
- Let the card occupy approximately 55–62 percent of the image height.
- Use a very small, believable clockwise rotation of approximately 1–3 degrees,
  as if placed by hand, while retaining an essentially top-down view.
- Keep at least 10 percent clean vertical crop room above and below the card.
- No object may overlap or cross the card.
- Maintain a crisp, easy-to-mask boundary between the white card and the
  blush-greige surface.

The composition must remain readable after the website applies a centred
object-fit: cover crop. Keep all essential card geometry within the middle
horizontal band and avoid placing important content at the extreme right.

CAMERA AND PHOTOGRAPHIC CHARACTER

Use a true top-down camera with a natural normal-lens perspective and minimal
distortion. Keep the complete placement card in focus. Reproduce the modest
micro-contrast, fine surface variation, and slight physical imperfections of a
real editorial product photograph. Avoid computational-looking edge sharpening,
perfectly smooth gradients, synthetic depth of field, or CGI-like geometry.

LIGHTING

Use one large window through a sheer curtain or a large diffused softbox,
distributed broadly across the entire frame. Use neutral-warm white balance,
with the source exposure slightly bright and open because the website currently
adds a dark overlay.

Create only a close, faint, physically plausible contact shadow with a subtle
lower-right falloff. The card must feel resting on the surface, not floating.
Keep the white card neutral and retain highlight detail.

No localized upper-left hotspot. No narrow beam, window-shaped light, dramatic
gradient, hard shadow edge, long cast shadow, heavy vignette, dark corners,
orange wash, or exaggerated rim light.

HARD LOCKS

- Concept Mode remains active.
- Exactly one blank ISO A5 portrait placement card.
- Complete card boundary and all four corners visible.
- Minimal perspective distortion.
- Left 43–45 percent remains low-detail and text-safe.
- No prop overlap.
- No generated product art.
- No people, faces, hands, or customer identity.
- No invented Everstory logo, marketing copy, product label, dimensions, or
  packaging.
- No unsupported material behaviour or fixed sticker-count claim.
- Keep the product zone simple enough for exact Photoshop replacement.

AVOID

Repeated faces or cloned poses; child-only visual identity; synthetic smiling
families; beauty-retouched skin; waxy faces; uncanny hands; generic stock-photo
emotion; scrapbook styling; decorative stationery flat lay; multiple cards;
photo prints; tags; tokens; ribbons; envelopes; confetti; glitter; hearts;
stars; doodles; flowers; candy pastels; powder blue; bright primary colours;
visible third-party branding; glossy 3D rendering; plastic-looking paper;
acrylic sleeve reflections; impossible reflections; perfect procedural texture;
crosshatch; linen weave; canvas texture; grid; repeated fibre pattern; wood
grain; folds; seams; spotlight; harsh black shadow; heavy vignette; embedded
text; watermark.

OUTPUT

One photorealistic variation only.
Wide home-hero master, 16:9, matching the current 1672 × 941 source ratio.
High working resolution.
No embedded text.
Preserve generous crop room for the live desktop hero, which displays at
approximately 2.10:1.
```

## Photoshop product-integration brief

Run this only after a usable actual Everstory A5 product photograph is
available.

```text
IMAGE ROLES

Image 1 — Actual Everstory A5 product source.
Preserve the exact customer photo identity, sticker artwork, sticker count,
sticker positions, die-cut shapes, visible borders, header, sheet proportion,
and material appearance.

Image 2 — Approved hero background plate.
Use only its background colour and texture, camera angle, placement boundary,
crop, negative-space system, lighting direction, and contact-shadow character.

COMPOSITE

Replace only the blank A5 placement card in Image 2 with Image 1.
Keep Image 1 as an independent Smart Object or preserved source layer.
Mask only around the actual sheet boundary.
Apply the minimum whole-sheet Perspective or Distort transform required to fit
the approved placement boundary.
Do not use generative fill on any product pixel.
Create the contact shadow as a separate layer below the product.
Use only minimal global colour integration; do not recolour faces or product
artwork.

DO NOT

Do not redraw, beautify, add, remove, duplicate, reorder, or reshape stickers.
Do not recreate the header. Do not invent hidden product details. Do not alter
the background, crop, or text-safe region.
```

## QA gates

Reject the generated background plate if:

- the A5 card is cropped, severely distorted, folded, or floating,
- any product artwork, text, logo, packaging, or material behaviour is invented,
- the left text-safe area contains a prominent object or a strong hotspot,
- the scene has a glossy render, candy-pastel, scrapbook, or stock-photo look,
- the card cannot be replaced cleanly without rebuilding the scene.

For the background plate, record:

```text
Status: Concept
Template: EVS_TOPDOWN_01 — Home Hero variation
Product Fidelity: NOT APPLICABLE
Safe use: Golden Style candidate and Photoshop compositing base only
Not safe use: final ecommerce product proof
```

For a later product composite, Product Fidelity is `PASS` only after comparison
against the actual product source and human review.

## Responsive note

The current site uses the same centred image in two very different crops:

- desktop viewport observed: hero approximately `1280 × 611` (`2.10:1`);
- mobile viewport observed: hero approximately `390 × 741`, with a severe
  centred horizontal crop;
- a `40%` dark overlay is applied over the source image.

One source image cannot preserve a large right-side product, a wide left-side
copy zone, and full mobile visibility equally well. The prompt above prioritizes
the current desktop hero while keeping the card away from the extreme right.
For a truly controlled mobile result, create a separate mobile crop from the
approved desktop plate or change the theme to support a dedicated mobile hero
image.
