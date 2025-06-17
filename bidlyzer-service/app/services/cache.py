# app/core/cache_manager.py

from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from app.core.redis_helper import RedisClient
from app.services.state import AgentStateHistory, AgentState, AgentSSEMessageHistory, AgentSSEMessage, Document
from app.services.storage import Storage

import logging
logger = logging.getLogger(__name__)




class Cache:
    """缓存管理器，提供文档结构化流程的缓存操作"""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.max_message_history = 100  # 最大消息历史记录数
        self.cache_expire_time = 900   # 缓存过期时间
        self.storage = Storage(project_id)

        self.STRUCTURING_AGENT_PREFIX = 'structuring_agent:'
        self.PLANNING_AGENT_PREFIX = 'planning_agent:'
        self.WRITING_AGENT_PREFIX = 'writing_agent:'
        self.INTEGRATION_AGENT_PREFIX = 'integration_agent:'
    

    def get_cache_keys(self) -> str:
        """获取状态缓存键"""
        return {
            # 以下key_name必须和django后端的模型字段名称一样，持久化存储才能对上。 
            'agent_state_history': f"{self.project_id}{self.STRUCTURING_AGENT_PREFIX}:agent_state_history",
            'agent_message_history': f"{self.project_id}{self.STRUCTURING_AGENT_PREFIX}:agent_message_history",
            'raw_document': f"{self.project_id}{self.STRUCTURING_AGENT_PREFIX}:raw_document",
            'h1_document': f"{self.project_id}{self.STRUCTURING_AGENT_PREFIX}:h1_document",
            'h2h3_document': f"{self.project_id}{self.STRUCTURING_AGENT_PREFIX}:h2h3_document", 
            'intro_document': f"{self.project_id}{self.STRUCTURING_AGENT_PREFIX}:intro_document",
            'final_document': f"{self.project_id}{self.STRUCTURING_AGENT_PREFIX}:final_document",
            'review_suggestions': f"{self.project_id}{self.STRUCTURING_AGENT_PREFIX}:review_suggestions",

            # planning agent cache keys

        }
    
    def get_channel_keys(self) -> str:
        """获取SSE通道键"""
        return {
            'sse_channel': f"{self.project_id}:sse_channel"
        }
    
    def _generate_message_id(self) -> str:
        """生成消息唯一标识"""
        import uuid
        return f"{self.project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"



    async def save_agent_state(self, agent_state: AgentState) -> bool:
        """保存agent状态"""
        try:
            state_history_key = self.get_cache_keys().get('agent_state_history')
            state_history_data = await RedisClient.get(state_history_key)
            if not state_history_data:
                state_history = AgentStateHistory(key_name='agent_state_history', content=[agent_state])
            else:   
                # 将字典转换为 AgentStateHistory 对象
                state_history = AgentStateHistory(**state_history_data)
                state_history.content.append(agent_state)
            
            # 将 Pydantic 对象转换为 JSON 兼容的字典
            state_history_dict = state_history.model_dump(mode='json')

            success = await RedisClient.set(state_history_key, state_history_dict, expire=self.cache_expire_time)
            if success:               
                await self.storage.save_to_django(state_history_dict)
                return True
            else:
                return False
        except Exception as e:
            logger.error(f"保存agent状态失败: {str(e)}")
            return False

    async def get_agent_state(self) -> Tuple[Optional[AgentState], Optional[AgentStateHistory]]:
        """获取agent状态"""
        try:
            cache_key = self.get_cache_keys().get('agent_state_history')
            cache_data = await RedisClient.get(cache_key)
            if cache_data:
                # 将字典转换为 AgentStateHistory 对象
                state_history = AgentStateHistory(**cache_data)
                # 获取最新的状态
                agent_state = state_history.content[-1] if state_history.content else None
                return agent_state, state_history
            else:
                # 如果缓存失败，从django获取历史记录storage_data, 格式为AgentStateHistory
                storage_data = await self.storage.get_from_django(params={'fields': 'agent_state_history'})
                if storage_data:
                    # 恢复缓存数据
                    state_history_dict = storage_data
                    success_redis = await RedisClient.set(cache_key, state_history_dict, expire=self.cache_expire_time)
                    if success_redis:
                        state_history = AgentStateHistory(**state_history_dict)
                        agent_state = state_history.content[-1] if state_history.content else None
                        return agent_state, state_history
                    else:
                        logger.error(f"恢复缓存失败，项目号：{self.project_id}")
                        return None, None
                else:
                    logger.debug(f"项目 {self.project_id} 没有历史状态记录，这是正常的初始状态")
                    return None, None
        except Exception as e:
            logger.error(f"获取agent状态失败: {str(e)}")
            return None, None


    async def save_agent_sse_message(self, agent_sse_message: AgentSSEMessage) -> bool:
        """保存agent sse消息"""
        try:
            sse_message_key = self.get_cache_keys().get('agent_message_history')
            sse_message_history_data = await RedisClient.get(sse_message_key)
            if not sse_message_history_data:
                sse_message_history = AgentSSEMessageHistory(key_name='agent_message_history', content=[agent_sse_message])
            else:
                # 将字典转换为 AgentSSEMessageHistory 对象
                sse_message_history = AgentSSEMessageHistory(**sse_message_history_data)
                sse_message_history.content.append(agent_sse_message)
            
            # 将 Pydantic 对象转换为 JSON 兼容的字典
            sse_message_history_dict = sse_message_history.model_dump(mode='json')

            success = await RedisClient.set(sse_message_key, sse_message_history_dict, expire=self.cache_expire_time)
            if success:
                await self.storage.save_to_django(sse_message_history_dict)
                return True
            else:
                return False
        except Exception as e:
            logger.error(f"保存agent sse消息失败: {str(e)}")
            return False

    async def get_agent_sse_message(self) -> Tuple[Optional[AgentSSEMessage], Optional[AgentSSEMessageHistory]]:
        """获取agent sse消息"""
        try:
            cache_key = self.get_cache_keys().get('agent_message_history')
            cache_data = await RedisClient.get(cache_key)
            if cache_data:
                # 将字典转换为 AgentSSEMessageHistory 对象
                sse_message_history = AgentSSEMessageHistory(**cache_data)
                agent_sse_message = sse_message_history.content[-1] if sse_message_history.content else None
                return agent_sse_message, sse_message_history
            else:
                storage_data = await self.storage.get_from_django(params={'fields': 'agent_message_history'})
                if storage_data:
                    message_history_dict = storage_data
                    success_redis = await RedisClient.set(cache_key, message_history_dict, expire=self.cache_expire_time)
                    if success_redis:
                        sse_message_history = AgentSSEMessageHistory(**message_history_dict)
                        agent_sse_message = sse_message_history.content[-1] if sse_message_history.content else None
                        return agent_sse_message, sse_message_history
                return None, None
        except Exception as e:
            logger.error(f"获取agent sse消息失败: {str(e)}")
            return None, None


    async def save_document(self, key_name: str, content: Dict[str, Any]) -> bool:
        """保存文档数据到Redis"""
        try:
            cache_key = self.get_cache_keys().get(key_name)
            if not cache_key: 
                logger.error(f"无效的文档类型: {key_name}")
                return False
            

            # 缓存到Redis
            redis_success = await RedisClient.set(cache_key, content, expire=self.cache_expire_time)
            if redis_success:
                # 如果缓存成功，将缓存的数据进行持久化到django 
                data = {
                    'key_name': key_name,
                    'content': content
                }
                success_storage = await self.storage.save_to_django(data)
                if success_storage:
                    return True
                else:
                    logger.error(f"保存文档到Django失败，项目号：{self.project_id}")
                    return False
            else:
                logger.error(f"保存文档到Redis失败，项目号：{self.project_id}")
                return False

        except Exception as e:
            logger.error(f"保存文档数据失败 {cache_key}: {str(e)}")
            return False


    
    async def get_document(self, key_name: str) -> Optional[Dict[str, Any]]:
        """从Redis获取文档数据"""
        try:
            cache_key = self.get_cache_keys().get(key_name)
            cache_data = await RedisClient.get(cache_key)
            if cache_data:
                return cache_data
            else:
                # 如果缓存失败，从django获取文档数据
                # 从storage返回的数据格式是{'key_name': 'raw_document', 'content': 'raw_document'}， 需要需要再取content
                storage_data = await self.storage.get_from_django(params={'fields': key_name})
                if storage_data:
                    success_redis = await RedisClient.set(cache_key, storage_data['content'], expire=self.cache_expire_time)
                    if success_redis:
                        return storage_data['content']
                    else:
                        logger.error(f"恢复文档数据到Redis失败，项目号：{self.project_id}")
                        return None     
                else:
                    logger.error(f"获取文档数据失败 {key_name}: {str(e)}")
                    return None
        except Exception as e:
            logger.error(f"获取文档数据失败 {key_name}: {str(e)}")
            return None


    # 清空 特定字段或全部（清空时，后端也被清空）
    async def clean_up(self, target_keys: Optional[List[str]] = None) -> Dict[str, bool]:
        """
        清理项目相关的缓存数据和存储数据
        
        Args:
            target_keys: 要清理的特定缓存键列表，如果为None则清理所有相关缓存
                        可选值: ['agent_state_history', 'agent_message_history', 'raw_document', 
                               'h1_document', 'h2h3_document', 'intro_document', 
                               'final_document', 'review_suggestions']
        
        Returns:
            Dict[str, bool]: 每个缓存键的清理结果，True表示成功，False表示失败
        """
        try:
            cache_keys = self.get_cache_keys()
            cleanup_results = {}
            
            # 如果没有指定target_keys，则清理所有缓存
            if target_keys is None:
                target_keys = list(cache_keys.keys())
            
            # 验证target_keys是否有效
            invalid_keys = [key for key in target_keys if key not in cache_keys]
            if invalid_keys:
                logger.warning(f"无效的缓存键: {invalid_keys}")
                for key in invalid_keys:
                    cleanup_results[key] = False
            
            # 清理有效的缓存键
            valid_keys = [key for key in target_keys if key in cache_keys]
            
            # 1. 清理Redis缓存
            for key in valid_keys:
                cache_key = cache_keys[key]
                try:
                    # 先检查键是否存在
                    key_exists = await RedisClient.exists(cache_key)
                    deleted_count = await RedisClient.delete(cache_key)

                    # Redis delete返回删除的键数量，>=0都表示操作成功
                    # 即使键不存在(返回0)也应该认为是成功的清理
                    cleanup_results[key] = True
                    
                    if deleted_count > 0:
                        logger.debug(f"成功清理Redis缓存: {cache_key} (键存在: {key_exists})")
                    else:
                        logger.debug(f"Redis缓存键不存在，跳过: {cache_key} (键存在: {key_exists})")
                        
                except Exception as e:
                    logger.error(f"清理Redis缓存时出错 {cache_key}: {str(e)}")
                    cleanup_results[key] = False
            
            # 2. 清理Django存储数据
            try:
                storage_success = await self.storage.clear_storage(clear_fields=valid_keys)
                if storage_success:
                    logger.debug(f"成功清理Django存储数据: {valid_keys}")
                else:
                    logger.warning(f"清理Django存储数据失败: {valid_keys}")
                    # 如果存储清理失败，更新相关键的状态
                    for key in valid_keys:
                        if cleanup_results.get(key, False):
                            cleanup_results[key] = False
                            
            except Exception as e:
                logger.error(f"清理Django存储数据时出错: {str(e)}")
                # 如果存储清理失败，更新相关键的状态
                for key in valid_keys:
                    if cleanup_results.get(key, False):
                        cleanup_results[key] = False
            
            # 统计清理结果
            successful_count = sum(1 for success in cleanup_results.values() if success)
            total_count = len(cleanup_results)
            
            logger.info(f"项目 {self.project_id} 缓存和存储清理完成: {successful_count}/{total_count} 成功")
            
            return cleanup_results

        except Exception as e:
            logger.error(f"清理缓存和存储时发生异常: {str(e)}")
            return {}





