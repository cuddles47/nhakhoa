const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PatientDeletionError,
  createPatientDeletionService,
} = require('./patientDeletionService');

const extractObjectName = (value) => {
  if (!value) return null;
  let path = value;
  if (/^https?:\/\//.test(path)) path = new URL(path).pathname;
  path = path.split('?')[0].replace(/^\/+/, '');
  return path.startsWith('nhakhoa/') ? path.slice('nhakhoa/'.length) : path;
};

function createFixture(options = {}) {
  const queries = [];
  const deletedObjects = [];
  let released = false;

  const client = {
    async query(sql) {
      const compactSql = sql.replace(/\s+/g, ' ').trim();
      queries.push(compactSql);

      if (compactSql.startsWith('SELECT id, name FROM patients')) {
        return { rows: [{ id: 7, name: 'Patient 7' }] };
      }
      if (compactSql.startsWith('SELECT id, annotation_file_url FROM visits')) {
        return { rows: [{ id: 10, annotation_file_url: '/nhakhoa/visits/10/annotations/data.json' }] };
      }
      if (compactSql.startsWith('SELECT i.id, i.url, i.url_processed')) {
        return {
          rows: [{
            id: 20,
            url: '/nhakhoa/visits/10/raw.jpg',
            url_processed: '/nhakhoa/processed_by_hash/shared.jpg',
          }],
        };
      }
      if (compactSql.startsWith('SELECT (SELECT COUNT(*) FROM cases')) {
        return {
          rows: [{
            cases: 1,
            case_doctors: 1,
            annotations: 4,
            annotation_history: 2,
            image_validations: 1,
            subboxes: 4,
            labels: 4,
          }],
        };
      }
      if (compactSql.startsWith('SELECT id, bullmq_job_id, status')) {
        return {
          rows: [{ id: 30, bullmq_job_id: 'bull-30', status: options.jobState || 'completed' }],
        };
      }
      if (compactSql.startsWith('SELECT url AS value')) {
        return {
          rows: options.sharedProcessedObject === false
            ? []
            : [{ value: '/nhakhoa/processed_by_hash/shared.jpg' }],
        };
      }
      if (compactSql.startsWith('DELETE FROM patients')) {
        return { rows: [{ id: 7 }], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    },
    release() {
      released = true;
    },
  };

  const pool = {
    async connect() {
      return client;
    },
    async query() {
      return { rows: [], rowCount: 0 };
    },
  };

  const bullJob = {
    async getState() {
      return options.jobState || 'completed';
    },
    async remove() {
      if (options.removeJobError) throw new Error('remove failed');
    },
  };

  const queue = {
    async getJob() {
      return bullJob;
    },
  };

  const storage = {
    extractObjectName,
    async listFilesByPrefix() {
      return ['visits/10/raw.jpg', 'visits/10/orphaned-old-image.jpg'];
    },
    async deleteFiles(objectNames) {
      deletedObjects.push(...objectNames);
      if (options.minioDeleteFails) {
        return { success: false, error: 'MinIO unavailable' };
      }
      return { success: true, deletedCount: objectNames.length };
    },
  };

  const service = createPatientDeletionService({ pool, storage, queue });

  return {
    service,
    queries,
    deletedObjects,
    wasReleased: () => released,
  };
}

test('deletes patient graph and visit objects but preserves shared processed objects', async () => {
  const fixture = createFixture();
  const result = await fixture.service.deletePatient(7);

  assert.equal(result.deletedVisits, 1);
  assert.equal(result.deletedImages, 1);
  assert.equal(result.deletedAnnotations, 4);
  assert.equal(result.deletedMinioObjects, 3);
  assert.equal(result.preservedSharedObjects, 1);
  assert.deepEqual(
    new Set(fixture.deletedObjects),
    new Set([
      'visits/10/raw.jpg',
      'visits/10/annotations/data.json',
      'visits/10/orphaned-old-image.jpg',
    ])
  );
  assert.ok(!fixture.deletedObjects.includes('processed_by_hash/shared.jpg'));
  assert.ok(fixture.queries.includes('COMMIT'));
  assert.ok(fixture.wasReleased());
});

test('rejects deletion and rolls back while an image-processing job is active', async () => {
  const fixture = createFixture({ jobState: 'active' });

  await assert.rejects(
    () => fixture.service.deletePatient(7),
    (error) => error instanceof PatientDeletionError
      && error.statusCode === 409
      && error.code === 'PATIENT_PROCESSING_ACTIVE'
  );

  assert.ok(fixture.queries.includes('ROLLBACK'));
  assert.ok(!fixture.queries.some((sql) => sql.startsWith('DELETE FROM patients')));
  assert.equal(fixture.deletedObjects.length, 0);
  assert.ok(fixture.wasReleased());
});

test('rolls back database deletion when MinIO cleanup fails', async () => {
  const fixture = createFixture({ minioDeleteFails: true });

  await assert.rejects(
    () => fixture.service.deletePatient(7),
    (error) => error instanceof PatientDeletionError
      && error.statusCode === 502
      && error.code === 'PATIENT_MINIO_DELETE_FAILED'
  );

  assert.ok(fixture.queries.some((sql) => sql.startsWith('DELETE FROM patients')));
  assert.ok(fixture.queries.includes('ROLLBACK'));
  assert.ok(!fixture.queries.includes('COMMIT'));
  assert.ok(fixture.wasReleased());
});

test('rejects invalid patient ids before opening a database connection', async () => {
  const service = createPatientDeletionService({
    pool: {
      async connect() {
        assert.fail('Database should not be opened for an invalid patient id');
      },
    },
    storage: {},
    queue: {},
  });

  await assert.rejects(
    () => service.deletePatient('invalid'),
    (error) => error.statusCode === 400 && error.code === 'INVALID_PATIENT_ID'
  );
});

test('normalizes relative, absolute, and presigned MinIO URLs', () => {
  const { extractObjectName: extractStoredObjectName } = require('./storage');

  assert.equal(
    extractStoredObjectName('/nhakhoa/visits/123/raw.jpg'),
    'visits/123/raw.jpg'
  );
  assert.equal(
    extractStoredObjectName('http://localhost:9000/nhakhoa/visits/123/raw.jpg?signature=test'),
    'visits/123/raw.jpg'
  );
  assert.equal(
    extractStoredObjectName('visits/123/raw.jpg'),
    'visits/123/raw.jpg'
  );
  assert.equal(extractStoredObjectName('http://localhost:9000/nhakhoa/%E0%A4%A'), null);
});
