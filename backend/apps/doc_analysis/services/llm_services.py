import os, asyncio, json
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate #ChatPromptTemplate, MessagesPlaceholder
#from langchain.memory.chat_memory import BaseChatMessageHistory
from langchain.schema import AIMessage, HumanMessage, SystemMessage, BaseMessage
from langchain.chains import LLMChain,ConversationChain
from langchain_core.callbacks import AsyncCallbackManager
from langchain.schema import StrOutputParser
from langchain.callbacks import StreamingStdOutCallbackHandler

from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

import logging
logger = logging.getLogger(__name__)


@dataclass
class AnalysisRequest:
    context: str
    requirement: str
    output_format: str


class BidAnalysisService:
    def __init__(self, model_name="qwen-plus"):
        self.llm = ChatOpenAI(
            model_name=model_name,
            temperature=0.7,
            top_p=0.8, 
            streaming=True,
            api_key=os.getenv("ALIBABA_API_KEY"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
        

    async def outline_analysis(self, request: AnalysisRequest, stream=False) -> dict:
        """场景1：单个context，单个要求的分析"""
        try:
            logger.info(f"大纲分析请求: {request.__dict__}")

            # 定义prompt模板
            prompt = PromptTemplate(
                input_variables=["context", "requirement", "output_format"],
                template="""
                请作为专业的文档结构分析助手，分析一份招标文档的目录结构和正文标题的一致性。

                ### 输入数据说明:
                {context}

                ### 分析任务:
                {requirement}
                
                ### 输出要求
                {output_format}
                """
            )
            
            outline_chain = prompt | self.llm | StrOutputParser()
            
            # 根据stream参数决定是否使用流式输出
            if stream:
                result = await outline_chain.ainvoke(
                    request.__dict__,
                    config={"callbacks": [StreamingStdOutCallbackHandler()]}
                )
            else:
                result = await outline_chain.ainvoke(request.__dict__)
            
            return result

        except Exception as e:
            logger.error(f"大纲分析过程发生错误: {str(e)}")
            raise Exception(f"大纲分析过程发生错误: {str(e)}")


    def _validate_outline_format(self, data: dict, output_format: str):
        """验证大纲分析结果的JSON格式"""
        try:
            # 将output_format字符串解析为字典
            format_schema = json.loads(output_format)
            # 递归验证字段
            def _validate_structure(current_data, schema):
                for key, expected_type in schema.items():
                    if key not in current_data:
                        raise ValueError(f"缺少必要字段: {key}")
                    if not isinstance(current_data[key], expected_type):
                        raise ValueError(f"字段 {key} 类型错误，期望 {expected_type}")
                    
                    # 如果是嵌套字典，继续验证
                    if isinstance(expected_type, dict):
                        _validate_structure(current_data[key], expected_type)
            
            _validate_structure(data, format_schema)
        except json.JSONDecodeError:
            raise ValueError("output_format不是有效的JSON格式")