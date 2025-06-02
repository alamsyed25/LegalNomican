const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { startChatSession, processMessage, handleFileUpload } = require('../controllers/chatController');
const { validateRequest } = require('../middleware/validationHandler');

// Chat routes
router.post('/start', startChatSession);
router.post('/message',
    [
        body('sessionId').notEmpty().withMessage('Session ID is required.').isString().withMessage('Session ID must be a string.'),
        body('message').notEmpty().withMessage('Message is required.').isString().withMessage('Message must be a string.')
    ],
    validateRequest,
    processMessage
);
router.post('/upload-document', handleFileUpload);

module.exports = router;
