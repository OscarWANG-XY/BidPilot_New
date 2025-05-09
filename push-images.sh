#!/bin/bash

# 为所有镜像添加腾讯云标签
echo "正在为本地镜像添加腾讯云标签..."

# 为后端服务添加标签
docker tag bidpilot/backend:prod ccr.ccs.tencentyun.com/bidpilot/bidpilot-backend:latest

# 为前端服务添加标签
docker tag bidpilot/frontend:prod ccr.ccs.tencentyun.com/bidpilot/bidpilot-frontend:latest

# 为Celery Worker添加标签
docker tag bidpilot/celery-worker:prod ccr.ccs.tencentyun.com/bidpilot/bidpilot-celery-worker:latest

# 为Tiptap服务添加标签
docker tag bidpilot/tiptap:prod ccr.ccs.tencentyun.com/bidpilot/bidpilot-tiptap:latest

# 为Nginx镜像添加标签
docker tag bidpilot/nginx:prod ccr.ccs.tencentyun.com/bidpilot/bidpilot-nginx:latest

# 推送所有镜像到腾讯云
echo "正在推送镜像到腾讯云..."

# 推送后端服务
docker push ccr.ccs.tencentyun.com/bidpilot/bidpilot-backend:latest

# 推送前端服务
docker push ccr.ccs.tencentyun.com/bidpilot/bidpilot-frontend:latest

# 推送Celery Worker
docker push ccr.ccs.tencentyun.com/bidpilot/bidpilot-celery-worker:latest

# 推送Tiptap服务
docker push ccr.ccs.tencentyun.com/bidpilot/bidpilot-tiptap:latest

# 推送Nginx镜像
docker push ccr.ccs.tencentyun.com/bidpilot/bidpilot-nginx:latest

echo "所有镜像已成功推送到腾讯云!" 