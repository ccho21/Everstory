// Fresh-source regression tests. Native Illustrator calls are simulated; no AI files are created.
// node sim/range_output_test.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const vm = require('vm');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'Everstory_range.jsx'), 'utf8');
new vm.Script(source);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'everstory-output-test-'));
const extracted = path.join(dir, 'range.js');
cp.execFileSync(process.execPath, [path.join(__dirname, 'extract_all.js'), path.join(root, 'Everstory_range.jsx'), extracted]);
const code = fs.readFileSync(extracted, 'utf8');
let checks = 0;
function load(extra = {}) {
  const sandbox = {module: {exports: {}}, console, RGBColor: function(){}, ...extra};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}
function scenario(failure, inset = 0, mode = 'range') {
  const sandbox = load({failure, inset, mode});
  vm.runInContext(`
    var saved=false, headerCount=0, fixes=[], calls=0;
    var app={userInteractionLevel:42,
      concatenateMatrix:function(a,b){return a.concat(b);},
      getTranslationMatrix:function(x,y){return [{kind:'translate',x:x,y:y}];},
      getScaleMatrix:function(x,y){return [{kind:'scale',x:x/100,y:y/100}];}};
    var UserInteractionLevel={DONTDISPLAYALERTS:0},ElementPlacement={PLACEATBEGINNING:0,PLACEATEND:1},Transformation={DOCUMENTORIGIN:0};
    var File=function(p){this.fsName=p;};
    _ensureCutContour=function(){return {};};
    _safeRedrawAndGC=function(){};_cleanupTraceStash=function(){};_closeArtLibs=function(){};
    _buildCutlineCache=function(doc,pairs){
      for(var i=0;i<pairs.length;i++)pairs[i].cutInfo={relL:0,relT:0,relW:1,relH:1};
      return failure==='trace'?[{base:pairs[0].base,error:'injected trace error'}]:[];
    };
    function item(bounds,kind) {
      return {geometricBounds:bounds, hidden:failure==='hidden' && kind==='art',
        transform:function(matrix){
          if(failure==='cut-transform' && kind==='cut')throw new Error('injected cut transform error');
          if(failure==='art-transform' && kind==='art')throw new Error('injected art transform error');
          if(failure==='noop')return;
          fixes.push({kind:kind,matrix:matrix});
          var b=this.geometricBounds;
          for(var m=0;m<matrix.length;m++) {
            var a=matrix[m];
            if(a.kind==='translate'){b[0]+=a.x;b[2]+=a.x;b[1]+=a.y;b[3]+=a.y;}
            else {b[0]*=a.x;b[2]*=a.x;b[1]*=a.y;b[3]*=a.y;}
          }
        }};
    }
    _placePhotoSticker=function(doc,p,x,y,w,h){
      calls++;
      if(failure==='placement' && p.base==='D0')throw new Error('injected placement error');
      if(failure==='single-copy' && calls===1)throw new Error('injected single copy error');
      var offset=['shifted','noop','cut-transform','art-transform'].indexOf(failure)>=0?2:0;
      var factor=failure==='oversized'?1.1:1;
      var b=[x+offset,y+offset,x+w*factor+offset,y-h*factor+offset];
      var cut=item(b.slice(0),'cut');
      if(failure==='nonfinite')cut.geometricBounds[0]=NaN;
      return {emb:item(b.slice(0),'art'),cut:cut};
    };
    _placeComposedSticker=function(doc,p,x,y,w,h,rim){
      return _placePhotoSticker(doc,p,x+rim,y-rim,w-2*rim,h-2*rim);
    };
    _drawDecoSticker=function(){if(failure==='deco')throw new Error('injected deco error');return {pieces:1};};
    var nameBlocks=[];
    _drawArtLetterBlock=function(doc,block){nameBlocks.push(block);if(failure==='name')throw new Error('injected name error');return {drawn:true};};
    _drawProductionHeader=function(options,count){headerCount=count;if(failure==='header')throw new Error('injected header error');};
    _resolveOutputFolder=function(){return {fsName:'/tmp'};};_saveAi=function(){saved=true;};
    var ctx={doc:{layers:{add:function(){return {move:function(){}};}}},binW:142*MM_TO_PT,binH:172*MM_TO_PT,bL:11,bT:172*MM_TO_PT+19,padXPt:0,padYPt:0};
    var pairs=[{base:'D0',aspect:1},{base:'D1',aspect:1},{base:'D2',aspect:1},{base:'D3',aspect:1}];
    var result, thrown=null;
    try {
      if(mode==='composed') {
        var stickerName=['named','named-nosmall','name','deco'].indexOf(failure)>=0?'MIA':'';
        var opts={stickerName:stickerName,nameStyle:'retro'};
        if(failure==='named-nosmall') opts.smallName=false;
        result=_produceComposedSheet(ctx,pairs,opts,0,1.5*MM_TO_PT,inset*MM_TO_PT,{},'test',0,1);
      } else {
        result=_produceRangeSheet(ctx,pairs,{range:'large'},0,1,1.5*MM_TO_PT,inset*MM_TO_PT,{},'test');
      }
    } catch(error) { thrown=error; }
  `, sandbox);
  assert.equal(sandbox.app.userInteractionLevel, 42, 'Interaction setting restored');
  return sandbox;
}

for (const [name, inset] of [['normal',0],['shifted',0],['oversized',0],['normal',1]]) {
  const s = scenario(name, inset);
  assert(s.saved, `${name}/${inset}: expected save: ${s.result.saveError}`);
  assert.equal(s.result.failedItems.length, 0);
  assert.equal(s.headerCount, 4);
  assert.equal(s.result.drawnPlacements.length, s.result.packResult.placed.length);
  if (name !== 'normal' || inset) {
    assert(s.result.cutFixCount > 0);
    for (let i=0;i<s.fixes.length;i+=2) {
      assert.equal(s.fixes[i].kind, 'art');assert.equal(s.fixes[i+1].kind, 'cut');
      assert.deepEqual(s.fixes[i].matrix, s.fixes[i+1].matrix, 'Identical art/cut transformation');
    }
  } else assert.equal(s.result.cutFixCount, 0);
  checks++;
}
for (const name of ['trace','placement','single-copy','cut-transform','art-transform','noop','nonfinite','hidden','header']) {
  const s = scenario(name);
  assert(!s.saved, `${name}: invalid output saved`);
  assert(s.result.failedItems.length > 0);
  assert(s.result.saveError.includes('제작 검증 실패'));
  assert.equal(s.result.savedPath, '');
  if (name === 'trace' || name === 'placement') {
    assert.equal(s.headerCount, 3, 'Header uses actually placed photos');
    assert(s.result.drawnPlacements.length < s.result.packResult.placed.length);
  }
  checks++;
}

// The active Composed producer has a different trace failure path: it throws
// before packing. Later placement/audit failures return a blocked-save result.
// Exercise both with real packing/auditing and simulated Illustrator objects.
for (const inset of [0, 1]) {
  const s = scenario('normal', inset, 'composed');
  assert.equal(s.thrown, null);
  assert(s.saved, 'Composed valid output should save');
  assert.equal(s.headerCount, 4);
  assert.equal(s.result.failedItems.length, 0);
  assert.equal(s.result.records.length, s.result.packResult.placed.length);
  checks++;
}
{
  const s = scenario('named', 0, 'composed');
  assert.equal(s.thrown, null);
  assert(s.saved && s.result.nameInfo.drawn, 'Valid named Composed sheet should save');
  assert(s.result.decoDrawn > 0, 'Named fixture must exercise actual deco placements');
  // Small name (2026-09-23): drawn right after the main name, joined, with its own layer tag.
  assert.equal(s.nameBlocks.length, 2, 'main name + small name are both drawn');
  assert.equal(s.nameBlocks[1], s.result.packResult.name2Spec);
  assert.equal(s.nameBlocks[1].drawTag, '2');
  assert.ok(!s.nameBlocks[0].joined && s.nameBlocks[1].joined === true, 'retro main name apart, second name joined');
  assert.ok(s.result.name2Info && s.result.name2Info.drawn, 'small name result is reported');
  checks++;
}
{
  // Small name switched off on the order board (options.smallName === false): only the main name is drawn.
  const s = scenario('named-nosmall', 0, 'composed');
  assert.equal(s.thrown, null);
  assert(s.saved && s.result.nameInfo.drawn, 'Named Composed sheet without the small name should save');
  assert.equal(s.nameBlocks.length, 1, 'only the main name is drawn');
  assert.equal(s.result.packResult.name2Box, null);
  assert.equal(s.result.packResult.name2Missing, false);
  assert.equal(s.result.name2Info, null);
  checks++;
}
for (const name of ['trace','placement','single-copy','cut-transform','art-transform','noop','nonfinite','hidden','header','name','deco']) {
  const s = scenario(name, 0, 'composed');
  assert(!s.saved, `Composed ${name}: invalid output saved`);
  if (name === 'trace') {
    assert(s.thrown && s.thrown.message.includes('칼선 준비 실패'));
    assert.equal(s.calls, 0, 'Trace failure stops before any placement');
    assert.equal(s.headerCount, 0);
  } else {
    assert.equal(s.thrown, null);
    assert(s.result.failedItems.length > 0);
    assert(s.result.saveError.includes('제작 검증 실패'));
    assert.equal(s.result.savedPath, '');
    if (name === 'placement') assert.equal(s.headerCount, 3);
    if (name === 'name' || name === 'deco') {
      assert(s.result.failedItems.some(item => item.error === `injected ${name} error`));
    }
  }
  checks++;
}

// Audit independently of correction: invalid gap, hidden boundary loss, per-size
// minimum and out-of-body paths must be rejected even if the plan was accepted.
const sandbox = load(), P = sandbox.module.exports, M = P.MM_TO_PT;
const pairs = Array.from({length:4},(_,i)=>({base:'D'+i,aspect:1}));
const plan=P._packRange(pairs,'large',142*M,172*M,1.5*M,{});
const ctx={bL:0,bT:172*M,padXPt:0,padYPt:0,binW:142*M,binH:172*M};
function records() {
  return plan.placed.map(p=>({placement:p,x:p.x,y:172*M-p.y,w:p.w,h:p.h,
    emb:{geometricBounds:[p.x,172*M-p.y,p.x+p.w,172*M-p.y-p.h]},
    cut:{geometricBounds:[p.x,172*M-p.y,p.x+p.w,172*M-p.y-p.h]}}));
}
assert.equal(P._rangeAuditOutput(records(),plan.placed,pairs,'large',ctx,1.5*M,0).length,0);checks++;
for (const kind of ['shift','gap','missing','wrong-photo-size']) {
  const r=records();
  if(kind==='shift') r[0].cut.geometricBounds[0]=-M;
  if(kind==='gap') {
    // Both cuts fit their own supplied cells, but the cells overlap: audit must
    // check actual pairwise separation, not rely solely on containment.
    r[1].x=r[0].x;r[1].y=r[0].y;r[1].w=r[0].w;r[1].h=r[0].h;
    r[1].cut.geometricBounds=r[0].cut.geometricBounds.slice();
  }
  if(kind==='missing') r.splice(0,1);
  if(kind==='wrong-photo-size') {
    // Total output count and physical boxes stay correct, but one photo's size
    // is replaced by another photo. Global per-size totals cannot catch this.
    const first=r[0].placement;
    const replacement=plan.placed.find(p=>p.sizeMm===first.sizeMm&&p.payload!==first.payload);
    r[0].placement={...first,payload:replacement.payload,typeIndex:replacement.typeIndex};
  }
  const errors=P._rangeAuditOutput(r,plan.placed,pairs,'large',ctx,1.5*M,0);
  assert(errors.length>0, kind);
  if(kind==='gap') assert(errors.some(e=>e.error.includes('간격')));
  if(kind==='wrong-photo-size') assert(errors.some(e=>e.error.includes('실제 사진별 크기 누락')));
  checks++;
}

// Representative single / four / eight-photo orders on the v3 area-class engine (no name → no decos).
let sheets=0;
for(const range of ['small','large']) for(const n of [1,4,8]) for(const aspects of [[1,1,1,1],[.7256,1,.733,.4756]]) {
  const input=Array.from({length:n},(_,i)=>({base:'D'+i,aspect:aspects[i%4]}));
  const deal=P._rangeDeal(input);
  assert.equal(deal.length,n===8?2:1);
  assert.equal(new Set(deal.flat()).size,n);
  for(const group of deal) {
    const pack=P._packRange(group,range,142*M,172*M,1.5*M,{});
    for(const a of pack.placed) {
      assert(Math.abs((a.rotated?a.h/a.w:a.w/a.h)-a.payload.aspect)<1e-7);
      const c=P._rangeCell(a.payload.aspect,a.sizeMm,P.RANGE_LONG_CAP_MM[range]);assert(Math.abs(a.w-c.w*M)<1e-6&&Math.abs(a.h-c.h*M)<1e-6,'면적 등급 셀');
    }
    for(let i=0;i<pack.placed.length;i++)for(let j=i+1;j<pack.placed.length;j++) {
      const a=pack.placed[i],b=pack.placed[j];
      assert(Math.max(a.x-b.x-b.w,b.x-a.x-a.w,a.y-b.y-b.h,b.y-a.y-a.h)>=1.5*M-1e-7);
    }
    sheets++;
  }
}
// Art cut lines (2026-09-17): some retro decos' largest shape is the black border ring, a compound of the outer
// contour and an inner hole. The cut keeps contours wound like the largest one (holes go, islands stay); print art is untouched.
function fakeShape(typename, areas) {
  const s = {typename, pathItems: [], geometricBounds: [0, 308, 313, 0]};
  for (const a of areas) {
    const p = {typename: 'PathItem', area: a, remove() { s.pathItems.splice(s.pathItems.indexOf(p), 1); }};
    s.pathItems.push(p);
  }
  if (typename === 'PathItem') s.area = areas[0];
  s.duplicate = (layer) => { const d = fakeShape(typename, s.pathItems.map(p => p.area)); d.layer = layer; return d; };
  return s;
}
{
  const ring = fakeShape('CompoundPathItem', [-65460, 71168]);
  assert.strictEqual(P._artCutOuterOnly(ring), ring);
  assert.deepEqual(ring.pathItems.map(p => p.area), [71168], 'ring cut keeps only the outer contour');
  const islands = fakeShape('CompoundPathItem', [900, -300, 1200]);
  P._artCutOuterOnly(islands);
  assert.deepEqual(islands.pathItems.map(p => p.area), [900, 1200], 'islands wound like the largest stay');
  const negative = fakeShape('CompoundPathItem', [-71167, 500]);
  P._artCutOuterOnly(negative);
  assert.deepEqual(negative.pathItems.map(p => p.area), [-71167], 'sign follows the largest contour');
  const one = fakeShape('CompoundPathItem', [-5]);
  P._artCutOuterOnly(one);
  assert.equal(one.pathItems.length, 1);
  const plain = fakeShape('PathItem', [-75259]);
  assert.strictEqual(P._artCutOuterOnly(plain), plain);
  checks++;
}
{
  // _drawDecoSticker end to end with fake Illustrator objects: ring first (as in deco_art_v1.ai), white silhouette below.
  const sb = load();
  const cuts = [];
  sb.fakeShape = fakeShape;
  sb.cuts = cuts;
  vm.runInContext(`
    var app = {}, ElementPlacement = {PLACEATEND: 1};
    var printDup = null;
    function fakeDeco() {
      var kids = [fakeShape('CompoundPathItem', [-65460, 71168]), fakeShape('PathItem', [-71167])];
      return {typename: 'GroupItem', pageItems: kids, geometricBounds: [0, 308, 313, 0],
        resize: function() {}, translate: function() {},
        duplicate: function() { printDup = fakeDeco(); return printDup; }};
    }
    _artLibDoc = function() { return {groupItems: {getByName: function() { return fakeDeco(); }}}; };
    _forceCutContourStroke = function(cut) { cuts.push(cut); };
    _drawDecoSticker({}, {deco: 'HEART', style: 'retro'}, 0, 0, 36, 36, 'print', 'kiss', {});
  `, sb);
  assert.equal(cuts.length, 1);
  assert.equal(cuts[0].layer, 'kiss');
  assert.equal(cuts[0].name, 'Cutline_HEART');
  assert.deepEqual(cuts[0].pathItems.map(p => p.area), [71168], 'deco cut = outer contour only');
  assert.deepEqual(sb.printDup.pageItems[0].pathItems.map(p => p.area), [-65460, 71168], 'printed ring keeps its inner line');
  checks++;
}
// Bubble decos (2026-09-22): the library 'SIL' is a white border around the doodle, so the cut is the union of the doodle
// pieces with no margin — SIL leaves the print after sizing (size unchanged), the union moves to KissCut, pieces come back.
{
  const sb = load();
  const cuts = [], unions = [];
  sb.cuts = cuts;
  sb.unions = unions;
  vm.runInContext(`
    var app = {}, ElementPlacement = {PLACEATEND: 1};
    var printDup = null, resized = null;
    function kid(name) {
      var k = {typename: name === 'SIL' ? 'CompoundPathItem' : 'PathItem', name: name, pathItems: [],
        remove: function() { printDup.pageItems.splice(printDup.pageItems.indexOf(k), 1); }};
      return k;
    }
    function fakeDoodle() {
      return {typename: 'GroupItem', pageItems: [kid('LINE'), kid('FILL'), kid('SIL')], geometricBounds: [0, 300, 300, 0],
        resize: function(p) { resized = p; }, translate: function() {},
        duplicate: function() { printDup = fakeDoodle(); return printDup; }};
    }
    _artLibDoc = function() { return {groupItems: {getByName: function() { return fakeDoodle(); }}}; };
    _artOuterUnion = function(doc, sources, halo, layer) {
      unions.push({kids: sources[0].pageItems.map(function(k) { return k.name; }), halo: halo, layer: layer});
      var shape = {typename: 'CompoundPathItem', move: function(l) { shape.layer = l; }};
      return {shape: shape, pieces: 9};
    };
    _forceCutContourStroke = function(cut) { cuts.push(cut); };
    var got = _drawDecoSticker({}, {deco: 'SUN', style: 'bubble', pad: 2.8346}, 0, 0, 42, 42, 'print', 'kiss', {});
  `, sb);
  assert.equal(sb.unions.length, 1, 'one union per deco');
  assert.deepEqual(sb.unions[0], {kids: ['LINE', 'FILL'], halo: 0, layer: 'print'}, 'union of the doodle without SIL, no offset');
  assert.deepEqual(sb.printDup.pageItems.map(k => k.name), ['LINE', 'FILL'], 'white border SIL leaves the print');
  assert.ok(Math.abs(sb.resized - (42 - 2 * 2.8346) / 300 * 100) < 1e-9, 'size still fits the box with SIL included');
  assert.equal(cuts.length, 1);
  assert.equal(cuts[0].layer, 'kiss');
  assert.equal(cuts[0].name, 'Cutline_SUN');
  assert.equal(sb.got.pieces, 9, 'separate pieces are reported');
  assert.equal(sb.got.art, sb.printDup);
  checks++;
}
// Name drawing (2026-09-23): the main name is apart in both styles — bubble letters get one cut per letter from their own
// 'SIL' (side decorations dropped). The small name is joined in both styles = one merged outline named Cutline_name2
// (bubble merges the letters' SILs, retro merges the whole letter groups — retro letters have no SIL).
{
  const sb = load();
  const cuts = [], unions = [];
  sb.cuts = cuts;
  sb.unions = unions;
  vm.runInContext(`
    var app = {}, ElementPlacement = {PLACEATEND: 1}, dups = [];
    function shape(name, kind) {
      var s = {typename: kind || 'PathItem', name: name, pathItems: []};
      s.duplicate = function(layer) { var d = shape(name, kind); d.layer = layer; d.copyOf = name; return d; };
      return s;
    }
    function fakeLetter(group, withSil) {
      var g = {typename: 'GroupItem', name: group, geometricBounds: [0, 100, 80, 0],
        pageItems: withSil ? [shape('BODY', 'CompoundPathItem'), shape('FACE'), shape('SIL')] : [shape('TILE'), shape('INK')],
        groupItems: withSil ? [{name: 'SIDE R', remove: function() { g.sideGone = true; }}] : [],
        resize: function() {}, translate: function() {},
        duplicate: function() { var d = fakeLetter(group, withSil); dups.push(d); return d; }};
      return g;
    }
    var withSil = true;
    _artLibDoc = function() { return {groupItems: {getByName: function(n) { return fakeLetter(n, withSil); }}}; };
    _forceCutContourStroke = function(cut) { cuts.push(cut); };
    _drawNameHalo = function(doc, sources, halo, p, k, spot, name) { unions.push({n: sources.length, name: name}); return {pieces: 1}; };
    var hB = _composedHero('Vic', 142 * MM_TO_PT, 1.5 * MM_TO_PT, 'bubble').spec;
    var infoB = _drawArtLetterBlock({selection: null}, hB, 0, 0, 'print', 'kiss', {});
    var bubbleDups = dups.slice(0);
    var infoB2 = _drawArtLetterBlock({selection: null}, _composedName2Spec(hB), 0, 0, 'print', 'kiss', {});
    withSil = false;
    var r2 = _composedName2Spec(_composedHero('Mia', 142 * MM_TO_PT, 1.5 * MM_TO_PT, 'retro').spec);
    var infoR = _drawArtLetterBlock({selection: null}, r2, 0, 0, 'print', 'kiss', {});
  `, sb);
  assert.deepEqual(cuts.map(c => c.name), ['Cutline_V_00', 'Cutline_I_01', 'Cutline_C_02'], 'bubble main name: one cut per letter');
  assert.ok(cuts.every(c => c.copyOf === 'SIL' && c.layer === 'kiss'), 'bubble letter cut = its own SIL on KissCut');
  assert.ok(sb.bubbleDups.every(d => d.sideGone), 'side decorations removed from the separated bubble main name');
  assert.ok(sb.infoB.piecesAreLetters && sb.infoB.pieces === 3);
  assert.deepEqual(unions, [{n: 3, name: 'Cutline_name2'}, {n: 3, name: 'Cutline_name2'}],
    'small name = one union of the 3 letters (bubble SILs, then retro letter groups)');
  assert.ok(!sb.infoB2.piecesAreLetters && !sb.infoR.piecesAreLetters);
  checks++;
}
// Style table: only bubble strips a deco border; retro deco art has no margin (its bubble SIL is the printed black edge).
assert.equal(P._nameStyle('bubble').decoBorder, true);
assert.equal(P._nameStyle('retro').decoBorder, false);
checks++;
// Photo cut line = the largest traced piece (2026-09-22 이준_02_MED: a 30×24px stray speck came first in the selection
// and became the whole cut line — 3% of the photo width). Holes live inside the CompoundPathItem, so they stay.
{
  const shape = (typename, b) => ({typename, geometricBounds: b});
  const speck = shape('PathItem', [647, 960, 677, 936]);
  const body = shape('CompoundPathItem', [3, 1799, 902, 1]);
  assert.strictEqual(P._largestTraceShape([speck, body]), body, 'a speck selected first must not become the cut line');
  assert.strictEqual(P._largestTraceShape([{typename: 'GroupItem', pageItems: [speck, {typename: 'GroupItem', pageItems: [body]}]}]), body,
    'looks inside groups');
  assert.strictEqual(P._largestTraceShape([{typename: 'RasterItem', geometricBounds: [0, 2000, 2000, 0]}, speck]), speck, 'only paths count');
  assert.strictEqual(P._largestTraceShape([]), null);
  assert.strictEqual(P._largestTraceShape(null), null);
  checks++;
}
// range.jsx and mixed.jsx share .evcut files — both must pick the same piece with the same code.
{
  const mixed = fs.readFileSync(path.join(root, 'Everstory_mixed.jsx'), 'utf8');
  const fn = s => { const m = s.match(/\n  function _largestTraceShape\([\s\S]*?\n  \}\n/); return m ? m[0] : null; };
  assert.ok(fn(source) && fn(source) === fn(mixed), '_largestTraceShape differs between range.jsx and mixed.jsx');
  for (const s of [source, mixed]) {
    assert.equal((s.match(/var cutShape = _largestTraceShape\(doc\.selection\);/g) || []).length, 1, '_traceAndUnite names the largest piece');
    assert.ok(!/sel\[0\]\.name = "Cutline"/.test(s), 'old selection[0] naming is gone');
  }
  checks++;
}
// Every art cut goes through the filter (decos and retro letters).
assert.equal((source.match(/outline\.duplicate\(kissL/g) || []).length, 2);
assert.equal((source.match(/_artCutOuterOnly\(outline\.duplicate\(kissL, ElementPlacement\.PLACEATEND\)\)/g) || []).length, 2);
checks++;
console.log(`PASS: ${checks} output/cut checks; ${sheets} representative packing sheets; fresh source syntax. No Illustrator execution.`);
