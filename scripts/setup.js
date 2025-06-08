const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Path to directory
 * @param {string} dirName - Name of directory for logging
 * @returns {boolean} - Whether directory was created
 */
const createDirectoryIfNotExists = (dirPath, dirName) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✓ Created ${dirName} directory`);
        return true;
    } else {
        console.log(`✓ ${dirName} directory already exists`);
        return false;
    }
};

/**
 * Create .gitkeep file in directory
 * @param {string} dirPath - Path to directory 
 */
const createGitKeep = (dirPath) => {
    const gitkeepPath = path.join(dirPath, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '');
        console.log(`✓ Created .gitkeep in ${path.basename(dirPath)} directory`);
    }
};

/**
 * Validate environment settings
 * @returns {Object} - Validation results with errors and warnings
 */
const validateEnvironment = () => {
    // Load .env file if exists
    const envPath = path.join(__dirname, '../.env');
    let envConfig = {};
    
    if (fs.existsSync(envPath)) {
        console.log('✓ .env file exists');
        envConfig = dotenv.parse(fs.readFileSync(envPath));
    } else {
        console.log('⚠️  .env file not found. Please copy .env.example to .env and configure your settings.');
    }
    
    const errors = [];
    const warnings = [];
    
    // Required variables
    const requiredVars = ['PORT', 'MONGODB_URI', 'NODE_ENV', 'REDIS_URL'];
    for (const varName of requiredVars) {
        if (!envConfig[varName]) {
            errors.push(`Missing required environment variable: ${varName}`);
        }
    }
    
    // Environment-specific validations
    if (envConfig.NODE_ENV === 'production') {
        // For production, we should have API keys, secure configs, etc.
        if (!envConfig.OPENAI_API_KEY) {
            errors.push('Production environment requires OPENAI_API_KEY');
        }
    } else if (envConfig.NODE_ENV === 'development') {
        // For development, we might allow some things to be missing
        if (!envConfig.OPENAI_API_KEY) {
            warnings.push('Development environment works better with OPENAI_API_KEY');
        }
    } else if (envConfig.NODE_ENV === 'test') {
        // For test environment, make sure test-specific configs exist
        if (!envConfig.MONGODB_URI.includes('test')) {
            warnings.push('Test database URI should contain "test" to avoid corrupting production data');
        }
    }
    
    return { errors, warnings, envConfig };
};

/**
 * Setup script to create necessary directories and files
 */
const setup = () => {
    console.log('Setting up Legal Nomicon backend...');
    
    // Create essential directories
    const uploadsDir = path.join(__dirname, '../uploads');
    createDirectoryIfNotExists(uploadsDir, 'uploads');
    createGitKeep(uploadsDir);
    
    const logsDir = path.join(__dirname, '../logs');
    createDirectoryIfNotExists(logsDir, 'logs');
    createGitKeep(logsDir);

    // Create test directory structure
    const testDir = path.join(__dirname, '../tests');
    if (createDirectoryIfNotExists(testDir, 'tests')) {
        // If tests directory was just created, create subdirectories
        createDirectoryIfNotExists(path.join(testDir, 'unit'), 'tests/unit');
        createDirectoryIfNotExists(path.join(testDir, 'integration'), 'tests/integration');
        createDirectoryIfNotExists(path.join(testDir, 'fixtures'), 'tests/fixtures');
    }
    
    // Validate environment
    const { errors, warnings } = validateEnvironment();
    
    // Report validation results
    if (errors.length > 0) {
        console.log('\n⛔ Environment validation errors:');
        errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (warnings.length > 0) {
        console.log('\n⚠️  Environment validation warnings:');
        warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        console.log('\n✅ Environment validation passed successfully');
    }
    
    console.log('\nSetup complete! 🎉');
    console.log('\nNext steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Configure your .env file');
    console.log('3. Run tests: npm test');
    console.log('4. Start development server: npm run dev');
};

// Run setup if this script is executed directly
if (require.main === module) {
    setup();
}

module.exports = { setup };