# Batch 2 — Shopify Admin 운영 Settings (1E–1J)

이 문서를 따라 Shopify admin 의 **Shipping / Taxes / Checkout / Notifications / Policies / Customer accounts** 까지 셋업한다. Batch 1 (1A–1D) 가 끝나야 이 batch 의 일부 (특히 Taxes, Shipping) 가 의미 있게 동작한다.

- **소요 시간**: 약 45–60분 (정책 본문 복사·붙여넣기 시간 포함)
- **이전 batch**: `01_shopify_settings_core.md` (1A–1D)
- **다음 batch**: `03_admin_data.md` (상품 / Collection / Pages / Navigation)
- **입력값 SOT**: [`../settings_checklist.md`](../settings_checklist.md) §1E–1J, [`../policies.md`](../policies.md) (정책 본문), [`../footer_copy.md`](../footer_copy.md) (한국어 안내)

---

## 시작 전 점검

- [ ] Batch 1 종료 체크리스트 모두 ✅ — 특히 1A 통화/주소, 1B Toronto Studio location, 1D 결제 1개 이상 활성화
- [ ] HST/GST 번호 손에 있음 (CRA 등록 9자리 + RT0001) — **없으면**: 1F 일부 skip 가능, launch 전에 다시 진입
- [ ] 도메인 연결 상태 알고 있음 — `xxx.myshopify.com` 만 있어도 진행 가능, 커스텀 도메인은 launch 전에 연결

---

## Step 1.5 — Shipping & Delivery (1E)

**경로**: `Settings → Shipping and delivery`

> 캐나다 신규 스토어는 default 로 General shipping profile 1개와 Domestic zone (Canada 전체) 이 자동 셋업됨. 이 단계에서 그걸 **Ontario only Free shipping + Toronto Studio pickup** 으로 재구성한다.

### 1.5.1 General shipping profile 진입

[Action 1.5.1.a] Shipping and delivery 페이지 → **Shipping** 섹션 → **General shipping rates** 또는 `General` 클릭 (스토어마다 라벨 다를 수 있음, default profile)

[Checkpoint 1.5.1] ✅ Shipping profile 상세 페이지 진입. 기본 zone (예: "Domestic" 또는 "Canada") 이 보임.

---

### 1.5.2 기존 zone 정리

[Action 1.5.2.a] 기존 default zone (`Domestic` / `Canada` / `International` 등) 이 있으면 → 우측 `…` 메뉴 → `Delete zone` 또는 `Remove`

> ⚠️ 모든 zone 을 한 번에 지우지 말고, 새 zone 만든 후 지워도 됨. 현재 활성 zone 이 0개면 storefront 결제 차단됨.

[Action 1.5.2.b] 새 zone 만들 준비 — 다음 1.5.3 으로 진행

---

### 1.5.3 Zone 1: Ontario Free Shipping 만들기

[Action 1.5.3.a] Shipping profile 페이지에서 `Create shipping zone` 또는 `+ Create zone` 클릭

[Action 1.5.3.b] Zone 입력:
- Zone name → `Ontario Free Shipping`
- Country/region → `Canada` 선택 → 펼쳐서 **Ontario 만 체크**, 다른 province 모두 해제
- `Done` 클릭

[Action 1.5.3.c] Zone 안에서 `Add rate` 클릭

[Action 1.5.3.d] Rate 입력:
- Rate name → `Free shipping (lettermail)`
- Price → `0.00`
- Conditions → 비워둠 (모든 주문 적용)
- `Done`

[Action 1.5.3.e] `Save`

[Checkpoint 1.5.3] ✅ Shipping profile 에 `Ontario Free Shipping` zone 이 생기고, 그 안에 `Free shipping (lettermail) — $0.00` rate 표시.

---

### 1.5.4 기존 default zone 삭제

[Action 1.5.4.a] 새 zone 만들고 검증된 후 → 기존 default zone (Canada 전체 / Domestic / International 등) → `…` → `Delete zone`

[Checkpoint 1.5.4] ✅ Shipping profile 에 `Ontario Free Shipping` 1개만 남음. 다른 zone 없음.

> 의도: Ontario 외 주소는 zone 매칭 실패 → checkout 에서 "We don't ship to your address" 자동 차단.

---

### 1.5.5 Local pickup 추가

[Action 1.5.5.a] Shipping and delivery 메인 페이지로 돌아가 → **Local pickup** 섹션 (또는 **Pickup and local delivery**) → `Toronto Studio` location 옆 **Edit** 또는 클릭

[Action 1.5.5.b] Local pickup 폼:
- This location offers local pickup → ✅ **on**
- Pickup time → `Ready in 3–5 business days`
- Order processing instructions → `You will receive an email when your order is ready for pickup.`
- (옵션) Pickup location address → Toronto 주소 자동 (1B 에서 셋업됨)

[Action 1.5.5.c] `Save`

[Checkpoint 1.5.5] ✅ Local pickup 화면에 `Toronto Studio — Pickup available` 노출.

---

### 1.5.6 Shipping 검증 (Batch 3 이후 가능)

> 현재 상품이 없으니 실제 결제 검증은 Batch 3 (상품 등록) 이후. 다음 검증을 Batch 3 끝나고 돌아와서 실행.

- [ ] 토론토 우편번호 (`M5V 3A8`) 로 test 결제 시도 → "Free shipping (lettermail) — $0.00" 노출
- [ ] 밴쿠버 우편번호 (`V6B 1A1`) 로 test 결제 시도 → "We don't ship to your address" 차단
- [ ] Pickup 옵션 선택 시 "Toronto Studio Pickup — Free" 노출

---

## Step 1.6 — Taxes & Duties (1F)

**경로**: `Settings → Taxes and duties`

### 1.6.1 Tax-inclusive pricing 비활성화

[Action 1.6.1.a] Taxes and duties 페이지 → **General** 또는 **Tax settings** 섹션 → 다음 옵션 모두 ❌:
- "All prices include tax" → **off** (캐나다 표준은 세금 별도 표시)

[Action 1.6.1.b] 다음 옵션 ✅:
- "Charge tax on shipping rates" → **on** (Ontario HST 가 배송비에도 적용)

[Action 1.6.1.c] `Save`

[Checkpoint 1.6.1] ✅ Tax-inclusive pricing 끄짐, shipping tax 켜짐.

---

### 1.6.2 Canada tax registration

[Action 1.6.2.a] **Tax regions** 섹션 → `Canada` 클릭 → `Set up` 또는 `Edit`

[Action 1.6.2.b] HST/GST 등록:
- Tax number → CRA 발급 번호 (예: `123456789RT0001`)
- Region → `Ontario`
- Auto-calculate tax → ✅ **on**

[Action 1.6.2.c] `Save`

> **HST 번호 미보유**: CRA 등록 안 했으면 일단 이 단계 skip. 캐나다는 연 매출 30,000 CAD 이하면 HST 등록 의무 없음. 다만 **launch 전에는 반드시 등록 + 입력**해야 함 (Ontario 13% 자동 계산).

[Checkpoint 1.6.2] ✅ Canada → Ontario 에 HST 등록됨. Auto-calculate on. (또는 "HST 번호 미등록" 상태 명시적 메모)

---

### 1.6.3 Tax 검증 (Batch 3 이후)

> 상품 등록 후 Toronto 주소로 test order → 결제 화면에 `HST 13% — $X.XX` 라인 표시 확인.

---

## Step 1.7 — Checkout (1G)

**경로**: `Settings → Checkout`

> 옵션 많음. 아래 표대로 한 번에 셋업하고 `Save`. 페이지 한 번에 다 보이는 게 아니라 섹션별로 스크롤.

### 1.7.1 핵심 옵션

| 섹션 | 항목 | 값 |
|------|------|------|
| Customer accounts | Account requirement | `Optional` |
| Customer information | Phone number | `Optional` (Email 은 required, 변경 불가) |
| Marketing | "Email subscription" 체크박스 default | **unchecked** (PIPEDA 준수) |
| Cart | Cart type | `Drawer` (페이지 이탈 감소) |
| Tipping | Enable tipping | ❌ off |
| Order processing | Automatically fulfill the order's line items | ❌ off (made-to-order) |
| Abandoned checkouts | Automatically send | 1h / 6h / 24h 기본값 유지 |

[Action 1.7.1.a] 위 항목 각각 찾아서 셋업. 항목별로 `Save` 가 따로 뜰 수 있음.

[Checkpoint 1.7.1] ✅ Cart type = Drawer, Account = Optional, Auto-fulfill = off, Tipping = off.

---

### 1.7.2 Order status page (스킵)

> Order status page additional scripts 는 Stage 5 이후 결정. 지금은 비워둠.

---

## Step 1.8 — Notifications (1H)

**경로**: `Settings → Notifications`

### 1.8.1 Sender 정보

[Action 1.8.1.a] **Sender** 섹션 (또는 페이지 상단):
- Sender email → `orders@{도메인}` (1A 와 동일)
- Sender name → `Everstory Studio`

[Action 1.8.1.b] `Save`

[Checkpoint 1.8.1] ✅ Sender email verified 상태. Sender name 반영.

---

### 1.8.2 Template 활성화 확인

[Action 1.8.2.a] **Order notifications** / **Customer notifications** 섹션 → 다음 모두 활성 (대부분 default ON):

- Order confirmation
- Order canceled
- Order refund
- Order edited
- Shipping confirmation
- Shipping update
- Order fulfilled
- Out for delivery
- Delivered
- Pickup ready
- Pickup confirmation
- Customer account invite
- Customer account welcome

[Action 1.8.2.b] **Pickup ready** 템플릿 → `Edit`/`Customize` → 본문에 다음 한 줄 추가 (또는 default 메시지에 보강):

```
Your order is ready at Toronto Studio. Please reply with a pickup time.
```

> 다른 템플릿은 default 본문 그대로 OK. Stage 5 (디자인 단계) 에서 일괄 다듬음.

[Checkpoint 1.8.2] ✅ 13개 템플릿 모두 활성. Pickup ready 본문에 reply 안내 들어감.

---

## Step 1.9 — Policies (1I) ⭐

**경로**: `Settings → Policies`

> 4개 정책 페이지 + Contact information 등록. **본문 SOT 는 [`../policies.md`](../policies.md)** — 인스트럭션은 어디에 어떻게 붙여넣는지만 안내.

### 1.9.1 Refund Policy

[Action 1.9.1.a] Policies 페이지 → **Refund policy** → `Edit` 또는 본문 박스 클릭

[Action 1.9.1.b] [`../policies.md`](../policies.md) **§1 Refund Policy** 본문 (코드 블록 안의 영문) 을 **그대로 복사** 해서 Shopify Rich Text 에디터에 붙여넣기

[Action 1.9.1.c] 본문 안 placeholder 교체:
- `[YYYY-MM-DD]` → 오늘 날짜 (예: `2026-05-09`)
- `[orders@everstory-domain.com]` → 실제 운영 이메일 (도메인 미연결이면 일단 placeholder 유지, launch 전 일괄 교체)
- `[Toronto address]` → 1A 사업장 주소

[Action 1.9.1.d] (옵션) 본문 끝에 한국어 안내 추가:
- Rich text editor → 본문 맨 아래 → **horizontal rule** (`—`) 삽입 → **Heading 3** → `한국어 안내` 텍스트 → 그 아래 [`../footer_copy.md`](../footer_copy.md) **§1 Refund Policy 한국어 footer** 본문 붙여넣기

[Action 1.9.1.e] `Save`

[Checkpoint 1.9.1] ✅ Refund policy 페이지 본문 등록. Footer 에 자동 링크 노출 (1.10 에서 확인).

---

### 1.9.2 Shipping Policy

[Action 1.9.2.a] Policies 페이지 → **Shipping policy** → `Edit`

[Action 1.9.2.b] [`../policies.md`](../policies.md) **§2 Shipping Policy** 본문 복사 → 붙여넣기 → placeholder 교체 (1.9.1 동일 항목)

[Action 1.9.2.c] (옵션) 한국어 footer 추가 — [`../footer_copy.md`](../footer_copy.md) **§2 Shipping Policy** 사용

[Action 1.9.2.d] `Save`

[Checkpoint 1.9.2] ✅ Shipping policy 등록.

---

### 1.9.3 Privacy Policy

[Action 1.9.3.a] Policies 페이지 → **Privacy policy** → 우측 또는 상단 `Generate from template` 클릭 → 자동 생성문 삽입됨

[Action 1.9.3.b] 자동 생성문 안 placeholder 5개 교체:
- `[STORE NAME]` → `Everstory Studio`
- `[STORE EMAIL]` → 실제 운영 이메일
- `[STORE ADDRESS]` → 토론토 주소
- `[BUSINESS NUMBER]` → HST/GST 번호 (없으면 일단 비움)
- `[JURISDICTION]` → `Ontario, Canada`

> ⚠️ 자동 생성문에 위 placeholder 가 정확히 5개 있는지 확인. Shopify 템플릿이 업데이트되면 placeholder 명칭 다를 수 있음. `[`로 시작하는 모든 부분 검토.

[Action 1.9.3.c] (옵션) 한국어 footer — [`../footer_copy.md`](../footer_copy.md) **§3 Privacy Policy**

[Action 1.9.3.d] `Save`

[Checkpoint 1.9.3] ✅ Privacy policy 등록. Placeholder 모두 교체됨 (검색해서 `[` 가 본문에 남아있지 않은지 확인).

---

### 1.9.4 Terms of Service

[Action 1.9.4.a] Policies 페이지 → **Terms of service** → `Generate from template`

[Action 1.9.4.b] Placeholder 5개 교체 (1.9.3 동일)

[Action 1.9.4.c] **Made-to-order 보호 조항 삽입** — [`../policies.md`](../policies.md) **§4 Terms of Service** 의 `SECTION X — MADE-TO-ORDER PRODUCTS` 블록 (인용 부분) 을 복사 → "Limitation of liability" 섹션 **직전** 에 삽입

> 이 조항은 자동 템플릿에 없음. 수동 추가 필수.

[Action 1.9.4.d] (옵션) 한국어 footer — [`../footer_copy.md`](../footer_copy.md) **§4 Terms of Service**

[Action 1.9.4.e] `Save`

[Checkpoint 1.9.4] ✅ Terms 등록. SECTION X (made-to-order) 본문에 포함됨.

---

### 1.9.5 Contact information

[Action 1.9.5.a] Policies 페이지 → **Contact information** 섹션 → 다음 입력:

```
Everstory Studio
[Toronto address]
[orders@everstory-domain.com]
HST/GST: [번호]
```

placeholder 모두 실제 값으로 교체 (HST 번호 없으면 그 줄 삭제).

[Action 1.9.5.b] `Save`

[Checkpoint 1.9.5] ✅ Contact information 4줄 등록. Footer 에 자동 노출.

---

## Step 1.10 — Customer accounts (1J)

**경로**: `Settings → Customer accounts`

### 1.10.1 Account type

[Action 1.10.1.a] Customer accounts 페이지 → **Account version** 섹션 → `New customer accounts` 선택 (passwordless, 6자리 코드 인증)

> "Classic customer accounts" 는 비밀번호 기반 legacy. New 가 더 간편하고 보안성 좋음. 2024+ 신규 스토어는 default 로 New.

[Action 1.10.1.b] **Account at checkout** → `Optional` (1G Checkout 과 일치)

[Action 1.10.1.c] `Save`

[Checkpoint 1.10.1] ✅ Account version = New, At checkout = Optional.

---

### 1.10.2 Login 검증

[Action 1.10.2.a] 새 incognito 창에서 `https://xxx.myshopify.com/account/login` 접속

[Action 1.10.2.b] 임의 이메일 입력 → 인증 코드 발송 화면 표시되는지 확인

[Checkpoint 1.10.2] ✅ Passwordless 인증 코드 화면 정상 표시. (실제 코드 입력은 안 해도 됨)

---

## Batch 2 종료 검증

다음 모두 ✅ 면 Batch 2 완료:

- [ ] **1E Shipping**: `Ontario Free Shipping` zone 1개 + Toronto Studio pickup 셋업
- [ ] **1F Taxes**: Tax-exclusive pricing, HST 13% 자동 계산 (또는 HST 미등록 상태 명시)
- [ ] **1G Checkout**: Account = Optional, Cart = Drawer, Tipping = off, Auto-fulfill = off
- [ ] **1H Notifications**: Sender = `Everstory Studio`, Pickup ready 본문 보강, 13개 template 활성
- [ ] **1I Policies**: Refund / Shipping / Privacy / Terms / Contact 5개 모두 publish, placeholder 0개
- [ ] **1J Customer accounts**: New (passwordless), Optional at checkout

> Settings 1A–1J 가 끝나면 Stage 1 종료. 다음 batch 부터는 admin 데이터 (상품, 컬렉션, 페이지) 와 테마 작업.

---

## 다음 batch

→ **`03_admin_data.md`** (상품 5종 + Collection + Pages + Navigation)

이게 끝나면 1.4.3 / 1.5.6 / 1.6.3 의 **결제·배송·세금 검증** 을 실제 test order 로 다시 돌릴 수 있다 (smoke test).
