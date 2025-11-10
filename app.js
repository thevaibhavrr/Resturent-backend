const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// connect DB
connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

app.get('/api/ping', (req, res) => res.json({ ok: true }));

module.exports = app;
