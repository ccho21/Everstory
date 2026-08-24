// 회귀 비교 전용: 최상위 함수/상수를 전부 추출 (의존 목록을 손으로 관리하지 않기 위해).
var fs=require('fs');
var lines=fs.readFileSync(process.argv[2],'utf8').split('\n');
var out=[],names=[],i=0;
while(i<lines.length){
  var mf=lines[i].match(/^  function (\w+)\s*\(/);
  var mv=lines[i].match(/^  var ([A-Z][A-Z0-9_]*)\s*=/);
  if(mf){
    for(var j=i+1;j<lines.length;j++){ if(/^  \}\s*$/.test(lines[j])){
      out.push(lines.slice(i,j+1).join('\n')); names.push(mf[1]); i=j+1; break; } }
    continue;
  }
  if(mv){
    var code=lines[i].replace(/\s*\/\/.*$/,'');
    if(/;\s*$/.test(code)){ out.push(code); names.push(mv[1]); i++; continue; }
    for(var k=i+1;k<lines.length;k++){ if(/^  [\}\]]\s*;\s*$/.test(lines[k])){
      out.push(lines.slice(i,k+1).join('\n')); names.push(mv[1]); i=k+1; break; } }
    continue;
  }
  i++;
}
out.push('module.exports = { '+names.map(function(n){return n+': '+n;}).join(', ')+' };');
fs.writeFileSync(process.argv[3], out.join('\n'));
console.error('  ['+process.argv[3]+'] '+names.length+' 심볼');
