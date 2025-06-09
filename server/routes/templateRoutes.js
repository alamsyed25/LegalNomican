const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validationErrorHandler } = require('../middleware/errorMiddleware');
const templateService = require('../services/templateService');
const { asyncHandler, authenticate } = require('../middleware/errorMiddleware');

/**
 * @route   POST /api/templates
 * @desc    Create a new template
 * @access  Private
 */
router.post('/',
  authenticate,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('format').isIn(['html', 'markdown', 'plain']).withMessage('Invalid format')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const template = await templateService.createTemplate(req.body, req.user.id);
    res.status(201).json({ success: true, data: template });
  })
);

/**
 * @route   GET /api/templates
 * @desc    Get templates for user (including public ones)
 * @access  Private
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const templates = await templateService.getUserTemplates(req.user.id, {
      category: req.query.category,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      isPublic: req.query.isPublic === 'true' ? true : (req.query.isPublic === 'false' ? false : undefined),
      searchTerm: req.query.search,
      sortBy: req.query.sortBy,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      complexity: req.query.complexity
    });
    res.json({ success: true, data: templates });
  })
);

/**
 * @route   GET /api/templates/popular
 * @desc    Get popular templates
 * @access  Private
 */
router.get('/popular',
  authenticate,
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const templates = await templateService.getPopularTemplates(limit);
    res.json({ success: true, data: templates });
  })
);

/**
 * @route   GET /api/templates/categories
 * @desc    Get template categories
 * @access  Private
 */
router.get('/categories',
  authenticate,
  asyncHandler(async (req, res) => {
    const categories = await templateService.getCategories();
    res.json({ success: true, data: categories });
  })
);

/**
 * @route   GET /api/templates/tags
 * @desc    Get popular tags
 * @access  Private
 */
router.get('/tags',
  authenticate,
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const tags = await templateService.getPopularTags(limit);
    res.json({ success: true, data: tags });
  })
);

/**
 * @route   GET /api/templates/:id
 * @desc    Get a specific template
 * @access  Private
 */
router.get('/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID'),
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const template = await templateService.getTemplate(req.params.id, req.user.id);
    res.json({ success: true, data: template });
  })
);

/**
 * @route   PUT /api/templates/:id
 * @desc    Update template (creates new version)
 * @access  Private
 */
router.put('/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID'),
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty'),
    body('format').optional().isIn(['html', 'markdown', 'plain']).withMessage('Invalid format')
  ],
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const template = await templateService.updateTemplate(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: template });
  })
);

/**
 * @route   DELETE /api/templates/:id
 * @desc    Delete template (soft delete)
 * @access  Private
 */
router.delete('/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID'),
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const result = await templateService.deleteTemplate(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  })
);

/**
 * @route   GET /api/templates/:id/versions
 * @desc    Get template version history
 * @access  Private
 */
router.get('/:id/versions',
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID'),
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const versions = await templateService.getTemplateVersions(req.params.id, req.user.id);
    res.json({ success: true, data: versions });
  })
);

/**
 * @route   POST /api/templates/:id/clone
 * @desc    Clone a template
 * @access  Private
 */
router.post('/:id/clone',
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID'),
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const cloned = await templateService.cloneTemplate(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, data: cloned });
  })
);

/**
 * @route   POST /api/templates/:id/generate
 * @desc    Generate document from template
 * @access  Private
 */
router.post('/:id/generate',
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID'),
  body('variables').isObject().withMessage('Variables must be an object'),
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const document = await templateService.generateDocument(req.params.id, req.body.variables, req.user.id);
    res.status(201).json({ success: true, data: document });
  })
);

/**
 * @route   POST /api/templates/:id/rate
 * @desc    Rate a template
 * @access  Private
 */
router.post('/:id/rate',
  authenticate,
  param('id').isMongoId().withMessage('Invalid template ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  validationErrorHandler,
  asyncHandler(async (req, res) => {
    const template = await templateService.rateTemplate(req.params.id, req.body.rating, req.user.id);
    res.json({ success: true, data: template });
  })
);

module.exports = router;
