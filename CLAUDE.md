# Everstory 스티커 제작 파이프라인

Adobe CC 2026 기반 스티커 시트 자동화. PSD 누끼/실루엣 → A5 그리드 배치 + 칼선 분리 → ET-8550 출력 + Summa D75 컷팅.

## MVP

첫 주력 상품은 **A5 커스텀 사진 다이컷 스티커 시트**. 대표 모드는 **Name Included** (사진 + 상단 헤더에 고객/주문 정보). 운영 메인은 **`Everstory_mixed_v2.jsx`** (v2 브랜드 템플릿). 한 시트 정책 — A5 한 시트만 생성, 넘치는 입력은 사이즈별 디자인 cap (auto-cap) 으로 입력 단계에서 제한. 칼선 여백 (0/0.5/1/2mm) 은 고객 옵션이 아니라 내부 제작 옵션.

상세 상품 정책·재질/대상 분류·이름 스티커 프로토타입·구현 상태는 `docs/product_mvp_photo_sheet.md`. 다이컷 외 칼선 (기본도형/프레임) 은 미구현. PhotoStrip·문구 스티커는 MVP 외.

## 디렉토리 구조

```
.
├── Everstory_mixed_v2.jsx    # 운영 메인 (v20). v2 브랜드 템플릿용, info > header > header_right TextFrame 주입
├── Everstory_mixed.jsx       # v1 백업 (v19 uniform grid). v2 의 superset baseline
├── Everstory_NameIncludedSheet.jsx # v15 baseline 동결, mixed.jsx 깨졌을 때 안정성용
├── Everstory_NameSticker.jsx # 이름 스티커 단독 검수 프로토타입 (시트 통합 안 함)
├── Everstory_CleanOffsetPath.jsx # offset/compound path 내부 조각 제거 유틸
├── Everstory_TemplateBuilder.jsx # template_4cut.ait 의 frame/slot 자동 생성 (PhotoStrip 라인용 보조 도구)
├── legacy/
│   ├── Everstory_Grid.jsx                       # legacy 단일 사이즈 시트 (v10, 운영 비사용)
│   ├── Everstory_NameIncludedSheet_deprecated.jsx
│   └── Everstory_PhotoStrip.jsx                 # retired, MVP 외
├── plugins/everstory_save/   # Phase A — UXP 패널 플러그인 (PS)
├── templates/
│   ├── template_cutout.ait   # v1 베이스. info > body (148×195mm) + header / header_border / border / reg_border
│   ├── template_cutout_v2.ait # v2 브랜드 템플릿. info > body (142×175mm) + info > header > header_right (TextFrame, 값만 주입)
│   └── template_4cut.ait     # TemplateBuilder 보조용. Info > a5_border + Frame > slot_01..slot_N
├── projects/{이름}/
│   ├── 01_original/          # 원본 PSD/JPG/TIF
│   ├── 02_cutout/            # Phase A 산출 (_clean.psd + _sil.png 페어)
│   └── 03_output/            # Phase B 산출 (.ai 시트)
└── docs/
    ├── product_mvp_photo_sheet.md      # MVP 상품/운영 규칙, 재질/대상 분류
    ├── template_pathitems.md           # Illustrator 템플릿 PathItem/TextFrame 제작 가이드
    ├── everstory_mixed_internals.md    # mixed.jsx packing 알고리즘 + 사이즈 cap 표 + 함수 매핑
    └── name_included_v15_baseline.md   # v15 동결 운영 기준
```

## 파이프라인

### Phase 0 — 수동 (Photoshop)
사용자가 PSD 에 두 레이어 직접 제작:
- `layers[0]` (맨 위) = **실루엣** (검정 hard-edge, 다리 사이/귀-머리 틈 직접 메꿈)
- `layers[1..N]` = **누끼 + 보정 레이어** (Brightness/Contrast, Levels 등)

### Phase A — UXP 패널 (`plugins/everstory_save/`)
`layers[0]` 만 표시 → `_sil.png` 저장 → `layers[1..N]` 만 표시 → `_clean.psd` 저장. 둘 다 longest 1800px 리사이즈. 출력은 `02_cutout/{folderName}_NN_{clean.psd|sil.png}` (`folderName` = 02_cutout 부모 폴더 = 고객명, `NN` = 기존 페어 max + 1, 2자리 zero-pad). 원본 PSD 가 `01_original/` 또는 `02_cutout/` 안에 있을 때만 위 패턴 적용 — 그 외엔 raw 파일명 유지. PS 액션 호출 없음, 누끼 품질은 사용자 책임.

### Phase B — Illustrator
운영 메인은 **`Everstory_mixed_v2.jsx`** (v2 브랜드 템플릿). 폴더 → 페어 ListBox multiselect → 단일 사이즈 (XS/S/M/L/XL/XXL) 또는 Mixed → 시트 생성 → `03_output/` 자동 saveAs.

다이얼로그 5단계: ① 폴더 선택 (`02_cutout`) ② 고객 이름 (default = 폴더명) + 주문/날짜 ③ 페어 ListBox multiselect (행 전체 hit area, `선택: N / cap` 카운트) ④ 사이즈 dropdown (인치 6단계 + Mixed, 기본 S 1") ⑤ 칼선 여백 (0/0.5/1/2mm, 기본 1mm).

입력: `02_cutout/` 페어. 템플릿: `templates/template_cutout_v2.ait` — `info > body` (142×175mm, 사진 pack 영역) + `info > header > header_right` (TextFrame, `.contents` 만 inplace 교체). v1 (`Everstory_mixed.jsx` + `template_cutout.ait`, body 148×195mm + `info > header` PathItem 에 ORDER DETAIL 그리기) 은 안정성 백업으로 유지. 출력: `03_output/{YYYYMMDD_HHMMSS}_{sizeTag}_sheet01.ai` — 단일 사이즈면 인치 (`1in`, `1.25in` 등), Mixed 면 `MIX`.

packing 알고리즘 (uniform grid v19, Mixed zone packer)·사이즈별 cap 표·함수 매핑·v2 헤더 처리는 `docs/everstory_mixed_internals.md`.

### Phase B 보조 스크립트
- `Everstory_NameIncludedSheet.jsx` — v15 baseline 동결. 새 기능 추가 안 함, mixed.jsx 가 깨졌을 때 백업 (`docs/name_included_v15_baseline.md`)
- `Everstory_NameSticker.jsx` — 이름 스티커 1개 단독 생성 프로토타입. 시트 통합 안 함, 폰트/backing/CutContour 검수용. 폰트 후보·컬러는 `docs/product_mvp_photo_sheet.md`
- `Everstory_TemplateBuilder.jsx` — `template_4cut.ait` 의 `Frame`, `KissCut`, `slot_01..slot_N` 자동 재생성. PhotoStrip 라인은 MVP 외지만 도구는 유지 (다른 라인업 제작용). 동작·프리셋은 `docs/template_pathitems.md`
- `Everstory_CleanOffsetPath.jsx` — 선택한 offset/compound path 안쪽 조각 제거 유틸

## 고정 컨벤션 (변경 시 파이프라인 깨짐)

- **AI 레이어**: `PrintData` (raster), `KissCut` (cutline), `info` (템플릿 디자인). z-order 위→아래 = `KissCut` → `info` → `PrintData` (+ trace 중 hidden `TraceStash` 임시 레이어)
- **PathItem (template_cutout.ait v1)**: `info > body` (사진 pack 영역, 필수), `info > header` (ORDER DETAIL 영역, 필수), `info > header_border` / `info > border` / `info > reg_border` (시각 가이드, 스크립트 무시)
- **TextFrame (template_cutout_v2.ait v2)**: `info > header > header_right` (필수, **TextFrame** — PathItem 아님). 폰트/사이즈/우측 정렬은 .ait 가 보유, 스크립트는 `.contents` 만 inplace 교체
- **PathItem/TextFrame 제작법**: `docs/template_pathitems.md`
- **Spot color**: `CutContour` — M=100, SPOT (Summa/Roland 표준)
- **파일명**: `01_original/cute_pet.psd` → `02_cutout/{folderName}_NN_clean.psd` + `{folderName}_NN_sil.png` (예: `로운_01_clean.psd`, `로운_01_sil.png`) → `03_output/{YYYYMMDD_HHMMSS}_1in_sheet01.ai` (Mixed 면 `MIX` 태그)
- **폴더명**: 영어 (`01_original` 등) — macOS NFD vs JS NFC 비교 실패 회피

## 작업 원칙

- **방어 코드 추가 금지**: RGB 강제 변환, face crop, 빈 PNG 검증, 클립보드 경합 처리 등은 추가하지 않음. 사용자가 입력·환경을 수동 통제
- **Phase A 액션 호출 없음**: 레이어 visibility 토글 + 저장만. Select Subject / Levels 같은 PS 액션 호출 안 함
- **외곽선 그대로 사용**: offset/simplify 는 v4 에서 제거. cutline 품질은 Image Trace 파라미터로만 조정. cutline offset/smooth 는 수동 작업 (스크립트는 1mm/2mm 만큼 이미지 inset 만 함)
- **Make Work Path / SVG 경로 명시적 기각**: noise/분리 패스 문제로
- **AI 자동화는 ExtendScript** (`.jsx` + DOM + `executeMenuCommand`), **PS 자동화는 UXP** (`.js` + batchPlay)

## 하드웨어

- **프린터**: Epson ET-8550 (염료 잉크)
- **컷터**: Summa D75 — CutContour 스폿 인식, 노드 500-1500개 선호 (Image Trace 2.0px tolerance 기준)

## 운영 한계

- 자동 saveAs 실패 시 결과 알림 마지막 줄에 표시되고 문서는 열린 상태로 유지
- packing 시 90° 회전 안 함 — 스티커 방향 의도 보존
- trace 실패한 페어는 placement skip + 결과 알림에 base 별 안내. 셀은 PSD 만 남고 cutline 없음 → IL 재시작 후 재시도 권장
