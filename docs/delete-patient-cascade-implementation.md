# Delete Patient Cascade - Implementation Report

## Branch

`feature/detele-patient`

The requested branch name contained a space, which Git does not allow. It was normalized to the name above while preserving the requested `detele` spelling.

## 1. Problem

`DELETE /api/patients/:id` previously called `Patient.delete()`, which only set `patients.deleted_at`. Related visits, images, annotations, processing jobs, and MinIO objects remained in place.

The database already cascaded most relationships:

- `patients -> cases -> case_doctors`
- `patients -> visits -> images`
- `images -> image_annotations -> annotation_history`
- `images -> image_validations`
- `images -> subboxes` and `images -> labels`

However, `processing_jobs.visit_id` used the default `NO ACTION` delete rule and blocked hard deletion of visits with processing history.

MinIO cleanup also needs special handling:

- Visit-owned files normally live below `visits/{visitId}/`.
- Image metadata points to MinIO through `images.url` and `images.url_processed`.
- COCO metadata points to MinIO through `visits.annotation_file_url`.
- Processed images use content-addressed paths such as `processed_by_hash/{hash}.jpg` and may be shared by multiple image records.

## 2. Proposed changes

1. Replace the patient endpoint's soft-delete behavior with a coordinated hard-delete service.
2. Add `ON DELETE CASCADE` to `processing_jobs.visit_id`.
3. Lock the patient and its related records in a PostgreSQL transaction.
4. Refuse deletion with HTTP `409` while a BullMQ image-processing job is active.
5. Remove non-active retained BullMQ jobs before deleting their database records.
6. Collect MinIO objects from database URLs and from every visit prefix.
7. Preserve objects still referenced outside the patient being deleted.
8. Roll back PostgreSQL when MinIO cleanup fails.
9. Warn users in the frontend that visits, images, annotations, and objects are permanently deleted.

## 3. Implementation

### Backend orchestration

`backend/src/services/patientDeletionService.js` now performs the deletion workflow:

1. Validate the patient ID.
2. Start a transaction and lock the patient with `FOR UPDATE`.
3. Load all visits, image URLs, annotation URLs, dependency counts, and processing jobs.
4. List MinIO objects below each `visits/{visitId}/` prefix to include replaced or orphaned visit files.
5. Normalize relative URLs, absolute URLs, and presigned URLs into MinIO object names.
6. Exclude object names referenced by images or visits outside the target patient.
7. Reject active jobs and remove non-active BullMQ jobs.
8. Hard-delete the patient; PostgreSQL cascades the dependent rows.
9. Delete the selected MinIO objects in batches of 1,000.
10. Commit only after MinIO cleanup succeeds.

The controller returns structured HTTP errors:

- `400 INVALID_PATIENT_ID`
- `404 PATIENT_NOT_FOUND`
- `409 PATIENT_PROCESSING_ACTIVE`
- `502 PATIENT_MINIO_LIST_FAILED` or `PATIENT_MINIO_DELETE_FAILED`
- `503 PATIENT_QUEUE_CLEANUP_FAILED`

The delete route now requires authentication because it permanently removes clinical data.

### Database

`init-db/009_cascade_processing_jobs_on_visit_delete.sql` changes the processing job foreign key to `ON DELETE CASCADE`. The migration is idempotent.

For an existing database volume, apply it explicitly:

```powershell
docker exec -i nhakhoa-postgres psql -v ON_ERROR_STOP=1 -U postgres -d dental_db -f /docker-entrypoint-initdb.d/009_cascade_processing_jobs_on_visit_delete.sql
```

Adding the file alone does not migrate an existing volume because PostgreSQL's Docker initialization directory only runs for a new data directory.

### MinIO storage

`backend/src/services/storage.js` now provides:

- `extractObjectName()` for relative, absolute, and presigned URLs.
- `listFilesByPrefix()` for visit-level orphan cleanup.
- Deduplicated, batched `deleteFiles()` with a deletion count.

### Frontend

The active patient list now:

- States how many visits will be removed.
- Explicitly warns that images, annotations, and MinIO data are permanently deleted.
- Disables the selected delete button while the request is running.
- Displays the backend success or error message.

## 4. Results

### Automated unit tests

```powershell
cd backend
npm run test:unit
```

Passed scenarios:

- Complete patient deletion while preserving a shared processed object.
- HTTP `409` and rollback when a BullMQ job is active.
- Database rollback when MinIO deletion fails.
- Invalid patient ID rejected before opening a database connection.
- Relative, absolute, and presigned MinIO URL normalization.

Result: `5 passed, 0 failed`, plus the existing subbox mapper tests.

### PostgreSQL and MinIO integration test

```powershell
$env:RUN_PATIENT_DELETE_INTEGRATION='true'
node --test src/services/patientDeletionService.integration.test.js
```

The fixture created two patients and populated cases, case-doctors, visits, images, parent/child annotations, annotation history, subboxes, labels, validations, a processing job, visit-prefixed MinIO objects, and a processed object shared between both patients.

Verified results:

- Every target database row was removed through the cascade.
- The unrelated patient and its raw object remained.
- Raw, annotation, replaced/orphaned visit objects were removed.
- The processed object shared by the second patient remained.
- The fixture cleaned itself up after the test.

Result: `1 passed, 0 failed`.

### HTTP verification

The running backend was tested through the public workflow:

1. Log in as a local user.
2. Send authenticated `DELETE /api/patients/:id`.
3. Receive a successful response with deletion statistics.
4. Query PostgreSQL and confirm the patient row count is `0`.

### Build and static checks

- Backend syntax checks passed.
- `git diff --check` passed.
- Frontend production build passed with 159 modules transformed.
- Live database constraint reports `processing_jobs_visit_id_fkey: CASCADE`.

## 5. Review of changes

### Files added

- `backend/src/services/patientDeletionService.js`
- `backend/src/services/patientDeletionService.test.js`
- `backend/src/services/patientDeletionService.integration.test.js`
- `init-db/009_cascade_processing_jobs_on_visit_delete.sql`
- `docs/delete-patient-cascade-implementation.md`

### Files updated

- `backend/src/controllers/PatientController.js`
- `backend/src/models/Patient.js`
- `backend/src/routes/api.js`
- `backend/src/services/storage.js`
- `backend/package.json`
- `frontend/src/components/PatientList.jsx`
- `frontend/src/services/patientService.js`
- `frontend/src/features/patients/hooks/usePatients.js`
- `frontend/src/features/patients/pages/PatientDetailPage.jsx`

### Known transaction boundary

PostgreSQL and MinIO cannot participate in one atomic transaction. The implementation deletes database rows inside an uncommitted transaction, deletes MinIO objects, and commits afterward. A normal MinIO failure rolls back the database. A process crash after MinIO deletion but before PostgreSQL commit remains a distributed-system edge case and would require an outbox/saga or MinIO versioning for complete recovery guarantees.

Abandoned presigned uploads that were never confirmed and are neither stored in database metadata nor placed below a visit prefix cannot be associated safely with a patient. Those objects require a separate age-based orphan cleanup process.
