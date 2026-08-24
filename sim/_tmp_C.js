var ORPHAN_FILL_MIN_WIDTH=0.75;
var ORPHAN_ROW_MIN_W=0.6;
// AUTO-GENERATED from ../Everstory_mixed.jsx — 편집 금지, extract.js 재실행할 것

  var MM_TO_PT = 2.834645;
  var BODY_PADDING_MM = 2;
  var GAP_DEFAULT_MM = 2.5;
  var BAND_CELL_TOL = 0.85;
  var TIER_SIZE_MM = { XS: 19.05, S: 25.4, M: 31.75, L: 38.1, XL: 50.8, XXL: 63.5 };
  var TIER_DEFAULT = "S";
  var PKG_COUNT_BY_TIER = {
    XXL: { min: 1, max: 1 },
    XL:  { min: 1, max: 2 },
    L:   { min: 2, max: 3 },
    M:   { min: 2, max: 4 },
    S:   { min: 2, max: 6 },
    XS:  { min: 1, max: 8 }
  };
  var BUCKETS = ["BIG", "MED", "SML"];
  var BUCKET_TIERS = { BIG: ["XXL", "XL"], MED: ["L", "M"], SML: ["S", "XS"] };
  var TIER_TO_BUCKET = { XXL: "BIG", XL: "BIG", L: "MED", M: "MED", S: "SML", XS: "SML" };
  var PACKAGE_LADDERS = [
    { key: "A", BIG: ["XXL", "XL"], MED: ["L", "M"],      SML: ["S", "XS"] },
    { key: "B", BIG: ["XXL", "XL"], MED: ["L", "M", "M"], SML: ["XS", "S", "XS"] },
    { key: "C", BIG: ["XXL", "XL"], MED: ["L", "M", "M"], SML: ["S", "XS", "XS"] },
    { key: "D", BIG: ["XXL", "XL"], MED: ["L", "M"],      SML: ["S", "XS", "XS"] }
  ];
  var PACKAGE_SHEET_VALUES = [1, 2, 3];
  var PACKAGE_SHEET_DEFAULT_INDEX = 1;

  function _tierBox(pair) {
    var sizeMm = TIER_SIZE_MM[pair.tier] || TIER_SIZE_MM[TIER_DEFAULT];
    var sizePt = sizeMm * MM_TO_PT;
    var asp = pair.aspect || 1;
    if (asp >= 1) { pair.cellW = sizePt; pair.cellH = sizePt / asp; }
    else { pair.cellW = sizePt * asp; pair.cellH = sizePt; }
    return pair;
  }

  function _newShelfRow(y) {
    return { y: y, w: 0, h: 0, items: [] };
  }

  function _snapPack(rowsArr) {
    var rs = [];
    for (var i = 0; i < rowsArr.length; i++) {
      var r = rowsArr[i];
      rs.push({ y: r.y, w: r.w, h: r.h, items: r.items.slice(), tierLock: r.tierLock });
    }
    return rs;
  }

  function _heightsClose(h1, h2) {
    var lo = h1 < h2 ? h1 : h2;
    var hi = h1 < h2 ? h2 : h1;
    return lo >= hi * BAND_CELL_TOL;
  }

  function _canAddToShelfRow(row, item, binW, binH, gap) {
    if (item.w > binW || item.h > binH) return false;
    var nextW = row.items.length > 0 ? row.w + gap + item.w : item.w;
    var nextH = row.h > item.h ? row.h : item.h;
    return nextW <= binW && row.y + nextH <= binH;
  }

  function _addToShelfRow(row, item, gap) {
    row.w = row.items.length > 0 ? row.w + gap + item.w : item.w;
    if (item.h > row.h) row.h = item.h;
    row.items.push(item);
  }

  function _tryAddToBandRow(row, pair, isLast, binW, binH, gap, relaxed) {
    var cands = [
      { w: pair.cellW, h: pair.cellH, payload: pair, rotated: false },
      { w: pair.cellH, h: pair.cellW, payload: pair, rotated: true }
    ];
    for (var c = 0; c < cands.length; c++) {
      if (!isLast && row.items.length > 0 && cands[c].h > row.h) continue;
      // 높이 유사성 게이트 (v22): 같은 tier 라도 방향/비율 차이로 행 높이와 크게 다르면
      // (예: 세로형 행에 납작한 가로형) 그 행에 안 넣는다 — 별도 행 또는 회전 후보가 처리.
      // relaxed (게이트 해제) 는 _placeBanded 의 최후 fallback 전용.
      if (!relaxed && row.items.length > 0 && !_heightsClose(cands[c].h, row.h)) continue;
      if (_canAddToShelfRow(row, cands[c], binW, binH, gap)) {
        _addToShelfRow(row, cands[c], gap);
        return true;
      }
    }
    return false;
  }

  function _placeBanded(rows, pair, binW, binH, gap) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].tierLock !== pair.tier) continue;
      if (_tryAddToBandRow(rows[i], pair, i === rows.length - 1, binW, binH, gap, false)) return true;
    }
    var ny = rows.length > 0 ? rows[rows.length - 1].y + rows[rows.length - 1].h + gap : 0;
    var nr = _newShelfRow(ny);
    nr.tierLock = pair.tier;
    if (_tryAddToBandRow(nr, pair, true, binW, binH, gap, false)) {
      rows.push(nr);
      return true;
    }
    // 게이트 완화 fallback: 게이트 통과 행도, 새 행도 불가할 때만 기존 행에 게이트 없이
    // (v21 동작) 재시도. 행 높이가 양방향 후보 사이에 끼는 dead-zone (예: 28.6mm 행에
    // 21.4/38.1 후보) 에서 atomic pass 전체가 롤백되는 회귀 방지 — 게이트 이전에 가능했던
    // 배치는 이 경로로 전부 유지되므로 게이트는 순수 선호 순서만 바꾼다.
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].tierLock !== pair.tier) continue;
      if (_tryAddToBandRow(rows[j], pair, j === rows.length - 1, binW, binH, gap, true)) return true;
    }
    return false;
  }

  function _pkgMin(tier) {
    var c = PKG_COUNT_BY_TIER[tier];
    return c ? c.min : 1;
  }

  function _pkgMax(tier) {
    var c = PKG_COUNT_BY_TIER[tier];
    return c ? c.max : 999999;
  }

  function _buildTierColumn(grp, fromIdx, maxW, maxH, gap, counts) {
    var cells = [];
    var stackH = 0;
    var stackW = 0;
    var idx = fromIdx;
    var localAdd = {};
    while (true) {
      var found = -1;
      for (var s = 0; s < grp.length; s++) {
        var i = (idx + s) % grp.length;
        if (counts) {
          var eff = counts[grp[i].base] + (localAdd[grp[i].base] || 0);
          if (eff >= _pkgMax(grp[i].tier)) continue;
        }
        if (grp[i].cellW > maxW) continue;
        var nextH = cells.length > 0 ? stackH + gap + grp[i].cellH : grp[i].cellH;
        if (nextH > maxH) continue;
        found = i;
        break;
      }
      if (found < 0) break;
      var fit = grp[found];
      stackH = cells.length > 0 ? stackH + gap + fit.cellH : fit.cellH;
      if (fit.cellW > stackW) stackW = fit.cellW;
      cells.push({ w: fit.cellW, h: fit.cellH, payload: fit });
      localAdd[fit.base] = (localAdd[fit.base] || 0) + 1;
      idx = (found + 1) % grp.length;
    }
    if (cells.length < 2) return null;
    return { isVStack: true, w: stackW, h: stackH, cells: cells, nextIdx: idx };
  }

  function _pairPlacedInRows(rows, pair) {
    for (var r = 0; r < rows.length; r++) {
      var its = rows[r].items;
      for (var i = 0; i < its.length; i++) {
        if (its[i].isVStack) {
          for (var c = 0; c < its[i].cells.length; c++) {
            if (its[i].cells[c].payload === pair) return true;
          }
        } else if (its[i].payload === pair) {
          return true;
        }
      }
    }
    return false;
  }

  function _sortedPairsForShelf(pairs, ascending) {
    var result = [];
    for (var i = 0; i < pairs.length; i++) result.push(pairs[i]);
    result.sort(function (a, b) {
      var ah = a.cellH;
      var bh = b.cellH;
      var aa = a.cellW * a.cellH;
      var bb = b.cellW * b.cellH;
      if (ah !== bh) return ascending ? (ah - bh) : (bh - ah);
      if (aa !== bb) return ascending ? (aa - bb) : (bb - aa);
      return a.base < b.base ? -1 : (a.base > b.base ? 1 : 0);
    });
    return result;
  }

  function _shelfRowsToPlaced(rows, binW, binH, gap) {
    var placed = [];
    if (!rows || rows.length === 0) return placed;

    var R = rows.length;
    var sumH = 0;
    for (var k = 0; k < R; k++) sumH += rows[k].h;

    // 세로: 여유 충분하면 균등 justify, 빡빡하면 inner 행 간격 = 최소 gap 보장(패커가 행 사이 gap 을
    //   이미 확보해 binH 에 맞췄으므로 inner=gap 강제는 오버플로우 없음). 남는 공간만 outer top/bottom 으로.
    var justifyVGap = (binH - sumH) / (R + 1);
    if (justifyVGap < 0) justifyVGap = 0;
    var vGap = justifyVGap >= gap ? justifyVGap : gap;
    var topV = (binH - sumH - (R - 1) * vGap) / 2;
    if (topV < 0) { vGap = justifyVGap; topV = justifyVGap; }

    var yCursor = topV;
    for (var r = 0; r < R; r++) {
      var row = rows[r];
      var n = row.items.length;
      if (n === 0) continue;

      var sumW = 0;
      for (var i = 0; i < n; i++) sumW += row.items[i].w;

      // 가로 (per-row): 여유 충분하면 균등 justify, 빡빡하면 inner = 최소 gap 보장(패커가 확보, 오버플로우 없음).
      var justifyHGap = (binW - sumW) / (n + 1);
      if (justifyHGap < 0) justifyHGap = 0;
      var hGap = justifyHGap >= gap ? justifyHGap : gap;
      var xLeft = (binW - sumW - (n - 1) * hGap) / 2;
      if (xLeft < 0) { hGap = justifyHGap; xLeft = justifyHGap; }

      var xCursor = xLeft;
      for (var j = 0; j < n; j++) {
        var item = row.items[j];

        // VStack item (AllSizes backfill): 이종 셀 세로 스택으로 expand. 셀별 payload 를 갖고,
        //   각 셀은 슬롯 폭 안에서 가로 center, 스택 전체는 row 안에서 세로 center.
        if (item.isVStack) {
          var vY = yCursor + (row.h - item.h) / 2;
          for (var vc = 0; vc < item.cells.length; vc++) {
            var vCell = item.cells[vc];
            placed.push({ x: xCursor + (item.w - vCell.w) / 2, y: vY, w: vCell.w, h: vCell.h, payload: vCell.payload });
            vY += vCell.h + gap;
          }
          xCursor += item.w + hGap;
          continue;
        }

        var yCentered = yCursor + (row.h - item.h) / 2;
        placed.push({ x: xCursor, y: yCentered, w: item.w, h: item.h, payload: item.payload, rotated: item.rotated });
        xCursor += item.w + hGap;
      }

      yCursor += row.h + vGap;
    }
    return placed;
  }

  function _packPackage(pairs, binW, binH, gap) {
    if (!pairs || pairs.length === 0) {
      return { placed: [], leftover: [], rows: [], repeatedCount: 0, cols: 0, gridRows: 0, slots: 0 };
    }
    for (var i = 0; i < pairs.length; i++) _tierBox(pairs[i]);

    var ordered = _sortedPairsForShelf(pairs, false);  // 높이 내림차순
    var n = ordered.length;
    var rows = [];
    var leftover = [];

    // Phase A — 각 사진 1회 배치 (tier 밴드 행). 실패는 column 후보로 보류 (즉시 leftover 금지 —
    //   XXL+XL+L+M 처럼 tier 행 누적이 binH 를 넘으면 마지막 tier 가 행을 못 여는 케이스).
    var counts = {};   // base → 시트 출력 장수 (min/max 판정의 SOT)
    for (var ci0 = 0; ci0 < n; ci0++) counts[ordered[ci0].base] = 0;

    var colOnly = [];
    for (var p = 0; p < n; p++) {
      if (_placeBanded(rows, ordered[p], binW, binH, gap)) {
        counts[ordered[p].base]++;
        continue;
      }
      ordered[p]._colOnly = true;
      colOnly.push(ordered[p]);
    }

    var repeatedCount = 0;
    var tierSeq = ["XL", "L", "M", "S", "XS"];
    var tierGroups = { XL: [], L: [], M: [], S: [], XS: [] };
    var tierNoRows = { XL: false, L: false, M: false, S: false, XS: false };
    for (var gi = 0; gi < n; gi++) {
      var gp = ordered[gi];
      if (gp.tier === "XXL" || !tierGroups[gp.tier]) continue;  // XXL·미지정 tier 반복 제외
      // 행 배치 못 한 디자인이 있는 tier 은 행 pass 제외(행 기반 비균일 방지) — column 은 허용.
      if (gp._colOnly) tierNoRows[gp.tier] = true;
      tierGroups[gp.tier].push(gp);
    }
    for (var so = 0; so < tierSeq.length; so++) {
      tierGroups[tierSeq[so]] = _sortedPairsForShelf(tierGroups[tierSeq[so]], false);
    }

    var retired = { XL: false, L: false, M: false, S: false, XS: false };
    var guard = 0;

    // Phase B0 — min 강제 pass (2026-08-19): PKG_COUNT_BY_TIER.min 까지 tier round-robin
    //   으로 atomic pass 우선 실행 — greedy 반복(B1)이 다른 tier 의 min 공간을 먹기 전에
    //   확보한다. pass 실패 tier 는 은퇴 (잔여 min 은 아래 min 구제 column 이 시도).
    var minActive = true;
    while (minActive && guard++ < 100000) {
      minActive = false;
      for (var tmq = 0; tmq < tierSeq.length; tmq++) {
        var TM = tierSeq[tmq];
        if (retired[TM] || tierNoRows[TM]) continue;
        var mGrp = tierGroups[TM];
        if (!mGrp || mGrp.length === 0) continue;
        if (counts[mGrp[0].base] >= _pkgMin(TM)) continue;   // pass 는 균일이라 대표 검사
        var mSnap = _snapPack(rows);
        var mOk = true;
        for (var mj = 0; mj < mGrp.length; mj++) {
          if (_placeBanded(rows, mGrp[mj], binW, binH, gap)) continue;
          mOk = false;
          break;
        }
        if (mOk) {
          for (var mj2 = 0; mj2 < mGrp.length; mj2++) counts[mGrp[mj2].base]++;
          repeatedCount += mGrp.length;
          minActive = true;
        } else {
          rows = mSnap;
          retired[TM] = true;
        }
      }
    }

    // Phase B1 — Model B tier 단위 균일 반복 (기존 greedy). max cap 준수: 다음 pass 로
    //   디자인 하나라도 max 를 넘기면 그 tier 은퇴 (hard max — 남는 공간은 justify 몫).
    var anyActive = true;
    while (anyActive && guard++ < 100000) {
      anyActive = false;
      for (var tsq = 0; tsq < tierSeq.length; tsq++) {
        var T = tierSeq[tsq];
        if (retired[T]) continue;
        var grp = tierGroups[T];
        if (tierNoRows[T] || !grp || grp.length === 0) { retired[T] = true; continue; }
        var maxT = _pkgMax(T);
        var canRepeat = true;
        for (var mc = 0; mc < grp.length; mc++) {
          if (counts[grp[mc].base] + 1 > maxT) { canRepeat = false; break; }
        }
        if (!canRepeat) { retired[T] = true; continue; }

        var snap = _snapPack(rows);                 // atomic pass: 전부 1장씩, 실패 시 통째 롤백
        var passOk = true;
        for (var pj = 0; pj < grp.length; pj++) {
          if (_placeBanded(rows, grp[pj], binW, binH, gap)) continue;
          passOk = false;                           // 새 행에도 안 들어감 → pass 불가
          break;
        }
        if (passOk) {
          for (var pj2 = 0; pj2 < grp.length; pj2++) counts[grp[pj2].base]++;
          repeatedCount += grp.length;
          anyActive = true;
        } else {
          rows = snap;                              // pass 중 추가분·신규행 전부 폐기
          retired[T] = true;
        }
      }
    }

    // min 구제 column (2026-08-19) — count < min 인 디자인 (Phase A 실패 colOnly 포함) 을
    //   일반 column 채움 전에 우선 배치해 min 보장 복원. tier 큰 순서로, 폭 남는 행 어디든.
    //   R8c 케이스: 행을 못 연 S tier 가 XS column 독식에 밀려 0장이 되던 문제 해소.
    //   XXL 은 column 자체가 비실용적 (2단 127mm+) 이라 기존대로 제외 — 미달 시 leftover 보고.
    var resActive = true;
    while (resActive) {
      resActive = false;
      for (var rt = 0; rt < tierSeq.length && !resActive; rt++) {
        var rGrp = tierGroups[tierSeq[rt]];
        if (!rGrp || rGrp.length === 0) continue;
        var deficit = [];
        for (var rd = 0; rd < rGrp.length; rd++) {
          if (counts[rGrp[rd].base] < _pkgMin(rGrp[rd].tier)) deficit.push(rGrp[rd]);
        }
        if (deficit.length === 0) continue;
        for (var rr = 0; rr < rows.length; rr++) {
          var rCol = _buildTierColumn(deficit, 0, binW - rows[rr].w - gap, rows[rr].h, gap, counts);
          if (rCol === null) continue;
          _addToShelfRow(rows[rr], rCol, gap);
          for (var rc = 0; rc < rCol.cells.length; rc++) {
            var rb = rCol.cells[rc].payload.base;
            if (counts[rb] > 0) repeatedCount++;
            counts[rb]++;
          }
          resActive = true;   // counts 갱신됐으니 deficit 재계산 후 재시도
          break;
        }
      }
    }

    // 고아 행 채움 (2026-08-19) — tierNoRows 로 반복이 막힌 tier 의 기존 행 (Phase A 가 연
    //   행) 을 자기 tier 디자인 반복으로 가로 채움. max 준수, 행 키 성장 금지 (isLast=false).
    //   R8c 케이스: 마지막 자투리 높이에 턱걸이로 열린 행이 한 장 덩그러니 남던 문제 해소.
    for (var orI = 0; orI < rows.length; orI++) {
      var orRow = rows[orI];
      if (!orRow.tierLock || !tierNoRows[orRow.tierLock]) continue;
      var orGrp = tierGroups[orRow.tierLock];
      if (!orGrp || orGrp.length === 0) continue;
      var orCur = 0;
      var orAdded = true;
      while (orAdded) {
        orAdded = false;
        for (var os = 0; os < orGrp.length; os++) {
          var oi = (orCur + os) % orGrp.length;
          var op = orGrp[oi];
          if (counts[op.base] >= _pkgMax(op.tier)) continue;
          if (_tryAddToBandRow(orRow, op, false, binW, binH, gap, false)) {
            if (counts[op.base] > 0) repeatedCount++;
            counts[op.base]++;
            orCur = oi + 1;
            orAdded = true;
            break;
          }
        }
      }
    }

    // Column 채움 — 각 행 남은 폭에 작은 tier column. 행 키는 안 키움. max cap 준수 +
    //   시작 tier 회전 (한 tier 가 남은 폭을 독식하지 않게 — max 와 이중 안전판).
    var colCursor = { XS: 0, S: 0, M: 0, L: 0 };
    var ascTiers = ["XS", "S", "M", "L"];
    var colStart = 0;
    for (var cr = 0; cr < rows.length; cr++) {
      while (true) {
        var col = null;
        var used = colStart;
        for (var ct = 0; ct < ascTiers.length; ct++) {
          used = (colStart + ct) % ascTiers.length;
          var cGrp = tierGroups[ascTiers[used]];
          if (!cGrp || cGrp.length === 0) continue;
          col = _buildTierColumn(cGrp, colCursor[ascTiers[used]], binW - rows[cr].w - gap, rows[cr].h, gap, counts);
          if (col !== null) { colCursor[ascTiers[used]] = col.nextIdx; break; }
        }
        if (col === null) break;
        colStart = (used + 1) % ascTiers.length;
        _addToShelfRow(rows[cr], col, gap);
        for (var cc = 0; cc < col.cells.length; cc++) {
          var cb = col.cells[cc].payload.base;
          if (counts[cb] > 0) repeatedCount++;
          counts[cb]++;
        }
      }
    }

    // column 구제까지 끝난 뒤에도 0장인 보류 디자인만 진짜 leftover (시트보다 큰 오버사이즈 등).
    for (var lo = 0; lo < colOnly.length; lo++) {
      if (!_pairPlacedInRows(rows, colOnly[lo])) leftover.push(colOnly[lo]);
    }

    // min 미달 집계 — 완료 메시지 경고용 (공간 부족으로 min 을 못 채운 디자인).
    var minShortfall = [];
    for (var msf = 0; msf < n; msf++) {
      var mp = ordered[msf];
      if (counts[mp.base] < _pkgMin(mp.tier)) {
        minShortfall.push({ base: mp.base, tier: mp.tier, count: counts[mp.base], min: _pkgMin(mp.tier) });
      }
    }

    // 행 키 내림차순 정렬 (AllSizes 와 동일한 위→아래 흐름). _shelfRowsToPlaced 가 y 재계산.
    var deco = [];
    for (var sr = 0; sr < rows.length; sr++) deco.push({ r: rows[sr], i: sr });
    deco.sort(function (a, b) { return (b.r.h - a.r.h) || (a.i - b.i); });
    rows = [];
    for (var dr = 0; dr < deco.length; dr++) rows.push(deco[dr].r);

    var _minRowW = binW * ORPHAN_ROW_MIN_W;
    for (var dr = rows.length - 1; dr >= 0; dr--) {
      var R = rows[dr];
      if (R.w >= _minRowW) continue;
      var survivors = [];
      for (var it = 0; it < R.items.length; it++) {
        var item = R.items[it];
        if (item.isVStack) { survivors.push(item); continue; }
        var moved = false;
        for (var tr = 0; tr < rows.length && !moved; tr++) {
          if (tr === dr) continue;
          var T = rows[tr];
          if (T.w + gap + item.w > binW) continue;
          if (item.h > T.h) continue;
          _addToShelfRow(T, item, gap); moved = true;
        }
        if (moved) continue;
        if (counts[item.payload.base] > 1) { counts[item.payload.base]--; continue; }
        survivors.push(item);
      }
      if (survivors.length === 0) { rows.splice(dr, 1); continue; }
      R.items = []; R.w = 0; R.h = 0;
      for (var sv = 0; sv < survivors.length; sv++) _addToShelfRow(R, survivors[sv], gap);
    }
    var placed = _shelfRowsToPlaced(rows, binW, binH, gap);
    return {
      placed: placed,
      leftover: leftover,
      rows: rows,
      repeatedCount: repeatedCount,
      cols: 0,
      gridRows: rows.length,
      slots: placed.length,
      counts: counts,
      minShortfall: minShortfall
    };
  }

  function _bucketOf(pair) {
    if (pair.bucket && BUCKET_TIERS[pair.bucket]) return pair.bucket;
    return TIER_TO_BUCKET[pair.tier] || "MED";
  }

  function _dealBuckets(pairs, nSheets) {
    var sheets = [];
    for (var s = 0; s < nSheets; s++) sheets.push([]);
    for (var b = 0; b < BUCKETS.length; b++) {
      var k = 0;
      for (var i = 0; i < pairs.length; i++) {
        if (_bucketOf(pairs[i]) !== BUCKETS[b]) continue;
        sheets[k % nSheets].push(pairs[i]);
        k++;
      }
    }
    return sheets;
  }

  function _assignTiers(sheetPairs, ladder) {
    var cursor = { BIG: 0, MED: 0, SML: 0 };
    for (var i = 0; i < sheetPairs.length; i++) {
      var b = _bucketOf(sheetPairs[i]);
      var lad = ladder[b] || BUCKET_TIERS[b];
      sheetPairs[i].tier = lad[cursor[b] % lad.length];
      cursor[b]++;
      _tierBox(sheetPairs[i]);
    }
    return sheetPairs;
  }

  function _resetPackState(sheetPairs) {
    for (var i = 0; i < sheetPairs.length; i++) sheetPairs[i]._colOnly = false;
  }

  function _sheetFill(packResult, binW, binH) {
    var area = 0;
    for (var i = 0; i < packResult.placed.length; i++) {
      area += packResult.placed[i].w * packResult.placed[i].h;
    }
    return area / (binW * binH);
  }

  function _trialLadder(pairs, nSheets, ladder, binW, binH, gap) {
    var deal = _dealBuckets(pairs, nSheets);
    var trial = { ladder: ladder, sheets: [], warn: 0, minFill: 1, sumFill: 0 };
    for (var s = 0; s < deal.length; s++) {
      _assignTiers(deal[s], ladder);
      _resetPackState(deal[s]);
      var r = _packPackage(deal[s], binW, binH, gap);
      var fill = _sheetFill(r, binW, binH);
      var shortfall = r.minShortfall ? r.minShortfall.length : 0;
      trial.warn += r.leftover.length + shortfall;
      trial.sumFill += fill;
      if (fill < trial.minFill) trial.minFill = fill;
      trial.sheets.push({ pairs: deal[s], fill: fill });
    }
    return trial;
  }

  function _planPackageSheets(pairs, nSheets, binW, binH, gap) {
    var best = null;
    for (var li = 0; li < PACKAGE_LADDERS.length; li++) {
      var trial = _trialLadder(pairs, nSheets, PACKAGE_LADDERS[li], binW, binH, gap);
      var better = false;
      if (best === null) {
        better = true;
      } else if (trial.warn < best.warn) {
        better = true;
      } else if (trial.warn === best.warn && trial.minFill > best.minFill) {
        better = true;
      }
      if (better) best = trial;
    }
    // 마지막 시행이 pair.tier 에 남긴 값을 승자 사다리로 되돌린다 (시행들이 같은 객체를 공유).
    for (var bs = 0; bs < best.sheets.length; bs++) {
      _assignTiers(best.sheets[bs].pairs, best.ladder);
      _resetPackState(best.sheets[bs].pairs);
    }
    return best;
  }

module.exports = { _tierBox: _tierBox, _newShelfRow: _newShelfRow, _snapPack: _snapPack, _heightsClose: _heightsClose, _canAddToShelfRow: _canAddToShelfRow, _addToShelfRow: _addToShelfRow, _tryAddToBandRow: _tryAddToBandRow, _placeBanded: _placeBanded, _pkgMin: _pkgMin, _pkgMax: _pkgMax, _buildTierColumn: _buildTierColumn, _pairPlacedInRows: _pairPlacedInRows, _sortedPairsForShelf: _sortedPairsForShelf, _shelfRowsToPlaced: _shelfRowsToPlaced, _packPackage: _packPackage, _bucketOf: _bucketOf, _dealBuckets: _dealBuckets, _assignTiers: _assignTiers, _resetPackState: _resetPackState, _sheetFill: _sheetFill, _trialLadder: _trialLadder, _planPackageSheets: _planPackageSheets, MM_TO_PT: MM_TO_PT, BODY_PADDING_MM: BODY_PADDING_MM, GAP_DEFAULT_MM: GAP_DEFAULT_MM, BAND_CELL_TOL: BAND_CELL_TOL, TIER_SIZE_MM: TIER_SIZE_MM, TIER_DEFAULT: TIER_DEFAULT, PKG_COUNT_BY_TIER: PKG_COUNT_BY_TIER, BUCKETS: BUCKETS, BUCKET_TIERS: BUCKET_TIERS, TIER_TO_BUCKET: TIER_TO_BUCKET, PACKAGE_LADDERS: PACKAGE_LADDERS, PACKAGE_SHEET_VALUES: PACKAGE_SHEET_VALUES, PACKAGE_SHEET_DEFAULT_INDEX: PACKAGE_SHEET_DEFAULT_INDEX };