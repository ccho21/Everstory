// 구현 검증: 실 .jsx 의 _planPackageSheets 를 그대로 호출한다 (시뮬 재구현 아님).
var P=require('./packer.js'); var MM=P.MM_TO_PT;
var binW=138*MM, binH=171*MM, gap=P.GAP_DEFAULT_MM*MM;
// projects/Package Full/02_cutout — 파일명 토큰은 레거시 6티어라 _bucketOf 가 버킷을 유도해야 한다.
var DATA=[['01','L',0.7256],['02','M',1.0],['03','M',0.733],['04','S',0.4756],['05','M',0.75],
  ['06','M',0.6828],['07','XXL',1.2839],['08','M',0.4167],['09','S',0.6161],['10','S',1.0095],
  ['11','S',0.7617],['12','S',0.8128],['13','M',0.6667],['14','S',1.1328],['15','XXL',0.7772],['16','L',0.6969]];
function pairs(withBucket){return DATA.map(function(d){
  var o={base:'PF_'+d[0],aspect:d[2],tier:d[1]};
  if(withBucket) o.bucket=P.TIER_TO_BUCKET[d[1]];
  return o;});}
function tstr(t){return ['XXL','XL','L','M','S','XS'].filter(function(k){return t[k];})
  .map(function(k){return k+t[k];}).join(' ');}
function report(label,ps,n){
  var plan=P._planPackageSheets(ps,n,binW,binH,gap);
  console.log('\n'+label+'  ('+n+'시트)   승자 사다리 = '+plan.ladder.key+
    '   경고 '+plan.warn+'   최저충전 '+(plan.minFill*100).toFixed(1)+'%');
  var totSt=0,totDz=0,seen={};
  plan.sheets.forEach(function(s,i){
    P._resetPackState(s.pairs);
    var r=P._packPackage(s.pairs,binW,binH,gap);
    var tc={};r.placed.forEach(function(pl){tc[pl.payload.tier]=(tc[pl.payload.tier]||0)+1;});
    s.pairs.forEach(function(p){if(!seen[p.base]){seen[p.base]=1;totDz++;}});
    totSt+=r.placed.length;
    console.log('  시트'+(i+1)+': 충전 '+(P._sheetFill(r,binW,binH)*100).toFixed(1)+'%  스티커 '+
      r.placed.length+'장  디자인 '+s.pairs.length+'개  ['+tstr(tc)+']'+
      (r.leftover.length?'  ⚠미배치 '+r.leftover.length:'')+
      (r.minShortfall&&r.minShortfall.length?'  ⚠min미달 '+r.minShortfall.length:''));
  });
  console.log('  합계: 스티커 '+totSt+'장 / 디자인 '+totDz+'/16');
  return {st:totSt,dz:totDz,fill:plan.minFill};
}

console.log('══ 구현 검증 — 실 .jsx _planPackageSheets 직접 호출 ══');
var a=report('레거시 6티어 파일명 (bucket 필드 없음 → _bucketOf 유도)',pairs(false),2);
var b=report('신 3버킷 파일명 (_BIG/_MED/_SML)',pairs(true),2);

console.log('\n── 불변식 검사 ──');
console.log('  레거시 유도 == 신 버킷 결과 동일: '+
  (a.st===b.st&&a.dz===b.dz?'✅ (스티커 '+a.st+'장 동일)':'❌ '+a.st+' vs '+b.st));
console.log('  전 디자인 출력(누락 0): '+(b.dz===16?'✅ 16/16':'❌ '+b.dz+'/16'));
var plan=P._planPackageSheets(pairs(true),2,binW,binH,gap);
var where={},dup=0;
plan.sheets.forEach(function(s,i){s.pairs.forEach(function(p){
  if(where[p.base]!==undefined&&where[p.base]!==i)dup++; where[p.base]=i;});});
console.log('  시트 배타성(같은 디자인 중복 없음): '+(dup===0?'✅':'❌ '+dup+'건'));

report('Mini 경로',pairs(true),1);
report('3시트 경로',pairs(true),3);

var t0=Date.now();for(var i=0;i<200;i++)P._planPackageSheets(pairs(true),2,binW,binH,gap);
console.log('\n계획 수립 비용: '+((Date.now()-t0)/200).toFixed(2)+'ms/회');
