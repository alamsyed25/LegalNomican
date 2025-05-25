document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.chat-send-btn');
    const chatMessages = document.querySelector('.chat-messages');
    const typingIndicator = document.querySelector('.typing-indicator');
    const newChatButton = document.querySelector('.new-chat-btn');
    const historyItems = document.querySelectorAll('.history-item');
    
    // Hide typing indicator initially
    typingIndicator.style.display = 'none';
    
    // Auto-resize textarea as user types
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Reset height if empty
        if (this.value === '') {
            this.style.height = '50px';
        }
    });
    
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter key (but allow Shift+Enter for new line)
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // New chat button functionality
    newChatButton.addEventListener('click', function() {
        // Clear chat messages except the first AI welcome message
        while (chatMessages.children.length > 1) {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        // Reset active conversation in sidebar
        historyItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add a new history item
        const newHistoryItem = document.createElement('li');
        newHistoryItem.className = 'history-item active';
        newHistoryItem.innerHTML = `
            <i class="fas fa-comment"></i>
            <div class="history-details">
                <span class="history-title">New Conversation</span>
                <span class="history-time">Just now</span>
            </div>
        `;
        
        // Add click event to the new history item
        newHistoryItem.addEventListener('click', function() {
            setActiveConversation(this);
        });
        
        // Add to the top of the list
        const historyList = document.querySelector('.conversation-history ul');
        historyList.insertBefore(newHistoryItem, historyList.firstChild);
        
        // Focus on input
        chatInput.focus();
    });
    
    // History item click functionality
    historyItems.forEach(item => {
        item.addEventListener('click', function() {
            setActiveConversation(this);
        });
    });
    
    // Set active conversation
    function setActiveConversation(element) {
        // Remove active class from all items
        historyItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        element.classList.add('active');
        
        // In a real app, this would load the selected conversation
        // For demo purposes, we'll just show a message
        
        // Focus on input
        chatInput.focus();
    }
    
    // Send message function
    function sendMessage() {
        const message = chatInput.value.trim();
        
        // Don't send empty messages
        if (message === '') return;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        chatInput.value = '';
        chatInput.style.height = '50px';
        
        // Show typing indicator
        typingIndicator.style.display = 'flex';
        
        // Scroll to bottom
        scrollToBottom();
        
        // Simulate AI response after a delay
        setTimeout(() => {
            // Hide typing indicator
            typingIndicator.style.display = 'none';
            
            // Generate AI response based on user message
            const aiResponse = generateAIResponse(message);
            
            // Add AI message to chat
            addMessage(aiResponse, 'ai');
            
            // Scroll to bottom
            scrollToBottom();
        }, 1500);
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
    
    // Format message with paragraphs and lists
    function formatMessage(message) {
        // For demo purposes, we'll just return the message as is
        // In a real app, you would parse markdown or HTML
        return `<p>${message}</p>`;
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
    
    // Generate AI response based on user input (mock function)
    function generateAIResponse(userMessage) {
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
    
    // Initial scroll to bottom
    scrollToBottom();
});
