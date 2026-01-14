-- =====================================================
-- Database and User Creation Script
-- For UAT/Staging Environment
-- Generated: 2026-01-14
-- =====================================================

-- Create database if not exists (this will be run by docker-entrypoint-initdb.d)
-- The database name is controlled by POSTGRES_DB environment variable

-- Create application user with proper privileges
-- Password should be set via environment variables
CREATE USER IF NOT EXISTS dental_user WITH PASSWORD 'dental_password_change_me';

-- Grant necessary privileges to the application user
GRANT ALL PRIVILEGES ON DATABASE dental_db TO dental_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO dental_user;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dental_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dental_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO dental_user;

-- Set default search path
ALTER DATABASE dental_db SET search_path TO public;
