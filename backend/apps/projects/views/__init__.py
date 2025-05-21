# 导入并重新导出所有视图
from .project_views import ProjectViewSet
from .bidlyzer_views import BidlyzerViewSet
from .stage_views import ProjectStageViewSet
from .task_views import TaskViewSet
from .history_views import ProjectChangeHistoryViewSet, StageChangeHistoryViewSet, TaskChangeHistoryViewSet
from .task_outline_analysis_views import test_sse

__all__ = [
    # 项目视图
    'ProjectViewSet',
    'BidlyzerViewSet',

    # 阶段视图
    'ProjectStageViewSet',

    # 任务视图
    'TaskViewSet',

    # 历史视图
    'ProjectChangeHistoryViewSet', 
    'StageChangeHistoryViewSet', 
    'TaskChangeHistoryViewSet',

    # 测试视图
    'test_sse',
] 