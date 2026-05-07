// Everstory — template_cutout 의 info 레이어 + 5 기준 PathItem 자동 생성
//
// 목적:
//   새 시트 디자인용 .ait 제작 시 info 레이어 안 5 PathItem
//   (border, reg_border, header, header_border, body) 을 정확한 좌표로 자동 생성한다.
//   brand 레이어 (헤더 로고 / 푸터 정적 디자인) 는 수동으로 추가한다.
//
// 좌표 (A5 세로 148×210mm 기준, 좌상단 = 0,0, y 아래로 양수):
//   border        X=0,    Y=0,    W=148,   H=210     (시각 가이드)
//   reg_border    X=3,    Y=3,    W=142,   H=204     (Summa 안전영역)
//   header        X=5.6,  Y=0,    W=136.8, H=26.3    (코드 사용)
//   header_border X=5.6,  Y=26.3, W=136.8, H=0.1     (시각 divider)
//   body          X=5.6,  Y=26.3, W=136.8, H=162.3   (코드 사용)
//
// 비율 출처: assets/illustrator_template_{1,2}.png 픽셀 측정 (헤더 12.5%, 푸터 89.8%, 좌우 padding 3.8%)
//
// 사용법:
//   1. Illustrator 실행 (활성 문서 없어도 됨)
//   2. File > Scripts > Other Script > Everstory_TemplateCutoutBuilder.jsx
//   3. 다이얼로그에서 "새 A5 세로 문서 생성" 또는 "현재 활성 문서 사용" 선택
//   4. 생성 완료 후 brand 레이어 추가 → 헤더 로고 / divider / 푸터 정적 디자인
//   5. File > Save As Template → templates/template_cutout_white.ait
//   6. 배경색만 바꿔 template_cutout_beige.ait 추가 저장
//
// Everstory_mixed.jsx 와 Everstory_NameIncludedSheet.jsx 코드는 건드리지 않는다.

// #target illustrator

(function () {
  "use strict";

  var MM_TO_PT = 2.834645;
  var A5_W_MM = 148;
  var A5_H_MM = 210;

  // 비율 환산 상수
  var PADDING_X_MM = 5.6;             // 좌우 padding (3.8%)
  var HEADER_H_MM = 26.3;             // 헤더 영역 높이 (12.5%)
  var FOOTER_DIVIDER_Y_MM = 188.6;    // 푸터 divider y (89.8%)
  var REG_INSET_MM = 3;               // reg_border inset
  var HEADER_BORDER_H_MM = 0.1;       // header_border 두께 (시각용)

  var CONTENT_W_MM = A5_W_MM - 2 * PADDING_X_MM;          // 136.8
  var BODY_H_MM = FOOTER_DIVIDER_Y_MM - HEADER_H_MM;       // 162.3

  var PATHS = [
    { name: "border",        leftMm: 0,            topMm: 0,           wMm: A5_W_MM,                  hMm: A5_H_MM },
    { name: "reg_border",    leftMm: REG_INSET_MM, topMm: REG_INSET_MM,wMm: A5_W_MM - 2 * REG_INSET_MM,hMm: A5_H_MM - 2 * REG_INSET_MM },
    { name: "header",        leftMm: PADDING_X_MM, topMm: 0,           wMm: CONTENT_W_MM,             hMm: HEADER_H_MM },
    { name: "header_border", leftMm: PADDING_X_MM, topMm: HEADER_H_MM, wMm: CONTENT_W_MM,             hMm: HEADER_BORDER_H_MM },
    { name: "body",          leftMm: PADDING_X_MM, topMm: HEADER_H_MM, wMm: CONTENT_W_MM,             hMm: BODY_H_MM }
  ];


  // ═════════════════════════════════════════════════════════
  //  DIALOG
  // ═════════════════════════════════════════════════════════

  var dlg = new Window("dialog", "Everstory template_cutout 기준선 생성");
  dlg.orientation = "column";
  dlg.alignChildren = "fill";
  dlg.margins = 20;
  dlg.spacing = 10;

  var info = dlg.add("statictext", undefined,
    "info 레이어와 5개 기준 PathItem 을 생성합니다.\n" +
    "border / reg_border / header / header_border / body", { multiline: true });
  info.alignment = "left";

  var docPanel = dlg.add("panel", undefined, "대상 문서");
  docPanel.orientation = "column";
  docPanel.alignChildren = "left";
  docPanel.margins = [15, 18, 15, 12];
  docPanel.spacing = 6;

  var rNew = docPanel.add("radiobutton", undefined, "새 A5 세로 문서 생성 (148×210mm, CMYK)");
  var rCur = docPanel.add("radiobutton", undefined, "현재 활성 문서 사용 (A5 세로 권장)");
  rNew.value = true;

  var emptyPanel = dlg.add("panel", undefined, "추가 레이어");
  emptyPanel.orientation = "column";
  emptyPanel.alignChildren = "left";
  emptyPanel.margins = [15, 18, 15, 12];
  emptyPanel.spacing = 6;

  var cbPrint = emptyPanel.add("checkbox", undefined, "PrintData 빈 레이어 생성/유지");
  var cbKiss  = emptyPanel.add("checkbox", undefined, "KissCut 빈 레이어 생성/유지");
  cbPrint.value = true;
  cbKiss.value = true;

  var btnGroup = dlg.add("group");
  btnGroup.alignment = "right";
  btnGroup.spacing = 10;
  btnGroup.add("button", undefined, "취소", { name: "cancel" });
  var okBtn = btnGroup.add("button", undefined, "생성", { name: "ok" });
  okBtn.active = true;

  if (dlg.show() !== 1) return;


  // ═════════════════════════════════════════════════════════
  //  DOC RESOLUTION
  // ═════════════════════════════════════════════════════════

  var doc;
  if (rNew.value) {
    doc = _createA5Doc();
  } else {
    if (app.documents.length === 0) {
      alert("열린 문서가 없습니다. 먼저 문서를 열거나 '새 A5 세로 문서 생성' 을 선택하세요.");
      return;
    }
    doc = app.activeDocument;
    var abIdx = doc.artboards.getActiveArtboardIndex();
    var abRect = doc.artboards[abIdx].artboardRect;
    var abW = (abRect[2] - abRect[0]) / MM_TO_PT;
    var abH = (abRect[1] - abRect[3]) / MM_TO_PT;
    if (Math.abs(abW - A5_W_MM) > 1 || Math.abs(abH - A5_H_MM) > 1) {
      var ans = confirm(
        "활성 artboard 가 A5 세로 (148×210mm) 가 아닙니다.\n" +
        "현재: " + _formatMm(abW) + " × " + _formatMm(abH) + " mm\n\n" +
        "그래도 좌상단 (0,0) 기준으로 5 PathItem 을 생성할까요?"
      );
      if (!ans) return;
    }
  }

  // active artboard 좌상단을 origin 으로
  var activeIdx = doc.artboards.getActiveArtboardIndex();
  var ab = doc.artboards[activeIdx].artboardRect; // [left, top, right, bottom] in pt, top > bottom
  var originLeft = ab[0];
  var originTop = ab[1];


  // ═════════════════════════════════════════════════════════
  //  LAYER + PATH BUILD
  // ═════════════════════════════════════════════════════════

  // 새 문서이고 디폴트 "Layer 1" 한 개라면 PrintData 로 rename (z-order bottom)
  if (rNew.value && doc.layers.length === 1 && doc.layers[0].name === "Layer 1") {
    doc.layers[0].name = cbPrint.value ? "PrintData" : "Layer 1";
  }

  if (cbPrint.value) _ensureLayer(doc, "PrintData");
  var infoLayer = _ensureLayer(doc, "info");
  if (cbKiss.value) _ensureLayer(doc, "KissCut");

  // info 레이어 안 같은 이름 PathItem 제거 (재실행 안전성)
  for (var i = 0; i < PATHS.length; i++) {
    _removeNamedItem(infoLayer, PATHS[i].name);
  }

  var created = [];
  for (var k = 0; k < PATHS.length; k++) {
    var p = PATHS[k];
    var item = infoLayer.pathItems.rectangle(
      originTop - _pt(p.topMm),
      originLeft + _pt(p.leftMm),
      _pt(p.wMm),
      _pt(p.hMm)
    );
    item.name = p.name;
    item.filled = false;
    item.stroked = false;
    created.push(p.name + "  (X=" + _formatMm(p.leftMm) + ", Y=" + _formatMm(p.topMm) +
                 ", W=" + _formatMm(p.wMm) + ", H=" + _formatMm(p.hMm) + ")");
  }


  // ═════════════════════════════════════════════════════════
  //  SUMMARY
  // ═════════════════════════════════════════════════════════

  var msg =
    "✓ info 레이어 기준선 생성 완료\n\n" +
    "생성된 PathItem (5):\n  • " + created.join("\n  • ") + "\n\n" +
    "비율 출처: assets/illustrator_template_{1,2}.png\n" +
    "  헤더 12.5% (26.3mm) / 본문 77.3% (162.3mm) / 푸터 10.2% (21.4mm)\n" +
    "  좌우 padding 3.8% (5.6mm)\n\n" +
    "다음 단계:\n" +
    "1. brand 레이어 추가 → 헤더 로고 (assets/online_logo.png) + divider 가로선 + 푸터 정적 디자인\n" +
    "2. File > Save As Template → templates/template_cutout_white.ait\n" +
    "3. 배경색만 바꿔 template_cutout_beige.ait 추가 저장";
  alert(msg);


  // ═════════════════════════════════════════════════════════
  //  HELPERS
  // ═════════════════════════════════════════════════════════

  function _createA5Doc() {
    var d = app.documents.add(DocumentColorSpace.CMYK, _pt(A5_W_MM), _pt(A5_H_MM));
    try { d.rulerUnits = RulerUnits.Millimeters; } catch (e) {}
    return d;
  }

  function _ensureLayer(doc, name) {
    for (var i = 0; i < doc.layers.length; i++) {
      if (doc.layers[i].name === name) return doc.layers[i];
    }
    var layer = doc.layers.add();
    layer.name = name;
    return layer;
  }

  function _removeNamedItem(container, name) {
    if (container.pathItems) {
      for (var i = container.pathItems.length - 1; i >= 0; i--) {
        if (container.pathItems[i].name === name) {
          try { container.pathItems[i].remove(); } catch (e1) {}
        }
      }
    }
    if (container.compoundPathItems) {
      for (var j = container.compoundPathItems.length - 1; j >= 0; j--) {
        if (container.compoundPathItems[j].name === name) {
          try { container.compoundPathItems[j].remove(); } catch (e2) {}
        }
      }
    }
  }

  function _pt(mm) {
    return mm * MM_TO_PT;
  }

  function _formatMm(mm) {
    return (Math.round(mm * 10) / 10).toString();
  }
})();
