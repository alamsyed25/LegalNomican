const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Validate environment variables immediately after loading them
const { loadAndValidateConfig } = require('./server/config/env-validator');
loadAndValidateConfig(); // This will exit on error if needed

// Import modules
// Import config getter after validation
const { getConfig } = require('./server/config/env-validator'); 
const { configureApp } = require('./server/config/app-config');
const { connectDB, disconnectDB } = require('./server/config/db-config');
const chatRoutes = require('./server/routes/chatRoutes');
const documentRoutes = require('./server/routes/documentRoutes');
const routes = require('./server/routes');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { globalErrorHandler, notFoundHandler } = require('./server/middleware/errorMiddleware');

const app = express();

// Configure application middleware based on environment
configureApp(app);

// Security: Sanitize user input
app.use(xss()); // Prevent XSS attacks
app.use(mongoSanitize()); // Prevent NoSQL query injection

// Connect to MongoDB if not in test mode
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Apply API routes
app.use('/api', routes);
app.use('/api/chat', chatRoutes);
app.use('/documents', documentRoutes);

// Test route for file uploads
app.post('/test-upload', (req, res) => {
    console.log('Test upload route hit!');
    console.log('Headers:', req.headers);
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files:', req.files ? Object.keys(req.files) : 'No req.files');
    console.log('File:', req.file || 'No req.file');
    
    res.json({
        success: true,
        message: 'Test upload route hit',
        body: req.body,
        hasFile: !!req.file,
        hasFiles: !!req.files
    });
});

// Add a simpler debug route for examining routes
app.get('/debug/routes', (req, res) => {
    const routes = [];

    // Helper function to print routes
    function print(path, layer) {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods)
                .filter(method => layer.route.methods[method])
                .map(method => method.toUpperCase());
                
            routes.push({
                path: path + layer.route.path,
                methods: methods,
                handler: layer.route.stack[0]?.handle?.name || 'anonymous'
            });
        } else if (layer.name === 'router' && layer.handle.stack) {
            // This is a mounted router
            let mountPath = '';
            if (layer.regexp && layer.regexp.toString() !== '/^\/?(?=\/|$)/i') {
                mountPath = layer.regexp.toString()
                    .replace('/^\\/?', '')
                    .replace('(?=\\/|$)/i', '')
                    .replace(/\\\//g, '/');
            }
            layer.handle.stack.forEach((stackItem) => {
                print(path + mountPath, stackItem);
            });
        }
    }

    // Process all routes
    app._router.stack.forEach((layer) => {
        print('', layer);
    });

    res.json({
        routes,
        chatRoutes: routes.filter(r => r.path.includes('/api/chat')),
        uploadRoutes: routes.filter(r => r.path.includes('upload'))
    });
});

// Add a simple test route for direct uploads
app.post('/test/upload', (req, res) => {
    res.json({
        success: true,
        message: 'Test upload endpoint reached',
        body: req.body || 'No body',
        files: req.files || 'No files',
        file: req.file || 'No file'
    });
});

// Serve static files from multiple directories
app.use(express.static(__dirname)); // Serve from root
app.use(express.static(path.join(__dirname, 'public')));

// Serve chatbot.html at the /chat route
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'chatbot.html'));
});

// Handle 404 for API routes or specific files not found before falling to SPA catch-all
app.use(notFoundHandler);

// Serve index.html for all other routes (SPA catch-all)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Global error handler - must be last
app.use(globalErrorHandler);

const config = getConfig(); // Use validated and processed config
const PORT = config.port; // Changed default port to 3001

// Only start the server if we're not in test mode
let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`
${signal} received. Shutting down gracefully...`);
    if (server) {
        server.close(async () => {
            console.log('HTTP server closed.');
            await disconnectDB(); // Ensure DB is disconnected
            process.exit(0);
        });
    } else {
        await disconnectDB(); // If server wasn't started (e.g. in test), still try to disconnect DB
        process.exit(0);
    }

    // Force shutdown if server hasn't closed in time
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000); // 10 seconds
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;