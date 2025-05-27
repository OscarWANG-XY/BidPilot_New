# Structuring Agent 文档管理端点

本文档介绍了为 structuring agent 新增的三个文档管理端点，用于支持前端编辑器的文档加载、编辑和版本对比功能。

## 端点概览

| 端点 | 方法 | 路径 | 功能 |
|------|------|------|------|
| 获取文档 | GET | `/api/v1/structuring/document/{project_id}` | 获取指定类型的文档供编辑器加载 |
| 提交编辑 | PUT | `/api/v1/structuring/document/{project_id}/edit` | 保存用户编辑后的文档 |
| 版本对比 | GET | `/api/v1/structuring/document/{project_id}/compare` | 对比两个版本的文档差异 |

## 详细说明

### 1. 获取文档端点

**端点**: `GET /api/v1/structuring/document/{project_id}`

**功能**: 获取指定类型的文档内容，供前端编辑器加载和显示。

**参数**:
- `project_id` (路径参数): 项目ID
- `doc_type` (查询参数): 文档类型，默认为 "intro"

**支持的文档类型**:
- `raw`: 原始提取的文档
- `h1`: 一级标题分析后的文档
- `h2h3`: 二三级标题分析后的文档
- `intro`: 添加引言后的文档（推荐用于编辑）
- `final`: 最终编辑完成的文档

**请求示例**:
```bash
GET /api/v1/structuring/document/project_123?doc_type=intro
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "成功获取 intro 文档",
  "project_id": "project_123",
  "doc_type": "intro",
  "document": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 1},
        "content": [{"type": "text", "text": "项目标题"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "文档内容..."}]
      }
    ]
  },
  "metadata": {
    "doc_type": "intro",
    "project_id": "project_123",
    "retrieved_at": "2024-01-01T12:00:00Z",
    "document_size": 1024,
    "current_state": "awaiting_editing",
    "progress": 100,
    "last_updated": "2024-01-01T11:55:00Z"
  }
}
```

**状态码**:
- `200`: 成功获取文档
- `202`: 文档正在处理中，请稍后重试
- `400`: 无效的文档类型
- `404`: 项目未找到或文档不可用
- `500`: 服务器错误

### 2. 提交编辑端点

**端点**: `PUT /api/v1/structuring/document/{project_id}/edit`

**功能**: 保存用户在编辑器中修改后的文档内容。

**参数**:
- `project_id` (路径参数): 项目ID

**请求体**:
```json
{
  "document": {
    "type": "doc",
    "content": [
      // TipTap JSON 格式的文档内容
    ]
  },
  "user_notes": "用户编辑备注（可选）",
  "save_as_final": true
}
```

**请求示例**:
```bash
PUT /api/v1/structuring/document/project_123/edit
Authorization: Bearer <token>
Content-Type: application/json

{
  "document": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 1},
        "content": [{"type": "text", "text": "修改后的标题"}]
      },
      {
        "type": "paragraph",
        "content": [{"type": "text", "text": "修改后的内容..."}]
      }
    ]
  },
  "user_notes": "调整了标题和部分内容",
  "save_as_final": true
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "文档已成功保存为 final 版本",
  "project_id": "project_123",
  "doc_type": "final",
  "saved_at": "2024-01-01T12:30:00Z"
}
```

**状态码**:
- `200`: 成功保存文档
- `400`: 当前状态不允许编辑
- `500`: 保存失败

**行为说明**:
- 如果 `save_as_final` 为 `true` 且当前状态为 `awaiting_editing`，会自动触发完成编辑操作
- 文档会同时保存到 Redis 缓存中，设置15分钟过期时间
- 会通过 SSE 推送状态更新事件

### 3. 版本对比端点

**端点**: `GET /api/v1/structuring/document/{project_id}/compare`

**功能**: 对比两个版本的文档，帮助用户了解编辑前后的变化。

**参数**:
- `project_id` (路径参数): 项目ID
- `source` (查询参数): 源文档类型，默认为 "intro"
- `target` (查询参数): 目标文档类型，默认为 "final"

**请求示例**:
```bash
GET /api/v1/structuring/document/project_123/compare?source=intro&target=final
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "成功对比文档 intro 和 final",
  "project_id": "project_123",
  "source_type": "intro",
  "target_type": "final",
  "source_document": {
    // 源文档内容
  },
  "target_document": {
    // 目标文档内容
  },
  "comparison_metadata": {
    "source_type": "intro",
    "target_type": "final",
    "compared_at": "2024-01-01T12:45:00Z",
    "source_size": 1024,
    "target_size": 1156,
    "size_difference": 132,
    "similarity_ratio": 0.85
  }
}
```

**状态码**:
- `200`: 成功对比文档
- `400`: 无效的文档类型或相同的源目标文档
- `404`: 文档不存在
- `500`: 对比失败

## 使用流程

### 典型的编辑流程

1. **检查状态**: 调用 `/status/{project_id}` 确认项目状态
2. **获取文档**: 调用 `/document/{project_id}?doc_type=intro` 获取待编辑文档
3. **用户编辑**: 在前端编辑器中修改文档内容
4. **保存文档**: 调用 `/document/{project_id}/edit` 提交编辑结果
5. **版本对比**: 可选调用 `/document/{project_id}/compare` 查看编辑差异

### 前端集成示例

```typescript
// 1. 获取文档
const getDocument = async (projectId: string, docType: string = 'intro') => {
  const response = await fetch(`/api/v1/structuring/document/${projectId}?doc_type=${docType}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// 2. 保存编辑
const saveDocument = async (projectId: string, document: any, userNotes?: string) => {
  const response = await fetch(`/api/v1/structuring/document/${projectId}/edit`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      document,
      user_notes: userNotes,
      save_as_final: true
    })
  });
  return await response.json();
};

// 3. 对比版本
const compareDocuments = async (projectId: string, source: string, target: string) => {
  const response = await fetch(`/api/v1/structuring/document/${projectId}/compare?source=${source}&target=${target}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

## 错误处理

### 常见错误及处理方式

1. **文档正在处理中 (202)**:
   - 等待几秒后重试
   - 通过 SSE 监听状态更新

2. **文档不存在 (404)**:
   - 检查项目状态
   - 确认分析流程是否完成

3. **状态不允许编辑 (400)**:
   - 检查当前项目状态
   - 等待到达 `awaiting_editing` 状态

4. **保存失败 (500)**:
   - 检查文档格式是否正确
   - 重试保存操作

## 测试

使用提供的测试脚本进行端点测试：

```bash
# 基本测试
python test_document_endpoints.py

# 使用示例数据测试
python test_document_endpoints.py sample
```

测试前请确保：
1. FastAPI 服务正在运行
2. 设置正确的测试 token
3. 测试项目 ID 存在

## 注意事项

1. **认证**: 所有端点都需要 JWT token 认证
2. **缓存**: 文档存储在 Redis 中，有15分钟过期时间
3. **状态检查**: 编辑操作会检查项目当前状态
4. **SSE 集成**: 保存操作会触发 SSE 状态更新事件
5. **错误处理**: 提供详细的错误信息和状态码

## 扩展功能

未来可以考虑的扩展功能：

1. **多版本管理**: 支持保存多个编辑版本
2. **增量保存**: 支持自动保存草稿
3. **协作编辑**: 支持多用户同时编辑
4. **详细对比**: 提供更精确的文档差异算法
5. **历史记录**: 保存编辑历史和回滚功能 