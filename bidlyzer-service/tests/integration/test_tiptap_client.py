import pytest
import os
import asyncio
from app.tiptap.client import TiptapClient
import logging
from ..conftest import skip_if_no_tiptap

logger = logging.getLogger(__name__)

# 添加标记，使其可以通过pytest -m tiptap运行
pytestmark = [pytest.mark.integration, pytest.mark.tiptap]

@pytest.fixture(scope="session")
def tiptap_service_url():
    """从环境变量获取Tiptap服务URL"""
    return os.getenv("TIPTAP_SERVICE_URL", "http://localhost:3001")

@pytest.fixture
def tiptap_client(tiptap_service_url):
    """创建一个真实的TiptapClient实例"""
    logger.info(f"创建TiptapClient实例，连接到 {tiptap_service_url}")
    return TiptapClient(base_url=tiptap_service_url)


@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_health_check(tiptap_client):
    """测试健康检查"""
    is_healthy = await tiptap_client.health_check()
    assert is_healthy, "Tiptap服务应该处于健康状态"

@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_html_to_json_integration(tiptap_client):
    """测试HTML到JSON的转换"""
    html = "<p>Hello <strong>World</strong>!</p>"
    result = await tiptap_client.html_to_json(html)
    
    # 验证结果格式和内容 这个验证结构式根据tiptap JSON格式来的。
    # 在测试时，我们假设返回的就直接时tiptap JSON格式, 但实际发现返回的格式里还有一个data包裹，所以在client进一步优化了。
    assert "type" in result, "JSON结果应该包含type字段"
    assert result["type"] == "doc", "根节点类型应该是doc"
    assert "content" in result, "JSON结果应该包含content数组"
    assert len(result["content"]) > 0, "内容数组不应为空"
    
    # 验证段落节点
    paragraph = result["content"][0]
    assert paragraph["type"] == "paragraph", "第一个内容节点应该是段落"
    assert "content" in paragraph, "段落应该有内容"

@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_json_to_html_integration(tiptap_client):
    """测试JSON到HTML的转换"""
    json_data = {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "Hello "
                    },
                    {
                        "type": "text",
                        "marks": [
                            {
                                "type": "bold"
                            }
                        ],
                        "text": "World"
                    },
                    {
                        "type": "text",
                        "text": "!"
                    }
                ]
            }
        ]
    }
    
    result = await tiptap_client.json_to_html(json_data)
    
    # 验证HTML包含预期内容 - 返回值是字符串而不是对象
    assert "Hello" in result, "结果应该包含原始文本"
    assert "<strong>World</strong>" in result, "结果应该包含带有加粗格式的World"
    assert "<p" in result, "结果应该包含段落标签"

@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_markdown_conversions_integration(tiptap_client):
    """测试Markdown相关的转换"""
    # 测试Markdown到HTML
    markdown = "# Heading\n\nThis is **bold** text."
    html_result = await tiptap_client.markdown_to_html(markdown)
    
    assert "<h1>" in html_result, "结果应该包含h1标签"
    assert "<strong>bold</strong>" in html_result, "结果应该包含带有加粗格式的bold"
    
    # 测试HTML到Markdown
    html = "<h1>Heading</h1><p>This is <strong>bold</strong> text.</p>"
    md_result = await tiptap_client.html_to_markdown(html)
    
    assert "# Heading" in md_result, "结果应该包含Markdown标题"
    assert "**bold**" in md_result, "结果应该包含Markdown加粗语法"
    
    # 测试Markdown到JSON
    json_result = await tiptap_client.markdown_to_json(markdown)
    
    assert json_result["type"] == "doc", "JSON结果根节点类型应该是doc"
    assert len(json_result["content"]) > 0, "JSON内容不应为空"
    
    # 测试JSON到Markdown
    tiptap_json = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Heading"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "This is "},
                    {"type": "text", "marks": [{"type": "bold"}], "text": "bold"},
                    {"type": "text", "text": " text."}
                ]
            }
        ]
    }
    md_from_json = await tiptap_client.json_to_markdown(tiptap_json)
    
    assert "# Heading" in md_from_json, "结果应该包含Markdown标题"
    assert "**bold**" in md_from_json, "结果应该包含Markdown加粗语法"

@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_error_handling(tiptap_client):
    """测试错误处理"""
    # 使用不存在的端点来测试错误处理
    with pytest.raises(Exception) as exc_info:
        await tiptap_client._make_request('non-existent-endpoint', {'data': 'test'})
    
    assert "Tiptap服务请求失败" in str(exc_info.value), "应该抛出包含错误信息的异常"
    
    # 即使无效HTML也可能成功解析，测试响应是否包含内容
    invalid_html = "<div><unclosed tag"
    result = await tiptap_client.html_to_json(invalid_html)
    assert result is not None, "即使HTML无效也应该返回某种结果"

@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_complex_document(tiptap_client):
    """测试复杂文档转换"""
    # 一个包含多种元素的复杂HTML
    complex_html = """
    <h1>Complex Document</h1>
    <p>This document contains <strong>bold</strong>, <em>italic</em>, and <u>underlined</u> text.</p>
    <ul>
        <li>List item 1</li>
        <li>List item 2</li>
    </ul>
    <blockquote>
        <p>This is a quote</p>
    </blockquote>
    <pre><code>console.log('Hello World');</code></pre>
    """
    
    # 测试HTML到JSON
    json_result = await tiptap_client.html_to_json(complex_html)
    
    # 验证JSON结构
    assert json_result["type"] == "doc", "JSON结果根节点类型应该是doc"
    assert "content" in json_result, "JSON结果应该包含content字段"
    
    # 验证转换回HTML
    html_result = await tiptap_client.json_to_html(json_result)
    
    # 验证主要元素存在
    assert "Complex Document" in html_result, "结果应该包含原标题文本"
    assert "<strong>bold</strong>" in html_result, "结果应该包含加粗文本"

@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_performance(tiptap_client):
    """测试转换性能"""
    import time
    
    # 准备一个大型HTML文档
    large_html = "<h1>Large Document</h1>" + "<p>This is a paragraph.</p>" * 100
    
    # 测试HTML到JSON性能
    start_time = time.time()
    json_result = await tiptap_client.html_to_json(large_html)
    html_to_json_time = time.time() - start_time
    
    logger.info(f"HTML到JSON转换耗时: {html_to_json_time:.2f}秒")
    
    # 测试JSON到HTML性能
    start_time = time.time()
    html_result = await tiptap_client.json_to_html(json_result)
    json_to_html_time = time.time() - start_time
    
    logger.info(f"JSON到HTML转换耗时: {json_to_html_time:.2f}秒")
    
    # 验证性能在合理范围内
    assert html_to_json_time < 5, "HTML到JSON转换应该在5秒内完成"
    assert json_to_html_time < 5, "JSON到HTML转换应该在5秒内完成" 




# 测试的代码， 假设在bidlyzer-service目录下 
# pytest tests/integration/test_tiptap_client.py -v
# 通过env设置环境变量 TIPTAP_INTEGRATION_TEST=true 来选择测试或者不测试



