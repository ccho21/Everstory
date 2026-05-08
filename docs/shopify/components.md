# Everstory — Component Rationale

> ADR-0007: 컴포넌트 스펙의 **source of truth 는 Shopify 테마의 Liquid `{% schema %}` settings 와 CSS custom properties**. 본 문서는 *왜 그렇게 만들었는지* (rationale) 만 담는다. 두 군데에 spec 두면 drift 100%.

## Component inventory (Phase B 에서 코드로 lock)

| 컴포넌트 | Liquid file (예정) | 관련 토큰 |
|----------|-------------------|----------|
| `button` (primary / secondary / ghost / disabled) | `snippets/button.liquid` | `colors.web.button.*` |
| `input` / `textarea` / `file-upload` | `snippets/form-field.liquid` | `colors.web.border.*`, `state.error` |
| `card` (product card, info card) | `snippets/card.liquid` | `colors.web.bg.muted`, `border.subtle` |
| `section-heading` (eyebrow + H2 + subtitle) | `snippets/section-heading.liquid` | `typography.web.scale_rem`, `tracking_em` |
| `pricing-display` (variant price) | `snippets/pricing.liquid` | `colors.web.text.primary` |
| `nav` (header / footer) | `sections/header.liquid` / `footer.liquid` | `typography.web.stacks.body` |

## Rationale

### 왜 button.primary 가 black 인가
- 사용자 결정 #10. Coral 버튼이 따뜻하지만 luxury / editorial 톤은 약해짐.
- Coral 은 텍스트 액센트 (link hover underline) 로만 — 시트의 "감사·온기 chip" 역할을 web 에서도 동일하게 유지.
- Hover 시 라벨 아래 1px coral underline 으로 "이 브랜드는 black 만 쓰지 않는다" 시그널.

### 왜 secondary 는 outlined 인가
- editorial 톤은 *level 의 명확성* 을 요구. solid black 두 개를 한 viewport 에 두지 않는다.
- outlined black 은 CTA 위계상 secondary 임을 형태로 드러냄.

### 왜 ghost 가 있나
- nav / inline link 용. 배경 없는 텍스트 + hover coral underline.
- "Read more" / "View sizes" 같은 보조 액션.

### 왜 form 필드는 underline-only 안 쓰는가
- editorial 톤이지만 *접근성 우선*. underline-only input 은 touch target 모호.
- border.subtle 박스 + focus 시 border.focus (#000) 로 강조 — 명확하면서 톤 유지.

### 왜 card 에 shadow 가 없나
- luxury / editorial 톤은 weightless / printed paper feel. drop shadow 는 web2.0 톤.
- 깊이는 spacing (padding 24-48) + bg.muted (#F8F5F2) 로만.

### 왜 radius 0-4px 만
- 같은 이유. 8+ 큰 radius 는 friendly / playful 톤. 우리 톤 아님.
- 사진 carousel 의 image 는 0 radius (시트 자체가 die-cut 이라 외곽이 곡선이지만 *컨테이너* 는 sharp).

### 왜 button 라벨에 ALL CAPS + tracking 안 쓰는가
- print 의 chip.label 은 UPPER + tracking +50 으로 "라벨" 위계. web button 은 *동작* 이라 mixed case 가 더 자연스러움.
- ALL CAPS 는 eyebrow / section label 전용 (`section-heading` 의 eyebrow 슬롯).

### 왜 section-heading 이 eyebrow + H2 + subtitle 트리오인가
- editorial 잡지 lookup. eyebrow (작은 UPPER) 가 카테고리, H2 가 제목, subtitle 이 1줄 부제.
- 시트의 (display.tagline + display.wordmark + display.subscript) 트리오와 구조 동일.

### 왜 pricing-display 가 단독 컴포넌트인가
- 사이즈 변형 시 가격 변동 (variant price update). `$15.99 — $28.99` 또는 `From $15.99` 패턴 lock 필요.
- font-tabular-nums + 통화 기호 위치 (앞: `$15.99`) 통일.

## 다음 단계 (Phase B)

각 컴포넌트의 실제 spec (정확한 padding / 색상 binding / hover transition / focus ring) 은 Liquid `{% schema %}` settings 와 함께 코드로 lock. 본 문서는 그때 변경 없이 유지 — *왜* 만 담은 문서니까.

## 변경 이력

- **2026-05-07** — v1 초안. ADR-0007 부속. component 목록 + rationale. 실제 spec 은 Phase B 에서 Liquid 로.
