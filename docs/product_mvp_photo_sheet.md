# Everstory MVP Photo Sticker Sheet

## 상품 정의

Everstory의 첫 주력 상품은 고객 사진을 중심으로 만드는 **A5 커스텀 사진 다이컷 스티커 시트**다.

핵심 원칙:
- 사진이 85~90%를 차지한다.
- 이름 스티커는 대표 상품의 개인화 요소로 1개만 사용한다.
- 미니 데코는 후순위 보조 요소다.
- 문구 스티커는 MVP에서 제외한다.
- 자유배치가 아니라 자동화 가능한 구조를 유지한다.

## 상품 모드

### Photo Only

기본형 옵션. 사진 누끼 스티커만 A5 한 시트에 자동 배치한다.

현재 `Everstory_Grid.jsx`의 구현 범위와 가장 가깝다.

### Name Included

대표 MVP 모드. 사진 중심 배치를 유지하면서 이름 스티커 1개를 추가한다.

이름 스티커는 텍스트 외곽을 따라가는 흰색 또는 중립색 다이컷 backing shape를 기준으로 컷팅한다. 생성 방식과 배치 방식은 별도 구현 단계에서 확정한다.

### Name + Mini Decor

후순위 확장 모드. 이름 스티커 1개와 미니 데코 소량을 추가한다.

미니 데코는 사진보다 중요하지 않으며, 빈 공간을 보완하는 정도로만 사용한다.

## 운영 규칙

- A5 한 시트 상품으로 운영한다.
- 넘치는 사진은 자동 분할하지 않고 사진 수 또는 크기를 조정한다.
- 스티커 크기는 긴 변 기준 20mm / 30mm / 60mm를 사용한다.
- 파일명에 `_NNmm`가 있으면 해당 사진만 개별 크기를 적용할 수 있다.
- 입력 사진이 적고 시트가 비어 보이면 같은 사진을 반복 배치할 수 있다.
- 칼선 여백 1mm / 2mm는 고객 선택지가 아니라 내부 제작 옵션이다.

## 이름 스티커 방향

초기 이름 스티커는 자동화 안정성을 우선한다.

추천 스타일:
- **Clean Label**: 라운드 사각형 또는 캡슐형 라벨
- **Soft Cute**: 작은 하트/별/발바닥 등 아이콘 1개 정도의 부드러운 라벨
- **Minimal Text**: 텍스트 중심 + 글자 외곽을 따라가는 다이컷 backing shape

`Everstory_NameSticker.jsx` 프로토타입에서는 사용자가 폰트를 직접 고르지 않는다. 스타일별로 스크립트가 우선 폰트를 자동 적용하고, 사용자는 아래 6개 컬러 중 하나만 선택한다.

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

- `Everstory_Grid.jsx`: Photo Only에 해당하는 A5 한 시트 다이컷 자동 배치 구현
- `Everstory_NameSticker.jsx`: Name Included용 다이컷 스타일 이름 스티커 단독 생성 프로토타입
- `Everstory_NameIncludedSheet.jsx`: `a5_border` 안쪽 상하좌우 3mm 안전 여백을 적용한 뒤, 상단 15mm 헤더 왼쪽에는 이름 스티커를, 오른쪽에는 작은 오더 디테일 텍스트를 배치한다. 사진은 헤더 아래 직사각형 영역에 pack하며, 템플릿 정보/QR 영역은 별도로 계산하지 않는다.
- `Everstory_CleanOffsetPath.jsx`: 수동 Offset Path 검수 중 생긴 내부 조각 제거 보조 도구
- Name Included Grid 통합: 다음 구현 단계
- Mini Decor: 후순위 확장
- `Everstory_TemplateBuilder.jsx`: 고정 프레임 템플릿 생성용 보조 도구로 유지
