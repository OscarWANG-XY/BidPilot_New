# app/core/cache_manager.py

from datetime import datetime
from typing import Optional, Dict, Any, List
from app.core.redis_helper import RedisClient
from app.core.config import settings
from app.services.structuring.state import StateRegistry, ED_STATE_POOL
from app.services.structuring.storage import Storage

import logging
logger = logging.getLogger(__name__)

from app.services.structuring.schema import (
    AgentStateData, AgentStateHistory, 
    SSEMessageRecord, SSEMessageHistory
    )


class Cache:
    """缓存管理器，提供文档结构化流程的缓存操作"""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.KEY_PREFIX = 'structuring_agent:'
        self.max_message_history = 100  # 最大消息历史记录数
        self.cache_expire_time = 900   # 缓存过期时间
        self.storage = Storage(project_id)
    

    def get_cache_keys(self) -> str:
        """获取状态缓存键"""
        return {
            'agent_state_history': f"{self.KEY_PREFIX}{self.project_id}:agent_state_history",
            'raw_document': f"{self.KEY_PREFIX}{self.project_id}:raw_document",
            'h1_document': f"{self.KEY_PREFIX}{self.project_id}:h1_document",
            'h2h3_document': f"{self.KEY_PREFIX}{self.project_id}:h2h3_document", 
            'intro_document': f"{self.KEY_PREFIX}{self.project_id}:intro_document",
            'final_document': f"{self.KEY_PREFIX}{self.project_id}:final_document",
            'sse_message_log': f"{self.KEY_PREFIX}{self.project_id}:sse_message_log",
            'sse_channel': f"{self.KEY_PREFIX}{self.project_id}:sse_channel",
        }
    
    def _generate_message_id(self) -> str:
        """生成消息唯一标识"""
        import uuid
        return f"{self.project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
    
    # 存储agent_state历史记录到Redis，已添加持久化存储到django
    async def add_agent_state_to_history(self, agent_state: AgentStateData) -> bool:
        """保存Agent状态到历史记录中"""
        try:
            # 获取现有历史记录
            state_history = await self._get_agent_state_history()
            if not state_history:
                state_history = AgentStateHistory(project_id=self.project_id)
            
            # 创建当前状态的副本并添加到历史记录
            state_copy = AgentStateData(**agent_state.model_dump())
            state_history.agent_states.append(state_copy)
            state_history.total_states = len(state_history.agent_states)
            state_history.last_updated = datetime.now()
            
            # 限制历史记录数量，保留最新的50条记录
            max_history_records = 50
            if len(state_history.agent_states) > max_history_records:
                state_history.agent_states = state_history.agent_states[-max_history_records:]
                state_history.total_states = len(state_history.agent_states)
            
            # 保存历史记录到Redis
            history_key = self.get_cache_keys().get('agent_state_history')
            history_data = state_history.model_dump(mode='json')
            
            success_redis = await RedisClient.set(history_key, history_data, expire=self.cache_expire_time)
            
            if success_redis:
                # 如果缓存成功，将缓存的数据进行持久化到django 
                success_storage = await self.storage.save_agent_state_history_to_django(state_history)
                if success_storage:
                    return True
                else:
                    logger.error(f"保存状态到Django失败，项目号：{self.project_id}")
                    return False
            else:
                logger.error(f"保存状态到Redis失败，项目号：{self.project_id}")
                return False

        except Exception as e:
            logger.error(f"保存状态到历史记录时出错: {str(e)}")
            return False

    #已添加从django持久化恢复的功能
    async def _get_agent_state_history(self) -> Optional[AgentStateHistory]:
        """获取Agent状态历史记录"""
        try:
            cache_key = self.get_cache_keys().get('agent_state_history')
            cache_data = await RedisClient.get(cache_key)
            
            if cache_data:
                return AgentStateHistory(**cache_data)
            else:
                # 如果缓存失败，从django获取历史记录storage_data, 格式为AgentStateHistory
                storage_data = await self.storage.get_agent_state_history_from_django()
                if storage_data:
                    # 恢复缓存数据
                    storage_json = storage_data.model_dump(mode='json')
                    success_redis = await RedisClient.set(cache_key, storage_json, expire=self.cache_expire_time)
                    if success_redis:
                        # 缓存恢复成功后，才返回数据
                        return storage_data
                    else:
                        logger.error(f"恢复缓存失败，项目号：{self.project_id}")
                        return None
                else:
                    logger.debug(f"项目 {self.project_id} 没有历史状态记录，这是正常的初始状态")
                    return None
            
        except Exception as e:
            logger.error(f"获取状态历史记录失败: {str(e)}")
            return None

    async def get_agent_state(self) -> Optional[AgentStateData]:
        """获取当前Agent状态数据（从历史记录的最新值获取）"""
        try:
            sorted_states = await self._get_sorted_agent_states()
            latest_state = sorted_states[0] if sorted_states else None
            if latest_state:
                logger.debug(f"成功获取项目 {self.project_id} 的最新状态")
            else:
                logger.debug(f"项目 {self.project_id} 没有状态记录")
            
            return latest_state
            
        except Exception as e:
            logger.error(f"获取当前状态失败: {str(e)}")
            return None

    async def _get_sorted_agent_states(self, limit: Optional[int] = None) -> List[AgentStateData]:
        """获取Agent状态历史记录（公共接口）"""
        try:
            state_history = await self._get_agent_state_history()
            if not state_history or not state_history.agent_states:
                return []
            
            # 按时间排序（最新的在前）
            sorted_states = sorted(
                state_history.agent_states,
                key=lambda x: x.updated_at,
                reverse=True
            )
            
            # 限制返回数量
            if limit:
                sorted_states = sorted_states[:limit]
            
            return sorted_states
            
        except Exception as e:
            logger.error(f"获取状态历史记录失败: {str(e)}")
            return []


    # 存储agent_sse_message_history到Redis
    async def add_agent_sse_message_to_history(self, event_type: str, event_data: Dict[str, Any]) -> bool:
        """存储SSE消息到历史记录"""
        try:
            # 生成消息记录 - 只使用SSEMessageRecord实际支持的字段
            message_record = SSEMessageRecord(
                message_id=self._generate_message_id(),
                project_id=self.project_id,
                event_type=event_type,
                event_data=event_data,
            )
            
            # 获取现有消息历史, 数据格式为SSEMessageHistory
            message_history = await self.get_agent_sse_message_history()
            if not message_history:
                message_history = SSEMessageHistory(project_id=self.project_id)
            
            # 添加新消息
            message_history.messages.append(message_record)
            message_history.last_updated = datetime.now()
            message_history.total_messages = len(message_history.messages)
            
            # 限制消息数量，保留最新的消息
            if len(message_history.messages) > self.max_message_history:
                message_history.messages = message_history.messages[-self.max_message_history:]
                message_history.total_messages = len(message_history.messages)
            
            # 保存到Redis
            cache_key = self.get_cache_keys().get('sse_message_log')
            message_data = message_history.model_dump(mode='json')
            
            success_redis = await RedisClient.set(cache_key, message_data, expire=self.cache_expire_time)
            
            if success_redis:
                # 如果缓存成功，将缓存的数据进行持久化到django 
                success_storage = await self.storage.save_agent_message_to_django(message_history)
                if success_storage:
                    return True
                else:
                    logger.error(f"保存SSE消息历史到Django失败，项目号：{self.project_id}")
                    return False
            else:
                logger.error(f"保存SSE消息历史到Redis失败，项目号：{self.project_id}")
                return False

        except Exception as e:
            logger.error(f"存储SSE消息时出错: {str(e)}")
            return False

    async def get_agent_sse_message_history(self) -> Optional[SSEMessageHistory]:
        """获取SSE消息历史记录"""
        try:
            cache_key = self.get_cache_keys().get('sse_message_log')
            cache_data = await RedisClient.get(cache_key)
            
            if cache_data:
                return SSEMessageHistory(**cache_data)
            else:
                # 如果缓存失败，从django获取历史记录
                storage_data = await self.storage.get_agent_message_from_django()
                if storage_data:
                    # 恢复缓存数据
                    storage_json = storage_data.model_dump(mode='json')
                    success_redis = await RedisClient.set(cache_key, storage_json, expire=self.cache_expire_time)
                    if success_redis:
                        # 缓存恢复成功后，才返回数据
                        return storage_data
                    else:
                        logger.error(f"恢复SSE消息历史到Redis失败，项目号：{self.project_id}")
                        return None
                else:
                    logger.debug(f"项目 {self.project_id} 没有SSE消息历史记录，这是正常的初始状态")
                    return None
            
        except Exception as e:
            logger.error(f"获取SSE消息历史失败: {str(e)}")
            return None



    async def store_step_result(self, agent_state: AgentStateData, result_data: Dict[str, Any]):
        """存储步骤结果数据"""
        if agent_state.current_internal_state in ED_STATE_POOL:

            state_config = StateRegistry.get_state_config(agent_state.current_internal_state)
            step = state_config.state_to_step
            step_config = StateRegistry.get_step_config(step)
            doc_name = step_config.doc_name # 获取步骤结果的缓存键
            await self._save_document(doc_name=doc_name, content=result_data) # 存储到Redis

        else:
            logger.warning(f"改状态下无需存储结果: {agent_state.current_internal_state}")
            return False

    async def _save_document(self, doc_name: str, content: Dict[str, Any]) -> bool:
        """保存文档数据到Redis"""
        try:
            cache_key = self.get_cache_keys().get(doc_name)
            if not cache_key: 
                logger.error(f"无效的文档类型: {doc_name}")
                return False
            
            # 缓存到Redis
            redis_success = await RedisClient.set(cache_key, content, expire=self.cache_expire_time)
            if redis_success:
                # 如果缓存成功，将缓存的数据进行持久化到django 
                success_storage = await self.storage.save_document_to_django(doc_name, content)
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

    async def get_document(self, doc_name: str) -> Optional[Dict[str, Any]]:
        """从Redis获取文档数据"""
        try:
            cache_key = self.get_cache_keys().get(doc_name)
            cache_data = await RedisClient.get(cache_key)
            if cache_data:
                return cache_data
            else:
                # 如果缓存失败，从django获取文档数据
                storage_data = await self.storage.get_document_from_django(doc_name)
                if storage_data:
                    success_redis = await RedisClient.set(cache_key, storage_data, expire=self.cache_expire_time)
                    if success_redis:
                        return storage_data
                    else:
                        logger.error(f"恢复文档数据到Redis失败，项目号：{self.project_id}")
                        return None     
                else:
                    logger.error(f"获取文档数据失败 {doc_name}: {str(e)}")
                    return None
        except Exception as e:
            logger.error(f"获取文档数据失败 {doc_name}: {str(e)}")
            return None



    # 以下各方法只用于测试，正常情况下不删除
    async def clean_up(self, target_keys: Optional[List[str]] = None) -> Dict[str, bool]:
        """
        清理项目相关的缓存数据
        
        Args:
            target_keys: 要清理的特定缓存键列表，如果为None则清理所有相关缓存
                        可选值: ['agent_state', 'agent_state_history', 'raw_document', 
                               'h1_document', 'h2h3_document', 'intro_document', 
                               'final_document', 'sse_message_log', 'sse_channel']
        
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
                        logger.debug(f"成功清理缓存: {cache_key} (键存在: {key_exists})")
                    else:
                        logger.debug(f"缓存键不存在，跳过: {cache_key} (键存在: {key_exists})")
                        
                except Exception as e:
                    logger.error(f"清理缓存时出错 {cache_key}: {str(e)}")
                    cleanup_results[key] = False
            
            # 统计清理结果
            successful_count = sum(1 for success in cleanup_results.values() if success)
            total_count = len(cleanup_results)
            
            logger.info(f"项目 {self.project_id} 缓存清理完成: {successful_count}/{total_count} 成功")
            
            return cleanup_results

        except Exception as e:
            logger.error(f"清理缓存时发生异常: {str(e)}")
            return {}

    async def clean_up_all(self) -> bool:
        """
        清理项目的所有缓存数据（便捷方法）
        
        Returns:
            bool: 是否全部清理成功
        """
        try:
            results = await self.clean_up()
            all_successful = all(results.values()) if results else False
            
            if all_successful:
                logger.info(f"项目 {self.project_id} 所有缓存清理成功")
            else:
                logger.warning(f"项目 {self.project_id} 部分缓存清理失败")
            
            return all_successful
            
        except Exception as e:
            logger.error(f"清理所有缓存时出错: {str(e)}")
            return False

    async def check_cache_status(self) -> Dict[str, bool]:
        """
        检查项目相关缓存键的存在状态
        
        Returns:
            Dict[str, bool]: 每个缓存键的存在状态
        """
        try:
            cache_keys = self.get_cache_keys()
            status_results = {}
            
            for key, cache_key in cache_keys.items():
                try:
                    exists = await RedisClient.exists(cache_key)
                    status_results[key] = exists
                    logger.debug(f"缓存键 {key}: {cache_key} - 存在: {exists}")
                except Exception as e:
                    logger.error(f"检查缓存键状态失败 {cache_key}: {str(e)}")
                    status_results[key] = False
            
            return status_results
            
        except Exception as e:
            logger.error(f"检查缓存状态时发生异常: {str(e)}")
            return {}




