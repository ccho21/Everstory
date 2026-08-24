// ExtendScript 는 function 선언만 호이스팅한다. var 초기화는 실행 순서대로라
// **메인 플로우보다 아래에 선언된 상수는 배치 시점에 undefined** 다.
// 2026-08-22 에 알파벳 엔진 상수(FRAME_DEFS/INK/PROBE_SIZE_PT)를 아래에 두어
// 글자가 하나도 안 그려지는 사고가 났다. 그 부류를 정적으로 막는다.
var fs=require('fs');
var src=fs.readFileSync((process.env.PROBE||'../Everstory_mixed.jsx'),'utf8').split('\n');

// 메인 플로우 시작 = 최상위 실행문이 처음 나오는 지점
var mainAt=-1;
for (var i=0;i<src.length;i++){
  if (/^  var padPt = BODY_PADDING_MM/.test(src[i])) { mainAt=i; break; }
}
if (mainAt<0) { console.log('❌ 메인 플로우 시작점을 못 찾음'); process.exit(1); }

// 최상위 대문자 상수 선언 위치
var late=[], all=0;
for (var j=0;j<src.length;j++){
  var m=src[j].match(/^  var ([A-Z][A-Z0-9_]*)\s*=/);
  if (!m) continue;
  all++;
  if (j>mainAt) late.push({name:m[1], line:j+1});
}
console.log('최상위 대문자 상수 '+all+'개 / 메인 플로우 시작 line '+(mainAt+1));
if (late.length===0){
  console.log('✅ 전부 메인 플로우 위에 선언됨');
} else {
  console.log('❌ 메인 플로우 아래 선언 '+late.length+'개 — 배치 시점에 undefined:');
  late.forEach(function(x){ console.log('    line '+x.line+'  '+x.name); });
}

// 중복 선언 검사 (같은 이름이 두 번 = 나중 것이 덮어씀)
var seen={},dup=[];
for (var k=0;k<src.length;k++){
  var d=src[k].match(/^  var ([A-Za-z_][A-Za-z0-9_]*)\s*=/);
  if (!d) continue;
  if (seen[d[1]]) dup.push(d[1]+' (line '+seen[d[1]]+', '+(k+1)+')');
  else seen[d[1]]=k+1;
}
console.log(dup.length? '❌ 중복 var 선언: '+dup.join(', ') : '✅ 중복 var 선언 없음');


// ── 중복 함수 선언 검사 ──────────────────────────────────────────
// 같은 이름이 두 번 선언되면 **나중 것이 조용히 이긴다**. 이식할 때 원본 스크립트의
// 헬퍼가 딸려와 mixed 것을 덮어쓰는 사고가 반복됐다 (_pad2, testConfig 등).
var fnSeen = {}, fnDup = [];
for (var fi = 0; fi < src.length; fi++) {
  var fm = src[fi].match(/^  function (\w+)\s*\(/);
  if (!fm) continue;
  if (fnSeen[fm[1]]) fnDup.push(fm[1] + ' (line ' + fnSeen[fm[1]] + ', ' + (fi + 1) + ')');
  else fnSeen[fm[1]] = fi + 1;
}
console.log(fnDup.length ? '❌ 중복 함수 선언: ' + fnDup.join(', ') : '✅ 중복 함수 선언 없음');

// ── 미선언 상수 검사 ──────────────────────────────────────────────
// 위치만 보면 "선언은 됐는데 아래에 있다" 만 잡는다. 이식 때 **아예 빠뜨린** 상수는
// 런타임에서만 터진다 (2026-08-23: TILT_MAX_DEG 누락으로 글자가 통째로 안 그려짐).
// 주석 제거 → **문자열 리터럴 제거** → 정규식 리터럴 제거.
// 문자열을 남기면 "XXL"/"BIG" 같은 값이 식별자로 오탐된다.
var joined = src.map(function(l){ return l.replace(/\/\/.*$/, ''); }).join('\n')
  .replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/\/(?:[^\/\\\n]|\\.)+\/[gimy]*/g, '/RE/');
var declared = {};
(joined.match(/\bvar ([A-Z][A-Z0-9_]*)\s*=/g) || []).forEach(function(m){
  declared[m.replace(/\bvar\s+/, '').replace(/\s*=$/, '')] = true;
});
var BUILTIN = {RGBColor:1,SaveOptions:1,ElementPlacement:1,UserInteractionLevel:1,Transformation:1,
  StrokeJoin:1,PointType:1,TracingModeType:1,TracingMethodType:1,DocumentColorSpace:1,RulerUnits:1,
  ImageColorSpace:1,Compatibility:1,RasterizationColorModel:1,DocumentPreset:1,Math:1,JSON:1,
  Error:1,File:1,Folder:1,Date:1,String:1,Number:1,Array:1,Object:1,NaN:1,Infinity:1};
var undecl = {};
// 객체 키(`NAME:`)와 프로퍼티(`.NAME`)와 문자열 안은 제외
var re = /(^|[^\w.$])([A-Z][A-Z0-9_]{2,})(?!\s*:)(?![\w])/g, mm;
while ((mm = re.exec(joined)) !== null) {
  var id = mm[2];
  if (declared[id] || BUILTIN[id]) continue;
  undecl[id] = true;
}
var names = Object.keys(undecl);
if (names.length === 0) {
  console.log('✅ 미선언 상수 없음');
} else {
  console.log('❌ 선언 없이 참조되는 상수 ' + names.length + '개: ' + names.join(', '));
}

process.exit((late.length||dup.length||names.length||fnDup.length)?1:0);
