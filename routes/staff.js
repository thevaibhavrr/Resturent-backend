const express = require('express');
const router = express.Router();
const staffController = require('../controller/staffController');

// Define routes for staff API
router.get('/', staffController.getAllStaff);
router.get('/check-username', staffController.checkUsername);
router.get('/restaurant/:restaurantId', staffController.getStaffByRestaurant);
router.post('/', staffController.createStaff);
router.get('/:id', staffController.getStaffById);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;