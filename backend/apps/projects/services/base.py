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