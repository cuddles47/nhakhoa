import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor: tự động gọi refresh khi access token hết hạn
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Gọi refresh token
        const res = await api.post('/auth/refresh');
        const newAccessToken = res.data.accessToken;
        if (newAccessToken) {
          // Lưu access token mới vào localStorage
          localStorage.setItem('accessToken', newAccessToken);
          // Gắn lại Authorization header và retry request
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Nếu refresh token cũng hết hạn, chuyển về trang login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const getProfile = () => api.get('/auth/profile');

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
export const bulkUploadImages = (formData, onUploadProgress) => {
  return api.post('/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 600000, // 10 minutes for large uploads
    onUploadProgress: onUploadProgress,
  });
};
export const getBulkUploadHistory = () => api.get('/bulk-upload/history');

// Presigned + confirm flows for direct-to-MinIO folder uploads
export const generatePresignedUrls = (data) => api.post('/bulk-upload/presigned', data);
export const confirmBulkUpload = (data) => api.post('/bulk-upload/confirm', data);

export default api;
