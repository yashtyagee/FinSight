const express = require('express');
const router = express.Router();
const advisorController = require('../controllers/advisorController');

// POST /api/advisor/chat
router.post('/chat', advisorController.getAdvice);

// GET /api/advisor/health
router.get('/health', advisorController.getHealthScore);

module.exports = router;
