const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config();
 
const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect DB (non-blocking)
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  // Don't exit immediately, let the server start and retry
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/space', require('./routes/space'));
app.use('/api/table', require('./routes/table'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/table-draft', require('./routes/tableDraft'));
app.use('/api/plan', require('./routes/plan'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/superadmin', require('./routes/superAdmin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/bills', require('./routes/bill'));

// Health check endpoint
app.get('/api/ping', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
