const multer = require('multer');
const path = require('path');
const { analyzeContract, extractClauses } = require('../services/contractService');
const { extractTextFromDocument, validateDocument } = require('../services/documentService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: (process.env.MAX_FILE_SIZE || 10) * 1024 * 1024 // 10MB default
    }
});

/**
 * Upload and analyze contract document
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const uploadAndAnalyzeContract = async (req, res) => {
    try {
        const file = req.file;
        
        // Validate file
        const validation = validateDocument(file);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }
        
        // Extract text from document
        const extractedContent = await extractTextFromDocument(file);
        
        // Analyze contract
        const analysis = await analyzeContract(extractedContent.text);
        
        res.json({
            success: true,
            data: {
                document: {
                    filename: extractedContent.metadata.filename,
                    wordCount: extractedContent.wordCount,
                    size: extractedContent.metadata.size
                },
                analysis
            }
        });
        
    } catch (error) {
        console.error('Contract upload and analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing contract. Please try again.'
        });
    }
};

/**
 * Analyze contract text directly
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const analyzeContractText = async (req, res) => {
    try {
        const { contractText, analysisOptions } = req.body;
        
        if (!contractText || contractText.trim().length < 100) {
            return res.status(400).json({
                success: false,
                message: 'Contract text must be at least 100 characters long'
            });
        }
        
        const analysis = await analyzeContract(contractText, analysisOptions);
        
        res.json({
            success: true,
            data: analysis
        });
        
    } catch (error) {
        console.error('Contract text analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing contract text'
        });
    }
};

/**
 * Extract specific clauses from contract
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const extractContractClauses = async (req, res) => {
    try {
        const { contractText, clauseTypes } = req.body;
        
        if (!contractText) {
            return res.status(400).json({
                success: false,
                message: 'Contract text is required'
            });
        }
        
        const clauses = await extractClauses(contractText, clauseTypes);
        
        res.json({
            success: true,
            data: clauses
        });
        
    } catch (error) {
        console.error('Clause extraction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error extracting clauses'
        });
    }
};

module.exports = {
    upload: upload.single('contract'),
    uploadAndAnalyzeContract,
    analyzeContractText,
    extractContractClauses
};