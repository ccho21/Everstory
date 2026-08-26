#!/bin/zsh
set -euo pipefail

HERE="${0:A:h}"
APP_NAME="Everstory 주문 보드.app"
APP="$HERE/dist/$APP_NAME"
CONTENTS="$APP/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
MODULE_CACHE="${TMPDIR:-/tmp}/everstory-order-board-swift-module-cache"

mkdir -p "$MACOS" "$RESOURCES" "$MODULE_CACHE"

/usr/bin/xcrun swiftc \
  -swift-version 5 \
  -module-cache-path "$MODULE_CACHE" \
  -framework AppKit \
  -framework WebKit \
  "$HERE/Sources/main.swift" \
  -o "$MACOS/EverstoryOrderBoard"

/bin/cp "$HERE/Info.plist" "$CONTENTS/Info.plist"
/bin/cp "$HERE/Resources/order_board_backend.py" "$RESOURCES/order_board_backend.py"
/bin/chmod 755 "$MACOS/EverstoryOrderBoard" "$RESOURCES/order_board_backend.py"

/usr/bin/plutil -lint "$CONTENTS/Info.plist"
/usr/bin/codesign --force --deep --sign - "$APP"
/usr/bin/codesign --verify --deep --strict "$APP"

echo "$APP"
