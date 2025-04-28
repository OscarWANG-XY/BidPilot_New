import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()

class LLMStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get the token from the URL query parameters
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        query_params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        token = query_params.get('token', None)
        
        # Authenticate the user using the token
        if token:
            user = await self.get_user_from_token(token)
            if user:
                self.user = user
                self.room_name = self.scope['url_route']['kwargs']['room_name']
                self.room_group_name = f'chat_{self.room_name}'
                
                # Join room group
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                await self.accept()
                return
        
        # If authentication fails, close the connection
        await self.close()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message', '')
        
        # Process the message and start streaming LLM response
        # This is where you would integrate with your LLM service
        await self.start_llm_streaming(message)
    
    # Helper method to authenticate user from token
    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            # Verify the token
            access_token = AccessToken(token)
            user_id = access_token.payload.get('user_id')
            
            # Get the user
            return User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist):
            return None
    
    # Start streaming from LLM
    async def start_llm_streaming(self, message):
        # This is a placeholder for your actual LLM integration
        # You would call your LLM service here and stream the responses
        
        # Example of sending a streaming response
        # In a real implementation, you would call your LLM service
        # and stream the chunks as they arrive
        
        # Simulate streaming with a simple response
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
            import asyncio
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
