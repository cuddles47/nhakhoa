/**
 * YOLO Import Service
 * Import dataset dạng YOLO từ disk vào hệ thống.
 *
 * Cấu trúc folder hỗ trợ:
 *   /path/to/patient_add_0001/
 *     images/patient_add_0001_G.jpg       (9 ảnh theo position)
 *     labels/patient_add_0001_G.txt       (cùng basename với ảnh)
 *
 *   hoặc thư mục base chứa nhiều patient_add_*:
 *   /path/base/
 *     patient_add_0001/{images,labels}
 *     patient_add_0002/{images,labels}
 *
 * Format label (đúng format hệ thống đang export):
 *   - 6 cột (plaque subbox): <class> <x_center> <y_center> <width> <height> <parent_tooth_class>
 *     class = 0 (no_plaque) | 1 (has_plaque), tọa độ normalized [0-1]
 *   - 5 cột (tooth detection): <class> <x_center> <y_center> <width> <height> (category = class)
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const storage = require('./storage');
const stainedValidator = require('./stainedImageValidator');

const REGION_NAMES = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];

/**
 * Đọc kích thước ảnh từ buffer (JPEG hoặc PNG).
 * Parse header trực tiếp, không cần thư viện ngoài.
 * @param {Buffer} buffer
 * @returns {{width:number, height:number}|null}
 */
function getImageDimensions(buffer) {
  if (!buffer || buffer.length < 24) return null;

  // PNG: signature (8 bytes) + IHDR length(4) + "IHDR"(4) + width(4) + height(4)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  // JPEG: scan các segment marker, tìm SOF (C0-CF trừ C4/C8/CC) để đọc height/width
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // Standalone markers không có length field
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const segLen = buffer.readUInt16BE(offset + 2);
      if (segLen < 2) return null;
      // SOF0-SOF15 (trừ DHT=C4, JPG=C8, DAC=CC)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7)
        };
      }
      offset += 2 + segLen;
    }
  }

  return null;
}

/**
 * Parse file label YOLO thành danh sách annotation.
 * @param {string} content
 * @returns {Array<{kind:'subbox'|'tooth', class_id:number, x_center:number, y_center:number, width:number, height:number, parent_tooth_class?:number, raw:string}>}
 */
function parseYoloLabel(content) {
  const results = [];
  const lines = String(content || '').split(/\r?\n/);

  for (const rawLines of lines) {
    const line = rawLines.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/).map(Number);
    if (parts.length < 5 || parts.some(v => !Number.isFinite(v))) continue;

    const [class_id, x_center, y_center, width, height, parent_tooth_class] = parts;

    if (parts.length >= 6) {
      results.push({ kind: 'subbox', class_id, x_center, y_center, width, height, parent_tooth_class, raw: rawLines });
    } else {
      results.push({ kind: 'tooth', class_id, x_center, y_center, width, height, raw: rawLines });
    }
  }

  return results;
}

/**
 * Convert tọa độ YOLO normalized sang COCO bbox [x, y, width, height] (pixels)
 * @param {{x_center:number, y_center:number, width:number, height:number}} yolo
 * @param {{width:number, height:number}} image
 */
function yoloToPixelBbox(yolo, image) {
  const clamp = (v, max) => Math.max(0, Math.min(max, Math.round(v)));

  const x = clamp((yolo.x_center - yolo.width / 2) * image.width, image.width);
  const y = clamp((yolo.y_center - yolo.height / 2) * image.height, image.height);
  const w = clamp(yolo.width * image.width, image.width - x);
  const h = clamp(yolo.height * image.height, image.height - y);

  return { x, y, w, h };
}

/**
 * Tên category cho răng dựa trên YOLO parent class.
 * Class 1-20 = răng, class 21 = brace (theo mapping export).
 * @param {number} classId
 * @returns {string}
 */
function toothCategoryName(classId) {
  if (classId === 21) return 'Brace';
  if (classId >= 1 && classId <= 20) return `tooth_${classId}`;
  return `class_${classId}`;
}

/**
 * Lấy patient id (4 chữ số) từ folder name dạng patient_add_XXXX
 * @param {string} folderName
 * @returns {string|null}
 */
function extractPatientIdFromFolder(folderName) {
  const match = folderName.match(/(?:patient[_-]add|patient|Patient)[_-]?(\d{4})/i);
  return match ? match[1] : null;
}

/**
 * Tìm patient đã tồn tại theo Patient ID (notes/name convention của hệ thống)
 * @param {any} client
 * @param {string} patientId 4-digit
 * @returns {Promise<Object|null>}
 */
async function findPatientByExternalId(client, patientId) {
  const result = await client.query(
    `SELECT * FROM patients
     WHERE deleted_at IS NULL AND (
       name = $1 OR
       notes ILIKE '%' || $2 || '%' OR
       notes ILIKE '%' || $3 || '%'
     )
     LIMIT 1`,
    [`Bệnh Nhân #${patientId}`, `ID:${patientId}`, `ID: ${patientId}`]
  );
  return result.rows[0] || null;
}

/**
 * Tạo or tìm patient, trả về patient row.
 * @param {any} client
 * @param {string} patientId 4-digit
 * @returns {Promise<Object>}
 */
async function getOrCreatePatient(client, patientId) {
  const existing = await findPatientByExternalId(client, patientId);
  if (existing) return existing;

  const result = await client.query(
    `INSERT INTO patients (name, phone, dob, gender, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [`Bệnh Nhân #${patientId}`, '', null, 'unknown', `Patient ID: ${patientId}`]
  );
  return result.rows[0];
}

/**
 * Insert một annotation row vào image_annotations
 * @param {any} client
 * @param {Object} data
 * @returns {Promise<Object>} row vừa insert
 */
async function insertAnnotation(client, data) {
  const result = await client.query(
    `INSERT INTO image_annotations
      (image_id, coco_image_id, category_id, category_name, bbox, area, source_type, parent_annotation_id, subbox_region, plaque_status)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.image_id,
      data.coco_image_id,
      data.category_id,
      data.category_name,
      JSON.stringify(data.bbox),
      data.area,
      data.source_type || 'doctor_upload',
      data.parent_annotation_id || null,
      data.subbox_region || null,
      data.plaque_status ?? null
    ]
  );
  return result.rows[0];
}

/**
 * Import một patient folder (cấu trúc patient_add_XXXX/{images,labels})
 * Mỗi folder chạy trong 1 transaction riêng.
 * @param {string} folderPath Đường dẫn folder patient
 * @returns {Promise<Object>} Thống kê import
 */
async function importPatientFolder(folderPath) {
  const imagesDir = path.join(folderPath, 'images');
  const labelsDir = path.join(folderPath, 'labels');

  if (!fs.existsSync(imagesDir) || !fs.statSync(imagesDir).isDirectory()) {
    throw new Error(`Folder thiếu thư mục images: ${imagesDir}`);
  }

  const folderName = path.basename(folderPath);
  const patientId = extractPatientIdFromFolder(folderName);
  if (!patientId) {
    throw new Error(`Không xác định được Patient ID từ folder name: ${folderName}`);
  }

  const fileRecords = [];
  for (const fileName of fs.readdirSync(imagesDir)) {
    if (fileName.startsWith('.')) continue; // bỏ ._* (AppleDouble), .DS_Store
    const fullPath = path.join(imagesDir, fileName);
    if (!fs.statSync(fullPath).isFile()) continue;
    fileRecords.push(fileName);
  }

  if (fileRecords.length === 0) {
    throw new Error(`Không có file ảnh thật nào trong ${imagesDir} (chỉ thấy file system meta nhé?)`);
  }

  const client = await pool.connect();
  const stats = {
    folder: folderPath,
    patientId,
    patient: null,
    visit: null,
    images: { total: fileRecords.length, imported: 0, skipped: 0, errors: [] },
    annotations: { total: 0, teeth: 0, subboxes: 0, imagesWithAnnotations: 0, skippedLines: 0 }
  };

  try {
    await client.query('BEGIN');

    const patient = await getOrCreatePatient(client, patientId);
    stats.patient = { id: patient.id, name: patient.name };

    const visit = await client.query(
      `INSERT INTO visits (patient_id, visit_date, status, notes, created_by)
       VALUES ($1, CURRENT_DATE, $2, $3, $4)
       RETURNING *`,
      [patient.id, 'completed', `YOLO import - Patient ID: ${patientId}`, null]
    );
    stats.visit = { id: visit.rows[0].id, visit_date: visit.rows[0].visit_date };

    for (const fileName of fileRecords) {
      const parsed = stainedValidator.parseStainedFilename(fileName);
      if (!parsed || parsed.patientIdNumber !== patientId) {
        stats.images.skipped++;
        stats.images.errors.push(`Không parse được filename (hoặc sai patient): ${fileName}`);
        continue;
      }

      const imagePath = path.join(imagesDir, fileName);
      let buffer;
      try {
        buffer = fs.readFileSync(imagePath);
      } catch (err) {
        stats.images.skipped++;
        stats.images.errors.push(`Đọc file lỗi: ${fileName} (${err.message})`);
        continue;
      }

      const dims = getImageDimensions(buffer);
      if (!dims) {
        stats.images.skipped++;
        stats.images.errors.push(`Không đọc được kích thước ảnh: ${fileName}`);
        continue;
      }

      const ext = path.extname(fileName).toLowerCase().replace('.', '') || 'jpg';
      const objectName = `visits/${visit.rows[0].id}/raw_${parsed.position.type}.${ext}`;
      const upload = await storage.uploadFile(objectName, buffer, `image/${ext === 'jpg' ? 'jpeg' : ext}`);

      if (!upload.success) {
        stats.images.skipped++;
        stats.images.errors.push(`Upload MinIO lỗi: ${fileName} (${upload.error})`);
        continue;
      }

      const image = await client.query(
        `INSERT INTO images
          (visit_id, url, image_category, image_type, image_index, validation_status, original_filename, width, height, has_annotations, annotation_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          visit.rows[0].id,
          upload.url,
          'raw',
          parsed.position.type,
          parsed.position.index,
          'pending',
          fileName,
          dims.width,
          dims.height,
          false,
          0
        ]
      );

      // Đọc label file cùng basename
      const baseName = path.parse(fileName).name;
      const labelPath = path.join(labelsDir, `${baseName}.txt`);
      let entries = [];
      if (fs.existsSync(labelPath) && fs.statSync(labelPath).isFile()) {
        const content = fs.readFileSync(labelPath, 'utf-8');
        entries = parseYoloLabel(content);
      }

      const imageRow = image.rows[0];
      const subboxList = entries.filter(e => e.kind === 'subbox');
      const toothList = entries.filter(e => e.kind === 'tooth');

      // Phân nhóm subbox theo parent_tooth_class để dựng parent tooth (union bbox)
      const parentsMap = new Map();
      for (const entry of subboxList) {
        const bbox = yoloToPixelBbox(entry, dims);
        if (bbox.w <= 0 || bbox.h <= 0) {
          stats.annotations.skippedLines++;
          continue;
        }
        if (!parentsMap.has(entry.parent_tooth_class)) parentsMap.set(entry.parent_tooth_class, []);
        parentsMap.get(entry.parent_tooth_class).push({ entry, bbox });
      }

      let imageSubboxCount = 0;
      const annotationsInserted = [];

      // Tooth-detection entries (5 field) → mỗi entry là một parent annotation độc lập
      if (toothList.length > 0 && subboxList.length === 0) {
        for (const entry of toothList) {
          const toothBbox = yoloToPixelBbox(entry, dims);
          if (toothBbox.w <= 0 || toothBbox.h <= 0) {
            stats.annotations.skippedLines++;
            continue;
          }
          const parent = await insertAnnotation(client, {
            image_id: imageRow.id,
            coco_image_id: imageRow.id,
            category_id: entry.class_id,
            category_name: toothCategoryName(entry.class_id),
            bbox: [toothBbox.x, toothBbox.y, toothBbox.w, toothBbox.h],
            area: toothBbox.w * toothBbox.h,
            source_type: 'doctor_upload'
          });
          stats.annotations.teeth++;
          annotationsInserted.push(parent);
        }
      }

      // Plaque subboxes → parent tooth (union) + subbox children
      for (const [parentClass, subboxRows] of parentsMap.entries()) {
        const minX = Math.min(...subboxRows.map(r => r.bbox.x));
        const minY = Math.min(...subboxRows.map(r => r.bbox.y));
        const maxX = Math.max(...subboxRows.map(r => r.bbox.x + r.bbox.w));
        const maxY = Math.max(...subboxRows.map(r => r.bbox.y + r.bbox.h));
        const parentBbox = [minX, minY, maxX - minX, maxY - minY];

        if (parentBbox[2] <= 0 || parentBbox[3] <= 0) {
          stats.annotations.skippedLines += subboxRows.length;
          continue;
        }

        const parent = await insertAnnotation(client, {
          image_id: imageRow.id,
          coco_image_id: imageRow.id,
          category_id: parentClass,
          category_name: toothCategoryName(parentClass),
          bbox: parentBbox,
          area: parentBbox[2] * parentBbox[3],
          source_type: 'doctor_upload'
        });
        stats.annotations.teeth++;
        annotationsInserted.push(parent);

        const subboxInserts = subboxRows.map((row, regionIdx) => {
          const region = REGION_NAMES[regionIdx % REGION_NAMES.length];
          return insertAnnotation(client, {
            image_id: imageRow.id,
            coco_image_id: imageRow.id,
            category_id: row.entry.class_id,
            category_name: region,
            bbox: [row.bbox.x, row.bbox.y, row.bbox.w, row.bbox.h],
            area: row.bbox.w * row.bbox.h,
            parent_annotation_id: parent.id,
            subbox_region: region,
            source_type: 'doctor_upload',
            plaque_status: row.entry.class_id
          });
        });
        const inserted = await Promise.all(subboxInserts);
        annotationsInserted.push(...inserted);
      }

      imageSubboxCount = annotationsInserted.length;
      stats.annotations.subboxes += imageSubboxCount;
      stats.annotations.total += imageSubboxCount;

      if (imageSubboxCount > 0) {
        await client.query(
          'UPDATE images SET has_annotations = true, annotation_count = $1 WHERE id = $2',
          [imageSubboxCount, imageRow.id]
        );
        stats.annotations.imagesWithAnnotations++;
      }

      stats.images.imported++;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    stats.error = err.message;
    throw err;
  } finally {
    client.release();
  }

  return stats;
}

/**
 * Import toàn bộ các folder patient_add_* trong thư mục base.
 * Nếu sourcePath trỏ thẳng tới một folder patient thì import folder đó.
 * @param {string} sourcePath
 * @returns {Promise<Array<Object>>} Mảng kết quả từng patient
 */
async function importSourcePath(sourcePath) {
  const resolved = path.resolve(sourcePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Đường dẫn không tồn tại: ${resolved}`);
  }

  const stat = fs.statSync(resolved);
  const results = [];

  if (stat.isFile()) {
    throw new Error(`Đường dẫn phải là folder, nhận file: ${resolved}`);
  }

  // Trường hợp sourcePath là chính folder patient (có images/ bên trong)
  if (extractPatientIdFromFolder(path.basename(resolved)) && fs.existsSync(path.join(resolved, 'images'))) {
    results.push(await importPatientFolder(resolved));
    return results;
  }

  // Ngược lại, duyệt các sub-folder patient_add_*
  const patientFolders = fs.readdirSync(resolved)
    .filter(name => extractPatientIdFromFolder(name) && fs.statSync(path.join(resolved, name)).isDirectory())
    .sort();

  if (patientFolders.length === 0) {
    throw new Error(`Không tìm thấy folder patient_add_XXXX nào trong: ${resolved}`);
  }

  for (const folderName of patientFolders) {
    results.push(await importPatientFolder(path.join(resolved, folderName)));
  }

  return results;
}

module.exports = {
  getImageDimensions,
  parseYoloLabel,
  yoloToPixelBbox,
  toothCategoryName,
  importPatientFolder,
  importSourcePath
};