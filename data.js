// addSnacksItems.js
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const MenuCategory = require('./models/MenuCategory');
const connectDB = require('./config/db');

const snacksItems = [
  {
    "name": "चिली पनीर (Chili Paneer)",
    "description": "Crispy paneer cubes tossed in spicy chili sauce with bell peppers",
    "price": 200,
    "spiceLevel": 4,
    "isAvailable": true,
    "isVeg": true,
    "preparationTime": 15,
    "displayOrder": 1,
    "restaurantId": "692825b4865129222e968613",
    "status": "active",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP6BuOWHh7oM2cHY2WjhCXSoHTrqOn7q1HEQ&s"
  },
  {
    "name": "फिंगर चिप्स (Finger Chips)",
    "description": "Crispy golden french fries served with ketchup",
    "price": 120,
    "spiceLevel": 1,
    "isAvailable": true,
    "isVeg": true,
    "preparationTime": 10,
    "displayOrder": 2,
    "restaurantId": "692825b4865129222e968613",
    "status": "active",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP6BuOWHh7oM2cHY2WjhCXSoHTrqOn7q1HEQ&s"
  },
  {
    "name": "मिक्स पकोड़ा (Mix Pakora)",
    "description": "Assorted vegetable fritters made with gram flour batter",
    "price": 150,
    "spiceLevel": 3,
    "isAvailable": true,
    "isVeg": true,
    "preparationTime": 15,
    "displayOrder": 3,
    "restaurantId": "692825b4865129222e968613",
    "status": "active",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP6BuOWHh7oM2cHY2WjhCXSoHTrqOn7q1HEQ&s"
  },
  {
    "name": "पनीर पकोड़ा (Paneer Pakora)",
    "description": "Cottage cheese fritters with spicy gram flour coating",
    "price": 170,
    "spiceLevel": 3,
    "isAvailable": true,
    "isVeg": true,
    "preparationTime": 15,
    "displayOrder": 4,
    "restaurantId": "692825b4865129222e968613",
    "status": "active",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP6BuOWHh7oM2cHY2WjhCXSoHTrqOn7q1HEQ&s"
  },
  {
    "name": "प्याज पकोड़ा (Pyaz Pakora)",
    "description": "Crispy onion fritters made with spiced gram flour",
    "price": 140,
    "spiceLevel": 3,
    "isAvailable": true,
    "isVeg": true,
    "preparationTime": 15,
    "displayOrder": 5,
    "restaurantId": "692825b4865129222e968613",
    "status": "active",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP6BuOWHh7oM2cHY2WjhCXSoHTrqOn7q1HEQ&s"
  },
  {
    "name": "चना रोस्ट (Chana Roast)",
    "description": "Spicy roasted chickpeas with tangy masala",
    "price": 140,
    "spiceLevel": 3,
    "isAvailable": true,
    "isVeg": true,
    "preparationTime": 15,
    "displayOrder": 6,
    "restaurantId": "692825b4865129222e968613",
    "status": "active",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP6BuOWHh7oM2cHY2WjhCXSoHTrqOn7q1HEQ&s"
  }
];

async function addSnacksItems() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find the Snacks (स्नैक्स) category
    const snacksCategory = await MenuCategory.findOne({
      name: 'स्नैक्स',
      restaurantId: '692825b4865129222e968613'
    });

    if (!snacksCategory) {
      console.error('"स्नैक्स" category not found');
      process.exit(1);
    }

    console.log(`Found "स्नैक्स" category with ID: ${snacksCategory._id}`);

    // Add each menu item
    for (const itemData of snacksItems) {
      // Add categoryId to the item
      const itemToAdd = {
        ...itemData,
        categoryId: snacksCategory._id
      };

      // Check if menu item already exists
      const existingItem = await MenuItem.findOne({
        name: itemData.name,
        restaurantId: itemData.restaurantId
      });

      if (existingItem) {
        console.log(`Menu item '${itemData.name}' already exists, skipping...`);
        continue;
      }

      // Create new menu item
      const menuItem = new MenuItem(itemToAdd);
      await menuItem.save();
      console.log(`✅ Added menu item: ${menuItem.name}`);
    }

    console.log('All snacks items added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding snacks items:', error);
    process.exit(1);
  }
}

addSnacksItems();