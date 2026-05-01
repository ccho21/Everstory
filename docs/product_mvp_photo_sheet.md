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

현재 `Everstory_Grid.jsx`의 구현 범위와 가장 가깝다.

### Name Included

대표 MVP 모드. 사진 중심 배치를 유지하면서 상단 production header에 고객 이름과 주문 정보를 표기한다.

이름은 스티커 아이템이 아니라 header metadata로만 사용한다. 헤더 아래 영역은 사진 스티커로만 채운다.

### Name + Mini Decor

후순위 확장 모드. 미니 데코 소량을 추가한다.

미니 데코는 사진보다 중요하지 않으며, 빈 공간을 보완하는 정도로만 사용한다.

## 운영 규칙

- A5 한 시트 상품으로 운영한다.
- 넘치는 사진은 자동 분할하지 않고 사진 수 또는 크기를 조정한다.
- 스티커 크기는 긴 변 기준 20mm / 30mm / 60mm를 사용한다.
- 파일명에 `_NNmm`가 있으면 해당 사진만 개별 크기를 적용할 수 있다.
- 입력 사진이 적고 시트가 비어 보이면 같은 사진을 반복 배치할 수 있다.
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

- `Everstory_Grid.jsx`: Photo Only에 해당하는 A5 한 시트 다이컷 자동 배치 구현
- `Everstory_NameSticker.jsx`: 다이컷 스타일 이름 스티커 단독 생성 프로토타입. 현재 Name Included 시트에는 통합하지 않는다.
- `Everstory_NameIncludedSheet.jsx`: `a5_border` 안쪽 상하좌우 2mm 안전 여백을 적용한 뒤, 상단 20mm production header에 `EVERSTORY`와 주문 정보를 배치한다. 헤더 아래 전체 영역에는 사진 스티커만 pack하며, 별도 이름 스티커는 생성하지 않는다.
- `Everstory_CleanOffsetPath.jsx`: 수동 Offset Path 검수 중 생긴 내부 조각 제거 보조 도구
- Name Included Grid 통합: 다음 구현 단계
- Mini Decor: 후순위 확장
- `Everstory_TemplateBuilder.jsx`: 고정 프레임 템플릿 생성용 보조 도구로 유지
