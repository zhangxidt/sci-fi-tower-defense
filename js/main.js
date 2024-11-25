document.addEventListener('DOMContentLoaded', () => {
    // Initialize canvas
    const canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create game instance
    const game = new Game(canvas);
    
    // Initialize multiplayer
    const multiplayer = new MultiplayerManager(game);
    multiplayer.connect();

    // Initialize tower selection UI
    const towerSelection = document.getElementById('tower-selection');
    Object.entries(CONFIG.TOWERS).forEach(([type, config]) => {
        const button = document.createElement('button');
        button.className = 'tower-button';
        button.innerHTML = `
            <div class="tower-icon" style="background-color: ${getTowerColor(type)}"></div>
            <div class="tower-cost">${config.cost}</div>
        `;
        button.addEventListener('click', () => {
            game.selectedTowerType = type;
            // Highlight selected tower
            document.querySelectorAll('.tower-button').forEach(btn => 
                btn.classList.remove('selected'));
            button.classList.add('selected');
        });
        towerSelection.appendChild(button);
    });

    // Initialize upgrade button
    document.getElementById('upgrade-btn').addEventListener('click', () => {
        if (game.selectedTower) {
            const upgradeCost = game.selectedTower.upgrades[game.selectedTower.level - 1]?.cost;
            if (upgradeCost && game.credits >= upgradeCost) {
                game.credits -= upgradeCost;
                game.selectedTower.upgrade(game.selectedTower.level - 1);
                game.updateUI();
                game.updateTowerInfo(game.selectedTower);
            }
        }
    });

    // Initialize sell button
    document.getElementById('sell-btn').addEventListener('click', () => {
        if (game.selectedTower) {
            const sellValue = Math.floor(game.selectedTower.cost * 0.7);
            game.credits += sellValue;
            game.towers = game.towers.filter(t => t !== game.selectedTower);
            game.selectedTower = null;
            game.updateUI();
            game.updateTowerInfo(null);
        }
    });

    // Initialize multiplayer buttons
    const createGameBtn = document.getElementById('create-game');
    const joinGameBtn = document.getElementById('join-game');
    const playerNameInput = document.getElementById('player-name');

    createGameBtn.addEventListener('click', () => {
        if (playerNameInput.value.trim()) {
            game.multiplayer = new MultiplayerManager(game);
            game.multiplayer.playerName = playerNameInput.value.trim();
            game.multiplayer.connect();
            game.multiplayer.createRoom();
        }
    });

    joinGameBtn.addEventListener('click', () => {
        const roomId = prompt('Enter room ID:');
        if (roomId && playerNameInput.value.trim()) {
            game.multiplayer = new MultiplayerManager(game);
            game.multiplayer.playerName = playerNameInput.value.trim();
            game.multiplayer.connect();
            game.multiplayer.joinRoom(roomId);
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
});

function getTowerColor(type) {
    switch(type) {
        case 'LASER': return '#ff0000';
        case 'PLASMA': return '#00ff00';
        case 'TESLA': return '#0000ff';
        default: return '#ffffff';
    }
}
