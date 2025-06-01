const express = require('express');
const router = express.Router();
const { 
    getTemplates, 
    createDocument, 
    previewTemplate 
} = require('../controllers/documentGenerationController');

// Document generation routes
router.get('/templates', getTemplates);
router.post('/generate', createDocument);
router.get('/preview/:templateType', previewTemplate);

module.exports = router;