const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    enum: ['Free Trial', 'Monthly', 'Annual'],
    unique: true 
  },
  durationDays: { 
    type: Number, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    default: 0 
  },
  features: [String],
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Plan', PlanSchema);
