const CONFIG = {
    // Game settings
    STARTING_CREDITS: 600,
    WAVE_INCREASE_FACTOR: 1.2,
    STARTING_LIVES: 20,
    
    // Tower types
    TOWERS: {
        LASER: {
            name: '脉冲激光塔',
            description: '发射高频激光束的基础防御塔',
            cost: 100,
            damage: 20,
            range: 150,
            fireRate: 1,
            projectileSpeed: 10,
            color: '#ff3366',
            model: 'hexagonal-prism',
            special: '10%概率造成双倍伤害',
            upgrades: [
                { name: '聚焦光束', description: '提升60%伤害', cost: 150, damageFactor: 1.6 },
                { name: '量子聚能', description: '提升40%攻击范围', cost: 100, rangeFactor: 1.4 },
                { name: '超频发射', description: '提升50%攻击速度', cost: 200, fireRateFactor: 1.5 }
            ]
        },
        PLASMA: {
            name: '等离子炮塔',
            description: '发射高温等离子体的范围攻击武器',
            cost: 200,
            damage: 40,
            range: 120,
            fireRate: 0.5,
            projectileSpeed: 8,
            color: '#33ff99',
            model: 'sphere-core',
            special: '造成持续燃烧伤害',
            upgrades: [
                { name: '等离子增压', description: '提升80%伤害', cost: 250, damageFactor: 1.8 },
                { name: '磁场扩展', description: '提升50%攻击范围', cost: 200, rangeFactor: 1.5 },
                { name: '粒子加速', description: '提升40%攻击速度', cost: 300, fireRateFactor: 1.4 }
            ]
        },
        TESLA: {
            name: '特斯拉线圈',
            description: '释放连锁闪电的高科技电塔',
            cost: 300,
            damage: 30,
            range: 100,
            fireRate: 1.5,
            chainLightning: true,
            color: '#66ccff',
            model: 'energy-coil',
            special: '电击可以连锁至最多3个目标',
            upgrades: [
                { name: '超导线圈', description: '可以连接4个目标', cost: 400, chainCount: 4 },
                { name: '高压放电', description: '提升70%伤害', cost: 300, damageFactor: 1.7 },
                { name: '磁暴扩散', description: '提升60%攻击范围', cost: 350, rangeFactor: 1.6 }
            ]
        },
        QUANTUM: {
            name: '量子干扰塔',
            description: '发射量子波动束降低敌人速度',
            cost: 250,
            damage: 25,
            range: 130,
            fireRate: 1.2,
            projectileSpeed: 9,
            color: '#ff99ff',
            model: 'quantum-core',
            special: '减缓敌人50%移动速度',
            upgrades: [
                { name: '量子纠缠', description: '减速效果提升至70%', cost: 300, slowFactor: 0.7 },
                { name: '波函数坍缩', description: '提升65%伤害', cost: 250, damageFactor: 1.65 },
                { name: '亚空间扩展', description: '提升45%攻击范围', cost: 200, rangeFactor: 1.45 }
            ]
        },
        MISSILE: {
            name: '导弹发射台',
            description: '发射追踪导弹的重型防御塔',
            cost: 400,
            damage: 100,
            range: 200,
            fireRate: 0.3,
            projectileSpeed: 7,
            color: '#ff6633',
            model: 'missile-platform',
            special: '造成范围爆炸伤害',
            upgrades: [
                { name: '集束弹头', description: '爆炸范围提升50%', cost: 500, splashFactor: 1.5 },
                { name: '反物质弹头', description: '提升90%伤害', cost: 600, damageFactor: 1.9 },
                { name: 'AI导航', description: '提升80%命中率', cost: 400, accuracyFactor: 1.8 }
            ]
        }
    },

    // Enemy types
    ENEMIES: {
        CRAWLER: {
            name: '装甲爬虫',
            description: '基础地面单位',
            health: 100,
            speed: 2,
            reward: 20,
            damage: 1,
            color: '#ff9933',
            model: 'crawler',
            resistance: '无'
        },
        FLYER: {
            name: '虚空战机',
            description: '快速的空中单位',
            health: 150,
            speed: 3,
            reward: 30,
            damage: 2,
            flying: true,
            color: '#9966ff',
            model: 'fighter',
            resistance: '部分物理防御'
        },
        TANK: {
            name: '重型机甲',
            description: '装甲极厚的重型单位',
            health: 400,
            speed: 1,
            reward: 50,
            damage: 3,
            color: '#ff6666',
            model: 'mech',
            resistance: '高物理防御'
        },
        STEALTH: {
            name: '隐形渗透者',
            description: '具有隐身能力的特殊单位',
            health: 120,
            speed: 2.5,
            reward: 40,
            damage: 2,
            color: '#66ffcc',
            model: 'infiltrator',
            special: '间歇性隐身',
            resistance: '能量武器抗性'
        },
        SHIELD: {
            name: '护盾战士',
            description: '带有能量护盾的精英单位',
            health: 300,
            shield: 200,
            speed: 1.5,
            reward: 60,
            damage: 2,
            color: '#3399ff',
            model: 'guardian',
            special: '护盾再生',
            resistance: '能量护盾'
        },
        BOSS: {
            name: '毁灭者',
            description: '强大的boss单位',
            health: 2000,
            speed: 0.5,
            reward: 200,
            damage: 5,
            color: '#ff3333',
            model: 'destroyer',
            special: '生成小型单位',
            resistance: '全方位防御'
        }
    },

    // Wave configuration
    WAVE_TEMPLATES: [
        { // Wave 1
            enemies: ['CRAWLER'],
            count: 10,
            interval: 1.5
        },
        { // Wave 2
            enemies: ['CRAWLER', 'FLYER'],
            count: 15,
            interval: 1.3
        },
        { // Wave 3
            enemies: ['CRAWLER', 'FLYER', 'TANK'],
            count: 20,
            interval: 1.2
        },
        { // Wave 4
            enemies: ['STEALTH', 'FLYER'],
            count: 15,
            interval: 1.4
        },
        { // Wave 5
            enemies: ['SHIELD', 'TANK'],
            count: 12,
            interval: 1.6
        },
        { // Wave 6 - Boss Wave
            enemies: ['BOSS'],
            count: 1,
            interval: 0,
            spawnMinions: true
        }
    ],

    // Special effects
    EFFECTS: {
        BURN: {
            name: '燃烧',
            damage: 5,
            duration: 3,
            interval: 0.5,
            color: '#ff6600'
        },
        SLOW: {
            name: '减速',
            factor: 0.5,
            duration: 2,
            color: '#99ffff'
        },
        CHAIN: {
            name: '连锁',
            damage: 0.7,
            maxTargets: 3,
            color: '#66ccff'
        },
        STUN: {
            name: '眩晕',
            duration: 1,
            color: '#ffff00'
        }
    },

    // Map settings
    MAP: {
        GRID_SIZE: 32,
        PATH_WIDTH: 2,
        BUILDABLE_TILES: ['grass', 'hill'],
        TERRAIN_TYPES: ['grass', 'path', 'water', 'hill'],
        BACKGROUND_COLOR: '#0a1a2a',
        PATH_COLOR: '#1a2a3a',
        PATH_BORDER_COLOR: '#2a3a4a'
    },

    // UI text
    UI: {
        CREDITS_LABEL: '资源: ',
        WAVE_LABEL: '波次: ',
        LIVES_LABEL: '生命: ',
        UPGRADE_BUTTON: '升级',
        SELL_BUTTON: '出售',
        PAUSE_TEXT: '游戏暂停',
        GAME_OVER: '游戏结束！',
        WAVES_SURVIVED: '你存活了 {0} 波！',
        CREATE_GAME: '创建游戏',
        JOIN_GAME: '加入游戏',
        ENTER_NAME: '输入玩家名称',
        ENTER_ROOM: '输入房间号',
        ROOM_ID: '房间号: {0}'
    },

    // Multiplayer settings
    MULTIPLAYER: {
        MAX_PLAYERS: 8,
        MIN_PLAYERS: 2,
        SYNC_INTERVAL: 100,
        READY_TIMEOUT: 30000
    }
};
