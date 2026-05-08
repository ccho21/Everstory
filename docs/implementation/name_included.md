# Name Included Sheet

`Everstory_NameIncludedSheet.jsx` v15 를 Name Included 안정성 백업 기준선으로 동결한다. **운영 메인은 `Everstory_mixed_v2.jsx`** (v20, v2 브랜드 템플릿) 이며 v15 의 superset (사이즈 dropdown, multiselect, per-row + 세로 justify, 03_output 자동 저장, v2 헤더 주입). v15 는 mixed 가 깨졌을 때 fallback 으로만 사용.

> 버전 진화 기록 (v13 plan / v14 layout / v15 baseline 원본 문서) 은 [`docs/archive/`](../archive/) 에 보존.

## Freeze Status

- 상태: 동결 (안정성 백업)
- 기준 스크립트: `Everstory_NameIncludedSheet.jsx`
- 기준 버전: v15
- 동결 사유: 실사용 검수에서 Illustrator crash, cutline 누락, magenta `CutContour` stroke 누락 문제가 더 이상 보이지 않음
- 변경 원칙: production blocker 급 버그 수정 외에는 layout 알고리즘과 placement 흐름을 건드리지 않는다. 새 기능은 `Everstory_mixed_v2.jsx` 에 추가.
- **레이아웃 분기점**: v15 는 dense + cluster center (가로 stride = `GAP_MM` 고정, 행 가로 가운데 정렬, 세로 행간 `GAP_MM` 고정) — 아래 "Frozen Layout Algorithm" 섹션 참조. 운영 메인 `Everstory_mixed_v2.jsx` 는 **per-row + 세로 justify** (외곽/내부 gap 균등 자동 분산) 로 다른 정책 — [packing_internals.md](packing_internals.md) "행 정렬" 섹션 참조.

## Scope

이 기준선은 **Name Included** 시트에만 적용한다.

- `template_cutout.ait` 의 `info > header` 에 고객 이름과 주문 정보를 그린다.
- `template_cutout.ait` 의 `info > body` 에 사진 스티커만 배치한다.
- 별도 이름 스티커는 생성하지 않는다.
- Photo Only 용 `legacy/Everstory_Grid.jsx` 는 별도 흐름이며 이 기준선에 포함하지 않는다.

## Frozen Layout Algorithm (v14 shelf/justify)

레이아웃 알고리즘은 v14 에서 확정한 shelf/row 정책을 유지한다. v15 는 layout 을 바꾸지 않고 stability layer 만 추가한 버전.

**기준**:
- 배치 기준은 피사체 외곽선이 아니라 **cell bbox**.
- `GAP_MM = 2` 는 행 간 세로 간격의 기준값.
- 행 내부 가로 간격은 양끝 정렬을 위해 row 별로 늘어날 수 있다.
- 회전은 허용하지 않는다.
- 스티커의 최종 cell 크기는 긴 변 기준 S/M/L/XL 또는 파일명 `_NNmm` override 로 정한다.

**알고리즘**:
1. `_collectPairs` 로 `_clean.psd` + `_sil.png` 페어를 수집한다.
2. `_measurePairAspect` 로 `sil.png` 의 canvas aspect 를 읽고, 선택 사이즈의 긴 변 기준 cell W/H 를 계산한다.
3. 원본 사진은 `_sortedPairsForShelf` 로 height desc, area desc, base name asc 순서로 정렬한다.
4. `_shelfPack` 은 현재 row 에 들어가면 추가하고, 안 들어가면 row 를 닫고 다음 row 를 연다.
5. 모든 원본이 들어간 경우에만 filler 를 시작한다. 원본 중 하나라도 leftover 가 있으면 반복 채움은 하지 않는다.
6. filler 는 `_buildShelfFillItems` 로 작은 cell 우선 정렬하되, `_shelfPack` 안에서 `fillerIdx` 를 움직이며 round-robin 으로 순환한다.
7. filler 가 현재 row 에 하나도 안 들어가면 row 를 닫고 다음 row 를 연다. 새 row 에도 아무 filler 가 안 들어가면 종료한다.
8. `_shelfRowsToPlaced` 는 row 별로 x 좌표를 확정한다.

**Row 배치 규칙** — 세로:
```
nextRowY = prevRowY + prevRowHeight + GAP_MM
```

**Row 배치 규칙** — 가로:
- row item 이 1개면 body 안에서 가운데 정렬한다.
- row item 이 2개 이상이면 양끝 정렬한다.
```
actualGap = (binW - sum(itemW)) / (itemCount - 1)
actualGap = max(actualGap, GAP_MM)
```

**v14 가 보장하는 것**:
- 행 간 세로 gap 은 `GAP_MM` 로 고정
- 같은 row 안의 가로 gap 은 해당 row 안에서 동일
- row 간 가로 gap 값은 달라질 수 있음
- row 양끝 공백은 제거됨

**Round-robin filler**: `fillerIdx` 를 row 간에 이어 받아 디자인별로 순환. 첫 번째 filler 만 반복되는 v13 이전 문제 해결.

## Frozen Stability Behavior (v15 추가)

v15 의 핵심 안정화는 **cutline trace cache**.

기존 문제 (v14 이전):
- placement 수만큼 `_newDocForImage`
- placement 수만큼 `_traceAndUnite`
- placement 수만큼 `app.copy` / `app.paste`
- 반복 채움이 많은 S/M 사이즈에서 Illustrator crash 가능성 증가

v15 기준:
- 같은 `sil.png` 는 시트당 1회만 Image Trace 한다.
- trace 결과 cutline 을 `TraceStash` 레이어에 캐시한다.
- placement 마다 cached cutline 을 `duplicate()` 해서 `KissCut` 에 배치한다.
- final cleanup 에서 `TraceStash` 레이어를 제거한다.
- PSD embed 는 아직 placement 마다 수행한다 (known remaining cost).

이 trace cache 흐름은 운영 메인 `Everstory_mixed_v2.jsx` 도 그대로 상속.

## Known Non-Issues After Freeze

다음 문제는 현재 검수에서 재현되지 않아 동결 기준선에서 해결된 것으로 본다.

- Illustrator crash during Name Included generation
- `KissCut` path 생성 누락
- `CutContour` magenta stroke 미표시
- filler 가 한 사진에만 몰리는 문제
- row 내부 큰 hole 이 눈에 띄는 문제

## Do Not Change Without Reopening

다음 항목은 동결 해제 전까지 변경하지 않는다.

- `_shelfPack`
- `_shelfRowsToPlaced`
- `_buildShelfFillItems`
- round-robin filler 순서
- justify row 배치
- `GAP_MM`
- trace cache 흐름

## Trade-off (v14 layout)

- 기존 MaxRects 방식보다 내부 hole 은 줄지만, packing 최적해를 찾는 알고리즘은 아니다.
- 양끝 정렬 때문에 가로 gap 은 2mm 보다 커질 수 있다.
- 피사체 외곽선 사이의 시각적 거리는 `sil.png` canvas trim 상태에 영향을 받는다.
- `legacy/Everstory_Grid.jsx` (Photo Only) 는 별도 스크립트이며, 현재 이 v14 shelf/justify 알고리즘을 적용하지 않는다.

## Future Work

동결 이후 별도 작업으로만 검토한다.

- PSD embed cache
- hard cap / placement cap
- Photo Only 라인을 운영 메인으로 통합
- cutline offset 후 outer contour cleanup 자동화
