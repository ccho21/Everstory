// Neuri Park 실데이터로 행 구조 + 잔여 폭 진단
var P=require('./packer.js'); var MM=P.MM_TO_PT;
var binW=138*MM, binH=171*MM, gap=P.GAP_DEFAULT_MM*MM;
var D=[['01','XXL',1.3889],['03','S',0.7017],['04','L',0.7872],['05','M',0.7957],['06','M',0.4094],
['07','XS',0.7387],['08','S',0.7387],['09','L',0.7478],['12','S',0.9299],['14','L',0.4889],
['15','M',0.8944],['16','S',0.8944],['17','L',0.6733],['18','L',1.0],['20','XXL',0.8044],
['21','L',0.9039],['23','L',0.7194],['26','L',0.8889],['27','M',0.7444],['29','M',0.8606],
['30','S',0.7811],['32','M',0.75],['33','L',1.2431],['34','M',0.7889],['35','L',0.7889]];
function mk(){return D.map(function(d){return {base:'누리_'+d[0],aspect:d[2],tier:d[1],
  bucket:P.TIER_TO_BUCKET[d[1]]};});}
var c={BIG:0,MED:0,SML:0}; mk().forEach(function(p){c[p.bucket]++;});
console.log('입력 25디자인  BIG '+c.BIG+' / MED '+c.MED+' / SML '+c.SML);

var plan=P._planPackageSheets(mk(),2,binW,binH,gap);
console.log('승자 사다리 '+plan.ladder.key+'  경고 '+plan.warn+'\n');
plan.sheets.forEach(function(s,si){
  P._resetPackState(s.pairs);
  var r=P._packPackage(s.pairs,binW,binH,gap);
  console.log('━━ 시트'+(si+1)+'  디자인 '+s.pairs.length+'개  충전 '+
    (P._sheetFill(r,binW,binH)*100).toFixed(1)+'%  스티커 '+r.placed.length+'장  행 '+r.rows.length+'개');
  // placed 를 y 로 묶어 실제 행 재구성 (rows.y 는 정렬 후 stale)
  var byRow={};
  r.placed.forEach(function(p){
    var k=Math.round(p.y/2)*2;
    if(!byRow[k])byRow[k]={y:p.y,items:[],minX:1e9,maxX:-1e9,h:0};
    byRow[k].items.push(p);
    if(p.x<byRow[k].minX)byRow[k].minX=p.x;
    if(p.x+p.w>byRow[k].maxX)byRow[k].maxX=p.x+p.w;
    if(p.h>byRow[k].h)byRow[k].h=p.h;
  });
  Object.keys(byRow).map(Number).sort(function(a,b){return a-b;}).forEach(function(k){
    var R=byRow[k];
    var used=0; R.items.forEach(function(p){used+=p.w;});
    var span=(R.maxX-R.minX)/MM, free=(binW-used-gap*(R.items.length-1))/MM;
    var tiers={}; R.items.forEach(function(p){tiers[p.payload.tier]=(tiers[p.payload.tier]||0)+1;});
    var ts=Object.keys(tiers).map(function(t){return t+'×'+tiers[t];}).join(' ');
    var flag = free>25 ? '   ⚠ 잔여 '+free.toFixed(0)+'mm' : '';
    console.log('   y'+(R.y/MM).toFixed(0).padStart(3)+'mm  높이'+(R.h/MM).toFixed(0).padStart(3)+
      'mm  '+String(R.items.length).padStart(2)+'컷  '+ts.padEnd(16)+
      ' 폭사용 '+((used/binW)*100).toFixed(0).padStart(3)+'%'+flag);
  });
  console.log('');
});
