from typing import Optional, Dict, Any, Union, List
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.callbacks import StreamingStdOutCallbackHandler
from langchain_core.output_parsers import StrOutputParser
from concurrent.futures import ThreadPoolExecutor
from openai import RateLimitError, APIError
from requests.exceptions import Timeout
import os, logging


logger = logging.getLogger(__name__)

class LLMConfig(BaseModel):
    """LLM配置模型"""
    llm_model_name: str = "qwen-plus"
    temperature: float = 0.7
    top_p: float = 0.8
    streaming: bool = True
    api_key: Optional[str] = None
    base_url: Optional[str] = Field(default="https://dashscope.aliyuncs.com/compatible-mode/v1")
    max_workers: int = 4
    timeout: int = Field(default=30, description="API 调用超时时间(秒)")
    retry_times: int = Field(default=3, description="API 调用重试次数")

class LLMRequest(BaseModel):
    """通用LLM请求模型"""
    context: str
    requirement: str
    output_format:str

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
        self.executor = ThreadPoolExecutor(max_workers=self.config.max_workers)

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

    async def process(self, request: LLMRequest) -> Any:
        """
        处理LLM请求
        :param request: LLM请求对象
        :return: 处理结果
        """
        try:
            if not self.prompt_template:
                raise ValueError("Prompt template is required")
            
            # 创建聊天提示模板
            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(
                    "你是一个专业的文档分析助手，需要严格按照用户要求处理和分析文档内容。"
                    "\n\n并严格按照用户要求的格式输出，格式要求：\n{output_format}"
                ),
                HumanMessagePromptTemplate.from_template(
                    self.prompt_template,
                    input_variables=["context", 
                                     "requirement", 
                                     "output_format",
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

            # 直接使用配置中的streaming设置
            chain_config = {"callbacks": [StreamingStdOutCallbackHandler()]} if self.config.streaming else {}
            result = await chain.ainvoke(request_dict, config=chain_config)

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



