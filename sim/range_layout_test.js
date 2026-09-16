// 면적 등급 행 조판 (v3, 2026-09-13) — 최신 Illustrator 소스를 추출해 검사한다. Adobe API 없음, 소스 무변경.
//   · 셀 = 면적 등급 식(w=√(A·a), h=√(A/a), 최장변 상한) · 사진별 최소 수량 · 개수 차이 · Small 은 사진마다 두 등급
//   · 사진·데코·이름 박스 간격 ≥ 1.5mm · 행 아랫선 정렬 · 양끝 맞춤 · 데코 행당 ≤ 2 · 이름 위 가운데 · 결정론 · 입력 불변
// node sim/range_layout_test.js [--report]
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..'),SOURCE=path.join(ROOT,'Everstory_range.jsx');
const before=fs.readFileSync(SOURCE),dir=fs.mkdtempSync(path.join(os.tmpdir(),'everstory-layout-test-'));
const extracted=path.join(dir,'range.js');
cp.execFileSync(process.execPath,[path.join(__dirname,'extract_all.js'),SOURCE,extracted]);
global.RGBColor=function(){};
const P=require(extracted),M=P.MM_TO_PT,W=142*M,H=172*M,G=1.5*M;
const HERO=P._rangeHeroSpec('SANVI',Math.min(P.RANGE_HERO_MAX_W_MM,142-2*P.RANGE_MARGIN_X_MM)*M);
const heroBox={w:HERO.cellW,h:HERO.cellH};
const withName=(band,n)=>({hero:heroBox,decoMm:P.RANGE_DECO_SIZE_MM[band],decoWant:n+P.DECO_EXTRA});
let checks=0;
function verify(pack,pairs,band){
  const sizes=P.RANGE_SIZES_MM[band],cap=P.RANGE_LONG_CAP_MM[band];
  const counts=Array(pairs.length).fill(0),cover=pairs.map(()=>new Set());let area=0;
  for(const p of pack.placed){
    const d=pairs.indexOf(p.payload),s=sizes.indexOf(p.sizeMm);
    assert(d>=0&&s>=0,'payload identity / allowed size');
    assert.equal(p.typeIndex,d*sizes.length+s);
    assert(!p.rotated,'original orientation');
    const c=P._rangeCell(p.payload.aspect,p.sizeMm,cap);
    assert(Math.abs(p.w-c.w*M)<1e-6&&Math.abs(p.h-c.h*M)<1e-6,'면적 등급 셀');
    assert([p.x,p.y,p.w,p.h].every(Number.isFinite));
    assert(p.x>=-1e-6&&p.y>=-1e-6&&p.x+p.w<=W+1e-6&&p.y+p.h<=H+1e-6,'bounds');
    counts[d]++;cover[d].add(s);area+=p.w*p.h;
  }
  assert.deepStrictEqual(counts,pack.counts);
  assert(Math.abs(area-pack.area)<1e-5);
  const rules=pack.rules||{minPer:P.RANGE_MIN_PER_PHOTO,spreadMax:P.RANGE_SPREAD_MAX};
  assert(counts.every(c=>c>=rules.minPer),'min per photo');
  assert(Math.max(...counts)-Math.min(...counts)<=rules.spreadMax,'per-photo balance');
  const missing=cover.reduce((n,st)=>n+(sizes.length-st.size),0);
  assert.equal(missing,pack.coverageMissing,'coverageMissing 보고');
  const boxes=[...pack.placed.map(p=>({x:p.x,y:p.y,w:p.w,h:p.h,name:p.payload.base})),...pack.decos.map(d=>({x:d.x,y:d.y,w:d.w,h:d.h,name:'deco'}))];
  if(pack.band)boxes.push({x:pack.band.heroX,y:pack.band.heroY,w:pack.band.heroW,h:pack.band.heroH,name:'hero'});
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];
    assert(Math.max(a.x-b.x-b.w,b.x-a.x-a.w,a.y-b.y-b.h,b.y-a.y-a.h)>=G-1e-6,`gap ${a.name}/${b.name}`);}
  for(const d of pack.decos)assert(d.x>=-1e-6&&d.y>=-1e-6&&d.x+d.w<=W+1e-6&&d.y+d.h<=H+1e-6,'deco bounds');
  // 행: 아랫선 정렬 + 양끝 맞춤 (첫 요소는 행의 왼쪽 끝, 마지막 요소 오른쪽은 행의 오른쪽 끝). 이름 합성 행은 양옆 셀 안쪽.
  const byRow=new Map();const rowOf=r=>byRow.get(r)||byRow.set(r,{els:[],fl:[]}).get(r);
  for(const p of pack.placed)(p.flank?rowOf(p.row).fl:rowOf(p.row).els).push(p);
  for(const d of pack.decos)rowOf(d.row).els.push(d);
  const decoRows={};
  for(const [r,{els,fl}] of byRow){
    const bottoms=els.filter(e=>!e.payload.isDeco).map(e=>e.y+e.h);
    if(bottoms.length)assert(Math.max(...bottoms)-Math.min(...bottoms)<1e-6,'row baseline');
    if(els.length>=2){const L=fl.find(f=>f.flank==='L'),R=fl.find(f=>f.flank==='R');const x0=L?L.w+G:0,x1=R?W-R.w-G:W;
      assert(Math.abs(Math.min(...els.map(e=>e.x))-x0)<1e-6,'row left edge');
      assert(Math.abs(Math.max(...els.map(e=>e.x+e.w))-x1)<1e-6,'row right edge (justify)');}
    decoRows[r]=els.filter(e=>e.payload.isDeco).length;assert(decoRows[r]<=2,'row deco ≤ 2');
  }
  assert.equal(P._rangeValidate(pack.placed,pack.decos,pack.band,pairs,sizes,cap,W,H,G,pack.coverageMissing===0,pack.rules),'');
  return {counts,missing};
}
const fixtures=[
  ['sample',[1306/1800,1,1112/1517,705/1692,.9,.6]],['square',[1,1,1,1,1,1]],
  ['portrait',[.42,.5,.62,.7,.55,.45]],['mixed',[1.38,.7,1.2,.48,.8,1.6]],
  ['sanvi',[.383,.783,.659,.845,.7,.9]]
];
const table=[];
for(const [id,aspects] of fixtures)for(const band of ['small','large'])for(const n of [1,4,5,6])for(const named of [false,true]){
  const pairs=aspects.slice(0,n).map((aspect,i)=>({base:'D'+i,aspect})),snapshot=JSON.stringify(pairs);
  const extras=named?withName(band,n):{};
  const t=performance.now(),pack=P._packRange(pairs,band,W,H,G,extras),ms=performance.now()-t;
  verify(pack,pairs,band);checks++;
  assert.equal(JSON.stringify(pairs),snapshot,'input mutation');
  if(band==='small'){assert.equal(pack.coverageMissing,0,`${id}/${band}/${n}: Small 은 사진마다 두 등급`);assert(!pack.relaxed,`${id}/small/${n}: Small 은 정상 규칙`);}
  if(named)assert(pack.band&&Math.abs(pack.band.heroX-(W-heroBox.w)/2)<1e-6&&pack.band.heroY===0,'이름 위 가운데');
  else assert(!pack.band&&pack.decos.length===0,'이름 없으면 띠·데코 없음');
  table.push({id,band,n,named,photos:pack.placed.length,decos:pack.decos.length,flanks:pack.flanks,cover:pack.coverageMissing,
    relaxed:pack.relaxed?1:0,fill:+(pack.fill*100).toFixed(1),rows:pack.rows.length,counts:pack.counts.join('/'),ms:+ms.toFixed(0)});
}
console.table(table.filter(r=>r.n===4||r.n===6));
// 결정론
{
  const pairs=fixtures[4][1].slice(0,4).map((aspect,i)=>({base:'D'+i,aspect}));
  const key=pk=>JSON.stringify(pk.placed.map(p=>[p.x,p.y,p.w,p.h,p.payload.base,p.sizeMm]).concat(pk.decos.map(d=>[d.x,d.y])));
  assert.equal(key(P._packRange(pairs,'small',W,H,G,withName('small',4))),key(P._packRange(pairs,'small',W,H,G,withName('small',4))),'deterministic');
  checks++;
}
// 8디자인 → 두 시트(4+4), 시트마다 독립 보장
{
  const eight=[...fixtures[0][1].slice(0,4),...fixtures[3][1].slice(0,4)].map((aspect,i)=>({base:'D'+i,aspect}));
  const groups=P._rangeDeal(eight);assert.equal(groups.length,2);assert.equal(new Set(groups.flat()).size,8);
  for(const band of ['small','large'])for(const group of groups){verify(P._packRange(group,band,W,H,G,withName(band,4)),group,band);checks++;}
}
// Sanvi Small 회귀 (2026-09-13 목업 기준): 전신 사진이 이름 양옆에 2장, 데코 6, 사진 ≥ 17, 전신 사진의 두 등급 모두 위 군
{
  const pairs=[.383,.783,.659,.845].map((aspect,i)=>({base:'D'+i,aspect}));
  const pack=P._packRange(pairs,'small',W,H,G,withName('small',4));
  assert.equal(pack.flanks,2,'flanks');
  const fl=pack.placed.filter(p=>p.flank);assert.equal(fl.length,2);
  assert(fl.every(p=>p.payload===pairs[0]&&p.sizeMm===31.75),'양옆 = 전신 사진 1.25″ 등급');
  assert.equal(pack.decos.length,6,'데코 6');assert(pack.placed.length>=17,'사진 ≥ 17: '+pack.placed.length);
  const g=P._rangeGroups(P._rangeTypes(pairs,P.RANGE_SIZES_MM.small,P.RANGE_LONG_CAP_MM.small),2);
  assert(g[0].includes(0)&&g[0].includes(1)&&!g[1].includes(0),'전신 사진의 두 등급 모두 위 군');
  console.log('sanvi/small/named: photos '+pack.placed.length+' decos '+pack.decos.length+' counts '+pack.counts.join('/')+' rows '+pack.rows.map(r=>(r.h/M).toFixed(1)+(r.mid?'*':'')).join('/')+' fill '+(pack.fill*100).toFixed(1)+'% variant '+JSON.stringify(pack.variant));
  checks++;
}
// 셀 계산
{
  const c=P._rangeCell(.383,31.75,50.8);assert(Math.abs(c.h-50.8)<1e-9&&Math.abs(c.w-50.8*.383)<1e-9,'최장변 상한');
  const s=P._rangeCell(1,25.4,50.8);assert(Math.abs(s.w-25.4)<1e-9&&Math.abs(s.h-25.4)<1e-9,'정사각 = 25.4');
  const e=P._rangeCell(.5,25.4,50.8);assert(Math.abs(e.w*e.h-25.4*25.4)<1e-6&&Math.abs(e.w/e.h-.5)<1e-9,'면적 = 등급² · 비율 유지');
  const l=P._rangeCell(5,25.4,50.8);assert(Math.abs(l.w-50.8)<1e-9&&Math.abs(l.h-50.8/5)<1e-9,'가로로 긴 사진도 상한 (비율 5 → 폭 50.8)');
  checks++;
}
// 검증기: 틀린 계획 거부
{
  const pairs=[1,1,1,1].map((aspect,i)=>({base:'D'+i,aspect}));const pack=P._packRange(pairs,'small',W,H,G,{});
  const sizes=P.RANGE_SIZES_MM.small,cap=P.RANGE_LONG_CAP_MM.small;
  for(const edit of [p=>p.x=NaN,p=>p.rotated=true,p=>p.typeIndex=999,p=>p.x=W,p=>p.w*=1.01]){
    const bad=pack.placed.map(p=>({...p}));edit(bad[0]);assert(P._rangeValidate(bad,[],null,pairs,sizes,cap,W,H,G,true),'reject');}
  const missing=pack.placed.filter(p=>!(p.payload===pairs[0]&&p.sizeMm===sizes[0]));
  assert(/크기 누락|최소 수량 미달/.test(P._rangeValidate(missing,[],null,pairs,sizes,cap,W,H,G,true)));
  const overlap=pack.placed.map(p=>({...p}));overlap[1].x=overlap[0].x;overlap[1].y=overlap[0].y;
  assert(/간격/.test(P._rangeValidate(overlap,[],null,pairs,sizes,cap,W,H,G,true)),'overlap');
  checks++;
}
assert.throws(()=>P._packRange([{base:'D0',aspect:1}],'small',10*M,10*M,G,{}),/들어가지 않습니다/);
assert(before.equals(fs.readFileSync(SOURCE)),'Source changed during test');
console.log('PASS: '+checks+' checks; area-class cells, balance, coverage, gaps, row baseline/justify, decos, hero, determinism, invalid-plan rejection.');
if(process.argv.includes('--report')){
  const out=path.join(ROOT,'docs/reports/range-block-implementation-2026-09-08');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'results_v3.json'),JSON.stringify({checks,table},null,2)+'\n');
}
