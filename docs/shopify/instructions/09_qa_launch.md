# Batch 9 — QA and Launch

Final QA before Shopify launch.

## URLs

Check:

- `/`
- `/collections/photo-sheets`
- `/products/face-sticker`
- `/products/full-body-sticker`
- `/products/shape-sticker`
- `/products/package-mini`
- `/products/package-full`
- `/pages/about`
- `/pages/faq`
- `/pages/sizing-guide`
- `/pages/materials-guide`

## Product QA

Non-Package product path:

1. Open `/products/face-sticker`.
2. Select `1" / 25mm`, `White Matte`, `Photos to include = 2`.
3. Confirm price = `$18.99 CAD`.
4. Upload 2 photos in Easify.
5. Add Header name and Order notes.
6. Add to cart.
7. Confirm line item includes Size, Material, Photos to include, uploaded files, Header name, Order notes.

Package product path:

1. Open `/products/package-mini`.
2. Select material.
3. Upload Big print photos, Medium print photos, Small print photos.
4. Confirm price = `$24.99 CAD`.
5. Add to cart.
6. Confirm line item includes all three tier upload properties.

Failure checks:

- Missing required photo upload blocks should block add to cart.
- Canada-wide shipping should show free lettermail (test with postal codes from multiple provinces).
- Local Pickup should be available (selecting it triggers an arrangement email, not an automatic address share).
- International (non-Canada) should be blocked or clearly unavailable for MVP.

## Content QA

- [ ] 5 products visible in collection.
- [ ] Size labels use inch / mm only.
- [ ] `Photos to include` is used instead of internal design language.
- [ ] Package pages explain Studio picks the final photos.
- [ ] Crop decision copy appears on PDP or product description.
- [ ] Korean footer copy appears where required.

## Launch Toggle

When QA passes:

1. Set 5 products from Draft to Active.
2. Confirm Online Store channel enabled.
3. Place one final test order.
4. Refund/cancel test order if needed.
