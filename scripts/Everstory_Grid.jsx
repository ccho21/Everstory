// Everstory Grid Placer - Unified Script

(function () {
  var MM_TO_PT = 2.834645;

  // ==========================================
  // UI 다이얼로그
  // ==========================================
  var dlg = new Window('dialog', 'Everstory Grid Placer');
  dlg.orientation = 'column';
  dlg.alignChildren = 'fill';
  dlg.margins = 20;
  dlg.spacing = 15;

  // 사진 크기
  var sizePanel = dlg.add('panel', undefined, '사진 크기');
  sizePanel.orientation = 'row';
  sizePanel.margins = [15, 20, 15, 15];
  sizePanel.spacing = 15;
  var sizeOptions = ['2cm', '3cm', '5cm', '6cm', '7cm'];
  var sizeRadios = [];
  for (var s = 0; s < sizeOptions.length; s++) {
    sizeRadios.push(sizePanel.add('radiobutton', undefined, sizeOptions[s]));
  }
  sizeRadios[1].value = true; // 기본값: 3cm

  // 칼선 여백
  var marginPanel = dlg.add('panel', undefined, '칼선 여백');
  marginPanel.orientation = 'row';
  marginPanel.margins = [15, 20, 15, 15];
  marginPanel.spacing = 15;
  var marginOptions = ['1mm', '2mm', '3mm'];
  var marginRadios = [];
  for (var mr = 0; mr < marginOptions.length; mr++) {
    marginRadios.push(marginPanel.add('radiobutton', undefined, marginOptions[mr]));
  }
  marginRadios[1].value = true; // 기본값: 2mm

  // 템플릿 선택
  var tplPanel = dlg.add('panel', undefined, '템플릿 (선택사항)');
  tplPanel.orientation = 'row';
  tplPanel.margins = [15, 20, 15, 15];
  tplPanel.spacing = 10;
  tplPanel.alignChildren = 'center';
  var tplLabel = tplPanel.add('statictext', undefined, '없음 (새 A4 문서)');
  tplLabel.preferredSize = [200, 20];
  var tplBtn = tplPanel.add('button', undefined, '파일 선택...');
  var tplClearBtn = tplPanel.add('button', undefined, '✕');
  tplClearBtn.preferredSize = [25, 25];
  var templateFile = null;
  tplBtn.onClick = function () {
    var f = File.openDialog('템플릿 AI 파일 선택', '*.ai');
    if (f) {
      templateFile = f;
      tplLabel.text = f.name;
    }
  };
  tplClearBtn.onClick = function () {
    templateFile = null;
    tplLabel.text = '없음 (새 A4 문서)';
  };

  // 실행/취소 버튼
  var btnGroup = dlg.add('group');
  btnGroup.alignment = 'right';
  btnGroup.spacing = 10;
  btnGroup.add('button', undefined, '취소', { name: 'cancel' });
  var okBtn = btnGroup.add('button', undefined, '실행', { name: 'ok' });
  okBtn.active = true;

  if (dlg.show() !== 1) return;

  // ==========================================
  // 파라미터 결정
  // ==========================================
  var sizesMm = [20, 30, 50, 60, 70];
  var targetSizeMm = 30;
  for (var si = 0; si < sizeRadios.length; si++) {
    if (sizeRadios[si].value) { targetSizeMm = sizesMm[si]; break; }
  }

  var marginsMm = [1, 2, 3];
  var cutlineMarginMm = 2;
  for (var mi = 0; mi < marginRadios.length; mi++) {
    if (marginRadios[mi].value) { cutlineMarginMm = marginsMm[mi]; break; }
  }

  var targetSize    = targetSizeMm * MM_TO_PT;
  var cutlineMargin = cutlineMarginMm * MM_TO_PT;
  var actualSize    = targetSize + cutlineMargin * 2;
  var spacingX      = (targetSizeMm + cutlineMarginMm * 2 + 2) * MM_TO_PT;
  var spacingY      = (targetSizeMm + cutlineMarginMm * 2 + 2) * MM_TO_PT;
  var safetyMargin  = 5 * MM_TO_PT;
  var offsetStyleName = 'Offset_' + cutlineMarginMm + 'mm';

  // ==========================================
  // PNG 폴더 선택
  // ==========================================
  var inputFolder = Folder.selectDialog('PNG 파일이 들어있는 폴더를 선택하세요.');
  if (inputFolder == null) return;
  var files = inputFolder.getFiles('*.png');
  if (files.length == 0) {
    alert('선택한 폴더에 PNG 파일이 없습니다.');
    return;
  }

  // ==========================================
  // 문서 열기 / 생성
  // ==========================================
  var doc;
  if (templateFile) {
    doc = app.open(templateFile);
  } else {
    var docPreset = new DocumentPreset();
    docPreset.width = 210 * MM_TO_PT;
    docPreset.height = 297 * MM_TO_PT;
    docPreset.colorMode = DocumentColorSpace.CMYK;
    docPreset.units = RulerUnits.Millimeters;
    doc = app.documents.addDocument('Print', docPreset);
  }

  // 템플릿의 Info > a5_border 박스를 배치 기준으로 사용
  var bounds = null;
  try {
    var infoLayer = doc.layers.getByName('Info');
    for (var bi = 0; bi < infoLayer.pageItems.length; bi++) {
      if (infoLayer.pageItems[bi].name === 'a5_border') {
        bounds = infoLayer.pageItems[bi].geometricBounds; // [left, top, right, bottom]
        break;
      }
    }
  } catch (e) {}

  // fallback: a5_border 없으면 artboard 기준
  if (!bounds) {
    bounds = doc.visibleBounds;
    if (Math.abs(bounds[2] - bounds[0]) < 10)
      bounds = doc.artboards[0].artboardRect;
  }

  var marginTop    = safetyMargin;
  var marginSide   = safetyMargin;
  var marginBottom = 13 * MM_TO_PT;

  var safeLeft   = bounds[0] + marginSide;
  var safeTop    = bounds[1] - marginTop;
  var safeRight  = bounds[2] - marginSide;
  var safeBottom = bounds[3] + marginBottom;

  var availableWidth = safeRight - safeLeft;

  var cols = Math.floor((availableWidth + (spacingX - actualSize)) / spacingX);
  if (cols < 1) cols = 1;

  var rowWidth = (cols - 1) * spacingX + actualSize;
  var startX = safeLeft + (availableWidth - rowWidth) / 2;
  var startY = safeTop;

  // ==========================================
  // 레이어 생성
  // ==========================================
  var printLayer = doc.layers.add();
  printLayer.name = 'PrintData';

  var cutLayer = doc.layers.add();
  cutLayer.name = 'KissCut';

  var tempLayer = doc.layers.add();
  tempLayer.name = '_TempProcess';

  var currentX = startX;
  var currentY = startY;
  var colIndex = 0;

  for (var i = 0; i < 100; i++) {
    if (colIndex >= cols) {
      colIndex = 0;
      currentX = startX;
      currentY -= spacingY;
    }

    if (currentY - actualSize < safeBottom) break;

    // 2. 인쇄 레이어에 이미지 배치
    var placedFile = printLayer.placedItems.add();
    placedFile.file = new File(files[i % files.length]);

    var ratio =
      targetSize /
      (placedFile.width > placedFile.height
        ? placedFile.width
        : placedFile.height);
    placedFile.width  *= ratio;
    placedFile.height *= ratio;

    var xOffset = (targetSize - placedFile.width)  / 2 + cutlineMargin;
    var yOffset = (targetSize - placedFile.height) / 2 + cutlineMargin;

    placedFile.left = currentX + xOffset;
    placedFile.top  = currentY - yOffset;

    // 3. 칼선 생성
    try {
      placedFile.duplicate(tempLayer, ElementPlacement.PLACEATBEGINNING);

      for (var li = 0; li < doc.layers.length; li++) {
        if (doc.layers[li] !== tempLayer) doc.layers[li].locked = true;
      }
      doc.activeLayer = tempLayer;
      app.executeMenuCommand('selectall');
      app.redraw();

      var prevLevel = app.userInteractionLevel;
      app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
      try {
        app.doScript('MakeCutline', 'SummaTools');
      } catch (e) {}
      app.userInteractionLevel = prevLevel;
      app.redraw();

      app.executeMenuCommand('selectall');
      app.redraw();

      var traceTarget = doc.selection[0];
      if (traceTarget && traceTarget.trace) {
        var trace = traceTarget.trace();
        var traceOpts = trace.tracing.tracingOptions;

        try { traceOpts.loadFromPreset('Silhouettes'); } catch (e) {}

        traceOpts.tracingMode    = TracingModeType.TRACINGMODEBLACKANDWHITE;
        traceOpts.tracingMethod  = TracingMethodType.TRACINGMETHODABUTTING;
        traceOpts.threshold      = 230;
        traceOpts.pathFidelity   = 10;
        traceOpts.cornerFidelity = 10;
        traceOpts.minimumArea    = 250;
        traceOpts.cornerAngle    = 20;
        traceOpts.fills          = true;
        traceOpts.strokes        = false;
        traceOpts.snapCurveToLines = false;
        traceOpts.ignoreWhite    = true;

        var expanded = trace.tracing.expandTracing();

        var myStyle = doc.graphicStyles.getByName(offsetStyleName);
        myStyle.applyTo(expanded);

        app.executeMenuCommand('deselectall');

        for (var k = 0; k < tempLayer.pageItems.length; k++) {
          tempLayer.pageItems[k].selected = true;
        }

        app.executeMenuCommand('expandStyle');
        app.executeMenuCommand('Live Pathfinder Add');
        app.executeMenuCommand('expandStyle');

        try { app.executeMenuCommand('ungroup'); } catch (e) {}
      }

      app.executeMenuCommand('deselectall');
      printLayer.locked = false;
      cutLayer.locked   = false;
      for (var mv = tempLayer.pageItems.length - 1; mv >= 0; mv--) {
        tempLayer.pageItems[mv].move(cutLayer, ElementPlacement.PLACEATEND);
      }
    } catch (e) {
      printLayer.locked = false;
      cutLayer.locked   = false;
    }
    app.redraw();

    currentX += spacingX;
    colIndex++;
  }

  // ==========================================
  // 정리
  // ==========================================
  for (var ui = 0; ui < doc.layers.length; ui++) {
    doc.layers[ui].locked = false;
  }

  tempLayer.locked  = false;
  tempLayer.visible = true;
  while (tempLayer.pageItems.length > 0) {
    tempLayer.pageItems[0].remove();
  }
  tempLayer.remove();

  cutLayer.move(doc, ElementPlacement.PLACEATBEGINNING);
  printLayer.move(doc, ElementPlacement.PLACEATEND);

  app.redraw();
  doc.saved = true;
  doc.activeLayer = cutLayer;

  // ==========================================
  // 자동 저장 → 닫기 → 재오픈 (undo 스택 초기화)
  // ==========================================
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var now = new Date();
  var ts =
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    '_' +
    pad(now.getHours()) +
    pad(now.getMinutes());

  var fileName = ts + '_' + targetSizeMm + 'mm_' + cutlineMarginMm + 'mm_grid.ai';

  // 입력 폴더가 .../02_누끼/<category>/ 형태면 .../03_출력/<category>/ 에 저장
  var outputFolder = inputFolder;
  var parentFolder = inputFolder.parent;
  if (parentFolder && parentFolder.name === '02_누끼') {
    var projectRoot = parentFolder.parent;
    var category = inputFolder.name;
    if (projectRoot) {
      var candidate = new Folder(projectRoot.fsName + '/03_출력/' + category);
      if (!candidate.exists) candidate.create();
      if (candidate.exists) outputFolder = candidate;
    }
  }

  var saveFile = new File(outputFolder.fsName + '/' + fileName);

  var aiOpts = new IllustratorSaveOptions();
  aiOpts.compatibility = Compatibility.ILLUSTRATOR24;
  aiOpts.pdfCompatible = true;
  doc.saveAs(saveFile, aiOpts);
  doc.close(SaveOptions.SAVECHANGES);
  app.open(saveFile);
  alert('완료!\n' + saveFile.fsName + ' 로 저장되었습니다.');
})();
