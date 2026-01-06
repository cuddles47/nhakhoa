const assert = require('assert');
const storage = require('./storage');

(async () => {
  // Test computeHash determinism
  const b1 = Buffer.from('hello world');
  const b2 = Buffer.from('hello world');
  const h1 = storage.computeHash(b1);
  const h2 = storage.computeHash(b2);
  assert.strictEqual(h1, h2, 'Hashes should be deterministic and equal for identical buffers');

  const b3 = Buffer.from('different');
  const h3 = storage.computeHash(b3);
  assert.notStrictEqual(h1, h3, 'Different buffers should have different hashes');

  console.log('Storage.computeHash tests passed');

  // Note: ensureUploadByHash requires MinIO to be running; this basic test only ensures the function exists
  assert.strictEqual(typeof storage.ensureUploadByHash, 'function', 'ensureUploadByHash should be exported');
  console.log('Presence test for ensureUploadByHash passed (integration with MinIO not executed)');
})();