const { Visit } = require('../models');

class VisitController {
    async getAllVisits(req, res) {
        try {
            const { page, limit, status, dateFrom, dateTo, patientId, sortBy, sortOrder } = req.query;
            const result = await Visit.findAll({ page, limit, status, dateFrom, dateTo, patientId, sortBy, sortOrder });
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Error fetching visits:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getVisitById(req, res) {
        try {
            const { id } = req.params;
            const visit = await Visit.findById(id);
            
            if (!visit) {
                return res.status(404).json({ success: false, error: 'Visit not found' });
            }
            
            res.json({ success: true, data: visit });
        } catch (error) {
            console.error('Error fetching visit:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getVisitsByPatientId(req, res) {
        try {
            const { patientId } = req.params;
            const visits = await Visit.findByPatientId(patientId);
            res.json({ success: true, data: visits });
        } catch (error) {
            console.error('Error fetching visits:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async createVisit(req, res) {
        try {
            const { patient_id, case_id, visit_date, status, notes } = req.body;
            
            if (!patient_id || !visit_date) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Patient ID and visit date are required' 
                });
            }
            
            const created_by = req.user ? req.user.id : null;
            const visit = await Visit.create({ 
                patient_id, 
                case_id, 
                visit_date, 
                status: status || 'pending', 
                notes,
                created_by
            });
            
            res.status(201).json({ success: true, data: visit });
        } catch (error) {
            console.error('Error creating visit:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateVisit(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            
            const visit = await Visit.update(id, { status, notes });
            
            if (!visit) {
                return res.status(404).json({ success: false, error: 'Visit not found' });
            }
            
            res.json({ success: true, data: visit });
        } catch (error) {
            console.error('Error updating visit:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async deleteVisit(req, res) {
        try {
            const { id } = req.params;
            await Visit.delete(id);
            res.json({ success: true, message: 'Visit deleted successfully' });
        } catch (error) {
            console.error('Error deleting visit:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new VisitController();
