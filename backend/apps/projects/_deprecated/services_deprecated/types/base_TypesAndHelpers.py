from dataclasses import dataclass
from django.db.models import Model
from typing import TypeVar, Generic, Type
import tiktoken

#定义泛型Model类型 【通用的框架代码】
DjangoModel = TypeVar('DjangoModel', bound=Model)

def count_tokens(text: str) -> int:
    """计算文本的token数量"""
    encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
    return len(encoding.encode(text))

## ---- to support example template -----
@dataclass
class EXAMPLE_INPUT:
    example_input: str

@dataclass
class EXAMPLE_OUPUT:
    example_out:str
## ------- example template --------


@dataclass
class ModelData(Generic[DjangoModel]):
    model: Type[DjangoModel]
    instance: DjangoModel