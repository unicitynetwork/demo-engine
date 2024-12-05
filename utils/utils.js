const { app: debugLog, error: debugErrorLog, game: debugGameLog } = require('../utils/logger');


const utils = {
    /**
     * Format a timestamp in a consistent way across the application
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatTimestamp(date) {
        return date.toISOString();
    },

    /**
     * Log memory usage statistics for monitoring application health
     */
    logMemoryUsage() {
        const used = process.memoryUsage();
        debugLog('Memory Usage:', {
            heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
            heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
            rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`
        });
    },

        /**
     * Convert potentially dangerous characters to their HTML entity equivalents
     * This helps prevent XSS attacks when displaying user input
     * While not needed for basic word validation, this utility becomes valuable
     * if we expand the game to include features like chat or custom usernames
     * 
     * @param {string|any} text - The input to sanitize
     * @returns {string} Sanitized text safe for HTML display
     */
    sanitize(text) {
        // Handle non-string input by converting to string
        if (typeof text !== 'string') {
            text = String(text);
        }
        
        // Return empty string for null/undefined input
        if (!text) {
            return '';
        }

        // Replace potentially harmful characters with HTML entities
        return text.replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    },

    /**
     * Check if a value is a valid game setting
     * @param {string} key - The setting key to validate
     * @param {any} value - The value to validate
     * @returns {boolean} Whether the value is valid for that setting
     */
    isValidSetting(key, value) {
        const validSettings = {
            theme: ['light', 'dark'],
            difficulty: ['normal', 'hard'],
            // Add other valid settings as needed
        };
        return validSettings[key]?.includes(value) ?? false;
    }
};


module.exports = utils;