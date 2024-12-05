// routes/settings.js
const express = require('express');
const router = express.Router();
const { app: debugLog } = require('../utils/logger');

// Handle dismissing an alert
router.get('/dismiss', (req, res) => {
    const { key } = req.query;
    if (key) {
        debugLog(`User dismissed alert: ${key}`);
        req.session.userSettings = req.session.userSettings || {};
        req.session.userSettings[key] = true;
    }
    res.redirect('back');
});

// Handle restoring (un-dismissing) an alert
router.get('/restore', (req, res) => {
    const { key } = req.query;
    if (key) {
        debugLog(`User restored alert: ${key}`);
        req.session.userSettings = req.session.userSettings || {};
        delete req.session.userSettings[key];
    }
    res.redirect('back');
});

module.exports = router;