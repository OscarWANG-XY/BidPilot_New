from typing import List, Any
from dataclasses import dataclass
from docx_parser_package.docx_parser._03_element_extractor import ElementType
import re

@dataclass
class SimpleElement:
    """简化的文档元素，不包含raw_xml"""
    element_type: ElementType
    sequence_number: int
    content: str    
    is_heading: bool = False  #only for paragraph type
    heading_level: int = 0  #only for paragraph type
    is_toc:bool = False     #only for paragraph type
    has_nested: bool = False #only for table type
    has_merged: bool = False #only for table type
    # 添加新字段
    pre_screened_type: str = ""  # 初筛标记：'chapter', 'content', 'undetermined'

class HeaderPreScreener:
    def __init__(self):
        self.non_heading_patterns = [
            r'^[。，、；：]',           # 以标点符号开头
            r'^[\s\t]*$',             # 空行或只有空白字符
            r'^[a-z]',                # 小写字母开头
            r'.{1,2}$',              # 过短的内容（1-2个字符）
            r'.{100,}$',             # 过长的内容（超过100个字符）
            r'^[\s\t]*[•·\-\*]',     # 列表项标记开头
            r'^\s*注[：:]',           # "注："开头的说明文字
            r'^\s*备注[：:]',         # "备注："开头的说明文字
        ]
    
    def _create_simple_element(self, element: Any) -> SimpleElement:
        """创建简化的元素对象"""
        common_attrs = {
            'element_type': element.element_type,
            'sequence_number': element.sequence_number,
            'content': element.content,
            #'style_id': element.style_id
        }
        
        # 根据元素类型添加特定属性
        if element.element_type == ElementType.PARAGRAPH:
            common_attrs.update({
                'is_heading': getattr(element, 'is_heading', False),
                'is_toc':getattr(element, 'is_toc', False),
                'heading_level': getattr(element, 'heading_level', 0),
                #'heading_type': getattr(element, 'heading_type', ""),
                #'alignment': getattr(element, 'alignment', ""),
                #'indentation': getattr(element, 'indentation', 0)
            })
        elif element.element_type == ElementType.TABLE:
            common_attrs.update({
                'has_nested': getattr(element, 'has_nested', False),
                'has_merged': getattr(element, 'has_merged', False)
            })
            
        return SimpleElement(**common_attrs)

    def pre_screen_elements(self, elements: List[Any]) -> List[SimpleElement]:
        """对元素进行初筛，标记明显不是标题的内容"""
        # 首先将所有元素转换为 SimpleElement
        simple_elements = [self._create_simple_element(element) for element in elements]
        
        # 然后进行预筛选
        for element in simple_elements:
            if element.is_heading and element.heading_level == 1:
                element.pre_screened_type = "chapter"
                continue
            elif element.is_heading and element.heading_level == 2:
                element.pre_screened_type = "section"
                continue

            if element.element_type != ElementType.PARAGRAPH:
                element.pre_screened_type = "content"
                continue
                
            content = element.content.strip()
            is_definitely_content = any(re.match(pattern, content) for pattern in self.non_heading_patterns)
            
            element.pre_screened_type = "content" if is_definitely_content else "undetermined"
        
        return simple_elements