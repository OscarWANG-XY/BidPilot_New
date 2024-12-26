from typing import List, Dict, Optional, Any
import asyncio
from langchain.schema import HumanMessage
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.chat_models import MoonshotChat
from tenacity import retry, wait_exponential, stop_after_attempt
import json
import nest_asyncio

nest_asyncio.apply()  # 允许嵌套事件循环

class LLMHeadingExtractor:
    def __init__(self):
        self.heading_prompt = """

请根据以下文本内容判断每个"类型待定"的元素是否可以作为{heading_type}标题，并提供理由。


分析和输出逻辑：
1. 类型已经为"标题"或 "正文"的元素，都不适合作为{heading_type}标题
2. 如果没有可作{heading_type}标题的元素，请返回空列表：
[]
3. 如果存在可以作为{heading_type}标题的元素，请按以下Json格式输出：
[
    {{
        "元素": 元素原本的序号,
        "类型": "{heading_type}标题",
        "内容": "元素原本的内容",
        "理由": "判断理由"
    }},
    ...
]


注意：
1. 输出必须是有效的JSON格式或[]
2. 合适的元素，其序号 和 内容都严格按原本的内容输出
3. 合适的元素，reason字段要简明扼要地说明判断依据

文本内容：
{text}
"""

    def _determine_heading_type(self, part_level: str) -> str:
        """根据part_level确定heading_type"""
        heading_type_map = {
            "chapter": "section",
            "section": "subsection",
            "subsection": "subsection"
        }
        if not part_level:
            raise ValueError("未指定 part_level")
        return heading_type_map.get(part_level, "section")

    def _select_model(self, doc_lens: int) -> str:
        """根据文档长度选择合适的模型"""
        if doc_lens < 4000:
            return "moonshot-v1-8k"
        elif doc_lens < 16000:
            return "moonshot-v1-32k"
        return "moonshot-v1-128k"

    def _create_chat_instance(self, model_name: str) -> MoonshotChat:
        """创建聊天模型实例"""
        return MoonshotChat(
            model=model_name,
            moonshot_api_key="sk-PP0zwV7NwWliWrHzOrcGqntJNQc2wlAX3GWAROqnLTnYO92u",
            temperature=0.1,
            max_tokens=self._get_max_tokens(model_name),
            streaming=True
        )

    def _get_max_tokens(self, model_name: str) -> int:
        """获取模型的最大token数"""
        return {
            "moonshot-v1-8k": 4000,
            "moonshot-v1-32k": 16000,
            "moonshot-v1-128k": 32000
        }.get(model_name, 4000)

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(3),
        reraise=True
    )
    async def _call_model_async(self, chat, messages):
        """单独封装模型调用，只对网络错误进行重试"""
        try:
            return await chat.ainvoke(
                messages,
                config={"callbacks": [StreamingStdOutCallbackHandler()]}
            )
        except Exception as e:
            print(f"模型调用失败: {str(e)}")
            raise

    def _clean_model_response(self, content: str) -> str:
        """清理模型响应中的markdown标记"""
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
        return content.strip()

    async def process_part_async(self, part: Dict) -> Optional[List[Dict[str, Any]]]:
        """异步处理单个part，期望返回列表类型"""
        try:
            doc_lens = part['part_length']
            model_name = self._select_model(doc_lens)
            chat = self._create_chat_instance(model_name)
            
            heading_type = self._determine_heading_type(part['part_level'])
            prompt_content = self.heading_prompt.format(
                text=part['content'],
                heading_type=heading_type
            )
            messages = [HumanMessage(content=prompt_content)]
            
            # 只对模型调用进行重试
            response = await self._call_model_async(chat, messages)
            
            try:
                # 清理并解析响应
                cleaned_content = self._clean_model_response(response.content)
                result = json.loads(cleaned_content)
                
                # 验证结果是否为列表类型
                if not isinstance(result, list):
                    print(f"解析结果类型错误: 期望列表，实际为 {type(result)}")
                    return None
                    
                # 验证列表元素的格式
                for item in result:
                    if not isinstance(item, dict) or not all(k in item for k in ["元素", "类型", "内容", "理由"]):
                        print(f"列表元素格式错误: {item}")
                        return None
                        
                return result
                
            except json.JSONDecodeError as e:
                print(f"JSON解析错误，清理后的响应：\n{cleaned_content}")
                print(f"错误详情：{str(e)}")
                return None
                
        except Exception as e:
            print(f"处理 part 时发生错误: {e}")
            return None

    async def process_all_parts_async(self, parts: List[Dict]) -> List[Dict]:
        """异步处理所有parts"""
        if len(parts) == 1:
            result = await self.process_part_async(parts[0])
            return result if result else []  # 如果是 None 则返回空列表

        results = []
        batch_size = 5
        
        for i in range(0, len(parts), batch_size):
            batch = parts[i:i + batch_size]
            batch_tasks = [self.process_part_async(part) for part in batch]
            batch_results = await asyncio.gather(*batch_tasks)
            
            # 只保留有效的列表结果
            valid_results = []
            for result in batch_results:
                if isinstance(result, list):
                    valid_results.extend(result)  # 展开列表结果
            
            results.extend(valid_results)
            await asyncio.sleep(0.3)
            
        return results

    def extract_sub_headings(self, parts: List[Dict]) -> List[Dict]:
        """提取所有parts中的子标题"""
        print("\n开始提取子标题...")
        
        # 如果传入的是单个dict，转换为列表
        if isinstance(parts, dict):
            parts = [parts]
            print("处理单个part...")
        else:
            print(f"待处理parts数量: {len(parts)}")
        
        # 使用get_event_loop而不是asyncio.run
        loop = asyncio.get_event_loop()
        results = loop.run_until_complete(self.process_all_parts_async(parts))
        
        print("\n子标题提取完成！")
        return results
