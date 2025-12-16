const express = require('express');
const router = express.Router();
const patientController = require('../controllers/PatientController');
const visitController = require('../controllers/VisitController');
const imageController = require('../controllers/ImageController');
const bulkUploadController = require('../controllers/BulkUploadController');
const indexController = require('../controllers/index');
const validate = require('../middleware/validate');
const patientSchemas = require('../validators/patientValidator');
const visitSchemas = require('../validators/visitValidator');
const imageSchemas = require('../validators/imageValidator');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 100 // Max 100 files
    }
});

// Root routes
router.get('/', indexController.getHello);
router.get('/api/status', indexController.getStatus);

// Patient routes
router.get('/api/patients', patientController.getAllPatients);
router.get('/api/patients/search', patientController.searchPatients);
router.get('/api/patients/:id', patientController.getPatientById);
router.post('/api/patients', validate(patientSchemas.create), patientController.createPatient);
router.put('/api/patients/:id', validate(patientSchemas.update), patientController.updatePatient);
router.delete('/api/patients/:id', patientController.deletePatient);

// Visit routes
router.get('/api/visits', visitController.getAllVisits);
router.get('/api/visits/:id', visitController.getVisitById);
router.get('/api/patients/:patientId/visits', visitController.getVisitsByPatientId);
router.post('/api/visits', validate(visitSchemas.create), visitController.createVisit);
router.put('/api/visits/:id', validate(visitSchemas.update), visitController.updateVisit);
router.delete('/api/visits/:id', visitController.deleteVisit);

// Image routes
router.get('/api/images', imageController.getAllImages);
router.get('/api/visits/:visitId/images', imageController.getImagesByVisitId);
router.get('/api/visits/:visitId/images/:category', imageController.getImagesByCategory);
router.post('/api/images', validate(imageSchemas.create), imageController.createImage);
router.put('/api/images/:id/validation', validate(imageSchemas.updateValidation), imageController.updateValidationStatus);
router.delete('/api/images/:id', imageController.deleteImage);

// Bulk upload routes
router.post('/api/bulk-upload', upload.array('images', 100), bulkUploadController.bulkUpload);
router.get('/api/bulk-upload/history', bulkUploadController.getUploadHistory);

function setRoutes(app) {
    app.use('/', router);
}

module.exports = setRoutes;
