# Everstory — Storefront Spec

> Shopify MVP 11 페이지의 *제목·H1·subtitle·primary CTA* 명세. 본문 카피는 Phase C 에서 작성 (`docs/shopify/voice.md` 규칙 적용). photography 슬롯은 `docs/shopify/photography.md` 의 출력 스펙 참조.

페이지 acceptance gate (모든 페이지 공통): ① 모바일 반응형 ② SEO meta (title / description / og:image) ③ 접근성 contrast 4.5:1.

---

## C.1 Home — `/`

| 슬롯 | 값 |
|------|-----|
| `title` (browser tab) | `Everstory Studio — Photo stickers, made in Toronto` |
| `meta.description` | `A5 die-cut photo sticker sheets, traced and finished by hand. Order with a photo, approve a mockup, made in Toronto.` |
| Hero H1 | (display serif, large) `Photographs, kept by hand.` (placeholder, Phase C 확정) |
| Hero subtitle | (body, 1줄) Toronto 시작 + die-cut sheet 핵심 한 줄 |
| Hero primary CTA | `Shop the lookbook` → `/collections/all` |
| Hero secondary | `How it works` → 같은 페이지 #how anchor |
| Sections | Hero / How it works (3-step) / SKU 4 카드 / Why Everstory (3-4 카드) / Toronto block / Footer |
| og:image | `home_hero.jpg` (16:9) |

## C.2 Product — Solo `/products/solo`

| 슬롯 | 값 |
|------|-----|
| `title` | `Solo — 1 design, A5 sheet · Everstory Studio` |
| `meta.description` | `One design, multiple stickers per sheet. Pick a size, send a photo, approve the mockup.` |
| H1 | `Solo` |
| Subtitle | `1 design · A5 sheet` |
| Price | `$15.99 CAD` |
| 주요 변형 | Size dropdown (XS/S/M/L/XL/XXL/Mixed default S) · Material dropdown (White/Pearl Grey/Silver/Gold) |
| Line item properties | Photo upload slot 1 (required) · Pet/person name slot 1 · Optional notes |
| CTA | `Add to cart` (black 버튼) |
| Sections | Hero gallery / Title-price-variants / What you'll get / Photo guidelines / Materials |

## C.3 Product — Duo `/products/duo`

| 슬롯 | 값 |
|------|-----|
| `title` | `Duo — 2 designs, A5 sheet · Everstory Studio` |
| `meta.description` | `Two designs on one A5 sheet. The hero pair pack.` |
| H1 | `Duo` |
| Subtitle | `2 designs · A5 sheet` |
| Price | `$18.99 CAD` |
| Line item properties | Photo slot 1-2 (required) · Name slot 1-2 · Optional notes |
| 나머지 | Solo 와 동일 구조, 슬롯만 2개 |

## C.4 Product — Trio `/products/trio`

| 슬롯 | 값 |
|------|-----|
| `title` | `Trio — 3 designs, A5 sheet · Everstory Studio` |
| H1 | `Trio` |
| Subtitle | `3 designs · A5 sheet` |
| Price | `$21.99 CAD` |
| Line item properties | Photo slot 1-3 · Name slot 1-3 · Optional notes |

## C.5 Product — Memory Pack `/products/memory-pack`

| 슬롯 | 값 |
|------|-----|
| `title` | `Memory Pack — 4 designs, 2 sheets · Everstory Studio` |
| `meta.description` | `Four designs across two A5 sheets. The full archive.` |
| H1 | `Memory Pack` |
| Subtitle | `4 designs · 2 sheets` |
| Price | `$28.99 CAD` |
| Line item properties | Photo slot 1-4 · Name slot 1-4 · Optional notes |
| 추가 카피 | "Need more than 4 designs? Order Memory Pack again — we'll batch them." (Open Decision #3, MVP 4 고정) |

## C.6 About — `/pages/about`

| 슬롯 | 값 |
|------|-----|
| `title` | `About · Everstory Studio` |
| `meta.description` | `Made in Toronto. Photographs traced and finished by hand. Korean inkjet papers we trust.` |
| H1 | (display serif, large) `Made to keep, in Toronto.` |
| Hero subtitle | (1줄) studio + Toronto + craft 핵심 |
| og:image | `about_hero.jpg` (21:9, studio wide shot) |
| Sections | Hero / Story (1단락 토론토 + 1단락 craft + 1단락 Korean papers) / 차별화 5축 카드 / Process strip 5단계 |

## C.7 Shipping & Pickup — `/pages/shipping`

| 슬롯 | 값 |
|------|-----|
| `title` | `Shipping & Pickup · Everstory Studio` |
| `meta.description` | `GTA pickup available. Canada Post 7-10 business days after mockup approval.` |
| H1 | `Shipping & Pickup` |
| Sections | GTA pickup 1 카드 / Canada Post 1 카드 / 일정 표 (mockup 3d + 제작 2d + 배송 2-5d) / 해외 배송 미지원 안내 |

## C.8 Refund Policy — `/pages/refund`

| 슬롯 | 값 |
|------|-----|
| `title` | `Refund Policy · Everstory Studio` |
| `meta.description` | `Refund and replacement policy for custom photo sticker orders.` |
| H1 | `Refund Policy` |
| Sections | 모크업 승인 전 = full refund / 승인 후 = no refund (custom) / 결함·배송 사고 = replacement or refund / contact 라인 |

## C.9 FAQ — `/pages/faq`

| 슬롯 | 값 |
|------|-----|
| `title` | `FAQ · Everstory Studio` |
| `meta.description` | `Common questions about Everstory orders — timeline, photos, sizes, pickup.` |
| H1 | `Frequently Asked` |
| 항목 | 약 10개 Q&A — 워크플로 / 사진 품질 / 일정 / 사이즈 / 픽업 / 다회 주문 / 한글 가능 / 펫 외 사진 / 배송 추적 / 환불 |

## C.10 Privacy Policy — `/pages/privacy`

| 슬롯 | 값 |
|------|-----|
| `title` | `Privacy Policy · Everstory Studio` |
| `meta.description` | `How Everstory handles your photos, orders, and personal data.` |
| H1 | `Privacy Policy` |
| 베이스 | Shopify 기본 generator + 톤 다듬기 |
| 핵심 추가 | 사진 / 주문 데이터 보관 기간 명시. PIPEDA + GDPR 수용 톤. |

## C.11 Terms of Service — `/pages/terms`

| 슬롯 | 값 |
|------|-----|
| `title` | `Terms of Service · Everstory Studio` |
| `meta.description` | `Terms governing Everstory custom orders and mockup approval.` |
| H1 | `Terms of Service` |
| 베이스 | Shopify 기본 generator + 톤 다듬기 |
| 핵심 추가 | 커스텀 상품 / 모크업 승인 / 환불 조건 명시. |

---

## Global elements

### Header
- 좌측: 워드마크 — MVP 는 `assets/online_logo.png` (2048×2048 RGBA, retina 충분) 직접 사용. SVG 변환 (`assets/wordmark.svg`) 은 Illustrator 수동 작업으로 분리 (Open Decision 추가).
- 우측: nav `Shop` / `About` / `FAQ` + cart icon
- 메뉴 스타일: lower-case + tracking +0.05em + Avenir Next Bold 14px

### Footer
- 1줄 태그라인 (`MADE TO KEEP | MOMENTS THAT MATTER`, display serif large)
- 주소 (Toronto), 이메일, Instagram 링크
- 정책 페이지 4 링크 (Shipping / Refund / Privacy / Terms)
- © Everstory Studio {year}

### Cart drawer
- Shopify 기본 cart drawer 사용. 라인 아이템에 attached photo 파일명 + customer name 표시.

---

## Mockup PDF Footer Copy

(별도 산출물, web 사이트 외) — 모크업 PDF 하단 footer 카피. 사이즈 use-case 한 줄 (예: `Your stickers are 1″ — perfect for diaries, planners, phone cases`). Phase D 에서 product page 카피와 함께 작성.

## Instagram Tone Board

Phase 2 (MVP 이후). 사용자 결정 #12 — 가이드 범위 Web 전용 MVP. discovery 채널 정착하면 별도 가이드 추가.

## Email Templates

(별도 산출물, web 사이트 외) — Phase D.1 의 Order Confirmation 추가 단락만 본 MVP 에 포함. 별도 mockup ready / shipping ready 이메일은 Phase 2.

---

## 변경 이력

- **2026-05-07** — v1 초안. TODO 채움. 11 페이지 명세 (이전 9p → Privacy + Terms 추가, ADR-0006 검토 결과). 본문 카피는 Phase C 에서.
