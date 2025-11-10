const Bill = require('../models/Bill');
const mongoose = require('mongoose');

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

    const bill = new Bill({
      billNumber,
      tableId,
      tableName,
      restaurantId,
      persons: persons || 1,
      items: items.map(item => ({
        itemId: item.id || item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note || '',
        spiceLevel: item.spiceLevel || 0,
        spicePercent: item.spicePercent || 0,
        isJain: item.isJain || false
      })),
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
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Bill number already exists' });
    }
    res.status(500).json({ error: 'Failed to create bill' });
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

    const total = await Bill.countDocuments(query);

    console.log(`Found ${bills.length} bills out of ${total} total for restaurantId:`, restaurantId);

    res.json({
      bills,
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

    // Get total revenue and order count
    const stats = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$grandTotal' },
          totalItems: { $sum: { $size: '$items' } }
        }
      }
    ]);

    const result = stats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalItems: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching bill stats:', error);
    res.status(500).json({ error: 'Failed to fetch bill statistics' });
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

