import logging
from celery import shared_task
from apps.projects.models import Project, Task, TaskType, TaskStatus
from apps.projects.services._01_extract_tiptap_docx import DocxExtractorStep
from apps.projects.services._02_outline_analysis import DocxOutlineAnalyzerStep
from apps.projects.utils.redis_manager import RedisManager

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
        if not docx_extraction_task.docx_tiptap:
            logger.warning(f"tiptap_content未保存，尝试再次保存: project_id={project_id}")
            import json
            docx_extraction_task.docx_tiptap = tiptap_content
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


@shared_task(bind=True, ignore_result=True)
async def process_outline_analysis_streaming(self, project_id, stream_id=None):
    """
    流式处理文档大纲分析任务
    
    Args:
        project_id: 项目ID
        stream_id: Redis流ID，如果为None则自动生成
        
    Returns:
        None: 任务不返回结果，结果通过Redis流式传输
    """
    redis_manager = RedisManager()
    
    try:
        # 记录任务开始
        logger.info(f"开始流式处理文档大纲分析: project_id={project_id}, celery_task_id={self.request.id}")
        
        # 获取项目
        project = Project.objects.get(id=project_id)
        
        # 获取分析任务
        outline_task = Task.objects.get(
            stage__project=project,
            type=TaskType.OUTLINE_ANALYSIS_TASK
        )
        
        # 更新任务状态
        outline_task.status = TaskStatus.ACTIVE
        outline_task.save()
        
        # 初始化分析器
        analyzer = DocxOutlineAnalyzerStep()
        
        # 如果没有提供stream_id，则生成一个新的
        if stream_id is None:
            stream_id = redis_manager.generate_stream_id()
            
        # 记录Celery任务ID与Redis任务ID的映射关系
        redis_manager.update_task_status(
            stream_id, 
            "INITIALIZED",
            {
                "celery_task_id": self.request.id,
                "project_id": str(project_id),
                "task_type": str(outline_task.type)
            }
        )
        
        # 执行流式分析
        await analyzer.process_streaming(project, stream_id)
        
        # 分析完成后，更新任务状态
        outline_task.status = TaskStatus.COMPLETED
        outline_task.save()
        
        logger.info(f"流式文档大纲分析完成: project_id={project_id}, stream_id={stream_id}")
        
        return stream_id
        
    except Exception as e:
        logger.error(f"流式文档大纲分析失败: {str(e)}, project_id={project_id}")
        
        # 更新任务状态
        try:
            outline_task = Task.objects.get(
                stage__project_id=project_id,
                type=TaskType.OUTLINE_ANALYSIS_TASK
            )
            outline_task.status = TaskStatus.FAILED
            outline_task.save()
        except Exception as inner_e:
            logger.error(f"更新任务状态失败: {str(inner_e)}")
        
        # 如果已经有stream_id，标记流失败
        if stream_id:
            redis_manager.mark_stream_failed(stream_id, str(e))
        
        # 重新引发异常以便Celery可以记录
        raise

