from typing import Optional, Dict, List, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from ._02_xml_parser import DocxXMLParser
from ._00_utils import setup_logger
import math
import statistics
import re

logger = setup_logger(__name__)

class ElementType(Enum):
    PARAGRAPH = "paragraph"
    TABLE = "table"
    FIGURE = "figure"

@dataclass
class DocumentElement:
    """文档元素基础类"""
    element_type: ElementType                            # 元素类型  
    sequence_number: int                                # 全局序号
    content: str                                         # 元素内容
    raw_xml: str                                         # 原始XML
    style_id: Optional[str] = None                      # 样式ID

    def to_dict(self) -> Dict:
        """将DocumentElement转换为字典"""
        base_dict = {
            "type": self.element_type.value,
            "position": self.sequence_number,
            "content": self.content
        }

        # 处理目录元素
        if hasattr(self, 'is_toc') and self.is_toc and self.toc_info:
            toc_level = self.toc_info['toc_level']
            base_dict['is_TOC'] = True
            base_dict['TOC_level'] = {
                1: 'chapter',
                2: 'section',
                3: 'subsection'
            }.get(toc_level, 'other')

        # 处理标题元素
        if hasattr(self, 'is_heading') and self.is_heading:
            base_dict['is_heading'] = True
            base_dict['heading_level'] = {
                1: 'chapter',
                2: 'section',
                3: 'subsection'
            }.get(self.heading_level, 'other')

        return base_dict


@dataclass
class ParagraphElement(DocumentElement):
    """段落元素"""
    is_heading: bool = False
    heading_level: Optional[int] = None
    heading_type: str = ""
    heading_info: Optional[Dict] = None
    alignment: str = "left"
    indentation: Optional[int] = None
    first_line_tabs: int = 0
    is_toc: bool = False
    toc_info: Optional[Dict] = None

@dataclass
class TableElement(DocumentElement):
    """表格元素"""
    has_nested: bool = False # 是否有嵌套表格
    has_merged: bool = False # 是否有合并单元格

@dataclass
class FigureElement(DocumentElement):
    """图"""
    width: Optional[int] = None
    height: Optional[int] = None
    caption: Optional[str] = None
    alt_text: Optional[str] = None
    image_type: str = "inline"
    is_inline: bool = True
    anchor_type: str = "inline"
    source_path: Optional[str] = None

class BaseElementExtractor:
    """元素提取器基类"""
    
    def __init__(self, parser: DocxXMLParser):
        self.parser = parser
        self._style_cache = self._build_style_cache()
        
    def _build_style_cache(self) -> Dict[str, Dict[str, Any]]:
        """构建样式缓存"""
        style_cache = {}
        if self.parser.styles is not None:
            try:
                style_elements = self.parser.xpath("//w:style", self.parser.styles)
                for style in style_elements:
                    style_id = self.parser.get_attribute(style, 'styleId')
                    if style_id:
                        style_cache[style_id] = {
                            'type': self.parser.get_attribute(style, 'type'),
                            'name': self.parser.xpath(".//w:name/@w:val", style)[0] if self.parser.xpath(".//w:name/@w:val", style) else "",
                        }
            except Exception as e:
                logger.error(f"Error building style cache: {e}")
        return style_cache
    
    def extract_element(self, element: Any) -> Optional[DocumentElement]:
        """提取单个元素的基本信息"""
        raise NotImplementedError

class ParagraphExtractor(BaseElementExtractor):
    """段落提取器"""
    
    def __init__(self, parser: DocxXMLParser):
        super().__init__(parser)
        self.logger = setup_logger(f"{__name__}.ParagraphExtractor")
        self._heading_style_cache = self._build_heading_style_cache()
        self._toc_indents = None
        
        # 定义目录标题的正则表达式模式，（放在__init__中比放在_is_toc_title中效率更高,不用每次重新编译）
        self._toc_title_pattern = re.compile(r'^[\s\u3000]*目[\s\u3000]*录[\s\u3000]*$')
        
    def _is_in_toc_container(self, element: Any) -> bool:
        """检查元素是否在目录容器内"""
        # 检查当前元素或其父元素是否在 w:sdt 内，且该 sdt 是目录容器
        sdt = self.parser.xpath("ancestor-or-self::w:sdt[.//w:docPartGallery/@w:val='Table of Contents']", element)
        return bool(sdt)
    
    def _build_heading_style_cache(self) -> Dict[str, int]:
        """构建标题样式缓存
        返回: Dict[样式ID, 标题级别]
        """
        heading_styles = {}
        if self.parser.styles is not None:
            try:
                # 查找所有样式元素
                style_elements = self.parser.xpath("//w:style", self.parser.styles)
                for style in style_elements:
                    style_id = self.parser.get_attribute(style, 'styleId')
                    if not style_id:
                        continue
                        
                    # 检查是否是标题样式
                    style_name = self.parser.xpath("string(.//w:name/@w:val)", style)
                    if style_name and style_name.startswith('heading'):
                        try:
                            # 从样式名称中提取级别（如 'heading 1' -> 1）
                            level = int(style_name.split()[-1])
                            heading_styles[style_id] = level
                        except (ValueError, IndexError):
                            continue
                            
                    # 检查样式的大纲级别
                    outline_level = self.parser.xpath("string(.//w:outlineLvl/@w:val)", style)
                    if outline_level and style_id not in heading_styles:
                        try:
                            heading_styles[style_id] = int(outline_level) + 1
                        except ValueError:
                            continue
                            
            except Exception as e:
                logger.error(f"Error building heading style cache: {e}")
                
        return heading_styles
    
    def _get_heading_info(self, element: Any) -> Tuple[bool, Optional[int], str]:
        """获取标题信息
        返回: (是否是标题, 标题级别, 标题类型)
        
        优先级：
        1. 大纲级别（如果存在）
        2. 样式标题（如果没有大纲级别）
        """
        outline_level = None
        #style_level = None
        
        # 检查大纲级别
        outline_element = self.parser.xpath(".//w:outlineLvl/@w:val", element)
        if outline_element:
            try:
                outline_level = int(outline_element[0]) + 1
            except ValueError:
                pass
                
        # 检查样式
        #style_id = self.parser.xpath("string(.//w:pStyle/@w:val)", element)
        #if style_id in self._heading_style_cache:
        #    style_level = self._heading_style_cache[style_id]
        
        # 优先使用大纲级别
        if outline_level is not None:
            return True, outline_level, "outline"
        #elif style_level is not None:
        #    return True, style_level, "style"
        
        return False, None, ""
    
    def _get_indentation_info(self, element: Any) -> Tuple[Optional[int], int]:
        """获取缩进信息
        返回: (段落缩进值, 首行tab数)
        """
        # 获取段落缩进
        indentation = self.parser.xpath("string(.//w:ind/@w:left)", element)
        indent_level = int(indentation) if indentation else None
        
        # 获取首行的 tab（在第一个文本内容之前的tab）
        first_line_tabs = 0
        for run in self.parser.xpath(".//w:r", element):
            # 检查这个 run 中是否有文本内容
            text_elements = self.parser.xpath(".//w:t", run)
            if text_elements and any(self.parser.get_element_text(t).strip() for t in text_elements):
                # 找到第一个有文本的 run，结束计数
                break
            # 计算这个 run 中的 tab 数量
            first_line_tabs += len(self.parser.xpath(".//w:tab", run))
            
        return indent_level, first_line_tabs

    def _build_toc_indent_map(self) -> Dict[int, int]:
        """构建目录缩进值到层级映射"""
        if self._toc_indents is not None:
            return self._toc_indents
        
        # 收集所有目录项的缩进值
        indents = []  # 使用列表而不是集合，以便处理相近值
        toc_elements = self.parser.xpath("//w:sdt[.//w:docPartGallery/@w:val='Table of Contents']//w:p")
        
        self.logger.debug(f"Found {len(toc_elements)} TOC elements")
        
        for element in toc_elements:
            try:
                # 跳过目录标题（通常包含"目录"文字）
                text = self.parser.get_element_text(element)
                if text.strip() == "目录":
                    self.logger.debug("Skipping TOC title")
                    continue
                
                indent_value = self.parser.xpath("number(.//w:ind/@w:left)", element)
                if not math.isnan(indent_value):  # 检查是否为 NaN
                    indent = int(indent_value)
                    indents.append(indent)
                    self.logger.debug(f"Found indent value: {indent}")
            except (ValueError, TypeError) as e:
                self.logger.debug(f"Skipping invalid indent value: {e}")
                continue
    
        if not indents:  # 如果没有找到有效的缩进值
            self._toc_indents = {}
            return self._toc_indents
        
        # 对缩进值进行分组（考虑20%的误差范围）
        grouped_indents = []
        tolerance = 0.2  # 20%的容错率
        
        # 对收集到的缩进值排序
        sorted_indents = sorted(indents)
        current_group = [sorted_indents[0]]
        
        for indent in sorted_indents[1:]:
            base_value = current_group[0]
            # 检查当前值是否在容错范围内
            if abs(indent - base_value) <= base_value * tolerance:
                current_group.append(indent)
            else:
                # 将当前组的中位数作为该级别的代表值
                grouped_indents.append(int(statistics.median(current_group)))
                current_group = [indent]
        
        # 添加最后一组的中位数
        if current_group:
            grouped_indents.append(int(statistics.median(current_group)))
        
        self.logger.debug(f"Original indents: {sorted_indents}")
        self.logger.debug(f"Grouped indents: {grouped_indents}")
        
        # 构建缩进值到层级的映射
        self._toc_indents = {}
        for level, base_indent in enumerate(grouped_indents, 1):
            # 为每个基准缩进值创建一个范围
            min_indent = int(base_indent * (1 - tolerance))
            max_indent = int(base_indent * (1 + tolerance))
            self._toc_indents[(min_indent, max_indent)] = level
        
        self.logger.debug(f"Built TOC indent map: {self._toc_indents}")
        return self._toc_indents
        
    def _is_toc_title(self, text: str) -> bool:
        """
        检查文本是否为目录标题
        支持的格式包括：
        - "目录"
        - "目  录"
        - "目　録"  # 全角空格
        - " 目 录 "  # 前后和中间可以有空格
        """
        return bool(self._toc_title_pattern.match(text.strip()))
        
    def _get_toc_level(self, element: Any) -> int:
        """获取目录项的级别"""
        try:
            # 检查是否是目录标题
            text = self.parser.get_element_text(element)
            if self._is_toc_title(text):
                self.logger.debug(f"Found TOC title: '{text}'")
                return 0  # 返回特殊级别表示目录标题
            
            # 获取当前元素的缩进值
            indent_value = self.parser.xpath("number(.//w:ind/@w:left)", element)
            if math.isnan(indent_value):  # 检查是否为 NaN
                self.logger.debug("No valid indent found, returning level 1")
                return 1
            
            indent = int(indent_value)
            self.logger.debug(f"Current element indent: {indent}")
            
            # 获取缩进值到层级的映射
            indent_map = self._build_toc_indent_map()
            if not indent_map:  # 如果映射为空
                return 1
            
            # 查找当前缩进值所属的范围
            for (min_indent, max_indent), level in indent_map.items():
                if min_indent <= indent <= max_indent:
                    self.logger.debug(f"Found TOC level {level} for indent {indent} (range: {min_indent}-{max_indent})")
                    return level
            
            return 1  # 如果没有找到匹配的范围，返回默认级别
            
        except Exception as e:
            self.logger.warning(f"Failed to determine TOC level: {e}")
            return 1

    def _clean_toc_content(self, element: Any) -> Tuple[str, Optional[int], int]:
        """清理目录内容，分离标题和页码"""
        text_runs = self.parser.xpath(".//w:r", element)  # 获取所有 run 元素
        content_parts = []
        page_number = None
        found_tab = False  # 标记是否遇到过 tab
        
        for run in text_runs:
            # 检查是否包含 tab
            if self.parser.xpath(".//w:tab", run):
                found_tab = True
                continue
            
            # 获取文本内容
            text = self.parser.xpath("string(.//w:t)", run)
            
            if not text:  # 跳过空文本
                continue
            
            # 如果已经遇到 tab，且当前文本是数字，则认为是页码
            if found_tab and text.strip().isdigit():
                page_number = int(text.strip())
            else:
                # 处理正文内容
                preserve_space = self.parser.xpath("boolean(.//w:t[@xml:space='preserve'])", run)
                if preserve_space:
                    content_parts.append(text)
                else:
                    if content_parts and not text.startswith(' ') and not content_parts[-1].endswith(' '):
                        content_parts.append(' ')
                    content_parts.append(text)
        
        # 合并文本内容，仅去除首尾空格
        clean_content = ''.join(content_parts).strip()
        self.logger.debug(f"Cleaned TOC content: '{clean_content}', page: {page_number}")
        
        # 获取目录级别
        toc_level = self._get_toc_level(element)
        
        return clean_content, page_number, toc_level
    
    def extract_element(self, element: Any) -> Optional[ParagraphElement]:
        try:
            # 检查是否在目录容器内
            is_toc = self._is_in_toc_container(element)
            
            if is_toc:
                # 对目录内容进行特殊处理
                content, page_number, toc_level = self._clean_toc_content(element)
                if not content:
                    return None
            else:
                # 非目录内容的常规处理
                content = self.parser.get_element_text(element)
                page_number = None
                if not content.strip():
                    return None
            
            # 获取样式信息
            style_id = self.parser.xpath("string(.//w:pStyle/@w:val)", element)
            
            # 获取标题信息
            is_heading, heading_level, heading_type = self._get_heading_info(element)
            
            # 获取对齐方式
            alignment = self.parser.xpath("string(.//w:jc/@w:val)", element) or "left"
            
            # 获取缩进信息
            indent_level, first_line_tabs = self._get_indentation_info(element)
            
            
            # 根据缩进级别添加空格到内容前
            if indent_level and not is_heading:
                # 将缩进值转换为空格数量（假设每720 twips = 1/2 inch = 4空格）
                spaces = (indent_level // 720) * 4
                content = ' ' * spaces + content
            
            # 获取原始XML
            try:
                raw_xml = self.parser.element_to_string(element)
            except Exception as e:
                self.logger.warning(f"Could not convert element to string: {e}")
                raw_xml = ""
            
            return ParagraphElement(
                element_type=ElementType.PARAGRAPH,
                sequence_number=-1,
                content=content,
                raw_xml=raw_xml,
                style_id=style_id,
                is_heading=is_heading,
                heading_level=heading_level,
                heading_type=heading_type,
                heading_info={
                    "has_outline_level": bool(self.parser.xpath(".//w:outlineLvl/@w:val", element)),
                    "has_heading_style": bool(style_id in self._heading_style_cache),
                    "style_id": style_id,
                } if is_heading or is_toc else None,
                alignment=alignment,
                indentation=indent_level,
                first_line_tabs=first_line_tabs,
                is_toc=is_toc,
                toc_info={
                    "toc_level": toc_level,
                    "page_number": page_number
                } if is_toc else None
            )
            
        except Exception as e:
            self.logger.error(f"Error extracting paragraph: {e}")
            return None
        

class TableExtractor(BaseElementExtractor):
    """表格提取器"""

    def _get_table_content(self, element: Any) -> str:
        """提取表格内容，转换为Markdown格式"""
        try:
            # 提取当前element下的所有行，排除嵌套表格中的行
            rows = self.parser.xpath(".//w:tr[not(ancestor::w:tbl[ancestor::w:tc])]", element)
            if not rows:
                return ""
            
            md_lines = [] #初始化Markdown行列表
            max_cols = 0 #初始化最大列数
            
            # 处理每一行
            for row_idx, row in enumerate(rows):
                cells = self.parser.xpath("./w:tc", row)  # 只获取直接子单元格
                row_contents = []
                
                for cell in cells:
                    # 检查是否是嵌套表格
                    nested_tables = self.parser.xpath("./w:tbl", cell)  # 只检查直接子表格
                    if nested_tables:
                        # 处理嵌套表格
                        nested_content = ["> 嵌套表格:"]
                        nested_table = nested_tables[0]  # 取第一个嵌套表格
                        nested_rows = self.parser.xpath("./w:tr", nested_table)  # 只获取直接子行
                        first_row = True
                        for n_row in nested_rows:
                            n_cells = self.parser.xpath("./w:tc", n_row)  # 只获取直接子单元格
                            n_contents = []
                            for n_cell in n_cells:
                                # 只获取直接文本内容
                                n_text = ' '.join(self.parser.xpath(".//w:t/text()", n_cell)).strip()
                                n_contents.append(n_text or ' ')
                            nested_content.append(f"> | {' | '.join(n_contents)} |")
                            if first_row:
                                nested_content.append(f"> |{'|'.join(['---'] * len(n_contents))}|")
                                first_row = False
                        cell_content = '\n'.join(nested_content)
                        row_contents.append(cell_content)
                    else:
                        # 处理普通单元格
                        cell_content = ' '.join(self.parser.xpath(".//w:t/text()", cell)).strip()
                        
                        # 处理合并单元格
                        # 只处理当前层级的合并单元格属性
                        grid_span = self.parser.xpath("string(./w:tcPr/w:gridSpan/@w:val)", cell)
                        v_merge = self.parser.xpath("string(./w:tcPr/w:vMerge/@w:val)", cell)
                        
                        merge_info = []
                        if grid_span:
                            span = int(grid_span)
                            if span > 1:
                                merge_info.append(f"→{span}")  # 使用箭头表示横向合并
                        if v_merge:
                            if v_merge == "restart":
                                merge_info.append("↓2")  # 使用箭头表示纵向合并
                        
                        if merge_info:
                            merge_text = f"[合并单元格 {' '.join(merge_info)}]"
                            cell_content = f"{merge_text} {cell_content}" if cell_content else merge_text
                            
                            # 只在横向合并时添加额外的空单元格
                            if grid_span and int(grid_span) > 1:
                                row_contents.append(cell_content)
                                row_contents.extend([''] * (int(grid_span) - 1))
                            else:
                                row_contents.append(cell_content)
                        else:
                            # 检查是否是纵向合并的继续单元格
                            if v_merge and v_merge != "restart":
                                row_contents.append('')  # 对于继续合并的单元格，显示为空
                            else:
                                row_contents.append(cell_content)
                
                # 更新最大列数
                max_cols = max(max_cols, len(row_contents))
                
                # 构建行内容，保留空单元格
                row_line = f"| {' | '.join(row_contents)} |"
                md_lines.append(row_line)
                
                # 在第一行后添加分隔符
                if row_idx == 0:
                    md_lines.append(f"|{'|'.join(['---'] * max_cols)}|")
            
            return '\n'.join(md_lines)
            
        except Exception as e:
            logger.error(f"Error getting table content: {e}")
            return ""

    def extract_element(self, element: Any) -> Optional[TableElement]:
        """提取表格元素"""
        try:
            # 检查是否有嵌套表格, 查当前element下的是否还有w:tbl 
            has_nested = bool(self.parser.xpath(".//w:tbl", element)) 
            
            # 检查是否有合并单元格，查询前element下的是否有w:gridSpan或w:vMerge
            has_merged = bool(self.parser.xpath(".//w:gridSpan|.//w:vMerge", element))
            
            # 获取表格内容的Markdown格式
            content = self._get_table_content(element)
            if not content:
                return None
                
            # 获取原始XML
            try:
                raw_xml = self.parser.element_to_string(element)
            except Exception as e:
                logger.warning(f"Could not convert element to string: {e}")
                raw_xml = ""
            
            return TableElement(
                element_type=ElementType.TABLE,
                sequence_number=-1,  # 将由DocumentElementExtractor设置
                content=content,
                raw_xml=raw_xml,
                style_id=None,  # 表格样式暂不处理
                has_nested=has_nested,
                has_merged=has_merged
            )
            
        except Exception as e:
            logger.error(f"Error extracting table: {e}")
            return None
    


class DocumentElementExtractor:
    """文档元素提取器主类"""
    
    def __init__(self, parser: DocxXMLParser):
        self.parser = parser
        self.current_sequence = 0
        self.extractors = {
            ElementType.TABLE: TableExtractor(parser),
            ElementType.PARAGRAPH: ParagraphExtractor(parser),
        }
        self.elements = []  # 存储所有提取的元素
        self._toc_map = None  # 用于存储目录映射
    
    def _clean_text_for_matching(self, text: str) -> str:
        """清理文本以便进行匹配
        1. 去除所有前后空格
        2. 将多个空格替换为单个空格
        3. 标准化中文数字（如需要）
        """
        # 去除所有前后空格并将多个空格替换为单个空格
        cleaned = re.sub(r'\s+', ' ', text.strip())
        
        # 可以添加更多的清理规则，比如：
        # - 标准化标点符号
        # - 统一全半角
        # - 其他特殊处理
        
        return cleaned

    def _build_toc_map(self):
        """从已处理的TOC元素构建目录映射"""
        if self._toc_map is not None:
            return
            
        self._toc_map = {}
        # 从已处理的元素中筛选出目录项
        toc_elements = [elem for elem in self.elements 
                       if hasattr(elem, 'is_toc') and elem.is_toc 
                       and hasattr(elem, 'toc_info') and elem.toc_info 
                       and elem.toc_info.get('toc_level', 0) > 0]  # 排除目录标题
                       
        for elem in toc_elements:
            # 使用新的清理方法
            clean_title = self._clean_text_for_matching(elem.content)
            self._toc_map[clean_title] = {
                'level': elem.toc_info['toc_level'],
                'page': elem.toc_info.get('page_number'),
                'sequence': elem.sequence_number
            }
            logger.debug(f"Added TOC entry: '{clean_title}' -> {self._toc_map[clean_title]}")
            
    def _match_with_toc(self, content: str) -> Optional[Dict]:
        """尝试将内容与目录项匹配"""
        if not self._toc_map:
            logger.debug("TOC map is empty, no matching possible")
            return None
        
        # 使用相同的清理方法处理待匹配文本
        clean_content = self._clean_text_for_matching(content)
        
        # 添加调试日志，显示所有可用的目录项
        logger.debug(f"Available TOC entries: {list(self._toc_map.keys())}")
        
        match = self._toc_map.get(clean_content)
        
        if match:
            logger.debug(f"Matched content: '{clean_content}' -> {match}")
        else:
            logger.debug(f"No match found for: '{clean_content}'. Available keys: {list(self._toc_map.keys())}")
        
        return match
    
    def _update_sequence(self) -> int:
        """更新并返回全局序号"""
        self.current_sequence += 1
        return self.current_sequence
    
    def _determine_element_type(self, element: Any) -> ElementType:
        """确定元素类型"""
        tag = element.tag.split('}')[-1]
        
        if tag == 'tbl':
            return ElementType.TABLE
        elif tag == 'p':
            return ElementType.PARAGRAPH
        return ElementType.PARAGRAPH  # 默认作为段落处理
    
    def extract_all_elements(self) -> List[DocumentElement]:
        """提取所有元素，保持文档顺序"""
        # 使用原有的 XPath 查询
        xml_elements = self.parser.xpath("//w:p[not(ancestor::w:tbl)] | //w:tbl[not(ancestor::w:tbl)]")
        
        logger.info("Starting element extraction...")
        logger.debug(f"Found {len(xml_elements) if xml_elements else 0} total elements")
        
        last_in_toc = False  # 仅用于检测目录区域结束
        
        # 处理每个元素
        for i, element in enumerate(xml_elements):
            try:
                # 使用与 ParagraphExtractor 相同的逻辑判断是否在目录区域
                is_in_toc = bool(self.parser.xpath("ancestor-or-self::w:sdt[.//w:docPartGallery/@w:val='Table of Contents']", element))
                
                # 如果刚离开目录区域，构建目录映射
                if last_in_toc and not is_in_toc:
                    self._build_toc_map()
                
                last_in_toc = is_in_toc
                
                # 确定元素类型
                element_type = self._determine_element_type(element)
                logger.debug(f"Processing element {i+1}, type: {element_type}")
                
                # 获取对应的提取器
                extractor = self.extractors[element_type]
                extracted = extractor.extract_element(element)
                
                if extracted:
                    extracted.sequence_number = self._update_sequence()
                    
                    # 如果不在目录区域，尝试与目录项匹配
                    """
                    if not is_in_toc and isinstance(extracted, ParagraphElement):
                        clean_content = self._clean_text_for_matching(extracted.content)
                        logger.debug(f"Trying to match content: '{clean_content}' (original: '{extracted.content}')")
                        
                        toc_match = self._match_with_toc(extracted.content)
                        
                        # 保存原始标题信息
                        original_heading_info = {
                            'original_heading_level': extracted.heading_level,
                            'original_is_heading': extracted.is_heading,
                            'original_heading_type': extracted.heading_type,
                            **(extracted.heading_info or {})
                        }
                        
                        if toc_match:
                            # 更新元素属性
                            extracted.content = extracted.content.replace(extracted.content, clean_content)
                            extracted.is_heading = True
                            extracted.heading_level = toc_match['level']
                            extracted.heading_type = "toc_matched"
                            
                            # 创建或更新 heading_info，保留原始标题信息
                            extracted.heading_info = {
                                **original_heading_info,  # 包含原始标题信息
                                'has_outline_level': original_heading_info.get('has_outline_level', False),
                                'has_heading_style': original_heading_info.get('has_heading_style', False),
                                'style_id': original_heading_info.get('style_id'),
                                'toc_matched': True,
                                'toc_level': toc_match['level'],
                                'toc_page': toc_match['page'],
                                'toc_sequence': toc_match['sequence']
                            }
                            logger.debug(f"Updated element with TOC match: {extracted}")
                        else:
                            # 如果是标题但没有匹配到目录项，将其转换为非标题
                            if extracted.is_heading:
                                extracted.heading_info = {
                                    **original_heading_info,  # 保存原始标题信息
                                    'toc_matched': False,
                                    'converted_to_non_heading': True
                                }
                                extracted.is_heading = False
                                extracted.heading_level = None
                                extracted.heading_type = ""
                                logger.debug(f"Converted unmatched heading to non-heading: {extracted}")
                    """
                    self.elements.append(extracted)
                    logger.debug(f"Successfully extracted {element_type} element {i+1}")
                else:
                    logger.debug(f"Element {i+1} was skipped or pending")
                    
            except Exception as e:
                logger.error(f"Error extracting element {i+1}: {e}")
                continue
        
        logger.info(f"Extraction complete. Total elements extracted: {len(self.elements)}")
        return self.elements
    


