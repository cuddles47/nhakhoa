-- =====================================================
-- SEED DATA FOR NHAKHOA DATABASE
-- =====================================================

-- Seed Users (Bác sĩ và nhân viên)
INSERT INTO users (username, password_hash, role, full_name, email) VALUES
('admin', '$2b$10$YourHashedPasswordHere', 'admin', 'Quản Trị Viên', 'admin@nhakhoa.com'),
('dr.nguyen', '$2b$10$YourHashedPasswordHere', 'doctor', 'BS. Nguyễn Văn A', 'nguyen@nhakhoa.com'),
('dr.tran', '$2b$10$YourHashedPasswordHere', 'doctor', 'BS. Trần Thị B', 'tran@nhakhoa.com'),
('assistant1', '$2b$10$YourHashedPasswordHere', 'assistant', 'Trợ Lý Phạm C', 'pham@nhakhoa.com')
ON CONFLICT (username) DO NOTHING;

-- Seed Doctors (sử dụng user_id thực tế từ bảng users)
INSERT INTO doctors (user_id, name, specialty, contact) VALUES
((SELECT id FROM users WHERE username = 'dr.nguyen'), 'BS. Nguyễn Văn A', 'Chỉnh nha', '0901234567'),
((SELECT id FROM users WHERE username = 'dr.tran'), 'BS. Trần Thị B', 'Nha khoa thẩm mỹ', '0912345678');

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
('Mai Thị Kim', '0865432109', '1996-02-28', 'female', 'Bệnh nhân giới thiệu');

-- Seed Cases (Hồ sơ điều trị)
INSERT INTO cases (patient_id, start_date, end_date, treatment_type, status, notes) VALUES
(1, '2025-01-15', NULL, 'Niềng răng mắc cài kim loại', 'active', 'Đang trong giai đoạn điều trị'),
(2, '2025-02-20', NULL, 'Niềng răng trong suốt', 'active', 'Tiến triển tốt'),
(3, '2024-11-10', '2025-11-10', 'Niềng răng mắc cài sứ', 'active', 'Dự kiến 12 tháng'),
(4, '2025-03-05', NULL, 'Niềng răng mắc cài tự buộc', 'active', 'Lần đầu điều trị'),
(5, '2024-08-15', NULL, 'Niềng răng trong suốt Invisalign', 'active', 'Đã thay 8 khay'),
(7, '2023-12-01', '2024-12-01', 'Niềng răng mắc cài kim loại', 'completed', 'Đã hoàn thành và tháo máng');

-- Link Doctors to Cases
INSERT INTO case_doctors (case_id, doctor_id, role) VALUES
(1, 1, 'primary'),
(2, 2, 'primary'),
(3, 1, 'primary'),
(4, 2, 'primary'),
(5, 1, 'primary'),
(5, 2, 'consultant'),
(6, 1, 'primary');

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
(5, 5, '2025-03-10', 'in_progress', 'Kiểm tra và thay khay số 8', (SELECT id FROM users WHERE username = 'dr.nguyen'));

-- Seed Images (Ảnh mẫu - RAW và Stained)
-- Visit 1 của Patient 1 (9 RAW + 9 Stained)
INSERT INTO images (visit_id, url_minio, image_category, image_type, image_index, validation_status, notes) VALUES
-- RAW images
(1, 'nhakhoa/visits/1/raw_001.jpg', 'raw', 'frontal', 1, 'valid', 'Ảnh mặt trước - góc chính diện'),
(1, 'nhakhoa/visits/1/raw_002.jpg', 'raw', 'lateral_right', 2, 'valid', 'Ảnh nghiêng phải'),
(1, 'nhakhoa/visits/1/raw_003.jpg', 'raw', 'lateral_left', 3, 'valid', 'Ảnh nghiêng trái'),
(1, 'nhakhoa/visits/1/raw_004.jpg', 'raw', 'upper_occlusal', 4, 'valid', 'Ảnh răng hàm trên'),
(1, 'nhakhoa/visits/1/raw_005.jpg', 'raw', 'lower_occlusal', 5, 'valid', 'Ảnh răng hàm dưới'),
(1, 'nhakhoa/visits/1/raw_006.jpg', 'raw', 'smile', 6, 'valid', 'Ảnh cười'),
(1, 'nhakhoa/visits/1/raw_007.jpg', 'raw', 'profile_right', 7, 'valid', 'Ảnh profile phải'),
(1, 'nhakhoa/visits/1/raw_008.jpg', 'raw', 'profile_left', 8, 'valid', 'Ảnh profile trái'),
(1, 'nhakhoa/visits/1/raw_009.jpg', 'raw', 'bite', 9, 'valid', 'Ảnh cắn răng'),
-- Stained images
(1, 'nhakhoa/visits/1/stained_001.jpg', 'stained', 'frontal', 1, 'valid', 'Ảnh mặt trước sau nhuộm'),
(1, 'nhakhoa/visits/1/stained_002.jpg', 'stained', 'lateral_right', 2, 'valid', 'Ảnh nghiêng phải sau nhuộm'),
(1, 'nhakhoa/visits/1/stained_003.jpg', 'stained', 'lateral_left', 3, 'valid', 'Ảnh nghiêng trái sau nhuộm'),
(1, 'nhakhoa/visits/1/stained_004.jpg', 'stained', 'upper_occlusal', 4, 'valid', 'Ảnh răng hàm trên sau nhuộm'),
(1, 'nhakhoa/visits/1/stained_005.jpg', 'stained', 'lower_occlusal', 5, 'valid', 'Ảnh răng hàm dưới sau nhuộm'),
(1, 'nhakhoa/visits/1/stained_006.jpg', 'stained', 'smile', 6, 'valid', 'Ảnh cười sau nhuộm'),
(1, 'nhakhoa/visits/1/stained_007.jpg', 'stained', 'profile_right', 7, 'valid', 'Ảnh profile phải sau nhuộm'),
(1, 'nhakhoa/visits/1/stained_008.jpg', 'stained', 'profile_left', 8, 'valid', 'Ảnh profile trái sau nhuộm'),
(1, 'nhakhoa/visits/1/stained_009.jpg', 'stained', 'bite', 9, 'valid', 'Ảnh cắn răng sau nhuộm');

-- Visit 4 của Patient 2 (một số ảnh đang pending)
INSERT INTO images (visit_id, url_minio, image_category, image_type, image_index, validation_status, notes) VALUES
(4, 'nhakhoa/visits/4/raw_001.jpg', 'raw', 'frontal', 1, 'pending', 'Chờ kiểm tra'),
(4, 'nhakhoa/visits/4/raw_002.jpg', 'raw', 'lateral_right', 2, 'pending', 'Chờ kiểm tra'),
(4, 'nhakhoa/visits/4/raw_003.jpg', 'raw', 'lateral_left', 3, 'valid', 'Đã xác nhận'),
(4, 'nhakhoa/visits/4/stained_001.jpg', 'stained', 'frontal', 1, 'pending', 'Chờ kiểm tra');

-- Seed Subboxes (Vùng phát hiện răng/mắc cài)
INSERT INTO subboxes (image_id, region, coordinates, box_type, confidence) VALUES
(1, 'upper', '{"x": 120, "y": 80, "width": 200, "height": 60}', 'tooth', 0.95),
(1, 'lower', '{"x": 120, "y": 180, "width": 200, "height": 60}', 'tooth', 0.92),
(1, 'left', '{"x": 80, "y": 120, "width": 100, "height": 120}', 'bracket', 0.88),
(1, 'right', '{"x": 260, "y": 120, "width": 100, "height": 120}', 'bracket', 0.90),
(10, 'upper', '{"x": 115, "y": 75, "width": 210, "height": 65}', 'tooth', 0.93),
(10, 'lower', '{"x": 115, "y": 175, "width": 210, "height": 65}', 'tooth', 0.91);

-- Seed Labels (Nhãn gán cho ảnh/subbox) - sử dụng doctor user_id
INSERT INTO labels (image_id, subbox_id, label_type, value, description, labeled_by) VALUES
(1, 1, 'tooth_condition', 'healthy', 'Răng khỏe mạnh', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 2, 'tooth_condition', 'crowded', 'Răng chen chúc', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 3, 'bracket_status', 'installed', 'Đã gắn mắc cài', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(1, 4, 'bracket_status', 'installed', 'Đã gắn mắc cài', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(10, 5, 'plaque_level', 'high', 'Mảng bám nhiều', (SELECT id FROM users WHERE username = 'dr.nguyen')),
(10, 6, 'plaque_level', 'medium', 'Mảng bám trung bình', (SELECT id FROM users WHERE username = 'dr.nguyen'));

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
(19, 'lighting', false, 'Thiếu ánh sáng', (SELECT id FROM users WHERE username = 'dr.tran'));

-- Summary Report
SELECT 'Seed data completed successfully!' as message;
SELECT 'Users: ' || COUNT(*) as count FROM users;
SELECT 'Doctors: ' || COUNT(*) as count FROM doctors;
SELECT 'Patients: ' || COUNT(*) as count FROM patients;
SELECT 'Cases: ' || COUNT(*) as count FROM cases;
SELECT 'Visits: ' || COUNT(*) as count FROM visits;
SELECT 'Images: ' || COUNT(*) as count FROM images;
SELECT 'Subboxes: ' || COUNT(*) as count FROM subboxes;
SELECT 'Labels: ' || COUNT(*) as count FROM labels;
SELECT 'Validations: ' || COUNT(*) as count FROM image_validations;
