const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const Restaurant = require('../models/Restaurant');
const Staff = require('../models/Staff');
const Plan = require('../models/Plan');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Super Admin Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const superAdmin = await SuperAdmin.findOne({ username });
    if (!superAdmin) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, superAdmin.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!superAdmin.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    const payload = {
      id: superAdmin._id,
      username: superAdmin.username,
      role: 'superadmin',
      email: superAdmin.email,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all restaurants with details
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}).populate('subscription.plan');
    
    // Get restaurant details with calculated subscription values
    const restaurantsWithDetails = await Promise.all(
      restaurants.map(async (restaurant) => {
        // Count staff for this restaurant
        const staffCount = await Staff.countDocuments({ restaurantId: restaurant._id });
        
        // Get subscription with dynamically calculated values
        const subscriptionData = restaurant.getSubscriptionWithCalculations();
        
        return {
          _id: restaurant._id,
          name: restaurant.name,
          adminUsername: restaurant.adminUsername,
          subscription: {
            ...subscriptionData,
            planDetails: restaurant.subscription.plan // Full plan details from populated reference
          },
          createdAt: restaurant.createdAt,
          updatedAt: restaurant.updatedAt,
          staffCount: staffCount
        };
      })
    );

    res.json(restaurantsWithDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single restaurant with all details
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate('subscription.plan');
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Get staff for this restaurant
    const staff = await Staff.find({ restaurantId: restaurant._id });

    // Get subscription with dynamically calculated values
    const subscriptionData = restaurant.getSubscriptionWithCalculations();

    res.json({
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        adminUsername: restaurant.adminUsername,
        subscription: {
          ...subscriptionData,
          planDetails: restaurant.subscription.plan // Full plan details from populated reference
        },
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      },
      staff: staff
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new restaurant
exports.createRestaurant = async (req, res) => {
  try {
    const { name, adminUsername, adminPassword, planId } = req.body;
    
    if (!name || !adminUsername || !adminPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if username exists
    const existing = await Restaurant.findOne({ adminUsername });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(adminPassword, salt);

    // Get plan or use Free Trial as default
    let plan;
    if (planId) {
      plan = await Plan.findById(planId);
    } else {
      plan = await Plan.findOne({ name: 'Free Trial' });
    }

    if (!plan) {
      return res.status(400).json({ error: 'Plan not found' });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Create restaurant
    const restaurant = new Restaurant({
      name,
      adminUsername,
      adminPassword: hashed,
      subscription: {
        plan: plan._id,
        planName: plan.name,
        startDate: startDate,
        endDate: endDate
        // isActive and daysRemaining are calculated dynamically
      }
    });
    await restaurant.save();

    // Create admin user
    const user = new User({
      username: adminUsername,
      password: hashed,
      role: 'admin',
      restaurant: restaurant._id
    });
    await user.save();

    // Get subscription with calculated values
    const subscriptionData = restaurant.getSubscriptionWithCalculations();
    
    res.json({
      message: 'Restaurant created successfully',
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        adminUsername: restaurant.adminUsername,
        subscription: subscriptionData
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, adminUsername, planId } = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Update basic info
    if (name) restaurant.name = name;
    if (adminUsername && adminUsername !== restaurant.adminUsername) {
      // Check if new username is available
      const existing = await Restaurant.findOne({ adminUsername, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      restaurant.adminUsername = adminUsername;
      
      // Update user username too
      await User.updateOne(
        { restaurant: restaurant._id, role: 'admin' },
        { username: adminUsername }
      );
    }

    // Update plan if provided
    if (planId) {
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(400).json({ error: 'Plan not found' });
      }

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
    }

    await restaurant.save();

    // Get subscription with calculated values
    const subscriptionData = restaurant.getSubscriptionWithCalculations();

    res.json({
      message: 'Restaurant updated successfully',
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        adminUsername: restaurant.adminUsername,
        subscription: subscriptionData
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Delete associated users and staff
    await User.deleteMany({ restaurant: restaurant._id });
    await Staff.deleteMany({ restaurantId: restaurant._id });

    // Delete restaurant
    await Restaurant.deleteOne({ _id: id });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get staff for a restaurant
exports.getRestaurantStaff = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const staff = await Staff.find({ restaurantId });
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===== PLAN MANAGEMENT =====

// Get all plans
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({});
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new plan
exports.createPlan = async (req, res) => {
  try {
    const { name, durationDays, price, features, isActive } = req.body;

    if (!name || durationDays === undefined || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if plan name exists
    const existing = await Plan.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'Plan name already exists' });
    }

    const plan = new Plan({
      name,
      durationDays,
      price,
      features: features || [],
      isActive: isActive !== undefined ? isActive : true
    });

    await plan.save();

    res.json({
      message: 'Plan created successfully',
      plan
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update plan
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, durationDays, price, features, isActive } = req.body;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Track if name changed for updating restaurants
    let nameChanged = false;
    
    // Check if new name is available
    if (name && name !== plan.name) {
      const existing = await Plan.findOne({ name, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: 'Plan name already exists' });
      }
      plan.name = name;
      nameChanged = true;
    }

    if (durationDays !== undefined) plan.durationDays = durationDays;
    if (price !== undefined) plan.price = price;
    if (features !== undefined) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();

    // Update planName in all restaurants using this plan (for quick access)
    if (nameChanged) {
      await Restaurant.updateMany(
        { 'subscription.plan': id },
        { $set: { 'subscription.planName': name } }
      );
    }

    res.json({
      message: 'Plan updated successfully',
      plan
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete plan
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Check if any restaurant is using this plan
    const restaurantsUsingPlan = await Restaurant.countDocuments({ 'subscription.plan': id });
    if (restaurantsUsingPlan > 0) {
      return res.status(400).json({
        error: `Cannot delete plan. ${restaurantsUsingPlan} restaurant(s) are currently using this plan.`
      });
    }

    await Plan.deleteOne({ _id: id });

    res.json({ message: 'Plan deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments({});
    const totalPlans = await Plan.countDocuments({});
    const totalStaff = await Staff.countDocuments({});
    
    // Active subscriptions
    const activeSubscriptions = await Restaurant.countDocuments({ 'subscription.isActive': true });
    
    // Expiring soon (<=7 days)
    const restaurants = await Restaurant.find({});
    let expiringSoon = 0;
    let expired = 0;
    
    for (const restaurant of restaurants) {
      restaurant.updateDaysRemaining();
      if (restaurant.subscription.isActive && restaurant.subscription.daysRemaining <= 7) {
        expiringSoon++;
      }
      if (!restaurant.subscription.isActive) {
        expired++;
      }
    }

    res.json({
      totalRestaurants,
      totalPlans,
      totalStaff,
      activeSubscriptions,
      expiringSoon,
      expired
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
