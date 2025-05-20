import pytest
from unittest.mock import AsyncMock, MagicMock
from app.clients.tiptap.utils import (
    get_html_from_json,
    get_markdown_from_json,
    get_json_from_html,
    get_json_from_markdown,
    get_content_as_html,
    get_content_as_markdown,
    set_content_from_html,
    set_content_from_markdown
)
from conftest import skip_if_no_tiptap

pytestmark = [pytest.mark.tiptap]

# Mock TiptapClient
@pytest.fixture
def mock_tiptap_client(monkeypatch):
    mock_client = AsyncMock()
    mock_client.json_to_html = AsyncMock(return_value={"success": True, "data": "<p>Test HTML</p>"})
    mock_client.json_to_markdown = AsyncMock(return_value={"success": True, "data": "# Test Markdown"})
    mock_client.html_to_json = AsyncMock(return_value={"success": True, "data": {"type": "doc", "content": []}})
    mock_client.markdown_to_json = AsyncMock(return_value={"success": True, "data": {"type": "doc", "content": []}})
    
    # Mock the TiptapClient class
    mock_client_class = MagicMock(return_value=mock_client)
    monkeypatch.setattr("app.clients.tiptap.utils.TiptapClient", mock_client_class)
    
    return mock_client

# Test data
@pytest.fixture
def sample_json():
    return {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test"}]}]}

@pytest.fixture
def sample_html():
    return "<p>Test HTML</p>"

@pytest.fixture
def sample_markdown():
    return "# Test Markdown"

@pytest.fixture
def mock_model():
    model = MagicMock()
    model.docx_tiptap = {"type": "doc", "content": []}
    return model

# Test cases for JSON to HTML conversion
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_html_from_json_success(mock_tiptap_client, sample_json):
    result = await get_html_from_json(sample_json)
    assert result == "<p>Test HTML</p>"
    mock_tiptap_client.json_to_html.assert_called_once_with(sample_json)

@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_html_from_json_empty():
    result = await get_html_from_json(None)
    assert result == ""

# Test cases for JSON to Markdown conversion
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_markdown_from_json_success(mock_tiptap_client, sample_json):
    result = await get_markdown_from_json(sample_json)
    assert result == "# Test Markdown"
    mock_tiptap_client.json_to_markdown.assert_called_once_with(sample_json)

@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_markdown_from_json_empty():
    result = await get_markdown_from_json(None)
    assert result == ""

# Test cases for HTML to JSON conversion
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_json_from_html_success(mock_tiptap_client, sample_html):
    result = await get_json_from_html(sample_html)
    assert result == {"type": "doc", "content": []}
    mock_tiptap_client.html_to_json.assert_called_once_with(sample_html)

@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_json_from_html_empty():
    result = await get_json_from_html(None)
    assert result is None

# Test cases for Markdown to JSON conversion
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_json_from_markdown_success(mock_tiptap_client, sample_markdown):
    result = await get_json_from_markdown(sample_markdown)
    assert result == {"type": "doc", "content": []}
    mock_tiptap_client.markdown_to_json.assert_called_once_with(sample_markdown)

@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_json_from_markdown_empty():
    result = await get_json_from_markdown(None)
    assert result is None

# Test cases for model content conversion
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_content_as_html(mock_tiptap_client, mock_model):
    result = await get_content_as_html(mock_model)
    assert result == "<p>Test HTML</p>"
    mock_tiptap_client.json_to_html.assert_called_once_with(mock_model.docx_tiptap)

@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_get_content_as_markdown(mock_tiptap_client, mock_model):
    result = await get_content_as_markdown(mock_model)
    assert result == "# Test Markdown"
    mock_tiptap_client.json_to_markdown.assert_called_once_with(mock_model.docx_tiptap)

@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_set_content_from_html_success(mock_tiptap_client, mock_model, sample_html):
    result = await set_content_from_html(mock_model, sample_html)
    assert result is True
    assert mock_model.docx_tiptap == {"type": "doc", "content": []}
    mock_tiptap_client.html_to_json.assert_called_once_with(sample_html)

@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_set_content_from_markdown_success(mock_tiptap_client, mock_model, sample_markdown):
    result = await set_content_from_markdown(mock_model, sample_markdown)
    assert result is True
    assert mock_model.docx_tiptap == {"type": "doc", "content": []}
    mock_tiptap_client.markdown_to_json.assert_called_once_with(sample_markdown)

# Test error cases
@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_set_content_from_html_failure(mock_tiptap_client, mock_model):
    mock_tiptap_client.html_to_json.return_value = None
    result = await set_content_from_html(mock_model, "<p>Invalid HTML</p>")
    assert result is False
    assert mock_model.docx_tiptap == {"type": "doc", "content": []}

@pytest.mark.tiptap
@pytest.mark.asyncio
@skip_if_no_tiptap
async def test_set_content_from_markdown_failure(mock_tiptap_client, mock_model):
    mock_tiptap_client.markdown_to_json.return_value = None
    result = await set_content_from_markdown(mock_model, "# Invalid Markdown")
    assert result is False
    assert mock_model.docx_tiptap == {"type": "doc", "content": []} 