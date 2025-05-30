from app.clients.django.client import DjangoClient
from typing import Optional, Dict, Any, List, Optional
from uuid import UUID
import logging
from pydantic import BaseModel
from app.services.structuring.schema import AgentStateData, AgentStateHistory, TenderFile

logger = logging.getLogger(__name__)



class Storage:
    """基于DjangoClient的持久化存储服务"""
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.django_client = DjangoClient()
    

    async def get_tender_file_url(self) -> str:
        """获取项目招标文件URL """
        try:
            endpoint = f"api/internal/projects/{self.project_id}/get_tender_file_url/"

            result = await self.django_client._make_request(endpoint, data=None, method='get')
            file_response = TenderFile(**result[0]) #result是list(dict), 所以需要[0]，字典才可以**解包
            file_url = file_response.url
            return file_url  # 返回文件URL, 格式为https://....
        
        except Exception as e:
            logger.error(f"获取项目招标文件URL失败: {str(e)}")
            return None


    async def save_agent_state_to_django(self, agent_state_data: AgentStateData) -> bool:
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
    
    async def get_agent_state_from_django(self) -> Optional[Dict[str, Any]]:
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
        

    async def save_agent_state_history_to_django(self, agent_state_history_data: Dict[str, Any]) -> bool:
        """保存Agent状态历史到Django服务"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_state_history/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=agent_state_history_data,
                method='post'
            )
            logger.debug(f"成功保存agent状态历史到Django服务，项目ID: {self.project_id}")
            return True
        except Exception as e:
            logger.error(f"保存agent状态历史到Django服务失败: {str(e)}")
            return False
        
    async def get_agent_state_history_from_django(self) -> Optional[Dict[str, Any]]:
        """从Django服务获取Agent状态历史"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_state_history/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=None,
                method='get'
            )
            return response
        except Exception as e:
            logger.error(f"从Django服务获取agent状态历史失败: {str(e)}")
            return None
        

    async def save_agent_message_to_django(self, agent_message_data: Dict[str, Any]) -> bool:
        """保存Agent消息到Django服务"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_messages/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=agent_message_data,
                method='post'
            )
            logger.debug(f"成功保存agent消息到Django服务，项目ID: {self.project_id}")
            return True
        except Exception as e:
            logger.error(f"保存agent消息到Django服务失败: {str(e)}")
            return False
        
    async def get_agent_message_from_django(self) -> Optional[Dict[str, Any]]:
        """从Django服务获取Agent消息"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_messages/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=None,
                method='get'
            )
            return response
        except Exception as e:
            logger.error(f"从Django服务获取agent消息失败: {str(e)}")
            return None
        

    async def save_document_to_django(self, doc_type: str, content: Dict[str, Any]) -> bool:
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
    
    async def get_document_from_django(self, doc_type: str) -> Optional[Dict[str, Any]]:
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
    
    async def delete_document_from_django(self, doc_type: str) -> bool:
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