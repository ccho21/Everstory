#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Existing order-board backend adapter for the native macOS app.

This deliberately imports the selected workspace's webui.py instead of copying
its business logic. The existing command/browser launcher remains untouched.
"""

import importlib.util
import json
import os
import subprocess
import sys


def load_webui(workspace):
    path = os.path.join(workspace, "scripts", "order_intake", "webui.py")
    if not os.path.isfile(path):
        raise SystemExit("webui.py not found: %s" % path)
    spec = importlib.util.spec_from_file_location("everstory_existing_webui", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def make_native_handler(webui):
    """Use an argv-based Finder launch inside the prototype only.

    The existing webui.py intentionally remains unchanged. Its shell-string
    `open` call is replaced here so the app can report success or failure
    in the board log and avoid shell quoting entirely.
    """

    class NativeHandler(webui.Handler):
        def do_POST(self):
            route = self.path.split("?", 1)[0]
            if route != "/api/open":
                return super().do_POST()
            if not self._auth():
                return self._send(403, json.dumps({"error": "forbidden"}))

            length = int(self.headers.get("Content-Length") or 0)
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except ValueError:
                body = {}

            names = set(body.get("names") or [])
            targets = [
                row["folderPath"]
                for row in webui.STATE.rows
                if row["name"] in names and row["folderPath"]
            ]
            if not targets:
                targets = [webui.Args().projects_dir]

            opened = 0
            for target in targets[:5]:
                try:
                    subprocess.run(
                        ["/usr/bin/open", "-a", "Finder", target],
                        check=True,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    webui.STATE.emit("폴더 열기: %s" % target)
                    opened += 1
                except (OSError, subprocess.CalledProcessError) as error:
                    webui.STATE.emit("⚠ 폴더 열기 실패: %s" % error)

            return self._send(200, json.dumps({"ok": opened > 0}))

    return NativeHandler


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: order_board_backend.py WORKSPACE")

    workspace = os.path.abspath(sys.argv[1])
    webui = load_webui(workspace)
    port = webui.free_port()
    server = webui.HTTPServer(("127.0.0.1", port), make_native_handler(webui))
    url = "http://127.0.0.1:%d/?t=%s" % (port, webui.TOKEN)

    # Swift reads this line and points WKWebView at the authenticated local URL.
    print("EVERSTORY_URL=" + url, flush=True)
    webui.run_job(webui.job_refresh, "주문 목록 불러오는 중…")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
