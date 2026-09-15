const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const setRoutes = require('./routes/index');
const { requestLogger, errorHandler, validateRequest } = require('./middleware/index');

const app = express();

const cookieParser = require('cookie-parser');

// CORS setup - allow multiple frontend origins when credentials are required
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4004';

// Build allowed origins from env + hardcoded fallbacks
const envOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const allowedOrigins = [
  ...envOrigins,
  FRONTEND_URL,
  'http://localhost:4004',
  'http://localhost:3000',
  'http://127.0.0.1:4004',
  'http://192.168.88.69:4004',
  'http://100.93.48.110:4004'
];

// Deduplicate
const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches pattern
    if (uniqueOrigins.includes(origin) || origin.match(/^https?:\/\/192\.168\.\d+\.\d+:\d+$/)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
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