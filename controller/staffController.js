const Staff = require('../models/Staff');

// Check if username is available
exports.checkUsername = async (req, res) => {
    try {
        const { username, excludeId } = req.query;
        const query = { username: new RegExp(`^${username}$`, 'i') };
        
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        
        const existingUser = await Staff.findOne(query);
        res.json({ available: !existingUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all staff
exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get staff by restaurant ID
exports.getStaffByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const staff = await Staff.find({ restaurantId });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new staff
exports.createStaff = async (req, res) => {
    const staff = new Staff(req.body);
    try {
        const newStaff = await staff.save();
        res.status(201).json(newStaff);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get staff by ID
exports.getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) return res.status(404).json({ message: 'Staff not found' });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update staff
exports.updateStaff = async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!staff) return res.status(404).json({ message: 'Staff not found' });
        res.json(staff);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);
        if (!staff) return res.status(404).json({ message: 'Staff not found' });
        res.json({ message: 'Staff deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};