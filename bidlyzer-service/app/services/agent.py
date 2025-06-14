import logging
from typing import Optional, Dict, Any
from datetime import datetime
import asyncio
import json
import traceback

from .state_manager import create_state_manager, AgentStateData
from .state import (
    StateEnum, ProcessingStep,
    StateRegistry, ING_STATE_POOL, ED_STATE_POOL,
    ProcessingError
)

# 假设这些执行组件已经正确迁移

logger = logging.getLogger(__name__)


class StructuringAgent:
    """
    父Agent - 负责串联子Agent的工作的
    组件：
    - 开场的状态 :upload
    - 先尝试连接上，发送两条消息：
    - 第一条： 欢迎消息， 然后问开始么？
    - 第二条： 动作指导： 请上传文件
    - 第三条： 成功上传， 开始结构化分析 （转给structuringAgent）

    """




    