import asyncio, os, nest_asyncio
from typing import List, Dict, Tuple, Any, Optional
import logging
logger = logging.getLogger(__name__)

from apps.projects.models import Project, Task, TaskType, TaskStatus
from apps.projects.services.base import PipelineStep
from apps.projects.utils.redis_manager import RedisManager

from apps._tools.LLM_services._llm_data_types import LLMConfig
from apps._tools.LLM_services.llm_service import LLMService
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate




class DocxOutlineAnalyzerStep(PipelineStep[Project, Dict[str, Any]]):
    """文档大纲分析器，用于比较和分析文档的目录(TOC)和大纲(Outline)结构"""

    def __init__(self):
        super().__init__()
        nest_asyncio.apply()  # 允许在Jupyter Notebook中运行异步代码
        self.redis_manager = RedisManager()


    def process(self, data: Project, init_run: bool = True) -> Dict[str, Any]:
        """
        处理文档元素，分析目录和正文标题的一致性
        """

        if not self.validate_input(data):
            raise ValueError("输入数据无效")
        
        
        # 提取当前分析的document_analysis, 注意：data.document_analysis 是ModelData类型
        task = Task.objects.get(stage__project=data, type=TaskType.DOCX_EXTRACTION_TASK)


        if init_run:
            data_input, index_path_map = self.prepare_requests_data(task)
            llm_config = self.build_llm_config(model_name="qwen-max-0125")
            task.data_input = data_input
            task.index_path_map = index_path_map
            task.output_format = self.output_format_required()
            task.prompt_template = self.build_prompt_template()
            task.llm_config = llm_config.to_model()
            task.save()


        # 从模型中获取配置, 初始化LLM服务 
        llm_service = LLMService(
            config= LLMConfig.from_model(task.llm_config),
            prompt_template=task.prompt_template,
            output_format=task.output_format
        )

        # 异步分析封装 - 单模型分析
        async def _analyze():
            return await llm_service.analyze(
                data_input=task.data_input,
            )
        
        raw_result = asyncio.run(_analyze())

        # 合并结果
        #final_results = BatchResult.merge_hybrid(raw_batch_results)

        task.result_raw = raw_result
        task.save()
        
        return raw_result
    
    async def process_streaming(self, data: Project, stream_id: Optional[str] = None) -> str:
        """
        流式处理文档元素，分析目录和正文标题的一致性
        
        Args:
            data: 项目数据
            stream_id: 流ID，如果为None则自动生成
            
        Returns:
            str: 任务ID
        """
        if not self.validate_input(data):
            raise ValueError("输入数据无效")
        
        # 提取当前分析的document_analysis
        task = Task.objects.get(stage__project=data, type=TaskType.DOCX_EXTRACTION_TASK)
        
        # 准备数据
        data_input, index_path_map = self.prepare_requests_data(task)
        llm_config = self.build_llm_config(model_name="qwen-max-0125")
        
        # 初始化LLM服务
        llm_service = LLMService(
            config=llm_config,
            prompt_template=self.build_prompt_template(),
            output_format=self.output_format_required()
        )
        
        # 准备元数据
        metadata = {
            "project_id": str(data.id),
            "task_type": str(task.type),
            "model": llm_config.llm_model_name,
            "index_path_map": index_path_map
        }
        
        # 执行流式分析
        # 返回的是ID，不是分析的内容，因为内容直接存储在Redis中.
        stream_id = await llm_service.analyze_streaming(
            data_input=data_input,
            stream_id=stream_id,
            metadata=metadata
        )
        
        # 更新任务状态
        task.status = TaskStatus.ACTIVE
        task.save()
        
        return stream_id

    
    def validate_input(self, data: Project) -> bool:
        """验证输入数据"""

        # 检查是否存在DOCX_EXTRACTION_TASK类型的任务
        task = Task.objects.get(stage__project=data, type=TaskType.DOCX_EXTRACTION_TASK)
        if not task or not task.docx_tiptap:
            return False
        return True
    
    def validate_output(self, data: Any) -> bool:
        """验证输出数据"""
        return isinstance(data, Any)


    def prepare_requests_data(self, task: Task) -> Tuple[List[str], Dict[str, str]]:

        from apps.projects.tiptap.helpers import TiptapUtils
        data_input, index_path_map = TiptapUtils.extract_indexed_paragraphs(task.docx_tiptap, 50)

        return data_input, index_path_map

    
    def output_format_required(self) -> str:
        return """

生成 Markdown：
标题使用相应级别的 Markdown 语法（#）
保留 index 信息，使用 <!-- index: xxx --> 注释格式

输入示例： 

[
  {"content": "第六章 投标文件格式", "index": 484},
  {"content": "6.1 评标方法", "index": 512},
  {"content": "6.1.1 资格审查", "index": 530},
  {"content": "本项目采用综合评分法", "index": 540}
]


输出示例：

<!-- index: 484 -->
# 第六章 投标文件格式

<!-- index: 512 -->
## 6.1 评标方法

<!-- index: 530 -->
### 6.1.1 资格审查

"""


    def build_llm_config(self, model_name: str) -> LLMConfig:
        """构建LLM配置"""
        return LLMConfig(
                    llm_model_name = model_name,  # qwen-plus
                    temperature = 0.7,
                    top_p =  0.8,
                    streaming = True,
                    api_key = os.getenv("ALIBABA_API_KEY"),
                    base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    max_workers = 4,
                    timeout = 30,
                    retry_times = 3
                )
    

    def build_prompt_template(self) -> str:
            return """
你是一个擅长文档结构分析的 AI，接下来我会提供一些文本内容，每条数据包含 content（文本内容）和 index（索引）。你的任务是：
识别标题：判断文本是否是一个章节标题（例如"第X章"、"X.X"、"X.X.X" 等， 也可能是其他格式）。
确定层级：
"第X章" → H1（#）
"X.X" → H2（##）
"X.X.X" → H3（###）
如果不是标题，则忽略



## Format
{output_format}

# Input
{data_input}
"""


    def simulate_prompt(self, data_input: str) -> str:
        """
        模拟生成完整的 prompt
        
        Args:
            context: 输入的上下文信息
            
        Returns:
            str: 完整的 prompt 内容
        """
        # 创建聊天提示模板
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(
                "你是一个专业的招标文档分析助手，帮助用户分析文档的结构和内容。"
            ),
            HumanMessagePromptTemplate.from_template(
                self.build_prompt_template(),
                input_variables=["data_input", "output_format"]
            )
        ])
        
        # 格式化模板
        simulated_prompt = prompt.format_messages(
            data_input=data_input,
            output_format=self.output_format_required()
        )

        # 转换为易读的格式
        formatted_messages = [
            {
                "role": message.type,
                "content": message.content
            }
            for message in simulated_prompt
        ]
        
        return simulated_prompt, formatted_messages
