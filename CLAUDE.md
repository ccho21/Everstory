# Everstory 스티커 제작 파이프라인

Adobe CC 2026 기반 스티커 시트 자동화. PSD 누끼/실루엣 → A5 그리드 배치 + 칼선 분리 → ET-8550 출력 + Summa D75 컷팅.

## MVP

첫 주력 상품은 **A5 커스텀 사진 다이컷 스티커 시트**. 대표 모드는 **Name Included** (사진 + 상단 헤더에 고객/주문 정보). 운영 메인은 **`Everstory_mixed_v2.jsx`** (v2 브랜드 템플릿). 한 시트 정책 — A5 한 시트만 생성, 넘치는 입력은 사이즈별 디자인 cap (auto-cap) 으로 입력 단계에서 제한. 칼선 여백 (0/0.5/1/2mm) 은 고객 옵션이 아니라 내부 제작 옵션.

상품/운영 정책은 [docs/business/business.md](docs/business/business.md).

## 디렉토리 구조

```
.
├── Everstory_mixed_v2.jsx         # 운영 메인 (v20). v2 브랜드 템플릿용, info > header > header_right TextFrame 주입
├── Everstory_CleanOffsetPath.jsx  # offset/compound path 내부 조각 제거 유틸
├── plugins/everstory_save/        # Phase A — UXP 패널 플러그인 (PS)
├── templates/
│   └── template_cutout_v2.ait     # v2 브랜드 템플릿 (운영 메인). info > body 142×175mm + info > header > header_right (TextFrame, 값만 주입)
├── projects/{이름}/
│   ├── 01_original/               # 원본 PSD/JPG/TIF
│   ├── 02_cutout/                 # Phase A 산출 (_clean.psd + _sil.png 페어)
│   └── 03_output/                 # Phase B 산출 (.ai 시트)
└── docs/
    ├── business/                  # 사업·전략
    ├── design/                    # 인쇄·웹 디자인 정의
    ├── implementation/            # 운영 코드 자산 (sheet_tokens.json)
    └── shopify/                   # 웹 스토어 — 어드민·카피·정책·시안
```

## 파이프라인 요약

1. **Phase 0 — 수동 (Photoshop)**: `layers[0]` = 실루엣, `layers[1..N]` = 누끼+보정.
2. **Phase A — UXP 패널** (`plugins/everstory_save/`): `_sil.png` + `_clean.psd` 저장, longest 1800px.
3. **Phase B — Illustrator** (`Everstory_mixed_v2.jsx`): 폴더 → 페어 ListBox multiselect → 사이즈 (XS/S/M/L/XL/XXL 또는 Mixed) → 시트 생성 → `03_output/` 자동 saveAs. 다이얼로그 5단계 (폴더 / 고객 정보 / 페어 / 사이즈 / 칼선 여백).

## 고정 컨벤션 (변경 시 파이프라인 깨짐)

- **AI 레이어**: `PrintData` (raster), `KissCut` (cutline), `info` (템플릿 디자인). z-order 위→아래 = `KissCut` → `info` → `PrintData` (+ trace 중 hidden `TraceStash` 임시 레이어).
- **TextFrame (template_cutout_v2.ait)**: `info > header > header_right` (필수, **TextFrame** — PathItem 아님). 폰트/사이즈/우측 정렬은 .ait 가 보유, 스크립트는 `.contents` 만 inplace 교체.
- **PathItem (template_cutout_v2.ait)**: `info > body` (사진 pack 영역, 142×175mm, 필수).
- **Spot color**: `CutContour` — M=100, SPOT (Summa/Roland 표준).
- **파일명**: `01_original/cute_pet.psd` → `02_cutout/{folderName}_NN_clean.psd` + `{folderName}_NN_sil.png` (예: `로운_01_clean.psd`, `로운_01_sil.png`) → `03_output/{YYYYMMDD_HHMMSS}_1in_sheet01.ai` (Mixed 면 `MIX` 태그).
- **폴더명**: 영어 (`01_original` 등) — macOS NFD vs JS NFC 비교 실패 회피.

## 작업 원칙

- **방어 코드 추가 금지**: RGB 강제 변환, face crop, 빈 PNG 검증, 클립보드 경합 처리 등은 추가하지 않음. 사용자가 입력·환경을 수동 통제.
- **Phase A 액션 호출 없음**: 레이어 visibility 토글 + 저장만. Select Subject / Levels 같은 PS 액션 호출 안 함.
- **외곽선 그대로 사용**: offset/simplify 는 v4 에서 제거. cutline 품질은 Image Trace 파라미터로만 조정. cutline offset/smooth 는 수동 작업 (스크립트는 1mm/2mm 만큼 이미지 inset 만 함).
- **Make Work Path / SVG 경로 명시적 기각**: noise/분리 패스 문제로.
- **AI 자동화는 ExtendScript** (`.jsx` + DOM + `executeMenuCommand`), **PS 자동화는 UXP** (`.js` + batchPlay).

## 하드웨어

- **프린터**: Epson ET-8550 (염료 잉크)
- **컷터**: Summa D75 — CutContour 스폿 인식, 노드 500-1500개 선호 (Image Trace 2.0px tolerance 기준)

## 문서 인덱스

각 디렉토리는 역할로 분리한다 — **business**: 사업·전략 / **design**: 디자인 정의 (인쇄+웹) / **implementation**: 운영 코드 자산 / **shopify**: 웹 스토어 (어드민·카피·정책·시안).

- [**비즈니스**](docs/business/) — 사업·전략
  - [plan.md](docs/business/plan.md) — 비즈니스 문서 목적·중요도·정리 계획
  - [business.md](docs/business/business.md) — 사업 정의·상품·장비·가격·채널·배송·런칭 목표
- [**디자인**](docs/design/) — 인쇄·웹 디자인 정의
  - [plan.md](docs/design/plan.md) — 디자인 문서 목적·중요도·정리 계획
  - [brand.md](docs/design/brand.md) — voice·워드마크·typography·color·layout·사진 큐레이션 (인쇄+웹 통합)
  - [pages.md](docs/design/pages.md) — Shopify MVP 11 페이지 spec (H1·CTA·SEO)
  - [components.md](docs/design/components.md) — UI 컴포넌트 rationale
  - [voice.md](docs/design/voice.md) — 카피 톤 운영 규칙
  - [photography.md](docs/design/photography.md) — 우리 측 촬영 디렉션
  - [tokens.json](docs/design/tokens.json) — 인쇄 + 웹 디자인 토큰
- [**구현**](docs/implementation/) — 운영 코드 자산
  - [sheet_tokens.json](docs/implementation/sheet_tokens.json) — 시트 packing 토큰
  - [plugins/everstory_save/README.md](plugins/everstory_save/README.md) — Phase A UXP 패널 플러그인 설치/사용
- [**Shopify**](docs/shopify/) — 웹 스토어
  - [plan.md](docs/shopify/plan.md) — Shopify 문서 목적·중요도·정리 계획
  - **셋업·어드민**
    - [settings_checklist.md](docs/shopify/settings_checklist.md) — 1A–1J 설정 체크리스트와 통합 smoke test
  - **카피·콘텐츠**
    - [pages_copy.md](docs/shopify/pages_copy.md) — About/FAQ/가이드 페이지 카피
    - [product_descriptions.md](docs/shopify/product_descriptions.md) — 4 SKU 상품 설명
    - [footer_copy.md](docs/shopify/footer_copy.md) — 한국어 footer 카피
  - **정책**
    - [policies.md](docs/shopify/policies.md) — 환불/배송 정책 본문
  - **시안**
    - [wireframes/index.html](docs/shopify/wireframes/index.html) — Horizon 테마 기반 11페이지 와이어프레임 (페이지별 분리 HTML)
    - [preview.html](docs/shopify/preview.html) — 스토어프론트 프리뷰 시안
