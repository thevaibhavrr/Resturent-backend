const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');
const menuCategoryController = require('../controllers/menuCategoryController');

// Menu Items routes
router.get('/items', menuItemController.getItems);
router.post('/items', menuItemController.createItem);
router.put('/items/:id', menuItemController.updateItem);
router.delete('/items/:id', menuItemController.deleteItem);
router.patch('/items/:id/reactivate', menuItemController.reactivateItem);

// Additional menu item routes for space prices
router.get('/items/:itemId/prices', menuItemController.getItemPrices);

// Categories routes - all using menuCategoryController
router.get('/categories', menuCategoryController.getCategories);
router.post('/categories', menuCategoryController.createCategory);
router.put('/categories/:id', menuCategoryController.updateCategory);
router.delete('/categories/:id', menuCategoryController.deleteCategory);
router.patch('/categories/:id/reactivate', menuCategoryController.reactivateCategory);

// Category order update route
router.put('/categories/order', menuCategoryController.updateOrder);

module.exports = router;
