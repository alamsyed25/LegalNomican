document.addEventListener('DOMContentLoaded', function() {
    // Document Services Integration
    window.documentGeneration = window.documentGeneration || {};
    window.documentServices = window.documentServices || {};
    
    // DOM Elements
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.chat-send-btn');
    const chatUploadBtn = document.getElementById('chat-upload-btn');
    const chatFileInput = document.getElementById('chat-file-input');
    const chatMessages = document.querySelector('.chat-messages');
    const typingIndicator = document.querySelector('.typing-indicator');
    const newChatButton = document.querySelector('.new-chat-btn');
    const demoItems = document.querySelectorAll('.demo-item');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const chatSidebar = document.querySelector('.chat-sidebar');
    
    // Document handling state
    let lastMessageWasDocumentAnalysisRequest = false;
    
    // Chat session management
    let sessionId = localStorage.getItem('chatSessionId') || null;
    
    // Initialize the chat when the page loads
    initChat();
    
    // Initialize chat functionality
    function initChat() {
        // Set up event listeners
        setupEventListeners();
        
        // Initialize chat session
        initChatSession();
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        // Auto-resize textarea as user types
        chatInput.addEventListener('input', handleChatInput);
        
        // Send message on button click or Enter key
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // File upload functionality
        if (chatUploadBtn && chatFileInput) {
            chatUploadBtn.addEventListener('click', () => chatFileInput.click());
            chatFileInput.addEventListener('change', handleFileUpload);
        }
        
        // New chat button
        newChatButton.addEventListener('click', startNewChat);
        
        // Demo items
        demoItems.forEach(item => {
            item.addEventListener('click', () => setActiveDemo(item));
        });
        
        // Sidebar is now always visible, no need for toggle functionality
        // Keeping reference to mobileMenuToggle but removing the event listener
    }
    
    // Handle chat input changes
    function handleChatInput() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Enable/disable send button based on input
        if (this.value.trim() === '') {
            this.style.height = '50px';
            sendButton.disabled = true;
        } else {
            sendButton.disabled = false;
        }
    }
    
    // Handle file uploads
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            // Clear the file input for potential re-upload
            chatFileInput.value = '';
            uploadFile(file);
        }
    }
    
    // Start a new chat session
    async function startNewChat() {
        // Clear chat messages except the first AI welcome message
        while (chatMessages.children.length > 1) {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        hideTypingIndicator();
        
        // Reset active demo items
        demoItems.forEach(item => item.classList.remove('active'));
        
        // Reset session ID and start a new session
        sessionId = null;
        localStorage.removeItem('chatSessionId');
        await initChatSession();
        
        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            chatSidebar.classList.remove('active');
        }
        
        // Focus on input
        chatInput.focus();
    }
    
    // Set active demo conversation
    function setActiveDemo(element) {
        // Remove active class from all items
        demoItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to clicked item
        element.classList.add('active');
        
        // Get demo title
        const demoTitle = element.querySelector('.demo-title')?.textContent || '';
        
        // Clear chat messages except the first AI welcome message
        while (chatMessages.children.length > 1) {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        // Add demo message based on demo type
        if (demoTitle.includes('Legal Research')) {
            addMessage("I'd like to research recent Supreme Court cases on privacy law.", 'user');
            showTypingIndicator();
            setTimeout(() => {
                hideTypingIndicator();
                addMessage(generateDemoResponse('research'), 'ai');
            }, 1500);
        } else if (demoTitle.includes('Contract Analysis')) {
            addMessage("Can you review this NDA for potential issues?", 'user');
            showTypingIndicator();
            setTimeout(() => {
                hideTypingIndicator();
                addMessage(generateDemoResponse('contract'), 'ai');
            }, 1500);
        } else if (demoTitle.includes('Document Generation')) {
            addMessage("I need to create a template for a service agreement.", 'user');
            showTypingIndicator();
            setTimeout(() => {
                hideTypingIndicator();
                addMessage(generateDemoResponse('document'), 'ai');
            }, 1500);
        }
        
        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            chatSidebar.classList.remove('active');
        }
        
        // Focus on input
        chatInput.focus();
    }
    
    // Initialize chat session
    async function initChatSession() {
        // If no session exists, start a new one
        if (!sessionId) {
            try {
                const response = await fetch('/api/chat/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success && data.sessionId) {
                    sessionId = data.sessionId;
                    localStorage.setItem('chatSessionId', sessionId);
                    console.log('New session created:', sessionId);
                    
                    // Initialize document services if available
                    if (window.documentServices && typeof window.documentServices.init === 'function') {
                        window.documentServices.init({
                            sessionId: sessionId,
                            addMessageToChat: addMessage,
                            showTypingIndicator: showTypingIndicator,
                            hideTypingIndicator: hideTypingIndicator
                        });
                    }
                    
                    // Add welcome message if chat is empty
                    if (chatMessages.children.length <= 1) {
                        addMessage(data.welcomeMessage || "Welcome to Legal Nomicon! I'm here to help with your legal questions.", 'ai');
                    }
                } else {
                    throw new Error('Failed to create chat session');
                }
            } catch (error) {
                console.error('Error creating chat session:', error);
                // Fallback to local session
                sessionId = 'local-' + Date.now();
                localStorage.setItem('chatSessionId', sessionId);
                
                // Add default welcome message if chat is empty
                if (chatMessages.children.length <= 1) {
                    addMessage("Welcome to Legal Nomicon! I'm here to help with your legal questions.", 'ai');
                }
            }
        }
    }
    
    // Send message function
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        chatInput.value = '';
        chatInput.style.height = '50px';
        sendButton.disabled = true;
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Check if this is a document generation request
            if (isDocumentGenerationRequest(message)) {
                handleDocumentGenerationRequest();
                return;
            }
            
            // Check if this is a document analysis request
            if (isDocumentAnalysisRequest(message)) {
                handleDocumentAnalysisRequest(message);
                return;
            }
            
            // Process regular chat message
            await processChatMessage(message);
            
        } catch (error) {
            console.error('Error sending message:', error);
            // Fallback to local response if API fails
            const fallbackResponse = generateFallbackResponse(message);
            addMessage(fallbackResponse, 'ai');
        } finally {
            hideTypingIndicator();
            scrollToBottom();
        }
    }
    
    // Process regular chat message
    async function processChatMessage(message) {
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                sessionId: sessionId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Add AI response to chat
            addMessage(data.response, 'ai');
            
            // Update session ID if a new one was provided
            if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('chatSessionId', sessionId);
            }
        } else {
            throw new Error(data.message || 'Failed to get response');
        }
    }
    
    // Upload file
    async function uploadFile(file) {
        console.log('Upload function called with file:', file.name, 'size:', file.size);
        
        if (!sessionId) {
            console.warn('No sessionId found. Upload aborted.');
            addMessage("You need to start a chat session before uploading files. Try sending a message first.", 'ai');
            return;
        }
        console.log('Using sessionId:', sessionId);
        
        // Check if this upload is for document analysis
        if (lastMessageWasDocumentAnalysisRequest) {
            lastMessageWasDocumentAnalysisRequest = false;
            return handleDocumentAnalysisUpload(file);
        }
        
        // Regular document upload for context
        const formData = new FormData();
        formData.append('document', file);
        formData.append('sessionId', sessionId);
        console.log('FormData created with document and sessionId');
        
        showTypingIndicator();
        
        try {
            console.log('Sending file upload request to /api/chat/upload-document');
            const response = await fetch('/api/chat/upload-document', {
                method: 'POST',
                body: formData
            });
            
            console.log('Received response:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response not OK:', response.status, response.statusText, 'Error text:', errorText);
                throw new Error(`Upload failed: ${response.statusText} (${response.status}) - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('Response JSON:', result);
            
            if (result.success) {
                console.log('Upload successful');
                addMessage(`I've received your file: ${file.name}. How can I help you with it?`, 'ai');
            } else {
                console.error('Upload result indicates failure:', result.message);
                throw new Error(result.message || 'Failed to process file');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            addMessage(`I couldn't process that file: ${error.message}. Please try again or upload a different file.`, 'ai');
        } finally {
            hideTypingIndicator();
        }
    }
    
    // Check if the message is a document analysis request
    function isDocumentAnalysisRequest(message) {
        message = message.toLowerCase();
        return message.includes("analyze document") || 
               message.includes("review document") ||
               message.includes("check document") ||
               message.includes("analyze this") && (message.includes("agreement") || message.includes("contract")) ||
               message.includes("review this") && (message.includes("agreement") || message.includes("contract"));
    }
    
    // Check if the message is a document generation request
    function isDocumentGenerationRequest(message) {
        message = message.toLowerCase();
        return message.includes("generate document") || 
               message.includes("create document") ||
               message.includes("draft") && (message.includes("agreement") || message.includes("contract") || message.includes("letter")) ||
               message.includes("prepare") && (message.includes("document") || message.includes("contract") || message.includes("agreement"));
    }
    
    // Handle document generation request
    function handleDocumentGenerationRequest() {
        // Try both possible implementations for backward compatibility
        if (window.documentGeneration && typeof window.documentGeneration.showDocumentTypeSelection === 'function') {
            window.documentGeneration.showDocumentTypeSelection();
            addMessage("I can help you generate a document. Please select from the template options below.", 'ai');
        } else if (window.documentServices && typeof window.documentServices.showTemplateSelection === 'function') {
            window.documentServices.showTemplateSelection();
            addMessage("I can help you generate a document. Please select a template type below.", 'ai');
        } else {
            // Fallback if neither document service is available
            addMessage("I'd be happy to help you generate a document. To proceed, please specify what type of document you need (e.g., NDA, Employment Contract, Legal Letter, etc.)", 'ai');
            
            // Use the demo response as a fallback
            const demoResponse = generateDemoResponse('document');
            addMessage(demoResponse, 'ai');
        }
    }
    
    // Handle document analysis request
    function handleDocumentAnalysisRequest(message) {
        lastMessageWasDocumentAnalysisRequest = true;
        addMessage("I'd be happy to analyze your document. Please upload the file you'd like me to review.", 'ai');
    }
    
    // Handle document analysis upload
    async function handleDocumentAnalysisUpload(file) {
        const analysisHtml = `<div class="document-analysis-container">
            <div class="analysis-status">Analyzing document: ${file.name}</div>
            <div class="analysis-progress"><div class="progress-bar"></div></div>
        </div>`;
        addMessage(analysisHtml, 'ai');
        
        showTypingIndicator();
        
        try {
            // Create form data for the analysis request
            const formData = new FormData();
            formData.append('document', file);
            if (sessionId) {
                formData.append('sessionId', sessionId);
            }
            
            // Call the document analysis API
            const response = await fetch('/api/analyze-document', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Analysis failed: ${response.statusText} (${response.status}) - ${errorText}`);
            }
            
            const result = await response.json();
            
            // Remove analysis progress indicator
            const analysisContainer = document.querySelector('.document-analysis-container');
            if (analysisContainer) {
                analysisContainer.remove();
            }
            
            hideTypingIndicator();
            
            if (result.success && result.analysis) {
                // Add formatted analysis results using the document services module
                if (window.documentServices && typeof window.documentServices.formatAnalysisResults === 'function') {
                    const analysisHtml = window.documentServices.formatAnalysisResults(result.analysis);
                    addMessage(analysisHtml, 'ai');
                } else {
                    // Fallback formatting if document services aren't loaded
                    let analysisText = `## Document Analysis: ${file.name}\n\n`;
                    analysisText += `**Document Type:** ${result.analysis.documentType || 'Unknown'}\n`;
                    analysisText += `**Page Count:** ${result.analysis.pageCount || 'N/A'}\n\n`;
                    
                    if (result.analysis.keyTopics && result.analysis.keyTopics.length) {
                        analysisText += '### Key Topics\n';
                        result.analysis.keyTopics.forEach(topic => {
                            analysisText += `- ${topic}\n`;
                        });
                        analysisText += '\n';
                    }
                    
                    if (result.analysis.keyFindings && result.analysis.keyFindings.length) {
                        analysisText += '### Key Findings\n';
                        result.analysis.keyFindings.forEach(finding => {
                            analysisText += `- ${finding}\n`;
                        });
                        analysisText += '\n';
                    }
                    
                    if (result.analysis.potentialIssues && result.analysis.potentialIssues.length) {
                        analysisText += '### Potential Issues\n';
                        result.analysis.potentialIssues.forEach(issue => {
                            analysisText += `- ${issue}\n`;
                        });
                        analysisText += '\n';
                    }
                    
                    if (result.analysis.recommendations && result.analysis.recommendations.length) {
                        analysisText += '### Recommendations\n';
                        result.analysis.recommendations.forEach(rec => {
                            analysisText += `- ${rec}\n`;
                        });
                    }
                    
                    addMessage(analysisText, 'ai');
                }
                
                // Add follow-up message
                addMessage('Would you like me to explain any specific part of this document in more detail?', 'ai');
            } else {
                throw new Error(result.message || 'Failed to analyze document');
            }
            
        } catch (error) {
            console.error('Error analyzing document:', error);
            hideTypingIndicator();
            addMessage("I couldn't analyze that document properly: " + error.message + ". Please try again with a different file format.", 'ai');
        }
    }
    
    // Add message to chat
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'ai' 
            ? '<i class="fas fa-robot"></i>' 
            : '<i class="fas fa-user"></i>';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                ${formatMessage(content)}
                <span class="message-time">${getCurrentTime()}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Format message content (simple markdown support)
    function formatMessage(message) {
        if (!message) return '';
        
        // Convert markdown bold
        let formatted = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert markdown italic
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert markdown links
        formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Convert line breaks to <br> tags
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Wrap in paragraphs if needed
        if (!formatted.startsWith('<') || !formatted.endsWith('>')) {
            formatted = `<p>${formatted}</p>`;
        }
        
        return formatted;
    }
    
    // Get current time in 12-hour format
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        
        return `${hours}:${minutes} ${ampm}`;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        typingIndicator.style.display = 'flex';
        scrollToBottom();
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
        typingIndicator.style.display = 'none';
    }
    
    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Generate fallback response when API is unavailable
    function generateFallbackResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        if (message.includes('contract') || message.includes('agreement')) {
            return "I can help with contract analysis. Would you like me to explain specific clauses or review a contract for potential issues?";
        } else if (message.includes('law') || message.includes('legal')) {
            return "I can provide general legal information across various practice areas including corporate law, intellectual property, employment law, and more. What specific area are you interested in?";
        } else if (message.includes('privacy') || message.includes('gdpr') || message.includes('ccpa')) {
            return "Privacy regulations like GDPR and CCPA have significant implications for businesses. I can help explain compliance requirements, data subject rights, and implementation strategies.";
        } else if (message.includes('intellectual property') || message.includes('ip') || message.includes('patent') || message.includes('trademark') || message.includes('copyright')) {
            return "Intellectual property protection is crucial for businesses. I can help with information about patents, trademarks, copyrights, and trade secrets.";
        } else if (message.includes('employment') || message.includes('worker') || message.includes('hire') || message.includes('fire')) {
            return "Employment law covers hiring practices, workplace policies, termination procedures, and employee rights. What specific aspect would you like to know more about?";
        } else {
            return `I understand you're asking about ${userMessage}. Could you provide more details about your legal question so I can give you more specific information?`;
        }
    }
    
    // Generate demo responses
    function generateDemoResponse(demoType) {
        switch(demoType) {
            case 'research':
                return `I've found several recent Supreme Court cases related to privacy law:
                
**1. Carpenter v. United States (2018)**
The Court held that the government needs a warrant to access cell phone location records, establishing that individuals have a reasonable expectation of privacy in their physical movements.

**2. Van Buren v. United States (2021)**
The Court narrowed the scope of the Computer Fraud and Abuse Act, limiting liability for those who have authorized access to computer systems.

**3. TransUnion LLC v. Ramirez (2021)**
The Court addressed standing requirements in privacy litigation, ruling that plaintiffs must demonstrate concrete harm to pursue claims in federal court.

Would you like me to analyze any of these cases in more detail or search for other privacy-related decisions?`;
                
            case 'contract':
                return `I've reviewed the NDA and identified several potential issues:
                
**1. Overbroad Definition of Confidential Information**
The current definition lacks specificity and could be interpreted to include publicly available information. Consider narrowing the scope.

**2. Missing Exclusions**
The agreement doesn't exclude information that becomes public through no fault of the receiving party or information independently developed.

**3. Unreasonable Duration**
The 10-year confidentiality period may be considered excessive and potentially unenforceable in some jurisdictions.

**4. Ambiguous Return/Destruction Clause**
The provisions for returning or destroying confidential information lack clear timelines and verification procedures.

Would you like me to suggest specific language to address these issues?`;
                
            case 'document':
                return `I can help you create a service agreement template. Here are the key sections I recommend including:
                
**1. Scope of Services**
Clearly define what services will be provided, deliverables, and any exclusions.

**2. Payment Terms**
Specify rates, payment schedule, invoicing procedures, and late payment penalties.

**3. Term and Termination**
Outline the agreement duration, renewal options, and termination conditions (with/without cause).

**4. Intellectual Property Rights**
Address ownership of work product and pre-existing IP.

**5. Confidentiality**
Include provisions for handling sensitive information.

**6. Limitation of Liability**
Set reasonable caps on potential damages.

Would you like me to generate a draft template with these sections?`;
                
            default:
                return "I'm not sure how to respond to that. Could you provide more details or try rephrasing your question?";
        }
    }
});
