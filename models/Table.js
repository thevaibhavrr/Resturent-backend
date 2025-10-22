const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  tableName: { type: String, required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Table', TableSchema);
