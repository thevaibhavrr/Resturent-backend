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
  // Mild (30% or 40%) -> 2
  if (text.includes('mild') || text.includes('30%') || text.includes('40%')) {
    return 2;
  }
  
  // Default to mild
  return 1;
}

// Menu items data for चावल category
const chawalMenuItems = [
  {
    "name": "प्लेन राइस हाफ (Plain Rice Half)",
    "price": 60,
    "spicy_level": "🌶️ None (0%)",
    "image": "https://www.healthifyme.com/recipes/plain-rice/wp-content/uploads/sites/2/2021/05/Plain-Rice.jpg"
  },
  {
    "name": "प्लेन राइस फुल (Plain Rice Full)",
    "price": 80,
    "spicy_level": "🌶️ None (0%)",
    "image": "https://www.simplyrecipes.com/wp-content/uploads/2021/02/roti-recipe-5209201-1-1024x683.jpg"
  },
  {
    "name": "जीरा राइस हाफ (Jeera Rice Half)",
    "price": 90,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/08/jeera-rice-recipe.jpg"
  },
  {
    "name": "मसाला राइस (Masala Rice)",
    "price": 90,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/10/masala-rice-recipe.jpg"
  },
  {
    "name": "दाल चावल रिवड़ी (Dal Chawal Rivdi)",
    "price": 100,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/07/dal-chawal-recipe.jpg"
  },
  {
    "name": "पालक खिचड़ी (Palak Khichdi)",
    "price": 100,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/09/palak-khichdi-recipe.jpg"
  },
  {
    "name": "वेज पुलाव (Veg Pulao)",
    "price": 120,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://www.yummytummyaarthi.com/wp-content/uploads/2020/06/veg-pulav-500x500.jpg"
  },
  {
    "name": "मटर पुलाव (Matar Pulao)",
    "price": 110,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/05/matar-pulao-recipe.jpg"
  },
  {
    "name": "वेज बिरयानी (Veg Biryani)",
    "price": 110,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/04/veg-biryani-recipe.jpg"
  },
  {
    "name": "कश्मीरी पुलाव (Kashmiri Pulao)",
    "price": 120,
    "spicy_level": "🌶️ None (0%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/07/kashmiri-pulao-recipe.jpg"
  },
  {
    "name": "जीरा राइस पनीर (Jeera Rice Paneer)",
    "price": 120,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/04/jeera-rice-paneer-recipe.jpg"
  },
  {
    "name": "पनीर मटर पुलाव (Paneer Matar Pulao)",
    "price": 130,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://www.yummytummyaarthi.com/wp-content/uploads/2021/02/paneer-matar-pulao.jpg"
  }
];

async function addChawalMenuItems() {
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

    // Find or create चावल category
    let chawalCategory = await MenuCategory.findOne({
      restaurantId: restaurant._id,
      name: 'चावल'
    });

    if (!chawalCategory) {
      // Get max display order for categories
      const maxOrder = await MenuCategory.findOne({ 
        restaurantId: restaurant._id 
      }).sort('-displayOrder').select('displayOrder');
      
      const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

      chawalCategory = new MenuCategory({
        name: 'चावल',
        description: 'चावल और राइस व्यंजन',
        restaurantId: restaurant._id,
        displayOrder: displayOrder,
        status: 'active'
      });
      await chawalCategory.save();
      console.log('Created category: चावल');
    } else {
      console.log('Found existing category: चावल');
    }

    // Get max display order for items in this category
    const maxItemOrder = await MenuItem.findOne({ 
      categoryId: chawalCategory._id,
      restaurantId: restaurant._id 
    }).sort('-displayOrder').select('displayOrder');
    
    let displayOrder = maxItemOrder ? maxItemOrder.displayOrder + 1 : 0;

    // Add menu items
    console.log('\nAdding menu items to चावल category:');
    for (const itemData of chawalMenuItems) {
      // Check if item already exists
      const existingItem = await MenuItem.findOne({
        restaurantId: restaurant._id,
        categoryId: chawalCategory._id,
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
        category: 'चावल', // Legacy field
        categoryId: chawalCategory._id, // New field
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

    console.log('\n✅ Successfully added all menu items to चावल category!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding menu items:', error);
    process.exit(1);
  }
}

addChawalMenuItems();

