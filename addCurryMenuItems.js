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
  
  // Count chilli emojis (🌶️)
  const chilliCount = (spicyLevelText.match(/🌶️/g) || []).length;
  
  // Check for keywords
  const hasVerySpicy = text.includes('very spicy') || text.includes('extra hot');
  const hasSpicy = text.includes('spicy') && !text.includes('mild');
  const hasMedium = text.includes('medium');
  const hasMild = text.includes('mild');
  const hasNone = text.includes('none');
  
  // Very Spicy (90%+ or 3+ chillis or "very spicy") -> 5
  if (percent >= 90 || hasVerySpicy || chilliCount >= 3) {
    return 5;
  }
  
  // Spicy (80%+ or 2 chillis with "spicy" keyword) -> 4
  if (percent >= 80 || (hasSpicy && chilliCount >= 2) || (chilliCount === 3 && !hasMedium)) {
    return 4;
  }
  
  // Medium (50-79% or 2 chillis or "medium" keyword) -> 3
  if ((percent >= 50 && percent < 80) || hasMedium || chilliCount === 2) {
    return 3;
  }
  
  // Mild (30-49% or 1 chilli or "mild" keyword) -> 2
  if ((percent >= 30 && percent < 50) || hasMild || chilliCount === 1) {
    return 2;
  }
  
  // None -> 1
  if (hasNone || percent === 0) {
    return 1;
  }
  
  // Default to mild (1)
  return 1;
}

// Helper function to extract price from string like "180" or "180/-"
function parsePrice(priceString) {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  
  // Extract number from string (e.g., "180" or "180/-" -> 180)
  const match = priceString.toString().match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Menu items data for करी category
const curryMenuItems = [
  {
    "name": "काजू करी (Kaju Curry)",
    "price": "180",
    "spicy_level": "🌶️ Mild",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2013/06/kaju-curry-recipe-1.jpg"
  },
  {
    "name": "काजू पनीर (Kaju Paneer)",
    "price": "190",
    "spicy_level": "🌶️🌶️ Medium",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2022/04/kaju-paneer-curry.jpg"
  },
  {
    "name": "मसाला (Masala)",
    "price": "190",
    "spicy_level": "🌶️🌶️🌶️ Spicy",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2019/01/mixed-vegetable-masala-1.jpg"
  },
  {
    "name": "काजू मसाला (Kaju Masala)",
    "price": "200",
    "spicy_level": "🌶️🌶️ Medium",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/02/kaju-masala-recipe-1.jpg"
  }
];

async function addCurryMenuItems() {
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

    // Find or create करी category
    let category = await MenuCategory.findOne({ 
      name: 'करी',
      restaurantId: restaurant._id 
    });

    if (!category) {
      console.log('Creating करी category...');
      // Find max display order
      const maxOrder = await MenuCategory.findOne({ restaurantId: restaurant._id })
        .sort('-displayOrder')
        .select('displayOrder');
      
      const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

      category = await MenuCategory.create({
        name: 'करी',
        description: 'Curry dishes',
        restaurantId: restaurant._id,
        displayOrder
      });
      console.log(`✅ Created category: ${category.name} (ID: ${category._id})`);
    } else {
      console.log(`✅ Found category: ${category.name} (ID: ${category._id})`);
    }

    // Get max display order for items in this category
    const maxItemOrder = await MenuItem.findOne({ 
      categoryId: category._id,
      restaurantId: restaurant._id 
    }).sort('-displayOrder').select('displayOrder');
    
    let displayOrder = maxItemOrder ? maxItemOrder.displayOrder + 1 : 0;

    // Add menu items
    console.log('\nAdding menu items...');
    let addedCount = 0;
    let skippedCount = 0;

    for (const itemData of curryMenuItems) {
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
      const spicePercent = spiceLevel === 1 ? 0 : (spiceLevel - 1) * 25; // Convert 1-5 to 0-100

      const menuItem = await MenuItem.create({
        name: itemData.name,
        price: price,
        spiceLevel: spiceLevel,
        spicePercent: spicePercent,
        category: 'करी', // Keep for backward compatibility
        categoryId: category._id,
        image: itemData.image || '',
        restaurantId: restaurant._id,
        isAvailable: true,
        isVeg: true,
        preparationTime: 20,
        displayOrder: displayOrder++
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

addCurryMenuItems();

