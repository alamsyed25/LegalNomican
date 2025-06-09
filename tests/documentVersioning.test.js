const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const Document = require('../server/models/Document');
const User = require('../server/models/User');
const DocumentVersion = require('../server/models/DocumentVersion');
const ComparisonResult = require('../server/models/ComparisonResult');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock the document comparison service
jest.mock('../server/services/documentComparisonService', () => ({
  compareDocuments: jest.fn((doc1, doc2) => ({
    characterDiff: 'mock-character-diff',
    wordDiff: 'mock-word-diff',
    lineDiff: 'mock-line-diff',
    sentenceDiff: 'mock-sentence-diff',
    statistics: {
      similarity: 95,
      additionsCount: 2,
      deletionsCount: 1,
      totalChanges: 3
    }
  }))
}));

let testUser;
let authToken;
let mockAuthUserId; // Module-scoped variable for dynamic user ID in mock
let mongoServer;

// Top-level database setup for tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Top-level database teardown for tests
afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Mock user authentication middleware from errorMiddleware.js
jest.mock('../server/middleware/errorMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: mockAuthUserId }; // Use the dynamic ID
    next();
  },
  validationErrorHandler: (req, res, next) => next(), // Pass-through for other tests
  // Add other exports from errorMiddleware if needed by tests, mocking them appropriately
  globalErrorHandler: jest.fn(), 
  notFoundHandler: jest.fn(),
  asyncHandler: jest.fn(fn => fn) // Mock asyncHandler to return the wrapped function
}));

beforeAll(async () => {
  // Clear any existing test data
  // await mongoose.connection.dropDatabase(); // This is now handled by top-level afterAll or fresh in-memory DB
  
  // Create a test user
  testUser = new User({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  });
  await testUser.save();
  mockAuthUserId = testUser._id.toString(); // Set initial mock user ID
  
  // Generate auth token
  authToken = 'test-token';
});

/* // This afterAll is now handled by the top-level afterAll
afterAll(async () => {
  // Clean up after all tests
  // await mongoose.connection.dropDatabase();
});
*/

describe('Document Versioning System', () => {
  let documentId;
  
  test('should create a new document with initial version', async () => {
    const response = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Document',
        content: 'Initial content',
        format: 'plain',
        isVersioned: true
      });
      
    expect(response.status).toBe(201);
    expect(response.body.data.document).toHaveProperty('_id');
    expect(response.body.data.document.title).toBe('Test Document');
    expect(response.body.data.document.currentVersion).toBe(1);
    
    documentId = response.body.data.document._id;
    
    // Verify version was created
    const versions = await DocumentVersion.find({ documentId });
    expect(versions).toHaveLength(1);
    expect(versions[0].version).toBe(1);
  });
  
  test('should create a new version when updating document', async () => {
    const updateResponse = await request(app)
      .put(`/api/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Updated content',
        changeLog: 'Updated the content'
      });
      
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.document.content).toBe('Updated content');
    expect(updateResponse.body.data.document.currentVersion).toBe(2);
    
    // Verify new version was created
    const versions = await DocumentVersion.find({ documentId }).sort({ version: -1 });
    expect(versions).toHaveLength(2);
    expect(versions[0].version).toBe(2);
    expect(versions[1].version).toBe(1);
  });
  
  test('should compare two versions of a document', async () => {
    // Create a third version
    await request(app)
      .put(`/api/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Final content',
        changeLog: 'Final update'
      });
    
    // Get versions to compare
    const versions = await DocumentVersion.find({ documentId }).sort({ version: -1 });
    const version1Id = versions[1]._id; // Version 2
    const version2Id = versions[0]._id; // Version 3
    
    // Compare versions
    const compareResponse = await request(app)
      .get(`/api/compare/version/${version1Id}/${version2Id}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(compareResponse.status).toBe(200);
    expect(compareResponse.body.data.comparison).toBeDefined();
    expect(compareResponse.body.data.comparison.statistics).toBeDefined();
  });
  
  test('should get comparison history', async () => {
    const response = await request(app)
      .get('/api/comparisons')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.comparisons)).toBe(true);
  });
});

describe('Document Permissions', () => {
  let otherUser;
  let otherUserToken = 'other-user-token';
  let documentId;
  let otherUserId; // To store otherUser's ID

  beforeAll(async () => {
    // Create another test user
    otherUser = new User({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123',
      role: 'user'
    });
    await otherUser.save();
    
    // Create a document as the test user
    const response = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Private Document',
        content: 'Private content',
        format: 'plain',
        isVersioned: true
      });
      
    documentId = response.body.data.document._id;
    otherUserId = otherUser._id.toString(); // Store otherUser's ID
  });
  
  test('should not allow unauthorized access to document', async () => {
    mockAuthUserId = otherUserId; // Set context to otherUser
    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
      
    expect(response.status).toBe(403);
  });
  
  test('should allow access to collaborators', async () => {
    mockAuthUserId = testUser._id.toString(); // Set context to testUser for adding collaborator
    // Add other user as a collaborator
    await request(app)
      .put(`/api/documents/${documentId}/collaborators`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId: otherUser._id,
        role: 'viewer'
      });
      
    mockAuthUserId = otherUserId; // Set context to otherUser for viewing
    // Now the other user should be able to view the document
    const response = await request(app)
      .get(`/api/documents/${documentId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.data.document.title).toBe('Private Document');
  });
});
