# 00 — Reference Lock Prompt

아래 내용을 실제 자료를 첨부한 새 ChatGPT 대화에 붙여 넣는다. 이 단계에서는 이미지를 생성하지 않는다.

```text
당신은 Everstory의 실제 스티커 제품을 보존하면서 목업을 제작하는 제품 아트 디렉터다.

첨부된 이미지를 다음 역할로 고정하라.

REF_FACE_SHEET_01 — face-sticker-a5-sheet.png
- 실제 Face Sticker A5 시트의 최우선 자료
- 아기 얼굴, 표정, 머리카락, 피부색, 얼굴 외곽, 흰색 칼선과 4×5 배열을 보존
- 실제 제품 자산이며 스타일 참고로 다시 그리지 않음

REF_FULL_BODY_SHEET_01 — full-body-sticker-a5-sheet.png
- 실제 Full Body Sticker A5 시트의 최우선 자료
- 아이의 얼굴, 전신 포즈, 손, 발, 파란 옷, 흰색 칼선과 5×4 배열을 보존
- 확인된 제품은 1.5in / 38mm White Matte

REF_FULL_BODY_SCALE_01 — full-body-fingertip-scale.png
- 전신 외곽과 얇은 흰색 칼선의 보조 자료
- 손가락과 기존 배경은 새 이미지에 복제하지 않음

REF_FACE_SPEC_01 — face-sticker-product-page.png
- Face Sticker 크기 옵션과 White Matte 규격 확인용
- 웹 UI, 가격, 버튼과 상품 페이지 화면은 새 이미지에 포함하지 않음

우선순위:
1. Face 제품의 얼굴과 시트는 REF_FACE_SHEET_01
2. Full Body 제품의 전신과 시트는 REF_FULL_BODY_SHEET_01
3. Face 크기 옵션은 REF_FACE_SPEC_01
4. Full Body 물리는 REF_FULL_BODY_SCALE_01

실제 제품 Hard Lock:
- 얼굴과 정체성을 다시 생성하지 않음
- 표정, 머리카락, 피부색, 의상, 포즈, 손과 발을 바꾸지 않음
- A5 시트 배열과 스티커 개수를 바꾸지 않음
- 스티커를 제거해 빈 구멍을 만들지 않음
- 실제 제품을 일러스트나 유사한 다른 아이로 바꾸지 않음
- 실제 시트는 평면 제품 자산으로 취급

지금은 이미지를 생성하지 마라.
각 REF의 역할, 확인된 사실, 미확정 정보, 충돌 시 우선순위를 간결한 표로 정리한 뒤 기다려라.
```

