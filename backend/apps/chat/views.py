from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer
from .tasks import process_message_task

# Create your views here.

class ChatSessionViewSet(viewsets.ModelViewSet):
    queryset = ChatSession.objects.all()
    serializer_class = ChatSessionSerializer

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = ChatSession.objects.create()
        return Response(
            self.get_serializer(session).data,
            status=status.HTTP_201_CREATED
        )

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer

    def create(self, request):
        # 验证 session_id
        session = ChatSession.objects.get(session_id=request.data['session_id'])
        
        # 验证消息内容
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 创建用户消息
        user_message = ChatMessage.objects.create(
            session=session,
            content=serializer.validated_data['content'],
            role='user'
        )

        # 触发异步处理
        task = process_message_task.delay(user_message.id)
        return Response(
            {"task_id": task.id},
            status=status.HTTP_202_ACCEPTED
        )
