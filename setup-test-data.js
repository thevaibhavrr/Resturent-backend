const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const Space = require('./models/Space');
require('dotenv').config();

async function setupTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_db');
    console.log('Connected to MongoDB');

    // Get first restaurant ID
    const firstItem = await MenuItem.findOne({});
    if (!firstItem) {
      console.log('No menu items found');
      return;
    }

    const restaurantId = firstItem.restaurantId;

    // Set base prices for first 5 items
    const items = await MenuItem.find({ restaurantId }).limit(5);

    for (let i = 0; i < items.length; i++) {
      const basePrice = 50 + (i * 20); // 50, 70, 90, 110, 130
      await MenuItem.findByIdAndUpdate(items[i]._id, { basePrice });
      console.log(`Set base price ₹${basePrice} for ${items[i].name}`);
    }

    // Create a test space if none exists
    let space = await Space.findOne({ restaurantId });
    if (!space) {
      space = new Space({
        name: 'Test Hall',
        restaurantId: restaurantId
      });
      await space.save();
      console.log(`Created test space: ${space.name}`);
    } else {
      console.log(`Using existing space: ${space.name}`);
    }

    console.log('✅ Test data setup completed');

  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupTestData();
