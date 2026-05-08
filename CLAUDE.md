# Everstory 스티커 제작 파이프라인

Adobe CC 2026 기반 스티커 시트 자동화. PSD 누끼/실루엣 → A5 그리드 배치 + 칼선 분리 → ET-8550 출력 + Summa D75 컷팅.

## MVP

첫 주력 상품은 **A5 커스텀 사진 다이컷 스티커 시트**. 대표 모드는 **Name Included** (사진 + 상단 헤더에 고객/주문 정보). 운영 메인은 **`Everstory_mixed_v2.jsx`** (v2 브랜드 템플릿). 한 시트 정책 — A5 한 시트만 생성, 넘치는 입력은 사이즈별 디자인 cap (auto-cap) 으로 입력 단계에서 제한. 칼선 여백 (0/0.5/1/2mm) 은 고객 옵션이 아니라 내부 제작 옵션.

상품/운영 정책은 [docs/implementation/product_mvp.md](docs/implementation/product_mvp.md). 다이컷 외 칼선 (기본도형/프레임) 은 미구현. PhotoStrip·문구 스티커는 MVP 외.

## 디렉토리 구조

```
.
├── Everstory_mixed_v2.jsx    # 운영 메인 (v20). v2 브랜드 템플릿용, info > header > header_right TextFrame 주입
├── Everstory_mixed.jsx       # v1 백업 (v19 uniform grid). v2 의 superset baseline
├── Everstory_NameIncludedSheet.jsx # v15 baseline 동결, mixed 가 깨졌을 때 안정성용
├── Everstory_NameSticker.jsx # 이름 스티커 단독 검수 프로토타입 (시트 통합 안 함)
├── Everstory_CleanOffsetPath.jsx # offset/compound path 내부 조각 제거 유틸
├── Everstory_TemplateBuilder.jsx # template_4cut.ait 의 frame/slot 자동 생성 (PhotoStrip 라인용 보조 도구)
├── legacy/
│   ├── Everstory_Grid.jsx                       # legacy 단일 사이즈 시트 (v10, 운영 비사용)
│   ├── Everstory_NameIncludedSheet_deprecated.jsx
│   └── Everstory_PhotoStrip.jsx                 # retired, MVP 외
├── plugins/everstory_save/   # Phase A — UXP 패널 플러그인 (PS)
├── templates/
│   ├── template_cutout_v2.ait # v2 브랜드 템플릿 (운영 메인). info > body 142×175mm + info > header > header_right (TextFrame, 값만 주입)
│   ├── template_cutout.ait    # v1 베이스. info > body 148×195mm + header / header_border / border / reg_border
│   └── template_4cut.ait      # TemplateBuilder 보조용. Info > a5_border + Frame > slot_01..slot_N
├── projects/{이름}/
│   ├── 01_original/          # 원본 PSD/JPG/TIF
│   ├── 02_cutout/            # Phase A 산출 (_clean.psd + _sil.png 페어)
│   └── 03_output/            # Phase B 산출 (.ai 시트)
└── docs/
    ├── business/             # 전략·브랜드·결정 기록
    ├── implementation/       # 파이프라인·패킹·템플릿·플러그인
    ├── shopify/              # 웹·카피·정책·스토어 설정
    └── archive/              # 구식 버전 문서 (v13/v14/v15 plan)
```

## 파이프라인 요약

1. **Phase 0 — 수동 (Photoshop)**: `layers[0]` = 실루엣, `layers[1..N]` = 누끼+보정.
2. **Phase A — UXP 패널** (`plugins/everstory_save/`): `_sil.png` + `_clean.psd` 저장, longest 1800px.
3. **Phase B — Illustrator** (`Everstory_mixed_v2.jsx`): 폴더 → 페어 ListBox multiselect → 사이즈 (XS/S/M/L/XL/XXL 또는 Mixed) → 시트 생성 → `03_output/` 자동 saveAs. 다이얼로그 5단계 (폴더 / 고객 정보 / 페어 / 사이즈 / 칼선 여백).

상세 파이프라인 + 보조 스크립트 (NameSticker, TemplateBuilder, CleanOffsetPath, legacy Grid) 는 [docs/implementation/pipeline.md](docs/implementation/pipeline.md).

## 고정 컨벤션 (변경 시 파이프라인 깨짐)

- **AI 레이어**: `PrintData` (raster), `KissCut` (cutline), `info` (템플릿 디자인). z-order 위→아래 = `KissCut` → `info` → `PrintData` (+ trace 중 hidden `TraceStash` 임시 레이어).
- **TextFrame (template_cutout_v2.ait, 운영)**: `info > header > header_right` (필수, **TextFrame** — PathItem 아님). 폰트/사이즈/우측 정렬은 .ait 가 보유, 스크립트는 `.contents` 만 inplace 교체.
- **PathItem (template_cutout.ait, v1 백업)**: `info > body` (사진 pack 영역, 필수), `info > header` (ORDER DETAIL 영역, 필수), `info > header_border` / `info > border` / `info > reg_border` (시각 가이드, 스크립트 무시).
- **PathItem/TextFrame 제작법**: [docs/implementation/template_pathitems.md](docs/implementation/template_pathitems.md).
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

## 운영 한계

- 자동 saveAs 실패 시 결과 알림 마지막 줄에 표시되고 문서는 열린 상태로 유지.
- packing 시 90° 회전 안 함 — 스티커 방향 의도 보존.
- trace 실패한 페어는 placement skip + 결과 알림에 base 별 안내. 셀은 PSD 만 남고 cutline 없음 → IL 재시작 후 재시도 권장.

## 문서 인덱스

- [**비즈니스**](docs/business/) — 전략·브랜드·결정 기록
  - [strategy.md](docs/business/strategy.md) — 사업 전략·가격·채널·원가
  - [brand_identity.md](docs/business/brand_identity.md) — 브랜드 정체성·컬러·톤
  - [decisions.md](docs/business/decisions.md) — ADR 로그
- [**구현**](docs/implementation/) — 파이프라인·패킹·템플릿
  - [product_mvp.md](docs/implementation/product_mvp.md) — MVP 상품 정의·재질/대상/모양 분류
  - [pipeline.md](docs/implementation/pipeline.md) — Phase 0/A/B 상세 + 보조 스크립트
  - [packing_internals.md](docs/implementation/packing_internals.md) — `Everstory_mixed_v2.jsx` packing 알고리즘·cap 표·함수 매핑
  - [name_included.md](docs/implementation/name_included.md) — v15 baseline + v14 layout 알고리즘 (동결 백업)
  - [template_pathitems.md](docs/implementation/template_pathitems.md) — Illustrator 템플릿 PathItem/TextFrame 제작 가이드
  - [plugins/everstory_save/README.md](plugins/everstory_save/README.md) — Phase A UXP 패널 플러그인 설치/사용
- [**Shopify**](docs/shopify/) — 웹·카피·정책·스토어 설정
  - [plan.md](docs/shopify/plan.md) — 웹·스토어프론트 설계 계획
  - [storefront.md](docs/shopify/storefront.md) — 웹 구현 스펙
  - [components.md](docs/shopify/components.md) — UI 컴포넌트 정의
  - [voice.md](docs/shopify/voice.md) — 웹/SNS 카피 톤 가이드
  - [photography.md](docs/shopify/photography.md) — 사진 큐레이션 디렉션
  - [settings_checklist.md](docs/shopify/settings_checklist.md) — Shopify 1A–1J 설정 체크리스트
  - [pages_copy.md](docs/shopify/pages_copy.md) — About/FAQ/가이드 페이지 카피
  - [product_descriptions.md](docs/shopify/product_descriptions.md) — 9 SKU 상품 설명
  - [policies.md](docs/shopify/policies.md) — 배송/반품/개인정보 정책
  - [footer_copy.md](docs/shopify/footer_copy.md) — 한글 푸터·법률 문구
  - [decisions_pending.md](docs/shopify/decisions_pending.md) — 미결정 항목
- [**Archive**](docs/archive/) — 구식 버전 문서 (참조용)
  - `name_included_v13_plan.md` / `name_included_v14_layout.md` / `name_included_v15_baseline.md`
