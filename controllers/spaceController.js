const Space = require('../models/Space');

exports.createSpace = async (req, res) => {
  try {
    const { name, restaurantId } = req.body;
    const space = await Space.create({ name, restaurantId });
    res.status(201).json(space);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getSpaces = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const spaces = await Space.find({ restaurantId });
    res.json(spaces);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateSpace = async (req, res) => {
  try {
    const { id } = req.params;
    const space = await Space.findByIdAndUpdate(id, req.body, { new: true });
    res.json(space);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteSpace = async (req, res) => {
  try {
    const { id } = req.params;
    await Space.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.setInactive = async (req, res) => {
  try {
    const { id } = req.params;
    const space = await Space.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
    res.json(space);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
