const express = require('express');
const { router: debugLog, error: debugErrorLog } = require('../utils/logger');
const { SingleThreadGame, AgentvAgentGame } = require('../app/AgentvAgent');
const { validateSpace, generateRandomPoints } = require('../utils/poisson');
const router = express.Router();

router.get('/api', (req, res) => {
    const width = parseInt(req.query.width) || 800;
    const height = parseInt(req.query.height) || 600;
    const FIXED_RADIUS = 3;  // Fixed radius
    const NO_AGENTS = 100; // Fixed number of agents
    
    // Validate if the space can theoretically fit the points
    const spaceValidation = validateSpace(width, height, FIXED_RADIUS);
    
    if (!spaceValidation.isValid || spaceValidation.maxAgents < NO_AGENTS) {
        return res.status(400).json({
            error: 'Space too small for desired number of agents',
            details: {
                maxPossibleAgents: spaceValidation.maxAgents,
                targetCount: NO_AGENTS,
                radius: FIXED_RADIUS
            }
        });
    }
    
    const result = generateRandomPoints(width, height, FIXED_RADIUS, NO_AGENTS);
    
    if (!result.success) {
        return res.status(400).json({
            error: 'Could not place exact number of agents',
            details: {
                placedAgents: result.points.length,
                targetCount: NO_AGENTS,
                attempts: result.attempts,
                bestCount: result.bestCount
            }
        });
    }
    
    res.json({
        agents: result.points,
        stats: {
            placedAgents: result.points.length,
            targetCount: NO_AGENTS,
            radius: FIXED_RADIUS,
            attempts: result.attempts
        }
    });
});

module.exports = router;
