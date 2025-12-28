-- =====================================================
-- RESET DATABASE SCRIPT
-- This script truncates all tables and resets sequences
-- WARNING: This will DELETE ALL DATA!
-- Date: 2025-12-28
-- =====================================================

-- Disable foreign key checks temporarily (PostgreSQL equivalent)
SET session_replication_role = 'replica';

-- Truncate all tables in correct order (respecting foreign keys)
TRUNCATE TABLE image_validations CASCADE;
TRUNCATE TABLE labels CASCADE;
TRUNCATE TABLE subboxes CASCADE;
TRUNCATE TABLE image_annotations CASCADE;
TRUNCATE TABLE images CASCADE;
TRUNCATE TABLE visits CASCADE;
TRUNCATE TABLE case_doctors CASCADE;
TRUNCATE TABLE cases CASCADE;
TRUNCATE TABLE patients CASCADE;
TRUNCATE TABLE doctors CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Reset all sequences to start from 1
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE doctors_id_seq RESTART WITH 1;
ALTER SEQUENCE patients_id_seq RESTART WITH 1;
ALTER SEQUENCE cases_id_seq RESTART WITH 1;
ALTER SEQUENCE visits_id_seq RESTART WITH 1;
ALTER SEQUENCE images_id_seq RESTART WITH 1;
ALTER SEQUENCE subboxes_id_seq RESTART WITH 1;
ALTER SEQUENCE labels_id_seq RESTART WITH 1;
ALTER SEQUENCE image_validations_id_seq RESTART WITH 1;
ALTER SEQUENCE image_annotations_id_seq RESTART WITH 1;

SELECT 'Database reset completed! All data has been cleared and sequences reset.' as message;
