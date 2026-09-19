import apiClient from './apiClient';

/**
 * Image Service
 * Handles all image-related API calls
 */
class ImageService {
  /**
   * Get all images for a visit
   */
  async getVisitImages(visitId, category = null) {
    const response = await apiClient.get(`/api/visits/${visitId}/images`, {
      params: { category }
    });
    return response.data;
  }

  /**
   * Upload single image
   */
  async uploadImage(visitId, imageData) {
    const formData = new FormData();
    formData.append('image', imageData.file);
    formData.append('image_category', imageData.category);
    formData.append('image_type', imageData.type);
    formData.append('image_index', imageData.index);
    if (imageData.notes) {
      formData.append('notes', imageData.notes);
    }

    const response = await apiClient.post(`/api/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Update image validation status
   */
  async updateValidationStatus(imageId, status) {
    const response = await apiClient.put(`/api/images/${imageId}/validation`, {
      validation_status: status
    });
    return response.data;
  }

  /**
   * Delete image (soft delete)
   */
  async deleteImage(imageId) {
    const response = await apiClient.delete(`/api/images/${imageId}`);
    return response.data;
  }

  /**
   * Bulk upload images
   */
  async bulkUpload(formData) {
    const response = await apiClient.post('/api/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Get bulk upload history
   */
  async getBulkUploadHistory() {
    const response = await apiClient.get('/api/bulk-upload/history');
    return response.data;
  }

  /**
   * Process raw images (send to Python service)
   */
  async processImages(visitId) {
    console.log('imageService.processImages called with visitId:', visitId);
    console.log('API URL:', import.meta.env.VITE_API_URL);
    
    try {
      const url = `/api/visits/${visitId}/process-images`;
      console.log('Making POST request to:', url);
      
      const response = await apiClient.post(url, {}, {
        timeout: 300000 // 5 minutes timeout
      });
      
      console.log('Response received:', response);
      return response.data;
    } catch (error) {
      console.error('imageService.processImages error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error;
    }
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(visitId) {
    const response = await apiClient.get(`/api/visits/${visitId}/processing-status`);
    return response.data;
  }
}

export default new ImageService();
