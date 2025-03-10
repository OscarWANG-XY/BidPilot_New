from django.contrib import admin
from .models import (
    Project, ProjectStage, BaseTask, DocxExtractionTask, 
    DocxTreeBuildTask, ProjectHistory
)

class ProjectStageInline(admin.TabularInline):
    model = ProjectStage
    extra = 0

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'project_name', 'tenderee', 'bidder', 'project_type', 
                   'bid_deadline', 'status', 'is_urgent', 'current_active_stage', 'creator')
    list_filter = ('project_type', 'status', 'is_urgent', 'current_active_stage')
    search_fields = ('project_name', 'tenderee', 'bidder')
    date_hierarchy = 'create_time'
    inlines = [ProjectStageInline]

class BaseTaskInline(admin.TabularInline):
    model = BaseTask
    extra = 0

class DocxExtractionTaskInline(admin.TabularInline):
    model = DocxExtractionTask
    extra = 0

class DocxTreeBuildTaskInline(admin.TabularInline):
    model = DocxTreeBuildTask
    extra = 0

@admin.register(ProjectStage)
class ProjectStageAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'stage_type', 'name', 'stage_status', 'created_at', 'updated_at')
    list_filter = ('stage_type', 'stage_status')
    search_fields = ('name', 'description')
    inlines = [BaseTaskInline, DocxExtractionTaskInline, DocxTreeBuildTaskInline]

@admin.register(BaseTask)
class BaseTaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'stage', 'name', 'type', 'status', 'created_at', 'updated_at')
    list_filter = ('type', 'status')
    search_fields = ('name', 'description')

@admin.register(DocxExtractionTask)
class DocxExtractionTaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'stage', 'name', 'type', 'status', 'created_at', 'updated_at')
    list_filter = ('type', 'status')
    search_fields = ('name', 'description')

@admin.register(DocxTreeBuildTask)
class DocxTreeBuildTaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'stage', 'name', 'type', 'status', 'created_at', 'updated_at')
    list_filter = ('type', 'status')
    search_fields = ('name', 'description')

@admin.register(ProjectHistory)
class ProjectHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'from_stage', 'to_stage', 'from_status', 'to_status', 'operation_time')
    list_filter = ('from_stage', 'to_stage', 'from_status', 'to_status')
    search_fields = ('project__project_name', 'remarks')
    date_hierarchy = 'operation_time'
