const { performLegalResearch, analyzeCitations } = require('../services/researchService');

/**
 * Handle legal research requests
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const searchLegalCases = async (req, res) => {
    try {
        const { query, jurisdiction, dateRange, caseType } = req.body;
        
        if (!query || query.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 3 characters long'
            });
        }
        
        const options = {
            jurisdiction,
            dateRange,
            caseType
        };
        
        const results = await performLegalResearch(query, options);
        
        res.json({
            success: true,
            data: results
        });
        
    } catch (error) {
        console.error('Legal research error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing legal research'
        });
    }
};

/**
 * Verify case citations
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const verifyCitations = async (req, res) => {
    try {
        const { citations } = req.body;
        
        if (!Array.isArray(citations) || citations.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Citations array is required'
            });
        }
        
        const analysis = await analyzeCitations(citations);
        
        res.json({
            success: true,
            data: analysis
        });
        
    } catch (error) {
        console.error('Citation verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying citations'
        });
    }
};

module.exports = {
    searchLegalCases,
    verifyCitations
};