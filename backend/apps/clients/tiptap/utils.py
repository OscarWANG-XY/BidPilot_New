from .client import TiptapClient

def get_html_from_json(json):
    """将Tiptap JSON内容转换为HTML"""
    if not json:
        return ""
    client = TiptapClient()
    result = client.json_to_html(json)
    if result.get('success'):
        return result.get('data', "")
    return ""

def get_markdown_from_json(json):
    """将Tiptap JSON内容转换为Markdown"""
    if not json:
        return ""
    client = TiptapClient()
    result = client.json_to_markdown(json)
    if result.get('success'):
        return result.get('data', "")
    return ""

def get_json_from_html(html):
    """从HTML获取Tiptap JSON"""
    if not html:
        return None
    client = TiptapClient()
    result = client.html_to_json(html)
    if result.get('success'):
        return result.get('data')
    return None

def get_json_from_markdown(markdown):
    """从Markdown获取Tiptap JSON"""
    if not markdown:
        return None
    client = TiptapClient()
    result = client.markdown_to_json(markdown)
    if result.get('success'):
        return result.get('data')
    return None




# Task模型的扩展方法
def task_get_content_as_html(task):
    """将任务的docx_tiptap转换为HTML"""
    return get_html_from_json(task.docx_tiptap)

def task_get_content_as_markdown(task):
    """将任务的docx_tiptap转换为Markdown"""
    return get_markdown_from_json(task.docx_tiptap)

def task_set_content_from_html(task, html):
    """从HTML设置任务的docx_tiptap"""
    json_content = get_json_from_html(html)
    if json_content:
        task.docx_tiptap = json_content
        return True
    return False

def task_set_content_from_markdown(task, markdown):
    """从Markdown设置任务的docx_tiptap"""
    json_content = get_json_from_markdown(markdown)
    if json_content:
        task.docx_tiptap = json_content
        return True
    return False