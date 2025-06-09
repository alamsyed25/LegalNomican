// server/config/env-validator.js
/**
 * Environment Configuration Validator
 * Ensures all required environment variables are set and valid
 */

const requiredEnvVars = {
    development: [
        'NODE_ENV',
        'PORT',
        'DEV_MONGODB_URI'
        // REDIS_URL is optional in development
    ],
    test: [
        'NODE_ENV',
        'TEST_MONGODB_URI'
        // REDIS_URL might be optional or mocked in test
    ],
    production: [
        'NODE_ENV',
        'PORT',
        'PROD_MONGODB_URI',
        'REDIS_URL',
        'JWT_SECRET',
        'SESSION_SECRET',
        'ALLOWED_FILE_TYPES', // Likely required in prod
        'MAX_FILE_SIZE'       // Likely required in prod
    ]
};

const optionalEnvVars = {
    all: [
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'DEBUG_MODE',
        'MAX_REQUEST_SIZE',
        // MAX_FILE_SIZE and ALLOWED_FILE_TYPES might be considered optional if they have defaults
        // or are not strictly needed for the app to run, but better to be required if core features depend on them.
        'DEV_CORS_ORIGINS', // Specific to dev
        'PROD_CORS_ORIGINS', // Specific to prod
        'REDIS_URL' // Optional in development, required in production
    ]
};

/**
 * Validate environment configuration
 * @param {string} env - Environment name
 * @returns {Object} - Validation results
 */
const validateEnvironment = (env = process.env.NODE_ENV || 'development') => {
    const errors = [];
    const warnings = [];
    const missing = [];

    // Determine the actual environment being validated
    const currentEnv = process.env.NODE_ENV || 'development'; 

    const required = requiredEnvVars[currentEnv] || requiredEnvVars.development;
    
    required.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
            errors.push(`Missing required environment variable for ${currentEnv.toUpperCase()} environment: ${varName}`);
        }
    });

    // Check optional variables and warn if missing in production
    if (currentEnv === 'production') {
        optionalEnvVars.all.forEach(varName => {
            // Only warn for truly optional or those not covered by production's required list
            if (!required.includes(varName) && !process.env[varName]) {
                 // Avoid warning for DEV_CORS_ORIGINS in prod, etc.
                if (!((varName === 'DEV_CORS_ORIGINS' && currentEnv === 'production') || 
                      (varName === 'PROD_CORS_ORIGINS' && currentEnv !== 'production'))) {
                    warnings.push(`Optional environment variable not set for PRODUCTION: ${varName}`);
                }
            }
        });
    }

    // Validate specific formats
    if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
        errors.push('PORT must be a valid number');
    }

    if (process.env.MAX_FILE_SIZE && isNaN(parseInt(process.env.MAX_FILE_SIZE))) {
        errors.push('MAX_FILE_SIZE must be a valid number');
    }
    if (process.env.MAX_REQUEST_SIZE && isNaN(parseInt(process.env.MAX_REQUEST_SIZE))) {
        errors.push('MAX_REQUEST_SIZE must be a valid number');
    }

    // Check database URI format
    const dbUriKey = `${currentEnv.toUpperCase()}_MONGODB_URI`;
    const dbUri = process.env.MONGODB_URI || process.env[dbUriKey];
    if (required.includes(dbUriKey) && // only if it's required for the current env
        dbUri && 
        !dbUri.startsWith('mongodb://') && 
        !dbUri.startsWith('mongodb+srv://')) {
        errors.push(`Database URI (${dbUriKey}) must start with "mongodb://" or "mongodb+srv://"`);
    }

    // Security checks for production
    if (currentEnv === 'production') {
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
            warnings.push('JWT_SECRET should be at least 32 characters long for security in PRODUCTION');
        }
        
        if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
            warnings.push('SESSION_SECRET should be at least 32 characters long for security in PRODUCTION');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        missing,
        environment: currentEnv
    };
};

/**
 * Load and validate environment configuration
 * @param {boolean} exitOnError - Whether to exit process on validation errors
 */
const loadAndValidateConfig = (exitOnError = true) => {
    // dotenv.config() should have been called before this function.
    const env = process.env.NODE_ENV || 'development';
    const validation = validateEnvironment(env);

    console.log(`\n🔧 Environment: ${validation.environment.toUpperCase()}`);
    
    if (validation.isValid) {
        console.log('✅ Environment configuration is valid.');
    } else {
        console.error('❌ Environment configuration errors found:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
    }

    if (validation.warnings.length > 0) {
        console.warn('⚠️  Environment warnings:');
        validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    if (!validation.isValid && (validation.environment === 'production' || exitOnError)) {
        console.error('\n💥 Exiting due to environment configuration errors.');
        process.exit(1);
    }

    return validation;
};

/**
 * Get environment-specific configuration
 * @returns {Object} - Configuration object
 */
const getConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    const dbUriKey = `${env.toUpperCase()}_MONGODB_URI`;

    return {
        env,
        port: parseInt(process.env.PORT) || 3001,
        debugMode: process.env.DEBUG_MODE === 'true',
        mongodb: {
            uri: process.env.MONGODB_URI || process.env[dbUriKey]
        },
        redis: {
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        },
        security: {
            jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-minimum-10-chars',
            sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-minimum-10-chars'
        },
        limits: {
            maxRequestSizeMB: parseInt(process.env.MAX_REQUEST_SIZE) || 10,
            maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE) || 10,
            allowedFileTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',') : ['pdf', 'docx', 'doc', 'txt']
        },
        cors: {
            devOrigins: process.env.DEV_CORS_ORIGINS ? process.env.DEV_CORS_ORIGINS.split(',') : ['http://localhost:3000'],
            prodOrigins: process.env.PROD_CORS_ORIGINS ? process.env.PROD_CORS_ORIGINS.split(',') : [] // Sensible default for prod
        },
        apiKeys: {
            openai: process.env.OPENAI_API_KEY,
            anthropic: process.env.ANTHROPIC_API_KEY
        }
    };
};

module.exports = {
    validateEnvironment,
    loadAndValidateConfig,
    getConfig
};
