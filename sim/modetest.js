// 이름 스티커가 **Package 외 모드**(단일 사이즈 / 전 사이즈)에서도 나오는지.
//   · 그 시트들은 반복 채움으로 항상 꽉 차므로, 이름이 들어가려면 사진을 빼야 한다.
//   · 대신 전 사이즈의 "각 사이즈 ≥1장" 보장은 깨지면 안 된다.
// 실코드를 통째로 추출해 돌린다 (extract_all.js) — 의존 목록을 손으로 관리하지 않는다.
var cp = require('child_process');
cp.execSync('node extract_all.js ../Everstory_mixed.jsx packer_full.js', { stdio: 'inherit' });
global.RGBColor = function () { this.red = 0; this.green = 0; this.blue = 0; };
var P = require('./packer_full.js');
var MM = P.MM_TO_PT, binW = 142 * MM, binH = 172 * MM, gap = P.GAP_DEFAULT_MM * MM;  // body 142×175 − padding X0/Y1.5
var ok = [];
function chk(n, c, x) { ok.push(c); console.log((c ? '✅' : '❌') + ' ' + n + (x ? '   ' + x : '')); }

var ASPECTS = [0.7256, 1.0, 0.733, 0.4756, 0.75, 0.6828, 1.2839, 0.4167];
function mk(n, sizeMm) {
  var o = [];
  for (var i = 0; i < n; i++) {
    var asp = ASPECTS[i % ASPECTS.length], p = { base: 'd' + i, aspect: asp };
    if (sizeMm) {
      var s = sizeMm * MM;
      if (asp >= 1) { p.cellW = s; p.cellH = s / asp; } else { p.cellW = s * asp; p.cellH = s; }
      p.sizeMm = sizeMm;
    }
    o.push(p);
  }
  return o;
}
function block(text) {
  var b = P._letterBlockSpec(text, P.LETTER_UNIT_MM, 'ALPHA');
  b.isAlphabetBlock = true; b.preferHero = true;
  b.shapes = P._letterShapeCandidates(b);
  return b;
}
function counts(r) {
  var photos = 0, names = 0;
  r.placed.forEach(function (p) { if (p.payload.isLetterBlock) names++; else photos++; });
  return { photos: photos, names: names };
}

console.log('══ 단일 사이즈 — 이름이 사진을 밀어내고 들어간다 ══');
[0.75, 1.0, 1.5, 2.0].forEach(function (inch) {
  var mm = inch * 25.4;
  var base = counts(P._aspectBandGridPack(mk(6, mm), binW, binH, gap, null));
  var b = block('Harin');
  var withN = P._aspectBandGridPack(mk(6, mm), binW, binH, gap, [b]);
  var c = counts(withN);
  console.log('  ' + inch + '"  사진 ' + base.photos + '→' + c.photos +
    '  이름 ' + c.names + '개  부착 ' + withN.letterAttachedCount + '/' + withN.letterWanted +
    '  뺀 사진 ' + withN.letterEvicted + '  유닛 ' + b.unitMm + 'mm');
  chk(inch + '" 시트에 이름이 들어간다', c.names === 1 && withN.letterAttachedCount === 1);
});

console.log('\n══ 이름이 없으면 아무것도 안 바뀐다 ══');
function sig(r) {
  return r.placed.map(function (p) {
    return [p.x.toFixed(4), p.y.toFixed(4), p.w.toFixed(4), p.h.toFixed(4), p.payload.base].join(',');
  }).join('|');
}
chk('단일 사이즈: null 과 빈 배열이 같은 결과',
  sig(P._aspectBandGridPack(mk(6, 25.4), binW, binH, gap, null)) ===
  sig(P._aspectBandGridPack(mk(6, 25.4), binW, binH, gap, [])));

console.log('\n══ 전 사이즈 — 보장(각 사이즈 ≥1장)이 안 깨진다 ══');
function sizeSet(r) {
  var s = {};
  r.placed.forEach(function (p) { if (!p.payload.isLetterBlock && p.payload.sizeMm != null) s[p.payload.sizeMm] = 1; });
  return s;
}
[1, 3, 8].forEach(function (n) {
  var base = P._packAllSizes(mk(n), binW, binH, gap, null);
  var b = block('Harin');
  var withN = P._packAllSizes(mk(n), binW, binH, gap, [b]);
  var c = counts(withN), bc = counts(base);
  // 사이즈는 item.sizeMm 에 있다 (payload 아님) — 행을 직접 훑는다
  function sizesOf(pack) {
    var s = {};
    pack.rows.forEach(function (rw) {
      rw.items.forEach(function (it) { if (it.sizeMm != null) s[it.sizeMm] = (s[it.sizeMm] || 0) + 1; });
    });
    return s;
  }
  var sb = sizesOf(base), sn = sizesOf(withN);
  var missing = [];
  for (var k in sb) if (!sn[k]) missing.push(k);
  console.log('  디자인' + n + '  사진 ' + bc.photos + '→' + c.photos + '  이름 ' + c.names +
    '개  부착 ' + withN.letterAttachedCount + '/' + withN.letterWanted +
    '  뺀 사진 ' + withN.letterEvicted + (missing.length ? '  ⚠ 사라진 사이즈 ' + missing.join(',') : ''));
  chk('전 사이즈 디자인' + n + ': 이름 배치 + 사이즈 하나도 안 사라짐',
    withN.letterAttachedCount === 1 && missing.length === 0);
  chk('전 사이즈 디자인' + n + ': 총 장수 = 사진 + 이름',
    withN.mixedSummary.total === c.photos, withN.mixedSummary.total + ' vs ' + c.photos);
});

console.log('\n══ 어려운 조합 — 전부 배치돼야 한다 ══');
// 한 줄 강제 + 좁은 시트 조합. 여기서 하나라도 0/1 이 되면 그 주문은 이름 없이 나간다.
[[2.5, 'Christopher'], [0.75, 'Christopher'], [1.0, 'Anne Marie Kim'],
 [0.75, 'Anne Marie Kim'], [0.75, 'Harin'], [1.25, '하린']].forEach(function (t) {
  var mm = t[0] * 25.4;
  var base = P._aspectBandGridPack(mk(6, mm), binW, binH, gap, null);
  var b = block(t[1]);
  var r = P._aspectBandGridPack(mk(6, mm), binW, binH, gap, [b]);
  var c = counts(r);
  console.log('  ' + (t[0] + '" / ' + t[1]).padEnd(26) + '사진 ' + base.placed.length + '→' + c.photos +
    '  뺀 ' + r.letterEvicted + '  유닛 ' + b.unitMm + 'mm  ' +
    (b.cellW / MM).toFixed(1) + '×' + (b.cellH / MM).toFixed(1) + 'mm');
  chk(t[0] + '" / "' + t[1] + '" 배치됨', r.letterAttachedCount === 1);
  chk(t[0] + '" / "' + t[1] + '" 사진 손실 ≤ 6장', r.letterEvicted <= 6, r.letterEvicted + '장');
});

console.log('\n══ 이름 아래 채움 + 기하 안전성 (전 사이즈) ══');
// 전 사이즈도 이름 아래가 21~28mm 비어 있었다. Package 와 같은 규칙으로 채운다.
// 단일 사이즈는 사진이 전부 같은 크기라 그 틈(9~15mm)에 들어갈 후보가 없어 제외.
[1, 3, 8].forEach(function (n) {
  var base = P._packAllSizes(mk(n), binW, binH, gap, null);
  var b = block('Harin');
  var r = P._packAllSizes(mk(n), binW, binH, gap, [b]);
  var c = counts(r);
  console.log('  디자인' + n + '  사진 ' + base.placed.length + '→' + c.photos +
    '  채움 ' + r.letterFilled + '  뺀 ' + r.letterEvicted);
  chk('전 사이즈 디자인' + n + ': 이름 아래가 채워진다', r.letterFilled > 0, r.letterFilled + '장');
  // composite 은 새 기하다 — 겹침/시트밖을 반드시 검사한다
  var bad = 0;
  r.placed.forEach(function (q) {
    if (q.x < -0.01 || q.y < -0.01 || q.x + q.w > binW + 0.01 || q.y + q.h > binH + 0.01) bad++;
  });
  for (var i = 0; i < r.placed.length; i++) for (var j = i + 1; j < r.placed.length; j++) {
    var a = r.placed[i], d = r.placed[j];
    var ox = Math.min(a.x + a.w, d.x + d.w) - Math.max(a.x, d.x);
    var oy = Math.min(a.y + a.h, d.y + d.h) - Math.max(a.y, d.y);
    if (ox > 0.01 && oy > 0.01) bad++;
  }
  chk('전 사이즈 디자인' + n + ': 겹침·시트밖 0건', bad === 0, bad + '건');
});

console.log('\n' + ok.filter(Boolean).length + '/' + ok.length + ' 통과' + (ok.every(Boolean) ? '  ✅' : '  ❌'));
