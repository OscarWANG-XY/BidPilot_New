from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Count, Max
from .models import ChatSession, ChatMessage
from .serializers import (
    ChatSessionSerializer,
    ChatSessionListSerializer,
    ChatMessageSerializer,
    ChatMessageCreateSerializer
)
from .tasks import process_chat_message_task, batch_process_messages_task
import logging
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiTypes

logger = logging.getLogger(__name__)

@extend_schema_view(
    list=extend_schema(
        tags=['chat'],
        summary='获取会话列表',
        description='获取当前用户的所有聊天会话列表，按最后消息时间倒序排列。包含每个会话的基本信息和最后一条消息。',
        responses={
            200: ChatSessionListSerializer(many=True),
            401: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value=[{
                    'id': 'uuid',
                    'title': '新会话',
                    'message_count': 10,
                    'last_message_time': '2024-03-20T10:00:00Z',
                    'created_at': '2024-03-20T09:00:00Z',
                    'created_by': {
                        'id': 'uuid',
                        'phone': '13800138000'
                    }
                }]
            )
        ]
    ),
    create=extend_schema(
        tags=['chat'],
        summary='创建会话',
        description='创建一个新的聊天会话。',
        request=ChatSessionSerializer,
        responses={
            201: ChatSessionSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['chat'],
        summary='获取会话详情',
        description='获取指定聊天会话的详细信息。',
        responses={
            200: ChatSessionSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    update=extend_schema(
        tags=['chat'],
        summary='更新会话',
        description='更新指定聊天会话的信息。',
        request=ChatSessionSerializer,
        responses={
            200: ChatSessionSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    partial_update=extend_schema(
        tags=['chat'],
        summary='部分更新会话',
        description='部分更新指定聊天会话的信息。',
        request=ChatSessionSerializer,
        responses={
            200: ChatSessionSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    destroy=extend_schema(
        tags=['chat'],
        summary='删除会话',
        description='删除指定的聊天会话及其所有消息。',
        responses={
            204: None,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    clear_history=extend_schema(
        tags=['chat'],
        summary='清除会话历史',
        description='清除指定会话的所有聊天记录，但保留会话本身。',
        responses={
            200: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'status': 'success',
                    'deleted_messages': 10
                }
            )
        ]
    )
)
class ChatSessionViewSet(viewsets.ModelViewSet):
    """聊天会话的视图集"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer
    
    def get_queryset(self):
        """获取当前用户的会话列表"""
        logger.info(f"用户 {self.request.user.phone} 获取会话列表")
        return ChatSession.objects.filter(
            created_by=self.request.user
        ).annotate(
            message_count=Count('chatmessage'),
            last_message_time=Max('chatmessage__created_at')
        ).order_by('-last_message_time')
    
    def get_serializer_class(self):
        """根据动作选择合适的序列化器"""
        if self.action == 'list':
            return ChatSessionListSerializer
        return ChatSessionSerializer
    
    @action(detail=True, methods=['post'])
    def clear_history(self, request, pk=None):
        """清除会话历史"""
        session = self.get_object()
        logger.info(f"用户 {request.user.phone} 清除会话 {pk} 的历史记录")
        try:
            # 删除会话相关的所有消息
            deleted_count = session.chatmessage_set.all().delete()[0]
            logger.info(f"成功删除 {deleted_count} 条消息")
            return Response({
                'status': 'success',
                'deleted_messages': deleted_count
            })
        except Exception as e:
            logger.error(f"清除会话历史失败: {str(e)}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema_view(
    list=extend_schema(
        tags=['chat'],
        summary='获取消息列表',
        description='获取指定会话的所有聊天消息，按序号升序排列。',
        responses={
            200: ChatMessageSerializer(many=True),
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    create=extend_schema(
        tags=['chat'],
        summary='发送消息',
        description='在指定会话中发送新消息，并异步处理AI响应。',
        request=ChatMessageCreateSerializer,
        responses={
            202: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'status': 'processing',
                    'message_id': 'uuid',
                    'sequence': 1
                }
            )
        ]
    ),
    retrieve=extend_schema(
        tags=['chat'],
        summary='获取消息详情',
        description='获取指定的单条聊天消息详情。',
        responses={
            200: ChatMessageSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    batch_create=extend_schema(
        tags=['chat'],
        summary='批量发送消息',
        description='在指定会话中批量发送多条消息，并异步处理AI响应。',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'messages': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'content': {'type': 'string'}
                            }
                        }
                    }
                }
            }
        },
        responses={
            202: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'status': 'processing',
                    'messages': [{
                        'message_id': 'uuid',
                        'sequence': 1,
                        'content': '消息内容'
                    }]
                }
            )
        ]
    )
)
class ChatMessageViewSet(mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin,
                        mixins.ListModelMixin,
                        viewsets.GenericViewSet):
    """聊天消息的视图集"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """获取当前会话的消息列表"""
        session_id = self.kwargs.get('session_pk')
        logger.info(f"用户 {self.request.user.phone} 获取会话 {session_id} 的消息列表")
        return ChatMessage.objects.filter(
            session_id=session_id,
            session__created_by=self.request.user
        ).order_by('sequence')
    
    def get_serializer_class(self):
        """根据动作选择合适的序列化器"""
        if self.action == 'create':
            return ChatMessageCreateSerializer
        return ChatMessageSerializer
    
    def create(self, request, session_pk=None):
        """创建新消息并触发异步处理"""
        try:
            logger.info(f"用户 {request.user.phone} 在会话 {session_pk} 中发送新消息")
            session = get_object_or_404(
                ChatSession, 
                id=session_pk, 
                created_by=request.user
            )
            
            # 创建用户消息
            serializer = self.get_serializer(data={
                **request.data,
                'session': session.id,
                'role': 'user'  # 强制设置为用户消息
            })
            serializer.is_valid(raise_exception=True)
            user_message = serializer.save(session=session)
            logger.info(f"消息创建成功，序号: {user_message.sequence}")
            
            # 异步处理消息
            process_chat_message_task.delay(
                session_id=str(session.id),
                content=user_message.content,
                user_phone=request.user.phone
            )
            logger.info(f"已触发异步消息处理任务")
            
            return Response({
                'status': 'processing',
                'message_id': user_message.id,
                'sequence': user_message.sequence
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            logger.error(f"创建消息失败: {str(e)}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def batch_create(self, request, session_pk=None):
        """批量创建消息"""
        try:
            logger.info(f"用户 {request.user.phone} 在会话 {session_pk} 中批量发送消息")
            session = get_object_or_404(
                ChatSession, 
                id=session_pk, 
                created_by=request.user
            )
            
            # 验证消息列表
            messages = request.data.get('messages', [])
            if not isinstance(messages, list):
                logger.warning("收到的消息格式错误，不是列表类型")
                return Response({
                    'status': 'error',
                    'message': 'Messages must be a list'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            created_messages = []
            for msg_data in messages:
                serializer = self.get_serializer(data={
                    **msg_data,
                    'session': session.id,
                    'role': 'user'
                })
                serializer.is_valid(raise_exception=True)
                msg = serializer.save()
                created_messages.append({
                    'message_id': msg.id,
                    'sequence': msg.sequence,
                    'content': msg.content
                })
            
            logger.info(f"成功创建 {len(created_messages)} 条消息")
            
            batch_process_messages_task.delay(
                messages=[{
                    'session_id': str(session.id),
                    'content': msg['content']
                } for msg in created_messages],
                user_phone=request.user.phone
            )
            logger.info("已触发批量消息处理任务")
            
            return Response({
                'status': 'processing',
                'messages': created_messages
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            logger.error(f"批量创建消息失败: {str(e)}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)