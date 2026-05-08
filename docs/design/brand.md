# Everstory Studio — Brand Identity (v1)

> 디자인 결정의 입력값. 모든 시트·스토어프론트·패키징 디자인이 이 문서를 참조한다.

## 사업 메시지

One-liner / 차별화 5축 / 타겟 → [`business.md`](../business/business.md).

## Format Boundaries

- **Customer-facing product**: A5 photo sticker sheet.
- **Print design frame**: `template_cutout_v2.ait` 가 보유.
- **Photo pack area**: `info > body` 142 x 175mm. 이 치수는 내부 배치 영역이며 고객-facing sheet size 로 쓰지 않는다.

## Voice / Tone

에디토리얼 / 부티크 / 럭셔리 톤 — 향수·코스메틱·잡지 표지의 결. 펫·아이 사진 도메인의 흔한 둥글한 산세리프 + 파스텔 + 일러스트 톤과 의도적으로 차별화.

태그라인: **MADE TO KEEP | MOMENTS THAT MATTER**

## 워드마크

- **EVERSTORY** — `Amandine Bold` (Didone 계열 high-contrast 디스플레이 세리프, 얇은 stem + 두꺼운 bowl).
- **STUDIO** — `Titular Bold` (compact sans, 워드마크 옆 underline 동반).
- **MVP web asset**: `assets/online_logo.png` (2048 x 2048 RGBA).
- **Later asset**: `assets/wordmark.svg` 는 Illustrator 에서 outline export 후 교체. MVP blocker 아님.

## Typography

폰트 family **3종 only** 정책. 추가 family 도입 금지.

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

정확한 size·tracking 은 `.ait` 보유 (스크립트 inplace 교체). web/Shopify 측 매핑은 [`pages.md`](pages.md) 에서 별도 정의.

## 사진 큐레이션

- 부드러운 톤
- 흰/크림 의상
- 자연광
- 따뜻한 살결

피사체 카테고리가 아니라 *분위기 일치* 로 큐레이션. 시트 mockup 안 인물·반려동물·가족 사진이 한 음성으로 말해야 함.

## Color Palette

`assets/illustrator_template_*.png` 픽셀 sampling 으로 정밀 측정. Print 컨텍스트 LOCK.

| Slot | Hex | RGB | 사용처 |
|------|-----|-----|--------|
| `text.primary` | **#000000** | 0,0,0 | 워드마크·tagline·info·chip 라벨·QR caption |
| `bg.matte_white` | **#FEFDFE** | 254,253,254 | 일반 시트 배경 (`White matte`) |
| `bg.pearl_grey` | **#E0D3CB** | 224,211,203 | 방수 시트 배경 (`Pearl Grey`, warm beige hue) |
| `sticker.padding` | **#FFFFFF** | 255,255,255 | 사진 외곽 cut margin 흰색 stroke |
| `accent.coral` | **#FBAAA8** | 251,170,168 | 시트 footer chip 1 ♡ ("THANK YOU" 감사·온기) |

**원칙**: 무채 4 + 강조 1 = 5 색만. Print 시트 안에서 추가 컬러 도입 금지. Web/Shopify 는 derived neutral + state 추가 — 아래 §Web Extensions 참조.

**측정 방법**: Pillow 로 `assets/illustrator_template_{1,2}.png` (1402×1122) 의 corner 10×10 box 평균 (배경) / darkest-pixel scan (텍스트·라벨) / most-saturated red scan (액센트) — 모니터·JPEG 영향 없는 픽셀 reference.

---

## Web Extensions

> Shopify MVP 사이트 빌드를 위한 web-context 토큰. 인쇄 5색·폰트 3종 lock 을 보존하면서 web UI 에 필수인 derived neutrals + state colors + spacing 을 추가.

### Web Typography

- **Wordmark**: MVP 는 `assets/online_logo.png` (2048×2048 RGBA) 직접 사용 — retina 충분. SVG 변환 (`assets/wordmark.svg`) 은 Illustrator 에서 Amandine Bold + Titular Bold 텍스트 → outline → SVG export 의 수동 작업으로 분리 (Phase B 또는 이후). 폰트 의존성 회피 + 작은 파일 크기는 SVG 가 우월하지만, MVP 출시 블로커 아님.
- **Body / UI 스택**: `'Avenir Next LT Pro', 'Avenir Next', 'Helvetica Neue', system-ui, sans-serif` — Adobe Fonts 구독으로 Avenir Next LT Pro 커버.
- **Editorial display 스택**: `'Cormorant Garamond', 'Playfair Display', Georgia, serif` — 큰 헤딩 (Hero / About) 전용. MVP 기본은 `Cormorant Garamond` 600.
- **Hangul fallback**: 미설정. 영어 단일 정책.

**Type scale (rem)**: 0.75 / 0.875 / 1.0 / 1.125 / 1.25 / 1.5 / 2.0 / 3.0 / 4.0 — 1rem = 16px, mobile 기준. desktop 은 step +1.

**Hierarchy 규칙** (인쇄와 동일):
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
- **Button.primary**: bg #000 / fg #FFF / hover bg #1A1A1A + 라벨 아래 1px coral underline (#FBAAA8)
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
2. **제작 메시지** — `MADE IN TORONTO WITH CARE`
3. **품질** — `PREMIUM QUALITY PHOTO STICKERS`
4. **슬로건 + QR** — `MADE TO KEEP. MADE FOR YOU.` + QR (`SCAN TO REORDER OR SHARE YOUR EXPERIENCE`)

사업 기준은 [`business.md`](../business/business.md) 를 참조한다.
