import os
import uuid
import tempfile
import logging
import requests
from django.core.exceptions import ValidationError
from .docx_parser.pipeline import DocxParserPipeline

logger = logging.getLogger(__name__)

class DocxExtractor:
    """
    文档内容提取器，专门负责从文件中提取结构化内容
    """
    def __init__(self, document_analysis):
        self.document_analysis = document_analysis

    def extract_elements(self):
        """
        从文件中提取文档内容，并将结果保存到 document_analysis 中
        """
        if not self.document_analysis.file_record or not self.document_analysis.file_record.file:
            raise ValidationError("没有关联的文件记录")

        temp_file_path = None
        try:
            # 获取文件的预签名URL
            presigned_url = self.document_analysis.file_record.get_presigned_url()
            if not presigned_url:
                raise ValidationError("无法获取文件访问地址")

            logger.info(f"开始下载文件: analysis_id={self.document_analysis.id}, file={self.document_analysis.file_record.name}")
        
            # 下载文件到临时文件
            temp_file_path = os.path.join(tempfile.gettempdir(), f"doc_analysis_{uuid.uuid4()}.docx")
            response = requests.get(presigned_url)
            response.raise_for_status()
            
            with open(temp_file_path, 'wb') as temp_file:
                temp_file.write(response.content)
            
            # 使用DocxParserPipeline提取文档元素
            logger.info(f"开始提取文档内容: analysis_id={self.document_analysis.id}, temp_file={temp_file_path}")
            pipeline = DocxParserPipeline(temp_file_path)
            elements = pipeline.process()

            # 将提取的元素转换为可序列化的字典列表
            serializable_elements = [
                {
                    'element_type': str(element.element_type),
                    'sequence_number': int(element.sequence_number),
                    'content': element.content,
                    'indentation': getattr(element, 'indentation', None),
                    'is_heading': getattr(element, 'is_heading', False),
                    'heading_level': getattr(element, 'heading_level', None),
                    'heading_type': getattr(element, 'heading_type', None),
                    'heading_info': getattr(element, 'heading_info', None),
                    'alignment': getattr(element, 'alignment', None),
                    'indentation':getattr(element,'indentation',None),
                    'is_toc': getattr(element, 'is_toc', False),
                    'toc_info': getattr(element,'toc_info',None),
                    'first_line_tabs': getattr(element, 'first_line_tabs', None),
                    'has_nested': getattr(element, 'has_merged', None),
                    'has_merged': getattr(element, 'has_merged', None)
                }
                for element in elements
            ]

            self.document_analysis.extracted_elements = serializable_elements
            self.document_analysis.save()
            
            logger.info(f"成功从文件提取内容: analysis_id={self.document_analysis.id}")
            return serializable_elements

        except requests.RequestException as e:
            error_msg = f"下载文件失败: {str(e)}"
            logger.error(f"{error_msg}, analysis_id={self.document_analysis.id}")
            self.document_analysis.fail_analysis(error_msg)
            raise ValidationError(error_msg)
        
        except Exception as e:
            error_msg = f"提取文档内容失败: {str(e)}"
            logger.error(f"{error_msg}, analysis_id={self.document_analysis.id}")
            self.document_analysis.fail_analysis(error_msg)
            raise ValidationError(error_msg)
        
        finally:
            # 确保临时文件被删除
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    import gc
                    gc.collect()
                    os.remove(temp_file_path)
                    logger.info(f"成功删除临时文件: {temp_file_path}")
                except Exception as e:
                    logger.warning(f"删除临时文件失败: {str(e)}, path={temp_file_path}")
