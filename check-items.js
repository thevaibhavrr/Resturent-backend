const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
require('dotenv').config();

async function checkItems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_db');
    console.log('Connected to MongoDB');

    // Check items with price field
    const itemsWithPrice = await MenuItem.find({
      price: { $exists: true, $type: 'number' }
    }).limit(3);

    console.log(`Found ${itemsWithPrice.length} items with numeric price field`);

    if (itemsWithPrice.length > 0) {
      console.log('Items with price field:');
      itemsWithPrice.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}: price = ${item.price}, basePrice = ${item.basePrice}`);
      });
    }

    // Check all items
    const items = await MenuItem.find({ status: 'active' }).limit(3);

    console.log('Sample menu items:');
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}:`);
      console.log(`   - price: ${item.price}`);
      console.log(`   - basePrice: ${item.basePrice}`);
      console.log(`   - All fields:`, Object.keys(item.toObject()));
      console.log('');
    });

  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkItems();
