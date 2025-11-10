const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const MenuCategory = require('./models/MenuCategory');
const Restaurant = require('./models/Restaurant');
require('dotenv').config();

const connectDB = require('./config/db');

// Helper function to convert spicy_level text to numeric value (1-5 scale)
function parseSpiceLevel(spicyLevelText) {
  if (!spicyLevelText) return 1;
  
  const text = spicyLevelText.toLowerCase();
  
  // Extract percentage from text (e.g., "60%" or "(60%)")
  const percentMatch = text.match(/(\d+)%/);
  const percent = percentMatch ? parseInt(percentMatch[1]) : 0;
  
  // None (0%) -> 1
  if (text.includes('none') || percent === 0) {
    return 1;
  }
  
  // Very Spicy (90% or 95%) -> 5
  if (percent >= 90 || text.includes('very spicy')) {
    return 5;
  }
  // Spicy (80%) -> 4
  if (percent >= 80 || (text.includes('spicy') && percent >= 70)) {
    return 4;
  }
  // Medium (50% to 70%) -> 3
  if (percent >= 50 && percent < 80 || text.includes('medium')) {
    return 3;
  }
  // Mild (30% to 50%) -> 2
  if (percent >= 30 && percent < 50 || text.includes('mild')) {
    return 2;
  }
  
  // Default to mild
  return 1;
}

// Helper function to extract price from string like "20/-" or "20"
function parsePrice(priceString) {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  
  // Extract number from string (e.g., "20/-" -> 20)
  const match = priceString.toString().match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Menu items data for सलाद category
const saladMenuItems = [
  {
    "name": "ओनियन सलाद (Onion Salad)",
    "price": "20/-",
    "spicy_level": "🌶️ Mild",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/02/onion-salad-recipe-1.jpg"
  },
  {
    "name": "टमाटर सलाद (Tomato Salad)",
    "price": "30/-",
    "spicy_level": "🌶️ None",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2012/07/tomato-salad-recipe-1.jpg"
  },
  {
    "name": "ककड़ी/ककुंबर सलाद (Cucumber Salad)",
    "price": "40/-",
    "spicy_level": "🌶️ None",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2022/03/cucumber-salad-recipe.jpg"
  },
  {
    "name": "ग्रीन सलाद (Green Salad)",
    "price": "40/-",
    "spicy_level": "🌶️ Mild",
    "image": "https://www.cookwithmanali.com/wp-content/uploads/2021/03/Indian-Green-Salad.jpg"
  }
];

async function addSaladMenuItems() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find Sukh Sager Hotel restaurant
    const restaurant = await Restaurant.findOne({ 
      name: { $regex: /sukh.*sager|sager.*sukh/i } 
    });

    if (!restaurant) {
      console.error('Restaurant "Sukh Sager Hotel" not found');
      process.exit(1);
    }

    console.log(`Found restaurant: ${restaurant.name} (ID: ${restaurant._id})`);

    // Find or create सलाद category
    let category = await MenuCategory.findOne({ 
      name: 'सलाद',
      restaurantId: restaurant._id 
    });

    if (!category) {
      console.log('Creating सलाद category...');
      // Find max display order
      const maxOrder = await MenuCategory.findOne({ restaurantId: restaurant._id })
        .sort('-displayOrder')
        .select('displayOrder');
      
      const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

      category = await MenuCategory.create({
        name: 'सलाद',
        description: 'Fresh salads',
        restaurantId: restaurant._id,
        displayOrder
      });
      console.log(`✅ Created category: ${category.name} (ID: ${category._id})`);
    } else {
      console.log(`✅ Found category: ${category.name} (ID: ${category._id})`);
    }

    // Add menu items
    console.log('\nAdding menu items...');
    let addedCount = 0;
    let skippedCount = 0;

    for (const itemData of saladMenuItems) {
      // Check if item already exists
      const existingItem = await MenuItem.findOne({
        name: itemData.name,
        restaurantId: restaurant._id
      });

      if (existingItem) {
        console.log(`⏭️  Skipped (already exists): ${itemData.name}`);
        skippedCount++;
        continue;
      }

      const price = parsePrice(itemData.price);
      const spiceLevel = parseSpiceLevel(itemData.spicy_level);

      const menuItem = await MenuItem.create({
        name: itemData.name,
        price: price,
        spiceLevel: spiceLevel,
        spicePercent: spiceLevel === 1 ? 0 : (spiceLevel - 1) * 25, // Convert 1-5 to 0-100
        category: 'सलाद', // Keep for backward compatibility
        categoryId: category._id,
        image: itemData.image || '',
        restaurantId: restaurant._id,
        isAvailable: true,
        isVeg: true
      });

      console.log(`✅ Added: ${itemData.name} - ₹${price} - Spice: ${spiceLevel}/5`);
      addedCount++;
    }

    console.log(`\n✅ Done! Added ${addedCount} items, skipped ${skippedCount} items.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addSaladMenuItems();

