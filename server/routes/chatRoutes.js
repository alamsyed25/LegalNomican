const express = require('express');
const router = express.Router();
const { startChatSession, processMessage, handleFileUpload } = require('../controllers/chatController');

// Chat routes
router.post('/start', startChatSession);
router.post('/message', processMessage);
router.post('/upload-document', handleFileUpload);

module.exports = router;
