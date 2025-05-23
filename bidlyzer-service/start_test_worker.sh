#!/bin/bash

# 启动测试用的Celery Worker脚本
# 用于运行Celery异步测试

echo "🚀 启动FastAPI Celery测试Worker..."

# 停止现有的worker进程
echo "🛑 停止现有的worker进程..."
pkill -f "celery.*worker" 2>/dev/null || true

# 等待进程完全停止
sleep 2

# 启动新的worker，监听测试队列
echo "▶️ 启动新的worker（监听fastapi_test队列）..."
celery -A worker.celery_app worker \
    --loglevel=info \
    -n fastapi-worker@%h \
    --queues=fastapi_test \
    --detach

echo "✅ Worker启动完成！"
echo "📋 Worker名称: fastapi-worker@$(hostname)"
echo "🔍 监听队列: fastapi_test"
echo ""
echo "现在可以运行Celery测试了："
echo "  make test-celery"
echo ""
echo "要停止worker，运行："
echo "  pkill -f 'celery.*worker'" 