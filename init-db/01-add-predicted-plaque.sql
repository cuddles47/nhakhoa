-- Add predicted_plaque column to image_annotations to store model prediction (0/1)
ALTER TABLE IF EXISTS image_annotations
ADD COLUMN IF NOT EXISTS predicted_plaque integer;

-- Backfill NULLs with NULL (no-op), but leave existing plaque_status unchanged
-- This migration is safe to run multiple times

SELECT 'Migration complete: predicted_plaque column ensured.' AS message;