const express = require('express');
const router = express.Router();
const { searchLegalCases, verifyCitations } = require('../controllers/legalResearchController');

// Legal research routes
router.post('/search', searchLegalCases);
router.post('/verify-citations', verifyCitations);

module.exports = router;