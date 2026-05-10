# Batch 1 — Shopify Admin 핵심 Settings (1A–1D)

이 문서를 따라 Shopify admin에서 **General · Locations · Markets · Payments** 까지 셋업한다. 끝내면 storefront가 정확한 통화·시간대·위치·결제로 동작 가능한 상태가 된다.

- **소요 시간**: 약 60–90분 (사업자 정보 / 은행 계좌 미리 준비된 경우)
- **다음 batch**: `02_shopify_settings_ops.md` (Shipping / Taxes / Checkout / Notifications / Policies / Accounts)
- **입력값 SOT**: 정확한 값 정의는 [`../settings_checklist.md`](../settings_checklist.md) §1A–1D 참조. 이 문서는 그걸 클릭 시퀀스 + 체크포인트 형태로 푼 것.

---

## 작업 가정

이 인스트럭션은 다음 가정 위에서 작성됨:

- Admin UI 언어: **English** (메뉴 라벨 영어 기준)
- 통화: **CAD**
- 출발점: 0부터 가능 (이미 셋업된 항목은 각 Step 시작에서 skip 가능)
- 인스트럭션 따라가는 방식: **a3 (체크포인트 포함) + b2 (Batch별) + c2 (막힐 때 스크린샷)**

---

## 시작 전 점검

다음을 미리 준비:

| 항목 | 비고 | 없으면 |
|------|------|--------|
| Shopify 스토어 가입 | 14일 trial 또는 plan 가입 완료 | Step 0 진행 |
| 사업장 이메일 | Shopify 알림 수신용 | 메인 이메일 사용 가능 |
| 토론토 작업실 주소 | 부가가치세·배송 출발지 | 임시 주소로 시작, 나중에 수정 |
| Legal business name | 사업자등록명 | 본인 영문 이름으로 시작, 나중에 수정 |
| HST/GST 번호 | CRA 발급 | 미보유 시 1F Taxes (Batch 2) 에서 처리 |
| 캐나다 은행 계좌 | Shopify Payments 활성화용 | 1D 에서 PayPal만 우선 활성화하고 SP는 나중 |

> **체크포인트**: 위 6개 중 적어도 처음 3개 (스토어 / 이메일 / 주소) 가 확보되어 있어야 시작 가능.

---

## Step 0 — Shopify 스토어 가입 (이미 있으면 skip)

> 이미 `xxx.myshopify.com/admin` 접속 가능하면 → **Step 1.1 로 점프**

[Action 0.1] 브라우저에서 https://www.shopify.com 접속 → 우측 상단 `Start free trial` 클릭

[Action 0.2] 가입 폼:
- Email: 본인 이메일
- Password: 12자 이상 강한 비밀번호
- Store name: `Everstory Studio`
- 신용카드: 이 단계에서는 입력 안 함, 14일 무료 trial 자동 시작

[Action 0.3] 초기 setup 질문:
- "Where would you like to sell?" → **An online store** 선택
- "What kind of products?" → **Sell physical products** 선택
- "Where is your business located?" → **Canada** 선택
- "Industry?" → **Arts & Crafts** 선택

[Checkpoint 0] ✅ Shopify admin 진입. URL이 `xxx.myshopify.com/admin/...` 형식. 좌측에 사이드바 (Home / Orders / Products / Customers / ...) 가 보임.

> 막히면: 가입 confirmation 이메일이 본인 이메일로 옴. 그 링크로 다시 진입.

---

## Step 1.1 — General settings (1A)

**경로**: admin **좌측 하단** `Settings` (⚙ 톱니바퀴 아이콘) → 좌측 메뉴 **`General`**

> 최신 Shopify admin (2024 redesign 이후) 에서는 Settings 가 좌측 사이드바 **맨 아래** 에 있다. 각 Settings 페이지는 우측 상단 `Save` 버튼이 입력 후에 활성화된다 (변경 사항이 있을 때만).

### 1.1.1 Store details

[Action 1.1.1.a] **Store details** 섹션:
- Store name → `Everstory Studio`
- Store contact email → 본인 메인 이메일
- Sender email → `orders@{도메인}` (도메인 미연결이면 일단 본인 이메일과 동일하게)

[Action 1.1.1.b] 우측 상단 `Save` 클릭

[Checkpoint 1.1.1] ✅ 페이지 새로고침 → 입력값 그대로 유지. Sender email 옆에 "Verified" 또는 "Pending verification" 라벨 노출.

> Sender email 변경 후 그 주소로 verification 이메일이 옴. 받은편지함에서 verify 링크 클릭. Verified 안 되면 발송 메일이 spam 폴더로 갈 수 있음.

---

### 1.1.2 Store address

[Action 1.1.2.a] **Store address** 섹션:
- Legal business name → 사업자 등록명 (없으면 본인 영문 이름)
- Country/region → `Canada`
- Address → 토론토 작업실 주소
- City → `Toronto`
- Province → `Ontario`
- Postal code → 토론토 우편번호 (예: `M5V 3A8`)
- Phone → 비즈니스 전화

[Action 1.1.2.b] `Save` 클릭

[Checkpoint 1.1.2] ✅ 주소 정상 저장. 새로고침 후 그대로 유지.

---

### 1.1.3 Standards & formats

[Action 1.1.3.a] **Standards and formats** 섹션:
- Time zone → `(GMT-05:00) Eastern Time (US & Canada)`
- Unit system → `Metric system`
- Default weight unit → `Gram (g)`
- Order ID prefix → `EVS-` (옵션)
- Order ID suffix → 비움

[Action 1.1.3.b] `Save` 클릭

[Checkpoint 1.1.3] ✅ Time zone, Metric, g, prefix 모두 반영.

---

### 1.1.4 Store currency ⚠️ 중요

[Action 1.1.4.a] **Store currency** 섹션:
- Currency → `Canadian Dollar (CAD)`

> **⚠️ WARNING**: Currency 는 매출 (테스트 주문 포함) 발생 후 변경 불가. 지금 정확히 CAD 인지 한 번 더 확인.

[Action 1.1.4.b] `Save` 클릭

[Checkpoint 1.1.4] ✅ Store currency 가 `Canadian Dollar (CAD)` 로 표시.

---

### 1.1.5 General 최종 검증

[Checkpoint 1.1] ✅ 다음 모두 확인:
- [ ] Store name = `Everstory Studio`
- [ ] Currency = CAD
- [ ] Time zone = Eastern Time (GMT-05:00)
- [ ] Address 가 Toronto, Ontario 로 입력됨
- [ ] Sender email verified 상태 (또는 verification 이메일 보낸 상태)

> 막히면 스크린샷 보내줘. Verification 이메일 안 오는 경우 흔함.

---

## Step 1.2 — Locations (1B)

**경로**: `Settings → Locations`

> Shopify 신규 스토어는 default 로 가입 시 입력한 주소가 location 1개로 자동 생성됨. 이 단계는 그걸 **이름 변경 + 셋업 확인** 하는 거.

[Action 1.2.a] Locations 페이지 진입 → 기존 location 클릭 (보통 스토어 이름과 동일하게 자동 생성됨)

[Action 1.2.b] Location 이름을 `Toronto Studio` 로 변경

[Action 1.2.c] 다음 옵션 모두 ✅ 체크:
- Fulfill online orders from this location
- Sell from this location (POS 미사용이라도 켜둠)

[Action 1.2.d] 이 location 이 **Default location** 으로 설정되어 있는지 확인. 안 되어 있으면 우측 상단 `…` 메뉴 → `Set as default`

[Action 1.2.e] `Save`

[Checkpoint 1.2] ✅ Locations 화면에 `Toronto Studio` **단 1개** 만 표시. Default 라벨 옆에 붙어 있음.

> ⚠️ 픽업은 별도 location 이 아니라 1E Shipping (Batch 2) 의 "Local pickup" 으로 처리. 여기서 location 추가하지 않음.

---

## Step 1.3 — Markets (1C)

**경로**: `Settings → Markets`

> 최신 Shopify (2024+) 에서는 Markets 가 자동 셋업되어 있을 가능성 높음. 가입 시 Canada 를 선택했으면 Primary market 이 이미 Canada 로 잡혀있음. 이 단계는 그걸 **확인 + International market 비활성화** 만 하면 됨.

### 1.3.1 Primary market 확인

[Action 1.3.1.a] Markets 페이지 진입 → 첫 줄에 `Canada` 가 있는지 확인

[Action 1.3.1.b] `Canada` 클릭 → 다음 확인:
- Status → **Active**
- Currency → `Canadian Dollar (CAD)` (1A 와 자동 일치)
- Domain / subfolder → (도메인 미연결이면 비어있음. 도메인 연결 후 다시 확인)
- Languages → `English` (Default)

[Checkpoint 1.3.1] ✅ Canada market 이 Active, CAD, English 로 셋업됨.

---

### 1.3.2 International market 비활성화

[Action 1.3.2.a] Markets 페이지로 돌아가 → `International` 또는 `Rest of world` 등 다른 market 이 있는지 확인

[Action 1.3.2.b] 있다면 클릭 → `Deactivate` 또는 `…` 메뉴 → `Remove market`

> Rest of world 시장을 끄면 캐나다 외 국가에서 결제 시도 시 자동 차단된다. 이게 MVP 의도와 일치 (현재 Ontario only).

[Checkpoint 1.3.2] ✅ Markets 화면에 `Canada (Active)` 만 표시. 다른 market 은 없거나 Inactive.

---

## Step 1.4 — Payments (1D) ⭐

**경로**: `Settings → Payments`

> **현재 상태 점검**: 페이지 진입 시 어떤 결제 수단이 노출되어 있는지 먼저 확인. 캐나다 신규 스토어 default 는 보통 **PayPal Express** 만 활성화되어 있고 Shopify Payments 는 비활성. → Apple Pay / Google Pay / Shop Pay 가 안 보이는 원인.

### 1.4.1 Shopify Payments 활성화 (캐나다 merchant)

> Shopify Payments 는 캐나다에서 Stripe 백엔드로 동작, 거래 수수료 0%. 활성화 시 Apple Pay / Google Pay / Shop Pay 가 자동 노출됨.

[Action 1.4.1.a] Payments 페이지 → **Shopify Payments** 섹션 → `Activate Shopify Payments` 또는 `Complete account setup` 클릭

[Action 1.4.1.b] 입력 폼:
- Business type → `Individual` 또는 `Sole proprietorship` (사용자 사업 형태 맞게)
- Business details → 1A 사업자 정보 그대로
- Banking → 캐나다 은행 계좌
  - Transit number (5자리)
  - Institution number (3자리)
  - Account number (7–12자리)
- Statement descriptor → `EVERSTORY STUDIO` (카드 명세서 표기, 22자 제한)
- 2-step verification → 활성화 권장

[Action 1.4.1.c] 활성화 완료 → 다음이 자동으로 노출되는지 확인:
- Visa / Mastercard / Amex / Discover (카드)
- Apple Pay
- Google Pay
- Shop Pay

[Checkpoint 1.4.1] ✅ Payments 페이지 **Shopify Payments** 섹션이 "Active" 또는 "Activated" 상태. 위 4개 결제 수단 모두 표시됨.

> 막힐 만한 지점:
> - **"Apple Pay verification" 메시지** → 도메인 verify 필요. Settings → Payments → Apple Pay → `Verify your domain` 클릭. 자동 처리.
> - **캐나다 은행 계좌 미보유** → Wise (구 TransferWise) 또는 CIBC/RBC/TD small business account 발급 필요. 이 단계 일단 skip 하고 1.4.2 PayPal 만 활성화한 채로 다음 batch 진행 가능.

---

### 1.4.2 PayPal 유지

[Action 1.4.2.a] Payments 페이지 → **PayPal** 섹션 확인. 신규 스토어 default 로 활성화되어 있을 가능성 높음.

[Action 1.4.2.b] 활성화 안 되어 있으면 → `Activate` 클릭 → PayPal Business 계정으로 로그인 (없으면 회원가입)

[Checkpoint 1.4.2] ✅ PayPal 섹션 "Active". 결제 수단으로 노출.

---

### 1.4.3 결제 검증 시퀀스

[Action 1.4.3.a] admin 우측 상단 `View store` 또는 `View your store` 클릭 → storefront 탭 열림

> **이 시점에 storefront password 가 활성화되어 있을 가능성 높음** (Online Store → Preferences). password 알아두고 진입.

[Action 1.4.3.b] 임시로 아무 상품 1개 클릭 → `Add to cart` → checkout 진입 (현재는 상품이 없을 가능성 높으니 이 검증은 Batch 3 이후에 다시 진행)

[Action 1.4.3.c] **테스트 모드 활성화** (실제 결제 방지):
- Settings → Payments 다시 진입
- Shopify Payments 섹션 우측 `…` 메뉴 → `Manage` → 페이지 하단 `Test mode` 토글 ON

[Action 1.4.3.d] 테스트 카드 번호 `4242 4242 4242 4242` (만료 미래 / CVV 임의) 결제 시도 → 가짜 결제 통과 확인

[Action 1.4.3.e] admin → Orders 에 test order 표시되는지 확인

> ⚠️ 이 검증은 **Batch 3 (상품 등록) 이후에만 가능**. 현재는 상품이 없으니 [Action 1.4.3.b–e] 는 Batch 3 끝나고 다시 돌아와서 진행.

[Checkpoint 1.4.3] (Batch 3 이후) ✅ Test order 1건이 admin Orders 에 들어옴.

---

## Step 1 (Batch 1) 종료 검증

다음 모두 ✅ 면 Batch 1 완료:

- [ ] **1A General**: Store name = Everstory Studio, Currency = CAD, Time zone = Eastern Time, Address = Toronto Ontario, Sender email verified
- [ ] **1B Locations**: Toronto Studio 1개, Default 표시
- [ ] **1C Markets**: Canada (Active) 만 존재, 다른 market 없음
- [ ] **1D Payments**:
  - [ ] Shopify Payments 활성화 (캐나다 은행 계좌 있는 경우) — 또는 명시적으로 미활성화 (계좌 미보유)
  - [ ] PayPal 활성화
  - [ ] 노출 결제 수단 확인 (카드 / Apple Pay / Google Pay / Shop Pay / PayPal)

> 위 중 일부가 막혔으면 어디까지 됐는지 말해줘 (예: "1D 까지 OK, Shopify Payments 만 은행 계좌 없어서 보류"). 그 상태로 Batch 2 진행 가능.

---

## 다음 batch

→ **`02_shopify_settings_ops.md`** (Shipping / Taxes / Checkout / Notifications / Policies / Accounts)

또는 Settings 는 일단 여기까지 하고 wireframe 적용을 먼저 시작하고 싶으면 → **`03_admin_data.md`** (상품 / Collection / Pages / Navigation) 로 점프 가능 (단, Tax / Shipping / Policy 는 launch 전에 반드시 마무리해야 함).
