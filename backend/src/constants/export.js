/**
 * Export Constants
 * Configuration for dataset export functionality
 */

const path = require('path');
const os = require('os');

module.exports = {
  // Default train/val/test split ratios
  DEFAULT_SPLIT_RATIO: {
    train: 0.7,
    val: 0.15,
    test: 0.15
  },

  // Maximum number of images per export before requiring background job
  MAX_EXPORT_SIZE: 200,

  // Warning threshold for sync exports
  SYNC_EXPORT_WARNING_SIZE: 100,

  // Temporary directory for export processing
  TEMP_DIR_PATH: path.join(os.tmpdir(), 'nhakhoa-exports'),

  // Export formats
  EXPORT_FORMATS: {
    YOLO: 'yolo',
    COCO: 'coco',
    BOTH: 'both'
  },

  // YOLO class IDs for plaque detection
  YOLO_PLAQUE_CLASSES: {
    NO_PLAQUE: 0,
    HAS_PLAQUE: 1
  },

  // YOLO class names
  YOLO_CLASS_NAMES: ['no_plaque', 'has_plaque'],

  // Annotation status filters
  ANNOTATION_STATUS: {
    FULL: 'full',        // All subboxes annotated
    PARTIAL: 'partial',  // Some subboxes annotated
    ANY: 'any'           // Include all images
  },

  // Minimum subboxes per tooth (4 regions)
  MIN_SUBBOXES_PER_TOOTH: 4,

  // Export file expiration (1 hour in seconds)
  EXPORT_EXPIRATION_SECONDS: 3600,

  // Batch size for processing images
  BATCH_SIZE: 50,

  // ZIP compression level (0-9, 6 is good balance)
  ZIP_COMPRESSION_LEVEL: 6,

  // Maximum file size for single export (2GB)
  MAX_EXPORT_FILE_SIZE: 2 * 1024 * 1024 * 1024,

  // Rate limiting
  MAX_EXPORTS_PER_HOUR: 5,

  // Allowed roles for export
  ALLOWED_ROLES: ['doctor', 'admin'],

  // Split strategies
  SPLIT_STRATEGY: {
    PATIENT: 'patient',  // Split by patient (recommended)
    VISIT: 'visit',      // Split by visit
    RANDOM: 'random'     // Random split (not recommended)
  },

  // Error codes
  ERROR_CODES: {
    NO_ANNOTATED_IMAGES: 'NO_ANNOTATED_IMAGES',
    INVALID_SPLIT_RATIO: 'INVALID_SPLIT_RATIO',
    INVALID_FORMAT: 'INVALID_FORMAT',
    EXPORT_TOO_LARGE: 'EXPORT_TOO_LARGE',
    INSUFFICIENT_SPACE: 'INSUFFICIENT_SPACE',
    UNAUTHORIZED: 'UNAUTHORIZED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
  },

  // Minimum free disk space required (2GB)
  MIN_FREE_DISK_SPACE: 2 * 1024 * 1024 * 1024
};
