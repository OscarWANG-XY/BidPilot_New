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
