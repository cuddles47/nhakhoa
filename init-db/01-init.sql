-- =====================================================
-- SCHEMA DATABASE CHO HỆ THỐNG QUẢN LÝ NHA KHOA
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng ảnh (18 ảnh: 9 raw + 9 nhuộm)
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER REFERENCES visits(id) ON DELETE CASCADE,
    url_minio VARCHAR(255) NOT NULL,
    image_category VARCHAR(20) NOT NULL, -- raw, stained
    image_type VARCHAR(50), -- frontal, lateral, occlusal, upper, lower, left, right, etc.
    image_index INTEGER, -- 1-9 cho mỗi category
    validation_status VARCHAR(20) DEFAULT 'pending', -- pending, valid, invalid
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Tạo index để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_images_visit ON images(visit_id);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(image_category);
CREATE INDEX IF NOT EXISTS idx_subboxes_image ON subboxes(image_id);
CREATE INDEX IF NOT EXISTS idx_labels_image ON labels(image_id);

-- Insert dữ liệu mẫu cho user admin
INSERT INTO users (username, password_hash, role, full_name, email) 
VALUES ('admin', '$2b$10$YourHashedPasswordHere', 'admin', 'Administrator', 'admin@nhakhoa.com')
ON CONFLICT (username) DO NOTHING;
