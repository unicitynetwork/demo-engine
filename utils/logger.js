
const debug = require('debug');

// Define our application's debug namespaces
const NAMESPACES = {
    APP: 'unicity:app',
    ERROR: 'unicity:error',
    GAME: 'unicity:game',
    ROUTER: 'unicity:router',
    WS: 'unicity:websocket'
};

// Enable debug logging based on environment variable or default categories
const defaultCategories = Object.values(NAMESPACES).join(',');
debug.enable(process.env.DEBUG || defaultCategories);

// Create logger instances for different aspects of the application
const loggers = {
    // General application logging
    app: debug(NAMESPACES.APP),
    
    // Error logging
    error: debug(NAMESPACES.ERROR),
    
    // Game-specific events
    game: debug(NAMESPACES.GAME),
    
    // Router events
    router: debug(NAMESPACES.ROUTER),
    
    // WebSocket events
    ws: debug(NAMESPACES.WS)
};

// Add a timestamp to each log message
Object.values(loggers).forEach(logger => {
    logger.log = function(...args) {
        const timestamp = new Date().toISOString();
        args[0] = `[${timestamp}] ${args[0]}`;
        return debug.log.apply(this, args);
    };
});

module.exports = loggers;