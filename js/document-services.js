/**
 * Document Services Module for Legal Nomican
 * Consolidates document analysis and generation functionality
 */

const documentServices = (function() {
    
    // Private variables
    let _analysisInProgress = false;
    let _generationInProgress = false;
    
    /**
     * Analyze an uploaded document
     * @param {File} file - The document file to analyze
     * @returns {Promise} - Promise that resolves with analysis results
     */
    function analyzeDocument(file) {
        _analysisInProgress = true;
        
        return new Promise((resolve, reject) => {
            // Create form data for file upload
            const formData = new FormData();
            formData.append('document', file);
            
            // Show analysis progress animation
            const progressAnimation = startProgressAnimation();
            
            // Send file to backend for analysis
            fetch('/api/analyze-document', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Document analysis failed');
                }
                return response.json();
            })
            .then(data => {
                clearInterval(progressAnimation);
                _analysisInProgress = false;
                resolve(data);
            })
            .catch(error => {
                clearInterval(progressAnimation);
                _analysisInProgress = false;
                console.error('Error analyzing document:', error);
                reject(error);
            });
        });
    }
    
    /**
     * Format document analysis results for display
     * @param {Object} analysis - Analysis results from the backend
     * @returns {String} - Formatted HTML for displaying in chat
     */
    function formatAnalysisResults(analysis) {
        if (!analysis || !analysis.results) {
            return '<p>Sorry, I couldn\'t analyze this document properly.</p>';
        }
        
        let html = '<div class="document-analysis-results">';
        
        // Document overview
        html += `
            <div class="analysis-section">
                <h3>Document Overview</h3>
                <ul>
                    <li><strong>Type:</strong> ${analysis.documentType || 'Unknown'}</li>
                    <li><strong>Length:</strong> ${analysis.pageCount || 'N/A'} pages</li>
                    <li><strong>Key Topics:</strong> ${analysis.keyTopics?.join(', ') || 'None identified'}</li>
                </ul>
            </div>
        `;
        
        // Key findings
        if (analysis.keyFindings?.length) {
            html += `
                <div class="analysis-section">
                    <h3>Key Findings</h3>
                    <ul>
                        ${analysis.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Potential issues
        if (analysis.potentialIssues?.length) {
            html += `
                <div class="analysis-section analysis-issues">
                    <h3>Potential Issues</h3>
                    <ul>
                        ${analysis.potentialIssues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Recommendations
        if (analysis.recommendations?.length) {
            html += `
                <div class="analysis-section">
                    <h3>Recommendations</h3>
                    <ul>
                        ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    /**
     * Generate a document from a template
     * @param {String} templateId - ID of the template to use
     * @param {Object} formData - Data to populate the template with
     * @returns {Promise} - Promise that resolves with generated document
     */
    function generateDocument(templateId, formData) {
        _generationInProgress = true;
        
        return new Promise((resolve, reject) => {
            fetch('/api/generate-document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    templateId,
                    formData
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Document generation failed');
                }
                return response.json();
            })
            .then(data => {
                _generationInProgress = false;
                resolve(data);
            })
            .catch(error => {
                _generationInProgress = false;
                console.error('Error generating document:', error);
                reject(error);
            });
        });
    }
    
    /**
     * Show available document templates for selection
     * @returns {String} - HTML for template selection UI
     */
    function getTemplateSelectionUI() {
        // Mock templates - in production would come from backend
        const templates = [
            { id: 'nda', title: 'Non-Disclosure Agreement', description: 'Confidentiality agreement to protect sensitive information' },
            { id: 'service-agreement', title: 'Service Agreement', description: 'Contract for provision of professional services' },
            { id: 'employment', title: 'Employment Contract', description: 'Agreement between employer and employee' },
            { id: 'privacy-policy', title: 'Privacy Policy', description: 'Document describing how user data is collected and used' }
        ];
        
        let html = `
            <div class="document-template-selection">
                <p>I can help you generate the following documents. Which one would you like to create?</p>
                <div class="template-buttons">
        `;
        
        templates.forEach(template => {
            html += `
                <button class="document-template-btn" data-template-id="${template.id}">
                    <strong>${template.title}</strong>
                    <span>${template.description}</span>
                </button>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Get the form fields for a specific template
     * @param {String} templateId - Template ID
     * @returns {Array} - Array of form field objects
     */
    function getTemplateFields(templateId) {
        // Mock template fields - in production would come from backend
        const templateFields = {
            'nda': [
                { name: 'disclosingParty', label: 'Disclosing Party Name', type: 'text', required: true },
                { name: 'receivingParty', label: 'Receiving Party Name', type: 'text', required: true },
                { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
                { name: 'duration', label: 'Duration (years)', type: 'number', min: 1, max: 10, required: true },
                { name: 'jurisdiction', label: 'Governing Law', type: 'text', required: true }
            ],
            'service-agreement': [
                { name: 'serviceProvider', label: 'Service Provider Name', type: 'text', required: true },
                { name: 'client', label: 'Client Name', type: 'text', required: true },
                { name: 'serviceDescription', label: 'Service Description', type: 'textarea', required: true },
                { name: 'paymentTerms', label: 'Payment Terms', type: 'textarea', required: true },
                { name: 'startDate', label: 'Start Date', type: 'date', required: true },
                { name: 'endDate', label: 'End Date', type: 'date', required: false }
            ]
            // Additional templates would be defined here
        };
        
        return templateFields[templateId] || [];
    }
    
    /**
     * Generate form UI for template fields
     * @param {String} templateId - Template ID
     * @returns {String} - HTML for form UI
     */
    function getTemplateFormUI(templateId) {
        const fields = getTemplateFields(templateId);
        if (!fields.length) {
            return '<p>Template not found or no fields available.</p>';
        }
        
        let html = `
            <div class="document-form-container">
                <h3>${templateId === 'nda' ? 'Non-Disclosure Agreement' : 
                      templateId === 'service-agreement' ? 'Service Agreement' : 
                      'Document'} Form</h3>
                <form id="documentGenerationForm" data-template-id="${templateId}">
        `;
        
        fields.forEach(field => {
            html += `
                <div class="form-group">
                    <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
            `;
            
            if (field.type === 'textarea') {
                html += `
                    <textarea id="${field.name}" name="${field.name}" rows="4" ${field.required ? 'required' : ''}></textarea>
                `;
            } else {
                html += `
                    <input type="${field.type}" id="${field.name}" name="${field.name}" 
                        ${field.min !== undefined ? `min="${field.min}"` : ''} 
                        ${field.max !== undefined ? `max="${field.max}"` : ''} 
                        ${field.required ? 'required' : ''}>
                `;
            }
            
            html += `</div>`;
        });
        
        html += `
                <button type="submit" class="btn primary">Generate Document</button>
                <button type="button" class="btn secondary cancel-btn">Cancel</button>
                </form>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Format document preview for display in chat
     * @param {Object} document - Document data from backend
     * @returns {String} - HTML for document preview
     */
    function formatDocumentPreview(document) {
        if (!document || !document.content) {
            return '<p>Sorry, I couldn\'t generate the document.</p>';
        }
        
        let html = `
            <div class="document-preview">
                <div class="document-preview-header">
                    <h3>${document.title || 'Generated Document'}</h3>
                    <button class="document-download-btn" data-document-id="${document.id}">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
                <div class="document-preview-content">
                    ${formatDocumentContent(document.content)}
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Format document content for display
     * @param {String} content - Raw document content
     * @returns {String} - Formatted HTML
     */
    function formatDocumentContent(content) {
        // Replace newlines with <br> tags
        return content.replace(/\n/g, '<br>');
    }
    
    /**
     * Start progress animation for document analysis
     * @returns {Number} - Interval ID for stopping the animation
     */
    function startProgressAnimation() {
        let progress = 0;
        const progressBar = document.querySelector('.progress-bar');
        
        if (!progressBar) return null;
        
        return setInterval(() => {
            if (progress >= 100) {
                progress = 0;
            } else {
                progress += 5;
            }
            progressBar.style.width = `${progress}%`;
        }, 200);
    }
    
    /**
     * Check if document analysis is in progress
     * @returns {Boolean} - True if analysis is in progress
     */
    function isAnalysisInProgress() {
        return _analysisInProgress;
    }
    
    /**
     * Check if document generation is in progress
     * @returns {Boolean} - True if generation is in progress
     */
    function isGenerationInProgress() {
        return _generationInProgress;
    }
    
    // Expose public methods
    return {
        analyzeDocument,
        formatAnalysisResults,
        generateDocument,
        getTemplateSelectionUI,
        getTemplateFormUI,
        formatDocumentPreview,
        isAnalysisInProgress,
        isGenerationInProgress
    };
    
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.documentServices = documentServices;
}
