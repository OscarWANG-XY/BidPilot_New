# API映射文档

本文档记录了前端组件与后端API之间的映射关系，帮助开发者快速了解系统交互流程。

## 如何使用本文档

- 查找前端组件对应的后端API：通过组件名或功能搜索
- 了解API调用流程：每个API包含完整的前后端流程
- 更新方式：通过`tools/update_api_docs.py`脚本自动更新

## 项目管理APIs

### 项目列表

- **端点**: `GET /api/projects/`
- **前端**: 
  - Hook: `hooks/useProjects.ts` -> `projectsQuery(params)`
  - API: `api/projects_api.ts` -> `getAllProjects(params)`
- **后端**:
  - View: `views.py` -> `ProjectViewSet.list()`
  - Serializer: `serializers.py` -> `ProjectListSerializer`
- **查询参数**:
  - `current_stage`: 项目当前阶段
  - `project_type`: 项目类型
  - `is_urgent`: 是否紧急
  - `search`: 搜索关键词
  - `ordering`: 排序字段
- **数据流**:
  - 前端调用 `projectsQuery(params)` -> `getAllProjects(params)` -> 向 `/api/projects/` 发起GET请求 -> 
    后端 `ProjectViewSet.list()` 处理请求 -> 使用 `ProjectListSerializer` 序列化数据 -> 
    返回项目列表数据 -> 前端更新状态

### 项目详情

- **端点**: `GET /api/projects/{id}/`
- **前端**: 
  - Hook: `hooks/useProjects.ts` -> `singleProjectQuery(projectId)`
  - API: `api/projects_api.ts` -> `getProjectById(projectId)`
- **后端**:
  - View: `views.py` -> `ProjectViewSet.retrieve()`
  - Serializer: `serializers.py` -> `ProjectDetailSerializer`
- **数据流**:
  - 用户点击项目 -> 前端调用 `singleProjectQuery(projectId)` -> `getProjectById(projectId)` -> 
    向 `/api/projects/{id}/` 发起GET请求 -> 后端 `ProjectViewSet.retrieve()` 处理请求 -> 
    使用 `ProjectDetailSerializer` 序列化数据 -> 返回项目详情数据 -> 前端更新状态并显示详情

### 创建项目

- **端点**: `POST /api/projects/`
- **前端**: 
  - Hook: `hooks/useProjects.ts` -> `createProject.mutateAsync(newProject)`
  - API: `api/projects_api.ts` -> `createProject(project)`
- **后端**:
  - View: `views.py` -> `ProjectViewSet.create()`
  - Serializer: `serializers.py` -> `ProjectCreateSerializer`
- **数据流**:
  - 用户填写表单 -> 提交 -> 前端调用 `createProject.mutateAsync(newProject)` -> `createProject(project)` -> 
    向 `/api/projects/` 发起POST请求 -> 后端 `ProjectViewSet.create()` 处理请求 -> 
    使用 `ProjectCreateSerializer` 验证数据 -> 创建项目 -> 返回新项目数据 -> 
    前端更新缓存并显示成功信息

### 更新项目

- **端点**: `PATCH /api/projects/{id}/`
- **前端**: 
  - Hook: `hooks/useProjects.ts` -> `updateProject.mutateAsync({projectId, projectData})`
  - API: `api/projects_api.ts` -> `updateProject(projectId, projectData)`
- **后端**:
  - View: `views.py` -> `ProjectViewSet.partial_update()`
  - Serializer: `serializers.py` -> `ProjectUpdateSerializer`
- **数据流**:
  - 用户修改项目信息 -> 提交 -> 前端调用 `updateProject.mutateAsync({projectId, projectData})` -> 
    `updateProject(projectId, projectData)` -> 向 `/api/projects/{id}/` 发起PATCH请求 -> 
    后端 `ProjectViewSet.partial_update()` 处理请求 -> 使用 `ProjectUpdateSerializer` 验证数据 -> 
    更新项目 -> 返回更新后数据 -> 前端更新缓存

## 项目状态管理APIs

### 更新项目状态

- **端点**: `PATCH /api/projects/{id}/update_stage/`
- **前端**: 
  - Hook: `hooks/useProjects.ts` -> `updateProjectStage.mutateAsync(request)`
  - API: `api/projects_api.ts` -> `updateProjectStage(request)`
- **后端**:
  - View: `views.py` -> `ProjectViewSet.update_stage()`
  - Serializer: `serializers.py` -> `ProjectStageUpdateSerializer`
- **数据流**:
  - 用户选择新状态 -> 提交 -> 前端调用 `updateProjectStage.mutateAsync(request)` -> 
    `updateProjectStage(request)` -> 向 `/api/projects/{id}/update_stage/` 发起PATCH请求 -> 
    后端 `ProjectViewSet.update_stage()` 处理请求 -> 使用 `ProjectStageUpdateSerializer` 验证数据 -> 
    更新项目状态 -> 创建状态历史记录 -> 返回更新后数据 -> 前端更新缓存

### 获取项目历史记录

- **端点**: `GET /api/projects/{id}/histories/`
- **前端**: 
  - Hook: `hooks/useProjects.ts` -> `projectHistoryQuery(projectId)`
  - API: `api/projects_api.ts` -> `getProjectHistory(projectId)`
- **后端**:
  - View: `views.py` -> `ProjectViewSet.histories()`
  - Serializer: `serializers.py` -> `ProjectHistorySerializer`
- **数据流**:
  - 前端调用 `projectHistoryQuery(projectId)` -> `getProjectHistory(projectId)` -> 
    向 `/api/projects/{id}/histories/` 发起GET请求 -> 后端 `ProjectViewSet.histories()` 处理请求 -> 
    使用 `ProjectHistorySerializer` 序列化数据 -> 返回项目历史记录 -> 前端更新状态

### 删除项目

- **端点**: `DELETE /api/projects/{id}/`
- **前端**: 
  - Hook: `hooks/useProjects.ts` -> `deleteProject.mutateAsync(projectId)`
  - API: `api/projects_api.ts` -> `deleteProject(projectId)`
- **后端**:
  - View: `views.py` -> `ProjectViewSet.destroy()`
- **数据流**:
  - 用户确认删除 -> 前端调用 `deleteProject.mutateAsync(projectId)` -> `deleteProject(projectId)` -> 
    向 `/api/projects/{id}/` 发起DELETE请求 -> 后端 `ProjectViewSet.destroy()` 处理请求 -> 
    验证项目状态是否为已取消 -> 删除项目 -> 返回成功状态 -> 前端更新缓存


## 项目阶段管理APIs

### 获取项目阶段列表

### 创建项目阶段

### 更新项目阶段

### 删除项目阶段(不存在)

### 获取项目阶段详情



