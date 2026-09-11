const yoloImportService = require('../services/yoloImportService');

class YoloImportController {
  /**
   * Import dataset YOLO từ disk
   * POST /api/import/yolo
   * Body: { sourcePath: string } — đường dẫn folder patient_add_XXXX
   *       hoặc folder base chứa nhiều patient_add_*
   */
  async importYolo(req, res) {
    const { sourcePath } = req.body || {};

    if (!sourcePath || typeof sourcePath !== 'string') {
      return res.status(400).json({ success: false, error: 'Thiếu trường sourcePath (đường dẫn folder dataset)' });
    }

    try {
      const results = await yoloImportService.importSourcePath(sourcePath);

      const summary = results.reduce((acc, r) => {
        acc.patients++;
        acc.images += r.images.imported || 0;
        acc.skippedImages += r.images.skipped || 0;
        acc.annotations += r.annotations.total || 0;
        return acc;
      }, { patients: 0, images: 0, skippedImages: 0, annotations: 0 });

      return res.json({
        success: true,
        summary,
        patients: results.map(r => ({
          patientId: r.patientId,
          patient: r.patient,
          visit: r.visit,
          images: r.images,
          annotations: r.annotations,
          errors: r.images.errors
        }))
      });
    } catch (err) {
      console.error('YOLO import error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new YoloImportController();