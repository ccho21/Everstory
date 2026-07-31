# Everstory Mockup Theme

`mockup-theme`은 Everstory의 실제 스티커 제품을 보존하면서 일관된 목업을 만들기 위한 독립형 생성 시스템이다. 기존 `mockup/` 및 `product-gallery/`의 규칙을 상속하지 않는다.

## 확정된 방향

- 전체 이미지 구성: 정돈된 제품·스튜디오 장면 70%, 라이프스타일 장면 30%
- 핵심 구도: 수평·수직축, 일정한 간격, 프레임과 평행한 제품 가장자리
- 제품 원칙: 실제 얼굴·전신·시트·칼선·크기를 변경하지 않는다.
- 스타일 원칙: 우드 테이블, 나무 장난감, 노란 조명, 베이지 단색 AI 목업을 피한다.
- 제작 원칙: `제품 잠금 → 빈 스타일 무대 → 실제 제품 삽입 → QA` 순서로 진행한다.

## 가장 빠른 시작

1. 새 ChatGPT 대화에 [`references/REFERENCE_INDEX.md`](references/REFERENCE_INDEX.md)에 적힌 실제 이미지를 첨부한다.
2. [`prompts/00_REFERENCE_LOCK.md`](prompts/00_REFERENCE_LOCK.md)를 붙여 넣고 역할 확인만 받는다.
3. Face 제품은 [`prompts/01_FACE_FIDELITY_TEST.md`](prompts/01_FACE_FIDELITY_TEST.md), Full Body 제품은 [`prompts/02_FULL_BODY_FIDELITY_TEST.md`](prompts/02_FULL_BODY_FIDELITY_TEST.md)로 정확도를 검증한다.
4. [`templates/MOCKUP_REQUEST.template.json`](templates/MOCKUP_REQUEST.template.json)을 복사해 이번 요청을 작성한다.
5. 장면 카드 하나를 선택하고 [`prompts/10_STYLE_EMPTY_STAGE.md`](prompts/10_STYLE_EMPTY_STAGE.md)로 빈 무대를 만든다.
6. 빈 무대가 승인되면 [`prompts/11_STYLE_PRODUCT_INSERT.md`](prompts/11_STYLE_PRODUCT_INSERT.md)로 실제 제품을 삽입한다.
7. [`templates/QA_RUBRIC.json`](templates/QA_RUBRIC.json)으로 검수한다.

## 프롬프트 빌더

Node.js만 있으면 요청 JSON과 장면 카드를 한 번에 조합할 수 있다. 스크립트는 결과를 표준 출력으로만 보내며 파일을 수정하지 않는다.

```bash
node mockup-theme/scripts/build-prompt.mjs --list
node mockup-theme/scripts/build-prompt.mjs --stage reference-lock
node mockup-theme/scripts/build-prompt.mjs --stage fidelity-face
node mockup-theme/scripts/build-prompt.mjs \
  --stage empty-stage \
  --request mockup-theme/templates/MOCKUP_REQUEST.template.json
node mockup-theme/scripts/build-prompt.mjs \
  --stage product-insert \
  --request mockup-theme/templates/MOCKUP_REQUEST.template.json
```

출력을 클립보드로 복사하려면 운영체제에 맞는 클립보드 명령을 별도로 연결한다. 스크립트 자체는 클립보드나 프로젝트 파일을 변경하지 않는다.

## 장면 선택

| ID | 장면 | 기본 비중 | 용도 |
|---|---|---:|---|
| `S01_SHEET` | A5 시트 + 개별 스티커 | 25% | 시트 구성, 크기 옵션 |
| `S02_STATIONERY` | 정렬된 문구·소품 | 30% | 다양한 부착면과 컬러 |
| `S03_TECH` | 실사 기반 테크 | 15% | 맥북·아이폰·아이패드·텀블러 |
| `L01_LIFESTYLE` | 손 없는 실제 사용 장면 | 30% | 산책·여행·사무실 등 사용 맥락 |

10장 배치에서는 스튜디오 계열 7장, 라이프스타일 3장을 기본으로 한다.

## 핵심 파일

- [`THEME_BIBLE_KO.md`](THEME_BIBLE_KO.md): 변경하면 안 되는 시각 원칙
- [`WORKFLOW.md`](WORKFLOW.md): 생성 및 승인 순서
- [`palette.json`](palette.json): 컬러 토큰과 장면별 배색
- [`scene-catalog.json`](scene-catalog.json): 장면 라우팅과 필수 조건
- [`products/`](products): 제품별 확인된 규격과 자산
- [`prompts/`](prompts): ChatGPT에서 순서대로 사용하는 프롬프트
- [`references/`](references): 실제 제품·규격 자료와 역할 인덱스
- [`templates/`](templates): 요청 입력과 QA 기준
- [`scripts/build-prompt.mjs`](scripts/build-prompt.mjs): 요청·장면·단계 프롬프트 조합기
- [`outputs/`](outputs): 생성 결과와 승인본 저장 규칙

## 중요한 한계

이미지 생성 결과에서 얼굴, 반복 배열, 작은 글자, 로고 또는 QR이 변하면 그 결과는 최종 상품 증거가 아니다. 이 경우 AI는 배경·소품·조명까지만 만들고, 실제 시트와 스티커 PNG는 후합성한다.
