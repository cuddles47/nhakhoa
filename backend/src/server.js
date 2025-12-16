require('dotenv').config();
const express = require('express');
const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, async () => {
    console.log('==============================');
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log('==============================');

    const dbConfig = db.pool.options || db.pool;
    console.log('🔗 Database config:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Database: ${dbConfig.database}`);

    try {
        await db.pool.query('SELECT 1');
        console.log('✅ Database connection: SUCCESS');
    } catch (err) {
        console.error('❌ Database connection: FAILED');
        console.error(err.message);
    }
    // Thông tin kết nối MinIO và tạo bucket 'nhakhoa'
    try {
        const minioClient = require('./config/minio');
        console.log('🔗 MinIO config:');
        console.log(`   EndPoint: ${minioClient.endPoint}`);
        console.log(`   Port: ${minioClient.port}`);
        console.log(`   UseSSL: ${minioClient.useSSL}`);
        console.log(`   AccessKey: ${minioClient.accessKey}`);
        // Kiểm tra kết nối MinIO (list buckets)
        await minioClient.listBuckets()
            .then(buckets => {
                console.log('✅ MinIO connection: SUCCESS');
                console.log(`   Buckets: ${buckets.map(b => b.name).join(', ') || '(none)'}`);
            })
            .catch(err => {
                console.error('❌ MinIO connection: FAILED');
                console.error(err.message);
            });
        // Tạo bucket 'nhakhoa' nếu chưa tồn tại
        const BUCKET_NAME = process.env.MINIO_BUCKET || 'nhakhoa';
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`✅ Bucket '${BUCKET_NAME}' created`);
        } else {
            console.log(`✅ Bucket '${BUCKET_NAME}' already exists`);
        }
    } catch (err) {
        console.error('❌ MinIO config/bucket: FAILED');
        console.error(err.message);
    }
});