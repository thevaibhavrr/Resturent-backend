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

// Menu items data for रोटी category
const rotiMenuItems = [
  {
    "name": "प्लेन रोटी (Plain Roti)",
    "price": 10,
    "spicy_level": "🌶️ None (0%)",
    "image": "https://www.simplyrecipes.com/wp-content/uploads/2021/02/roti-recipe-5209201-1-1024x683.jpg"
  },
  {
    "name": "बटर रोटी (Butter Roti)",
    "price": 12,
    "spicy_level": "🌶️ None (0%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/03/tandoori-roti-butter-roti.jpg"
  },
  {
    "name": "तवा रोटी (Tawa Roti)",
    "price": 15,
    "spicy_level": "🌶️ None (0%)",
    "image": "https://raasakarts.com/gupta-dhabha-raasa-kart-480/product/Plain%20Tawa%20Roti.jpg"
  },
  {
    "name": "तवा पराठा (Tawa Paratha)",
    "price": 20,
    "spicy_level": "🌶️ Mild (40%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/06/plain-paratha-recipe-2.jpg"
  },
  {
    "name": "तंदूरी पराठा (Tandoori Paratha)",
    "price": 30,
    "spicy_level": "🌶️ Mild (40%)",
    "image": "https://www.cookwithmanali.com/wp-content/uploads/2020/10/Tandoori-Paratha-500x500.jpg"
  },
  {
    "name": "लच्छा पराठा (Lachha Paratha)",
    "price": 30,
    "spicy_level": "🌶️ Mild (40%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/06/laccha-paratha-recipe-1.jpg"
  },
  {
    "name": "मक्का रोटी (Makka Roti)",
    "price": 30,
    "spicy_level": "🌶️ None (0%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/11/makki-ki-roti.jpg"
  },
  {
    "name": "मिस्सी रोटी (Missi Roti)",
    "price": 40,
    "spicy_level": "🌶️ Mild (40%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/04/missi-roti-recipe-1.jpg"
  },
  {
    "name": "प्लेन नान (Plain Naan)",
    "price": 40,
    "spicy_level": "🌶️ None (0%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/03/naan-recipe-500x500.jpg"
  },
  {
    "name": "मटर पराठा (Matar Paratha)",
    "price": 40,
    "spicy_level": "🌶️ Medium (60%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/04/matar-paratha-recipe-1.jpg"
  },
  {
    "name": "आलू पराठा (Aloo Paratha)",
    "price": 40,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/03/aloo-paratha.jpg"
  },
  {
    "name": "ओनियन पराठा (Onion Paratha)",
    "price": 40,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/04/onion-paratha-recipe-1.jpg"
  },
  {
    "name": "गोभी पराठा (Gobi Paratha)",
    "price": 40,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/04/gobi-paratha-recipe-1.jpg"
  },
  {
    "name": "मिक्स वेज (सैंच) पराठा (Mix Veg/Saench Paratha)",
    "price": 40,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/07/mixed-vegetable-paratha.jpg"
  },
  {
    "name": "पनीर पराठा (Paneer Paratha)",
    "price": 70,
    "spicy_level": "🌶️ Medium (60%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/04/paneer-paratha-recipe-1.jpg"
  }
];

async function addRotiMenuItems() {
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

    // Find or create रोटी category
    let rotiCategory = await MenuCategory.findOne({
      restaurantId: restaurant._id,
      name: 'रोटी'
    });

    if (!rotiCategory) {
      // Get max display order for categories
      const maxOrder = await MenuCategory.findOne({ 
        restaurantId: restaurant._id 
      }).sort('-displayOrder').select('displayOrder');
      
      const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

      rotiCategory = new MenuCategory({
        name: 'रोटी',
        description: 'रोटी और पराठा',
        restaurantId: restaurant._id,
        displayOrder: displayOrder,
        status: 'active'
      });
      await rotiCategory.save();
      console.log('Created category: रोटी');
    } else {
      console.log('Found existing category: रोटी');
    }

    // Get max display order for items in this category
    const maxItemOrder = await MenuItem.findOne({ 
      categoryId: rotiCategory._id,
      restaurantId: restaurant._id 
    }).sort('-displayOrder').select('displayOrder');
    
    let displayOrder = maxItemOrder ? maxItemOrder.displayOrder + 1 : 0;

    // Add menu items
    console.log('\nAdding menu items to रोटी category:');
    for (const itemData of rotiMenuItems) {
      // Check if item already exists
      const existingItem = await MenuItem.findOne({
        restaurantId: restaurant._id,
        categoryId: rotiCategory._id,
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
        category: 'रोटी', // Legacy field
        categoryId: rotiCategory._id, // New field
        restaurantId: restaurant._id,
        isVeg: true,
        preparationTime: 15,
        displayOrder: displayOrder++,
        status: 'active',
        spiceLevel: spiceLevel
      });

      await menuItem.save();
      console.log(`  ✅ Added: ${itemData.name} - ₹${itemData.price} (Spice: ${spiceLevel}/5)`);
    }

    console.log('\n✅ Successfully added all menu items to रोटी category!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding menu items:', error);
    process.exit(1);
  }
}

addRotiMenuItems();

