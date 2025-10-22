const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true }, // hashed
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
