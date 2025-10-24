const connectDB = require('./config/db');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('./models/SuperAdmin');

const seedSuperAdmin = async () => {
  await connectDB();

  const superAdminData = {
    username: 'superadmin',
    email: 'admin@restaurantsystem.com',
    password: 'admin123', // Change this to a secure password
    fullName: 'System Administrator'
  };

  try {
    // Check if super admin already exists
    const existing = await SuperAdmin.findOne({ username: superAdminData.username });
    
    if (existing) {
      console.log('✅ Super Admin already exists');
      console.log('   Username:', superAdminData.username);
      console.log('   Email:', existing.email);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(superAdminData.password, salt);

    // Create super admin
    const superAdmin = new SuperAdmin({
      username: superAdminData.username,
      email: superAdminData.email,
      password: hashedPassword,
      fullName: superAdminData.fullName,
      isActive: true
    });

    await superAdmin.save();

    console.log('\n✨ Super Admin created successfully!\n');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('Username:', superAdminData.username);
    console.log('Password:', superAdminData.password);
    console.log('Email:', superAdminData.email);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
