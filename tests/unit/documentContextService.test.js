/**
 * Unit tests for Document Context Service
 */
const documentContextService = require('../../server/services/documentContextService');
const redisClient = require('../../server/config/redis-config');

// Mock Redis client is automatically used via Jest mock defined in setup.js

describe('Document Context Service', () => {
  const mockSessionId = 'test-session-123';
  const mockDocumentData = JSON.stringify({
    content: 'Test document content',
    metadata: { filename: 'test.pdf', size: 1024 }
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('store()', () => {
    it('should store document context in Redis with TTL', async () => {
      // Setup
      redisClient.set.mockResolvedValue('OK');
      
      // Execute
      const result = await documentContextService.store(mockSessionId, mockDocumentData);
      
      // Assert
      expect(result).toBe(true);
      expect(redisClient.set).toHaveBeenCalledTimes(1);
      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining(mockSessionId),
        mockDocumentData,
        expect.objectContaining({ EX: expect.any(Number) })
      );
    });

    it('should return false when Redis store fails', async () => {
      // Setup
      redisClient.set.mockRejectedValue(new Error('Redis error'));
      
      // Execute
      const result = await documentContextService.store(mockSessionId, mockDocumentData);
      
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('get()', () => {
    it('should retrieve document context from Redis', async () => {
      // Setup
      redisClient.get.mockResolvedValue(mockDocumentData);
      
      // Execute
      const result = await documentContextService.get(mockSessionId);
      
      // Assert
      expect(result).toBe(mockDocumentData);
      expect(redisClient.get).toHaveBeenCalledTimes(1);
      expect(redisClient.get).toHaveBeenCalledWith(
        expect.stringContaining(mockSessionId)
      );
    });

    it('should return null when Redis get fails', async () => {
      // Setup
      redisClient.get.mockRejectedValue(new Error('Redis error'));
      
      // Execute
      const result = await documentContextService.get(mockSessionId);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('remove()', () => {
    it('should delete document context from Redis', async () => {
      // Setup
      redisClient.del.mockResolvedValue(1);
      
      // Execute
      const result = await documentContextService.remove(mockSessionId);
      
      // Assert
      expect(result).toBe(true);
      expect(redisClient.del).toHaveBeenCalledTimes(1);
      expect(redisClient.del).toHaveBeenCalledWith(
        expect.stringContaining(mockSessionId)
      );
    });

    it('should return false when Redis delete fails', async () => {
      // Setup
      redisClient.del.mockRejectedValue(new Error('Redis error'));
      
      // Execute
      const result = await documentContextService.remove(mockSessionId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
