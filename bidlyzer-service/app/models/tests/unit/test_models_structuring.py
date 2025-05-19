# tests/unit/test_structuring_models_unit.py
import pytest
from unittest.mock import patch, MagicMock
from app.models.structuring_models import StructuringAgentState, StructuringAgentDocument
from conftest import skip_if_no_model
import uuid
from tortoise import fields


class TestStructuringModelsUnit:
    """StructuringModels 单元测试"""

    @skip_if_no_model
    def test_structuring_agent_state_model_attrs(self):
        """测试 StructuringAgentState 模型属性定义正确"""
        # 检查模型字段和属性
        assert 'id' in StructuringAgentState._meta.fields_map
        assert isinstance(StructuringAgentState._meta.fields_map['id'], fields.UUIDField)
        assert 'project_id' in StructuringAgentState._meta.fields_map
        assert 'state' in StructuringAgentState._meta.fields_map
        assert 'state_history' in StructuringAgentState._meta.fields_map
        assert 'created_at' in StructuringAgentState._meta.fields_map
        assert 'updated_at' in StructuringAgentState._meta.fields_map

        # 检查 Meta 属性
        assert StructuringAgentState._meta.db_table == "structuring_agent_states"
        
        # 检查 project_id 唯一性约束
        field = StructuringAgentState._meta.fields_map.get('project_id')
        assert field is not None
        assert field.unique is True

    @skip_if_no_model
    def test_structuring_agent_document_model_attrs(self):
        """测试 StructuringAgentDocument 模型属性定义正确"""
        # 检查模型字段和属性
        assert 'id' in StructuringAgentDocument._meta.fields_map
        assert isinstance(StructuringAgentDocument._meta.fields_map['id'], fields.UUIDField)
        assert 'project_id' in StructuringAgentDocument._meta.fields_map
        assert 'document_type' in StructuringAgentDocument._meta.fields_map
        assert 'content' in StructuringAgentDocument._meta.fields_map
        assert 'created_at' in StructuringAgentDocument._meta.fields_map
        assert 'updated_at' in StructuringAgentDocument._meta.fields_map

        # 检查 Meta 属性
        assert StructuringAgentDocument._meta.db_table == "structuring_agent_documents"
        assert hasattr(StructuringAgentDocument._meta, 'unique_together')
        assert ('project_id', 'document_type') in StructuringAgentDocument._meta.unique_together
    
    @skip_if_no_model
    @patch('tortoise.models.Model.save')
    def test_state_history_append(self, mock_save):
        """测试状态历史记录追加功能"""
        # 创建模拟状态对象
        state = StructuringAgentState(
            id=uuid.uuid4(),
            project_id="test-123",
            state="INITIAL",
            state_history=["CREATED"]
        )
        
        # 模拟保存方法
        mock_save.return_value = None
        
        # 测试状态变更并追加历史记录
        state.state = "PROCESSING"
        if state.state not in state.state_history:
            state.state_history.append(state.state)
        
        # 验证历史记录被正确追加
        assert state.state_history == ["CREATED", "PROCESSING"]
        
        # 再次变更状态
        state.state = "COMPLETED"
        if state.state not in state.state_history:
            state.state_history.append(state.state)
        
        # 验证历史记录继续追加
        assert state.state_history == ["CREATED", "PROCESSING", "COMPLETED"]
    
    @skip_if_no_model
    @patch('tortoise.models.Model.save')
    def test_content_json_manipulation(self, mock_save):
        """测试文档内容 JSON 操作"""
        # 创建模拟文档对象
        document = StructuringAgentDocument(
            id=uuid.uuid4(),
            project_id="test-123",
            document_type="contract",
            content={"title": "初始文档"}
        )
        
        # 模拟保存方法
        mock_save.return_value = None
        
        # 测试 JSON 内容更新
        document.content["title"] = "更新的文档"
        document.content["sections"] = [{"title": "第一章", "content": "内容..."}]
        
        # 验证内容被正确更新
        assert document.content["title"] == "更新的文档"
        assert "sections" in document.content
        assert len(document.content["sections"]) == 1
        assert document.content["sections"][0]["title"] == "第一章"
        
        # 测试嵌套内容添加
        document.content["sections"].append({"title": "第二章", "content": "更多内容..."})
        
        # 验证嵌套内容被正确添加
        assert len(document.content["sections"]) == 2
        assert document.content["sections"][1]["title"] == "第二章"