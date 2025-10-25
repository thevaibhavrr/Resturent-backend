const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// connect DB
connectDB();

app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/space', require('./routes/space'));
app.use('/api/table', require('./routes/table'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/table-draft', require('./routes/tableDraft'));
app.use('/api/plan', require('./routes/plan'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/superadmin', require('./routes/superAdmin'));

app.get('/api/ping', (req, res) => res.json({ ok: true }));

module.exports = app;
