/**
 * Stained Image Validator Service
 * Validates and processes stained image uploads for visits with existing RAW images
 */

const { Image } = require('../models');

/**
 * Position name variations mapping
 * Maps common filename position patterns to standard position types
 */
const POSITION_VARIATIONS = {
  // Upper positions
  'upper_right': ['upper_right', 'upper-right', 'top_right', 'top-right', 'tren_phai', 'tren-phai', 'PCT'],
  'upper_center': ['upper_center', 'upper-center', 'upper_middle', 'upper-middle', 'top_center', 'top-center', 'top_middle', 'top-middle', 'tren_giua', 'tren-giua', 'GCT'],
  'upper_left': ['upper_left', 'upper-left', 'top_left', 'top-left', 'tren_trai', 'tren-trai', 'TCT'],
  
  // Middle positions
  'middle_right': ['middle_right', 'middle-right', 'central_right', 'central-right', 'center_right', 'center-right', 'giua_phai', 'giua-phai', 'P'],
  'middle_center': ['middle_center', 'middle-center', 'middle_middle', 'middle-middle', 'central_middle', 'central-middle', 'central_center', 'central-center', 'center', 'giua', 'G'],
  'middle_left': ['middle_left', 'middle-left', 'central_left', 'central-left', 'center_left', 'center-left', 'giua_trai', 'giua-trai', 'T'],
  
  // Lower positions
  'lower_right': ['lower_right', 'lower-right', 'bottom_right', 'bottom-right', 'duoi_phai', 'duoi-phai', 'PCD'],
  'lower_center': ['lower_center', 'lower-center', 'lower_middle', 'lower-middle', 'bottom_center', 'bottom-center', 'bottom_middle', 'bottom-middle', 'duoi_giua', 'duoi-giua', 'GCD'],
  'lower_left': ['lower_left', 'lower-left', 'bottom_left', 'bottom-left', 'duoi_trai', 'duoi-trai', 'TCD']
};

/**
 * Standard position list (9 positions)
 */
const STANDARD_POSITIONS = [
  { index: 1, type: 'upper_right', label: 'Trên phải' },
  { index: 2, type: 'upper_center', label: 'Trên giữa' },
  { index: 3, type: 'upper_left', label: 'Trên trái' },
  { index: 4, type: 'middle_right', label: 'Giữa phải' },
  { index: 5, type: 'middle_center', label: 'Giữa' },
  { index: 6, type: 'middle_left', label: 'Giữa trái' },
  { index: 7, type: 'lower_right', label: 'Dưới phải' },
  { index: 8, type: 'lower_center', label: 'Dưới giữa' },
  { index: 9, type: 'lower_left', label: 'Dưới trái' }
];

/**
 * Normalize position name from filename to standard type
 * Handles variations like: top-right, Top_Right, upper-right, etc.
 * @param {string} positionName - Position extracted from filename
 * @returns {Object|null} - { type, index, label } or null if not recognized
 */
function normalizePositionName(positionName) {
  if (!positionName) return null;
  
  // Normalize: lowercase, remove separators
  const normalized = positionName
    .toLowerCase()
    .replace(/[-_\s]/g, '')
    .trim();
  
  // Try to match with variations
  // First pass: exact match
  for (const [standardType, variations] of Object.entries(POSITION_VARIATIONS)) {
    for (const variant of variations) {
      const variantNormalized = variant.toLowerCase().replace(/[-_\s]/g, '');
      if (normalized === variantNormalized) {
        // Find position details
        const position = STANDARD_POSITIONS.find(p => p.type === standardType);
        return position || { type: standardType, index: null, label: standardType };
      }
    }
  }
  
  // Second pass: partial match (but only for multi-char variants to avoid
  // single-letter code collisions like 't' matching 'bottomleft')
  // Use longest-match-wins to avoid collisions (e.g. 'center' vs 'bottomcenter')
  let bestMatch = null;
  let bestLength = 0;
  for (const [standardType, variations] of Object.entries(POSITION_VARIATIONS)) {
    for (const variant of variations) {
      const variantNormalized = variant.toLowerCase().replace(/[-_\s]/g, '');
      if (variantNormalized.length < 2 || variantNormalized.length <= bestLength) continue;
      if (normalized.includes(variantNormalized)) {
        bestLength = variantNormalized.length;
        bestMatch = standardType;
      }
    }
  }
  
  if (bestMatch) {
    const position = STANDARD_POSITIONS.find(p => p.type === bestMatch);
    return position || { type: bestMatch, index: null, label: bestMatch };
  }
  
  return null;
}

/**
 * Parse filename to extract patient info, date, and position
 * Expected patterns:
 *  - Old: Patient_0061_28-10-2025_Top-right.jpg
 *  - New: patient_add_0061_G.jpg (no date, uses current date)
 * @param {string} filename - Original filename
 * @returns {Object|null} - { patientId, date, position, originalName } or null
 */
function parseStainedFilename(filename) {
  // Pattern 1 (old): Patient_XXXX_DD-MM-YYYY_Position.ext
  const pattern = /Patient[_-](\d{4})[_-](\d{2})[_-](\d{2})[_-](\d{4})[_-](.+?)(?:[_.](?:JPG|PNG|jpg|png))?(?:\.rf\.[a-f0-9]+)?\.(?:jpg|jpeg|png)$/i;
  
  let match = filename.match(pattern);
  let hasDate = !!match;
  
  if (!match) {
    // Pattern 2 (new): patient_add_XXXX_Position.ext (no date)
    const pattern2 = /(?:patient[_-]add|patient|Patient)[_-](\d{4})[_-](.+?)(?:\.rf\.[a-f0-9]+)?\.(?:jpg|jpeg|png)$/i;
    match = filename.match(pattern2);
    
    if (!match) {
      return null;
    }
  }
  
  let patientId, day, month, year, positionRaw;
  
  if (hasDate) {
    [, patientId, day, month, year, positionRaw] = match;
  } else {
    [, patientId, positionRaw] = match;
  }
  
  // Normalize position
  const position = normalizePositionName(positionRaw);
  if (!position) {
    return null;
  }
  
  // Format date as YYYY-MM-DD for DB comparison
  const date = hasDate ? `${year}-${month}-${day}` : new Date().toISOString().split('T')[0];
  
  return {
    patientId: `Patient_${patientId}`,
    patientIdNumber: patientId,
    date,
    position,
    originalName: filename
  };
}

/**
 * Validate that a visit has RAW images (optional check - only warning)
 * @param {number} visitId - Visit ID
 * @returns {Promise<Object>} - { hasRawImages, rawImages, message }
 */
async function validateVisitHasRawImages(visitId) {
  try {
    const rawImages = await Image.findByCategory(visitId, 'raw');
    
    if (!rawImages || rawImages.length === 0) {
      return {
        hasRawImages: false,
        rawImages: [],
        message: 'Visit này chưa có ảnh RAW. Bạn có thể upload ảnh RAW sau.'
      };
    }
    
    return {
      hasRawImages: true,
      rawImages,
      message: `Visit có ${rawImages.length}/9 ảnh RAW`
    };
  } catch (error) {
    return {
      hasRawImages: false,
      rawImages: [],
      message: `Lỗi kiểm tra RAW images: ${error.message}`
    };
  }
}

/**
 * Get existing stained images for a visit (for duplicate detection)
 * @param {number} visitId - Visit ID
 * @returns {Promise<Array>} - Array of existing stained images
 */
async function getExistingStainedImages(visitId) {
  try {
    return await Image.findByCategory(visitId, 'stained');
  } catch (error) {
    console.error('Error fetching existing stained images:', error);
    return [];
  }
}

/**
 * Detect missing positions by comparing uploaded images with 9-position grid
 * @param {Array} parsedImages - Array of parsed image data with position info
 * @returns {Object} - { complete, missing, present, missingDetails }
 */
function detectMissingPositions(parsedImages) {
  const presentTypes = new Set(parsedImages.map(img => img.position.type));
  
  const missing = STANDARD_POSITIONS.filter(pos => !presentTypes.has(pos.type));
  const present = STANDARD_POSITIONS.filter(pos => presentTypes.has(pos.type));
  
  return {
    complete: missing.length === 0,
    missing: missing.map(p => p.type),
    missingDetails: missing,
    present: present.map(p => p.type),
    presentDetails: present,
    total: STANDARD_POSITIONS.length,
    uploadedCount: present.length,
    missingCount: missing.length
  };
}

/**
 * Validate stained image upload batch
 * @param {number} visitId - Visit ID
 * @param {Array} files - Array of { originalname, ... }
 * @returns {Promise<Object>} - Validation result with details
 */
async function validateStainedImageBatch(visitId, files) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    parsedImages: [],
    existingStained: [],
    rawImages: [],
    positionAnalysis: null
  };
  
  // 1. Check if visit has RAW images (optional - only warning)
  const rawCheck = await validateVisitHasRawImages(visitId);
  result.rawImages = rawCheck.rawImages;
  
  if (!rawCheck.hasRawImages) {
    result.warnings.push(rawCheck.message);
  }
  
  // 2. Parse all filenames
  const parsedImages = [];
  const parseErrors = [];
  
  for (const file of files) {
    const parsed = parseStainedFilename(file.originalname);
    if (!parsed) {
      parseErrors.push(`Không thể parse filename: ${file.originalname}`);
      continue;
    }
    parsedImages.push({
      ...parsed,
      file
    });
  }
  
  if (parseErrors.length > 0) {
    result.errors.push(...parseErrors);
    if (parsedImages.length === 0) {
      result.valid = false;
      return result;
    }
  }
  
  result.parsedImages = parsedImages;
  
  // 3. Check for existing stained images (for replacement)
  const existingStained = await getExistingStainedImages(visitId);
  result.existingStained = existingStained;
  
  if (existingStained.length > 0) {
    result.warnings.push(`Visit đã có ${existingStained.length} ảnh nhuộm. Các ảnh trùng vị trí sẽ được thay thế.`);
  }
  
  // 4. Detect missing positions
  const positionAnalysis = detectMissingPositions(parsedImages);
  result.positionAnalysis = positionAnalysis;
  
  if (!positionAnalysis.complete) {
    const missingLabels = positionAnalysis.missingDetails.map(p => p.label).join(', ');
    result.warnings.push(
      `Thiếu ${positionAnalysis.missingCount} vị trí: ${missingLabels}`
    );
  }
  
  // 5. Check for duplicate positions in upload batch
  const positionCounts = {};
  parsedImages.forEach(img => {
    const type = img.position.type;
    positionCounts[type] = (positionCounts[type] || 0) + 1;
  });
  
  const duplicates = Object.entries(positionCounts)
    .filter(([type, count]) => count > 1)
    .map(([type, count]) => {
      const pos = STANDARD_POSITIONS.find(p => p.type === type);
      return `${pos?.label || type} (${count} ảnh)`;
    });
  
  if (duplicates.length > 0) {
    result.warnings.push(`Vị trí trùng lặp: ${duplicates.join(', ')}. Chỉ ảnh cuối cùng sẽ được giữ lại.`);
  }
  
  return result;
}

/**
 * Map parsed images to position-based structure for upload
 * @param {Array} parsedImages - Parsed images from validateStainedImageBatch
 * @returns {Object} - { byPosition, duplicates }
 */
function mapImagesToPositions(parsedImages) {
  const byPosition = {};
  const duplicates = {};
  
  parsedImages.forEach(img => {
    const type = img.position.type;
    
    if (byPosition[type]) {
      // Duplicate detected
      if (!duplicates[type]) {
        duplicates[type] = [byPosition[type]];
      }
      duplicates[type].push(img);
    }
    
    // Keep last image for each position
    byPosition[type] = img;
  });
  
  return { byPosition, duplicates };
}

module.exports = {
  normalizePositionName,
  parseStainedFilename,
  validateVisitHasRawImages,
  getExistingStainedImages,
  detectMissingPositions,
  validateStainedImageBatch,
  mapImagesToPositions,
  STANDARD_POSITIONS,
  POSITION_VARIATIONS
};
