# Everstory Studio — Brand Identity (v1)

> 디자인 결정의 입력값. 모든 시트·스토어프론트·패키징 디자인이 이 문서를 참조한다. 변경 시 `design/decisions.md` 에 ADR 한 줄 추가.

## One-liner

**Everstory Studio 는 토론토 GTA + 한인 디아스포라를 위한 A5 커스텀 사진 다이컷 스티커 브랜드다** — 한국 프리미엄 substrate + 손 누끼 + 인쇄 전 모크업 승인 + 자체 ExtendScript 운영 파이프라인으로 Etsy 자동/AI 셀러와 다른 카테고리에 포지셔닝.

(원천: `docs/business_strategy.md` §1)

## 차별화 5축

업계 평균 ($18-25 CAD Etsy 셀러) 과 직접 비교 안 당하는 카테고리로 끌어올리는 5축:

1. **Korean premium substrate** — 잉크젯 레이블 + LAMat-AF/Oraguard 라미네이션. White / Pearl Grey / Silver / Gold 4종.
2. **사람이 손으로 누끼** — 펫 털, 다리 사이, 귀-머리 틈까지. Etsy 빅셀러는 자동/AI 마스킹.
3. **인쇄 전 모크업 승인** — PDF 모크업을 고객에게 보내고 컨펌 받은 뒤 인쇄. 고객 first-touch artifact 이자 UGC 트리거.
4. **토론토 로컬** — GTA 며칠 내 도착, 한인 커뮤니티 픽업 가능.
5. **자체 ExtendScript 파이프라인** — Phase A UXP 패널 + Phase B Illustrator 자동화. 운영 효율 = 가격 경쟁력.

(원천: `docs/business_strategy.md` §2)

## 타겟

토론토 GTA + 한인 디아스포라 + 펫맘/MZ 감성 굿즈 시장.

## Voice / Tone

에디토리얼 / 부티크 / 럭셔리 톤 — 향수·코스메틱·잡지 표지의 결. 펫·아이 사진 도메인의 흔한 둥글한 산세리프 + 파스텔 + 일러스트 톤과 의도적으로 차별화.

태그라인: **MADE TO KEEP | MOMENTS THAT MATTER**

## 워드마크

- **EVERSTORY** — `Amandine Bold` (Didone 계열 high-contrast 디스플레이 세리프, 얇은 stem + 두꺼운 bowl).
- **STUDIO** — `Titular Bold` (compact sans, 워드마크 옆 underline 동반).
- 자산: `assets/online_logo.png`

## Typography

폰트 family **3종 only** 정책. 추가 family 도입 금지 — Step 3 LOCK 결정 (ADR-0004).

- `Amandine Bold` — display.wordmark 전용 (1 slot).
- `Titular Bold` — display.subscript 전용 (1 slot, "STUDIO" 라벨).
- `Avenir Next LT Pro Bold` — 그 외 모든 텍스트 (tagline / info / chip / QR caption). **Bold 한 weight 만** 사용 — size+tracking+case 로 hierarchy 처리.

| Slot | Family | Size 추정 | Tracking | Case |
|------|--------|---------|---------|------|
| display.wordmark | Amandine Bold | ~36-42pt | normal | UPPER |
| display.subscript | Titular Bold | ~7-9pt | +200 | UPPER |
| display.tagline | Avenir Next LT Pro Bold | ~5-6pt | +100 | UPPER |
| info.line1 | Avenir Next LT Pro Bold | ~8-9pt | normal | mixed |
| info.line2 | Avenir Next LT Pro Bold | ~8-9pt | normal | mixed |
| chip.label | Avenir Next LT Pro Bold | ~7-8pt | +50 | UPPER |
| chip.subline | Avenir Next LT Pro Bold | ~6-7pt | normal | mixed |
| qr.caption | Avenir Next LT Pro Bold | ~5-6pt | +50 | UPPER |

정확한 size·tracking 은 `.ait` 보유 (스크립트 inplace 교체). web/Shopify 측 매핑은 `design/storefront.md` 에서 별도 정의.

## 사진 큐레이션

- 부드러운 톤
- 흰/크림 의상
- 자연광
- 따뜻한 살결

피사체 카테고리가 아니라 *분위기 일치* 로 큐레이션. 시트 mockup 안 인물·반려동물·가족 사진이 한 음성으로 말해야 함.

## Color Palette

`assets/illustrator_template_*.png` 픽셀 sampling 으로 정밀 측정 (ADR-0005). Print 컨텍스트 LOCK.

| Slot | Hex | RGB | 사용처 | Status |
|------|-----|-----|--------|--------|
| `text.primary` | **#000000** | 0,0,0 | 워드마크·tagline·info·chip 라벨·QR caption | ✓ LOCK |
| `bg.matte_white` | **#FEFDFE** | 254,253,254 | 일반 시트 배경 (`White matte`) | ✓ LOCK |
| `bg.pearl_grey` | **#E0D3CB** | 224,211,203 | 방수 시트 배경 (`Pearl Grey`, warm beige hue) | ✓ LOCK |
| `sticker.padding` | **#FFFFFF** | 255,255,255 | 사진 외곽 cut margin 흰색 stroke | ✓ LOCK |
| `accent.coral` | **#FBAAA8** | 251,170,168 | 시트 footer chip 1 ♡ ("THANK YOU" 감사·온기) | ✓ LOCK |
| `divider` | TODO ~#999 | TBD | 우상단 hairline (header ↔ body 구분) | ⚠️ stroke 진짜 색 불명 (PNG anti-alias artifact) |

**원칙**: 무채 4 + 강조 1 = 5 색만. Print 시트 안에서 추가 컬러 도입 금지. Web/Shopify 는 derived neutral + state 추가 — 아래 §Web Extensions 참조 (ADR-0006).

**측정 방법** (재현 가능): `python3` + Pillow 로 1402×1122 PNG 의 corner box (10×10 평균) + darkest-pixel scan. 정확한 좌표·로직 — `design/decisions.md` ADR-0005.

---

## Web Extensions

> Shopify MVP 사이트 빌드를 위한 web-context 토큰. 인쇄 5색·폰트 3종 lock 을 보존하면서 web UI 에 필수인 derived neutrals + state colors + spacing 을 추가. ADR-0006 (web color), ADR-0007 (component spec in Liquid).

### Web Typography

- **Wordmark**: MVP 는 `assets/online_logo.png` (2048×2048 RGBA) 직접 사용 — retina 충분. SVG 변환 (`design/wordmark.svg`) 은 Illustrator 에서 Amandine Bold + Titular Bold 텍스트 → outline → SVG export 의 수동 작업으로 분리 (Phase B 또는 이후). 폰트 의존성 회피 + 작은 파일 크기는 SVG 가 우월하지만, MVP 출시 블로커 아님.
- **Body / UI 스택**: `'Avenir Next LT Pro', 'Avenir Next', 'Helvetica Neue', system-ui, sans-serif` — Adobe Fonts 구독으로 Avenir Next LT Pro 커버 (사용자 결정 #1).
- **Editorial display 스택**: `'Cormorant Garamond', 'Playfair Display', Georgia, serif` — 큰 헤딩 (Hero / About) 전용. 둘 중 1개 lock 은 Phase A 끝에 시안 비교 후 결정 (Open Decision #1).
- **Hangul fallback**: 미설정. 영어 단일 정책 (사용자 결정 #3).

**Type scale (rem)**: 0.75 / 0.875 / 1.0 / 1.125 / 1.25 / 1.5 / 2.0 / 3.0 / 4.0 — 1rem = 16px, mobile 기준. desktop 은 step +1.

**Hierarchy 규칙** (인쇄 ADR-0004 와 동일 원칙):
1. Bold weight 만 사용. Regular/Medium/Light 도입 금지.
2. Hierarchy = size + tracking + case 조합으로만.
3. UPPER + tracking wider/widest = eyebrow / label
4. mixed case + tracking normal = body / paragraph
5. >2xl 헤딩만 display 스택 (serif), 그 외는 body 스택 (sans).

### Web Color

전체 슬롯 정의는 `tokens.json` 의 `colors.web` 참조. 핵심:

- **Text**: `text.primary` #000 / `text.secondary` #4A4A4A / `text.muted` #8A8580 / `text.accent_coral` #FBAAA8 (텍스트 액센트 only, 배경 금지)
- **Bg**: `bg.canvas` #FEFDFE (matte_white 그대로) / `bg.muted` #F8F5F2 / `bg.warm` #E0D3CB (pearl_grey 재활용, story 영역) / `bg.inverse` #000
- **Border**: `border.subtle` #ECE6E0 / `border.strong` #1A1A1A / `border.focus` #000
- **Button.primary**: bg #000 / fg #FFF / hover bg #1A1A1A + 라벨 아래 1px coral underline (#FBAAA8) — 사용자 결정 #10
- **Button.secondary**: outlined black, hover bg #F8F5F2
- **State**: error #B23A3A / success #2E7D5B / warning #C77A2E

**원칙**: print 5색 시각 톤 보존. derived neutrals 는 5색에서 파생되거나 충분히 desaturated. shadow / 큰 radius 사용 안 함 (luxury / editorial 톤 보존).

### Web Layout

- **Base grid**: 4px
- **Spacing scale (px)**: 0 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128
- **Container**: content 1280 / wide 1440 / narrow 720
- **Breakpoints**: mobile <640 / tablet 640-1023 / desktop ≥1024
- **Section padding**: mobile 64 / desktop 96 (hero 128)
- **Grid**: desktop 12-col gap 24 / mobile 4-col gap 16
- **Radius**: 0 또는 2-4px max. 8+ 금지 (luxury 톤).
- **Shadow**: 사용 안 함. 깊이는 spacing + bg.muted 로만.

전체 토큰은 `tokens.json` 의 `web_layout` 참조.

---

## 시트 푸터 4-chip 시스템

각 시트 하단 4 chip (`assets/illustrator_template_*.png` 참조):

1. **인사** — `THANK YOU FOR CHOOSING EVERSTORY STUDIO. Your memories deserve to be kept beautifully.`
2. **제작 메시지** — `MADE IN TORONTO WITH CARE` (현재 .ait 에는 `PRINTED IN THE USA WITH CARE` 박혀 있음 — Toronto 로 교체 필요. ADR 등록 예정)
3. **품질** — `PREMIUM QUALITY PHOTO STICKERS`
4. **슬로건 + QR** — `MADE TO KEEP. MADE FOR YOU.` + QR (`SCAN TO REORDER OR SHARE YOUR EXPERIENCE`)

## 미해결 결정

- [ ] 시트 푸터 chip 2 의 USA → Toronto 카피 교체 (.ait 직접 수정 필요)
- [ ] mockup 헤더 "White matte · Finish Matte" 중복 노출 정리
- [ ] Divider hairline stroke 진짜 색 측정 (현재 anti-alias artifact 만 잡힘 — `.ait` swatch 또는 Eyedropper 확인 필요)
- [x] ~~Web/Shopify 빈 슬롯 정의 — `accent.coral` 재활용 vs cta/state 신규 컬러~~ → 2026-05-07 ADR-0006 으로 종결. coral = 텍스트 액센트 only, button.primary = black, state colors 신규 3종 추가.
- [ ] Editorial display 폰트 lock — Cormorant Garamond 600 vs Playfair Display 700 시안 비교 (Phase A 끝)

## 변경 이력

- **2026-05-07** — v1 초안. `business_strategy.md` §1-2 + `assets/` mockup 분석 + `AGENTS.md` 의 차별화 5축 정리.
- **2026-05-07** — Typography 섹션 추가. 폰트 family 3종 잠금 (Amandine Bold / Titular Bold / Avenir Next LT Pro Bold). ADR-0004.
- **2026-05-07** — Color Palette 정밀 측정 잠금. 5 슬롯 hex 박음 (text.primary #000000 / bg.matte_white #FEFDFE / bg.pearl_grey #E0D3CB / sticker.padding #FFFFFF / accent.coral #FBAAA8). ADR-0005.
- **2026-05-07** — Web Extensions 섹션 추가 (Web Typography / Web Color / Web Layout). Adobe Fonts 베이스 + Cormorant/Playfair editorial display + 4px grid + derived neutrals + state 3종. ADR-0006 (web color extension), ADR-0007 (component spec lives in Liquid schema).
