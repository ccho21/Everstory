# Everstory Mockup GPT Project Source

이 디렉토리는 Everstory Studio의 포토 스티커 목업을 일관되게 기획·생성·검수하기 위한 ChatGPT 프로젝트 소스 패키지다.

현재 상태는 **실제 제품 이미지 없이 시작하는 Concept Mockup Mode**다. 따라서 지금 확정하는 것은 장면, 조명, 구도, 배경, 사용 맥락이며, 생성된 임시 스티커 디자인은 실제 제품 증거로 사용하지 않는다.

## 파일 구성

| 파일 | 용도 | ChatGPT 프로젝트 적용 위치 |
|---|---|---|
| `PROJECT_INSTRUCTIONS.md` | 항상 지켜야 할 행동 규칙 | Project settings의 Instructions에 직접 복사 |
| `PROJECT_INSTRUCTIONS_KO.md` | 위 지침의 한국어 버전 | 영문판 대신 Project Instructions에 직접 복사 |
| `EVERSTORY_MASTER_SOURCE.md` | 브랜드·제품·시각 방향의 단일 기준 | Sources에 업로드 |
| `TEMPLATE_CATALOG.md` | 사용할 목업 유형과 제작 조건 | Sources에 업로드 |
| `MOCKUP_REQUEST_TEMPLATE.json` | 목업별 요청 입력 양식 | Sources에 업로드 후 요청마다 복사 |
| `QA_RUBRIC.json` | 생성 결과의 통과·수정·폐기 기준 | Sources에 업로드 |
| `REFERENCE_IMAGE_INDEX.md` | 현재 및 향후 이미지 레퍼런스 관리 | Sources에 업로드 |
| `START_HERE_PROMPT.md` | 첫 대화와 첫 목업 시작 프롬프트 | 프로젝트 첫 채팅에서 사용 |
| `instruction.md` | 기획·생성·실제품 합성·QA·수정·승인의 전체 운영 매뉴얼 | Sources에 업로드 |

## ChatGPT 프로젝트로 옮기는 방법

1. ChatGPT에서 `Everstory Photo Sticker Mockup Studio` 프로젝트를 만든다.
2. `PROJECT_INSTRUCTIONS.md` 또는 `PROJECT_INSTRUCTIONS_KO.md` 중 하나만 골라 프로젝트의 **Instructions**에 직접 붙여 넣는다.
3. 나머지 Markdown 및 JSON 파일을 프로젝트의 **Sources**에 개별 업로드한다.
4. 제품 이미지가 없는 현재에도 `REFERENCE_IMAGE_INDEX.md`를 소스로 올리고, 이미지 상태는 `missing`으로 유지한다.
5. 프로젝트의 첫 채팅에 `START_HERE_PROMPT.md`의 **Source Audit Prompt**를 붙여 넣는다.
6. GPT가 제품 사실, 미확정 정보, Hard Locks를 정확히 구분하는지 확인한다.
7. 같은 파일의 **First Concept Mockup Prompt**로 첫 목업을 만든다.

ChatGPT 프로젝트는 같은 프로젝트 안의 채팅들이 업로드 파일, 프로젝트 지침, 연결된 소스를 공유한다. 서로 다른 결과물은 채팅을 나누되 같은 프로젝트 안에서 진행한다.

공식 참고: <https://learn.chatgpt.com/docs/projects>

## 권장 채팅 구분

| 채팅 이름 | 목적 |
|---|---|
| `00 Source Audit` | 소스 충돌·누락·Hard Locks 확인 |
| `01 Golden Style — Top-down` | 기본 배경·조명·색감 확정 |
| `02 Golden Style — Handheld` | 손·제품 크기·정면 구도 확정 |
| `03 Golden Style — Lifestyle` | 플래너·노트북 등 사용 환경 확정 |
| `04 Product Reference Integration` | 실제 제품 이미지 확보 후 교체 |
| `05 Final Shopify Gallery` | 최종 5컷 갤러리 구성 및 QA |

## 현재 만들 수 있는 결과

- A5 시트 전체 top-down 콘셉트
- 손에 든 A5 시트 콘셉트
- 플래너·노트북·휴대폰 주변 라이프스타일 콘셉트
- Shopify 갤러리의 배경·조명·구도 시스템
- 향후 실제 제품을 삽입하기 쉬운 교체용 장면

## 실제 제품 이미지 전에는 확정하지 않는 것

- 실제 스티커 개수와 배열
- 실제 칼선과 흰 테두리
- 실제 고객 사진과 인물 정체성
- 실제 재질의 광택·반사·투명도
- 실제 인쇄 색상
- 실제 before/after 또는 품질 증거

## 제품 이미지가 생긴 뒤의 전환

1. 실제 A5 시트 정면 사진을 `ref_01_actual_a5_sheet.jpg`로 등록한다.
2. `REFERENCE_IMAGE_INDEX.md`에서 상태를 `available`로 변경한다.
3. 요청 JSON의 `mode`를 `reference_locked`로 바꾼다.
4. 승인된 Golden Style 목업의 장면은 유지한다.
5. 임시 시트 영역만 실제 제품으로 교체한다.
6. 칼선 매크로, before/after, 재질 비교는 실제 제품 사진으로 별도 제작한다.

## 운영 원칙

- 한 번에 하나의 시각 변수만 변경한다.
- 좋은 장면은 새로 생성하지 말고 편집으로 발전시킨다.
- 승인된 이미지만 Golden Style 또는 Golden Product Reference로 등록한다.
- 경쟁사 이미지는 설명 방식만 참고하고 디자인 자산으로 복제하지 않는다.
- 실제 제품과 다른 이미지는 항상 `Concept Mockup`으로 관리한다.
