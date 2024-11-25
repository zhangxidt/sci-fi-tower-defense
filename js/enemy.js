class Enemy {
    constructor(type, pathPoints) {
        const config = CONFIG.ENEMIES[type];
        this.type = type;
        this.name = config.name;
        this.maxHealth = config.health;
        this.health = config.health;
        this.speed = config.speed;
        this.reward = config.reward;
        this.damage = config.damage;
        this.flying = config.flying || false;
        
        this.pathPoints = pathPoints;
        this.currentPoint = 0;
        this.x = pathPoints[0].x;
        this.y = pathPoints[0].y;
        this.active = true;
        this.reachedEnd = false;
        
        // For smooth movement
        this.targetX = this.x;
        this.targetY = this.y;
        this.progress = 0;
    }

    update() {
        if (!this.active || this.reachedEnd) return;

        // Move towards next point
        if (this.progress >= 1) {
            this.currentPoint++;
            if (this.currentPoint >= this.pathPoints.length) {
                this.reachedEnd = true;
                return;
            }
            this.setNewTarget();
        }

        // Update position
        this.progress += this.speed / this.getDistanceToTarget() * 0.016; // Assuming 60 FPS
        this.x = this.lerp(this.x, this.targetX, this.progress);
        this.y = this.lerp(this.y, this.targetY, this.progress);
    }

    setNewTarget() {
        const nextPoint = this.pathPoints[this.currentPoint];
        this.targetX = nextPoint.x;
        this.targetY = nextPoint.y;
        this.progress = 0;
    }

    getDistanceToTarget() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    lerp(start, end, progress) {
        return start + (end - start) * progress;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        // Spawn death effect here if needed
    }

    draw(ctx) {
        // Draw health bar
        const healthBarWidth = 32;
        const healthBarHeight = 4;
        const healthPercentage = this.health / this.maxHealth;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(
            this.x - healthBarWidth/2,
            this.y - 20,
            healthBarWidth,
            healthBarHeight
        );
        
        ctx.fillStyle = this.getHealthColor(healthPercentage);
        ctx.fillRect(
            this.x - healthBarWidth/2,
            this.y - 20,
            healthBarWidth * healthPercentage,
            healthBarHeight
        );

        // Draw enemy
        ctx.beginPath();
        ctx.arc(this.x, this.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = this.getEnemyColor();
        ctx.fill();

        // Draw flying indicator if applicable
        if (this.flying) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();
        }
    }

    getHealthColor(percentage) {
        if (percentage > 0.6) return '#00ff00';
        if (percentage > 0.3) return '#ffff00';
        return '#ff0000';
    }

    getEnemyColor() {
        switch(this.type) {
            case 'CRAWLER': return '#8B4513';
            case 'FLYER': return '#4B0082';
            case 'TANK': return '#808080';
            default: return '#ffffff';
        }
    }
}
