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

var VARS = ['MM_TO_PT', 'BODY_PADDING_X_MM', 'BODY_PADDING_Y_MM', 'GAP_DEFAULT_MM', 'BAND_CELL_TOL',
            'TIER_SIZE_MM', 'TIER_DEFAULT', 'PKG_COUNT_BY_TIER',
            'BUCKETS', 'BUCKET_TIERS', 'TIER_TO_BUCKET', 'PACKAGE_LADDERS',
            'PACKAGE_SHEET_VALUES', 'PACKAGE_SHEET_DEFAULT_INDEX', 'ORPHAN_FILL_MIN_WIDTH', 'NAME_BIG_H_MM', 'NAME_CALLI_COUNT', 'LETTER_UNIT_MM', 'LETTER_GAP_RATIO', 'LETTER_UNIT_STEPS_MM', 'LETTER_UNIT_MIN_MM', 'LETTER_UNIT_TIGHT_STEPS_MM', 'NAME_SMALL_H_MM', 'NAME_HALO_RATIO', 'CUT_CACHE_FORMAT', 'CUT_CACHE_DIRNAME', 'TRACE_OPTS'];
var FNS = ['_tierBox', '_newShelfRow', '_snapPack', '_heightsClose', '_canAddToShelfRow',
           '_addToShelfRow', '_tryAddToBandRow', '_placeBanded', '_pkgMin', '_pkgMax',
           '_buildTierColumn', '_pairPlacedInRows', '_sortedPairsForShelf',
           '_shelfRowsToPlaced', '_packPackage',
           '_bucketOf', '_dealBuckets', '_assignTiers', '_resetPackState',
           '_sheetFill', '_trialLadder', '_planPackageSheets',
           '_traceSignature', '_cutCacheFileFor', '_cutCacheFingerprint', '_subpathsOf',
           '_writeCutCache', '_readCutCache', '_rebuildCutline',
           '_attachLetterBlock', '_letterBlockSpec', '_letterBlockResize', '_letterUnitToFit',
           '_moveLetterBlocksToRowEnd', '_itemBases', '_packBoxWithPairs', '_fillUnderLetterBlocks', '_lastCopyGuard', '_evictForLetterBlock',
           '_searchEvictSlot', '_recalcShelfRow',
           '_letterShapeCandidates', '_nfcHangul'];

var out = ['// AUTO-GENERATED from ' + SRC + ' — 편집 금지, extract.js 재실행할 것', ''];
VARS.forEach(function (v) { out.push(extractVar(v)); });
out.push('');
FNS.forEach(function (f) { out.push(extractFn(f)); out.push(''); });
out.push('module.exports = { ' + FNS.concat(VARS).map(function (n) { return n + ': ' + n; }).join(', ') + ' };');
var body = out.join('\n');
fs.writeFileSync(OUT, body);

// ── 자기검사 ───────────────────────────────────────────────────────────
// FNS/VARS 는 손으로 관리하는 목록이라 새 심볼을 빠뜨리기 쉽고, 그러면 테스트가
// **낡은 packer.js 로 조용히 통과**하거나 한참 뒤에 ReferenceError 로 터진다 (3번 당함).
// 생성 직후 참조/선언을 대조해 여기서 바로 실패시킨다.
var stripped = body
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  .replace(/'(\\.|[^'\\])*'/g, "''")
  .replace(/"(\\.|[^"\\])*"/g, '""');
var declared = {};
FNS.concat(VARS).forEach(function (n) { declared[n] = true; });
['Math', 'JSON', 'String', 'Number', 'Array', 'Object', 'RGBColor', 'module', 'parseFloat',
 'parseInt', 'isNaN', 'Error', 'Date', 'RegExp', 'Boolean', 'Infinity', 'NaN', 'undefined']
  .forEach(function (n) { declared[n] = true; });
var missing = {};
// 앞에 '.' 이 붙으면 속성 접근(Illustrator enum 등), 뒤에 ':' 이면 객체 키다 — 둘 다 참조가 아니다.
var m, reFn = /(^|[^.\w$])(_[A-Za-z][A-Za-z0-9_]*)\s*\(/g;
while ((m = reFn.exec(stripped)) !== null) if (!declared[m[2]]) missing[m[2]] = 1;
var reConst = /(^|[^.\w$])([A-Z][A-Z0-9_]{2,})\b(?!\s*:)/g;
while ((m = reConst.exec(stripped)) !== null) if (!declared[m[2]]) missing[m[2]] = 1;
// 지역 var 로 선언된 것은 참조가 아니다
Object.keys(missing).forEach(function (n) {
  if (new RegExp('\\bvar\\s+' + n + '\\b').test(stripped)) delete missing[n];
  if (new RegExp('function\\s+' + n + '\\b').test(stripped)) delete missing[n];
});
var miss = Object.keys(missing);
if (miss.length > 0) {
  console.error('❌ 추출 누락 — extract.js 의 FNS/VARS 에 추가할 것: ' + miss.join(', '));
  process.exit(1);
}
console.log('추출 완료: ' + FNS.length + ' 함수 / ' + VARS.length + ' 상수 → ' + OUT);
