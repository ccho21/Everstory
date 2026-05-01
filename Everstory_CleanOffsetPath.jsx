// Everstory — Clean Offset Path interiors (v1)
//
// 선택한 Offset Path / CompoundPath 결과에서 내부 구멍 subpath를 삭제한다.
// 저장하지 않고 열린 문서의 선택 객체만 정리한다.
//
// 사용법:
//   1. Illustrator에서 Offset Path 결과 또는 CutContour 후보 path를 선택
//   2. File → Scripts → Other Script → Everstory_CleanOffsetPath.jsx 실행

// #target illustrator

(function () {
  "use strict";

  if (app.documents.length === 0) {
    alert("열린 Illustrator 문서가 없습니다.");
    return;
  }

  var doc = app.activeDocument;
  var sel = doc.selection;
  if (!sel || sel.length === 0) {
    alert("정리할 Offset Path 또는 CompoundPath를 선택하세요.");
    return;
  }

  var removed = 0;
  for (var i = 0; i < sel.length; i++) {
    removed += _cleanItem(sel[i]);
  }

  alert("완료: 내부 조각 " + removed + "개를 제거했습니다.");

  function _cleanItem(item) {
    if (!item) return 0;

    try {
      if (item.typename === "CompoundPathItem") return _removeContainedSubpaths(item);

      if (item.typename === "GroupItem") {
        var count = _removeContainedPageItems(item);
        for (var i = 0; i < item.pageItems.length; i++) {
          count += _cleanItem(item.pageItems[i]);
        }
        return count;
      }
    } catch (e) {}

    return 0;
  }

  function _removeContainedSubpaths(compound) {
    try {
      if (!compound.pathItems || compound.pathItems.length < 2) return 0;

      var paths = [];
      var largestAbsArea = 0;
      var outerSign = 0;

      for (var i = 0; i < compound.pathItems.length; i++) {
        var p = compound.pathItems[i];
        var area = _safeArea(p);
        var absArea = Math.abs(area);
        if (absArea > largestAbsArea) {
          largestAbsArea = absArea;
          outerSign = _sign(area);
        }
        paths.push({ item: p, bounds: p.geometricBounds, sign: _sign(area), remove: false });
      }

      _markContained(paths, outerSign);
      return _removeMarked(paths);
    } catch (e) {}
    return 0;
  }

  function _removeContainedPageItems(group) {
    try {
      if (!group.pageItems || group.pageItems.length < 2) return 0;

      var items = [];
      var largestAbsArea = 0;
      var outerSign = 0;

      for (var i = 0; i < group.pageItems.length; i++) {
        var it = group.pageItems[i];
        if (it.typename !== "PathItem" && it.typename !== "CompoundPathItem") continue;

        var area = _itemArea(it);
        var absArea = Math.abs(area);
        if (absArea > largestAbsArea) {
          largestAbsArea = absArea;
          outerSign = _sign(area);
        }
        items.push({ item: it, bounds: it.geometricBounds, sign: _sign(area), remove: false });
      }

      _markContained(items, outerSign);
      return _removeMarked(items);
    } catch (e) {}
    return 0;
  }

  function _markContained(items, outerSign) {
    for (var p = 0; p < items.length; p++) {
      for (var q = 0; q < items.length; q++) {
        if (p === q) continue;
        if (_boundsContain(items[q].bounds, items[p].bounds, 0.3)) {
          if (outerSign === 0 || items[p].sign === 0 || items[p].sign !== outerSign) {
            items[p].remove = true;
          }
          break;
        }
      }
    }
  }

  function _removeMarked(items) {
    var keepCount = 0;
    var removed = 0;

    for (var i = 0; i < items.length; i++) {
      if (!items[i].remove) keepCount++;
    }
    if (keepCount === 0) return 0;

    for (var r = items.length - 1; r >= 0; r--) {
      if (items[r].remove) {
        try {
          items[r].item.remove();
          removed++;
        } catch (eRemove) {}
      }
    }
    return removed;
  }

  function _boundsContain(outer, inner, tol) {
    return inner[0] >= outer[0] + tol &&
           inner[2] <= outer[2] - tol &&
           inner[1] <= outer[1] - tol &&
           inner[3] >= outer[3] + tol;
  }

  function _itemArea(item) {
    if (item.typename === "PathItem") return _safeArea(item);
    if (item.typename === "CompoundPathItem" && item.pathItems && item.pathItems.length > 0) {
      var largest = 0;
      var largestSigned = 0;
      for (var i = 0; i < item.pathItems.length; i++) {
        var area = _safeArea(item.pathItems[i]);
        if (Math.abs(area) > largest) {
          largest = Math.abs(area);
          largestSigned = area;
        }
      }
      return largestSigned;
    }
    return 0;
  }

  function _safeArea(pathItem) {
    try { return pathItem.area; } catch (e) {}
    return 0;
  }

  function _sign(n) {
    return n > 0 ? 1 : (n < 0 ? -1 : 0);
  }

})();
