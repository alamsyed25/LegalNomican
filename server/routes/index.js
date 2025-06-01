const express = require('express');
const router = express.Router();

// Import route modules (existing ones first)
const demoRoutes = require('./demoRoutes');
const chatRoutes = require('./chatRoutes');
const healthRoutes = require('./healthRoutes');

// Working routes
const legalResearchRoutes = require('./legalResearchRoutes');
const contractRoutes = require('./contractRoutes');

// TEST: Add document generation routes
const documentGenerationRoutes = require('./documentGenerationRoutes');

// Apply all route modules
router.use('/demo', demoRoutes);
router.use('/chat', chatRoutes);
router.use('/health', healthRoutes);
router.use('/legal-research', legalResearchRoutes);
router.use('/contracts', contractRoutes);
router.use('/documents', documentGenerationRoutes);

module.exports = router;