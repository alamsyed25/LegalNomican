/**
 * Unit tests for Chat Controller
 */
const chatController = require('../../server/controllers/chatController');
const documentContextService = require('../../server/services/documentContextService');
const chatMessages = require('../fixtures/chatMessages');

// Mock dependencies
jest.mock('../../server/services/documentContextService');

describe('Chat Controller', () => {
  let req, res;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and response objects
    req = {
      body: {},
      file: null,
      session: { id: 'test-session-123' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });
  
  describe('sendMessage', () => {
    it('should return a response for valid messages', async () => {
      // Setup
      req.body = chatMessages.validChatMessage;
      documentContextService.get.mockResolvedValue(null); // No document context
      
      // Execute
      await chatController.sendMessage(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          sessionId: req.body.sessionId
        })
      );
    });
    
    it('should return error for invalid messages', async () => {
      // Setup
      req.body = chatMessages.invalidChatMessage;
      
      // Execute
      await chatController.sendMessage(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('sessionId')
        })
      );
    });
    
    it('should include document context when available', async () => {
      // Setup
      req.body = chatMessages.validChatMessage;
      documentContextService.get.mockResolvedValue(chatMessages.mockDocumentContext);
      
      // Execute
      await chatController.sendMessage(req, res);
      
      // Assert
      expect(documentContextService.get).toHaveBeenCalledWith(req.body.sessionId);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe('uploadDocument', () => {
    it('should process and store uploaded document', async () => {
      // Setup
      req.file = {
        buffer: Buffer.from('mock document content'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf'
      };
      req.body.sessionId = 'test-session-123';
      documentContextService.store.mockResolvedValue(true);
      
      // Execute
      await chatController.uploadDocument(req, res);
      
      // Assert
      expect(documentContextService.store).toHaveBeenCalledWith(
        'test-session-123',
        expect.any(String)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
    
    it('should return error when no file is provided', async () => {
      // Setup
      req.file = null;
      req.body.sessionId = 'test-session-123';
      
      // Execute
      await chatController.uploadDocument(req, res);
      
      // Assert
      expect(documentContextService.store).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('file')
        })
      );
    });
  });
});
