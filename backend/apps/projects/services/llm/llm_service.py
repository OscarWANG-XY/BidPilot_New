from typing import Optional, Any
from .llm_models import LLMRequestModel, LLMConfigModel
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.callbacks import StreamingStdOutCallbackHandler
from langchain_core.output_parsers import StrOutputParser
from concurrent.futures import ThreadPoolExecutor
from openai import RateLimitError, APIError
from requests.exceptions import Timeout
from ..task_service import count_tokens
import os, logging
import time
import random


logger = logging.getLogger(__name__)


class LLMService:
    """通用LLM服务实现"""
    def __init__(
        self,
        config: LLMConfigModel,
        prompt_template: str,
        system_role: str,
    ):
        self.config = config
        self.prompt_template = prompt_template
        self.system_role = system_role
        self.output_parser = StrOutputParser()
        self._init_llm()

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

    async def process(self, request: LLMRequestModel) -> Any:
        """
        处理LLM请求
        :param request: LLM请求对象
        :return: 处理结果
        """
        max_retries = 3  # 最大重试次数
        retry_count = 0
        
        while True:
            try:
                if not self.prompt_template:
                    raise ValueError("Prompt template is required")
                
                # 创建聊天提示模板
                prompt = ChatPromptTemplate.from_messages([
                    SystemMessagePromptTemplate.from_template(
                        self.system_role
                    ),
                    HumanMessagePromptTemplate.from_template(
                        self.prompt_template,
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

                # # 查看最终的 prompt
                # formatted_prompt = await prompt.ainvoke(request_dict)
                # logger.info(f"Final prompt:\n{formatted_prompt}")

                # input_tokens = count_tokens(str(formatted_prompt))
                # logger.info(f"Input tokens: {input_tokens}")

                # 直接使用配置中的streaming设置
                chain_config = {"callbacks": [StreamingStdOutCallbackHandler()]} if self.config.streaming else {}
                result = await chain.ainvoke(request_dict, config=chain_config)

                # output_tokens = count_tokens(str(result))
                # logger.info(f"Output tokens: {output_tokens}")

                return result

            except RateLimitError as e:
                retry_count += 1
                if retry_count > max_retries:
                    logger.error(f"API 调用超过限制，已重试{max_retries}次后失败: {str(e)}")
                    raise
                
                # 计算指数退避等待时间（带抖动）
                wait_time = (2 ** retry_count) + random.uniform(0, 1)
                logger.warning(f"API 调用超过限制，正在进行第{retry_count}次重试，等待{wait_time:.2f}秒: {str(e)}")
                time.sleep(wait_time)
                continue
            
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

