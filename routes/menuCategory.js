const express = require('express');
const router = express.Router();
const menuCategoryController = require('../controllers/menuCategoryController');

// CRUD routes
router.post('/', menuCategoryController.createCategory);
router.get('/', menuCategoryController.getCategories);
router.put('/:id', menuCategoryController.updateCategory);
router.delete('/:id', menuCategoryController.deleteCategory);

// Special routes
router.put('/order/update', menuCategoryController.updateOrder);

module.exports = router;