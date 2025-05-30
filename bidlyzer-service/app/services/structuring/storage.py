from app.clients.django.client import DjangoClient
from typing import Optional, Dict, Any, List, Optional
from uuid import UUID
import logging
from pydantic import BaseModel
from app.services.structuring.schema import AgentStateHistory, TenderFile, SSEMessageHistory

logger = logging.getLogger(__name__)



class Storage:
    """基于DjangoClient的持久化存储服务"""
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.django_client = DjangoClient()
    

    async def get_tender_file_url(self) -> Optional[TenderFile]:
        """获取项目招标文件URL """
        try:
            endpoint = f"api/internal/projects/{self.project_id}/get_tender_file_url/"

            #response 是list(dict)，这是由django侧决定的, 
            response = await self.django_client._make_request(endpoint, data=None, method='get')

            # 将response 转为 TenderFile 类型， 需要[0]，因为字典才可以**解包
            tender_file = TenderFile(**response["tender_file"][0]) 
            
            return tender_file
        
        except Exception as e:
            logger.error(f"获取项目招标文件URL失败: {str(e)}")
            return None
  

    async def save_agent_state_history_to_django(self, state_history: AgentStateHistory) -> bool:
        """保存Agent状态历史到Django服务"""
        try:
            # 先将 AgentStateHistory 格式转为 Json dict格式
            state_history_data = state_history.model_dump(mode='json')  
            endpoint = f"api/internal/projects/{self.project_id}/agent_state_history/"

            # _make_request 会将Json dict序列化，这里无需再序列化 
            await self.django_client._make_request(    
                endpoint=endpoint,
                data=state_history_data,
                method='post'
            )
            logger.debug(f"成功保存agent状态历史到Django服务，项目ID: {self.project_id}")
            return True
        except Exception as e:
            logger.error(f"保存agent状态历史到Django服务失败: {str(e)}")
            return False
        
    async def get_agent_state_history_from_django(self) -> Optional[AgentStateHistory]:
        """从Django服务获取Agent状态历史"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_state_history/"

            # response 是 JSON Dict格式
            response = await self.django_client._make_request(endpoint, data=None, method='get')

            # 检查响应格式并提取实际的历史数据
            if isinstance(response, dict) and "agent_state_history" in response:
                history_data = response["agent_state_history"]
                
                # 如果历史数据为空，返回 None
                if history_data is None:
                    logger.debug(f"项目 {self.project_id} 没有历史状态记录")
                    return None
                
                # 将history_data 转为 AgentStateHistory 类型
                state_history = AgentStateHistory(**history_data)
                return state_history
            else:
                # 如果响应格式不符合预期，记录错误并返回 None
                logger.error(f"Django 返回的响应格式不正确: {response}")
                return None

        except Exception as e:
            logger.error(f"从Django服务获取agent状态历史失败: {str(e)}")
            return None

    # 只用于测试，正常情况下不删除
    async def delete_agent_state_history_from_django(self) -> bool:
        """从Django服务删除Agent状态历史"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_state_history/"
            await self.django_client._make_request(endpoint, data=None, method='delete')
            return True
        except Exception as e:
            logger.error(f"从Django服务删除agent状态历史失败: {str(e)}")
            return False



    async def save_agent_message_to_django(self, agent_message_data: SSEMessageHistory) -> bool:
        """保存Agent消息到Django服务"""
        try:
            message_data = agent_message_data.model_dump(mode='json')
            endpoint = f"api/internal/projects/{self.project_id}/agent_messages_history/"
            
            await self.django_client._make_request(
                endpoint=endpoint,
                data=message_data,
                method='post'
            )
            logger.debug(f"成功保存agent消息到Django服务，项目ID: {self.project_id}")
            return True
        except Exception as e:
            logger.error(f"保存agent消息到Django服务失败: {str(e)}")
            return False
        
    async def get_agent_message_from_django(self) -> Optional[SSEMessageHistory]:
        """从Django服务获取Agent消息"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_messages_history/"

            # response 是 JSON Dict格式
            response = await self.django_client._make_request(endpoint, data=None, method='get')

            # 检查响应格式并提取实际的历史数据
            if isinstance(response, dict) and "agent_message_history" in response:
                history_data = response["agent_message_history"]
                
                # 如果历史数据为空，返回 None
                if history_data is None:
                    logger.debug(f"项目 {self.project_id} 没有历史消息记录")
                    return None
                
                # 将history_data 转为 SSEMessageHistory 类型
                message_history = SSEMessageHistory(**history_data)
                return message_history
            else:
                # 如果响应格式不符合预期，记录错误并返回 None
                logger.error(f"Django 返回的响应格式不正确: {response}")
                return None
            
        except Exception as e:
            logger.error(f"从Django服务获取agent消息失败: {str(e)}")
            return None

    # 只用于测试，正常情况下不删除
    async def delete_agent_message_from_django(self) -> bool:
        """从Django服务删除Agent消息"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/agent_messages_history/"
            await self.django_client._make_request(endpoint, data=None, method='delete')
            return True
        except Exception as e:
            logger.error(f"从Django服务删除agent消息失败: {str(e)}")
            return False
        


    async def save_document_to_django(self, doc_name: str, content: Dict[str, Any]) -> bool:
        """保存文档内容到Django服务"""
        try:
            payload = {
                'doc_name': doc_name,
                'content': content
            }
            endpoint = f"api/internal/projects/{self.project_id}/documents/{doc_name}/"

            await self.django_client._make_request(
                endpoint=endpoint,
                data=payload,
                method='post'
            )
            logger.debug(f"成功保存文档到Django服务，项目ID: {self.project_id}, 文档类型: {doc_name}")
            return True
        except Exception as e:
            logger.error(f"保存文档到Django服务失败: {str(e)}")
            return False
    
    async def get_document_from_django(self, doc_name: str) -> Optional[Dict[str, Any]]:
        """从Django服务获取文档内容"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/documents/{doc_name}/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=None,
                method='get'
            )
            return response
        except Exception as e:
            logger.error(f"从Django服务获取文档失败: {str(e)}")
            return None
    
    # 只用于测试，正常情况下不删除
    async def delete_document_from_django(self, doc_name: str) -> bool:
        """从Django服务删除文档内容"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/documents/{doc_name}/"
            response = await self.django_client._make_request(
                endpoint=endpoint,
                data=None,
                method='delete'
            )
            logger.debug(f"成功删除文档，项目ID: {self.project_id}, 文档类型: {doc_name}")
            return True
        except Exception as e:
            logger.error(f"删除文档失败: {str(e)}")
            return False 