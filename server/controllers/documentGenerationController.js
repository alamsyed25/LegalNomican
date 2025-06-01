/**
 * Document Generation Service
 * Handles creation of legal documents from templates
 */

/**
 * Generate document from template
 * @param {string} templateType - Type of document template
 * @param {Object} data - Data to populate template
 * @returns {Promise<Object>} - Generated document
 */
const generateDocument = async (templateType, data) => {
    try {
        const template = getTemplate(templateType);
        if (!template) {
            throw new Error(`Template not found: ${templateType}`);
        }

        const populatedContent = populateTemplate(template.content, data);
        
        return {
            title: template.title,
            content: populatedContent,
            templateType,
            generatedAt: new Date().toISOString(),
            wordCount: populatedContent.split(/\s+/).length
        };
    } catch (error) {
        console.error('Document generation error:', error);
        throw new Error('Failed to generate document');
    }
};

/**
 * Get available templates
 * @returns {Array} - Available templates
 */
const getAvailableTemplates = () => {
    return [
        {
            id: 'nda',
            title: 'Non-Disclosure Agreement',
            description: 'Standard confidentiality agreement for business relationships',
            fields: ['disclosingParty', 'receivingParty', 'effectiveDate', 'duration']
        },
        {
            id: 'service_agreement',
            title: 'Service Agreement',
            description: 'Professional services contract template',
            fields: ['serviceProvider', 'client', 'serviceDescription', 'paymentTerms', 'startDate']
        },
        {
            id: 'employment_contract',
            title: 'Employment Contract',
            description: 'Standard employment agreement template',
            fields: ['employer', 'employee', 'position', 'salary', 'startDate', 'benefits']
        }
    ];
};

/**
 * Get specific template by type
 * @param {string} templateType - Template type
 * @returns {Object|null} - Template object or null if not found
 */
const getTemplate = (templateType) => {
    const templates = {
        nda: {
            title: 'Non-Disclosure Agreement',
            content: `
# NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on {{effectiveDate}} between {{disclosingParty}} ("Disclosing Party") and {{receivingParty}} ("Receiving Party").

## 1. CONFIDENTIAL INFORMATION

For purposes of this Agreement, "Confidential Information" means any and all information disclosed by the Disclosing Party to the Receiving Party, whether orally, in writing, or in any other form, that is designated as confidential or that reasonably should be understood to be confidential.

## 2. OBLIGATIONS OF RECEIVING PARTY

The Receiving Party agrees to:
- Hold all Confidential Information in strict confidence
- Not disclose Confidential Information to any third parties
- Use Confidential Information solely for the purpose of evaluating potential business relationships
- Return or destroy all Confidential Information upon request

## 3. TERM

This Agreement shall remain in effect for {{duration}} from the date first written above, unless terminated earlier by mutual consent.

## 4. GOVERNING LAW

This Agreement shall be governed by the laws of [State/Country].

**DISCLOSING PARTY:**
{{disclosingParty}}

Signature: _________________________
Date: _____________________________

**RECEIVING PARTY:**
{{receivingParty}}

Signature: _________________________
Date: _____________________________
`
        },
        service_agreement: {
            title: 'Service Agreement',
            content: `
# SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on {{startDate}} between {{serviceProvider}} ("Service Provider") and {{client}} ("Client").

## 1. SERVICES

Service Provider agrees to provide the following services:
{{serviceDescription}}

## 2. PAYMENT TERMS

Client agrees to pay Service Provider according to the following terms:
{{paymentTerms}}

## 3. TERM AND TERMINATION

This Agreement shall commence on {{startDate}} and continue until completion of services or earlier termination as provided herein.

Either party may terminate this Agreement with thirty (30) days written notice.

## 4. INTELLECTUAL PROPERTY

All work product created by Service Provider in performance of this Agreement shall be owned by {{intellectualPropertyOwner}}.

## 5. CONFIDENTIALITY

Both parties agree to maintain confidentiality of all proprietary information shared during the course of this Agreement.

## 6. GOVERNING LAW

This Agreement shall be governed by the laws of [State/Country].

**SERVICE PROVIDER:**
{{serviceProvider}}

Signature: _________________________
Date: _____________________________

**CLIENT:**
{{client}}

Signature: _________________________
Date: _____________________________
`
        },
        employment_contract: {
            title: 'Employment Contract',
            content: `
# EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on {{startDate}} between {{employer}} ("Company") and {{employee}} ("Employee").

## 1. POSITION AND DUTIES

Employee is hired for the position of {{position}}. Employee agrees to perform all duties and responsibilities associated with this position.

## 2. COMPENSATION

Company agrees to pay Employee a salary of {{salary}} per year, payable in accordance with Company's standard payroll practices.

## 3. BENEFITS

Employee shall be entitled to participate in the following benefits:
{{benefits}}

## 4. TERM OF EMPLOYMENT

Employment shall commence on {{startDate}} and continue until terminated by either party in accordance with the terms of this Agreement.

## 5. CONFIDENTIALITY

Employee agrees to maintain strict confidentiality regarding all Company proprietary information and trade secrets.

## 6. GOVERNING LAW

This Agreement shall be governed by the laws of [State/Country].

**COMPANY:**
{{employer}}

Signature: _________________________
Date: _____________________________

**EMPLOYEE:**
{{employee}}

Signature: _________________________
Date: _____________________________
`
        }
    };

    return templates[templateType] || null;
};

/**
 * Populate template with provided data
 * @param {string} template - Template content
 * @param {Object} data - Data to populate
 * @returns {string} - Populated template
 */
const populateTemplate = (template, data) => {
    let populatedTemplate = template;
    
    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
        const placeholder = `{{${key}}}`;
        const regex = new RegExp(placeholder, 'g');
        populatedTemplate = populatedTemplate.replace(regex, data[key] || `[${key}]`);
    });
    
    // Handle any remaining placeholders
    populatedTemplate = populatedTemplate.replace(/\{\{(\w+)\}\}/g, '[$1]');
    
    return populatedTemplate;
};

/**
 * Validate template data
 * @param {string} templateType - Template type
 * @param {Object} data - Data to validate
 * @returns {Object} - Validation result
 */
const validateTemplateData = (templateType, data) => {
    const templates = getAvailableTemplates();
    const template = templates.find(t => t.id === templateType);
    
    if (!template) {
        return { isValid: false, errors: [`Unknown template type: ${templateType}`] };
    }
    
    const errors = [];
    const requiredFields = template.fields;
    
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    generateDocument,
    getAvailableTemplates,
    validateTemplateData
};