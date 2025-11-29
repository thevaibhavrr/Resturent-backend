const mongoose = require('mongoose');
const Bill = require('./models/Bill');
const MenuItem = require('./models/MenuItem');
const Restaurant = require('./models/Restaurant');
require('dotenv').config();
const connectDB = require('./config/db');

async function createTestBill() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get the restaurant
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      console.log('No restaurant found');
      return;
    }

    // Get some menu items
    const menuItems = await MenuItem.find({ restaurantId: restaurant._id }).limit(3);
    if (menuItems.length === 0) {
      console.log('No menu items found');
      return;
    }

    console.log('Creating test bill with items:', menuItems.map(item => `${item.name} (${item.price})`));

    // Create a test bill
    const bill = new Bill({
      billNumber: 'TEST-001',
      tableId: 'T001',
      tableName: 'Table 1',
      restaurantId: restaurant._id,
      persons: 2,
      items: menuItems.map(item => ({
        itemId: item._id,
        name: item.name,
        price: item.price,
        quantity: 2,
        note: 'Test order',
        spiceLevel: item.spiceLevel || 1,
        spicePercent: 50,
        isJain: false,
        discountAmount: 0
      })),
      subtotal: menuItems.reduce((sum, item) => sum + (item.price * 2), 0),
      additionalCharges: [],
      discountAmount: 0,
      grandTotal: menuItems.reduce((sum, item) => sum + (item.price * 2), 0),
      createdBy: 'Test User',
      status: 'completed'
    });

    await bill.save();
    console.log('Test bill created successfully!');
    console.log('Bill details:', {
      billNumber: bill.billNumber,
      totalRevenue: bill.grandTotal,
      items: bill.items.length
    });

    // Calculate expected net profit
    let totalCost = 0;
    for (const item of bill.items) {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.itemId.toString());
      if (menuItem) {
        totalCost += menuItem.cost * item.quantity;
      }
    }

    const expectedNetProfit = bill.grandTotal - totalCost;
    console.log('Expected net profit:', expectedNetProfit);
    console.log('Total cost:', totalCost);

    process.exit(0);
  } catch (error) {
    console.error('Error creating test bill:', error);
    process.exit(1);
  }
}

createTestBill();
