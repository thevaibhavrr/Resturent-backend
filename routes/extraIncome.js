const express = require('express');
const router = express.Router();
const extraIncomeController = require('../controllers/extraIncomeController');
const verifyToken = require('../middleware/verifyToken');

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Create a new extra income entry
router.post('/', extraIncomeController.createExtraIncome);

// Get all extra income entries
router.get('/', extraIncomeController.getExtraIncomes);

// Get extra income summary
router.get('/summary', extraIncomeController.getExtraIncomeSummary);

// Get a single extra income entry by ID
router.get('/:id', extraIncomeController.getExtraIncomeById);

// Update an extra income entry
router.put('/:id', extraIncomeController.updateExtraIncome);

// Delete an extra income entry
router.delete('/:id', extraIncomeController.deleteExtraIncome);

module.exports = router;
