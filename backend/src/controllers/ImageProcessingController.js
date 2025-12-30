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
      const processedAnnotationsPath = path.join(tempDir, 'annotations');
      const processedFiles = await fs.readdir(processedImagesPath);
      
      console.log(`Found ${processedFiles.length} processed files`);
      
      // Check if annotations folder exists
      try {
        const annotationFiles = await fs.readdir(processedAnnotationsPath);
        console.log(`✅ Found annotations folder with ${annotationFiles.length} files:`, annotationFiles);
      } catch (err) {
        console.error('❌ No annotations folder found in ZIP:', err.message);
      }
      
      const updatePromises = [];
      const annotationPromises = [];
      
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

        // Parse and save subbox annotations
        const annotationFile = `image_${imageId}.txt`;
        const annotationPath = path.join(processedAnnotationsPath, annotationFile);
        
        try {
          const annotationContent = await fs.readFile(annotationPath, 'utf-8');
          console.log(`✅ Found annotation file for image ${imageId}, content length: ${annotationContent.length}`);
          
          // Call method directly with await instead of pushing promise
          const parsePromise = this._parseAndSaveSubboxes(imageId, annotationContent, originalImage.width, originalImage.height);
          annotationPromises.push(parsePromise);
        } catch (annError) {
          console.error(`❌ Failed to read annotations for image ${imageId}:`, annError.message);
          console.error(`    Tried path: ${annotationPath}`);
        }
      }

      await Promise.all(updatePromises);
      console.log(`Waiting for ${annotationPromises.length} annotation parse operations...`);
      await Promise.all(annotationPromises);
      console.log('All annotations parsed and saved');
      
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

  /**
   * Parse YOLO annotations and save subboxes to database
   * @param {number} imageId - Image ID
   * @param {string} annotationContent - YOLO format annotation content
   * @param {number} imageWidth - Image width in pixels
   * @param {number} imageHeight - Image height in pixels
   */
  async _parseAndSaveSubboxes(imageId, annotationContent, imageWidth, imageHeight) {
    const pool = require('../config/database');
    const lines = annotationContent.trim().split('\n').filter(line => line.trim());
    
    console.log(`Parsing ${lines.length} annotations for image ${imageId}`);
    
    // Get all parent teeth from database (sorted by id for consistent ordering)
    const teethResult = await pool.query(`
      SELECT id, category_id, bbox, coco_image_id 
      FROM image_annotations 
      WHERE image_id = $1 AND parent_annotation_id IS NULL
      ORDER BY id
    `, [imageId]);
    
    const dbTeeth = teethResult.rows;
    console.log(`Found ${dbTeeth.length} parent teeth in DB`);
    
    // Parse annotations - 6 fields = subbox, 5 fields = tooth
    const teeth = [];
    const subboxes = [];
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 5) continue;
      
      const classId = parseInt(parts[0]);
      const xCenter = parseFloat(parts[1]);
      const yCenter = parseFloat(parts[2]);
      const width = parseFloat(parts[3]);
      const height = parseFloat(parts[4]);
      const toothId = parts.length === 6 ? parseInt(parts[5]) : null;
      
      // Convert YOLO to pixel coordinates
      const x = Math.round((xCenter - width / 2) * imageWidth);
      const y = Math.round((yCenter - height / 2) * imageHeight);
      const w = Math.round(width * imageWidth);
      const h = Math.round(height * imageHeight);
      
      if (toothId !== null) {
        // 6 fields = subbox with parent tooth_id
        subboxes.push({ classId, x, y, w, h, toothId });
      } else {
        // 5 fields = parent tooth
        teeth.push({ classId, x, y, w, h });
      }
    }
    
    console.log(`Parsed ${teeth.length} teeth and ${subboxes.length} subboxes from YOLO`);
    
    // Map: YOLO tooth CLASS ID (as produced by Python service) → DB tooth id
    // Note: Python uses the original tooth class as `tooth_id` field in 6-field format.
    const toothClassIdMap = {};
    for (let i = 0; i < Math.min(teeth.length, dbTeeth.length); i++) {
      const cls = teeth[i].classId;
      toothClassIdMap[cls] = dbTeeth[i].id;
      console.log(`📍 Map YOLO tooth class ${cls} (pos ${i}) → DB tooth id ${dbTeeth[i].id}`);
    }
    
    // For diagnostics, show expected subbox counts per tooth (from annotations)
    const expectedSubboxCounts = {};
    for (const sb of subboxes) {
      expectedSubboxCounts[sb.toothId] = (expectedSubboxCounts[sb.toothId] || 0) + 1;
    }
    console.log('ℹ️ Expected subboxes per toothId from file:', expectedSubboxCounts);
    
    // Assign regionNames sequentially for each toothId
    let subboxCount = 0;
    const regionNames = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];
    const regionIndexMap = {};
    for (const subbox of subboxes) {
      const parentId = toothClassIdMap[subbox.toothId];
      if (!parentId) {
        console.log(`⚠️ Skipping subbox with invalid tooth_id=${subbox.toothId} (no mapping to DB tooth)`);
        continue;
      }
      console.log(`🔗 Subbox toothId ${subbox.toothId} → parent DB id ${parentId}`);
      // Assign region sequentially for each toothId
      if (!(subbox.toothId in regionIndexMap)) regionIndexMap[subbox.toothId] = 0;
      const region = regionNames[regionIndexMap[subbox.toothId] % 4];
      regionIndexMap[subbox.toothId]++;
      const bbox = [subbox.x, subbox.y, subbox.w, subbox.h];
      const area = subbox.w * subbox.h;
      const plaqueStatus = subbox.classId === 1 ? 1 : 0; // 1 = plaque, 0 = no plaque
      await pool.query(`
        INSERT INTO image_annotations (image_id, coco_image_id, category_id, category_name, bbox, area, parent_annotation_id, subbox_region, source_type, plaque_status)
        SELECT $1, $2, $3, $4::varchar(50), $5::jsonb, $6, $7, $8::varchar(20), 'python_subbox', $9
        WHERE NOT EXISTS (
          SELECT 1 FROM image_annotations WHERE image_id = $1 AND parent_annotation_id = $7 AND subbox_region = $8::varchar(20)
        )
      `, [
        imageId,
        dbTeeth.find(t => t.id === parentId).coco_image_id,
        subbox.classId,  // 0 or 1 (plaque label)
        region,
        JSON.stringify(bbox),
        area,
        parentId,
        region,
        plaqueStatus
      ]);
      subboxCount++;
      console.log(`✅ Created subbox: parent=${parentId}, region=${region}, status=${plaqueStatus}`);
    }
    console.log(`Completed: created ${subboxCount} subboxes for image ${imageId}`);

    // Diagnostics: compare expected vs created per toothId
    const actualSubboxCounts = {};
    for (const sb of subboxes) {
      if (!toothClassIdMap[sb.toothId]) continue;
      actualSubboxCounts[sb.toothId] = (actualSubboxCounts[sb.toothId] || 0) + 1;
    }
    console.log('ℹ️ Expected subboxes per toothId:', expectedSubboxCounts);
    console.log('ℹ️ Created (actual) subboxes per toothId:', actualSubboxCounts);
  }
}

const controller = new ImageProcessingController();

module.exports = {
  processRawImages: controller.processRawImages.bind(controller),
  getProcessingStatus: controller.getProcessingStatus.bind(controller),
  // Expose controller for internal tests and scripts
  _controller: controller
};
