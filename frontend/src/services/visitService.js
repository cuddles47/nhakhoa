import apiClient from './apiClient';

/**
 * Visit Service
 * Handles all visit-related API calls
 */
class VisitService {
  /**
   * Get all visits with optional filters
   */
  async getVisits({ patientId, status, startDate, endDate } = {}) {
    const response = await apiClient.get('/api/visits', {
      params: { patientId, status, startDate, endDate }
    });
    return response.data;
  }

  /**
   * Get single visit by ID
   */
  async getVisit(id) {
    const response = await apiClient.get(`/api/visits/${id}`);
    return response.data;
  }

  /**
   * Get all visits for a specific patient
   */
  async getPatientVisits(patientId) {
    const response = await apiClient.get(`/api/patients/${patientId}/visits`);
    return response.data;
  }

  /**
   * Create new visit
   */
  async createVisit(visitData) {
    const response = await apiClient.post('/api/visits', visitData);
    return response.data;
  }

  /**
   * Update visit
   */
  async updateVisit(id, visitData) {
    const response = await apiClient.put(`/api/visits/${id}`, visitData);
    return response.data;
  }

  /**
   * Delete visit (soft delete)
   */
  async deleteVisit(id) {
    const response = await apiClient.delete(`/api/visits/${id}`);
    return response.data;
  }
}

export default new VisitService();
