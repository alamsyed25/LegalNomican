/**
 * Generate a unique session ID for chat conversations
 * @returns {string} - Unique session ID
 */
const generateSessionId = () => {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Extract client information from request object
 * @param {Request} req - Express request object
 * @returns {Object} - Client information object
 */
const extractClientInfo = (req) => ({
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    referrer: req.get('Referer')
});

module.exports = {
    generateSessionId,
    extractClientInfo
};
