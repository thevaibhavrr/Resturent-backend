const mongoose = require('mongoose');
const Staff = require('./models/Staff');
require('dotenv').config();

const connectDB = require('./config/db');

async function createStaffUser() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get the latest restaurant
    const Restaurant = require('./models/Restaurant');
    const restaurant = await Restaurant.findOne().sort({ createdAt: -1 });
    if (!restaurant) {
      console.log('No restaurant found. Please create a restaurant first.');
      return;
    }

    console.log('Creating staff user for restaurant:', restaurant.name);

    // Create a staff user
    const staff = new Staff({
      name: 'Test Staff',
      position: 'Waiter',
      phone: '1234567890',
      username: 'staff',
      password: 'password123',
      restaurantId: restaurant._id.toString()
    });

    await staff.save();
    console.log('Staff user created successfully:', staff);
    process.exit(0);
  } catch (error) {
    console.error('Error creating staff user:', error);
    process.exit(1);
  }
}

createStaffUser();
