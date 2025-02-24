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

class LLMRequest(BaseModel):
    """通用LLM请求模型"""
    data_input: str
    output_format: str
    # 新增字段 作为元数据，不会发送给大模型
    task_id: Optional[int] = Field(default=None, description="请求所属的组ID")  

    @classmethod
    def create(cls, data_input: str, output_format: str) -> "LLMRequest":
        """创建单个LLM请求实例
        
        Args:
            data_input (str): 待分析的文档内容
            output_format (str): 期望的输出格式
            
        Returns:
            LLMRequest: LLM请求实例
            
        Raises:
            ValueError: 当输入参数为空时
        """
        if not data_input or not output_format:
            raise ValueError("所有输入参数都不能为空")
        
        request = cls(
            data_input=data_input,
            output_format=output_format
        )

        return request

    @classmethod
    def create_batch(cls, data_inputs: List[str], output_formats: List[str]) -> List["LLMRequest"]:
        """创建批量LLM请求实例
        
        Args:
            data_inputs (List[str]): 待分析的文档内容列表
            output_formats (List[str]): 期望的输出格式列表
            
        Returns:
            List[LLMRequest]: LLM请求实例列表
            
        Raises:
            ValueError: 当输入参数列表长度不一致或为空时
        """
        if not data_inputs or not output_formats:
            raise ValueError("所有输入参数列表都不能为空")
        
        if not (len(data_inputs) == len(output_formats)):
            raise ValueError("所有输入参数列表长度必须相同")
        
        requests = [cls(
                data_input=data_input,
                output_format=output_format
            )
            for data_input, output_format in zip(data_inputs, output_formats)
        ]
        
        return requests

    @classmethod
    def create_batch_with_repeats(cls, data_inputs: List[str], output_formats: List[str], 
                                repeats: int = 3) -> List["LLMRequest"]:
        """创建批量LLM请求实例，每组输入重复三次并添加task_id
        
        Args:
            data_inputs (List[str]): 待分析的文档内容列表
            output_formats (List[str]): 期望的输出格式列表
            
        Returns:
            List[LLMRequest]: LLM请求实例列表，每组输入重复三次，包含task_id
            
        Raises:
            ValueError: 当输入参数列表长度不一致或为空时
        """
        if not data_inputs or not output_formats:
            raise ValueError("所有输入参数列表都不能为空")
        
        if not (len(data_inputs) == len(output_formats)):
            raise ValueError("所有输入参数列表长度必须相同")
            
        requests = []
        for task_id, (data_input, output_format) in enumerate(zip(data_inputs, output_formats)):
            for _ in range(repeats):  # 每组重复三次
                request = cls(
                    data_input=data_input,                    
                    output_format=output_format,
                    task_id=task_id  # 添加task_id
                )
                requests.append(request)
                
        return requests
    

    

T = TypeVar('T')

@dataclass
class BatchResult(Generic[T]):
    """批处理结果包装器"""
    result: T  # result 是 T 类型，意味着可以灵活处理各种类型的结果数据
    success: bool
    error: Optional[Exception] = None
    request_index: int = -1
    approach: str = ""
    task_id: Optional[int] = None
    probability: Optional[float] = None
    repeat_count: Optional[int] = None

    # 针对 任务并行合并，用在性能提升的场景，提升生成的速度
    @classmethod
    def merge(cls, results: List['BatchResult[T]']) -> 'BatchResult[T]':
        """
        合并多个BatchResult实例
        - 如果所有结果都成功，合并它们的result
        - 如果有任何失败，将标记为失败并收集错误信息
        """
        if not results:
            return cls(result=None, success=True)
        
        # 检查是否所有结果都是相同类型
        if not all(isinstance(r, BatchResult) for r in results):
            raise TypeError("All items must be BatchResult instances")

        # 收集所有成功的结果
        successful_results = [r.result for r in results if r.success]
        
        # 收集所有错误
        errors = [r.error for r in results if not r.success and r.error is not None]
        
        # 确定合并后的成功状态
        merged_success = len(errors) == 0
        
        # 创建合并后的错误信息（如果有）
        merged_error = None
        if errors:
            error_msgs = [f"Error in batch {r.request_index}: {str(r.error)}" 
                         for r in results if not r.success and r.error is not None]
            merged_error = Exception(" | ".join(error_msgs))

        # 合并结果
        # 如果结果是列表类型，则扩展合并
        if successful_results and isinstance(successful_results[0], list):
            merged_result = [item for sublist in successful_results for item in sublist]
        # 如果结果是字典类型，则更新合并
        elif successful_results and isinstance(successful_results[0], dict):
            merged_result = {}
            for result in successful_results:
                merged_result.update(result)
        # 其他类型，保留为列表
        else:
            merged_result = successful_results

        return cls(
            result=merged_result,
            success=merged_success,
            error=merged_error,
            approach=results[0].approach if results else "",
            request_index=-1  # 合并结果不对应特定索引
        )

    def __add__(self, other: 'BatchResult[T]') -> 'BatchResult[T]':
        """
        使用加号运算符合并两个BatchResult
        示例: combined_result = result1 + result2
        """
        return self.merge([self, other])
    
    # 针对 多路投票的场景，以提高结果的准确度 
    def _normalize_result(self, result: Any) -> str:
        """将结果标准化为可比较的字符串形式"""
        if isinstance(result, (dict, list)):
            # 对于字典和列表，先排序再转换为字符串，确保等价的结构能得到相同的字符串
            return json.dumps(result, sort_keys=True)
        return str(result)

    @classmethod
    def merge_with_probability(cls, results: List['BatchResult[T]']) -> 'BatchResult[T]':
        """
        合并多个BatchResult实例，并计算结果的概率分布
        返回概率最高的结果作为最终结果，同时在result中包含概率分布信息
        """
        if not results:
            return cls(result=None, success=True)
        
        # 检查是否所有结果都是相同类型
        if not all(isinstance(r, BatchResult) for r in results):
            raise TypeError("All items must be BatchResult instances")

        # 只考虑成功的结果
        successful_results = [r for r in results if r.success]
        
        if not successful_results:
            # 如果没有成功的结果，合并错误信息
            error_msgs = [f"Error in batch {r.request_index}: {str(r.error)}" 
                         for r in results if not r.success and r.error is not None]
            return cls(
                result=None,
                success=False,
                error=Exception(" | ".join(error_msgs)),
                approach=results[0].approach
            )

        # 标准化并计算结果的频率分布
        normalized_results = [r._normalize_result(r.result) for r in successful_results]
        result_counter = Counter(normalized_results)
        total_count = len(normalized_results)

        # 计算概率分布
        probability_dist = {
            result: count / total_count 
            for result, count in result_counter.items()
        }

        # 找出最高概率的结果
        most_common_result = max(probability_dist.items(), key=lambda x: x[1])
        
        # 找到对应的原始结果（使用第一个匹配的结果）
        for r in successful_results:
            if r._normalize_result(r.result) == most_common_result[0]:
                original_result = r.result
                break

        # 构造带概率分布的结果
        final_result = {
            'value': original_result,  # 最高概率的结果
            'probability': most_common_result[1],  # 最高概率
            'distribution': probability_dist,  # 完整概率分布
            'sample_count': total_count  # 样本总数
        }

        return cls(
            result=final_result,
            success=True,
            approach=results[0].approach,
            request_index=-1
        )

    def get_probability_info(self) -> Dict[str, Any]:
        """获取结果的概率信息"""
        if not isinstance(self.result, dict) or 'probability' not in self.result:
            return {
                'probability': 1.0,
                'sample_count': 1,
                'distribution': {self._normalize_result(self.result): 1.0}
            }
        return {
            'probability': self.result['probability'],
            'sample_count': self.result['sample_count'],
            'distribution': self.result['distribution']
        }

    @classmethod
    def merge_hybrid(cls, results: List['BatchResult[T]']) -> 'BatchResult[T]':
        """
        混合合并方法：先按task_id分组进行概率投票，再合并所有任务的结果
        保留每个任务的概率分布信息
        """
        if not results:
            return cls(result=None, success=True)
        
        # 检查是否所有结果都是相同类型
        if not all(isinstance(r, BatchResult) for r in results):
            raise TypeError("All items must be BatchResult instances")
            
        # 检查是否有task_id
        if all(r.task_id is None for r in results):
            # 如果没有task_id，直接使用merge方法
            return cls.merge(results)
            
        # 按task_id分组
        task_results: Dict[int, List['BatchResult[T]']] = {}
        for result in results:
            if result.task_id is not None:
                task_results.setdefault(result.task_id, []).append(result)
                
        # 对每个任务使用merge_with_probability
        merged_task_results = []
        for task_id, task_results in task_results.items():
            merged_task = cls.merge_with_probability(task_results)
            if merged_task.success and merged_task.result:
                # 将task_id添加到result字典中
                merged_task.result['task_id'] = task_id
                merged_task_results.append(merged_task)
                
        # 合并所有任务的结果，改为列表形式
        if merged_task_results:
            final_result = [r.result for r in merged_task_results]
            return cls(
                result=final_result,
                success=True,
                approach=results[0].approach,
                request_index=-1
            )
        else:
            return cls(result=None, success=False, error=Exception("No successful results"))


    
