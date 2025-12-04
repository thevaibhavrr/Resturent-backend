const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const MenuItemPrice = require('./models/MenuItemPrice');
const Space = require('./models/Space');
require('dotenv').config();

async function testSpacePricing() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_db');
    console.log('Connected to MongoDB');

    // Get first menu item and first space for testing (any restaurant)
    const menuItem = await MenuItem.findOne({ status: 'active' });
    const space = await Space.findOne({ status: 'active' });

    if (!menuItem) {
      console.log('No active menu items found in database');
      return;
    }

    if (!space) {
      console.log('No active spaces found in database');
      return;
    }

    const restaurantId = menuItem.restaurantId;

    if (!menuItem || !space) {
      console.log('No menu item or space found for testing');
      return;
    }

    console.log(`Testing with Menu Item: ${menuItem.name} (Base Price: ₹${menuItem.basePrice})`);
    console.log(`Testing with Space: ${space.name}`);

    // Check if space-specific price already exists
    let existingSpacePrice = await MenuItemPrice.findOne({
      menuItemId: menuItem._id,
      spaceId: space._id,
      restaurantId: restaurantId
    });

    let spacePrice;
    if (existingSpacePrice) {
      console.log(`ℹ️ Space-specific price already exists: ₹${existingSpacePrice.price} for ${space.name}`);
      spacePrice = existingSpacePrice.price;
    } else {
      // Create a space-specific price (₹10 more than base price)
      spacePrice = menuItem.basePrice + 10;

      const newSpacePrice = new MenuItemPrice({
        menuItemId: menuItem._id,
        spaceId: space._id,
        price: spacePrice,
        restaurantId: restaurantId
      });

      await newSpacePrice.save();
      console.log(`✅ Created space-specific price: ₹${spacePrice} for ${space.name}`);
    }

    // Test the getItemPriceForSpace function
    const { getItemPriceForSpace } = require('./controllers/billController');

    const retrievedPrice = await getItemPriceForSpace(menuItem._id, space._id, restaurantId);
    console.log(`✅ Retrieved space-specific price: ₹${retrievedPrice}`);

    if (retrievedPrice === spacePrice) {
      console.log('🎉 Space-specific pricing is working correctly!');
    } else {
      console.log('❌ Space-specific pricing is not working correctly');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run test
testSpacePricing();
