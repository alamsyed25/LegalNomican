/**
 * Validation middleware for demo form submissions
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateDemoSubmission = (req, res, next) => {
    const { firstName, lastName, workEmail, companyName, jobTitle, firmSize, useCase } = req.body;
    
    const errors = [];
    
    if (!firstName || firstName.trim().length < 2) {
        errors.push('First name must be at least 2 characters');
    }
    if (!lastName || lastName.trim().length < 2) {
        errors.push('Last name must be at least 2 characters');
    }
    if (!workEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
        errors.push('Valid work email is required');
    }
    if (!companyName || companyName.trim().length < 2) {
        errors.push('Company name is required');
    }
    if (!jobTitle) {
        errors.push('Job title is required');
    }
    if (!firmSize) {
        errors.push('Firm size is required');
    }
    if (!useCase) {
        errors.push('Use case is required');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }
    
    next();
};

module.exports = {
    validateDemoSubmission
};
