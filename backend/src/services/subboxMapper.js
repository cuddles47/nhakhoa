/**
 * Subbox mapper utilities
 * - bboxIoU(boxA, boxB): compute IoU for boxes in [x,y,w,h]
 * - assignSubboxesToParents(subboxes, parents, options): assign each subbox to best parent by IoU
 * - computeRegion(parentBbox, subbox): compute quadrant region name based on centers
 */

function bboxIoU(a, b) {
  // a,b: [x, y, w, h]
  const ax1 = a[0];
  const ay1 = a[1];
  const ax2 = a[0] + a[2];
  const ay2 = a[1] + a[3];

  const bx1 = b[0];
  const by1 = b[1];
  const bx2 = b[0] + b[2];
  const by2 = b[1] + b[3];

  const interX1 = Math.max(ax1, bx1);
  const interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interW = Math.max(0, interX2 - interX1);
  const interH = Math.max(0, interY2 - interY1);
  const interArea = interW * interH;

  const areaA = a[2] * a[3];
  const areaB = b[2] * b[3];

  const union = areaA + areaB - interArea;
  return union === 0 ? 0 : interArea / union;
}

function computeRegion(parentBbox, subbox) {
  // parentBbox: [x,y,w,h], subbox: { x,y,w,h }
  const px = parentBbox[0];
  const py = parentBbox[1];
  const pw = parentBbox[2];
  const ph = parentBbox[3];

  const parentCx = px + pw / 2;
  const parentCy = py + ph / 2;

  const subCx = subbox.x + subbox.w / 2;
  const subCy = subbox.y + subbox.h / 2;

  const left = subCx < parentCx;
  const top = subCy < parentCy;

  if (top && left) return 'top_left';
  if (top && !left) return 'top_right';
  if (!top && left) return 'bottom_left';
  return 'bottom_right';
}

/**
 * Assign subboxes to parents using IoU. Returns { assignments: Map(parentId -> [subboxes]), skipped: [subbox] }
 * options: { iouThreshold: 0.05 }
 */
function assignSubboxesToParents(subboxes, parents, options = {}) {
  const iouThreshold = options.iouThreshold ?? 0.01; // permissive by default
  const assignments = new Map();
  const skipped = [];

  if (!Array.isArray(subboxes) || !Array.isArray(parents)) {
    throw new Error('Invalid arguments to assignSubboxesToParents');
  }

  for (const s of subboxes) {
    let bestParent = null;
    let bestIoU = 0;

    for (const p of parents) {
      // p.bbox is expected [x,y,w,h]
      const pbox = p.bbox;
      const sbox = [s.x, s.y, s.w, s.h];
      const iou = bboxIoU(pbox, sbox);
      if (iou > bestIoU) {
        bestIoU = iou;
        bestParent = p;
      }
    }

    if (bestParent && bestIoU >= iouThreshold) {
      const arr = assignments.get(bestParent.id) || [];
      arr.push({ ...s, iou: bestIoU });
      assignments.set(bestParent.id, arr);
    } else {
      skipped.push({ ...s, bestIoU, bestParentId: bestParent?.id ?? null });
    }
  }

  return { assignments, skipped };
}

module.exports = {
  bboxIoU,
  computeRegion,
  assignSubboxesToParents
};
