const MenuItem = require('../models/MenuItem');

// Create new menu item
exports.createItem = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      categoryId, 
      restaurantId,
      image,
      isVeg,
      preparationTime 
    } = req.body;
    
    // Find max display order within category and add 1
    const maxOrder = await MenuItem.findOne({ 
      categoryId,
      restaurantId 
    })
    .sort('-displayOrder')
    .select('displayOrder');
    
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
    
    const item = await MenuItem.create({ 
      name,
      description,
      price,
      categoryId,
      restaurantId,
      image,
      isVeg,
      preparationTime,
      displayOrder
    });
    
    // Populate category details
    await item.populate('categoryId');
    
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all items for a restaurant
exports.getItems = async (req, res) => {
  try {
    const { restaurantId, categoryId } = req.query;
    
    const query = { 
      restaurantId,
      status: 'active'
    };
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    const items = await MenuItem.find(query)
      .populate('categoryId')
      .sort('displayOrder');
      
    res.json(items);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update menu item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByIdAndUpdate(
      id, 
      req.body,
      { new: true }
    ).populate('categoryId');
    
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete item (soft delete by setting status to inactive)
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update display order
exports.updateOrder = async (req, res) => {
  try {
    const { orders } = req.body;
    
    // Update each item's display order
    await Promise.all(
      orders.map(({ id, displayOrder }) => 
        MenuItem.findByIdAndUpdate(id, { displayOrder })
      )
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};