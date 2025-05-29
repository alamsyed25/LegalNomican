const mongoose = require('mongoose');

/**
 * Schema for chat conversations
 */
const ChatConversationSchema = new mongoose.Schema({
    sessionId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    messages: [{
        sender: { 
            type: String, 
            enum: ['user', 'ai'], 
            required: true 
        },
        content: { 
            type: String, 
            required: true 
        },
        timestamp: { 
            type: Date, 
            default: Date.now 
        }
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Add indexes for performance
ChatConversationSchema.index({ sessionId: 1 });
ChatConversationSchema.index({ createdAt: -1 });

const ChatConversation = mongoose.model('ChatConversation', ChatConversationSchema);

module.exports = ChatConversation;
