# Name Included Sheet v14 Layout

`Everstory_NameIncludedSheet.jsx` 의 shelf/row layout 알고리즘을 정리한다. 현재 운영 동결 기준은 `docs/name_included_v15_baseline.md` 이며, 이 문서는 v15 baseline 의 layout 세부 규칙으로 참조한다. `docs/name_included_v13_plan.md` 는 이전 계획 문서로만 본다.

> ⚠️ **운영 메인 `Everstory_mixed.jsx` 는 이 v14 알고리즘을 더 이상 사용하지 않는다.**
> mixed.jsx 는 **per-row + 세로 justify** 정책 (`(binW - ΣitemW) / (n+1)` per row 가로, `(binH - ΣrowH) / (R+1)` 세로) 으로 외곽/내부 gap 균등 자동 분산. 이 v14 문서의 shelf/justify (행 간 세로 gap = `GAP_MM` 고정 + 행 내부 가로 양끝 stretched) 는 v15 frozen baseline `Everstory_NameIncludedSheet.jsx` 에만 유효. 운영 layout 정책은 `CLAUDE.md` "행 정렬" 섹션 참조.

## 목표

- A5 `template_cutout.ait` 의 `info > header` 에 고객 이름과 주문 정보를 표시한다.
- `info > body` 영역에는 사진 스티커만 배치한다.
- 빨간 박스처럼 보이는 내부 hole 을 만들지 않고, 행 단위로 정돈된 시트를 만든다.
- 입력 사진이 적으면 같은 사진을 반복 배치하되, 한 사진만 몰리지 않게 한다.

## 기준

- 배치 기준은 피사체 외곽선이 아니라 **cell bbox** 다.
- `GAP_MM = 2` 는 행 간 세로 간격의 기준값이다.
- 행 내부 가로 간격은 양끝 정렬을 위해 row 별로 늘어날 수 있다.
- 회전은 허용하지 않는다.
- 스티커의 최종 cell 크기는 긴 변 기준 S/M/L/XL 또는 파일명 `_NNmm` override 로 정한다.

## 알고리즘

1. `_collectPairs` 로 `_clean.psd` + `_sil.png` 페어를 수집한다.
2. `_measurePairAspect` 로 `sil.png` 의 canvas aspect 를 읽고, 선택 사이즈의 긴 변 기준 cell W/H 를 계산한다.
3. 원본 사진은 `_sortedPairsForShelf` 로 height desc, area desc, base name asc 순서로 정렬한다.
4. `_shelfPack` 은 현재 row 에 들어가면 추가하고, 안 들어가면 row 를 닫고 다음 row 를 연다.
5. 모든 원본이 들어간 경우에만 filler 를 시작한다. 원본 중 하나라도 leftover 가 있으면 반복 채움은 하지 않는다.
6. filler 는 `_buildShelfFillItems` 로 작은 cell 우선 정렬하되, `_shelfPack` 안에서 `fillerIdx` 를 움직이며 round-robin 으로 순환한다. filler 도 추가될 때 row.h 가 max(row.h, item.h) 로 갱신되므로, filler 가 원본보다 큰 cellH 를 가지면 그 row 가 더 두꺼워지고 다음 row.y 가 그만큼 밀린다.
7. filler 가 현재 row 에 하나도 안 들어가면 row 를 닫고 다음 row 를 연다. 새 row 에도 아무 filler 가 안 들어가면 종료한다.
8. `_shelfRowsToPlaced` 는 row 별로 x 좌표를 확정한다.

## Row 배치 규칙

세로:

```
nextRowY = prevRowY + prevRowHeight + GAP_MM
```

가로:

- row item 이 1개면 body 안에서 가운데 정렬한다.
- row item 이 2개 이상이면 양끝 정렬한다.
- row 안 실제 가로 gap 은 아래처럼 계산한다.

```
actualGap = (binW - sum(itemW)) / (itemCount - 1)
actualGap = max(actualGap, GAP_MM)
```

따라서 현재 v14 에서 보장하는 것은:

- 행 간 세로 gap 은 `GAP_MM` 로 고정
- 같은 row 안의 가로 gap 은 해당 row 안에서 동일
- row 간 가로 gap 값은 달라질 수 있음
- row 양끝 공백은 제거됨

## Round-robin filler

기존 문제:

```js
for (var fi = 0; fi < fillerItems.length; fi++) {
  if (_canAddToShelfRow(row, fillerItems[fi], binW, binH, gap)) {
    _addToShelfRow(row, fillerItems[fi], gap);
    break;
  }
}
```

매번 `fi = 0` 부터 다시 시작해서 첫 번째 filler 만 반복되는 문제가 있었다.

v14 는 아래 방식으로 다음 시작점을 이동한다.

```js
var fi = (fillerIdx + step) % fillerItems.length;
...
fillerIdx = (fi + 1) % fillerItems.length;
```

이렇게 하면 입력 사진이 적어도 반복 채움이 디자인별로 순환된다.

## Trade-off

- 기존 MaxRects 방식보다 내부 hole 은 줄지만, packing 최적해를 찾는 알고리즘은 아니다.
- 양끝 정렬 때문에 가로 gap 은 2mm 보다 커질 수 있다.
- 피사체 외곽선 사이의 시각적 거리는 `sil.png` canvas trim 상태에 영향을 받는다.
- Photo Only 용 `Everstory_Grid.jsx` 는 별도 스크립트이며, 현재 이 v14 shelf/justify 알고리즘을 적용하지 않는다.
