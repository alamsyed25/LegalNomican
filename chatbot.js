document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.chat-send-btn');
    const chatUploadBtn = document.getElementById('chat-upload-btn'); // New upload button
    const chatFileInput = document.getElementById('chat-file-input'); // New file input
    const chatMessages = document.querySelector('.chat-messages');
    const typingIndicator = document.querySelector('.typing-indicator');
    const newChatButton = document.querySelector('.new-chat-btn');
    const demoItems = document.querySelectorAll('.demo-item');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const chatSidebar = document.querySelector('.chat-sidebar');
    
    // Hide typing indicator initially
    typingIndicator.style.display = 'none';
    
    // Auto-resize textarea as user types and enable/disable send button
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Reset height if empty
        if (this.value === '') {
            this.style.height = '50px';
            sendButton.disabled = true;
        } else {
            sendButton.disabled = false;
        }
    });
    
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Event listener for the new upload button
    if (chatUploadBtn && chatFileInput) {
        chatUploadBtn.addEventListener('click', () => {
            chatFileInput.click(); // Trigger click on hidden file input
        });

        // Event listener for file selection
        chatFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                console.log('File selected:', file.name);
                uploadFile(file);
                // Clear the file input so the same file can be re-uploaded if needed
                chatFileInput.value = ''; 
            } else {
                console.log('No file selected');
            }
        });
    }

    // Send message on Enter key (but allow Shift+Enter for new line)
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // New chat button functionality
    newChatButton.addEventListener('click', async function() {
        // Clear chat messages
        while (chatMessages.children.length > 1) {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        // Reset active demo items
        demoItems.forEach(item => {
            item.classList.remove('active');
        });
        
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
    });
    
    // Demo item click functionality
    demoItems.forEach(item => {
        item.addEventListener('click', function() {
            setActiveDemo(this);
        });
    });
    
    // Mobile menu toggle functionality
    mobileMenuToggle.addEventListener('click', function() {
        chatSidebar.classList.toggle('active');
    });
    
    // Set active demo conversation
    function setActiveDemo(element) {
        // Remove active class from all items
        demoItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        element.classList.add('active');
        
        // In a real app, this would load the selected demo conversation
        // For demo purposes, we'll just show a message based on the demo type
        const demoTitle = element.querySelector('.demo-title').textContent;
        
        // Clear chat messages except the first AI welcome message
        while (chatMessages.children.length > 1) {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        // Add a demo message based on which demo was selected
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
    
    // Chat session management
    let sessionId = localStorage.getItem('chatSessionId') || null;
    
    // Initialize chat session if needed
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
                        addMessage(data.welcomeMessage, 'ai');
                    }
                } else {
                    console.error('Failed to start chat session:', data.message || 'Unknown error');
                    // Fallback to local session ID if API fails
                    sessionId = 'local-' + Date.now();
                    localStorage.setItem('chatSessionId', sessionId);
                    addMessage("Welcome to Legal Nomicon! I'm here to help with your legal questions.", 'ai');
                }
            } catch (error) {
                console.error('Error starting chat session:', error);
                // Fallback to local session ID if API is unavailable
                sessionId = 'local-' + Date.now();
                localStorage.setItem('chatSessionId', sessionId);
                addMessage("Welcome to Legal Nomicon! I'm here to help with your legal questions.", 'ai');
            }
        }
    }
    
    // Initialize chat session on page load
    initChatSession();
    
    // Send message function
    async function sendMessage() {
        const message = chatInput.value.trim();
        
        // Don't send empty messages
        if (message === '') return;
        
        // Ensure we have a session
        if (!sessionId) {
            await initChatSession();
        }
        
        // Disable send button while processing
        sendButton.disabled = true;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        chatInput.value = '';
        chatInput.style.height = '50px';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Scroll to bottom
        scrollToBottom();
        
        try {
            // Send message to API
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId,
                    message
                })
            });
            
            const data = await response.json();
            
            // Hide typing indicator
            hideTypingIndicator();
            
            if (data.success) {
                // Add AI response to chat
                addMessage(data.response, 'ai');
            } else {
                // Show error message
                addMessage('Sorry, I encountered an error processing your request. Please try again.', 'ai');
                console.error('API error:', data.message);
            }
        } catch (error) {
            // Hide typing indicator
            hideTypingIndicator();
            
            // Show error message
            addMessage('Sorry, I encountered a connection error. Please check your internet connection and try again.', 'ai');
            console.error('Fetch error:', error);
        } finally {
            // Re-enable send button
            sendButton.disabled = false;
            
            // Scroll to bottom again after AI response
            scrollToBottom();
        }
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
    
    // Add message to chat
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const currentTime = getCurrentTime();
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${formatMessage(content)}</p>
                    <span class="message-time">${currentTime}</span>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    ${formatMessage(content)}
                    <span class="message-time">${currentTime}</span>
                </div>
            `;
        }
        
        // Insert before typing indicator
        chatMessages.insertBefore(messageDiv, typingIndicator);
    }
    
    // Format message with markdown-like syntax support
    function formatMessage(message) {
        if (!message) return '<p>No message content</p>';
        
        // Handle markdown-like formatting
        let formattedMessage = message;
        
        // Convert markdown headings and bold text
        formattedMessage = formattedMessage.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Convert bullet points
        formattedMessage = formattedMessage.replace(/^- (.+)$/gm, '<li>$1</li>');
        formattedMessage = formattedMessage.replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // Convert paragraphs (split by double newline)
        const paragraphs = formattedMessage.split(/\n\n/);
        formattedMessage = paragraphs.map(p => {
            // Skip wrapping if it's already a list or other HTML element
            if (p.trim().startsWith('<ul>') || p.trim().startsWith('<ol>') || 
                p.trim().startsWith('<p>') || p.trim().startsWith('<h')) {
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');
        
        return formattedMessage;
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
    
    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // This function is no longer needed as we're using the API
    // Keeping it for demo mode fallback if the API is unavailable
    function generateFallbackResponse(userMessage) {
        // Convert to lowercase for easier matching
        const message = userMessage.toLowerCase();
        
        // Simple keyword matching for demo purposes
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
            return "I understand you're asking about " + userMessage + ". Could you provide more details about your legal question so I can give you more specific information?";
        }
    }
    
    // Generate responses for demo conversations
    function generateDemoResponse(demoType) {
        switch(demoType) {
            case 'research':
                return `<p>I've found several recent Supreme Court cases related to privacy law:</p>
                <p><strong>1. Carpenter v. United States (2018)</strong><br>
The Court held that the government needs a warrant to access cell phone location records, establishing that individuals have a reasonable expectation of privacy in their physical movements.</p>
                <p><strong>2. Van Buren v. United States (2021)</strong><br>
The Court narrowed the scope of the Computer Fraud and Abuse Act, limiting liability for those who have authorized access to computer systems.</p>
                <p><strong>3. TransUnion LLC v. Ramirez (2021)</strong><br>
The Court addressed standing requirements in privacy litigation, ruling that plaintiffs must demonstrate concrete harm to pursue claims in federal court.</p>
                <p>Would you like me to analyze any of these cases in more detail or search for other privacy-related decisions?</p>`;
                
            case 'contract':
                return `<p>I've reviewed the NDA and identified several potential issues:</p>
                <p><strong>1. Overbroad Definition of Confidential Information</strong><br>
The current definition lacks specificity and could be interpreted to include publicly available information. Consider narrowing the scope.</p>
                <p><strong>2. Missing Exclusions</strong><br>
The agreement doesn't exclude information that becomes public through no fault of the receiving party or information independently developed.</p>
                <p><strong>3. Unreasonable Duration</strong><br>
The 10-year confidentiality period may be considered excessive and potentially unenforceable in some jurisdictions.</p>
                <p><strong>4. Ambiguous Return/Destruction Clause</strong><br>
The provisions for returning or destroying confidential information lack clear timelines and verification procedures.</p>
                <p>Would you like me to suggest specific language to address these issues?</p>`;
                
            case 'document':
                return `<p>I can help you create a service agreement template. Here are the key sections I recommend including:</p>
                <p><strong>1. Scope of Services</strong><br>
Clearly define what services will be provided, deliverables, and any exclusions.</p>
                <p><strong>2. Payment Terms</strong><br>
Specify rates, payment schedule, invoicing procedures, and late payment penalties.</p>
                <p><strong>3. Term and Termination</strong><br>
Outline the agreement duration, renewal options, and termination conditions (with/without cause).</p>
                <p><strong>4. Intellectual Property Rights</strong><br>
Address ownership of work product and pre-existing IP.</p>
                <p><strong>5. Confidentiality</strong><br>
Include provisions for handling sensitive information.</p>
                <p><strong>6. Limitation of Liability</strong><br>
Set reasonable caps on potential damages.</p>
                <p>Would you like me to generate a draft template with these sections?</p>`;
                
            default:
                return "I'm not sure what type of information you're looking for. Could you provide more details about your legal question?";
        }
    }
    
    // Initial scroll to bottom
    scrollToBottom();

    // Function to handle file upload
    async function uploadFile(file) {
        addMessage(`Uploading "${file.name}"...`, 'system');
        chatUploadBtn.disabled = true;
        sendButton.disabled = true; // Also disable send button during upload

        const formData = new FormData();
        formData.append('document', file); // 'document' is the field name server will expect
        if (sessionId) {
            formData.append('sessionId', sessionId);
        }

        try {
            const response = await fetch('/api/chat/upload-document', {
                method: 'POST',
                body: formData,
                // Headers are not explicitly set for 'Content-Type' with FormData;
                // the browser sets it to 'multipart/form-data' automatically with the correct boundary.
            });

            const result = await response.json();

            if (response.ok) {
                addMessage(`Successfully uploaded and processed "${file.name}". ${result.message || 'You can now ask questions about it.'}`, 'system');
                // Optionally, store document context or ID received from backend if needed for ai-service.js
                // e.g., currentDocumentContext = result.documentContext;
            } else {
                addMessage(`Error uploading "${file.name}": ${result.error || 'Unknown server error'}`, 'system');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            addMessage(`Failed to upload "${file.name}". Network error or server unavailable.`, 'system');
        } finally {
            chatUploadBtn.disabled = false;
            // Re-enable send button only if chatInput has text
            sendButton.disabled = chatInput.value.trim() === ''; 
        }
    }
});
