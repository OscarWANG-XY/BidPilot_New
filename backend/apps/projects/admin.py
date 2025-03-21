from django.contrib import admin
from .models import (
    Project, ProjectStage, Task,
    ProjectChangeHistory, StageChangeHistory, TaskChangeHistory
)

class ProjectStageInline(admin.TabularInline):
    model = ProjectStage
    extra = 0

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'project_name', 'tenderee', 'bidder', 'project_type', 
                   'bid_deadline', 'status', 'starred', 'current_active_stage', 'creator')
    list_filter = ('project_type', 'status', 'starred', 'current_active_stage')
    search_fields = ('project_name', 'tenderee', 'bidder')
    date_hierarchy = 'create_time'
    inlines = [ProjectStageInline]


class TaskInline(admin.TabularInline):
    model = Task
    extra = 0
    fields = ('name', 'type', 'status', 'lock_status', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(ProjectStage)
class ProjectStageAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'stage_type', 'name', 'stage_status', 'created_at', 'updated_at')
    list_filter = ('stage_type', 'stage_status')
    search_fields = ('name', 'description')
    inlines = [TaskInline]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'stage', 'name', 'type', 'status', 'lock_status', 'created_at', 'updated_at')
    list_filter = ('type', 'status', 'lock_status')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('stage', 'name', 'description', 'type')
        }),
        ('状态信息', {
            'fields': ('status', 'lock_status')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at')
        }),
        ('文档内容', {
            'fields': ('tiptap_content',),
            'classes': ('collapse',),
            'description': '仅对文档提取任务有意义的内容字段'
        })
    )


@admin.register(ProjectChangeHistory)
class ProjectChangeHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'field_name', 'old_value', 'new_value', 'changed_at', 'changed_by')
    list_filter = ('field_name', 'changed_by')
    search_fields = ('project__project_name', 'field_name', 'remarks')
    date_hierarchy = 'changed_at'

@admin.register(StageChangeHistory)
class StageChangeHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'stage', 'project', 'field_name', 'old_value', 'new_value', 'changed_at', 'changed_by')
    list_filter = ('field_name', 'changed_by')
    search_fields = ('stage__name', 'project__project_name', 'field_name', 'remarks')
    date_hierarchy = 'changed_at'

@admin.register(TaskChangeHistory)
class TaskChangeHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'stage', 'project', 'task_type', 'field_name', 'changed_at', 'changed_by')
    list_filter = ('task_type', 'field_name', 'changed_by', 'is_complex_field')
    search_fields = ('task__name', 'stage__name', 'project__project_name', 'field_name', 'remarks')
    date_hierarchy = 'changed_at'