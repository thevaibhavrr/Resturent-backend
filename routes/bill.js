const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const verifyToken = require('../middleware/verifyToken');

// Create a new bill
router.post('/', verifyToken, billController.createBill);

// Get all bills for a restaurant
router.get('/', verifyToken, billController.getBills);

// Get bill statistics
router.get('/stats', verifyToken, billController.getBillStats);

// Get net profit statistics
router.get('/net-profit-stats', verifyToken, billController.getNetProfitStats);

// Get bill by ID
router.get('/:id', verifyToken, billController.getBillById);

// Update a bill
router.put('/:id', verifyToken, billController.updateBill);

// Delete a bill
router.delete('/:id', verifyToken, billController.deleteBill);

module.exports = router;

