# app/core/config.py
import os 
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    
    # 基础配置
    API_V1_STR: str = "/api/v1"  # API 的版本前缀，默认值为 "/api/v1"
    PROJECT_NAME: str = "Bidlyzer-Service"   # 项目名称
    

    #路径配置（显示定义）
    PROJECT_ROOT: Path = Field(
        default=Path(__file__).resolve().parent.parent.parent,  # 基于app/core/config.py 路径的推导
        description="项目根目录（自动推导为config.py所在位置的上级的上级的上级目录）"
    )

    # 根据需要配置 (日志文件 LOG_DIR,数据文件 DATA_DIR,配置文件 CONFIG_DIR等)
    DATA_DIR: Path = Field(
        default=Path(__file__).resolve().parent.parent.parent / "data",
        description="数据存储目录，默认在项目根目录下的data文件夹"
    )


    # PostgreSQL 数据库配置
    POSTGRES_USER: str = Field(default="postgres", description="PostgreSQL 用户名")
    POSTGRES_PASSWORD: str = Field(default="123456", description="PostgreSQL 密码")
    POSTGRES_HOST: str = Field(default="localhost", description="PostgreSQL 主机地址")
    POSTGRES_PORT: int = Field(default=5432, description="PostgreSQL 端口")
    POSTGRES_DB: str = Field(default="bidlyzer", description="PostgreSQL 数据库名")
    DATABASE_URL: str = ""

    # Redis配置
    # 虽然redis的值在.env文件中配置了，但这里需要有定义，pypandic加载env时，自会加载已被定义的变量。
    # 同时，这里的定义为pydantic提供了更多的验证逻辑。 这里也可不用Field, 直接写： REDIS_HOST: str = "localhost"
    REDIS_HOST: str = Field(default="localhost", description="Redis服务器地址")  # 使用localhost而不是127.0.0.1
    REDIS_PORT: int = Field(default=6379, description="Redis服务器端口")
    REDIS_DB: int = Field(default=0, description="Redis数据库索引")
    REDIS_PASSWORD: str = Field(default="123456", description="Redis密码，如果有的话")
    REDIS_URL: str = ""


    # 缓存配置 for cache_manager.py
    STRUCTURING_CACHE_TIMEOUT: int = Field(default=900, description="缓存超时时间（秒）")

    # ----------------------------- Tiptap Service Configuration -----------------------------
    TIPTAP_SERVICE_URL: str = 'http://tiptap:3001'  # 使用 Docker 服务名称
    TIPTAP_SERVICE_TIMEOUT: int = 30  # seconds


    # Pydantic 的特殊配置类, 这里配置了环境变量文件的加载方式
    class Config:
        env_file = str(Path(__file__).resolve().parent.parent.parent / ".env")   #指定从.env文件加载环境变量
        env_file_encoding = "utf-8"  # 指定环境变量文件的编码
        case_sensitive = True # 环境变量名区分大小写

    # 以下初始化会在构建实例的时候运行
    def __init__(self, **data):
            """
            初始化方法，在所有配置加载完成后被调用
            利用这个方法可以基于其他配置项计算出派生的配置值
            """
            # 先调用父类的初始化方法，确保所有配置项（包括从环境变量加载的）都已设置
            super().__init__(**data)
            
            
            # 使用已加载的配置值构建Redis URL
            password_part = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
            self.REDIS_URL = f"redis://{password_part}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

            # 构建 PostgreSQL 数据库 URL
            self.DATABASE_URL = f"postgres://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()    # 创建Settings实例