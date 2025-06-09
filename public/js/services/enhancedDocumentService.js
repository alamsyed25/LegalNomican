// frontend/src/services/enhancedDocumentService.js
class EnhancedDocumentService {
  constructor() {
    this.baseURL = window.location.origin + '/api'; // Will work with the current domain
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }


  // Template Management
  async getTemplates(params = {}) {
    const response = await this.api.get('/templates', { params });
    return response.data;
  }

  async getTemplate(id) {
    const response = await this.api.get(`/templates/${id}`);
    return response.data;
  }

  async createTemplate(templateData) {
    const response = await this.api.post('/templates', templateData);
    return response.data;
  }

  async updateTemplate(id, templateData) {
    const response = await this.api.put(`/templates/${id}`, templateData);
    return response.data;
  }

  async deleteTemplate(id) {
    const response = await this.api.delete(`/templates/${id}`);
    return response.data;
  }

  async generateDocument(templateId, variables, saveDocument = false) {
    const response = await this.api.post(`/templates/${templateId}/generate`, {
      variables,
      saveDocument
    });
    return response.data;
  }

  async cloneTemplate(id, customizations = {}) {
    const response = await this.api.post(`/templates/${id}/clone`, customizations);
    return response.data;
  }

  async getTemplateVersions(id) {
    const response = await this.api.get(`/templates/${id}/versions`);
    return response.data;
  }

  async searchTemplates(searchTerm, filters = {}) {
    const params = { q: searchTerm, ...filters };
    const response = await this.api.get('/templates/search', { params });
    return response.data;
  }

  async getCategories() {
    const response = await this.api.get('/templates/categories');
    return response.data;
  }

  async getPopularTags(limit = 20) {
    const response = await this.api.get('/templates/tags', { params: { limit } });
    return response.data;
  }

  // Document Comparison
  async compareDocuments(doc1, doc2, options = {}, saveResult = false) {
    const response = await this.api.post('/comparisons/documents', {
      doc1,
      doc2,
      options,
      saveResult
    });
    return response.data;
  }

  async compareVersions(documentId, version1, version2) {
    const response = await this.api.post('/comparisons/versions', {
      documentId,
      version1,
      version2
    });
    return response.data;
  }

  async getComparisonHistory(params = {}) {
    const response = await this.api.get('/comparisons/history', { params });
    return response.data;
  }

  async getComparison(id) {
    const response = await this.api.get(`/comparisons/${id}`);
    return response.data;
  }

  async exportComparison(id, format = 'json') {
    const response = await this.api.get(`/comparisons/${id}/export`, {
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob'
    });
    return response.data;
  }

  async generateHTMLDiff(id, options = {}) {
    const response = await this.api.post(`/comparisons/${id}/html`, options);
    return response.data;
  }

  async deleteComparison(id) {
    const response = await this.api.delete(`/comparisons/${id}`);
    return response.data;
  }

  async batchCompare(comparisons, options = {}) {
    const response = await this.api.post('/comparisons/batch', {
      comparisons,
      options
    });
    return response.data;
  }

  // Document Versions
  async getDocumentVersions(documentId) {
    const response = await this.api.get(`/comparisons/documents/${documentId}/versions`);
    return response.data;
  }

  async createDocumentVersion(documentId, changeLog = '') {
    const response = await this.api.post(`/comparisons/documents/${documentId}/versions`, {
      changeLog
    });
    return response.data;
  }

  async getDocumentVersion(documentId, version) {
    const response = await this.api.get(`/comparisons/documents/${documentId}/versions/${version}`);
    return response.data;
  }

  async compareWithLatest(documentId, content, title = 'Current Version') {
    const response = await this.api.post(`/comparisons/documents/${documentId}/compare-with-latest`, {
      content,
      title
    });
    return response.data;
  }

  // Statistics
  async getComparisonStats(period = '30d') {
    const response = await this.api.get('/comparisons/stats', { params: { period } });
    return response.data;
  }
}

// Export the service
const enhancedDocumentService = new EnhancedDocumentService();
export { enhancedDocumentService };

// For backward compatibility
export const documentServices = {
  enhanced: enhancedDocumentService,
  
  // Legacy methods for backward compatibility
  async analyzeDocument(file, sessionId) {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    return this.enhanced.api.post('/documents/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  async generateDocument(templateType, variables, sessionId) {
    // Try enhanced service first, fall back to legacy
    try {
      const templates = await this.enhanced.getTemplates({ category: templateType });
      if (templates && templates.data && templates.data.templates && templates.data.templates.length > 0) {
        const template = templates.data.templates[0];
        return await this.enhanced.generateDocument(template._id, variables, true);
      }
    } catch (error) {
      console.warn('Enhanced generation failed, using legacy:', error);
    }
    
    // Fall back to legacy implementation
    return this.enhanced.api.post('/documents/generate', {
      templateType,
      variables,
      sessionId
    });
  },

  // New enhanced methods
  async detectDocumentIntent(message) {
    const analysisKeywords = [
      'analyze', 'review', 'examine', 'check', 'audit', 'assess'
    ];
    
    const generationKeywords = [
      'create', 'generate', 'draft', 'write', 'prepare', 'make'
    ];
    
    const comparisonKeywords = [
      'compare', 'diff', 'difference', 'contrast', 'version', 'changes'
    ];

    const lowerMessage = message.toLowerCase();
    
    if (comparisonKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'comparison';
    }
    
    if (analysisKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'analysis';
    }
    
    if (generationKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'generation';
    }
    
    return null;
  },

  async handleEnhancedDocumentWorkflow(intent, message, sessionId) {
    switch (intent) {
      case 'comparison':
        return {
          type: 'comparison_prompt',
          message: 'I can help you compare documents. Please upload two documents or paste their content to see the differences.',
          action: 'show_comparison_interface'
        };
        
      case 'analysis':
        return {
          type: 'analysis_prompt',
          message: 'I can analyze documents for legal compliance, risks, and recommendations. Please upload a document to get started.',
          action: 'show_upload_interface'
        };
        
      case 'generation':
        const templates = await this.enhanced.getTemplates({ limit: 5 });
        return {
          type: 'generation_options',
          message: 'I can help you create legal documents. Here are some popular templates:',
          templates: templates.data.templates,
          action: 'show_template_selection'
        };
        
      default:
        return null;
    }
  }
};

export default documentServices;
