const ChatConversation = require('../models/ChatConversation');
const { generateSessionId } = require('../utils/helpers');
const { generateAIResponse } = require('../utils/ai-service');
const { handleError } = require('../utils/errorHandler');
const { extractTextFromBuffer } = require('../services/documentGenerationService');
const redisClient = require('../config/redis-config'); // Updated Redis client
const multer = require('multer');
const path = require('path');

// Constants for Redis
const DOCUMENT_CONTEXT_TTL = 24 * 60 * 60; // 24 hours in seconds
const DOCUMENT_CONTEXT_PREFIX = 'doc:ctx:';

// Multer setup for file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        console.log('Multer file filter processing:', file.originalname, file.mimetype);
        const allowedTypes = /pdf|doc|docx|txt/i; // Case-insensitive
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only .pdf, .doc, .docx, and .txt format allowed!'));
        }
    }
});

// Create an explicit instance for handling uploads
const documentUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        console.log('Document upload processing file:', file.originalname, file.mimetype);
        const allowedTypes = /pdf|doc|docx|txt/i;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only .pdf, .doc, .docx, and .txt format allowed!'));
        }
    }
}).single('document');

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
const storeDocumentContextInRedis = async (sessionId, documentData) => {
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
const getDocumentContextFromRedis = async (sessionId) => {
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
const deleteDocumentContextFromRedis = async (sessionId) => {
    try {
        const key = getDocumentContextKey(sessionId);
        const deleted = await redisClient.del(key);
        console.log(`Document context for session ${sessionId} (key: ${key}) deletion attempt, result: ${deleted}`);
        return true; // Consider it success even if key didn't exist
    } catch (error) {
        console.error(`Error deleting document context from Redis for session ${sessionId}:`, error);
        return false;
    }
};

/**
 * Start a new chat session
 */
const startChatSession = (req, res) => {
    const sessionId = generateSessionId();
    res.json({ 
        success: true, 
        sessionId,
        welcomeMessage: "Hello! I'm your Legal Nomicon assistant. How can I help you today?"
    });
};

/**
 * Process a chat message and generate a response
 */
const processMessage = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        
        if (!sessionId || !message) {
            return handleError(res, new Error('Session ID and message are required'), 400);
        }
        
        let conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            conversation = new ChatConversation({ sessionId });
        }
        
        conversation.messages.push({ sender: 'user', content: message });
        
        let documentTextForAI = null;
        const documentContext = await getDocumentContextFromRedis(sessionId);
        
        if (documentContext && documentContext.text) {
            documentTextForAI = documentContext.text;
            console.log(`Using document context for session ${sessionId} (file: ${documentContext.fileName}) for AI response.`);
        } else {
            console.log(`No document context found in Redis for session ${sessionId} or context is invalid.`);
        }
        
        const aiResponse = await generateAIResponse(message, documentTextForAI);
        
        conversation.messages.push({ sender: 'ai', content: aiResponse });
        await conversation.save();
        
        res.json({ success: true, response: aiResponse, sessionId });
    } catch (error) {
        // Log the detailed error on the server
        console.error('Error in processMessage:', error);
        // Send a generic error response to the client
        handleError(res, new Error('Failed to process message due to a server error.'), 500);
    }
};

/**
 * Handle document upload for chat context
 * This is a single function now, not an array of middleware.
 * Multer is applied directly within.
 */
const uploadDocument = (req, res) => {
    console.log('Upload document handler called with headers:', req.headers['content-type']);
    console.log('Body before multer processing:', req.body);
    
    // Use our enhanced document upload middleware
    documentUpload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error('Multer error during document upload:', err);
            return handleError(res, new Error(`File upload error: ${err.message}`), 400);
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error('Unknown error during document upload:', err);
            return handleError(res, new Error(err.message || 'File type not supported or other upload error'), 400);
        }

        // If file upload itself is successful
        if (!req.file) {
            return handleError(res, new Error('No file uploaded. Please select a file.'), 400);
        }

        const { sessionId } = req.body;
        if (!sessionId) {
            // Clean up uploaded file if session ID is missing? 
            // For memoryStorage, it's not on disk, so less critical.
            return handleError(res, new Error('Session ID is required for document upload.'), 400);
        }

        try {
            console.log(`Processing uploaded file: ${req.file.originalname} for session ${sessionId}`);
            const text = await extractTextFromBuffer(req.file.buffer, req.file.originalname);
            
            if (!text || text.trim() === '') {
                console.warn(`Extracted text is empty for file ${req.file.originalname}, session ${sessionId}`);
                // Decide if this is an error or just a warning. For now, let's inform the user.
                return handleError(res, new Error('Could not extract text from the document or document is empty.'), 400);
            }

            const documentData = {
                fileName: req.file.originalname,
                text: text,
                uploadedAt: new Date().toISOString()
            };

            const stored = await storeDocumentContextInRedis(sessionId, documentData);
            if (!stored) {
                // storeDocumentContextInRedis logs the error internally
                return handleError(res, new Error('Failed to store document context. Please try again.'), 500);
            }
            
            res.json({
                success: true,
                message: 'Document uploaded and context stored successfully.',
                fileName: req.file.originalname,
                sessionId
            });
        } catch (processingError) {
            // Catch errors from extractTextFromBuffer or other processing steps
            console.error('Error processing document after upload:', processingError);
            handleError(res, new Error('Failed to process document after upload.'), 500);
        }
    });
};

/**
 * Clear document context for a session from Redis
 */
const clearDocumentContext = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return handleError(res, new Error('Session ID is required to clear context.'), 400);
        }
        
        const cleared = await deleteDocumentContextFromRedis(sessionId);
        if (cleared) {
            res.json({ success: true, message: 'Document context cleared successfully.', sessionId });
        } else {
            // deleteDocumentContextFromRedis logs the error
            handleError(res, new Error('Failed to clear document context or no context found.'), 500);
        }
    } catch (error) {
        console.error('Error in clearDocumentContext controller:', error);
        handleError(res, new Error('Server error while clearing document context.'), 500);
    }
};

module.exports = {
    startChatSession,
    processMessage,
    uploadDocument, // Export the handler function directly
    clearDocumentContext
    // Note: 'upload' (multer instance) is not exported anymore as it's used internally by uploadDocument
};
