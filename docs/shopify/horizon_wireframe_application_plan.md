# Horizon Wireframe Application Plan

This document maps the Shopify docs and wireframes to Horizon theme setup for the current 5-product launch.

## Product Model

| Product | Handle | PDP type |
|---------|--------|----------|
| Face Sticker | `/products/face-sticker` | Non-Package |
| Full Body Sticker | `/products/full-body-sticker` | Non-Package |
| Circle Sticker | `/products/circle-sticker` | Non-Package |
| Package Mini | `/products/package-mini` | Package |
| Package Full | `/products/package-full` | Package |

Collection: `/collections/photo-sheets`.

## Theme Mapping

| Source | Target |
|--------|--------|
| `wireframes/home.html` | Home template |
| `wireframes/collection.html` | Collection template |
| `wireframes/product-face-sticker.html` | Non-Package PDP reference |
| `wireframes/product-package-mini.html` | Package PDP reference |
| `product_descriptions.md` | Product description copy |
| `instructions/04_easify_options.md` | Upload app fields |

## Product Template Requirements

- Non-Package PDP shows Size, Material, Photos to include, then Easify upload.
- Package PDP shows Material, then Big / Medium / Small print upload fields.
- Size labels are inch / mm only.
- Footer and recommendations use the 5 product names.

## Rollout Batches

1. Admin data: create products, collection, pages, navigation.
2. Easify: create upload option sets.
3. Theme: set up home, collection, product template, pages.
4. QA: test non-Package and Package checkout paths.

## Open Items

- Confirm Easify conditional logic behavior for matching upload count to `Photos to include`.
- Confirm final image assets for the 5 product cards.
