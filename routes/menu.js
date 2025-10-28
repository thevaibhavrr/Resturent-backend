const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');
const menuCategoryController = require('../controllers/menuCategoryController');

// Menu Items routes
router.get('/items', getMenuItems);
router.post('/items', createMenuItem);
router.put('/items/:id', updateMenuItem);
router.delete('/items/:id', deleteMenuItem);

// Categories routes - all using menuCategoryController
router.get('/categories', menuCategoryController.getCategories);
router.post('/categories', menuCategoryController.createCategory);
router.put('/categories/:id', menuCategoryController.updateCategory);
router.delete('/categories/:id', menuCategoryController.deleteCategory);

// Category order update route
router.put('/categories/order', menuCategoryController.updateOrder);

module.exports = router;
