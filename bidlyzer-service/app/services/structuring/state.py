# state_v2.py - 优化版状态管理系统
# 解决复杂度、一致性维护、框架适配等问题

from enum import Enum
from typing import Optional, Dict, Any, List, Union, Callable, Type
from pydantic import BaseModel, Field
from datetime import datetime
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# =========================Part 1:  agent 状态、步骤、用户操作 定义 =========================

# agent 的内部状态和用户可见状态 （以及它们之间的映射关系）
class SystemInternalState(str, Enum):
    """系统内部的细粒度状态 - 用于精确控制处理流程"""
    # 微服务从文档提取开始，文件上传由Django处理
    EXTRACTING_DOCUMENT = "extracting_document"
    DOCUMENT_EXTRACTED = "document_extracted"
    ANALYZING_OUTLINE_H1 = "analyzing_outline_h1"
    OUTLINE_H1_ANALYZED = "outline_h1_analyzed"
    ANALYZING_OUTLINE_H2H3 = "analyzing_outline_h2h3"
    OUTLINE_H2H3_ANALYZED = "outline_h2h3_analyzed"
    ADDING_INTRODUCTION = "adding_introduction"
    INTRODUCTION_ADDED = "introduction_added"
    REVIEWING_STRUCTURE = "reviewing_structure"
    STRUCTURE_REVIEWED = "structure_reviewed"
    FAILED = "failed"

class StateType(str, Enum):
    ING = "ing"
    ED = "ed"
    FAILED = "failed"

ING_STATE_POOL = [
    SystemInternalState.EXTRACTING_DOCUMENT,
    SystemInternalState.ANALYZING_OUTLINE_H1,
    SystemInternalState.ANALYZING_OUTLINE_H2H3,
    SystemInternalState.ADDING_INTRODUCTION,
    SystemInternalState.REVIEWING_STRUCTURE,
]

# AWAITING_STATE_POOL = [
    
# ]

ED_STATE_POOL = [
    SystemInternalState.DOCUMENT_EXTRACTED,
    SystemInternalState.OUTLINE_H1_ANALYZED,
    SystemInternalState.OUTLINE_H2H3_ANALYZED,
    SystemInternalState.INTRODUCTION_ADDED,
    SystemInternalState.STRUCTURE_REVIEWED,
]

class UserVisibleState(str, Enum):
    """用户可见的简化状态 - 4个主要阶段"""
    PROCESSING = "processing"      # 智能结构分析处理阶段（从文档提取开始）
    COMPLETED = "completed"       # 智能结构分析完成状态
    FAILED = "failed"            # 失败状态

INTERNAL_TO_USER_STATE_MAP = {
    SystemInternalState.EXTRACTING_DOCUMENT: UserVisibleState.PROCESSING,
    SystemInternalState.DOCUMENT_EXTRACTED: UserVisibleState.PROCESSING,
    SystemInternalState.ANALYZING_OUTLINE_H1: UserVisibleState.PROCESSING,
    SystemInternalState.OUTLINE_H1_ANALYZED: UserVisibleState.PROCESSING,
    SystemInternalState.ANALYZING_OUTLINE_H2H3: UserVisibleState.PROCESSING,
    SystemInternalState.OUTLINE_H2H3_ANALYZED: UserVisibleState.PROCESSING,
    SystemInternalState.ADDING_INTRODUCTION: UserVisibleState.PROCESSING,
    SystemInternalState.INTRODUCTION_ADDED: UserVisibleState.PROCESSING,
    SystemInternalState.REVIEWING_STRUCTURE: UserVisibleState.PROCESSING,
    SystemInternalState.STRUCTURE_REVIEWED: UserVisibleState.COMPLETED,
    SystemInternalState.FAILED: UserVisibleState.FAILED,
}

# agent 处理的步骤 
class ProcessingStep(str, Enum):
    """处理步骤枚举"""
    EXTRACT = "extract"
    ANALYZE_H1 = "analyze_h1"
    ANALYZE_H2H3 = "analyze_h2h3"
    ADD_INTRODUCTION = "add_introduction"
    REVIEW_STRUCTURE = "review_structure"

# required 用户操作 
class UserAction(str, Enum):
    """用户操作枚举 - 移除upload_document，因为上传在Django完成"""
    COMPLETE_EDITING = "complete_editing"
    RETRY = "retry"
    CANCEL = "cancel"

# ==========================Part 2: 状态注册器 ==========================
# 定义了state_config, step_config, action_config的数据结构
# 定义了注册state, step, action 的装饰器， 以及获取state_config, step_config, action_config的方法

class StateConfigData(BaseModel):
    """状态元数据 - 统一配置"""
    # 用户体验相关
    state_order: int = Field(description="状态顺序")
    display_name: str = Field(description="显示名称")
    description: str = Field(description="状态描述")
    state_type: Optional[StateType] = Field(default=None, description="状态类型")
    # 处理相关
    previous_state: Optional[SystemInternalState] = Field(default=None, description="上一个状态")
    next_state: Optional[SystemInternalState] = Field(default=None, description="下一个状态")
    # ING 状态
    state_to_step: Optional[ProcessingStep] = Field(default=None, description="状态到步骤的映射")
    # ED 状态
    next_step: Optional[ProcessingStep] = Field(default=None, description="下一个步骤")
    # FAILED 状态


    # 暂时未启用字段
    auto_transition: bool = Field(default=False, description="是否自动转换")
    requires_user_input: bool = Field(default=False, description="是否需要用户输入")
    can_retry: bool = Field(default=False, description="是否可重试")
    is_terminal: bool = Field(default=False, description="是否为终止状态")
    estimated_duration: Optional[int] = Field(default=None, description="预估耗时(秒)")

class StepConfigData(BaseModel):
    """步骤配置数据"""
    description: str = Field(description="步骤描述")
    required_states: List[SystemInternalState] = Field(description="前置状态")
    target_state: SystemInternalState = Field(description="目标状态")
    user_triggered: bool = Field(description="是否需要用户触发")
    doc_name: str = Field(description="文档名")
    suggestions_doc_name: Optional[str] = Field(default=None, description="建议文档名")
    
# class ActionConfigData(BaseModel):
#     """操作配置数据"""
#     description: str = Field(description="操作描述")
#     valid_states: List[SystemInternalState] = Field(description="有效状态")
#     target_step: Optional[ProcessingStep] = Field(default=None, description="目标步骤")
#     requires_payload: bool = Field(description="是否需要输入")

class StateRegistry:
    """状态注册器 - 自动化配置管理"""
    
    _state_configs: Dict[SystemInternalState, StateConfigData] = {}
    _step_configs: Dict[ProcessingStep, StepConfigData] = {}
    # _action_configs: Dict[UserAction, ActionConfigData] = {}
    
    @classmethod
    def register_state(cls, state: SystemInternalState):
        """状态注册装饰器"""
        # docorator 以 config_func为参数
        # config_func 无输入，而输出StateMetadata， 这个函数的作用是获取配置元信息
        # decorator里，将config_func 的输出， 赋值给 cls._state_configs[state]进行存储
        # 最后返回config_func， 允许被装饰的函数保持原样。 
        def decorator(config_func: Callable[[], StateConfigData]):
            cls._state_configs[state] = config_func()
            return config_func
        return decorator
    
    @classmethod
    def register_step(cls, step: ProcessingStep):
        """步骤注册装饰器"""
        def decorator(config_func: Callable[[], StepConfigData]):
            cls._step_configs[step] = config_func()
            return config_func
        return decorator
    
    # @classmethod
    # def register_action(cls, action: UserAction):
    #     """操作注册装饰器"""
    #     def decorator(config_func: Callable[[], ActionConfigData]):
    #         cls._action_configs[action] = config_func()
    #         return config_func
    #     return decorator
    
    @classmethod
    def get_state_config(cls, state: SystemInternalState) -> StateConfigData:
        """获取状态配置"""
        return cls._state_configs.get(state)
    
    @classmethod
    def get_step_config(cls, step: ProcessingStep) -> StepConfigData:
        """获取步骤配置"""
        return cls._step_configs.get(step)
    
    # @classmethod
    # def get_action_config(cls, action: UserAction) -> ActionConfigData:
    #     """获取操作配置"""
    #     return cls._action_configs.get(action)


# ======================== Part 3: 注册state_config, step_config, action_config 的值 ========================

# ========================= 状态值注册 =========================
@StateRegistry.register_state(SystemInternalState.EXTRACTING_DOCUMENT)
def _extracting_document_config():
    return StateConfigData(
        state_order = 1,
        display_name="提取文档",
        description="正在提取文档内容...",
        state_type=StateType.ING,
        previous_state=None,
        next_state=SystemInternalState.DOCUMENT_EXTRACTED,
        state_to_step=ProcessingStep.EXTRACT,
    )

@StateRegistry.register_state(SystemInternalState.DOCUMENT_EXTRACTED)
def _document_extracted_config():
    return StateConfigData(
        state_order = 2,
        display_name="文档提取完成",
        description="文档提取完成，开始智能分析",
        state_type=StateType.ED,
        previous_state=SystemInternalState.EXTRACTING_DOCUMENT,
        next_state=SystemInternalState.ANALYZING_OUTLINE_H1,
        state_to_step=ProcessingStep.EXTRACT,
        next_step=ProcessingStep.ANALYZE_H1,
    )

@StateRegistry.register_state(SystemInternalState.ANALYZING_OUTLINE_H1)
def _analyzing_h1_config():
    return StateConfigData(
        state_order = 3,
        display_name="分析主要章节",
        description="正在分析文档主要章节结构...",
        state_type=StateType.ING,
        previous_state=SystemInternalState.DOCUMENT_EXTRACTED,
        next_state=SystemInternalState.OUTLINE_H1_ANALYZED,
        state_to_step=ProcessingStep.ANALYZE_H1,
    )

@StateRegistry.register_state(SystemInternalState.OUTLINE_H1_ANALYZED)
def _h1_analyzed_config():
    return StateConfigData(
        state_order = 4,
        display_name="主要章节分析完成",
        description="主要章节分析完成，开始细化子章节",
        state_type=StateType.ED,
        previous_state=SystemInternalState.ANALYZING_OUTLINE_H1,
        next_state=SystemInternalState.ANALYZING_OUTLINE_H2H3,
        state_to_step=ProcessingStep.ANALYZE_H1,
        next_step=ProcessingStep.ANALYZE_H2H3,
    )

@StateRegistry.register_state(SystemInternalState.ANALYZING_OUTLINE_H2H3)
def _analyzing_h2h3_config():
    return StateConfigData(
        state_order = 5,
        display_name="分析子章节",
        description="正在分析文档子章节结构...",
        state_type=StateType.ING,
        previous_state=SystemInternalState.OUTLINE_H1_ANALYZED,
        next_state=SystemInternalState.OUTLINE_H2H3_ANALYZED,
        state_to_step=ProcessingStep.ANALYZE_H2H3,
    )

@StateRegistry.register_state(SystemInternalState.OUTLINE_H2H3_ANALYZED)
def _h2h3_analyzed_config():
    return StateConfigData(
        state_order = 6,
        display_name="子章节分析完成",
        description="子章节分析完成，开始添加引言",
        state_type=StateType.ED,
        previous_state=SystemInternalState.ANALYZING_OUTLINE_H2H3,
        next_state=SystemInternalState.ADDING_INTRODUCTION,
        state_to_step=ProcessingStep.ANALYZE_H2H3,
        next_step=ProcessingStep.ADD_INTRODUCTION,
    )

@StateRegistry.register_state(SystemInternalState.ADDING_INTRODUCTION)
def _adding_introduction_config():
    return StateConfigData(
        state_order = 7,
        display_name="添加引言",
        description="正在为文档添加引言部分...",
        state_type=StateType.ING,
        previous_state=SystemInternalState.OUTLINE_H2H3_ANALYZED,
        next_state=SystemInternalState.INTRODUCTION_ADDED,
        state_to_step=ProcessingStep.ADD_INTRODUCTION,        
    )

@StateRegistry.register_state(SystemInternalState.INTRODUCTION_ADDED)
def _introduction_added_config():
    return StateConfigData(
        state_order = 8,
        display_name="引言添加完成",
        description="文档结构化完成，请进行编辑",
        state_type=StateType.ED,
        previous_state=SystemInternalState.ADDING_INTRODUCTION,
        next_state=SystemInternalState.REVIEWING_STRUCTURE,
        state_to_step=ProcessingStep.ADD_INTRODUCTION,
        next_step=ProcessingStep.REVIEW_STRUCTURE,
    )

@StateRegistry.register_state(SystemInternalState.REVIEWING_STRUCTURE)
def _reviewing_structure_config():
    return StateConfigData(
        state_order = 9,
        display_name="检查文档结构",
        description="检查文档结构是否合理",
        state_type=StateType.ING,
        previous_state=SystemInternalState.INTRODUCTION_ADDED,
        next_state=SystemInternalState.STRUCTURE_REVIEWED,
        state_to_step=ProcessingStep.REVIEW_STRUCTURE,
    )

@StateRegistry.register_state(SystemInternalState.STRUCTURE_REVIEWED)
def _structure_reviewed_config():
    return StateConfigData(
        state_order = 10,
        display_name="结构检查完成",
        description="结构检查完成，请进行人工的最终定稿",
        state_type=StateType.ED,
        previous_state=SystemInternalState.REVIEWING_STRUCTURE,
        next_state=None,
        state_to_step=ProcessingStep.REVIEW_STRUCTURE,
    )

@StateRegistry.register_state(SystemInternalState.FAILED)
def _failed_config():
    return StateConfigData(
        state_order = -1,
        display_name="处理失败",
        description="处理过程中出现错误",
        state_type=StateType.FAILED,
    )


# ========================= 步骤配置 =========================
# 每个步骤配置 定义了从哪里来（required_states）， 到哪里去（target_state）， 是否需要用户触发（user_triggered）
@StateRegistry.register_step(ProcessingStep.EXTRACT)
def _extract_step_config():
    return StepConfigData(
        description="提取文档内容",
        required_states=[],  # 初始状态，无前置要求
        target_state=SystemInternalState.EXTRACTING_DOCUMENT,
        user_triggered=False,  # 由start_analysis自动触发
        doc_name='raw_document'
    )

@StateRegistry.register_step(ProcessingStep.ANALYZE_H1)
def _analyze_h1_step_config():
    return StepConfigData(
        description="分析一级标题",
        required_states=[SystemInternalState.DOCUMENT_EXTRACTED],
        target_state=SystemInternalState.ANALYZING_OUTLINE_H1,
        user_triggered=False,
        doc_name='h1_document'
    )

@StateRegistry.register_step(ProcessingStep.ANALYZE_H2H3)
def _analyze_h2h3_step_config():
    return StepConfigData(
        description="分析二三级标题",
        required_states=[SystemInternalState.OUTLINE_H1_ANALYZED],
        target_state=SystemInternalState.ANALYZING_OUTLINE_H2H3,
        user_triggered=False,
        doc_name='h2h3_document'
    )

@StateRegistry.register_step(ProcessingStep.ADD_INTRODUCTION)
def _add_introduction_step_config():
    return StepConfigData(
        description="添加引言",
        required_states=[SystemInternalState.OUTLINE_H2H3_ANALYZED],
        target_state=SystemInternalState.ADDING_INTRODUCTION,
        user_triggered=False,
        doc_name='intro_document'
    )

@StateRegistry.register_step(ProcessingStep.REVIEW_STRUCTURE)
def _review_structure_step_config():
    return StepConfigData(
        description="检查文档结构",
        required_states=[SystemInternalState.INTRODUCTION_ADDED],
        target_state=SystemInternalState.REVIEWING_STRUCTURE,
        user_triggered=False,
        doc_name="final_document",
        suggestions_doc_name="review_suggestions",
    )


# # ========================= 操作配置 =========================
# # 每个用户操作定义了 需要处于什么状态， 准备执行什么步骤， 用户操作是否需要输入（payload） 
# @StateRegistry.register_action(UserAction.COMPLETE_EDITING)
# def _complete_editing_action_config():
#     return ActionConfigData(
#         description="完成编辑",
#         valid_states=[SystemInternalState.AWAITING_EDITING],
#         target_step=ProcessingStep.USER_EDITING,
#         requires_payload=True
#     )

# @StateRegistry.register_action(UserAction.RETRY)
# def _retry_action_config():
#     return ActionConfigData(
#         description="重试操作",
#         valid_states=[SystemInternalState.FAILED],
#         requires_payload=False
#     )

# @StateRegistry.register_action(UserAction.CANCEL)
# def _cancel_action_config():
#     return ActionConfigData(
#         description="取消操作",
#         valid_states=[state for state in SystemInternalState if state not in [SystemInternalState.COMPLETED, SystemInternalState.FAILED]],
#         requires_payload=False
#     )


# ========================= 异常定义 =========================

class StateTransitionError(Exception):
    """状态转换异常"""
    pass

class InvalidActionError(Exception):
    """无效操作异常"""
    pass

class ProcessingError(Exception):
    """处理异常"""
    pass 