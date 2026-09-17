// Composed(사진 6장 구성 시트) 순수 엔진 (v2 + 사진 종류) — 최신 Everstory_range.jsx 를 추출해 검사한다. Adobe API 없음, 소스 무변경.
//   · 크기 = 인치 사다리의 **긴 변** (2.5" = 63.5mm, 예외는 짧은 변 하한뿐)
//   · 등급별 장수 = 면적 배분 (정사각 사진이면 큰 등급이 줄고 작은 등급이 산다)
//   · 큰 것부터 배치 · 셀 = 사진 + 2×rim · 칼선 박스 간격 = gap + 2×rim
//   · 사진 종류 → 크기 범위 (사용자 확정 표) · 실주문 사람 사진 24장 자동 판별 · 종류가 들어간 배치
//   · 파일명 표시(SML·MED·BIG, 옛 6티어·FAM) → 종류 · 표시 있는 사진은 측정 안 함 · 표시 없는 사진만 자동 판별
//   · 결정론 · 누락 보고 일치 · 검증기 음성 케이스 · 입력 불변
// node sim/range_composed_test.js
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), assert = require('assert');
const ROOT = path.resolve(__dirname, '..'), SOURCE = path.join(ROOT, 'Everstory_range.jsx');
const before = fs.readFileSync(SOURCE);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'everstory-composed-test-'));
const extracted = path.join(dir, 'range.js');
cp.execFileSync(process.execPath, [path.join(__dirname, 'extract_all.js'), SOURCE, extracted]);
global.RGBColor = function () {};
const P = require(extracted), M = P.MM_TO_PT;
const W = 142 * M, H = 172 * M, G = 1.5 * M, RIM = 1 * M;
const HERO = P._rangeHeroSpec('SANVI', Math.min(P.RANGE_HERO_MAX_W_MM, 142 - 2 * P.RANGE_MARGIN_X_MM) * M);
const heroBox = { w: HERO.cellW, h: HERO.cellH };
let checks = 0;
const chk = (name, cond, extra) => { console.log((cond ? '✅ ' : '❌ ') + name + (extra ? '   ' + extra : '')); assert(cond, name); checks++; };
const pairsOf = list => list.map((a, i) => ({ base: 'D' + i, aspect: a, cutAspect: a }));
const pack = (aspects, opt) => P._packComposed(pairsOf(aspects), (opt && opt.main) || 0, W, H, G,
  { hero: (opt && opt.noName) ? null : heroBox, decoWant: P.COMPOSED_DECO_MAX, rimPt: (opt && 'rim' in opt) ? opt.rim : RIM });

console.log('══ 크기 = 인치 사다리의 긴 변 ══');
{
  const ratios = [0.42, 0.6, 0.73, 0.85, 1.0, 1.6];
  let ok = true, worst = '';
  for (const inch of P.COMPOSED_GRADES_IN) {
    for (const r of ratios) {
      const c = P._composedCell(r, inch, 0);
      const lng = Math.max(c.artW, c.artH);
      if (Math.abs(lng - inch * 25.4) > 1e-9 && Math.min(c.artW, c.artH) > P.COMPOSED_MIN_SHORT_MM + 1e-9) {
        ok = false; worst = `${inch}" r${r} → ${lng.toFixed(2)}`;
      }
    }
  }
  chk('모든 등급·비율에서 긴 변 = 인치 (짧은 변 하한에 걸린 경우 제외)', ok, worst || '2.5"=63.5 / 2"=50.8 / 1.5"=38.1 / 1.25"=31.75 / 1"=25.4 / 0.75"=19.05');

  const tall = P._composedCell(0.38, 2.5, 0);
  chk('세로로 긴 사진도 2.5" 는 63.5mm — v1 의 80mm 상한이 사라졌다',
      Math.abs(Math.max(tall.artW, tall.artH) - 63.5) < 1e-9 && Math.abs(tall.artW / tall.artH - 0.38) < 1e-9,
      `${tall.artW.toFixed(1)}×${tall.artH.toFixed(1)}mm`);

  const wide = P._composedCell(1.6, 1, 0);
  chk('가로 사진은 폭이 인치', Math.abs(wide.artW - 25.4) < 1e-9 && wide.artH < wide.artW, `${wide.artW.toFixed(1)}×${wide.artH.toFixed(1)}`);

  const thin = P._composedCell(0.2, 0.75, 0);
  chk('짧은 변 하한이 걸리면 비율을 지키며 통째로 커진다',
      Math.abs(Math.min(thin.artW, thin.artH) - P.COMPOSED_MIN_SHORT_MM) < 1e-9 &&
      Math.abs(thin.artW / thin.artH - 0.2) < 1e-9 && Math.max(thin.artW, thin.artH) > 19.05,
      `${thin.artW.toFixed(1)}×${thin.artH.toFixed(1)}mm`);

  const rimmed = P._composedCell(0.8, 1.5, 1);
  chk('셀 = 사진 + 2×rim', Math.abs(rimmed.w - rimmed.artW - 2) < 1e-9 && Math.abs(rimmed.h - rimmed.artH - 2) < 1e-9,
      `사진 ${rimmed.artW.toFixed(1)}×${rimmed.artH.toFixed(1)} → 셀 ${rimmed.w.toFixed(1)}×${rimmed.h.toFixed(1)}`);
  chk('rim 0 이면 셀 = 사진', (() => { const c = P._composedCell(0.8, 1.5, 0); return c.w === c.artW && c.h === c.artH; })());
}

console.log('\n══ 장수 계획 (메인 → 시트 중심 → 균형 → 면적 배분) ══');
{
  const usable = 142 * 172 - 77.5 * 16;
  const ALL = [true, true, true, true, true, true];
  const mk = (aspects, types) => aspects.map((a, i) => ({ index: i, aspect: a,
    window: types ? P._composedTypeWindow(types[i]) : ALL.slice() }));
  const cellSum = (photos, slots) => slots.reduce((s, x) => { const c = P._composedCell(photos[x.photo].aspect, x.inch, 1); return s + c.w * c.h; }, 0);
  const tallP = mk([0.38, 0.78, 0.66, 0.85, 0.79, 0.89]);
  const sqP = mk([0.97, 1.0, 0.97, 0.97, 0.82, 0.79]);
  const a = P._composedPlanSlots(tallP, 0, usable, 1), b = P._composedPlanSlots(sqP, 0, usable, 1, P.COMPOSED_SPREAD_COUNT);
  chk('장수 = 슬롯 수', a.counts.reduce((s, v) => s + v, 0) === a.slots.length && b.counts.reduce((s, v) => s + v, 0) === b.slots.length,
      `세로형 [${a.counts}] · 정사각 [${b.counts}]`);
  chk('셀 합이 시트 예산 안', cellSum(tallP, a.slots) <= P.COMPOSED_PACK_BUDGET * usable + 1e-6 &&
      cellSum(sqP, b.slots) <= P.COMPOSED_PACK_BUDGET * usable + 1e-6,
      `${(cellSum(tallP, a.slots) / usable * 100).toFixed(1)}% · ${(cellSum(sqP, b.slots) / usable * 100).toFixed(1)}% ≤ ${P.COMPOSED_PACK_BUDGET * 100}%`);
  chk('등급 상한 (2.5" 1장 · 2" 2장)', a.counts[0] <= 1 && a.counts[1] <= 2 && b.counts[0] <= 1 && b.counts[1] <= 2);
  chk('정사각 사진이면 총 장수가 준다 (같은 인치라도 면적이 크다)', b.slots.length < a.slots.length, `${a.slots.length} → ${b.slots.length}`);
  chk('작은 등급이 통째로 빠지지 않는다 (v1 하린 회귀)', b.counts[4] >= 1 && b.counts[5] >= 1, `1"×${b.counts[4]} · 0.75"×${b.counts[5]}`);
  const main2 = P._composedPlanSlots(tallP, 2, usable, 1, P.COMPOSED_SPREAD_COUNT);
  chk('메인이 가장 큰 등급 · 인치 내림차순', main2.slots[0].photo === 2 && main2.slots[0].inch === 2.5 &&
      main2.slots.every((s, i) => i === 0 || s.inch <= main2.slots[i - 1].inch));
  chk('앞 COMPOSED_SPREAD_COUNT 장만 분산 대상', main2.slots.filter(s => s.spread).length === Math.min(P.COMPOSED_SPREAD_COUNT, main2.slots.length) &&
      main2.slots.slice(0, P.COMPOSED_SPREAD_COUNT).every(s => s.spread));
  const per = s => { const c = [0, 0, 0, 0, 0, 0]; s.slots.forEach(x => c[x.photo]++); return c; };
  const dropped = P._composedPlanSlots(tallP, 2, usable, 1, P.COMPOSED_SPREAD_COUNT, 2);
  chk('재시도용 조각 빼기: 면적 배분(④)에서 마지막에 넣은 조각부터 2장', dropped.slots.length === main2.slots.length - 2 &&
      dropped.counts.reduce((s, v) => s + v, 0) === dropped.slots.length &&
      per(dropped).every(v => v >= P.COMPOSED_MIN_COPIES), `${main2.slots.length} → ${dropped.slots.length}`);
  chk('제한 없으면 사진마다 장수가 고르다 (차이 ≤ 1)', Math.max(...per(a)) - Math.min(...per(a)) <= 1, `[${per(a)}]`);
  // 종류가 섞이면 — 몸 사진도 최소 장수를 받는다 (얼굴이 다 가져가지 않게)
  const mixed = P._composedPlanSlots(mk([1.40, 0.67, 0.79, 0.80, 0.41, 0.75], ['group', 'face', 'full', 'face', 'full', 'face']), 0, usable, 1, P.COMPOSED_SPREAD_COUNT);
  chk('섞인 주문: 모든 사진이 COMPOSED_MIN_COPIES 장 이상', per(mixed).every(v => v >= P.COMPOSED_MIN_COPIES), `[${per(mixed)}]`);
  const tight = P._composedPlanSlots(mk([0.7, 0.62, 1.3, 0.9, 0.66, 0.75], ['group', 'group', 'group', 'group', 'group', 'group']), 0, usable, 1, P.COMPOSED_SPREAD_COUNT);
  chk('커플만: 예산이 모자라도 여섯 장 모두 한 장 이상', per(tight).every(v => v >= 1), `[${per(tight)}] · [${tight.counts}]`);
}

console.log('\n══ 사진 종류 → 크기 범위 · 자동 판별 ══');
{
  const want = { face: [0.75, 1.5], upper: [1, 2], full: [1.25, 2.5], group: [2, 2.5], petFace: [0.75, 1.25], petBody: [1.25, 2.5] };
  const ok = Object.keys(want).every(k => {
    const w = P._composedTypeWindow(k);
    return P.COMPOSED_GRADES_IN.every((v, g) => w[g] === (v >= want[k][0] && v <= want[k][1]));
  });
  chk('종류 표 = 사용자 확정값 (얼굴 0.75~1.5 · 상반신 1~2 · 전신 1.25~2.5 · 커플·단체 2~2.5 · 반려동물 0.75~1.25 / 1.25~2.5)', ok);
  {
    const REF = P.COMPOSED_GRADE_SHARE;
    const pAll = P._composedWindowProfile(P._composedTypeWindow('none'));
    chk('범위 비중: 사다리 전체면 레퍼런스 그대로', pAll.every((v, g) => Math.abs(v - REF[g] / REF.reduce((s, x) => s + x, 0)) < 1e-12));
    const profs = P.COMPOSED_SHOT_TYPES.map(tp => [tp.key, P._composedWindowProfile(P._composedTypeWindow(tp.key))]);
    chk('범위 비중: 합 1 · 범위 밖 0', profs.every(([k, pr]) => Math.abs(pr.reduce((s, v) => s + v, 0) - 1) < 1e-12 &&
      pr.every((v, g) => P._composedTypeWindow(k)[g] ? v > 0 : v === 0)));
    const pf = P._composedWindowProfile(P._composedTypeWindow('full'));
    chk('범위 비중: 전신은 하한 크기가 절반을 넘지 않는다 (사다리 기준으로 자르면 55%)', pf[3] < 0.5,
      `2.5/2/1.5/1.25 = ${pf.slice(0, 4).map(v => (v * 100).toFixed(0)).join('/')}%`);
  }
  chk('미분류·모르는 종류 = 제한 없음', P._composedTypeWindow('none').every(Boolean) && P._composedTypeWindow('zzz').every(Boolean));
  chk('모든 종류가 사다리 등급을 하나 이상 가진다', P.COMPOSED_SHOT_TYPES.every(t => P._composedTypeWindow(t.key).some(Boolean)));

  chk('측정 한 줄 파싱', (() => { const r = P._composedParseProbe('ok|2|0.1,0.2,0.3,0.4|3|0');
    return r && r.ok && r.faces === 2 && Math.abs(r.faceH - 0.4) < 1e-12 && r.humans === 3 && r.animals === 0; })());
  chk('얼굴 없음 파싱', (() => { const r = P._composedParseProbe('ok|0|-|0|1'); return r && r.faces === 0 && r.faceH === 0 && r.animals === 1; })());
  chk('깨진 측정 줄 거부', ['', 'ok|1|0.1,0.2|0|0', 'ok|x|-|0|0', 'ok|1|0,0,0,9|0|0', null].every(s => P._composedParseProbe(s) === null));

  // 실주문 5건 30장 — macOS Vision 실측 (얼굴 수, 가장 큰 얼굴 높이(캔버스 비율), 사람 박스 수, 동물 수, 칼선 relH).
  // 기대 종류는 사진을 눈으로 보고 붙인 값. Kim_06 은 코트를 입은 상반신인데 얼굴이 14% 라 전신으로 간다 —
  // 크기는 자세가 아니라 인쇄 얼굴 크기를 따라야 하므로 맞는 결과다.
  const REAL = [
    ['EVS-0000_01 서 있는 전신', 1, 0.1385, 1, 0, 0.9959, 'full'],
    ['EVS-0000_02 그네', 1, 0.1245, 1, 0, 1.0000, 'full'],
    ['EVS-0000_03 곰인형+아이', 1, 0.0724, 1, 0, 0.9982, 'full'],
    ['EVS-0000_04 앉은 전신', 1, 0.1902, 1, 0, 0.9943, 'full'],
    ['EVS-0000_05 공 든 반신(액자)', 1, 0.2070, 1, 0, 1.0000, 'upper'],
    ['EVS-0000_06 하트 액자', 1, 0.2727, 0, 0, 1.0000, 'upper'],
    ['하린_02 얼굴', 1, 0.6308, 0, 0, 0.9990, 'face'],
    ['하린_04 얼굴', 1, 0.5240, 0, 0, 0.9971, 'face'],
    ['하린_05 어깨 위(원형 액자)', 1, 0.3874, 1, 0, 1.0000, 'upper'],
    ['하린_06 상반신(원형 액자)', 1, 0.2709, 1, 0, 1.0000, 'upper'],
    ['하린_10 얼굴(안경)', 1, 0.5730, 1, 0, 0.9866, 'face'],
    ['하린_16 얼굴', 1, 0.6053, 0, 0, 0.9875, 'face'],
    ['누리_01 4인 가족', 4, 0.1723, 3, 0, 0.9922, 'group'],
    ['누리_03 얼굴(왕관)', 1, 0.5582, 1, 0, 0.9975, 'face'],
    ['누리_04 전신(달걀 액자)', 1, 0.1659, 1, 0, 1.0000, 'full'],
    ['누리_05 얼굴(모자)', 1, 0.6601, 0, 0, 0.9947, 'face'],
    ['누리_06 뛰는 전신', 1, 0.1682, 1, 0, 1.0000, 'full'],
    ['누리_07 얼굴', 1, 0.6283, 0, 0, 0.9651, 'face'],
    ['Kim_01 커플(포옹)', 1, 0.0767, 2, 0, 1.0000, 'group'],
    ['Kim_02 커플', 2, 0.0990, 1, 0, 0.9953, 'group'],
    ['Kim_03 커플', 1, 0.0948, 2, 0, 0.9913, 'group'],
    ['Kim_04 커플(폭포)', 2, 0.1068, 2, 0, 1.0000, 'group'],
    ['Kim_05 커플', 2, 0.1658, 2, 0, 0.9934, 'group'],
    ['Kim_06 코트 상반신', 1, 0.1440, 1, 0, 0.9983, 'full']
  ];
  const wrong = REAL.filter(r => P._composedClassify({ ok: true, faces: r[1], faceH: r[2], humans: r[3], animals: r[4] }, r[5]).key !== r[6]);
  chk(`사람 사진 ${REAL.length}장 자동 판별 = 눈으로 붙인 종류`, wrong.length === 0, wrong.map(r => r[0]).join(', ') || '전부 일치');
  const conf = REAL.filter(r => P._composedClassify({ ok: true, faces: r[1], faceH: r[2], humans: r[3], animals: r[4] }, r[5]).confirm);
  chk('얼굴이 잡힌 사진은 확인 표시 없음', conf.length === 0);
  const dog = P._composedClassify({ ok: true, faces: 0, faceH: 0, humans: 0, animals: 1 }, 1);
  chk('강아지(얼굴 없음 · 동물) → 반려동물 전신 + 운영자 확인', dog.key === 'petBody' && dog.confirm);
  const none = P._composedClassify({ ok: true, faces: 0, faceH: 0, humans: 0, animals: 0 }, 1);
  chk('아무것도 안 잡힘 → 전신 + 운영자 확인', none.key === 'full' && none.confirm);
  const failed = P._composedClassify(null, 1);
  chk('측정 실패 → 미분류(제한 없음) + 운영자 확인', failed.key === 'none' && failed.confirm);
  chk('얼굴 비율은 칼선 높이 기준 (relH 로 나눈다)',
      P._composedClassify({ ok: true, faces: 1, faceH: 0.19, humans: 1, animals: 0 }, 0.9).key === 'upper' &&
      P._composedClassify({ ok: true, faces: 1, faceH: 0.19, humans: 1, animals: 0 }, 1).key === 'full');
}

console.log('\n══ 파일명 표시 → 종류 (표시가 없는 사진만 자동 판별) ══');
{
  const nt = b => { const r = P._composedNameType(b); return r ? r.token + ':' + r.key : null; };
  const CASES = [
    ['Sanvi EVS-0000_06_SML', 'SML:face'], ['Jennifer Lee EVS-1008_03_MED', 'MED:upper'], ['Sanvi EVS-0000_03_BIG', 'BIG:full'],
    ['누리_07_XS', 'XS:face'], ['누리_03_S', 'S:face'], ['누리_05_M', 'M:upper'], ['누리_04_L', 'L:upper'],
    ['하린_57_XL', 'XL:full'], ['누리_01_XXL', 'XXL:full'], ['Min Young Kim_03_FAM', 'FAM:group'], ['x_01_sml', 'SML:face'],
    ['하린_02', null], ['애완동물_11', null], ['BIG', null], ['photo_01_XXS', null], ['a_01_BIGGER', null], ['a_01_BIG_x', null],
    ['', null], [undefined, null]
  ];
  const wrongName = CASES.filter(([b, want]) => nt(b) !== want);
  chk('파일명 끝 표시 읽기 (3버킷 · 옛 6티어 · FAM · 소문자 / 표시 없음·다른 글자 = 없음)', wrongName.length === 0,
      wrongName.map(([b, want]) => `${b} → ${nt(b)} (기대 ${want})`).join(', ') || `${CASES.length}건`);
  const span = b => { const w = P._composedTypeWindow(P._composedNameType(b).key), on = P.COMPOSED_GRADES_IN.filter((v, g) => w[g]);
    return Math.min(...on) + '~' + Math.max(...on); };
  chk('SML = 얼굴 0.75~1.5 · MED = 상반신 1~2 · BIG = 전신 1.25~2.5 · FAM = 커플 2~2.5',
      span('a_01_SML') === '0.75~1.5' && span('a_01_MED') === '1~2' && span('a_01_BIG') === '1.25~2.5' && span('a_01_FAM') === '2~2.5');
  chk('표시 표의 모든 값이 종류 표에 있다', Object.keys(P.COMPOSED_NAME_TYPES).every(k => P._composedTypeIndex(P.COMPOSED_NAME_TYPES[k]) >= 0));
  const html = fs.readFileSync(path.join(ROOT, 'plugins/everstory_save/index.html'), 'utf8');
  const tiers = [...html.matchAll(/data-tier="(\w+)"/g)].map(m => m[1]).filter(t => t !== 'AUTO');
  chk('저장 플러그인 버튼이 붙이는 표시를 전부 읽는다', tiers.length >= 9 && tiers.every(t => P._composedNameType('p_01_' + t) !== null), tiers.join(' '));

  // 종류 추정 — 표시가 이긴다 (운영자가 예전에 확정한 종류보다도). 표시 없는 사진은 확정값 > 자동 판별.
  const noCache = { absoluteURI: 'no-cache' };   // 슬래시가 없으면 칼선 캐시를 안 찾는다
  const gp = ['K_01_SML', 'K_02', 'K_03_BIG', 'K_04'].map(base => ({ base, sil: noCache }));
  const gs = P._composedGuessTypes(gp, {
    recs: [null, P._composedParseProbe('ok|1|0,0,0,0.6|1|0'), null, P._composedParseProbe('ok|1|0,0,0,0.3|1|0')],
    saved: [null, null, 'face', 'full'] });
  chk('종류 추정: 표시 → 표시 종류 · 표시 없음 → 확정값, 없으면 자동 판별',
      gs[0].key === 'face' && gs[0].named && gs[0].note === '파일명 SML' && !gs[0].confirm &&
      gs[1].key === 'face' && !gs[1].named && !gs[1].saved &&
      gs[2].key === 'full' && gs[2].named &&
      gs[3].key === 'full' && gs[3].saved && !gs[3].named,
      gs.map(g => g.key + (g.named ? '(파일명)' : g.saved ? '(확정)' : '(판별)')).join(' · '));

  // 측정 — 표시가 있는 사진은 캐시도 앱도 안 거친다. File/$ 는 이 블록에서만 흉내 낸다.
  const touched = [];
  const spy = base => ({ base, get sil() { touched.push(base); return { absoluteURI: '/nowhere/' + base + '_sil.png' }; } });
  global.File = function (p) {
    this.absoluteURI = String(p); this.fsName = String(p); this.exists = false;
    this.parent = { fsName: '/nowhere', parent: { fsName: '/' } };
  };
  global.$ = { fileName: '/nowhere/Everstory_range.jsx' };
  let allNamed, partial;
  try {
    allNamed = P._composedProbeFaces([spy('A_01_SML'), spy('A_02_MED')], [true, true]);
    partial = P._composedProbeFaces([spy('B_01_SML'), spy('B_02')], [true, false]);
  } finally {
    delete global.File;
    delete global.$;
  }
  chk('측정: 전부 표시면 아무것도 안 읽고 앱도 안 찾는다', !touched.some(b => b.indexOf('A_') === 0) &&
      allNamed.cached === 0 && allNamed.measured === 0 && allNamed.error === '' && allNamed.recs.length === 2);
  chk('측정: 표시 없는 사진만 캐시를 찾고 앱을 찾는다', touched.join() === 'B_02' && partial.recs.length === 2 &&
      partial.recs[0] === null && /측정 앱이 없습니다/.test(partial.error), `읽은 사진 ${touched.join()} · ${partial.error}`);

  // 운영자가 종류대로 붙이면 (얼굴 SML · 상반신 MED · 전신 BIG · 커플 FAM) 종류를 직접 준 판과 같다.
  const TOK = { face: 'SML', upper: 'MED', full: 'BIG', group: 'FAM' };
  const PEOPLE = [
    [[0.38, 0.78, 0.66, 0.85, 0.79, 0.89], ['full', 'full', 'full', 'full', 'upper', 'upper']],
    [[0.79, 1.03, 1.00, 0.97, 0.97, 0.82], ['face', 'face', 'upper', 'upper', 'face', 'face']],
    [[1.40, 0.67, 0.79, 0.80, 0.41, 0.75], ['group', 'face', 'full', 'face', 'full', 'face']],
    [[0.69, 0.61, 0.59, 1.36, 0.94, 0.80], ['group', 'group', 'group', 'group', 'group', 'full']]
  ];
  const sig = r => r.placed.map(a => [a.photo, a.inch, a.x.toFixed(3), a.y.toFixed(3)].join(':')).join('|');
  const packK = (aspects, keys) => P._packComposed(aspects.map((a, i) => ({ base: 'O' + i, aspect: a, cutAspect: a, shotType: keys[i] })),
    0, W, H, G, { hero: heroBox, decoWant: P.COMPOSED_DECO_MAX, rimPt: RIM });
  const sameSheet = PEOPLE.every(([aspects, types]) => {
    const byName = types.map((t, i) => P._composedNameType('O_0' + (i + 1) + '_' + TOK[t]).key);
    return byName.join() === types.join() && sig(packK(aspects, byName)) === sig(packK(aspects, types));
  });
  chk('종류대로 붙인 파일명 → 종류를 직접 준 판과 같다 (사람 주문 4건)', sameSheet);
}

console.log('\n══ 칼선 비율 · 메인 index · 맞춤 보정 ══');
{
  chk('칼선 비율 = (relW/relH) × 캔버스 비율',
      Math.abs(P._composedCutAspect(0.75, { relL: 0, relT: 0, relW: 0.9, relH: 0.6 }) - 1.125) < 1e-9);
  chk('손상 캐시(relW 0.00008) 거부', P._composedCutAspect(0.75, { relL: 0, relT: 0, relW: 0.00008, relH: 0.00008 }) === 0);
  chk('rel > 1.01 거부', P._composedCutAspect(0.75, { relL: 0, relT: 0, relW: 1.5, relH: 0.9 }) === 0);
  chk('NaN 거부', P._composedCutAspect(0.75, { relL: 0, relT: 0, relW: NaN, relH: 0.9 }) === 0);
  const ps = pairsOf([1, 1, 1, 1, 1, 1]);
  chk('메인 기본 = 첫 사진', P._composedMainIndex(ps, '') === 0);
  chk('메인 override', P._composedMainIndex(ps, 'D3') === 3);
  chk('선택 밖이면 -1', P._composedMainIndex(ps, 'D9') === -1);
  const adj = P._composedFitAdjustment([10, 110, 50, 60], 0, 120, 60, 60);
  chk('맞춤 = 균일 배율 + 중심 이동', Math.abs(adj.scale - 1.2) < 1e-9 && adj.tx === 30 && adj.ty === 90,
      `scale ${adj.scale.toFixed(3)}`);
}

console.log('\n══ 실제 배치 (사진 9세트 × 이름 유무) ══');
{
  const sets = [
    ['Sanvi 실주문', [0.381, 0.783, 0.658, 0.846, 0.794, 0.894]],
    ['하린 얼굴(정사각)', [0.79, 0.97, 1.0, 0.97, 0.97, 0.82]],
    ['EVS-1007 전신·단체', [0.72, 0.67, 0.79, 0.80, 0.41, 0.75]],
    ['EVS-1006 사람+강아지', [0.69, 0.61, 0.59, 0.74, 0.94, 0.80]],
    ['EVS-1008 강아지', [0.90, 0.86, 0.77, 0.83, 0.88, 0.72]],
    ['전부 정사각', [1, 1, 1, 1, 1, 1]],
    ['전부 가로', [1.5, 1.4, 1.6, 1.45, 1.55, 1.35]],
    ['전부 세로로 긺', [0.4, 0.42, 0.38, 0.45, 0.41, 0.39]],
    ['극단 혼합', [0.25, 2.2, 1.0, 0.5, 1.8, 0.62]]
  ];
  let allOk = true, rows = [];
  for (const [label, aspects] of sets) {
    for (const noName of [false, true]) {
      const res = pack(aspects, { noName });
      const eps = 1e-6;
      // 셀 = 사진 + 2×rim
      for (const a of res.placed) {
        if (Math.abs(a.w - a.artW - 2 * RIM) > eps || Math.abs(a.h - a.artH - 2 * RIM) > eps) allOk = false;
        if (a.x < -eps || a.y < -eps || a.x + a.w > W + eps || a.y + a.h > H + eps) allOk = false;
        const lng = Math.max(a.artW, a.artH) / M;
        if (lng < a.inch * 25.4 - 1e-6) allOk = false;
      }
      // 칼선 박스(= 셀 − 2rim) 사이 실제 간격 ≥ gap + 2rim
      let minCut = Infinity;
      for (let i = 0; i < res.placed.length; i++) {
        for (let j = 0; j < i; j++) {
          const A = res.placed[i], B = res.placed[j];
          const dx = Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w));
          const dy = Math.max(B.y - (A.y + A.h), A.y - (B.y + B.h));
          const d = Math.max(dx, dy);
          if (d < minCut) minCut = d;
        }
      }
      if (minCut < G - eps) allOk = false;
      if (!noName && res.decos.length > P.COMPOSED_DECO_MAX) allOk = false;
      if (noName && res.decos.length !== 0) allOk = false;
      if (res.extras > P.COMPOSED_EXTRA_MAX) allOk = false;
      if (noName) rows.push(`  ${label.padEnd(20)} 사진 ${String(res.placed.length).padStart(2)} · 사다리 [${res.gradeCounts}] · ` +
        `사진면적 ${(res.evaluation.artFill * 100).toFixed(1)}% · 칼선간격 ${(minCut / M).toFixed(2)}mm · 누락 ${res.missing.length}`);
    }
  }
  rows.forEach(r => console.log(r));
  chk('18판 전부: 셀=사진+2rim · 시트 안 · 긴 변 ≥ 등급 · 간격 ≥ 1.5mm · 데코/추가 상한', allOk);

  const r1 = pack(sets[0][1]);
  chk('rim 1mm 이면 칼선 박스끼리 3.5mm — 1mm 바깥 오프셋 후에도 1.5mm 남는다',
      (() => {
        let m = Infinity;
        for (let i = 0; i < r1.placed.length; i++) for (let j = 0; j < i; j++) {
          const A = r1.placed[i], B = r1.placed[j];
          const d = Math.max(Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w)), Math.max(B.y - (A.y + A.h), A.y - (B.y + B.h)));
          if (d < m) m = d;
        }
        return m >= G - 1e-6;
      })(), `셀 간격 ${(G / M).toFixed(1)}mm + 테두리 2×1mm`);

  const noRim = pack(sets[0][1], { rim: 0 });
  chk('rim 0 이면 셀 = 사진 (기존 동작)', noRim.placed.every(a => Math.abs(a.w - a.artW) < 1e-6));
  chk('rim 0 이 rim 1 보다 많이 들어간다', noRim.placed.length >= r1.placed.length,
      `${noRim.placed.length} ≥ ${r1.placed.length}`);

  const mainB = pack(sets[0][1], { main: 3 });
  const big = mainB.placed.filter(a => a.inch === P.COMPOSED_GRADES_IN[0]);
  chk('메인 override 가 가장 큰 등급을 가져간다', big.length === 1 && big[0].photo === 3);
}

console.log('\n══ 종류가 정한 크기로 실제 배치 (주문 5건 + 극단 2종) ══');
{
  const packT = (aspects, types, main) => P._packComposed(
    aspects.map((a, i) => ({ base: 'T' + i, aspect: a, cutAspect: a, shotType: types[i] })), main || 0, W, H, G,
    { hero: heroBox, decoWant: P.COMPOSED_DECO_MAX, rimPt: RIM });
  const ORDERS = [
    ['Sanvi', [0.38, 0.78, 0.66, 0.85, 0.79, 0.89], ['full', 'full', 'full', 'full', 'upper', 'upper']],
    ['하린', [0.79, 1.03, 1.00, 0.97, 0.97, 0.82], ['face', 'face', 'upper', 'upper', 'face', 'face']],
    ['EVS-1007', [1.40, 0.67, 0.79, 0.80, 0.41, 0.75], ['group', 'face', 'full', 'face', 'full', 'face']],
    ['EVS-1006 커플', [0.69, 0.61, 0.59, 1.36, 0.94, 0.80], ['group', 'group', 'group', 'group', 'group', 'full']],
    ['EVS-1008 강아지', [0.66, 1.34, 1.60, 1.05, 0.67, 1.17], ['petBody', 'petFace', 'petBody', 'petBody', 'petBody', 'petFace']],
    ['얼굴만 6장', [0.8, 0.85, 0.9, 0.78, 0.82, 0.88], ['face', 'face', 'face', 'face', 'face', 'face']],
    ['커플만 6장', [0.7, 0.62, 1.3, 0.9, 0.66, 0.75], ['group', 'group', 'group', 'group', 'group', 'group']]
  ];
  let inWindow = true, covered = true, gapOk = true, worstSame = 999;
  for (const [label, aspects, types] of ORDERS) {
    const r = packT(aspects, types);
    const per = [0, 0, 0, 0, 0, 0], byInch = {};
    for (const a of r.placed) {
      const t = P.COMPOSED_SHOT_TYPES[P._composedTypeIndex(types[a.photo])];
      if (a.inch < t.minIn - 1e-9 || a.inch > t.maxIn + 1e-9) inWindow = false;
      per[a.photo]++;
      byInch[a.inch] = (byInch[a.inch] || 0) + 1;
    }
    if (per.some(v => v === 0) && r.missing.length === 0) covered = false;
    for (let i = 0; i < r.placed.length; i++) for (let j = 0; j < i; j++) {
      const A = r.placed[i], B = r.placed[j];
      if (A.photo !== B.photo) continue;
      worstSame = Math.min(worstSame, Math.hypot((A.x + A.w / 2 - B.x - B.w / 2) / M, (A.y + A.h / 2 - B.y - B.h / 2) / M));
    }
    for (let i = 0; i < r.placed.length; i++) for (let j = 0; j < i; j++) {
      const A = r.placed[i], B = r.placed[j];
      if (Math.max(Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w)), Math.max(B.y - (A.y + A.h), A.y - (B.y + B.h))) < G - 1e-6) gapOk = false;
    }
    const ladder = [2.5, 2, 1.5, 1.25, 1, 0.75].map(v => byInch[v] || 0).join('·');
    console.log(`  ${label.padEnd(16)} 사진 ${String(r.placed.length).padStart(2)} · 2.5/2/1.5/1.25/1/0.75 = ${ladder.padEnd(16)} · 사진별 [${per}] · 누락 ${r.missing.length}`);
  }
  chk('모든 스티커가 자기 종류의 크기 범위 안', inWindow);
  {
    const fullOnly = packT([0.38, 0.78, 0.66, 0.85, 0.79, 0.41], ['full', 'full', 'full', 'full', 'full', 'full']);
    const by = {};
    fullOnly.placed.forEach(a => by[a.inch] = (by[a.inch] || 0) + 1);
    const topShare = Math.max(...Object.values(by)) / fullOnly.placed.length;
    chk('전신만 6장: 한 크기에 60% 넘게 몰리지 않고 네 크기를 다 쓴다', topShare <= 0.6 && [2.5, 2, 1.5, 1.25].every(v => by[v] > 0),
      `${fullOnly.placed.length}장 · 2.5/2/1.5/1.25 = ${[2.5, 2, 1.5, 1.25].map(v => by[v] || 0).join('·')}`);
  }
  chk('모든 사진이 한 장 이상 (못 넣었으면 누락으로 보고)', covered);
  chk('간격 1.5mm 유지', gapOk);
  chk('같은 사진끼리 중심 거리 30mm 이상 (나란히 붙지 않는다)', worstSame >= 30, `최소 ${worstSame.toFixed(0)}mm`);

  const faces = packT([0.8, 0.85, 0.9, 0.78, 0.82, 0.88], ['face', 'face', 'face', 'face', 'face', 'face']);
  chk('얼굴만 있으면 가장 큰 스티커가 1.5"', Math.max.apply(null, faces.placed.map(a => a.inch)) === 1.5,
      `${faces.placed.length}장`);
  const couples = packT([0.7, 0.62, 1.3, 0.9, 0.66, 0.75], ['group', 'group', 'group', 'group', 'group', 'group']);
  chk('커플만 있으면 2"·2.5" 만 · 여섯 장 모두 들어간다',
      couples.placed.every(a => a.inch >= 2) && [0, 1, 2, 3, 4, 5].every(i => couples.counts[i] > 0),
      `${couples.placed.length}장 · 사진별 [${couples.counts}]`);
  const faceMain = packT([0.38, 0.8, 0.66, 0.85, 0.79, 0.89], ['full', 'face', 'full', 'full', 'upper', 'upper'], 1);
  const mainBig = Math.max.apply(null, faceMain.placed.filter(a => a.photo === 1).map(a => a.inch));
  chk('메인이 얼굴이면 메인 최대 = 얼굴 상한 1.5", 2.5" 는 다른 사진', mainBig === 1.5 &&
      faceMain.placed.some(a => a.inch === 2.5 && a.photo !== 1));
  const untyped = pack([0.381, 0.783, 0.658, 0.846, 0.794, 0.894]);
  chk('종류가 없으면 제한 없음 (0.75"~2.5" 모두 쓴다)', untyped.types.every(t => t === 'none') &&
      untyped.gradeCounts.every(v => v > 0), `[${untyped.gradeCounts}]`);
}

console.log('\n══ 사진 수 제한 없음 — 시트 나누기 · 적은 장수 시트 ══');
{
  const sizesOk = [...Array(14).keys()].map(k => k + 1).every(n => {
    const s = P._composedSheetSizes(n);
    return s.length === Math.ceil(n / P.COMPOSED_PER_SHEET) && s.reduce((a, b) => a + b, 0) === n &&
      Math.max(...s) - Math.min(...s) <= 1 && Math.max(...s) <= P.COMPOSED_PER_SHEET;
  });
  const show = n => P._composedSheetSizes(n).join('+');
  chk('시트 나누기: 시트당 최대 6장 · 장수 차이 ≤ 1 (1~14장)', sizesOk &&
      show(6) === '6' && show(7) === '4+3' && show(8) === '4+4' && show(12) === '6+6' && show(13) === '5+4+4',
      `6→${show(6)} · 7→${show(7)} · 8→${show(8)} · 12→${show(12)} · 13→${show(13)}`);
  // 파일명 순서(BIG → MED → SML)로 들어와도 큰 사진이 시트마다 나뉜다
  const byBucket = [2.5, 2.5, 2, 2, 2, 1.5, 1.5, 1.5];
  const d1 = P._composedDeal(byBucket, 0);
  const everyOnce = (plan, n) => { const all = plan.flatMap(s => s.photos); return all.length === n && new Set(all).size === n; };
  const ascending = plan => plan.every(s => s.photos.every((v, i) => i === 0 || v > s.photos[i - 1]));
  chk('시트 나누기: 사진마다 정확히 한 번 · 시트 안은 선택 순서', everyOnce(d1, 8) && ascending(d1),
      d1.map(s => '[' + s.photos + '] 메인 ' + s.main).join(' / '));
  chk('시트 나누기: 2.5″ 사진이 두 시트에 하나씩 · 각 시트 메인 = 그 시트의 큰 사진',
      d1.every(s => s.photos.filter(i => byBucket[i] === 2.5).length === 1) && d1.every(s => byBucket[s.main] === 2.5));
  const d2 = P._composedDeal(byBucket, 5);
  chk('시트 나누기: 고른 메인(얼굴)은 첫 시트의 메인 · 큰 사진은 여전히 시트마다',
      d2[0].main === 5 && d2[0].photos.indexOf(5) >= 0 && everyOnce(d2, 8) &&
      d2.every(s => s.photos.filter(i => byBucket[i] === 2.5).length === 1), d2.map(s => '[' + s.photos + '] 메인 ' + s.main).join(' / '));
  const d3 = P._composedDeal([1.5, 2.5, 2, 1.5, 2.5, 2], 3);
  chk('6장 이하는 한 시트 · 선택 순서 그대로 · 메인 그대로', d3.length === 1 && d3[0].photos.join() === '0,1,2,3,4,5' && d3[0].main === 3);

  const pm = P._composedPerPhotoMax;
  chk('사진당 같은 등급 상한: 6장 = 표 그대로 · 1장 = 6배 · 3장 = 2배 · 7장 이상 = 표',
      pm(6).join() === P.COMPOSED_PER_PHOTO_MAX.join() && pm(1).join() === P.COMPOSED_PER_PHOTO_MAX.map(v => v * 6).join() &&
      pm(3).join() === P.COMPOSED_PER_PHOTO_MAX.map(v => v * 2).join() && pm(9).join() === P.COMPOSED_PER_PHOTO_MAX.join(), `1장 [${pm(1)}]`);
  chk('같은 사진 거리 배율: 6장 = 1 · 1장 = 1/6', P._composedSameScale(6) === 1 && Math.abs(P._composedSameScale(1) - 1 / 6) < 1e-12);

  const packN = (list, main) => P._packComposed(list.map(([a, t], i) => ({ base: 'N' + i, aspect: a, cutAspect: a, shotType: t })),
    main || 0, W, H, G, { hero: heroBox, decoWant: P.COMPOSED_DECO_MAX, rimPt: RIM });
  const FEW = [
    ['1 전신', [[0.38, 'full']]], ['1 얼굴', [[0.79, 'face']]], ['1 상반신', [[0.79, 'upper']]],
    ['2 전신+얼굴', [[0.66, 'full'], [0.79, 'face']]], ['2 얼굴', [[0.79, 'face'], [1.03, 'face']]],
    ['3 전신·상반신·얼굴', [[0.66, 'full'], [0.79, 'upper'], [0.79, 'face']]],
    ['4 섞임', [[0.38, 'full'], [0.66, 'full'], [0.79, 'upper'], [0.79, 'face']]],
    ['5 섞임', [[0.66, 'full'], [0.79, 'upper'], [0.79, 'face'], [1.03, 'face'], [0.41, 'full']]]
  ];
  let fewOk = true, fillOk = true, sizesMany = true;
  for (const [label, list] of FEW) {
    const r = packN(list);
    const inches = new Set(r.placed.map(a => a.inch));
    if (r.missing.length > 0 || r.counts.some(c => c === 0)) fewOk = false;
    if (list.length <= 2 && r.evaluation.artFill < 0.45) fillOk = false;
    if (list.length === 1 && inches.size < 3) sizesMany = false;
    console.log(`  ${label.padEnd(16)} ${String(r.placed.length).padStart(2)}장 · 사진별 [${r.counts}] · 사진 면적 ${(r.evaluation.artFill * 100).toFixed(0)}%` +
      ` · 빈 곳 ${r.evaluation.hole}mm · 크기 ${[...inches].sort((a, b) => b - a).join('/')}`);
  }
  chk('사진 1~5장 시트: 모든 사진이 들어가고 누락 없음 (종류 범위는 검증기가 확인)', fewOk);
  chk('사진 1~2장 시트도 사진 면적 45% 이상 (상한을 안 풀면 1장 전신 21%)', fillOk);
  chk('사진 1장 시트는 크기 세 가지 이상', sizesMany);

  // 사진 8장 주문 = 두 시트 — 나눈 대로 배치하면 모든 사진이 어딘가에 들어간다
  const EIGHT = [[0.38, 'full'], [0.78, 'full'], [0.66, 'full'], [0.85, 'upper'], [0.79, 'upper'], [0.89, 'face'], [0.79, 'face'], [1.03, 'face']];
  const plan8 = P._composedDeal(EIGHT.map(([, t]) => P._composedTypeMax(t)), 0);
  let placedAll = new Set(), miss8 = 0;
  const per8 = plan8.map(sh => {
    const r = packN(sh.photos.map(i => EIGHT[i]), sh.photos.indexOf(sh.main));
    miss8 += r.missing.length;
    r.placed.forEach(a => placedAll.add(sh.photos[a.photo]));
    return `${r.placed.length}장`;
  });
  chk('사진 8장 → 두 시트 · 여덟 장 모두 배치 · 누락 없음', plan8.length === 2 && placedAll.size === 8 && miss8 === 0,
      `시트 ${plan8.map(s => s.photos.length).join('+')} · ${per8.join(' / ')}`);
}

console.log('\n══ 주문 보드 미리보기 → 대화창 없이 만들기 ══');
{
  const NFD = s => s.normalize('NFD');
  const pairs = ['하린_02', 'A_01_BIG', 'A_02'].map(base => ({ base: NFD(base) }));
  const cfg = { bases: ['A_02', '하린_02'], mainBase: '하린_02', nameText: ' Test ', stickerName: 'LUCKY', material: 'White Matte',
                orderNumber: 'EVS-1', orderDate: '', cutMarginMm: 1, shotTypes: { '하린_02': 'face', A_02: 'none' },
                expect: { sheets: [['A_02', '하린_02']], stickers: [12] } };
  const lo = P._composedLaunchOptions(cfg, pairs);
  const o = lo.options || {};
  chk('보드가 고른 순서대로 사진을 찾는다 (파일명 NFD ↔ 요청 NFC)',
      !lo.error && o.selectedPairs.map(p => p.base).join() === [pairs[2].base, pairs[0].base].join(), lo.error || '');
  chk('메인·종류는 실제 파일 이름으로 · 날짜가 비면 오늘 · 나머지 값 그대로',
      o.mainBase === pairs[0].base && o.shotTypes['$' + pairs[0].base] === 'face' && o.shotTypes.$A_02 === 'none' &&
      /^\d{4}-\d{2}-\d{2}$/.test(o.orderDate) && o.nameText === 'Test' && o.range === P.COMPOSED_KEY &&
      o.cutMarginMm === 1 && o.material === 'White Matte' && o.preview === cfg.expect && P._composedMainIndex(o.selectedPairs, o.mainBase) === 1);
  const ERRS = [
    [{ ...cfg, bases: [] }, '고른 사진이 없습니다'],
    [{ ...cfg, bases: ['없는사진'] }, '폴더에 없습니다'],
    [{ ...cfg, mainBase: '없는사진' }, '메인'],
    [{ ...cfg, shotTypes: { A_02: 'cat' } }, '알 수 없는 사진 종류'],
    [{ ...cfg, shotTypes: { 없는사진: 'face' } }, '종류를 고른 사진'],
    [{ ...cfg, cutMarginMm: 3 }, '칼선 여백'],
    [{ ...cfg, material: 'Paper' }, '재질'],
    [{ ...cfg, nameText: '  ' }, '고객 이름'],
  ];
  const missed = ERRS.filter(([c, word]) => !(P._composedLaunchOptions(c, pairs).error || '').includes(word));
  chk('이상한 값이면 만들지 않고 이유를 돌려준다 (' + ERRS.length + '가지)', missed.length === 0,
      missed.map(([c, w]) => w).join(', '));

  const plan = [{ photos: [0, 2], main: 0 }, { photos: [1], main: 1 }];
  const same = P._composedPreviewDiff({ sheets: [['하린_02', 'A_02'], ['A_01_BIG']], stickers: [10, 7] }, plan, [10, 7], pairs);
  chk('미리보기와 같으면 차이 없음 (NFC/NFD 무관)', same.length === 0, same.join(' / '));
  const diff = P._composedPreviewDiff({ sheets: [['A_02'], ['A_01_BIG'], ['x']], stickers: [10, 6] }, plan, [10, 7], pairs);
  chk('시트 수 · 사진 구성 · 스티커 수 차이를 적는다', diff.length === 3 && /시트 수/.test(diff[0]) &&
      /시트 1: 사진 구성/.test(diff[1]) && /시트 2: 스티커 미리보기 6장 → 실제 7장/.test(diff[2]), diff.join(' / '));
  chk('미리보기 없이 만들면 비교하지 않는다', P._composedPreviewDiff(null, plan, [1, 2], pairs).length === 0);

  const heroA = P._composedHero('LUCKY', 142 * M, G), heroK = P._composedHero('하린', 142 * M, G);
  chk('이름 스펙 공용 함수: A–Z 는 스펙, 한글은 이유와 함께 없음, 빈 이름은 없음',
      heroA.spec && heroA.skipped === '' && heroK.spec === null && /A-Z/.test(heroK.skipped) &&
      P._composedHero('', 142 * M, G).spec === null);
  const ex = P._composedPackExtras(heroA.spec, RIM), exNone = P._composedPackExtras(null, 0);
  chk('배치 옵션 공용 함수: 이름이 있을 때만 데코', ex.hero.w === heroA.spec.cellW && ex.hero.h === heroA.spec.cellH &&
      ex.decoWant === P.COMPOSED_DECO_MAX && ex.rimPt === RIM && exNone.hero === null && exNone.decoWant === 0);
  chk('미리보기 body 상수 = 템플릿 실측 142 × 175mm (테스트가 쓰는 142 × 172 = body − 위아래 여백)',
      P.COMPOSED_PREVIEW_BODY_MM.join() === '142,175' &&
      Math.abs(P.COMPOSED_PREVIEW_BODY_MM[1] - 2 * P.BODY_PADDING_Y_MM - H / M) < 1e-9);
}

console.log('\n══ 배치 선택 (스타일 · 이름 위치 · 좌우 바꿈 · 섞기) ══');
{
  const ORD = [
    [[0.38, 0.78, 0.66, 0.85, 0.79, 0.89], ['full', 'full', 'full', 'full', 'upper', 'upper']],
    [[0.79, 1.03, 1.00, 0.97, 0.97, 0.82], ['face', 'face', 'upper', 'upper', 'face', 'face']],
    [[1.40, 0.67, 0.79, 0.80, 0.41, 0.75], ['group', 'face', 'full', 'face', 'full', 'face']],
    [[0.69, 0.61, 0.59, 1.36, 0.94, 0.80], ['group', 'group', 'group', 'group', 'group', 'full']],
    [[0.66, 1.34, 1.60, 1.05, 0.67, 1.17], ['petBody', 'petFace', 'petBody', 'petBody', 'petBody', 'petFace']],
    [[0.8, 0.85, 0.9, 0.78, 0.82, 0.88], ['face', 'face', 'face', 'face', 'face', 'face']],
    [[0.7, 0.62, 1.3, 0.9, 0.66, 0.75], ['group', 'group', 'group', 'group', 'group', 'group']],
  ];
  const pairsT = o => o[0].map((a, i) => ({ base: 'T' + i, aspect: a, cutAspect: a, shotType: o[1][i] }));
  const packL = (o, layout, noName) => P._packComposed(pairsT(o), 0, W, H, G,
    { hero: noName ? null : heroBox, decoWant: noName ? 0 : P.COMPOSED_DECO_MAX, rimPt: RIM, layout });
  const STYLES = P.COMPOSED_STYLES.map(s => s.key);

  const d0 = P._composedLayoutSpec(null);
  chk('선택 없음 = 가운데 · 이름 왼쪽 · 뒤집기 없음 · 섞기 0 (예전 배치)',
      d0.style === 'center' && d0.namePos === 'left' && d0.mirror === false && d0.seed === 0 && STYLES[0] === 'center');
  const s1 = P._composedLayoutSpec({ style: 'sides' }), s2 = P._composedLayoutSpec({ style: 'frame', namePos: 'right', mirror: true, seed: 7 });
  chk('빠진 값은 스타일 기본 (양옆 → 이름 가운데) · 준 값은 그대로',
      s1.namePos === 'center' && s1.mirror === false && s1.seed === 0 &&
      s2.style === 'frame' && s2.namePos === 'right' && s2.mirror === true && s2.seed === 7);
  const BAD = [{ style: 'spiral' }, { namePos: 'top' }, { mirror: 'yes' }, { mirror: 1 }, { seed: true }, { seed: -1 },
               { seed: P.COMPOSED_SHUFFLE_MAX + 1 }, { seed: 1.5 }, { seed: '3' }, { seed: NaN }, 'sides', 3];
  chk('이상한 배치 선택은 null (기본으로 바꾸지 않는다) — ' + BAD.length + '가지', BAD.every(b => P._composedLayoutSpec(b) === null),
      BAD.filter(b => P._composedLayoutSpec(b) !== null).map(b => JSON.stringify(b)).join(' '));
  let threw = '';
  try { packL(ORD[0], { style: 'spiral' }); } catch (e) { threw = e.message; }
  chk('엔진도 이상한 배치 선택이면 멈춘다', /배치 선택/.test(threw), threw);
  chk('이름 위치 "자동" = 스타일 자리, 고르면 그 자리',
      P._composedResolveNamePos('sides', 'auto') === 'center' && P._composedResolveNamePos('center', 'auto') === 'left' &&
      P._composedResolveNamePos('bottom', 'right') === 'right' && P._composedResolveNamePos('모름', 'auto') === 'left');
  chk('표시 이름: 좌우 바꿈이면 이름이 반대편에 보인다',
      P._composedLayoutLabel({ style: 'sides', namePos: 'center', mirror: true, seed: 3 }) === '양옆 · 이름 가운데 · 좌우 바꿈 · 섞기 3' &&
      P._composedLayoutLabel({ style: 'center', namePos: 'left', mirror: true, seed: 0 }) === '가운데 · 이름 오른쪽 · 좌우 바꿈' &&
      P._composedMirrorSpec('frame', 'left', 0).namePos === 'right');

  let sameDefault = true;
  for (const o of ORD) {
    for (const noName of [false, true]) {
      const a = packL(o, undefined, noName), b = packL(o, { style: 'center', namePos: 'left', mirror: false, seed: 0 }, noName);
      if (a.sig !== b.sig || JSON.stringify(a.placed) !== JSON.stringify(b.placed)) sameDefault = false;
    }
  }
  chk('기본 선택을 명시해도 선택 없음과 같은 판 (주문 7건 × 이름 유무)', sameDefault);

  // 스타일 × 이름 위치 × 좌우 바꿈 × 섞기 — 전부 검사기 통과 · 결정적 · 이름이 고른 자리에 보인다
  let runs = 0, fails = [], nondet = 0, posBad = 0;
  for (const st of STYLES) {
    for (const pos of P.COMPOSED_NAME_POSITIONS) {
      for (const mirror of [false, true]) {
        for (const seed of [0, 2]) {
          for (const o of ORD) {
            const lay = { style: st, namePos: pos, mirror, seed };
            let r;
            try { r = packL(o, lay); } catch (e) { fails.push(`${st}/${pos}/${mirror}/${seed}: ${e.message}`); continue; }
            runs++;
            if (packL(o, lay).sig !== r.sig) nondet++;
            const nb = r.nameBox, cx = (nb.x + nb.w / 2) / W;
            const seen = cx < 0.34 ? 'left' : (cx > 0.66 ? 'right' : 'center');
            if (seen !== P._composedVisibleNamePos(r.layout)) posBad++;
          }
        }
      }
    }
  }
  chk(`스타일 ${STYLES.length} × 이름 위치 3 × 좌우 바꿈 × 섞기 × 주문 7 = ${runs}판 전부 검사기 통과`, fails.length === 0, fails.slice(0, 2).join(' / '));
  chk('같은 선택 → 같은 판 (섞기 포함, 난수 없음)', nondet === 0, nondet + '판 다름');
  chk('이름이 고른 쪽에 보인다 (좌우 바꿈이면 반대로 계산해서)', posBad === 0, posBad + '판 어긋남');

  {
    const o = ORD[0], a = packL(o, { style: 'sides', namePos: 'left' }), b = packL(o, { style: 'sides', namePos: 'left', mirror: true });
    const mir = (p, q) => Math.abs(q.x - (W - p.x - p.w)) < 1e-9 && Math.abs(q.y - p.y) < 1e-9 && q.w === p.w && q.h === p.h;
    chk('좌우 바꿈 = 같은 계산을 거울에 비친 판 (사진·데코·이름 모두)',
        a.placed.every((p, i) => mir(p, b.placed[i])) && a.decos.every((p, i) => mir(p, b.decos[i])) && mir(a.nameBox, b.nameBox) &&
        a.sig !== b.sig && a.placed.length === b.placed.length);
  }
  const eligible = [];      // 큰 조각 분산이 실제로 돈 주문 (자리가 모자란 주문은 분산 없이 다시 계산해 스타일이 안 보인다)
  for (const o of ORD) {
    const rs = {};
    for (const st of STYLES) rs[st] = packL(o, { style: st, namePos: P._composedResolveNamePos(st, 'auto') });
    if (STYLES.every(st => rs[st].spreadCount === P.COMPOSED_SPREAD_COUNT)) eligible.push(rs);
  }
  const first = (r, f) => { const a = r.placed[0]; return f((a.x + a.w / 2) / W, (a.y + a.h / 2) / H, a, r.placed[1]); };
  const side = (u) => Math.abs(2 * u - 1), edgeU = (u, v) => Math.min(u, 1 - u, v, 1 - v);
  const gapMm = (a, b) => Math.max(0, Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)), Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h))) / M;
  const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;
  chk(`스타일 의도 (분산이 돈 주문 ${eligible.length}건) — 가운데: 첫 조각이 가로 가운데 · 양옆: 옆 · 가장자리: 가장자리`,
      eligible.length >= 4 &&
      eligible.every(rs => first(rs.center, u => side(u) < 0.15)) &&
      eligible.every(rs => first(rs.sides, u => side(u) > 0.45)) &&
      eligible.every(rs => first(rs.frame, (u, v) => edgeU(u, v) < 0.2) && first(rs.center, (u, v) => edgeU(u, v) > 0.3)),
      eligible.map(rs => `${first(rs.center, u => side(u).toFixed(2))}/${first(rs.sides, u => side(u).toFixed(2))}/${first(rs.frame, (u, v) => edgeU(u, v).toFixed(2))}`).join(' '));
  chk('스타일 의도 — 아래쪽: 첫 조각이 가운데 스타일보다 아래 · 모으기: 첫 두 조각이 붙는다',
      mean(eligible.map(rs => first(rs.bottom, (u, v) => v))) > mean(eligible.map(rs => first(rs.center, (u, v) => v))) + 0.05 &&
      eligible.every(rs => first(rs.cluster, (u, v, a, b) => gapMm(a, b) < 1.5 + 0.1)) &&
      eligible.some(rs => first(rs.center, (u, v, a, b) => gapMm(a, b) > 5)),
      `v ${mean(eligible.map(rs => first(rs.bottom, (u, v) => v))).toFixed(2)} vs ${mean(eligible.map(rs => first(rs.center, (u, v) => v))).toFixed(2)}`);
  const distinct = STYLES.slice(1).map(st => eligible.filter(rs => rs[st].sig !== rs.center.sig).length);
  chk('스타일마다 가운데와 다른 판', distinct.every(n => n === eligible.length), distinct.join('/'));
  const s0 = packL(ORD[1], { seed: 0 }), sh = [1, 2, 3].map(seed => packL(ORD[1], { seed }));
  chk('섞기 번호마다 다른 판', sh.every(r => r.sig !== s0.sig) && new Set(sh.map(r => r.sig)).size === 3);
  const vals = [];
  for (let x = 0; x < 140; x += 3.7) vals.push(P._composedShuffle(5, x, 172 - x, 2, 3, 10));
  chk('섞기 흔들림: 0 ≤ 값 < 폭 · 번호 0 이면 0 · 같은 입력이면 같은 값',
      vals.every(v => v >= 0 && v < 10) && new Set(vals.map(v => v.toFixed(6))).size > vals.length * 0.8 &&
      P._composedShuffle(0, 10, 10, 1, 1, 10) === 0 && P._composedShuffle(5, 10, 10, 1, 1, 10) === P._composedShuffle(5, 10, 10, 1, 1, 10));

  // 주문 보드 "변형" 줄
  let varOk = true, varMsg = [];
  for (const o of ORD) {
    for (const pos of P.COMPOSED_NAME_POSITIONS) {
      const vs = P._composedVariants(pairsT(o), 0, W, H, G, HERO, RIM, 'sides', pos);
      const kinds = vs.map(v => v.kind);
      const base = vs[0];
      const shuffles = vs.filter(v => v.kind === 'shuffle');
      const ok = kinds[0] === 'base' && kinds.filter(k => k === 'base').length === 1 && kinds.filter(k => k === 'mirror').length <= 1 &&
        shuffles.length <= P.COMPOSED_VARIANT_KEEP && new Set(vs.map(v => v.res.sig)).size === vs.length &&
        shuffles.every(v => v.res.placed.length >= base.res.placed.length - P.COMPOSED_VARIANT_DROP) &&
        vs.every(v => P._composedVisibleNamePos(v.layout) === pos && v.layout === v.res.layout);
      if (!ok) { varOk = false; varMsg.push(kinds.join(',')); }
    }
  }
  chk('변형 줄 = 기본 · 좌우 바꿈 · 섞기(스티커 덜 준 것, 서로 다른 판) · 이름은 모두 고른 자리', varOk, varMsg.join(' / '));

  // 배치 지문 · 보드 → Illustrator
  const r0 = packL(ORD[2], { style: 'frame' });
  const moved = JSON.parse(JSON.stringify({ placed: r0.placed, decos: r0.decos, nameBox: r0.nameBox }));
  moved.placed[3].x += 0.2 * M;
  chk('배치 지문: 16진 · 같은 판이면 같고 0.2mm 만 움직여도 달라진다',
      /^[0-9a-f]{1,8}$/.test(r0.sig) && P._composedLayoutSig(r0) === r0.sig && P._composedLayoutSig(moved) !== r0.sig);
  // 좌표는 대개 0.05mm 배수 — 계산기 사이 아주 작은 오차(템플릿 72/25.4 환산 등)로 반올림이 뒤집히면 안 된다 (09-16 실측 사고)
  const nice = [33.75, 35.25, 19.05, 142 - 33.75, 0.05, 12.7];
  chk('배치 지문 반올림: 0.05mm 배수 값은 ±1e-6mm 흔들려도 같은 칸',
      nice.every(mm => P._composedSigMm(mm * M) === P._composedSigMm((mm + 1e-6) * M) && P._composedSigMm(mm * M) === P._composedSigMm((mm - 1e-6) * M)),
      nice.map(mm => P._composedSigMm(mm * M)).join(','));
  const pb = P._composedPreviewBin();
  chk('미리보기·시트 생성 공용 배치 영역 = 142 × 172mm (같은 식)', pb.w === 142 * M && pb.h === 172 * M);
  chk('칼선 비율은 백만분의 1 로 맞춘다 (따로 읽은 .evcut 의 마지막 자리 차이 흡수)',
      P._composedCutAspect(0.7, { relL: 0, relT: 0, relW: 0.8, relH: 0.9 }) === Math.round(0.8 / 0.9 * 0.7 * 1e6) / 1e6 &&
      P._composedCutAspect(0.7, { relL: 0, relT: 0, relW: 0.8, relH: 0.9 }) === P._composedCutAspect(0.7 * (1 + 1e-15), { relL: 0, relT: 0, relW: 0.8, relH: 0.9 }));
  const pairsB = ['A_01', 'A_02'].map(base => ({ base }));
  const cfgB = { bases: ['A_01', 'A_02'], nameText: 'T', material: 'White Matte', cutMarginMm: 1,
                 layouts: [{ style: 'cluster', namePos: 'right', mirror: false, seed: 4 }, {}] };
  const lb = P._composedLaunchOptions(cfgB, pairsB);
  chk('보드가 넘긴 시트별 배치를 정리해서 싣는다 (빈 칸 = 기본)', !lb.error && lb.options.layouts.length === 2 &&
      lb.options.layouts[0].style === 'cluster' && lb.options.layouts[0].seed === 4 &&
      lb.options.layouts[1].style === 'center' && lb.options.layouts[1].namePos === 'left', lb.error || '');
  const noLay = P._composedLaunchOptions({ ...cfgB, layouts: undefined }, pairsB);
  chk('배치를 안 넘기면 없음 (Illustrator 는 기본 배치)', !noLay.error && noLay.options.layouts === null);
  const badLay = [[{ ...cfgB, layouts: { style: 'sides' } }, '배치 선택'], [{ ...cfgB, layouts: [{ style: 'x' }] }, '시트 1'],
                  [{ ...cfgB, layouts: [{}, { seed: -3 }] }, '시트 2']];
  chk('이상한 배치 선택이면 만들지 않는다', badLay.every(([c, w]) => (P._composedLaunchOptions(c, pairsB).error || '').includes(w)),
      badLay.map(([c]) => P._composedLaunchOptions(c, pairsB).error).join(' / '));
  const exL = P._composedPackExtras(HERO, RIM, { style: 'bottom' });
  chk('배치 옵션 공용 함수가 배치 선택을 싣는다', exL.layout.style === 'bottom' && P._composedPackExtras(HERO, RIM).layout === null);
  const planB = [{ photos: [0], main: 0 }, { photos: [1], main: 1 }];
  const sameSig = P._composedPreviewDiff({ stickers: [10, 7], sigs: ['abc', 'def'] }, planB, [10, 7], pairsB, ['abc', 'def']);
  const moveSig = P._composedPreviewDiff({ stickers: [10, 7], sigs: ['abc', 'def'] }, planB, [10, 7], pairsB, ['abc', '999']);
  const bothSig = P._composedPreviewDiff({ stickers: [10, 6], sigs: ['abc', 'def'] }, planB, [10, 7], pairsB, ['abc', '999']);
  const noSig = P._composedPreviewDiff({ stickers: [10, 7], sigs: ['', 'def'] }, planB, [10, 7], pairsB, ['zzz', 'def']);
  chk('미리보기 비교: 지문이 다르면 "자리가 다름" · 수가 다르면 수만 · 빈 지문은 비교 안 함',
      sameSig.length === 0 && moveSig.length === 1 && /시트 2: 스티커 자리가 미리보기와 다름/.test(moveSig[0]) &&
      bothSig.length === 1 && /스티커 미리보기 6장/.test(bothSig[0]) && noSig.length === 0,
      [moveSig, bothSig, noSig].map(x => x.join('|')).join(' / '));
}

console.log('\n══ 크기 직접 고르기 (사진마다 0.75~2.5″ 안의 최소·최대) ══');
{
  chk('크기 범위 정리: 사다리 값 · 최소 ≤ 최대만',
      JSON.stringify(P._composedSizeRange([1, 2.5])) === '[1,2.5]' && JSON.stringify(P._composedSizeRange([0.75, 0.75])) === '[0.75,0.75]' &&
      [[2, 1], [0.5, 1], [1], [1, 2, 2.5], ['1', '2'], [true, 2], null, '1-2', { 0: 1, 1: 2 }].every(x => P._composedSizeRange(x) === null));
  chk('크기 창 = 범위 안 등급만 (사다리 순서 2.5·2·1.5·1.25·1·0.75)',
      P._composedRangeWindow([1, 1.5]).join() === 'false,false,true,true,true,false' &&
      P._composedRangeWindow([0.75, 2.5]).every(Boolean));
  const mk = (ranges) => [0.8, 0.85, 0.72, 0.9, 0.66, 0.78].map((a, i) => ({ base: 'S' + i, aspect: a, cutAspect: a,
    shotType: ['face', 'face', 'full', 'upper', 'full', 'face'][i], sizeRange: ranges[i] || null }));
  const ranges = { 0: [2, 2.5], 2: [0.75, 0.75], 3: [1.25, 1.25] };
  const rr = P._packComposed(mk(ranges), 0, W, H, G, { hero: heroBox, decoWant: 6, rimPt: RIM });
  const inR = rr.placed.every(a => {
    const rg = ranges[a.photo];
    if (rg) return a.inch >= rg[0] && a.inch <= rg[1];
    const t = P.COMPOSED_SHOT_TYPES[P._composedTypeIndex(rr.types[a.photo])];
    return a.inch >= t.minIn && a.inch <= t.maxIn;
  });
  const by = i => rr.placed.filter(a => a.photo === i).map(a => a.inch);
  chk('직접 고른 범위가 종류 범위를 대신한다 (얼굴 → 2~2.5″ · 전신 → 0.75″만 · 상반신 → 1.25″만) · 나머지는 종류대로',
      inR && by(0).length > 0 && by(0).every(v => v >= 2) && by(2).length > 0 && by(2).every(v => v === 0.75) &&
      by(3).length > 0 && by(3).every(v => v === 1.25) && rr.ranges[0].join() === '2,2.5' && rr.ranges[1] === null,
      `얼굴 [${by(0)}] · 전신 [${by(2)}] · 상반신 [${by(3)}]`);
  let bad = '';
  try { P._packComposed(mk({ 1: [2, 1] }), 0, W, H, G, { rimPt: RIM }); } catch (e) { bad = e.message; }
  chk('이상한 크기 범위면 엔진이 멈춘다', /크기 범위/.test(bad), bad);
  const t2 = JSON.parse(JSON.stringify({ placed: rr.placed, decos: rr.decos, nameBox: rr.nameBox, counts: rr.counts, extras: rr.extras,
    missing: rr.missing, skipped: rr.skipped, gradeCounts: rr.gradeCounts, rimPt: rr.rimPt, types: rr.types, windows: rr.windows, ranges: rr.ranges }));
  const i2 = t2.placed.findIndex(a => a.photo === 2);
  t2.placed[i2].grade = 4; t2.placed[i2].inch = 1;
  const msg = P._composedValidate(t2, mk({}), W, H, G);
  chk('검사기: 직접 고른 범위 밖이면 "크기 범위 밖 … 직접" 으로 알린다', /크기 범위 밖/.test(msg) && /직접 0.75~0.75/.test(msg), msg);
  chk('시트 나누기용 최대 인치 = 직접 고른 최대 (없으면 종류 최대)',
      P._composedPairMaxIn({ shotType: 'face', sizeRange: [1, 2.5] }) === 2.5 && P._composedPairMaxIn({ shotType: 'face' }) === 1.5 &&
      P._composedPairMaxIn({ shotType: 'full', sizeRange: [0.75, 1] }) === 1 && P._composedPairMaxIn({}) === 2.5);
  const NFD = s => s.normalize('NFD');
  const pairsS = ['하린_02', 'A_01_BIG'].map(base => ({ base: NFD(base) }));
  const cfgS = { bases: ['하린_02', 'A_01_BIG'], nameText: 'T', material: 'White Matte', cutMarginMm: 1,
                 sizeRanges: { '하린_02': [1.5, 2.5], A_01_BIG: [0.75, 1] } };
  const ls = P._composedLaunchOptions(cfgS, pairsS);
  chk('보드가 넘긴 크기 범위를 실제 파일 이름으로 싣는다 (NFC ↔ NFD)', !ls.error &&
      ls.options.sizeRanges['$' + pairsS[0].base].join() === '1.5,2.5' && ls.options.sizeRanges.$A_01_BIG.join() === '0.75,1', ls.error || '');
  const badS = [[{ ...cfgS, sizeRanges: [[1, 2]] }, '크기 범위'], [{ ...cfgS, sizeRanges: { A_01_BIG: [2, 1] } }, 'A_01_BIG'],
                [{ ...cfgS, sizeRanges: { 없는사진: [1, 2] } }, '크기를 고른 사진']];
  chk('이상한 크기 범위면 만들지 않는다', badS.every(([c, w]) => (P._composedLaunchOptions(c, pairsS).error || '').includes(w)),
      badS.map(([c]) => P._composedLaunchOptions(c, pairsS).error).join(' / '));
  const probeStub = { recs: [null, null], saved: [null, null] };
  const g = P._composedGuessTypes([{ base: 'X_01', sizeRange: [1, 2] }, { base: 'X_02_SML', sizeRange: [2, 2.5] }], probeStub, null);
  chk('크기만 정한 사진은 측정 없이 "크기 직접" (파일명 표시가 있으면 표시가 종류)',
      g[0].key === P.COMPOSED_TYPE_NONE && g[0].note === '크기 직접' && g[0].given === true && g[1].key === 'face' && g[1].named);
}

console.log('\n══ 이름 스타일 (레트로 · 버블 통짜) ══');
{
  const keys = P.COMPOSED_NAME_STYLES.map(s => s.key);
  chk('스타일 표: 키가 겹치지 않고 첫 번째가 레트로 · 빈 키 = 레트로 · 모르는 키 = null',
      new Set(keys).size === keys.length && keys[0] === 'retro' && keys.indexOf('bubble') > 0 &&
      P._nameStyle('') === P.COMPOSED_NAME_STYLES[0] && P._nameStyle(undefined) === P.COMPOSED_NAME_STYLES[0] &&
      P._nameStyle('bubble').key === 'bubble' && P._nameStyle('gothic') === null, keys.join(', '));
  const retro = P._nameStyle('retro'), bubble = P._nameStyle('bubble');
  chk('레트로 = 예전 라이브러리·표·간격 그대로 (통짜 아님 · 흰 테두리 0)',
      retro.letterLib === 'alphabet_art_v1.ai' && retro.decoLib === 'deco_art_v1.ai' && retro.metrics === P.LETTER_ART_METRICS &&
      retro.decoOrder === P.DECO_ORDER && retro.unitMm === P.RANGE_HERO_UNIT_MM && retro.gap === P.LETTER_GAP_RATIO &&
      !retro.whole && retro.halo === 0 && !retro.rimBox);
  const V2 = P.LETTER_ART_METRICS_V2, sideOf = {};
  let tableOk = true, why = '';
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const t = V2[ch];
    if (!t || !t.core) { tableOk = false; why = ch + ' 없음'; break; }
    for (const [k, m] of Object.entries(t)) {
      if (['core', 'L', 'R'].indexOf(k) < 0 || !(m.aw > 0.3 && m.aw < 1.4) || !(m.fh > 0.8 && m.fh < 1.2) || !(m.bl > 0.9 && m.bl <= 1)) {
        tableOk = false; why = ch + ' ' + k + ' ' + JSON.stringify(m);
      }
      if (k !== 'core') sideOf[ch] = k;
      if (k !== 'core' && !(m.aw * m.fh > t.core.aw * t.core.fh)) { tableOk = false; why = ch + ' 옆 장식 틀이 더 좁다'; }
    }
  }
  chk('버블 치수표: 26자 core · 값 범위 · 옆 장식 틀은 core 보다 넓다', tableOk, why || JSON.stringify(sideOf));
  chk('옆 장식은 V 왼쪽 · C 오른쪽 · Z 오른쪽뿐', JSON.stringify(sideOf) === JSON.stringify({ C: 'R', V: 'L', Z: 'R' }));
  chk('버블 데코 순서: 겹치지 않고 시트당 개수보다 길다',
      new Set(P.DECO_ORDER_V2).size === P.DECO_ORDER_V2.length && P.DECO_ORDER_V2.length >= P.COMPOSED_DECO_MAX &&
      P.DECO_ORDER_V2.every(n => /^[A-Z0-9]+$/.test(n)), P.DECO_ORDER_V2.slice(0, P.COMPOSED_DECO_MAX).join(' '));

  // 레트로는 스타일을 넘기든 안 넘기든 이 작업 전(2026-09-16) 값과 **같은 값** (실측 스냅숏)
  const OLD = { SANVI: [16, 219.56396781128763, 45.35432], Harin: [16, 224.26534200198253, 45.35432],
                'Charles Cho': [14.673088257981235, 311.81095, 97.74354122285625], Christopher: [9.481471951163703, 311.81095, 26.876607059006435],
                'Anne Marie Kim': [16, 225.66468593101118, 167.810984], ZOE: [16, 132.50468211994658, 45.35432] };
  const sameOld = Object.entries(OLD).every(([n, v]) => ['', 'retro'].every(st => {
    const h = st ? P._composedHero(n, W, G, st) : P._composedHero(n, W, G);
    return h.spec && h.spec.unitMm === v[0] && h.spec.cellW === v[1] && h.spec.cellH === v[2] && !h.spec.whole && h.spec.halo === 0;
  }));
  chk('레트로 이름 치수 = 작업 전 값 (스타일 생략 · retro 둘 다, 비트 단위)', sameOld);
  const tallSet = [0.38, 0.78, 0.66, 0.85, 0.79, 0.89].map((a, i) => ({ base: 'D' + i, aspect: a, cutAspect: a, shotType: 'none' }));
  const retroPack = st => {
    const h = st ? P._composedHero('SANVI', W, G, st) : P._composedHero('SANVI', W, G);
    return P._packComposed(tallSet, 0, W, H, G, P._composedPackExtras(h.spec, RIM, null));
  };
  const r0 = retroPack(''), r1 = retroPack('retro');
  // 데코 모양은 2026-09-17 부터 스티커 이름 자리에서 시작한다 (_composedDecoStart) — 자리·크기(지문)는 작업 전 그대로.
  const rotated = (order, start, n) => Array.from({ length: n }, (_, k) => order[(start + k) % order.length]).join();
  const sanviSpec = P._composedHero('SANVI', W, G).spec, sanviStart = P._composedDecoStart(sanviSpec, 0);
  chk('레트로 배치 = 작업 전 판 (지문 af6aae65 · 데코는 이름 자리부터 같은 순서 · 박스 안쪽 여백 0)',
      r0.sig === 'af6aae65' && r1.sig === r0.sig && r0.nameStyle === 'retro' && r0.namePad === 0 &&
      r0.decoStart === sanviStart && r0.decos.map(d => d.payload.deco).join() === rotated(P.DECO_ORDER, sanviStart, r0.decos.length) &&
      r0.decos.every(d => d.payload.style === 'retro' && d.payload.pad === 0), r0.sig + ' · 시작 ' + sanviStart);
  const r00 = P._packComposed(tallSet, 0, W, H, G, { ...P._composedPackExtras(sanviSpec, RIM, null), decoStart: 0 });
  chk('데코 시작 자리 0 = 작업 전 데코 순서 그대로', r00.sig === 'af6aae65' && r00.decoStart === 0 &&
      r00.decos.map(d => d.payload.deco).join() === 'HEART,FLOWER,STAR,CAMERA,BOW', r00.decos.map(d => d.payload.deco).join());

  // 버블 이름 스펙
  const bs = P._composedHero('Vivian', W, G, 'bubble').spec;
  const u = bs.unit, boxes = P._artLetterBoxes(bs);
  chk('버블 스펙: 통짜 · 유닛 13mm · 흰 테두리 = 유닛 × 0.08 · 블록 = 글자 + 테두리',
      bs.whole && bs.nameStyle === 'bubble' && bs.unitMm === 13 && Math.abs(bs.halo - 0.08 * u) < 1e-9 &&
      Math.abs(bs.cellW - (u * bs.artWCoef + 2 * bs.halo)) < 1e-9 && Math.abs(bs.cellH - (u + 2 * bs.halo)) < 1e-9 &&
      Math.abs(bs.innerGap - (-0.03 * u)) < 1e-9,
      `${(bs.cellW / M).toFixed(1)} × ${(bs.cellH / M).toFixed(1)}mm · 테두리 ${(bs.halo / M).toFixed(2)}mm`);
  const EPS = 1e-6;
  let inside = true, order = true, base = true;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i], m = V2[b.ch][b.variant];
    if (b.x < bs.halo - EPS || b.y < bs.halo - EPS || b.x + b.w > bs.cellW - bs.halo + EPS || b.y + b.h > bs.cellH - bs.halo + EPS) inside = false;
    if (Math.abs(b.h - bs.capPt * m.fh) > EPS || Math.abs(b.w - m.aw * b.h) > EPS) inside = false;
    if (i && Math.abs(b.x - (boxes[i - 1].x + boxes[i - 1].w + bs.innerGap)) > EPS) order = false;
    if (i && Math.abs((b.y + m.bl * b.h) - (boxes[0].y + V2[boxes[0].ch][boxes[0].variant].bl * boxes[0].h)) > EPS) base = false;
  }
  chk('글자 자리: 테두리 안쪽 · 틀 = 표 × 배율 · 살짝 겹쳐 이어짐 · 바닥선 하나', inside && order && base,
      boxes.map(b => b.ch + (b.variant === 'core' ? '' : '(' + b.variant + ')')).join(''));
  chk('글자 자리: 줄 폭이 블록에 꽉 찬다 (가운데 정렬 · 좌우 테두리만 남음)',
      Math.abs(boxes[0].x - bs.halo) < EPS && Math.abs(boxes[boxes.length - 1].x + boxes[boxes.length - 1].w - (bs.cellW - bs.halo)) < EPS);
  const variants = n => P._artLetterBoxes(P._composedHero(n, W, G, 'bubble').spec).map(b => b.ch + ':' + b.variant).join(' ');
  chk('옆 장식은 줄 맨 앞(L)·맨 끝(R) 글자만 — 가운데 V·Z·C 는 core',
      variants('VIV') === 'V:L I:core V:core' && variants('LIZ') === 'L:core I:core Z:R' && variants('ZAC') === 'Z:core A:core C:R' &&
      variants('V') === 'V:L' && variants('Z') === 'Z:R' && variants('Cliv Zev') === 'C:core L:core I:core V:core Z:core E:core V:core',
      [variants('VIV'), variants('LIZ'), variants('Cliv Zev')].join(' | '));
  const two = P._composedHero('Anne Kim', W, G, 'bubble').spec, tb = P._artLetterBoxes(two);
  chk('두 단어 = 두 줄 (줄 간격 = 유닛 × 0.1) · 줄마다 가운데',
      two.lines.length === 2 && Math.abs(two.cellH - (2 * two.unit + two.lineGap + 2 * two.halo)) < 1e-9 &&
      Math.abs(two.lineGap - 0.1 * two.unit) < 1e-9 && tb.filter(b => b.line === 1).length === 3 &&
      tb.filter(b => b.line === 1)[0].x > tb.filter(b => b.line === 0)[0].x);
  const long = P._composedHero('Maximilianwolfgang', W, G, 'bubble').spec;
  const maxW = Math.min(P.RANGE_HERO_MAX_W_MM, W / M - 2 * P.RANGE_MARGIN_X_MM) * M;
  chk('긴 이름은 유닛을 낮춰 폭 상한에 딱 맞춘다 (흰 테두리도 같이 준다)',
      long.unitMm < 13 && Math.abs(long.cellW - maxW) < 1e-6 && Math.abs(long.halo - 0.08 * long.unit) < 1e-9,
      `유닛 ${long.unitMm.toFixed(2)}mm · 폭 ${(long.cellW / M).toFixed(2)}mm`);
  chk('한글·숫자 이름은 버블도 건너뛴다 (같은 이유)', P._composedHero('하린', W, G, 'bubble').spec === null &&
      P._composedHero('하린', W, G, 'bubble').skipped === P._composedHero('하린', W, G).skipped);
  let threw = '';
  try { P._composedHero('SANVI', W, G, 'gothic'); } catch (e) { threw = e.message; }
  chk('모르는 스타일이면 조용히 바꾸지 않고 예외', /알 수 없는 이름 스타일/.test(threw), threw);

  // 레트로 글자 자리 = 예전 그리기 계산식 (줄 폭 → 가운데 → 바닥선)
  const rs = P._composedHero('Harin Cho', W, G, 'retro').spec, rb = P._artLetterBoxes(rs);
  let retroOk = rs.lines.length === 2;
  for (let ln = 0; ln < rs.lines.length; ln++) {
    const line = rs.lines[ln];
    let lineW = (line.length - 1) * rs.innerGap;
    for (const ch of line) lineW += P.LETTER_ART_METRICS[ch].aw * rs.capPt / P.LETTER_ART_METRICS[ch].cap;
    let cur = (rs.cellW - lineW) / 2;
    const baseY = ln * (rs.unit + rs.innerGap) + rs.baselinePt;
    for (const ch of line) {
      const m = P.LETTER_ART_METRICS[ch], fh = rs.capPt / m.cap, b = rb.shift();
      if (!b || b.ch !== ch || b.variant !== '' || Math.abs(b.x - cur) > EPS || Math.abs(b.y - (baseY - m.bl * fh)) > EPS ||
          Math.abs(b.h - fh) > EPS || Math.abs(b.w - m.aw * fh) > EPS) retroOk = false;
      cur += m.aw * fh + rs.innerGap;
    }
  }
  chk('레트로 글자 자리 = 예전 _drawArtLetterBlock 계산식', retroOk && rb.length === 0);

  // 버블 배치 — 이름 박스는 칼선 여백만큼 넓게, 데코 박스는 그대로 · 안쪽 여백만큼 작게 그린다
  const bubPack = rim => P._packComposed(tallSet, 0, W, H, G, P._composedPackExtras(P._composedHero('SANVI', W, G, 'bubble').spec, rim, null));
  const b1 = bubPack(RIM), b0 = bubPack(0), sb = P._composedHero('SANVI', W, G, 'bubble').spec;
  chk('버블 이름 박스 = 스펙 + 2 × 칼선 여백 · 그리기 여백 = 칼선 여백 (여백 0 이면 0)',
      Math.abs(b1.nameBox.w - (sb.cellW + 2 * RIM)) < 1e-9 && Math.abs(b1.nameBox.h - (sb.cellH + 2 * RIM)) < 1e-9 &&
      b1.namePad === RIM && b0.namePad === 0 && Math.abs(b0.nameBox.w - sb.cellW) < 1e-9 && b1.nameStyle === 'bubble',
      `${(b1.nameBox.w / M).toFixed(2)} × ${(b1.nameBox.h / M).toFixed(2)}mm`);
  // 기대 모양: 시작 자리부터 돈 순서에서 안 쓴 것, 글씨 두들은 큰 칸(12.7)에만 (따로 구현해 대조)
  const expectMotifs = (sizes, start) => {
    const used = new Set(), out = [], n = P.DECO_ORDER_V2.length;
    const order = P.DECO_ORDER_V2.map((_, k) => P.DECO_ORDER_V2[(start + k) % n]);
    for (const s of sizes) {
      const pick = order.find(m => !used.has(m) && (s >= 12.7 - 1e-6 || P.DECO_BIG_ONLY_V2.indexOf(m) < 0));
      used.add(pick);
      out.push(pick);
    }
    return out.join();
  };
  const b1sizes = b1.decos.map(d => d.w / M);
  chk('버블 데코 = 이름 자리부터 두들 순서 (글씨 두들은 큰 칸만) · 스타일 · 안쪽 여백 · 박스 크기는 레트로와 같은 12.7 / 10mm',
      b1.decos.length > 0 && b1.decoStart === P._composedDecoStart(sb, 0) &&
      b1.decos.map(d => d.payload.deco).join() === expectMotifs(b1sizes, b1.decoStart) &&
      b1.decos.every(d => d.payload.style === 'bubble' && d.payload.pad === RIM &&
        P.COMPOSED_DECO_SIZES_MM.some(s => Math.abs(d.w / M - s) < 1e-9 && Math.abs(d.h / M - s) < 1e-9)) &&
      b1.decos.every(d => d.w / M >= 12.7 - 1e-6 || P.DECO_BIG_ONLY_V2.indexOf(d.payload.deco) < 0),
      b1.decos.map(d => d.payload.deco + ' ' + (d.w / M).toFixed(1)).join(', '));
  const motif = (sizes, st, start) => { const used = {}; return sizes.map(s => P._composedDecoMotif(P._nameStyle(st), used, s, start)).join(); };
  chk('데코 모양 고르기: 작은 칸만 있어도 글씨 두들을 건너뛴다 · 한 바퀴 돌면 처음부터 · 시작 자리 없으면 예전 순서',
      motif([10, 10, 10], 'bubble') === 'SMILE,HEART,DAISY' &&
      motif(Array(20).fill(12.7), 'bubble').split(',').slice(18).join() === 'XOXO,SMILE' &&
      motif(Array(14).fill(10), 'retro') === P.DECO_ORDER.concat(P.DECO_ORDER.slice(0, 2)).join(),
      motif([10, 10, 10], 'bubble'));
  chk('데코 모양 고르기: 시작 자리부터 돌고 끝에서 처음으로 이어진다 (글씨 두들 건너뛰기 · 시작 자리 = 순서 길이로 나눈 나머지)',
      motif([10, 10, 10], 'bubble', 1) === 'HEART,DAISY,CHERRY' && motif([10, 10], 'bubble', 18) === 'SMILE,HEART' &&
      motif([12.7, 12.7], 'bubble', 18) === 'XOXO,SMILE' && motif([10, 10], 'retro', 11) === 'CLOUD,HEART' &&
      motif([10, 10], 'retro', 23) === 'CLOUD,HEART' && motif(Array(13).fill(10), 'retro', 5).split(',').slice(11).join() === 'BOW,BONE',
      motif([10, 10, 10], 'bubble', 1));
  chk('버블 판도 검증기 통과 · 지문이 레트로와 다르다', P._composedValidate(b1, tallSet, W, H, G) === '' && b1.sig !== r0.sig, b1.sig);
  const vars = P._composedVariants(tallSet, 0, W, H, G, sb, RIM, 'sides', 'center');
  chk('배치 변형 줄도 이름 스타일을 따라간다', vars.length > 1 && vars.every(v => v.res.nameStyle === 'bubble' &&
      v.res.decos.every(d => d.payload.style === 'bubble')), vars.map(v => v.kind).join(' '));
  const vars2 = P._composedVariants(tallSet, 0, W, H, G, sb, RIM, 'sides', 'center', 2);
  chk('배치 변형 줄도 시트 번호의 데코 시작 자리를 쓴다', vars2.length === vars.length &&
      vars2.every(v => v.res.decoStart === P._composedDecoStart(sb, 2)) && vars.every(v => v.res.decoStart === P._composedDecoStart(sb, 0)) &&
      vars2.every((v, i) => v.res.sig === vars[i].res.sig), `시트1 ${vars[0].res.decoStart} · 시트3 ${vars2[0].res.decoStart}`);
  let threw2 = '';
  try { P._packComposed(tallSet, 0, W, H, G, { hero: heroBox, decoWant: 6, rimPt: RIM, nameStyle: 'gothic' }); } catch (e) { threw2 = e.message; }
  chk('배치 입구도 모르는 이름 스타일은 막는다', /알 수 없는 이름 스타일/.test(threw2), threw2);

  // 주문 보드 → 대화창 없이 만들기
  const lp = [{ base: 'A_01' }, { base: 'A_02' }];
  const lcfg = { bases: ['A_01', 'A_02'], nameText: 'Test', stickerName: 'VIVIAN', material: 'White Matte', cutMarginMm: 1, nameStyle: 'bubble' };
  const lo1 = P._composedLaunchOptions(lcfg, lp), lo0 = P._composedLaunchOptions({ ...lcfg, nameStyle: undefined }, lp);
  chk('보드의 이름 스타일 → options (없으면 레트로)', !lo1.error && lo1.options.nameStyle === 'bubble' &&
      !lo0.error && lo0.options.nameStyle === 'retro', lo1.error || lo0.error || '');
  const badStyle = [[{ ...lcfg, nameStyle: 'gothic' }, '이름 스타일'], [{ ...lcfg, nameStyle: 7 }, '이름 스타일'], [{ ...lcfg, nameStyle: ['bubble'] }, '이름 스타일']];
  chk('모르는 이름 스타일이면 만들지 않는다', badStyle.every(([c, w]) => (P._composedLaunchOptions(c, lp).error || '').includes(w)),
      badStyle.map(([c]) => P._composedLaunchOptions(c, lp).error).join(' / '));
}

console.log('\n══ 버블 글자 색 돌리기 (2026-09-17) ══');
{
  const PAL = ['WHITE', 'PINK', 'YELLOW', 'SKY'], T = P.LETTER_ART_PAINTS_V2, CYC = P.LETTER_PAINT_CYCLE_V2;
  const bubble = P._nameStyle('bubble'), retro = P._nameStyle('retro');
  let tabOk = Object.keys(T).join('') === 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', why = '';
  for (const [ch, can] of Object.entries(T)) {
    if (!(can instanceof Array) || can.length < 2 || new Set(can).size !== can.length || !can.every(c => PAL.indexOf(c) >= 0)) {
      tabOk = false; why = ch + ' ' + JSON.stringify(can);
    }
  }
  chk('색 표: 26자 · 글자마다 팔레트 색 2개 이상 · 겹치지 않음', tabOk, why || Object.entries(T).filter(([, c]) => c.length < 4).map(([k, c]) => k + ' ' + c.length).join(' '));
  chk('장식과 같은 색은 없다 (A 노란 하트 · I 분홍 하트 · P 노란 꽃 · Z 노란 별 · D 노란 꽃심 · N·O·Q·D 흰 조각)',
      T.A.indexOf('YELLOW') < 0 && T.I.indexOf('PINK') < 0 && T.P.indexOf('YELLOW') < 0 && T.Z.indexOf('YELLOW') < 0 &&
      T.D.indexOf('YELLOW') < 0 && ['N', 'O', 'Q', 'D'].every(c => T[c].indexOf('WHITE') < 0));
  chk('원래 색(첫 색) = 라이브러리 바탕 색 (흰 글자 12자 · 색 글자 14자)',
      'ACEGHJLPRTVX'.split('').every(c => T[c][0] === 'WHITE') && 'BIMQUY'.split('').every(c => T[c][0] === 'YELLOW') &&
      'FKOZ'.split('').every(c => T[c][0] === 'PINK') && 'DNSW'.split('').every(c => T[c][0] === 'SKY'));
  chk('돌림 순서: 네 색 모두 · 이웃(끝→처음 포함)끼리 다른 색 · 흰색 3칸에 1칸',
      PAL.every(c => CYC.indexOf(c) >= 0) && CYC.every((c, i) => c !== CYC[(i + 1) % CYC.length]) &&
      CYC.filter(c => c === 'WHITE').length * 3 === CYC.length, CYC.join(' '));
  chk('스타일 표: 버블만 색을 돌린다', bubble.paints === T && bubble.paintCycle === CYC && retro.paints === null && retro.paintCycle === null);

  const NAMES = ('Olivia Emma Charlotte Amelia Sophia Mia Isabella Ava Evelyn Luna Harper Sofia Scarlett Elizabeth Eleanor ' +
    'Emily Chloe Mila Violet Penelope Gianna Aria Abigail Ella Avery Hazel Nora Layla Lily Aurora Nova Ellie Madison Grace ' +
    'Liam Noah Oliver James Elijah William Henry Lucas Benjamin Theodore Mateo Levi Sebastian Daniel Jack Michael Alexander ' +
    'Owen Asher Samuel Ethan Leo Jackson Mason Ezra John Hudson Luca Aiden Joseph David Jacob Logan Luke Julian Gabriel ' +
    'Heather Harin Charles Christopher Terry Jennifer Vivian Jimmy Yumi Anna Hannah Jessica Addison Abby Bobby Sanvi Zoe ' +
    'Minjun Seoyeon Jiwoo Yuna Doyun Haeun Siwoo Jiho Seojun Chaewon Mimi Kim Lee Park Choi').split(' ')
    .concat(['Vivian Liz', 'Anne Marie Kim', 'Mary Jane Watson', 'Maximilianwolfgang', 'V', 'Z', 'QQQQ', 'DDDD', 'NNOO']);
  const colorsOf = boxes => boxes.map(b => b.paint || T[b.ch][0]);
  let adj = 0, bad = '', white = 0, total = 0, groupOk = true, lineOk = true, detOk = true;
  for (const n of NAMES) {
    const spec = P._composedHero(n, W, G, 'bubble').spec, boxes = P._artLetterBoxes(spec), cols = colorsOf(boxes);
    const again = colorsOf(P._artLetterBoxes(P._composedHero(n, W, G, 'bubble').spec));
    if (again.join() !== cols.join()) detOk = false;
    boxes.forEach((b, i) => {
      total++;
      if (cols[i] === 'WHITE') white++;
      if (T[b.ch].indexOf(cols[i]) < 0) { groupOk = false; bad = n + ' ' + b.ch + ' ' + cols[i]; }
      if (b.paint === T[b.ch][0]) groupOk = false;                       // 원래 색이면 paint 는 "" (원래 그룹)
      if (b.group !== 'LTR ' + b.ch + (b.paint ? ' ' + b.paint : '')) groupOk = false;
      if (i && boxes[i - 1].line === b.line && cols[i - 1] === cols[i]) { adj++; bad = n + ' ' + boxes[i - 1].ch + b.ch; }
    });
    if (boxes.length !== spec.chars.length) lineOk = false;
  }
  chk(`흔한 이름·긴 이름·반복 글자 ${NAMES.length}개: 옆 글자끼리 같은 색 0 · 그 글자에 있는 색만 · 그룹 이름 규칙 · 같은 이름 = 같은 색`,
      adj === 0 && groupOk && lineOk && detOk, bad);
  chk('흰 글자 비율 30~45% (레퍼런스 ≈ 35%, 원래 색이면 56%)', white / total > 0.3 && white / total < 0.45,
      `${(100 * white / total).toFixed(0)}% (${white}/${total})`);
  const seq = n => colorsOf(P._artLetterBoxes(P._composedHero(n, W, G, 'bubble').spec)).map(c => c.charAt(0)).join('');
  chk('자리 순서 색 (2026-09-17 결정 고정): HEATHER · CHARLES · TERRY · EMMA · JIMMY · YUMI',
      seq('Heather') === 'WPWSPWY' && seq('Charles') === 'WPWSPWY' && seq('Terry') === 'WPYWS' && seq('Emma') === 'WPYW' &&
      seq('Jimmy') === 'WYWSP' && seq('Yumi') === 'WPYW', ['Heather', 'Charles', 'Terry', 'Emma', 'Jimmy', 'Yumi'].map(seq).join(' '));
  const two = P._artLetterBoxes(P._composedHero('Vivian Liz', W, G, 'bubble').spec);
  chk('줄이 바뀌어도 순서를 이어서 돈다 (둘째 줄 첫 글자는 앞 글자 색과 달라도 된다)',
      seq('Vivian Liz') === seq('Vivian') + 'SWP' && two.filter(b => b.line === 1).length === 3, seq('Vivian Liz'));
  const rb = P._artLetterBoxes(P._composedHero('Heather Liz', W, G, 'retro').spec);
  chk('레트로는 색을 안 바꾼다 (paint "" · 그룹 = LTR 글자)', rb.every(b => b.paint === '' && b.group === 'LTR ' + b.ch));
  const pick = (ch, prev, ptr) => JSON.stringify(P._artLetterPaint(bubble, ch, prev, ptr));
  chk('색 고르기: 없는 색·앞 글자 색은 건너뛰고 다음 자리를 돌려준다 · 표에 없는 글자는 null',
      pick('A', null, 2) === '{"paint":"WHITE","next":4}' && pick('E', 'WHITE', 0) === '{"paint":"PINK","next":2}' &&
      pick('D', 'SKY', 4) === '{"paint":"PINK","next":6}' && pick('N', null, 0) === '{"paint":"PINK","next":2}' &&
      P._artLetterPaint(bubble, '9', null, 0) === null && P._artLetterPaint({ paints: T, paintCycle: [] }, 'A', null, 0) === null,
      [pick('A', null, 2), pick('D', 'SKY', 4)].join(' '));
}

console.log('\n══ 데코 돌리기 — 이름마다 시작 자리 · 다음 시트는 이어서 (2026-09-17) ══');
{
  const spec = n => P._composedHero(n, W, G, 'bubble').spec, rspec = n => P._composedHero(n, W, G, 'retro').spec;
  const len = P.DECO_ORDER_V2.length, rlen = P.DECO_ORDER.length;
  chk('이름이 없으면 시작 자리 0', P._composedDecoStart(null, 0) === 0 && P._composedDecoStart(null, 3) === 0 &&
      P._composedPackExtras(null, RIM, null, 2).decoStart === 0);
  const bubble = P._nameStyle('bubble'), retro = P._nameStyle('retro');
  const span = (style, s) => P._composedDecoSpan(style, s);
  chk('구간 길이: 레트로 = 시트당 데코 수 · 버블 = 글씨 두들이 아닌 모양 6개가 드는 가장 짧은 구간 (예: SMILE~BOW 8칸)',
      [0, 3, 11].every(k => span(retro, k) === P.COMPOSED_DECO_MAX) && span(bubble, 0) === 8 && span(bubble, 8) === 9 &&
      P.DECO_ORDER_V2.every((_, k) => span(bubble, k) >= P.COMPOSED_DECO_MAX && span(bubble, k) <= 9) &&
      span({ decoOrder: ['A', 'B', 'C'], decoBigOnly: ['B'] }, 0) === 3, P.DECO_ORDER_V2.map((_, k) => span(bubble, k)).join(''));
  const st = P._composedDecoStart(spec('Vivian'), 0), st1 = (st + span(bubble, st)) % len;
  chk('시작 자리: 순서 안 · 같은 이름 = 같은 값 · 다음 시트 = 앞 시트 구간 바로 뒤 · 대소문자 상관없음 · 시트 번호 없으면 첫 시트',
      st >= 0 && st < len && P._composedDecoStart(spec('Vivian'), 0) === st &&
      P._composedDecoStart(spec('Vivian'), 1) === st1 &&
      P._composedDecoStart(spec('Vivian'), 2) === (st1 + span(bubble, st1)) % len &&
      P._composedDecoStart(rspec('Vivian'), 3) === (P._composedDecoStart(rspec('Vivian'), 0) + 18) % rlen &&
      P._composedDecoStart(spec('VIVIAN'), 0) === st && P._composedDecoStart(spec('vivian'), 0) === st &&
      P._composedDecoStart(spec('Vivian'), undefined) === st && P._composedDecoStart(spec('Vivian'), -1) === st &&
      P._composedPackExtras(spec('Vivian'), RIM, null, 1).decoStart === st1,
      `Vivian ${st} → 시트2 ${st1}`);
  const names = ['Vivian', 'Heather', 'Harin', 'Sanvi', 'Emma', 'Liam', 'Olivia', 'Noah', 'Charles', 'Terry', 'Yumi', 'Zoe'];
  const starts = new Set(names.map(n => P._composedDecoStart(spec(n), 0)));
  const rstarts = new Set(names.map(n => P._composedDecoStart(rspec(n), 0)));
  chk('이름마다 시작 자리가 흩어진다 (12명)', starts.size >= 7 && rstarts.size >= 6 && [...rstarts].every(v => v < rlen),
      `버블 ${[...starts].join(',')} · 레트로 ${[...rstarts].join(',')}`);
  // 여러 이름 × 시트 3장 × 사진 조합 — 모든 두들이 나오고, 같은 주문의 시트끼리 데코가 겹치지 않는다(가능할 때)
  const sets = [[0.38, 0.78, 0.66, 0.85, 0.79, 0.89], [0.75, 0.8, 1.2, 0.9], [1.0, 0.7], [0.66, 0.66, 0.9, 1.1, 0.8]];
  const seen = { bubble: new Set(), retro: new Set() };
  let overlap = 0, sheetsTotal = 0, smallText = 0;
  for (const st2 of ['bubble', 'retro']) {
    for (const n of names) {
      const h = P._composedHero(n, W, G, st2).spec;
      for (const aspects of sets) {
        const got = [0, 1, 2].map(s => P._packComposed(pairsOf(aspects), 0, W, H, G, P._composedPackExtras(h, RIM, null, s)).decos.map(d => {
          seen[st2].add(d.payload.deco);
          if (P.DECO_BIG_ONLY_V2.indexOf(d.payload.deco) >= 0 && d.w / M < 12.7 - 1e-6) smallText++;
          return d.payload.deco;
        }));
        sheetsTotal += 3;
        if (st2 === 'bubble' && got[0].some(d => got[1].indexOf(d) >= 0)) overlap++;
      }
    }
  }
  chk(`모든 두들이 데코로 나온다 (${sheetsTotal}시트 · 버블 ${P.DECO_ORDER_V2.length}종 · 레트로 ${P.DECO_ORDER.length}종)`,
      seen.bubble.size === P.DECO_ORDER_V2.length && seen.retro.size === P.DECO_ORDER.length,
      `버블 ${seen.bubble.size} · 레트로 ${seen.retro.size}`);
  chk('버블: 첫 시트와 둘째 시트 데코가 겹치지 않는다 · 글씨 두들은 여전히 큰 칸만', overlap === 0 && smallText === 0,
      `겹침 ${overlap} · 작은 칸 글씨 ${smallText}`);
  // 미리보기 비교 — 데코 모양 (자리가 같을 때만 따로 적는다)
  const planC = P._composedDeal([2, 2], 0), pairsC = [{ base: 'A_01' }, { base: 'A_02' }];
  const ex = { stickers: [10], sigs: ['abc'], decos: [['SMILE', 'HEART']] };
  const sameD = P._composedPreviewDiff(ex, planC, [10], pairsC, ['abc'], [['SMILE', 'HEART']]);
  const diffD = P._composedPreviewDiff(ex, planC, [10], pairsC, ['abc'], [['HEART', 'SMILE']]);
  const movedD = P._composedPreviewDiff(ex, planC, [10], pairsC, ['999'], [['HEART', 'SMILE']]);
  const oldBoard = P._composedPreviewDiff({ stickers: [10], sigs: ['abc'] }, planC, [10], pairsC, ['abc'], [['HEART']]);
  chk('미리보기 비교: 데코 모양이 다르면 적는다 · 자리가 다르면 자리만 · 옛 보드(모양 없음)는 비교 안 함',
      sameD.length === 0 && diffD.length === 1 && diffD[0].indexOf('데코 모양') >= 0 &&
      movedD.length === 1 && movedD[0].indexOf('자리') >= 0 && oldBoard.length === 0, [diffD, movedD].map(x => x.join()).join(' | '));
}

console.log('\n══ 결정론 · 보고 일치 · 입력 불변 ══');
{
  const A = pack([0.381, 0.783, 0.658, 0.846, 0.794, 0.894]);
  const B = pack([0.381, 0.783, 0.658, 0.846, 0.794, 0.894]);
  const key = r => r.placed.map(p => [p.photo, p.inch, p.x.toFixed(4), p.y.toFixed(4)].join(':')).join('|') +
    '#' + r.decos.map(d => [d.x.toFixed(4), d.y.toFixed(4)].join(':')).join('|');
  chk('같은 입력 → 같은 판 (난수 없음)', key(A) === key(B));
  chk('계획 = 배치 + 누락 + 건너뜀', A.gradeCounts.reduce((s, v) => s + v, 0) === (A.placed.length - A.extras) + A.missing.length + A.skipped.length,
      `계획 ${A.gradeCounts.reduce((s, v) => s + v, 0)} = 배치 ${A.placed.length - A.extras} + 누락 ${A.missing.length} + 건너뜀 ${A.skipped.length}`);
  chk('장수 합 = 배치 수', A.counts.reduce((s, v) => s + v, 0) === A.placed.length);
  const src = pairsOf([0.381, 0.783, 0.658, 0.846, 0.794, 0.894]);
  const snapshot = JSON.stringify(src);
  P._packComposed(src, 0, W, H, G, { hero: heroBox, decoWant: 6, rimPt: RIM });
  chk('입력 pairs 를 건드리지 않는다', JSON.stringify(src) === snapshot);
}

console.log('\n══ 입구 · 검증기 음성 케이스 ══');
{
  const bad = f => { try { f(); return ''; } catch (e) { return e.message; } };
  chk('시트 한 장에 사진 0장·7장이면 거부 (1~6장은 받는다)', bad(() => P._packComposed([], 0, W, H, G, {})).indexOf('1~6') >= 0 &&
      bad(() => pack([1, 1, 1, 1, 1, 1, 1])).indexOf('1~6') >= 0 && bad(() => pack([1, 1, 1])) === '' && bad(() => pack([0.8])) === '');
  chk('메인 index 범위 밖이면 거부', bad(() => P._packComposed(pairsOf([1, 1, 1, 1, 1, 1]), 9, W, H, G, {})).indexOf('index') >= 0);
  chk('비율 0 이면 거부', bad(() => P._packComposed(
    [{ base: 'x', aspect: 0, cutAspect: 0 }].concat(pairsOf([1, 1, 1, 1, 1])), 0, W, H, G, {})).indexOf('비율') >= 0);
  chk('시트 크기 0 이면 거부', bad(() => P._packComposed(pairsOf([1, 1, 1, 1, 1, 1]), 0, 0, H, G, {})).indexOf('시트') >= 0);

  const base = pack([1, 1, 1, 1, 1, 1]);
  const clone = () => JSON.parse(JSON.stringify({ placed: base.placed, decos: base.decos, nameBox: base.nameBox,
    counts: base.counts, extras: base.extras, missing: base.missing, skipped: base.skipped, gradeCounts: base.gradeCounts, rimPt: base.rimPt }));
  const ps = pairsOf([1, 1, 1, 1, 1, 1]);
  const v = r => P._composedValidate(r, ps, W, H, G);
  chk('정상 판은 통과', v(clone()) === '');
  let r = clone(); r.placed[0].x = -5;
  chk('시트 밖 감지', v(r).indexOf('벗어남') >= 0);
  r = clone(); r.placed[1].x = r.placed[0].x; r.placed[1].y = r.placed[0].y;
  chk('간격 위반 감지', v(r).indexOf('간격') >= 0);
  r = clone(); r.placed[0].inch = 3;
  chk('사다리에 없는 인치 감지', v(r).indexOf('사다리') >= 0);
  r = clone(); r.placed[0].artW = r.placed[0].artW * 0.5;
  chk('셀 ≠ 사진+2rim 감지', v(r).indexOf('안 맞음') >= 0);
  {
    const typed = P._packComposed([0.8, 0.8, 0.8, 0.8, 0.8, 0.8].map((a, i) => ({ base: 'F' + i, aspect: a, cutAspect: a, shotType: 'face' })),
      0, W, H, G, { hero: heroBox, decoWant: 6, rimPt: RIM });
    const t2 = JSON.parse(JSON.stringify({ placed: typed.placed, decos: typed.decos, nameBox: typed.nameBox, counts: typed.counts,
      extras: typed.extras, missing: typed.missing, skipped: typed.skipped, gradeCounts: typed.gradeCounts, rimPt: typed.rimPt, types: typed.types, windows: typed.windows }));
    const fps = [0, 1, 2, 3, 4, 5].map(i => ({ base: 'F' + i }));
    chk('종류가 있는 정상 판도 통과', P._composedValidate(t2, fps, W, H, G) === '');
    t2.placed[0].grade = 0; t2.placed[0].inch = 2.5;
    chk('종류 범위 밖 크기 감지 (얼굴 2.5")', P._composedValidate(t2, fps, W, H, G).indexOf('범위 밖') >= 0);
    const t3 = JSON.parse(JSON.stringify(t2)); t3.placed[0].grade = 1;
    chk('등급·인치 불일치 감지', P._composedValidate(t3, fps, W, H, G).indexOf('안 맞음') >= 0);
  }
  r = clone(); r.placed[0].rotated = true;
  chk('회전 감지', v(r).indexOf('회전') >= 0);
  r = clone(); r.missing = r.missing.concat(['가짜']);   // 길이를 반드시 +1 (원래 누락이 있을 수도 있다)
  chk('누락 보고 불일치 감지', v(r).indexOf('합이 안 맞음') >= 0);
  // 장수 합 검사가 먼저 걸리지 않게 계획 장수를 맞춰 둔다 — 보고 싶은 건 상한 검사다.
  r = clone(); r.extras = P.COMPOSED_EXTRA_MAX + 1;
  r.gradeCounts = [0, 0, 0, 0, 0, r.placed.length - r.extras + r.missing.length + (r.skipped ? r.skipped.length : 0)];
  chk('추가 상한 초과 감지', v(r).indexOf('상한') >= 0);
}

assert(Buffer.compare(before, fs.readFileSync(SOURCE)) === 0, 'Everstory_range.jsx 가 테스트 중 바뀌었다');
console.log(`\n${checks} 검사 통과 ✅  (소스 무변경 확인)`);
