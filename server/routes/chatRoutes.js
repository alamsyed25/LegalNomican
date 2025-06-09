const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { startChatSession, processMessage, uploadDocument, clearDocumentContext, getSessionInfo } = require('../controllers/chatController');
const { validationErrorHandler } = require('../middleware/errorMiddleware');

// Chat routes
router.post('/start', startChatSession);
router.post('/message',
    [
        body('sessionId').notEmpty().withMessage('Session ID is required.').isString().withMessage('Session ID must be a string.'),
        body('message').notEmpty().withMessage('Message is required.').isString().withMessage('Message must be a string.')
    ],
    validationErrorHandler,
    processMessage
);
router.post('/upload-document', uploadDocument);
router.post('/clear-context', clearDocumentContext);
router.get('/session/:sessionId', getSessionInfo);

module.exports = router;
