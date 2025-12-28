const imageProcessingService = require('../services/imageProcessingService');
const storageService = require('../services/storage');
const { Image, Annotation, Visit } = require('../models');
const annotationService = require('../services/annotationService');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class ImageProcessingController {
  async processRawImages(req, res) {
    const { visitId } = req.params;
    let tempDir = null;

    console.log('===== PROCESS IMAGES REQUEST RECEIVED =====');
    console.log('Visit ID:', visitId);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);

    try {
      // 1. Fetch visit to get annotation file URL
      const visit = await Visit.findById(visitId);
      if (!visit) {
        return res.status(404).json({
          success: false,
          error: 'Visit not found'
        });
      }

      // 2. Download patient-specific COCO file from MinIO if available
      let cocoData = null;
      if (visit.annotation_file_url) {
        try {
          console.log(`Downloading COCO file from: ${visit.annotation_file_url}`);
          const cocoObjectName = visit.annotation_file_url.replace(/^\/[^/]+\//, '');
          const cocoBuffer = await storageService.downloadFile(cocoObjectName);
          cocoData = JSON.parse(cocoBuffer.toString('utf-8'));
          console.log(`Loaded COCO: ${cocoData.images.length} images, ${cocoData.annotations.length} annotations`);
        } catch (error) {
          console.error('Failed to download COCO file:', error.message);
          // Continue without COCO - will use database annotations as fallback
        }
      }

      const rawImages = await Image.findByCategory(visitId, 'raw');
      
      console.log(`Found ${rawImages.length} raw images`);
      
      if (rawImages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Không tìm thấy ảnh raw nào'
        });
      }

      console.log(`Processing ${rawImages.length} raw images for visit ${visitId}`);

      const images = [];
      const annotations = [];

      for (const img of rawImages) {
        console.log(`Processing image ${img.id}: index=${img.image_index}, type=${img.image_type}, url=${img.url}`);
        const objectName = img.url.replace(/^\/[^/]+\//, '');
        console.log(`Downloading from MinIO: ${objectName}`);
        
        const imageBuffer = await storageService.downloadFile(objectName);
        console.log(`Downloaded ${imageBuffer.length} bytes for image ${img.id}`);
        
        // Use image ID instead of image_index (which is null) to create unique filename
        const imageFilename = `image_${img.id}.jpg`;
        
        images.push({
          buffer: imageBuffer,
          filename: imageFilename
        });

        // Fetch REAL annotations from database
        const dbAnnotations = await Annotation.findByImageId(img.id);
        
        if (dbAnnotations.length === 0) {
          console.warn(`No annotations found for image ${img.id}, using dummy data`);
          // Fallback to dummy annotation if no annotations in DB
          const dummyAnnotation = `11 0.5 0.5 0.1 0.15\n13 0.5 0.5 0.05 0.05`;
          annotations.push({
            buffer: Buffer.from(dummyAnnotation),
            filename: `image_${img.id}.txt`
          });
        } else {
          // Convert COCO annotations to YOLO format
          const imageWidth = img.width || 6240;  // Use stored width or default
          const imageHeight = img.height || 4160;  // Use stored height or default
          
          const yoloAnnotations = Annotation.convertToYOLO(dbAnnotations, imageWidth, imageHeight);
          const yoloText = Annotation.formatYOLOText(yoloAnnotations);
          
          console.log(`Generated YOLO annotations for image ${img.id}: ${yoloAnnotations.length} annotations`);
          
          annotations.push({
            buffer: Buffer.from(yoloText),
            filename: `image_${img.id}.txt`
          });
        }
      }

      console.log(`Prepared ${images.length} images and ${annotations.length} annotations`);

      console.log('Calling image processing service...');
      const zipBuffer = await imageProcessingService.divideCorners(images, annotations);
      
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'processed-'));
      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(tempDir, true);

      const processedImagesPath = path.join(tempDir, 'images');
      const processedFiles = await fs.readdir(processedImagesPath);
      
      console.log(`Found ${processedFiles.length} processed files`);
      
      const updatePromises = [];
      
      for (const file of processedFiles) {
        console.log(`Processing file: ${file}`);
        const match = file.match(/image_(\d+)\./);
        if (!match) {
          console.log(`Skipping file (no match): ${file}`);
          continue;
        }
        
        // Match by image ID instead of image_index
        const imageId = parseInt(match[1]);
        const originalImage = rawImages.find(img => img.id === imageId);
        
        if (!originalImage) {
          console.log(`No matching original image found for ID: ${imageId}`);
          continue;
        }
        
        console.log(`Matched file ${file} to image ID ${imageId}`);

        const processedFilePath = path.join(processedImagesPath, file);
        const fileBuffer = await fs.readFile(processedFilePath);
        
        // Extract original filename and replace "raw_" with "processed_"
        // Example: "raw_top_right_jpg.rf.d2fba3a75ed22a3aff0db8adb1031bf3.jpg" 
        //       -> "processed_top_right_jpg.rf.d2fba3a75ed22a3aff0db8adb1031bf3.jpg"
        const originalFilename = path.basename(originalImage.url);
        const processedFilename = originalFilename.replace(/^raw_/, 'processed_');
        
        console.log(`Original filename: ${originalFilename}`);
        console.log(`Processed filename: ${processedFilename}`);
        
        const processedObjectName = `visits/${visitId}/processed/${processedFilename}`;
        
        // Upload with proper content-type
        const uploadResult = await storageService.uploadFromBuffer(
          fileBuffer, 
          processedObjectName, 
          'image/jpeg'
        );
        
        console.log(`Upload result:`, uploadResult);
        
        const urlProcessed = `/${process.env.MINIO_BUCKET}/${processedObjectName}`;
        updatePromises.push(
          Image.update(originalImage.id, {
            url_processed: urlProcessed,
            processing_status: 'completed',
            processed_at: new Date()
          })
        );
      }

      await Promise.all(updatePromises);
      await fs.rm(tempDir, { recursive: true, force: true });

      const updatedImages = await Image.findByVisitId(visitId);
      const processedImages = updatedImages.filter(img => img.url_processed);

      // Return proxy URLs instead of presigned URLs (to avoid CORS)
      const API_BASE_URL = process.env.API_URL || 'http://192.168.1.17:3000';
      const imagesWithUrls = processedImages.map((image) => {
        // Convert MinIO path to proxy URL
        // e.g., /nhakhoa/visits/26/processed/processed_xxx.jpg -> /api/images/proxy/visits/26/processed/processed_xxx.jpg
        const proxyPath = image.url_processed.replace(/^\/nhakhoa\//, '');
        const proxyUrl = `${API_BASE_URL}/api/images/proxy/${proxyPath}`;
        
        let rawProxyUrl = image.url;
        if (image.url) {
          const rawProxyPath = image.url.replace(/^\/nhakhoa\//, '');
          rawProxyUrl = `${API_BASE_URL}/api/images/proxy/${rawProxyPath}`;
        }
        
        console.log(`Generated proxy URL: ${proxyUrl}`);
        
        return {
          ...image,
          url: rawProxyUrl,
          url_processed: proxyUrl,
          url_processed_path: image.url_processed // Keep original path for reference
        };
      });

      console.log(`Returning ${imagesWithUrls.length} images with proxy URLs`);
      console.log(`Sample processed URL:`, imagesWithUrls[0]?.url_processed);

      res.json({
        success: true,
        data: imagesWithUrls,
        message: `Đã xử lý thành công ${processedFiles.length} ảnh`
      });

    } catch (error) {
      console.error('Error processing images:', error);
      
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }

      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async getProcessingStatus(req, res) {
    try {
      const { visitId } = req.params;
      
      const images = await Image.findByVisitId(visitId);
      const rawImages = images.filter(img => img.image_category === 'raw');
      const processedCount = rawImages.filter(img => img.url_processed).length;
      
      res.json({
        success: true,
        data: {
          total: rawImages.length,
          processed: processedCount,
          status: processedCount === 0 ? 'pending' : 
                  processedCount < rawImages.length ? 'processing' : 'completed'
        }
      });
    } catch (error) {
      console.error('Error getting processing status:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new ImageProcessingController();
