# Business Documentation Plan

이 문서는 `docs/business/` 를 사업 판단용 문서로 정리하기 위한 기준이다. 실행 로그나 변경 이력은 남기지 않는다. 현재 기준만 남기고, Shopify 어드민·앱·페이지 카피·디자인 세부는 각 전용 디렉토리로 이관한다.

## Priority Model

| Priority | 의미 | 처리 기준 |
|----------|------|-----------|
| P0 | 문서 신뢰성을 깨는 충돌 | 다음 정리 단계에서 반드시 먼저 해결 |
| P1 | MVP 실행 전 필요한 누락 | launch 전까지 채움 |
| P2 | 확장·품질 개선 | MVP 이후 가능 |

## Business Scope

비즈니스 문서는 다음 질문에 답해야 한다.

- 우리는 어떤 사업을 하는가
- 어떤 고객에게 무엇을 파는가
- 어떤 장비와 생산 역량으로 운영하는가
- 어떤 가격·원가·마진 구조로 시작하는가
- 어떤 채널과 플랫폼에서 판매하는가
- 배송·픽업·런칭 목표는 무엇인가

비즈니스 문서에서 제외한다.

- Easify / Customily 설정값, Shopify 앱 비교, product option 상세
- Shopify admin 경로, checkout 설정, policy 입력 절차
- 페이지별 카피, footer copy, design token, UI 컴포넌트 기준
- 과거 변경 이력, ADR, 오래된 계획 문구

## Document Layers

비즈니스 문서는 다음 의존 계층을 따른다. 의존 방향은 **위→아래로 input 만** — 아래 layer 가 위를 참조한다. raw 값은 절대 두 곳에 중복 박지 않는다.

| Layer | 문서 | 역할 |
|-------|------|------|
| 1 · Fact | `products.md` | 상품 fact (SKU·옵션·가격·QC·운영 정책) |
| 1 · Fact | `expenses.md` | 비용 fact (영수증·인보이스·환율·청구액) |
| 2 · Plan | `business.md` | Layer 1 input → 사업 정의·원가/마진 모델·채널·런칭 |
| 3 · Open | `pending.md` | Layer 1/2 가 → pending 으로 위임한 미확정·측정·결정 보류 SOT. 닫히면 원래 SOT 로 이동 |
| 0 · Meta | `plan.md` | 문서 목적·중요도·계층 (본 문서) |

## Document Purpose Table

| 문서 | 역할 | 중요도 | 처리 |
|------|------|--------|------|
| `products.md` | 상품 상세 SOT. Launch SKU, Package 구조, upload/pick 규칙, 사진 QC, 가격 가정을 둔다. | P0 | 유지 |
| `expenses.md` | 영수증·인보이스·구독 raw SOT. CapEx 취득가, 자재 인보이스, 변동 부대비 운임, OPEX 청구액. 원가·마진 계산의 input. | P0 | 유지 |
| `business.md` | 사업 본체 SOT. 사업 정의, 장비, 원가·마진 도출, 채널, 배송, 런칭 목표. raw 단가는 박지 않고 `products.md` · `expenses.md` 인용. | P0 | 유지 |
| `pending.md` | Layer 1/2 가 → pending 으로 위임한 미확정·측정·결정 보류 항목 SOT. 닫히면 원래 문서로 이동. | P0 | 유지 |

## Remaining Work

현재 open P0/P1 없음 — 4 문서(`products.md` · `expenses.md` · `business.md` · `pending.md`) 의존 계층 정합성 점검 완료 기준.

## P2 Later

- 가격이 복잡해지면 `pricing.md` 분리.
- 광고 실험, CAC, cohort KPI는 실제 주문 데이터가 생긴 뒤 별도 문서화.
- B2B/wholesale, bulk pricing, Etsy 확장은 MVP 이후 추가.
