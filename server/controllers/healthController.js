const mongoose = require('mongoose');

/**
 * Check system health status
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const checkHealth = (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus[dbState],
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
};

module.exports = {
    checkHealth
};
