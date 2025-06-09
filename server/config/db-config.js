// server/config/db-config.js - Enhanced version with mock database support
const mongoose = require('mongoose');

/**
 * Database connection state management
 */
let isConnected = false;
let usingMockDatabase = false;

/**
 * Mock Database implementation for development when MongoDB is not available
 */
class MockDatabase {
    constructor() {
        console.log('Using Mock Database for development');
        this.collections = new Map();
        this.models = {};
        this.connection = {
            host: 'mock-db',
            on: (event, callback) => {
                console.log(`Mock DB registered event listener for: ${event}`);
                return this;
            }
        };
    }
    
    /**
     * Create a mock model that simulates Mongoose model behavior
     * @param {string} modelName - Name of the model
     * @param {Object} schema - Schema definition (not used in mock)
     * @returns {Object} - Mock model with basic CRUD operations
     */
    model(modelName, schema) {
        if (!this.models[modelName]) {
            // Initialize collection if it doesn't exist
            if (!this.collections.has(modelName)) {
                this.collections.set(modelName, []);
            }
            
            this.models[modelName] = {
                find: async (query = {}) => {
                    console.log(`Mock DB: find on ${modelName}`, query);
                    return this.collections.get(modelName) || [];
                },
                findOne: async (query = {}) => {
                    console.log(`Mock DB: findOne on ${modelName}`, query);
                    const collection = this.collections.get(modelName) || [];
                    // Simple implementation - just return first item or null
                    return collection.length > 0 ? collection[0] : null;
                },
                create: async (data) => {
                    console.log(`Mock DB: create on ${modelName}`, data);
                    const newItem = {
                        ...data,
                        _id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        save: async () => newItem
                    };
                    const collection = this.collections.get(modelName) || [];
                    collection.push(newItem);
                    this.collections.set(modelName, collection);
                    return newItem;
                },
                deleteOne: async (query = {}) => {
                    console.log(`Mock DB: deleteOne on ${modelName}`, query);
                    return { acknowledged: true, deletedCount: 1 };
                }
            };
        }
        return this.models[modelName];
    }
}

/**
 * Get the appropriate MongoDB connection string based on environment
 * @returns {string|null} - MongoDB connection URI or null if not configured
 */
const getMongoURI = () => {
    // If MONGODB_URI is explicitly set, use it (override)
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }
    
    // Otherwise, select based on environment
    const env = process.env.NODE_ENV || 'development';
    
    // Default Atlas connection string (replace <db_password> with actual password in production)
    const defaultUri = 'mongodb+srv://alamsyed25:<db_password>@cluster0.dk6eaia.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    switch(env) {
        case 'production':
            return process.env.PROD_MONGODB_URI || defaultUri;
        case 'test':
            return process.env.TEST_MONGODB_URI || defaultUri;
        case 'development':
        default:
            return process.env.DEV_MONGODB_URI || defaultUri;
    }
};

/**
 * Connect to MongoDB database with environment-specific settings
 * @returns {Promise} - MongoDB connection promise or mock database
 */
const connectDB = async () => {
    // Return early if already connected
    if (isConnected) {
        console.log('MongoDB already connected');
        return mongoose.connection;
    }
    
    // If we're already using mock database, return it
    if (usingMockDatabase) {
        console.log('Using mock database (already initialized)');
        return global.mockMongoose;
    }

    const uri = getMongoURI();
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    // If no URI is provided in development, use mock database
    if (!uri && isDev) {
        console.warn('MongoDB URI not set for development environment. Using mock database.');
        usingMockDatabase = true;
        global.mockMongoose = new MockDatabase();
        
        // Override mongoose model function to use our mock implementation
        mongoose.model = (name, schema) => global.mockMongoose.model(name, schema);
        
        return global.mockMongoose;
    } else if (!uri) {
        console.warn(`Warning: MongoDB URI not set for ${process.env.NODE_ENV || 'development'} environment. Running in static/demo mode.`);
        return null;
    }
    
    try {
        // Configure connection options based on environment
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // Add connection pooling
            maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 10,
            minPoolSize: process.env.NODE_ENV === 'production' ? 5 : 2,
            // Automatically close connection after period of inactivity
            maxIdleTimeMS: 30000,
            // Buffer commands until connection is established
            bufferCommands: false
            // Removed bufferMaxEntries as it's no longer supported
        };
        
        const conn = await mongoose.connect(uri, options);
        
        // Set connection state
        isConnected = true;
        
        // Handle connection events
        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            console.log('MongoDB disconnected');
        });
        
        mongoose.connection.on('error', (error) => {
            isConnected = false;
            console.error('MongoDB connection error:', error);
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host} (${process.env.NODE_ENV || 'development'} environment)`);
        return conn;
    } catch (error) {
        isConnected = false;
        console.error('Database connection error:', error);
        
        // In development, fall back to mock database if connection fails
        if (isDev) {
            console.warn('MongoDB connection failed in development. Falling back to mock database.');
            usingMockDatabase = true;
            global.mockMongoose = new MockDatabase();
            
            // Override mongoose model function to use our mock implementation
            mongoose.model = (name, schema) => global.mockMongoose.model(name, schema);
            
            return global.mockMongoose;
        }
        
        // Retry connection after delay in production, but not in test
        if (process.env.NODE_ENV === 'production') {
            console.log('Retrying connection in 5 seconds...');
            setTimeout(connectDB, 5000);
        } else if (process.env.NODE_ENV === 'test') {
            throw error; // In test environment, propagate the error
        }
    }
};

/**
 * Gracefully close database connection
 */
const disconnectDB = async () => {
    if (isConnected) {
        await mongoose.connection.close();
        isConnected = false;
        console.log('MongoDB connection closed');
    }
    
    if (usingMockDatabase) {
        usingMockDatabase = false;
        global.mockMongoose = null;
        console.log('Mock database connection closed');
    }
};

/**
 * Check if database is connected
 * @returns {boolean} - Connection status
 */
const isDBConnected = () => isConnected || usingMockDatabase;

/**
 * Check if using mock database
 * @returns {boolean} - True if using mock database
 */
const isUsingMockDB = () => usingMockDatabase;

module.exports = {
    connectDB,
    disconnectDB,
    isDBConnected,
    isUsingMockDB
};
