const express = require('express');
const indexController = require('../controllers/index');

const router = express.Router();

function setRoutes(app) {
    router.get('/', indexController.getHello);
    router.get('/api/status', indexController.getStatus);
    // Add more routes as needed

    app.use('/', router);
}

module.exports = setRoutes;