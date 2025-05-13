# start_dev_backend.sh
#!/bin/bash

set -a  # 启用自动导出环境变量     
source .env.local    #读取.env.local文件中的环境变量
set +a  # 禁用自动导出环境变量

#上面三句组合的效果： 将.env.local文件中的环境变量导入到当前shell中 

python backend/manage.py runserver 0.0.0.0:8000