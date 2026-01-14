-- =====================================================
-- Indexes Creation Script
-- For UAT/Staging Environment
-- Generated: 2026-01-14
-- Optimizes query performance
-- =====================================================

-- =====================================================
-- ANNOTATION HISTORY INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_annotation_history_annotation_id 
    ON annotation_history (annotation_id);

CREATE INDEX IF NOT EXISTS idx_annotation_history_user_id 
    ON annotation_history (user_id);

-- =====================================================
-- CASE AND DOCTOR INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_case_doctors_case_id 
    ON case_doctors (case_id);

CREATE INDEX IF NOT EXISTS idx_case_doctors_doctor_id 
    ON case_doctors (doctor_id);

CREATE INDEX IF NOT EXISTS idx_cases_patient_status 
    ON cases (patient_id, status) 
    WHERE deleted_at IS NULL;

-- =====================================================
-- IMAGE ANNOTATIONS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_image_annotations_annotated_by 
    ON image_annotations (annotated_by);

CREATE INDEX IF NOT EXISTS idx_image_annotations_coco_image_id 
    ON image_annotations (coco_image_id);

CREATE INDEX IF NOT EXISTS idx_image_annotations_image_id 
    ON image_annotations (image_id);

CREATE INDEX IF NOT EXISTS idx_image_annotations_parent_id 
    ON image_annotations (parent_annotation_id) 
    WHERE parent_annotation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_image_annotations_plaque_status 
    ON image_annotations (plaque_status) 
    WHERE plaque_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_image_annotations_source_type 
    ON image_annotations (source_type);

-- Unique constraint for subbox regions per parent annotation
CREATE UNIQUE INDEX IF NOT EXISTS uq_image_parent_subbox_region 
    ON image_annotations (image_id, parent_annotation_id, subbox_region) 
    WHERE subbox_region IS NOT NULL;

-- =====================================================
-- IMAGE VALIDATIONS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_image_validations_validated_by 
    ON image_validations (validated_by);

-- =====================================================
-- IMAGES INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_images_category 
    ON images (image_category);

CREATE INDEX IF NOT EXISTS idx_images_deleted_at 
    ON images (deleted_at);

CREATE INDEX IF NOT EXISTS idx_images_has_annotations 
    ON images (has_annotations) 
    WHERE has_annotations = TRUE;

CREATE INDEX IF NOT EXISTS idx_images_original_filename 
    ON images (original_filename) 
    WHERE original_filename IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_images_processing_status 
    ON images (processing_status);

CREATE INDEX IF NOT EXISTS idx_images_url_processed 
    ON images (visit_id) 
    WHERE url_processed IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_images_validation_status 
    ON images (validation_status) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_images_visit 
    ON images (visit_id);

CREATE INDEX IF NOT EXISTS idx_images_visit_category 
    ON images (visit_id, image_category) 
    WHERE deleted_at IS NULL;

-- =====================================================
-- LABELS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_labels_image 
    ON labels (image_id);

CREATE INDEX IF NOT EXISTS idx_labels_labeled_by 
    ON labels (labeled_by);

-- =====================================================
-- PATIENTS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at 
    ON patients (deleted_at);

CREATE INDEX IF NOT EXISTS idx_patients_name 
    ON patients (name);

CREATE INDEX IF NOT EXISTS idx_patients_phone 
    ON patients (phone);

-- Full-text search index for patient name and phone
CREATE INDEX IF NOT EXISTS idx_patients_search 
    ON patients USING gin (
        to_tsvector('simple'::regconfig, 
            (name::text || ' '::text || COALESCE(phone, ''::character varying)::text)
        )
    ) 
    WHERE deleted_at IS NULL;

-- =====================================================
-- SUBBOXES INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_subboxes_image 
    ON subboxes (image_id);

-- =====================================================
-- VISITS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_visits_date 
    ON visits (visit_date);

CREATE INDEX IF NOT EXISTS idx_visits_deleted_at 
    ON visits (deleted_at);

CREATE INDEX IF NOT EXISTS idx_visits_patient 
    ON visits (patient_id);

CREATE INDEX IF NOT EXISTS idx_visits_status_date 
    ON visits (status, visit_date) 
    WHERE deleted_at IS NULL;

-- =====================================================
-- PERFORMANCE NOTES
-- =====================================================
-- 1. Partial indexes (with WHERE clauses) reduce index size and improve performance
-- 2. Composite indexes optimize queries that filter on multiple columns
-- 3. GIN index on patients enables fast full-text search
-- 4. Unique index on image_annotations prevents duplicate subbox regions
