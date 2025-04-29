from typing import Optional, Any, Dict, Callable, List
from ._llm_data_types import LLMRequest, LLMConfig
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.callbacks import StreamingStdOutCallbackHandler
from langchain_core.output_parsers import StrOutputParser
from langchain.callbacks.base import BaseCallbackHandler
from openai import RateLimitError, APIError
from requests.exceptions import Timeout
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import os, logging, tiktoken


logger = logging.getLogger(__name__)


class RedisStreamingCallbackHandler(BaseCallbackHandler):
    """
    将LLM流式输出存储到Redis的回调处理器
    以下定义了on_llm_start, on_llm_new_token, on_llm_end, on_llm_error 四个回调函数
    BaseCallbackHandler 是langchain的回调处理器基类, 它会在合适时机调用上面的回调函数
    
    """
    
    def __init__(self, redis_manager, stream_id):
        """
        初始化回调处理器
        
        Args:
            redis_manager: Redis管理器实例
            stream_id: 流ID
        """
        self.redis_manager = redis_manager
        self.stream_id = stream_id
        self.current_token_buffer = ""
        self.token_count = 0
        self.chunk_size = 10  # 每收集10个token发送一次
    
    def on_llm_start(self, serialized, prompts, **kwargs):
        """LLM开始生成时的回调"""
        logger.info(f"开始LLM流式生成: stream_id={self.stream_id}")
        self.redis_manager.update_stream_status(self.stream_id, "PROCESSING")
    
    def on_llm_new_token(self, token: str, **kwargs):
        """接收到新token时的回调"""
        self.current_token_buffer += token
        self.token_count += 1
        
        # 当积累了足够的token或遇到换行符时发送
        if self.token_count >= self.chunk_size or "\n" in token:
            self.redis_manager.add_stream_chunk(self.stream_id, self.current_token_buffer)
            self.current_token_buffer = ""
            self.token_count = 0
    
    def on_llm_end(self, response, **kwargs):
        """LLM生成结束时的回调"""
        # 发送剩余的buffer
        if self.current_token_buffer:
            self.redis_manager.add_stream_chunk(self.stream_id, self.current_token_buffer)
        
        # 标记流完成
        self.redis_manager.mark_stream_complete(self.stream_id)
        logger.info(f"完成LLM流式生成: stream_id={self.stream_id}")
    
    def on_llm_error(self, error, **kwargs):
        """LLM生成出错时的回调"""
        error_msg = str(error)
        logger.error(f"LLM流式生成错误: {error_msg}, stream_id={self.stream_id}")
        self.redis_manager.mark_stream_failed(self.stream_id, error_msg)


class WebSocketStreamingCallbackHandler(BaseCallbackHandler):
    """
    将LLM流式输出直接发送到WebSocket的回调处理器
    """
    
    def __init__(self, channel_layer, room_group_name):
        """
        初始化回调处理器
        
        Args:
            channel_layer: Channels层实例
            room_group_name: WebSocket房间组名
        """
        self.channel_layer = channel_layer
        self.room_group_name = room_group_name
        self.current_token_buffer = ""
        self.token_count = 0
        self.chunk_size = 10  # 每收集10个token发送一次
    
    def on_llm_start(self, serialized, prompts, **kwargs):
        """LLM开始生成时的回调"""
        logger.info(f"开始LLM WebSocket流式生成: room={self.room_group_name}")
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'llm_response',
                'message': '',
                'status': 'PROCESSING',
                'is_final': False
            }
        )
    
    def on_llm_new_token(self, token: str, **kwargs):
        """接收到新token时的回调"""
        self.current_token_buffer += token
        self.token_count += 1
        
        # 当积累了足够的token或遇到换行符时发送
        if self.token_count >= self.chunk_size or "\n" in token:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'llm_response',
                    'message': self.current_token_buffer,
                    'is_final': False
                }
            )
            self.current_token_buffer = ""
            self.token_count = 0
    
    def on_llm_end(self, response, **kwargs):
        """LLM生成结束时的回调"""
        # 发送剩余的buffer
        if self.current_token_buffer:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'llm_response',
                    'message': self.current_token_buffer,
                    'is_final': False
                }
            )
        
        # 标记流完成
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'llm_response',
                'message': '',
                'status': 'COMPLETED',
                'is_final': True
            }
        )
        logger.info(f"完成LLM WebSocket流式生成: room={self.room_group_name}")
    
    def on_llm_error(self, error, **kwargs):
        """LLM生成出错时的回调"""
        error_msg = str(error)
        logger.error(f"LLM WebSocket流式生成错误: {error_msg}, room={self.room_group_name}")
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'llm_response',
                'message': f"错误: {error_msg}",
                'status': 'ERROR',
                'is_final': True
            }
        )


class GenericLLMService:
    """通用LLM服务实现"""
    def __init__(
        self,
        config: Optional[LLMConfig] = None,
        prompt_template: Optional[str] = None,
        output_parser: Optional[StrOutputParser] = None
    ):
        self.config = config or LLMConfig()
        self.prompt_template = prompt_template
        self.output_parser = output_parser or StrOutputParser()
        self._init_llm()
        #self.executor = ThreadPoolExecutor(max_workers=self.config.max_workers)

    def _init_llm(self):
        """初始化LLM模型"""
        self.llm = ChatOpenAI(
            model_name=self.config.llm_model_name,
            temperature=self.config.temperature,
            top_p=self.config.top_p,
            streaming=self.config.streaming,
            api_key=self.config.api_key or os.getenv("ALIBABA_API_KEY"),
            base_url=self.config.base_url,
            timeout=self.config.timeout,
        )

    async def process(self, request: LLMRequest, streaming_callback=None, websocket_callback=None) -> Any:
        """
        处理LLM请求
        :param request: LLM请求对象
        :param streaming_callback: Redis流式处理回调
        :param websocket_callback: WebSocket流式处理回调
        :return: 处理结果
        """
        try:
            if not self.prompt_template:
                raise ValueError("Prompt template is required")
            
            # 创建聊天提示模板
            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(
                    "你是一个专业的招标文档分析助手，帮助用户分析文档的结构和内容。"
                ),
                HumanMessagePromptTemplate.from_template(
                    self.prompt_template,
                    # input_variables 的参数名 由 prompt_template决定。
                    input_variables=["context",  
                                     "instruction",
                                     "supplement",
                                     "output_format"
                                     ]
                )
            ])

            # 构建处理链
            chain = prompt | self.llm | self.output_parser

            # 处理请求, 构建prompt模板的输入
            request_dict = request.dict()   #将LLMRequest对象转换为字典

            # 查看最终的 prompt
            formatted_prompt = await prompt.ainvoke(request_dict)
            logger.info(f"Final prompt:\n{formatted_prompt}")

            input_tokens = self._count_tokens(str(formatted_prompt))
            logger.info(f"Input tokens: {input_tokens}")

            # 配置回调
            callbacks = []
            if streaming_callback:
                callbacks.append(streaming_callback)
            if websocket_callback:
                callbacks.append(websocket_callback)
            elif self.config.streaming and not (streaming_callback or websocket_callback):
                callbacks.append(StreamingStdOutCallbackHandler())
            
            # 执行链 （callbacks 在这里通过chain_config传递给chain，被调用）
            chain_config = {"callbacks": callbacks} if callbacks else {}
            result = await chain.ainvoke(request_dict, config=chain_config)

            output_tokens = self._count_tokens(str(result))
            logger.info(f"Output tokens: {output_tokens}")

            return result

        except RateLimitError as e:
            logger.error(f"API 调用超过限制: {str(e)}")
            # 可以实现重试逻辑
            raise
        except Timeout as e:
            logger.error(f"API 调用超时: {str(e)}")
            # 可以实现重试逻辑
            raise
        except APIError as e:
            logger.error(f"API 调用错误: {str(e)}")
            raise
        except ValueError as e:
            logger.error(f"输入参数错误: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"未预期的错误: {str(e)}")
            raise


    def _count_tokens(self, text: str) -> int:
        """计算文本的token数量"""
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        return len(encoding.encode(text))

