// 이름 스티커(캘리 통짜) — 부착 로직 + 실제 시트 영향.
// _nameStickerSpec 은 아웃라인 실측에 문서가 필요해 node 로 못 부른다 →
// 실측 폰트 메트릭에서 나온 치수를 스펙으로 넣어 **부착·패킹만** 검증한다.
global.RGBColor=function(){};
var P=require('./packer.js'); var MM=P.MM_TO_PT;
var binW=142*MM, binH=172*MM, gap=P.GAP_DEFAULT_MM*MM;  // body 142×175 − padding X0/Y1.5
var ok=[]; function chk(n,c,x){ok.push(c);console.log((c?'✅':'❌')+' '+n+(x?'   '+x:''));}

// Bagel Fat One 실측 비율 (잉크 폭/높이)
var RATIO={'하린':2.06,'Harin':3.36,'Emma':3.79,'Harin Cho':5.79,'Christopher':5.86};
function spec(text,H,tag){
  var halo=H*P.NAME_HALO_RATIO, ink=H-2*halo;
  var w=ink*RATIO[text]+2*halo;
  return {base:'__NAME_'+tag+'__',isLetterBlock:true,text:text,
          cellW:w*MM, cellH:H*MM, aspect:1,_w:w,_h:H};
}
// 실코드와 같은 구성: 알파벳 프레임 1개(히어로 우선) + 캘리 통짜 N개(빈 공간)
function stickers(text){
  var o=[];
  var a=P._letterBlockSpec(text,P.LETTER_UNIT_MM,'ALPHA');
  if(a){ a.isAlphabetBlock=true; a.preferHero=true; a.shapes=P._letterShapeCandidates(a); o.push(a); }
  for(var i=0;i<P.NAME_CALLI_COUNT;i++){
    var sp=spec(text,(i===0)?P.NAME_BIG_H_MM:P.NAME_SMALL_H_MM,'C'+(i+1));
    sp.preferHero=false; o.push(sp);
  }
  return o;
}
console.log('══ 치수 (실측 폰트 메트릭 기반) ══');
Object.keys(RATIO).forEach(function(t){
  var b=spec(t,P.NAME_BIG_H_MM,'BIG'), s=spec(t,P.NAME_SMALL_H_MM,'S1');
  console.log('  '+t.padEnd(14)+' 큰 '+b._w.toFixed(0)+'×'+b._h+'mm    작은 '+s._w.toFixed(0)+'×'+s._h+'mm');
});
var h=spec('Harin',P.NAME_BIG_H_MM,'BIG');
chk('큰 이름 높이 = 9.5mm', Math.abs(h._h-9.5)<0.01);
chk('작은 이름 높이 = 7mm', Math.abs(spec('Harin',P.NAME_SMALL_H_MM,'S1')._h-7)<0.01);
chk('스티커 '+(1+P.NAME_CALLI_COUNT)+'개 (알파벳1 + 캘리'+P.NAME_CALLI_COUNT+')', stickers('Harin').length===1+P.NAME_CALLI_COUNT);
chk('첫 개 = 알파벳 프레임 · 히어로 우선', stickers('Harin')[0].isAlphabetBlock===true && stickers('Harin')[0].preferHero===true);
chk('나머지 = 캘리 통짜 · 빈공간', stickers('Harin').slice(1).every(function(x){return !x.isAlphabetBlock && x.preferHero===false;}));

console.log('\n══ 알파벳 블록 — 단어 = 한 줄 (2026-08-23) ══');
function ab(n){ return P._letterBlockSpec(n,P.LETTER_UNIT_MM,'ALPHA'); }
function lines(n){ return ab(n).lines.map(function(l){return l.join('');}); }
['하린','Emma','Charles','Charles Cho','Anne Marie Kim','Christopher'].forEach(function(n){
  var b=ab(n);
  console.log('  '+n.padEnd(15)+' ['+lines(n).join(' / ')+']  '+
    (b.cellW/MM).toFixed(1)+'×'+(b.cellH/MM).toFixed(1)+'mm');
});
chk('스페이스 없으면 무조건 한 줄', ab('Christopher').lines.length===1 && ab('하린').lines.length===1);
chk('스페이스에서만 줄바꿈 · 단어 안 끊김',
    lines('Charles Cho').join('|')==='Charles|Cho' && lines('Anne Marie Kim').join('|')==='Anne|Marie|Kim');
chk('블록 폭 = 가장 긴 줄', ab('Charles Cho').maxLen===7 && ab('Harin Cho').maxLen===5);
chk('간격 = 유닛 × '+P.LETTER_GAP_RATIO,
    Math.abs(ab('Emma').innerGap - ab('Emma').unit*P.LETTER_GAP_RATIO)<1e-9,
    (ab('Emma').innerGap/MM).toFixed(2)+'mm @ 유닛 9.5mm');

console.log('\n══ 실 시트 배치 (하린 25디자인 / 2시트) ══');
var D=[['01','XXL',1.3889],['03','S',0.7017],['04','L',0.7872],['05','M',0.7957],['06','M',0.4094],
['07','XS',0.7387],['08','S',0.7387],['09','L',0.7478],['12','S',0.9299],['14','L',0.4889],
['15','M',0.8944],['16','S',0.8944],['17','L',0.6733],['18','L',1.0],['20','XXL',0.8044],
['21','L',0.9039],['23','L',0.7194],['26','L',0.8889],['27','M',0.7444],['29','M',0.8606],
['30','S',0.7811],['32','M',0.75],['33','L',1.2431],['34','M',0.7889],['35','L',0.7889]];
function ph(){return D.map(function(d){return {base:'p'+d[0],aspect:d[2],tier:d[1],bucket:P.TIER_TO_BUCKET[d[1]]};});}
function run(label,blocks){
  var plan=P._planPackageSheets(ph(),2,binW,binH,gap);
  var photos=0,names=0,fills=[],att=0,want=blocks?blocks.length:0;
  plan.sheets.forEach(function(s,i){
    P._resetPackState(s.pairs);
    var bl=(i===0)?blocks:null;
    var r=P._packPackage(s.pairs,binW,binH,gap,bl);
    fills.push(P._sheetFill(r,binW,binH));
    r.placed.forEach(function(p){ if(p.payload.isLetterBlock)names++; else photos++; });
    if(bl)att=r.letterAttachedCount||0;
  });
  console.log('  '+label.padEnd(20)+' 충전 '+fills.map(function(f){return (f*100).toFixed(0)+'%';}).join('/')+
    '  사진 '+String(photos).padStart(3)+'  이름 '+names+'개  배치 '+att+'/'+want+(att<want?' ⚠':' ✅'));
  return {photos:photos,att:att,want:want};
}
run('이름 없음',[]);
var res={};
Object.keys(RATIO).forEach(function(t){ res[t]=run('"'+t+'"',stickers(t)); });
var WANT=1+P.NAME_CALLI_COUNT;   // 알파벳 1 + 캘리 N (NAME_CALLI_COUNT=0 이면 알파벳만)
chk('짧은 이름은 '+WANT+'개 전부 배치', res['하린'].att===WANT && res['Harin'].att===WANT,
    '하린 '+res['하린'].att+'/'+WANT+', Harin '+res['Harin'].att+'/'+WANT);
chk('긴 이름도 최소 1개는 배치', res['Christopher'].att>=1, res['Christopher'].att+'/'+WANT);

console.log('\n══ 하이브리드 부착 ══');
// 하이브리드: 히어로 옆 폭 예산(72mm)에 안 들어가면 유닛을 낮춰서라도 그 자리를 지킨다.
function attachIn(n){
  var b=ab(n); b.isAlphabetBlock=true; b.preferHero=true; b.shapes=P._letterShapeCandidates(b);
  var plan=P._planPackageSheets(ph(),2,binW,binH,gap);
  var s=plan.sheets[0]; P._resetPackState(s.pairs);
  var r=P._packPackage(s.pairs,binW,binH,gap,[b]);
  var maxH=0; r.rows.forEach(function(rw){ if(rw.h>maxH) maxH=rw.h; });
  var onHero=false;
  r.rows.forEach(function(rw){ rw.items.forEach(function(it){
    if(it && it.payload && it.payload.isLetterBlock && Math.abs(rw.h-maxH)<0.01) onHero=true; }); });
  return {b:b, att:r.letterAttachedCount, onHero:onHero};
}
var A5=attachIn('Harin'), A7=attachIn('Charles Cho');
chk('짧은 이름은 유닛 9.5mm 그대로 · 히어로 옆',
    Math.abs(A5.b.unitMm-9.5)<0.01 && A5.onHero, A5.b.unitMm+'mm');
chk('긴 이름은 유닛을 낮춰서라도 히어로 옆 유지 (하이브리드)',
    A7.b.unitMm<9.5 && A7.b.unitMm>=7 && A7.onHero,
    A7.b.unitMm+'mm · '+(A7.b.cellW/MM).toFixed(1)+'×'+(A7.b.cellH/MM).toFixed(1)+'mm');

// 캘리 블록은 유닛 후보가 없다 — resize 를 타면 치수가 NaN 이 된다 (2026-08-23 지뢰).
var cal=spec('Harin',P.NAME_BIG_H_MM,'C1'); cal.preferHero=false;
var rowsC=[{y:0,w:0,h:50*MM,items:[]}];
P._attachLetterBlock(rowsC, cal, binW, binH, gap);
chk('캘리 블록(후보 없음)은 치수가 안 깨짐',
    isFinite(cal.cellW) && isFinite(cal.cellH) && cal.cellW>0);

console.log('\n══ Package · 긴 단어 (16디자인 3시트) ══');
// 실사고 2026-08-23: 8글자 이상 **한 단어**는 히어로 옆 예산(72mm)에 안 들어가고,
// 시트가 꽉 차면 전폭 새 행도 못 열어 이름이 **조용히 빠졌다**. Package 에는 evict 폴백이
// 없었기 때문. 이제 실패한 블록만 맨 마지막에 사진을 빼고 넣는다.
(function(){
  var PF=[['01','L',0.7256],['02','M',1.0],['03','M',0.733],['04','S',0.4756],['05','M',0.75],
    ['06','M',0.6828],['07','XXL',1.2839],['08','M',0.4167],['09','S',0.6161],['10','S',1.0095],
    ['11','S',0.7617],['12','S',0.8128],['13','M',0.6667],['14','S',1.1328],['15','XXL',0.7772],
    ['16','L',0.6969]];
  function pf(){ return PF.map(function(d){
    return {base:'PF_'+d[0],aspect:d[2],tier:d[1],bucket:P.TIER_TO_BUCKET[d[1]]}; }); }
  function alpha(n){
    var b=P._letterBlockSpec(n,P.LETTER_UNIT_MM,'ALPHA');
    b.isAlphabetBlock=true; b.preferHero=true; b.shapes=P._letterShapeCandidates(b);
    return b;
  }
  var allOk=true, worst=0;
  ['하린','Harin','Sophia','Charles','Isabella','Christopher','Charles Cho','Alexandria']
   .forEach(function(nm){
    var b=alpha(nm);
    var plan=P._planPackageSheets(pf(),3,binW,binH,gap);
    var s=plan.sheets[0]; P._resetPackState(s.pairs);
    var r=P._packPackage(s.pairs,binW,binH,gap,[b]);
    var photos=0,names=0;
    r.placed.forEach(function(q){ if(q.payload.isLetterBlock)names++; else photos++; });
    if(names!==1) allOk=false;
    if(r.letterEvicted>worst) worst=r.letterEvicted;
    console.log('  '+nm.padEnd(13)+(names===1?'✅':'❌')+'  사진 '+photos+'  뺀 '+r.letterEvicted+
      '  유닛 '+b.unitMm+'mm  미배치 '+r.leftover.length);
   });
  chk('Package: 어떤 이름이든 시트에 나온다', allOk);
  chk('Package: 이름값으로 뺀 사진 ≤ 4장', worst<=4, worst+'장');
})();

console.log('\n══ 이름 아래 빈 공간 채움 + 기하 안전성 ══');
// 실사고 2026-08-24: 이름(7.5mm 띠)이 히어로 행(63.5mm) 한가운데 떠서 68×53mm 가 통째로
// 비어 나갔다. 이제 이름을 행 맨 위로 붙이고 그 아래를 사진으로 채운다(composite).
// composite 은 새 기하라 **겹침/시트밖**을 반드시 같이 검사한다.
(function(){
  var PF=[['01','L',0.7256],['02','M',1.0],['03','M',0.733],['04','S',0.4756],['05','M',0.75],
    ['06','M',0.6828],['07','XXL',1.2839],['08','M',0.4167],['09','S',0.6161],['10','S',1.0095],
    ['11','S',0.7617],['12','S',0.8128],['13','M',0.6667],['14','S',1.1328],['15','XXL',0.7772],
    ['16','L',0.6969]];
  function pf(){ return PF.map(function(d){
    return {base:'PF_'+d[0],aspect:d[2],tier:d[1],bucket:P.TIER_TO_BUCKET[d[1]]}; }); }
  function alpha(n){
    var b=P._letterBlockSpec(n,P.LETTER_UNIT_MM,'ALPHA');
    b.isAlphabetBlock=true; b.preferHero=true; b.shapes=P._letterShapeCandidates(b);
    return b;
  }
  var bad=0, checked=0, minGap=1e9, totalFilled=0;
  ['charles','Harin','하린','Charles Cho','Christopher','Emma','Isabella'].forEach(function(nm){
    [1,2,3].forEach(function(ns){
      var b=alpha(nm);
      var plan=P._planPackageSheets(pf(),ns,binW,binH,gap);
      var s=plan.sheets[0]; P._resetPackState(s.pairs);
      var r=P._packPackage(s.pairs,binW,binH,gap,[b]);
      checked++; totalFilled+=r.letterFilled;
      r.placed.forEach(function(q){
        if(q.x<-0.01||q.y<-0.01||q.x+q.w>binW+0.01||q.y+q.h>binH+0.01){
          bad++; console.log('  ❌ 시트밖 '+nm+'/'+ns+'장 '+q.payload.base); }
      });
      for(var i=0;i<r.placed.length;i++)for(var j=i+1;j<r.placed.length;j++){
        var a=r.placed[i],c=r.placed[j];
        var ox=Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x);
        var oy=Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y);
        if(ox>0.01&&oy>0.01){ bad++;
          console.log('  ❌ 겹침 '+nm+'/'+ns+'장 '+a.payload.base+' ↔ '+c.payload.base); }
        else { var d=Math.max(-ox,-oy); if(d>=0&&d<minGap) minGap=d; }
      }
    });
  });
  // 2시트 charles = 사용자가 아쉬워한 그 시트
  var b2=alpha('charles');
  var pl2=P._planPackageSheets(pf(),2,binW,binH,gap);
  P._resetPackState(pl2.sheets[0].pairs);
  var r2=P._packPackage(pl2.sheets[0].pairs,binW,binH,gap,[b2]);
  console.log('  "charles" 2시트 → 이름 아래 '+r2.letterFilled+'장 채움 · 충전 '+
    (P._sheetFill(r2,binW,binH)*100).toFixed(1)+'%');
  chk('이름 아래 빈 공간이 채워진다', r2.letterFilled>0, r2.letterFilled+'장');
  chk(checked+'개 조합에서 겹침·시트밖 0건', bad===0, bad+'건');
  chk('최소 간격 ≥ 컷 간격('+P.GAP_DEFAULT_MM+'mm)', minGap>=gap-0.01,
      (minGap/MM).toFixed(2)+'mm');
})();

console.log('\n══ 이름은 행의 오른쪽 끝 ══');
// 실사고 2026-08-23: 이름이 히어로 잔여 폭을 선점하려고 column 단계보다 **먼저** 붙는데,
// _shelfRowsToPlaced 는 items 순서대로 좌→우로 편다. 그래서 나중에 붙은 column 이 이름
// 오른쪽에 놓여 이름이 한가운데 끼었다. 폭은 이미 확보돼 있으니 순서만 바로잡는다.
(function(){
  var rows=[{y:0,w:0,h:0,items:[]}];
  function it(base,wmm,hmm,isBlock){
    var o={w:wmm*MM,h:hmm*MM,payload:{base:base}};
    if(isBlock) o.payload.isLetterBlock=true;
    return o;
  }
  P._addToShelfRow(rows[0], it('HERO',63.5,45.7), gap);
  P._addToShelfRow(rows[0], it('__NAME_ALPHA__',48,22.3,true), gap);   // 이름이 먼저 붙는다
  P._addToShelfRow(rows[0], it('COLUMN',19,45.7), gap);                 // column 이 나중에
  var before=rows[0].items.map(function(x){return x.payload.base;}).join('→');
  P._moveLetterBlocksToRowEnd(rows);
  var after=rows[0].items.map(function(x){return x.payload.base;}).join('→');
  console.log('  '+before+'   ⇒   '+after+'   (행 폭 '+(rows[0].w/MM).toFixed(1)+'mm / '+(binW/MM).toFixed(0)+'mm)');
  chk('items 순서에서 이름이 맨 뒤', after==='HERO→COLUMN→__NAME_ALPHA__', after);
  var pl=P._shelfRowsToPlaced(rows,binW,binH,gap);
  var maxX=-1, nameX=-1;
  pl.forEach(function(q){ if(q.x>maxX) maxX=q.x; if(q.payload.isLetterBlock) nameX=q.x; });
  chk('펼친 좌표에서도 이름이 가장 오른쪽', nameX===maxX && nameX>=0,
      'name x='+(nameX/MM).toFixed(1)+'mm, max x='+(maxX/MM).toFixed(1)+'mm');
})();

console.log('\n'+ok.filter(Boolean).length+'/'+ok.length+' 통과'+(ok.every(Boolean)?'  ✅':'  ❌'));
