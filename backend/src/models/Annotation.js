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
        class_id: this.getCategoryYOLOClass(ann.category_name),
        x_center,
        y_center,
        width: width_norm,
        height: height_norm,
        category_name: ann.category_name
      };
    });
  }

  /**
   * Map COCO category name sang YOLO class ID
   * @param {string} categoryName - Tên category từ COCO
   * @returns {number} - YOLO class ID
   */
  static getCategoryYOLOClass(categoryName) {
    const mapping = {
      '11': 0, '12': 1, '13': 2, '14': 3,
      '21': 4, '22': 5, '23': 6, '24': 7,
      '31': 8, '32': 9, '33': 10, '34': 11,
      '41': 12, '43': 14, '44': 15,
      'Brace': 13,
      'brace': 13,
      'bracket': 13,
      'Bracket': 13
    };
    return mapping[categoryName] !== undefined ? mapping[categoryName] : 0;
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
}

module.exports = Annotation;
