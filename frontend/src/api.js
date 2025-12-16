import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Patients
export const getPatients = (params = '') => api.get(`/patients${params}`);
export const getPatientById = (id) => api.get(`/patients/${id}`);
export const searchPatients = (query) => api.get(`/patients/search?q=${query}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.put(`/patients/${id}`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}`);

// Visits
export const getVisits = () => api.get('/visits');
export const getVisitById = (id) => api.get(`/visits/${id}`);
export const getVisitsByPatient = (patientId) => api.get(`/patients/${patientId}/visits`);
export const createVisit = (data) => api.post('/visits', data);
export const updateVisit = (id, data) => api.put(`/visits/${id}`, data);
export const deleteVisit = (id) => api.delete(`/visits/${id}`);

// Images
export const getImagesByVisit = (visitId) => api.get(`/visits/${visitId}/images`);
export const getImagesByCategory = (visitId, category) => api.get(`/visits/${visitId}/images/${category}`);
export const createImage = (data) => api.post('/images', data);
export const updateImageValidation = (id, status) => api.put(`/images/${id}/validation`, { validation_status: status });
export const deleteImage = (id) => api.delete(`/images/${id}`);

// Bulk Upload
export const bulkUploadImages = (formData) => {
  return api.post('/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getBulkUploadHistory = () => api.get('/bulk-upload/history');

export default api;
