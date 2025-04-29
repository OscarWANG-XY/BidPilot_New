import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio

class LLMStreamConsumer(AsyncWebsocketConsumer):

    # connect 方法在建立连接时被触发 
    async def connect(self):
        # The authentication is now handled by JWTAuthMiddleware
        # We can access the authenticated user via self.scope['user']
        if not self.scope['user'].is_anonymous:
            self.user = self.scope['user']
            self.room_name = self.scope['url_route']['kwargs']['room_name']
            self.room_group_name = f'chat_{self.room_name}'
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            # If user is not authenticated, close the connection
            await self.close()
    

    # disconnect 方法在连接关闭时被触发 
    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    
    # receive 方法在接收到消息时被触发 
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message', '')
        
        # Process the message and start streaming LLM response
        await self.start_llm_streaming(message)
    
    # Start streaming from LLM
    async def start_llm_streaming(self, message):
        # This is a placeholder for your actual LLM integration
        # You would call your LLM service here and stream the responses
        
        # Example of sending a streaming response
        chunks = [
            "I'm ", "processing ", "your ", "request ", "about ", 
            f'"{message}" ', "and ", "will ", "respond ", "shortly."
        ]
        
        for chunk in chunks:
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'llm_response',
                    'message': chunk,
                    'is_final': chunk == chunks[-1]
                }
            )
            
            # In a real implementation, you might want to add a small delay
            # to simulate the streaming effect
            await asyncio.sleep(0.1)
    
    # Receive message from room group
    async def llm_response(self, event):
        message = event['message']
        is_final = event.get('is_final', False)
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'is_final': is_final
        }))



