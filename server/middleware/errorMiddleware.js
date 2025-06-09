// server/middleware/errorMiddleware.js
const { handleError } = require('../utils/errorHandler');

/**
 * Global error handling middleware
 * Catches all unhandled errors and formats them consistently
 */
const globalErrorHandler = (error, req, res, next) => {
    // If response already sent, delegate to Express default error handler
    if (res.headersSent) {
        return next(error);
    }

    // Log the error with request context
    console.error('Global Error Handler:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });

    // Use centralized error handler
    handleError(res, error);
};

/**
 * Handle 404 errors for unmatched routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.url}`);
    error.statusCode = 404;
    handleError(res, error, 404);
};

/**
 * Async error wrapper - eliminates need for try/catch in controllers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Validation error handler specifically for express-validator
 */
const validationErrorHandler = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const validationError = new Error('Validation failed');
        validationError.statusCode = 400;
        validationError.details = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));
        return handleError(res, validationError, 400);
    }
    
    next();
};

module.exports = {
    globalErrorHandler,
    notFoundHandler,
    asyncHandler,
    validationErrorHandler
};
