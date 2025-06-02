const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validationHandler');
const {
    getTemplates,
    createDocument,
    previewTemplate
} = require('../controllers/documentGenerationController');

// Document generation routes
router.get('/templates', getTemplates);
router.get('/preview/:templateType', previewTemplate); // Matched param name to controller
router.post('/generate',
    [
        body('templateType').notEmpty().withMessage('Template type is required.').isString().withMessage('Template type must be a string.'),
        body('data').isObject().withMessage('Data must be an object.').notEmpty().withMessage('Data object cannot be empty.')
        // Consider adding more specific validation for fields within 'data' if necessary, e.g.:
        // body('data.disclosingParty').if(body('templateType').equals('nda')).notEmpty().withMessage('Disclosing party is required for NDA')
    ],
    validateRequest,
    createDocument
);

module.exports = router;
