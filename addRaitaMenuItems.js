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

// Helper function to extract price from string like "20/-" or "20"
function parsePrice(priceString) {
  if (typeof priceString === 'number') {
    return priceString;
  }
  if (typeof priceString === 'string') {
    // Extract number from strings like "20/-", "20", "₹20", etc.
    const match = priceString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }
  return 0;
}

// Menu items data for रायता category
const raitaMenuItems = [
  {
    "name": "प्लेन छाछ स्पेशल (Plain Chaas Special)",
    "price": "20/-",
    "spicy_level": "🌶️ None",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2018/05/chaas-recipe-1.jpg"
  },
  {
    "name": "नमकीन छाछ (Namkeen Chaas)",
    "price": "20/-",
    "spicy_level": "🌶️ Mild",
    "image": "https://www.cookwithmanali.com/wp-content/uploads/2020/05/Indian-Chaas-Buttermilk.jpg"
  },
  {
    "name": "मीठी छाछ (Meethi Chaas)",
    "price": "30/-",
    "spicy_level": "🌶️ None",
    "image": "https://www.archanaskitchen.com/images/archanaskitchen/1-Author/Priya_Suresh/Meethi_Buttermilk.jpg"
  },
  {
    "name": "सादा दही (Sada Dahi)",
    "price": "60/-",
    "spicy_level": "🌶️ None",
    "image": "https://static.toiimg.com/photo/84787467.cms"
  },
  {
    "name": "मसाला दही (Masala Dahi)",
    "price": "70/-",
    "spicy_level": "🌶️ Mild",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2019/06/masala-curd-recipe.jpg"
  },
  {
    "name": "दही फ्राय (Dahi Fry)",
    "price": "90/-",
    "spicy_level": "🌶️🌶️ Medium",
    "image": "https://www.spiceupthecurry.com/wp-content/uploads/2021/07/dahi-tadka-1.jpg"
  },
  {
    "name": "बूंदी रायता (Boondi Raita)",
    "price": "90/-",
    "spicy_level": "🌶️ Mild",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2018/05/boondi-raita-recipe-2a.jpg"
  },
  {
    "name": "फ्रूट रायता (Fruit Raita)",
    "price": "110/-",
    "spicy_level": "🌶️ None",
    "image": "https://www.vegrecipesofindia.com/wp-content/uploads/2012/07/fruit-raita-recipe.jpg"
  },
  {
    "name": "मिक्स रायता (Mix Raita)",
    "price": "110/-",
    "spicy_level": "🌶️ Mild",
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2018/05/mixed-vegetable-raita.jpg"
  }
];

async function addRaitaMenuItems() {
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

    // Find or create रायता category
    let raitaCategory = await MenuCategory.findOne({
      restaurantId: restaurant._id,
      name: 'रायता'
    });

    if (!raitaCategory) {
      // Get max display order for categories
      const maxOrder = await MenuCategory.findOne({ 
        restaurantId: restaurant._id 
      }).sort('-displayOrder').select('displayOrder');
      
      const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

      raitaCategory = new MenuCategory({
        name: 'रायता',
        description: 'रायता और दही व्यंजन',
        restaurantId: restaurant._id,
        displayOrder: displayOrder,
        status: 'active'
      });
      await raitaCategory.save();
      console.log('Created category: रायता');
    } else {
      console.log('Found existing category: रायता');
    }

    // Get max display order for items in this category
    const maxItemOrder = await MenuItem.findOne({ 
      categoryId: raitaCategory._id,
      restaurantId: restaurant._id 
    }).sort('-displayOrder').select('displayOrder');
    
    let displayOrder = maxItemOrder ? maxItemOrder.displayOrder + 1 : 0;

    // Add menu items
    console.log('\nAdding menu items to रायता category:');
    for (const itemData of raitaMenuItems) {
      // Check if item already exists
      const existingItem = await MenuItem.findOne({
        restaurantId: restaurant._id,
        categoryId: raitaCategory._id,
        name: itemData.name
      });

      if (existingItem) {
        console.log(`  ⚠️  Item "${itemData.name}" already exists, skipping...`);
        continue;
      }

      const spiceLevel = parseSpiceLevel(itemData.spicy_level);
      const price = parsePrice(itemData.price);

      const menuItem = new MenuItem({
        name: itemData.name,
        price: price,
        image: itemData.image,
        category: 'रायता', // Legacy field
        categoryId: raitaCategory._id, // New field
        restaurantId: restaurant._id,
        isVeg: true,
        preparationTime: 15,
        displayOrder: displayOrder++,
        status: 'active',
        spiceLevel: spiceLevel
      });

      await menuItem.save();
      console.log(`  ✅ Added: ${itemData.name} - ₹${price} (Spice: ${spiceLevel}/5)`);
    }

    console.log('\n✅ Successfully added all menu items to रायता category!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding menu items:', error);
    process.exit(1);
  }
}

addRaitaMenuItems();

