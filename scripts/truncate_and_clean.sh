#!/bin/bash

# Script to truncate database and clear image storage
# WARNING: This will delete ALL data!

set -e

echo "⚠️  WARNING: This will DELETE ALL data from database and MinIO storage!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo ""
echo "🗄️  Truncating database tables..."

# Connect to PostgreSQL and truncate tables
docker exec -i nhakhoa-postgres psql -U postgres -d dental_db <<-EOSQL
    -- Disable foreign key checks temporarily
    SET session_replication_role = 'replica';
    
    -- Truncate all tables
    TRUNCATE TABLE annotation_history CASCADE;
    TRUNCATE TABLE image_annotations CASCADE;
    TRUNCATE TABLE subboxes CASCADE;
    TRUNCATE TABLE labels CASCADE;
    TRUNCATE TABLE image_validations CASCADE;
    TRUNCATE TABLE images CASCADE;
    TRUNCATE TABLE visits CASCADE;
    TRUNCATE TABLE case_doctors CASCADE;
    TRUNCATE TABLE cases CASCADE;
    TRUNCATE TABLE doctors CASCADE;
    TRUNCATE TABLE patients CASCADE;
    TRUNCATE TABLE users CASCADE;
    
    -- Re-enable foreign key checks
    SET session_replication_role = 'origin';
    
    -- Reset sequences
    ALTER SEQUENCE users_user_id_seq RESTART WITH 1;
    ALTER SEQUENCE patients_patient_id_seq RESTART WITH 1;
    ALTER SEQUENCE doctors_doctor_id_seq RESTART WITH 1;
    ALTER SEQUENCE cases_case_id_seq RESTART WITH 1;
    ALTER SEQUENCE visits_visit_id_seq RESTART WITH 1;
    ALTER SEQUENCE images_image_id_seq RESTART WITH 1;
    ALTER SEQUENCE image_annotations_annotation_id_seq RESTART WITH 1;
    ALTER SEQUENCE subboxes_subbox_id_seq RESTART WITH 1;
    ALTER SEQUENCE labels_label_id_seq RESTART WITH 1;
    ALTER SEQUENCE image_validations_validation_id_seq RESTART WITH 1;
    ALTER SEQUENCE annotation_history_history_id_seq RESTART WITH 1;
EOSQL

echo "✅ Database truncated successfully!"

echo ""
echo "🗂️  Clearing MinIO storage..."

# Clear MinIO bucket
docker exec nhakhoa-minio sh -c '
    mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} > /dev/null 2>&1
    
    # List and remove all buckets
    for bucket in $(mc ls local | awk "{print \$5}"); do
        echo "  Removing bucket: $bucket"
        mc rb --force local/$bucket > /dev/null 2>&1 || true
    done
    
    echo "  Recreating dental-images bucket..."
    mc mb local/dental-images > /dev/null 2>&1 || true
    mc anonymous set download local/dental-images > /dev/null 2>&1 || true
'

echo "✅ MinIO storage cleared!"

echo ""
echo "🎉 All data has been cleared successfully!"
echo ""
echo "💡 Tip: You may want to recreate the default admin user"
echo "   Run: node backend/scripts/create_admin.js"
