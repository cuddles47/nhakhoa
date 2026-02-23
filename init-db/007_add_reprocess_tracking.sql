-- Add reprocessing tracking columns to visits table
-- This allows marking visits that have been reprocessed with new logic

ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS reprocessed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reprocessed_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reprocess_notes TEXT;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_visits_reprocessed_at ON visits(reprocessed_at) WHERE reprocessed_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN visits.reprocessed_at IS 'Timestamp when visit images were last reprocessed with updated logic';
COMMENT ON COLUMN visits.reprocessed_by IS 'User ID who triggered the reprocessing';
COMMENT ON COLUMN visits.reprocess_notes IS 'Optional notes about what was reprocessed';

-- View to check reprocessing status
CREATE OR REPLACE VIEW visit_reprocess_status AS
SELECT 
  v.id as visit_id,
  v.patient_id,
  p.name as patient_name,
  v.visit_date,
  v.reprocessed_at,
  u.username as reprocessed_by_user,
  v.reprocess_notes,
  COUNT(DISTINCT i.id) FILTER (WHERE i.image_category = 'raw' AND i.deleted_at IS NULL) as raw_image_count,
  COUNT(DISTINCT i.id) FILTER (WHERE i.image_category = 'stained' AND i.deleted_at IS NULL) as stained_image_count,
  CASE 
    WHEN v.reprocessed_at IS NULL THEN 'pending'
    WHEN v.reprocessed_at < v.updated_at THEN 'outdated'
    ELSE 'completed'
  END as reprocess_status
FROM visits v
JOIN patients p ON v.patient_id = p.id
LEFT JOIN users u ON v.reprocessed_by = u.id
LEFT JOIN images i ON v.id = i.visit_id
WHERE v.deleted_at IS NULL
GROUP BY v.id, p.name, u.username
ORDER BY v.reprocessed_at NULLS FIRST, v.id;

-- Query to get visits needing reprocessing
COMMENT ON VIEW visit_reprocess_status IS 'Shows reprocessing status of all visits';
