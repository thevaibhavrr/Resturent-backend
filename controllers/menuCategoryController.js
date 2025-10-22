const MenuCategory = require('../models/MenuCategory');

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
    const { restaurantId } = req.query;
    const categories = await MenuCategory.find({ 
      restaurantId,
      status: 'active' 
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
    const category = await MenuCategory.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true }
    );
    res.json(category);
  } catch (err) {
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