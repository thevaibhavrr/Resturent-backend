// addMenuItems.js
const mongoose = require('mongoose');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

// Database connection
mongoose.connect('mongodb+srv://vaibhavrathorema:TVwlwvr0AAngekdd@tixteen-local.v4n3zfm.mongodb.net/resturent-management?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const restaurantId = '69419afe8d0ef748733e7d08';

const menuData = [

    {
      "category": "राइस",
      "items": [
        { "name": "प्लेन राईस (Plain Rice)", "price": 80, "cost": 24 },
        { "name": "जिरा राईस (Jeera Rice)", "price": 90, "cost": 27 },
        { "name": "मसाला राईस (Masala Rice)", "price": 120, "cost": 36 },
        { "name": "वेज पुलाव (Veg Pulav)", "price": 120, "cost": 36 },
        { "name": "वेज बिरयानी (Veg Biryani)", "price": 130, "cost": 39 },
        { "name": "पनीर पुलाव (Paneer Pulav)", "price": 160, "cost": 48 },
        { "name": "मटर पुलाव (Mutter Pulav)", "price": 130, "cost": 39 },
        { "name": "वेज फ्राईड राईस (Veg Fried Rice)", "price": 120, "cost": 36 },
        { "name": "मसाला खिचड़ी (Masala Khichdi)", "price": 150, "cost": 45 },
        { "name": "बटर खिचड़ी (Butter Khichdi)", "price": 120, "cost": 36 },
        { "name": "दाल खिचड़ी (Dal Khichdee)", "price": 100, "cost": 30 },
        { "name": "काजू राईस (Kaju Rice)", "price": 200, "cost": 60 },
        { "name": "कश्मीरी पुलाव (Kashmiri Pulav)", "price": 200, "cost": 60 }
      ]
    },
    {
      "category": "रोटी",
      "items": [
        { "name": "प्लेन तवा रोटी (Plain Tawa Roti)", "price": 12, "cost": 3.6 },
        { "name": "तवा बटर रोटी (Tawa Butter Roti)", "price": 15, "cost": 4.5 },
        { "name": "प्लेन तंदूरी रोटी (Plain Tandoori Roti)", "price": 10, "cost": 3 },
        { "name": "बटर तंदूरी रोटी (Butter Tandoori Roti)", "price": 13, "cost": 3.9 },
        { "name": "तवा पराठा (Tawa Paratha)", "price": 35, "cost": 10.5 },
        { "name": "लच्छा पराठा (Lachha Paratha)", "price": 40, "cost": 12 },
        { "name": "नॉन (Naan)", "price": 50, "cost": 15 },
        { "name": "बटर नॉन (Butter Naan)", "price": 60, "cost": 18 },
        { "name": "मिक्सी रोटी (Missi Roti)", "price": 50, "cost": 15 },
        { "name": "मक्का रोटी (Makka Roti)", "price": 20, "cost": 6 },
        { "name": "बटर मक्का रोटी (Butter Makka Roti)", "price": 23, "cost": 6.9 },
        { "name": "बाजरा रोटी (Bazara Roti)", "price": 20, "cost": 6 },
        { "name": "बाजरा रोटी बटर (Bazara Roti Butter)", "price": 25, "cost": 7.5 }
      ]
    },
    {
      "category": "थाली",
      "items": [
        { "name": "थाली (Thali)", "price": 150, "cost": 45 },
        { "name": "गुरुकृपा रेस्टोरेंट स्पेशल थाली (Gurukripa Restaurant Special Thali)", "price": 200, "cost": 60 }
      ]
}
];

async function addMenuItems() {
  try {
    for (const categoryData of menuData) {
      // Check if category already exists
      let category = await MenuCategory.findOne({
        name: categoryData.category,
        restaurantId: new mongoose.Types.ObjectId(restaurantId)
      });

      // Create category if it doesn't exist
      if (!category) {
        // Find max display order and add 1
        const maxOrder = await MenuCategory.findOne({ 
          restaurantId: new mongoose.Types.ObjectId(restaurantId) 
        }).sort('-displayOrder').select('displayOrder');
        
        const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

        category = await MenuCategory.create({
          name: categoryData.category,
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          displayOrder
        });
        console.log(`Created category: ${category.name}`);
      } else {
        console.log(`Category already exists: ${category.name}`);
      }

      // Create menu items for this category
      for (const itemData of categoryData.items) {
        // Check if item already exists
        const existingItem = await MenuItem.findOne({
          name: itemData.name,
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          categoryId: category._id
        });

        if (!existingItem) {
          // Find max display order for items in this category and add 1
          const maxItemOrder = await MenuItem.findOne({
            restaurantId: new mongoose.Types.ObjectId(restaurantId),
            categoryId: category._id
          }).sort('-displayOrder').select('displayOrder');
          
          const displayOrder = maxItemOrder ? maxItemOrder.displayOrder + 1 : 0;

          await MenuItem.create({
            name: itemData.name,
            price: itemData.price,
            basePrice: itemData.price, // Set basePrice same as price
            cost: itemData.cost,
            category: category.name, // Legacy field
            categoryId: category._id,
            restaurantId: new mongoose.Types.ObjectId(restaurantId),
            isVeg: true, // Assuming all items are vegetarian as per the menu
            status: 'active',
            displayOrder
          });
          console.log(`  - Added item: ${itemData.name}`);
        } else {
          console.log(`  - Item already exists: ${itemData.name}`);
        }
      }
    }
    console.log('\nMenu items addition completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding menu items:', error);
    process.exit(1);
  }
}

// Run the script
addMenuItems();
