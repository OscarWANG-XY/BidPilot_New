# app/core/db_helper.py
import logging
from tortoise import Tortoise
from app.core.config import settings

logger = logging.getLogger(__name__)

TORTOISE_ORM = {
    "connections": {
        "default": settings.DATABASE_URL
    },
    "apps": {
        "models": {
            "models": ["aerich.models"],
            "default_connection": "default",
        },
    },
    "use_tz": False,
    "timezone": "Asia/Shanghai"
}


async def init_db():
    """初始化数据库连接"""
    try:
        logger.info(f"正在连接到 PostgreSQL 数据库: {settings.DATABASE_URL}")
        await Tortoise.init(config=TORTOISE_ORM)
        logger.info("数据库连接成功")
    except Exception as e:
        logger.error(f"数据库连接失败: {str(e)}")
        raise


async def close_db():
    """关闭数据库连接"""
    logger.info("正在关闭数据库连接")
    await Tortoise.close_connections()
    logger.info("数据库连接已关闭")


async def generate_schemas():
    """生成数据库架构"""
    logger.info("生成数据库架构")
    await Tortoise.generate_schemas()
    logger.info("数据库架构生成完成")