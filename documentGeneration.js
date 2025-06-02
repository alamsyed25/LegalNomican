// Document Generation Module for Legal Nomicon
// Handles all document generation UI and logic

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatMessages = document.querySelector('.chat-messages');
    const chatInput = document.querySelector('.chat-input');
    
    // Initialize document generation module
    initDocumentGeneration();
    
    // Expose functions to window for global access
    window.documentGeneration = {
        startDocumentCreation,
        handleDocumentResponse,
        showDocumentPreview,
        downloadDocument
    };
    
    function initDocumentGeneration() {
        // Listen for document generation intents in chat
        document.addEventListener('chatMessage', function(e) {
            const message = e.detail.message.toLowerCase();
            
            // Check if user wants to create a document
            if (message.includes('create document') || 
                message.includes('generate document') ||
                message.includes('make a') && (message.includes('agreement') || message.includes('contract') || message.includes('nda'))) {
                // Show document type selection
                showDocumentTypeSelection();
            }
        });
    }
    
    // Show document type selection
    function showDocumentTypeSelection() {
        fetch('/documents/templates')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const templates = data.data;
                    let buttonsHTML = templates.map(template => 
                        `<button class="document-type-btn" data-template-id="${template.id}">
                            <strong>${template.title}</strong>
                            <span>${template.description}</span>
                        </button>`
                    ).join('');
                    
                    const messageHTML = `
                        <div class="document-type-selection">
                            <p>I can help you generate the following documents. Which one would you like to create?</p>
                            <div class="document-type-buttons">
                                ${buttonsHTML}
                            </div>
                        </div>
                    `;
                    
                    // Add message to chat
                    addMessage(messageHTML, 'ai');
                    
                    // Add event listeners to buttons
                    document.querySelectorAll('.document-type-btn').forEach(button => {
                        button.addEventListener('click', function() {
                            const templateId = this.getAttribute('data-template-id');
                            startDocumentCreation(templateId);
                        });
                    });
                } else {
                    addMessage("I'm having trouble loading document templates. Please try again later.", 'ai');
                }
            })
            .catch(error => {
                console.error('Error fetching document templates:', error);
                addMessage("I'm having trouble loading document templates. Please try again later.", 'ai');
            });
    }
    
    // Start document creation process
    function startDocumentCreation(templateId) {
        // Show typing indicator
        const typingIndicator = document.querySelector('.typing-indicator');
        typingIndicator.style.display = 'flex';
        
        // Get template details
        fetch(`/documents/preview/${templateId}`)
            .then(response => response.json())
            .then(data => {
                typingIndicator.style.display = 'none';
                
                if (data.success) {
                    const template = data.data;
                    const fields = template.fields; // Use fields from the API response
                    
                    // Create form for document fields
                    let formHTML = `
                        <div class="document-form">
                            <p>Let's create a <strong>${template.title}</strong>. Please provide the following details:</p>
                            <form id="document-form">
                                ${fields.map(field => `
                                    <div class="form-group">
                                        <label for="${field.id}">${field.label}</label>
                                        ${field.type === 'textarea' ? 
                                        `<textarea id="${field.id}" name="${field.id}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}></textarea>` :
                                        `<input type="${field.type || 'text'}" id="${field.id}" name="${field.id}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>`
                                    }
                                    </div>
                                `).join('')}
                                <div class="form-actions">
                                    <button type="button" class="btn secondary" id="cancel-document">Cancel</button>
                                    <button type="submit" class="btn primary">Generate Document</button>
                                </div>
                            </form>
                        </div>
                    `;
                    
                    // Add form to chat
                    addMessage(formHTML, 'ai');
                    
                    // Add event listeners
                    const form = document.getElementById('document-form');
                    if (form) {
                        form.addEventListener('submit', function(e) {
                            e.preventDefault();
                            generateDocument(templateId, this);
                        });
                    }
                    
                    const cancelBtn = document.getElementById('cancel-document');
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', function() {
                            addMessage("Document creation cancelled. How else can I assist you?", 'ai');
                            // Remove the form
                            const formElement = document.querySelector('.document-form');
                            if (formElement) formElement.remove();
                        });
                    }
                } else {
                    addMessage("I'm having trouble loading the document template. Please try again later.", 'ai');
                }
            })
            .catch(error => {
                typingIndicator.style.display = 'none';
                console.error('Error fetching template:', error);
                addMessage("I'm having trouble loading the document template. Please try again later.", 'ai');
            });
    }
    
    // Generate document with user input
    function generateDocument(templateId, form) {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // Send request to generate document
        fetch('/documents/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                templateType: templateId,
                data: data
            })
        })
        .then(response => response.json())
        .then(data => {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
            if (data.success) {
                // Show document preview
                showDocumentPreview(data.data);
            } else {
                addMessage("I couldn't generate the document. Please try again.", 'ai');
            }
        })
        .catch(error => {
            console.error('Error generating document:', error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            addMessage("Something went wrong while generating your document. Please try again.", 'ai');
        });
    }
    
    // Show document preview
    function showDocumentPreview(documentData) {
        // Create preview HTML
        const previewHTML = `
            <div class="document-preview">
                <div class="document-preview-header">
                    <h3>${documentData.title}</h3>
                    <div class="document-actions">
                        <button class="btn secondary" id="edit-document">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn primary" id="download-document">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
                <div class="document-content">
                    ${formatDocumentContent(documentData.content)}
                </div>
                <div class="document-actions-bottom">
                    <button class="btn secondary" id="new-document">
                        <i class="fas fa-file-alt"></i> Create Another
                    </button>
                    <button class="btn primary" id="save-document">
                        <i class="fas fa-save"></i> Save to Account
                    </button>
                </div>
            </div>
        `;
        
        // Add preview to chat
        addMessage(previewHTML, 'ai');
        
        // Add event listeners
        document.getElementById('download-document')?.addEventListener('click', () => {
            downloadDocument(documentData);
        });
        
        document.getElementById('new-document')?.addEventListener('click', () => {
            showDocumentTypeSelection();
        });
        
        // TODO: Implement edit and save functionality
        document.getElementById('edit-document')?.addEventListener('click', () => {
            // For now, just show a message
            addMessage("Edit functionality will be available in the next update.", 'ai');
        });
        
        document.getElementById('save-document')?.addEventListener('click', () => {
            // For now, just show a message
            addMessage("Document saving will be available after you sign in.", 'ai');
        });
    }
    
    // Download document
    function downloadDocument(documentData) {
        // Create a Blob with the document content
        const blob = new Blob([documentData.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
    
    // Helper function to format document content for display
    function formatDocumentContent(content) {
        // Convert markdown to HTML (simplified version)
        let html = content
            .replace(/\n\n/g, '</p><p>')  // Double newline to paragraph
            .replace(/\n/g, '<br>')        // Single newline to line break
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>');  // Italic
            
        return `<p>${html}</p>`;
    }
    
    // Helper function to get template fields
    /* // This function is no longer needed as fields are fetched from the backend
function getTemplateFields(templateId) {
        // This would normally come from the backend, but we'll define them here for now
        const fieldTemplates = {
            'nda': [
                { id: 'disclosingParty', label: 'Disclosing Party', type: 'text', placeholder: 'Company or person disclosing information', required: true },
                { id: 'receivingParty', label: 'Receiving Party', type: 'text', placeholder: 'Company or person receiving information', required: true },
                { id: 'effectiveDate', label: 'Effective Date', type: 'date', placeholder: 'Date the agreement takes effect', required: true },
                { id: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., 2 years, 5 years, etc.', required: true },
                { id: 'governingLaw', label: 'Governing Law', type: 'text', placeholder: 'e.g., State of California', required: true }
            ],
            'service_agreement': [
                { id: 'serviceProvider', label: 'Service Provider', type: 'text', placeholder: 'Name of the service provider', required: true },
                { id: 'client', label: 'Client', type: 'text', placeholder: 'Name of the client', required: true },
                { id: 'serviceDescription', label: 'Service Description', type: 'textarea', placeholder: 'Detailed description of services to be provided', required: true },
                { id: 'paymentTerms', label: 'Payment Terms', type: 'text', placeholder: 'e.g., $X upon signing, balance due in 30 days', required: true },
                { id: 'startDate', label: 'Start Date', type: 'date', placeholder: 'Date services will begin', required: true },
                { id: 'intellectualPropertyOwner', label: 'Intellectual Property Owner', type: 'text', placeholder: 'Who will own the IP?', required: true }
            ],
            'employment_contract': [
                { id: 'employer', label: 'Employer', type: 'text', placeholder: 'Company name', required: true },
                { id: 'employee', label: 'Employee', type: 'text', placeholder: 'Employee full name', required: true },
                { id: 'position', label: 'Position', type: 'text', placeholder: 'Job title/position', required: true },
                { id: 'salary', label: 'Salary', type: 'text', placeholder: 'e.g., $75,000 per year', required: true },
                { id: 'startDate', label: 'Start Date', type: 'date', placeholder: 'Employment start date', required: true },
                { id: 'benefits', label: 'Benefits', type: 'textarea', placeholder: 'List of benefits (health insurance, 401k, etc.)', required: true }
            ]
        };
        
        return fieldTemplates[templateId] || [];
    }
*/
    
    // Helper function to add message to chat
    function addMessage(html, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${sender === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>'}
            </div>
            <div class="message-content">
                ${html}
                <span class="message-time">${getCurrentTime()}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Helper function to get current time
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${hours}:${minutes} ${ampm}`;
    }
    
    // Helper function to scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
