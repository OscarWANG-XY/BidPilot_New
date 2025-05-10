#!/bin/bash

# 设置域名和邮箱
domains=(zzz-tech.cn www.zzz-tech.cn)
email="hui.wang1986@gmail.com"  # 更改为您的邮箱
data_path="./data/certbot"

echo "正在为 ${domains[*]} 设置 Let's Encrypt 证书..."

# 创建必要的目录
mkdir -p "$data_path/conf"
mkdir -p "$data_path/www"

# 删除任何旧的临时文件
rm -rf "$data_path/conf/live/zzz-tech.cn" 2>/dev/null
rm -rf "$data_path/conf/archive/zzz-tech.cn" 2>/dev/null
rm -rf "$data_path/conf/renewal/zzz-tech.cn.conf" 2>/dev/null

# 创建临时的简单Nginx配置，只用于获取证书
cat > ./docker/nginx/temp.conf << EOF
server {
    listen 80;
    server_name zzz-tech.cn www.zzz-tech.cn;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 "Certbot challenge server";
    }
}
EOF

# 备份原始配置
cp ./docker/nginx/default.prod.conf ./docker/nginx/default.prod.conf.backup 2>/dev/null || :

# 使用临时配置
cp ./docker/nginx/temp.conf ./docker/nginx/default.prod.conf

echo "重启Nginx容器使用临时配置..."
docker-compose -f docker-compose.run.yml restart nginx

echo "等待Nginx启动..."
sleep 10

echo "运行certbot申请新证书..."
docker-compose -f docker-compose.run.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email $email --agree-tos --no-eff-email \
  --cert-name zzz-tech.cn \
  -d zzz-tech.cn -d www.zzz-tech.cn \
  --rsa-key-size 4096

# 检查证书是否获取成功
echo "检查证书状态..."
ls -la "$data_path/conf/live/" || echo "证书目录不存在"

# 恢复完整配置
echo "更新Nginx配置使用真实证书..."
cat > ./docker/nginx/default.prod.conf << EOF
server {
    listen 80;
    server_name zzz-tech.cn www.zzz-tech.cn;

    # 添加Let's Encrypt验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # 将HTTP请求重定向到HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name zzz-tech.cn www.zzz-tech.cn;
    
    # 使用Let's Encrypt证书
    ssl_certificate /etc/letsencrypt/live/zzz-tech.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zzz-tech.cn/privkey.pem;

    # SSL优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    
    # 安全头
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 增加缓冲区配置
    client_max_body_size 100M;
    client_body_buffer_size 128k;
    proxy_connect_timeout 90;
    proxy_send_timeout 90;
    proxy_read_timeout 90;
    proxy_buffer_size 4k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;
    proxy_temp_file_write_size 64k;

    # API请求代理到后端
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Tiptap服务代理
    location /tiptap-service/ {
        proxy_pass http://tiptap:3001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 后端静态文件
    location /static/ {
        alias /app/static/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # 后端媒体文件
    location /media/ {
        alias /app/media/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files \$uri \$uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, max-age=2592000";
        }
    }

    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    # 日志配置
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
EOF

# 重启Nginx以应用完整配置
echo "重启Nginx使用新证书..."
docker-compose -f docker-compose.run.yml restart nginx

echo "完成！请使用浏览器访问 https://zzz-tech.cn 测试HTTPS是否工作"