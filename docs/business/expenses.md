# Expenses — 영수증·인보이스·구독 raw

**영수증·인보이스·청구서 raw 값의 단일 출처**. 본 문서는 자립적인 raw SOT — 분류·배부·도출 모델은 [`business.md`](business.md) *Pricing And Cost* 가 본 문서를 input 으로 참조한다. SKU별 가격은 [`products.md`](products.md).

## 기준

- 통화 표기는 영수증 출처 통화 그대로 (CAD/USD/KRW). 환산이 필요하면 옆 칸에 병기.
- 환율 working basis (raw SOT): **1 CAD = 1,095.47 KRW**. 변동.
- "+ tax" 표기는 영수증이 세전가일 때만. Ontario HST 13% 가산 가정.
- 미수집/미상은 빈 칸이 아니라 `—` 로 두고, 채워야 할 자리임을 명시.

## 1. CapEx — 장비·도구 (1회 취득)

내용연수·감가 방식은 미정 → 정책은 [`pending.md`](pending.md). 본 표는 **취득가 원본** SOT.

_1.1 Production equipment — 인쇄·컷팅·후처리_

| Item | Vendor | Currency | Amount | Note |
|------|--------|---------:|-------:|------|
| Epson ET-8550 (printer) | Best Buy | CAD | 881.39 | 본체 |
| Summa D75 (kiss-cut cutter) | — | CAD | 4,167.44 | 본체 |
| Dahle trimmer | — | CAD | 343.52 | 시트 트리밍 |
| Laminator | Amazon | CAD | 153.67 | 라미 적층 장비 |
| Corner cutter | Amazon | CAD | 23.73 | 모서리 둥글이 |

소계: **C$5,569.75**

_1.2 Tools & finishing aids — 자·가위·매트_

| Item | Vendor | Currency | Amount |
|------|--------|---------:|-------:|
| Olfa rotary ruler | Amazon | CAD | 33.89 |
| Dritz ruler | Amazon | CAD | 56.49 |
| Olfa scissors | Amazon | CAD | 28.23 |
| Cutting mat | Amazon | CAD | 21.45 |

소계: **C$140.06**

_1.3 Compute — 컴퓨터·디스플레이·입력_

| Item | Vendor | Currency | Amount | Note |
|------|--------|---------:|-------:|------|
| Mac Pro | Apple | CAD | 2,371.87 | Adobe 파이프라인 host |
| Monitor | Amazon | CAD | 677.99 | |
| Logitech Mouse 2 | Best Buy | CAD | 96.98 | **+ tax 별도** (Ontario HST 13%) |

소계 (세전): **C$3,146.84** (+ Mouse tax)

**CapEx 합계 (세전, Mouse tax 제외): C$8,856.65**

## 2. 변동비 — 자재 (인보이스 단가)

수입 전략: 합산 ≥300매, 가능 시 ≥600매 단위로 EMS 묶음 배송.

_2.1 한국 수입 자재 — anysheet.co.kr_

| Item | Spec | Unit | Price (KRW) | 매당 (KRW) | 매당 (CAD) | Note |
|------|------|------|------------:|----------:|----------:|------|
| 애니시트 무광엠보손코팅지 (라미) | A4, 인쇄 라벨 위 적층, 전 SKU 필수 | 100매 | 20,000 | 200 | ≈ 0.18 | 100매 ≈ 2kg, 해외배송비 별도 |
| 아이라벨 시치미 RV611LU | 흰색 광택 방수 잉크젯, A4 210×297, 1라벨/장 | 300매 | 171,600 | 572 | ≈ 0.52 | 당일출고 (16시 마감) |
| 아이라벨 CJ611SH | 은색 홀로그램 방수 잉크젯, A4, 1라벨/장 | 300매 | 151,200 | 504 | ≈ 0.46 | 당일출고 (16시 마감) |

_2.2 잉크 — Epson 정품_

| Item | Code | Currency | Pack price | 장당 잉크비 |
|------|------|---------:|----------:|-----------:|
| Epson 552 Colour Ink Bottles, C/M/Y/Pk/Gy 5-Pack | T552920-S | CAD | 145.29 | — (실측 전 → [`pending.md`](pending.md)) |

_2.3 포장재_

사양 미정. 추정 범위 **C$0.50–0.75/주문**. 사양 확정 시 본 표에 반영 → 추적은 [`pending.md`](pending.md).

_2.4 분실·재인쇄 충당_

| Item | Basis | Amount |
|------|-------|-------:|
| 분실/재인쇄 충당 | 주문당 lost-mail 버퍼 단일 정의 | C$1.00 / 주문 |

수율 (참고): A4 미디어 1장 → A5 완성품 1장 (커터 여백·레지스트레이션·kiss-cut 클리어런스 폐기로 A4 써도 실질 A5).

## 3. 변동 부대비 — 운임·수수료

자재(§2) 외 주문·물량에 따라 들어가는 변동비. raw 운임·요율·추정 범위 SOT. 장당 vs 주문당 배부 정의는 [`business.md`](business.md) → *Pricing And Cost*.

| 항목 | 기준·요율 | Amount | Status |
|------|----------|--------|--------|
| EMS 해외배송 | 우체국 비서류·물품요금 + 캐나다 항공추가운임 6,100원/kg, 과금중량 올림 | 300매 ≈ C$0.35–0.37/매, 100매 ≈ C$0.55–0.61/매 | 방법론 추정 / ≥600매 실측 → [`pending.md`](pending.md) |
| 캐나다 내 출고배송 | Canada Post lettermail, Ontario 무료배송 자체 부담 | ≈ C$2.00 / 주문 | 확정 기준 |
| 결제·플랫폼 수수료 | 판매가 × 요율 | 판매가의 약 3–5% | 정확 요율 → [`pending.md`](pending.md) |
| 관세·HST + Canada Post handling | 반입 batch 기준 장당 | ≈ C$0.10–0.15 / 매 (300매 기준) | 미실측 → [`pending.md`](pending.md) |

## 4. OPEX — 월 구독·고정비

본 표는 **플랜 + 실청구액**의 SOT. 청구액(CAD) 미수집 항목은 `—` 로 두고 청구서 수령 후 채운다.

| Item | Plan | Billing currency | Monthly | Everstory 비중 | Note |
|------|------|-----------------:|--------:|---------------:|------|
| Shopify | Basic + Easify Premium 포함 | — | — | 100% | 단위-운영 (주문 수령 필수) |
| Adobe CC | PS + AI | — | — | 100% | 단위-운영 (Phase 0/B 제작) |
| Claude Max | 5x | USD | — | 80% | 사업고정비 / 제작·기획·CS 도구. Everstory 전용 비중만 배부 |
| Codex (ChatGPT) | Plus | USD | — | 80% | 사업고정비 / 개발·자동화 도구. Everstory 전용 비중만 배부 |
| 도메인 | 연 결제 | — | — | 100% | ÷12 월환산 |
| 기타 (이메일·회계·폰트·스토리지 등) | — | — | — | — | 항목 발굴 → [`pending.md`](pending.md) |

미수집: 청구서 수령 후 Monthly 칸 채움. "기타" 실항목 (이메일/회계/폰트/스토리지/etc) 발굴·확정은 [`pending.md`](pending.md).

## 5. 참고

본 문서 raw 값은 [`business.md`](business.md) *Pricing And Cost* 에서 자재 landed → 직접원가 → OPEX/CapEx 배부 → 마진 계산의 input 으로 들어간다. SKU별 가격은 [`products.md`](products.md). 미확정·측정 대기는 [`pending.md`](pending.md).
