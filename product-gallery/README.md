# Everstory Product Gallery

ChatGPT 프로젝트 **Everstory Product Gallery**를 `Project memory only`로
운영하기 위한 소스 패키지다.

## 구조

```text
product-gallery/
├── PROJECT_INSTRUCTIONS_KO.md
├── REFERENCE_INDEX.md
├── START_HERE_PROMPT.md
├── prompts/
│   ├── face-sticker/
│   │   └── 01-hero-angled.md
│   └── full-body-sticker/
│       └── 01-hero-angled.md
├── shared/
│   ├── EVERSTORY_PRODUCT_GALLERY_SOURCE.md
│   ├── GALLERY_SYSTEM.md
│   ├── QA_RUBRIC.json
│   └── style-references/
│       ├── angled-sheet-warm-gray-v1.png
│       └── ANGLED_SHEET_STYLE_NOTES.md
├── face-sticker/
│   ├── FACE_STICKER_PRODUCT_BRIEF.md
│   ├── FACE_STICKER_REFERENCE_INDEX.md
│   ├── FACE_STICKER_REQUEST_TEMPLATE.json
│   ├── prompts/
│   └── references/
└── full-body-sticker/
    ├── FULL_BODY_STICKER_PRODUCT_BRIEF.md
    ├── FULL_BODY_STICKER_REFERENCE_INDEX.md
    ├── FULL_BODY_STICKER_REQUEST_TEMPLATE.json
    ├── prompts/
    └── references/
```

## 핵심 원칙

- `shared`에는 브랜드·제품 공통 사실과 공통 QA만 둔다.
- Face Sticker 자료는 `face-sticker` 안에서만 사용한다.
- Full Body Sticker 자료는 `full-body-sticker` 안에서만 사용한다.
- 한 채팅에서는 하나의 SKU만 active로 지정한다.
- 다른 SKU의 actual photo를 현재 SKU의 제품 증거로 사용하지 않는다.
- 사용자가 명시적으로 승인한 경우에만 공통 물리 장면을
  `Physical Scene Base`로 제한적으로 사용할 수 있다.
- `DSCF0365.jpg`는 Full Body Sticker actual photo이며, Face Slot 01 angled에서는
  승인된 physical scene base일 뿐 Face actual product evidence가 아니다.
- `angled-sheet-warm-gray-v1.png`는 공통 Golden Style이며 제품 사실을 제공하지 않는다.

## ChatGPT 프로젝트 설정

- Project name: `Everstory Product Gallery`
- Memory: `Project memory only`
- Instructions: `PROJECT_INSTRUCTIONS_KO.md` 내용을 붙여 넣기

## Project Sources에 업로드

공통 텍스트:

- `REFERENCE_INDEX.md`
- `shared/EVERSTORY_PRODUCT_GALLERY_SOURCE.md`
- `shared/GALLERY_SYSTEM.md`
- `shared/QA_RUBRIC.json`

SKU 텍스트:

- `face-sticker/FACE_STICKER_PRODUCT_BRIEF.md`
- `face-sticker/FACE_STICKER_REFERENCE_INDEX.md`
- `full-body-sticker/FULL_BODY_STICKER_PRODUCT_BRIEF.md`
- `full-body-sticker/FULL_BODY_STICKER_REFERENCE_INDEX.md`

## 이미지는 채팅별로 첨부

모든 상품 이미지를 Project Sources에 한꺼번에 업로드하지 않는 것을 권장한다.
각 SKU 채팅에서 해당 폴더의 이미지만 첨부한다.

### Face Sticker 채팅

기본 사용 가능:

- `face-sticker/references/print-artwork/face-0_75in-3-designs.webp`
- `face-sticker/references/print-artwork/face-1_25in-3-designs.webp`
- `face-sticker/references/concept/face-topdown-concept.png`

Slot 01 angled 예외:

- `full-body-sticker/references/actual-product/white-matte-a5-standing-DSCF0365.jpg`
  를 `Physical Scene Base`로 첨부할 수 있다.
- 반드시 `prompts/face-sticker/01-hero-angled.md`의 역할 제한을 함께 사용한다.
- Full Body 인쇄면·size·count·customer artwork는 Face 결과에 남기지 않는다.

현재 실제 Face Sticker 촬영본이 없으므로 최대 상태는
`reference_guided_composite`다.

### Full Body Sticker 채팅

사용 가능:

- `full-body-sticker/references/actual-product/white-matte-a5-standing-DSCF0365.jpg`
- `full-body-sticker/references/actual-product/full-body-fingertip-scale-candidate.webp`
- `full-body-sticker/references/print-artwork/full-body-1_50in-3-designs.webp`
- `full-body-sticker/references/current-gallery/full-body-single-cutout-current-hero.webp`

Face Sticker 이미지를 Full Body 제품 source로 함께 첨부하지 않는다.

Primary angled prompt:

- `prompts/full-body-sticker/01-hero-angled.md`

Full Body angled 작업에는 다음 세 이미지를 순서대로 첨부한다.

1. `white-matte-a5-standing-DSCF0365.jpg` — physical sheet
2. `full-body-1_50in-3-designs.webp` — exact artwork and layout map
3. `angled-sheet-warm-gray-v1.png` — exact angle and composition only

세 번째 이미지의 Face artwork와 text는 Full Body 제품 source가 아니다.

## 채팅 이름

- `FACE — 00 Audit`
- `FACE — 01 Hero Angled`
- `FULL BODY — 00 Audit`
- `FULL BODY — 01 Hero Angled`
- `FULL BODY — 02 Top-down`

## 시작

새 채팅에서 `START_HERE_PROMPT.md`의 해당 SKU 프롬프트를 사용한다.

기존 프로젝트 파일 교체 목록은 `PROJECT_UPDATE_MANIFEST.md`를 따른다.
