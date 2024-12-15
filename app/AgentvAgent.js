const { app: debugLog, error: debugErrorLog, game: debugGameLog } = require('../utils/logger');
const { parentPort, workerData } = require('worker_threads');
const WorkerPool = require('./WorkerPool');

class AgentvAgentGame {
    constructor(NoAgents) {
        console.log(`Initializing game with ${NoAgents} agents`);
        this.workerPool = new WorkerPool();
        this.balances = new Map();
        this.initializeAgents(NoAgents);
    }

    async initializeAgents(count) {
        for (let i = 1; i <= count; i++) {
            this.balances.set(`Agent${i}`, 100);
        }
        this.workerPool.assignAgents(count);
    }

    async playRound() {
        const correctAnswer = Math.random() < 0.5 ? 'heads' : 'tails';
        console.log(`\nCoin flip result: ${correctAnswer}`);

        try {
            const guesses = await this.workerPool.getGuesses();
            console.log(`Processing ${guesses.length} guesses`);

            guesses.forEach(({ agentId, guess }) => {
                const currentBalance = this.balances.get(agentId);
                const newBalance = guess === correctAnswer ? 
                    currentBalance + 10 : 
                    currentBalance - 10;
                
                this.balances.set(agentId, newBalance);
                //console.log(`${agentId} guessed ${guess} - New balance: ${newBalance}`);
            });
        } catch (error) {
            console.error('Error in playRound:', error);
            throw error;
        }
    }

    async cleanup() {
        await this.workerPool.cleanup();
    }

    getBalances() {
        return Object.fromEntries(this.balances);
    }

    heavyComputation(iterations) {
        let result = 0;
        for (let i = 0; i < iterations; i++) {
            result += Math.sin(i) * Math.cos(i);
        }
        return result;
    }
}

class SingleThreadGame {
    constructor(NoAgents) {
        this.balances = new Map();
        // Initialize all agents with starting balance
        for (let i = 1; i <= NoAgents; i++) {
            this.balances.set(`Agent${i}`, 100);
        }
    }

    async playRound() {  // Make it async to match interface
        const correctAnswer = Math.random() < 0.5 ? 'heads' : 'tails';
        //console.log(`\nCoin flip result: ${correctAnswer}`);

        for (const [agentId, balance] of this.balances) {
  //          this.heavyComputation(1000000*0+100000); 
            const guess = Math.random() < 0.5 ? 'heads' : 'tails';
            const newBalance = guess === correctAnswer ? balance + 10 : balance - 10;
            this.balances.set(agentId, newBalance);
            //console.log(`${agentId} guessed ${guess} - New balance: ${newBalance}`);
        }
    }

    heavyComputation(iterations) {
        let result = 0;
        for (let i = 0; i < iterations; i++) {
            result += Math.sin(i) * Math.cos(i);
        }
        return result;
    }

    async cleanup() {  // Add empty cleanup method
        // Nothing to clean up in single thread version
        return Promise.resolve();
    }

    getBalances() {
        return Object.fromEntries(this.balances);
    }
}


module.exports = {
    SingleThreadGame,
    AgentvAgentGame
};