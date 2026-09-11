#!/usr/bin/env node
/**
 * Script import dataset YOLO từ disk vào hệ thống.
 * Usage:
 *   node src/scripts/importYolo.js /path/to/patient_add_0001
 *   node src/scripts/importYolo.js /path/to/folder-chua-nhieu-patient_add
 */
require('dotenv').config();
const yoloImportService = require('../services/yoloImportService');

async function main() {
  const sourcePath = process.argv[2];
  if (!sourcePath) {
    console.error('Usage: node src/scripts/importYolo.js <sourcePath>');
    console.error('  sourcePath: folder patient_add_XXXX (có images/ + labels/) hoặc folder base chứa nhiều patient_add_*');
    process.exit(1);
  }

  console.log(`Bắt đầu import YOLO từ: ${sourcePath}`);

  try {
    const results = await yoloImportService.importSourcePath(sourcePath);

    for (const r of results) {
      console.log('---');
      console.log(`Patient #${r.patientId}: ${r.patient ? r.patient.name : ''} (id=${r.patient ? r.patient.id : '-'})`);
      console.log(`Visit id=${r.visit.id} date=${r.visit.visit_date}`);
      console.log(`Images: imported=${r.images.imported}/${r.images.total}, skipped=${r.images.skipped}`);
      console.log(`Annotations: total=${r.annotations.total} (teeth=${r.annotations.teeth}, boxes=${r.annotations.subboxes}), images w/ ann=${r.annotations.imagesWithAnnotations}`);
      if (r.images.errors.length > 0) {
        console.log('Errors:');
        r.images.errors.forEach(e => console.log(`  - ${e}`));
      }
    }

    const totals = results.reduce((acc, r) => ({
      patients: acc.patients + 1,
      images: acc.images + r.images.imported,
      annotations: acc.annotations + r.annotations.total
    }), { patients: 0, images: 0, annotations: 0 });

    console.log('===');
    console.log(`Hoàn tất: ${totals.patients} patient, ${totals.images} ảnh, ${totals.annotations} annotation`);
  } catch (err) {
    console.error('Import thất bại:', err.message);
    process.exit(1);
  }
}

main();