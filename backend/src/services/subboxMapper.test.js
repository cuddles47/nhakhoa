const { assignSubboxesToParents, computeRegion } = require('./subboxMapper');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function approxEqual(a, b, eps = 1e-6) {
  return Math.abs(a - b) < eps;
}

async function runTests() {
  console.log('Running subboxMapper tests...');

  const parents = [
    { id: 1, bbox: [0, 0, 100, 100] },
    { id: 2, bbox: [200, 0, 100, 100] }
  ];

  const subboxes = [
    { classId: 0, x: 10, y: 10, w: 20, h: 20 }, // top_left of parent 1
    { classId: 1, x: 70, y: 70, w: 20, h: 20 }, // bottom_right of parent 1
    { classId: 0, x: 210, y: 10, w: 20, h: 20 } // top_left of parent 2
  ];

  const { assignments, skipped } = assignSubboxesToParents(subboxes, parents, { iouThreshold: 0.001 });

  // Expect 2 parents with assignments
  assert(assignments.size === 2, `Expected 2 parents assigned, got ${assignments.size}`);

  const a1 = assignments.get(1);
  const a2 = assignments.get(2);

  assert(a1 && a1.length === 2, `Expected parent 1 to have 2 subboxes, got ${a1?.length}`);
  assert(a2 && a2.length === 1, `Expected parent 2 to have 1 subbox, got ${a2?.length}`);

  const r1 = computeRegion(parents[0].bbox, a1[0]);
  const r2 = computeRegion(parents[0].bbox, a1[1]);
  const r3 = computeRegion(parents[1].bbox, a2[0]);

  assert(r1 === 'top_left', `Expected region top_left, got ${r1}`);
  assert(r2 === 'bottom_right', `Expected region bottom_right, got ${r2}`);
  assert(r3 === 'top_left', `Expected region top_left, got ${r3}`);

  assert(skipped.length === 0, `Expected no skipped subboxes, got ${skipped.length}`);

  console.log('✓ subboxMapper tests passed');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;