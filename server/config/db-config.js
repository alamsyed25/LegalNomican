const mongoose = require('mongoose');

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
        };
        
        // Add production-specific options
        if (process.env.NODE_ENV === 'production') {
            options.maxPoolSize = 20;
            options.minPoolSize = 5;
        } else {
            options.maxPoolSize = 10;
        }
        
        const conn = await mongoose.connect(uri, options);
        
        console.log(`MongoDB Connected: ${conn.connection.host} (${process.env.NODE_ENV || 'development'} environment)`);
        return conn;
    } catch (error) {
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

module.exports = {
    connectDB
};
