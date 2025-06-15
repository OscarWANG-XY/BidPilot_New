from fastapi import APIRouter, status
from app.core.celery_app import celery_app
from app.tasks.tasks import test_task, send_email_task
from fastapi.responses import JSONResponse
router = APIRouter()




@router.post("/tasks/")
async def create_task(message: str):
    """创建一个异步任务"""
    task = test_task.delay(message)
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

@router.get("/test-none")
async def test_none():
    data = {"content": None}
    return data  # 看看前端收到什么

@router.get("/test-none-fixed") 
async def test_none_fixed():
    data = {"content": None}
    return JSONResponse(content=data)  # 这个可能是正确的