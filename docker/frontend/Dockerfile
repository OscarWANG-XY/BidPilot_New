FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm@10.6.5

# 复制package.json和pnpm-lock.yaml
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# 复制.npmrc以处理tiptap pro扩展
COPY frontend/.npmrc ./

# 安装依赖
RUN pnpm install

# 复制前端源代码
COPY frontend/ ./

# 暴露端口
EXPOSE 5173

# 启动开发服务器
CMD ["pnpm", "start"]