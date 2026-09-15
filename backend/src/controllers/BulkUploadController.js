const { Patient, Visit, Image, Annotation } = require('../models');
const storage = require('../services/storage');
const { uploadFiles } = storage;
const db = require('../services/database');
const annotationService = require('../services/annotationService');
const stainedValidator = require('../services/stainedImageValidator');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { extractZipToDir, listFilesRecursively, cleanupDir } = require('../utils/zipHandler');

class BulkUploadController {
    /**
     * Bulk upload images with automatic patient/visit creation
     * Request body should be multipart/form-data with:
     * - images: array of image files
     * - metadata: JSON string with parsed filename data
     */
    async bulkUpload(req, res) {
        const { pool } = require('../config/database');
        const client = await pool.connect();
        
        try {
            // Parse metadata
            const metadata = JSON.parse(req.body.metadata || '[]');
            
            // When using upload.any(), req.files is an array
            // When using upload.fields(), req.files is an object with field names as keys
            // Support both formats for flexibility
            let imageFiles = [];
            let annotationFile = null;
            const archiveFiles = [];

            if (Array.isArray(req.files)) {
                // upload.any() format - req.files is an array
                for (const file of req.files) {
                    if (file.fieldname === 'images') {
                        imageFiles.push(file);
                    } else if (file.fieldname === 'annotationFile') {
                        annotationFile = file;
                    } else if (file.fieldname === 'archive') {
                        archiveFiles.push(file);
                    }
                }
            } else if (req.files) {
                // upload.fields() format - req.files is an object
                imageFiles = req.files.images || [];
                const annotationFiles = req.files.annotationFile || [];
                annotationFile = annotationFiles[0];
                archiveFiles.push(...(req.files.archive || []));
            }

            // If an archive (zip) was uploaded, extract it to disk and add files to `imageFiles` (use disk paths to avoid memory pressure)
            const path = require('path');
            const fs = require('fs');
            const { extractZipToDir, listFilesRecursively, cleanupDir } = require('../utils/zipHandler');
            let extractedDir = null;

            if (archiveFiles.length > 0) {
                const archive = archiveFiles[0];
                const archivePath = archive.path || (archive.destination && archive.filename ? path.join(archive.destination, archive.filename) : null);
                if (!archivePath || !fs.existsSync(archivePath)) {
                    return res.status(400).json({ success: false, error: 'Archive not found on disk' });
                }

                // Extract archive
                extractedDir = path.join(process.env.UPLOAD_DIR || '/tmp/uploads', `bulk_extract_${Date.now()}`);

                try {
                    const extracted = await extractZipToDir(archivePath, extractedDir);

                    // If an annotations.json is inside the archive, prefer that as the annotation file
                    for (const e of extracted) {
                        const base = path.basename(e.name).toLowerCase();
                        if (!annotationFile && (base === 'annotations.json' || base.endsWith('.json') && base.includes('coco'))) {
                            try {
                                annotationFile = { buffer: fs.readFileSync(e.path) };
                                console.log('Found annotation file inside archive:', e.name);
                                continue; // don't add annotation json as an image
                            } catch (err) {
                                console.warn('Failed to read annotation file from archive:', err.message);
                            }
                        }

                        // Add extracted file as a "file-like" object with path so storage.uploadFile can fPutObject
                        imageFiles.push({ originalname: path.basename(e.name), path: e.path });
                    }

                    console.log(`Extracted ${extracted.length} files from archive to ${extractedDir}`);
                } catch (err) {
                    await cleanupDir(extractedDir);
                    return res.status(400).json({ success: false, error: `Failed to extract archive: ${err.message}` });
                }
            }

            if (!annotationFile) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Annotation file is required' 
                });
            }

            if (!metadata || metadata.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No metadata provided' 
                });
            }

            if (!imageFiles || imageFiles.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No image files uploaded' 
                });
            }

            // Parse COCO annotation file and split by patient
            let cocoByPatient = {}; // Split COCO files by patient
            try {
                // Split COCO file by patient first
                cocoByPatient = annotationService.splitCOCOByPatient(annotationFile.buffer);
                console.log('Successfully split COCO file. Found patients:', Object.keys(cocoByPatient));
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: `Failed to parse annotation file: ${error.message}`
                });
            }

            // Start transaction
            await client.query('BEGIN');

            let patientsCreated = 0;
            let visitsCreated = 0;
            let imagesCreated = 0;
            let annotationsCreated = 0;
            const createdPatients = [];
            const createdVisits = [];
            const createdImages = [];
            const imagesWithoutAnnotations = [];

            // Process each patient/visit group
            for (const group of metadata) {
                const { patientId, visitDate, images: imageInfos, patientMapping } = group;

                let patient;

                // 1. Handle patient based on mapping
                if (patientMapping) {
                    if (patientMapping.type === 'existing') {
                        // Use existing patient
                        patient = patientMapping.patient;
                    } else if (patientMapping.type === 'new') {
                        // Create new patient with provided information
                        patient = await Patient.create({
                            name: patientMapping.patient.name,
                            phone: patientMapping.patient.phone || '',
                            dob: patientMapping.patient.dob || null,
                            gender: patientMapping.patient.gender || 'unknown',
                            notes: patientMapping.patient.notes || `Patient ID: ${patientId}`
                        });
                        patientsCreated++;
                        createdPatients.push(patient);
                    }
                } else {
                    // Fallback: Check if patient exists by patient_id
                    let existingPatient = await Patient.findAll({ search: `ID:${patientId}`, limit: 1 });
                    
                    if (!existingPatient || existingPatient.data.length === 0) {
                        // Create new patient
                        patient = await Patient.create({
                            name: `Bệnh Nhân #${patientId}`,
                            phone: '',
                            dob: null,
                            gender: 'unknown',
                            notes: `Patient ID: ${patientId}`
                        });
                        patientsCreated++;
                        createdPatients.push(patient);
                    } else {
                        patient = existingPatient.data[0];
                    }
                }

                // 2. Create visit for this date
                const visit = await Visit.create({
                    patient_id: patient.id,
                    visit_date: visitDate,
                    diagnosis: 'Khám chỉnh nha định kỳ',
                    notes: `Bulk upload - Patient ID: ${patientId}`,
                    status: 'completed'
                });
                visitsCreated++;
                createdVisits.push(visit);

                // 2.5. Upload patient-specific COCO file to MinIO and store URL
                // The cocoByPatient keys are like 'Patient_0062', but patientId is just '0062'
                const patientKey = `Patient_${patientId}`;
                const patientCOCO = cocoByPatient[patientKey];
                if (patientCOCO) {
                    try {
                        const cocoJSON = JSON.stringify(patientCOCO, null, 2);
                        const cocoObjectName = `visits/${visit.id}/annotations.json`;
                        
                        // Upload COCO file to MinIO
                        const cocoUploadResult = await storage.uploadFile(
                            cocoObjectName,
                            Buffer.from(cocoJSON, 'utf-8'),
                            'application/json'
                        );
                        
                        // Update visit with annotation file URL
                        if (cocoUploadResult.url) {
                            await client.query(
                                'UPDATE visits SET annotation_file_url = $1 WHERE id = $2',
                                [cocoUploadResult.url, visit.id]
                            );
                            console.log(`Stored COCO file for ${patientId} at ${cocoObjectName}`);
                        }
                    } catch (error) {
                        console.error(`Failed to upload COCO file for ${patientId}:`, error.message);
                    }
                }

                // 2.6. Parse patient-specific COCO for image matching
                let imageMap, annotationsByImage, categoryMap;
                if (patientCOCO) {
                    try {
                        const parsed = annotationService.parseCOCOFile(Buffer.from(JSON.stringify(patientCOCO)));
                        imageMap = parsed.imageMap;
                        annotationsByImage = parsed.annotationsByImage;
                        categoryMap = parsed.categoryMap;
                        console.log(`[${patientId}] Parsed COCO: ${Object.keys(imageMap).length} images, ${Object.keys(annotationsByImage).length} annotation groups`);
                        console.log(`[${patientId}] COCO image keys:`, Object.keys(imageMap).slice(0, 3));
                    } catch (error) {
                        console.error(`Failed to parse patient COCO for ${patientId}:`, error.message);
                        imageMap = {};
                        annotationsByImage = {};
                        categoryMap = {};
                    }
                } else {
                    console.warn(`No COCO data found for patient ${patientId}`);
                    imageMap = {};
                    annotationsByImage = {};
                    categoryMap = {};
                }

                // 3. Upload images to MinIO and create image records
                const filesToUpload = [];
                
                for (const imageInfo of imageInfos) {
                    // Find matching file
                    const file = imageFiles.find(f => f.originalname === imageInfo.filename);
                    
                    if (!file) {
                        console.warn(`File not found: ${imageInfo.filename}`);
                        continue;
                    }

                    // Determine category from position (you can customize this logic)
                    const imageCategory = imageInfo.position.includes('raw') ? 'raw' : 
                                         imageInfo.position.includes('stained') ? 'stained' : 'raw';

                    // Generate MinIO object name
                    const objectName = `visits/${visit.id}/${imageCategory}_${imageInfo.position}.${imageInfo.ext}`;

                    filesToUpload.push({
                        objectName,
                        source: file.buffer || file.path,
                        originalName: file.originalname,
                        imageInfo,
                        imageCategory
                    });
                }

                // Upload all files for this visit
                const uploadResults = await uploadFiles(filesToUpload);

                // Create image records and match annotations
                for (let i = 0; i < uploadResults.length; i++) {
                    const uploadResult = uploadResults[i];
                    const fileInfo = filesToUpload[i];

                    if (!uploadResult.success) {
                        console.error(`Failed to upload ${uploadResult.originalName}:`, uploadResult.error);
                        continue;
                    }

                    // Match annotation data
                    const matchedImage = annotationService.matchFilenameToAnnotations(
                        uploadResult.originalName,
                        imageMap
                    );

                    console.log(`[${visit.id}] Matching ${uploadResult.originalName}: ${matchedImage ? 'FOUND (coco_id=' + matchedImage.coco_id + ')' : 'NOT FOUND'}`);

                    // Truncate long values to fit VARCHAR constraints
                    // Map position to index (1-9)
                    const positionIndexMap = {
                        'upper_right': 1, 'upper_center': 2, 'upper_left': 3,
                        'middle_right': 4, 'middle_center': 5, 'middle_left': 6,
                        'lower_right': 7, 'lower_center': 8, 'lower_left': 9
                    };
                    const imageIndex = positionIndexMap[fileInfo.imageInfo.position] || null;
                    
                    const imageData = {
                        visit_id: visit.id,
                        url: uploadResult.url, // VARCHAR(255) - Changed from url_minio to url
                        original_filename: uploadResult.originalName, // NEW: Store original filename
                        image_category: fileInfo.imageCategory, // VARCHAR(20)
                        image_type: fileInfo.imageInfo.position.substring(0, 50), // VARCHAR(50) - truncate
                        image_index: imageIndex, // Set proper index based on position
                        validation_status: 'pending', // VARCHAR(20)
                        notes: `Bulk upload: ${uploadResult.originalName}`, // TEXT - no limit
                        width: matchedImage ? matchedImage.width : null, // NEW: Store image dimensions
                        height: matchedImage ? matchedImage.height : null,
                        has_annotations: false, // Will be updated if annotations found
                        annotation_count: 0
                    };

                    const image = await Image.create(imageData);
                    imagesCreated++;
                    createdImages.push(image);

                    // Store annotations if matched
                    if (matchedImage) {
                        const cocoImageId = matchedImage.coco_id;
                        const imageAnnotations = annotationsByImage[cocoImageId] || [];

                        if (imageAnnotations.length > 0) {
                            // Prepare annotation records
                            const annotationsToStore = imageAnnotations.map(ann => ({
                                image_id: image.id,
                                coco_image_id: cocoImageId,
                                category_id: ann.category_id,
                                category_name: ann.category_name,
                                bbox: ann.bbox,
                                area: ann.area
                            }));

                            // Store annotations
                            await annotationService.storeBatchAnnotations(client, annotationsToStore);

                            // Update image record with annotation info
                            await client.query(
                                'UPDATE images SET has_annotations = true, annotation_count = $1 WHERE id = $2',
                                [imageAnnotations.length, image.id]
                            );

                            annotationsCreated += imageAnnotations.length;
                        } else {
                            imagesWithoutAnnotations.push(uploadResult.originalName);
                        }
                    } else {
                        // No match found in COCO file
                        imagesWithoutAnnotations.push(uploadResult.originalName);
                    }
                }
            }

            // Commit transaction
            await client.query('COMMIT');

            // Build detailed patient summary
            const patientSummary = createdPatients.map((patient, idx) => ({
                id: patient.id,
                name: patient.name,
                patientId: metadata[idx]?.patientId,
                type: metadata[idx]?.patientMapping?.type,
                imagesCount: createdVisits[idx] ? 
                    createdImages.filter(img => img.visit_id === createdVisits[idx].id).length : 0
            }));

            // Build success message
            const summaryParts = [];
            if (patientsCreated > 0) summaryParts.push(`${patientsCreated} bệnh nhân mới`);
            if (visitsCreated > 0) summaryParts.push(`${visitsCreated} lần khám`);
            if (imagesCreated > 0) summaryParts.push(`${imagesCreated} ảnh`);
            if (annotationsCreated > 0) summaryParts.push(`${annotationsCreated} annotations`);
            
            const successMessage = `Upload thành công: ${summaryParts.join(', ')}`;

            res.status(201).json({
                success: true,
                message: successMessage,
                data: {
                    patientsCreated,
                    visitsCreated,
                    imagesCreated,
                    annotationsCreated,
                    imagesWithoutAnnotations: imagesWithoutAnnotations.length > 0 ? imagesWithoutAnnotations : undefined,
                    patientSummary,
                    patients: createdPatients,
                    visits: createdVisits,
                    images: createdImages
                }
            });

        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            console.error('Bulk upload error:', error);
            
            // Provide more detailed error message
            let errorMessage = 'Upload thất bại';
            if (error.message.includes('annotation')) {
                errorMessage = `Lỗi xử lý annotations: ${error.message}`;
            } else if (error.message.includes('patient')) {
                errorMessage = `Lỗi tạo bệnh nhân: ${error.message}`;
            } else if (error.message.includes('visit')) {
                errorMessage = `Lỗi tạo lần khám: ${error.message}`;
            } else if (error.message.includes('upload') || error.message.includes('storage')) {
                errorMessage = `Lỗi upload ảnh: ${error.message}`;
            } else {
                errorMessage = error.message || 'Lỗi không xác định';
            }
            
            res.status(500).json({ 
                success: false, 
                error: errorMessage
            });
        } finally {
            // Clean up extracted archive files if any
            try {
                if (typeof extractedDir !== 'undefined' && extractedDir) {
                    const { cleanupDir } = require('../utils/zipHandler');
                    await cleanupDir(extractedDir);
                    console.log('Cleaned up extracted dir:', extractedDir);
                }
            } catch (cleanupErr) {
                console.warn('Error cleaning up extracted files:', cleanupErr.message);
            }

            client.release();
        }
    }

    /**
     * Get upload status/history
     */
    async getUploadHistory(req, res) {
        try {
            // Get recent bulk uploads (visits with bulk upload notes)
            const { Pool } = require('pg');
            const config = require('../config/database');
            const pool = new Pool(config);
            const result = await pool.query(
                `SELECT v.*, p.name as patient_name, 
                        COUNT(i.id) as image_count
                 FROM visits v
                 JOIN patients p ON v.patient_id = p.id
                 LEFT JOIN images i ON v.id = i.visit_id
                 WHERE v.notes LIKE '%Bulk upload%'
                 GROUP BY v.id, p.name
                 ORDER BY v.created_at DESC
                 LIMIT 50`
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching upload history:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Confirm a bulk upload where clients uploaded files directly to MinIO using presigned URLs
     * Body: {
     *   metadata: [ { patientId, visitDate, images: [{ filename, position, ext }], patientMapping } ],
     *   files: [ { objectName, originalName, contentType } ],
     *   annotationObjectName: 'bucket/path/to/annotations.json' (or relative 'visits/.../annotations.json')
     * }
     */
    async confirmUpload(req, res) {
        const { pool } = require('../config/database');
        const client = await pool.connect();

        try {
            const { metadata } = req.body;
            const files = req.body.files || [];
            const annotationObjectName = req.body.annotationObjectName;
            const uploadMode = req.body.uploadMode || 'raw';

            // For stained uploads, annotation file is not required
            if (!annotationObjectName && uploadMode !== 'stained') {
                return res.status(400).json({ success: false, error: 'annotationObjectName is required for raw image uploads' });
            }

            if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
                return res.status(400).json({ success: false, error: 'No metadata provided' });
            }

            if (!files || files.length === 0) {
                return res.status(400).json({ success: false, error: 'No files provided. Use presigned upload then confirm.' });
            }

            // For stained image uploads, we don't need COCO annotations
            let cocoByPatient = {};
            if (uploadMode === 'raw' && annotationObjectName) {
                // Ensure annotation object exists in MinIO
                const storage = require('../services/storage');
                const annotationExists = await storage.objectExists(annotationObjectName);
                if (!annotationExists) {
                    return res.status(400).json({ success: false, error: 'Annotation file not found in object store. Please include annotations.json in the uploaded folder.' });
                }

                // Download annotation file from MinIO
                let annotationBuffer;
                try {
                    annotationBuffer = await storage.downloadFile(annotationObjectName);
                } catch (err) {
                    return res.status(400).json({ success: false, error: 'Failed to download annotation file from object store' });
                }

                // Parse COCO and split by patient
                try {
                    cocoByPatient = require('../services/annotationService').splitCOCOByPatient(annotationBuffer);
                } catch (err) {
                    return res.status(400).json({ success: false, error: `Failed to parse annotation file: ${err.message}` });
                }
            }

            // Start transaction
            await client.query('BEGIN');

            let patientsCreated = 0;
            let visitsCreated = 0;
            let imagesCreated = 0;
            let annotationsCreated = 0;
            const createdPatients = [];
            const createdVisits = [];
            const createdImages = [];
            const imagesWithoutAnnotations = [];

            // Helper to resolve file object by filename, with preference for stained images
            const findFileObject = (filename, preferredCategory = null) => {
                // If preferring stained, look for files with /stained/ in the objectName first
                if (preferredCategory === 'stained') {
                    const stainedMatch = files.find(f => 
                        (f.originalName === filename || f.originalname === filename) && 
                        f.objectName && f.objectName.includes('/stained/')
                    );
                    if (stainedMatch) return stainedMatch;
                    
                    // Also try suffix matching for stained
                    const stainedSuffix = files.find(f => 
                        f.objectName && f.objectName.includes('/stained/') && 
                        f.objectName.endsWith(`/${filename}`)
                    );
                    if (stainedSuffix) return stainedSuffix;
                }
                
                // Default: exact name match first
                const direct = files.find(f => f.originalName === filename || f.originalname === filename);
                if (direct) return direct;
                
                // Fallback: suffix match (for raw files)
                return files.find(f => f.objectName && f.objectName.endsWith(`/${filename}`) && !f.objectName.includes('/stained/'));
            };

            for (const group of metadata) {
                const { patientId, visitDate, images: imageInfos, patientMapping } = group;

                let patient, visit;

                if (uploadMode === 'stained') {
                    // For stained images, find existing patient and visit
                    const existingPatients = await require('../models/Patient').findAll({ search: `ID:${patientId}`, limit: 1 });
                    if (!existingPatients || existingPatients.data.length === 0) {
                        console.warn(`No existing patient found for ID: ${patientId}, skipping stained images for this patient`);
                        continue;
                    }
                    patient = existingPatients.data[0];

                    // Find existing visit for this date
                    const existingVisits = await require('../models/Visit').findAll({ 
                        where: { patient_id: patient.id },
                        limit: 100
                    });
                    
                    const matchingVisit = existingVisits.data.find(v => {
                        const vDate = new Date(v.visit_date).toISOString().split('T')[0];
                        const targetDate = new Date(visitDate).toISOString().split('T')[0];
                        return vDate === targetDate;
                    });

                    if (!matchingVisit) {
                        console.warn(`No existing visit found for patient ${patientId} on ${visitDate}, skipping stained images`);
                        continue;
                    }
                    visit = matchingVisit;
                } else {
                    // For raw images, handle patient creation/lookup as before
                    if (patientMapping) {
                        if (patientMapping.type === 'existing') {
                            patient = patientMapping.patient;
                        } else if (patientMapping.type === 'new') {
                            patient = await require('../models/Patient').create({
                                name: patientMapping.patient.name,
                                phone: patientMapping.patient.phone || '',
                                dob: patientMapping.patient.dob || null,
                                gender: patientMapping.patient.gender || 'unknown',
                                notes: patientMapping.patient.notes || `Patient ID: ${patientId}`
                            });
                            patientsCreated++;
                            createdPatients.push(patient);
                        }
                    } else {
                        let existingPatient = await require('../models/Patient').findAll({ search: `ID:${patientId}`, limit: 1 });
                        if (!existingPatient || existingPatient.data.length === 0) {
                            patient = await require('../models/Patient').create({
                                name: `Bệnh Nhân #${patientId}`,
                                phone: '',
                                dob: null,
                                gender: 'unknown',
                                notes: `Patient ID: ${patientId}`
                            });
                            patientsCreated++;
                            createdPatients.push(patient);
                        } else {
                            patient = existingPatient.data[0];
                        }
                    }

                    // Create visit for raw images
                    visit = await require('../models/Visit').create({
                        patient_id: patient.id,
                        visit_date: visitDate,
                        diagnosis: 'Khám chỉnh nha định kỳ',
                        notes: `Bulk upload - Patient ID: ${patientId}`,
                        status: 'completed'
                    });
                    visitsCreated++;
                    createdVisits.push(visit);
                }

                // Upload or link patient-specific COCO if exists in parsed cocoByPatient (only for raw uploads)
                const patientKey = `Patient_${patientId}`;
                const patientCOCO = uploadMode === 'raw' ? cocoByPatient[patientKey] : null;
                
                if (uploadMode === 'raw' && patientCOCO) {
                    try {
                        // Use storage.ensureUploadByHash to avoid duplicate uploads
                        const cocoJSON = JSON.stringify(patientCOCO, null, 2);
                        const cocoBuffer = Buffer.from(cocoJSON, 'utf-8');
                        const uploadRes = await storage.ensureUploadByHash(cocoBuffer, `visits/${visit.id}/annotations`, 'json', 'application/json');

                        if (uploadRes.success && uploadRes.objectName) {
                            await client.query(
                                'UPDATE visits SET annotation_file_url = $1 WHERE id = $2',
                                [`/${process.env.MINIO_BUCKET}/${uploadRes.objectName}`, visit.id]
                            );
                            console.log(`Stored COCO file for ${patientId} at ${uploadRes.objectName}`);
                        }
                    } catch (error) {
                        console.error(`Failed to upload COCO for ${patientId}:`, error.message);
                    }
                }

                // Parse per-patient COCO into imageMap and annotationsByImage if available (only for raw uploads)
                let imageMap = {}, annotationsByImage = {}, categoryMap = {};
                if (uploadMode === 'raw' && patientCOCO) {
                    try {
                        const parsed = require('../services/annotationService').parseCOCOFile(Buffer.from(JSON.stringify(patientCOCO)));
                        imageMap = parsed.imageMap;
                        annotationsByImage = parsed.annotationsByImage;
                        categoryMap = parsed.categoryMap;
                    } catch (error) {
                        console.error(`Failed to parse patient COCO for ${patientId}:`, error.message);
                    }
                }

                // Helper function to create image record
                async function createImageRecord(fileObj, imageInfo, visit, category, imageMap, annotationsByImage) {
                    // Build MinIO URL
                    const objectName = fileObj.objectName || fileObj.objectname || fileObj.path || fileObj.key;
                    const url = objectName.startsWith('/') ? objectName : `/${process.env.MINIO_BUCKET}/${objectName}`;
    
                    const imageData = {
                        visit_id: visit.id,
                        url: url,
                        original_filename: fileObj.originalName || fileObj.originalname || imageInfo.filename,
                        image_category: category,
                        image_type: imageInfo.position.substring(0, 50),
                        image_index: null,
                        validation_status: 'pending',
                        notes: `Bulk upload: ${fileObj.originalName || imageInfo.filename} (${category})`,
                        width: null,
                        height: null,
                        has_annotations: false,
                        annotation_count: 0
                    };
    
                    const image = await require('../models/Image').create(imageData);
                    imagesCreated++;
                    createdImages.push(image);
    
                    // Only match annotations for raw images (stained images are just for viewing)
                    if (category === 'raw') {
                        const matchedImage = require('../services/annotationService').matchFilenameToAnnotations(fileObj.originalName || imageInfo.filename, imageMap);
    
                        if (matchedImage) {
                            const cocoImageId = matchedImage.coco_id;
                            const imageAnnotations = annotationsByImage[cocoImageId] || [];
    
                            if (imageAnnotations.length > 0) {
                                const annotationsToStore = imageAnnotations.map(ann => ({
                                    image_id: image.id,
                                    coco_image_id: cocoImageId,
                                    category_id: ann.category_id,
                                    category_name: ann.category_name,
                                    bbox: ann.bbox,
                                    area: ann.area
                                }));
    
                                await require('../services/annotationService').storeBatchAnnotations(client, annotationsToStore);
    
                                await client.query(
                                    'UPDATE images SET has_annotations = true, annotation_count = $1 WHERE id = $2',
                                    [imageAnnotations.length, image.id]
                                );
    
                                annotationsCreated += imageAnnotations.length;
                            } else {
                                imagesWithoutAnnotations.push(fileObj.originalName || imageInfo.filename);
                            }
                        } else {
                            imagesWithoutAnnotations.push(fileObj.originalName || imageInfo.filename);
                        }
                    }
                }

                // For each image info, find matching uploaded objects and create Image records
                const imageCategory = uploadMode === 'stained' ? 'stained' : 'raw';
                
                for (const imageInfo of imageInfos) {
                    const fileObj = findFileObject(imageInfo.filename, uploadMode === 'stained' ? 'stained' : 'raw');
                    if (fileObj) {
                        await createImageRecord(fileObj, imageInfo, visit, imageCategory, imageMap, annotationsByImage);
                    } else {
                        console.warn(`${imageCategory} file not found in uploaded objects: ${imageInfo.filename}`);
                    }
                }
            }
    
            // Commit
            await client.query('COMMIT');
    
            res.status(201).json({
                success: true,
                message: uploadMode === 'stained' 
                    ? 'Stained images uploaded and mapped successfully'
                    : 'Bulk upload (confirm) completed successfully',
                data: {
                    patientsCreated,
                    visitsCreated,
                    imagesCreated,
                    annotationsCreated,
                    uploadMode,
                    imagesWithoutAnnotations: imagesWithoutAnnotations.length > 0 ? imagesWithoutAnnotations : undefined,
                    patients: createdPatients,
                    visits: createdVisits,
                    images: createdImages
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Confirm bulk upload error:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            client.release();
        }
    }

    /**
     * Generate presigned PUT URLs so clients can upload directly to MinIO
     * Expects JSON body: { files: [{ objectName, contentType }] }
     */
    async generatePresignedUrls(req, res) {
        try {
            const files = req.body.files || [];
            if (!Array.isArray(files) || files.length === 0) {
                return res.status(400).json({ success: false, error: 'files array is required' });
            }

            const urls = [];
            for (const f of files) {
                const objectName = f.objectName;
                const expiry = f.expirySeconds || 3600;
                const presigned = await storage.getPresignedPutUrl(objectName, expiry);
                if (!presigned.success) {
                    urls.push({ objectName, success: false, error: presigned.error });
                } else {
                    urls.push({ objectName, success: true, url: presigned.url });
                }
            }

            res.json({ success: true, data: urls });
        } catch (error) {
            console.error('Error generating presigned URLs:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Upload stained images for an existing visit (or create new visit if not exists)
     * Simpler flow than bulk upload - no annotations, just position matching
     * Supports chunked upload with progress
     * POST /api/bulk-upload/stained
     * Body (multipart): { visitId OR (patientId + visitDate), images[] }
     */
    async uploadStainedImages(req, res) {
        const { pool } = require('../config/database');
        const client = await pool.connect();
        
        try {
            let visitId = req.body.visitId;
            const patientId = req.body.patientId;
            const visitDate = req.body.visitDate;
            
            // If visitId not provided, try to find or create visit
            if (!visitId && patientId && visitDate) {
                // Find existing visit by patient + date
                const visitQuery = `
                    SELECT id FROM visits 
                    WHERE patient_id = $1 
                    AND DATE(visit_date) = DATE($2)
                    AND deleted_at IS NULL
                    LIMIT 1
                `;
                const visitResult = await client.query(visitQuery, [patientId, visitDate]);
                
                if (visitResult.rows.length > 0) {
                    visitId = visitResult.rows[0].id;
                } else {
                    // Create new visit
                    const createVisitQuery = `
                        INSERT INTO visits (patient_id, visit_date, status, notes)
                        VALUES ($1, $2, 'pending', 'Tạo từ bulk upload ảnh nhuộm')
                        RETURNING id
                    `;
                    const newVisitResult = await client.query(createVisitQuery, [patientId, visitDate]);
                    visitId = newVisitResult.rows[0].id;
                }
            }
            
            if (!visitId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'visitId hoặc (patientId + visitDate) là bắt buộc' 
                });
            }
            
            // Get uploaded files (multer array puts files directly in req.files)
            const imageFiles = req.files || [];
            
            if (!imageFiles || imageFiles.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No image files uploaded' 
                });
            }
            
            // Validate batch
            const validation = await stainedValidator.validateStainedImageBatch(visitId, imageFiles);
            
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.errors.join('. '),
                    details: validation
                });
            }
            
            // Map images to positions (handle duplicates)
            const { byPosition } = stainedValidator.mapImagesToPositions(validation.parsedImages);
            
            await client.query('BEGIN');
            
            let imagesCreated = 0;
            let imagesReplaced = 0;
            const createdImages = [];
            
            // Process each position
            for (const [positionType, imageData] of Object.entries(byPosition)) {
                const position = stainedValidator.STANDARD_POSITIONS.find(p => p.type === positionType);
                
                // Check if stained image exists for this position
                const existingQuery = `
                    SELECT id, url FROM images 
                    WHERE visit_id = $1 
                    AND image_category = 'stained' 
                    AND image_type = $2
                    AND deleted_at IS NULL
                `;
                const existingResult = await client.query(existingQuery, [visitId, positionType]);
                
                // Upload to MinIO
                const file = imageData.file;
                const timestamp = Date.now();
                const ext = file.mimetype.split('/')[1] || 'jpg';
                const objectName = `visits/${visitId}/stained_${positionType}_${timestamp}.${ext}`;
                
                const uploadResult = await storage.uploadFile(
                    objectName,
                    file.buffer,
                    {
                        'Content-Type': file.mimetype,
                        'Content-Length': file.size
                    }
                );
                
                if (!uploadResult.success) {
                    throw new Error(`Failed to upload to MinIO: ${uploadResult.error}`);
                }
                
                const url = uploadResult.url;
                
                if (existingResult.rows.length > 0) {
                    // Replace existing image
                    const existingImage = existingResult.rows[0];
                    
                    // Update database record
                    const updateQuery = `
                        UPDATE images 
                        SET url = $1,
                            original_filename = $2,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $3
                        RETURNING *
                    `;
                    const updateResult = await client.query(updateQuery, [
                        url,
                        file.originalname,
                        existingImage.id
                    ]);
                    
                    createdImages.push(updateResult.rows[0]);
                    imagesReplaced++;
                    
                    // TODO: Delete old image from MinIO
                    // const oldObjectName = existingImage.url.replace(/^\/[^/]+\//, '');
                    // await storage.deleteFile(oldObjectName);
                } else {
                    // Create new image record
                    const insertQuery = `
                        INSERT INTO images (
                            visit_id, url, image_category, image_type, image_index,
                            validation_status, original_filename, has_annotations, annotation_count
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        RETURNING *
                    `;
                    const insertResult = await client.query(insertQuery, [
                        visitId,
                        url,
                        'stained',
                        positionType,
                        position?.index || null,
                        'pending',
                        file.originalname,
                        false,
                        0
                    ]);
                    
                    createdImages.push(insertResult.rows[0]);
                    imagesCreated++;
                }
            }
            
            await client.query('COMMIT');
            
            res.status(201).json({
                success: true,
                message: `Upload thành công ${imagesCreated} ảnh mới, thay thế ${imagesReplaced} ảnh cũ`,
                data: {
                    visitId,
                    imagesCreated,
                    imagesReplaced,
                    totalProcessed: imagesCreated + imagesReplaced,
                    images: createdImages,
                    validation: {
                        warnings: validation.warnings,
                        positionAnalysis: validation.positionAnalysis
                    }
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Upload stained images error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        } finally {
            client.release();
        }
    }

    /**
     * Get upload status for a visit (for progress tracking)
     * GET /api/visits/:visitId/stained-upload-status
     */
    async getStainedUploadStatus(req, res) {
        try {
            const { visitId } = req.params;
            
            const validation = await stainedValidator.validateVisitHasRawImages(visitId);
            const existingStained = await stainedValidator.getExistingStainedImages(visitId);
            
            // Analyze which positions are covered
            const stainedPositions = existingStained.map(img => img.image_type).filter(Boolean);
            const allPositions = stainedValidator.STANDARD_POSITIONS;
            
            const coverage = allPositions.map(pos => ({
                ...pos,
                hasImage: stainedPositions.includes(pos.type)
            }));
            
            res.json({
                success: true,
                data: {
                    visitId: parseInt(visitId),
                    hasRawImages: validation.hasRawImages,  // Fixed: was validation.valid
                    rawImageCount: validation.rawImages.length,
                    stainedImageCount: existingStained.length,
                    coverage,
                    complete: existingStained.length === 9,
                    message: validation.message
                }
            });
            
        } catch (error) {
            console.error('Get stained upload status error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // ============================================================
    // YOLO Upload - accepts folder with images/ + labels/ YOLO format
    // ============================================================

    /**
     * Bulk upload YOLO format: images + YOLO .txt labels
     * Accepts multipart/form-data with:
     * - images[]: array of image files
     * - yoloLabels[]: array of YOLO .txt files (6-field format)
     * - metadata: JSON string with upload info
     *
     * POST /api/bulk-upload-yolo
     */
    async bulkUploadYolo(req, res) {
        const { pool } = require('../config/database');
        const client = await pool.connect();

        try {
            // Parse metadata
            const metadata = JSON.parse(req.body.metadata || '[]');

            let imageFiles = [];
            let yoloLabelFiles = [];
            const archiveFiles = [];

            // Separate files by type
            if (Array.isArray(req.files)) {
                for (const file of req.files) {
                    if (file.fieldname === 'images') {
                        imageFiles.push(file);
                    } else if (file.fieldname === 'yoloLabels') {
                        yoloLabelFiles.push(file);
                    } else if (file.fieldname === 'archive') {
                        archiveFiles.push(file);
                    }
                }
            } else if (req.files) {
                imageFiles = req.files.images || [];
                yoloLabelFiles = req.files.yoloLabels || [];
                archiveFiles.push(...(req.files.archive || []));
            }

            // Handle ZIP archive extraction
            const archivePath = require('path');
            let extractedDir = null;

            if (archiveFiles.length > 0) {
                const archive = archiveFiles[0];
                const aPath = archive.path || (archive.destination && archive.filename ? archivePath.join(archive.destination, archive.filename) : null);
                if (!aPath || !fs.existsSync(aPath)) {
                    return res.status(400).json({ success: false, error: 'Archive not found on disk' });
                }

                extractedDir = archivePath.join(process.env.UPLOAD_DIR || '/tmp/uploads', `yolo_extract_${Date.now()}`);

                try {
                    const extracted = await extractZipToDir(aPath, extractedDir);

                    for (const e of extracted) {
                        const base = path.basename(e.name).toLowerCase();
                        const ext = path.extname(e.name).toLowerCase();

                        if (ext === '.txt') {
                            // YOLO label file
                            try {
                                const content = fs.readFileSync(e.path);
                                yoloLabelFiles.push({ originalname: path.basename(e.name), buffer: content });
                            } catch (err) {
                                console.warn('Failed to read label file from archive:', err.message);
                            }
                        } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                            // Image file
                            imageFiles.push({ originalname: path.basename(e.name), path: e.path });
                        }
                    }

                    console.log(`Extracted ${extracted.length} files from archive to ${extractedDir}`);
                } catch (err) {
                    await cleanupDir(extractedDir);
                    return res.status(400).json({ success: false, error: `Failed to extract archive: ${err.message}` });
                }
            }

            // Validation
            if (!metadata || metadata.length === 0) {
                return res.status(400).json({ success: false, error: 'No metadata provided' });
            }
            if (!imageFiles || imageFiles.length === 0) {
                return res.status(400).json({ success: false, error: 'No image files uploaded' });
            }
            if (!yoloLabelFiles || yoloLabelFiles.length === 0) {
                return res.status(400).json({ success: false, error: 'No YOLO label files uploaded' });
            }

            // Build label file map: baseName → buffer
            const labelFileMap = {};
            for (const lf of yoloLabelFiles) {
                const baseName = lf.originalname.replace(/\.txt$/i, '');
                labelFileMap[baseName] = lf.buffer;
            }

            // Start transaction
            await client.query('BEGIN');

            let patientsCreated = 0;
            let visitsCreated = 0;
            let imagesCreated = 0;
            let annotationsCreated = 0;
            const createdPatients = [];
            const createdVisits = [];
            const createdImages = [];
            const imagesWithoutAnnotations = [];

            // Group images by patient using parseNewFilename
            const patientGroups = {};
            for (const file of imageFiles) {
                const parsed = annotationService.parseNewFilename(file.originalname);
                if (!parsed) {
                    console.warn(`[YOLO Upload] Cannot parse filename: ${file.originalname}`);
                    continue;
                }
                if (!patientGroups[parsed.patientId]) {
                    patientGroups[parsed.patientId] = { images: [], ext: parsed.ext };
                }
                patientGroups[parsed.patientId].images.push({ file, parsed });
            }

            // Process each patient group
            for (const group of metadata) {
                const patientId = group.patientId;
                const patientGroup = patientGroups[patientId];

                if (!patientGroup) {
                    console.warn(`[YOLO Upload] No images found for patient ${patientId}`);
                    continue;
                }

                // 1. Handle patient
                let patient;
                if (group.patientMapping) {
                    if (group.patientMapping.type === 'existing') {
                        patient = group.patientMapping.patient;
                    } else if (group.patientMapping.type === 'new') {
                        patient = await Patient.create({
                            name: group.patientMapping.patient.name,
                            phone: group.patientMapping.patient.phone || '',
                            dob: group.patientMapping.patient.dob || null,
                            gender: group.patientMapping.patient.gender || 'unknown',
                            notes: group.patientMapping.patient.notes || `Patient ID: ${patientId}`
                        });
                        patientsCreated++;
                        createdPatients.push(patient);
                    }
                } else {
                    let existingPatient = await Patient.findAll({ search: `ID:${patientId}`, limit: 1 });
                    if (!existingPatient || existingPatient.data.length === 0) {
                        patient = await Patient.create({
                            name: `Bệnh Nhân #${patientId}`,
                            phone: '',
                            dob: null,
                            gender: 'unknown',
                            notes: `Patient ID: ${patientId}`
                        });
                        patientsCreated++;
                        createdPatients.push(patient);
                    } else {
                        patient = existingPatient.data[0];
                    }
                }

                // 2. Create visit with system datetime
                const now = new Date();
                const visitDate = group.visitDate || now.toISOString().split('T')[0];

                const visit = await Visit.create({
                    patient_id: patient.id,
                    visit_date: visitDate,
                    diagnosis: 'Khám chỉnh nha định kỳ',
                    notes: `YOLO bulk upload - Patient ID: ${patientId}`,
                    status: 'completed'
                });
                visitsCreated++;
                createdVisits.push(visit);

                // 3. Process each image with its YOLO label
                for (const { file, parsed } of patientGroup.images) {
                    // Match label file
                    const baseName = file.originalname.replace(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i, '');
                    const matchedLabel = labelFileMap[baseName];

                    if (!matchedLabel) {
                        console.warn(`[YOLO Upload] No label found for: ${file.originalname}`);
                        imagesWithoutAnnotations.push(file.originalname);
                        continue;
                    }

                    // Get image dimensions
                    let imageWidth = 0;
                    let imageHeight = 0;
                    try {
                        const imageBuffer = file.buffer || fs.readFileSync(file.path);
                        const metadata = await sharp(imageBuffer).metadata();
                        imageWidth = metadata.width || 0;
                        imageHeight = metadata.height || 0;
                    } catch (err) {
                        console.warn(`[YOLO Upload] Cannot read dimensions for ${file.originalname}: ${err.message}`);
                        // Continue without dimensions - will use default or skip
                    }

                    // Upload image to MinIO
                    const imageCategory = parsed.position.includes('raw') ? 'raw' :
                                         parsed.position.includes('stained') ? 'stained' : 'raw';
                    const objectName = `visits/${visit.id}/${imageCategory}_${parsed.position}.${parsed.ext}`;

                    let uploadResult;
                    if (file.buffer) {
                        uploadResult = await storage.uploadFile(objectName, file.buffer, 'image/jpeg');
                    } else if (file.path) {
                        const fileBuffer = fs.readFileSync(file.path);
                        uploadResult = await storage.uploadFile(objectName, fileBuffer, 'image/jpeg');
                    }

                    if (!uploadResult || !uploadResult.success) {
                        console.error(`[YOLO Upload] Failed to upload ${file.originalname}:`, uploadResult?.error);
                        continue;
                    }

                    // Create image record
                    const positionIndexMap = {
                        'upper_right': 1, 'upper_center': 2, 'upper_left': 3,
                        'middle_right': 4, 'middle_center': 5, 'middle_left': 6,
                        'lower_right': 7, 'lower_center': 8, 'lower_left': 9
                    };
                    const imageIndex = positionIndexMap[parsed.position] || null;

                    const imageData = {
                        visit_id: visit.id,
                        url: uploadResult.url,
                        original_filename: file.originalname,
                        image_category: imageCategory,
                        image_type: parsed.position.substring(0, 50),
                        image_index: imageIndex,
                        validation_status: 'pending',
                        notes: `YOLO upload: ${file.originalname}`,
                        width: imageWidth,
                        height: imageHeight,
                        has_annotations: false,
                        annotation_count: 0
                    };

                    const image = await Image.create(imageData);
                    imagesCreated++;
                    createdImages.push(image);

                    // Parse YOLO annotations and convert to pixels
                    const labelContent = matchedLabel.toString('utf-8');
                    const yoloAnnotations = annotationService.parseYOLOFile(labelContent);

                    if (yoloAnnotations.length > 0 && imageWidth > 0 && imageHeight > 0) {
                        const pixelAnnotations = annotationService.convertYOLOToPixels(yoloAnnotations, imageWidth, imageHeight);

                        // Store annotations in DB
                        const annotationsToStore = pixelAnnotations.map(ann => ({
                            image_id: image.id,
                            category_id: ann.category_id,
                            category_name: ann.category_name,
                            bbox: ann.bbox,
                            area: ann.area,
                            plaque_status: ann.plaque_status,
                            tooth_id: ann.tooth_id || null
                        }));

                        await annotationService.storeBatchYOLOAnnotations(client, annotationsToStore);

                        // Update image record
                        await client.query(
                            'UPDATE images SET has_annotations = true, annotation_count = $1 WHERE id = $2',
                            [yoloAnnotations.length, image.id]
                        );

                        annotationsCreated += yoloAnnotations.length;
                    } else {
                        imagesWithoutAnnotations.push(file.originalname);
                    }
                }
            }

            // Commit transaction
            await client.query('COMMIT');

            // Build response
            const summaryParts = [];
            if (patientsCreated > 0) summaryParts.push(`${patientsCreated} bệnh nhân mới`);
            if (visitsCreated > 0) summaryParts.push(`${visitsCreated} lần khám`);
            if (imagesCreated > 0) summaryParts.push(`${imagesCreated} ảnh`);
            if (annotationsCreated > 0) summaryParts.push(`${annotationsCreated} annotations`);

            const patientSummary = createdPatients.map((patient, idx) => ({
                id: patient.id,
                name: patient.name,
                patientId: metadata[idx]?.patientId,
                imagesCount: createdVisits[idx] ?
                    createdImages.filter(img => img.visit_id === createdVisits[idx].id).length : 0
            }));

            res.status(201).json({
                success: true,
                message: `YOLO Upload thành công: ${summaryParts.join(', ')}`,
                data: {
                    patientsCreated,
                    visitsCreated,
                    imagesCreated,
                    annotationsCreated,
                    imagesWithoutAnnotations: imagesWithoutAnnotations.length > 0 ? imagesWithoutAnnotations : undefined,
                    patientSummary,
                    patients: createdPatients,
                    visits: createdVisits,
                    images: createdImages
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('YOLO Bulk upload error:', error);

            let errorMessage = 'YOLO Upload thất bại';
            if (error.message.includes('annotation')) {
                errorMessage = `Lỗi xử lý annotations: ${error.message}`;
            } else if (error.message.includes('patient')) {
                errorMessage = `Lỗi tạo bệnh nhân: ${error.message}`;
            } else if (error.message.includes('visit')) {
                errorMessage = `Lỗi tạo lần khám: ${error.message}`;
            } else if (error.message.includes('upload') || error.message.includes('storage')) {
                errorMessage = `Lỗi upload ảnh: ${error.message}`;
            } else {
                errorMessage = error.message || 'Lỗi không xác định';
            }

            res.status(500).json({ success: false, error: errorMessage });
        } finally {
            // Cleanup extracted files
            try {
                if (typeof extractedDir !== 'undefined' && extractedDir) {
                    await cleanupDir(extractedDir);
                    console.log('Cleaned up extracted dir:', extractedDir);
                }
            } catch (cleanupErr) {
                console.warn('Error cleaning up extracted files:', cleanupErr.message);
            }

            client.release();
        }
    }

    /**
     * Get available visits for a patient (that have RAW images)
     * GET /api/patients/:patientId/available-visits
     */
    async getAvailableVisitsForStained(req, res) {
        try {
            const { patientId } = req.params;
            
            // Get all visits for patient
            const visits = await Visit.findByPatientId(patientId);
            
            // Check each visit for RAW images
            const visitsWithStatus = await Promise.all(
                visits.map(async (visit) => {
                    const rawImages = await Image.findByCategory(visit.id, 'raw');
                    const stainedImages = await Image.findByCategory(visit.id, 'stained');
                    
                    return {
                        ...visit,
                        rawImageCount: rawImages.length,
                        stainedImageCount: stainedImages.length,
                        hasRawImages: rawImages.length > 0,
                        hasStainedImages: stainedImages.length > 0,
                        stainedComplete: stainedImages.length === 9
                    };
                })
            );
            
            // Filter to only visits with RAW images
            const availableVisits = visitsWithStatus.filter(v => v.hasRawImages);
            
            res.json({
                success: true,
                data: availableVisits
            });
            
        } catch (error) {
            console.error('Get available visits error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
}

// Export all methods including YOLO upload
const controller = new BulkUploadController();
module.exports = {
    bulkUpload: controller.bulkUpload.bind(controller),
    bulkUploadYolo: controller.bulkUploadYolo.bind(controller),
    getUploadHistory: controller.getUploadHistory.bind(controller),
    confirmUpload: controller.confirmUpload.bind(controller),
    generatePresignedUrls: controller.generatePresignedUrls.bind(controller),
    uploadStainedImages: controller.uploadStainedImages.bind(controller),
    getStainedUploadStatus: controller.getStainedUploadStatus.bind(controller),
    getAvailableVisitsForStained: controller.getAvailableVisitsForStained.bind(controller)
};
