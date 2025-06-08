document.addEventListener('DOMContentLoaded', function() {
    // Document Generation Integration
    window.documentGeneration = window.documentGeneration || {};
    
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
        
        // Mobile menu toggle
        mobileMenuToggle.addEventListener('click', () => {
            chatSidebar.classList.toggle('active');
        });
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
        if (!sessionId) {
            try {
                const response = await fetch('/api/chat/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    sessionId = data.sessionId;
                    localStorage.setItem('chatSessionId', sessionId);
                    
                    // Add welcome message if chat is empty
                    if (chatMessages.children.length <= 1) {
                        addMessage(data.welcomeMessage || "Welcome to Legal Nomicon! I'm here to help with your legal questions.", 'ai');
                    }
                } else {
                    throw new Error(data.message || 'Failed to start chat session');
                }
            } catch (error) {
                console.error('Error starting chat session:', error);
                // Fallback to local session ID if API is unavailable
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
    
    // Check if the message is a document generation request
    function isDocumentGenerationRequest(message) {
        const lowerMessage = message.toLowerCase();
        return (
            lowerMessage.includes('create document') || 
            lowerMessage.includes('generate document') ||
            (lowerMessage.includes('make a') && (
                lowerMessage.includes('agreement') || 
                lowerMessage.includes('contract') || 
                lowerMessage.includes('nda')
            ))
        );
    }
    
    // Handle document generation request
    function handleDocumentGenerationRequest() {
        hideTypingIndicator();
        if (window.documentGeneration && typeof window.documentGeneration.showDocumentTypeSelection === 'function') {
            window.documentGeneration.showDocumentTypeSelection();
        } else {
            addMessage("I'm having trouble with the document generation feature. Please try again later.", 'ai');
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
