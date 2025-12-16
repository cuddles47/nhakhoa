const { Image } = require('../models');

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
            res.json({ success: true, data: images });
        } catch (error) {
            console.error('Error fetching images:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async createImage(req, res) {
        try {
            const { visit_id, url_minio, image_category, image_type, image_index, notes } = req.body;
            
            if (!visit_id || !url_minio || !image_category) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Visit ID, URL, and category are required' 
                });
            }
            
            if (!['raw', 'stained'].includes(image_category)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid category. Must be "raw" or "stained"' 
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
}

module.exports = new ImageController();
