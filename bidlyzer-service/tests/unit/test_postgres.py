# tests/unit/core/test_db_helper_unit.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.core.db_helper import init_db, close_db, generate_schemas, TORTOISE_ORM
from tortoise.exceptions import DBConnectionError
from tests.conftest import skip_if_no_postgres
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)



@pytest.fixture
def mock_tortoise():
    with patch("app.core.db_helper.Tortoise") as mock:
        yield mock

@pytest.fixture
def mock_logger():
    with patch("app.core.db_helper.logger") as mock:
        yield mock

@skip_if_no_postgres
@pytest.mark.asyncio
async def test_init_db_success(mock_tortoise, mock_logger):
    """测试成功初始化数据库连接"""
    mock_tortoise.init = AsyncMock()
    
    await init_db()
    
    mock_tortoise.init.assert_awaited_once_with(config=TORTOISE_ORM)
    mock_logger.info.assert_any_call("正在连接到 PostgreSQL 数据库: postgres://postgres:123456@localhost:5432/bidpilot_new")
    mock_logger.info.assert_called_with("数据库连接成功")

@skip_if_no_postgres
@pytest.mark.asyncio
async def test_init_db_failure(mock_tortoise, mock_logger):
    """测试数据库连接失败"""
    mock_tortoise.init = AsyncMock(side_effect=DBConnectionError("Connection failed"))
    
    with pytest.raises(DBConnectionError):
        await init_db()
    
    mock_logger.error.assert_called_with("数据库连接失败: Connection failed")

@skip_if_no_postgres
@pytest.mark.asyncio
async def test_close_db_success(mock_tortoise, mock_logger):
    """测试成功关闭数据库连接"""
    mock_tortoise.close_connections = AsyncMock()
    
    await close_db()
    
    mock_tortoise.close_connections.assert_awaited_once()
    mock_logger.info.assert_any_call("正在关闭数据库连接")
    mock_logger.info.assert_called_with("数据库连接已关闭")

@skip_if_no_postgres
@pytest.mark.asyncio
async def test_generate_schemas_success(mock_tortoise, mock_logger):
    """测试成功生成数据库架构"""
    mock_tortoise.generate_schemas = AsyncMock()
    
    await generate_schemas()
    
    mock_tortoise.generate_schemas.assert_awaited_once()
    mock_logger.info.assert_any_call("生成数据库架构")
    mock_logger.info.assert_called_with("数据库架构生成完成")