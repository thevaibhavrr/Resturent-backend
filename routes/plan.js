const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

// Get all available plans
router.get('/plans', planController.getAllPlans);

// Get restaurant subscription status
router.get('/subscription/:restaurantId', planController.getRestaurantSubscription);

// Update restaurant plan
router.put('/subscription/:restaurantId', planController.updateRestaurantPlan);

// Check subscription status
router.get('/subscription/:restaurantId/status', planController.checkSubscriptionStatus);

// Get all restaurants with subscription info (admin only)
router.get('/restaurants/subscriptions', planController.getAllRestaurantsSubscription);

module.exports = router;
