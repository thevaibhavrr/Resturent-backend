const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');

// CRUD routes
router.post('/', menuItemController.createItem);
router.get('/', menuItemController.getItems);
router.put('/:id', menuItemController.updateItem);
router.delete('/:id', menuItemController.deleteItem);

// Special routes
router.put('/order/update', menuItemController.updateOrder);

module.exports = router;