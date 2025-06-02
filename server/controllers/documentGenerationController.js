const { 
    generateDocument, 
    getAvailableTemplates, 
    validateTemplateData,
    getTemplate 
} = require('../services/documentGenerationService');
const { handleError } = require('../utils/errorHandler');

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
        handleError(res, error);
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
            return handleError(res, new Error('Template type is required'), 400);
        }
        
        if (!data || typeof data !== 'object') {
            return handleError(res, new Error('Template data is required'), 400);
        }
        
        // Validate template data
        const validation = validateTemplateData(templateType, data);
        if (!validation.isValid) {
            // Create an error object that includes details for the handleError function
            const validationError = new Error('Invalid template data');
            validationError.details = validation.errors;
            return handleError(res, validationError, 400);
        }
        
        // Generate document
        const document = await generateDocument(templateType, data);
        
        res.json({
            success: true,
            data: document
        });
        
    } catch (error) {
        handleError(res, error);
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
            return handleError(res, new Error('Template not found for preview (no sample data).'), 404);
        }
        
        const templateDetails = getTemplate(templateType); // Get full template details (synchronous)

        if (!templateDetails) {
            return handleError(res, new Error('Template details not found for preview.'), 404);
        }

        const document = await generateDocument(templateType, previewData);
        
        res.json({
            success: true,
            data: {
                ...document,
                fields: templateDetails.fields, // Add the fields schema to the response
                isPreview: true,
                sampleData: previewData
            }
        });
        
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    getTemplates,
    createDocument,
    previewTemplate
};