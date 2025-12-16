-- Tạo bảng bệnh nhân
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dob DATE,
    gender VARCHAR(10),
    contact VARCHAR(100),
    notes TEXT
);

-- Tạo bảng bác sĩ
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    contact VARCHAR(100)
);

-- Tạo bảng hồ sơ chỉnh nha
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    treatment_type VARCHAR(100),
    status VARCHAR(50),
    notes TEXT
);

-- Liên kết bác sĩ với hồ sơ
CREATE TABLE IF NOT EXISTS case_doctors (
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    role VARCHAR(50),
    PRIMARY KEY (case_id, doctor_id)
);

-- Tạo bảng ảnh/X-quang
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    url_minio VARCHAR(255) NOT NULL,
    image_type VARCHAR(50),
    taken_at DATE,
    notes TEXT
);

-- Tạo bảng gán nhãn
CREATE TABLE IF NOT EXISTS labels (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    label_type VARCHAR(50),
    value VARCHAR(100),
    description TEXT,
    labeled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
