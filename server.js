const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import modules
const { configureApp } = require('./server/config/app-config');
const { connectDB } = require('./server/config/db-config');
const chatRoutes = require('./server/routes/chatRoutes');
const documentRoutes = require('./server/routes/documentRoutes');
const routes = require('./server/routes');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

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

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3001; // Changed default port to 3001

// Only start the server if we're not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
}

module.exports = app;