import pytest 
from unittest.mock import patch, AsyncMock
from app.tiptap.client import TiptapClient 
from tests.conftest import skip_if_no_tiptap

# 以下单元测试，仅验证TiptapClient的逻辑，不涉及TiptapService的逻辑
# 验证的核心内容为：
# 1. 请求构造的正确性， 验证 TiptapClient 是否：
# - 发送了正确的URL（/html-to-json）
# - 使用了正确的HTTP方法（POST）
# - 携带了正确的请求头（Content-Type: application/json）
# - 传递了正确的请求体（{"html": "<p>Test</p>"}）
# - 设置了合理的超时（timeout=30）

# 2. 响应处理的正确性，验证客户端是否能：
# - 正确处理成功响应（返回服务端模拟的 {"type": "doc", "content": []}）
# - 正确抛出异常信息（如 "Tiptap服务请求失败"）

pytestmark = [pytest.mark.tiptap]

# 使用pytest的fixture来创建一个模拟的TiptapClient实例,不是真实的连接。 
@pytest.fixture
def tiptap_client():
    return TiptapClient(base_url="http://mock-tiptap:3001")

@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio  #标记测试函数是异步函数
async def test_html_to_json(tiptap_client):
    #使用patch替换真实的网络请求，并构建了模拟的响应
    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_request:
        #模拟异步响应对象
        mock_response = AsyncMock()
        
        # 设置async json方法
        mock_response.json = AsyncMock(return_value={"type": "doc", "content": []})
        
        #模拟raise_for_status方法
        mock_response.raise_for_status = AsyncMock()
        
        #设置模拟响应
        mock_request.return_value = mock_response

        #调用客户端方法
        result = await tiptap_client.html_to_json("<p>Test</p>")

        #验证请求参数
        mock_request.assert_called_once_with(
            method="post",
            url="http://mock-tiptap:3001/html-to-json",
            json={"html": "<p>Test</p>"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        #验证返回结果
        assert result == {"type": "doc", "content": []}

# health_check使用的是get, 并返回bool值，需要单独测试
@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_health_check_success(tiptap_client):
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        result = await tiptap_client.health_check()
        
        assert result is True

@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_health_check_failure(tiptap_client):
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = Exception("Connection error")
        
        result = await tiptap_client.health_check()
        
        assert result is False

@skip_if_no_tiptap
@pytest.mark.tiptap
@pytest.mark.asyncio
async def test_request_error(tiptap_client):
    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_request:
        mock_request.side_effect = Exception("Connection error")
        
        with pytest.raises(Exception) as exc_info:
            await tiptap_client.html_to_json("<p>Test</p>")
        
        assert "Tiptap服务请求失败" in str(exc_info.value)