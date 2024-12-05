// middleware/setupErrorHandling.js
const { error: debugErrorLog } = require('../utils/logger');

/**
 * Handles different types of errors and logs them appropriately.
 * This shared handler ensures consistent error logging across the application.
 * 
 * @param {Request} req - Express request object
 * @param {Error} err - The error that was caught
 * @returns {Object} Structured error information for logging
 */
const sharedErrorHandler = (req, err) => {
    // Prepare base error information that's useful for all error types
    const errorInfo = {
        path: req.originalUrl,
        method: req.method,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    };

    // Handle 404 (Not Found) errors specially
    if (err?.message?.includes("Not Found")) {
        debugErrorLog('404 Not Found Error:', {
            ...errorInfo,
            errorType: '404',
            message: err.message,
            stack: err.stack
        });
        
        return {
            status: 404,
            userMessage: 'The requested page could not be found',
            errorInfo
        };
    }

    // Handle all other errors
    debugErrorLog('Uncaught Application Error:', {
        ...errorInfo,
        errorType: err.name || 'UnknownError',
        message: err.message,
        stack: err.stack
    });

    return {
        status: err.status || 500,
        userMessage: 'An unexpected error occurred',
        errorInfo
    };
};

/**
 * Express middleware for handling 404 errors
 * Creates a standardized error object for pages that don't exist
 */
const handle404 = (req, res, next) => {
    const error = new Error(`Not Found: ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

/**
 * Express middleware for handling all other errors
 * Processes errors through shared handler and sends appropriate response
 */
const handleError = (err, req, res, next) => {
    const { status, userMessage, errorInfo } = sharedErrorHandler(req, err);
    
    // In development, include error details
    if (process.env.NODE_ENV === 'development') {
        return res.status(status).json({
            message: userMessage,
            error: {
                message: err.message,
                stack: err.stack,
                ...errorInfo
            }
        });
    }

    // In production, send only safe information
    res.status(status).json({
        message: userMessage
    });
};

module.exports = {
    handle404,
    handleError
};