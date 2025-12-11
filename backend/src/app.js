const express = require('express');
const bodyParser = require('body-parser');
const setRoutes = require('./routes/index');
const { requestLogger, errorHandler, validateRequest } = require('./middleware/index');

const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestLogger);
// Nếu cần validateRequest, dùng ở từng route

// Routes setup
setRoutes(app);
app.use(errorHandler);

module.exports = app;