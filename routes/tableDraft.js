const express = require('express');
const router = express.Router();
const {
  saveTableDraft,
  getTableDraft,
  getAllTableDrafts,
  deleteTableDraft,
  clearTableDraft,
  markKotsAsPrinted
} = require('../controllers/tableDraftController');
const verifyToken = require('../middleware/verifyToken');
const checkSubscription = require('../middleware/checkSubscription');

// Table draft routes - Protected by subscription check
router.post('/save', verifyToken, checkSubscription, saveTableDraft);
router.get('/get', getTableDraft); // Allow viewing drafts even if expired
router.get('/all', getAllTableDrafts); // Allow viewing drafts even if expired
router.delete('/delete', deleteTableDraft); // Allow deleting drafts even if expired
router.post('/clear', clearTableDraft); // Allow clearing drafts even if expired
router.post('/mark-printed', verifyToken, checkSubscription, markKotsAsPrinted);

module.exports = router;
