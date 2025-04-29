


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
from .state import StructuringState

# 设置日志记录器
logger = logging.getLogger(__name__)

class StructuringAgentConsumer(AsyncWebsocketConsumer):
    """
    专门服务 StructuringAgent 的 WebSocket 通道 - 简化版
    """

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
            
            # 打印URL路由信息
            # print(f"URL路由参数: {self.scope['url_route']['kwargs']}")
            # print(f"完整路径: {self.scope.get('path', '未知')}")
            
            # 加入WebSocket组
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            
            print(f"WebSocket连接成功: 用户={'已认证' if self.user.is_authenticated else '匿名'}, 项目={self.project_id}")
            
            # 发送初始状态
            await self._send_initial_state()
            print("初始状态已发送")
            print("=" * 50)
        except Exception as e:
            print(f"连接错误: {str(e)}")
            import traceback
            print(traceback.format_exc())
            # 在异常情况下尝试接受连接但发送错误信息
            try:
                await self.accept()
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'message': f'连接初始化失败: {str(e)}'
                }, ensure_ascii=False))
            except:
                pass


    async def _send_initial_state(self):
        """
        发送初始状态信息到前端
        """
        try:
            # 获取当前项目状态
            current_state = await sync_to_async(self._get_current_state)()
            
            # 发送状态信息
            await self.send(text_data=json.dumps({
                'message': '已连接到服务器',
                'state': current_state['state'],
                'data': current_state['data'],
                'requires_input': current_state['requires_input']
            }, ensure_ascii=False))
        except Exception as e:
            logger.error(f"发送初始状态失败: {str(e)}")
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': '无法获取当前状态'
            }, ensure_ascii=False))
    

    def _get_current_state(self) -> Dict[str, Any]:
        """
        获取当前项目状态（同步方法）
        """
        try:
            # 初始化Agent实例
            agent = DocumentStructureAgent(self.project_id)
            current_state = agent.current_state
            
            # 准备返回数据
            result = {
                'state': current_state.value,
                'requires_input': agent._state_requires_input(current_state.value),
                'data': {}
            }
            
        # 注意：OUTLINE_ANALYZED 是瞬态状态，会自动转换到 INJECTING_OUTLINE
        # 用户只需要在 AWAITING_EDITING 状态下看到完整的 document 数据
        
            return result
        except Exception as e:
            logger.error(f"获取状态失败: {str(e)}")
            # 返回默认状态
            return {
                'state': StructuringState.AWAITING_UPLOAD.value,
                'requires_input': True,
                'data': {}
            }


    async def disconnect(self, close_code):
        """
        断开连接时触发
        """
        # 从组中移除
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"StructuringAgent: 用户 {self.user.id} 断开连接，项目 {self.project_id}")


    async def receive(self, text_data):
        """
        接收消息时触发，处理前端发来的操作请求
        """
        try:
            # 解析消息
            data = json.loads(text_data)
            action = data.get('action')
            payload = data.get('payload', {})
            
            # 记录操作
            logger.info(f"用户 {self.user.id} 请求操作: {action}, 项目 {self.project_id}")
            
            # 处理不同类型的操作
            if action in ['upload_document', 'complete_editing', 'retry', 'rollback']:
                await self.handle_user_action(action, payload)
            elif action == 'get_status':
                await self._send_initial_state()
            else:
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'message': f'未知操作: {action}'
                }, ensure_ascii=False))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': '无效的JSON格式'
            }, ensure_ascii=False))
        except Exception as e:
            logger.error(f"处理消息异常: {str(e)}\n{traceback.format_exc()}")
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': f'服务器处理异常: {str(e)}'
            }, ensure_ascii=False))



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



    async def handle_user_action(self, action, payload):
        """
        处理用户操作并调用Agent相应方法
        """
        try:
            # 使用sync_to_async包装同步方法
            result = await sync_to_async(self._process_user_action)(action, payload)
            
            # 将结果发送回客户端
            await self.send(text_data=json.dumps(result))
            logger.info(f"操作 {action} 已处理完成，状态: {result.get('status')}")
        except Exception as e:
            logger.error(f"处理用户操作失败: {str(e)}\n{traceback.format_exc()}")
            # 发送错误响应
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': f'操作处理失败: {str(e)}'
            }, ensure_ascii=False))
    
    def _process_user_action(self, action, payload):
        """
        同步处理用户操作
        """
        # 获取Agent实例
        agent = DocumentStructureAgent(self.project_id)
        
        # 调用Agent的处理方法
        return agent.handle_user_input(action, payload)
    
    