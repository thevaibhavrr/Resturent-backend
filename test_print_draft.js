const mongoose = require('mongoose');
const TableDraft = require('./backend/models/TableDraft');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/restaurant_app');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Test the print draft functionality
async function testPrintDraft() {
  try {
    // Clear any existing test drafts
    await TableDraft.deleteMany({ tableId: 'TEST_TABLE_001' });

    const testData = {
      tableId: 'TEST_TABLE_001',
      tableName: 'Test Table 1',
      restaurantId: '507f1f77bcf86cd799439011', // Dummy ObjectId
      persons: 2,
      cartItems: [
        {
          itemId: 'item_001',
          name: 'Chicken Biryani',
          price: 250,
          quantity: 1,
          note: 'Spicy',
          spiceLevel: 3,
          spicePercent: 75,
          isJain: false,
          addedAt: new Date('2024-12-01T10:00:00Z'), // First item added at 10:00
          addedBy: { userId: 'user_001', userName: 'Staff 1' },
          lastUpdatedBy: { userId: 'user_001', userName: 'Staff 1', timestamp: new Date() }
        },
        {
          itemId: 'item_002',
          name: 'Butter Chicken',
          price: 300,
          quantity: 1,
          note: '',
          spiceLevel: 2,
          spicePercent: 50,
          isJain: false,
          addedAt: new Date('2024-12-01T10:05:00Z'), // Second item added at 10:05
          addedBy: { userId: 'user_001', userName: 'Staff 1' },
          lastUpdatedBy: { userId: 'user_001', userName: 'Staff 1', timestamp: new Date() }
        }
      ],
      subtotal: 550,
      tax: 0,
      total: 550,
      status: 'occupied',
      lastUpdated: new Date(),
      updatedBy: 'Staff 1'
    };

    // Save initial draft
    const draft = await TableDraft.create(testData);
    console.log('✅ Initial draft saved');

    // Simulate first print (should return all items)
    console.log('\n--- First Print ---');
    let newItems = draft.lastPrintedAt ? [] : draft.cartItems;
    console.log(`New items count: ${newItems.length}`);
    newItems.forEach(item => console.log(`- ${item.name} (added: ${item.addedAt})`));

    // Update lastPrintedAt
    draft.lastPrintedAt = new Date('2024-12-01T10:10:00Z'); // Printed at 10:10
    await draft.save();
    console.log('✅ Updated lastPrintedAt to:', draft.lastPrintedAt);

    // Add a new item after the first print
    draft.cartItems.push({
      itemId: 'item_003',
      name: 'Paneer Tikka',
      price: 200,
      quantity: 1,
      note: 'Mild',
      spiceLevel: 1,
      spicePercent: 25,
      isJain: true,
      addedAt: new Date('2024-12-01T10:15:00Z'), // Added at 10:15 (after print)
      addedBy: { userId: 'user_001', userName: 'Staff 1' },
      lastUpdatedBy: { userId: 'user_001', userName: 'Staff 1', timestamp: new Date() }
    });

    await draft.save();
    console.log('✅ Added new item after first print');

    // Simulate second print (should return only the new item)
    console.log('\n--- Second Print ---');
    const currentTime = new Date();
    newItems = draft.cartItems.filter(item => {
      const itemAddedAt = new Date(item.addedAt);
      return itemAddedAt > draft.lastPrintedAt;
    });

    console.log(`New items count: ${newItems.length}`);
    newItems.forEach(item => console.log(`- ${item.name} (added: ${item.addedAt})`));

    // Update lastPrintedAt again
    draft.lastPrintedAt = currentTime;
    await draft.save();
    console.log('✅ Updated lastPrintedAt to:', draft.lastPrintedAt);

    // Add another item
    draft.cartItems.push({
      itemId: 'item_004',
      name: 'Dal Makhani',
      price: 150,
      quantity: 1,
      note: '',
      spiceLevel: 2,
      spicePercent: 50,
      isJain: true,
      addedAt: new Date(), // Added now
      addedBy: { userId: 'user_001', userName: 'Staff 1' },
      lastUpdatedBy: { userId: 'user_001', userName: 'Staff 1', timestamp: new Date() }
    });

    await draft.save();
    console.log('✅ Added another new item');

    // Simulate third print (should return only the latest item)
    console.log('\n--- Third Print ---');
    newItems = draft.cartItems.filter(item => {
      const itemAddedAt = new Date(item.addedAt);
      return itemAddedAt > draft.lastPrintedAt;
    });

    console.log(`New items count: ${newItems.length}`);
    newItems.forEach(item => console.log(`- ${item.name} (added: ${item.addedAt})`));

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the test
connectDB().then(testPrintDraft);
