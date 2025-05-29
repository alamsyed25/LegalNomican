const express = require('express');
const router = express.Router();
const { startChatSession, processMessage } = require('../controllers/chatController');

// Chat routes
router.post('/start', startChatSession);
router.post('/message', processMessage);

module.exports = router;
