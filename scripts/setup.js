const fs = require('fs');
const path = require('path');

/**
 * Setup script to create necessary directories and files
 */
const setup = () => {
    console.log('Setting up Legal Nomicon backend...');
    
    // Create uploads directory
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✓ Created uploads directory');
    } else {
        console.log('✓ Uploads directory already exists');
    }
    
    // Create .gitkeep file in uploads to track the directory
    const gitkeepPath = path.join(uploadsDir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '');
        console.log('✓ Created .gitkeep in uploads directory');
    }
    
    // Create logs directory
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
        console.log('✓ Created logs directory');
    } else {
        console.log('✓ Logs directory already exists');
    }
    
    // Check if .env file exists
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        console.log('⚠️  .env file not found. Please copy .env.example to .env and configure your settings.');
    } else {
        console.log('✓ .env file exists');
    }
    
    console.log('\nSetup complete! 🎉');
    console.log('\nNext steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Configure your .env file');
    console.log('3. Start development server: npm run dev');
};

// Run setup if this script is executed directly
if (require.main === module) {
    setup();
}

module.exports = { setup };