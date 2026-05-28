# Batch 3 — Admin Content Data

Shopify admin에 5개 product, `Photo Sheets` collection, page content, navigation을 등록한다.

- **Previous batch**: `02_shopify_settings_ops.md`
- **Next batch**: `04_easify_options.md`
- **SOT**: [`../product_descriptions.md`](../product_descriptions.md), [`../pages_copy.md`](../pages_copy.md), [`../footer_copy.md`](../footer_copy.md)

## Step 3.1 — Products

Create all products as `Draft`. Sales channels = Online Store + discovery/funnel channels (see [`../product_descriptions.md`](../product_descriptions.md) Shopify Admin Notes). Track quantity = off. Continue selling = on. Product type = `Sticker Sheet`. Vendor = `Everstory Studio`.

### Non-Package Products

Create these three products with native Shopify variants.

| Product | Handle | Base price | SKU prefix | Tags |
|---------|--------|------------|------------|------|
| Face Sticker | `face-sticker` | $18.99 CAD | `EVS-FACE` | `a5`, `face`, `photo-sticker` |
| Full Body Sticker | `full-body-sticker` | $18.99 CAD | `EVS-FULLBODY` | `a5`, `full-body`, `photo-sticker` |
| Shape Sticker | `shape-sticker` | $18.99 CAD | `EVS-SHAPE` | `a5`, `photo-sticker`, `shape` |

Native Shopify variant options — **Size × Material only**. `Photos to include` is an Easify dropdown add-on, not a native variant (see [`04_easify_options.md`](04_easify_options.md)).

| Option | Values |
|--------|--------|
| Size | `0.75" / 19mm`, `1" / 25mm`, `1.25" / 32mm`, `1.5" / 38mm`, `2" / 51mm`, `2.5" / 64mm`, `Mixed` |
| Material | `White Matte`, `Translucent`, `Silver`, `Gold` |

Checkpoint: each non-Package product has **28 native variants** (7 sizes × 4 materials).

Pricing: every native variant uses the base price **$18.99 CAD**. The per-photo charge is added by the Easify `Photos to include` dropdown (**+$3 CAD per extra photo**, `$18.99 + (N − 1) × $3`) — configure in [`04_easify_options.md`](04_easify_options.md). Pricing SOT: [`../product_descriptions.md`](../product_descriptions.md).

Default first variant: `1" / 25mm` + `White Matte`.

### Package Products

Create these two products with Material as the only Shopify variant option.

| Product | Handle | Price | Weight | Tags |
|---------|--------|-------|--------|------|
| Package Mini | `package-mini` | $24.99 CAD | 100 g | `a5`, `curated-pack`, `package`, `package-mini`, `photo-sticker` |
| Package Full | `package-full` | $34.99 CAD | 100 g | `a5`, `curated-pack`, `package`, `package-full`, `photo-sticker` |

Variant option:

| Option | Values |
|--------|--------|
| Material | `White Matte`, `Translucent`, `Silver`, `Gold` |

Checkpoint: each Package product has **4 variants**, all at the product's fixed price.

## Step 3.2 — Product Descriptions and SEO

For each product:

1. Paste its product-specific description from [`../product_descriptions.md`](../product_descriptions.md).
2. Add the Common Sections from the same file.
3. Add the Product Description Korean footer from [`../footer_copy.md`](../footer_copy.md).
4. Set SEO title to `{Product name} | Everstory Studio`.
5. Set SEO description per product from the SEO description table in [`../product_descriptions.md`](../product_descriptions.md) (shipping is Canada-wide, not Ontario).

## Step 3.3 — Collection

Create manual collection:

| Field | Value |
|-------|-------|
| Title | `Photo Sheets` |
| Handle | `photo-sheets` |
| Description | `A5 custom photo sticker sheets, hand cut in Toronto.` |
| Products | Face Sticker, Full Body Sticker, Shape Sticker, Package Mini, Package Full |
| Sort | Manual, in the product order above |
| SEO title | `Photo Sheets | Everstory Studio` |
| SEO description | `Face, full body, shape, and curated package photo sticker sheets made in Toronto.` |

## Step 3.4 — Pages

Create pages from [`../pages_copy.md`](../pages_copy.md):

| Page | Handle | Theme template |
|------|--------|----------------|
| About Everstory Studio | `about` | `page` (default) |
| Frequently Asked Questions | `faq` | `page` (default) |
| Sticker Size Guide | `sizing-guide` | `page` (default) |
| Material Guide | `materials-guide` | `page` (default) |
| Contact Everstory Studio | `contact` | `page.contact` (Horizon default — includes `contact-form` section) |

For the Contact page, set the body to the Contact section from [`../pages_copy.md`](../pages_copy.md) and append the Contact Korean footer from [`../footer_copy.md`](../footer_copy.md). The `contact-form` section is rendered by the `page.contact` template, so the body text appears above the form.

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
| Shape Sticker | `/products/shape-sticker` |
| Package Mini | `/products/package-mini` |
| Package Full | `/products/package-full` |

Footer · Help:

| Label | Link |
|-------|------|
| Shipping & Pickup | `/policies/shipping-policy` |
| Refund Policy | `/policies/refund-policy` |
| FAQ | `/pages/faq` |
| Contact | `/pages/contact` |

Footer · Brand:

| Label | Link |
|-------|------|
| About | `/pages/about` |
| Privacy | `/policies/privacy-policy` |
| Terms | `/policies/terms-of-service` |
| Sizing guide | `/pages/sizing-guide` |

## Batch 3 Checkpoint

- [ ] 5 products are Draft.
- [ ] Non-Package products have 28 native variants each (Size × Material; `Photos to include` is an Easify add-on).
- [ ] Package products have Material-only variants.
- [ ] `Photo Sheets` collection contains 5 products.
- [ ] 4 menus created — Main menu + Footer · Shop / Footer · Help / Footer · Brand — using the new product names and handles.
