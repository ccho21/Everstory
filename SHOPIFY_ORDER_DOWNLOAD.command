#!/bin/zsh
# Everstory 주문 받기 — 더블클릭하면 브라우저에 화면이 뜬다.
# 이 터미널 창이 서버다. 닫으면 화면도 멈춘다.
#
# 자기 위치를 기준으로 webui.py 를 찾으므로 포토샵누끼/ 에 둬도,
# scripts/order_intake/ 에 둬도 동작한다.
HERE="${0:A:h}"
for d in "$HERE/scripts/order_intake" "$HERE"; do
  if [[ -f "$d/webui.py" ]]; then
    cd "$d"
    exec /usr/bin/python3 webui.py
  fi
done
echo "webui.py 를 찾을 수 없습니다."
echo "  찾아본 곳:"
echo "    $HERE/scripts/order_intake/webui.py"
echo "    $HERE/webui.py"
echo ""
echo "이 파일은 포토샵누끼/ 또는 scripts/order_intake/ 안에 있어야 합니다."
echo "다른 곳에 두려면 파일을 옮기지 말고 **별칭(alias)** 을 만드세요."
read "?엔터를 누르면 닫힙니다."
