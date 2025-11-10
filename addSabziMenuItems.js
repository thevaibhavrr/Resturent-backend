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

// Menu items data for सब्जी category
const sabziMenuItems = [
  {
    "name": "प्लेन पालक (Plain Palak)",
    "price": 100,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "आलू पालक (Aloo Palak)",
    "price": 110,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "मटर मसाला (Matar Masala)",
    "price": 110,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "गोभी मटर (Gobi Matar)",
    "price": 120,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "आलू गोभी (Aloo Gobi)",
    "price": 120,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "आलू जीरा स्पेशल (Aloo Jeera Special)",
    "price": 130,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "आलू मटर टमाटर (Aloo Matar Tamatar)",
    "price": 120,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "आलू शिमला (Aloo Shimla)",
    "price": 120,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "भिंडी मसाला (Bhindi Masala)",
    "price": 110,
    "spicy_level": "🌶️ Medium (50%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "भिंडी कुरकुरी (Bhindi Kurkuri)",
    "price": 120,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "भिंडी 2 प्याज़ (Bhindi Do Pyaz)",
    "price": 120,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "चना मसाला (Chana Masala)",
    "price": 110,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "चना पनीर मसाला (Chana Paneer Masala)",
    "price": 140,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "छोले टमाटर (Chole Tamatar)",
    "price": 110,
    "spicy_level": "🌶️ Medium (50%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "सेव टमाटर (Sev Tamatar)",
    "price": 100,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "सेव मसाला (Sev Masala)",
    "price": 100,
    "spicy_level": "🌶️ Medium (50%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "सेव भाजी दूध में (Sev Bhaji Doodh Me)",
    "price": 130,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "सेव पनीर मसाला (Sev Paneer Masala)",
    "price": 140,
    "spicy_level": "🌶️🌶️ Spicy (80%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "बेसन गट्टा मसाला (Besan Gatta Masala)",
    "price": 110,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "मिक्स वेज (Mix Veg)",
    "price": 120,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "मिक्स वेज पनीर (Mix Veg Paneer)",
    "price": 140,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "आलू 2 प्याज़ (Aloo Do Pyaz)",
    "price": 110,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "वेज कोल्हापुरी (Veg Kolhapuri)",
    "price": 120,
    "spicy_level": "🌶️🌶️🌶️ Spicy (90%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "स्टफ टमाटर (Stuffed Tamatar)",
    "price": 120,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "वेज हांडी (Veg Handi)",
    "price": 120,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "वेज हंगामा (Veg Hungama)",
    "price": 120,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "वेज हैदराबादी (Veg Hyderabadi)",
    "price": 130,
    "spicy_level": "🌶️🌶️🌶️ Spicy (90%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "दम आलू (Dum Aloo)",
    "price": 130,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "वेज जयपुरी (Veg Jaipuri)",
    "price": 140,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "टमाटर चटनी स्पेशल (Tamatar Chutney Special)",
    "price": 110,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "आलू छोले (Aloo Chole)",
    "price": 110,
    "spicy_level": "🌶️🌶️ Medium (60%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  },
  {
    "name": "आलू गोभी टमाटर (Aloo Gobi Tamatar)",
    "price": 120,
    "spicy_level": "🌶️ Mild (30%)",
    "image": "https://vegecravings.com/wp-content/uploads/2020/02/Arbi-Ki-Sabzi-Recipe-Step-By-Step-Instructions-scaled.jpg"
  }
];

async function addSabziMenuItems() {
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

    // Find or create सब्जी category
    let sabziCategory = await MenuCategory.findOne({
      restaurantId: restaurant._id,
      name: 'सब्जी'
    });

    if (!sabziCategory) {
      // Get max display order for categories
      const maxOrder = await MenuCategory.findOne({ 
        restaurantId: restaurant._id 
      }).sort('-displayOrder').select('displayOrder');
      
      const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

      sabziCategory = new MenuCategory({
        name: 'सब्जी',
        description: 'सब्जी व्यंजन',
        restaurantId: restaurant._id,
        displayOrder: displayOrder,
        status: 'active'
      });
      await sabziCategory.save();
      console.log('Created category: सब्जी');
    } else {
      console.log('Found existing category: सब्जी');
    }

    // Get max display order for items in this category
    const maxItemOrder = await MenuItem.findOne({ 
      categoryId: sabziCategory._id,
      restaurantId: restaurant._id 
    }).sort('-displayOrder').select('displayOrder');
    
    let displayOrder = maxItemOrder ? maxItemOrder.displayOrder + 1 : 0;

    // Add menu items
    console.log('\nAdding menu items to सब्जी category:');
    for (const itemData of sabziMenuItems) {
      // Check if item already exists
      const existingItem = await MenuItem.findOne({
        restaurantId: restaurant._id,
        categoryId: sabziCategory._id,
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
        category: 'सब्जी', // Legacy field
        categoryId: sabziCategory._id, // New field
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

    console.log('\n✅ Successfully added all menu items to सब्जी category!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding menu items:', error);
    process.exit(1);
  }
}

addSabziMenuItems();

