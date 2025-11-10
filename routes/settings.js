const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const verifyToken = require('../middleware/verifyToken');

// Get restaurant settings
router.get('/:restaurantId', verifyToken, settingsController.getSettings);

// Update restaurant settings
router.put('/:restaurantId', verifyToken, settingsController.updateSettings);

module.exports = router;

