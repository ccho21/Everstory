// 주소 라벨 격자 검증 — Everstory_address_labels.jsx 의 순수 계산만 node 로 돌린다.
//
// 추출을 **이 파일이 직접** 한다 (temp 로). sim/README 의 "낡은 packer.js 로
// 테스트가 통과" 함정을 구조적으로 없앤다 — 저장소에 사본이 남지 않는다.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "Everstory_address_labels.jsx");
const TMP = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "evslbl-")), "labels.js");
execFileSync("node", [path.join(__dirname, "extract_all.js"), SRC, TMP], { stdio: ["ignore", "ignore", "inherit"] });
const L = require(TMP);

let pass = 0, fail = 0;
function t(label, got, want) {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? "✅" : "❌"} ${label.padEnd(46)}${ok ? "" : `  got=${got}  want=${want}`}`);
}
function ok(label, cond, detail) {
  cond ? pass++ : fail++;
  console.log(`${cond ? "✅" : "❌"} ${label.padEnd(46)}${cond ? (detail ? "  " + detail : "") : "  " + (detail || "")}`);
}
const r2 = (n) => Math.round(n * 100) / 100;

// ── 호이스팅 (ExtendScript 함정) ───────────────────────────────
// ExtendScript 는 function 선언만 호이스팅한다. var 초기화는 실행 순서대로라
// 메인 호출보다 아래에 선언된 상수는 **undefined 로 조용히 죽는다.**
// hoisttest.js 는 Everstory_mixed.jsx 전용 앵커를 쓰므로 여기서 따로 본다.
console.log("══ 호이스팅 — 상수가 main() 위에 있나 ══");
(function hoist() {
  const lines = fs.readFileSync(SRC, "utf8").split("\n");
  let mainAt = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^  main\(\);\s*$/.test(lines[i])) { mainAt = i; break; }
  }
  ok("main() 호출을 찾음", mainAt >= 0, `line ${mainAt + 1}`);
  const late = [];
  for (let i = mainAt + 1; i < lines.length; i++) {
    const m = lines[i].match(/^  var ([A-Za-z_]\w*)\s*=/);
    if (m) late.push(m[1] + " (line " + (i + 1) + ")");
  }
  ok("main() 아래에 var 상수가 없다", late.length === 0, late.join(", "));
  // 최상위 실행문은 main() 하나뿐이어야 한다 — 다른 게 끼면 순서 사고가 난다.
  const stmts = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^  [a-z_]\w*\(/.test(lines[i]) && !/^  (var|function)\b/.test(lines[i])) {
      stmts.push(lines[i].trim() + " (line " + (i + 1) + ")");
    }
  }
  ok("최상위 실행문 = main() 뿐", stmts.length === 1 && /^main\(\)/.test(stmts[0]), stmts.join(" | "));
})();

// ── 격자 기본 ──────────────────────────────────────────────────
console.log("\n══ gridCells — 격자 산술 ══");
const a4 = L.sheetSpec("A4");
const cells = L.gridCells(a4);
t("칸 개수 = COLS x ROWS", cells.length, L.COLS * L.ROWS);
t("12칸", cells.length, 12);
t("A4 칸 폭", r2(cells[0].wMm), 94.5);
t("A4 칸 높이", r2(cells[0].hMm), 42);
t("모든 칸이 같은 크기",
  cells.every((c) => r2(c.wMm) === r2(cells[0].wMm) && r2(c.hMm) === r2(cells[0].hMm)), "true");

console.log("\n══ 번호 순서 — 좌→우, 위→아래 ══");
// 낮은 번호일수록 급지 선단에 가깝다. 인쇄를 위 행부터 채워
// skew 누적이 적은 칸을 먼저 소진하려는 것 — 뒤집으면 그 의도가 깨진다.
t("#1 = 1행 1열", `${cells[0].row},${cells[0].col}`, "1,1");
t("#2 = 1행 2열", `${cells[1].row},${cells[1].col}`, "1,2");
t("#3 = 2행 1열", `${cells[2].row},${cells[2].col}`, "2,1");
t("#12 = 6행 2열", `${cells[11].row},${cells[11].col}`, "6,2");
ok("번호가 1..12 로 빠짐없이", cells.map((c) => c.n).join(",") === "1,2,3,4,5,6,7,8,9,10,11,12");
ok("번호 순 = y 오름차순 (위→아래)",
  cells.every((c, i) => i === 0 || c.yMm >= cells[i - 1].yMm - 1e-9));

// ── 재급지 잼 완화: 급지 선단 ──────────────────────────────────
console.log("\n══ 급지 선단 무칼선 여백 (잼 완화) ══");
ok("첫 행이 선단에서 LEAD_MM 아래", r2(cells[0].yMm) === r2(L.LEAD_MM), `${cells[0].yMm}mm`);
ok("어떤 칸도 선단 여백을 침범 안 함", cells.every((c) => c.yMm >= L.LEAD_MM - 1e-9));
ok("LEAD_MM 이 롤러 폭 이상 (>=15mm)", L.LEAD_MM >= 15, `${L.LEAD_MM}mm`);

// ── 시트 밖 / 겹침 ─────────────────────────────────────────────
console.log("\n══ gridErrors — 시트 밖·겹침 ══");
for (const name of L.SHEET_NAMES) {
  const s = L.sheetSpec(name);
  const errs = L.gridErrors(s);
  const cs = L.gridCells(s);
  ok(`${name} 격자 정상`, errs.length === 0, errs.join(" / ") ||
    `칸 ${r2(cs[0].wMm)}x${r2(cs[0].hMm)}mm`);
}
ok("칸이 시트 밖으로 안 나감",
  cells.every((c) => c.xMm + c.wMm <= a4.wMm - L.SIDE_MM + 1e-9 &&
                     c.yMm + c.hMm <= a4.hMm - L.TAIL_MM + 1e-9));
// 너무 작은 시트를 주면 에러 경로가 실제로 걸리는지 (조용히 통과하면 안 된다)
const tiny = { name: "tiny", wMm: 30, hMm: 40 };
ok("시트가 너무 작으면 에러", L.gridErrors(tiny).length > 0, L.gridErrors(tiny)[0]);

// ── 텍스트 박스 (드리프트 흡수) ────────────────────────────────
console.log("\n══ textBoxOf — 드리프트 흡수 여백 ══");
const box = L.textBoxOf(cells[0]);
t("칼선에서 SAFE_MM 안쪽", r2(box.xMm - cells[0].xMm), r2(L.SAFE_MM));
t("텍스트 폭", r2(box.wMm), r2(cells[0].wMm - L.SAFE_MM * 2));
ok("텍스트 영역이 양수", box.wMm > 0 && box.hMm > 0, `${r2(box.wMm)}x${r2(box.hMm)}mm`);
ok("SAFE_MM 이 재급지 오차(±1mm)보다 넉넉", L.SAFE_MM >= 3, `${L.SAFE_MM}mm`);
// 캐나다 주소 최장 줄(~40자) 이 들어가나. 10pt sans 평균 자폭 ≈ 0.5em = 1.76mm (근사).
const approxMm = 40 * L.BODY_SIZE_PT * 0.5 / 2.834645;
ok("40자 주소 줄이 축소 없이 들어감", box.wMm >= approxMm,
  `박스 ${r2(box.wMm)}mm vs 추정 ${r2(approxMm)}mm`);
ok("주소 5줄이 세로로 들어감",
  box.hMm >= 5 * L.BODY_SIZE_PT * L.LEADING_RATIO / 2.834645,
  `박스 ${r2(box.hMm)}mm`);

// ── 주소 파일 파싱 ─────────────────────────────────────────────
console.log("\n══ parseAddressBlocks ══");
const sample = [
  "# 주석은 무시",
  "Naekyung Seong",
  "123 Main St, Unit 4",
  "Toronto ON  M5V 2T6",
  "",
  "",
  "Min Young Kim",
  "456 Queen St W",
  "Toronto ON  M6J 1E4",
  ""
].join("\n");
const blocks = L.parseAddressBlocks(sample);
t("블록 2개 (빈 줄 여러 개도 하나로)", blocks.length, 2);
t("첫 블록 3줄 (주석 제외)", blocks[0].length, 3);
t("첫 줄", blocks[0][0], "Naekyung Seong");
t("둘째 블록 첫 줄", blocks[1][0], "Min Young Kim");
t("CRLF 도 동일", L.parseAddressBlocks("A\r\nB\r\n\r\nC").length, 2);
t("CR 만 있어도 동일", L.parseAddressBlocks("A\rB\r\rC").length, 2);
t("빈 파일 = 0개", L.parseAddressBlocks("").length, 0);
t("공백만 = 0개", L.parseAddressBlocks("   \n\n  \n").length, 0);
t("주석만 = 0개", L.parseAddressBlocks("# a\n# b").length, 0);
t("줄 끝 공백 제거", L.parseAddressBlocks("A   \nB").join("|"), "A,B");

// ── 칸 배정 ────────────────────────────────────────────────────
console.log("\n══ planSlots — 부분 인쇄 배정 ══");
t("1번부터 3건", L.planSlots(1, 3).used.join(","), "1,2,3");
t("1번부터 3건 — 넘침 없음", L.planSlots(1, 3).overflow, 0);
t("4번부터 2건 (다음 회차)", L.planSlots(4, 2).used.join(","), "4,5");
t("11번부터 3건 — 2칸만 들어감", L.planSlots(11, 3).used.join(","), "11,12");
t("11번부터 3건 — 1건 넘침", L.planSlots(11, 3).overflow, 1);
t("마지막 칸 1건", L.planSlots(12, 1).used.join(","), "12");
t("12칸 꽉", L.planSlots(1, 12).used.length, 12);
t("13건이면 1건 넘침", L.planSlots(1, 13).overflow, 1);
ok("시작 0 은 에러", L.planSlots(0, 1).error !== null, L.planSlots(0, 1).error);
ok("시작 13 은 에러", L.planSlots(13, 1).error !== null, L.planSlots(13, 1).error);
ok("에러면 칸 배정 안 함", L.planSlots(0, 3).used.length === 0);
t("0건 요청은 빈 배정", L.planSlots(5, 0).used.length, 0);

// ── 시트 규격 ──────────────────────────────────────────────────
console.log("\n══ sheetSpec ══");
t("A4", `${L.sheetSpec("A4").wMm}x${L.sheetSpec("A4").hMm}`, "210x297");
t("Letter", `${L.sheetSpec("Letter").wMm}x${L.sheetSpec("Letter").hMm}`, "215.9x279.4");
ok("모르는 규격은 null", L.sheetSpec("A3") === null);
ok("기본 선택이 SHEET_NAMES 안", L.SHEET_NAMES[L.SHEET_DEFAULT_INDEX] !== undefined,
  L.SHEET_NAMES[L.SHEET_DEFAULT_INDEX]);

// ── python -> jsx 왕복 ─────────────────────────────────────────
// intake.py 가 쓴 라벨 파일을 .jsx 파서가 그대로 읽는지. 두 쪽이 갈라지면
// 주소가 통째로 안 찍히거나 엉뚱한 칸에 들어간다 — 봉투를 다시 만들어야 한다.
console.log("\n══ intake.py --labels -> parseAddressBlocks 왕복 ══");
(function roundTrip() {
  const INTAKE = path.join(ROOT, "scripts/order_intake/intake.py");
  if (!fs.existsSync(INTAKE)) { ok("intake.py 없음 — 건너뜀", true); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evslblrt-"));
  const proj = path.join(dir, "proj");
  const mk = (folder, doc) => {
    fs.mkdirSync(path.join(proj, folder), { recursive: true });
    fs.writeFileSync(path.join(proj, folder, "_order.json"), JSON.stringify(doc));
  };
  mk("A EVS-2001", {
    order: { name: "EVS-2001", customer: "가나다" },
    shipping: { name: "가나다", address1: "123 Main St W", address2: "Unit 4",
                city: "Toronto", provinceCode: "on", zip: "m5v 2t6", countryCodeV2: "CA" },
    line_items: [], options: [], photos: []
  });
  mk("B EVS-2002", {
    order: { name: "EVS-2002", customer: "Jane" },
    shipping: { name: "Jane Doe", company: "Doe Studio", address1: "77 Bleecker St",
                city: "New York", provinceCode: "NY", zip: "10012",
                country: "United States", countryCodeV2: "US" },
    line_items: [], options: [], photos: []
  });
  mk("C 1001", { order: { name: "#1001", customer: "Old" }, line_items: [], options: [], photos: [] });

  const out = path.join(dir, "labels.txt");
  try {
    execFileSync("python3", [INTAKE, "--labels", "--projects-dir", proj, "--labels-out", out],
                 { stdio: ["ignore", "ignore", "inherit"] });
  } catch (e) { ok("intake.py 실행", false, String(e.message).slice(0, 80)); return; }

  const blocks = L.parseAddressBlocks(fs.readFileSync(out, "utf8"));
  t("배송지 있는 2건만 (없는 건 제외)", blocks.length, 2);
  t("첫 블록 = 캐나다 4줄 (국가명 없음)", blocks[0].length, 4);
  t("한글 이름 보존", blocks[0][0], "가나다");
  t("우편번호·주 대문자", blocks[0][3], "Toronto ON  M5V 2T6");
  t("미국 건은 국가명 포함 5줄", blocks[1].length, 5);
  t("회사명이 이름 다음 줄", blocks[1][1], "Doe Studio");
  t("미국 마지막 줄 = 국가", blocks[1][4], "United States");
  ok("주석(`# 주문번호`)이 주소로 안 새어 들어감",
    blocks.every((b) => b.every((line) => !/^#/.test(line))));

  // 라벨 파일이 그대로 시트에 앉는지 — 12칸 안에 배정되나
  const plan = L.planSlots(1, blocks.length);
  ok("2건이 1~2번 칸에 배정", plan.used.join(",") === "1,2" && plan.overflow === 0);
  fs.rmSync(dir, { recursive: true, force: true });
})();

console.log(`\n${pass + fail === 0 ? "?" : ""}${pass}/${pass + fail} 통과  ${fail ? "❌" : "✅"}`);
process.exit(fail ? 1 : 0);
