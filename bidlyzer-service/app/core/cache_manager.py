# app/core/cache_manager.py
import logging
from typing import Optional, Dict, Any
from app.core.redis_helper import RedisClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheManager:
    """缓存管理器，提供文档结构化流程的缓存操作"""
    
    # 缓存过期时间（秒）
    DEFAULT_TIMEOUT = getattr(settings, 'STRUCTURING_CACHE_TIMEOUT', 900)  # 15分钟
    
    # 缓存键前缀
    KEY_PREFIX = 'structuring_agent:'
    
    @classmethod
    def get_state_key(cls, project_id: str) -> str:
        """获取状态缓存键"""
        return f"{cls.KEY_PREFIX}state:{project_id}"
    
    @classmethod
    def get_document_key(cls, project_id: str, doc_type: str) -> str:
        """获取文档缓存键"""
        return f"{cls.KEY_PREFIX}doc:{project_id}:{doc_type}"
    
    @classmethod
    async def cache_state(cls, project_id: str, state_data: Dict[str, Any], timeout=None) -> bool:
        """
        缓存状态数据
        
        Args:
            project_id: 项目ID
            state_data: 状态数据
            timeout: 缓存超时时间（秒）
            
        Returns:
            是否成功缓存
        """
        if timeout is None:
            timeout = cls.DEFAULT_TIMEOUT
            
        try:
            cache_key = cls.get_state_key(project_id)
            result = await RedisClient.set(cache_key, state_data, expire=timeout)
            logger.debug(f"已缓存项目 {project_id} 的状态数据")
            return result
        except Exception as e:
            logger.error(f"缓存状态数据失败: {str(e)}")
            return False
    
    @classmethod
    async def get_state(cls, project_id: str) -> Optional[Dict[str, Any]]:
        """
        获取缓存的状态数据
        
        Args:
            project_id: 项目ID
            
        Returns:
            状态数据，如果不存在则返回None
        """
        try:
            cache_key = cls.get_state_key(project_id)
            state_data = await RedisClient.get(cache_key)
            if state_data:
                logger.debug(f"成功从缓存获取项目 {project_id} 的状态数据")
            else:
                logger.debug(f"缓存中没有项目 {project_id} 的状态数据")
            return state_data
        except Exception as e:
            logger.error(f"获取缓存状态数据失败: {str(e)}")
            return None
    
    @classmethod
    async def cache_document(cls, project_id: str, doc_type: str, document: Dict[str, Any], timeout=None) -> bool:
        """
        缓存文档数据
        
        Args:
            project_id: 项目ID
            doc_type: 文档类型
            document: 文档数据
            timeout: 缓存超时时间（秒）
            
        Returns:
            是否成功缓存
        """
        if timeout is None:
            timeout = cls.DEFAULT_TIMEOUT
            
        try:
            cache_key = cls.get_document_key(project_id, doc_type)
            result = await RedisClient.set(cache_key, document, expire=timeout)
            logger.debug(f"已缓存项目 {project_id} 的 {doc_type} 文档")
            return result
        except Exception as e:
            logger.error(f"缓存文档数据失败: {str(e)}")
            return False
    
    @classmethod
    async def get_document(cls, project_id: str, doc_type: str) -> Optional[Dict[str, Any]]:
        """
        获取缓存的文档数据
        
        Args:
            project_id: 项目ID
            doc_type: 文档类型
            
        Returns:
            文档数据，如果不存在则返回None
        """
        try:
            cache_key = cls.get_document_key(project_id, doc_type)
            document = await RedisClient.get(cache_key)
            if document:
                logger.debug(f"成功从缓存获取项目 {project_id} 的 {doc_type} 文档")
            else:
                logger.debug(f"缓存中没有项目 {project_id} 的 {doc_type} 文档")
            return document
        except Exception as e:
            logger.error(f"获取缓存文档数据失败: {str(e)}")
            return None
    
    @classmethod
    async def clear_project_cache(cls, project_id: str) -> bool:
        """
        清除项目的所有缓存
        
        Args:
            project_id: 项目ID
            
        Returns:
            是否成功清除
        """
        try:
            # 获取所有可能的缓存键
            keys = [
                cls.get_state_key(project_id),
                cls.get_document_key(project_id, 'document'),
                cls.get_document_key(project_id, 'h1'),
                cls.get_document_key(project_id, 'h2h3'),
                cls.get_document_key(project_id, 'intro'),
                cls.get_document_key(project_id, 'final'),
            ]
            
            # 删除所有缓存
            for key in keys:
                await RedisClient.delete(key)
                
            logger.info(f"已清除项目 {project_id} 的所有缓存")
            return True
        except Exception as e:
            logger.error(f"清除项目缓存失败: {str(e)}")
            return False