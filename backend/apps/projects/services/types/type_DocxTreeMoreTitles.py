from dataclasses import dataclass
from typing import Dict
from apps.projects.services.types.base_TypesAndHelpers import ModelData
from apps.projects.models import Project
from apps._tools.LLM_services._llm_data_types import BatchResult


@dataclass
class DocxTreeMoreTitles:
    project: ModelData[Project]
    analysis_result: BatchResult  # 存储完整的大模型分析结果
    user_confirm: bool = False

    def to_model(self) -> Dict:
        """将DocxTreeMoreTitles转换为可序列化的字典"""
        return {
            'project': {
                'model': 'Project',
                'instance': str(self.project.instance.pk)
            },
            'analysis_result': {
                'result': {
                    'titles_to_detail': [
                        {
                            'ID': title['ID'],
                            'level': title['level'],
                            'occurrences': title['occurrences'],
                            'probability': title['probability'],
                            'repeat_index': title['repeat_index'],
                            'title': title['title'],
                            'user_confirm': title['user_confirm']
                        }
                        for title in self.analysis_result.result.get('titles_to_detail', [])
                    ]
                },
                'success': self.analysis_result.success,
                'error': str(self.analysis_result.error) if self.analysis_result.error else None,
                'request_index': self.analysis_result.request_index,
                'approach': self.analysis_result.approach,
                'task_id': self.analysis_result.task_id,
                'probability': self.analysis_result.probability,
                'repeat_index': self.analysis_result.repeat_index,
            },
            'user_confirm': self.user_confirm
        }

    @classmethod
    def from_model(cls, data: Dict) -> 'DocxTreeMoreTitles':
        """从字典创建DocxTreeMoreTitles实例"""
        from ..models import DocumentAnalysis
        
        # 重建 BatchResult
        analysis_result = BatchResult(
            result={
                'titles_to_detail': [
                    {
                        'ID': title['ID'],
                        'level': title['level'],
                        'occurrences': title['occurrences'],
                        'probability': title['probability'],
                        'repeat_index': title['repeat_index'],
                        'title': title['title'],
                        'user_confirm': title['user_confirm']
                    }
                    for title in data['analysis_result']['result'].get('titles_to_detail', [])
                ]
            },
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
            analysis_result=analysis_result,
            user_confirm=data.get('user_confirm', False)
        )

    @staticmethod
    def get_prompt_specification() -> str:
        return """
请按以下JSON格式输出分析结果：
{
    "titles_to_detail": [
        {
            "title": "标题内容",
            "ID": "标题ID",
            "level": "标题层级"
        }
    ]
}
"""