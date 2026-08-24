#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""주문 인테이크 웹 UI — 브라우저에 창을 띄운다.

tkinter 를 안 쓰는 이유: 이 맥은 macOS 26 인데 시스템 Tk 가 8.5.9(2010년) 라
창이 하얗게만 뜬다. 새 파이썬 설치는 의존성 추가라 피했다.
http.server 는 표준 라이브러리라 설치할 게 없고, 렌더링은 브라우저가 한다.

로직은 intake.py 를 **모듈로 불러** 그대로 쓴다 — 사본을 두면 갈라진다.

  python3 webui.py
"""

import importlib.util
import json
import os
import secrets
import socket
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("intake", os.path.join(HERE, "intake.py"))
intake = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(intake)

TOKEN = secrets.token_urlsafe(16)   # 다른 로컬 페이지가 이 서버를 두드리지 못하게


class Args(object):
    def __init__(self, **kw):
        self.shop = os.environ.get("SHOPIFY_SHOP", intake.DEFAULT_SHOP)
        self.api_version = os.environ.get("SHOPIFY_API_VERSION", intake.DEFAULT_API_VERSION)
        self.projects_dir = os.path.abspath(os.path.join(HERE, "..", "..", "projects"))
        self.folder = None
        self.dry_run = False
        self.force = False
        self.scan = 50
        for k, v in kw.items():
            setattr(self, k, v)


# 진행 열은 폴더만 읽으면 되므로 폴링 때마다 다시 읽는다. 매번 읽으면 낭비라 이만큼만 캐시.
# 짧게 둔 이유: 포토샵에서 누끼 하나 저장하고 브라우저를 봤을 때 이미 반영돼 있어야 한다.
PROGRESS_TTL = 2.0


class State(object):
    def __init__(self):
        self.lock = threading.Lock()
        self.rows = []
        self.orders = []
        self.archived = {}
        self.log = []
        self.busy = False
        self.note = "준비됨"
        self.progress_at = 0.0
        # 오류 메시지는 진행 요약이 덮어쓰면 안 된다 — 운영자가 못 보고 지나간다.
        self.sticky = False

    def refresh_progress(self):
        """폴더만 다시 읽어 진행 열을 갱신한다. **네트워크 없음.**

        포토샵·일러스트로 작업하는 동안 보드가 알아서 따라오게 하려는 것.
        주문 조회는 Shopify API 를 때리므로 여기서 하지 않는다 (새로고침 버튼 담당).
        """
        if self.busy:
            return
        now = time.time()
        with self.lock:
            if not self.rows or now - self.progress_at < PROGRESS_TTL:
                return
            self.progress_at = now
            rows = self.rows
        for r in rows:
            if not r["folderPath"]:
                continue
            fill_progress(r, intake.project_progress(r["folderPath"]))
        if not self.sticky:
            self.note = summary_note(rows)

    def emit(self, text):
        with self.lock:
            self.log.append(text)
            if len(self.log) > 4000:
                del self.log[:2000]

    def snapshot(self, since):
        with self.lock:
            return {
                "rows": self.rows,
                "busy": self.busy,
                "note": self.note,
                "log": self.log[since:],
                "logLen": len(self.log),
            }


STATE = State()


class Writer(object):
    """intake 가 print 로 내는 진행 상황을 로그 버퍼로 흘린다."""

    def __init__(self, buf=None):
        self.buf = ""

    def write(self, s):
        if not s:
            return
        self.buf += s
        while "\n" in self.buf:
            line, self.buf = self.buf.split("\n", 1)
            STATE.emit(line)

    def flush(self):
        if self.buf:
            STATE.emit(self.buf)
            self.buf = ""


def fill_progress(row, prog):
    """project_progress -> 표의 두 칸(누끼·시트) 텍스트와 색.

    ok   = 그 단계 끝남 / wait = 다음에 손볼 것 / none = 셀 것이 없음(사진 유실 등).
    사진이 0장인 주문은 wait 로 두지 않는다 — CDN 만료로 영영 못 받는 주문이 대기
    목록에 상주하면 **진짜 할 일이 잡음에 묻힌다** (intake.py 의 ⚠ / ❌ 구분과 같은 이유).
    """
    o, p, sh = prog["originals"], prog["pairs"], prog["sheets"]
    row["originals"], row["pairs"], row["sheets"] = o, p, sh
    if not o:
        row["cutText"], row["cutKind"] = "—", "none"
    else:
        row["cutText"] = "%d/%d" % (p, o)
        row["cutKind"] = "ok" if p >= o else "wait"
    if sh:
        row["sheetText"], row["sheetKind"] = str(sh), "ok"
    elif o and p >= o:
        row["sheetText"], row["sheetKind"] = "—", "wait"
    else:
        # 누끼가 덜 끝났으면 **지금 할 일은 누끼다.** 시트까지 같이 대기로 세면 한 주문이
        # 두 번 세어져 "지금 손볼 것 N건" 이 부풀고, 그 숫자를 안 믿게 된다.
        row["sheetText"], row["sheetKind"] = "—", "none"


def summary_note(rows):
    """지금 손볼 것이 몇 건인지 한 줄로. 단계 순서대로 읽힌다."""
    bits = ["주문 %d건" % len(rows)]
    for label, key, val in (("안 받음", "kind", "new"),
                            ("누끼 대기", "cutKind", "wait"),
                            ("시트 대기", "sheetKind", "wait")):
        n = sum(1 for r in rows if r.get(key) == val)
        if n:
            bits.append("%s %d" % (label, n))
    if len(bits) == 1:
        bits.append("전부 처리됨")
    return " · ".join(bits)


def build_rows(orders, archived):
    rows = []
    for o in orders:
        photos, _, _ = intake.parse_photos(o)
        nm = o.get("name") or "?"
        rec = archived.get(nm)
        if rec is None:
            state, kind, folder = "안 받음", "new", None
        elif rec["lost"]:
            state = "일부 유실 %d장" % rec["lost"]
            kind, folder = "lost", rec["folder"]
        else:
            state, kind, folder = "완료", "done", rec["folder"]
        row = {
            "name": nm,
            "customer": intake.customer_label(o),
            "date": (o.get("createdAt") or "")[:10],
            "photos": len(photos),
            "state": state,
            "kind": kind,
            "folder": os.path.basename(folder) if folder else "",
            "folderPath": folder or "",
        }
        # 진행(누끼·시트)은 매니페스트가 아니라 폴더에서 읽는다 — Phase A/B 산출물은
        # 인테이크가 만드는 것이 아니라 매니페스트에 기록이 없다.
        fill_progress(row, intake.project_progress(folder) if folder
                      else {"originals": 0, "pairs": 0, "sheets": 0})
        rows.append(row)
    return rows


def run_job(fn, note):
    """백그라운드로 돌리면서 stdout 을 로그로 돌린다."""
    if STATE.busy:
        return False
    STATE.busy = True
    STATE.note = note
    STATE.sticky = False

    def wrapped():
        old = sys.stdout
        w = Writer()
        sys.stdout = w
        try:
            fn()
        except SystemExit as e:
            STATE.emit("")
            STATE.emit("⚠ " + str(e))
            STATE.note = "오류 — 아래 로그 확인"
            STATE.sticky = True
        except Exception as e:  # noqa: BLE001
            STATE.emit("")
            STATE.emit("⚠ %s: %s" % (type(e).__name__, e))
            STATE.note = "오류 — 아래 로그 확인"
            STATE.sticky = True
        finally:
            w.flush()
            sys.stdout = old
            STATE.busy = False

    threading.Thread(target=wrapped, daemon=True).start()
    return True


def job_refresh():
    args = Args()
    orders = intake.fetch_orders(args, None, 25)
    archived = intake.archived_orders(args.projects_dir)
    STATE.orders = orders
    STATE.archived = archived
    STATE.rows = build_rows(orders, archived)
    STATE.progress_at = time.time()
    STATE.note = summary_note(STATE.rows)


def job_fetch(names):
    args = Args()
    targets = [o for o in STATE.orders if (o.get("name") or "") in names]
    if not targets:
        STATE.emit("받을 주문이 없습니다.")
        STATE.note = "받을 주문 없음"
        return
    for o in targets:
        STATE.emit("")
        STATE.emit("──── %s ────" % (o.get("name") or "?"))
        intake.process_order(o, args, args.projects_dir)
    STATE.emit("")
    STATE.emit("완료.")
    archived = intake.archived_orders(args.projects_dir)
    STATE.archived = archived
    STATE.rows = build_rows(STATE.orders, archived)
    STATE.progress_at = time.time()
    STATE.note = summary_note(STATE.rows)


PAGE = """<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>Everstory 주문 받기</title>
<style>
  :root { color-scheme: light dark; --bg:#fff; --fg:#1a1a1a; --mut:#6b6b6b;
          --line:#e2e2e2; --new:#b34700; --newbg:#fff5ec; --done:#2b7a4b; --lost:#8a8a8a;
          --btn:#1a1a1a; --btnfg:#fff; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#161616; --fg:#ececec; --mut:#9a9a9a; --line:#2e2e2e;
            --new:#ff9d5c; --newbg:#2a1d12; --done:#6fd39a; --lost:#7a7a7a;
            --btn:#ececec; --btnfg:#161616; } }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;
         background:var(--bg); color:var(--fg); }
  header { padding:20px 24px 12px; }
  h1 { margin:0 0 4px; font-size:19px; font-weight:650; letter-spacing:-.01em; }
  #note { color:var(--mut); font-size:13px; }
  .bar { display:flex; gap:8px; flex-wrap:wrap; padding:8px 24px 16px; align-items:center; }
  button { font:inherit; font-size:13.5px; padding:7px 14px; border-radius:8px;
           border:1px solid var(--line); background:transparent; color:var(--fg); cursor:pointer; }
  button.primary { background:var(--btn); color:var(--btnfg); border-color:var(--btn); }
  button:disabled { opacity:.4; cursor:default; }
  .wrap { padding:0 24px; overflow-x:auto; }
  table { border-collapse:collapse; width:100%; min-width:640px; }
  th { text-align:left; font-size:12px; font-weight:600; color:var(--mut);
       padding:6px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
  td { padding:9px 10px; border-bottom:1px solid var(--line); font-size:14px; }
  tr.new td { background:var(--newbg); }
  tr.new .state { color:var(--new); font-weight:600; }
  tr.done .state { color:var(--done); }
  tr.lost .state { color:var(--lost); }
  td.num { text-align:right; font-variant-numeric:tabular-nums; }
  /* 진행 칸 — ok 끝남 / wait 다음에 손볼 것 / none 셀 것 없음 */
  td.prog { text-align:right; font-variant-numeric:tabular-nums; font-size:13.5px; }
  td.prog.ok { color:var(--done); }
  td.prog.wait { color:var(--new); font-weight:650; }
  td.prog.none { color:var(--lost); }
  .folder { color:var(--mut); font-size:12.5px; }
  #log { margin:16px 24px 24px; padding:12px 14px; border-radius:10px; background:#141414;
         color:#d6d6d6; font:12.5px/1.55 Menlo,monospace; height:260px; overflow:auto;
         white-space:pre-wrap; }
  .spin { display:inline-block; width:11px; height:11px; margin-left:8px; border-radius:50%;
          border:2px solid var(--mut); border-top-color:transparent; animation:s .7s linear infinite;
          vertical-align:-1px; }
  @keyframes s { to { transform:rotate(360deg); } }
</style></head><body>
<header>
  <h1>Everstory 주문 받기</h1>
  <div id="note">불러오는 중…<span class="spin"></span></div>
</header>
<div class="bar">
  <button class="primary" id="bAll">안 받은 주문 전부 받기</button>
  <button id="bSel">선택한 주문 받기</button>
  <button id="bRef">새로고침</button>
  <button id="bOpen">폴더 열기</button>
</div>
<div class="wrap"><table>
  <thead><tr><th></th><th>주문</th><th>고객</th><th>날짜</th><th>사진</th><th>상태</th>
    <th title="02_cutout 의 _clean.psd + _sil.png 페어 / 01_original 사진">누끼</th>
    <th title="03_output 의 .ai 시트 수">시트</th><th>폴더</th></tr></thead>
  <tbody id="rows"></tbody>
</table></div>
<div id="log"></div>
<script>
const T = new URLSearchParams(location.search).get("t");
let since = 0, busy = false;
const $ = s => document.querySelector(s);

async function api(path, body, extra) {
  const qs = new URLSearchParams({t: T});
  if (extra) for (const k in extra) qs.set(k, extra[k]);
  const r = await fetch(path + "?" + qs.toString(), {
    method: body ? "POST" : "GET",
    headers: body ? {"Content-Type":"application/json"} : {},
    body: body ? JSON.stringify(body) : undefined });
  return r.json();
}
function checked() {
  return [...document.querySelectorAll("#rows input:checked")].map(c => c.value);
}
function render(rows) {
  const keep = new Set(checked());
  $("#rows").innerHTML = rows.map(r => `<tr class="${r.kind}">
    <td><input type="checkbox" value="${r.name}" ${keep.has(r.name)?"checked":""}></td>
    <td>${r.name}</td><td>${r.customer}</td><td>${r.date}</td>
    <td class="num">${r.photos}</td><td class="state">${r.state}</td>
    <td class="prog ${r.cutKind}">${r.cutText}</td>
    <td class="prog ${r.sheetKind}">${r.sheetText}</td>
    <td class="folder">${r.folder}</td></tr>`).join("");
}
function setBusy(b) {
  busy = b;
  for (const id of ["bAll","bSel","bRef"]) $("#"+id).disabled = b;
}
async function poll() {
  const s = await api("/api/state", null, {since: since});
  if (s.rows) render(s.rows);
  $("#note").innerHTML = s.note + (s.busy ? '<span class="spin"></span>' : "");
  if (s.log && s.log.length) {
    const el = $("#log");
    const stick = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
    el.textContent += s.log.join("\\n") + "\\n";
    if (stick) el.scrollTop = el.scrollHeight;
    since = s.logLen;
  }
  setBusy(s.busy);
}
$("#bRef").onclick = () => api("/api/refresh", {});
$("#bAll").onclick = () => api("/api/fetch", {all:true});
$("#bSel").onclick = () => {
  const n = checked();
  if (!n.length) { alert("표에서 주문을 먼저 선택하세요."); return; }
  api("/api/fetch", {names:n});
};
$("#bOpen").onclick = () => api("/api/open", {names:checked()});
setInterval(poll, 600); poll();
</script></body></html>
"""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass  # 서버 액세스 로그는 터미널을 어지럽히기만 한다

    def _query(self):
        from urllib.parse import parse_qs, urlsplit
        return parse_qs(urlsplit(self.path).query)

    def _auth(self):
        got = self._query().get("t") or []
        return bool(got) and secrets.compare_digest(got[0], TOKEN)

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        raw = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        route = self.path.split("?", 1)[0]
        if route == "/":
            if not self._auth():
                return self._send(403, "잘못된 접근입니다.", "text/plain; charset=utf-8")
            return self._send(200, PAGE, "text/html; charset=utf-8")
        if route == "/api/state":
            if not self._auth():
                return self._send(403, json.dumps({"error": "forbidden"}))
            try:
                since = int((self._query().get("since") or ["0"])[0])
            except ValueError:
                since = 0
            STATE.refresh_progress()
            return self._send(200, json.dumps(STATE.snapshot(since), ensure_ascii=False))
        self._send(404, json.dumps({"error": "not found"}))

    def do_POST(self):
        route = self.path.split("?", 1)[0]
        if not self._auth():
            return self._send(403, json.dumps({"error": "forbidden"}))
        length = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            body = {}
        if route == "/api/refresh":
            run_job(job_refresh, "주문 목록 불러오는 중…")
        elif route == "/api/fetch":
            if body.get("all"):
                names = [r["name"] for r in STATE.rows if r["kind"] == "new"]
            else:
                names = list(body.get("names") or [])
            run_job(lambda: job_fetch(set(names)), "%d건 받는 중…" % len(names))
        elif route == "/api/open":
            names = set(body.get("names") or [])
            targets = [r["folderPath"] for r in STATE.rows
                       if r["name"] in names and r["folderPath"]]
            if not targets:
                targets = [Args().projects_dir]
            for t in targets[:5]:
                os.system("open '%s'" % t.replace("'", "'\\''"))
        else:
            return self._send(404, json.dumps({"error": "not found"}))
        self._send(200, json.dumps({"ok": True}))


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def main():
    port = free_port()
    srv = HTTPServer(("127.0.0.1", port), Handler)   # 로컬에서만 접근 가능
    url = "http://127.0.0.1:%d/?t=%s" % (port, TOKEN)
    run_job(job_refresh, "주문 목록 불러오는 중…")
    # 파이프로 넘길 때 버퍼링돼서 URL 이 안 보이는 일이 없게 즉시 내보낸다.
    print("Everstory 주문 받기", flush=True)
    print("  브라우저에서 열림: %s" % url, flush=True)
    print("  이 창을 닫거나 Ctrl+C 를 누르면 종료됩니다.", flush=True)
    threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n종료합니다.")


if __name__ == "__main__":
    main()
