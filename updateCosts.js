const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
require('dotenv').config();
const connectDB = require('./config/db');

async function updateCosts() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Update all menu items that don't have cost set
    const result = await MenuItem.updateMany(
      { cost: { $exists: false } },
      [
        {
          $set: {
            cost: { $multiply: ['$price', 0.6] } // Set cost to 60% of price
          }
        }
      ]
    );

    console.log(`Updated ${result.modifiedCount} menu items with cost values`);

    // Verify the updates
    const items = await MenuItem.find({}).limit(10);
    console.log('Updated menu items:');
    items.forEach(item => {
      console.log(`Name: ${item.name}, Price: ${item.price}, Cost: ${item.cost}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error updating costs:', error);
    process.exit(1);
  }
}

updateCosts();
