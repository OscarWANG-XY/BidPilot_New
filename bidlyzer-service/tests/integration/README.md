# Tiptap Client 集成测试

本目录包含 TiptapClient 的集成测试，用于测试与真实 Tiptap 服务的交互。

## 运行测试

要运行集成测试，您需要:

1. 确保 Tiptap 服务正在运行并可访问
2. 设置环境变量启用集成测试

```bash
# 启用集成测试
export TIPTAP_INTEGRATION_TEST=true

# 可选: 指定 Tiptap 服务的 URL (默认为 http://localhost:3001)
export TIPTAP_SERVICE_URL=http://your-tiptap-service:3001

# 运行测试
pytest tests/integration/test_tiptap_client_integration.py -v
```

## 测试内容

集成测试验证以下功能:

1. **健康检查** - 验证 Tiptap 服务是否正常运行
2. **HTML 到 JSON 转换** - 测试将 HTML 转换为 Tiptap JSON 格式
3. **JSON 到 HTML 转换** - 测试将 Tiptap JSON 转换回 HTML
4. **Markdown 相关转换** - 测试 Markdown 与 HTML/JSON 之间的互相转换
5. **错误处理** - 验证无效输入时的错误处理
6. **复杂文档处理** - 测试含有多种元素的复杂文档转换
7. **性能测试** - 验证大型文档转换的性能

## 跳过集成测试

如果 `TIPTAP_INTEGRATION_TEST` 环境变量未设置为 `true`，所有测试将被跳过。这在 CI/CD 环境或无法访问 Tiptap 服务时非常有用。

## 调试

测试使用 Python 的标准日志模块记录信息。要查看更详细的日志，可以调整日志级别:

```bash
# 设置详细日志
export PYTHONPATH=.
python -m pytest tests/integration/test_tiptap_client_integration.py -v --log-cli-level=DEBUG
``` 