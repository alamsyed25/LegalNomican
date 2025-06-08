/**
 * Test fixtures for chat messages
 */

module.exports = {
  validChatMessage: {
    sessionId: "test-session-123",
    message: "What legal implications should I consider when starting a business?",
    userInfo: {
      userId: "user123",
      username: "testuser",
      role: "client"
    }
  },
  
  invalidChatMessage: {
    // Missing sessionId
    message: "This message is missing required fields",
    userInfo: {
      userId: "user123"
    }
  },
  
  validResponse: {
    content: "When starting a business, you should consider the following legal aspects: business structure (LLC, corporation, etc.), tax obligations, employment laws, intellectual property protection, licensing requirements, insurance needs, and contracts/agreements. It's advisable to consult with a business attorney to ensure compliance with all applicable regulations.",
    sessionId: "test-session-123",
    messageId: "msg-123456"
  },
  
  mockDocumentContext: JSON.stringify({
    content: "This is a sample legal document with information about business incorporation.",
    metadata: {
      filename: "business_incorporation.pdf",
      fileSize: 1024,
      pageCount: 5
    },
    analysisResults: {
      keyPoints: [
        "Business incorporation requirements",
        "Tax implications",
        "Liability protection"
      ]
    }
  })
};
