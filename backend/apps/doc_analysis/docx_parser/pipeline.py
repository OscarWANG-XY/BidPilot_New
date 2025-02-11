from typing import List, Optional, Union
from pathlib import Path

from ._00_utils import setup_logger, DocxParserError, DocxContent
from ._01_xml_loader import DocxXMLLoader
from ._02_xml_parser import DocxXMLParser
from ._03_element_extractor import (
    DocumentElement, 
    DocumentElementExtractor,
    ElementType,
    ParagraphElement,
    TableElement,
    FigureElement,
)

logger = setup_logger(__name__)

class DocxParserPipeline:
    """DOCX解析管道：整合加载、解析和提取过程"""
    
    def __init__(self, file_path: Union[str, Path]):
        """
        初始化解析管道
        :param file_path: DOCX文件路径
        """
        self.file_path = Path(file_path)
        self.loader = None
        self.parser = None
        self.extractor = None
        self.elements = []
        
    def load(self) -> 'DocxParserPipeline':
        """加载DOCX文件的XML内容"""
        try:
            self.loader = DocxXMLLoader(self.file_path)
            self.raw_content = self.loader.extract_raw()
            logger.info(f"成功加载文档: {self.file_path}")
            return self
        except Exception as e:
            raise DocxParserError(f"文档加载失败: {e}")
    
    def parse(self) -> 'DocxParserPipeline':
        """解析XML结构"""
        if not self.loader:
            raise DocxParserError("文档未加载. 请先调用load()方法。")
            
        try:
            self.parser = DocxXMLParser(self.raw_content)
            logger.info("成功解析XML结构")
            return self
        except Exception as e:
            raise DocxParserError(f"文档解析失败: {e}")
    
    def extract(self) -> 'DocxParserPipeline':
        """提取文档元素"""
        if not self.parser:
            raise DocxParserError("文档未解析. 请先调用parse()方法。")
            
        try:
            self.extractor = DocumentElementExtractor(self.parser)
            self.elements = self.extractor.extract_all_elements()
            logger.info(f"成功提取{len(self.elements)}个元素")
            return self
        except Exception as e:
            raise DocxParserError(f"元素提取失败: {e}")
    
    def process(self) -> List[DocumentElement]:
        """
        执行完整的处理流程
        :return: 提取的文档元素列表
        """
        return self.load().parse().extract().elements
    
    def get_elements(self, element_type: Optional[ElementType] = None) -> List[DocumentElement]:
        """
        获取指定类型的元素
        :param element_type: 元素类型（可选）
        :return: 元素列表
        """
        if not self.elements:
            raise DocxParserError("未提取元素. 请先调用process()或extract()方法。")
            
        if element_type is None:
            return self.elements
            
        return [elem for elem in self.elements if elem.element_type == element_type]
    
    def get_paragraphs(self) -> List[ParagraphElement]:
        """获取所有段落元素"""
        return [elem for elem in self.get_elements(ElementType.PARAGRAPH)]
    
    def get_tables(self) -> List[TableElement]:
        """获取所有表格元素"""
        return [elem for elem in self.get_elements(ElementType.TABLE)]
    
    def get_headings(self) -> List[ParagraphElement]:
        """获取所有标题段落"""
        return [elem for elem in self.get_paragraphs() if elem.is_heading]
    
    def get_toc_entries(self) -> List[ParagraphElement]:
        """获取所有目录项"""
        return [elem for elem in self.get_paragraphs() if elem.is_toc]
