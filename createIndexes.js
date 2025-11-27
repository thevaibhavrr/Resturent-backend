const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TableDraft = require('./models/TableDraft');

dotenv.config();

const createIndexes = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_app';

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected successfully');

    console.log('Creating indexes for TableDraft collection...');

    // Create compound index for faster queries
    await TableDraft.collection.createIndex(
      { tableId: 1, restaurantId: 1 },
      { name: 'tableId_restaurantId_idx', unique: false }
    );

    await TableDraft.collection.createIndex(
      { restaurantId: 1, lastUpdated: -1 },
      { name: 'restaurantId_lastUpdated_idx', unique: false }
    );

    console.log('✅ Indexes created successfully');

    // Verify indexes
    const indexes = await TableDraft.collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('✅ Index creation completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
};

createIndexes();
