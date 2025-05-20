# tests/api/endpoints/test_documents.py
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Fixtures
@pytest.fixture
def mock_cache_document():
    """Mock CacheManager.cache_document method"""
    with patch('app.services.structuring.cache_manager.CacheManager.cache_document', new_callable=AsyncMock) as mock:
        yield mock

@pytest.fixture
def mock_cache_state():
    """Mock CacheManager.cache_state method"""
    with patch('app.services.structuring.cache_manager.CacheManager.cache_state', new_callable=AsyncMock) as mock:
        yield mock

@pytest.fixture
def mock_get_document():
    """Mock CacheManager.get_document method"""
    with patch('app.services.structuring.cache_manager.CacheManager.get_document', new_callable=AsyncMock) as mock:
        yield mock

# Test cases
@pytest.mark.asyncio
async def test_analyze_document_success(mock_cache_document, mock_cache_state):
    """测试文档分析请求 - 成功场景"""
    # 配置模拟返回值
    mock_cache_document.return_value = True
    mock_cache_state.return_value = True
    
    # 测试数据
    test_data = {
        "project_id": "test-project-123",
        "document": {
            "type": "doc",
            "content": [{"type": "paragraph", "content": [{"type": "text", "text": "测试文档内容"}]}]
        }
    }
    
    # 发送请求
    response = client.post("/api/v1/analyze", json=test_data)
    
    # 验证结果
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["project_id"] == "test-project-123"
    
    # 验证方法调用
    mock_cache_document.assert_called_once_with(
        project_id="test-project-123",
        doc_type="document",
        document=test_data["document"]
    )
    
    # 验证状态缓存
    mock_cache_state.assert_called_once()
    state_data = mock_cache_state.call_args[1]["state_data"]
    assert state_data["status"] == "pending"

@pytest.mark.asyncio
async def test_analyze_document_failure(mock_cache_document):
    """测试文档分析请求 - 存储失败场景"""
    # 配置模拟返回值为失败
    mock_cache_document.return_value = False
    
    # 测试数据
    test_data = {
        "project_id": "test-project-123",
        "document": {"type": "doc", "content": []}
    }
    
    # 发送请求
    response = client.post("/api/v1/analyze", json=test_data)
    
    # 验证结果
    assert response.status_code == 500
    assert "文档存储失败" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_document_success(mock_get_document):
    """测试获取文档 - 成功场景"""
    # 设置模拟文档返回值
    mock_document = {
        "type": "doc",
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": "测试文档内容"}]}]
    }
    mock_get_document.return_value = mock_document
    
    # 发送请求
    response = client.get("/api/v1/documents/test-project-123")
    
    # 验证结果
    assert response.status_code == 200
    assert response.json()["project_id"] == "test-project-123"
    assert response.json()["document"] == mock_document
    
    # 验证方法调用
    mock_get_document.assert_called_once_with("test-project-123", "document")

@pytest.mark.asyncio
async def test_get_document_not_found(mock_get_document):
    """测试获取文档 - 文档不存在场景"""
    # 设置模拟返回值为None
    mock_get_document.return_value = None
    
    # 发送请求
    response = client.get("/api/v1/documents/nonexistent-project")
    
    # 验证结果
    assert response.status_code == 404
    assert "文档未找到" in response.json()["detail"]