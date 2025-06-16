import logging
from typing import Optional, Dict, Any
from datetime import datetime


from app.services.cache import Cache
from app.services.storage import Storage
from app.services.broadcast import publish_state_update, publish_error_event
from app.services.structuring.state_manager import create_state_manager, AgentStateData
from app.services.structuring.state import (
    StateEnum, ProcessingStep,
    StateRegistry, ING_STATE_POOL, ED_STATE_POOL,
    ProcessingError
)

from app.tasks.agent_tasks import run_structuring


logger = logging.getLogger(__name__)


class Agent:
    """ """

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.state_manager = create_state_manager(project_id)
        self.cache = Cache(project_id)
        self.storage = Storage(project_id)


    # =============== 状态管理 ===============
    @property
    async def agent_state(self) -> Optional[AgentStateData]:
        """获取当前状态数据"""
        return await self.cache.get_agent_state()
    
    @property
    async def current_state(self) -> Optional[StateEnum]:
        """获取当前内部状态"""
        agent_state = await self.cache.get_agent_state()
        current_state = agent_state.state
        return current_state


    async def init_agent(self):
        """初始化Agent"""

        # 检查状态是否存在，并获取状态数据
        agent_state = await self.cache.get_agent_state()
        if not agent_state or not agent_state.state:
            state = await self.state_manager.initialize_agent()
            print(f"初始化到state: {state}")
        else:
            state = await self.state_manager.recover_state(agent_state.state)
            print(f"恢复到state: {state}")
        return state


    async def run_agent(self):
        """运行Agent"""
        try:
            state = await self.init_agent()
            if state: 
                run_structuring.delay(self.project_id)
        except Exception as e:
            error_msg = f"运行Agent失败: {str(e)}"
            logger.error(error_msg)
            await self.state_manager._handle_error("run_agent_error", error_msg)
            raise ProcessingError(error_msg)
            

