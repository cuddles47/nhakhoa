const { Patient } = require('../models');
const storage = require('../services/storage');
const minioClient = require('../config/minio');
const { pool } = require('../config/database');

class PatientController {
    async getAllPatients(req, res) {
        try {
            const { page, limit, search, status, sortBy, sortOrder } = req.query;
            const result = await Patient.findAll({ page, limit, search, status, sortBy, sortOrder });
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Error fetching patients:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getPatientById(req, res) {
        try {
            const { id } = req.params;
            const patient = await Patient.findById(id);
            
            if (!patient) {
                return res.status(404).json({ success: false, error: 'Patient not found' });
            }
            
            res.json({ success: true, data: patient });
        } catch (error) {
            console.error('Error fetching patient:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async searchPatients(req, res) {
        try {
            const { q, page, limit } = req.query;
            
            if (!q) {
                return res.status(400).json({ success: false, error: 'Search query is required' });
            }
            
            const result = await Patient.findAll({ search: q, page, limit });
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Error searching patients:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async createPatient(req, res) {
        try {
            const { name, phone, dob, gender, notes } = req.body;
            
            if (!name) {
                return res.status(400).json({ success: false, error: 'Name is required' });
            }
            
            const patient = await Patient.create({ name, phone, dob, gender, notes });
            res.status(201).json({ success: true, data: patient });
        } catch (error) {
            console.error('Error creating patient:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updatePatient(req, res) {
        try {
            const { id } = req.params;
            const { name, phone, dob, gender, notes } = req.body;
            
            const patient = await Patient.update(id, { name, phone, dob, gender, notes });
            
            if (!patient) {
                return res.status(404).json({ success: false, error: 'Patient not found' });
            }
            
            res.json({ success: true, data: patient });
        } catch (error) {
            console.error('Error updating patient:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async deletePatient(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const BUCKET = process.env.MINIO_BUCKET || 'nhakhoa';

            // Get all visit IDs for this patient
            const visitsResult = await client.query(
                'SELECT id FROM visits WHERE patient_id = $1', [id]
            );
            const visitIds = visitsResult.rows.map(r => r.id);

            // Get all image object prefixes for those visits
            if (visitIds.length > 0) {
                for (const visitId of visitIds) {
                    const prefix = `visits/${visitId}/`;
                    const objectsList = [];
                    const stream = minioClient.listObjects(BUCKET, prefix, true);
                    await new Promise((resolve, reject) => {
                        stream.on('data', obj => objectsList.push(obj.name));
                        stream.on('end', resolve);
                        stream.on('error', reject);
                    });
                    if (objectsList.length > 0) {
                        await minioClient.removeObjects(BUCKET, objectsList);
                        console.log(`Deleted ${objectsList.length} MinIO objects for visit ${visitId}`);
                    }
                }
            }

            // Soft-delete patient (visits/images cascade via soft-delete or FK)
            await Patient.delete(id);
            res.json({ success: true, message: 'Patient deleted successfully' });
        } catch (error) {
            console.error('Error deleting patient:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            client.release();
        }
    }
}

module.exports = new PatientController();
