# Outputs

생성 결과는 다음 이름을 사용한다.

```text
YYYYMMDD_<product-id>_<scene-id>_<stage>_vNN.png
```

`stage` 값:

- `empty`: 제품 삽입 전 승인용 빈 무대
- `concept`: 제품 정확도가 검증되지 않은 생성 결과
- `composite`: 실제 자산을 삽입한 결과
- `approved`: QA를 통과한 최종 승인본

예시:

```text
20260731_face-sticker_S02_STATIONERY_empty_v01.png
20260731_face-sticker_S02_STATIONERY_composite_v02.png
```

얼굴, 시트 배열, 로고, 작은 글자 또는 QR이 바뀐 이미지는 `approved`로 저장하지 않는다.

