# Special Day — Easify option set

Product: **Special Day Sticker Sheet** (`special-day-sticker-sheet`, Draft, Product 10220556288256) · Variants: **Design** (Photo sticker / Ring badge) × **Material** (4).
Written 2026-10-13 from the live Name & Photo set (767342) so the field types, file formats and wording match. The **internal name** of every field becomes the order property key that `intake.py` reads — type it exactly.
`intake.py` already reads these keys (2026-10-13): `Message` / `Top line` / `Bottom line` → `job.special_day`, `Name` → `job.sticker_name`, `Your photos` → photos, `Extra sheets` → `job.extra_sheets`. The order board then opens the order on **Special Day** with the design, words and 1.5″ filled in (`scripts/order_intake/README.md`).

> ⚠️ Before you start
> - The Special Day product is still **Draft**, so nothing here is visible to customers until it is published.
> - If you duplicate the Name & Photo set, change **Apply to** to *Special Day Sticker Sheet only* **first**, before editing fields. Otherwise Name & Photo shows two sets while you work (the Draft twin trap from 2026-09-22).
> - The Name & Photo `Name` field has a condition on the Name style buttons. If you keep that field, replace its condition (step 3).

## Set

| Setting | Value |
|---|---|
| Option set name | `Special Day — upload` |
| Apply to | Special Day Sticker Sheet only |

## Fields, top to bottom

### 1. Your photos — always shown

| Setting | Value |
|---|---|
| Type | File upload |
| Label | `Your photos` |
| Internal name | `Your photos` |
| Required | Yes |
| Files | min **1**, max **3** |
| Max file size | 100 MB |
| File extensions | `png,jpg,jpeg,heic,heif,tiff,tif` |
| Help text | `Upload 1–3. We repeat them across the sheet and email you only if one can't be used.` |

### 2. Message — Photo sticker only

| Setting | Value |
|---|---|
| Type | Text box |
| Label | `Message` |
| Internal name | `Message` |
| Required | Yes |
| Characters | min 1, max **24** |
| Letter case | None |
| Placeholder | `e.g. Thanks for coming!` |
| Help text | `Printed under the photo, before the name. Short is best — it's small.` |
| Condition | Show when **Variant contains** `Photo sticker` |

### 3. Name — Photo sticker only

| Setting | Value |
|---|---|
| Type | Text box |
| Label | `Name (optional)` |
| Internal name | `Name` |
| Required | No |
| Characters | min 0, max **10** |
| Letter case | None (keep *Harin*, not *HARIN*) |
| Exclude | Numbers, Special characters |
| Placeholder | `e.g. Harin` |
| Help text | `Added after your message: Thanks for coming! – Harin` |
| Condition | Show when **Variant contains** `Photo sticker` |

### 4. Top line — Ring badge only

| Setting | Value |
|---|---|
| Type | Text box |
| Label | `Top line` |
| Internal name | `Top line` |
| Required | Yes |
| Characters | min 1, max **23** |
| Letter case | Uppercase |
| Placeholder | `e.g. HARIN'S 2ND BIRTHDAY` |
| Help text | `Printed in capitals around the top of the ring.` |
| Condition | Show when **Variant contains** `Ring badge` |

### 5. Bottom line — Ring badge only

| Setting | Value |
|---|---|
| Type | Text box |
| Label | `Bottom line (optional)` |
| Internal name | `Bottom line` |
| Required | No |
| Characters | min 0, max **15** |
| Letter case | Uppercase |
| Placeholder | `e.g. 2026.08.23` |
| Help text | `Printed around the bottom of the ring — a date works well.` |
| Condition | Show when **Variant contains** `Ring badge` |

### 6. Extra sheets — always shown (same as Name & Photo)

| Setting | Value |
|---|---|
| Type | Dropdown |
| Label / Internal name | `Extra sheets` / `Extra sheets` |
| Required | No |
| Choices | `No extra print` (default, +$0) · `Add 1 extra print` +$7 · `Add 2 extra print` +$14 … `Add 10 extra print` +$70 |
| Help text | `The same sheet again, $7 each.` |

### 7. Special instructions — always shown

| Setting | Value |
|---|---|
| Type | Text area |
| Label | `Special instructions (optional)` |
| Internal name | `special_instruction` |
| Required | No |
| Characters | max 500 |
| Help text | `Anything we should know: who is in each photo, or a frame colour you'd like.` |

## Why these limits

- **Message 24 + Name 10:** the photo sticker prints the message and name on one line at 1.5″. Measured with Fredoka Medium: *Thanks for coming! – Harin* = 7.1 pt (the sample photo), *Thanks for celebrating! – Harin* = 6.3 pt. At the full 24 + 10 it stays near 5 pt, the board's legibility warning line.
- **Top 23 / Bottom 15:** the ring arc fits about 23 characters on top and 15 underneath before the text starts to shrink (Everstory_ring.jsx, same at every size).
- **1–3 photos:** the sheet has twelve stickers; photos repeat across it.

## Status

**Created 2026-10-13 as set `824979`** (Claude via Chrome, owner approved Save). Storefront check the same day: assigned to Special Day only (Name & Photo 767342 and Custom 767314 unchanged, `option_set_count` 3); all seven fields, internal names, limits, letter case, exclusions, conditions and the Extra sheets prices match this page. Draft preview: Photo sticker shows Message/Name, Ring badge shows Top line/Bottom line; Add to cart stays disabled with "Add your photos and Top line to continue."; Top line forces capitals and stops at 23. Photo upload tested the same evening with the gallery mockup (no customer photo): the CDN URL lands in `properties[Your photos]`, Add to cart unlocks once Message is filled, and the captured `/cart/add.js` payload (blocked before it reached the cart, cart stayed empty) carries `Your photos` · `Message` · `Name` · `Extra sheets` on variant `EVS-SDAY-PHOTO-WM`. Fed through `intake.py` it gives *Special Day 사진 스티커 · 1.5" · 문구 'Thanks for coming!' · 이름 'Mia'* with no notes.

Editor traps met on the way:
- **Custom file extensions is a tag field.** Type one extension, press Enter, repeat. Pasting `png,jpg,…` shows the text but saves nothing (`file_extension` came back empty on the first save).
- The condition source is called **Shopify Variant**, not "Variant".
- Choosing **Select all products** would put this set on every product — the newest set wins ("Each product uses one active option set").

## When you have saved

Tell Claude. The storefront page carries every Easify set, so Claude checks from there, without logging in:
- the set is assigned to Special Day only (and Name & Photo still has only its own set),
- the seven fields, internal names, limits and conditions match this page,
- on the Draft preview, choosing *Ring badge* swaps Message/Name for Top line/Bottom line, and Add to cart stays blocked until the required fields are filled.

| Problem | Fix |
|---|---|
| Name & Photo shows two sets | The copy is still applied to Name & Photo — set **Apply to** to Special Day only |
| A field shows for both designs | Its condition is missing — add *Variant contains Photo sticker / Ring badge* |
| The order shows `File upload-1` instead of `Your photos` | The internal name was not changed — edit it to `Your photos` |
