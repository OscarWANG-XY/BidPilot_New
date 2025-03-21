import logging
from celery import shared_task
from apps.projects.models import Project, Task, TaskType, TaskStatus
from apps.projects.services._01_extract_tiptap_docx import DocxExtractorStep



logger = logging.getLogger(__name__)

@shared_task
def process_docx_extraction(project_id: int):
    try: 
        project = Project.objects.get(id=project_id)
        logger.info(f"开始处理文档提取任务: project_id={project_id}")
        
        # 使用DocxExtractorStep处理文档
        docx_extractor = DocxExtractorStep()
        tiptap_content = docx_extractor.process(project)
        
        # 获取任务并验证内容是否已保存
        docx_extraction_task = Task.objects.get(
            stage__project_id=project_id,
            type=TaskType.DOCX_EXTRACTION_TASK
        )
        
        # 检查内容是否已保存
        if not docx_extraction_task.tiptap_content:
            logger.warning(f"tiptap_content未保存，尝试再次保存: project_id={project_id}")
            import json
            docx_extraction_task.tiptap_content = json.dumps(tiptap_content)
            docx_extraction_task.save()
        
        # 更新任务状态为完成
        docx_extraction_task.status = TaskStatus.COMPLETED
        docx_extraction_task.save()
        
        logger.info(f"文档提取任务完成: project_id={project_id}")
    
    except Exception as e:
        logger.error(f"文档提取任务失败: {str(e)}, project_id={project_id}")
        # 修复缩进问题
        try:
            docx_extraction_task = Task.objects.get(
                stage__project_id=project_id,
                type=TaskType.DOCX_EXTRACTION_TASK
            )
            docx_extraction_task.status = TaskStatus.FAILED
            docx_extraction_task.save()
        except Exception as inner_e:
            logger.error(f"更新任务状态失败: {str(inner_e)}")
        
        # 重新引发异常以便Celery可以记录
        raise