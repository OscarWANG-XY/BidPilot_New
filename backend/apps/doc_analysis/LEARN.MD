在文档分析模块我们使用了pipeline的整个框架来管理复杂的业务流程，以及每个环节之间的数据流转.

以下采用的是一个通用的pipeline的框架。
src/
├── pipeline/
│   ├── __init__.py
│   ├── base.py          # 基础抽象类和接口，框架代码固定，使用时不用改
│   ├── types.py         # 数据类型定义，添加了ModelData的使用，以及to_model, from_model的方法定义
│   └── pipeline.py      # Pipeline主类， 框架代码固定，使用时不用改
├── steps/
│   ├── __init__.py
│   ├── docx_extractor.py   # 运用了PipelineStep的框架。
│   ├── outline_analyzer.py
│   └── ...
└── services/
    ├── __init__.py
    └── llm_service.py  # 调用LLM模型分析
    ...


# ============= pipeline.py的框架代码如下： ===============
# 定义一个通用的Pipeline类，用于处理数据流，代码固定后保持不变。

from typing import List, TypeVar, Generic, Any
from .base import PipelineStep

T = TypeVar('T')
U = TypeVar('U')

class Pipeline(Generic[T, U]):
    def __init__(self, initial_step: PipelineStep[T, Any]):
        self.initial_step = initial_step
        self.steps: List[PipelineStep] = []

    def add_step(self, step: PipelineStep) -> 'Pipeline':
        self.steps.append(step)
        return self

    def execute(self, data: T) -> U:
        current_data = self.initial_step.process(data)
        for step in self.steps:
            current_data = step.process(current_data)
        return current_data


#  ============ Base.py的框架代码如下：===================
# 定义一个通用的PipelineStep类，用于规范具体的Step，代码固定后保持不变。

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

InputType = TypeVar('InputType')
OutputType = TypeVar('OutputType')

class PipelineStep(Generic[InputType, OutputType], ABC):
    @abstractmethod
    def process(self, data: InputType) -> OutputType:
        pass

    @abstractmethod
    def validate_input(self, data: InputType) -> bool:
        pass

    @abstractmethod
    def validate_output(self, data: OutputType) -> bool:
        pass




# ============== types.py的框架代码 =======================
from dataclasses import dataclass
from django.db.models import Model
from typing import TypeVar, Generic, Type, Optional, Dict, List

#定义泛型Model类型 【通用的框架代码】
DjangoModel = TypeVar('DjangoModel', bound=Model)

@dataclass
class ModelData(Generic[DjangoModel]):
    model: Type[DjangoModel]
    instance: DjangoModel

# 以下作为自定义类的案例。
@dataclass
class DocxElements:
    """包含所有文档元素的集合类"""
    elements: List[Dict]  # 每个元素存储为字典

    def __len__(self):
        return len(self.elements)

    def __getitem__(self, index):
        return self.elements[index]

    def __iter__(self):
        return iter(self.elements)

    def add_element(self, 
                    element_type: str, 
                    position: int, 
                    content: str, 
                    is_toc: bool = False, 
                    toc_level: Optional[str] = None,
                    is_heading: bool = False,
                    heading_level: Optional[str] = None):
        """添加一个新元素"""
        element = {
            'type': element_type,
            'position': position,
            'content': content,
            'is_toc': is_toc,
            'toc_level': toc_level,
            'is_heading': is_heading,
            'heading_level': heading_level
        }
        self.elements.append(element)

    def to_model(self) -> List[Dict]:
        """将DocxElements转换为可序列化的字典列表"""
        return self.elements

    @classmethod
    def from_model(cls, data: List[Dict]) -> 'DocxElements':
        """从字典列表创建DocxElements实例"""
        return cls(data)

    def filter_by_type(self, element_type: str) -> 'DocxElements':
        """按元素类型过滤"""
        return DocxElements([element for element in self.elements if element['type'] == element_type])

    def get_headings(self) -> 'DocxElements':
        """获取所有标题元素"""
        return DocxElements([element for element in self.elements if element.get('is_heading', False)])

    def get_toc(self) -> 'DocxElements':
        """获取所有目录元素"""
        return DocxElements([element for element in self.elements if element.get('is_toc', False)])