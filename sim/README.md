# Package 3버킷 배분 시뮬레이션 하니스

`Everstory_mixed.jsx` 의 패커(`_packPackage` 등)를 **텍스트 추출**해 node 에서 돌린다.
손으로 베끼지 않으므로 실코드와 드리프트가 불가능하다.

## 실행

```
node extract.js ../Everstory_mixed.jsx packer.js   # .jsx → packer.js 재생성 (jsx 수정할 때마다)
node pkg_bucket_sim.js                             # 시뮬 실행
```

`packer.js` 는 자동 생성물이라 커밋/편집 금지 — 항상 extract.js 로 재생성.
추출은 2-space 들여쓰기 IIFE 규약(`  function name(` … `  }`)에 의존한다.

## 데이터

`projects/Package Full/02_cutout` 16디자인의 PNG IHDR 실측 aspect.

## 스크립트

| 파일 | 역할 |
|---|---|
| `extract.js` | .jsx → `packer.js` 재생성. **.jsx 고칠 때마다 먼저 실행** |
| `verify_impl.js` | 3버킷 배분층 구현 검증 (레거시 호환·배타성·누락 0) |
| `regress.js` | 단일/전 사이즈 = 바이트 동일, Package = 변화 방향 검사 |
| `cachetest.js` | 칼선 디스크 캐시 포맷 왕복 + 무효화 + 손상 내성 (File/Folder shim) |
| `hoisttest.js` | 최상위 var 상수의 **위치**(메인 플로우 위) + **중복 var/함수** + **미선언** 검사. ExtendScript 는 function 만 호이스팅한다 |
| ~~old~~ | 최상위 var 상수의 **위치**(메인 플로우 위) + **중복** + **미선언** 검사. ExtendScript 는 function 만 호이스팅한다 |
| `nametest.js` | 이름 스티커 치수·단어별 줄바꿈·유닛 하이브리드·부착·시트 영향 |
| `modetest.js` | 이름 스티커가 **Package 외 모드**(단일/전 사이즈)에서도 나오는지 + evict 비용·전 사이즈 보장 |
| `plugin_bucket_test.js` | UXP 플러그인의 버킷 파싱 + NN 카운트 정규식. `plugins/everstory_save/main.js` 에서 실코드를 추출해 검사 (UXP 는 node 로 못 돌리므로) |
| `bench.js` | 배분층 속도·누수 |
| `pkg_bucket_sim.js` | 인치 사다리 정책 비교 |
| `rowdump.js` | 행 구조·잔여 폭 덤프 (빈 구간 진단용) |

## 검증된 것 (2026-08-22)

- 시트 수는 2가 전 구간 최적. 3시트는 평균 충전 -9~14%p, 최저 시트 25~48%.
- 반복 max cap 은 병목이 아님 (×1.5 에서 +0.6%p 후 포화). 잔여 여백은 패커 기하 한계.
- 인치 사다리 가중이 실제 레버 (16디자인에서 67.3% → 72.5%).
- 후보 정책 자동 선택 비용 = 0.7ms, Illustrator API 호출 0.
- 고아 행 채움 게이트 확대로 누리 25디자인 충전 65/76% → 78/81%, 최악 잔여 106→38mm.
- 심볼 전환으로 디자인당 네이티브 6.8→2.65MB. `pdfCompatible=false` 로 추가 -52%.
- 칼선 디스크 캐시 왕복 20/20 통과 (베지어 핸들·구멍·closed·무효화·손상 내성).

## 함정

`P.PKG_COUNT_BY_TIER = {...}` 로 **재대입하면 안 된다** — export 속성만 갈리고
모듈 내부 var 는 원본을 계속 참조해서 실험이 조용히 무효화된다 (실제로 한 번 당함).
반드시 `P.PKG_COUNT_BY_TIER[t].max = ...` 제자리 변형 + 제자리 복원.
