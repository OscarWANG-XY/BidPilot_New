from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.urls import reverse
from tiptap_utils import TiptapUtils  # 导入上面创建的工具类

# 示例模型：文档模型
class Document(models.Model):
    """存储 TipTap 格式文档的模型"""
    
    title = models.CharField(_("标题"), max_length=255)
    content_json = models.TextField(_("文档内容(JSON)"), blank=True, default='{"type":"doc","content":[]}')
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        verbose_name=_("创建者"),
        on_delete=models.CASCADE, 
        related_name='documents'
    )
    
    class Meta:
        verbose_name = _("文档")
        verbose_name_plural = _("文档")
        ordering = ['-updated_at']
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('document_detail', kwargs={'pk': self.pk})
    
    def get_content(self):
        """获取解析后的 TipTap 文档内容"""
        try:
            return TiptapUtils.load_from_string(self.content_json)
        except Exception as e:
            return TiptapUtils.create_empty_document()
    
    def set_content(self, content):
        """设置 TipTap 文档内容"""
        if isinstance(content, dict):
            self.content_json = TiptapUtils.to_string(content)
        elif isinstance(content, str):
            # 假设已经是 JSON 字符串
            self.content_json = content
    
    def get_headings(self):
        """获取文档中的所有标题"""
        content = self.get_content()
        return TiptapUtils.get_headings(content)
    
    def get_toc(self, max_level=3):
        """获取文档目录结构"""
        content = self.get_content()
        return TiptapUtils.get_document_toc(content, max_level)
    
    def extract_text(self):
        """提取文档的纯文本内容"""
        content = self.get_content()
        result = []
        
        for node in content.get('content', []):
            result.append(TiptapUtils.extract_text_from_node(node))
        
        return '\n\n'.join(result)


# 示例模型：版本控制
class DocumentVersion(models.Model):
    """文档版本模型"""
    
    document = models.ForeignKey(
        Document, 
        verbose_name=_("文档"),
        on_delete=models.CASCADE, 
        related_name='versions'
    )
    version_number = models.PositiveIntegerField(_("版本号"))
    content_json = models.TextField(_("版本内容(JSON)"))
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        verbose_name=_("创建者"),
        on_delete=models.CASCADE, 
        related_name='document_versions'
    )
    
    class Meta:
        verbose_name = _("文档版本")
        verbose_name_plural = _("文档版本")
        ordering = ['-version_number']
        unique_together = [('document', 'version_number')]
    
    def __str__(self):
        return f"{self.document.title} v{self.version_number}"
    
    def get_content(self):
        """获取解析后的版本内容"""
        return TiptapUtils.load_from_string(self.content_json)


# 示例序列化器 (Django REST Framework)
from rest_framework import serializers

class DocumentSerializer(serializers.ModelSerializer):
    """文档序列化器"""
    
    content = serializers.JSONField(source='get_content', write_only=True)
    toc = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = ['id', 'title', 'content', 'content_json', 'toc', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_toc(self, obj):
        """获取文档目录"""
        return obj.get_toc()
    
    def validate_content(self, value):
        """验证 TipTap 内容结构"""
        if not TiptapUtils.validate_tiptap_structure(value):
            raise serializers.ValidationError("无效的 TipTap 文档结构")
        return value
    
    def create(self, validated_data):
        """创建文档"""
        content = validated_data.pop('get_content', None)
        document = super().create(validated_data)
        
        if content:
            document.set_content(content)
            document.save()
        
        return document
    
    def update(self, instance, validated_data):
        """更新文档"""
        content = validated_data.pop('get_content', None)
        document = super().update(instance, validated_data)
        
        if content:
            document.set_content(content)
            document.save()
        
        return document


# 示例视图 (Django REST Framework)
from rest_framework import viewsets, permissions

class DocumentViewSet(viewsets.ModelViewSet):
    """文档视图集"""
    
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取当前用户的文档"""
        return Document.objects.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        """创建文档时设置创建者"""
        serializer.save(created_by=self.request.user)


# 自定义 TipTap 功能视图
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

@login_required
@require_POST
def convert_docx_to_tiptap(request, document_id):
    """
    将上传的 DOCX 文件转换为 TipTap 格式并保存到文档
    
    这个视图假设:
    1. 您已经有了前面提交的 DocxParserPipeline 和 TiptapConverter
    2. 您使用了 Django 的文件上传功能
    """
    try:
        document = Document.objects.get(pk=document_id, created_by=request.user)
    except Document.DoesNotExist:
        return JsonResponse({'error': '文档不存在'}, status=404)
    
    if 'docx_file' not in request.FILES:
        return JsonResponse({'error': '未提供 DOCX 文件'}, status=400)
    
    docx_file = request.FILES['docx_file']
    
    try:
        # 保存上传的文件
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
            for chunk in docx_file.chunks():
                temp_file.write(chunk)
        
        file_path = temp_file.name
        
        # 使用 DocxParserPipeline 处理文件
        from .pipeline import DocxParserPipeline
        
        pipeline = DocxParserPipeline(file_path)
        tiptap_json = pipeline.load().parse().to_tiptap_json()
        
        # 更新文档内容
        document.content_json = tiptap_json
        document.save()
        
        # 清理临时文件
        os.unlink(file_path)
        
        return JsonResponse({'success': True, 'message': 'DOCX 文件已成功转换'})
        
    except Exception as e:
        return JsonResponse({'error': f'转换过程中出错: {str(e)}'}, status=500)


# 自定义管理命令示例
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = '将所有文档转换为指定格式'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            choices=['html', 'text'],
            default='html',
            help='指定输出格式'
        )
    
    def handle(self, *args, **options):
        output_format = options['format']
        documents = Document.objects.all()
        
        self.stdout.write(f"开始转换 {documents.count()} 个文档...")
        
        for document in documents:
            try:
                content = document.get_content()
                
                if output_format == 'html':
                    # 转换为 HTML
                    result = TiptapUtils.tiptap_to_html(content)
                else:
                    # 提取纯文本
                    result = document.extract_text()
                
                self.stdout.write(f"成功转换文档: {document.title}")
                
                # 这里可以进一步处理结果，例如保存到文件
                
            except Exception as e:
                self.stderr.write(f"转换文档 '{document.title}' 时出错: {e}")
        
        self.stdout.write(self.style.SUCCESS('转换完成!'))