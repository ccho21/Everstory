# sim — `Everstory_mixed.jsx` 배치 검증 하니스

Illustrator 를 켜지 않고 **배치 로직만** node 로 돌려본다.
`.jsx` 에서 패커 함수·상수를 **텍스트로 추출**하므로 손으로 베낀 사본이 없고,
따라서 실코드와 드리프트할 수가 없다.

## .jsx 를 고쳤으면 이것부터

```bash
cd sim && node extract.js ../Everstory_mixed.jsx packer.js && node hoisttest.js && node nametest.js && node modetest.js && node ordertest.js && node regress.js
```

`extract.js` 를 먼저 안 돌리면 **낡은 `packer.js` 로 테스트가 통과**한다. 실제로 여러 번 당했다.

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
