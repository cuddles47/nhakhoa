# NhaKhoa Backend API Documentation

This document summarizes all API endpoints provided by the backend application.

Base URL (local dev): http://localhost:3000

---

## Summary
- Auth: token-based (Bearer token injected by `authenticate` middleware)
- File uploads: use `multipart/form-data` (multer, memoryStorage)
- Validators: request body validation is performed using Joi (see `backend/src/validators`)

---

## Routes

Note: routes that require authentication are marked with **(auth)**.

- GET `/` — Health / hello
- GET `/api/status` — App status

### Auth
- POST `/api/auth/login` — Login (returns token)
- POST `/api/auth/logout` — Logout
- GET `/api/auth/profile` — Get current user profile
- POST `/api/auth/refresh` — Refresh token

### Users
- GET `/api/users` — List users
- GET `/api/users/:id` — Get user by ID
- POST `/api/users` — Create user
- PUT `/api/users/:id` — Update user
- DELETE `/api/users/:id` — Delete user
- DELETE `/api/users` — Delete all users

### Patients
- GET `/api/patients` — List patients
- GET `/api/patients/search` — Search patients (query params)
- GET `/api/patients/:id` — Get patient by ID
- POST `/api/patients` — Create patient (validated by `patientValidator.create`)
- PUT `/api/patients/:id` — Update patient (validated by `patientValidator.update`)
- DELETE `/api/patients/:id` — Delete patient

### Visits
- GET `/api/visits` — List visits
- GET `/api/visits/:id` — Get visit by ID
- GET `/api/patients/:patientId/visits` — Get visits for a patient
- POST `/api/visits` — Create visit (validated by `visitValidator.create`)
- PUT `/api/visits/:id` — Update visit (validated by `visitValidator.update`)
- DELETE `/api/visits/:id` — Delete visit

### Images
- GET `/api/images` — List images (global)
- GET `/api/visits/:visitId/images` — Get images for a visit
- GET `/api/visits/:visitId/images/:category` — Get images by category (`raw` / `stained`)
- POST `/api/images` — Upload single image (multipart form: `image` file). Body validated by `imageValidator.create`.
- PUT `/api/images/:id/validation` — Update validation status (validated by `imageValidator.updateValidation`)
- POST `/api/images/:id/rotate` — Rotate image (multipart single file)
- DELETE `/api/images/:id` — Delete image

### Bulk Uploads
- POST `/api/bulk-upload` — Bulk upload (zip or many files). Uses `upload.any()`; expects `metadata` JSON in a form field.
- GET `/api/bulk-upload/history` — Recent bulk uploads summary

### Stained Uploads (simpler flow for staining images)
- POST `/api/bulk-upload/stained` — Upload stained images for an existing visit (multipart array `images`). Validates filenames and positions using `stainedImageValidator`.
- GET `/api/visits/:visitId/stained-upload-status` — Get stained upload status for visit
- GET `/api/patients/:patientId/available-visits` — Visits available for stained upload (those with RAW images)

### Image Processing
- POST `/api/visits/:visitId/process-images` — Trigger server-side image processing pipeline
- GET `/api/visits/:visitId/processing-status` — Get processing status

### Annotations
- GET `/api/images/:imageId/annotations` — Get annotations for an image
- PUT `/api/annotations/:annotationId/plaque` **(auth)** — Update plaque status for a specific annotation
- POST `/api/images/:imageId/annotations/batch` — Batch update annotations for an image
- GET `/api/visits/:visitId/annotations/stats` — Get annotation statistics for a visit

### Export / Dataset
- POST `/api/export/dataset` **(auth)** — Request a dataset export. Body may include `visitIds` or `patientIds`, `format` (`yolo`|`coco`|`both`), `split` ratios, and `filter` options. See `backend/src/controllers/ExportController.js` and `backend/src/services/datasetExportService.js` for params and behavior.
- GET `/api/exports/:exportId` **(auth)** — Get export status and metadata
- GET `/api/exports/:exportId/download` **(auth)** — Download ZIP of the generated export
- DELETE `/api/exports/:exportId` **(auth)** — Delete an export

### Misc / Proxy
- GET `/api/images/proxy/*` — Proxy to MinIO object (useful to avoid CORS)

---

## Validators (request bodies)
- `backend/src/validators/patientValidator.js` — patient create/update schemas
- `backend/src/validators/visitValidator.js` — visit create/update schemas
- `backend/src/validators/imageValidator.js` — image create + validation update schemas

---

## Upload config (multer)
- Configured in `backend/src/routes/api.js` using memoryStorage with limits:
  - `fileSize`: 100 MB per file
  - `files`: 5000 (max files per request)
  - `fieldSize`: 25 MB for text fields

---

## Auth / Permissions
- Routes decorated with `authenticate` middleware require a valid Bearer token. See `backend/src/middleware/auth.js` for token handling and JWT claims.
- Export endpoints additionally check user role against allowed roles in `backend/src/constants/export.js`.

---

## Examples

- Export (YOLO) by visit ID:
```bash
curl -X POST http://localhost:3000/api/export/dataset \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"visitIds":[123],"format":"yolo","split":{"train":1,"val":0,"test":0}}'
```

- Upload a single image:
```bash
curl -X POST http://localhost:3000/api/images \
  -F "image=@/path/to/file.jpg" \
  -F "visit_id=456" \
  -F "image_category=raw" \
  -F "image_type=upper_right" \
  -F "image_index=1" \
  -H "Authorization: Bearer TOKEN"
```

---

## Where to find implementation
- Routes: `backend/src/routes/api.js`
- Controllers: `backend/src/controllers/*` (e.g., `ExportController.js`, `BulkUploadController.js`)
- Services: `backend/src/services/*` (dataset export, annotation parsing, storage, etc.)
- Models: `backend/src/models/*`

---

If you want, I can:
- add example request/response bodies for each endpoint,
- generate OpenAPI (Swagger) JSON from this list,
- or include exact Joi schemas inline for each endpoint.

Which of these would you like next?
