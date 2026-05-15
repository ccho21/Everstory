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

## Document Purpose Table

| 문서 | 역할 | 중요도 | 처리 |
|------|------|--------|------|
| `business.md` | 사업 본체 SOT. 사업 정의, 장비, 원가, 마진, 채널, 배송, 런칭 목표를 둔다. 상품 상세·가격은 `products.md` 참조. | P0 | 유지 |
| `products.md` | 상품 상세 SOT. Launch SKU, Package 구조, upload/pick 규칙, 사진 QC, 가격 가정을 둔다. | P0 | 유지 |

## Remaining Work

현재 open P0/P1 없음 — `business.md` ↔ `products.md` 정합성 점검 완료 기준.

## P2 Later

- 가격이 복잡해지면 `pricing.md` 분리.
- 광고 실험, CAC, cohort KPI는 실제 주문 데이터가 생긴 뒤 별도 문서화.
- B2B/wholesale, bulk pricing, Etsy 확장은 MVP 이후 추가.
