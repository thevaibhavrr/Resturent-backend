const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const MenuCategory = require('./models/MenuCategory');
const Restaurant = require('./models/Restaurant');
require('dotenv').config();

const connectDB = require('./config/db');

const sampleCategories = [
  { name: 'Appetizers', description: 'Start your meal with our delicious appetizers', icon: '🥗' },
  { name: 'Main Course', description: 'Hearty main dishes', icon: '🍖' },
  { name: 'Desserts', description: 'Sweet endings to your meal', icon: '🍰' },
  { name: 'Beverages', description: 'Refreshing drinks', icon: '🥤' },
  { name: 'Soups', description: 'Warm and comforting soups', icon: '🍲' }
];

const sampleMenuItems = [
  // Appetizers
  { name: 'Caesar Salad', description: 'Fresh romaine lettuce with caesar dressing', price: 12.99, category: 'Appetizers', spiceLevel: 1, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400' },
  { name: 'Bruschetta', description: 'Toasted bread with tomatoes and basil', price: 8.99, category: 'Appetizers', spiceLevel: 1, image: 'https://images.unsplash.com/photo-1572441713132-51c75654db73?w=400' },
  { name: 'Chicken Wings', description: 'Spicy buffalo wings with ranch dip', price: 14.99, category: 'Appetizers', spiceLevel: 3, image: 'https://images.unsplash.com/photo-1567620832904-9fe5cf23db13?w=400' },
  
  // Main Course
  { name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with herbs', price: 24.99, category: 'Main Course', spiceLevel: 1, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400' },
  { name: 'Beef Steak', description: 'Premium ribeye steak cooked to perfection', price: 28.99, category: 'Main Course', spiceLevel: 2, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400' },
  { name: 'Chicken Curry', description: 'Spicy Indian chicken curry with rice', price: 18.99, category: 'Main Course', spiceLevel: 4, image: 'https://images.unsplash.com/photo-1563379091339-03246963d4f0?w=400' },
  { name: 'Pasta Carbonara', description: 'Creamy pasta with bacon and parmesan', price: 16.99, category: 'Main Course', spiceLevel: 1, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400' },
  
  // Desserts
  { name: 'Chocolate Cake', description: 'Rich chocolate cake with ganache', price: 9.99, category: 'Desserts', spiceLevel: 1, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
  { name: 'Tiramisu', description: 'Classic Italian dessert with coffee and mascarpone', price: 11.99, category: 'Desserts', spiceLevel: 1, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
  
  // Beverages
  { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 4.99, category: 'Beverages', spiceLevel: 1, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400' },
  { name: 'Iced Coffee', description: 'Cold brew coffee with ice', price: 3.99, category: 'Beverages', spiceLevel: 1, image: 'https://images.unsplash.com/photo-1461023058943-07fbe308b5ba?w=400' },
  { name: 'Green Tea', description: 'Premium green tea leaves', price: 2.99, category: 'Beverages', spiceLevel: 1, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' },
  
  // Soups
  { name: 'Tomato Soup', description: 'Creamy tomato soup with basil', price: 6.99, category: 'Soups', spiceLevel: 2, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400' },
  { name: 'Chicken Noodle Soup', description: 'Hearty chicken soup with noodles', price: 8.99, category: 'Soups', spiceLevel: 2, image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400' }
];

async function seedMenuData() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get the latest restaurant
    const restaurant = await Restaurant.findOne().sort({ createdAt: -1 });
    if (!restaurant) {
      console.log('No restaurant found. Please create a restaurant first.');
      return;
    }

    console.log('Seeding data for restaurant:', restaurant.name);

    // Clear existing data
    await MenuCategory.deleteMany({ restaurantId: restaurant._id });
    await MenuItem.deleteMany({ restaurantId: restaurant._id });

    // Create categories
    const createdCategories = [];
    for (const categoryData of sampleCategories) {
      const category = new MenuCategory({
        ...categoryData,
        restaurantId: restaurant._id
      });
      await category.save();
      createdCategories.push(category);
      console.log('Created category:', category.name);
    }

    // Create menu items
    for (const itemData of sampleMenuItems) {
      const menuItem = new MenuItem({
        ...itemData,
        restaurantId: restaurant._id
      });
      await menuItem.save();
      console.log('Created menu item:', menuItem.name);
    }

    console.log('Menu data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding menu data:', error);
    process.exit(1);
  }
}

seedMenuData();
