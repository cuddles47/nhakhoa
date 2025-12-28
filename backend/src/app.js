const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const setRoutes = require('./routes/index');
const { requestLogger, errorHandler, validateRequest } = require('./middleware/index');

const app = express();

// CORS setup - allow all origins in development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestLogger);
// Nếu cần validateRequest, dùng ở từng route

// Routes setup
setRoutes(app);
app.use(errorHandler);

module.exports = app;