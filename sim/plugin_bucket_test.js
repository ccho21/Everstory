const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
// 플러그인 실코드를 그대로 읽는다 — 복붙 사본을 두지 않는다.
const src = fs.readFileSync(path.join(ROOT, "plugins/everstory_save/main.js"), "utf8");

// main.js 에서 실제 코드를 그대로 뽑는다 (복붙 드리프트 방지)
function grab(re, label) {
  const m = src.match(re);
  if (!m) throw new Error("추출 실패: " + label);
  return m[0];
}
const bucketSrc = grab(/const BUCKET_RE = [\s\S]*?\n}\n/, "parseBucketFromName");
const reSrc = grab(/  const re = new RegExp\(\n[\s\S]*?"i"\);/, "nextSequenceNumber regex");

eval(bucketSrc);
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
// eval 안의 `const re` 는 블록 스코프라 바깥에 안 잡힌다 — 선언만 떼고 식은 그대로 쓴다.
const reExpr = reSrc.replace(/^\s*const re = /, "");
function seqRegex(prefix) { return eval(reExpr); }

let pass = 0, fail = 0;
function t(label, got, want) {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label.padEnd(46)} got=${got}  want=${want}`);
}

console.log("── parseBucketFromName ──");
t("01_BIG_IMG_6425.jpg",           parseBucketFromName("01_BIG_IMG_6425.jpg"), "BIG");
t("05_MED_IMG_6843.jpg",           parseBucketFromName("05_MED_IMG_6843.jpg"), "MED");
t("14_SML_051626-482_Original.jpg",parseBucketFromName("14_SML_051626-482_Original.jpg"), "SML");
t("01_BIG_IMG_6425.psd (저장 후)",  parseBucketFromName("01_BIG_IMG_6425.psd"), "BIG");
t("01_IMG_1242.jpg (단일 사이즈)",  parseBucketFromName("01_IMG_1242.jpg"), "null");
t("DSCF0096.JPEG (레거시)",         parseBucketFromName("DSCF0096.JPEG"), "null");
t("IMG_0062.HEIC (레거시)",         parseBucketFromName("IMG_0062.HEIC"), "null");
t("Easify 원본명 (NN 없음)",        parseBucketFromName("EVS-1007 Package Full 487196 Big print x-IMG_6425.jpeg"), "null");
t("BIGGER_… (부분일치 아님)",       parseBucketFromName("01_BIGGER_x.jpg"), "null");
t("01_XS_IMG_1242.jpg (SKU 티어)",  parseBucketFromName("01_XS_IMG_1242.jpg"), "XS");
t("03_XXL_IMG_9.jpg",              parseBucketFromName("03_XXL_IMG_9.jpg"), "XXL");
t("02_XL_a.jpg (XXL 과 구분)",      parseBucketFromName("02_XL_a.jpg"), "XL");
t("04_S_a.jpg (SML 과 구분)",       parseBucketFromName("04_S_a.jpg"), "S");
t("05_M_a.jpg",                    parseBucketFromName("05_M_a.jpg"), "M");
t("06_L_a.jpg",                    parseBucketFromName("06_L_a.jpg"), "L");
t("07_FAM_a.jpg",                  parseBucketFromName("07_FAM_a.jpg"), "FAM");
t("08_ZZ_a.jpg (무효)",             parseBucketFromName("08_ZZ_a.jpg"), "null");
t("09_IMG_x.jpg (Mixed=토큰없음)",  parseBucketFromName("09_IMG_x.jpg"), "null");

console.log("\n── nextSequenceNumber 정규식 ──");
const re = seqRegex("누리");
const hit = (n) => { const m = n.match(re); return m ? m[1] : "null"; };
t("누리_01_XXL_clean.psd (기존)",  hit("누리_01_XXL_clean.psd"), "01");
t("누리_33_L_clean.psd (기존)",    hit("누리_33_L_clean.psd"), "33");
t("누리_08_clean.psd (무-tier)",   hit("누리_08_clean.psd"), "08");
t("누리_12_FAM_clean.psd",         hit("누리_12_FAM_clean.psd"), "12");
t("누리_05_BIG_clean.psd (신규)",  hit("누리_05_BIG_clean.psd"), "05");
t("누리_06_MED_clean.psd (신규)",  hit("누리_06_MED_clean.psd"), "06");
t("누리_07_SML_clean.psd (신규)",  hit("누리_07_SML_clean.psd"), "07");
t("누리_09_ZZ_clean.psd (무효)",   hit("누리_09_ZZ_clean.psd"), "null");
t("누리_10_sil.png (clean 아님)",  hit("누리_10_sil.png"), "null");
const re2 = seqRegex("Min Young Kim");
t("공백 포함 prefix _03_FAM",      (m=>m?m[1]:"null")("Min Young Kim_03_FAM_clean.psd".match(re2)), "03");

console.log("\n── 실제 디스크 파일 전수 ──");
// 폴더 이름을 하드코딩하지 않는다 — 사용자가 프로젝트 폴더를 자유롭게 정리하므로
// 이름에 의존하면 테스트가 남의 사정으로 터진다. 있는 것을 찾아서 검사한다.
// prefix 도 파일명에서 역산하므로 폴더명과 접두가 달라도(예: `누리_` in `… EVS-1007`) 무관.
const PROJ = path.join(ROOT, "projects");
const NAME_RE = /^(.*?)_(\d+)(?:_(?:XXL|XL|XS|SML|MED|BIG|FAM|S|M|L))?_clean\.psd$/i;
let dirs = [];
try {
  dirs = fs.readdirSync(PROJ)
    .map(n => path.join(PROJ, n, "02_cutout"))
    .filter(d => { try { return fs.statSync(d).isDirectory(); } catch (e) { return false; } });
} catch (e) { /* projects 가 없으면 이 절은 건너뛴다 */ }

let scanned = 0, unmatched = [];
for (const d of dirs) {
  const names = fs.readdirSync(d).filter(n => /_clean\.psd$/i.test(n));
  for (const n of names) {
    scanned++;
    const nfd = n.normalize("NFD");           // 디스크는 NFD, JS 리터럴은 NFC
    const m = nfd.match(NAME_RE);
    if (!m) { unmatched.push(n + "  (파일명 규약 밖)"); continue; }
    // 플러그인의 실제 정규식이 이 파일을 인식하는지
    if (!seqRegex(m[1]).test(nfd)) unmatched.push(n + "  (정규식 미인식)");
  }
}
if (scanned === 0) {
  console.log("skip 디스크에 02_cutout 파일 없음 — 합성 케이스만으로 검증됨");
} else {
  t(`디스크 ${scanned}개 전부 인식 (${dirs.length}개 폴더)`, unmatched.length, 0);
  unmatched.slice(0, 5).forEach(u => console.log("     " + u));
}

console.log(`\n=> ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
