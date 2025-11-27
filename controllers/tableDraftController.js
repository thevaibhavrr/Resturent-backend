const TableDraft = require('../models/TableDraft');

// Save or update table draft
const saveTableDraft = async (req, res) => {
  const startTime = Date.now();
  try {
    const { tableId, tableName, restaurantId, persons, cartItems, updatedBy, userId } = req.body;
    
    if (!tableId || !tableName || !restaurantId || !updatedBy || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Process cart items to ensure they have the required staff information
    const processedCartItems = cartItems.map(item => {
      // For new items being added
      if (!item.addedBy) {
        item.addedBy = {
          userId: userId,
          userName: updatedBy
        };
      }
      
      // Always update lastUpdatedBy with current user
      item.lastUpdatedBy = {
        userId: userId,
        userName: updatedBy,
        timestamp: new Date()
      };
      
      // For backward compatibility
      item.updatedBy = updatedBy;
      
      return item;
    });

    // Calculate totals
    const subtotal = processedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = 0; // No tax
    const total = subtotal;

    // Determine status based on cart items
    const status = processedCartItems.length > 0 ? 'occupied' : 'draft';

    const draftData = {
      tableId,
      tableName,
      restaurantId,
      persons: persons || 1,
      cartItems: processedCartItems,
      subtotal,
      tax,
      total,
      status,
      lastUpdated: new Date(),
      updatedBy
    };

    // Use upsert for atomic operation - more efficient than separate find and update/insert
    const draft = await TableDraft.findOneAndUpdate(
      { tableId, restaurantId }, // Filter
      draftData, // Update data
      {
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true // Run schema validators
      }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ Table draft saved for table ${tableId} in ${duration}ms`);
    res.json(draft);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error saving table draft for table ${req.body?.tableId || 'unknown'} in ${duration}ms:`, error);
    res.status(500).json({ error: 'Failed to save table draft' });
  }
};

// Get table draft
const getTableDraft = async (req, res) => {
  try {
    const { tableId, restaurantId } = req.query;
    
    if (!tableId || !restaurantId) {
      return res.status(400).json({ error: 'Table ID and Restaurant ID are required' });
    }

    const draft = await TableDraft.findOne({ tableId, restaurantId });
    res.json(draft);
  } catch (error) {
    console.error('Error fetching table draft:', error);
    res.status(500).json({ error: 'Failed to fetch table draft' });
  }
};

// Get all table drafts for a restaurant
const getAllTableDrafts = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const drafts = await TableDraft.find({ restaurantId }).sort({ lastUpdated: -1 });
    res.json(drafts);
  } catch (error) {
    console.error('Error fetching table drafts:', error);
    res.status(500).json({ error: 'Failed to fetch table drafts' });
  }
};

// Delete table draft
const deleteTableDraft = async (req, res) => {
  try {
    const { tableId, restaurantId } = req.body;
    
    if (!tableId || !restaurantId) {
      return res.status(400).json({ error: 'Table ID and Restaurant ID are required' });
    }

    await TableDraft.findOneAndDelete({ tableId, restaurantId });
    res.json({ message: 'Table draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting table draft:', error);
    res.status(500).json({ error: 'Failed to delete table draft' });
  }
};

// Clear table draft (set to draft status with empty cart)
const clearTableDraft = async (req, res) => {
  try {
    const { tableId, restaurantId, updatedBy } = req.body;
    
    if (!tableId || !restaurantId || !updatedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const draftData = {
      tableId,
      restaurantId,
      persons: 1,
      cartItems: [],
      subtotal: 0,
      tax: 0, // No tax
      total: 0,
      status: 'draft',
      lastUpdated: new Date(),
      updatedBy
    };

    // Use upsert for atomic operation
    const draft = await TableDraft.findOneAndUpdate(
      { tableId, restaurantId }, // Filter
      draftData, // Update data
      {
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true // Run schema validators
      }
    );

    res.json(draft);
  } catch (error) {
    console.error('Error clearing table draft:', error);
    res.status(500).json({ error: 'Failed to clear table draft' });
  }
};

module.exports = {
  saveTableDraft,
  getTableDraft,
  getAllTableDrafts,
  deleteTableDraft,
  clearTableDraft
};
