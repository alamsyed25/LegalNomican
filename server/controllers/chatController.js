const ChatConversation = require('../models/ChatConversation');
const { generateSessionId } = require('../utils/helpers');
const { generateAIResponse } = require('../utils/ai-service');
const { handleError } = require('../utils/errorHandler');
const { extractTextFromBuffer } = require('../services/documentGenerationService');
const multer = require('multer');
const path = require('path');

const uploadedDocumentContext = {}; // Simple in-memory store for document text

// Function to clean up old document contexts
const cleanupOldDocuments = () => {
    const now = Date.now();
    Object.keys(uploadedDocumentContext).forEach(sessionId => {
        const doc = uploadedDocumentContext[sessionId];
        // Check if the document context is older than 24 hours
        if (now - doc.timestamp > 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
            console.log(`Cleaning up old document context for session ${sessionId}, file ${doc.fileName}`);
            delete uploadedDocumentContext[sessionId];
        }
    });
};

// Run cleanup every hour
setInterval(cleanupOldDocuments, 60 * 60 * 1000); // 1 hour in milliseconds

// Multer setup for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|txt/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('File type not supported. Please upload PDF, DOC, DOCX, or TXT files.'));
    }
});

/**
 * Start a new chat session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
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
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const processMessage = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        
        if (!sessionId || !message) {
            // Pass a new error object with a statusCode for client errors
            return handleError(res, new Error('Session ID and message are required'), 400);
        }
        
        // Find or create conversation
        let conversation = await ChatConversation.findOne({ sessionId });
        if (!conversation) {
            conversation = new ChatConversation({ sessionId });
        }
        
        // Add user message
        conversation.messages.push({
            sender: 'user',
            content: message
        });
        
        // Generate AI response
        let documentTextForAI = null;
        if (sessionId && uploadedDocumentContext[sessionId]) { // sessionId is already defined in processMessage
            documentTextForAI = uploadedDocumentContext[sessionId].text;
            console.log(`Using document context for session ${sessionId} (file: ${uploadedDocumentContext[sessionId].fileName}) for AI response.`);
            // Context will persist for the session until overwritten by a new upload or server restart.
        }
        const aiResponse = await generateAIResponse(message, documentTextForAI);
        
        // Add AI response
        conversation.messages.push({
            sender: 'ai',
            content: aiResponse
        });
        
        await conversation.save();
        
        res.json({
            success: true,
            response: aiResponse
        });
        
    } catch (error) {
        handleError(res, error); // Defaults to 500 if error.statusCode is not set
    }
};

/**
 * Handle document upload for chat context
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const handleFileUpload = [ // Use an array to apply multer middleware first
    upload.single('document'), // 'document' is the field name from FormData
    async (req, res) => {
        try {
            if (!req.file) {
                return handleError(res, new Error('No file uploaded.'), 400);
            }

            const file = req.file;
            const extractedText = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);

            // For now, we're not storing the text or linking it to the session directly in DB
            // We'll just send a success message with a snippet
            // In a future step, this text would be used to augment AI responses
            const { sessionId } = req.body; 
            if (sessionId && extractedText) {
                uploadedDocumentContext[sessionId] = {
                    text: extractedText,
                    fileName: file.originalname,
                    timestamp: Date.now()
                };
                console.log(`Stored document context for session ${sessionId}, file ${file.originalname}. Text length: ${extractedText.length}`);
            }
            const snippet = extractedText.substring(0, 200);
            
            // TODO: Associate extractedText with the sessionId for use in generateAIResponse
            // For example, store in session, or pass a documentId to the client to send with messages
            // req.session.uploadedDocumentText = extractedText; // If using express-session

            res.json({
                success: true,
                message: `File "${file.originalname}" processed. Extracted ${extractedText.length} characters.`,
                fileName: file.originalname,
                textSnippet: snippet + (extractedText.length > 200 ? '...' : '')
            });

        } catch (error) {
            // Check if the error is one of the specific client-side errors we expect
            if (error.message.includes('Unsupported file type') || 
                error.message.includes('Could not parse') || 
                error.message.includes('File type not supported') || // from multer's fileFilter
                error.message.includes('Could not extract text')) {
                return handleError(res, error, 400); // Pass the original error, it has the message
            }
            // For any other errors, treat as a server error
            handleError(res, error); // Defaults to 500
        }
    }
];

module.exports = {
    startChatSession,
    processMessage,
    handleFileUpload // This should now be defined
};


