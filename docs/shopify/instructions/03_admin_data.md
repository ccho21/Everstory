# Batch 3 — Admin Content Data

Shopify admin에 5개 product, `Photo Sheets` collection, page content, navigation을 등록한다.

- **Previous batch**: `02_shopify_settings_ops.md`
- **Next batch**: `04_easify_options.md`
- **SOT**: [`../product_descriptions.md`](../product_descriptions.md), [`../pages_copy.md`](../pages_copy.md), [`../footer_copy.md`](../footer_copy.md)

## Step 3.1 — Products

Create all products as `Draft`. Sales channel = Online Store only. Track quantity = off. Continue selling = on. Product type = `Sticker Sheet`. Vendor = `Everstory Studio`.

### Non-Package Products

Create these three products with native Shopify variants.

| Product | Handle | Base price | SKU prefix | Tags |
|---------|--------|------------|------------|------|
| Face Sticker | `face-sticker` | $15.99 CAD | `EVS-FACE` | `face-sticker`, `name-included`, `a5`, `made-to-order` |
| Full Body Sticker | `full-body-sticker` | $15.99 CAD | `EVS-FULLBODY` | `full-body-sticker`, `name-included`, `a5`, `made-to-order` |
| Circle Sticker | `circle-sticker` | $15.99 CAD | `EVS-CIRCLE` | `circle-sticker`, `name-included`, `a5`, `made-to-order` |

Variant options:

| Option | Values |
|--------|--------|
| Size | `0.75" / 19mm`, `1" / 25mm`, `1.25" / 32mm`, `1.5" / 38mm`, `1.75" / 45mm`, `2.5" / 64mm` |
| Material | `White Matte`, `Pearl Grey`, `Silver`, `Gold` |
| Photos to include | `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `13` |

Checkpoint: each non-Package product has **312 variants**.

Variant pricing:

| Photos to include | Price |
|-------------------|-------|
| 1 | $15.99 CAD |
| 2 | $18.99 CAD |
| 3 | $21.99 CAD |
| 4 | $24.99 CAD |
| 5 | $27.99 CAD |
| 6 | $30.99 CAD |
| 7 | $33.99 CAD |
| 8 | $36.99 CAD |
| 9 | $39.99 CAD |
| 10 | $42.99 CAD |
| 11 | $45.99 CAD |
| 12 | $48.99 CAD |
| 13 | $51.99 CAD |

Default first variant: `1" / 25mm` + `White Matte` + `1`.

### Package Products

Create these two products with Material as the only Shopify variant option.

| Product | Handle | Price | Weight | Tags |
|---------|--------|-------|--------|------|
| Package Mini | `package-mini` | $24.99 CAD | 100 g | `package-mini`, `curated-package`, `a5`, `made-to-order`, `two-sheet` |
| Package Full | `package-full` | $32.99 CAD | 150 g | `package-full`, `curated-package`, `a5`, `made-to-order`, `three-sheet` |

Variant option:

| Option | Values |
|--------|--------|
| Material | `White Matte`, `Pearl Grey`, `Silver`, `Gold` |

Checkpoint: each Package product has **4 variants**, all at the product's fixed price.

## Step 3.2 — Product Descriptions and SEO

For each product:

1. Paste its product-specific description from [`../product_descriptions.md`](../product_descriptions.md).
2. Add the Common Sections from the same file.
3. Add the Product Description Korean footer from [`../footer_copy.md`](../footer_copy.md).
4. Set SEO title to `{Product name} | Everstory Studio`.
5. Set SEO description to `Hand-cut photo sticker sheets, made to order in Toronto. Korean premium substrates, fast turnaround, free Ontario shipping.`

## Step 3.3 — Collection

Create manual collection:

| Field | Value |
|-------|-------|
| Title | `Photo Sheets` |
| Handle | `photo-sheets` |
| Description | `A5 custom photo sticker sheets, hand cut in Toronto.` |
| Products | Face Sticker, Full Body Sticker, Circle Sticker, Package Mini, Package Full |
| Sort | Manual, in the product order above |
| SEO title | `Photo Sheets | Everstory Studio` |
| SEO description | `Face, full body, circle, and curated package photo sticker sheets made in Toronto.` |

## Step 3.4 — Pages

Create pages from [`../pages_copy.md`](../pages_copy.md):

| Page | Handle |
|------|--------|
| About Everstory Studio | `about` |
| Frequently Asked Questions | `faq` |
| Sticker Size Guide | `sizing-guide` |
| Material Guide | `materials-guide` |

Policy pages continue to use [`../policies.md`](../policies.md).

## Step 3.5 — Navigation

Create four menus. The three footer menus feed the Batch 5 footer 4-column layout (Shop / Help / Brand / Newsletter) and the Batch 8 footer link checks.

Main menu:

| Label | Link |
|-------|------|
| Shop | Collection: Photo Sheets |
| About | `/pages/about` |
| FAQ | `/pages/faq` |

Footer · Shop:

| Label | Link |
|-------|------|
| Face Sticker | `/products/face-sticker` |
| Full Body Sticker | `/products/full-body-sticker` |
| Circle Sticker | `/products/circle-sticker` |
| Package Mini | `/products/package-mini` |
| Package Full | `/products/package-full` |

Footer · Help:

| Label | Link |
|-------|------|
| Shipping & Pickup | `/policies/shipping-policy` |
| Refund Policy | `/policies/refund-policy` |
| FAQ | `/pages/faq` |
| Contact | `mailto:[orders@everstory-domain.com]` |

Footer · Brand:

| Label | Link |
|-------|------|
| About | `/pages/about` |
| Privacy | `/policies/privacy-policy` |
| Terms | `/policies/terms-of-service` |
| Sizing guide | `/pages/sizing-guide` |

## Batch 3 Checkpoint

- [ ] 5 products are Draft.
- [ ] Non-Package products have 312 variants each.
- [ ] Package products have Material-only variants.
- [ ] `Photo Sheets` collection contains 5 products.
- [ ] 4 menus created — Main menu + Footer · Shop / Footer · Help / Footer · Brand — using the new product names and handles.
