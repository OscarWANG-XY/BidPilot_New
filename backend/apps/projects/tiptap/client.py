import requests
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class TiptapClient:
    """Tiptap服务客户端，用于与tiptap-service进行通信"""
    
    def __init__(self, base_url=None):
        """初始化Tiptap客户端"""
        self.base_url = base_url or getattr(settings, 'TIPTAP_SERVICE_URL', 'http://localhost:3000')
        
    def _make_request(self, endpoint, data, method='post'):
        """发送请求到Tiptap服务"""
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.request(
                method=method,
                url=url,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=30  # 增加超时时间，处理大文档
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Tiptap服务请求失败: {e}")
            raise Exception(f"Tiptap服务请求失败: {e}")
    
    def html_to_json(self, html):
        """将HTML转换为Tiptap JSON"""
        return self._make_request('html-to-json', {'html': html})
    
    def json_to_html(self, json_data):
        """将Tiptap JSON转换为HTML"""
        return self._make_request('json-to-html', {'json': json_data})
    
    def html_to_markdown(self, html):
        """将HTML转换为Markdown"""
        return self._make_request('html-to-markdown', {'html': html})
    
    def markdown_to_html(self, markdown):
        """将Markdown转换为HTML"""
        return self._make_request('markdown-to-html', {'markdown': markdown})
    
    def json_to_markdown(self, json_data):
        """将Tiptap JSON转换为Markdown"""
        return self._make_request('json-to-markdown', {'json': json_data})
    
    def markdown_to_json(self, markdown):
        """将Markdown转换为Tiptap JSON"""
        return self._make_request('markdown-to-json', {'markdown': markdown})
    
    def health_check(self):
        """检查Tiptap服务是否正常运行"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except requests.RequestException:
            return False