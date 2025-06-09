const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validationErrorHandler, authenticate } = require('../middleware/errorMiddleware');
const DocumentController = require('../controllers/documentController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Document CRUD operations
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('format').optional().isIn(['html', 'markdown', 'plain']),
  validationErrorHandler
], DocumentController.createDocument);

router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid document ID'),
  body('content').optional().isString(),
  body('title').optional().isString(),
  body('changeLog').optional().isString(),
  validationErrorHandler
], DocumentController.updateDocument);

router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid document ID'),
  validationErrorHandler
], DocumentController.getDocument);

// Document versioning routes
router.get('/:id/versions', [
  param('id').isMongoId().withMessage('Invalid document ID'),
  validationErrorHandler
], DocumentController.getDocumentVersions);

// Document comparison routes
router.get('/compare/:documentId1', [
  param('documentId1').isMongoId().withMessage('Invalid document ID'),
  validationErrorHandler
], DocumentController.compareDocuments);

router.get('/compare/:documentId1/:documentId2', [
  param('documentId1').isMongoId().withMessage('Invalid first document ID'),
  param('documentId2').isMongoId().withMessage('Invalid second document ID'),
  validationErrorHandler
], DocumentController.compareDocuments);

router.get('/compare/version/:versionId1/:versionId2', [
  param('versionId1').isMongoId().withMessage('Invalid first version ID'),
  param('versionId2').isMongoId().withMessage('Invalid second version ID'),
  validationErrorHandler
], DocumentController.compareDocuments);

// Comparison results
router.get('/comparisons/:id', [
  param('id').isMongoId().withMessage('Invalid comparison ID'),
  validationErrorHandler
], DocumentController.getComparison);

router.get('/comparisons', DocumentController.getComparisonHistory);

// Keep existing template routes
const {
  getTemplates,
  createDocument: generateDocumentFromTemplate,
  previewTemplate
} = require('../controllers/documentGenerationController');

// Document generation routes
router.get('/templates', getTemplates);
router.get('/preview/:templateType', previewTemplate);
router.post('/generate',
  [
    body('templateType').notEmpty().withMessage('Template type is required.').isString().withMessage('Template type must be a string.'),
    body('data').isObject().withMessage('Data must be an object.').notEmpty().withMessage('Data object cannot be empty.')
  ],
  validationErrorHandler,
  generateDocumentFromTemplate
);

module.exports = router;
