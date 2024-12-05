// Game state
let selectedGame = null


// DOM Elements

const startButton = document.getElementById('startGame')
const gameModes = ['CombatWordle', 'playerVsAgent', 'agentVsAgent']

// Set up game mode selection
gameModes.forEach(mode => {
    const element = document.getElementById(mode)
    element.addEventListener('click', () => {
        // Remove active class from all modes
        gameModes.forEach(m => 
            document.getElementById(m).classList.remove('active'))
        
        // Add active class to selected mode
        element.classList.add('active')
        selectedGame = mode
        
        // Check if we can enable start button
        validateForm()
    })
})



// Form validation
function validateForm() {
    if (selectedGame) {
        startButton.classList.remove('disabled')
    } else {
        startButton.classList.add('disabled')
    }
}

// Handle game start
startButton.addEventListener('click', () => {
    if (!selectedGame) return

    // Redirect to appropriate game
    switch(selectedGame) {
        case 'CombatWordle':
            window.location.href = `/speedwordlecontest`
            break
        case 'playerVsAgent':
            window.location.href = `/spgame`
            break
        case 'agentVsAgent':
            window.location.href = `/spgame&mode=visualize`
            break
    }
})