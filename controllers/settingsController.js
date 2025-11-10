const Restaurant = require('../models/Restaurant');

/**
 * Get restaurant settings
 * @description Retrieves all settings for a restaurant by restaurantId
 * @param req - Express request object with restaurantId in params
 * @param res - Express response object
 * @returns JSON response with restaurant settings
 */
exports.getSettings = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Verify user has access to this restaurant (if authenticated)
    if (req.user && req.user.restaurantId && req.user.restaurantId !== restaurantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Return settings
    res.json({
      name: restaurant.name || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      website: restaurant.website || '',
      gstin: restaurant.gstin || '',
      logo: restaurant.logo || '',
      description: restaurant.description || ''
    });
  } catch (err) {
    console.error('Error fetching restaurant settings:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update restaurant settings
 * @description Updates restaurant settings (name, address, phone, email, website, gstin, logo, description)
 * @param req - Express request object with restaurantId in params and settings in body
 * @param res - Express response object
 * @returns JSON response with success message and updated settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, address, phone, email, website, gstin, logo, description } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Verify user has access to this restaurant
    if (!req.user || !req.user.restaurantId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.restaurantId !== restaurantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Update settings fields
    if (name !== undefined) restaurant.name = name;
    if (address !== undefined) restaurant.address = address;
    if (phone !== undefined) restaurant.phone = phone;
    if (email !== undefined) restaurant.email = email;
    if (website !== undefined) restaurant.website = website;
    if (gstin !== undefined) restaurant.gstin = gstin;
    if (logo !== undefined) restaurant.logo = logo;
    if (description !== undefined) restaurant.description = description;

    await restaurant.save();

    res.json({
      message: 'Settings updated successfully',
      settings: {
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        email: restaurant.email,
        website: restaurant.website,
        gstin: restaurant.gstin,
        logo: restaurant.logo,
        description: restaurant.description
      }
    });
  } catch (err) {
    console.error('Error updating restaurant settings:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

