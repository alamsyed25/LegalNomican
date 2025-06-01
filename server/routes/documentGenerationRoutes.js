const express = require('express');
const router = express.Router();
const { 
    getTemplates, 
    createDocument, 
    previewTemplate 
} = require('../controllers/documentGenerationController');
const { trackDocumentGeneration } = require('../middleware/usageTracker');

// Document generation routes with usage tracking
router.get('/templates', getTemplates);
router.post('/generate', trackDocumentGeneration, createDocument);
router.get('/preview/:templateType', previewTemplate);

module.exports = router;