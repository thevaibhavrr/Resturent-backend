const mongoose = require('mongoose');

const MenuItemPriceSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  spaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique price per item per space
MenuItemPriceSchema.index({ menuItemId: 1, spaceId: 1 }, { unique: true });

// Index for efficient queries
MenuItemPriceSchema.index({ restaurantId: 1, status: 1 });
MenuItemPriceSchema.index({ menuItemId: 1, status: 1 });

module.exports = mongoose.model('MenuItemPrice', MenuItemPriceSchema);
