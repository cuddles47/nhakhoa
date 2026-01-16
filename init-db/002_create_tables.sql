-- =====================================================
-- Tables Creation Script
-- For UAT/Staging Environment  
-- Generated: 2026-01-14
-- Based on production schema export
-- =====================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (must be first due to foreign key dependencies)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    gender VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    contact VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cases table (treatment cases for patients)
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    start_date DATE,
    end_date DATE,
    treatment_type VARCHAR(100),
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

-- Case-Doctors junction table (many-to-many)
CREATE TABLE IF NOT EXISTS case_doctors (
    case_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    role VARCHAR(50),
    PRIMARY KEY (case_id, doctor_id)
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    case_id INTEGER,
    visit_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    annotation_file_url VARCHAR(500)
);

-- =====================================================
-- IMAGE AND ANNOTATION TABLES
-- =====================================================

-- Images table
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER,
    url VARCHAR(255) NOT NULL,
    image_category VARCHAR(20) NOT NULL,
    image_type VARCHAR(50),
    image_index INTEGER,
    validation_status VARCHAR(20) DEFAULT 'pending',
    taken_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    url_processed TEXT,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    original_filename VARCHAR(255),
    has_annotations BOOLEAN DEFAULT FALSE,
    annotation_count INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER
);

COMMENT ON COLUMN images.url_processed IS 'URL to processed image with bounding boxes';
COMMENT ON COLUMN images.processing_status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN images.processed_at IS 'Timestamp when processing completed';
COMMENT ON COLUMN images.original_filename IS 'Original filename from upload for matching with COCO annotations';
COMMENT ON COLUMN images.has_annotations IS 'Flag to quickly query images with annotations';
COMMENT ON COLUMN images.annotation_count IS 'Cached count of annotations for this image';
COMMENT ON COLUMN images.width IS 'Image width in pixels for coordinate conversion';
COMMENT ON COLUMN images.height IS 'Image height in pixels for coordinate conversion';

-- Image Annotations table (COCO format + subboxes)
CREATE TABLE IF NOT EXISTS image_annotations (
    id SERIAL PRIMARY KEY,
    image_id INTEGER,
    coco_image_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    category_name VARCHAR(50),
    bbox JSONB NOT NULL,
    area DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_type VARCHAR(30) DEFAULT 'doctor_upload',
    parent_annotation_id INTEGER,
    subbox_region VARCHAR(20),
    plaque_status INTEGER,
    annotated_by INTEGER,
    annotated_at TIMESTAMP WITHOUT TIME ZONE,
    predicted_plaque INTEGER
);

COMMENT ON TABLE image_annotations IS 'Stores original COCO annotations and processed subbox annotations';
COMMENT ON COLUMN image_annotations.coco_image_id IS 'Original image ID from COCO JSON file';
COMMENT ON COLUMN image_annotations.category_name IS 'Tooth number (11-44) or Brace';
COMMENT ON COLUMN image_annotations.bbox IS 'COCO bbox format [x, y, width, height] in pixels';
COMMENT ON COLUMN image_annotations.source_type IS 'Origin: doctor_upload (from bulk upload), python_processed (refined by Python), python_subbox (4-corner divisions)';
COMMENT ON COLUMN image_annotations.parent_annotation_id IS 'For subboxes, references the parent tooth annotation';
COMMENT ON COLUMN image_annotations.subbox_region IS 'For subboxes: gingival, incisal, mesial, distal';
COMMENT ON COLUMN image_annotations.plaque_status IS '0 = no plaque, 1 = has plaque, NULL = not annotated yet';
COMMENT ON COLUMN image_annotations.annotated_by IS 'User ID of doctor who made the plaque annotation';
COMMENT ON COLUMN image_annotations.annotated_at IS 'Timestamp when plaque status was annotated';

-- Annotation History table (audit trail)
CREATE TABLE IF NOT EXISTS annotation_history (
    id SERIAL PRIMARY KEY,
    annotation_id INTEGER,
    user_id INTEGER,
    old_value INTEGER,
    new_value INTEGER,
    changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE annotation_history IS 'Audit trail for plaque status changes';
COMMENT ON COLUMN annotation_history.old_value IS 'Previous plaque status value (0, 1, or NULL)';
COMMENT ON COLUMN annotation_history.new_value IS 'New plaque status value (0, 1, or NULL)';

-- Subboxes table (legacy, may be deprecated)
CREATE TABLE IF NOT EXISTS subboxes (
    id SERIAL PRIMARY KEY,
    image_id INTEGER,
    region VARCHAR(20) NOT NULL,
    coordinates JSONB NOT NULL,
    box_type VARCHAR(20) NOT NULL,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Labels table
CREATE TABLE IF NOT EXISTS labels (
    id SERIAL PRIMARY KEY,
    image_id INTEGER,
    subbox_id INTEGER,
    label_type VARCHAR(50) NOT NULL,
    value VARCHAR(100),
    description TEXT,
    labeled_by INTEGER,
    labeled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Image Validations table
CREATE TABLE IF NOT EXISTS image_validations (
    id SERIAL PRIMARY KEY,
    image_id INTEGER,
    criteria VARCHAR(100) NOT NULL,
    result BOOLEAN NOT NULL,
    notes TEXT,
    validated_by INTEGER,
    validated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'System users including doctors and admins';
COMMENT ON TABLE patients IS 'Patient master data';
COMMENT ON TABLE doctors IS 'Doctor profiles linked to user accounts';
COMMENT ON TABLE cases IS 'Treatment cases for patients';
COMMENT ON TABLE case_doctors IS 'Many-to-many relationship between cases and doctors';
COMMENT ON TABLE visits IS 'Patient visits linked to cases';
COMMENT ON TABLE images IS 'Medical images uploaded during visits';
COMMENT ON TABLE subboxes IS 'Sub-regions of tooth annotations (legacy)';
COMMENT ON TABLE labels IS 'Labels for images and subboxes';
COMMENT ON TABLE image_validations IS 'Image quality validation records';
