#!/bin/bash

# scripts/start_celery.sh
# 启动FastAPI微服务的Celery worker

echo "🚀 启动Bidlyzer FastAPI Celery Worker..."

# 设置环境变量
export PYTHONPATH="${PYTHONPATH}:/app"

# 启动Celery worker
celery -A app.core.celery_app worker \
    --loglevel=info \
    --concurrency=4 \
    --queues=fastapi_default,fastapi_analysis,fastapi_test,fastapi_structuring \
    --hostname=bidlyzer-fastapi-worker@%h 
    #\
    # --logfile=/logs/celery_worker.log \
    # --pidfile=/logs/celery_worker.pid

echo "✅ Celery Worker 已启动" 