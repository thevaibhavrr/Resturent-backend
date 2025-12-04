const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const MenuItemPrice = require('./models/MenuItemPrice');
require('dotenv').config();

async function migratePrices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_db');
    console.log('Connected to MongoDB');

    // Get all menu items with prices
    const items = await MenuItem.find({
      price: { $exists: true, $ne: null },
      status: 'active'
    });

    console.log(`Found ${items.length} menu items to migrate`);

    const migrationPromises = items.map(async (item) => {
      try {
        // Update basePrice from existing price
        await MenuItem.findByIdAndUpdate(item._id, {
          basePrice: item.price
        });

        console.log(`Migrated item: ${item.name} (basePrice: ${item.price})`);
      } catch (error) {
        console.error(`Error migrating item ${item._id}:`, error);
      }
    });

    await Promise.all(migrationPromises);

    console.log('Migration completed successfully');

    // Optional: Remove the old price field after confirming migration
    // await MenuItem.updateMany({}, { $unset: { price: 1 } });
    // console.log('Old price field removed');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migratePrices();
