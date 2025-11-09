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
  
  // None (0%) -> 1
  if (text.includes('none') || text.includes('0%')) {
    return 1;
  }
  // Very Spicy (95%) -> 5
  if (text.includes('very spicy') || text.includes('95%')) {
    return 5;
  }
  // Spicy (80%) -> 4
  if (text.includes('spicy') && text.includes('80%')) {
    return 4;
  }
  // Medium (60%) -> 3
  if (text.includes('medium') || text.includes('60%')) {
    return 3;
  }
  // Mild (40%) -> 2
  if (text.includes('mild') || text.includes('40%')) {
    return 2;
  }
  
  // Default to mild
  return 1;
}

// Menu items data for पापड़ category
const papadMenuItems = [
  {
    "name": "पापड़ रोस्टेड (Papad Roasted)",
    "price": 10,
    "spicy_level": "🌶️ None (0%)",
    "image": "https://www.shutterstock.com/image-photo/roasted-indian-papad-flatbread-wooden-260nw-1387464650.jpg"
  },
  {
    "name": "पापड़ फ्राय (Papad Fry)",
    "price": 20,
    "spicy_level": "🌶️ Mild (40%)",
    "image": "https://www.shutterstock.com/image-photo/deepfried-indian-papad-poppadum-serving-260nw-1184519482.jpg"
  },
  {
    "name": "पापड़ फ्राय मसाला (Papad Fry Masala)",
    "price": 30,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.theyummypalate.com/wp-content/uploads/2018/07/Masala-Papad-2-500x500.jpg"
  },
  {
    "name": "रोस्टेड मसाला पापड़ (Roasted Masala Papad)",
    "price": 20,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.honeywhatscooking.com/wp-content/uploads/2024/02/masala-papad-chaat-1-500x500.jpg"
  }
];

async function addPapadMenuItems() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find restaurant by name (case-insensitive search)
    const restaurant = await Restaurant.findOne({
      name: { $regex: /sukh.*sager|sager.*sukh/i }
    });

    if (!restaurant) {
      console.log('Restaurant "hotel sukh sager" not found. Available restaurants:');
      const allRestaurants = await Restaurant.find({}, 'name');
      allRestaurants.forEach(r => console.log(`  - ${r.name}`));
      console.log('\nPlease check the restaurant name and try again.');
      process.exit(1);
    }

    console.log(`Found restaurant: ${restaurant.name} (ID: ${restaurant._id})`);

    // Find or create पापड़ category
    let papadCategory = await MenuCategory.findOne({
      restaurantId: restaurant._id,
      name: 'पापड़'
    });

    if (!papadCategory) {
      // Get max display order for categories
      const maxOrder = await MenuCategory.findOne({ 
        restaurantId: restaurant._id 
      }).sort('-displayOrder').select('displayOrder');
      
      const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

      papadCategory = new MenuCategory({
        name: 'पापड़',
        description: 'पापड़ व्यंजन',
        restaurantId: restaurant._id,
        displayOrder: displayOrder,
        status: 'active'
      });
      await papadCategory.save();
      console.log('Created category: पापड़');
    } else {
      console.log('Found existing category: पापड़');
    }

    // Get max display order for items in this category
    const maxItemOrder = await MenuItem.findOne({ 
      categoryId: papadCategory._id,
      restaurantId: restaurant._id 
    }).sort('-displayOrder').select('displayOrder');
    
    let displayOrder = maxItemOrder ? maxItemOrder.displayOrder + 1 : 0;

    // Add menu items
    console.log('\nAdding menu items to पापड़ category:');
    for (const itemData of papadMenuItems) {
      // Check if item already exists
      const existingItem = await MenuItem.findOne({
        restaurantId: restaurant._id,
        categoryId: papadCategory._id,
        name: itemData.name
      });

      if (existingItem) {
        console.log(`  ⚠️  Item "${itemData.name}" already exists, skipping...`);
        continue;
      }

      const spiceLevel = parseSpiceLevel(itemData.spicy_level);

      const menuItem = new MenuItem({
        name: itemData.name,
        price: itemData.price,
        image: itemData.image,
        category: 'पापड़', // Legacy field
        categoryId: papadCategory._id, // New field
        restaurantId: restaurant._id,
        isVeg: true,
        preparationTime: 10,
        displayOrder: displayOrder++,
        status: 'active',
        spiceLevel: spiceLevel
      });

      await menuItem.save();
      console.log(`  ✅ Added: ${itemData.name} - ₹${itemData.price} (Spice: ${spiceLevel}/5)`);
    }

    console.log('\n✅ Successfully added all menu items to पापड़ category!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding menu items:', error);
    process.exit(1);
  }
}

addPapadMenuItems();

