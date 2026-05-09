# Shopify Documentation Plan

이 문서는 `docs/shopify/` 를 Shopify admin 실행과 MVP 기능 구현 문서로 정리하기 위한 기준이다. 지금 단계의 초점은 스토어가 주문을 받을 수 있게 만드는 것이다. 고도화, 테마 확장, 마케팅 자동화는 낮은 우선순위로 둔다.

## Priority Model

| Priority | 의미 | 처리 기준 |
|----------|------|-----------|
| P0 | admin 실행이나 고객-facing 정책을 헷갈리게 하는 충돌 | 다음 정리 단계에서 반드시 먼저 해결 |
| P1 | MVP 주문 수집에 필요한 누락 | launch 전까지 채움 |
| P2 | 고도화·자동화·확장 | MVP 이후 가능 |

## Shopify Scope

Shopify 문서는 다음 질문에 답해야 한다.

- admin에서 어떤 순서로 무엇을 설정하는가
- 결제, 세금, 배송, 픽업, 마켓, 계정 설정은 어떤 값인가
- 어떤 상품 4종을 만들고 어떤 variant/options를 붙이는가
- Easify로 사진 업로드와 주문 노트를 어떻게 받는가
- 정책/페이지/상품 카피는 어디에서 복사해 붙이는가
- 테스트 주문은 어떻게 통과시키는가

Shopify 문서에서 제외한다.

- 사업 원가와 장기 채널 전략
- 브랜드 스타일 원칙과 디자인 토큰 설명
- Illustrator/Photoshop 운영 코드 상세
- Customily 전환, Translate & Adapt, theme 고도화 같은 MVP 이후 작업의 상세 구현

## Document Purpose Table

| 문서 | 역할 | 중요도 | 상태 |
|------|------|--------|------|
| `plan.md` | Shopify 문서 범위와 남은 작업 우선순위. | P0 | 유지 |
| `settings_checklist.md` | Shopify admin 실행 SOT. Settings 1A-1J 입력값과 통합 smoke test. | P0 | 유지 |
| `product_descriptions.md` | 상품 4종 description copy, variant 기준, Easify 최소 option set SOT. | P0 | 유지 |
| `policies.md` | Refund, Shipping, Privacy, Terms policy SOT. | P0 | 유지 |
| `pages_copy.md` | About, FAQ, Sizing, Materials page copy SOT. | P1 | 유지 |
| `footer_copy.md` | 한국어 footer copy SOT. | P1 | 유지 |
| `preview.html` | 디자인 토큰 / 컴포넌트 라이브러리 시안. admin 실행에 직접 필요 없음. | P2 | 디자인 정리 후 삭제 또는 갱신 판단 |
| `wireframes/` | Horizon 테마 기반 11페이지 분리 HTML 와이어프레임. Shopify customizer 작업 시 section/block 어휘 매칭 청사진. | P1 | 유지 |

## Remaining Work

현재 Shopify MVP 실행 문서의 P0/P1 정리는 완료된 상태로 본다. 남은 항목은 MVP 이후 고도화와 시안 파일 정리 판단이다.

## P2 Later

- Theme customization, advanced sections, Liquid component implementation.
- Shopify Flow 자동 태그 고도화.
- Translate & Adapt 한국어 전체 페이지 전환.
- Customily 또는 live preview 앱 전환.
- Meta Pixel, newsletter, review app, Etsy sync.
- `preview.html` 의 과거 proof approval 흐름은 MVP 실행 문서에서 제외되어 있으므로, 디자인 재사용 가치가 없으면 삭제한다.
