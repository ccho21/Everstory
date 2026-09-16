// Everstory Face Probe — macOS Vision 으로 사진의 얼굴·사람·동물 박스를 잰다.
// Everstory_range.jsx (Composed) 가 File.execute() 로 이 앱을 띄운다. 앱은 실행 인자를 못 받으므로
// $TMPDIR/everstory_face/request.txt 를 읽고 result.txt 를 쓴다 (result.tmp 에 다 쓴 뒤 이름을 바꾼다 —
// Illustrator 가 쓰는 도중의 파일을 읽지 않게).
//
// request.txt          result.txt
//   id=<토큰>             EVFACE1
//   file=<경로>           ver=1
//   file=<경로> …         id=<토큰>
//                         F|<경로>|ok|얼굴수|x,y,w,h|사람수|동물수     (x,y,w,h = 가장 큰 얼굴, 0~1, 원점 왼쪽 위)
//
// 빌드: osacompile -l JavaScript -o EverstoryFaceProbe.app faceprobe.js  (README.md 참고)
ObjC.import('Foundation');
ObjC.import('Vision');

function readText(p) {
  var s = $.NSString.stringWithContentsOfFileEncodingError($(p), $.NSUTF8StringEncoding, null);
  return (!s || s.isNil()) ? null : ObjC.unwrap(s);
}

function writeText(p, t) {
  $(t).writeToFileAtomicallyEncodingError($(p), true, $.NSUTF8StringEncoding, null);
}

function r4(v) { return Math.round(v * 10000) / 10000; }

function probe(path) {
  var handler = $.VNImageRequestHandler.alloc.initWithURLOptions($.NSURL.fileURLWithPath($(path)), $({}));
  var faceReq = $.VNDetectFaceRectanglesRequest.alloc.init;
  var humanReq = $.VNDetectHumanRectanglesRequest.alloc.init;
  var animalReq = $.VNRecognizeAnimalsRequest.alloc.init;
  var ok = handler.performRequestsError($([faceReq, humanReq, animalReq]), null);
  var best = null, nf = 0, res = faceReq.results, k, b;
  if (res) {
    nf = res.count;
    for (k = 0; k < res.count; k++) {
      b = res.objectAtIndex(k).boundingBox;
      // Vision 좌표는 원점이 왼쪽 아래 — 왼쪽 위로 뒤집는다.
      if (!best || b.size.height > best.h) {
        best = { x: b.origin.x, y: 1 - b.origin.y - b.size.height, w: b.size.width, h: b.size.height };
      }
    }
  }
  var nh = humanReq.results ? humanReq.results.count : 0;
  var na = animalReq.results ? animalReq.results.count : 0;
  return [ok ? 'ok' : 'fail', nf, best ? [r4(best.x), r4(best.y), r4(best.w), r4(best.h)].join(',') : '-', nh, na];
}

function run() {
  var dir = ObjC.unwrap($.NSTemporaryDirectory()) + 'everstory_face';
  var req = readText(dir + '/request.txt');
  if (!req) return;
  var lines = req.split(/\r?\n/), id = '', files = [], i;
  for (i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('id=') === 0) id = lines[i].substring(3);
    else if (lines[i].indexOf('file=') === 0) files.push(lines[i].substring(5));
  }
  var out = ['EVFACE1', 'ver=1', 'id=' + id];
  for (i = 0; i < files.length; i++) {
    var rec;
    try { rec = probe(files[i]); } catch (e) { rec = ['error', 0, '-', 0, 0]; }
    out.push(['F', files[i]].concat(rec).join('|'));
  }
  var fm = $.NSFileManager.defaultManager;
  writeText(dir + '/result.tmp', out.join('\n') + '\n');
  fm.removeItemAtPathError($(dir + '/result.txt'), null);
  fm.moveItemAtPathToPathError($(dir + '/result.tmp'), $(dir + '/result.txt'), null);
}
