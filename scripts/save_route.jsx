// Photoshop 누끼 저장 라우터
// 입력 파일이 .../projects/<project>/01_original/ 에 있으면
// → .../projects/<project>/02_cutout/ 에 PNG로 저장 (fallback: 입력 폴더)

(function () {
  var doc = app.activeDocument;

  var srcFile, srcFolder;
  try {
    srcFile = doc.fullName;
    srcFolder = srcFile.parent;
  } catch (e) {
    return; // 문서가 저장된 적 없음
  }

  var outFolder;
  if (decodeURIComponent(srcFolder.name) === "01_original") {
    outFolder = new Folder(srcFolder.parent.fsName + "/02_cutout");
  } else {
    outFolder = srcFolder;
  }

  if (!outFolder.exists) outFolder.create();

  var baseName = srcFile.name.replace(/\.[^.]+$/, "").toLowerCase();
  var outFile = new File(outFolder.fsName + "/" + baseName + ".png");

  var opts = new PNGSaveOptions();
  opts.compression = 6;
  opts.interlaced = false;
  doc.saveAs(outFile, opts, true); // true = save as copy
})();
