#!/bin/bash

# 确保脚本以root权限运行
if [ "$EUID" -ne 0 ]; then
  echo "请使用root权限运行此脚本: sudo $0"
  exit 1
fi

# 显示要启动的服务
echo "准备启动BidPilot测试服务..."

# 检查.env.prod文件是否存在
if [ ! -f ".env.prod" ]; then
  echo "错误: 未找到.env.prod文件，请先创建该文件"
  exit 1
fi

# 检查docker-compose.test.yml文件是否存在
if [ ! -f "docker-compose.test.yml" ]; then
  echo "错误: 未找到docker-compose.test.yml文件，请先创建该文件"
  exit 1
fi

# 停止之前的容器（如果有的话）
echo "停止现有容器（如果有的话）..."
docker-compose -f docker-compose.run.yml down

# 启动测试服务
echo "正在启动测试服务..."
docker-compose -f docker-compose.test.yml up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
docker-compose -f docker-compose.test.yml ps

echo "所有测试服务已启动，您可以通过以下地址访问服务:"
echo "- 网站首页: http://localhost:80"
echo "- 后端API: http://localhost:8000/api"
echo "- 后端API文档: http://localhost:8000/api/docs"

echo "BidPilot测试服务已成功启动!" 