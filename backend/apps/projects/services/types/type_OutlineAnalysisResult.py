from dataclasses import dataclass
from typing import List, Dict, Union
from apps.projects.services.types.base_TypesAndHelpers import ModelData
from apps.projects.models import Project
from apps._tools.LLM_services._llm_data_types import BatchResult
import json

# _02_outline_analysis的输出，数据存储在模型DocumentAnalysis的outline_analysis_result字段

@dataclass
class OutlineAnalysisResult:
    """目录分析结果"""
    project: ModelData[Project]
    analysis_result: BatchResult  # 存储完整的大模型分析结果
    user_confirm: bool = False  # 初始状态为False

    def to_model(self) -> Dict:
        """转换为可序列化的字典"""
        return {
            'document_analysis': {
                'model': 'DocumentAnalysis',
                'instance': str(self.document_analysis.instance.pk)
            },
            'analysis_result': {
                'result': self.analysis_result.result,
                'success': self.analysis_result.success,
                'error': str(self.analysis_result.error) if self.analysis_result.error else None,
                'request_index': self.analysis_result.request_index,
                'approach': self.analysis_result.approach,
                'task_id': self.analysis_result.task_id,
                'probability': self.analysis_result.probability,
                'repeat_index': self.analysis_result.repeat_index,
            },
            'user_confirm': self.user_confirm,
        }

    @classmethod
    def from_model(cls, data: Union[Dict, str]) -> 'OutlineAnalysisResult':
        """从字典创建实例"""
        # 重建 BatchResult
        batch_result = BatchResult(
            result=data['analysis_result']['result'],
            success=data['analysis_result']['success'],
            error=Exception(data['analysis_result']['error']) if data['analysis_result']['error'] else None,
            request_index=data['analysis_result']['request_index'],
            approach=data['analysis_result']['approach'],
            task_id=data['analysis_result']['task_id'],
            probability=data['analysis_result']['probability'],
            repeat_index=data['analysis_result']['repeat_index'],
        )

        return cls(
            project=ModelData(
                model=Project,
                instance=Project.objects.get(pk=data['project']['instance'])
            ),
            analysis_result=batch_result,
            user_confirm=data.get('user_confirm',[])
        )

    @property
    def toc_only_elements(self) -> List[Dict]:
        """提取目录独有的元素"""
        elements = []
        if self.analysis_result and self.analysis_result.result:
            for item in self.analysis_result.result:
                data = json.loads(item['value'])
                elements.extend(data.get('toc_only_titles', []))
        return elements

    @property
    def heading_only_elements(self) -> List[Dict]:
        """提取正文独有的元素"""
        elements = []
        if self.analysis_result and self.analysis_result.result:
            for item in self.analysis_result.result:
                data = json.loads(item['value'])
                elements.extend(data.get('heading_only_titles', []))
        return elements


    @staticmethod
    def get_prompt_specification() -> str:
        """
        OutlineAnalysis会按chapter,section,subsection逐个层级比较<目录标题列表> 与 <正文标题列表>
        以下定义了，大模型返回的输出格式的规范说明
        """
        return """
请严格按照以下JSON格式输出目录分析结果，不要包含任何额外的解释或说明：
{
    "toc_only_titles": [
        {
            "title": "标题内容",
            "position": "目录中的位置",
            "level": "标题层级"
        }
    ],
    "heading_only_titles": [
        {
            "title": "标题内容",
            "position": "正文中的位置",
            "level": "标题层级"
        }
    ],
}
"""