#!/bin/bash
set -e

# 以下脚本由于在docker-compose.prod.yml中已经添加了健康检查service_healthyservice_healthy，可以不要了， 
# 等待数据库准备好
# echo "等待数据库..."
# while ! nc -z db 5432; do
#   sleep 0.5
# done
# echo "数据库已就绪！"

# 应用数据库迁移
echo "应用数据库迁移..."
python manage.py migrate

# 收集静态文件， 这步也在docker-compose.prod.yml中已经添加了，有RUN python manage.py collectstatic --noinput
# echo "收集静态文件..."
# python manage.py collectstatic --noinput

# 执行传入的命令
exec "$@" 