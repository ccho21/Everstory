# Copy — 상품 2종 (2026-09-19)

이 문서는 [`../business/cutover_runbook.md`](../business/cutover_runbook.md) 가 라이브에 넣을 **문장의 정본**이다. 배경은 [`../business/lineup_restructure.md`](../business/lineup_restructure.md) §2026-09-19 확정.
컷오버 뒤 확정 문구는 [`product_descriptions.md`](product_descriptions.md) 로 옮긴다. 이 문서의 팩 4종 전신은 [`copy_rework_packs.md`](copy_rework_packs.md)(직관성 장치 4개는 그대로 유효).

> **적용 범위:** 아래 문장은 두 상품 개편의 정본이다. 상품별 사진 안내·제작 방식·입력 위치는 Draft 테마에 맞춘다. 상품 제목·가격·메타필드·SEO 및 Easify 저장값은 컷오버 때 별도로 반영한다. 실물 개수·정책 결정은 [`../business/pending.md`](../business/pending.md)에 남긴다.

## 지킨 규칙

- **구매 영역 eyebrow 는 공통 설명** `Photo sticker sheet · Made in Toronto`. 바로 아래 상품명이 두 상품을 구분한다. Story의 eyebrow는 상품 라벨을 유지한다. 태그라인(MADE TO KEEP)은 상품 페이지에 안 쓴다.
- **스티커 개수는 실측 뒤에만.** "about 24" 는 200시트 시뮬(24.0장)이고, 실물 1장을 재단해 센 값으로 바꾼다. 실측 전에 게시하면 숫자 없는 대체 문장을 쓴다(아래 표시).
- **NAME은 후보 5–7장 중 스튜디오가 최종 5장을 선택**한다. 못 쓰는 사진은 다른 적합한 업로드로 대체하고, 5장을 만들 수 없으면 인쇄 전에 이메일한다. Custom은 선택한 수만 업로드하고, 못 쓰는 사진이 있으면 인쇄 전에 이메일한다. "Fewer is fine — we repeat favourites"는 사용하지 않는다.
- NAME 이름 안내는 **A–Z와 공백만**, 대문자로 새김, 공백 = 줄바꿈. 폼 도움말과 Name tip에 표시하고, 규칙 밖 입력은 인테이크 notes에서 확인한다. 이 안내를 Custom의 이름 정책으로 확대하지 않는다.
- **이름은 선택이다 (2026-09-24 사용자 결정).** Easify `Name style` 에 `No name` 을 고르면 Name 칸이 숨고 시트는 사진만 채운다(데코·말풍선 없음, 같은 가격). 이름을 말하는 문장은 `with or without their name` · `if you like` 로 쓰고, 이름이 늘 들어가는 것처럼 쓰지 않는다. 상품명은 나중에 `Photo Sticker Sheet` 로 바꿀 예정 — handle·리다이렉트·리뷰·인테이크를 따로 본다.
- 영어 단일. 개수·크기 비유는 실측 없이 쓰지 않는다. Materials / Care / Lead time / Safety 공용 섹션은 손대지 않는다.
- `product_intro` 는 rich text JSON, `product_story_html` 은 정적 HTML + 절대 URL (metafield 안 Liquid 는 실행 안 됨).

## 1. Name & Photo Sticker Sheet

| 칸 | 값 |
|---|---|
| Title | `Name & Photo Sticker Sheet` |
| Handle | `name-photo-sticker-sheet` |
| Tags | `a5, photo-sticker, sheet, name-sticker` |
| 가격 | $24.99 CAD (Material 4종, 단일 가격) |
| `card_subtitle` | `5 photos, with or without their name, cut and ready to peel` |
| descriptionHtml | `<p>Five of your photos as die-cut stickers on one A5 sheet — with their name and a few small extras, or just the photos. You pick the material; we choose every size, crop and position and lay the sheet out by hand.</p>` |
| SEO title (45자) | `Name & Photo Sticker Sheet | Everstory Studio` |
| SEO description (153자 · 09-24 라이브) | `Send us five photos, and a name if you like. We cut them into a full A5 sheet of custom stickers, laid out by hand in Toronto. Free Canada-wide shipping.` |
| SEO description — 개수 실측 뒤 (154자) | `Send us five photos, and a name if you like. We cut them into a sheet of about 24 custom stickers, laid out by hand in Toronto. Free Canada-wide shipping.` |

### Story block — `custom.product_story_html`

> *Name & photo sticker sheet*
> ## Their name, their photos.
> Upload 5–7 photos, and the name you want on the sheet if you'd like one. We choose five photos, trace each by hand and choose its size and crop. With a name, we letter it in the style you picked and fill the gaps with a few small extras; without one, we fill the sheet with more of your photos. The layout is ours; the photos and the name are yours.

대안 헤드라인: `Five photos and their name.` · `Their name, kept.` (Face 의 "Their face, kept." 와 짝 — 다만 사진이 주인공이라 두 번째 안은 약하다).

```html
<div class="es-pdp" lang="en">
  <div class="es-page es-page--intro">
    <section class="es-section" aria-label="Product introduction">
      <div class="es-section-shell">
        <div class="heading-block">
          <span class="es-eyebrow">Name &amp; photo sticker sheet</span>
          <h2>Their name, their photos.</h2>
        </div>

        <p class="copy">
          Upload 5–7 photos, and the name you want on the sheet if you'd like one. We choose five photos, trace each by hand and choose its size and crop. With a name, we letter it in the style you picked and fill the gaps with a few small extras; without one, we fill the sheet with more of your photos.
          The layout is ours; the photos and the name are yours.
        </p>
      </div>
    </section>
  </div>
</div>
```

### What you get — `custom.product_intro`

> - A full A5 sheet of stickers, cut and ready to peel
> - Five of your photos, each at the size that suits it — 0.75″ to 2.5″
> - Their name in Retro or Bubble letters, each letter its own sticker — or choose No name for a sheet of just photos
> - With a name, a few small decorative stickers fill the gaps
> - Your name and the order date along the top of the sheet
> - Hand-refined and precision-cut in Toronto
>
> **Name tip**
> A to Z and spaces, up to 24 letters. A space starts a new line, so MIA ROSE comes out as two lines.
>
> **Best for**
> Kids, pets, couples, and gifts. The sizes are mixed, so one sheet covers a planner, a phone, a bottle and a laptop.

- 09-25 8줄 → 6줄 (UX 검토): 사진 규칙(Your photos 안내에 있음)·배치 설명(상품 설명에 있음)을 빼고, 헤더 줄은 `Their name`(스티커)과 헷갈리지 않게 `along the top of the sheet`. Name tip 은 폼 안내와 겹치는 No name 문장을 뺌(No name 은 버튼으로 보인다).
- 첫 줄의 스티커 개수(about 24)는 실측 뒤에만 넣는다.

```json
{"type": "root", "children": [{"type": "list", "listType": "unordered", "children": [{"type": "list-item", "children": [{"type": "text", "value": "A full A5 sheet of stickers, cut and ready to peel"}]}, {"type": "list-item", "children": [{"type": "text", "value": "Five of your photos, each at the size that suits it — 0.75″ to 2.5″"}]}, {"type": "list-item", "children": [{"type": "text", "value": "Their name in Retro or Bubble letters, each letter its own sticker — or choose No name for a sheet of just photos"}]}, {"type": "list-item", "children": [{"type": "text", "value": "With a name, a few small decorative stickers fill the gaps"}]}, {"type": "list-item", "children": [{"type": "text", "value": "Your name and the order date along the top of the sheet"}]}, {"type": "list-item", "children": [{"type": "text", "value": "Hand-refined and precision-cut in Toronto"}]}]}, {"type": "heading", "level": 5, "children": [{"type": "text", "value": "Name tip"}]}, {"type": "paragraph", "children": [{"type": "text", "value": "A to Z and spaces, up to 24 letters. A space starts a new line, so MIA ROSE comes out as two lines."}]}, {"type": "heading", "level": 5, "children": [{"type": "text", "value": "Best for"}]}, {"type": "paragraph", "children": [{"type": "text", "value": "Kids, pets, couples, and gifts. The sizes are mixed, so one sheet covers a planner, a phone, a bottle and a laptop."}]}]}
```

### 구매 박스 · 폼 문장

| 자리 | 문장 |
|---|---|
| 구매 박스 소재 사진 아래 (`es-pack-note.liquid`, 팩) | (없음) — 09-24 네 문단을 `All four are laminated and waterproof.` 한 줄로 줄였다가 09-25 그 줄도 뺌(사용자 "필요 없음"). 소재 차이는 비교 사진·Materials 접이식이 말한다 |
| Easify `Name style` 도움말 (첫 칸 · 값 `Retro`* · `Bubble` · `No name`) | `Retro — chunky block letters. Bubble — soft rounded letters. Each letter is its own sticker. No name — the sheet is all photos.` |
| Easify `Name` 도움말 (Name style 이 No name 이 아닐 때만 보임) | `Capital letters A–Z. A space starts a new line.` |
| Easify `Your photos` 도움말 | `Upload 5–7. We pick the best five and email you only if we need another.` |
| Easify `Extra sheets` 도움말 | `The same sheet, printed again.` |
| `es-how-to-order` (팩) | (없음) — 09-24 한 줄 `We make it.` 로 줄였다가 09-25 약속 상자(`es-required-gate`) 셋째 줄 **We make it** `Traced and laid out by hand, precision-cut and packed in Toronto.` 로 옮김(Made-right promise·Clear delivery timing 과 같은 모양) |
| 카트 줄 요약 (`es-cart-line`, 두 상품 · 09-25) | 속성 목록 대신: `HARIN · Bubble letters` / `No name — photos only` / Custom `Name: …` · `5 photos uploaded` (Custom `3 photos on the sheet · 3 uploaded`) · `Crop: Round` · `+1 extra sheet` · `Note: …`(70자). 주문 속성은 그대로 |
| 개인정보 안내 (`es-required-gate`, 두 상품 공통) | **Your photos stay private** `— used only for your order, never shared without your consent, and deleted within 90 days of fulfillment.` + `Privacy policy` 링크 (09-24 상자 → 한 줄) |
| 장바구니 버튼 바로 아래 (`es-required-gate`, 두 상품 공통 · 필수 칸이 비었을 때만, 클레이색) | `Add a name and your photos to continue.` · No name 이면 `Add your photos to continue.` (09-25 — 전 `Please complete: Name *, Your photos *`) |
| 수량 칸 · Shop Pay(Buy it now) 버튼 | 두 상품 모두 숨김 (09-25). 같은 시트를 더 받는 길은 Extra sheets 하나 — 수량 2 는 같은 디자인에 정가 두 번이었다. Shop Pay 는 결제 단계에서 그대로 |

## 2. Custom Sticker Sheet

| 칸 | 값 |
|---|---|
| Title | `Custom Sticker Sheet` |
| Handle | `custom-sticker-sheet` |
| Tags | `a5, photo-sticker, custom` |
| 가격 | from $18.99 CAD (Size 6택 × Material 4종 · Easify `Photos to include` +$3/장) |
| `card_subtitle` | `You choose the size, the crop and the photos` |
| descriptionHtml | `<p>Die-cut stickers of your photos on an A5 sheet, your way: choose the size, how many photos, and how we crop them. We trace each one by hand and pack the sheet.</p>` |
| SEO title (39자) | `Custom Sticker Sheet | Everstory Studio` |
| SEO description (148자) | `Custom photo stickers on an A5 sheet. Choose the size, crop and photo count. Traced by hand and precision-cut in Toronto. Free Canada-wide shipping.` |

부제에 크기만 쓰지 않는다 — 크기만 커스텀하는 상품이 아니라서 이름에서 `Size` 를 뺐다(사용자, 09-19). 크기·크롭·사진 셋을 나란히 둔다.

### Story block — `custom.product_story_html`

> *Custom sticker sheet*
> ## You choose. We cut.
> Pick the size, from 0.75″ to 2.5″, and how many photos. Tell us how to crop them — face and shoulders, full body, a round frame — or leave that to us. We trace each photo by hand, cut it with a clean white edge, and pack the sheet as full as the size allows.

사진 두 장(폰 케이스·노트북)은 Face Sticker 의 것을 그대로 쓴다 — 같은 물건이다. alt 만 바꿨다.
대안 헤드라인: `Your photo, your way.` · `Made to your measure.`

```html
<div class="es-pdp" lang="en">
  <div class="es-page es-page--intro">
    <section class="es-section" aria-label="Product introduction">
      <div class="es-section-shell">
        <div class="heading-block">
          <span class="es-eyebrow">Custom sticker sheet</span>
          <h2>You choose. We cut.</h2>
        </div>

         <div class="photo-pair">
          <div class="photo-frame">
            <img src="https://cdn.shopify.com/s/files/1/0833/4760/3712/files/face_post_3.png" alt="Custom photo sticker on a phone case">
          </div>
          <div class="photo-frame">
            <img src="https://cdn.shopify.com/s/files/1/0833/4760/3712/files/face_post_4.png" alt="Custom photo sticker on a laptop">
          </div>
        </div>

        <p class="copy">
          Pick the size, from 0.75″ to 2.5″, and how many photos. Tell us how to crop them — face and shoulders, full body, a round frame — or leave that to us.
          We trace each photo by hand, cut it with a clean white edge, and pack the sheet as full as the size allows.
        </p>
      </div>
    </section>
  </div>
</div>
```

### What you get — `custom.product_intro`

> - One A5 sheet, packed as full as your size allows
> - One size per sheet, 0.75″ to 2.5″ by the longest edge — you pick it
> - As many different photos as the size allows — up to 13 at 0.75″, down to 1 at 2.5″; each photo after the first adds $3
> - Crop your way — face and shoulders, full body, or a round frame — or leave it to us
> - Hair, ears and paws traced by hand, with a clean white edge on every sticker
> - Your name and the order date printed on the sheet header
> - Hand-refined and precision-cut in Toronto
>
> **Photo tip**
> Choose a photo where the subject is sharp, well lit and fully visible — not covered by hair, hands or shadow. For a full-body crop, keep the whole figure inside the frame.
>
> **Best for**
> When you already know the size: a planner full of one face, a laptop-size portrait, a strip of the dog for the water bottle. Kids, pets, portraits and outfits.

- "each photo after the first adds $3" 는 Easify `Photos to include`(+$3/장) 그대로다. **값 개수는 사이즈마다 다르다** — 0.75″ 13 · 1″ 10 · 1.25″ 5 · 1.5″ 3 · 2″ 3 · 2.5″ 1 (시트 슬롯 수 기준 auto-cap, 의도된 설계). "1 to 13" 이라고 쓰면 틀린다.
- `Mixed` 사이즈가 빠졌으므로 "one size per sheet" 라고 말할 수 있다.

```json
{"type": "root", "children": [{"type": "list", "listType": "unordered", "children": [{"type": "list-item", "children": [{"type": "text", "value": "One A5 sheet, packed as full as your size allows"}]}, {"type": "list-item", "children": [{"type": "text", "value": "One size per sheet, 0.75″ to 2.5″ by the longest edge — you pick it"}]}, {"type": "list-item", "children": [{"type": "text", "value": "As many different photos as the size allows — up to 13 at 0.75″, down to 1 at 2.5″; each photo after the first adds $3"}]}, {"type": "list-item", "children": [{"type": "text", "value": "Crop your way — face and shoulders, full body, or a round frame — or leave it to us"}]}, {"type": "list-item", "children": [{"type": "text", "value": "Hair, ears and paws traced by hand, with a clean white edge on every sticker"}]}, {"type": "list-item", "children": [{"type": "text", "value": "Your name and the order date printed on the sheet header"}]}, {"type": "list-item", "children": [{"type": "text", "value": "Hand-refined and precision-cut in Toronto"}]}]}, {"type": "heading", "level": 5, "children": [{"type": "text", "value": "Photo tip"}]}, {"type": "paragraph", "children": [{"type": "text", "value": "Choose a photo where the subject is sharp, well lit and fully visible — not covered by hair, hands or shadow. For a full-body crop, keep the whole figure inside the frame."}]}, {"type": "heading", "level": 5, "children": [{"type": "text", "value": "Best for"}]}, {"type": "paragraph", "children": [{"type": "text", "value": "When you already know the size: a planner full of one face, a laptop-size portrait, a strip of the dog for the water bottle. Kids, pets, portraits and outfits."}]}]}
```

### 폼 문장 (Easify 세트 B)

| 자리 | 문장 |
|---|---|
| `Your photos` 도움말 | `Upload the number of photos you chose. If one can't be cut cleanly we'll email you before printing.` |
| `Crop preference (optional)` | 값: `Studio's choice` (기본) · `Face & shoulders` · `Full body` · `Round`. 도움말: `Leave it to us, or tell us how to crop. Round is the safe choice for busy backgrounds.` |

## 3. Draft 테마 공통 문장

작업 대상은 `Copy of everstory-theme/main` (`165897306368`)이었다 — 09-22 컷오버로 라이브, 09-24 아래 값을 라이브 기준으로 갱신. 테마 문장과 공유 상품 데이터는 따로 적용한다. 홈은 Package Full·Face의 두 카드로 구성하며, 아래 최종 상품명·가격·부제는 상품 데이터 컷오버 후 표시된다. 라이브 전환 절차는 런북을 따른다.

| 위치 | 문장 |
|---|---|
| 홈 How it works 01 | `For a Name & Photo Sticker Sheet, upload 5–7 photos and add a name if you like; we choose the final five. For a Custom Sticker Sheet, choose one size and a photo count within that size's limit, then upload the number you chose.` |
| How to order 02 — NAME | (09-24 뺌 — 팩은 03 한 줄만. 사진 안내는 Easify `Your photos` 도움말이 한다) |
| How to order 02 — Custom | `Upload the number of photos you chose. If one cannot be used, we email you before printing. Add any details in Special instructions.` |
| How to order 03 | `Traced and laid out by hand, precision-cut and packed in Toronto. Ships in 2–5 business days, free across Canada.` (Custom · 팩은 배송 문장 없이) |
| 컬렉션 설명 (`collection.json`) | `A5 die-cut sheets, hand-refined and precision-cut in our Toronto studio. The Name & Photo Sticker Sheet takes five photos, and a name if you like; we mix the sizes and lay it out. Choose the Custom Sticker Sheet if you would rather pick one size, the crop and how many photos yourself.` |
| Custom 상품 크기 안내 끝 (`es-pdp-general`) | `Want the sizes mixed instead? That is the Name & Photo Sticker Sheet — five photos (and a name, if you like), sized and laid out by us on one sheet.` |
| 사진 검토 — 개인정보 안내 아래 공통 | (09-24 뺌 — 개인정보 안내를 한 줄로 줄이며) · 상품별 사진 대체는 Easify 도움말과 What you'll get에서 설명 |
| What you'll get — NAME 사진 대체 | `We use another suitable photo from your uploads. If we cannot make the final set of five, we email before printing.` |
| What you'll get — Custom 사진 대체 | `We email you before printing so you can send a replacement.` |
| Custom 크롭 | `Choose a crop in Crop preference: Studio's choice, Face & shoulders, Full body or Round. Use Special instructions for any extra details.` |
| 크롭 예외 | 기존 `silhouette only` 요청 시 원형으로 바꾸기 전 이메일 약속과 NAME의 가장 크게 인쇄할 사진 요청 안내는 유지. 드롭다운과 메모의 우선순위는 별도 결정 전 지정하지 않는다. |
| 흐린 사진 alt | `Example of a blurry photo with an unclear subject` |
| 흐린 사진 캡션 — NAME / Custom | `Blurry or shaky photo · we use another suitable upload or email if needed` / `Blurry or shaky photo · we email you before printing` |
| PDP 크기 표 | `25 mm` — 검증되지 않은 `most popular` 표현은 사용하지 않는다. |
| About·FAQ | [`pages_copy.md`](pages_copy.md)의 상품 페이지 `Special instructions` 안내를 페이지와 FAQ 구조화 데이터에 함께 반영한다. |

## 4. 확정 전 확인

1. **스티커 개수** — 실물 1장 재단 후 §1 첫 줄·SEO description 의 24 를 실측값으로.
2. **Easify `Name` 입력 제한** — A–Z·공백만 받도록 (정규식 지원 여부 확인). 안 되면 도움말과 Name tip 만으로 가고, 어긋난 주문은 인테이크 notes 로 잡는다.
3. **헤드라인 두 개** — 대안 중 고르기.
4. **가격 문장** — Custom 의 "+$3" 는 Easify 값이 정본. 컷오버 창에서 한 번 더 대조.
