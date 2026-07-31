# Everstory Product Gallery — Project Update Manifest

기존 ChatGPT 프로젝트는 로컬 변경사항과 자동 동기화되지 않는다.
아래 순서로 기존 파일을 교체한다.

## 1. Project Instructions 교체

기존 Project Instructions 전체를 지우고 다음 파일의 내용으로 교체한다.

- `PROJECT_INSTRUCTIONS_KO.md`

이 업데이트의 핵심:

- Active SKU isolation
- Face와 Full Body reference 분리
- cross-SKU product evidence 사용 금지
- 사용자가 승인한 Face angled용 `Physical Scene Base` 예외
- 공통 `GOLDEN_STYLE_ANGLED_01` 구도·배경·조명 기준

## 2. 기존 Project Sources에서 제거

아래 이름의 이전 버전이 있다면 제거한다.

- `EVERSTORY_PRODUCT_GALLERY_SOURCE.md`
- `GALLERY_SYSTEM.md`
- `QA_RUBRIC.json`
- `REFERENCE_INDEX.md`
- `REQUEST_TEMPLATE.json`
- `FACE_STICKER_BRIEF.md`
- `FULL_BODY_STICKER_BRIEF.md`
- 이름이 불명확한 `PRODUCT_BRIEF.md`
- 이름이 불명확한 SKU별 `REFERENCE_INDEX.md`

이전 프로젝트에 상품 이미지들을 Project Sources로 한꺼번에 올렸다면,
Face와 Full Body가 함께 참조되지 않도록 제거하고 채팅별 첨부 방식으로 전환한다.

## 3. 공통 Project Sources 업로드

다음 네 파일을 업로드한다.

1. `REFERENCE_INDEX.md`
2. `shared/EVERSTORY_PRODUCT_GALLERY_SOURCE.md`
3. `shared/GALLERY_SYSTEM.md`
4. `shared/QA_RUBRIC.json`

## 4. SKU별 텍스트 Sources 업로드

Face Sticker:

5. `face-sticker/FACE_STICKER_PRODUCT_BRIEF.md`
6. `face-sticker/FACE_STICKER_REFERENCE_INDEX.md`

Full Body Sticker:

7. `full-body-sticker/FULL_BODY_STICKER_PRODUCT_BRIEF.md`
8. `full-body-sticker/FULL_BODY_STICKER_REFERENCE_INDEX.md`

Project Sources에는 총 8개의 텍스트 source를 유지한다.

## 5. Project Sources에 올리지 않는 파일

다음은 필요한 채팅에서만 사용한다.

- `START_HERE_PROMPT.md`
- SKU별 `*_REQUEST_TEMPLATE.json`
- SKU별 `/prompts` 파일
- 모든 product image

## 6. 채팅별 이미지 첨부

### Face Sticker 채팅

기본적으로 Face 폴더의 이미지와 prompt만 첨부한다.

Face Slot 01 angled에서는 다음 두 이미지를 예외적으로 함께 첨부한다.

1. `full-body-sticker/references/actual-product/white-matte-a5-standing-DSCF0365.jpg`
2. `face-sticker/references/print-artwork/face-1_25in-3-designs.webp`

첫 번째 이미지는 `Physical Scene Base`이며 Face 제품 증거가 아니다.
`prompts/face-sticker/01-hero-angled.md`를 사용한다.

### Full Body Sticker 채팅

Full Body 폴더의 이미지와 prompt만 첨부한다.
Face Sticker 제품 이미지를 제품 source로 첨부하지 않는다.
`prompts/full-body-sticker/01-hero-angled.md`를 사용한다.

Full Body angled 생성에는 다음 세 이미지를 첨부한다.

1. `white-matte-a5-standing-DSCF0365.jpg`
2. `full-body-1_50in-3-designs.webp`
3. `shared/style-references/angled-sheet-warm-gray-v1.png`

세 번째 이미지는 제품 source가 아니라 exact angle과 composition 전용이다.

## 7. 업데이트 확인 프롬프트

파일 교체 후 새 채팅에서 다음을 실행한다.

```text
이 Everstory Product Gallery 프로젝트의 Instructions와 업로드된 Sources를
감사하라. 이미지를 생성하지 말라.

확인:

1. Active SKU isolation 규칙이 있는가?
2. Face Sticker와 Full Body Sticker의 Product Brief와 Reference Index가
   고유한 파일명으로 분리되어 있는가?
3. DSCF0365.jpg가 Full Body Sticker actual photo로 분류되어 있는가?
4. Face Sticker에서 DSCF0365.jpg가 제품 증거가 아닌 승인된 Physical Scene
   Base로만 제한되어 있는가?
5. 공통 Source에 SKU별 reference ID와 현재 이미지 결정이 섞여 있지 않은가?
6. 이전 PG_* 공용 reference ID가 남아 있지 않은가?
7. 각 SKU 작업의 최대 승인 상태가 정확한가?
8. GOLDEN_STYLE_ANGLED_01의 artwork와 텍스트가 제품 사실로 사용되지 않는가?

결과:

- PASS — project sources are cleanly separated
- BLOCKED — [충돌하는 파일명과 정확한 문장]
```
