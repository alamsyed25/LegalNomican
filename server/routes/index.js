const express = require('express');
const router = express.Router();

// Import route modules
const demoRoutes = require('./demoRoutes');
const chatRoutes = require('./chatRoutes');
const healthRoutes = require('./healthRoutes');

// Apply route modules
router.use('/demo', demoRoutes);
router.use('/chat', chatRoutes);
router.use('/health', healthRoutes);

module.exports = router;
