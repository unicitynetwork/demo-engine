// Game state management
const gameState = {
    agents: window.GAME_CONFIG.initialAgents,
    width: window.GAME_CONFIG.gameState.width,
    height: window.GAME_CONFIG.gameState.height,
    isRunning: false,
    round: 0
};

// Store initial agent positions in a Map for quick lookup
const agentPositions = new Map(
    window.GAME_CONFIG.initialAgents.map(agent => [
        agent.id, 
        { x: agent.x, y: agent.y, radius: agent.radius }
    ])
);


class DeathMatchVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas dimensions from game config
        this.canvas.width = window.GAME_CONFIG.gameState.width;
        this.canvas.height = window.GAME_CONFIG.gameState.height;
        
        this.socket = null;
        this.particles = []; // Array to store active particles
        
        // Do initial render of agents
        this.render();
        
        this.setupEventListeners();
        
        console.log('Canvas setup:', {
            width: this.canvas.width,
            height: this.canvas.height,
            agents: gameState.agents
        });
    }

    setupEventListeners() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
    }

    startGame() {
        if (this.isRunning) return;
        
        const button = document.getElementById('startGame');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        // Show loading state
        button.disabled = true;
        loadingOverlay.classList.remove('d-none');

        // Initialize WebSocket connection using the main WebSocket endpoint
        this.socket = new WebSocket(`ws://${window.location.host}`);
        
        this.socket.onopen = () => {
            this.socket.send(JSON.stringify({
                type: 'start_game',
                gameType: 'deathmatch'
            }));

            gameState.isRunning = true;
            button.textContent = 'Game Running';
            loadingOverlay.classList.add('d-none');

            // Start the animation loop
            this.startAnimationLoop();
        };

        this.socket.onmessage = (event) => {
            const update = JSON.parse(event.data);
            this.handleGameUpdate(update);
        };

        this.socket.onclose = (event) => {
            console.log(`[DEBUG] WebSocket closed: ${event.code}, ${event.reason}`);
            this.handleGameEnd();
        };

        this.socket.onerror = (error) => {
            console.error('[ERROR] WebSocket encountered an error:', error);
            this.handleGameEnd();
        };
    }

    handleGameUpdate(update) {
        try {
            //console.log(`[DEBUG] Received update: ${JSON.stringify(update)}`);
    
            // Check the type of update
            if (update.type === 'leaderboard_update') {
                console.log('[DEBUG] Ignoring leaderboard update.');
                // Ignore leaderboard updates for now
                return;
            }
    
            if (update.type === 'game_update') {
                console.log('[DEBUG] Processing game update.');
    
                // Update game state
                //console.log(`[DEBUG] Updating game state. Current round: ${gameState.round}, New round: ${update.round}`);
                //console.log(`[DEBUG] Current agents: ${JSON.stringify(gameState.agents)}, New agents: ${JSON.stringify(update.agents)}`);
                
                // Access the balances array from the agents object
                const agentsData = update.agents.balances;

                console.log('[DEBUG] size of agentsData:', agentsData.length);

                // Merge server updates with stored positions
                gameState.agents = agentsData.map(agent => ({
                    ...agent,
                    ...agentPositions.get(agent.agentId)  // Merge with stored coordinates
                }));
                gameState.round = update.round;


                // Spawn particles for payments
                //console.log('[DEBUG] Spawning particles for payments.');
                console.log('[DEBUG] size of update.agents.payments:', update.agents.payments.length);
                update.agents.payments.forEach(payment => {
                    // No need to add 'Agent' prefix if it's already there
                    const fromId = payment.from.startsWith('Agent') ? payment.from : `Agent${payment.from}`;
                    const toId = payment.to.startsWith('Agent') ? payment.to : `Agent${payment.to}`;
                    
                    const loserPos = agentPositions.get(fromId);
                    const winnerPos = agentPositions.get(toId);
                    
                    if (loserPos && winnerPos) {
                        this.spawnParticle(loserPos, winnerPos);
                    } else {
                        console.log('[DEBUG] Available agent IDs:', Array.from(agentPositions.keys()));
                        console.warn(`[WARNING] Unable to spawn particle for payment from ${fromId} to ${toId}. Positions not found.`);
                    }
                });
    
                // Update UI
                console.log('[DEBUG] Updating stats and rendering UI.');
                this.updateStats(update);
                this.render();
    
                console.log('[DEBUG] Game update processed successfully.');
            } else if (update.type === 'game_end') {
                console.log('[DEBUG] Game end received.');
                this.handleGameEnd();
            } else {
                console.warn(`[WARNING] Unhandled update type: ${update.type}`);
            }
        } catch (error) {
            console.error('[ERROR] Failed to process game update:', error);
        }
    }

    spawnParticle(fromAgent, toAgent) {
        const dx = toAgent.x - fromAgent.x;
        const dy = toAgent.y - fromAgent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 5; // Adjust speed as needed

        fromAgent.isMoving = true;

        this.particles.push({
            x: fromAgent.x,
            y: fromAgent.y,
            tx: toAgent.x,
            ty: toAgent.y,
            vx: (dx / distance) * speed,
            vy: (dy / distance) * speed,
            size: 2,
            color: 'red',
            onArrival: () => {
                fromAgent.isMoving = false;
            }
        });

        //console.log(`[DEBUG] Spawned particle from (${fromAgent.x}, ${fromAgent.y}) to (${toAgent.x}, ${toAgent.y})`);
    }

    updateParticles() {
        // Apply ghosting effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Semi-transparent black
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
        // Redraw agents after ghosting effect
        gameState.agents.forEach(agent => this.drawAgent(agent));
    
        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
    
            const reachedTarget =
                Math.abs(particle.x - particle.tx) < 5 &&
                Math.abs(particle.y - particle.ty) < 5;
    
            if (reachedTarget) {
                if (particle.onArrival) {
                    particle.onArrival();
                }
                return false; // Remove particle
            }
    
            // Draw the particle
            this.ctx.beginPath();

            //main particle
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            //this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // Bright gold color
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();

                    // Glow effect
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );

            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
    
            return true; // Keep particle
        });
    }

    handleGameEnd() {
        console.log('[DEBUG] Handling game end.');
        gameState.isRunning = false;
    
        const button = document.getElementById('startGame');
        button.textContent = 'Start Game';
        button.disabled = false;
    
        // Close WebSocket if it's still open
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            console.log('[DEBUG] Closing WebSocket connection.');
            this.socket.close();
        }
    }

    updateStats(update) {
        document.getElementById('roundCounter').textContent = update.round;
        
        // Calculate and update balances from the balances array
        const balances = update.agents.balances.map(agent => agent.balance);
        const maxBalance = Math.max(...balances);
        const minBalance = Math.min(...balances);
        const numActive = update.agents.balances.length;
    
        // Update stats badges
        document.getElementById('roundCounter').textContent = update.round;
        document.getElementById('activeAgents').textContent = numActive;
        document.getElementById('highestBalance').textContent = maxBalance;
        document.getElementById('lowestBalance').textContent = minBalance;
    }

    render(){

        //console.log('[DEBUG] Rendering frame.');
        // Apply ghosting effect instead of clear
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw pairing lines first (in background)
        if (gameState.agents) {
            gameState.agents.forEach(agent => this.drawAgent(agent));
        }

        this.updateParticles();
    }
        
    drawAgent(agent) {
        if (!agent.x || !agent.y || !agent.radius) {
            console.warn(`[WARNING] Invalid agent data: ${JSON.stringify(agent)}`);
            return;
        }
    
        this.ctx.beginPath();
        
        // Dynamic radius based on balance
        const minRadius = agent.radius;
        const maxRadius = minRadius * 2;  // Can grow up to 3x original size
        const balanceRatio = (Math.max(agent.balance,0) - 0) / (200 - 0);
        const dynamicRadius = minRadius + (balanceRatio * (maxRadius - minRadius));
        
        this.ctx.arc(agent.x, agent.y, dynamicRadius, 0, Math.PI * 2);
        
        // Color based on balance (kept the same)
        //const hue = balanceRatio * 120; // 0 is red, 120 is green
        //this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

        // Bootstrap primary blue color with opacity based on balance
         this.ctx.fillStyle = `rgba(13, 110, 253, ${0.3 + (balanceRatio * 0.7)})`; // Bootstrap primary color
    
        this.ctx.fill();
        this.ctx.closePath();
        
        //console.log(`[DEBUG] Drew agent at (${agent.x}, ${agent.y}) with radius ${dynamicRadius} and color ${this.ctx.fillStyle}`);
    }

    startAnimationLoop() {
        const animate = () => {
            this.render();
            requestAnimationFrame(animate); // Continue the loop
        };
    
        requestAnimationFrame(animate); // Start the loop
    }
}



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameVisualizer = new DeathMatchVisualizer('game-canvas');
});