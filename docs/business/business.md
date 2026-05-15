# Everstory Studio Business

Everstory Studio 는 토론토 기반 A5 커스텀 사진 다이컷 스티커 브랜드다. 고객 사진을 손으로 정리하고, 한국 프리미엄 substrate 와 자체 제작 파이프라인으로 빠르게 제작해 Ontario 고객에게 배송하거나 Toronto Studio pickup 으로 전달한다.

## Business Definition

**One-liner**

Everstory Studio 는 Toronto GTA + Korean diaspora 를 위한 A5 custom photo die-cut sticker sheet 브랜드다. 한국 프리미엄 substrate, hand cutout, fast turnaround, Toronto local fulfillment, 자체 Adobe automation pipeline 으로 Etsy 자동/AI 셀러와 다른 포지션을 잡는다.

**Target**

- Toronto GTA 와 Ontario 내 커스텀 굿즈 수요
- Korean diaspora
- pet owner, family keepsake, planner/journal 사용자
- 작은 선물, 재주문, 로컬 픽업을 선호하는 고객

**Positioning**

- 자동 마스킹/대량 생산이 아니라 사람이 사진 외곽을 정리한다.
- 한국 inkjet label + lamination 조합으로 사진 품질과 내구성을 강조한다.
- 주문 후 빠르게 제작을 시작하고 Ontario 내 무료 배송 또는 Toronto pickup 으로 전달한다.
- 자체 Photoshop/Illustrator workflow 로 소량 주문을 운영 가능한 단가로 만든다.

## Product

주력 상품은 **A5 custom photo die-cut sticker sheet** 다. 스티커 개수를 고정 판매하지 않고, A5 한 시트 안에 사진 비율과 선택 사이즈에 맞춰 들어가는 다이컷 면적을 판매한다. 상세 SKU, Package upload/pick 규칙, 사진 QC 기준은 [`products.md`](products.md) 를 기준으로 한다.

**MVP mode**

| Mode | Definition | Status |
|------|------------|--------|
| Name Included | 사진 중심 구성 + 상단 production header 에 고객 이름/주문 정보 표기 | MVP |
| Mini Decor | 사진 보조용 미니 데코 추가 | Later |

**Launch SKU**

런칭 SKU는 Face Sticker / Full Body Sticker / Circle Sticker / Package Mini / Package Full 5종이다. 각 SKU의 customer promise, photos selected, sheets, Shopify price 상세는 [`products.md`](products.md) 를 단일 기준으로 한다.

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

**Launch Shopify price**

SKU별 Shopify 가격은 [`products.md`](products.md) 를 단일 기준으로 한다. Launch price 는 첫 50건 동안 유지한다. 후기, UGC, 반복 주문 데이터가 생기면 +$3-5 인상 여지를 검토한다.

**Variable cost baseline**

| Item | Cost |
|------|------|
| Material, lamination, ink, import allocation | $1.45 |
| Packaging | $0.75 |
| Domestic lettermail shipping | $2.00 |
| Equipment depreciation | $1.20 |
| Lost/reprint buffer | $1.00 |
| Total variable cost | $6.40 |

**Margin frame**

| Scenario | Ad cost | Contribution per $15.99 entry order |
|----------|---------|--------------------------------------|
| Organic / community | $0 | +$9.59 |
| Meta ads average | $5 | +$4.59 |
| High CAC | $8 | +$1.59 |

여기서 $15.99 는 [`products.md`](products.md) 의 entry SKU 가격 기준이다 — products.md 가격이 바뀌면 contribution 값도 함께 갱신한다.

인건비는 MVP 검증 단계에서 0 으로 둔다. 이 가정은 장기 수익성 판단이 아니라 첫 50건의 workflow, review, UGC, repeat-order 가능성을 검증하기 위한 출발점이다.

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

Customer-facing fulfillment 기준은 **Ontario free shipping + Toronto Studio pickup** 이다.

- Ontario shipping: Canada Post lettermail, free shipping, no tracking
- Toronto Studio pickup: local pickup option, ready notification after production
- Outside Ontario: MVP launch scope 밖. 예외 주문은 별도 검토

마케팅 언어에서는 Toronto local craft 를 강조한다. 배송 정책에서는 Ontario 범위를 명확히 말한다.

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
- Brand 보이스·표기 기준은 이 문서에 둔다. 색상·타이포·컴포넌트는 Horizon 테마 설정에서 관리하며 MVP 는 테마 기본값을 유지한다.
- Business 문서는 사업 판단에 필요한 현재 기준만 남긴다.
