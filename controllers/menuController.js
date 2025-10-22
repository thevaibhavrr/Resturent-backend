const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

// Get all menu items for a restaurant
const getMenuItems = async (req, res) => {
  try {
    const { restaurantId, category } = req.query;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    let query = { restaurantId, status: 'active' };
    if (category && category !== 'all') {
      query.category = category;
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

// Get all categories for a restaurant
const getCategories = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const categories = await Category.find({ restaurantId, status: 'active' }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Create a new menu item
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, image, category, spiceLevel, restaurantId } = req.body;
    
    const menuItem = new MenuItem({
      name,
      description,
      price,
      image,
      category,
      spiceLevel: spiceLevel || 1,
      restaurantId
    });

    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, description, icon, restaurantId } = req.body;
    
    const category = new Category({
      name,
      description,
      icon,
      restaurantId
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const menuItem = await MenuItem.findByIdAndUpdate(id, updateData, { new: true });
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByIdAndDelete(id);
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

module.exports = {
  getMenuItems,
  getCategories,
  createMenuItem,
  createCategory,
  updateMenuItem,
  deleteMenuItem
};
