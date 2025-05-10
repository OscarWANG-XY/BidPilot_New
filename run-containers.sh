#!/bin/bash

# 确保脚本以root权限运行
if [ "$EUID" -ne 0 ]; then
  echo "请使用root权限运行此脚本: sudo $0"
  exit 1
fi

# 处理命令行参数
if [ "$1" = "down" ]; then
  echo "正在停止并移除所有BidPilot服务..."
  docker-compose -f docker-compose.run.yml down
  exit 0
fi

if [ "$1" = "clean" ]; then
  echo "正在进行彻底清理..."
  
  # 停止并移除所有服务
  docker-compose -f docker-compose.run.yml down -v
  
  # 删除所有相关容器
  containers=$(docker ps -a | grep bidpilot_prod | awk '{print $1}')
  if [ ! -z "$containers" ]; then
    echo "删除残留容器..."
    docker rm -f $containers
  fi
  
  # 删除所有相关卷
  volumes=$(docker volume ls | grep bidpilot_prod | awk '{print $2}')
  if [ ! -z "$volumes" ]; then
    echo "删除残留卷..."
    docker volume rm $volumes
  fi
  
  # 删除网络
  if docker network ls | grep -q bidpilot_prod_network; then
    echo "删除网络..."
    docker network rm bidpilot_prod_network
  fi
  
  echo "清理完成!"
  exit 0
fi

# 显示要启动的服务
echo "准备启动BidPilot服务..."

# 检查.env.prod文件是否存在
if [ ! -f ".env.prod" ]; then
  echo "错误: 未找到.env.prod文件，请先创建该文件"
  exit 1
fi

# 检查docker-compose.run.yml文件是否存在
if [ ! -f "docker-compose.run.yml" ]; then
  echo "错误: 未找到docker-compose.run.yml文件，请先创建该文件"
  exit 1
fi

# 检查是否存在部分运行的容器或网络
if docker ps -a | grep -q "bidpilot_prod"; then
  echo "警告: 检测到已有BidPilot容器，建议先清理后再启动"
  echo "可以运行 'sudo ./run-containers.sh clean' 进行清理"
  
  # 询问用户是否继续
  read -p "是否继续启动服务? (y/n) " -n 1 -r
  echo    # 移动到新行
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 启动所有服务
echo "正在启动所有服务..."
docker-compose -f docker-compose.run.yml up -d

# 检查启动是否成功
if [ $? -ne 0 ]; then
  echo "启动服务失败，请检查错误信息"
  exit 1
fi

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
docker-compose -f docker-compose.run.yml ps

# 获取服务器IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com)
echo "所有服务已启动，您可以通过以下地址访问服务:"
echo "- 网站首页: http://${PUBLIC_IP}:80"
echo "- 后端API: http://${PUBLIC_IP}:8000/api"

echo "BidPilot服务已成功启动!"