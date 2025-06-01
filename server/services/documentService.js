const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

/**
 * Extract text content from various document formats
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} - Extracted text and metadata
 */
const extractTextFromDocument = async (file) => {
    try {
        const { mimetype, path: filePath, originalname } = file;
        
        let extractedText = '';
        let metadata = {
            filename: originalname,
            size: file.size,
            mimetype,
            pageCount: 0
        };

        switch (mimetype) {
            case 'application/pdf':
                const pdfResult = await extractTextFromPDF(filePath);
                extractedText = pdfResult.text;
                metadata.pageCount = pdfResult.numpages;
                break;
                
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/msword':
                extractedText = await extractTextFromWord(filePath);
                break;
                
            case 'text/plain':
                extractedText = await extractTextFromTxt(filePath);
                break;
                
            default:
                throw new Error(`Unsupported file type: ${mimetype}`);
        }

        // Clean up temporary file
        await fs.unlink(filePath);

        return {
            text: extractedText,
            metadata,
            wordCount: extractedText.split(/\s+/).length
        };
    } catch (error) {
        // Clean up file if extraction fails
        try {
            await fs.unlink(file.path);
        } catch (unlinkError) {
            console.error('Error cleaning up file:', unlinkError);
        }
        throw error;
    }
};

/**
 * Extract text from PDF files
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Object>} - PDF parse result
 */
const extractTextFromPDF = async (filePath) => {
    const dataBuffer = await fs.readFile(filePath);
    return await pdfParse(dataBuffer);
};

/**
 * Extract text from Word documents
 * @param {string} filePath - Path to Word document
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromWord = async (filePath) => {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
};

/**
 * Extract text from plain text files
 * @param {string} filePath - Path to text file
 * @returns {Promise<string>} - File content
 */
const extractTextFromTxt = async (filePath) => {
    return await fs.readFile(filePath, 'utf-8');
};

/**
 * Validate uploaded file
 * @param {Object} file - Multer file object
 * @returns {Object} - Validation result
 */
const validateDocument = (file) => {
    const maxSize = (process.env.MAX_FILE_SIZE || 10) * 1024 * 1024; // Convert MB to bytes
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
    ];

    if (!file) {
        return { isValid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
        return { 
            isValid: false, 
            error: `File size exceeds ${process.env.MAX_FILE_SIZE || 10}MB limit` 
        };
    }

    if (!allowedTypes.includes(file.mimetype)) {
        return { 
            isValid: false, 
            error: 'Unsupported file type. Please upload PDF, Word, or text files.' 
        };
    }

    return { isValid: true };
};

module.exports = {
    extractTextFromDocument,
    validateDocument
};