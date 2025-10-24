const connectDB = require('./config/db');
const bcrypt = require('bcryptjs');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');

const seed = async () => {
  await connectDB();

  const items = [
    { name: 'divya palce', adminUsername: 'Divyapalce', adminPassword: '1234' },
    { name: 'iefa', adminUsername: 'iefa', adminPassword: '1234' },
  ];

  for (const it of items) {
    const exists = await Restaurant.findOne({ adminUsername: it.adminUsername });
    if (exists) {
      console.log('Skipping existing', it.adminUsername);
      continue;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(it.adminPassword, salt);

    const rest = new Restaurant({ name: it.name, adminUsername: it.adminUsername, adminPassword: hashed });
    await rest.save();

    const user = new User({ username: it.adminUsername, password: hashed, role: 'admin', restaurant: rest._id });
    await user.save();

    console.log('Seeded', it.adminUsername);
  }

  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
