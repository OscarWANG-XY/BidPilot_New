# 01_xml_loader.py
# 功能：提取DOCX文件的XML内容

# 依赖库：  
#  - pathlib
#  - zipfile

# 类和函数：
# 1. DocxXMLLoader：提取DOCX文件的XML内容
    # 1.1. __init__：初始化DocxXMLLoader实例
    # 1.2. _validate_file：验证DOCX文件
    # 1.3. extract_raw：提取原始XML内容

# 使用实例：
# loader = DocxXMLLoader(doc_path)  # 创建DocxXMLLoader 加载器 实例 
# raw_content = loader.extract_raw()  # 加载原始文档内容

# 更新历史：
# 2024-12-17 创建





from typing import Union
from pathlib import Path
import zipfile
from ._00_utils import setup_logger, DocxParserError, DocxContent

logger = setup_logger(__name__)

class DocxXMLLoader:
    """DOCX XML内容加载器"""
    
    def __init__(self, file_path: Union[str, Path]):
        self.file_path = Path(file_path)
        self._validate_file()
        self.xml_content = {}
        
    def _validate_file(self) -> None:
        """验证DOCX文件"""
        if not self.file_path.exists():
            raise DocxParserError(f"File not found: {self.file_path}")
        if self.file_path.suffix.lower() != '.docx':
            raise DocxParserError(f"Not a DOCX file: {self.file_path}")
    
    def extract_raw(self) -> DocxContent:
        """提取原始XML内容"""
        try:
            with zipfile.ZipFile(self.file_path) as docx:
                content = DocxContent(
                    document=docx.read('word/document.xml').decode('utf-8')
                )
                
                # 提取可选内容
                if 'word/styles.xml' in docx.namelist():
                    content.styles = docx.read('word/styles.xml').decode('utf-8')
                if 'word/numbering.xml' in docx.namelist():
                    content.numbering = docx.read('word/numbering.xml').decode('utf-8')
                
                logger.info(f"从 {self.file_path} 成功提取 raw XML content")
                return content
                
        except zipfile.BadZipFile:
            raise DocxParserError(f"Invalid DOCX file: {self.file_path}")
        except Exception as e:
            raise DocxParserError(f"Error extracting XML: {str(e)}")


