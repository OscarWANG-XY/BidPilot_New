# 说明： 
# 下面使用的channel_layer 是django channels 自动注入到每个consumer中的一个属性，代表后端通信系统，比如Redis, 
# 允许你给一个group发送消息， 或者发给某个单独的channel
# 每当新的WebSocket连接进来，就会自动为这个连接生成唯一的channel_name, channel_name是一个随机字符串，有唯一性。 

# 实际工作流程
# 1. 多个用户打开同一个项目页面，建立多个 WebSocket 连接
# 2. 每个连接创建一个 Consumer 实例，分配唯一的 Channel
# 3. 所有关注同一项目的 Consumer 加入同名的 Group（如 project_123）
# 4. Agent 处理业务逻辑后，向该 Group 发送消息
# 5. Channel Layer 将消息路由到 Group 中的所有 Channel
# 6. 每个 Consumer 接收消息并转发给对应的前端连接
# 这种设计使得同一项目的所有用户都能实时接收项目状态更新，实现了高效的实时协作功能。

# channel_layer, channels, 和 group 三者关系图
    # Channel Layer (Redis/InMemory)
    # │
    # ├── Channel_1 (唯一连接) ──┐
    # │                         │
    # ├── Channel_2 (唯一连接) ──┼── Group_A (如 "project_123")
    # │                         │
    # ├── Channel_3 (唯一连接) ──┘
    # │
    # ├── Channel_4 (唯一连接) ──┐
    # │                         │
    # ├── Channel_5 (唯一连接) ──┼── Group_B (如 "project_456")
    # │                         │
    # └── Channel_6 (唯一连接) ──┘



import json
import logging
import traceback
from typing import Dict, Any

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from .structuring_agent import DocumentStructureAgent
from .state import (
    AgentState, STATE_CONFIG,
    InitialStateMessage, ErrorMessage,
    UserActionRequest,
    UserAction,
    ProcessStep,
    StateError
)

# 设置日志记录器
logger = logging.getLogger(__name__)

class StructuringAgentConsumer(AsyncWebsocketConsumer):
    """
    专门服务 StructuringAgent 的 WebSocket 通道 - 简化版
    """

    # 连接尝试
    async def connect(self):
        try:
            print("=" * 50)
            print("StructuringAgentConsumer - 连接尝试")
            
            # 获取项目ID和用户信息
            self.project_id = self.scope['url_route']['kwargs']['project_id']
            print(f"项目ID: {self.project_id}")
            
            self.group_name = f"project_{self.project_id}"
            self.user = self.scope["user"]
            print(f"用户认证状态: {self.user.is_authenticated}")
            if self.user.is_authenticated:
                print(f"已认证用户ID: {self.user.id}")
            
            # 加入WebSocket组
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            
            print(f"WebSocket连接成功: 用户={'已认证' if self.user.is_authenticated else '匿名'}, 项目={self.project_id}")
            
            # 发送初始状态
            await self._send_initial_state()
            print("初始状态已发送")
            print("=" * 50)
        except StateError as e:
            # 状态相关错误，接受连接但发送错误信息
            await self.accept()
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': str(e)
            }, ensure_ascii=False))
        except Exception as e:
            print(f"连接错误: {str(e)}")
            logger.error(f"连接错误: {str(e)}\n{traceback.format_exc()}")
            # 在异常情况下尝试接受连接但发送错误信息
            try:
                await self.accept()
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'message': f'连接初始化失败: {str(e)}'
                }, ensure_ascii=False))
            except:
                # 如果连接已经关闭或发送失败，忽略错误
                pass


    async def _send_initial_state(self):
        """
        发送初始状态信息到前端
        """
        try:
            # 获取当前项目状态
            current_state = await sync_to_async(self._get_current_state)()
            
            # 创建标准格式的初始状态消息
            initial_message = InitialStateMessage(
                message='已连接到服务器',
                state=current_state['state'],
                data=current_state['data'],
                requires_input=current_state['requires_input']
            )
            
            # 发送状态信息
            await self.send(text_data=json.dumps(initial_message.__dict__, ensure_ascii=False))
        except Exception as e:
            logger.error(f"发送初始状态失败: {str(e)}")
            error_message = ErrorMessage(
                status='error',
                message='无法获取当前状态'
            )
            await self.send(text_data=json.dumps(error_message.__dict__, ensure_ascii=False))
    

    def _get_current_state(self) -> Dict[str, Any]:
        """
        获取当前项目状态（同步方法）
        
        Returns:
            Dict containing current state information
            
        Raises:
            StateError: 当状态获取失败时
        """
        try:
            # 初始化Agent实例
            agent = DocumentStructureAgent(self.project_id, lazy_init=True)
            current_state = agent.current_state
            
            # 准备返回数据 - 从 STATE_CONFIG 获取 requires_input
            result = {
                'state': current_state.value,
                'requires_input': STATE_CONFIG[current_state].requires_input,
                'data': {}
            }
            
            # 如果是等待编辑状态，需要返回文档数据
            if current_state == AgentState.AWAITING_EDITING and agent.Intro_document:
                result['data'] = {"document": agent.Intro_document}
            
            return result
            
        except Exception as e:
            logger.error(f"获取状态失败: {str(e)}")
            # 让错误向上传播，由调用者决定如何处理
            raise StateError(f"无法获取当前状态: {str(e)}")


    # 断开连接时触发
    async def disconnect(self, close_code):
        """
        断开连接时触发
        """
        # 从组中移除
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"StructuringAgent: 用户 {self.user.id} 断开连接，项目 {self.project_id}")


    # 发送消失（来自 StructuringAgent 的消息）
    async def agent_message(self, event):
        """
        处理来自 StructuringAgent 的消息
        """
        # 直接将消息转发给WebSocket客户端
        await self.send(text_data=json.dumps({
            'message': event.get('message', ''),
            'state': event.get('state', ''),
            'data': event.get('data', {}),
            'requires_input': event.get('requires_input', False)
        }, ensure_ascii=False))


    #  --------  接收消息时触发，处理前端发来的操作请求
    # 说明： 前端输入的数据格式要求：
    # receive -> handle_user_action -> _process_user_action -> agent.handle_user_input -> agent.process_step (用户操作)
    #                               -> _process_next_step -> _process_system_step -> agent.process_step (系统操作作为用户操作的补充链路)
    # 无论是_process_user_action 还是 _process_system_step 都有 agent的初始化，
    # 在agent里需要有状态持久化 确保每次初始化后状态到之前的状态， 这个是 用户驱动的agent的基础。 
    async def receive(self, text_data):
        """
        接收消息时触发，处理前端发来的操作请求
        """
        try:
            # 解析消息 格式要求：
        # {
        #     "action": "action_value",
        #     "payload": { // Optional payload data depending on the action}
        # }
            data = json.loads(text_data)
            
            # 创建标准格式的用户请求
            user_request = UserActionRequest(
                action=data.get('action'),
                payload=data.get('payload', {})
            )
            
            # 记录操作
            logger.info(f"receive 收到用户请求操作: {user_request.action}, 项目 {self.project_id}")
            
            # 处理 需要agent执行的 操作
            if user_request.action in [UserAction.DOCUMENT_UPLOADED.value, 
                                      UserAction.COMPLETE_EDITING.value, 
                                      UserAction.RETRY.value, 
                                      UserAction.ROLLBACK.value]:
                await self.handle_user_action(user_request.action, user_request.payload)

            # 处理 关于agent的 状态请求 
            elif user_request.action == UserAction.GET_STATUS.value:
                await self._send_initial_state()

            # 处理 未知操作，以错误消息返回 
            else:
                error_message = ErrorMessage(
                    status='error',
                    message=f'未知操作: {user_request.action}'
                )
                await self.send(text_data=json.dumps(error_message.__dict__, ensure_ascii=False))

        # 处理 消息格式 异常， 将异常信息返回给前端 
        except json.JSONDecodeError:
            error_message = ErrorMessage(
                status='error',
                message='无效的JSON格式'
            )
            await self.send(text_data=json.dumps(error_message.__dict__, ensure_ascii=False))

        except StateError as e:
            # 状态相关错误
            error_message = ErrorMessage(
                status='error',
                message=str(e)
            )
            await self.send(text_data=json.dumps(error_message.__dict__, ensure_ascii=False))

        except Exception as e:
            logger.error(f"处理消息异常: {str(e)}\n{traceback.format_exc()}")
            error_message = ErrorMessage(
                status='error',
                message=f'服务器处理异常: {str(e)}'
            )
            await self.send(text_data=json.dumps(error_message.__dict__, ensure_ascii=False))



    async def llm_stream(self, event):
        """处理大模型的流式输出"""
        await self.send(text_data=json.dumps({
            'type': 'llm_stream',
            'token': event.get('token', ''),
            'content': event.get('content', ''),
            'task_id': event.get('task_id', None),
            'state': self.current_state.value if hasattr(self, 'current_state') else None,
            'finished': event.get('finished', False)
        }, ensure_ascii=False))



    # 处理 需要Agent执行的 用户操作请求
    async def handle_user_action(self, action, payload):
        """处理用户操作"""
        try:
            # 1. 处理用户操作
            result = await self._process_user_action(action, payload)
            
            # 2. 发送结果给前端
            await self.send(text_data=json.dumps(result, ensure_ascii=False))
            
            # 3. 如果有下一步，自动处理
            if result.get('status') == 'success' and result.get('next_step'):
                # 自动处理下一步
                next_step = result.get('next_step')
                await self._process_next_step(next_step)
                
        except Exception as e:
            logger.error(f"处理用户操作失败: {str(e)}\n{traceback.format_exc()}")
            error_message = ErrorMessage(
                status='error',
                message=f'处理操作失败: {str(e)}'
            )
            await self.send(text_data=json.dumps(error_message.__dict__, ensure_ascii=False))

    
    async def _process_user_action(self, action, payload):
        """
        异步处理用户操作
        """
        logger.info(f"_process_user_action: 完成DocumentStructureAgent的实例化， 项目为{self.project_id}")

        # 获取Agent实例
        agent = await DocumentStructureAgent.create(self.project_id)
        
        # 调用Agent的处理方法
        return await agent.handle_user_input(action, payload)
    
    # 处理下一个系统步骤 - 这是内部方法，不是用户操作，作为用户操作的辅助 
    async def _process_next_step(self, step_name):
        """处理下一个系统步骤 - 这是内部方法，不是用户操作"""
        try:
            logger.info(f"process_next_step: 开始处理步骤 {step_name}")
            
            # 直接调用异步方法
            result = await self._process_system_step(step_name)
            
            # 2. 发送结果给前端 （这是点对点模式，只响应发起请求的特定客户端）
            if isinstance(result, dict):
                await self.send(text_data=json.dumps(result, ensure_ascii=False))
                
                # 3. 如果有下一步，继续处理
                if result.get('status') == 'success' and result.get('next_step'):
                    await self._process_next_step(result.get('next_step'))
            else:
                await self.send(text_data=json.dumps({
                    'status': 'success',
                    'message': '步骤已处理',
                    'data': result
                }, ensure_ascii=False))
                
            logger.info(f"process_next_step 步骤 {step_name} 已处理完成")
        except Exception as e:
            logger.error(f"处理系统步骤失败: {str(e)}\n{traceback.format_exc()}")
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': f'步骤处理失败: {str(e)}'
            }, ensure_ascii=False))


    async def _process_system_step(self, step_name):
        """异步处理系统步骤"""
        logger.info(f"_process_system_step: 处理步骤 {step_name}, 项目 {self.project_id}")
        
        # 获取Agent实例
        if not hasattr(self, '_agent'): # 检查是否已经创建了Agent实例 
            self._agent = await DocumentStructureAgent.create(self.project_id)  # 如果还没有创建，则创建一个
        
        try:
            # 尝试将步骤名称转换为枚举
            step = ProcessStep(step_name)
            # 调用Agent的处理步骤方法
            return await self._agent.process_step(step) # 如果已经创建，直接使用。 
        except ValueError:
            return {
                "status": "error",
                "message": f"无效的处理步骤: {step_name}"
            }