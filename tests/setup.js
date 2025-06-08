/**
 * Test Setup File
 * 
 * This file is run before each test and sets up the environment
 */
require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup function to be called before tests
const setupTestDB = async () => {
  // Use in-memory MongoDB server for tests to avoid affecting real data
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Set the MongoDB URI for tests
  process.env.MONGODB_URI = uri;
  
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  
  await mongoose.connect(process.env.MONGODB_URI, mongooseOpts);
};

// Teardown function to be called after tests
const teardownTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

// Set up global beforeAll and afterAll hooks
global.beforeAll(async () => {
  await setupTestDB();
});

global.afterAll(async () => {
  await teardownTestDB();
});

// Mock Redis client
jest.mock('../server/config/redis-config', () => {
  return {
    set: jest.fn(() => Promise.resolve('OK')),
    get: jest.fn(() => Promise.resolve(null)),
    del: jest.fn(() => Promise.resolve(1)),
    exists: jest.fn(() => Promise.resolve(0)),
  };
});
