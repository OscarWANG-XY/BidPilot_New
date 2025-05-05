FROM node:20-alpine

# 创建非root用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 设置工作目录
WORKDIR /app

# 复制package.json
COPY tiptap-service/package.json ./

# 这一行可能不需要，除非您确实有.npmrc文件用于tiptap pro扩展
# COPY tiptap-service/.npmrc ./

# 安装依赖
RUN npm install

# 复制源代码
COPY tiptap-service/ ./

# 切换到非root用户
USER appuser

# 暴露服务端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3001/health || exit 1

# 启动命令
CMD ["npm", "start"]