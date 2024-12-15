// workerPool.js
const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');

class WorkerPool {
    constructor(numWorkers = os.cpus().length) {
        console.log(`Creating worker pool with ${numWorkers} workers`);
        this.workers = [];
        
        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker(path.join(__dirname, 'gameWorker.js'));
            this.workers.push({
                worker,
                agentIds: []
            });

            // Add error handling
            worker.on('error', error => {
                console.error(`Worker ${i} error:`, error);
            });

            worker.on('exit', code => {
                if (code !== 0) {
                    console.error(`Worker ${i} exited with code ${code}`);
                }
            });
        }
    }

    assignAgents(totalAgents) {
        console.log(`Assigning ${totalAgents} agents to ${this.workers.length} workers`);
        const agentsPerWorker = Math.ceil(totalAgents / this.workers.length);
        let agentIndex = 0;

        for (let workerData of this.workers) {
            const agentIds = [];
            for (let i = 0; i < agentsPerWorker && agentIndex < totalAgents; i++) {
                agentIds.push(`Agent${agentIndex + 1}`);
                agentIndex++;
            }
            workerData.agentIds = agentIds;
            //console.log(`Assigning agents ${agentIds.join(', ')} to worker`);
            workerData.worker.postMessage({ 
                type: 'init', 
                agents: agentIds.map(id => ({
                    id,
                    startingBalance: 100
                }))
            });
        }
    }

    async getGuesses() {
        console.log('Requesting guesses from all workers');
        try {
            const results = await Promise.all(
                this.workers.map(({ worker, agentIds }) => {
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Worker timeout'));
                        }, 50000); // 5 second timeout

                        worker.on('message', (message) => {
                            if (message.type === 'guesses') {
                                clearTimeout(timeout);
                                resolve(message.guesses);
                            }
                        });

                        worker.postMessage({ type: 'makeGuesses' });
                    });
                })
            );

            const allGuesses = results.flat();
            console.log(`Received ${allGuesses.length} guesses`);
            return allGuesses;
        } catch (error) {
            console.error('Error getting guesses:', error);
            throw error;
        }
    }

    async cleanup() {
        console.log('Cleaning up worker pool');
        await Promise.all(
            this.workers.map(({ worker }) => worker.terminate())
        );
    }
}


module.exports = WorkerPool;