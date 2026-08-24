var P=require(process.env.MOD||'./packer_proto.js'); var MM=P.MM_TO_PT;
var binW=138*MM, binH=171*MM, gap=P.GAP_DEFAULT_MM*MM;
var D=[['01','XXL',1.3889],['03','S',0.7017],['04','L',0.7872],['05','M',0.7957],['06','M',0.4094],
['07','XS',0.7387],['08','S',0.7387],['09','L',0.7478],['12','S',0.9299],['14','L',0.4889],
['15','M',0.8944],['16','S',0.8944],['17','L',0.6733],['18','L',1.0],['20','XXL',0.8044],
['21','L',0.9039],['23','L',0.7194],['26','L',0.8889],['27','M',0.7444],['29','M',0.8606],
['30','S',0.7811],['32','M',0.75],['33','L',1.2431],['34','M',0.7889],['35','L',0.7889]];
var pairs=D.map(function(d){return {base:'누리_'+d[0],aspect:d[2],tier:d[1],bucket:P.TIER_TO_BUCKET[d[1]]};});
var plan=P._planPackageSheets(pairs,2,binW,binH,gap);
plan.sheets.forEach(function(s,si){
  P._resetPackState(s.pairs);
  var r=P._packPackage(s.pairs,binW,binH,gap);
  console.log('━━ 시트'+(si+1)+'  충전 '+(P._sheetFill(r,binW,binH)*100).toFixed(1)+'%  스티커 '+r.placed.length);
  var byRow={};
  r.placed.forEach(function(p){var k=Math.round(p.y/2)*2;
    if(!byRow[k])byRow[k]={y:p.y,items:[],used:0,h:0};
    byRow[k].items.push(p); byRow[k].used+=p.w; if(p.h>byRow[k].h)byRow[k].h=p.h;});
  Object.keys(byRow).map(Number).sort(function(a,b){return a-b;}).forEach(function(k){
    var R=byRow[k];
    var free=(binW-R.used-gap*(R.items.length-1))/MM;
    var who={}; R.items.forEach(function(p){who[p.payload.base]=(who[p.payload.base]||0)+1;});
    console.log('  y'+(R.y/MM).toFixed(0).padStart(3)+' h'+(R.h/MM).toFixed(0).padStart(3)+
      ' '+String(R.items.length).padStart(2)+'컷 잔여'+free.toFixed(0).padStart(4)+'mm  '+
      Object.keys(who).map(function(b){return b.replace('누리_','')+(who[b]>1?'×'+who[b]:'');}).join(' '));
  });
});
