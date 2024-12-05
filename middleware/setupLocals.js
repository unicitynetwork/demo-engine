// middleware/setupLocals.js
const config = require('../config/default');
const utils = require('../utils/utils');
const { app: debugLog, error: debugErrorLog, game: debugGameLog } = require('../utils/logger');


/**
 * Middleware to set up response locals and handle user settings
 * This makes important data available to our templates and manages user preferences
 */
function setupLocals(req, res, next) {
    // Make session available in templates
    res.locals.session = req.session;
    
    // Initialize user settings if they don't exist
    if (!req.session.userSettings) {
        debugLog('Initializing new user settings');
        req.session.userSettings = {
            // Game specific settings with defaults
            theme: config.displayDefaults.theme,
            difficulty: config.displayDefaults.difficulty,
            // Add other settings as needed
        };

        // Check for existing settings in cookies
        try {
            const cookieSettings = JSON.parse(req.cookies["user-settings"] || "{}");
            // Only apply valid settings from cookies
            Object.entries(cookieSettings).forEach(([key, value]) => {
                if (utils.isValidSetting(key, value)) {
                    req.session.userSettings[key] = value;
                }
            });
        } catch (error) {
            debugErrorLog('Error parsing cookie settings:', error);
        }
    }

    // Make settings available to templates
    res.locals.userSettings = req.session.userSettings;
    
    // Handle flash messages for user feedback
    if (req.session.userMessage) {
        res.locals.userMessage = req.session.userMessage;
        res.locals.userMessageType = req.session.userMessageType || "warning";
        
        // Clear the message after making it available
        req.session.userMessage = null;
        req.session.userMessageType = null;
    }

    // Initialize empty error array for collecting page errors
    res.locals.pageErrors = [];
    
    next();
}

module.exports = setupLocals;