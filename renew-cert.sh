#!/bin/bash

# 设置域名和邮箱
domains=(zzz-tech.cn www.zzz-tech.cn)
email="hui.wang1986@gmail.com"
data_path="./data/certbot"

echo "准备为 ${domains[*]} 续期 Let's Encrypt 证书..."

# 设置临时的 Nginx 配置
cat > ./docker/nginx/temp.conf << EOF
server {
    listen 80;
    server_name zzz-tech.cn www.zzz-tech.cn;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 "Let's Encrypt validation server";
    }
}
EOF

# 备份并应用临时配置
cp ./docker/nginx/default.prod.conf ./docker/nginx/default.prod.conf.backup
cp ./docker/nginx/temp.conf ./docker/nginx/default.prod.conf

# 重启 Nginx
echo "重启 Nginx 应用临时配置..."
docker-compose -f docker-compose.run.yml restart nginx
sleep 5

# 运行直接的 Docker 命令获取/续期证书
echo "续期 Let's Encrypt 证书..."
docker run --rm \
  -v "$PWD/data/certbot/conf:/etc/letsencrypt" \
  -v "$PWD/data/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d zzz-tech.cn -d www.zzz-tech.cn \
  --email $email --agree-tos --no-eff-email \
  --cert-name zzz-tech.cn \
  --force-renewal

# 检查证书
if [ -d "$data_path/conf/live/zzz-tech.cn" ]; then
  echo "✅ 证书续期成功!"
  
  # 恢复完整配置
  cp ./docker/nginx/default.prod.conf.backup ./docker/nginx/default.prod.conf
  
  # 重启 Nginx
  echo "重启 Nginx 使用新证书..."
  docker-compose -f docker-compose.run.yml restart nginx
  
  # 清理
  rm -f ./docker/nginx/temp.conf
  rm -f ./docker/nginx/default.prod.conf.backup
  
  echo "完成! 请访问 https://zzz-tech.cn 验证证书"
else
  echo "❌ 证书续期失败!"
  
  # 恢复原始配置
  cp ./docker/nginx/default.prod.conf.backup ./docker/nginx/default.prod.conf
  docker-compose -f docker-compose.run.yml restart nginx
  
  # 清理
  rm -f ./docker/nginx/temp.conf
  
  echo "已恢复原始配置"
fi