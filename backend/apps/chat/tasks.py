# 2. Celery Tasks (tasks.py)
from celery import shared_task
from .services import LLMService
from .models import Conversation, Message

@shared_task
def process_llm_response(conversation_id: int, message_id: int):
    # 1. 获取对话上下文
    conversation = Conversation.objects.get(id=conversation_id)
    messages = conversation.messages.order_by('created_at')
    
    # 2. 调用 LLM 服务
    llm_service = LLMService()
    response = llm_service.process_conversation(messages)
    
    # 3. 保存助手回复
    assistant_message = Message.objects.create(
        conversation_id=conversation_id,
        content=response['content'],
        role='assistant',
        metadata=response['metadata']
    )
    
    return MessageSerializer(assistant_message).data