// websocket-manager.js

class WebSocketManager {

    constructor() {
        this.socket = null;
        const host = window.location.hostname;
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const port = host === 'localhost' ? ':3000' : '';
        
        this.baseUrl = `${protocol}//${host}:${port}/demos`;
    }

    showMessage(title, message) {
        const modalElement = document.getElementById('messageModal');
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }

        const modal = new bootstrap.Modal(modalElement, {
            keyboard: true,
            backdrop: 'static'
        });

        modalElement.querySelector('.modal-title').textContent = title;
        modalElement.querySelector('.modal-body').innerHTML = message;

        modal.show();
    }


    connect() {
        try {

            this.socket = new WebSocket(this.baseUrl);

            console.log('Attempting connection to:', this.baseUrl);

            this.socket.addEventListener('open', () => {
                console.log('Connected to WebSocket server');
            });

            this.socket.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
                this.showMessage('Error', 'Connection to the server lost. Please refresh the page.');
            });

            this.socket.addEventListener('close', () => {
                console.log('WebSocket connection closed');
                showMessage('Error', 'Connection closed. Please try again later.');
            });

            return this.socket;
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.showMessage('Error', 'Failed to connect to server.');
            return null;
        }
    }
}


window.WebSocketManager = WebSocketManager;