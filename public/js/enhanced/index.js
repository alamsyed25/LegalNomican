// Export all enhanced components and services
export { default as TemplateBuilder } from '../components/enhanced/TemplateBuilder';
export { default as DocumentComparison } from '../components/enhanced/DocumentComparison';
export { enhancedDocumentService, documentServices } from '../services/enhancedDocumentService';

// Re-export for backward compatibility
export const enhancedServices = {
  document: {
    ...documentServices,
    enhanced: enhancedDocumentService
  }
};

// Default export for easier imports
const enhancedExports = {
  TemplateBuilder,
  DocumentComparison,
  enhancedDocumentService,
  documentServices,
  enhancedServices
};

export default enhancedExports;
