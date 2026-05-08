# Illustrator Template PathItem Guide

Everstory Illustrator 스크립트 (`Everstory_mixed_v2.jsx`) 는 템플릿 (`templates/template_cutout_v2.ait`) 안의 특정 **PathItem / TextFrame 이름**을 찾아서 배치 영역과 헤더 텍스트 frame 을 잡는다. 템플릿을 만들거나 수정할 때는 아래 규칙을 지킨다. cutout 라인 (`template_cutout_v2.ait`) 은 매뉴얼로 제작한다.

## 핵심 규칙

- `template_cutout_v2.ait` 의 `body` 는 `info` 레이어 안 PathItem 으로 둔다. 헤더 우측 정렬 텍스트는 `info > header` 그룹 안 **TextFrame** 으로 두고 이름을 `header_right` 로 지정한다 (PathItem 이 아니라 TextFrame). 폰트·사이즈·우측정렬은 .ait 에 미리 잡아두고 스크립트는 `.contents` 만 inplace 교체한다.
- 스크립트가 찾는 이름은 path 또는 TextFrame 자체의 이름이다. 그룹 이름이나 레이어 이름만 바꾸면 안 된다.
- `body`, `header_right` 같은 이름은 대소문자와 철자를 그대로 쓴다.
- 일반 사각형은 `PathItem`, 라운드/복합 슬롯은 `CompoundPathItem`이어도 된다. `header_right` 는 `TextFrame` 이어야 한다.
- 기준 path/TextFrame 은 프린트용 디자인이 아니라 스크립트 기준선이다. `header_right` 는 보여야 하고 (헤더 텍스트로 출력됨), `body` 는 보이지 않아도 되지만 삭제하면 안 된다.

## `template_cutout_v2.ait` PathItem / TextFrame 만들기

브랜드 헤더 (로고, 라벨, 푸터 등) 가 .ait 정적 디자인으로 들어가 있고 스크립트는 헤더 우측 텍스트와 사진 배치만 담당한다. body 는 `142×175mm`, 헤더 우측에는 PathItem 이 아니라 **TextFrame** 을 둔다.

| 이름 | 종류 | 의미 | 스크립트 사용 |
|------|------|------|--------------|
| `body` | PathItem | A5 안 사진 pack 영역 (142×175mm) | `Everstory_mixed_v2.jsx` 가 `geometricBounds` 로 읽어 packing |
| `header_right` | TextFrame (in `info > header` group) | 헤더 우측 정렬 텍스트 frame | `Everstory_mixed_v2.jsx` 가 `.contents` 만 inplace 교체. 폰트/사이즈/우측정렬은 .ait 가 보유 |

1. Illustrator에서 `template_cutout_v2.ait` 를 연다.
2. Layers 패널에서 `info` 레이어 안에 `body` PathItem (142×175mm 사각형) 이 있는지 확인한다. 없으면 Rectangle Tool 로 그리고 이름을 `body` 로 바꾼다.
3. `info > header` 그룹 안에 헤더 우측 정렬 TextFrame 을 추가한다 (Type Tool 로 우측 정렬, 원하는 폰트/사이즈/색).
4. Layers 패널에서 그 TextFrame 의 이름을 `header_right` 로 바꾼다 (PathItem 이 아니라 **TextFrame** 임을 확인).
5. `header_right` 의 초기 텍스트는 placeholder 도 무방하다. 스크립트가 시트 생성 시 `.contents` 를 통째로 교체한다.
6. 저장한다.

권장:
- `body` 좌표를 바꾸면 `Everstory_mixed_v2.jsx` 의 packing 결과가 그대로 따라간다. 운영 중인 사이즈 cap 표 (`docs/implementation/packing_internals.md` 참고) 와 맞지 않게 조정하면 시트가 비거나 잘릴 수 있다.
- `header_right` 는 한 TextFrame 안에 2줄 (`{N} photos * {sizeLetter} / {inch} / {cut}mm  *  {material}` / `Name add-on * Order date {date}`) 을 넣는다. 줄바꿈은 스크립트가 `\r` 로 넣으므로 .ait 의 paragraph 설정만 우측 정렬이면 충분하다.
- 헤더의 라벨 (브랜드명, 정적 텍스트) 은 별도 TextFrame 으로 두고 `header_right` 와 섞지 않는다.

## Layers 패널에서 이름 바꾸는 법

Illustrator에서 path/TextFrame 이름을 정확히 바꾸는 것이 가장 중요하다.

1. Window > Layers를 연다.
2. `info` 레이어를 펼친다.
3. `<Path>`, `<Compound Path>`, 또는 `<Text>` 항목을 찾는다.
4. 항목 이름을 더블클릭한다.
5. `body`, `header_right` 처럼 정확한 이름을 입력한다.

주의:
- 캔버스 위 텍스트로 `header_right`을 써도 스크립트는 찾지 못한다.
- 그룹 이름만 `header_right` 로 바꾸면 안 된다. 그룹 안의 실제 TextFrame 이름을 바꾼다.
- `header_right` 는 반드시 **TextFrame** 이어야 한다. 같은 이름의 PathItem 으로 만들면 스크립트가 `.contents` 교체에서 실패한다.
- 여러 path/TextFrame 가 같은 이름이면 첫 번째로 찾은 항목만 사용될 수 있으므로 중복 이름을 피한다.

## 자주 나는 문제

### 스크립트가 `body` 를 못 찾음
- `info` 레이어가 없는지 확인한다.
- path 이름이 정확히 `body` 인지 확인한다 (대소문자, 공백 주의).
- 그룹 이름만 바꾼 것은 아닌지 확인한다.

### "info 레이어 안에 'header_right'가 없습니다" 에러
- `header_right` 가 PathItem 으로 만들어졌는지 확인한다 — **TextFrame** 이어야 한다 (PathItem 이면 스크립트의 deep-find 가 인식해도 `.contents` 교체가 깨진다).
- TextFrame 이 `info > header` 그룹 안에 있는지 확인한다 (다른 그룹/레이어 밖에 있으면 deep-find 가 못 잡을 수 있음).
- TextFrame 이 비어 있어도 이름이 `header_right` 면 인식한다. 비어 있으면 .ait 의 paragraph 우측 정렬·폰트 설정을 placeholder 텍스트 한 줄로 잡아둔다.

### 컷터가 기준선을 인식함
- `body` 같은 기준 path 에는 `CutContour` 스폿을 적용하지 않는다.
- 컷터가 읽을 외곽선만 별도 path로 만들고 `CutContour`를 적용한다.
