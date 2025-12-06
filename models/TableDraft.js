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
  updatedBy: { type: String, required: true }, // username of who last updated
  kotHistory: [{
    kotId: { type: String, required: true },
    items: [{
      itemId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true } // Can be positive (added) or negative (removed)
    }],
    timestamp: { type: Date, default: Date.now },
    printed: { type: Boolean, default: false } // Track if this KOT has been printed
  }],
  printedKots: [{ type: String }] // Array of KOT IDs that have been printed
}, { timestamps: true });

// Create compound index for faster queries
TableDraftSchema.index({ tableId: 1, restaurantId: 1 }, { unique: false });
TableDraftSchema.index({ restaurantId: 1, lastUpdated: -1 }, { unique: false });

module.exports = mongoose.model('TableDraft', TableDraftSchema);
