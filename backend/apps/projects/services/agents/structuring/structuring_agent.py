import logging
from typing import Optional, Dict, Any, List, Tuple, Type
from dataclasses import dataclass
import json
import traceback
from datetime import datetime

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings

from .docx_extractor import DocxExtractor
from .outline_builder import TenderOutlineAnalyzer
from .state import (
    StructuringState, STATE_CONFIG, 
    StateError, InvalidStateTransitionError, 
    DocumentProcessingError, OutlineAnalysisError
)

# 设置日志
logger = logging.getLogger(__name__)

class StateManager:
    """状态管理器，处理状态转换和持久化"""
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self._current_state = StructuringState.AWAITING_UPLOAD
        # 可以添加状态历史记录，用于回退和审计
        self.state_history = []
        
    @property  #在这里current_state被定义成StateManager的一个属性，所以我们可以通过实例state_manager.current_state读取值时，调用装property饰方法，返回_current_state的值
    def current_state(self) -> StructuringState:
        return self._current_state   #_下划线代表私有变量
    
    @current_state.setter  # 当使用self.current_state = new_value设置值时，调用的时@current_state.setter的装饰方法。 
    def current_state(self, new_state: StructuringState):
        """设置新状态并记录历史"""
        if new_state == self._current_state:
            return
            
        # 记录状态历史
        self.state_history.append({
            'from_state': self._current_state,
            'to_state': new_state,
            'timestamp': datetime.now().isoformat()
        })
        
        # 持久化状态到数据库
        if STATE_CONFIG[new_state].persist:
            self._persist_state(new_state)
            
        self._current_state = new_state
    
    def can_transition_to(self, new_state: StructuringState) -> bool:
        """检查是否可以转换到新状态"""
        # 定义有效的状态转换
        valid_transitions = {
            StructuringState.AWAITING_UPLOAD: [StructuringState.EXTRACTING_DOCUMENT],  
            StructuringState.EXTRACTING_DOCUMENT: [StructuringState.DOCUMENT_EXTRACTED, StructuringState.FAILED], #开始
            StructuringState.DOCUMENT_EXTRACTED: [StructuringState.ANALYZING_OUTLINE, StructuringState.FAILED],   #结束
            StructuringState.ANALYZING_OUTLINE: [StructuringState.OUTLINE_ANALYZED, StructuringState.FAILED],  #开始
            StructuringState.OUTLINE_ANALYZED: [StructuringState.INJECTING_OUTLINE, StructuringState.FAILED],  #结束
            StructuringState.INJECTING_OUTLINE: [StructuringState.AWAITING_EDITING, StructuringState.FAILED],  #开始
            StructuringState.AWAITING_EDITING: [StructuringState.COMPLETED, StructuringState.FAILED],          #结束+开始
            StructuringState.COMPLETED: [], # 终止状态                                                          #结束
            StructuringState.FAILED: [StructuringState.AWAITING_UPLOAD], # 失败后可以重新开始
        }
        
        # 失败状态总是可以转换到
        if new_state == StructuringState.FAILED:
            return True
            
        return new_state in valid_transitions.get(self.current_state, [])
    
    def transition_to(self, new_state: StructuringState, force: bool = False) -> bool:
        """
        尝试将状态转换到新状态
        
        Args:
            new_state: 目标状态
            force: 是否强制转换，忽略转换规则
            
        Returns:
            转换是否成功
            
        Raises:
            InvalidStateTransitionError: 当状态转换无效时
        """
        if force or self.can_transition_to(new_state):
            self.current_state = new_state
            return True
        
        raise InvalidStateTransitionError(
            f"无法从 {self.current_state} 转换到 {new_state}"
        )
    
    def rollback(self) -> Optional[StructuringState]:
        """回退到上一个状态"""
        if not self.state_history:
            logger.info("无法回退：没有状态历史记录")
            return None
            
        previous_state = self.state_history[-1]['from_state']
        self.current_state = previous_state
        # 移除最后一条历史记录
        self.state_history.pop()
        
        # 记录回退操作
        logger.info(f"已回退到状态: {previous_state}")
        return previous_state
    
    def _persist_state(self, state: StructuringState):
        """持久化状态到数据库"""
        # 实现保存到数据库的逻辑
        # 例如: DocumentTask.objects.update_or_create(
        #    project_id=self.project_id,
        #    defaults={'state': state.value, 'updated_at': datetime.now()}
        # )
        logger.info(f"项目 {self.project_id} 状态已更新为 {state}")
        pass


class DocumentStructureAgent:
    """
    StructuringAgent：负责将上传的投标文件提取+分析大纲+注入TiptapJSON
    """

    def __init__(self, project_id: str, docx_extractor=None, outline_analyzer=None):
        """
        初始化结构化代理
        
        Args:
            project_id: 项目ID
            docx_extractor: 文档提取器，用于依赖注入和测试
            outline_analyzer: 大纲分析器，用于依赖注入和测试
        """
        self.project_id = project_id
        # 依赖注入以支持测试和扩展
        self.docx_extractor = docx_extractor or DocxExtractor()
        self.tender_outline_analyzer = outline_analyzer or TenderOutlineAnalyzer()
        
        self.document = None  # 提取后的文档对象
        self.channel_layer = get_channel_layer()
        self.group_name = f"project_{self.project_id}"
        
        # 状态管理器
        self.state_manager = StateManager(project_id)
        self.outline = None  # 存储分析出的大纲
        
        # 尝试从数据库恢复状态
        self._try_restore_state()

    def _try_restore_state(self):
        """尝试从数据库恢复状态"""
        # 实现从数据库加载状态的逻辑
        # 例如:
        # try:
        #     task = DocumentTask.objects.get(project_id=self.project_id)
        #     self.state_manager.current_state = StructuringState(task.state)
        #     # 还可以恢复文档和大纲数据
        # except DocumentTask.DoesNotExist:
        #     # 没有找到任务，使用默认状态
        #     pass
        pass


# --------- 状态管理器 ---------
    @property
    def current_state(self) -> StructuringState:
        """获取当前状态"""
        return self.state_manager.current_state

    def update_state(self, state: StructuringState, message: str = "", data: Dict[str, Any] = None):
        """
        更新任务状态并推送消息到前端
        
        Args:
            state: 新状态
            message: 状态消息，如果为空则使用默认消息
            data: 要发送的额外数据
        """
        try:
            # 尝试状态转换
            self.state_manager.transition_to(state)
            
            # 如果没有提供消息，使用状态的默认消息
            if not message:
                message = STATE_CONFIG[state].default_message
                
            # 推送消息到WebSocket
            self._push_notification(
                message=message,
                state=state.value,
                notification_type=STATE_CONFIG[state].notification_type,
                data=data or {}
            )
            
            # 记录状态变更
            logger.info(f"项目 {self.project_id} 状态更新: {state.value}, 消息: {message}")
            
            return True
        except InvalidStateTransitionError as e:
            logger.error(f"状态转换错误: {str(e)}")
            # 发送错误通知
            self._push_notification(
                message=f"状态转换错误: {str(e)}",
                state=self.current_state.value,
                notification_type="error",
                data={}
            )
            return False

    def _push_notification(self, message: str, state: str, notification_type: str, data: Dict[str, Any] = None):
        """
        推送通知到WebSocket
        
        Args:
            message: 消息内容
            state: 状态值
            notification_type: 通知类型 (info, loading, success, error)
            data: 附加数据
        """
        payload = {
            'type': "agent_message",  # 与 StructuringAgentConsumer 中的方法名对应
            'message': message,
            'state': state,
            'notification_type': notification_type,
            'data': data or {},
            'requires_input': self._state_requires_input(state),
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            async_to_sync(self.channel_layer.group_send)(
                self.group_name,
                payload
            )
        except Exception as e:
            logger.error(f"WebSocket消息发送失败: {str(e)}")
    
    def _state_requires_input(self, state: str) -> bool:
        """判断当前状态是否需要用户输入"""
        try:
            state_enum = StructuringState(state)
            return STATE_CONFIG[state_enum].requires_input
        except (ValueError, KeyError):
            return False


# --------- 处理步骤 ---------
    def process_step(self, step: str = None, user_input: dict = None):
        """
        执行指定的处理步骤，支持交互式处理流程
        
        Args:
            step: 要执行的步骤名称
            user_input: 用户输入数据
            
        Returns:
            处理结果字典
        """
        # 如果没有指定步骤，根据当前状态确定步骤
        if step is None:
            state_to_step = {
                StructuringState.AWAITING_UPLOAD: "extract",
                StructuringState.DOCUMENT_EXTRACTED: "analyze",
                StructuringState.OUTLINE_ANALYZED: "inject"
            }
            step = state_to_step.get(self.current_state)
        
        # 创建跟踪ID用于日志关联
        trace_id = f"{self.project_id}_{datetime.now().isoformat()}"
        logger.info(f"[{trace_id}] 开始处理步骤: {step}, 当前状态: {self.current_state.value}")
        
        try:
            # 提取文档
            if step == "extract":
                return self._process_extract(user_input, trace_id)
                
            # 分析大纲
            elif step == "analyze":
                return self._process_analyze(trace_id)
                
            # 注入大纲
            elif step == "inject":
                return self._process_inject(user_input, trace_id)
                
            # 完成编辑
            elif step == "complete":
                return self._process_complete(trace_id)
                
            else:
                error_msg = f"无效的处理步骤: {step}，当前状态: {self.current_state.value}"
                logger.error(f"[{trace_id}] {error_msg}")
                self.update_state(StructuringState.FAILED, error_msg)
                return {"status": "error", "message": error_msg, "trace_id": trace_id}
                
        except DocumentProcessingError as e:
            error_msg = f"文档处理失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}")
            self.update_state(StructuringState.FAILED, error_msg)
            return {
                "status": "error", 
                "message": error_msg, 
                "trace_id": trace_id,
                "error_type": "document_processing"
            }
            
        except OutlineAnalysisError as e:
            error_msg = f"大纲分析失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}")
            self.update_state(StructuringState.FAILED, error_msg)
            return {
                "status": "error", 
                "message": error_msg, 
                "trace_id": trace_id,
                "error_type": "outline_analysis"
            }
            
        except Exception as e:
            error_msg = f"处理失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}\n{traceback.format_exc()}")
            self.update_state(StructuringState.FAILED, error_msg)
            return {
                "status": "error", 
                "message": error_msg, 
                "trace_id": trace_id,
                "error_type": "unknown"
            }
    
    def _process_extract(self, user_input: dict, trace_id: str) -> dict:
        """处理文档提取步骤"""
        # 开始
        self.update_state(StructuringState.EXTRACTING_DOCUMENT, "正在提取文档内容...")   
        
        try:
            # 从项目中获取最新上传的文件
            from apps.projects.models import Project
            current_project = Project.objects.get(id=self.project_id)
            
            # 获取文件
            project_file = current_project.files.first()
            if not project_file:
                raise DocumentProcessingError("项目中没有找到上传的文件")
            
            # 获取预签名URL
            presigned_url = project_file.get_presigned_url()
            if not presigned_url:
                raise DocumentProcessingError("无法获取文件访问链接")
            
            # 创建DocxExtractor实例并提取内容
            extractor = DocxExtractor(file_url=presigned_url)
            self.document = extractor.extract_content()
            
            if not self.document:
                raise DocumentProcessingError("文档提取失败，内容为空")

            # 更新状态
            self.update_state(StructuringState.DOCUMENT_EXTRACTED, "文档提取完成，准备分析大纲...")
            
            # 自动进入下一步
            logger.info(f"[{trace_id}] 文档提取成功，文档大小: {len(json.dumps(self.document))}")
            return self.process_step("analyze")
            
        except Exception as e:
            logger.error(f"[{trace_id}] 文档提取异常: {str(e)}\n{traceback.format_exc()}")
            raise DocumentProcessingError(f"文档提取失败: {str(e)}")
    

    def _process_analyze(self, trace_id: str) -> dict:
        """处理大纲分析步骤"""
        if not self.document:
            raise OutlineAnalysisError("没有可用的文档内容")
            
        self.update_state(StructuringState.ANALYZING_OUTLINE, "正在分析文档大纲...")
        
        try:
            # 分析文档大纲
            self.outline = self.tender_outline_analyzer.analyze(self.document)
            if not self.outline:
                raise OutlineAnalysisError("大纲分析失败，结果为空")
                
            # 更新状态 - 通知前端分析完成 （注意，这里我们并没有传递outline数据给前端）
            self.update_state(
                StructuringState.OUTLINE_ANALYZED, 
                "大纲分析完成，准备注入文档..."
            )
            
            logger.info(f"[{trace_id}] 大纲分析成功，大纲项数量: {len(self.outline)}")

            # 自动进入注入步骤，不等待用户确认
            return self.process_step("inject")
            
        except Exception as e:
            logger.error(f"[{trace_id}] 大纲分析异常: {str(e)}\n{traceback.format_exc()}")
            raise OutlineAnalysisError(f"大纲分析失败: {str(e)}")
    
    def _process_inject(self, user_input: dict, trace_id: str) -> dict:
        """处理大纲注入步骤"""
        if not self.document:
            raise DocumentProcessingError("没有可用的文档内容")
            
        if not self.outline:
            raise OutlineAnalysisError("没有可用的大纲内容")
            
        # 如果用户提供了修改后的大纲，使用它
        if user_input and 'outline' in user_input:
            self.outline = user_input['outline']
            logger.info(f"[{trace_id}] 使用用户修改的大纲，大纲项数量: {len(self.outline)}")
        
        self.update_state(StructuringState.INJECTING_OUTLINE, "正在注入大纲到文档...")
        
        try:
            # 注入大纲到文档
            updated_document = self.inject_outline(self.document, self.outline)
            self.document = updated_document
            
            # 更新状态
            self.update_state(
                StructuringState.AWAITING_EDITING, 
                "初步大纲注入完毕，请在编辑器中检查和调整。",
                {"document": self.document}  # 将更新后的文档传递给前端
            )
            
            logger.info(f"[{trace_id}] 大纲注入成功")
            return {
                "status": "success", 
                "step": "inject", 
                "document": self.document,
                "requires_user_editing": True,
                "trace_id": trace_id
            }
            
        except Exception as e:
            logger.error(f"[{trace_id}] 大纲注入异常: {str(e)}\n{traceback.format_exc()}")
            raise DocumentProcessingError(f"大纲注入失败: {str(e)}")
    
    def _process_complete(self, trace_id: str) -> dict:
        """处理完成编辑步骤"""
        # 标记为完成
        self.update_state(StructuringState.COMPLETED, "文档结构化完成！")
        
        logger.info(f"[{trace_id}] 文档结构化流程完成")
        return {
            "status": "success",
            "step": "complete",
            "document": self.document,
            "trace_id": trace_id
        }


# --------- 处理用户输入 ---------
    def handle_user_input(self, action: str, data: dict = None) -> dict:
        """
        处理来自用户的输入，推进状态机
        
        Args:
            action: 用户操作
            data: 操作数据
            
        Returns:
            处理结果
        """
        # 创建跟踪ID用于日志
        trace_id = f"{self.project_id}_{action}_{datetime.now().isoformat()}"
        logger.info(f"[{trace_id}] 处理用户操作: {action}, 当前状态: {self.current_state.value}")
        
        try:
            if action == "upload_document":
                return self.process_step("extract", data)
                
            elif action == "complete_editing":
                # 用户通过Tiptap编辑器完成编辑后调用此操作
                # 如果有修改后的文档数据，将其更新到系统中
                if data and 'document' in data:
                    self.document = data['document']
                    logger.info(f"[{trace_id}] 已更新用户编辑后的文档")
                    
                return self.process_step("complete", data)
                
            elif action == "retry":
                return self._handle_retry(data, trace_id)
                
            elif action == "rollback":
                return self._handle_rollback(data, trace_id)
                
            else:
                error_msg = f"未知的用户操作: {action}"
                logger.warning(f"[{trace_id}] {error_msg}")
                return {"status": "error", "message": error_msg, "trace_id": trace_id}
                
        except Exception as e:
            error_msg = f"处理用户操作失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}\n{traceback.format_exc()}")
            return {"status": "error", "message": error_msg, "trace_id": trace_id}
    
    def _handle_retry(self, data: dict, trace_id: str) -> dict:
        """处理重试操作"""
        if self.current_state == StructuringState.FAILED:
            # 获取出错前的状态
            error_source = data.get('error_source') if data else None
            
            if error_source == "document_processing":
                # 文档处理错误，回到上传状态
                self.update_state(StructuringState.AWAITING_UPLOAD, "请重新上传文档")
            elif error_source == "outline_analysis":
                # 大纲分析错误，回到文档提取完成状态
                self.update_state(StructuringState.DOCUMENT_EXTRACTED, "文档已提取，请重新分析大纲")
            else:
                # 其他错误，使用状态回退
                previous_state = self.state_manager.rollback()
                if previous_state:
                    self.update_state(previous_state, f"已回退到 {previous_state.name} 状态")
                else:
                    # 无法回退，回到初始状态
                    self.update_state(StructuringState.AWAITING_UPLOAD, "请重新上传文档")
            
            logger.info(f"[{trace_id}] 重试成功，当前状态: {self.current_state.value}")
            return {"status": "success", "message": "已重置，请继续操作", "trace_id": trace_id}
        
        return {"status": "error", "message": "当前状态不支持重试", "trace_id": trace_id}
    

    def _handle_rollback(self, data: dict, trace_id: str) -> dict:
        """处理回退操作"""
        previous_state = self.state_manager.rollback()
        
        if previous_state:
            self.update_state(previous_state, f"已回退到 {previous_state.name} 状态")
            logger.info(f"[{trace_id}] 回退成功，当前状态: {self.current_state.value}")
            return {"status": "success", "message": "已回退到上一状态", "trace_id": trace_id}
        
        return {"status": "error", "message": "无法回退，没有更多历史状态", "trace_id": trace_id}
    
    
    def inject_outline(self, document_json: dict, outline: list) -> dict:
        """
        将分析出的大纲注入到Tiptap JSON中
        
        Args:
            document_json: 原始提取的Tiptap JSON
            outline: 分析出的章节列表
            
        Returns:
            更新后的文档JSON
        """
        # 创建文档的深拷贝，避免修改原始对象
        import copy
        updated_document = copy.deepcopy(document_json)
        
        try:
            # 注入逻辑
            for item in outline:
                node = {
                    "type": "heading",
                    "attrs": {"level": item["level"]},
                    "content": [{"type": "text", "text": item["title"]}]
                }
                
                position = item.get("position", 0)
                # 确保位置有效
                if position < 0:
                    position = 0
                if position > len(updated_document['content']):
                    position = len(updated_document['content'])
                    
                updated_document['content'].insert(position, node)
            
            return updated_document
        except Exception as e:
            raise DocumentProcessingError(f"大纲注入失败: {str(e)}")