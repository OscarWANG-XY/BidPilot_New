import logging
import requests
from typing import Dict, Any, Optional
from django.conf import settings
from requests.exceptions import RequestException, Timeout

logger = logging.getLogger(__name__)

class BidlyzerAPIClient:
    """
    Django客户端，用于与Bidlyzer FastAPI服务通信
    """
    
    def __init__(self, base_url=None, timeout=30):
        """
        初始化API客户端
        
        Args:
            base_url: FastAPI服务的基础URL
            timeout: 请求超时时间（秒）
        """
        self.base_url = base_url or getattr(settings, 'BIDLYZER_API_URL', 'http://localhost:8000')
        self.timeout = timeout
        self.api_prefix = '/api/v1'
    
    def _get_url(self, endpoint: str) -> str:
        """构建完整的API URL"""
        return f"{self.base_url}{self.api_prefix}{endpoint}"
    
    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """处理API响应，统一错误处理"""
        try:
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP错误: {e}"
            try:
                error_detail = response.json().get('detail', '未知错误')
                error_msg = f"{error_msg} - {error_detail}"
            except ValueError:
                pass
            
            logger.error(error_msg)
            raise ValueError(error_msg)
        except ValueError:
            error_msg = f"解析响应JSON失败: {response.text}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    def submit_document_analysis(self, project_id: str, document: Dict[str, Any]) -> Dict[str, Any]:
        """
        提交文档分析请求
        
        Args:
            project_id: 项目ID
            document: Tiptap格式的文档
            
        Returns:
            API响应数据
        """
        try:
            url = self._get_url('/analyze')
            
            payload = {
                'project_id': project_id,
                'document': document
            }
            
            logger.info(f"提交文档分析请求: project_id={project_id}")
            
            response = requests.post(
                url=url,
                json=payload,
                timeout=self.timeout
            )
            
            return self._handle_response(response)
        
        except Timeout:
            error_msg = f"请求超时: project_id={project_id}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        except RequestException as e:
            error_msg = f"请求异常: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    def get_document(self, project_id: str) -> Optional[Dict[str, Any]]:
        """
        获取已存储的文档
        
        Args:
            project_id: 项目ID
            
        Returns:
            文档数据，如果不存在则返回None
        """
        try:
            url = self._get_url(f'/documents/{project_id}')
            
            logger.info(f"获取文档: project_id={project_id}")
            
            response = requests.get(
                url=url,
                timeout=self.timeout
            )
            
            if response.status_code == 404:
                logger.info(f"文档不存在: project_id={project_id}")
                return None
                
            return self._handle_response(response)
            
        except (RequestException, ValueError) as e:
            logger.error(f"获取文档失败: {str(e)}")
            return None
