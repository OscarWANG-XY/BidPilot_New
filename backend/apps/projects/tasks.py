import logging, asyncio
from celery import shared_task
from apps.projects.models import Project, Task, TaskType, TaskStatus
from apps.projects.services._01_extract_tiptap_docx import DocxExtractorStep
from apps.projects.services._02_outline_analysis import DocxOutlineAnalyzerStep  
from apps.projects.utils.redis_manager import RedisManager, RedisStreamStatus
from apps.projects.services.llm_task_analysis import LLMTaskAnalysisStep  # 测试中...


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
        # docx_extraction_task.status = TaskStatus.COMPLETED
        # docx_extraction_task.save()
        
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


# Celery 任务内部，self.request是一个context对象。 bind=True 是任务可以访问自身self.request。 
@shared_task(bind=True, ignore_result=True)
def process_outline_analysis_streaming(self, project_id, stream_id=None):
    """
    流式处理文档大纲分析任务
    
    这是一个同步函数，内部使用事件循环来执行异步代码
    """
    
    
    try:
        # 记录任务开始
        print(f"开始流式处理文档大纲分析: project_id={project_id}, celery_task_id={self.request.id}")
        #logger.info(f"开始流式处理文档大纲分析: project_id={project_id}, celery_task_id={self.request.id}")
        
        # 获取项目
        project = Project.objects.get(id=project_id)

        outline_task = Task.objects.get(
            stage__project=project,
            type=TaskType.OUTLINE_ANALYSIS_TASK
        )
        
        print(f"outline_task.status: {outline_task.status}")
        if outline_task.status != TaskStatus.PROCESSING:
            print(f"大纲分析任务未激活，无法启动分析")
            #logger.error(f"大纲分析任务未激活，无法启动分析")
            return 


        # 初始化分析器
        analyzer = DocxOutlineAnalyzerStep(project)

        redis_manager = RedisManager()
        stream_id = self.request.id   # 使用Celery任务的ID作为stream_id
        print(f"在Celery任务中，有通过Context取得stream_id么: {stream_id}")
        print(f"尝试另一种写法: {self.request.id}")
            
        # 记录Celery任务ID与Redis任务ID的映射关系
        redis_manager.update_stream_status(
            stream_id, 
            RedisStreamStatus.PENDING,
            {
                "celery_task_id": self.request.id,
                "project_id": str(project_id),
                "task_type": str(outline_task.type)
            }
        )
        
        # 添加初始内容块，确保流内容键存在
        redis_manager.add_stream_chunk(stream_id, "正在准备分析文档大纲...\n")

        # 执行流式分析 
        asyncio.run(analyzer.process_streaming(stream_id))

        outline_task.status = TaskStatus.COMPLETED
        outline_task.save()
        
        print(f"流式文档大纲分析完成: project_id={project_id}, stream_id={stream_id}")
        
        return stream_id
        
    except Exception as e:
        print(f"流式文档大纲分析失败: {str(e)}, project_id={project_id}")
        
        # 更新任务状态
        try:
            outline_task = Task.objects.get(
                stage__project_id=project_id,
                type=TaskType.OUTLINE_ANALYSIS_TASK
            )
            outline_task.status = TaskStatus.FAILED
            outline_task.save()
        except Exception as inner_e:
            print(f"更新任务状态失败: {str(inner_e)}")
            #logger.error(f"更新任务状态失败: {str(inner_e)}")
        if stream_id:
            redis_manager.mark_stream_failed(stream_id, str(e))
        
        # 重新引发异常以便Celery可以记录
        raise



# 以下为测试中的任务.... 
@shared_task(bind=True, ignore_result=True)
def process_task_analysis_streaming(self, project_id=None, stage_type=None, task_type=None, stream_id=None):
    """
    流式处理任务分析
    这是一个同步函数，内部使用事件循环来执行异步代码
    注意：celery的参数必须是可序列化的，不能传递Project, Stage, Task对象进来，只能传递id. 
    """
    
    try:
        # 记录任务开始
        print(f"开始流式处理任务分析: project_id={project_id}, stage_type={stage_type}, task_type={task_type}, celery_task_id={self.request.id}")
        #logger.info(f"开始流式处理文档大纲分析: project_id={project_id}, celery_task_id={self.request.id}")
        
        # 获取项目
        project = Project.objects.get(id=project_id)

        task = Task.objects.get(
            stage__project=project,
            type=task_type
        )
        
        print(f"outline_task.status: {task.status}")
        if task.status != TaskStatus.PROCESSING:
            print(f"任务分析未启用，无法启动分析")
            #logger.error(f"任务分析未启用，无法启动分析")
            return 



        analyzer = DocxOutlineAnalyzerStep(project)
        # 初始化分析器 （TODO:需要替换为general的分析器）
        #analyzer = LLMTaskAnalysisStep(project)

        # 初始化Redis管理器
        redis_manager = RedisManager()
        stream_id = self.request.id   # 使用Celery任务的ID作为stream_id

            
        # 记录Celery任务ID与Redis任务ID的映射关系
        redis_manager.update_stream_status(
            stream_id, 
            RedisStreamStatus.PENDING,
            {
                "celery_task_id": self.request.id,
                "project_id": str(project_id),
                "stage_type": str(stage_type),
                "task_type": str(task_type)
            }
        )
        
        # 添加初始内容块，确保流内容键存在
        redis_manager.add_stream_chunk(stream_id, "正在准备分析文档大纲...\n")

        # 执行流式分析 
        asyncio.run(analyzer.process_streaming(stream_id))


        # 获取流式完整结果， get_stream_result() 默认的start=0, end=-1, 表示从头到尾的完整内容。 
        chunks = redis_manager.get_stream_chunks(stream_id)
        # 过滤掉特殊标记块
        content_chunks = [
            chunk for chunk in chunks 
            if chunk.get('content') != 'DONE' and not chunk.get('content', '').startswith('ERROR:')
        ]
        # 合并内容
        full_content = ''.join([chunk.get('content', '') for chunk in content_chunks])

        # 使用docx_to_tiptap_json函数提取文档元素   - Approach 2 (微服务版本)
        from apps.projects.tiptap import TiptapClient
        tiptap_client = TiptapClient()
        tiptap_content = tiptap_client.markdown_to_json(full_content)

        # 更新任务结果
        task.final_result = tiptap_content
        task.save()


        print(f"流式分析的最终结果: {full_content}")
        print(f"流式文档大纲分析完成: project_id={project_id},stage_type={stage_type}, task_type={task_type}, stream_id={stream_id}")
        
        return stream_id
        
    except Exception as e:
        print(f"流式文档大纲分析失败: {str(e)}, project_id={project_id}")
        
        # 更新任务状态
        try:
            task = Task.objects.get(
                stage__project_id=project_id,
                type=task_type  # 使用传入的task_type参数
            )
            task.status = TaskStatus.FAILED
            task.save()
        except Exception as inner_e:
            print(f"更新任务状态失败: {str(inner_e)}")
            #logger.error(f"更新任务状态失败: {str(inner_e)}")
        if stream_id:
            redis_manager.mark_stream_failed(stream_id, str(e))
        
        # 重新引发异常以便Celery可以记录
        raise


        # # 初始化LLM服务
        # from apps._tools.LLM_services._llm_data_types import LLMConfig
        # from apps._tools.LLM_services.llm_service import LLMService
        # llm_service = LLMService(
        #     config=self.llm_config,
        #     prompt_template=self.prompt_template,
        #     output_format=self.output_format
        # )
        
        # # 准备元数据
        # metadata = {
        #     "model": self.llm_config.llm_model_name,
        #     "index_path_map": self.index_path_map
        # }
        
        # # 执行流式分析
        # # 返回的是ID，不是分析的内容，因为内容直接存储在Redis中.
        # asyncio.run(
        #     llm_service.analyze_streaming(
        #         data_input=self.data_input,
        #         stream_id = stream_id,
        #         metadata=metadata
        #     )
        # )
