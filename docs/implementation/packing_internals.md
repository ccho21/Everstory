# Everstory_mixed.jsx 내부 구현

`Everstory_mixed.jsx` (v19 uniform grid) 와 `Everstory_mixed_v2.jsx` (v20 v2 브랜드 템플릿) 의 packing 알고리즘, 사이즈별 cap, 함수 매핑. v2 는 v1 의 superset (packing/cap 룰 동일, 차이는 템플릿/헤더 처리뿐).

## 사이즈별 셀/cap 표 (A5 body 148×195, padding 0, gap 1.5mm)

| Letter | 인치 | mm | 셀 수 | 디자인 cap |
|--------|------|------|-------|-----------|
| XS | 0.75" | 19.05 | 63 | 13 |
| S | 1" | 25.4 | 35 | 7 |
| M | 1.25" | 31.75 | 20 | 5 |
| L | 1.5" | 38.1 | 12 | 3 |
| XL | 1.75" | 44.45 | 12 | 3 |
| XXL | 2.5" | 63.5 | 6 | 1 |
| Mixed | 2.5/1.75 + 1.25/1" | hero row 2.5×1+1.25×4 stack / 1.75×3 / 1×5 행 ×3 ≈ 23슬롯 | — | 1 |

v2 템플릿은 `body` 142×175mm 라 슬롯이 약간 줄지만 packing/cap 룰은 동일.

## 디자인 cap (auto-cap)

- 사이즈 변경 시 cap 갱신, ListBox 선택이 cap 초과면 자동 trim
- 룰 도출: 디자인 시트당 최소 4-5회 등장 보장 + uniform grid 슬롯 기준 (`SLOTS_BY_SIZE` 표는 정사각 셀 + gap 1.5mm baseline)
- 초기 선택은 cap 까지 자동 채움 (운영 편의)

## Uniform grid 룰 (단일 사이즈 모드, v19)

- 적응형 직사각 셀: `cellBoxW = max(pair.cellW)`, `cellBoxH = max(pair.cellH)`. 모든 페어 정사각이면 `sizeMm × sizeMm`. 한 방향 aspect (모두 가로 / 모두 세로) 면 짧은 변이 줄어들어 슬롯 늘어남
- `cols = floor((binW + gap) / (cellBoxW + gap))`, `rowsCount = floor((binH + gap) / (cellBoxH + gap))`. `slots = cols × rowsCount`
- 시각 간격: `hSpace = (binW - cols × cellBoxW) / (cols + 1)`, `vSpace = (binH - rowsCount × cellBoxH) / (rowsCount + 1)`. 외곽 4면 = 내부 모든 gap 동일
- 슬롯 채우기: `placed[k] = layoutPairs[k % designCount]` 행 우선 round-robin. `slots mod D` 개의 보너스가 앞쪽 디자인에 배정 (전체 시트가 같은 디자인 순서로 보임)
- `leftover` 항상 0 — 격자 슬롯에 round-robin 이라 못 들어가는 케이스 없음
- Mixed 모드는 zone packer (`_packMixedZones`) 별도 — uniform grid 룰 미적용

## Mixed 모드 zone packer

`_packMixedZones`:
1. **hero row** = 2.5"×1 + 옆에 `MIXED_HERO_STACK` (1.25" 2×2 grid) compound item — 64.5×64.5mm 가 hero 높이(63.5mm)와 거의 매칭
2. 다음 row 부터 `MIXED_FIXED_PATTERN` 의 1.75"×3 배치 + `_fillMixedRowBalanced` 가 행 끝 빈 폭에 1.25/1" horizontal filler
3. 그 아래 `_appendMixedFillerRows` 가 used-area 기준으로 1.25" 또는 1" 단일 사이즈 row 를 vertical fit 까지 누적

시트 면적 fill ~85%. stack item 은 `_shelfRowsToPlaced` 가 cols×rows 로 expand 하면서 vertical center 정렬.

## 행 정렬

- **단일 사이즈 (uniform grid, v19)**: 모든 셀 동일한 cellBoxW × cellBoxH. 외곽 4면 여백 = 내부 모든 gap = `hSpace`/`vSpace`. 행마다 hGap 변동 없음, 마지막 행도 동일 디자인 순서 유지
- **Mixed (per-row + 세로 justify)**: 행마다 outer L = inner = outer R = `(binW - ΣitemW) / (n+1)`, 시트 전체 outer top = row gap = outer bottom = `(binH - ΣrowH) / (R+1)`. 행마다 가로 gap 다름 (행 안 사진 수에 따라)
- 시각 spacing 은 binW/binH 와 cellBox 만으로 자동 계산. 단일 사이즈는 사용자 gap 입력 없음 (uniform grid 자동 분배). Mixed 는 내부 `GAP_DEFAULT_MM = 1.5mm` 고정

## v2 헤더 처리

`Everstory_mixed_v2.jsx` 는 `info > header > header_right` TextFrame 의 `.contents` 만 inplace 교체. 폰트·사이즈·우측 정렬은 .ait 가 보유, 라벨/로고/푸터는 정적.

우측 정렬 2줄:
```
{N} photos * {sizeLetter} / {inch} / {cut}mm  *  {material}
Name add-on * Order date {date}
```

고객명/주문번호는 다이얼로그에 남지만 파일명·메타용으로만 사용 (헤더에 안 들어감).

## trace 실패 처리

- `_buildCutlineCache` 가 fail 한 페어의 base 들을 set 으로 모아 placement 시도 자체를 skip
- `_buildCutlineCache` 또는 `_placePhotoSticker` 에서 throw → `failedItems` 에 push → 결과 알림에 포함. 해당 셀은 PSD 만 남고 cutline 없음
- 결과 알림에는 base 별 dedupe 된 1줄 + skip 된 placement 수 안내. IL 재시작 후 재시도 권장 메시지 포함

## z-order

위에서 아래: `KissCut` → `info` (템플릿 유지) → `PrintData` (+ trace 중에는 hidden `TraceStash` 임시 레이어, 끝에 제거).

## 저장

결과 메시지 직전에 `03_output/` 으로 자동 saveAs (Illustrator 24 호환 + PDF 호환). 입력 폴더가 `02_cutout` 이 아니면 동일 폴더에 저장.

## 함수 매핑

| 함수 | 역할 |
|------|------|
| `_collectPairs` | `02_cutout/` 에서 페어 수집, base 이름 정렬 |
| `_showDialog(pairs, defaultName)` | ListBox multiselect + auto-cap. 사이즈 변경 시 cap 갱신, 선택 자동 trim. `defaultName` 으로 고객 이름 input 초기화 |
| `_deriveDefaultCustomerName` | inputFolder 또는 그 부모 폴더명을 다이얼로그 default 고객 이름으로 추출 (`02_cutout` 폴더면 부모 폴더 사용) |
| `_measurePairAspect` | 페어별 sil.png aspect 1회 측정 후 캐시 (`pair.aspect`) |
| `_itemForSize` | Mixed 모드에서 한 페어를 사이즈별 packItem (44.45/38.1/31.75/25.4mm) 으로 즉석 생성 |
| `_buildMixedItems(pair)` / `_mixedTotalSlots` / `_mixedSpecString` / `_mixedHumanString` | `MIXED_PATTERN` 기반 헬퍼 — 패턴 변경 시 자동 반영 |
| `_uniformGridPack(layoutPairs, binW, binH, gap)` | **단일 사이즈 모드 메인 packer (v19)**. 적응형 직사각 셀 (max cellW × max cellH) 위 cols × rows 격자 산출, 외곽 4면 = 내부 gap 자동 균등, 모든 슬롯 round-robin 채움 |
| `_appendShelfRowsOnce` | items 를 cycle 없이 한 번씩만 row 에 누적. Mixed 모드에서 사용 |
| `_shelfRowsToPlaced(rows, binW, binH, gap)` | Mixed 모드 row → placed 변환. per-row 가로 justify (outer L = inner = outer R), 세로 justify (outer top = inner = outer bottom). final body 좌표 직접 출력 |
| `_shelfPack` / `_resolveMinRepeat` / `_sortedPairsForShelf` / `_buildShelfFillItems` | v18 까지의 단일 사이즈 packer. v19 부터 dead path (회귀 비교용으로 보관) |
| `_resolveTemplate` | `$.fileName` 기준 상대경로로 .ait 자동 발견 |
| `_findInfoPath` | `info` 레이어 안 임의 이름 PathItem 검색 (`body` / `header`) |
| `_buildCutlineCache` | unique pair 마다 1회 Image Trace, hidden `TraceStash` 레이어에 캐시 |
| `_placePhotoSticker` | cached cutline `duplicate()` + PSD embed + 정규화 좌표 정합. trace cache 없으면 throw |
| `_traceAndUnite` | Image Trace + Pathfinder Add + expandStyle (cache 빌드용 임시 doc 안에서) |
| `_stripPSDPaths` / `_stripEmbeddedPSDPathsNear` | embed된 PSD 의 saved path 재귀 제거 (clipping mask 보존) |
| `_ensureCutContour` / `_forceCutContourStroke` | `CutContour` 스폿 색상 일관성 |
| `_drawProductionHeader` | v1 전용. `info > header` 안에 좌측 고객 이름 + 우측 ORDER DETAIL 그리기 (v2 는 .ait 정적 + `header_right` 주입으로 대체) |
| `_buildOrderDetail` | TYPE/SPEC/ORDER + MATERIAL/PHOTOS/DATE 6쌍 메타 |
| `_resolveOutputFolder` | `02_cutout` → sibling `03_output` 자동 생성, 그 외엔 입력 폴더 |
| `_timestamp` / `_saveAi` | `YYYYMMDD_HHMMSS` 타임스탬프 + Illustrator 24 + PDF 호환 saveAs |

## 알려진 한계 (내부 구현)

- **uniform grid 효율** — 단일 사이즈 모드는 정사각 셀 baseline (gap 1.5mm 기준, `SLOTS_BY_SIZE` 표 그대로). 적응형 직사각이라 모든 art 가 한 방향 (가로/세로) 이면 슬롯 더 들어가고, aspect 가 섞이면 이론치 그대로. Mixed 모드는 zone packer (~80%)
- **uniform grid 슬롯 분배** — `slots = cols × rows`. `slots mod D` 개의 보너스가 앞쪽 디자인에 배정 (round-robin 첫 사이클이 그만큼 더 길어짐). leftover 발생 안 함 — 모든 슬롯 채움 보장
- **trace cache scope** — 시트당 unique 페어 1회 trace, hidden `TraceStash` 레이어에 캐시 후 끝에 제거
- **회전 비활성** — uniform grid / shelf packing 시 90° 회전 안 함. 스티커 방향 의도 보존
