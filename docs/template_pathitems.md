# Illustrator Template PathItem Guide

Everstory Illustrator 스크립트는 템플릿 안의 특정 **PathItem 이름**을 찾아서 배치 영역을 계산한다. 템플릿을 만들거나 수정할 때는 아래 규칙을 지킨다.

현재 MVP 주력 파이프라인은 `template_cutout.ait` + **`Everstory_mixed.jsx` (운영 메인)** 기반 A5 사진 다이컷 스티커 시트다. `Everstory_NameIncludedSheet.jsx` v15 는 안정성 백업으로 동결, `Everstory_Grid.jsx` 는 `legacy/` 보관 (운영 비사용). PhotoStrip 배치 상품은 retired이며, `template_4cut.ait` 관련 내용은 `Everstory_TemplateBuilder.jsx` 보조 유틸리티 기준으로만 유지한다.

## 핵심 규칙

- `template_cutout.ait`의 `body` / `header` / `header_border` / `border` / `reg_border`는 모두 `info` 레이어 안에 둔다.
- `template_4cut.ait`의 `a5_border`는 `Info` 레이어 안에 둔다.
- `template_4cut.ait`의 `slot_01..slot_N`은 `Frame` 레이어 안에 둔다. 이 규칙은 TemplateBuilder 보조 템플릿용이다.
- 스크립트가 찾는 이름은 path 자체의 이름이다. 그룹 이름이나 레이어 이름만 바꾸면 안 된다.
- `body`, `header`, `a5_border`, `slot_01` 같은 이름은 대소문자와 철자를 그대로 쓴다.
- 일반 사각형은 `PathItem`, 라운드/복합 슬롯은 `CompoundPathItem`이어도 된다.
- 기준 path는 프린트용 디자인이 아니라 스크립트 기준선이다. 보이지 않아도 되지만 삭제하면 안 된다.

## 자동 생성 방법

고정 프레임 템플릿은 `Everstory_TemplateBuilder.jsx`로 자동 생성할 수 있다.

1. Illustrator에서 `File > Scripts > Other Script...`를 선택한다.
2. `Everstory_TemplateBuilder.jsx`를 실행한다.
3. 스크립트가 `templates/template_4cut.ait`를 연다.
4. 원하는 레이아웃을 선택한다.
5. 생성된 `Frame`, `KissCut` 레이어를 확인한다.
6. 필요하면 프레임, 배너, QR, 브랜드 요소를 수동 편집한다.
7. 검수 후 `templates/template_4cut.ait`로 저장한다.

자동 생성되는 항목:
- `Info` 레이어: 148×210mm `a5_border`, regMark/footer/브랜드 등 템플릿 기준 요소
- `Frame` 레이어: 좌우 2장짜리 3mm 검정 프레임, 내부 분할선, 하단 배너, `slot_01..slot_N`
- `KissCut` 레이어: 각 스티커 1장당 사각 칼선 1개, 스티커 외곽에서 -1mm inset, `CutContour` 적용

위치는 `Info > a5_border`의 실제 좌표를 기준으로 계산한다. 스크립트는 `a5_border`, artboard 자체, 기존 템플릿 레이어를 이동하지 않고, 생성 대상인 `Frame`, `KissCut`, `PrintData`, 과거 `slot_*`만 정리한다.

지원 레이아웃:
- 1열 x 2행, 좌우 2장
- 1열 x 3행, 좌우 2장
- 1열 x 4행, 좌우 2장

수동으로 처음부터 만들 필요가 있는 경우에만 아래 절차를 따른다.

## `template_cutout.ait` PathItem 만들기

`info` 레이어 안에 다음 5개 path 를 둔다. 모두 스크립트 기준선이며 `CutContour` 스폿을 적용하지 않는다.

| 이름 | 의미 | 스크립트 사용 |
|------|------|--------------|
| `border` | A5 전체 영역 (148×210mm) | 시각 가이드. 스크립트 무시 |
| `reg_border` | Summa D75 컷팅 안전 영역 | 시각 가이드. 스크립트 무시 |
| `header` | 상단 15mm production header 박스 | `Everstory_NameIncludedSheet.jsx` / `Everstory_mixed.jsx` 가 ORDER DETAIL 그리는 영역으로 사용 |
| `header_border` | header 와 body 사이 15mm 구분선 | 시각 가이드. 스크립트 무시 |
| `body` | A5 − header (148×195mm) | `Everstory_mixed.jsx` / `Everstory_NameIncludedSheet.jsx` 가 사진 pack 영역으로 사용 |

1. Illustrator에서 `template_cutout.ait` 를 연다.
2. Layers 패널에서 `info` 레이어를 만든다 (이미 있으면 그대로 사용).
3. Rectangle Tool 로 위 표의 5개 영역을 각각 그린다.
4. Layers 패널에서 각 path 이름을 정확히 `border` / `reg_border` / `header` / `header_border` / `body` 로 바꾼다.
5. 저장한다.

권장:
- `body` 와 `header` 의 좌표가 정확해야 스크립트가 의도한 위치에 사진/텍스트를 배치한다. 두 path 가 겹치거나 어긋나지 않도록 한다.
- `header_border` 는 단순히 시각 구분용이라 `header` 와 `body` 사이 가로선 PathItem 1개로 둬도 된다.
- 기준 사각형의 fill/stroke 는 없어도 된다. 보이게 두고 싶으면 연한 색/점선으로 두되, 컷터용 `CutContour` 를 적용하지 않는다.
- 마케팅 배너 (브랜드명 + QR) 는 별도 디자인 레이어에 둔다. `info` 레이어 안의 5개 기준 path 와 분리한다.

## `template_4cut.ait` 의 `a5_border` 만들기

`template_4cut.ait` 는 `Everstory_TemplateBuilder.jsx` 가 사용하는 보조 템플릿이며 `template_cutout.ait` 와 구조가 다르다.

1. Illustrator에서 `template_4cut.ait` 를 연다.
2. Layers 패널에서 `Info` 레이어를 만든다 (이미 있으면 그대로 사용).
3. Rectangle Tool 로 148×210mm A5 전체를 사각형으로 그린다.
4. 그 PathItem 이름을 `a5_border` 로 바꾼다.
5. 저장한다.

권장:
- `Info > a5_border` 는 148×210mm A5 전체를 감싼다. Frame 은 이 안에서 상/좌/우 3mm, 하단 15mm margin 을 두고 생성된다.
- 기준 사각형의 fill/stroke 는 없어도 된다.

## `slot_01..slot_N` 확인/수정

`slot_01..slot_N`은 `Everstory_TemplateBuilder.jsx`가 생성하는 고정 프레임 기준 path다. 현재 MVP 배치 스크립트는 이 슬롯을 사용하지 않는다.

1. `templates/template_4cut.ait`를 Illustrator에서 연다.
2. `Frame` 레이어를 만든다. 이미 있으면 그대로 사용한다.
3. 각 사진이 들어갈 영역을 Rectangle Tool 또는 Rounded Rectangle Tool로 그린다.
4. Layers 패널에서 각 path의 이름을 순서대로 바꾼다.
   - `slot_01`
   - `slot_02`
   - `slot_03`
   - `slot_04`
5. 슬롯 순서는 이름순으로 처리된다. 위에서 아래, 왼쪽에서 오른쪽 등 원하는 순서에 맞춰 번호를 붙인다.
6. 프레임, 브랜드, QR, 외곽 칼선은 템플릿 디자인으로 별도 배치한다.
7. 저장한다.

권장:
- 사진은 슬롯 path 안에 cover-fit으로 들어가고, 슬롯 path 복제본이 clipping mask가 된다.
- 슬롯 path 자체는 기준선이므로 인쇄용 프레임과 분리한다.
- 프레임 선과 슬롯 기준 path는 모두 `Frame` 레이어 안에 두되, 슬롯 기준 path는 fill/stroke를 끈다.

## Layers 패널에서 이름 바꾸는 법

Illustrator에서 path 이름을 정확히 바꾸는 것이 가장 중요하다.

1. Window > Layers를 연다.
2. `info` 레이어를 펼친다.
3. `<Path>` 또는 `<Compound Path>` 항목을 찾는다.
4. 항목 이름을 더블클릭한다.
5. `body`, `header`, `a5_border`, `slot_01` 처럼 정확한 이름을 입력한다.

주의:
- 캔버스 위 텍스트로 `slot_01`을 써도 스크립트는 찾지 못한다.
- 그룹 이름만 `slot_01`로 바꾸면 안 된다. 그룹 안의 실제 path 이름을 바꾼다.
- 여러 path가 같은 이름이면 첫 번째로 찾은 path만 사용될 수 있으므로 중복 이름을 피한다.

## 템플릿별 필수 항목

| 템플릿 | 스크립트 | 필수 PathItem |
|---|---|---|
| `template_cutout.ait` | `Everstory_mixed.jsx` (운영 메인) | `info > body` + `info > header` |
| `template_cutout.ait` | `Everstory_NameIncludedSheet.jsx` (v15 baseline 동결) | `info > body` + `info > header` |
| `template_cutout.ait` | `legacy/Everstory_Grid.jsx` (운영 비사용) | `info > body` |
| `template_4cut.ait` 재생성 | `Everstory_TemplateBuilder.jsx` | `Info > a5_border` 기준, `Frame > slot_01..slot_N`, `KissCut` 자동 생성 |

## 자주 나는 문제

### 스크립트가 `body` 또는 `header` 를 못 찾음
- `info` 레이어가 없는지 확인한다.
- path 이름이 정확히 `body` / `header` 인지 확인한다 (대소문자, 공백 주의).
- 그룹 이름만 바꾼 것은 아닌지 확인한다.

### TemplateBuilder 템플릿에서 슬롯 확인이 필요함
- 이름이 `slot_1`이 아니라 `slot_01`인지 확인한다.
- path가 `Frame` 레이어 안에 있는지 확인한다.
- 슬롯이 이미지나 텍스트 객체가 아니라 PathItem/CompoundPathItem인지 확인한다.

### 사진이 슬롯에 이상하게 잘림
- slot path bounds가 원하는 사진 영역과 맞는지 확인한다.
- 프레임용 선과 clipping용 slot path를 분리한다.
- 슬롯 번호 순서가 원하는 사진 순서와 맞는지 확인한다.

### 컷터가 기준선을 인식함
- `body`, `header`, `header_border`, `border`, `reg_border`, `a5_border`, `slot_01..slot_N` 같은 기준 path 에는 `CutContour` 스폿을 적용하지 않는다.
- 컷터가 읽을 외곽선만 별도 path로 만들고 `CutContour`를 적용한다.
