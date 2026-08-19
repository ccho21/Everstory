const { entrypoints } = require("uxp");
const { app, core, action, constants } = require("photoshop");
const { executeAsModal } = core;

// Everstory Photoshop Actions가 이름으로 레이어를 선택한다.
// F3(CircleAfterColor): Layer 0 + Ellipse 1 병합 → F1(PSOperations): Layer 0 처리.
const SUBJECT_LAYER_NAME = "Layer 0";
const LOOSE_BACKGROUND_LAYER_NAME = "Ellipse 1";
const ORIGINAL_LAYER_NAME = "ORIGINAL";
const LEGACY_LOOSE_BACKGROUND_LAYER_NAME = "LOOSE BACKGROUND";
const LOOSE_DEFAULTS = Object.freeze({
  topMarginFactor: 1.2,
  bottomMarginFactor: 3.2,
  finishSmoothRadiusRatio: 0.015,
  pathTolerance: 4.0,
  defaultColor: Object.freeze({ red: 219, green: 139, blue: 122 })
});

let uiBound = false;

entrypoints.setup({
  panels: {
    looseBackground: {
      show() {
        bindUI();
      }
    }
  }
});

document.addEventListener("DOMContentLoaded", bindUI);

function bindUI() {
  if (uiBound) return;

  const looseButton = document.getElementById("loose-background-btn");
  if (!looseButton) return;

  looseButton.addEventListener("click", runLooseBackground);
  uiBound = true;
}

async function runLooseBackground() {
  setStatus("Loose Background 생성 중...", "info");
  setControlsDisabled(true);

  try {
    const doc = app.activeDocument;
    if (!doc) throw new Error("Photoshop 문서를 먼저 열어주세요.");
    if (!doc.activeLayers || doc.activeLayers.length !== 1) {
      throw new Error("직접 누끼 딴 레이어 하나를 선택해주세요.");
    }

    const subject = doc.activeLayers[0];
    const config = readLooseConfig();

    let resultSummary = null;
    await executeAsModal(async (executionContext) => {
      const history = await executionContext.hostControl.suspendHistory({
        documentID: doc.id,
        name: "Create Loose Photo Background"
      });

      try {
        resultSummary = await createLoosePhotoBackground(doc, subject, config);
        await executionContext.hostControl.resumeHistory(history, true);
      } catch (error) {
        try {
          await executionContext.hostControl.resumeHistory(history, false);
        } catch (rollbackError) {
          console.error("Loose Background rollback failed", rollbackError);
        }
        throw error;
      }
    }, { commandName: "Create Loose Photo Background" });

    setStatus(
      `완료: F3 → F1 준비\n` +
      `${SUBJECT_LAYER_NAME} + ${LOOSE_BACKGROUND_LAYER_NAME}\n` +
      `${formatCanvasResize(resultSummary && resultSummary.canvasResize)}\n` +
      `${resultSummary && resultSummary.removedOriginalCount > 0 ? `ORIGINAL ${resultSummary.removedOriginalCount}개 삭제` : "ORIGINAL 없음"}\n` +
      `균일 여백 ${formatPercent(config.marginRatio)} · ` +
      `틈 메우기 ${formatPercent(config.closeRadiusRatio)} · ` +
      `스무딩 ${formatPercent(config.smoothRadiusRatio)}\n` +
      `${LOOSE_BACKGROUND_LAYER_NAME} 색상 레이어가 선택되었습니다.`,
      "ok"
    );
  } catch (error) {
    setStatus(`오류: ${error.message || error}`, "err");
    console.error(error);
  } finally {
    setControlsDisabled(false);
  }
}

async function createLoosePhotoBackground(doc, subject, config) {
  ensureActionLayerNamesAvailable(doc, subject);

  // 수동 누끼가 Layer Mask 기반이면 마스크 채널을 우선 사용한다. Layer 객체를
  // selection.load()에 직접 넘기면 마스크 아래의 불투명 원본 픽셀 전체가 선택될 수 있다.
  await loadSubjectShapeSelection(doc, subject);
  assertSelection(doc, "선택한 누끼 레이어가 완전히 투명합니다.");

  const initialBounds = copyBounds(doc.selection.bounds);
  const subjectBasisPx = Math.min(
    initialBounds.right - initialBounds.left,
    initialBounds.bottom - initialBounds.top
  );
  const closePx = ratioToPixels(config.closeRadiusRatio, subjectBasisPx);
  const smoothPx = ratioToPixels(config.smoothRadiusRatio, subjectBasisPx);
  const marginPx = ratioToPixels(config.marginRatio, subjectBasisPx);
  const finishSmoothPx = ratioToPixels(LOOSE_DEFAULTS.finishSmoothRadiusRatio, subjectBasisPx);
  // 위/아래 받침은 균일 여백에 비례한다. 여백이 0이면 받침도 0 — 모든 입력이
  // 0일 때 결과가 누끼 실루엣과 정확히 일치해야 한다.
  const topPx = Math.round(marginPx * LOOSE_DEFAULTS.topMarginFactor);
  const bottomPx = Math.round(marginPx * LOOSE_DEFAULTS.bottomMarginFactor);

  // A Photoshop selection is clipped at the current canvas edge. Reserve all
  // space needed by closing, smoothing, vertical extension and final padding
  // before running those operations, then reload the shifted SUBJECT mask.
  const canvasResize = config.autoResizeCanvas
    ? await ensureCanvasFitsLooseBackground(doc, initialBounds, {
      left: Math.max(closePx, smoothPx, marginPx + finishSmoothPx),
      right: Math.max(closePx, smoothPx, marginPx + finishSmoothPx),
      top: Math.max(closePx, smoothPx, topPx + marginPx + finishSmoothPx),
      bottom: Math.max(closePx, smoothPx, bottomPx + marginPx + finishSmoothPx)
    })
    : createUnchangedCanvasResize(doc);

  if (canvasResize.resized) {
    await loadSubjectShapeSelection(doc, subject);
    assertSelection(doc, "Canvas resize completed, but the SUBJECT mask could not be reloaded.");
  }

  // Expand → Contract로 좁은 투명 틈과 작은 오목 영역을 닫는다.
  if (closePx > 0) {
    await expandSelectionBy(doc, closePx);
    await contractSelectionBy(doc, closePx);
    assertSelection(doc, "틈 메우기 처리 후 선택 영역이 사라졌습니다. 값을 줄여주세요.");
  }

  // 여백을 주기 전에 실루엣을 강하게 뭉갠다. expand 전에 스무딩하므로
  // 손가락·잔털 디테일이 사라져도 이후의 균일 여백은 깎이지 않는다.
  if (smoothPx > 0) {
    await doc.selection.smooth(Math.min(500, smoothPx), true);
    assertSelection(doc, "스무딩 후 선택 영역이 사라졌습니다. 값을 줄여주세요.");
  }

  if (closePx > 0 || smoothPx > 0) {
    await simplifySelectionThroughWorkPath(doc, LOOSE_DEFAULTS.pathTolerance);
  }

  // 위/아래 받침은 세로 스케일이 아니라 이동-합집합(extrusion)으로 만든다.
  // 스케일은 실루엣 전체를 늘려 옆면까지 왜곡시키므로 사용하지 않는다.
  await extendSelectionVertically(doc, topPx, bottomPx);

  // 균일 여백 expand를 마지막 기하 연산으로 둬서 모든 방향 최소 여백을 보장한다.
  if (marginPx > 0) {
    await expandSelectionBy(doc, marginPx);

    // expand·받침이 남기는 각짐만 가볍게 정리한다. 반경이 작아 여백을 의미 있게 깎지 않는다.
    if (finishSmoothPx > 0) {
      await doc.selection.smooth(Math.min(500, finishSmoothPx), true);
      assertSelection(doc, "마무리 스무딩 후 선택 영역이 사라졌습니다.");
    }

    await simplifySelectionThroughWorkPath(doc, LOOSE_DEFAULTS.pathTolerance);
  }

  assertSelection(doc, "Loose shape 생성 후 선택 영역이 비었습니다. 설정값을 줄여주세요.");

  const looseLayer = await createSolidColorFillFromSelection(doc, LOOSE_DEFAULTS.defaultColor);

  // F3가 이름으로 두 레이어를 선택하므로 동일 레벨에 Layer 0 / Ellipse 1만 둔다.
  looseLayer.move(subject, constants.ElementPlacement.PLACEAFTER);
  subject.name = SUBJECT_LAYER_NAME;

  // 수동 누끼를 위해 남겨둔 원본 백업은 이후 F3/F1 체인에 필요하지 않다.
  // 정확히 ORIGINAL이라는 이름만 삭제하며, 현재 결과 레이어는 항상 보호한다.
  const removedOriginalCount = deleteLayersByName(
    doc.layers,
    ORIGINAL_LAYER_NAME,
    new Set([subject.id, looseLayer.id])
  );

  await doc.selection.deselect();
  await selectLayerById(looseLayer.id);
  await showSolidColorPicker(LOOSE_DEFAULTS.defaultColor);
  await selectLayerById(looseLayer.id);
  return { removedOriginalCount, canvasResize };
}

function readLooseConfig() {
  const config = {
    marginRatio: readPercentInput("margin-percent", "균일 여백") / 100,
    closeRadiusRatio: readPercentInput("close-radius-percent", "좁은 틈 메우기") / 100,
    smoothRadiusRatio: readPercentInput("smooth-radius-percent", "외곽 스무딩") / 100
  };
  const autoResizeControl = document.getElementById("auto-resize-canvas");
  config.autoResizeCanvas = autoResizeControl ? Boolean(autoResizeControl.checked) : true;
  return config;
}

function readPercentInput(id, label) {
  const input = document.getElementById(id);
  const value = Number(input && input.value);
  if (!Number.isFinite(value) || value < 0 || value > 50) {
    throw new Error(`${label} 값은 0~50% 숫자로 입력해주세요.`);
  }
  return value;
}

function formatPercent(ratio) {
  return `${Math.round(ratio * 1000) / 10}%`;
}

function formatCanvasResize(canvasResize) {
  if (!canvasResize || !canvasResize.resized) {
    return "\uCE94\uBC84\uC2A4 \uD06C\uAE30 \uBCC0\uACBD \uC5C6\uC74C";
  }
  return `\uCE94\uBC84\uC2A4 ${canvasResize.originalWidth}×${canvasResize.originalHeight} → ` +
    `${canvasResize.newWidth}×${canvasResize.newHeight}px`;
}

function ratioToPixels(ratio, basisPx) {
  return Math.max(0, Math.round(ratio * basisPx));
}

function copyBounds(bounds) {
  return {
    top: Number(bounds.top),
    left: Number(bounds.left),
    bottom: Number(bounds.bottom),
    right: Number(bounds.right)
  };
}

function createUnchangedCanvasResize(doc) {
  const width = Math.ceil(Number(doc.width));
  const height = Math.ceil(Number(doc.height));
  return {
    resized: false,
    growX: 0,
    growY: 0,
    originalWidth: width,
    originalHeight: height,
    newWidth: width,
    newHeight: height
  };
}

function calculateCanvasResize(doc, bounds, padding) {
  const originalWidth = Math.ceil(Number(doc.width));
  const originalHeight = Math.ceil(Number(doc.height));
  const hasPadding = Object.values(padding).some((value) => Number(value) > 0);
  const safetyPx = hasPadding ? 2 : 0;
  const leftOverflow = Math.max(0, Math.ceil(Number(padding.left) + safetyPx - bounds.left));
  const rightOverflow = Math.max(
    0,
    Math.ceil(bounds.right + Number(padding.right) + safetyPx - originalWidth)
  );
  const topOverflow = Math.max(0, Math.ceil(Number(padding.top) + safetyPx - bounds.top));
  const bottomOverflow = Math.max(
    0,
    Math.ceil(bounds.bottom + Number(padding.bottom) + safetyPx - originalHeight)
  );
  const growX = Math.max(leftOverflow, rightOverflow);
  const growY = Math.max(topOverflow, bottomOverflow);

  return {
    resized: growX > 0 || growY > 0,
    growX,
    growY,
    originalWidth,
    originalHeight,
    newWidth: originalWidth + growX * 2,
    newHeight: originalHeight + growY * 2
  };
}

async function ensureCanvasFitsLooseBackground(doc, bounds, padding) {
  const resize = calculateCanvasResize(doc, bounds, padding);
  if (!resize.resized) return resize;

  // Symmetric growth keeps all existing layers and masks centered together.
  await doc.resizeCanvas(
    resize.newWidth,
    resize.newHeight,
    constants.AnchorPosition.MIDDLECENTER
  );
  return resize;
}

async function expandSelectionBy(doc, pixels) {
  let remaining = Math.max(0, Math.round(pixels));
  while (remaining > 0) {
    const step = Math.min(500, remaining);
    await doc.selection.expand(step, true);
    remaining -= step;
  }
}

async function contractSelectionBy(doc, pixels) {
  let remaining = Math.max(0, Math.round(pixels));
  // contract로 선택 영역이 완전히 사라지면 이후 contract 호출이 에러를 던지므로
  // 중간에 멈춘다. 호출부는 bounds 확인 또는 assertSelection으로 후처리한다.
  while (remaining > 0 && doc.selection.bounds) {
    const step = Math.min(500, remaining);
    await doc.selection.contract(step, true);
    remaining -= step;
  }
}

async function simplifySelectionThroughWorkPath(doc, tolerance) {
  const existingWorkPath = Array.from(doc.pathItems).find(
    (path) => path.kind === constants.PathKind.WORKPATH
  );
  if (existingWorkPath) {
    throw new Error("저장되지 않은 Work Path가 있습니다. 저장하거나 이름을 바꾼 뒤 다시 실행해주세요.");
  }

  const workPath = await doc.selection.makeWorkPath(tolerance);
  try {
    await workPath.makeSelection(0, true, constants.SelectionType.REPLACE);
  } finally {
    await workPath.remove();
  }
  assertSelection(doc, "Work Path로 외곽을 정리하는 중 선택 영역이 사라졌습니다.");
}

async function extendSelectionVertically(doc, topPx, bottomPx) {
  if (topPx <= 0 && bottomPx <= 0) return;

  const token = `${Date.now()}_${Math.round(Math.random() * 100000)}`;
  const baseName = `__EVERSTORY_VBASE_${token}`;
  const resultName = `__EVERSTORY_VEXTEND_${token}`;
  let baseChannel = null;
  let resultChannel = null;

  try {
    await doc.selection.save(baseName);
    baseChannel = doc.channels.getByName(baseName);
    await doc.selection.save(resultName);
    resultChannel = doc.channels.getByName(resultName);

    if (topPx > 0) {
      await doc.selection.translateBoundary(0, -topPx);
      await doc.selection.saveTo(resultChannel, constants.SelectionType.EXTEND);
    }

    if (bottomPx > 0) {
      // 위로 이동하며 캔버스에 잘린 조각이 누적되지 않도록 base를 다시 로드한다.
      await doc.selection.load(baseChannel, constants.SelectionType.REPLACE, false);
      await doc.selection.translateBoundary(0, bottomPx);
      await doc.selection.saveTo(resultChannel, constants.SelectionType.EXTEND);
    }

    await doc.selection.load(resultChannel, constants.SelectionType.REPLACE, false);
    assertSelection(doc, "위/아래 받침 확장 결과가 비었습니다.");
  } finally {
    if (resultChannel) await resultChannel.remove();
    if (baseChannel) await baseChannel.remove();
  }
}

async function createSolidColorFillFromSelection(doc, color) {
  const result = await action.batchPlay([{
    _obj: "make",
    _target: [{ _ref: "contentLayer" }],
    using: {
      _obj: "contentLayer",
      type: {
        _obj: "solidColorLayer",
        color: {
          _obj: "RGBColor",
          red: color.red,
          grain: color.green,
          blue: color.blue
        }
      }
    },
    _options: { dialogOptions: "dontDisplay" }
  }], {});
  throwOnBatchPlayError(result, "Solid Color Fill Layer를 만들지 못했습니다.");

  const looseLayer = doc.activeLayers && doc.activeLayers[0];
  if (!looseLayer) throw new Error("새 Solid Color Fill Layer를 찾지 못했습니다.");
  looseLayer.name = LOOSE_BACKGROUND_LAYER_NAME;
  looseLayer.visible = true;

  if (!(await layerHasUserMask(looseLayer.id))) {
    await selectLayerById(looseLayer.id);
    await createRevealSelectionMask();
  }
  return looseLayer;
}

async function showSolidColorPicker(color) {
  const result = await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "contentLayer", _enum: "ordinal", _value: "targetEnum" }],
    to: {
      _obj: "solidColorLayer",
      color: {
        _obj: "RGBColor",
        red: color.red,
        grain: color.green,
        blue: color.blue
      }
    },
    _options: { dialogOptions: "display" }
  }], {});
  throwOnBatchPlayError(result, "배경색 선택 창을 열지 못했습니다.");
}

function findLayerByName(layers, wantedName, excludedId) {
  const normalized = wantedName.toUpperCase();
  for (const layer of layers) {
    if (layer.id !== excludedId && layer.name.toUpperCase() === normalized) return layer;
    if (layer.layers && layer.layers.length > 0) {
      const nested = findLayerByName(layer.layers, wantedName, excludedId);
      if (nested) return nested;
    }
  }
  return null;
}

function ensureActionLayerNamesAvailable(doc, subject) {
  const conflicts = [SUBJECT_LAYER_NAME, LOOSE_BACKGROUND_LAYER_NAME, LEGACY_LOOSE_BACKGROUND_LAYER_NAME];
  for (const name of conflicts) {
    const existing = findLayerByName(doc.layers, name, subject.id);
    if (existing) {
      throw new Error(`기존 ${name} 레이어가 있습니다. 먼저 Undo하거나 기존 결과를 정리해주세요.`);
    }
  }

  if (subject.parent) {
    throw new Error("선택한 누끼 레이어가 그룹 안에 있습니다. 그룹 밖으로 꺼낸 뒤 다시 실행해주세요.");
  }
}

function deleteLayersByName(layers, wantedName, protectedIds) {
  const normalized = wantedName.toUpperCase();
  const targets = [];

  function containsProtectedLayer(layer) {
    if (protectedIds.has(layer.id)) return true;
    if (!layer.layers || layer.layers.length === 0) return false;
    for (const child of layer.layers) {
      if (containsProtectedLayer(child)) return true;
    }
    return false;
  }

  function collect(collection) {
    for (const layer of collection) {
      if (layer.name.toUpperCase() === normalized && !containsProtectedLayer(layer)) {
        targets.push(layer);
        continue;
      }
      if (layer.layers && layer.layers.length > 0) collect(layer.layers);
    }
  }

  collect(layers);
  for (const layer of targets) layer.delete();
  return targets.length;
}

function assertSelection(doc, message) {
  if (!doc.selection.bounds) throw new Error(message);
}

async function loadSubjectShapeSelection(doc, subject) {
  if (await layerHasUserMask(subject.id)) {
    await selectLayerById(subject.id);
    const result = await action.batchPlay([{
      _obj: "set",
      _target: [{ _ref: "channel", _property: "selection" }],
      to: { _ref: "channel", _enum: "channel", _value: "mask" },
      _options: { dialogOptions: "dontDisplay" }
    }], {});
    throwOnBatchPlayError(result, "SUBJECT의 Layer Mask를 선택 영역으로 불러오지 못했습니다.");
    return;
  }

  await doc.selection.load(subject, constants.SelectionType.REPLACE, false);
}

async function layerHasUserMask(layerId) {
  const result = await action.batchPlay([{
    _obj: "get",
    _target: [
      { _property: "hasUserMask" },
      { _ref: "layer", _id: layerId }
    ],
    _options: { dialogOptions: "dontDisplay" }
  }], {});
  throwOnBatchPlayError(result, "SUBJECT의 Layer Mask 상태를 확인하지 못했습니다.");
  return Boolean(result && result[0] && result[0].hasUserMask);
}

async function selectLayerById(layerId) {
  const result = await action.batchPlay([{
    _obj: "select",
    _target: [{ _ref: "layer", _id: layerId }],
    makeVisible: false,
    layerID: [layerId],
    _options: { dialogOptions: "dontDisplay" }
  }], {});
  throwOnBatchPlayError(result, "Ellipse 1 레이어 선택에 실패했습니다.");
}

async function createRevealSelectionMask() {
  // UXP DOM에 레이어 마스크 생성 메서드가 없어 이 한 단계만 batchPlay를 사용한다.
  const result = await action.batchPlay([{
    _obj: "make",
    new: { _class: "channel" },
    at: { _ref: "channel", _enum: "channel", _value: "mask" },
    using: { _enum: "userMaskEnabled", _value: "revealSelection" },
    _options: { dialogOptions: "dontDisplay" }
  }], {});
  throwOnBatchPlayError(result, "선택 영역으로 Layer Mask를 만들지 못했습니다.");
}

function throwOnBatchPlayError(result, fallbackMessage) {
  const first = result && result[0];
  if (first && first._obj === "error") throw new Error(first.message || fallbackMessage);
}

function setControlsDisabled(disabled) {
  const controls = document.querySelectorAll(
    "#loose-background-btn, .number-field sp-textfield, #auto-resize-canvas"
  );
  controls.forEach((control) => { control.disabled = disabled; });
}

function setStatus(msg, kind) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = `status ${kind || ""}`;
}
