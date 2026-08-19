# Everstory Loose Background

직접 누끼 딴 레이어를 기준으로 사진 스티커용 균일 여백 배경을 만들고 기존 F3/F1 Action으로 넘기는 독립 Photoshop UXP 플러그인입니다.

## 역할

- 외곽: 틈 메우기 + 강한 스무딩으로 실루엣을 먼저 뭉갬 (손가락·잔털을 따라가지 않음)
- 여백: 모든 방향 균일 (기본 5%) — 뭉갠 뒤 **마지막에** expand 하므로 어디서나 최소 여백 보장
- 위/아래: 여백에 비례한 받침 (위 = 여백×1.2, 아래 = 여백×3.2 → 기본 5%에서 +6%/+16%). 이동-합집합 방식이라 실루엣이 왜곡되지 않음
- 모든 입력이 0이면 결과 = 누끼 실루엣 그대로
- 색상: 실행 중 Photoshop Color Picker에서 선택
- 캔버스: 외곽 작업 전에 필요한 여백을 계산해 중앙 기준으로 자동 확장 (기본 ON)

## 입력과 결과

```text
Layer 0      ← 누끼 레이어 (F3/F1 호환 이름)
Ellipse 1    ← Solid Color Fill + Layer Mask, 실행 후 선택
```

입력 레이어는 Layer Mask, 투명 Pixel Layer 또는 Smart Object를 사용할 수 있습니다.
플러그인은 `PHOTO STICKER` 그룹을 만들지 않으며, 정확히 `ORIGINAL`이라는 이름의 백업 레이어는 삭제합니다. 삭제까지 생성 History 한 단계에 포함되므로 Undo 한 번으로 되돌릴 수 있습니다.

기존 Action 연결:

1. 플러그인 실행 및 색상 선택
2. `F3` (`CircleAfterColor`) — `Layer 0` + `Ellipse 1` 병합
3. `F1` (`PSOperations`) — 병합된 `Layer 0`에서 실루엣 생성

## 사용법

1. Photoshop에서 그룹 밖에 있는 직접 누끼 레이어 하나를 선택합니다.
2. `Plugins > Everstory Loose Background > Everstory Loose Background` 패널을 엽니다.
3. 필요하면 균일 여백, 틈 메우기, 외곽 스무딩 비율을 조절합니다. 외곽이 캔버스 경계에 닿으면 **캔버스 자동 확장**을 켜두세요.
4. **Loose Background 만들기**를 누르고 컬러 피커에서 색상을 선택합니다.

Loose Background는 작업용 캔버스를 자동 확장할 수 있습니다. 저장, 출력 크기 변경, 파일명 생성은 별도 `everstory_save` 플러그인이 담당합니다.

## 개발 로드

UXP Developer Tool에서 이 폴더의 `manifest.json`을 추가하고 Load 합니다.
