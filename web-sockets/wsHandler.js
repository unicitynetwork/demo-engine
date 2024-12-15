const WebSocket = require('ws');
const PlayervModelServer = require('./PlayervModelServer');
const SpeedWordleContestServer = require('./SpeedWordleContestServer');
const DeathMatchServer = require('./DeathMatchServer');
const leaderboardManager = require('../app/leaderboard');  
const { app: debugLog, error: debugErrorLog, game: debugGameLog } = require('../utils/logger');


function initializeWebSockets(server, sessionMiddleware) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', function connection(ws, req) {

        // Set up ping interval
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
                // Set a timeout to check if we get a pong back
                const timeout = setTimeout(() => {
                    ws.terminate();
                }, 30000); // 30 seconds timeout

                // Store the timeout in the ws object so we can clear it
                ws._pingTimeout = timeout;
            }
        }, 25000); // Ping every 25 seconds

        // Handle pong responses
        ws.on('pong', () => {
            // Clear the timeout when we get a pong back
            if (ws._pingTimeout) {
                clearTimeout(ws._pingTimeout);
            }
        });

        // Use sessionMiddleware to parse session before accessing it
        sessionMiddleware(req, {}, () => {
            if (!req.session || !req.session.id) {
                debugErrorLog('No session ID found, closing WebSocket connection');
                ws.close();
                return;
            }

            const sessionId = req.session.id;
            debugLog(`WebSocket connection established with sessionId: ${sessionId}`);

            // Send initial leaderboard request
            ws.send(JSON.stringify({
                type: 'leaderboard_update',
                leaderboard: leaderboardManager.getLeaderboard()
            }));

            let activeServer = null;

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);                  
                    if (data.type === 'start_game') {
                        // Clean up previous game if exists
                        if (activeServer) {
                            activeServer.removeConnection(sessionId);
                        }
                        // Select server based on game type
                        switch (data.gameType) {
                            case 'playervModel':
                                activeServer = PlayervModelServer;
                                break;
                            case 'speedWordleContest':
                                activeServer = SpeedWordleContestServer;
                                break;
                            case 'deathmatch':  // Add DeathMatch case
                                activeServer = DeathMatchServer;
                                break;
                            default:
                                console.warn('Unknown game type:', data.gameType);
                                return;
                        }

                        activeServer.addConnection(sessionId, ws);
                        activeServer.handleMessage(sessionId, data);
                        return;
                    }

                    if (!activeServer) {
                        console.warn('No game started yet');
                        return;
                    }

                    activeServer.handleMessage(sessionId, data);
                } catch (error) {
                    debugErrorLog('Error processing message:', error);
                }
            });
            ws.on('close', () => {
                // Clean up ping interval when connection closes
                clearInterval(pingInterval);
                if (ws._pingTimeout) {
                    clearTimeout(ws._pingTimeout);
                }
                if (activeServer) {
                    activeServer.removeConnection(sessionId);
                }
            });
        });
    });
    return wss;
}

module.exports = initializeWebSockets; 