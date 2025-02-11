from pathlib import Path
from typing import Union
import logging
from dataclasses import dataclass

# 配置日志
def setup_logger(name: str, level: str = 'DEBUG') -> logging.Logger:
    """设置日志记录器"""
    logger = logging.getLogger(name)
    
    # 设置日志级别
    level_map = {
        'DEBUG': logging.DEBUG,
        'INFO': logging.INFO,
        'WARNING': logging.WARNING,
        'ERROR': logging.ERROR,
        'CRITICAL': logging.CRITICAL
    }
    logger.setLevel(level_map.get(level, logging.INFO))
    
    # 如果没有处理器，添加一个
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

# 通用异常类
class DocxParserError(Exception):
    """Base exception for docx parser"""
    pass

@dataclass
class DocxContent:
    """文档内容数据类"""
    document: str
    styles: str = None
    numbering: str = None