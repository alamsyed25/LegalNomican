const OpenAI = require('openai');

// Initialize OpenAI client
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('OPENAI_API_KEY not found. AI service will use mock responses or may not function correctly.');
}

/**
 * AI Service to handle chat responses
 */

/**
 * Generate an AI response based on user input
 * @param {string} message - User message
 * @returns {Promise<string>} - AI response
 */
const generateAIResponse = async (message, documentText = null) => {
    // Prioritize OpenAI if the client is initialized (API key is present)
    if (openai) {
        try {
            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || "gpt-3.5-turbo", // Use model from .env or default
                messages: [
                    ...(documentText ? [{ role: "system", content: `Use the following document content to answer the user's question. If the question is not directly related to the document, answer as a general legal AI. Document Content:\n\n${documentText}` }] : []),
                    { role: "system", content: "You are Legal Nomicon, a helpful AI legal assistant. Your primary role is to provide information and answer questions based on the legal document provided. If no document is provided, or if the question is not related to a provided document, answer as a general AI legal assistant. Be concise and clear in your responses. If asked a question outside of the legal domain, politely state that you are specialized in legal topics." },
                    { role: "user", content: message }
                ],
                temperature: parseFloat(process.env.TEMPERATURE) || 0.7, // Use temperature from .env or default
                max_tokens: parseInt(process.env.MAX_TOKENS) || 1000,    // Use max_tokens from .env or default
            });
            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error generating AI response from OpenAI:', error);
            // Fallback to mock response if OpenAI fails and we are in development
            if (process.env.NODE_ENV === 'development') {
                console.warn('OpenAI call failed, falling back to mock response in development.');
                return generateMockResponse(message, `OpenAI Error: ${error.message}`);
            }
            return 'I apologize, but I encountered an issue processing your request with the AI service. Please try again later.';
        }
    } else {
        // If OpenAI client is not initialized (no API key), use mock responses for development
        // If OpenAI client is not initialized (no API key), use mock responses for development
        console.warn('OpenAI client not initialized. Falling back to mock response.'); // General warning when client is missing
        if (process.env.NODE_ENV === 'development') {
            console.warn('OpenAI API key not configured, using mock responses for development.');
            return generateMockResponse(message, 'OpenAI API Key not configured.');
        }
        // In production, if no API key, it's a critical error
        console.error('CRITICAL: OpenAI API key not configured in production.');
        return 'The AI service is currently unavailable. Please contact support.';
    }
};

/**
 * Generate mock responses for development and testing
 * @param {string} message - User message
 * @returns {Promise<string>} - Mock AI response
 */
const generateMockResponse = async (message, errorContext = null) => {
    let prefix = '';
    if (errorContext) {
        prefix = `(Mock due to Error: ${errorContext})\n`;
    }
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const message_lower = message.toLowerCase();
    
    if (message_lower.includes('contract') || message_lower.includes('agreement')) {
        return `I can help you analyze contracts and agreements. Here are the key areas I typically review:

- **Risk Assessment**: Identifying potential liability and compliance issues
- **Clause Analysis**: Reviewing critical provisions like termination, indemnification, and dispute resolution
- **Compliance Checking**: Ensuring adherence to applicable laws and regulations

Would you like me to review a specific contract, or do you have questions about particular clauses?`;
    } else if (message_lower.includes('force majeure')) {
        return `Force majeure clauses have evolved significantly, especially post-COVID. Here's what you should know:

**Essential Elements:**
- Clear definition of qualifying events (natural disasters, pandemics, government actions)
- Specific notice requirements and timeframes
- Mitigation obligations for both parties

**Recent Legal Developments:**
Courts have become more restrictive in interpreting these clauses. The key test is whether the event actually prevents performance, not just makes it more difficult.

Would you like me to review your specific force majeure language?`;
    } else {
        return prefix + `I understand you're asking about "${message}". To provide the most helpful legal guidance, I'd like to know more about:

- The specific legal area or context
- Whether this relates to a contract, compliance issue, or legal research
- Any relevant jurisdiction or industry considerations

What specific aspect would you like to explore further?`;
    }
};

module.exports = {
    generateAIResponse
};
