const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

/**
 * Configure Express application with middleware based on environment
 * @param {Express} app - Express application instance
 */
const configureApp = (app) => {
    // Apply environment-specific configuration
    const env = process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';
    const isTest = env === 'test';
    
    // Configure security middleware
    configureSecurityMiddleware(app, isProduction);
    
    // Configure rate limiting
    configureRateLimiting(app, isProduction);
    
    // Apply compression
    app.use(compression());
    
    // Configure CORS
    configureCors(app, env);
    
    // Configure request parsing
    configureRequestParsing(app);
    
    // Add request logging in non-production environments
    if (!isProduction && !isTest) {
        app.use((req, res, next) => {
            if (process.env.DEBUG_MODE === 'true') {
                console.log(`${req.method} ${req.url}`);
            }
            next();
        });
    }
};

/**
 * Configure security middleware
 * @param {Express} app - Express application instance
 * @param {boolean} isProduction - Whether the app is running in production
 */
const configureSecurityMiddleware = (app, isProduction) => {
    // Configure Helmet security headers
    const helmetConfig = {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                fontSrc: ["'self'", "https://cdnjs.cloudflare.com"]
            }
        }
    };
    
    // Add stricter security policies in production
    if (isProduction) {
        helmetConfig.hsts = {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        };
    }
    
    app.use(helmet(helmetConfig));
};

/**
 * Configure rate limiting middleware
 * @param {Express} app - Express application instance
 * @param {boolean} isProduction - Whether the app is running in production
 */
const configureRateLimiting = (app, isProduction) => {
    // Set stricter limits in production
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = isProduction ? 100 : 1000; // Lower limit in production
    
    const limiter = rateLimit({
        windowMs,
        max: maxRequests,
        message: {
            error: 'Too many requests from this IP, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false
    });
    
    app.use('/api/', limiter);
};

/**
 * Configure CORS middleware
 * @param {Express} app - Express application instance
 * @param {string} env - Current environment
 */
const configureCors = (app, env) => {
    // Get allowed origins based on environment
    const origins = getCorsOrigins(env);
    
    const corsOptions = {
        credentials: true,
        origin: origins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };
    
    app.use(cors(corsOptions));
};

/**
 * Configure request parsing middleware
 * @param {Express} app - Express application instance
 */
const configureRequestParsing = (app) => {
    const maxSize = process.env.MAX_REQUEST_SIZE || 10;
    const limit = `${maxSize}mb`;
    
    app.use(express.json({ limit }));
    app.use(express.urlencoded({ extended: true, limit }));
};

/**
 * Get allowed CORS origins based on current environment
 * @param {string} env - Current environment
 * @returns {Array|string} - Array of allowed origins or '*'
 */
const getCorsOrigins = (env) => {
    switch(env) {
        case 'production':
            // Use environment variable or fallback to default production origins
            return process.env.PROD_CORS_ORIGINS ? 
                process.env.PROD_CORS_ORIGINS.split(',') : 
                ['https://legalnomicon.com', 'https://www.legalnomicon.com'];
        case 'test':
            return '*';
        case 'development':
        default:
            // Use environment variable or fallback to default development origins
            return process.env.DEV_CORS_ORIGINS ? 
                process.env.DEV_CORS_ORIGINS.split(',') : 
                ['http://localhost:3000', 'http://127.0.0.1:3000'];
    }
};

module.exports = {
    configureApp
};
