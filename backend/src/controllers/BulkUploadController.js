const { Patient, Visit, Image, Annotation } = require('../models');
const storage = require('../services/storage');
const { uploadFiles } = storage;
const db = require('../services/database');
const annotationService = require('../services/annotationService');

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
            
            // When using upload.fields(), req.files is an object with field names as keys
            const imageFiles = req.files?.images || [];
            const annotationFiles = req.files?.annotationFile || [];
            const annotationFile = annotationFiles[0];
            
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
                    const imageData = {
                        visit_id: visit.id,
                        url: uploadResult.url, // VARCHAR(255) - Changed from url_minio to url
                        original_filename: uploadResult.originalName, // NEW: Store original filename
                        image_category: fileInfo.imageCategory, // VARCHAR(20)
                        image_type: fileInfo.imageInfo.position.substring(0, 50), // VARCHAR(50) - truncate
                        image_index: null, // Could parse from position if needed
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

            res.status(201).json({
                success: true,
                message: 'Bulk upload completed successfully',
                data: {
                    patientsCreated,
                    visitsCreated,
                    imagesCreated,
                    annotationsCreated,
                    imagesWithoutAnnotations: imagesWithoutAnnotations.length > 0 ? imagesWithoutAnnotations : undefined,
                    patients: createdPatients,
                    visits: createdVisits,
                    images: createdImages
                }
            });

        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            console.error('Bulk upload error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message || 'Bulk upload failed'
            });
        } finally {
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
}

module.exports = new BulkUploadController();
