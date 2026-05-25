# Everstory Save

Everstory 스티커 파이프라인의 **Phase A** UXP 플러그인.
누끼+실루엣 두 레이어로 작업된 PSD를 받아 1800px 다운스케일 후 두 파일로 저장합니다.

## 입력

PSD 구조 (사용자가 PS에서 직접 제작):

```
layers[0] (맨 위)     = 실루엣 레이어 — 검정 hard-edge, 칼선 기준
layers[1..N]          = 누끼 레이어 + 보정 레이어 (Brightness/Contrast 등 자유)
```

플러그인은 **layers[0]을 실루엣으로**, **그 아래 모든 레이어를 누끼**로 처리합니다.
보정 레이어(Adjustment Layer)를 누끼 위에 추가해도 자동으로 누끼 출력에 포함됩니다.

파일명은 자동 생성: `{folderName}_{NN}_{TIER}` 패턴. tier 는 패널 버튼에서 선택 (XS/S/M/L/FAM, no_cap 의 `TIER_TOKEN_RE` 와 호환).

## 산출물

원본이 `projects/로운/01_original/cute_pet.psd`이고 S 버튼 클릭 시:

```
projects/로운/02_cutout/로운_01_S_clean.psd   (누끼 레이어, 1800px)
projects/로운/02_cutout/로운_01_S_sil.png     (실루엣, 1800px)
```

NN 은 tier 무관하게 폴더 내 공유 카운트 (S → 01, 그 다음 M → 02 → ...). 원본 PSD는 변경되지 않음 (Duplicate Document로 작업).

## 로드 방법

1. Photoshop 27.5.0 이상 (PS 2026.x) 실행
2. UXP Developer Tool(UDT) 실행
3. `Add Plugin` → 이 폴더의 `manifest.json` 선택
4. 카드의 `••• > Load`
5. PS 메뉴 `Plugins > Everstory Save > Everstory Save`로 패널 토글

## 사용법

1. PS에서 누끼+실루엣 두 레이어가 있는 PSD 열기 (저장된 파일이어야 함)
2. 패널의 사이즈 버튼 클릭 (`XS` / `S` / `M` / `L` / `FAM` — S 가 기본 강조)
3. 상태 영역에 `완료` + 출력 경로 표시

## 핫 리로드 (개발용)

`watch.sh`가 `nodemon` + UXP CLI를 사용해 코드 저장 시 자동 재로드합니다:

```sh
npm install -g @adobe/uxp-developer-tools nodemon
cd plugins/everstory_save
bash watch.sh
```

`main.js` / `index.html` / `style.css` 저장 시 패널이 자동 reload.

## 다음 Phase

- **Phase B**: `Everstory_mixed_v2.jsx` (Illustrator) — `_sil.png` trace + cutline + A5 시트 배치 + `03_output/` 자동 저장
