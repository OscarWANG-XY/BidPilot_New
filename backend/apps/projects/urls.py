from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, 
)


#以下是嵌套路由的推导过程：
# router.register('', ...) → /projects/   （注意：这里注册的'projects'，是config/urls.py 中注册的'projects'）
# NestedDefaultRouter(router, 'projects', lookup='project') → /projects/{project_pk}/
# register('stages', ...) → /projects/{project_pk}/stages/

#basename 是 URL 名称的"前缀"，方便你在视图、模板、前端中通过名称引用路由，不影响路径结构，但对 reverse() 和超链接字段非常关键。
# 动作	     URL 名称	                 对应路径
# list	    project-stages-list	        /projects/{project_pk}/stages/
# detail	project-stages-detail	    /projects/{project_pk}/stages/{pk}/


router = DefaultRouter()

# router.register的第一个参数''代表着，以api/projects/的请求(/api/projects/来自config/urls.py)，都由ProjectViewSet处理。 
# 这个得到：GET ../projects/，  RETRIEVE ../projects/{pk}
router.register('', ProjectViewSet, basename='project') 



# ------------ 添加嵌套路由URLs ------------
urlpatterns = [
    path('', include(router.urls)),
]