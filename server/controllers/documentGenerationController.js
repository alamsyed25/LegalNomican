const { 
    generateDocument, 
    getAvailableTemplates, 
    validateTemplateData 
} = require('../services/documentGenerationService');

/**
 * Get available document templates
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getTemplates = (req, res) => {
    try {
        const templates = getAvailableTemplates();
        
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving templates'
        });
    }
};

/**
 * Generate document from template
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const createDocument = async (req, res) => {
    try {
        const { templateType, data } = req.body;
        
        if (!templateType) {
            return res.status(400).json({
                success: false,
                message: 'Template type is required'
            });
        }
        
        if (!data || typeof data !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Template data is required'
            });
        }
        
        // Validate template data
        const validation = validateTemplateData(templateType, data);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template data',
                errors: validation.errors
            });
        }
        
        // Generate document
        const document = await generateDocument(templateType, data);
        
        res.json({
            success: true,
            data: document
        });
        
    } catch (error) {
        console.error('Document generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating document'
        });
    }
};

/**
 * Preview document template with sample data
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const previewTemplate = async (req, res) => {
    try {
        const { templateType } = req.params;
        
        // Sample data for preview
        const sampleData = {
            nda: {
                disclosingParty: 'ACME Corporation',
                receivingParty: 'Tech Solutions LLC',
                effectiveDate: new Date().toLocaleDateString(),
                duration: 'three (3) years'
            },
            service_agreement: {
                serviceProvider: 'Professional Services Inc.',
                client: 'Business Client Corp.',
                serviceDescription: 'Software development and consulting services',
                paymentTerms: 'Net 30 days from invoice date',
                startDate: new Date().toLocaleDateString(),
                intellectualPropertyOwner: 'Client'
            },
            employment_contract: {
                employer: 'ABC Company Inc.',
                employee: 'John Smith',
                position: 'Software Engineer',
                salary: '$75,000',
                startDate: new Date().toLocaleDateString(),
                benefits: 'Health insurance, 401(k), paid time off'
            }
        };
        
        const previewData = sampleData[templateType];
        if (!previewData) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }
        
        const document = await generateDocument(templateType, previewData);
        
        res.json({
            success: true,
            data: {
                ...document,
                isPreview: true,
                sampleData: previewData
            }
        });
        
    } catch (error) {
        console.error('Template preview error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating template preview'
        });
    }
};

module.exports = {
    getTemplates,
    createDocument,
    previewTemplate
};