-- =====================================================
-- MIGRATION: Add Performance Indexes and Soft Deletes
-- Date: 2025-12-14
-- Description: Add indexes for better query performance and soft delete columns
-- =====================================================

-- Add soft delete columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE images ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add performance indexes for filters
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_visits_deleted_at ON visits(deleted_at);
CREATE INDEX IF NOT EXISTS idx_images_deleted_at ON images(deleted_at);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_visits_status_date ON visits(status, visit_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_images_validation_status ON images(validation_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_images_visit_category ON images(visit_id, image_category) WHERE deleted_at IS NULL;

-- Add full-text search index for patient search
CREATE INDEX IF NOT EXISTS idx_patients_search ON patients USING gin(to_tsvector('simple', name || ' ' || COALESCE(phone, ''))) WHERE deleted_at IS NULL;

-- Add indexes on foreign keys that don't have them
CREATE INDEX IF NOT EXISTS idx_case_doctors_doctor_id ON case_doctors(doctor_id);
CREATE INDEX IF NOT EXISTS idx_case_doctors_case_id ON case_doctors(case_id);
CREATE INDEX IF NOT EXISTS idx_labels_labeled_by ON labels(labeled_by);
CREATE INDEX IF NOT EXISTS idx_image_validations_validated_by ON image_validations(validated_by);

-- Add composite index for doctor's cases
CREATE INDEX IF NOT EXISTS idx_cases_patient_status ON cases(patient_id, status) WHERE deleted_at IS NULL;

-- Success message
SELECT 'Migration completed: Added indexes and soft delete columns' as message;
