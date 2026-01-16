-- =====================================================
-- Foreign Keys and Constraints Creation Script
-- For UAT/Staging Environment
-- Generated: 2026-01-14
-- Ensures referential integrity
-- =====================================================

-- =====================================================
-- ANNOTATION HISTORY FOREIGN KEYS
-- =====================================================
ALTER TABLE annotation_history
    DROP CONSTRAINT IF EXISTS annotation_history_annotation_id_fkey,
    ADD CONSTRAINT annotation_history_annotation_id_fkey 
        FOREIGN KEY (annotation_id) 
        REFERENCES image_annotations(id) 
        ON DELETE CASCADE;

ALTER TABLE annotation_history
    DROP CONSTRAINT IF EXISTS annotation_history_user_id_fkey,
    ADD CONSTRAINT annotation_history_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL;

-- =====================================================
-- CASE AND DOCTOR FOREIGN KEYS
-- =====================================================
ALTER TABLE case_doctors
    DROP CONSTRAINT IF EXISTS case_doctors_case_id_fkey,
    ADD CONSTRAINT case_doctors_case_id_fkey 
        FOREIGN KEY (case_id) 
        REFERENCES cases(id) 
        ON DELETE CASCADE;

ALTER TABLE case_doctors
    DROP CONSTRAINT IF EXISTS case_doctors_doctor_id_fkey,
    ADD CONSTRAINT case_doctors_doctor_id_fkey 
        FOREIGN KEY (doctor_id) 
        REFERENCES doctors(id) 
        ON DELETE CASCADE;

ALTER TABLE cases
    DROP CONSTRAINT IF EXISTS cases_patient_id_fkey,
    ADD CONSTRAINT cases_patient_id_fkey 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(id) 
        ON DELETE CASCADE;

ALTER TABLE doctors
    DROP CONSTRAINT IF EXISTS doctors_user_id_fkey,
    ADD CONSTRAINT doctors_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL;

-- =====================================================
-- IMAGE ANNOTATIONS FOREIGN KEYS
-- =====================================================
ALTER TABLE image_annotations
    DROP CONSTRAINT IF EXISTS image_annotations_annotated_by_fkey,
    ADD CONSTRAINT image_annotations_annotated_by_fkey 
        FOREIGN KEY (annotated_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL;

ALTER TABLE image_annotations
    DROP CONSTRAINT IF EXISTS image_annotations_image_id_fkey,
    ADD CONSTRAINT image_annotations_image_id_fkey 
        FOREIGN KEY (image_id) 
        REFERENCES images(id) 
        ON DELETE CASCADE;

ALTER TABLE image_annotations
    DROP CONSTRAINT IF EXISTS image_annotations_parent_annotation_id_fkey,
    ADD CONSTRAINT image_annotations_parent_annotation_id_fkey 
        FOREIGN KEY (parent_annotation_id) 
        REFERENCES image_annotations(id) 
        ON DELETE SET NULL;

-- =====================================================
-- IMAGE VALIDATIONS FOREIGN KEYS
-- =====================================================
ALTER TABLE image_validations
    DROP CONSTRAINT IF EXISTS image_validations_image_id_fkey,
    ADD CONSTRAINT image_validations_image_id_fkey 
        FOREIGN KEY (image_id) 
        REFERENCES images(id) 
        ON DELETE CASCADE;

ALTER TABLE image_validations
    DROP CONSTRAINT IF EXISTS image_validations_validated_by_fkey,
    ADD CONSTRAINT image_validations_validated_by_fkey 
        FOREIGN KEY (validated_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL;

-- =====================================================
-- IMAGES FOREIGN KEYS
-- =====================================================
ALTER TABLE images
    DROP CONSTRAINT IF EXISTS images_visit_id_fkey,
    ADD CONSTRAINT images_visit_id_fkey 
        FOREIGN KEY (visit_id) 
        REFERENCES visits(id) 
        ON DELETE CASCADE;

-- =====================================================
-- LABELS FOREIGN KEYS
-- =====================================================
ALTER TABLE labels
    DROP CONSTRAINT IF EXISTS labels_image_id_fkey,
    ADD CONSTRAINT labels_image_id_fkey 
        FOREIGN KEY (image_id) 
        REFERENCES images(id) 
        ON DELETE CASCADE;

ALTER TABLE labels
    DROP CONSTRAINT IF EXISTS labels_labeled_by_fkey,
    ADD CONSTRAINT labels_labeled_by_fkey 
        FOREIGN KEY (labeled_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL;

ALTER TABLE labels
    DROP CONSTRAINT IF EXISTS labels_subbox_id_fkey,
    ADD CONSTRAINT labels_subbox_id_fkey 
        FOREIGN KEY (subbox_id) 
        REFERENCES subboxes(id) 
        ON DELETE SET NULL;

-- =====================================================
-- SUBBOXES FOREIGN KEYS
-- =====================================================
ALTER TABLE subboxes
    DROP CONSTRAINT IF EXISTS subboxes_image_id_fkey,
    ADD CONSTRAINT subboxes_image_id_fkey 
        FOREIGN KEY (image_id) 
        REFERENCES images(id) 
        ON DELETE CASCADE;

-- =====================================================
-- VISITS FOREIGN KEYS
-- =====================================================
ALTER TABLE visits
    DROP CONSTRAINT IF EXISTS visits_case_id_fkey,
    ADD CONSTRAINT visits_case_id_fkey 
        FOREIGN KEY (case_id) 
        REFERENCES cases(id) 
        ON DELETE SET NULL;

ALTER TABLE visits
    DROP CONSTRAINT IF EXISTS visits_created_by_fkey,
    ADD CONSTRAINT visits_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL;

ALTER TABLE visits
    DROP CONSTRAINT IF EXISTS visits_patient_id_fkey,
    ADD CONSTRAINT visits_patient_id_fkey 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(id) 
        ON DELETE CASCADE;

-- =====================================================
-- REFERENTIAL INTEGRITY NOTES
-- =====================================================
-- ON DELETE CASCADE: Child records are automatically deleted when parent is deleted
-- ON DELETE SET NULL: Foreign key is set to NULL when parent is deleted
-- 
-- Cascade relationships:
-- - Patient -> Cases, Visits
-- - Visit -> Images
-- - Image -> Annotations, Validations, Subboxes, Labels
-- - Case -> Case-Doctors
-- - Doctor -> Case-Doctors
-- - Annotation -> Annotation History
-- 
-- Set NULL relationships:
-- - User deletions don't cascade (preserve audit trail)
-- - Case deletion from visit (visits can exist without cases)
