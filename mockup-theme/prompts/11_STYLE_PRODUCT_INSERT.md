# 11 — Product Insert

빈 무대가 승인된 같은 대화에서 실행한다.

```text
STYLE APPLICATION — PASS B: PRODUCT INSERT를 실행하라.

승인된 PASS A 이미지를 편집한다. 배경, 물체 위치, 크기, 카메라, 컬러, 조명과 그림자는 변경하지 않는다. 새로운 장면을 다시 설계하지 않는다.

MOCKUP_REQUEST의 product_placements 순서대로 실제 제품을 삽입한다.

제품 규칙:
- asset_ref에 지정된 실제 이미지를 사용
- 실제 얼굴·전신·shape artwork를 다시 생성하지 않음
- 지정된 size_in과 실제 주변 물체 크기의 비율 유지
- 부착된 스티커는 표면에 완전히 밀착
- 곡면에서는 곡률을 따름
- 실제 시트는 완전한 평면 자산으로 삽입
- 시트 배열, 스티커 개수, 헤더·푸터·QR을 임의로 변경하지 않음
- supplied logo를 가리지 않음
- placement가 없는 제품은 깨끗한 빈 상태 유지

한 번의 편집으로 제품 삽입을 끝내고, 다음을 간결하게 보고하라:
- 사용한 실제 자산
- 삽입 위치와 크기
- Hard Lock 보존 여부
- 사람이 확인해야 할 작은 텍스트·로고·QR 영역
```

