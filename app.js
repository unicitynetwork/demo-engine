// Core Node.js modules (built-in)
const os = require('os');
const path = require('path');
const dotenv = require("dotenv");
const fs = require('fs');

// Third-party modules (installed via npm)
const express = require('express');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require("express-session");
const MemoryStore = require('memorystore')(session);
const pug = require("pug");
const compression = require("compression");
const debug = require("debug");
const utils = require("./utils/utils");
const { app: debugLog, error: debugErrorLog, game: debugGameLog } = require('./utils/logger');

// Create our Express application instance
const app = express();


// Local modules 
const wsHandler = require('./web-sockets/wsHandler');

// Load environment variables from .env file
dotenv.config();

// Set default environment if none specified
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
}


global.cacheStats = {};

const package_json = require('./package.json');
const appSettings = {
    version: package_json.version,
    cacheId: package_json.version + '-' + Date.now() 
};

debugLog(`Unicity demo version ${appSettings.version} starting up`);
debugLog(`Cache identifier: ${appSettings.cacheId}`);

// Set up Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Configure Pug template rendering
app.engine('pug', (path, options, fn) => {
    // Set debug mode based on environment
    const debugMode = process.env.NODE_ENV === 'development';
    options.debug = false;
    
    // Call the original Pug handler
    return require('pug').__express.call(null, path, options, fn);
});

// Log our template configuration
debugLog(`Pug templates configured with debug=${process.env.NODE_ENV === 'development'}`);

// Configure view caching based on environment
if (process.env.NODE_ENV === 'production') {
    // In production, always enable view caching for better performance
    app.enable('view cache');
    debugLog("View caching enabled for production - templates will be compiled once and reused");
} else if (process.env.NODE_ENV === 'development') {
    // In development, disable view caching so we can see template changes immediately
    app.disable('view cache');
    debugLog("View caching disabled for development - template changes will be reflected immediately");
} else {
    // For any other environment, let's explicitly disable caching for safety
    app.disable('view cache');
    debugLog("View caching disabled for environment: " + process.env.NODE_ENV);
}

// Cookie configuration for our game
app.use(cookieParser(process.env.COOKIE_SECRET)); // Add a secret for signed cookies

// Security headers
app.disable('x-powered-by');
app.use((req, res, next) => {
    // Add some basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// Log cookie usage for debugging
debugLog('Cookie parser and security headers configured');

// Favicon configuration
app.use(favicon(__dirname + '/public/favicon/favicon.ico'));
debugLog('Favicon middleware configured');

// Request logging
app.use(logger('dev'));
debugLog('Request logger configured in dev mode');

// Request body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
debugLog('Body parser configured for JSON and URL-encoded data');

// error handling for JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        debugErrorLog('Invalid JSON received:', err.message);
        return res.status(400).send('Invalid JSON');
    }
    next();
});


// create our session store
const sessionStore = new MemoryStore({
    checkPeriod: 86400000 // Prune expired entries every 24h
});

// Set up error handling 
sessionStore.on('error', (error) => {
    debugErrorLog('Session store error:', error);
});

// Session configuration for the application
// Reference for production deployment
// nginx HTTPS proxy configuration: https://gist.github.com/nikmartin/5902176
const sessionConfig = {
    // Core session settings
    secret: process.env.SESSION_SECRET || 'unicity-demo-secret',
    resave: false,
    saveUninitialized: false,

    // Cookie configuration
    cookie: {
        // Initial secure setting - may be updated based on environment
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        name: 'unicity_demo_session'
    },
};

// Create session middleware with store
const sessionMiddleware = session({
    ...sessionConfig,
    store: sessionStore
});



// Configure secure environment settings
const isSecureEnvironment = process.env.NODE_ENV === 'production' && process.env.SECURE_SITE === 'true';

if (isSecureEnvironment) {
    // Trust the first proxy in our infrastructure
    app.set('trust proxy', 1);
    
    // Update session security for proxy environment
    sessionConfig.cookie.secure = true;
    sessionConfig.cookie.proxy = true;
    
    debugLog('Proxy trust enabled - Application is running behind a reverse proxy');
} else {
    debugLog('Running in direct connection mode - proxy trust disabled');
}

const redactedConfig = {
    resave: sessionConfig.resave,
    saveUninitialized: sessionConfig.saveUninitialized,
    cookie: {
        secure: sessionConfig.cookie.secure,
        httpOnly: sessionConfig.cookie.httpOnly,
        maxAge: sessionConfig.cookie.maxAge,
        name: sessionConfig.cookie.name
    }
};

// Now we can  log it
debugLog(`Session config: ${JSON.stringify(redactedConfig)}`);

// Apply the session middleware once with our final configuration
app.use(session(sessionConfig));


// Enable compression for all responses
// This makes our game load faster by reducing data transfer sizes
app.use(compression());
debugLog('Response compression enabled');

// Configure static file serving with appropriate caching
// Serve files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.css') || path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=2592000');
        } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.svg')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));

// Serve Bootstrap files from node_modules with same caching strategy
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css'), {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'public, max-age=2592000');
    }
}));

app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'public, max-age=2592000');
    }
}));

debugLog('Static file serving configured with 30-day cache duration');


// Apply session middleware to regular HTTP requests
app.use(sessionMiddleware);

app.use(function(req, res, next) {
	req.startTime = Date.now();
	next();
});

// Initialize WebSocket support with session sharing
app.initializeWebSocket = (server) => {
    // Set up error handling for WebSocket initialization
    try {
        wsHandler(server, sessionMiddleware);
        debugLog('WebSocket server initialized with session support');
    } catch (error) {
        debugErrorLog('Failed to initialize WebSocket server:', error);
        // Throw the error again so the application can handle it appropriately
        throw error;
    }
};


// Define our base URL - for now we'll use the root path
const BASE_URL = process.env.BASE_URL || '/';

// Set up redirection if we're not serving from the root
if (BASE_URL !== '/') {
    app.get('/', (req, res) => {
        debugLog(`Redirecting request from / to ${BASE_URL}`);
        res.redirect(BASE_URL);
    });
}

// Global error handlers for unexpected issues
process.on("unhandledRejection", (reason, promise) => {
    debugErrorLog("Unhandled Promise Rejection:", {
        promise: promise,
        reason: reason,
        stack: reason?.stack || "No stack trace available"
    });
    
    // If we're in development, show more detailed error information
    if (process.env.NODE_ENV === 'development') {
        debugErrorLog('Full error details:', reason);
    }
});

process.on("uncaughtException", (error) => {
    debugErrorLog("Uncaught Exception:", {
        error: error.message,
        stack: error.stack || "No stack trace available"
    });
    
    // In production, we might want to try to gracefully shut down
    if (process.env.NODE_ENV === 'production') {
        // Log the error
        debugErrorLog('Fatal error occurred. Initiating graceful shutdown...');
        
        // Try to close the server gracefully
        if (server) {
            server.close(() => {
                process.exit(1);
            });
            
            // If server hasn't closed in 10 seconds, force exit
            setTimeout(() => {
                process.exit(1);
            }, 10000);
        }
    }
});

// Load guesses and words
async function initializeWordLists() {
    try {
        // Load guesses
        const guessesPath = path.join(__dirname, 'guesses.txt');
        const guessesContent = await fs.promises.readFile(guessesPath, 'utf8');
        global.VALID_GUESSES = guessesContent
            .split('\n')
            .map(word => word.trim().split(/\s+/)[0])
            .filter(word => word.length === 5);

        // Load answers
        const answersPath = path.join(__dirname, 'answers.txt');
        const answersContent = await fs.promises.readFile(answersPath, 'utf8');
        global.VALID_ANSWERS = answersContent
            .split('\n')
            .map(word => word.trim().split(/\s+/)[0])
            .filter(word => word.length === 5);

        debugLog(`Loaded ${VALID_GUESSES.length} guesses and ${VALID_ANSWERS.length} answers`);
    } catch (error) {
        debugErrorLog('Error loading word lists:', error);
        process.exit(1); // Exit if we can't load the words
    }
}


// Application startup sequence
app.onStartup = async () => {
    // Record application start time for uptime tracking
    const appStartTime = new Date().getTime();
    
    // Initialize game essentials
    try {
        // Initialize our word lists 
        await initializeWordLists();
        debugLog('Word lists loaded successfully');
        
        // Log environment information for debugging purposes
        const environmentInfo = {
            environment: app.get('env'),
            nodeVersion: process.version,
            platform: process.platform,
            versions: process.versions,
            startTime: new Date(appStartTime).toISOString()
        };
        
        //debugLog('Environment configuration:', environmentInfo);

        // Set up periodic memory usage monitoring
        // This helps us track the health of our game server
        logMemoryUsage();
        setInterval(logMemoryUsage, 5 * 60 * 1000); // Check every 5 minutes
        
    } catch (error) {
        // If we can't initialize essential components, we shouldn't start the server
        debugErrorLog('Failed to initialize game components:', error);
        process.exit(1);
    }
};

// Helper function to log memory usage
function logMemoryUsage() {
    const usage = process.memoryUsage();
    const formatMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
    
    debugLog('Memory Usage:', {
        heapUsed: formatMB(usage.heapUsed),
        heapTotal: formatMB(usage.heapTotal),
        rss: formatMB(usage.rss),
        external: formatMB(usage.external)
    });
}




app.use((req, res, next) => {
    debugLog(`Request received for ${req.originalUrl}`);
    next(); // Pass control to the next middleware or route handler
});

const setupLocals = require('./middleware/setupLocals');
app.use(setupLocals);

const setupTracking = require('./middleware/setupTracking');
app.use(setupTracking);

app.locals.utils = utils;


const settingsRouter = require('./routes/settings');
app.use('/settings', settingsRouter);


const demoRouter = require('./routes/demoRouter.js');
app.use('/', demoRouter);


const apiRouter = require('./routes/apiRouter.js');
app.use('/', apiRouter);


// Import the error-handling middleware
const { handle404, handleError } = require('./middleware/setupErrorHandling');

// Add the 404 error handler
app.use(handle404);

// Add the generic error handler
app.use(handleError);


// Add helper functions to all views
app.locals.assetUrl = (path) => {
    // Remove leading ./ if present
    path = path.replace(/^\.\//, '');
    return `/${path}`;
};


module.exports = app;
