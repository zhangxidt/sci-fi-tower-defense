import asyncio
import websockets
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import logging
import sys
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('server.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# 存储游戏房间和玩家信息
class GameState:
    def __init__(self):
        self.rooms = {}
        self.players = {}

game_state = GameState()

async def register(websocket, room_id, player_name):
    """注册新玩家"""
    if room_id not in game_state.rooms:
        game_state.rooms[room_id] = {'players': set(), 'ready': set()}
    
    game_state.players[websocket] = {
        'name': player_name,
        'room': room_id,
        'ready': False
    }
    game_state.rooms[room_id]['players'].add(websocket)
    
    # 通知房间内所有玩家
    await notify_room(room_id)

async def unregister(websocket):
    """注销玩家"""
    if websocket in game_state.players:
        room_id = game_state.players[websocket]['room']
        game_state.rooms[room_id]['players'].remove(websocket)
        game_state.rooms[room_id]['ready'].discard(websocket)
        del game_state.players[websocket]
        
        # 如果房间空了，删除房间
        if not game_state.rooms[room_id]['players']:
            del game_state.rooms[room_id]
        else:
            # 通知房间内其他玩家
            await notify_room(room_id)

async def notify_room(room_id):
    """通知房间内所有玩家状态更新"""
    if room_id in game_state.rooms:
        room = game_state.rooms[room_id]
        message = {
            'type': 'room_update',
            'players': [
                {
                    'name': game_state.players[player]['name'],
                    'ready': player in room['ready']
                }
                for player in room['players']
            ]
        }
        
        if room['players']:
            await asyncio.wait([
                player.send(json.dumps(message))
                for player in room['players']
            ])

async def game_handler(websocket, path):
    """处理WebSocket连接"""
    try:
        async for message in websocket:
            data = json.loads(message)
            if data['action'] == 'join':
                await register(websocket, data['room_id'], data['player_name'])
                logging.info(f"Player {data['player_name']} joined room {data['room_id']}")
            
            elif data['action'] == 'ready':
                if websocket in game_state.players:
                    room_id = game_state.players[websocket]['room']
                    game_state.rooms[room_id]['ready'].add(websocket)
                    await notify_room(room_id)
                    
                    # 检查是否所有玩家都准备好了
                    room = game_state.rooms[room_id]
                    if len(room['ready']) == len(room['players']):
                        start_message = {
                            'type': 'game_start',
                            'timestamp': datetime.now().timestamp()
                        }
                        await asyncio.wait([
                            player.send(json.dumps(start_message))
                            for player in room['players']
                        ])
            
            elif data['action'] == 'game_state':
                if websocket in game_state.players:
                    room_id = game_state.players[websocket]['room']
                    room = game_state.rooms[room_id]
                    state_message = {
                        'type': 'game_state',
                        'state': data['state'],
                        'player': game_state.players[websocket]['name']
                    }
                    await asyncio.wait([
                        player.send(json.dumps(state_message))
                        for player in room['players']
                        if player != websocket
                    ])
    
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        await unregister(websocket)

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

def run_http_server():
    """运行HTTP服务器"""
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, CustomHandler)
    logging.info("Starting HTTP server on port 8000...")
    httpd.serve_forever()

async def start_websocket_server():
    """启动WebSocket服务器"""
    async with websockets.serve(game_handler, '', 8001):
        logging.info("Starting WebSocket server on port 8001...")
        await asyncio.Future()  # 运行直到被取消

def main():
    # 启动HTTP服务器线程
    http_thread = threading.Thread(target=run_http_server)
    http_thread.daemon = True
    http_thread.start()
    
    try:
        # 运行WebSocket服务器
        asyncio.run(start_websocket_server())
    except KeyboardInterrupt:
        logging.info("Shutting down servers...")

if __name__ == '__main__':
    main()
