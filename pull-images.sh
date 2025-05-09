#!/bin/bash

# 从腾讯云拉取所有镜像
echo "正在从腾讯云拉取镜像..."

# 拉取后端服务镜像
docker pull ccr.ccs.tencentyun.com/bidpilot/bidpilot-backend:latest

# 拉取前端服务镜像
docker pull ccr.ccs.tencentyun.com/bidpilot/bidpilot-frontend:latest

# 拉取Celery Worker镜像
docker pull ccr.ccs.tencentyun.com/bidpilot/bidpilot-celery-worker:latest

# 拉取Tiptap服务镜像
docker pull ccr.ccs.tencentyun.com/bidpilot/bidpilot-tiptap:latest

# 拉取Nginx镜像（修正了标签，使用与推送时相同的标签）
docker pull ccr.ccs.tencentyun.com/bidpilot/bidpilot-nginx:latest

echo "所有镜像已成功拉取!"

# 显示所有已拉取的镜像
echo "已拉取的镜像列表:"
docker images | grep "ccr.ccs.tencentyun.com/bidpilot" 