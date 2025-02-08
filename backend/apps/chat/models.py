from django.db import models
from django.conf import settings
from django.db.models import Max
import uuid

# Create your models here.

# 聊天会话模型
# updated at 建议保留，记录最后一次交互时间，可以用来处理过去会话，会话排序等作用。
class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='chat_sessions',
        verbose_name='创建者'
        )

    # 后续可扩展用户关联、上下文设置等字段



# 聊天消息模型, 与聊天会话关联， 一个会话对多个消息。  
# 如果聊天会话有创建者，则消息可不添加，除非涉及多人聊天的场景。 
class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    sequence = models.PositiveIntegerField(db_index=True)  # 可选：在对话内的序号
    content = models.TextField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    # 后续可扩展元数据、处理状态等字段

    class Meta:
        ordering = ['session_id', 'created_at']


    def save(self, *args, **kwargs):
        if not self.sequence:
            # 获取当前对话中最大的序号
            max_sequence = ChatMessage.objects.filter(
                session=self.session
            ).aggregate(Max('sequence'))['sequence__max'] or 0
            self.sequence = max_sequence + 1
        super().save(*args, **kwargs)