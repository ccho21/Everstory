# Stage 1I + Stage 4 — Policies (정책 페이지 본문)

Shopify 어드민 → Settings → Policies 에 4개 페이지로 등록. Refund / Shipping 은 made-to-order 운영 반영해서 직접 작성. Privacy / Terms 는 Shopify "Generate from template" 사용하고 사업장 정보만 채우면 됨 (PIPEDA / 토론토 관할 호환).

본문은 Stage 1I 진입 시 그대로 붙여넣음. 한국어 footer 추가는 한국 사용자 비중 검토 후 Stage 5 에서 결정.

대괄호 `[…]` 는 placeholder — 사용자 사업체 정보로 교체 후 publish.

---

## 1. Refund Policy

```
Last updated: [YYYY-MM-DD]

Every Everstory Studio order is made to order. Each sticker sheet is custom designed and hand cut as soon as your order arrives. To keep our turnaround fast, we begin work within one business day. Please review this policy carefully before ordering.

CANCELLATION

You can cancel for a full refund any time before we begin printing — typically within one business day of your order. Email [orders@everstory-domain.com] as soon as possible.

Once printing starts, the order cannot be refunded. The work is yours.

ORDER DETAILS YOU PROVIDE

At checkout, you upload your photograph(s) and share details that matter — name for the header, any specific request (a face we should not crop, a tone you prefer, a detail we should keep crisp). The more specific your notes, the closer the result matches your expectation. We work directly from what you provide; we do not send a mockup for approval.

If your photograph genuinely cannot be used (too low resolution, too blurry to cut around), we will email you before we begin. In that case you can replace the photo or cancel for a full refund.

PRINT DEFECTS

If your sheet arrives with a print or cutting defect — visible color shift, lamination flaws, misaligned cuts, or visible damage — we will reprint and reship at no cost. Email us within 7 days of delivery with a photo of the issue at [orders@everstory-domain.com].

PHOTO QUALITY & PERSONAL PREFERENCE

We use the photograph you upload, with our standard background removal and color correction, and we apply the details you share at checkout. We cannot refund or reprint based on personal preference about how the photo turned out — the order notes at checkout are your moment to be specific.

LOST IN TRANSIT

Canada Post lettermail does not include tracking. If your sheet has not arrived 14 business days after shipping confirmation, email us. We will reprint and reship one replacement at no cost. Lost replacements are evaluated case by case.

LOCAL PICKUP

If you selected Toronto Studio Pickup, your order is held for 30 days from the "ready for pickup" email. Orders not picked up within 30 days are not refunded but can still be claimed.

CONTACT

[orders@everstory-domain.com]
Everstory Studio
[Toronto address]
```

---

## 2. Shipping Policy

```
Last updated: [YYYY-MM-DD]

WHERE WE SHIP

Everstory Studio currently ships within Ontario, Canada, and offers local pickup at our Toronto studio. We do not ship outside Ontario at this time. Future regions will be announced as we grow.

DELIVERY OPTIONS

1. Free shipping across Ontario
   Canada Post lettermail. No tracking number. Delivery typically arrives 3–7 business days after shipping confirmation, but lettermail timing varies.

2. Local pickup at Toronto Studio
   Free. Address shared in your "ready for pickup" email. Pickup window is 30 days from the ready-for-pickup notification.

LEAD TIME

- Print and cut: 1–3 business days after your order
- Ship: same or next business day after cut
- Total time from order to shipped: typically 2–5 business days

We begin production within one business day of your order. If your photograph needs replacement before we can cut around it, we will email you before we start.

LOST OR DELAYED PACKAGES

Lettermail does not include tracking. If 14 business days have passed since your shipping confirmation and your order has not arrived, email [orders@everstory-domain.com]. We will reprint and reship one replacement at no cost.

ORDERS OUTSIDE ONTARIO

Our checkout will not accept addresses outside Ontario at this time. If you are outside Ontario and want to order, message us at [orders@everstory-domain.com] — we evaluate exceptions case by case.

CONTACT

[orders@everstory-domain.com]
Everstory Studio
[Toronto address]
```

---

## 3. Privacy Policy

Shopify 어드민 → Settings → Policies → Privacy → **"Generate from template"** 클릭. 자동 생성된 본문은 PIPEDA 호환. 다음 항목만 교체:

- `[STORE NAME]` → `Everstory Studio`
- `[STORE EMAIL]` → `[orders@everstory-domain.com]`
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
[orders@everstory-domain.com]
HST/GST: [번호]
```

footer 자동 노출. 추가 작업 없음.

---

## 한국어 footer (선택, Stage 5 이후 결정)

한인 디아스포라 사용자가 영어 정책에 익숙하지 않은 경우 대비 — 각 정책 본문 마지막에 한국어 요약 4-5줄 추가 가능. 1차 launch 는 영어 단일 (`docs/business/brand_identity.md` Web Extensions §Hangul fallback `미설정. 영어 단일 정책` 일치).

만약 추가한다면 핵심 4줄:
- 환불: 인쇄 시작 전 (보통 주문 후 1영업일 이내) 환불 가능, 인쇄 결함 시 100% 재제작
- 배송: 온타리오 무료, 토론토 픽업 가능
- 분실: 14영업일 미수령 시 1회 무상 재제작
- 문의: [한국어 가능 이메일]

이 추가는 한인 커뮤니티 첫 포스팅 (`business_strategy.md:168`) 직전에 결정.
