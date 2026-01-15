const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const setRoutes = require('./routes/index');
const { requestLogger, errorHandler, validateRequest } = require('./middleware/index');

const app = express();

const cookieParser = require('cookie-parser');

// CORS setup - allow only frontend origin when credentials are required
// const FRONTEND_URL = 'http://100.93.48.110:4004';
const FRONTEND_URL = 'http://192.168.88.69:4004';

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse cookies so authenticate middleware can read httpOnly cookie
app.use(cookieParser());

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestLogger);
// Nếu cần validateRequest, dùng ở từng route

// Routes setup
setRoutes(app);
app.use(errorHandler);

module.exports = app;