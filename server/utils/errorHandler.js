/**
 * Centralized Error Handler for LegalNomican API
 */

/**
 * Sends a standardized error response.
 * Logs the error server-side, especially for 500-level errors.
 *
 * @param {object} res - Express response object.
 * @param {Error} error - The error object. Should ideally have a `message` property.
 *                        It can optionally have a `statusCode` property for specific HTTP status codes (e.g., 400, 401, 404).
 *                        It can also have a `details` property for additional structured error information (for 4xx errors).
 * @param {number} [defaultStatusCode=500] - The default HTTP status code to use if error.statusCode is not set.
 */
const handleError = (res, error, defaultStatusCode = 500) => {
    const statusCode = error.statusCode || defaultStatusCode;
    const errorMessage = error.message || 'An unexpected error occurred. Please try again.';

    // Log the error server-side
    // For 500 errors, log the full error object for debugging. For client errors (4xx), message might be enough.
    if (statusCode >= 500) {
        console.error(`[Server Error ${statusCode}]: ${error.stack || error}`);
    } else {
        // For client errors, a less verbose log might be sufficient, but logging the message is still useful.
        console.warn(`[Client Error ${statusCode}]: ${errorMessage}`, error.details || '');
    }

    const responsePayload = {
        success: false,
        message: errorMessage,
    };

    // Only include details for client-side errors (4xx) and if details exist
    if (statusCode < 500 && error.details) {
        responsePayload.details = error.details;
    }

    // For 500 errors, ensure a generic message is sent to the client to avoid leaking sensitive details.
    if (statusCode >= 500) {
        responsePayload.message = 'An internal server error occurred. Please try again later.';
    }

    res.status(statusCode).json(responsePayload);
};

module.exports = {
    handleError,
};
