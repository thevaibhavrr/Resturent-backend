const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// Upload image
router.post('/image', uploadController.uploadImage);

module.exports = router;
