// middleware/setupLocals.js


const { app: debugLog, error: debugErrorLog, game: debugGameLog } = require('../utils/logger');
const config = require('../config/default');
const utils = require('../utils/utils');

function setupTracking(req, res, next) { 
	var time = Date.now() - req.startTime;
	var userAgent = req.headers['user-agent'];
	let ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();

	debugLog(`Finished action '${req.path}' (${res.statusCode}) in ${time}ms for UA '${userAgent}', ip=${ip}`);
	
	if (!res.headersSent) {
		next();
	}
}


module.exports = setupTracking;