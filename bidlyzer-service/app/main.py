# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.redis_helper import RedisClient
from app.core.db_helper import init_db, close_db, generate_schemas
from tortoise import Tortoise
from app.auth.middleware import JWTAuthMiddleware
from app.api.router import api_router
from fastapi.responses import JSONResponse



# 官方推荐使用lifespan参数来管理应用程序的生命周期，包括启动和关闭事件。 on_event方式 已弃用
@asynccontextmanager 
async def lifespan(app: FastAPI):
    # Startup  出现异常，fastapi会自动处理，不会启动
    await RedisClient.get_client()
    print("Redis客户端连接成功, 连接地址为：", settings.REDIS_URL)
    await init_db()
    print("PostgreSQL 数据库连接成功, 连接地址为：", settings.DATABASE_URL)


    # 添加实际查询来验证连接
    try:
        conn = Tortoise.get_connection("default")
        result = await conn.execute_query("SELECT 1")
        print("PostgreSQL真实连接成功，查询结果:", result)
    except Exception as e:
        print("PostgreSQL实际查询失败:", str(e))

    # 如果需要自动生成数据库架构，取消下面这行的注释
    # await generate_schemas()

    yield
    # Shutdown  即便异常也执行
    await RedisClient.close()
    print("Redis客户端连接关闭")
    await close_db()
    print("PostgreSQL 数据库连接关闭")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加JWT认证中间件
app.add_middleware(JWTAuthMiddleware)

# 添加路由
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    """测试根路由"""
    return {"message": "Welcome to Bidlyzer Service"}

@app.get("/ping_redis")
async def ping_redis():
    """测试Redis连接"""
    redis = await RedisClient.get_client()
    await redis.set("ping", "pong")
    result = await redis.get("ping")
    return {"redis_ping": result}

@app.get("/ping_db")
async def ping_db():
    """测试PostgreSQL连接"""
    try:
        conn = Tortoise.get_connection("default")
        
        # 首先测试最基本的连接
        basic_result = await conn.execute_query("SELECT 1 as connection_test")
        print("PostgreSQL基础连接测试结果:", basic_result)
        
        # 然后获取版本信息
        result = await conn.execute_query("SELECT version() as version")
        # 查看执行结果的结构
        print("版本查询结果结构:", result)
        # 然后根据实际结构安全地提取版本信息
        version = result[1][0].get("version") if result and len(result) > 1 and result[1] else "未知版本"
        
        return {
            "status": "success",
            "message": "PostgreSQL连接成功",
            "version": version,
            "connection_test": "成功"
        }
    except Exception as e:
        print(f"PostgreSQL连接测试失败: {str(e)}")
        return {
            "status": "error",
            "message": f"PostgreSQL连接失败: {str(e)}"
        }

@app.get("/test-none")
async def test_none():
    data = {"content": None}
    return data  # 看看前端收到什么

@app.get("/test-none-fixed") 
async def test_none_fixed():
    data = {"content": None}
    return JSONResponse(content=data)  # 这个可能是正确的


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.API_PORT, reload=True)
    # 可直接运行：python -m app.main
    # 不推荐在notebook中运行,会阻塞当前 Notebook 内核（需要手动停止或重启内核才能退出）