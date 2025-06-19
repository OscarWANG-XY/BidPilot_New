from app.services.bp_state import AgentState, StageEnum, StageStatus, stage_config
from typing import Tuple
from datetime import datetime
import logging
from app.services.cache import Cache

logger = logging.getLogger(__name__)

# 设计基于AgentState的state_manager
# 职责：提供状态管理的工具，包括初始化、恢复、存储、转换
class AgentStateManager:
    """AgentState管理器"""
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.cache = Cache(self.project_id)
        logger.info(f"完成项目 {project_id} 的AGENT-STATE-MANAGER的初始化")


    async def init_or_restore_agent(self) -> Tuple[AgentState, StageEnum, str]:
        """初始化agent"""

        #检查是否存在当前状态
        current_state,_ = await self.cache.get_agent_state()
        action_type = ""

        #如果没有状态，执行初始化
        if not current_state:
            print("(2.1)当前状态为空，准备初始化")
            logger.info(f"(2.1)AGENT 尚未启用，将进行初始化")
            initial_state = AgentState(
                agent_id=self.project_id,
                overall_progress=0,
                active_stage=StageEnum.UPLOADING,
                stage_status=StageStatus.NOT_STARTED,
                stage_task_id=None,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            logger.info(f"AGENT 初始化成功")

            # 初始化agent_stage
            initial_stage = StageEnum.UPLOADING

            action_type = "INIT"

            # 保存初始化状态
            await self.cache.save_agent_state(initial_state)
            
            return initial_state, initial_stage, action_type
        
        # 如果存在当前状态，执行恢复
        else:
            print(f"当前状态为：{current_state}")
            # 针对最后阶段，且状态为完成的情况
            active_stage_config = stage_config[current_state.active_stage]
            if active_stage_config["stage_type"] == "END_STAGE" and current_state.stage_status == StageStatus.COMPLETED:
                logger.info(f"(2.2)AGENT 已经成功完成所有阶段任务，请查看结果")
                return None

            else:
            # 其他所有情况：
                logger.info(f"(2.3)AGENT 已启用，将恢复至最新状态")
                restore_state = current_state
                restore_stage = self._determine_stage(restore_state)

                action_type = "RESTORE"

                return restore_state, restore_stage, action_type

    def _determine_stage(self, restore_state: AgentState) -> None:
        # 决定接下去的执行步骤
        if restore_state == None:
            raise ValueError("AGENT未初始化或恢复状态，无法确定下个步骤")
        # 除非stage_status是完成，执行下一个stage，否则都执行当前stage
        if restore_state.stage_status == StageStatus.COMPLETED:
            print(f'(2.4)当前阶段：{restore_state.active_stage}')
            active_stage = restore_state.active_stage
            next_stage = stage_config[active_stage]["next_stage"]
            if not next_stage:
                raise ValueError("(2.5)无下个阶段，AGENT可能已经完成所有任务")
            stage_to_run = next_stage
            return stage_to_run
        else:
            # 否则，继续执行当前的stage
            stage_to_run = restore_state.active_stage
            return stage_to_run


    # =========================== 工具函数 ===========================

    # 写一个工具函数，根据stage_config验证stage转化是否合理，
    def validate_stage_transition(current_stage: StageEnum, next_stage: StageEnum) -> bool:
        """验证stage转化是否合理"""
        if next_stage is None:
            return True
        return next_stage in stage_config[current_stage]["next_stage"]


    async def update_agent_state(self, overall_progress: int, active_stage: StageEnum, stage_status: StageStatus, stage_task_id: str) -> None:
        """更新stage状态"""
        current_state,_ = await self.cache.get_agent_state()
        if not current_state:
            raise ValueError("AGENT未初始化或恢复状态，无法更新状态")
        current_state.overall_progress = overall_progress
        current_state.active_stage = active_stage
        current_state.stage_status = stage_status
        current_state.stage_task_id = stage_task_id
        current_state.updated_at = datetime.now()
        await self.cache.save_agent_state(current_state)







    def transition_to_stage(self, tar_stage: StageEnum) -> None:
        """转换到指定阶段"""
        if self.agent_state is None:
            raise ValueError("Agent not initialized. Call init_agent first.")
            
        if not self.validate_stage_transition(self.agent_state.active_stage, tar_stage):
            raise ValueError(f"Invalid stage transition from {self.agent_state.active_stage} to {tar_stage}")
        
        #保存当前状态到数据库 TODO
        # await self.save_agent_state()


