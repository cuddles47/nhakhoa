const { Worker } = require('bullmq');
const { connection } = require('../config/queue');
const storageService = require('../services/storage');
const imageProcessingService = require('../services/imageProcessingService');
const { Image, Annotation, Visit } = require('../models');
const annotationService = require('../services/annotationService');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const db = require('../config/database');

async function updateJobRecord(jobId, fields) {
  const sets = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }
  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(jobId);
  await db.query(
    `UPDATE processing_jobs SET ${sets.join(', ')} WHERE id = $${idx}`,
    values
  );
}

async function processImagesJob(job) {
  const { visitId, userId } = job.data;
  let tempDir = null;

  try {
    await updateJobRecord(job.id, {
      status: 'processing',
      started_at: new Date(),
      progress: 5,
    });

    const rawImages = await Image.findByCategory(visitId, 'raw');

    if (rawImages.length === 0) {
      throw new Error('Không tìm thấy ảnh raw nào');
    }

    await updateJobRecord(job.id, { total_images: rawImages.length });
    await job.updateProgress(10);

    const images = [];
    const annotations = [];

    for (const img of rawImages) {
      const objectName = img.url.replace(/^\/[^/]+\//, '');
      const imageBuffer = await storageService.downloadFile(objectName);

      // Skip invalid/stub image files (e.g. macOS ._* AppleDouble stubs)
      const isJpeg = imageBuffer.length > 3 && imageBuffer.toString('hex', 0, 2) === 'ffd8';
      const isPng =
        imageBuffer.length > 8 && imageBuffer.toString('hex', 0, 8) === '89504e470d0a1a0a';
      if (!isJpeg && !isPng) {
        console.warn(
          `Skipping invalid image ${objectName} (${imageBuffer.length} bytes)`
        );
        continue;
      }

      images.push({
        buffer: imageBuffer,
        filename: `image_${img.id}.jpg`,
      });

      const dbAnnotations = await Annotation.findByImageId(img.id);

      const parentAnnotations = dbAnnotations.filter(a => !a.parent_annotation_id);

      if (parentAnnotations.length === 0) {
        const dummyAnnotation = `11 0.5 0.5 0.1 0.15\n13 0.5 0.5 0.05 0.05`;
        annotations.push({
          buffer: Buffer.from(dummyAnnotation),
          filename: `image_${img.id}.txt`,
        });
      } else {
        const imageWidth = img.width || 6240;
        const imageHeight = img.height || 4160;
        const yoloAnnotations = Annotation.convertToYOLO(parentAnnotations, imageWidth, imageHeight);
        const yoloText = Annotation.formatYOLOText(yoloAnnotations);
        annotations.push({
          buffer: Buffer.from(yoloText),
          filename: `image_${img.id}.txt`,
        });
      }
    }

    await job.updateProgress(30);

    if (images.length === 0) {
      throw new Error('Không có ảnh hợp lệ để xử lý (ảnh có thể bị lỗi hoặc là file metadata macOS)');
    }

    const zipBuffer = await imageProcessingService.divideCorners(images, annotations);

    await job.updateProgress(50);

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'processed-'));

    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(tempDir, true);

    const processedImagesPath = path.join(tempDir, 'images');
    const processedAnnotationsPath = path.join(tempDir, 'annotations');

    const hasProcessedImages = await fs.access(processedImagesPath).then(() => true).catch(() => false);
    if (!hasProcessedImages) {
      throw new Error('Service xử lý ảnh không trả về kết quả (thư mục images rỗng). Kiểm tra ảnh đầu vào.');
    }

    const processedFiles = await fs.readdir(processedImagesPath);
    const totalFiles = processedFiles.length;

    let processedCount = 0;

    for (const file of processedFiles) {
      const match = file.match(/image_(\d+)\./);
      if (!match) continue;

      const imageId = parseInt(match[1]);
      const originalImage = rawImages.find((img) => img.id === imageId);
      if (!originalImage) continue;

      const processedFilePath = path.join(processedImagesPath, file);
      const fileBuffer = await fs.readFile(processedFilePath);

      const originalFilename = path.basename(originalImage.url);
      const processedFilename = originalFilename.replace(/^raw_/, 'processed_');
      const processedObjectName = `visits/${visitId}/processed/${processedFilename}`;

      const ext = path.extname(processedFilename).replace(/^\./, '') || 'jpg';
      const ensureResult = await storageService.ensureUploadByHash(
        fileBuffer,
        'processed_by_hash',
        ext,
        'image/jpeg'
      );

      if (!ensureResult.success) continue;

      const urlProcessed = `/${process.env.MINIO_BUCKET}/${ensureResult.objectName}`;

      try {
        await Image.update(originalImage.id, {
          url_processed: urlProcessed,
          processing_status: 'completed',
          processed_at: new Date(),
          processed_hash: ensureResult.hash,
        });
      } catch (err) {
        await Image.update(originalImage.id, {
          url_processed: urlProcessed,
          processing_status: 'completed',
          processed_at: new Date(),
        });
      }

      const annotationFile = `image_${imageId}.txt`;
      const annotationPath = path.join(processedAnnotationsPath, annotationFile);

      try {
        const annotationContent = await fs.readFile(annotationPath, 'utf-8');
        await parseAndSaveSubboxes(
          imageId,
          annotationContent,
          1024,
          1024,
          originalImage.width || 6240,
          originalImage.height || 4160
        );
      } catch (annError) {
        console.warn(`Failed to parse annotations for image ${imageId}:`, annError.message);
      }

      processedCount++;
      const progress = 50 + Math.round((processedCount / totalFiles) * 45);
      await job.updateProgress(progress);
      await updateJobRecord(job.id, {
        processed_images: processedCount,
        progress,
      });
    }

    await Visit.markAsReprocessed(visitId, userId);

    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;

    const updatedImages = await Image.findByVisitId(visitId);
    const processedImages = updatedImages.filter((img) => img.url_processed);

    await updateJobRecord(job.id, {
      status: 'completed',
      progress: 100,
      completed_at: new Date(),
      processed_images: processedCount,
      result_data: JSON.stringify({
        totalImages: rawImages.length,
        processedImages: processedCount,
      }),
    });

    await job.updateProgress(100);

    return { visitId, processedCount, totalImages: rawImages.length };
  } catch (error) {
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Cleanup error:', e.message);
      }
    }

    await updateJobRecord(job.id, {
      status: 'failed',
      error_message: error.message,
      completed_at: new Date(),
    });

    throw error;
  }
}

async function parseAndSaveSubboxes(
  imageId,
  annotationContent,
  processedWidth,
  processedHeight,
  originalWidth,
  originalHeight
) {
  const lines = annotationContent.trim().split('\n').filter((line) => line.trim());

  await db.query(
    `DELETE FROM image_annotations 
     WHERE image_id = $1 AND parent_annotation_id IS NOT NULL AND source_type = 'python_subbox'`,
    [imageId]
  );

  if (!originalWidth || !originalHeight || originalWidth === 0 || originalHeight === 0) return;

  const teethResult = await db.query(
    `SELECT id, category_id, category_name, bbox, coco_image_id 
     FROM image_annotations 
     WHERE image_id = $1 
       AND parent_annotation_id IS NULL
       AND LOWER(category_name) NOT IN ('brace', 'bracket')
     ORDER BY id`,
    [imageId]
  );

  const dbTeeth = teethResult.rows;

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

    // Python normalizes relative to original image dims, so scale directly to pixels
    const x = Math.round((xCenter - width / 2) * originalWidth);
    const y = Math.round((yCenter - height / 2) * originalHeight);
    const w = Math.round(width * originalWidth);
    const h = Math.round(height * originalHeight);

    if (toothId !== null) {
      subboxes.push({ classId, x, y, w, h, toothId });
    } else {
      teeth.push({ classId, x, y, w, h });
    }
  }

  // Map Python tooth CLASS → DB tooth id by category_id
  const toothClassIdMap = {};
  for (const dbTooth of dbTeeth) {
    toothClassIdMap[dbTooth.category_id] = dbTooth.id;
  }

  // Python emits subboxes per tooth in order: gingival (G), incisal (I), mesial (M), distal (D)
  const regionNames = ['gingival', 'incisal', 'mesial', 'distal'];
  const regionIndexMap = {};

  for (const subbox of subboxes) {
    const parentId = toothClassIdMap[subbox.toothId];
    if (!parentId) continue;

    if (!(subbox.toothId in regionIndexMap)) regionIndexMap[subbox.toothId] = 0;
    const region = regionNames[regionIndexMap[subbox.toothId] % 4];
    regionIndexMap[subbox.toothId]++;

    const bbox = [subbox.x, subbox.y, subbox.w, subbox.h];
    const area = subbox.w * subbox.h;
    const plaqueStatus = subbox.classId === 1 ? 1 : 0;

    const existingSubbox = await db.query(
      `SELECT id, source_type FROM image_annotations 
       WHERE image_id = $1 AND parent_annotation_id = $2 AND subbox_region = $3`,
      [imageId, parentId, region]
    );

    if (existingSubbox.rows.length > 0) {
      if (existingSubbox.rows[0].source_type === 'doctor_upload') continue;
      await db.query(
        `UPDATE image_annotations SET
          bbox = $1::jsonb, area = $2, category_id = $3, category_name = $4,
          predicted_plaque = $5, plaque_status = $6
        WHERE id = $7`,
        [JSON.stringify(bbox), area, subbox.classId, region, plaqueStatus, 1, existingSubbox.rows[0].id]
      );
    } else {
      const dbTooth = dbTeeth.find((t) => t.id === parentId);
      await db.query(
        `INSERT INTO image_annotations (
          image_id, coco_image_id, category_id, category_name, bbox, area,
          parent_annotation_id, subbox_region, source_type, plaque_status, predicted_plaque
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, 'python_subbox', $9, $10)`,
        [
          imageId,
          dbTooth ? dbTooth.coco_image_id : null,
          subbox.classId,
          region,
          JSON.stringify(bbox),
          area,
          parentId,
          region,
          plaqueStatus,
          plaqueStatus,
        ]
      );
    }
  }

  await db.query(
    'UPDATE images SET has_annotations = true, annotation_count = annotation_count + $1 WHERE id = $2',
    [subboxes.length, imageId]
  );
}

let worker = null;

function startWorker() {
  if (worker) return worker;

  worker = new Worker('image-processing', processImagesJob, {
    connection,
    concurrency: 1,
    limiter: { max: 1, duration: 1000 },
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed for visit ${job.data.visitId}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed for visit ${job?.data?.visitId}:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err.message);
  });

  console.log('Image processing worker started');
  return worker;
}

async function stopWorker() {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('Image processing worker stopped');
  }
}

module.exports = {
  startWorker,
  stopWorker,
  processImagesJob,
};
