// Everstory_mixed.jsx 에서 패커 함수/상수를 텍스트 추출 → node 에서 실행 가능한 모듈로 변환.
// 손으로 베끼지 않으므로 실코드와 드리프트 불가. (2-space 들여쓰기 IIFE 규약에 의존)
var fs = require('fs');
var SRC = process.argv[2];
var OUT = process.argv[3];
var lines = fs.readFileSync(SRC, 'utf8').split('\n');

function extractFn(name) {
  var startRe = new RegExp('^  function ' + name + '\\s*\\(');
  for (var i = 0; i < lines.length; i++) {
    if (startRe.test(lines[i])) {
      for (var j = i + 1; j < lines.length; j++) {
        if (/^  \}\s*$/.test(lines[j])) {
          return lines.slice(i, j + 1).join('\n');
        }
      }
    }
  }
  throw new Error('function not found: ' + name);
}

function extractVar(name) {
  var startRe = new RegExp('^  var ' + name + '\\s*=');
  for (var i = 0; i < lines.length; i++) {
    if (startRe.test(lines[i])) {
      // 한 줄이면 그대로, 아니면 다음 '  };' 또는 '  ];' 까지.
      // 줄 끝 주석(`var X = [..];  // 설명`)을 벗겨내고 판정 — 안 벗기면 한 줄 선언을
      // 여러 줄로 오인해 다음 '  ];' 까지의 무관한 코드를 통째로 삼킨다 (실제로 당함).
      var codeOnly = lines[i].replace(/\s*\/\/.*$/, '');
      if (/;\s*$/.test(codeOnly)) return codeOnly;
      for (var j = i + 1; j < lines.length; j++) {
        if (/^  [\}\]]\s*;\s*$/.test(lines[j])) return lines.slice(i, j + 1).join('\n');
      }
    }
  }
  throw new Error('var not found: ' + name);
}

var VARS = ['MM_TO_PT','BODY_PADDING_MM','GAP_DEFAULT_MM','BAND_CELL_TOL','ALLSIZES_ORDER_MM','ALLSIZES_FILL','ALLSIZES_FILL_MM','ALLSIZES_HERO_COUNT'];
var FNS = ['_packAllSizes','_aspectBandGridPack'];

var out = ['// AUTO-GENERATED from ' + SRC + ' — 편집 금지, extract.js 재실행할 것', ''];
VARS.forEach(function (v) { out.push(extractVar(v)); });
out.push('');
FNS.forEach(function (f) { out.push(extractFn(f)); out.push(''); });
out.push('module.exports = { ' + FNS.concat(VARS).map(function (n) { return n + ': ' + n; }).join(', ') + ' };');
fs.writeFileSync(OUT, out.join('\n'));
console.log('추출 완료: ' + FNS.length + ' 함수 / ' + VARS.length + ' 상수 → ' + OUT);
