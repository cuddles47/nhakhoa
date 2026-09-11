/**
 * Test script for stained image validator
 * Run with: node backend/src/services/test_stainedValidator.js
 */

const validator = require('./stainedImageValidator');

console.log('=== Testing Stained Image Validator ===\n');

// Test 1: Position name normalization
console.log('Test 1: Position Name Normalization');
const testPositions = [
  'top-right',
  'Top_Right',
  'upper-right',
  'UPPER_RIGHT',
  'Central-middle',
  'center',
  'bottom_left',
  'duoi-phai',
  'G',
  'P',
  'T',
  'PCD',
  'GCD',
  'TCD',
  'PCT',
  'GCT',
  'TCT'
];

testPositions.forEach(posName => {
  const result = validator.normalizePositionName(posName);
  console.log(`  "${posName}" → ${result ? `${result.type} (${result.label})` : 'NULL'}`);
});

// Test 2: Filename parsing
console.log('\nTest 2: Filename Parsing');
const testFilenames = [
  'Patient_0061_28-10-2025_Top-right.jpg',
  'Patient_0062_25-11-2025_Central-middle_JPG.rf.bb04f805bdd851b5a72f6befee533f0e.jpg',
  'Patient_0063_15-12-2025_Bottom_left.png',
  'Patient_0064_01-01-2026_InvalidPosition.jpg',
  'invalid_filename.jpg',
  'patient_add_0001_G.jpg',
  'patient_add_0055_TCD.jpg',
  'patient_add_0002_P.jpg',
  'patient_add_0010_GCT.jpg',
  'patient_add_9999_ZZ.jpg',
  'patient_add_123.jpg'
];

testFilenames.forEach(filename => {
  const result = validator.parseStainedFilename(filename);
  if (result) {
    console.log(`  ✓ ${filename}`);
    console.log(`    Patient: ${result.patientId}, Date: ${result.date}, Position: ${result.position.label}`);
  } else {
    console.log(`  ✗ ${filename} - Parse failed`);
  }
});

// Test 3: Missing position detection
console.log('\nTest 3: Missing Position Detection');
const mockParsedImages = [
  { position: { type: 'upper_right' } },
  { position: { type: 'upper_center' } },
  { position: { type: 'middle_center' } },
  { position: { type: 'lower_left' } }
];

const positionAnalysis = validator.detectMissingPositions(mockParsedImages);
console.log(`  Total positions: ${positionAnalysis.total}`);
console.log(`  Uploaded: ${positionAnalysis.uploadedCount}`);
console.log(`  Missing: ${positionAnalysis.missingCount}`);
console.log(`  Complete: ${positionAnalysis.complete ? 'Yes' : 'No'}`);
console.log(`  Missing positions: ${positionAnalysis.missingDetails.map(p => p.label).join(', ')}`);

// Test 4: Position mapping
console.log('\nTest 4: Position Mapping (with duplicates)');
const mockParsedWithDupes = [
  { position: { type: 'upper_right' }, file: { originalname: 'file1.jpg' } },
  { position: { type: 'upper_center' }, file: { originalname: 'file2.jpg' } },
  { position: { type: 'upper_right' }, file: { originalname: 'file3.jpg' } }, // Duplicate
  { position: { type: 'lower_left' }, file: { originalname: 'file4.jpg' } }
];

const { byPosition, duplicates } = validator.mapImagesToPositions(mockParsedWithDupes);
console.log(`  Unique positions: ${Object.keys(byPosition).length}`);
console.log(`  Duplicates found: ${Object.keys(duplicates).length}`);
if (Object.keys(duplicates).length > 0) {
  Object.entries(duplicates).forEach(([type, images]) => {
    console.log(`    - ${type}: ${images.length + 1} images (keeping last one)`);
  });
}

console.log('\n=== All Tests Complete ===');
