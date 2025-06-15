from fastapi import APIRouter, status
from app.core.celery_app import celery_app
from app.tasks.tasks import test_task, send_email_task, image_process_task, test_task_with_lock, send_email_task_with_lock
from fastapi.responses import JSONResponse
router = APIRouter()




@router.post("/tasks/")
async def create_task(message: str):
    """创建一个异步任务"""
    task = test_task.delay(message)
    return {"task_id": task.id, "status": "Task created"}

@router.post("/tasks-with-lock/")
async def create_task_with_lock(message: str):
    """创建一个带锁的异步任务"""
    task = test_task_with_lock.delay(message)
    return {"task_id": task.id, "status": "Task created"}


@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """获取任务状态"""
    task = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task.status,
        "result": task.result
    }

@router.post("/email-tasks/")
async def create_email_task(email: str, subject: str):
    """创建一个发送邮件的异步任务"""
    task = send_email_task.delay(email, subject)
    return {"task_id": task.id, "status": "Email task created"}

@router.post("/email-tasks-with-lock/")
async def create_email_task_with_lock(email: str, subject: str):
    """创建一个带锁的异步任务"""
    task = send_email_task_with_lock.delay(email, subject)
    return {"task_id": task.id, "status": "Email task created"}

@router.post("/image-tasks/")
async def create_image_task(image_name: str, operation: str):
    """创建一个图片处理的异步任务"""
    task = image_process_task.delay(image_name, operation)
    return {"task_id": task.id, "status": "Image task created", "queue": "high_priority"}


@router.get("/queues/status")
async def get_queue_status():
    """获取所有队列的状态"""
    inspect = celery_app.control.inspect()
    
    # 获取活跃任务
    active_tasks = inspect.active()
    
    # 获取队列长度（需要Redis连接）
    with celery_app.connection() as conn:
        queue_lengths = {}
        for queue_name in ['default', 'email', 'high_priority']:
            try:
                queue_length = conn.default_channel.client.llen(queue_name)
                queue_lengths[queue_name] = queue_length
            except:
                queue_lengths[queue_name] = 0
    
    return {
        "active_tasks": active_tasks,
        "queue_lengths": queue_lengths,
        "registered_tasks": list(celery_app.tasks.keys())
    }


@router.get("/test-none")
async def test_none():
    data = {"content": None}
    return data  # 看看前端收到什么

@router.get("/test-none-fixed") 
async def test_none_fixed():
    data = {"content": None}
    return JSONResponse(content=data)  # 这个可能是正确的