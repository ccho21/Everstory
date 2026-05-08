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

| 문서 | 역할 | 중요도 | 처리 | 채워야 할 내용 |
|------|------|--------|------|----------------|
| `plan.md` | Shopify 문서 정리 기준과 작업 우선순위. | P0 | 신설 유지 | admin 실행 SOT와 copy SOT 역할 구분 |
| `settings_checklist.md` | Shopify admin 실행 SOT. Settings 1A-1J 입력값과 검증. | P0 | 유지, 최신 기준으로 정리 | Ontario vs GTA 표현 통일, Stage 2 연결 문구 최신화 |
| `product_descriptions.md` | 상품 4종 description copy SOT. Shopify product page에 붙여넣는 본문. | P0 | 유지, copy 충돌 제거 | approval/mockup 문구 삭제, Easify/order notes 기준 반영 |
| `policies.md` | Refund, Shipping, Privacy, Terms policy SOT. | P0 | 유지 | no mockup approval, Ontario shipping, photo rights 기준 일치 |
| `pages_copy.md` | About, FAQ, Sizing, Materials page copy SOT. | P1 | 유지 | FAQ와 policy의 shipping/lead time 표현 일치 |
| `footer_copy.md` | 한국어 footer copy SOT. | P1 | 유지, 선택 표현 축소 | 실제 적용 위치와 적용 전제 명확화 |
| `admin_setup_plan.md` | 과거 통합 실행 plan. `settings_checklist.md`와 중복이 많다. | P0 | 삭제 또는 강한 축소 | 고유 정보만 `plan.md`/`settings_checklist.md`로 흡수 |
| `preview.html`, `wireframes.html` | 시각 시안. admin 실행에는 직접 필요 없음. | P2 | 유지 가능 | 디자인 정리 후 필요 없으면 삭제 후보 |

## P0 Cleanup

- `admin_setup_plan.md` 의 중복 정보를 줄인다. Shopify 실행값은 `settings_checklist.md`로, 문서 정리 기준은 이 파일로, 사업 판단은 `docs/business/`로 이동한다.
- 배송 기준을 통일한다. 현재 권장 기준은 Ontario free shipping + Toronto Studio pickup.
- `product_descriptions.md` 의 "reviewed, mocked up, and approved before print" 문구를 제거한다.
- `settings_checklist.md`, `policies.md`, `pages_copy.md`, `product_descriptions.md` 의 lead time과 shipping 표현을 맞춘다.
- Customily는 현재 실행 기준에서 제거한다. 현재 MVP 앱은 Easify Product Options Free plan.

## P1 Fill

- Easify option set 최소 설정: photo upload, customer/pet name, special instructions.
- Product 4종 등록 기준: Solo, Duo, Trio, Memory Pack; size 6; material 4; made-to-order.
- Test order acceptance: Toronto/Ontario address, HST, payment, attached option data, email confirmation.
- Policy placeholder 교체 목록: email, address, business number, jurisdiction.

## P2 Later

- Theme customization, advanced sections, Liquid component implementation.
- Shopify Flow 자동 태그 고도화.
- Translate & Adapt 한국어 전체 페이지 전환.
- Customily 또는 live preview 앱 전환.
- Meta Pixel, newsletter, review app, Etsy sync.
