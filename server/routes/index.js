const express = require('express');
const router = express.Router();

// Import route modules
const demoRoutes = require('./demoRoutes');
const chatRoutes = require('./chatRoutes');
const healthRoutes = require('./healthRoutes');
const legalResearchRoutes = require('./legalResearchRoutes');
const contractRoutes = require('./contractRoutes');
const documentGenerationRoutes = require('./documentGenerationRoutes');

// Apply route modules
router.use('/demo', demoRoutes);
router.use('/chat', chatRoutes);
router.use('/health', healthRoutes);
router.use('/legal-research', legalResearchRoutes);
router.use('/contracts', contractRoutes);
router.use('/documents', documentGenerationRoutes);

module.exports = router;
