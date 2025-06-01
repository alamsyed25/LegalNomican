const express = require('express');
const router = express.Router();
const { 
    upload, 
    uploadAndAnalyzeContract, 
    analyzeContractText, 
    extractContractClauses 
} = require('../controllers/contractController');

// Contract analysis routes
router.post('/upload', upload, uploadAndAnalyzeContract);
router.post('/analyze', analyzeContractText);
router.post('/extract-clauses', extractContractClauses);

module.exports = router;