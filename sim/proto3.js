// B+C 결합: 채울 수 있는 행은 채우고(B), 못 채우는 고아 행은 해소(C).
var fs=require('fs');
function build(withB, withC, thr, minw){
  var s=fs.readFileSync('packer.js','utf8');
  if(withB){
    s=s.replace("      if (!orRow.tierLock || !tierNoRows[orRow.tierLock]) continue;",
      "      if (!orRow.tierLock) continue;\n      if (!tierNoRows[orRow.tierLock] && orRow.w >= binW * ORPHAN_FILL_MIN_WIDTH) continue;");
    s=s.replace("          if (counts[op.base] >= _pkgMax(op.tier)) continue;",
      ["          if (counts[op.base] >= _pkgMax(op.tier)) continue;",
       "          var _mn = 1e9;",
       "          for (var _b = 0; _b < orGrp.length; _b++) { if (counts[orGrp[_b].base] < _mn) _mn = counts[orGrp[_b].base]; }",
       "          if (counts[op.base] > _mn) continue;"].join('\n'));
  }
  if(withC){
    s=s.replace("    var placed = _shelfRowsToPlaced(rows, binW, binH, gap);",
      [ "    var _minRowW = binW * ORPHAN_ROW_MIN_W;",
        "    for (var dr = rows.length - 1; dr >= 0; dr--) {",
        "      var R = rows[dr];",
        "      if (R.w >= _minRowW) continue;",
        "      var survivors = [];",
        "      for (var it = 0; it < R.items.length; it++) {",
        "        var item = R.items[it];",
        "        if (item.isVStack) { survivors.push(item); continue; }",
        "        var moved = false;",
        "        for (var tr = 0; tr < rows.length && !moved; tr++) {",
        "          if (tr === dr) continue;",
        "          var T = rows[tr];",
        "          if (T.w + gap + item.w > binW) continue;",
        "          if (item.h > T.h) continue;",
        "          _addToShelfRow(T, item, gap); moved = true;",
        "        }",
        "        if (moved) continue;",
        "        if (counts[item.payload.base] > 1) { counts[item.payload.base]--; continue; }",
        "        survivors.push(item);",
        "      }",
        "      if (survivors.length === 0) { rows.splice(dr, 1); continue; }",
        "      R.items = []; R.w = 0; R.h = 0;",
        "      for (var sv = 0; sv < survivors.length; sv++) _addToShelfRow(R, survivors[sv], gap);",
        "    }",
        "    var placed = _shelfRowsToPlaced(rows, binW, binH, gap);"].join('\n'));
  }
  var f='_tmp_'+(withB?'B':'')+(withC?'C':'')+'.js';
  fs.writeFileSync(f,'var ORPHAN_FILL_MIN_WIDTH='+thr+';\nvar ORPHAN_ROW_MIN_W='+minw+';\n'+s);
  return require('./'+f);
}
var D=[['01','XXL',1.3889],['03','S',0.7017],['04','L',0.7872],['05','M',0.7957],['06','M',0.4094],
['07','XS',0.7387],['08','S',0.7387],['09','L',0.7478],['12','S',0.9299],['14','L',0.4889],
['15','M',0.8944],['16','S',0.8944],['17','L',0.6733],['18','L',1.0],['20','XXL',0.8044],
['21','L',0.9039],['23','L',0.7194],['26','L',0.8889],['27','M',0.7444],['29','M',0.8606],
['30','S',0.7811],['32','M',0.75],['33','L',1.2431],['34','M',0.7889],['35','L',0.7889]];
var PF=[['01','L',0.7256],['02','M',1.0],['03','M',0.733],['04','S',0.4756],['05','M',0.75],
['06','M',0.6828],['07','XXL',1.2839],['08','M',0.4167],['09','S',0.6161],['10','S',1.0095],
['11','S',0.7617],['12','S',0.8128],['13','M',0.6667],['14','S',1.1328],['15','XXL',0.7772],['16','L',0.6969]];
function score(P,data,n,label){
  var MM=P.MM_TO_PT,binW=138*MM,binH=171*MM,gap=P.GAP_DEFAULT_MM*MM;
  var pairs=data.map(function(d){return {base:d[0],aspect:d[2],tier:d[1],bucket:P.TIER_TO_BUCKET[d[1]]};});
  var plan=P._planPackageSheets(pairs,n,binW,binH,gap);
  var orph=0,worst=0,st=0,fills=[],lonely=0,sumFree=0;
  plan.sheets.forEach(function(s){
    P._resetPackState(s.pairs);
    var r=P._packPackage(s.pairs,binW,binH,gap);
    st+=r.placed.length; fills.push(P._sheetFill(r,binW,binH));
    r.rows.forEach(function(R){var free=(binW-R.w)/MM; sumFree+=Math.max(0,free);
      if(free>25){orph++; if(free>worst)worst=free;}
      if(R.items.length===1&&free>40)lonely++;});
  });
  console.log(label.padEnd(12)+' 충전 '+fills.map(function(f){return (f*100).toFixed(0)+'%';}).join('/').padEnd(14)+
    ' 스티커 '+String(st).padStart(3)+'  빈행 '+String(orph).padStart(2)+'  외톨이 '+String(lonely).padStart(2)+
    '  최악 '+worst.toFixed(0).padStart(3)+'mm  총잔여 '+sumFree.toFixed(0).padStart(3)+'mm  경고 '+plan.warn);
}
var V={ '현재':require('./packer.js'), 'B만':build(1,0,0.75,0.6),
        'C만':build(0,1,0.75,0.6), 'B+C':build(1,1,0.75,0.6) };
[['누리 25디자인 / 2시트',D,2],['누리 25디자인 / 3시트',D,3],['Package Full 16 / 2시트',PF,2]]
 .forEach(function(t){ console.log('\n══ '+t[0]+' ══');
   Object.keys(V).forEach(function(k){ score(V[k],t[1],t[2],k); }); });
