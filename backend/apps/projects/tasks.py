import logging
from celery import shared_task
from apps.projects.models import Project, DocxExtractionTask, TaskStatus
from apps.projects.services._01_extract_tiptap_docx import DocxExtractorStep



logger = logging.getLogger(__name__)

@shared_task
def process_docx_extraction(project_id: int):
    
    try: 
        project = Project.objects.get(id=project_id)

        # 使用DocxExtractorStep处理文档
        docx_extractor = DocxExtractorStep()
        docx_extractor.process(project)
        
        # 更新任务状态为完成
        docx_extraction_task = DocxExtractionTask.objects.get(stage__project=project)
        docx_extraction_task.status = TaskStatus.COMPLETED
        docx_extraction_task.save()
    
    except Exception as e:
        logger.error(f"文档提取任务失败: {str(e)}, project_id={project_id}")
    
            # 更新任务状态为失败
        try:
            docx_extraction_task = DocxExtractionTask.objects.get(stage__project_id=project_id)
            docx_extraction_task.status = TaskStatus.FAILED
            docx_extraction_task.save()
        except Exception as inner_e:
            logger.error(f"更新任务状态失败: {str(inner_e)}")
        
        # 重新引发异常以便Celery可以记录
        raise