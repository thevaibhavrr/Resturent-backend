const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Staff = require('../models/Staff');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

exports.registerRestaurant = async (req, res) => {
  try {
    const { name, adminUsername, adminPassword } = req.body;
    if (!name || !adminUsername || !adminPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // create restaurant
    const existing = await Restaurant.findOne({ adminUsername });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(adminPassword, salt);

    const restaurant = new Restaurant({ name, adminUsername, adminPassword: hashed });
    await restaurant.save();

    // create admin user
    const user = new User({ username: adminUsername, password: hashed, role: 'admin', restaurant: restaurant._id });
    await user.save();

    res.json({ message: 'Restaurant registered', restaurantId: restaurant._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    // First check if it's an admin user
    const user = await User.findOne({ username }).populate('restaurant');
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const payload = {
          id: user._id,
          username: user.username,
          role: user.role,
          restaurantId: user.restaurant ? user.restaurant._id : null,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: payload });
      }
    }

    // If not admin, check if it's a staff member
    const staff = await Staff.findOne({ username });
    if (staff) {
      // For staff, we'll do simple password comparison (not hashed for now)
      // TODO: Implement proper password hashing for staff
      if (staff.password === password) {
        const payload = {
          id: staff._id,
          username: staff.username,
          role: 'staff',
          restaurantId: staff.restaurantId,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: payload });
      }
    }

    return res.status(400).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
