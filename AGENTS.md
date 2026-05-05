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
- `Everstory_mixed.jsx` — 운영 메인. NameIncluded v15 의 superset. 폴더 → 페어 ListBox multiselect → 단일 사이즈 (XS/S/M/L/XL/XXL 인치 6단계) 또는 Mixed (1.75/1.5/1.25/1in 4 사이즈) 시트 생성 → `03_output/` 자동 저장. 사이즈별 디자인 cap auto-cap (단일 모드: XS 13 / S 7 / M 5 / L 3 / XL 3 / XXL 1, Mixed: 1 디자인 고정 + 1.75×3+1.5×3+1.25×8+1×5 = 19 슬롯). v15 trace cache 흐름 그대로 상속
- `Everstory_CleanOffsetPath.jsx` — 선택한 Offset Path/CompoundPath 안쪽 조각을 제거하는 검수 보조 도구
- `Everstory_TemplateBuilder.jsx` — 고정 프레임 템플릿/slot PathItem을 생성하는 보조 도구

## 디렉토리 구조

```
.
├── Everstory_mixed.jsx       # 운영 메인 — 단일사이즈+Mixed multiselect 시트 (v18)
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
│   └── template_cutout.ait   # A5 다이컷 시트 베이스, info 레이어 안 body/header/header_border/border/reg_border PathItem
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
4. 사이즈 드롭다운 (인치 6단계 + Mixed): XS 0.75" / S 1" / M 1.25" / L 1.5" / XL 1.75" / XXL 2.5" / Mixed 1.75/1.5/1.25/1in. 기본 S (1")
5. 칼선 여백: 1mm / 2mm
6. **사진 간격 (gap, 0.1mm 단위 input)** — default 1.5mm, 범위 0.5–5.0mm. 범위 밖이면 default 로 fallback + 경고
7. **최적값 자동 (max fill) 체크박스** — 체크 시 input 무시하고 g ∈ [0.5, 5.0] 0.1 step 시뮬레이션해서 placed 가 최대인 g 채택 (동률이면 큰 g 선호). aspect 편차가 큰 입력에서 dead space 최소화

**사이즈별 셀/cap 표 (A5 body 148×195, padding 0, gap 1.5mm)**:

| Letter | 인치 | mm | 셀 수 | 디자인 cap |
|--------|------|------|-------|-----------|
| XS | 0.75" | 19.05 | 63 | 13 |
| S | 1" | 25.4 | 35 | 7 |
| M | 1.25" | 31.75 | 20 | 5 |
| L | 1.5" | 38.1 | 12 | 3 |
| XL | 1.75" | 44.45 | 12 | 3 |
| XXL | 2.5" | 63.5 | 6 | 1 |
| Mixed | 1.75/1.5/1.25/1" | (1.75×3+1.5×3+1.25×8+1×5 = 19슬롯) | — | 1 |

**디자인 cap (auto-cap)**:
- 사이즈 변경 시 cap 갱신, ListBox 선택이 cap 초과면 자동 trim
- 룰 도출: 각 디자인 시트당 최소 4–5회 등장 보장 + shelf 효율 85% 기준
- 초기 선택은 cap 까지 자동 채움 (운영 편의)

**minRepeat 보장 룰 (단일 사이즈 모드)**:
- 디자인당 정확히 minRepeat 회 등장을 강제 (`_shelfPack` 1단계: primary 사이클을 minRepeat 회 반복, 2단계: round-robin filler)
- 결정 우선순위: `MIN_REPEAT_OVERRIDE["{sizeMm}_{designs}"]` lookup → `Math.floor(SLOTS_BY_SIZE[sizeMm] / designCount)` 동적 계산
- `SLOTS_BY_SIZE` = 위 표 셀 수 (mm 키 — 19.05/25.4/31.75/38.1/44.45/63.5)
- `MIN_REPEAT_OVERRIDE` 는 운영 검수 후 필요한 case 만 채움 (default `{}`)
- minRepeat 사이클이 fit 안 되면 leftover 발생 → 결과 알림에 표시 (자동 fallback 안 함)
- Mixed 모드는 1디자인 + 19슬롯 (`MIXED_PATTERN` 1.75×3+1.5×3+1.25×8+1×5) 고정이라 minRepeat 룰 미적용

**trace 실패 자동 제외**:
- `_buildCutlineCache` 가 fail 한 페어의 base 들을 set 으로 모아 placement 시도 자체를 skip
- 결과 알림에는 base 별 dedupe 된 1줄 + skip 된 placement 수 안내. 운영자에게 IL 재시작 후 재시도 권장 메시지 포함

**사이즈 모드 처리**:
- **단일 사이즈**: 선택한 페어들을 cellW×cellH (긴 변 = 사이즈, 짧은 변 = aspect) 로 환산, `_shelfPack` (shelf/row packing + per-row + 세로 justify + round-robin filler) 후 사진 배치
- **Mixed**: 선택한 1 디자인을 `MIXED_PATTERN` (`1.75×3 + 1.5×3 + 1.25×8 + 1×5 = 19 슬롯`) 로 복제, 큰 거 우선 정렬 후 `_appendShelfRowsOnce` 한 번 호출. 자연 행 분리: 1.75×3 / 1.5×3 / 1.25×4 ×2행 / 1×5 = 5행. Σrow.h = 171.45mm, vGap = (195-171.45)/6 = 3.92mm, A5 body 면적 fill ~75%. 1.25" 두 배 비중 (운영 기본 사이즈)

**행 정렬 (per-row + 세로 justify)**:
- **가로 (per-row justify)**: 행마다 outer L = inner = outer R = `(binW - ΣitemW) / (n+1)`. 행 안 사진 균등 분산. 행마다 가로 gap 다름 (행 안 사진 수에 따라)
- **세로 (justify)**: outer top = 행 사이 gap = outer bottom = `(binH - ΣrowH) / (R+1)`. 시트 전체 세로 균등 분산
- 행 안 사진 높이 차이는 row 안 center 정렬로 균등 분산
- 입력 `gap` 은 packing decision (한 행에 몇 장 들어갈지) 에만 영향. 시각 spacing 은 자동 계산 (입력 gap 무시)
- 결과: 사진 상하좌우 여백이 균등 자동 분산. 사용자 입력 gap 은 행 구성 seed 로만 작용

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

## Everstory_mixed.jsx 주요 함수 (v18 multiselect cap)

| 함수 | 역할 |
|------|------|
| `_collectPairs` | `02_cutout/`에서 페어 수집, base 이름 정렬 |
| `_showDialog(pairs, defaultName)` | ListBox multiselect + auto-cap. 사이즈 변경 시 cap 갱신, 선택 자동 trim. `defaultName` 으로 고객 이름 input 초기화 |
| `_deriveDefaultCustomerName` | inputFolder 또는 그 부모 폴더명을 다이얼로그 default 고객 이름으로 추출 (`02_cutout` 폴더면 부모 폴더 사용) |
| `_measurePairAspect` | 페어별 sil.png aspect 1회 측정 후 캐시 (`pair.aspect`) |
| `_itemForSize` | Mixed 모드에서 한 페어를 사이즈별 packItem (44.45/38.1/31.75/25.4mm) 으로 즉석 생성 |
| `_buildMixedItems(pair)` / `_mixedTotalSlots` / `_mixedSpecString` / `_mixedHumanString` | `MIXED_PATTERN` 기반 헬퍼 — 패턴 변경 시 자동 반영 |
| `_sortedPairsForShelf` / `_buildShelfFillItems` | shelf packing 입력 정렬 + filler item 생성 |
| `_shelfPack(items, fillers, binW, binH, gap, minRepeat)` | 단일 사이즈 모드 메인 packer. primary 사이클 minRepeat 회 반복 → leftover 0 이면 round-robin filler |
| `_resolveMinRepeat(sizeMm, designCount)` | minRepeat 결정. `MIN_REPEAT_OVERRIDE` 우선, fallback 은 `floor(SLOTS_BY_SIZE[size] / designCount)` |
| `_findOptimalGap(pairs, sizeMm, isMixed, binW, binH)` | gap auto. g ∈ [0.5, 5.0] 0.1 step 시뮬, placed 최대인 g 채택 (동률 시 큰 g) |
| `_countPlacementsFor(pairs, sizeMm, isMixed, binW, binH, gap)` | gap auto 시뮬. `_shelfPack` / `_appendShelfRowsOnce` 호출, mutate 안 함 |
| `_appendShelfRowsOnce` | items 를 cycle 없이 한 번씩만 row 에 누적. Mixed 모드 메인 packer |
| `_shelfRowsToPlaced(rows, binW, binH, gap)` | row → placed 변환. per-row 가로 justify (outer L = inner = outer R), 세로 justify (outer top = inner = outer bottom). final body 좌표 직접 출력 |
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
- **회전 비활성** — shelf packing 시 90° 회전 안 함. 스티커 방향 의도 보존.
- **cutline offset/smooth 는 수동 작업** — 스크립트는 선택한 1mm/2mm 만큼 이미지를 안쪽으로 줄여 공간만 확보하고, 자동 offset/smooth 는 적용하지 않는다.
- **한 시트 정책** — A5 한 시트만 생성. 디자인 cap (auto-cap) 으로 입력 단계에서 운영자가 한 시트 분량으로 선택. testConfig 경로에서 cap 위반은 안전판으로 잘려서 들어감.
- **shelf packing 효율** — 단일 사이즈 모드 약 75–85% (gap 1.5mm 기준, 0.75" 9행/1" 7행/1.25" 5행/1.5"·1.75" 4행/2.5" 3행), Mixed 모드는 6/4/18 비율로 deterministic 행 구성 (~80%). gap 은 다이얼로그에서 0.1mm 단위로 조정 가능 (0.5–5.0mm).
- **minRepeat 보장 실패 시** — primary 사이클이 minRepeat 회 못 들어가면 leftover 발생, 결과 알림에 표시. 운영자가 사이즈/디자인 수 조정해서 재실행 (자동 fallback 안 함).
- **trace cache scope** — 시트당 unique 페어 1회 trace, hidden `TraceStash` 레이어에 캐시 후 끝에 제거.
- **PhotoStrip 제외** — 현재 주력 파이프라인에서 사용하지 않는다.
- **TemplateBuilder 는 template_4cut 재생성용** — `template_4cut.ait` 의 `Info > a5_border` 를 기준으로 `Frame`, `KissCut`, `slot_*` 을 재생성하므로 실행 후 검수하고 저장한다.
