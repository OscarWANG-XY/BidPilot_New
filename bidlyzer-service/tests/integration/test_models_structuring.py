# tests/integration/test_structuring_models.py
import pytest
import pytest_asyncio
from tortoise import Tortoise
import json
import os
import logging
import uuid
from app.models.structuring_models import StructuringAgentState, StructuringAgentDocument
from tests.conftest import skip_if_no_redis  # 只导入全局 conftest 中的跳过装饰器

# 配置日志
logger = logging.getLogger(__name__)

# 测试数据
TEST_PROJECT_ID = "test-project-123"
TEST_STATE = "PROCESSING"
TEST_STATE_HISTORY = ["CREATED", "PROCESSING"]
TEST_DOCUMENT_TYPE = "contract"
TEST_CONTENT = {"title": "合同文档", "sections": [{"title": "条款一", "content": "内容..."}]}

@pytest.mark.integration
@pytest.mark.redis  # 使用 Redis 标记，表示与数据存储相关的测试
class TestStructuringModels:
    """StructuringModels 集成测试"""
    
    # 直接在测试类中定义 fixture
    @pytest_asyncio.fixture(scope="function")
    async def initialize_db(self):
        """初始化 Tortoise ORM 连接到测试数据库"""
        # 使用 SQLite 内存数据库进行测试
        db_url = os.getenv("TEST_DB_URL", "sqlite://:memory:")
        logger.info(f"连接到测试数据库: {db_url}")
        
        await Tortoise.init(
            db_url=db_url,
            modules={"models": ["app.models.structuring_models"]}
        )
        
        # 创建测试表
        await Tortoise.generate_schemas()
        
        # yield 的作用是 将 Fixture 分成"设置阶段"和"清理阶段"
        # 设置阶段完成后，会暂停在yield处，等待测试结束后，会继续执行yield之后的代码，进行清理工作
        yield
        
        # 测试结束后关闭连接
        await Tortoise.close_connections()

    @pytest.mark.asyncio
    async def test_create_agent_state(self, initialize_db):
        """测试创建代理状态"""
        # 创建一个新的代理状态
        state = await StructuringAgentState.create(
            id=uuid.uuid4(),
            project_id=TEST_PROJECT_ID,
            state=TEST_STATE,
            state_history=TEST_STATE_HISTORY
        )
        
        # 验证创建成功
        assert state.id is not None
        assert isinstance(state.id, uuid.UUID)
        assert state.project_id == TEST_PROJECT_ID
        assert state.state == TEST_STATE
        assert state.state_history == TEST_STATE_HISTORY
        
        # 验证时间戳被自动创建
        assert state.created_at is not None
        assert state.updated_at is not None

    @pytest.mark.asyncio
    async def test_get_agent_state(self, initialize_db):
        """测试获取代理状态"""
        # 首先确保数据存在
        await StructuringAgentState.get_or_create(
            project_id=TEST_PROJECT_ID,
            defaults={
                "id": uuid.uuid4(),
                "state": TEST_STATE,
                "state_history": TEST_STATE_HISTORY
            }
        )
        
        # 获取状态
        state = await StructuringAgentState.get(project_id=TEST_PROJECT_ID)
        
        # 验证获取成功
        assert isinstance(state.id, uuid.UUID)
        assert state.project_id == TEST_PROJECT_ID
        assert state.state == TEST_STATE
        assert state.state_history == TEST_STATE_HISTORY

    @pytest.mark.asyncio
    async def test_update_agent_state(self, initialize_db):
        """测试更新代理状态"""
        # 首先确保数据存在
        state, _ = await StructuringAgentState.get_or_create(
            project_id=TEST_PROJECT_ID,
            defaults={
                "id": uuid.uuid4(),
                "state": TEST_STATE,
                "state_history": TEST_STATE_HISTORY
            }
        )
        
        # 更新状态
        new_state = "COMPLETED"
        new_history = TEST_STATE_HISTORY + ["COMPLETED"]
        state.state = new_state
        state.state_history = new_history
        await state.save()
        
        # 重新获取并验证更新成功
        updated_state = await StructuringAgentState.get(project_id=TEST_PROJECT_ID)
        assert updated_state.state == new_state
        assert updated_state.state_history == new_history
        
        # 验证更新时间被刷新
        assert updated_state.updated_at >= state.created_at

    @pytest.mark.asyncio
    async def test_create_agent_document(self, initialize_db):
        """测试创建代理文档"""
        # 创建一个新的代理文档
        document = await StructuringAgentDocument.create(
            id=uuid.uuid4(),
            project_id=TEST_PROJECT_ID,
            document_type=TEST_DOCUMENT_TYPE,
            content=TEST_CONTENT
        )
        
        # 验证创建成功
        assert document.id is not None
        assert isinstance(document.id, uuid.UUID)
        assert document.project_id == TEST_PROJECT_ID
        assert document.document_type == TEST_DOCUMENT_TYPE
        assert document.content == TEST_CONTENT
        
        # 验证时间戳被自动创建
        assert document.created_at is not None
        assert document.updated_at is not None

    @pytest.mark.asyncio
    async def test_unique_constraint(self, initialize_db):
        """测试唯一约束"""
        # 创建一个文档
        await StructuringAgentDocument.create(
            id=uuid.uuid4(),
            project_id=TEST_PROJECT_ID,
            document_type=TEST_DOCUMENT_TYPE,
            content=TEST_CONTENT
        )
        
        # 尝试创建具有相同 project_id 和 document_type 的另一个文档应该失败
        with pytest.raises(Exception):  # 可能是 IntegrityError 或其他异常
            await StructuringAgentDocument.create(
                id=uuid.uuid4(),
                project_id=TEST_PROJECT_ID,
                document_type=TEST_DOCUMENT_TYPE,
                content={"title": "另一个文档"}
            )

    @pytest.mark.asyncio
    async def test_update_agent_document(self, initialize_db):
        """测试更新代理文档"""
        # 首先确保数据存在
        document, _ = await StructuringAgentDocument.get_or_create(
            project_id=TEST_PROJECT_ID,
            document_type=TEST_DOCUMENT_TYPE,
            defaults={
                "id": uuid.uuid4(),
                "content": TEST_CONTENT
            }
        )
        
        # 更新文档内容
        new_content = {"title": "更新的文档", "sections": [{"title": "新条款", "content": "新内容..."}]}
        document.content = new_content
        await document.save()
        
        # 重新获取并验证更新成功
        updated_document = await StructuringAgentDocument.get(
            project_id=TEST_PROJECT_ID, 
            document_type=TEST_DOCUMENT_TYPE
        )
        assert updated_document.content == new_content
        
        # 验证更新时间被刷新
        assert updated_document.updated_at >= document.created_at