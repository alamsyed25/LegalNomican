const { validationResult } = require('express-validator');
const { handleError } = require('../utils/errorHandler');

/**
 * Middleware to handle validation errors from express-validator.
 * If validation errors exist, it sends a 400 response using the centralized handleError utility.
 * Otherwise, it passes control to the next middleware.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Format errors for better readability if needed, or pass them directly
        const errorDetails = errors.array().map(err => ({ 
            path: err.path,     // Use err.path for the field/path
            message: err.msg,
            value: err.value    // err.value should be the actual value that failed for this specific error
        }));
        
        const validationError = new Error('Validation failed.');
        validationError.details = errorDetails;
        return handleError(res, validationError, 400);
    }
    next();
};

module.exports = {
    validateRequest,
};
