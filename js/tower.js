class Tower {
    constructor(type, x, y) {
        const config = CONFIG.TOWERS[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.damage = config.damage;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.cost = config.cost;
        this.level = 1;
        this.lastFired = 0;
        this.target = null;
        this.projectiles = [];
        this.upgrades = [...config.upgrades];
        this.effects = [];
    }

    update(gameTime, enemies) {
        // Update projectiles
        this.projectiles = this.projectiles.filter(p => p.active);
        this.projectiles.forEach(p => p.update());

        // Update effects
        this.effects = this.effects.filter(e => e.active);
        this.effects.forEach(e => e.update());

        // Find and attack target
        if (gameTime - this.lastFired >= 1000 / this.fireRate) {
            this.findTarget(enemies);
            if (this.target && this.canAttack(this.target)) {
                this.attack(this.target);
                this.lastFired = gameTime;
            }
        }
    }

    findTarget(enemies) {
        // Find closest enemy in range
        let closestDistance = Infinity;
        let closestEnemy = null;

        enemies.forEach(enemy => {
            if (!enemy.active) return;
            const distance = this.getDistance(enemy);
            if (distance <= this.range && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });

        this.target = closestEnemy;
    }

    canAttack(enemy) {
        return this.getDistance(enemy) <= this.range;
    }

    getDistance(enemy) {
        const dx = this.x - enemy.x;
        const dy = this.y - enemy.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    attack(enemy) {
        // Create new projectile
        const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        this.projectiles.push(new Projectile(
            this.x,
            this.y,
            angle,
            this.damage,
            CONFIG.TOWERS[this.type].projectileSpeed
        ));
    }

    upgrade(index) {
        if (index >= this.upgrades.length) return false;
        
        const upgrade = this.upgrades[index];
        if (!upgrade) return false;

        // Apply upgrade effects
        if (upgrade.damageFactor) this.damage *= upgrade.damageFactor;
        if (upgrade.rangeFactor) this.range *= upgrade.rangeFactor;
        if (upgrade.fireRateFactor) this.fireRate *= upgrade.fireRateFactor;
        if (upgrade.chainCount) this.chainCount = upgrade.chainCount;

        this.level++;
        return true;
    }

    draw(ctx) {
        // Draw range indicator
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        // Draw tower
        ctx.fillStyle = this.getTowerColor();
        ctx.fillRect(this.x - 16, this.y - 16, 32, 32);

        // Draw projectiles
        this.projectiles.forEach(p => p.draw(ctx));

        // Draw effects
        this.effects.forEach(e => e.draw(ctx));
    }

    getTowerColor() {
        switch(this.type) {
            case 'LASER': return '#ff0000';
            case 'PLASMA': return '#00ff00';
            case 'TESLA': return '#0000ff';
            default: return '#ffffff';
        }
    }
}

class Projectile {
    constructor(x, y, angle, damage, speed) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.speed = speed;
        this.active = true;
        this.distanceTraveled = 0;
        this.maxDistance = 500; // Maximum travel distance
    }

    update() {
        const dx = Math.cos(this.angle) * this.speed;
        const dy = Math.sin(this.angle) * this.speed;
        this.x += dx;
        this.y += dy;
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
        
        if (this.distanceTraveled >= this.maxDistance) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
}
