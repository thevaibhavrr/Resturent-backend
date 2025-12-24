const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');

// Auth
router.post('/login', superAdminController.login);

// Dashboard stats
router.get('/dashboard/stats', superAdminController.getDashboardStats);

// Restaurant management
router.get('/restaurants', superAdminController.getAllRestaurants);
router.get('/restaurants/:id', superAdminController.getRestaurantById);
router.post('/restaurants', superAdminController.createRestaurant);
router.put('/restaurants/:id', superAdminController.updateRestaurant);
router.delete('/restaurants/:id', superAdminController.deleteRestaurant);

// KOT number generation
router.get('/restaurants/:restaurantId/next-kot-number', superAdminController.getNextKotNumber);

// Staff management
router.get('/restaurants/:restaurantId/staff', superAdminController.getRestaurantStaff);

// Plan management
router.get('/plans', superAdminController.getAllPlans);
router.post('/plans', superAdminController.createPlan);
router.put('/plans/:id', superAdminController.updatePlan);
router.delete('/plans/:id', superAdminController.deletePlan);

module.exports = router;
