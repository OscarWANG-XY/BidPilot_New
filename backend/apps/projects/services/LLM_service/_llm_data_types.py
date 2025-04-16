from typing import List, Dict,Any, Tuple, TypeVar, Generic, Optional
from pydantic import BaseModel, Field
from dataclasses import dataclass
from collections import Counter
import json

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
    
    def to_model(self) -> Dict[str, Any]:
        """将LLMConfig转换为可存储到数据库JSONField的字典格式
        """
        return self.model_dump()
    
    @classmethod
    def from_model(cls, data: Dict[str, Any]) -> "LLMConfig":
        """从数据库JSONField中恢复LLMConfig实例
        """
        return cls(**data)

class LLMRequest(BaseModel):
    """通用LLM请求模型"""
    context: str
    instruction: str
    supplement: str
    output_format: str

    @classmethod
    def create(cls, context: str, instruction: str, supplement: str, output_format: str) -> "LLMRequest":
        """创建单个LLM请求实例
        """
        if not context or not instruction or not supplement or not output_format:
            raise ValueError("所有输入参数都不能为空")
        
        request = cls(
            context=context,
            instruction=instruction,
            supplement=supplement,  
            output_format=output_format
        )

        return request




    
