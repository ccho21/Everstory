// 구성 화면 동작 회귀: 실제 HTML 함수 + range 엔진, 합성 API/DOM만 사용한다.
// 서버·Adobe·실제 주문 폴더는 열지 않는다. 화면의 픽셀 배치 검사는 아니다.
// node scripts/order_intake/composed_ui_test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const {execFileSync} = require('child_process');
const root = path.resolve(__dirname, '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'composed-ui-test-'));
let passed = 0;
function check(name, condition) {
  assert.ok(condition, name);
  passed++;
  console.log('✅ ' + name);
}
async function main() {
  const enginePath = path.join(temp, 'range.js');
  execFileSync(process.execPath, [path.join(root, 'sim/extract_all.js'), path.join(root, 'Everstory_range.jsx'), enginePath], {stdio: 'pipe'});
  const engine = require(enginePath);
  const elements = new Map(), saved = new Map();
  function element(key) {
    if (!elements.has(key)) elements.set(key, {value: '', textContent: '', innerHTML: '', hidden: false,
      dataset: {}, classList: {toggle() {}}, addEventListener() {}});
    return elements.get(key);
  }
  let payload, submitted;
  const context = vm.createContext({
    engine, console, URLSearchParams, location: {search: ''}, history: {replaceState() {}},
    document: {querySelector: element, querySelectorAll: () => []},
    localStorage: {getItem: k => saved.get(k) || null, setItem: (k, v) => saved.set(k, v)},
    setTimeout: () => 0, clearTimeout() {},
    fetch: async (_url, options) => {
      if (options) submitted = JSON.parse(options.body);
      return {ok: true, json: async () => options ? {ok: true, summary: 'synthetic'} : payload};
    }
  });
  const html = fs.readFileSync(path.join(__dirname, 'composed_preview.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\ninit\(\);\s*$/, '\n');
  vm.runInContext(script, context);
  // 그림·카드 레이아웃만 제외한다. loadFolder/compute/make/요약/스타일 버튼은 실제 코드다.
  vm.runInContext('E = engine; buildList = () => {}; updateList = () => {}; renderSheets = () => {}; scheduleStyles = () => {};', context);
  const read = expression => vm.runInContext(expression, context);
  const key = 'everstory.composed.nameStyle';
  function fixture(n, prefill = {}) {
    return {features: ['layouts', 'sizes', 'nameStyles', 'counts'], today: '2026-09-21', sheets: 0,
      prefill: {nameText: 'SYNTHETIC', stickerName: 'MIA', orderNumber: 'TEST', ...prefill},
      pairs: Array.from({length: n}, (_, i) => ({base: 'SYNTHETIC_' + (i + 1) + '_SML', label: 'SYNTHETIC_' + (i + 1) + '_SML',
        canvas: [40, 60], v: 'test', cut: {bad: false, srcOk: true, sig: engine._traceSignature(), rel: [0, 0, 1, 1]}}))};
  }
  async function load(n, prefill, fresh = true) {
    payload = fixture(n, prefill);
    await read('loadFolder("SYNTHETIC", ' + fresh + ')');
  }
  const contract = {pack: 'NAME', photosOrdered: 5, sheets: 1, quantity: 2, extraSheets: 3, nameStyle: 'bubble',
    options: [{key: 'Extra sheets', value: 'Add 3 extra print'}, {key: 'Special instructions', value: '<keep & show>'}]};
  saved.set(key, 'retro');
  await load(5, contract);
  check('NAME 주문 스타일이 저장한 스타일보다 먼저', read('S.nameStyle') === 'bubble' && saved.get(key) === 'retro');
  check('주문 계약·수량·추가 인쇄를 읽기 전용으로 표시',
    element('#orderContract').textContent === 'Name & Photo · 최종 5디자인 · A5 1장 · 수량 2 · 추가 인쇄 +3 · 같은 시트 8장 인쇄');
  // Extra sheets (2026-09-25): 인테이크가 읽은 추가 장수 × 수량 = 같은 시트 인쇄 장수 — 요약 줄 + 경고 한 줄
  check('같은 시트 여러 장 인쇄는 경고 한 줄 (만들기는 막지 않음)',
    element('#notes').innerHTML.includes('인쇄: 같은 시트 8장 (수량 2 · 추가 인쇄 +3)') && read('S.blockers.length') === 0);
  check('옵션 특수문자를 textContent에 그대로 표시', element('#orderOptions').textContent.includes('<keep & show>') && element('#orderOptions').innerHTML === '');
  check('정상 NAME 5장에는 계약 경고 없음', !element('#notes').innerHTML.includes('Name &amp; Photo:'));
  check('정상 NAME 주문은 만들기 가능', read('S.blockers.length') === 0 && element('#make').disabled === false);
  await read('make()');
  check('launch 지문 필드 모양 그대로', JSON.stringify(Object.keys(submitted.expect).sort()) === JSON.stringify(['decos', 'sheets', 'sigs', 'stickers']));
  check('계약·옵션은 제작 launch에 새로 넣지 않음', !('pack' in submitted) && !('options' in submitted) && submitted.bases.length === 5);
  read('S.busy = false');
  const initialSig = submitted.expect.sigs.join();
  payload = fixture(5, {...contract, quantity: 8, extraSheets: 0, options: []});
  await read('loadFolder("SYNTHETIC", false)');
  await read('make()');
  check('수량·옵션 표시는 배치 지문에 영향 없음', submitted.expect.sigs.join() === initialSig);
  check('새로고침하면 계약 수량과 빈 옵션 표시 갱신', element('#orderContract').textContent.endsWith('수량 8 · 같은 시트 8장 인쇄') && element('#orderOptions').hidden && !element('#orderOptions').textContent);
  read('S.busy = false');
  await load(6, contract);
  check('NAME 6장 선택은 경고만, 6장을 자동으로 줄이지 않음', element('#notes').innerHTML.includes('선택 6장') && read('S.sel.length') === 6 && read('S.blockers.length') === 0 && !element('#make').disabled);
  await load(7, contract);
  read('S.pairs.forEach(p => p.selected = true); compute()');
  check('NAME 2시트는 경고만', read('S.results.length') === 2 && element('#notes').innerHTML.includes('시트가 2장 이상') && read('S.blockers.length') === 0);
  await load(5, {...contract, stickerName: ''});
  check('NAME 이름 없음은 경고만', element('#notes').innerHTML.includes('이름이 비어') && read('S.blockers.length') === 0);
  // No name 주문 (2026-09-24): 이름 빈 칸이 정상 — 경고 대신 안내, 이름을 넣으면 경고
  await load(5, {...contract, stickerName: '', noName: true});
  check('No name 주문은 경고 대신 사진만 안내 · 막지 않음', element('#notes').innerHTML.includes('이름 없음(No name) 주문') &&
    !element('#notes').innerHTML.includes('이름이 비어') && read('S.blockers.length') === 0 && read('S.hero.spec') === null);
  await load(5, {...contract, stickerName: 'MIA', noName: true});
  check('No name 주문에 이름이 들어 있으면 경고', element('#notes').innerHTML.includes('No name)인데 스티커 이름'));
  await load(5, {...contract, stickerName: 'Chloé'});
  check('엔진이 이름을 생략하면 기존 경고 한 번', read('!!S.hero.skipped') && (element('#notes').innerHTML.match(/스티커 이름:/g) || []).length === 1 && read('S.blockers.length') === 0);
  await load(6, {quantity: 3, options: [{key: 'Crop preference', value: 'Round'}]});
  check('일반 주문으로 이동하면 저장한 스타일 복원', read('S.nameStyle') === 'retro');
  check('일반 6사진 흐름에는 NAME 경고 없음', read('S.sel.length') === 6 && !element('#notes').innerHTML.includes('Name &amp; Photo:'));
  check('일반 주문은 NAME 계약 없이 수량·옵션만 표시', element('#orderContract').textContent === '수량 3 · 같은 시트 3장 인쇄' && element('#orderOptions').textContent === '주문 옵션: Crop preference = Round');
  await load(5, {...contract, quantity: 1, extraSheets: 0});
  check('한 장짜리 주문은 인쇄 장수 표시·경고 없음', element('#orderContract').textContent === 'Name & Photo · 최종 5디자인 · A5 1장 · 수량 1' &&
    !element('#notes').innerHTML.includes('인쇄: 같은 시트'));
  saved.set(key, 'bubble');
  await load(5, {...contract, nameStyle: 'retro'});
  await load(5, {});
  check('직전 retro 주문 뒤에도 저장한 bubble 복원', read('S.nameStyle') === 'bubble');
  check('매니페스트 없는 폴더는 이전 계약·수량·옵션을 비움', element('#orderContract').hidden && !element('#orderContract').textContent && element('#orderOptions').hidden && !element('#orderOptions').textContent);
  saved.set(key, 'unknown');
  await load(5, {});
  check('알 수 없는 저장 스타일은 엔진 첫 스타일', read('S.nameStyle') === engine.COMPOSED_NAME_STYLES[0].key);
  saved.clear();
  await load(5, {});
  check('저장 스타일이 없어도 엔진 첫 스타일', read('S.nameStyle') === engine.COMPOSED_NAME_STYLES[0].key);

  // 작은 이름 넣기/빼기 (2026-09-23) — 서버가 받을 때만 보이고 보낸다. 주문을 새로 열면 다시 넣기.
  saved.clear();
  await load(5, {});
  read('S.busy = false');
  await read('make()');
  check('예전 서버(smallName 기능 없음)면 작은 이름 버튼을 숨기고 값도 안 보낸다 (미리보기·Illustrator 모두 넣음)',
    element('#fSmall').hidden === true && !('smallName' in submitted) && read('S.results[0].r.name2Box !== null'));
  read('S.busy = false');
  payload = {...fixture(5, {}), features: ['layouts', 'sizes', 'nameStyles', 'counts', 'smallName']};
  await read('loadFolder("SYNTHETIC", true)');
  await read('make()');
  const smallOnSig = submitted.expect.sigs.join();
  check('작은 이름 기본 = 넣기 · 버튼 보임 · launch 에 smallName true',
    element('#fSmall').hidden === false && read('S.smallName') === true && submitted.smallName === true &&
    read('S.results[0].r.name2Box !== null'));
  read('S.busy = false; S.smallName = false; compute()');
  await read('make()');
  check('빼기 → 미리보기에서 작은 이름이 빠지고 launch 에 smallName false · 배치 지문도 달라진다',
    submitted.smallName === false && read('S.results[0].r.name2Box === null && S.hero.spec.smallName === false') &&
    submitted.expect.sigs.join() !== smallOnSig);
  read('S.busy = false');
  await read('loadFolder("SYNTHETIC", true)');
  check('다른 주문을 새로 열면 다시 넣기', read('S.smallName') === true && read('S.results[0].r.name2Box !== null'));

  // 실제 보드 render를 실행한 뒤 표 HTML을 표준 HTML 파서로 읽어 텍스트·속성 값을 확인한다.
  const boardSource = fs.readFileSync(path.join(__dirname, 'webui.py'), 'utf8');
  const boardScript = boardSource.match(/<script>([\s\S]*?)<\/script>/)[1];
  const boardRows = {innerHTML: ''};
  const board = vm.createContext({URLSearchParams, location: {search: ''},
    document: {querySelector: () => boardRows, querySelectorAll: () => [{value: 'EVS-<1> "A" & B'}]}});
  vm.runInContext(boardScript.slice(0, boardScript.indexOf('// 표는 폴링마다')), board);
  board.input = {name: 'EVS-<1> "A" & B', customer: '<img src=x onerror="bad()"> & Test', folder: 'Folder <A> "B" & C',
    kind: 'ok', date: '2026-09-21', photos: 5, state: '준비', cutKind: 'ok', cutText: '5/5', sheetKind: 'none', sheetText: '—', folderPath: '/synthetic', pairs: 5};
  vm.runInContext('render([input])', board);
  const parse = String.raw`
import json, sys
from html.parser import HTMLParser
class Rows(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags=[]; self.cells=[]; self.active=None
    def handle_starttag(self, tag, attrs):
        self.tags.append([tag,dict(attrs)])
        if tag=='td': self.active=''
    def handle_data(self, data):
        if self.active is not None: self.active+=data
    def handle_endtag(self, tag):
        if tag=='td': self.cells.append(self.active); self.active=None
p=Rows(); p.feed(sys.stdin.read()); print(json.dumps({'tags':p.tags,'cells':p.cells}))
`;
  const parsed = JSON.parse(execFileSync('python3', ['-B', '-c', parse], {input: boardRows.innerHTML, encoding: 'utf8'}));
  const tags = name => parsed.tags.filter(t => t[0] === name).map(t => t[1]);
  check('보드 텍스트 셀에 <·따옴표·&를 그대로 표시', parsed.cells[1] === board.input.name && parsed.cells[2] === board.input.customer && parsed.cells[9] === board.input.folder);
  check('보드 고객 문자열은 HTML 요소로 실행되지 않음', tags('img').length === 0 && tags('td').length === 10);
  check('주문 체크박스 value·선택 상태 보존', tags('input')[0].value === board.input.name && 'checked' in tags('input')[0]);
  check('누끼·시트 data-name과 구성 data-folder 원값 보존', tags('button')[0]['data-name'] === board.input.name && tags('button')[1]['data-name'] === board.input.name && tags('button')[2]['data-folder'] === board.input.folder);
  console.log('\n' + passed + '/' + passed + ' 통과 ✅');
}
main().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => fs.rmSync(temp, {recursive: true, force: true}));
