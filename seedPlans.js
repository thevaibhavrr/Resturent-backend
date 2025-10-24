const connectDB = require('./config/db');
const Plan = require('./models/Plan');
const Restaurant = require('./models/Restaurant');

const seedPlans = async () => {
  await connectDB();

  console.log('🌱 Seeding Plans...\n');

  // Define plans
  const plans = [
    {
      name: 'Free Trial',
      durationDays: 14,
      price: 0,
      features: [
        'Access to all basic features',
        '14 days trial period',
        'Limited support'
      ],
      isActive: true
    },
    {
      name: 'Monthly',
      durationDays: 60,
      price: 999,
      features: [
        'Access to all features',
        '60 days validity',
        'Priority support',
        'Advanced analytics'
      ],
      isActive: true
    },
    {
      name: 'Annual',
      durationDays: 365,
      price: 4990,
      features: [
        'Access to all premium features',
        '1 year validity',
        '24/7 Priority support',
        'Advanced analytics',
        'Custom integrations',
        'Best value for money'
      ],
      isActive: true
    }
  ];

  // Insert or update plans
  for (const planData of plans) {
    const existingPlan = await Plan.findOne({ name: planData.name });
    
    if (existingPlan) {
      await Plan.updateOne({ name: planData.name }, planData);
      console.log(`✅ Updated plan: ${planData.name}`);
    } else {
      await Plan.create(planData);
      console.log(`✅ Created plan: ${planData.name}`);
    }
  }

  // Get Free Trial plan
  const freeTrialPlan = await Plan.findOne({ name: 'Free Trial' });

  // Update all existing restaurants to have Free Trial subscription
  console.log('\n🏪 Updating existing restaurants...\n');
  
  const restaurants = await Restaurant.find({});
  
  for (const restaurant of restaurants) {
    // Calculate end date based on restaurant creation date
    const startDate = restaurant.createdAt || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // 14 days free trial

    // Calculate days remaining
    const now = new Date();
    const diff = endDate - now;
    const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const isActive = daysRemaining > 0;

    restaurant.subscription = {
      plan: freeTrialPlan._id,
      planName: freeTrialPlan.name,
      startDate: startDate,
      endDate: endDate,
      isActive: isActive,
      daysRemaining: daysRemaining
    };

    await restaurant.save();
    
    console.log(`✅ Updated ${restaurant.name}:`);
    console.log(`   - Plan: ${freeTrialPlan.name}`);
    console.log(`   - Start Date: ${startDate.toLocaleDateString()}`);
    console.log(`   - End Date: ${endDate.toLocaleDateString()}`);
    console.log(`   - Days Remaining: ${daysRemaining}`);
    console.log(`   - Status: ${isActive ? '🟢 Active' : '🔴 Expired'}\n`);
  }

  console.log('✨ Plans seeded and restaurants updated successfully!\n');
  process.exit(0);
};

seedPlans().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
