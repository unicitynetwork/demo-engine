// websocket-manager.js
const { app: debugLog, error: debugErrorLog, game: debugGameLog } = require('../utils/logger');

class WebSocketManager {
    connect() {
        const host = window.location.hostname;
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const port = process.env.PORT || 3000;
        const wsPath = "/demos";  

        const wsUrl = `${protocol}//${host}:${port}${wsPath}`;

        this.socket = new WebSocket(wsUrl);

        debugLog('Connecting to WebSocket:', wsUrl);

        // Move the existing event listeners here
        this.socket.addEventListener('open', () => {
            console.log('Connected to WebSocket server');
        });

        this.socket.addEventListener('error', () => {
            console.error('WebSocket error:', error);
            showMessage('Error', 'Connection to the server lost. Please refresh the page.');
        });

        this.socket.addEventListener('close', () => {
            console.log('WebSocket connection closed');
            showMessage('Error', 'Connection closed. Please try again later.');
        });

        return this.socket;
    }
}