import os
import uuid
import tempfile
import requests
import logging
from typing import Dict, Any
from apps.projects.models import Project
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

class DocxExtractor:
    """文档内容提取模块，用于大模型agent"""

    def __init__(self, project_id):
        """
        初始化文档提取器
        :param file_url: 文件URL，可以是预签名URL
        :param file_path: 本地文件路径，与file_url二选一
        """
        self.project_id = project_id

        logger.info(f"DocxExtractor: 初始化, project_id={self.project_id}")
        self.file_url = self.get_url()

    def get_url(self):

        project = Project.objects.get(id=self.project_id)
        presigned_url = project.files.first().get_presigned_url()
        if not presigned_url:
            raise ValidationError("无法获取文件访问地址")
        return presigned_url
        


    def extract_content(self) -> Dict[str, Any]:
        """提取文档内容并返回TipTap JSON格式的内容"""

        temp_file_path = None
        
        try:
            # 如果提供了URL，下载文件到临时位置
            if self.file_url:
                logger.info(f"docx_extractor: 开始下载文件")
                temp_file_path = os.path.join(tempfile.gettempdir(), f"doc_analysis_{uuid.uuid4()}.docx")
                response = requests.get(self.file_url, timeout=30)
                response.raise_for_status()
                
                with open(temp_file_path, 'wb') as temp_file:
                    temp_file.write(response.content)
                
                file_to_process = temp_file_path
            else:
                # 使用本地文件
                file_to_process = self.file_path
            
            logger.info(f"DocxExtractor: 开始提取文档内容, file={file_to_process}")
            
            # 导入转换函数
            from apps.projects.tiptap import docx_to_tiptap_json
            tiptap_content = docx_to_tiptap_json(file_to_process)
            
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
            error_msg = f"下载文件失败: {str(e)}"   # 1）构造具体错误消息（转为字符串，并拼接成错误消息）
            logger.error(error_msg)    # 2）记录错误日志 （根据配置，可能是打印到终端，或者写到日志文件，或发送到远程日志系统）
            raise ValueError(error_msg)    # 3）将异常转化为ValueError, 重新抛出给上层代码
        
        # 处理通用异常（文件提取/处理失败）：
        except Exception as e:
            error_msg = f"提取文档内容失败: {str(e)}"  # 1）构造具体错误消息
            logger.error(error_msg)  # 2）记录错误日志
            raise ValueError(error_msg)  # 3）将异常转化为ValueError, 重新抛出 （为了告诉外部程序，这里有错误，上层代码需要有try-except来捕获）
        
        # 无论正常、还是异常，都执行临时文件的删除处理
        finally:
            # 确保临时文件被删除
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info(f"成功删除临时文件: {temp_file_path}")  # 1）记录删除操作的结果
                except Exception as e:
                    logger.warning(f"删除临时文件失败: {str(e)}, path={temp_file_path}")  