from apps.projects.models import Task, TaskStatus

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