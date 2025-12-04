const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number }, // Legacy field - kept for backward compatibility
  basePrice: { type: Number }, // New field for space-specific pricing (optional)
  cost: { type: Number ,  required: [true, 'Cost is required'] },
  image: { type: String },
  category: { type: String }, // Legacy field, kept for backward compatibility
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory' }, // New field for category reference
  spiceLevel: { type: Number, min: 1, max: 5, default: 1 },
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 15 },
  displayOrder: { type: Number, default: 0 },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', MenuItemSchema);