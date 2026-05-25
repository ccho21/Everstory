# Shopify Settings Checklist

Shopify admin Stage 1 (1A–1J) 입력값. 어드민 → Settings 경로 따라가면서 한 칸씩 채우면 됨. 검증 칸은 입력 후 즉시 확인.

브랜드 표기는 `docs/design/brand.md` 와 `docs/business/business.md` 기준으로 **Everstory Studio** 단일.

---

## 1A. General — `Settings → General`

| 필드 | 입력값 |
|------|--------|
| Store name | `Everstory Studio` |
| Store contact email | `(사용자 입력)` — 본인 메인 이메일. Shopify 시스템 알림 수신용 |
| Sender email | `orders@{도메인}` — 도메인 연결됨 (2026-05-07 확인). 정확한 도메인으로 교체 |
| Industry | `Arts & Crafts` |
| Currency | `Canadian Dollar (CAD)` — **lock**, 변경 후 매출 발생하면 변경 불가 |
| Time zone | `(GMT-05:00) Eastern Time (US & Canada)` |
| Unit system | `Metric` (mm 기반 운영) |
| Default weight unit | `g` |
| Order ID prefix | `EVS-` (옵션, 추적 편의) |
| Order ID suffix | (비움) |
| Business address | 토론토 작업실 주소. 부가가치세·배송 출발지·정책 페이지 footer 에 사용 |
| Legal business name | `(사용자 입력)` — 사업자등록명 (HST 등록 시 사용한 이름) |
| Business registration number | `(HST/GST 번호)` |

**검증**: 모든 필드 채워짐. Currency 가 CAD 인지 재확인 (이후 변경 불가).

---

## 1B. Locations — `Settings → Locations`

| 필드 | 값 |
|------|------|
| Location name | `Toronto Studio` |
| Address | 1A Business address 와 동일 |
| Fulfill online orders | ✅ on |
| Sell from this location | ✅ on |
| Default location | ✅ |

비고: 픽업 옵션은 별도 location 이 아니라 1E Shipping 의 "Local pickup" 으로 처리.

**검증**: Locations 화면에 Toronto Studio 1개만 노출.

---

## 1C. Markets — `Settings → Markets`

| 항목 | 값 |
|------|-----|
| Primary market | `Canada` |
| Currency | CAD (1A 와 동일, 자동) |
| Domain / subfolder | (도메인 연결 후 단일 도메인) |
| 다른 country | **모두 비활성화 / 삭제** — International 시장 끄기 |
| Language | `English` (기본). Korean 추가는 Stage 5 이후 결정 |

**검증**: Markets 화면에 Canada (Active) 만 표시, 다른 항목 inactive 또는 없음.

---

## 1D. Payments — `Settings → Payments` ⭐ 다음 핵심 액션

**현재 상태** (2026-05-07): PayPal 만 default 노출, Shopify Payments 미활성. → Apple Pay / Google Pay / Shop Pay 미노출의 원인.

### Shopify Payments 활성화 (캐나다 merchant — Stripe 백엔드, 거래 수수료 0%)

어드민 → Settings → Payments → **"Activate Shopify Payments"** 클릭.

| 입력 항목 | 값 |
|-----------|-----|
| Business type | `Individual` 또는 `Sole proprietorship` (사용자 사업 형태) |
| Business details | 1A 사업자 정보 동일 |
| Banking | 캐나다 은행 계좌 (transit number 5자리 / institution 3자리 / account 7-12자리) |
| Statement descriptor | `EVERSTORY STUDIO` (카드 명세서 표기, 22자 제한) |
| 2-step verification | 활성화 권장 (보안) |

활성화 직후 다음이 **자동 노출** (별도 설정 없이):
- ✅ Visa / Mastercard / Amex / Discover (카드)
- ✅ **Apple Pay** (iPhone / Mac Safari)
- ✅ **Google Pay** (Android / Chrome)
- ✅ **Shop Pay** (Shopify 자체 1-tap, conversion +50%)

### PayPal — 유지 권장

이미 default 활성화 상태. 한인 디아스포라 + 펫맘 시장에서 PayPal 익숙도 높음 → **유지**.

### 검증 시퀀스

1. Settings → Payments 페이지 → Shopify Payments 가 "Active" 상태 표시
2. 어드민 상단 "View store" → 임시 상품 1개 결제 페이지 진입
3. 결제 옵션에 다음 모두 노출 확인:
   - Card form (number / expiry / CVV)
   - "Buy with Apple Pay" 버튼 (iOS Safari 에서)
   - "Buy with Shop Pay" 버튼
   - "PayPal" 옵션
4. Test mode on → 테스트 카드 `4242 4242 4242 4242` (만료 미래 / CVV 임의) 로 가짜 결제 1건 통과
5. 어드민 → Orders 에 test order 표시 확인

### 트러블슈팅

- "Apple Pay verification" 메시지 → 도메인 verify 필요. Settings → Payments → Apple Pay → "Verify your domain" 클릭. 자동 처리.
- 캐나다 은행 계좌 미보유 → Wise (구 TransferWise) 캐나다 계좌 또는 신규 사업자 계좌 발급 필요. CIBC / RBC / TD 등 무료 small business account 옵션.

---

## 1E. Shipping & Delivery — `Settings → Shipping and delivery`

현재 launch 기준은 **Canada-wide free shipping + Local Pickup (by arrangement)**. Shopify Basic 에서는 Canada zone 1개와 local pickup 으로 처리한다.

### Shipping profile: General

**Zone 1: Canada-wide Free Shipping**
| 필드 | 값 |
|------|------|
| Zone name | `Canada-wide Free Shipping` |
| Countries / regions | Canada → **모든 provinces / territories** |
| Rate name | `Free shipping (lettermail)` |
| Price | `$0.00` |
| Conditions | None (모든 주문 free) |

**Zone 2: Local Pickup**
| 필드 | 값 |
|------|------|
| Pickup name | `Local Pickup` |
| Location | Toronto (1B, 도시·우편번호 단위) |
| Estimated pickup time | `Ready in 3-5 business days` |
| Order processing instructions | `You will receive an email after production to arrange a pickup location and time` |

**Zone 3: Rest of World** — 만들지 않음. zone 매칭 실패 → checkout 에서 "We do not ship to your address" 자동 표시.

**검증**:
- 토론토 postal code (`M5V 3A8`) 결제 → Free shipping 통과
- 밴쿠버 postal code (`V6B 1A1`) 결제 → "shipping not available" 차단
- 픽업 옵션 선택 → 무료 픽업 노출

---

## 1F. Taxes & Duties — `Settings → Taxes and duties`

| 항목 | 값 |
|------|------|
| Tax inclusive pricing | ❌ off (캐나다 표준 — 표시가 + 세금 별도) |
| Canada → Tax registration | HST/GST 번호 등록 (CRA 발급 9자리 + RT0001) |
| Region | `Ontario` |
| Auto-calculate tax | ✅ on (Ontario HST 13% 자동 적용) |
| Charge tax on shipping rates | ✅ on (Ontario HST 적용 대상) |
| Digital goods | N/A |

**검증**: Toronto postal code 로 test order → 결제 화면에 `HST 13% — $X.XX` 라인 표시.

---

## 1G. Checkout — `Settings → Checkout`

| 항목 | 값 |
|------|------|
| Customer accounts | `Optional` (게스트 + 가입 모두 허용) |
| Customer information at checkout | Phone 은 optional, Email required |
| Marketing options | `Email subscription` 체크박스 unchecked by default (PIPEDA 준수) |
| Cart type | `Drawer` (페이지 이탈 감소) |
| Tipping | ❌ off (스티커 상품에 부적절) |
| Abandoned checkout | Send 1 hour after, 6 hours after, 24 hours after — 기본값 유지 |
| Order processing | Automatically fulfill the order's line items = ❌ off (made-to-order, 수동 fulfill) |
| Order status page | Additional scripts = (비움, Stage 5 이후) |

**검증**: 게스트로 결제 흐름 통과. abandoned checkout 이메일 templates 활성화 표시.

---

## 1H. Notifications — `Settings → Notifications`

| Template | 활성화 | 비고 |
|----------|--------|------|
| Order confirmation | ✅ | 기본 텍스트 사용 (Stage 5 에서 디자인) |
| Order canceled | ✅ | 기본 |
| Order refund | ✅ | 기본 |
| Order edited | ✅ | 기본 |
| Shipping confirmation | ✅ | 기본 |
| Shipping update | ✅ | 기본 |
| Order fulfilled | ✅ | 기본 |
| Out for delivery | ✅ | 기본 |
| Delivered | ✅ | 기본 |
| Pickup ready | ✅ | "Your order is ready. Please reply and we'll arrange a pickup location and time." |
| Pickup confirmation | ✅ | 기본 |
| Customer account invite | ✅ | 기본 |
| Customer account welcome | ✅ | 기본 |
| Sender email | `orders@{도메인}` |
| Sender name | `Everstory Studio` |

**검증**: Test order 후 confirmation 이메일 수신.

---

## 1I. Policies — `Settings → Policies`

정책 본문은 [`policies.md`](policies.md) 기준으로 Stage 1I 에서 publish 한다. Privacy / Terms 는 Shopify 자동 생성 템플릿을 사용하되 placeholder 와 made-to-order 조항을 보강한다.

| Page | 액션 | 검증 |
|------|------|------|
| Refund policy | [`policies.md`](policies.md) §1 붙여넣기 | made-to-order, no mockup approval, print defect reprint 기준 포함 |
| Shipping policy | [`policies.md`](policies.md) §2 붙여넣기 | Canada-wide free shipping, Local Pickup (by arrangement), 2-5 business days to shipped 포함 |
| Privacy policy | Shopify template 생성 → 5개 placeholder 교체 | PIPEDA, photo use, business info placeholder 없음 |
| Terms of service | Shopify template 생성 → 5개 placeholder 교체 → made-to-order 조항 삽입 | customer-supplied image license, Ontario jurisdiction 포함 |
| Contact information | 사업자 이메일·주소·HST/GST 입력 | footer 자동 링크 노출 |

**검증**: 4개 페이지 published. Footer 에 자동 링크 노출.

---

## 1J. Customer accounts — `Settings → Customer accounts`

| 항목 | 값 |
|------|------|
| Account type | `New customer accounts` (passwordless, 6자리 코드 인증) |
| Account at checkout | `Optional` (1G 와 일치) |
| Login link | Footer 자동 |

**검증**: `/account/login` 접속 시 이메일 입력 → 인증 코드 발송 확인.

---

## Stage 1 종료 검증 — Smoke test

다음 시퀀스 통과하면 Stage 1 완료:

1. 어드민 → Storefront password 활성 (테마 작업 전 노출 차단)
2. Test order 1건:
   - 상품: Stage 2 등록 상품 1개 (`Face Sticker` / `1" / 25mm` / `White Matte`)
   - Easify option: photo upload, customer/pet name, special instructions 입력
   - postal code: M5V 3A8 (Toronto, ON) — 또는 V6B 1A1 (Vancouver, BC) / T2P 0A1 (Calgary, AB) 로 province 별 검증
   - 결제: 4242 카드
   - 결과: destination province 별 sales tax 라인 (ON 13% HST / BC 5% GST / AB 5% GST 등) + Free shipping + confirmation 이메일 수신 + order detail 에 option data/file URL 표시
3. 캐나다 외 주소 (US 우편번호 등) → "shipping not available" 차단

---

## 다음 단계

- **Stage 2 상품 등록**: [`product_descriptions.md`](product_descriptions.md) 기준으로 5 products 를 Draft 로 만든다.
- **Easify Product Options Advanced / Unlimited plan**: 비-Package upload, Package tier upload option set 을 각 product 에 붙인다.
- **Stage 2 종료 후**: 위 smoke test 를 다시 통과한 뒤 상품 Active 전환을 검토한다.
