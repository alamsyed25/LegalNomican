const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const documentComparisonService = require('../services/documentComparisonService');
const { validationErrorHandler, asyncHandler, authenticate } = require('../middleware/errorMiddleware');

/**
 * @route   POST /api/compare
 * @desc    Compare two documents
 * @access  Private
 */
router.post('/',
  authenticate,
  [
    body('document1').notEmpty().withMessage('First document is required'),
    body('document2').notEmpty().withMessage('Second document is required'),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const { document1, document2, options = {} } = req.body;
    options.userId = req.user.id;
    
    const result = await documentComparisonService.compareDocuments(document1, document2, options);
    res.json({ success: true, data: result });
  })
);

/**
 * @route   GET /api/compare/history
 * @desc    Get user comparison history
 * @access  Private
 */
router.get('/history',
  authenticate,
  asyncHandler(async (req, res) => {
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      skip: req.query.skip ? parseInt(req.query.skip) : 0,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder === 'asc' ? 1 : -1
    };
    
    const history = await documentComparisonService.getComparisonHistory(req.user.id, options);
    res.json({ success: true, data: history });
  })
);

/**
 * @route   GET /api/compare/:id
 * @desc    Get specific comparison result
 * @access  Private
 */
router.get('/:id',
  authenticate,
  param('id').notEmpty().withMessage('Comparison ID is required'),
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const result = await documentComparisonService.getComparisonResult(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  })
);

/**
 * @route   POST /api/compare/versions
 * @desc    Compare two versions of a document
 * @access  Private
 */
router.post('/versions',
  authenticate,
  [
    body('documentId').notEmpty().withMessage('Document ID is required'),
    body('version1').isNumeric().withMessage('Version 1 must be a number'),
    body('version2').isNumeric().withMessage('Version 2 must be a number')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const { documentId, version1, version2 } = req.body;
    
    const result = await documentComparisonService.compareVersions(
      documentId, 
      parseInt(version1), 
      parseInt(version2), 
      req.user.id
    );
    
    res.json({ success: true, data: result });
  })
);

/**
 * @route   GET /api/compare/:id/export/:format
 * @desc    Export comparison result in specified format
 * @access  Private
 */
router.get('/:id/export/:format',
  authenticate,
  [
    param('id').notEmpty().withMessage('Comparison ID is required'),
    param('format').isIn(['json', 'html', 'csv']).withMessage('Format must be json, html, or csv')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const { id, format } = req.params;
    const exported = await documentComparisonService.exportComparison(id, format, req.user.id);
    
    // Set appropriate content type
    switch(format.toLowerCase()) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="comparison-${id}.json"`);
        break;
      case 'html':
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="comparison-${id}.html"`);
        break;
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="comparison-${id}.csv"`);
        break;
    }
    
    res.send(exported);
  })
);

module.exports = router;
