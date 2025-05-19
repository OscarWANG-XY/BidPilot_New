# llm_output_processor.py
from typing import Any
import re
import json
import logging

logger = logging.getLogger(__name__)

class LLMOutputProcessor:
    """
    适用:
    1）单任务，单LLM调用， JSON输出；  -> 使用merge_outputs 与 使用 _clean_parse_JSON_output效用一样。
    2）单任务，多LLM并发调用，JSON输出，结果合并的情况 -> 使用merge_outputs
    
    不适用于：
    1）非JSON输出，如markdown格式
    2）多任务，多LLM调用，结果无需合并的情况
    """
    

    def _clean_parse_JSON_output(self,output: str) -> str:
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


    def merge_outputs(self, outputs: list, flatten: bool = True) -> str:
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
                cleaned_parsed_output = self._clean_parse_JSON_output(output) #json.load已经在_clean_parse_JSON_output中完成了
                
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