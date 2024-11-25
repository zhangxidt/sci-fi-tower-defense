const express = require('express');
const { Server } = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const port = process.env.PORT || 8001;

// 启用CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '../')));

// 健康检查端点
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

let server;
if (process.env.VERCEL) {
    // Vercel环境下使用HTTP升级为WebSocket
    app.post('/ws', (req, res) => {
        if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
            res.end();
            return;
        }
        res.status(426).send('Upgrade Required');
    });
    server = app;
} else {
    // 本地开发环境使用标准WebSocket
    server = app.listen(port, () => {
        console.log(`游戏服务器运行在端口 ${port}`);
    });
}

// 创建WebSocket服务器
const wss = new Server({ 
    server,
    path: '/ws',
    verifyClient: (info) => {
        // 这里可以添加连接验证逻辑
        return true;
    }
});

// 存储游戏房间信息
const rooms = new Map();

wss.on('connection', (ws) => {
    console.log('新玩家连接');
    let currentRoom = null;
    let playerName = '';

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'create_room':
                    playerName = data.playerName;
                    const roomId = uuidv4().substring(0, 6); // 生成更短的房间ID
                    const newRoom = {
                        id: roomId,
                        host: ws,
                        players: new Map([[ws, { name: playerName, ready: false }]]),
                        gameState: {
                            wave: 1,
                            credits: 600,
                            towers: [],
                            enemies: []
                        }
                    };
                    rooms.set(roomId, newRoom);
                    currentRoom = newRoom;
                    
                    ws.send(JSON.stringify({
                        type: 'room_created',
                        roomId: roomId
                    }));
                    break;

                case 'join_room':
                    playerName = data.playerName;
                    const room = rooms.get(data.roomId);
                    if (room && room.players.size < 8) {
                        room.players.set(ws, { name: playerName, ready: false });
                        currentRoom = room;
                        
                        broadcastToRoom(room, {
                            type: 'player_joined',
                            playerName: playerName,
                            players: Array.from(room.players.values()).map(p => ({
                                name: p.name,
                                ready: p.ready
                            }))
                        });

                        ws.send(JSON.stringify({
                            type: 'room_joined',
                            roomId: data.roomId,
                            gameState: room.gameState
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: room ? '房间已满' : '房间不存在'
                        }));
                    }
                    break;

                case 'player_ready':
                    if (currentRoom) {
                        const playerData = currentRoom.players.get(ws);
                        playerData.ready = true;
                        
                        const allReady = Array.from(currentRoom.players.values())
                            .every(p => p.ready);
                        
                        if (allReady) {
                            broadcastToRoom(currentRoom, {
                                type: 'game_start'
                            });
                        } else {
                            broadcastToRoom(currentRoom, {
                                type: 'player_ready',
                                playerName: playerName
                            });
                        }
                    }
                    break;

                case 'tower_placed':
                    if (currentRoom) {
                        currentRoom.gameState.towers.push(data.tower);
                        broadcastToRoom(currentRoom, {
                            type: 'tower_placed',
                            tower: data.tower,
                            playerName: playerName
                        }, ws);
                    }
                    break;

                case 'wave_complete':
                    if (currentRoom) {
                        currentRoom.gameState.wave++;
                        currentRoom.gameState.credits += data.bonus;
                        broadcastToRoom(currentRoom, {
                            type: 'wave_complete',
                            wave: currentRoom.gameState.wave,
                            bonus: data.bonus
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('消息处理错误:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: '服务器错误，请重试'
            }));
        }
    });

    ws.on('close', () => {
        if (currentRoom) {
            currentRoom.players.delete(ws);
            
            if (currentRoom.players.size === 0) {
                rooms.delete(currentRoom.id);
            } else {
                if (currentRoom.host === ws) {
                    currentRoom.host = Array.from(currentRoom.players.keys())[0];
                }
                
                broadcastToRoom(currentRoom, {
                    type: 'player_left',
                    playerName: playerName,
                    players: Array.from(currentRoom.players.values()).map(p => ({
                        name: p.name,
                        ready: p.ready
                    }))
                });
            }
        }
    });

    // 发送心跳包保持连接
    const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
        }
    }, 30000);

    ws.on('close', () => {
        clearInterval(pingInterval);
    });
});

function broadcastToRoom(room, message, exclude = null) {
    room.players.forEach((playerData, playerWs) => {
        if (playerWs !== exclude && playerWs.readyState === playerWs.OPEN) {
            try {
                playerWs.send(JSON.stringify(message));
            } catch (error) {
                console.error('广播消息错误:', error);
            }
        }
    });
}

// 导出app供Vercel使用
module.exports = app;
