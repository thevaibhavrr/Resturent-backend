const express = require('express');
const router = express.Router();
const {
  saveTableDraft,
  getTableDraft,
  getAllTableDrafts,
  deleteTableDraft,
  clearTableDraft
} = require('../controllers/tableDraftController');

// Table draft routes
router.post('/save', saveTableDraft);
router.get('/get', getTableDraft);
router.get('/all', getAllTableDrafts);
router.delete('/delete', deleteTableDraft);
router.post('/clear', clearTableDraft);

module.exports = router;
