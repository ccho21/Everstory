# Mockup Workflow

## Phase 0 — 요청 작성

[`templates/MOCKUP_REQUEST.template.json`](templates/MOCKUP_REQUEST.template.json)을 복사하고 다음을 결정한다.

- 제품군: `face_sticker`, `full_body_sticker`, `shape_sticker`
- 실제 크기
- 실제 제품 자산
- 장면 ID
- 사용처와 화면비
- 부착할 제품과 비워둘 제품
- 라이프스타일인 경우 실제 사용 맥락

## Phase 1 — Reference Lock

실제 제품 이미지를 ChatGPT 대화에 첨부하고 [`prompts/00_REFERENCE_LOCK.md`](prompts/00_REFERENCE_LOCK.md)를 실행한다. 이 단계에서는 이미지를 생성하지 않는다.

확인할 것:

- 각 이미지의 역할
- 제품 사실과 스타일 참고의 분리
- 충돌 시 우선순위
- 빠진 실제 자산

## Phase 2 — Product Fidelity Gate

- Face: [`prompts/01_FACE_FIDELITY_TEST.md`](prompts/01_FACE_FIDELITY_TEST.md)
- Full Body: [`prompts/02_FULL_BODY_FIDELITY_TEST.md`](prompts/02_FULL_BODY_FIDELITY_TEST.md)

얼굴, 전신, 시트 배열, 작은 텍스트 또는 QR이 바뀌면 직접 생성 방식은 실패다. 이 경우 Phase 3의 빈 무대만 생성하고 제품은 후합성한다.

## Phase 3 — Empty Style Stage

장면 카드 하나를 선택한다.

- [`prompts/scenes/S01_SHEET.md`](prompts/scenes/S01_SHEET.md)
- [`prompts/scenes/S02_STATIONERY.md`](prompts/scenes/S02_STATIONERY.md)
- [`prompts/scenes/S03_TECH.md`](prompts/scenes/S03_TECH.md)
- [`prompts/scenes/L01_LIFESTYLE.md`](prompts/scenes/L01_LIFESTYLE.md)

요청 JSON과 장면 카드를 같은 대화에 제공한 뒤 [`prompts/10_STYLE_EMPTY_STAGE.md`](prompts/10_STYLE_EMPTY_STAGE.md)를 실행한다.

빈 무대에서 검수할 것:

- 구도와 정렬
- 제품 간 역할 차이
- 컬러와 재질
- 부착면 크기
- 조명과 AI 느낌

## Phase 4 — Product Insert

승인된 빈 무대를 편집 대상으로 유지하고 [`prompts/11_STYLE_PRODUCT_INSERT.md`](prompts/11_STYLE_PRODUCT_INSERT.md)를 실행한다. 한 번의 편집에서 제품 삽입을 끝낸다.

제품이 변형되면 같은 결과를 여러 번 수정하지 않는다. 승인된 빈 무대에 실제 PNG를 후합성한다.

## Phase 5 — QA

[`templates/QA_RUBRIC.json`](templates/QA_RUBRIC.json)을 적용한다.

- Hard fail이 하나라도 있으면 폐기
- 90점 이상: 승인 후보
- 80~89점: 한 변수만 수정
- 80점 미만: 장면 재생성

## Phase 6 — 출력 보관

[`outputs/README.md`](outputs/README.md)의 이름 규칙을 따른다. 승인본만 `approved` 상태로 기록한다.

## 배치 구성

10장 기준:

- S01: 2~3장
- S02: 3장
- S03: 1~2장
- L01: 3장

S01+S02+S03 합계는 7장, L01은 3장을 기본으로 한다.

