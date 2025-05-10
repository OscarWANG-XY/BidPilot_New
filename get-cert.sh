#!/bin/bash

# 1. 清理旧的证书文件
echo "清理旧的证书文件..."
rm -rf ./data/certbot/conf/live/zzz-tech.cn
rm -rf ./data/certbot/conf/archive/zzz-tech.cn
rm -rf ./data/certbot/conf/renewal/zzz-tech.cn.conf

# 2. 设置临时的 Nginx 配置，专门用于 ACME 挑战
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

# 3. 应用临时配置并重启 Nginx
cp ./docker/nginx/temp.conf ./docker/nginx/default.prod.conf
echo "重启 Nginx 容器..."
docker-compose -f docker-compose.run.yml restart nginx

# 4. 等待 Nginx 启动
echo "等待 Nginx 启动..."
sleep 10

# 5. 确认 Nginx 运行状态
docker ps | grep nginx
curl -I http://zzz-tech.cn || echo "无法访问网站"

# 6. 运行 certbot 获取证书
echo "获取 Let's Encrypt 证书..."
docker-compose -f docker-compose.run.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email hui.wang1986@gmail.com --agree-tos --no-eff-email \
  --cert-name zzz-tech.cn \
  -d zzz-tech.cn -d www.zzz-tech.cn

# 7. 检查证书是否获取成功
echo "检查证书文件..."
ls -la ./data/certbot/conf/live/zzz-tech.cn/ || echo "未找到证书文件"

# 8. 应用完整的 Nginx 配置
echo "恢复 Nginx 完整配置..."
cat > ./docker/nginx/default.prod.conf << 'EOF'
server {
    listen 80;
    server_name zzz-tech.cn www.zzz-tech.cn;

    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # 将 HTTP 请求重定向到 HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name zzz-tech.cn www.zzz-tech.cn;
    
    # 使用 Let's Encrypt 证书
    ssl_certificate /etc/letsencrypt/live/zzz-tech.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zzz-tech.cn/privkey.pem;

    # SSL 优化
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
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Tiptap服务代理
    location /tiptap-service/ {
        proxy_pass http://tiptap:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
        try_files $uri $uri/ /index.html;
        
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

# 9. 重启 Nginx 使用新证书
echo "重启 Nginx 应用证书配置..."
docker-compose -f docker-compose.run.yml restart nginx

echo "完成！请尝试访问 https://zzz-tech.cn" 