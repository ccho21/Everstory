# Everstory Studio Business

Everstory Studio 는 토론토 기반 A5 커스텀 사진 다이컷 스티커 브랜드다. 고객 사진을 손으로 정리하고, 한국 프리미엄 substrate 와 자체 제작 파이프라인으로 빠르게 제작해 캐나다 전역으로 배송하거나 local pickup (by arrangement) 으로 전달한다.

## Business Definition

**One-liner**

Everstory Studio 는 Toronto GTA + Korean diaspora 를 위한 A5 custom photo die-cut sticker sheet 브랜드다. 한국 프리미엄 substrate, hand cutout, fast turnaround, Toronto local fulfillment, 자체 Adobe automation pipeline 으로 Etsy 자동/AI 셀러와 다른 포지션을 잡는다.

**Target**

- Toronto GTA 와 캐나다 내 커스텀 굿즈 수요
- Korean diaspora
- pet owner, family keepsake, planner/journal 사용자
- 작은 선물, 재주문, 로컬 픽업을 선호하는 고객

**Positioning**

- 자동 마스킹/대량 생산이 아니라 사람이 사진 외곽을 정리한다.
- 한국 inkjet label + lamination 조합으로 사진 품질과 내구성을 강조한다.
- 주문 후 빠르게 제작을 시작하고 캐나다 전역 무료 배송 또는 local pickup (by arrangement) 으로 전달한다.
- 자체 Photoshop/Illustrator workflow 로 소량 주문을 운영 가능한 단가로 만든다.

## Product

주력 상품은 **A5 custom photo die-cut sticker sheet** 다. 스티커 개수를 고정 판매하지 않고, A5 한 시트 안에 사진 비율과 선택 사이즈에 맞춰 들어가는 다이컷 면적을 판매한다. 상세 SKU, Package upload/pick 규칙, 사진 QC 기준은 [`products.md`](products.md) 를 기준으로 한다.

**MVP mode**

| Mode | Definition | Status |
|------|------------|--------|
| Name Included | 사진 중심 구성 + 상단 production header 에 고객 이름/주문 정보 표기 | MVP |
| Mini Decor | 사진 보조용 미니 데코 추가 | Later |

**Launch SKU**

런칭 SKU는 Face Sticker / Full Body Sticker / Shape Sticker / Package Mini / Package Full 5종이다. 각 SKU의 customer promise, photos selected, sheets, Shopify price 상세는 [`products.md`](products.md) 를 단일 기준으로 한다.

**Customer-facing options**

- 비-Package 상품: Size / Material 옵션 값은 [`products.md`](products.md) 를 단일 기준으로 한다. 사진 개수 variant label은 `Photos to include`를 권장한다.
- Package 상품: Big / Medium / Small print tier 별 photo upload. 최종 사진 선택과 layout은 Studio가 결정한다.
- Internal production cut margin is not a customer option.

## Production Assets

**Core equipment**

| Asset | Business role |
|-------|---------------|
| Epson ET-8550 | In-house photo print production |
| Summa D75 | In-house kiss-cut workflow with CutContour spot recognition |
| Adobe Photoshop | Manual cutout and photo preparation |
| Adobe Illustrator | A5 sheet layout, cutline generation, print/cut file output |
| UXP panel + ExtendScript | Repeatable production pipeline and low-labor batch handling |

**Production capability**

- Phase 0: 수동 Photoshop cutout and correction
- Phase A: Photoshop UXP export of clean PSD + silhouette PNG
- Phase B: Illustrator sheet generation, kiss-cut layer, output AI file
- Production speed depends primarily on manual cutout time and photo quality.

## Pricing And Cost

**Shopify price**

SKU별 Shopify 가격은 [`products.md`](products.md) 를 단일 기준으로 한다.

**Cost Model**

원가는 성격이 다른 비용을 분리해 본다. **단위경제(주문·장당 변동비)** 와 **월 고정비(손익분기 물량으로 회수)** 는 다른 축이다. 인건비는 이 모델 밖 — MVP 검증 단계 $0 가정, 실제 cutout time 은 first-50 실측 ([`pending.md`](pending.md) 누끼 항목). 미확정·측정 대기 값은 본 표에 넣지 않고 [`pending.md`](pending.md) 에 둔다. 가격·SKU 는 [`products.md`](products.md) 단일 기준.

_기준 가정_

- 환율 working basis: 1 CAD = 1,095.47 KRW (raw → [`expenses.md`](expenses.md), 변동).
- 수율: A4 미디어 1장 → A5 완성품 1장 (커터 여백·레지스트레이션·kiss-cut 클리어런스 = 불가피한 폐기).
- 라미네이션: 전 SKU 필수. 인쇄 라벨 위 한국 프리미엄 라미 1겹 적층 (옵션 아님).
- 수입: 라벨·라미 모두 한국 수입, 합산 중량 묶음 배송 (≥300매, 가능 시 ≥600매).

_1. 소모품 — 주문·장당 변동 (인건비 제외)_

raw 단가는 [`expenses.md`](expenses.md) §2 단일 기준. 본 표는 카테고리·상태만 — 숫자 중복 없음.

| 항목 | raw 위치 | 상태 |
|------|---------|------|
| 인쇄 라벨 RV611LU / CJ611SH (A4, 1라벨/장) | [`expenses.md`](expenses.md) §2.1 | 확정 (인보이스) |
| 라미 무광엠보손코팅지 (필수 적층, A4) | [`expenses.md`](expenses.md) §2.1 | 확정 (인보이스) |
| 잉크 Epson 552 5-pack | [`expenses.md`](expenses.md) §2.2 | 5-pack 확정 / 장당 측정 → `pending.md` |
| 포장재 | [`expenses.md`](expenses.md) §2.3 | 사양 미정 → `pending.md` |
| 분실/재인쇄 충당 | [`expenses.md`](expenses.md) §2.4 | 운영 가정 |

_2. 변동 부대비 — 항상 들지만 고정 아님_

raw 운임·요율은 [`expenses.md`](expenses.md) §3 단일 기준. 본 표는 카테고리·배부 단위만.

| 항목 | 배부 단위 | raw 위치 |
|------|----------|---------|
| 해외배송 EMS | 장당 (수입 batch ÷ 매수) | [`expenses.md`](expenses.md) §3 |
| 캐나다 내 출고배송 | 주문당 | [`expenses.md`](expenses.md) §3 |
| 결제·플랫폼 수수료 | 판매가 × 요율 | [`expenses.md`](expenses.md) §3 |
| 관세·HST + handling | 장당 (반입 batch ÷ 매수) | [`expenses.md`](expenses.md) §3 |

자재 landed (300매·RV611LU + 필수 라미): 라벨 ≈ C$0.89 + 라미 ≈ C$0.77 ≈ **C$1.6–1.7/완성장** (합산수입 시 ~C$1.4–1.6).
직접원가 1장 주문 (RV611LU, 인건비 제외) = 자재 landed + 잉크 + 포장 + 재인쇄 ≈ **C$3.3–3.8** (잉크 실측 시 확정).

_3. 월 고정 운영비 (OPEX) — 손익분기 물량으로 회수_

판매와 무관하게 매월 발생. 건당이 아니라 **월 총액 ÷ 월 예상 물량** 으로 배부. 단위-운영(주문·제작 필수)과 사업고정비(전사·개발 도구) 구분.

| 항목 | 성격 | 배부 |
|------|------|------|
| Shopify 기본 + Easify Premium | 단위-운영 (주문 수령 필수) | 월 주문 수 |
| Adobe CC (PS+AI) | 단위-운영 (Phase 0/B 제작) | 월 제작 장수 |
| Claude Max 5x | 사업고정비 / 제작·기획·CS 도구 | 월 물량, Everstory 전용 비중만 |
| Codex (ChatGPT) Plus | 사업고정비 / 개발·자동화 도구 | 월 물량, Everstory 전용 비중만 |
| 도메인 | 연 고정비 | ÷12 월환산 |
| 기타 (이메일·회계·폰트·스토리지 등) | 운영비 | 월 합산 |

실청구액(CAD)·플랜·전용 비중 → [`expenses.md`](expenses.md) §4. "기타" 실항목 정의·발굴 → [`pending.md`](pending.md). 배부는 월 합 ÷ 월 물량 — 100/300/600장 시나리오로 본다 (물량 적을수록 장당 폭증, 22건/월이면 소프트 고정비만으로 장당 부담 큼).

_4. 장비 — CapEx → 감가 배부_

| 장비 | 역할 | 취득가·내용연수 |
|------|------|------------------|
| Epson ET-8550 | 인쇄 | 취득가 → [`expenses.md`](expenses.md) / 내용연수 → `pending.md` |
| Summa D75 | kiss-cut | 취득가 → [`expenses.md`](expenses.md) / 내용연수 → `pending.md` |

전체 CapEx 영수증(Production·Tools·Compute)은 [`expenses.md`](expenses.md) §1. 내용연수·감가 정책 확정 후 월 감가 → 건당 배부 산출.

> 가격 결정(엔트리가·번들 구성·목표 마진)은 본 문서에 박지 않는다. 확정 시 [`products.md`](products.md)(가격)·본 절(마진)에 결과만 기록 — 미확정 결정을 SOT 에 누적하지 않는다.

## Channels

| Channel | Role | Status |
|---------|------|--------|
| Shopify | Primary checkout and brand home | MVP |
| Instagram | Discovery and proof of work | MVP |
| Korean community / KakaoTalk | Local demand and first orders | MVP |
| Etsy | Secondary marketplace traffic | Later |
| Local pickup | Trust and margin support | MVP |

Shopify 는 결제와 브랜드 신뢰의 중심이다. Instagram 과 커뮤니티 채널은 discovery 역할만 맡고, 주문은 Shopify 로 모은다.

## Shipping And Pickup

Customer-facing fulfillment 기준은 **Canada-wide free shipping + local pickup (by arrangement)** 이다.

- Canada-wide shipping: Canada Post lettermail, free shipping, no tracking. Lettermail 단가는 거리 무관 동일 (province 별 차이 없음).
- Local pickup (by arrangement): 결제 후 이메일로 픽업 장소·시간 협의. 가정집 주소 자동 공유 안 함. 실질 운영은 토론토 인근 지인 위주.
- International (US, Korea 등): MVP launch scope 밖. 예외 주문은 이메일로 별도 검토.

마케팅 언어에서는 Toronto local craft 를 강조한다. 배송 정책에서는 Canada 범위를 명확히 말한다.

## Launch Goals

**First 50 orders**

- production workflow 검증
- photo quality 기준 검증
- customer notes 방식 검증
- review / UGC / repeat-order 가능성 확보
- 실제 cutout time 과 reprint rate 기록

**First quarter target**

- 광고 없이 월 22건 수준의 organic/community 주문을 목표로 한다.
- Meta ads 는 workflow와 product-market signal이 확인된 뒤 테스트한다.

## Operating Principles

- Shopify 앱, admin setting, policy input detail 은 `docs/shopify/` 에 둔다.
- Business 문서는 사업 판단에 필요한 현재 기준만 남긴다.
