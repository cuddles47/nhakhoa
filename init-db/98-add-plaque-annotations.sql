-- =====================================================
-- ADD PLAQUE ANNOTATION COLUMNS
-- Migration script for existing database
-- Date: 2025-12-28
-- =====================================================

-- Add plaque annotation columns to image_annotations table
ALTER TABLE image_annotations 
ADD COLUMN IF NOT EXISTS plaque_status INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS annotated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS annotated_at TIMESTAMP DEFAULT NULL;

COMMENT ON COLUMN image_annotations.plaque_status IS '0 = no plaque, 1 = has plaque, NULL = not annotated yet';
COMMENT ON COLUMN image_annotations.annotated_by IS 'User ID of doctor who made the plaque annotation';
COMMENT ON COLUMN image_annotations.annotated_at IS 'Timestamp when plaque status was annotated';

-- Create annotation history table for audit trail
CREATE TABLE IF NOT EXISTS annotation_history (
    id SERIAL PRIMARY KEY,
    annotation_id INTEGER REFERENCES image_annotations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    old_value INTEGER,
    new_value INTEGER,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE annotation_history IS 'Audit trail for plaque status changes';
COMMENT ON COLUMN annotation_history.old_value IS 'Previous plaque status value (0, 1, or NULL)';
COMMENT ON COLUMN annotation_history.new_value IS 'New plaque status value (0, 1, or NULL)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_image_annotations_plaque_status ON image_annotations(plaque_status) WHERE plaque_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_image_annotations_annotated_by ON image_annotations(annotated_by);
CREATE INDEX IF NOT EXISTS idx_annotation_history_annotation_id ON annotation_history(annotation_id);
CREATE INDEX IF NOT EXISTS idx_annotation_history_user_id ON annotation_history(user_id);

SELECT 'Plaque annotation columns added successfully!' as message;
