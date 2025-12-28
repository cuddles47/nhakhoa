// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Authentication
export const AUTH_TOKEN_KEY = 'dental_auth_token';
export const AUTH_USER_KEY = 'dental_user';

// Visit Status
export const VISIT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const VISIT_STATUS_LABELS = {
  [VISIT_STATUS.PENDING]: 'Chờ xử lý',
  [VISIT_STATUS.IN_PROGRESS]: 'Đang xử lý',
  [VISIT_STATUS.COMPLETED]: 'Hoàn thành',
  [VISIT_STATUS.CANCELLED]: 'Đã hủy'
};

// Image Categories
export const IMAGE_CATEGORY = {
  RAW: 'raw',
  STAINED: 'stained'
};

export const IMAGE_CATEGORY_LABELS = {
  [IMAGE_CATEGORY.RAW]: 'Ảnh thô',
  [IMAGE_CATEGORY.STAINED]: 'Ảnh nhuộm'
};

// Image Validation Status
export const VALIDATION_STATUS = {
  PENDING: 'pending',
  VALID: 'valid',
  INVALID: 'invalid'
};

export const VALIDATION_STATUS_LABELS = {
  [VALIDATION_STATUS.PENDING]: 'Chờ kiểm tra',
  [VALIDATION_STATUS.VALID]: 'Hợp lệ',
  [VALIDATION_STATUS.INVALID]: 'Không hợp lệ'
};

// Image Positions (3x3 grid for dental orthodontic images)
export const IMAGE_POSITIONS = [
  { value: 1, index: 1, type: 'upper_right', label: 'Trên phải' },
  { value: 2, index: 2, type: 'upper_center', label: 'Trên giữa' },
  { value: 3, index: 3, type: 'upper_left', label: 'Trên trái' },
  { value: 4, index: 4, type: 'middle_right', label: 'Giữa phải' },
  { value: 5, index: 5, type: 'middle_center', label: 'Giữa' },
  { value: 6, index: 6, type: 'middle_left', label: 'Giữa trái' },
  { value: 7, index: 7, type: 'lower_right', label: 'Dưới phải' },
  { value: 8, index: 8, type: 'lower_center', label: 'Dưới giữa' },
  { value: 9, index: 9, type: 'lower_left', label: 'Dưới trái' }
];

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Formats
export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// Query Keys for React Query
export const QUERY_KEYS = {
  AUTH: ['auth'],
  PATIENTS: ['patients'],
  PATIENT: (id) => ['patient', id],
  VISITS: ['visits'],
  VISIT: (id) => ['visit', id],
  PATIENT_VISITS: (patientId) => ['patient', patientId, 'visits'],
  IMAGES: (visitId) => ['visit', visitId, 'images'],
  BULK_UPLOAD_HISTORY: ['bulk-upload-history']
};
