from apps.projects.models import Task, TaskStatus
import tiktoken
def can_process_task(task: Task, visited=None) -> bool:


    if visited is None:
        visited = set() #visited 用来避免递归死循环

    if task in visited:
        return False  # 避免循环依赖

    visited.add(task)

    # 检查所有依赖任务是否已完成 (使用了递归)
    for dep in task.dependencies.all():
        if dep.status != TaskStatus.COMPLETED:
            return False
        if not can_process_task(dep, visited):
            return False

    return True


def count_tokens(text: str) -> int:
    """计算文本的token数量"""
    encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
    return len(encoding.encode(text))