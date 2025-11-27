const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: { type: String },
    position: { type: String,  default: 'waiter' },
    phone: { type: String },
    username: { type: String, required: true  },
    password: { type: String, required: true },
    restaurantId: { type: String, required: true },
});

module.exports = mongoose.model('Staff', staffSchema);