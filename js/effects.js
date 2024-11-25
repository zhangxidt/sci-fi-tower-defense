class Effect {
    constructor(type, target) {
        const effectConfig = CONFIG.EFFECTS[type];
        this.type = type;
        this.target = target;
        this.name = effectConfig.name;
        this.duration = effectConfig.duration;
        this.color = effectConfig.color;
        this.startTime = Date.now();
        this.active = true;
    }

    update() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed >= this.duration) {
            this.active = false;
            this.removeEffect();
        }
        this.applyEffect();
    }

    applyEffect() {
        switch (this.type) {
            case 'BURN':
                this.applyBurnEffect();
                break;
            case 'SLOW':
                this.applySlowEffect();
                break;
            case 'CHAIN':
                this.applyChainEffect();
                break;
            case 'STUN':
                this.applyStunEffect();
                break;
        }
    }

    removeEffect() {
        switch (this.type) {
            case 'SLOW':
                this.target.speed = this.target.originalSpeed;
                break;
            case 'STUN':
                this.target.stunned = false;
                break;
        }
    }

    applyBurnEffect() {
        const effectConfig = CONFIG.EFFECTS.BURN;
        if ((Date.now() - this.lastTickTime) >= (effectConfig.interval * 1000)) {
            this.target.takeDamage(effectConfig.damage);
            this.lastTickTime = Date.now();
            this.createBurnParticles();
        }
    }

    applySlowEffect() {
        const effectConfig = CONFIG.EFFECTS.SLOW;
        if (!this.target.originalSpeed) {
            this.target.originalSpeed = this.target.speed;
        }
        this.target.speed = this.target.originalSpeed * effectConfig.factor;
    }

    applyChainEffect() {
        const effectConfig = CONFIG.EFFECTS.CHAIN;
        const nearbyEnemies = this.findNearbyEnemies();
        nearbyEnemies.slice(0, effectConfig.maxTargets).forEach(enemy => {
            enemy.takeDamage(this.target.lastDamageTaken * effectConfig.damage);
            this.createChainLightning(this.target, enemy);
        });
    }

    applyStunEffect() {
        this.target.stunned = true;
    }

    createBurnParticles() {
        for (let i = 0; i < 5; i++) {
            const particle = new Particle(
                this.target.x,
                this.target.y,
                this.color,
                0.5,
                Math.random() * Math.PI * 2,
                2 + Math.random() * 2
            );
            game.particles.push(particle);
        }
    }

    createChainLightning(source, target) {
        const segments = 5;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = source.x + (target.x - source.x) * t;
            const y = source.y + (target.y - source.y) * t;
            if (i !== 0 && i !== segments) {
                const offset = (Math.random() - 0.5) * 20;
                points.push({
                    x: x + offset,
                    y: y + offset
                });
            } else {
                points.push({ x, y });
            }
        }
        game.effects.push(new ChainLightning(points, this.color));
    }

    findNearbyEnemies() {
        return game.enemies.filter(enemy => {
            if (enemy === this.target || !enemy.active) return false;
            const distance = Math.hypot(
                enemy.x - this.target.x,
                enemy.y - this.target.y
            );
            return distance <= 100;
        });
    }
}

class Particle {
    constructor(x, y, color, life, angle, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.angle = angle;
        this.speed = speed;
        this.active = true;
    }

    update() {
        this.life -= 0.016;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class ChainLightning {
    constructor(points, color) {
        this.points = points;
        this.color = color;
        this.life = 0.2;
        this.maxLife = 0.2;
        this.active = true;
    }

    update() {
        this.life -= 0.016;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}
