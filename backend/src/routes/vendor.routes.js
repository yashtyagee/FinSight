const express = require('express');
const router = express.Router();
const { getVendorAnalysis } = require('../controllers/vendorController');

// GET /api/vendors/analysis
router.get('/analysis', getVendorAnalysis);

module.exports = router;
