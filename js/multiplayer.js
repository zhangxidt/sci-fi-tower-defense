class MultiplayerManager {
    constructor() {
        this.ws = null;
        this.roomId = null;
        this.playerName = null;
        this.isHost = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 初始重连延迟1秒
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('createRoom').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoom').addEventListener('click', () => this.joinRoom());
        document.getElementById('ready').addEventListener('click', () => this.playerReady());
    }

    getWebSocketUrl() {
        const isProduction = window.location.hostname !== 'localhost';
        if (isProduction) {
            // Vercel部署环境
            return `wss://${window.location.host}/ws`;
        } else {
            // 本地开发环境
            return 'ws://localhost:8001/ws';
        }
    }

    connect() {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(this.getWebSocketUrl());
        
        this.ws.onopen = () => {
            console.log('WebSocket连接已建立');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            
            // 如果是重连且有房间信息，自动重新加入房间
            if (this.roomId && this.playerName) {
                if (this.isHost) {
                    this.createRoom();
                } else {
                    this.joinRoom();
                }
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket连接已关闭');
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
            this.showNotification('连接错误，尝试重新连接...', 'error');
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('消息处理错误:', error);
            }
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.showNotification(`连接断开，${this.reconnectDelay / 1000}秒后重试...`, 'warning');
            
            setTimeout(() => {
                this.reconnectAttempts++;
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000); // 最大延迟10秒
                this.connect();
            }, this.reconnectDelay);
        } else {
            this.showNotification('无法连接到服务器，请刷新页面重试', 'error');
        }
    }

    createRoom() {
        const nameInput = document.getElementById('playerName');
        this.playerName = nameInput.value.trim();
        
        if (!this.playerName) {
            this.showNotification('请输入玩家名称', 'error');
            return;
        }

        this.isHost = true;
        this.ws.send(JSON.stringify({
            type: 'create_room',
            playerName: this.playerName
        }));
    }

    joinRoom() {
        const nameInput = document.getElementById('playerName');
        const roomInput = document.getElementById('roomId');
        
        this.playerName = nameInput.value.trim();
        const roomId = roomInput.value.trim();
        
        if (!this.playerName || !roomId) {
            this.showNotification('请输入玩家名称和房间号', 'error');
            return;
        }

        this.isHost = false;
        this.ws.send(JSON.stringify({
            type: 'join_room',
            playerName: this.playerName,
            roomId: roomId
        }));
    }

    playerReady() {
        if (!this.roomId) {
            this.showNotification('请先加入房间', 'error');
            return;
        }

        this.ws.send(JSON.stringify({
            type: 'player_ready'
        }));
        
        document.getElementById('ready').disabled = true;
    }

    handleMessage(message) {
        switch (message.type) {
            case 'room_created':
                this.roomId = message.roomId;
                this.showNotification(`房间创建成功！房间号: ${this.roomId}`, 'success');
                this.updateRoomDisplay();
                break;

            case 'room_joined':
                this.roomId = message.roomId;
                this.showNotification('成功加入房间！', 'success');
                this.updateRoomDisplay();
                this.updateGameState(message.gameState);
                break;

            case 'player_joined':
                this.showNotification(`${message.playerName} 加入了游戏`, 'info');
                this.updatePlayerList(message.players);
                break;

            case 'player_left':
                this.showNotification(`${message.playerName} 离开了游戏`, 'info');
                this.updatePlayerList(message.players);
                break;

            case 'player_ready':
                this.showNotification(`${message.playerName} 已准备`, 'info');
                break;

            case 'game_start':
                this.showNotification('所有玩家已准备，游戏开始！', 'success');
                this.startGame();
                break;

            case 'tower_placed':
                this.handleTowerPlaced(message);
                break;

            case 'wave_complete':
                this.handleWaveComplete(message);
                break;

            case 'error':
                this.showNotification(message.message, 'error');
                break;
        }
    }

    updateRoomDisplay() {
        const roomDisplay = document.getElementById('roomDisplay');
        roomDisplay.textContent = `房间号: ${this.roomId}`;
        roomDisplay.style.display = 'block';
        
        document.getElementById('joinForm').style.display = 'none';
        document.getElementById('gameControls').style.display = 'block';
    }

    updatePlayerList(players) {
        const playerList = document.getElementById('playerList');
        playerList.innerHTML = '';
        
        players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            playerElement.innerHTML = `
                ${player.name} 
                ${player.ready ? '<span class="ready-status">已准备</span>' : ''}
            `;
            playerList.appendChild(playerElement);
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    updateGameState(gameState) {
        // 更新游戏状态，如波数、金钱等
        document.getElementById('wave').textContent = `波数: ${gameState.wave}`;
        document.getElementById('credits').textContent = `金钱: ${gameState.credits}`;
        
        // 更新已放置的塔
        gameState.towers.forEach(tower => {
            this.placeTower(tower);
        });
    }

    handleTowerPlaced(message) {
        this.placeTower(message.tower);
        this.showNotification(`${message.playerName} 放置了 ${message.tower.type}`, 'info');
    }

    handleWaveComplete(message) {
        this.showNotification(`第 ${message.wave - 1} 波完成！获得 ${message.bonus} 金钱`, 'success');
        document.getElementById('wave').textContent = `波数: ${message.wave}`;
        document.getElementById('credits').textContent = 
            `金钱: ${parseInt(document.getElementById('credits').textContent.split(': ')[1]) + message.bonus}`;
    }

    placeTower(tower) {
        // 在游戏画布上放置塔
        game.placeTower(tower.x, tower.y, tower.type);
    }

    startGame() {
        // 启动游戏逻辑
        game.start();
    }
}

// 创建多人游戏管理器实例
const multiplayerManager = new MultiplayerManager();

// 初始连接
multiplayerManager.connect();
