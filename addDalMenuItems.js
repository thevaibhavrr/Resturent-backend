const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const MenuCategory = require('./models/MenuCategory');
const Restaurant = require('./models/Restaurant');
require('dotenv').config();

const connectDB = require('./config/db');

// Menu items data for दाल category
const dalMenuItems = [
  {
    "name": "दाल हरी मिर्च",
    "price": 110,
    "image": "https://vanitascorner.com/wp-content/uploads/2018/01/Dal-Hari-bhari-2022.jpg"
  },
  {
    "name": "दाल फ्राय",
    "price": 100,
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/02/dal-fry.jpg"
  },
  {
    "name": "दाल तड़का",
    "price": 120,
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/04/dal-tadka.jpg"
  },
  {
    "name": "दाल खनुमिट्टी",
    "price": 120,
    "image": "https://i.ytimg.com/vi/0odFgoch6FY/maxresdefault.jpg"
  },
  {
    "name": "दाल पालक",
    "price": 120,
    "image": "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/11/dal-palak-recipe.jpg"
  },
  {
    "name": "दाल स्नैक्स",
    "price": 110,
    "image": "https://cdn2.foodviva.com/static-content/food-images/snacks-recipes/moong-dal-vada-pakoda/moong-dal-vada-pakoda.jpg"
  },
  {
    "name": "बटर दाल पनीर फ्राय",
    "price": 140,
    "image": "https://hebbarskitchen.com/wp-content/uploads/2022/03/Butter-Dal-Fry-Recipe-How-to-Make-Butter-Dal-Jeera-Rice-Dhaba-Style-1-scaled.jpeg"
  }
];

async function addDalMenuItems() {
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

    // Find or create दाल category
    let dalCategory = await MenuCategory.findOne({
      restaurantId: restaurant._id,
      name: 'दाल'
    });

    if (!dalCategory) {
      // Get max display order for categories
      const maxOrder = await MenuCategory.findOne({ 
        restaurantId: restaurant._id 
      }).sort('-displayOrder').select('displayOrder');
      
      const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

      dalCategory = new MenuCategory({
        name: 'दाल',
        description: 'दाल व्यंजन',
        restaurantId: restaurant._id,
        displayOrder: displayOrder,
        status: 'active'
      });
      await dalCategory.save();
      console.log('Created category: दाल');
    } else {
      console.log('Found existing category: दाल');
    }

    // Get max display order for items in this category
    const maxItemOrder = await MenuItem.findOne({ 
      categoryId: dalCategory._id,
      restaurantId: restaurant._id 
    }).sort('-displayOrder').select('displayOrder');
    
    let displayOrder = maxItemOrder ? maxItemOrder.displayOrder + 1 : 0;

    // Add menu items
    console.log('\nAdding menu items to दाल category:');
    for (const itemData of dalMenuItems) {
      // Check if item already exists
      const existingItem = await MenuItem.findOne({
        restaurantId: restaurant._id,
        categoryId: dalCategory._id,
        name: itemData.name
      });

      if (existingItem) {
        console.log(`  ⚠️  Item "${itemData.name}" already exists, skipping...`);
        continue;
      }

      const menuItem = new MenuItem({
        name: itemData.name,
        price: itemData.price,
        image: itemData.image,
        category: 'दाल', // Legacy field
        categoryId: dalCategory._id, // New field
        restaurantId: restaurant._id,
        isVeg: true,
        preparationTime: 15,
        displayOrder: displayOrder++,
        status: 'active',
        spiceLevel: 1
      });

      await menuItem.save();
      console.log(`  ✅ Added: ${itemData.name} - ₹${itemData.price}`);
    }

    console.log('\n✅ Successfully added all menu items to दाल category!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding menu items:', error);
    process.exit(1);
  }
}

addDalMenuItems();

