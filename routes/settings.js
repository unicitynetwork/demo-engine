// routes/settings.js
const express = require('express');
const router = express.Router();
const { app: debugLog } = require('../utils/logger');

// settings.js - Update the routes to send JSON response instead of redirecting
router.get('/dismiss', (req, res) => {
    const { key } = req.query;
    if (key) {
        debugLog(`User dismissed alert: ${key}`);
        req.session.userSettings = req.session.userSettings || {};
        req.session.userSettings[key] = true;
        res.json({ success: true });  // Send JSON response instead of redirecting
    } else {
        res.status(400).json({ success: false, error: 'No key provided' });
    }
});

router.get('/restore', (req, res) => {
    const { key } = req.query;
    if (key) {
        debugLog(`User restored alert: ${key}`);
        req.session.userSettings = req.session.userSettings || {};
        delete req.session.userSettings[key];
        res.json({ success: true });  // Send JSON response instead of redirecting
    } else {
        res.status(400).json({ success: false, error: 'No key provided' });
    }
});

module.exports = router;  