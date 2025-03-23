# 导出常用类和函数，方便导入
from .client import TiptapClient
from .utils import (
    get_html_from_json, get_markdown_from_json,
    get_json_from_html, get_json_from_markdown
)
from .docx import docx_to_html, docx_to_tiptap_json  # 新增