# Name Included Sheet v12 — 레이아웃 모드 + 성능 최적화 계획

`Everstory_NameIncludedSheet.jsx` v12 작업 들어가기 전 합의된 설계를 정리한다. 구현 시 이 문서를 기준으로 한다.

대상 파일: `Everstory_NameIncludedSheet.jsx` (현재 v11)
선행 조건: 성능 최적화 2개 (trace 캐싱 + math-first planning) 가 모드 추가보다 먼저 들어간다.

## 1. 배경 — 왜 v12 인가

v11 까지의 동작:
- 다이얼로그에서 사이즈 1개 선택 (S/M/L/XL)
- 모든 페어 같은 사이즈 (파일명 `_NNmm` 있으면 override)
- aspect cell + MaxRects bin packing
- 1장씩 다 배치한 뒤 남는 공간은 작은 페어부터 cycling fill

문제점:
- aspect cell 때문에 실제 배치 개수가 입력 분포에 따라 ±10 흔들림 → 캡 약속 못함
- cycling fill 이 작은 디자인 위주로 돌아서 디자인별 분배 불공평
- `_placePhotoSticker` 가 호출될 때마다 Image Trace 재실행 → 같은 디자인 20번 들어가면 trace 20회 (메모리 위험 1순위)

v12 의 목표:
- per-design 최소 복사본 보장 규칙 도입
- "한 시트에 여러 사이즈 자동 섞기" 신규 모드 (Variety) 추가
- Image Trace 캐싱 + math-first planning 으로 trace 횟수와 메모리 압박 대폭 감소

## 2. 다이얼로그 모드 (6개)

| 모드 | 사이즈 | 파일명 mm override | 분배 규칙 |
|------|--------|---------------------|----------|
| **S only** | 모두 20mm | 무시 | per-design k = floor(cap_S / N) |
| **M only** | 모두 30mm | 무시 | per-design k = floor(cap_M / N) |
| **L only** | 모두 45mm | 무시 | per-design k = floor(cap_L / N) |
| **XL only** | 모두 60mm | 무시 | per-design k = floor(cap_XL / N) |
| **Mixed** | 페어별 다름 | 적용 (기본값 + override) | 1장씩 + cycling fill (현재 v11 동작) |
| **Variety** | 페어마다 여러 사이즈 | 무시 | descending round fill (큰 사이즈 → 작은 사이즈) |

선택 UI: 라디오 버튼 6개. Variety 선택 시에만 추가로 사이즈 셋 체크박스 활성 (`[XL][L][M][S]`).

기본 선택: M only.

## 3. Single-size 모드 (S/M/L/XL only) — per-design k 규칙

### 규칙

```
k = max(1, floor(cap / N))
```

- N = 입력 디자인 수 (`02_cutout/` 페어 수)
- cap = 사이즈별 정사각 셀 baseline (4번 섹션 참고)
- 각 디자인은 k 장 보장
- 베이스라인 (N × k 장) 배치 후 남는 공간은 cycling fill (작은 페어부터)

### 동작 예시 (M, cap = 20)

| N | k | 베이스라인 | 남는 공간 |
|---|---|-----------|----------|
| 1 | 20 | 20 | 0 |
| 3 | 6 | 18 | cycling 2장 |
| 5 | 4 | 20 | 0 |
| 7 | 2 | 14 | cycling 6장 |
| 20 | 1 | 20 | 0 |
| 25 | 1 | **20장만** | 5 디자인 미배치 ⚠️ |

### N > cap 처리

선택 (b) 채택 — **cap개만 1장씩 배치 + 나머지 leftover 알림에 표시**.
시작 시점에 거부하지 않음. 사용자가 결과 알림 보고 사이즈 키우거나 디자인 줄임.

### 차이점 (v11 cycling fill 과 비교)

- v11: 1장씩 → 남으면 작은 페어부터 cycling. 결과적으로 작은 페어가 더 많이 복제됨 (불공평)
- v12: k장씩 동등 분배 → cycling은 boundary 채움 용도만. 공평한 분배

## 4. 캡 산정 — 정사각 셀 baseline

A5 사용 영역 = (148 - 2×SAFETY_MM) × (210 - 2×SAFETY_MM - HEADER_ZONE_MM)
            = 144 × 188 mm (SAFETY_MM=2, HEADER_ZONE_MM=18)

| 사이즈 | 셀 + gap | 격자 | cap |
|--------|---------|------|-----|
| S 20mm | 22 × 22 | 6 × 8 | **48** |
| M 30mm | 32 × 32 | 4 × 5 | **20** |
| L 45mm | 47 × 47 | 3 × 4 | **12** |
| XL 60mm | 62 × 62 | 2 × 3 | **6** |

**핵심 인사이트**: 긴 변이 같으면 aspect cell 면적은 항상 정사각 셀 면적 이하. 따라서 정사각 cap 으로 약속하면 aspect packing 도 같거나 더 많이 들어감 (다만 packing 효율로 인해 가끔 정사각보다 적게 들어갈 수도 있음 — 5번 섹션의 fallback 참고).

## 5. Variety 모드 — descending round fill

### 알고리즘

```
활성 사이즈 = 사용자 선택 셋 (예: [L 45mm, M 30mm, S 20mm])  ← 큰 것 → 작은 것
디자인 = [d1, d2, ..., dN]

while 활성 사이즈:
    for size in 활성 사이즈:
        N개 디자인 모두 size 로 한 장씩 배치 시도 (math 시뮬레이션)
        성공: 모두 commit → size 유지
        실패: rollback (math 만) → size 영구 제거
    한 라운드라도 commit 못했으면 종료
```

### 3 디자인 예시 ([L, M, S])

| 라운드 | L 시도 | M 시도 | S 시도 | 누적 / 활성 |
|--------|--------|--------|--------|------------|
| 1 | ✓ 3장 | ✓ 3장 | ✓ 3장 | 9 / [L,M,S] |
| 2 | ✓ 3장 | ✓ 3장 | ✓ 3장 | 18 / [L,M,S] |
| 3 | ✗ 1개 부족 | ✓ 3장 | ✓ 3장 | 24 / [M,S] |
| 4 | — | ✗ | ✓ 3장 | 27 / [S] |
| 5 | — | — | ✗ | 27 / [] → 종료 |

### 선택 (a) strict rollback 채택

- 한 사이즈 라운드에서 N장 중 1장이라도 못 들어가면 그 라운드의 그 사이즈 통째 rollback
- 사용자 의도: "L 3장이 다 들어가야 commit" 라는 묶음 단위
- math-first planning 위에서 rollback 비용은 거의 0 (8번 섹션 참고)

### 사이즈 선택 UI

다이얼로그에서 Variety 선택 시 4개 체크박스: `[XL][L][M][S]`. 기본값 = `[L][M][S]` 셋. 사용자 마음대로 부분집합 가능 (예: `[L][S]` 만, 또는 `[XL][L][M][S]` 4개 다).

### Mixed 모드와의 관계

Variety 는 Mixed 와 별도 모드. Mixed 는 v11 그대로 (파일명 `_NNmm` override + 1장씩 + cycling). 사용자가 직접 사이즈를 지정하고 싶을 때 Mixed, 자동으로 큰 것부터 채우길 원할 때 Variety.

## 6. Mixed 모드 (v11 동작 유지)

- 파일명 `_NNmm` override 적용
- 다이얼로그 기본 사이즈는 override 없는 페어에만 적용
- 1장씩 배치 + cycling fill (현재 동작)
- per-design k 규칙 적용 안 함 (사이즈가 페어마다 달라서 cap 산정 애매)

이 모드는 v11 코드 그대로 유지하면서 trace 캐싱 + math-first planning 만 적용.

## 7. 성능 최적화 (모드 무관, 필수 전제)

### 7.1 Trace 캐싱

현재 `_placePhotoSticker` 가 호출될 때마다 Image Trace 새로 실행. 같은 디자인 N장 = trace N회.

목표: **Image Trace 호출 = unique designs 수만큼만**.

```js
function _ensurePairCutline(pair) {
  if (pair.cutlinePathData) return pair.cutlinePathData;
  var tempDoc = _newDocForImage();
  try {
    _traceAndUnite(tempDoc, pair.sil);
    var cutline = _findCutline(tempDoc);
    pair.cutlinePathData = _serializePathGeometry(cutline);  // anchor/segment 배열
    pair.aspect = ...;  // _measurePairAspect 도 같이 캐시
  } finally {
    tempDoc.close(SaveOptions.DONOTSAVECHANGES);
  }
  return pair.cutlinePathData;
}
```

이후 placement 는 캐시된 데이터로 path 를 직접 만든다 (`pathItems.add()` + `setEntirePath()`).

| 시나리오 | 캐싱 전 trace | 캐싱 후 trace |
|---------|--------------|--------------|
| 5 디자인 × M only (k=4) = 20장 | 20회 | 5회 |
| 5 디자인 × Variety 3 라운드 = 30~45장 | 30~45회 | 5회 |

### 7.2 Math-first planning

Variety 의 strict rollback 을 DOM op 으로 하면 위험: 이미 추가한 placedItem + cutline path 를 `remove()` 해도 ExtendScript undo stack 이 안 비워져서 메모리 누적.

해결: **DOM 작업 전에 math 만으로 시뮬레이션**.

```
Phase 1 (math only, 빠름):
  - bin packing 시뮬레이션으로 (pair, size, x, y) 튜플 리스트 확정
  - rollback 도 math 상에서만 (cost ≈ 0)

Phase 2 (DOM, 한 방향):
  - 확정된 리스트만 실제 placement
  - rollback 없음
```

이 패턴은 single-size 모드와 Mixed 모드에도 똑같이 적용 (DOM op 횟수 = 최종 commit 1회).

### 7.3 PSD embed 중복 완화

같은 PSD 가 30번 embed = raster 데이터 30번 복사. 1MB PSD × 30 = 30MB 부풀음.

완화책: 첫 embed 후 `placedItem.duplicate()` 사용. Illustrator 가 같은 raster 인스턴스를 참조하는지 100% 보장은 아니지만 새 embed 보다 빠르고 작음. 버전별 동작은 실측 필요.

### 7.4 임시 doc 재사용

현재 `_newDocForImage()` 가 페어마다 호출. trace 캐싱 도입하면 unique design 마다 1회만 호출되므로 큰 이슈는 아니지만, 가능하면 한 임시 doc 을 재사용 (페어 하나 처리하고 비우고 다음 페어).

## 8. 메모리 안전장치

- **Hard cap = 60 stickers per sheet**. A5 + 18mm 헤더에서 이론 최대 ~50–60장. 이 이상은 어차피 비현실적이고 Illustrator 가 불안정해짐.
- 매 placement 후 `app.redraw()` + `$.gc()` 호출 (이미 v11 에 있음, 유지).
- `app.userInteractionLevel = DONTDISPLAYALERTS` 로 dialog 누락 방지 (이미 있음).
- 임시 doc 은 항상 `finally` 블록에서 close.

## 9. v12 다이얼로그 (제안)

```
┌─ Everstory Name Included Sheet v12 ─────────────────────────┐
│                                                              │
│  고객 이름:  [ Mina                                       ]  │
│                                                              │
│  헤더 정보                                                   │
│    재질:    [ White                                       ]  │
│    날짜:    [ 2026-05-01                                  ]  │
│                                                              │
│  레이아웃 모드                                               │
│    ( ) S only                                                │
│    (•) M only       ← 기본                                   │
│    ( ) L only                                                │
│    ( ) XL only                                               │
│    ( ) Mixed (파일명 mm override)                            │
│    ( ) Variety (큰 사이즈부터 자동 섞기)                     │
│                                                              │
│  Variety 사이즈 (Variety 모드일 때만 활성):                  │
│    [ ] XL    [✓] L    [✓] M    [✓] S                         │
│                                                              │
│  칼선 여백:  (•) 1mm   ( ) 2mm                               │
│                                                              │
│  헤더 18mm — 좌측 이름, 우측 ORDER DETAIL.                   │
│  이름 스티커는 생성하지 않습니다.                            │
│                                                              │
│                                       [ 취소 ]  [ 생성 ]     │
└──────────────────────────────────────────────────────────────┘
```

## 10. 구현 단계 (권장 순서)

1. **Phase 1 — 성능 최적화 (모드 추가 없이)**
   - trace 캐싱 (`_ensurePairCutline`)
   - math-first planning (현재 single-size 동작도 2-phase 로 리팩터)
   - 기존 모드 동작 동일성 검증
   - 같은 입력으로 v11 vs Phase 1 trace 횟수 비교 (로그)

2. **Phase 2 — Single-size 모드의 per-design k 규칙**
   - 현재 다이얼로그는 그대로, 내부 분배 로직만 교체
   - Mixed 모드는 v11 동작 유지

3. **Phase 3 — Variety 모드**
   - 다이얼로그에 Variety 라디오 + 사이즈 체크박스 추가
   - descending round fill 알고리즘 구현 (math-first 위에서)
   - hard cap 60 적용

4. **Phase 4 — CLAUDE.md / product_mvp_photo_sheet.md 업데이트**
   - Variety 모드 설명 추가
   - 새 분배 규칙 명시

각 Phase 끝에서 Illustrator 실측 (한글 폰트, 다양한 aspect 입력, N=1/3/5/7/20/25 케이스).

## 11. 미해결 / 추후 결정

- **Variety 의 사이즈 체크박스 기본값**: 현재안은 `[L][M][S]`. 실제 운영하면서 조정.
- **PSD duplicate vs 재 embed** 의 메모리 차이: Illustrator 24 + macOS 에서 실측 필요. 차이 미미하면 그냥 재 embed 로 단순하게 유지.
- **Variety 모드에서 한 사이즈만 선택했을 때**: 단일 사이즈 모드와 동작 동일. 굳이 막을 필요 없음.
- **`_serializePathGeometry` 의 정확한 직렬화 포맷**: PathPoint 배열만 저장하면 되는지, anchor + leftDirection + rightDirection 까지 저장해야 곡선 보존되는지 실측. 다이컷은 곡선이 많으므로 보존 필수.
- **Mixed 모드에 Variety 와 비슷한 cap/k 규칙을 적용할지**: 현재는 안 하지만, 사용자 요청 들어오면 페어별 cap 가중 평균으로 산정 가능.

## 12. 변경되지 않는 것 (regression 가드)

- `info > a5_border` 기준 영역 계산
- 헤더 18mm + 좌측 이름 + 우측 ORDER DETAIL 레이아웃
- `PrintData` / `KissCut` 레이어 z-order
- `CutContour` 스폿 색상 (M=100, SPOT)
- 파일 저장 안 함 (검수 전용 프로토타입)
- `_traceAndUnite` 의 Image Trace 파라미터 (threshold 230, pathFidelity 10, etc.)
- 칼선 여백 옵션 (1mm / 2mm)

이 항목들은 v12 에서도 동일해야 한다. 회귀 발생 시 우선순위 1로 수정.
