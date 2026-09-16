# Face Probe — Composed 사진 종류 자동 판별

`Everstory_range.jsx` 의 Composed 모드가 사진 종류(얼굴 · 상반신 · 전신 · 커플·단체)를 자동으로 고를 때 쓰는 작은 앱이다.
macOS Vision 으로 `_clean.psd` 의 얼굴·사람·동물 박스를 잰다. Python·Xcode 는 필요 없다.

## 왜 앱인가

Illustrator 스크립트(ExtendScript)는 셸 명령을 못 부른다 (`app.system` 없음 · `app.doScript` 는 액션 재생뿐).
대신 `File.execute()` 로 앱을 띄울 수 있어서, 스크립트는 파일로 요청하고 결과 파일을 기다린다.

1. 스크립트가 고른 사진 6장을 `$TMPDIR/everstory_face/in/` 으로 복사한다
   — 이 앱이 바탕화면을 직접 읽으면 macOS 권한 창이 뜰 수 있다.
2. `request.txt` 에 사진 목록을 쓰고 앱을 띄운다.
3. 앱이 `result.txt` 를 쓰면 스크립트가 읽는다. 앱은 끝나면 스스로 종료한다.

실측(2026-09-16, Illustrator 30.8.1): 사진 6장 복사 0.18초 + 측정 0.41초.
결과는 사진 옆 `_cutcache/<이름>.evface` 에 저장돼 같은 사진은 다시 재지 않는다.
앱이 없거나 실패하면 스크립트는 멈추지 않고, 확인 창에서 운영자가 종류를 고른다.

## 한계

- **반려동물은 판별하지 못한다.** Vision 이 동물 몸은 찾지만 머리 크기는 못 잰다
  (동물 자세 검출은 강아지 5장 중 2장이 빈 결과). 반려동물 얼굴/전신은 확인 창에서 운영자가 고른다.
- 뒤돌아선 사람·물건처럼 얼굴이 없는 사진도 운영자 확인이 필요하다.

## 다시 빌드하기

`faceprobe.js` 를 고쳤으면 이 폴더에서:

```bash
osacompile -l JavaScript -o EverstoryFaceProbe.app faceprobe.js
plutil -replace LSUIElement -bool true EverstoryFaceProbe.app/Contents/Info.plist
codesign --force --sign - EverstoryFaceProbe.app
```

`LSUIElement` 는 실행 중 Dock 아이콘이 깜빡이지 않게 한다. Info.plist 를 고치면 서명이 깨지므로 다시 서명한다.
