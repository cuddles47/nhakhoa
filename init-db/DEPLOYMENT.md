# Database Deployment Guide for UAT/Staging

## Quick Start

### 1. Generate Password Hashes

```bash
cd init-db
npm install bcrypt  # If not already installed
node generate_password_hash.js "your_admin_password"
node generate_password_hash.js "your_doctor_password"
```

Copy the generated hashes to `005_seed_data.sql`.

### 2. Update Environment Variables

Create or update `.env` file in project root:

```env
# Database Configuration
DB_NAME=dental_db
DB_USER=dental_user
DB_PASSWORD=your_strong_password_here

# PostgreSQL Admin (default)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_admin_password
```

### 3. Deploy Fresh Database

```bash
# Stop existing containers and remove volumes
docker-compose down -v

# Start PostgreSQL (init scripts will run automatically)
docker-compose up -d postgres

# Wait for initialization (check logs)
docker-compose logs -f postgres
```

### 4. Verify Deployment

```bash
# Run test script
./init-db/test_init_scripts.sh

# Or manually verify
docker exec -it nhakhoa-postgres psql -U postgres -d dental_db
\dt  # List tables
SELECT * FROM users;  # Check users
\q
```

## What Gets Created

### Database Structure

- **12 tables** with full schema including:
  - Users and authentication
  - Patient management
  - Visit tracking
  - Image storage and processing
  - COCO annotations with subboxes
  - Audit trails

- **40+ indexes** for optimal query performance

- **Foreign key constraints** ensuring data integrity

### Default Users

The seed script creates:
- Admin user (username: `admin`)
- Sample doctor (username: `doctor1`)

⚠️ **Remember to change the password hashes in 005_seed_data.sql**

## Migration from Dev to UAT/Staging

### Option 1: Fresh Install (Recommended)

Use the init scripts as documented above. This ensures a clean, consistent environment.

### Option 2: Migrate Existing Data

```bash
# 1. Export data from dev (excluding schema)
docker exec nhakhoa-postgres pg_dump -U postgres -d dental_db \
  --data-only \
  --exclude-table=annotation_history \
  --exclude-table=image_validations \
  > dev_data_export.sql

# 2. Deploy fresh schema to UAT/Staging (see Quick Start)

# 3. Import data
docker exec -i nhakhoa-postgres psql -U dental_user -d dental_db \
  < dev_data_export.sql
```

### Option 3: Clone Entire Database

```bash
# 1. Full backup from dev
docker exec nhakhoa-postgres pg_dump -U postgres -d dental_db \
  > dev_full_backup.sql

# 2. On UAT/Staging, create database
docker exec nhakhoa-postgres psql -U postgres \
  -c "CREATE DATABASE dental_db;"

# 3. Restore
docker exec -i nhakhoa-postgres psql -U postgres -d dental_db \
  < dev_full_backup.sql
```

## Troubleshooting

### Init Scripts Not Running

**Problem**: Tables not created after container start

**Solution**:
```bash
# Init scripts only run on first start with empty volume
docker-compose down -v  # -v removes volumes
docker volume rm nhakhoa_postgres_data  # If needed
docker-compose up -d postgres
```

### Password Authentication Failed

**Problem**: Cannot connect with dental_user

**Solution**:
```bash
# Check if user exists
docker exec nhakhoa-postgres psql -U postgres -c "\du"

# If missing, create manually
docker exec nhakhoa-postgres psql -U postgres -d dental_db -c "
  CREATE USER dental_user WITH PASSWORD 'your_password';
  GRANT ALL PRIVILEGES ON DATABASE dental_db TO dental_user;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dental_user;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dental_user;
"
```

### Foreign Key Violations During Import

**Problem**: Cannot import data due to FK constraints

**Solution**:
```bash
# Disable triggers temporarily
docker exec -i nhakhoa-postgres psql -U postgres -d dental_db << EOF
SET session_replication_role = replica;
-- Run your import here
\i /path/to/data.sql
SET session_replication_role = DEFAULT;
EOF
```

### Check Init Script Execution

```bash
# View PostgreSQL logs during initialization
docker-compose logs postgres

# Check for errors
docker-compose logs postgres | grep -i error
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Changed default doctor password  
- [ ] Updated DB_PASSWORD in .env
- [ ] Set POSTGRES_PASSWORD in .env
- [ ] Removed or commented sample data in 005_seed_data.sql
- [ ] Restricted database port (5432) to internal network only
- [ ] Enabled SSL for PostgreSQL (production)
- [ ] Set up regular backups
- [ ] Implemented backup retention policy

## Backup Strategy

### Automated Daily Backup

Add to crontab:
```bash
0 2 * * * docker exec nhakhoa-postgres pg_dump -U postgres -d dental_db | gzip > /backups/dental_db_$(date +\%Y\%m\%d).sql.gz
```

### Manual Backup

```bash
# Full backup
docker exec nhakhoa-postgres pg_dump -U postgres -d dental_db \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker exec nhakhoa-postgres pg_dump -U postgres -d dental_db | \
  gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from Backup

```bash
# Restore from plain SQL
docker exec -i nhakhoa-postgres psql -U postgres -d dental_db \
  < backup_20260114.sql

# Restore from compressed
gunzip -c backup_20260114.sql.gz | \
  docker exec -i nhakhoa-postgres psql -U postgres -d dental_db
```

## Performance Tuning

For production/staging with larger datasets:

```sql
-- Update PostgreSQL configuration
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Restart PostgreSQL
docker-compose restart postgres
```

## Monitoring

### Check Database Size

```bash
docker exec nhakhoa-postgres psql -U postgres -d dental_db -c "
  SELECT 
    pg_size_pretty(pg_database_size('dental_db')) as db_size,
    pg_size_pretty(pg_total_relation_size('images')) as images_table_size,
    pg_size_pretty(pg_total_relation_size('image_annotations')) as annotations_table_size;
"
```

### Check Connection Count

```bash
docker exec nhakhoa-postgres psql -U postgres -c "
  SELECT count(*) FROM pg_stat_activity WHERE datname = 'dental_db';
"
```

### Monitor Slow Queries

```bash
docker exec nhakhoa-postgres psql -U postgres -d dental_db -c "
  SELECT query, calls, total_time, mean_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"
```

## Support

For issues during deployment:
1. Check logs: `docker-compose logs postgres`
2. Run test script: `./init-db/test_init_scripts.sh`
3. Verify schema: Compare with `schema_export.sql` from dev
4. Contact development team

## File Structure

```
init-db/
├── README.md                          # This file
├── DEPLOYMENT.md                      # Deployment guide (this file)
├── 001_create_database_and_users.sql  # DB and user setup
├── 002_create_tables.sql              # Table definitions
├── 003_create_indexes.sql             # Performance indexes
├── 004_create_foreign_keys.sql        # Relationships
├── 005_seed_data.sql                  # Default users
├── generate_password_hash.js          # Password hash generator
└── test_init_scripts.sh               # Verification script
```

## Next Steps

After successful deployment:
1. Update application connection strings to use `dental_db`
2. Test all application features
3. Set up monitoring and alerting
4. Configure automated backups
5. Document any environment-specific configurations
6. Perform load testing
7. Set up disaster recovery procedures
