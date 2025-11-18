const mongoose = require('mongoose');

const TableDraftSchema = new mongoose.Schema({
  tableId: { type: String, required: true },
  tableName: { type: String, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  persons: { type: Number, default: 1 },
  cartItems: [{
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    note: { type: String, default: '' },
    spiceLevel: { type: Number, default: 0 },
    spicePercent: { type: Number, default: 50 },
    isJain: { type: Boolean, default: false },
    addedBy: {
      userId: { type: String, required: true },
      userName: { type: String, required: true }
    },
    lastUpdatedBy: {
      userId: { type: String, required: true },
      userName: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    },
    updatedBy: { type: String } // For backward compatibility
  }],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'occupied', 'completed'], default: 'draft' },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: String, required: true } // username of who last updated
}, { timestamps: true });

module.exports = mongoose.model('TableDraft', TableDraftSchema);
