const { app: debugLog, error: debugErrorLog, game: debugGameLog } = require('../utils/logger');
const { DeathMatch } = require("../app/DeathMatch");
const DEATHMATCH_CONFIG = require('../config/gameConfig');
const WebSocket = require('ws');
const DM_CONFIG = require('../config/gameConfig');
  

class DeathMatchServer {
    constructor() {
        this.connections = new Map(); // sessionId -> websocket
        this.games = new Map();       // sessionId -> game instance
        this.gameLoops = new Map();   // sessionId -> interval id
    }

    addConnection(sessionId, ws) {
        debugLog(`Adding DeathMatch connection for session: ${sessionId}`);
        this.connections.set(sessionId, ws);

       // debugLog('DeathMatch class:', DeathMatch);
        
        // Initialize new game for this session
        const game = new DeathMatch(DM_CONFIG.NO_AGENTS); 
        this.games.set(sessionId, game);
    }

    removeConnection(sessionId) {
        debugLog(`Removing DeathMatch connection for session: ${sessionId}`);
        this.connections.delete(sessionId);
        this.games.delete(sessionId);
        
        // Clear the game loop if it exists
        if (this.gameLoops.has(sessionId)) {
            clearInterval(this.gameLoops.get(sessionId));
            this.gameLoops.delete(sessionId);
        }
    }

    startGameLoop(sessionId) {
        const ws = this.connections.get(sessionId);
        const game = this.games.get(sessionId);
        
        if (!ws || !game) {
            debugErrorLog(`Cannot start game loop - missing ws or game for session ${sessionId}`);
            return;
        }
    
        let roundCount = 0;
    
        // Function to play a round and send the game state
        const playAndSendUpdate = async () => {
            try {
                roundCount++;
    
                // Play a round
                await game.playRound();
    
                // Get current game state
                const gameState = {
                    type: 'game_update',
                    round: roundCount,
                    agents: game.getBalances(),
                    timestamp: Date.now()
                };
    
                // Send update to client
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(gameState));
                }
    
                // End game after a certain number of rounds (if applicable)
                if (roundCount >= DEATHMATCH_CONFIG.NO_ROUNDS) {
                    this.endGame(sessionId);
                }
            } catch (error) {
                debugErrorLog(`Error in game loop for session ${sessionId}:`, error);
                this.endGame(sessionId);
            }
        };
    
        // Play the first round immediately
        playAndSendUpdate();
    
        // Schedule subsequent rounds every 5 seconds
        const loopId = setInterval(playAndSendUpdate, DM_CONFIG.ROUND_INTERVAL);    
        this.gameLoops.set(sessionId, loopId);
    }


    endGame(sessionId) {
        const ws = this.connections.get(sessionId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'game_end',
                message: 'Game completed'
            }));
        }
        
        // Clear the game loop
        if (this.gameLoops.has(sessionId)) {
            clearInterval(this.gameLoops.get(sessionId));
            this.gameLoops.delete(sessionId);
        }
    }

    handleMessage(sessionId, message) {
        const ws = this.connections.get(sessionId);
        if (!ws) return;

        switch (message.type) {
            case 'start_game':
                this.startGameLoop(sessionId);
                break;
                
            case 'end_game':
                this.endGame(sessionId);
                break;
                
            default:
                debugLog(`Unknown message type for DeathMatch: ${message.type}`);
        }
    }
}

// Export singleton instance
module.exports = new DeathMatchServer();