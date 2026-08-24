// 주문 매니페스트(_order.json) → 다이얼로그 프리필 검증.
//   이 값이 틀리면 **잘못된 재질/사이즈로 인쇄**된다. 되돌리는 방법이 인쇄물 폐기뿐이라
//   (재제작 = 원가 100%) 값이 아니라 "못 좁혔을 때 채우지 않는다"까지 회귀로 고정한다.
// 실코드를 통째로 추출해 돌린다 (extract_all.js) — 의존 목록을 손으로 관리하지 않는다.
var cp = require('child_process');
cp.execSync('node extract_all.js ../Everstory_mixed.jsx packer_full.js', { stdio: 'inherit' });
global.RGBColor = function () { this.red = 0; this.green = 0; this.blue = 0; };
var P = require('./packer_full.js');
var ok = [];
function chk(n, c, x) { ok.push(c); console.log((c ? '✅' : '❌') + ' ' + n + (x ? '   ' + x : '')); }

var PKG = P.PACKAGE_SIZE_VALUE, ALL = P.ALLSIZES_SIZE_VALUE;

// 실주문 모양 그대로 (Shopify EVS-1007 / EVS-1005 / #1003 을 intake.py 가 쓴 형태).
function manifest(orderName, customer, items, options) {
  return {
    generated_at: '2026-08-24T00:00:00Z',
    source: 'shopify-admin-graphql',
    order: { name: orderName, customer: customer, email: 'x@y.z' },
    line_items: items,
    options: options || [],
    photos: [], warnings: []
  };
}
function li(index, title, sku) { return { index: index, title: title, sku: sku, quantity: 1 }; }
function opt(index, key, value) { return { line_item: index, product: 'p', key: key, value: value }; }

console.log('\n══ 실주문 3건 ══');

// EVS-1007 — Package Full / White Matte. 시트 수는 FULL/MINI 에서 나온다.
var d1007 = P._orderDefaultsFrom(
  manifest('EVS-1007', 'Naekyung Seong', [li(0, 'Package Full', 'EVS-PACKAGE-FULL-WM')]),
  'Naekyung Seong EVS-1007');
chk('EVS-1007 고객명에 주문번호가 안 섞임', d1007.customerName === 'Naekyung Seong', d1007.customerName);
chk('EVS-1007 주문번호', d1007.orderNumber === 'EVS-1007', d1007.orderNumber);
chk('EVS-1007 재질 = White Matte', d1007.material === 'White Matte', String(d1007.material));
chk('EVS-1007 Package 모드', d1007.sizeMm === PKG, String(d1007.sizeMm));
chk('EVS-1007 Full = 2시트', d1007.packageSheets === 2, String(d1007.packageSheets));
chk('EVS-1007 미확정 경고 없음', d1007.notes.length === 0, d1007.notes.join(' | '));

// EVS-1005 — Face Sticker 19mm. 옵션 Name 이 스티커 이름으로 간다 (고객 이름과 별개).
var d1005 = P._orderDefaultsFrom(
  manifest('EVS-1005', 'Changsoo Cho', [li(0, 'Face Sticker', 'EVS-FACE-19-WM')],
    [opt(0, 'Name', 'Harin'), opt(0, 'Special instructions', 'First order! ')]),
  'Changsoo Cho EVS-1005');
chk('EVS-1005 사이즈 XS(19.05mm)', d1005.sizeMm === 19.05, String(d1005.sizeMm));
chk('EVS-1005 스티커 이름 = Harin', d1005.stickerName === 'Harin', d1005.stickerName);
chk('EVS-1005 고객 이름은 그대로', d1005.customerName === 'Changsoo Cho', d1005.customerName);
chk('EVS-1005 미확정 경고 없음', d1005.notes.length === 0, d1005.notes.join(' | '));

// #1003 — SKU 없는 초기 주문. 사이즈는 옵션 라벨, 키는 `_` 접두.
var d1003 = P._orderDefaultsFrom(
  manifest('#1003', 'Changsoo Cho', [li(0, 'Face Sticker', null)],
    [opt(0, '_Name', 'Harin'), opt(0, '_Photos to include (19mm)', '2 photos ($3.00)')]),
  'Changsoo Cho 1003');
chk('#1003 주문번호에서 # 제거', d1003.orderNumber === '1003', d1003.orderNumber);
chk('#1003 사이즈는 옵션 라벨에서', d1003.sizeMm === 19.05, String(d1003.sizeMm));
chk('#1003 `_Name` 도 스티커 이름으로', d1003.stickerName === 'Harin', d1003.stickerName);
chk('#1003 재질은 못 읽고 경고', d1003.material === null && d1003.notes.length === 1, d1003.notes.join(' | '));

console.log('\n══ SKU 코드표 (라이브 스토어 확인 2026-08-24) ══');
[['EVS-FACE-19-WM', 'White Matte'], ['EVS-FACE-25-TR', 'Translucent'],
 ['EVS-FACE-32-SV', 'Silver'], ['EVS-FACE-38-GD', 'Gold'],
 ['EVS-PACKAGE-FULL-TR', 'Translucent'], ['EVS-PACKAGE-MINI-GD', 'Gold']].forEach(function (t) {
  chk('재질 ' + t[0], P._materialFromSku(t[0]) === t[1], String(P._materialFromSku(t[0])));
});
[['EVS-FACE-19-WM', 19.05], ['EVS-FACE-25-WM', 25.4], ['EVS-FACE-32-WM', 31.75],
 ['EVS-FACE-38-WM', 38.1], ['EVS-FACE-51-WM', 50.8], ['EVS-FACE-64-WM', 63.5]].forEach(function (t) {
  var r = P._sizeFromSku(t[0]);
  chk('사이즈 ' + t[0], r && r.sizeMm === t[1], r ? String(r.sizeMm) : 'null');
});
var mix = P._sizeFromSku('EVS-FACE-MIX-SV');
chk('Mixed = 전 사이즈 모드', mix && mix.sizeMm === ALL, mix ? String(mix.sizeMm) : 'null');
var mini = P._sizeFromSku('EVS-PACKAGE-MINI-GD');
chk('Package Mini = 1시트', mini && mini.sizeMm === PKG && mini.packageSheets === 1,
    mini ? String(mini.packageSheets) : 'null');
chk('모르는 SKU 는 추측하지 않음', P._sizeFromSku('EVS-WEIRD-XX') === null &&
    P._materialFromSku('EVS-WEIRD-99') === null);

console.log('\n══ 못 좁히면 채우지 않는다 ══');
// 한 주문에 재질이 다른 두 상품 — 임의로 하나를 고르면 절반은 틀린 재질로 인쇄된다.
var mixedMat = P._orderDefaultsFrom(
  manifest('EVS-1099', 'Two Items',
    [li(0, 'Face Sticker', 'EVS-FACE-25-WM'), li(1, 'Face Sticker', 'EVS-FACE-25-GD')]),
  'Two Items EVS-1099');
chk('재질 엇갈리면 비워둠', mixedMat.material === null, String(mixedMat.material));
chk('재질 엇갈리면 이유를 남김', /재질/.test(mixedMat.notes.join(' ')), mixedMat.notes.join(' | '));
chk('사이즈는 일치하므로 그대로 채움', mixedMat.sizeMm === 25.4, String(mixedMat.sizeMm));

var mixedSize = P._orderDefaultsFrom(
  manifest('EVS-1098', 'Two Sizes',
    [li(0, 'Face Sticker', 'EVS-FACE-25-WM'), li(1, 'Face Sticker', 'EVS-FACE-51-WM')]),
  'Two Sizes EVS-1098');
chk('사이즈 엇갈리면 비워둠', mixedSize.sizeMm === null, String(mixedSize.sizeMm));
chk('재질은 일치하므로 그대로 채움', mixedSize.material === 'White Matte', String(mixedSize.material));

console.log('\n══ 매니페스트 없는 폴더 (레거시) ══');
var noMan = P._orderDefaultsFrom(null, 'Naekyung Seong EVS-1007');
chk('폴더명에서 이름/주문번호 분리', noMan.customerName === 'Naekyung Seong' && noMan.orderNumber === 'EVS-1007',
    noMan.customerName + ' / ' + noMan.orderNumber);
chk('재질·사이즈는 안 채움', noMan.material === null && noMan.sizeMm === null);
chk('없다는 사실을 표시', noMan.hasManifest === false && noMan.notes.length === 1, noMan.notes.join(' | '));
var korean = P._orderDefaultsFrom(null, '하린');
chk('구 폴더(이름만) 는 그대로', korean.customerName === '하린' && korean.orderNumber === '', korean.customerName);
chk('깨진 매니페스트도 폴더명 폴백', P._orderDefaultsFrom({}, '하린').customerName === '하린');

console.log('\n══ 드롭다운 index 매핑 ══');
chk('재질 index', P._indexOfValue(P.MATERIAL_OPTIONS, 'Gold', 0) === 3);
chk('재질 null 이면 기본값', P._indexOfValue(P.MATERIAL_OPTIONS, null, 0) === 0);
chk('사이즈 index (Package)', P.SIZE_VALUES[P._indexOfValue(P.SIZE_VALUES, PKG, 1)] === PKG);
chk('사이즈 index (1.25in)', P._indexOfValue(P.SIZE_VALUES, 31.75, 1) === 2);
chk('사이즈 null 이면 기본값 S', P._indexOfValue(P.SIZE_VALUES, null, P.SIZE_DEFAULT_INDEX) === P.SIZE_DEFAULT_INDEX);
chk('시트 index (2장)', P.PACKAGE_SHEET_VALUES[P._indexOfValue(P.PACKAGE_SHEET_VALUES, 2, 1)] === 2);

console.log('\n══ 다이얼로그 요약 줄 ══');
var sum = P._orderSummaryLine(d1007);
chk('요약에 주문번호·고객·재질', /EVS-1007/.test(sum) && /Naekyung Seong/.test(sum) && /White Matte/.test(sum), sum);
chk('Package 는 PKG + 시트수', /PKG/.test(sum) && /2시트/.test(sum), sum);
chk('매니페스트 없으면 그렇게 말함', /없음/.test(P._orderSummaryLine(noMan)), P._orderSummaryLine(noMan));

console.log('\n══ job 블록 — intake.py 해석을 그대로 쓴다 ══');

// intake.py 의 build_job 을 **실제로 호출**한다. 손으로 베낀 기대값이 아니라 실코드 출력이라
// python 쪽 규칙이 바뀌면 여기서 바로 깨진다.
var PY = [
  "import importlib.util, json, os, sys",
  "spec = importlib.util.spec_from_file_location('intake', os.path.join('..','scripts','order_intake','intake.py'))",
  "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
  "print(json.dumps(m.build_job(json.load(sys.stdin)), ensure_ascii=False))"
].join('\n');
function pyJob(man) {
  // execFileSync = 셸을 안 거친다 (한글·따옴표가 든 매니페스트를 그대로 넘기려면 필요).
  return JSON.parse(cp.execFileSync('python3', ['-c', PY],
    { input: JSON.stringify(man), encoding: 'utf8' }));
}

// **교차 검증**: 같은 매니페스트를 (a) python 이 해석한 job 블록으로 읽었을 때와
// (b) jsx 가 SKU 를 직접 읽었을 때가 같아야 한다. 다르면 두 해석기가 갈라진 것이고,
// 그 상태로는 언젠가 틀린 재질/사이즈로 인쇄된다.
var CROSS = [
  ['Package Full', manifest('EVS-1007', 'Naekyung Seong',
     [li(0, 'Package Full', 'EVS-PACKAGE-FULL-WM')]), 'Naekyung Seong EVS-1007'],
  ['Package Mini', manifest('EVS-1010', 'Y',
     [li(0, 'Package Mini', 'EVS-PACKAGE-MINI-GD')]), 'Y EVS-1010'],
  ['Face 19mm + Name', manifest('EVS-1005', 'Changsoo Cho',
     [li(0, 'Face Sticker', 'EVS-FACE-19-WM')], [opt(0, 'Name', 'Harin')]), 'Changsoo Cho EVS-1005'],
  ['Mixed → 전 사이즈', manifest('EVS-1009', 'X',
     [li(0, 'Face Sticker', 'EVS-FACE-MIX-SV')]), 'X EVS-1009'],
  ['레거시 (SKU 없음)', manifest('#1003', 'Changsoo Cho', [li(0, 'Face Sticker', null)],
     [opt(0, '_Name', 'Harin'), opt(0, '_Photos to include (19mm)', '2 photos')]), 'Changsoo Cho 1003'],
  ['재질 엇갈림', manifest('EVS-1011', 'Z',
     [li(0, 'Face Sticker', 'EVS-FACE-25-WM'), li(1, 'Face Sticker', 'EVS-FACE-25-GD')]), 'Z EVS-1011'],
  ['사이즈 엇갈림', manifest('EVS-1012', 'W',
     [li(0, 'Face Sticker', 'EVS-FACE-25-WM'), li(1, 'Face Sticker', 'EVS-FACE-51-WM')]), 'W EVS-1012']
];
var FIELDS = ['customerName', 'orderNumber', 'stickerName', 'material', 'sizeMm', 'packageSheets'];
CROSS.forEach(function (t) {
  var withoutJob = P._orderDefaultsFrom(t[1], t[2]);
  var m2 = JSON.parse(JSON.stringify(t[1]));
  m2.job = pyJob(t[1]);
  var withJob = P._orderDefaultsFrom(m2, t[2]);
  var diff = FIELDS.filter(function (f) { return withoutJob[f] !== withJob[f]; });
  chk('교차 일치: ' + t[0], diff.length === 0 && withJob.via === 'job',
      diff.length ? diff.map(function (f) { return f + ' ' + withoutJob[f] + '≠' + withJob[f]; }).join(', ')
                  : (withJob.material || '-') + ' / ' + withJob.sizeMm);
  chk('  경고 개수도 일치: ' + t[0], withoutJob.notes.length === withJob.notes.length,
      withoutJob.notes.length + ' vs ' + withJob.notes.length);
});

var jobbed = JSON.parse(JSON.stringify(CROSS[0][1]));
jobbed.job = pyJob(CROSS[0][1]);
var dj = P._orderDefaultsFrom(jobbed, CROSS[0][2]);
chk('job 있으면 요약에 SKU 해석 표시 없음', !/SKU 해석/.test(P._orderSummaryLine(dj)), P._orderSummaryLine(dj));
chk('job 없으면 요약에 표시', /job 없음 · SKU 해석/.test(
  P._orderSummaryLine(P._orderDefaultsFrom(CROSS[0][1], CROSS[0][2]))));

console.log('\n══ 선물 (받는 사람 ≠ 주문자) ══');
var gift = JSON.parse(JSON.stringify(CROSS[0][1]));
gift.job = pyJob(CROSS[0][1]);
gift.shipping = { name: 'Neuri Park', address1: '53 Angus Dr', city: 'North York' };
var g = P._orderDefaultsFrom(gift, CROSS[0][2]);
chk('선물이면 받는 사람을 잡아냄', g.shipTo === 'Neuri Park', g.shipTo);
chk('선물이면 경고로 띄움', /선물/.test(g.notes.join(' ')), g.notes.join(' | '));
chk('헤더 이름은 자동으로 안 바꿈 (주문자 그대로)', g.customerName === 'Naekyung Seong', g.customerName);
var same = JSON.parse(JSON.stringify(CROSS[0][1]));
same.job = pyJob(CROSS[0][1]);
same.shipping = { name: 'Naekyung Seong', address1: 'x' };
chk('받는 사람이 같으면 조용함',
    P._orderDefaultsFrom(same, CROSS[0][2]).notes.length === 0);
chk('shipping 없어도 안 터짐', P._orderDefaultsFrom(jobbed, CROSS[0][2]).shipTo === '');

var pass = ok.filter(Boolean).length;
console.log('\n' + pass + '/' + ok.length + ' 통과  ' + (pass === ok.length ? '✅' : '❌'));
process.exit(pass === ok.length ? 0 : 1);
