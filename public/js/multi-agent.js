// public/js/multi-agents.js

const canvas = document.getElementById('agentsCanvas');
const container = document.getElementById('agentContainer');
const errorDiv = document.getElementById('error');
const statsDiv = document.getElementById('stats');

function getContainerSize() {
    const rect = container.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
}

function drawAgents(agents) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    agents.forEach(agent => {
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(13, 110, 253, 0.5)'; // Bootstrap primary blue
        ctx.fill();
        ctx.strokeStyle = 'rgba(13, 110, 253, 0.8)';
        ctx.stroke();
    });
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    errorDiv.style.display = 'none';
}

function updateStats(stats) {
    document.getElementById('placedAgents').textContent = 
        `Agents: ${stats.placedAgents} / ${stats.targetCount}`;
    document.getElementById('currentRadius').textContent = 
        `Radius: ${stats.radius}px`;
    document.getElementById('attempts').textContent = 
        `Attempts: ${stats.attempts}`;
    statsDiv.style.display = 'block';
}

async function fetchAgents(width, height) {
    try {
        const response = await fetch(`/api?width=${width}&height=${height}`);
        const data = await response.json();
        
        if (!response.ok) {
            showError(`Error: ${data.error}`);
            return null;
        }
        
        hideError();
        updateStats(data.stats);
        return data.agents;
    } catch (error) {
        showError(`Network error: ${error.message}`);
        return null;
    }
}

async function initCanvas() {
    const size = getContainerSize();
    canvas.width = size.width;
    canvas.height = size.height;
    
    const agents = await fetchAgents(size.width, size.height);
    if (agents) {
        drawAgents(agents);
    }
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initCanvas, 250);
});

// Initialize when the page loads
initCanvas();