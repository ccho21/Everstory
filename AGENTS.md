# Everstory 스티커 제작 파이프라인

Adobe CC 2026 기반 스티커 시트 자동화. PSD 누끼/실루엣 → A5 그리드 배치 + 칼선 분리 → ET-8550 출력 + Summa D75 컷팅.

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
| **레터링 데칼** | 글자만 남김, 보조(carrier) 테이프 사용 | ✗ | trace + carrier 외곽 사각/라운드 path 추가 (offset spec 필요) |
| **프레임 (가운데 타공)** | 폴라로이드형, 외곽 + 내곽 compound path | ✗ | template에 외곽+내곽 정의된 도형, 사진은 PrintData에 그대로 |

**시트 레이아웃**:

| 레이아웃 | 설명 | 현재 지원 | 확장 시 접근 |
|----------|------|-----------|--------------|
| **스티커 시트** | A5 판형에 여러 스티커 grid (11인치 롤 폭 활용) | ✓ `Everstory_Grid.jsx` | — |
| **인생네컷 / 포토스트립** | 세로·가로 긴 프레임 안에 3–4장 배치 | ✓ 기본 구현 `Everstory_PhotoStrip.jsx` | `template_4cut.ait` 의 `slot_01..slot_N` 고정 슬롯 사용 |

**현재 파이프라인 범위**: 다이컷 × 스티커 시트는 `Everstory_Grid.jsx` 로 자동화. 인생네컷/포토스트립은 `Everstory_PhotoStrip.jsx` 로 기본 슬롯 배치 구현. 기본도형/레터링/프레임 칼선 확장은 추후 단계.

**스크립트 분리 기준**:
- `Everstory_Grid.jsx` — A5 스티커 시트처럼 여러 개별 스티커를 bin packing 하는 레이아웃
- `Everstory_PhotoStrip.jsx` — 인생네컷/포토스트립/폴라로이드형 프레임처럼 템플릿의 고정 슬롯에 사진을 넣는 레이아웃

## 디렉토리 구조

```
.
├── Everstory_Grid.jsx        # Phase B+D — 스티커 시트용 Illustrator ExtendScript (v8)
├── Everstory_PhotoStrip.jsx  # 슬롯 기반 포토스트립/인생네컷용 Illustrator ExtendScript
├── Everstory_TemplateBuilder.jsx # 포토스트립 프레임/slot PathItem 자동 생성기
├── Everstory_Grid copy.jsx   # 백업본
├── scripts/
│   └── save_route.jsx        # PS PNG 라우팅 헬퍼 (legacy)
├── plugins/everstory_save/   # Phase A — UXP 패널 플러그인 (PS)
├── templates/
│   └── template_heart.ait    # A4 베이스, info 레이어 안 a5_border PathItem
│   └── template_4cut.ait     # 포토스트립 베이스, Info > a5_border + Frame > slot_01..slot_N PathItem
├── projects/{이름}/          # 작업별 폴더 (평면 구조)
│   ├── 01_original/          # 원본 PSD/JPG/TIF
│   ├── 02_cutout/            # Phase A 산출 (_clean.psd + _sil.png 페어)
│   └── 03_output/            # Phase B+D 산출 (.ai 시트)
└── docs/
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
- 출력: `02_cutout/{base}_clean.psd` + `{base}_sil.png` (같은 치수 페어)
- 자동화 없음: Select Subject / Levels 같은 PS 액션은 호출하지 않음. 누끼 품질은 사용자 책임.

### 2) Phase B+D — `Everstory_Grid.jsx` (Illustrator)
**한 번 실행으로 시트 .ai까지 완료**. v3에서 통합되었고 v4에서 offset/simplify 제거(외곽선 그대로), v6에서 템플릿 기반으로 전환, v7에서 bin packing, v8에서 파일명 기반 개별 크기와 칼선 여백 선택을 추가.

**입력**: `02_cutout/` 폴더 안 `{base}_clean.psd` + `{base}_sil.png` 페어들
**템플릿**: `templates/template_heart.ait` — `info` 레이어 안 `a5_border` PathItem이 그리드 영역 정의
**출력**: `03_output/{YYYYMMDD_HHMMSS}_NNmm_sheet{N:02d}.ai`

**다이얼로그 옵션**:
- 기본 스티커 긴 변 — 20mm / 30mm / 60mm (파일명에 `_NNmm` 이 있으면 해당 페어만 개별 크기 적용)
- 칼선 여백 — 1mm / 2mm (기본 1mm). 최종 셀 크기는 유지하고 PSD/KissCut 기준 이미지만 안쪽으로 축소
- 다중 시트 정책 — 한 시트만 / 자동 분할 / 최대 N장
- 옵션: "저장 후 시트 자동 닫기" (기본 OFF — 검수 우선)

**시트별 처리** (매 시트마다 새 .ait 열기):
1. `info > a5_border` 영역에서 안전 여백(3mm) 빼고 사용 가능 bin 계산
2. 페어별 sil.png aspect 측정 → 셀 W×H = (긴 변 = 기본 size 또는 파일명 `_NNmm`, 짧은 변은 aspect 기준 산출)
3. **MaxRects + BSSF bin packing** 으로 시트 안에 가변 크기 셀 배치 (회전 OFF, gap=2mm) 후 pack 묶음을 bin 중앙 정렬
4. PSD를 `PrintData` 레이어에 embed, 선택한 칼선 여백만큼 줄인 박스 안에 비율 유지 fit + 중앙 정렬
5. PNG를 임시 doc에서 Image Trace + Pathfinder Unite → `Cutline` path
6. PNG-relative 정규화 좌표로 PSD bbox에 정합 → `KissCut` 레이어에 paste, `CutContour` 스폿 강제
7. 한 시트에 못 들어간 leftover 는 다음 시트로 이월 (정책 상한까지)
8. 입력 area < bin area × 0.6 이면 원본 페어를 먼저 모두 배치한 뒤 남는 공간만 cycling 으로 채움

**최종 z-order** (위에서 아래): `KissCut` → `info` (템플릿 유지) → `PrintData`

**배너 영역 컨벤션**: `info > a5_border` 는 **그리드 영역만** 정의. 마케팅 배너 (브랜드명 + QR) 는 a5_border *외부* (보통 하단 12mm) 에 템플릿에서 직접 디자인. 스크립트는 a5_border 만 읽으므로 배너 변경에 영향받지 않음.

### 3) PhotoStrip — `Everstory_PhotoStrip.jsx` (Illustrator)
인생네컷/포토스트립처럼 **고정 슬롯 템플릿**에 사진을 넣는 별도 스크립트. `Everstory_Grid.jsx` 의 bin packing 모델과 분리.

**입력**: 선택 폴더 안 이미지/PSD. `02_cutout` 폴더에서는 `_clean.psd` 를 우선 사용하고 `_sil.png` 는 제외. 그 외 폴더에서는 PSD/PNG/JPG/TIF/HEIC 파일을 이름순 사용.
**템플릿**: `templates/template_4cut.ait` — `Info` 레이어 안 A5 크기 `a5_border` 와 `Frame` 레이어 안 `slot_01`, `slot_02`, ... PathItem/CompoundPathItem 필요
**출력**: `03_output/{YYYYMMDD_HHMMSS}_photostrip{N:02d}.ai`

**처리**:
1. 템플릿에서 `slot_01..slot_N` 을 이름순 수집
2. 입력 이미지를 슬롯 수 단위로 나눠 strip 문서 생성. 사진 수가 슬롯보다 부족하면 같은 strip 안의 사진을 cycling 해서 모든 슬롯을 채움
3. 각 이미지를 slot bounds 에 cover-fit 하고 slot 복제 path 로 clipping mask 적용
4. `PrintData` 레이어를 템플릿 디자인 아래로 보내고 AI 저장

### 4) Template Builder — `Everstory_TemplateBuilder.jsx` (Illustrator)
포토스트립/인생네컷 템플릿의 검정 프레임과 `Frame > slot_01..slot_N` PathItem을 자동 생성하는 보조 스크립트.

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
- **PathItem**: `info > a5_border` (A5 사각형), `Cutline` (trace 임시 이름)
- **템플릿 PathItem 제작법**: `docs/template_pathitems.md` 참고 (`a5_border`, `slot_01..slot_N`)
- **Spot color**: `CutContour` — M=100, SPOT (Summa/Roland 표준)
- **파일명**: `pet1_60mm.psd` → `pet1_60mm_clean.psd` + `pet1_60mm_sil.png` → `20260428_153045_60mm_sheet01.ai`
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

## Everstory_Grid.jsx 주요 함수 (v8 파일명 크기 + 칼선 여백 반영 후)

| 함수 | 역할 |
|------|------|
| `_collectPairs` | `02_cutout/`에서 페어 수집, base 이름 정렬 |
| `_measurePairAspect` | 페어별 sil.png aspect 1회 측정 후 캐시 (`pair.aspect`) |
| `_resolvePairSizeMm` | 파일명 `_NNmm` 크기 override 파싱, 없으면 다이얼로그 기본값 사용 |
| `_sortedPairsByArea` / `_buildRepeatFillItems` | 원본 페어 우선 배치 + 남는 공간 cycling filler 생성 |
| `_centerPlacedItems` | pack 결과 bounding box를 bin 중앙으로 이동 |
| `_binPack` | MaxRects + BSSF heuristic. 회전 OFF. 반환 `{ placed, leftover, freeRects }` |
| `_splitFreeRect` / `_pruneFreeRects` / `_rectContains` | bin packing 보조 |
| `_resolveTemplate` | `$.fileName` 기준 상대경로로 .ait 자동 발견 |
| `_findInfoBorder` | `info` 레이어 안 `a5_border` PathItem 검색 |
| `_placeSticker` | 선택한 칼선 여백만큼 PSD fit 영역 축소 + PNG trace + 정규화 paste 정합. trace 실패 시 throw |
| `_traceAndUnite` | Image Trace + Pathfinder Add + expandStyle |
| `_findCutline` / `_deepFindFirstPath` | trace 결과 path 찾기 (이름 + 깊이 fallback) |
| `_stripPSDPaths` | embed된 PSD의 saved path 재귀 제거 (clipping mask는 보존) |
| `_ensureCutContour` / `_forceCutContourStroke` | 스폿 색상 일관성 |
| `_saveAi` | Illustrator 24 호환 + PDF 호환 저장 |

## 미해결 / 알려진 한계

- **시트 문서 종료** — 다이얼로그 "저장 후 자동 닫기" 옵션으로 토글. 기본 OFF (검수 우선).
- **trace 실패는 명시적 에러** — `_placeSticker` 가 throw → 상위 try/catch 가 `failedItems` 에 push → 결과 알림에 포함. 해당 셀은 PSD 만 남고 cutline 없음.
- **회전 비활성** — bin packing 시 90° 회전 안 함. 스티커 방향 의도 보존.
- **cutline offset/smooth는 수동 작업** — 스크립트는 선택한 1mm/2mm 만큼 이미지를 안쪽으로 줄여 공간만 확보하고, 자동 offset/smooth는 적용하지 않는다.
- **packing 효율** — MaxRects + BSSF 는 보장 최적해는 아님. 30개 이하에서 실용적 효율 (보통 80–90%).
- **PhotoStrip 슬롯 템플릿 의존** — `Everstory_PhotoStrip.jsx` 는 `templates/template_4cut.ait` 와 `Frame > slot_01..slot_N` naming 규칙을 전제로 한다.
- **TemplateBuilder는 template_4cut 재생성용** — `template_4cut.ait` 의 `Info > a5_border` 를 기준으로 `Frame`, `KissCut`, `slot_*`을 재생성하므로 실행 후 검수하고 저장한다.
