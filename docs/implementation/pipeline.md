# 파이프라인 상세

PSD 누끼/실루엣 → A5 그리드 배치 + 칼선 분리 → ET-8550 출력 + Summa D75 컷팅. CLAUDE.md 의 짧은 요약을 단계별로 풀어둔 문서.

## 0) 수동 (Photoshop)

사용자가 PSD 에 두 레이어 직접 제작:
- `layers[0]` (맨 위) = **실루엣** (검정 hard-edge, 다리 사이/귀-머리 틈 직접 메꿈)
- `layers[1..N]` = **누끼 + 보정 레이어** (Brightness/Contrast, Levels 등 자유)

## 1) Phase A — UXP 패널 (`plugins/everstory_save/`)

- **입력**: 위 PSD
- **동작**: `layers[0]` 만 표시 → `_sil.png` 저장 → `layers[1..N]` 만 표시 → `_clean.psd` 저장. 둘 다 longest 1800px 로 리사이즈.
- **출력**: `02_cutout/{folderName}_NN_clean.psd` + `{folderName}_NN_sil.png` (같은 치수 페어). `folderName` = 02_cutout 의 부모 폴더 (= 고객명). `NN` = 폴더 안 기존 페어의 max + 1, zero-pad 2자리. 같은 PSD 를 다시 저장하면 새 번호가 할당된다 (덮어쓰기 회피).
- **라우팅**: 원본 PSD 가 `01_original/` 또는 `02_cutout/` 안에 있을 때만 위 패턴 적용. 그 외 (Desktop 등) 는 raw 파일명 유지 (안전 fallback).
- **자동화 없음**: Select Subject / Levels 같은 PS 액션은 호출하지 않음. 누끼 품질은 사용자 책임.

## 2) Phase B — 운영 메인 `Everstory_mixed_v2.jsx` (Illustrator)

NameIncluded v15 + 단일/Mixed 사이즈 + 페어 multiselect + 03_output 자동 저장. v15 trace cache 흐름 ([name_included.md](name_included.md)) 그대로 상속하고 다이얼로그 흐름·사이즈 처리·v2 헤더 주입을 더한다.

**입력**: `02_cutout/` 폴더 안 페어들 (다이얼로그 ListBox 에서 사용할 페어를 multiselect)
**템플릿**: `templates/template_cutout_v2.ait` — `info > body` 142×175mm (사진 pack 영역) + `info > header > header_right` TextFrame (값만 inplace 주입)
**출력**: `03_output/{YYYYMMDD_HHMMSS}_{sizeTag}_sheet01.ai` — sizeTag 는 단일 사이즈면 인치 표기 (`1in`, `1.25in`, `2.5in` 등), Mixed 면 `MIX`

**다이얼로그 5단계**:
1. 폴더 선택 (`02_cutout`)
2. 고객 이름 (default = 폴더명 자동 추출) / 헤더 정보 (재질·주문·날짜)
3. 사진 페어 ListBox (multiselect, 행 전체 hit area) + 카운트 라벨 `선택: N / cap`. `numberOfColumns:1 + showHeaders:false` 로 이름 옆 빈 공간 클릭도 선택 가능
4. 사이즈 드롭다운 (인치 6단계 + Mixed): XS 0.75" / S 1" / M 1.25" / L 1.5" / XL 1.75" / XXL 2.5" / Mixed 1.75/1.5/1.25/1in. 기본 S (1")
5. 칼선 여백: 0mm / 0.5mm / 1mm / 2mm (default 1mm)

uniform grid 가 시각 간격을 자동 균등 분배하므로 gap 입력은 다이얼로그에 없다. Mixed 모드 zone packer 는 내부적으로 `GAP_DEFAULT_MM = 1.5mm` 고정 사용.

**v2 헤더 주입** — 우측 정렬 2줄:
```
{N} photos * {sizeLetter} / {inch} / {cut}mm  *  {material}
Name add-on * Order date {date}
```
브랜드 로고/라벨/푸터는 .ait 정적, 스크립트는 `info > header > header_right` TextFrame 의 `.contents` 만 inplace 교체. 폰트·사이즈·우측 정렬은 .ait 가 보유. 고객명/주문번호는 다이얼로그에 남지만 파일명·메타용으로만 사용 (헤더에 안 들어감).

packing 알고리즘·사이즈별 cap·함수 매핑은 [packing_internals.md](packing_internals.md) 참조.

## 3) Name Included v15 baseline — `Everstory_NameIncludedSheet.jsx` (동결 백업)

단일 사이즈 전용 baseline. 새 기능은 `Everstory_mixed_v2.jsx` 에 들어간다. v2/v1 mixed 가 깨졌을 때 운영 안정성 백업으로 유지. 자세한 내용 [name_included.md](name_included.md).

## 4) Photo Only legacy — `legacy/Everstory_Grid.jsx` (운영 비사용)

v10 까지 운영했던 Photo Only 단일 사이즈 시트 (MaxRects + BSSF bin packing, `info > body` 기반). 디자인 cap 룰 도입 후 운영 메인은 `Everstory_mixed_v2.jsx` 단일 사이즈 모드로 흡수됐다. 알고리즘 참조용으로 `legacy/` 에 보관.

## 5) Name Sticker Prototype — `Everstory_NameSticker.jsx`

이름 스티커 1개를 단독 생성하고 저장하지 않은 Illustrator 문서에 열린 채로 둔다. 이름 입력 → 한글/영문별 고정 폰트 후보 선택 → 컬러 선택 → `PrintData` 의 다이컷 backing/text 와 `KissCut` 의 `CutContour` path 를 생성한다. 선택한 PostScript 폰트가 없으면 자동 대체 없이 중단한다. 현재 Name Included 시트에는 통합하지 않고, 폰트/backing shape/칼선 안정성 검수용으로만 둔다. 폰트 후보·컬러는 [product_mvp.md](product_mvp.md) "이름 스티커 프로토타입".

## 6) Template Builder — `Everstory_TemplateBuilder.jsx`

고정 프레임 템플릿의 검정 프레임과 `Frame > slot_01..slot_N` PathItem 을 자동 생성하는 보조 스크립트. PhotoStrip 배치 상품은 MVP 에서 제외하지만, 템플릿 생성 도구는 보조 유틸리티로 유지한다.

**동작**: `templates/template_4cut.ait` 의 `Info > a5_border` 를 읽고 그 안쪽 margin 영역에 `Frame` 프레임과 `slot_01..slot_N` 을 재생성. `Info > a5_border` 는 148×210mm A5 기준선이며 스크립트가 삭제/재생성하지 않는다. `Frame` 내용은 a5_border 안에서 상/좌/우 3mm, 하단 15mm 마진을 둔다. 스크립트는 artboard 자체나 기존 템플릿 레이어의 위치/순서를 바꾸지 않고, 생성 대상인 `Frame`, `KissCut`, `PrintData`, 과거 `slot_*` 만 정리한다.

**생성 레이어**:
- `Frame` — 3mm 검정 외곽선, 내부 분할선, 하단 배너, `slot_01..slot_N`
- `KissCut` — 각 좌우 스티커 1장당 사각 칼선 1개, 스티커 외곽에서 -1mm inset, `CutContour` 적용
- 슬롯 번호는 좌측 스티커 위→아래를 먼저 매기고, 우측 스티커 위→아래를 이어서 매김

**프리셋**:
- 1열×2행, 좌우 2장
- 1열×3행, 좌우 2장
- 1열×4행, 좌우 2장

생성 후 Illustrator 에서 검수하고 `templates/template_4cut.ait` 로 저장한다. PathItem 제작법 [template_pathitems.md](template_pathitems.md).

## 운영 한계

- **자동 saveAs** — `Everstory_mixed_v2.jsx` 는 결과 알림 직전 `03_output/` 으로 자동 saveAs. 저장 실패는 알림 마지막 줄에 표시되고 문서는 열린 상태로 유지된다.
- **trace 실패는 명시적 에러** — `_buildCutlineCache` 또는 `_placePhotoSticker` 에서 throw → `failedItems` 에 push → 결과 알림에 포함. 해당 셀은 PSD 만 남고 cutline 없음. IL 재시작 후 재시도 권장.
- **회전 비활성** — uniform grid / shelf packing 시 90° 회전 안 함. 스티커 방향 의도 보존.
- **cutline offset/smooth 는 수동 작업** — 스크립트는 선택한 1mm/2mm 만큼 이미지를 안쪽으로 줄여 공간만 확보하고, 자동 offset/smooth 는 적용하지 않는다.
- **한 시트 정책** — A5 한 시트만 생성. 디자인 cap (auto-cap) 으로 입력 단계에서 운영자가 한 시트 분량으로 선택. testConfig 경로에서 cap 위반은 안전판으로 잘려서 들어감.
- **PhotoStrip 제외** — 현재 주력 파이프라인에서 사용하지 않는다. TemplateBuilder 는 도구로만 유지.
