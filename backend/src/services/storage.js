const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: 'YOUR_MINIO_ENDPOINT',
  port: 9000,
  useSSL: false,
  accessKey: 'YOUR_ACCESS_KEY',
  secretKey: 'YOUR_SECRET_KEY'
});

const uploadFile = async (bucketName, objectName, file) => {
  try {
    await minioClient.fPutObject(bucketName, objectName, file);
    return { success: true, message: 'File uploaded successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getFile = async (bucketName, objectName) => {
  try {
    const fileStream = await minioClient.getObject(bucketName, objectName);
    return fileStream;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  uploadFile,
  getFile
};