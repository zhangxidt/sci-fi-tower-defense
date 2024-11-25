class TowerModel {
    constructor(type, x, y) {
        const config = CONFIG.TOWERS[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.color = config.color;
        this.model = config.model;
        this.rotation = 0;
        this.scale = 1;
        this.animationTime = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        switch (this.model) {
            case 'hexagonal-prism':
                this.drawHexagonalPrism(ctx);
                break;
            case 'sphere-core':
                this.drawSphereCore(ctx);
                break;
            case 'energy-coil':
                this.drawEnergyCoil(ctx);
                break;
            case 'quantum-core':
                this.drawQuantumCore(ctx);
                break;
            case 'missile-platform':
                this.drawMissilePlatform(ctx);
                break;
        }

        ctx.restore();
    }

    drawHexagonalPrism(ctx) {
        // 基座
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        // 激光发射器
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // 能量脉冲效果
        this.animationTime += 0.05;
        const pulseSize = 5 + Math.sin(this.animationTime) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawSphereCore(ctx) {
        // 外层球体
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 内层等离子体
        this.animationTime += 0.05;
        const innerSize = 12 + Math.sin(this.animationTime) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, innerSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;

        // 能量环
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawEnergyCoil(ctx) {
        // 特斯拉线圈主体
        ctx.beginPath();
        ctx.moveTo(-5, 20);
        ctx.lineTo(5, 20);
        ctx.lineTo(8, -20);
        ctx.lineTo(-8, -20);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        // 能量线圈
        this.animationTime += 0.1;
        const coilOffset = Math.sin(this.animationTime) * 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const y = -15 + i * 8;
            const width = 10 + Math.sin(i + this.animationTime) * 2;
            ctx.moveTo(-width + coilOffset, y);
            ctx.lineTo(width + coilOffset, y);
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawQuantumCore(ctx) {
        // 量子核心
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 量子轨道
        this.animationTime += 0.05;
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2 / 3) + this.animationTime;
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 10, angle, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 量子粒子
            const particleX = Math.cos(angle + this.animationTime * 2) * 20;
            const particleY = Math.sin(angle + this.animationTime * 2) * 10;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    drawMissilePlatform(ctx) {
        // 发射平台基座
        ctx.beginPath();
        ctx.rect(-15, -15, 30, 30);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 导弹发射管
        for (let i = 0; i < 4; i++) {
            const x = (i % 2) * 20 - 10;
            const y = Math.floor(i / 2) * 20 - 10;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#333333';
            ctx.fill();

            // 导弹准备效果
            this.animationTime += 0.01;
            const readyState = (Math.sin(this.animationTime + i) + 1) / 2;
            ctx.beginPath();
            ctx.arc(x, y, 3 * readyState, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6633';
            ctx.fill();
        }

        // 雷达扫描效果
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const scanAngle = (this.animationTime * 2) % (Math.PI * 2);
        ctx.arc(0, 0, 25, scanAngle, scanAngle + 0.2);
        ctx.strokeStyle = '#33ff99';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    update() {
        // 更新动画和旋转
        this.animationTime += 0.016;
    }
}

class EnemyModel {
    constructor(type, x, y) {
        const config = CONFIG.ENEMIES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.color = config.color;
        this.model = config.model;
        this.rotation = 0;
        this.scale = 1;
        this.animationTime = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        switch (this.model) {
            case 'crawler':
                this.drawCrawler(ctx);
                break;
            case 'fighter':
                this.drawFighter(ctx);
                break;
            case 'mech':
                this.drawMech(ctx);
                break;
            case 'infiltrator':
                this.drawInfiltrator(ctx);
                break;
            case 'guardian':
                this.drawGuardian(ctx);
                break;
            case 'destroyer':
                this.drawDestroyer(ctx);
                break;
        }

        ctx.restore();
    }

    drawCrawler(ctx) {
        // 装甲虫体
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 机械腿
        this.animationTime += 0.1;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) + Math.sin(this.animationTime + i) * 0.2;
            const x1 = Math.cos(angle) * 10;
            const y1 = Math.sin(angle) * 10;
            const x2 = Math.cos(angle) * 15;
            const y2 = Math.sin(angle) * 15;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    drawFighter(ctx) {
        // 战机主体
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        // 引擎效果
        this.animationTime += 0.1;
        const engineSize = 3 + Math.sin(this.animationTime) * 1;
        ctx.beginPath();
        ctx.arc(-8, 0, engineSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6633';
        ctx.fill();
    }

    drawMech(ctx) {
        // 机甲身体
        ctx.beginPath();
        ctx.rect(-10, -15, 20, 30);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 机械臂
        this.animationTime += 0.05;
        const armOffset = Math.sin(this.animationTime) * 5;
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(-20, armOffset);
        ctx.moveTo(10, -10);
        ctx.lineTo(20, armOffset);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 头部
        ctx.beginPath();
        ctx.arc(0, -20, 8, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawInfiltrator(ctx) {
        // 隐形效果
        const alpha = 0.3 + Math.sin(this.animationTime) * 0.2;
        ctx.globalAlpha = alpha;

        // 渗透者主体
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        // 隐形力场
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.strokeStyle = '#66ffcc';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.globalAlpha = 1;
    }

    drawGuardian(ctx) {
        // 护盾战士主体
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 能量护盾
        this.animationTime += 0.05;
        const shieldSize = 18 + Math.sin(this.animationTime) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, shieldSize, 0, Math.PI * 2);
        ctx.strokeStyle = '#3399ff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawDestroyer(ctx) {
        // Boss主体
        ctx.beginPath();
        ctx.rect(-20, -20, 40, 40);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 武器系统
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + this.animationTime;
            const x = Math.cos(angle) * 25;
            const y = Math.sin(angle) * 25;
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff3333';
            ctx.fill();
        }

        // 能量核心
        this.animationTime += 0.05;
        const coreSize = 8 + Math.sin(this.animationTime) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }

    update() {
        // 更新动画和旋转
        this.animationTime += 0.016;
    }
}
