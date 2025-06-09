// server/controllers/chatController.js - Improved version
const ChatConversation = require('../models/ChatConversation');
const { generateSessionId } = require('../utils/helpers');
const { generateAIResponse } = require('../utils/ai-service');
const { handleError } = require('../utils/errorHandler');
const documentService = require('../services/documentService');
const documentContextService = require('../services/documentContextService');
const { asyncHandler } = require('../middleware/errorMiddleware');
const multer = require('multer');

// Configure multer for document uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { 
        fileSize: (process.env.MAX_FILE_SIZE || 10) * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        const validation = documentService.validateFile(file);
        if (validation.isValid) {
            cb(null, true);
        } else {
            cb(new Error(validation.error));
        }
    }
});

/**
 * Start a new chat session
 */
const startChatSession = asyncHandler(async (req, res) => {
    const sessionId = generateSessionId();
    
    res.json({ 
        success: true, 
        sessionId,
        welcomeMessage: "Hello! I'm your Legal Nomicon assistant. How can I help you today?"
    });
});

/**
 * Process a chat message and generate a response
 */
const processMessage = asyncHandler(async (req, res) => {
    const { sessionId, message } = req.body;
    
    // Find or create conversation
    let conversation = await ChatConversation.findOne({ sessionId });
    if (!conversation) {
        conversation = new ChatConversation({ sessionId });
    }
    
    // Add user message
    conversation.messages.push({ sender: 'user', content: message });
    
    // Get document context if available
    const documentContext = await documentContextService.get(sessionId);
    let documentText = null;
    
    if (documentContext?.text) {
        documentText = documentContext.text;
        console.log(`Using document context for session ${sessionId}`);
    }
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, documentText);
    
    // Add AI response and save
    conversation.messages.push({ sender: 'ai', content: aiResponse });
    await conversation.save();
    
    res.json({ 
        success: true, 
        response: aiResponse, 
        sessionId,
        hasContext: !!documentText
    });
});

/**
 * Handle document upload for chat context
 */
const uploadDocument = (req, res) => {
    upload.single('document')(req, res, asyncHandler(async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                throw new Error(`Upload error: ${err.message}`);
            }
            throw err;
        }

        if (!req.file) {
            const error = new Error('No file uploaded');
            error.statusCode = 400;
            throw error;
        }

        const { sessionId } = req.body;
        if (!sessionId) {
            const error = new Error('Session ID is required');
            error.statusCode = 400;
            throw error;
        }

        // Extract text from document
        const text = await documentService.extractText(
            req.file.buffer, 
            req.file.mimetype, 
            req.file.originalname
        );

        // Store in Redis with metadata
        const documentData = {
            fileName: req.file.originalname,
            text,
            uploadedAt: new Date().toISOString(),
            fileSize: req.file.size,
            fileType: documentService.getFileTypeInfo(req.file.mimetype)
        };

        const stored = await documentContextService.store(sessionId, documentData);
        
        if (!stored) {
            throw new Error('Failed to store document context');
        }

        res.json({
            success: true,
            message: `Document "${req.file.originalname}" uploaded and processed successfully`,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            wordCount: text.split(/\s+/).length,
            sessionId
        });
    }));
};

/**
 * Clear document context for a session
 */
const clearDocumentContext = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    
    if (!sessionId) {
        const error = new Error('Session ID is required');
        error.statusCode = 400;
        throw error;
    }
    
    const cleared = await documentContextService.remove(sessionId);
    
    if (!cleared) {
        throw new Error('Failed to clear document context');
    }

    res.json({ 
        success: true, 
        message: 'Document context cleared successfully', 
        sessionId 
    });
});

/**
 * Get session information including document context status
 */
const getSessionInfo = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    // Get conversation
    const conversation = await ChatConversation.findOne({ sessionId });
    
    // Get document context
    const documentContext = await documentContextService.get(sessionId);
    
    res.json({
        success: true,
        sessionId,
        hasConversation: !!conversation,
        messageCount: conversation?.messages?.length || 0,
        hasDocumentContext: !!documentContext,
        documentInfo: documentContext ? {
            fileName: documentContext.fileName,
            uploadedAt: documentContext.uploadedAt,
            fileType: documentContext.fileType
        } : null
    });
});

module.exports = {
    startChatSession,
    processMessage,
    uploadDocument,
    clearDocumentContext,
    getSessionInfo
};
