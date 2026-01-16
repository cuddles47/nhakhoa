-- =====================================================
-- Seed Data Script
-- For UAT/Staging Environment
-- Generated: 2026-01-14
-- Creates initial users and sample data
-- =====================================================

-- =====================================================
-- DEFAULT ADMIN USER
-- =====================================================
-- Password: admin123 (hashed with bcrypt, salt rounds: 10)
-- IMPORTANT: Change this password in production!
INSERT INTO users (username, password_hash, role, full_name, email) 
VALUES (
    'admin',
    '$2b$10$YourHashedPasswordHere', -- This should be properly hashed
    'admin',
    'System Administrator',
    'admin@nhakhoa.local'
) ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- SAMPLE DOCTOR USER
-- =====================================================
-- Password: doctor123 (hashed with bcrypt, salt rounds: 10)
INSERT INTO users (username, password_hash, role, full_name, email) 
VALUES (
    'doctor1',
    '$2b$10$YourHashedPasswordHere', -- This should be properly hashed
    'doctor',
    'Dr. Nguyen Van A',
    'doctor1@nhakhoa.local'
) ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- LINK DOCTOR TO USER
-- =====================================================
INSERT INTO doctors (user_id, name, specialty, contact)
SELECT 
    id,
    'Dr. Nguyen Van A',
    'General Dentistry',
    'doctor1@nhakhoa.local'
FROM users 
WHERE username = 'doctor1'
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE PATIENT (Optional for testing)
-- =====================================================
-- Uncomment if you want sample data for testing
/*
INSERT INTO patients (name, phone, dob, gender, notes)
VALUES (
    'Nguyen Thi B',
    '0901234567',
    '1990-01-15',
    'Female',
    'Sample patient for testing'
);

-- Sample visit for the patient
INSERT INTO visits (patient_id, visit_date, status, notes, created_by)
SELECT 
    p.id,
    CURRENT_DATE,
    'pending',
    'Initial consultation',
    u.id
FROM patients p, users u
WHERE p.name = 'Nguyen Thi B' 
AND u.username = 'doctor1'
LIMIT 1;
*/

-- =====================================================
-- IMPORTANT NOTES FOR DEPLOYMENT
-- =====================================================
-- 1. Replace password hashes with properly generated bcrypt hashes
-- 2. Generate hashes using: bcrypt.hash('your_password', 10)
-- 3. For production, use strong passwords
-- 4. Consider using environment variables for sensitive data
-- 5. Uncomment sample data sections only for development/staging

-- =====================================================
-- PASSWORD HASH GENERATION EXAMPLES
-- =====================================================
-- Node.js example:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('admin123', 10);
-- console.log(hash);

-- Python example:
-- import bcrypt
-- password = b"admin123"
-- hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=10))
-- print(hashed.decode())

-- =====================================================
-- DEFAULT PASSWORD RECOMMENDATIONS
-- =====================================================
-- Admin user: Create a strong password (min 12 chars, mixed case, numbers, symbols)
-- Doctor users: Use temporary passwords that must be changed on first login
-- Consider implementing password expiry policies
