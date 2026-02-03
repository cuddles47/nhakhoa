/**
 * Annotation Service
 * Xử lý parse COCO annotations, matching với uploaded images, và conversion sang YOLO format
 */

/**
 * Split multi-patient COCO file into separate COCO files per patient
 * @param {Buffer} cocoBuffer - Original COCO JSON buffer containing multiple patients
 * @param {Array<string>} patientIds - Optional list of patient IDs to filter (e.g., ['0061', '0062'])
 * @returns {Object} - Map of patient_id → COCO JSON object { 'Patient_0061': {...coco}, 'Patient_0062': {...coco} }
 */
function splitCOCOByPatient(cocoBuffer, patientIds = null) {
  try {
    const cocoData = JSON.parse(cocoBuffer.toString('utf-8'));
    
    // Validate structure
    if (!cocoData.images || !cocoData.annotations || !cocoData.categories) {
      throw new Error('Invalid COCO format: missing required fields (images, annotations, categories)');
    }
    
    // Group images by patient ID extracted from filename
    // Expected pattern: Patient_XXXX_Date_Position.ext
    const imagesByPatient = {};
    const patientIdRegex = /Patient_(\d{4})_/i;
    
    cocoData.images.forEach(img => {
      const match = img.file_name.match(patientIdRegex);
      if (match) {
        const patientId = `Patient_${match[1]}`;
        
        // Filter by requested patient IDs if provided
        if (patientIds && !patientIds.includes(patientId) && !patientIds.includes(match[1])) {
          return;
        }
        
        if (!imagesByPatient[patientId]) {
          imagesByPatient[patientId] = [];
        }
        imagesByPatient[patientId].push(img);
      }
    });
    
    // Build separate COCO structure for each patient
    const cocoByPatient = {};
    
    for (const [patientId, patientImages] of Object.entries(imagesByPatient)) {
      // Create mapping: old image ID → new image ID (0-indexed per patient)
      const imageIdMap = {};
      const remappedImages = patientImages.map((img, newIdx) => {
        imageIdMap[img.id] = newIdx;
        return {
          ...img,
          id: newIdx
        };
      });
      
      // Filter annotations for this patient's images and re-map image_id
      const patientAnnotations = cocoData.annotations
        .filter(ann => imageIdMap[ann.image_id] !== undefined)
        .map((ann, idx) => ({
          ...ann,
          id: idx + 1, // Re-index annotation IDs starting from 1
          image_id: imageIdMap[ann.image_id] // Use new image ID
        }));
      
      // Build complete COCO structure for this patient
      cocoByPatient[patientId] = {
        info: cocoData.info || {
          description: `Split COCO annotations for ${patientId}`,
          date_created: new Date().toISOString()
        },
        licenses: cocoData.licenses || [],
        categories: cocoData.categories, // Categories are shared
        images: remappedImages,
        annotations: patientAnnotations
      };
    }
    
    return cocoByPatient;
  } catch (error) {
    throw new Error(`Failed to split COCO file by patient: ${error.message}`);
  }
}

/**
 * Parse COCO format JSON file
 * @param {Buffer} fileBuffer - Buffer của file annotation JSON
 * @returns {Object} - { imageMap, annotationsByImage, categoryMap }
 */
function parseCOCOFile(fileBuffer) {
  try {
    const cocoData = JSON.parse(fileBuffer.toString('utf-8'));
    
    // Validate structure
    if (!cocoData.images || !cocoData.annotations || !cocoData.categories) {
      throw new Error('Invalid COCO format: missing required fields (images, annotations, categories)');
    }
    
    // Build category map: id → name
    const categoryMap = {};
    cocoData.categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });
    
    // Build image map: file_name → { coco_id, width, height, original_name }
    const imageMap = {};
    cocoData.images.forEach(img => {
      const key = img.file_name;
      imageMap[key] = {
        coco_id: img.id,
        width: img.width,
        height: img.height,
        original_name: img.original_name || img.file_name
      };
    });
    
    // Group annotations by image_id
    const annotationsByImage = {};
    cocoData.annotations.forEach(ann => {
      if (!annotationsByImage[ann.image_id]) {
        annotationsByImage[ann.image_id] = [];
      }
      annotationsByImage[ann.image_id].push({
        id: ann.id,
        category_id: ann.category_id,
        category_name: categoryMap[ann.category_id] || 'unknown',
        bbox: ann.bbox,  // [x, y, width, height] in pixels
        area: ann.area || (ann.bbox[2] * ann.bbox[3])
      });
    });
    
    return { imageMap, annotationsByImage, categoryMap };
  } catch (error) {
    throw new Error(`Failed to parse COCO file: ${error.message}`);
  }
}

/**
 * Match uploaded filename với COCO annotations
 * @param {string} uploadedFilename - Tên file đã upload
 * @param {Object} imageMap - Map từ parseCOCOFile
 * @returns {Object|null} - { coco_id, width, height, original_name } hoặc null nếu không match
 */
function matchFilenameToAnnotations(uploadedFilename, imageMap) {
  // Strategy 1: Exact match
  if (imageMap[uploadedFilename]) {
    return imageMap[uploadedFilename];
  }
  
  // Strategy 2: Match by removing hash pattern (.rf.HASH)
  // Pattern: Patient_0062_28-10-2025_Central-right_JPG.rf.bb04f805bdd851b5a72f6befee533f0e.jpg
  // Remove: .rf.[hash] and extension, then compare base pattern
  const normalizeFilename = (filename) => {
    return filename
      .replace(/\.rf\.[a-f0-9]+/i, '')  // Remove Roboflow hash
      .replace(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i, '')  // Remove extension
      .toLowerCase()
      .replace(/[-_]/g, '');  // Normalize separators
  };
  
  const uploadedNormalized = normalizeFilename(uploadedFilename);
  
  for (const [cocoFilename, imageInfo] of Object.entries(imageMap)) {
    const cocoNormalized = normalizeFilename(cocoFilename);
    
    if (uploadedNormalized === cocoNormalized) {
      return imageInfo;
    }
  }
  
  // Strategy 3: Fuzzy match by extracting key parts (Patient_ID_Date_Position)
  // Extract pattern like: Patient_0062_28-10-2025_Central-right
  const extractPattern = (filename) => {
    const match = filename.match(/Patient[_-](\d+)[_-](\d{2})[_-](\d{2})[_-](\d{4})[_-](.+?)(?:[_.](?:JPG|PNG|jpg|png))?(?:\.rf\.[a-f0-9]+)?\.?(?:jpg|jpeg|png)?$/i);
    if (match) {
      const [, patientId, day, month, year, position] = match;
      return `${patientId}_${day}${month}${year}_${position}`.toLowerCase().replace(/[-_]/g, '');
    }
    return null;
  };
  
  const uploadedPattern = extractPattern(uploadedFilename);
  if (uploadedPattern) {
    for (const [cocoFilename, imageInfo] of Object.entries(imageMap)) {
      const cocoPattern = extractPattern(cocoFilename);
      if (cocoPattern && uploadedPattern === cocoPattern) {
        return imageInfo;
      }
    }
  }
  
  return null;  // No match found
}

/**
 * Convert COCO bbox sang YOLO format
 * @param {Array} cocoAnnotations - Array of { category_id, category_name, bbox: [x, y, w, h] }
 * @param {number} imageWidth - Width của ảnh (pixels)
 * @param {number} imageHeight - Height của ảnh (pixels)
 * @returns {Array} - Array of { class_id, x_center, y_center, width, height, category_name }
 */
function convertCOCOToYOLO(cocoAnnotations, imageWidth, imageHeight) {
  return cocoAnnotations.map(ann => {
    const [x, y, w, h] = ann.bbox;  // COCO: top-left x, y, width, height
    
    // Convert to center coordinates (normalized [0, 1])
    const x_center = (x + w / 2) / imageWidth;
    const y_center = (y + h / 2) / imageHeight;
    const width_norm = w / imageWidth;
    const height_norm = h / imageHeight;
    
    return {
      class_id: getCategoryYOLOClass(ann.category_id),
      x_center,
      y_center,
      width: width_norm,
      height: height_norm,
      category_name: ann.category_name
    };
  });
}

/**
 * COCO Category Mapping
 * YOLO class = COCO category_id (giữ nguyên)
 * Teeth: category_id 1-20 → YOLO class 1-20
 * Brace: category_id 21 → YOLO class 21
 */

/**
 * Map COCO category_id sang YOLO class ID
 * @param {number} categoryId - Category ID từ COCO
 * @returns {number} - YOLO class ID (giống category_id)
 */
function getCategoryYOLOClass(categoryId) {
  // YOLO class = COCO category_id (giữ nguyên)
  return categoryId || 0;
}

/**
 * Lưu batch annotations vào database
 * @param {Object} client - PostgreSQL client (trong transaction)
 * @param {Array} annotations - Array of { image_id, coco_image_id, category_id, category_name, bbox, area, source_type, parent_annotation_id, subbox_region }
 * @returns {Array} - Array of inserted annotation records
 */
async function storeBatchAnnotations(client, annotations) {
  const query = `
    INSERT INTO image_annotations 
      (image_id, coco_image_id, category_id, category_name, bbox, area, source_type, parent_annotation_id, subbox_region)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const results = [];
  for (const ann of annotations) {
    const result = await client.query(query, [
      ann.image_id,
      ann.coco_image_id,
      ann.category_id,
      ann.category_name,
      JSON.stringify(ann.bbox),  // JSONB format
      ann.area,
      ann.source_type || 'doctor_upload', // Default
      ann.parent_annotation_id || null,
      ann.subbox_region || null
    ]);
    results.push(result.rows[0]);
  }
  
  return results;
}

/**
 * Format YOLO annotations thành text string (5-field format)
 * @param {Array} yoloAnnotations - Array of { class_id, x_center, y_center, width, height }
 * @returns {string} - YOLO format text (one annotation per line)
 */
function formatYOLOText(yoloAnnotations) {
  return yoloAnnotations
    .map(ann => `${ann.class_id} ${ann.x_center.toFixed(6)} ${ann.y_center.toFixed(6)} ${ann.width.toFixed(6)} ${ann.height.toFixed(6)}`)
    .join('\n');
}

/**
 * Validate annotation counts cho một image
 * @param {number} annotationCount - Số lượng annotations
 * @returns {Object} - { valid, warning, level }
 */
function validateAnnotationCount(annotationCount) {
  if (annotationCount === 0) {
    return { 
      valid: false, 
      warning: 'No annotations found', 
      level: 'error' 
    };
  }
  
  if (annotationCount > 50) {
    return { 
      valid: true, 
      warning: `Unusually high annotation count: ${annotationCount}`, 
      level: 'warning' 
    };
  }
  
  return { valid: true, warning: null, level: 'ok' };
}

/**
 * Convert bounding box from pixels to YOLO normalized format
 * @param {Array} bbox - [x, y, width, height] in pixels
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @returns {Object} - { x_center, y_center, width, height } normalized [0-1]
 */
function convertBboxToYOLOFormat(bbox, imageWidth, imageHeight) {
  const [x, y, w, h] = bbox;
  
  // Convert top-left corner to center
  const x_center = (x + w / 2) / imageWidth;
  const y_center = (y + h / 2) / imageHeight;
  const width = w / imageWidth;
  const height = h / imageHeight;
  
  // Clamp to [0, 1] range
  return {
    x_center: Math.max(0, Math.min(1, x_center)),
    y_center: Math.max(0, Math.min(1, y_center)),
    width: Math.max(0, Math.min(1, width)),
    height: Math.max(0, Math.min(1, height))
  };
}

/**
 * Convert subboxes to YOLO format (6-field: class x y w h parent_tooth_class)
 * @param {Array} subboxes - Array of subbox objects with bbox, plaque_status, parent_category_id
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @returns {Array} - Array of YOLO annotation objects
 */
function convertSubboxesToYOLO(subboxes, imageWidth, imageHeight) {
  return subboxes.map(subbox => {
    const yoloCoords = convertBboxToYOLOFormat(subbox.bbox, imageWidth, imageHeight);
    
    // Get parent tooth YOLO class from category_id
    const parentToothClass = getCategoryYOLOClass(subbox.parent_category_id);
    
    // Convert plaque_status to class_id (0 = no_plaque, 1 = has_plaque)
    let class_id = 0;
    if (subbox.plaque_status === 'plaque' || subbox.plaque_status === 1 || subbox.plaque_status === true) {
      class_id = 1;
    } else if (subbox.plaque_status === 'no_plaque' || subbox.plaque_status === 0 || subbox.plaque_status === false) {
      class_id = 0;
    }
    
    return {
      class_id: class_id,
      x_center: yoloCoords.x_center,
      y_center: yoloCoords.y_center,
      width: yoloCoords.width,
      height: yoloCoords.height,
      parent_tooth_class: parentToothClass
    };
  });
}

/**
 * Format YOLO subbox annotations to text string (6-field format)
 * @param {Array} yoloSubboxes - Array of { class_id, x_center, y_center, width, height, parent_tooth_class }
 * @returns {string} - YOLO format text (one annotation per line)
 */
function formatYOLOSubboxText(yoloSubboxes) {
  return yoloSubboxes
    .map(ann => 
      `${ann.class_id} ${ann.x_center.toFixed(6)} ${ann.y_center.toFixed(6)} ${ann.width.toFixed(6)} ${ann.height.toFixed(6)} ${ann.parent_tooth_class}`
    )
    .join('\n');
}

/**
 * Validate YOLO coordinates are within bounds
 * @param {Object} yoloCoords - { x_center, y_center, width, height }
 * @returns {boolean} - true if valid, false otherwise
 */
function validateYOLOCoordinates(yoloCoords) {
  const { x_center, y_center, width, height } = yoloCoords;
  
  return (
    x_center >= 0 && x_center <= 1 &&
    y_center >= 0 && y_center <= 1 &&
    width >= 0 && width <= 1 &&
    height >= 0 && height <= 1 &&
    (x_center - width / 2) >= 0 &&
    (x_center + width / 2) <= 1 &&
    (y_center - height / 2) >= 0 &&
    (y_center + height / 2) <= 1
  );
}

module.exports = {
  splitCOCOByPatient,
  parseCOCOFile,
  matchFilenameToAnnotations,
  convertCOCOToYOLO,
  getCategoryYOLOClass,
  storeBatchAnnotations,
  formatYOLOText,
  validateAnnotationCount,
  convertBboxToYOLOFormat,
  convertSubboxesToYOLO,
  formatYOLOSubboxText,
  validateYOLOCoordinates
};
