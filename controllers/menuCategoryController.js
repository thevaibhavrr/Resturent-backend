const MenuCategory = require('../models/MenuCategory');
const mongoose = require('mongoose');

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, restaurantId } = req.body;
    
    // Find max display order and add 1
    const maxOrder = await MenuCategory.findOne({ restaurantId })
      .sort('-displayOrder')
      .select('displayOrder');
    
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
    
    const category = await MenuCategory.create({ 
      name, 
      description, 
      restaurantId,
      displayOrder
    });
    
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all categories for a restaurant
exports.getCategories = async (req, res) => {
  try {
    const { restaurantId, includeInactive } = req.query;
    const categories = await MenuCategory.find({
      restaurantId,
      status: includeInactive === 'true' ? { $in: ['active', 'inactive'] } : 'active'
    }).sort('displayOrder');
    res.json(categories);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, restaurantId } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid category ID format' });
    }
    
    // Build update object
    const updateData = {
      name: name.trim(),
      description: description || ''
    };
    
    // Include restaurantId if provided (for validation)
    if (restaurantId) {
      updateData.restaurantId = restaurantId;
    }
    
    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);
    
    const category = await MenuCategory.findByIdAndUpdate(
      objectId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(400).json({ error: err.message });
  }
};

// Delete category (soft delete by setting status to inactive)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await MenuCategory.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Reactivate category (set status back to active)
exports.reactivateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await MenuCategory.findByIdAndUpdate(
      id,
      { status: 'active' },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update display order
exports.updateOrder = async (req, res) => {
  try {
    const { orders } = req.body;
    
    // Update each category's display order
    await Promise.all(
      orders.map(({ id, displayOrder }) => 
        MenuCategory.findByIdAndUpdate(id, { displayOrder })
      )
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};