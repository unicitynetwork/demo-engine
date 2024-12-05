const express = require('express');
const { router: debugLog, error: debugErrorLog } = require('../utils/logger');

const router = express.Router();

router.get("/spgame", (req, res) => {
    debugLog('Loading speed wordle game');
    res.render("spgame");
});

router.get("/", (req, res) => {
    debugLog('Rendering home page');
    res.render("index");
});

router.get("/speedwordlecontest", (req, res) => {
    debugLog('Loading contest page');
    res.render("speedwordlecontest");
});


module.exports = router;  