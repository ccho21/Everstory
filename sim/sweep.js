var fs=require('fs');
var D=[['01','XXL',1.3889],['03','S',0.7017],['04','L',0.7872],['05','M',0.7957],['06','M',0.4094],
['07','XS',0.7387],['08','S',0.7387],['09','L',0.7478],['12','S',0.9299],['14','L',0.4889],
['15','M',0.8944],['16','S',0.8944],['17','L',0.6733],['18','L',1.0],['20','XXL',0.8044],
['21','L',0.9039],['23','L',0.7194],['26','L',0.8889],['27','M',0.7444],['29','M',0.8606],
['30','S',0.7811],['32','M',0.75],['33','L',1.2431],['34','M',0.7889],['35','L',0.7889]];
var PF=[['01','L',0.7256],['02','M',1.0],['03','M',0.733],['04','S',0.4756],['05','M',0.75],
['06','M',0.6828],['07','XXL',1.2839],['08','M',0.4167],['09','S',0.6161],['10','S',1.0095],
['11','S',0.7617],['12','S',0.8128],['13','M',0.6667],['14','S',1.1328],['15','XXL',0.7772],['16','L',0.6969]];
function build(thr){
  var s=fs.readFileSync('packer.js','utf8')
   .replace("      if (!orRow.tierLock || !tierNoRows[orRow.tierLock]) continue;",
     "      if (!orRow.tierLock) continue;\n      if (!tierNoRows[orRow.tierLock] && orRow.w >= binW * ORPHAN_FILL_MIN_WIDTH) continue;")
   .replace("          if (counts[op.base] >= _pkgMax(op.tier)) continue;",
     ["          if (counts[op.base] >= _pkgMax(op.tier)) continue;","          var _mn = 1e9;",
      "          for (var _b = 0; _b < orGrp.length; _b++) { if (counts[orGrp[_b].base] < _mn) _mn = counts[orGrp[_b].base]; }",
      "          if (counts[op.base] > _mn) continue;"].join('\n'));
  var f='_sw_'+String(thr).replace('.','_')+'.js';
  fs.writeFileSync(f,'var ORPHAN_FILL_MIN_WIDTH='+thr+';\n'+s); return require('./'+f);
}
function m(P,data,n){
  var MM=P.MM_TO_PT,binW=138*MM,binH=171*MM,gap=P.GAP_DEFAULT_MM*MM;
  var pairs=data.map(function(d){return {base:d[0],aspect:d[2],tier:d[1],bucket:P.TIER_TO_BUCKET[d[1]]};});
  var plan=P._planPackageSheets(pairs,n,binW,binH,gap);
  var st=0,worst=0,sumFree=0,fills=[],maxSpread=0;
  plan.sheets.forEach(function(s){
    P._resetPackState(s.pairs); var r=P._packPackage(s.pairs,binW,binH,gap);
    st+=r.placed.length; fills.push(P._sheetFill(r,binW,binH));
    r.rows.forEach(function(R){var f=(binW-R.w)/MM; sumFree+=Math.max(0,f); if(f>worst)worst=f;});
    // tier 안 장수 편차 (균일성 지표)
    var byTier={};
    r.placed.forEach(function(p){var t=p.payload.tier,b=p.payload.base;
      (byTier[t]=byTier[t]||{})[b]=(byTier[t][b]||0)+1;});
    Object.keys(byTier).forEach(function(t){var v=Object.keys(byTier[t]).map(function(b){return byTier[t][b];});
      var sp=Math.max.apply(null,v)-Math.min.apply(null,v); if(sp>maxSpread)maxSpread=sp;});
  });
  return {st:st,worst:worst,sumFree:sumFree,fills:fills,spread:maxSpread};
}
console.log('thresh  ┃ 누리25/2시트: 충전 · 스티커 · 최악 · 총잔여 · tier편차  ┃ PkgFull16/2시트');
[null,0.60,0.70,0.75,0.85,0.95].forEach(function(t){
  var P = t===null ? require('./packer.js') : build(t);
  var a=m(P,D,2), b=m(P,PF,2);
  console.log(String(t===null?'현재':t).padEnd(7)+' ┃ '+
    a.fills.map(function(f){return (f*100).toFixed(0)+'%';}).join('/').padEnd(9)+
    ' '+String(a.st).padStart(3)+'장 '+a.worst.toFixed(0).padStart(4)+'mm '+
    a.sumFree.toFixed(0).padStart(4)+'mm  ±'+a.spread+'      ┃ '+
    b.fills.map(function(f){return (f*100).toFixed(0)+'%';}).join('/')+' '+b.st+'장 '+
    b.worst.toFixed(0)+'mm ±'+b.spread);
});
