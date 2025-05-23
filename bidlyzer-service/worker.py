#!/usr/bin/env python3
# worker.py
"""
Celery Worker启动文件

使用方法：
1. 启动默认队列worker (建议使用唯一的worker名称):
   celery -A worker.celery_app worker --loglevel=info -n fastapi-worker@%h

2. 启动指定队列worker:
   celery -A worker.celery_app worker --queues=fastapi_test,fastapi_analysis --loglevel=info -n fastapi-worker@%h

3. 启动多个worker:
   celery -A worker.celery_app worker --concurrency=4 --loglevel=info -n fastapi-worker@%h

4. 启动beat调度器（定时任务）:
   celery -A worker.celery_app beat --loglevel=info

5. 同时启动worker和beat:
   celery -A worker.celery_app worker --beat --loglevel=info -n fastapi-worker@%h

6. 启动监控工具:
   celery -A worker.celery_app flower

注意：-n fastapi-worker@%h 参数确保与Django Celery worker使用不同的名称
"""

from app.core.celery_app import celery_app

if __name__ == '__main__':
    celery_app.start()  