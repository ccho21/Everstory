# Name Included Sheet v15 Baseline

`Everstory_NameIncludedSheet.jsx` v15 를 Name Included 안정성 백업 기준선으로 동결한다. **운영 메인은 `Everstory_mixed.jsx`** 이며 v15 의 superset (사이즈 dropdown, multiselect, max-fill 자동, per-row + 세로 justify, 03_output 자동 저장) 으로 운영된다. v15 는 mixed.jsx 가 깨졌을 때 fallback 으로만 사용.

## Freeze Status

- 상태: 동결 (안정성 백업)
- 기준 스크립트: `Everstory_NameIncludedSheet.jsx`
- 기준 버전: v15
- 동결 사유: 실사용 검수에서 Illustrator crash, cutline 누락, magenta `CutContour` stroke 누락 문제가 더 이상 보이지 않음
- 변경 원칙: production blocker 급 버그 수정 외에는 layout 알고리즘과 placement 흐름을 건드리지 않는다. 새 기능은 `Everstory_mixed.jsx` 에 추가.
- **레이아웃 분기점**: v15 는 dense + cluster center (가로 stride = `GAP_MM` 고정, 행 가로 가운데 정렬, 세로 행간 `GAP_MM` 고정) — `docs/name_included_v14_layout.md` 참조. 운영 메인 `Everstory_mixed.jsx` 는 **per-row + 세로 justify** (외곽/내부 gap 균등 자동 분산) 로 다른 정책 — `CLAUDE.md` "행 정렬" 섹션 참조.

## Scope

이 기준선은 **Name Included** 시트에만 적용한다.

- `template_cutout.ait` 의 `info > header` 에 고객 이름과 주문 정보를 그린다.
- `template_cutout.ait` 의 `info > body` 에 사진 스티커만 배치한다.
- 별도 이름 스티커는 생성하지 않는다.
- Photo Only 용 `Everstory_Grid.jsx` 는 별도 흐름이며 이 기준선에 포함하지 않는다.

## Frozen Layout Algorithm

레이아웃 알고리즘은 v14 에서 확정한 shelf/row 정책을 유지한다.

- `cell bbox` 기준 배치
- `GAP_MM = 2`
- 행 간 세로 gap 은 고정
- 행 내부 가로는 justify 로 양끝 정렬
- 입력 사진이 적을 때는 round-robin filler 로 반복 채움
- 회전 없음
- 원본 중 하나라도 leftover 가 생기면 filler 는 실행하지 않음

상세 layout 규칙은 `docs/name_included_v14_layout.md` 를 참고한다. v15 는 layout 을 바꾸지 않고 stability layer 만 추가한 버전이다.

## Frozen Stability Behavior

v15 의 핵심 안정화는 cutline trace cache 다.

기존 문제:

- placement 수만큼 `_newDocForImage`
- placement 수만큼 `_traceAndUnite`
- placement 수만큼 `app.copy` / `app.paste`
- 반복 채움이 많은 S/M 사이즈에서 Illustrator crash 가능성 증가

v15 기준:

- 같은 `sil.png` 는 시트당 1회만 Image Trace 한다.
- trace 결과 cutline 을 `TraceStash` 레이어에 캐시한다.
- placement 마다 cached cutline 을 `duplicate()` 해서 `KissCut` 에 배치한다.
- final cleanup 에서 `TraceStash` 레이어를 제거한다.
- PSD embed 는 아직 placement 마다 수행한다. 이 부분은 현재 동결 기준선의 known remaining cost 로 둔다.

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

## Future Work

동결 이후 별도 작업으로만 검토한다.

- PSD embed cache
- hard cap / placement cap
- `Everstory_Grid.jsx` 로 Name Included 알고리즘 통합
- cutline offset 후 outer contour cleanup 자동화
