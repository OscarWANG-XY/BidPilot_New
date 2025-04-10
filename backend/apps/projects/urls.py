from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers  # 嵌套路由
from .views import (
    ProjectViewSet, 
    ProjectStageViewSet, 
    TaskViewSet,
    ProjectChangeHistoryViewSet, 
    StageChangeHistoryViewSet, 
    TaskChangeHistoryViewSet,
    test_sse,
)


#以下是嵌套路由的推导过程：
# router.register('', ...) → /projects/   （注意：这里注册的'projects'，是config/urls.py 中注册的'projects'）
# NestedDefaultRouter(router, 'projects', lookup='project') → /projects/{project_pk}/
# register('stages', ...) → /projects/{project_pk}/stages/

#basename 是 URL 名称的“前缀”，方便你在视图、模板、前端中通过名称引用路由，不影响路径结构，但对 reverse() 和超链接字段非常关键。
# 动作	     URL 名称	                 对应路径
# list	    project-stages-list	        /projects/{project_pk}/stages/
# detail	project-stages-detail	    /projects/{project_pk}/stages/{pk}/


router = DefaultRouter()

# router.register的第一个参数''代表着，以api/projects/的请求(/api/projects/来自config/urls.py)，都由ProjectViewSet处理。 
# 这个得到：GET ../projects/，  RETRIEVE ../projects/{pk}
router.register('', ProjectViewSet, basename='project') 

# 添加非嵌套路由器 - 历史记录
router.register('projects/change-history', ProjectChangeHistoryViewSet, basename='project-change-history')
router.register('stages/change-history', StageChangeHistoryViewSet, basename='stage-change-history')
router.register('tasks/change-history', TaskChangeHistoryViewSet, basename='task-change-history')


# ----------- 添加嵌套路由器 -----------
# 注意： NestedDefaultRouter 的第一个参数是父路由器，第二个参数是父路由器的路径，第三个参数是lookup 
# 第二各参数的路径和上面router.register的''对应
# lookup='project' 表示我们将使用路径参数 {project_pk}；所以生成的基础嵌套前缀路径为：/projects/{project_pk}/
# 所以，stage_router.register的第一个参数'stages'代表着，所有以projects/{project_pk}/stages/的请求，都由ProjectStageViewSet处理。 
# 这个得到：GET   ../stages/，  RETRIEVE ../stages/{pk} 
stage_router = routers.NestedDefaultRouter(router, '', lookup='project')
stage_router.register('stages', ProjectStageViewSet, basename='project-stages')

# 为TaskViewSet添加嵌套路由 
# 注意： 'stages' 是ProjectStageViewSet的实际路径（上一级的实际路径，与上面stage_router.register注册的路径名对应）
task_router = routers.NestedDefaultRouter(stage_router, 'stages', lookup='stage')
task_router.register('tasks', TaskViewSet, basename='stage-tasks')


# ------------ 添加嵌套路由URLs ------------
urlpatterns = [
    path('test-sse/', test_sse, name='test-sse'),  # 添加SSE测试路由
    path('', include(router.urls)),
    path('', include(stage_router.urls)),  # 添加嵌套路由URLs
    path('', include(task_router.urls)),  # 添加嵌套路由URLs
]




# 添加面向tiptap微服务的导入
from .tiptap.api import (
    html_to_json, json_to_html, 
    markdown_to_json, json_to_markdown,
    tiptap_health
)

# 添加到 urlpatterns
tiptap_urlpatterns = [
    path('tiptap/html-to-json', html_to_json, name='html_to_json'),
    path('tiptap/json-to-html', json_to_html, name='json_to_html'),
    path('tiptap/markdown-to-json', markdown_to_json, name='markdown_to_json'),
    path('tiptap/json-to-markdown', json_to_markdown, name='json_to_markdown'),
    path('tiptap/health', tiptap_health, name='tiptap_health'),
]

# 将 tiptap_urlpatterns 添加到主 urlpatterns
urlpatterns += tiptap_urlpatterns