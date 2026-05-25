# Stage 1I + Stage 4 — Policies (정책 페이지 본문)

Shopify 어드민 → Settings → Policies 에 4개 페이지로 등록. Refund / Shipping 은 made-to-order 운영 반영해서 직접 작성. Privacy / Terms 는 Shopify "Generate from template" 사용하고 사업장 정보만 채우면 됨 (PIPEDA / 토론토 관할 호환).

본문은 Stage 1I 진입 시 그대로 붙여넣음. 한국어 footer 를 함께 붙이는 경우 [`footer_copy.md`](footer_copy.md) 의 해당 정책 섹션을 같은 본문 마지막에 추가한다.

대괄호 `[…]` 는 placeholder — 사용자 사업체 정보로 교체 후 publish.

---

## 1. Refund Policy

```
Last updated: [YYYY-MM-DD]

Every Everstory Studio order is made to order. Each sticker sheet is custom designed and hand cut as soon as your order arrives. To keep our turnaround fast, we begin work within one business day. Please review this policy carefully before ordering.

CANCELLATION

You can cancel for a full refund any time before we begin printing — typically within one business day of your order. Email studio.everstory@gmail.com as soon as possible.

Once printing starts, the order cannot be refunded. The work is yours.

ORDER DETAILS YOU PROVIDE

At checkout, you upload your photograph(s) and share details that matter — name for the header, any specific request (a face we should not crop, a tone you prefer, a detail we should keep crisp). The more specific your notes, the closer the result matches your expectation. We work directly from what you provide; we do not send a mockup for approval.

If your photograph genuinely cannot be used (too low resolution, too blurry to cut around), we will email you before we begin. In that case you can replace the photo or cancel for a full refund.

PRINT DEFECTS

If your sheet arrives with a print or cutting defect — visible color shift, lamination flaws, misaligned cuts, or visible damage — we will reprint and reship at no cost. Email us within 7 days of delivery with a photo of the issue at studio.everstory@gmail.com.

PHOTO QUALITY & PERSONAL PREFERENCE

We use the photograph you upload, with our standard background removal and color correction, and we apply the details you share at checkout. We cannot refund or reprint based on personal preference about how the photo turned out — the order notes at checkout are your moment to be specific.

AGE & SAFETY

Everstory sticker sheets are decorative photo products, not a toy and not a children's product. They are not suitable for children under 3 (choking hazard from small peelable die-cut parts) and require adult supervision for any child under 14. Even when the photograph features a child, the finished sheet is intended for adult handling. Damage or injury caused by use outside this guidance is not eligible for refund or reprint.

LOST IN TRANSIT

Canada Post lettermail does not include tracking. If your sheet has not arrived 14 business days after shipping confirmation, email us. We will reprint and reship one replacement at no cost. Lost replacements are evaluated case by case.

LOCAL PICKUP

If you selected Local Pickup, we email you to arrange a pickup location and time once your order is ready. Pickup is held for 30 days from that email. Orders not picked up within 30 days are not refunded but can still be claimed.

CONTACT

studio.everstory@gmail.com
Everstory Studio
[Toronto address]
```

---

## 2. Shipping Policy

```
Last updated: [YYYY-MM-DD]

WHERE WE SHIP

Everstory Studio currently ships across Canada and offers local pickup by arrangement for nearby customers in the Toronto area. International orders (US, Korea, etc.) are not supported at this time but can be evaluated case by case.

DELIVERY OPTIONS

1. Free shipping across Canada
   Canada Post lettermail. No tracking number. Delivery typically arrives 3–7 business days after shipping confirmation (longer for remote areas), but lettermail timing varies.

2. Local pickup (by arrangement)
   Free, for nearby customers. We email you after production to arrange a pickup location and time. Pickup window is 30 days from that email.

LEAD TIME

- Print and cut: 1–3 business days after your order
- Ship: same or next business day after cut
- Total time from order to shipped: typically 2–5 business days

We begin production within one business day of your order. If your photograph needs replacement before we can cut around it, we will email you before we start.

LOST OR DELAYED PACKAGES

Lettermail does not include tracking. If 14 business days have passed since your shipping confirmation and your order has not arrived, email studio.everstory@gmail.com. We will reprint and reship one replacement at no cost.

INTERNATIONAL ORDERS

Our checkout currently accepts Canadian addresses only. For international orders (US, Korea, etc.), message us at studio.everstory@gmail.com — we evaluate exceptions case by case.

CONTACT

studio.everstory@gmail.com
Everstory Studio
[Toronto address]
```

---

## 3. Privacy Policy

Shopify 어드민 → Settings → Policies → Privacy → **"Generate from template"** 클릭. 자동 생성된 본문은 PIPEDA 호환. 다음 항목만 교체:

- `[STORE NAME]` → `Everstory Studio`
- `[STORE EMAIL]` → `studio.everstory@gmail.com`
- `[STORE ADDRESS]` → 토론토 사업장 주소
- `[BUSINESS NUMBER]` → HST/GST 번호
- `[JURISDICTION]` → `Ontario, Canada`

자동 생성문은 Shopify Admin · Customer · Apps 데이터 흐름 모두 커버. 추가 본문 없이 publish.

→ **Stage 1I 액션**: 클릭 → 5개 placeholder 교체 → Save → Add to footer.

---

## 4. Terms of Service

Shopify "Generate from template" 사용. 동일 5개 placeholder 교체.

추가 조항 1개 — 자동 템플릿에 없는 made-to-order 보호:

> SECTION X — MADE-TO-ORDER PRODUCTS
>
> All Everstory Studio products are made to order based on customer-supplied images and inputs. By placing an order, you grant Everstory Studio a limited license to reproduce your uploaded images solely for the purpose of fulfilling your order. You confirm that you own or have permission to use any images you upload. Production begins within one business day of your order; once printing begins, the order is non-cancellable except as set out in our Refund Policy.

→ **Stage 1I 액션**: Generate from template → placeholder 교체 → 위 SECTION X 를 "Limitation of liability" 직전에 삽입 → Save.

---

## 5. Contact information

Shopify 어드민 → Settings → Policies → Contact information:

```
Everstory Studio
[Toronto address]
studio.everstory@gmail.com
HST/GST: [번호]
```

footer 자동 노출. 추가 작업 없음.

---

## 한국어 Footer 적용

정책 페이지에 한국어 안내를 붙일 때는 [`footer_copy.md`](footer_copy.md) 의 Refund / Shipping / Privacy / Terms 섹션을 같은 Shopify policy body 마지막에 추가한다. 영어 정책 본문이 기준이고, 한국어 footer 는 고객 이해를 돕는 요약이다.

별도 페이지인 [`pages_copy.md`](pages_copy.md) 의 Contact 페이지 (`/pages/contact`) 에는 [`footer_copy.md`](footer_copy.md) 의 Contact 섹션을 같은 방식으로 admin body 마지막에 추가한다.
