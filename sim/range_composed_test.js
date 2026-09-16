// Composed(사진 6장 구성 시트) 순수 엔진 (v2 + 사진 종류) — 최신 Everstory_range.jsx 를 추출해 검사한다. Adobe API 없음, 소스 무변경.
//   · 크기 = 인치 사다리의 **긴 변** (2.5" = 63.5mm, 예외는 짧은 변 하한뿐)
//   · 등급별 장수 = 면적 배분 (정사각 사진이면 큰 등급이 줄고 작은 등급이 산다)
//   · 큰 것부터 배치 · 셀 = 사진 + 2×rim · 칼선 박스 간격 = gap + 2×rim
//   · 사진 종류 → 크기 범위 (사용자 확정 표) · 실주문 사람 사진 24장 자동 판별 · 종류가 들어간 배치
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
  chk('사진 6장이 아니면 거부', bad(() => pack([1, 1, 1])).indexOf('6장') >= 0);
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
