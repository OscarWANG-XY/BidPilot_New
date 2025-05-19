import pytest
import os
from app.tiptap.docx import docx_to_tiptap_json
from app.tiptap.client import TiptapClient
from ..conftest import skip_if_no_tiptap

pytestmark = [pytest.mark.integration, pytest.mark.tiptap]

@pytest.fixture
def sample_docx_path():
    return os.path.join(os.path.dirname(__file__), '..', 'unit', 'fixtures', 'sample.docx')

@pytest.fixture
def sample_docx_content():
    with open(os.path.join(os.path.dirname(__file__), '..', 'unit', 'fixtures', 'sample.docx'), 'rb') as f:
        return f.read()

@pytest.mark.integration
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_docx_to_tiptap_json_with_file_path(sample_docx_path):
    """测试完整的docx到tiptap json的转换流程（使用文件路径）"""
    result = await docx_to_tiptap_json(sample_docx_path)
    assert isinstance(result, dict)
    # 检查返回的JSON结构是否符合Tiptap格式
    assert 'type' in result
    assert 'content' in result

@pytest.mark.integration
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_docx_to_tiptap_json_with_file_object(sample_docx_path):
    """测试完整的docx到tiptap json的转换流程（使用文件对象）"""
    with open(sample_docx_path, 'rb') as f:
        result = await docx_to_tiptap_json(f)
    assert isinstance(result, dict)
    assert 'type' in result
    assert 'content' in result

@pytest.mark.integration
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_docx_to_tiptap_json_with_bytes(sample_docx_content):
    """测试完整的docx到tiptap json的转换流程（使用字节内容）"""
    result = await docx_to_tiptap_json(sample_docx_content)
    assert isinstance(result, dict)
    assert 'type' in result
    assert 'content' in result

@pytest.mark.integration
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_docx_to_tiptap_json_invalid_file():
    """测试无效文件的情况"""
    with pytest.raises(Exception):
        await docx_to_tiptap_json('nonexistent.docx')

@pytest.mark.integration
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_docx_to_tiptap_json_with_complex_formatting(sample_docx_path):
    """测试包含复杂格式的文档转换"""
    result = await docx_to_tiptap_json(sample_docx_path)
    assert isinstance(result, dict)
    assert 'type' in result
    assert 'content' in result
    
    # 检查是否保留了基本格式
    content = result['content']
    assert any(node.get('type') in ['heading', 'paragraph', 'bulletList', 'orderedList'] 
              for node in content) 