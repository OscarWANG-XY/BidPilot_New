# from apps.projects.models import Task, TaskStatus
from typing import List, Dict
import tiktoken
import re
import json
import logging


def count_tokens(text: str) -> int:
    """计算文本的token数量"""
    encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
    return len(encoding.encode(text))


def _clean_llm_JSON_output(output: str) -> str:
    """
    清洗大模型输出结果，移除可能的Markdown代码块标记
    并输出json.load格式
    
    例如将:
    ```json
    {"key": "value"}
    ```
    
    转换为:
    {"key": "value"}
    
    :param output: 大模型原始输出
    :return: 清洗后的输出
    """
    
    # 移除开头的 ```json、```javascript 等代码块标记
    output = re.sub(r'^```\w*\n', '', output)
    
    # 移除结尾的 ``` 标记
    output = re.sub(r'\n```$', '', output)
    
    # 如果整个字符串被代码块包裹，也进行处理
    output = re.sub(r'^```\w*\n(.*)\n```$', r'\1', output, flags=re.DOTALL)
    
    output_json = json.loads(output.strip())

    return output_json


def merge_outputs_(outputs: List[str]) -> List[Dict]:
    """
    处理并发模型的多个输出，清洗标记并合并为一个JSON数组
    
    :param outputs: 模型输出列表，每个元素是一个模型的输出字符串
    :return: 合并后的JSON字符串
    """
    cleaned_results = []
    
    for output in outputs:
        # 清洗每个输出
        try:
            # 尝试解析JSON
            cleaned_parsed_output = _clean_llm_JSON_output(output)  #json.load已经在clean_llm_JSON_output中完成了
            
            # 如果解析结果是列表，扩展到结果列表
            if isinstance(cleaned_parsed_output, list):
                cleaned_results.extend(cleaned_parsed_output)
            else:
                # 如果是单个对象，添加到结果列表
                cleaned_results.append(cleaned_parsed_output)
                
        except json.JSONDecodeError as e:
            # 如果JSON解析失败，记录错误并跳过此输出
            logger = logging.getLogger(__name__)
            logger.error(f"JSON解析错误: {str(e)}, 原始输出: {cleaned_parsed_output[:100]}...")
            continue
    
    # 合并后的结果是Json Dict格式。
    # 如果 将合并后的结果转换为JSON字符串，可return json.dumps(cleaned_results, ensure_ascii=False, indent=2)
    return cleaned_results


def merge_JSON_outputs(outputs: list, flatten: bool = True) -> str:
    """
    合并多个JSON格式的输出为一个JSON数组
    
    :param outputs: JSON字符串列表
    :param flatten: 是否将嵌套列表扁平化，默认为True
    :return: 合并后的JSON字符串

    说明： a=[1,2,3] b=[4,5],  a.append(b) = [1,2,3,[4,5]] 非扁平化,  a.extend(b) = [1,2,3,4,5] 扁平化

    """
    merged_data = []
    
    for output in outputs:
         
        
        try:
            cleaned_parsed_output = _clean_llm_JSON_output(output) #json.load已经在clean_llm_JSON_output中完成了
            
            if flatten and isinstance(cleaned_parsed_output, list):
                # 扁平化处理 - 将列表元素添加到主列表
                merged_data.extend(cleaned_parsed_output)
            else:
                # 非扁平化处理 - 将整个解析结果添加到主列表
                merged_data.append(cleaned_parsed_output)
                
        except json.JSONDecodeError as e:
            logger = logging.getLogger(__name__)
            logger.error(f"合并JSON时解析错误: {str(e)}, 输出: {cleaned_parsed_output[:100]}...")
    
    # 合并后的结果是Json Dict格式。
    # 如果 将合并后的结果转换为JSON字符串，可return json.dumps(merged_data, ensure_ascii=False, indent=2)
    return merged_data



def deduplicate_paths(paths: list) -> list:
    """
    对路径列表进行去重，保留每个路径的首次出现位置
    
    例如将:
    [[53], [602], [595], [352], [296], [602], [595]]
    
    转换为:
    [[53], [602], [595], [352], [296]]
    
    :param paths: 路径列表，每个元素是一个列表
    :return: 去重后的路径列表
    """
    seen = set()
    result = []
    
    for path in paths:
        # 将列表转换为元组以便哈希
        path_tuple = tuple(path)
        
        if path_tuple not in seen:
            seen.add(path_tuple)
            result.append(path)
    
    return result