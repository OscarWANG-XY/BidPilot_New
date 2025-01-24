from typing import List, Dict, Any
from llm_structurer_package.llm_structurer._01_header_pre_screener import SimpleElement, HeaderPreScreener
import tiktoken

class PartsCreator:
    def __init__(self):
        self.pre_screener = HeaderPreScreener()  # 创建 HeaderPreScreener 实例

    def format_element_info(self, element: SimpleElement) -> str:
        """格式化单个元素的信息"""
        element_type = ""
        if element.pre_screened_type == "chapter":
            element_type = "Chapter 标题"
        elif element.pre_screened_type == "section":
            element_type = "Section 标题"
        elif element.pre_screened_type == "content":
            element_type = "初筛为正文"
        else:
            element_type = "初筛为待定"

        return (f"元素：{element.sequence_number}\n"
                f"类型：{element_type}\n"
                f"内容：{element.content}\n")

    def count_tokens(self, text: str) -> int:
        """计算文本的token数量"""
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        return len(encoding.encode(text))

    def organize_parts(self, elements: List[SimpleElement]) -> List[Dict]:
        """将文档组织成字典列表，每个字典包含格式化文本和token统计"""
        formatted_parts = []
        part_sequence = 1  # 初始化part序号
        
        i = 0
        while i < len(elements):
            # 寻找标题作为part的开始
            if not (elements[i].is_heading or 
                   elements[i].pre_screened_type in ["chapter", "section"]):
                i += 1
                continue
                
            # 找到标题，开始新的part
            current_text = []
            pure_contents = []  # 存储纯文本内容
            elements_in_part = []  # 存储当前part中的所有元素
            
            # 记录part的级别和名字
            part_level = elements[i].pre_screened_type
            part_name = elements[i].content  # 使用标题内容作为part名称
            
            # 添加标题
            current_text.append(self.format_element_info(elements[i]))
            current_text.append("")  # 标题后空行
            pure_contents.append(elements[i].content)
            elements_in_part.append(elements[i])
            
            # 收集当前标题到下一个标题之间的内容
            j = i + 1
            while j < len(elements):
                if (elements[j].is_heading or 
                    elements[j].pre_screened_type in ["chapter", "section"]):
                    break
                current_text.append(self.format_element_info(elements[j]))
                current_text.append("")  # 每个元素后空行
                pure_contents.append(elements[j].content)
                elements_in_part.append(elements[j])
                j += 1
                
            # 创建part字典
            if current_text:
                formatted_content = "\n".join(current_text)
                pure_content = "\n".join(pure_contents)
                
                part_dict = {
                    "part_sequence": part_sequence,  # 添加part序号
                    "part_name": part_name,         # 添加part名称
                    "part_level": part_level,       # part级别
                    "No_of_elm": len(elements_in_part),  # 添加元素数量
                    "content": formatted_content,
                    "pure_content_length": self.count_tokens(pure_content),
                    "part_length": self.count_tokens(formatted_content)
                }
                formatted_parts.append(part_dict)
                part_sequence += 1  # 增加序号
            
            # 移动到下一个标题位置
            i = j
            
        return formatted_parts

    def output_parts(self, elements: List[Any]) -> List[Dict]:
        """处理文档的主流程"""
        # 使用 HeaderPreScreener 的方法进行预处理
        screened_elements = self.pre_screener.pre_screen_elements(elements)
        
        # 直接组织成文档部分
        parts = self.organize_parts(screened_elements)
        
        return parts