const Restaurant = require('../models/Restaurant');

const checkSubscription = async (req, res, next) => {
  try {
    // Get restaurant ID from the authenticated user (JWT token)
    const restaurantId = req.user?.restaurantId;
    
    if (!restaurantId) {
      console.error('Subscription check failed: No restaurantId in token');
      return res.status(401).json({ 
        error: 'Authentication required. Please login again.',
        subscriptionExpired: false
      });
    }

    // Populate plan to get current duration for dynamic calculation
    const restaurant = await Restaurant.findById(restaurantId).populate('subscription.plan');
    
    if (!restaurant) {
      console.error('Subscription check failed: Restaurant not found', restaurantId);
      return res.status(404).json({ 
        error: 'Restaurant not found',
        subscriptionExpired: false
      });
    }

    // Get subscription with dynamically calculated values based on current plan duration
    const subscriptionData = restaurant.getSubscriptionWithCalculations();

    console.log(`Subscription check for ${restaurant.name}:`, {
      isActive: subscriptionData.isActive,
      daysRemaining: subscriptionData.daysRemaining,
      endDate: subscriptionData.endDate,
      planName: subscriptionData.planName
    });

    // Check if subscription is active
    if (!subscriptionData.isActive || subscriptionData.daysRemaining <= 0) {
      console.log(`🚫 Subscription EXPIRED for ${restaurant.name} - Blocking request`);
      return res.status(403).json({ 
        error: 'Subscription expired. Please recharge your plan to continue using the system.',
        subscriptionExpired: true,
        daysRemaining: subscriptionData.daysRemaining,
        planName: subscriptionData.planName,
        endDate: subscriptionData.endDate
      });
    }

    console.log(`✅ Subscription ACTIVE for ${restaurant.name} - Allowing request`);

    // Attach subscription info to request for use in route handlers
    req.subscription = subscriptionData;
    
    next();
  } catch (err) {
    console.error('Subscription check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = checkSubscription;
