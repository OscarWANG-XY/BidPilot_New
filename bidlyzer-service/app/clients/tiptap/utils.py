from .client import TiptapClient

async def get_html_from_json(json_data):
    """Convert Tiptap JSON content to HTML"""
    if not json_data:
        return ""
    client = TiptapClient()
    result = await client.json_to_html(json_data)
    if isinstance(result, dict) and result.get('success', False):
        return result.get('data', "")
    return result

async def get_markdown_from_json(json_data):
    """Convert Tiptap JSON content to Markdown"""
    if not json_data:
        return ""
    client = TiptapClient()
    result = await client.json_to_markdown(json_data)
    if isinstance(result, dict) and result.get('success', False):
        return result.get('data', "")
    return result

async def get_json_from_html(html):
    """Get Tiptap JSON from HTML"""
    if not html:
        return None
    client = TiptapClient()
    result = await client.html_to_json(html)
    if isinstance(result, dict) and result.get('success', False):
        return result.get('data')
    return result

async def get_json_from_markdown(markdown):
    """Get Tiptap JSON from Markdown"""
    if not markdown:
        return None
    client = TiptapClient()
    result = await client.markdown_to_json(markdown)
    if isinstance(result, dict) and result.get('success', False):
        return result.get('data')
    return result

# Extended methods for any model with docx_tiptap field
async def get_content_as_html(model):
    """Convert model's docx_tiptap to HTML"""
    return await get_html_from_json(model.docx_tiptap)

async def get_content_as_markdown(model):
    """Convert model's docx_tiptap to Markdown"""
    return await get_markdown_from_json(model.docx_tiptap)

async def set_content_from_html(model, html):
    """Set model's docx_tiptap from HTML"""
    json_content = await get_json_from_html(html)
    if json_content:
        model.docx_tiptap = json_content
        return True
    return False

async def set_content_from_markdown(model, markdown):
    """Set model's docx_tiptap from Markdown"""
    json_content = await get_json_from_markdown(markdown)
    if json_content:
        model.docx_tiptap = json_content
        return True
    return False 