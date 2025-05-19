# tests/integration/test_structuring_model_interactions.py
import pytest
import pytest_asyncio
from tortoise import Tortoise
import json
import os
import logging
import uuid
from app.models.structuring_models import StructuringAgentState, StructuringAgentDocument
from tests.conftest import skip_if_no_model  # 只导入全局 conftest 中的跳过装饰器

# 配置日志
logger = logging.getLogger(__name__)

@pytest.mark.integration
@skip_if_no_model
@pytest.mark.redis  # 使用 Redis 标记，表示与数据存储相关的测试
class TestStructuringModelInteractions:
    """测试 StructuringAgentState 和 StructuringAgentDocument 模型之间的交互"""
    
    # 在测试类中定义 fixture
    
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
    
    @pytest_asyncio.fixture
    async def create_project_with_state(self, initialize_db):
        """创建项目状态的 fixture"""
        project_id = "test-project-interaction"
        state = await StructuringAgentState.create(
            id=uuid.uuid4(),
            project_id=project_id,
            state="INITIAL",
            state_history=["CREATED", "INITIAL"]
        )
        return project_id, state
    
    @pytest_asyncio.fixture
    async def create_documents_for_project(self, create_project_with_state):
        """为项目创建多个文档的 fixture"""
        project_id, _ = create_project_with_state
        
        # 创建几个不同类型的文档
        docs = []
        doc_types = ["contract", "agreement", "appendix"]
        
        for i, doc_type in enumerate(doc_types):
            doc = await StructuringAgentDocument.create(
                id=uuid.uuid4(),
                project_id=project_id,
                document_type=doc_type,
                content={
                    "title": f"{doc_type.capitalize()} 文档",
                    "order": i + 1,
                    "sections": [{"title": f"第{i+1}章", "content": f"{doc_type}的内容..."}]
                }
            )
            docs.append(doc)
        
        return project_id, docs
    
    @pytest.mark.asyncio
    async def test_project_workflow(self, create_project_with_state):
        """测试项目工作流程 - 状态变更与文档创建"""
        project_id, state = create_project_with_state
        
        # 1. 更新项目状态为处理中
        state.state = "PROCESSING"
        if state.state not in state.state_history:
            state.state_history.append(state.state)
        await state.save()
        
        # 2. 创建一个文档
        doc = await StructuringAgentDocument.create(
            id=uuid.uuid4(),
            project_id=project_id,
            document_type="contract",
            content={"title": "合同文档", "status": "draft"}
        )
        
        # 3. 验证状态和文档
        updated_state = await StructuringAgentState.get(project_id=project_id)
        assert updated_state.state == "PROCESSING"
        assert "PROCESSING" in updated_state.state_history
        
        fetched_doc = await StructuringAgentDocument.get(
            project_id=project_id, 
            document_type="contract"
        )
        assert fetched_doc.content["title"] == "合同文档"
        assert fetched_doc.content["status"] == "draft"
        
        # 4. 更新文档状态，同时更新项目状态
        fetched_doc.content["status"] = "completed"
        await fetched_doc.save()
        
        updated_state.state = "COMPLETED"
        if updated_state.state not in updated_state.state_history:
            updated_state.state_history.append(updated_state.state)
        await updated_state.save()
        
        # 5. 再次验证状态和文档
        final_state = await StructuringAgentState.get(project_id=project_id)
        assert final_state.state == "COMPLETED"
        assert final_state.state_history == ["CREATED", "INITIAL", "PROCESSING", "COMPLETED"]
        
        final_doc = await StructuringAgentDocument.get(
            project_id=project_id, 
            document_type="contract"
        )
        assert final_doc.content["status"] == "completed"
    
    @pytest.mark.asyncio
    async def test_query_all_documents_for_project(self, create_documents_for_project):
        """测试查询项目的所有文档"""
        project_id, created_docs = create_documents_for_project
        
        # 查询项目的所有文档
        docs = await StructuringAgentDocument.filter(project_id=project_id)
        
        # 验证文档数量
        assert len(docs) == 3
        
        # 验证文档类型
        doc_types = [doc.document_type for doc in docs]
        assert "contract" in doc_types
        assert "agreement" in doc_types
        assert "appendix" in doc_types
        
        # 按顺序排序文档
        sorted_docs = sorted(docs, key=lambda d: d.content["order"])
        assert sorted_docs[0].document_type == "contract"  # order=1
        assert sorted_docs[1].document_type == "agreement"  # order=2
        assert sorted_docs[2].document_type == "appendix"  # order=3
    
    @pytest.mark.asyncio
    async def test_delete_project_and_related_documents(self, create_documents_for_project):
        """测试删除项目及其相关文档"""
        project_id, _ = create_documents_for_project
        
        # 1. 获取项目状态和文档数量
        state = await StructuringAgentState.get(project_id=project_id)
        docs_count = await StructuringAgentDocument.filter(project_id=project_id).count()
        assert docs_count == 3
        
        # 2. 删除项目状态
        await state.delete()
        
        # 3. 删除项目相关的所有文档
        deleted_count = await StructuringAgentDocument.filter(project_id=project_id).delete()
        assert deleted_count == 3
        
        # 4. 验证项目状态和文档已被删除
        state_exists = await StructuringAgentState.exists(project_id=project_id)
        assert not state_exists
        
        remaining_docs = await StructuringAgentDocument.filter(project_id=project_id).count()
        assert remaining_docs == 0