/**
 * Annotation Model
 * Model để quản lý COCO annotations trong database
 */

const db = require('../config/database');

class Annotation {
  /**
   * Tìm tất cả annotations của một image
   * @param {number} imageId - ID của image
   * @returns {Array} - Array of annotation records
   */
  static async findByImageId(imageId) {
    const result = await db.query(
      'SELECT * FROM image_annotations WHERE image_id = $1 ORDER BY id',
      [imageId]
    );
    return result.rows;
  }

  /**
   * Tìm tất cả annotations của một visit (qua images)
   * @param {number} visitId - ID của visit
   * @returns {Array} - Array of annotations với image info
   */
  static async findByVisitId(visitId) {
    const result = await db.query(`
      SELECT ia.*, i.original_filename, i.image_type, i.width, i.height
      FROM image_annotations ia
      JOIN images i ON ia.image_id = i.id
      WHERE i.visit_id = $1
      ORDER BY i.id, ia.id
    `, [visitId]);
    return result.rows;
  }

  /**
   * Tạo nhiều annotation records (batch insert)
   * @param {Array} annotations - Array of { image_id, coco_image_id, category_id, category_name, bbox, area, source_type, parent_annotation_id, subbox_region }
   * @param {Object} client - PostgreSQL client (optional, for transactions)
   * @returns {Array} - Array of inserted records
   */
  static async createBatch(annotations, client = null) {
    const dbClient = client || db;
    
    const query = `
      INSERT INTO image_annotations 
        (image_id, coco_image_id, category_id, category_name, bbox, area, source_type, parent_annotation_id, subbox_region)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const results = [];
    for (const ann of annotations) {
      const result = await dbClient.query(query, [
        ann.image_id,
        ann.coco_image_id,
        ann.category_id,
        ann.category_name,
        JSON.stringify(ann.bbox),
        ann.area,
        ann.source_type || 'doctor_upload', // Default to doctor_upload
        ann.parent_annotation_id || null,
        ann.subbox_region || null
      ]);
      results.push(result.rows[0]);
    }
    return results;
  }

  /**
   * Find annotations by source type
   * @param {number} imageId - Image ID
   * @param {string} sourceType - Source type filter: 'doctor_upload', 'python_processed', 'python_subbox'
   * @returns {Array} - Array of annotation records
   */
  static async findBySourceType(imageId, sourceType) {
    const result = await db.query(
      'SELECT * FROM image_annotations WHERE image_id = $1 AND source_type = $2 ORDER BY id',
      [imageId, sourceType]
    );
    return result.rows;
  }

  /**
   * Find subbox annotations for a parent annotation
   * @param {number} parentAnnotationId - Parent annotation ID
   * @returns {Array} - Array of subbox annotation records
   */
  static async findSubboxes(parentAnnotationId) {
    const result = await db.query(
      'SELECT * FROM image_annotations WHERE parent_annotation_id = $1 ORDER BY id',
      [parentAnnotationId]
    );
    return result.rows;
  }

  /**
   * Convert annotations sang YOLO format
   * @param {Array} annotations - Array of annotation records từ DB
   * @param {number} imageWidth - Width của ảnh (pixels)
   * @param {number} imageHeight - Height của ảnh (pixels)
   * @returns {Array} - Array of { class_id, x_center, y_center, width, height }
   */
  static convertToYOLO(annotations, imageWidth, imageHeight) {
    return annotations.map(ann => {
      // Parse bbox từ JSONB (có thể là string hoặc object)
      const bbox = typeof ann.bbox === 'string' ? JSON.parse(ann.bbox) : ann.bbox;
      const [x, y, w, h] = bbox;
      
      // Convert to center coordinates (normalized)
      const x_center = (x + w / 2) / imageWidth;
      const y_center = (y + h / 2) / imageHeight;
      const width_norm = w / imageWidth;
      const height_norm = h / imageHeight;
      
      return {
        class_id: this.getCategoryYOLOClass(ann.category_id),
        x_center,
        y_center,
        width: width_norm,
        height: height_norm,
        category_name: ann.category_name
      };
    });
  }

  /**
   * COCO Category Mapping
   * YOLO class = COCO category_id (giữ nguyên)
   * Teeth: category_id 1-20 → YOLO class 1-20
   * Brace: category_id 21 → YOLO class 21
   */

  /**
   * Map COCO category_id sang YOLO class ID
   * @param {number} categoryId - Category ID từ COCO
   * @returns {number} - YOLO class ID (giống category_id)
   */
  static getCategoryYOLOClass(categoryId) {
    // YOLO class = COCO category_id (giữ nguyên)
    return categoryId || 0;
  }

  /**
   * Format YOLO annotations thành text string
   * @param {Array} yoloAnnotations - Array of { class_id, x_center, y_center, width, height }
   * @returns {string} - YOLO format text
   */
  static formatYOLOText(yoloAnnotations) {
    return yoloAnnotations
      .map(ann => `${ann.class_id} ${ann.x_center.toFixed(6)} ${ann.y_center.toFixed(6)} ${ann.width.toFixed(6)} ${ann.height.toFixed(6)}`)
      .join('\n');
  }

  /**
   * Delete annotations by image ID
   * @param {number} imageId - ID của image
   * @param {Object} client - PostgreSQL client (optional)
   * @returns {Object} - Delete result
   */
  static async deleteByImageId(imageId, client = null) {
    const dbClient = client || db;
    const result = await dbClient.query(
      'DELETE FROM image_annotations WHERE image_id = $1',
      [imageId]
    );
    return result;
  }

  /**
   * Count annotations by image ID
   * @param {number} imageId - ID của image
   * @returns {number} - Count of annotations
   */
  static async countByImageId(imageId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM image_annotations WHERE image_id = $1',
      [imageId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get annotation statistics for a visit
   * @param {number} visitId - ID của visit
   * @returns {Object} - { totalAnnotations, byCategory, byImage }
   */
  static async getVisitStatistics(visitId) {
    // Total annotations
    const totalResult = await db.query(`
      SELECT COUNT(*) as total
      FROM image_annotations ia
      JOIN images i ON ia.image_id = i.id
      WHERE i.visit_id = $1
    `, [visitId]);

    // By category
    const categoryResult = await db.query(`
      SELECT ia.category_name, COUNT(*) as count
      FROM image_annotations ia
      JOIN images i ON ia.image_id = i.id
      WHERE i.visit_id = $1
      GROUP BY ia.category_name
      ORDER BY count DESC
    `, [visitId]);

    // By image
    const imageResult = await db.query(`
      SELECT i.id, i.original_filename, i.image_type, COUNT(ia.id) as annotation_count
      FROM images i
      LEFT JOIN image_annotations ia ON i.id = ia.image_id
      WHERE i.visit_id = $1
      GROUP BY i.id, i.original_filename, i.image_type
      ORDER BY i.id
    `, [visitId]);

    return {
      totalAnnotations: parseInt(totalResult.rows[0].total),
      byCategory: categoryResult.rows,
      byImage: imageResult.rows
    };
  }

  /**
   * Get fully annotated images for export
   * An image is fully annotated if all subboxes have plaque_status set
   * @param {Array} visitIds - Array of visit IDs
   * @param {Object} filters - { annotationStatus: 'full'|'partial'|'any', plaqueOnly: boolean }
   * @returns {Array} - Array of image records with annotation stats
   */
  static async getFullyAnnotatedImages(visitIds, filters = {}) {
    const { annotationStatus = 'full', plaqueOnly = false } = filters;
    
    let query = `
      SELECT 
        i.id,
        i.visit_id,
        i.url,
        i.original_filename,
        i.image_category,
        i.image_type,
        i.width,
        i.height,
        i.taken_at,
        COUNT(DISTINCT parent.id) as tooth_count,
        COUNT(DISTINCT subbox.id) as subbox_count,
        COUNT(DISTINCT CASE WHEN subbox.plaque_status IS NOT NULL THEN subbox.id END) as annotated_subbox_count,
        COUNT(DISTINCT CASE WHEN subbox.plaque_status = 1 THEN subbox.id END) as plaque_positive_count
      FROM images i
      LEFT JOIN image_annotations parent ON i.id = parent.image_id AND parent.parent_annotation_id IS NULL
      LEFT JOIN image_annotations subbox ON parent.id = subbox.parent_annotation_id
      WHERE i.visit_id = ANY($1)
        AND i.deleted_at IS NULL
        AND i.image_category = 'raw'
      GROUP BY i.id
    `;
    
    // Add filters based on annotation status
    if (annotationStatus === 'full') {
      query += `
        HAVING (COUNT(DISTINCT subbox.id) = 0) 
        OR (COUNT(DISTINCT subbox.id) > 0 AND COUNT(DISTINCT CASE WHEN subbox.plaque_status IS NOT NULL THEN subbox.id END) = COUNT(DISTINCT subbox.id))
      `;
    } else if (annotationStatus === 'partial') {
      query += `
        HAVING COUNT(DISTINCT CASE WHEN subbox.plaque_status IS NOT NULL THEN subbox.id END) > 0
      `;
    }
    
    if (plaqueOnly) {
      query += `
        ${annotationStatus === 'any' ? 'HAVING' : 'AND'} COUNT(DISTINCT CASE WHEN subbox.plaque_status = 1 THEN subbox.id END) > 0
      `;
    }
    
    query += ' ORDER BY i.id';
    
    const result = await db.query(query, [visitIds]);
    return result.rows;
  }

  /**
   * Get subboxes for export with parent tooth information
   * @param {Array} imageIds - Array of image IDs
   * @returns {Array} - Array of subbox records with parent tooth info
   */
  static async getSubboxesForExport(imageIds) {
    const query = `
      SELECT 
        subbox.id as subbox_id,
        subbox.image_id,
        subbox.bbox,
        subbox.plaque_status,
        subbox.subbox_region,
        subbox.parent_annotation_id,
        parent.category_name as parent_category_name,
        parent.category_id as parent_category_id,
        parent.bbox as parent_bbox,
        i.width as image_width,
        i.height as image_height,
        i.original_filename,
        i.visit_id,
        v.patient_id
      FROM image_annotations subbox
      JOIN image_annotations parent ON subbox.parent_annotation_id = parent.id
      JOIN images i ON subbox.image_id = i.id
      JOIN visits v ON i.visit_id = v.id
      WHERE subbox.image_id = ANY($1)
        AND subbox.parent_annotation_id IS NOT NULL
        AND subbox.plaque_status IS NOT NULL
      ORDER BY subbox.image_id, parent.id, subbox.subbox_region
    `;
    
    const result = await db.query(query, [imageIds]);
    return result.rows.map(row => ({
      ...row,
      bbox: typeof row.bbox === 'string' ? JSON.parse(row.bbox) : row.bbox,
      parent_bbox: typeof row.parent_bbox === 'string' ? JSON.parse(row.parent_bbox) : row.parent_bbox
    }));
  }

  /**
   * Get images by patient IDs for dataset splitting
   * @param {Array} patientIds - Array of patient IDs
   * @returns {Object} - Map of patient_id → array of image IDs
   */
  static async getImagesByPatients(patientIds) {
    const query = `
      SELECT 
        v.patient_id,
        array_agg(i.id ORDER BY i.id) as image_ids
      FROM images i
      JOIN visits v ON i.visit_id = v.id
      WHERE v.patient_id = ANY($1)
        AND i.deleted_at IS NULL
        AND i.image_category = 'raw'
        AND i.has_annotations = true
      GROUP BY v.patient_id
    `;
    
    const result = await db.query(query, [patientIds]);
    const patientImageMap = {};
    result.rows.forEach(row => {
      patientImageMap[row.patient_id] = row.image_ids;
    });
    return patientImageMap;
  }

  /**
   * Get all unique patient IDs from visit IDs
   * @param {Array} visitIds - Array of visit IDs
   * @returns {Array} - Array of unique patient IDs
   */
  static async getPatientIdsByVisits(visitIds) {
    const query = `
      SELECT DISTINCT patient_id
      FROM visits
      WHERE id = ANY($1)
      ORDER BY patient_id
    `;
    
    const result = await db.query(query, [visitIds]);
    return result.rows.map(row => row.patient_id);
  }
}

module.exports = Annotation;
