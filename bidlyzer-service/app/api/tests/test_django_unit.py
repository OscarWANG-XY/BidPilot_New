# tests/api/endpoints/test_documents.py
import pytest
import jwt
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from datetime import datetime, timedelta, timezone

# Create test client
client = TestClient(app)

# Helper function to generate test JWT tokens
def generate_test_token(user_id="test_user_123", is_superuser=True):
    """生成用于测试的JWT token"""
    # 创建符合应用预期的payload
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),  # 使用timezone-aware对象
        "token_type": "access",  # 应用中检查此字段
        "jti": "test_jti_123456",
        "is_superuser": is_superuser
    }
    
    # 使用在settings中配置的相同签名密钥和算法
    token = jwt.encode(
        payload,
        settings.JWT_SIGNING_KEY or "test_secret_key",
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token

# Patch JWT decode function to always return a valid payload
@pytest.fixture(autouse=True)
def mock_jwt_decode():
    """模拟JWT解码，确保验证总是通过"""
    with patch('app.auth.jwt.jwt.decode') as mock_decode:
        # 设置一个有效的payload
        mock_decode.return_value = {
            "user_id": "test_user_123",
            "token_type": "access",
            "exp": (datetime.now(timezone.utc) + timedelta(minutes=30)).timestamp(),
            "is_superuser": True
        }
        yield mock_decode

# Patch token extraction function
@pytest.fixture(autouse=True)
def mock_get_token_from_header():
    """模拟从Authorization header提取token的函数"""
    with patch('app.auth.jwt.get_token_from_authorization_header') as mock_get_token:
        # 直接返回一个有效的token字符串
        mock_get_token.return_value = "valid_token_for_testing"
        yield mock_get_token

# Fixtures for API tests
@pytest.fixture
def mock_cache_document():
    """Mock CacheManager.cache_document method"""
    with patch('app.core.cache_manager.CacheManager.cache_document', new_callable=AsyncMock) as mock:
        yield mock

@pytest.fixture
def mock_cache_state():
    """Mock CacheManager.cache_state method"""
    with patch('app.core.cache_manager.CacheManager.cache_state', new_callable=AsyncMock) as mock:
        yield mock

@pytest.fixture
def mock_get_document():
    """Mock CacheManager.get_document method"""
    with patch('app.core.cache_manager.CacheManager.get_document', new_callable=AsyncMock) as mock:
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
    
    # 生成测试token
    token = generate_test_token()
    
    # 发送请求（添加认证头）
    response = client.post(
        "/api/v1/django/analyze", 
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # 验证结果
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["project_id"] == "test-project-123"
    
    # 验证方法调用
    mock_cache_document.assert_called_once_with(
        project_id="test-project-123",
        doc_type="document",
        document=test_data["document"],
        timeout=3600
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
    
    # 生成测试token
    token = generate_test_token()
    
    # 发送请求（添加认证头）
    response = client.post(
        "/api/v1/django/analyze", 
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
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
    
    # 生成测试token
    token = generate_test_token()
    
    # 发送请求（添加认证头）
    response = client.get(
        "/api/v1/django/documents/test-project-123",
        headers={"Authorization": f"Bearer {token}"}
    )
    
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
    
    # 生成测试token
    token = generate_test_token()
    
    # 发送请求（添加认证头）
    response = client.get(
        "/api/v1/django/documents/nonexistent-project",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # 验证结果
    assert response.status_code == 404
    assert "文档未找到" in response.json()["detail"]