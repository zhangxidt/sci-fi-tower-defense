class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.towers = [];
        this.enemies = [];
        this.credits = CONFIG.STARTING_CREDITS;
        this.lives = CONFIG.STARTING_LIVES;
        this.wave = 1;
        this.gameTime = 0;
        this.paused = false;
        this.selectedTower = null;
        this.multiplayer = false;
        this.players = new Map();
        this.gameStarted = false;
        
        // 隐藏游戏UI，直到游戏开始
        document.getElementById('ui-overlay').classList.add('hidden');
        
        // Initialize path
        this.initializePath();
        
        // Bind event listeners
        this.bindEvents();
    }

    startGame() {
        this.gameStarted = true;
        document.getElementById('ui-overlay').classList.remove('hidden');
        document.getElementById('multiplayer-menu').classList.add('hidden');
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    initializePath() {
        // Create a simple path for now - can be made more complex later
        this.pathPoints = [
            { x: 0, y: 300 },
            { x: 200, y: 300 },
            { x: 200, y: 100 },
            { x: 400, y: 100 },
            { x: 400, y: 500 },
            { x: 600, y: 500 },
            { x: 600, y: 300 },
            { x: this.canvas.width, y: 300 }
        ];
    }

    bindEvents() {
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleClick(event) {
        if (!this.gameStarted || this.paused) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if clicking on existing tower
        const clickedTower = this.towers.find(tower => {
            const dx = tower.x - x;
            const dy = tower.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 20;
        });

        if (clickedTower) {
            this.selectedTower = clickedTower;
            this.updateTowerInfo(clickedTower);
            return;
        }

        // Place new tower if we have one selected and enough credits
        if (this.selectedTowerType) {
            const towerConfig = CONFIG.TOWERS[this.selectedTowerType];
            if (this.credits >= towerConfig.cost && this.canPlaceTower(x, y)) {
                this.placeTower(this.selectedTowerType, x, y);
                this.credits -= towerConfig.cost;
                this.updateUI();
            }
        }
    }

    handleMouseMove(event) {
        if (!this.gameStarted) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.paused = !this.paused;
            this.updateUI();
        }
    }

    canPlaceTower(x, y) {
        // Check if too close to path
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];
            const distance = this.pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
            if (distance < 40) return false;
        }

        // Check if too close to other towers
        for (const tower of this.towers) {
            const dx = tower.x - x;
            const dy = tower.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) return false;
        }

        return true;
    }

    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    placeTower(type, x, y) {
        const tower = new Tower(type, x, y);
        this.towers.push(tower);
        if (this.multiplayer) {
            this.broadcastTowerPlaced(type, x, y);
        }
    }

    spawnWave() {
        const template = CONFIG.WAVE_TEMPLATES[(this.wave - 1) % CONFIG.WAVE_TEMPLATES.length];
        const enemyCount = Math.floor(template.count * Math.pow(CONFIG.WAVE_INCREASE_FACTOR, this.wave - 1));
        
        let spawned = 0;
        const spawnInterval = setInterval(() => {
            if (spawned >= enemyCount || this.paused) {
                clearInterval(spawnInterval);
                return;
            }

            const enemyType = template.enemies[Math.floor(Math.random() * template.enemies.length)];
            this.enemies.push(new Enemy(enemyType, [...this.pathPoints]));
            spawned++;
        }, template.interval * 1000);
    }

    update(deltaTime) {
        if (!this.gameStarted || this.paused) return;

        this.gameTime += deltaTime;

        // Update towers
        this.towers.forEach(tower => tower.update(this.gameTime, this.enemies));

        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.update();
            
            if (enemy.reachedEnd) {
                this.lives -= enemy.damage;
                this.updateUI();
                return false;
            }
            
            if (!enemy.active) {
                this.credits += enemy.reward;
                this.updateUI();
                return false;
            }
            
            return true;
        });

        // Check wave completion
        if (this.enemies.length === 0) {
            this.wave++;
            this.updateUI();
            this.spawnWave();
        }

        // Check game over
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw path
        this.drawPath();

        // Draw towers
        this.towers.forEach(tower => tower.draw(this.ctx));

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Draw tower placement preview
        if (this.selectedTowerType && this.canPlaceTower(this.mouseX, this.mouseY)) {
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(this.mouseX - 16, this.mouseY - 16, 32, 32);
            this.ctx.globalAlpha = 1;
        }

        // Draw pause overlay
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    drawPath() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            this.ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 40;
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = 36;
        this.ctx.stroke();
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    updateUI() {
        document.getElementById('credits').textContent = this.credits;
        document.getElementById('wave').textContent = this.wave;
    }

    updateTowerInfo(tower) {
        const infoDiv = document.getElementById('tower-info');
        if (!tower) {
            infoDiv.classList.add('hidden');
            return;
        }

        infoDiv.classList.remove('hidden');
        document.getElementById('tower-damage').textContent = tower.damage;
        document.getElementById('tower-range').textContent = tower.range;
        document.getElementById('tower-level').textContent = tower.level;
    }

    gameOver() {
        this.paused = true;
        alert(`Game Over! You survived ${this.wave} waves!`);
        location.reload();
    }

    // Multiplayer methods
    enableMultiplayer() {
        this.multiplayer = true;
        // Initialize WebSocket connection here
    }

    broadcastTowerPlaced(type, x, y) {
        // Send tower placement to other players
    }

    receiveTowerPlaced(type, x, y) {
        this.placeTower(type, x, y);
    }
}
