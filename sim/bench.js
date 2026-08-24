var P=require('./packer.js'); var MM=P.MM_TO_PT;
var binW=138*MM,binH=171*MM,gap=P.GAP_DEFAULT_MM*MM;
var T=['XXL','XL','L','M','S','XS'];
function gen(n,seed){var o=[];for(var i=0;i<n;i++){
  var t=T[(i*7+seed)%6], a=0.4+((i*37+seed*13)%70)/100;
  o.push({base:'d'+i,aspect:a,tier:t,bucket:P.TIER_TO_BUCKET[t]});}return o;}
function bench(n,sheets,iters){
  var t0=process.hrtime.bigint();
  for(var i=0;i<iters;i++){P._planPackageSheets(gen(n,i),sheets,binW,binH,gap);}
  var ms=Number(process.hrtime.bigint()-t0)/1e6/iters;
  return ms;
}
console.log('디자인수  시트  계획수립(ms)   [사다리 4개 × 시트 전부 패킹]');
[[8,2],[16,2],[25,2],[25,3],[40,3],[80,4],[160,4]].forEach(function(c){
  var it = c[0]>40?20:200;
  console.log(String(c[0]).padStart(6)+String(c[1]).padStart(6)+'   '+bench(c[0],c[1],it).toFixed(2).padStart(8));
});
// 메모리: 반복 실행 시 heap 증가 여부 (JS 층 릭 검사)
if(global.gc) global.gc();
var m0=process.memoryUsage().heapUsed;
for(var k=0;k<3000;k++) P._planPackageSheets(gen(25,k%17),2,binW,binH,gap);
if(global.gc) global.gc();
var m1=process.memoryUsage().heapUsed;
console.log('\nJS 층 릭 검사: 계획수립 3000회 후 heap 증가 '+((m1-m0)/1048576).toFixed(2)+' MB'+
  (Math.abs(m1-m0)/1048576 < 5 ? '  ✅ 누수 없음' : '  ⚠ 확인 필요'));
