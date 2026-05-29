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
- 어떤 상품 5종을 만들고 어떤 variant/options를 붙이는가
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
| `product_descriptions.md` | 상품 5종 description copy, variant 기준, Easify option set SOT. | P0 | 유지 |
| `policies.md` | Refund, Shipping, Privacy, Terms policy SOT. | P0 | 유지 |
| `pages_copy.md` | About, FAQ, Sizing, Materials page copy SOT. | P1 | 유지 |
| `footer_copy.md` | 한국어 footer copy SOT. | P1 | 유지 |
| `preview.html` | 디자인 토큰 / 컴포넌트 라이브러리 시안. admin 실행에 직접 필요 없음. | P2 | 디자인 정리 후 삭제 또는 갱신 판단 |
| `wireframes/` | Horizon 테마 기반 11페이지 분리 HTML 와이어프레임. Shopify customizer 작업 시 section/block 어휘 매칭 청사진. | P1 | 유지 |
| `instructions/` | Batch 1–10 admin·theme 실행 walkthrough (+ `_PROMPT_TEMPLATE.md` 생성 메타). Batch 10 = Judge.me 리뷰 앱. 입력값은 settings_checklist / product_descriptions / policies / pages_copy / footer_copy SOT 참조. | P0 | 유지 |
| `everstory_product_detail_*.html` | 상품 상세 PDP HTML 시안 (full KO / full EN / pdp_block), 브랜드 토큰 기반. | P1 | 유지 |
| `horizon_wireframe_application_plan.md` | Shopify 문서·wireframe → Horizon 테마 적용 매핑 플랜 (5-product). | P1 | 유지 |

> instructions/ 의 "Batch N" 은 위 SOT 문서를 admin/theme 에서 실행하는 walkthrough 단위다. settings_checklist.md 의 "Stage 1 (1A–1J)" 값을 §단위로 참조하며 (`01:§1A–1D`, `02:§1E–1J`), 값/절차를 분리해 SOT 단일화를 유지한다.

## Remaining Work

현재 Shopify MVP 실행 문서의 P0/P1 정리는 완료된 상태로 본다. 남은 항목은 MVP 이후 고도화와 시안 파일 정리 판단이다.

## P2 Later

- Theme customization, advanced sections, Liquid component implementation.
- Shopify Flow 자동 태그 고도화.
- Translate & Adapt 한국어 전체 페이지 전환.
- Customily 또는 live preview 앱 전환.
- Meta Pixel, newsletter, review app, Etsy sync.
- `preview.html` 의 과거 proof approval 흐름은 MVP 실행 문서에서 제외되어 있으므로, 디자인 재사용 가치가 없으면 삭제한다.

### 외부 피드백 반영 (2026-05, 지인 피드백)

외부 사용자 피드백을 트리아지한 항목이다. 전부 P2(MVP 이후)로 두되, "우선"·"빠른 수확" 표시는 MVP 이후 먼저 처리 권장. 확정되면 해당 SOT(product_descriptions / pages_copy 등)나 라이브 실행으로 위임하고 본 표에서 뺀다.

| 묶음 | 항목 | 메모 |
|------|------|------|
| 사이즈 직관성 | PDP 미리보기에 아이폰 대비 목업 + mm/in 사이즈 표기. 이미지별 사이즈 게시로 주문 직관성 확보 | 아이폰 비교가 가장 직관적. 목업 에셋 1회 제작 → 다수 SKU 재사용 |
| 소재 정합성 | 종이재질(소재) 이미지 ↔ 설명 불일치 정리 | **우선** (고객 혼동). product_descriptions.md / pages_copy(Materials) ↔ 라이브 이미지 정합성 점검 |
| 채널 품질 | 인스타 업로드 시 사진 깨짐 해결 (export 해상도·비율) | **빠른 수확**. 해결책 → [`../design/photography.md`](../design/photography.md) "Instagram 업로드 (화질 깨짐 방지)" |
| 채널 확장 | FB/IG shop 등 세일즈 채널 업데이트 | 위 "Meta Pixel … Etsy sync" 와 연계 |
| 리뷰·UGC | 프로덕트별 리뷰 + 고객 실사용 사진 노출 | 위 "review app" 구체화 — UGC 사진 수집·전시 포함 |

#### 리뷰·UGC 앱 후보 (리서치 2026-05)

스티커는 비주얼 상품이라 "고객 실사용 사진(UGC) 캡처"가 피드백의 핵심 목표다. 런칭 단계(저 GMV) 기준 후보:

| 앱 | 요금(시작) | 특징 | 현 단계 적합성 |
|----|-----------|------|----------------|
| **Judge.me** | 무료 ~ $15/mo | 사진 리뷰 + UGC 갤러리 + 구조화 스니펫, 가장 저렴 | **런칭 추천** |
| Loox | $9.99 ~ $34.99/mo | 사진·비디오 리뷰 특화, 캡처율 높음 | Meta 사진광고 본격화 시 재검토 |
| Okendo / Yotpo | $19 / 엔터프라이즈+ | 통합 깊이(Klaviyo·Meta 카탈로그·로열티) | 고 GMV 단계 — 현재 과함 |

- **결정 (2026-05-29): Judge.me Forever Free** 로 런칭 (사진 리뷰·UGC·rich snippet 충족). 사진 기반 Meta 광고 본격화 시 Loox 재검토. 설치 walkthrough → [`instructions/10_judgeme_reviews.md`](instructions/10_judgeme_reviews.md).
  - 무료 티어 범위: 무제한 리뷰·리뷰요청 이메일, 사진 리뷰, SEO rich snippet. 제외(=$15 Awesome): 비디오 리뷰, Q&A, 리뷰 캐러셀 위젯, 풀 CSS, "Powered by Judge.me" 배지 제거.

#### FB/IG shop 셋업 순서 (리서치 2026-05)

- **앱**: "Facebook & Instagram by Meta" 세일즈 채널 — 전 Shopify 플랜 무료. 위 "Meta Pixel … Etsy sync" 와 동일 인프라(Pixel) 공유.
- **선행조건**: Meta Business + Commerce Manager 계정, Meta Pixel/Conversions API, IG 프로페셔널 계정, 비즈니스+도메인 인증, 상품 카탈로그.
- **순서**: 채널 설치 → Start setup → FB 비즈니스 페이지·IG 비즈니스 연결 → Commerce Manager 카탈로그 자동 생성/동기화 → shop 심사 제출 → 승인 후 게시물 제품 태깅.
- **비고**: shop 심사 최대 4주 → 일찍 시작. Toronto(캐나다) 지원됨. 2026-03 기준 Instagram 이 정식 세일즈 채널로 전환됨.
