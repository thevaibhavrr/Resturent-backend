const TableDraft = require('../models/TableDraft');
const Restaurant = require('../models/Restaurant');

// Save or update table draft
const saveTableDraft = async (req, res) => {
  const startTime = Date.now();
  try {
    const { tableId, tableName, restaurantId, persons, cartItems, updatedBy, userId, kotHistory } = req.body;

    if (!tableId || !tableName || !restaurantId || !updatedBy || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log("📥 Received draft save request:", {
      tableId,
      hasKotHistory: !!kotHistory,
      kotHistoryLength: kotHistory?.length || 0,
      cartItemsCount: cartItems?.length || 0
    });

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
      updatedBy,
      ...(kotHistory && { kotHistory }) // Include kotHistory if provided
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

// Mark KOTs as printed
const markKotsAsPrinted = async (req, res) => {
  try {
    const { tableId, restaurantId, kotIds } = req.body;

    if (!tableId || !restaurantId || !Array.isArray(kotIds)) {
      return res.status(400).json({ error: 'Missing required fields: tableId, restaurantId, kotIds array' });
    }

    console.log("🖨️ Marking KOTs as printed:", { tableId, restaurantId, kotIds });

    // Update the draft to mark these KOTs as printed
    const draft = await TableDraft.findOneAndUpdate(
      { tableId, restaurantId },
      {
        $addToSet: { printedKots: { $each: kotIds } }, // Add to printedKots array if not already there
        $set: {
          'kotHistory.$[elem].printed': true // Mark as printed in kotHistory
        }
      },
      {
        arrayFilters: [{ 'elem.kotId': { $in: kotIds } }], // Only update matching KOTs
        new: true
      }
    );

    if (!draft) {
      return res.status(404).json({ error: 'Table draft not found' });
    }

    console.log(`✅ Marked ${kotIds.length} KOTs as printed for table ${tableId}`);
    res.json(draft);
  } catch (error) {
    console.error('Error marking KOTs as printed:', error);
    res.status(500).json({ error: 'Failed to mark KOTs as printed' });
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
      updatedBy,
      kotHistory: [], // Reset KOT history when clearing draft
      printedKots: [] // Reset printed KOTs when clearing draft
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

// Get next KOT number for a restaurant (accessible by authenticated users)
const getNextKotNumber = async (req, res) => {
  try {
    // Get restaurantId from authenticated user JWT token
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID not found in user token' });
    }

    // Atomically increment and get the next KOT number
    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $inc: { nextKotNumber: 1 } },
      {
        new: true, // Return updated document
        runValidators: true
      }
    );

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Return the KOT number (which is now the incremented value)
    const kotNumber = restaurant.nextKotNumber;

    console.log(`Generated KOT number ${kotNumber} for restaurant ${restaurantId}`);

    res.json({
      kotNumber,
      restaurantId
    });
  } catch (err) {
    console.error('Error getting next KOT number:', err);
    res.status(500).json({ error: 'Failed to generate KOT number' });
  }
};

module.exports = {
  saveTableDraft,
  getTableDraft,
  getAllTableDrafts,
  deleteTableDraft,
  clearTableDraft,
  markKotsAsPrinted,
  getNextKotNumber
};
