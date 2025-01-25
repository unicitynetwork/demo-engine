const { parentPort } = require('worker_threads');

class Agent {
    constructor(id, startingBalance) {
        this.id = id;
        this.balance = startingBalance;
    }

    makeGuess() {
        //this.heavyComputation(1000000*0+1000000); 
        return Math.random() < 0.5 ? 'heads' : 'tails';
    }

    heavyComputation(iterations) {
        let result = 0;
        for (let i = 0; i < iterations; i++) {
            result += Math.sin(i) * Math.cos(i);
        }
        return result;
    }
}

if (parentPort) {
    const agents = new Map();

    parentPort.on('message', async (message) => {
        switch (message.type) {
            case 'init':
                // Initialize multiple agents in this worker
                message.agents.forEach(agent => {
                    agents.set(agent.id, new Agent(agent.id, agent.startingBalance));
                });
                parentPort.postMessage({ type: 'ready' });
                break;

            case 'makeGuesses':
                // Get guesses from all agents in this worker
                const guesses = Array.from(agents.values()).map(agent => ({
                    agentId: agent.id,
                    guess: agent.makeGuess()
                }));
                parentPort.postMessage({ type: 'guesses', guesses });
                break;
        }
    });
}

module.exports = Agent;