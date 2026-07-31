# Everstory Product Gallery — Start Prompts

## Face Sticker 채팅 시작

Face Sticker 자료만 첨부한 채팅에서 사용한다.

```text
ACTIVE SKU: Face Sticker

이 채팅에서는 Face Sticker 자료만 사용하라.
다른 SKU의 자료를 Face Sticker 제품 사실로 사용하지 말라.
단, Slot 01 angled 작업에서 사용자가 승인한 DSCF0365.jpg는
Physical Scene Base로만 사용할 수 있다. 그 경우 Full Body 인쇄면, size,
count와 customer artwork는 모두 폐기하고 결과를 reference_guided_composite로
분류하라. 아직 이미지를 생성하지 말라.

다음 Sources를 확인하라.

- shared/EVERSTORY_PRODUCT_GALLERY_SOURCE.md
- shared/GALLERY_SYSTEM.md
- shared/QA_RUBRIC.json
- FACE_STICKER_PRODUCT_BRIEF.md
- FACE_STICKER_REFERENCE_INDEX.md

보고할 내용:

1. 사용 가능한 Face Sticker reference
2. 각 reference가 증명할 수 있는 것과 없는 것
3. 현재 missing actual references
4. Slot 01–05 readiness
5. 현재 결과물의 최대 승인 상태
6. source 충돌 또는 누락

DSCF0365.jpg는 Full Body Sticker actual photo이며 Face Sticker actual product
evidence가 아니다. 승인된 Slot 01 angled physical-scene transfer 외에는
Face Sticker 작업에 사용하지 않는다.

마지막에 다음 중 하나를 반환하라.

READY — Face Sticker concept prompt work may begin.
BLOCKED — [정확한 Face Sticker 누락 또는 충돌]
```

## Full Body Sticker 채팅 시작

Full Body Sticker 자료만 첨부한 채팅에서 사용한다.

```text
ACTIVE SKU: Full Body Sticker

이 채팅에서는 Full Body Sticker 자료만 사용하라.
Face Sticker 이미지와 다른 SKU의 대화 내용을 제품 reference로 사용하지 말라.
아직 이미지를 생성하지 말라.

다음 Sources를 확인하라.

- shared/EVERSTORY_PRODUCT_GALLERY_SOURCE.md
- shared/GALLERY_SYSTEM.md
- shared/QA_RUBRIC.json
- FULL_BODY_STICKER_PRODUCT_BRIEF.md
- FULL_BODY_STICKER_REFERENCE_INDEX.md

보고할 내용:

1. 사용 가능한 Full Body Sticker reference
2. 각 reference가 증명할 수 있는 것과 없는 것
3. Slot 01–05 readiness
4. actual-photo correction이 가능한 slot
5. 실제 자료 부족으로 blocked된 slot
6. 라이브 페이지 문구 중 검증이 필요한 충돌
7. source 충돌 또는 누락

FULL_ACTUAL_SHEET_01은 Full Body Sticker의 실제 제품 사진이다.
Route A actual-photo correction에서는 인쇄면을 교체하지 않는다.
Route B angled composite에서는 FULL_ART_150_01의 세 번째 blue-romper design만
5 × 4로 반복하고 결과를 reference_guided_composite로 분류한다.

마지막에 다음 중 하나를 반환하라.

READY — Full Body Sticker Slot 01 actual-photo correction may begin.
BLOCKED — [정확한 Full Body Sticker 누락 또는 충돌]
```
