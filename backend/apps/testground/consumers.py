import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({
            'message': '连接成功！WebSocket 工作正常。'
        }))
    
    async def disconnect(self, close_code):
        pass
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message', '')
        
        await self.send(text_data=json.dumps({
            'message': f'收到消息: {message}'
        }))


import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SimpleTestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("SimpleTestConsumer: Connection attempt")
        await self.accept()
        print("SimpleTestConsumer: Connection accepted")
    
    async def disconnect(self, close_code):
        print(f"SimpleTestConsumer: Disconnected with code {close_code}")
    
    async def receive(self, text_data):
        print(f"SimpleTestConsumer: Received message: {text_data}")
        await self.send(text_data=json.dumps({
            'message': f'Echo: {text_data}'
        }))

from channels.generic.websocket import WebsocketConsumer
import logging

logger = logging.getLogger(__name__)

class BasicConsumer(WebsocketConsumer):
    def connect(self):
        logger.info("BasicConsumer: Connection attempt")
        print("BasicConsumer: Connection attempt")
        # 无条件接受所有连接
        self.accept()
        logger.info("BasicConsumer: Connection accepted")
        print("BasicConsumer: Connection accepted")
    
    def disconnect(self, close_code):
        logger.info(f"BasicConsumer: Disconnected with code {close_code}")
        print(f"BasicConsumer: Disconnected with code {close_code}")
    
    def receive(self, text_data):
        logger.info(f"BasicConsumer: Received: {text_data}")
        print(f"BasicConsumer: Received: {text_data}")
        self.send(text_data=f"Echo: {text_data}")