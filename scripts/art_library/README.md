# 이름 스타일 라이브러리 (2026-09-17)

| 도구 | 하는 일 |
|---|---|
| `build_bubble_style.jsx` | **버블** 스타일 아트 두 개를 원본 .ai 에서 다시 만든다 (아래) |
| `build_retro_bubbles.jsx` | **레트로** 데코 라이브러리(`deco_art_v1.ai`)에 말풍선 6종을 그린다 ([아래](#레트로-말풍선-build_retro_bubblesjsx)) |

## 버블 (`build_bubble_style.jsx`)

주문 보드 `구성` 화면의 **이름 스타일 → 버블**이 쓰는 아트 두 개를 원본 .ai 에서 다시 만든다.

| 원본 (`../shopify_assets/assets/`) | 결과 (`templates/`) | 내용 |
|---|---|---|
| `알파벳 샘플_6.ai` | `alphabet_art_v2.ai` | 그룹 `LTR A` ~ `LTR Z` + 색 그룹 `LTR A PINK` … 69개 |
| `sticker sample 4.ai` | `deco_art_v2.ai` | 그룹 `DECO SMILE` … 27종 |
| (둘 다) | `art_preview/alphabet_art_v2/*.png` · `art_preview/deco_art_v2/*.png` | 주문 보드 미리보기 그림 |

원본을 고쳤으면 **먼저 원본을 저장하고** Illustrator → File → Scripts → Other Script → `build_bubble_style.jsx`
(도구는 디스크에 저장된 원본 파일을 읽는다 — 열려 있는 문서의 저장 안 한 수정은 안 들어간다).
원본은 작업 폴더(임시)에 사본으로만 열고 저장하지 않는다. 다 만들면 요약 창이 뜨고 **"예"를 눌러야** `templates` 에 덮어쓴다.
원본이 기본 위치에 없으면 파일 고르기 창이 뜬다. 1분 남짓 (2026-09-17 실측: 색 그룹 전 64초 · 색 그룹 포함 77초, 그림 133장).

## 끝나고 할 일

- 요약에 **"⚠ 색 표가 range.jsx 와 다름"** 이 나오면 작업 폴더의 `LETTER_ART_PAINTS_V2.txt` 로 `Everstory_range.jsx` 의
  `LETTER_ART_PAINTS_V2` 표를 바꾸고 아래 테스트를 돌린다 (원본에서 글자 바탕 색이나 장식 색을 바꾸면 생긴다).
- 요약에 **"⚠ 말풍선 비율표가 range.jsx 와 다름"** 이 나오면 작업 폴더의 `DECO_BUBBLE_ASPECT_V2.txt` 로
  `DECO_BUBBLE_ASPECT_V2` 표를 바꾸고 테스트를 돌린다 (원본에서 글씨 두들 모양을 바꾸면 생긴다 — 시트의 말풍선 칸이 이 비율이다).
- 요약에 **"⚠ 치수표가 range.jsx 와 다름"** 이 나오면 작업 폴더의 `LETTER_ART_METRICS_V2.txt` 로
  `Everstory_range.jsx` 의 `LETTER_ART_METRICS_V2` 표를 바꾸고 테스트를 돌린다 (반올림 0.0001 차이는 같은 것으로 본다):
  ```
  node sim/range_composed_test.js
  cd scripts/order_intake && python3 composed_preview_test.py
  ```
  표가 틀리면 미리보기와 Illustrator 가 같은 틀 크기를 쓰긴 하지만, 글자 크기·바닥선이 그림과 어긋난다.
- 주문 보드는 **새로고침**하면 새 그림을 쓴다 (그림 주소에 파일 시각이 붙는다).
- 두들을 더하거나 빼서 데코로 쓰고 싶으면 `Everstory_range.jsx` 의 `DECO_ORDER_V2`(작은 데코 순서) ·
  `DECO_BUBBLES_V2`(글씨 말풍선 — 시트당 2개까지 22mm 자리, 이 도구의 `BUBBLES` 도 같이)를 고친다.
  테스트가 순서의 모든 이름에 그림이 있는지 확인한다.

## 만드는 규칙 (range.jsx 가 기대하는 모양)

- **글자 그룹** = 몸통 `BODY`(검정 테두리 컴파운드 — 색 12,12,12 · 넓이 4000 이상인 것 26개를 위→아래, 왼→오른 순으로 A~Z)
  + 안쪽 장식 + 바탕 `FACE` + `FILL`(흰 채우기) + 맨 아래 `SIL`(조각 전체의 합집합 바깥 윤곽, 흰색).
  `SIL` 은 range.jsx 가 이름 전체 흰 테두리를 만들 때 부풀리는 도형이다 (`_drawNameHalo`).
- **바탕 `FACE`와 색 그룹** (2026-09-17 — 이름 글자 색 돌리기): 바탕 = 팔레트(`PAINTS` — 흰 244 · 분홍 250,174,176 ·
  노랑 251,213,63 · 하늘 176,205,235, 원본 알파벳의 바탕 색 그대로) 중 흰색이 아닌 색 조각의 넓이 합이 `FILL` 의 20% 이상인 색의
  조각 전부(N 은 하늘 줄무늬 6조각), 없으면 가장 넓은 흰 조각 하나. 나머지 팔레트 색 조각(옆 장식 묶음 안 포함)은 **장식** —
  그 색은 그 글자에 안 쓴다 (A 노란 하트 → 노랑 없음 · O·Q 흰 속구멍 → 흰색 없음 · R 의 흰 속구멍은 바탕과 같은 색이라 그대로).
  글자마다 쓸 수 있는 색(첫 색 = 원래 색)으로 **색 그룹** `LTR A PINK` 을 복제해 `FACE` 만 칠한다 → 26자 + 69개.
  바탕 색이 팔레트에 없으면(원본에서 새 색을 칠함) 멈추고 알린다 — 그 색을 `PAINTS` 에 더하고 range.jsx 돌림 순서도 확인한다.
- **옆 장식**: 몸통 경계 밖으로 조금이라도 나간 조각은 `SIDE L` / `SIDE R` 묶음(좌우 = 조각 중심)으로 따로 둔다 — 지금은
  V 왼쪽 선 · C 오른쪽 선 · Z 별과 선. range.jsx 는 이름 줄의 **맨 앞 글자만 L, 맨 끝 글자만 R** 을 남긴다.
  묶음 안에도 `SIL` 이 있다. 양쪽으로 넘친 조각은 옆 장식으로 안 보고 로그에 남긴다.
- **두들 그룹** = 두들 조각 + `FILL` + 맨 아래 `SIL` = **흰 테두리 = 칼선**. 테두리는 최대 변의 6% 에서 시작해 한 장으로
  이어질 때까지 8 · 10 · 12 · 15 · 18% 로 키운다 (2026-09-17: SPARKLES 12% · DOTS 10% · BURSTPINK 8%, 나머지 6%).
- **두들 자리**는 스크립트 안 `DOODLE_ITEMS` 상자(원본 좌표 pt)로 정한다. 원본에서 두들을 옮기거나 더하면 상자를 고친다 —
  상자 밖 조각은 가장 가까운 상자로 가고 `build.log` 에 남는다.
- 원본의 흰(크림) 채우기는 **여러 글자·두들에 걸친 컴파운드 하나**다 → 풀어서(`noCompoundPath`) 조각마다 배정하고, 한 그룹에 여러 개면
  다시 컴파운드로 묶는다. 선 장식 밑에도 흰 조각이 있다.
- 미리보기 그림 = 그룹 경계 그대로(투명 PNG, 글자 높이 240px · 두들 200px). 파일 이름 = 그룹 이름의 공백을 밑줄로
  (`LTR_A_PINK.png`). 옆 장식이 있는 글자는 `LTR_C_R.png` · `LTR_C_PINK_R.png` 처럼 한 장 더. 색 그룹은 모양이 같아 치수는 원래 그룹만 잰다.
- 치수표 = 틀(그룹 경계, 옆 장식 넣은 틀은 따로) ÷ 기준 높이(몸통 높이 중앙값) — `aw` 틀 폭/높이 · `bl` 틀 위→몸통 바닥 ÷ 높이 ·
  `fh` 틀 높이 ÷ 기준 높이. 글자는 모두 **같은 배율**로 줄어든다 (그린 크기 차이를 살린다).

## 함정 (실측)

- 컴파운드를 푼 직후 `geometricBounds` 는 `app.redraw()` 뒤에 읽어야 맞다 — 안 그러면 34000pt 밖 좌표가 나왔다.
- `exportFile` 은 **활성 문서**를 내보낸다 — 임시 문서를 활성으로 안 바꾸면 라이브러리 전체가 PNG 한 장에 찍힌다.
- C 의 윗선은 몸통 폭 안에 있어 "좌우로 나간 것" 규칙으로는 몸통에 남았다 → 경계 밖으로 조금이라도 나가면 옆 장식.
- Pathfinder 는 칠 없는 패스에서 빈 결과를 낸다 → 단색으로 복사한 뒤 합친다. 구멍은 감긴 방향(넓이 부호)으로 가려 버린다.
- Offset Path 이펙트 `jntp 0` = 라운드 (캘리그래피 스크립트에서 실측한 매핑).
- 테스트 훅: `$.global.__EVERSTORY_ART_BUILD__ = { work: "<폴더>", workOnly: true }` → templates 를 안 건드리고 `cfg.report` 에 요약.
- 다시 만들어도 원래 글자·두들 그림은 픽셀 단위로 같다 (2026-09-17 색 그룹 추가 때 56장 비교). `.ai` 파일은 저장 시각이 들어가
  바이트는 달라진다 — 내용이 그대로인 라이브러리는 굳이 바꿔 넣지 않아도 된다.

## 레트로 말풍선 (`build_retro_bubbles.jsx`)

레트로 데코(`deco_art_v1.ai`, 원본 sticker sample 3)에는 글씨 스티커가 없어서 **같은 모양새로 스크립트가 그린다**
(2026-09-17 — 사용자가 시안을 보고 "다듬어 넣자"). Illustrator → File → Scripts → Other Script → `build_retro_bubbles.jsx`, 22초.
`templates/deco_art_v1.ai` 를 작업 폴더에 복사해 열고, 같은 이름 그룹이 있으면 지우고 다시 그린다 (기존 12종은 그대로).
요약 창에서 **"예"** 를 눌러야 `templates/deco_art_v1.ai` 와 `art_preview/deco_art_v1/DECO_YAY.png` … 6장을 바꾼다.

- 모양: 팝 색 물결 바탕 + 검정 테두리 + 크림 말풍선(꼬리) + 입체 그림자 + **Luckiest Guy** 글씨(색 · 검정 테두리 · 검정 그림자).
  색은 기존 레트로 데코의 채우기 색 그대로 (`COLORS`). 문구·색·꼬리 방향은 스크립트의 `BUBBLES` 표 —
  YAY! · BEST DAY · XOXO · WOW! · MY FAVE · YOU+ME. 이름(key)을 바꾸거나 더하면 range.jsx `DECO_BUBBLES_V1` 도 고친다.
- 규칙 (range.jsx 가 기대하는 모양): 그룹 `DECO <이름>` · **선(stroke) 없음** — 시트에 놓을 때 `resize` 가 선 굵기를 안 바꾸므로
  테두리는 모두 Offset Path 로 부풀린 채운 도형이다. 맨 아래 `SIL` = 모든 조각(바탕·그림자·말풍선·글씨)을 5pt 부풀린 합집합 =
  검정 바깥 테두리 = **칼선 한 조각** (그룹에서 가장 큰 도형이라 `_artOutlinePath` 가 고른다). 도구가 선 0 · SIL = 그룹 경계를 확인하고
  아니면 멈춘다.
- 요약에 **"⚠ 비율표가 range.jsx 와 다름"** 이 나오면 작업 폴더의 `DECO_BUBBLE_ASPECT_V1.txt` 로 `DECO_BUBBLE_ASPECT_V1` 을 바꾸고
  테스트를 돌린다 (그림자가 오른쪽으로 나가서 꼬리가 왼쪽인 것 1.3063 · 오른쪽인 것 1.2840).
- 서체가 없으면 멈춘다 — Luckiest Guy(Google Fonts, OFL)를 설치하고 Illustrator 를 다시 켠다 (실행 중에는 서체 목록을 다시 안 읽는다).
- 라이브러리 크기 267KB → 506KB (말풍선 6종). 같은 입력이면 그림이 픽셀까지 같게 나온다 (2026-09-17 두 번 실행).
- 칼선 구멍선 (2026-09-17 고침): 기존 레트로 데코 중 HEART · CUPCAKE · BONE · CAMERA · RAINBOW · FLOWER 는
  `_artOutlinePath` 가 고르는 가장 큰 도형이 **검정 테두리 고리(바깥선 + 라이브러리에서 약 6pt, 시트에서 약 0.2mm 안쪽 구멍선)** 라
  칼선에 안쪽 선이 하나 더 들어갔다 (실제 시트에서 FLOWER · CAMERA 칼선 두 조각). 이제 range.jsx `_artCutOuterOnly` 가
  **칼선 복제본에서** 가장 큰 윤곽과 감긴 방향이 반대인 선을 지운다 — 인쇄 그림의 검정 테두리는 그대로. 라이브러리 세 개
  (`deco_art_v1` · `deco_art_v2` · `alphabet_art_v1`) 71그룹을 Illustrator 로 점검하니 바뀌는 건 이 6종뿐이었다
  (두 조각 → 바깥선 한 조각, 칼선 경계 = 그림 경계 ±0.05pt). 다시 만든 레트로 시트에서 FLOWER · CAMERA 칼선 한 조각 확인.
  새 그림을 넣을 때도 가장 큰 도형은 바깥선 한 조각으로 두는 게 안전하다.

