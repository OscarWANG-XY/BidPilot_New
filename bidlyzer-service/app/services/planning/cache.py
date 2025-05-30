from datetime import datetime
from typing import Optional, Dict, Any, List
from app.core.redis_helper import RedisClient
from app.core.config import settings
from app.services.planning.state import StateRegistry, ED_STATE_POOL
from app.services.structuring.cache import Cache as StructuringCache
# from app.services.planning.storage import Storage

import logging
logger = logging.getLogger(__name__)


class Cache:
    """缓存管理器，提供文档结构化流程的缓存操作"""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.KEY_PREFIX = 'planning_agent:'
        self.max_message_history = 100  # 最大消息历史记录数
        self.cache_expire_time = 900   # 缓存过期时间
        # self.storage = Storage(project_id)
        self.structuring_cache = StructuringCache(project_id)