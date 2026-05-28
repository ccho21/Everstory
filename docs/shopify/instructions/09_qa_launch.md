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

---

## Live Audit Coverage (verified 2026-05-28)

SOT docs reconciled against the live store. Legend: ✅ live matches docs · 🔧 gap found, docs updated · 🔒 not visible via Admin API (UI-only).

| # | Area | Live state | Result |
|---|------|-----------|--------|
| 1 | Non-Package base price | $18.99 CAD (free shipping baked in) | 🔧 docs $15.99 → $18.99 |
| 2 | Package prices | Mini $24.99 / Full $34.99 | ✅ |
| 3 | Variant model | Non-Pkg = Size × Material (28); Pkg = Material (4); `Photos to include` = Easify dropdown add-on (+$3/photo) | 🔧 dropped 312-variant model |
| 4 | "Mixed" size | option kept, same price | ✅ |
| 5 | Tags | reconciled to live (removed `name-included`, `curated-pack`, etc.) | 🔧 |
| 6 | Shipping | Domestic (Canada) / Standard $0.00 free / shipsToCountries = [CA] | ✅ |
| 7 | Taxes | taxesIncluded=false, taxShipping=false; GST/HST registration confirmed | ✅ |
| 8 | Markets | single market Canada (primary/active), no international | ✅ |
| 9 | Theme | MAIN `everstory-theme/main` = Horizon v3.5.1 (Dawn/Horizon unpublished backups) | ✅ |
| 10 | Home page | `product-list` section (collection = all, max 4) surfaces the 4 active products | ✅ |
| 11 | PDP metafields | all 4 active products have custom.product_intro / product_desc / product_story_html / card_subtitle + global SEO; is_package on Packages only | ✅ data present |
| 12 | materials-guide handle | live handle typo fixed + redirect | 🔧 |
| 13 | Sales channels | Online Store + Shop / POS / Facebook & Instagram / Google & YouTube (funnel model) | 🔧 "Online Store only" reconciled |
| 14 | Easify config | not exposed via Admin API | 🔒 UI-only |

## Open / To Verify

Complements the functional QA above — does not duplicate it.

### UI-only (not visible via Admin API)

- [ ] Easify option sets: `Photos to include` 1–13, +$3/photo add-on, multi-file upload
- [ ] Easify Package tiers: Mini (3/3/4), Full (5/5/7) max-file caps
- [ ] Easify app block placed below variant pickers / above Buy button (Batch 4.5)
- [ ] Theme actually renders PDP metafields (intro / desc / story / card_subtitle) — data confirmed present
- [ ] Live PDP price updates on `Photos to include` change ($18.99 + (N − 1) × $3)

### Contradictions / decisions needed

- [ ] Local pickup: live `localPickupSettingsV2 = null` (no checkout pickup option) — conflicts with the "Local Pickup should be available" check in §Product QA above and `../../business/business.md` §Shipping And Pickup. Decide: manual "by arrangement" (no Shopify option) vs enable Toronto pickup.
- [ ] Product status drift: docs say "Draft until launch" / "5 products Draft" but live = 4 active / 1 draft (Shape). The §Launch Toggle step above ("Set 5 products from Draft to Active") is partly done (4/5). Reconcile docs/step to reality.
- [ ] Payments: settings_checklist noted PayPal-only default with Shopify Payments inactive (no Apple / Google / Shop Pay). Verify Shopify Payments is activated.

### API-checkable — audited 2026-05-28

- [x] Inventory: fixed 2026-05-28 — tracking turned OFF on all 92 variants (5 products). `tracksInventory=false`, made-to-order never blocks checkout. Matches SOT "Track quantity = off".
- [x] Footer / nav menus: Main (Shop·About·FAQ·Contact), Help, Brand, Shop menus all populated. The default `footer` menu is empty but unused (Horizon footer columns use Shop/Help/Brand). Minor drift below.
- [x] Pages: about · faq · materials-guide · contact (page.contact) · shipping-pickup · refund-policy — all published with dedicated templates. `sizing-guide` intentionally absent (WIP).
- [x] `Photo Sheets` collection: 5 products present. ⚠️ sort = BEST_SELLING, not Manual (drift below).
- [x] Policy pages: Contact info, Privacy, Refund, Shipping, Terms all published and non-empty.
- [x] Full Body PDP images: resolved — 4 styled images (full_body_post_1/2/5/4), no `material_guide_white.jpg`.

### Found during audit (2026-05-28)

- [x] Inventory: RESOLVED 2026-05-28 — untracked all variants live (`tracked=false`); now matches the documented track-off / made-to-order intent ([03_admin_data.md](03_admin_data.md)).
- [ ] Collection sort drift: `Photo Sheets` is BEST_SELLING; SOT §3.3 (03_admin_data.md) says Manual in a fixed order.
- [ ] Menu drift vs SOT §3.5: Help links go to `/pages/shipping-pickup` & `/pages/refund-policy` (not `/policies/...`); Brand has no "Sizing guide" item (sizing-guide page is WIP); Main has an extra "Contact"; Shop lists 4 products (Shape excluded as draft).

### On hold — Shape Sticker (DRAFT)

- [ ] Shape SEO description still copies Full Body's text → rewrite
- [ ] Shape hero / story images (raw `001_man_face.png`, placeholder divs)
- [ ] Shape Draft → Active toggle when ready
