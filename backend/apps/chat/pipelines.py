# 5. Message Processing Pipeline (pipelines.py)
class MessageProcessingPipeline:
    def __init__(self):
        self.context_provider = ConversationContextProvider()
        self.llm_service = LLMService()
    
    async def process_message(self, conversation_id: int, content: str):
        # 1. 获取对话上下文
        context = self.context_provider.get_context(conversation_id)
        
        # 2. 创建用户消息
        user_message = await self._create_message(
            conversation_id, 
            content, 
            'user'
        )
        
        # 3. 更新上下文
        context = self.context_provider.update_context(context, user_message)
        
        # 4. 处理 LLM 响应
        response = await self.llm_service.process_conversation(context.messages)
        
        # 5. 保存助手回复
        assistant_message = await self._create_message(
            conversation_id,
            response['content'],
            'assistant',
            response['metadata']
        )
        
        return {
            'user_message': user_message,
            'assistant_message': assistant_message
        }