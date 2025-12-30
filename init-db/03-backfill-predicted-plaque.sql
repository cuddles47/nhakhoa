-- Backfill predicted_plaque from existing plaque_status for python_subbox rows where safe, then set plaque_status = 0 for unannotated python_subbox rows
BEGIN;

-- 1) For python_subbox rows where predicted_plaque is NULL and plaque_status is not NULL and not clinician annotated, copy plaque_status to predicted_plaque
UPDATE image_annotations
SET predicted_plaque = plaque_status
WHERE source_type = 'python_subbox' AND predicted_plaque IS NULL AND plaque_status IS NOT NULL AND annotated_by IS NULL;

-- 2) For python_subbox rows that are not clinician annotated, reset plaque_status to 0 (no plaque)
UPDATE image_annotations
SET plaque_status = 0
WHERE source_type = 'python_subbox' AND annotated_by IS NULL;

COMMIT;

SELECT 'Backfill complete: predicted_plaque populated where available, plaque_status reset for unannotated python_subbox rows.' AS message;