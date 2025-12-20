const Bill = require('../models/Bill');
const MenuItem = require('../models/MenuItem');
const MenuItemPrice = require('../models/MenuItemPrice');
const Table = require('../models/Table');
const mongoose = require('mongoose');

/**
 * Get the correct price for a menu item based on space
 * @param {string} itemId - Menu item ID
 * @param {string} spaceId - Space ID
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<number>} - The price for the item in the space
 */
const getItemPriceForSpace = async (itemId, spaceId, restaurantId) => {
  try {
    // First, try to find space-specific price
    const spacePrice = await MenuItemPrice.findOne({
      menuItemId: itemId,
      spaceId: spaceId,
      restaurantId: restaurantId,
      status: 'active'
    });

    if (spacePrice) {
      return spacePrice.price;
    }

    // If no space-specific price, use base price from MenuItem
    const menuItem = await MenuItem.findOne({
      _id: itemId,
      restaurantId: restaurantId,
      status: 'active'
    });

    if (!menuItem) return 0;

    // Use basePrice if available, otherwise fall back to price (for existing items)
    return menuItem.basePrice !== undefined ? menuItem.basePrice : (menuItem.price !== undefined ? menuItem.price : 0);
  } catch (error) {
    console.error('Error getting item price for space:', error);
    return 0;
  }
}

/**
 * Create a new bill
 * @description Creates a new bill record in the database
 */
exports.createBill = async (req, res) => {
  try {
    const { 
      billNumber, 
      tableId, 
      tableName, 
      persons, 
      items, 
      subtotal, 
      additionalCharges, 
      discountAmount, 
      grandTotal 
    } = req.body;

    let restaurantId = req.user?.restaurantId || req.body.restaurantId;
    const createdBy = req.user?.username || req.body.createdBy || 'system';

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Convert restaurantId to ObjectId if it's a string
    if (typeof restaurantId === 'string') {
      try {
        restaurantId = new mongoose.Types.ObjectId(restaurantId);
      } catch (error) {
        console.error('Error converting restaurantId to ObjectId:', error, 'restaurantId:', restaurantId);
        return res.status(400).json({ error: 'Invalid restaurant ID format' });
      }
    }

    console.log('Creating bill with restaurantId:', restaurantId, 'createdBy:', createdBy);

    if (!billNumber || !tableId || !tableName || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the space for this table to determine correct pricing
    let spaceId = null;
    try {
      const table = await Table.findOne({
        tableName: tableName,
        restaurantId: restaurantId
      }).populate('locationId');

      if (table && table.locationId) {
        spaceId = table.locationId._id;
      }
    } catch (error) {
      console.warn('Could not determine space for table:', tableName, error);
    }

    // Calculate correct prices for each item based on space
    const processedItems = await Promise.all(
      items.map(async (item) => {
        const itemId = item.id || item.itemId;

        // Get the correct price for this item in this space
        let correctPrice = item.price; // Default to provided price

        if (spaceId && itemId) {
          try {
            correctPrice = await getItemPriceForSpace(itemId, spaceId, restaurantId);
            if (correctPrice > 0) {
              console.log(`Using space-specific price for item ${item.name}: ₹${correctPrice} (space: ${spaceId})`);
            }
          } catch (error) {
            console.warn(`Could not get space-specific price for item ${itemId}, using provided price:`, error);
          }
        }

        return {
          itemId: itemId,
          name: item.name,
          price: correctPrice,
          quantity: item.quantity,
          note: item.note || '',
          spiceLevel: item.spiceLevel || 0,
          spicePercent: item.spicePercent || 0,
          isJain: item.isJain || false,
          discountAmount: item.discountAmount || 0 // Item-level discount in ₹
        };
      })
    );

    const bill = new Bill({
      billNumber,
      tableId,
      tableName,
      restaurantId,
      persons: persons || 1,
      items: processedItems,
      subtotal: subtotal || 0,
      additionalCharges: additionalCharges || [],
      discountAmount: discountAmount || 0,
      grandTotal: grandTotal || subtotal || 0,
      createdBy,
      status: 'completed'
    });

    await bill.save();

    console.log('Bill created successfully:', bill.billNumber, 'for restaurant:', bill.restaurantId);

    res.status(201).json({
      message: 'Bill created successfully',
      bill
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    
    // Handle duplicate bill number
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Bill number already exists' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message).join(', ');
      return res.status(400).json({ error: `Validation error: ${validationErrors}` });
    }
    
    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      console.error('Database connection error:', error);
      return res.status(503).json({ error: 'Database connection failed. Please try again later.' });
    }
    
    // Generic error
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message || 'Failed to create bill',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all bills for a restaurant
 * @description Retrieves all bills for a specific restaurant with optional filters
 */
exports.getBills = async (req, res) => {
  try {
    let restaurantId = req.user?.restaurantId || req.params.restaurantId;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Convert restaurantId to ObjectId if it's a string
    if (typeof restaurantId === 'string') {
      try {
        restaurantId = new mongoose.Types.ObjectId(restaurantId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid restaurant ID format' });
      }
    }

    // Optional query parameters
    const { 
      startDate, 
      endDate, 
      tableId, 
      status,
      limit = 100,
      skip = 0 
    } = req.query;

    const query = { restaurantId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (tableId) {
      query.tableId = tableId;
    }

    if (status) {
      query.status = status;
    }

    console.log('Fetching bills with query:', JSON.stringify(query));

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Calculate cost and net profit information for each bill's items
    const billsWithCosts = await Promise.all(
      bills.map(async (bill) => {
        const billObj = bill.toObject();

        // Get space for this bill's table to calculate correct pricing
        let spaceId = null;
        try {
          const table = await Table.findOne({
            tableName: bill.tableName,
            restaurantId: restaurantId
          }).populate('locationId');

          if (table && table.locationId) {
            spaceId = table.locationId._id;
          }
        } catch (error) {
          console.warn('Could not determine space for bill table:', bill.tableName, error);
        }

        // Calculate cost and net profit for the bill
        let totalCost = 0;
        let itemRevenue = 0;
        let totalDiscount = 0;

        for (const item of billObj.items) {
          try {
            const quantity = item.quantity || 1;

            // Check if this is a manual/extra item
            const isManualItem = !item.itemId || item.itemId === null || typeof item.itemId === 'string' && item.itemId.startsWith('manual-');

            if (isManualItem) {
              // For manual/extra items, cost is 0 (entire price is profit)
              item.cost = 0;
              console.log(`Manual item detected in bill ${billObj.billNumber}: ${item.name} (ID: ${item.itemId}) - treating as zero cost`);
            } else {
              // Find the menu item to get cost
              const menuItem = await MenuItem.findOne({
                _id: item.itemId,
                restaurantId: restaurantId
              });

              if (menuItem && menuItem.cost) {
                item.cost = menuItem.cost;
                totalCost += menuItem.cost * quantity;
                console.log(`Found cost for item ${item.name}: ${menuItem.cost}`);
              } else {
                item.cost = 0; // Default to 0 if cost not found
                console.log(`No cost found for item ${item.name}, using 0`);
              }
            }

            // For reporting purposes, also store the actual price used in the bill
            // This helps with reconciliation if space-specific pricing was used
            item.actualPrice = item.price;

            // Item revenue (excluding additional charges)
            itemRevenue += (item.price || 0) * quantity;

            // Include item-level discounts
            totalDiscount += (item.discountAmount || 0) * quantity;
          } catch (error) {
            console.error('Error fetching cost for item:', item.itemId, error);
            item.cost = 0;
          }
        }

        // Add bill-level discount
        totalDiscount += billObj.discountAmount || 0;

        // Net profit = (item revenue - discounts) - cost
        const effectiveRevenue = itemRevenue - totalDiscount;
        billObj.netProfit = effectiveRevenue - totalCost;

        // Add space information for reference
        billObj.spaceId = spaceId;

        return billObj;
      })
    );

    const total = await Bill.countDocuments(query);

    console.log(`Found ${bills.length} bills out of ${total} total for restaurantId:`, restaurantId);

    res.json({
      bills: billsWithCosts,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
};

/**
 * Get bill statistics for a restaurant
 * @description Returns aggregated statistics like total revenue, order count, etc.
 */
exports.getBillStats = async (req, res) => {
  try {
    let restaurantId = req.user?.restaurantId || req.params.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Convert restaurantId to ObjectId if it's a string
    if (typeof restaurantId === 'string') {
      try {
        restaurantId = new mongoose.Types.ObjectId(restaurantId);
      } catch (error) {
        console.error('Error converting restaurantId to ObjectId in getBillStats:', error, 'restaurantId:', restaurantId);
        return res.status(400).json({ error: 'Invalid restaurant ID format' });
      }
    }

    console.log('Fetching bill stats for restaurantId:', restaurantId);

    const { startDate, endDate } = req.query;

    const matchQuery = {
      restaurantId,
      status: 'completed'
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Get total revenue, order count, and total discount
    const stats = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$grandTotal' },
          totalItems: { $sum: { $size: '$items' } },
          totalDiscount: { $sum: '$discountAmount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalItems: 0,
      totalDiscount: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching bill stats:', error);
    res.status(500).json({ error: 'Failed to fetch bill statistics' });
  }
};

/**
 * Get net profit statistics for a restaurant
 * @description Returns net profit calculation using (price - cost) for all sold items
 */
exports.getNetProfitStats = async (req, res) => {
  try {
    let restaurantId = req.user?.restaurantId || req.params.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Convert restaurantId to ObjectId if it's a string
    if (typeof restaurantId === 'string') {
      try {
        restaurantId = new mongoose.Types.ObjectId(restaurantId);
      } catch (error) {
        console.error('Error converting restaurantId to ObjectId in getNetProfitStats:', error, 'restaurantId:', restaurantId);
        return res.status(400).json({ error: 'Invalid restaurant ID format' });
      }
    }

    console.log('Fetching net profit stats for restaurantId:', restaurantId);

    const { startDate, endDate } = req.query;

    const matchQuery = {
      restaurantId,
      status: 'completed'
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // First, let's get all bills and calculate net profit
    const bills = await Bill.find(matchQuery);

    console.log('Found bills for net profit calculation:', bills.length);

    let totalNetProfit = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalOrders = bills.length;
    let totalItems = 0;
    let regularItems = 0;
    let extraItems = 0;

    for (const bill of bills) {
      let billCost = 0;
      let billRevenue = 0;
      let billItems = 0;
      let totalDiscount = 0;

      console.log(`Processing bill ${bill.billNumber} with ${bill.items.length} items`);

      // Calculate cost and revenue for each item in the bill
      for (const item of bill.items) {
        const quantity = item.quantity || 1;
        billItems += quantity;

        console.log(`Processing item: ${item.name}, itemId: ${item.itemId}, type: ${typeof item.itemId}`);

        // Check if this is a manual/extra item (doesn't have a corresponding MenuItem)
        const isManualItem = !item.itemId || item.itemId === null || typeof item.itemId === 'string' && item.itemId.startsWith('manual-');

        if (isManualItem) {
          extraItems += quantity;
        } else {
          regularItems += quantity;
        }

        let cost = 0;
        if (isManualItem) {
          // For manual/extra items, cost is 0 (entire price is profit)
          cost = 0;
          console.log(`Manual item detected: ${item.name} (ID: ${item.itemId}) - treating as zero cost`);
        } else {
          // Try to find the menu item to get cost
          try {
            const menuItem = await MenuItem.findOne({
              _id: item.itemId,
              restaurantId: restaurantId
            });

            if (menuItem && menuItem.cost) {
              cost = menuItem.cost;
              console.log(`Found menu item: ${item.name} - cost: ${cost}`);
            } else if (item.cost) {
              cost = item.cost;
              console.log(`Using stored cost for item: ${item.name} - cost: ${cost}`);
            } else {
              console.log(`No cost found for item: ${item.name} - using 0`);
            }
          } catch (error) {
            console.error(`Error fetching cost for item ${item.itemId}:`, error);
            // Use stored cost if available, otherwise 0
            cost = item.cost || 0;
          }
        }

        // Revenue is only from item prices (excluding additional charges)
        billRevenue += (item.price || 0) * quantity;
        billCost += cost * quantity;

        // Include item-level discounts
        totalDiscount += (item.discountAmount || 0) * quantity;
      }

      // Add bill-level discount
      totalDiscount += bill.discountAmount || 0;

      // Net profit = (item revenue - discounts) - cost
      const effectiveRevenue = billRevenue - totalDiscount;
      const billNetProfit = effectiveRevenue - billCost;

      totalRevenue += billRevenue;
      totalCost += billCost;
      totalNetProfit += billNetProfit;
      totalItems += billItems;

      console.log(`Bill ${bill.billNumber}: Revenue: ${billRevenue}, Cost: ${billCost}, Discount: ${totalDiscount}, Net Profit: ${billNetProfit}`);
    }

    const averageNetProfit = totalOrders > 0 ? totalNetProfit / totalOrders : 0;

    const result = {
      totalNetProfit,
      totalRevenue,
      totalCost,
      totalOrders,
      averageNetProfit,
      totalItems,
      regularItems,
      extraItems
    };

    console.log('=== FINAL NET PROFIT STATS ===');
    console.log('Total Revenue:', totalRevenue);
    console.log('Total Cost:', totalCost);
    console.log('Total Net Profit:', totalNetProfit);
    console.log('Total Orders:', totalOrders);
    console.log('Average Net Profit:', averageNetProfit);
    console.log('Total Items:', totalItems);
    console.log('=============================');

    res.json(result);
  } catch (error) {
    console.error('Error fetching net profit stats:', error);
    res.status(500).json({ error: 'Failed to fetch net profit statistics' });
  }
};

/**
 * Get a single bill by ID
 */
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    let restaurantId = req.user?.restaurantId;

    if (restaurantId && typeof restaurantId === 'string') {
      try {
        restaurantId = new mongoose.Types.ObjectId(restaurantId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid restaurant ID format' });
      }
    }

    const bill = await Bill.findOne({ 
      _id: id,
      restaurantId 
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
};

/**
 * Update a bill
 * @description Updates an existing bill record in the database
 */
exports.updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tableId, 
      tableName, 
      persons, 
      items, 
      subtotal, 
      additionalCharges, 
      discountAmount, 
      grandTotal 
    } = req.body;

    let restaurantId = req.user?.restaurantId;

    if (restaurantId && typeof restaurantId === 'string') {
      try {
        restaurantId = new mongoose.Types.ObjectId(restaurantId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid restaurant ID format' });
      }
    }

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Find the bill first to ensure it exists and belongs to the restaurant
    const existingBill = await Bill.findOne({ 
      _id: id,
      restaurantId 
    });

    if (!existingBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Update bill fields
    if (tableId !== undefined) existingBill.tableId = tableId;
    if (tableName !== undefined) existingBill.tableName = tableName;
    if (persons !== undefined) existingBill.persons = persons;
    if (items !== undefined && Array.isArray(items)) {
      existingBill.items = items.map(item => ({
        itemId: item.id || item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note || '',
        spiceLevel: item.spiceLevel || 0,
        spicePercent: item.spicePercent || 0,
        isJain: item.isJain || false,
        discountAmount: item.discountAmount || 0
      }));
    }
    if (subtotal !== undefined) existingBill.subtotal = subtotal;
    if (additionalCharges !== undefined) existingBill.additionalCharges = additionalCharges;
    if (discountAmount !== undefined) existingBill.discountAmount = discountAmount;
    if (grandTotal !== undefined) existingBill.grandTotal = grandTotal;

    // Update the updatedAt timestamp
    existingBill.updatedAt = new Date();

    await existingBill.save();

    console.log('Bill updated successfully:', existingBill.billNumber, 'for restaurant:', restaurantId);

    res.json({
      message: 'Bill updated successfully',
      bill: existingBill
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message).join(', ');
      return res.status(400).json({ error: `Validation error: ${validationErrors}` });
    }
    
    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      console.error('Database connection error:', error);
      return res.status(503).json({ error: 'Database connection failed. Please try again later.' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to update bill',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete a bill
 */
exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    let restaurantId = req.user?.restaurantId;

    if (restaurantId && typeof restaurantId === 'string') {
      try {
        restaurantId = new mongoose.Types.ObjectId(restaurantId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid restaurant ID format' });
      }
    }

    const bill = await Bill.findOneAndDelete({ 
      _id: id,
      restaurantId 
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
};

// Export helper function for testing
module.exports.getItemPriceForSpace = getItemPriceForSpace;

