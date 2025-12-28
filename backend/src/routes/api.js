const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const userController = require('../controllers/UserController');
const patientController = require('../controllers/PatientController');
const visitController = require('../controllers/VisitController');
const imageController = require('../controllers/ImageController');
const bulkUploadController = require('../controllers/BulkUploadController');
const imageProcessingController = require('../controllers/ImageProcessingController');
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
        files: 99 // Max 99 files
    }
});

// Root routes
router.get('/', indexController.getHello);
router.get('/api/status', indexController.getStatus);

// Auth routes
router.post('/api/auth/login', authController.login);
router.get('/api/auth/profile', authController.getProfile);

// User routes
router.get('/api/users', userController.getAllUsers);
router.get('/api/users/:id', userController.getUserById);
router.post('/api/users', userController.createUser);
router.put('/api/users/:id', userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);
router.delete('/api/users', userController.deleteAllUsers); // Delete all users

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
router.post('/api/images', upload.single('image'), validate(imageSchemas.create), imageController.createImage);
router.put('/api/images/:id/validation', validate(imageSchemas.updateValidation), imageController.updateValidationStatus);
router.delete('/api/images/:id', imageController.deleteImage);

// Bulk upload routes
router.post('/api/bulk-upload', upload.fields([
    { name: 'images', maxCount: 100 },
    { name: 'annotationFile', maxCount: 1 }
]), bulkUploadController.bulkUpload);
router.get('/api/bulk-upload/history', bulkUploadController.getUploadHistory);

// Image processing routes
router.post('/api/visits/:visitId/process-images', imageProcessingController.processRawImages);
router.get('/api/visits/:visitId/processing-status', imageProcessingController.getProcessingStatus);

// Proxy route for MinIO images (to avoid CORS issues)
router.get('/api/images/proxy/*', async (req, res) => {
  try {
    const objectName = req.params[0]; // Everything after /api/images/proxy/
    console.log('Proxying image request for:', objectName);
    
    const storageService = require('../services/storage');
    const imageBuffer = await storageService.downloadFile(objectName);
    
    // Set appropriate content type based on file extension
    const ext = objectName.split('.').pop().toLowerCase();
    const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                       ext === 'png' ? 'image/png' : 'image/jpeg';
    
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(404).json({ error: 'Image not found' });
  }
});

function setRoutes(app) {
    app.use('/', router);
}

module.exports = setRoutes;
