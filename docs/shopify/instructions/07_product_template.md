# Batch 7 — Product Template

Set up the shared product page template for all 5 products. The template must work for both non-Package products and Package products.

- **Previous batch**: `06_home_collection.md`
- **Next batch**: `08_pages.md`

## Product Page Order

Use this block order inside product details:

1. Product title
2. Price
3. Variant picker
4. Easify app block
5. Quantity
6. Buy buttons
7. Accordions
8. Product description
9. Product recommendations

## Variant Picker

Non-Package products show:

- Size
- Material
- Photos to include

Package products show:

- Material only

Do not show letter size labels. Size labels are inch / mm only.

## Easify App Block

Place the Easify app block directly below variant picker and above buy buttons.

Expected fields:

| Product group | Upload UI |
|---------------|-----------|
| Face / Full Body / Shape | Upload your photos, Header name, Order notes |
| Package Mini | Big print photos, Medium print photos, Small print photos, Header name, Order notes |
| Package Full | Big print photos, Medium print photos, Small print photos, Header name, Order notes |

## Accordions

Use these accordions for all products:

- What you get
- Materials and sizes
- Crop decisions
- Care and lifespan
- Lead time and shipping
- Photo guidelines

Crop decisions accordion copy:

`Studio chooses the crop from the photo unless you leave a note. Kids default to face crop, adults default to full body, and pets default to full body unless the face has stronger impact.`

## Product Recommendations

Horizon's product recommendations block only supports `Related` (Shopify auto algorithm) or `Complementary` (manual) — there is no collection-source option. `Related` is order/behavior driven, so on a low-order store it returns sparse, asymmetric results and Packages never surface on sticker PDPs. Use `Complementary` with products curated in the Shopify Search & Discovery app.

Setup (order matters — configure the app first, or the block renders empty):

1. Install **Shopify Search & Discovery** (free, first-party) from the Shopify App Store.
2. Search & Discovery -> **Product recommendations** -> for each of the 5 products, add the 4 Complementary products below.
3. Theme Editor -> Product template -> "You may also like" block -> change the source dropdown from `Related` to `Complementary`. Keep Max products: 4.

Complementary mapping (4 per product, order = SOT product order, self excluded):

| Product page | Complementary products (in order) |
|--------------|-----------------------------------|
| Face Sticker | Full Body Sticker, Shape Sticker, Package Mini, Package Full |
| Full Body Sticker | Face Sticker, Shape Sticker, Package Mini, Package Full |
| Shape Sticker | Face Sticker, Full Body Sticker, Package Mini, Package Full |
| Package Mini | Face Sticker, Full Body Sticker, Shape Sticker, Package Full |
| Package Full | Face Sticker, Full Body Sticker, Shape Sticker, Package Mini |

The `Photo Sheets` collection is required for the collection page, home featured collection, and nav, but is not the recommendation source.

## Batch 7 Checkpoint

- [ ] All 5 product URLs render.
- [ ] Non-Package PDP shows Size / Material / Photos to include.
- [ ] Package PDP shows Material and tier upload blocks.
- [ ] Easify block appears before buy buttons.
- [ ] You may also like shows 4 Complementary products both ways (sticker PDP -> Packages, Package PDP -> stickers).
- [ ] No old product names, letter size labels, or internal photo-count labels remain.
