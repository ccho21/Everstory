// 칼선 캐시 포맷 왕복 검증 — ExtendScript File/Folder/PointType 을 최소 shim 으로 대체.
var fs=require('fs'), path=require('path'), os=require('os');
var TMP=fs.mkdtempSync(path.join(os.tmpdir(),'evcut-'));
global.PointType={CORNER:'CORNER',SMOOTH:'SMOOTH'};
function toPath(uri){ return uri.replace(/^file:\/\//,''); }
global.Folder=function(uri){ this.uri=uri; var self=this;
  Object.defineProperty(this,'exists',{get:function(){return fs.existsSync(toPath(self.uri));}});
  this.create=function(){ fs.mkdirSync(toPath(self.uri),{recursive:true}); return true; }; };
global.File=function(uri){ var self=this; this.absoluteURI=uri; this._buf=null;
  Object.defineProperty(this,'exists',{get:function(){return fs.existsSync(toPath(uri));}});
  Object.defineProperty(this,'length',{get:function(){return fs.statSync(toPath(uri)).size;}});
  Object.defineProperty(this,'modified',{get:function(){return fs.statSync(toPath(uri)).mtime;}});
  Object.defineProperty(this,'parent',{get:function(){return new Folder(uri.substring(0,uri.lastIndexOf('/')));}});
  this.open=function(m){ self._mode=m; self._buf=(m==='w')?[]:null; return true; };
  // ExtendScript 재현: lineFeed 를 지정하지 않으면 플랫폼 관례로 \n 을 번역한다.
  // 실제로 macOS 에서 \n → \r 로 바뀌어 캐시가 영영 히트하지 않는 버그가 있었다(2026-08-22).
  this.write=function(t){ var lf=self.lineFeed;
    if(lf==='Unix') { /* 번역 없음 */ }
    else if(lf==='Windows') t=t.replace(/\n/g,'\r\n');
    else t=t.replace(/\n/g,'\r');            // 기본 = 구식 Mac (버그 재현 경로)
    self._buf.push(t); return true; };
  this.read=function(){ return fs.readFileSync(toPath(uri),'utf8'); };
  this.close=function(){ if(self._mode==='w'&&self._buf) fs.writeFileSync(toPath(uri),self._buf.join('')); self._buf=null; return true; }; };

var P=require('./packer.js');

// 가짜 트레이스 결과 — 베지어 핸들과 구멍(2 subpath) 포함
function mkPath(pts,closed){ return {typename:'PathItem',closed:closed,
  pathPoints:pts.map(function(v){return {anchor:[v[0],v[1]],leftDirection:[v[2],v[3]],
    rightDirection:[v[4],v[5]],pointType:v[6]?'CORNER':'SMOOTH'};})}; }
var outer=mkPath([[10.5,20.25,9.1,19.8,11.9,20.7,false],[50.125,80.5,48,79,52,82,false],
                  [90,20,89,19,91,21,true]],true);
var hole=mkPath([[30,40,29,39,31,41,true],[40,50,39,49,41,51,false]],true);
var compound={typename:'CompoundPathItem',pathItems:[outer,hole]};

var silURI='file://'+TMP+'/하린_01_L_sil.png';
fs.writeFileSync(toPath(silURI),'x'.repeat(1234));
var pair={base:'하린_01_L', sil:new File(silURI)};
var info={relL:0.0123,relT:0.4567,relW:0.789,relH:0.9012};

var ok=[];
function chk(n,c){ ok.push(c); console.log((c?'✅':'❌')+' '+n); }

chk('저장 성공', P._writeCutCache(pair, compound, info)===true);
chk('캐시 파일이 _cutcache/ 에 생성', fs.existsSync(TMP+'/_cutcache/하린_01_L.evcut'));

var back=P._readCutCache(pair);
chk('읽기 성공', back!==null);
if(back){
  chk('cutInfo 왕복 일치', Math.abs(back.cutInfo.relL-0.0123)<1e-9 && Math.abs(back.cutInfo.relH-0.9012)<1e-9);
  chk('subpath 2개 (구멍 보존)', back.subs.length===2);
  chk('점 개수 3+2', back.subs[0].pts.length===3 && back.subs[1].pts.length===2);
  var a=back.subs[0].pts[1];
  chk('좌표 정밀도 (50.125/80.5)', Math.abs(a[0]-50.125)<1e-4 && Math.abs(a[1]-80.5)<1e-4);
  chk('베지어 핸들 보존', Math.abs(a[2]-48)<1e-4 && Math.abs(a[5]-82)<1e-4);
  chk('corner 플래그 보존', back.subs[0].pts[2][6]===true && back.subs[0].pts[0][6]===false);
  chk('closed 보존', back.subs[0].closed===true);
}

// 무효화 검사
fs.writeFileSync(toPath(silURI),'y'.repeat(9999));            // 사진이 바뀜
chk('사진 변경 시 캐시 무효', P._readCutCache(pair)===null);
fs.writeFileSync(toPath(silURI),'x'.repeat(1234));
var sigBefore=P._traceSignature();
P.TRACE_OPTS.threshold=200;                                    // 파라미터가 바뀜
chk('트레이스 파라미터 변경 시 서명 변화', P._traceSignature()!==sigBefore);
chk('파라미터 변경 시 캐시 무효', P._readCutCache(pair)===null);
P.TRACE_OPTS.threshold=230;

// 손상 내성
fs.writeFileSync(TMP+'/_cutcache/하린_01_L.evcut','EVCUT1\nsig=garbage\n');
chk('손상 파일 → null (예외 아님)', P._readCutCache(pair)===null);
fs.writeFileSync(TMP+'/_cutcache/하린_01_L.evcut','');
chk('빈 파일 → null', P._readCutCache(pair)===null);

// 재구성
P._writeCutCache(pair, compound, info);
var data=P._readCutCache(pair);
var built=[]; var layer={compoundPathItems:{add:function(){var c={pathItems:{add:function(){
  var pp=[];var pi={closed:false,pathPoints:{add:function(){var o={};pp.push(o);return o;}},_pts:pp};
  c._subs.push(pi);return pi;}},_subs:[]};built.push(c);return c;}},
  pathItems:{add:function(){var pp=[];var pi={closed:false,pathPoints:{add:function(){var o={};pp.push(o);return o;}},_pts:pp};built.push(pi);return pi;}}};
var made=P._rebuildCutline(layer,data);
chk('재구성 = CompoundPath 1개', built.length===1 && built[0]._subs && built[0]._subs.length===2);
chk('재구성 점 개수 3+2', built[0]._subs[0]._pts.length===3 && built[0]._subs[1]._pts.length===2);
var rp=built[0]._subs[0]._pts[1];
chk('재구성 좌표 일치', rp.anchor[0]===50.125 && rp.anchor[1]===80.5);
chk('재구성 핸들·타입 일치', rp.leftDirection[0]===48 && rp.rightDirection[1]===82 && rp.pointType==='SMOOTH');
chk('재구성 closed 일치', built[0]._subs[0].closed===true);

// 줄바꿈 회귀 — 쓴 파일에 LF 가 실제로 들어갔는지 + CR 로 쓰인 파일도 읽히는지
var raw=fs.readFileSync(TMP+'/_cutcache/하린_01_L.evcut','utf8');
chk('쓴 파일에 LF 존재 (lineFeed=Unix 적용)', raw.indexOf('\n')>=0);
chk('쓴 파일에 CR 없음', raw.indexOf('\r')<0);
fs.writeFileSync(TMP+'/_cutcache/하린_01_L.evcut', raw.replace(/\n/g,'\r'));
chk('CR 로 쓰인 구 캐시도 읽힘', P._readCutCache(pair)!==null);
fs.writeFileSync(TMP+'/_cutcache/하린_01_L.evcut', raw.replace(/\n/g,'\r\n'));
chk('CRLF 캐시도 읽힘', P._readCutCache(pair)!==null);

console.log('\n'+ok.filter(Boolean).length+'/'+ok.length+' 통과'+(ok.every(Boolean)?'  ✅':'  ❌ 실패 있음'));
fs.rmSync(TMP,{recursive:true,force:true});
process.exit(ok.every(Boolean)?0:1);
