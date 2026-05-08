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

| 문서 | 역할 | 중요도 | 처리 | 채워야 할 내용 |
|------|------|--------|------|----------------|
| `strategy.md` | 사업 본체 SOT. 사업 정의, 목표, 상품, 장비, 가격, 원가, 채널, 배송, KPI를 한 곳에 둔다. | P0 | 이름 변경 후보: `business.md`. 내용은 강하게 축소·재구성 | Customily/Easify 혼재 제거, GTA/Ontario 기준 확정, 장비/생산 역량/launch KPI 보강 |
| `pending.md` | 사업 미결정만 담는 짧은 큐. 디자인·Shopify 항목은 각 디렉토리로 이동한다. | P1 | 강하게 축소 또는 삭제 | 사업 결정 3개 이하만 남김. 디자인/웹/템플릿 TODO 제거 |

## P0 Cleanup

- `strategy.md` 의 앱 비용과 setup 시퀀스에서 Customily를 현재 운영 기준처럼 쓰는 부분을 제거한다. 현재 Shopify 실행 기준은 Easify이며, 자세한 설정은 `docs/shopify/` 로 보낸다.
- 배송 범위를 하나로 고정한다. 현재 권장 기준은 고객-facing 운영: Ontario free shipping + Toronto Studio pickup, 마케팅 타깃: Toronto GTA + Korean diaspora.
- `strategy.md` 에서 Shopify admin 단계, 페이지 카피, 디자인 세부는 제거하고 사업 판단에 필요한 수준만 남긴다.
- A5 상품 설명은 고객-facing sheet와 실제 Illustrator pack body가 섞이지 않게 표현한다. 비즈니스 문서에서는 "A5 sheet"까지만 말하고, 142 x 175mm body는 운영/디자인 문서로 보낸다.

## P1 Fill

- 사업 목표: 첫 50건의 목적, 후기/UGC/운영 데이터 수집 기준.
- 생산 역량: ET-8550, Summa D75, Adobe/UXP/Illustrator pipeline이 사업에 주는 의미.
- 가격 구조: Solo/Duo/Trio/Memory Pack의 표시가와 net 기준, launch price 이후 인상 조건.
- 채널 전략: Shopify primary, Instagram discovery, Etsy later, local pickup.
- 배송/픽업: Ontario shipping과 Toronto pickup의 운영 기준.

## P2 Later

- 가격이 복잡해지면 `pricing.md` 분리.
- 광고 실험, CAC, cohort KPI는 실제 주문 데이터가 생긴 뒤 별도 문서화.
- B2B/wholesale, bulk pricing, Etsy 확장은 MVP 이후 추가.
