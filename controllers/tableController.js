const Table = require('../models/Table');

exports.createTable = async (req, res) => {
  try {
    const { tableName, locationId, restaurantId } = req.body;
    const table = await Table.create({ tableName, locationId, restaurantId });
    res.status(201).json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getTables = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const tables = await Table.find({ restaurantId }).populate('locationId');
    res.json(tables);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByIdAndUpdate(id, req.body, { new: true });
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    await Table.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.setInactive = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
