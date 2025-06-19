import asyncio
from app.services.bp_state import StageEnum, StageStatus, stage_config
from app.services.bp_msg import AgentMessage, AgentMessageHistory
from app.services.bp_state_manager import AgentStateManager
from app.services.bp_tasks import inspect_task_info, run_structuring, run_planning, run_writing
import logging

logger = logging.getLogger(__name__)

# 模拟一个STRUCTURING, PLANNING, WRITING的流程 
class BidPilot:
    """模拟一个STRUCTURING, PLANNING, WRITING的流程 """

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.manager = AgentStateManager(self.project_id)
        self.stage_task_id = None
        logger.info(f"(1)完成项目 {project_id} 的BIDPILOT AGENT的初始化")


    async def run_agent(self):
        """运行流程"""
        state, stage, action_type = await self.manager.init_or_restore_agent()


        # 发送消息：正在初始化AGENT ...      
        if action_type == "INIT":
            await asyncio.sleep(0.1)
            state_config = stage_config[state.active_stage]
            message = state_config["description"]
            print(f"(2)正在初始化AGENT ... {message}")
            # await send_message (stage)
        
        # 发送消息：正在恢复AGENT 到 state阶段 ...
        elif action_type == "RESTORE":
            await asyncio.sleep(0.1)
            # await send_message (stage)
            print(f"(2)正在恢复AGENT 到 {stage} 阶段 ... ")
        

        await self.process_stage(stage)



    async def process_stage(self, stage: StageEnum):
        
        if stage == StageEnum.UPLOADING:
            # 开始新的stage: update agent_state (new_active stage, stage_status = IN_PROGRESS)
            print(f"更新AGENT状态 - UPLOADING - IN_PROGRESS")
            await self.manager.update_agent_state(
                overall_progress=0,
                active_stage=stage,
                stage_status=StageStatus.IN_PROGRESS,
                stage_task_id=None
            )

            print(f"请上传招标文件")
            # await asyncio.sleep(2)
            # 等待用户给输入， 用户的输入通过 API端点， 触发agent跳转到下一个状态，然后重新run_agent的流程里。 

            # if 检查当前阶段完成
            # 完成当前stage: update agent_state (stage_status = COMPLETED)
            # 自动跳回下个阶段
            # else: 返回空， 不阻塞前端，同时等等celery返回的消息，一旦有消息完成，重新run_agent的流程里。
            return None

        if stage == StageEnum.STRUCTURING:

            # 开始新的stage: update agent_state (new_active stage, stage_status = IN_PROGRESS)
            print(f"正在进行文档结构化分析...")
            self.stage_task_id = run_structuring.delay()
            # 完成当前stage: update agent_state (stage_status = COMPLETED)

            print(f"更新AGENT状态 - STRUCTURING - IN_PROGRESS")
            await self.manager.update_agent_state(
                overall_progress=stage_config[StageEnum.UPLOADING]["overall_progress"],
                active_stage=stage,
                stage_status=StageStatus.IN_PROGRESS,
                stage_task_id=str(self.stage_task_id)
            )

            return None
    

        if stage == StageEnum.PLANNING:

            # 开始新的stage: update agent_state (new_active stage, stage_status = IN_PROGRESS)
            print(f"正在进行文档结构化分析...")
            self.stage_task_id = run_planning.delay()
            # 完成当前stage: update agent_state (stage_status = COMPLETED)

            print(f"更新AGENT状态 - PLANNING - IN_PROGRESS")
            await self.manager.update_agent_state(
                overall_progress=stage_config[StageEnum.STRUCTURING]["overall_progress"],
                active_stage=stage,
                stage_status=StageStatus.IN_PROGRESS,
                stage_task_id=str(self.stage_task_id)
            )

            return None



        if stage == StageEnum.WRITING:


            # 开始新的stage: update agent_state (new_active stage, stage_status = IN_PROGRESS)
            print(f"正在进行文档结构化分析...")
            self.stage_task_id = run_writing.delay()
            # 完成当前stage: update agent_state (stage_status = COMPLETED)

            print(f"更新AGENT状态 - WRITING - IN_PROGRESS")
            await self.manager.update_agent_state(
                overall_progress=stage_config[StageEnum.PLANNING]["overall_progress"],
                active_stage=stage,
                stage_status=StageStatus.IN_PROGRESS,
                stage_task_id=str(self.stage_task_id)
            )

            return None



        else:
            raise ValueError(f"Invalid stage: {stage}")






