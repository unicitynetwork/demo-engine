// websocket-manager.js
class WebSocketManager {
    connect() {
        const wsUrl = window.location.protocol === "https:" 
            ? 'wss://demos.unicity-labs.com'
            : 'ws://localhost:3000';

        this.socket = new WebSocket(wsUrl);

        // Move the existing event listeners here
        this.socket.addEventListener('open', () => {
            console.log('Connected to WebSocket server');
        });

        this.socket.addEventListener('error', () => {
            showMessage('Error', 'Connection to the server lost. Please refresh the page.');
        });

        this.socket.addEventListener('close', () => {
            showMessage('Error', 'Connection closed. Please try again later.');
        });

        return this.socket;
    }
}