from typing import Dict, List, Any, Optional, Union
import json
from ._02_xml_parser import DocxXMLParser
from ._00_utils import setup_logger

logger = setup_logger(__name__)

class TiptapConverter:
    """将DOCX XML转换为Tiptap JSON格式"""
    
    def __init__(self, parser: DocxXMLParser):
        """
        初始化Tiptap转换器
        :param parser: DocxXMLParser实例，用于访问XML内容
        """
        self.parser = parser
        self.doc = {"type": "doc", "content": []}
        
    def convert(self) -> Dict[str, Any]:
        """
        执行转换，生成完整的Tiptap文档
        :return: Tiptap JSON文档
        """
        # 获取所有顶级元素（不在表格中的段落和表格）
        elements = self.parser.xpath("//w:p[not(ancestor::w:tbl)] | //w:tbl[not(ancestor::w:tbl)]")
        
        logger.info(f"开始转换文档，找到 {len(elements)} 个顶级元素")
        
        # 按顺序处理每个元素
        for element in elements:
            try:
                node = self.convert_element(element)
                if node:
                    self.doc["content"].append(node)
            except Exception as e:
                logger.error(f"转换元素时出错: {e}")
                continue
        
        logger.info("文档转换完成")
        return self.doc
    
    def convert_element(self, element: Any) -> Optional[Dict[str, Any]]:
        """
        根据元素类型调用相应的转换方法
        :param element: XML元素
        :return: Tiptap节点或None
        """
        # 获取不带命名空间的标签名
        tag = element.tag.split('}')[-1] if '}' in element.tag else element.tag
        
        if tag == 'p':
            return self.convert_paragraph(element)
        elif tag == 'tbl':
            return self.convert_table(element)
        
        logger.warning(f"未知元素类型: {tag}")
        return None
    
    def convert_paragraph(self, element: Any) -> Dict[str, Any]:
        """
        将段落元素转换为Tiptap节点
        :param element: 段落XML元素
        :return: Tiptap段落或标题节点
        """
        # 检查是否是标题
        if self.is_heading(element):
            return self.convert_heading(element)
        
        # 处理普通段落
        p_node = {"type": "paragraph", "content": []}
        
        # 添加段落属性（如对齐方式）
        p_attrs = self.extract_paragraph_attributes(element)
        if p_attrs:
            p_node["attrs"] = p_attrs
        
        # 处理段落中的所有run元素
        runs = self.parser.xpath(".//w:r", element)
        for run in runs:
            text_nodes = self.convert_text_run(run)
            if text_nodes:
                # text_nodes可能是单个节点或节点列表
                if isinstance(text_nodes, list):
                    p_node["content"].extend(text_nodes)
                else:
                    p_node["content"].append(text_nodes)
        
        # 如果段落没有内容，添加一个空文本节点
        if not p_node["content"]:
            p_node["content"].append({"type": "text", "text": " "})
        
        return p_node
    
    def is_heading(self, element: Any) -> bool:
        """
        检查段落是否是标题
        :param element: 段落XML元素
        :return: 是否是标题
        """
        # 检查段落样式
        style_id = self.parser.xpath("string(.//w:pStyle/@w:val)", element)
        if style_id and style_id.startswith('Heading'):
            return True
        
        # 检查大纲级别
        outline_level = self.parser.xpath(".//w:outlineLvl/@w:val", element)
        if outline_level:
            return True
        
        return False
    
    def convert_heading(self, element: Any) -> Dict[str, Any]:
        """
        将标题段落转换为Tiptap标题节点
        :param element: 标题段落XML元素
        :return: Tiptap标题节点
        """
        # 确定标题级别
        level = self.get_heading_level(element)
        
        heading_node = {
            "type": "heading", 
            "attrs": {"level": level},
            "content": []
        }
        
        # 处理标题中的所有run元素
        runs = self.parser.xpath(".//w:r", element)
        for run in runs:
            text_nodes = self.convert_text_run(run)
            if text_nodes:
                if isinstance(text_nodes, list):
                    heading_node["content"].extend(text_nodes)
                else:
                    heading_node["content"].append(text_nodes)
        
        # 如果标题没有内容，添加一个空文本节点
        if not heading_node["content"]:
            heading_node["content"].append({"type": "text", "text": " "})
        
        return heading_node
    
    def get_heading_level(self, element: Any) -> int:
        """
        获取标题级别
        :param element: 标题段落XML元素
        :return: 标题级别(1-6)
        优先级顺序是：样式标题 > 大纲标题 > 默认值(1)
        """
        # 从段落样式获取级别
        style_id = self.parser.xpath("string(.//w:pStyle/@w:val)", element)
        if style_id and style_id.startswith('Heading'):
            try:
                # 尝试从样式名称中提取级别（如'Heading1' -> 1）
                level = int(style_id[7:])
                return min(level, 6)  # 限制最大级别为6
            except ValueError:
                pass
        
        # 从大纲级别获取级别
        outline_level = self.parser.xpath("string(.//w:outlineLvl/@w:val)", element)
        if outline_level:
            try:
                level = int(outline_level) + 1
                return min(level, 6)  # 限制最大级别为6
            except ValueError:
                pass
        
        # 默认为1级标题
        return 1
    
    def extract_paragraph_attributes(self, element: Any) -> Optional[Dict[str, Any]]:
        """
        提取段落属性
        :param element: 段落XML元素
        :return: 段落属性字典或None
        """
        attrs = {}
        
        # 提取对齐方式
        alignment = self.parser.xpath("string(.//w:jc/@w:val)", element)
        if alignment:
            # 将Word对齐方式映射到Tiptap
            align_map = {
                'left': 'left',
                'center': 'center',
                'right': 'right',
                'justify': 'justify',
                'both': 'justify'  # 'both'在Word中通常表示两端对齐
            }
            attrs["textAlign"] = align_map.get(alignment, 'left')
        
        # 可以添加更多段落属性的提取...
        
        return attrs if attrs else None
    
    def convert_text_run(self, run: Any) -> Union[Dict[str, Any], List[Dict[str, Any]], None]:
        """
        将文本run转换为带格式的文本节点
        :param run: 文本run XML元素
        :return: Tiptap文本节点、节点列表或None
        """
        # 获取run中的所有文本内容
        text_elements = self.parser.xpath(".//w:t", run)
        if not text_elements:
            # 检查是否有特殊元素（如分页符、制表符等）
            # 这里可以添加对特殊元素的处理
            return None
        
        # 提取文本内容
        text = ''.join(self.parser.get_element_text(t) for t in text_elements)
        if not text:
            return None
        
        text_node = {"type": "text", "text": text}
        
        # 提取文本格式
        marks = self.extract_text_marks(run)
        if marks:
            text_node["marks"] = marks
        
        return text_node
    
    def extract_text_marks(self, run: Any) -> Optional[List[Dict[str, Any]]]:
        """
        提取文本格式标记
        :param run: 文本run XML元素
        :return: 格式标记列表或None
        """
        marks = []
        
        # 检查加粗
        if self.parser.xpath("boolean(.//w:b | .//w:rPr/w:b)", run):
            marks.append({"type": "bold"})
        
        # 检查斜体
        if self.parser.xpath("boolean(.//w:i | .//w:rPr/w:i)", run):
            marks.append({"type": "italic"})
        
        # 检查下划线
        if self.parser.xpath("boolean(.//w:u | .//w:rPr/w:u)", run):
            marks.append({"type": "underline"})
        
        # 检查删除线
        if self.parser.xpath("boolean(.//w:strike | .//w:rPr/w:strike)", run):
            marks.append({"type": "strike"})
        
        # 可以添加更多文本格式的检查...
        
        return marks if marks else None
    
    def convert_table(self, element: Any) -> Dict[str, Any]:
        """
        将表格元素转换为Tiptap表格节点
        :param element: 表格XML元素
        :return: Tiptap表格节点
        """
        table_node = {"type": "table", "content": []}
        
        # 处理表格行
        rows = self.parser.xpath(".//w:tr", element)
        for row in rows:
            row_node = self.convert_table_row(row)
            if row_node:
                table_node["content"].append(row_node)
        
        return table_node
    
    def convert_table_row(self, row: Any) -> Dict[str, Any]:
        """
        将表格行元素转换为Tiptap表格行节点
        :param row: 表格行XML元素
        :return: Tiptap表格行节点
        """
        row_node = {"type": "tableRow", "content": []}
        
        # 处理单元格
        cells = self.parser.xpath(".//w:tc", row)
        for cell in cells:
            cell_node = self.convert_table_cell(cell)
            if cell_node:
                row_node["content"].append(cell_node)
        
        return row_node
    
    def convert_table_cell(self, cell: Any) -> Dict[str, Any]:
        """
        将表格单元格元素转换为Tiptap表格单元格节点
        :param cell: 表格单元格XML元素
        :return: Tiptap表格单元格节点
        """
        cell_node = {"type": "tableCell", "content": []}
        
        # 提取单元格属性（合并单元格信息）
        cell_attrs = {}
        
        # 处理列合并
        grid_span = self.parser.xpath("string(.//w:tcPr/w:gridSpan/@w:val)", cell)
        if grid_span:
            try:
                colspan = int(grid_span)
                if colspan > 1:
                    cell_attrs["colspan"] = colspan
            except ValueError:
                pass
        
        # 处理行合并（开始合并的单元格）
        v_merge = self.parser.xpath("string(.//w:tcPr/w:vMerge/@w:val)", cell)
        if v_merge == "restart":
            # 计算行合并数量（需要查找后续行）
            # 这部分较复杂，简化版本只设置rowspan=2
            cell_attrs["rowspan"] = 2
        
        # 如果有属性，添加到节点
        if cell_attrs:
            cell_node["attrs"] = cell_attrs
        
        # 处理单元格内容
        paragraphs = self.parser.xpath(".//w:p", cell)
        for p in paragraphs:
            p_node = self.convert_paragraph(p)
            if p_node:
                cell_node["content"].append(p_node)
        
        # 如果单元格没有内容，添加一个空段落
        if not cell_node["content"]:
            cell_node["content"].append({
                "type": "paragraph",
                "content": [{"type": "text", "text": " "}]
            })
        
        return cell_node