// 최종안: 스크립트가 후보 정책을 전부 패킹해보고 충전율 최고를 자동 선택 (운영자 결정 0)
var P=require('./packer.js'); var MM=P.MM_TO_PT;
var binW=138*MM,binH=171*MM,gap=P.GAP_DEFAULT_MM*MM,SHEET_AREA=binW*binH;
var DATA=[['01','L',0.7256],['02','M',1.0],['03','M',0.733],['04','S',0.4756],['05','M',0.75],
  ['06','M',0.6828],['07','FAM',1.2839],['08','M',0.4167],['09','S',0.6161],['10','S',1.0095],
  ['11','S',0.7617],['12','S',0.8128],['13','M',0.6667],['14','S',1.1328],['15','FAM',0.7772],['16','L',0.6969]];
var T2B={FAM:'BIG',XXL:'BIG',XL:'BIG',L:'MED',M:'MED',S:'SML',XS:'SML'};
var ALL=DATA.map(function(d){return {id:d[0],bucket:T2B[d[1]],aspect:d[2]};});
var TIERS=['XXL','XL','L','M','S','XS'];
var CANDIDATES={
  'A':{BIG:['XXL','XL'],MED:['L','M'],    SML:['S','XS']},
  'B':{BIG:['XXL','XL'],MED:['L','M','M'],SML:['XS','S','XS']},
  'C':{BIG:['XXL','XL'],MED:['L','M','M'],SML:['S','XS','XS']},
  'D':{BIG:['XXL','XL'],MED:['L','M'],    SML:['S','XS','XS']}
};
function subset(nB,nM,nS){var o=[];[['BIG',nB],['MED',nM],['SML',nS]].forEach(function(x){
  o=o.concat(ALL.filter(function(d){return d.bucket===x[0];}).slice(0,x[1]));});return o;}
function deal(ds,n){var s=[];for(var i=0;i<n;i++)s.push([]);
  ['BIG','MED','SML'].forEach(function(b){ds.filter(function(d){return d.bucket===b;})
    .forEach(function(d,i){s[i%n].push(d);});});return s;}
function assign(sd,pol){var c={BIG:0,MED:0,SML:0};return sd.map(function(d){
  var L=pol[d.bucket],t=L[c[d.bucket]%L.length];c[d.bucket]++;
  return {base:'PF_'+d.id,aspect:d.aspect,tier:t};});}
function pack(pairs){var r=P._packPackage(pairs,binW,binH,gap),a=0,tc={},bb={};
  r.placed.forEach(function(p){a+=p.w*p.h;tc[p.payload.tier]=(tc[p.payload.tier]||0)+1;
    bb[p.payload.base]=(bb[p.payload.base]||0)+1;});
  return {fill:a/SHEET_AREA,st:r.placed.length,dz:Object.keys(bb).length,tiers:tc,
    nt:Object.keys(tc).length,warn:r.leftover.length+(r.minShortfall?r.minShortfall.length:0)};}
// 자동 선택: 후보 전부 돌려 (경고 최소 → 최저시트 충전 최대) 순으로 승자
function auto(ds,n){
  var best=null,bestKey='';
  Object.keys(CANDIDATES).forEach(function(k){
    var sh=deal(ds,n).map(function(sd){return pack(assign(sd,CANDIDATES[k]));});
    var m={sh:sh,warn:sh.reduce(function(a,s){return a+s.warn;},0),
      minFill:Math.min.apply(null,sh.map(function(s){return s.fill;})),
      fill:sh.reduce(function(a,s){return a+s.fill;},0)/n,
      st:sh.reduce(function(a,s){return a+s.st;},0)};
    if(!best || m.warn<best.warn || (m.warn===best.warn && m.minFill>best.minFill)){best=m;bestKey=k;}
  });
  best.key=bestKey; return best;
}
function tstr(t){return TIERS.filter(function(k){return t[k];}).map(function(k){return k+t[k];}).join(' ');}
function pad(s,n){s=String(s);while(s.length<n)s+=' ';return s;}

var SETS=[['10디자인 B2/M5/S3',subset(2,5,3)],['12디자인 B2/M6/S4',subset(2,6,4)],
          ['16디자인 B2/M8/S6',subset(2,8,6)],['16디자인 B4/M6/S6',subset(4,6,6)]];
// B4 케이스: MED 2개를 BIG 으로 재분류
SETS[3][1]=(function(){var m=0;return ALL.map(function(d){
  if(d.bucket==='MED'&&m<2){m++;return {id:d.id,bucket:'BIG',aspect:d.aspect};}return d;});})();

console.log('══ 자동 선택 결과 (2시트 고정) ══\n');
SETS.forEach(function(S){
  var r=auto(S[1],2);
  console.log(pad(S[0],20)+'선택='+r.key+'  평균충전 '+(r.fill*100).toFixed(1)+
    '%  최저시트 '+(r.minFill*100).toFixed(1)+'%  스티커 '+r.st+'장'+(r.warn?'  ⚠'+r.warn:''));
  r.sh.forEach(function(s,i){console.log('    시트'+(i+1)+': '+(s.fill*100).toFixed(1)+'%  '+
    s.st+'장  디자인 '+s.dz+'개  인치 '+s.nt+'종 ['+tstr(s.tiers)+']');});
  console.log('');
});

var t0=Date.now();
for(var i=0;i<50;i++){auto(SETS[2][1],2);}
console.log('비용: 후보 4개 × 2시트 자동선택 1회 = ' + ((Date.now()-t0)/50).toFixed(1) + 'ms (Illustrator API 호출 0)');
