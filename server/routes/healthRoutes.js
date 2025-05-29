const express = require('express');
const router = express.Router();
const { checkHealth } = require('../controllers/healthController');

// Health check route
router.get('/', checkHealth);

module.exports = router;
