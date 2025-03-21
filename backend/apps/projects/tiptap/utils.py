from .client import TiptapClient

def get_content_as_html(tiptap_content):
    """将Tiptap JSON内容转换为HTML"""
    if not tiptap_content:
        return ""
    client = TiptapClient()
    result = client.json_to_html(tiptap_content)
    if result.get('success'):
        return result.get('data', "")
    return ""

def get_content_as_markdown(tiptap_content):
    """将Tiptap JSON内容转换为Markdown"""
    if not tiptap_content:
        return ""
    client = TiptapClient()
    result = client.json_to_markdown(tiptap_content)
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
    """将任务的tiptap_content转换为HTML"""
    return get_content_as_html(task.tiptap_content)

def task_get_content_as_markdown(task):
    """将任务的tiptap_content转换为Markdown"""
    return get_content_as_markdown(task.tiptap_content)

def task_set_content_from_html(task, html):
    """从HTML设置任务的tiptap_content"""
    json_content = get_json_from_html(html)
    if json_content:
        task.tiptap_content = json_content
        return True
    return False

def task_set_content_from_markdown(task, markdown):
    """从Markdown设置任务的tiptap_content"""
    json_content = get_json_from_markdown(markdown)
    if json_content:
        task.tiptap_content = json_content
        return True
    return False