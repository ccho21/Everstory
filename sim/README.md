# sim — `Everstory_mixed.jsx` 배치 검증 하니스

Illustrator 를 켜지 않고 **배치 로직만** node 로 돌려본다.
`.jsx` 에서 패커 함수·상수를 **텍스트로 추출**하므로 손으로 베낀 사본이 없고,
따라서 실코드와 드리프트할 수가 없다.

## .jsx 를 고쳤으면 이것부터

```bash
cd sim && node extract.js ../Everstory_mixed.jsx packer.js && node hoisttest.js && node nametest.js && node decotest.js && node modetest.js && node ordertest.js && node regress.js
```

`extract.js` 를 먼저 안 돌리면 **낡은 `packer.js` 로 테스트가 통과**한다. 실제로 여러 번 당했다.

별도 `Everstory_range.jsx`의 출력 검증은 저장소 루트에서 `node sim/range_output_test.js`로 실행한다.
매번 실제 소스를 임시 폴더에 추출하며, 칼선 위치·크기 보정, 보정 후 재측정, 사진별 실제 생성 수량,
오류 시 저장 차단을 검사한다. Illustrator 호출은 모의 구현이므로 실제 Adobe 출력·인쇄 검증을 대신하지 않는다.

이름 + 데코는 `node sim/range_name_test.js`로 검증한다 — v3 엔진이 이름을 위 가운데에 두고, 전신 사진이 있으면 양옆에 세우며(flank), 데코를 행의 남는 폭에 행당 ≤ 2 로 넣는지, 이름이 없으면 데코도 없는지. 이름 spec(한글·긴 이름) 도 여기. 글자 엔진은 mixed 복사본이라 `nametest.js` 가 덮는다.

현재 Range 배치(v3 면적 등급 행 조판)는 `node sim/range_layout_test.js`로 검증한다.
셀 = 면적 등급 식(w=√(A·a), h=√(A/a), 최장변 상한), 사진별 최소 수량·개수 차이, Small 은 사진마다 두 등급, 사진·데코·이름 간격,
행 아랫선 정렬·양끝 맞춤, 데코 행당 ≤ 2, 이름 위 가운데, 결정론, 입력 불변, 계획 오류 차단을 실제 최신 소스에서 검사한다.
`range_block_test.js`(블록 조판, 2026-09-08~12) 는 v3 로 바뀌며 `~/.Trash/everstory-cleanup-2026-09-12/backup-2026-09-13/` 으로 옮겼다.

`labeltest.js` 만은 예외다 — `Everstory_address_labels.jsx` 를 검증하고, **추출을 자기가 직접**
임시 폴더에 한다. 저장소에 사본이 남지 않아 낡은 사본으로 통과할 수가 없다. 그냥 `node labeltest.js`.

## node 로 못 보는 것 — Illustrator 실행 검증

여기 하니스는 **순수 계산만** 본다. 실제로 도형이 그려지는지(`textFrames`·`pathItems`·스팟
색·export)는 Illustrator 를 띄워야 안다. 다이얼로그 없이 돌리는 방법:

각 `.jsx` 는 `$.global.__EVERSTORY_*_TEST__` 훅을 본다 — 이게 있으면 다이얼로그 대신 그
값을 옵션으로 쓰고, `alert` 대신 `lastMessage` 에 쓴다. 래퍼에서 훅을 세팅하고
`$.evalFile` 로 본체를 부른 뒤, 그려진 결과를 **실측해서** 기대 격자와 대조한다.

```bash
osascript -e 'set js to (read POSIX file "/path/wrapper.jsx" as «class utf8»)' \
          -e 'tell application "Adobe Illustrator" to do javascript js'
```

- **"에러 안 났다" 로 끝내지 말 것.** `geometricBounds` 를 mm 로 환산해 기대값과 비교해야
  의미가 있다 (2026-08-24 에 주소 라벨 12칸을 이렇게 0.05mm 오차 내로 확인했다).
- **크래시는 반환값이 없다.** 죽는 지점을 찾을 땐 단계마다 로그 파일에 쓰고 닫아서
  (플러시) 마지막 줄을 본다.
- 한글 경로(`포토샵누끼`)는 NFC/NFD 때문에 `File()` 에서 새는 수가 있다 — 래퍼는
  ASCII 경로에 복사해 두고 부르면 그 부류를 통째로 피한다.
그래서 `extract.js` 는 생성 직후 **자기검사**를 해서, 아래 심볼 목록에 빠진 게 있으면 즉시 실패한다.

```
❌ 추출 누락 — extract.js 의 FNS/VARS 에 추가할 것: LETTER_UNIT_TIGHT_STEPS_MM
```

새 함수·상수를 만들었는데 이 메시지가 나오면 `extract.js` 의 `FNS` / `VARS` 배열에 이름을 추가한다.

## 파일 지도

### 추출기 — 실코드를 node 모듈로 바꾼다

| 파일 | 역할 |
|---|---|
| `extract.js` | **손으로 고른 심볼만** 뽑아 `packer.js` 생성. 가볍고 빠름. 대부분의 테스트가 이걸 쓴다 |
| `extract_all.js` | **최상위 심볼 전부** 뽑는다. 의존 목록 관리가 필요 없어 새 테스트에 안전 |

### 매번 돌려야 하는 검증

| 파일 | 무엇을 지키나 | 실패하면 |
|---|---|---|
| `hoisttest.js` | 최상위 `var` 상수가 메인 플로우 **위**에 있는지 + 중복 `var`/함수 + 미선언 | ExtendScript 는 함수만 호이스팅한다 → 상수가 `undefined` 로 조용히 죽는다 |
| `nametest.js` | 이름 스티커 — 단어별 줄바꿈, 간격 비율, 유닛 하이브리드, 행 오른쪽 끝 정렬, 이름 아래 채움, **겹침·시트밖** | 이름이 안 나오거나 사진과 겹친다 |
| `modetest.js` | 이름이 **Package 외 모드**(단일·전 사이즈)에서도 나오는지, evict 비용, 전 사이즈 "각 사이즈 ≥1장" 보장 | 그 모드에서 이름이 조용히 무시된다 |
| `ordertest.js` | `_order.json` → 다이얼로그 프리필. `job` 블록 경로와 SKU 폴백 경로가 같은 값을 내는지 **python `build_job` 을 실제로 호출해 교차 검증** (`python3` 필요) | 두 해석기가 갈라져 잘못된 재질·사이즈로 인쇄된다 (재제작 = 원가 100%) |
| `regress.js` | 단일/전 사이즈 = **바이트 동일**, Package = 변화 방향(컷↑ 잔여↓) | 무관한 배치가 흔들렸다 |
| `cachetest.js` | 칼선 디스크 캐시 포맷 왕복 + 무효화 + 손상 내성 | 캐시가 깨진 칼선을 재사용한다 |
| `labeltest.js` | 주소 라벨 격자 — 칸 겹침·시트 밖·급지 선단 여백·부분 인쇄 칸 배정 + `intake.py --labels` 왕복 | 주소가 칼선에 걸리거나 엉뚱한 칸에 찍힌다 |
| `verify_impl.js` | Package 3버킷 배분층 (레거시 호환·배타성·누락 0) | 디자인이 시트 배분에서 사라진다 |
| `plugin_bucket_test.js` | UXP 플러그인의 버킷 파싱·NN 카운트 정규식. `plugins/everstory_save/main.js` 에서 실코드를 추출 (UXP 는 node 로 못 돌린다) | Phase A 가 파일명 버킷을 잘못 읽는다 |

### 진단 도구 — 필요할 때만

| 파일 | 쓸 때 |
|---|---|
| `rowdump.js` | 시트에 빈 구간이 보일 때. 행별 tier·높이·컷 수·잔여 폭을 덤프한다 |
| `pkg_bucket_sim.js` | 인치 사다리 정책을 바꿔볼 때. 후보별 충전율 비교 |
| `bench.js` | 배분층이 느려졌거나 메모리가 새는지 볼 때 |

## 생성물 — 커밋하지 않는다 (`.gitignore`)

`packer.js` · `packer_full.js` · `packer_new.js` · `packer_old.js`

전부 추출기가 만든다. **편집하지 말 것** — 다음 추출에서 통째로 덮어쓴다.
지워도 안전하고, 위 명령 한 줄이면 다시 생긴다.

## 데이터·기준본

- 배치 데이터 = `projects/Package Full/02_cutout` 16디자인의 PNG IHDR 실측 aspect,
  그리고 하린 25디자인. 테스트 안에 숫자로 박혀 있어 프로젝트 폴더가 없어도 돌아간다.
- `baseline/before_multisheet.jsx` = `regress.js` 의 "변경 전" 기준본. multi-sheet 개편 **직전**
  스냅샷이라 어떤 커밋과도 일치하지 않아 파일로 둔다.
  예전엔 세션 임시폴더(`/private/tmp`)를 가리켜서, 그게 지워지면 회귀가 통째로 죽었다.

## 함정

- **`extract.js` 의 심볼 목록은 수동이다.** 빠뜨리면 낡은 사본으로 통과하거나 뒤늦게
  `ReferenceError` 가 난다. 자기검사가 이제 잡아주지만, 오탐 규칙을 알아둘 것 —
  앞에 `.` 이 붙으면 속성 접근(Illustrator enum), 뒤에 `:` 이면 객체 키다.
- **`P.PKG_COUNT_BY_TIER = {...}` 로 재대입하면 안 된다.** export 속성만 갈리고 모듈 내부
  `var` 는 원본을 계속 참조해서 실험이 조용히 무효화된다.
  반드시 `P.PKG_COUNT_BY_TIER[t].max = ...` 제자리 변형 + 제자리 복원.
- 추출은 **2-space 들여쓰기 IIFE 규약**(`  function name(` … `  }`)에 의존한다.

## 시뮬로 확정한 것

- 시트 수는 2가 전 구간 최적. 3시트는 평균 충전 -9~14%p, 최저 시트 25~48%.
- 반복 max cap 은 병목이 아님 (×1.5 에서 +0.6%p 후 포화). 잔여 여백은 패커 기하 한계.
- 인치 사다리 가중이 실제 레버 (16디자인에서 67.3% → 72.5%). 자동 선택 비용 0.7ms.
- 고아 행 채움 게이트 확대 → 누리 25디자인 충전 65/76% → 78/81%, 최악 잔여 106→38mm.
- 심볼 전환으로 디자인당 네이티브 6.8→2.65MB. `pdfCompatible=false` 로 추가 -52%.
- 이름 스티커: 한 단어 6글자까지 히어로 옆 9.5mm 유지, 그 이상은 유닛 자동 축소.
  이름 아래 빈 공간 채움으로 Package 16디자인 2시트에서 사진 3장 추가.

## 정리 기록 (2026-08-24)

패커 튜닝 때 쓴 1회성 실험 16개(`_sw_*` · `_tmp_*` · `proto*` · `diag*` · `sweep` ·
`extract_regress` · `realcache` · `packer_proto*`)를 삭제했다. 결론은 전부 `regress.js` 회귀와
위 "시뮬로 확정한 것"에 남아 있다. 되살리려면 그 직전 커밋에서 꺼내면 된다.

## Range v3 — "같은 면적" 행 조판 (2026-09-13, 사용자 결정)

긴 변 기준(v2 블록 조판)에서는 전신(9:16) 사진이 12mm 조각이 되고 얼굴·상반신 누끼만 커 보였다(사용자 지적). 그래서 크기의 뜻을 바꿨다:
**"1″" = 1×1인치 면적(645mm²)**, 셀은 사진 비율대로 `w=√(A·a)`, `h=√(A/a)`, 최장변 상한 `RANGE_LONG_CAP_MM`(Small 2″ 확정, Large 3″ 가정).
정사각 사진은 예전과 같고 전신 사진은 세로로 길어진다 (Sanvi 전신: 12×32 → 19.4×50.8mm).

엔진(`_packRange` → `_rangeSearch` → `_rangeCompose`): 타입 = 디자인 × 등급 → 높이군 2개(등급별로 시작, 이상치는 중앙값이 가까운 군으로) →
행 = 한 군의 타입으로 채움(아직 없는 타입 먼저 → 장수 적은 디자인 먼저, 행 아랫선 정렬, **양끝 맞춤**, 행 채움 하한 `RANGE_ROW_FILL_MIN`) →
이름이 있으면 위 가운데에 두고, 이름 중간 높이까지 오는 세로 셀이 있으면 **양옆에 세운다**(flank) → 데코는 행에 자리를 예약해 넣는다(행당 ≤ 2, 양끝·가운데 번갈아).
탐색 = (flank) × (위 군 행 수) × (아래 군 행 수) × (데코 분배 5종) × (위 군 행 높이 상한 2종) 완전 열거, 우선순위 = 두 등급 미배정 ↓ → flank → 데코 부족 ↓ → 사진 ↑.
정상 규칙(사진별 ≥ 2, 차이 ≤ 2, 행 채움 ≥ 0.7)으로 아무 조합도 없으면 **완화 규칙**(≥ 1, ≤ 3, ≥ 0.5)으로 다시 찾고 `relaxed` 를 메시지 ⚠ 로 낸다 — Large 의 큰 셀에서 자주 그렇다.
Node 실측(2026-09-13, Sanvi 4장): Small 이름 있음 = 사진 18(3/5/5/5) + 데코 6 + 전신 2장 이름 양옆, 채움 58% · 이름 없음 = 22장 76%.
**Large 는 1.5″²/2″² 셀이 142mm 폭에 비해 커서 4디자인이면 8~12장, 두 등급을 다 못 넣는 사진이 생긴다** — Large 규칙(면적 등급 축소 / 두 등급 포기 / 2시트)은 미결.
블록 조판·랩 dense 이식·비율 가중 맞바꿈·작은 이름 격자·칸 비우는 데코(`_rangeDecorate`)는 전부 뺐다 (백업: `~/.Trash/everstory-cleanup-2026-09-12/backup-2026-09-13/Everstory_range_v2_blocks.jsx`).

## 디자인 랩 (Small/Large 시안 러너) — 운영 테스트와 별개

`prototypes/Everstory_layout_test.jsx` 는 실제 템플릿 위에 masonry/dense 배치 + 큰 레터 이름 + 작은 이름 + 데코 + KissCut 까지 만드는 **시안용 러너**다.
운영 경로가 아니다 — 여기서 확정한 규칙을 `Everstory_range.jsx` 로 옮기는 것이 순서다.

| 파일 | 역할 |
|---|---|
| `export_illustrator_layout_test.js` | 엔진 4개 + `illustrator_layout_test.template.jsx` + `layout_test_workflow.js` 를 묶어 러너 `.jsx` 재생성. 엔진을 고쳤으면 이걸 먼저 |
| `large_layout_engine.js` · `large_ratio_layout_engine.js` · `large_dense_layout_engine.js` · `large_masonry_layout_engine.js` · `large_photo_geometry.js` | 비율 기반 크기 배정 · 균등 반복 · masonry / 두 구간 dense 배치 (ES3) |
| `large_*_layout_test.js` · `layout_engine_test.js` · `layout_test_workflow_test.js` · `layout_kisscut_test.js` | 위 엔진·워크플로·칼선 프리플라이트 검사 |
| `run_large_dense_test.jsx` · `run_layout_kisscut_test.jsx` | Illustrator 실행 배치 (dense 3종 / KissCut 통합) |
| `update_large_dense_review.js` | `docs/reports/template-layout-build-2026-09-08/large-layout-review.html` 갱신 |

## 정리 기록 (2026-09-12)

기준: "받았을 때 예쁘고 완성도 높은 시트" 에 안 맞는 것 — 채움률·개수 연구(09-06 `package_*`, 09-07 `range_ordered_preview`·`range_fill_test`·`baseline/range-before-blocks.jsx`, 09-08 `range_block_review`·`range_deco_preview`), 고정 격자 컨셉 C(`business_*`·`sheet_layout_concepts.py`·`run_business_layout_in_illustrator.jsx`), 1.5/1.75″ 연구(`large_two_size_analysis.js`), 구 러너 배치(`run_large_layout_test`·`run_large_ratio_test`·`run_large_masonry_test`·`update_large_layout_review`) —
를 `~/.Trash/everstory-cleanup-2026-09-12/sim/` 로 옮겼다(원경로 미러, 휴지통 비우기 전 복구 가능). 결론은 `docs/reports/range-block-implementation-2026-09-08/` 와 이 문서의 "시뮬로 확정한 것" 에 남아 있다.

## Composed — 사진 6장 구성 시트 (v2, 2026-09-16)

`Everstory_range.jsx` 의 세 번째 옵션(다이얼로그 기본값). 순수 엔진은 `node sim/range_composed_test.js` 로 검증한다 —
인치 사다리의 긴 변(2.5·2·1.5·1.25·1·0.75″)·짧은 변 하한·면적 배분 장수·슬롯 라운드로빈·칼선 비율 산출·손상 캐시 거부·
셀 = 사진 + 2×rim·간격 1.5mm·결정론·입력 불변·검증기 음성 케이스를 실제 주문 5건과 합성 4종으로 돌린다 (45 검사).

**v1 에서 바뀐 것과 이유** (첫 실물 시트를 재서 나온 것들 — 되돌리지 말 것):

| v1 | 문제 | v2 |
|---|---|---|
| 역할×등급 **목표 면적** (refAspect 0.73) | 비율 0.38 전신의 2.5″ 가 긴 변 88mm → 상한 80mm 로 잘림 | 인치 = **긴 변** (`_tierBox` 규약). 2.5″ = 언제나 63.5mm |
| 코어 = 사진×3등급 = **18장 고정** | 정사각 사진이면 큰 등급이 면적을 다 먹어 작은 등급이 통째로 누락(하린 11/24) | 등급별 장수 = **면적 배분** + 시트 예산 초과분은 큰 등급부터 감산 |
| 앵커(고정 비율 좌표) 근처 배치 | 앵커 피치(≈42mm)와 실제 셀 폭(26~31mm)이 안 맞아 폭 10~12mm 죽은 채널이 생김 | **큰 것부터** — 앞 6장은 서로·이름·시트 모서리에서 가장 먼 자리, 나머지는 밀착 |
| 셀 = 칼선 박스 (rim 없음) | 윤곽 실거리 최소 1.5mm → 1mm 오프셋하면 이웃과 0.5mm 겹침 | 셀 = 사진 + 2×rim. 칼선끼리 3.5mm → 1mm 오프셋 후 정확히 1.5mm |
| 변형 20판 비교 | 후보 검사 228k · Illustrator 12.3s | 한 판(결정적) + 채움 조각은 격자 후보 없음 → 31k · **Illustrator 1.1s** |

Illustrator 실측(Sanvi 6장, rim 1mm): 2.5″=24.2×63.5 · 2″=39.8×50.8 · 1.5″=38.1 — **계획 대비 오차 0.000mm**,
칼선끼리 최소 3.50mm, 전체 실행 4.5s.

### 사진 종류 → 크기 범위 (2026-09-16)

크기 범위는 **사진 종류**가 정한다 (`COMPOSED_SHOT_TYPES`, 사용자 확정):
얼굴 0.75~1.5″ · 상반신 1~2″ · 전신 **1.25**~2.5″ · 커플·단체 2~2.5″ · 반려동물 얼굴 0.75~1.25″ · 반려동물 전신 1.25~2.5″.
(전신은 처음 1.5″ 부터였는데 1.5″ 에 몰려 같은 크기 인물만 늘어서서 1.25″ 로 내렸다. 커플·단체는 드물어 손대지 않는다.)
근거는 인쇄된 얼굴 높이 실측이다 — 얼굴 누끼는 2″ 에서 얼굴이 26~34mm 로 튀고, 전신은 0.75″ 에서 1.4~3.2mm 로 안 보인다.

- **판별**: `scripts/face_probe` 앱(macOS Vision)을 Illustrator 가 `File.execute()` 로 띄운다. 얼굴 높이 ÷ 칼선 높이 ≥ 40% 얼굴 ·
  20~40% 상반신 · 20% 미만 전신, 얼굴·사람 박스가 2개 이상이면 커플·단체. 실주문 사람 사진 24장이 전부 맞게 갈린다(테스트에 고정).
  반려동물·얼굴 없는 사진은 확인 창에서 운영자가 고른다. 결과와 확정값은 `_cutcache/*.evface`.
- **장수 계획** (`_composedPlanSlots`): ① 메인 = 자기 범위의 최대 등급 ② 시트 최대 등급이 더 크면 다른 사진에 1장
  ③ 사진마다 최소 2장 → 쓸 수 있는 등급마다 1장 ④ 레퍼런스 면적 비중에 가장 모자란 등급부터, **가장 적게 나온 사진**에게.
  고정 개수·라운드로빈은 버렸다 — 종류가 섞이면 몸 사진은 1장, 얼굴은 5~6장으로 쏠렸다(시뮬 [1,6,1,5,1,5]).
- **범위 안 비중** (`_composedWindowProfile`): 레퍼런스 면적 비중을 사진마다 자기 범위에 다시 펼친다(범위 양끝 = 레퍼런스 양끝).
  사다리 기준으로 잘라 쓰면 전신 범위에선 하한 등급이 면적 55% 를 가져가 한 크기로 몰렸다(전신 6장 → 13장 중 11장이 1.5″).
  균형 단계의 둘째 장도 늘 작은 등급이 아니라 그 사진 범위에서 가장 모자란 등급으로 준다. 지금 전신 6장 → 2.5/2/1.5/1.25 = 2·2·3·7.
- **같은 사진 간격**: 추가 사진은 같은 사진과 40mm, 면적 배분(④) 조각은 30mm 안쪽 자리를 받지 않는다(④ 조각은 그러면 건너뜀 —
  누락이 아니다). 근접 벌점 dup 2→4. 없으면 시트가 꽉 찰 때 같은 얼굴이 나란히 붙었다(실측 20mm).
- **배치 재시도**: 빠진 슬롯이 있으면 먼저 ④ 의 마지막 조각을 1·2장 빼고, 그래도 안 되면 분산 장수를 6 → 3 → 0 으로 줄인다.
  곧장 분산을 줄이면 작은 얼굴이 한곳에 뭉쳤다.
- 시뮬(흔한 조합 8개, 실주문 사진): 얼굴6 25장 · 얼굴4+상반신2 19 · 얼굴3+전신3 19 · 각 2장 20 · 얼굴1+상반신2+전신3 17 ·
  상반신4+얼굴2 20 · 상반신2+전신4 15 · 전신6 14 — **전부 누락 0, 같은 사진 최소 32mm 이상**.
  커플·단체 위주 주문은 큰 조각뿐이라 장수가 적다 — 표의 2~2.5″ 가 정한 결과다.
- Illustrator 실측(2026-09-16, 최종): Sanvi 15장 · EVS-1007 19장, 판별 캐시 6/6, 칼선 오차 0.000mm, 칼선 간격 3.50mm,
  같은 사진 최소 34~35mm. 처음 판별(캐시 없음)은 0.49~0.62s(PSD 복사 포함).
- **여기까지 자동, 나머지는 사람 손** (2026-09-16 정리): 사진·칼선에 같은 이름표(`Photo_A03_1.5in` / `Cutline_A03_1.5in`)를 붙여
  손으로 옮기거나 크기를 바꿀 때 짝을 찾게 했다. 완료 메시지 끝에 "함께 옮기기 · 칼선 3.5mm · 마지막 1mm 오프셋" 안내가 나온다.
  확인 창(종류)·빈 곳 다듬기·말풍선·실물 인쇄 확인은 운영자 몫.

Small/Large(v3 행 조판) 경로와 `_produceRangeSheet` 는 건드리지 않았다. Composed 가 들어오기 전 스냅샷은
`sim/baseline/range_v3_before_composed.jsx` (v1 엔진 자체의 스냅샷은 남기지 않았다 — 위 표가 폐기 이유의 기록이다).
