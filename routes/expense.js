const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const verifyToken = require('../middleware/verifyToken');

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Create a new expense
router.post('/', expenseController.createExpense);

// Get all expenses with optional filtering
router.get('/', expenseController.getExpenses);

// Get expense summary
router.get('/summary', expenseController.getExpenseSummary);

// Get a single expense by ID
router.get('/:id', expenseController.getExpenseById);

// Update an expense
router.put('/:id', expenseController.updateExpense);

// Delete an expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
