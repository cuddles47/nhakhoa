const { Image } = require('../models');
const db = require('../config/database');

class ImageController {
    async getAllImages(req, res) {
        try {
            const { page, limit, visitId, validationStatus, imageCategory, sortBy, sortOrder } = req.query;
            const result = await Image.findAll({ page, limit, visitId, validationStatus, imageCategory, sortBy, sortOrder });
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Error fetching images:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getImagesByVisitId(req, res) {
        try {
            const { visitId } = req.params;
            const images = await Image.findByVisitId(visitId);
            
            // Don't generate presigned URLs - let frontend use proxy
            // The proxy endpoint /api/images/proxy/* will handle MinIO access
            res.json({ success: true, data: images });
        } catch (error) {
            console.error('Error fetching images:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getImagesByCategory(req, res) {
        try {
            const { visitId, category } = req.params;
            
            if (!['raw', 'stained'].includes(category)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid category. Must be "raw" or "stained"' 
                });
            }
            
            const images = await Image.findByCategory(visitId, category);
            
            // Don't generate presigned URLs - let frontend use proxy
            res.json({ success: true, data: images });
        } catch (error) {
            console.error('Error fetching images:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async createImage(req, res) {
        try {
            const { visit_id, image_category, image_type, image_index, notes } = req.body;
            let url_minio = req.body.url_minio;
            
            if (!visit_id || !image_category) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Visit ID and category are required' 
                });
            }
            
            if (!['raw', 'stained'].includes(image_category)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid category. Must be "raw" or "stained"' 
                });
            }
            
            // If file is uploaded, upload to MinIO first
            if (req.file) {
                const storageService = require('../services/storage');
                const timestamp = Date.now();
                const ext = req.file.mimetype.split('/')[1] || 'jpg';
                const objectName = `visits/${visit_id}/${image_category}_${image_type}_${timestamp}.${ext}`;
                
                const uploadResult = await storageService.uploadFile(
                    objectName,
                    req.file.buffer,
                    {
                        'Content-Type': req.file.mimetype,
                        'Content-Length': req.file.size
                    }
                );
                
                if (!uploadResult.success) {
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to upload to MinIO: ' + uploadResult.error
                    });
                }
                
                url_minio = uploadResult.url;
            }
            
            // url_minio is now required (either from body or from file upload)
            if (!url_minio) {
                return res.status(400).json({
                    success: false,
                    error: 'Either url_minio or image file is required'
                });
            }
            
            const image = await Image.create({ 
                visit_id, 
                url_minio, 
                image_category, 
                image_type, 
                image_index,
                validation_status: 'pending',
                notes
            });
            
            res.status(201).json({ success: true, data: image });
        } catch (error) {
            console.error('Error creating image:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateValidationStatus(req, res) {
        try {
            const { id } = req.params;
            const { validation_status } = req.body;
            
            if (!['pending', 'valid', 'invalid'].includes(validation_status)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid status. Must be "pending", "valid", or "invalid"' 
                });
            }
            
            const image = await Image.updateValidationStatus(id, validation_status);
            
            if (!image) {
                return res.status(404).json({ success: false, error: 'Image not found' });
            }
            
            res.json({ success: true, data: image });
        } catch (error) {
            console.error('Error updating image status:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async deleteImage(req, res) {
        try {
            const { id } = req.params;
            const image = await Image.delete(id);
            
            // TODO: Delete from MinIO using image.url_minio
            
            res.json({ success: true, message: 'Image deleted successfully' });
        } catch (error) {
            console.error('Error deleting image:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async rotateImage(req, res) {
        try {
            const { id } = req.params;
            const { rotation } = req.body;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Rotated image file is required'
                });
            }

            if (!rotation || ![90, 180, 270].includes(parseInt(rotation))) {
                return res.status(400).json({
                    success: false,
                    error: 'Valid rotation angle (90, 180, 270) is required'
                });
            }

            // Get existing image from database
            const existingImage = await Image.findById(id);
            if (!existingImage) {
                return res.status(404).json({
                    success: false,
                    error: 'Image not found'
                });
            }

            // Upload rotated image to MinIO (overwrite existing)
            const storageService = require('../services/storage');
            
            // Extract object name from existing URL
            // URL format: /nhakhoa/visits/252/raw_lower_left_jpg.rf.xxx.jpg
            let objectName = existingImage.url;
            if (objectName.startsWith('/nhakhoa/')) {
                objectName = objectName.substring(9); // Remove /nhakhoa/ prefix
            }

            const uploadResult = await storageService.uploadFile(
                objectName,
                req.file.buffer,
                {
                    'Content-Type': req.file.mimetype,
                    'Content-Length': req.file.size
                }
            );

            if (!uploadResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to upload rotated image: ' + uploadResult.error
                });
            }

            // Clear processed data and reset processing status
            // This ensures the rotated RAW image will be reprocessed with correct orientation
            const clearProcessedQuery = `
                UPDATE images 
                SET 
                    url_processed = NULL,
                    processing_status = 'pending',
                    processed_at = NULL
                WHERE id = $1
                RETURNING *
            `;
            const clearResult = await db.query(clearProcessedQuery, [id]);

            // Delete only subboxes (will be regenerated), keep parent tooth annotations
            const deleteAnnotationsQuery = `
                DELETE FROM image_annotations 
                WHERE image_id = $1 
                AND parent_annotation_id IS NOT NULL
            `;
            await db.query(deleteAnnotationsQuery, [id]);

            const updatedImage = clearResult.rows[0];

            res.json({
                success: true,
                data: updatedImage,
                message: `Image rotated ${rotation}° successfully. Processed data and annotations cleared. Ready for reprocessing.`,
                needsReprocessing: true
            });
        } catch (error) {
            console.error('Error rotating image:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ImageController();
