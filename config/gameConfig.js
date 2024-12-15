const DM_CONFIG = {
    // Game parameters
    NO_AGENTS: 5000,
    NO_ROUNDS: 100,
    INITIAL_BALANCE: 100,
    PAYMENT_AMOUNT: 1,     // Amount transferred each round
    ROUND_INTERVAL: 2000,   // Milliseconds between rounds

    // Space parameters
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
    AGENT_RADIUS: 1,

    // Validation limits
    MAX_ATTEMPTS: 1000,     // For point generation
    MIN_AGENT_SPACING: 10   // Minimum pixels between agents
};

module.exports = DM_CONFIG;