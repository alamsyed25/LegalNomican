const ChatConversation = require('../models/ChatConversation');
const { generateSessionId } = require('../utils/helpers');
const { generateAIResponse } = require('../utils/ai-service');

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
        const aiResponse = await generateAIResponse(message);
        
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

module.exports = {
    startChatSession,
    processMessage
};
