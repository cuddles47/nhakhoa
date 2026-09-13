/**
 * Attach YOLO labels from /projects/nhakhoa/patient_add_0001/labels/
 * to existing visit 625 (patient 344, "Bệnh Nhân #0001").
 *
 * Usage: node scripts/attachYoloToVisit625.js
 */
require('dotenv').config();
const { attachYoloLabelsToVisit } = require('../src/services/yoloImportService');

const VISIT_ID = 625;
const LABELS_DIR = '/projects/nhakhoa/patient_add_0001/labels';
const ALIAS_MAP = { 'patient_add_0001_GTD': 'patient_add_0001_GCD' };

(async () => {
  try {
    console.log(`Attaching labels to visit ${VISIT_ID}...`);
    const stats = await attachYoloLabelsToVisit(VISIT_ID, LABELS_DIR, {
      aliasMap: ALIAS_MAP,
      idempotent: true,
    });

    console.log('\n=== RESULT ===');
    console.log(JSON.stringify(stats, null, 2));

    const { images, annotations } = stats;
    console.log(`\nImages: ${images.annotated} annotated, ${images.skipped} skipped, ${images.emptyLabel} empty`);
    console.log(`Annotations: ${annotations.teeth} teeth, ${annotations.subboxes} subboxes, ${annotations.skippedLines} skipped lines`);
    if (images.errors.length) console.log('Errors:', images.errors);

    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
})();
