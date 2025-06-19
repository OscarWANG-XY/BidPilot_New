from app.clients.django.client import DjangoClient
from typing import Optional, Dict, Any, Union, List
from pydantic import BaseModel
import logging
logger = logging.getLogger(__name__)


class TenderFile(BaseModel):
    """单个招标文件信息"""
    id: str  # 或者 UUID，取决于您的ID格式
    name: str
    type: str
    url: str
    size: int
    mime_type: str

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
  

    # 注意： 一旦使用Storge的以下方法（save_to_django, get_from_django, clear_storage），如果Django侧不存在对应的表，会触发创建。 
    # 表被创建以后，各字段的值为None. 
    # 从表查询回参数，会以{key_name: value, content: value} 的格式返回。 
    # 所以返回的数据不会为空，关键要验证content是否为空。   

    async def save_to_django(self, data: Dict[str, Any]) -> bool:
        """保存数据到Django服务"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/save_to_django/"
            await self.django_client._make_request(
                endpoint, 
                data=data,   # 这个data除了包含数据，还需要包含资源路径。 
                method='post')
            return True
        except Exception as e:
            logger.error(f"保存数据到Django服务失败: {str(e)}")
            return False


    async def get_from_django(self, params: Dict[str, Any]) -> bool:
        """从Django服务获取数据"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/get_from_django/"
            response = await self.django_client._make_request(endpoint, data=None, method='get', params=params)
            return response
        except Exception as e:
            logger.error(f"从Django服务获取数据失败: {str(e)}")
            return None


    async def clear_storage(self, clear_fields: Union[str, List[str], Dict[str, Any]]) -> bool:
        """清空存储"""
        try:
            endpoint = f"api/internal/projects/{self.project_id}/clear_storage/"
            data={
                "clear": clear_fields   #clear_fields 是字符串，列表, 或者all
            }
            await self.django_client._make_request(endpoint, data=data, method='post')
            return True
        except Exception as e:
            logger.error(f"清空存储失败: {str(e)}")
            return False




    # async def save_agent_state_history_to_django(self, state_history: AgentStateHistory) -> bool:
    #     """保存Agent状态历史到Django服务"""
    #     try:
    #         # 先将 AgentStateHistory 格式转为 Json dict格式
    #         state_history_data = state_history.model_dump(mode='json')  
    #         endpoint = f"api/internal/projects/{self.project_id}/agent_state_history/"

    #         # _make_request 会将Json dict序列化，这里无需再序列化 
    #         await self.django_client._make_request(    
    #             endpoint=endpoint,
    #             data=state_history_data,
    #             method='post'
    #         )
    #         logger.debug(f"成功保存agent状态历史到Django服务，项目ID: {self.project_id}")
    #         return True
    #     except Exception as e:
    #         logger.error(f"保存agent状态历史到Django服务失败: {str(e)}")
    #         return False
        
    # async def get_agent_state_history_from_django(self) -> Optional[AgentStateHistory]:
    #     """从Django服务获取Agent状态历史"""
    #     try:
    #         endpoint = f"api/internal/projects/{self.project_id}/agent_state_history/"

    #         # response 是 JSON Dict格式
    #         response = await self.django_client._make_request(endpoint, data=None, method='get')

    #         # 检查响应格式并提取实际的历史数据
    #         if isinstance(response, dict) and "agent_state_history" in response:
    #             history_data = response["agent_state_history"]
                
    #             # 如果历史数据为空，返回 None
    #             if history_data is None:
    #                 logger.debug(f"项目 {self.project_id} 没有历史状态记录")
    #                 return None
                
    #             # 将history_data 转为 AgentStateHistory 类型
    #             state_history = AgentStateHistory(**history_data)
    #             return state_history
    #         else:
    #             # 如果响应格式不符合预期，记录错误并返回 None
    #             logger.error(f"Django 返回的响应格式不正确: {response}")
    #             return None

    #     except Exception as e:
    #         logger.error(f"从Django服务获取agent状态历史失败: {str(e)}")
    #         return None

    # # 只用于测试，正常情况下不删除
    # async def delete_agent_state_history_from_django(self) -> bool:
    #     """从Django服务删除Agent状态历史"""
    #     try:
    #         endpoint = f"api/internal/projects/{self.project_id}/agent_state_history/"
    #         await self.django_client._make_request(endpoint, data=None, method='delete')
    #         return True
    #     except Exception as e:
    #         logger.error(f"从Django服务删除agent状态历史失败: {str(e)}")
    #         return False



    # async def save_agent_message_to_django(self, agent_message_data: SSEMessageHistory) -> bool:
    #     """保存Agent消息到Django服务"""
    #     try:
    #         message_data = agent_message_data.model_dump(mode='json')
    #         endpoint = f"api/internal/projects/{self.project_id}/agent_messages_history/"
            
    #         await self.django_client._make_request(
    #             endpoint=endpoint,
    #             data=message_data,
    #             method='post'
    #         )
    #         logger.debug(f"成功保存agent消息到Django服务，项目ID: {self.project_id}")
    #         return True
    #     except Exception as e:
    #         logger.error(f"保存agent消息到Django服务失败: {str(e)}")
    #         return False
        
    # async def get_agent_message_from_django(self) -> Optional[SSEMessageHistory]:
    #     """从Django服务获取Agent消息"""
    #     try:
    #         endpoint = f"api/internal/projects/{self.project_id}/agent_messages_history/"

    #         # response 是 JSON Dict格式
    #         response = await self.django_client._make_request(endpoint, data=None, method='get')

    #         # 检查响应格式并提取实际的历史数据
    #         if isinstance(response, dict) and "agent_message_history" in response:
    #             history_data = response["agent_message_history"]
                
    #             # 如果历史数据为空，返回 None
    #             if history_data is None:
    #                 logger.debug(f"项目 {self.project_id} 没有历史消息记录")
    #                 return None
                
    #             # 将history_data 转为 SSEMessageHistory 类型
    #             message_history = SSEMessageHistory(**history_data)
    #             return message_history
    #         else:
    #             # 如果响应格式不符合预期，记录错误并返回 None
    #             logger.error(f"Django 返回的响应格式不正确: {response}")
    #             return None
            
    #     except Exception as e:
    #         logger.error(f"从Django服务获取agent消息失败: {str(e)}")
    #         return None

    # # 只用于测试，正常情况下不删除
    # async def delete_agent_message_from_django(self) -> bool:
    #     """从Django服务删除Agent消息"""
    #     try:
    #         endpoint = f"api/internal/projects/{self.project_id}/agent_messages_history/"
    #         await self.django_client._make_request(endpoint, data=None, method='delete')
    #         return True
    #     except Exception as e:
    #         logger.error(f"从Django服务删除agent消息失败: {str(e)}")
    #         return False
        


    # async def save_document_to_django(self, doc_name: str, content: Dict[str, Any]) -> bool:
    #     """保存文档内容到Django服务"""
    #     try:
    #         payload = {
    #             'doc_name': doc_name,
    #             'content': content
    #         }
    #         endpoint = f"api/internal/projects/{self.project_id}/documents/{doc_name}/"

    #         await self.django_client._make_request(
    #             endpoint=endpoint,
    #             data=payload,
    #             method='post'
    #         )
    #         logger.debug(f"成功保存文档到Django服务，项目ID: {self.project_id}, 文档类型: {doc_name}")
    #         return True
    #     except Exception as e:
    #         logger.error(f"保存文档到Django服务失败: {str(e)}")
    #         return False
    
    # async def get_document_from_django(self, doc_name: str) -> Optional[Dict[str, Any]]:
    #     """从Django服务获取文档内容"""
    #     try:
    #         endpoint = f"api/internal/projects/{self.project_id}/documents/{doc_name}/"
    #         response = await self.django_client._make_request(
    #             endpoint=endpoint,
    #             data=None,
    #             method='get'
    #         )
            
    #         # 新增：从response中提取content字段
    #         content = response.get("content")
            
    #         # 新增：检查并处理可能的双重序列化问题
    #         if isinstance(content, str):
    #             try:
    #                 import json
    #                 content = json.loads(content)
    #                 logger.debug(f"检测到字符串格式的JSON数据，已自动解析为字典")
    #             except json.JSONDecodeError as e:
    #                 logger.error(f"无法解析JSON字符串: {str(e)}")
    #                 return None
            
    #         return content  # 返回content而不是整个response
    #     except Exception as e:
    #         logger.error(f"从Django服务获取文档失败: {str(e)}")
    #         return None
    
    # # 只用于测试，正常情况下不删除
    # async def delete_document_from_django(self, doc_name: str) -> bool:
    #     """从Django服务删除文档内容"""
    #     try:
    #         endpoint = f"api/internal/projects/{self.project_id}/documents/{doc_name}/"
    #         response = await self.django_client._make_request(
    #             endpoint=endpoint,
    #             data=None,
    #             method='delete'
    #         )
    #         logger.debug(f"成功删除文档，项目ID: {self.project_id}, 文档类型: {doc_name}")
    #         return True
    #     except Exception as e:
    #         logger.error(f"删除文档失败: {str(e)}")
    #         return False 