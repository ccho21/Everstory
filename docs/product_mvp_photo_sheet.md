# Everstory MVP Photo Sticker Sheet

## 상품 정의

Everstory의 첫 주력 상품은 고객 사진을 중심으로 만드는 **A5 커스텀 사진 다이컷 스티커 시트**다.

핵심 원칙:
- 사진이 85~90%를 차지한다.
- 고객 이름은 상단 production header의 주문 정보로 표기한다.
- 별도 이름 스티커는 현재 Name Included 시트에 넣지 않는다.
- 미니 데코는 후순위 보조 요소다.
- 문구 스티커는 MVP에서 제외한다.
- 자유배치가 아니라 자동화 가능한 구조를 유지한다.

## 상품 모드

### Photo Only

기본형 옵션. 사진 누끼 스티커만 A5 한 시트에 자동 배치한다.

운영 메인은 `Everstory_mixed.jsx` 단일 사이즈 모드. 고객 이름은 입력하지만 헤더 표시 비중이 낮은 운영 흐름이라면 그대로 사용. legacy `Everstory_Grid.jsx` 는 v10 까지 운영했던 별도 single-size 시트로 `legacy/` 에 보관 (운영 비사용).

### Name Included

대표 MVP 모드. 사진 중심 배치를 유지하면서 상단 production header에 고객 이름과 주문 정보를 표기한다.

이름은 스티커 아이템이 아니라 header metadata로만 사용한다. 헤더 아래 영역은 사진 스티커로만 채운다.

**운영 메인은 `Everstory_mixed.jsx`** (NameIncluded v15 superset, 사이즈 dropdown + multiselect + max-fill 자동 + per-row + 세로 justify + 03_output 자동 저장). v15 baseline (`Everstory_NameIncludedSheet.jsx`) 은 dense + cluster center 기반 안정성 백업으로 동결 유지 — 운영 기준은 `docs/name_included_v15_baseline.md`, layout 세부 규칙은 `docs/name_included_v14_layout.md`. 운영 메인의 layout 정책은 `CLAUDE.md` "행 정렬" 섹션 참조 (per-row + 세로 justify, 외곽/내부 gap 균등 자동 분산).

### Name + Mini Decor

후순위 확장 모드. 미니 데코 소량을 추가한다.

미니 데코는 사진보다 중요하지 않으며, 빈 공간을 보완하는 정도로만 사용한다.

## 운영 규칙

- A5 한 시트 상품으로 운영한다.
- 넘치는 사진은 자동 분할하지 않고 디자인 cap (사이즈별 auto-cap) 으로 입력 단계에서 제한한다.
- 스티커 크기는 **긴 변 기준 인치 6단계 + Mixed**: XS 0.75" / S 1" / M 1.25" / L 1.5" / XL 1.75" / XXL 2.5" / Mixed (1.75/1.5/1.25/1in 4 사이즈, 1.25" 두 배 비중). 기본 S (1"). 칼선/사진간격은 mm 유지 (인치 환산 시 0.0394" 같은 숫자가 어수선해서).
- 파일명 `_NNmm` 사이즈 override 는 폐지. 다이얼로그 dropdown 으로 사이즈 통일 선택.
- 디자인 cap (auto-cap): XS 13 / S 7 / M 5 / L 3 / XL 3 / XXL 1 / Mixed 1. 사이즈 변경 시 ListBox 선택이 cap 초과면 자동 trim.
- 입력 사진이 적고 시트가 비어 보이면 minRepeat 보장 룰 (디자인당 정확 N회 등장 강제) + round-robin filler 로 채움. minRepeat = `floor(slots / designCount)` 동적 계산 (`MIN_REPEAT_OVERRIDE` lookup 우선).
- max-fill 자동 체크박스: 체크 시 입력 gap 무시하고 g ∈ [0.5, 5.0] 0.1 step 시뮬레이션해서 placed 최대인 g 자동 채택.
- 칼선 여백 1mm / 2mm는 고객 선택지가 아니라 내부 제작 옵션이다.

## 이름 스티커 프로토타입

`Everstory_NameSticker.jsx`는 단독 검수용 프로토타입으로 유지한다. 현재 Name Included 시트에는 이름 스티커를 넣지 않는다.

추천 방향:
- **영문 이름**: script/serif/sans 후보를 고정 PostScript 폰트로 검수한다.
- **한글 이름**: 한글 전용 후보를 고정 PostScript 폰트로 검수한다.
- **Minimal Text**: 텍스트 중심 + 글자 외곽을 따라가는 다이컷 backing shape

`Everstory_NameSticker.jsx` 프로토타입에서는 이름 텍스트에 한글이 있으면 한글 후보, 그 외에는 영문 후보만 보여준다. 선택한 PostScript 폰트가 없으면 자동 대체 없이 중단한다.

현재 검수 후보:
- 영문: Snell Roundhand, SignPainter HouseScript, Apple Chancery, Didot, Avenir Next Regular
- 한글: Apple SD Gothic Neo SemiBold, Regular, Medium, Bold, Light

추천 컬러:
- Cocoa Brown
- Soft Black
- Warm Taupe
- Dusty Rose
- Blue Gray
- Sage Gray

이름 입력 권장:
- 영문 3~10자
- 한글 2~5자
- 긴 문구는 이름 스티커로 처리하지 않는다.

## 제외 항목

- phrase/문구 스티커
- PhotoStrip/인생네컷 배치 상품
- 다중 시트 자동 분할 상품

## 구현 상태

- **`Everstory_mixed.jsx` (운영 메인)**: 폴더 → 페어 ListBox multiselect → 단일 사이즈 (XS/S/M/L/XL/XXL) 또는 Mixed → 시트 생성 → `03_output/` 자동 저장. NameIncluded v15 superset. 사이즈 dropdown, multiselect 행 전체 hit area, max-fill 자동 체크박스, per-row + 세로 justify 외곽/내부 gap 균등 자동 분산, trace cache 안정성, 디자인 cap auto-cap 모두 포함.
- `Everstory_NameIncludedSheet.jsx` (v15 baseline 동결): mixed.jsx 가 깨졌을 때 안정성 백업으로만 유지. 새 기능 추가 안 함. layout 정책은 dense + cluster center (mixed.jsx 와 다름).
- `legacy/Everstory_Grid.jsx` (운영 비사용): v10 까지 운영했던 Photo Only 단일 사이즈 시트. 알고리즘 참조용 보관.
- `Everstory_NameSticker.jsx`: 다이컷 스타일 이름 스티커 단독 생성 프로토타입. 현재 시트에 통합하지 않음.
- `Everstory_CleanOffsetPath.jsx`: 수동 Offset Path 검수 중 생긴 내부 조각 제거 보조 도구
- `Everstory_TemplateBuilder.jsx`: 고정 프레임 템플릿 생성용 보조 도구
- Mini Decor: 후순위 확장
