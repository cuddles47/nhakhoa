const { imageProcessingQueue } = require('../config/queue');
const { Image, Visit } = require('../models');
const db = require('../config/database');

class ImageProcessingController {
  async processRawImages(req, res) {
    const { visitId } = req.params;

    try {
      const visit = await Visit.findById(visitId);
      if (!visit) {
        return res.status(404).json({
          success: false,
          error: 'Visit not found',
        });
      }

      const rawImages = await Image.findByCategory(visitId, 'raw');
      if (rawImages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Không tìm thấy ảnh raw nào',
        });
      }

      const activeJobResult = await db.query(
        `SELECT id, status, progress FROM processing_jobs 
         WHERE visit_id = $1 AND status IN ('queued', 'processing') 
         ORDER BY created_at DESC LIMIT 1`,
        [visitId]
      );

      if (activeJobResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Đang có job xử lý ảnh cho visit này',
          data: {
            jobId: activeJobResult.rows[0].id,
            status: activeJobResult.rows[0].status,
            progress: activeJobResult.rows[0].progress,
          },
        });
      }

      const job = await imageProcessingQueue.add('process-images', {
        visitId: parseInt(visitId),
        userId: req.user?.id || null,
      }, {
        priority: 1,
      });

      const insertResult = await db.query(
        `INSERT INTO processing_jobs (visit_id, bullmq_job_id, status, total_images, created_by)
         VALUES ($1, $2, 'queued', $3, $4)
         RETURNING *`,
        [visitId, job.id, rawImages.length, req.user?.id || null]
      );

      const jobRecord = insertResult.rows[0];

      res.status(202).json({
        success: true,
        data: {
          jobId: jobRecord.id,
          bullmqJobId: job.id,
          status: 'queued',
          totalImages: rawImages.length,
          message: 'Đã enqueue job xử lý ảnh',
        },
      });
    } catch (error) {
      console.error('Error enqueueing image processing job:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getProcessingStatus(req, res) {
    try {
      const { visitId } = req.params;

      const latestJobResult = await db.query(
        `SELECT * FROM processing_jobs 
         WHERE visit_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [visitId]
      );

      if (latestJobResult.rows.length === 0) {
        const rawImages = await Image.findByCategory(visitId, 'raw');
        const processedCount = rawImages.filter((img) => img.url_processed).length;

        return res.json({
          success: true,
          data: {
            jobId: null,
            status: processedCount === 0 ? 'none' : processedCount < rawImages.length ? 'partial' : 'completed',
            progress: rawImages.length > 0 ? Math.round((processedCount / rawImages.length) * 100) : 0,
            totalImages: rawImages.length,
            processedImages: processedCount,
          },
        });
      }

      const job = latestJobResult.rows[0];

      let bullmqState = null;
      try {
        const bullJob = await imageProcessingQueue.getJob(job.bullmq_job_id);
        if (bullJob) {
          bullmqState = await bullJob.getState();
        }
      } catch (e) {
        // BullMQ job may have been removed after completion
      }

      let status = job.status;
      if (bullmqState === 'active') status = 'processing';
      else if (bullmqState === 'completed') status = 'completed';
      else if (bullmqState === 'failed') status = 'failed';

      const images = await Image.findByVisitId(visitId);
      const rawImages = images.filter((img) => img.image_category === 'raw');
      const processedCount = rawImages.filter((img) => img.url_processed).length;

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status,
          progress: job.progress,
          totalImages: job.total_images,
          processedImages: job.processed_images || processedCount,
          errorMessage: job.error_message,
          createdAt: job.created_at,
          startedAt: job.started_at,
          completedAt: job.completed_at,
        },
      });
    } catch (error) {
      console.error('Error getting processing status:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

const controller = new ImageProcessingController();

module.exports = {
  processRawImages: controller.processRawImages.bind(controller),
  getProcessingStatus: controller.getProcessingStatus.bind(controller),
};
