// 이름 + 데코 (v3) — 엔진이 이름을 위 가운데에 두고, 전신 사진이 있으면 양옆에 세우며, 데코를 행의 남는 폭에 넣는지 본다.
// 이름이 없으면 데코도 없다. 이름 spec(한글·긴 이름) 은 그대로. node sim/range_name_test.js
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..'),SOURCE=path.join(ROOT,'Everstory_range.jsx');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'everstory-name-test-'));
const extracted=path.join(dir,'range.js');
cp.execFileSync(process.execPath,[path.join(__dirname,'extract_all.js'),SOURCE,extracted]);
global.RGBColor=function(){};
const P=require(extracted),M=P.MM_TO_PT,W=142*M,H=172*M,G=1.5*M;
let checks=0;
function chk(name,cond,extra){ console.log((cond?'✅ ':'❌ ')+name+(extra?'   '+extra:'')); assert(cond,name); checks++; }
const HERO=P._rangeHeroSpec('SANVI',Math.min(P.RANGE_HERO_MAX_W_MM,142-2*P.RANGE_MARGIN_X_MM)*M),heroBox={w:HERO.cellW,h:HERO.cellH};
const sanvi=[.383,.783,.659,.845].map((a,i)=>({base:'D'+i,aspect:a})),square=[1,1,1,1].map((a,i)=>({base:'D'+i,aspect:a}));
const perRowMax=decos=>{const c={};for(const d of decos)c[d.row]=(c[d.row]||0)+1;return Math.max(0,...Object.values(c));};

console.log('══ 이름 + 데코 배치 ══');
for(const band of ['small','large']){
  for(const [label,pairs] of [['Sanvi',sanvi],['정사각',square]]){
    const decoMm=P.RANGE_DECO_SIZE_MM[band],pack=P._packRange(pairs,band,W,H,G,{hero:heroBox,decoMm,decoWant:6});
    chk(`${band}/${label}: 이름 위 가운데 (heroX = (W-폭)/2, y=0)`, Math.abs(pack.band.heroX-(W-heroBox.w)/2)<1e-6 && pack.band.heroY===0,
        `x ${(pack.band.heroX/M).toFixed(1)}mm · 띠 ${(pack.band.h/M).toFixed(1)}mm`);
    chk(`${band}/${label}: 데코 ≤ 6 · 크기 ${decoMm}mm · 행당 ≤ 2`, pack.decos.length<=6 && pack.decos.every(d=>Math.abs(d.w-decoMm*M)<1e-6) && perRowMax(pack.decos)<=2,
        `${pack.decos.length}개 · 사진 ${pack.placed.length} · 두 등급 미배정 ${pack.coverageMissing}`);
    chk(`${band}/${label}: 사진·데코·이름 간격 ≥ 1.5mm (검증기)`, P._rangeValidate(pack.placed,pack.decos,pack.band,pairs,P.RANGE_SIZES_MM[band],P.RANGE_LONG_CAP_MM[band],W,H,G,pack.coverageMissing===0,pack.rules)==='');
    if(label==='Sanvi'&&band==='small')chk('Sanvi Small: 전신 사진 1.25″ 등급이 이름 양옆 2장', pack.flanks===2 && pack.placed.filter(p=>p.flank).every(p=>p.payload===pairs[0]&&p.sizeMm===31.75));
    if(label==='정사각')chk(`${band}/정사각: 세로 셀 없음 → 양옆 없음`, pack.flanks===0);
  }
}
{ const pack=P._packRange(sanvi,'small',W,H,G,{decoMm:12.7,decoWant:6}); chk('이름 없으면 띠도 데코도 없음', !pack.band && pack.decos.length===0); }

console.log('\n══ 이름 spec ══');
{
  const spec=P._rangeNameSpec('Harin',W,G);
  chk('라틴 이름 = 아트 · 유닛 9.5mm', spec.isArt && Math.abs(spec.unitMm-P.LETTER_UNIT_MM)<1e-9, (spec.cellW/M).toFixed(1)+'×'+(spec.cellH/M).toFixed(1)+'mm');
  chk('큰 이름 16mm · 폭 상한 110mm', HERO.isArt && Math.abs(HERO.unitMm-P.RANGE_HERO_UNIT_MM)<1e-9 && HERO.cellW<=110*M+1e-6, (HERO.cellW/M).toFixed(1)+'×'+(HERO.cellH/M).toFixed(1)+'mm');
  const longHero=P._rangeHeroSpec('CHRISTOPHER',110*M);
  chk('긴 이름은 큰 이름 유닛을 낮춰 110mm 안에', !!longHero && longHero.cellW<=110*M+1e-6 && longHero.unitMm<P.RANGE_HERO_UNIT_MM, longHero?longHero.unitMm.toFixed(2)+'mm':'null');
  const long=P._rangeNameSpec('CHRISTOPHERALEXANDER',W,G);
  chk('아주 긴 이름은 유닛을 낮춰 폭에 맞춤', long.isArt && long.cellW<=W+1e-6 && long.unitMm<P.LETTER_UNIT_MM, long.unitMm.toFixed(2)+'mm · '+(long.cellW/M).toFixed(1)+'mm');
  const ko=P._rangeNameSpec('하린',W,G);
  chk('한글은 건너뛰고 사유를 돌려줌', !!(ko && ko.skipped) && !ko.isArt, ko.skipped);
  chk('빈 이름 = null', P._rangeNameSpec('',W,G)===null);
}

console.log('\n══ 결정론 ══');
{
  const key=pk=>JSON.stringify(pk.placed.map(p=>[p.x,p.y,p.w,p.h,p.payload.base,p.sizeMm]).concat(pk.decos.map(d=>[d.x,d.y,d.payload.deco])));
  const ex={hero:heroBox,decoMm:12.7,decoWant:6};
  chk('같은 입력 → 같은 배치', key(P._packRange(sanvi,'small',W,H,G,ex))===key(P._packRange(sanvi,'small',W,H,G,ex)));
  const alt=P._packRange(sanvi,'small',W,H,G,{hero:heroBox,decoMm:12.7,decoWant:6,candidate:1});
  chk('후보(candidate) 를 바꿔도 검증 통과', P._rangeValidate(alt.placed,alt.decos,alt.band,sanvi,P.RANGE_SIZES_MM.small,P.RANGE_LONG_CAP_MM.small,W,H,G,alt.coverageMissing===0,alt.rules)==='');
}
console.log('\n'+checks+' 검사 통과 ✅');
