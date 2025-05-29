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
const routes = require('./server/routes');

const app = express();

// Configure application middleware based on environment
configureApp(app);

// Connect to MongoDB if not in test mode
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Apply API routes
app.use('/api', routes);

// Serve static files from multiple directories
app.use(express.static(__dirname)); // Serve from root
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files for all other routes
app.get('*', (req, res) => {
   res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Only start the server if we're not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
}

module.exports = app;