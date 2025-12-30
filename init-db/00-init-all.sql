-- =====================================================
-- COMPLETE DATABASE INITIALIZATION FOR NHAKHOA SYSTEM
-- Combined script from: 01-init.sql, 02-seed-data.sql, 03-add-indexes-soft-deletes.sql, 04-add-processed-fields.sql
-- Date: 2025-12-28
-- =====================================================

-- =====================================================
-- SCHEMA CREATION
-- =====================================================

-- Tạo bảng người dùng (đăng nhập)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- doctor, assistant, admin
    full_name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng bác sĩ
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng bệnh nhân
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    gender VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);

-- Tạo bảng hồ sơ chỉnh nha (Case)
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    treatment_type VARCHAR(100),
    status VARCHAR(50), -- active, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);

-- Liên kết bác sĩ với hồ sơ
CREATE TABLE IF NOT EXISTS case_doctors (
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    role VARCHAR(50), -- primary, consultant
    PRIMARY KEY (case_id, doctor_id)
);

-- Tạo bảng lần khám (Visit)
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    notes TEXT,
    annotation_file_url VARCHAR(500), -- MinIO URL for patient-specific COCO annotation file
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);

-- Tạo bảng ảnh (18 ảnh: 9 raw + 9 nhuộm)
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER REFERENCES visits(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    image_category VARCHAR(20) NOT NULL, -- raw, stained
    image_type VARCHAR(50), -- frontal, lateral, occlusal, upper, lower, left, right, etc.
    image_index INTEGER, -- 1-9 cho mỗi category
    validation_status VARCHAR(20) DEFAULT 'pending', -- pending, valid, invalid
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL,
    url_processed TEXT,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP,
    original_filename VARCHAR(255), -- Original filename for COCO mapping
    has_annotations BOOLEAN DEFAULT false, -- Quick flag for annotation presence
    annotation_count INTEGER DEFAULT 0, -- Number of annotations for this image
    width INTEGER, -- Image width in pixels (for COCO to YOLO conversion)
    height INTEGER -- Image height in pixels (for COCO to YOLO conversion)
);

COMMENT ON COLUMN images.url_processed IS 'URL to processed image with bounding boxes';
COMMENT ON COLUMN images.processing_status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN images.processed_at IS 'Timestamp when processing completed';
COMMENT ON COLUMN images.original_filename IS 'Original filename from upload for matching with COCO annotations';
COMMENT ON COLUMN images.has_annotations IS 'Flag to quickly query images with annotations';
COMMENT ON COLUMN images.annotation_count IS 'Cached count of annotations for this image';
COMMENT ON COLUMN images.width IS 'Image width in pixels for coordinate conversion';
COMMENT ON COLUMN images.height IS 'Image height in pixels for coordinate conversion';

-- Tạo bảng validate ảnh (9 tiêu chí)
CREATE TABLE IF NOT EXISTS image_validations (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    criteria VARCHAR(100) NOT NULL, -- quality, angle, lighting, focus, coverage, etc.
    result BOOLEAN NOT NULL,
    notes TEXT,
    validated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng subboxes (4 vùng: răng trên, dưới, trái, phải mắc cài)
CREATE TABLE IF NOT EXISTS subboxes (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    region VARCHAR(20) NOT NULL, -- upper, lower, left, right
    coordinates JSONB NOT NULL, -- {x, y, width, height}
    box_type VARCHAR(20) NOT NULL, -- tooth, bracket
    confidence FLOAT, -- độ tin cậy của AI detection
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng gán nhãn
CREATE TABLE IF NOT EXISTS labels (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    subbox_id INTEGER REFERENCES subboxes(id) ON DELETE SET NULL,
    label_type VARCHAR(50) NOT NULL,
    value VARCHAR(100),
    description TEXT,
    labeled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    labeled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng lưu trữ COCO annotations
CREATE TABLE IF NOT EXISTS image_annotations (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    coco_image_id INTEGER NOT NULL, -- Links to COCO JSON images[].id
    category_id INTEGER NOT NULL, -- Category ID from COCO
    category_name VARCHAR(50), -- Category name (tooth number or 'Brace')
    bbox JSONB NOT NULL, -- COCO bbox format: [x, y, width, height] in pixels
    area FLOAT, -- Bounding box area
    source_type VARCHAR(30) DEFAULT 'doctor_upload', -- 'doctor_upload' or 'python_processed' or 'python_subbox'
    parent_annotation_id INTEGER REFERENCES image_annotations(id) ON DELETE SET NULL, -- For subboxes, links to parent tooth annotation
    subbox_region VARCHAR(20), -- For subboxes: 'gingival', 'incisal', 'mesial', 'distal'
    plaque_status INTEGER DEFAULT NULL, -- 0 = no plaque, 1 = has plaque, NULL = not annotated yet
    annotated_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Doctor who made the annotation
    annotated_at TIMESTAMP DEFAULT NULL, -- When the plaque annotation was made
    predicted_plaque INTEGER DEFAULT NULL, -- Model predicted plaque (0/1) stored separately
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure uniqueness for subbox regions per image/parent to prevent duplicate python_subbox inserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_image_parent_subbox_region'
  ) THEN
    CREATE UNIQUE INDEX uq_image_parent_subbox_region ON image_annotations (image_id, parent_annotation_id, subbox_region) WHERE subbox_region IS NOT NULL;
  END IF;
END$$;

-- Backfill: populate predicted_plaque from existing plaque_status where safe, then default plaque_status to 0 for python_subbox rows that are unannotated
BEGIN;
  -- 1) Copy existing plaque_status into predicted_plaque for python_subbox rows where plaque_status exists and not annotated by clinician
  UPDATE image_annotations
  SET predicted_plaque = plaque_status
  WHERE source_type = 'python_subbox' AND predicted_plaque IS NULL AND plaque_status IS NOT NULL AND annotated_by IS NULL;

  -- 2) For python_subbox rows that are not clinician annotated, reset plaque_status to 0 (no plaque)
  UPDATE image_annotations
  SET plaque_status = 0
  WHERE source_type = 'python_subbox' AND annotated_by IS NULL;
COMMIT;



COMMENT ON TABLE image_annotations IS 'Stores original COCO annotations and processed subbox annotations';
COMMENT ON COLUMN image_annotations.coco_image_id IS 'Original image ID from COCO JSON file';
COMMENT ON COLUMN image_annotations.bbox IS 'COCO bbox format [x, y, width, height] in pixels';
COMMENT ON COLUMN image_annotations.category_name IS 'Tooth number (11-44) or Brace';
COMMENT ON COLUMN image_annotations.source_type IS 'Origin: doctor_upload (from bulk upload), python_processed (refined by Python), python_subbox (4-corner divisions)';
COMMENT ON COLUMN image_annotations.parent_annotation_id IS 'For subboxes, references the parent tooth annotation';
COMMENT ON COLUMN image_annotations.subbox_region IS 'For subboxes: gingival, incisal, mesial, distal';
COMMENT ON COLUMN image_annotations.plaque_status IS '0 = no plaque, 1 = has plaque, NULL = not annotated yet';
COMMENT ON COLUMN image_annotations.annotated_by IS 'User ID of doctor who made the plaque annotation';
COMMENT ON COLUMN image_annotations.annotated_at IS 'Timestamp when plaque status was annotated';

-- Tạo bảng lịch sử annotation (audit trail)
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

-- =====================================================
-- INDEXES
-- =====================================================

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_deleted_at ON visits(deleted_at);
CREATE INDEX IF NOT EXISTS idx_images_visit ON images(visit_id);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(image_category);
CREATE INDEX IF NOT EXISTS idx_images_deleted_at ON images(deleted_at);
CREATE INDEX IF NOT EXISTS idx_images_processing_status ON images(processing_status);
CREATE INDEX IF NOT EXISTS idx_images_url_processed ON images(visit_id) WHERE url_processed IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_images_original_filename ON images(original_filename) WHERE original_filename IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_images_has_annotations ON images(has_annotations) WHERE has_annotations = true;
CREATE INDEX IF NOT EXISTS idx_subboxes_image ON subboxes(image_id);
CREATE INDEX IF NOT EXISTS idx_labels_image ON labels(image_id);
CREATE INDEX IF NOT EXISTS idx_labels_labeled_by ON labels(labeled_by);
CREATE INDEX IF NOT EXISTS idx_image_validations_validated_by ON image_validations(validated_by);
CREATE INDEX IF NOT EXISTS idx_image_annotations_image_id ON image_annotations(image_id);
CREATE INDEX IF NOT EXISTS idx_image_annotations_coco_image_id ON image_annotations(coco_image_id);
CREATE INDEX IF NOT EXISTS idx_image_annotations_source_type ON image_annotations(source_type);
CREATE INDEX IF NOT EXISTS idx_image_annotations_parent_id ON image_annotations(parent_annotation_id) WHERE parent_annotation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_image_annotations_plaque_status ON image_annotations(plaque_status) WHERE plaque_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_image_annotations_annotated_by ON image_annotations(annotated_by);
CREATE INDEX IF NOT EXISTS idx_annotation_history_annotation_id ON annotation_history(annotation_id);
CREATE INDEX IF NOT EXISTS idx_annotation_history_user_id ON annotation_history(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_visits_status_date ON visits(status, visit_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_images_validation_status ON images(validation_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_images_visit_category ON images(visit_id, image_category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cases_patient_status ON cases(patient_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_case_doctors_doctor_id ON case_doctors(doctor_id);
CREATE INDEX IF NOT EXISTS idx_case_doctors_case_id ON case_doctors(case_id);

-- Full-text search index for patient search
CREATE INDEX IF NOT EXISTS idx_patients_search ON patients USING gin(to_tsvector('simple', name || ' ' || COALESCE(phone, ''))) WHERE deleted_at IS NULL;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed Users (Bác sĩ và nhân viên)
INSERT INTO users (username, password_hash, role, full_name, email) VALUES
('admin', '$2b$10$0VFAhLE0MvbXQK/xYdWepu..zrk1Ly.4XW9dIFn20YXdApNRTfB1u', 'admin', 'Quản Trị Viên', 'admin@nhakhoa.com'),

ON CONFLICT (username) DO NOTHING;

-- Seed Doctors (sử dụng user_id thực tế từ bảng users)
INSERT INTO doctors (user_id, name, specialty, contact) VALUES
((SELECT id FROM users WHERE username = 'dr.nguyen'), 'BS. Nguyễn Văn A', 'Chỉnh nha', '0901234567'),
((SELECT id FROM users WHERE username = 'dr.tran'), 'BS. Trần Thị B', 'Nha khoa thẩm mỹ', '0912345678')
ON CONFLICT DO NOTHING;

-- Seed Patients
INSERT INTO patients (name, phone, dob, gender, notes) VALUES
('Lê Văn An', '0123456789', '1990-05-15', 'male', 'Bệnh nhân cần niềng răng'),
('Nguyễn Thị Bình', '0987654321', '1995-08-20', 'female', 'Răng khấp khểnh, cần chỉnh nha'),
('Trần Văn Cường', '0369852147', '1988-03-10', 'male', 'Răng hô, đã tư vấn niềng răng'),
('Phạm Thị Dung', '0912345678', '2000-11-25', 'female', 'Bệnh nhân mới, chưa từng niềng răng'),
('Hoàng Văn Em', '0909876543', '1992-07-30', 'male', 'Đang trong quá trình điều trị'),
('Võ Thị Phượng', '0938765432', '1998-12-05', 'female', 'Cần kiểm tra lại sau 3 tháng'),
('Đỗ Văn Giang', '0945678901', '1985-04-18', 'male', 'Đã hoàn thành liệu trình'),
('Bùi Thị Hoa', '0976543210', '2001-09-22', 'female', 'Bệnh nhân VIP, ưu tiên'),
('Lý Văn Ích', '0898765432', '1993-06-14', 'male', 'Cần tư vấn thêm về chi phí'),
('Mai Thị Kim', '0865432109', '1996-02-28', 'female', 'Bệnh nhân giới thiệu')
ON CONFLICT DO NOTHING;

-- Seed Cases (Hồ sơ điều trị)
INSERT INTO cases (patient_id, start_date, end_date, treatment_type, status, notes) VALUES
(1, '2025-01-15', NULL, 'Niềng răng mắc cài kim loại', 'active', 'Đang trong giai đoạn điều trị'),
(2, '2025-02-20', NULL, 'Niềng răng trong suốt', 'active', 'Tiến triển tốt'),
(3, '2024-11-10', '2025-11-10', 'Niềng răng mắc cài sứ', 'active', 'Dự kiến 12 tháng'),
(4, '2025-03-05', NULL, 'Niềng răng mắc cài tự buộc', 'active', 'Lần đầu điều trị'),
(5, '2024-08-15', NULL, 'Niềng răng trong suốt Invisalign', 'active', 'Đã thay 8 khay'),
(6, '2023-12-01', '2024-12-01', 'Niềng răng mắc cài kim loại', 'completed', 'Đã hoàn thành và tháo máng')
ON CONFLICT DO NOTHING;

-- Link Doctors to Cases
INSERT INTO case_doctors (case_id, doctor_id, role) VALUES
(1, 1, 'primary'),
(2, 2, 'primary'),
(3, 1, 'primary'),
(4, 2, 'primary'),
(5, 1, 'primary'),
(5, 2, 'consultant'),
(6, 1, 'primary')
ON CONFLICT DO NOTHING;

-- Seed Visits (Lần khám) - sử dụng doctor user_id từ bảng users
INSERT INTO visits (patient_id, case_id, visit_date, status, notes, created_by) VALUES
(1, 1, '2025-01-15', 'completed', 'Lần khám đầu tiên - Chụp ảnh và đo kích thước', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 1, '2025-02-15', 'completed', 'Tháng 1 - Kiểm tra tiến độ', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 1, '2025-03-15', 'in_progress', 'Tháng 2 - Thay dây cung', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(2, 2, '2025-02-20', 'completed', 'Lần khám đầu tiên - Tư vấn và chụp ảnh', (SELECT id FROM users WHERE username = 'dr.tran')),
(2, 2, '2025-03-20', 'pending', 'Tháng 1 - Theo dõi', (SELECT id FROM users WHERE username = 'dr.tran')),
(3, 3, '2024-11-10', 'completed', 'Khám ban đầu và lên kế hoạch điều trị', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(3, 3, '2024-12-10', 'completed', 'Tháng 1 - Gắn mắc cài', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(4, 4, '2025-03-05', 'completed', 'Khám tư vấn lần đầu', (SELECT id FROM users WHERE username = 'dr.tran')),
(5, 5, '2024-08-15', 'completed', 'Bắt đầu liệu trình Invisalign', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(5, 5, '2025-03-10', 'in_progress', 'Kiểm tra và thay khay số 8', (SELECT id FROM users WHERE username = 'dr.nguyen'))
ON CONFLICT DO NOTHING;

-- Seed Images (Ảnh mẫu - RAW và Stained)
-- Visit 1 của Patient 1 (9 RAW + 9 Stained)
INSERT INTO images (visit_id, url, image_category, image_type, image_index, validation_status, notes) VALUES
-- RAW images
(1, '/nhakhoa/visits/1/raw_001.jpg', 'raw', 'frontal', 1, 'valid', 'Ảnh mặt trước - góc chính diện'),
(1, '/nhakhoa/visits/1/raw_002.jpg', 'raw', 'lateral_right', 2, 'valid', 'Ảnh nghiêng phải'),
(1, '/nhakhoa/visits/1/raw_003.jpg', 'raw', 'lateral_left', 3, 'valid', 'Ảnh nghiêng trái'),
(1, '/nhakhoa/visits/1/raw_004.jpg', 'raw', 'upper_occlusal', 4, 'valid', 'Ảnh răng hàm trên'),
(1, '/nhakhoa/visits/1/raw_005.jpg', 'raw', 'lower_occlusal', 5, 'valid', 'Ảnh răng hàm dưới'),
(1, '/nhakhoa/visits/1/raw_006.jpg', 'raw', 'smile', 6, 'valid', 'Ảnh cười'),
(1, '/nhakhoa/visits/1/raw_007.jpg', 'raw', 'profile_right', 7, 'valid', 'Ảnh profile phải'),
(1, '/nhakhoa/visits/1/raw_008.jpg', 'raw', 'profile_left', 8, 'valid', 'Ảnh profile trái'),
(1, '/nhakhoa/visits/1/raw_009.jpg', 'raw', 'bite', 9, 'valid', 'Ảnh cắn răng'),
-- Stained images
(1, '/nhakhoa/visits/1/stained_001.jpg', 'stained', 'frontal', 1, 'valid', 'Ảnh mặt trước sau nhuộm'),
(1, '/nhakhoa/visits/1/stained_002.jpg', 'stained', 'lateral_right', 2, 'valid', 'Ảnh nghiêng phải sau nhuộm'),
(1, '/nhakhoa/visits/1/stained_003.jpg', 'stained', 'lateral_left', 3, 'valid', 'Ảnh nghiêng trái sau nhuộm'),
(1, '/nhakhoa/visits/1/stained_004.jpg', 'stained', 'upper_occlusal', 4, 'valid', 'Ảnh răng hàm trên sau nhuộm'),
(1, '/nhakhoa/visits/1/stained_005.jpg', 'stained', 'lower_occlusal', 5, 'valid', 'Ảnh răng hàm dưới sau nhuộm'),
(1, '/nhakhoa/visits/1/stained_006.jpg', 'stained', 'smile', 6, 'valid', 'Ảnh cười sau nhuộm'),
(1, '/nhakhoa/visits/1/stained_007.jpg', 'stained', 'profile_right', 7, 'valid', 'Ảnh profile phải sau nhuộm'),
(1, '/nhakhoa/visits/1/stained_008.jpg', 'stained', 'profile_left', 8, 'valid', 'Ảnh profile trái sau nhuộm'),
(1, '/nhakhoa/visits/1/stained_009.jpg', 'stained', 'bite', 9, 'valid', 'Ảnh cắn răng sau nhuộm')
ON CONFLICT DO NOTHING;

-- Visit 4 của Patient 2 (một số ảnh đang pending)
INSERT INTO images (visit_id, url, image_category, image_type, image_index, validation_status, notes) VALUES
(4, '/nhakhoa/visits/4/raw_001.jpg', 'raw', 'frontal', 1, 'pending', 'Chờ kiểm tra'),
(4, '/nhakhoa/visits/4/raw_002.jpg', 'raw', 'lateral_right', 2, 'pending', 'Chờ kiểm tra'),
(4, '/nhakhoa/visits/4/raw_003.jpg', 'raw', 'lateral_left', 3, 'valid', 'Đã xác nhận'),
(4, '/nhakhoa/visits/4/stained_001.jpg', 'stained', 'frontal', 1, 'pending', 'Chờ kiểm tra')
ON CONFLICT DO NOTHING;

-- Seed Subboxes (Vùng phát hiện răng/mắc cài)
INSERT INTO subboxes (image_id, region, coordinates, box_type, confidence) VALUES
(1, 'upper', '{"x": 120, "y": 80, "width": 200, "height": 60}', 'tooth', 0.95),
(1, 'lower', '{"x": 120, "y": 180, "width": 200, "height": 60}', 'tooth', 0.92),
(1, 'left', '{"x": 80, "y": 120, "width": 100, "height": 120}', 'bracket', 0.88),
(1, 'right', '{"x": 260, "y": 120, "width": 100, "height": 120}', 'bracket', 0.90),
(10, 'upper', '{"x": 115, "y": 75, "width": 210, "height": 65}', 'tooth', 0.93),
(10, 'lower', '{"x": 115, "y": 175, "width": 210, "height": 65}', 'tooth', 0.91)
ON CONFLICT DO NOTHING;

-- Seed Labels (Nhãn gán cho ảnh/subbox) - sử dụng doctor user_id
INSERT INTO labels (image_id, subbox_id, label_type, value, description, labeled_by) VALUES
(1, 1, 'tooth_condition', 'healthy', 'Răng khỏe mạnh', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 2, 'tooth_condition', 'crowded', 'Răng chen chúc', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 3, 'bracket_status', 'installed', 'Đã gắn mắc cài', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 4, 'bracket_status', 'installed', 'Đã gắn mắc cài', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(10, 5, 'plaque_level', 'high', 'Mảng bám nhiều', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(10, 6, 'plaque_level', 'medium', 'Mảng bám trung bình', (SELECT id FROM users WHERE username = 'dr.nguyen'))
ON CONFLICT DO NOTHING;

-- Seed Image Validations (9 tiêu chí kiểm tra) - sử dụng doctor user_id
INSERT INTO image_validations (image_id, criteria, result, notes, validated_by) VALUES
(1, 'quality', true, 'Chất lượng ảnh tốt', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 'angle', true, 'Góc chụp chuẩn', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 'lighting', true, 'Ánh sáng đầy đủ', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 'focus', true, 'Ảnh sắc nét', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 'coverage', true, 'Bao phủ đủ vùng cần thiết', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 'color', true, 'Màu sắc chính xác', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 'exposure', true, 'Độ phơi sáng phù hợp', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 'composition', true, 'Bố cục hợp lý', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 'artifacts', true, 'Không có nhiễu', (SELECT id FROM users WHERE username = 'dr.nguyen')),
-- Ảnh pending có một số tiêu chí fail
(19, 'quality', true, 'Chất lượng OK', (SELECT id FROM users WHERE username = 'dr.tran')),
(19, 'angle', false, 'Góc chụp chưa chuẩn', (SELECT id FROM users WHERE username = 'dr.tran')),
(19, 'lighting', false, 'Thiếu ánh sáng', (SELECT id FROM users WHERE username = 'dr.tran'))
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================
SELECT 'Database initialization completed successfully!' as message;
SELECT 'Users: ' || COUNT(*) as count FROM users;
SELECT 'Doctors: ' || COUNT(*) as count FROM doctors;
SELECT 'Patients: ' || COUNT(*) as count FROM patients;
SELECT 'Cases: ' || COUNT(*) as count FROM cases;
SELECT 'Visits: ' || COUNT(*) as count FROM visits;
SELECT 'Images: ' || COUNT(*) as count FROM images;
SELECT 'Subboxes: ' || COUNT(*) as count FROM subboxes;
SELECT 'Labels: ' || COUNT(*) as count FROM labels;
SELECT 'Validations: ' || COUNT(*) as count FROM image_validations;
