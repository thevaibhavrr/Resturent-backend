const Restaurant = require('../models/Restaurant');

// Simple in-memory cache for subscription data (5 minute TTL)
const subscriptionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // Check cache first
    const cacheKey = `sub_${restaurantId}`;
    const cached = subscriptionCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      // Use cached data
      const subscriptionData = cached.data;

      if (!subscriptionData.isActive || subscriptionData.daysRemaining <= 0) {
        console.log(`🚫 Subscription EXPIRED (cached) for restaurant ${restaurantId} - Blocking request`);
        return res.status(403).json({
          error: 'Subscription expired. Please recharge your plan to continue using the system.',
          subscriptionExpired: true,
          daysRemaining: subscriptionData.daysRemaining,
          planName: subscriptionData.planName,
          endDate: subscriptionData.endDate
        });
      }

      console.log(`✅ Subscription ACTIVE (cached) for restaurant ${restaurantId} - Allowing request`);
      req.subscription = subscriptionData;
      return next();
    }

    // Cache miss - fetch from database
    console.log(`🔄 Cache miss for restaurant ${restaurantId}, fetching from DB`);

    // Only populate plan if we don't have cached data - optimize by not always populating
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

    // Cache the result
    subscriptionCache.set(cacheKey, {
      data: subscriptionData,
      timestamp: Date.now()
    });

    console.log(`Subscription check for restaurant ${restaurantId}:`, {
      isActive: subscriptionData.isActive,
      daysRemaining: subscriptionData.daysRemaining,
      endDate: subscriptionData.endDate,
      planName: subscriptionData.planName
    });

    // Check if subscription is active
    if (!subscriptionData.isActive || subscriptionData.daysRemaining <= 0) {
      console.log(`🚫 Subscription EXPIRED for restaurant ${restaurantId} - Blocking request`);
      return res.status(403).json({
        error: 'Subscription expired. Please recharge your plan to continue using the system.',
        subscriptionExpired: true,
        daysRemaining: subscriptionData.daysRemaining,
        planName: subscriptionData.planName,
        endDate: subscriptionData.endDate
      });
    }

    console.log(`✅ Subscription ACTIVE for restaurant ${restaurantId} - Allowing request`);

    // Attach subscription info to request for use in route handlers
    req.subscription = subscriptionData;

    next();
  } catch (err) {
    console.error('Subscription check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = checkSubscription;
