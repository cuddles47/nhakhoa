/**
 * Test script for Image Processing Service
 * Cách sử dụng imageProcessingService từ backend
 */

const imageProcessingService = require('./imageProcessingService');
const fs = require('fs');
const path = require('path');

async function testDivideCorners() {
  console.log('Testing divide-corners endpoint...\n');
  
  try {
    // Health check trước
    const health = await imageProcessingService.healthCheck();
    console.log('✓ Health check:', health);
    
    // Chuẩn bị test data (giả sử có 2 ảnh test)
    const images = [
      { path: '/path/to/image1.jpg', filename: 'image1.jpg' },
      { path: '/path/to/image2.jpg', filename: 'image2.jpg' }
    ];
    
    const annotations = [
      { path: '/path/to/image1.txt', filename: 'image1.txt' },
      { path: '/path/to/image2.txt', filename: 'image2.txt' }
    ];
    
    // Gọi service
    console.log('\nProcessing images...');
    const zipBuffer = await imageProcessingService.divideCorners(images, annotations);
    
    // Lưu kết quả
    const outputPath = path.join(__dirname, 'test_output.zip');
    fs.writeFileSync(outputPath, zipBuffer);
    console.log(`✓ Results saved to: ${outputPath}`);
    console.log(`✓ ZIP file size: ${(zipBuffer.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

async function testAugmentation() {
  console.log('\n\nTesting augmentation endpoint...\n');
  
  try {
    // Lấy danh sách augmentations
    const augs = await imageProcessingService.getAvailableAugmentations();
    console.log('✓ Available augmentations:', augs.augmentations);
    
    // Chuẩn bị test data
    const images = [
      { path: '/path/to/processed_image1.jpg', filename: 'processed_image1.jpg' }
    ];
    
    const annotations = [
      { path: '/path/to/processed_image1.txt', filename: 'processed_image1.txt' }
    ];
    
    // Gọi service với options
    console.log('\nAugmenting dataset...');
    const zipBuffer = await imageProcessingService.augmentDataset(
      images, 
      annotations,
      {
        augmentations: ['rotate_left', 'flip'],
        createSubfolders: true
      }
    );
    
    // Lưu kết quả
    const outputPath = path.join(__dirname, 'test_augmented.zip');
    fs.writeFileSync(outputPath, zipBuffer);
    console.log(`✓ Results saved to: ${outputPath}`);
    console.log(`✓ ZIP file size: ${(zipBuffer.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

async function testWithMinIOUrls() {
  console.log('\n\nTesting with MinIO URLs...\n');
  
  try {
    // Giả sử có presigned URLs từ MinIO
    const imageUrls = [
      'http://localhost:9000/nhakhoa/visits/123/raw/image1.jpg?signature=...',
      'http://localhost:9000/nhakhoa/visits/123/raw/image2.jpg?signature=...'
    ];
    
    const annotationUrls = [
      'http://localhost:9000/nhakhoa/visits/123/annotations/image1.txt?signature=...',
      'http://localhost:9000/nhakhoa/visits/123/annotations/image2.txt?signature=...'
    ];
    
    console.log('Processing images from MinIO URLs...');
    const zipBuffer = await imageProcessingService.divideCornersByUrls(
      imageUrls, 
      annotationUrls
    );
    
    const outputPath = path.join(__dirname, 'test_minio.zip');
    fs.writeFileSync(outputPath, zipBuffer);
    console.log(`✓ Results saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

// Chạy tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('IMAGE PROCESSING SERVICE - TEST SCRIPT');
  console.log('='.repeat(60));
  
  // Uncomment để chạy từng test
  // await testDivideCorners();
  // await testAugmentation();
  // await testWithMinIOUrls();
  
  console.log('\n' + '='.repeat(60));
  console.log('Tests completed');
  console.log('='.repeat(60));
}

// Export functions để sử dụng từ nơi khác
module.exports = {
  testDivideCorners,
  testAugmentation,
  testWithMinIOUrls
};

// Chạy nếu file được execute trực tiếp
if (require.main === module) {
  runTests();
}
