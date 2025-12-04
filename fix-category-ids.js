const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const MenuCategory = require('./models/MenuCategory');
require('dotenv').config();

async function fixCategoryIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_db');
    console.log('Connected to MongoDB');

    const restaurantId = '692adbcd8190e7a502218ea9';

    // Find all menu items that have category but no categoryId
    const itemsToFix = await MenuItem.find({
      restaurantId,
      category: { $exists: true, $ne: null },
      $or: [
        { categoryId: { $exists: false } },
        { categoryId: null }
      ]
    });

    console.log(`Found ${itemsToFix.length} items to fix`);

    for (const item of itemsToFix) {
      try {
        // Find category by name
        const categoryDoc = await MenuCategory.findOne({
          name: item.category,
          restaurantId,
          status: 'active'
        });

        if (categoryDoc) {
          await MenuItem.findByIdAndUpdate(item._id, {
            categoryId: categoryDoc._id
          });
          console.log(`✅ Fixed ${item.name}: assigned categoryId ${categoryDoc._id}`);
        } else {
          console.log(`⚠️ Could not find category for ${item.name} with category "${item.category}"`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${item._id}:`, error);
      }
    }

    console.log('Category ID fix completed');

  } catch (error) {
    console.error('Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixCategoryIds();
