// server/services/documentService.js - Unified document handling
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Unified Document Service
 * Handles both document processing and generation
 */
class DocumentService {
    constructor() {
        this.supportedTypes = {
            'application/pdf': this.extractFromPDF,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.extractFromDocx,
            'application/msword': this.extractFromDoc,
            'text/plain': this.extractFromText
        };
    }

    /**
     * Extract text from uploaded document buffer
     * @param {Buffer} buffer - File buffer
     * @param {string} mimetype - File MIME type
     * @param {string} filename - Original filename
     * @returns {Promise<string>} - Extracted text
     */
    async extractText(buffer, mimetype, filename) {
        const extractor = this.supportedTypes[mimetype];
        
        if (!extractor) {
            throw new Error(`Unsupported file type: ${mimetype}`);
        }

        try {
            const text = await extractor.call(this, buffer);
            
            if (!text || !text.trim()) {
                throw new Error('Document appears to be empty or text could not be extracted');
            }

            return text.trim();
        } catch (error) {
            console.error(`Text extraction failed for ${filename}:`, error);
            throw new Error(`Failed to extract text from ${filename}: ${error.message}`);
        }
    }

    /**
     * Extract text from PDF buffer
     */
    async extractFromPDF(buffer) {
        const data = await pdfParse(buffer);
        return data.text;
    }

    /**
     * Extract text from DOCX buffer
     */
    async extractFromDocx(buffer) {
        const { value } = await mammoth.extractRawText({ buffer });
        return value;
    }

    /**
     * Extract text from DOC buffer (legacy Word format)
     */
    async extractFromDoc(buffer) {
        try {
            const { value } = await mammoth.extractRawText({ buffer });
            return value;
        } catch (error) {
            throw new Error('Could not parse .doc file. Please convert to DOCX or PDF format.');
        }
    }

    /**
     * Extract text from plain text buffer
     */
    async extractFromText(buffer) {
        return buffer.toString('utf8');
    }

    /**
     * Validate uploaded file
     * @param {Object} file - Multer file object
     * @returns {Object} - Validation result
     */
    validateFile(file) {
        if (!file) {
            return { isValid: false, error: 'No file provided' };
        }

        const maxSize = (process.env.MAX_FILE_SIZE || 10) * 1024 * 1024;
        const allowedTypes = Object.keys(this.supportedTypes);

        if (file.size > maxSize) {
            return { 
                isValid: false, 
                error: `File size exceeds ${process.env.MAX_FILE_SIZE || 10}MB limit` 
            };
        }

        if (!allowedTypes.includes(file.mimetype)) {
            return { 
                isValid: false, 
                error: 'Unsupported file type. Supported formats: PDF, Word documents (.docx, .doc), and text files.' 
            };
        }

        return { isValid: true };
    }

    /**
     * Get file type information
     * @param {string} mimetype - File MIME type
     * @returns {Object} - File type info
     */
    getFileTypeInfo(mimetype) {
        const typeMap = {
            'application/pdf': { name: 'PDF', icon: 'fas fa-file-pdf' },
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { name: 'Word Document', icon: 'fas fa-file-word' },
            'application/msword': { name: 'Word Document (Legacy)', icon: 'fas fa-file-word' },
            'text/plain': { name: 'Text File', icon: 'fas fa-file-alt' }
        };

        return typeMap[mimetype] || { name: 'Unknown', icon: 'fas fa-file' };
    }
}

module.exports = new DocumentService();