// server/config/db-config.js - Enhanced version
const mongoose = require('mongoose');

/**
 * Database connection state management
 */
let isConnected = false;

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
    
    switch(env) {
        case 'production':
            return process.env.PROD_MONGODB_URI;
        case 'test':
            return process.env.TEST_MONGODB_URI;
        case 'development':
        default:
            return process.env.DEV_MONGODB_URI;
    }
};

/**
 * Connect to MongoDB database with environment-specific settings
 * @returns {Promise} - MongoDB connection promise
 */
const connectDB = async () => {
    // Return early if already connected
    if (isConnected) {
        console.log('MongoDB already connected');
        return mongoose.connection;
    }

    const uri = getMongoURI();
    
    if (!uri) {
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
            bufferCommands: false,
            bufferMaxEntries: 0
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
        
        // Retry connection after delay in production or development, but not in test
        if (process.env.NODE_ENV !== 'test') {
            console.log('Retrying connection in 5 seconds...');
            setTimeout(connectDB, 5000);
        } else {
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
};

/**
 * Check if database is connected
 * @returns {boolean} - Connection status
 */
const isDBConnected = () => isConnected;

module.exports = {
    connectDB,
    disconnectDB,
    isDBConnected
};
