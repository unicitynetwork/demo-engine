const express = require('express');
const { router: debugLog, error: debugErrorLog } = require('../utils/logger');
const { SingleThreadGame, AgentvAgentGame } = require('../app/AgentvAgent');
const { validateSpace, generateRandomPoints } = require('../utils/poisson');
const { DeathMarch } = require('../app/DeathMatch');
const { validateOrConvert, calculatePointer, generateRandom256BitHex } = require('@unicitylabs/tx-flow-engine');
const DM_CONFIG = require('../config/gameConfig');

const router = express.Router();

const refereeSecret = 'referee-secret';

const tokenClass = validateOrConvert('token_class', 'unicity_test_coin');
let nonces = [];

router.get("/spgame", async (req, res) => {
    debugLog('Loading speed wordle game');
    const nonce = generateRandom256BitHex();
    nonces.push(nonce);
//    const refereePointer = await calculatePointer({token_class_id: tokenClass, sign_alg: 'secp256k1', hash_alg: 'sha256',
//	refereeSecret, nonce});
    res.render("spgame");
});


router.get("/demos", (req, res) => {
    debugLog('Rendering demo page');
    res.render("demos");
});

router.get("/whitepaper", (req, res) => {
    debugLog('Rendering whitepaper');
    res.render("whitepaper");
});

router.get("/", (req, res) => {
    debugLog('Rendering home page');
    res.render("index");
});

router.get("/unichat", (req, res) => {
    debugLog('Loading Unichat P2P Group Chat');
    res.render("unichat");
});

router.get("/speedwordlecontest", (req, res) => {
    debugLog('Loading contest page');
    res.render("speedwordlecontest");
});

router.get("/uniroad", (req, res) => {
    debugLog('Loading Uniroad');
    res.render("uniroad");
});

router.get("/soccerbet", (req, res) => {
    debugLog('Loading Soccer Betting page');
    res.render("soccerbet");
});

router.get("/esports", (req, res) => {
    debugLog('Loading eSports Platform page');
    res.render("esports");
});

router.get("/cricket", (req, res) => {
    debugLog('Loading Cricket Betting page');
    res.render("cricket");
});

router.get("/dex", (req, res) => {
    debugLog('Loading Decentralized Exchange page');
    res.render("dex");
});

router.get("/clob", (req, res) => {
    debugLog('Loading Central Limit Order Book page');
    res.render("clob");
});

router.get("/spacemarkets", (req, res) => {
    debugLog('Loading Satellite Spectrum Auction page');
    res.render("spacemarkets");
});

router.get("/medicalresearch", (req, res) => {
    debugLog('Loading Medical Research page');
    res.render("medicalresearch");
});

router.get("/poker", (req, res) => {
    debugLog('Loading Poker page');
    res.render("poker");
});

router.get("/building-permit", (req, res) => {
    debugLog('Loading Building Permit page');
    res.render("building-permit");
});

router.get("/unidex", (req, res) => {
    debugLog('Loading contest page');
    res.render("comingsoon");
});

router.get("/dating", (req, res) => {
    debugLog('Loading dating page');
    res.render("dating");
});

router.get("/sendmoneyhome", (req, res) => {
    debugLog('Loading Send Money Home page');
    res.render("sendmoneyhome");
});

router.get("/flightagent", (req, res) => {
    debugLog('Loading Flight Agent page');
    res.render("flightagent");
});

router.get("/unisign", (req, res) => {
    debugLog('Loading UniSign Demo page');
    res.render("unisign");
});

router.get("/contractagent", (req, res) => {
    debugLog('Loading ContractAgent Demo page');
    res.render("contractagent");
});

router.get("/unichat", (req, res) => {
    debugLog('Loading Unichat P2P Group Chat');
    res.render("unichat");
});

async function runGame(game, numRounds) {
    const startTime = process.hrtime();
    const memBefore = process.memoryUsage();
    
    const stats = {
        rounds: [],
        finalBalances: {},
        performance: {
            executionTime: 0,
            memoryUsed: 0,
            avgRoundTime: 0
        }
    };

    try {
        for (let i = 0; i < numRounds; i++) {
            const roundStart = process.hrtime();
            await game.playRound();  // All calls are async now
            
            const roundEnd = process.hrtime(roundStart);
            const roundTime = roundEnd[0] * 1000 + roundEnd[1] / 1000000;
            
            stats.rounds.push({
                roundNumber: i + 1,
                executionTime: roundTime
            });
        }

        stats.finalBalances = game.getBalances();
        
        const endTime = process.hrtime(startTime);
        const executionTime = endTime[0] * 1000 + endTime[1] / 1000000;
        
        const memAfter = process.memoryUsage();
        const memoryUsed = {
            heapUsed: memAfter.heapUsed - memBefore.heapUsed,
            external: memAfter.external - memBefore.external,
            rss: memAfter.rss - memBefore.rss
        };

        stats.performance = {
            totalExecutionTime: executionTime.toFixed(2),
            memoryUsed: memoryUsed,
            avgRoundTime: (executionTime / numRounds).toFixed(2),
            roundsPerSecond: (1000 / (executionTime / numRounds)).toFixed(2)
        };

        const balances = Object.values(stats.finalBalances);
        stats.gameStats = {
            highestBalance: Math.max(...balances),
            lowestBalance: Math.min(...balances),
            averageBalance: (balances.reduce((a, b) => a + b, 0) / balances.length).toFixed(2),
            totalAgents: Object.keys(stats.finalBalances).length,
            totalRounds: numRounds
        };

        return stats;
    } finally {
        await game.cleanup();  // Always clean up, both classes now have this method
    }
}

// Updated route to compare both implementations
router.get("/agentvsagent", async (req, res) => {
    const NUM_AGENTS = 1000;
    const NUM_ROUNDS = 10;
    
    try {

        // Run multi-threaded version
        console.log("\nRunning multi-threaded version...");
        const multiThreadGame = new AgentvAgentGame(NUM_AGENTS);
        const multiThreadStats = await runGame(multiThreadGame, NUM_ROUNDS);

        // Run single-threaded version
        console.log("\nRunning single-threaded version...");
        const singleThreadGame = new SingleThreadGame(NUM_AGENTS);
        const singleThreadStats = await runGame(singleThreadGame, NUM_ROUNDS);
        


        const stats = {
            singleThread: singleThreadStats,
            multiThread: multiThreadStats,
            comparison: {
                speedup: (singleThreadStats.performance.totalExecutionTime / multiThreadStats.performance.totalExecutionTime).toFixed(2),
                memoryDiff: {
                    heapUsed: multiThreadStats.performance.memoryUsed.heapUsed - singleThreadStats.performance.memoryUsed.heapUsed,
                    rss: multiThreadStats.performance.memoryUsed.rss - singleThreadStats.performance.memoryUsed.rss
                }
            }
        };

        res.render('agentvsagent', { stats });
    } catch (error) {
        console.error('Error running games:', error);
        res.status(500).json({ error: 'Game execution failed' });
    }
});

// Render the agents page
router.get('/multi-agent', (req, res) => {
    res.render('multi-agent', { title: 'Agent Visualization' });
  });


  router.get('/deathmatch', (req, res) => {
    const width = parseInt(req.query.width) || DM_CONFIG.DEFAULT_WIDTH;
    const height = parseInt(req.query.height) || DM_CONFIG.DEFAULT_HEIGHT;

    
    // Validate if the space can theoretically fit the points
    const spaceValidation = validateSpace(width, height, DM_CONFIG.AGENT_RADIUS);
    
    if (!spaceValidation.isValid || spaceValidation.maxAgents < DM_CONFIG.NO_AGENTS) {
        return res.status(400).json({
            error: 'Space too small for desired number of agents',
            details: {
                maxPossibleAgents: spaceValidation.maxAgents,
                targetCount: DM_CONFIG.NO_AGENTS,
                radius: DM_CONFIG.FIXED_RADIUS
            }
        });
    }
    
    const agentCoords = generateRandomPoints(width, height, DM_CONFIG.AGENT_RADIUS, DM_CONFIG.NO_AGENTS);
    
    if (!agentCoords.success) {
        return res.status(400).json({
            error: 'Could not place exact number of agents',
            details: {
                placedAgents: agentCoords.points.length,
                targetCount: NO_AGENTS,
                attempts: agentCoords.attempts,
                bestCount: agentCoords.bestCount
            }
        });
    }

    // Create initial agent data structure without game state
    const initialAgents = agentCoords.points.map((point, index) => ({
        id: `Agent${index + 1}`,
        x: point.x,
        y: point.y,
        radius: DM_CONFIG.AGENT_RADIUS,
        balance: DM_CONFIG.INITIAL_BALANCE  
    }));

    // Pass data needed for initial render
    res.render('deathmatch', {
        title: 'Agent DeathMatch',
        gameState: {
            totalAgents: DM_CONFIG.NO_AGENTS,
            width: width,
            height: height,
            radius: DM_CONFIG.AGENT_RADIUS
        },
        initialAgents: JSON.stringify(initialAgents),  // Pass to client JavaScript
        socketConfig: {
            gameType: 'deathmatch'
        }
    });
});


module.exports = router;  