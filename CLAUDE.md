# Everstory 스티커 제작 파이프라인

Adobe CC 2026 기반 스티커 시트 자동화. PSD 누끼/실루엣 → A5 그리드 배치 + 칼선 분리 → ET-8550 출력 + Summa D75 컷팅.

## MVP 상품 기준

첫 주력 상품은 **A5 커스텀 사진 다이컷 스티커 시트**다. 대표 모드는 **Name Included**이며, Photo Only는 기본형 옵션으로 유지한다.

- **Photo Only**: 사진 누끼 스티커만 A5 한 시트에 자동 배치
- **Name Included**: 사진 중심 배치 + 상단 production header에 고객 이름/주문 정보 표기. 별도 이름 스티커는 시트에 넣지 않음
- **Mini Decor**: 후순위 확장. 사진보다 중요도가 낮음
- **문구 스티커**: MVP와 현재 파이프라인 범위에서 제외
- **PhotoStrip**: 주력 파이프라인에서 제외
- **시트 수**: MVP는 A5 한 시트만 생성. 넘치는 입력은 사진 수/크기 조정으로 운영
- **칼선 여백 1mm/2mm**: 고객 옵션이 아니라 내부 제작 옵션

상세 상품/운영 규칙은 `docs/product_mvp_photo_sheet.md`에 둔다.

## 제품 카테고리

스크립트가 직접 다뤄야 하는 영역은 **모양(Shapes)** 만이다. 재질·대상은 입력 단계 컨텍스트로만 기록.

### 재질 (Materials) — 참고용
- **일반**: 흰색 (다이어리, 패키징용)
- **방수**: 흰색 / 펄그레이 / 은색 / 금색 (텀블러, 폰케이스, 야외용)
- **반투명**: 답례품, 유리병 (은은한 비침)

### 대상 (Subjects) — 참고용
- **인물/생물**: 사람, 반려동물
- **텍스트**: 캘리그라피, 네임택
- **그래픽**: 로고, 아이들 그림, 애착 사물, 풍경/건물

### 모양 (Shapes) — 스크립트 책임 영역

칼선(per-sticker) + 시트 레이아웃 두 축으로 분해.

**Cutline 종류** (개별 스티커):

| 종류 | 설명 | 현재 지원 | 확장 시 접근 |
|------|------|-----------|--------------|
| **다이컷** | 피사체 외곽선 따라 자름 — PNG trace | ✓ 현재 기본 (`_traceAndUnite`) | — |
| **기본도형** | 원·하트·사각형 등 고정 도형 | ✗ | 템플릿에 도형 path 라이브러리 + 셀 크기로 스케일 (PNG trace 우회) |
| **프레임 (가운데 타공)** | 폴라로이드형, 외곽 + 내곽 compound path | ✗ | template에 외곽+내곽 정의된 도형, 사진은 PrintData에 그대로 |

**시트 레이아웃**:

| 레이아웃 | 설명 | 현재 지원 | 확장 시 접근 |
|----------|------|-----------|--------------|
| **스티커 시트** | A5 판형에 여러 스티커 grid (11인치 롤 폭 활용) | ✓ `Everstory_Grid.jsx` | — |

**현재 파이프라인 범위**: 다이컷 × A5 스티커 시트는 `Everstory_Grid.jsx` 로 자동화. 기본도형/프레임 칼선 확장은 추후 단계. PhotoStrip은 MVP 범위에서 제외한다.

**스크립트 분리 기준**:
- `Everstory_Grid.jsx` — legacy. `template_cutout.ait` 의 `info > body` 영역에 여러 개별 스티커를 bin packing 하는 A5 스티커 시트 레이아웃. 현재 운영은 `Everstory_mixed.jsx` 가 대체 (legacy 보관: `legacy/Everstory_Grid.jsx`)
- `Everstory_NameSticker.jsx` — 다이컷 스타일 이름 스티커 단독 생성/검수용 프로토타입. 현재 시트에는 통합하지 않고 폰트/backing/CutContour 테스트에 사용
- `Everstory_NameIncludedSheet.jsx` — Name Included 단일 사이즈 시트 v15 baseline. 동결 운영 기준 (`docs/name_included_v15_baseline.md`). 새 기능은 `Everstory_mixed.jsx` 에 추가하고 v15 는 안정성용으로 유지
- `Everstory_mixed.jsx` — 운영 메인 (v19 uniform grid). NameIncluded v15 의 superset. 폴더 → 페어 ListBox multiselect → 단일 사이즈 (XS/S/M/L/XL/XXL 인치 6단계) 또는 Mixed (2.5/1.75/1.25/1in 4 사이즈) 시트 생성 → `03_output/` 자동 저장. 단일 사이즈는 적응형 직사각 셀 (max cellW × max cellH) 위 `cols × rows` uniform grid 로 배치 — 모든 행이 같은 디자인 round-robin 순서, 외곽 4면 = 내부 gap 자동 균등 분배. 사이즈별 디자인 cap auto-cap (단일 모드: XS 13 / S 7 / M 5 / L 3 / XL 3 / XXL 1, Mixed: 1 디자인 고정 + 2.5×1 + hero 옆 1.25×4 stack + 1.75×3 + filler 1.25/1in = 약 23 슬롯). v15 trace cache 흐름 그대로 상속
- `Everstory_mixed_v2.jsx` — v2 브랜드 템플릿(`template_cutout_v2.ait`) 변종 (v20). v1 superset, packing/cap 룰 동일. 차이점: `info > body` 142×175mm (v1 148×195) + `info > header_right` 우측 영역에만 값 주입 (라벨은 .ait 정적). 헤더 우측 2줄 우측 정렬: `{N} photos * {sizeLetter} / {inch} / {cut}mm  * {material}` / `Name add-on * Order date {date}`. 고객명/주문번호는 다이얼로그에 남겨두고 파일명·메타용으로만 사용. v1 은 안정성 백업으로 동결
- `Everstory_CleanOffsetPath.jsx` — 선택한 Offset Path/CompoundPath 안쪽 조각을 제거하는 검수 보조 도구
- `Everstory_TemplateBuilder.jsx` — 고정 프레임 템플릿/slot PathItem을 생성하는 보조 도구

## 디렉토리 구조

```
.
├── Everstory_mixed.jsx       # 운영 메인 — 단일사이즈+Mixed multiselect 시트 (v19 uniform grid)
├── Everstory_mixed_v2.jsx    # v2 브랜드 템플릿용 변종 (v20, template_cutout_v2.ait + info > header_right)
├── Everstory_NameIncludedSheet.jsx # Name Included 단일 사이즈 시트 (v15 baseline, 동결)
├── Everstory_NameSticker.jsx # 다이컷 스타일 이름 스티커 단독 생성/검수용
├── Everstory_CleanOffsetPath.jsx # 선택한 offset/compound path 내부 조각 제거 유틸
├── Everstory_TemplateBuilder.jsx # 고정 프레임/slot PathItem 자동 생성기
├── legacy/
│   ├── Everstory_Grid.jsx                       # legacy Photo Only 시트 (v10)
│   └── Everstory_NameIncludedSheet_deprecated.jsx
├── scripts/
│   └── save_route.jsx        # PS PNG 라우팅 헬퍼 (legacy)
├── plugins/everstory_save/   # Phase A — UXP 패널 플러그인 (PS)
├── templates/
│   ├── template_cutout.ait   # A5 다이컷 시트 베이스 (v1), info 레이어 안 body/header/header_border/border/reg_border PathItem
│   ├── template_cutout_v2.ait # v2 브랜드 템플릿 (Everstory_mixed_v2.jsx 전용). body 142×175 + info > header > header_right (값만)
│   └── template_4cut.ait     # TemplateBuilder용 베이스, Info > a5_border + Frame > slot_01..slot_N PathItem
├── projects/{이름}/          # 작업별 폴더 (평면 구조)
│   ├── 01_original/          # 원본 PSD/JPG/TIF
│   ├── 02_cutout/            # Phase A 산출 (_clean.psd + _sil.png 페어)
│   └── 03_output/            # Phase B+D 산출 (.ai 시트)
└── docs/
    ├── product_mvp_photo_sheet.md # MVP 상품/운영 규칙
    └── template_pathitems.md # Illustrator 템플릿 PathItem 제작 가이드
```

## 파이프라인

### 0) 수동 (Photoshop)
사용자가 PSD에 두 레이어 직접 제작:
- `layers[0]` (맨 위) = **실루엣** (검정 hard-edge, 다리 사이/귀-머리 틈 직접 메꿈)
- `layers[1..N]` = **누끼 + 보정 레이어** (Brightness/Contrast, Levels 등 자유)

### 1) Phase A — UXP 패널 (`plugins/everstory_save/`)
- 입력: 위 PSD
- 동작: `layers[0]`만 표시 → `_sil.png` 저장 → `layers[1..N]`만 표시 → `_clean.psd` 저장. 둘 다 longest 1800px로 리사이즈.
- 출력: `02_cutout/{folderName}_NN_clean.psd` + `{folderName}_NN_sil.png` (같은 치수 페어). `folderName` = 02_cutout 의 부모 폴더 (= 고객명). `NN` = 폴더 안 기존 페어의 max + 1, zero-pad 2자리. 같은 PSD 를 다시 저장하면 새 번호가 할당된다 (덮어쓰기 회피)
- 라우팅: 원본 PSD 가 `01_original/` 또는 `02_cutout/` 안에 있을 때만 위 패턴 적용. 그 외 (Desktop 등) 는 raw 파일명 유지 (안전 fallback)
- 자동화 없음: Select Subject / Levels 같은 PS 액션은 호출하지 않음. 누끼 품질은 사용자 책임.

### 2) Phase B+D 운영 메인 — `Everstory_mixed.jsx` (Illustrator)
NameIncluded v15 + 단일/Mixed 사이즈 + 페어 multiselect + 03_output 자동 저장. v15 trace cache 흐름 (`docs/name_included_v15_baseline.md`) 그대로 상속하고 다이얼로그 흐름과 사이즈 처리만 확장한다.

**입력**: `02_cutout/` 폴더 안 페어들 (다이얼로그 ListBox 에서 사용할 페어를 multiselect)
**템플릿**: `templates/template_cutout.ait` — `info > body` (배치 영역) + `info > header` (ORDER DETAIL 영역)
**출력**: `03_output/{YYYYMMDD_HHMMSS}_{sizeTag}_sheet01.ai` — sizeTag 는 단일 사이즈면 인치 표기 (`1in`, `1.25in`, `2.5in` 등), Mixed 면 `MIX`

**다이얼로그**:
1. 폴더 선택 (`02_cutout`)
2. 고객 이름 (default = 폴더명 자동 추출) / 헤더 정보 (재질·주문·날짜)
3. **사진 페어 ListBox (multiselect, 행 전체 hit area)** + 카운트 라벨 `선택: N / cap`. `numberOfColumns:1 + showHeaders:false` 로 이름 옆 빈 공간 클릭도 선택 가능
4. 사이즈 드롭다운 (인치 6단계 + Mixed): XS 0.75" / S 1" / M 1.25" / L 1.5" / XL 1.75" / XXL 2.5" / Mixed 2.5/1.75 + 1.25/1in. 기본 S (1")
5. 칼선 여백: 0mm / 0.5mm / 1mm / 2mm (default 1mm)

uniform grid 가 시각 간격을 자동 균등 분배하므로 gap 입력은 다이얼로그에 없다. Mixed 모드 zone packer 는 내부적으로 `GAP_DEFAULT_MM = 1.5mm` 고정 사용.

**사이즈별 셀/cap 표 (A5 body 148×195, padding 0, gap 1.5mm)**:

| Letter | 인치 | mm | 셀 수 | 디자인 cap |
|--------|------|------|-------|-----------|
| XS | 0.75" | 19.05 | 63 | 13 |
| S | 1" | 25.4 | 35 | 7 |
| M | 1.25" | 31.75 | 20 | 5 |
| L | 1.5" | 38.1 | 12 | 3 |
| XL | 1.75" | 44.45 | 12 | 3 |
| XXL | 2.5" | 63.5 | 6 | 1 |
| Mixed | 2.5/1.75 + 1.25/1" | hero row 2.5×1+1.25×4 stack / 1.75×3 / 1×5 행 ×3 ≈ 23슬롯 | — | 1 |

**디자인 cap (auto-cap)**:
- 사이즈 변경 시 cap 갱신, ListBox 선택이 cap 초과면 자동 trim
- 룰 도출: 각 디자인 시트당 최소 4–5회 등장 보장 + uniform grid 슬롯 기준 (`SLOTS_BY_SIZE` 표는 정사각 셀 + gap 1.5mm baseline)
- 초기 선택은 cap 까지 자동 채움 (운영 편의)

**Uniform grid 룰 (단일 사이즈 모드, v19)**:
- 적응형 직사각 셀: `cellBoxW = max(pair.cellW)`, `cellBoxH = max(pair.cellH)`. 모든 페어 정사각이면 `sizeMm × sizeMm`. 한 방향 aspect (모두 가로 / 모두 세로) 면 짧은 변이 줄어들어 슬롯 늘어남
- `cols = floor((binW + gap) / (cellBoxW + gap))`, `rowsCount = floor((binH + gap) / (cellBoxH + gap))`. `slots = cols × rowsCount`
- 시각 간격: `hSpace = (binW - cols × cellBoxW) / (cols + 1)`, `vSpace = (binH - rowsCount × cellBoxH) / (rowsCount + 1)`. 외곽 4면 = 내부 모든 gap 동일
- 슬롯 채우기: `placed[k] = layoutPairs[k % designCount]` 행 우선 round-robin. `slots mod D` 개의 보너스가 앞쪽 디자인에 배정 (전체 시트가 같은 디자인 순서로 보임)
- `leftover` 항상 0 — 격자 슬롯에 round-robin 이라 못 들어가는 케이스 없음
- Mixed 모드는 zone packer (`_packMixedZones`) 별도 — uniform grid 룰 미적용

**trace 실패 자동 제외**:
- `_buildCutlineCache` 가 fail 한 페어의 base 들을 set 으로 모아 placement 시도 자체를 skip
- 결과 알림에는 base 별 dedupe 된 1줄 + skip 된 placement 수 안내. 운영자에게 IL 재시작 후 재시도 권장 메시지 포함

**사이즈 모드 처리**:
- **단일 사이즈**: 선택한 페어들을 cellW×cellH (긴 변 = 사이즈, 짧은 변 = aspect) 로 환산, `_uniformGridPack` 으로 적응형 직사각 셀 위 cols × rows 격자 산출. 셀 안 사진은 `_placePhotoSticker` 가 정중앙 정렬 (한 변 비율 맞춤 + 다른 변 padding)
- **Mixed**: `_packMixedZones` zone packer. (1) hero row = 2.5"×1 + 옆에 `MIXED_HERO_STACK` (1.25" 2×2 grid) compound item — 64.5×64.5mm 가 hero 높이(63.5mm)와 거의 매칭. (2) 다음 row 부터 `MIXED_FIXED_PATTERN` 의 1.75"×3 배치 + `_fillMixedRowBalanced` 가 행 끝 빈 폭에 1.25/1" horizontal filler. (3) 그 아래 `_appendMixedFillerRows` 가 used-area 기준으로 1.25" 또는 1" 단일 사이즈 row 를 vertical fit 까지 누적. 시트 면적 fill ~85%. stack item 은 `_shelfRowsToPlaced` 가 cols×rows 로 expand 하면서 vertical center 정렬

**행 정렬**:
- **단일 사이즈 (uniform grid, v19)**: 모든 셀 동일한 cellBoxW × cellBoxH. 외곽 4면 여백 = 내부 모든 gap = `hSpace`/`vSpace`. 행마다 hGap 변동 없음, 마지막 행도 동일 디자인 순서 유지
- **Mixed (per-row + 세로 justify)**: 행마다 outer L = inner = outer R = `(binW - ΣitemW) / (n+1)`, 시트 전체 outer top = row gap = outer bottom = `(binH - ΣrowH) / (R+1)`. 행마다 가로 gap 다름 (행 안 사진 수에 따라)
- 시각 spacing 은 binW/binH 와 cellBox 만으로 자동 계산. 단일 사이즈는 사용자 gap 입력 없음 (uniform grid 자동 분배). Mixed 는 내부 `GAP_DEFAULT_MM = 1.5mm` 고정

**z-order** (위에서 아래): `KissCut` → `info` (템플릿 유지) → `PrintData` (+ trace 중에는 hidden `TraceStash` 임시 레이어, 끝에 제거)

**저장**: 결과 메시지 직전에 `03_output/` 으로 자동 saveAs (Illustrator 24 호환 + PDF 호환). 입력 폴더가 `02_cutout` 이 아니면 동일 폴더에 저장.

### 3) Name Included v15 baseline — `Everstory_NameIncludedSheet.jsx` (Illustrator, 동결)
단일 사이즈 전용 baseline. 새 기능은 `Everstory_mixed.jsx` 에 들어간다. 운영 안정성 백업으로 유지 (`docs/name_included_v15_baseline.md`).

### 4) Photo Only legacy — `legacy/Everstory_Grid.jsx` (Illustrator, 운영 비사용)
v10 까지 운영했던 Photo Only 단일 사이즈 시트 (MaxRects + BSSF bin packing, `info > body` 기반). 디자인 cap 룰 도입 후 운영 메인은 `Everstory_mixed.jsx` 단일 사이즈 모드로 흡수됐다. 알고리즘 참조용으로 `legacy/` 에 보관.

### 5) Name Sticker Prototype — `Everstory_NameSticker.jsx` (Illustrator)
이름 스티커 1개를 단독 생성하고 저장하지 않은 Illustrator 문서에 열린 채로 둔다. 이름 입력 → 한글/영문별 고정 폰트 후보 선택 → 컬러 선택 → `PrintData`의 다이컷 backing/text와 `KissCut`의 `CutContour` path를 생성한다. 선택한 PostScript 폰트가 없으면 자동 대체 없이 중단한다. 현재 Name Included 시트에는 통합하지 않고, 폰트/backing shape/칼선 안정성 검수용으로만 둔다.

### 6) Template Builder — `Everstory_TemplateBuilder.jsx` (Illustrator)
고정 프레임 템플릿의 검정 프레임과 `Frame > slot_01..slot_N` PathItem을 자동 생성하는 보조 스크립트. PhotoStrip 배치 상품은 MVP에서 제외하지만, 템플릿 생성 도구는 보조 유틸리티로 유지한다.

**동작**: `templates/template_4cut.ait` 의 `Info > a5_border` 를 읽고 그 안쪽 margin 영역에 `Frame` 프레임과 `slot_01..slot_N` 을 재생성. `Info > a5_border` 는 148×210mm A5 기준선이며 스크립트가 삭제/재생성하지 않는다. `Frame` 내용은 a5_border 안에서 상/좌/우 3mm, 하단 15mm 마진을 둔다. 스크립트는 artboard 자체나 기존 템플릿 레이어의 위치/순서를 바꾸지 않고, 생성 대상인 `Frame`, `KissCut`, `PrintData`, 과거 `slot_*` 만 정리한다.
**생성 레이어**:
- `Frame` — 3mm 검정 외곽선, 내부 분할선, 하단 배너, `slot_01..slot_N`
- `KissCut` — 각 좌우 스티커 1장당 사각 칼선 1개, 스티커 외곽에서 -1mm inset, `CutContour` 적용
- 슬롯 번호는 좌측 스티커 위→아래를 먼저 매기고, 우측 스티커 위→아래를 이어서 매김

**프리셋**:
- 1열×2행, 좌우 2장
- 1열×3행, 좌우 2장
- 1열×4행, 좌우 2장

생성 후 Illustrator에서 검수하고 `templates/template_4cut.ait` 로 저장한다.

## 고정 컨벤션 (변경 시 파이프라인 전체 깨짐)

- **AI 레이어**: `PrintData` (raster), `KissCut` (cutline), `info` (템플릿 디자인)
- **PathItem (template_cutout.ait)**: `info > body` (스크립트가 사진 pack 영역으로 읽음, 필수), `info > header` (NameIncludedSheet / mixed 가 ORDER DETAIL 그릴 영역, 필수), `info > header_border` / `info > border` / `info > reg_border` (시각 가이드, 스크립트 무시), `Cutline` (trace 임시 이름)
- **템플릿 PathItem 제작법**: `docs/template_pathitems.md` 참고 (`body`, `header`, TemplateBuilder용 `slot_01..slot_N`)
- **Spot color**: `CutContour` — M=100, SPOT (Summa/Roland 표준)
- **파일명**: `01_original/cute_pet.psd` → `02_cutout/{folderName}_NN_clean.psd` + `{folderName}_NN_sil.png` (예: `로운_01_clean.psd`, `로운_01_sil.png`) → `03_output/{YYYYMMDD_HHMMSS}_1in_sheet01.ai` (Mixed 면 `MIX` 태그)
- **폴더명**: 영어 (`01_original` 등) — macOS NFD vs JS NFC 비교 실패 회피

## 작업 원칙

- **방어 코드 추가 금지**: RGB 강제 변환, face crop, 빈 PNG 검증, 클립보드 경합 처리 등은 추가하지 않음. 사용자가 입력·환경을 수동 통제.
- **Phase A는 액션 호출 없음**: 레이어 visibility 토글 + 저장만.
- **외곽선 그대로 사용**: offset/simplify는 v4에서 제거됨. cutline 품질은 Image Trace 파라미터로만 조정.
- **Make Work Path/SVG 경로 명시적 기각**: noise/분리된 패스 문제로.
- **AI 자동화는 ExtendScript** (`.jsx` + DOM + `executeMenuCommand`), **PS 자동화는 UXP** (`.js` + batchPlay).

## 하드웨어

- **프린터**: Epson ET-8550 (염료 잉크)
- **컷터**: Summa D75 — CutContour 스폿 인식, 노드 500–1500개 선호 (Image Trace 2.0px tolerance 기준)

## Everstory_mixed.jsx 주요 함수 (v19 uniform grid)

| 함수 | 역할 |
|------|------|
| `_collectPairs` | `02_cutout/`에서 페어 수집, base 이름 정렬 |
| `_showDialog(pairs, defaultName)` | ListBox multiselect + auto-cap. 사이즈 변경 시 cap 갱신, 선택 자동 trim. `defaultName` 으로 고객 이름 input 초기화 |
| `_deriveDefaultCustomerName` | inputFolder 또는 그 부모 폴더명을 다이얼로그 default 고객 이름으로 추출 (`02_cutout` 폴더면 부모 폴더 사용) |
| `_measurePairAspect` | 페어별 sil.png aspect 1회 측정 후 캐시 (`pair.aspect`) |
| `_itemForSize` | Mixed 모드에서 한 페어를 사이즈별 packItem (44.45/38.1/31.75/25.4mm) 으로 즉석 생성 |
| `_buildMixedItems(pair)` / `_mixedTotalSlots` / `_mixedSpecString` / `_mixedHumanString` | `MIXED_PATTERN` 기반 헬퍼 — 패턴 변경 시 자동 반영 |
| `_uniformGridPack(layoutPairs, binW, binH, gap)` | **단일 사이즈 모드 메인 packer (v19)**. 적응형 직사각 셀 (max cellW × max cellH) 위 cols × rows 격자 산출, 외곽 4면 = 내부 gap 자동 균등, 모든 슬롯 round-robin 채움 |
| `_appendShelfRowsOnce` | items 를 cycle 없이 한 번씩만 row 에 누적. Mixed 모드에서 사용 |
| `_shelfRowsToPlaced(rows, binW, binH, gap)` | Mixed 모드 row → placed 변환. per-row 가로 justify (outer L = inner = outer R), 세로 justify (outer top = inner = outer bottom). final body 좌표 직접 출력 |
| `_shelfPack` / `_resolveMinRepeat` / `_sortedPairsForShelf` / `_buildShelfFillItems` | v18 까지의 단일 사이즈 packer. v19 부터 dead path (회귀 비교용으로 보관) |
| `_resolveTemplate` | `$.fileName` 기준 상대경로로 .ait 자동 발견 |
| `_findInfoPath` | `info` 레이어 안 임의 이름 PathItem 검색 (`body` / `header`) |
| `_buildCutlineCache` | unique pair 마다 1회 Image Trace, hidden `TraceStash` 레이어에 캐시 |
| `_placePhotoSticker` | cached cutline `duplicate()` + PSD embed + 정규화 좌표 정합. trace cache 없으면 throw |
| `_traceAndUnite` | Image Trace + Pathfinder Add + expandStyle (cache 빌드용 임시 doc 안에서) |
| `_stripPSDPaths` / `_stripEmbeddedPSDPathsNear` | embed된 PSD 의 saved path 재귀 제거 (clipping mask 보존) |
| `_ensureCutContour` / `_forceCutContourStroke` | `CutContour` 스폿 색상 일관성 |
| `_drawProductionHeader` | `info > header` 안에 좌측 고객 이름 + 우측 ORDER DETAIL 그리기 |
| `_buildOrderDetail` | TYPE/SPEC/ORDER + MATERIAL/PHOTOS/DATE 6쌍 메타 |
| `_resolveOutputFolder` | `02_cutout` → sibling `03_output` 자동 생성, 그 외엔 입력 폴더 |
| `_timestamp` / `_saveAi` | `YYYYMMDD_HHMMSS` 타임스탬프 + Illustrator 24 + PDF 호환 saveAs |

## 미해결 / 알려진 한계

- **자동 저장** — `Everstory_mixed.jsx` 는 결과 알림 직전 `03_output/` 으로 자동 saveAs. 저장 실패는 알림 마지막 줄에 표시되고 문서는 열린 상태로 유지된다.
- **trace 실패는 명시적 에러** — `_buildCutlineCache` 또는 `_placePhotoSticker` 에서 throw → `failedItems` 에 push → 결과 알림에 포함. 해당 셀은 PSD 만 남고 cutline 없음.
- **회전 비활성** — uniform grid / shelf packing 시 90° 회전 안 함. 스티커 방향 의도 보존.
- **cutline offset/smooth 는 수동 작업** — 스크립트는 선택한 1mm/2mm 만큼 이미지를 안쪽으로 줄여 공간만 확보하고, 자동 offset/smooth 는 적용하지 않는다.
- **한 시트 정책** — A5 한 시트만 생성. 디자인 cap (auto-cap) 으로 입력 단계에서 운영자가 한 시트 분량으로 선택. testConfig 경로에서 cap 위반은 안전판으로 잘려서 들어감.
- **uniform grid 효율** (v19) — 단일 사이즈 모드는 정사각 셀 baseline (gap 1.5mm 기준, `SLOTS_BY_SIZE` 표 그대로). 적응형 직사각이라 모든 art 가 한 방향 (가로/세로) 이면 슬롯 더 들어가고, aspect 가 섞이면 이론치 그대로. Mixed 모드는 zone packer (~80%).
- **uniform grid 슬롯 분배** — `slots = cols × rows`. `slots mod D` 개의 보너스가 앞쪽 디자인에 배정 (round-robin 첫 사이클이 그 만큼 더 길어짐). leftover 발생 안 함 — 모든 슬롯 채움 보장.
- **trace cache scope** — 시트당 unique 페어 1회 trace, hidden `TraceStash` 레이어에 캐시 후 끝에 제거.
- **PhotoStrip 제외** — 현재 주력 파이프라인에서 사용하지 않는다.
- **TemplateBuilder 는 template_4cut 재생성용** — `template_4cut.ait` 의 `Info > a5_border` 를 기준으로 `Frame`, `KissCut`, `slot_*` 을 재생성하므로 실행 후 검수하고 저장한다.
