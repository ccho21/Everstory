# Shopify 셋업 — 결정 사항 (확정 + 보류)

플랜 (humming-giggling-canyon.md) 의 4개 보류 항목. 사용자 답변 후 권장안 업데이트 (2026-05-07).

---

## 결정 1. 도메인 vs Payments — ✅ 확정

**상태**: 도메인 연결됨 / **Payments 미연결**.

**증상**: 결제 옵션에 PayPal 만 default 노출. Apple Pay / Google Pay / Shop Pay 미노출.

**원인**: Shopify Payments 미활성화. Shopify Payments 활성화 시 다음이 **자동** 활성:
- Visa / Mastercard / Amex / Discover (카드)
- Apple Pay (iPhone / Mac Safari)
- Google Pay (Android / Chrome)
- Shop Pay (Shopify 자체 1-tap)

PayPal 은 별도 결제 게이트웨이 (Shopify Payments 와 병렬). 그래서 활성화 안 해도 PayPal 만 보였던 것.

**다음 액션**: Stage 1D — Shopify Payments 활성화 (어드민 → Settings → Payments → Activate Shopify Payments). 캐나다 merchant 로 가입 진행 — 사업자 정보 + 캐나다 은행 계좌 입력. 활성화 직후 Apple Pay 등 자동 노출.

→ Payments 활성화 후 PayPal 은 유지 / 제거 결정 가능 (한인 디아스포라 PayPal 익숙도 고려 → 유지 권장).

---

## 결정 2. 사진 업로드 앱 — ✅ 확정 (Customily 보류, 무료 앱 권장)

**사용자 결정** (2026-05-07 갱신): Customily ($25/mo) 는 1차 launch 에 투머치. **모크업 컨펌 단계도 제거** (결정 3 참조). 손님이 결제 시 사진 + 디테일 노트 올리면 우리가 받아서 1영업일 안에 작업 시작 → 인쇄 → 배송.

**워크플로우**:
1. 손님 결제 시 사진 업로드 + 이름 + 디테일 노트 입력 (앱 필요)
2. 우리가 받음 → 사진 부적합 시만 이메일 재요청 (그 외엔 그대로 진행)
3. Phase 0/A/B 운영 파이프라인 → 인쇄 → 배송

이 흐름의 핵심 = **결제 시 사진 업로드 + 디테일 텍스트 받는 앱**. Customily 안 쓰면 다음 옵션 중 1택.

### 무료/저렴 사진 업로드 앱 비교

| 앱 | 비용 | 사진 업로드 | 텍스트 입력 (이름/날짜) | 라이브 프리뷰 | 추천 강도 |
|----|------|-------------|------------------------|--------------|-----------|
| **Easify Product Options — Free plan** | $0 | ✅ (5MB/file) | ✅ | ❌ | ★★★★★ |
| **Hulk Product Options — Free plan** | $0 | ✅ (file upload 옵션) | ✅ | ❌ | ★★★★ |
| **Bold Product Options** | $19.99/mo | ✅ | ✅ | ❌ | (유료 시작점) |
| Shopify 기본 + 결제 후 이메일 | $0 | ❌ (별도 수동) | line item property text 만 | ❌ | ★★ (마찰 큼) |

**권장: Easify Product Options — Free plan**

**근거**:
- 무료 plan 에서 사진 업로드 + 텍스트 옵션 모두 가능 (file size limit 5MB, JPG/PNG/HEIC 지원)
- UI 가 모던/깔끔 — boutique 톤과 어울림
- 4개 SKU 에 동일 옵션 set 재사용 (Solo/Duo/Trio/Memory Pack 모두 "Photo upload" + "Customer name" + "Order date" + 옵션 메모)
- 운영 안정 후 (50건+) Pro 로 업그레이드해도 마이그레이션 부담 없음 (같은 앱 내 plan 변경)
- Hulk Free 도 비슷하지만 UI 가 더 구식

**Easify 설정값** (어드민 → Apps → Easify Product Options → Create option set):

| Option | Type | Required | 비고 |
|--------|------|----------|------|
| Photo for sticker | File upload | ✅ | Solo=1장, Duo=2장, Trio=3장, Memory Pack=4-8장 (SKU 별 max 다르게 설정) |
| Customer / pet name | Text | ✅ | 헤더 line 1 우상단 노출 |
| Order date label | Text | Optional | 헤더 line 2 우상단 — 기본은 주문일 자동 |
| Special instructions | Textarea | Optional | "이 사진은 좀 더 따뜻하게" 같은 자유 입력 |

**4개 SKU 모두 동일 option set 적용** — Easify 의 "Apply to multiple products" 기능 사용.

**대안 (운영 안정화 이후)**:
- 첫 50건 후 라이브 프리뷰가 매출에 영향 있다고 판단되면 → Customily ($25/mo) 마이그레이션
- 또는 Easify Pro ($9.99/mo) 로 업그레이드 — 기본 기능 동일하지만 옵션 무제한 + 우선 지원

---

## 결정 3. 고객 사진 업로드 방식 — ✅ 확정 (결제 시 inline + 모크업 컨펌 단계 제거)

**사용자 결정** (2026-05-07 갱신): Customily 보류 + **모크업 PDF 컨펌 단계 제거**. 빠른 작업을 위해 시안 없이 진행. 대신 주문 시 고객이 원하는 디테일을 노트에 받아서 그 노트와 사진만으로 작업.

**최종 워크플로우** (Easify 무료 plan 가정):

```
[고객] 상품 페이지 → 사이즈/재질 선택 + 사진 업로드 + 이름 + 디테일 노트 입력 → 결제
   ↓
[Shopify] 주문 생성 (line item property 에 사진 file URL + 이름 + 디테일 노트 attached)
   ↓
[운영자] Shopify 어드민 → 주문 → 사진 다운로드 + 디테일 노트 확인
   ↓
[운영자] (사진 부적합 시) 이메일로 재요청 또는 환불 안내 — 그 외엔 그대로 진행
   ↓
[운영자] Phase 0 (수동 PS 누끼) → Phase A (UXP _clean.psd + _sil.png) → Phase B (Everstory_mixed_v2.jsx 시트 생성)
   ↓
[운영자] ET-8550 인쇄 → Summa D75 컷팅 → 패키징 → 발송
```

**리드타임**: 주문 → 1영업일 안 작업 시작 → 2–5영업일 안 발송. 기존 모크업 컨펌 워크플로우 (5–7영업일) 대비 평균 3일 단축.

**디테일 노트 = 운영의 핵심**:
Easify 옵션 set 에서 "Special instructions" textarea 가 모크업 컨펌을 대체. placeholder 카피로 가이드 제공:

> "Tell us anything that matters — a face we should not crop, a tone you prefer, a detail we should keep crisp, or a sticker placement to highlight. The more specific, the closer the result."

**환불 cutoff**: 인쇄 시작 전 (보통 주문 후 1영업일 이내). policies.md 와 일치.

**예외 처리** (운영 정책):
- 누끼 품질이 낮아 보이는 사진 (저해상도 < 1500px longest edge, 심한 흐림) → 인쇄 시작 전 이메일 재요청 또는 환불 안내
- 사진 갯수가 SKU 와 맞지 않음 (예: Duo 인데 1장만 업로드) → 결제는 통과하지만 운영자가 이메일로 추가 사진 요청
- 디테일 노트가 모순/실현 불가 (예: "사진 색감을 완전히 다르게 보정해주세요" + "원본 그대로 살려주세요") → 이메일로 우선순위 확인
- Pro 로 업그레이드하면 file 갯수 conditional 검증 가능 (필요 시)

**리스크 인식**:
- 모크업 컨펌 없음 = 결과물에 대한 고객 기대 불일치 위험 ↑
- 완화 장치 1: 디테일 노트 placeholder 강한 가이드 (위 문구)
- 완화 장치 2: Refund Policy 의 "PHOTO QUALITY & PERSONAL PREFERENCE" 섹션에 "노트가 모먼트" 라고 명시
- 완화 장치 3: 인쇄 결함 / 부적합 사진은 여전히 무상 재제작 또는 환불

---

## 결정 4. 환불 정책 본문 작성 방식 — ✅ 확정 (직접 작성)

**산출**: [policies.md](policies.md) — Refund / Shipping 직접 작성 완료. Privacy / Terms 는 Shopify "Generate from template" + placeholder 5개 교체 + Terms 에 made-to-order 보호 SECTION X 1개 추가.

---

## 결정 5. 한국어 footer / 페이지 — ✅ 확정 (추가)

**사용자 결정**: 한국어 footer 도 추가 검토하면 좋은 부분.

### 옵션 비교

| 옵션 | 비용 | 운영 부담 | 한인 사용자 UX |
|------|------|-----------|-----------------|
| **A. 영어 페이지 끝에 한국어 요약 4-5줄 추가** | $0 | 낮음 (1회 작성) | 중간 (영어 읽다가 한국어 발견) |
| B. 별도 한국어 페이지 (`/pages/about-ko` 등) | $0 | 중간 (영어/한국어 동기화) | 좋음 (한국어 직진) |
| C. Shopify Translate & Adapt 앱 + 한국어 언어 추가 | $0 (앱 무료) | 중간 (앱 내 번역 관리) | 좋음 (브라우저 자동 매칭) |

### 권장: **A + 향후 C로 확장**

**1차 launch (지금)**: 옵션 **A** — 영어 페이지 끝에 한국어 요약 4-5줄 추가.
- 정책 4종 (Refund / Shipping / Privacy / Terms): 핵심 4-5줄 한국어 요약
- About: 한국어 인사 1-2 문단
- FAQ: 한국어 핵심 Q&A 5-7개
- 산출: [korean_footer_copy.md](korean_footer_copy.md)

**향후 (50건+ 후, 한인 사용자 비중 검증 후)**: 옵션 **C** — Shopify Translate & Adapt 앱 (무료, Shopify 자체 제공) 으로 한국어 언어 추가. Markets → Languages → Korean 추가하면 브라우저 언어 설정 한국어 사용자에게 자동으로 한국어 페이지 노출. 영어 footer 한국어 요약은 그대로 유지하거나 제거.

**근거**:
- 1차 launch 는 한인 사용자 비중 데이터 없음 → 별도 페이지 (B) 또는 다국어 앱 (C) 은 작업량 대비 ROI 불확실
- A 는 1회 작성으로 즉시 효과, 한국어 사용자가 페이지 끝까지 스크롤하면 자연스럽게 발견
- 한국어 사용자 첫 5건 이상 발생하면 → C 로 업그레이드, A 는 페이지 footer 자리에 "한국어로 보기" 버튼 추가

---

## 결정 사항 종합

| # | 결정 | 상태 | 산출 / 액션 |
|---|------|------|-------------|
| 1 | 도메인 vs Payments | ✅ 확정 (도메인 OK / Payments 미연결) | Stage 1D Shopify Payments 활성화 다음 액션 |
| 2 | 사진 업로드 앱 | ✅ 확정 (Customily 보류, **Easify Free** 권장) | 어드민 → Apps → Easify Product Options install |
| 3 | 사진 업로드 방식 | ✅ 확정 (결제 시 inline + **모크업 컨펌 제거**, 디테일 노트로 대체) | 빠른 워크플로우 — 1영업일 안 작업 시작 |
| 4 | 정책 본문 작성 | ✅ 확정 (직접 작성) | [policies.md](policies.md) 작성 완료 |
| 5 | 한국어 footer | ✅ 확정 (옵션 A — 페이지 끝 한국어 요약) | [korean_footer_copy.md](korean_footer_copy.md) 작성 예정 |

**다음 단계**:
- Stage 1D — Shopify Payments 활성화 (사용자 어드민 직접 진행, 사업자 정보 + 캐나다 은행 계좌 입력)
- 활성화 직후 검증: 결제 페이지에 Apple Pay / Google Pay / Shop Pay 노출 확인
- 검증 완료 후 → Stage 1A, 1B, 1C 순차 진행 (병렬 가능)
- Easify Product Options install 은 Stage 2 진입 시점
