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
function scenario(failure, inset = 0) {
  const sandbox = load({failure, inset});
  vm.runInContext(`
    var saved=false, headerCount=0, fixes=[], calls=0;
    var app={userInteractionLevel:42,
      concatenateMatrix:function(a,b){return a.concat(b);},
      getTranslationMatrix:function(x,y){return [{kind:'translate',x:x,y:y}];},
      getScaleMatrix:function(x,y){return [{kind:'scale',x:x/100,y:y/100}];}};
    var UserInteractionLevel={DONTDISPLAYALERTS:0},ElementPlacement={PLACEATBEGINNING:0,PLACEATEND:1},Transformation={DOCUMENTORIGIN:0};
    var File=function(p){this.fsName=p;};
    _ensureCutContour=function(){return {};};
    _safeRedrawAndGC=function(){};_cleanupTraceStash=function(){};
    _buildCutlineCache=function(doc,pairs){return failure==='trace'?[{base:pairs[0].base,error:'injected trace error'}]:[];};
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
    _drawProductionHeader=function(options,count){headerCount=count;if(failure==='header')throw new Error('injected header error');};
    _resolveOutputFolder=function(){return {fsName:'/tmp'};};_saveAi=function(){saved=true;};
    var ctx={doc:{layers:{add:function(){return {move:function(){}};}}},binW:142*MM_TO_PT,binH:172*MM_TO_PT,bL:11,bT:172*MM_TO_PT+19,padXPt:0,padYPt:0};
    var pairs=[{base:'D0',aspect:1},{base:'D1',aspect:1},{base:'D2',aspect:1},{base:'D3',aspect:1}];
    var result=_produceRangeSheet(ctx,pairs,{range:'large'},0,1,1.5*MM_TO_PT,inset*MM_TO_PT,{},'test');
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
console.log(`PASS: ${checks} output/cut checks; ${sheets} representative packing sheets; fresh source syntax. No Illustrator execution.`);
