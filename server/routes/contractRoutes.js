const express = require('express');
const router = express.Router();
const { 
    upload, 
    uploadAndAnalyzeContract, 
    analyzeContractText, 
    extractContractClauses 
} = require('../controllers/contractController');
const { trackContractReview } = require('../middleware/usageTracker');

// Contract analysis routes with usage tracking
router.post('/upload', trackContractReview, upload, uploadAndAnalyzeContract);
router.post('/analyze', trackContractReview, analyzeContractText);
router.post('/extract-clauses', extractContractClauses);

module.exports = router;