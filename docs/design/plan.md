# Design Documentation Plan

이 문서는 `docs/design/` 을 템플릿, Shopify 페이지, 촬영, 브랜드 자산 제작 기준으로 정리하기 위한 기준이다. 디자인 문서는 현재 스타일을 실행 가능한 규칙으로 남긴다. 변경 이력이나 과거 ADR은 남기지 않는다.

## Priority Model

| Priority | 의미 | 처리 기준 |
|----------|------|-----------|
| P0 | 현재 스타일 기준을 흐리는 충돌 | 다음 정리 단계에서 반드시 먼저 해결 |
| P1 | 템플릿·페이지 제작 전에 필요한 누락 | MVP 디자인 적용 전까지 채움 |
| P2 | 품질·확장성 개선 | MVP 이후 가능 |

## Design Scope

디자인 문서는 다음 질문에 답해야 한다.

- Everstory의 시각 톤은 무엇인가
- 어떤 로고, 폰트, 색상, 레이아웃 규칙을 쓰는가
- Illustrator 시트 템플릿과 Shopify 페이지가 같은 브랜드로 보이려면 무엇을 지켜야 하는가
- 어떤 사진을 촬영하고 어떤 사진은 피해야 하는가
- 웹 UI 컴포넌트는 어떤 이유로 그런 형태를 갖는가

디자인 문서에서 제외한다.

- 사업 가격, 원가, 채널 전략
- Shopify admin 설정 경로와 앱 설치 절차
- 붙여넣기용 정책/상품/FAQ 카피 본문
- 과거 mockup approval workflow와 변경 이력

## Document Purpose Table

| 문서 | 역할 | 중요도 | 처리 | 채워야 할 내용 |
|------|------|--------|------|----------------|
| `brand.md` | 디자인 SOT. 브랜드 톤, 워드마크, typography, color, layout, sheet footer 기준을 둔다. | P0 | 유지, 사업 설명은 최소화 | A5 sheet 외형과 pack body 구분, web typography lock 여부, logo asset 기준 |
| `voice.md` | 카피 톤 운영 규칙. 상품/웹/이메일 문장이 통과해야 할 기준을 둔다. | P0 | 유지, 예시 교체 | mockup approval 예시 제거, no-approval order notes 기준 예시 추가 |
| `pages.md` | Shopify 페이지 구조와 SEO/H1/CTA 기준. 실제 본문은 `docs/shopify/` 에 둔다. | P0 | 유지, copy 충돌 정리 | Terms meta의 mockup approval 제거, Shipping 문구를 Ontario 기준과 맞춤 |
| `photography.md` | 촬영 디렉션. 제품 사진, lifestyle, about 이미지 제작 기준. | P1 | 유지, 짧게 정리 | 필수 shot 우선순위, asset naming, Shopify 사용 위치 |
| `components.md` | UI component rationale. 실제 Liquid spec이 생기기 전까지 의도만 보존. | P1 | 축소 유지 | 버튼, 카드, 폼, 섹션 heading의 이유만 남김 |
| `tokens.json` | 인쇄·웹 색상/타입/레이아웃 값. 사람이 읽는 설명이 아니라 구현용 값. | P1 | 유지 | `brand.md` 와 값 불일치 여부 확인 |

## P0 Cleanup

- `voice.md` 의 proof approval, mockup ready, approve before print 예시는 제거한다. 현재 기준은 주문 노트 기반, 모크업 컨펌 없음.
- `pages.md` 의 Terms meta와 관련 설명에서 mockup approval을 제거한다.
- A5 고객-facing sheet 표현과 `template_cutout_v2.ait` 의 `info > body` 142 x 175mm pack area를 명확히 분리한다.
- `brand.md` 에 있는 사업 설명은 짧은 참조로만 두고, 사업 판단은 `docs/business/` 로 보낸다.

## P1 Fill

- `brand.md`: 실제 사용할 wordmark asset 기준. MVP는 PNG, SVG는 후속 수동 export.
- `brand.md`: web typography에서 Cormorant Garamond vs Playfair Display 중 MVP 기본값.
- `photography.md`: Home/Product/About/OG 이미지별 필수 shot mapping.
- `pages.md`: 각 페이지가 어떤 디자인 문서와 Shopify copy 문서를 참조해야 하는지 명시.

## P2 Later

- Shopify theme 구현 후 실제 component spec은 theme 코드와 함께 정리.
- Instagram/SNS tone board는 판매 채널이 열리고 콘텐츠 운영이 시작된 뒤 별도 작성.
- Package insert, thank-you card, QR reorder flow는 실제 인쇄물 제작 단계에서 확장.
