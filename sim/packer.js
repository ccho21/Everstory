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
  var ORPHAN_FILL_MIN_WIDTH = 0.95;
  var NAME_BIG_H_MM = 9.5;
  var NAME_CALLI_COUNT = 0;
  var LETTER_UNIT_MM = 9.5;
  var LETTER_GAP_RATIO = 0.35;
  var LETTER_UNIT_STEPS_MM = [9.5, 8.5, 7.5, 7.0];
  var LETTER_UNIT_MIN_MM = 5;
  var LETTER_UNIT_TIGHT_STEPS_MM = [6.5, 6, 5.5, 5];
  var NAME_SMALL_H_MM = 7;
  var NAME_HALO_RATIO = 0;
  var CUT_CACHE_FORMAT = "EVCUT1";
  var CUT_CACHE_DIRNAME = "_cutcache";
  var TRACE_OPTS = {
    threshold: 230,
    pathFidelity: 10,
    cornerFidelity: 10,
    minimumArea: 250,
    cornerAngle: 20,
    ignoreWhite: true,
    snapCurveToLines: false
  };

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
        if (its[i].isVStack || its[i].isComposite) {
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

        // Composite item (이름 블록 + 그 아래 채움): 셀이 자기 오프셋을 들고 있다.
        //   **위 정렬** — 이름이 행 맨 위에 붙어야 아래 채움이 이어진다 (사용자 지정).
        if (item.isComposite) {
          for (var ci = 0; ci < item.cells.length; ci++) {
            var cCell = item.cells[ci];
            placed.push({
              x: xCursor + cCell.dx, y: yCursor + cCell.dy,
              w: cCell.w, h: cCell.h, payload: cCell.payload
            });
          }
          xCursor += item.w + hGap;
          continue;
        }

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

  function _packPackage(pairs, binW, binH, gap, letterBlocks) {
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

    // 이름 블록은 tier 체계 밖이라 위 패킹에 참여하지 않는다. **모든 column 단계보다 먼저**
    // 붙인다 — 뒤에 붙이면 min 구제 column 이 히어로 행 잔여 폭을 먼저 먹어 자리가 없다
    // (누리 실측: 히어로 63.5mm 사진 + XS column 19.5mm = 83mm → 68.5mm 블록 배치 실패).
    // 대가로 그 폭만큼 min 구제 여지가 줄어든다 — 이름이 있는 주문은 min 미달 경고가
    // 늘 수 있고, 그게 맞는 우선순위다 (이름 블록은 고객이 지정한 것, min 은 내부 목표).
    // 블록 배열(큰 1 + 작은 N)을 순서대로 붙인다. 큰 것부터 붙여야 자리를 먼저 잡는다.
    // 일부만 붙어도 계속 진행 — 붙은 개수를 보고한다.
    var letterAttachedCount = 0;
    var letterWanted = 0;
    var letterEvicted = 0;
    var letterPending = [];        // 자리가 없어 못 붙은 블록 — 맨 마지막에 다시 시도한다
    if (letterBlocks && letterBlocks.length > 0) {
      letterWanted = letterBlocks.length;
      for (var lb = 0; lb < letterBlocks.length; lb++) {
        if (_attachLetterBlock(rows, letterBlocks[lb], binW, binH, gap)) letterAttachedCount++;
        else letterPending.push(letterBlocks[lb]);
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
      if (!orRow.tierLock) continue;
      // 구 경로 = 반복이 막힌 tier(tierNoRows). 신 경로 = 폭 미달 행.
      var orBlocked = tierNoRows[orRow.tierLock];
      var orNarrow = orRow.w < binW * ORPHAN_FILL_MIN_WIDTH;
      if (!orBlocked && !orNarrow) continue;
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
          // ±1 균형 — tier 안 최소 장수인 디자인만 추가 (column 채움과 같은 규칙).
          // **신 경로(폭 트리거)에만 적용.** 구 tierNoRows 경로에도 걸었더니 기존에 되던
          // 채움이 막혀 컷이 오히려 줄었다 (디자인8: 11→9컷, 잔여 159→228mm 실측) —
          // 구 경로는 동작을 그대로 보존한다.
          if (!orBlocked) {
            var orMin = 1e9;
            for (var ob = 0; ob < orGrp.length; ob++) {
              if (counts[orGrp[ob].base] < orMin) orMin = counts[orGrp[ob].base];
            }
            if (counts[op.base] > orMin) continue;
          }
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

    // 못 붙은 이름 블록 — **사진을 빼서라도 넣는다** (사용자 지정 2026-08-23).
    //
    // 왜 여기인가: 정상 부착은 tuned 위치(모든 column 단계 앞) 그대로 두고, **실패했을 때만**
    // 맨 마지막에 손댄다. 그래서 오늘 되던 배치는 한 픽셀도 안 바뀐다.
    // 왜 필요한가: 8글자 이상 단어는 히어로 옆 예산(72mm)에 안 들어가고, 시트가 꽉 차면
    // 전폭 새 행도 못 연다 → 이름이 **조용히 빠졌다** (16디자인 3시트에서 재현).
    //   실측: Isabella(8자) · Christopher(11자) 가 이 경로로 빠졌다.
    // counts 는 min 판정의 SOT 라 뺀 만큼 반드시 깎는다. 마지막 한 장은 안 뺀다.
    if (letterPending.length > 0) {
      var evGuard = _lastCopyGuard(counts);
      var evSink = function (gone) {
        var bs = _itemBases(gone);
        for (var bi = 0; bi < bs.length; bi++) {
          if (counts[bs[bi]] > 0) counts[bs[bi]]--;
          if (repeatedCount > 0) repeatedCount--;   // 마지막 한 장은 안 빼므로 항상 반복분이다
        }
      };
      for (var lp = 0; lp < letterPending.length; lp++) {
        var evN = _evictForLetterBlock(rows, letterPending[lp], binW, binH, gap, evGuard, evSink);
        if (evN >= 0) { letterAttachedCount++; letterEvicted += evN; }
      }
    }

    // 이름을 행 맨 위로 붙이고 **그 아래 죽은 공간을 사진으로 채운다** (사용자 지정 2026-08-24).
    // 이름은 7~9.5mm 띠인데 히어로 행은 45~63mm 라, 예전엔 이름이 한가운데 떠서 위아래
    // 68×53mm 가 통째로 비어 나갔다. max cap 은 그대로 지킨다.
    var letterFilled = 0;
    if (letterAttachedCount > 0) {
      var fillGuard = function (fp, fused) {
        return counts[fp.base] + (fused[fp.base] || 0) < _pkgMax(fp.tier);
      };
      var addedU = _fillUnderLetterBlocks(rows, ordered, gap, fillGuard);
      for (var au = 0; au < addedU.length; au++) {
        var ab = addedU[au].payload.base;
        if (counts[ab] > 0) repeatedCount++;   // 이미 있던 디자인이면 반복분
        counts[ab]++;
        letterFilled++;
      }
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

    _moveLetterBlocksToRowEnd(rows);
    var placed = _shelfRowsToPlaced(rows, binW, binH, gap);
    return {
      letterAttachedCount: letterAttachedCount,
      letterWanted: letterWanted,
      letterEvicted: letterEvicted,
      letterFilled: letterFilled,
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

  function _traceSignature() {
    var keys = ["threshold", "pathFidelity", "cornerFidelity", "minimumArea", "cornerAngle",
                "ignoreWhite", "snapCurveToLines"];
    var parts = [];
    for (var i = 0; i < keys.length; i++) parts.push(keys[i] + ":" + TRACE_OPTS[keys[i]]);
    return parts.join(",");
  }

  function _cutCacheFileFor(pair) {
    var uri = pair.sil.absoluteURI;
    var slash = uri.lastIndexOf("/");
    if (slash < 0) return null;
    var dir = uri.substring(0, slash);
    var fname = uri.substring(slash + 1).replace(/_sil\.png$/i, ".evcut");
    return new File(dir + "/" + CUT_CACHE_DIRNAME + "/" + fname);
  }

  function _cutCacheFingerprint(pair) {
    var size = -1, mtime = -1;
    try { size = pair.sil.length; } catch (eSz) {}
    // **초 단위로 절삭.** ExtendScript File.modified 는 초 정밀도라 ms 자리가 0 인데, 다른
    // 런타임·Illustrator 버전이 ms 를 채우면 같은 파일인데도 지문이 어긋나 캐시가 영영 미스한다.
    // 초로 고정하면 정밀도와 무관해진다. 같은 1초 안에 크기까지 동일하게 재저장되는 경우만
    // 잘못 히트하는데, Phase A 내보내기가 1초 이상 걸리고 크기까지 같을 확률은 무시할 수준.
    try { mtime = Math.floor(pair.sil.modified.getTime() / 1000); } catch (eMt) {}
    return size + "," + mtime;
  }

  function _subpathsOf(item) {
    if (item.typename === "CompoundPathItem") {
      var out = [];
      for (var i = 0; i < item.pathItems.length; i++) out.push(item.pathItems[i]);
      return out;
    }
    return [item];
  }

  function _writeCutCache(pair, item, cutInfo) {
    var f = _cutCacheFileFor(pair);
    if (!f) return false;
    try {
      var dir = f.parent;
      if (!dir.exists) dir.create();
      var subs = _subpathsOf(item);
      var lines = [CUT_CACHE_FORMAT,
                   "sig=" + _traceSignature(),
                   "src=" + _cutCacheFingerprint(pair),
                   "info=" + cutInfo.relL + "," + cutInfo.relT + "," + cutInfo.relW + "," + cutInfo.relH];
      for (var s = 0; s < subs.length; s++) {
        var pts = subs[s].pathPoints;
        var chunk = [];
        for (var p = 0; p < pts.length; p++) {
          var pp = pts[p];
          var isCorner = (pp.pointType === PointType.CORNER) ? 1 : 0;
          chunk.push(pp.anchor[0].toFixed(4) + "," + pp.anchor[1].toFixed(4) + "," +
                     pp.leftDirection[0].toFixed(4) + "," + pp.leftDirection[1].toFixed(4) + "," +
                     pp.rightDirection[0].toFixed(4) + "," + pp.rightDirection[1].toFixed(4) + "," +
                     isCorner);
        }
        lines.push("S=" + (subs[s].closed ? 1 : 0) + "|" + chunk.join(";"));
      }
      f.encoding = "UTF-8";
      // ExtendScript File 은 기본적으로 플랫폼 관례로 줄바꿈을 **번역**한다 — macOS 에서 \n 을
      // 써도 파일에는 \r(0x0D) 이 들어가, split("\n") 으로 읽는 쪽과 어긋나 캐시가 절대
      // 히트하지 않았다(2026-08-22 실측: LF 0개 / CR 4개). Unix 로 고정한다.
      f.lineFeed = "Unix";
      if (!f.open("w")) return false;
      f.write(lines.join("\n"));
      f.close();
      return true;
    } catch (eW) {
      try { f.close(); } catch (eC) {}
      return false;
    }
  }

  function _readCutCache(pair) {
    var f = _cutCacheFileFor(pair);
    if (!f || !f.exists) return null;
    var text = null;
    try {
      f.encoding = "UTF-8";
      if (!f.open("r")) return null;
      text = f.read();
      f.close();
    } catch (eR) {
      try { f.close(); } catch (eC) {}
      return null;
    }
    if (!text) return null;
    // CR / LF / CRLF 전부 허용 — 위 lineFeed 고정 이전에 CR 로 쓰인 캐시 파일도 그대로 읽는다.
    var lines = text.split(/\r\n|\r|\n/);
    if (lines[0] !== CUT_CACHE_FORMAT) return null;

    var sig = null, src = null, info = null, subs = [];
    for (var i = 1; i < lines.length; i++) {
      var ln = lines[i];
      if (ln.substring(0, 4) === "sig=") { sig = ln.substring(4); continue; }
      if (ln.substring(0, 4) === "src=") { src = ln.substring(4); continue; }
      if (ln.substring(0, 5) === "info=") { info = ln.substring(5); continue; }
      if (ln.substring(0, 2) === "S=") {
        var bar = ln.indexOf("|");
        if (bar < 0) return null;
        var closed = (ln.substring(2, bar) === "1");
        var raw = ln.substring(bar + 1);
        if (raw.length === 0) return null;
        var chunks = raw.split(";");
        var pts = [];
        for (var c = 0; c < chunks.length; c++) {
          var n = chunks[c].split(",");
          if (n.length !== 7) return null;
          pts.push([parseFloat(n[0]), parseFloat(n[1]), parseFloat(n[2]), parseFloat(n[3]),
                    parseFloat(n[4]), parseFloat(n[5]), n[6] === "1"]);
        }
        subs.push({ closed: closed, pts: pts });
      }
    }
    if (sig !== _traceSignature()) return null;          // 트레이스 파라미터가 바뀜
    if (src !== _cutCacheFingerprint(pair)) return null; // 사진이 바뀜
    if (!info || subs.length === 0) return null;
    var iv = info.split(",");
    if (iv.length !== 4) return null;
    return {
      cutInfo: { relL: parseFloat(iv[0]), relT: parseFloat(iv[1]),
                 relW: parseFloat(iv[2]), relH: parseFloat(iv[3]) },
      subs: subs
    };
  }

  function _rebuildCutline(layer, data) {
    var host, made;
    if (data.subs.length > 1) {
      host = layer.compoundPathItems.add();
      made = host;
    } else {
      host = null;
      made = null;
    }
    for (var s = 0; s < data.subs.length; s++) {
      var sub = data.subs[s];
      var path = host ? host.pathItems.add() : layer.pathItems.add();
      if (!made) made = path;
      for (var p = 0; p < sub.pts.length; p++) {
        var v = sub.pts[p];
        var pp = path.pathPoints.add();
        pp.anchor = [v[0], v[1]];
        pp.leftDirection = [v[2], v[3]];
        pp.rightDirection = [v[4], v[5]];
        pp.pointType = v[6] ? PointType.CORNER : PointType.SMOOTH;
      }
      path.closed = sub.closed;
    }
    return made;
  }

  function _attachLetterBlock(rows, block, binW, binH, gap) {
    var item = { w: block.cellW, h: block.cellH, payload: block, rotated: false };
    // 붙일 행 고르기 — 블록 성격에 따라 기준이 다르다.
    //   preferHero (알파벳 블록) : 가장 **높은** 행 = 히어로 사진 옆. 정사각에 가까워
    //     히어로 행 높이를 잘 쓴다. 레퍼런스 시트의 그 자리.
    //   그 외 (캘리 통짜)        : 높이가 가장 **가까운** 행. 7~9.5mm 얇은 가로 띠라
    //     45mm 히어로 행에 붙이면 그 아래가 통째로 죽는다 (충전 78%→64~71% 실측).
    // 행 키를 키우면 아래 행과 겹치므로 item.h <= row.h 인 행 중에서만 고른다.
    // 크기 후보가 있으면 (알파벳 블록) 행마다 유닛 단계를 전부 시도한다.
    // **하이브리드** (사용자 지정 2026-08-23): 큰 유닛으로 히어로 옆을 먼저 노리고,
    // 안 들어가면 유닛을 한 단계씩 낮춰서라도 그 자리를 지킨다. 그래도 안 되면
    // 아래의 전폭 새 행으로 떨어진다.
    // **유닛 후보는 알파벳 블록만 갖는다.** 캘리 통짜는 lines/maxLen/unitMm 자체가 없어서
    // _letterBlockResize 를 태우면 치수가 NaN 이 된다 — 반드시 갈라서 처리할 것.
    var shapes = block.shapes;
    var unitBased = !!(shapes && shapes.length > 0);
    if (!unitBased) {
      shapes = [{ unitMm: block.unitMm, w: block.cellW, h: block.cellH }];
    }
    var best = -1, bestShape = null, bestScore = -1;
    var binArea = binW * binH;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var sh = 0; sh < shapes.length; sh++) {
        var cand = shapes[sh];
        if (row.w + gap + cand.w > binW) continue;
        if (cand.h > row.h) continue;
        var score;
        if (block.preferHero) {
          // 우선순위를 자릿수로 갈라 사전식으로 비교한다 (작을수록 좋음):
          //   ① 가장 높은 행(=히어로 옆)  ② 가장 큰 유닛  ③ 낭비 최소.
          // 낭비는 **면적 비율**로 정규화해야 ②와 자릿수가 안 겹친다 — 절대 면적(pt²)은
          // 최대 19만이라 유닛 항(×1000)을 삼켜버린다.
          var underDead = cand.w * (row.h - cand.h);
          var rightDead = (binW - row.w - gap - cand.w) * row.h;
          var wasteRatio = binArea > 0 ? (underDead + rightDead) / binArea : 0;
          score = -row.h * 1000000 - cand.unitMm * 1000 + wasteRatio;
        } else {
          score = row.h - cand.h;    // 캘리 = 높이가 가까운 행
        }
        if (best < 0 || score < bestScore) { best = r; bestShape = cand; bestScore = score; }
      }
    }
    if (best >= 0) {
      if (unitBased) _letterBlockResize(block, bestShape.unitMm);
      item.w = block.cellW;
      item.h = block.cellH;
      _addToShelfRow(rows[best], item, gap);
      return true;
    }

    // 전폭 새 행 — 폭 예산이 시트 전체(binW)로 넓어지므로 **유닛을 다시 크게** 잡는다.
    // 히어로 옆에서 7mm 로 깎였더라도 여기서는 9.5mm 가 들어갈 수 있다.
    if (unitBased) {
      var newUnitMm = -1;
      for (var sh2 = 0; sh2 < shapes.length; sh2++) {
        if (shapes[sh2].w <= binW) { newUnitMm = shapes[sh2].unitMm; break; }
      }
      if (newUnitMm < 0) {
        // 후보가 전부 시트 폭을 넘는 아주 긴 단어 — 폭에 딱 맞는 유닛을 계산한다.
        // 하한 밑이면 배치를 포기한다 (조용히 넘기지 않고 false 로 보고).
        var fitMm = _letterUnitToFit(block.maxLen, binW);
        if (fitMm < LETTER_UNIT_MIN_MM) return false;
        newUnitMm = fitMm;
      }
      _letterBlockResize(block, newUnitMm);
      item.w = block.cellW;
      item.h = block.cellH;
    }
    var usedH = 0;
    for (var k = 0; k < rows.length; k++) usedH += rows[k].h + gap;
    if (usedH + item.h <= binH && item.w <= binW) {
      var nr = _newShelfRow(usedH);
      nr.tierLock = "__NAME__";
      _addToShelfRow(nr, item, gap);
      rows.push(nr);
      return true;
    }
    return false;
  }

  function _letterBlockSpec(nameText, unitMm, tag) {
    if (!nameText) return null;
    // **NFC 합성 필수.** macOS 는 한글을 NFD(자모 분해)로 주는 경우가 많고, 그러면
    // "하린" 이 ᄒ/ᅡ/ᄅ/ᅵ/ᆫ 5 코드포인트로 쪼개진다. Bagel Fat One 은 한글 **음절**
    // (U+AC00~)은 가졌지만 **자모**(U+1100~)는 없어서 한 글자도 안 그려진다
    // (2026-08-22 실측 사고). 헤더는 이미 _nfcHangul 을 쓰고 있었는데 여기만 빠져 있었다.
    var composed = _nfcHangul(String(nameText));
    // **스페이스 = 줄바꿈. 그 외에는 무조건 한 줄** (사용자 지정 2026-08-23).
    // 예전에는 스페이스를 버리고 열 상한(6)으로 접었는데, "Charles Cho" 가
    // `c h a r / l e s c / h o` 로 잘려 단어가 뭉갰다. 이름은 단어가 안 끊겨야 읽힌다.
    var words = composed.split(/\s+/);
    var lines = [];
    var all = [];
    for (var w = 0; w < words.length; w++) {
      var lineChars = [];
      for (var i = 0; i < words[w].length; i++) {
        var ch = words[w].charAt(i);
        if (/\s/.test(ch)) continue;
        lineChars.push(ch);
        all.push(ch);
      }
      if (lineChars.length > 0) lines.push(lineChars);
    }
    if (lines.length === 0) return null;
    var maxLen = 0;
    for (var li = 0; li < lines.length; li++) {
      if (lines[li].length > maxLen) maxLen = lines[li].length;
    }
    var spec = {
      base: "__NAME_" + tag + "__",
      isLetterBlock: true,
      lines: lines,      // 단어별 글자 배열 — 그리기·치수 계산의 기준
      chars: all,        // 전체 글자 (조각 수·글리프 보고용)
      maxLen: maxLen,    // 가장 긴 줄의 글자 수 = 블록 폭을 정한다
      aspect: 1
    };
    return _letterBlockResize(spec, unitMm);
  }

  function _letterBlockResize(spec, unitMm) {
    var unit = unitMm * MM_TO_PT;
    var gap = unit * LETTER_GAP_RATIO;
    spec.unitMm = unitMm;
    spec.unit = unit;
    spec.innerGap = gap;
    spec.cellW = spec.maxLen * unit + (spec.maxLen - 1) * gap;
    spec.cellH = spec.lines.length * unit + (spec.lines.length - 1) * gap;
    return spec;
  }

  function _letterUnitToFit(n, wPt) {
    var denom = n + (n - 1) * LETTER_GAP_RATIO;
    if (denom <= 0) return LETTER_UNIT_MM;
    return (wPt / denom) / MM_TO_PT;
  }

  function _moveLetterBlocksToRowEnd(rows) {
    for (var r = 0; r < rows.length; r++) {
      var items = rows[r].items;
      var keep = [];
      var blocks = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].payload && items[i].payload.isLetterBlock) blocks.push(items[i]);
        else keep.push(items[i]);
      }
      if (blocks.length === 0) continue;
      rows[r].items = keep.concat(blocks);
    }
  }

  function _itemBases(item) {
    var out = [];
    if (item.isComposite && item.cells) {
      for (var k = 0; k < item.cells.length; k++) {
        var cp = item.cells[k].payload;
        if (cp && !cp.isLetterBlock) out.push(cp.base);
      }
    } else if (item.isVStack && item.cells) {
      for (var c = 0; c < item.cells.length; c++) {
        if (item.cells[c].payload) out.push(item.cells[c].payload.base);
      }
    } else if (item.payload) {
      out.push(item.payload.base);
    }
    return out;
  }

  function _packBoxWithPairs(pairs, boxW, boxH, gap, canUse) {
    var cells = [];
    if (!pairs || pairs.length === 0 || boxW <= 0 || boxH <= 0) return cells;
    var used = {};
    var y = 0;
    var spins = 0;
    while (y < boxH && spins++ < 60) {
      var shelf = [];
      var x = 0, shelfH = 0;
      while (shelf.length < 24) {
        var best = -1, bestKey = 0;
        for (var i = 0; i < pairs.length; i++) {
          var p = pairs[i];
          var nx = shelf.length === 0 ? p.cellW : x + gap + p.cellW;
          if (nx > boxW) continue;
          var nh = p.cellH > shelfH ? p.cellH : shelfH;
          if (y + nh > boxH) continue;
          if (canUse && !canUse(p, used)) continue;
          var key = (used[p.base] || 0) * 1000000000 - p.cellW * p.cellH;
          if (best < 0 || key < bestKey) { best = i; bestKey = key; }
        }
        if (best < 0) break;
        var pick = pairs[best];
        var dx = shelf.length === 0 ? 0 : x + gap;
        // payload 래퍼 지원: 전 사이즈는 같은 pair 를 크기별 후보로 여러 개 만든다.
        shelf.push({ dx: dx, dy: y, w: pick.cellW, h: pick.cellH,
                     payload: pick.payload ? pick.payload : pick });
        x = dx + pick.cellW;
        if (pick.cellH > shelfH) shelfH = pick.cellH;
        used[pick.base] = (used[pick.base] || 0) + 1;
      }
      if (shelf.length === 0) break;
      for (var s2 = 0; s2 < shelf.length; s2++) {
        shelf[s2].dy = y + (shelfH - shelf[s2].h) / 2;   // 줄 안에서 세로 가운데
        cells.push(shelf[s2]);
      }
      y += shelfH + gap;
    }
    return cells;
  }

  function _fillUnderLetterBlocks(rows, pairs, gap, canUse) {
    var addedCells = [];
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var i = 0; i < row.items.length; i++) {
        var it = row.items[i];
        if (it.isComposite) continue;                       // 이미 채움
        if (!it.payload || !it.payload.isLetterBlock) continue;
        var availH = row.h - it.h - gap;
        if (availH <= 0) continue;
        var cells = _packBoxWithPairs(pairs, it.w, availH, gap, canUse);
        if (cells.length === 0) continue;
        var comp = [{ dx: 0, dy: 0, w: it.w, h: it.h, payload: it.payload }];
        var bottom = it.h;
        for (var c = 0; c < cells.length; c++) {
          cells[c].dy += it.h + gap;
          comp.push(cells[c]);
          if (cells[c].dy + cells[c].h > bottom) bottom = cells[c].dy + cells[c].h;
          addedCells.push(cells[c]);
        }
        row.items[i] = {
          isComposite: true,
          w: it.w,
          h: bottom,
          cells: comp,
          payload: it.payload      // 이름 블록 판정(_moveLetterBlocksToRowEnd 등)이 계속 통하도록
        };
      }
    }
    return addedCells;
  }

  function _lastCopyGuard(counts) {
    return function (item, planned) {
      var bases = _itemBases(item);
      for (var i = 0; i < bases.length; i++) {
        var b = bases[i];
        if (counts[b] == null) continue;
        var already = 0;
        for (var q = 0; q < planned.length; q++) {
          var pb = _itemBases(planned[q]);
          for (var j = 0; j < pb.length; j++) if (pb[j] === b) already++;
        }
        if (counts[b] - already <= 1) return false;
      }
      return true;
    };
  }

  function _evictForLetterBlock(rows, block, binW, binH, gap, canEvict, onEvict) {
    var unitBased = !!(block.shapes && block.shapes.length > 0);
    var shapes = unitBased
      ? block.shapes
      : [{ unitMm: block.unitMm, w: block.cellW, h: block.cellH }];

    var first = _searchEvictSlot(rows, shapes, binW, binH, gap, canEvict);
    var bestRow = first.row, bestShape = first.shape, bestCut = first.cut;

    // 정상 단계로 못 찾았고 유닛 기반(알파벳)이면 **마지막 수단** 단계로 한 번 더.
    // 2단으로 나눈 이유: 한 목록에 섞으면 "적게 빼는" 점수가 작은 유닛을 먼저 뽑아
    // 멀쩡히 들어갈 자리에도 글자가 작아진다.
    if (bestRow < 0 && unitBased) {
      var tight = [];
      for (var ti = 0; ti < LETTER_UNIT_TIGHT_STEPS_MM.length; ti++) {
        var tu = LETTER_UNIT_TIGHT_STEPS_MM[ti] * MM_TO_PT;
        var tg = tu * LETTER_GAP_RATIO;
        tight.push({
          unitMm: LETTER_UNIT_TIGHT_STEPS_MM[ti],
          w: block.maxLen * tu + (block.maxLen - 1) * tg,
          h: block.lines.length * tu + (block.lines.length - 1) * tg
        });
      }
      var deep = _searchEvictSlot(rows, tight, binW, binH, gap, canEvict);
      bestRow = deep.row; bestShape = deep.shape; bestCut = deep.cut;
    }
    if (bestRow < 0) return -1;

    var target = rows[bestRow];
    for (var e = 0; e < bestCut; e++) {
      var gone = target.items.pop();
      if (onEvict) onEvict(gone);      // 호출부가 카운트를 맞춘다 (min 판정의 SOT)
    }
    _recalcShelfRow(target, gap);
    if (unitBased) _letterBlockResize(block, bestShape.unitMm);
    _addToShelfRow(target, { w: block.cellW, h: block.cellH, payload: block, rotated: false }, gap);
    return bestCut;
  }

  function _searchEvictSlot(rows, shapes, binW, binH, gap, canEvict) {
    // 행을 키워야 하는 경우를 판정하려면 전체 높이를 알아야 한다. 여러 줄 이름
    // ("Anne Marie Kim" = 3줄 35mm) 은 1인치 행(25.4mm)보다 높아서, 행 키우기를
    // 금지하면 어느 행에도 못 들어간다.
    var sumH = 0;
    for (var hs = 0; hs < rows.length; hs++) sumH += rows[hs].h;

    var bestRow = -1, bestShape = null, bestCut = -1;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      if (row.items.length === 0) continue;
      for (var sh = 0; sh < shapes.length; sh++) {
        var cand = shapes[sh];
        if (cand.w > binW) continue;
        // 행이 커지면 아래 행이 밀린다 — 시트가 그만큼을 흡수할 수 있을 때만 허용.
        // (row.h 는 뺀 뒤 더 낮아질 수 있으므로 이 판정은 보수적이다 = 안전하다)
        var grow = cand.h > row.h ? cand.h - row.h : 0;
        if (grow > 0 && sumH + grow + (rows.length - 1) * gap > binH) continue;
        var w = row.w, blocked = false;
        var planned = [];        // 이번 시도에서 뺄 아이템 — 보호 조건이 같이 본다
        var k = row.items.length - 1;
        while (w + gap + cand.w > binW && k >= 0) {
          var vic = row.items[k];
          // 이미 붙은 이름 블록은 못 뺀다. 보호 조건(전 사이즈 ≥1장 보장)도 여기서 본다.
          // **planned 를 같이 넘기는 이유**: 후보를 여러 번 시도하므로 보호 조건이
          // 상태를 들고 있으면 안 된다 (시도마다 카운트가 깎여 오판한다).
          if ((vic.payload && vic.payload.isLetterBlock) || (canEvict && !canEvict(vic, planned))) {
            blocked = true;
            break;
          }
          w -= vic.w + gap;
          planned.push(vic);
          k--;
        }
        if (blocked) continue;
        if (w + gap + cand.w > binW) continue;   // 다 빼도 안 들어감
        var cut = planned.length;
        if (bestRow < 0 || cut < bestCut ||
            (cut === bestCut && bestShape && cand.unitMm > bestShape.unitMm)) {
          bestRow = r; bestShape = cand; bestCut = cut;
        }
      }
    }
    return { row: bestRow, shape: bestShape, cut: bestCut };
  }

  function _recalcShelfRow(row, gap) {
    var w = 0, h = 0;
    for (var i = 0; i < row.items.length; i++) {
      w = (i === 0) ? row.items[i].w : w + gap + row.items[i].w;
      if (row.items[i].h > h) h = row.items[i].h;
    }
    row.w = w;
    row.h = h;
  }

  function _letterShapeCandidates(block) {
    var out = [];
    for (var i = 0; i < LETTER_UNIT_STEPS_MM.length; i++) {
      var u = LETTER_UNIT_STEPS_MM[i] * MM_TO_PT;
      var g = u * LETTER_GAP_RATIO;
      out.push({
        unitMm: LETTER_UNIT_STEPS_MM[i],
        w: block.maxLen * u + (block.maxLen - 1) * g,
        h: block.lines.length * u + (block.lines.length - 1) * g
      });
    }
    return out;
  }

  function _nfcHangul(s) {
    if (!s) return s;
    var out = "";
    var i = 0;
    while (i < s.length) {
      var L = s.charCodeAt(i);
      if (L >= 0x1100 && L <= 0x1112 && i + 1 < s.length) {
        var V = s.charCodeAt(i + 1);
        if (V >= 0x1161 && V <= 0x1175) {
          var Tidx = 0;
          var step = 2;
          if (i + 2 < s.length) {
            var T = s.charCodeAt(i + 2);
            if (T >= 0x11A8 && T <= 0x11C2) { Tidx = T - 0x11A7; step = 3; }
          }
          out += String.fromCharCode(0xAC00 + ((L - 0x1100) * 21 + (V - 0x1161)) * 28 + Tidx);
          i += step;
          continue;
        }
      }
      out += s.charAt(i);
      i++;
    }
    return out;
  }

module.exports = { _tierBox: _tierBox, _newShelfRow: _newShelfRow, _snapPack: _snapPack, _heightsClose: _heightsClose, _canAddToShelfRow: _canAddToShelfRow, _addToShelfRow: _addToShelfRow, _tryAddToBandRow: _tryAddToBandRow, _placeBanded: _placeBanded, _pkgMin: _pkgMin, _pkgMax: _pkgMax, _buildTierColumn: _buildTierColumn, _pairPlacedInRows: _pairPlacedInRows, _sortedPairsForShelf: _sortedPairsForShelf, _shelfRowsToPlaced: _shelfRowsToPlaced, _packPackage: _packPackage, _bucketOf: _bucketOf, _dealBuckets: _dealBuckets, _assignTiers: _assignTiers, _resetPackState: _resetPackState, _sheetFill: _sheetFill, _trialLadder: _trialLadder, _planPackageSheets: _planPackageSheets, _traceSignature: _traceSignature, _cutCacheFileFor: _cutCacheFileFor, _cutCacheFingerprint: _cutCacheFingerprint, _subpathsOf: _subpathsOf, _writeCutCache: _writeCutCache, _readCutCache: _readCutCache, _rebuildCutline: _rebuildCutline, _attachLetterBlock: _attachLetterBlock, _letterBlockSpec: _letterBlockSpec, _letterBlockResize: _letterBlockResize, _letterUnitToFit: _letterUnitToFit, _moveLetterBlocksToRowEnd: _moveLetterBlocksToRowEnd, _itemBases: _itemBases, _packBoxWithPairs: _packBoxWithPairs, _fillUnderLetterBlocks: _fillUnderLetterBlocks, _lastCopyGuard: _lastCopyGuard, _evictForLetterBlock: _evictForLetterBlock, _searchEvictSlot: _searchEvictSlot, _recalcShelfRow: _recalcShelfRow, _letterShapeCandidates: _letterShapeCandidates, _nfcHangul: _nfcHangul, MM_TO_PT: MM_TO_PT, BODY_PADDING_MM: BODY_PADDING_MM, GAP_DEFAULT_MM: GAP_DEFAULT_MM, BAND_CELL_TOL: BAND_CELL_TOL, TIER_SIZE_MM: TIER_SIZE_MM, TIER_DEFAULT: TIER_DEFAULT, PKG_COUNT_BY_TIER: PKG_COUNT_BY_TIER, BUCKETS: BUCKETS, BUCKET_TIERS: BUCKET_TIERS, TIER_TO_BUCKET: TIER_TO_BUCKET, PACKAGE_LADDERS: PACKAGE_LADDERS, PACKAGE_SHEET_VALUES: PACKAGE_SHEET_VALUES, PACKAGE_SHEET_DEFAULT_INDEX: PACKAGE_SHEET_DEFAULT_INDEX, ORPHAN_FILL_MIN_WIDTH: ORPHAN_FILL_MIN_WIDTH, NAME_BIG_H_MM: NAME_BIG_H_MM, NAME_CALLI_COUNT: NAME_CALLI_COUNT, LETTER_UNIT_MM: LETTER_UNIT_MM, LETTER_GAP_RATIO: LETTER_GAP_RATIO, LETTER_UNIT_STEPS_MM: LETTER_UNIT_STEPS_MM, LETTER_UNIT_MIN_MM: LETTER_UNIT_MIN_MM, LETTER_UNIT_TIGHT_STEPS_MM: LETTER_UNIT_TIGHT_STEPS_MM, NAME_SMALL_H_MM: NAME_SMALL_H_MM, NAME_HALO_RATIO: NAME_HALO_RATIO, CUT_CACHE_FORMAT: CUT_CACHE_FORMAT, CUT_CACHE_DIRNAME: CUT_CACHE_DIRNAME, TRACE_OPTS: TRACE_OPTS };