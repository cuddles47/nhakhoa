const { Patient, Visit, Image } = require('../models');
const { uploadFiles } = require('../services/storage');
const db = require('../services/database');

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
            const files = req.files || [];

            if (!metadata || metadata.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No metadata provided' 
                });
            }

            if (!files || files.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No files uploaded' 
                });
            }

            // Start transaction
            await client.query('BEGIN');

            let patientsCreated = 0;
            let visitsCreated = 0;
            let imagesCreated = 0;
            const createdPatients = [];
            const createdVisits = [];
            const createdImages = [];

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

                // 3. Upload images to MinIO and create image records
                const filesToUpload = [];
                
                for (const imageInfo of imageInfos) {
                    // Find matching file
                    const file = files.find(f => f.originalname === imageInfo.filename);
                    
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

                // Create image records
                for (let i = 0; i < uploadResults.length; i++) {
                    const uploadResult = uploadResults[i];
                    const fileInfo = filesToUpload[i];

                    if (!uploadResult.success) {
                        console.error(`Failed to upload ${uploadResult.originalName}:`, uploadResult.error);
                        continue;
                    }

                    // Truncate long values to fit VARCHAR constraints
                    const imageData = {
                        visit_id: visit.id,
                        url_minio: uploadResult.url, // VARCHAR(255)
                        image_category: fileInfo.imageCategory, // VARCHAR(20)
                        image_type: fileInfo.imageInfo.position.substring(0, 50), // VARCHAR(50) - truncate
                        image_index: null, // Could parse from position if needed
                        validation_status: 'pending', // VARCHAR(20)
                        notes: `Bulk upload: ${uploadResult.originalName}` // TEXT - no limit
                    };

                    const image = await Image.create(imageData);

                    imagesCreated++;
                    createdImages.push(image);
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
