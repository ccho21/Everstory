// 회귀: 단일 사이즈 / 전 사이즈 패커가 변경 전후 바이트 동일한 배치를 내는지.
var fs=require('fs'),cp=require('child_process');
var OLD='/private/tmp/claude-501/-Users-heatherchung-Desktop-EVERSTORY/77f1ec5f-8011-46e7-8ea3-eca1a90e5163/scratchpad/backup_before_multisheet.jsx';
var NEW='../Everstory_mixed.jsx';
// 최상위 심볼 전체를 추출해 비교 — 의존 목록을 손으로 관리하지 않는다.
[['old',OLD],['new',NEW]].forEach(function(x){
  cp.execSync('node extract_all.js "'+x[1]+'" packer_'+x[0]+'.js',{stdio:'inherit'});
});
// 알파벳 엔진 상수(INK 등)가 로드 시점에 Illustrator 색 객체를 만든다 — node 용 stub.
global.RGBColor=function(){this.red=0;this.green=0;this.blue=0;};
var A=require('./packer_old.js'), B=require('./packer_new.js');
var MM=A.MM_TO_PT, binW=138*MM, binH=171*MM, gap=A.GAP_DEFAULT_MM*MM;
var ASPECTS=[0.7256,1.0,0.733,0.4756,0.75,0.6828,1.2839,0.4167,0.6161,1.0095,0.7617,0.8128];
function mk(n,sizeMm){var o=[];for(var i=0;i<n;i++){
  var asp=ASPECTS[i%ASPECTS.length],p={base:'d'+i,aspect:asp};
  if(sizeMm){var s=sizeMm*MM; if(asp>=1){p.cellW=s;p.cellH=s/asp;}else{p.cellW=s*asp;p.cellH=s;} p.sizeMm=sizeMm;}
  o.push(p);}return o;}
function sig(r){return r.placed.map(function(p){
  return [p.x.toFixed(4),p.y.toFixed(4),p.w.toFixed(4),p.h.toFixed(4),p.payload.base,!!p.rotated].join(',');
}).join('|');}
var fails=0,runs=0;
[[1,'전 사이즈'],[3,'전 사이즈'],[8,'전 사이즈']].forEach(function(t){
  var sa=sig(A._packAllSizes(mk(t[0]),binW,binH,gap));
  var sb=sig(B._packAllSizes(mk(t[0]),binW,binH,gap));
  runs++; var ok=sa===sb; if(!ok)fails++;
  console.log((ok?'✅':'❌')+' '+t[1]+' 디자인'+t[0]+'  배치 '+sa.split('|').length+'개  '+(ok?'동일':'차이!'));
});
[19.05,25.4,31.75,38.1,50.8,63.5].forEach(function(mm){
  var n=Math.min(6,Math.floor(160/(mm/6)));
  var sa=sig(A._aspectBandGridPack(mk(n,mm),binW,binH,gap));
  var sb=sig(B._aspectBandGridPack(mk(n,mm),binW,binH,gap));
  runs++; var ok=sa===sb; if(!ok)fails++;
  console.log((ok?'✅':'❌')+' 단일 '+(mm/25.4).toFixed(2)+'in 디자인'+n+'  배치 '+sa.split('|').length+'개  '+(ok?'동일':'차이!'));
});
console.log('\n회귀 '+runs+'건 중 '+(runs-fails)+'건 완전 동일'+(fails?'  ❌ 차이 '+fails+'건':'  ✅ 회귀 0'));

// _packPackage 는 2026-08-22 고아 행 게이트만 의도적으로 변경했다 (누리 실시트의 1컷 106mm 공백).
// 따라서 "바이트 동일"이 아니라 **변화의 방향**을 검사한다: 컷은 늘거나 같고, 잔여 폭은 줄거나
// 같고, tier 안 장수 편차(균일성)는 나빠지지 않아야 한다.
console.log('\n── _packPackage 고아 행 패치 — 변화 방향 검사 ──');
var TIERSET=[['XXL',1.2839],['XL',0.75],['L',0.7256],['L',0.6969],['M',1.0],['M',0.733],
             ['M',0.6828],['S',0.4756],['S',0.6161],['S',1.0095],['XS',0.7617],['XS',0.8128]];
function pkgPairs(n){return TIERSET.slice(0,n).map(function(t,i){
  return {base:'p'+i,aspect:t[1],tier:t[0]};});}
function metrics(P,n){
  var r=P._packPackage(pkgPairs(n),binW,binH,gap);
  var free=0,spread=0,byTier={};
  r.rows.forEach(function(R){free+=Math.max(0,(binW-R.w)/MM);});
  r.placed.forEach(function(p){var t=p.payload.tier;
    (byTier[t]=byTier[t]||{})[p.payload.base]=(byTier[t][p.payload.base]||0)+1;});
  Object.keys(byTier).forEach(function(t){
    var v=Object.keys(byTier[t]).map(function(b){return byTier[t][b];});
    var sp=Math.max.apply(null,v)-Math.min.apply(null,v); if(sp>spread)spread=sp;});
  return {cuts:r.placed.length,free:free,spread:spread};
}
var bad=0;
[4,8,12].forEach(function(n){
  var o=metrics(A,n), w=metrics(B,n);
  var ok = w.cuts>=o.cuts && w.free<=o.free+0.01 && w.spread<=o.spread;
  if(!ok)bad++;
  console.log((ok?'✅':'❌')+' 디자인'+n+'  컷 '+o.cuts+'→'+w.cuts+
    '  총잔여 '+o.free.toFixed(0)+'→'+w.free.toFixed(0)+'mm'+
    '  tier편차 ±'+o.spread+'→±'+w.spread);
});
console.log(bad?'❌ 의도하지 않은 방향의 변화 '+bad+'건':'✅ 컷↑ 잔여↓ 균일성 유지 — 의도한 변화만');
