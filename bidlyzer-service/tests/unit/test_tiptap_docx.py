import pytest
import os
from app.tiptap.docx import docx_to_html
from tests.conftest import skip_if_no_tiptap

pytestmark = [pytest.mark.tiptap]

@pytest.fixture
def sample_docx_path():
    # 这里需要准备一个测试用的docx文件
    return os.path.join(os.path.dirname(__file__), 'fixtures', 'sample.docx')

@pytest.fixture
def sample_docx_content():
    # 这里需要准备一个测试用的docx文件内容
    with open(os.path.join(os.path.dirname(__file__), 'fixtures', 'sample.docx'), 'rb') as f:
        return f.read()

@pytest.mark.asyncio
@pytest.mark.tiptap
@skip_if_no_tiptap
async def test_docx_to_html_with_file_path(sample_docx_path):
    """测试使用文件路径转换docx到html"""
    html = await docx_to_html(sample_docx_path)
    assert isinstance(html, str)
    assert len(html) > 0
    # 检查是否包含基本的HTML元素
    assert '<p>' in html
    assert '<h1>' in html
    assert '<h2>' in html

@pytest.mark.asyncio
@pytest.mark.tiptap
@skip_if_no_tiptap
async def test_docx_to_html_with_file_object(sample_docx_path):
    """测试使用文件对象转换docx到html"""
    with open(sample_docx_path, 'rb') as f:
        html = await docx_to_html(f)
    assert isinstance(html, str)
    assert len(html) > 0
    # 检查是否包含基本的HTML元素
    assert '<p>' in html
    assert '<h1>' in html
    assert '<h2>' in html

@pytest.mark.asyncio
@skip_if_no_tiptap
@pytest.mark.tiptap
async def test_docx_to_html_with_bytes(sample_docx_content):
    """测试使用字节内容转换docx到html"""
    html = await docx_to_html(sample_docx_content)
    assert isinstance(html, str)
    assert len(html) > 0
    # 检查是否包含基本的HTML元素
    assert '<p>' in html
    assert '<h1>' in html
    assert '<h2>' in html

@pytest.mark.asyncio
@skip_if_no_tiptap
@pytest.mark.tiptap
async def test_docx_to_html_preserve_formatting(sample_docx_path):
    """测试保留格式的转换"""
    html = await docx_to_html(sample_docx_path, preserve_formatting=True)
    assert isinstance(html, str)
    assert len(html) > 0
    # 检查是否包含特定的样式类
    assert 'class=' in html
    # 检查是否包含格式化的元素
    assert '<strong>' in html
    assert '<em>' in html
    assert '<ul>' in html
    assert '<ol>' in html
    assert '<table' in html

@pytest.mark.asyncio
@skip_if_no_tiptap
@pytest.mark.tiptap
async def test_docx_to_html_invalid_file():
    """测试无效文件的情况"""
    with pytest.raises(Exception):
        await docx_to_html('nonexistent.docx') 