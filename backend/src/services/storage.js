const minioClient = require('../config/minio');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = process.env.MINIO_BUCKET || 'nhakhoa';

// Ensure bucket exists
const ensureBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ Bucket ${BUCKET_NAME} created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring bucket:', error);
    throw error;
  }
};

// Upload file from buffer or file path
const uploadFile = async (objectName, source, metadata = {}) => {
  try {
    await ensureBucket();

    // If source is a file path, use fPutObject
    if (typeof source === 'string' && fs.existsSync(source)) {
      await minioClient.fPutObject(BUCKET_NAME, objectName, source, metadata);
    } 
    // If source is a buffer or stream, use putObject
    else {
      await minioClient.putObject(BUCKET_NAME, objectName, source, metadata);
    }

    const url = `/${BUCKET_NAME}/${objectName}`;
    return { success: true, url, objectName };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
};

// Upload multiple files (bulk upload)
const uploadFiles = async (files) => {
  const results = [];
  
  for (const file of files) {
    const result = await uploadFile(file.objectName, file.source, file.metadata);
    results.push({
      ...result,
      originalName: file.originalName
    });
  }
  
  return results;
};

// Get file URL
const getFileUrl = (objectName) => {
  return `/${BUCKET_NAME}/${objectName}`;
};

// Get presigned URL for download
const getPresignedUrl = async (objectName, expirySeconds = 3600) => {
  try {
    const url = await minioClient.presignedGetObject(BUCKET_NAME, objectName, expirySeconds);
    
    // Ensure the URL includes the full host (not just a relative path)
    // MinIO client sometimes returns relative URLs
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const host = process.env.MINIO_HOST || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    
    // If URL doesn't start with http, prepend the full MinIO URL
    if (!url.startsWith('http')) {
      const fullUrl = `${protocol}://${host}:${port}${url}`;
      return { success: true, url: fullUrl };
    }
    
    return { success: true, url };
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    return { success: false, error: error.message };
  }
};

// Get presigned PUT URL to allow clients to upload directly to MinIO
const getPresignedPutUrl = async (objectName, expirySeconds = 3600) => {
  try {
    const url = await minioClient.presignedPutObject(BUCKET_NAME, objectName, expirySeconds);
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const host = process.env.MINIO_HOST || 'localhost';
    const port = process.env.MINIO_PORT || '9000';

    if (!url.startsWith('http')) {
      const fullUrl = `${protocol}://${host}:${port}${url}`;
      return { success: true, url: fullUrl };
    }

    return { success: true, url };
  } catch (error) {
    console.error('Error getting presigned PUT URL:', error);
    return { success: false, error: error.message };
  }
};

// Delete file
const deleteFile = async (objectName) => {
  try {
    await minioClient.removeObject(BUCKET_NAME, objectName);
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

// Delete multiple files
const deleteFiles = async (objectNames) => {
  try {
    const objectsList = objectNames.map(name => ({ name }));
    await minioClient.removeObjects(BUCKET_NAME, objectsList);
    return { success: true, message: 'Files deleted successfully' };
  } catch (error) {
    console.error('Error deleting files:', error);
    return { success: false, error: error.message };
  }
};

// Download file as buffer
const downloadFile = async (objectName) => {
  try {
    return new Promise((resolve, reject) => {
      const chunks = [];
      minioClient.getObject(BUCKET_NAME, objectName, (err, dataStream) => {
        if (err) {
          reject(err);
          return;
        }
        dataStream.on('data', (chunk) => chunks.push(chunk));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
        dataStream.on('error', reject);
      });
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// Upload from buffer
const uploadFromBuffer = async (buffer, objectName, contentType = 'application/octet-stream') => {
  try {
    await ensureBucket();
    
    const metadata = {
      'Content-Type': contentType
    };
    
    await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, metadata);
    
    const url = `/${BUCKET_NAME}/${objectName}`;
    return { success: true, url, objectName };
  } catch (error) {
    console.error('Error uploading from buffer:', error);
    throw error;
  }
};

const crypto = require('crypto');

/**
 * Check if an object exists in MinIO
 */
const objectExists = async (objectName) => {
  try {
    await minioClient.statObject(BUCKET_NAME, objectName);
    return true;
  } catch (err) {
    // statObject throws if object not found
    return false;
  }
};

/**
 * Compute SHA256 hex of a buffer
 */
const computeHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Upload buffer to a deterministic object path based on its hash if not already present.
 * Returns { success, url, objectName, existed, hash }
 */
const ensureUploadByHash = async (buffer, prefix = 'processed', ext = 'jpg', contentType = 'application/octet-stream') => {
  try {
    await ensureBucket();

    const hash = computeHash(buffer);
    const objectName = `${prefix}/${hash}.${ext}`;

    const exists = await objectExists(objectName);
    if (exists) {
      const url = `/${BUCKET_NAME}/${objectName}`;
      return { success: true, url, objectName, existed: true, hash };
    }

    // Upload with hash metadata
    const metadata = {
      'Content-Type': contentType,
      'X-Content-Hash': hash
    };

    await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, metadata);
    const url = `/${BUCKET_NAME}/${objectName}`;
    return { success: true, url, objectName, existed: false, hash };
  } catch (error) {
    console.error('Error in ensureUploadByHash:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  uploadFile,
  uploadFiles,
  uploadFromBuffer,
  getFileUrl,
  getPresignedUrl,
  getPresignedPutUrl,
  deleteFile,
  deleteFiles,
  downloadFile,
  ensureBucket,
  ensureUploadByHash,
  computeHash,
  objectExists
};