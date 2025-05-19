import pytest
from unittest.mock import MagicMock
from app.tiptap.utils import (
    get_html_from_json,
    get_markdown_from_json,
    get_json_from_html,
    get_json_from_markdown,
    get_content_as_html,
    get_content_as_markdown,
    set_content_from_html,
    set_content_from_markdown
)

pytestmark = [pytest.mark.integration, pytest.mark.tiptap]

# Test data
@pytest.fixture
def sample_json():
    return {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "Hello World"
                    }
                ]
            }
        ]
    }

@pytest.fixture
def sample_html():
    return "<p>Hello World</p>"

@pytest.fixture
def sample_markdown():
    return "Hello World"

@pytest.fixture
def mock_model():
    model = MagicMock()
    model.docx_tiptap = {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "Hello World"
                    }
                ]
            }
        ]
    }
    return model

# Integration tests for JSON to HTML conversion
@pytest.mark.asyncio
@pytest.mark.skip_if_no_tiptap
async def test_get_html_from_json_integration(sample_json):
    result = await get_html_from_json(sample_json)
    assert result == '<p style="text-align: left">Hello World</p>'

@pytest.mark.asyncio
@pytest.mark.skip_if_no_tiptap
async def test_get_html_from_json_empty_integration():
    result = await get_html_from_json(None)
    assert result == ""

# Integration tests for JSON to Markdown conversion
@pytest.mark.asyncio
@pytest.mark.skip_if_no_tiptap
async def test_get_markdown_from_json_integration(sample_json):
    result = await get_markdown_from_json(sample_json)
    assert result == "Hello World"

@pytest.mark.asyncio
@pytest.mark.skip_if_no_tiptap
async def test_get_markdown_from_json_empty_integration():
    result = await get_markdown_from_json(None)
    assert result == ""

# Integration tests for HTML to JSON conversion
@pytest.mark.asyncio
@pytest.mark.skip_if_no_tiptap
async def test_get_json_from_html_integration(sample_html):
    result = await get_json_from_html(sample_html)
    assert isinstance(result, dict)
    assert result.get("type") == "doc"
    assert "content" in result
    # Verify the content structure
    content = result["content"]
    assert len(content) == 1
    assert content[0]["type"] == "paragraph"
    assert len(content[0]["content"]) == 1
    assert content[0]["content"][0]["type"] == "text"
    assert content[0]["content"][0]["text"] == "Hello World"

@pytest.mark.asyncio
@pytest.mark.skip_if_no_tiptap
async def test_get_json_from_html_empty_integration():
    result = await get_json_from_html(None)
    assert result is None

# Integration tests for Markdown to JSON conversion
@pytest.mark.asyncio
@pytest.mark.tiptap
@pytest.mark.skip_if_no_tiptap
async def test_get_json_from_markdown_integration(sample_markdown):
    result = await get_json_from_markdown(sample_markdown)
    assert isinstance(result, dict)
    assert result.get("type") == "doc"
    assert "content" in result
    # Verify the content structure
    content = result["content"]
    assert len(content) == 1
    assert content[0]["type"] == "paragraph"
    assert len(content[0]["content"]) == 1
    assert content[0]["content"][0]["type"] == "text"
    assert content[0]["content"][0]["text"] == "Hello World"

@pytest.mark.asyncio
@pytest.mark.tiptap
@pytest.mark.skip_if_no_tiptap
async def test_get_json_from_markdown_empty_integration():
    result = await get_json_from_markdown(None)
    assert result is None

# Integration tests for model content conversion
@pytest.mark.asyncio
@pytest.mark.tiptap
@pytest.mark.skip_if_no_tiptap
async def test_get_content_as_html_integration(mock_model):
    result = await get_content_as_html(mock_model)
    assert result == '<p style="text-align: left">Hello World</p>'

@pytest.mark.asyncio
@pytest.mark.tiptap
@pytest.mark.skip_if_no_tiptap
async def test_get_content_as_markdown_integration(mock_model):
    result = await get_content_as_markdown(mock_model)
    assert result == "Hello World"

@pytest.mark.asyncio
@pytest.mark.tiptap
@pytest.mark.skip_if_no_tiptap
async def test_set_content_from_html_integration(mock_model, sample_html):
    success = await set_content_from_html(mock_model, sample_html)
    assert success is True
    assert isinstance(mock_model.docx_tiptap, dict)
    assert mock_model.docx_tiptap.get("type") == "doc"
    # Verify the content structure
    content = mock_model.docx_tiptap["content"]
    assert len(content) == 1
    assert content[0]["type"] == "paragraph"
    assert len(content[0]["content"]) == 1
    assert content[0]["content"][0]["type"] == "text"
    assert content[0]["content"][0]["text"] == "Hello World"

@pytest.mark.asyncio
@pytest.mark.tiptap
@pytest.mark.skip_if_no_tiptap
async def test_set_content_from_markdown_integration(mock_model, sample_markdown):
    success = await set_content_from_markdown(mock_model, sample_markdown)
    assert success is True
    assert isinstance(mock_model.docx_tiptap, dict)
    assert mock_model.docx_tiptap.get("type") == "doc"
    # Verify the content structure
    content = mock_model.docx_tiptap["content"]
    assert len(content) == 1
    assert content[0]["type"] == "paragraph"
    assert len(content[0]["content"]) == 1
    assert content[0]["content"][0]["type"] == "text"
    assert content[0]["content"][0]["text"] == "Hello World"

# Integration test for complex content
@pytest.mark.asyncio
@pytest.mark.tiptap
@pytest.mark.skip_if_no_tiptap
async def test_complex_content_integration():
    complex_json = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Title"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "This is a "},
                    {"type": "text", "marks": [{"type": "bold"}], "text": "bold"},
                    {"type": "text", "text": " and "},
                    {"type": "text", "marks": [{"type": "italic"}], "text": "italic"},
                    {"type": "text", "text": " text."}
                ]
            }
        ]
    }
    
    # Test JSON to HTML
    html = await get_html_from_json(complex_json)
    assert '<h1 style="text-align: left">Title</h1>' in html
    assert '<p style="text-align: left">This is a <strong>bold</strong> and <em>italic</em> text.</p>' in html
    
    # Test JSON to Markdown
    markdown = await get_markdown_from_json(complex_json)
    assert "# Title" in markdown
    assert "**bold**" in markdown
    assert "*italic*" in markdown
    
    # Test HTML to JSON
    json_from_html = await get_json_from_html(html)
    assert json_from_html["type"] == "doc"
    assert len(json_from_html["content"]) > 0
    
    # Test Markdown to JSON
    json_from_markdown = await get_json_from_markdown(markdown)
    assert json_from_markdown["type"] == "doc"
    assert len(json_from_markdown["content"]) > 0 