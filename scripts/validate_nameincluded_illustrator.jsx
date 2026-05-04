(function () {
  "use strict";

  var ROOT = "/Users/heatherchung/Desktop/포토샵누끼";
  var TARGET_SCRIPT = ROOT + "/Everstory_NameIncludedSheet.jsx";
  var INPUT_FOLDER = ROOT + "/projects/로운/02_cutout";
  var REPORT_FILE = "/private/tmp/everstory_nameincluded_validation.txt";

  var started = new Date();
  var beforeCount = app.documents.length;
  var alerts = [];
  var originalAlert = $.global.alert;
  var status = "OK";
  var errorText = "";

  $.global.alert = function (msg) {
    alerts.push(String(msg));
  };

  $.global.__EVERSTORY_NAME_INCLUDED_TEST__ = {
    inputFolder: INPUT_FOLDER,
    closeAfter: true,
    options: {
      nameText: "Validation",
      material: "White",
      orderNumber: "AI-VALIDATION",
      orderDate: "2026-05-01",
      sizeMm: 30,
      cutMarginMm: 1
    }
  };

  try {
    $.evalFile(new File(TARGET_SCRIPT));
    if ($.global.__EVERSTORY_NAME_INCLUDED_TEST__ &&
        $.global.__EVERSTORY_NAME_INCLUDED_TEST__.lastMessage) {
      alerts.push($.global.__EVERSTORY_NAME_INCLUDED_TEST__.lastMessage);
    }
  } catch (e) {
    status = "ERROR";
    errorText = String(e);
    try {
      if (e && e.line) errorText += " @ line " + e.line;
    } catch (eLine) {}
  }

  try {
    while (app.documents.length > beforeCount) {
      app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    }
  } catch (eClose) {
    alerts.push("cleanup close failed: " + eClose);
  }

  $.global.__EVERSTORY_NAME_INCLUDED_TEST__ = null;
  $.global.alert = originalAlert;

  var finished = new Date();
  var lines = [];
  lines.push("status=" + status);
  lines.push("started=" + _dateIso(started));
  lines.push("finished=" + _dateIso(finished));
  lines.push("durationMs=" + (finished.getTime() - started.getTime()));
  lines.push("inputFolder=" + INPUT_FOLDER);
  lines.push("targetScript=" + TARGET_SCRIPT);
  lines.push("documentsBefore=" + beforeCount);
  lines.push("documentsAfter=" + app.documents.length);
  if (errorText) lines.push("error=" + errorText);
  lines.push("alerts=" + alerts.length);
  for (var i = 0; i < alerts.length; i++) {
    lines.push("--- alert " + (i + 1) + " ---");
    lines.push(alerts[i]);
  }

  var report = new File(REPORT_FILE);
  report.encoding = "UTF-8";
  report.open("w");
  report.write(lines.join("\n"));
  report.close();

  function _dateIso(d) {
    return d.getFullYear() + "-" +
      _pad2(d.getMonth() + 1) + "-" +
      _pad2(d.getDate()) + "T" +
      _pad2(d.getHours()) + ":" +
      _pad2(d.getMinutes()) + ":" +
      _pad2(d.getSeconds());
  }

  function _pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }
})();
