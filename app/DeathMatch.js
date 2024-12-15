const { app: debugLog, error: debugErrorLog, game: debugGameLog } = require('../utils/logger');
const { parentPort, workerData } = require('worker_threads');
const WorkerPool = require('./WorkerPool');
const DM_CONFIG = require('../config/gameConfig');

class DeathMatch {
    constructor() {
        if (DM_CONFIG.NO_AGENTS % 2 !== 0) {
            throw new Error('Number of agents must be even');
        }
        debugLog(`Initializing game with ${DM_CONFIG.NO_AGENTS} agents`);
        this.workerPool = new WorkerPool();
        this.balances = new Map();
        this.currentPairs = new Map(); // Track current pairings
        this.paymentRecords = [];
        this.noAgents = DM_CONFIG.NO_AGENTS;
        this.initializeAgents(DM_CONFIG.NO_AGENTS);
    }

    canPlay(agentId) {
        return (this.balances.get(agentId) || 0) > 0;
    }

    async initializeAgents(count) {
        for (let i = 1; i <= count; i++) {
            this.balances.set(`Agent${i}`, DM_CONFIG.INITIAL_BALANCE);
        }
        this.workerPool.assignAgents(count);
    }

    createPairings() {
        // Get all agents that can play
        const activePlayers = Array.from(this.balances.keys())
            .filter(agentId => this.canPlay(agentId));
    
        // Clear previous pairings
        this.currentPairs.clear();
    
        // Shuffle array
        for (let i = activePlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [activePlayers[i], activePlayers[j]] = [activePlayers[j], activePlayers[i]];
        }
    
        // Create pairs (if odd number, last agent sits out)
        for (let i = 0; i < activePlayers.length - 1; i += 2) {
            this.currentPairs.set(activePlayers[i], activePlayers[i + 1]);
            this.currentPairs.set(activePlayers[i + 1], activePlayers[i]);
        }
    }

    async playRound() {

        // Create new random pairings at the start of each round
        // Only pair agents that can play (balance > 0)
        this.paymentRecords = [];
        this.createPairings();


        try {
            // Get all guesses
            const guesses = await this.workerPool.getGuesses();
            console.log(`Processing ${guesses.length} guesses`);

            // Process each pair only once
            const processedAgents = new Set();

            debugLog(`Processing ${this.currentPairs.size} pairs`);

            for (let [agent1, agent2] of this.currentPairs.entries()) {
                // Skip if we've already processed this pair
                if (processedAgents.has(agent1)) continue;

                // Skip if either agent has zero balance
                if (!this.canPlay(agent1) || !this.canPlay(agent2)) {
                    continue;
                }

                const agent1Choice = guesses.find(g => g.agentId === agent1)?.guess;
                const agent2Guess = guesses.find(g => g.agentId === agent2)?.guess;

                if (agent1Choice && agent2Guess) {
                    //debugLog(`Match ${agent1} choice: ${agent1Choice}, ${agent2} guess: ${agent2Guess}`);
    
                    // If Agent2 guessed Agent1's choice correctly, Agent2 wins
                    if (agent2Guess === agent1Choice) {
                        this.updateBalance(agent2, true);   // winner
                        this.updateBalance(agent1, false);  // loser
                        this.recordPayment(agent1, agent2); // payment
                        //debugLog(`${agent2} wins by guessing correctly`);
                    } else {
                        // If Agent2 guessed wrong, Agent1 wins
                        this.updateBalance(agent1, true);   // winner
                        this.updateBalance(agent2, false);  // loser
                        this.recordPayment(agent2, agent1); // payment
                       // debugLog(`${agent1} wins as ${agent2} guessed wrong`);
                    }
                }

                // Mark both agents as processed
                processedAgents.add(agent1);
                processedAgents.add(agent2);
            }
        } catch (error) {
            console.error('Error in playRound:', error);
            throw error;
        }
    }

    
    recordPayment(fromAgent, toAgent) {
        this.paymentRecords.push({
            from: fromAgent,
            to: toAgent,
            amount: DM_CONFIG.PAYMENT_AMOUNT
        });
    }

    getBalances() {
        return {
            balances: Array.from(this.balances.entries())
                .map(([agentId, balance]) => ({
                    agentId,
                    balance,
                    opponent: this.currentPairs.get(agentId)
                })),
            payments: this.paymentRecords
        };
    }

    updateBalance(agentId, isWinner) {
        const currentBalance = this.balances.get(agentId) || 0;
        const paymentAmount = DM_CONFIG.PAYMENT_AMOUNT;

        if (isWinner) {
            this.balances.set(agentId, currentBalance + paymentAmount);
        } else {
            // Ensure balance doesn't go below 0
            this.balances.set(agentId, Math.max(0, currentBalance - paymentAmount));
        }
    }
}


module.exports = {
    DeathMatch
};