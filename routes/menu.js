const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getCategories,
  createMenuItem,
  createCategory,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');

// Menu Items routes
router.get('/items', getMenuItems);
router.post('/items', createMenuItem);
router.put('/items/:id', updateMenuItem);
router.delete('/items/:id', deleteMenuItem);

// Categories routes
router.get('/categories', getCategories);
router.post('/categories', createCategory);

module.exports = router;
