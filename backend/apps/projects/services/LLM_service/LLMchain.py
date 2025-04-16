from typing import Optional, Any
from ._llm_data_types import LLMRequest, LLMConfig
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.callbacks import StreamingStdOutCallbackHandler
from langchain_core.output_parsers import StrOutputParser
from concurrent.futures import ThreadPoolExecutor
from openai import RateLimitError, APIError
from requests.exceptions import Timeout
import os, logging, tiktoken


logger = logging.getLogger(__name__)


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
                    "你是一个专业的招标文档分析助手，帮助用户分析文档的结构和内容。"
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

            # 查看最终的 prompt
            formatted_prompt = await prompt.ainvoke(request_dict)
            logger.info(f"Final prompt:\n{formatted_prompt}")

            input_tokens = self._count_tokens(str(formatted_prompt))
            logger.info(f"Input tokens: {input_tokens}")

            # 直接使用配置中的streaming设置
            chain_config = {"callbacks": [StreamingStdOutCallbackHandler()]} if self.config.streaming else {}
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

