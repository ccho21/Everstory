# Design Decisions Log

> ADR 스타일. 한 결정 = 한 entry. 자산 변경 시 해당 결정의 entry 한 줄 추가.

## Format

```
## NNNN — Title (YYYY-MM-DD)

**Status**: Proposed | Accepted | Superseded by NNNN
**Context**: 1-2 sentences on what triggered this decision
**Decision**: 1-2 sentences on what was decided
**Consequences**: What changes / what depends on this
```

번호는 4자리 zero-pad, 0001 부터. Status 가 Superseded 이면 후속 ADR 번호 명시.

---

## 0001 — design/ 디렉토리 도입 (2026-05-07)

**Status**: Accepted

**Context**: 운영 스크립트(`Everstory_*.jsx`)와 템플릿 바이너리(`templates/*.ait`)에 디자인 의도가 박혀 있지만 *왜 그렇게 됐는지* 와 *변천사* 가 어디에도 보존되지 않았다. 브랜드 정체성·시트 typography·모크업 결정 등이 docs/ 와 코드에 흩어진 채로 운영됨.

**Decision**: `design/` 4 파일 구조 도입.
- `brand_identity.md` — 브랜드 voice + 차별화 5축, v1 채움
- `tokens.json` — 시트 layout 토큰, legacy `Everstory_Grid.jsx` 매직 넘버 추출
- `storefront.md` — 채널 노출 디자인 (TODO)
- `decisions.md` — ADR 스타일 결정 기록 (본 문서)

코드처럼 관리 — 자산 = 현재 상태, decisions = 변경 이력.

**Consequences**: `AGENTS.md` 에 `design/` 라우팅 단락 추가 (line 96~). 우선순위 (충돌 시): `docs/business/decisions.md` 최신 entry > `design/{brand_identity,tokens,storefront}` 자산 > `AGENTS.md`. 자산 변경 시 ADR 한 줄 함께 추가.

## 0002 — Toronto 표기 단일화, Brampton 제거 (2026-05-07)

**Status**: Accepted

**Context**: `docs/business/strategy.md:15` 에 "토론토(Brampton) 기반" 한 줄. 다른 모든 자리 (§1 one-liner, §2 타겟) 는 "토론토 GTA". 차별화 4축 "토론토 로컬 (며칠 내 도착, 픽업 가능)" 와 직결되는 핵심 포지셔닝 문구라 Brampton 표기는 한인 디아스포라 대상 메시지에서 신뢰 흔드는 노이즈.

**Decision**: 모든 외부·내부 카피에서 "Toronto" 단일화. `business_strategy.md:15` Brampton 제거.

**Consequences**: 외부 노출 일관성 확보. 시트 mockup 푸터 "PRINTED IN THE USA WITH CARE" → Toronto 카피 교체는 별도 ADR 로 분리 (`.ait` 직접 수정 필요, 코드 작업 아님). Pending 큐에 등록.

## 0003 — Photo Only 모드 docs 제거 (2026-05-07)

**Status**: Accepted

**Context**: `AGENTS.md` / `CLAUDE.md` / `docs/business/strategy.md` / `docs/implementation/product_mvp.md` 가 "Photo Only / Name Included 두 모드" 로 표현했지만 운영 코드 `Everstory_mixed_v2.jsx:553` 는 항상 `TYPE: Name Add-on` 박고 헤더 line2 도 항상 `Name add-on` — v2 는 Name Included 단일 출력만 가능. Photo Only 모드는 코드에 없음. docs ↔ 코드 불일치.

**Decision**: docs 에서 Photo Only 모드 표현 제거. legacy `Everstory_Grid.jsx` 코멘트는 "Photo Only 시트" → "단일 사이즈 시트" 로 rename (legacy 스크립트 자체는 보관). frozen baseline 문서 (`name_included_v14_layout.md`, `name_included_v15_baseline.md`) 의 historical 언급은 그대로 둠 — legacy 역할 설명 컨텍스트라 현재 모드 주장 아님.

**Consequences**: docs ↔ 운영 코드 일치. Photo Only 모드를 *진짜로* 만들려면 별도 ADR 로 v2 다이얼로그에 토글 추가 + 헤더 line2 분기 구현. 현재는 우선순위 낮음.

## 0004 — Typography 폰트 family 3종 잠금 (2026-05-07)

**Status**: Accepted

**Context**: Step 1 AUDIT 결과 시트 mockup·online_logo 에서 폰트 추정만 가능 (Didone 계열 / Sans 계열). 정확한 PostScript 이름이 `brand_identity.md` 의 미해결 결정에 TODO 로 남아 있어 `tokens.json` 에 typography 토큰 못 박음. 사용자가 운영 폰트 직접 알려줌 — 워드마크 = Amandine Bold + Titular Bold, 그 외 모든 텍스트 = Avenir Next LT Pro Bold.

**Decision**: 폰트 family **3종 only** 잠금.
- `Amandine Bold` — `display.wordmark` 1 slot 전용 ("EVERSTORY")
- `Titular Bold` — `display.subscript` 1 slot 전용 ("STUDIO")
- `Avenir Next LT Pro Bold` — 그 외 모든 텍스트 (tagline / info.line1-2 / chip.label / chip.subline / qr.caption). **Bold weight 만 사용**, size+tracking+case 로 hierarchy 처리. 다른 weight (Regular/Medium/Light) 도입 금지.

추가 family 도입 시 본 ADR superseded 으로 처리 + `brand_identity.md` Typography 섹션 갱신 필요.

**Consequences**: `brand_identity.md` Typography 섹션 신설 (8 slot 매핑 표). `tokens.json` 에 `typography.families` + `typography.slots` 박음 — `_meta.version` v1 → v2 갱신. Shopify 가도 동일 3 family 운영 (web 측 fallback stack 별도 정의 필요 — `docs/shopify/storefront.md` TODO). PostScript 이름 잠금은 본 ADR 로 종결, `brand_identity.md` 미해결 결정에서 제거.

## 0005 — Color palette 정밀 측정·잠금 (2026-05-07)

**Status**: Accepted

**Context**: Step 1 AUDIT 의 시각 추정 (`bg.matte_white #FBFAF6` / `text.primary #1A1A1A` / `accent ~#E5A89C` 등) 이 모니터 톤·JPEG 의식 영향으로 부정확. `.ait` 는 binary 라 직접 색 추출 불가. `assets/illustrator_template_{1,2}.png` 픽셀 sampling 이 더 정확한 reference 라고 판단 (사용자 결정).

**Decision**: Pillow (Python PIL) 로 1402×1122 PNG 의 핵심 영역 측정 → 5 슬롯 hex LOCK.

| Slot | Hex | RGB | 측정 방법 |
|------|-----|-----|----------|
| `text.primary` | #000000 | 0,0,0 | 워드마크·chip 라벨 darkest pixel scan (anti-alias 영향 없는 굵은 stem) |
| `bg.matte_white` | #FEFDFE | 254,253,254 | 4 corner 10×10 box 평균 (template_1) |
| `bg.pearl_grey` | #E0D3CB | 224,211,203 | 4 corner 10×10 box 평균 (template_2) — R>G>B warm beige |
| `sticker.padding` | #FFFFFF | 255,255,255 | brightest pixel scan in sticker zone |
| `accent.coral` | #FBAAA8 | 251,170,168 | chip 1 ♡ most-saturated red pixel (template_2) |

작은 텍스트 영역 (info.line1·divider) 의 darkest pixel 이 #15-19/30-50/47-73 dark navy 로 측정됐으나 chip 라벨·워드마크 darkest 가 #000000 일치 — anti-alias artifact 으로 판단, 진짜 의도색은 #000000 통일.

`divider` hairline 은 PNG anti-alias 영향으로 진짜 stroke 색 측정 불가 — TBD 로 남김 (사용자 측 Illustrator Eyedropper 또는 .ait stroke swatch 확인 필요).

**원칙**: 시트 안에서 컬러 4 무채 (text/bg×2/padding) + 강조 1 (accent.coral) = **5 색**. 추가 컬러 도입 금지. Web/Shopify cta·state·border 슬롯은 별도 ADR.

**Consequences**: `brand_identity.md` Color Palette 섹션 5 슬롯 LOCK 표로 갱신. `tokens.json` 에 `colors.{text,bg,sticker,accent,divider}` 박음 — `_meta.version` v2 → v3 갱신. 측정 재현성: Pillow + 1402×1122 PNG + corner box 평균 + darkest scan + most-saturated red 알고리즘 (본 ADR Decision 표). Pending 항목 갱신 — "Secondary/accent color 확정" 종결 (chip 1 coral 으로 lock), "정확 hex 잠금" 종결, "divider 진짜 색" 신규.

## 0006 — Web color palette 확장 (2026-05-07)

**Status**: Accepted

**Context**: Shopify MVP 사이트 빌드 진입. ADR-0005 의 시트 5색 lock 만으로는 web UI 운영 불가 — body paragraph (장문 회색), captions / meta (muted), state colors (error / success / warning), button hover, focus ring, border 가 필요. 사용자와 Round 3 결정 #10 = "Black 버튼 + Coral 텍스트 액센트". coral 을 button bg 로 쓰면 luxury 톤 약해짐 — 텍스트 액센트로만 유지.

**Decision**: web 컨텍스트에 한해 derived neutrals + state 3색 추가. 시트 5색은 그대로 유지·lock 보존.

| 신규 슬롯 | Hex | 역할 |
|----------|-----|------|
| `text.secondary` | #4A4A4A | 본문 paragraph |
| `text.muted` | #8A8580 | captions / meta (warm grey, pearl_grey 와 같은 R>G>B) |
| `text.accent_coral` | #FBAAA8 | 텍스트 액센트 only (link hover underline / eyebrow) |
| `bg.muted` | #F8F5F2 | section alt / card surface |
| `border.subtle` | #ECE6E0 | input / card outline |
| `border.strong` | #1A1A1A | 강조 박스 |
| `button.primary.hover.bg` | #1A1A1A | + 라벨 아래 1px coral underline |
| `button.secondary` | outlined black, hover bg #F8F5F2 | |
| `button.ghost` | transparent + coral underline on hover | |
| `state.error` | #B23A3A | |
| `state.success` | #2E7D5B | |
| `state.warning` | #C77A2E | |
| `focus.ring` | #000 | a11y |

**원칙**: print 5색 시각 톤 보존. derived neutrals 는 5색에서 파생되거나 충분히 desaturated. shadow / 큰 radius 사용 안 함 (luxury / editorial 톤 보존).

**Consequences**: `tokens.json` 을 v3 → v4 로 갱신 — 기존 `colors` / `typography` 를 `colors.print` / `typography.print` 로 wrap, 같은 키 안에 `web` 추가, 신규 top-level `web_layout` 도입. `brand_identity.md` Color Palette 섹션 아래 §Web Extensions 신설. `storefront.md` 의 "Web/Shopify 빈 슬롯 정의 TBD" 항목 종결. ADR-0005 의 "시트 안 5색 lock" 은 *시트 컨텍스트* 로 한정 명시 — superseded 아님.

## 0007 — Component spec 의 source of truth 는 Liquid schema (2026-05-07)

**Status**: Accepted

**Context**: Shopify 테마 빌드 시작. button / input / card 같은 web 컴포넌트 spec 을 (a) `docs/shopify/components.md` prose 로 lock 할지, (b) Liquid `{% schema %}` settings 와 CSS custom properties 로 lock 할지 결정 필요. Plan agent (검증 단계) 가 두 군데에 두면 drift 100% 라고 지적 — 직접 경험.

**Decision**: 컴포넌트의 실제 spec (정확한 padding / 색상 binding / hover transition / focus ring 등) 은 **Liquid `{% schema %}` + CSS custom properties 가 source of truth**. `docs/shopify/components.md` 는 *rationale only* (왜 black 버튼인지 / 왜 shadow 안 쓰는지 등 의도 보존). 토큰 (`tokens.json` 의 `colors.web` / `typography.web` / `web_layout`) 은 Liquid CSS 가 직접 import 하는 *값* 만 담고, 결합 규칙은 Liquid 안에서.

**Consequences**: `docs/shopify/components.md` 신규 — rationale 만 담는 짧은 문서. Phase B 에서 Liquid snippet `snippets/button.liquid` 등을 만들 때, 본 ADR 따라 spec 을 prose 로 옮겨 적지 않음. 이 패턴은 ADR-0001 의 "코드처럼 관리" 원칙의 web 적용 — `tokens.json` = 값, Liquid schema = 결합 규칙, MD = 의도. 세 layer 분리.

---

## Pending ADRs (작성 대기)

- TODO — 시트 푸터 "PRINTED IN THE USA WITH CARE" → "MADE IN TORONTO WITH CARE" 카피 교체 (`.ait` 직접 수정)
- TODO — Divider hairline stroke 진짜 색 측정 (현재 anti-alias artifact 만 잡힘 — `.ait` stroke swatch 또는 Eyedropper 확인 필요)
- TODO — 칼선 default 1mm 유지 vs 0.5mm 변경 검토 (mockup 은 0.5mm 로 출력됨)
- TODO — body 142×175 (v2) 결정 근거 정리 (왜 v1 의 148×195 에서 줄었는지)
- TODO — header_right TextFrame 분리 (v2) 결정 근거 정리
- TODO — mockup 헤더 "White matte · Finish Matte" 중복 노출 정리 여부
- TODO — Editorial display 폰트 lock — Cormorant Garamond 600 vs Playfair Display 700 (Phase A 끝 시안 비교)
- TODO — Shopify 테마 lock — Sense vs Dawn 30분 비교 후 (Phase B Day 1)
- TODO — `assets/wordmark.svg` 생성 — Illustrator 에서 online_logo.png reference + Amandine Bold + Titular Bold 텍스트 박스 → outline to paths → SVG export. MVP 는 PNG 로 진행, 출시 후 폰트 의존 없는 SVG 로 교체.
