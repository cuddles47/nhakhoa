const { Annotation, Image } = require('../models');
const { pool } = require('../config/database');

class AnnotationController {
  /**
   * Get all annotations with subboxes for an image
   * GET /api/images/:imageId/annotations
   */
  async getImageAnnotations(req, res) {
    const client = await pool.connect();
    
    try {
      const { imageId } = req.params;
      
      // Get image info
      const imageResult = await client.query(
        'SELECT id, url, url_processed, width, height FROM images WHERE id = $1',
        [imageId]
      );
      
      if (imageResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }
      
      const image = imageResult.rows[0];
      
      // Get all annotations (teeth + subboxes) for this image
      const annotationsResult = await client.query(`
        SELECT 
          a.id,
          a.image_id,
          a.category_id,
          a.category_name,
          a.bbox,
          a.area,
          a.source_type,
          a.parent_annotation_id,
          a.subbox_region,
          a.plaque_status,
          a.predicted_plaque,
          a.annotated_by,
          a.annotated_at,
          u.full_name as annotated_by_name
        FROM image_annotations a
        LEFT JOIN users u ON a.annotated_by = u.id
        WHERE a.image_id = $1
        ORDER BY a.parent_annotation_id NULLS FIRST, a.id
      `, [imageId]);
      
      // Group by teeth (parent annotations)
      const teeth = [];
      const annotationsMap = new Map();
      
      annotationsResult.rows.forEach(row => {
        if (!row.parent_annotation_id) {
          // This is a tooth (parent)
          const tooth = {
            annotation_id: row.id,
            category_id: row.category_id,
            category_name: row.category_name,
            bbox: row.bbox,
            area: row.area,
            source_type: row.source_type,
            subboxes: []
          };
          teeth.push(tooth);
          annotationsMap.set(row.id, tooth);
        }
      });
      
      // Add subboxes to their parent teeth
      annotationsResult.rows.forEach(row => {
        if (row.parent_annotation_id) {
          const parent = annotationsMap.get(row.parent_annotation_id);
          if (parent) {
            parent.subboxes.push({
              subbox_id: row.id,
              region: row.subbox_region,
              bbox: row.bbox,
              area: row.area,
              plaque_status: row.plaque_status,
              predicted_plaque: row.predicted_plaque,
              annotated_by: row.annotated_by ? {
                id: row.annotated_by,
                name: row.annotated_by_name
              } : null,
              annotated_at: row.annotated_at
            });
          }
        }
      });
      
      // Calculate progress stats
      const totalSubboxes = annotationsResult.rows.filter(r => r.parent_annotation_id).length;
      // Consider a subbox annotated only when a clinician annotated it (annotated_by IS NOT NULL)
      const annotatedSubboxes = annotationsResult.rows.filter(r => r.parent_annotation_id && r.annotated_by !== null).length;
      // Count plaque detected only from clinician annotations (plaque_status === 1 and annotated_by IS NOT NULL)
      const plaqueDetected = annotationsResult.rows.filter(r => r.parent_annotation_id && r.annotated_by !== null && r.plaque_status === 1).length;
      
      res.json({
        success: true,
        data: {
          image: {
            id: image.id,
            url: image.url,
            url_processed: image.url_processed,
            width: image.width,
            height: image.height
          },
          teeth,
          progress: {
            total: totalSubboxes,
            annotated: annotatedSubboxes,
            not_annotated: totalSubboxes - annotatedSubboxes,
            plaque_detected: plaqueDetected
          }
        }
      });
      
    } catch (err) {
      console.error('Error getting image annotations:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to get annotations'
      });
    } finally {
      client.release();
    }
  }
  
  /**
   * Update plaque status for a single annotation/subbox
   * PUT /api/annotations/:annotationId/plaque
   */
  async updatePlaqueStatus(req, res) {
    const client = await pool.connect();
    
    try {
      const { annotationId } = req.params;
      const { plaque_status, user_id } = req.body;
      
      // Validate plaque_status
      if (plaque_status !== null && plaque_status !== 0 && plaque_status !== 1) {
        return res.status(400).json({
          success: false,
          error: 'plaque_status must be 0, 1, or null'
        });
      }
      
      await client.query('BEGIN');
      
      // Get current value for history
      const currentResult = await client.query(
        'SELECT plaque_status FROM image_annotations WHERE id = $1',
        [annotationId]
      );
      
      if (currentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Annotation not found'
        });
      }
      
      const oldValue = currentResult.rows[0].plaque_status;
      
      // Update annotation
      const updateResult = await client.query(`
        UPDATE image_annotations 
        SET 
          plaque_status = $1,
          annotated_by = $2,
          annotated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [plaque_status, user_id, annotationId]);
      
      // Insert history record
      await client.query(`
        INSERT INTO annotation_history (annotation_id, user_id, old_value, new_value)
        VALUES ($1, $2, $3, $4)
      `, [annotationId, user_id, oldValue, plaque_status]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        data: updateResult.rows[0]
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error updating plaque status:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to update plaque status'
      });
    } finally {
      client.release();
    }
  }
  
  /**
   * Batch update multiple annotations
   * POST /api/images/:imageId/annotations/batch
   */
  async batchUpdateAnnotations(req, res) {
    const client = await pool.connect();
    
    try {
      const { imageId } = req.params;
      const { annotations, user_id } = req.body;
      
      if (!Array.isArray(annotations) || annotations.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'annotations array is required'
        });
      }
      
      await client.query('BEGIN');
      
      let updatedCount = 0;
      
      for (const ann of annotations) {
        const { annotation_id, plaque_status } = ann;
        
        // Get current value
        const currentResult = await client.query(
          'SELECT plaque_status FROM image_annotations WHERE id = $1 AND image_id = $2',
          [annotation_id, imageId]
        );
        
        if (currentResult.rows.length === 0) continue;
        
        const oldValue = currentResult.rows[0].plaque_status;
        
        // Update
        await client.query(`
          UPDATE image_annotations 
          SET 
            plaque_status = $1,
            annotated_by = $2,
            annotated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [plaque_status, user_id, annotation_id]);
        
        // History
        await client.query(`
          INSERT INTO annotation_history (annotation_id, user_id, old_value, new_value)
          VALUES ($1, $2, $3, $4)
        `, [annotation_id, user_id, oldValue, plaque_status]);
        
        updatedCount++;
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        data: {
          updated_count: updatedCount
        }
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error batch updating annotations:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to batch update annotations'
      });
    } finally {
      client.release();
    }
  }
  
  /**
   * Get annotation statistics for a visit
   * GET /api/visits/:visitId/annotations/stats
   */
  async getVisitStats(req, res) {
    const client = await pool.connect();
    
    try {
      const { visitId } = req.params;
      
      const result = await client.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN a.parent_annotation_id IS NULL THEN a.id END) as total_teeth,
          COUNT(CASE WHEN a.parent_annotation_id IS NOT NULL THEN 1 END) as total_subboxes,
          COUNT(CASE WHEN a.parent_annotation_id IS NOT NULL AND a.plaque_status IS NOT NULL THEN 1 END) as annotated,
          COUNT(CASE WHEN a.parent_annotation_id IS NOT NULL AND a.plaque_status = 1 THEN 1 END) as plaque_detected,
          COUNT(CASE WHEN a.parent_annotation_id IS NOT NULL AND a.plaque_status = 0 THEN 1 END) as no_plaque
        FROM images i
        JOIN image_annotations a ON i.id = a.image_id
        WHERE i.visit_id = $1
      `, [visitId]);
      
      const stats = result.rows[0];
      const plaquePercentage = stats.total_subboxes > 0 
        ? ((stats.plaque_detected / stats.total_subboxes) * 100).toFixed(1)
        : 0;
      
      res.json({
        success: true,
        data: {
          total_teeth: parseInt(stats.total_teeth),
          total_subboxes: parseInt(stats.total_subboxes),
          annotated: parseInt(stats.annotated),
          plaque_detected: parseInt(stats.plaque_detected),
          no_plaque: parseInt(stats.no_plaque),
          not_annotated: parseInt(stats.total_subboxes) - parseInt(stats.annotated),
          plaque_percentage: parseFloat(plaquePercentage)
        }
      });
      
    } catch (err) {
      console.error('Error getting visit stats:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to get visit statistics'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new AnnotationController();
