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
    return { success: true, url };
  } catch (error) {
    console.error('Error getting presigned URL:', error);
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

module.exports = {
  uploadFile,
  uploadFiles,
  getFileUrl,
  getPresignedUrl,
  deleteFile,
  deleteFiles,
  ensureBucket
};