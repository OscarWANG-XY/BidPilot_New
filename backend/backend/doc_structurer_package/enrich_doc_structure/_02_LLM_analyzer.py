from typing import List, Dict, Optional, Any
import asyncio
from langchain.schema import HumanMessage
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.chat_models import MoonshotChat
from tenacity import retry, wait_exponential, stop_after_attempt
import json
import nest_asyncio

nest_asyncio.apply()  # 允许嵌套事件循环

class LLMAnalyzer:
    def __init__(self, prompt:str, parts: list[Dict]):
        self.prompt = prompt 
        # 如果输入的是单个dict，转换为列表, 确保是列表类型
        self.parts = [parts] if isinstance(parts, Dict) else parts

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
            
            prompt_content = self.prompt.replace("<text>", part['content'])
            messages = [HumanMessage(content=prompt_content)]
            
            response = await self._call_model_async(chat, messages)
            
            try:
                # 清理并解析响应
                cleaned_content = self._clean_model_response(response.content)
                result = json.loads(cleaned_content)
                
                # 验证是否为列表类型
                if not isinstance(result, list):
                    print(f"返回结果必须是列表格式，当前格式为: {type(result)}")
                    return [result]
                
                # 验证列表元素
                for item in result:
                    # 验证基本结构
                    if not isinstance(item, dict):
                        print(f"列表元素必须是字典格式: {item}")
                        return None
                    
                    # 验证必需字段
                    required_fields = [
                        "章节编号", "章节标题","附件类型", "摘要", "内容包括", 
                        "解读环节用途", "编制环节用途", "关键行动"
                    ]
                    missing_fields = [field for field in required_fields if field not in item]
                    if missing_fields:
                        print(f"缺少必需字段: {missing_fields}")
                        return None
                    
                    # 验证并转换章节编号为整数
                    try:
                        item["章节编号"] = int(item["章节编号"])
                    except (ValueError, TypeError):
                        print(f"章节编号必须能转换为整数，当前值为: {item['章节编号']}")
                        return None
                    
                    # 验证章节标题不为空
                    if not item["章节标题"] or not isinstance(item["章节标题"], str):
                        print(f"章节标题必须是非空字符串，当前值为: {item['章节标题']}")
                        return None

                    # 验证附件类型的值
                    if item["附件类型"] not in ["模板", "补充说明"]:
                        print(f"附件类型必须是 '模板' 或 '补充说明'，当前值为: {item['附件类型']}")
                        return None
                    
                    # 验证关键行动格式
                    if not isinstance(item["关键行动"], list):
                        print(f"关键行动必须是列表格式，当前格式为: {type(item['关键行动'])}")
                        return None
                    
                    # 验证每个行动项
                    for action in item["关键行动"]:
                        if not isinstance(action, dict):
                            print(f"行动项必须是字典格式: {action}")
                            return None
                        
                        # 验证行动项必需字段
                        required_action_fields = ["行动名称", "时间", "地点", "内容"]
                        missing_action_fields = [
                            field for field in required_action_fields 
                            if field not in action
                        ]
                        if missing_action_fields:
                            print(f"行动项缺少必需字段: {missing_action_fields}")
                            return None
                
                return result
                
            except json.JSONDecodeError as e:
                print(f"JSON解析错误，清理后的响应：\n{cleaned_content}")
                print(f"错误详情：{str(e)}")
                return None
                
        except Exception as e:
            print(f"处理 part 时发生错误: {str(e)}")
            return None

    async def process_all_parts_async(self) -> List[Dict]:
        """异步处理所有parts，确保返回格式一致"""
        if len(self.parts) == 1:
            # 单个 part 的情况
            result = await self.process_part_async(self.parts[0])
            print("\nprocess_part_async 返回值检查:")
            print(f"result 类型: {type(result)}")
            print(f"result 内容: {result}")
            # 确保返回列表格式
            return result if isinstance(result, list) else [result] if result else []

        # 多个 parts 的情况
        results = []
        batch_size = 5
        
        for i in range(0, len(self.parts), batch_size):
            batch = self.parts[i:i + batch_size]
            batch_tasks = [self.process_part_async(part) for part in batch]
            batch_results = await asyncio.gather(*batch_tasks)
            
            # 只保留有效的结果
            for result in batch_results:
                if isinstance(result, list):
                    results.extend(result)
            
            await asyncio.sleep(0.3)
            
        return results

    def analyze_parts(self) -> List[Dict]:
        """分析所有parts中的内容，提供统一的列表格式返回"""
        print("\n开始分析...")        
        loop = asyncio.get_event_loop()
        results = loop.run_until_complete(self.process_all_parts_async())
        print("\n数据类型检查:")
        print(f"results 类型: {type(results)}")
        print(f"results 内容: {results}")
        if results and len(results) > 0:
            print(f"第一个元素类型: {type(results[0])}")
        print("\n分析完成！")
        return results