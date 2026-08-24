var P=require(process.env.MOD); var MM=P.MM_TO_PT;
var binW=138*MM,binH=171*MM,gap=P.GAP_DEFAULT_MM*MM;
var D=[['01','XXL',1.3889],['03','S',0.7017],['04','L',0.7872],['05','M',0.7957],['06','M',0.4094],
['07','XS',0.7387],['08','S',0.7387],['09','L',0.7478],['12','S',0.9299],['14','L',0.4889],
['15','M',0.8944],['16','S',0.8944],['17','L',0.6733],['18','L',1.0],['20','XXL',0.8044],
['21','L',0.9039],['23','L',0.7194],['26','L',0.8889],['27','M',0.7444],['29','M',0.8606],
['30','S',0.7811],['32','M',0.75],['33','L',1.2431],['34','M',0.7889],['35','L',0.7889]];
var pairs=D.map(function(d){return {base:d[0],aspect:d[2],tier:d[1],bucket:P.TIER_TO_BUCKET[d[1]]};});
var plan=P._planPackageSheets(pairs,2,binW,binH,gap);
plan.sheets.forEach(function(s,si){
  P._resetPackState(s.pairs);
  var r=P._packPackage(s.pairs,binW,binH,gap);
  console.log('시트'+(si+1)+'  충전 '+(P._sheetFill(r,binW,binH)*100).toFixed(1)+'%  스티커 '+r.placed.length);
  r.rows.forEach(function(R,i){
    var free=(binW-R.w)/MM, n=0, who=[];
    R.items.forEach(function(it){ if(it.isVStack){n+=it.cells.length; who.push('[column '+it.cells.length+'단]');}
      else {n++; who.push(it.payload.base+(it.rotated?'↻':''));} });
    console.log('  행'+(i+1)+' tier '+String(R.tierLock).padEnd(3)+' h'+(R.h/MM).toFixed(0).padStart(3)+
      'mm '+String(n).padStart(2)+'컷  잔여'+free.toFixed(0).padStart(4)+'mm  '+who.join(' '));
  });
});
