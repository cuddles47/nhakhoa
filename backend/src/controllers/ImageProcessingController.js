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
          const cocoObjectName = visit.annotation_file_url.replace(/^\/[^\/]+\//, '');
          const cocoBuffer = await storageService.downloadFile(cocoObjectName);
          cocoData = JSON.parse(cocoBuffer.toString('utf-8'));
        } catch (error) {
          // Continue without COCO - will use database annotations as fallback
        }
      }

      const rawImages = await Image.findByCategory(visitId, 'raw');
      
      if (rawImages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Không tìm thấy ảnh raw nào'
        });
      }

      const images = [];
      const annotations = [];

      for (const img of rawImages) {

        const objectName = img.url.replace(/^\/[^/]+\//, '');
        const imageBuffer = await storageService.downloadFile(objectName);
        
        // Use image ID instead of image_index (which is null) to create unique filename
        const imageFilename = `image_${img.id}.jpg`;
        
        images.push({
          buffer: imageBuffer,
          filename: imageFilename
        });

        // Fetch REAL annotations from database
        const dbAnnotations = await Annotation.findByImageId(img.id);
        
        if (dbAnnotations.length === 0) {
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
          
          annotations.push({
            buffer: Buffer.from(yoloText),
            filename: `image_${img.id}.txt`
          });
        }
      }

      const zipBuffer = await imageProcessingService.divideCorners(images, annotations);
      
      console.log(`✅ Received ZIP buffer: ${zipBuffer.length} bytes`);
      
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'processed-'));
      
      const zip = new AdmZip(zipBuffer);
      
      zip.extractAllTo(tempDir, true);
      console.log(`✅ Extracted ZIP to ${tempDir}`);

      const processedImagesPath = path.join(tempDir, 'images');
      const processedAnnotationsPath = path.join(tempDir, 'annotations');
      const processedFiles = await fs.readdir(processedImagesPath);
      
      const updatePromises = [];
      const annotationPromises = [];
      
      for (const file of processedFiles) {
        const match = file.match(/image_(\d+)\./);
        if (!match) {
          continue;
        }
        
        const imageId = parseInt(match[1]);
        const originalImage = rawImages.find(img => img.id === imageId);
        
        if (!originalImage) {
          continue;
        }

        const processedFilePath = path.join(processedImagesPath, file);
        const fileBuffer = await fs.readFile(processedFilePath);
        
        // Extract original filename and replace "raw_" with "processed_"
        // Example: "raw_top_right_jpg.rf.d2fba3a75ed22a3aff0db8adb1031bf3.jpg" 
        //       -> "processed_top_right_jpg.rf.d2fba3a75ed22a3aff0db8adb1031bf3.jpg"
        const originalFilename = path.basename(originalImage.url);
        const processedFilename = originalFilename.replace(/^raw_/, 'processed_');
        
        const processedObjectName = `visits/${visitId}/processed/${processedFilename}`;
        
        // Upload with proper content-type
        // Use deterministic upload by hash to avoid re-uploading identical processed images
        const ext = path.extname(processedFilename).replace(/^\./, '') || 'jpg';
        const ensureResult = await storageService.ensureUploadByHash(fileBuffer, 'processed_by_hash', ext, 'image/jpeg');

        if (!ensureResult.success) {
          continue;
        }

        const urlProcessed = `/${process.env.MINIO_BUCKET}/${ensureResult.objectName}`;

        // Update image record, but be tolerant if DB hasn't yet run the migration to add processed_hash
        updatePromises.push((async () => {
          try {
            return await Image.update(originalImage.id, {
              url_processed: urlProcessed,
              processing_status: 'completed',
              processed_at: new Date(),
              processed_hash: ensureResult.hash
            });
          } catch (err) {
            return await Image.update(originalImage.id, {
              url_processed: urlProcessed,
              processing_status: 'completed',
              processed_at: new Date()
            });
          }
        })());

        // Parse and save subbox annotations
        const annotationFile = `image_${imageId}.txt`;
        const annotationPath = path.join(processedAnnotationsPath, annotationFile);
        
        try {
          const annotationContent = await fs.readFile(annotationPath, 'utf-8');
          
          // Python service outputs annotations in 1024x1024 space (YOLO model output)
          // But we need to scale subboxes to match original image dimensions (where teeth are)
          const processedWidth = 1024;  // YOLO model output size
          const processedHeight = 1024;
          
          // Get original image dimensions from originalImage
          // Fallback to standard dimensions if not set (6240x4160 from typical camera)
          const origWidth = originalImage.width || 6240;
          const origHeight = originalImage.height || 4160;
          
          // Call method with both processed and original dimensions for scaling
          const parsePromise = this._parseAndSaveSubboxes(
            imageId, 
            annotationContent, 
            processedWidth, 
            processedHeight,
            origWidth,
            origHeight
          );
          annotationPromises.push(parsePromise);
        } catch (annError) {
        }
      }

      await Promise.all(updatePromises);
      await Promise.all(annotationPromises);
      
      await fs.rm(tempDir, { recursive: true, force: true });

      const updatedImages = await Image.findByVisitId(visitId);
      const processedImages = updatedImages.filter(img => img.url_processed);

      // Return proxy URLs instead of presigned URLs (to avoid CORS)
      const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
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
        
        return {
          ...image,
          url: rawProxyUrl,
          url_processed: proxyUrl,
          url_processed_path: image.url_processed // Keep original path for reference
        };
      });

      res.json({
        success: true,
        data: imagesWithUrls,
        message: `Đã xử lý thành công ${processedFiles.length} ảnh`
      });

    } catch (error) {
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (e) {
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
   * @param {number} processedWidth - Processed image width (1024)
   * @param {number} processedHeight - Processed image height (1024)
   * @param {number} originalWidth - Original image width for scaling
   * @param {number} originalHeight - Original image height for scaling
   */
  async _parseAndSaveSubboxes(imageId, annotationContent, processedWidth, processedHeight, originalWidth, originalHeight) {
    const pool = require('../config/database');
    const lines = annotationContent.trim().split('\n').filter(line => line.trim());
    
    if (!processedWidth || !processedHeight || processedWidth === 0 || processedHeight === 0) {
      return;
    }
    
    if (!originalWidth || !originalHeight || originalWidth === 0 || originalHeight === 0) {
      return;
    }
    
    // Calculate scaling factors
    const scaleX = originalWidth / processedWidth;
    const scaleY = originalHeight / processedHeight;
    
    // Get all parent teeth from database (sorted by id for consistent ordering)
    const teethResult = await pool.query(`
      SELECT id, category_id, bbox, coco_image_id 
      FROM image_annotations 
      WHERE image_id = $1 AND parent_annotation_id IS NULL
      ORDER BY id
    `, [imageId]);
    
    const dbTeeth = teethResult.rows;
    
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
      
      // Convert YOLO normalized coords to pixel coords in PROCESSED space
      const xProcessed = Math.round((xCenter - width / 2) * processedWidth);
      const yProcessed = Math.round((yCenter - height / 2) * processedHeight);
      const wProcessed = Math.round(width * processedWidth);
      const hProcessed = Math.round(height * processedHeight);
      
      if (toothId !== null) {
        // 6 fields = subbox with parent tooth_id
        // Scale from processed (1024x1024) to original dimensions to match tooth coords
        const x = Math.round(xProcessed * scaleX);
        const y = Math.round(yProcessed * scaleY);
        const w = Math.round(wProcessed * scaleX);
        const h = Math.round(hProcessed * scaleY);
        
        subboxes.push({ classId, x, y, w, h, toothId });
      } else {
        // 5 fields = parent tooth (not used, we use DB teeth)
        const x = Math.round(xProcessed * scaleX);
        const y = Math.round(yProcessed * scaleY);
        const w = Math.round(wProcessed * scaleX);
        const h = Math.round(hProcessed * scaleY);
        teeth.push({ classId, x, y, w, h });
      }
    }
    
    // Map: YOLO tooth CLASS ID (as produced by Python service) → DB tooth id
    // Note: Python uses the original tooth class as `tooth_id` field in 6-field format.
    const toothClassIdMap = {};
    for (let i = 0; i < Math.min(teeth.length, dbTeeth.length); i++) {
      const cls = teeth[i].classId;
      toothClassIdMap[cls] = dbTeeth[i].id;
    }
    
    // For diagnostics, show expected subbox counts per tooth (from annotations)
    const expectedSubboxCounts = {};
    for (const sb of subboxes) {
      expectedSubboxCounts[sb.toothId] = (expectedSubboxCounts[sb.toothId] || 0) + 1;
    }
    
    // Assign regionNames sequentially for each toothId
    let subboxCount = 0;
    const regionNames = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];
    const regionIndexMap = {};
    for (const subbox of subboxes) {
      const parentId = toothClassIdMap[subbox.toothId];
      if (!parentId) {
        continue;
      }
      // Assign region sequentially for each toothId
      if (!(subbox.toothId in regionIndexMap)) regionIndexMap[subbox.toothId] = 0;
      const region = regionNames[regionIndexMap[subbox.toothId] % 4];
      regionIndexMap[subbox.toothId]++;
      const bbox = [subbox.x, subbox.y, subbox.w, subbox.h];
      const area = subbox.w * subbox.h;
      const plaqueStatus = subbox.classId === 1 ? 1 : 0; // 1 = plaque, 0 = no plaque
      
      // Check if subbox already exists
      const existingSubbox = await pool.query(`
        SELECT id FROM image_annotations 
        WHERE image_id = $1 
        AND parent_annotation_id = $2 
        AND subbox_region = $3
      `, [imageId, parentId, region]);
      
      if (existingSubbox.rows.length > 0) {
        // Update existing subbox
        await pool.query(`
          UPDATE image_annotations SET
            bbox = $1::jsonb,
            area = $2,
            category_id = $3,
            category_name = $4,
            predicted_plaque = $5,
            plaque_status = $6
          WHERE id = $7
        `, [
          JSON.stringify(bbox),
          area,
          subbox.classId,
          region,
          plaqueStatus,
          0,
          existingSubbox.rows[0].id
        ]);
      } else {
        // Insert new subbox
        await pool.query(`
          INSERT INTO image_annotations (
            image_id, coco_image_id, category_id, category_name, bbox, area, 
            parent_annotation_id, subbox_region, source_type, plaque_status, predicted_plaque
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, 'python_subbox', 0, $9)
        `, [
          imageId,
          dbTeeth.find(t => t.id === parentId).coco_image_id,
          subbox.classId,
          region,
          JSON.stringify(bbox),
          area,
          parentId,
          region,
          plaqueStatus
        ]);
      }
      subboxCount++;
    }

    // Diagnostics: compare expected vs created per toothId
    const actualSubboxCounts = {};
    for (const sb of subboxes) {
      if (!toothClassIdMap[sb.toothId]) continue;
      actualSubboxCounts[sb.toothId] = (actualSubboxCounts[sb.toothId] || 0) + 1;
    }
  }
}

const controller = new ImageProcessingController();

module.exports = {
  processRawImages: controller.processRawImages.bind(controller),
  getProcessingStatus: controller.getProcessingStatus.bind(controller)
};
