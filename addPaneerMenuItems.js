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
  
  // Default to medium
  return 3;
}

// Menu items data for पनीर category
const paneerMenuItems = [
  {
    "name": "पनीर लबाबदार (Paneer Lababdar)",
    "price": 180,
    "spicy_level": "🌶️ Medium (60%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2022/04/paneer-lababdar-recipe.jpg"
  },
  {
    "name": "पनीर चटपटा (Paneer Chatpata)",
    "price": 170,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.yummytummyaarthi.com/wp-content/uploads/2021/03/paneer-chatpata-1.jpg"
  },
  {
    "name": "पालक पनीर (Palak Paneer)",
    "price": 140,
    "spicy_level": "🌶️ Mild (40%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/04/palak-paneer-recipe.jpg"
  },
  {
    "name": "पनीर मसाला (Paneer Masala)",
    "price": 160,
    "spicy_level": "🌶️ Medium (60%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/05/paneer-masala-recipe-1-1024x1536.jpg"
  },
  {
    "name": "पनीर हांडी (Paneer Handi)",
    "price": 180,
    "spicy_level": "🌶️ Medium (60%)",
    "image": "https://www.cookingfromheart.com/wp-content/uploads/2019/03/Paneer-Handi-2.jpg"
  },
  {
    "name": "बटर पनीर मसाला (Butter Paneer Masala)",
    "price": 170,
    "spicy_level": "🌶️ Mild (40%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/07/butter-paneer-masala-recipe.jpg"
  },
  {
    "name": "पनीर हक्का टका (Paneer Hakka Taka)",
    "price": 170,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://i.ytimg.com/vi/fN5Zp8ykA3E/maxresdefault.jpg"
  },
  {
    "name": "कढ़ाई पनीर (Kadhai Paneer)",
    "price": 160,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/04/kadai-paneer-recipe.jpg"
  },
  {
    "name": "शाही पनीर (Shahi Paneer)",
    "price": 160,
    "spicy_level": "🌶️ Mild (40%)",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2021/04/shahi-paneer-recipe-1.jpg"
  },
  {
    "name": "पनीर 2 प्याज (Paneer Do Pyaza)",
    "price": 170,
    "spicy_level": "🌶️ Medium (60%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/11/paneer-do-pyaza.jpg"
  },
  {
    "name": "पनीर भुर्जी (Paneer Bhurji)",
    "price": 190,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/11/paneer-bhurji-recipe.jpg"
  },
  {
    "name": "पनीर टिक्का मसाला (Paneer Tikka Masala)",
    "price": 180,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/07/paneer-tikka-masala-recipe.jpg"
  },
  {
    "name": "पनीर तुफानी (Paneer Tufani)",
    "price": 170,
    "spicy_level": "🌶️🌶️🌶️ Very Spicy (95%)",
    "image": "https://i.ytimg.com/vi/5MgwoD4Qk5Y/maxresdefault.jpg"
  },
  {
    "name": "मटर पनीर (Matar Paneer)",
    "price": 150,
    "spicy_level": "🌶️ Medium (60%)",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/06/matar-paneer-recipe.jpg"
  }
];

async function addPaneerMenuItems() {
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

    // Find or create पनीर category
    let paneerCategory = await MenuCategory.findOne({
      restaurantId: restaurant._id,
      name: 'पनीर'
    });

    if (!paneerCategory) {
      // Get max display order for categories
      const maxOrder = await MenuCategory.findOne({ 
        restaurantId: restaurant._id 
      }).sort('-displayOrder').select('displayOrder');
      
      const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

      paneerCategory = new MenuCategory({
        name: 'पनीर',
        description: 'पनीर व्यंजन',
        restaurantId: restaurant._id,
        displayOrder: displayOrder,
        status: 'active'
      });
      await paneerCategory.save();
      console.log('Created category: पनीर');
    } else {
      console.log('Found existing category: पनीर');
    }

    // Get max display order for items in this category
    const maxItemOrder = await MenuItem.findOne({ 
      categoryId: paneerCategory._id,
      restaurantId: restaurant._id 
    }).sort('-displayOrder').select('displayOrder');
    
    let displayOrder = maxItemOrder ? maxItemOrder.displayOrder + 1 : 0;

    // Add menu items
    console.log('\nAdding menu items to पनीर category:');
    for (const itemData of paneerMenuItems) {
      // Check if item already exists
      const existingItem = await MenuItem.findOne({
        restaurantId: restaurant._id,
        categoryId: paneerCategory._id,
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
        category: 'पनीर', // Legacy field
        categoryId: paneerCategory._id, // New field
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

    console.log('\n✅ Successfully added all menu items to पनीर category!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding menu items:', error);
    process.exit(1);
  }
}

addPaneerMenuItems();

