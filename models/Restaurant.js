const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true }, // hashed
  subscription: {
    plan: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Plan'
    },
    planName: { 
      type: String, 
      default: 'Free Trial' 
    },
    startDate: { 
      type: Date, 
      default: Date.now 
    },
    endDate: { 
      type: Date 
    }
    // Note: isActive and daysRemaining are now calculated dynamically via virtuals
  },
  // Restaurant settings
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  gstin: { type: String, default: '' },
  logo: { type: String, default: '' },
  description: { type: String, default: '' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field: Calculate days remaining dynamically
RestaurantSchema.virtual('subscription.daysRemaining').get(function() {
  if (this.subscription.endDate) {
    const now = new Date();
    const diff = this.subscription.endDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }
  return 0;
});

// Virtual field: Calculate isActive dynamically
RestaurantSchema.virtual('subscription.isActive').get(function() {
  if (this.subscription.endDate) {
    const now = new Date();
    return this.subscription.endDate > now;
  }
  return false;
});

// Method to get subscription with calculated values based on current plan duration
RestaurantSchema.methods.getSubscriptionWithCalculations = function() {
  const now = new Date();
  let daysRemaining = 0;
  let isActive = false;
  let calculatedEndDate = this.subscription.endDate;

  // If plan is populated, recalculate endDate based on current plan duration
  if (this.subscription.plan && this.subscription.plan.durationDays && this.subscription.startDate) {
    calculatedEndDate = new Date(this.subscription.startDate);
    calculatedEndDate.setDate(calculatedEndDate.getDate() + this.subscription.plan.durationDays);
    
    // Calculate days remaining from calculated end date
    const diff = calculatedEndDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, days);
    isActive = days > 0;
  } else if (this.subscription.endDate) {
    // Fallback to stored endDate if plan not populated
    const diff = this.subscription.endDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, days);
    isActive = days > 0;
    calculatedEndDate = this.subscription.endDate;
  }

  return {
    plan: this.subscription.plan,
    planName: this.subscription.planName,
    startDate: this.subscription.startDate,
    endDate: calculatedEndDate,
    daysRemaining: daysRemaining,
    isActive: isActive
  };
};

module.exports = mongoose.model('Restaurant', RestaurantSchema);
