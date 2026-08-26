# Everstory 주문 보드 macOS App

기존 `SHOPIFY_ORDER_DOWNLOAD.command`, `webui.py`, `intake.py`를 수정하지 않고
현행 로컬 웹 화면을 macOS `WKWebView` 앱 창에 표시합니다.

## 빌드

```bash
./prototypes/order_board_macos/build.sh
```

산출물:

```text
prototypes/order_board_macos/dist/Everstory 주문 보드.app
```

## 첫 실행

1. 앱을 실행합니다.
2. 폴더 선택기에서 `SHOPIFY_ORDER_DOWNLOAD.command`가 있는 `포토샵누끼` 루트 폴더를 고릅니다.
3. 이후부터는 앱 창 안에 현행 보드가 표시됩니다.
4. 창을 닫으면 로컬 Python 서버도 같이 종료됩니다.

선택한 폴더는 북마크와 경로로 저장되어 다음 실행부터 다시 묻지 않고 사용합니다.

## 구조

- 앱 UI: Swift `WKWebView`
- 로컬 서버: 앱 리소스에서 시작한 `/usr/bin/python3`
- 비즈니스 로직: 선택한 작업 폴더의 `webui.py`를 동적으로 import
- 보안: `127.0.0.1`, 무작위 포트, 무작위 토큰 구조 유지

정식 설치 위치는 `/Users/heatherchung/Desktop/EVERSTORY/Everstory 주문 보드.app`입니다.
