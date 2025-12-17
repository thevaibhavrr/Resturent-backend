// cleanupMenu.js
const mongoose = require('mongoose');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

// Database connection
mongoose.connect('mongodb+srv://vaibhavrathorema:TVwlwvr0AAngekdd@tixteen-local.v4n3zfm.mongodb.net/resturent-management?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const restaurantId = '69419afe8d0ef748733e7d08';

async function cleanupMenu() {
  try {
    // Delete all menu items for the restaurant
    const itemsResult = await MenuItem.deleteMany({ 
      restaurantId: new mongoose.Types.ObjectId(restaurantId) 
    });
    
    console.log(`Deleted ${itemsResult.deletedCount} menu items`);

    // Delete all categories for the restaurant
    const categoriesResult = await MenuCategory.deleteMany({ 
      restaurantId: new mongoose.Types.ObjectId(restaurantId) 
    });
    
    console.log(`Deleted ${categoriesResult.deletedCount} menu categories`);

    console.log('Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupMenu();
