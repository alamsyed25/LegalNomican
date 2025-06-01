const ChatConversation = require('../models/ChatConversation');
const { generateSessionId } = require('../utils/helpers');
const { generateAIResponse } = require('../utils/ai-service');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

const uploadedDocumentContext = {}; // Simple in-memory store for document text

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
            return res.status(400).json({
                success: false,
                message: 'Session ID and message are required'
            });
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
        console.error('Chat message error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing message. Please try again.'
        });
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
                return res.status(400).json({ success: false, error: 'No file uploaded.' });
            }

            const file = req.file;
            let extractedText = '';

            if (file.mimetype === 'application/pdf') {
                const data = await pdfParse(file.buffer);
                extractedText = data.text;
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const { value } = await mammoth.extractRawText({ buffer: file.buffer });
                extractedText = value;
            } else if (file.mimetype === 'application/msword') {
                // Mammoth can sometimes handle .doc, but it's less reliable than for .docx
                // For simplicity, we'll try. A more robust solution might involve a dedicated .doc parser.
                try {
                    const { value } = await mammoth.extractRawText({ buffer: file.buffer });
                    extractedText = value;
                } catch (mammothError) {
                    console.warn(`Mammoth failed to parse .doc file ${file.originalname}:`, mammothError);
                    return res.status(400).json({ success: false, error: 'Could not parse .doc file. Please try converting to DOCX or PDF.' });
                }
            } else if (file.mimetype === 'text/plain') {
                extractedText = file.buffer.toString('utf8');
            } else {
                return res.status(400).json({ success: false, error: 'Unsupported file type processed. This should have been caught by fileFilter.' });
            }

            if (!extractedText.trim()) {
                 return res.status(400).json({ success: false, error: 'Could not extract text from the document or the document is empty.' });
            }

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
            console.error('File upload error:', error);
            if (error.message.startsWith('File type not supported')) {
                 return res.status(400).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: 'Error processing file. Please try again.' });
        }
    }
];

module.exports = {
    startChatSession,
    processMessage,
    handleFileUpload // This should now be defined
};


