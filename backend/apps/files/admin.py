from django.contrib import admin
from .models import FileRecord, FileProjectLink

@admin.register(FileRecord)
class FileRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'type', 'size', 'owner', 'created_at', 'processing_status']
    list_filter = ['type', 'processing_status']
    search_fields = ['name', 'owner__phone']
    readonly_fields = ['created_at', 'created_by', 'updated_at', 'updated_by', 'version']
    
@admin.register(FileProjectLink)
class FileProjectLinkAdmin(admin.ModelAdmin):
    list_display = ['id', 'file_record', 'project', 'link_type', 'is_deleted']
    list_filter = ['link_type', 'is_deleted']
    search_fields = ['file_record__name', 'project__name']
