/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number (Vietnamese format)
 */
export const isValidPhone = (phone) => {
  const re = /^(0|\+84)[0-9]{9}$/;
  return re.test(phone.replace(/\s|-/g, ''));
};

/**
 * Validate file type
 */
export const isValidImageType = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  return validTypes.includes(file.type);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file, maxSizeInMB = 10) => {
  const maxSize = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSize;
};

/**
 * Validate date is not in future
 */
export const isNotFutureDate = (date) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return selectedDate <= today;
};

/**
 * Required field validator
 */
export const required = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Min length validator
 */
export const minLength = (value, min) => {
  if (!value) return false;
  return value.length >= min;
};

/**
 * Max length validator
 */
export const maxLength = (value, max) => {
  if (!value) return true;
  return value.length <= max;
};
