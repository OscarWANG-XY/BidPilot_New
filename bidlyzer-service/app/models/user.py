from pydantic import BaseModel
from typing import List, Optional


class User(BaseModel):
    """用户模型，用于序列化从JWT payload中提取的用户信息"""
    id: str  # 使用字符串类型 以接受UUID字符串
    username: str
    email: Optional[str] = None
    is_staff: bool = False
    is_superuser: bool = False
    permissions: List[str] = []
    
    @classmethod
    def from_jwt_payload(cls, payload: dict) -> "User":
        """从JWT payload创建用户实例"""
        return cls(
            id=payload.get("user_id"),
            username=payload.get("username", ""),
            email=payload.get("email"),
            is_staff=payload.get("is_staff", False),
            is_superuser=payload.get("is_superuser", False),
            permissions=payload.get("permissions", [])
        )