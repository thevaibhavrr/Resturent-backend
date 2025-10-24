const Plan = require('../models/Plan');
const Restaurant = require('../models/Restaurant');

// Get all plans
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true });
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get restaurant subscription status
exports.getRestaurantSubscription = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId).populate('subscription.plan');
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Get subscription with dynamically calculated values
    const subscriptionData = restaurant.getSubscriptionWithCalculations();

    res.json({
      subscription: {
        ...subscriptionData,
        planDetails: restaurant.subscription.plan // Full plan details from populated reference
      },
      restaurantName: restaurant.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update restaurant plan
exports.updateRestaurantPlan = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { planId } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Calculate new end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    restaurant.subscription = {
      plan: plan._id,
      planName: plan.name,
      startDate: startDate,
      endDate: endDate
      // isActive and daysRemaining are calculated dynamically
    };

    await restaurant.save();

    // Get subscription with calculated values
    const subscriptionData = restaurant.getSubscriptionWithCalculations();

    res.json({ 
      message: 'Plan updated successfully', 
      subscription: subscriptionData 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check if restaurant subscription is active
exports.checkSubscriptionStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Get subscription with calculated values
    const subscriptionData = restaurant.getSubscriptionWithCalculations();

    res.json({
      isActive: subscriptionData.isActive,
      daysRemaining: subscriptionData.daysRemaining,
      planName: subscriptionData.planName,
      endDate: subscriptionData.endDate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all restaurants with subscription info (for admin)
exports.getAllRestaurantsSubscription = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}).populate('subscription.plan');
    
    // Get restaurants with dynamically calculated subscription values
    const restaurantsWithUpdatedDays = restaurants.map((restaurant) => {
      const subscriptionData = restaurant.getSubscriptionWithCalculations();
      return {
        id: restaurant._id,
        name: restaurant.name,
        adminUsername: restaurant.adminUsername,
        subscription: subscriptionData,
        createdAt: restaurant.createdAt
      };
    });

    res.json(restaurantsWithUpdatedDays);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
