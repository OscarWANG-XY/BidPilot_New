import os, uuid, tempfile, requests
from django.core.exceptions import ValidationError
import logging
logger = logging.getLogger(__name__)

from apps.projects.models import Project, DocxExtractionTask
from apps.projects.services.types.base_TypesAndHelpers import ModelData
from apps.projects.services.types.type_DocxElements import DocxElements
from apps.projects.services.base import PipelineStep
from apps._tools.docx_parser.pipeline import DocxParserPipeline


class DocxExtractorStep(PipelineStep[ModelData[Project], DocxElements]):
    """文档内容提取步骤，继承自PipelineStep"""
    
    def validate_input(self, data: ModelData[Project]) -> bool:
        """验证输入数据"""
        if not data.instance.files.exists():
            return False
        return True

    def validate_output(self, data: DocxElements) -> bool:
        """验证输出数据"""
        return isinstance(data, DocxElements) and len(data.elements) > 0 and data.project is not None

    def process(self, data: ModelData[Project]) -> DocxElements:
        """处理文档提取逻辑"""
        # 输入验证
        if not self.validate_input(data):
            error_msg = "项目中没有文件"
            logger.error(f"{error_msg}, project_id={data.instance.id}")
            raise ValidationError(error_msg)

        current_project= data.instance
        temp_file_path = None
        
        try:
            # 获取文件的预签名URL
            presigned_url = current_project.files.first().get_presigned_url()
            if not presigned_url:
                raise ValidationError("无法获取文件访问地址")

            logger.info(f"开始下载文件: project_id={current_project.id}, file={current_project.files.first().name}")
        
            # 下载文件到临时文件
            temp_file_path = os.path.join(tempfile.gettempdir(), f"doc_analysis_{uuid.uuid4()}.docx")
            response = requests.get(presigned_url)
            response.raise_for_status()
            
            with open(temp_file_path, 'wb') as temp_file:
                temp_file.write(response.content)
            
            # 使用DocxParserPipeline提取文档元素
            logger.info(f"开始提取文档内容: project_id={current_project.id}, temp_file={temp_file_path}")
            pipeline = DocxParserPipeline(temp_file_path)
            elements = pipeline.process()
            
            # 转换为DocxElements
            docx_elements = DocxElements(
                elements = [element.to_dict() for element in elements],
                project = ModelData(model=Project, instance=current_project)
            )   
            
            # 输出验证
            if not self.validate_output(docx_elements):
                error_msg = "输出数据验证失败"
                logger.error(f"{error_msg}, project_id={current_project.id}")
                raise ValidationError(error_msg)
            
            # 保存结果到模型
            docx_extraction_task = DocxExtractionTask.objects.get(stage__project=current_project)
            docx_extraction_task.extracted_elements = docx_elements.to_model()
            docx_extraction_task.save()
            
            logger.info(f"成功从文件提取内容: project_id={current_project.id}")
            return docx_elements

        except requests.RequestException as e:
            error_msg = f"下载文件失败: {str(e)}"
            logger.error(f"{error_msg}, project_id={current_project.id}")
            raise ValidationError(error_msg)
        
        except Exception as e:
            error_msg = f"提取文档内容失败: {str(e)}"
            logger.error(f"{error_msg}, project_id={current_project.id}")
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