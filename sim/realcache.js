// 실제 디스크의 .evcut 30개를 수정된 파서로 읽어본다 (다음 실행에서 히트할지 사전 확인)
var fs=require('fs'), path=require('path');
global.PointType={CORNER:'CORNER',SMOOTH:'SMOOTH'};
function tp(u){return u.replace(/^file:\/\//,'');}
global.Folder=function(u){this.uri=u;var s=this;
  Object.defineProperty(this,'exists',{get:function(){return fs.existsSync(tp(s.uri));}});
  this.create=function(){fs.mkdirSync(tp(s.uri),{recursive:true});return true;};};
global.File=function(u){var s=this;this.absoluteURI=u;
  Object.defineProperty(this,'exists',{get:function(){return fs.existsSync(tp(u));}});
  Object.defineProperty(this,'length',{get:function(){return fs.statSync(tp(u)).size;}});
  Object.defineProperty(this,'modified',{get:function(){return fs.statSync(tp(u)).mtime;}});
  Object.defineProperty(this,'parent',{get:function(){return new Folder(u.substring(0,u.lastIndexOf('/')));}});
  this.open=function(m){s._mode=m;s._buf=(m==='w')?[]:null;return true;};
  this.write=function(t){s._buf.push(t);return true;};
  this.read=function(){return fs.readFileSync(tp(u),'utf8');};
  this.close=function(){if(s._mode==='w'&&s._buf)fs.writeFileSync(tp(u),s._buf.join(''));s._buf=null;return true;};};
var P=require('./packer.js');

var CUT='/Users/heatherchung/Desktop/EVERSTORY/포토샵누끼/projects/하린/02_cutout';
var sils=fs.readdirSync(CUT).filter(function(f){return /_sil\.png$/.test(f);});
var hit=0, miss=0, reasons={};
sils.forEach(function(n){
  var pair={base:n.replace(/_sil\.png$/,''), sil:new File('file://'+path.join(CUT,n))};
  var r=null;
  try{ r=P._readCutCache(pair); }catch(e){ reasons['예외: '+e.message]=(reasons['예외: '+e.message]||0)+1; }
  if(r){ hit++; }
  else{
    miss++;
    var f=P._cutCacheFileFor(pair);
    var why = !f.exists ? '캐시 파일 없음' : '내용 불일치';
    if(f.exists){
      var t=fs.readFileSync(tp(f.absoluteURI),'utf8').split(/\r\n|\r|\n/);
      var sig=(t.filter(function(x){return x.indexOf('sig=')===0;})[0]||'').substring(4);
      var src=(t.filter(function(x){return x.indexOf('src=')===0;})[0]||'').substring(4);
      if(t[0]!=='EVCUT1') why='헤더 불일치';
      else if(sig!==P._traceSignature()) why='서명 불일치';
      else if(src!==P._cutCacheFingerprint(pair)) why='지문 불일치 (src='+src+' vs 현재='+P._cutCacheFingerprint(pair)+')';
    }
    reasons[why]=(reasons[why]||0)+1;
  }
});
console.log('실 .evcut 검사: 사진 '+sils.length+'개 중  히트 '+hit+'  미스 '+miss);
Object.keys(reasons).forEach(function(k){ console.log('   미스 사유 — '+k+': '+reasons[k]+'건'); });
if(hit>0){
  var n=sils[0];
  var pair={base:n.replace(/_sil\.png$/,''), sil:new File('file://'+path.join(CUT,n))};
  var d=P._readCutCache(pair);
  if(d) console.log('\n샘플 복원: subpath '+d.subs.length+'개 / 점 '+
    d.subs.reduce(function(a,s){return a+s.pts.length;},0)+'개  cutInfo relW='+d.cutInfo.relW.toFixed(4));
}

// 실 _sil.png 지문으로 새 포맷 캐시를 쓰고 즉시 되읽어 본다 (다음 실행의 히트 경로 검증)
console.log('\n=== 새 포맷 왕복 (실 _sil.png 지문 사용) ===');
var mk=function(pts,closed){return {typename:'PathItem',closed:closed,
  pathPoints:pts.map(function(v){return {anchor:[v[0],v[1]],leftDirection:[v[2],v[3]],
    rightDirection:[v[4],v[5]],pointType:'SMOOTH'};})};};
var probe=mk([[1.5,2.5,1,2,2,3,0],[10.25,20.75,10,20,11,21,0]],true);
var okAll=0, bad=0;
sils.forEach(function(n){
  var pair={base:n.replace(/_sil\.png$/,''), sil:new File('file://'+path.join(CUT,n))};
  var f=P._cutCacheFileFor(pair);
  var backup = f.exists ? fs.readFileSync(tp(f.absoluteURI)) : null;
  try{
    P._writeCutCache(pair, probe, {relL:0.1,relT:0.2,relW:0.3,relH:0.4});
    var r=P._readCutCache(pair);
    if(r && Math.abs(r.cutInfo.relW-0.3)<1e-9 && r.subs[0].pts.length===2) okAll++; else bad++;
  }catch(e){ bad++; }
  // 원상 복구 — 실제 캐시를 이 테스트가 오염시키지 않도록
  if(backup) fs.writeFileSync(tp(f.absoluteURI), backup);
  else if(fs.existsSync(tp(f.absoluteURI))) fs.unlinkSync(tp(f.absoluteURI));
});
console.log('  사진 '+sils.length+'개 전부 왕복: 성공 '+okAll+' / 실패 '+bad+(bad===0?'  ✅':'  ❌'));
