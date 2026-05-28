# Batch 4 — Easify Product Options

Set up Easify upload fields for the 5 Shopify products. Use the user-selected **Unlimited / Advanced** plan basis: 20 files, 100MB, Image Editor.

- **Previous batch**: `03_admin_data.md`
- **Next batch**: `05_theme_global.md`
- **Reference**: Easify Product Options file upload support.

## Step 4.1 — Shared Settings

Use these settings for all photo upload fields:

| Setting | Value |
|---------|-------|
| File types | `jpg, jpeg, png, heic` |
| Max file size | `100 MB` |
| Upload UI | Multi-file upload |
| Help text | `Bright, clear photos work best. We email before production if a photo cannot be used.` |

Shared text fields:

| Field | Type | Required | Property name |
|-------|------|----------|---------------|
| Header name | Text input | no | `Header name` |
| Order notes | Long text | no | `Order notes` |

## Step 4.2 — Non-Package Option Set

Create one option set and apply it to:

- Face Sticker
- Full Body Sticker
- Shape Sticker

Option set name: `Everstory Upload — Non-Package`

Preferred setup:

| Field | Type | Required | Property name |
|-------|------|----------|---------------|
| Photos to include | Dropdown `1`–`13`, add-on `+$3 CAD` per extra photo (`(N − 1) × $3`) | yes | `Photos to include` |
| Upload your photos | Multi-file upload | yes | `Photos` |
| Header name | Text input | no | `Header name` |
| Order notes | Long text | no | `Order notes` |

Behavior:

- `Photos to include` is an Easify dropdown (`1`–`13`), not a Shopify variant. It carries the per-photo add-on price (base `$18.99 CAD` + `(N − 1) × $3`; pricing SOT in [`../../business/products.md`](../../business/products.md)).
- The selected `Photos to include` value defines how many different photos the customer should upload.
- If Easify conditional logic supports option-based max/min files, configure the `Photos` upload to require exactly the selected `Photos to include` count.
- If conditional logic is not available, set max files to 13 and use help text: `Upload the same number of photos you selected in Photos to include.`
- Order review must confirm that uploaded photo count matches the selected `Photos to include` before production.

## Step 4.3 — Package Mini Option Set

Option set name: `Everstory Upload — Package Mini`

Apply to: Package Mini.

| Field | Type | Required | Max files | Property name |
|-------|------|----------|-----------|---------------|
| Big print photos | Multi-file upload | yes | 3 | `Big print photos` |
| Medium print photos | Multi-file upload | yes | 3 | `Medium print photos` |
| Small print photos | Multi-file upload | yes | 4 | `Small print photos` |
| Header name | Text input | no | n/a | `Header name` |
| Order notes | Long text | no | n/a | `Order notes` |

Help text:

- Big print: `Upload up to 3 photos. Studio picks 1 to print at the biggest size.`
- Medium print: `Upload up to 3 photos. Studio picks 1 to print at mid-size.`
- Small print: `Upload up to 4 photos. Studio picks 2 to print at small size.`

## Step 4.4 — Package Full Option Set

Option set name: `Everstory Upload — Package Full`

Apply to: Package Full.

| Field | Type | Required | Max files | Property name |
|-------|------|----------|-----------|---------------|
| Big print photos | Multi-file upload | yes | 5 | `Big print photos` |
| Medium print photos | Multi-file upload | yes | 5 | `Medium print photos` |
| Small print photos | Multi-file upload | yes | 7 | `Small print photos` |
| Header name | Text input | no | n/a | `Header name` |
| Order notes | Long text | no | n/a | `Order notes` |

Help text:

- Big print: `Upload up to 5 photos. Studio picks 2 to print at the biggest size.`
- Medium print: `Upload up to 5 photos. Studio picks 2 to print at mid-size.`
- Small print: `Upload up to 7 photos. Studio picks 4 to print at small size.`

## Step 4.5 — App Block Position

Use Online Store 2.0 app block mode if available. Place the Easify block directly below Shopify variant pickers and above buy buttons in the product template.

## Batch 4 Checkpoint

- [ ] Non-Package option set is assigned to Face Sticker, Full Body Sticker, Shape Sticker.
- [ ] Package Mini has exactly 3 tier upload fields.
- [ ] Package Full has exactly 3 tier upload fields.
- [ ] Header name and Order notes appear on all 5 products.
- [ ] App block mode is ready for Batch 7.
