const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');

// Get all menu items for a restaurant
const getMenuItems = async (req, res) => {
  try {
    const { restaurantId, category } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    let query = { restaurantId, status: 'active' };
    if (category && category !== 'all') {
      query.categoryId = category;
    }

    const menuItems = await MenuItem.find(query).sort({ categoryId: 1, displayOrder: 1 }).populate('categoryId');
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
    const { name, description, price, cost, image, category, spiceLevel, restaurantId, isVeg, preparationTime } = req.body;

    // Find category by name to get categoryId
    let categoryId = null;
    if (category) {
      const categoryDoc = await MenuCategory.findOne({
        name: category,
        restaurantId,
        status: 'active'
      });
      if (categoryDoc) {
        categoryId = categoryDoc._id;
      }
    }

    // Find max display order within category and add 1
    const maxOrder = await MenuItem.findOne({
      categoryId,
      restaurantId
    })
    .sort('-displayOrder')
    .select('displayOrder');

    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

    const menuItem = new MenuItem({
      name,
      description,
      price,
      cost,
      image,
      category, // Keep legacy field for backward compatibility
      categoryId, // Set the proper reference
      spiceLevel: Math.min(5, Math.max(1, spiceLevel || 1)), // Clamp between 1-5
      restaurantId,
      isVeg: isVeg !== undefined ? isVeg : true,
      preparationTime: preparationTime || 15,
      displayOrder
    });

    await menuItem.save();

    // Populate category details for response
    await menuItem.populate('categoryId');

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
