from app.clients.django.client import DjangoClient
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class PersistentStorage:
    """基于DjangoClient的持久化存储服务"""
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.django_client = DjangoClient()
    

    async def get_tender_file_url(self):
        """获取项目招标文件URL
        
        Args:
            project_id (str): 项目ID
            
        Returns:
            dict: 包含文件URL列表的响应数据
        """
        endpoint = f"api/internal/projects/{self.project_id}/get_tender_file_url/"
        # 使用GET方法获取文件URL
        return await self.django_client._make_request(endpoint, data=None, method='get')



    async def save_agent_state(self, agent_state_data: Dict[str, Any]) -> bool:
        """保存Agent状态到Django服务"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_state/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=agent_state_data,
                method='post'
            )
            logger.debug(f"成功保存agent状态到Django服务，项目ID: {self.project_id}")
            return True
        except Exception as e:
            logger.error(f"保存agent状态到Django服务失败: {str(e)}")
            return False
    
    async def get_agent_state(self) -> Optional[Dict[str, Any]]:
        """从Django服务获取Agent状态"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_state/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=None,
                method='get'
            )
            return response
        except Exception as e:
            logger.error(f"从Django服务获取agent状态失败: {str(e)}")
            return None
    
    async def save_document(self, doc_type: str, content: Dict[str, Any]) -> bool:
        """保存文档内容到Django服务"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/documents/"
            payload = {
                'doc_type': doc_type,
                'content': content
            }
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=payload,
                method='post'
            )
            logger.debug(f"成功保存文档到Django服务，项目ID: {self.project_id}, 文档类型: {doc_type}")
            return True
        except Exception as e:
            logger.error(f"保存文档到Django服务失败: {str(e)}")
            return False
    
    async def get_document(self, doc_type: str) -> Optional[Dict[str, Any]]:
        """从Django服务获取文档内容"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/documents/{doc_type}/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=None,
                method='get'
            )
            return response
        except Exception as e:
            logger.error(f"从Django服务获取文档失败: {str(e)}")
            return None
    
    async def delete_document(self, doc_type: str) -> bool:
        """从Django服务删除文档内容"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/documents/{doc_type}/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=None,
                method='delete'
            )
            logger.debug(f"成功删除文档，项目ID: {self.project_id}, 文档类型: {doc_type}")
            return True
        except Exception as e:
            logger.error(f"删除文档失败: {str(e)}")
            return False 