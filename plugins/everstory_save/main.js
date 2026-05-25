const { entrypoints } = require("uxp");
const fs = require("uxp").storage.localFileSystem;
const { app, core } = require("photoshop");
const { executeAsModal } = core;

const TARGET_LONGEST_PX = 1800;
const SIL_LAYER_INDEX = 0;     // 맨 위 = 실루엣. 그 아래 모든 레이어(보정 포함) = 누끼.

entrypoints.setup({
  panels: {
    save: {
      show(node) {
        // DOM 이벤트는 top-level에서 등록
      }
    }
  }
});

const tierButtons = document.querySelectorAll(".tier-btn");
tierButtons.forEach((btn) => {
  btn.addEventListener("click", () => runNukki(btn.dataset.tier));
});

async function runNukki(tier) {
  setStatus(`${tier} 처리 중...`, "info");
  tierButtons.forEach((b) => { b.disabled = true; });

  try {
    if (!app.activeDocument) {
      setStatus("이미지를 먼저 열어주세요.", "err");
      return;
    }

    const origDoc = app.activeDocument;
    const docPath = origDoc.path;
    if (!docPath) {
      setStatus("저장된 파일이 아닙니다.\n디스크에서 PSD를 열어주세요.", "err");
      return;
    }

    if (origDoc.layers.length < 2) {
      setStatus("PSD에 최소 두 개의 레이어가 필요합니다.\n맨 위: 실루엣 / 그 아래: 누끼(+보정 레이어)", "err");
      return;
    }

    const parsed = parsePath(docPath);

    // 1) 출력 폴더 entry 결정 (01_original → 02_cutout 라우팅)
    let outEntry;
    if (parsed.parentName === "01_original") {
      const grandparentEntry = await pathToEntry(parsed.grandparentDir);
      outEntry = await ensureFolder(grandparentEntry, "02_cutout");
    } else {
      outEntry = await pathToEntry(parsed.parentDir);
    }

    // 2) 파일명 결정 — {customerFolder}_{NN}_{TIER} 패턴.
    //    01_original 라우팅이거나 02_cutout 직접 저장이면 grandparentName = 고객 폴더.
    //    그 외 case (Desktop 등) 면 raw 원본 이름 + tier (안전 fallback).
    const isProjectRouted = (parsed.parentName === "01_original" || parsed.parentName === "02_cutout");
    let baseName;
    if (isProjectRouted && parsed.grandparentName) {
      const folderName = parsed.grandparentName;
      const nextIdx = await nextSequenceNumber(outEntry, folderName);
      baseName = `${folderName}_${pad2(nextIdx)}_${tier}`;
    } else {
      const raw = origDoc.name.replace(/\.[^.]+$/, "");
      baseName = `${raw}_${tier}`;
    }

    // 3) 파일 entry 미리 생성. 새 번호라 overwrite 는 의미 없지만 안전상 유지.
    const cleanFile = await outEntry.createFile(`${baseName}_clean.psd`, { overwrite: true });
    const silFile = await outEntry.createFile(`${baseName}_sil.png`, { overwrite: true });

    // 3) 모달 컨텍스트에서 PS 작업
    //    saveAs.psd / saveAs.png는 옵션 생략 가능 — PS Preferences 따름
    //    (File Handling > Maximize PSD and PSB File Compatibility)
    await executeAsModal(async () => {
      const dupDoc = await origDoc.duplicate();
      await resizeIfLarger(dupDoc, TARGET_LONGEST_PX);

      // 누끼만 보이게 → clean.psd (실루엣 끄고 나머지 모두 켜기 — 보정 레이어 포함)
      setSilOnly(dupDoc, false);
      await dupDoc.saveAs.psd(cleanFile);

      // 실루엣만 보이게 → sil.png (실루엣만 켜고 나머지 모두 끄기)
      setSilOnly(dupDoc, true);
      await dupDoc.saveAs.png(silFile);

      await dupDoc.closeWithoutSaving();
    }, { commandName: "Everstory Nukki" });

    setStatus(`완료\nclean: ${cleanFile.nativePath}\nsil:   ${silFile.nativePath}`, "ok");

  } catch (e) {
    setStatus(`오류: ${e.message || e}`, "err");
    console.error(e);
  } finally {
    tierButtons.forEach((b) => { b.disabled = false; });
  }
}

function setStatus(msg, kind) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = `status ${kind || ""}`;
}

// ─── Helpers ──────────────────────────────────────────────

function parsePath(absPath) {
  const sep = absPath.includes("\\") ? "\\" : "/";
  const lastSep = absPath.lastIndexOf(sep);
  const parentDir = absPath.substring(0, lastSep);
  const parentLastSep = parentDir.lastIndexOf(sep);
  const parentName = parentDir.substring(parentLastSep + 1);
  const grandparentDir = parentDir.substring(0, parentLastSep);
  const grandparentLastSep = grandparentDir.lastIndexOf(sep);
  const grandparentName = grandparentDir.substring(grandparentLastSep + 1);
  return { parentDir, parentName, grandparentDir, grandparentName };
}

async function nextSequenceNumber(folderEntry, prefix) {
  // folderEntry 안의 `{prefix}_NN[_TIER]_clean.psd` 들 중 최대 번호 + 1 반환.
  // tier (XS|S|M|L|FAM) 는 옵션 — tier 무관하게 NN 공유 카운트, 레거시 무-tier 파일과도 호환.
  const re = new RegExp("^" + escapeRegex(prefix) + "_([0-9]+)(?:_(?:XS|S|M|L|FAM))?_clean\\.psd$", "i");
  let maxN = 0;
  try {
    const entries = await folderEntry.getEntries();
    for (const e of entries) {
      if (!e.isFile) continue;
      const m = e.name.match(re);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxN) maxN = n;
      }
    }
  } catch (e) {
    // getEntries 실패 시 1부터 시작
  }
  return maxN + 1;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

async function pathToEntry(absPath) {
  // file: URL로 entry 획득. 매니페스트의 localFileSystem: fullAccess 필요.
  try {
    return await fs.getEntryWithUrl(`file:${absPath}`);
  } catch (e) {
    return await fs.getEntryWithUrl(`file://${absPath}`);
  }
}

async function ensureFolder(parentEntry, name) {
  try {
    return await parentEntry.getEntry(name);
  } catch (e) {
    return await parentEntry.createFolder(name);
  }
}

function setSilOnly(doc, silOnly) {
  // silOnly=true: 실루엣 레이어(layers[0])만 보이고 나머지 모두 숨김
  // silOnly=false: 실루엣만 숨기고 나머지 모두(보정 레이어 포함) 보임
  doc.layers[SIL_LAYER_INDEX].visible = silOnly;
  for (let i = 1; i < doc.layers.length; i++) {
    doc.layers[i].visible = !silOnly;
  }
}

async function resizeIfLarger(doc, targetPx) {
  const w = doc.width;
  const h = doc.height;
  const longest = Math.max(w, h);
  if (longest <= targetPx) return;
  const scale = targetPx / longest;
  await doc.resizeImage(Math.round(w * scale), Math.round(h * scale));
}
