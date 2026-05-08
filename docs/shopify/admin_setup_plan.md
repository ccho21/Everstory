# Everstory Shopify 스토어 — 1차 백엔드 셋업 플랜

## Context

`docs/business/strategy.md` 9절 6주 셋업 시퀀스 중 **Week 1–5 백엔드 구간**을 실행 단위로 분해한다. 스타일/테마 (Week 6, Stage 5) 는 본 플랜 범위 밖.

**전제 조건 (사용자 확인됨)**:
- Shopify Basic 가입 완료 — 도메인 또는 Payments 중 1종 미연결
- SKU 구조: **4개 상품 (Solo/Duo/Trio/Memory Pack) × size 6 × material 4 = 24 variant/상품**
- 1차 배송 지역: **토론토 GTA + 로컬 픽업만** (lettermail 분실 리스크 회피, 5–10건 후기 축적 후 캐나다 전국 확장)
- HST/GST 등록 완료 — 자동 세금 계산 즉시 활성화

**기존 자산 (재사용)**:
- 가격 lock: `docs/business/strategy.md:94-105` (Solo/Duo/Trio/Memory Pack Shopify 표시가 $15.99/$18.99/$21.99/$28.99)
- 사이즈 6단계 cap 표: `docs/business/strategy.md:60-69`
- 재질 4종 노출 카피: `docs/business/strategy.md:73-75` + `docs/implementation/product_mvp.md:19-23`
- 상세페이지 이미지 풀: `projects/{고객}/03_output/*.ai` 81개 시트 (큐레이션해서 5–8장 변환)
- 브랜드 정체성: `docs/business/brand_identity.md` (워드마크/색상/폰트 — Stage 5에서 사용, 본 플랜에서는 텍스트 카피만 참고)

## 확정 결정 (2026-05-08 갱신)

| # | 결정 | 결과 | 영향 Stage |
|---|------|------|-----------|
| 1 | 도메인 vs Payments | 도메인 ✅ / Payments 미연결 → **Stage 1D 가 다음 핵심 액션** (Shopify Payments 활성화 시 Apple Pay / Google Pay / Shop Pay 자동 노출) | 1A, 1D |
| 2 | 사진 업로드 앱 | **Easify Product Options Free plan** (Customily $25/mo 1차 보류, 50건+ 후 라이브 프리뷰 ROI 재검토) | 2C |
| 3 | 사진 업로드 방식 | 결제 시 inline + **모크업 컨펌 단계 제거** + 디테일 노트 textarea 로 대체. 리드타임 5–7영업일 → 2–5영업일 | 2C, 3, 4 |
| 4 | 환불 정책 작성 | 직접 작성 (인쇄 시작 후 환불 불가, 인쇄 결함 100% 재제작, 분실 1회 재제작) | 1I, 4 |
| 5 | 한국어 footer | 옵션 A — 영어 페이지 끝에 한국어 요약 4-5줄 추가. 50건+ 후 Translate & Adapt 앱으로 옵션 C 마이그레이션 검토 | 4 |

상세 근거·워크플로우 다이어그램·리스크 인식·완화 장치: [docs/shopify/decisions_pending.md](docs/shopify/decisions_pending.md)

---

## Stage 1: Settings (어드민 백엔드)

목표: 어드민 → 주문 받을 수 있는 상태. 사이트 노출 (테마) 은 비활성 유지, **Password page 켜둠**.

| 단계 | 영역 | 작업 | 검증 |
|------|------|------|------|
| 1A | General | Store name = Everstory Studio, Industry = Arts & Crafts, Time zone = America/Toronto, Currency = CAD lock, Sender email, 토론토 작업실 주소 | Settings → General 모든 필드 채워짐 |
| 1B | Locations | "Toronto Studio" 1개 location. 작업실 주소. Fulfill orders / Sell from = on | Locations 1개 노출 |
| 1C | Markets | Primary = Canada. 미국·기타 disable | Markets → Canada만 active |
| 1D | Payments | Shopify Payments 활성화 (캐나다 merchant 등록) → 거래 수수료 0%. PayPal 보조 (선택). **Test mode**로 검증용 가짜 결제 1건 | Test order 결제 통과 |
| 1E | Shipping | Custom zone 2개: ① "GTA Local" (Postal Code prefix M/L 일부 — 토론토·미시소가·브램튼·노스욕·스카보로 등) shipping rate **Free** ② "Pickup" (로컬 픽업, free) — 비GTA postal code는 zone 매칭 실패로 자동 차단 | M5V·L5B postal code → 결제 통과, V6B (밴쿠버) → 결제 차단 |
| 1F | Taxes | Tax registration → Canada HST 번호 입력. Origin = Toronto. Ontario HST 13% 자동 적용 확인 | M5V postal code 결제 시 HST 13% 라인 표시 |
| 1G | Checkout | Customer accounts = optional (게스트+가입). Cart type = drawer. Abandoned checkout email = on | 게스트로 결제 흐름 진행 가능 |
| 1H | Notifications | Order confirmation / Order canceled / Shipping confirmation / Order fulfilled — 기본 텍스트 그대로 활성화. Sender = `orders@{도메인}` | Test order에서 confirmation 수신 |
| 1I | Policies | Refund / Privacy / Terms / Shipping 4개 — Shopify 자동 생성 템플릿 삽입 후 GTA·픽업·리드타임 문구만 추가. **본문 보강은 Stage 4** | 4개 페이지 published, footer 링크 작동 |
| 1J | Customer accounts | New customer accounts (passwordless) 활성화 | 회원 가입/로그인 화면 표시 |

**Stage 1 완료 기준**: Toronto postal code로 test order 1건 결제 → 세금 계산 → confirmation 수신 → admin에 주문 표시.

---

## Stage 2: Catalog (상품 등록)

### 2A. Collection 구조
- **smart collection 1개**: "All Stickers" (status:active 전체)
- **manual collection 4개**: Solo / Duo / Trio / Memory Pack — 상품 1대1 매핑

### 2B. Product 4종 등록 (동일 패턴 4번 반복)

| 필드 | Solo | Duo | Trio | Memory Pack |
|------|------|-----|------|-------------|
| Title | Custom Photo Sticker Sheet — Solo | … Duo | … Trio | … Memory Pack |
| Vendor | Everstory Studio | 동일 | 동일 | 동일 |
| Type | Sticker Sheet | 동일 | 동일 | 동일 |
| Tag | `solo`, `name-included`, `a5` | `duo`, … | `trio`, … | `memory-pack`, … |
| Variants | size 6 × material 4 = **24** | 24 | 24 | 24 |
| Base price (S × White) | **$15.99 CAD** | $18.99 | $21.99 | $28.99 |
| Compare-at | (옵션, launch price 인상 후) | | | |
| Description | photo 85–90% / size guide / 4 materials / lead time / GTA shipping or pickup | 디자인 2개 분량 | 3개 | 4+개, 2 시트 |
| Images | `projects/{고객}/03_output/*` 큐레이션 5–8장 PNG export | 동일 | 동일 | 동일 |
| Inventory | Continue selling when out of stock = on (made-to-order) | 동일 | 동일 | 동일 |
| SEO | title/description 한 줄씩 | 동일 | 동일 | 동일 |

**사이즈별 가격 increment**: `docs/business/strategy.md` 에 단일가만 있어서 **결정 필요** — 옵션 A) 사이즈 무관 동일가, B) 사이즈별 +$2 단계 인상. 1차 launch는 A) 단일가 권장 (UX 단순).

**재질별 가격 increment**: 동일하게 결정 필요. 1차 단일가 권장.

### 2C. 사진 업로드 + 디테일 노트 input

어드민 → Apps → **Easify Product Options Free plan** install → 4개 SKU 에 동일 옵션 set 적용 ("Apply to multiple products"):

| Option | Type | Required | 비고 |
|--------|------|----------|------|
| Photo for sticker | File upload | ✅ | Solo=1 / Duo=2 / Trio=3 / Memory Pack=4–8 (SKU 별 max 차등) |
| Customer / pet name | Text | ✅ | 헤더 우상단 (`info > header > header_right` TextFrame) 에 노출 |
| Special instructions | Textarea | Optional | **디테일 노트 — 모크업 컨펌 단계 대체**. placeholder: `"Tell us anything that matters — a face we should not crop, a tone you prefer, a detail we should keep crisp."` |

모크업 단계 없이 노트 + 사진만으로 작업 시작. 사진 부적합 (저해상도 < 1500px / 심한 흐림) 시만 운영자가 이메일로 재요청.

**Stage 2 완료 기준**: 4개 상품 각각 24 variant 표시 + 이미지 5–8장 + 카트 추가 + 결제 (Stage 1 검증과 동일 흐름).

---

## Stage 3: 운영 자동화

| 항목 | 도구 | 산출 |
|------|------|------|
| Order tag 자동화 | Shopify Flow (무료) | 주문에 size/material tag 자동 부여 → 작업 큐 분류 |
| Production calendar | Shopify fulfillment delay 설정 | 리드타임 안내 (1영업일 안 작업 시작, 총 2–5영업일) |
| 사진 부적합 안내 이메일 템플릿 | Shopify 어드민 → Customers → Email | 저해상도/흐림 사진 인쇄 전 재요청 또는 환불 안내 |

> **결정 3 영향**: 모크업 PDF 발송 자동화 항목 폐기. `docs/business/strategy.md` 13절 미구현 항목 표의 "모크업 PDF export — Everstory_mixed.jsx 수정" 행도 2026-05-08 동기화로 함께 제거됨 (변경 이력 참조).

---

## Stage 4: 정책/카피 본문 보강 + 한국어 footer

본문은 모두 작성 완료 — Shopify 어드민에 그대로 붙여넣기만 하면 됨.

| 페이지 | 작성 가이드 | 산출 |
|--------|-------------|------|
| Refund Policy | 인쇄 시작 (보통 주문 후 1영업일 이내) 전까지 환불 가능 / 인쇄 결함 100% 재제작 / 분실 1회 재제작 / 사진 부적합 시 인쇄 전 이메일 안내 | [policies.md](docs/shopify/policies.md) §1 ✅ |
| Shipping Policy | Ontario 무료 배송 + 토론토 픽업 / 1영업일 안 작업 시작 / 총 2–5영업일 안 발송 | [policies.md](docs/shopify/policies.md) §2 ✅ |
| Privacy | Shopify "Generate from template" + placeholder 5개 교체 | [policies.md](docs/shopify/policies.md) §3 ✅ |
| Terms of Service | Shopify 템플릿 + made-to-order SECTION X (사진 사용 권한 + 인쇄 시작 후 취소 불가) | [policies.md](docs/shopify/policies.md) §4 ✅ |
| About | brand_identity.md 톤 (boutique/editorial) + "SAY IT IN THE NOTES" 섹션 (모크업 대체) | [pages_copy.md](docs/shopify/pages_copy.md) §1 ✅ |
| FAQ | 사이즈/재질/리드타임/사진 요건 + 디테일 노트 가이드 | [pages_copy.md](docs/shopify/pages_copy.md) §2 ✅ |
| Sizing Guide | 6단계 + Mixed 사이즈별 use case | [pages_copy.md](docs/shopify/pages_copy.md) §3 ✅ |
| Materials Guide | 4종 substrate 차이·use case·care | [pages_copy.md](docs/shopify/pages_copy.md) §4 ✅ |
| **한국어 footer** | 정책 4종 + About + FAQ + 4개 SKU description 끝에 한국어 요약. 50건+ 후 Translate & Adapt 앱 마이그레이션 검토 | [footer_copy.md](docs/shopify/footer_copy.md) ✅ |

---

## Critical Files

| 파일 | 용도 |
|------|------|
| `docs/business/strategy.md:94-105,108-119,159-170` | 가격·COGS·6주 시퀀스 lock — Stage 1·2 가격 입력 시 그대로 참조 |
| `docs/implementation/product_mvp.md:19-23,42-67` | 재질·사이즈 cap·운영 규칙 — 상품 description 카피 소스 |
| `docs/implementation/packing_internals.md` | 사이즈 cap 표 — sizing guide 페이지 자료 |
| `docs/business/brand_identity.md` | 워드마크/푸터 4칩 — Stage 4 카피, Stage 5 디자인 |
| `projects/{고객}/03_output/*` | 81개 시트, 상세페이지 이미지 소스 |

## docs/shopify/ 카피 산출물

Stage 1–4 어드민 입력값. Shopify 어드민에 그대로 복붙 가능한 형태로 정리됨.

| 파일 | 사용 시점 | 내용 |
|------|-----------|------|
| [settings_checklist.md](docs/shopify/settings_checklist.md) | Stage 1 어드민 진입 | 1A General–1J Customer accounts 입력값 시트 (Shopify Payments 활성화 가이드 + GTA postal code prefix 30+개) |
| [decisions_pending.md](docs/shopify/decisions_pending.md) | 결정 5종 근거 | 결정 1–5 권장안 + 워크플로우 다이어그램 + 리스크 인식 / 완화 장치 |
| [product_descriptions.md](docs/shopify/product_descriptions.md) | Stage 2 4종 SKU 등록 | Solo / Duo / Trio / Memory Pack 영어 description + §Common (Materials / Sizes / Care / How to order) |
| [policies.md](docs/shopify/policies.md) | Stage 1I + Stage 4 | Refund / Shipping 직접 작성 본문 + Privacy / Terms 템플릿 가이드 |
| [pages_copy.md](docs/shopify/pages_copy.md) | Stage 4 | About / FAQ / Sizing Guide / Materials Guide 4개 페이지 본문 + SEO meta |
| [footer_copy.md](docs/shopify/footer_copy.md) | Stage 4 한국어 footer | 정책 4종 + About + FAQ + 4개 SKU description 한국어 요약 |

## 검증

**End-to-end smoke test (Stage 2 종료 시점)**:
1. Toronto postal code (예: M5V 3A8) 로 test order — Solo / S / White 1개 결제
2. Stage 1F HST 13% 라인 확인
3. Stage 1H confirmation email 수신
4. Admin → Orders에서 size/material tag 자동 부여 확인 (Stage 3 완료 후)
5. 비GTA postal code (V6B 1A1 밴쿠버) 결제 시도 → shipping zone 차단 확인
6. 4개 상품 각각 detail page에서 variant dropdown 24개 노출 + 가격 정확

**Stage 1 단독 검증**: 어드민 → Settings 모든 항목 green check, test order 결제 1건 통과.

## 다음 단계

Stage 1–4 완료 후 별도 플랜으로 Stage 5 진입:
- 테마 선택 (Dawn / Sense / Studio 또는 유료 Editions)
- `docs/business/brand_identity.md` 토큰 적용 (5색 + 폰트 3종)
- 홈/컬렉션/상품/About 페이지 섹션 구성
- 푸터 4칩 ("THANK YOU" / "MADE IN TORONTO WITH CARE" / "PREMIUM QUALITY" / "MADE TO KEEP" + QR)
- Soft launch (친구 5–10명) → 한인 커뮤니티 첫 포스팅

---

## 부록 (✅ 완료 2026-05-08): 비즈니스 전략 문서 동기화

결정 3 (모크업 컨펌 단계 제거) 가 차별화 5축 #3 (모크업 승인 워크플로우) 와 충돌. 사용자 결정 (2026-05-08): #3 자리를 **Fast turnaround** 로 교체.

> 카피: "주문 후 1영업일 안 작업 시작 + 2–5영업일 안 발송. Etsy 자동/AI 셀러 평균 1–3주 대비 우위."

### 문서 경로 변경 노트 (2026-05-07~05-08)

문서 구조 재편됨. 본 플랜의 일부 라인이 옛 경로 참조 — 동기화 작업 시 새 경로 사용:

| 옛 경로 | 새 경로 |
|---------|---------|
| `docs/business/strategy.md` | `docs/business/strategy.md` |
| `docs/business/brand_identity.md` | `docs/business/brand_identity.md` |
| `docs/implementation/packing_internals.md` | `docs/implementation/packing_internals.md` |
| `docs/implementation/product_mvp.md` | `docs/implementation/product_mvp.md` |
| `docs/shopify/` | `docs/shopify/` (파일명도 일부 변경: `settings_checklist.md` → `settings_checklist.md`, `footer_copy.md` → `footer_copy.md`, `pages_copy.md` → `pages_copy.md`) |

### 업데이트 항목

| 파일 | 라인 (현재) | 변경 |
|------|-------------|------|
| `docs/business/strategy.md` | 9 (One-liner) | "한국 프리미엄 substrate + 손 누끼 + **인쇄 전 모크업 승인** + 자체 ExtendScript" → "한국 프리미엄 substrate + 손 누끼 + **빠른 제작 (1영업일 안 작업 시작)** + 자체 ExtendScript" |
| `docs/business/strategy.md` | 21 | "3. 모크업 승인 워크플로우 (인쇄 전 PDF 컨펌)" → "3. **빠른 제작** — 주문 후 1영업일 안 작업 시작, 2–5영업일 안 발송. Etsy 자동/AI 셀러 평균 1–3주 대비 우위." |
| `docs/business/strategy.md` | 186 | "**모크업 승인**: 모든 주문에 PDF 모크업 → 고객 승인 → 인쇄. `Everstory_mixed.jsx` 끝의 `_saveAi` 옆에 PDF export 추가 필요 (현재 .ai 만 자동 저장)." → "**디테일 노트 + 빠른 작업**: Easify special instructions textarea 로 고객 디테일 받음. 모크업 컨펌 단계 없이 1영업일 안 작업 시작. 사진 부적합 (저해상도/심한 흐림) 시만 인쇄 전 이메일 재요청." |
| `docs/business/strategy.md` | 204 | `\| 모크업 PDF export — Everstory_mixed.jsx 수정 \| 미구현 \|` → **행 자체 제거** (불필요해짐) |
| `docs/business/brand_identity.md` | 7 (One-liner) | strategy.md:9 와 동기화 (위 동일 변경) |
| `docs/business/brand_identity.md` | 17 | "3. **인쇄 전 모크업 승인** — PDF 모크업을 고객에게 보내고 컨펌 받은 뒤 인쇄. 고객 first-touch artifact 이자 UGC 트리거." → "3. **빠른 제작** — 주문 후 1영업일 안 작업 시작, 2–5영업일 안 발송. 모크업 컨펌 없이 디테일 노트 + 손 누끼 + 한국 substrate + 자체 파이프라인 결합으로 가능. Etsy 자동/AI 셀러 평균 1–3주 대비 우위." |

### 변경 이력 한 줄 추가

`docs/business/strategy.md` 변경 이력 section + `docs/business/brand_identity.md` 변경 이력 section 에 각각 동일 한 줄 추가:

> - **2026-05-08** — 차별화 5축 #3 "모크업 승인 워크플로우" → **"빠른 제작"** (1영업일 안 작업 시작) 으로 교체. 결정 3 (Shopify 운영 워크플로우에서 모크업 컨펌 제거) 의 후속 동기화. 모크업 PDF export 미구현 항목 폐기.

### 유지 항목 (수정 안 함)

`brand_identity.md:67` ("시트 mockup 안 인물·반려동물·가족 사진"), `:148` ("mockup 헤더 White matte 중복"), `:155` ("assets/ mockup 분석") 의 "mockup" 은 **PSD/AI 시안 mockup** 의미 (모크업 컨펌 워크플로우와 무관). 그대로 유지.

### 검증

```bash
grep "모크업\|mockup approval" docs/business/strategy.md docs/business/brand_identity.md
```
기대 결과: 0건 (모크업 컨펌 워크플로우 관련 문구 모두 제거됨).

### 영향 정리

- 차별화 5축 신규: (1) Korean substrate / (2) 손 누끼 / (3) **Fast turnaround** ⭐ / (4) 토론토 로컬 / (5) ExtendScript
- `Everstory_mixed_v2.jsx` 의 PDF export 자동화 작업 큐에서 제거
- `docs/shopify/` 6개 카피 파일과 일관성 완전 회복

---

## 변경 이력

- **2026-05-08** — `~/.claude/plans/humming-giggling-canyon.md` 를 git 추적 위치로 복사 (`docs/shopify/admin_setup_plan.md`). 옛 폴더 경로 (`docs/shopify/`, `docs/business/brand_identity.md` 등) 를 새 경로로 일괄 교체. 진행 체크리스트 + 다른 랩탑 setup 가이드 추가.
- **2026-05-08** — 비즈니스 전략 문서 동기화 완료 (위 부록 참조).
- **2026-05-07** — 5개 결정 (도메인/Payments + Easify + 모크업 제거 + 직접 정책 + 한국어 footer) 확정. 카피 6개 파일 작성 (`docs/shopify/`).
- **2026-05-07** — Plan 초안 작성. Shopify 1차 백엔드 셋업 (Stage 1-4) 분해.

---

## 진행 체크리스트

표기: `☐` 대기 / `◐` 진행 중 / `✓` 완료. 어드민 작업 시 매 단계 직접 갱신 후 git commit.

### Stage 1: Settings (어드민 백엔드)

- ☐ 1A. General — Store name / address / currency / time zone
- ☐ 1B. Locations — Toronto Studio
- ☐ 1C. Markets — Canada only
- ☐ **1D. Payments ⭐ 다음 액션** — Shopify Payments 활성화 (Apple Pay / Google Pay / Shop Pay 자동 노출 트리거)
- ☐ 1E. Shipping — Ontario Free + Toronto Pickup
- ☐ 1F. Taxes — HST 13% 자동
- ☐ 1G. Checkout
- ☐ 1H. Notifications
- ☐ 1I. Policies — 4종 페이지 published
- ☐ 1J. Customer accounts

### Stage 2: Catalog (상품 등록)

- ☐ 2A. Collections — smart "All Stickers" + manual 4종
- ☐ 2B. Products 4종 등록 — Solo / Duo / Trio / Memory Pack × 24 variant
- ☐ 2C. Easify Product Options Free plan install + 옵션 set 적용

### Stage 3: 운영 자동화

- ☐ Order tag 자동화 (Shopify Flow)
- ☐ Production calendar (fulfillment delay)
- ☐ 사진 부적합 안내 이메일 템플릿

### Stage 4: 정책/카피 본문 + 한국어 footer

- ☐ Refund Policy (`docs/shopify/policies.md` §1)
- ☐ Shipping Policy (§2)
- ☐ Privacy Policy (§3 — 템플릿 + placeholder 5개 교체)
- ☐ Terms of Service (§4 — 템플릿 + SECTION X)
- ☐ About 페이지 (`docs/shopify/pages_copy.md` §1)
- ☐ FAQ (§2)
- ☐ Sizing Guide (§3)
- ☐ Materials Guide (§4)
- ☐ 한국어 footer (`docs/shopify/footer_copy.md` — 정책 4종 + About + FAQ + 4 SKU description)

### Stage 5: 테마/스타일 (별도 plan)

본 plan 범위 밖. Phase A–E 빌드 plan 참조: [plan.md](plan.md)

---

## 다른 랩탑에서 작업 이어가기

### 1차 setup (한 번만)

1. **Repository clone 또는 기존 clone 위치로 이동**
   ```bash
   git clone {repo URL}    # 신규
   cd 포토샵누끼
   # 또는 기존 clone 폴더로 이동
   git pull
   ```
2. **Shopify 어드민 로그인** — 브라우저에서 어드민 URL 접속, 같은 계정 로그인. 어드민 자체는 어느 랩탑·어느 OS 에서나 동일.
3. **Adobe Creative Cloud 로그인** (선택) — Phase 0/A/B 운영 작업 시만 필요. Stage 1-4 어드민 셋업에는 불필요.
4. (Stage 2 이후 시점이면) **Easify Product Options install 상태 확인** — 어드민 → Apps

### 작업 재개 시

1. `git pull` — 최신 변경 가져오기
2. 본 파일의 **진행 체크리스트** 확인 — 어디까지 했는지
3. 다음 `☐` 또는 `◐` 단계부터 진행. 카피는 `docs/shopify/` 의 해당 파일에서 복붙
4. 단계 완료 시 `☐` → `✓` 로 갱신
5. 커밋:
   ```bash
   git add docs/shopify/admin_setup_plan.md
   git commit -m "Stage XX 진행: ..."
   git push
   ```

### 어느 랩탑에서나 가능한 작업

- Stage 1A–1J (Shopify 어드민, 웹 기반)
- Stage 2A–2C (어드민 + Easify 앱 install)
- Stage 3 (Shopify Flow, 어드민)
- Stage 4 카피 붙여넣기 (어드민 → Pages / Settings → Policies)

### 특정 랩탑에서만 가능한 작업 (스튜디오 머신)

- Phase 0 (수동 PS 누끼) — Adobe Photoshop + 고객 PSD (`projects/{고객}/01_original/`, `02_cutout/`)
- Phase A (UXP 패널) — Photoshop + `plugins/everstory_save/`
- Phase B (시트 제작) — Adobe Illustrator + `Everstory_mixed_v2.jsx` + `templates/template_cutout_v2.ait`
- 실제 인쇄·컷팅 — ET-8550 + Summa D75 하드웨어

→ 본 plan (Stage 1-4) 은 **어느 랩탑에서나 가능**. Phase 0/A/B 운영 작업과는 별개.
