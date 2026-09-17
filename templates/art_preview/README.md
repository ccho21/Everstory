# 이름·데코 미리보기 그림

주문 보드 `구성` 화면이 이름 스티커 글자와 데코를 그릴 때 쓰는 투명 PNG. 라이브러리(.ai)마다 폴더 하나.
Illustrator 결과와 같은 자리에 놓이도록 **그림 = 라이브러리 그룹의 geometricBounds 그대로**다 (여백 없음).

| 폴더 | 라이브러리 | 이름 스타일 | 파일 |
|---|---|---|---|
| `alphabet_art_v1/` | `alphabet_art_v1.ai` | 레트로 | `LTR_A.png` … `LTR_Z.png` (높이 240px) |
| `deco_art_v1/` | `deco_art_v1.ai` | 레트로 | `DECO_HEART.png` … 12종 + 말풍선 `DECO_YAY.png` … 6종 (높이 200px) |
| `alphabet_art_v2/` | `alphabet_art_v2.ai` | 버블 | `LTR_A.png` … + 옆 장식 넣은 틀 `LTR_C_R.png` · `LTR_V_L.png` · `LTR_Z_R.png` + 색 그룹 `LTR_A_PINK.png` · `LTR_C_PINK_R.png` … 77장 (모두 106장) |
| `deco_art_v2/` | `deco_art_v2.ai` | 버블 | `DECO_SMILE.png` … 27종 (흰 테두리 포함 · 글씨 두들 6종이 말풍선) |

- 이름 규칙: `LTR_<A–Z>[_<색>][_L|_R]` · `DECO_<영문 대문자·숫자>` — 그림 이름 = 라이브러리 그룹 이름의 공백을 밑줄로
  (`LTR A PINK` → `LTR_A_PINK`, 색은 대문자 3~12자). 보드 서버(`composed_preview.art_file`)가 이 모양이 아니면 404 를 준다.
- 버블 그림은 `scripts/art_library/build_bubble_style.jsx` 가, 레트로 말풍선 6장은 `build_retro_bubbles.jsx` 가 라이브러리와 함께 다시 만든다.
- 레트로 그림(v1)은 2026-09-17 에 같은 방식(그룹 → 임시 문서 → 아트보드 = 그룹 경계 → PNG24)으로 한 번 뽑았다.
  v1 라이브러리를 고치면 같은 방식으로 다시 뽑는다 (스크립트의 `exportPreviews` 를 v1 파일에 돌리면 된다).
- 그림이 없으면 보드는 색 타일(글자)·이모지(데코)로 대략 그린다 — 테스트(`composed_preview_test.py`)가
  range.jsx 의 치수표·색 표(`LETTER_ART_PAINTS_V2`)·데코 순서·말풍선 목록(`DECO_BUBBLES_V1` · `_V2`)에 있는 이름마다 그림이 있는지 확인한다.
