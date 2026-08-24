// 프로토타입 A: 3시트로 늘리면 해결되나
// 프로토타입 B: 고아 행 채움 게이트를 "폭 사용률" 기준으로 확대 (±1 균형 유지)
var fs=require('fs');
var src=fs.readFileSync('packer.js','utf8');

// B 패치: tierNoRows 게이트 → (tierNoRows 이거나) 폭 사용률 미달 행도 대상.
// 추가 시 tier 안 최소 카운트 디자인만 허용 → ±1 균형 (column 채움과 같은 규칙).
var OLD="      if (!orRow.tierLock || !tierNoRows[orRow.tierLock]) continue;";
var NEW=[
"      if (!orRow.tierLock) continue;",
"      if (!tierNoRows[orRow.tierLock] && orRow.w >= binW * ORPHAN_FILL_MIN_WIDTH) continue;"].join('\n');
if(src.indexOf(OLD)<0) throw new Error('게이트 패턴 불일치');
var OLD2="          if (counts[op.base] >= _pkgMax(op.tier)) continue;";
var NEW2=[
"          if (counts[op.base] >= _pkgMax(op.tier)) continue;",
"          var _mn = 1e9;",
"          for (var _b = 0; _b < orGrp.length; _b++) { if (counts[orGrp[_b].base] < _mn) _mn = counts[orGrp[_b].base]; }",
"          if (counts[op.base] > _mn) continue;"].join('\n');
var patched='var ORPHAN_FILL_MIN_WIDTH = '+(process.env.THRESH||0.75)+';\n'+
  src.replace(OLD,NEW).replace(OLD2,NEW2);
fs.writeFileSync('packer_proto.js',patched);

var MM=require('./packer.js').MM_TO_PT;
var binW=138*MM, binH=171*MM;
var D=[['01','XXL',1.3889],['03','S',0.7017],['04','L',0.7872],['05','M',0.7957],['06','M',0.4094],
['07','XS',0.7387],['08','S',0.7387],['09','L',0.7478],['12','S',0.9299],['14','L',0.4889],
['15','M',0.8944],['16','S',0.8944],['17','L',0.6733],['18','L',1.0],['20','XXL',0.8044],
['21','L',0.9039],['23','L',0.7194],['26','L',0.8889],['27','M',0.7444],['29','M',0.8606],
['30','S',0.7811],['32','M',0.75],['33','L',1.2431],['34','M',0.7889],['35','L',0.7889]];
function run(P,n,label){
  var gap=P.GAP_DEFAULT_MM*MM;
  var pairs=D.map(function(d){return {base:'누리_'+d[0],aspect:d[2],tier:d[1],bucket:P.TIER_TO_BUCKET[d[1]]};});
  var plan=P._planPackageSheets(pairs,n,binW,binH,gap);
  var orphans=0,worst=0,totSt=0,fills=[];
  plan.sheets.forEach(function(s){
    P._resetPackState(s.pairs);
    var r=P._packPackage(s.pairs,binW,binH,gap);
    totSt+=r.placed.length; fills.push(P._sheetFill(r,binW,binH));
    var byRow={};
    r.placed.forEach(function(p){var k=Math.round(p.y/2)*2;
      if(!byRow[k])byRow[k]={items:[],used:0};
      byRow[k].items.push(p); byRow[k].used+=p.w;});
    Object.keys(byRow).forEach(function(k){
      var free=(binW-byRow[k].used-gap*(byRow[k].items.length-1))/MM;
      if(free>25){orphans++; if(free>worst)worst=free;}
    });
  });
  console.log(label.padEnd(34)+' 시트'+n+
    '  충전 '+fills.map(function(f){return (f*100).toFixed(0)+'%';}).join('/')+
    '  스티커 '+String(totSt).padStart(3)+
    '  빈행(잔여>25mm) '+String(orphans).padStart(2)+'개  최악 '+worst.toFixed(0)+'mm'+
    '  경고 '+plan.warn);
}
var BASE=require('./packer.js'), PROTO=require('./packer_proto.js');
console.log('── 현재 코드 ──');
run(BASE,2,'현재'); run(BASE,3,'현재');
console.log('\n── 프로토타입 B (고아 행 폭 게이트 '+(process.env.THRESH||0.75)+' + ±1 균형) ──');
run(PROTO,2,'proto'); run(PROTO,3,'proto');
