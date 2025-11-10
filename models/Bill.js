const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  tableId: { type: String, required: true },
  tableName: { type: String, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  persons: { type: Number, default: 1 },
  items: [{
    itemId: String,
    name: String,
    price: Number,
    quantity: Number,
    note: String,
    spiceLevel: Number,
    spicePercent: Number,
    isJain: Boolean,
    discountAmount: { type: Number, default: 0 } // Discount in ₹ for this item
  }],
  subtotal: { type: Number, required: true },
  additionalCharges: [{
    name: String,
    amount: Number
  }],
  discountAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  createdBy: { type: String }, // username of staff/admin who created the bill
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' }
}, { 
  timestamps: true 
});

// Index for faster queries
BillSchema.index({ restaurantId: 1, createdAt: -1 });
BillSchema.index({ billNumber: 1 });

module.exports = mongoose.model('Bill', BillSchema);

