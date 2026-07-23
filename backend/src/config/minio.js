const Minio = require('minio');

// Debug environment variables
console.log('🔍 MinIO Environment Check:');
console.log('  MINIO_HOST:', process.env.MINIO_HOST);
console.log('  MINIO_PORT:', process.env.MINIO_PORT);
console.log('  MINIO_USE_SSL:', process.env.MINIO_USE_SSL);

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST || '100.93.48.110',
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin123'
});

module.exports = minioClient;