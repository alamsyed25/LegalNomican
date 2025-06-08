/**
 * Document Context Service
 * Centralized service for managing document contexts in Redis
 */
const redisClient = require('../config/redis-config');

// Constants for Redis
const DOCUMENT_CONTEXT_TTL = 24 * 60 * 60; // 24 hours in seconds
const DOCUMENT_CONTEXT_PREFIX = 'doc:ctx:';

/**
 * Get document context key for Redis
 * @param {string} sessionId - The session ID
 * @returns {string} - The Redis key for the document context
 */
const getDocumentContextKey = (sessionId) => {
    return `${DOCUMENT_CONTEXT_PREFIX}${sessionId}`;
};

/**
 * Store document context in Redis
 * @param {string} sessionId - The session ID
 * @param {Object} documentData - The document data to store { fileName, text, uploadedAt }
 * @returns {Promise<boolean>} - True if successful
 */
const store = async (sessionId, documentData) => {
    try {
        const key = getDocumentContextKey(sessionId);
        // Use options object for EX as per redis v4 client.set method
        await redisClient.set(key, documentData, { EX: DOCUMENT_CONTEXT_TTL });
        console.log(`Stored document context in Redis for session ${sessionId}, key ${key}`);
        return true;
    } catch (error) {
        console.error(`Error storing document context in Redis for session ${sessionId}:`, error);
        // Do not re-throw here, allow controller to handle user response
        return false;
    }
};

/**
 * Get document context from Redis
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object|null>} - The document context or null if not found or error
 */
const get = async (sessionId) => {
    try {
        const key = getDocumentContextKey(sessionId);
        const data = await redisClient.get(key); // redisClient.get already parses JSON if possible
        if (data) {
            console.log(`Retrieved document context from Redis for session ${sessionId}, key ${key}`);
        }
        return data; // Will be null if key doesn't exist
    } catch (error) {
        console.error(`Error getting document context from Redis for session ${sessionId}:`, error);
        return null; // Return null on error to prevent breaking chat flow
    }
};

/**
 * Delete document context from Redis
 * @param {string} sessionId - The session ID
 * @returns {Promise<boolean>} - True if deleted or key didn't exist, false on error
 */
const remove = async (sessionId) => {
    try {
        const key = getDocumentContextKey(sessionId);
        await redisClient.del(key);
        console.log(`Deleted document context from Redis for session ${sessionId}, key ${key}`);
        return true;
    } catch (error) {
        console.error(`Error deleting document context from Redis for session ${sessionId}:`, error);
        return false;
    }
};

/**
 * Initialize document context cleanup job
 * This removes document contexts older than their TTL
 * @returns {Object} - The interval object for cleanup
 */
const initCleanupJob = () => {
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
    
    console.log('Starting document context cleanup job');
    
    // Return the interval so it can be cleared if needed
    return setInterval(() => {
        console.log('Running document context cleanup job');
        // Redis TTL handles most of this automatically
        // Additional cleanup logic could be added here if needed
    }, CLEANUP_INTERVAL);
};

module.exports = {
    store,
    get,
    remove,
    initCleanupJob,
    // Export constants for use in other modules if needed
    DOCUMENT_CONTEXT_TTL,
    DOCUMENT_CONTEXT_PREFIX
};
