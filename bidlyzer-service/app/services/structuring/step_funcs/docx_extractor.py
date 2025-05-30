import os
import uuid
import tempfile
import requests
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class DocxExtractor:
    """文档内容提取模块，用于大模型agent"""

    def __init__(self, project_id: str):
        """初始化文档提取器"""
        self.project_id = project_id
        logger.info(f"DocxExtractor: 初始化, project_id={project_id}")

    async def extract_content(self, file_url: str) -> Dict[str, Any]:
        """异步提取文档内容"""
        # 获取文件URL
        if not file_url:
            logger.error(f"DocxExtractor: 无法获取文件URL, project_id={self.project_id}")
            raise ValueError("项目中没有上传的文件")

        temp_file_path = None
        
        try:
            # 如果提供了URL，下载文件到临时位置
            if file_url:
                logger.info(f"docx_extractor: 开始下载文件")
                temp_file_path = os.path.join(tempfile.gettempdir(), f"doc_analysis_{uuid.uuid4()}.docx")
                response = requests.get(file_url, timeout=30)
                response.raise_for_status()
                
                with open(temp_file_path, 'wb') as temp_file:
                    temp_file.write(response.content)
                
                file_to_process = temp_file_path
            else:
                # 如果没有提供URL，抛出错误
                raise ValueError("必须提供文件URL")
            
            logger.info(f"DocxExtractor: 开始提取文档内容, file={file_to_process}")
            
            # 导入转换函数
            from app.clients.tiptap.docx import docx_to_tiptap_json
            tiptap_content = await docx_to_tiptap_json(file_to_process)
            
            # 简单验证输出
            if not tiptap_content:
                error_msg = "提取结果为空"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            logger.info(f"DocxExtractor: 文档内容提取成功, content_size={len(str(tiptap_content))}")
            
            # 返回提取结果，由agent处理持久化
            return tiptap_content

        # 处理网络异常（文件下载失败）：
        except requests.RequestException as e:
            error_msg = f"下载文件失败: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # 处理通用异常（文件提取/处理失败）：
        except Exception as e:
            error_msg = f"提取文档内容失败: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # 无论正常、还是异常，都执行临时文件的删除处理
        finally:
            # 确保临时文件被删除
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info(f"成功删除临时文件: {temp_file_path}")
                except Exception as e:
                    logger.warning(f"删除临时文件失败: {str(e)}, path={temp_file_path}")  